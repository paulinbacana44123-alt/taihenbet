# TaihenBet 2.0 — Fase 3.8: Taigrinho autoritativo

Primeiro minigame com **resultado e pagamento decididos no Supabase/PostgreSQL**.

## O que mudou

- `play_taigrinho(p_stake)` virou a única rota normal de um giro real do Taigrinho.
- A entrada é debitada no banco antes do sorteio.
- A grade 5×3 final é criada no servidor.
- As 5 paylines são avaliadas no servidor com a mesma tabela de pagamentos do site.
- O prêmio é calculado e creditado dentro da mesma transação SQL.
- A rodada é gravada em `public.game_rounds` para auditoria.
- `wallet_transactions` continua registrando `game_stake` e, quando houver prêmio, `game_payout` com o mesmo `external_id`/id da rodada.
- O frontend recebe uma rodada já liquidada e apenas anima a grade devolvida pelo servidor.
- O saldo exibido durante a animação mostra somente o valor após a entrada; ao terminar, o perfil final devolvido pelo servidor é aplicado.
- `credit_game_payout()` agora rejeita tentativas de liquidar manualmente uma entrada marcada como `Taigrinho`.
- Os botões de desenvolvimento continuam sendo somente testes visuais e não alteram saldo.

## O que deixou de acontecer no navegador

O cliente não possui mais a função que decide a grade final vencedora/perdedora do Taigrinho. O RNG local que permanece no componente é usado apenas para os símbolos temporários enquanto os rolos estão visualmente girando.

## Auditoria

Depois de um giro real, confira:

```sql
select
  id,
  user_id,
  game,
  stake,
  payout,
  multiplier,
  balance_after_stake,
  balance_after,
  created_at,
  result
from public.game_rounds
where game = 'taigrinho'
order by created_at desc
limit 10;
```

E no ledger:

```sql
select
  kind,
  amount,
  balance_after,
  external_id,
  metadata,
  created_at
from public.wallet_transactions
where metadata ->> 'game' = 'Taigrinho'
order by created_at desc
limit 20;
```

Para uma vitória, o mesmo `external_id` deve aparecer em duas linhas: `game_stake` negativo e `game_payout` positivo.

## Segurança / limite honesto

Isso torna o **Taigrinho autoritativo para a economia**: DevTools não escolhe grade, multiplicador nem payout. Ainda não é um sistema de "provably fair" criptográfico — o PostgreSQL usa RNG do servidor e este é um projeto fictício sem dinheiro real.

TaiMandioca, Crash do Regime e Derby ainda usam o fluxo híbrido da Fase 3.7 e serão migrados separadamente.

## Instalação

1. Aplique sobre a Fase 3.7.1.
2. Execute `supabase/phase3_8_authoritative_taigrinho.sql` inteiro no SQL Editor do Supabase.
3. Só depois substitua os arquivos de `src` deste patch por cima do projeto.
4. Reinicie `npm run dev` se o Vite já estiver aberto.
