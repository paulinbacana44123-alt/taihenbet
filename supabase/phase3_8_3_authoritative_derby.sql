-- TaihenBet 2.0 — Fase 3.8.3
-- Taihen Derby autoritativo.
-- Execute DEPOIS das Fases 3.7, 3.8, 3.8.1 e 3.8.2c.
--
-- O navegador pode animar cavalinhas e narracao, mas nao escolhe a vencedora.
-- A ordem de chegada fica selada em derby_sessions e so e revelada depois que
-- o relogio do servidor encerra a corrida.

begin;

create table if not exists public.derby_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stake numeric(14,2) not null,
  selected_runner text not null,
  selected_odd numeric(8,2) not null,
  winner_runner text not null,
  finish_order text[] not null,
  status text not null default 'active',
  payout numeric(14,2) not null default 0,
  balance_after_stake numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  created_at timestamptz not null default clock_timestamp(),
  race_starts_at timestamptz not null,
  race_ends_at timestamptz not null,
  settled_at timestamptz,
  constraint derby_stake_positive check (stake > 0),
  constraint derby_odd_positive check (selected_odd >= 1),
  constraint derby_payout_nonnegative check (payout >= 0),
  constraint derby_balance_nonnegative check (
    balance_after_stake >= 0 and balance_after >= 0
  ),
  constraint derby_status_check check (status in ('active', 'settled')),
  constraint derby_runner_check check (
    selected_runner in (
      'silence-suzuka', 'tokai-teio', 'mejiro-mcqueen',
      'gold-ship', 'matikanetannhauser', 'meisho-doto'
    )
    and winner_runner in (
      'silence-suzuka', 'tokai-teio', 'mejiro-mcqueen',
      'gold-ship', 'matikanetannhauser', 'meisho-doto'
    )
  )
);

create index if not exists derby_sessions_user_created
on public.derby_sessions(user_id, created_at desc);

create unique index if not exists derby_one_active_per_user
on public.derby_sessions(user_id)
where status = 'active';

alter table public.derby_sessions enable row level security;

-- A vencedora e a ordem de chegada sao segredo de servidor.
revoke all on table public.derby_sessions from anon, authenticated;

-- Helpers privados ---------------------------------------------------------

create or replace function public._derby_runner_name(p_runner text)
returns text
language sql
immutable
security definer
set search_path = public
as $$
  select case p_runner
    when 'silence-suzuka' then 'Silence Suzuka'
    when 'tokai-teio' then 'Tokai Teio'
    when 'mejiro-mcqueen' then 'Mejiro McQueen'
    when 'gold-ship' then 'Gold Ship'
    when 'matikanetannhauser' then 'Matikanetannhauser'
    when 'meisho-doto' then 'Meisho Doto'
    else 'Corredora desconhecida'
  end;
$$;

create or replace function public._derby_runner_odd(p_runner text)
returns numeric
language sql
immutable
security definer
set search_path = public
as $$
  select case p_runner
    when 'silence-suzuka' then 2.20::numeric
    when 'tokai-teio' then 3.10::numeric
    when 'mejiro-mcqueen' then 4.00::numeric
    when 'gold-ship' then 5.25::numeric
    when 'matikanetannhauser' then 6.50::numeric
    when 'meisho-doto' then 8.50::numeric
    else null::numeric
  end;
$$;

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

  -- Preserva o criminosissimo Protocolo Mambo da versao original:
  -- a corredora apostada tem 5%% de chance real.
  selected_wins := random() < 0.05;

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

create or replace function public._derby_finish_order(p_winner text)
returns text[]
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
  rest text[];
begin
  select array_agg(runner order by random())
  into rest
  from unnest(all_runners) as runner
  where runner <> p_winner;

  return array_prepend(p_winner, coalesce(rest, array[]::text[]));
end;
$$;

create or replace function public._derby_public_state(
  p_session public.derby_sessions,
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
  is_finished boolean := p_session.status <> 'active';
begin
  return jsonb_build_object(
    'sessionId', p_session.id::text,
    'roundId', p_session.id::text,
    'evento', coalesce(p_event, 'state'),
    'status', p_session.status,
    'encerrada', is_finished,
    'ganhou', is_finished and p_session.selected_runner = p_session.winner_runner,
    'entrada', p_session.stake,
    'premio', case when is_finished then p_session.payout else 0 end,
    'lucro', case when is_finished then p_session.payout - p_session.stake else -p_session.stake end,
    'selectedRunner', p_session.selected_runner,
    'selectedRunnerName', public._derby_runner_name(p_session.selected_runner),
    'selectedOdd', p_session.selected_odd,
    -- Segredos so aparecem depois da corrida liquidada.
    'winnerRunner', case when is_finished then p_session.winner_runner else null end,
    'winnerRunnerName', case when is_finished then public._derby_runner_name(p_session.winner_runner) else null end,
    'finishOrder', case when is_finished then to_jsonb(p_session.finish_order) else null end,
    'createdAt', p_session.created_at,
    'raceStartsAt', p_session.race_starts_at,
    'raceEndsAt', p_session.race_ends_at,
    'settledAt', p_session.settled_at,
    'serverNow', p_at,
    'balanceAfterStake', p_session.balance_after_stake,
    'balanceAfter', p_session.balance_after,
    'profile', case when p_profile.id is null then null else to_jsonb(p_profile) end,
    'authoritative', true
  );
end;
$$;

create or replace function public._derby_record_round(
  p_session public.derby_sessions
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  won boolean := p_session.selected_runner = p_session.winner_runner;
  result_payload jsonb;
begin
  result_payload := jsonb_build_object(
    'roundId', p_session.id::text,
    'status', case when won then 'won' else 'lost' end,
    'entrada', p_session.stake,
    'premio', p_session.payout,
    'lucro', p_session.payout - p_session.stake,
    'selectedRunner', p_session.selected_runner,
    'selectedRunnerName', public._derby_runner_name(p_session.selected_runner),
    'selectedOdd', p_session.selected_odd,
    'winnerRunner', p_session.winner_runner,
    'winnerRunnerName', public._derby_runner_name(p_session.winner_runner),
    'finishOrder', to_jsonb(p_session.finish_order),
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
    'taihen-derby',
    p_session.stake,
    p_session.payout,
    case when won then p_session.selected_odd else 0 end,
    p_session.balance_after_stake,
    p_session.balance_after,
    result_payload
  )
  on conflict (id) do nothing;
end;
$$;

create or replace function public._derby_settle(
  p_session_id uuid,
  p_at timestamptz default clock_timestamp()
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  session_row public.derby_sessions;
  final_profile public.profiles;
  payout_value numeric(14,2) := 0;
  public_result jsonb;
  won boolean;
begin
  select * into session_row
  from public.derby_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Derby session not found';
  end if;

  select * into final_profile
  from public.profiles
  where id = session_row.user_id;

  -- Nao adianta adulterar o relogio ou chamar a RPC cedo.
  if session_row.status = 'active' and p_at < session_row.race_ends_at then
    return public._derby_public_state(
      session_row,
      final_profile,
      'still_running',
      p_at
    );
  end if;

  if session_row.status = 'active' then
    won := session_row.selected_runner = session_row.winner_runner;

    if won then
      payout_value := round(session_row.stake * session_row.selected_odd, 2);

      select * into final_profile
      from public._wallet_apply(
        session_row.user_id,
        payout_value,
        'game_payout',
        session_row.id::text,
        jsonb_build_object(
          'game', 'Taihen Derby',
          'authoritative', true,
          'phase', '3.8.3',
          'winner', session_row.winner_runner,
          'selected_runner', session_row.selected_runner,
          'odd', session_row.selected_odd
        )
      );
    end if;

    update public.derby_sessions
    set status = 'settled',
        payout = payout_value,
        balance_after = final_profile.balance,
        settled_at = p_at
    where id = session_row.id
    returning * into session_row;

    perform public._derby_record_round(session_row);
  end if;

  public_result := public._derby_public_state(
    session_row,
    final_profile,
    'result',
    p_at
  );

  -- A ordem secreta so vive enquanto a corrida esta aberta.
  delete from public.derby_sessions
  where id = session_row.id;

  return public_result;
end;
$$;

-- RPCs públicas ------------------------------------------------------------

create or replace function public.start_derby(
  p_stake numeric,
  p_selected_runner text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  stake_value numeric(14,2);
  selected_id text := lower(trim(coalesce(p_selected_runner, '')));
  selected_odd_value numeric(8,2);
  winner_id text;
  finish_order_value text[];
  existing_session public.derby_sessions;
  new_session public.derby_sessions;
  profile_after_stake public.profiles;
  round_id uuid := gen_random_uuid();
  check_at timestamptz := clock_timestamp();
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  stake_value := round(coalesce(p_stake, 0), 2);
  selected_odd_value := public._derby_runner_odd(selected_id);

  if stake_value < 10 or stake_value > 100000 then
    raise exception 'Invalid Derby stake';
  end if;

  if selected_odd_value is null then
    raise exception 'Invalid Derby runner';
  end if;

  -- Nunca cobra uma segunda entrada se a conta ja possui corrida ativa.
  select * into existing_session
  from public.derby_sessions
  where user_id = auth.uid()
    and status = 'active'
  order by created_at desc
  limit 1
  for update;

  if found then
    if check_at >= existing_session.race_ends_at then
      return public._derby_settle(existing_session.id, check_at);
    end if;

    select * into profile_after_stake
    from public.profiles
    where id = auth.uid();

    return public._derby_public_state(
      existing_session,
      profile_after_stake,
      'resume',
      check_at
    );
  end if;

  winner_id := public._derby_choose_winner(selected_id);
  finish_order_value := public._derby_finish_order(winner_id);

  select * into profile_after_stake
  from public._wallet_apply(
    auth.uid(),
    -stake_value,
    'game_stake',
    round_id::text,
    jsonb_build_object(
      'game', 'Taihen Derby',
      'authoritative', true,
      'phase', '3.8.3',
      'selected_runner', selected_id,
      'odd', selected_odd_value
    )
  );

  insert into public.derby_sessions (
    id,
    user_id,
    stake,
    selected_runner,
    selected_odd,
    winner_runner,
    finish_order,
    status,
    payout,
    balance_after_stake,
    balance_after,
    created_at,
    race_starts_at,
    race_ends_at
  ) values (
    round_id,
    auth.uid(),
    stake_value,
    selected_id,
    selected_odd_value,
    winner_id,
    finish_order_value,
    'active',
    0,
    profile_after_stake.balance,
    profile_after_stake.balance,
    check_at,
    check_at + interval '2550 milliseconds',
    check_at + interval '10150 milliseconds'
  )
  returning * into new_session;

  return public._derby_public_state(
    new_session,
    profile_after_stake,
    'started',
    check_at
  );
end;
$$;

create or replace function public.get_derby(
  p_session_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  session_row public.derby_sessions;
  round_row public.game_rounds;
  current_profile public.profiles;
  check_at timestamptz := clock_timestamp();
  session_found boolean := false;
  result_payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_session_id is null then
    select * into session_row
    from public.derby_sessions
    where user_id = auth.uid()
      and status = 'active'
    order by created_at desc
    limit 1
    for update;
  else
    select * into session_row
    from public.derby_sessions
    where id = p_session_id
      and user_id = auth.uid()
    for update;
  end if;

  session_found := found;

  select * into current_profile
  from public.profiles
  where id = auth.uid();

  if session_found then
    if session_row.status = 'active' and check_at >= session_row.race_ends_at then
      return public._derby_settle(session_row.id, check_at);
    end if;

    return public._derby_public_state(
      session_row,
      current_profile,
      case when p_session_id is null then 'resume' else 'state' end,
      check_at
    );
  end if;

  if p_session_id is null then
    return null;
  end if;

  -- Depois do cleanup, chamadas atrasadas pelo id recuperam o comprovante.
  select * into round_row
  from public.game_rounds
  where id = p_session_id
    and user_id = auth.uid()
    and game = 'taihen-derby'
  limit 1;

  if not found then
    return null;
  end if;

  result_payload := round_row.result;

  return jsonb_build_object(
    'sessionId', round_row.id::text,
    'roundId', round_row.id::text,
    'evento', 'history',
    'status', 'settled',
    'encerrada', true,
    'ganhou', coalesce(result_payload ->> 'status', '') = 'won',
    'entrada', round_row.stake,
    'premio', round_row.payout,
    'lucro', round_row.payout - round_row.stake,
    'selectedRunner', result_payload ->> 'selectedRunner',
    'selectedRunnerName', result_payload ->> 'selectedRunnerName',
    'selectedOdd', coalesce((result_payload ->> 'selectedOdd')::numeric, round_row.multiplier),
    'winnerRunner', result_payload ->> 'winnerRunner',
    'winnerRunnerName', result_payload ->> 'winnerRunnerName',
    'finishOrder', result_payload -> 'finishOrder',
    'createdAt', round_row.created_at,
    'raceStartsAt', null,
    'raceEndsAt', null,
    'settledAt', round_row.created_at,
    'serverNow', check_at,
    'balanceAfterStake', round_row.balance_after_stake,
    'balanceAfter', round_row.balance_after,
    'profile', case when current_profile.id is null then null else to_jsonb(current_profile) end,
    'authoritative', true
  );
end;
$$;

-- Fecha tambem a antiga ponte generica de payout para o Derby.
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

  if stake_game in ('taihen derby', 'taihen-derby') then
    raise exception 'Taihen Derby payouts are settled authoritatively by get_derby';
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

-- Helpers nao sao API publica.
revoke all on function public._derby_runner_name(text) from public;
revoke all on function public._derby_runner_odd(text) from public;
revoke all on function public._derby_choose_winner(text) from public;
revoke all on function public._derby_finish_order(text) from public;
revoke all on function public._derby_public_state(public.derby_sessions, public.profiles, text, timestamptz) from public;
revoke all on function public._derby_record_round(public.derby_sessions) from public;
revoke all on function public._derby_settle(uuid, timestamptz) from public;

revoke all on function public.start_derby(numeric, text) from public;
revoke all on function public.get_derby(uuid) from public;
revoke all on function public.credit_game_payout(text, numeric, jsonb) from public;

grant execute on function public.start_derby(numeric, text) to authenticated;
grant execute on function public.get_derby(uuid) to authenticated;
grant execute on function public.credit_game_payout(text, numeric, jsonb) to authenticated;

commit;
