-- TaihenBet 2.0 — Fase 3.8.2
-- Crash do Regime com ponto de confisco, relógio, retirada e liquidação
-- autoritativos no PostgreSQL/Supabase.
-- Execute DEPOIS das Fases 3.7, 3.8, 3.8.1 e 3.8.1a.
--
-- O navegador pode desenhar o gráfico, mas NÃO recebe o ponto de crash enquanto
-- a operação está ativa. O servidor usa o próprio relógio para decidir se uma
-- retirada chegou antes ou depois do confisco.

begin;

create table if not exists public.crash_regime_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stake numeric(14,2) not null,
  crash_point numeric(14,4) not null,
  status text not null default 'active',
  payout numeric(14,2) not null default 0,
  multiplier numeric(14,4) not null default 1,
  cashout_multiplier numeric(14,4),
  balance_after_stake numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  started_at timestamptz not null default clock_timestamp(),
  settled_at timestamptz,
  constraint crash_regime_stake_positive check (stake > 0),
  constraint crash_regime_point_check check (crash_point >= 1.05 and crash_point <= 50),
  constraint crash_regime_status_check check (status in ('active', 'lost', 'cashout')),
  constraint crash_regime_payout_nonnegative check (payout >= 0),
  constraint crash_regime_multiplier_check check (multiplier >= 1 and multiplier <= 50),
  constraint crash_regime_cashout_multiplier_check check (
    cashout_multiplier is null or (cashout_multiplier >= 1 and cashout_multiplier <= 50)
  ),
  constraint crash_regime_balance_nonnegative check (
    balance_after_stake >= 0 and balance_after >= 0
  )
);

create index if not exists crash_regime_sessions_user_created
on public.crash_regime_sessions(user_id, started_at desc);

create unique index if not exists crash_regime_one_active_per_user
on public.crash_regime_sessions(user_id)
where status = 'active';

alter table public.crash_regime_sessions enable row level security;

-- O ponto de crash é segredo de servidor. Nem o dono da sessão recebe SELECT.
revoke all on table public.crash_regime_sessions from anon, authenticated;

-- Helpers privados ---------------------------------------------------------

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
  -- Mesma distribuição visual da versão anterior do frontend.
  if faixa < 0.20 then
    ponto := 1.05 + detalhe * 0.40;
  elsif faixa < 0.61 then
    ponto := 1.45 + detalhe * 1.65;
  elsif faixa < 0.84 then
    ponto := 3.10 + detalhe * 3.90;
  elsif faixa < 0.95 then
    ponto := 7.00 + detalhe * 8.00;
  elsif faixa < 0.99 then
    ponto := 15.00 + detalhe * 15.00;
  else
    ponto := 30.00 + detalhe * 20.00;
  end if;

  return round(least(50.0, ponto)::numeric, 2);
end;
$$;

create or replace function public._crash_regime_multiplier_at(
  p_started_at timestamptz,
  p_at timestamptz
)
returns numeric
language plpgsql
immutable
security definer
set search_path = public
as $$
declare
  elapsed_ms numeric;
begin
  elapsed_ms := greatest(
    0::numeric,
    extract(epoch from (p_at - p_started_at)) * 1000
  );

  return exp(
    least(
      ln(50::numeric),
      elapsed_ms / 8200::numeric
    )
  );
end;
$$;

create or replace function public._crash_regime_public_state(
  p_session public.crash_regime_sessions,
  p_profile public.profiles,
  p_event text default 'state',
  p_at timestamptz default clock_timestamp()
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  current_multiplier numeric;
  display_multiplier numeric(14,2);
  possible_return numeric(14,2);
begin
  if p_session.status = 'active' then
    current_multiplier := public._crash_regime_multiplier_at(
      p_session.started_at,
      p_at
    );
  else
    current_multiplier := p_session.multiplier;
  end if;

  display_multiplier := round(greatest(1::numeric, current_multiplier), 2);

  possible_return := case
    when p_session.status = 'active'
      then round(p_session.stake * display_multiplier, 2)
    when p_session.status = 'cashout'
      then p_session.payout
    else 0
  end;

  return jsonb_build_object(
    'sessionId', p_session.id::text,
    'roundId', p_session.id::text,
    'evento', coalesce(p_event, 'state'),
    'status', p_session.status,
    'encerrada', p_session.status <> 'active',
    'ganhou', p_session.status = 'cashout',
    'entrada', p_session.stake,
    'premio', p_session.payout,
    'lucro', p_session.payout - p_session.stake,
    'multiplicadorAtual', display_multiplier,
    'retornoAtual', possible_return,
    'cashoutMultiplier', p_session.cashout_multiplier,
    -- O segredo só é revelado depois que a rodada acabou.
    'crashPoint', case
      when p_session.status = 'active' then null
      else p_session.crash_point
    end,
    'startedAt', p_session.started_at,
    'settledAt', p_session.settled_at,
    'serverNow', p_at,
    'balanceAfterStake', p_session.balance_after_stake,
    'balanceAfter', p_session.balance_after,
    'profile', case when p_profile.id is null then null else to_jsonb(p_profile) end,
    'authoritative', true
  );
end;
$$;

create or replace function public._crash_regime_record_round(
  p_session public.crash_regime_sessions,
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
    'multiplicador', p_session.multiplier,
    'cashoutMultiplier', p_session.cashout_multiplier,
    'crashPoint', p_session.crash_point,
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
    'crash-regime',
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

create or replace function public._crash_regime_settle_loss(
  p_session_id uuid,
  p_event text default 'lost',
  p_at timestamptz default clock_timestamp()
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  session_row public.crash_regime_sessions;
  current_profile public.profiles;
begin
  select * into session_row
  from public.crash_regime_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Crash session not found';
  end if;

  select * into current_profile
  from public.profiles
  where id = session_row.user_id;

  if session_row.status = 'active' then
    update public.crash_regime_sessions
    set status = 'lost',
        payout = 0,
        multiplier = crash_point,
        cashout_multiplier = null,
        balance_after = current_profile.balance,
        settled_at = p_at
    where id = session_row.id
    returning * into session_row;

    perform public._crash_regime_record_round(
      session_row,
      coalesce(p_event, 'lost')
    );
  end if;

  return public._crash_regime_public_state(
    session_row,
    current_profile,
    coalesce(p_event, 'lost'),
    p_at
  );
end;
$$;

-- RPCs públicas ------------------------------------------------------------

-- Consulta uma sessão conhecida ou, sem id, a operação ativa da conta.
-- Se o relógio do servidor já cruzou o ponto secreto, esta própria chamada
-- liquida a derrota antes de responder.
create or replace function public.get_crash_regime(
  p_session_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  session_row public.crash_regime_sessions;
  current_profile public.profiles;
  check_at timestamptz;
  current_multiplier numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  check_at := clock_timestamp();

  if p_session_id is null then
    select * into session_row
    from public.crash_regime_sessions
    where user_id = auth.uid()
      and status = 'active'
    order by started_at desc
    limit 1
    for update;
  else
    select * into session_row
    from public.crash_regime_sessions
    where id = p_session_id
      and user_id = auth.uid()
    for update;
  end if;

  if not found then
    return null;
  end if;

  select * into current_profile
  from public.profiles
  where id = auth.uid();

  if session_row.status = 'active' then
    current_multiplier := public._crash_regime_multiplier_at(
      session_row.started_at,
      check_at
    );

    if current_multiplier >= session_row.crash_point then
      return public._crash_regime_settle_loss(
        session_row.id,
        'lost',
        check_at
      );
    end if;
  end if;

  return public._crash_regime_public_state(
    session_row,
    current_profile,
    case when p_session_id is null then 'resume' else 'tick' end,
    check_at
  );
end;
$$;

create or replace function public.start_crash_regime(
  p_stake numeric
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  stake_value numeric(14,2);
  existing_session public.crash_regime_sessions;
  new_session public.crash_regime_sessions;
  profile_after_stake public.profiles;
  round_id uuid := gen_random_uuid();
  secret_crash_point numeric(14,4);
  check_at timestamptz;
  current_multiplier numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  check_at := clock_timestamp();

  stake_value := round(coalesce(p_stake, 0), 2);

  if stake_value < 10 or stake_value > 100000 then
    raise exception 'Invalid Crash stake';
  end if;

  -- Se já existe uma operação, nunca cobra outra entrada por acidente.
  select * into existing_session
  from public.crash_regime_sessions
  where user_id = auth.uid()
    and status = 'active'
  order by started_at desc
  limit 1
  for update;

  if found then
    current_multiplier := public._crash_regime_multiplier_at(
      existing_session.started_at,
      check_at
    );

    if current_multiplier >= existing_session.crash_point then
      return public._crash_regime_settle_loss(
        existing_session.id,
        'lost',
        check_at
      );
    end if;

    select * into profile_after_stake
    from public.profiles
    where id = auth.uid();

    return public._crash_regime_public_state(
      existing_session,
      profile_after_stake,
      'resume',
      check_at
    );
  end if;

  secret_crash_point := public._crash_regime_generate_point();

  select * into profile_after_stake
  from public._wallet_apply(
    auth.uid(),
    -stake_value,
    'game_stake',
    round_id::text,
    jsonb_build_object(
      'game', 'Crash do Regime',
      'authoritative', true,
      'phase', '3.8.2'
    )
  );

  -- O cronômetro começa depois que o débito foi confirmado.
  check_at := clock_timestamp();

  insert into public.crash_regime_sessions (
    id,
    user_id,
    stake,
    crash_point,
    status,
    payout,
    multiplier,
    cashout_multiplier,
    balance_after_stake,
    balance_after,
    started_at
  ) values (
    round_id,
    auth.uid(),
    stake_value,
    secret_crash_point,
    'active',
    0,
    1,
    null,
    profile_after_stake.balance,
    profile_after_stake.balance,
    check_at
  )
  returning * into new_session;

  return public._crash_regime_public_state(
    new_session,
    profile_after_stake,
    'started',
    check_at
  );
end;
$$;

create or replace function public.cashout_crash_regime(
  p_session_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  session_row public.crash_regime_sessions;
  final_profile public.profiles;
  check_at timestamptz := clock_timestamp();
  current_multiplier numeric;
  cashout_value numeric(14,4);
  payout_value numeric(14,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into session_row
  from public.crash_regime_sessions
  where id = p_session_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Crash session not found';
  end if;

  -- Idempotência: se outra aba/poll já resolveu, devolve o comprovante.
  if session_row.status <> 'active' then
    select * into final_profile
    from public.profiles
    where id = auth.uid();

    return public._crash_regime_public_state(
      session_row,
      final_profile,
      'already_settled',
      check_at
    );
  end if;

  current_multiplier := public._crash_regime_multiplier_at(
    session_row.started_at,
    check_at
  );

  -- A decisão usa relógio e ponto secretos do servidor, nunca o número enviado
  -- ou exibido pelo navegador.
  if current_multiplier >= session_row.crash_point then
    return public._crash_regime_settle_loss(
      session_row.id,
      'lost_on_cashout',
      check_at
    );
  end if;

  cashout_value := greatest(1::numeric, round(current_multiplier, 2));
  payout_value := round(session_row.stake * cashout_value, 2);

  select * into final_profile
  from public._wallet_apply(
    auth.uid(),
    payout_value,
    'game_payout',
    session_row.id::text,
    jsonb_build_object(
      'game', 'Crash do Regime',
      'authoritative', true,
      'phase', '3.8.2',
      'resolution', 'cashout',
      'multiplier', cashout_value
    )
  );

  update public.crash_regime_sessions
  set status = 'cashout',
      payout = payout_value,
      multiplier = cashout_value,
      cashout_multiplier = cashout_value,
      balance_after = final_profile.balance,
      settled_at = check_at
  where id = session_row.id
  returning * into session_row;

  perform public._crash_regime_record_round(
    session_row,
    'cashout'
  );

  return public._crash_regime_public_state(
    session_row,
    final_profile,
    'cashout',
    check_at
  );
exception
  when unique_violation then
    -- Só seria atingido em uma corrida extremamente apertada. A linha da
    -- sessão permanece a fonte de verdade e impede payout duplo.
    raise exception 'Crash payout already settled';
end;
$$;

-- Fecha a ponte genérica para todos os jogos já autoritativos.
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

  if stake_game in ('crash do regime', 'crash-regime') then
    raise exception 'Crash payouts are settled authoritatively by cashout_crash_regime';
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
revoke all on function public._crash_regime_generate_point() from public;
revoke all on function public._crash_regime_multiplier_at(timestamptz, timestamptz) from public;
revoke all on function public._crash_regime_public_state(public.crash_regime_sessions, public.profiles, text, timestamptz) from public;
revoke all on function public._crash_regime_record_round(public.crash_regime_sessions, text) from public;
revoke all on function public._crash_regime_settle_loss(uuid, text, timestamptz) from public;

revoke all on function public.get_crash_regime(uuid) from public;
revoke all on function public.start_crash_regime(numeric) from public;
revoke all on function public.cashout_crash_regime(uuid) from public;
revoke all on function public.credit_game_payout(text, numeric, jsonb) from public;

grant execute on function public.get_crash_regime(uuid) to authenticated;
grant execute on function public.start_crash_regime(numeric) to authenticated;
grant execute on function public.cashout_crash_regime(uuid) to authenticated;
grant execute on function public.credit_game_payout(text, numeric, jsonb) to authenticated;

commit;
