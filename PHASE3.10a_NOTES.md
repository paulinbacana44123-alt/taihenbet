# TaihenBet 2.0 — Fase 3.10a

## Saldo em tempo real

A aplicação agora observa `UPDATE` do perfil da conta autenticada através do Supabase Realtime.
Quando uma função autoritativa altera `profiles.balance` — por exemplo payout esportivo, payout de minigame, anúncio, ou ajuste administrativo — o React recebe a nova linha e atualiza:

- `profile`;
- `saldoAtualRef`;
- `saldo` exibido no header.

## Fallback

Eventos `focus` e `visibilitychange` fazem uma leitura do próprio perfil quando o usuário retorna à aba. Isso cobre casos de perda temporária do WebSocket.

## Segurança

O SQL apenas adiciona `public.profiles` ao publication `supabase_realtime` se ainda não estiver lá. As políticas RLS da Fase 3.9 continuam sendo a barreira de acesso.
