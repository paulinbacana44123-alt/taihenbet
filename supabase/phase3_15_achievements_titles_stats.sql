begin;

-- ============================================================
-- TAIHENBET 2.0 - FASE 3.15
-- CONQUISTAS, TITULOS E ESTATISTICAS
-- ============================================================

alter table public.profiles
  add column if not exists equipped_title_key text;

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_key)
);

create index if not exists user_achievements_user_unlocked_idx
  on public.user_achievements (user_id, unlocked_at desc);

alter table public.user_achievements enable row level security;
revoke all on table public.user_achievements from anon, authenticated;

create or replace function public.sync_my_achievements(
  p_keys text[] default array[]::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_allowed constant text[] := array[
    'primeiro_bilhete',
    'analista_bahrein',
    'primeira_vitoria',
    'cliente_banca',
    'domador_taigrinho',
    'agronomo_risco',
    'fugitivo_regime',
    'joquei_mambo',
    'investidor_questionavel',
    'inimigo_banca',
    'veterano_ruina'
  ];
  v_new jsonb := '[]'::jsonb;
  v_all jsonb := '[]'::jsonb;
  v_equipped text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  with requested as (
    select distinct key
    from unnest(coalesce(p_keys, array[]::text[])) as u(key)
    where u.key = any(v_allowed)
  ), inserted as (
    insert into public.user_achievements (user_id, achievement_key)
    select v_uid, r.key
    from requested r
    on conflict (user_id, achievement_key) do nothing
    returning achievement_key, unlocked_at
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'achievement_key', i.achievement_key,
        'unlocked_at', i.unlocked_at
      )
      order by i.unlocked_at
    ),
    '[]'::jsonb
  )
  into v_new
  from inserted i;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'achievement_key', a.achievement_key,
        'unlocked_at', a.unlocked_at
      )
      order by a.unlocked_at
    ),
    '[]'::jsonb
  )
  into v_all
  from public.user_achievements a
  where a.user_id = v_uid;

  select p.equipped_title_key
  into v_equipped
  from public.profiles p
  where p.id = v_uid;

  return jsonb_build_object(
    'achievements', v_all,
    'newly_unlocked', v_new,
    'equipped_title_key', v_equipped
  );
end;
$$;

revoke all on function public.sync_my_achievements(text[]) from public;
grant execute on function public.sync_my_achievements(text[]) to authenticated;

create or replace function public.set_my_equipped_title(
  p_achievement_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_key text := nullif(trim(coalesce(p_achievement_key, '')), '');
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if v_key is not null and not exists (
    select 1
    from public.user_achievements a
    where a.user_id = v_uid
      and a.achievement_key = v_key
  ) then
    raise exception 'Achievement not unlocked';
  end if;

  update public.profiles
  set
    equipped_title_key = v_key,
    updated_at = now()
  where id = v_uid;

  if not found then
    raise exception 'Profile not found';
  end if;

  return jsonb_build_object(
    'equipped_title_key', v_key
  );
end;
$$;

revoke all on function public.set_my_equipped_title(text) from public;
grant execute on function public.set_my_equipped_title(text) to authenticated;

commit;
