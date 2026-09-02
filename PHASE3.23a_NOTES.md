# Fase 3.23a — Editor de Falas da Neytai

Extensão da Central de Conteúdo da Fase 3.23.

## Arquitetura

- `src/data/neytaiTour.js` passa a ser a fonte única das falas padrão e dos metadados técnicos do tour.
- `neytai_message_overrides` armazena somente conteúdo personalizado por `step_id`.
- `get_public_neytai_message_overrides()` entrega as personalizações ao assistente.
- `get_content_studio_snapshot()` foi estendido com `neytai_messages`.
- escrita e reset continuam protegidos por `_content_studio_assert_admin()`.
- o componente do Neytai mantém fallback integral para os textos do código.

## Campos editáveis

`titulo`, `texto`, `instrucao`, `botaoPausa` e `dicas`.

Campos técnicos como `pagina`, `alvo`, `modo`, `jogo`, `adminOnly`, `id`, `numero` e `grupo` não são enviados para a RPC de escrita.
