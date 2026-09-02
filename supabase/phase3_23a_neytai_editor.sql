-- ============================================================================
-- TaihenBet 2.0 — Fase 3.23a
-- Editor de Falas da Neytai
-- Execute depois de phase3_23_content_studio.sql.
-- ============================================================================

create table if not exists public.neytai_message_overrides (
  step_id text primary key,
  title text not null,
  body text not null,
  instruction text not null default '',
  pause_button text not null default '',
  tips jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

alter table public.neytai_message_overrides enable row level security;
revoke all on table public.neytai_message_overrides from anon, authenticated;

-- A leitura pública acontece por RPC. Assim o navegador recebe apenas o conteúdo
-- textual que o Neytai precisa, sem abrir escrita direta na tabela.
create or replace function public.get_public_neytai_message_overrides()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(
      n.step_id,
      jsonb_build_object(
        'titulo', n.title,
        'texto', n.body,
        'instrucao', n.instruction,
        'botaoPausa', n.pause_button,
        'dicas', n.tips
      )
    ),
    '{}'::jsonb
  )
  from public.neytai_message_overrides n;
$$;

revoke all on function public.get_public_neytai_message_overrides() from public;
grant execute on function public.get_public_neytai_message_overrides() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Snapshot da Central de Conteúdo com as falas personalizadas da Neytai.
-- Mantém tudo da 3.23 e acrescenta apenas neytai_messages.
-- ---------------------------------------------------------------------------

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
    ), '[]'::jsonb),
    'neytai_messages', coalesce((
      select jsonb_agg(to_jsonb(n) order by n.step_id)
      from public.neytai_message_overrides n
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_content_studio_snapshot() from public;
grant execute on function public.get_content_studio_snapshot() to authenticated;

-- ---------------------------------------------------------------------------
-- Escrita administrativa.
-- Somente os campos de conteúdo são aceitos. IDs técnicos do tour continuam
-- definidos no código e não podem ser alterados pelo painel.
-- ---------------------------------------------------------------------------

create or replace function public.admin_upsert_neytai_message_override(
  p_step_id text,
  p_title text,
  p_body text,
  p_instruction text,
  p_pause_button text,
  p_tips jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tips jsonb;
begin
  perform public._content_studio_assert_admin();

  if nullif(trim(coalesce(p_step_id, '')), '') is null then
    raise exception 'INVALID_NEYTAI_STEP';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'NEYTAI_TITLE_REQUIRED';
  end if;

  if nullif(trim(coalesce(p_body, '')), '') is null then
    raise exception 'NEYTAI_BODY_REQUIRED';
  end if;

  if jsonb_typeof(coalesce(p_tips, '[]'::jsonb)) <> 'array' then
    raise exception 'NEYTAI_TIPS_MUST_BE_ARRAY';
  end if;

  if jsonb_array_length(coalesce(p_tips, '[]'::jsonb)) > 12 then
    raise exception 'NEYTAI_TOO_MANY_TIPS';
  end if;

  select coalesce(jsonb_agg(left(trim(value), 600)), '[]'::jsonb)
  into v_tips
  from jsonb_array_elements_text(coalesce(p_tips, '[]'::jsonb)) as x(value)
  where nullif(trim(value), '') is not null;

  insert into public.neytai_message_overrides (
    step_id,
    title,
    body,
    instruction,
    pause_button,
    tips,
    updated_at,
    updated_by
  ) values (
    left(trim(p_step_id), 100),
    left(trim(p_title), 300),
    left(trim(p_body), 6000),
    left(coalesce(p_instruction, ''), 1400),
    left(coalesce(p_pause_button, ''), 180),
    v_tips,
    now(),
    auth.uid()
  )
  on conflict (step_id) do update
  set title = excluded.title,
      body = excluded.body,
      instruction = excluded.instruction,
      pause_button = excluded.pause_button,
      tips = excluded.tips,
      updated_at = now(),
      updated_by = auth.uid();
end;
$$;

revoke all on function public.admin_upsert_neytai_message_override(text,text,text,text,text,jsonb) from public;
grant execute on function public.admin_upsert_neytai_message_override(text,text,text,text,text,jsonb) to authenticated;

create or replace function public.admin_reset_neytai_message_override(p_step_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._content_studio_assert_admin();
  delete from public.neytai_message_overrides where step_id = p_step_id;
end;
$$;

revoke all on function public.admin_reset_neytai_message_override(text) from public;
grant execute on function public.admin_reset_neytai_message_override(text) to authenticated;
