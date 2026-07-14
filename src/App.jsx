import { useEffect, useRef, useState } from 'react'
import './App.css'
import './MascoteGlobal.css'
import './Falencia.css'
import './AnuncioRecompensa.css'
import './AvisoInicial.css'
import AdminPanel from './components/AdminPanel'
import RankingPage from './components/RankingPage'
import LivePage from './components/LivePage'
import GamesPage from './components/GamesPage'
import SportsHome from './components/SportsHome'
import MuseumPage from './components/MuseumPage'
import FinalMessagePage from './components/FinalMessagePage'
import NeytaiAssistant from './components/NeytaiAssistant'
import { gerarRodadaBahrein } from './data/bahrainLeague'
import entidadeBanca from './assets/entidade-banca.png'
import videoFalencia from './assets/zero-taicoins.mp4'
import videoAnuncioRecompensa1 from './assets/anuncio-20-taicoins.mp4'
import videoAnuncioRecompensa2 from './assets/anuncio-20-taicoins-2.mp4'

const anunciosRecompensados = [
  videoAnuncioRecompensa1,
  videoAnuncioRecompensa2,
]

const VERSAO_LIGA_BAHREIN = 'bahrain-league-v1'

function carregarEventos() {
  const rodadaSalva = Math.min(
    7,
    Math.max(
      1,
      Number(
        localStorage.getItem(
          'taihenbet-rodada-bahrein',
        ),
      ) || 1,
    ),
  )

  try {
    const versaoSalva = localStorage.getItem(
      'taihenbet-versao-liga',
    )

    if (versaoSalva !== VERSAO_LIGA_BAHREIN) {
      localStorage.setItem(
        'taihenbet-versao-liga',
        VERSAO_LIGA_BAHREIN,
      )
      localStorage.setItem(
        'taihenbet-rodada-bahrein',
        '1',
      )

      return gerarRodadaBahrein(1)
    }

    const eventosSalvos = JSON.parse(
      localStorage.getItem('taihenbet-eventos') ||
        '[]',
    )

    const partidasBahrein = Array.isArray(eventosSalvos)
      ? eventosSalvos.filter(
          (evento) =>
            evento.tipo === 'futebol-bahrein',
        )
      : []

    return partidasBahrein.length > 0
      ? partidasBahrein
      : gerarRodadaBahrein(rodadaSalva)
  } catch {
    return gerarRodadaBahrein(rodadaSalva)
  }
}

function carregarHistorico() {
  try {
    return JSON.parse(
      localStorage.getItem('taihenbet-historico') || '[]',
    )
  } catch {
    return []
  }
}

function carregarHistoricoJogos() {
  try {
    const historicoSalvo = JSON.parse(
      localStorage.getItem('taihenbet-historico-jogos') ||
        '[]',
    )

    return Array.isArray(historicoSalvo)
      ? historicoSalvo
      : []
  } catch {
    return []
  }
}

function carregarSessaoAoVivo() {
  const sessaoPadrao = {
    ativa: false,
    titulo: '',
    iniciadaEm: null,
    encerradaEm: null,
    mercadoIds: [],
    atualizacoes: [],
  }

  try {
    const sessaoSalva = JSON.parse(
      localStorage.getItem('taihenbet-sessao-ao-vivo') ||
        'null',
    )

    if (!sessaoSalva || typeof sessaoSalva !== 'object') {
      return sessaoPadrao
    }

    return {
      ...sessaoPadrao,
      ...sessaoSalva,
      mercadoIds: Array.isArray(sessaoSalva.mercadoIds)
        ? sessaoSalva.mercadoIds.map(String)
        : [],
      atualizacoes: Array.isArray(sessaoSalva.atualizacoes)
        ? sessaoSalva.atualizacoes
        : [],
    }
  } catch {
    return sessaoPadrao
  }
}

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function App() {
  const [pagina, setPagina] = useState('inicio')
  const [eventos, setEventos] = useState(carregarEventos)
  const [rodadaBahrein, setRodadaBahrein] =
    useState(
      () =>
        Math.min(
          7,
          Math.max(
            1,
            Number(
              localStorage.getItem(
                'taihenbet-rodada-bahrein',
              ),
            ) || 1,
          ),
        ),
    )

  const [saldo, setSaldo] = useState(() => {
    const saldoSalvo = localStorage.getItem('taihenbet-saldo')

    return saldoSalvo ? Number(saldoSalvo) : 1000
  })

  const [historico, setHistorico] = useState(carregarHistorico)
  const [historicoJogos, setHistoricoJogos] = useState(
    carregarHistoricoJogos,
  )
  const [sessaoAoVivo, setSessaoAoVivo] = useState(
    carregarSessaoAoVivo,
  )
  const [selecoes, setSelecoes] = useState([])
  const [valorAposta, setValorAposta] = useState('')
  const [mensagem, setMensagem] = useState(null)
  const [falenciaAtiva, setFalenciaAtiva] =
    useState(false)
  const [videoFalenciaTerminou, setVideoFalenciaTerminou] =
    useState(false)
  const [anuncioAtivo, setAnuncioAtivo] =
    useState(false)
  const [indiceAnuncioAtual, setIndiceAnuncioAtual] =
    useState(0)
  const [tempoAnuncio, setTempoAnuncio] =
    useState(0)
  const [duracaoAnuncio, setDuracaoAnuncio] =
    useState(0)
  const [anuncioTerminou, setAnuncioTerminou] =
    useState(false)
  const [erroAnuncio, setErroAnuncio] =
    useState(false)
  const [avisoInicialAtivo, setAvisoInicialAtivo] =
    useState(true)
  const [avisoConfirmado, setAvisoConfirmado] =
    useState(false)

  const saldoAtualRef = useRef(saldo)
  const videoFalenciaRef = useRef(null)
  const videoAnuncioRef = useRef(null)
  const falenciaInicialVerificadaRef = useRef(false)
  const recompensaAnuncioEntregueRef = useRef(false)

  useEffect(() => {
    saldoAtualRef.current = saldo
    localStorage.setItem('taihenbet-saldo', saldo)
  }, [saldo])

  useEffect(() => {
    if (!avisoInicialAtivo) {
      return undefined
    }

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowAnterior
    }
  }, [avisoInicialAtivo])

  useEffect(() => {
    if (falenciaInicialVerificadaRef.current) {
      return
    }

    falenciaInicialVerificadaRef.current = true

    if (saldo <= 0) {
      setVideoFalenciaTerminou(false)
      setFalenciaAtiva(true)
    }
  }, [saldo])

  useEffect(() => {
    if (!falenciaAtiva || !videoFalenciaRef.current) {
      return
    }

    const video = videoFalenciaRef.current

    video.currentTime = 0
    video.volume = 1

    video.play().catch(() => {
      setVideoFalenciaTerminou(true)
    })
  }, [falenciaAtiva])

  useEffect(() => {
    if (!anuncioAtivo || !videoAnuncioRef.current) {
      return
    }

    const video = videoAnuncioRef.current

    video.currentTime = 0
    video.volume = 1

    video.play().catch(() => {
      setErroAnuncio(true)
    })
  }, [anuncioAtivo])

  useEffect(() => {
    localStorage.setItem(
      'taihenbet-eventos',
      JSON.stringify(eventos),
    )
  }, [eventos])

  useEffect(() => {
    localStorage.setItem(
      'taihenbet-rodada-bahrein',
      String(rodadaBahrein),
    )
  }, [rodadaBahrein])

  useEffect(() => {
    localStorage.setItem(
      'taihenbet-sessao-ao-vivo',
      JSON.stringify(sessaoAoVivo),
    )
  }, [sessaoAoVivo])

  useEffect(() => {
    localStorage.setItem(
      'taihenbet-historico-jogos',
      JSON.stringify(historicoJogos),
    )
  }, [historicoJogos])

  const oddTotal = selecoes.reduce(
    (total, selecao) => total * Number(selecao.odd),
    1,
  )

  const valorNumerico = Number(valorAposta) || 0
  const retornoEstimado = valorNumerico * oddTotal

  const totalApostado = historico.reduce(
    (total, aposta) => total + Number(aposta.valor || 0),
    0,
  )

  const retornoPotencialTotal = historico.reduce(
    (total, aposta) =>
      total + Number(aposta.retornoEstimado || 0),
    0,
  )

  const apostasPendentes = historico.filter(
    (aposta) => aposta.status === 'Pendente',
  ).length

  function aceitarAvisoInicial() {
    if (!avisoConfirmado) {
      return
    }

    setAvisoInicialAtivo(false)
  }

  function reabrirAvisoInicial() {
    setAvisoConfirmado(false)
    setAvisoInicialAtivo(true)
  }

  function formatarTempoDoAnuncio(segundos) {
    const valorSeguro = Math.max(
      0,
      Math.floor(Number(segundos) || 0),
    )
    const minutos = Math.floor(valorSeguro / 60)
    const segundosRestantes = valorSeguro % 60

    return `${minutos}:${String(
      segundosRestantes,
    ).padStart(2, '0')}`
  }

  function sortearIndiceDoAnuncio() {
    const numero = new Uint32Array(1)
    crypto.getRandomValues(numero)

    return (
      numero[0] %
      anunciosRecompensados.length
    )
  }

  function abrirAnuncioRecompensa() {
    const videoFalencia = videoFalenciaRef.current

    if (videoFalencia) {
      videoFalencia.pause()
    }

    const indiceSorteado =
      sortearIndiceDoAnuncio()

    recompensaAnuncioEntregueRef.current = false
    setIndiceAnuncioAtual(indiceSorteado)
    setTempoAnuncio(0)
    setDuracaoAnuncio(0)
    setAnuncioTerminou(false)
    setErroAnuncio(false)
    setAnuncioAtivo(true)
  }

  function atualizarTempoDoAnuncio(evento) {
    const video = evento.currentTarget

    setTempoAnuncio(
      Math.min(
        video.currentTime,
        Number.isFinite(video.duration)
          ? video.duration
          : video.currentTime,
      ),
    )
  }

  function carregarDuracaoDoAnuncio(evento) {
    const duracao = evento.currentTarget.duration

    setDuracaoAnuncio(
      Number.isFinite(duracao) ? duracao : 0,
    )
  }

  function concluirAnuncioRecompensado() {
    if (
      !anuncioTerminou ||
      recompensaAnuncioEntregueRef.current
    ) {
      return
    }

    recompensaAnuncioEntregueRef.current = true

    const novoSaldo = saldoAtualRef.current + 20

    saldoAtualRef.current = novoSaldo
    setSaldo(novoSaldo)
    setAnuncioAtivo(false)
    setAnuncioTerminou(false)
    setTempoAnuncio(0)
    setFalenciaAtiva(false)
    setVideoFalenciaTerminou(false)

    setMensagem({
      tipo: 'sucesso',
      texto: 'Anúncio concluído! A banca liberou +20 TaiCoins.',
    })
  }

  function fecharAnuncioComErro() {
    setAnuncioAtivo(false)
    setErroAnuncio(false)
    setTempoAnuncio(0)
    setDuracaoAnuncio(0)
  }

  function abrirFalencia() {
    setVideoFalenciaTerminou(false)
    setFalenciaAtiva(true)
  }

  function fecharFalencia() {
    const video = videoFalenciaRef.current

    if (video) {
      video.pause()
      video.currentTime = 0
    }

    setFalenciaAtiva(false)
    setVideoFalenciaTerminou(false)
  }

  function navegarPara(novaPagina) {
    setPagina(novaPagina)
    setMensagem(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function avisarEmBreve(paginaEmBreve) {
    setMensagem({
      tipo: 'erro',
      texto: `${paginaEmBreve} ainda está em construção. O estagiário responsável desapareceu.`,
    })
  }

  function selecionarOdd(evento, opcao) {
    if (
      evento.status === 'suspenso' ||
      Boolean(evento.resultadoOpcaoId)
    ) {
      return
    }

    setMensagem(null)

    setSelecoes((selecoesAtuais) => {
      const selecaoJaExiste = selecoesAtuais.some(
        (selecao) =>
          String(selecao.eventoId) === String(evento.id) &&
          String(selecao.opcaoId) === String(opcao.id),
      )

      if (selecaoJaExiste) {
        return selecoesAtuais.filter(
          (selecao) =>
            String(selecao.opcaoId) !== String(opcao.id),
        )
      }

      const selecoesSemEsseEvento = selecoesAtuais.filter(
        (selecao) =>
          String(selecao.eventoId) !== String(evento.id),
      )

      return [
        ...selecoesSemEsseEvento,
        {
          eventoId: evento.id,
          eventoTitulo: evento.titulo,
          opcaoId: opcao.id,
          opcaoNome: opcao.nome,
          odd: Number(opcao.odd),
        },
      ]
    })
  }

  function removerSelecao(opcaoId) {
    setSelecoes((selecoesAtuais) =>
      selecoesAtuais.filter(
        (selecao) =>
          String(selecao.opcaoId) !== String(opcaoId),
      ),
    )
  }

  function limparBilhete() {
    setSelecoes([])
    setValorAposta('')
    setMensagem(null)
  }

  function adicionarValor(valor) {
    setValorAposta((valorAtual) => {
      const novoValor = (Number(valorAtual) || 0) + valor

      return Math.min(novoValor, Math.floor(saldo))
    })
  }

  function confirmarAposta() {
    if (selecoes.length === 0) {
      setMensagem({
        tipo: 'erro',
        texto: 'Escolha pelo menos uma odd.',
      })

      return
    }

    const existeSelecaoIndisponivel = selecoes.some((selecao) => {
      const evento = eventos.find(
        (item) => String(item.id) === String(selecao.eventoId),
      )

      return (
        !evento ||
        evento.status === 'suspenso' ||
        Boolean(evento.resultadoOpcaoId)
      )
    })

    if (existeSelecaoIndisponivel) {
      setMensagem({
        tipo: 'erro',
        texto: 'Uma das seleções foi suspensa ou encerrada. Monte o bilhete novamente.',
      })

      setSelecoes((selecoesAtuais) =>
        selecoesAtuais.filter((selecao) => {
          const evento = eventos.find(
            (item) =>
              String(item.id) === String(selecao.eventoId),
          )

          return (
            evento &&
            evento.status !== 'suspenso' &&
            !evento.resultadoOpcaoId
          )
        }),
      )

      return
    }

    if (valorNumerico < 10) {
      setMensagem({
        tipo: 'erro',
        texto: 'A aposta mínima é de 10 TaiCoins.',
      })

      return
    }

    if (valorNumerico > saldo) {
      setMensagem({
        tipo: 'erro',
        texto: 'Você não possui TaiCoins suficientes.',
      })

      return
    }

    const agora = Date.now()

    const novaAposta = {
      id: crypto.randomUUID(),
      data: new Date(agora).toLocaleString('pt-BR'),
      criadaEm: agora,
      selecoes: selecoes.map((selecao) => ({
        ...selecao,
        statusSelecao: 'Pendente',
      })),
      valor: valorNumerico,
      oddTotal,
      retornoEstimado,
      status: 'Pendente',
    }

    setHistorico((historicoAtual) => {
      const novoHistorico = [novaAposta, ...historicoAtual]

      localStorage.setItem(
        'taihenbet-historico',
        JSON.stringify(novoHistorico),
      )

      return novoHistorico
    })

    const novoSaldo = Math.max(
      0,
      saldoAtualRef.current - valorNumerico,
    )

    saldoAtualRef.current = novoSaldo
    setSaldo(novoSaldo)

    if (novoSaldo <= 0) {
      abrirFalencia()
    }

    setSelecoes([])
    setValorAposta('')

    setMensagem({
      tipo: 'sucesso',
      texto: `Aposta confirmada! ${formatarMoedas(
        valorNumerico,
      )} TaiCoins foram sacrificadas por motivos questionáveis.`,
    })
  }

  function publicarRodadaBahrein(numeroRodada) {
    const rodada = Math.min(
      7,
      Math.max(
        1,
        Math.floor(Number(numeroRodada) || 1),
      ),
    )

    const possuiPartidaPendente = eventos.some(
      (evento) =>
        evento.tipo === 'futebol-bahrein' &&
        !evento.resultadoOpcaoId,
    )

    if (possuiPartidaPendente) {
      const confirmou = window.confirm(
        `Publicar a rodada ${rodada} substituirá as partidas atuais que ainda não foram encerradas. Continuar?`,
      )

      if (!confirmou) {
        return
      }
    }

    setEventos(gerarRodadaBahrein(rodada))
    setRodadaBahrein(rodada)
    setSelecoes([])

    setSessaoAoVivo((sessaoAtual) => ({
      ...sessaoAtual,
      mercadoIds: [],
    }))

    setMensagem({
      tipo: 'sucesso',
      texto: `Rodada ${rodada} da Liga do Bahrein publicada com quatro partidas.`,
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function salvarMercado(mercado) {
    const mercadoJaExiste = eventos.some(
      (evento) => String(evento.id) === String(mercado.id),
    )

    setEventos((eventosAtuais) => {
      if (mercadoJaExiste) {
        return eventosAtuais.map((evento) =>
          String(evento.id) === String(mercado.id)
            ? {
                ...evento,
                ...mercado,
              }
            : evento,
        )
      }

      return [mercado, ...eventosAtuais]
    })

    setMensagem({
      tipo: 'sucesso',
      texto: mercadoJaExiste
        ? 'Mercado atualizado com sucesso.'
        : 'Novo mercado aberto. A dignidade dos usuários está novamente em risco.',
    })
  }

  function alternarStatusMercado(mercadoId) {
    const mercado = eventos.find(
      (evento) => String(evento.id) === String(mercadoId),
    )

    if (!mercado) {
      return
    }

    if (mercado.resultadoOpcaoId) {
      setMensagem({
        tipo: 'erro',
        texto: 'Mercados encerrados não podem ser suspensos ou reabertos.',
      })

      return
    }

    const seraSuspenso = mercado.status !== 'suspenso'

    setEventos((eventosAtuais) =>
      eventosAtuais.map((evento) =>
        String(evento.id) === String(mercadoId)
          ? {
              ...evento,
              status: seraSuspenso ? 'suspenso' : 'aberto',
            }
          : evento,
      ),
    )

    if (seraSuspenso) {
      setSelecoes((selecoesAtuais) =>
        selecoesAtuais.filter(
          (selecao) =>
            String(selecao.eventoId) !== String(mercadoId),
        ),
      )
    }

    setMensagem({
      tipo: 'sucesso',
      texto: seraSuspenso
        ? 'Mercado suspenso. A banca está investigando atividades suspeitas.'
        : 'Mercado reaberto. As decisões ruins podem continuar.',
    })
  }

  function excluirMercado(mercadoId) {
    const confirmou = window.confirm(
      'Deseja excluir este mercado permanentemente?',
    )

    if (!confirmou) {
      return
    }

    setEventos((eventosAtuais) =>
      eventosAtuais.filter(
        (evento) => String(evento.id) !== String(mercadoId),
      ),
    )

    setSelecoes((selecoesAtuais) =>
      selecoesAtuais.filter(
        (selecao) =>
          String(selecao.eventoId) !== String(mercadoId),
      ),
    )

    setMensagem({
      tipo: 'sucesso',
      texto: 'Mercado excluído. Todas as provas foram destruídas.',
    })
  }

  function limparMercadosEncerrados() {
    const quantidade = eventos.filter(
      (evento) => Boolean(evento.resultadoOpcaoId),
    ).length

    if (quantidade === 0) {
      setMensagem({
        tipo: 'erro',
        texto: 'Não existem mercados encerrados para limpar.',
      })
      return
    }

    const confirmou = window.confirm(
      `Excluir permanentemente ${quantidade} mercado(s) encerrado(s)?`,
    )

    if (!confirmou) {
      return
    }

    const idsEncerrados = new Set(
      eventos
        .filter((evento) => Boolean(evento.resultadoOpcaoId))
        .map((evento) => String(evento.id)),
    )

    setEventos((eventosAtuais) =>
      eventosAtuais.filter(
        (evento) => !evento.resultadoOpcaoId,
      ),
    )

    setSelecoes((selecoesAtuais) =>
      selecoesAtuais.filter(
        (selecao) =>
          !idsEncerrados.has(String(selecao.eventoId)),
      ),
    )

    setSessaoAoVivo((sessaoAtual) => ({
      ...sessaoAtual,
      mercadoIds: (sessaoAtual.mercadoIds || []).filter(
        (mercadoId) =>
          !idsEncerrados.has(String(mercadoId)),
      ),
    }))

    setMensagem({
      tipo: 'sucesso',
      texto: `${quantidade} mercado(s) encerrado(s) foram removidos definitivamente.`,
    })
  }

  function iniciarSessaoAoVivo({ titulo, mercadoIds }) {
    const mercadosValidos = mercadoIds
      .map(String)
      .filter((mercadoId) =>
        eventos.some(
          (evento) =>
            String(evento.id) === mercadoId &&
            evento.status !== 'suspenso' &&
            !evento.resultadoOpcaoId,
        ),
      )

    if (mercadosValidos.length === 0) {
      setMensagem({
        tipo: 'erro',
        texto: 'Selecione pelo menos um mercado aberto para iniciar a sessão.',
      })

      return
    }

    const agora = Date.now()
    const tituloFinal =
      titulo.trim() || 'Sessão ao vivo da TaihenBet'

    setSessaoAoVivo({
      ativa: true,
      titulo: tituloFinal,
      iniciadaEm: agora,
      encerradaEm: null,
      mercadoIds: mercadosValidos,
      atualizacoes: [
        {
          id: crypto.randomUUID(),
          texto: 'A banca iniciou a sessão ao vivo.',
          criadaEm: agora,
        },
      ],
    })

    setMensagem({
      tipo: 'sucesso',
      texto: `Sessão "${tituloFinal}" iniciada com ${mercadosValidos.length} mercado(s).`,
    })
  }

  function atualizarMercadosAoVivo(mercadoIds) {
    if (!sessaoAoVivo.ativa) {
      setMensagem({
        tipo: 'erro',
        texto: 'Inicie uma sessão antes de atualizar os mercados ao vivo.',
      })

      return
    }

    const mercadosValidos = mercadoIds
      .map(String)
      .filter((mercadoId) =>
        eventos.some(
          (evento) =>
            String(evento.id) === mercadoId &&
            evento.status !== 'suspenso' &&
            !evento.resultadoOpcaoId,
        ),
      )

    if (mercadosValidos.length === 0) {
      setMensagem({
        tipo: 'erro',
        texto: 'A sessão precisa ter pelo menos um mercado aberto.',
      })

      return
    }

    setSessaoAoVivo((sessaoAtual) => ({
      ...sessaoAtual,
      mercadoIds: mercadosValidos,
    }))

    setMensagem({
      tipo: 'sucesso',
      texto: 'Mercados da sessão atualizados.',
    })
  }

  function adicionarAtualizacaoAoVivo(texto) {
    const textoFinal = texto.trim()

    if (!sessaoAoVivo.ativa) {
      setMensagem({
        tipo: 'erro',
        texto: 'Não existe uma sessão ao vivo ativa.',
      })

      return
    }

    if (!textoFinal) {
      setMensagem({
        tipo: 'erro',
        texto: 'Escreva uma atualização antes de publicar.',
      })

      return
    }

    const atualizacao = {
      id: crypto.randomUUID(),
      texto: textoFinal,
      criadaEm: Date.now(),
    }

    setSessaoAoVivo((sessaoAtual) => ({
      ...sessaoAtual,
      atualizacoes: [
        atualizacao,
        ...sessaoAtual.atualizacoes,
      ].slice(0, 50),
    }))

    setMensagem({
      tipo: 'sucesso',
      texto: 'Atualização publicada na página Ao vivo.',
    })
  }

  function encerrarSessaoAoVivo() {
    if (!sessaoAoVivo.ativa) {
      return
    }

    const agora = Date.now()

    setSessaoAoVivo((sessaoAtual) => ({
      ...sessaoAtual,
      ativa: false,
      encerradaEm: agora,
      atualizacoes: [
        {
          id: crypto.randomUUID(),
          texto: 'A banca encerrou a sessão ao vivo.',
          criadaEm: agora,
        },
        ...sessaoAtual.atualizacoes,
      ].slice(0, 50),
    }))

    setMensagem({
      tipo: 'sucesso',
      texto: 'Sessão ao vivo encerrada. Nenhuma audiência imaginária foi prejudicada.',
    })
  }

  function resolverMercado(mercadoId, opcaoVencedoraId) {
    const mercado = eventos.find(
      (evento) => String(evento.id) === String(mercadoId),
    )

    if (!mercado) {
      setMensagem({
        tipo: 'erro',
        texto: 'Mercado não encontrado.',
      })

      return
    }

    if (mercado.resultadoOpcaoId) {
      setMensagem({
        tipo: 'erro',
        texto: 'Esse mercado já possui um resultado definido.',
      })

      return
    }

    const opcaoVencedora = mercado.opcoes.find(
      (opcao) =>
        String(opcao.id) === String(opcaoVencedoraId),
    )

    if (!opcaoVencedora) {
      setMensagem({
        tipo: 'erro',
        texto: 'A opção vencedora não foi encontrada.',
      })

      return
    }

    const resolvidoEm = new Date().toLocaleString('pt-BR')

    const eventosAtualizados = eventos.map((evento) =>
      String(evento.id) === String(mercadoId)
        ? {
            ...evento,
            status: 'encerrado',
            resultadoOpcaoId: opcaoVencedora.id,
            resultadoNome: opcaoVencedora.nome,
            resultadoResolvidoEm: resolvidoEm,
          }
        : evento,
    )

    const resultadosPorEvento = new Map(
      eventosAtualizados
        .filter((evento) => evento.resultadoOpcaoId)
        .map((evento) => [
          String(evento.id),
          String(evento.resultadoOpcaoId),
        ]),
    )

    let premioTotal = 0
    let bilhetesGanhos = 0
    let bilhetesPerdidos = 0

    const historicoAtualizado = historico.map((aposta) => {
      if (aposta.status !== 'Pendente') {
        return aposta
      }

      let possuiEscolhaPerdida = false
      let todasAsEscolhasForamResolvidas = true

      const selecoesAtualizadas = aposta.selecoes.map(
        (selecao) => {
          const resultadoDoEvento = resultadosPorEvento.get(
            String(selecao.eventoId),
          )

          if (!resultadoDoEvento) {
            todasAsEscolhasForamResolvidas = false

            return {
              ...selecao,
              statusSelecao: 'Pendente',
            }
          }

          const acertou =
            resultadoDoEvento === String(selecao.opcaoId)

          if (!acertou) {
            possuiEscolhaPerdida = true
          }

          return {
            ...selecao,
            statusSelecao: acertou ? 'Ganhou' : 'Perdeu',
          }
        },
      )

      let novoStatus = 'Pendente'

      if (possuiEscolhaPerdida) {
        novoStatus = 'Perdeu'
        bilhetesPerdidos += 1
      } else if (todasAsEscolhasForamResolvidas) {
        novoStatus = 'Ganhou'
        bilhetesGanhos += 1
        premioTotal += Number(aposta.retornoEstimado) || 0
      }

      return {
        ...aposta,
        selecoes: selecoesAtualizadas,
        status: novoStatus,
        ...(novoStatus !== 'Pendente'
          ? {
              resolvidaEm: resolvidoEm,
              resolucao: 'Automática',
            }
          : {}),
      }
    })

    setEventos(eventosAtualizados)
    setHistorico(historicoAtualizado)

    localStorage.setItem(
      'taihenbet-eventos',
      JSON.stringify(eventosAtualizados),
    )

    localStorage.setItem(
      'taihenbet-historico',
      JSON.stringify(historicoAtualizado),
    )

    setSelecoes((selecoesAtuais) =>
      selecoesAtuais.filter(
        (selecao) =>
          String(selecao.eventoId) !== String(mercadoId),
      ),
    )

    if (premioTotal > 0) {
      setSaldo((saldoAtual) => saldoAtual + premioTotal)
    }

    let texto = `Resultado definido: "${opcaoVencedora.nome}".`

    if (bilhetesGanhos > 0) {
      texto += ` ${bilhetesGanhos} bilhete(s) ganharam ${formatarMoedas(
        premioTotal,
      )} TaiCoins.`
    }

    if (bilhetesPerdidos > 0) {
      texto += ` ${bilhetesPerdidos} bilhete(s) foram destruídos pela banca.`
    }

    if (bilhetesGanhos === 0 && bilhetesPerdidos === 0) {
      texto +=
        ' Nenhum bilhete foi encerrado ainda, pois podem existir combinadas pendentes.'
    }

    setMensagem({
      tipo: 'sucesso',
      texto,
    })
  }

  function resolverAposta(apostaId, resultado) {
    const apostaEncontrada = historico.find(
      (aposta) => aposta.id === apostaId,
    )

    if (
      !apostaEncontrada ||
      apostaEncontrada.status !== 'Pendente'
    ) {
      setMensagem({
        tipo: 'erro',
        texto: 'Essa aposta já foi resolvida.',
      })

      return
    }

    const novoStatus =
      resultado === 'ganhou' ? 'Ganhou' : 'Perdeu'
    const resolvidaEm = new Date().toLocaleString('pt-BR')

    const novoHistorico = historico.map((aposta) => {
      if (aposta.id !== apostaId) {
        return aposta
      }

      return {
        ...aposta,
        status: novoStatus,
        resolvidaEm,
        resolucao: 'Manual',
      }
    })

    setHistorico(novoHistorico)

    localStorage.setItem(
      'taihenbet-historico',
      JSON.stringify(novoHistorico),
    )

    if (resultado === 'ganhou') {
      const premio = Number(apostaEncontrada.retornoEstimado)

      setSaldo((saldoAtual) => saldoAtual + premio)

      setMensagem({
        tipo: 'sucesso',
        texto: `Aposta vencedora! ${formatarMoedas(
          premio,
        )} TaiCoins foram entregues. A banca está chorando.`,
      })

      return
    }

    setMensagem({
      tipo: 'erro',
      texto: `Aposta perdida. A banca agradece pelas ${formatarMoedas(
        apostaEncontrada.valor,
      )} TaiCoins sacrificadas.`,
    })
  }

  function debitarEntradaDerby(valor) {
    const valorNumerico = Number(valor)

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico < 10
    ) {
      setMensagem({
        tipo: 'erro',
        texto: 'A aposta mínima do Derby é de 10 TaiCoins.',
      })
      return false
    }

    if (valorNumerico > saldoAtualRef.current) {
      setMensagem({
        tipo: 'erro',
        texto: 'Você não possui TaiCoins suficientes para esse bilhete.',
      })
      return false
    }

    const novoSaldo = Math.max(
      0,
      saldoAtualRef.current - valorNumerico,
    )

    saldoAtualRef.current = novoSaldo
    setSaldo(novoSaldo)
    setMensagem(null)

    return true
  }

  function finalizarCorridaDerby(resultado) {
    const ganhou = Boolean(resultado.ganhou)
    const premio = ganhou
      ? Math.max(0, Number(resultado.premio) || 0)
      : 0
    const valor = Math.max(
      0,
      Number(resultado.valor) || 0,
    )
    const agora = Date.now()

    if (premio > 0) {
      const novoSaldo =
        saldoAtualRef.current + premio

      saldoAtualRef.current = novoSaldo
      setSaldo(novoSaldo)
    }

    const novaAposta = {
      id: crypto.randomUUID(),
      tipo: 'derby',
      data: new Date(agora).toLocaleString('pt-BR'),
      criadaEm: agora,
      resolvidaEm: new Date(agora).toLocaleString('pt-BR'),
      resolucao: 'Taihen Derby',
      selecoes: [
        {
          eventoId: `taihen-derby-${agora}`,
          eventoTitulo: 'Taihen Derby',
          opcaoId:
            resultado.corredoraEscolhida.id,
          opcaoNome:
            resultado.corredoraEscolhida.nome,
          odd: Number(resultado.odd),
          statusSelecao: ganhou
            ? 'Ganhou'
            : 'Perdeu',
        },
      ],
      vencedoraDerby:
        resultado.corredoraVencedora.nome,
      valor,
      oddTotal: Number(resultado.odd),
      retornoEstimado:
        valor * Number(resultado.odd),
      retornoPago: premio,
      status: ganhou ? 'Ganhou' : 'Perdeu',
    }

    setHistorico((historicoAtual) => {
      const novoHistorico = [
        novaAposta,
        ...historicoAtual,
      ]

      localStorage.setItem(
        'taihenbet-historico',
        JSON.stringify(novoHistorico),
      )

      return novoHistorico
    })

    if (
      !ganhou &&
      saldoAtualRef.current <= 0
    ) {
      abrirFalencia()
    }

    setMensagem({
      tipo: ganhou ? 'sucesso' : 'erro',
      texto: ganhou
        ? `${resultado.corredoraVencedora.nome} venceu! +${formatarMoedas(
            premio,
          )} TaiCoins foram liberadas.`
        : `${resultado.corredoraVencedora.nome} venceu o Derby. Seu bilhete em ${resultado.corredoraEscolhida.nome} foi derrotado.`,
    })
  }

  function debitarEntradaJogo(valor) {
    const valorNumerico = Number(valor)

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico < 10
    ) {
      setMensagem({
        tipo: 'erro',
        texto: 'A entrada mínima dos jogos é de 10 TaiCoins.',
      })

      return false
    }

    if (valorNumerico > saldo) {
      setMensagem({
        tipo: 'erro',
        texto: 'Você não possui TaiCoins suficientes para iniciar o jogo.',
      })

      return false
    }

    const novoSaldo = Math.max(
      0,
      saldoAtualRef.current - valorNumerico,
    )

    saldoAtualRef.current = novoSaldo
    setSaldo(novoSaldo)
    setMensagem(null)

    return true
  }

  function finalizarJogo(resultado) {
    const premio = Math.max(
      0,
      Number(resultado.premio) || 0,
    )

    if (premio > 0) {
      const novoSaldo =
        saldoAtualRef.current + premio

      saldoAtualRef.current = novoSaldo
      setSaldo(novoSaldo)
    }

    const novoRegistro = {
      id: crypto.randomUUID(),
      data: new Date().toLocaleString('pt-BR'),
      ...resultado,
      premio,
      lucro:
        Number(resultado.lucro) ||
        premio - Number(resultado.entrada || 0),
    }

    setHistoricoJogos((historicoAtual) => [
      novoRegistro,
      ...historicoAtual,
    ])

    if (
      novoRegistro.status !== 'Ganhou' &&
      saldoAtualRef.current <= 0
    ) {
      abrirFalencia()
    }

    setMensagem({
      tipo:
        novoRegistro.status === 'Ganhou'
          ? 'sucesso'
          : 'erro',
      texto:
        novoRegistro.status === 'Ganhou'
          ? `${novoRegistro.jogo || 'Jogo'} encerrado! ${formatarMoedas(
              premio,
            )} TaiCoins retornaram para sua carteira.`
          : novoRegistro.jogo === 'TaiMandioca'
            ? 'TaiMandioca: você encontrou a mandioca normal. A Entidade da Banca agradece a oferenda.'
            : novoRegistro.jogo === 'Taigrinho'
              ? 'Taigrinho: nenhuma linha pagou. A banca agradece pelas TaiCoins.'
              : 'Crash do Regime: a Comandante encerrou a operação e confiscou sua entrada.', 
    })
  }

  function receberBonusJogo(valor) {
    const valorNumerico = Math.max(0, Number(valor) || 0)

    if (valorNumerico <= 0) {
      return
    }

    const novoSaldo =
      saldoAtualRef.current + valorNumerico

    saldoAtualRef.current = novoSaldo
    setSaldo(novoSaldo)

    setMensagem({
      tipo: 'sucesso',
      texto: `Bênção diária recebida: +${formatarMoedas(
        valorNumerico,
      )} TaiCoins.`,
    })
  }

  function limparHistorico() {
    const confirmou = window.confirm(
      'Deseja apagar permanentemente todo o histórico de apostas?',
    )

    if (!confirmou) {
      return
    }

    setHistorico([])
    localStorage.removeItem('taihenbet-historico')

    setMensagem({
      tipo: 'sucesso',
      texto: 'Histórico apagado. As provas foram destruídas.',
    })
  }

  function irParaApostas() {
    document
      .getElementById('mercados')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  function abrirBilheteAoVivo() {
    setPagina('inicio')
    setMensagem(null)

    window.setTimeout(() => {
      document
        .getElementById('mercados')
        ?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }

  return (
    <div className="app">
      {avisoInicialAtivo && (
        <div
          className="anti-betting-intro"
          role="dialog"
          aria-modal="true"
          aria-labelledby="anti-betting-title"
        >
          <div
            className="anti-betting-intro-glow"
            aria-hidden="true"
          />

          <div className="anti-betting-intro-card">
            <aside className="anti-betting-intro-visual">
              <img
                src={entidadeBanca}
                alt="Entidade da banca"
              />

              <div>
                <span>TAIHENBET</span>
                <strong>Paródia antiapostas</strong>
              </div>
            </aside>

            <div className="anti-betting-intro-content">
              <span className="anti-betting-intro-eyebrow">
                AVISO IMPORTANTE ANTES DE ENTRAR
              </span>

              <h1 id="anti-betting-title">
                Isto é uma piada.
                <br />
                <b>Não é uma casa de apostas.</b>
              </h1>

              <p className="anti-betting-intro-lead">
                A TaihenBet foi criada apenas como uma paródia
                entre amigos, com memes e minijogos fictícios.
                Ela não tem intenção de parecer séria, ensinar
                apostas ou incentivar alguém a apostar.
              </p>

              <div className="anti-betting-statement">
                <strong>
                  Eu, criador deste projeto, abomino apostas com
                  dinheiro real.
                </strong>

                <p>
                  Considero apostar errado, perigoso e capaz de
                  causar prejuízo financeiro, vício e sofrimento.
                  O humor deste site não representa apoio a
                  cassinos, bets ou jogos de azar reais.
                </p>
              </div>

              <div className="anti-betting-rules">
                <article>
                  <i>01</i>
                  <div>
                    <strong>Nenhum dinheiro real</strong>
                    <span>
                      Não existe PIX, depósito, compra, saque ou
                      cobrança.
                    </span>
                  </div>
                </article>

                <article>
                  <i>02</i>
                  <div>
                    <strong>TaiCoins não têm valor</strong>
                    <span>
                      São pontos fictícios e não podem ser
                      convertidos em dinheiro ou prêmios.
                    </span>
                  </div>
                </article>

                <article>
                  <i>03</i>
                  <div>
                    <strong>Nenhum prêmio real</strong>
                    <span>
                      Ganhos, anúncios, rankings e resultados
                      existem somente dentro da brincadeira.
                    </span>
                  </div>
                </article>

                <article>
                  <i>04</i>
                  <div>
                    <strong>Não use como referência</strong>
                    <span>
                      As regras e probabilidades foram feitas para
                      humor, não para representar jogos reais.
                    </span>
                  </div>
                </article>
              </div>

              <label className="anti-betting-confirmation">
                <input
                  type="checkbox"
                  checked={avisoConfirmado}
                  onChange={(event) =>
                    setAvisoConfirmado(
                      event.target.checked,
                    )
                  }
                />

                <span>
                  Li e entendi que este site é uma paródia
                  antiapostas, sem dinheiro ou prêmios reais.
                </span>
              </label>

              <button
                type="button"
                className="anti-betting-enter"
                disabled={!avisoConfirmado}
                onClick={aceitarAvisoInicial}
              >
                {avisoConfirmado
                  ? 'ENTENDI — ENTRAR NA PARÓDIA'
                  : 'CONFIRME O AVISO PARA ENTRAR'}
              </button>

              <small>
                Este aviso aparece novamente sempre que a página é
                aberta ou recarregada e pode ser reaberto pelo rodapé.
              </small>
            </div>
          </div>
        </div>
      )}

      {anuncioAtivo && (
        <div
          className="reward-ad-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Anúncio recompensado"
        >
          <div className="reward-ad-card">
            <div className="reward-ad-heading">
              <div>
                <span>
                  ANÚNCIO RECOMPENSADO · SORTEADO ALEATORIAMENTE
                </span>
                <h2>Assista e receba 20 TaiCoins</h2>
              </div>

              <strong>+20 T</strong>
            </div>

            <div className="reward-ad-video-frame">
              <video
                ref={videoAnuncioRef}
                key={indiceAnuncioAtual}
                src={
                  anunciosRecompensados[
                    indiceAnuncioAtual
                  ]
                }
                autoPlay
                playsInline
                preload="auto"
                onLoadedMetadata={carregarDuracaoDoAnuncio}
                onTimeUpdate={atualizarTempoDoAnuncio}
                onEnded={(evento) => {
                  const video = evento.currentTarget

                  setTempoAnuncio(
                    Number.isFinite(video.duration)
                      ? video.duration
                      : tempoAnuncio,
                  )
                  setAnuncioTerminou(true)
                }}
                onError={() => setErroAnuncio(true)}
              />
            </div>

            <div className="reward-ad-progress">
              <div>
                <span
                  style={{
                    width:
                      duracaoAnuncio > 0
                        ? `${Math.min(
                            100,
                            (tempoAnuncio /
                              duracaoAnuncio) *
                              100,
                          )}%`
                        : '0%',
                  }}
                />
              </div>

              <small>
                Tempo assistido:{' '}
                {formatarTempoDoAnuncio(tempoAnuncio)} /{' '}
                {formatarTempoDoAnuncio(duracaoAnuncio)}
              </small>
            </div>

            {erroAnuncio ? (
              <button
                type="button"
                className="reward-ad-skip error"
                onClick={fecharAnuncioComErro}
              >
                Não foi possível carregar o anúncio
              </button>
            ) : (
              <button
                type="button"
                className={`reward-ad-skip ${
                  anuncioTerminou ? 'ready' : ''
                }`}
                disabled={!anuncioTerminou}
                onClick={concluirAnuncioRecompensado}
              >
                {anuncioTerminou
                  ? `Pular anúncio ${formatarTempoDoAnuncio(
                      tempoAnuncio,
                    )} / ${formatarTempoDoAnuncio(
                      duracaoAnuncio,
                    )} — receber +20`
                  : `Pular anúncio ${formatarTempoDoAnuncio(
                      tempoAnuncio,
                    )} / ${formatarTempoDoAnuncio(
                      duracaoAnuncio,
                    )}`}
              </button>
            )}

            <p>
              O botão conta para cima e só fica disponível
              quando o anúncio já acabou, porque a banca é
              extremamente honesta.
            </p>
          </div>
        </div>
      )}

      {falenciaAtiva && (
        <div
          className="bankruptcy-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Saldo de TaiCoins esgotado"
        >
          <div className="bankruptcy-backdrop-text">
            0 TAICOINS
          </div>

          <div className="bankruptcy-card">
            <span className="bankruptcy-eyebrow">
              DECRETO OFICIAL DA BANCA
            </span>

            <h2>VOCÊ FALIU.</h2>

            <p>
              Seu saldo chegou a zero. A Entidade da Banca
              preparou um pronunciamento especial.
            </p>

            <div className="bankruptcy-video-frame">
              <video
                ref={videoFalenciaRef}
                src={videoFalencia}
                autoPlay
                playsInline
                controls
                onEnded={() =>
                  setVideoFalenciaTerminou(true)
                }
              />
            </div>

            <strong className="bankruptcy-balance">
              SALDO ATUAL: 0 TAICOINS
            </strong>

            <button
              type="button"
              className={
                videoFalenciaTerminou
                  ? 'bankruptcy-close ready'
                  : 'bankruptcy-close'
              }
              onClick={fecharFalencia}
            >
              {videoFalenciaTerminou
                ? 'Aceitar a falência'
                : 'Pular pronunciamento'}
            </button>

            <button
              type="button"
              className="bankruptcy-watch-ad"
              onClick={abrirAnuncioRecompensa}
            >
              Assistir anúncio e receber +20 TaiCoins
            </button>

            <small>
              Assista ao anúncio ou use a bênção diária nos
              Jogos para voltar à economia fictícia.
            </small>
          </div>
        </div>
      )}

      <NeytaiAssistant
        enabled={
          !avisoInicialAtivo &&
          !anuncioAtivo &&
          !falenciaAtiva
        }
        pagina={pagina}
        onNavigate={navegarPara}
      />

      <header className="header">
        <div className="brand-lockup">
          <button
            data-neytai-target="nav-inicio"
            className="logo logo-button"
            onClick={() => navegarPara('inicio')}
          >
            TAIHEN<span>BET</span>
          </button>

          <button
            type="button"
            className="oracle-header-avatar"
            onClick={() => navegarPara('ranking')}
            title="Ver a Entidade da Banca"
          >
            <img
              src={entidadeBanca}
              alt="Entidade da banca"
            />
          </button>
        </div>

        <nav className="navigation">
          <button
            className={pagina === 'inicio' ? 'active' : ''}
            onClick={() => navegarPara('inicio')}
          >
            Início
          </button>

          <button
            data-neytai-target="nav-jogos"
            className={pagina === 'jogos' ? 'active' : ''}
            onClick={() => navegarPara('jogos')}
          >
            Jogos
          </button>

          <button
            data-neytai-target="nav-ao-vivo"
            className={pagina === 'ao-vivo' ? 'active' : ''}
            onClick={() => navegarPara('ao-vivo')}
          >
            Ao vivo
          </button>

          <button
            data-neytai-target="nav-museu"
            className={pagina === 'museu' ? 'active' : ''}
            onClick={() => navegarPara('museu')}
          >
            Museu
          </button>

          <button
            data-neytai-target="nav-ranking"
            className={pagina === 'ranking' ? 'active' : ''}
            onClick={() => navegarPara('ranking')}
          >
            Ranking
          </button>

          <button
            data-neytai-target="nav-historico"
            className={pagina === 'historico' ? 'active' : ''}
            onClick={() => navegarPara('historico')}
          >
            Histórico
          </button>

          <button
            data-neytai-target="nav-para-tai"
            className={pagina === 'para-tai' ? 'active' : ''}
            onClick={() => navegarPara('para-tai')}
          >
            Para a Tai
          </button>

          <button
            data-neytai-target="nav-painel"
            className={pagina === 'admin' ? 'active' : ''}
            onClick={() => navegarPara('admin')}
          >
            Painel
          </button>
        </nav>

        <div
          className="wallet reward-wallet"
          data-neytai-target="wallet"
        >
          <span>Seu saldo</span>

          <strong>
            <i className="mini-coin">T</i>
            {formatarMoedas(saldo)} TaiCoins
          </strong>

          <button
            type="button"
            className="wallet-ad-button"
            onClick={abrirAnuncioRecompensa}
          >
            Assistir anúncio +20
          </button>
        </div>
      </header>

      <main className="page">

        {mensagem && (
          <div className={`notification ${mensagem.tipo}`}>
            <img
              className="notification-oracle"
              src={entidadeBanca}
              alt=""
              aria-hidden="true"
            />

            <span>{mensagem.texto}</span>

            <button onClick={() => setMensagem(null)}>×</button>
          </div>
        )}

        {import.meta.env.DEV && pagina === 'admin' && (
          <section className="bankruptcy-test-panel">
            <div>
              <span>MODO DE DESENVOLVIMENTO</span>
              <h2>Teste de falência</h2>
              <p>
                Reproduz o vídeo de 0 TaiCoins sem alterar
                seu saldo atual.
              </p>
            </div>

            <div className="development-test-actions">
              <button
                type="button"
                onClick={abrirFalencia}
              >
                Testar vídeo de 0 TaiCoins
              </button>

              <button
                type="button"
                onClick={abrirAnuncioRecompensa}
              >
                Testar anúncio de +20
              </button>

              <button
                type="button"
                onClick={reabrirAvisoInicial}
              >
                Testar tela inicial
              </button>
            </div>
          </section>
        )}

        {pagina === 'inicio' ? (
          <SportsHome
            eventos={eventos}
            rodada={rodadaBahrein}
            saldo={saldo}
            selecoes={selecoes}
            valorAposta={valorAposta}
            oddTotal={oddTotal}
            retornoEstimado={retornoEstimado}
            onSelecionarOdd={selecionarOdd}
            onRemoverSelecao={removerSelecao}
            onLimparBilhete={limparBilhete}
            onValorApostaChange={setValorAposta}
            onAdicionarValor={adicionarValor}
            onConfirmarAposta={confirmarAposta}
            onIrParaJogos={() => navegarPara('jogos')}
            onIrParaMuseu={() => navegarPara('museu')}
          />
        ) : pagina === 'museu' ? (
          <MuseumPage />
        ) : pagina === 'historico' ? (
          <section
            className="history-page"
            data-neytai-target="history-page"
          >
            <div className="history-header">
              <div>
                <span className="history-eyebrow">
                  ARQUIVO DE DECISÕES QUESTIONÁVEIS
                </span>

                <h1>Histórico de apostas</h1>

                <p>
                  Todas as TaiCoins colocadas em risco por
                  motivos absolutamente científicos.
                </p>
              </div>

              {historico.length > 0 && (
                <button
                  className="clear-history-button"
                  onClick={limparHistorico}
                >
                  Apagar histórico
                </button>
              )}
            </div>

            <div className="history-summary">
              <article className="history-summary-card">
                <span>Total de apostas</span>
                <strong>{historico.length}</strong>
              </article>

              <article className="history-summary-card">
                <span>TaiCoins apostadas</span>
                <strong>{formatarMoedas(totalApostado)}</strong>
              </article>

              <article className="history-summary-card">
                <span>Apostas pendentes</span>
                <strong>{apostasPendentes}</strong>
              </article>

              <article className="history-summary-card">
                <span>Retorno potencial</span>
                <strong>
                  {formatarMoedas(retornoPotencialTotal)}
                </strong>
              </article>
            </div>

            {historico.length === 0 ? (
              <div className="history-empty oracle-history-empty">
                <div className="oracle-history-image">
                  <img
                    src={entidadeBanca}
                    alt="Entidade da banca"
                  />
                </div>

                <span className="oracle-small-label">
                  O ORÁCULO NÃO ENCONTROU OFERENDAS
                </span>

                <h2>Nenhuma aposta registrada</h2>

                <p>
                  Seu histórico está limpo. A entidade considera
                  isso temporário.
                </p>

                <button
                  className="hero-button"
                  onClick={() => navegarPara('inicio')}
                >
                  Fazer primeira aposta
                </button>
              </div>
            ) : (
              <div className="history-list">
                {historico.map((aposta, indice) => (
                  <article
                    className="history-card"
                    key={aposta.id}
                  >
                    <div className="history-card-top">
                      <div>
                        <span className="history-number">
                          APOSTA #{historico.length - indice}
                        </span>

                        <h2>{aposta.data}</h2>
                      </div>

                      <span
                        className={`history-status status-${aposta.status.toLowerCase()}`}
                      >
                        {aposta.status}
                      </span>
                    </div>

                    <div className="history-selections">
                      {aposta.selecoes.map((selecao) => (
                        <div
                          className="history-selection"
                          key={selecao.opcaoId}
                        >
                          <div>
                            <span>{selecao.eventoTitulo}</span>
                            <strong>{selecao.opcaoNome}</strong>
                          </div>

                          <b>{Number(selecao.odd).toFixed(2)}</b>
                        </div>
                      ))}
                    </div>

                    <div className="history-meta">
                      <div>
                        <span>Valor apostado</span>
                        <strong>
                          {formatarMoedas(aposta.valor)} TaiCoins
                        </strong>
                      </div>

                      <div>
                        <span>Odd total</span>
                        <strong>
                          {Number(aposta.oddTotal).toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <span>Retorno possível</span>
                        <strong className="possible-return">
                          {formatarMoedas(
                            aposta.retornoEstimado,
                          )}{' '}
                          TaiCoins
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : pagina === 'para-tai' ? (
          <FinalMessagePage
            onVoltarInicio={() => navegarPara('inicio')}
          />
        ) : pagina === 'jogos' ? (
          <GamesPage
            saldo={saldo}
            historicoJogos={historicoJogos}
            onDebitarEntrada={debitarEntradaJogo}
            onFinalizarJogo={finalizarJogo}
            onReceberBonus={receberBonusJogo}
            onDebitarEntradaDerby={debitarEntradaDerby}
            onFinalizarCorridaDerby={finalizarCorridaDerby}
          />
        ) : pagina === 'ao-vivo' ? (
          <div
            className="neytai-tour-page-wrapper"
            data-neytai-target="live-page"
          >
            <LivePage
              eventos={eventos}
              historico={historico}
              sessaoAoVivo={sessaoAoVivo}
              selecoes={selecoes}
              onSelecionarOdd={selecionarOdd}
              onAbrirBilhete={abrirBilheteAoVivo}
            />
          </div>
        ) : pagina === 'ranking' ? (
          <div
            className="neytai-tour-page-wrapper"
            data-neytai-target="ranking-page"
          >
            <RankingPage
              historico={historico}
              saldo={saldo}
            />
          </div>
        ) : (
          <div
            className="neytai-tour-page-wrapper"
            data-neytai-target="admin-page"
          >
            <AdminPanel
              historico={historico}
              eventos={eventos}
              sessaoAoVivo={sessaoAoVivo}
              onResolver={resolverAposta}
              onResolverMercado={resolverMercado}
              onSalvarMercado={salvarMercado}
              onAlternarMercado={alternarStatusMercado}
              onExcluirMercado={excluirMercado}
              onLimparMercadosEncerrados={limparMercadosEncerrados}
              rodadaBahrein={rodadaBahrein}
              onPublicarRodadaBahrein={publicarRodadaBahrein}
              onIniciarSessaoAoVivo={iniciarSessaoAoVivo}
              onAtualizarMercadosAoVivo={atualizarMercadosAoVivo}
              onAdicionarAtualizacaoAoVivo={adicionarAtualizacaoAoVivo}
              onEncerrarSessaoAoVivo={encerrarSessaoAoVivo}
            />
          </div>
        )}

        <footer
          className="oracle-footer"
          data-neytai-target="anti-betting-footer"
        >
          <div className="oracle-footer-brand">
            <img
              src={entidadeBanca}
              alt=""
              aria-hidden="true"
            />

            <div>
              <strong>TAIHENBET</strong>
              <span>Sob supervisão do Oráculo das Odds</span>
            </div>
          </div>

          <div className="footer-anti-betting">
            <p>
              Este site é uma paródia antiapostas. Não envolve
              dinheiro, prêmios ou apostas reais.
            </p>

            <button
              type="button"
              onClick={reabrirAvisoInicial}
            >
              Ler aviso completo
            </button>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
