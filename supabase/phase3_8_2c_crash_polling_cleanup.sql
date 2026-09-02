-- TaihenBet 2.0 — Fase 3.8.2c
-- Crash do Regime: cleanup de sessões encerradas.
--
-- Esta migração mantém a rodada ativa enquanto o jogo está rodando, registra
-- a liquidação em game_rounds e então APAGA a sessão secreta de
-- crash_regime_sessions. Assim o crash_point não fica armazenado em uma tabela
-- de sessão depois que a operação já terminou.
--
-- O polling reduzido é uma alteração de frontend e está em GamesPage.jsx.

begin;

-- Limpa resíduos de rodadas antigas já encerradas, sem tocar em operações ativas.
delete from public.crash_regime_sessions
where status <> 'active';

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
  public_result jsonb;
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

  -- Monta o comprovante ANTES de apagar a sessão secreta.
  public_result := public._crash_regime_public_state(
    session_row,
    current_profile,
    coalesce(p_event, 'lost'),
    p_at
  );

  -- A fonte persistente da rodada encerrada passa a ser game_rounds + ledger.
  delete from public.crash_regime_sessions
  where id = session_row.id;

  return public_result;
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
  public_result jsonb;
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

  current_multiplier := public._crash_regime_multiplier_at(
    session_row.started_at,
    check_at
  );

  -- O servidor decide pelo próprio relógio, não pelo multiplicador visual.
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
      'phase', '3.8.2c',
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

  -- Devolve o comprovante completo ao clique que encerrou a operação.
  public_result := public._crash_regime_public_state(
    session_row,
    final_profile,
    'cashout',
    check_at
  );

  -- Depois da liquidação, o segredo não precisa continuar na tabela de sessão.
  delete from public.crash_regime_sessions
  where id = session_row.id;

  return public_result;
exception
  when unique_violation then
    raise exception 'Crash payout already settled';
end;
$$;


-- Mantém as RPCs idempotentes mesmo depois do cleanup: se uma aba atrasada
-- consultar pelo id de uma rodada que já foi apagada da tabela de sessão,
-- o servidor reconstrói o comprovante a partir de game_rounds.
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
  round_row public.game_rounds;
  current_profile public.profiles;
  check_at timestamptz := clock_timestamp();
  current_multiplier numeric;
  historic_status text;
  session_found boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

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

  session_found := found;

  select * into current_profile
  from public.profiles
  where id = auth.uid();

  if not session_found and p_session_id is null then
    return null;
  end if;

  -- Uma sessão encerrada já pode ter sido destruída pelo cleanup. Nesse caso,
  -- devolvemos o comprovante persistente em game_rounds para chamadas atrasadas.
  if not session_found and p_session_id is not null then
    select * into round_row
    from public.game_rounds
    where id = p_session_id
      and user_id = auth.uid()
      and game = 'crash-regime'
    limit 1;

    if not found then
      return null;
    end if;

    historic_status := coalesce(
      round_row.result ->> 'status',
      case when round_row.payout > 0 then 'cashout' else 'lost' end
    );

    return jsonb_build_object(
      'sessionId', round_row.id::text,
      'roundId', round_row.id::text,
      'evento', 'history',
      'status', historic_status,
      'encerrada', true,
      'ganhou', historic_status = 'cashout',
      'entrada', round_row.stake,
      'premio', round_row.payout,
      'lucro', round_row.payout - round_row.stake,
      'multiplicadorAtual', round_row.multiplier,
      'retornoAtual', round_row.payout,
      'cashoutMultiplier', round_row.result -> 'cashoutMultiplier',
      'crashPoint', round_row.result -> 'crashPoint',
      'startedAt', null,
      'settledAt', null,
      'serverNow', check_at,
      'balanceAfterStake', round_row.balance_after_stake,
      'balanceAfter', round_row.balance_after,
      'profile', case when current_profile.id is null then null else to_jsonb(current_profile) end,
      'authoritative', true
    );
  end if;

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

revoke all on function public._crash_regime_settle_loss(uuid, text, timestamptz) from public;
revoke all on function public.cashout_crash_regime(uuid) from public;
revoke all on function public.get_crash_regime(uuid) from public;

grant execute on function public.cashout_crash_regime(uuid) to authenticated;
grant execute on function public.get_crash_regime(uuid) to authenticated;

commit;
