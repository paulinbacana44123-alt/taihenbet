-- TaihenBet 2.0.1 — BALANCEAMENTO "BANCA CRUEL"
-- Execute no SQL Editor do Supabase depois de aplicar as fases já existentes.
--
-- Objetivos:
--   1) remover o teto artificial de 10.000.000 TaiCoins;
--   2) preservar saldo >= 0, ledger, locks e demais validações da Fase 3.9;
--   3) tornar Taigrinho, TaiMandioca, Crash e Derby muito mais difíceis;
--   4) manter RNG autoritativo no servidor e probabilidades iguais para todos;
--   5) manter sessões antigas de TaiMandioca compatíveis até serem encerradas.
--
-- Não há dinheiro real. TaiCoins continuam sendo moeda fictícia do projeto.

begin;

-- ========================================================================
-- 1. CARTEIRA SEM TETO ARTIFICIAL
-- ========================================================================
-- numeric sem precisão declarada evita o antigo teto estrutural numeric(14,2).
-- As funções da banca continuam arredondando movimentações para 2 casas.

alter table if exists public.profiles
  alter column balance type numeric using balance::numeric;

alter table if exists public.wallet_transactions
  alter column amount type numeric using amount::numeric,
  alter column balance_after type numeric using balance_after::numeric;

alter table if exists public.game_rounds
  alter column stake type numeric using stake::numeric,
  alter column payout type numeric using payout::numeric,
  alter column balance_after_stake type numeric using balance_after_stake::numeric,
  alter column balance_after type numeric using balance_after::numeric;

alter table if exists public.taimandioca_sessions
  alter column stake type numeric using stake::numeric,
  alter column payout type numeric using payout::numeric,
  alter column balance_after_stake type numeric using balance_after_stake::numeric,
  alter column balance_after type numeric using balance_after::numeric;

alter table if exists public.crash_regime_sessions
  alter column stake type numeric using stake::numeric,
  alter column payout type numeric using payout::numeric,
  alter column balance_after_stake type numeric using balance_after_stake::numeric,
  alter column balance_after type numeric using balance_after::numeric;

alter table if exists public.derby_sessions
  alter column stake type numeric using stake::numeric,
  alter column payout type numeric using payout::numeric,
  alter column balance_after_stake type numeric using balance_after_stake::numeric,
  alter column balance_after type numeric using balance_after::numeric;

alter table if exists public.sports_bets
  alter column stake type numeric using stake::numeric,
  alter column potential_payout type numeric using potential_payout::numeric,
  alter column payout type numeric using payout::numeric;

-- Mantém o endurecimento da Fase 3.9, mas remove:
--   * mutation cap de 10.000.000;
--   * resulting balance cap de 10.000.000.
-- Também bloqueia NaN/Infinity para que numeric ilimitado não aceite valores especiais.
create or replace function public._wallet_apply(
  p_user_id uuid,
  p_amount numeric,
  p_kind text,
  p_external_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles;
  result public.profiles;
  safe_amount numeric;
  next_balance numeric;
  safe_kind text := lower(trim(coalesce(p_kind, '')));
  safe_external_id text := nullif(trim(coalesce(p_external_id, '')), '');
  safe_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if p_user_id is null then
    raise exception 'Wallet user required';
  end if;

  safe_amount := round(coalesce(p_amount, 0), 2);

  if lower(safe_amount::text) in ('nan', 'infinity', '-infinity') then
    raise exception 'Invalid wallet amount';
  end if;

  if safe_amount = 0 then
    raise exception 'Zero-value wallet mutation';
  end if;

  if safe_kind not in (
    'sports_stake',
    'game_stake',
    'game_payout',
    'sports_payout',
    'ad_reward',
    'daily_bonus',
    'admin_adjustment'
  ) then
    raise exception 'Invalid wallet operation kind';
  end if;

  if safe_external_id is null or char_length(safe_external_id) > 160 then
    raise exception 'Invalid external id';
  end if;

  if jsonb_typeof(safe_metadata) <> 'object' then
    raise exception 'Wallet metadata must be an object';
  end if;

  if octet_length(safe_metadata::text) > 16384 then
    raise exception 'Wallet metadata too large';
  end if;

  select * into current_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if not current_profile.legacy_balance_imported then
    raise exception 'Resolve legacy balance first';
  end if;

  if lower(current_profile.balance::text) in ('nan', 'infinity', '-infinity') then
    raise exception 'Invalid current wallet balance';
  end if;

  next_balance := round(current_profile.balance + safe_amount, 2);

  if lower(next_balance::text) in ('nan', 'infinity', '-infinity') then
    raise exception 'Invalid resulting wallet balance';
  end if;

  if next_balance < 0 then
    raise exception 'Insufficient TaiCoins';
  end if;

  update public.profiles
  set balance = next_balance
  where id = p_user_id
  returning * into result;

  insert into public.wallet_transactions (
    user_id,
    amount,
    balance_after,
    kind,
    external_id,
    metadata
  ) values (
    p_user_id,
    safe_amount,
    next_balance,
    safe_kind,
    safe_external_id,
    safe_metadata
  );

  return result;
end;
$$;

revoke all on function public._wallet_apply(uuid, numeric, text, text, jsonb)
from public;

-- O painel administrativo também deixa de impor o antigo teto de +/-1.000.000
-- por ajuste. Continua exigindo role=admin e continua auditando no ledger.
create or replace function public.admin_adjust_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_note text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  safe_note text := left(trim(coalesce(p_note, '')), 4000);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role <> 'admin' then
    raise exception 'Admin required';
  end if;

  return public._wallet_apply(
    p_user_id,
    p_amount,
    'admin_adjustment',
    gen_random_uuid()::text,
    jsonb_build_object(
      'admin_id', auth.uid(),
      'note', safe_note,
      'source', 'admin_wallet_2_0_1'
    )
  );
end;
$$;

revoke all on function public.admin_adjust_wallet(uuid, numeric, text) from public;
grant execute on function public.admin_adjust_wallet(uuid, numeric, text) to authenticated;

-- ========================================================================
-- 2. TAIGRINHO — A IMPRESSORA DE DINHEIRO FOI APREENDIDA
-- ========================================================================
-- Antes, a geração autoritativa forçava vitória em ~24,5% dos giros e o
-- desenho matemático podia passar de 100% de retorno médio. Agora:
--   * mega de 5 Tais forçado: 0,05% (1 em 2.000);
--   * vitória normal forçada: 14,00%;
--   * restante: grade sem payout;
--   * Tai fica ainda mais raro;
--   * pagamentos são reduzidos.

create or replace function public._taigrinho_random_symbol()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  roll integer;
begin
  -- Pesos 2.0.1: 1 / 4 / 9 / 14 / 20 / 28 (total 76).
  roll := public._taigrinho_random_int(76);

  if roll < 1 then
    return 'tai';
  elsif roll < 5 then
    return 'mandioca';
  elsif roll < 14 then
    return 'sapo-minecraft';
  elsif roll < 28 then
    return 'neymar';
  elsif roll < 48 then
    return 'r-quiabo';
  end if;

  return 'tai-infernal';
end;
$$;

create or replace function public._taigrinho_evaluate(p_grid text[])
returns jsonb
language plpgsql
immutable
security definer
set search_path = public
as $$
declare
  line_index integer;
  sql_rows integer[];
  client_rows integer[];
  line_id text;
  line_name text;
  ids text[];
  first_id text;
  symbol_name text;
  same_count integer;
  reel integer;
  line_multiplier numeric;
  multiplier_total numeric := 0;
  winning_lines jsonb := '[]'::jsonb;
  has_five_tais boolean := false;
begin
  if p_grid is null then
    raise exception 'Taigrinho grid is required';
  end if;

  for line_index in 1..5 loop
    case line_index
      when 1 then
        line_id := 'meio';
        line_name := 'Linha central';
        sql_rows := array[2,2,2,2,2];
        client_rows := array[1,1,1,1,1];
      when 2 then
        line_id := 'topo';
        line_name := 'Linha superior';
        sql_rows := array[1,1,1,1,1];
        client_rows := array[0,0,0,0,0];
      when 3 then
        line_id := 'baixo';
        line_name := 'Linha inferior';
        sql_rows := array[3,3,3,3,3];
        client_rows := array[2,2,2,2,2];
      when 4 then
        line_id := 'v';
        line_name := 'Linha em V';
        sql_rows := array[1,2,3,2,1];
        client_rows := array[0,1,2,1,0];
      else
        line_id := 'v-invertido';
        line_name := 'Linha em V invertido';
        sql_rows := array[3,2,1,2,3];
        client_rows := array[2,1,0,1,2];
    end case;

    ids := array[
      p_grid[1][sql_rows[1]],
      p_grid[2][sql_rows[2]],
      p_grid[3][sql_rows[3]],
      p_grid[4][sql_rows[4]],
      p_grid[5][sql_rows[5]]
    ];

    first_id := ids[1];
    same_count := 1;

    for reel in 2..5 loop
      exit when ids[reel] is distinct from first_id;
      same_count := same_count + 1;
    end loop;

    if same_count < 3 then
      continue;
    end if;

    line_multiplier := 0;
    symbol_name := first_id;

    case first_id
      when 'tai' then
        symbol_name := 'Tai';
        line_multiplier := case same_count when 3 then 5 when 4 then 10 when 5 then 25 else 0 end;
      when 'mandioca' then
        symbol_name := 'TaiMandioca';
        line_multiplier := case same_count when 3 then 3.5 when 4 then 7 when 5 then 14 else 0 end;
      when 'sapo-minecraft' then
        symbol_name := 'Sapo do Minecraft';
        line_multiplier := case same_count when 3 then 2.5 when 4 then 5 when 5 then 9 else 0 end;
      when 'neymar' then
        symbol_name := 'Neymar do Brasil';
        line_multiplier := case same_count when 3 then 2 when 4 then 4 when 5 then 7 else 0 end;
      when 'r-quiabo' then
        symbol_name := 'R Quiabo';
        line_multiplier := case same_count when 3 then 1.75 when 4 then 3.5 when 5 then 6 else 0 end;
      when 'tai-infernal' then
        symbol_name := 'Tai Infernal';
        line_multiplier := case same_count when 3 then 1.3 when 4 then 2.5 when 5 then 4 else 0 end;
      else
        line_multiplier := 0;
    end case;

    if line_multiplier <= 0 then
      continue;
    end if;

    multiplier_total := multiplier_total + line_multiplier;

    if first_id = 'tai' and same_count = 5 then
      has_five_tais := true;
    end if;

    winning_lines := winning_lines || jsonb_build_array(
      jsonb_build_object(
        'id', line_id,
        'nome', line_name,
        'linhas', to_jsonb(client_rows),
        'simboloId', first_id,
        'simboloNome', symbol_name,
        'quantidade', same_count,
        'multiplicador', line_multiplier
      )
    );
  end loop;

  return jsonb_build_object(
    'multiplicadorTotal', multiplier_total,
    'linhasVencedoras', winning_lines,
    'megaGanho', has_five_tais or multiplier_total >= 15
  );
end;
$$;

create or replace function public._taigrinho_generate_grid()
returns text[]
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  grid text[];
  roll integer;
  line_index integer;
  sql_rows integer[];
  symbol_options text[] := array[
    'mandioca',
    'sapo-minecraft',
    'neymar',
    'r-quiabo',
    'tai-infernal'
  ];
  chosen_symbol text;
  different_symbol text;
  same_count integer;
  reel integer;
  attempt integer;
  evaluation jsonb;
begin
  roll := public._taigrinho_random_int(10000);

  -- 0,05%: força uma linha com 5 Tais (1 em 2.000 giros).
  if roll < 5 then
    grid := public._taigrinho_random_grid();
    line_index := public._taigrinho_random_int(5) + 1;

    case line_index
      when 1 then sql_rows := array[2,2,2,2,2];
      when 2 then sql_rows := array[1,1,1,1,1];
      when 3 then sql_rows := array[3,3,3,3,3];
      when 4 then sql_rows := array[1,2,3,2,1];
      else sql_rows := array[3,2,1,2,3];
    end case;

    for reel in 1..5 loop
      grid[reel][sql_rows[reel]] := 'tai';
    end loop;

    return grid;
  end if;

  -- Próximos 14,00%: vitória normal. 90% são trincas e 10% quadras.
  if roll < 1405 then
    grid := public._taigrinho_random_grid();
    line_index := public._taigrinho_random_int(5) + 1;

    case line_index
      when 1 then sql_rows := array[2,2,2,2,2];
      when 2 then sql_rows := array[1,1,1,1,1];
      when 3 then sql_rows := array[3,3,3,3,3];
      when 4 then sql_rows := array[1,2,3,2,1];
      else sql_rows := array[3,2,1,2,3];
    end case;

    chosen_symbol := symbol_options[
      public._taigrinho_random_int(array_length(symbol_options, 1)) + 1
    ];
    same_count := case
      when public._taigrinho_random_int(100) < 90 then 3
      else 4
    end;

    for reel in 1..same_count loop
      grid[reel][sql_rows[reel]] := chosen_symbol;
    end loop;

    loop
      different_symbol := symbol_options[
        public._taigrinho_random_int(array_length(symbol_options, 1)) + 1
      ];
      exit when different_symbol is distinct from chosen_symbol;
    end loop;

    grid[same_count + 1][sql_rows[same_count + 1]] := different_symbol;
    return grid;
  end if;

  -- 85,95%: o servidor procura explicitamente uma grade sem payout.
  for attempt in 1..100 loop
    grid := public._taigrinho_random_grid();
    evaluation := public._taigrinho_evaluate(grid);

    if coalesce((evaluation ->> 'multiplicadorTotal')::numeric, 0) = 0 then
      return grid;
    end if;
  end loop;

  -- Fallback determinístico sem linha vencedora.
  return array[
    array['tai', 'mandioca', 'sapo-minecraft'],
    array['neymar', 'r-quiabo', 'tai-infernal'],
    array['mandioca', 'sapo-minecraft', 'neymar'],
    array['r-quiabo', 'tai-infernal', 'tai'],
    array['sapo-minecraft', 'neymar', 'r-quiabo']
  ];
end;
$$;

revoke all on function public._taigrinho_random_symbol() from public;
revoke all on function public._taigrinho_evaluate(text[]) from public;
revoke all on function public._taigrinho_generate_grid() from public;

-- ========================================================================
-- 3. TAIMANDIOCA — AGORA A ROÇA É UM CAMPO MINADO DE VERDADE
-- ========================================================================
-- Novas partidas só aceitam 8/11/14/17 armadilhas.
-- Valores 3/5/7/10 continuam aceitos pelos helpers e pela constraint para
-- que uma sessão antiga que estava aberta antes do update consiga terminar.

alter table if exists public.taimandioca_sessions
  drop constraint if exists taimandioca_hazard_count;

alter table if exists public.taimandioca_sessions
  add constraint taimandioca_hazard_count
  check (hazard_count in (3, 5, 7, 8, 10, 11, 14, 17));

create or replace function public._taimandioca_multiplier(
  p_hazards integer,
  p_revealed integer
)
returns numeric
language plpgsql
immutable
security definer
set search_path = public
as $$
declare
  multiplier_value numeric := 1;
  step_index integer;
  remaining_cells numeric;
  risk_factor numeric;
begin
  if coalesce(p_revealed, 0) <= 0 then
    return 1;
  end if;

  if p_hazards not in (3, 5, 7, 8, 10, 11, 14, 17) then
    raise exception 'Invalid TaiMandioca hazard count';
  end if;

  if p_revealed > (25 - p_hazards) then
    raise exception 'Invalid TaiMandioca reveal count';
  end if;

  for step_index in 0..(p_revealed - 1) loop
    remaining_cells := 25 - step_index;
    risk_factor := 1 + (p_hazards::numeric / remaining_cells) * 0.62;
    multiplier_value := multiplier_value * risk_factor;
  end loop;

  return least(250::numeric, multiplier_value);
end;
$$;

create or replace function public._taimandioca_generate_hazards(
  p_hazards integer
)
returns integer[]
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  result integer[] := '{}'::integer[];
  candidate integer;
begin
  if p_hazards not in (3, 5, 7, 8, 10, 11, 14, 17) then
    raise exception 'Invalid TaiMandioca hazard count';
  end if;

  while cardinality(result) < p_hazards loop
    candidate := floor(random() * 25)::integer;

    if not (candidate = any(result)) then
      result := array_append(result, candidate);
    end if;
  end loop;

  return result;
end;
$$;

create or replace function public.start_taimandioca(
  p_stake numeric,
  p_hazards integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  stake_value numeric;
  existing_session public.taimandioca_sessions;
  new_session public.taimandioca_sessions;
  profile_after_stake public.profiles;
  round_id uuid := gen_random_uuid();
  secret_hazards integer[];
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  stake_value := round(coalesce(p_stake, 0), 2);

  if lower(stake_value::text) in ('nan', 'infinity', '-infinity') then
    raise exception 'Invalid TaiMandioca stake';
  end if;

  if stake_value < 10 or stake_value > 100000 then
    raise exception 'Invalid TaiMandioca stake';
  end if;

  if p_hazards not in (8, 11, 14, 17) then
    raise exception 'Invalid TaiMandioca hazard count';
  end if;

  -- Se já havia uma colheita ativa antes do update, apenas restaura a mesma.
  select * into existing_session
  from public.taimandioca_sessions
  where user_id = auth.uid()
    and status = 'active'
  order by created_at desc
  limit 1
  for update;

  if found then
    select * into profile_after_stake
    from public.profiles
    where id = auth.uid();

    return public._taimandioca_public_state(
      existing_session,
      profile_after_stake,
      'resume'
    );
  end if;

  secret_hazards := public._taimandioca_generate_hazards(p_hazards);

  select * into profile_after_stake
  from public._wallet_apply(
    auth.uid(),
    -stake_value,
    'game_stake',
    round_id::text,
    jsonb_build_object(
      'game', 'TaiMandioca',
      'authoritative', true,
      'phase', '2.0.1',
      'hazards', p_hazards,
      'balance_profile', 'banca_cruel'
    )
  );

  insert into public.taimandioca_sessions (
    id,
    user_id,
    stake,
    hazard_count,
    hazard_indices,
    revealed_indices,
    status,
    payout,
    multiplier,
    balance_after_stake,
    balance_after
  ) values (
    round_id,
    auth.uid(),
    stake_value,
    p_hazards,
    secret_hazards,
    '{}'::integer[],
    'active',
    0,
    1,
    profile_after_stake.balance,
    profile_after_stake.balance
  )
  returning * into new_session;

  return public._taimandioca_public_state(
    new_session,
    profile_after_stake,
    'started'
  );
end;
$$;

revoke all on function public._taimandioca_multiplier(integer, integer) from public;
revoke all on function public._taimandioca_generate_hazards(integer) from public;
revoke all on function public.start_taimandioca(numeric, integer) from public;
grant execute on function public.start_taimandioca(numeric, integer) to authenticated;

-- ========================================================================
-- 4. CRASH REGIME — A CURVA AGORA TEM ÓDIO NO CORAÇÃO
-- ========================================================================
-- Distribuição nova:
--   45,0% -> 1.05–1.10x
--   35,0% -> 1.10–1.35x
--   14,0% -> 1.35–2.20x
--    4,5% -> 2.20–5.00x
--    1,3% -> 5.00–15.00x
--    0,2% -> 15.00–50.00x

create or replace function public._crash_regime_generate_point()
returns numeric
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  faixa double precision := random();
  detalhe double precision := random();
  ponto double precision := 1.05;
begin
  if faixa < 0.45 then
    ponto := 1.05 + detalhe * 0.05;
  elsif faixa < 0.80 then
    ponto := 1.10 + detalhe * 0.25;
  elsif faixa < 0.94 then
    ponto := 1.35 + detalhe * 0.85;
  elsif faixa < 0.985 then
    ponto := 2.20 + detalhe * 2.80;
  elsif faixa < 0.998 then
    ponto := 5.00 + detalhe * 10.00;
  else
    ponto := 15.00 + detalhe * 35.00;
  end if;

  return round(least(50.0, greatest(1.05, ponto))::numeric, 2);
end;
$$;

revoke all on function public._crash_regime_generate_point() from public;

-- ========================================================================
-- 5. DERBY — PROTOCOLO MAMBO 98%
-- ========================================================================
-- A corredora escolhida passa de 5% para 2% de chance real.
-- Se a escolha não for Mambo e perder, Mambo vence. Se a escolha for Mambo
-- e perder, uma das outras cinco recebe o resultado.

create or replace function public._derby_choose_winner(p_selected text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  all_runners constant text[] := array[
    'silence-suzuka', 'tokai-teio', 'mejiro-mcqueen',
    'gold-ship', 'matikanetannhauser', 'meisho-doto'
  ];
  other_runners text[];
  selected_wins boolean;
begin
  if not (p_selected = any(all_runners)) then
    raise exception 'Invalid Derby runner';
  end if;

  selected_wins := random() < 0.02;

  if selected_wins then
    return p_selected;
  end if;

  if p_selected <> 'matikanetannhauser' then
    return 'matikanetannhauser';
  end if;

  select array_agg(runner order by random())
  into other_runners
  from unnest(all_runners) as runner
  where runner <> 'matikanetannhauser';

  return other_runners[1];
end;
$$;

revoke all on function public._derby_choose_winner(text) from public;

commit;

-- ========================================================================
-- VERIFICAÇÕES OPCIONAIS APÓS O COMMIT
-- ========================================================================
-- 1) Conferir tipo do saldo:
-- select column_name, data_type, numeric_precision, numeric_scale
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'profiles' and column_name = 'balance';
--
-- 2) Como admin, use o próprio Painel > Carteiras para testar um saldo final
--    acima de 10.000.000 e depois restaure o valor desejado.
--
-- 3) Não rode UPDATE manual em profiles.balance: use admin_adjust_wallet para
--    manter o ledger consistente.
