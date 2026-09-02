# TaihenBet 2.0 — Fase 3.8.2 — Crash do Regime autoritativo

## Objetivo

Mover o resultado financeiro e o ponto de crash do **Crash do Regime** para o PostgreSQL/Supabase. O React continua responsável pela animação, som e gráfico, mas deixa de decidir se uma retirada foi válida.

## Nova sessão privada

A tabela `public.crash_regime_sessions` armazena:

- id da rodada;
- usuário;
- entrada;
- ponto secreto de confisco;
- horário de início do servidor;
- estado da operação;
- payout/multiplicador final;
- saldos pós-entrada e pós-liquidação.

A tabela tem RLS habilitada e `anon`/`authenticated` não possuem `SELECT` direto. O ponto de confisco é acessado somente pelas funções `SECURITY DEFINER`.

## RPCs

### `start_crash_regime(p_stake)`

- valida a entrada;
- impede duas operações ativas simultâneas para a mesma conta;
- debita a carteira por `_wallet_apply`;
- gera e sela o ponto de crash no servidor;
- inicia o relógio **depois** da confirmação do débito;
- retorna apenas o estado público.

### `get_crash_regime(p_session_id)`

- usa `clock_timestamp()` do servidor;
- calcula o multiplicador pela diferença entre `started_at` e o relógio do banco;
- se o ponto secreto já tiver sido atingido, liquida a derrota;
- enquanto a sessão estiver ativa, retorna `crashPoint: null`.

### `cashout_crash_regime(p_session_id)`

- recebe apenas o id da sessão;
- NÃO recebe multiplicador do navegador;
- trava a linha da sessão;
- calcula novamente o multiplicador usando o relógio do servidor;
- se o crash já aconteceu, registra derrota;
- caso contrário, credita o payout via `_wallet_apply` e encerra como `cashout`;
- é idempotente para uma sessão já resolvida.

## Ledger e histórico

Toda operação usa o mesmo UUID como `external_id`:

- `game_stake` na entrada;
- `game_payout` apenas se houver retirada bem-sucedida.

A rodada final também é salva em `game_rounds` com `game = 'crash-regime'`.

## Fechamento da ponte genérica

`credit_game_payout()` passa a recusar payout genérico de:

- Taigrinho;
- TaiMandioca;
- Crash do Regime.

Assim, um cliente não pode usar a função de payout antiga para fabricar uma vitória desses jogos autoritativos.

## Persistência / F5

Ao montar a página de Jogos, o frontend chama `get_crash_regime(null)`.

Se existir operação ativa:

- ela é restaurada com a mesma entrada e mesmo `startedAt`;
- não existe novo débito;
- o gráfico é reconstruído a partir do relógio retornado pelo servidor;
- o ponto secreto continua oculto.

## O que ainda é visual no cliente

O React ainda calcula uma curva local para **desenhar** o multiplicador entre os polls. Isso não possui autoridade financeira. A retirada sempre é recalculada no servidor no instante em que `cashout_crash_regime()` é recebido.

## Teste de segurança principal

Enquanto `status = active`, as respostas de `start_crash_regime` e `get_crash_regime` devem conter:

- `sessionId` / `roundId`;
- `startedAt`;
- `serverNow`;
- `multiplicadorAtual`;
- `retornoAtual`;
- `crashPoint: null`.

O valor real de `crash_point` só pode ser revelado depois que a rodada já estiver encerrada.
