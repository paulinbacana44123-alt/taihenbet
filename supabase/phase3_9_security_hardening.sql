-- TaihenBet 2.0 — Fase 3.9
-- Endurecimento da banca apos os quatro Jogos da Entidade virarem autoritativos.
-- Execute DEPOIS da Fase 3.8.3.
--
-- Objetivos:
--   * fechar a antiga ponte generica de payout de minigame;
--   * impedir que saldo local arbitrario seja importado por novas contas;
--   * restringir leitura direta de profiles a dono/admin;
--   * manter ledger e game_rounds somente leitura para dono/admin;
--   * reafirmar que tabelas de sessao secreta nao sao API publica;
--   * validar melhor as mutacoes internas da carteira;
--   * manter o ranking de jogos baseado em game_rounds autoritativo.
--
-- IMPORTANTE: apostas esportivas ainda pertencem ao sistema legado e continuam
-- usando credit_sports_payout. Elas serao migradas separadamente; esta fase nao
-- finge que esse modulo ja e autoritativo.

begin;

-- -------------------------------------------------------------------------
-- 1. Helper de autorizacao para policies e paineis administrativos
-- -------------------------------------------------------------------------

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select p.role = 'admin'
    from public.profiles p
    where p.id = auth.uid()
    limit 1
  ), false);
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

-- -------------------------------------------------------------------------
-- 2. Profiles: deixa de ser uma tabela enumeravel por anonimo
-- -------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "profiles public read" on public.profiles;
drop policy if exists "profiles own or admin read" on public.profiles;

create policy "profiles own or admin read"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.is_current_user_admin()
);

revoke select on table public.profiles from anon;
grant select on table public.profiles to authenticated;

-- Mantem somente username/avatar editaveis diretamente pelo dono.
revoke update on table public.profiles from anon;
revoke update (balance, role, legacy_balance_imported, created_at, updated_at)
on public.profiles from authenticated;
grant update (username, avatar_key) on public.profiles to authenticated;

-- -------------------------------------------------------------------------
-- 3. Ledger + game_rounds: leitura do proprio usuario ou da administracao
-- -------------------------------------------------------------------------

alter table public.wallet_transactions enable row level security;

drop policy if exists "users read own wallet transactions"
on public.wallet_transactions;
drop policy if exists "wallet owner or admin read"
on public.wallet_transactions;

create policy "wallet owner or admin read"
on public.wallet_transactions
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_current_user_admin()
);

revoke all on table public.wallet_transactions from anon;
revoke insert, update, delete, truncate, references, trigger
on table public.wallet_transactions from authenticated;
grant select on table public.wallet_transactions to authenticated;

alter table public.game_rounds enable row level security;

drop policy if exists "users read own game rounds" on public.game_rounds;
drop policy if exists "game rounds owner or admin read" on public.game_rounds;

create policy "game rounds owner or admin read"
on public.game_rounds
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_current_user_admin()
);

revoke all on table public.game_rounds from anon;
revoke insert, update, delete, truncate, references, trigger
on table public.game_rounds from authenticated;
grant select on table public.game_rounds to authenticated;

-- -------------------------------------------------------------------------
-- 4. Segredos de partida nunca recebem acesso direto do navegador
-- -------------------------------------------------------------------------

alter table if exists public.taimandioca_sessions enable row level security;
alter table if exists public.crash_regime_sessions enable row level security;
alter table if exists public.derby_sessions enable row level security;

revoke all on table public.taimandioca_sessions from anon, authenticated;
revoke all on table public.crash_regime_sessions from anon, authenticated;
revoke all on table public.derby_sessions from anon, authenticated;

-- -------------------------------------------------------------------------
-- 5. Nucleo da carteira: valida parametros mesmo quando chamado por RPC interna
-- -------------------------------------------------------------------------

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
  safe_kind text := lower(trim(coalesce(p_kind, '')));
  safe_external_id text := nullif(trim(coalesce(p_external_id, '')), '');
  safe_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if p_user_id is null then
    raise exception 'Wallet user required';
  end if;

  safe_amount := round(coalesce(p_amount, 0), 2);

  if safe_amount = 0 then
    raise exception 'Zero-value wallet mutation';
  end if;

  if abs(safe_amount) > 10000000 then
    raise exception 'Wallet mutation exceeds safety cap';
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

-- -------------------------------------------------------------------------
-- 6. Mata a ponte generica de aposta/payout dos Jogos da Entidade
-- -------------------------------------------------------------------------

-- Os quatro jogos atuais debitam dentro de suas proprias RPCs autoritativas.
-- spend_taicoins permanece somente para o modulo esportivo legado.
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
  safe_external_id text := nullif(trim(coalesce(p_external_id, '')), '');
  safe_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if lower(trim(coalesce(p_kind, ''))) <> 'sports_stake' then
    raise exception 'Direct game stakes are disabled; use the authoritative game RPC';
  end if;

  safe_amount := round(coalesce(p_amount, 0), 2);

  if safe_amount < 10 or safe_amount > 100000 then
    raise exception 'Invalid stake';
  end if;

  if safe_external_id is null or char_length(safe_external_id) > 160 then
    raise exception 'Invalid external id';
  end if;

  if jsonb_typeof(safe_metadata) <> 'object'
     or octet_length(safe_metadata::text) > 16384 then
    raise exception 'Invalid stake metadata';
  end if;

  return public._wallet_apply(
    auth.uid(),
    -safe_amount,
    'sports_stake',
    safe_external_id,
    safe_metadata
  );
exception
  when unique_violation then
    raise exception 'Duplicate wallet operation';
end;
$$;

revoke all on function public.spend_taicoins(numeric, text, text, jsonb)
from public;
grant execute on function public.spend_taicoins(numeric, text, text, jsonb)
to authenticated;

-- Nao existe mais motivo legitimo para o navegador fabricar um game_payout.
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
begin
  raise exception 'Legacy game payout disabled; use the authoritative game RPC';
end;
$$;

revoke all on function public.credit_game_payout(text, numeric, jsonb)
from public;
revoke execute on function public.credit_game_payout(text, numeric, jsonb)
from anon, authenticated;

-- -------------------------------------------------------------------------
-- 7. Fecha definitivamente a antiga importacao arbitraria de saldo local
-- -------------------------------------------------------------------------

-- A assinatura e preservada para nao quebrar clientes antigos, mas o valor
-- enviado pelo navegador NAO e mais usado. Uma conta ainda nao migrada apenas
-- confirma o saldo que ja existe no banco (normalmente os 1.000 T iniciais).
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

  update public.profiles
  set legacy_balance_imported = true
  where id = auth.uid()
  returning * into result;

  if result.balance > 0 then
    insert into public.wallet_transactions (
      user_id,
      amount,
      balance_after,
      kind,
      external_id,
      metadata
    ) values (
      result.id,
      result.balance,
      result.balance,
      'legacy_snapshot',
      'phase3.9-opening',
      jsonb_build_object(
        'note', 'Server balance confirmed after legacy migration closure'
      )
    ) on conflict do nothing;
  end if;

  return result;
end;
$$;

revoke all on function public.resolve_legacy_balance(boolean, numeric)
from public;
grant execute on function public.resolve_legacy_balance(boolean, numeric)
to authenticated;

-- Mesmo se algum arquivo antigo reaparecer no frontend, a RPC de sincronizar
-- saldo arbitrario continua sem permissao.
revoke execute on function public.sync_my_balance(numeric)
from anon, authenticated;

-- -------------------------------------------------------------------------
-- 8. Ranking: estatisticas dos Jogos da Entidade passam a vir de game_rounds
-- -------------------------------------------------------------------------

create or replace function public.get_public_ranking()
returns table (
  id uuid,
  username text,
  avatar_key text,
  role text,
  balance numeric,
  joined_at timestamptz,
  sports_count bigint,
  games_count bigint,
  wins bigint,
  losses bigint,
  pending bigint,
  total_staked numeric,
  total_payout numeric,
  net_profit numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with profile_rows as (
    select
      p.id,
      p.username,
      p.avatar_key,
      p.role,
      p.balance,
      p.created_at as joined_at,
      coalesce(h.sports_history, '[]'::jsonb) as sports_history
    from public.profiles p
    left join public.user_history_state h on h.user_id = p.id
  ),
  sports_agg as (
    select
      pr.id,
      count(sport.value) as sports_count,
      count(sport.value) filter (where sport.value ->> 'status' = 'Ganhou') as sports_wins,
      count(sport.value) filter (where sport.value ->> 'status' = 'Perdeu') as sports_losses,
      count(sport.value) filter (where sport.value ->> 'status' = 'Pendente') as sports_pending,
      coalesce(sum(
        case
          when coalesce(sport.value ->> 'valor', '') ~ '^-?[0-9]+([.][0-9]+)?$'
            then (sport.value ->> 'valor')::numeric
          else 0
        end
      ), 0) as sports_staked,
      coalesce(sum(
        case
          when sport.value ->> 'status' = 'Ganhou' then
            case
              when coalesce(sport.value ->> 'retornoPago', '') ~ '^-?[0-9]+([.][0-9]+)?$'
                then (sport.value ->> 'retornoPago')::numeric
              when coalesce(sport.value ->> 'retornoEstimado', '') ~ '^-?[0-9]+([.][0-9]+)?$'
                then (sport.value ->> 'retornoEstimado')::numeric
              else 0
            end
          else 0
        end
      ), 0) as sports_payout
    from profile_rows pr
    left join lateral jsonb_array_elements(pr.sports_history) as sport(value) on true
    group by pr.id
  ),
  games_agg as (
    select
      gr.user_id as id,
      count(*)::bigint as games_count,
      count(*) filter (where gr.payout > 0)::bigint as game_wins,
      count(*) filter (where gr.payout <= 0)::bigint as game_losses,
      coalesce(sum(gr.stake), 0)::numeric as games_staked,
      coalesce(sum(gr.payout), 0)::numeric as games_payout
    from public.game_rounds gr
    group by gr.user_id
  )
  select
    pr.id,
    pr.username,
    pr.avatar_key,
    pr.role,
    pr.balance,
    pr.joined_at,
    coalesce(sa.sports_count, 0)::bigint,
    coalesce(ga.games_count, 0)::bigint,
    (coalesce(sa.sports_wins, 0) + coalesce(ga.game_wins, 0))::bigint as wins,
    (coalesce(sa.sports_losses, 0) + coalesce(ga.game_losses, 0))::bigint as losses,
    coalesce(sa.sports_pending, 0)::bigint as pending,
    (coalesce(sa.sports_staked, 0) + coalesce(ga.games_staked, 0))::numeric as total_staked,
    (coalesce(sa.sports_payout, 0) + coalesce(ga.games_payout, 0))::numeric as total_payout,
    (
      coalesce(sa.sports_payout, 0)
      + coalesce(ga.games_payout, 0)
      - coalesce(sa.sports_staked, 0)
      - coalesce(ga.games_staked, 0)
    )::numeric as net_profit
  from profile_rows pr
  left join sports_agg sa on sa.id = pr.id
  left join games_agg ga on ga.id = pr.id
  order by
    pr.balance desc,
    (coalesce(sa.sports_wins, 0) + coalesce(ga.game_wins, 0)) desc,
    pr.joined_at asc;
$$;

revoke all on function public.get_public_ranking() from public;
grant execute on function public.get_public_ranking() to anon, authenticated;

commit;
