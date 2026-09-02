-- TaihenBet 2.0 — Fase 3.8.1
-- TaiMandioca com tabuleiro, revelação e pagamento autoritativos no PostgreSQL/Supabase.
-- Execute DEPOIS das Fases 3.7 e 3.8.
--
-- Fluxo:
--   start_taimandioca()   -> debita e cria a plantação secreta no servidor
--   reveal_taimandioca()  -> o cliente só informa qual casa quer revelar
--   cashout_taimandioca() -> o servidor calcula e paga o retorno
--   get_active_taimandioca() -> restaura uma colheita ativa após F5
--
-- A lista de mandiocas normais fica na tabela privada taimandioca_sessions.
-- Nenhuma permissão SELECT é concedida a usuários autenticados nessa tabela.

begin;

create table if not exists public.taimandioca_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stake numeric(14,2) not null,
  hazard_count integer not null,
  hazard_indices integer[] not null,
  revealed_indices integer[] not null default '{}'::integer[],
  status text not null default 'active',
  payout numeric(14,2) not null default 0,
  multiplier numeric(14,4) not null default 1,
  balance_after_stake numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  fatal_index integer,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  constraint taimandioca_stake_positive check (stake > 0),
  constraint taimandioca_hazard_count check (hazard_count in (3, 5, 7, 10)),
  constraint taimandioca_status_check check (status in ('active', 'lost', 'cashout', 'perfect')),
  constraint taimandioca_payout_nonnegative check (payout >= 0),
  constraint taimandioca_multiplier_nonnegative check (multiplier >= 0),
  constraint taimandioca_balance_nonnegative check (
    balance_after_stake >= 0 and balance_after >= 0
  ),
  constraint taimandioca_fatal_index_check check (
    fatal_index is null or (fatal_index between 0 and 24)
  )
);

create index if not exists taimandioca_sessions_user_created
on public.taimandioca_sessions(user_id, created_at desc);

create unique index if not exists taimandioca_one_active_per_user
on public.taimandioca_sessions(user_id)
where status = 'active';

alter table public.taimandioca_sessions enable row level security;

-- Esta tabela contém o tabuleiro secreto. Nem o próprio usuário recebe SELECT.
revoke all on table public.taimandioca_sessions from anon, authenticated;

-- Helpers privados ---------------------------------------------------------

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

  if p_hazards not in (3, 5, 7, 10) then
    raise exception 'Invalid TaiMandioca hazard count';
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
  if p_hazards not in (3, 5, 7, 10) then
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

create or replace function public._taimandioca_public_state(
  p_session public.taimandioca_sessions,
  p_profile public.profiles,
  p_event text default 'state'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  revealed_count integer := coalesce(cardinality(p_session.revealed_indices), 0);
  current_multiplier numeric;
  current_return numeric;
  safe_total integer := 25 - p_session.hazard_count;
begin
  current_multiplier := public._taimandioca_multiplier(
    p_session.hazard_count,
    revealed_count
  );

  current_return := case
    when p_session.status = 'active' and revealed_count > 0
      then round(p_session.stake * current_multiplier, 2)
    when p_session.status in ('cashout', 'perfect')
      then p_session.payout
    else 0
  end;

  return jsonb_build_object(
    'sessionId', p_session.id::text,
    'roundId', p_session.id::text,
    'evento', coalesce(p_event, 'state'),
    'status', p_session.status,
    'encerrada', p_session.status <> 'active',
    'ganhou', p_session.status in ('cashout', 'perfect'),
    'entrada', p_session.stake,
    'premio', p_session.payout,
    'lucro', p_session.payout - p_session.stake,
    'quantidadeMandiocasNormais', p_session.hazard_count,
    'reveladas', to_jsonb(p_session.revealed_indices),
    'casasSegurasTotais', safe_total,
    'casasSegurasRestantes', greatest(0, safe_total - revealed_count),
    'multiplicadorAtual', current_multiplier,
    'retornoAtual', current_return,
    'fatalIndex', p_session.fatal_index,
    'balanceAfterStake', p_session.balance_after_stake,
    'balanceAfter', p_session.balance_after,
    'profile', case when p_profile.id is null then null else to_jsonb(p_profile) end,
    'authoritative', true
  );
end;
$$;

create or replace function public._taimandioca_record_round(
  p_session public.taimandioca_sessions,
  p_event text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  result_payload jsonb;
begin
  result_payload := jsonb_build_object(
    'roundId', p_session.id::text,
    'evento', p_event,
    'status', p_session.status,
    'entrada', p_session.stake,
    'premio', p_session.payout,
    'lucro', p_session.payout - p_session.stake,
    'quantidadeMandiocasNormais', p_session.hazard_count,
    'reveladas', to_jsonb(p_session.revealed_indices),
    'casasReveladas', coalesce(cardinality(p_session.revealed_indices), 0),
    'fatalIndex', p_session.fatal_index,
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
    p_session.id,
    p_session.user_id,
    'taimandioca',
    p_session.stake,
    p_session.payout,
    p_session.multiplier,
    p_session.balance_after_stake,
    p_session.balance_after,
    result_payload
  )
  on conflict (id) do nothing;
end;
$$;

-- RPCs públicas ------------------------------------------------------------

create or replace function public.get_active_taimandioca()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  session_row public.taimandioca_sessions;
  current_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into session_row
  from public.taimandioca_sessions
  where user_id = auth.uid()
    and status = 'active'
  order by created_at desc
  limit 1;

  if not found then
    return null;
  end if;

  select * into current_profile
  from public.profiles
  where id = auth.uid();

  return public._taimandioca_public_state(
    session_row,
    current_profile,
    'resume'
  );
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
  stake_value numeric(14,2);
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

  if stake_value < 10 or stake_value > 100000 then
    raise exception 'Invalid TaiMandioca stake';
  end if;

  if p_hazards not in (3, 5, 7, 10) then
    raise exception 'Invalid TaiMandioca hazard count';
  end if;

  -- Idempotência de UX: se uma colheita ativa existir, devolve a mesma
  -- sem cobrar nova entrada.
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
      'phase', '3.8.1',
      'hazards', p_hazards
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

create or replace function public.reveal_taimandioca(
  p_session_id uuid,
  p_index integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  session_row public.taimandioca_sessions;
  current_profile public.profiles;
  final_profile public.profiles;
  next_revealed integer[];
  revealed_count integer;
  safe_total integer;
  current_multiplier numeric(14,4);
  payout_value numeric(14,2);
  is_hazard boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_index < 0 or p_index > 24 then
    raise exception 'Invalid TaiMandioca cell';
  end if;

  select * into session_row
  from public.taimandioca_sessions
  where id = p_session_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'TaiMandioca session not found';
  end if;

  if session_row.status <> 'active' then
    raise exception 'TaiMandioca session already settled';
  end if;

  select * into current_profile
  from public.profiles
  where id = auth.uid();

  if p_index = any(session_row.revealed_indices) then
    return public._taimandioca_public_state(
      session_row,
      current_profile,
      'already_revealed'
    );
  end if;

  is_hazard := p_index = any(session_row.hazard_indices);

  if is_hazard then
    current_multiplier := public._taimandioca_multiplier(
      session_row.hazard_count,
      coalesce(cardinality(session_row.revealed_indices), 0)
    );

    update public.taimandioca_sessions
    set status = 'lost',
        payout = 0,
        multiplier = current_multiplier,
        fatal_index = p_index,
        balance_after = current_profile.balance,
        settled_at = now()
    where id = session_row.id
    returning * into session_row;

    perform public._taimandioca_record_round(session_row, 'lost');

    return public._taimandioca_public_state(
      session_row,
      current_profile,
      'lost'
    );
  end if;

  next_revealed := array_append(session_row.revealed_indices, p_index);
  revealed_count := cardinality(next_revealed);
  safe_total := 25 - session_row.hazard_count;
  current_multiplier := public._taimandioca_multiplier(
    session_row.hazard_count,
    revealed_count
  );

  if revealed_count >= safe_total then
    payout_value := round(session_row.stake * current_multiplier, 2);

    select * into final_profile
    from public._wallet_apply(
      auth.uid(),
      payout_value,
      'game_payout',
      session_row.id::text,
      jsonb_build_object(
        'game', 'TaiMandioca',
        'authoritative', true,
        'phase', '3.8.1',
        'resolution', 'perfect',
        'revealed', revealed_count,
        'hazards', session_row.hazard_count,
        'multiplier', current_multiplier
      )
    );

    update public.taimandioca_sessions
    set revealed_indices = next_revealed,
        status = 'perfect',
        payout = payout_value,
        multiplier = current_multiplier,
        balance_after = final_profile.balance,
        settled_at = now()
    where id = session_row.id
    returning * into session_row;

    perform public._taimandioca_record_round(session_row, 'perfect');

    return public._taimandioca_public_state(
      session_row,
      final_profile,
      'perfect'
    );
  end if;

  update public.taimandioca_sessions
  set revealed_indices = next_revealed,
      multiplier = current_multiplier
  where id = session_row.id
  returning * into session_row;

  return public._taimandioca_public_state(
    session_row,
    current_profile,
    'safe'
  );
end;
$$;

create or replace function public.cashout_taimandioca(
  p_session_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  session_row public.taimandioca_sessions;
  final_profile public.profiles;
  revealed_count integer;
  current_multiplier numeric(14,4);
  payout_value numeric(14,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into session_row
  from public.taimandioca_sessions
  where id = p_session_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'TaiMandioca session not found';
  end if;

  if session_row.status <> 'active' then
    raise exception 'TaiMandioca session already settled';
  end if;

  revealed_count := coalesce(cardinality(session_row.revealed_indices), 0);

  if revealed_count <= 0 then
    raise exception 'Reveal at least one TaiMandioca before cashout';
  end if;

  current_multiplier := public._taimandioca_multiplier(
    session_row.hazard_count,
    revealed_count
  );
  payout_value := round(session_row.stake * current_multiplier, 2);

  select * into final_profile
  from public._wallet_apply(
    auth.uid(),
    payout_value,
    'game_payout',
    session_row.id::text,
    jsonb_build_object(
      'game', 'TaiMandioca',
      'authoritative', true,
      'phase', '3.8.1',
      'resolution', 'cashout',
      'revealed', revealed_count,
      'hazards', session_row.hazard_count,
      'multiplier', current_multiplier
    )
  );

  update public.taimandioca_sessions
  set status = 'cashout',
      payout = payout_value,
      multiplier = current_multiplier,
      balance_after = final_profile.balance,
      settled_at = now()
  where id = session_row.id
  returning * into session_row;

  perform public._taimandioca_record_round(session_row, 'cashout');

  return public._taimandioca_public_state(
    session_row,
    final_profile,
    'cashout'
  );
end;
$$;

-- Fecha a brecha genérica para os dois jogos que já são autoritativos.
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

  if stake_game = 'taimandioca' then
    raise exception 'TaiMandioca payouts are settled authoritatively by its server session';
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
revoke all on function public._taimandioca_multiplier(integer, integer) from public;
revoke all on function public._taimandioca_generate_hazards(integer) from public;
revoke all on function public._taimandioca_public_state(public.taimandioca_sessions, public.profiles, text) from public;
revoke all on function public._taimandioca_record_round(public.taimandioca_sessions, text) from public;

revoke all on function public.get_active_taimandioca() from public;
revoke all on function public.start_taimandioca(numeric, integer) from public;
revoke all on function public.reveal_taimandioca(uuid, integer) from public;
revoke all on function public.cashout_taimandioca(uuid) from public;
revoke all on function public.credit_game_payout(text, numeric, jsonb) from public;

grant execute on function public.get_active_taimandioca() to authenticated;
grant execute on function public.start_taimandioca(numeric, integer) to authenticated;
grant execute on function public.reveal_taimandioca(uuid, integer) to authenticated;
grant execute on function public.cashout_taimandioca(uuid) to authenticated;
grant execute on function public.credit_game_payout(text, numeric, jsonb) to authenticated;

commit;
