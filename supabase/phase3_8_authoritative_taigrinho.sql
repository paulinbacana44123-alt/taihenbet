-- TaihenBet 2.0 — Fase 3.8
-- Taigrinho com RNG, avaliação e pagamento autoritativos no PostgreSQL/Supabase.
-- Execute DEPOIS da Fase 3.7.
--
-- O navegador deixa de escolher o resultado final do Taigrinho.
-- A RPC play_taigrinho():
--   1) debita a entrada,
--   2) gera a grade no servidor,
--   3) avalia as paylines no servidor,
--   4) credita o prêmio no servidor,
--   5) grava a rodada para auditoria,
--   6) devolve somente o resultado já liquidado para o frontend animar.

begin;

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game text not null,
  stake numeric(14,2) not null,
  payout numeric(14,2) not null default 0,
  multiplier numeric(14,4) not null default 0,
  balance_after_stake numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint game_rounds_stake_positive check (stake > 0),
  constraint game_rounds_payout_nonnegative check (payout >= 0),
  constraint game_rounds_multiplier_nonnegative check (multiplier >= 0),
  constraint game_rounds_balance_nonnegative check (
    balance_after_stake >= 0 and balance_after >= 0
  )
);

create index if not exists game_rounds_user_created
on public.game_rounds(user_id, created_at desc);

create index if not exists game_rounds_game_created
on public.game_rounds(game, created_at desc);

alter table public.game_rounds enable row level security;

drop policy if exists "users read own game rounds" on public.game_rounds;
create policy "users read own game rounds"
on public.game_rounds
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

revoke all on table public.game_rounds from anon, authenticated;
grant select on table public.game_rounds to authenticated;

-- Helpers privados ---------------------------------------------------------

create or replace function public._taigrinho_random_int(p_max integer)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if coalesce(p_max, 0) <= 0 then
    return 0;
  end if;

  return floor(random() * p_max)::integer;
end;
$$;

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
  -- Mesmos pesos da versão cliente anterior: 3 / 6 / 10 / 12 / 15 / 20.
  roll := public._taigrinho_random_int(66);

  if roll < 3 then
    return 'tai';
  elsif roll < 9 then
    return 'mandioca';
  elsif roll < 19 then
    return 'sapo-minecraft';
  elsif roll < 31 then
    return 'neymar';
  elsif roll < 46 then
    return 'r-quiabo';
  end if;

  return 'tai-infernal';
end;
$$;

create or replace function public._taigrinho_random_grid()
returns text[]
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  grid text[] := array_fill('tai-infernal'::text, array[5,3]);
  reel integer;
  row_index integer;
begin
  for reel in 1..5 loop
    for row_index in 1..3 loop
      grid[reel][row_index] := public._taigrinho_random_symbol();
    end loop;
  end loop;

  return grid;
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
  line_multiplier numeric(14,4);
  multiplier_total numeric(14,4) := 0;
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
        line_multiplier := case same_count when 3 then 6 when 4 then 12 when 5 then 30 else 0 end;
      when 'mandioca' then
        symbol_name := 'TaiMandioca';
        line_multiplier := case same_count when 3 then 4 when 4 then 8 when 5 then 18 else 0 end;
      when 'sapo-minecraft' then
        symbol_name := 'Sapo do Minecraft';
        line_multiplier := case same_count when 3 then 3 when 4 then 6 when 5 then 12 else 0 end;
      when 'neymar' then
        symbol_name := 'Neymar do Brasil';
        line_multiplier := case same_count when 3 then 2.5 when 4 then 5 when 5 then 9 else 0 end;
      when 'r-quiabo' then
        symbol_name := 'R Quiabo';
        line_multiplier := case same_count when 3 then 2 when 4 then 4 when 5 then 7 else 0 end;
      when 'tai-infernal' then
        symbol_name := 'Tai Infernal';
        line_multiplier := case same_count when 3 then 1.5 when 4 then 3 when 5 then 5 else 0 end;
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
  roll := public._taigrinho_random_int(1000);

  -- 2,4%: força uma linha de 5 Tais (mega ganho), igual à lógica anterior.
  if roll < 24 then
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

  -- Próximos 22,1%: injeta uma vitória normal de 3 ou 4 símbolos não-Tai.
  if roll < 245 then
    grid := public._taigrinho_random_grid();
    line_index := public._taigrinho_random_int(5) + 1;

    case line_index
      when 1 then sql_rows := array[2,2,2,2,2];
      when 2 then sql_rows := array[1,1,1,1,1];
      when 3 then sql_rows := array[3,3,3,3,3];
      when 4 then sql_rows := array[1,2,3,2,1];
      else sql_rows := array[3,2,1,2,3];
    end case;

    chosen_symbol := symbol_options[public._taigrinho_random_int(array_length(symbol_options, 1)) + 1];
    same_count := case when public._taigrinho_random_int(100) < 72 then 3 else 4 end;

    for reel in 1..same_count loop
      grid[reel][sql_rows[reel]] := chosen_symbol;
    end loop;

    if same_count < 5 then
      loop
        different_symbol := symbol_options[public._taigrinho_random_int(array_length(symbol_options, 1)) + 1];
        exit when different_symbol is distinct from chosen_symbol;
      end loop;

      grid[same_count + 1][sql_rows[same_count + 1]] := different_symbol;
    end if;

    return grid;
  end if;

  -- Restante: procura uma grade sem payout. A banca é paciente.
  for attempt in 1..80 loop
    grid := public._taigrinho_random_grid();
    evaluation := public._taigrinho_evaluate(grid);

    if coalesce((evaluation ->> 'multiplicadorTotal')::numeric, 0) = 0 then
      return grid;
    end if;
  end loop;

  -- Fallback determinístico sem qualquer linha de 3 símbolos iguais.
  return array[
    array['tai', 'mandioca', 'sapo-minecraft'],
    array['neymar', 'r-quiabo', 'tai-infernal'],
    array['mandioca', 'sapo-minecraft', 'neymar'],
    array['r-quiabo', 'tai-infernal', 'tai'],
    array['sapo-minecraft', 'neymar', 'r-quiabo']
  ];
end;
$$;

-- RPC pública do jogo ------------------------------------------------------

create or replace function public.play_taigrinho(p_stake numeric)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  stake numeric(14,2);
  round_id uuid := gen_random_uuid();
  profile_after_stake public.profiles;
  final_profile public.profiles;
  grid text[];
  evaluation jsonb;
  multiplier_total numeric(14,4);
  payout numeric(14,2);
  public_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  stake := round(coalesce(p_stake, 0), 2);

  if stake < 10 or stake > 100000 then
    raise exception 'Invalid Taigrinho stake';
  end if;

  -- Primeiro a banca pega a entrada. O id da rodada vira a chave do ledger.
  select * into profile_after_stake
  from public._wallet_apply(
    auth.uid(),
    -stake,
    'game_stake',
    round_id::text,
    jsonb_build_object(
      'game', 'Taigrinho',
      'authoritative', true,
      'phase', '3.8'
    )
  );

  -- Só depois do débito o servidor cria o resultado.
  grid := public._taigrinho_generate_grid();
  evaluation := public._taigrinho_evaluate(grid);
  multiplier_total := coalesce((evaluation ->> 'multiplicadorTotal')::numeric, 0);
  payout := round(stake * multiplier_total, 2);
  final_profile := profile_after_stake;

  if payout > 0 then
    select * into final_profile
    from public._wallet_apply(
      auth.uid(),
      payout,
      'game_payout',
      round_id::text,
      jsonb_build_object(
        'game', 'Taigrinho',
        'authoritative', true,
        'phase', '3.8',
        'multiplier', multiplier_total,
        'winning_lines', jsonb_array_length(evaluation -> 'linhasVencedoras'),
        'mega_win', coalesce((evaluation ->> 'megaGanho')::boolean, false)
      )
    );
  end if;

  public_result := jsonb_build_object(
    'roundId', round_id::text,
    'grade', to_jsonb(grid),
    'entrada', stake,
    'premio', payout,
    'lucro', payout - stake,
    'multiplicadorTotal', multiplier_total,
    'linhasVencedoras', evaluation -> 'linhasVencedoras',
    'megaGanho', coalesce((evaluation ->> 'megaGanho')::boolean, false),
    'balanceAfterStake', profile_after_stake.balance,
    'balanceAfter', final_profile.balance,
    'profile', to_jsonb(final_profile),
    'authoritative', true
  );

  insert into public.game_rounds (
    id,
    user_id,
    game,
    stake,
    payout,
    multiplier,
    balance_after_stake,
    balance_after,
    result
  ) values (
    round_id,
    auth.uid(),
    'taigrinho',
    stake,
    payout,
    multiplier_total,
    profile_after_stake.balance,
    final_profile.balance,
    public_result - 'profile'
  );

  return public_result;
end;
$$;

-- Fecha a brecha antiga especificamente para o Taigrinho.
-- Outros jogos da Fase 3.7 continuam usando credit_game_payout até receberem
-- suas próprias RPCs autoritativas nas próximas etapas.
create or replace function public.credit_game_payout(
  p_external_id text,
  p_amount numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  stake_tx public.wallet_transactions;
  stake numeric(14,2);
  payout numeric(14,2);
  stake_game text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  payout := round(coalesce(p_amount, 0), 2);

  if payout <= 0 then
    raise exception 'Invalid payout';
  end if;

  select * into stake_tx
  from public.wallet_transactions
  where user_id = auth.uid()
    and kind = 'game_stake'
    and external_id = p_external_id
  limit 1;

  if not found then
    raise exception 'Matching game stake not found';
  end if;

  stake_game := lower(trim(coalesce(stake_tx.metadata ->> 'game', '')));

  if stake_game = 'taigrinho' then
    raise exception 'Taigrinho payouts are settled authoritatively by play_taigrinho';
  end if;

  stake := abs(stake_tx.amount);

  if payout > stake * 50 then
    raise exception 'Game payout exceeds safety cap';
  end if;

  return public._wallet_apply(
    auth.uid(), payout, 'game_payout', p_external_id, p_metadata
  );
exception
  when unique_violation then
    raise exception 'Game payout already settled';
end;
$$;

-- Helpers não são API pública.
revoke all on function public._taigrinho_random_int(integer) from public;
revoke all on function public._taigrinho_random_symbol() from public;
revoke all on function public._taigrinho_random_grid() from public;
revoke all on function public._taigrinho_evaluate(text[]) from public;
revoke all on function public._taigrinho_generate_grid() from public;
revoke all on function public.play_taigrinho(numeric) from public;

-- Mantém a função de payout genérico disponível só para os jogos ainda não migrados.
revoke all on function public.credit_game_payout(text, numeric, jsonb) from public;
grant execute on function public.credit_game_payout(text, numeric, jsonb) to authenticated;
grant execute on function public.play_taigrinho(numeric) to authenticated;

commit;
