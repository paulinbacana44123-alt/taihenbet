-- TaihenBet 2.0 — Fase 3.16
-- Perfis publicos + bio/banner + integracao social
-- Execute DEPOIS da Fase 3.15.

begin;

-- -------------------------------------------------------------------------
-- 1. Campos publicos opcionais do perfil
-- -------------------------------------------------------------------------

alter table public.profiles
  add column if not exists public_bio text not null default '',
  add column if not exists public_banner_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_public_bio_len'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_public_bio_len
      check (char_length(public_bio) <= 320);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_public_banner_url_len'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_public_banner_url_len
      check (
        public_banner_url is null
        or char_length(public_banner_url) <= 700
      );
  end if;
end
$$;

-- -------------------------------------------------------------------------
-- 2. Atualizacao do proprio perfil publico
-- -------------------------------------------------------------------------

create or replace function public.update_my_public_profile(
  p_public_bio text,
  p_public_banner_url text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_bio text := trim(coalesce(p_public_bio, ''));
  v_banner text := nullif(trim(coalesce(p_public_banner_url, '')), '');
  v_suspended boolean := false;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select coalesce(p.is_suspended, false)
  into v_suspended
  from public.profiles p
  where p.id = v_uid;

  if v_suspended then
    raise exception using
      errcode = 'P0001',
      message = 'ACCOUNT_SUSPENDED',
      detail = 'Esta conta foi suspensa pela administracao da TaihenBet.';
  end if;

  if char_length(v_bio) > 320 then
    raise exception 'Bio must contain at most 320 characters';
  end if;

  if v_banner is not null then
    if char_length(v_banner) > 700 then
      raise exception 'Banner URL is too long';
    end if;

    if v_banner !~* '^https?://' then
      raise exception 'Banner URL must use http or https';
    end if;
  end if;

  update public.profiles
  set public_bio = v_bio,
      public_banner_url = v_banner
  where id = v_uid;

  return jsonb_build_object(
    'id', v_uid,
    'public_bio', v_bio,
    'public_banner_url', v_banner
  );
end;
$$;

revoke all on function public.update_my_public_profile(text, text) from public;
grant execute on function public.update_my_public_profile(text, text) to authenticated;

-- -------------------------------------------------------------------------
-- 3. Ranking v2: mesmos numeros da Fase 3.10 + titulo equipado
--    Mantemos get_public_ranking() intacta para nao quebrar nada antigo.
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
    r.sports_count,
    r.games_count,
    r.wins,
    r.losses,
    r.pending,
    r.total_staked,
    r.total_payout,
    r.net_profit,
    p.equipped_title_key
  from public.get_public_ranking() r
  join public.profiles p on p.id = r.id
  order by r.balance desc, r.wins desc, r.joined_at asc;
$$;

revoke all on function public.get_public_ranking_v2() from public;
grant execute on function public.get_public_ranking_v2() to anon, authenticated;

-- -------------------------------------------------------------------------
-- 4. Ficha publica completa
--    Nao retorna e-mail, IDs de apostas, mensagens privadas ou historico bruto.
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
  from public.get_public_ranking() r
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
