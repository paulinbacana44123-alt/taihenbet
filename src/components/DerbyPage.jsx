import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './DerbyPage.css'
import silenceSuzuka from '../assets/silence-suzuka.png'
import tokaiTeio from '../assets/tokai-teio.png'
import mejiroMcqueen from '../assets/mejiro-mcqueen.jpg'
import goldShip from '../assets/gold-ship.jpg'
import matikanetannhauser from '../assets/matikanetannhauser.jpg'
import meishoDoto from '../assets/meisho-doto.jpg'
import somContagem from '../assets/derby-contagem.wav'
import somCorrida from '../assets/derby-corrida.wav'
import somChegada from '../assets/derby-chegada.wav'
import somVitoria from '../assets/derby-vitoria.wav'
import somDerrota from '../assets/derby-derrota.wav'
import somMambo from '../assets/derby-mambo.wav'
import videoSilenceSuzuka from '../assets/silence-suzuka-vitoria.mp4'
import videoTokaiTeio from '../assets/tokai-teio-vitoria.mp4'
import videoMejiroMcqueen from '../assets/mejiro-mcqueen-vitoria.mp4'
import videoGoldShip from '../assets/gold-ship-vitoria.mp4'
import videoMatikanetannhauser from '../assets/matikanetannhauser-vitoria.mp4'
import videoMeishoDoto from '../assets/meisho-doto-vitoria.mp4'

const APOSTA_MINIMA = 10
const DURACAO_CORRIDA = 7600
const MAMBO_ID = 'matikanetannhauser'
const CHANCE_DA_APOSTADA_VENCER = 0.05

const videosDeVitoria = {
  'silence-suzuka': videoSilenceSuzuka,
  'tokai-teio': videoTokaiTeio,
  'mejiro-mcqueen': videoMejiroMcqueen,
  'gold-ship': videoGoldShip,
  matikanetannhauser: videoMatikanetannhauser,
  'meisho-doto': videoMeishoDoto,
}

const corredoras = [
  {
    id: 'silence-suzuka',
    nome: 'Silence Suzuka',
    apelido: 'A fugitiva silenciosa',
    odd: 2.2,
    imagem: silenceSuzuka,
    numero: 1,
  },
  {
    id: 'tokai-teio',
    nome: 'Tokai Teio',
    apelido: 'Hachimi soberana',
    odd: 3.1,
    imagem: tokaiTeio,
    numero: 2,
  },
  {
    id: 'mejiro-mcqueen',
    nome: 'Mejiro McQueen',
    apelido: 'Velocidade 95',
    odd: 4,
    imagem: mejiroMcqueen,
    numero: 3,
  },
  {
    id: 'gold-ship',
    nome: 'Gold Ship',
    apelido: 'Caos de elite',
    odd: 5.25,
    imagem: goldShip,
    numero: 4,
  },
  {
    id: 'matikanetannhauser',
    nome: 'Matikanetannhauser',
    apelido: 'Mambo',
    odd: 6.5,
    imagem: matikanetannhauser,
    numero: 5,
  },
  {
    id: 'meisho-doto',
    nome: 'Meisho Doto',
    apelido: 'A esperança confusa',
    odd: 8.5,
    imagem: meishoDoto,
    numero: 6,
  },
]

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function numeroAleatorio() {
  const numero = new Uint32Array(1)
  crypto.getRandomValues(numero)

  return numero[0] / 4294967295
}

function escolherVencedora(corredoraApostadaId) {
  const corredoraApostada =
    corredoras.find(
      (corredora) =>
        corredora.id === corredoraApostadaId,
    ) || corredoras[0]

  const mambo =
    corredoras.find(
      (corredora) => corredora.id === MAMBO_ID,
    ) || corredoras[4]

  const apostadaVenceu =
    numeroAleatorio() <
    CHANCE_DA_APOSTADA_VENCER

  if (apostadaVenceu) {
    return corredoraApostada
  }

  if (corredoraApostada.id !== MAMBO_ID) {
    return mambo
  }

  const outrasCorredoras = corredoras.filter(
    (corredora) => corredora.id !== MAMBO_ID,
  )

  return outrasCorredoras[
    Math.floor(
      numeroAleatorio() *
        outrasCorredoras.length,
    )
  ]
}

function suavizarProgresso(valor) {
  const limitado = Math.min(1, Math.max(0, valor))

  return 1 - (1 - limitado) ** 3
}

function criarConfiguracaoDaCorrida(vencedoraId) {
  return corredoras.reduce((configuracao, corredora, indice) => {
    const venceu = corredora.id === vencedoraId

    configuracao[corredora.id] = {
      alvo: venceu
        ? 100
        : 84 + numeroAleatorio() * 13.5,
      fase: numeroAleatorio() * Math.PI * 2,
      oscilacao: 2.3 + numeroAleatorio() * 3.2,
      atraso: numeroAleatorio() * 0.08,
      arrancada:
        0.42 + numeroAleatorio() * 0.35,
      indice,
    }

    return configuracao
  }, {})
}

function DerbyPage({
  saldo,
  onDebitarEntrada,
  onFinalizarCorrida,
}) {
  const [corredoraSelecionadaId, setCorredoraSelecionadaId] =
    useState('silence-suzuka')
  const [valorAposta, setValorAposta] = useState('25')
  const [fase, setFase] = useState('pronto')
  const [contagem, setContagem] = useState(null)
  const [progressos, setProgressos] = useState(
    () =>
      Object.fromEntries(
        corredoras.map((corredora) => [corredora.id, 0]),
      ),
  )
  const [vencedora, setVencedora] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [narracao, setNarracao] = useState(
    'Escolha sua Umamusume e prepare o bilhete para o Taihen Derby.',
  )
  const [overlayAberto, setOverlayAberto] = useState(false)
  const [somAtivo, setSomAtivo] = useState(true)
  const [mamboAlertaTocado, setMamboAlertaTocado] =
    useState(false)
  const [videoVitoriaTerminou, setVideoVitoriaTerminou] =
    useState(false)
  const [videoVitoriaFalhou, setVideoVitoriaFalhou] =
    useState(false)

  const animacaoRef = useRef(null)
  const timeoutsRef = useRef([])
  const corridaRef = useRef(null)
  const corridaIdRef = useRef(0)
  const ultimoFrameVisualRef = useRef(0)
  const ultimaNarracaoRef = useRef(0)
  const audioContagemRef = useRef(null)
  const audioCorridaRef = useRef(null)
  const audioChegadaRef = useRef(null)
  const audioVitoriaRef = useRef(null)
  const audioDerrotaRef = useRef(null)
  const audioMamboRef = useRef(null)

  const corredoraSelecionada = useMemo(
    () =>
      corredoras.find(
        (corredora) =>
          corredora.id === corredoraSelecionadaId,
      ) || corredoras[0],
    [corredoraSelecionadaId],
  )

  const valorNumerico = Number(valorAposta) || 0
  const retornoPossivel =
    valorNumerico * corredoraSelecionada.odd
  const corridaEmAndamento =
    fase === 'contagem' || fase === 'correndo'

  useEffect(
    () => () => {
      if (animacaoRef.current) {
        window.cancelAnimationFrame(
          animacaoRef.current,
        )
      }

      timeoutsRef.current.forEach((timeout) => {
        window.clearTimeout(timeout)
      })

      if (corridaRef.current) {
        corridaRef.current.ativa = false
      }

      const audioCorrida = audioCorridaRef.current

      if (audioCorrida) {
        audioCorrida.pause()
        audioCorrida.currentTime = 0
      }
    },
    [],
  )

  function tocarSom(
    referencia,
    {
      volume = 0.7,
      playbackRate = 1,
    } = {},
  ) {
    if (!somAtivo || !referencia.current) {
      return
    }

    const audio = referencia.current.cloneNode()
    audio.volume = volume
    audio.playbackRate = playbackRate
    audio.play().catch(() => {})
  }

  function prepararSomDaCorrida() {
    const audio = audioCorridaRef.current

    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
    audio.loop = true
    audio.volume = 0

    if (somAtivo) {
      audio.play().catch(() => {})
    }
  }

  function iniciarSomDaCorrida() {
    const audio = audioCorridaRef.current

    if (!audio || !somAtivo) {
      return
    }

    audio.volume = 0.46
    audio.playbackRate = 0.94
    audio.play().catch(() => {})
  }

  function atualizarSomDaCorrida(proporcao) {
    const audio = audioCorridaRef.current

    if (!audio || audio.paused || !somAtivo) {
      return
    }

    audio.playbackRate =
      0.94 + proporcao * 0.42
    audio.volume =
      0.43 + proporcao * 0.17
  }

  function pararSomDaCorrida() {
    const audio = audioCorridaRef.current

    if (!audio) {
      return
    }

    audio.pause()
    audio.currentTime = 0
    audio.playbackRate = 1
  }

  function alternarSom() {
    setSomAtivo((estadoAtual) => {
      const novoEstado = !estadoAtual

      if (!novoEstado) {
        pararSomDaCorrida()
      } else if (fase === 'correndo') {
        iniciarSomDaCorrida()
      }

      return novoEstado
    })
  }

  function limparTemporizadores() {
    if (corridaRef.current) {
      corridaRef.current.ativa = false
    }

    corridaIdRef.current += 1

    timeoutsRef.current.forEach((timeout) => {
      window.clearTimeout(timeout)
    })
    timeoutsRef.current = []

    if (animacaoRef.current) {
      window.cancelAnimationFrame(
        animacaoRef.current,
      )
      animacaoRef.current = null
    }

    ultimoFrameVisualRef.current = 0
  }

  function atualizarNarracao(
    novosProgressos,
    tempoDecorrido,
  ) {
    if (
      tempoDecorrido -
        ultimaNarracaoRef.current <
      850
    ) {
      return
    }

    ultimaNarracaoRef.current =
      tempoDecorrido

    const classificacao = [...corredoras].sort(
      (a, b) =>
        novosProgressos[b.id] -
        novosProgressos[a.id],
    )

    const lider = classificacao[0]
    const vice = classificacao[1]
    const progressoLider =
      novosProgressos[lider.id]

    if (progressoLider < 24) {
      setNarracao(
        `${lider.nome} larga forte, mas ${vice.nome} vem logo atrás!`,
      )
      return
    }

    if (progressoLider < 52) {
      setNarracao(
        `${lider.nome} assume a liderança! A pista virou completo caos.`,
      )
      return
    }

    if (progressoLider < 78) {
      if (lider.id === 'gold-ship') {
        setNarracao(
          'GOLD SHIP ESTÁ CORRENDO NA DIREÇÃO CERTA. ISSO É HISTÓRICO!',
        )
        return
      }

      if (lider.id === 'matikanetannhauser') {
        setNarracao(
          'MAMBO! MAMBO! MATIKANETANNHAUSER ARRANCA PELO MEIO!',
        )
        return
      }

      setNarracao(
        `${vice.nome} tenta alcançar ${lider.nome} antes da reta final!`,
      )
      return
    }

    setNarracao(
      `RETA FINAL! ${lider.nome} e ${vice.nome} estão praticamente juntas!`,
    )
  }

  function concluirCorrida(corridaId) {
    const corrida = corridaRef.current

    if (
      !corrida?.ativa ||
      corrida.id !== corridaId ||
      corridaIdRef.current !== corridaId
    ) {
      return
    }

    corrida.ativa = false
    animacaoRef.current = null
    pararSomDaCorrida()
    tocarSom(audioChegadaRef, {
      volume: 0.82,
    })
    setFase('resultado')
    setVencedora(corrida.vencedora)

    const ganhou =
      corrida.escolhida.id ===
      corrida.vencedora.id
    const premio = ganhou
      ? corrida.valor *
        corrida.escolhida.odd
      : 0

    const novoResultado = {
      ganhou,
      premio,
      valor: corrida.valor,
      escolhida: corrida.escolhida,
      vencedora: corrida.vencedora,
    }

    setResultado(novoResultado)
    setVideoVitoriaTerminou(false)
    setVideoVitoriaFalhou(false)
    setOverlayAberto(true)

    setNarracao(
      ganhou
        ? `${corrida.vencedora.nome} venceu! Seu bilhete sobreviveu ao Derby.`
        : `${corrida.vencedora.nome} venceu. A banca ficou com a sua oferenda.`,
    )

    onFinalizarCorrida?.({
      ganhou,
      premio,
      valor: corrida.valor,
      corredoraEscolhida:
        corrida.escolhida,
      corredoraVencedora:
        corrida.vencedora,
      odd: corrida.escolhida.odd,
    })
  }

  function animarCorrida(agora, corridaId) {
    const corrida = corridaRef.current

    if (
      !corrida?.ativa ||
      corrida.id !== corridaId ||
      corridaIdRef.current !== corridaId
    ) {
      return
    }

    if (!corrida.iniciadaEm) {
      corrida.iniciadaEm = agora
    }

    const tempoDecorrido =
      agora - corrida.iniciadaEm
    const proporcao = Math.min(
      1,
      tempoDecorrido / DURACAO_CORRIDA,
    )

    atualizarSomDaCorrida(proporcao)

    const novosProgressos = {}

    corredoras.forEach((corredora) => {
      const configuracao =
        corrida.configuracoes[corredora.id]
      const progressoLocal = Math.max(
        0,
        (proporcao - configuracao.atraso) /
          (1 - configuracao.atraso),
      )
      const base =
        configuracao.alvo *
        suavizarProgresso(progressoLocal)
      const oscilacao =
        Math.sin(
          progressoLocal * 15 +
            configuracao.fase,
        ) *
        configuracao.oscilacao *
        (1 - progressoLocal)
      const arrancada =
        progressoLocal >
        configuracao.arrancada
          ? Math.sin(
              ((progressoLocal -
                configuracao.arrancada) /
                (1 -
                  configuracao.arrancada)) *
                Math.PI,
            ) *
            (corredora.id ===
            corrida.vencedora.id
              ? 5.4
              : 2.2)
          : 0

      novosProgressos[corredora.id] =
        Math.max(
          0,
          Math.min(
            configuracao.alvo,
            base + oscilacao + arrancada,
          ),
        )
    })

    const deveAtualizarVisual =
      proporcao >= 1 ||
      agora - ultimoFrameVisualRef.current >= 32

    if (deveAtualizarVisual) {
      ultimoFrameVisualRef.current = agora
      setProgressos(novosProgressos)
    }

    const mamboEstaNaFrente =
      novosProgressos[MAMBO_ID] >=
      Math.max(
        ...corredoras
          .filter(
            (corredora) =>
              corredora.id !== MAMBO_ID,
          )
          .map(
            (corredora) =>
              novosProgressos[corredora.id],
          ),
      )

    if (
      proporcao >= 0.58 &&
      mamboEstaNaFrente &&
      !corrida.mamboAlertaTocado
    ) {
      corrida.mamboAlertaTocado = true
      setMamboAlertaTocado(true)
      tocarSom(audioMamboRef, {
        volume: 0.72,
        playbackRate: 1.04,
      })

      setNarracao(
        'PROTOCOLO MAMBO ATIVADO! MATIKANETANNHAUSER ESTÁ TOMANDO A CORRIDA!',
      )
    } else {
      atualizarNarracao(
        novosProgressos,
        tempoDecorrido,
      )
    }

    if (proporcao >= 1) {
      const progressoFinal = {
        ...novosProgressos,
        [corrida.vencedora.id]: 100,
      }

      setProgressos(progressoFinal)
      concluirCorrida(corridaId)
      return
    }

    animacaoRef.current =
      window.requestAnimationFrame(
        (timestamp) =>
          animarCorrida(timestamp, corridaId),
      )
  }

  function iniciarAnimacaoDaCorrida(corridaId) {
    const corrida = corridaRef.current

    if (
      !corrida?.ativa ||
      corrida.id !== corridaId ||
      corridaIdRef.current !== corridaId
    ) {
      return
    }

    corrida.iniciadaEm = performance.now()
    ultimoFrameVisualRef.current = 0

    setFase('correndo')
    setContagem('JÁ!')
    tocarSom(audioContagemRef, {
      volume: 0.65,
      playbackRate: 1.45,
    })
    iniciarSomDaCorrida()
    setNarracao(
      'LARGARAM! O Taihen Derby está oficialmente fora de controle!',
    )

    const timeout = window.setTimeout(() => {
      setContagem(null)
    }, 650)

    timeoutsRef.current.push(timeout)

    animacaoRef.current =
      window.requestAnimationFrame(
        (timestamp) =>
          animarCorrida(timestamp, corridaId),
      )
  }

  function iniciarCorrida() {
    if (corridaEmAndamento) {
      return
    }

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico < APOSTA_MINIMA
    ) {
      setNarracao(
        `A entrada mínima é de ${APOSTA_MINIMA} TaiCoins.`,
      )
      return
    }

    if (valorNumerico > saldo) {
      setNarracao(
        'Você não possui TaiCoins suficientes para esse bilhete.',
      )
      return
    }

    const debitou =
      onDebitarEntrada?.(valorNumerico)

    if (!debitou) {
      return
    }

    limparTemporizadores()

    prepararSomDaCorrida()
    tocarSom(audioContagemRef, {
      volume: 0.58,
    })

    const corridaId =
      corridaIdRef.current

    const vencedoraSorteada =
      escolherVencedora(
        corredoraSelecionada.id,
      )
    const configuracoes =
      criarConfiguracaoDaCorrida(
        vencedoraSorteada.id,
      )

    corridaRef.current = {
      id: corridaId,
      ativa: true,
      valor: valorNumerico,
      escolhida: corredoraSelecionada,
      vencedora: vencedoraSorteada,
      configuracoes,
      iniciadaEm: null,
      mamboAlertaTocado: false,
    }

    ultimaNarracaoRef.current = 0
    setProgressos(
      Object.fromEntries(
        corredoras.map((corredora) => [
          corredora.id,
          0,
        ]),
      ),
    )
    setVencedora(null)
    setResultado(null)
    setOverlayAberto(false)
    setMamboAlertaTocado(false)
    setFase('contagem')
    setContagem(3)
    setNarracao(
      `Bilhete confirmado em ${corredoraSelecionada.nome}. Preparando a largada...`,
    )

    ;[2, 1].forEach((numero, indice) => {
      const timeout = window.setTimeout(() => {
        setContagem(numero)
        tocarSom(audioContagemRef, {
          volume: 0.58,
          playbackRate:
            numero === 1 ? 1.12 : 1.04,
        })
      }, (indice + 1) * 850)

      timeoutsRef.current.push(timeout)
    })

    const largada = window.setTimeout(
      () =>
        iniciarAnimacaoDaCorrida(corridaId),
      2550,
    )

    timeoutsRef.current.push(largada)
  }

  function prepararNovaCorrida() {
    limparTemporizadores()
    pararSomDaCorrida()
    corridaRef.current = null
    setFase('pronto')
    setContagem(null)
    setProgressos(
      Object.fromEntries(
        corredoras.map((corredora) => [
          corredora.id,
          0,
        ]),
      ),
    )
    setVencedora(null)
    setResultado(null)
    setOverlayAberto(false)
    setVideoVitoriaTerminou(false)
    setVideoVitoriaFalhou(false)
    setMamboAlertaTocado(false)
    setNarracao(
      'Nova corrida liberada. Escolha sua Umamusume.',
    )
  }

  return (
    <section
      className="derby-page"
      id="mercados"
    >
      <audio
        ref={audioContagemRef}
        src={somContagem}
        preload="auto"
      />

      <audio
        ref={audioCorridaRef}
        src={somCorrida}
        preload="auto"
      />

      <audio
        ref={audioChegadaRef}
        src={somChegada}
        preload="auto"
      />

      <audio
        ref={audioVitoriaRef}
        src={somVitoria}
        preload="auto"
      />

      <audio
        ref={audioDerrotaRef}
        src={somDerrota}
        preload="auto"
      />

      <audio
        ref={audioMamboRef}
        src={somMambo}
        preload="auto"
      />
      {overlayAberto && resultado && (
        <div
          className={`derby-result-overlay ${
            resultado.ganhou
              ? 'derby-result-win'
              : 'derby-result-loss'
          }`}
          role="alert"
        >
          <div className="derby-result-card">
            <div className="derby-result-video-shell">
              {!videoVitoriaFalhou ? (
                <video
                  key={resultado.vencedora.id}
                  className="derby-result-video"
                  src={
                    videosDeVitoria[
                      resultado.vencedora.id
                    ]
                  }
                  poster={resultado.vencedora.imagem}
                  autoPlay
                  playsInline
                  controls
                  preload="auto"
                  onEnded={() =>
                    setVideoVitoriaTerminou(true)
                  }
                  onError={() => {
                    setVideoVitoriaFalhou(true)
                    setVideoVitoriaTerminou(true)
                  }}
                />
              ) : (
                <img
                  className="derby-result-video-fallback"
                  src={resultado.vencedora.imagem}
                  alt={resultado.vencedora.nome}
                />
              )}

              <span>
                #{resultado.vencedora.numero}
              </span>

              <small>
                VÍDEO OFICIAL DA VENCEDORA
              </small>
            </div>

            <span className="derby-result-eyebrow">
              {videoVitoriaTerminou
                ? 'RESULTADO CONFIRMADO'
                : 'COMEMORAÇÃO DA VENCEDORA'}
            </span>

            <h2>
              {resultado.vencedora.nome} venceu!
            </h2>

            <p>
              {resultado.ganhou
                ? `Você apostou na vencedora e recebeu ${formatarMoedas(
                    resultado.premio,
                  )} TaiCoins.`
                : `Você escolheu ${resultado.escolhida.nome}. A banca agradece pela confiança equivocada.`}
            </p>

            <strong>
              {resultado.ganhou
                ? `+${formatarMoedas(
                    resultado.premio,
                  )} TAICOINS`
                : 'BILHETE DERROTADO'}
            </strong>

            <button
              type="button"
              onClick={prepararNovaCorrida}
            >
              {videoVitoriaTerminou
                ? 'Preparar próxima corrida'
                : 'Pular vídeo e preparar próxima corrida'}
            </button>
          </div>
        </div>
      )}

      <div className="derby-hero">
        <div>
          <span className="derby-eyebrow">
            NOVA CENTRAL DE ODDS
          </span>

          <h1>Taihen Derby</h1>

          <p>
            Escolha uma Umamusume, monte seu bilhete com
            TaiCoins fictícias e assista à corrida mais
            cientificamente duvidosa da internet.
          </p>
        </div>

        <div className="derby-hero-side">
          <div className="derby-fairness">
            <span>PARÓDIA SEM DINHEIRO REAL</span>
            <strong>6 corredoras · 1 vencedora</strong>
          </div>

          <div className="derby-mambo-protocol">
            <img
              src={matikanetannhauser}
              alt="Matikanetannhauser Mambo"
            />

            <div>
              <span>PROTOCOLO MAMBO</span>
              <strong>
                Sua apostada possui 5% de chance.
              </strong>
              <small>
                Apostou em outra? Mambo recebe os 95%.
                Apostou na Mambo? Os 95% restantes viram caos.
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="derby-selection">
        <div className="derby-section-heading">
          <div>
            <span>ESCOLHA SUA CORREDORA</span>
            <h2>Odds da próxima corrida</h2>
          </div>

          <small>
            Todas as imagens são exibidas na mesma proporção
            pelo layout.
          </small>
        </div>

        <div className="derby-runner-cards">
          {corredoras.map((corredora) => {
            const selecionada =
              corredora.id ===
              corredoraSelecionadaId

            return (
              <button
                type="button"
                className={`derby-runner-card ${
                  selecionada ? 'selected' : ''
                }`}
                key={corredora.id}
                disabled={corridaEmAndamento}
                onClick={() =>
                  setCorredoraSelecionadaId(
                    corredora.id,
                  )
                }
              >
                <div className="derby-card-image">
                  <img
                    src={corredora.imagem}
                    alt={corredora.nome}
                  />

                  <span>
                    #{corredora.numero}
                  </span>
                </div>

                <div className="derby-card-info">
                  <span>{corredora.apelido}</span>
                  <h3>{corredora.nome}</h3>

                  <div>
                    <small>ODD</small>
                    <strong>
                      {corredora.odd.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="derby-main-grid">
        <div
          className={`derby-track-card ${
            fase === 'correndo'
              ? 'running'
              : ''
          } ${
            mamboAlertaTocado
              ? 'mambo-protocol-active'
              : ''
          }`}
        >
          <div className="derby-track-header">
            <div>
              <span>HIPÓDROMO TAIHEN</span>
              <h2>Corrida principal</h2>
            </div>

            <div className="derby-track-actions">
              <button
                type="button"
                className={`derby-sound-toggle ${
                  somAtivo ? 'active' : ''
                }`}
                onClick={alternarSom}
              >
                {somAtivo
                  ? '🔊 SOM LIGADO'
                  : '🔇 SOM DESLIGADO'}
              </button>

              <div className="derby-race-status">
                <i />
                {fase === 'correndo'
                  ? 'CORRIDA AO VIVO'
                  : fase === 'contagem'
                    ? 'PREPARANDO LARGADA'
                    : fase === 'resultado'
                      ? 'RESULTADO OFICIAL'
                      : 'APOSTAS ABERTAS'}
              </div>
            </div>
          </div>

          <div className="derby-track">
            <div className="derby-finish-line">
              <span>CHEGADA</span>
            </div>

            {corredoras.map((corredora) => {
              const progresso =
                progressos[corredora.id] || 0
              const ganhou =
                vencedora?.id === corredora.id

              return (
                <div
                  className={`derby-lane ${
                    ganhou ? 'winner' : ''
                  }`}
                  key={corredora.id}
                >
                  <span className="derby-lane-number">
                    {corredora.numero}
                  </span>

                  <div className="derby-lane-road">
                    <div
                      className="derby-racer"
                      style={{
                        left: `${Math.min(
                          95,
                          progresso * 0.95,
                        )}%`,
                      }}
                    >
                      <div>
                        <img
                          src={corredora.imagem}
                          alt=""
                        />
                      </div>

                      <small>
                        {corredora.id ===
                        'matikanetannhauser'
                          ? 'MAMBO'
                          : corredora.nome}
                      </small>
                    </div>
                  </div>
                </div>
              )
            })}

            {contagem !== null && (
              <div className="derby-countdown">
                {contagem}
              </div>
            )}
          </div>

          <div className="derby-commentary">
            <span>NARRAÇÃO OFICIAL</span>
            <strong>{narracao}</strong>
          </div>
        </div>

        <aside className="derby-ticket">
          <div className="derby-ticket-heading">
            <span>BILHETE DO DERBY</span>
            <h2>Sua escolha</h2>
          </div>

          <div className="derby-ticket-runner">
            <div>
              <img
                src={corredoraSelecionada.imagem}
                alt={corredoraSelecionada.nome}
              />
            </div>

            <span>
              <small>
                {corredoraSelecionada.apelido}
              </small>
              <strong>
                {corredoraSelecionada.nome}
              </strong>
            </span>

            <b>
              {corredoraSelecionada.odd.toFixed(2)}
            </b>
          </div>

          <label className="derby-stake">
            <span>Valor da aposta</span>

            <div>
              <button
                type="button"
                disabled={corridaEmAndamento}
                onClick={() =>
                  setValorAposta((valor) =>
                    String(
                      Math.max(
                        APOSTA_MINIMA,
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
                min={APOSTA_MINIMA}
                max={saldo}
                value={valorAposta}
                disabled={corridaEmAndamento}
                onChange={(evento) =>
                  setValorAposta(
                    evento.target.value,
                  )
                }
              />

              <button
                type="button"
                disabled={corridaEmAndamento}
                onClick={() =>
                  setValorAposta((valor) =>
                    String(
                      Number(valor || 0) + 10,
                    ),
                  )
                }
              >
                +
              </button>
            </div>
          </label>

          <div className="derby-quick-values">
            {[10, 25, 50, 100].map((valor) => (
              <button
                type="button"
                key={valor}
                disabled={corridaEmAndamento}
                onClick={() =>
                  setValorAposta(String(valor))
                }
              >
                {valor}
              </button>
            ))}

            <button
              type="button"
              disabled={corridaEmAndamento}
              onClick={() =>
                setValorAposta(
                  String(Math.floor(saldo)),
                )
              }
            >
              Tudo
            </button>
          </div>

          <div className="derby-ticket-summary">
            <div>
              <span>Saldo</span>
              <strong>
                {formatarMoedas(saldo)} T
              </strong>
            </div>

            <div>
              <span>Odd</span>
              <strong>
                {corredoraSelecionada.odd.toFixed(2)}
              </strong>
            </div>

            <div>
              <span>Retorno possível</span>
              <strong>
                {formatarMoedas(
                  retornoPossivel,
                )}{' '}
                T
              </strong>
            </div>

            <div className="derby-ticket-probability">
              <span>Chance real da escolhida</span>
              <strong>5%</strong>
            </div>
          </div>

          <button
            type="button"
            className="derby-start-button"
            disabled={corridaEmAndamento}
            onClick={
              fase === 'resultado'
                ? prepararNovaCorrida
                : iniciarCorrida
            }
          >
            {fase === 'resultado'
              ? 'PREPARAR NOVA CORRIDA'
              : fase === 'contagem'
                ? `LARGADA EM ${contagem}`
                : fase === 'correndo'
                  ? 'CORRIDA EM ANDAMENTO'
                  : 'APOSTAR E INICIAR CORRIDA'}
          </button>

          <p>
            TaiCoins não possuem valor financeiro. O Derby é
            uma paródia e não oferece dinheiro ou prêmios
            reais.
          </p>
        </aside>
      </div>
    </section>
  )
}

export default DerbyPage
