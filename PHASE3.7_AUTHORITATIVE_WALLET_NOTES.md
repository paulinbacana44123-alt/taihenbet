# TaihenBet 2.0 — Fase 3.7

## Carteira autoritativa

- O navegador não usa mais `sync_my_balance` para escrever qualquer saldo que quiser.
- Débitos são atômicos no Postgres e falham se o saldo não for suficiente.
- Recompensa de anúncio é fixa (+20) e possui cooldown no servidor.
- Bônus diário é fixo (+250) e só pode ser recebido uma vez por dia no servidor.
- Entradas de jogos/apostas ganham um `external_id` e pagamentos só podem ocorrer ligados à entrada correspondente.
- Pagamentos são idempotentes: o mesmo jogo/aposta não pode pagar duas vezes.
- Existe `wallet_transactions` como ledger auditável por usuário.
- Ajustes administrativos exigem `role = admin` e também ficam registrados.

## Limite desta fase

A carteira deixou de aceitar saldo arbitrário, mas os minigames ainda calculam o resultado visual no cliente. O banco valida vínculo, duplicidade e teto do pagamento. A próxima fase deve mover a RNG/resultado de cada minigame para rotinas autoritativas específicas.

## Instalação

1. Execute `supabase/phase3_7_authoritative_wallet.sql` no SQL Editor.
2. Depois substitua a pasta `src` pela deste patch.
3. Reinicie `npm run dev`.
