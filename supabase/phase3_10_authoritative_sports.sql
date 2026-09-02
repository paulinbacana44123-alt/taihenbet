-- TaihenBet 2.0 — Fase 3.10
-- Apostas esportivas autoritativas (Liga do Bahrein + mercados customizados).
-- Execute DEPOIS da Fase 3.9.
--
-- O navegador deixa de:
--   * debitar sports_stake diretamente;
--   * decidir odds válidas no momento da aposta;
--   * resolver bilhetes e fabricar sports_payout;
--   * sincronizar histórico esportivo novo como JSON arbitrário.
--
-- O servidor passa a:
--   * manter mercados/odds;
--   * registrar bilhetes e seleções travadas;
--   * debitar stake atomicamente;
--   * liquidar bilhetes ao publicar resultados;
--   * pagar pelo ledger com idempotência;
--   * alimentar histórico/ranking autoritativos.

begin;

-- -------------------------------------------------------------------------
-- 1. Mercados e calendário
-- -------------------------------------------------------------------------

create table if not exists public.bahrain_market_templates (
  id text primary key,
  round_no integer not null check (round_no between 1 and 7),
  scheduled_label text not null,
  category text not null,
  title text not null,
  home_team_id text not null,
  away_team_id text not null,
  options jsonb not null,
  constraint bahrain_template_options_array check (jsonb_typeof(options) = 'array')
);

insert into public.bahrain_market_templates (
  id, round_no, scheduled_label, category, title,
  home_team_id, away_team_id, options
) values
  ('bahrein-r1-j1',1,'18:00','LIGA DO BAHREIN · RODADA 1','Muharraq x Sitra','muharraq','sitra','[{"id":"bahrein-r1-j1-mandante","nome":"Muharraq","tipoResultado":"mandante","odd":1.78},{"id":"bahrein-r1-j1-empate","nome":"Empate","tipoResultado":"empate","odd":3.73},{"id":"bahrein-r1-j1-visitante","nome":"Sitra","tipoResultado":"visitante","odd":3.71}]'::jsonb)
  ,('bahrein-r1-j2',1,'19:15','LIGA DO BAHREIN · RODADA 1','Al Ahli x Al Khaldiya','al-ahli','al-khaldiya','[{"id":"bahrein-r1-j2-mandante","nome":"Al Ahli","tipoResultado":"mandante","odd":2.27},{"id":"bahrein-r1-j2-empate","nome":"Empate","tipoResultado":"empate","odd":3.55},{"id":"bahrein-r1-j2-visitante","nome":"Al Khaldiya","tipoResultado":"visitante","odd":2.65}]'::jsonb)
  ,('bahrein-r1-j3',1,'20:30','LIGA DO BAHREIN · RODADA 1','Riffa x Hidd','riffa','hidd','[{"id":"bahrein-r1-j3-mandante","nome":"Riffa","tipoResultado":"mandante","odd":1.72},{"id":"bahrein-r1-j3-empate","nome":"Empate","tipoResultado":"empate","odd":3.67},{"id":"bahrein-r1-j3-visitante","nome":"Hidd","tipoResultado":"visitante","odd":4.08}]'::jsonb)
  ,('bahrein-r1-j4',1,'21:45','LIGA DO BAHREIN · RODADA 1','Malkiya x A''ali','malkiya','aali','[{"id":"bahrein-r1-j4-mandante","nome":"Malkiya","tipoResultado":"mandante","odd":2.0},{"id":"bahrein-r1-j4-empate","nome":"Empate","tipoResultado":"empate","odd":3.47},{"id":"bahrein-r1-j4-visitante","nome":"A''ali","tipoResultado":"visitante","odd":3.23}]'::jsonb)
  ,('bahrein-r2-j1',2,'18:00','LIGA DO BAHREIN · RODADA 2','Al Ahli x Muharraq','al-ahli','muharraq','[{"id":"bahrein-r2-j1-mandante","nome":"Al Ahli","tipoResultado":"mandante","odd":2.46},{"id":"bahrein-r2-j1-empate","nome":"Empate","tipoResultado":"empate","odd":3.64},{"id":"bahrein-r2-j1-visitante","nome":"Muharraq","tipoResultado":"visitante","odd":2.39}]'::jsonb)
  ,('bahrein-r2-j2',2,'19:15','LIGA DO BAHREIN · RODADA 2','Sitra x Hidd','sitra','hidd','[{"id":"bahrein-r2-j2-mandante","nome":"Sitra","tipoResultado":"mandante","odd":1.96},{"id":"bahrein-r2-j2-empate","nome":"Empate","tipoResultado":"empate","odd":3.47},{"id":"bahrein-r2-j2-visitante","nome":"Hidd","tipoResultado":"visitante","odd":3.32}]'::jsonb)
  ,('bahrein-r2-j3',2,'20:30','LIGA DO BAHREIN · RODADA 2','Malkiya x Al Khaldiya','malkiya','al-khaldiya','[{"id":"bahrein-r2-j3-mandante","nome":"Malkiya","tipoResultado":"mandante","odd":2.35},{"id":"bahrein-r2-j3-empate","nome":"Empate","tipoResultado":"empate","odd":3.73},{"id":"bahrein-r2-j3-visitante","nome":"Al Khaldiya","tipoResultado":"visitante","odd":2.47}]'::jsonb)
  ,('bahrein-r2-j4',2,'21:45','LIGA DO BAHREIN · RODADA 2','Riffa x A''ali','riffa','aali','[{"id":"bahrein-r2-j4-mandante","nome":"Riffa","tipoResultado":"mandante","odd":1.73},{"id":"bahrein-r2-j4-empate","nome":"Empate","tipoResultado":"empate","odd":3.76},{"id":"bahrein-r2-j4-visitante","nome":"A''ali","tipoResultado":"visitante","odd":3.92}]'::jsonb)
  ,('bahrein-r3-j1',3,'18:00','LIGA DO BAHREIN · RODADA 3','Muharraq x Hidd','muharraq','hidd','[{"id":"bahrein-r3-j1-mandante","nome":"Muharraq","tipoResultado":"mandante","odd":1.69},{"id":"bahrein-r3-j1-empate","nome":"Empate","tipoResultado":"empate","odd":3.86},{"id":"bahrein-r3-j1-visitante","nome":"Hidd","tipoResultado":"visitante","odd":4.04}]'::jsonb)
  ,('bahrein-r3-j2',3,'19:15','LIGA DO BAHREIN · RODADA 3','Malkiya x Al Ahli','malkiya','al-ahli','[{"id":"bahrein-r3-j2-mandante","nome":"Malkiya","tipoResultado":"mandante","odd":2.24},{"id":"bahrein-r3-j2-empate","nome":"Empate","tipoResultado":"empate","odd":3.53},{"id":"bahrein-r3-j2-visitante","nome":"Al Ahli","tipoResultado":"visitante","odd":2.71}]'::jsonb)
  ,('bahrein-r3-j3',3,'20:30','LIGA DO BAHREIN · RODADA 3','Sitra x A''ali','sitra','aali','[{"id":"bahrein-r3-j3-mandante","nome":"Sitra","tipoResultado":"mandante","odd":1.82},{"id":"bahrein-r3-j3-empate","nome":"Empate","tipoResultado":"empate","odd":3.55},{"id":"bahrein-r3-j3-visitante","nome":"A''ali","tipoResultado":"visitante","odd":3.74}]'::jsonb)
  ,('bahrein-r3-j4',3,'21:45','LIGA DO BAHREIN · RODADA 3','Riffa x Al Khaldiya','riffa','al-khaldiya','[{"id":"bahrein-r3-j4-mandante","nome":"Riffa","tipoResultado":"mandante","odd":2.2},{"id":"bahrein-r3-j4-empate","nome":"Empate","tipoResultado":"empate","odd":3.45},{"id":"bahrein-r3-j4-visitante","nome":"Al Khaldiya","tipoResultado":"visitante","odd":2.82}]'::jsonb)
  ,('bahrein-r4-j1',4,'18:00','LIGA DO BAHREIN · RODADA 4','Malkiya x Muharraq','malkiya','muharraq','[{"id":"bahrein-r4-j1-mandante","nome":"Malkiya","tipoResultado":"mandante","odd":2.68},{"id":"bahrein-r4-j1-empate","nome":"Empate","tipoResultado":"empate","odd":3.82},{"id":"bahrein-r4-j1-visitante","nome":"Muharraq","tipoResultado":"visitante","odd":2.16}]'::jsonb)
  ,('bahrein-r4-j2',4,'19:15','LIGA DO BAHREIN · RODADA 4','Hidd x A''ali','hidd','aali','[{"id":"bahrein-r4-j2-mandante","nome":"Hidd","tipoResultado":"mandante","odd":1.99},{"id":"bahrein-r4-j2-empate","nome":"Empate","tipoResultado":"empate","odd":3.45},{"id":"bahrein-r4-j2-visitante","nome":"A''ali","tipoResultado":"visitante","odd":3.26}]'::jsonb)
  ,('bahrein-r4-j3',4,'20:30','LIGA DO BAHREIN · RODADA 4','Riffa x Al Ahli','riffa','al-ahli','[{"id":"bahrein-r4-j3-mandante","nome":"Riffa","tipoResultado":"mandante","odd":1.9},{"id":"bahrein-r4-j3-empate","nome":"Empate","tipoResultado":"empate","odd":3.47},{"id":"bahrein-r4-j3-visitante","nome":"Al Ahli","tipoResultado":"visitante","odd":3.53}]'::jsonb)
  ,('bahrein-r4-j4',4,'21:45','LIGA DO BAHREIN · RODADA 4','Sitra x Al Khaldiya','sitra','al-khaldiya','[{"id":"bahrein-r4-j4-mandante","nome":"Sitra","tipoResultado":"mandante","odd":2.41},{"id":"bahrein-r4-j4-empate","nome":"Empate","tipoResultado":"empate","odd":3.64},{"id":"bahrein-r4-j4-visitante","nome":"Al Khaldiya","tipoResultado":"visitante","odd":2.45}]'::jsonb)
  ,('bahrein-r5-j1',5,'18:00','LIGA DO BAHREIN · RODADA 5','Muharraq x A''ali','muharraq','aali','[{"id":"bahrein-r5-j1-mandante","nome":"Muharraq","tipoResultado":"mandante","odd":1.63},{"id":"bahrein-r5-j1-empate","nome":"Empate","tipoResultado":"empate","odd":3.96},{"id":"bahrein-r5-j1-visitante","nome":"A''ali","tipoResultado":"visitante","odd":4.33}]'::jsonb)
  ,('bahrein-r5-j2',5,'19:15','LIGA DO BAHREIN · RODADA 5','Riffa x Malkiya','riffa','malkiya','[{"id":"bahrein-r5-j2-mandante","nome":"Riffa","tipoResultado":"mandante","odd":1.8},{"id":"bahrein-r5-j2-empate","nome":"Empate","tipoResultado":"empate","odd":3.64},{"id":"bahrein-r5-j2-visitante","nome":"Malkiya","tipoResultado":"visitante","odd":3.73}]'::jsonb)
  ,('bahrein-r5-j3',5,'20:30','LIGA DO BAHREIN · RODADA 5','Hidd x Al Khaldiya','hidd','al-khaldiya','[{"id":"bahrein-r5-j3-mandante","nome":"Hidd","tipoResultado":"mandante","odd":2.38},{"id":"bahrein-r5-j3-empate","nome":"Empate","tipoResultado":"empate","odd":3.76},{"id":"bahrein-r5-j3-visitante","nome":"Al Khaldiya","tipoResultado":"visitante","odd":2.42}]'::jsonb)
  ,('bahrein-r5-j4',5,'21:45','LIGA DO BAHREIN · RODADA 5','Sitra x Al Ahli','sitra','al-ahli','[{"id":"bahrein-r5-j4-mandante","nome":"Sitra","tipoResultado":"mandante","odd":2.2},{"id":"bahrein-r5-j4-empate","nome":"Empate","tipoResultado":"empate","odd":3.45},{"id":"bahrein-r5-j4-visitante","nome":"Al Ahli","tipoResultado":"visitante","odd":2.82}]'::jsonb)
  ,('bahrein-r6-j1',6,'18:00','LIGA DO BAHREIN · RODADA 6','Riffa x Muharraq','riffa','muharraq','[{"id":"bahrein-r6-j1-mandante","nome":"Riffa","tipoResultado":"mandante","odd":2.33},{"id":"bahrein-r6-j1-empate","nome":"Empate","tipoResultado":"empate","odd":3.53},{"id":"bahrein-r6-j1-visitante","nome":"Muharraq","tipoResultado":"visitante","odd":2.59}]'::jsonb)
  ,('bahrein-r6-j2',6,'19:15','LIGA DO BAHREIN · RODADA 6','A''ali x Al Khaldiya','aali','al-khaldiya','[{"id":"bahrein-r6-j2-mandante","nome":"A''ali","tipoResultado":"mandante","odd":2.59},{"id":"bahrein-r6-j2-empate","nome":"Empate","tipoResultado":"empate","odd":3.86},{"id":"bahrein-r6-j2-visitante","nome":"Al Khaldiya","tipoResultado":"visitante","odd":2.2}]'::jsonb)
  ,('bahrein-r6-j3',6,'20:30','LIGA DO BAHREIN · RODADA 6','Sitra x Malkiya','sitra','malkiya','[{"id":"bahrein-r6-j3-mandante","nome":"Sitra","tipoResultado":"mandante","odd":1.92},{"id":"bahrein-r6-j3-empate","nome":"Empate","tipoResultado":"empate","odd":3.45},{"id":"bahrein-r6-j3-visitante","nome":"Malkiya","tipoResultado":"visitante","odd":3.46}]'::jsonb)
  ,('bahrein-r6-j4',6,'21:45','LIGA DO BAHREIN · RODADA 6','Hidd x Al Ahli','hidd','al-ahli','[{"id":"bahrein-r6-j4-mandante","nome":"Hidd","tipoResultado":"mandante","odd":2.32},{"id":"bahrein-r6-j4-empate","nome":"Empate","tipoResultado":"empate","odd":3.55},{"id":"bahrein-r6-j4-visitante","nome":"Al Ahli","tipoResultado":"visitante","odd":2.59}]'::jsonb)
  ,('bahrein-r7-j1',7,'18:00','LIGA DO BAHREIN · RODADA 7','Muharraq x Al Khaldiya','muharraq','al-khaldiya','[{"id":"bahrein-r7-j1-mandante","nome":"Muharraq","tipoResultado":"mandante","odd":2.06},{"id":"bahrein-r7-j1-empate","nome":"Empate","tipoResultado":"empate","odd":3.45},{"id":"bahrein-r7-j1-visitante","nome":"Al Khaldiya","tipoResultado":"visitante","odd":3.08}]'::jsonb)
  ,('bahrein-r7-j2',7,'19:15','LIGA DO BAHREIN · RODADA 7','Sitra x Riffa','sitra','riffa','[{"id":"bahrein-r7-j2-mandante","nome":"Sitra","tipoResultado":"mandante","odd":2.27},{"id":"bahrein-r7-j2-empate","nome":"Empate","tipoResultado":"empate","odd":3.55},{"id":"bahrein-r7-j2-visitante","nome":"Riffa","tipoResultado":"visitante","odd":2.65}]'::jsonb)
  ,('bahrein-r7-j3',7,'20:30','LIGA DO BAHREIN · RODADA 7','A''ali x Al Ahli','aali','al-ahli','[{"id":"bahrein-r7-j3-mandante","nome":"A''ali","tipoResultado":"mandante","odd":2.26},{"id":"bahrein-r7-j3-empate","nome":"Empate","tipoResultado":"empate","odd":3.64},{"id":"bahrein-r7-j3-visitante","nome":"Al Ahli","tipoResultado":"visitante","odd":2.61}]'::jsonb)
  ,('bahrein-r7-j4',7,'21:45','LIGA DO BAHREIN · RODADA 7','Hidd x Malkiya','hidd','malkiya','[{"id":"bahrein-r7-j4-mandante","nome":"Hidd","tipoResultado":"mandante","odd":2.15},{"id":"bahrein-r7-j4-empate","nome":"Empate","tipoResultado":"empate","odd":3.4},{"id":"bahrein-r7-j4-visitante","nome":"Malkiya","tipoResultado":"visitante","odd":2.94}]'::jsonb)
on conflict (id) do update set
  round_no = excluded.round_no,
  scheduled_label = excluded.scheduled_label,
  category = excluded.category,
  title = excluded.title,
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  options = excluded.options;

create table if not exists public.sports_markets (
  id text primary key,
  market_type text not null default 'custom',
  league text,
  round_no integer,
  scheduled_label text,
  category text not null,
  title text not null,
  home_team_id text,
  away_team_id text,
  status text not null default 'open'
    check (status in ('draft','open','suspended','settled','archived')),
  options jsonb not null,
  result_option_id text,
  result_name text,
  published_at timestamptz,
  settled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sports_market_options_array check (jsonb_typeof(options) = 'array')
);

create table if not exists public.sports_league_state (
  singleton boolean primary key default true check (singleton),
  current_bahrain_round integer not null default 1 check (current_bahrain_round between 1 and 7),
  updated_at timestamptz not null default now()
);

insert into public.sports_league_state (singleton, current_bahrain_round)
values (true, 1)
on conflict (singleton) do nothing;

create or replace function public.set_sports_market_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sports_market_set_updated_at on public.sports_markets;
create trigger sports_market_set_updated_at
before update on public.sports_markets
for each row execute function public.set_sports_market_updated_at();

-- Primeira execução: publica R1 para o site não nascer sem partidas.
insert into public.sports_markets (
  id, market_type, league, round_no, scheduled_label, category, title,
  home_team_id, away_team_id, status, options, published_at
)
select
  t.id, 'bahrain', 'Liga do Bahrein', t.round_no, t.scheduled_label,
  t.category, t.title, t.home_team_id, t.away_team_id,
  'open', t.options, now()
from public.bahrain_market_templates t
where t.round_no = 1
on conflict (id) do nothing;

-- -------------------------------------------------------------------------
-- 2. Bilhetes e seleções travadas
-- -------------------------------------------------------------------------

create table if not exists public.sports_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_request_id uuid not null,
  stake numeric(14,2) not null check (stake >= 10 and stake <= 100000),
  odd_total numeric(14,6) not null check (odd_total > 1 and odd_total <= 250),
  potential_payout numeric(14,2) not null check (potential_payout > 0),
  payout numeric(14,2) not null default 0 check (payout >= 0),
  status text not null default 'pending' check (status in ('pending','won','lost')),
  resolution text,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  unique (user_id, client_request_id)
);

create index if not exists sports_bets_user_created
on public.sports_bets(user_id, created_at desc);

create index if not exists sports_bets_status
on public.sports_bets(status, created_at);

create table if not exists public.sports_bet_selections (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.sports_bets(id) on delete cascade,
  market_id text not null references public.sports_markets(id) on delete restrict,
  market_title text not null,
  option_id text not null,
  option_name text not null,
  locked_odd numeric(10,2) not null check (locked_odd > 1),
  status text not null default 'pending' check (status in ('pending','won','lost')),
  created_at timestamptz not null default now(),
  unique (bet_id, market_id)
);

create index if not exists sports_bet_selections_market
on public.sports_bet_selections(market_id, status);

-- Tabelas autoritativas não são API direta.
alter table public.bahrain_market_templates enable row level security;
alter table public.sports_markets enable row level security;
alter table public.sports_league_state enable row level security;
alter table public.sports_bets enable row level security;
alter table public.sports_bet_selections enable row level security;

revoke all on table public.bahrain_market_templates from anon, authenticated;
revoke all on table public.sports_markets from anon, authenticated;
revoke all on table public.sports_league_state from anon, authenticated;
revoke all on table public.sports_bets from anon, authenticated;
revoke all on table public.sports_bet_selections from anon, authenticated;

-- -------------------------------------------------------------------------
-- 3. Serialização controlada
-- -------------------------------------------------------------------------

create or replace function public._sports_bet_json(p_bet_id uuid)
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', b.id::text,
    'data', to_char(b.created_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY, HH24:MI:SS'),
    'criadaEm', floor(extract(epoch from b.created_at) * 1000)::bigint,
    'userId', b.user_id::text,
    'clienteNome', p.username,
    'selecoes', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'eventoId', s.market_id,
          'eventoTitulo', s.market_title,
          'opcaoId', s.option_id,
          'opcaoNome', s.option_name,
          'odd', s.locked_odd,
          'statusSelecao',
            case s.status
              when 'won' then 'Ganhou'
              when 'lost' then 'Perdeu'
              else 'Pendente'
            end
        )
        order by s.created_at, s.id
      )
      from public.sports_bet_selections s
      where s.bet_id = b.id
    ), '[]'::jsonb),
    'valor', b.stake,
    'oddTotal', b.odd_total,
    'retornoEstimado', b.potential_payout,
    'retornoPago', b.payout,
    'status',
      case b.status
        when 'won' then 'Ganhou'
        when 'lost' then 'Perdeu'
        else 'Pendente'
      end,
    'resolvidaEm',
      case when b.settled_at is null then null
      else to_char(b.settled_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY, HH24:MI:SS')
      end,
    'resolucao', b.resolution,
    'authoritative', true
  )
  from public.sports_bets b
  join public.profiles p on p.id = b.user_id
  where b.id = p_bet_id;
$$;

revoke all on function public._sports_bet_json(uuid) from public;

create or replace function public.get_sports_markets()
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  with state as (
    select current_bahrain_round
    from public.sports_league_state
    where singleton = true
  ),
  visible as (
    select m.*
    from public.sports_markets m
    cross join state s
    where m.status not in ('draft','archived')
      and (
        m.market_type <> 'bahrain'
        or m.round_no = s.current_bahrain_round
      )
  )
  select jsonb_build_object(
    'round', coalesce((select current_bahrain_round from state), 1),
    'events', coalesce((
      select jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'id', v.id,
          'tipo', case when v.market_type = 'bahrain' then 'futebol-bahrein' else 'custom' end,
          'liga', v.league,
          'rodada', v.round_no,
          'horario', v.scheduled_label,
          'categoria', v.category,
          'titulo', v.title,
          'mandanteId', v.home_team_id,
          'visitanteId', v.away_team_id,
          'status', case v.status when 'suspended' then 'suspenso' when 'settled' then 'encerrado' else 'aberto' end,
          'opcoes', v.options,
          'resultadoOpcaoId', v.result_option_id,
          'resultadoNome', v.result_name,
          'resultadoResolvidoEm',
            case when v.settled_at is null then null
            else to_char(v.settled_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY, HH24:MI:SS')
            end,
          'authoritative', true
        ))
        order by
          case when v.market_type = 'bahrain' then 0 else 1 end,
          coalesce(v.scheduled_label, ''),
          v.created_at
      )
      from visible v
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_sports_markets() from public;
grant execute on function public.get_sports_markets() to anon, authenticated;

create or replace function public.get_my_sports_bets()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then '[]'::jsonb
    else coalesce((
      select jsonb_agg(public._sports_bet_json(b.id) order by b.created_at desc)
      from public.sports_bets b
      where b.user_id = auth.uid()
    ), '[]'::jsonb)
  end;
$$;

revoke all on function public.get_my_sports_bets() from public;
grant execute on function public.get_my_sports_bets() to authenticated;

create or replace function public.admin_get_sports_bets()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin required';
  end if;

  select coalesce(
    jsonb_agg(public._sports_bet_json(b.id) order by b.created_at desc),
    '[]'::jsonb
  )
  into result
  from (
    select id, created_at
    from public.sports_bets
    order by created_at desc
    limit 1000
  ) b;

  return result;
end;
$$;

revoke all on function public.admin_get_sports_bets() from public;
grant execute on function public.admin_get_sports_bets() to authenticated;

-- -------------------------------------------------------------------------
-- 4. Colocação autoritativa do bilhete
-- -------------------------------------------------------------------------

create or replace function public.place_sports_bet(
  p_stake numeric,
  p_selections jsonb,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  stake_value numeric(14,2);
  selection_count integer;
  selection_item jsonb;
  market_row public.sports_markets;
  option_row jsonb;
  option_odd numeric(10,2);
  total_odd numeric(14,6) := 1;
  potential numeric(14,2);
  locked jsonb := '[]'::jsonb;
  bet_id uuid;
  existing_id uuid;
  wallet_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_request_id is null then
    raise exception 'Request id required';
  end if;

  select id into existing_id
  from public.sports_bets
  where user_id = auth.uid()
    and client_request_id = p_request_id
  limit 1;

  if existing_id is not null then
    select * into wallet_profile from public.profiles where id = auth.uid();
    return jsonb_build_object(
      'bet', public._sports_bet_json(existing_id),
      'profile', to_jsonb(wallet_profile),
      'replayed', true
    );
  end if;

  stake_value := round(coalesce(p_stake, 0), 2);

  if stake_value < 10 or stake_value > 100000 then
    raise exception 'Invalid sports stake';
  end if;

  if jsonb_typeof(coalesce(p_selections, '[]'::jsonb)) <> 'array' then
    raise exception 'Selections must be an array';
  end if;

  selection_count := jsonb_array_length(p_selections);

  if selection_count < 1 or selection_count > 8 then
    raise exception 'A sports ticket must contain between 1 and 8 selections';
  end if;

  if (
    select count(distinct nullif(trim(value->>'marketId'), ''))
    from jsonb_array_elements(p_selections)
  ) <> selection_count then
    raise exception 'Duplicate or invalid market selection';
  end if;

  for selection_item in
    select value from jsonb_array_elements(p_selections)
  loop
    select * into market_row
    from public.sports_markets
    where id = nullif(trim(selection_item->>'marketId'), '')
      and status = 'open'
      and result_option_id is null
    for share;

    if not found then
      raise exception 'Market unavailable: %', coalesce(selection_item->>'marketId', '?');
    end if;

    select value into option_row
    from jsonb_array_elements(market_row.options)
    where value->>'id' = nullif(trim(selection_item->>'optionId'), '')
    limit 1;

    if option_row is null then
      raise exception 'Invalid market option';
    end if;

    begin
      option_odd := round((option_row->>'odd')::numeric, 2);
    exception when others then
      raise exception 'Invalid server odd';
    end;

    if option_odd <= 1 or option_odd > 100 then
      raise exception 'Invalid server odd';
    end if;

    total_odd := round(total_odd * option_odd, 6);

    if total_odd > 250 then
      raise exception 'Combined odd exceeds safety cap';
    end if;

    locked := locked || jsonb_build_array(jsonb_build_object(
      'marketId', market_row.id,
      'marketTitle', market_row.title,
      'optionId', option_row->>'id',
      'optionName', option_row->>'nome',
      'odd', option_odd
    ));
  end loop;

  potential := round(stake_value * total_odd, 2);

  if potential <= 0 or potential > stake_value * 250 then
    raise exception 'Invalid sports payout';
  end if;

  insert into public.sports_bets (
    user_id, client_request_id, stake, odd_total, potential_payout
  ) values (
    auth.uid(), p_request_id, stake_value, total_odd, potential
  )
  returning id into bet_id;

  for selection_item in
    select value from jsonb_array_elements(locked)
  loop
    insert into public.sports_bet_selections (
      bet_id, market_id, market_title,
      option_id, option_name, locked_odd
    ) values (
      bet_id,
      selection_item->>'marketId',
      selection_item->>'marketTitle',
      selection_item->>'optionId',
      selection_item->>'optionName',
      (selection_item->>'odd')::numeric
    );
  end loop;

  wallet_profile := public._wallet_apply(
    auth.uid(),
    -stake_value,
    'sports_stake',
    bet_id::text,
    jsonb_build_object(
      'source', 'authoritative_sports',
      'selection_count', selection_count,
      'odd_total', total_odd,
      'request_id', p_request_id
    )
  );

  return jsonb_build_object(
    'bet', public._sports_bet_json(bet_id),
    'profile', to_jsonb(wallet_profile),
    'replayed', false
  );
exception
  when unique_violation then
    select id into existing_id
    from public.sports_bets
    where user_id = auth.uid()
      and client_request_id = p_request_id
    limit 1;

    if existing_id is null then
      raise;
    end if;

    select * into wallet_profile from public.profiles where id = auth.uid();

    return jsonb_build_object(
      'bet', public._sports_bet_json(existing_id),
      'profile', to_jsonb(wallet_profile),
      'replayed', true
    );
end;
$$;

revoke all on function public.place_sports_bet(numeric, jsonb, uuid) from public;
grant execute on function public.place_sports_bet(numeric, jsonb, uuid) to authenticated;

-- -------------------------------------------------------------------------
-- 5. Administração de mercados
-- -------------------------------------------------------------------------

create or replace function public.admin_publish_bahrain_round(p_round integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  round_value integer := greatest(1, least(7, coalesce(p_round, 1)));
  old_round integer;
  pending_count integer;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin required';
  end if;

  select current_bahrain_round into old_round
  from public.sports_league_state
  where singleton = true
  for update;

  select count(*) into pending_count
  from public.sports_bets b
  where b.status = 'pending'
    and exists (
      select 1
      from public.sports_bet_selections s
      join public.sports_markets m on m.id = s.market_id
      where s.bet_id = b.id
        and m.market_type = 'bahrain'
        and m.round_no = old_round
        and m.status in ('open','suspended')
    );

  if pending_count > 0 and old_round <> round_value then
    raise exception 'Resolve the current round before publishing another one';
  end if;

  if old_round <> round_value then
    update public.sports_markets
    set status = 'archived'
    where market_type = 'bahrain'
      and round_no = old_round
      and status in ('open','suspended');
  end if;

  insert into public.sports_markets (
    id, market_type, league, round_no, scheduled_label, category, title,
    home_team_id, away_team_id, status, options, published_at
  )
  select
    t.id, 'bahrain', 'Liga do Bahrein', t.round_no, t.scheduled_label,
    t.category, t.title, t.home_team_id, t.away_team_id,
    'open', t.options, now()
  from public.bahrain_market_templates t
  where t.round_no = round_value
  on conflict (id) do update set
    league = excluded.league,
    round_no = excluded.round_no,
    scheduled_label = excluded.scheduled_label,
    category = excluded.category,
    title = excluded.title,
    home_team_id = excluded.home_team_id,
    away_team_id = excluded.away_team_id,
    options = excluded.options,
    status = case
      when public.sports_markets.status = 'settled' then 'settled'
      else 'open'
    end,
    published_at = case
      when public.sports_markets.status = 'settled' then public.sports_markets.published_at
      else now()
    end;

  update public.sports_league_state
  set current_bahrain_round = round_value,
      updated_at = now()
  where singleton = true;

  return public.get_sports_markets();
end;
$$;

create or replace function public.admin_save_sports_market(p_market jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  market_id text := nullif(trim(coalesce(p_market->>'id','')), '');
  category_value text := upper(trim(coalesce(p_market->>'categoria','')));
  title_value text := trim(coalesce(p_market->>'titulo',''));
  status_value text := case when p_market->>'status' = 'suspenso' then 'suspended' else 'open' end;
  options_value jsonb := coalesce(p_market->'opcoes', '[]'::jsonb);
  opt jsonb;
  existing public.sports_markets;
  pending_count integer;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin required';
  end if;

  if market_id is null or char_length(market_id) > 120 then
    raise exception 'Invalid market id';
  end if;

  if category_value = '' or char_length(category_value) > 120
     or title_value = '' or char_length(title_value) > 240 then
    raise exception 'Invalid market text';
  end if;

  if jsonb_typeof(options_value) <> 'array'
     or jsonb_array_length(options_value) < 2
     or jsonb_array_length(options_value) > 12 then
    raise exception 'Market must contain 2 to 12 options';
  end if;

  for opt in select value from jsonb_array_elements(options_value)
  loop
    if nullif(trim(opt->>'id'), '') is null
       or char_length(opt->>'id') > 120
       or nullif(trim(opt->>'nome'), '') is null
       or char_length(opt->>'nome') > 120 then
      raise exception 'Invalid market option';
    end if;

    if nullif(trim(coalesce(opt->>'odd','')), '') is null then
      raise exception 'Invalid market odd';
    end if;

    begin
      if (opt->>'odd')::numeric <= 1 or (opt->>'odd')::numeric > 100 then
        raise exception 'Invalid market odd';
      end if;
    exception when invalid_text_representation then
      raise exception 'Invalid market odd';
    end;
  end loop;

  select * into existing
  from public.sports_markets
  where id = market_id
  for update;

  if found then
    if existing.status = 'settled' then
      raise exception 'Settled markets cannot be edited';
    end if;

    select count(*) into pending_count
    from public.sports_bets b
    join public.sports_bet_selections s on s.bet_id = b.id
    where s.market_id = market_id
      and b.status = 'pending';

    if pending_count > 0 then
      raise exception 'Suspend or resolve existing bets before editing this market';
    end if;

    update public.sports_markets
    set category = category_value,
        title = title_value,
        status = status_value,
        options = options_value,
        published_at = coalesce(published_at, now())
    where id = market_id;
  else
    insert into public.sports_markets (
      id, market_type, category, title, status, options, published_at, created_by
    ) values (
      market_id, 'custom', category_value, title_value, status_value,
      options_value, now(), auth.uid()
    );
  end if;

  return public.get_sports_markets();
end;
$$;

create or replace function public.admin_toggle_sports_market(p_market_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin required';
  end if;

  select status into current_status
  from public.sports_markets
  where id = p_market_id
  for update;

  if current_status not in ('open','suspended') then
    raise exception 'Only open markets can be suspended or reopened';
  end if;

  update public.sports_markets
  set status = case when current_status = 'open' then 'suspended' else 'open' end
  where id = p_market_id;

  return public.get_sports_markets();
end;
$$;

create or replace function public.admin_archive_sports_market(p_market_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_count integer;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin required';
  end if;

  select count(*) into pending_count
  from public.sports_bets b
  join public.sports_bet_selections s on s.bet_id = b.id
  where s.market_id = p_market_id
    and b.status = 'pending';

  if pending_count > 0 then
    raise exception 'Market has pending bets and cannot be archived';
  end if;

  update public.sports_markets
  set status = 'archived'
  where id = p_market_id;

  if not found then
    raise exception 'Market not found';
  end if;

  return public.get_sports_markets();
end;
$$;

create or replace function public.admin_clear_settled_sports_markets()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin required';
  end if;

  update public.sports_markets
  set status = 'archived'
  where status = 'settled';

  return public.get_sports_markets();
end;
$$;

-- -------------------------------------------------------------------------
-- 6. Liquidação autoritativa
-- -------------------------------------------------------------------------

create or replace function public.admin_resolve_sports_market(
  p_market_id text,
  p_winner_option_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  market_row public.sports_markets;
  winner jsonb;
  bet_row record;
  lost_count integer;
  pending_selection_count integer;
  won_bets integer := 0;
  lost_bets integer := 0;
  payout_total numeric(14,2) := 0;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin required';
  end if;

  select * into market_row
  from public.sports_markets
  where id = p_market_id
  for update;

  if not found then
    raise exception 'Market not found';
  end if;

  if market_row.status = 'settled' then
    raise exception 'Market already settled';
  end if;

  if market_row.status = 'archived' then
    raise exception 'Archived market cannot be settled';
  end if;

  select value into winner
  from jsonb_array_elements(market_row.options)
  where value->>'id' = p_winner_option_id
  limit 1;

  if winner is null then
    raise exception 'Winner option not found';
  end if;

  update public.sports_markets
  set status = 'settled',
      result_option_id = p_winner_option_id,
      result_name = winner->>'nome',
      settled_at = now()
  where id = p_market_id;

  update public.sports_bet_selections s
  set status = case when s.option_id = p_winner_option_id then 'won' else 'lost' end
  from public.sports_bets b
  where s.bet_id = b.id
    and s.market_id = p_market_id
    and b.status = 'pending'
    and s.status = 'pending';

  for bet_row in
    select b.*
    from public.sports_bets b
    where b.status = 'pending'
      and exists (
        select 1
        from public.sports_bet_selections s
        where s.bet_id = b.id
          and s.market_id = p_market_id
      )
    for update
  loop
    select
      count(*) filter (where status = 'lost'),
      count(*) filter (where status = 'pending')
    into lost_count, pending_selection_count
    from public.sports_bet_selections
    where bet_id = bet_row.id;

    if lost_count > 0 then
      update public.sports_bets
      set status = 'lost',
          payout = 0,
          settled_at = now(),
          resolution = 'Automática · resultado de mercado'
      where id = bet_row.id;

      lost_bets := lost_bets + 1;
    elsif pending_selection_count = 0 then
      perform public._wallet_apply(
        bet_row.user_id,
        bet_row.potential_payout,
        'sports_payout',
        bet_row.id::text,
        jsonb_build_object(
          'source', 'authoritative_sports',
          'resolution', 'market',
          'market_id', p_market_id
        )
      );

      update public.sports_bets
      set status = 'won',
          payout = potential_payout,
          settled_at = now(),
          resolution = 'Automática · resultado de mercado'
      where id = bet_row.id;

      won_bets := won_bets + 1;
      payout_total := payout_total + bet_row.potential_payout;
    end if;
  end loop;

  return jsonb_build_object(
    'marketId', p_market_id,
    'winnerOptionId', p_winner_option_id,
    'winnerName', winner->>'nome',
    'wonBets', won_bets,
    'lostBets', lost_bets,
    'payoutTotal', payout_total,
    'markets', public.get_sports_markets()
  );
end;
$$;

create or replace function public.admin_resolve_sports_bet(
  p_bet_id uuid,
  p_result text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  bet_row public.sports_bets;
  normalized text := lower(trim(coalesce(p_result,'')));
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Admin required';
  end if;

  select * into bet_row
  from public.sports_bets
  where id = p_bet_id
  for update;

  if not found then
    raise exception 'Bet not found';
  end if;

  if bet_row.status <> 'pending' then
    raise exception 'Bet already settled';
  end if;

  if normalized not in ('ganhou','won','perdeu','lost') then
    raise exception 'Invalid manual result';
  end if;

  if normalized in ('ganhou','won') then
    perform public._wallet_apply(
      bet_row.user_id,
      bet_row.potential_payout,
      'sports_payout',
      bet_row.id::text,
      jsonb_build_object(
        'source', 'authoritative_sports',
        'resolution', 'manual_admin'
      )
    );

    update public.sports_bets
    set status = 'won',
        payout = potential_payout,
        settled_at = now(),
        resolution = 'Manual · administração'
    where id = bet_row.id;
  else
    update public.sports_bets
    set status = 'lost',
        payout = 0,
        settled_at = now(),
        resolution = 'Manual · administração'
    where id = bet_row.id;
  end if;

  return public._sports_bet_json(p_bet_id);
end;
$$;

revoke all on function public.admin_publish_bahrain_round(integer) from public;
revoke all on function public.admin_save_sports_market(jsonb) from public;
revoke all on function public.admin_toggle_sports_market(text) from public;
revoke all on function public.admin_archive_sports_market(text) from public;
revoke all on function public.admin_clear_settled_sports_markets() from public;
revoke all on function public.admin_resolve_sports_market(text, text) from public;
revoke all on function public.admin_resolve_sports_bet(uuid, text) from public;

grant execute on function public.admin_publish_bahrain_round(integer) to authenticated;
grant execute on function public.admin_save_sports_market(jsonb) to authenticated;
grant execute on function public.admin_toggle_sports_market(text) to authenticated;
grant execute on function public.admin_archive_sports_market(text) to authenticated;
grant execute on function public.admin_clear_settled_sports_markets() to authenticated;
grant execute on function public.admin_resolve_sports_market(text, text) to authenticated;
grant execute on function public.admin_resolve_sports_bet(uuid, text) to authenticated;

-- -------------------------------------------------------------------------
-- 7. Desliga pontes esportivas legadas
-- -------------------------------------------------------------------------

create or replace function public.spend_taicoins(
  p_amount numeric,
  p_kind text,
  p_external_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Legacy direct stake disabled; use place_sports_bet or an authoritative game RPC';
end;
$$;

create or replace function public.credit_sports_payout(
  p_external_id text,
  p_amount numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Legacy sports payout disabled; results are settled by the server';
end;
$$;

revoke all on function public.spend_taicoins(numeric, text, text, jsonb) from public;
revoke all on function public.credit_sports_payout(text, numeric, jsonb) from public;
revoke execute on function public.spend_taicoins(numeric, text, text, jsonb) from anon, authenticated;
revoke execute on function public.credit_sports_payout(text, numeric, jsonb) from anon, authenticated;

-- Histórico legado esportivo já importado é preservado, mas o navegador não
-- consegue mais sobrescrevê-lo para fabricar ranking.
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
  safe_games jsonb := coalesce(p_games_history, '[]'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(safe_games) <> 'array'
     or jsonb_array_length(safe_games) > 2000 then
    raise exception 'Invalid games history';
  end if;

  update public.user_history_state
  set games_history = safe_games
  where user_id = auth.uid()
    and legacy_history_imported = true
  returning * into result;

  if not found then
    raise exception 'Resolve legacy history first';
  end if;

  return result;
end;
$$;

-- Contas que ainda não resolveram a migração não podem importar um
-- sports_history arbitrário depois da Fase 3.10.
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

  safe_games := case
    when jsonb_typeof(coalesce(p_games_history, '[]'::jsonb)) = 'array'
      then coalesce(p_games_history, '[]'::jsonb)
    else '[]'::jsonb
  end;

  if jsonb_array_length(safe_games) > 2000 then
    raise exception 'Legacy games history is too large';
  end if;

  update public.user_history_state
  set sports_history = '[]'::jsonb,
      games_history = case when p_import_local then safe_games else '[]'::jsonb end,
      legacy_history_imported = true
  where user_id = auth.uid()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.sync_my_history(jsonb, jsonb) from public;
revoke all on function public.resolve_legacy_history(boolean, jsonb, jsonb) from public;
grant execute on function public.sync_my_history(jsonb, jsonb) to authenticated;
grant execute on function public.resolve_legacy_history(boolean, jsonb, jsonb) to authenticated;

-- -------------------------------------------------------------------------
-- 8. Ranking: legado preservado + esportes novos autoritativos + minigames
-- -------------------------------------------------------------------------

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
      coalesce(h.sports_history, '[]'::jsonb) as legacy_sports
    from public.profiles p
    left join public.user_history_state h on h.user_id = p.id
  ),
  legacy_agg as (
    select
      pr.id,
      count(s.value)::bigint as sports_count,
      count(s.value) filter (where s.value->>'status' = 'Ganhou')::bigint as wins,
      count(s.value) filter (where s.value->>'status' = 'Perdeu')::bigint as losses,
      count(s.value) filter (where s.value->>'status' = 'Pendente')::bigint as pending,
      coalesce(sum(case
        when coalesce(s.value->>'valor','') ~ '^-?[0-9]+([.][0-9]+)?$'
          then (s.value->>'valor')::numeric else 0 end
      ),0)::numeric as staked,
      coalesce(sum(case
        when s.value->>'status' = 'Ganhou' then
          case
            when coalesce(s.value->>'retornoPago','') ~ '^-?[0-9]+([.][0-9]+)?$'
              then (s.value->>'retornoPago')::numeric
            when coalesce(s.value->>'retornoEstimado','') ~ '^-?[0-9]+([.][0-9]+)?$'
              then (s.value->>'retornoEstimado')::numeric
            else 0 end
        else 0 end
      ),0)::numeric as payout
    from profile_rows pr
    left join lateral jsonb_array_elements(pr.legacy_sports) s(value) on true
    group by pr.id
  ),
  auth_sports as (
    select
      b.user_id as id,
      count(*)::bigint as sports_count,
      count(*) filter (where b.status = 'won')::bigint as wins,
      count(*) filter (where b.status = 'lost')::bigint as losses,
      count(*) filter (where b.status = 'pending')::bigint as pending,
      coalesce(sum(b.stake),0)::numeric as staked,
      coalesce(sum(b.payout),0)::numeric as payout
    from public.sports_bets b
    group by b.user_id
  ),
  games as (
    select
      g.user_id as id,
      count(*)::bigint as games_count,
      count(*) filter (where g.payout > 0)::bigint as wins,
      count(*) filter (where g.payout <= 0)::bigint as losses,
      coalesce(sum(g.stake),0)::numeric as staked,
      coalesce(sum(g.payout),0)::numeric as payout
    from public.game_rounds g
    group by g.user_id
  )
  select
    pr.id,
    pr.username,
    pr.avatar_key,
    pr.role,
    pr.balance,
    pr.joined_at,
    (coalesce(l.sports_count,0) + coalesce(a.sports_count,0))::bigint,
    coalesce(g.games_count,0)::bigint,
    (coalesce(l.wins,0) + coalesce(a.wins,0) + coalesce(g.wins,0))::bigint,
    (coalesce(l.losses,0) + coalesce(a.losses,0) + coalesce(g.losses,0))::bigint,
    (coalesce(l.pending,0) + coalesce(a.pending,0))::bigint,
    (coalesce(l.staked,0) + coalesce(a.staked,0) + coalesce(g.staked,0))::numeric,
    (coalesce(l.payout,0) + coalesce(a.payout,0) + coalesce(g.payout,0))::numeric,
    (
      coalesce(l.payout,0) + coalesce(a.payout,0) + coalesce(g.payout,0)
      - coalesce(l.staked,0) - coalesce(a.staked,0) - coalesce(g.staked,0)
    )::numeric
  from profile_rows pr
  left join legacy_agg l on l.id = pr.id
  left join auth_sports a on a.id = pr.id
  left join games g on g.id = pr.id
  order by
    pr.balance desc,
    (coalesce(l.wins,0) + coalesce(a.wins,0) + coalesce(g.wins,0)) desc,
    pr.joined_at asc;
$$;

revoke all on function public.get_public_ranking() from public;
grant execute on function public.get_public_ranking() to anon, authenticated;

commit;
