# Histórico de Desenvolvimento — TaihenBet 2.0

Este documento reúne as notas de desenvolvimento que originalmente estavam separadas em diversos arquivos `PHASE*.md`.

Os conteúdos abaixo foram preservados a partir do histórico original do projeto.


---

## PHASE2_GAMES_NOTES.md

# TaihenBet 2.0 — Fase 2: Jogos

Patch incremental feito sobre a Fase 1.1.

## TaiMandioca 2.0
- Identidade de "Safra 2026".
- Tabuleiro com visual mais terroso/vinho e detalhes creme/rosa.
- TaiMandiocas seguras destacadas em rosa/dourado.
- Mandioca normal continua sendo o perigo vermelho.
- Configuração, botões, histórico e comunicado do oráculo foram integrados à paleta 2026.

## Taigrinho 2.0
- Máquina redesenhada em rosa, vinho e dourado.
- Símbolo principal "Tai" usa o modelo oficial 2026.
- Jackpot e vitórias receberam destaque dourado.
- Botão GIRAR agora segue a nova identidade rosa/cereja.
- Tabela de pagamentos e painel lateral foram reestilizados.

## Crash do Novo Regime
- Gráfico agora usa cereja -> rosa -> dourado.
- Interface em vinho/preto/ouro para combinar com a Ditadora Suprema.
- Imagem da Comandante ganhou enquadramento e acabamento mais dramáticos.
- Controles, status, cards laterais e overlays seguem a nova paleta.
- Texto de palco alterado para "DITADORA SUPREMA DA BANCA".

## Taihen Derby
- Mantém mecânica e personalidade originais.
- Rosa/vinho/dourado substituem a predominância roxa.
- Cards, seleção e pista agora conversam com o restante da TaihenBet 2.0.

## Catálogo de jogos
Cada jogo recebeu uma assinatura visual própria:
- TaiMandioca: marrom + creme + rosa.
- Taigrinho: rosa + dourado.
- Crash: vinho + dourado.
- Derby: rosa suave + dourado.

## Instalação
Extraia este ZIP por cima do projeto que já está com a Fase 1.1 e aceite substituir os arquivos.

Arquivos alterados:
- `src/components/GamesPage.jsx`
- `src/TaihenTheme2026.css`

O Vite em modo dev deve atualizar automaticamente após a substituição.

---

## PHASE2.1_GAMES_NOTES.md

# TaihenBet 2.0 — Fase 2.1 (acabamento dos jogos)

Patch incremental para aplicar **depois da Fase 2 — Games**.

## Ajustes

- **TaiMandioca**: estado inicial da roça compactado. As 25 casas deixam de ocupar espaço quando nenhuma colheita está ativa; o painel de espera fica mais central e legível.
- **Crash do Novo Regime**: grade mais visível e novo comunicado ocioso `PROTOCOLO 00` enquanto a operação não começou.
- **Taihen Derby**: removidos os principais resquícios roxos do bilhete; botão de iniciar corrida, controles, resumo e overlays agora seguem rosa/vinho/dourado da identidade 2026.
- Pequenos ajustes de contraste e hover.

## Instalação

Extraia este ZIP na raiz do projeto e permita substituir os arquivos existentes.

Com `npm run dev` já aberto, o Vite deve recarregar automaticamente.

---

## PHASE3_AUTH_NOTES.md

# TaihenBet 2.0 — Fase 3.0: Autenticação

Este patch adiciona a primeira camada da TaihenBet Online:

- botão Entrar / Criar conta no header;
- cadastro com nome, e-mail e senha;
- login com Supabase Auth;
- sessão persistente;
- menu da conta no header;
- logout;
- feedback para confirmação de e-mail e erros comuns.

## Antes de testar

O projeto precisa ter:

```bash
npm install @supabase/supabase-js
```

E um `.env` na raiz (NÃO está incluso neste patch):

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Depois de alterar `.env`, reinicie `npm run dev`.

## Observação

Esta fase autentica a conta, mas AINDA NÃO move TaiCoins, histórico ou ranking para o banco. O saldo continua local por enquanto. Isso será feito nas próximas fases para evitar migrar toda a economia de uma vez.

---

## PHASE3.1_HUMAN_NOTES.md

# TaihenBet 2.0 — Fase 3.1: Human Check™

Patch cumulativo sobre a Fase 3 AUTH.

## Adicionado
- CAPTCHA cômico exclusivo da TaihenBet no cadastro.
- Caixa “Não sou uma mandioca”.
- Desafio aleatório de múltipla escolha.
- Respostas erradas trocam o desafio e geram mensagens absurdas.
- Cadastro bloqueado até a humanidade ser aprovada.
- Feedback de aprovação: “inteligência suficiente para perder TaiCoins”.

## Observação de segurança
Esse Human Check é propositalmente uma camada de entretenimento/UI, não uma defesa anti-bot real. Quando a aplicação for publicada, uma proteção real (por exemplo, Turnstile) pode ser adicionada por trás sem remover essa interface.

## Aplicação
Este ZIP já contém os arquivos da Fase 3 AUTH + Human Check, então pode ser extraído por cima do projeto atual. O arquivo .env não é incluído.

---

## PHASE3.2_PASSWORD_NOTES.md

# TaihenBet 2.0 — Fase 3.2: Detector de Senha Vergonhosa

- Bloqueia localmente algumas senhas extremamente previsíveis no cadastro.
- Exibe a piada “O usuário X já possui esta senha” com nomes fictícios.
- Não consulta, compara nem revela senhas reais de outros usuários.
- O botão de cadastro permanece bloqueado enquanto a senha estiver na lista de senhas fracas.
- Patch cumulativo: inclui autenticação e Human Check das fases 3.0/3.1.

---

## PHASE3.3_LINGUICA_NOTES.md

# TaihenBet 2.0 — Fase 3.3: Auditoria da Linguiça

- Adiciona no cadastro a pergunta obrigatória “Qual o tamanho da sua linguiça?”.
- Na primeira medida válida informada, a banca alega que um usuário fictício já possui exatamente aquele tamanho.
- O usuário precisa escolher outro valor para passar na auditoria.
- O valor NÃO é enviado ao Supabase, NÃO é salvo e NÃO entra nos metadados da conta.
- A funcionalidade é apenas uma piada local de interface.

---

## PHASE3.4_PROFILE_WALLET_NOTES.md

# TaihenBet 2.0 — Fase 3.4: Perfil + TaiCoins persistentes

## Antes de copiar o patch
1. Abra o Supabase > SQL Editor > New query.
2. Cole TODO o conteúdo de `supabase/phase3_4_profiles_wallet.sql`.
3. Clique em Run.
4. Se quiser que sua conta tenha o Painel em produção, rode também `supabase/make_me_admin.sql` depois de trocar `SEU_EMAIL_AQUI` pelo seu e-mail.

## Depois
Copie o patch por cima do projeto e reinicie `npm run dev`.

Na primeira entrada de cada conta, a banca pergunta se deve importar o saldo antigo do navegador ou começar com 1.000 TaiCoins.

## O que entrou
- Tabela `profiles` ligada ao Supabase Auth.
- Username e avatar persistentes.
- 4 avatares internos: Taihen 2026, TaiMandioca, Ditadora Suprema e Entidade da Banca.
- TaiCoins carregadas do banco ao entrar e sincronizadas durante o uso.
- Migração única do saldo antigo do localStorage.
- Menu de conta com patrimônio + botão "Editar meu perfil".
- Em produção, a aba Painel só aparece para `role = admin`.
- RLS e privilégios de coluna impedem UPDATE direto de `balance` e `role` na tabela.

## Observação importante de integridade
O dinheiro é fictício e o projeto ainda calcula os jogos no navegador. A função `sync_my_balance` é uma ponte de migração para persistência, não um sistema anti-cheat definitivo. Antes de colocar um ranking competitivo público, mova sorteios, pagamentos e recompensas para funções/servidor autoritativos e remova essa ponte.

---

## PHASE3.4.1_ADMIN_GUARD_NOTES.md

# TaihenBet 2.0 — Fase 3.4.1

Hotfix do controle de acesso ao Painel.

## Mudança
- Remove o bypass `import.meta.env.DEV` do acesso administrativo.
- Agora, inclusive no localhost, somente perfis com `role = 'admin'` veem e acessam o Painel.
- O bloco de ferramentas visuais de desenvolvimento continua condicionado a `import.meta.env.DEV`, mas só pode ser alcançado depois que a conta passa pelo guard de admin.

## Teste esperado
1. Entre com uma conta `role = 'user'`: a aba Painel não deve aparecer.
2. Entre com a conta `role = 'admin'`: a aba Painel deve aparecer normalmente.

## Segurança
Esconder a interface no React não substitui autorização no banco. Quando as operações administrativas forem ligadas ao Supabase, cada escrita administrativa também deverá validar a role no servidor/RLS/RPC.

---

## PHASE3.5_PASSWORD_RECOVERY_NOTES.md

# TaihenBet 2.0 — Fase 3.5: Recuperação de senha

Patch incremental para aplicar por cima da Fase 3.4.1.

## O que entrou

- Link **Esqueceu sua senha?** no login.
- Envio do e-mail oficial de recuperação com `supabase.auth.resetPasswordForEmail()`.
- Detecção do evento `PASSWORD_RECOVERY` quando o usuário volta pelo link do e-mail.
- Tela obrigatória de nova senha.
- Confirmação da nova senha.
- Detector de senha vergonhosa também funciona na recuperação.
- O aviso inicial da TaihenBet não cobre a tela de recuperação quando o usuário volta pelo link.
- A role do perfil (`admin`, `user`, etc.) não é alterada ao trocar a senha.

## Instalação

1. Extraia o patch por cima do projeto atual e substitua os arquivos.
2. Não há SQL novo.
3. Não há pacote npm novo.
4. Reinicie o Vite se necessário: `npm run dev`.

## Supabase — URL de redirecionamento

Em **Authentication > URL Configuration**, confirme que a URL usada para testar está permitida. Para desenvolvimento:

`http://localhost:5173`

Quando publicar, adicione também a URL real do Vercel.

## Teste recomendado

1. Saia da conta admin.
2. Abra **Entrar**.
3. Clique em **Esqueceu sua senha?**.
4. Digite o e-mail da conta admin.
5. Abra o e-mail recebido e clique no link.
6. A TaihenBet deve abrir diretamente em **Escolha uma nova senha vergonhosa**.
7. Teste uma senha fraca como `123456` para conferir a piada.
8. Escolha uma senha nova válida e confirme.
9. Saia da conta e entre novamente usando a nova senha.
10. A conta deve continuar com `role = admin` e com o mesmo saldo/perfil.

## Template opcional do e-mail

No Supabase, abra **Authentication > Emails > Templates > Reset Password** (o nome pode aparecer como Recovery) e use:

**Assunto:** `🔐 A banca recebeu um pedido de amnésia`

O HTML pronto está em `supabase/password_recovery_email.html`.

Não altere a variável `{{ .ConfirmationURL }}` do botão.

---

## PHASE3.6_PROFILE_RANKING_HISTORY_NOTES.md

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

---

## PHASE3.6.1_PROFILE_POLISH_NOTES.md

# TaihenBet 2.0 — Fase 3.6.1: Profile Polish

Hotfix visual para aplicar **por cima da Fase 3.6**.

## O que mudou

- O modal de **Meu Perfil** agora respeita a altura real da janela (`100dvh`).
- Em desktop, a coluna de identidade e o editor têm rolagem interna independente, evitando título/botões cortados em telas de 768p ou menores.
- Em telas baixas, avatar e espaçamentos ficam automaticamente mais compactos.
- Em mobile, o modal volta para uma única rolagem contínua.
- O e-mail deixou de ficar exposto na coluna principal do perfil.
- O UUID deixou de ocupar espaço no visual normal.
- Agora existe um cartão **Identidade vinculada / E-mail confirmado pela banca**.
- E-mail e UUID continuam acessíveis em **Ver dados técnicos da conta**, recolhido por padrão.
- Nenhuma alteração de banco de dados, RLS, carteira, ranking ou histórico.

## Como aplicar

Copie a pasta `src` deste patch por cima da pasta `src` do projeto e permita substituir os arquivos existentes.

Não é necessário rodar SQL nem instalar pacote novo.

Se o Vite estiver aberto, normalmente ele atualiza sozinho. Se preferir, reinicie com:

```bash
npm run dev
```

## Teste rápido

1. Entre na conta.
2. Abra **Meu Perfil**.
3. Confirme que o topo `Meu perfil` aparece inteiro.
4. Role apenas a parte direita e confirme que o modal continua dentro da tela.
5. Abra **Ver dados técnicos da conta** para conferir e-mail/ID.
6. Teste salvar username/avatar normalmente.

---

## PHASE3.7_AUTHORITATIVE_WALLET_NOTES.md

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

---

## PHASE3.7.1_ADMIN_WALLET_NOTES.md

# TaihenBet 2.0 — Fase 3.7.1: Tesouraria administrativa

Pequeno complemento da Fase 3.7.

## O que entra

- Nova aba **Carteiras** no Painel da banca.
- Lista as contas reais de `public.profiles`.
- Admin escolhe uma conta e informa o **saldo final desejado**.
- O frontend calcula somente a diferença e chama `admin_adjust_wallet()`.
- Todo ajuste gera `kind = admin_adjustment` em `wallet_transactions`.
- Não há edição direta de `profiles.balance` pelo navegador.
- Confirmação mostra saldo anterior, diferença e saldo final.
- Campo de motivo é gravado no metadata do ledger.

## Para restaurar a Paulin após os testes

No estado observado após os testes, a conta estava em 1,2 T. Para voltar ao saldo que existia antes dos giros extras de validação, abra:

Painel → Carteiras → Paulin

E informe **508,7** em "Saldo final desejado".

A função administrativa deve gerar aproximadamente:

- `admin_adjustment`: `+507,50`
- `balance_after`: `508,70`

## Instalação

Aplicar sobre a Fase 3.7. Não há SQL novo: a RPC `admin_adjust_wallet()` já foi criada em `phase3_7_authoritative_wallet.sql`.

---

## PHASE3.8_AUTHORITATIVE_TAIGRINHO_NOTES.md

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

---

## PHASE3.8.1_AUTHORITATIVE_TAIMANDIOCA_NOTES.md

# TaihenBet 2.0 — Fase 3.8.1

## TaiMandioca autoritativa

Esta fase move o tabuleiro secreto da TaiMandioca para o PostgreSQL/Supabase.

### O navegador NÃO recebe mais

- a lista de posições das mandiocas normais;
- o sorteio do tabuleiro;
- autoridade para decidir vitória/derrota;
- autoridade para calcular ou creditar o prêmio.

### RPCs novas

- `start_taimandioca(stake, hazards)` — debita e cria uma sessão secreta;
- `reveal_taimandioca(session_id, index)` — revela somente a casa pedida;
- `cashout_taimandioca(session_id)` — calcula e paga o cashout no servidor;
- `get_active_taimandioca()` — restaura uma sessão ativa após F5.

### Tabela privada

`public.taimandioca_sessions`

Ela guarda `hazard_indices`, mas não concede `SELECT` para `authenticated`. A aplicação só enxerga o estado público devolvido pelas RPCs.

### Auditoria

Quando a colheita termina, a rodada também é gravada em `public.game_rounds` com `game = 'taimandioca'`.

O ledger usa o mesmo UUID da sessão para:

- `game_stake` negativo;
- `game_payout` positivo, quando houver.

### Proteção adicional

`credit_game_payout()` passa a rejeitar pagamentos manuais tanto do Taigrinho quanto da TaiMandioca. Os dois jogos agora liquidam seus próprios resultados no servidor.

### Persistência

Uma colheita ativa sobrevive a F5. Ao voltar para a página de Jogos, o frontend consulta `get_active_taimandioca()` e reconstrói apenas as casas já reveladas — nunca o tabuleiro secreto.

---

## PHASE3.8.1a_NOTES.md

# TaihenBet 2.0 — Fase 3.8.1a

Hotfix de ciclo de vida da sessão secreta da TaiMandioca.

A Fase 3.8.1 já restringia `get_active_taimandioca()` a `status = 'active'`, e o índice exclusivo também só considerava sessões ativas. Portanto, uma linha `cashout/lost/perfect` antiga não bloqueava uma nova partida.

O problema era outro: `taimandioca_sessions` continuava retendo `hazard_indices` após a liquidação. Como o resultado definitivo já é persistido em `game_rounds` e a movimentação financeira em `wallet_transactions`, manter o mapa secreto não traz benefício.

A 3.8.1a passa a excluir a sessão secreta depois de `lost`, `cashout` ou `perfect`, apenas depois de registrar a rodada e montar a resposta pública para o cliente.

---

## PHASE3.8.2_AUTHORITATIVE_CRASH_NOTES.md

# TaihenBet 2.0 — Fase 3.8.2 — Crash do Regime autoritativo

## Objetivo

Mover o resultado financeiro e o ponto de crash do **Crash do Regime** para o PostgreSQL/Supabase. O React continua responsável pela animação, som e gráfico, mas deixa de decidir se uma retirada foi válida.

## Nova sessão privada

A tabela `public.crash_regime_sessions` armazena:

- id da rodada;
- usuário;
- entrada;
- ponto secreto de confisco;
- horário de início do servidor;
- estado da operação;
- payout/multiplicador final;
- saldos pós-entrada e pós-liquidação.

A tabela tem RLS habilitada e `anon`/`authenticated` não possuem `SELECT` direto. O ponto de confisco é acessado somente pelas funções `SECURITY DEFINER`.

## RPCs

### `start_crash_regime(p_stake)`

- valida a entrada;
- impede duas operações ativas simultâneas para a mesma conta;
- debita a carteira por `_wallet_apply`;
- gera e sela o ponto de crash no servidor;
- inicia o relógio **depois** da confirmação do débito;
- retorna apenas o estado público.

### `get_crash_regime(p_session_id)`

- usa `clock_timestamp()` do servidor;
- calcula o multiplicador pela diferença entre `started_at` e o relógio do banco;
- se o ponto secreto já tiver sido atingido, liquida a derrota;
- enquanto a sessão estiver ativa, retorna `crashPoint: null`.

### `cashout_crash_regime(p_session_id)`

- recebe apenas o id da sessão;
- NÃO recebe multiplicador do navegador;
- trava a linha da sessão;
- calcula novamente o multiplicador usando o relógio do servidor;
- se o crash já aconteceu, registra derrota;
- caso contrário, credita o payout via `_wallet_apply` e encerra como `cashout`;
- é idempotente para uma sessão já resolvida.

## Ledger e histórico

Toda operação usa o mesmo UUID como `external_id`:

- `game_stake` na entrada;
- `game_payout` apenas se houver retirada bem-sucedida.

A rodada final também é salva em `game_rounds` com `game = 'crash-regime'`.

## Fechamento da ponte genérica

`credit_game_payout()` passa a recusar payout genérico de:

- Taigrinho;
- TaiMandioca;
- Crash do Regime.

Assim, um cliente não pode usar a função de payout antiga para fabricar uma vitória desses jogos autoritativos.

## Persistência / F5

Ao montar a página de Jogos, o frontend chama `get_crash_regime(null)`.

Se existir operação ativa:

- ela é restaurada com a mesma entrada e mesmo `startedAt`;
- não existe novo débito;
- o gráfico é reconstruído a partir do relógio retornado pelo servidor;
- o ponto secreto continua oculto.

## O que ainda é visual no cliente

O React ainda calcula uma curva local para **desenhar** o multiplicador entre os polls. Isso não possui autoridade financeira. A retirada sempre é recalculada no servidor no instante em que `cashout_crash_regime()` é recebido.

## Teste de segurança principal

Enquanto `status = active`, as respostas de `start_crash_regime` e `get_crash_regime` devem conter:

- `sessionId` / `roundId`;
- `startedAt`;
- `serverNow`;
- `multiplicadorAtual`;
- `retornoAtual`;
- `crashPoint: null`.

O valor real de `crash_point` só pode ser revelado depois que a rodada já estiver encerrada.

---

## PHASE3.8.2a_VISUAL_CLEANUP_NOTES.md

# TaihenBet 2.0 — Phase 3.8.2a — Visual Cleanup

## Objetivo
Remover os últimos resquícios do **roxo antigo** em telas e componentes que ainda não tinham sido adaptados à nova identidade visual da TaihenBet 2.0.

## Alterações aplicadas

### 1) Telas pós-jogo
Atualizadas as telas/resultados de:
- **TaiMandioca**
- **Taigrinho**
- **Crash do Regime**

Ajustes visuais:
- gradientes migrados para a paleta nova
- destaques roxos trocados por tons de **vinho / rosa / dourado**
- botões de continuação e coleta alinhados com a nova identidade
- cards de resultado com fundos mais quentes e consistentes

### 2) Botão do Neytai
Atualizado o botão flutuante do Neytai:
- borda
- glow
- fundo
- badge/notificação
- avatar frame

### 3) Fundos das mensagens
Atualizados os fundos e destaques de mensagens/cards do ecossistema de jogos:
- balões e painéis do Neytai
- cards oráculo/comunicado
- cards laterais de apoio
- blocos de instrução/tip/progresso

## Arquivos alterados
- `src/components/GamesPage.css`
- `src/components/NeytaiAssistant.css`

## Observações
- Patch **somente visual**.
- Não altera regras de negócio.
- Não altera banco de dados.

---

## PHASE3.8.2c_CRASH_STABILITY_NOTES.md

# TaihenBet 2.0 — Phase 3.8.2c

## Crash do Regime — estabilidade e cleanup

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
3. registra o ledger em `wallet_transactions` quando aplicável;
4. monta a resposta final;
5. remove a linha de `crash_regime_sessions`.

Assim, a tabela de sessão guarda apenas operações realmente ativas.

### Idempotência
Se uma requisição atrasada consultar o ID de uma sessão já apagada, `get_crash_regime`
reconstrói o comprovante usando `game_rounds`.

### Teste sugerido
1. Inicie Crash com 10 T.
2. Abra F12 > Network.
3. Confirme que `get_crash_regime` aparece aproximadamente 2 vezes por segundo, e não dezenas.
4. Faça cashout ou espere perder.
5. Atualize `crash_regime_sessions`: deve ficar sem a sessão encerrada.
6. Confira `game_rounds` e `wallet_transactions`.

---

## PHASE3.8.3_DERBY_NOTES.md

# TaihenBet 2.0 — Phase 3.8.3

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

## PHASE3.9_SECURITY_NOTES.md

# TaihenBet 2.0 — Phase 3.9 — Bank Hardening

A Fase 3.8 moveu os quatro Jogos da Entidade para o servidor. A Fase 3.9 remove pontes antigas que continuavam existindo por compatibilidade e reforça as fronteiras do banco.

## Fechamentos principais

### 1. Payout genérico de minigame removido
`credit_game_payout()` deixa de ter `EXECUTE` para `authenticated` e a implementação passa a rejeitar qualquer chamada. Taigrinho, TaiMandioca, Crash do Regime e Taihen Derby devem pagar exclusivamente pelas suas próprias RPCs autoritativas.

### 2. `spend_taicoins()` não cria mais `game_stake`
A função genérica fica reservada ao módulo esportivo legado. Entradas dos Jogos da Entidade são debitadas dentro de `play_taigrinho`, `start_taimandioca`, `start_crash_regime` e `start_derby`.

### 3. Migração de saldo local encerrada
`resolve_legacy_balance()` mantém a assinatura antiga para compatibilidade, porém ignora números enviados pelo navegador. Uma conta não migrada apenas confirma o saldo já existente no PostgreSQL.

Isso elimina o cenário em que um cliente novo poderia enviar um `p_local_balance` arbitrário e transformá-lo em patrimônio da conta.

### 4. RLS de perfis endurecida
Leitura direta de `profiles` passa a ser:
- usuário comum: apenas o próprio perfil;
- administrador: todos os perfis;
- anônimo: sem `SELECT` direto.

O ranking público continua disponível pela RPC `get_public_ranking()`, que expõe somente o contrato público do ranking.

### 5. Ledger e rodadas
`wallet_transactions` e `game_rounds`:
- sem INSERT/UPDATE/DELETE direto para o navegador;
- usuário lê as próprias linhas;
- administrador pode auditar todas.

### 6. Segredos dos jogos
`taimandioca_sessions`, `crash_regime_sessions` e `derby_sessions` continuam com todos os privilégios removidos de `anon` e `authenticated`.

### 7. Núcleo da carteira
`_wallet_apply()` agora valida:
- tipo da operação;
- limite absoluto por mutação;
- `external_id` obrigatório e com tamanho limitado;
- metadata obrigatoriamente JSON object;
- limite de tamanho da metadata;
- saldo final entre zero e o teto da banca.

### 8. Ranking dos minigames
As estatísticas dos Jogos da Entidade deixam de confiar no `games_history` sincronizado pelo navegador. Contagem, vitórias, derrotas, entrada e payout de minigames passam a vir de `game_rounds`.

O histórico esportivo continua legado nesta fase.

## Fora do escopo

O módulo de apostas esportivas ainda possui estado/resolução no cliente e `credit_sports_payout`. Ele precisa de uma migração autoritativa própria antes de ser tratado como resistente a manipulação via DevTools.

---

## PHASE3.10_SPORTS_NOTES.md

# TaihenBet 2.0 — Phase 3.10 — Authoritative Sports

## O que mudou

### Bilhete autoritativo
`place_sports_bet()` recebe apenas:
- stake;
- IDs dos mercados/opções;
- um request ID de idempotência.

O servidor busca as odds oficiais, trava snapshots das seleções, calcula a odd total,
debita a carteira e registra o bilhete numa única transação.

### Novas tabelas
- `sports_markets`
- `sports_league_state`
- `sports_bets`
- `sports_bet_selections`
- `bahrain_market_templates`

As tabelas não são API pública do navegador; leitura/escrita normal acontece por RPC.

### Administração
- `admin_publish_bahrain_round()`
- `admin_save_sports_market()`
- `admin_toggle_sports_market()`
- `admin_archive_sports_market()`
- `admin_clear_settled_sports_markets()`
- `admin_resolve_sports_market()`
- `admin_resolve_sports_bet()`

Ao definir o resultado de um mercado, o PostgreSQL atualiza as seleções, encerra
bilhetes derrotados e paga automaticamente bilhetes completos vencedores.

### Pontes antigas desligadas
- `spend_taicoins()` deixa de aceitar apostas esportivas diretas.
- `credit_sports_payout()` é desativada para o cliente.

### Histórico e ranking
O histórico esportivo novo vem de `sports_bets`.
O histórico legado já importado é preservado, mas não pode mais ser reescrito pelo navegador.
O ranking soma legado + bilhetes autoritativos + `game_rounds`.

### Mercados customizados
A aba de edição do Painel continua funcionando, mas mercados novos/alterados agora
são persistidos pelo servidor. Se houver bilhete pendente num mercado, o servidor
impede reescrever suas opções/odds até a situação ser resolvida.

---

## PHASE3.10a_NOTES.md

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

---

## PHASE3.11_NOTES.md

# TaihenBet 2.0 — Phase 3.11 — Community Spaces + Grupo TaihenBet

## Museu
O Museu passa a combinar o acervo original com publicações da comunidade.

Usuários autenticados podem publicar:
- imagem ou vídeo;
- título;
- descrição;
- categoria.

Cada publicação mostra o `profiles.username` da conta responsável.
Arquivos ficam no bucket `museum-community` em uma pasta com o UUID do autor.

O cliente não recebe permissão direta de escrita em `museum_posts`.
Criação e exclusão passam por RPCs com `auth.uid()`.

## Para a Tai
A antiga carta fixa foi removida da interface.
A página agora é um mural coletivo.

Usuários autenticados podem escrever mensagens de até 1600 caracteres.
Cada mensagem mostra o nome da conta autora e a data.

## Empresas do Grupo TaihenBet
Nova página pública **Grupo** na navegação.

Ela funciona como um organograma/paródia corporativa do universo da TaihenBet.
O SQL já cadastra quatro empresas iniciais:
- NASA;
- SIV;
- DJI;
- Taihen Airlines.

A própria página deixa explícito que as participações são fictícias e que não existe vínculo ou aquisição real das organizações citadas.

Cada card possui:
- nome;
- símbolo/sigla;
- setor;
- slogan;
- descrição;
- status corporativo e tom visual.

### Administração
Conta comum apenas visualiza.
Conta com `profiles.role = 'admin'` recebe, dentro da página Grupo:
- `+ Registrar empresa`;
- editar empresa;
- excluir empresa.

O navegador não recebe `INSERT`, `UPDATE` ou `DELETE` direto na tabela `taihen_group_companies`.
A administração usa RPCs protegidas por `is_current_user_admin()`.

RPCs:
- `get_taihen_group_companies`
- `admin_upsert_taihen_group_company`
- `admin_delete_taihen_group_company`

## Moderação da comunidade
- dono pode remover a própria publicação/mensagem;
- admin pode remover qualquer publicação/mensagem;
- e-mails não são expostos;
- textos são renderizados como texto pelo React, sem HTML do usuário.

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

## PHASE3.18_NOTES.md

# Fase 3.18 — TaiShop

A loja adiciona uma economia cosmética sem alterar odds ou resultados dos jogos.

## Segurança / saldo

O navegador nunca recebe permissão para atualizar `profiles.balance` diretamente.
`buy_taishop_cosmetic()` chama a função interna endurecida `_wallet_apply()` e usa
uma operação `admin_adjustment` com metadata `source = taishop`. Isso preserva a
allowlist da carteira da Fase 3.9 e mantém o débito no ledger sem reabrir uma RPC
genérica de gasto para o cliente.

## Persistência

- catálogo: `cosmetic_catalog`;
- inventário: `user_cosmetics`;
- slots equipados: colunas `equipped_*` em `profiles`;
- aparência pública: `get_public_profile()` retorna apenas os IDs equipados.

## Slots

Cada conta pode exibir simultaneamente:
- 1 moldura de avatar;
- 1 cor de nome;
- 1 efeito de perfil;
- 1 badge.

Comprar não equipa automaticamente. Desequipar não remove o item do inventário.

---

## PHASE3.18a_NOTES.md

# Fase 3.18a — Header Layout Hotfix

Hotfix visual e isolado para a regressão de navegação observada após a entrada da TaiShop.

## Alteração

`HeaderLayoutHotfix.css` é importado **depois** do tema principal para atuar apenas como camada de override. Em desktop ele:

- força `header`, `navigation` e `header-account-zone` a permanecerem sem quebra de linha;
- permite que a navegação utilize o espaço flexível central;
- reduz gaps e paddings progressivamente entre 1181px e 1460px;
- mantém labels em `white-space: nowrap`;
- não interfere nas regras responsivas antigas abaixo de 1181px.

## Não alterado

- Supabase;
- saldo/carteira;
- TaiShop;
- inventário;
- equipamentos cosméticos;
- Central de Notificações;
- perfis públicos;
- rotas e lógica de navegação.

---

## PHASE3.19_NOTES.md

# Fase 3.19 — Missões Diárias e Semanais

## Objetivo

Fechar o loop da economia fictícia do TaihenBet:

`atividade → missão → recompensa → TaiShop → perfil público`

## Fonte do progresso

A Fase 3.19 não confia em contadores enviados pelo navegador.
Triggers observam tabelas que já são autoritativas no projeto:

- `game_rounds` → `game_play`;
- `sports_bets` → `sports_bet`;
- `wallet_transactions` com amount negativo → `taicoins_spent`.

Os eventos deduplicados ficam em `mission_events`.

## Resgates

`claim_my_mission()` recalcula o progresso no servidor antes de liberar a
recompensa. Cada missão possui uma chave de período e `user_mission_claims`
impede resgate duplicado.

As TaiCoins são creditadas por `_wallet_apply()` usando `admin_adjustment` com
metadata `source = missions`, preservando o endurecimento de carteira da 3.9.

## Fuso / reset

As janelas usam `America/Sao_Paulo`:

- diária: 00:00 → 23:59 do dia;
- semanal: segunda 00:00 → próxima segunda 00:00.

## Recompensa exclusiva

`badge_weekly_auditor` é inserido no catálogo de cosméticos como ativo, porém
`shop_visible = false`. Assim:

- pode ser equipado pelo sistema normal da 3.18;
- aparece no perfil público;
- não pode ser comprado na TaiShop.

## Compatibilidade

A RPC pública da TaiShop foi ajustada para esconder itens `shop_visible = false`
e o estado da loja conta apenas cosméticos compráveis, evitando contadores como
"13/12" depois do badge de missão ser adquirido.

---

## PHASE3.20_NOTES.md

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

---

## PHASE3.20a_NOTES.md

# Fase 3.20a — Hotfix do avatar do ranking sazonal

## Correção

`avatarDoPerfil()` retorna o objeto de configuração do avatar. O ranking sazonal estava entregando esse objeto inteiro ao atributo `src` da imagem.

A renderização agora usa:

```jsx
avatarDoPerfil(user.avatar_key)?.src
```

Isso alinha a aba Evento ao comportamento já corrigido em Perfis Públicos/TaiShop.

## Escopo

- sem alteração no Supabase;
- sem alteração em pontos de temporada;
- sem alteração em missões;
- sem alteração em recompensas;
- sem alteração nas datas da temporada;
- sem alteração no perfil público.

---

## PHASE3.21_NOTES.md

# TaihenBet 2.0 — Fase 3.21

## Comentários e Reações no Museu

A fase transforma as publicações comunitárias do Museu em peças sociais persistentes.

### Reações

- `🍠 Mandioca`
- `🔥 Fogo`
- `😭 Sofrimento`
- `💸 Falência`

Existe uma reação por conta em cada publicação. Repetir a reação ativa remove o voto; escolher outra substitui a anterior. A primeira reação de outra pessoa gera uma notificação para o autor da peça, mas trocas de emoji não geram spam.

### Comentários

Comentários têm de 1 a 600 caracteres e ficam vinculados à conta autora. O próprio autor pode apagá-los pelo Museu. Administradores removem comentários pela Central de Moderação para que a ação fique registrada no log administrativo.

### Notificações

A Central da Banca recebe o novo tipo `museum`:

- nova reação em publicação própria;
- novo comentário em publicação própria;
- remoção administrativa continua usando o tipo `moderation`.

Ações feitas no próprio conteúdo não geram notificação para si mesmo.

### Segurança

As tabelas sociais usam RLS e não concedem escrita direta a `anon`/`authenticated`. Alterações passam por RPCs `security definer`, validam autenticação e preservam o bloqueio de contas suspensas da Fase 3.14.

### Moderação

A Central de Moderação recebe:

- contador de comentários;
- aba **Comentários**;
- busca por autor, peça ou conteúdo;
- remoção administrativa;
- ação `museum_comment_removed` no log;
- notificação automática ao autor do comentário removido.

### Compatibilidade

`get_museum_posts()` permanece intacta. A interface da Fase 3.21 usa `get_museum_posts_social()` para receber também os contadores de reação e comentário.

---

## PHASE3.22_NOTES.md

# TaihenBet 2.0 — Fase 3.22

## Feed de Atividades / Mural da Comunidade

A fase adiciona a nova aba **Feed**, uma linha do tempo pública que conecta os sistemas sociais e de progressão já existentes.

### Atividades registradas

- conquistas desbloqueadas;
- publicações da comunidade no Museu;
- comentários publicados no Museu;
- missões diárias e semanais resgatadas;
- objetivos sazonais resgatados;
- marcos da temporada resgatados;
- títulos equipados;
- cosméticos equipados.

### Integrações

- avatar/nome levam ao perfil público;
- cada atividade pode levar para Museu, Missões, Evento, Conquistas ou perfil;
- atividades antigas compatíveis são importadas no primeiro run do SQL;
- publicações/comentários removidos deixam de aparecer no Feed;
- contas suspensas deixam de aparecer enquanto a suspensão estiver ativa;
- saldo, e-mail, histórico bruto, autenticação e ações de moderação não são expostos.

### Filtros

O mural possui filtros por tipo de atividade e paginação em blocos de 20 registros.

---

## PHASE3.22a_NOTES.md

# Fase 3.22a — Feed Hotfix

A causa do erro do filtro **Museu** era uma divergência de identificadores:
- UI: `museu`
- RPC `get_community_activity_feed`: `museum`

O hotfix centraliza essa tradução antes da chamada ao Supabase.
Também adiciona proteção contra respostas assíncronas fora de ordem e deduplicação na paginação.

---

## PHASE3.23_NOTES.md

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

---

## PHASE3.23a_NOTES.md

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

---

## PHASE3.23c_NOTES.md

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

---

## UPDATE_2.0_NOTES.md

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

## Atualização 2.0.1 — Banca Cruel

- Removido o teto artificial de 10.000.000 TaiCoins da carteira autoritativa; o SQL da atualização amplia as colunas monetárias e mantém a proteção contra saldo negativo.
- Taigrinho rebalanceado: vitórias forçadas muito mais raras, símbolo Tai mais raro e pagamentos reduzidos.
- TaiMandioca passa a oferecer 8, 11, 14 ou 17 armadilhas; sessões antigas continuam compatíveis no servidor.
- Crash Regime passa a concentrar a grande maioria das quedas em multiplicadores baixos; multiplicadores altos continuam possíveis, mas raríssimos.
- Derby: a corredora escolhida cai de 5% para 2% de chance real; o Protocolo Mambo sobe para 98%.
- Nenhuma dificuldade adaptativa por saldo e nenhum sistema de piedade: as probabilidades são iguais para todos.

## Atualização 2.0.1c — Crash Security Hotfix

- Corrigido o exploit de retirada garantida do Crash do Regime: cashout agora só é aceito pelo servidor a partir de 1.10x.
- A validação usa o multiplicador bruto calculado pelo relógio do servidor antes do arredondamento.
- Adicionado mutex/rate limit server-side de 1 segundo entre novas rodadas por conta para conter automação abusiva e concorrência.
- A tabela de sessões, a tabela de rate limit e todos os helpers do Crash ficam sem acesso direto para anon/authenticated.
- Apenas get_crash_regime, start_crash_regime e cashout_crash_regime voltam a ter EXECUTE para authenticated.
- O frontend bloqueia visualmente o botão antes de 1.10x, mas a regra de segurança permanece autoritativa no banco.

