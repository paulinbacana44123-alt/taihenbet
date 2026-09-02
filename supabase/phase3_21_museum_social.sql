begin;

-- ============================================================
-- TAIHENBET 2.0 — FASE 3.21
-- COMENTARIOS + REACOES NO MUSEU
-- Execute depois da Fase 3.20a.
-- ============================================================

-- -------------------------------------------------------------------------
-- 1. Estrutura social do Museu
-- -------------------------------------------------------------------------

create table if not exists public.museum_reactions (
  post_id uuid not null references public.museum_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id),
  constraint museum_reactions_type_check
    check (reaction in ('mandioca', 'fogo', 'sofrimento', 'falencia'))
);

create index if not exists museum_reactions_post_idx
  on public.museum_reactions (post_id);
create index if not exists museum_reactions_user_idx
  on public.museum_reactions (user_id);

-- Recibo persistente para uma conta não poder spammar o autor
-- alternando reação off/on repetidamente.
create table if not exists public.museum_reaction_notification_receipts (
  post_id uuid not null references public.museum_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_notified_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.museum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.museum_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  comment text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint museum_comments_len_check
    check (char_length(trim(comment)) between 1 and 600),
  constraint museum_comments_status_check
    check (status in ('published', 'hidden'))
);

create index if not exists museum_comments_post_created_idx
  on public.museum_comments (post_id, created_at asc);
create index if not exists museum_comments_user_idx
  on public.museum_comments (user_id);

alter table public.museum_reactions enable row level security;
alter table public.museum_reaction_notification_receipts enable row level security;
alter table public.museum_comments enable row level security;
revoke all on table public.museum_reactions from anon, authenticated;
revoke all on table public.museum_reaction_notification_receipts from anon, authenticated;
revoke all on table public.museum_comments from anon, authenticated;

-- As escritas continuam passando pelas RPCs, igual ao restante do projeto.
-- Tambem preservamos a regra da Fase 3.14 para contas suspensas.
drop trigger if exists taihenbet_block_suspended_writes on public.museum_reactions;
create trigger taihenbet_block_suspended_writes
before insert or update on public.museum_reactions
for each row execute function public.reject_suspended_user_write();

drop trigger if exists taihenbet_block_suspended_writes on public.museum_comments;
create trigger taihenbet_block_suspended_writes
before insert or update on public.museum_comments
for each row execute function public.reject_suspended_user_write();

-- -------------------------------------------------------------------------
-- 2. Lista do Museu com contadores sociais
-- Mantemos get_museum_posts() intacta por compatibilidade.
-- -------------------------------------------------------------------------

create or replace function public.get_museum_posts_social()
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
  can_delete boolean,
  reaction_count bigint,
  comment_count bigint
)
language sql
stable
security definer
set search_path = ''
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
    coalesce(nullif(trim(p.username), ''), 'Cliente da banca')::text as author_name,
    (
      auth.uid() = mp.user_id
      or exists (
        select 1 from public.profiles adminp
        where adminp.id = auth.uid() and adminp.role::text = 'admin'
      )
    ) as can_delete,
    (
      select count(*)
      from public.museum_reactions mr
      where mr.post_id = mp.id
    ) as reaction_count,
    (
      select count(*)
      from public.museum_comments mc
      where mc.post_id = mp.id and mc.status = 'published'
    ) as comment_count
  from public.museum_posts mp
  left join public.profiles p on p.id = mp.user_id
  where mp.status = 'published'
  order by mp.created_at desc;
$$;

revoke all on function public.get_museum_posts_social() from public;
grant execute on function public.get_museum_posts_social() to anon, authenticated;

-- -------------------------------------------------------------------------
-- 3. Snapshot de reacoes e comentarios de uma relíquia
-- -------------------------------------------------------------------------

create or replace function public.get_museum_post_social(p_post_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_my_reaction text;
  v_comments jsonb;
  v_mandioca bigint := 0;
  v_fogo bigint := 0;
  v_sofrimento bigint := 0;
  v_falencia bigint := 0;
  v_total bigint := 0;
begin
  if not exists (
    select 1 from public.museum_posts mp
    where mp.id = p_post_id and mp.status = 'published'
  ) then
    raise exception 'Museum post not found';
  end if;

  select
    count(*) filter (where mr.reaction = 'mandioca'),
    count(*) filter (where mr.reaction = 'fogo'),
    count(*) filter (where mr.reaction = 'sofrimento'),
    count(*) filter (where mr.reaction = 'falencia'),
    count(*)
  into v_mandioca, v_fogo, v_sofrimento, v_falencia, v_total
  from public.museum_reactions mr
  where mr.post_id = p_post_id;

  if v_uid is not null then
    select mr.reaction into v_my_reaction
    from public.museum_reactions mr
    where mr.post_id = p_post_id and mr.user_id = v_uid;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', mc.id,
        'user_id', mc.user_id,
        'author_name', coalesce(nullif(trim(p.username), ''), 'Cliente da banca'),
        'comment', mc.comment,
        'created_at', mc.created_at,
        -- A exclusao pela tela do Museu e reservada ao proprio autor.
        -- Administradores usam a Central de Moderacao para deixar log.
        'can_delete', (v_uid is not null and v_uid = mc.user_id)
      )
      order by mc.created_at asc
    ),
    '[]'::jsonb
  ) into v_comments
  from public.museum_comments mc
  left join public.profiles p on p.id = mc.user_id
  where mc.post_id = p_post_id
    and mc.status = 'published';

  return jsonb_build_object(
    'reactions', jsonb_build_object(
      'mandioca', coalesce(v_mandioca, 0),
      'fogo', coalesce(v_fogo, 0),
      'sofrimento', coalesce(v_sofrimento, 0),
      'falencia', coalesce(v_falencia, 0)
    ),
    'total_reactions', coalesce(v_total, 0),
    'my_reaction', v_my_reaction,
    'comments', coalesce(v_comments, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_museum_post_social(uuid) from public;
grant execute on function public.get_museum_post_social(uuid) to anon, authenticated;

-- -------------------------------------------------------------------------
-- 4. Reacoes — um voto por conta em cada relíquia
-- Repetir a mesma reação remove; escolher outra troca o voto.
-- -------------------------------------------------------------------------

create or replace function public.set_museum_reaction(
  p_post_id uuid,
  p_reaction text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_reaction text := lower(trim(coalesce(p_reaction, '')));
  v_existing text;
  v_owner uuid;
  v_title text;
  v_actor_name text;
  v_label text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if public.is_current_user_suspended() then
    raise exception 'ACCOUNT_SUSPENDED';
  end if;

  if v_reaction not in ('mandioca', 'fogo', 'sofrimento', 'falencia') then
    raise exception 'Invalid museum reaction';
  end if;

  select mp.user_id, mp.title
  into v_owner, v_title
  from public.museum_posts mp
  where mp.id = p_post_id and mp.status = 'published';

  if v_owner is null then
    raise exception 'Museum post not found';
  end if;

  select mr.reaction into v_existing
  from public.museum_reactions mr
  where mr.post_id = p_post_id and mr.user_id = v_uid;

  if v_existing = v_reaction then
    delete from public.museum_reactions
    where post_id = p_post_id and user_id = v_uid;

    return jsonb_build_object('action', 'removed', 'reaction', null);
  end if;

  if v_existing is null then
    insert into public.museum_reactions (post_id, user_id, reaction)
    values (p_post_id, v_uid, v_reaction);

    -- Uma única notificação por conta/peça, mesmo se o usuário
    -- remover a reação e colocá-la novamente depois.
    if v_owner <> v_uid then
      insert into public.museum_reaction_notification_receipts (post_id, user_id)
      values (p_post_id, v_uid)
      on conflict (post_id, user_id) do nothing;

      if found then
        select coalesce(nullif(trim(p.username), ''), 'Um cliente da banca')
        into v_actor_name
        from public.profiles p
        where p.id = v_uid;

        v_label := case v_reaction
          when 'mandioca' then '🍠 Mandioca'
          when 'fogo' then '🔥 Fogo'
          when 'sofrimento' then '😭 Sofrimento'
          when 'falencia' then '💸 Falência'
          else v_reaction
        end;

        perform public._notify_user(
          v_owner,
          'museum',
          'Nova reação no Museu',
          coalesce(v_actor_name, 'Um cliente da banca') ||
            ' reagiu com ' || v_label || ' em “' || left(v_title, 90) || '”.',
          'museu',
          p_post_id::text,
          jsonb_build_object(
            'post_id', p_post_id,
            'actor_user_id', v_uid,
            'reaction', v_reaction
          )
        );
      end if;
    end if;

    return jsonb_build_object('action', 'created', 'reaction', v_reaction);
  end if;

  update public.museum_reactions
  set reaction = v_reaction, updated_at = now()
  where post_id = p_post_id and user_id = v_uid;

  return jsonb_build_object('action', 'changed', 'reaction', v_reaction);
end;
$$;

revoke all on function public.set_museum_reaction(uuid, text) from public;
grant execute on function public.set_museum_reaction(uuid, text) to authenticated;

-- -------------------------------------------------------------------------
-- 5. Comentarios
-- -------------------------------------------------------------------------

create or replace function public.create_museum_comment(
  p_post_id uuid,
  p_comment text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_comment text := trim(coalesce(p_comment, ''));
  v_id uuid;
  v_owner uuid;
  v_title text;
  v_actor_name text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if public.is_current_user_suspended() then
    raise exception 'ACCOUNT_SUSPENDED';
  end if;

  if char_length(v_comment) < 1 or char_length(v_comment) > 600 then
    raise exception 'Comment must contain between 1 and 600 characters';
  end if;

  select mp.user_id, mp.title
  into v_owner, v_title
  from public.museum_posts mp
  where mp.id = p_post_id and mp.status = 'published';

  if v_owner is null then
    raise exception 'Museum post not found';
  end if;

  if exists (
    select 1
    from public.museum_comments mc
    where mc.user_id = v_uid
      and mc.created_at > now() - interval '3 seconds'
  ) then
    raise exception 'Wait a moment before commenting again';
  end if;

  insert into public.museum_comments (post_id, user_id, comment)
  values (p_post_id, v_uid, v_comment)
  returning id into v_id;

  if v_owner <> v_uid then
    select coalesce(nullif(trim(p.username), ''), 'Um cliente da banca')
    into v_actor_name
    from public.profiles p
    where p.id = v_uid;

    perform public._notify_user(
      v_owner,
      'museum',
      'Novo comentário no Museu',
      coalesce(v_actor_name, 'Um cliente da banca') ||
        ' comentou em “' || left(v_title, 90) || '”: ' || left(v_comment, 180),
      'museu',
      p_post_id::text,
      jsonb_build_object(
        'post_id', p_post_id,
        'comment_id', v_id,
        'actor_user_id', v_uid
      )
    );
  end if;

  return v_id;
end;
$$;

revoke all on function public.create_museum_comment(uuid, text) from public;
grant execute on function public.create_museum_comment(uuid, text) to authenticated;

create or replace function public.delete_museum_comment(p_comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select mc.user_id into v_owner
  from public.museum_comments mc
  where mc.id = p_comment_id;

  if v_owner is null then
    raise exception 'Comment not found';
  end if;

  if v_owner <> v_uid then
    raise exception 'Not allowed to remove this comment';
  end if;

  delete from public.museum_comments where id = p_comment_id;
  return true;
end;
$$;

revoke all on function public.delete_museum_comment(uuid) from public;
grant execute on function public.delete_museum_comment(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- 6. Central de Moderacao — comentarios do Museu
-- -------------------------------------------------------------------------

create or replace function public.get_admin_museum_comments()
returns table (
  id uuid,
  post_id uuid,
  user_id uuid,
  author_name text,
  post_title text,
  comment text,
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
    mc.id,
    mc.post_id,
    mc.user_id,
    coalesce(nullif(trim(p.username), ''), 'Conta removida')::text,
    mp.title,
    mc.comment,
    mc.status,
    mc.created_at
  from public.museum_comments mc
  join public.museum_posts mp on mp.id = mc.post_id
  left join public.profiles p on p.id = mc.user_id
  order by mc.created_at desc;
end;
$$;

revoke all on function public.get_admin_museum_comments() from public;
grant execute on function public.get_admin_museum_comments() to authenticated;

create or replace function public.admin_remove_museum_comment(p_comment_id uuid)
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
  v_post_id uuid;
  v_post_title text;
  v_comment text;
begin
  select p.username into v_actor_name
  from public.profiles p
  where p.id = v_actor_id and p.role::text = 'admin';

  if v_actor_name is null then
    raise exception 'Admin access required';
  end if;

  select
    mc.user_id,
    coalesce(nullif(trim(p.username), ''), 'Conta removida'),
    mc.post_id,
    mp.title,
    mc.comment
  into
    v_user_id,
    v_author_name,
    v_post_id,
    v_post_title,
    v_comment
  from public.museum_comments mc
  join public.museum_posts mp on mp.id = mc.post_id
  left join public.profiles p on p.id = mc.user_id
  where mc.id = p_comment_id;

  if v_comment is null then
    raise exception 'Comentario nao encontrado';
  end if;

  delete from public.museum_comments where id = p_comment_id;

  insert into public.admin_moderation_log (
    actor_user_id, actor_name, action, target_type,
    target_id, target_user_id, target_name, details
  ) values (
    v_actor_id,
    v_actor_name,
    'museum_comment_removed',
    'museum_comment',
    p_comment_id::text,
    v_user_id,
    left(v_comment, 120),
    jsonb_build_object(
      'author', v_author_name,
      'post_id', v_post_id,
      'post_title', v_post_title,
      'comment', v_comment
    )
  );

  return jsonb_build_object(
    'comment_id', p_comment_id,
    'author_name', v_author_name,
    'post_title', v_post_title
  );
end;
$$;

revoke all on function public.admin_remove_museum_comment(uuid) from public;
grant execute on function public.admin_remove_museum_comment(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- 7. Notificacao de moderacao da Fase 3.17 — adiciona comentario removido
-- -------------------------------------------------------------------------

create or replace function public._notify_moderation_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_message text;
  v_page text;
begin
  if new.target_user_id is null then return new; end if;

  case new.action
    when 'user_suspended' then
      v_title := 'Conta suspensa pela banca';
      v_message := 'Sua conta foi suspensa. Motivo: ' || coalesce(new.details->>'reason', 'não informado') || '.';
      v_page := 'inicio';
    when 'user_reactivated' then
      v_title := 'Conta reativada';
      v_message := 'A banca devolveu o acesso às operações da sua conta.';
      v_page := 'inicio';
    when 'museum_post_removed' then
      v_title := 'Peça removida do Museu';
      v_message := 'Uma publicação sua foi removida pela Central de Moderação.';
      v_page := 'museu';
    when 'museum_comment_removed' then
      v_title := 'Comentário removido do Museu';
      v_message := 'Um comentário seu no Museu foi removido pela Central de Moderação.';
      v_page := 'museu';
    when 'tai_message_removed' then
      v_title := 'Mensagem removida';
      v_message := 'Uma mensagem sua em Para a Tai foi removida pela Central de Moderação.';
      v_page := 'para-tai';
    else
      return new;
  end case;

  perform public._notify_user(
    new.target_user_id,
    'moderation',
    v_title,
    v_message,
    v_page,
    new.target_id,
    jsonb_build_object('action', new.action, 'moderator', new.actor_name)
  );
  return new;
end;
$$;

commit;
