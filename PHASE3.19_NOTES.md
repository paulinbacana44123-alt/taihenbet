# Fase 3.19 — Missões Diárias e Semanais

## Objetivo

Fechar o loop da economia fictícia do TaihenBet:

`atividade → missão → recompensa → TaiShop → perfil público`

## Fonte do progresso

A Fase 3.19 não confia em contadores enviados pelo navegador.
Triggers observam tabelas que já são autoritativas no projeto:

- `game_rounds` → `game_play`;
- `sports_bets` → `sports_bet`;
- `wallet_transactions` com amount negativo → `taicoins_spent`.

Os eventos deduplicados ficam em `mission_events`.

## Resgates

`claim_my_mission()` recalcula o progresso no servidor antes de liberar a
recompensa. Cada missão possui uma chave de período e `user_mission_claims`
impede resgate duplicado.

As TaiCoins são creditadas por `_wallet_apply()` usando `admin_adjustment` com
metadata `source = missions`, preservando o endurecimento de carteira da 3.9.

## Fuso / reset

As janelas usam `America/Sao_Paulo`:

- diária: 00:00 → 23:59 do dia;
- semanal: segunda 00:00 → próxima segunda 00:00.

## Recompensa exclusiva

`badge_weekly_auditor` é inserido no catálogo de cosméticos como ativo, porém
`shop_visible = false`. Assim:

- pode ser equipado pelo sistema normal da 3.18;
- aparece no perfil público;
- não pode ser comprado na TaiShop.

## Compatibilidade

A RPC pública da TaiShop foi ajustada para esconder itens `shop_visible = false`
e o estado da loja conta apenas cosméticos compráveis, evitando contadores como
"13/12" depois do badge de missão ser adquirido.
