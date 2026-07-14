import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './NeytaiAssistant.css'
import neytaiImagem from '../assets/neytai-assistente.png'

const STORAGE_ETAPA = 'taihenbet-neytai-etapa'
const STORAGE_CONCLUIDO = 'taihenbet-neytai-concluido'
const STORAGE_VERSAO = 'taihenbet-neytai-versao'
const VERSAO_TOUR = 'tour-completo-v3-carta'

const etapas = {
  boasVindas: {
    id: 'boasVindas',
    numero: 1,
    grupo: 'INÍCIO',
    pagina: 'inicio',
    alvo: 'sports-button',
    modo: 'alvo',
    proxima: 'apostas',
    titulo: 'Prazer, eu sou o Neytai.',
    texto:
      'SEJA BEM VINDA, Eu sou Neytai, seu assistente que irá te guiar pelo site, porque o autista que me programou fez um site muito confuso, já que ele é incompetente, então ele precisou me criar pra conseguir te guiar pelo site, não por culpa sua, mas dele, enfim, vamos na nossa jornada, clique no botão das apostas esportivas',
    instrucao: 'Clique no botão destacado para começar o passeio.',
    dicas: [
      'O tour pode ser minimizado a qualquer momento.',
      'Quando eu sumir, minha cabecinha ficará no canto da tela.',
    ],
  },
  apostas: {
    id: 'apostas',
    numero: 2,
    grupo: 'APOSTAS ESPORTIVAS',
    pagina: 'inicio',
    alvo: 'sports-section',
    modo: 'pausa',
    proxima: 'clubesBahrein',
    titulo: 'Futebol bareinita, aparentemente.',
    texto:
      'Aqui é onde estão as apostas esportivas, eu sei que você não faz a menor ideia de que times são esses, mas o doente do programador pensou que seria engraçado pegar uma liga de um país muito aleatório seria engraçado, e ele escolheu o Bahrein, fique a vontade pra mexer aqui e apostar em alguém, mas não é tão legal',
    botaoPausa: 'Vou observar essa liga',
    dicas: [
      'Existem quatro partidas por rodada.',
      'Tudo usa TaiCoins fictícias e nenhum prêmio real.',
    ],
  },
  clubesBahrein: {
    id: 'clubesBahrein',
    numero: 3,
    grupo: 'APOSTAS ESPORTIVAS',
    pagina: 'inicio',
    alvo: 'sports-clubs',
    modo: 'pausa',
    proxima: 'bilhete',
    titulo: 'Os oito escolhidos do Bahrein.',
    texto:
      'Aqui estão os oito times da liga: Muharraq, Al Khaldiya, Riffa, A’ali, Malkiya, Hidd, Al Ahli e Sitra. Não precisa decorar nenhum, até porque eu duvido que o programador saiba apontar o Bahrein no mapa sem pesquisar antes.',
    botaoPausa: 'Fingi que decorei todos',
    dicas: [
      'O Painel alterna os confrontos em sete rodadas.',
      'Cada escudo foi colocado com o máximo de seriedade que este site permite.',
    ],
  },
  bilhete: {
    id: 'bilhete',
    numero: 4,
    grupo: 'APOSTAS ESPORTIVAS',
    pagina: 'inicio',
    alvo: 'sports-betslip',
    modo: 'pausa',
    proxima: 'saldo',
    titulo: 'O bilhete do arrependimento.',
    texto:
      'Para apostar, clique em 1 se acha que o mandante vence, X se acredita em empate e 2 se confia no visitante. As escolhas aparecem nesse bilhete; você coloca o valor, confirma e espera o resultado ser decidido no Painel. Juntar várias partidas aumenta a odd e também multiplica as maneiras de dar tudo errado.',
    botaoPausa: 'Entendi o 1, X e 2',
    dicas: [
      'Você pode remover uma seleção pelo X do bilhete.',
      'O retorno mostrado é apenas uma simulação em TaiCoins.',
    ],
  },
  saldo: {
    id: 'saldo',
    numero: 5,
    grupo: 'ECONOMIA FICTÍCIA',
    pagina: 'inicio',
    alvo: 'wallet',
    modo: 'pausa',
    proxima: 'irJogos',
    titulo: 'A economia que não vale absolutamente nada.',
    texto:
      'Esse número no canto é o seu saldo de TaiCoins. Elas não podem ser compradas, vendidas, sacadas ou usadas para pagar um pastel. Se acabar tudo, aparece uma cerimônia de falência. Também existe um botão de anúncio que entrega 20 TaiCoins depois que o vídeo termina, porque até a economia falsa precisa de publicidade.',
    botaoPausa: 'Aceitei o capitalismo fictício',
    dicas: [
      'O anúncio é opcional.',
      'Nos Jogos também existe uma bênção diária gratuita.',
      'Zero TaiCoins ativa o pronunciamento oficial da falência.',
    ],
  },
  irJogos: {
    id: 'irJogos',
    numero: 6,
    grupo: 'NAVEGAÇÃO',
    pagina: 'inicio',
    alvo: 'nav-jogos',
    modo: 'alvo',
    proxima: 'bonusJogos',
    titulo: 'Chega de futebol por enquanto.',
    texto:
      'Agora suba e clique no botão dos joguinhos',
    instrucao: 'O botão Jogos está destacado no menu.',
  },
  bonusJogos: {
    id: 'bonusJogos',
    numero: 7,
    grupo: 'JOGOS DA ENTIDADE',
    pagina: 'jogos',
    jogo: 'taimandioca',
    alvo: 'daily-bonus',
    modo: 'pausa',
    proxima: 'taimandioca',
    titulo: 'A esmola diária da banca.',
    texto:
      'Antes de arriscar sua dignidade, esse botão entrega uma pequena quantidade de TaiCoins uma vez por dia. É chamado de bênção diária porque “auxílio emergencial da banca” ficou grande demais no layout.',
    botaoPausa: 'Obrigado pela esmola',
    dicas: [
      'O bônus não exige anúncio.',
      'Depois de recebido, ele fica bloqueado até o próximo dia.',
    ],
  },
  taimandioca: {
    id: 'taimandioca',
    numero: 8,
    grupo: 'JOGOS DA ENTIDADE',
    pagina: 'jogos',
    jogo: 'taimandioca',
    alvo: 'game-area-taimandioca',
    modo: 'pausa',
    proxima: 'taigrinho',
    titulo: 'Primeira parada: agricultura de risco.',
    texto:
      'Bem-vinda ao Taimandioca, escolha os quadradinhos apenas com as mandiocas com rosto, porque mandiocas normais são sem graças, se você escolher o quadradinho errado, bem, será mandiocada, boa sorte, aperte o botãozinho no canto da tela para me chamar e ir para o próximo jogo',
    botaoPausa: 'Vou tentar não ser mandiocada',
    dicas: [
      'Você pode recolher o prêmio antes de completar o tabuleiro.',
      'Quanto mais TaiMandiocas encontrar, maior o multiplicador.',
      'Os efeitos sonoros existem para aumentar a tensão agrícola.',
    ],
  },
  taigrinho: {
    id: 'taigrinho',
    numero: 9,
    grupo: 'JOGOS DA ENTIDADE',
    pagina: 'jogos',
    jogo: 'taigrinho',
    alvo: 'game-area-taigrinho',
    modo: 'pausa',
    proxima: 'crash',
    titulo: 'Agora começa a ruína fictícia.',
    texto:
      'Esse aqui é o Taigrinho, clique para girar a roleta e ver se você tem sorte, porque você vai precisar, mas se você conseguir um mega-ganho, você terá uma surpresa hehehe, caso você não consiga um mega-ganho, você pode apertar no botãozinho ali em baixo só pra ver a surpresa, fica ao seu critério, aperte o botão zinho quando terminar o game',
    botaoPausa: 'Vou girar essa atrocidade',
    dicas: [
      'As linhas L1 até L5 mostram as combinações possíveis.',
      'A tabela ao lado explica os multiplicadores dos símbolos.',
      'No localhost existem botões para testar derrota e mega ganho.',
    ],
  },
  crash: {
    id: 'crash',
    numero: 10,
    grupo: 'JOGOS DA ENTIDADE',
    pagina: 'jogos',
    jogo: 'crash-regime',
    alvo: 'game-area-crash-regime',
    modo: 'pausa',
    proxima: 'derby',
    titulo: 'O mercado livre acabou.',
    texto:
      'Esse é o Crash do Regime, você clica e deixa a setinha subir, se passar de 10, você pode parar e fugir da ditadura, mas se eles te pegarem.... Tu mamou man, caso não consiga passar de 10 nenhuma vez, tem o mesmo botão pra testar a animação la em baixo pra você ver a animação que faria, aperte no botãozinho quando acabar de jogar',
    botaoPausa: 'Vou fugir do regime',
    dicas: [
      'Quanto mais o multiplicador sobe, maior o retorno.',
      'Se a Comandante encerrar antes da retirada, a entrada é confiscada.',
      'O botão de teste só aparece durante o desenvolvimento local.',
    ],
  },
  derby: {
    id: 'derby',
    numero: 11,
    grupo: 'JOGOS DA ENTIDADE',
    pagina: 'jogos',
    jogo: 'derby',
    alvo: 'game-area-derby',
    modo: 'pausa',
    proxima: 'catalogoJogos',
    titulo: 'Hipódromo do Protocolo Mambo.',
    texto:
      'Esse é o Taihen Derby, aposte no seu cavalinho pocotó favorito e tente vencer a corrida, cada uma das umas tem uma animação diferente quando ganham a corrida, aproveite, é o mais divertido eu acho, quando acabar, aperte o botãozinho para continuar o tour',
    botaoPausa: 'Vou escolher meu pocotó',
    dicas: [
      'A corredora escolhida possui apenas 5% de chance real.',
      'Se você apostar em outra, a Mambo recebe os 95% restantes.',
      'Se apostar na Mambo, o universo inteiro tenta impedir a vitória dela.',
    ],
  },
  catalogoJogos: {
    id: 'catalogoJogos',
    numero: 12,
    grupo: 'JOGOS DA ENTIDADE',
    pagina: 'jogos',
    alvo: 'games-catalog',
    modo: 'pausa',
    proxima: 'irMuseu',
    titulo: 'O corredor das decisões ruins.',
    texto:
      'Esses quatro cartões servem para trocar rapidamente entre os jogos. Cada jogo guarda um pequeno histórico das últimas partidas, então o site também preserva seus fracassos para futuras pesquisas acadêmicas.',
    botaoPausa: 'Já cometi jogos suficientes',
    dicas: [
      'TaiMandioca: risco agrícola.',
      'Taigrinho: roleta e humilhação.',
      'Crash: fuga do regime.',
      'Derby: cavalinhos e manipulação Mambo.',
    ],
  },
  irMuseu: {
    id: 'irMuseu',
    numero: 13,
    grupo: 'NAVEGAÇÃO',
    pagina: 'jogos',
    alvo: 'nav-museu',
    modo: 'alvo',
    proxima: 'museu',
    titulo: 'Agora vamos preservar a história.',
    texto:
      'Suba até o menu e clique em Museu. É onde foram guardadas as provas que deveriam ter sido apagadas antes de alguém pensar em criar um site.',
    instrucao: 'Clique no botão Museu destacado.',
  },
  museu: {
    id: 'museu',
    numero: 14,
    grupo: 'MUSEU DA TAIHEN',
    pagina: 'museu',
    alvo: 'museum-page',
    modo: 'pausa',
    proxima: 'museuFerramentas',
    titulo: 'Ala de preservação histórica.',
    texto:
      'Esse é o Museu da Taihen, um pequeno conjunto de momentos legais e engraçados da comunidade, aproveite, quando terminar de ver todos, clique no botãozinho para continuarmos o tour',
    botaoPausa: 'Vou analisar as provas',
    dicas: [
      'A relíquia grande do topo muda aleatoriamente a cada visita.',
      'O acervo inclui imagens, GIFs, vídeos e formas alternativas.',
    ],
  },
  museuFerramentas: {
    id: 'museuFerramentas',
    numero: 15,
    grupo: 'MUSEU DA TAIHEN',
    pagina: 'museu',
    alvo: 'museum-filters',
    modo: 'pausa',
    proxima: 'irAoVivo',
    titulo: 'Como operar um museu sem diploma.',
    texto:
      'Esses filtros separam clipes, memes, documentos e transformações. Clique em qualquer relíquia para abrir em tela cheia; use as setas para avançar, Esc para fugir e os controles do vídeo para ouvir o patrimônio cultural causando dano auditivo.',
    botaoPausa: 'Terminei a visita guiada',
    dicas: [
      'O mural se reorganiza conforme a categoria escolhida.',
      'Vídeos só tocam com som quando forem abertos.',
    ],
  },
  irAoVivo: {
    id: 'irAoVivo',
    numero: 16,
    grupo: 'NAVEGAÇÃO',
    pagina: 'museu',
    alvo: 'nav-ao-vivo',
    modo: 'alvo',
    proxima: 'aoVivo',
    titulo: 'Próxima parada: transmissão local.',
    texto:
      'Clique em Ao vivo. Talvez esteja completamente vazio, mas pelo menos o vazio é honesto e não inventa cinquenta mil espectadores.',
    instrucao: 'Clique em Ao vivo no menu.',
  },
  aoVivo: {
    id: 'aoVivo',
    numero: 17,
    grupo: 'SESSÃO AO VIVO',
    pagina: 'ao-vivo',
    alvo: 'live-page',
    modo: 'pausa',
    proxima: 'irRanking',
    titulo: 'O ao vivo que só existe quando está vivo.',
    texto:
      'Essa página mostra apenas sessões iniciadas manualmente pelo Painel. Quando existe uma sessão, aparecem cronômetro, mercados escolhidos, bilhetes e atualizações registradas neste navegador. Quando não existe, ela admite que está offline, algo raro na internet.',
    botaoPausa: 'Respeito a honestidade do OFF',
    dicas: [
      'A sessão é iniciada e encerrada no Painel.',
      'Não existem espectadores ou acontecimentos falsos.',
      'As atualizações são publicadas manualmente pela banca.',
    ],
  },
  irRanking: {
    id: 'irRanking',
    numero: 18,
    grupo: 'NAVEGAÇÃO',
    pagina: 'ao-vivo',
    alvo: 'nav-ranking',
    modo: 'alvo',
    proxima: 'ranking',
    titulo: 'Vamos medir quem tomou as piores decisões.',
    texto:
      'Clique em Ranking. É o lugar onde números fictícios recebem uma cerimônia muito mais séria do que merecem.',
    instrucao: 'Clique no botão Ranking destacado.',
  },
  ranking: {
    id: 'ranking',
    numero: 19,
    grupo: 'RANKING',
    pagina: 'ranking',
    alvo: 'ranking-page',
    modo: 'pausa',
    proxima: 'irHistorico',
    titulo: 'Classificação absolutamente científica.',
    texto:
      'O ranking mistura personagens demonstrativos da comunidade com o saldo e o histórico local de quem está usando o site. Sua posição muda conforme as TaiCoins acumuladas. Não existe servidor, competição mundial ou auditoria; existe apenas JavaScript fazendo contas com muita confiança.',
    botaoPausa: 'Aceitei minha colocação',
    dicas: [
      'A sua taxa de acerto usa apostas ganhas e perdidas.',
      'O lucro líquido compara o total apostado com os retornos.',
      'Os outros participantes são personagens demonstrativos.',
    ],
  },
  irHistorico: {
    id: 'irHistorico',
    numero: 20,
    grupo: 'NAVEGAÇÃO',
    pagina: 'ranking',
    alvo: 'nav-historico',
    modo: 'alvo',
    proxima: 'historico',
    titulo: 'Hora de confrontar o passado.',
    texto:
      'Clique em Histórico para visitar o arquivo oficial de decisões que pareciam boas cinco minutos atrás.',
    instrucao: 'Clique em Histórico no menu.',
  },
  historico: {
    id: 'historico',
    numero: 21,
    grupo: 'HISTÓRICO',
    pagina: 'historico',
    alvo: 'history-page',
    modo: 'pausa',
    proxima: 'irPainel',
    titulo: 'Arquivo de decisões questionáveis.',
    texto:
      'Aqui ficam os bilhetes esportivos e resultados registrados pelo site, com valor, odd, retorno possível e estado da aposta. Também dá para apagar tudo e fingir que nunca aconteceu, uma função muito procurada por investidores e estudantes depois da prova.',
    botaoPausa: 'Meu passado está perdoado',
    dicas: [
      'Pendente: o resultado ainda não foi definido.',
      'Ganhou: a banca devolveu TaiCoins.',
      'Perdeu: registro permanente da humilhação, até você apagar.',
    ],
  },
  irPainel: {
    id: 'irPainel',
    numero: 22,
    grupo: 'NAVEGAÇÃO',
    pagina: 'historico',
    alvo: 'nav-painel',
    modo: 'alvo',
    proxima: 'painel',
    titulo: 'Entrando na sala proibida.',
    texto:
      'Agora clique em Painel. Essa é a área administrativa, também conhecida como “botões que não deveriam ser entregues a alguém sem supervisão”.',
    instrucao: 'Clique no botão Painel destacado.',
  },
  painel: {
    id: 'painel',
    numero: 23,
    grupo: 'PAINEL ADMINISTRATIVO',
    pagina: 'admin',
    alvo: 'admin-page',
    modo: 'pausa',
    proxima: 'irInicio',
    titulo: 'O centro de controle da confusão.',
    texto:
      'No Painel dá para publicar as sete rodadas do Bahrein, suspender partidas, decidir vencedores, editar odds, iniciar sessões ao vivo e publicar atualizações. No localhost também aparecem botões para testar anúncio, falência e a tela inicial. Em resumo: daqui você controla quase tudo, então clique com a responsabilidade de quem claramente não terá responsabilidade nenhuma.',
    botaoPausa: 'Prometo não destruir o site',
    dicas: [
      'Liga do Bahrein: publica rodadas e resultados.',
      'Editar odds: altera ou exclui mercados.',
      'Sessão ao vivo: escolhe mercados e atualizações.',
      'Os testes de desenvolvimento não alteram o saldo real.',
    ],
  },
  irInicio: {
    id: 'irInicio',
    numero: 24,
    grupo: 'NAVEGAÇÃO',
    pagina: 'admin',
    alvo: 'nav-inicio',
    modo: 'alvo',
    proxima: 'homeGeral',
    titulo: 'Voltando ao centro da operação.',
    texto:
      'Clique em Início para eu explicar as partes gerais que nós ignoramos enquanto corríamos atrás de mandiocas, ditaduras e cavalos.',
    instrucao: 'Clique no botão Início destacado.',
  },
  homeGeral: {
    id: 'homeGeral',
    numero: 25,
    grupo: 'PÁGINA INICIAL',
    pagina: 'inicio',
    alvo: 'home-general',
    modo: 'pausa',
    proxima: 'museuPreview',
    titulo: 'A central geral da TaihenBet.',
    texto:
      'O topo da página inicial resume o site inteiro: quatro minijogos, oito clubes do Bahrein, zero dinheiro real e a Entidade da Banca administrando o caos. Os botões levam direto aos jogos ou às apostas esportivas, porque caminhar pela página manualmente seria esforço demais.',
    botaoPausa: 'Visão geral absorvida',
    dicas: [
      'A página inicial não é dedicada apenas ao futebol.',
      'Ela funciona como ponto de entrada para as áreas principais.',
    ],
  },
  museuPreview: {
    id: 'museuPreview',
    numero: 26,
    grupo: 'PÁGINA INICIAL',
    pagina: 'inicio',
    alvo: 'home-museum-preview',
    modo: 'pausa',
    proxima: 'avisoRodape',
    titulo: 'Uma amostra grátis do patrimônio.',
    texto:
      'Essa pequena prévia mostra três relíquias do Museu sem obrigar ninguém a abrir o acervo completo. É basicamente a vitrine de uma loja, exceto que a loja vende apenas contexto, memes e danos psicológicos.',
    botaoPausa: 'Já conheço a vitrine',
    dicas: [
      'Qualquer card leva ao Museu completo.',
      'As relíquias exibidas aqui são apenas uma seleção fixa.',
    ],
  },
  avisoRodape: {
    id: 'avisoRodape',
    numero: 27,
    grupo: 'AVISO FINAL',
    pagina: 'inicio',
    alvo: 'anti-betting-footer',
    modo: 'pausa',
    proxima: 'irParaTai',
    titulo: 'A parte séria no meio da palhaçada.',
    texto:
      'Este rodapé repete que a TaihenBet é uma paródia antiapostas sem dinheiro, depósitos, saques ou prêmios reais. O botão “Ler aviso completo” reabre a tela inicial. Essa mensagem existe porque o resto do site se esforça bastante para parecer um delírio funcional.',
    botaoPausa: 'Entendi: apostar é paia',
    dicas: [
      'A tela de aviso aparece em todo carregamento da página.',
      'TaiCoins não possuem valor fora da brincadeira.',
    ],
  },
  irParaTai: {
    id: 'irParaTai',
    numero: 28,
    grupo: 'ÚLTIMA PARADA',
    pagina: 'inicio',
    alvo: 'nav-para-tai',
    modo: 'alvo',
    proxima: 'cartaParaTai',
    titulo: 'Agora eu vou ficar quieto.',
    texto:
      'Chegamos à última categoria. Agora eu vou deixar o programador falar por conta própria. Surpreendentemente, ele parece estar falando sério desta vez. Clique em “Para a Tai”.',
    instrucao:
      'Clique no botão Para a Tai destacado no menu.',
    dicas: [
      'Esta é a única parte do site que não tenta transformar tudo em cassino, mandioca ou crime administrativo.',
    ],
  },
  cartaParaTai: {
    id: 'cartaParaTai',
    numero: 29,
    grupo: 'PARA A TAI',
    pagina: 'para-tai',
    alvo: 'final-message-page',
    modo: 'pausa',
    proxima: 'final',
    titulo: 'A carta é toda sua.',
    texto:
      'Eu entreguei a mensagem, então vou desaparecer por um momento. Leia no seu tempo. Quando terminar, aperte minha cabecinha no canto para encerrarmos o tour.',
    botaoPausa: 'Pode deixar, Neytai',
    dicas: [
      'O botão “Reler do início” volta ao começo da carta.',
      'O botão “Voltar para o início” retorna à página principal.',
    ],
  },
  final: {
    id: 'final',
    numero: 30,
    grupo: 'FIM DO TOUR',
    pagina: 'para-tai',
    modo: 'final',
    titulo: 'Agora sim, chegamos ao fim.',
    texto:
      'Esse foi o passeio completo pela TaihenBet. Você conheceu o futebol do Bahrein, os quatro jogos, o museu, o ao vivo, o ranking, o histórico, o painel e, por último, a mensagem que explica por que essa loucura inteira foi feita. Minha missão termina aqui. A do programador é mudar aquele nick.',
    dicas: [
      'Minha cabecinha continuará no canto depois do encerramento.',
      'Você pode recomeçar o tour quando quiser.',
      'Obrigado por ter explorado o site até aqui.',
    ],
  },
}

const ordemEtapas = Object.keys(etapas)
const idsValidos = ordemEtapas
const TOTAL_ETAPAS = ordemEtapas.length

function garantirVersaoAtual() {
  if (
    localStorage.getItem(STORAGE_VERSAO) ===
    VERSAO_TOUR
  ) {
    return
  }

  localStorage.setItem(
    STORAGE_VERSAO,
    VERSAO_TOUR,
  )
  localStorage.removeItem(STORAGE_ETAPA)
  localStorage.removeItem(STORAGE_CONCLUIDO)
}

function carregarEtapaInicial() {
  garantirVersaoAtual()

  const salva = localStorage.getItem(STORAGE_ETAPA)

  return idsValidos.includes(salva)
    ? salva
    : 'boasVindas'
}

function carregarConcluidoInicial() {
  garantirVersaoAtual()

  return (
    localStorage.getItem(STORAGE_CONCLUIDO) ===
    'sim'
  )
}

function NeytaiAssistant({
  enabled,
  pagina,
  onNavigate,
}) {
  const [etapaId, setEtapaId] = useState(
    carregarEtapaInicial,
  )
  const [concluido, setConcluido] = useState(
    carregarConcluidoInicial,
  )
  const [aberto, setAberto] = useState(
    () => !carregarConcluidoInicial(),
  )
  const timersRef = useRef([])

  const etapa = useMemo(
    () => etapas[etapaId] || etapas.boasVindas,
    [etapaId],
  )

  const indiceAtual = ordemEtapas.indexOf(etapa.id)
  const progresso = Math.min(
    100,
    Math.max(
      0,
      (etapa.numero / TOTAL_ETAPAS) * 100,
    ),
  )

  function limparTimers() {
    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer)
    })
    timersRef.current = []
  }

  function enviarJogo(jogo) {
    if (!jogo) {
      return
    }

    ;[80, 260, 620].forEach((atraso) => {
      const timer = window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(
            'neytai:selecionar-jogo',
            {
              detail: { jogo },
            },
          ),
        )
      }, atraso)

      timersRef.current.push(timer)
    })
  }

  function irParaEtapa(novaEtapaId) {
    const novaEtapa =
      etapas[novaEtapaId] || etapas.boasVindas

    limparTimers()
    setEtapaId(novaEtapa.id)
    setAberto(true)
    setConcluido(false)

    localStorage.setItem(
      STORAGE_ETAPA,
      novaEtapa.id,
    )
    localStorage.removeItem(STORAGE_CONCLUIDO)

    if (
      novaEtapa.pagina &&
      novaEtapa.pagina !== pagina
    ) {
      onNavigate?.(novaEtapa.pagina)
    }

    enviarJogo(novaEtapa.jogo)
  }

  function pausarEtapa() {
    setAberto(false)
  }

  function continuarPeloBotaoFlutuante() {
    if (concluido) {
      setEtapaId('final')
      setAberto(true)
      return
    }

    if (etapa.modo === 'alvo') {
      setAberto(true)
      return
    }

    if (etapa.proxima) {
      irParaEtapa(etapa.proxima)
      return
    }

    setAberto(true)
  }

  function avancarManualmente() {
    if (etapa.proxima) {
      irParaEtapa(etapa.proxima)
    }
  }

  function voltarEtapa() {
    if (indiceAtual <= 0) {
      return
    }

    irParaEtapa(
      ordemEtapas[indiceAtual - 1],
    )
  }

  function finalizarTour() {
    setConcluido(true)
    setAberto(false)
    setEtapaId('final')

    localStorage.setItem(STORAGE_ETAPA, 'final')
    localStorage.setItem(
      STORAGE_CONCLUIDO,
      'sim',
    )
  }

  function reiniciarTour() {
    setConcluido(false)
    localStorage.removeItem(STORAGE_CONCLUIDO)
    irParaEtapa('boasVindas')
  }

  useEffect(() => {
    return () => limparTimers()
  }, [])

  useEffect(() => {
    if (!enabled || !aberto) {
      return undefined
    }

    if (
      etapa.pagina &&
      etapa.pagina !== pagina
    ) {
      onNavigate?.(etapa.pagina)
    }

    enviarJogo(etapa.jogo)

    return undefined
  }, [
    enabled,
    aberto,
    etapaId,
    pagina,
  ])

  useEffect(() => {
    document
      .querySelectorAll('.neytai-tour-focus')
      .forEach((elemento) => {
        elemento.classList.remove(
          'neytai-tour-focus',
        )
      })

    if (
      !enabled ||
      !aberto ||
      !etapa.alvo
    ) {
      return undefined
    }

    let tentativas = 0
    let alvoAtual = null

    const intervalo = window.setInterval(() => {
      tentativas += 1

      const alvo = document.querySelector(
        `[data-neytai-target="${etapa.alvo}"]`,
      )

      if (!alvo) {
        if (tentativas >= 40) {
          window.clearInterval(intervalo)
        }
        return
      }

      alvoAtual = alvo
      alvo.classList.add('neytai-tour-focus')
      alvo.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
      window.clearInterval(intervalo)
    }, 100)

    return () => {
      window.clearInterval(intervalo)
      alvoAtual?.classList.remove(
        'neytai-tour-focus',
      )
    }
  }, [
    enabled,
    aberto,
    etapaId,
    pagina,
  ])

  useEffect(() => {
    if (
      !enabled ||
      !aberto ||
      etapa.modo !== 'alvo' ||
      !etapa.alvo
    ) {
      return undefined
    }

    function acompanharClique(evento) {
      const alvo = evento.target.closest(
        '[data-neytai-target]',
      )

      if (
        !alvo ||
        alvo.dataset.neytaiTarget !==
          etapa.alvo
      ) {
        return
      }

      const timer = window.setTimeout(() => {
        irParaEtapa(etapa.proxima)
      }, 180)

      timersRef.current.push(timer)
    }

    document.addEventListener(
      'click',
      acompanharClique,
      true,
    )

    return () => {
      document.removeEventListener(
        'click',
        acompanharClique,
        true,
      )
    }
  }, [
    enabled,
    aberto,
    etapaId,
    pagina,
  ])

  if (!enabled) {
    return null
  }

  if (!aberto) {
    return (
      <button
        type="button"
        className="neytai-floating-button"
        onClick={continuarPeloBotaoFlutuante}
        title={
          concluido
            ? 'Chamar Neytai novamente'
            : 'Chamar Neytai para continuar o tour'
        }
      >
        <img src={neytaiImagem} alt="Neytai" />

        <span>
          {concluido
            ? 'Neytai'
            : `Continuar · ${etapa.numero}/${TOTAL_ETAPAS}`}
        </span>

        {!concluido && <i />}
      </button>
    )
  }

  return (
    <aside
      className="neytai-assistant"
      aria-live="polite"
    >
      <div
        className="neytai-character"
        aria-hidden="true"
      >
        <div className="neytai-character-glow" />
        <img src={neytaiImagem} alt="" />
      </div>

      <div className="neytai-speech-bubble">
        <div className="neytai-bubble-top">
          <div>
            <span>
              ASSISTENTE PESSOAL · {etapa.grupo}
            </span>
            <strong>Neytai</strong>
          </div>

          <div className="neytai-bubble-controls">
            <small>
              {etapa.numero}/{TOTAL_ETAPAS}
            </small>

            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Minimizar Neytai"
              title="Minimizar"
            >
              −
            </button>
          </div>
        </div>

        <div
          className="neytai-progress"
          aria-hidden="true"
        >
          <span
            style={{
              width: `${progresso}%`,
            }}
          />
        </div>

        <div className="neytai-message-scroll">
          <h2>{etapa.titulo}</h2>
          <p>{etapa.texto}</p>

          {etapa.dicas?.length > 0 && (
            <ul className="neytai-tip-list">
              {etapa.dicas.map((dica) => (
                <li key={dica}>{dica}</li>
              ))}
            </ul>
          )}

          {etapa.instrucao && (
            <div className="neytai-instruction">
              <i />
              <span>{etapa.instrucao}</span>
            </div>
          )}
        </div>

        <div className="neytai-actions">
          {etapa.modo === 'pausa' && (
            <button
              type="button"
              className="neytai-primary-action"
              onClick={pausarEtapa}
            >
              {etapa.botaoPausa}
            </button>
          )}

          {etapa.modo === 'alvo' && (
            <button
              type="button"
              className="neytai-secondary-action"
              onClick={avancarManualmente}
            >
              Avançar sem clicar
            </button>
          )}

          {etapa.modo === 'final' && (
            <>
              <button
                type="button"
                className="neytai-primary-action"
                onClick={finalizarTour}
              >
                Encerrar tour
              </button>

              <button
                type="button"
                className="neytai-secondary-action"
                onClick={reiniciarTour}
              >
                Recomeçar do início
              </button>
            </>
          )}

          {etapa.modo !== 'final' && indiceAtual > 0 && (
            <button
              type="button"
              className="neytai-back-action"
              onClick={voltarEtapa}
            >
              Voltar
            </button>
          )}

          {etapa.modo !== 'final' && (
            <button
              type="button"
              className="neytai-skip-action"
              onClick={finalizarTour}
            >
              Pular tour
            </button>
          )}
        </div>

        <div
          className="neytai-bubble-tail"
          aria-hidden="true"
        />
      </div>
    </aside>
  )
}

export default NeytaiAssistant
