-- TaihenBet 2.0 — Fase 3.8.1a
-- Hotfix: elimina sessões secretas da TaiMandioca depois da liquidação.
-- Execute DEPOIS da Fase 3.8.1.
--
-- O histórico definitivo continua em public.game_rounds e public.wallet_transactions.
-- public.taimandioca_sessions passa a guardar somente colheitas ATIVAS.

begin;

-- Limpa sessões já encerradas deixadas pela versão 3.8.1 anterior.
-- Não remove nenhuma colheita ativa.
delete from public.taimandioca_sessions
where status <> 'active';

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
  response_payload jsonb;
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

    -- Monta a resposta antes da exclusão; o navegador recebe apenas o estado público.
    response_payload := public._taimandioca_public_state(
      session_row,
      current_profile,
      'lost'
    );

    -- O mapa secreto não tem mais utilidade depois de liquidado.
    delete from public.taimandioca_sessions
    where id = session_row.id;

    return response_payload;
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
        'phase', '3.8.1a',
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

    response_payload := public._taimandioca_public_state(
      session_row,
      final_profile,
      'perfect'
    );

    delete from public.taimandioca_sessions
    where id = session_row.id;

    return response_payload;
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
  response_payload jsonb;
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
      'phase', '3.8.1a',
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

  response_payload := public._taimandioca_public_state(
    session_row,
    final_profile,
    'cashout'
  );

  -- Mantemos o histórico em game_rounds/ledger e descartamos o mapa secreto.
  delete from public.taimandioca_sessions
  where id = session_row.id;

  return response_payload;
end;
$$;

-- Mantém a superfície pública exatamente igual à 3.8.1.
revoke all on function public.reveal_taimandioca(uuid, integer) from public;
revoke all on function public.cashout_taimandioca(uuid) from public;

grant execute on function public.reveal_taimandioca(uuid, integer) to authenticated;
grant execute on function public.cashout_taimandioca(uuid) to authenticated;

commit;
