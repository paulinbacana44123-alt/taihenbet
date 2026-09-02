# TaihenBet 2.0 — Phase 3.8.2c

## Crash do Regime — estabilidade e cleanup

### Polling
O frontend agora consulta `get_crash_regime` a cada **500 ms**, em vez de aproximadamente 180 ms.

A curva e o multiplicador visual continuam animados localmente com `requestAnimationFrame`.
Isso reduz bastante o volume de chamadas sem entregar autoridade ao navegador.

### Cleanup
Ao encerrar por:
- confisco;
- retirada;

o servidor:
1. liquida a rodada;
2. registra em `game_rounds`;
3. registra o ledger em `wallet_transactions` quando aplicável;
4. monta a resposta final;
5. remove a linha de `crash_regime_sessions`.

Assim, a tabela de sessão guarda apenas operações realmente ativas.

### Idempotência
Se uma requisição atrasada consultar o ID de uma sessão já apagada, `get_crash_regime`
reconstrói o comprovante usando `game_rounds`.

### Teste sugerido
1. Inicie Crash com 10 T.
2. Abra F12 > Network.
3. Confirme que `get_crash_regime` aparece aproximadamente 2 vezes por segundo, e não dezenas.
4. Faça cashout ou espere perder.
5. Atualize `crash_regime_sessions`: deve ficar sem a sessão encerrada.
6. Confira `game_rounds` e `wallet_transactions`.
