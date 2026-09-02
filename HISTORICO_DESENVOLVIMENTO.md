# HistÃƒÂ³rico de Desenvolvimento Ã¢â‚¬â€ TaihenBet 2.0

Este documento consolida as anotaÃƒÂ§ÃƒÂµes de desenvolvimento que antes ficavam espalhadas em arquivos `PHASE*.md` na raiz do projeto.

> Os textos abaixo foram preservados a partir dos arquivos originais. A ordem segue a numeraÃƒÂ§ÃƒÂ£o das fases sempre que ela pÃƒÂ´de ser identificada pelo nome do arquivo.

---

## PHASE2_GAMES_NOTES

> Arquivo original: `PHASE2_GAMES_NOTES.md`

# TaihenBet 2.0 â€” Fase 2: Jogos

Patch incremental feito sobre a Fase 1.1.

## TaiMandioca 2.0
- Identidade de "Safra 2026".
- Tabuleiro com visual mais terroso/vinho e detalhes creme/rosa.
- TaiMandiocas seguras destacadas em rosa/dourado.
- Mandioca normal continua sendo o perigo vermelho.
- ConfiguraÃ§Ã£o, botÃµes, histÃ³rico e comunicado do orÃ¡culo foram integrados Ã  paleta 2026.

## Taigrinho 2.0
- MÃ¡quina redesenhada em rosa, vinho e dourado.
- SÃ­mbolo principal "Tai" usa o modelo oficial 2026.
- Jackpot e vitÃ³rias receberam destaque dourado.
- BotÃ£o GIRAR agora segue a nova identidade rosa/cereja.
- Tabela de pagamentos e painel lateral foram reestilizados.

## Crash do Novo Regime
- GrÃ¡fico agora usa cereja -> rosa -> dourado.
- Interface em vinho/preto/ouro para combinar com a Ditadora Suprema.
- Imagem da Comandante ganhou enquadramento e acabamento mais dramÃ¡ticos.
- Controles, status, cards laterais e overlays seguem a nova paleta.
- Texto de palco alterado para "DITADORA SUPREMA DA BANCA".

## Taihen Derby
- MantÃ©m mecÃ¢nica e personalidade originais.
- Rosa/vinho/dourado substituem a predominÃ¢ncia roxa.
- Cards, seleÃ§Ã£o e pista agora conversam com o restante da TaihenBet 2.0.

## CatÃ¡logo de jogos
Cada jogo recebeu uma assinatura visual prÃ³pria:
- TaiMandioca: marrom + creme + rosa.
- Taigrinho: rosa + dourado.
- Crash: vinho + dourado.
- Derby: rosa suave + dourado.

## InstalaÃ§Ã£o
Extraia este ZIP por cima do projeto que jÃ¡ estÃ¡ com a Fase 1.1 e aceite substituir os arquivos.

Arquivos alterados:
- `src/components/GamesPage.jsx`
- `src/TaihenTheme2026.css`

O Vite em modo dev deve atualizar automaticamente apÃ³s a substituiÃ§Ã£o.

---

## PHASE2.1_GAMES_NOTES

> Arquivo original: `PHASE2.1_GAMES_NOTES.md`

# TaihenBet 2.0 â€” Fase 2.1 (acabamento dos jogos)

Patch incremental para aplicar **depois da Fase 2 â€” Games**.

## Ajustes

- **TaiMandioca**: estado inicial da roÃ§a compactado. As 25 casas deixam de ocupar espaÃ§o quando nenhuma colheita estÃ¡ ativa; o painel de espera fica mais central e legÃ­vel.
- **Crash do Novo Regime**: grade mais visÃ­vel e novo comunicado ocioso `PROTOCOLO 00` enquanto a operaÃ§Ã£o nÃ£o comeÃ§ou.
- **Taihen Derby**: removidos os principais resquÃ­cios roxos do bilhete; botÃ£o de iniciar corrida, controles, resumo e overlays agora seguem rosa/vinho/dourado da identidade 2026.
- Pequenos ajustes de contraste e hover.

## InstalaÃ§Ã£o

Extraia este ZIP na raiz do projeto e permita substituir os arquivos existentes.

Com `npm run dev` jÃ¡ aberto, o Vite deve recarregar automaticamente.

---

## PHASE3_AUTH_NOTES

> Arquivo original: `PHASE3_AUTH_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.0: AutenticaÃ§Ã£o

Este patch adiciona a primeira camada da TaihenBet Online:

- botÃ£o Entrar / Criar conta no header;
- cadastro com nome, e-mail e senha;
- login com Supabase Auth;
- sessÃ£o persistente;
- menu da conta no header;
- logout;
- feedback para confirmaÃ§Ã£o de e-mail e erros comuns.

## Antes de testar

O projeto precisa ter:

```bash
npm install @supabase/supabase-js
```

E um `.env` na raiz (NÃƒO estÃ¡ incluso neste patch):

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Depois de alterar `.env`, reinicie `npm run dev`.

## ObservaÃ§Ã£o

Esta fase autentica a conta, mas AINDA NÃƒO move TaiCoins, histÃ³rico ou ranking para o banco. O saldo continua local por enquanto. Isso serÃ¡ feito nas prÃ³ximas fases para evitar migrar toda a economia de uma vez.

---

## PHASE3.1_HUMAN_NOTES

> Arquivo original: `PHASE3.1_HUMAN_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.1: Human Checkâ„¢

Patch cumulativo sobre a Fase 3 AUTH.

## Adicionado
- CAPTCHA cÃ´mico exclusivo da TaihenBet no cadastro.
- Caixa â€œNÃ£o sou uma mandiocaâ€.
- Desafio aleatÃ³rio de mÃºltipla escolha.
- Respostas erradas trocam o desafio e geram mensagens absurdas.
- Cadastro bloqueado atÃ© a humanidade ser aprovada.
- Feedback de aprovaÃ§Ã£o: â€œinteligÃªncia suficiente para perder TaiCoinsâ€.

## ObservaÃ§Ã£o de seguranÃ§a
Esse Human Check Ã© propositalmente uma camada de entretenimento/UI, nÃ£o uma defesa anti-bot real. Quando a aplicaÃ§Ã£o for publicada, uma proteÃ§Ã£o real (por exemplo, Turnstile) pode ser adicionada por trÃ¡s sem remover essa interface.

## AplicaÃ§Ã£o
Este ZIP jÃ¡ contÃ©m os arquivos da Fase 3 AUTH + Human Check, entÃ£o pode ser extraÃ­do por cima do projeto atual. O arquivo .env nÃ£o Ã© incluÃ­do.

---

## PHASE3.2_PASSWORD_NOTES

> Arquivo original: `PHASE3.2_PASSWORD_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.2: Detector de Senha Vergonhosa

- Bloqueia localmente algumas senhas extremamente previsÃ­veis no cadastro.
- Exibe a piada â€œO usuÃ¡rio X jÃ¡ possui esta senhaâ€ com nomes fictÃ­cios.
- NÃ£o consulta, compara nem revela senhas reais de outros usuÃ¡rios.
- O botÃ£o de cadastro permanece bloqueado enquanto a senha estiver na lista de senhas fracas.
- Patch cumulativo: inclui autenticaÃ§Ã£o e Human Check das fases 3.0/3.1.

---

## PHASE3.3_LINGUICA_NOTES

> Arquivo original: `PHASE3.3_LINGUICA_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.3: Auditoria da LinguiÃ§a

- Adiciona no cadastro a pergunta obrigatÃ³ria â€œQual o tamanho da sua linguiÃ§a?â€.
- Na primeira medida vÃ¡lida informada, a banca alega que um usuÃ¡rio fictÃ­cio jÃ¡ possui exatamente aquele tamanho.
- O usuÃ¡rio precisa escolher outro valor para passar na auditoria.
- O valor NÃƒO Ã© enviado ao Supabase, NÃƒO Ã© salvo e NÃƒO entra nos metadados da conta.
- A funcionalidade Ã© apenas uma piada local de interface.

---

## PHASE3.4_PROFILE_WALLET_NOTES

> Arquivo original: `PHASE3.4_PROFILE_WALLET_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.4: Perfil + TaiCoins persistentes

## Antes de copiar o patch
1. Abra o Supabase > SQL Editor > New query.
2. Cole TODO o conteÃºdo de `supabase/phase3_4_profiles_wallet.sql`.
3. Clique em Run.
4. Se quiser que sua conta tenha o Painel em produÃ§Ã£o, rode tambÃ©m `supabase/make_me_admin.sql` depois de trocar `SEU_EMAIL_AQUI` pelo seu e-mail.

## Depois
Copie o patch por cima do projeto e reinicie `npm run dev`.

Na primeira entrada de cada conta, a banca pergunta se deve importar o saldo antigo do navegador ou comeÃ§ar com 1.000 TaiCoins.

## O que entrou
- Tabela `profiles` ligada ao Supabase Auth.
- Username e avatar persistentes.
- 4 avatares internos: Taihen 2026, TaiMandioca, Ditadora Suprema e Entidade da Banca.
- TaiCoins carregadas do banco ao entrar e sincronizadas durante o uso.
- MigraÃ§Ã£o Ãºnica do saldo antigo do localStorage.
- Menu de conta com patrimÃ´nio + botÃ£o "Editar meu perfil".
- Em produÃ§Ã£o, a aba Painel sÃ³ aparece para `role = admin`.
- RLS e privilÃ©gios de coluna impedem UPDATE direto de `balance` e `role` na tabela.

## ObservaÃ§Ã£o importante de integridade
O dinheiro Ã© fictÃ­cio e o projeto ainda calcula os jogos no navegador. A funÃ§Ã£o `sync_my_balance` Ã© uma ponte de migraÃ§Ã£o para persistÃªncia, nÃ£o um sistema anti-cheat definitivo. Antes de colocar um ranking competitivo pÃºblico, mova sorteios, pagamentos e recompensas para funÃ§Ãµes/servidor autoritativos e remova essa ponte.

---

## PHASE3.4.1_ADMIN_GUARD_NOTES

> Arquivo original: `PHASE3.4.1_ADMIN_GUARD_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.4.1

Hotfix do controle de acesso ao Painel.

## MudanÃ§a
- Remove o bypass `import.meta.env.DEV` do acesso administrativo.
- Agora, inclusive no localhost, somente perfis com `role = 'admin'` veem e acessam o Painel.
- O bloco de ferramentas visuais de desenvolvimento continua condicionado a `import.meta.env.DEV`, mas sÃ³ pode ser alcanÃ§ado depois que a conta passa pelo guard de admin.

## Teste esperado
1. Entre com uma conta `role = 'user'`: a aba Painel nÃ£o deve aparecer.
2. Entre com a conta `role = 'admin'`: a aba Painel deve aparecer normalmente.

## SeguranÃ§a
Esconder a interface no React nÃ£o substitui autorizaÃ§Ã£o no banco. Quando as operaÃ§Ãµes administrativas forem ligadas ao Supabase, cada escrita administrativa tambÃ©m deverÃ¡ validar a role no servidor/RLS/RPC.

---

## PHASE3.5_PASSWORD_RECOVERY_NOTES

> Arquivo original: `PHASE3.5_PASSWORD_RECOVERY_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.5: RecuperaÃ§Ã£o de senha

Patch incremental para aplicar por cima da Fase 3.4.1.

## O que entrou

- Link **Esqueceu sua senha?** no login.
- Envio do e-mail oficial de recuperaÃ§Ã£o com `supabase.auth.resetPasswordForEmail()`.
- DetecÃ§Ã£o do evento `PASSWORD_RECOVERY` quando o usuÃ¡rio volta pelo link do e-mail.
- Tela obrigatÃ³ria de nova senha.
- ConfirmaÃ§Ã£o da nova senha.
- Detector de senha vergonhosa tambÃ©m funciona na recuperaÃ§Ã£o.
- O aviso inicial da TaihenBet nÃ£o cobre a tela de recuperaÃ§Ã£o quando o usuÃ¡rio volta pelo link.
- A role do perfil (`admin`, `user`, etc.) nÃ£o Ã© alterada ao trocar a senha.

## InstalaÃ§Ã£o

1. Extraia o patch por cima do projeto atual e substitua os arquivos.
2. NÃ£o hÃ¡ SQL novo.
3. NÃ£o hÃ¡ pacote npm novo.
4. Reinicie o Vite se necessÃ¡rio: `npm run dev`.

## Supabase â€” URL de redirecionamento

Em **Authentication > URL Configuration**, confirme que a URL usada para testar estÃ¡ permitida. Para desenvolvimento:

`http://localhost:5173`

Quando publicar, adicione tambÃ©m a URL real do Vercel.

## Teste recomendado

1. Saia da conta admin.
2. Abra **Entrar**.
3. Clique em **Esqueceu sua senha?**.
4. Digite o e-mail da conta admin.
5. Abra o e-mail recebido e clique no link.
6. A TaihenBet deve abrir diretamente em **Escolha uma nova senha vergonhosa**.
7. Teste uma senha fraca como `123456` para conferir a piada.
8. Escolha uma senha nova vÃ¡lida e confirme.
9. Saia da conta e entre novamente usando a nova senha.
10. A conta deve continuar com `role = admin` e com o mesmo saldo/perfil.

## Template opcional do e-mail

No Supabase, abra **Authentication > Emails > Templates > Reset Password** (o nome pode aparecer como Recovery) e use:

**Assunto:** `ðŸ” A banca recebeu um pedido de amnÃ©sia`

O HTML pronto estÃ¡ em `supabase/password_recovery_email.html`.

NÃ£o altere a variÃ¡vel `{{ .ConfirmationURL }}` do botÃ£o.

---

## PHASE3.6_PROFILE_RANKING_HISTORY_NOTES

> Arquivo original: `PHASE3.6_PROFILE_RANKING_HISTORY_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.6

## O que entrou

- Hotfix do header: navegaÃ§Ã£o + saldo + conta ficam em uma linha em resoluÃ§Ãµes desktop menores.
- Meu Perfil ganhou ficha completa: data de entrada, patente, patrimÃ´nio, V/D, quantidade de registros, total colocado em risco e lucro/prejuÃ­zo registrado.
- HistÃ³rico passou a ser por conta e persistido no Supabase.
- MigraÃ§Ã£o Ãºnica do histÃ³rico antigo do `localStorage`, no mesmo estilo da auditoria de saldo legado.
- Ranking agora consulta contas reais atravÃ©s de `get_public_ranking()`.
- Ranking nÃ£o expÃµe e-mail nem histÃ³rico detalhado; recebe apenas estatÃ­sticas agregadas.
- HistÃ³rico ganhou abas para apostas esportivas, jogos da entidade e visÃ£o combinada.

## Ordem de instalaÃ§Ã£o

1. No Supabase, abra **SQL Editor > New query**.
2. Rode o arquivo inteiro `supabase/phase3_6_history_ranking.sql`.
3. O resultado esperado Ã© `Success. No rows returned`.
4. Extraia este patch por cima do projeto atual e substitua os arquivos.
5. Reinicie `npm run dev` se o Vite nÃ£o atualizar sozinho.

## Primeiro login depois da Fase 3.6

Se o navegador ainda possuir apostas/jogos da Ã©poca anterior Ã s contas, aparecerÃ¡ a tela **Auditoria de provas antigas**.

- **Importar meu histÃ³rico antigo**: associa esses registros Ã  conta atual e remove o arquivo legado global do navegador.
- **ComeÃ§ar com ficha limpa**: a conta comeÃ§a vazia e o arquivo legado fica intacto, caso pertenÃ§a a outra conta.

A decisÃ£o Ã© registrada uma Ãºnica vez por conta.

## Testes recomendados

1. Entre na conta admin e confira `Meu perfil`.
2. Abra `HistÃ³rico` e confirme que hÃ¡ as abas Tudo / Apostas esportivas / Jogos da entidade.
3. FaÃ§a uma partida ou aposta e espere ~1 segundo.
4. Recarregue a pÃ¡gina: o registro deve continuar lÃ¡.
5. Abra o site em outro navegador, entre na mesma conta e confirme que o histÃ³rico aparece.
6. Crie/entre em outra conta: ela deve ter histÃ³rico separado.
7. Abra `Ranking`: as contas reais devem aparecer com saldo e estatÃ­sticas prÃ³prias.

## VerificaÃ§Ã£o opcional no SQL Editor

```sql
select * from public.get_public_ranking();
```

Para conferir somente o arquivo da conta atualmente autenticada, o Dashboard SQL Editor nÃ£o possui a mesma sessÃ£o do navegador; use o app para esse teste.

## ObservaÃ§Ã£o de seguranÃ§a

A Fase 3.6 torna saldo/histÃ³rico **persistentes e multiusuÃ¡rio**, mas o cÃ¡lculo dos minijogos ainda nasce no frontend e a ponte `sync_my_balance`/`sync_my_history` ainda aceita o estado calculado pelo cliente. Isso Ã© suficiente para o projeto hobby atual, mas nÃ£o Ã© um sistema competitivo Ã  prova de trapaÃ§a.

A prÃ³xima etapa tÃ©cnica ideal Ã© mover saldo, pagamentos, apostas e resultados para funÃ§Ãµes autoritativas no backend antes de tratar o Ranking como competitivo.

---

## PHASE3.6.1_PROFILE_POLISH_NOTES

> Arquivo original: `PHASE3.6.1_PROFILE_POLISH_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.6.1: Profile Polish

Hotfix visual para aplicar **por cima da Fase 3.6**.

## O que mudou

- O modal de **Meu Perfil** agora respeita a altura real da janela (`100dvh`).
- Em desktop, a coluna de identidade e o editor tÃªm rolagem interna independente, evitando tÃ­tulo/botÃµes cortados em telas de 768p ou menores.
- Em telas baixas, avatar e espaÃ§amentos ficam automaticamente mais compactos.
- Em mobile, o modal volta para uma Ãºnica rolagem contÃ­nua.
- O e-mail deixou de ficar exposto na coluna principal do perfil.
- O UUID deixou de ocupar espaÃ§o no visual normal.
- Agora existe um cartÃ£o **Identidade vinculada / E-mail confirmado pela banca**.
- E-mail e UUID continuam acessÃ­veis em **Ver dados tÃ©cnicos da conta**, recolhido por padrÃ£o.
- Nenhuma alteraÃ§Ã£o de banco de dados, RLS, carteira, ranking ou histÃ³rico.

## Como aplicar

Copie a pasta `src` deste patch por cima da pasta `src` do projeto e permita substituir os arquivos existentes.

NÃ£o Ã© necessÃ¡rio rodar SQL nem instalar pacote novo.

Se o Vite estiver aberto, normalmente ele atualiza sozinho. Se preferir, reinicie com:

```bash
npm run dev
```

## Teste rÃ¡pido

1. Entre na conta.
2. Abra **Meu Perfil**.
3. Confirme que o topo `Meu perfil` aparece inteiro.
4. Role apenas a parte direita e confirme que o modal continua dentro da tela.
5. Abra **Ver dados tÃ©cnicos da conta** para conferir e-mail/ID.
6. Teste salvar username/avatar normalmente.

---

## PHASE3.7_AUTHORITATIVE_WALLET_NOTES

> Arquivo original: `PHASE3.7_AUTHORITATIVE_WALLET_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.7

## Carteira autoritativa

- O navegador nÃ£o usa mais `sync_my_balance` para escrever qualquer saldo que quiser.
- DÃ©bitos sÃ£o atÃ´micos no Postgres e falham se o saldo nÃ£o for suficiente.
- Recompensa de anÃºncio Ã© fixa (+20) e possui cooldown no servidor.
- BÃ´nus diÃ¡rio Ã© fixo (+250) e sÃ³ pode ser recebido uma vez por dia no servidor.
- Entradas de jogos/apostas ganham um `external_id` e pagamentos sÃ³ podem ocorrer ligados Ã  entrada correspondente.
- Pagamentos sÃ£o idempotentes: o mesmo jogo/aposta nÃ£o pode pagar duas vezes.
- Existe `wallet_transactions` como ledger auditÃ¡vel por usuÃ¡rio.
- Ajustes administrativos exigem `role = admin` e tambÃ©m ficam registrados.

## Limite desta fase

A carteira deixou de aceitar saldo arbitrÃ¡rio, mas os minigames ainda calculam o resultado visual no cliente. O banco valida vÃ­nculo, duplicidade e teto do pagamento. A prÃ³xima fase deve mover a RNG/resultado de cada minigame para rotinas autoritativas especÃ­ficas.

## InstalaÃ§Ã£o

1. Execute `supabase/phase3_7_authoritative_wallet.sql` no SQL Editor.
2. Depois substitua a pasta `src` pela deste patch.
3. Reinicie `npm run dev`.

---

## PHASE3.7.1_ADMIN_WALLET_NOTES

> Arquivo original: `PHASE3.7.1_ADMIN_WALLET_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.7.1: Tesouraria administrativa

Pequeno complemento da Fase 3.7.

## O que entra

- Nova aba **Carteiras** no Painel da banca.
- Lista as contas reais de `public.profiles`.
- Admin escolhe uma conta e informa o **saldo final desejado**.
- O frontend calcula somente a diferenÃ§a e chama `admin_adjust_wallet()`.
- Todo ajuste gera `kind = admin_adjustment` em `wallet_transactions`.
- NÃ£o hÃ¡ ediÃ§Ã£o direta de `profiles.balance` pelo navegador.
- ConfirmaÃ§Ã£o mostra saldo anterior, diferenÃ§a e saldo final.
- Campo de motivo Ã© gravado no metadata do ledger.

## Para restaurar a Paulin apÃ³s os testes

No estado observado apÃ³s os testes, a conta estava em 1,2 T. Para voltar ao saldo que existia antes dos giros extras de validaÃ§Ã£o, abra:

Painel â†’ Carteiras â†’ Paulin

E informe **508,7** em "Saldo final desejado".

A funÃ§Ã£o administrativa deve gerar aproximadamente:

- `admin_adjustment`: `+507,50`
- `balance_after`: `508,70`

## InstalaÃ§Ã£o

Aplicar sobre a Fase 3.7. NÃ£o hÃ¡ SQL novo: a RPC `admin_adjust_wallet()` jÃ¡ foi criada em `phase3_7_authoritative_wallet.sql`.

---

## PHASE3.8_AUTHORITATIVE_TAIGRINHO_NOTES

> Arquivo original: `PHASE3.8_AUTHORITATIVE_TAIGRINHO_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.8: Taigrinho autoritativo

Primeiro minigame com **resultado e pagamento decididos no Supabase/PostgreSQL**.

## O que mudou

- `play_taigrinho(p_stake)` virou a Ãºnica rota normal de um giro real do Taigrinho.
- A entrada Ã© debitada no banco antes do sorteio.
- A grade 5Ã—3 final Ã© criada no servidor.
- As 5 paylines sÃ£o avaliadas no servidor com a mesma tabela de pagamentos do site.
- O prÃªmio Ã© calculado e creditado dentro da mesma transaÃ§Ã£o SQL.
- A rodada Ã© gravada em `public.game_rounds` para auditoria.
- `wallet_transactions` continua registrando `game_stake` e, quando houver prÃªmio, `game_payout` com o mesmo `external_id`/id da rodada.
- O frontend recebe uma rodada jÃ¡ liquidada e apenas anima a grade devolvida pelo servidor.
- O saldo exibido durante a animaÃ§Ã£o mostra somente o valor apÃ³s a entrada; ao terminar, o perfil final devolvido pelo servidor Ã© aplicado.
- `credit_game_payout()` agora rejeita tentativas de liquidar manualmente uma entrada marcada como `Taigrinho`.
- Os botÃµes de desenvolvimento continuam sendo somente testes visuais e nÃ£o alteram saldo.

## O que deixou de acontecer no navegador

O cliente nÃ£o possui mais a funÃ§Ã£o que decide a grade final vencedora/perdedora do Taigrinho. O RNG local que permanece no componente Ã© usado apenas para os sÃ­mbolos temporÃ¡rios enquanto os rolos estÃ£o visualmente girando.

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

Para uma vitÃ³ria, o mesmo `external_id` deve aparecer em duas linhas: `game_stake` negativo e `game_payout` positivo.

## SeguranÃ§a / limite honesto

Isso torna o **Taigrinho autoritativo para a economia**: DevTools nÃ£o escolhe grade, multiplicador nem payout. Ainda nÃ£o Ã© um sistema de "provably fair" criptogrÃ¡fico â€” o PostgreSQL usa RNG do servidor e este Ã© um projeto fictÃ­cio sem dinheiro real.

TaiMandioca, Crash do Regime e Derby ainda usam o fluxo hÃ­brido da Fase 3.7 e serÃ£o migrados separadamente.

## InstalaÃ§Ã£o

1. Aplique sobre a Fase 3.7.1.
2. Execute `supabase/phase3_8_authoritative_taigrinho.sql` inteiro no SQL Editor do Supabase.
3. SÃ³ depois substitua os arquivos de `src` deste patch por cima do projeto.
4. Reinicie `npm run dev` se o Vite jÃ¡ estiver aberto.

---

## PHASE3.8.1_AUTHORITATIVE_TAIMANDIOCA_NOTES

> Arquivo original: `PHASE3.8.1_AUTHORITATIVE_TAIMANDIOCA_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.8.1

## TaiMandioca autoritativa

Esta fase move o tabuleiro secreto da TaiMandioca para o PostgreSQL/Supabase.

### O navegador NÃƒO recebe mais

- a lista de posiÃ§Ãµes das mandiocas normais;
- o sorteio do tabuleiro;
- autoridade para decidir vitÃ³ria/derrota;
- autoridade para calcular ou creditar o prÃªmio.

### RPCs novas

- `start_taimandioca(stake, hazards)` â€” debita e cria uma sessÃ£o secreta;
- `reveal_taimandioca(session_id, index)` â€” revela somente a casa pedida;
- `cashout_taimandioca(session_id)` â€” calcula e paga o cashout no servidor;
- `get_active_taimandioca()` â€” restaura uma sessÃ£o ativa apÃ³s F5.

### Tabela privada

`public.taimandioca_sessions`

Ela guarda `hazard_indices`, mas nÃ£o concede `SELECT` para `authenticated`. A aplicaÃ§Ã£o sÃ³ enxerga o estado pÃºblico devolvido pelas RPCs.

### Auditoria

Quando a colheita termina, a rodada tambÃ©m Ã© gravada em `public.game_rounds` com `game = 'taimandioca'`.

O ledger usa o mesmo UUID da sessÃ£o para:

- `game_stake` negativo;
- `game_payout` positivo, quando houver.

### ProteÃ§Ã£o adicional

`credit_game_payout()` passa a rejeitar pagamentos manuais tanto do Taigrinho quanto da TaiMandioca. Os dois jogos agora liquidam seus prÃ³prios resultados no servidor.

### PersistÃªncia

Uma colheita ativa sobrevive a F5. Ao voltar para a pÃ¡gina de Jogos, o frontend consulta `get_active_taimandioca()` e reconstrÃ³i apenas as casas jÃ¡ reveladas â€” nunca o tabuleiro secreto.

---

## PHASE3.8.1a_NOTES

> Arquivo original: `PHASE3.8.1a_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.8.1a

Hotfix de ciclo de vida da sessÃ£o secreta da TaiMandioca.

A Fase 3.8.1 jÃ¡ restringia `get_active_taimandioca()` a `status = 'active'`, e o Ã­ndice exclusivo tambÃ©m sÃ³ considerava sessÃµes ativas. Portanto, uma linha `cashout/lost/perfect` antiga nÃ£o bloqueava uma nova partida.

O problema era outro: `taimandioca_sessions` continuava retendo `hazard_indices` apÃ³s a liquidaÃ§Ã£o. Como o resultado definitivo jÃ¡ Ã© persistido em `game_rounds` e a movimentaÃ§Ã£o financeira em `wallet_transactions`, manter o mapa secreto nÃ£o traz benefÃ­cio.

A 3.8.1a passa a excluir a sessÃ£o secreta depois de `lost`, `cashout` ou `perfect`, apenas depois de registrar a rodada e montar a resposta pÃºblica para o cliente.

---

## PHASE3.8.2_AUTHORITATIVE_CRASH_NOTES

> Arquivo original: `PHASE3.8.2_AUTHORITATIVE_CRASH_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.8.2 â€” Crash do Regime autoritativo

## Objetivo

Mover o resultado financeiro e o ponto de crash do **Crash do Regime** para o PostgreSQL/Supabase. O React continua responsÃ¡vel pela animaÃ§Ã£o, som e grÃ¡fico, mas deixa de decidir se uma retirada foi vÃ¡lida.

## Nova sessÃ£o privada

A tabela `public.crash_regime_sessions` armazena:

- id da rodada;
- usuÃ¡rio;
- entrada;
- ponto secreto de confisco;
- horÃ¡rio de inÃ­cio do servidor;
- estado da operaÃ§Ã£o;
- payout/multiplicador final;
- saldos pÃ³s-entrada e pÃ³s-liquidaÃ§Ã£o.

A tabela tem RLS habilitada e `anon`/`authenticated` nÃ£o possuem `SELECT` direto. O ponto de confisco Ã© acessado somente pelas funÃ§Ãµes `SECURITY DEFINER`.

## RPCs

### `start_crash_regime(p_stake)`

- valida a entrada;
- impede duas operaÃ§Ãµes ativas simultÃ¢neas para a mesma conta;
- debita a carteira por `_wallet_apply`;
- gera e sela o ponto de crash no servidor;
- inicia o relÃ³gio **depois** da confirmaÃ§Ã£o do dÃ©bito;
- retorna apenas o estado pÃºblico.

### `get_crash_regime(p_session_id)`

- usa `clock_timestamp()` do servidor;
- calcula o multiplicador pela diferenÃ§a entre `started_at` e o relÃ³gio do banco;
- se o ponto secreto jÃ¡ tiver sido atingido, liquida a derrota;
- enquanto a sessÃ£o estiver ativa, retorna `crashPoint: null`.

### `cashout_crash_regime(p_session_id)`

- recebe apenas o id da sessÃ£o;
- NÃƒO recebe multiplicador do navegador;
- trava a linha da sessÃ£o;
- calcula novamente o multiplicador usando o relÃ³gio do servidor;
- se o crash jÃ¡ aconteceu, registra derrota;
- caso contrÃ¡rio, credita o payout via `_wallet_apply` e encerra como `cashout`;
- Ã© idempotente para uma sessÃ£o jÃ¡ resolvida.

## Ledger e histÃ³rico

Toda operaÃ§Ã£o usa o mesmo UUID como `external_id`:

- `game_stake` na entrada;
- `game_payout` apenas se houver retirada bem-sucedida.

A rodada final tambÃ©m Ã© salva em `game_rounds` com `game = 'crash-regime'`.

## Fechamento da ponte genÃ©rica

`credit_game_payout()` passa a recusar payout genÃ©rico de:

- Taigrinho;
- TaiMandioca;
- Crash do Regime.

Assim, um cliente nÃ£o pode usar a funÃ§Ã£o de payout antiga para fabricar uma vitÃ³ria desses jogos autoritativos.

## PersistÃªncia / F5

Ao montar a pÃ¡gina de Jogos, o frontend chama `get_crash_regime(null)`.

Se existir operaÃ§Ã£o ativa:

- ela Ã© restaurada com a mesma entrada e mesmo `startedAt`;
- nÃ£o existe novo dÃ©bito;
- o grÃ¡fico Ã© reconstruÃ­do a partir do relÃ³gio retornado pelo servidor;
- o ponto secreto continua oculto.

## O que ainda Ã© visual no cliente

O React ainda calcula uma curva local para **desenhar** o multiplicador entre os polls. Isso nÃ£o possui autoridade financeira. A retirada sempre Ã© recalculada no servidor no instante em que `cashout_crash_regime()` Ã© recebido.

## Teste de seguranÃ§a principal

Enquanto `status = active`, as respostas de `start_crash_regime` e `get_crash_regime` devem conter:

- `sessionId` / `roundId`;
- `startedAt`;
- `serverNow`;
- `multiplicadorAtual`;
- `retornoAtual`;
- `crashPoint: null`.

O valor real de `crash_point` sÃ³ pode ser revelado depois que a rodada jÃ¡ estiver encerrada.

---

## PHASE3.8.2a_VISUAL_CLEANUP_NOTES

> Arquivo original: `PHASE3.8.2a_VISUAL_CLEANUP_NOTES.md`

# TaihenBet 2.0 â€” Phase 3.8.2a â€” Visual Cleanup

## Objetivo
Remover os Ãºltimos resquÃ­cios do **roxo antigo** em telas e componentes que ainda nÃ£o tinham sido adaptados Ã  nova identidade visual da TaihenBet 2.0.

## AlteraÃ§Ãµes aplicadas

### 1) Telas pÃ³s-jogo
Atualizadas as telas/resultados de:
- **TaiMandioca**
- **Taigrinho**
- **Crash do Regime**

Ajustes visuais:
- gradientes migrados para a paleta nova
- destaques roxos trocados por tons de **vinho / rosa / dourado**
- botÃµes de continuaÃ§Ã£o e coleta alinhados com a nova identidade
- cards de resultado com fundos mais quentes e consistentes

### 2) BotÃ£o do Neytai
Atualizado o botÃ£o flutuante do Neytai:
- borda
- glow
- fundo
- badge/notificaÃ§Ã£o
- avatar frame

### 3) Fundos das mensagens
Atualizados os fundos e destaques de mensagens/cards do ecossistema de jogos:
- balÃµes e painÃ©is do Neytai
- cards orÃ¡culo/comunicado
- cards laterais de apoio
- blocos de instruÃ§Ã£o/tip/progresso

## Arquivos alterados
- `src/components/GamesPage.css`
- `src/components/NeytaiAssistant.css`

## ObservaÃ§Ãµes
- Patch **somente visual**.
- NÃ£o altera regras de negÃ³cio.
- NÃ£o altera banco de dados.

---

## PHASE3.8.2c_CRASH_STABILITY_NOTES

> Arquivo original: `PHASE3.8.2c_CRASH_STABILITY_NOTES.md`

# TaihenBet 2.0 â€” Phase 3.8.2c

## Crash do Regime â€” estabilidade e cleanup

### Polling
O frontend agora consulta `get_crash_regime` a cada **500 ms**, em vez de aproximadamente 180 ms.

A curva e o multiplicador visual continuam animados localmente com `requestAnimationFrame`.
Isso reduz bastante o volume de chamadas sem entregar autoridade ao navegador.

### Cleanup
Ao encerrar por:
- confisco;
- retirada;

o servidor:
1. liquida a rodada;
2. registra em `game_rounds`;
3. registra o ledger em `wallet_transactions` quando aplicÃ¡vel;
4. monta a resposta final;
5. remove a linha de `crash_regime_sessions`.

Assim, a tabela de sessÃ£o guarda apenas operaÃ§Ãµes realmente ativas.

### IdempotÃªncia
Se uma requisiÃ§Ã£o atrasada consultar o ID de uma sessÃ£o jÃ¡ apagada, `get_crash_regime`
reconstrÃ³i o comprovante usando `game_rounds`.

### Teste sugerido
1. Inicie Crash com 10 T.
2. Abra F12 > Network.
3. Confirme que `get_crash_regime` aparece aproximadamente 2 vezes por segundo, e nÃ£o dezenas.
4. FaÃ§a cashout ou espere perder.
5. Atualize `crash_regime_sessions`: deve ficar sem a sessÃ£o encerrada.
6. Confira `game_rounds` e `wallet_transactions`.

---

## PHASE3.8.3_DERBY_NOTES

> Arquivo original: `PHASE3.8.3_DERBY_NOTES.md`

# TaihenBet 2.0 â€” Phase 3.8.3

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

---

## PHASE3.9_SECURITY_NOTES

> Arquivo original: `PHASE3.9_SECURITY_NOTES.md`

# TaihenBet 2.0 â€” Phase 3.9 â€” Bank Hardening

A Fase 3.8 moveu os quatro Jogos da Entidade para o servidor. A Fase 3.9 remove pontes antigas que continuavam existindo por compatibilidade e reforÃ§a as fronteiras do banco.

## Fechamentos principais

### 1. Payout genÃ©rico de minigame removido
`credit_game_payout()` deixa de ter `EXECUTE` para `authenticated` e a implementaÃ§Ã£o passa a rejeitar qualquer chamada. Taigrinho, TaiMandioca, Crash do Regime e Taihen Derby devem pagar exclusivamente pelas suas prÃ³prias RPCs autoritativas.

### 2. `spend_taicoins()` nÃ£o cria mais `game_stake`
A funÃ§Ã£o genÃ©rica fica reservada ao mÃ³dulo esportivo legado. Entradas dos Jogos da Entidade sÃ£o debitadas dentro de `play_taigrinho`, `start_taimandioca`, `start_crash_regime` e `start_derby`.

### 3. MigraÃ§Ã£o de saldo local encerrada
`resolve_legacy_balance()` mantÃ©m a assinatura antiga para compatibilidade, porÃ©m ignora nÃºmeros enviados pelo navegador. Uma conta nÃ£o migrada apenas confirma o saldo jÃ¡ existente no PostgreSQL.

Isso elimina o cenÃ¡rio em que um cliente novo poderia enviar um `p_local_balance` arbitrÃ¡rio e transformÃ¡-lo em patrimÃ´nio da conta.

### 4. RLS de perfis endurecida
Leitura direta de `profiles` passa a ser:
- usuÃ¡rio comum: apenas o prÃ³prio perfil;
- administrador: todos os perfis;
- anÃ´nimo: sem `SELECT` direto.

O ranking pÃºblico continua disponÃ­vel pela RPC `get_public_ranking()`, que expÃµe somente o contrato pÃºblico do ranking.

### 5. Ledger e rodadas
`wallet_transactions` e `game_rounds`:
- sem INSERT/UPDATE/DELETE direto para o navegador;
- usuÃ¡rio lÃª as prÃ³prias linhas;
- administrador pode auditar todas.

### 6. Segredos dos jogos
`taimandioca_sessions`, `crash_regime_sessions` e `derby_sessions` continuam com todos os privilÃ©gios removidos de `anon` e `authenticated`.

### 7. NÃºcleo da carteira
`_wallet_apply()` agora valida:
- tipo da operaÃ§Ã£o;
- limite absoluto por mutaÃ§Ã£o;
- `external_id` obrigatÃ³rio e com tamanho limitado;
- metadata obrigatoriamente JSON object;
- limite de tamanho da metadata;
- saldo final entre zero e o teto da banca.

### 8. Ranking dos minigames
As estatÃ­sticas dos Jogos da Entidade deixam de confiar no `games_history` sincronizado pelo navegador. Contagem, vitÃ³rias, derrotas, entrada e payout de minigames passam a vir de `game_rounds`.

O histÃ³rico esportivo continua legado nesta fase.

## Fora do escopo

O mÃ³dulo de apostas esportivas ainda possui estado/resoluÃ§Ã£o no cliente e `credit_sports_payout`. Ele precisa de uma migraÃ§Ã£o autoritativa prÃ³pria antes de ser tratado como resistente a manipulaÃ§Ã£o via DevTools.

---

## PHASE3.10_SPORTS_NOTES

> Arquivo original: `PHASE3.10_SPORTS_NOTES.md`

# TaihenBet 2.0 â€” Phase 3.10 â€” Authoritative Sports

## O que mudou

### Bilhete autoritativo
`place_sports_bet()` recebe apenas:
- stake;
- IDs dos mercados/opÃ§Ãµes;
- um request ID de idempotÃªncia.

O servidor busca as odds oficiais, trava snapshots das seleÃ§Ãµes, calcula a odd total,
debita a carteira e registra o bilhete numa Ãºnica transaÃ§Ã£o.

### Novas tabelas
- `sports_markets`
- `sports_league_state`
- `sports_bets`
- `sports_bet_selections`
- `bahrain_market_templates`

As tabelas nÃ£o sÃ£o API pÃºblica do navegador; leitura/escrita normal acontece por RPC.

### AdministraÃ§Ã£o
- `admin_publish_bahrain_round()`
- `admin_save_sports_market()`
- `admin_toggle_sports_market()`
- `admin_archive_sports_market()`
- `admin_clear_settled_sports_markets()`
- `admin_resolve_sports_market()`
- `admin_resolve_sports_bet()`

Ao definir o resultado de um mercado, o PostgreSQL atualiza as seleÃ§Ãµes, encerra
bilhetes derrotados e paga automaticamente bilhetes completos vencedores.

### Pontes antigas desligadas
- `spend_taicoins()` deixa de aceitar apostas esportivas diretas.
- `credit_sports_payout()` Ã© desativada para o cliente.

### HistÃ³rico e ranking
O histÃ³rico esportivo novo vem de `sports_bets`.
O histÃ³rico legado jÃ¡ importado Ã© preservado, mas nÃ£o pode mais ser reescrito pelo navegador.
O ranking soma legado + bilhetes autoritativos + `game_rounds`.

### Mercados customizados
A aba de ediÃ§Ã£o do Painel continua funcionando, mas mercados novos/alterados agora
sÃ£o persistidos pelo servidor. Se houver bilhete pendente num mercado, o servidor
impede reescrever suas opÃ§Ãµes/odds atÃ© a situaÃ§Ã£o ser resolvida.

---

## PHASE3.10a_NOTES

> Arquivo original: `PHASE3.10a_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.10a

## Saldo em tempo real

A aplicaÃ§Ã£o agora observa `UPDATE` do perfil da conta autenticada atravÃ©s do Supabase Realtime.
Quando uma funÃ§Ã£o autoritativa altera `profiles.balance` â€” por exemplo payout esportivo, payout de minigame, anÃºncio, ou ajuste administrativo â€” o React recebe a nova linha e atualiza:

- `profile`;
- `saldoAtualRef`;
- `saldo` exibido no header.

## Fallback

Eventos `focus` e `visibilitychange` fazem uma leitura do prÃ³prio perfil quando o usuÃ¡rio retorna Ã  aba. Isso cobre casos de perda temporÃ¡ria do WebSocket.

## SeguranÃ§a

O SQL apenas adiciona `public.profiles` ao publication `supabase_realtime` se ainda nÃ£o estiver lÃ¡. As polÃ­ticas RLS da Fase 3.9 continuam sendo a barreira de acesso.

---

## PHASE3.11_NOTES

> Arquivo original: `PHASE3.11_NOTES.md`

# TaihenBet 2.0 â€” Phase 3.11 â€” Community Spaces + Grupo TaihenBet

## Museu
O Museu passa a combinar o acervo original com publicaÃ§Ãµes da comunidade.

UsuÃ¡rios autenticados podem publicar:
- imagem ou vÃ­deo;
- tÃ­tulo;
- descriÃ§Ã£o;
- categoria.

Cada publicaÃ§Ã£o mostra o `profiles.username` da conta responsÃ¡vel.
Arquivos ficam no bucket `museum-community` em uma pasta com o UUID do autor.

O cliente nÃ£o recebe permissÃ£o direta de escrita em `museum_posts`.
CriaÃ§Ã£o e exclusÃ£o passam por RPCs com `auth.uid()`.

## Para a Tai
A antiga carta fixa foi removida da interface.
A pÃ¡gina agora Ã© um mural coletivo.

UsuÃ¡rios autenticados podem escrever mensagens de atÃ© 1600 caracteres.
Cada mensagem mostra o nome da conta autora e a data.

## Empresas do Grupo TaihenBet
Nova pÃ¡gina pÃºblica **Grupo** na navegaÃ§Ã£o.

Ela funciona como um organograma/parÃ³dia corporativa do universo da TaihenBet.
O SQL jÃ¡ cadastra quatro empresas iniciais:
- NASA;
- SIV;
- DJI;
- Taihen Airlines.

A prÃ³pria pÃ¡gina deixa explÃ­cito que as participaÃ§Ãµes sÃ£o fictÃ­cias e que nÃ£o existe vÃ­nculo ou aquisiÃ§Ã£o real das organizaÃ§Ãµes citadas.

Cada card possui:
- nome;
- sÃ­mbolo/sigla;
- setor;
- slogan;
- descriÃ§Ã£o;
- status corporativo e tom visual.

### AdministraÃ§Ã£o
Conta comum apenas visualiza.
Conta com `profiles.role = 'admin'` recebe, dentro da pÃ¡gina Grupo:
- `+ Registrar empresa`;
- editar empresa;
- excluir empresa.

O navegador nÃ£o recebe `INSERT`, `UPDATE` ou `DELETE` direto na tabela `taihen_group_companies`.
A administraÃ§Ã£o usa RPCs protegidas por `is_current_user_admin()`.

RPCs:
- `get_taihen_group_companies`
- `admin_upsert_taihen_group_company`
- `admin_delete_taihen_group_company`

## ModeraÃ§Ã£o da comunidade
- dono pode remover a prÃ³pria publicaÃ§Ã£o/mensagem;
- admin pode remover qualquer publicaÃ§Ã£o/mensagem;
- e-mails nÃ£o sÃ£o expostos;
- textos sÃ£o renderizados como texto pelo React, sem HTML do usuÃ¡rio.

## Storage
Bucket: `museum-community`

Tipos permitidos:
- JPEG
- PNG
- WEBP
- GIF
- MP4
- WEBM
- QuickTime/MOV

Limite por arquivo: 50 MB.

---

## PHASE3.18_NOTES

> Arquivo original: `PHASE3.18_NOTES.md`

# Fase 3.18 â€” TaiShop

A loja adiciona uma economia cosmÃ©tica sem alterar odds ou resultados dos jogos.

## SeguranÃ§a / saldo

O navegador nunca recebe permissÃ£o para atualizar `profiles.balance` diretamente.
`buy_taishop_cosmetic()` chama a funÃ§Ã£o interna endurecida `_wallet_apply()` e usa
uma operaÃ§Ã£o `admin_adjustment` com metadata `source = taishop`. Isso preserva a
allowlist da carteira da Fase 3.9 e mantÃ©m o dÃ©bito no ledger sem reabrir uma RPC
genÃ©rica de gasto para o cliente.

## PersistÃªncia

- catÃ¡logo: `cosmetic_catalog`;
- inventÃ¡rio: `user_cosmetics`;
- slots equipados: colunas `equipped_*` em `profiles`;
- aparÃªncia pÃºblica: `get_public_profile()` retorna apenas os IDs equipados.

## Slots

Cada conta pode exibir simultaneamente:
- 1 moldura de avatar;
- 1 cor de nome;
- 1 efeito de perfil;
- 1 badge.

Comprar nÃ£o equipa automaticamente. Desequipar nÃ£o remove o item do inventÃ¡rio.

---

## PHASE3.18a_NOTES

> Arquivo original: `PHASE3.18a_NOTES.md`

# Fase 3.18a â€” Header Layout Hotfix

Hotfix visual e isolado para a regressÃ£o de navegaÃ§Ã£o observada apÃ³s a entrada da TaiShop.

## AlteraÃ§Ã£o

`HeaderLayoutHotfix.css` Ã© importado **depois** do tema principal para atuar apenas como camada de override. Em desktop ele:

- forÃ§a `header`, `navigation` e `header-account-zone` a permanecerem sem quebra de linha;
- permite que a navegaÃ§Ã£o utilize o espaÃ§o flexÃ­vel central;
- reduz gaps e paddings progressivamente entre 1181px e 1460px;
- mantÃ©m labels em `white-space: nowrap`;
- nÃ£o interfere nas regras responsivas antigas abaixo de 1181px.

## NÃ£o alterado

- Supabase;
- saldo/carteira;
- TaiShop;
- inventÃ¡rio;
- equipamentos cosmÃ©ticos;
- Central de NotificaÃ§Ãµes;
- perfis pÃºblicos;
- rotas e lÃ³gica de navegaÃ§Ã£o.

---

## PHASE3.19_NOTES

> Arquivo original: `PHASE3.19_NOTES.md`

# Fase 3.19 â€” MissÃµes DiÃ¡rias e Semanais

## Objetivo

Fechar o loop da economia fictÃ­cia do TaihenBet:

`atividade â†’ missÃ£o â†’ recompensa â†’ TaiShop â†’ perfil pÃºblico`

## Fonte do progresso

A Fase 3.19 nÃ£o confia em contadores enviados pelo navegador.
Triggers observam tabelas que jÃ¡ sÃ£o autoritativas no projeto:

- `game_rounds` â†’ `game_play`;
- `sports_bets` â†’ `sports_bet`;
- `wallet_transactions` com amount negativo â†’ `taicoins_spent`.

Os eventos deduplicados ficam em `mission_events`.

## Resgates

`claim_my_mission()` recalcula o progresso no servidor antes de liberar a
recompensa. Cada missÃ£o possui uma chave de perÃ­odo e `user_mission_claims`
impede resgate duplicado.

As TaiCoins sÃ£o creditadas por `_wallet_apply()` usando `admin_adjustment` com
metadata `source = missions`, preservando o endurecimento de carteira da 3.9.

## Fuso / reset

As janelas usam `America/Sao_Paulo`:

- diÃ¡ria: 00:00 â†’ 23:59 do dia;
- semanal: segunda 00:00 â†’ prÃ³xima segunda 00:00.

## Recompensa exclusiva

`badge_weekly_auditor` Ã© inserido no catÃ¡logo de cosmÃ©ticos como ativo, porÃ©m
`shop_visible = false`. Assim:

- pode ser equipado pelo sistema normal da 3.18;
- aparece no perfil pÃºblico;
- nÃ£o pode ser comprado na TaiShop.

## Compatibilidade

A RPC pÃºblica da TaiShop foi ajustada para esconder itens `shop_visible = false`
e o estado da loja conta apenas cosmÃ©ticos comprÃ¡veis, evitando contadores como
"13/12" depois do badge de missÃ£o ser adquirido.

---

## PHASE3.20_NOTES

> Arquivo original: `PHASE3.20_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.20

## Eventos e Temporadas

A Fase 3.20 adiciona uma camada sazonal sobre os sistemas existentes sem alterar odds, premios ou resultados dos jogos.

### Temporada inicial

**Temporada Piloto â€” Era da Mandioca**

O primeiro `RUN` do SQL fixa o inicio nas 00:00 de Brasilia do mesmo dia e o encerramento 28 dias depois. Reexecutar o patch nao reinicia as datas da temporada.

### Missoes sazonais

- ExpediÃ§Ã£o Ã  Colheita â€” 8 partidas â€” +80 pts / +60 T
- AgrÃ´nomo de Odds â€” 4 bilhetes esportivos â€” +80 pts / +60 T
- Queima de Verba AgrÃ­cola â€” 300 T gastos â€” +100 pts / +75 T
- FuncionÃ¡rio Sazonal â€” 3 missÃµes diÃ¡rias resgatadas â€” +120 pts / +80 T
- ComitÃª da Safra â€” 3 missÃµes sazonais resgatadas â€” +120 pts / +100 T

### Prestigio

O placar e server-side e possui ledger idempotente.

AlÃ©m das missÃµes sazonais:
- missÃ£o diÃ¡ria normal resgatada: +10 pts
- missÃ£o semanal normal resgatada: +40 pts

### Marcos

- 100 pts â€” Broto Homologado â€” +50 T
- 250 pts â€” Colheita Registrada â€” +100 T
- 500 pts â€” Safra LendÃ¡ria â€” +150 T + **Sobrevivente da Safra**

O badge final Ã© cadastrado no `cosmetic_catalog` como ativo, porÃ©m oculto da TaiShop. SÃ³ o RPC de recompensa sazonal coloca o item no inventÃ¡rio.

### SeguranÃ§a

- Progressos vÃªm das tabelas autoritativas jÃ¡ usadas pelas missÃµes 3.19.
- Resgate recalcula a meta no servidor.
- MissÃµes e marcos possuem chaves Ãºnicas de resgate.
- TaiCoins entram pela `_wallet_apply` endurecida.
- Contas suspensas nÃ£o resgatam recompensas nem equipam o badge sazonal.
- Pontos sazonais possuem ledger com `source_key` Ãºnico, evitando duplicaÃ§Ã£o.

### Arquivo

O banco jÃ¡ preserva temporadas encerradas. Quando a temporada atual terminar, ela deixa de ser ativa automaticamente pelo intervalo `starts_at / ends_at` e passa a aparecer no arquivo do usuÃ¡rio.

---

## PHASE3.20a_NOTES

> Arquivo original: `PHASE3.20a_NOTES.md`

# Fase 3.20a â€” Hotfix do avatar do ranking sazonal

## CorreÃ§Ã£o

`avatarDoPerfil()` retorna o objeto de configuraÃ§Ã£o do avatar. O ranking sazonal estava entregando esse objeto inteiro ao atributo `src` da imagem.

A renderizaÃ§Ã£o agora usa:

```jsx
avatarDoPerfil(user.avatar_key)?.src
```

Isso alinha a aba Evento ao comportamento jÃ¡ corrigido em Perfis PÃºblicos/TaiShop.

## Escopo

- sem alteraÃ§Ã£o no Supabase;
- sem alteraÃ§Ã£o em pontos de temporada;
- sem alteraÃ§Ã£o em missÃµes;
- sem alteraÃ§Ã£o em recompensas;
- sem alteraÃ§Ã£o nas datas da temporada;
- sem alteraÃ§Ã£o no perfil pÃºblico.

---

## PHASE3.21_NOTES

> Arquivo original: `PHASE3.21_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.21

## ComentÃ¡rios e ReaÃ§Ãµes no Museu

A fase transforma as publicaÃ§Ãµes comunitÃ¡rias do Museu em peÃ§as sociais persistentes.

### ReaÃ§Ãµes

- `ðŸ  Mandioca`
- `ðŸ”¥ Fogo`
- `ðŸ˜­ Sofrimento`
- `ðŸ’¸ FalÃªncia`

Existe uma reaÃ§Ã£o por conta em cada publicaÃ§Ã£o. Repetir a reaÃ§Ã£o ativa remove o voto; escolher outra substitui a anterior. A primeira reaÃ§Ã£o de outra pessoa gera uma notificaÃ§Ã£o para o autor da peÃ§a, mas trocas de emoji nÃ£o geram spam.

### ComentÃ¡rios

ComentÃ¡rios tÃªm de 1 a 600 caracteres e ficam vinculados Ã  conta autora. O prÃ³prio autor pode apagÃ¡-los pelo Museu. Administradores removem comentÃ¡rios pela Central de ModeraÃ§Ã£o para que a aÃ§Ã£o fique registrada no log administrativo.

### NotificaÃ§Ãµes

A Central da Banca recebe o novo tipo `museum`:

- nova reaÃ§Ã£o em publicaÃ§Ã£o prÃ³pria;
- novo comentÃ¡rio em publicaÃ§Ã£o prÃ³pria;
- remoÃ§Ã£o administrativa continua usando o tipo `moderation`.

AÃ§Ãµes feitas no prÃ³prio conteÃºdo nÃ£o geram notificaÃ§Ã£o para si mesmo.

### SeguranÃ§a

As tabelas sociais usam RLS e nÃ£o concedem escrita direta a `anon`/`authenticated`. AlteraÃ§Ãµes passam por RPCs `security definer`, validam autenticaÃ§Ã£o e preservam o bloqueio de contas suspensas da Fase 3.14.

### ModeraÃ§Ã£o

A Central de ModeraÃ§Ã£o recebe:

- contador de comentÃ¡rios;
- aba **ComentÃ¡rios**;
- busca por autor, peÃ§a ou conteÃºdo;
- remoÃ§Ã£o administrativa;
- aÃ§Ã£o `museum_comment_removed` no log;
- notificaÃ§Ã£o automÃ¡tica ao autor do comentÃ¡rio removido.

### Compatibilidade

`get_museum_posts()` permanece intacta. A interface da Fase 3.21 usa `get_museum_posts_social()` para receber tambÃ©m os contadores de reaÃ§Ã£o e comentÃ¡rio.

---

## PHASE3.22_NOTES

> Arquivo original: `PHASE3.22_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.22

## Feed de Atividades / Mural da Comunidade

A fase adiciona a nova aba **Feed**, uma linha do tempo pÃºblica que conecta os sistemas sociais e de progressÃ£o jÃ¡ existentes.

### Atividades registradas

- conquistas desbloqueadas;
- publicaÃ§Ãµes da comunidade no Museu;
- comentÃ¡rios publicados no Museu;
- missÃµes diÃ¡rias e semanais resgatadas;
- objetivos sazonais resgatados;
- marcos da temporada resgatados;
- tÃ­tulos equipados;
- cosmÃ©ticos equipados.

### IntegraÃ§Ãµes

- avatar/nome levam ao perfil pÃºblico;
- cada atividade pode levar para Museu, MissÃµes, Evento, Conquistas ou perfil;
- atividades antigas compatÃ­veis sÃ£o importadas no primeiro run do SQL;
- publicaÃ§Ãµes/comentÃ¡rios removidos deixam de aparecer no Feed;
- contas suspensas deixam de aparecer enquanto a suspensÃ£o estiver ativa;
- saldo, e-mail, histÃ³rico bruto, autenticaÃ§Ã£o e aÃ§Ãµes de moderaÃ§Ã£o nÃ£o sÃ£o expostos.

### Filtros

O mural possui filtros por tipo de atividade e paginaÃ§Ã£o em blocos de 20 registros.

---

## PHASE3.22a_NOTES

> Arquivo original: `PHASE3.22a_NOTES.md`

# Fase 3.22a â€” Feed Hotfix

A causa do erro do filtro **Museu** era uma divergÃªncia de identificadores:
- UI: `museu`
- RPC `get_community_activity_feed`: `museum`

O hotfix centraliza essa traduÃ§Ã£o antes da chamada ao Supabase.
TambÃ©m adiciona proteÃ§Ã£o contra respostas assÃ­ncronas fora de ordem e deduplicaÃ§Ã£o na paginaÃ§Ã£o.

---

## PHASE3.23_NOTES

> Arquivo original: `PHASE3.23_NOTES.md`

# Fase 3.23 â€” Central de ConteÃºdo

A Fase 3.23 transforma o Painel da Banca numa camada de CMS para o TaihenBet.

## Arquitetura

- `achievement_catalog`: catÃ¡logo autoritativo e editÃ¡vel das conquistas.
- `mission_catalog`: substitui o antigo catÃ¡logo hardcoded de missÃµes da Fase 3.19.
- `site_text_content`: textos editoriais gerais com valor atual + valor padrÃ£o.
- TaiShop, temporadas e empresas reutilizam as tabelas server-side que jÃ¡ existiam.
- `get_content_studio_snapshot()` entrega ao painel todos os blocos editÃ¡veis numa Ãºnica RPC.
- RPCs administrativas validam `profiles.role = 'admin'` antes de qualquer escrita.

## ConsistÃªncia

- MissÃµes usam `mission_catalog` dentro de `_mission_definitions()`, portanto meta e recompensa mudadas no painel tambÃ©m mudam o resgate server-side.
- NotificaÃ§Ãµes e Feed consultam `achievement_catalog` para novos nomes/tÃ­tulos de conquista.
- Ranking, perfil pÃºblico, pÃ¡gina de evento e Feed usam o catÃ¡logo dinÃ¢mico para tÃ­tulos pÃºblicos.
- TaiShop jÃ¡ comprava pelo catÃ¡logo server-side; editar preÃ§o no painel altera a cobranÃ§a real em TaiCoins.

## Limite intencional

A Central de ConteÃºdo nÃ£o expÃµe IDs e tipos estruturais que conectam os sistemas entre si. Criar um novo tipo de jogo ou uma nova mÃ©trica de missÃ£o ainda exige desenvolvimento, mas alteraÃ§Ãµes editoriais e grande parte dos parÃ¢metros existentes deixam de exigir ediÃ§Ã£o de cÃ³digo.

---

## PHASE3.23a_NOTES

> Arquivo original: `PHASE3.23a_NOTES.md`

# Fase 3.23a â€” Editor de Falas da Neytai

ExtensÃ£o da Central de ConteÃºdo da Fase 3.23.

## Arquitetura

- `src/data/neytaiTour.js` passa a ser a fonte Ãºnica das falas padrÃ£o e dos metadados tÃ©cnicos do tour.
- `neytai_message_overrides` armazena somente conteÃºdo personalizado por `step_id`.
- `get_public_neytai_message_overrides()` entrega as personalizaÃ§Ãµes ao assistente.
- `get_content_studio_snapshot()` foi estendido com `neytai_messages`.
- escrita e reset continuam protegidos por `_content_studio_assert_admin()`.
- o componente do Neytai mantÃ©m fallback integral para os textos do cÃ³digo.

## Campos editÃ¡veis

`titulo`, `texto`, `instrucao`, `botaoPausa` e `dicas`.

Campos tÃ©cnicos como `pagina`, `alvo`, `modo`, `jogo`, `adminOnly`, `id`, `numero` e `grupo` nÃ£o sÃ£o enviados para a RPC de escrita.

---

## PHASE3.23c_NOTES

> Arquivo original: `PHASE3.23c_NOTES.md`

# TaihenBet 2.0 â€” Fase 3.23c

## Neytai cobre as quatro Ã¡reas que faltavam

Foram acrescentadas oito etapas ao tour principal:

- `irFeed` â†’ destaca o botÃ£o Feed.
- `feed` â†’ explica o Feed pÃºblico e sua privacidade mÃ­nima.
- `irMissoes` â†’ destaca MissÃµes.
- `missoes` â†’ explica ciclos diÃ¡rio/semanal, progresso e resgate.
- `irEvento` â†’ destaca Evento.
- `evento` â†’ explica temporada, prestÃ­gio, marcos e arquivo.
- `irLoja` â†’ destaca Loja.
- `loja` â†’ explica cosmÃ©ticos, inventÃ¡rio e ausÃªncia de vantagem competitiva.

O tour passa de 45 para 53 etapas (para administradores; etapas administrativas continuam filtradas para contas comuns).

## Compatibilidade com o editor 3.23a

Nenhuma tabela nova foi necessÃ¡ria. `ContentAdminPanel.jsx` deriva a lista do editor diretamente de `NEYTAI_DEFAULT_STEPS`; por isso as oito etapas surgem automaticamente no editor de falas.

Overrides anteriores continuam vÃ¡lidos porque os IDs existentes nÃ£o foram alterados, inclusive `final`.

## Cumulativo com 3.23b

O pacote inclui a Mensagem do Criador e o pÃ³s-crÃ©ditos da Fase 3.23b. O SQL incluÃ­do Ã© o mesmo `phase3_23b_creator_message.sql`; rode-o somente caso ainda nÃ£o tenha instalado a 3.23b.

## MigraÃ§Ã£o local do tour

A versÃ£o do tour agora Ã© `tour-completo-v7-feed-missoes-evento-loja`.

- tour jÃ¡ concluÃ­do â†’ retoma em `irFeed`;
- usuÃ¡rio parado no antigo final/pÃ³s-crÃ©ditos â†’ retoma em `irFeed`;
- usuÃ¡rio no meio do tour â†’ preserva a etapa existente;
- apÃ³s Loja â†’ falso final â†’ â€œOpa, espera, faltou um baguiâ€ â†’ Recado â†’ final real.

---



---

# Notas da atualização 2.0

# TaihenBet 2.0 â€” Fase 1: New Model Update

## O que mudou
- Nova paleta global: preto/vinho + rosa + creme + dourado + marrom.
- Header atualizado para a nova identidade.
- TaiCoins ganharam tratamento dourado.
- Home redesenhada com o novo modelo da Taihen.
- Novo selo "TAIHENBET 2.0 Â· NOVA ERA".
- Nova faixa de status da sessÃ£o Ao Vivo na Home (usa o estado que jÃ¡ existia).
- Novo placar da banca: jogos, clubes, R$ 0 e decisÃµes ruins infinitas.
- Preview do Museu e apostas esportivas receberam a nova identidade.
- Entidade/Neytai, TaiMandioca e Ditadora foram atualizados com os novos assets.
- O acervo antigo do Museu nÃ£o foi sobrescrito de propÃ³sito.

## Arquivo principal do novo tema
`src/TaihenTheme2026.css`

Ele Ã© importado por Ãºltimo em `src/App.jsx`, entÃ£o funciona como camada visual da versÃ£o 2.0 sem destruir os CSS antigos.

## Como rodar
1. Abra a pasta no terminal.
2. Rode `npm install`.
3. Rode `npm run dev`.

## ObservaÃ§Ã£o
O ZIP nÃ£o inclui `node_modules` nem o `dist` antigo. Isso Ã© intencional: instale as dependÃªncias localmente para gerar os binÃ¡rios corretos do seu sistema.

## PrÃ³xima fase planejada
- Refinar Jogos / TaiMandioca / Taigrinho / Crash.
- Atualizar Museu por eras.
- Atualizar Ranking / HistÃ³rico / Para a Tai / Painel.
- Depois: Supabase Auth + PostgreSQL + Realtime + permissÃµes de admin.
