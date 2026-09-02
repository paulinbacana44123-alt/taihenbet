begin;

-- ============================================================
-- TAIHENBET 2.0 — FASE 3.18
-- TAISHOP / LOJA DE COSMETICOS
-- Execute DEPOIS da Fase 3.17.
-- ============================================================

-- -------------------------------------------------------------------------
-- 1. Catalogo e inventario
-- -------------------------------------------------------------------------

create table if not exists public.cosmetic_catalog (
  id text primary key,
  category text not null,
  name text not null,
  description text not null,
  price numeric(14,2) not null,
  rarity text not null default 'Comum',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint cosmetic_catalog_category_check
    check (category in ('avatar_frame', 'name_color', 'profile_effect', 'badge')),
  constraint cosmetic_catalog_price_check
    check (price >= 0 and price <= 1000000)
);

insert into public.cosmetic_catalog
  (id, category, name, description, price, rarity, sort_order, active)
values
  ('frame_oracle', 'avatar_frame', 'Moldura do Oráculo',
    'Aro rosado homologado pela Entidade da Banca para avatares com histórico comprometedor.',
    120, 'Comum', 10, true),
  ('frame_bankrupt', 'avatar_frame', 'Aro da Falência',
    'Contorno vermelho para quem já viu o saldo chegar perto demais de zero.',
    220, 'Raro', 20, true),
  ('frame_mambo', 'avatar_frame', 'Circuito Mambo',
    'Moldura em camadas neon inspirada no protocolo de corrida mais cientificamente duvidoso do site.',
    320, 'Épico', 30, true),
  ('name_oracle', 'name_color', 'Tinta do Oráculo',
    'O rosa institucional da banca aplicado diretamente na sua identidade pública.',
    90, 'Comum', 40, true),
  ('name_gold', 'name_color', 'Ouro da Banca',
    'Nome dourado para simular patrimônio que talvez já tenha sido perdido em outro setor.',
    180, 'Raro', 50, true),
  ('name_profit', 'name_color', 'Lucro Suspeito',
    'Verde reservado a clientes que desejam parecer financeiramente responsáveis por alguns segundos.',
    160, 'Raro', 60, true),
  ('effect_crt', 'profile_effect', 'CRT Corporativo',
    'Linhas de monitor antigo sobre a ficha pública. Tecnologia de ponta de aproximadamente 1997.',
    240, 'Raro', 70, true),
  ('effect_bankrupt', 'profile_effect', 'Aura da Falência',
    'Um brilho vermelho preocupante que sugere decisões econômicas em fase terminal.',
    300, 'Épico', 80, true),
  ('effect_neon', 'profile_effect', 'Protocolo Neon',
    'Camada pulsante azul, roxa e rosa para transformar o perfil em infraestrutura crítica.',
    360, 'Épico', 90, true),
  ('badge_rat', 'badge', 'Rato Certificado',
    'Selo público reconhecendo anos imaginários de serviço à economia roedora.',
    140, 'Comum', 100, true),
  ('badge_ruin', 'badge', 'Cliente da Ruína',
    'Identificação para quem já aceitou que a dignidade financeira ficou em outra aba.',
    200, 'Raro', 110, true),
  ('badge_bank_asset', 'badge', 'Patrimônio da Banca',
    'O selo premium para clientes que deixaram de ser usuários e passaram a integrar o ativo imobilizado.',
    280, 'Épico', 120, true)
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  rarity = excluded.rarity,
  sort_order = excluded.sort_order,
  active = excluded.active;

create table if not exists public.user_cosmetics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  cosmetic_id text not null references public.cosmetic_catalog(id) on delete restrict,
  purchased_at timestamptz not null default now(),
  primary key (user_id, cosmetic_id)
);

create index if not exists user_cosmetics_user_idx
  on public.user_cosmetics (user_id, purchased_at desc);

alter table public.cosmetic_catalog enable row level security;
alter table public.user_cosmetics enable row level security;

revoke all on table public.cosmetic_catalog from anon, authenticated;
grant select on table public.cosmetic_catalog to anon, authenticated;

revoke all on table public.user_cosmetics from anon, authenticated;
grant select on table public.user_cosmetics to authenticated;

drop policy if exists "public reads active cosmetics" on public.cosmetic_catalog;
create policy "public reads active cosmetics"
on public.cosmetic_catalog
for select
to anon, authenticated
using (active = true);

drop policy if exists "users read own cosmetics" on public.user_cosmetics;
create policy "users read own cosmetics"
on public.user_cosmetics
for select
to authenticated
using (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 2. Slots equipaveis no perfil
-- -------------------------------------------------------------------------

alter table public.profiles
  add column if not exists equipped_avatar_frame text,
  add column if not exists equipped_name_color text,
  add column if not exists equipped_profile_effect text,
  add column if not exists equipped_badge text;

revoke update (
  equipped_avatar_frame,
  equipped_name_color,
  equipped_profile_effect,
  equipped_badge
) on public.profiles from authenticated;

-- -------------------------------------------------------------------------
-- 3. Catalogo publico e estado privado da loja
-- -------------------------------------------------------------------------

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

  select coalesce(jsonb_agg(uc.cosmetic_id order by uc.purchased_at, uc.cosmetic_id), '[]'::jsonb)
  into v_owned
  from public.user_cosmetics uc
  where uc.user_id = v_uid;

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
-- 4. Compra: debitada pela carteira endurecida da Fase 3.9
--
-- A operacao usa o kind interno admin_adjustment com metadata source=taishop
-- para nao ampliar a allowlist antiga da carteira. O navegador continua sem
-- acesso a _wallet_apply().
-- -------------------------------------------------------------------------

create or replace function public.buy_taishop_cosmetic(p_cosmetic_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.cosmetic_catalog;
  v_profile public.profiles;
  v_suspended boolean := false;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select * into v_item
  from public.cosmetic_catalog c
  where c.id = trim(coalesce(p_cosmetic_id, ''))
    and c.active = true;

  if not found then
    raise exception 'COSMETIC_NOT_FOUND';
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
    select 1
    from public.user_cosmetics uc
    where uc.user_id = v_uid and uc.cosmetic_id = v_item.id
  ) then
    raise exception 'COSMETIC_ALREADY_OWNED';
  end if;

  v_profile := public._wallet_apply(
    v_uid,
    -v_item.price,
    'admin_adjustment',
    'taishop:' || v_uid::text || ':' || v_item.id,
    jsonb_build_object(
      'source', 'taishop',
      'operation', 'cosmetic_purchase',
      'cosmetic_id', v_item.id,
      'category', v_item.category,
      'price', v_item.price
    )
  );

  insert into public.user_cosmetics (user_id, cosmetic_id)
  values (v_uid, v_item.id);

  perform public._notify_user(
    v_uid,
    'shop',
    'Compra aprovada pela banca',
    v_item.name || ' entrou no seu inventário por ' || trim(to_char(v_item.price, 'FM999999990D00')) || ' TaiCoins.',
    'loja',
    v_item.id,
    jsonb_build_object('cosmetic_id', v_item.id, 'price', v_item.price)
  );

  return jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'cosmetic_id', v_item.id,
    'price', v_item.price
  );
exception
  when unique_violation then
    raise exception 'COSMETIC_ALREADY_OWNED';
end;
$$;

revoke all on function public.buy_taishop_cosmetic(text) from public;
grant execute on function public.buy_taishop_cosmetic(text) to authenticated;

-- -------------------------------------------------------------------------
-- 5. Equipar / desequipar por slot
-- -------------------------------------------------------------------------

create or replace function public.set_my_taishop_cosmetic(
  p_category text,
  p_cosmetic_id text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_category text := lower(trim(coalesce(p_category, '')));
  v_cosmetic_id text := nullif(trim(coalesce(p_cosmetic_id, '')), '');
  v_item public.cosmetic_catalog;
  v_profile public.profiles;
  v_suspended boolean := false;
  v_current text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if v_category not in ('avatar_frame', 'name_color', 'profile_effect', 'badge') then
    raise exception 'INVALID_COSMETIC_CATEGORY';
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

  if v_cosmetic_id is not null then
    select * into v_item
    from public.cosmetic_catalog c
    where c.id = v_cosmetic_id and c.active = true;

    if not found then
      raise exception 'COSMETIC_NOT_FOUND';
    end if;

    if v_item.category <> v_category then
      raise exception 'COSMETIC_CATEGORY_MISMATCH';
    end if;

    if not exists (
      select 1 from public.user_cosmetics uc
      where uc.user_id = v_uid and uc.cosmetic_id = v_cosmetic_id
    ) then
      raise exception 'COSMETIC_NOT_OWNED';
    end if;
  end if;

  if v_category = 'avatar_frame' then
    select p.equipped_avatar_frame into v_current
    from public.profiles p where p.id = v_uid;
    update public.profiles
    set equipped_avatar_frame = v_cosmetic_id
    where id = v_uid
    returning * into v_profile;
  elsif v_category = 'name_color' then
    select p.equipped_name_color into v_current
    from public.profiles p where p.id = v_uid;
    update public.profiles
    set equipped_name_color = v_cosmetic_id
    where id = v_uid
    returning * into v_profile;
  elsif v_category = 'profile_effect' then
    select p.equipped_profile_effect into v_current
    from public.profiles p where p.id = v_uid;
    update public.profiles
    set equipped_profile_effect = v_cosmetic_id
    where id = v_uid
    returning * into v_profile;
  else
    select p.equipped_badge into v_current
    from public.profiles p where p.id = v_uid;
    update public.profiles
    set equipped_badge = v_cosmetic_id
    where id = v_uid
    returning * into v_profile;
  end if;

  if v_current is distinct from v_cosmetic_id then
    perform public._notify_user(
      v_uid,
      'shop',
      case when v_cosmetic_id is null then 'Cosmético removido' else 'Cosmético equipado' end,
      case when v_cosmetic_id is null
        then 'Um cosmético foi removido da sua identidade pública.'
        else v_item.name || ' agora aparece no seu perfil público.'
      end,
      'loja',
      v_cosmetic_id,
      jsonb_build_object('category', v_category, 'cosmetic_id', v_cosmetic_id)
    );
  end if;

  return v_profile;
end;
$$;

revoke all on function public.set_my_taishop_cosmetic(text, text) from public;
grant execute on function public.set_my_taishop_cosmetic(text, text) to authenticated;

-- -------------------------------------------------------------------------
-- 6. Perfil publico passa a expor SOMENTE os cosmeticos equipados
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
    p.equipped_title_key,
    p.equipped_avatar_frame,
    p.equipped_name_color,
    p.equipped_profile_effect,
    p.equipped_badge
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
    'equipped_avatar_frame', v_profile.equipped_avatar_frame,
    'equipped_name_color', v_profile.equipped_name_color,
    'equipped_profile_effect', v_profile.equipped_profile_effect,
    'equipped_badge', v_profile.equipped_badge,
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
