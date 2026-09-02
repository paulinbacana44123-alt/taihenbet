-- TaihenBet 2.0 — Fase 3.13
-- Exclusão administrativa de contas
-- Execute DEPOIS das Fases 3.9, 3.10 e 3.11.
--
-- A função abaixo:
--   * exige sessão autenticada;
--   * exige role=admin em public.profiles;
--   * proíbe o admin de excluir a própria conta;
--   * apaga o usuário em auth.users;
--   * deixa as FKs ON DELETE CASCADE / SET NULL cuidarem dos dados vinculados;
--   * devolve os caminhos de mídia do Museu para o frontend removê-los do Storage.

begin;

create or replace function public.admin_delete_user_account(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_username text;
  v_media_paths text[] := array[]::text[];
  v_deleted_count integer := 0;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_user_id is null then
    raise exception 'Target user is required';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'You cannot delete your own account from the admin panel';
  end if;

  select p.username
  into v_username
  from public.profiles p
  where p.id = p_user_id;

  if v_username is null then
    raise exception 'Account not found';
  end if;

  -- Guarda os objetos publicados pelo usuário antes do cascade apagar os posts.
  select coalesce(array_agg(mp.media_path order by mp.created_at), array[]::text[])
  into v_media_paths
  from public.museum_posts mp
  where mp.user_id = p_user_id;

  -- profiles.id referencia auth.users(id) ON DELETE CASCADE. As tabelas de jogos,
  -- carteira, histórico, comunidade etc. também foram criadas com cascade/set null.
  delete from auth.users au
  where au.id = p_user_id;

  get diagnostics v_deleted_count = row_count;

  if v_deleted_count <> 1 then
    raise exception 'Auth account could not be deleted';
  end if;

  return pg_catalog.jsonb_build_object(
    'deleted_user_id', p_user_id,
    'username', v_username,
    'media_paths', to_jsonb(v_media_paths)
  );
end;
$$;

revoke all on function public.admin_delete_user_account(uuid) from public;
grant execute on function public.admin_delete_user_account(uuid) to authenticated;

commit;
