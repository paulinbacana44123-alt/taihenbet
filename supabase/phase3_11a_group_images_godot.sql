begin;

-- =========================================================================
-- TAIHENBET 2.0 - FASE 3.11a
-- Grupo TaihenBet: imagens oficiais da lore + Godot + textos revisados
-- Execute DEPOIS da phase3_11_community_spaces.sql
-- =========================================================================

alter table public.taihen_group_companies
  add column if not exists image_key text not null default '';

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

-- Atualiza o catálogo existente e adiciona o Godot.
insert into public.taihen_group_companies (
  name,
  symbol,
  sector,
  slogan,
  description,
  status_label,
  status_tone,
  image_key
) values
  (
    'Taihen Airlines',
    'TA',
    'Aviação questionável',
    'Seu destino. Nosso universo. Voamos além.',
    'Companhia aérea oficial do Grupo TaihenBet. Responsável por transportar cada um de seus clientes para a puta que pariu.',
    'VOANDO POR ALGUM MOTIVO',
    'green',
    'taihen-airlines'
  ),
  (
    'DJI',
    'DJI',
    'Equipamentos e operações aéreas fictícias',
    'A banca observa tudo. Pelo menos na piada.',
    'Participação inteiramente fictícia responsável pelo setor de drones e vigilância aérea do conglomerado. Qualquer semelhança com operações reais é mera coincidência — e provavelmente juridicamente conveniente.',
    'SOB OBSERVAÇÃO',
    'pink',
    'dji'
  ),
  (
    'NASA',
    'NASA',
    'Operações aeroespaciais fictícias',
    'Agora o espaço também responde à banca.',
    'Aquisição absolutamente fictícia dentro do universo da TaihenBet. A diretoria alega controlar foguetes, satélites e o programa espacial; nenhuma dessas afirmações deve ser levada a sério.',
    'ESPAÇO NACIONALIZADO',
    'gold',
    'nasa'
  ),
  (
    'SIV',
    'SIV',
    'Tecnologia e infraestrutura',
    'Se existe uma sigla, a holding provavelmente comprou.',
    'Divisão tecnológica do Grupo TaihenBet responsável por sistemas integrados, infraestrutura e soluções cuja documentação provavelmente desapareceu três administrações atrás.',
    'OPERANDO',
    'green',
    'siv'
  ),
  (
    'Godot',
    'GD',
    'Desenvolvimento e tecnologia interdimensional',
    'Se compila, é milagre. Se roda, é canônico.',
    'Braço de desenvolvimento de jogos e experiências digitais da banca. Responsável por transformar ideias questionáveis em projetos ainda mais questionáveis, geralmente depois de discutir com uma cena, um nó ou uma colisão por três horas.',
    'AGUARDANDO COMPILAR',
    'neutral',
    'godot'
  )
on conflict (name) do update
set
  symbol = excluded.symbol,
  sector = excluded.sector,
  slogan = excluded.slogan,
  description = excluded.description,
  status_label = excluded.status_label,
  status_tone = excluded.status_tone,
  image_key = excluded.image_key,
  updated_at = now();

-- A RPC pública agora devolve também qual asset visual o card deve usar.
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

-- Substitui a versão 3.11 da RPC administrativa para permitir trocar a imagem
-- por uma das identidades visuais empacotadas no frontend.
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

  if char_length(v_image_key) > 80 then
    raise exception 'Company image key is too long';
  end if;

  if v_image_key not in ('', 'taihen-airlines', 'dji', 'nasa', 'siv', 'godot') then
    raise exception 'Invalid packaged company image';
  end if;

  if p_company_id is null then
    insert into public.taihen_group_companies (
      name,
      symbol,
      sector,
      slogan,
      description,
      status_label,
      status_tone,
      image_key
    ) values (
      v_name,
      v_symbol,
      v_sector,
      v_slogan,
      v_description,
      v_status_label,
      v_status_tone,
      v_image_key
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
