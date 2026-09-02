begin;

-- ============================================================
-- TAIHENBET 2.0 — FASE 3.23
-- CENTRAL DE CONTEUDO / CMS ADMINISTRATIVO
-- Execute DEPOIS da Fase 3.22.
-- ============================================================

-- -------------------------------------------------------------------------
-- 1. Catálogo editável de conquistas
-- -------------------------------------------------------------------------

create table if not exists public.achievement_catalog (
  key text primary key,
  name text not null,
  description text not null,
  title text not null,
  category text not null,
  target numeric(14,2) not null,
  icon text not null default '★',
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint achievement_catalog_target_check check (target > 0)
);

insert into public.achievement_catalog
  (key, name, description, title, category, target, icon, sort_order, active)
values
  ('primeiro_bilhete', 'Primeiro sacrifício', 'Registre seu primeiro bilhete esportivo.', 'Apostador de Schrödinger', 'Bahrein', 1, '1X2', 10, true),
  ('analista_bahrein', 'Analista do Bahrein', 'Registre 10 bilhetes esportivos.', 'Especialista em Futebol Bareinita', 'Bahrein', 10, 'BH', 20, true),
  ('primeira_vitoria', 'Milagre estatístico', 'Consiga sua primeira vitória liquidada.', 'Milagre Estatístico', 'Geral', 1, '★', 30, true),
  ('cliente_banca', 'Cliente preferencial', 'Complete 10 partidas nos Jogos da Entidade.', 'Cliente Preferencial da Banca', 'Jogos', 10, 'T', 40, true),
  ('domador_taigrinho', 'Domador de Taigrinho', 'Encare o Taigrinho 5 vezes.', 'Domador de Taigrinho', 'Jogos', 5, '🐯', 50, true),
  ('agronomo_risco', 'Agricultura de risco', 'Jogue TaiMandioca 5 vezes.', 'Agrônomo de Risco', 'Jogos', 5, '🌱', 60, true),
  ('fugitivo_regime', 'Fuga do regime', 'Entre em 5 operações do Crash do Regime.', 'Fugitivo do Regime', 'Jogos', 5, '↗', 70, true),
  ('joquei_mambo', 'Protocolo Mambo', 'Participe de 3 corridas do Taihen Derby.', 'Jóquei do Protocolo Mambo', 'Jogos', 3, '🏁', 80, true),
  ('investidor_questionavel', 'Investidor questionável', 'Acumule 500 TaiCoins em prejuízos liquidados.', 'Investidor Questionável', 'Economia', 500, '−T', 90, true),
  ('inimigo_banca', 'Inimigo da banca', 'Acumule 500 TaiCoins de lucro positivo em vitórias.', 'Inimigo da Banca', 'Economia', 500, '+T', 100, true),
  ('veterano_ruina', 'Veterano da ruína', 'Registre 25 decisões entre apostas e jogos.', 'Veterano da Ruína', 'Geral', 25, '25', 110, true)
on conflict (key) do nothing;

alter table public.achievement_catalog enable row level security;
revoke all on table public.achievement_catalog from anon, authenticated;
grant select on table public.achievement_catalog to anon, authenticated;

drop policy if exists "public reads achievement catalog" on public.achievement_catalog;
create policy "public reads achievement catalog"
on public.achievement_catalog for select to anon, authenticated
using (true);

create or replace function public.get_achievement_catalog()
returns table (
  key text,
  name text,
  description text,
  title text,
  category text,
  target numeric,
  icon text,
  sort_order integer,
  active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select a.key, a.name, a.description, a.title, a.category, a.target,
         a.icon, a.sort_order, a.active
  from public.achievement_catalog a
  order by a.sort_order, a.key;
$$;
revoke all on function public.get_achievement_catalog() from public;
grant execute on function public.get_achievement_catalog() to anon, authenticated;

-- -------------------------------------------------------------------------
-- 2. Catálogo editável de missões normais
-- -------------------------------------------------------------------------

create table if not exists public.mission_catalog (
  id text primary key,
  cadence text not null,
  title text not null,
  description text not null,
  icon text not null default 'T',
  event_type text not null,
  target numeric(14,2) not null,
  reward_coins numeric(14,2) not null default 0,
  reward_cosmetic_id text,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint mission_catalog_cadence_check check (cadence in ('daily', 'weekly')),
  constraint mission_catalog_event_check check (event_type in ('game_play', 'sports_bet', 'taicoins_spent', 'daily_claims')),
  constraint mission_catalog_target_check check (target > 0),
  constraint mission_catalog_reward_check check (reward_coins >= 0)
);

insert into public.mission_catalog
  (id, cadence, title, description, icon, event_type, target, reward_coins, reward_cosmetic_id, sort_order, active)
values
  ('daily_games_3', 'daily', 'Aquecimento da Banca', 'Conclua 3 partidas nos Jogos da Entidade.', '🎲', 'game_play', 3, 35, null, 10, true),
  ('daily_sports_2', 'daily', 'Analista de Expediente', 'Registre 2 bilhetes esportivos durante o dia.', '1X2', 'sports_bet', 2, 40, null, 20, true),
  ('daily_spend_100', 'daily', 'Queima Controlada', 'Movimente 100 TaiCoins para fora da carteira em apostas, jogos ou compras.', '−T', 'taicoins_spent', 100, 30, null, 30, true),
  ('weekly_games_15', 'weekly', 'Funcionário do Mês da Semana', 'Conclua 15 partidas nos Jogos da Entidade antes da próxima segunda.', '15', 'game_play', 15, 150, null, 110, true),
  ('weekly_sports_5', 'weekly', 'Diversificação Irresponsável', 'Registre 5 bilhetes esportivos na semana.', '1X2', 'sports_bet', 5, 120, null, 120, true),
  ('weekly_spend_750', 'weekly', 'Economia Circular', 'Gaste 750 TaiCoins ao longo da semana. A banca chama isso de circulação monetária.', 'T$', 'taicoins_spent', 750, 180, null, 130, true),
  ('weekly_daily_claims_5', 'weekly', 'Auditoria da Semana', 'Resgate 5 missões diárias dentro da mesma semana.', '✓', 'daily_claims', 5, 100, 'badge_weekly_auditor', 140, true)
on conflict (id) do nothing;

alter table public.mission_catalog enable row level security;
revoke all on table public.mission_catalog from anon, authenticated;
grant select on table public.mission_catalog to anon, authenticated;

drop policy if exists "public reads mission catalog" on public.mission_catalog;
create policy "public reads mission catalog"
on public.mission_catalog for select to anon, authenticated
using (true);

-- Substitui o catálogo hardcoded da Fase 3.19 por dados editáveis.
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
stable
set search_path = public
as $$
  select m.id, m.cadence, m.title, m.description, m.icon, m.event_type,
         m.target, m.reward_coins, m.reward_cosmetic_id, m.sort_order
  from public.mission_catalog m
  where m.active
  order by m.sort_order, m.id;
$$;
revoke all on function public._mission_definitions() from public;

create or replace function public.get_public_cosmetic_labels()
returns table (
  id text,
  category text,
  name text,
  active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.category, c.name, c.active
  from public.cosmetic_catalog c
  order by c.sort_order, c.id;
$$;
revoke all on function public.get_public_cosmetic_labels() from public;
grant execute on function public.get_public_cosmetic_labels() to anon, authenticated;

-- -------------------------------------------------------------------------
-- 3. Textos gerais do site
-- -------------------------------------------------------------------------

create table if not exists public.site_text_content (
  key text primary key,
  section text not null,
  label text not null,
  value text not null,
  default_value text not null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.site_text_content (key, section, label, value, default_value, sort_order)
values
  ('footer.brand', 'Geral', 'Marca do rodapé', 'TAIHENBET', 'TAIHENBET', 10),
  ('footer.subtitle', 'Geral', 'Subtítulo do rodapé', 'Sob supervisão do Oráculo das Odds', 'Sob supervisão do Oráculo das Odds', 20),
  ('footer.disclaimer', 'Geral', 'Aviso curto do rodapé', 'Este site é uma paródia antiapostas. Não envolve dinheiro, prêmios ou apostas reais.', 'Este site é uma paródia antiapostas. Não envolve dinheiro, prêmios ou apostas reais.', 30),
  ('progression.eyebrow', 'Conquistas', 'Chamada da página de conquistas', 'FASE 3.15 · PROGRESSÃO', 'FASE 3.15 · PROGRESSÃO', 100),
  ('progression.title', 'Conquistas', 'Título da página de conquistas', 'Currículo oficial de decisões questionáveis.', 'Currículo oficial de decisões questionáveis.', 110),
  ('progression.description', 'Conquistas', 'Descrição da página de conquistas', 'A banca transformou seu histórico em estatísticas, conquistas e títulos que continuam ligados à sua conta.', 'A banca transformou seu histórico em estatísticas, conquistas e títulos que continuam ligados à sua conta.', 120),
  ('missions.eyebrow', 'Missões', 'Chamada da página de missões', 'FASE 3.19 · DEPARTAMENTO DE PRODUTIVIDADE', 'FASE 3.19 · DEPARTAMENTO DE PRODUTIVIDADE', 200),
  ('missions.title', 'Missões', 'Título da página de missões', 'A banca agora chama vício de produtividade.', 'A banca agora chama vício de produtividade.', 210),
  ('missions.description', 'Missões', 'Descrição da página de missões', 'Jogue, aposte e movimente TaiCoins para preencher metas que nenhum sindicato aprovou.', 'Jogue, aposte e movimente TaiCoins para preencher metas que nenhum sindicato aprovou.', 220),
  ('shop.eyebrow', 'TaiShop', 'Chamada da TaiShop', 'FASE 3.18 · CONSUMISMO FICTÍCIO', 'FASE 3.18 · CONSUMISMO FICTÍCIO', 300),
  ('shop.title', 'TaiShop', 'Título da TaiShop', 'Gaste antes que a banca perceba.', 'Gaste antes que a banca perceba.', 310),
  ('shop.description', 'TaiShop', 'Descrição da TaiShop', 'Molduras, cores, efeitos e selos para transformar TaiCoins em absolutamente nenhum benefício financeiro.', 'Molduras, cores, efeitos e selos para transformar TaiCoins em absolutamente nenhum benefício financeiro.', 320),
  ('group.eyebrow', 'Grupo', 'Chamada da página Grupo', 'CONGLOMERADO 100% FICTÍCIO', 'CONGLOMERADO 100% FICTÍCIO', 400),
  ('group.title', 'Grupo', 'Título da página Grupo', 'Empresas do Grupo TaihenBet', 'Empresas do Grupo TaihenBet', 410),
  ('group.description', 'Grupo', 'Descrição da página Grupo', 'Participações, aquisições e divisões empresariais que existem somente dentro da piada. Nenhuma organização real foi comprada pela banca.', 'Participações, aquisições e divisões empresariais que existem somente dentro da piada. Nenhuma organização real foi comprada pela banca.', 420),
  ('museum.eyebrow', 'Museu', 'Chamada do Museu', 'ACERVO ABERTO DA COMUNIDADE', 'ACERVO ABERTO DA COMUNIDADE', 500),
  ('museum.title', 'Museu', 'Título do Museu', 'Museu da Taihen', 'Museu da Taihen', 510),
  ('museum.description', 'Museu', 'Descrição do Museu', 'O arquivo agora é coletivo. Quem tiver conta pode registrar imagens, vídeos e descrições — e a autoria fica presa à ficha criminal de quem publicou.', 'O arquivo agora é coletivo. Quem tiver conta pode registrar imagens, vídeos e descrições — e a autoria fica presa à ficha criminal de quem publicou.', 520),
  ('museum.disclaimer_title', 'Museu', 'Título do aviso do curador', 'AVISO DO CURADOR:', 'AVISO DO CURADOR:', 530),
  ('museum.disclaimer', 'Museu', 'Texto do aviso do curador', 'Cada publicação da comunidade exibe o nome da conta responsável. O autor pode apagar o próprio conteúdo e a administração pode remover material do acervo quando necessário.', 'Cada publicação da comunidade exibe o nome da conta responsável. O autor pode apagar o próprio conteúdo e a administração pode remover material do acervo quando necessário.', 540),
  ('feed.eyebrow', 'Feed', 'Chamada do Feed', 'FASE 3.22 · FOFOCA INSTITUCIONAL', 'FASE 3.22 · FOFOCA INSTITUCIONAL', 600),
  ('feed.title', 'Feed', 'Título do Feed', 'O mural que registra até o que ninguém pediu.', 'O mural que registra até o que ninguém pediu.', 610),
  ('feed.description', 'Feed', 'Descrição do Feed', 'Conquistas, relíquias, comentários, missões e temporadas da comunidade reunidos em uma linha do tempo pública. A banca chama isso de transparência; todo mundo normal chama de feed.', 'Conquistas, relíquias, comentários, missões e temporadas da comunidade reunidos em uma linha do tempo pública. A banca chama isso de transparência; todo mundo normal chama de feed.', 620),
  ('feed.privacy_label', 'Feed', 'Rótulo de privacidade do Feed', 'PRIVACIDADE MÍNIMA, MAS EXISTENTE', 'PRIVACIDADE MÍNIMA, MAS EXISTENTE', 630),
  ('feed.privacy', 'Feed', 'Texto de privacidade do Feed', 'O Feed não publica saldo, e-mail, histórico bruto, moderação ou dados de autenticação. Contas suspensas deixam de aparecer enquanto a suspensão estiver ativa.', 'O Feed não publica saldo, e-mail, histórico bruto, moderação ou dados de autenticação. Contas suspensas deixam de aparecer enquanto a suspensão estiver ativa.', 640)
on conflict (key) do nothing;

alter table public.site_text_content enable row level security;
revoke all on table public.site_text_content from anon, authenticated;
grant select on table public.site_text_content to anon, authenticated;

drop policy if exists "public reads site text content" on public.site_text_content;
create policy "public reads site text content"
on public.site_text_content for select to anon, authenticated
using (true);

create or replace function public.get_public_site_texts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(t.key, t.value), '{}'::jsonb)
  from public.site_text_content t;
$$;
revoke all on function public.get_public_site_texts() from public;
grant execute on function public.get_public_site_texts() to anon, authenticated;

-- -------------------------------------------------------------------------
-- 4. Utilitário de autorização da Central de Conteúdo
-- -------------------------------------------------------------------------

create or replace function public._content_studio_assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'ADMIN_ONLY';
  end if;
end;
$$;
revoke all on function public._content_studio_assert_admin() from public;

-- -------------------------------------------------------------------------
-- 5. Snapshot único para o Painel
-- -------------------------------------------------------------------------

create or replace function public.get_content_studio_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();

  return jsonb_build_object(
    'achievements', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.sort_order, a.key)
      from public.achievement_catalog a
    ), '[]'::jsonb),
    'missions', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.sort_order, m.id)
      from public.mission_catalog m
    ), '[]'::jsonb),
    'cosmetics', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.sort_order, c.id)
      from public.cosmetic_catalog c
    ), '[]'::jsonb),
    'seasons', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.sort_order, s.starts_at desc)
      from public.seasons s
    ), '[]'::jsonb),
    'season_missions', coalesce((
      select jsonb_agg(to_jsonb(sm) order by sm.season_id, sm.sort_order, sm.mission_id)
      from public.season_missions sm
    ), '[]'::jsonb),
    'season_tiers', coalesce((
      select jsonb_agg(to_jsonb(st) order by st.season_id, st.sort_order, st.tier_key)
      from public.season_reward_tiers st
    ), '[]'::jsonb),
    'companies', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.created_at, c.name)
      from public.taihen_group_companies c
    ), '[]'::jsonb),
    'texts', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.sort_order, t.key)
      from public.site_text_content t
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.get_content_studio_snapshot() from public;
grant execute on function public.get_content_studio_snapshot() to authenticated;

-- -------------------------------------------------------------------------
-- 6. Escrita administrativa
-- -------------------------------------------------------------------------

create or replace function public.admin_update_achievement_catalog(
  p_key text,
  p_name text,
  p_description text,
  p_title text,
  p_category text,
  p_target numeric,
  p_icon text,
  p_sort_order integer,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  update public.achievement_catalog
  set name = left(trim(coalesce(p_name, '')), 120),
      description = left(trim(coalesce(p_description, '')), 1200),
      title = left(trim(coalesce(p_title, '')), 120),
      category = left(trim(coalesce(p_category, '')), 80),
      target = greatest(coalesce(p_target, 1), 0.01),
      icon = left(coalesce(p_icon, '★'), 24),
      sort_order = coalesce(p_sort_order, sort_order),
      active = coalesce(p_active, active),
      updated_at = now()
  where key = p_key;
  if not found then raise exception 'ACHIEVEMENT_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_update_achievement_catalog(text,text,text,text,text,numeric,text,integer,boolean) from public;
grant execute on function public.admin_update_achievement_catalog(text,text,text,text,text,numeric,text,integer,boolean) to authenticated;

create or replace function public.admin_update_mission_catalog(
  p_id text,
  p_title text,
  p_description text,
  p_icon text,
  p_target numeric,
  p_reward_coins numeric,
  p_sort_order integer,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  update public.mission_catalog
  set title = left(trim(coalesce(p_title, '')), 120),
      description = left(trim(coalesce(p_description, '')), 1200),
      icon = left(coalesce(p_icon, 'T'), 24),
      target = greatest(coalesce(p_target, 1), 0.01),
      reward_coins = greatest(coalesce(p_reward_coins, 0), 0),
      sort_order = coalesce(p_sort_order, sort_order),
      active = coalesce(p_active, active),
      updated_at = now()
  where id = p_id;
  if not found then raise exception 'MISSION_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_update_mission_catalog(text,text,text,text,numeric,numeric,integer,boolean) from public;
grant execute on function public.admin_update_mission_catalog(text,text,text,text,numeric,numeric,integer,boolean) to authenticated;

create or replace function public.admin_update_cosmetic_catalog(
  p_id text,
  p_name text,
  p_description text,
  p_price numeric,
  p_rarity text,
  p_sort_order integer,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  update public.cosmetic_catalog
  set name = left(trim(coalesce(p_name, '')), 120),
      description = left(trim(coalesce(p_description, '')), 1200),
      price = greatest(coalesce(p_price, 0), 0),
      rarity = left(trim(coalesce(p_rarity, 'Comum')), 40),
      sort_order = coalesce(p_sort_order, sort_order),
      active = coalesce(p_active, active)
  where id = p_id;
  if not found then raise exception 'COSMETIC_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_update_cosmetic_catalog(text,text,text,numeric,text,integer,boolean) from public;
grant execute on function public.admin_update_cosmetic_catalog(text,text,text,numeric,text,integer,boolean) to authenticated;

create or replace function public.admin_update_season(
  p_id text,
  p_name text,
  p_subtitle text,
  p_description text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_active boolean,
  p_sort_order integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'INVALID_SEASON_DATES';
  end if;
  update public.seasons
  set name = left(trim(coalesce(p_name, '')), 140),
      subtitle = left(trim(coalesce(p_subtitle, '')), 240),
      description = left(trim(coalesce(p_description, '')), 1600),
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      active = coalesce(p_active, active),
      sort_order = coalesce(p_sort_order, sort_order)
  where id = p_id;
  if not found then raise exception 'SEASON_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_update_season(text,text,text,text,timestamptz,timestamptz,boolean,integer) from public;
grant execute on function public.admin_update_season(text,text,text,text,timestamptz,timestamptz,boolean,integer) to authenticated;

create or replace function public.admin_update_season_mission(
  p_season_id text,
  p_mission_id text,
  p_title text,
  p_description text,
  p_icon text,
  p_target numeric,
  p_reward_coins numeric,
  p_reward_points integer,
  p_sort_order integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  update public.season_missions
  set title = left(trim(coalesce(p_title, '')), 140),
      description = left(trim(coalesce(p_description, '')), 1600),
      icon = left(coalesce(p_icon, '◆'), 24),
      target = greatest(coalesce(p_target, 1), 0.01),
      reward_coins = greatest(coalesce(p_reward_coins, 0), 0),
      reward_points = greatest(coalesce(p_reward_points, 0), 0),
      sort_order = coalesce(p_sort_order, sort_order)
  where season_id = p_season_id and mission_id = p_mission_id;
  if not found then raise exception 'SEASON_MISSION_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_update_season_mission(text,text,text,text,text,numeric,numeric,integer,integer) from public;
grant execute on function public.admin_update_season_mission(text,text,text,text,text,numeric,numeric,integer,integer) to authenticated;

create or replace function public.admin_update_season_tier(
  p_season_id text,
  p_tier_key text,
  p_name text,
  p_points_required integer,
  p_reward_coins numeric,
  p_sort_order integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  update public.season_reward_tiers
  set name = left(trim(coalesce(p_name, '')), 140),
      points_required = greatest(coalesce(p_points_required, 1), 1),
      reward_coins = greatest(coalesce(p_reward_coins, 0), 0),
      sort_order = coalesce(p_sort_order, sort_order)
  where season_id = p_season_id and tier_key = p_tier_key;
  if not found then raise exception 'SEASON_TIER_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_update_season_tier(text,text,text,integer,numeric,integer) from public;
grant execute on function public.admin_update_season_tier(text,text,text,integer,numeric,integer) to authenticated;

create or replace function public.admin_update_site_text(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  update public.site_text_content
  set value = left(coalesce(p_value, ''), 5000), updated_at = now()
  where key = p_key;
  if not found then raise exception 'TEXT_KEY_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_update_site_text(text,text) from public;
grant execute on function public.admin_update_site_text(text,text) to authenticated;

create or replace function public.admin_reset_site_text(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  update public.site_text_content
  set value = default_value, updated_at = now()
  where key = p_key;
  if not found then raise exception 'TEXT_KEY_NOT_FOUND'; end if;
end;
$$;
revoke all on function public.admin_reset_site_text(text) from public;
grant execute on function public.admin_reset_site_text(text) to authenticated;

-- -------------------------------------------------------------------------
-- 7. Nomes dinâmicos em notificações e Feed
-- -------------------------------------------------------------------------

create or replace function public._notification_achievement_name(p_key text)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce((select a.name from public.achievement_catalog a where a.key = p_key), p_key);
$$;
revoke all on function public._notification_achievement_name(text) from public;

create or replace function public._notification_title_name(p_key text)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce((select a.title from public.achievement_catalog a where a.key = p_key), p_key);
$$;
revoke all on function public._notification_title_name(text) from public;

create or replace function public._feed_achievement_name(p_key text)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce((select a.name from public.achievement_catalog a where a.key = p_key), p_key);
$$;
revoke all on function public._feed_achievement_name(text) from public;

create or replace function public._feed_title_name(p_key text)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce((select a.title from public.achievement_catalog a where a.key = p_key), p_key);
$$;
revoke all on function public._feed_title_name(text) from public;

commit;
