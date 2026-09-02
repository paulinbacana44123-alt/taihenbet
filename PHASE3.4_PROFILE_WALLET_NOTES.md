# TaihenBet 2.0 — Fase 3.4: Perfil + TaiCoins persistentes

## Antes de copiar o patch
1. Abra o Supabase > SQL Editor > New query.
2. Cole TODO o conteúdo de `supabase/phase3_4_profiles_wallet.sql`.
3. Clique em Run.
4. Se quiser que sua conta tenha o Painel em produção, rode também `supabase/make_me_admin.sql` depois de trocar `SEU_EMAIL_AQUI` pelo seu e-mail.

## Depois
Copie o patch por cima do projeto e reinicie `npm run dev`.

Na primeira entrada de cada conta, a banca pergunta se deve importar o saldo antigo do navegador ou começar com 1.000 TaiCoins.

## O que entrou
- Tabela `profiles` ligada ao Supabase Auth.
- Username e avatar persistentes.
- 4 avatares internos: Taihen 2026, TaiMandioca, Ditadora Suprema e Entidade da Banca.
- TaiCoins carregadas do banco ao entrar e sincronizadas durante o uso.
- Migração única do saldo antigo do localStorage.
- Menu de conta com patrimônio + botão "Editar meu perfil".
- Em produção, a aba Painel só aparece para `role = admin`.
- RLS e privilégios de coluna impedem UPDATE direto de `balance` e `role` na tabela.

## Observação importante de integridade
O dinheiro é fictício e o projeto ainda calcula os jogos no navegador. A função `sync_my_balance` é uma ponte de migração para persistência, não um sistema anti-cheat definitivo. Antes de colocar um ranking competitivo público, mova sorteios, pagamentos e recompensas para funções/servidor autoritativos e remova essa ponte.
