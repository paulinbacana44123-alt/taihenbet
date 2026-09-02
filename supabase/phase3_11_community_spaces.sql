-- TaihenBet 2.0 — Fase 3.11
-- Museu aberto para a comunidade + mural "Para a Tai"
-- Execute DEPOIS das Fases 3.9 / 3.10.

begin;

-- -------------------------------------------------------------------------
-- 1. Museu da comunidade
-- -------------------------------------------------------------------------

create table if not exists public.museum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null,
  media_type text not null,
  media_path text not null unique,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint museum_posts_title_len check (char_length(trim(title)) between 1 and 90),
  constraint museum_posts_description_len check (char_length(description) <= 1200),
  constraint museum_posts_category_check check (category in ('clipes', 'memes', 'documentos', 'formas')),
  constraint museum_posts_media_type_check check (media_type in ('imagem', 'video')),
  constraint museum_posts_status_check check (status in ('published', 'hidden'))
);

create index if not exists museum_posts_created_at_idx
on public.museum_posts (created_at desc);

create index if not exists museum_posts_user_id_idx
on public.museum_posts (user_id);

alter table public.museum_posts enable row level security;
revoke all on table public.museum_posts from anon, authenticated;

-- Os clientes leem somente pela RPC abaixo para não precisarmos reabrir profiles.
create or replace function public.get_museum_posts()
returns table (
  id uuid,
  user_id uuid,
  title text,
  description text,
  category text,
  media_type text,
  media_path text,
  created_at timestamptz,
  author_name text,
  can_delete boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mp.id,
    mp.user_id,
    mp.title,
    mp.description,
    mp.category,
    mp.media_type,
    mp.media_path,
    mp.created_at,
    coalesce(nullif(trim(p.username), ''), 'Cliente da banca') as author_name,
    (
      auth.uid() = mp.user_id
      or public.is_current_user_admin()
    ) as can_delete
  from public.museum_posts mp
  left join public.profiles p on p.id = mp.user_id
  where mp.status = 'published'
  order by mp.created_at desc;
$$;

revoke all on function public.get_museum_posts() from public;
grant execute on function public.get_museum_posts() to anon, authenticated;

create or replace function public.create_museum_post(
  p_title text,
  p_description text,
  p_category text,
  p_media_type text,
  p_media_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_title text := trim(coalesce(p_title, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_category text := lower(trim(coalesce(p_category, '')));
  v_media_type text := lower(trim(coalesce(p_media_type, '')));
  v_media_path text := trim(coalesce(p_media_path, ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(v_title) < 1 or char_length(v_title) > 90 then
    raise exception 'Title must contain between 1 and 90 characters';
  end if;

  if char_length(v_description) > 1200 then
    raise exception 'Description is too long';
  end if;

  if v_category not in ('clipes', 'memes', 'documentos', 'formas') then
    raise exception 'Invalid museum category';
  end if;

  if v_media_type not in ('imagem', 'video') then
    raise exception 'Invalid media type';
  end if;

  -- O objeto precisa estar dentro da pasta do proprio usuario.
  if v_media_path = '' or v_media_path not like v_user_id::text || '/%' then
    raise exception 'Invalid media path';
  end if;

  -- Evita spam acidental por clique duplo.
  if exists (
    select 1
    from public.museum_posts mp
    where mp.user_id = v_user_id
      and mp.created_at > now() - interval '3 seconds'
  ) then
    raise exception 'Wait a moment before publishing again';
  end if;

  insert into public.museum_posts (
    user_id,
    title,
    description,
    category,
    media_type,
    media_path
  ) values (
    v_user_id,
    v_title,
    v_description,
    v_category,
    v_media_type,
    v_media_path
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_museum_post(text, text, text, text, text) from public;
grant execute on function public.create_museum_post(text, text, text, text, text) to authenticated;

create or replace function public.delete_museum_post(p_post_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_path text;
  v_owner uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select mp.media_path, mp.user_id
  into v_path, v_owner
  from public.museum_posts mp
  where mp.id = p_post_id;

  if v_path is null then
    raise exception 'Museum post not found';
  end if;

  if v_owner <> v_user_id and not public.is_current_user_admin() then
    raise exception 'Not allowed to remove this museum post';
  end if;

  delete from public.museum_posts where id = p_post_id;
  return v_path;
end;
$$;

revoke all on function public.delete_museum_post(uuid) from public;
grant execute on function public.delete_museum_post(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- 2. Mural "Para a Tai"
-- -------------------------------------------------------------------------

create table if not exists public.tai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tai_messages_len check (char_length(trim(message)) between 1 and 1600),
  constraint tai_messages_status_check check (status in ('published', 'hidden'))
);

create index if not exists tai_messages_created_at_idx
on public.tai_messages (created_at desc);

create index if not exists tai_messages_user_id_idx
on public.tai_messages (user_id);

alter table public.tai_messages enable row level security;
revoke all on table public.tai_messages from anon, authenticated;

create or replace function public.get_tai_messages()
returns table (
  id uuid,
  user_id uuid,
  message text,
  created_at timestamptz,
  author_name text,
  can_delete boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    tm.id,
    tm.user_id,
    tm.message,
    tm.created_at,
    coalesce(nullif(trim(p.username), ''), 'Cliente da banca') as author_name,
    (
      auth.uid() = tm.user_id
      or public.is_current_user_admin()
    ) as can_delete
  from public.tai_messages tm
  left join public.profiles p on p.id = tm.user_id
  where tm.status = 'published'
  order by tm.created_at desc;
$$;

revoke all on function public.get_tai_messages() from public;
grant execute on function public.get_tai_messages() to anon, authenticated;

create or replace function public.create_tai_message(p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_message text := trim(coalesce(p_message, ''));
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(v_message) < 1 or char_length(v_message) > 1600 then
    raise exception 'Message must contain between 1 and 1600 characters';
  end if;

  if exists (
    select 1
    from public.tai_messages tm
    where tm.user_id = v_user_id
      and tm.created_at > now() - interval '5 seconds'
  ) then
    raise exception 'Wait a moment before sending another message';
  end if;

  insert into public.tai_messages (user_id, message)
  values (v_user_id, v_message)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_tai_message(text) from public;
grant execute on function public.create_tai_message(text) to authenticated;

create or replace function public.delete_tai_message(p_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select tm.user_id
  into v_owner
  from public.tai_messages tm
  where tm.id = p_message_id;

  if v_owner is null then
    raise exception 'Message not found';
  end if;

  if v_owner <> v_user_id and not public.is_current_user_admin() then
    raise exception 'Not allowed to remove this message';
  end if;

  delete from public.tai_messages where id = p_message_id;
  return true;
end;
$$;

revoke all on function public.delete_tai_message(uuid) from public;
grant execute on function public.delete_tai_message(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- 3. Empresas do Grupo TaihenBet
-- -------------------------------------------------------------------------
-- Catalogo publico de empresas 100% ficticias. Apenas admin pode alterar.

create table if not exists public.taihen_group_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  symbol text not null default 'TB',
  sector text not null default 'Operacoes questionaveis',
  slogan text not null default '',
  description text not null default '',
  status_label text not null default 'OPERANDO',
  status_tone text not null default 'neutral',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taihen_group_name_len check (char_length(trim(name)) between 1 and 80),
  constraint taihen_group_symbol_len check (char_length(trim(symbol)) between 1 and 16),
  constraint taihen_group_sector_len check (char_length(trim(sector)) between 1 and 80),
  constraint taihen_group_slogan_len check (char_length(slogan) <= 180),
  constraint taihen_group_description_len check (char_length(description) between 1 and 1200),
  constraint taihen_group_status_len check (char_length(trim(status_label)) between 1 and 50),
  constraint taihen_group_status_tone_check check (status_tone in ('green', 'gold', 'pink', 'red', 'neutral'))
);

alter table public.taihen_group_companies enable row level security;
revoke all on table public.taihen_group_companies from anon, authenticated;

insert into public.taihen_group_companies (
  name,
  symbol,
  sector,
  slogan,
  description,
  status_label,
  status_tone
) values
  (
    'NASA',
    'NASA',
    'Operacoes aeroespaciais ficticias',
    'Agora o espaco tambem responde a banca.',
    'Aquisicao inteiramente ficticia do universo da TaihenBet. A diretoria afirma controlar foguetes, satelites e absolutamente nenhum ativo real da NASA.',
    'ADQUIRIDA NA LORE',
    'gold'
  ),
  (
    'SIV',
    'SIV',
    'Tecnologia e infraestrutura',
    'Se existe uma sigla, a holding provavelmente comprou.',
    'Divisao corporativa ficticia registrada depois de uma reuniao cuja ata provavelmente foi escrita no chat do Discord.',
    'OPERANDO',
    'green'
  ),
  (
    'DJI',
    'DJI',
    'Equipamentos e operacoes aereas ficticias',
    'A banca observa tudo, pelo menos na piada.',
    'Participacao ficticia do Grupo TaihenBet. Nao representa propriedade, parceria ou vinculo real com a empresa DJI.',
    'PARTICIPACAO FICTICIA',
    'pink'
  ),
  (
    'Taihen Airlines',
    'TA',
    'Aviacao questionavel',
    'Seu destino e problema do departamento de logistica.',
    'Companhia aerea oficial da lore do Grupo TaihenBet, criada para transportar clientes, memes e decisoes financeiras ficticias entre jurisdicoes imaginarias.',
    'VOANDO POR ALGUM MOTIVO',
    'green'
  )
on conflict (name) do nothing;

create or replace function public.get_taihen_group_companies()
returns table (
  id uuid,
  name text,
  symbol text,
  sector text,
  slogan text,
  description text,
  status_label text,
  status_tone text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.name,
    c.symbol,
    c.sector,
    c.slogan,
    c.description,
    c.status_label,
    c.status_tone,
    c.created_at
  from public.taihen_group_companies c
  order by c.created_at asc, c.name asc;
$$;

revoke all on function public.get_taihen_group_companies() from public;
grant execute on function public.get_taihen_group_companies() to anon, authenticated;

create or replace function public.admin_upsert_taihen_group_company(
  p_company_id uuid,
  p_name text,
  p_symbol text,
  p_sector text,
  p_slogan text,
  p_description text,
  p_status_label text,
  p_status_tone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_symbol text := trim(coalesce(p_symbol, ''));
  v_sector text := trim(coalesce(p_sector, ''));
  v_slogan text := trim(coalesce(p_slogan, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_status_label text := upper(trim(coalesce(p_status_label, '')));
  v_status_tone text := lower(trim(coalesce(p_status_tone, 'neutral')));
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'Company name must contain between 1 and 80 characters';
  end if;

  if char_length(v_symbol) < 1 or char_length(v_symbol) > 16 then
    raise exception 'Company symbol must contain between 1 and 16 characters';
  end if;

  if char_length(v_sector) < 1 or char_length(v_sector) > 80 then
    raise exception 'Company sector must contain between 1 and 80 characters';
  end if;

  if char_length(v_slogan) > 180 then
    raise exception 'Company slogan is too long';
  end if;

  if char_length(v_description) < 1 or char_length(v_description) > 1200 then
    raise exception 'Company description must contain between 1 and 1200 characters';
  end if;

  if char_length(v_status_label) < 1 or char_length(v_status_label) > 50 then
    raise exception 'Company status must contain between 1 and 50 characters';
  end if;

  if v_status_tone not in ('green', 'gold', 'pink', 'red', 'neutral') then
    raise exception 'Invalid company status tone';
  end if;

  if p_company_id is null then
    insert into public.taihen_group_companies (
      name,
      symbol,
      sector,
      slogan,
      description,
      status_label,
      status_tone
    ) values (
      v_name,
      v_symbol,
      v_sector,
      v_slogan,
      v_description,
      v_status_label,
      v_status_tone
    )
    returning id into v_id;
  else
    update public.taihen_group_companies
    set
      name = v_name,
      symbol = v_symbol,
      sector = v_sector,
      slogan = v_slogan,
      description = v_description,
      status_label = v_status_label,
      status_tone = v_status_tone,
      updated_at = now()
    where id = p_company_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Company not found';
    end if;
  end if;

  return v_id;
end;
$$;

revoke all on function public.admin_upsert_taihen_group_company(uuid, text, text, text, text, text, text, text) from public;
grant execute on function public.admin_upsert_taihen_group_company(uuid, text, text, text, text, text, text, text) to authenticated;

create or replace function public.admin_delete_taihen_group_company(p_company_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  delete from public.taihen_group_companies
  where id = p_company_id;

  if not found then
    raise exception 'Company not found';
  end if;

  return true;
end;
$$;

revoke all on function public.admin_delete_taihen_group_company(uuid) from public;
grant execute on function public.admin_delete_taihen_group_company(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- 4. Bucket do Museu
-- -------------------------------------------------------------------------
-- O bucket e publico SOMENTE para leitura dos arquivos publicados.
-- Escrita e exclusao continuam vinculadas ao usuario autenticado.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'museum-community',
  'museum-community',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "museum community upload own folder" on storage.objects;
create policy "museum community upload own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'museum-community'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "museum community delete own or admin" on storage.objects;
create policy "museum community delete own or admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'museum-community'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_current_user_admin()
  )
);

commit;
