-- ============================================================================
-- TAIHENBET 2.0 — FASE 3.10a
-- Sincronização do saldo em tempo real
-- ============================================================================
-- Segurança:
--   * NÃO abre escrita direta em profiles;
--   * NÃO altera as RLS da Fase 3.9;
--   * apenas habilita profiles no publication do Supabase Realtime.
--   * eventos continuam sujeitos às permissões/RLS da conta autenticada.
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    execute 'alter publication supabase_realtime add table public.profiles';
  end if;
end
$$;
