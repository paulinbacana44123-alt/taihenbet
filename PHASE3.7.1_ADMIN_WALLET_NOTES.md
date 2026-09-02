# TaihenBet 2.0 — Fase 3.7.1: Tesouraria administrativa

Pequeno complemento da Fase 3.7.

## O que entra

- Nova aba **Carteiras** no Painel da banca.
- Lista as contas reais de `public.profiles`.
- Admin escolhe uma conta e informa o **saldo final desejado**.
- O frontend calcula somente a diferença e chama `admin_adjust_wallet()`.
- Todo ajuste gera `kind = admin_adjustment` em `wallet_transactions`.
- Não há edição direta de `profiles.balance` pelo navegador.
- Confirmação mostra saldo anterior, diferença e saldo final.
- Campo de motivo é gravado no metadata do ledger.

## Para restaurar a Paulin após os testes

No estado observado após os testes, a conta estava em 1,2 T. Para voltar ao saldo que existia antes dos giros extras de validação, abra:

Painel → Carteiras → Paulin

E informe **508,7** em "Saldo final desejado".

A função administrativa deve gerar aproximadamente:

- `admin_adjustment`: `+507,50`
- `balance_after`: `508,70`

## Instalação

Aplicar sobre a Fase 3.7. Não há SQL novo: a RPC `admin_adjust_wallet()` já foi criada em `phase3_7_authoritative_wallet.sql`.
