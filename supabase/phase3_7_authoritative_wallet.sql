-- TaihenBet 2.0 — Fase 3.7
-- Carteira autoritativa + ledger de movimentações.
-- Execute DEPOIS das fases 3.4 e 3.6.

begin;

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  kind text not null,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint wallet_amount_nonzero check (amount <> 0),
  constraint wallet_balance_nonnegative check (balance_after >= 0),
  constraint wallet_kind_check check (kind in (
    'sports_stake', 'sports_payout',
    'game_stake', 'game_payout',
    'ad_reward', 'daily_bonus',
    'admin_adjustment', 'legacy_snapshot'
  ))
);

create unique index if not exists wallet_transactions_unique_external
on public.wallet_transactions(user_id, kind, external_id)
where external_id is not null;

create index if not exists wallet_transactions_user_created
on public.wallet_transactions(user_id, created_at desc);

alter table public.wallet_transactions enable row level security;

drop policy if exists "users read own wallet transactions" on public.wallet_transactions;
create policy "users read own wallet transactions"
on public.wallet_transactions
for select
to authenticated
using (auth.uid() = user_id);

revoke all on table public.wallet_transactions from anon, authenticated;
grant select on table public.wallet_transactions to authenticated;

-- Função interna: aplica uma mutação com lock pessimista no perfil.
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
  safe_amount numeric(14,2);
  next_balance numeric(14,2);
begin
  safe_amount := round(coalesce(p_amount, 0), 2);

  if safe_amount = 0 then
    raise exception 'Zero-value wallet mutation';
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

  next_balance := round(current_profile.balance + safe_amount, 2);

  if next_balance < 0 then
    raise exception 'Insufficient TaiCoins';
  end if;

  if next_balance > 10000000 then
    raise exception 'TaiCoin ceiling exceeded';
  end if;

  update public.profiles
  set balance = next_balance
  where id = p_user_id
  returning * into result;

  insert into public.wallet_transactions (
    user_id, amount, balance_after, kind, external_id, metadata
  ) values (
    p_user_id,
    safe_amount,
    next_balance,
    p_kind,
    nullif(trim(coalesce(p_external_id, '')), ''),
    coalesce(p_metadata, '{}'::jsonb)
  );

  return result;
end;
$$;

-- Débito atômico para apostas/jogos.
create or replace function public.spend_taicoins(
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
  safe_amount numeric(14,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_kind not in ('sports_stake', 'game_stake') then
    raise exception 'Invalid debit kind';
  end if;

  safe_amount := round(coalesce(p_amount, 0), 2);

  if safe_amount < 10 or safe_amount > 100000 then
    raise exception 'Invalid stake';
  end if;

  if nullif(trim(coalesce(p_external_id, '')), '') is null then
    raise exception 'External id required';
  end if;

  return public._wallet_apply(
    auth.uid(),
    -safe_amount,
    p_kind,
    p_external_id,
    p_metadata
  );
exception
  when unique_violation then
    raise exception 'Duplicate wallet operation';
end;
$$;

-- Pagamento de jogo: exige um débito anterior com o mesmo id e só paga uma vez.
-- Nesta fase o valor ainda nasce da lógica do minigame no cliente, mas o banco
-- impõe vínculo com a entrada, idempotência e teto de 50x. A RNG autoritativa
-- entra na fase seguinte.
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
  stake numeric(14,2);
  payout numeric(14,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  payout := round(coalesce(p_amount, 0), 2);

  if payout <= 0 then
    raise exception 'Invalid payout';
  end if;

  select abs(amount) into stake
  from public.wallet_transactions
  where user_id = auth.uid()
    and kind = 'game_stake'
    and external_id = p_external_id
  limit 1;

  if stake is null then
    raise exception 'Matching game stake not found';
  end if;

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

-- Pagamento esportivo: mesma ideia, mas com teto maior por causa das combinadas.
create or replace function public.credit_sports_payout(
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
  stake numeric(14,2);
  payout numeric(14,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  payout := round(coalesce(p_amount, 0), 2);

  if payout <= 0 then
    raise exception 'Invalid payout';
  end if;

  select abs(amount) into stake
  from public.wallet_transactions
  where user_id = auth.uid()
    and kind = 'sports_stake'
    and external_id = p_external_id
  limit 1;

  if stake is null then
    raise exception 'Matching sports stake not found';
  end if;

  if payout > stake * 250 then
    raise exception 'Sports payout exceeds safety cap';
  end if;

  return public._wallet_apply(
    auth.uid(), payout, 'sports_payout', p_external_id, p_metadata
  );
exception
  when unique_violation then
    raise exception 'Sports payout already settled';
end;
$$;

-- Recompensa do anúncio: valor fixo e cooldown no servidor.
create or replace function public.claim_ad_reward(
  p_external_id text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  last_claim timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(coalesce(p_external_id, '')), '') is null then
    raise exception 'External id required';
  end if;

  select max(created_at) into last_claim
  from public.wallet_transactions
  where user_id = auth.uid()
    and kind = 'ad_reward';

  if last_claim is not null and last_claim > now() - interval '30 seconds' then
    raise exception 'Reward cooldown active';
  end if;

  return public._wallet_apply(
    auth.uid(), 20, 'ad_reward', p_external_id,
    jsonb_build_object('source', 'rewarded_ad')
  );
exception
  when unique_violation then
    raise exception 'Ad reward already claimed';
end;
$$;

-- Bênção diária: uma vez por dia no servidor.
create or replace function public.claim_daily_bonus(
  p_claim_date date default current_date
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  key text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_claim_date <> current_date then
    raise exception 'Invalid bonus date';
  end if;

  key := to_char(current_date, 'YYYY-MM-DD');

  return public._wallet_apply(
    auth.uid(), 250, 'daily_bonus', key,
    jsonb_build_object('claim_date', key)
  );
exception
  when unique_violation then
    raise exception 'Daily bonus already claimed';
end;
$$;

-- Admin pode fazer ajustes manuais, sempre auditados no ledger.
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

  if abs(round(coalesce(p_amount, 0), 2)) > 1000000 then
    raise exception 'Adjustment too large';
  end if;

  return public._wallet_apply(
    p_user_id,
    p_amount,
    'admin_adjustment',
    gen_random_uuid()::text,
    jsonb_build_object('admin_id', auth.uid(), 'note', coalesce(p_note, ''))
  );
end;
$$;

-- Snapshot inicial para o ledger sem alterar saldo.
insert into public.wallet_transactions (user_id, amount, balance_after, kind, external_id, metadata)
select
  p.id,
  greatest(0.01, p.balance),
  p.balance,
  'legacy_snapshot',
  'phase3.7-opening',
  jsonb_build_object('note', 'Opening balance snapshot; amount is informational')
from public.profiles p
where p.legacy_balance_imported = true
  and p.balance > 0
on conflict do nothing;

-- Atualiza a resolução de saldo legado para também abrir o ledger da conta.
create or replace function public.resolve_legacy_balance(
  p_import_local boolean,
  p_local_balance numeric default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  safe_balance numeric(14, 2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into result
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if result.legacy_balance_imported then
    return result;
  end if;

  if p_import_local then
    safe_balance := round(coalesce(p_local_balance, 0), 2);
    if safe_balance < 0 or safe_balance > 10000000 then
      raise exception 'Invalid legacy balance';
    end if;

    update public.profiles
    set balance = safe_balance,
        legacy_balance_imported = true
    where id = auth.uid()
    returning * into result;
  else
    update public.profiles
    set legacy_balance_imported = true
    where id = auth.uid()
    returning * into result;
  end if;

  if result.balance > 0 then
    insert into public.wallet_transactions (
      user_id, amount, balance_after, kind, external_id, metadata
    ) values (
      result.id, result.balance, result.balance, 'legacy_snapshot',
      'phase3.7-opening', jsonb_build_object('note', 'Opening balance')
    ) on conflict do nothing;
  end if;

  return result;
end;
$$;

-- Mata a ponte perigosa da fase 3.4: navegador não pode mais definir saldo arbitrário.
revoke execute on function public.sync_my_balance(numeric) from authenticated;

revoke all on function public._wallet_apply(uuid, numeric, text, text, jsonb) from public;
revoke all on function public.spend_taicoins(numeric, text, text, jsonb) from public;
revoke all on function public.credit_game_payout(text, numeric, jsonb) from public;
revoke all on function public.credit_sports_payout(text, numeric, jsonb) from public;
revoke all on function public.claim_ad_reward(text) from public;
revoke all on function public.claim_daily_bonus(date) from public;
revoke all on function public.admin_adjust_wallet(uuid, numeric, text) from public;

grant execute on function public.spend_taicoins(numeric, text, text, jsonb) to authenticated;
grant execute on function public.credit_game_payout(text, numeric, jsonb) to authenticated;
grant execute on function public.credit_sports_payout(text, numeric, jsonb) to authenticated;
grant execute on function public.claim_ad_reward(text) to authenticated;
grant execute on function public.claim_daily_bonus(date) to authenticated;
grant execute on function public.admin_adjust_wallet(uuid, numeric, text) to authenticated;

commit;
