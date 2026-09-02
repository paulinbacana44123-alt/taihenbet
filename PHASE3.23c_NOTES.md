# TaihenBet 2.0 — Fase 3.23c

## Neytai cobre as quatro áreas que faltavam

Foram acrescentadas oito etapas ao tour principal:

- `irFeed` → destaca o botão Feed.
- `feed` → explica o Feed público e sua privacidade mínima.
- `irMissoes` → destaca Missões.
- `missoes` → explica ciclos diário/semanal, progresso e resgate.
- `irEvento` → destaca Evento.
- `evento` → explica temporada, prestígio, marcos e arquivo.
- `irLoja` → destaca Loja.
- `loja` → explica cosméticos, inventário e ausência de vantagem competitiva.

O tour passa de 45 para 53 etapas (para administradores; etapas administrativas continuam filtradas para contas comuns).

## Compatibilidade com o editor 3.23a

Nenhuma tabela nova foi necessária. `ContentAdminPanel.jsx` deriva a lista do editor diretamente de `NEYTAI_DEFAULT_STEPS`; por isso as oito etapas surgem automaticamente no editor de falas.

Overrides anteriores continuam válidos porque os IDs existentes não foram alterados, inclusive `final`.

## Cumulativo com 3.23b

O pacote inclui a Mensagem do Criador e o pós-créditos da Fase 3.23b. O SQL incluído é o mesmo `phase3_23b_creator_message.sql`; rode-o somente caso ainda não tenha instalado a 3.23b.

## Migração local do tour

A versão do tour agora é `tour-completo-v7-feed-missoes-evento-loja`.

- tour já concluído → retoma em `irFeed`;
- usuário parado no antigo final/pós-créditos → retoma em `irFeed`;
- usuário no meio do tour → preserva a etapa existente;
- após Loja → falso final → “Opa, espera, faltou um bagui” → Recado → final real.
