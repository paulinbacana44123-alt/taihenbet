# TaihenBet 2.0 — Fase 3.8.1a

Hotfix de ciclo de vida da sessão secreta da TaiMandioca.

A Fase 3.8.1 já restringia `get_active_taimandioca()` a `status = 'active'`, e o índice exclusivo também só considerava sessões ativas. Portanto, uma linha `cashout/lost/perfect` antiga não bloqueava uma nova partida.

O problema era outro: `taimandioca_sessions` continuava retendo `hazard_indices` após a liquidação. Como o resultado definitivo já é persistido em `game_rounds` e a movimentação financeira em `wallet_transactions`, manter o mapa secreto não traz benefício.

A 3.8.1a passa a excluir a sessão secreta depois de `lost`, `cashout` ou `perfect`, apenas depois de registrar a rodada e montar a resposta pública para o cliente.
