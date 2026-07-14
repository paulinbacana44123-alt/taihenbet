import { useEffect, useMemo, useRef, useState } from 'react'
import './GamesPage.css'
import entidadeBanca from '../assets/entidade-banca.png'
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
const MEGA_GANHO_MINIMO = 15

const simbolosTaigrinho = [
  {
    id: 'tai',
    nome: 'Tai',
    imagem: entidadeBanca,
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

function avaliarGradeTaigrinho(grade) {
  const linhasVencedoras = []
  let multiplicadorTotal = 0

  linhasTaigrinho.forEach((linha) => {
    const idsNaLinha = linha.linhas.map(
      (indiceDaLinha, indiceDoRolo) =>
        grade[indiceDoRolo][indiceDaLinha],
    )

    const primeiroId = idsNaLinha[0]
    let quantidadeIgual = 1

    for (
      let indice = 1;
      indice < idsNaLinha.length;
      indice += 1
    ) {
      if (idsNaLinha[indice] !== primeiroId) {
        break
      }

      quantidadeIgual += 1
    }

    if (quantidadeIgual < 3) {
      return
    }

    const simbolo = obterSimboloTaigrinho(primeiroId)
    const multiplicador =
      simbolo.pagamentos[quantidadeIgual] || 0

    if (multiplicador <= 0) {
      return
    }

    multiplicadorTotal += multiplicador

    linhasVencedoras.push({
      ...linha,
      simboloId: primeiroId,
      simboloNome: simbolo.nome,
      quantidade: quantidadeIgual,
      multiplicador,
    })
  })

  const temCincoTais = linhasVencedoras.some(
    (linha) =>
      linha.simboloId === 'tai' &&
      linha.quantidade === 5,
  )

  return {
    multiplicadorTotal,
    linhasVencedoras,
    megaGanho:
      temCincoTais ||
      multiplicadorTotal >= MEGA_GANHO_MINIMO,
  }
}

function criarGradeComVitoriaNormal() {
  const grade = criarGradeAleatoriaTaigrinho()
  const linha =
    linhasTaigrinho[
      sortearNumero(linhasTaigrinho.length)
    ]
  const simbolosNormais = simbolosTaigrinho.filter(
    (simbolo) => simbolo.id !== 'tai',
  )
  const simbolo =
    simbolosNormais[
      sortearNumero(simbolosNormais.length)
    ]
  const quantidade = sortearNumero(100) < 72 ? 3 : 4

  for (
    let indiceDoRolo = 0;
    indiceDoRolo < quantidade;
    indiceDoRolo += 1
  ) {
    grade[indiceDoRolo][linha.linhas[indiceDoRolo]] =
      simbolo.id
  }

  if (quantidade < 5) {
    const simbolosDiferentes = simbolosTaigrinho.filter(
      (item) => item.id !== simbolo.id,
    )

    grade[quantidade][linha.linhas[quantidade]] =
      simbolosDiferentes[
        sortearNumero(simbolosDiferentes.length)
      ].id
  }

  return grade
}

function criarGradeMegaGanho() {
  const grade = criarGradeAleatoriaTaigrinho()
  const linha =
    linhasTaigrinho[
      sortearNumero(linhasTaigrinho.length)
    ]

  for (let indiceDoRolo = 0; indiceDoRolo < 5; indiceDoRolo += 1) {
    grade[indiceDoRolo][linha.linhas[indiceDoRolo]] =
      'tai'
  }

  return grade
}

function criarGradeSemPremio() {
  for (let tentativa = 0; tentativa < 80; tentativa += 1) {
    const grade = criarGradeAleatoriaTaigrinho()
    const resultado = avaliarGradeTaigrinho(grade)

    if (resultado.multiplicadorTotal === 0) {
      return grade
    }
  }

  return [
    ['tai', 'uva', 'mute'],
    ['mandioca', 'onion', 'taicoin'],
    ['uva', 'mute', 'mandioca'],
    ['onion', 'taicoin', 'uva'],
    ['mute', 'mandioca', 'onion'],
  ]
}

function criarResultadoTaigrinho() {
  const sorteio = sortearNumero(1000)

  if (sorteio < 24) {
    return criarGradeMegaGanho()
  }

  if (sorteio < 245) {
    return criarGradeComVitoriaNormal()
  }

  return criarGradeSemPremio()
}


const APOSTA_MINIMA_CRASH = 10
const MULTIPLICADOR_MAXIMO_CRASH = 50

function numeroAleatorioEntreZeroEUm() {
  const numero = new Uint32Array(1)
  crypto.getRandomValues(numero)

  return numero[0] / 4294967295
}

function criarPontoDeCrash() {
  const faixa = numeroAleatorioEntreZeroEUm()
  const detalhe = numeroAleatorioEntreZeroEUm()
  let ponto = 1.05

  if (faixa < 0.2) {
    ponto = 1.05 + detalhe * 0.4
  } else if (faixa < 0.61) {
    ponto = 1.45 + detalhe * 1.65
  } else if (faixa < 0.84) {
    ponto = 3.1 + detalhe * 3.9
  } else if (faixa < 0.95) {
    ponto = 7 + detalhe * 8
  } else if (faixa < 0.99) {
    ponto = 15 + detalhe * 15
  } else {
    ponto = 30 + detalhe * 20
  }

  return Number(
    Math.min(
      MULTIPLICADOR_MAXIMO_CRASH,
      ponto,
    ).toFixed(2),
  )
}

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

function embaralharIndices() {
  const indices = Array.from(
    { length: TOTAL_CASAS },
    (_, indice) => indice,
  )

  for (let indice = indices.length - 1; indice > 0; indice -= 1) {
    const aleatorio = new Uint32Array(1)
    crypto.getRandomValues(aleatorio)

    const outroIndice = aleatorio[0] % (indice + 1)

    ;[indices[indice], indices[outroIndice]] = [
      indices[outroIndice],
      indices[indice],
    ]
  }

  return indices
}

function criarMandiocasNormais(quantidade) {
  return embaralharIndices().slice(0, quantidade)
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

function carregarPartidaAtiva() {
  try {
    const partida = JSON.parse(
      localStorage.getItem(
        'taihenbet-taimandioca-partida',
      ) || 'null',
    )

    if (
      !partida ||
      !Array.isArray(partida.mandiocasNormais) ||
      !Array.isArray(partida.reveladas)
    ) {
      return null
    }

    return partida
  } catch {
    return null
  }
}

function dataLocalHoje() {
  return new Date().toLocaleDateString('pt-BR')
}

function GamesPage({
  saldo = 0,
  historicoJogos = [],
  onDebitarEntrada,
  onFinalizarJogo,
  onReceberBonus,
  onDebitarEntradaDerby,
  onFinalizarCorridaDerby,
}) {
  const [jogoSelecionado, setJogoSelecionado] =
    useState('taimandioca')
  const [entrada, setEntrada] = useState('25')
  const [
    quantidadeMandiocasNormais,
    setQuantidadeMandiocasNormais,
  ] = useState(5)
  const [partida, setPartida] = useState(
    carregarPartidaAtiva,
  )
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
  const rodadaCrashRef = useRef(null)
  const multiplicadorCrashRef = useRef(1)
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
    if (partida) {
      localStorage.setItem(
        'taihenbet-taimandioca-partida',
        JSON.stringify(partida),
      )
      return
    }

    localStorage.removeItem(
      'taihenbet-taimandioca-partida',
    )
  }, [partida])

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

  const multiplicadorAtual = useMemo(
    () =>
      calcularMultiplicador(
        perigosAtuais,
        quantidadeRevelada,
      ),
    [perigosAtuais, quantidadeRevelada],
  )

  const retornoAtual =
    Number(
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
  ) {
    const avaliacao =
      avaliarGradeTaigrinho(gradeFinal)
    const premio =
      valorAposta * avaliacao.multiplicadorTotal
    const ganhou = premio > 0

    const registro = {
      jogo: 'Taigrinho',
      status: ganhou ? 'Ganhou' : 'Perdeu',
      entrada: valorAposta,
      premio,
      lucro: premio - valorAposta,
      multiplicador:
        avaliacao.multiplicadorTotal,
      linhasVencedoras:
        avaliacao.linhasVencedoras.length,
      megaGanho: avaliacao.megaGanho,
      iniciadaEm: Date.now() - 1800,
      encerradaEm: Date.now(),
    }

    onFinalizarJogo?.(registro)

    setGradeTaigrinho(gradeFinal)
    setResultadoTaigrinho({
      ...avaliacao,
      premio,
      entrada: valorAposta,
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

  function girarTaigrinho() {
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

    const debitou =
      onDebitarEntrada?.(valorAposta)

    if (!debitou) {
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
      'Os rolos estão acelerando. Agora vem a parte que dá aflição.',
    )

    iniciarSomDoGiro()

    const gradeFinal = criarResultadoTaigrinho()
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
        'O navegador bloqueou o som. Clique novamente em iniciar a operação.',
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

  function registrarResultadoCrash({
    ganhou,
    valorAposta,
    multiplicador,
    pontoDeCrash = null,
    iniciadaEm,
  }) {
    const premio = ganhou
      ? valorAposta * multiplicador
      : 0

    onFinalizarJogo?.({
      jogo: 'Crash do Regime',
      status: ganhou ? 'Ganhou' : 'Perdeu',
      entrada: valorAposta,
      premio,
      lucro: premio - valorAposta,
      multiplicador,
      pontoDeCrash,
      retiradaEm: ganhou ? multiplicador : null,
      iniciadaEm,
      encerradaEm: Date.now(),
    })

    const novoResultado = {
      status: ganhou ? 'Ganhou' : 'Perdeu',
      entrada: valorAposta,
      premio,
      multiplicador,
      pontoDeCrash,
    }

    setResultadoCrash(novoResultado)
    setCrashRodando(false)

    if (ganhou) {
      tocarAudioDoCrash(
        audioRetiradaCrashRef,
        0.72,
      )

      setMensagemCrash(
        multiplicador >= 10
          ? 'Retirada histórica. Você escapou do regime com lucro excessivo.'
          : 'Retirada autorizada sob protesto da Comandante.',
      )

      if (multiplicador >= 10) {
        setOverlayCrash({
          tipo: 'escapou',
          titulo: 'VOCÊ ESCAPOU DO REGIME!',
          subtitulo:
            'A retirada foi concluída antes do confisco.',
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
      'Operação encerrada pela Comandante. Seus bens fictícios foram confiscados.',
    )

    setOverlayCrash({
      tipo: 'confiscado',
      titulo: 'OPERAÇÃO ENCERRADA!',
      subtitulo:
        'O regime tomou suas TaiCoins antes da retirada.',
      premio: 0,
      multiplicador,
    })
  }

  function encerrarCrashPorQueda(
    pontoDeCrash,
    rodada,
  ) {
    if (!rodada?.ativa) {
      return
    }

    rodada.ativa = false
    pararSomDoCrash()

    if (animacaoCrashRef.current) {
      window.cancelAnimationFrame(
        animacaoCrashRef.current,
      )
    }

    multiplicadorCrashRef.current =
      pontoDeCrash

    setMultiplicadorCrash(pontoDeCrash)
    setPontosGraficoCrash((pontosAtuais) => [
      ...pontosAtuais.slice(-88),
      pontoDeCrash,
    ])

    registrarResultadoCrash({
      ganhou: false,
      valorAposta: rodada.valorAposta,
      multiplicador: pontoDeCrash,
      pontoDeCrash,
      iniciadaEm: rodada.iniciadaEm,
    })
  }

  function animarRodadaCrash(tempoAtual) {
    const rodada = rodadaCrashRef.current

    if (!rodada?.ativa) {
      return
    }

    if (!rodada.tempoInicial) {
      rodada.tempoInicial = tempoAtual
    }

    const tempoDecorrido =
      tempoAtual - rodada.tempoInicial

    const multiplicadorCalculado =
      calcularMultiplicadorDoCrash(
        tempoDecorrido,
      )

    if (
      multiplicadorCalculado >=
      rodada.pontoDeCrash
    ) {
      encerrarCrashPorQueda(
        rodada.pontoDeCrash,
        rodada,
      )
      return
    }

    const multiplicadorExibido =
      Number(multiplicadorCalculado.toFixed(2))

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

  function iniciarRodadaCrash(
    pontoForcado = null,
  ) {
    const valorAposta = Number(apostaCrash)

    if (crashRodando) {
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

    const debitou =
      onDebitarEntrada?.(valorAposta)

    if (!debitou) {
      return
    }

    if (animacaoCrashRef.current) {
      window.cancelAnimationFrame(
        animacaoCrashRef.current,
      )
    }

    const pontoDeCrash =
      pontoForcado ||
      criarPontoDeCrash()

    rodadaCrashRef.current = {
      ativa: true,
      valorAposta,
      pontoDeCrash,
      tempoInicial: null,
      iniciadaEm: Date.now(),
    }

    multiplicadorCrashRef.current = 1

    setMultiplicadorCrash(1)
    setPontosGraficoCrash([1])
    setResultadoCrash(null)
    setOverlayCrash(null)
    setCrashRodando(true)
    setMensagemCrash(
      'Operação iniciada. Retire antes que a Comandante encerre tudo.',
    )

    iniciarSomDoCrash()

    animacaoCrashRef.current =
      window.requestAnimationFrame(
        animarRodadaCrash,
      )
  }

  function retirarDoCrash(
    multiplicadorForcado = null,
  ) {
    const rodada = rodadaCrashRef.current

    if (!rodada?.ativa && multiplicadorForcado === null) {
      return
    }

    const multiplicador =
      Number(
        (
          multiplicadorForcado ??
          multiplicadorCrashRef.current
        ).toFixed(2),
      )

    if (rodada?.ativa) {
      rodada.ativa = false
    }

    if (animacaoCrashRef.current) {
      window.cancelAnimationFrame(
        animacaoCrashRef.current,
      )
    }

    pararSomDoCrash()

    registrarResultadoCrash({
      ganhou: true,
      valorAposta:
        rodada?.valorAposta ||
        Number(apostaCrash),
      multiplicador,
      pontoDeCrash:
        rodada?.pontoDeCrash || null,
      iniciadaEm:
        rodada?.iniciadaEm || Date.now(),
    })
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

  function iniciarPartida() {
    const valorEntrada = Number(entrada)

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

    const debitou = onDebitarEntrada?.(valorEntrada)

    if (!debitou) {
      return
    }

    const novaPartida = {
      id: crypto.randomUUID(),
      jogo: 'TaiMandioca',
      entrada: valorEntrada,
      quantidadeMandiocasNormais,
      mandiocasNormais: criarMandiocasNormais(
        quantidadeMandiocasNormais,
      ),
      reveladas: [],
      iniciadaEm: Date.now(),
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
    setMensagemLocal(
      'A colheita começou. Encontre as TaiMandiocas e fuja das mandiocas normais.',
    )
  }

  function registrarResultado({
    status,
    partidaEncerrada,
    premio,
    multiplicador,
    casaFatal = null,
  }) {
    onFinalizarJogo?.({
      jogo: 'TaiMandioca',
      status,
      entrada: partidaEncerrada.entrada,
      premio,
      lucro: premio - partidaEncerrada.entrada,
      multiplicador,
      mandiocasNormais:
        partidaEncerrada.quantidadeMandiocasNormais,
      casasReveladas:
        partidaEncerrada.reveladas.length,
      casaFatal,
      iniciadaEm: partidaEncerrada.iniciadaEm,
      encerradaEm: Date.now(),
    })
  }

  function revelarCasa(indice) {
    if (!partida || partida.reveladas.includes(indice)) {
      return
    }

    const encontrouMandiocaNormal =
      partida.mandiocasNormais.includes(indice)

    if (encontrouMandiocaNormal) {
      tocarSomTaiMandioca(
        audioDerrotaTaiMandiocaRef,
        {
          volume: 0.84,
        },
      )

      const partidaPerdida = {
        ...partida,
        casaFatal: indice,
      }

      registrarResultado({
        status: 'Perdeu',
        partidaEncerrada: partidaPerdida,
        premio: 0,
        multiplicador: multiplicadorAtual,
        casaFatal: indice,
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
          'A mandioca normal encerrou sua colheita.',
        premio: 0,
      })
      setMensagemLocal(
        'MANDIOCA NORMAL! A plantação venceu e a Entidade da Banca agradece.',
      )

      return
    }

    const novasReveladas = [...partida.reveladas, indice]
    const novaPartida = {
      ...partida,
      reveladas: novasReveladas,
    }

    const completouPlantacao =
      novasReveladas.length ===
      TOTAL_CASAS -
        partida.quantidadeMandiocasNormais

    const novoMultiplicador = calcularMultiplicador(
      partida.quantidadeMandiocasNormais,
      novasReveladas.length,
    )

    if (completouPlantacao) {
      tocarSomTaiMandioca(
        audioPerfeitoTaiMandiocaRef,
        {
          volume: 0.78,
        },
      )

      const premio =
        partida.entrada * novoMultiplicador

      registrarResultado({
        status: 'Ganhou',
        partidaEncerrada: novaPartida,
        premio,
        multiplicador: novoMultiplicador,
      })

      setPartida(null)
      setResultadoFinal({
        status: 'Ganhou',
        partida: novaPartida,
        premio,
      })
      setAnimacaoFinal({
        id: crypto.randomUUID(),
        status: 'ganhou',
        titulo: 'COLHEITA PERFEITA!',
        subtitulo:
          'Você encontrou todas as TaiMandiocas da plantação.',
        premio,
      })
      setMensagemLocal(
        'Você encontrou todas as TaiMandiocas. Colheita perfeita e estatisticamente absurda.',
      )

      return
    }

    tocarSomTaiMandioca(
      audioSeguroTaiMandiocaRef,
      {
        volume: 0.62,
        playbackRate:
          1 + novasReveladas.length * 0.025,
      },
    )

    setPartida(novaPartida)
    setMensagemLocal(
      `TAIMANDIOCA ENCONTRADA! Retorno atual: ${formatarMoedas(
        partida.entrada * novoMultiplicador,
      )} TaiCoins.`,
    )
  }

  function recolherPremio() {
    if (!partida || partida.reveladas.length === 0) {
      setMensagemLocal(
        'Encontre ao menos uma TaiMandioca antes de recolher.',
      )
      return
    }

    const premio = retornoAtual

    tocarSomTaiMandioca(
      audioRecolherTaiMandiocaRef,
      {
        volume: 0.74,
      },
    )

    registrarResultado({
      status: 'Ganhou',
      partidaEncerrada: partida,
      premio,
      multiplicador: multiplicadorAtual,
    })

    setPartida(null)
    setResultadoFinal({
      status: 'Ganhou',
      partida,
      premio,
    })
    setAnimacaoFinal({
      id: crypto.randomUUID(),
      status: 'ganhou',
      titulo: 'COLHEITA GARANTIDA!',
      subtitulo:
        'Você saiu da roça antes de encontrar a mandioca normal.',
      premio,
    })
    setMensagemLocal(
      `Você saiu da roça com ${formatarMoedas(
        premio,
      )} TaiCoins antes de encontrar uma mandioca normal.`,
    )
  }

  function limparResultado() {
    setResultadoFinal(null)
    setMensagemLocal(
      'Configure uma nova colheita. A mandioca normal continua escondida.',
    )
  }

  function receberBonusDiario() {
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

    onReceberBonus?.(BONUS_DIARIO)
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
          <img src={entidadeBanca} alt="" aria-hidden="true" />

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
          className={`game-catalog-card ${
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
            <span>DISPONÍVEL AGORA</span>
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
          className={`game-catalog-card ${
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
              src={entidadeBanca}
              alt="Taigrinho"
            />
          </div>

          <div>
            <span>DISPONÍVEL AGORA</span>
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
          className={`game-catalog-card ${
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
            <span>DISPONÍVEL AGORA</span>
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
          className={`game-catalog-card ${
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
            <span>DISPONÍVEL AGORA</span>
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
            onDebitarEntrada={onDebitarEntradaDerby}
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
                <span>JOGO ATIVO</span>
                <h2>TaiMandioca</h2>
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
                      disabled={!partida || revelada}
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
                disabled={partida.reveladas.length === 0}
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
                  onClick={iniciarPartida}
                >
                  Iniciar colheita
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
                <span>CASSINO DA ENTIDADE</span>
                <h2>Taigrinho</h2>
                <p>
                  Cinco rolos, cinco linhas e zero dinheiro real.
                </p>
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
                            className={`taigrinho-symbol ${
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
                <span>CRASH DO REGIME</span>
                <h2>
                  Retire antes que a Comandante derrube tudo.
                </h2>
                <p>
                  Multiplicador em tempo real usando somente
                  TaiCoins fictícias.
                </p>
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
                      stopColor="#8e42d9"
                    />
                    <stop
                      offset="70%"
                      stopColor="#e3569c"
                    />
                    <stop
                      offset="100%"
                      stopColor="#ff5d72"
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
                      stopColor="#c54fff"
                      stopOpacity="0.34"
                    />
                    <stop
                      offset="100%"
                      stopColor="#c54fff"
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

                <span>COMANDANTE SUPREMA DA BANCA</span>
              </div>
            </div>

            <div className="regime-crash-control-panel">
              <div className="regime-crash-bet">
                <span>Valor da operação</span>

                <div>
                  <button
                    type="button"
                    disabled={crashRodando}
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
                    disabled={crashRodando}
                    onChange={(event) =>
                      setApostaCrash(event.target.value)
                    }
                  />

                  <button
                    type="button"
                    disabled={crashRodando}
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
                      disabled={crashRodando}
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
                onClick={
                  crashRodando
                    ? () => retirarDoCrash()
                    : () => iniciarRodadaCrash()
                }
              >
                {crashRodando ? (
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
                    disabled={crashRodando}
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
                    disabled={crashRodando}
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
