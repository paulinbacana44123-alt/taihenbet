-- ============================================================================
-- TaihenBet 2.0 — Fase 3.24
-- Museu: curadoria oficial editável sem alterar os assets empacotados no Vite
-- ============================================================================
--
-- O acervo oficial do MuseumPage.jsx continua servindo como fallback local.
-- Esta tabela guarda apenas overrides administráveis pelo site.
-- Leitura pública acontece exclusivamente pela RPC abaixo; escrita é admin-only.

create table if not exists public.museum_curated_overrides (
  item_id text primary key,
  title text not null,
  description text not null default '',
  category text not null,
  media_type text not null,
  media_path text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),

  constraint museum_curated_overrides_category_check
    check (category in ('memes', 'clipes', 'documentos', 'formas')),
  constraint museum_curated_overrides_media_type_check
    check (media_type in ('imagem', 'video')),
  constraint museum_curated_overrides_title_length_check
    check (char_length(title) between 1 and 90),
  constraint museum_curated_overrides_description_length_check
    check (char_length(description) <= 1200)
);

alter table public.museum_curated_overrides enable row level security;

-- O frontend não precisa acessar a tabela diretamente.
revoke all on table public.museum_curated_overrides from anon, authenticated;

-- --------------------------------------------------------------------------
-- Leitura pública dos overrides.
-- Retorna um objeto JSON indexado pelo id do item curado.
-- --------------------------------------------------------------------------
create or replace function public.get_museum_curated_overrides()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(
      item_id,
      jsonb_build_object(
        'title', title,
        'description', description,
        'category', category,
        'media_type', media_type,
        'media_path', media_path,
        'updated_at', updated_at
      )
    ),
    '{}'::jsonb
  )
  from public.museum_curated_overrides;
$$;

revoke all on function public.get_museum_curated_overrides() from public;
grant execute on function public.get_museum_curated_overrides() to anon, authenticated;

-- --------------------------------------------------------------------------
-- Grava/atualiza um override. Somente perfis role=admin.
-- --------------------------------------------------------------------------
create or replace function public.admin_set_museum_curated_override(
  p_item_id text,
  p_title text,
  p_description text,
  p_category text,
  p_media_type text,
  p_media_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := btrim(coalesce(p_title, ''));
  v_description text := coalesce(p_description, '');
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_uid
      and p.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  -- Whitelist dos itens oficiais existentes hoje no MuseumPage.jsx.
  if p_item_id not in (
    'custo',
    'nao-de-agua',
    'aura-67',
    'listening',
    'everybody-hates',
    'perfil-proibido',
    'calendario',
    'compressao',
    'nota-sapo',
    'brilho',
    'entidade',
    'comandante',
    'mandioca',
    'infernal'
  ) then
    raise exception 'Unknown curated museum item';
  end if;

  if char_length(v_title) < 1 or char_length(v_title) > 90 then
    raise exception 'Invalid title';
  end if;

  if char_length(v_description) > 1200 then
    raise exception 'Description too long';
  end if;

  if p_category not in ('memes', 'clipes', 'documentos', 'formas') then
    raise exception 'Invalid category';
  end if;

  if p_media_type not in ('imagem', 'video') then
    raise exception 'Invalid media type';
  end if;

  insert into public.museum_curated_overrides (
    item_id,
    title,
    description,
    category,
    media_type,
    media_path,
    updated_by,
    updated_at
  )
  values (
    p_item_id,
    v_title,
    v_description,
    p_category,
    p_media_type,
    nullif(p_media_path, ''),
    v_uid,
    now()
  )
  on conflict (item_id) do update
  set
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    media_type = excluded.media_type,
    media_path = excluded.media_path,
    updated_by = excluded.updated_by,
    updated_at = now();
end;
$$;

revoke all on function public.admin_set_museum_curated_override(
  text, text, text, text, text, text
) from public;
grant execute on function public.admin_set_museum_curated_override(
  text, text, text, text, text, text
) to authenticated;

-- --------------------------------------------------------------------------
-- Utilitário para voltar um item ao asset/texto original empacotado no site.
-- O frontend desta fase não expõe o botão ainda, mas a RPC já fica pronta.
-- --------------------------------------------------------------------------
create or replace function public.admin_reset_museum_curated_override(
  p_item_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_uid
      and p.role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  delete from public.museum_curated_overrides
  where item_id = p_item_id;
end;
$$;

revoke all on function public.admin_reset_museum_curated_override(text) from public;
grant execute on function public.admin_reset_museum_curated_override(text) to authenticated;
