begin;

-- ============================================================
-- TAIHENBET 2.0 — FASE 3.22
-- FEED / MURAL DE ATIVIDADES DA COMUNIDADE
-- Execute depois da Fase 3.21.
-- ============================================================

-- -------------------------------------------------------------------------
-- 1. Registro público de atividades
-- -------------------------------------------------------------------------

create table if not exists public.community_activity_events (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null,
  activity_group text not null,
  entity_type text,
  entity_id text,
  action_text text not null,
  detail_text text not null default '',
  page text,
  source_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint community_activity_type_check check (
    activity_type in (
      'museum_post',
      'museum_comment',
      'achievement',
      'mission',
      'season_mission',
      'season_tier',
      'title_equipped',
      'cosmetic_equipped'
    )
  ),
  constraint community_activity_group_check check (
    activity_group in ('museum', 'progress', 'season', 'profile')
  )
);

create index if not exists community_activity_created_idx
  on public.community_activity_events (created_at desc, id desc);
create index if not exists community_activity_group_created_idx
  on public.community_activity_events (activity_group, created_at desc, id desc);
create index if not exists community_activity_user_created_idx
  on public.community_activity_events (user_id, created_at desc, id desc);

alter table public.community_activity_events enable row level security;
revoke all on table public.community_activity_events from anon, authenticated;

-- O feed público é lido somente por RPC. Isso evita expor colunas internas
-- ou futuros metadados que não deveriam virar API pública por acidente.

-- -------------------------------------------------------------------------
-- 2. Helpers internos
-- -------------------------------------------------------------------------

create or replace function public._feed_achievement_name(p_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_key
    when 'primeiro_bilhete' then 'Primeiro sacrifício'
    when 'analista_bahrein' then 'Analista do Bahrein'
    when 'primeira_vitoria' then 'Milagre estatístico'
    when 'cliente_banca' then 'Cliente preferencial'
    when 'domador_taigrinho' then 'Domador de Taigrinho'
    when 'agronomo_risco' then 'Agricultura de risco'
    when 'fugitivo_regime' then 'Fuga do regime'
    when 'joquei_mambo' then 'Protocolo Mambo'
    when 'investidor_questionavel' then 'Investidor questionável'
    when 'inimigo_banca' then 'Inimigo da banca'
    when 'veterano_ruina' then 'Veterano da ruína'
    else coalesce(nullif(trim(p_key), ''), 'Conquista classificada')
  end;
$$;

revoke all on function public._feed_achievement_name(text) from public;

create or replace function public._feed_title_name(p_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_key
    when 'primeiro_bilhete' then 'Apostador de Schrödinger'
    when 'analista_bahrein' then 'Especialista em Futebol Bareinita'
    when 'primeira_vitoria' then 'Milagre Estatístico'
    when 'cliente_banca' then 'Cliente Preferencial da Banca'
    when 'domador_taigrinho' then 'Domador de Taigrinho'
    when 'agronomo_risco' then 'Agrônomo de Risco'
    when 'fugitivo_regime' then 'Fugitivo do Regime'
    when 'joquei_mambo' then 'Jóquei do Protocolo Mambo'
    when 'investidor_questionavel' then 'Investidor Questionável'
    when 'inimigo_banca' then 'Inimigo da Banca'
    when 'veterano_ruina' then 'Veterano da Ruína'
    else coalesce(nullif(trim(p_key), ''), 'Título classificado')
  end;
$$;

revoke all on function public._feed_title_name(text) from public;

create or replace function public._record_community_activity(
  p_user_id uuid,
  p_activity_type text,
  p_activity_group text,
  p_entity_type text,
  p_entity_id text,
  p_action_text text,
  p_detail_text text,
  p_page text,
  p_source_key text,
  p_metadata jsonb default '{}'::jsonb,
  p_created_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or nullif(trim(coalesce(p_source_key, '')), '') is null then
    return;
  end if;

  insert into public.community_activity_events (
    user_id,
    activity_type,
    activity_group,
    entity_type,
    entity_id,
    action_text,
    detail_text,
    page,
    source_key,
    metadata,
    created_at
  ) values (
    p_user_id,
    p_activity_type,
    p_activity_group,
    nullif(trim(coalesce(p_entity_type, '')), ''),
    nullif(trim(coalesce(p_entity_id, '')), ''),
    left(trim(coalesce(p_action_text, 'registrou uma atividade.')), 300),
    left(trim(coalesce(p_detail_text, '')), 800),
    nullif(trim(coalesce(p_page, '')), ''),
    trim(p_source_key),
    coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_created_at, now())
  )
  on conflict (source_key) do nothing;
end;
$$;

revoke all on function public._record_community_activity(uuid,text,text,text,text,text,text,text,text,jsonb,timestamptz) from public;

-- -------------------------------------------------------------------------
-- 3. Triggers — novas atividades daqui para frente
-- -------------------------------------------------------------------------

create or replace function public._feed_after_achievement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._record_community_activity(
    new.user_id,
    'achievement',
    'progress',
    'achievement',
    new.achievement_key,
    'desbloqueou “' || public._feed_achievement_name(new.achievement_key) || '”.',
    'A banca registrou mais uma linha no currículo oficial de decisões questionáveis.',
    'progresso',
    'achievement:' || new.user_id::text || ':' || new.achievement_key,
    jsonb_build_object('achievement_key', new.achievement_key),
    new.unlocked_at
  );
  return new;
end;
$$;

revoke all on function public._feed_after_achievement() from public;

drop trigger if exists taihenbet_feed_achievement on public.user_achievements;
create trigger taihenbet_feed_achievement
after insert on public.user_achievements
for each row execute function public._feed_after_achievement();

create or replace function public._feed_after_museum_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_should_record boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_record := new.status = 'published';
  elsif tg_op = 'UPDATE' then
    v_should_record := new.status = 'published' and old.status is distinct from 'published';
  end if;

  if v_should_record then
    perform public._record_community_activity(
      new.user_id,
      'museum_post',
      'museum',
      'museum_post',
      new.id::text,
      'publicou “' || left(new.title, 90) || '” no Museu.',
      left(coalesce(new.description, ''), 320),
      'museu',
      'museum_post:' || new.id::text,
      jsonb_build_object('post_id', new.id, 'category', new.category, 'media_type', new.media_type),
      new.created_at
    );
  end if;
  return new;
end;
$$;

revoke all on function public._feed_after_museum_post() from public;

drop trigger if exists taihenbet_feed_museum_post on public.museum_posts;
create trigger taihenbet_feed_museum_post
after insert or update of status on public.museum_posts
for each row execute function public._feed_after_museum_post();

create or replace function public._feed_after_museum_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_should_record boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_record := new.status = 'published';
  elsif tg_op = 'UPDATE' then
    v_should_record := new.status = 'published' and old.status is distinct from 'published';
  end if;

  if v_should_record then
    select mp.title into v_title
    from public.museum_posts mp
    where mp.id = new.post_id;

    perform public._record_community_activity(
      new.user_id,
      'museum_comment',
      'museum',
      'museum_comment',
      new.id::text,
      'comentou em “' || left(coalesce(v_title, 'uma relíquia'), 90) || '”.',
      '“' || left(new.comment, 260) || '”',
      'museu',
      'museum_comment:' || new.id::text,
      jsonb_build_object('post_id', new.post_id, 'comment_id', new.id),
      new.created_at
    );
  end if;
  return new;
end;
$$;

revoke all on function public._feed_after_museum_comment() from public;

drop trigger if exists taihenbet_feed_museum_comment on public.museum_comments;
create trigger taihenbet_feed_museum_comment
after insert or update of status on public.museum_comments
for each row execute function public._feed_after_museum_comment();

create or replace function public._feed_after_mission_claim()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_def record;
  v_cadence text;
begin
  select * into v_def
  from public._mission_definitions() d
  where d.id = new.mission_id;

  v_cadence := case when coalesce(v_def.cadence, '') = 'weekly' then 'semanal' else 'diária' end;

  perform public._record_community_activity(
    new.user_id,
    'mission',
    'progress',
    'mission',
    new.mission_id,
    'concluiu a missão ' || v_cadence || ' “' || coalesce(v_def.title, new.mission_id) || '”.',
    '+' || trim(to_char(coalesce(new.reward_coins, 0), 'FM999999990D00')) || ' TaiCoins foram liberadas pela banca.',
    'missoes',
    'mission:' || new.id::text,
    jsonb_build_object('mission_id', new.mission_id, 'period_key', new.period_key),
    new.claimed_at
  );
  return new;
end;
$$;

revoke all on function public._feed_after_mission_claim() from public;

drop trigger if exists taihenbet_feed_mission_claim on public.user_mission_claims;
create trigger taihenbet_feed_mission_claim
after insert on public.user_mission_claims
for each row execute function public._feed_after_mission_claim();

create or replace function public._feed_after_season_mission_claim()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mission public.season_missions;
  v_season public.seasons;
begin
  select * into v_mission
  from public.season_missions m
  where m.season_id = new.season_id and m.mission_id = new.mission_id;

  select * into v_season
  from public.seasons s
  where s.id = new.season_id;

  perform public._record_community_activity(
    new.user_id,
    'season_mission',
    'season',
    'season_mission',
    new.season_id || ':' || new.mission_id,
    'arquivou o objetivo sazonal “' || coalesce(v_mission.title, new.mission_id) || '”.',
    '+' || coalesce(new.reward_points, 0)::text || ' pts de prestígio na ' || coalesce(v_season.name, 'temporada atual') || '.',
    'evento',
    'season_mission:' || new.season_id || ':' || new.user_id::text || ':' || new.mission_id,
    jsonb_build_object('season_id', new.season_id, 'mission_id', new.mission_id, 'reward_points', new.reward_points),
    new.claimed_at
  );
  return new;
end;
$$;

revoke all on function public._feed_after_season_mission_claim() from public;

drop trigger if exists taihenbet_feed_season_mission on public.user_season_mission_claims;
create trigger taihenbet_feed_season_mission
after insert on public.user_season_mission_claims
for each row execute function public._feed_after_season_mission_claim();

create or replace function public._feed_after_season_tier_claim()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier public.season_reward_tiers;
  v_season public.seasons;
begin
  select * into v_tier
  from public.season_reward_tiers t
  where t.season_id = new.season_id and t.tier_key = new.tier_key;

  select * into v_season
  from public.seasons s
  where s.id = new.season_id;

  perform public._record_community_activity(
    new.user_id,
    'season_tier',
    'season',
    'season_tier',
    new.season_id || ':' || new.tier_key,
    'alcançou o marco “' || coalesce(v_tier.name, new.tier_key) || '”.',
    coalesce(v_season.name, 'A temporada') || ' reconheceu oficialmente o estrago.',
    'evento',
    'season_tier:' || new.season_id || ':' || new.user_id::text || ':' || new.tier_key,
    jsonb_build_object('season_id', new.season_id, 'tier_key', new.tier_key, 'points_required', v_tier.points_required),
    new.claimed_at
  );
  return new;
end;
$$;

revoke all on function public._feed_after_season_tier_claim() from public;

drop trigger if exists taihenbet_feed_season_tier on public.user_season_tier_claims;
create trigger taihenbet_feed_season_tier
after insert on public.user_season_tier_claims
for each row execute function public._feed_after_season_tier_claim();

create or replace function public._feed_after_profile_display_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if new.equipped_title_key is distinct from old.equipped_title_key
     and new.equipped_title_key is not null then
    perform public._record_community_activity(
      new.id,
      'title_equipped',
      'profile',
      'profile_title',
      new.equipped_title_key,
      'passou a usar o título “' || public._feed_title_name(new.equipped_title_key) || '”.',
      'A identidade pública recebeu mais um carimbo oficial.',
      'perfil-publico',
      'title_equipped:' || new.id::text || ':' || new.equipped_title_key,
      jsonb_build_object('achievement_key', new.equipped_title_key),
      now()
    );
  end if;

  if new.equipped_avatar_frame is distinct from old.equipped_avatar_frame
     and new.equipped_avatar_frame is not null then
    select c.name into v_name from public.cosmetic_catalog c where c.id = new.equipped_avatar_frame;
    perform public._record_community_activity(
      new.id, 'cosmetic_equipped', 'profile', 'cosmetic', new.equipped_avatar_frame,
      'equipou “' || coalesce(v_name, new.equipped_avatar_frame) || '” no perfil.',
      'A TaiShop agradece por transformar dinheiro fictício em estética questionável.',
      'perfil-publico',
      'cosmetic_equipped:' || new.id::text || ':avatar_frame:' || new.equipped_avatar_frame,
      jsonb_build_object('category', 'avatar_frame', 'cosmetic_id', new.equipped_avatar_frame), now()
    );
  end if;

  if new.equipped_name_color is distinct from old.equipped_name_color
     and new.equipped_name_color is not null then
    select c.name into v_name from public.cosmetic_catalog c where c.id = new.equipped_name_color;
    perform public._record_community_activity(
      new.id, 'cosmetic_equipped', 'profile', 'cosmetic', new.equipped_name_color,
      'equipou “' || coalesce(v_name, new.equipped_name_color) || '” no perfil.',
      'A TaiShop aprovou oficialmente a alteração cromática.',
      'perfil-publico',
      'cosmetic_equipped:' || new.id::text || ':name_color:' || new.equipped_name_color,
      jsonb_build_object('category', 'name_color', 'cosmetic_id', new.equipped_name_color), now()
    );
  end if;

  if new.equipped_profile_effect is distinct from old.equipped_profile_effect
     and new.equipped_profile_effect is not null then
    select c.name into v_name from public.cosmetic_catalog c where c.id = new.equipped_profile_effect;
    perform public._record_community_activity(
      new.id, 'cosmetic_equipped', 'profile', 'cosmetic', new.equipped_profile_effect,
      'equipou “' || coalesce(v_name, new.equipped_profile_effect) || '” no perfil.',
      'A apresentação pública ficou desnecessariamente mais cara.',
      'perfil-publico',
      'cosmetic_equipped:' || new.id::text || ':profile_effect:' || new.equipped_profile_effect,
      jsonb_build_object('category', 'profile_effect', 'cosmetic_id', new.equipped_profile_effect), now()
    );
  end if;

  if new.equipped_badge is distinct from old.equipped_badge
     and new.equipped_badge is not null then
    select c.name into v_name from public.cosmetic_catalog c where c.id = new.equipped_badge;
    perform public._record_community_activity(
      new.id, 'cosmetic_equipped', 'profile', 'cosmetic', new.equipped_badge,
      'equipou o selo “' || coalesce(v_name, new.equipped_badge) || '”.',
      'O currículo público recebeu mais uma decoração sem valor jurídico.',
      'perfil-publico',
      'cosmetic_equipped:' || new.id::text || ':badge:' || new.equipped_badge,
      jsonb_build_object('category', 'badge', 'cosmetic_id', new.equipped_badge), now()
    );
  end if;

  return new;
end;
$$;

revoke all on function public._feed_after_profile_display_change() from public;

drop trigger if exists taihenbet_feed_profile_display on public.profiles;
create trigger taihenbet_feed_profile_display
after update of equipped_title_key, equipped_avatar_frame, equipped_name_color, equipped_profile_effect, equipped_badge
on public.profiles
for each row execute function public._feed_after_profile_display_change();

-- -------------------------------------------------------------------------
-- 4. Backfill — o mural já nasce com o passado recente do site
-- -------------------------------------------------------------------------

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select
  ua.user_id,
  'achievement', 'progress', 'achievement', ua.achievement_key,
  'desbloqueou “' || public._feed_achievement_name(ua.achievement_key) || '”.',
  'A banca registrou mais uma linha no currículo oficial de decisões questionáveis.',
  'progresso',
  'achievement:' || ua.user_id::text || ':' || ua.achievement_key,
  jsonb_build_object('achievement_key', ua.achievement_key),
  ua.unlocked_at
from public.user_achievements ua
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select
  mp.user_id,
  'museum_post', 'museum', 'museum_post', mp.id::text,
  'publicou “' || left(mp.title, 90) || '” no Museu.',
  left(coalesce(mp.description, ''), 320),
  'museu',
  'museum_post:' || mp.id::text,
  jsonb_build_object('post_id', mp.id, 'category', mp.category, 'media_type', mp.media_type),
  mp.created_at
from public.museum_posts mp
where mp.status = 'published'
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select
  mc.user_id,
  'museum_comment', 'museum', 'museum_comment', mc.id::text,
  'comentou em “' || left(mp.title, 90) || '”.',
  '“' || left(mc.comment, 260) || '”',
  'museu',
  'museum_comment:' || mc.id::text,
  jsonb_build_object('post_id', mc.post_id, 'comment_id', mc.id),
  mc.created_at
from public.museum_comments mc
join public.museum_posts mp on mp.id = mc.post_id
where mc.status = 'published' and mp.status = 'published'
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select
  c.user_id,
  'mission', 'progress', 'mission', c.mission_id,
  'concluiu a missão ' || case when d.cadence = 'weekly' then 'semanal' else 'diária' end || ' “' || d.title || '”.',
  '+' || trim(to_char(coalesce(c.reward_coins, 0), 'FM999999990D00')) || ' TaiCoins foram liberadas pela banca.',
  'missoes',
  'mission:' || c.id::text,
  jsonb_build_object('mission_id', c.mission_id, 'period_key', c.period_key),
  c.claimed_at
from public.user_mission_claims c
join public._mission_definitions() d on d.id = c.mission_id
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select
  c.user_id,
  'season_mission', 'season', 'season_mission', c.season_id || ':' || c.mission_id,
  'arquivou o objetivo sazonal “' || m.title || '”.',
  '+' || c.reward_points::text || ' pts de prestígio na ' || s.name || '.',
  'evento',
  'season_mission:' || c.season_id || ':' || c.user_id::text || ':' || c.mission_id,
  jsonb_build_object('season_id', c.season_id, 'mission_id', c.mission_id, 'reward_points', c.reward_points),
  c.claimed_at
from public.user_season_mission_claims c
join public.season_missions m on m.season_id = c.season_id and m.mission_id = c.mission_id
join public.seasons s on s.id = c.season_id
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select
  c.user_id,
  'season_tier', 'season', 'season_tier', c.season_id || ':' || c.tier_key,
  'alcançou o marco “' || t.name || '”.',
  s.name || ' reconheceu oficialmente o estrago.',
  'evento',
  'season_tier:' || c.season_id || ':' || c.user_id::text || ':' || c.tier_key,
  jsonb_build_object('season_id', c.season_id, 'tier_key', c.tier_key, 'points_required', t.points_required),
  c.claimed_at
from public.user_season_tier_claims c
join public.season_reward_tiers t on t.season_id = c.season_id and t.tier_key = c.tier_key
join public.seasons s on s.id = c.season_id
on conflict (source_key) do nothing;

-- Estado atual do título/equipamentos entra uma única vez como referência inicial.
insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select
  p.id,
  'title_equipped', 'profile', 'profile_title', p.equipped_title_key,
  'passou a usar o título “' || public._feed_title_name(p.equipped_title_key) || '”.',
  'A identidade pública recebeu mais um carimbo oficial.',
  'perfil-publico',
  'title_equipped:' || p.id::text || ':' || p.equipped_title_key,
  jsonb_build_object('achievement_key', p.equipped_title_key),
  coalesce(p.updated_at, p.created_at, now())
from public.profiles p
where p.equipped_title_key is not null
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select p.id, 'cosmetic_equipped', 'profile', 'cosmetic', c.id,
  'equipou “' || c.name || '” no perfil.',
  'A TaiShop aprovou oficialmente mais uma decisão estética.',
  'perfil-publico',
  'cosmetic_equipped:' || p.id::text || ':avatar_frame:' || c.id,
  jsonb_build_object('category', 'avatar_frame', 'cosmetic_id', c.id),
  coalesce(p.updated_at, p.created_at, now())
from public.profiles p
join public.cosmetic_catalog c on c.id = p.equipped_avatar_frame
where p.equipped_avatar_frame is not null
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select p.id, 'cosmetic_equipped', 'profile', 'cosmetic', c.id,
  'equipou “' || c.name || '” no perfil.',
  'A TaiShop aprovou oficialmente mais uma decisão estética.',
  'perfil-publico',
  'cosmetic_equipped:' || p.id::text || ':name_color:' || c.id,
  jsonb_build_object('category', 'name_color', 'cosmetic_id', c.id),
  coalesce(p.updated_at, p.created_at, now())
from public.profiles p
join public.cosmetic_catalog c on c.id = p.equipped_name_color
where p.equipped_name_color is not null
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select p.id, 'cosmetic_equipped', 'profile', 'cosmetic', c.id,
  'equipou “' || c.name || '” no perfil.',
  'A TaiShop aprovou oficialmente mais uma decisão estética.',
  'perfil-publico',
  'cosmetic_equipped:' || p.id::text || ':profile_effect:' || c.id,
  jsonb_build_object('category', 'profile_effect', 'cosmetic_id', c.id),
  coalesce(p.updated_at, p.created_at, now())
from public.profiles p
join public.cosmetic_catalog c on c.id = p.equipped_profile_effect
where p.equipped_profile_effect is not null
on conflict (source_key) do nothing;

insert into public.community_activity_events (
  user_id, activity_type, activity_group, entity_type, entity_id,
  action_text, detail_text, page, source_key, metadata, created_at
)
select p.id, 'cosmetic_equipped', 'profile', 'cosmetic', c.id,
  'equipou o selo “' || c.name || '”.',
  'O currículo público recebeu mais uma decoração sem valor jurídico.',
  'perfil-publico',
  'cosmetic_equipped:' || p.id::text || ':badge:' || c.id,
  jsonb_build_object('category', 'badge', 'cosmetic_id', c.id),
  coalesce(p.updated_at, p.created_at, now())
from public.profiles p
join public.cosmetic_catalog c on c.id = p.equipped_badge
where p.equipped_badge is not null
on conflict (source_key) do nothing;

-- -------------------------------------------------------------------------
-- 5. RPC pública do Feed
-- -------------------------------------------------------------------------

create or replace function public.get_community_activity_feed(
  p_filter text default 'all',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id bigint,
  user_id uuid,
  username text,
  avatar_key text,
  role text,
  equipped_title_key text,
  activity_type text,
  activity_group text,
  entity_type text,
  entity_id text,
  action_text text,
  detail_text text,
  page text,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_filter text := lower(trim(coalesce(p_filter, 'all')));
  v_limit integer := least(50, greatest(1, coalesce(p_limit, 20)));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
begin
  if v_filter not in ('all', 'museum', 'progress', 'season', 'profile') then
    raise exception 'FEED_FILTER_INVALID';
  end if;

  return query
  select
    e.id,
    e.user_id,
    coalesce(nullif(trim(p.username), ''), 'Cliente da banca')::text as username,
    p.avatar_key,
    p.role::text,
    p.equipped_title_key,
    e.activity_type,
    e.activity_group,
    e.entity_type,
    e.entity_id,
    e.action_text,
    e.detail_text,
    e.page,
    e.metadata,
    e.created_at
  from public.community_activity_events e
  join public.profiles p on p.id = e.user_id
  where coalesce(p.is_suspended, false) = false
    and (v_filter = 'all' or e.activity_group = v_filter)
    and (
      e.activity_type <> 'museum_post'
      or exists (
        select 1
        from public.museum_posts mp
        where mp.id::text = e.entity_id and mp.status = 'published'
      )
    )
    and (
      e.activity_type <> 'museum_comment'
      or exists (
        select 1
        from public.museum_comments mc
        join public.museum_posts mp on mp.id = mc.post_id
        where mc.id::text = e.entity_id
          and mc.status = 'published'
          and mp.status = 'published'
      )
    )
  order by e.created_at desc, e.id desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.get_community_activity_feed(text,integer,integer) from public;
grant execute on function public.get_community_activity_feed(text,integer,integer) to anon, authenticated;

commit;
