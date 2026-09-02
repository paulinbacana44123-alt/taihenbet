-- TaihenBet 2.0 — Fase 3.6
-- Histórico por conta + ranking real da comunidade.
-- Execute este arquivo inteiro no SQL Editor do Supabase DEPOIS da Fase 3.4.

begin;

create table if not exists public.user_history_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  sports_history jsonb not null default '[]'::jsonb,
  games_history jsonb not null default '[]'::jsonb,
  legacy_history_imported boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint sports_history_is_array check (jsonb_typeof(sports_history) = 'array'),
  constraint games_history_is_array check (jsonb_typeof(games_history) = 'array')
);

create or replace function public.set_history_state_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_history_state_set_updated_at on public.user_history_state;
create trigger user_history_state_set_updated_at
before update on public.user_history_state
for each row execute function public.set_history_state_updated_at();

-- Toda conta que ganha um profile também ganha um arquivo de histórico.
create or replace function public.handle_new_profile_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_history_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_profile_created_history on public.profiles;
create trigger on_profile_created_history
after insert on public.profiles
for each row execute function public.handle_new_profile_history();

insert into public.user_history_state (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

alter table public.user_history_state enable row level security;

drop policy if exists "users read own history state" on public.user_history_state;
create policy "users read own history state"
on public.user_history_state
for select
to authenticated
using (auth.uid() = user_id);

revoke all on table public.user_history_state from anon, authenticated;
grant select on table public.user_history_state to authenticated;

-- Resolve uma única vez o histórico antigo que existia no navegador antes das contas.
create or replace function public.resolve_legacy_history(
  p_import_local boolean,
  p_sports_history jsonb default '[]'::jsonb,
  p_games_history jsonb default '[]'::jsonb
)
returns public.user_history_state
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.user_history_state;
  safe_sports jsonb;
  safe_games jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into result
  from public.user_history_state
  where user_id = auth.uid()
  for update;

  if not found then
    insert into public.user_history_state (user_id)
    values (auth.uid())
    returning * into result;
  end if;

  if result.legacy_history_imported then
    return result;
  end if;

  safe_sports := case
    when jsonb_typeof(coalesce(p_sports_history, '[]'::jsonb)) = 'array'
      then coalesce(p_sports_history, '[]'::jsonb)
    else '[]'::jsonb
  end;

  safe_games := case
    when jsonb_typeof(coalesce(p_games_history, '[]'::jsonb)) = 'array'
      then coalesce(p_games_history, '[]'::jsonb)
    else '[]'::jsonb
  end;

  if jsonb_array_length(safe_sports) > 1000 or jsonb_array_length(safe_games) > 2000 then
    raise exception 'Legacy history is too large';
  end if;

  update public.user_history_state
  set sports_history = case when p_import_local then safe_sports else '[]'::jsonb end,
      games_history = case when p_import_local then safe_games else '[]'::jsonb end,
      legacy_history_imported = true
  where user_id = auth.uid()
  returning * into result;

  return result;
end;
$$;

-- Ponte da Fase 3.6: persiste o arquivo atual da conta sem expor UPDATE direto.
-- Os resultados ainda nascem no cliente; a fase autoritativa do backend vem depois.
create or replace function public.sync_my_history(
  p_sports_history jsonb,
  p_games_history jsonb
)
returns public.user_history_state
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.user_history_state;
  safe_sports jsonb;
  safe_games jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  safe_sports := coalesce(p_sports_history, '[]'::jsonb);
  safe_games := coalesce(p_games_history, '[]'::jsonb);

  if jsonb_typeof(safe_sports) <> 'array' or jsonb_typeof(safe_games) <> 'array' then
    raise exception 'History payload must be arrays';
  end if;

  if jsonb_array_length(safe_sports) > 1000 or jsonb_array_length(safe_games) > 2000 then
    raise exception 'History is too large';
  end if;

  update public.user_history_state
  set sports_history = safe_sports,
      games_history = safe_games
  where user_id = auth.uid()
    and legacy_history_imported = true
  returning * into result;

  if not found then
    raise exception 'Resolve legacy history first';
  end if;

  return result;
end;
$$;

-- Ranking público: expõe apenas estatísticas agregadas; e-mail e histórico detalhado ficam privados.
create or replace function public.get_public_ranking()
returns table (
  id uuid,
  username text,
  avatar_key text,
  role text,
  balance numeric,
  joined_at timestamptz,
  sports_count bigint,
  games_count bigint,
  wins bigint,
  losses bigint,
  pending bigint,
  total_staked numeric,
  total_payout numeric,
  net_profit numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with profile_rows as (
    select
      p.id,
      p.username,
      p.avatar_key,
      p.role,
      p.balance,
      p.created_at as joined_at,
      coalesce(h.sports_history, '[]'::jsonb) as sports_history,
      coalesce(h.games_history, '[]'::jsonb) as games_history
    from public.profiles p
    left join public.user_history_state h on h.user_id = p.id
  ),
  aggregated as (
    select
      pr.*,
      (select count(*) from jsonb_array_elements(pr.sports_history)) as sports_count,
      (select count(*) from jsonb_array_elements(pr.games_history)) as games_count,
      (
        select count(*) from (
          select elem from jsonb_array_elements(pr.sports_history) elem where elem->>'status' = 'Ganhou'
          union all
          select elem from jsonb_array_elements(pr.games_history) elem where elem->>'status' = 'Ganhou'
        ) won
      ) as wins,
      (
        select count(*) from (
          select elem from jsonb_array_elements(pr.sports_history) elem where elem->>'status' = 'Perdeu'
          union all
          select elem from jsonb_array_elements(pr.games_history) elem where elem->>'status' = 'Perdeu'
        ) lost
      ) as losses,
      (
        select count(*)
        from jsonb_array_elements(pr.sports_history) elem
        where elem->>'status' = 'Pendente'
      ) as pending,
      coalesce((
        select sum(case
          when coalesce(elem->>'valor', '') ~ '^-?[0-9]+([.][0-9]+)?$'
            then (elem->>'valor')::numeric
          else 0
        end)
        from jsonb_array_elements(pr.sports_history) elem
      ), 0)
      + coalesce((
        select sum(case
          when coalesce(elem->>'entrada', '') ~ '^-?[0-9]+([.][0-9]+)?$'
            then (elem->>'entrada')::numeric
          else 0
        end)
        from jsonb_array_elements(pr.games_history) elem
      ), 0) as total_staked,
      coalesce((
        select sum(case
          when elem->>'status' = 'Ganhou' then
            case
              when coalesce(elem->>'retornoPago', '') ~ '^-?[0-9]+([.][0-9]+)?$'
                then (elem->>'retornoPago')::numeric
              when coalesce(elem->>'retornoEstimado', '') ~ '^-?[0-9]+([.][0-9]+)?$'
                then (elem->>'retornoEstimado')::numeric
              else 0
            end
          else 0
        end)
        from jsonb_array_elements(pr.sports_history) elem
      ), 0)
      + coalesce((
        select sum(case
          when coalesce(elem->>'premio', '') ~ '^-?[0-9]+([.][0-9]+)?$'
            then (elem->>'premio')::numeric
          else 0
        end)
        from jsonb_array_elements(pr.games_history) elem
      ), 0) as total_payout
    from profile_rows pr
  )
  select
    a.id,
    a.username,
    a.avatar_key,
    a.role,
    a.balance,
    a.joined_at,
    a.sports_count,
    a.games_count,
    a.wins,
    a.losses,
    a.pending,
    a.total_staked,
    a.total_payout,
    a.total_payout - a.total_staked as net_profit
  from aggregated a
  order by a.balance desc, a.wins desc, a.joined_at asc;
$$;

revoke all on function public.resolve_legacy_history(boolean, jsonb, jsonb) from public;
revoke all on function public.sync_my_history(jsonb, jsonb) from public;
revoke all on function public.get_public_ranking() from public;

grant execute on function public.resolve_legacy_history(boolean, jsonb, jsonb) to authenticated;
grant execute on function public.sync_my_history(jsonb, jsonb) to authenticated;
grant execute on function public.get_public_ranking() to anon, authenticated;

commit;
