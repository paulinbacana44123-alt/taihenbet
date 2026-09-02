begin;

-- ============================================================
-- TAIHENBET 2.0 - FASE 3.14
-- CENTRAL DE MODERACAO
-- ============================================================

alter table public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists suspended_by uuid references auth.users(id) on delete set null;

create table if not exists public.admin_moderation_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text not null,
  action text not null,
  target_type text not null,
  target_id text,
  target_user_id uuid references auth.users(id) on delete set null,
  target_name text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_moderation_log enable row level security;
revoke all on table public.admin_moderation_log from anon, authenticated;

create or replace function public.is_current_user_suspended()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.is_suspended
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    ),
    false
  );
$$;

revoke all on function public.is_current_user_suspended() from public;
grant execute on function public.is_current_user_suspended() to authenticated;

create or replace function public.reject_suspended_user_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
  v_suspended boolean := false;
begin
  -- Escritas internas sem JWT continuam funcionando.
  if v_uid is null then
    return new;
  end if;

  select
    coalesce(p.role::text = 'admin', false),
    coalesce(p.is_suspended, false)
  into v_is_admin, v_suspended
  from public.profiles p
  where p.id = v_uid;

  if v_is_admin then
    return new;
  end if;

  if v_suspended then
    raise exception using
      errcode = 'P0001',
      message = 'ACCOUNT_SUSPENDED',
      detail = 'Esta conta foi suspensa pela administracao da TaihenBet.';
  end if;

  return new;
end;
$$;

revoke all on function public.reject_suspended_user_write() from public;

-- Bloqueia mutacoes dos recursos que representam jogar/apostar/publicar.
-- O bloco e tolerante a tabelas que eventualmente ainda nao existam.
do $$
declare
  v_table text;
  v_tables text[] := array[
    'museum_posts',
    'tai_messages',
    'sports_bets',
    'sports_bet_selections',
    'game_rounds',
    'taimandioca_sessions',
    'crash_regime_sessions',
    'derby_sessions'
  ];
begin
  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is not null then
      execute format(
        'drop trigger if exists taihenbet_block_suspended_writes on public.%I',
        v_table
      );

      execute format(
        'create trigger taihenbet_block_suspended_writes before insert or update on public.%I for each row execute function public.reject_suspended_user_write()',
        v_table
      );
    end if;
  end loop;
end
$$;

-- O upload acontece antes do registro no Museu, entao a Storage policy
-- tambem precisa impedir arquivos de contas suspensas.
drop policy if exists "museum community upload own folder" on storage.objects;
create policy "museum community upload own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'museum-community'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_current_user_suspended()
);

-- ============================================================
-- USUARIOS DA CENTRAL
-- ============================================================
create or replace function public.get_admin_moderation_users()
returns table (
  id uuid,
  username text,
  avatar_key text,
  balance numeric,
  role text,
  created_at timestamptz,
  is_suspended boolean,
  suspended_at timestamptz,
  suspended_reason text,
  suspended_by uuid
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    p.id,
    p.username,
    p.avatar_key,
    p.balance,
    p.role::text,
    p.created_at,
    p.is_suspended,
    p.suspended_at,
    p.suspended_reason,
    p.suspended_by
  from public.profiles p
  order by p.is_suspended desc, lower(p.username), p.created_at;
end;
$$;

revoke all on function public.get_admin_moderation_users() from public;
grant execute on function public.get_admin_moderation_users() to authenticated;

create or replace function public.admin_set_user_suspension(
  p_user_id uuid,
  p_suspended boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_target_name text;
  v_target_role text;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  select p.username
  into v_actor_name
  from public.profiles p
  where p.id = v_actor_id
    and p.role::text = 'admin';

  if v_actor_name is null then
    raise exception 'Admin access required';
  end if;

  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'Sua propria conta administrativa esta protegida.';
  end if;

  select p.username, p.role::text
  into v_target_name, v_target_role
  from public.profiles p
  where p.id = p_user_id;

  if v_target_name is null then
    raise exception 'Conta nao encontrada';
  end if;

  if p_suspended and v_reason is null then
    raise exception 'Informe o motivo da suspensao';
  end if;

  update public.profiles
  set
    is_suspended = p_suspended,
    suspended_at = case when p_suspended then now() else null end,
    suspended_reason = case when p_suspended then left(v_reason, 500) else null end,
    suspended_by = case when p_suspended then v_actor_id else null end,
    updated_at = now()
  where id = p_user_id;

  insert into public.admin_moderation_log (
    actor_user_id,
    actor_name,
    action,
    target_type,
    target_id,
    target_user_id,
    target_name,
    details
  ) values (
    v_actor_id,
    v_actor_name,
    case when p_suspended then 'user_suspended' else 'user_reactivated' end,
    'user',
    p_user_id::text,
    p_user_id,
    v_target_name,
    jsonb_build_object(
      'reason', case when p_suspended then left(v_reason, 500) else null end,
      'role', v_target_role
    )
  );

  return jsonb_build_object(
    'user_id', p_user_id,
    'username', v_target_name,
    'is_suspended', p_suspended,
    'reason', case when p_suspended then left(v_reason, 500) else null end
  );
end;
$$;

revoke all on function public.admin_set_user_suspension(uuid, boolean, text) from public;
grant execute on function public.admin_set_user_suspension(uuid, boolean, text) to authenticated;

-- ============================================================
-- MODERACAO DO MUSEU
-- ============================================================
create or replace function public.get_admin_museum_posts()
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  title text,
  description text,
  category text,
  media_type text,
  media_path text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    m.id,
    m.user_id,
    coalesce(p.username, 'Conta removida')::text,
    m.title,
    m.description,
    m.category,
    m.media_type,
    m.media_path,
    m.status,
    m.created_at
  from public.museum_posts m
  left join public.profiles p on p.id = m.user_id
  order by m.created_at desc;
end;
$$;

revoke all on function public.get_admin_museum_posts() from public;
grant execute on function public.get_admin_museum_posts() to authenticated;

create or replace function public.admin_remove_museum_post(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_user_id uuid;
  v_author_name text;
  v_title text;
  v_category text;
  v_media_path text;
begin
  select p.username into v_actor_name
  from public.profiles p
  where p.id = v_actor_id and p.role::text = 'admin';

  if v_actor_name is null then
    raise exception 'Admin access required';
  end if;

  select
    m.user_id,
    coalesce(p.username, 'Conta removida'),
    m.title,
    m.category,
    m.media_path
  into
    v_user_id,
    v_author_name,
    v_title,
    v_category,
    v_media_path
  from public.museum_posts m
  left join public.profiles p on p.id = m.user_id
  where m.id = p_post_id;

  if v_title is null then
    raise exception 'Publicacao nao encontrada';
  end if;

  delete from public.museum_posts where id = p_post_id;

  insert into public.admin_moderation_log (
    actor_user_id, actor_name, action, target_type,
    target_id, target_user_id, target_name, details
  ) values (
    v_actor_id, v_actor_name, 'museum_post_removed', 'museum_post',
    p_post_id::text, v_user_id, v_title,
    jsonb_build_object(
      'author', v_author_name,
      'category', v_category,
      'media_path', v_media_path
    )
  );

  return jsonb_build_object(
    'post_id', p_post_id,
    'title', v_title,
    'author_name', v_author_name,
    'media_path', v_media_path
  );
end;
$$;

revoke all on function public.admin_remove_museum_post(uuid) from public;
grant execute on function public.admin_remove_museum_post(uuid) to authenticated;

-- ============================================================
-- MODERACAO DO PARA A TAI
-- ============================================================
create or replace function public.get_admin_tai_messages()
returns table (
  id uuid,
  user_id uuid,
  author_name text,
  message text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    m.id,
    m.user_id,
    coalesce(p.username, 'Conta removida')::text,
    m.message,
    m.status,
    m.created_at
  from public.tai_messages m
  left join public.profiles p on p.id = m.user_id
  order by m.created_at desc;
end;
$$;

revoke all on function public.get_admin_tai_messages() from public;
grant execute on function public.get_admin_tai_messages() to authenticated;

create or replace function public.admin_remove_tai_message(p_message_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_user_id uuid;
  v_author_name text;
  v_message text;
begin
  select p.username into v_actor_name
  from public.profiles p
  where p.id = v_actor_id and p.role::text = 'admin';

  if v_actor_name is null then
    raise exception 'Admin access required';
  end if;

  select
    m.user_id,
    coalesce(p.username, 'Conta removida'),
    m.message
  into v_user_id, v_author_name, v_message
  from public.tai_messages m
  left join public.profiles p on p.id = m.user_id
  where m.id = p_message_id;

  if v_message is null then
    raise exception 'Mensagem nao encontrada';
  end if;

  delete from public.tai_messages where id = p_message_id;

  insert into public.admin_moderation_log (
    actor_user_id, actor_name, action, target_type,
    target_id, target_user_id, target_name, details
  ) values (
    v_actor_id, v_actor_name, 'tai_message_removed', 'tai_message',
    p_message_id::text, v_user_id, v_author_name,
    jsonb_build_object(
      'preview', left(v_message, 220)
    )
  );

  return jsonb_build_object(
    'message_id', p_message_id,
    'author_name', v_author_name
  );
end;
$$;

revoke all on function public.admin_remove_tai_message(uuid) from public;
grant execute on function public.admin_remove_tai_message(uuid) to authenticated;

-- ============================================================
-- LOG ADMINISTRATIVO
-- ============================================================
create or replace function public.get_admin_moderation_logs(p_limit integer default 100)
returns table (
  id uuid,
  actor_user_id uuid,
  actor_name text,
  action text,
  target_type text,
  target_id text,
  target_user_id uuid,
  target_name text,
  details jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 100), 250));
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  return query
  select
    l.id,
    l.actor_user_id,
    l.actor_name,
    l.action,
    l.target_type,
    l.target_id,
    l.target_user_id,
    l.target_name,
    l.details,
    l.created_at
  from public.admin_moderation_log l
  order by l.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.get_admin_moderation_logs(integer) from public;
grant execute on function public.get_admin_moderation_logs(integer) to authenticated;

-- ============================================================
-- ATUALIZA A EXCLUSAO DEFINITIVA DA FASE 3.13 PARA GERAR LOG
-- ============================================================
create or replace function public.admin_delete_user_account(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_target_name text;
  v_media_paths text[] := array[]::text[];
begin
  select p.username
  into v_actor_name
  from public.profiles p
  where p.id = v_actor_id
    and p.role::text = 'admin';

  if v_actor_name is null then
    raise exception 'Admin access required';
  end if;

  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'Voce nao pode excluir a propria conta administrativa.';
  end if;

  select p.username
  into v_target_name
  from public.profiles p
  where p.id = p_user_id;

  if v_target_name is null then
    raise exception 'Conta nao encontrada';
  end if;

  if to_regclass('public.museum_posts') is not null then
    select coalesce(array_agg(m.media_path), array[]::text[])
    into v_media_paths
    from public.museum_posts m
    where m.user_id = p_user_id
      and m.media_path is not null;
  end if;

  insert into public.admin_moderation_log (
    actor_user_id, actor_name, action, target_type,
    target_id, target_user_id, target_name, details
  ) values (
    v_actor_id,
    v_actor_name,
    'user_deleted',
    'user',
    p_user_id::text,
    p_user_id,
    v_target_name,
    jsonb_build_object('museum_media_paths', to_jsonb(v_media_paths))
  );

  delete from auth.users where id = p_user_id;

  if not found then
    raise exception 'Usuario do Auth nao encontrado';
  end if;

  return jsonb_build_object(
    'deleted_user_id', p_user_id,
    'username', v_target_name,
    'media_paths', to_jsonb(v_media_paths)
  );
end;
$$;

revoke all on function public.admin_delete_user_account(uuid) from public;
grant execute on function public.admin_delete_user_account(uuid) to authenticated;

commit;
