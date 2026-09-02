# TaihenBet 2.0 — Fase 1: New Model Update

## O que mudou
- Nova paleta global: preto/vinho + rosa + creme + dourado + marrom.
- Header atualizado para a nova identidade.
- TaiCoins ganharam tratamento dourado.
- Home redesenhada com o novo modelo da Taihen.
- Novo selo "TAIHENBET 2.0 · NOVA ERA".
- Nova faixa de status da sessão Ao Vivo na Home (usa o estado que já existia).
- Novo placar da banca: jogos, clubes, R$ 0 e decisões ruins infinitas.
- Preview do Museu e apostas esportivas receberam a nova identidade.
- Entidade/Neytai, TaiMandioca e Ditadora foram atualizados com os novos assets.
- O acervo antigo do Museu não foi sobrescrito de propósito.

## Arquivo principal do novo tema
`src/TaihenTheme2026.css`

Ele é importado por último em `src/App.jsx`, então funciona como camada visual da versão 2.0 sem destruir os CSS antigos.

## Como rodar
1. Abra a pasta no terminal.
2. Rode `npm install`.
3. Rode `npm run dev`.

## Observação
O ZIP não inclui `node_modules` nem o `dist` antigo. Isso é intencional: instale as dependências localmente para gerar os binários corretos do seu sistema.

## Próxima fase planejada
- Refinar Jogos / TaiMandioca / Taigrinho / Crash.
- Atualizar Museu por eras.
- Atualizar Ranking / Histórico / Para a Tai / Painel.
- Depois: Supabase Auth + PostgreSQL + Realtime + permissões de admin.
