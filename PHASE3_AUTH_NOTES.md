# TaihenBet 2.0 — Fase 3.0: Autenticação

Este patch adiciona a primeira camada da TaihenBet Online:

- botão Entrar / Criar conta no header;
- cadastro com nome, e-mail e senha;
- login com Supabase Auth;
- sessão persistente;
- menu da conta no header;
- logout;
- feedback para confirmação de e-mail e erros comuns.

## Antes de testar

O projeto precisa ter:

```bash
npm install @supabase/supabase-js
```

E um `.env` na raiz (NÃO está incluso neste patch):

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Depois de alterar `.env`, reinicie `npm run dev`.

## Observação

Esta fase autentica a conta, mas AINDA NÃO move TaiCoins, histórico ou ranking para o banco. O saldo continua local por enquanto. Isso será feito nas próximas fases para evitar migrar toda a economia de uma vez.
