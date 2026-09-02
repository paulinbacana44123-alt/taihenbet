# TaihenBet 2.0 — Fase 3.20

## Eventos e Temporadas

A Fase 3.20 adiciona uma camada sazonal sobre os sistemas existentes sem alterar odds, premios ou resultados dos jogos.

### Temporada inicial

**Temporada Piloto — Era da Mandioca**

O primeiro `RUN` do SQL fixa o inicio nas 00:00 de Brasilia do mesmo dia e o encerramento 28 dias depois. Reexecutar o patch nao reinicia as datas da temporada.

### Missoes sazonais

- Expedição à Colheita — 8 partidas — +80 pts / +60 T
- Agrônomo de Odds — 4 bilhetes esportivos — +80 pts / +60 T
- Queima de Verba Agrícola — 300 T gastos — +100 pts / +75 T
- Funcionário Sazonal — 3 missões diárias resgatadas — +120 pts / +80 T
- Comitê da Safra — 3 missões sazonais resgatadas — +120 pts / +100 T

### Prestigio

O placar e server-side e possui ledger idempotente.

Além das missões sazonais:
- missão diária normal resgatada: +10 pts
- missão semanal normal resgatada: +40 pts

### Marcos

- 100 pts — Broto Homologado — +50 T
- 250 pts — Colheita Registrada — +100 T
- 500 pts — Safra Lendária — +150 T + **Sobrevivente da Safra**

O badge final é cadastrado no `cosmetic_catalog` como ativo, porém oculto da TaiShop. Só o RPC de recompensa sazonal coloca o item no inventário.

### Segurança

- Progressos vêm das tabelas autoritativas já usadas pelas missões 3.19.
- Resgate recalcula a meta no servidor.
- Missões e marcos possuem chaves únicas de resgate.
- TaiCoins entram pela `_wallet_apply` endurecida.
- Contas suspensas não resgatam recompensas nem equipam o badge sazonal.
- Pontos sazonais possuem ledger com `source_key` único, evitando duplicação.

### Arquivo

O banco já preserva temporadas encerradas. Quando a temporada atual terminar, ela deixa de ser ativa automaticamente pelo intervalo `starts_at / ends_at` e passa a aparecer no arquivo do usuário.
