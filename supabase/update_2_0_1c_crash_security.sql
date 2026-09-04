-- TaihenBet 2.0.1c — CRASH SECURITY HOTFIX
-- Corrige o cashout garantido abaixo do menor crash possível e adiciona
-- contenção server-side contra spam de novas operações.
--
-- Pré-requisitos: Fase 3.8.2 + 3.8.2c + carteira autoritativa já aplicadas.
-- Este patch NÃO altera saldos existentes e NÃO apaga wallet_transactions.

begin;

-- -------------------------------------------------------------------------
-- 1) RATE LIMIT PRIVADO POR CONTA
-- -------------------------------------------------------------------------
create table if not exists public.crash_regime_rate_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_start_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.crash_regime_rate_limits enable row level security;

-- Nenhum cliente acessa a tabela diretamente. Apenas as SECURITY DEFINER
-- abaixo usam esse estado interno.
revoke all on table public.crash_regime_rate_limits
from public, anon, authenticated;

-- Reforça o segredo do crash_point mesmo se grants antigos tiverem voltado.
alter table public.crash_regime_sessions enable row level security;
revoke all on table public.crash_regime_sessions
from public, anon, authenticated;

-- Mantém uma única operação ativa por conta.
create unique index if not exists crash_regime_one_active_per_user
on public.crash_regime_sessions(user_id)
where status = 'active';

-- -------------------------------------------------------------------------
-- 2) START: UMA NOVA RODADA POR SEGUNDO, VALIDADO NO SERVIDOR
-- -------------------------------------------------------------------------
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
  check_at timestamptz := clock_timestamp();
  current_multiplier numeric;
  previous_start timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  stake_value := round(coalesce(p_stake, 0), 2);

  if stake_value < 10 or stake_value > 100000 then
    raise exception 'Invalid Crash stake';
  end if;

  -- Se já existe uma operação, nunca cobra uma segunda entrada. Primeiro
  -- recupera/resolve a sessão existente; rate limit vale apenas para NOVAS.
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

  -- A linha por usuário funciona como mutex: requisições concorrentes da mesma
  -- conta são serializadas antes de qualquer débito na carteira.
  insert into public.crash_regime_rate_limits (
    user_id,
    last_start_at,
    created_at,
    updated_at
  ) values (
    auth.uid(),
    null,
    check_at,
    check_at
  )
  on conflict (user_id) do nothing;

  select last_start_at into previous_start
  from public.crash_regime_rate_limits
  where user_id = auth.uid()
  for update;

  if previous_start is not null
     and check_at - previous_start < interval '1 second' then
    raise exception 'Crash rate limit: wait 1 second between rounds';
  end if;

  update public.crash_regime_rate_limits
  set last_start_at = check_at,
      updated_at = check_at
  where user_id = auth.uid();

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
      'phase', '2.0.1c',
      'security', 'min_cashout_1.10_rate_limit'
    )
  );

  -- O cronômetro só começa depois que o débito foi confirmado.
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

-- -------------------------------------------------------------------------
-- 3) CASHOUT: PROÍBE RETIRADA ANTES DE 1.10x NO RELÓGIO DO SERVIDOR
-- -------------------------------------------------------------------------
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

  -- Primeiro o servidor verifica se o crash secreto já aconteceu.
  if current_multiplier >= session_row.crash_point then
    return public._crash_regime_settle_loss(
      session_row.id,
      'lost_on_cashout',
      check_at
    );
  end if;

  -- HOTFIX 2.0.1c: o menor crash atual é 1.05x. Antes, o cliente podia sacar
  -- em 1.01–1.04x e obter lucro sem risco. A comparação usa o valor BRUTO do
  -- relógio server-side (antes do arredondamento), então 1.095x não vira 1.10x.
  if current_multiplier < 1.10::numeric then
    raise exception 'Crash cashout locked until 1.10x';
  end if;

  cashout_value := round(current_multiplier, 2);
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
      'phase', '2.0.1c',
      'resolution', 'cashout',
      'multiplier', cashout_value,
      'minCashout', 1.10
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

  -- Preserva o comportamento da 3.8.2c: monta o comprovante e elimina o
  -- segredo da tabela de sessão depois da liquidação.
  public_result := public._crash_regime_public_state(
    session_row,
    final_profile,
    'cashout',
    check_at
  );

  delete from public.crash_regime_sessions
  where id = session_row.id;

  return public_result;
exception
  when unique_violation then
    raise exception 'Crash payout already settled';
end;
$$;

-- -------------------------------------------------------------------------
-- 4) SUPERFÍCIE DE API: HELPERS PRIVADOS, SOMENTE 3 RPCs AO JOGADOR
-- -------------------------------------------------------------------------
revoke all on function public._crash_regime_generate_point()
from public, anon, authenticated;
revoke all on function public._crash_regime_multiplier_at(timestamptz, timestamptz)
from public, anon, authenticated;
revoke all on function public._crash_regime_public_state(public.crash_regime_sessions, public.profiles, text, timestamptz)
from public, anon, authenticated;
revoke all on function public._crash_regime_record_round(public.crash_regime_sessions, text)
from public, anon, authenticated;
revoke all on function public._crash_regime_settle_loss(uuid, text, timestamptz)
from public, anon, authenticated;

revoke all on function public.get_crash_regime(uuid)
from public, anon, authenticated;
revoke all on function public.start_crash_regime(numeric)
from public, anon, authenticated;
revoke all on function public.cashout_crash_regime(uuid)
from public, anon, authenticated;

grant execute on function public.get_crash_regime(uuid) to authenticated;
grant execute on function public.start_crash_regime(numeric) to authenticated;
grant execute on function public.cashout_crash_regime(uuid) to authenticated;

comment on table public.crash_regime_rate_limits is
  'Estado privado de rate limit do Crash do Regime. Clientes não possuem acesso direto.';
comment on function public.start_crash_regime(numeric) is
  'TaihenBet 2.0.1c: start autoritativo com mutex/rate limit de 1 segundo por conta.';
comment on function public.cashout_crash_regime(uuid) is
  'TaihenBet 2.0.1c: cashout autoritativo; retirada bloqueada antes de 1.10x server-side.';

commit;
