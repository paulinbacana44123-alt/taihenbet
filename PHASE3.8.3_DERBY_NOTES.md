# TaihenBet 2.0 — Phase 3.8.3

## Taihen Derby autoritativo

O navegador nao sorteia mais a vencedora nem calcula o premio.

### Fluxo
1. `start_derby(stake, runner)` valida o bilhete e debita a entrada.
2. O PostgreSQL escolhe a vencedora e a ordem completa de chegada.
3. Esses dados ficam secretos em `derby_sessions` durante a corrida.
4. O frontend recebe apenas horarios, escolha, stake e odd para animar a corrida.
5. Ao atingir o horario final do servidor, `get_derby` liquida a rodada.
6. O premio e creditado atomicamente quando a corredora escolhida venceu.
7. O resultado e registrado em `game_rounds` e a sessao secreta e apagada.

### Anti-vazamento
Enquanto `status = active`, a resposta publica devolve:
- `winnerRunner: null`
- `finishOrder: null`

A tabela `derby_sessions` nao possui SELECT para `authenticated`.

### F5
A sessao usa horarios do servidor (`raceStartsAt`, `raceEndsAt`).
Se a pagina for recarregada durante a corrida, `get_derby(null)` restaura a mesma rodada sem cobrar outra entrada.

### Visual
A animacao local e apenas cenografica. Nenhuma corredora chega a 100% antes do servidor revelar o resultado. Depois da resposta final, a ordem oficial e aplicada na pista.

### Protocolo Mambo
A regra da versao anterior foi preservada no servidor:
- a corredora apostada possui 5% de chance;
- se a aposta nao for na Matikanetannhauser e perder, Mambo vence;
- se a aposta for na Mambo e os 5% falharem, uma das outras cinco vence.
