# TaihenBet 2.0 — Phase 3.10 — Authoritative Sports

## O que mudou

### Bilhete autoritativo
`place_sports_bet()` recebe apenas:
- stake;
- IDs dos mercados/opções;
- um request ID de idempotência.

O servidor busca as odds oficiais, trava snapshots das seleções, calcula a odd total,
debita a carteira e registra o bilhete numa única transação.

### Novas tabelas
- `sports_markets`
- `sports_league_state`
- `sports_bets`
- `sports_bet_selections`
- `bahrain_market_templates`

As tabelas não são API pública do navegador; leitura/escrita normal acontece por RPC.

### Administração
- `admin_publish_bahrain_round()`
- `admin_save_sports_market()`
- `admin_toggle_sports_market()`
- `admin_archive_sports_market()`
- `admin_clear_settled_sports_markets()`
- `admin_resolve_sports_market()`
- `admin_resolve_sports_bet()`

Ao definir o resultado de um mercado, o PostgreSQL atualiza as seleções, encerra
bilhetes derrotados e paga automaticamente bilhetes completos vencedores.

### Pontes antigas desligadas
- `spend_taicoins()` deixa de aceitar apostas esportivas diretas.
- `credit_sports_payout()` é desativada para o cliente.

### Histórico e ranking
O histórico esportivo novo vem de `sports_bets`.
O histórico legado já importado é preservado, mas não pode mais ser reescrito pelo navegador.
O ranking soma legado + bilhetes autoritativos + `game_rounds`.

### Mercados customizados
A aba de edição do Painel continua funcionando, mas mercados novos/alterados agora
são persistidos pelo servidor. Se houver bilhete pendente num mercado, o servidor
impede reescrever suas opções/odds até a situação ser resolvida.
