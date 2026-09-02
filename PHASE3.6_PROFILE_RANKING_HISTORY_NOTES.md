# TaihenBet 2.0 — Fase 3.6

## O que entrou

- Hotfix do header: navegação + saldo + conta ficam em uma linha em resoluções desktop menores.
- Meu Perfil ganhou ficha completa: data de entrada, patente, patrimônio, V/D, quantidade de registros, total colocado em risco e lucro/prejuízo registrado.
- Histórico passou a ser por conta e persistido no Supabase.
- Migração única do histórico antigo do `localStorage`, no mesmo estilo da auditoria de saldo legado.
- Ranking agora consulta contas reais através de `get_public_ranking()`.
- Ranking não expõe e-mail nem histórico detalhado; recebe apenas estatísticas agregadas.
- Histórico ganhou abas para apostas esportivas, jogos da entidade e visão combinada.

## Ordem de instalação

1. No Supabase, abra **SQL Editor > New query**.
2. Rode o arquivo inteiro `supabase/phase3_6_history_ranking.sql`.
3. O resultado esperado é `Success. No rows returned`.
4. Extraia este patch por cima do projeto atual e substitua os arquivos.
5. Reinicie `npm run dev` se o Vite não atualizar sozinho.

## Primeiro login depois da Fase 3.6

Se o navegador ainda possuir apostas/jogos da época anterior às contas, aparecerá a tela **Auditoria de provas antigas**.

- **Importar meu histórico antigo**: associa esses registros à conta atual e remove o arquivo legado global do navegador.
- **Começar com ficha limpa**: a conta começa vazia e o arquivo legado fica intacto, caso pertença a outra conta.

A decisão é registrada uma única vez por conta.

## Testes recomendados

1. Entre na conta admin e confira `Meu perfil`.
2. Abra `Histórico` e confirme que há as abas Tudo / Apostas esportivas / Jogos da entidade.
3. Faça uma partida ou aposta e espere ~1 segundo.
4. Recarregue a página: o registro deve continuar lá.
5. Abra o site em outro navegador, entre na mesma conta e confirme que o histórico aparece.
6. Crie/entre em outra conta: ela deve ter histórico separado.
7. Abra `Ranking`: as contas reais devem aparecer com saldo e estatísticas próprias.

## Verificação opcional no SQL Editor

```sql
select * from public.get_public_ranking();
```

Para conferir somente o arquivo da conta atualmente autenticada, o Dashboard SQL Editor não possui a mesma sessão do navegador; use o app para esse teste.

## Observação de segurança

A Fase 3.6 torna saldo/histórico **persistentes e multiusuário**, mas o cálculo dos minijogos ainda nasce no frontend e a ponte `sync_my_balance`/`sync_my_history` ainda aceita o estado calculado pelo cliente. Isso é suficiente para o projeto hobby atual, mas não é um sistema competitivo à prova de trapaça.

A próxima etapa técnica ideal é mover saldo, pagamentos, apostas e resultados para funções autoritativas no backend antes de tratar o Ranking como competitivo.
