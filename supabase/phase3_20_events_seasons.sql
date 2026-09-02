begin;

-- ============================================================
-- TAIHENBET 2.0 — FASE 3.20
-- EVENTOS / TEMPORADAS
-- Execute DEPOIS da Fase 3.19.
-- ============================================================

-- -------------------------------------------------------------------------
-- 1. Estrutura sazonal
-- -------------------------------------------------------------------------

create table if not exists public.seasons (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint seasons_dates_check check (ends_at > starts_at)
);

create table if not exists public.season_missions (
  season_id text not null references public.seasons(id) on delete cascade,
  mission_id text not null,
  title text not null,
  description text not null,
  icon text not null default '◆',
  metric text not null,
  target numeric(14,2) not null,
  reward_coins numeric(14,2) not null default 0,
  reward_points integer not null default 0,
  sort_order integer not null default 0,
  primary key (season_id, mission_id),
  constraint season_missions_metric_check
    check (metric in ('game_play', 'sports_bet', 'taicoins_spent', 'daily_claims', 'season_claims')),
  constraint season_missions_target_check check (target > 0),
  constraint season_missions_rewards_check check (reward_coins >= 0 and reward_points >= 0)
);

create table if not exists public.season_reward_tiers (
  season_id text not null references public.seasons(id) on delete cascade,
  tier_key text not null,
  name text not null,
  points_required integer not null,
  reward_coins numeric(14,2) not null default 0,
  reward_cosmetic_id text references public.cosmetic_catalog(id) on delete restrict,
  sort_order integer not null default 0,
  primary key (season_id, tier_key),
  constraint season_reward_points_check check (points_required > 0),
  constraint season_reward_coins_check check (reward_coins >= 0)
);

create table if not exists public.season_point_ledger (
  id bigserial primary key,
  season_id text not null references public.seasons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  source_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint season_point_amount_check check (amount > 0),
  unique (season_id, user_id, source_key)
);

create table if not exists public.user_season_mission_claims (
  season_id text not null references public.seasons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id text not null,
  reward_coins numeric(14,2) not null default 0,
  reward_points integer not null default 0,
  claimed_at timestamptz not null default now(),
  primary key (season_id, user_id, mission_id),
  foreign key (season_id, mission_id)
    references public.season_missions(season_id, mission_id)
    on delete cascade
);

create table if not exists public.user_season_tier_claims (
  season_id text not null references public.seasons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier_key text not null,
  reward_coins numeric(14,2) not null default 0,
  reward_cosmetic_id text,
  claimed_at timestamptz not null default now(),
  primary key (season_id, user_id, tier_key),
  foreign key (season_id, tier_key)
    references public.season_reward_tiers(season_id, tier_key)
    on delete cascade
);

create index if not exists season_point_ledger_rank_idx
  on public.season_point_ledger (season_id, user_id, created_at desc);
create index if not exists season_mission_claims_user_idx
  on public.user_season_mission_claims (user_id, season_id, claimed_at desc);
create index if not exists season_tier_claims_user_idx
  on public.user_season_tier_claims (user_id, season_id, claimed_at desc);

alter table public.seasons enable row level security;
alter table public.season_missions enable row level security;
alter table public.season_reward_tiers enable row level security;
alter table public.season_point_ledger enable row level security;
alter table public.user_season_mission_claims enable row level security;
alter table public.user_season_tier_claims enable row level security;

revoke all on table public.seasons from anon, authenticated;
revoke all on table public.season_missions from anon, authenticated;
revoke all on table public.season_reward_tiers from anon, authenticated;
revoke all on table public.season_point_ledger from anon, authenticated;
revoke all on table public.user_season_mission_claims from anon, authenticated;
revoke all on table public.user_season_tier_claims from anon, authenticated;

grant select on table public.seasons to anon, authenticated;
grant select on table public.season_missions to anon, authenticated;
grant select on table public.season_reward_tiers to anon, authenticated;
grant select on table public.season_point_ledger to authenticated;
grant select on table public.user_season_mission_claims to authenticated;
grant select on table public.user_season_tier_claims to authenticated;

drop policy if exists "public reads seasons" on public.seasons;
create policy "public reads seasons"
on public.seasons for select to anon, authenticated
using (true);

drop policy if exists "public reads season missions" on public.season_missions;
create policy "public reads season missions"
on public.season_missions for select to anon, authenticated
using (true);

drop policy if exists "public reads season tiers" on public.season_reward_tiers;
create policy "public reads season tiers"
on public.season_reward_tiers for select to anon, authenticated
using (true);

drop policy if exists "users read own season points" on public.season_point_ledger;
create policy "users read own season points"
on public.season_point_ledger for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "users read own season mission claims" on public.user_season_mission_claims;
create policy "users read own season mission claims"
on public.user_season_mission_claims for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "users read own season tier claims" on public.user_season_tier_claims;
create policy "users read own season tier claims"
on public.user_season_tier_claims for select to authenticated
using (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 2. Temporada piloto: Era da Mandioca
--
-- O primeiro RUN inicia a temporada às 00:00 de Brasília do mesmo dia e
-- preserva as datas em execuções futuras do patch.
-- -------------------------------------------------------------------------

insert into public.seasons (
  id,
  name,
  subtitle,
  description,
  starts_at,
  ends_at,
  active,
  sort_order
)
values (
  'season_mandioca_pilot',
  'Temporada Piloto — Era da Mandioca',
  'A primeira safra oficialmente auditada pela banca',
  'Complete objetivos temporários, resgate pontos de prestígio e dispute o ranking sazonal antes que o departamento agrícola perceba o que aconteceu.',
  ((timezone('America/Sao_Paulo', now()))::date::timestamp at time zone 'America/Sao_Paulo'),
  ((timezone('America/Sao_Paulo', now()))::date::timestamp at time zone 'America/Sao_Paulo') + interval '28 days',
  true,
  10
)
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  description = excluded.description,
  active = true,
  sort_order = excluded.sort_order;

insert into public.season_missions (
  season_id, mission_id, title, description, icon, metric,
  target, reward_coins, reward_points, sort_order
)
values
  (
    'season_mandioca_pilot', 'season_games_8',
    'Expedição à Colheita',
    'Conclua 8 partidas nos Jogos da Entidade durante a temporada.',
    '🎲', 'game_play', 8, 60, 80, 10
  ),
  (
    'season_mandioca_pilot', 'season_sports_4',
    'Agrônomo de Odds',
    'Registre 4 bilhetes esportivos antes do fim da safra.',
    '1X2', 'sports_bet', 4, 60, 80, 20
  ),
  (
    'season_mandioca_pilot', 'season_spend_300',
    'Queima de Verba Agrícola',
    'Gaste 300 TaiCoins em apostas, jogos ou compras durante o evento.',
    '−T', 'taicoins_spent', 300, 75, 100, 30
  ),
  (
    'season_mandioca_pilot', 'season_daily_3',
    'Funcionário Sazonal',
    'Resgate 3 missões diárias enquanto a temporada estiver ativa.',
    '✓', 'daily_claims', 3, 80, 120, 40
  ),
  (
    'season_mandioca_pilot', 'season_claims_3',
    'Comitê da Safra',
    'Resgate 3 missões desta temporada para provar comprometimento administrativo.',
    '◆', 'season_claims', 3, 100, 120, 50
  )
on conflict (season_id, mission_id) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  metric = excluded.metric,
  target = excluded.target,
  reward_coins = excluded.reward_coins,
  reward_points = excluded.reward_points,
  sort_order = excluded.sort_order;

-- -------------------------------------------------------------------------
-- 3. Recompensa cosmética sazonal e trilha de marcos
-- -------------------------------------------------------------------------

insert into public.cosmetic_catalog (
  id, category, name, description, price, rarity, sort_order, active, shop_visible
)
values (
  'badge_season_mandioca',
  'badge',
  'Sobrevivente da Safra',
  'Selo permanente da primeira temporada da TaihenBet. Não vendido, não reembolsável e agronomicamente suspeito.',
  0,
  'Sazonal',
  910,
  true,
  false
)
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  rarity = excluded.rarity,
  sort_order = excluded.sort_order,
  active = excluded.active,
  shop_visible = excluded.shop_visible;

insert into public.season_reward_tiers (
  season_id, tier_key, name, points_required,
  reward_coins, reward_cosmetic_id, sort_order
)
values
  ('season_mandioca_pilot', 'sprout', 'Broto Homologado', 100, 50, null, 10),
  ('season_mandioca_pilot', 'harvest', 'Colheita Registrada', 250, 100, null, 20),
  ('season_mandioca_pilot', 'legendary_harvest', 'Safra Lendária', 500, 150, 'badge_season_mandioca', 30)
on conflict (season_id, tier_key) do update set
  name = excluded.name,
  points_required = excluded.points_required,
  reward_coins = excluded.reward_coins,
  reward_cosmetic_id = excluded.reward_cosmetic_id,
  sort_order = excluded.sort_order;

-- -------------------------------------------------------------------------
-- 4. Ledger autoritativo de pontos sazonais
-- -------------------------------------------------------------------------

create or replace function public._award_season_points(
  p_season_id text,
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_source_key text,
  p_metadata jsonb default '{}'::jsonb,
  p_created_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id text := trim(coalesce(p_season_id, ''));
  v_source text := trim(coalesce(p_source_key, ''));
  v_reason text := trim(coalesce(p_reason, ''));
  v_amount integer := greatest(0, coalesce(p_amount, 0));
begin
  if v_season_id = '' or p_user_id is null or v_source = '' or v_reason = '' or v_amount <= 0 then
    return;
  end if;

  insert into public.season_point_ledger (
    season_id, user_id, amount, reason, source_key, metadata, created_at
  ) values (
    v_season_id,
    p_user_id,
    v_amount,
    left(v_reason, 120),
    left(v_source, 240),
    coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_created_at, now())
  )
  on conflict (season_id, user_id, source_key) do nothing;
end;
$$;

revoke all on function public._award_season_points(text, uuid, integer, text, text, jsonb, timestamptz) from public;

-- Missões normais da Fase 3.19 também alimentam a temporada:
-- diária = +10 pts; semanal = +40 pts.
create or replace function public._season_points_from_regular_mission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season record;
  v_points integer := 0;
begin
  select s.* into v_season
  from public.seasons s
  where s.active = true
    and new.claimed_at >= s.starts_at
    and new.claimed_at < s.ends_at
  order by s.starts_at desc, s.sort_order desc
  limit 1;

  if not found then
    return new;
  end if;

  if left(new.mission_id, 6) = 'daily_' then
    v_points := 10;
  elsif left(new.mission_id, 7) = 'weekly_' then
    v_points := 40;
  else
    return new;
  end if;

  perform public._award_season_points(
    v_season.id,
    new.user_id,
    v_points,
    'regular_mission',
    'regular_mission:' || new.mission_id || ':' || new.period_key,
    jsonb_build_object(
      'mission_id', new.mission_id,
      'period_key', new.period_key,
      'source', 'phase3_19'
    ),
    new.claimed_at
  );

  return new;
end;
$$;

revoke all on function public._season_points_from_regular_mission() from public;

drop trigger if exists taihenbet_season_regular_mission on public.user_mission_claims;
create trigger taihenbet_season_regular_mission
after insert on public.user_mission_claims
for each row execute function public._season_points_from_regular_mission();

-- Backfill idempotente para missões 3.19 já resgatadas no mesmo dia em que
-- a primeira temporada começou.
insert into public.season_point_ledger (
  season_id, user_id, amount, reason, source_key, metadata, created_at
)
select
  s.id,
  c.user_id,
  case
    when left(c.mission_id, 6) = 'daily_' then 10
    when left(c.mission_id, 7) = 'weekly_' then 40
    else 0
  end,
  'regular_mission',
  'regular_mission:' || c.mission_id || ':' || c.period_key,
  jsonb_build_object(
    'mission_id', c.mission_id,
    'period_key', c.period_key,
    'source', 'phase3_19_backfill'
  ),
  c.claimed_at
from public.user_mission_claims c
join public.seasons s
  on s.id = 'season_mandioca_pilot'
 and c.claimed_at >= s.starts_at
 and c.claimed_at < s.ends_at
where left(c.mission_id, 6) = 'daily_'
   or left(c.mission_id, 7) = 'weekly_'
on conflict (season_id, user_id, source_key) do nothing;

-- -------------------------------------------------------------------------
-- 5. Hub sazonal: estado, ranking, missões, marcos e arquivo
-- -------------------------------------------------------------------------

create or replace function public.get_my_season_hub()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_season public.seasons;
  v_points integer := 0;
  v_rank integer := 0;
  v_participants integer := 0;
  v_claimed integer := 0;
  v_missions jsonb := '[]'::jsonb;
  v_tiers jsonb := '[]'::jsonb;
  v_leaderboard jsonb := '[]'::jsonb;
  v_archive jsonb := '[]'::jsonb;
  v_badge_owned boolean := false;
  v_badge_equipped boolean := false;
  v_badge_name text := 'Sobrevivente da Safra';
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select * into v_season
  from public.seasons s
  where s.active = true
    and now() >= s.starts_at
    and now() < s.ends_at
  order by s.starts_at desc, s.sort_order desc
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'subtitle', s.subtitle,
        'starts_at', s.starts_at,
        'ends_at', s.ends_at,
        'points', coalesce((
          select sum(l.amount)::integer
          from public.season_point_ledger l
          where l.season_id = s.id and l.user_id = v_uid
        ), 0)
      )
      order by s.ends_at desc
    ),
    '[]'::jsonb
  )
  into v_archive
  from public.seasons s
  where s.ends_at <= now()
     or s.active = false;

  if not found or v_season.id is null then
    return jsonb_build_object(
      'active', null,
      'missions', '[]'::jsonb,
      'tiers', '[]'::jsonb,
      'leaderboard', '[]'::jsonb,
      'archive', v_archive,
      'summary', jsonb_build_object('points', 0, 'rank', 0, 'participants', 0, 'season_missions_claimed', 0),
      'special_reward', jsonb_build_object('id', 'badge_season_mandioca', 'name', v_badge_name, 'owned', false, 'equipped', false)
    );
  end if;

  select coalesce(sum(l.amount), 0)::integer
  into v_points
  from public.season_point_ledger l
  where l.season_id = v_season.id
    and l.user_id = v_uid;

  select count(*)::integer
  into v_claimed
  from public.user_season_mission_claims c
  where c.season_id = v_season.id
    and c.user_id = v_uid;

  select coalesce(jsonb_agg(row_data order by sort_order), '[]'::jsonb)
  into v_missions
  from (
    select
      m.sort_order,
      jsonb_build_object(
        'id', m.mission_id,
        'title', m.title,
        'description', m.description,
        'icon', m.icon,
        'metric', m.metric,
        'target', m.target,
        'reward_coins', m.reward_coins,
        'reward_points', m.reward_points,
        'progress', progress_value,
        'claimed', claimed_value,
        'claimable', (not claimed_value and progress_value >= m.target)
      ) as row_data
    from public.season_missions m
    cross join lateral (
      select
        case m.metric
          when 'daily_claims' then (
            select count(*)::numeric
            from public.user_mission_claims c
            where c.user_id = v_uid
              and left(c.mission_id, 6) = 'daily_'
              and c.claimed_at >= v_season.starts_at
              and c.claimed_at < v_season.ends_at
          )
          when 'season_claims' then (
            select count(*)::numeric
            from public.user_season_mission_claims c
            where c.user_id = v_uid
              and c.season_id = v_season.id
          )
          else (
            select coalesce(sum(e.amount), 0)::numeric
            from public.mission_events e
            where e.user_id = v_uid
              and e.event_type = m.metric
              and e.created_at >= v_season.starts_at
              and e.created_at < v_season.ends_at
          )
        end as progress_value,
        exists (
          select 1
          from public.user_season_mission_claims c
          where c.user_id = v_uid
            and c.season_id = v_season.id
            and c.mission_id = m.mission_id
        ) as claimed_value
    ) values_for_user
    where m.season_id = v_season.id
  ) q;

  select coalesce(jsonb_agg(row_data order by sort_order), '[]'::jsonb)
  into v_tiers
  from (
    select
      t.sort_order,
      jsonb_build_object(
        'tier_key', t.tier_key,
        'name', t.name,
        'points_required', t.points_required,
        'reward_coins', t.reward_coins,
        'reward_cosmetic_id', t.reward_cosmetic_id,
        'reward_cosmetic_name', c.name,
        'claimed', exists (
          select 1
          from public.user_season_tier_claims tc
          where tc.user_id = v_uid
            and tc.season_id = v_season.id
            and tc.tier_key = t.tier_key
        ),
        'claimable', v_points >= t.points_required and not exists (
          select 1
          from public.user_season_tier_claims tc
          where tc.user_id = v_uid
            and tc.season_id = v_season.id
            and tc.tier_key = t.tier_key
        )
      ) as row_data
    from public.season_reward_tiers t
    left join public.cosmetic_catalog c on c.id = t.reward_cosmetic_id
    where t.season_id = v_season.id
  ) q;

  with scores as (
    select l.user_id, sum(l.amount)::integer as points
    from public.season_point_ledger l
    where l.season_id = v_season.id
    group by l.user_id
  ),
  ranked as (
    select
      s.user_id,
      s.points,
      (row_number() over (order by s.points desc, s.user_id))::integer as rank
    from scores s
  ),
  top_users as (
    select
      r.user_id,
      r.points,
      r.rank,
      p.username,
      p.avatar_key,
      p.role,
      p.equipped_title_key
    from ranked r
    join public.profiles p on p.id = r.user_id
    order by r.rank asc, p.username asc
    limit 10
  )
  select
    coalesce((select count(*)::integer from scores), 0),
    coalesce((select r.rank from ranked r where r.user_id = v_uid), 0),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id', u.user_id,
          'username', u.username,
          'avatar_key', u.avatar_key,
          'role', u.role,
          'equipped_title_key', u.equipped_title_key,
          'points', u.points,
          'rank', u.rank
        )
        order by u.rank asc, u.username asc
      )
      from top_users u
    ), '[]'::jsonb)
  into v_participants, v_rank, v_leaderboard;

  select c.name into v_badge_name
  from public.cosmetic_catalog c
  where c.id = 'badge_season_mandioca';

  select exists (
    select 1
    from public.user_cosmetics uc
    where uc.user_id = v_uid
      and uc.cosmetic_id = 'badge_season_mandioca'
  ) into v_badge_owned;

  select coalesce(p.equipped_badge = 'badge_season_mandioca', false)
  into v_badge_equipped
  from public.profiles p
  where p.id = v_uid;

  return jsonb_build_object(
    'active', jsonb_build_object(
      'id', v_season.id,
      'name', v_season.name,
      'subtitle', v_season.subtitle,
      'description', v_season.description,
      'starts_at', v_season.starts_at,
      'ends_at', v_season.ends_at
    ),
    'missions', v_missions,
    'tiers', v_tiers,
    'leaderboard', v_leaderboard,
    'archive', v_archive,
    'summary', jsonb_build_object(
      'points', v_points,
      'rank', v_rank,
      'participants', v_participants,
      'season_missions_claimed', v_claimed
    ),
    'special_reward', jsonb_build_object(
      'id', 'badge_season_mandioca',
      'name', coalesce(v_badge_name, 'Sobrevivente da Safra'),
      'owned', v_badge_owned,
      'equipped', v_badge_equipped
    )
  );
end;
$$;

revoke all on function public.get_my_season_hub() from public;
grant execute on function public.get_my_season_hub() to authenticated;

-- -------------------------------------------------------------------------
-- 6. Resgate de missão sazonal
-- -------------------------------------------------------------------------

create or replace function public.claim_my_season_mission(p_mission_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id text := trim(coalesce(p_mission_id, ''));
  v_season public.seasons;
  v_mission public.season_missions;
  v_progress numeric := 0;
  v_profile public.profiles;
  v_suspended boolean := false;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select * into v_season
  from public.seasons s
  where s.active = true
    and now() >= s.starts_at
    and now() < s.ends_at
  order by s.starts_at desc, s.sort_order desc
  limit 1;

  if not found then
    raise exception 'NO_ACTIVE_SEASON';
  end if;

  select * into v_mission
  from public.season_missions m
  where m.season_id = v_season.id
    and m.mission_id = v_id;

  if not found then
    raise exception 'SEASON_MISSION_NOT_FOUND';
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

  if exists (
    select 1 from public.user_season_mission_claims c
    where c.season_id = v_season.id
      and c.user_id = v_uid
      and c.mission_id = v_id
  ) then
    raise exception 'SEASON_MISSION_ALREADY_CLAIMED';
  end if;

  if v_mission.metric = 'daily_claims' then
    select count(*)::numeric into v_progress
    from public.user_mission_claims c
    where c.user_id = v_uid
      and left(c.mission_id, 6) = 'daily_'
      and c.claimed_at >= v_season.starts_at
      and c.claimed_at < v_season.ends_at;
  elsif v_mission.metric = 'season_claims' then
    select count(*)::numeric into v_progress
    from public.user_season_mission_claims c
    where c.user_id = v_uid
      and c.season_id = v_season.id;
  else
    select coalesce(sum(e.amount), 0)::numeric into v_progress
    from public.mission_events e
    where e.user_id = v_uid
      and e.event_type = v_mission.metric
      and e.created_at >= v_season.starts_at
      and e.created_at < v_season.ends_at;
  end if;

  if coalesce(v_progress, 0) < v_mission.target then
    raise exception 'SEASON_MISSION_NOT_COMPLETE';
  end if;

  insert into public.user_season_mission_claims (
    season_id, user_id, mission_id, reward_coins, reward_points
  ) values (
    v_season.id,
    v_uid,
    v_id,
    v_mission.reward_coins,
    v_mission.reward_points
  );

  if v_mission.reward_coins > 0 then
    v_profile := public._wallet_apply(
      v_uid,
      v_mission.reward_coins,
      'admin_adjustment',
      'season_mission:' || v_season.id || ':' || v_uid::text || ':' || v_id,
      jsonb_build_object(
        'source', 'season',
        'operation', 'season_mission_reward',
        'season_id', v_season.id,
        'mission_id', v_id,
        'reward_coins', v_mission.reward_coins,
        'reward_points', v_mission.reward_points
      )
    );
  else
    select * into v_profile from public.profiles p where p.id = v_uid;
  end if;

  perform public._award_season_points(
    v_season.id,
    v_uid,
    v_mission.reward_points,
    'season_mission',
    'season_mission:' || v_id,
    jsonb_build_object('mission_id', v_id),
    now()
  );

  perform public._notify_user(
    v_uid,
    'season',
    'Objetivo sazonal concluído',
    v_mission.title || ' foi arquivada. +' || v_mission.reward_points::text ||
      ' pts e +' || trim(to_char(v_mission.reward_coins, 'FM999999990D00')) || ' TaiCoins foram liberados.',
    'evento',
    v_id,
    jsonb_build_object(
      'season_id', v_season.id,
      'mission_id', v_id,
      'reward_points', v_mission.reward_points,
      'reward_coins', v_mission.reward_coins
    )
  );

  return jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'reward_points', v_mission.reward_points,
    'reward_coins', v_mission.reward_coins,
    'state', public.get_my_season_hub()
  );
exception
  when unique_violation then
    raise exception 'SEASON_MISSION_ALREADY_CLAIMED';
end;
$$;

revoke all on function public.claim_my_season_mission(text) from public;
grant execute on function public.claim_my_season_mission(text) to authenticated;

-- -------------------------------------------------------------------------
-- 7. Resgate da trilha de marcos
-- -------------------------------------------------------------------------

create or replace function public.claim_my_season_tier(p_tier_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_key text := trim(coalesce(p_tier_key, ''));
  v_season public.seasons;
  v_tier public.season_reward_tiers;
  v_points integer := 0;
  v_profile public.profiles;
  v_suspended boolean := false;
  v_cosmetic_name text := null;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select * into v_season
  from public.seasons s
  where s.active = true
    and now() >= s.starts_at
    and now() < s.ends_at
  order by s.starts_at desc, s.sort_order desc
  limit 1;

  if not found then
    raise exception 'NO_ACTIVE_SEASON';
  end if;

  select * into v_tier
  from public.season_reward_tiers t
  where t.season_id = v_season.id
    and t.tier_key = v_key;

  if not found then
    raise exception 'SEASON_TIER_NOT_FOUND';
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

  if exists (
    select 1 from public.user_season_tier_claims c
    where c.season_id = v_season.id
      and c.user_id = v_uid
      and c.tier_key = v_key
  ) then
    raise exception 'SEASON_TIER_ALREADY_CLAIMED';
  end if;

  select coalesce(sum(l.amount), 0)::integer
  into v_points
  from public.season_point_ledger l
  where l.season_id = v_season.id
    and l.user_id = v_uid;

  if v_points < v_tier.points_required then
    raise exception 'SEASON_TIER_NOT_REACHED';
  end if;

  insert into public.user_season_tier_claims (
    season_id, user_id, tier_key, reward_coins, reward_cosmetic_id
  ) values (
    v_season.id,
    v_uid,
    v_key,
    v_tier.reward_coins,
    v_tier.reward_cosmetic_id
  );

  if v_tier.reward_coins > 0 then
    v_profile := public._wallet_apply(
      v_uid,
      v_tier.reward_coins,
      'admin_adjustment',
      'season_tier:' || v_season.id || ':' || v_uid::text || ':' || v_key,
      jsonb_build_object(
        'source', 'season',
        'operation', 'season_tier_reward',
        'season_id', v_season.id,
        'tier_key', v_key,
        'reward_coins', v_tier.reward_coins
      )
    );
  else
    select * into v_profile from public.profiles p where p.id = v_uid;
  end if;

  if v_tier.reward_cosmetic_id is not null then
    insert into public.user_cosmetics (user_id, cosmetic_id)
    values (v_uid, v_tier.reward_cosmetic_id)
    on conflict (user_id, cosmetic_id) do nothing;

    select c.name into v_cosmetic_name
    from public.cosmetic_catalog c
    where c.id = v_tier.reward_cosmetic_id;
  end if;

  perform public._notify_user(
    v_uid,
    'season',
    'Marco sazonal resgatado',
    case
      when v_tier.reward_cosmetic_id is not null then
        v_tier.name || ': +' || trim(to_char(v_tier.reward_coins, 'FM999999990D00')) ||
        ' TaiCoins e o selo ' || coalesce(v_cosmetic_name, 'sazonal') || ' foram liberados.'
      else
        v_tier.name || ': +' || trim(to_char(v_tier.reward_coins, 'FM999999990D00')) ||
        ' TaiCoins foram liberados.'
    end,
    'evento',
    v_key,
    jsonb_build_object(
      'season_id', v_season.id,
      'tier_key', v_key,
      'reward_coins', v_tier.reward_coins,
      'reward_cosmetic_id', v_tier.reward_cosmetic_id
    )
  );

  return jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'reward_coins', v_tier.reward_coins,
    'reward_cosmetic_id', v_tier.reward_cosmetic_id,
    'reward_cosmetic_name', v_cosmetic_name,
    'state', public.get_my_season_hub()
  );
exception
  when unique_violation then
    raise exception 'SEASON_TIER_ALREADY_CLAIMED';
end;
$$;

revoke all on function public.claim_my_season_tier(text) from public;
grant execute on function public.claim_my_season_tier(text) to authenticated;

-- -------------------------------------------------------------------------
-- 8. Equipar o selo final sem mandar o usuário para um item oculto da loja
-- -------------------------------------------------------------------------

create or replace function public.set_my_season_badge(p_enabled boolean)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_suspended boolean := false;
  v_enabled boolean := coalesce(p_enabled, false);
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

  if v_enabled and not exists (
    select 1 from public.user_cosmetics uc
    where uc.user_id = v_uid
      and uc.cosmetic_id = 'badge_season_mandioca'
  ) then
    raise exception 'SEASON_BADGE_NOT_OWNED';
  end if;

  update public.profiles
  set equipped_badge = case
    when v_enabled then 'badge_season_mandioca'
    when equipped_badge = 'badge_season_mandioca' then null
    else equipped_badge
  end
  where id = v_uid
  returning * into v_profile;

  perform public._notify_user(
    v_uid,
    'season',
    case when v_enabled then 'Selo sazonal equipado' else 'Selo sazonal removido' end,
    case when v_enabled
      then 'Sobrevivente da Safra agora acompanha sua ficha pública.'
      else 'O selo Sobrevivente da Safra saiu da sua ficha pública.'
    end,
    'evento',
    'badge_season_mandioca',
    jsonb_build_object('enabled', v_enabled, 'cosmetic_id', 'badge_season_mandioca')
  );

  return v_profile;
end;
$$;

revoke all on function public.set_my_season_badge(boolean) from public;
grant execute on function public.set_my_season_badge(boolean) to authenticated;

commit;
