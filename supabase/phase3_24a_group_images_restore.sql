begin;

-- =========================================================================
-- TAIHENBET 2.0 - FASE 3.24a
-- Restaura o vínculo das imagens das empresas sem alterar textos do CMS.
-- Seguro para quem já executou a Fase 3.11a: a migração é idempotente.
-- =========================================================================

alter table public.taihen_group_companies
  add column if not exists image_key text not null default '';

-- Só preenche identidades que estão vazias. Não sobrescreve escolhas do admin.
update public.taihen_group_companies
set image_key = case lower(trim(name))
  when 'dji' then 'dji'
  when 'nasa' then 'nasa'
  when 'siv' then 'siv'
  when 'taihen airlines' then 'taihen-airlines'
  when 'godot' then 'godot'
  else image_key
end,
updated_at = now()
where coalesce(image_key, '') = ''
  and lower(trim(name)) in ('dji', 'nasa', 'siv', 'taihen airlines', 'godot');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'taihen_group_image_key_len'
      and conrelid = 'public.taihen_group_companies'::regclass
  ) then
    alter table public.taihen_group_companies
      add constraint taihen_group_image_key_len
      check (char_length(image_key) <= 80);
  end if;
end
$$;

-- A leitura pública precisa devolver image_key ao frontend.
drop function if exists public.get_taihen_group_companies();

create function public.get_taihen_group_companies()
returns table (
  id uuid,
  name text,
  symbol text,
  sector text,
  slogan text,
  description text,
  status_label text,
  status_tone text,
  image_key text,
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
    c.image_key,
    c.created_at
  from public.taihen_group_companies c
  order by c.created_at asc, c.name asc;
$$;

revoke all on function public.get_taihen_group_companies() from public;
grant execute on function public.get_taihen_group_companies() to anon, authenticated;

-- Remove a assinatura antiga sem imagem (se alguma atualização a recriou)
-- e garante a assinatura atual usada pelo GroupPage e pela Central de Conteúdo.
drop function if exists public.admin_upsert_taihen_group_company(
  uuid, text, text, text, text, text, text, text
);

drop function if exists public.admin_upsert_taihen_group_company(
  uuid, text, text, text, text, text, text, text, text
);

create function public.admin_upsert_taihen_group_company(
  p_company_id uuid,
  p_name text,
  p_symbol text,
  p_sector text,
  p_slogan text,
  p_description text,
  p_status_label text,
  p_status_tone text,
  p_image_key text
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
  v_image_key text := lower(trim(coalesce(p_image_key, '')));
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
  if v_image_key not in ('', 'taihen-airlines', 'dji', 'nasa', 'siv', 'godot') then
    raise exception 'Invalid packaged company image';
  end if;

  if p_company_id is null then
    insert into public.taihen_group_companies (
      name, symbol, sector, slogan, description,
      status_label, status_tone, image_key
    ) values (
      v_name, v_symbol, v_sector, v_slogan, v_description,
      v_status_label, v_status_tone, v_image_key
    ) returning id into v_id;
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
      image_key = v_image_key,
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

revoke all on function public.admin_upsert_taihen_group_company(
  uuid, text, text, text, text, text, text, text, text
) from public;

grant execute on function public.admin_upsert_taihen_group_company(
  uuid, text, text, text, text, text, text, text, text
) to authenticated;

commit;
