# TaihenBet 2.0 — Phase 3.9 — Bank Hardening

A Fase 3.8 moveu os quatro Jogos da Entidade para o servidor. A Fase 3.9 remove pontes antigas que continuavam existindo por compatibilidade e reforça as fronteiras do banco.

## Fechamentos principais

### 1. Payout genérico de minigame removido
`credit_game_payout()` deixa de ter `EXECUTE` para `authenticated` e a implementação passa a rejeitar qualquer chamada. Taigrinho, TaiMandioca, Crash do Regime e Taihen Derby devem pagar exclusivamente pelas suas próprias RPCs autoritativas.

### 2. `spend_taicoins()` não cria mais `game_stake`
A função genérica fica reservada ao módulo esportivo legado. Entradas dos Jogos da Entidade são debitadas dentro de `play_taigrinho`, `start_taimandioca`, `start_crash_regime` e `start_derby`.

### 3. Migração de saldo local encerrada
`resolve_legacy_balance()` mantém a assinatura antiga para compatibilidade, porém ignora números enviados pelo navegador. Uma conta não migrada apenas confirma o saldo já existente no PostgreSQL.

Isso elimina o cenário em que um cliente novo poderia enviar um `p_local_balance` arbitrário e transformá-lo em patrimônio da conta.

### 4. RLS de perfis endurecida
Leitura direta de `profiles` passa a ser:
- usuário comum: apenas o próprio perfil;
- administrador: todos os perfis;
- anônimo: sem `SELECT` direto.

O ranking público continua disponível pela RPC `get_public_ranking()`, que expõe somente o contrato público do ranking.

### 5. Ledger e rodadas
`wallet_transactions` e `game_rounds`:
- sem INSERT/UPDATE/DELETE direto para o navegador;
- usuário lê as próprias linhas;
- administrador pode auditar todas.

### 6. Segredos dos jogos
`taimandioca_sessions`, `crash_regime_sessions` e `derby_sessions` continuam com todos os privilégios removidos de `anon` e `authenticated`.

### 7. Núcleo da carteira
`_wallet_apply()` agora valida:
- tipo da operação;
- limite absoluto por mutação;
- `external_id` obrigatório e com tamanho limitado;
- metadata obrigatoriamente JSON object;
- limite de tamanho da metadata;
- saldo final entre zero e o teto da banca.

### 8. Ranking dos minigames
As estatísticas dos Jogos da Entidade deixam de confiar no `games_history` sincronizado pelo navegador. Contagem, vitórias, derrotas, entrada e payout de minigames passam a vir de `game_rounds`.

O histórico esportivo continua legado nesta fase.

## Fora do escopo

O módulo de apostas esportivas ainda possui estado/resolução no cliente e `credit_sports_payout`. Ele precisa de uma migração autoritativa própria antes de ser tratado como resistente a manipulação via DevTools.
