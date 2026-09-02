// Fase 3.23a — fonte única das falas padrão do Neytai.
// Os campos técnicos (id, pagina, alvo, modo, jogo, adminOnly, numero, grupo)
// continuam definidos no código. A Central de Conteúdo só sobrescreve texto.
export const NEYTAI_DEFAULT_STEPS = {
  "boasVindas": {
    "id": "boasVindas",
    "numero": 1,
    "grupo": "INÍCIO",
    "pagina": "inicio",
    "alvo": "sports-button",
    "modo": "alvo",
    "titulo": "Prazer, eu sou o Neytai.",
    "texto": "SEJA BEM VINDA, eu sou Neytai, seu assistente que irá te guiar pelo site, porque o burro que me programou fez um site muito confuso, já que ele é incompetente, então ele precisou me criar pra conseguir te guiar pelo site. Não por culpa sua, mas dele. Enfim, vamos na nossa jornada: clique no botão das apostas esportivas.",
    "instrucao": "Clique no botão destacado para começar o passeio.",
    "dicas": [
      "O tour pode ser minimizado a qualquer momento.",
      "Quando eu sumir, minha cabecinha ficará no canto da tela."
    ]
  },
  "apostas": {
    "id": "apostas",
    "numero": 2,
    "grupo": "APOSTAS ESPORTIVAS",
    "pagina": "inicio",
    "alvo": "sports-section",
    "modo": "pausa",
    "titulo": "Futebol bareinita, aparentemente.",
    "texto": "Aqui ficam as apostas esportivas da Liga do Bahrein. Agora a parte importante: o navegador só escolhe o que você quer apostar; a banca no servidor confere mercado, odd, saldo e resultado. Então nem adianta tentar convencer a tela de que você ganhou na força do pensamento.",
    "botaoPausa": "Vou observar essa liga",
    "dicas": [
      "Existem quatro partidas por rodada.",
      "Tudo usa TaiCoins fictícias e nenhum prêmio real.",
      "Resultados e pagamentos são liquidados pela banca no servidor."
    ]
  },
  "clubesBahrein": {
    "id": "clubesBahrein",
    "numero": 3,
    "grupo": "APOSTAS ESPORTIVAS",
    "pagina": "inicio",
    "alvo": "sports-clubs",
    "modo": "pausa",
    "titulo": "Os oito escolhidos do Bahrein.",
    "texto": "Aqui estão os oito times da liga: Muharraq, Al Khaldiya, Riffa, A’ali, Malkiya, Hidd, Al Ahli e Sitra. Não precisa decorar nenhum, até porque eu duvido que o programador saiba apontar o Bahrein no mapa sem pesquisar antes.",
    "botaoPausa": "Fingi que decorei todos",
    "dicas": [
      "O Painel alterna os confrontos em sete rodadas.",
      "A banca pode abrir, suspender e encerrar mercados."
    ]
  },
  "bilhete": {
    "id": "bilhete",
    "numero": 4,
    "grupo": "APOSTAS ESPORTIVAS",
    "pagina": "inicio",
    "alvo": "sports-betslip",
    "modo": "pausa",
    "titulo": "O bilhete do arrependimento.",
    "texto": "Para apostar, clique em 1, X ou 2. As escolhas entram no bilhete e você pode combinar partidas. Quando confirma, o servidor trava as odds daquele instante, debita a entrada e guarda o bilhete. Se for múltipla, ela só paga quando todas as seleções forem vencedoras; uma derrota mata a obra inteira.",
    "botaoPausa": "Entendi o 1, X e 2",
    "dicas": [
      "Você pode remover uma seleção antes de confirmar.",
      "A odd da combinada é o produto das odds travadas.",
      "O retorno é creditado automaticamente quando o bilhete é liquidado."
    ]
  },
  "saldo": {
    "id": "saldo",
    "numero": 5,
    "grupo": "ECONOMIA FICTÍCIA",
    "pagina": "inicio",
    "alvo": "wallet",
    "modo": "pausa",
    "titulo": "A economia que não vale absolutamente nada.",
    "texto": "Esse número no canto é o seu saldo de TaiCoins. Agora ele pertence à sua conta, fica salvo no banco e atualiza em tempo real quando a banca debita ou paga alguma coisa. Elas continuam não podendo ser compradas, vendidas, sacadas nem usadas para pagar um pastel.",
    "botaoPausa": "Aceitei o capitalismo fictício",
    "dicas": [
      "O anúncio opcional entrega 20 TaiCoins depois do vídeo.",
      "Nos Jogos existe uma bênção diária gratuita.",
      "A carteira deixa um registro das movimentações no servidor."
    ]
  },
  "conta": {
    "id": "conta",
    "numero": 6,
    "grupo": "CONTA",
    "pagina": "inicio",
    "alvo": "account-menu",
    "modo": "pausa",
    "titulo": "Você agora possui ficha criminal persistente.",
    "texto": "Esse canto guarda sua conta, nome e avatar. O perfil, o saldo, o ranking e o histórico deixam de depender do navegador e acompanham a conta. O e-mail fica fora das áreas públicas; o que aparece para os outros é o nome que você escolheu para a TaihenBet.",
    "botaoPausa": "Minha identidade foi catalogada",
    "dicas": [
      "Seu avatar e nome podem ser alterados no perfil.",
      "O Museu e o Para a Tai usam o nome da conta como autoria.",
      "Administradores recebem funções extras; clientes normais não veem o Painel."
    ]
  },
  "irJogos": {
    "id": "irJogos",
    "numero": 7,
    "grupo": "NAVEGAÇÃO",
    "pagina": "inicio",
    "alvo": "nav-jogos",
    "modo": "alvo",
    "titulo": "Chega de futebol por enquanto.",
    "texto": "Agora suba e clique no botão dos joguinhos.",
    "instrucao": "O botão Jogos está destacado no menu."
  },
  "bonusJogos": {
    "id": "bonusJogos",
    "numero": 8,
    "grupo": "JOGOS DA ENTIDADE",
    "pagina": "jogos",
    "jogo": "taimandioca",
    "alvo": "daily-bonus",
    "modo": "pausa",
    "titulo": "A esmola diária da banca.",
    "texto": "Antes de arriscar sua dignidade, esse botão entrega uma pequena quantidade de TaiCoins uma vez por dia. É chamado de bênção diária porque “auxílio emergencial da banca” ficou grande demais no layout.",
    "botaoPausa": "Obrigado pela esmola",
    "dicas": [
      "O bônus não exige anúncio.",
      "Depois de recebido, ele fica bloqueado até o próximo dia."
    ]
  },
  "taimandioca": {
    "id": "taimandioca",
    "numero": 9,
    "grupo": "JOGOS DA ENTIDADE",
    "pagina": "jogos",
    "jogo": "taimandioca",
    "alvo": "game-area-taimandioca",
    "modo": "pausa",
    "titulo": "Primeira parada: agricultura de risco.",
    "texto": "Bem-vinda ao TaiMandioca. Escolha os quadradinhos tentando achar as TaiMandiocas e fuja das mandiocas normais. O tabuleiro e a sessão são decididos no servidor; até um F5 no meio da colheita não revela onde estão as armadilhas nem apaga a sessão ativa.",
    "botaoPausa": "Vou tentar não ser mandiocada",
    "dicas": [
      "Você pode recolher o prêmio antes de completar o tabuleiro.",
      "Quanto mais TaiMandiocas encontrar, maior o multiplicador.",
      "O servidor guarda as posições e liquida a colheita."
    ]
  },
  "taigrinho": {
    "id": "taigrinho",
    "numero": 10,
    "grupo": "JOGOS DA ENTIDADE",
    "pagina": "jogos",
    "jogo": "taigrinho",
    "alvo": "game-area-taigrinho",
    "modo": "pausa",
    "titulo": "Agora começa a ruína fictícia.",
    "texto": "Esse aqui é o Taigrinho. Você escolhe o valor e gira; quem decide os símbolos, linhas e prêmio agora é a banca no servidor. Se conseguir um mega-ganho, tem uma surpresa. Quando terminar de jogar, aperte minha cabecinha no canto para continuar.",
    "botaoPausa": "Vou girar essa atrocidade",
    "dicas": [
      "As linhas L1 até L5 mostram as combinações possíveis.",
      "A tabela explica os multiplicadores dos símbolos.",
      "O resultado financeiro não é calculado pelo navegador."
    ]
  },
  "crash": {
    "id": "crash",
    "numero": 11,
    "grupo": "JOGOS DA ENTIDADE",
    "pagina": "jogos",
    "jogo": "crash-regime",
    "alvo": "game-area-crash-regime",
    "modo": "pausa",
    "titulo": "O mercado livre acabou.",
    "texto": "Esse é o Crash do Regime. A operação começa no servidor, o multiplicador usa o relógio da banca e você tenta retirar antes do ponto de crash. Se der F5, a operação continua existindo e o site consulta o estado real em vez de inventar outro.",
    "botaoPausa": "Vou fugir do regime",
    "dicas": [
      "Quanto mais o multiplicador sobe, maior o retorno.",
      "Se o regime encerrar antes da retirada, a entrada é confiscada.",
      "O payout é liquidado pelo servidor."
    ]
  },
  "derby": {
    "id": "derby",
    "numero": 12,
    "grupo": "JOGOS DA ENTIDADE",
    "pagina": "jogos",
    "jogo": "derby",
    "alvo": "game-area-derby",
    "modo": "pausa",
    "titulo": "Hipódromo do Protocolo Mambo.",
    "texto": "Esse é o Taihen Derby: escolha sua Umamusume, faça a aposta e assista à corrida. A vencedora e o pagamento também vêm do servidor, então editar bonequinho correndo na tela não transforma derrota em dinheiro. Cada corredora ainda tem sua animação de vitória.",
    "botaoPausa": "Vou escolher meu pocotó",
    "dicas": [
      "A corrida continua sendo propositalmente injusta.",
      "As animações são só apresentação; o resultado financeiro já vem da banca.",
      "Sessões ativas sobrevivem a recarregamentos."
    ]
  },
  "catalogoJogos": {
    "id": "catalogoJogos",
    "numero": 13,
    "grupo": "JOGOS DA ENTIDADE",
    "pagina": "jogos",
    "alvo": "games-catalog",
    "modo": "pausa",
    "titulo": "O corredor das decisões ruins.",
    "texto": "Esses quatro cartões trocam rapidamente entre os jogos. As partidas agora alimentam seu histórico persistente da conta, então os fracassos conseguem sobreviver a F5, troca de navegador e tentativas emocionais de negar o passado.",
    "botaoPausa": "Já cometi jogos suficientes",
    "dicas": [
      "TaiMandioca: risco agrícola.",
      "Taigrinho: roleta e humilhação.",
      "Crash: fuga do regime.",
      "Derby: cavalinhos e Protocolo Mambo."
    ]
  },
  "irMuseu": {
    "id": "irMuseu",
    "numero": 14,
    "grupo": "NAVEGAÇÃO",
    "pagina": "jogos",
    "alvo": "nav-museu",
    "modo": "alvo",
    "titulo": "Agora vamos preservar a história.",
    "texto": "Clique em Museu. Ele ainda guarda o acervo antigo, mas agora a comunidade também pode ajudar a produzir provas contra si mesma.",
    "instrucao": "Clique no botão Museu destacado."
  },
  "museu": {
    "id": "museu",
    "numero": 15,
    "grupo": "MUSEU DA TAIHEN",
    "pagina": "museu",
    "alvo": "museum-page",
    "modo": "pausa",
    "titulo": "O acervo deixou de ser monopólio da curadoria.",
    "texto": "Esse é o Museu da Taihen. O acervo original continua aqui, só que agora ele divide espaço com imagens e vídeos publicados por usuários. Cada peça da comunidade mostra quem postou, então o crime cultural finalmente possui autoria.",
    "botaoPausa": "Vou analisar as provas",
    "dicas": [
      "O acervo mistura relíquias oficiais e publicações da comunidade.",
      "Imagens, GIFs e vídeos podem ser abertos em tela cheia.",
      "O nome público da conta aparece nas peças comunitárias."
    ]
  },
  "museuPublicar": {
    "id": "museuPublicar",
    "numero": 16,
    "grupo": "MUSEU DA TAIHEN",
    "pagina": "museu",
    "alvo": "museum-community-composer",
    "modo": "pausa",
    "titulo": "Você também pode contaminar o acervo.",
    "texto": "Usuários logados podem registrar uma evidência com título, descrição, setor e uma imagem ou vídeo. O arquivo vai para o Storage da banca e a postagem fica vinculada à conta que enviou. O autor pode apagar o próprio conteúdo e a administração pode moderar quando necessário.",
    "botaoPausa": "Entendi a responsabilidade histórica",
    "dicas": [
      "O limite atual de upload é 50 MB.",
      "A autoria vem da conta autenticada, não de um nome digitado no formulário.",
      "Excluir a própria peça remove a publicação do acervo."
    ]
  },
  "museuFerramentas": {
    "id": "museuFerramentas",
    "numero": 17,
    "grupo": "MUSEU DA TAIHEN",
    "pagina": "museu",
    "alvo": "museum-filters",
    "modo": "pausa",
    "titulo": "Como operar um museu sem diploma.",
    "texto": "Esses filtros separam clipes, memes, documentos, formas alternativas e o acervo completo. Clique em qualquer relíquia para abrir em tela cheia; use as setas para navegar e Esc para fugir do patrimônio cultural.",
    "botaoPausa": "Terminei a visita guiada",
    "dicas": [
      "O mural se reorganiza conforme a categoria escolhida.",
      "Vídeos só tocam com som quando forem abertos."
    ]
  },
  "irGrupo": {
    "id": "irGrupo",
    "numero": 18,
    "grupo": "NAVEGAÇÃO",
    "pagina": "museu",
    "alvo": "nav-grupo",
    "modo": "alvo",
    "titulo": "Hora de conhecer a holding.",
    "texto": "Agora clique em Grupo. Em algum momento a TaihenBet decidiu que ser uma banca fictícia não bastava e começou a adquirir organizações inteiras na lore.",
    "instrucao": "Clique no botão Grupo destacado."
  },
  "grupo": {
    "id": "grupo",
    "numero": 19,
    "grupo": "GRUPO TAIHENBET",
    "pagina": "grupo",
    "alvo": "group-page",
    "modo": "pausa",
    "titulo": "Um conglomerado que ninguém autorizou.",
    "texto": "Aqui fica o Grupo TaihenBet: Taihen Airlines, DJI, NASA, SIV, Godot e qualquer outra aquisição fictícia que a diretoria inventar no futuro. Isso é lore e paródia, não vínculo real com essas organizações. Administradores podem cadastrar, editar e excluir empresas; os demais usuários só contemplam o império.",
    "botaoPausa": "Aceitei o organograma suspeito",
    "dicas": [
      "Se uma nova empresa for cadastrada, ela entra automaticamente na grade.",
      "Os cards possuem imagem, setor, slogan, descrição e status.",
      "As relações exibidas aqui são explicitamente fictícias."
    ]
  },
  "irAoVivo": {
    "id": "irAoVivo",
    "numero": 20,
    "grupo": "NAVEGAÇÃO",
    "pagina": "grupo",
    "alvo": "nav-ao-vivo",
    "modo": "alvo",
    "titulo": "Próxima parada: transmissão local.",
    "texto": "Clique em Ao vivo. Talvez esteja completamente vazio, mas pelo menos o vazio é honesto e não inventa cinquenta mil espectadores.",
    "instrucao": "Clique em Ao vivo no menu."
  },
  "aoVivo": {
    "id": "aoVivo",
    "numero": 21,
    "grupo": "SESSÃO AO VIVO",
    "pagina": "ao-vivo",
    "alvo": "live-page",
    "modo": "pausa",
    "titulo": "O ao vivo que só existe quando está vivo.",
    "texto": "Essa página mostra sessões iniciadas manualmente pela banca. Quando existe uma sessão, aparecem cronômetro, mercados escolhidos, bilhetes e atualizações publicadas. Quando não existe, ela admite que está offline, algo raro na internet.",
    "botaoPausa": "Respeito a honestidade do OFF",
    "dicas": [
      "A sessão é iniciada e encerrada no Painel.",
      "Não existem espectadores ou acontecimentos inventados automaticamente.",
      "As atualizações são publicadas pela administração."
    ]
  },
  "irRanking": {
    "id": "irRanking",
    "numero": 22,
    "grupo": "NAVEGAÇÃO",
    "pagina": "ao-vivo",
    "alvo": "nav-ranking",
    "modo": "alvo",
    "titulo": "Vamos medir quem tomou as piores decisões.",
    "texto": "Clique em Ranking. É o lugar onde as contas reais da comunidade recebem uma cerimônia muito mais séria do que os números merecem.",
    "instrucao": "Clique no botão Ranking destacado."
  },
  "ranking": {
    "id": "ranking",
    "numero": 23,
    "grupo": "RANKING",
    "pagina": "ranking",
    "alvo": "ranking-page",
    "modo": "pausa",
    "titulo": "Classificação absolutamente científica.",
    "texto": "O ranking agora usa contas reais cadastradas na TaihenBet e estatísticas agregadas do servidor. Saldo, vitórias, derrotas, taxa de acerto e lucro líquido acompanham a conta. E-mail não é exposto; aparece identidade pública, avatar e os números necessários para o julgamento coletivo.",
    "botaoPausa": "Aceitei minha colocação",
    "dicas": [
      "Sua posição acompanha o patrimônio em TaiCoins.",
      "A taxa de acerto usa resultados liquidados.",
      "O ranking não publica o e-mail das contas."
    ]
  },
  "irProgresso": {
    "id": "irProgresso",
    "numero": 24,
    "grupo": "NAVEGAÇÃO",
    "pagina": "ranking",
    "alvo": "nav-progresso",
    "modo": "alvo",
    "titulo": "A banca começou a distribuir medalhas.",
    "texto": "Clique em Conquistas. Depois de guardar saldo e histórico, o programador decidiu que também precisava transformar decisões questionáveis em currículo.",
    "instrucao": "Clique no botão Conquistas destacado."
  },
  "progresso": {
    "id": "progresso",
    "numero": 25,
    "grupo": "CONQUISTAS E TÍTULOS",
    "pagina": "progresso",
    "alvo": "progression-page",
    "modo": "pausa",
    "titulo": "Seu currículo de ruína agora é persistente.",
    "texto": "Aqui ficam suas estatísticas, conquistas e títulos. O site lê o histórico da conta, registra no banco o que já foi desbloqueado e deixa você equipar um título. Se uma conquista entrou no arquivo da banca, apagar o histórico depois não faz ela desaparecer.",
    "botaoPausa": "Quero meu diploma de prejuízo",
    "dicas": [
      "As estatísticas usam apostas e partidas já sincronizadas da conta.",
      "Cada conquista libera um título equipável.",
      "Conquistas desbloqueadas ficam registradas no Supabase.",
      "Os títulos já ficam preparados para aparecer nos perfis públicos numa fase futura."
    ]
  },
  "irHistorico": {
    "id": "irHistorico",
    "numero": 26,
    "grupo": "NAVEGAÇÃO",
    "pagina": "progresso",
    "alvo": "nav-historico",
    "modo": "alvo",
    "titulo": "Hora de confrontar o passado.",
    "texto": "Clique em Histórico para visitar o arquivo persistente das decisões que pareciam boas cinco minutos atrás.",
    "instrucao": "Clique em Histórico no menu."
  },
  "historico": {
    "id": "historico",
    "numero": 27,
    "grupo": "HISTÓRICO",
    "pagina": "historico",
    "alvo": "history-page",
    "modo": "pausa",
    "titulo": "Arquivo de decisões questionáveis.",
    "texto": "Aqui ficam tanto os bilhetes esportivos quanto as partidas dos Jogos da Entidade. Os registros vêm da conta e do servidor, com entrada, retorno, estado e informações de cada jogo. Ou seja: agora seu passado consegue viajar junto com você.",
    "botaoPausa": "Meu passado está documentado",
    "dicas": [
      "Pendente: ainda existe algo para ser resolvido.",
      "Ganhou e perdeu são definidos pela liquidação da banca.",
      "A página separa apostas esportivas e jogos da entidade."
    ]
  },
  "irPainel": {
    "id": "irPainel",
    "numero": 28,
    "grupo": "NAVEGAÇÃO",
    "pagina": "historico",
    "alvo": "nav-painel",
    "modo": "alvo",
    "adminOnly": true,
    "titulo": "Entrando na sala proibida.",
    "texto": "Como esta conta possui patente administrativa, clique em Painel. Contas comuns nem recebem esse botão; provavelmente é melhor para a estabilidade econômica da comunidade.",
    "instrucao": "Clique no botão Painel destacado."
  },
  "painel": {
    "id": "painel",
    "numero": 29,
    "grupo": "PAINEL ADMINISTRATIVO",
    "pagina": "admin",
    "alvo": "admin-page",
    "modo": "pausa",
    "adminOnly": true,
    "titulo": "O centro de controle da confusão.",
    "texto": "No Painel a banca publica e resolve a Liga do Bahrein, controla sessões ao vivo, administra carteiras e agora possui uma Central de Moderação. Dá para suspender contas sem apagá-las, remover conteúdo comunitário e consultar o rastro das decisões administrativas. A zona de perigo para exclusão definitiva continua separada em Carteiras.",
    "botaoPausa": "Prometo não destruir o site",
    "dicas": [
      "Suspensão bloqueia jogos, apostas e novas publicações no servidor.",
      "A conta suspensa ainda pode entrar e navegar em modo espectador.",
      "Museu e Para a Tai podem ser moderados em um único lugar.",
      "Exclusão definitiva continua exigindo confirmação pelo nome.",
      "Contas comuns não acessam esta área."
    ]
  },
  "irModeracao": {
    "id": "irModeracao",
    "numero": 30,
    "grupo": "PAINEL ADMINISTRATIVO",
    "pagina": "admin",
    "alvo": "admin-moderation-tab",
    "modo": "alvo",
    "adminOnly": true,
    "titulo": "O Ministério da Ordem Questionável.",
    "texto": "Clique em Moderação. É onde a banca troca a marreta da exclusão definitiva por ferramentas um pouco menos nucleares.",
    "instrucao": "Clique na aba Moderação destacada."
  },
  "moderacao": {
    "id": "moderacao",
    "numero": 31,
    "grupo": "CENTRAL DE MODERAÇÃO",
    "pagina": "admin",
    "alvo": "moderation-admin-panel",
    "modo": "pausa",
    "adminOnly": true,
    "titulo": "Suspender, moderar e deixar recibo.",
    "texto": "Aqui ficam usuários, peças do Museu, mensagens Para a Tai e o rastro administrativo. Suspender não apaga a conta: ela continua entrando e olhando tudo, mas o servidor recusa jogos, apostas e novas publicações até a reativação. Remoções de conteúdo e mudanças de suspensão ficam registradas nos Logs.",
    "botaoPausa": "Entendi o Ministério",
    "dicas": [
      "A busca de usuários aceita nome, cargo, status e motivo.",
      "Sua própria conta administrativa não pode ser suspensa aqui.",
      "Arquivos removidos do Museu também são limpos do Storage.",
      "O log registra quem fez a ação, o alvo e a data."
    ]
  },
  "irCentralAnimacoes": {
    "id": "irCentralAnimacoes",
    "numero": 32,
    "grupo": "PAINEL ADMINISTRATIVO",
    "pagina": "admin",
    "alvo": "admin-animation-tab",
    "modo": "alvo",
    "adminOnly": true,
    "titulo": "O arquivo secreto finalmente ficou público.",
    "texto": "Clique na aba Central de Animações. Ela continua sendo o jeito civilizado de ver finais sem sacrificar o saldo em nome da ciência.",
    "instrucao": "Clique na aba Central de animações destacada."
  },
  "centralAnimacoes": {
    "id": "centralAnimacoes",
    "numero": 33,
    "grupo": "CENTRAL DE ANIMAÇÕES",
    "pagina": "admin",
    "alvo": "animation-gallery",
    "modo": "pausa",
    "adminOnly": true,
    "titulo": "Todos os spoilers em um só lugar.",
    "texto": "Aqui ficam os anúncios, falência e finais dos Jogos da Entidade para reprodução manual. Nada desta galeria deve alterar saldo, criar rodada ou mexer no histórico: é laboratório visual, não máquina de imprimir TaiCoins.",
    "botaoPausa": "Vou maratonar os finais depois",
    "dicas": [
      "Use os filtros para separar cada jogo.",
      "Esc fecha vídeos e animações.",
      "Os botões de teste não alteram a carteira."
    ]
  },
  "irInicio": {
    "id": "irInicio",
    "numero": 34,
    "grupo": "NAVEGAÇÃO",
    "alvo": "nav-inicio",
    "modo": "alvo",
    "titulo": "Voltando ao centro da operação.",
    "texto": "Clique em Início para eu explicar as partes gerais que ignoramos enquanto corríamos atrás de mandiocas, ditaduras, cavalos e conglomerados empresariais.",
    "instrucao": "Clique no botão Início destacado."
  },
  "homeGeral": {
    "id": "homeGeral",
    "numero": 35,
    "grupo": "PÁGINA INICIAL",
    "pagina": "inicio",
    "alvo": "home-general",
    "modo": "pausa",
    "titulo": "A central geral da TaihenBet.",
    "texto": "O topo da página inicial continua resumindo a operação: apostas fictícias, quatro minijogos, áreas da comunidade e a Entidade da Banca administrando o caos. É o ponto de entrada para quem não quer decorar a arquitetura inteira desta desgraça.",
    "botaoPausa": "Visão geral absorvida",
    "dicas": [
      "A página inicial reúne atalhos para as áreas principais.",
      "TaiCoins continuam sem qualquer valor financeiro real."
    ]
  },
  "museuPreview": {
    "id": "museuPreview",
    "numero": 36,
    "grupo": "PÁGINA INICIAL",
    "pagina": "inicio",
    "alvo": "home-museum-preview",
    "modo": "pausa",
    "titulo": "Uma amostra grátis do patrimônio.",
    "texto": "Essa prévia mostra uma pequena seleção do Museu sem obrigar ninguém a abrir o acervo completo. O Museu em si agora é maior do que esta vitrine, porque também recebe publicações da comunidade.",
    "botaoPausa": "Já conheço a vitrine",
    "dicas": [
      "Os cards levam ao Museu completo.",
      "O conteúdo comunitário é administrado dentro do próprio Museu."
    ]
  },
  "avisoRodape": {
    "id": "avisoRodape",
    "numero": 37,
    "grupo": "AVISO FINAL",
    "pagina": "inicio",
    "alvo": "anti-betting-footer",
    "modo": "pausa",
    "titulo": "A parte séria no meio da palhaçada.",
    "texto": "Este rodapé repete que a TaihenBet é uma paródia antiapostas sem dinheiro, depósitos, saques ou prêmios reais. Essa mensagem continua valendo mesmo depois de toda a engenharia desnecessariamente séria que foi colocada por trás das TaiCoins.",
    "botaoPausa": "Entendi: apostar é paia",
    "dicas": [
      "A tela de aviso aparece no carregamento da página.",
      "TaiCoins não possuem valor fora da brincadeira."
    ]
  },
  "irParaTai": {
    "id": "irParaTai",
    "numero": 38,
    "grupo": "NAVEGAÇÃO",
    "pagina": "inicio",
    "alvo": "nav-para-tai",
    "modo": "alvo",
    "titulo": "Agora o microfone é da comunidade.",
    "texto": "A antiga mensagem fixa saiu daqui. Clique em “Para a Tai” para ver o espaço onde qualquer conta pode deixar sua própria mensagem assinada para a Taihen.",
    "instrucao": "Clique no botão Para a Tai destacado no menu."
  },
  "paraTai": {
    "id": "paraTai",
    "numero": 39,
    "grupo": "PARA A TAI",
    "pagina": "para-tai",
    "alvo": "final-message-page",
    "modo": "pausa",
    "titulo": "A carta virou mural.",
    "texto": "O Para a Tai agora é uma caixa de entrada coletiva. As mensagens são públicas dentro da página e aparecem assinadas pelo nome da conta que enviou. O autor pode remover a própria mensagem e a administração consegue moderar o mural.",
    "botaoPausa": "Entendi o correio coletivo",
    "dicas": [
      "A mensagem antiga não faz mais parte desta tela.",
      "O e-mail da conta não aparece no mural.",
      "Cada mensagem pode ter até 1600 caracteres."
    ]
  },
  "paraTaiEscrever": {
    "id": "paraTaiEscrever",
    "numero": 40,
    "grupo": "PARA A TAI",
    "pagina": "para-tai",
    "alvo": "tai-message-composer",
    "modo": "pausa",
    "titulo": "Sua vez de deixar papelada.",
    "texto": "Se estiver logado, é aqui que você escreve para a Tai. A autoria é vinculada à conta atual; não existe caixinha para fingir que você é outra pessoa. Se não estiver logado, a banca manda você entrar antes de assinar qualquer correspondência.",
    "botaoPausa": "Não vou falsificar assinatura",
    "dicas": [
      "O nome público da conta fica visível.",
      "O autor pode apagar a própria mensagem depois."
    ]
  },
  "paraTaiMural": {
    "id": "paraTaiMural",
    "numero": 41,
    "grupo": "PARA A TAI",
    "pagina": "para-tai",
    "alvo": "tai-message-wall",
    "modo": "pausa",
    "titulo": "Correspondências arquivadas.",
    "texto": "E aqui ficam as mensagens enviadas pela comunidade. Você pode atualizar o mural para buscar novas correspondências. Agora o fim do tour não é mais uma carta minha nem do programador: é só este espaço continuar recebendo gente.",
    "botaoPausa": "Cheguei ao fim da papelada",
    "dicas": [
      "Mensagens de outras contas não podem ser apagadas por um usuário comum.",
      "Administradores podem moderar conteúdo quando necessário."
    ]
  },
  "irFeed": {
    "id": "irFeed",
    "numero": 42,
    "grupo": "NAVEGAÇÃO",
    "pagina": "para-tai",
    "alvo": "nav-feed",
    "modo": "alvo",
    "titulo": "Pera. Ainda tem fofoca institucional.",
    "texto": "Antes de eu declarar esse passeio encerrado, ficaram quatro áreas novas sem apresentação formal. Começando pelo Feed: clique nele no menu e eu explico por que a banca decidiu registrar publicamente até as decisões estéticas da comunidade.",
    "instrucao": "Clique no botão Feed destacado no menu.",
    "dicas": [
      "O Feed reúne atividades públicas da comunidade.",
      "Saldo, e-mail, histórico bruto e dados de autenticação ficam fora dele."
    ]
  },
  "feed": {
    "id": "feed",
    "numero": 43,
    "grupo": "FEED DA BANCA",
    "pagina": "feed",
    "modo": "pausa",
    "titulo": "A fofoca virou infraestrutura.",
    "texto": "Aqui fica o mural público da banca. Ele reúne atividades como conquistas desbloqueadas, publicações e comentários do Museu, missões concluídas, acontecimentos de temporada e mudanças públicas de perfil. Os filtros separam cada tipo de fofoca sem transformar a TaihenBet numa rede social — graças a Deus.",
    "botaoPausa": "Entendi a fofoca institucional",
    "dicas": [
      "Avatar e nome levam ao perfil público quando aplicável.",
      "Os atalhos dos cards levam para a área relacionada.",
      "Contas suspensas deixam de aparecer enquanto a suspensão estiver ativa."
    ]
  },
  "irMissoes": {
    "id": "irMissoes",
    "numero": 44,
    "grupo": "NAVEGAÇÃO",
    "pagina": "feed",
    "alvo": "nav-missoes",
    "modo": "alvo",
    "titulo": "Agora a banca quer produtividade.",
    "texto": "Clique em Missões. Aparentemente perder TaiCoins sozinho não era objetivo suficiente, então agora existem metas formais para orientar o desastre.",
    "instrucao": "Clique no botão Missões destacado no menu."
  },
  "missoes": {
    "id": "missoes",
    "numero": 45,
    "grupo": "MISSÕES",
    "pagina": "missoes",
    "modo": "pausa",
    "titulo": "Departamento de produtividade duvidosa.",
    "texto": "Aqui ficam as missões diárias e semanais. Elas acompanham atividades reais da sua conta, como partidas, apostas e TaiCoins movimentadas. Quando a meta é cumprida, a recompensa precisa ser resgatada e o servidor impede o mesmo prêmio de ser recebido duas vezes. As diárias reiniciam todo dia; as semanais, na segunda-feira.",
    "botaoPausa": "Aceitei meu expediente fictício",
    "dicas": [
      "Missões diárias usam o ciclo do dia atual.",
      "Missões semanais acompanham o ciclo iniciado na segunda-feira.",
      "Metas e recompensas podem ser administradas pela Central de Conteúdo."
    ]
  },
  "irEvento": {
    "id": "irEvento",
    "numero": 46,
    "grupo": "NAVEGAÇÃO",
    "pagina": "missoes",
    "alvo": "nav-evento",
    "modo": "alvo",
    "titulo": "O sofrimento agora possui temporada.",
    "texto": "Clique em Evento. É a versão temporária e burocraticamente mais ambiciosa das missões normais.",
    "instrucao": "Clique no botão Evento destacado no menu."
  },
  "evento": {
    "id": "evento",
    "numero": 47,
    "grupo": "EVENTO E TEMPORADA",
    "pagina": "evento",
    "modo": "pausa",
    "titulo": "Temporada, prestígio e prazo para sofrer.",
    "texto": "Aqui ficam os eventos sazonais da banca. A temporada ativa possui objetivos próprios, pontos de prestígio, marcos de recompensa e um ranking sazonal. Parte do progresso também conversa com as missões normais: resgates diários e semanais ajudam a temporada. Quando o prazo termina, a safra vai para o arquivo e outra atrocidade pode ocupar o lugar.",
    "botaoPausa": "Entendi a safra atual",
    "dicas": [
      "Objetivos sazonais existem apenas durante a temporada correspondente.",
      "Os marcos liberam recompensas ao atingir a pontuação exigida.",
      "Temporadas encerradas permanecem disponíveis no arquivo."
    ]
  },
  "irLoja": {
    "id": "irLoja",
    "numero": 48,
    "grupo": "NAVEGAÇÃO",
    "pagina": "evento",
    "alvo": "nav-loja",
    "modo": "alvo",
    "titulo": "Por último: consumismo sem dinheiro real.",
    "texto": "Clique em Loja. Depois de ganhar TaiCoins fictícias, obviamente alguém precisava inventar um lugar para você gastá-las em decoração.",
    "instrucao": "Clique no botão Loja destacado no menu."
  },
  "loja": {
    "id": "loja",
    "numero": 49,
    "grupo": "TAISHOP",
    "pagina": "loja",
    "modo": "pausa",
    "titulo": "Irresponsabilidade financeira decorativa.",
    "texto": "Essa é a TaiShop. Aqui as TaiCoins podem ser gastas em cosméticos como molduras de avatar, cores de nome, efeitos de perfil e badges. Comprar não melhora odds, não altera resultado de jogo e não dá nenhuma vantagem competitiva: é pura estética. Depois da compra, o item entra no inventário e pode ser equipado ou trocado no perfil.",
    "botaoPausa": "Vou consumir com responsabilidade fictícia",
    "dicas": [
      "O preço e a disponibilidade dos cosméticos podem ser administrados no Painel.",
      "Itens comprados permanecem vinculados à conta.",
      "Algumas recompensas exclusivas não aparecem para venda na loja."
    ]
  },
  "final": {
    "id": "final",
    "numero": 50,
    "grupo": "FIM DO TOUR",
    "pagina": "loja",
    "modo": "fake-final",
    "titulo": "Agora sim, chegamos ao fim.",
    "texto": "Esse foi o passeio atualizado pela TaihenBet. Você conheceu a Liga do Bahrein autoritativa, os quatro jogos ligados ao servidor, a conta persistente, o Museu comunitário, o Grupo TaihenBet, o ao vivo, ranking, conquistas, missões, temporada, TaiShop, Feed, histórico, as ferramentas administrativas quando disponíveis e o mural Para a Tai. Minha missão termina aqui. A do programador é inevitavelmente inventar outra coisa amanhã.",
    "botaoPausa": "Encerrar tour",
    "dicas": [
      "Minha cabecinha continuará no canto depois do encerramento.",
      "Você pode recomeçar o tour quando quiser.",
      "Se o site mudar de novo, eu provavelmente vou exigir outra atualização."
    ]
  },
  "faltouUmBagui": {
    "id": "faltouUmBagui",
    "numero": 51,
    "grupo": "PÓS-CRÉDITOS",
    "pagina": "loja",
    "alvo": "nav-mensagem-criador",
    "modo": "alvo",
    "titulo": "Opa, espera, faltou um bagui.",
    "texto": "Eu já ia encerrar isso aqui, mas o programador aparentemente escondeu UMA ÚLTIMA PARTE do site e esqueceu de me avisar. Olha ali no menu: apareceu um negócio novo chamado “Recado”. Vai lá antes que ele resolva adicionar outra fase.",
    "instrucao": "Clique no novo botão Recado que acabou de aparecer no menu.",
    "dicas": [
      "Essa área fica escondida até este momento do tour.",
      "Depois de descoberta, ela continua disponível neste navegador."
    ]
  },
  "mensagemCriador": {
    "id": "mensagemCriador",
    "numero": 52,
    "grupo": "MENSAGEM DO CRIADOR",
    "pagina": "criador",
    "alvo": "creator-message-page",
    "modo": "pausa",
    "titulo": "Tá, agora eu realmente vou deixar ele falar.",
    "texto": "Essa página é diferente do mural Para a Tai. Aqui não é uma mensagem da comunidade e também não é só para ela: é um recado do criador da TaihenBet para qualquer pessoa que chegou até este ponto. Tem uma parte geral para todo mundo e uma linha separada especialmente para a Taihen. Eu não tenho muito o que explicar além disso sem estragar o texto, então leia no seu tempo.",
    "botaoPausa": "Pode deixar, Neytai",
    "dicas": [
      "O texto desta página pode ser alterado pelo administrador na Central de Conteúdo.",
      "O trecho dedicado à Taihen aparece destacado dentro da própria mensagem."
    ]
  },
  "finalReal": {
    "id": "finalReal",
    "numero": 53,
    "grupo": "FIM DO TOUR · AGORA DE VERDADE",
    "pagina": "criador",
    "modo": "final",
    "titulo": "Agora acabou mesmo. Eu acho.",
    "texto": "Pronto. Dessa vez eu conferi duas vezes e não tem mais nenhuma aba escondida atrás de mim. Obrigado por sobreviver ao tour inteiro da TaihenBet. Minha cabecinha continua no canto caso você queira me incomodar de novo.",
    "dicas": [
      "O Recado continuará visível depois que você fechar o tour.",
      "Você pode recomeçar o passeio quando quiser.",
      "Se surgir uma Fase 3.24 amanhã, eu nego qualquer responsabilidade."
    ]
  }
}

export const NEYTAI_STEP_IDS = Object.keys(NEYTAI_DEFAULT_STEPS)
