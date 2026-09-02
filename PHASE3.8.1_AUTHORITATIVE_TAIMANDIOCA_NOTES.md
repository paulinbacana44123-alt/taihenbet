# TaihenBet 2.0 — Fase 3.8.1

## TaiMandioca autoritativa

Esta fase move o tabuleiro secreto da TaiMandioca para o PostgreSQL/Supabase.

### O navegador NÃO recebe mais

- a lista de posições das mandiocas normais;
- o sorteio do tabuleiro;
- autoridade para decidir vitória/derrota;
- autoridade para calcular ou creditar o prêmio.

### RPCs novas

- `start_taimandioca(stake, hazards)` — debita e cria uma sessão secreta;
- `reveal_taimandioca(session_id, index)` — revela somente a casa pedida;
- `cashout_taimandioca(session_id)` — calcula e paga o cashout no servidor;
- `get_active_taimandioca()` — restaura uma sessão ativa após F5.

### Tabela privada

`public.taimandioca_sessions`

Ela guarda `hazard_indices`, mas não concede `SELECT` para `authenticated`. A aplicação só enxerga o estado público devolvido pelas RPCs.

### Auditoria

Quando a colheita termina, a rodada também é gravada em `public.game_rounds` com `game = 'taimandioca'`.

O ledger usa o mesmo UUID da sessão para:

- `game_stake` negativo;
- `game_payout` positivo, quando houver.

### Proteção adicional

`credit_game_payout()` passa a rejeitar pagamentos manuais tanto do Taigrinho quanto da TaiMandioca. Os dois jogos agora liquidam seus próprios resultados no servidor.

### Persistência

Uma colheita ativa sobrevive a F5. Ao voltar para a página de Jogos, o frontend consulta `get_active_taimandioca()` e reconstrói apenas as casas já reveladas — nunca o tabuleiro secreto.
