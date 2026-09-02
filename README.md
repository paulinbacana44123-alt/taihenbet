# TaihenBet 2.0

> **Paródia antiapostas.** A TaihenBet não é uma casa de apostas, não movimenta dinheiro real e não oferece prêmios, depósitos ou saques. Tudo funciona com **TaiCoins fictícias** e sistemas criados exclusivamente para humor, aprendizado e experimentação em desenvolvimento web.

A **TaihenBet** começou como uma piada e, por algum motivo completamente desnecessário, evoluiu para uma aplicação web com autenticação, carteira virtual, minijogos, apostas fictícias, perfis, missões, temporadas, loja de cosméticos, moderação, painel administrativo e um assistente chamado **Neytai**.

O projeto foi desenvolvido como exercício prático de programação e acabou servindo para experimentar integração entre frontend, banco de dados, autenticação, regras server-side, realtime, administração de conteúdo e deploy.

## 🌐 Acesso

**Produção:** https://taihenbet.vercel.app

## 🎰 O que existe no site

A versão 2.0 reúne, entre outras coisas:

- autenticação de usuários com Supabase;
- carteira persistente de TaiCoins e histórico de movimentações;
- minijogos fictícios: TaiMandioca, Taigrinho, Crash do Regime e Taihen Derby;
- mercados e apostas esportivas fictícias;
- ranking e histórico de decisões financeiras questionáveis;
- perfis públicos, avatares, títulos e estatísticas;
- conquistas e progressão;
- Central de Notificações;
- TaiShop com cosméticos de perfil;
- missões diárias e semanais;
- eventos, temporadas, prestígio, marcos e ranking sazonal;
- Museu comunitário com publicações, reações e comentários;
- Feed de atividades da comunidade;
- Grupo TaihenBet e suas empresas totalmente fictícias;
- códigos promocionais administráveis;
- área de mensagem do criador;
- Neytai, assistente/tour interno do site;
- painel administrativo com moderação, controle de contas e carteira;
- Central de Conteúdo para editar textos, conquistas, missões, temporada, empresas, loja, códigos e falas do Neytai sem alterar o código-fonte.

## 🧠 Neytai

O **Neytai** é o assistente interno da TaihenBet. Ele conduz o tour pelo site, explica as áreas e serve como parte da identidade do projeto.

As falas podem ser personalizadas pelo próprio painel administrativo sem alterar diretamente os arquivos do frontend. O tour também inclui o pós-créditos que revela o **Recado do Criador**.

## 🛠️ Tecnologias

- **React**
- **Vite**
- **Supabase**
- **PostgreSQL / PLpgSQL**
- **CSS**
- **Vercel** para deploy

O Supabase é usado para autenticação, persistência de dados e diversas regras executadas no servidor, reduzindo a dependência de validações apenas no navegador.

## 📁 Estrutura geral

```text
TaihenBet/
├── public/                 # arquivos públicos
├── src/
│   ├── assets/             # imagens e outros assets
│   ├── components/         # páginas e componentes React
│   ├── data/               # definições e dados auxiliares
│   ├── hooks/              # hooks do projeto
│   └── lib/                # integrações e utilitários
├── supabase/               # migrations e scripts SQL do projeto
├── HISTORICO_DESENVOLVIMENTO.md
├── index.html
├── package.json
└── README.md
```

## 🚀 Rodando localmente

Requisitos:

- Node.js instalado;
- um projeto Supabase configurado;
- as variáveis de ambiente esperadas pela integração localizada em `src/lib/`.

Instale as dependências:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Para validar o build de produção:

```bash
npm run build
npm run preview
```

> O arquivo `.env` contém configuração local e **não deve ser enviado ao repositório**.

## 🗄️ Banco de dados

As migrations e funções SQL utilizadas durante o desenvolvimento estão em:

```text
supabase/
```

O projeto foi evoluindo em fases, portanto a pasta também funciona como registro das alterações feitas no banco ao longo do desenvolvimento.

Para entender a evolução completa do projeto, consulte:

**[`HISTORICO_DESENVOLVIMENTO.md`](./HISTORICO_DESENVOLVIMENTO.md)**

## 👑 Administração

Contas com privilégios administrativos possuem acesso ao **Painel**, que concentra ferramentas como:

- moderação de conteúdo;
- gerenciamento de usuários;
- ajustes auditados de TaiCoins;
- gerenciamento de mercados;
- edição do conteúdo do site;
- personalização das falas do Neytai;
- gerenciamento de empresas;
- gerenciamento de códigos promocionais.

Alguns identificadores técnicos continuam protegidos de edição propositalmente para evitar que alterações de conteúdo quebrem relações internas do sistema.

## 🔐 Segurança e privacidade

O projeto separa conteúdo público de informações privadas de conta. Recursos públicos não devem expor e-mail, dados de autenticação ou histórico bruto sensível.

Segredos administrativos e chaves privadas **nunca devem ser colocados no frontend ou commitados no Git**. O cliente deve utilizar apenas as credenciais públicas apropriadas ao Supabase e depender de RLS/funções server-side para operações protegidas.

## 📜 Histórico

Durante o desenvolvimento foram criados vários arquivos `PHASE*.md` para documentar patches, hotfixes e sistemas individuais.

Na versão 2.0 essas anotações foram consolidadas em um único arquivo para manter a raiz do repositório organizada:

**[`HISTORICO_DESENVOLVIMENTO.md`](./HISTORICO_DESENVOLVIMENTO.md)**

## ⚠️ Aviso

A TaihenBet é uma **paródia**. Não existe dinheiro real, saque, depósito ou promessa de retorno financeiro. Referências a empresas, pessoas, esportes ou eventos são utilizadas dentro do contexto humorístico/fictício do projeto e não representam relações comerciais reais.

## ❤️ Sobre o projeto

A TaihenBet nasceu como uma piada, mas acabou virando um projeto onde muita coisa foi aprendida na prática — normalmente depois de algum bug aparecer exatamente quando parecia que tudo finalmente estava funcionando.

Se você abriu o site, explorou alguma página, reconheceu uma referência idiota ou simplesmente quis descobrir até onde a brincadeira foi levada, então o projeto já cumpriu sua função.

---

**TaihenBet 2.0** — sob supervisão do Oráculo das Odds.
