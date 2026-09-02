# Fase 3.23 — Central de Conteúdo

A Fase 3.23 transforma o Painel da Banca numa camada de CMS para o TaihenBet.

## Arquitetura

- `achievement_catalog`: catálogo autoritativo e editável das conquistas.
- `mission_catalog`: substitui o antigo catálogo hardcoded de missões da Fase 3.19.
- `site_text_content`: textos editoriais gerais com valor atual + valor padrão.
- TaiShop, temporadas e empresas reutilizam as tabelas server-side que já existiam.
- `get_content_studio_snapshot()` entrega ao painel todos os blocos editáveis numa única RPC.
- RPCs administrativas validam `profiles.role = 'admin'` antes de qualquer escrita.

## Consistência

- Missões usam `mission_catalog` dentro de `_mission_definitions()`, portanto meta e recompensa mudadas no painel também mudam o resgate server-side.
- Notificações e Feed consultam `achievement_catalog` para novos nomes/títulos de conquista.
- Ranking, perfil público, página de evento e Feed usam o catálogo dinâmico para títulos públicos.
- TaiShop já comprava pelo catálogo server-side; editar preço no painel altera a cobrança real em TaiCoins.

## Limite intencional

A Central de Conteúdo não expõe IDs e tipos estruturais que conectam os sistemas entre si. Criar um novo tipo de jogo ou uma nova métrica de missão ainda exige desenvolvimento, mas alterações editoriais e grande parte dos parâmetros existentes deixam de exigir edição de código.
