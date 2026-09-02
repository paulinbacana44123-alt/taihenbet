import { useEffect, useMemo, useRef, useState } from 'react'
import './GamesPage.css'
import entidadeBanca from '../assets/entidade-banca.png'
import taihenModelo2026 from '../assets/taihen-modelo-2026.png'
import taiMandioca from '../assets/taihen-mandioca.png'
import mandiocaNormal from '../assets/mandioca-normal.jpeg'
import paquetaMeme from '../assets/paqueta-meme.jpg'
import megaWinVideo from '../assets/taigrinho-megawin.mp4'
import somGiroTaigrinho from '../assets/taigrinho-giro.wav'
import somParadaTaigrinho from '../assets/taigrinho-parada.wav'
import taihenDitadora from '../assets/taihen-ditadora.png'
import fiscalRegime from '../assets/mbappe-ditador.jpg'
import somSubidaCrash from '../assets/crash-regime-subida.wav'
import somQuedaCrash from '../assets/crash-regime-queda.wav'
import somRetiradaCrash from '../assets/crash-regime-retirada.wav'
import sapoMinecraft from '../assets/sapo-minecraft.webp'
import neymarBrasil from '../assets/neymar-brasil.jpg'
import rQuiabo from '../assets/r-quiabo.jpg'
import taiInfernal from '../assets/tai-infernal.jpg'
import DerbyPage from './DerbyPage'
import matikanetannhauserCard from '../assets/matikanetannhauser.jpg'
import somInicioTaiMandioca from '../assets/taimandioca-inicio.wav'
import somSeguroTaiMandioca from '../assets/taimandioca-segura.wav'
import somDerrotaTaiMandioca from '../assets/taimandioca-perdeu.wav'
import somRecolherTaiMandioca from '../assets/taimandioca-recolher.wav'
import somPerfeitoTaiMandioca from '../assets/taimandioca-perfeita.wav'
import somBonusTaiMandioca from '../assets/taimandioca-bonus.wav'

const TOTAL_CASAS = 25
const ENTRADA_MINIMA = 10
const BONUS_DIARIO = 250


const APOSTA_MINIMA_TAIGRINHO = 10
const simbolosTaigrinho = [
  {
    id: 'tai',
    nome: 'Tai',
    imagem: taihenModelo2026,
    peso: 3,
    pagamentos: {
      3: 6,
      4: 12,
      5: 30,
    },
  },
  {
    id: 'mandioca',
    nome: 'TaiMandioca',
    imagem: taiMandioca,
    peso: 6,
    pagamentos: {
      3: 4,
      4: 8,
      5: 18,
    },
  },
  {
    id: 'sapo-minecraft',
    nome: 'Sapo do Minecraft',
    imagem: sapoMinecraft,
    peso: 10,
    pagamentos: {
      3: 3,
      4: 6,
      5: 12,
    },
  },
  {
    id: 'neymar',
    nome: 'Neymar do Brasil',
    imagem: neymarBrasil,
    peso: 12,
    pagamentos: {
      3: 2.5,
      4: 5,
      5: 9,
    },
  },
  {
    id: 'r-quiabo',
    nome: 'R Quiabo',
    imagem: rQuiabo,
    peso: 15,
    pagamentos: {
      3: 2,
      4: 4,
      5: 7,
    },
  },
  {
    id: 'tai-infernal',
    nome: 'Tai Infernal',
    imagem: taiInfernal,
    peso: 20,
    pagamentos: {
      3: 1.5,
      4: 3,
      5: 5,
    },
  },
]

const linhasTaigrinho = [
  {
    id: 'meio',
    nome: 'Linha central',
    linhas: [1, 1, 1, 1, 1],
  },
  {
    id: 'topo',
    nome: 'Linha superior',
    linhas: [0, 0, 0, 0, 0],
  },
  {
    id: 'baixo',
    nome: 'Linha inferior',
    linhas: [2, 2, 2, 2, 2],
  },
  {
    id: 'v',
    nome: 'Linha em V',
    linhas: [0, 1, 2, 1, 0],
  },
  {
    id: 'v-invertido',
    nome: 'Linha em V invertido',
    linhas: [2, 1, 0, 1, 2],
  },
]

function sortearNumero(maximo) {
  if (maximo <= 0) {
    return 0
  }

  const numero = new Uint32Array(1)
  crypto.getRandomValues(numero)

  return numero[0] % maximo
}

function sortearSimboloTaigrinho() {
  const pesoTotal = simbolosTaigrinho.reduce(
    (total, simbolo) => total + simbolo.peso,
    0,
  )

  let sorteio = sortearNumero(pesoTotal)

  for (const simbolo of simbolosTaigrinho) {
    if (sorteio < simbolo.peso) {
      return simbolo.id
    }

    sorteio -= simbolo.peso
  }

  return simbolosTaigrinho.at(-1).id
}

function criarGradeAleatoriaTaigrinho() {
  return Array.from({ length: 5 }, () =>
    Array.from(
      { length: 3 },
      () => sortearSimboloTaigrinho(),
    ),
  )
}

function obterSimboloTaigrinho(simboloId) {
  return (
    simbolosTaigrinho.find(
      (simbolo) => simbolo.id === simboloId,
    ) || simbolosTaigrinho.at(-1)
  )
}

const APOSTA_MINIMA_CRASH = 10
const CRASH_POLL_INTERVAL_MS = 500
const CRASH_POLL_RETRY_MS = 350
const CRASH_POLL_INITIAL_MS = 250
const MULTIPLICADOR_MAXIMO_CRASH = 50

function calcularMultiplicadorDoCrash(tempoDecorrido) {
  return Math.min(
    MULTIPLICADOR_MAXIMO_CRASH,
    Math.exp(tempoDecorrido / 8200),
  )
}

function gerarGraficoCrash(pontos) {
  const valores =
    pontos.length > 1 ? pontos : [1, 1.001]

  const maiorValor = Math.max(
    2,
    ...valores,
  )

  const largura = 1000
  const altura = 360
  const margemHorizontal = 28
  const margemSuperior = 24
  const margemInferior = 34
  const larguraUtil =
    largura - margemHorizontal * 2
  const alturaUtil =
    altura - margemSuperior - margemInferior

  const coordenadas = valores.map(
    (valor, indice) => {
      const x =
        margemHorizontal +
        (indice / Math.max(1, valores.length - 1)) *
          larguraUtil

      const proporcao =
        (valor - 1) /
        Math.max(1, maiorValor - 1)

      const y =
        altura -
        margemInferior -
        proporcao * alturaUtil

      return {
        x,
        y,
      }
    },
  )

  const caminho = coordenadas
    .map(
      (ponto, indice) =>
        `${indice === 0 ? 'M' : 'L'} ${ponto.x.toFixed(
          2,
        )} ${ponto.y.toFixed(2)}`,
    )
    .join(' ')

  const pontoAtual =
    coordenadas.at(-1) || {
      x: margemHorizontal,
      y: altura - margemInferior,
    }

  return {
    caminho,
    pontoAtual,
    maiorValor,
  }
}

function fraseDoRegime(
  multiplicador,
  rodando,
  resultado,
) {
  if (
    resultado?.status === 'Perdeu'
  ) {
    return 'Operação encerrada. Seus bens fictícios foram confiscados.'
  }

  if (
    resultado?.status === 'Ganhou'
  ) {
    return resultado.multiplicador >= 10
      ? 'Retirada suspeita registrada. Você escapou do regime.'
      : 'Retirada autorizada sob protesto da Comandante.'
  }

  if (!rodando) {
    return 'A Comandante aguarda o início da próxima operação.'
  }

  if (multiplicador < 1.5) {
    return 'A situação está sob controle.'
  }

  if (multiplicador < 2.5) {
    return 'A ganância começou a ser detectada.'
  }

  if (multiplicador < 5) {
    return 'Retirada ainda autorizada.'
  }

  if (multiplicador < 10) {
    return 'Você está desafiando o regime.'
  }

  if (multiplicador < 20) {
    return 'A banca não garante sua segurança.'
  }

  return 'LUCRO EXCESSIVO. O fiscal foi acionado.'
}

const configuracoesPerigo = [
  {
    quantidade: 3,
    titulo: 'Colheita tranquila',
    descricao: 'Só três mandiocas normais escondidas.',
  },
  {
    quantidade: 5,
    titulo: 'Roça questionável',
    descricao: 'O nível recomendado pela Entidade da Banca.',
  },
  {
    quantidade: 7,
    titulo: 'Plantação suspeita',
    descricao: 'Mais perigo, mais multiplicador e menos juízo.',
  },
  {
    quantidade: 10,
    titulo: 'Safra amaldiçoada',
    descricao: 'Quase metade da roça quer destruir sua dignidade.',
  },
]

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function calcularMultiplicador(perigos, reveladas) {
  if (reveladas <= 0) {
    return 1
  }

  let multiplicador = 1

  for (let indice = 0; indice < reveladas; indice += 1) {
    const casasRestantes = TOTAL_CASAS - indice
    const fatorDeRisco =
      1 + (perigos / casasRestantes) * 0.62

    multiplicador *= fatorDeRisco
  }

  return Math.min(250, multiplicador)
}

function normalizarPartidaTaiMandioca(estadoServidor) {
  if (!estadoServidor?.sessionId) {
    return null
  }

  return {
    id: estadoServidor.sessionId,
    jogo: 'TaiMandioca',
    entrada: Math.max(0, Number(estadoServidor.entrada) || 0),
    quantidadeMandiocasNormais: Math.max(
      0,
      Number(estadoServidor.quantidadeMandiocasNormais) || 0,
    ),
    reveladas: Array.isArray(estadoServidor.reveladas)
      ? estadoServidor.reveladas.map(Number)
      : [],
    multiplicadorAtual: Math.max(
      1,
      Number(estadoServidor.multiplicadorAtual) || 1,
    ),
    retornoAtual: Math.max(
      0,
      Number(estadoServidor.retornoAtual) || 0,
    ),
    iniciadaEm: Date.now(),
    walletRef: estadoServidor.sessionId,
    roundId: estadoServidor.sessionId,
    authoritative: true,
  }
}

function dataLocalHoje() {
  return new Date().toLocaleDateString('pt-BR')
}

function GamesPage({
  saldo = 0,
  historicoJogos = [],
  onGirarTaigrinho,
  onIniciarTaiMandioca,
  onRevelarTaiMandioca,
  onRecolherTaiMandioca,
  onCarregarTaiMandioca,
  onIniciarCrash,
  onConsultarCrash,
  onRetirarCrash,
  onFinalizarJogo,
  onReceberBonus,
  onIniciarDerby,
  onConsultarDerby,
  onFinalizarCorridaDerby,
}) {
  const [jogoSelecionado, setJogoSelecionado] =
    useState('taimandioca')
  const [entrada, setEntrada] = useState('25')
  const [
    quantidadeMandiocasNormais,
    setQuantidadeMandiocasNormais,
  ] = useState(5)
  const [partida, setPartida] = useState(null)
  const [taiMandiocaProcessando, setTaiMandiocaProcessando] =
    useState(false)
  const [resultadoFinal, setResultadoFinal] =
    useState(null)
  const [animacaoFinal, setAnimacaoFinal] =
    useState(null)
  const [mensagemLocal, setMensagemLocal] = useState(
    'Escolha somente as mandiocas com a cara da Tai. A mandioca normal é a armadilha.',
  )
  const [bonusRecebidoHoje, setBonusRecebidoHoje] =
    useState(
      () =>
        localStorage.getItem('taihenbet-bonus-diario') ===
        dataLocalHoje(),
    )
  const [apostaTaigrinho, setApostaTaigrinho] =
    useState('25')
  const [gradeTaigrinho, setGradeTaigrinho] = useState(
    criarGradeAleatoriaTaigrinho,
  )
  const [taigrinhoGirando, setTaigrinhoGirando] =
    useState(false)
  const [rolosParados, setRolosParados] = useState([
    true,
    true,
    true,
    true,
    true,
  ])
  const [resultadoTaigrinho, setResultadoTaigrinho] =
    useState(null)
  const [megaGanhoAtivo, setMegaGanhoAtivo] =
    useState(null)
  const [derrotaTaigrinhoAtiva, setDerrotaTaigrinhoAtiva] =
    useState(false)
  const [mensagemTaigrinho, setMensagemTaigrinho] =
    useState(
      'Escolha sua aposta e gire. A Entidade da Banca promete absolutamente nada.',
    )
  const intervalosTaigrinhoRef = useRef([])
  const timeoutsTaigrinhoRef = useRef([])
  const audioGiroTaigrinhoRef = useRef(null)
  const audioParadaTaigrinhoRef = useRef(null)
  const audioInicioTaiMandiocaRef = useRef(null)
  const audioSeguroTaiMandiocaRef = useRef(null)
  const audioDerrotaTaiMandiocaRef = useRef(null)
  const audioRecolherTaiMandiocaRef = useRef(null)
  const audioPerfeitoTaiMandiocaRef = useRef(null)
  const audioBonusTaiMandiocaRef = useRef(null)

  const [apostaCrash, setApostaCrash] = useState('25')
  const [crashRodando, setCrashRodando] =
    useState(false)
  const [crashProcessando, setCrashProcessando] =
    useState(false)
  const [multiplicadorCrash, setMultiplicadorCrash] =
    useState(1)
  const [pontosGraficoCrash, setPontosGraficoCrash] =
    useState([1])
  const [resultadoCrash, setResultadoCrash] =
    useState(null)
  const [overlayCrash, setOverlayCrash] =
    useState(null)
  const [mensagemCrash, setMensagemCrash] =
    useState(
      'A Comandante Taihen aguarda sua entrada na operação.',
    )
  const animacaoCrashRef = useRef(null)
  const pollingCrashRef = useRef(null)
  const pollingCrashOcupadoRef = useRef(false)
  const rodadaCrashRef = useRef(null)
  const rodadaCrashFinalizadaRef = useRef(null)
  const multiplicadorCrashRef = useRef(1)
  const offsetRelogioCrashRef = useRef(0)
  const audioSubidaCrashRef = useRef(null)
  const audioQuedaCrashRef = useRef(null)
  const audioRetiradaCrashRef = useRef(null)

  useEffect(() => {
    function selecionarJogoPeloTour(evento) {
      const jogo = evento.detail?.jogo
      const jogosValidos = [
        'taimandioca',
        'taigrinho',
        'crash-regime',
        'derby',
      ]

      if (!jogosValidos.includes(jogo)) {
        return
      }

      setJogoSelecionado(jogo)

      if (jogo === 'taigrinho') {
        setMensagemTaigrinho(
          'O Taigrinho acordou. Escolha sua aposta e entregue seu destino à banca.',
        )
      }

      if (jogo === 'crash-regime') {
        setMensagemCrash(
          'A Comandante assumiu o controle. Retire antes do confisco.',
        )
      }

      window.setTimeout(() => {
        document
          .querySelector(
            `[data-neytai-target="game-${jogo}"]`,
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
      }, 120)
    }

    window.addEventListener(
      'neytai:selecionar-jogo',
      selecionarJogoPeloTour,
    )

    return () => {
      window.removeEventListener(
        'neytai:selecionar-jogo',
        selecionarJogoPeloTour,
      )
    }
  }, [])

  useEffect(() => {
    let cancelado = false

    // Migração da versão antiga: o tabuleiro secreto não mora mais no navegador.
    localStorage.removeItem('taihenbet-taimandioca-partida')

    async function restaurarColheitaDoServidor() {
      if (!onCarregarTaiMandioca) {
        return
      }

      const estadoServidor = await onCarregarTaiMandioca()

      if (cancelado || !estadoServidor?.sessionId) {
        return
      }

      const partidaRestaurada = normalizarPartidaTaiMandioca(
        estadoServidor,
      )

      if (!partidaRestaurada) {
        return
      }

      setPartida(partidaRestaurada)
      setEntrada(String(partidaRestaurada.entrada))
      setQuantidadeMandiocasNormais(
        partidaRestaurada.quantidadeMandiocasNormais,
      )
      setResultadoFinal(null)
      setMensagemLocal(
        'Colheita restaurada do servidor. O navegador continua sem saber onde estão as mandiocas normais.',
      )
    }

    restaurarColheitaDoServidor()

    return () => {
      cancelado = true
    }
    // Executa só na montagem: o callback é apenas a ponte para a RPC.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!animacaoFinal) {
      return undefined
    }

    const temporizador = window.setTimeout(() => {
      setAnimacaoFinal(null)
    }, 3400)

    return () => window.clearTimeout(temporizador)
  }, [animacaoFinal])

  useEffect(
    () => () => {
      intervalosTaigrinhoRef.current.forEach(
        (intervalo) => {
          if (intervalo) {
            window.clearInterval(intervalo)
          }
        },
      )

      timeoutsTaigrinhoRef.current.forEach(
        (timeout) => {
          if (timeout) {
            window.clearTimeout(timeout)
          }
        },
      )

      const audioGiro = audioGiroTaigrinhoRef.current

      if (audioGiro) {
        audioGiro.pause()
        audioGiro.currentTime = 0
      }

      if (animacaoCrashRef.current) {
        window.cancelAnimationFrame(
          animacaoCrashRef.current,
        )
      }

      if (pollingCrashRef.current) {
        window.clearTimeout(pollingCrashRef.current)
        pollingCrashRef.current = null
      }

      pollingCrashOcupadoRef.current = false

      const audioCrash =
        audioSubidaCrashRef.current

      if (audioCrash) {
        audioCrash.pause()
        audioCrash.currentTime = 0
      }

      if (rodadaCrashRef.current) {
        rodadaCrashRef.current.ativa = false
      }
    },
    [],
  )

  useEffect(() => {
    let cancelado = false

    async function restaurarCrashAutoritativo() {
      const estadoServidor = await onConsultarCrash?.(null)

      if (cancelado || !estadoServidor?.sessionId) {
        return
      }

      if (estadoServidor.status === 'active') {
        iniciarCrashVisualDoServidor(
          estadoServidor,
          { restaurada: true },
        )
        return
      }

      finalizarCrashComEstado(estadoServidor)
    }

    restaurarCrashAutoritativo()

    return () => {
      cancelado = true
    }
    // A consulta é intencionalmente feita apenas quando a tela de jogos monta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabuleiroVisivel =
    partida || resultadoFinal?.partida || null

  const quantidadeRevelada =
    partida?.reveladas.length ||
    resultadoFinal?.partida?.reveladas.length ||
    0

  const perigosAtuais =
    partida?.quantidadeMandiocasNormais ||
    resultadoFinal?.partida?.quantidadeMandiocasNormais ||
    quantidadeMandiocasNormais

  const multiplicadorAtual = useMemo(() => {
    const multiplicadorSelado = Number(
      partida?.multiplicadorAtual ??
        resultadoFinal?.partida?.multiplicadorAtual,
    )

    if (
      Number.isFinite(multiplicadorSelado) &&
      multiplicadorSelado >= 1
    ) {
      return multiplicadorSelado
    }

    return calcularMultiplicador(
      perigosAtuais,
      quantidadeRevelada,
    )
  }, [
    partida?.multiplicadorAtual,
    resultadoFinal?.partida?.multiplicadorAtual,
    perigosAtuais,
    quantidadeRevelada,
  ])

  const retornoSelado = Number(
    partida?.retornoAtual ??
      resultadoFinal?.partida?.retornoAtual,
  )

  const retornoAtual =
    Number.isFinite(retornoSelado) && retornoSelado >= 0
      ? retornoSelado
      : Number(
          partida?.entrada ||
            resultadoFinal?.partida?.entrada ||
            0,
        ) * multiplicadorAtual

  const casasSegurasRestantes = tabuleiroVisivel
    ? TOTAL_CASAS -
      tabuleiroVisivel.quantidadeMandiocasNormais -
      quantidadeRevelada
    : TOTAL_CASAS - quantidadeMandiocasNormais

  const ultimasPartidas = historicoJogos
    .filter(
      (registro) => registro.jogo === 'TaiMandioca',
    )
    .slice(0, 5)

  const ultimosGirosTaigrinho = historicoJogos
    .filter(
      (registro) => registro.jogo === 'Taigrinho',
    )
    .slice(0, 5)

  const ultimasOperacoesCrash = historicoJogos
    .filter(
      (registro) =>
        registro.jogo === 'Crash do Regime',
    )
    .slice(0, 5)

  const graficoCrash = useMemo(
    () => gerarGraficoCrash(pontosGraficoCrash),
    [pontosGraficoCrash],
  )

  const retornoCrashAtual =
    Number(apostaCrash || 0) * multiplicadorCrash

  function iniciarSomDoGiro() {
    const audio = audioGiroTaigrinhoRef.current

    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
    audio.loop = true
    audio.volume = 0.48

    audio.play().catch(() => {
      setMensagemTaigrinho(
        'O navegador bloqueou o som automático. Clique novamente em Girar.',
      )
    })
  }

  function pararSomDoGiro() {
    const audio = audioGiroTaigrinhoRef.current

    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
  }

  function tocarSomDeParada(indiceDoRolo) {
    const audioBase = audioParadaTaigrinhoRef.current

    if (!audioBase) {
      return
    }

    const audio = audioBase.cloneNode()
    audio.volume = 0.52 + indiceDoRolo * 0.055
    audio.playbackRate = 0.96 + indiceDoRolo * 0.025

    audio.play().catch(() => {})
  }

  function finalizarGiroTaigrinho(
    gradeFinal,
    valorAposta,
    rodadaServidor,
  ) {
    const linhasVencedoras = Array.isArray(
      rodadaServidor?.linhasVencedoras,
    )
      ? rodadaServidor.linhasVencedoras
      : []
    const avaliacao = {
      multiplicadorTotal: Math.max(
        0,
        Number(rodadaServidor?.multiplicadorTotal) || 0,
      ),
      linhasVencedoras,
      megaGanho: Boolean(rodadaServidor?.megaGanho),
    }
    const premio = Math.max(
      0,
      Number(rodadaServidor?.premio) || 0,
    )
    const ganhou = premio > 0
    const walletRef = rodadaServidor?.roundId

    const registro = {
      jogo: 'Taigrinho',
      status: ganhou ? 'Ganhou' : 'Perdeu',
      entrada: valorAposta,
      premio,
      lucro:
        Number(rodadaServidor?.lucro) ||
        premio - valorAposta,
      multiplicador: avaliacao.multiplicadorTotal,
      linhasVencedoras: avaliacao.linhasVencedoras.length,
      megaGanho: avaliacao.megaGanho,
      iniciadaEm: Date.now() - 1800,
      encerradaEm: Date.now(),
      walletRef,
      roundId: walletRef,
      authoritative: true,
      walletSettled: true,
      walletProfile: rodadaServidor?.profile || null,
    }

    onFinalizarJogo?.(registro)

    setGradeTaigrinho(gradeFinal)
    setResultadoTaigrinho({
      ...avaliacao,
      premio,
      entrada: valorAposta,
      authoritative: true,
    })
    setTaigrinhoGirando(false)
    setRolosParados([
      true,
      true,
      true,
      true,
      true,
    ])
    pararSomDoGiro()

    if (!ganhou) {
      setDerrotaTaigrinhoAtiva(true)
      setMensagemTaigrinho(
        'Nenhuma linha pagou. O Paquetá tem um comunicado para você.',
      )
      return
    }

    if (avaliacao.megaGanho) {
      setMegaGanhoAtivo({
        premio,
        multiplicador:
          avaliacao.multiplicadorTotal,
      })
      setMensagemTaigrinho(
        `MEGA GANHO! ${formatarMoedas(
          premio,
        )} TaiCoins foram liberadas.`,
      )
      return
    }

    setMensagemTaigrinho(
      `Ganho normal: ${formatarMoedas(
        premio,
      )} TaiCoins em ${
        avaliacao.linhasVencedoras.length
      } linha(s).`,
    )
  }

  async function girarTaigrinho() {
    const valorAposta = Number(apostaTaigrinho)

    if (taigrinhoGirando) {
      return
    }

    if (
      !Number.isFinite(valorAposta) ||
      valorAposta < APOSTA_MINIMA_TAIGRINHO
    ) {
      setMensagemTaigrinho(
        `A aposta mínima é de ${APOSTA_MINIMA_TAIGRINHO} TaiCoins.`,
      )
      return
    }

    if (valorAposta > saldo) {
      setMensagemTaigrinho(
        'Você não possui TaiCoins suficientes para esse giro.',
      )
      return
    }

    intervalosTaigrinhoRef.current.forEach(
      (intervalo) => {
        if (intervalo) {
          window.clearInterval(intervalo)
        }
      },
    )

    timeoutsTaigrinhoRef.current.forEach(
      (timeout) => {
        if (timeout) {
          window.clearTimeout(timeout)
        }
      },
    )

    intervalosTaigrinhoRef.current = []
    timeoutsTaigrinhoRef.current = []

    setResultadoTaigrinho(null)
    setMegaGanhoAtivo(null)
    setDerrotaTaigrinhoAtiva(false)
    setRolosParados([
      false,
      false,
      false,
      false,
      false,
    ])
    setTaigrinhoGirando(true)
    setMensagemTaigrinho(
      'A banca está lacrando a rodada no servidor. O navegador agora só assiste.',
    )

    iniciarSomDoGiro()

    const rodadaServidor = await onGirarTaigrinho?.(valorAposta)
    const gradeFinal = rodadaServidor?.grade

    if (
      !rodadaServidor?.roundId ||
      !Array.isArray(gradeFinal) ||
      gradeFinal.length !== 5 ||
      gradeFinal.some(
        (rolo) => !Array.isArray(rolo) || rolo.length !== 3,
      )
    ) {
      pararSomDoGiro()
      setTaigrinhoGirando(false)
      setRolosParados([true, true, true, true, true])
      setMensagemTaigrinho(
        'A banca não conseguiu autenticar o resultado deste giro.',
      )
      return
    }

    setMensagemTaigrinho(
      'Resultado selado no servidor. Os rolos agora só estão fazendo teatro.',
    )

    const temposDeParada = [
      1500,
      1850,
      2200,
      2600,
      3050,
    ]

    Array.from({ length: 5 }, (_, indiceDoRolo) => {
      const intervalo = window.setInterval(() => {
        setGradeTaigrinho((gradeAtual) =>
          gradeAtual.map((rolo, indiceAtual) =>
            indiceAtual === indiceDoRolo
              ? Array.from(
                  { length: 3 },
                  () =>
                    sortearSimboloTaigrinho(),
                )
              : rolo,
          ),
        )
      }, 62 + indiceDoRolo * 5)

      intervalosTaigrinhoRef.current[
        indiceDoRolo
      ] = intervalo

      const timeout = window.setTimeout(() => {
        window.clearInterval(intervalo)

        setGradeTaigrinho((gradeAtual) =>
          gradeAtual.map((rolo, indiceAtual) =>
            indiceAtual === indiceDoRolo
              ? gradeFinal[indiceDoRolo]
              : rolo,
          ),
        )

        setRolosParados((estadoAtual) =>
          estadoAtual.map((parado, indiceAtual) =>
            indiceAtual === indiceDoRolo
              ? true
              : parado,
          ),
        )

        tocarSomDeParada(indiceDoRolo)

        if (indiceDoRolo === 3) {
          setMensagemTaigrinho(
            'ÚLTIMO ROLO... a banca está segurando o resultado de propósito.',
          )
        }

        if (indiceDoRolo === 4) {
          pararSomDoGiro()

          const timeoutFinal = window.setTimeout(() => {
            finalizarGiroTaigrinho(
              gradeFinal,
              valorAposta,
              rodadaServidor,
            )
          }, 340)

          timeoutsTaigrinhoRef.current.push(
            timeoutFinal,
          )
        }
      }, temposDeParada[indiceDoRolo])

      timeoutsTaigrinhoRef.current[
        indiceDoRolo
      ] = timeout
    })
  }

  function fecharMegaGanho() {
    setMegaGanhoAtivo(null)
  }

  function iniciarSomDoCrash() {
    const audio = audioSubidaCrashRef.current

    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
    audio.loop = true
    audio.volume = 0.42
    audio.playbackRate = 0.86

    audio.play().catch(() => {
      setMensagemCrash(
        'O navegador bloqueou o som. A operação continua selada no servidor.',
      )
    })
  }

  function pararSomDoCrash() {
    const audio = audioSubidaCrashRef.current

    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
    audio.playbackRate = 1
  }

  function atualizarSomDoCrash(multiplicador) {
    const audio = audioSubidaCrashRef.current

    if (!audio) {
      return
    }

    audio.playbackRate = Math.min(
      1.95,
      0.86 +
        Math.log2(Math.max(1, multiplicador)) *
          0.16,
    )

    audio.volume = Math.min(
      0.65,
      0.4 + multiplicador * 0.008,
    )
  }

  function tocarAudioDoCrash(referencia, volume = 0.7) {
    const audioBase = referencia.current

    if (!audioBase) {
      return
    }

    const audio = audioBase.cloneNode()
    audio.volume = volume
    audio.play().catch(() => {})
  }

  function pararPollingCrash() {
    if (pollingCrashRef.current) {
      window.clearTimeout(pollingCrashRef.current)
      pollingCrashRef.current = null
    }

    pollingCrashOcupadoRef.current = false
  }

  function sincronizarRelogioCrash(estadoServidor) {
    const agoraServidor = Date.parse(
      estadoServidor?.serverNow || '',
    )

    if (Number.isFinite(agoraServidor)) {
      offsetRelogioCrashRef.current =
        agoraServidor - Date.now()
    }
  }

  function finalizarCrashComEstado(estadoServidor) {
    const roundId =
      estadoServidor?.roundId ||
      estadoServidor?.sessionId

    if (!roundId) {
      return
    }

    if (rodadaCrashFinalizadaRef.current === roundId) {
      return
    }

    rodadaCrashFinalizadaRef.current = roundId

    const rodada = rodadaCrashRef.current

    if (rodada?.sessionId === roundId) {
      rodada.ativa = false
    }

    pararPollingCrash()

    if (animacaoCrashRef.current) {
      window.cancelAnimationFrame(
        animacaoCrashRef.current,
      )
      animacaoCrashRef.current = null
    }

    pararSomDoCrash()
    setCrashProcessando(false)
    setCrashRodando(false)

    const ganhou = estadoServidor.status === 'cashout'
    const valorAposta = Math.max(
      0,
      Number(estadoServidor.entrada) ||
        Number(rodada?.valorAposta) ||
        Number(apostaCrash) ||
        0,
    )
    const premio = Math.max(
      0,
      Number(estadoServidor.premio) || 0,
    )
    const pontoDeCrash = Math.max(
      1,
      Number(estadoServidor.crashPoint) || 1,
    )
    const multiplicador = ganhou
      ? Math.max(
          1,
          Number(
            estadoServidor.cashoutMultiplier ??
              estadoServidor.multiplicadorAtual,
          ) || 1,
        )
      : pontoDeCrash
    const lucro = Number.isFinite(
      Number(estadoServidor.lucro),
    )
      ? Number(estadoServidor.lucro)
      : premio - valorAposta
    const iniciadaEmServidor = Date.parse(
      estadoServidor.startedAt || '',
    )
    const iniciadaEm = Number.isFinite(
      iniciadaEmServidor,
    )
      ? iniciadaEmServidor
      : rodada?.iniciadaEm || Date.now()

    multiplicadorCrashRef.current = multiplicador
    setMultiplicadorCrash(multiplicador)
    setPontosGraficoCrash((pontosAtuais) => [
      ...pontosAtuais.slice(-88),
      multiplicador,
    ])

    onFinalizarJogo?.({
      jogo: 'Crash do Regime',
      status: ganhou ? 'Ganhou' : 'Perdeu',
      entrada: valorAposta,
      premio,
      lucro,
      multiplicador,
      pontoDeCrash,
      retiradaEm: ganhou ? multiplicador : null,
      iniciadaEm,
      encerradaEm: Date.now(),
      walletRef: roundId,
      roundId,
      authoritative: true,
      walletSettled: true,
      walletProfile: estadoServidor.profile || null,
    })

    setResultadoCrash({
      status: ganhou ? 'Ganhou' : 'Perdeu',
      entrada: valorAposta,
      premio,
      multiplicador,
      pontoDeCrash,
      authoritative: true,
    })

    if (ganhou) {
      tocarAudioDoCrash(
        audioRetiradaCrashRef,
        0.72,
      )

      setMensagemCrash(
        multiplicador >= 10
          ? 'Retirada histórica. O servidor confirmou sua fuga antes do confisco.'
          : 'Retirada validada pelo servidor sob protesto da Comandante.',
      )

      if (multiplicador >= 10) {
        setOverlayCrash({
          tipo: 'escapou',
          titulo: 'VOCÊ ESCAPOU DO REGIME!',
          subtitulo:
            'O servidor confirmou que a retirada chegou antes do confisco.',
          premio,
          multiplicador,
        })
      }

      return
    }

    tocarAudioDoCrash(
      audioQuedaCrashRef,
      0.82,
    )

    setMensagemCrash(
      'Operação encerrada pelo relógio da banca. O ponto de confisco foi revelado somente agora.',
    )

    setOverlayCrash({
      tipo: 'confiscado',
      titulo: 'OPERAÇÃO ENCERRADA!',
      subtitulo:
        'O servidor registrou o confisco antes de qualquer retirada válida.',
      premio: 0,
      multiplicador,
    })
  }

  function animarRodadaCrash() {
    const rodada = rodadaCrashRef.current

    if (!rodada?.ativa) {
      return
    }

    const agoraServidorEstimado =
      Date.now() + offsetRelogioCrashRef.current
    const tempoDecorrido = Math.max(
      0,
      agoraServidorEstimado - rodada.iniciadaEm,
    )
    const multiplicadorCalculado =
      calcularMultiplicadorDoCrash(
        tempoDecorrido,
      )
    const multiplicadorExibido = Number(
      multiplicadorCalculado.toFixed(2),
    )

    multiplicadorCrashRef.current =
      multiplicadorExibido

    setMultiplicadorCrash(
      multiplicadorExibido,
    )

    setPontosGraficoCrash((pontosAtuais) => [
      ...pontosAtuais.slice(-89),
      multiplicadorExibido,
    ])

    atualizarSomDoCrash(
      multiplicadorExibido,
    )

    animacaoCrashRef.current =
      window.requestAnimationFrame(
        animarRodadaCrash,
      )
  }

  function agendarConsultaCrash(delay = CRASH_POLL_INTERVAL_MS) {
    pararPollingCrash()

    pollingCrashRef.current = window.setTimeout(
      async () => {
        const rodada = rodadaCrashRef.current

        if (!rodada?.ativa) {
          return
        }

        if (pollingCrashOcupadoRef.current) {
          agendarConsultaCrash(CRASH_POLL_RETRY_MS)
          return
        }

        pollingCrashOcupadoRef.current = true

        try {
          const estadoServidor =
            await onConsultarCrash?.(rodada.sessionId)

          if (!rodadaCrashRef.current?.ativa) {
            return
          }

          if (!estadoServidor?.sessionId) {
            setMensagemCrash(
              'O fiscal perdeu uma atualização do servidor. Tentando novamente...',
            )
          } else {
            sincronizarRelogioCrash(estadoServidor)

            if (estadoServidor.status !== 'active') {
              finalizarCrashComEstado(estadoServidor)
              return
            }
          }
        } finally {
          pollingCrashOcupadoRef.current = false
        }

        if (rodadaCrashRef.current?.ativa) {
          agendarConsultaCrash(CRASH_POLL_INTERVAL_MS)
        }
      },
      delay,
    )
  }

  function iniciarCrashVisualDoServidor(
    estadoServidor,
    { restaurada = false } = {},
  ) {
    if (!estadoServidor?.sessionId) {
      return false
    }

    if (estadoServidor.status !== 'active') {
      finalizarCrashComEstado(estadoServidor)
      return false
    }

    const iniciadaEm = Date.parse(
      estadoServidor.startedAt || '',
    )

    if (!Number.isFinite(iniciadaEm)) {
      setMensagemCrash(
        'A banca devolveu um relógio inválido para esta operação.',
      )
      return false
    }

    sincronizarRelogioCrash(estadoServidor)

    if (animacaoCrashRef.current) {
      window.cancelAnimationFrame(
        animacaoCrashRef.current,
      )
    }

    pararPollingCrash()

    const valorAposta = Math.max(
      0,
      Number(estadoServidor.entrada) || 0,
    )
    const multiplicadorInicial = Math.max(
      1,
      Number(estadoServidor.multiplicadorAtual) || 1,
    )

    rodadaCrashFinalizadaRef.current = null
    rodadaCrashRef.current = {
      ativa: true,
      sessionId: estadoServidor.sessionId,
      roundId:
        estadoServidor.roundId || estadoServidor.sessionId,
      valorAposta,
      iniciadaEm,
      authoritative: true,
    }

    multiplicadorCrashRef.current = multiplicadorInicial
    setMultiplicadorCrash(multiplicadorInicial)
    setPontosGraficoCrash([1, multiplicadorInicial])
    setResultadoCrash(null)
    setOverlayCrash(null)
    setCrashProcessando(false)
    setCrashRodando(true)
    setApostaCrash(String(valorAposta || apostaCrash))

    if (restaurada) {
      setJogoSelecionado('crash-regime')
      setMensagemCrash(
        'Operação restaurada do servidor. O ponto de confisco continua secreto.',
      )
    } else {
      setMensagemCrash(
        'Operação selada no servidor. O navegador só acompanha o relógio da banca.',
      )
    }

    iniciarSomDoCrash()

    animacaoCrashRef.current =
      window.requestAnimationFrame(
        animarRodadaCrash,
      )

    agendarConsultaCrash(CRASH_POLL_INITIAL_MS)
    return true
  }

  async function iniciarRodadaCrash() {
    const valorAposta = Number(apostaCrash)

    if (crashRodando || crashProcessando) {
      return
    }

    if (
      !Number.isFinite(valorAposta) ||
      valorAposta < APOSTA_MINIMA_CRASH
    ) {
      setMensagemCrash(
        `A entrada mínima é de ${APOSTA_MINIMA_CRASH} TaiCoins.`,
      )
      return
    }

    if (valorAposta > saldo) {
      setMensagemCrash(
        'Saldo insuficiente para financiar a operação.',
      )
      return
    }

    setCrashProcessando(true)
    setResultadoCrash(null)
    setOverlayCrash(null)
    setMensagemCrash(
      'A Comandante está selando o ponto de confisco no servidor...',
    )

    try {
      const estadoServidor =
        await onIniciarCrash?.(valorAposta)

      if (!estadoServidor?.sessionId) {
        setMensagemCrash(
          'A banca não conseguiu autenticar esta operação.',
        )
        return
      }

      if (estadoServidor.status !== 'active') {
        // Pode acontecer ao recuperar uma operação anterior que caiu enquanto
        // a aba estava fechada. Nenhuma nova entrada é cobrada neste caso.
        finalizarCrashComEstado(estadoServidor)
        return
      }

      iniciarCrashVisualDoServidor(estadoServidor)
    } finally {
      setCrashProcessando(false)
    }
  }

  async function retirarDoCrash() {
    const rodada = rodadaCrashRef.current

    if (
      !rodada?.ativa ||
      !rodada.sessionId ||
      crashProcessando
    ) {
      return
    }

    setCrashProcessando(true)
    setMensagemCrash(
      'Pedido de retirada enviado. O servidor está comparando os relógios...',
    )

    try {
      const estadoServidor =
        await onRetirarCrash?.(rodada.sessionId)

      if (!estadoServidor?.sessionId) {
        setMensagemCrash(
          'A banca não conseguiu confirmar a retirada. A operação continua sob consulta.',
        )
        return
      }

      sincronizarRelogioCrash(estadoServidor)
      finalizarCrashComEstado(estadoServidor)
    } finally {
      setCrashProcessando(false)
    }
  }

  function tocarSomTaiMandioca(
    referencia,
    {
      volume = 0.72,
      playbackRate = 1,
    } = {},
  ) {
    const audioBase = referencia.current

    if (!audioBase) {
      return
    }

    const audio = audioBase.cloneNode()
    audio.volume = volume
    audio.playbackRate = playbackRate
    audio.play().catch(() => {})
  }

  async function iniciarPartida() {
    const valorEntrada = Number(entrada)

    if (taiMandiocaProcessando) {
      return
    }

    if (
      !Number.isFinite(valorEntrada) ||
      valorEntrada < ENTRADA_MINIMA
    ) {
      setMensagemLocal(
        `A entrada mínima é de ${ENTRADA_MINIMA} TaiCoins.`,
      )
      return
    }

    if (valorEntrada > saldo) {
      setMensagemLocal(
        'Você não possui TaiCoins suficientes para entrar nessa roça.',
      )
      return
    }

    setTaiMandiocaProcessando(true)
    setMensagemLocal(
      'A banca está enterrando as mandiocas normais fora do alcance do DevTools...',
    )

    try {
      const estadoServidor = await onIniciarTaiMandioca?.(
        valorEntrada,
        quantidadeMandiocasNormais,
      )

      const novaPartida = normalizarPartidaTaiMandioca(
        estadoServidor,
      )

      if (!novaPartida) {
        setMensagemLocal(
          'A plantação não pôde ser selada no servidor.',
        )
        return
      }

      tocarSomTaiMandioca(
        audioInicioTaiMandiocaRef,
        {
          volume: 0.68,
        },
      )

      setResultadoFinal(null)
      setAnimacaoFinal(null)
      setPartida(novaPartida)
      setEntrada(String(novaPartida.entrada))
      setQuantidadeMandiocasNormais(
        novaPartida.quantidadeMandiocasNormais,
      )
      setMensagemLocal(
        estadoServidor?.evento === 'resume'
          ? 'A banca recuperou sua plantação ativa. O mapa secreto nunca saiu do servidor.'
          : 'Plantação selada no servidor. Escolha uma casa; o navegador não sabe onde está a mandioca normal.',
      )
    } finally {
      setTaiMandiocaProcessando(false)
    }
  }

  function registrarResultadoAutoritativo({
    status,
    partidaEncerrada,
    estadoServidor,
    casaFatal = null,
  }) {
    const premio = Math.max(
      0,
      Number(estadoServidor?.premio) || 0,
    )
    const multiplicador = Math.max(
      1,
      Number(estadoServidor?.multiplicadorAtual) || 1,
    )

    onFinalizarJogo?.({
      jogo: 'TaiMandioca',
      status,
      entrada: partidaEncerrada.entrada,
      premio,
      lucro:
        Number(estadoServidor?.lucro) ||
        premio - partidaEncerrada.entrada,
      multiplicador,
      mandiocasNormais:
        partidaEncerrada.quantidadeMandiocasNormais,
      casasReveladas:
        partidaEncerrada.reveladas.length,
      casaFatal,
      iniciadaEm: partidaEncerrada.iniciadaEm,
      encerradaEm: Date.now(),
      walletRef: partidaEncerrada.walletRef || partidaEncerrada.id,
      roundId: estadoServidor?.roundId || partidaEncerrada.id,
      authoritative: true,
      walletSettled: true,
      walletProfile: estadoServidor?.profile || null,
    })
  }

  async function revelarCasa(indice) {
    if (
      !partida ||
      partida.reveladas.includes(indice) ||
      taiMandiocaProcessando
    ) {
      return
    }

    setTaiMandiocaProcessando(true)

    try {
      const estadoServidor = await onRevelarTaiMandioca?.(
        partida.id,
        indice,
      )

      if (!estadoServidor?.sessionId) {
        setMensagemLocal(
          'A banca não conseguiu consultar essa mandioca no servidor.',
        )
        return
      }

      const partidaAtualizada = {
        ...normalizarPartidaTaiMandioca(estadoServidor),
        iniciadaEm: partida.iniciadaEm,
      }

      if (estadoServidor.evento === 'lost') {
        tocarSomTaiMandioca(
          audioDerrotaTaiMandiocaRef,
          {
            volume: 0.84,
          },
        )

        const casaFatal = Number(
          estadoServidor.fatalIndex ?? indice,
        )
        const partidaPerdida = {
          ...partidaAtualizada,
          casaFatal,
        }

        registrarResultadoAutoritativo({
          status: 'Perdeu',
          partidaEncerrada: partidaPerdida,
          estadoServidor,
          casaFatal,
        })

        setPartida(null)
        setResultadoFinal({
          status: 'Perdeu',
          partida: partidaPerdida,
          premio: 0,
        })
        setAnimacaoFinal({
          id: crypto.randomUUID(),
          status: 'perdeu',
          titulo: 'VOCÊ FOI MANDIOCADO!',
          subtitulo:
            'O servidor confirmou: era uma mandioca normal.',
          premio: 0,
        })
        setMensagemLocal(
          'MANDIOCA NORMAL! A decisão veio do servidor e a plantação ficou com sua entrada.',
        )
        return
      }

      if (estadoServidor.evento === 'perfect') {
        tocarSomTaiMandioca(
          audioPerfeitoTaiMandiocaRef,
          {
            volume: 0.78,
          },
        )

        const premio = Math.max(
          0,
          Number(estadoServidor.premio) || 0,
        )

        registrarResultadoAutoritativo({
          status: 'Ganhou',
          partidaEncerrada: partidaAtualizada,
          estadoServidor,
        })

        setPartida(null)
        setResultadoFinal({
          status: 'Ganhou',
          partida: partidaAtualizada,
          premio,
        })
        setAnimacaoFinal({
          id: crypto.randomUUID(),
          status: 'ganhou',
          titulo: 'COLHEITA PERFEITA!',
          subtitulo:
            'O servidor confirmou todas as TaiMandiocas seguras.',
          premio,
        })
        setMensagemLocal(
          `Colheita perfeita selada no servidor: ${formatarMoedas(
            premio,
          )} TaiCoins.`,
        )
        return
      }

      if (
        estadoServidor.evento === 'safe' ||
        estadoServidor.evento === 'already_revealed'
      ) {
        tocarSomTaiMandioca(
          audioSeguroTaiMandiocaRef,
          {
            volume: 0.62,
            playbackRate:
              1 + partidaAtualizada.reveladas.length * 0.025,
          },
        )

        setPartida(partidaAtualizada)
        setMensagemLocal(
          `TAIMANDIOCA CONFIRMADA PELO SERVIDOR! Retorno atual: ${formatarMoedas(
            Number(estadoServidor.retornoAtual) || 0,
          )} TaiCoins.`,
        )
      }
    } finally {
      setTaiMandiocaProcessando(false)
    }
  }

  async function recolherPremio() {
    if (
      !partida ||
      partida.reveladas.length === 0 ||
      taiMandiocaProcessando
    ) {
      if (partida && partida.reveladas.length === 0) {
        setMensagemLocal(
          'Encontre ao menos uma TaiMandioca antes de recolher.',
        )
      }
      return
    }

    setTaiMandiocaProcessando(true)

    try {
      const estadoServidor = await onRecolherTaiMandioca?.(
        partida.id,
      )

      if (
        !estadoServidor?.sessionId ||
        estadoServidor.evento !== 'cashout'
      ) {
        setMensagemLocal(
          'A banca não conseguiu liquidar a colheita no servidor.',
        )
        return
      }

      const partidaEncerrada = {
        ...normalizarPartidaTaiMandioca(estadoServidor),
        iniciadaEm: partida.iniciadaEm,
      }
      const premio = Math.max(
        0,
        Number(estadoServidor.premio) || 0,
      )

      tocarSomTaiMandioca(
        audioRecolherTaiMandiocaRef,
        {
          volume: 0.74,
        },
      )

      registrarResultadoAutoritativo({
        status: 'Ganhou',
        partidaEncerrada,
        estadoServidor,
      })

      setPartida(null)
      setResultadoFinal({
        status: 'Ganhou',
        partida: partidaEncerrada,
        premio,
      })
      setAnimacaoFinal({
        id: crypto.randomUUID(),
        status: 'ganhou',
        titulo: 'COLHEITA GARANTIDA!',
        subtitulo:
          'O servidor liquidou sua saída antes da mandioca normal.',
        premio,
      })
      setMensagemLocal(
        `Cashout liquidado no servidor: ${formatarMoedas(
          premio,
        )} TaiCoins retornaram para a carteira.`,
      )
    } finally {
      setTaiMandiocaProcessando(false)
    }
  }

  function limparResultado() {
    setResultadoFinal(null)
    setMensagemLocal(
      'Configure uma nova colheita. A mandioca normal continua escondida.',
    )
  }

  async function receberBonusDiario() {
    if (bonusRecebidoHoje) {
      setMensagemLocal(
        'A Entidade já entregou sua cesta diária de mandiocas.',
      )
      return
    }

    tocarSomTaiMandioca(
      audioBonusTaiMandiocaRef,
      {
        volume: 0.66,
      },
    )

    const recebeu = await onReceberBonus?.(BONUS_DIARIO)
    if (!recebeu) return
    localStorage.setItem(
      'taihenbet-bonus-diario',
      dataLocalHoje(),
    )
    setBonusRecebidoHoje(true)
    setMensagemLocal(
      `A Entidade concedeu ${BONUS_DIARIO} TaiCoins para financiar a colheita.`,
    )
  }

  return (
    <section className="games-page">
      <audio
        ref={audioInicioTaiMandiocaRef}
        src={somInicioTaiMandioca}
        preload="auto"
      />

      <audio
        ref={audioSeguroTaiMandiocaRef}
        src={somSeguroTaiMandioca}
        preload="auto"
      />

      <audio
        ref={audioDerrotaTaiMandiocaRef}
        src={somDerrotaTaiMandioca}
        preload="auto"
      />

      <audio
        ref={audioRecolherTaiMandiocaRef}
        src={somRecolherTaiMandioca}
        preload="auto"
      />

      <audio
        ref={audioPerfeitoTaiMandiocaRef}
        src={somPerfeitoTaiMandioca}
        preload="auto"
      />

      <audio
        ref={audioBonusTaiMandiocaRef}
        src={somBonusTaiMandioca}
        preload="auto"
      />

      <audio
        ref={audioGiroTaigrinhoRef}
        src={somGiroTaigrinho}
        preload="auto"
      />

      <audio
        ref={audioParadaTaigrinhoRef}
        src={somParadaTaigrinho}
        preload="auto"
      />

      <audio
        ref={audioSubidaCrashRef}
        src={somSubidaCrash}
        preload="auto"
      />

      <audio
        ref={audioQuedaCrashRef}
        src={somQuedaCrash}
        preload="auto"
      />

      <audio
        ref={audioRetiradaCrashRef}
        src={somRetiradaCrash}
        preload="auto"
      />

      {overlayCrash && (
        <div
          className={`regime-result-overlay ${overlayCrash.tipo}`}
          role="alert"
        >
          <div className="regime-result-background">
            <img
              src={taihenDitadora}
              alt=""
              aria-hidden="true"
            />
          </div>

          <div className="regime-result-card">
            <div className="regime-result-images">
              <img
                className="regime-result-commander"
                src={taihenDitadora}
                alt="Comandante Taihen"
              />

              {overlayCrash.tipo === 'confiscado' && (
                <img
                  className="regime-result-fiscal"
                  src={fiscalRegime}
                  alt="Fiscal do regime"
                />
              )}
            </div>

            <span>
              {overlayCrash.tipo === 'confiscado'
                ? 'DECRETO DA COMANDANTE'
                : 'RETIRADA NÃO AUTORIZADA PELO REGIME'}
            </span>

            <h2>{overlayCrash.titulo}</h2>

            <p>{overlayCrash.subtitulo}</p>

            <strong>
              {overlayCrash.tipo === 'confiscado'
                ? `CAIU EM ${overlayCrash.multiplicador.toFixed(
                    2,
                  )}x`
                : `+${formatarMoedas(
                    overlayCrash.premio,
                  )} TAICOINS`}
            </strong>

            {overlayCrash.tipo === 'confiscado' && (
              <div className="regime-confiscation-note">
                <b>FISCAL DO REGIME:</b>
                Seus bens foram confiscados pela banca.
              </div>
            )}

            <button
              type="button"
              onClick={() => setOverlayCrash(null)}
            >
              {overlayCrash.tipo === 'confiscado'
                ? 'Aceitar o confisco'
                : 'Fugir antes que mudem de ideia'}
            </button>
          </div>
        </div>
      )}

      {megaGanhoAtivo && (
        <div
          className="taigrinho-mega-overlay"
          role="alert"
        >
          <div
            className="taigrinho-mega-confetti"
            aria-hidden="true"
          >
            {Array.from({ length: 24 }, (_, indice) => (
              <span key={indice} />
            ))}
          </div>

          <div className="taigrinho-mega-card">
            <span>O TAIGRINHO ABENÇOOU</span>

            <h2>MEGA GANHO!</h2>

            <video
              src={megaWinVideo}
              autoPlay
              playsInline
              controls
              onEnded={fecharMegaGanho}
            />

            <strong>
              +{formatarMoedas(
                megaGanhoAtivo.premio,
              )} TaiCoins
            </strong>

            <p>
              Multiplicador total:{' '}
              {megaGanhoAtivo.multiplicador.toFixed(
                2,
              )}
              x
            </p>

            <button
              type="button"
              onClick={fecharMegaGanho}
            >
              Continuar enriquecendo ficticiamente
            </button>
          </div>
        </div>
      )}

      {derrotaTaigrinhoAtiva && (
        <div
          className="taigrinho-loss-overlay"
          role="alert"
          onClick={() =>
            setDerrotaTaigrinhoAtiva(false)
          }
        >
          <div className="taigrinho-loss-card">
            <img
              src={paquetaMeme}
              alt="Comunicado de derrota do Taigrinho"
            />

            <span>COMUNICADO OFICIAL DA BANCA</span>

            <h2>
              Aposta mais aí, otário.
              <br />
              Se fudeu KKKKKKKKKKKKKKKK
            </h2>

            <p>
              Nenhuma linha vencedora. A banca agradece
              pelas TaiCoins.
            </p>

            <button
              type="button"
              onClick={() =>
                setDerrotaTaigrinhoAtiva(false)
              }
            >
              Tentar se humilhar novamente
            </button>
          </div>
        </div>
      )}

      {animacaoFinal && (
        <div
          className={`cassava-celebration ${animacaoFinal.status}`}
          role="alert"
          onClick={() => setAnimacaoFinal(null)}
        >
          <div
            className="cassava-celebration-particles"
            aria-hidden="true"
          >
            {Array.from({ length: 16 }, (_, indice) => (
              <span key={indice} />
            ))}
          </div>

          <div className="cassava-celebration-card">
            <div
              className="cassava-celebration-rings"
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
            </div>

            <div className="cassava-celebration-image">
              <img
                src={
                  animacaoFinal.status === 'ganhou'
                    ? taiMandioca
                    : mandiocaNormal
                }
                alt=""
                aria-hidden="true"
              />
            </div>

            <span className="cassava-celebration-kicker">
              RESULTADO DA COLHEITA
            </span>

            <h2>{animacaoFinal.titulo}</h2>

            <p>{animacaoFinal.subtitulo}</p>

            {animacaoFinal.status === 'ganhou' && (
              <strong className="cassava-celebration-prize">
                +{formatarMoedas(animacaoFinal.premio)} TaiCoins
              </strong>
            )}

            {animacaoFinal.status === 'perdeu' && (
              <strong className="cassava-celebration-prize">
                A BANCA FICOU COM A ENTRADA
              </strong>
            )}

            <small>Clique em qualquer lugar para fechar</small>
          </div>
        </div>
      )}

      <div className="games-header">
        <div>
          <span className="games-eyebrow">
            {jogoSelecionado === 'taigrinho'
              ? 'CASSINO FICTÍCIO DO TAIHENVERSE'
              : jogoSelecionado === 'crash-regime'
                ? 'OPERAÇÃO FINANCEIRA DO REGIME'
                : jogoSelecionado === 'derby'
                  ? 'HIPÓDROMO DO PROTOCOLO MAMBO'
                  : 'ROÇA AMALDIÇOADA DA TAIHEN'}
          </span>

          <h1>Jogos da Entidade</h1>

          <p>
            {jogoSelecionado === 'taigrinho'
              ? 'Gire os rolos usando apenas TaiCoins gratuitas. Não existe depósito, compra, saque ou prêmio real.'
              : jogoSelecionado === 'crash-regime'
                ? 'Retire suas TaiCoins antes que a Comandante encerre o multiplicador. Tudo é fictício e sem valor financeiro.'
                : jogoSelecionado === 'derby'
                  ? 'Escolha uma Umamusume e sobreviva ao Protocolo Mambo. Corrida fictícia, sem dinheiro ou prêmio real.'
                  : 'Minijogos fictícios usando apenas TaiCoins gratuitas. Nenhuma mandioca, moeda real ou dignidade possui valor financeiro.'}
          </p>
        </div>

        <button
          type="button"
          data-neytai-target="daily-bonus"
          className={`daily-bonus-button ${
            bonusRecebidoHoje ? 'claimed' : ''
          }`}
          onClick={receberBonusDiario}
        >
          <img src={taihenModelo2026} alt="" aria-hidden="true" />

          <span>
            <small>
              {jogoSelecionado === 'taimandioca'
                ? 'CESTA DIÁRIA'
                : 'BÊNÇÃO DIÁRIA'}
            </small>
            <strong>
              {bonusRecebidoHoje
                ? 'Já recebida'
                : `+${BONUS_DIARIO} TaiCoins`}
            </strong>
          </span>
        </button>
      </div>

      <div
        className="games-catalog"
        data-neytai-target="games-catalog"
      >
        <button
          type="button"
          data-neytai-target="game-taimandioca"
          className={`game-catalog-card cassava-catalog-card ${
            jogoSelecionado === 'taimandioca'
              ? 'active'
              : ''
          }`}
          onClick={() => setJogoSelecionado('taimandioca')}
        >
          <div className="game-catalog-icon cassava-icon">
            <img
              src={taiMandioca}
              alt="Mandioca com a cara da Tai"
            />
          </div>

          <div>
            <span>SAFRA 2026 · DISPONÍVEL</span>
            <h2>TaiMandioca</h2>
            <p>
              Escolha as mandiocas com a cara da Tai. A mandioca
              normal é a armadilha.
            </p>
          </div>
        </button>

        <button
          type="button"
          data-neytai-target="game-taigrinho"
          className={`game-catalog-card taigrinho-catalog-card ${
            jogoSelecionado === 'taigrinho'
              ? 'active'
              : ''
          }`}
          onClick={() => {
            setJogoSelecionado('taigrinho')
            setMensagemTaigrinho(
              'O Taigrinho acordou. Escolha sua aposta e entregue seu destino à banca.',
            )
          }}
        >
          <div className="game-catalog-icon tiger-icon">
            <img
              src={taihenModelo2026}
              alt="Taihen do modelo 2026"
            />
          </div>

          <div>
            <span>CASSINO 2.0 · DISPONÍVEL</span>
            <h2>Taigrinho</h2>
            <p>
              Cinco rolos, linhas malucas, Paquetá na derrota e
              vídeo especial no mega ganho.
            </p>
          </div>
        </button>

        <button
          type="button"
          data-neytai-target="game-crash-regime"
          className={`game-catalog-card regime-catalog-card ${
            jogoSelecionado === 'crash-regime'
              ? 'active'
              : ''
          }`}
          onClick={() => {
            setJogoSelecionado('crash-regime')
            setMensagemCrash(
              'A Comandante assumiu o controle. Retire antes do confisco.',
            )
          }}
        >
          <div className="game-catalog-icon regime-icon">
            <img
              src={taihenDitadora}
              alt="Comandante Taihen"
            />
          </div>

          <div>
            <span>NOVO REGIME · DISPONÍVEL</span>
            <h2>Crash do Regime</h2>
            <p>
              O multiplicador sobe até a Comandante encerrar a
              operação e confiscar suas TaiCoins.
            </p>
          </div>
        </button>

        <button
          type="button"
          data-neytai-target="game-derby"
          className={`game-catalog-card derby-catalog-card ${
            jogoSelecionado === 'derby'
              ? 'active'
              : ''
          }`}
          onClick={() => setJogoSelecionado('derby')}
        >
          <div className="game-catalog-icon derby-icon">
            <img
              src={matikanetannhauserCard}
              alt="Matikanetannhauser Mambo"
            />
          </div>

          <div>
            <span>PROTOCOLO MAMBO · ATIVO</span>
            <h2>Taihen Derby</h2>
            <p>
              Seis Umamusumes, vídeos de vitória e o
              criminosíssimo Protocolo Mambo.
            </p>
          </div>
        </button>
      </div>

      {jogoSelecionado === 'derby' ? (
        <div
          className="neytai-game-area-target"
          data-neytai-target="game-area-derby"
        >
          <DerbyPage
            saldo={saldo}
            onIniciarCorrida={onIniciarDerby}
            onConsultarCorrida={onConsultarDerby}
            onFinalizarCorrida={onFinalizarCorridaDerby}
          />
        </div>
      ) : jogoSelecionado === 'taimandioca' ? (
        <div
          className="cassava-layout"
          data-neytai-target="game-area-taimandioca"
        >
          <div className="cassava-main">
            <div className="cassava-toolbar">
              <div>
                <span>SAFRA 2026 · JOGO ATIVO</span>
                <h2>TaiMandioca</h2>
                <small className="cassava-authoritative-badge">
                  Tabuleiro + prêmio selados no servidor
                </small>
              </div>

              <div className="cassava-balance">
                <span>Seu saldo</span>
                <strong>
                  {formatarMoedas(saldo)} TaiCoins
                </strong>
              </div>
            </div>

            <div className="cassava-rules">
              <div className="cassava-rule safe-rule">
                <img src={taiMandioca} alt="" />
                <span>
                  <strong>TAIMANDIOCA</strong>
                  Segura — aumenta seu multiplicador
                </span>
              </div>

              <div className="cassava-rule danger-rule">
                <img src={mandiocaNormal} alt="" />
                <span>
                  <strong>MANDIOCA NORMAL</strong>
                  Armadilha — encerra a colheita
                </span>
              </div>
            </div>

            <div className="cassava-stats">
              <article>
                <span>Entrada</span>
                <strong>
                  {formatarMoedas(
                    tabuleiroVisivel?.entrada ||
                      Number(entrada),
                  )}
                </strong>
              </article>

              <article>
                <span>Multiplicador</span>
                <strong>
                  {multiplicadorAtual.toFixed(2)}x
                </strong>
              </article>

              <article>
                <span>Retorno possível</span>
                <strong>
                  {formatarMoedas(retornoAtual)} TaiCoins
                </strong>
              </article>

              <article>
                <span>TaiMandiocas restantes</span>
                <strong>{casasSegurasRestantes}</strong>
              </article>
            </div>

            <div
              className={`cassava-board ${
                partida ? 'playing' : 'waiting'
              } ${
                resultadoFinal ? 'showing-result' : ''
              }`}
            >
              {Array.from(
                { length: TOTAL_CASAS },
                (_, indice) => {
                  const revelada =
                    tabuleiroVisivel?.reveladas.includes(
                      indice,
                    )
                  const fatal =
                    resultadoFinal?.status === 'Perdeu' &&
                    resultadoFinal.partida.casaFatal ===
                      indice

                  return (
                    <button
                      type="button"
                      className={`cassava-cell ${
                        revelada ? 'safe' : ''
                      } ${fatal ? 'danger' : ''}`}
                      key={indice}
                      disabled={!partida || revelada || taiMandiocaProcessando}
                      onClick={() => revelarCasa(indice)}
                      aria-label={`Mandioca ${indice + 1}`}
                    >
                      {fatal ? (
                        <>
                          <img
                            src={mandiocaNormal}
                            alt="Mandioca normal"
                          />
                          <span>PERDEU</span>
                        </>
                      ) : revelada ? (
                        <>
                          <img
                            src={taiMandioca}
                            alt="TaiMandioca segura"
                          />
                          <span>TAI!</span>
                        </>
                      ) : (
                        <>
                          <div className="cassava-hidden-root">
                            <span>?</span>
                          </div>
                          <small>
                            MANDIOCA {indice + 1}
                          </small>
                        </>
                      )}
                    </button>
                  )
                },
              )}

              {!tabuleiroVisivel && (
                <div className="cassava-board-overlay">
                  <img
                    src={taiMandioca}
                    alt="TaiMandioca"
                  />

                  <div>
                    <span>A ROÇA AGUARDA</span>
                    <strong>
                      Encontre somente as TaiMandiocas
                    </strong>
                    <small>
                      A mandioca normal é a mina disfarçada.
                    </small>
                  </div>
                </div>
              )}
            </div>

            {partida && (
              <button
                type="button"
                className="cassava-cashout"
                disabled={partida.reveladas.length === 0 || taiMandiocaProcessando}
                onClick={recolherPremio}
              >
                Colher {formatarMoedas(retornoAtual)} TaiCoins
              </button>
            )}

            {resultadoFinal && (
              <div
                className={`cassava-result-banner ${
                  resultadoFinal.status === 'Ganhou'
                    ? 'won'
                    : 'lost'
                }`}
              >
                <img
                  src={
                    resultadoFinal.status === 'Ganhou'
                      ? taiMandioca
                      : mandiocaNormal
                  }
                  alt=""
                />

                <div>
                  <span>
                    {resultadoFinal.status === 'Ganhou'
                      ? 'COLHEITA ENCERRADA'
                      : 'MANDIOCA NORMAL ENCONTRADA'}
                  </span>

                  <strong>
                    {resultadoFinal.status === 'Ganhou'
                      ? `Prêmio: ${formatarMoedas(
                          resultadoFinal.premio,
                        )} TaiCoins`
                      : 'A Entidade da Banca ficou com a entrada.'}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={limparResultado}
                >
                  Nova colheita
                </button>
              </div>
            )}
          </div>

          <aside className="cassava-sidebar">
            <article className="cassava-config-card">
              <div className="games-side-heading">
                <span>CONFIGURAÇÃO</span>
                <h2>Prepare a plantação</h2>
              </div>

              <label className="game-field">
                <span>Entrada em TaiCoins</span>

                <input
                  type="number"
                  min={ENTRADA_MINIMA}
                  max={saldo}
                  value={entrada}
                  disabled={
                    Boolean(partida) ||
                    Boolean(resultadoFinal)
                  }
                  onChange={(event) =>
                    setEntrada(event.target.value)
                  }
                />
              </label>

              <div className="game-quick-values">
                {[10, 25, 50, 100].map((valor) => (
                  <button
                    type="button"
                    key={valor}
                    disabled={
                      Boolean(partida) ||
                      Boolean(resultadoFinal)
                    }
                    onClick={() =>
                      setEntrada(String(valor))
                    }
                  >
                    {valor}
                  </button>
                ))}
              </div>

              <div className="danger-selector">
                <span>Mandiocas normais escondidas</span>

                {configuracoesPerigo.map(
                  (configuracao) => (
                    <button
                      type="button"
                      className={
                        quantidadeMandiocasNormais ===
                        configuracao.quantidade
                          ? 'selected'
                          : ''
                      }
                      key={configuracao.quantidade}
                      disabled={
                        Boolean(partida) ||
                        Boolean(resultadoFinal)
                      }
                      onClick={() =>
                        setQuantidadeMandiocasNormais(
                          configuracao.quantidade,
                        )
                      }
                    >
                      <strong>
                        {configuracao.quantidade} normais
                      </strong>
                      <span>{configuracao.titulo}</span>
                      <small>
                        {configuracao.descricao}
                      </small>
                    </button>
                  ),
                )}
              </div>

              {!partida && !resultadoFinal && (
                <button
                  type="button"
                  className="start-cassava-button"
                  disabled={taiMandiocaProcessando}
                  onClick={iniciarPartida}
                >
                  {taiMandiocaProcessando
                    ? 'Selando plantação...'
                    : 'Iniciar colheita'}
                </button>
              )}
            </article>

            <article className="oracle-game-message">
              <img
                src={entidadeBanca}
                alt="Entidade da banca"
              />

              <div>
                <span>COMUNICADO DO ORÁCULO</span>
                <p>{mensagemLocal}</p>
              </div>
            </article>

            <article className="games-history-card">
              <div className="games-side-heading">
                <span>ÚLTIMAS COLHEITAS</span>
                <h2>Arquivo da mandioca</h2>
              </div>

              {ultimasPartidas.length === 0 ? (
                <p className="games-history-empty">
                  Nenhuma colheita registrada.
                </p>
              ) : (
                <div className="games-history-list">
                  {ultimasPartidas.map((registro) => (
                    <div key={registro.id}>
                      <span>
                        <strong>{registro.status}</strong>
                        {registro.casasReveladas} TaiMandioca(s)
                      </span>

                      <b
                        className={
                          registro.lucro >= 0
                            ? 'positive'
                            : 'negative'
                        }
                      >
                        {registro.lucro >= 0 ? '+' : ''}
                        {formatarMoedas(registro.lucro)}
                      </b>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </aside>
        </div>
      ) : jogoSelecionado === 'taigrinho' ? (
        <div
          className="taigrinho-layout"
          data-neytai-target="game-area-taigrinho"
        >
          <div className="taigrinho-machine">
            <div className="taigrinho-machine-header">
              <div>
                <span>CASSINO DA NOVA ERA</span>
                <h2>Taigrinho 2.0</h2>
                <p>
                  Cinco rolos, cinco linhas e zero dinheiro real.
                </p>
                <small className="taigrinho-authoritative-badge">
                  RNG + prêmio selados no servidor
                </small>
              </div>

              <div className="taigrinho-jackpot">
                <span>MEGA GANHO</span>
                <strong>15x+</strong>
              </div>
            </div>

            <div className="taigrinho-paylines">
              {linhasTaigrinho.map((linha, indice) => (
                <span key={linha.id}>
                  L{indice + 1}
                </span>
              ))}
            </div>

            <div
              className={`taigrinho-reels ${
                taigrinhoGirando ? 'spinning' : ''
              }`}
            >
              {gradeTaigrinho.map(
                (rolo, indiceDoRolo) => (
                  <div
                    className={`taigrinho-reel ${
                      taigrinhoGirando &&
                      !rolosParados[indiceDoRolo]
                        ? 'spinning'
                        : ''
                    } ${
                      taigrinhoGirando &&
                      rolosParados[indiceDoRolo]
                        ? 'stopped-now'
                        : ''
                    }`}
                    key={indiceDoRolo}
                  >
                    {rolo.map(
                      (simboloId, indiceDaLinha) => {
                        const simbolo =
                          obterSimboloTaigrinho(
                            simboloId,
                          )
                        const vencedor =
                          resultadoTaigrinho?.linhasVencedoras.some(
                            (linha) =>
                              linha.linhas[
                                indiceDoRolo
                              ] === indiceDaLinha &&
                              linha.simboloId ===
                                simboloId,
                          )

                        return (
                          <div
                            className={`taigrinho-symbol symbol-${simbolo.id} ${
                              vencedor
                                ? 'winner'
                                : ''
                            }`}
                            key={`${indiceDoRolo}-${indiceDaLinha}`}
                          >
                            {simbolo.imagem ? (
                              <img
                                src={simbolo.imagem}
                                alt={simbolo.nome}
                              />
                            ) : (
                              <strong>
                                {simbolo.texto}
                              </strong>
                            )}

                            <small>
                              {simbolo.nome}
                            </small>
                          </div>
                        )
                      },
                    )}
                  </div>
                ),
              )}
            </div>

            <div className="taigrinho-result-bar">
              {taigrinhoGirando ? (
                <>
                  <span>
                    {
                      rolosParados.filter(Boolean)
                        .length
                    }
                    /5 rolos parados
                  </span>

                  <strong>
                    {rolosParados.filter(Boolean).length >=
                    4
                      ? 'ÚLTIMO ROLO...'
                      : 'GIRANDO...'}
                  </strong>
                </>
              ) : resultadoTaigrinho ? (
                resultadoTaigrinho.premio > 0 ? (
                  <>
                    <span>
                      {
                        resultadoTaigrinho
                          .linhasVencedoras.length
                      }{' '}
                      linha(s) vencedora(s)
                    </span>

                    <strong>
                      +{formatarMoedas(
                        resultadoTaigrinho.premio,
                      )}{' '}
                      TaiCoins
                    </strong>
                  </>
                ) : (
                  <>
                    <span>Nenhuma linha pagou</span>
                    <strong>A BANCA VENCEU</strong>
                  </>
                )
              ) : (
                <>
                  <span>Aguardando seu primeiro giro</span>
                  <strong>BOA SORTE? KKK</strong>
                </>
              )}
            </div>

            <div className="taigrinho-controls">
              <div className="taigrinho-bet-control">
                <span>Valor do giro</span>

                <div>
                  <button
                    type="button"
                    disabled={taigrinhoGirando}
                    onClick={() =>
                      setApostaTaigrinho((valor) =>
                        String(
                          Math.max(
                            APOSTA_MINIMA_TAIGRINHO,
                            Number(valor || 0) - 10,
                          ),
                        ),
                      )
                    }
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={APOSTA_MINIMA_TAIGRINHO}
                    max={saldo}
                    value={apostaTaigrinho}
                    disabled={taigrinhoGirando}
                    onChange={(event) =>
                      setApostaTaigrinho(
                        event.target.value,
                      )
                    }
                  />

                  <button
                    type="button"
                    disabled={taigrinhoGirando}
                    onClick={() =>
                      setApostaTaigrinho((valor) =>
                        String(
                          Number(valor || 0) + 10,
                        ),
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="taigrinho-spin-button"
                disabled={taigrinhoGirando}
                onClick={girarTaigrinho}
              >
                {taigrinhoGirando
                  ? 'GIRANDO'
                  : 'GIRAR'}
              </button>

              <div className="taigrinho-balance-box">
                <span>Seu saldo</span>
                <strong>
                  {formatarMoedas(saldo)}
                </strong>
              </div>
            </div>
          </div>

          <aside className="taigrinho-sidebar">
            <article className="taigrinho-oracle-card">
              <img
                src={entidadeBanca}
                alt="Entidade da banca"
              />

              <div>
                <span>COMUNICADO DA BANCA</span>
                <p>{mensagemTaigrinho}</p>
              </div>
            </article>

            <article className="taigrinho-table-card">
              <div className="games-side-heading">
                <span>TABELA DE PAGAMENTOS</span>
                <h2>Combinações</h2>
              </div>

              <div className="taigrinho-payment-list">
                {simbolosTaigrinho.map(
                  (simbolo) => (
                    <div key={simbolo.id}>
                      <span>
                        {simbolo.imagem ? (
                          <img
                            src={simbolo.imagem}
                            alt=""
                          />
                        ) : (
                          <b>{simbolo.texto}</b>
                        )}

                        <strong>
                          {simbolo.nome}
                        </strong>
                      </span>

                      <small>
                        3× {simbolo.pagamentos[3]} ·
                        4× {simbolo.pagamentos[4]} ·
                        5× {simbolo.pagamentos[5]}
                      </small>
                    </div>
                  ),
                )}
              </div>
            </article>

            <article className="games-history-card">
              <div className="games-side-heading">
                <span>ÚLTIMOS GIROS</span>
                <h2>Arquivo do Taigrinho</h2>
              </div>

              {ultimosGirosTaigrinho.length === 0 ? (
                <p className="games-history-empty">
                  Nenhum giro registrado.
                </p>
              ) : (
                <div className="games-history-list">
                  {ultimosGirosTaigrinho.map(
                    (registro) => (
                      <div key={registro.id}>
                        <span>
                          <strong>
                            {registro.megaGanho
                              ? 'MEGA GANHO'
                              : registro.status}
                          </strong>
                          {registro.linhasVencedoras ||
                            0}{' '}
                          linha(s)
                        </span>

                        <b
                          className={
                            registro.lucro >= 0
                              ? 'positive'
                              : 'negative'
                          }
                        >
                          {registro.lucro >= 0
                            ? '+'
                            : ''}
                          {formatarMoedas(
                            registro.lucro,
                          )}
                        </b>
                      </div>
                    ),
                  )}
                </div>
              )}
            </article>

            {import.meta.env.DEV && (
              <article className="taigrinho-test-card">
                <div className="games-side-heading">
                  <span>MODO DE DESENVOLVIMENTO</span>
                  <h2>Testar animações</h2>
                </div>

                <p>
                  Estes botões só aparecem no localhost e não
                  alteram seu saldo.
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setDerrotaTaigrinhoAtiva(true)
                    }
                  >
                    Testar derrota
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMegaGanhoAtivo({
                        premio: 9999,
                        multiplicador: 99.99,
                      })
                    }
                  >
                    Testar mega ganho
                  </button>
                </div>
              </article>
            )}

            <article className="taigrinho-disclaimer">
              TaiCoins não podem ser compradas, depositadas,
              sacadas ou convertidas em prêmio real.
            </article>
          </aside>
        </div>
      ) : (
        <div
          className="regime-crash-layout"
          data-neytai-target="game-area-crash-regime"
        >
          <div
            className={`regime-crash-game ${
              crashRodando ? 'running' : ''
            } ${
              resultadoCrash?.status === 'Perdeu'
                ? 'crashed'
                : ''
            }`}
          >
            <div className="regime-crash-header">
              <div>
                <span>CRASH DO NOVO REGIME</span>
                <h2>
                  Retire antes que a Comandante derrube tudo.
                </h2>
                <p>
                  Multiplicador em tempo real usando somente
                  TaiCoins fictícias.
                </p>

                <small className="regime-authoritative-badge">
                  🔒 PONTO DE CONFISCO SELADO NO SERVIDOR
                </small>
              </div>

              <div
                className={`regime-operation-status ${
                  crashRodando ? 'active' : ''
                }`}
              >
                <i />
                {crashRodando
                  ? 'OPERAÇÃO ATIVA'
                  : 'AGUARDANDO ORDEM'}
              </div>
            </div>

            <div className="regime-crash-stage">
              <div className="regime-crash-grid" />

              {!crashRodando && !resultadoCrash && (
                <div className="regime-crash-idle-brief" aria-hidden="true">
                  <span>PROTOCOLO 00</span>
                  <strong>Aguardando autorização da Comandante</strong>
                  <small>O gráfico será liberado assim que a operação começar.</small>
                </div>
              )}

              <svg
                className="regime-crash-chart"
                viewBox="0 0 1000 360"
                preserveAspectRatio="none"
                aria-label="Gráfico do multiplicador"
              >
                <defs>
                  <linearGradient
                    id="regimeLineGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="#b93b50"
                    />
                    <stop
                      offset="70%"
                      stopColor="#e85f7d"
                    />
                    <stop
                      offset="100%"
                      stopColor="#d0a052"
                    />
                  </linearGradient>

                  <linearGradient
                    id="regimeAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#e85f7d"
                      stopOpacity="0.30"
                    />
                    <stop
                      offset="100%"
                      stopColor="#d0a052"
                      stopOpacity="0"
                    />
                  </linearGradient>

                  <filter id="regimeGlow">
                    <feGaussianBlur
                      stdDeviation="6"
                      result="blur"
                    />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path
                  className="regime-crash-area"
                  d={`${graficoCrash.caminho} L 972 326 L 28 326 Z`}
                />

                <path
                  className="regime-crash-line"
                  d={graficoCrash.caminho}
                />

                <circle
                  className="regime-crash-dot"
                  cx={graficoCrash.pontoAtual.x}
                  cy={graficoCrash.pontoAtual.y}
                  r="9"
                />
              </svg>

              <div className="regime-crash-multiplier">
                <span>
                  {crashRodando
                    ? 'MULTIPLICADOR ATUAL'
                    : resultadoCrash?.status === 'Perdeu'
                      ? 'OPERAÇÃO ENCERRADA EM'
                      : resultadoCrash?.status === 'Ganhou'
                        ? 'RETIRADA REALIZADA EM'
                        : 'PRÓXIMA OPERAÇÃO'}
                </span>

                <strong>
                  {multiplicadorCrash.toFixed(2)}x
                </strong>

                <small>
                  {fraseDoRegime(
                    multiplicadorCrash,
                    crashRodando,
                    resultadoCrash,
                  )}
                </small>
              </div>

              <div className="regime-commander-stage">
                <img
                  src={taihenDitadora}
                  alt="Comandante Taihen"
                />

                <span>DITADORA SUPREMA DA BANCA</span>
              </div>
            </div>

            <div className="regime-crash-control-panel">
              <div className="regime-crash-bet">
                <span>Valor da operação</span>

                <div>
                  <button
                    type="button"
                    disabled={crashRodando || crashProcessando}
                    onClick={() =>
                      setApostaCrash((valor) =>
                        String(
                          Math.max(
                            APOSTA_MINIMA_CRASH,
                            Number(valor || 0) - 10,
                          ),
                        ),
                      )
                    }
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={APOSTA_MINIMA_CRASH}
                    max={saldo}
                    value={apostaCrash}
                    disabled={crashRodando || crashProcessando}
                    onChange={(event) =>
                      setApostaCrash(event.target.value)
                    }
                  />

                  <button
                    type="button"
                    disabled={crashRodando || crashProcessando}
                    onClick={() =>
                      setApostaCrash((valor) =>
                        String(
                          Number(valor || 0) + 10,
                        ),
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <div className="regime-crash-quick-values">
                  {[10, 25, 50, 100].map((valor) => (
                    <button
                      type="button"
                      key={valor}
                      disabled={crashRodando || crashProcessando}
                      onClick={() =>
                        setApostaCrash(String(valor))
                      }
                    >
                      {valor}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={`regime-main-button ${
                  crashRodando ? 'cashout' : ''
                }`}
                disabled={crashProcessando}
                onClick={
                  crashRodando
                    ? () => retirarDoCrash()
                    : () => iniciarRodadaCrash()
                }
              >
                {crashProcessando ? (
                  <>
                    <span>CONSULTANDO A BANCA...</span>
                    <strong>Relógio do servidor</strong>
                  </>
                ) : crashRodando ? (
                  <>
                    <span>RETIRAR AGORA</span>
                    <strong>
                      {formatarMoedas(
                        retornoCrashAtual,
                      )}{' '}
                      TaiCoins
                    </strong>
                  </>
                ) : (
                  <>
                    <span>INICIAR OPERAÇÃO</span>
                    <strong>
                      {formatarMoedas(
                        Number(apostaCrash || 0),
                      )}{' '}
                      TaiCoins
                    </strong>
                  </>
                )}
              </button>

              <div className="regime-crash-balance">
                <span>Saldo disponível</span>
                <strong>
                  {formatarMoedas(saldo)}
                </strong>
                <small>TaiCoins fictícias</small>
              </div>
            </div>

            <div className="regime-crash-last-result">
              {resultadoCrash ? (
                <>
                  <span>
                    {resultadoCrash.status === 'Ganhou'
                      ? 'RETIRADA AUTORIZADA'
                      : 'BENS CONFISCADOS'}
                  </span>

                  <strong>
                    {resultadoCrash.status === 'Ganhou'
                      ? `+${formatarMoedas(
                          resultadoCrash.premio,
                        )} TaiCoins`
                      : `Crash em ${resultadoCrash.multiplicador.toFixed(
                          2,
                        )}x`}
                  </strong>
                </>
              ) : (
                <>
                  <span>SEM OPERAÇÃO ANTERIOR</span>
                  <strong>
                    O fiscal está observando.
                  </strong>
                </>
              )}
            </div>
          </div>

          <aside className="regime-crash-sidebar">
            <article className="regime-commander-card">
              <div>
                <img
                  src={taihenDitadora}
                  alt="Comandante Taihen"
                />
                <span>COMANDANTE TAIHEN</span>
              </div>

              <h2>Controle absoluto da banca</h2>

              <p>{mensagemCrash}</p>
            </article>

            <article className="regime-fiscal-card">
              <img
                src={fiscalRegime}
                alt="Fiscal do regime"
              />

              <div>
                <span>FISCAL DO REGIME</span>
                <h3>
                  Observando retiradas suspeitas.
                </h3>
                <p>
                  Qualquer lucro excessivo será
                  investigado imediatamente.
                </p>
              </div>
            </article>

            <article className="games-history-card">
              <div className="games-side-heading">
                <span>ÚLTIMAS OPERAÇÕES</span>
                <h2>Arquivo do regime</h2>
              </div>

              {ultimasOperacoesCrash.length === 0 ? (
                <p className="games-history-empty">
                  Nenhuma operação registrada.
                </p>
              ) : (
                <div className="games-history-list">
                  {ultimasOperacoesCrash.map(
                    (registro) => (
                      <div key={registro.id}>
                        <span>
                          <strong>
                            {registro.status === 'Ganhou'
                              ? 'ESCAPOU'
                              : 'CONFISCADO'}
                          </strong>
                          {Number(
                            registro.multiplicador ||
                              registro.pontoDeCrash ||
                              1,
                          ).toFixed(2)}
                          x
                        </span>

                        <b
                          className={
                            registro.lucro >= 0
                              ? 'positive'
                              : 'negative'
                          }
                        >
                          {registro.lucro >= 0
                            ? '+'
                            : ''}
                          {formatarMoedas(
                            registro.lucro,
                          )}
                        </b>
                      </div>
                    ),
                  )}
                </div>
              )}
            </article>

            {import.meta.env.DEV && (
              <article className="regime-test-card">
                <div className="games-side-heading">
                  <span>MODO DE DESENVOLVIMENTO</span>
                  <h2>Testar o regime</h2>
                </div>

                <p>
                  Os testes visuais abaixo não alteram seu
                  saldo.
                </p>

                <div>
                  <button
                    type="button"
                    disabled={crashRodando || crashProcessando}
                    onClick={() =>
                      setOverlayCrash({
                        tipo: 'confiscado',
                        titulo:
                          'OPERAÇÃO ENCERRADA!',
                        subtitulo:
                          'O regime tomou suas TaiCoins antes da retirada.',
                        premio: 0,
                        multiplicador: 3.47,
                      })
                    }
                  >
                    Testar confisco
                  </button>

                  <button
                    type="button"
                    disabled={crashRodando || crashProcessando}
                    onClick={() =>
                      setOverlayCrash({
                        tipo: 'escapou',
                        titulo:
                          'VOCÊ ESCAPOU DO REGIME!',
                        subtitulo:
                          'A retirada foi concluída antes do confisco.',
                        premio: 12500,
                        multiplicador: 12.5,
                      })
                    }
                  >
                    Testar fuga
                  </button>
                </div>
              </article>
            )}

            <article className="taigrinho-disclaimer">
              O Crash do Regime usa somente TaiCoins gratuitas
              e não oferece dinheiro, saque ou prêmio real.
            </article>
          </aside>
        </div>
      )}
    </section>
  )
}

export default GamesPage
