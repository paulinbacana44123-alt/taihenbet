begin;

-- ============================================================
-- TAIHENBET 2.0 — FASE 3.19
-- MISSOES DIARIAS E SEMANAIS
-- Execute DEPOIS das Fases 3.17, 3.18 e 3.18a.
-- ============================================================

-- -------------------------------------------------------------------------
-- 1. Eventos autoritativos de progresso
-- -------------------------------------------------------------------------

create table if not exists public.mission_events (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  amount numeric(14,2) not null default 1,
  source_key text not null,
  created_at timestamptz not null default now(),
  constraint mission_events_amount_check check (amount >= 0),
  constraint mission_events_unique_source unique (user_id, event_type, source_key)
);

create index if not exists mission_events_user_time_idx
  on public.mission_events (user_id, created_at desc);
create index if not exists mission_events_user_type_time_idx
  on public.mission_events (user_id, event_type, created_at desc);

create table if not exists public.user_mission_claims (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id text not null,
  period_key text not null,
  reward_coins numeric(14,2) not null default 0,
  reward_cosmetic_id text null,
  claimed_at timestamptz not null default now(),
  constraint user_mission_claims_reward_check check (reward_coins >= 0),
  constraint user_mission_claims_unique unique (user_id, mission_id, period_key)
);

create index if not exists user_mission_claims_user_time_idx
  on public.user_mission_claims (user_id, claimed_at desc);

alter table public.mission_events enable row level security;
alter table public.user_mission_claims enable row level security;

revoke all on table public.mission_events from anon, authenticated;
revoke all on table public.user_mission_claims from anon, authenticated;
grant select on table public.mission_events to authenticated;
grant select on table public.user_mission_claims to authenticated;

drop policy if exists "users read own mission events" on public.mission_events;
create policy "users read own mission events"
on public.mission_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users read own mission claims" on public.user_mission_claims;
create policy "users read own mission claims"
on public.user_mission_claims
for select
to authenticated
using (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 2. Badge exclusivo da missão semanal
-- -------------------------------------------------------------------------

alter table public.cosmetic_catalog
  add column if not exists shop_visible boolean not null default true;

insert into public.cosmetic_catalog
  (id, category, name, description, price, rarity, sort_order, active, shop_visible)
values
  (
    'badge_weekly_auditor',
    'badge',
    'Auditor da Semana',
    'Badge exclusivo concedido pelo RH da banca a quem completou cinco missões diárias dentro da mesma semana.',
    0,
    'Exclusivo',
    900,
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

-- A TaiShop continua exibindo só os 12 itens compráveis. O badge de missão
-- permanece ativo para poder ser equipado, mas não aparece no catálogo.
create or replace function public.get_taishop_catalog()
returns table (
  id text,
  category text,
  name text,
  description text,
  price numeric,
  rarity text,
  sort_order integer
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    c.id,
    c.category,
    c.name,
    c.description,
    c.price,
    c.rarity,
    c.sort_order
  from public.cosmetic_catalog c
  where c.active = true
    and coalesce(c.shop_visible, true) = true
  order by c.sort_order asc, c.id asc;
$$;

revoke all on function public.get_taishop_catalog() from public;
grant execute on function public.get_taishop_catalog() to anon, authenticated;

create or replace function public.get_my_taishop_state()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_profile record;
  v_owned jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select
    p.balance,
    p.equipped_avatar_frame,
    p.equipped_name_color,
    p.equipped_profile_effect,
    p.equipped_badge
  into v_profile
  from public.profiles p
  where p.id = v_uid;

  if not found then
    raise exception 'Profile not found';
  end if;

  select coalesce(
    jsonb_agg(uc.cosmetic_id order by uc.purchased_at, uc.cosmetic_id),
    '[]'::jsonb
  )
  into v_owned
  from public.user_cosmetics uc
  join public.cosmetic_catalog c on c.id = uc.cosmetic_id
  where uc.user_id = v_uid
    and c.active = true
    and coalesce(c.shop_visible, true) = true;

  return jsonb_build_object(
    'balance', coalesce(v_profile.balance, 0),
    'owned', v_owned,
    'equipped', jsonb_build_object(
      'avatar_frame', v_profile.equipped_avatar_frame,
      'name_color', v_profile.equipped_name_color,
      'profile_effect', v_profile.equipped_profile_effect,
      'badge', v_profile.equipped_badge
    )
  );
end;
$$;

revoke all on function public.get_my_taishop_state() from public;
grant execute on function public.get_my_taishop_state() to authenticated;

-- -------------------------------------------------------------------------
-- 3. Catálogo interno de missões
-- -------------------------------------------------------------------------

create or replace function public._mission_definitions()
returns table (
  id text,
  cadence text,
  title text,
  description text,
  icon text,
  event_type text,
  target numeric,
  reward_coins numeric,
  reward_cosmetic_id text,
  sort_order integer
)
language sql
immutable
set search_path = ''
as $$
  values
    (
      'daily_games_3', 'daily', 'Aquecimento da Banca',
      'Conclua 3 partidas nos Jogos da Entidade.', '🎲',
      'game_play', 3::numeric, 35::numeric, null::text, 10
    ),
    (
      'daily_sports_2', 'daily', 'Analista de Expediente',
      'Registre 2 bilhetes esportivos durante o dia.', '1X2',
      'sports_bet', 2::numeric, 40::numeric, null::text, 20
    ),
    (
      'daily_spend_100', 'daily', 'Queima Controlada',
      'Movimente 100 TaiCoins para fora da carteira em apostas, jogos ou compras.', '−T',
      'taicoins_spent', 100::numeric, 30::numeric, null::text, 30
    ),
    (
      'weekly_games_15', 'weekly', 'Funcionário do Mês da Semana',
      'Conclua 15 partidas nos Jogos da Entidade antes da próxima segunda.', '15',
      'game_play', 15::numeric, 150::numeric, null::text, 110
    ),
    (
      'weekly_sports_5', 'weekly', 'Diversificação Irresponsável',
      'Registre 5 bilhetes esportivos na semana.', '1X2',
      'sports_bet', 5::numeric, 120::numeric, null::text, 120
    ),
    (
      'weekly_spend_750', 'weekly', 'Economia Circular',
      'Gaste 750 TaiCoins ao longo da semana. A banca chama isso de circulação monetária.', 'T$',
      'taicoins_spent', 750::numeric, 180::numeric, null::text, 130
    ),
    (
      'weekly_daily_claims_5', 'weekly', 'Auditoria da Semana',
      'Resgate 5 missões diárias dentro da mesma semana.', '✓',
      'daily_claims', 5::numeric, 100::numeric, 'badge_weekly_auditor'::text, 140
    );
$$;

revoke all on function public._mission_definitions() from public;

-- -------------------------------------------------------------------------
-- 4. Registro interno de eventos
-- -------------------------------------------------------------------------

create or replace function public._record_mission_event(
  p_user_id uuid,
  p_event_type text,
  p_amount numeric,
  p_source_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := lower(trim(coalesce(p_event_type, '')));
  v_source text := trim(coalesce(p_source_key, ''));
  v_amount numeric := round(greatest(0, coalesce(p_amount, 0)), 2);
begin
  if p_user_id is null or v_type = '' or v_source = '' or v_amount <= 0 then
    return;
  end if;

  if v_type not in ('game_play', 'sports_bet', 'taicoins_spent') then
    return;
  end if;

  insert into public.mission_events (user_id, event_type, amount, source_key)
  values (p_user_id, v_type, v_amount, left(v_source, 220))
  on conflict (user_id, event_type, source_key) do nothing;
end;
$$;

revoke all on function public._record_mission_event(uuid, text, numeric, text) from public;

create or replace function public._mission_from_game_round()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_uid uuid;
  v_source text;
begin
  begin
    v_uid := nullif(v_row->>'user_id', '')::uuid;
  exception when others then
    return new;
  end;

  v_source := 'game_round:' || coalesce(
    nullif(v_row->>'id', ''),
    md5(v_row::text)
  );

  perform public._record_mission_event(v_uid, 'game_play', 1, v_source);
  return new;
end;
$$;

revoke all on function public._mission_from_game_round() from public;

create or replace function public._mission_from_sports_bet()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_uid uuid;
  v_source text;
begin
  begin
    v_uid := nullif(v_row->>'user_id', '')::uuid;
  exception when others then
    return new;
  end;

  v_source := 'sports_bet:' || coalesce(
    nullif(v_row->>'id', ''),
    md5(v_row::text)
  );

  perform public._record_mission_event(v_uid, 'sports_bet', 1, v_source);
  return new;
end;
$$;

revoke all on function public._mission_from_sports_bet() from public;

create or replace function public._mission_from_wallet_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_uid uuid;
  v_amount numeric := 0;
  v_source text;
begin
  begin
    v_uid := nullif(v_row->>'user_id', '')::uuid;
    v_amount := coalesce(nullif(v_row->>'amount', '')::numeric, 0);
  exception when others then
    return new;
  end;

  if v_amount >= 0 then
    return new;
  end if;

  v_source := 'wallet:' || coalesce(
    nullif(v_row->>'external_id', ''),
    nullif(v_row->>'id', ''),
    md5(v_row::text)
  );

  perform public._record_mission_event(
    v_uid,
    'taicoins_spent',
    abs(v_amount),
    v_source
  );
  return new;
end;
$$;

revoke all on function public._mission_from_wallet_transaction() from public;

-- Triggers são instalados apenas se as tabelas já existirem no projeto.
do $$
begin
  if to_regclass('public.game_rounds') is not null then
    execute 'drop trigger if exists taihenbet_mission_game_round on public.game_rounds';
    execute 'create trigger taihenbet_mission_game_round after insert on public.game_rounds for each row execute function public._mission_from_game_round()';
  end if;

  if to_regclass('public.sports_bets') is not null then
    execute 'drop trigger if exists taihenbet_mission_sports_bet on public.sports_bets';
    execute 'create trigger taihenbet_mission_sports_bet after insert on public.sports_bets for each row execute function public._mission_from_sports_bet()';
  end if;

  if to_regclass('public.wallet_transactions') is not null then
    execute 'drop trigger if exists taihenbet_mission_wallet on public.wallet_transactions';
    execute 'create trigger taihenbet_mission_wallet after insert on public.wallet_transactions for each row execute function public._mission_from_wallet_transaction()';
  end if;
end;
$$;

-- -------------------------------------------------------------------------
-- 5. Estado atual das missões
-- -------------------------------------------------------------------------

create or replace function public.get_my_missions()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (timezone('America/Sao_Paulo', now()))::date;
  v_week_start date;
  v_daily_key text;
  v_weekly_key text;
  v_daily jsonb := '[]'::jsonb;
  v_weekly jsonb := '[]'::jsonb;
  v_daily_claimed integer := 0;
  v_weekly_claimed integer := 0;
  v_ready integer := 0;
  v_special_owned boolean := false;
  v_equipped_badge text := null;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  v_week_start := v_today - (extract(isodow from v_today)::integer - 1);
  v_daily_key := to_char(v_today, 'YYYY-MM-DD');
  v_weekly_key := to_char(v_week_start, 'IYYY-"W"IW');

  with mission_base as (
    select
      d.*,
      case
        when d.cadence = 'daily' then v_daily_key
        else v_weekly_key
      end as period_key,
      case
        when d.event_type = 'daily_claims' then (
          select count(*)::numeric
          from public.user_mission_claims c
          where c.user_id = v_uid
            and left(c.mission_id, 6) = 'daily_'
            and (timezone('America/Sao_Paulo', c.claimed_at))::date >= v_week_start
            and (timezone('America/Sao_Paulo', c.claimed_at))::date < v_week_start + 7
        )
        else (
          select coalesce(sum(e.amount), 0)::numeric
          from public.mission_events e
          where e.user_id = v_uid
            and e.event_type = d.event_type
            and (timezone('America/Sao_Paulo', e.created_at))::date >=
              case when d.cadence = 'daily' then v_today else v_week_start end
            and (timezone('America/Sao_Paulo', e.created_at))::date <
              case when d.cadence = 'daily' then v_today + 1 else v_week_start + 7 end
        )
      end as progress
    from public._mission_definitions() d
  ), mission_state as (
    select
      mb.*,
      exists (
        select 1
        from public.user_mission_claims c
        where c.user_id = v_uid
          and c.mission_id = mb.id
          and c.period_key = mb.period_key
      ) as claimed
    from mission_base mb
  )
  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', ms.id,
        'cadence', ms.cadence,
        'title', ms.title,
        'description', ms.description,
        'icon', ms.icon,
        'target', ms.target,
        'progress', ms.progress,
        'reward_coins', ms.reward_coins,
        'reward_cosmetic_id', ms.reward_cosmetic_id,
        'reward_cosmetic_name', case
          when ms.reward_cosmetic_id = 'badge_weekly_auditor' then 'Auditor da Semana'
          else null
        end,
        'claimed', ms.claimed,
        'claimable', (ms.progress >= ms.target and not ms.claimed),
        'period_key', ms.period_key
      ) order by ms.sort_order
    ) filter (where ms.cadence = 'daily'), '[]'::jsonb),
    coalesce(jsonb_agg(
      jsonb_build_object(
        'id', ms.id,
        'cadence', ms.cadence,
        'title', ms.title,
        'description', ms.description,
        'icon', ms.icon,
        'target', ms.target,
        'progress', ms.progress,
        'reward_coins', ms.reward_coins,
        'reward_cosmetic_id', ms.reward_cosmetic_id,
        'reward_cosmetic_name', case
          when ms.reward_cosmetic_id = 'badge_weekly_auditor' then 'Auditor da Semana'
          else null
        end,
        'claimed', ms.claimed,
        'claimable', (ms.progress >= ms.target and not ms.claimed),
        'period_key', ms.period_key
      ) order by ms.sort_order
    ) filter (where ms.cadence = 'weekly'), '[]'::jsonb),
    count(*) filter (where ms.cadence = 'daily' and ms.claimed)::integer,
    count(*) filter (where ms.cadence = 'weekly' and ms.claimed)::integer,
    count(*) filter (where ms.progress >= ms.target and not ms.claimed)::integer
  into v_daily, v_weekly, v_daily_claimed, v_weekly_claimed, v_ready
  from mission_state ms;

  select
    exists (
      select 1
      from public.user_cosmetics uc
      where uc.user_id = v_uid
        and uc.cosmetic_id = 'badge_weekly_auditor'
    ),
    p.equipped_badge
  into v_special_owned, v_equipped_badge
  from public.profiles p
  where p.id = v_uid;

  return jsonb_build_object(
    'daily', v_daily,
    'weekly', v_weekly,
    'summary', jsonb_build_object(
      'daily_claimed', coalesce(v_daily_claimed, 0),
      'weekly_claimed', coalesce(v_weekly_claimed, 0),
      'ready', coalesce(v_ready, 0),
      'daily_period_key', v_daily_key,
      'weekly_period_key', v_weekly_key
    ),
    'special_reward', jsonb_build_object(
      'id', 'badge_weekly_auditor',
      'name', 'Auditor da Semana',
      'owned', coalesce(v_special_owned, false),
      'equipped', v_equipped_badge = 'badge_weekly_auditor'
    )
  );
end;
$$;

revoke all on function public.get_my_missions() from public;
grant execute on function public.get_my_missions() to authenticated;

-- -------------------------------------------------------------------------
-- 6. Resgate server-side
-- -------------------------------------------------------------------------

create or replace function public.claim_my_mission(p_mission_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id text := trim(coalesce(p_mission_id, ''));
  v_mission record;
  v_today date := (timezone('America/Sao_Paulo', now()))::date;
  v_week_start date;
  v_period_key text;
  v_period_start date;
  v_period_end date;
  v_progress numeric := 0;
  v_profile public.profiles;
  v_suspended boolean := false;
  v_cosmetic_name text := null;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select * into v_mission
  from public._mission_definitions() d
  where d.id = v_id;

  if not found then
    raise exception 'MISSION_NOT_FOUND';
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

  v_week_start := v_today - (extract(isodow from v_today)::integer - 1);

  if v_mission.cadence = 'daily' then
    v_period_start := v_today;
    v_period_end := v_today + 1;
    v_period_key := to_char(v_today, 'YYYY-MM-DD');
  else
    v_period_start := v_week_start;
    v_period_end := v_week_start + 7;
    v_period_key := to_char(v_week_start, 'IYYY-"W"IW');
  end if;

  if exists (
    select 1
    from public.user_mission_claims c
    where c.user_id = v_uid
      and c.mission_id = v_id
      and c.period_key = v_period_key
  ) then
    raise exception 'MISSION_ALREADY_CLAIMED';
  end if;

  if v_mission.event_type = 'daily_claims' then
    select count(*)::numeric
    into v_progress
    from public.user_mission_claims c
    where c.user_id = v_uid
      and left(c.mission_id, 6) = 'daily_'
      and (timezone('America/Sao_Paulo', c.claimed_at))::date >= v_period_start
      and (timezone('America/Sao_Paulo', c.claimed_at))::date < v_period_end;
  else
    select coalesce(sum(e.amount), 0)::numeric
    into v_progress
    from public.mission_events e
    where e.user_id = v_uid
      and e.event_type = v_mission.event_type
      and (timezone('America/Sao_Paulo', e.created_at))::date >= v_period_start
      and (timezone('America/Sao_Paulo', e.created_at))::date < v_period_end;
  end if;

  if coalesce(v_progress, 0) < v_mission.target then
    raise exception 'MISSION_NOT_COMPLETE';
  end if;

  insert into public.user_mission_claims (
    user_id,
    mission_id,
    period_key,
    reward_coins,
    reward_cosmetic_id
  ) values (
    v_uid,
    v_id,
    v_period_key,
    v_mission.reward_coins,
    v_mission.reward_cosmetic_id
  );

  if v_mission.reward_coins > 0 then
    v_profile := public._wallet_apply(
      v_uid,
      v_mission.reward_coins,
      'admin_adjustment',
      'mission:' || v_uid::text || ':' || v_id || ':' || v_period_key,
      jsonb_build_object(
        'source', 'missions',
        'operation', 'mission_reward',
        'mission_id', v_id,
        'period_key', v_period_key,
        'reward_coins', v_mission.reward_coins
      )
    );
  else
    select * into v_profile
    from public.profiles p
    where p.id = v_uid;
  end if;

  if v_mission.reward_cosmetic_id is not null then
    insert into public.user_cosmetics (user_id, cosmetic_id)
    values (v_uid, v_mission.reward_cosmetic_id)
    on conflict (user_id, cosmetic_id) do nothing;

    select c.name into v_cosmetic_name
    from public.cosmetic_catalog c
    where c.id = v_mission.reward_cosmetic_id;
  end if;

  perform public._notify_user(
    v_uid,
    'mission',
    'Meta batida pela banca',
    case
      when v_mission.reward_cosmetic_id is not null then
        v_mission.title || ' concluída. +' || trim(to_char(v_mission.reward_coins, 'FM999999990D00')) ||
        ' TaiCoins e o badge ' || coalesce(v_cosmetic_name, 'especial') || ' foram liberados.'
      else
        v_mission.title || ' concluída. +' || trim(to_char(v_mission.reward_coins, 'FM999999990D00')) ||
        ' TaiCoins foram creditadas.'
    end,
    'missoes',
    v_id,
    jsonb_build_object(
      'mission_id', v_id,
      'period_key', v_period_key,
      'reward_coins', v_mission.reward_coins,
      'reward_cosmetic_id', v_mission.reward_cosmetic_id
    )
  );

  return jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'mission_id', v_id,
    'reward_coins', v_mission.reward_coins,
    'reward_cosmetic_id', v_mission.reward_cosmetic_id,
    'reward_cosmetic_name', v_cosmetic_name,
    'state', public.get_my_missions()
  );
exception
  when unique_violation then
    raise exception 'MISSION_ALREADY_CLAIMED';
end;
$$;

revoke all on function public.claim_my_mission(text) from public;
grant execute on function public.claim_my_mission(text) to authenticated;

commit;
