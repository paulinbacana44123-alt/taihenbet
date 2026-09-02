begin;

-- ============================================================
-- TAIHENBET 2.0 — FASE 3.24
-- CÓDIGOS DA BANCA / CUPONS DE TAICOINS
-- Execute DEPOIS das Fases 3.23/3.23a.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null default 'Código da banca',
  amount numeric(30,2) not null,
  audience text not null default 'everyone',
  allowed_usernames text[] not null default '{}'::text[],
  max_uses_per_user integer,
  max_total_uses integer,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_codes_code_check check (length(trim(code)) between 1 and 80),
  constraint promo_codes_amount_check check (amount <> 0),
  constraint promo_codes_audience_check check (audience in ('everyone','admin','allowlist')),
  constraint promo_codes_user_limit_check check (max_uses_per_user is null or max_uses_per_user > 0),
  constraint promo_codes_total_limit_check check (max_total_uses is null or max_total_uses > 0),
  constraint promo_codes_dates_check check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create unique index if not exists promo_codes_code_ci_unique
  on public.promo_codes (lower(trim(code)));

create table if not exists public.promo_code_redemptions (
  id bigserial primary key,
  receipt_id uuid not null default gen_random_uuid() unique,
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_amount numeric(30,2) not null,
  applied_amount numeric(30,2) not null,
  balance_after numeric(30,2) not null,
  redeemed_at timestamptz not null default now()
);

create index if not exists promo_redemptions_code_idx
  on public.promo_code_redemptions (promo_code_id, redeemed_at desc);
create index if not exists promo_redemptions_user_idx
  on public.promo_code_redemptions (user_id, redeemed_at desc);

alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;
revoke all on table public.promo_codes from anon, authenticated;
revoke all on table public.promo_code_redemptions from anon, authenticated;

-- Sem SELECT direto: códigos secretos não podem ser enumerados pelo cliente.
-- Todo acesso ocorre por RPC controlada.

create or replace function public._promo_assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception using errcode = 'P0001', message = 'ADMIN_ONLY';
  end if;
end;
$$;
revoke all on function public._promo_assert_admin() from public;

create or replace function public.redeem_promo_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code public.promo_codes;
  v_profile public.profiles;
  v_user_uses integer := 0;
  v_total_uses integer := 0;
  v_applied numeric(30,2);
  v_receipt uuid := gen_random_uuid();
  v_username text;
  v_message text;
begin
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if nullif(trim(coalesce(p_code, '')), '') is null then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_EMPTY';
  end if;

  select * into v_code
  from public.promo_codes c
  where lower(trim(c.code)) = lower(trim(p_code))
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_INVALID';
  end if;

  if not v_code.active then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_INACTIVE';
  end if;
  if v_code.starts_at is not null and now() < v_code.starts_at then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_NOT_STARTED';
  end if;
  if v_code.expires_at is not null and now() >= v_code.expires_at then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_EXPIRED';
  end if;

  select * into v_profile
  from public.profiles p
  where p.id = v_uid
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'PROFILE_NOT_FOUND';
  end if;
  if coalesce(v_profile.is_suspended, false) then
    raise exception using errcode = 'P0001', message = 'ACCOUNT_SUSPENDED';
  end if;

  v_username := lower(trim(coalesce(v_profile.username, '')));

  if v_code.audience = 'admin' and coalesce(v_profile.role, '') <> 'admin' then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_NOT_FOR_YOU';
  end if;

  if v_code.audience = 'allowlist' and not exists (
    select 1
    from unnest(coalesce(v_code.allowed_usernames, '{}'::text[])) as u(name)
    where lower(trim(u.name)) = v_username
  ) then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_NOT_FOR_YOU';
  end if;

  select count(*)::integer into v_user_uses
  from public.promo_code_redemptions r
  where r.promo_code_id = v_code.id and r.user_id = v_uid;

  if v_code.max_uses_per_user is not null and v_user_uses >= v_code.max_uses_per_user then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_USER_LIMIT';
  end if;

  select count(*)::integer into v_total_uses
  from public.promo_code_redemptions r
  where r.promo_code_id = v_code.id;

  if v_code.max_total_uses is not null and v_total_uses >= v_code.max_total_uses then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_TOTAL_LIMIT';
  end if;

  -- Códigos negativos podem trollar, mas nunca empurram a carteira abaixo de zero.
  if v_code.amount < 0 then
    v_applied := greatest(v_code.amount, -coalesce(v_profile.balance, 0));
  else
    v_applied := v_code.amount;
  end if;

  if v_applied <> 0 then
    v_profile := public._wallet_apply(
      v_uid,
      v_applied,
      'admin_adjustment',
      'promo:' || v_receipt::text,
      jsonb_build_object(
        'source', 'promo_code',
        'promo_code_id', v_code.id,
        'promo_code', v_code.code,
        'requested_amount', v_code.amount,
        'receipt_id', v_receipt
      )
    );
  end if;

  insert into public.promo_code_redemptions (
    receipt_id, promo_code_id, user_id, requested_amount, applied_amount, balance_after
  ) values (
    v_receipt,
    v_code.id,
    v_uid,
    v_code.amount,
    v_applied,
    coalesce(v_profile.balance, 0)
  );

  if v_applied > 0 then
    v_message := '+' || trim(to_char(v_applied, 'FM999999999999999999999999990D00')) || ' TaiCoins liberadas pela banca.';
  elsif v_applied < 0 then
    v_message := trim(to_char(abs(v_applied), 'FM999999999999999999999999990D00')) || ' TaiCoins foram confiscadas pela banca. Você caiu no golpe.';
  else
    v_message := 'A banca tentou confiscar TaiCoins, mas não encontrou absolutamente nada.';
  end if;

  if to_regprocedure('public._notify_user(uuid,text,text,text,text,text,jsonb)') is not null then
    perform public._notify_user(
      v_uid,
      'bonus',
      case when v_applied >= 0 then 'Código resgatado' else 'Código amaldiçoado resgatado' end,
      v_code.label || ': ' || v_message,
      'loja',
      v_code.id::text,
      jsonb_build_object(
        'promo_code_id', v_code.id,
        'amount', v_applied,
        'receipt_id', v_receipt
      )
    );
  end if;

  return jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'code', v_code.code,
    'label', v_code.label,
    'requested_amount', v_code.amount,
    'amount', v_applied,
    'message', v_message,
    'receipt_id', v_receipt,
    'user_uses', v_user_uses + 1,
    'max_uses_per_user', v_code.max_uses_per_user
  );
end;
$$;
revoke all on function public.redeem_promo_code(text) from public;
grant execute on function public.redeem_promo_code(text) to authenticated;

create or replace function public.get_my_promo_code_history(p_limit integer default 8)
returns table (
  redemption_id bigint,
  code text,
  label text,
  amount numeric,
  redeemed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, c.code, c.label, r.applied_amount, r.redeemed_at
  from public.promo_code_redemptions r
  join public.promo_codes c on c.id = r.promo_code_id
  where r.user_id = auth.uid()
  order by r.redeemed_at desc
  limit greatest(1, least(coalesce(p_limit, 8), 30));
$$;
revoke all on function public.get_my_promo_code_history(integer) from public;
grant execute on function public.get_my_promo_code_history(integer) to authenticated;

create or replace function public.get_admin_promo_codes()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public._promo_assert_admin();

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'code', c.code,
        'label', c.label,
        'amount', c.amount,
        'audience', c.audience,
        'allowed_usernames', c.allowed_usernames,
        'max_uses_per_user', c.max_uses_per_user,
        'max_total_uses', c.max_total_uses,
        'active', c.active,
        'starts_at', c.starts_at,
        'expires_at', c.expires_at,
        'note', c.note,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'total_redemptions', (
          select count(*) from public.promo_code_redemptions r where r.promo_code_id = c.id
        )
      ) order by c.created_at desc, lower(c.code)
    )
    from public.promo_codes c
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.get_admin_promo_codes() from public;
grant execute on function public.get_admin_promo_codes() to authenticated;

create or replace function public.admin_upsert_promo_code(
  p_id uuid,
  p_code text,
  p_label text,
  p_amount numeric,
  p_audience text,
  p_allowed_usernames text[],
  p_max_uses_per_user integer,
  p_max_total_uses integer,
  p_active boolean,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_code text := trim(coalesce(p_code, ''));
  v_audience text := lower(trim(coalesce(p_audience, 'everyone')));
  v_allowed text[];
begin
  perform public._promo_assert_admin();

  if length(v_code) < 1 or length(v_code) > 80 then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_BAD_CODE';
  end if;
  if coalesce(p_amount, 0) = 0 then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_ZERO_AMOUNT';
  end if;
  if v_audience not in ('everyone','admin','allowlist') then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_BAD_AUDIENCE';
  end if;
  if p_max_uses_per_user is not null and p_max_uses_per_user <= 0 then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_BAD_USER_LIMIT';
  end if;
  if p_max_total_uses is not null and p_max_total_uses <= 0 then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_BAD_TOTAL_LIMIT';
  end if;
  if p_starts_at is not null and p_expires_at is not null and p_expires_at <= p_starts_at then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_BAD_DATES';
  end if;

  select coalesce(array_agg(distinct trim(x)) filter (where nullif(trim(x), '') is not null), '{}'::text[])
  into v_allowed
  from unnest(coalesce(p_allowed_usernames, '{}'::text[])) x;

  if v_audience = 'allowlist' and cardinality(v_allowed) = 0 then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_EMPTY_ALLOWLIST';
  end if;

  if p_id is null then
    insert into public.promo_codes (
      code, label, amount, audience, allowed_usernames,
      max_uses_per_user, max_total_uses, active, starts_at, expires_at, note
    ) values (
      v_code,
      coalesce(nullif(trim(p_label), ''), 'Código da banca'),
      p_amount,
      v_audience,
      case when v_audience = 'allowlist' then v_allowed else '{}'::text[] end,
      p_max_uses_per_user,
      p_max_total_uses,
      coalesce(p_active, true),
      p_starts_at,
      p_expires_at,
      coalesce(p_note, '')
    ) returning id into v_id;
  else
    update public.promo_codes
    set code = v_code,
        label = coalesce(nullif(trim(p_label), ''), 'Código da banca'),
        amount = p_amount,
        audience = v_audience,
        allowed_usernames = case when v_audience = 'allowlist' then v_allowed else '{}'::text[] end,
        max_uses_per_user = p_max_uses_per_user,
        max_total_uses = p_max_total_uses,
        active = coalesce(p_active, true),
        starts_at = p_starts_at,
        expires_at = p_expires_at,
        note = coalesce(p_note, ''),
        updated_at = now()
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception using errcode = 'P0001', message = 'PROMO_CODE_NOT_FOUND';
    end if;
  end if;

  return v_id;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'PROMO_CODE_DUPLICATE';
end;
$$;
revoke all on function public.admin_upsert_promo_code(uuid,text,text,numeric,text,text[],integer,integer,boolean,timestamptz,timestamptz,text) from public;
grant execute on function public.admin_upsert_promo_code(uuid,text,text,numeric,text,text[],integer,integer,boolean,timestamptz,timestamptz,text) to authenticated;

create or replace function public.admin_delete_promo_code(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._promo_assert_admin();
  delete from public.promo_codes where id = p_id;
  return found;
end;
$$;
revoke all on function public.admin_delete_promo_code(uuid) from public;
grant execute on function public.admin_delete_promo_code(uuid) to authenticated;

-- Códigos pedidos na conversa. Todos os públicos começam com 1 uso por conta.
insert into public.promo_codes (code, label, amount, audience, max_uses_per_user, active, note)
values
  ('Taihen', 'Bônus da Taihen', 100, 'everyone', 1, true, 'Código público inicial.'),
  ('Neymar', 'Patrocínio futebolístico duvidoso', 150, 'everyone', 1, true, 'Código público inicial.'),
  ('SoltaacartaTaigrinho', 'A carta finalmente foi solta', 100, 'everyone', 1, true, 'Código público inicial.'),
  ('NeyTaicasalsodano', 'Casal aprovado pela auditoria', 200, 'everyone', 1, true, 'Código público inicial.'),
  ('Patrocinodivino', 'Patrocínio divino', 1000, 'everyone', 1, true, 'Código público inicial.'),
  ('TaihenCareca', 'Programa capilar da banca', 100, 'everyone', 1, true, 'Código público inicial.'),
  ('Liberaoshomensgulosos', 'Reforma administrativa urgente', 2000, 'everyone', 1, true, 'Código público inicial.'),
  ('13', 'Armadilha fiscal da banca', -1000, 'everyone', 1, true, 'Código troll: confisca até 1000 TaiCoins, sem deixar saldo negativo.'),
  ('AdmsGostosos', 'Benefício corporativo indevido', 100, 'allowlist', null, true, 'Código privado e ilimitado. Ajuste a lista de usuários no Painel.')
on conflict do nothing;

update public.promo_codes
set allowed_usernames = array['Paulin','Pietro']::text[]
where lower(code) = lower('AdmsGostosos')
  and audience = 'allowlist'
  and cardinality(allowed_usernames) = 0;

commit;
