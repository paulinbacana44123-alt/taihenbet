-- TaihenBet 2.0 — Fase 3.16a
-- Hotfix: avatar dos perfis/ranking + estatisticas publicas consistentes com a Fase 3.15
-- Execute DEPOIS de phase3_16_public_profiles.sql.

begin;

-- -------------------------------------------------------------------------
-- 1. Snapshot agregado das estatisticas exibidas pela Fase 3.15
--    O historico completo continua privado. O cliente envia somente totais.
-- -------------------------------------------------------------------------

alter table public.profiles
  add column if not exists public_stats jsonb,
  add column if not exists public_stats_synced_at timestamptz;

create or replace function public.sync_my_public_stats(p_stats jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sports_count bigint;
  v_games_count bigint;
  v_wins bigint;
  v_losses bigint;
  v_pending bigint;
  v_total_staked numeric;
  v_total_payout numeric;
  v_net_profit numeric;
  v_snapshot jsonb;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_stats is null or jsonb_typeof(p_stats) <> 'object' then
    raise exception 'Invalid public stats payload';
  end if;

  begin
    v_sports_count := coalesce((p_stats->>'sports_count')::bigint, 0);
    v_games_count := coalesce((p_stats->>'games_count')::bigint, 0);
    v_wins := coalesce((p_stats->>'wins')::bigint, 0);
    v_losses := coalesce((p_stats->>'losses')::bigint, 0);
    v_pending := coalesce((p_stats->>'pending')::bigint, 0);
    v_total_staked := coalesce((p_stats->>'total_staked')::numeric, 0);
    v_total_payout := coalesce((p_stats->>'total_payout')::numeric, 0);
    v_net_profit := coalesce((p_stats->>'net_profit')::numeric, 0);
  exception
    when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'Invalid numeric value in public stats payload';
  end;

  if v_sports_count < 0
     or v_games_count < 0
     or v_wins < 0
     or v_losses < 0
     or v_pending < 0
     or v_sports_count > 1000000
     or v_games_count > 1000000
     or v_wins > 2000000
     or v_losses > 2000000
     or v_pending > 1000000
     or abs(v_total_staked) > 1000000000000
     or abs(v_total_payout) > 1000000000000
     or abs(v_net_profit) > 1000000000000 then
    raise exception 'Public stats payload outside accepted limits';
  end if;

  v_snapshot := jsonb_build_object(
    'sports_count', v_sports_count,
    'games_count', v_games_count,
    'wins', v_wins,
    'losses', v_losses,
    'pending', v_pending,
    'total_staked', v_total_staked,
    'total_payout', v_total_payout,
    'net_profit', v_net_profit
  );

  update public.profiles
  set public_stats = v_snapshot,
      public_stats_synced_at = now()
  where id = v_uid;

  return v_snapshot;
end;
$$;

revoke all on function public.sync_my_public_stats(jsonb) from public;
grant execute on function public.sync_my_public_stats(jsonb) to authenticated;

-- -------------------------------------------------------------------------
-- 2. Ranking v2 passa a preferir o snapshot da mesma fonte usada na 3.15.
--    Se uma conta ainda nao abriu a versao nova, mantemos os dados antigos
--    como fallback, sem quebrar o ranking.
-- -------------------------------------------------------------------------

create or replace function public.get_public_ranking_v2()
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
  net_profit numeric,
  equipped_title_key text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    r.id,
    r.username,
    r.avatar_key,
    r.role,
    r.balance,
    r.joined_at,
    coalesce((p.public_stats->>'sports_count')::bigint, r.sports_count),
    coalesce((p.public_stats->>'games_count')::bigint, r.games_count),
    coalesce((p.public_stats->>'wins')::bigint, r.wins),
    coalesce((p.public_stats->>'losses')::bigint, r.losses),
    coalesce((p.public_stats->>'pending')::bigint, r.pending),
    coalesce((p.public_stats->>'total_staked')::numeric, r.total_staked),
    coalesce((p.public_stats->>'total_payout')::numeric, r.total_payout),
    coalesce((p.public_stats->>'net_profit')::numeric, r.net_profit),
    p.equipped_title_key
  from public.get_public_ranking() r
  join public.profiles p on p.id = r.id
  order by
    r.balance desc,
    coalesce((p.public_stats->>'wins')::bigint, r.wins) desc,
    r.joined_at asc;
$$;

revoke all on function public.get_public_ranking_v2() from public;
grant execute on function public.get_public_ranking_v2() to anon, authenticated;

-- -------------------------------------------------------------------------
-- 3. Perfil publico passa a consumir o ranking v2 corrigido.
-- -------------------------------------------------------------------------

create or replace function public.get_public_profile(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_profile record;
  v_ranking record;
  v_achievements jsonb := '[]'::jsonb;
  v_museum_count bigint := 0;
  v_tai_messages_count bigint := 0;
begin
  if p_user_id is null then
    return null;
  end if;

  select
    p.id,
    p.username,
    p.avatar_key,
    p.role,
    p.created_at,
    p.public_bio,
    p.public_banner_url,
    p.equipped_title_key
  into v_profile
  from public.profiles p
  where p.id = p_user_id;

  if not found then
    return null;
  end if;

  select *
  into v_ranking
  from public.get_public_ranking_v2() r
  where r.id = p_user_id
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'achievement_key', ua.achievement_key,
        'unlocked_at', ua.unlocked_at
      )
      order by ua.unlocked_at desc
    ),
    '[]'::jsonb
  )
  into v_achievements
  from public.user_achievements ua
  where ua.user_id = p_user_id;

  if to_regclass('public.museum_posts') is not null then
    execute
      'select count(*) from public.museum_posts where user_id = $1 and status = ''published'''
      into v_museum_count
      using p_user_id;
  end if;

  if to_regclass('public.tai_messages') is not null then
    execute
      'select count(*) from public.tai_messages where user_id = $1 and status = ''published'''
      into v_tai_messages_count
      using p_user_id;
  end if;

  return jsonb_build_object(
    'id', v_profile.id,
    'username', coalesce(nullif(trim(v_profile.username), ''), 'Cliente da banca'),
    'avatar_key', v_profile.avatar_key,
    'role', v_profile.role,
    'joined_at', v_profile.created_at,
    'public_bio', coalesce(v_profile.public_bio, ''),
    'public_banner_url', v_profile.public_banner_url,
    'equipped_title_key', v_profile.equipped_title_key,
    'balance', coalesce(v_ranking.balance, 0),
    'sports_count', coalesce(v_ranking.sports_count, 0),
    'games_count', coalesce(v_ranking.games_count, 0),
    'wins', coalesce(v_ranking.wins, 0),
    'losses', coalesce(v_ranking.losses, 0),
    'pending', coalesce(v_ranking.pending, 0),
    'total_staked', coalesce(v_ranking.total_staked, 0),
    'total_payout', coalesce(v_ranking.total_payout, 0),
    'net_profit', coalesce(v_ranking.net_profit, 0),
    'achievements', v_achievements,
    'museum_posts_count', coalesce(v_museum_count, 0),
    'tai_messages_count', coalesce(v_tai_messages_count, 0)
  );
end;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;

commit;
