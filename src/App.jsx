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
import CreatorMessagePage from './components/CreatorMessagePage'
import GroupPage from './components/GroupPage'
import NeytaiAssistant from './components/NeytaiAssistant'
import AuthModal from './components/AuthModal'
import AccountMenu from './components/AccountMenu'
import AccountSuspensionNotice from './components/AccountSuspensionNotice'
import ProfileModal from './components/ProfileModal'
import LegacyBalanceModal from './components/LegacyBalanceModal'
import LegacyHistoryModal from './components/LegacyHistoryModal'
import HistoryPage from './components/HistoryPage'
import ProgressionPage from './components/ProgressionPage'
import PublicProfilePage from './components/PublicProfilePage'
import NotificationCenter from './components/NotificationCenter'
import TaiShopPage from './components/TaiShopPage'
import MissionPage from './components/MissionPage'
import EventSeasonPage from './components/EventSeasonPage'
import CommunityFeedPage from './components/CommunityFeedPage'
import { supabase } from './lib/supabase'
import { useSiteTexts } from './hooks/useEditableContent'
import './TaihenTheme2026.css'
import './HeaderLayoutHotfix.css'
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
const CREATOR_MESSAGE_UNLOCK_KEY = 'taihenbet-creator-message-unlocked-v1'


function numeroEstatistica(valor) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
}

function calcularSnapshotPerfilPublico(sports = [], games = []) {
  const esportes = Array.isArray(sports) ? sports : []
  const jogos = Array.isArray(games) ? games : []
  const liquidadosEsporte = esportes.filter((item) =>
    ['Ganhou', 'Perdeu'].includes(item?.status),
  )

  const vitoriasEsporte = liquidadosEsporte.filter(
    (item) => item.status === 'Ganhou',
  ).length
  const derrotasEsporte = liquidadosEsporte.filter(
    (item) => item.status === 'Perdeu',
  ).length
  const vitoriasJogos = jogos.filter(
    (item) => item?.status === 'Ganhou',
  ).length
  const derrotasJogos = jogos.filter(
    (item) => item?.status && item.status !== 'Ganhou',
  ).length

  const resultadosFinanceiros = []

  liquidadosEsporte.forEach((item) => {
    const entrada = numeroEstatistica(item.valor)
    const retorno =
      item.status === 'Ganhou'
        ? numeroEstatistica(item.retornoPago ?? item.retornoEstimado)
        : 0
    resultadosFinanceiros.push(retorno - entrada)
  })

  jogos.forEach((item) => {
    const lucroCalculado = Number(item?.lucro)
    resultadosFinanceiros.push(
      Number.isFinite(lucroCalculado)
        ? lucroCalculado
        : numeroEstatistica(item?.premio) - numeroEstatistica(item?.entrada),
    )
  })

  const totalApostadoEsportes = esportes.reduce(
    (total, item) => total + numeroEstatistica(item?.valor),
    0,
  )
  const totalApostadoJogos = jogos.reduce(
    (total, item) => total + numeroEstatistica(item?.entrada),
    0,
  )
  const totalPagoEsportes = esportes.reduce(
    (total, item) =>
      total +
      (item?.status === 'Ganhou'
        ? numeroEstatistica(item?.retornoPago ?? item?.retornoEstimado)
        : 0),
    0,
  )
  const totalPagoJogos = jogos.reduce((total, item) => {
    const premio = Number(item?.premio)
    if (Number.isFinite(premio)) return total + premio

    const lucro = Number(item?.lucro)
    if (!Number.isFinite(lucro)) return total

    return total + Math.max(0, numeroEstatistica(item?.entrada) + lucro)
  }, 0)

  return {
    sports_count: esportes.length,
    games_count: jogos.length,
    wins: vitoriasEsporte + vitoriasJogos,
    losses: derrotasEsporte + derrotasJogos,
    pending: esportes.filter((item) => item?.status === 'Pendente').length,
    total_staked: totalApostadoEsportes + totalApostadoJogos,
    total_payout: totalPagoEsportes + totalPagoJogos,
    net_profit: resultadosFinanceiros.reduce(
      (total, item) => total + item,
      0,
    ),
  }
}

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
  const siteTexts = useSiteTexts()
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
  const [authSession, setAuthSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authModalMode, setAuthModalMode] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileReady, setProfileReady] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [publicProfileUserId, setPublicProfileUserId] = useState(null)
  const [publicProfileOrigin, setPublicProfileOrigin] = useState('inicio')
  const [creatorMessageUnlocked, setCreatorMessageUnlocked] = useState(
    () => localStorage.getItem(CREATOR_MESSAGE_UNLOCK_KEY) === 'sim',
  )
  const [legacyBalancePrompt, setLegacyBalancePrompt] = useState(false)
  const [historyReady, setHistoryReady] = useState(false)
  const [legacyHistoryPrompt, setLegacyHistoryPrompt] = useState(false)
  const [legacyHistoryLoading, setLegacyHistoryLoading] = useState(false)
  const [historicoEsportesAdmin, setHistoricoEsportesAdmin] = useState([])

  const saldoAtualRef = useRef(saldo)
  const saldoLegadoRef = useRef(saldo)
  const saldoBancoHidratadoRef = useRef(false)
  const historicoLegadoRef = useRef(historico)
  const historicoJogosLegadoRef = useRef(historicoJogos)
  const historyHydratedRef = useRef(false)
  const historySyncTimerRef = useRef(null)
  const publicStatsSyncTimerRef = useRef(null)
  const sportsLegacyAccountRef = useRef([])
  const sportsBetSubmittingRef = useRef(false)
  const videoFalenciaRef = useRef(null)
  const videoAnuncioRef = useRef(null)
  const falenciaInicialVerificadaRef = useRef(false)
  const recompensaAnuncioEntregueRef = useRef(false)

  function chaveHistoricoLocal(base) {
    const userId = authSession?.user?.id
    return userId ? `${base}:${userId}` : base
  }

  function salvarHistoricoNoNavegador(base, dados) {
    localStorage.setItem(chaveHistoricoLocal(base), JSON.stringify(dados))
  }

  function aplicarSnapshotMercados(snapshot) {
    const state = Array.isArray(snapshot) ? snapshot[0] : snapshot
    const markets = Array.isArray(state?.events) ? state.events : []
    const round = Math.min(7, Math.max(1, Number(state?.round) || 1))

    setEventos(markets)
    setRodadaBahrein(round)
    setSelecoes((selecoesAtuais) =>
      selecoesAtuais.filter((selecao) => {
        const mercado = markets.find(
          (item) => String(item.id) === String(selecao.eventoId),
        )

        return mercado && mercado.status !== 'suspenso' && !mercado.resultadoOpcaoId
      }),
    )

    return state
  }

  async function carregarMercadosEsportivosAutoritativos() {
    const { data, error } = await supabase.rpc('get_sports_markets')

    if (error) {
      console.error('Falha ao carregar mercados autoritativos:', error)
      return null
    }

    return aplicarSnapshotMercados(data)
  }

  function mesclarHistoricoEsportivo(apostasAutoritativas) {
    const novas = Array.isArray(apostasAutoritativas) ? apostasAutoritativas : []
    const legado = Array.isArray(sportsLegacyAccountRef.current)
      ? sportsLegacyAccountRef.current.map((item) => ({
          ...item,
          legacy: true,
          authoritative: false,
        }))
      : []

    return [...novas, ...legado]
  }

  async function carregarApostasEsportivasAutoritativas() {
    if (!authSession?.user) {
      setHistorico(mesclarHistoricoEsportivo([]))
      return []
    }

    const { data, error } = await supabase.rpc('get_my_sports_bets')

    if (error) {
      console.error('Falha ao carregar bilhetes esportivos:', error)
      return []
    }

    const apostas = Array.isArray(data) ? data : []
    setHistorico(mesclarHistoricoEsportivo(apostas))
    return apostas
  }

  async function carregarApostasEsportesAdmin() {
    if (!authSession?.user || profile?.role !== 'admin') {
      setHistoricoEsportesAdmin([])
      return []
    }

    const { data, error } = await supabase.rpc('admin_get_sports_bets')

    if (error) {
      console.error('Falha ao carregar bilhetes da banca:', error)
      return []
    }

    const apostas = Array.isArray(data) ? data : []
    setHistoricoEsportesAdmin(apostas)
    return apostas
  }

  function hidratarHistoricoDaConta(data) {
    const sports = Array.isArray(data?.sports_history) ? data.sports_history : []
    const games = Array.isArray(data?.games_history) ? data.games_history : []

    sportsLegacyAccountRef.current = sports
    setHistorico(sports)
    setHistoricoJogos(games)
    historyHydratedRef.current = true
    setHistoryReady(true)
    setLegacyHistoryPrompt(false)

    if (authSession?.user?.id) {
      localStorage.setItem(`taihenbet-historico:${authSession.user.id}`, JSON.stringify(sports))
      localStorage.setItem(`taihenbet-historico-jogos:${authSession.user.id}`, JSON.stringify(games))
      void carregarApostasEsportivasAutoritativas()
    }
  }

  async function resolverHistoricoLegado(importar) {
    if (!authSession?.user || legacyHistoryLoading) return

    setLegacyHistoryLoading(true)
    const { data, error } = await supabase.rpc('resolve_legacy_history', {
      p_import_local: importar,
      p_sports_history: importar ? historicoLegadoRef.current : [],
      p_games_history: importar ? historicoJogosLegadoRef.current : [],
    })
    setLegacyHistoryLoading(false)

    if (error) {
      console.error('Falha ao resolver histórico legado:', error)
      setMensagem({ tipo: 'erro', texto: 'A banca não conseguiu arquivar o histórico antigo. Confira o SQL da Fase 3.6.' })
      return
    }

    const state = Array.isArray(data) ? data[0] : data
    hidratarHistoricoDaConta(state)

    if (importar) {
      localStorage.removeItem('taihenbet-historico')
      localStorage.removeItem('taihenbet-historico-jogos')
      setMensagem({ tipo: 'sucesso', texto: 'Histórico antigo importado. As provas agora sobrevivem ao navegador.' })
    } else {
      setMensagem({ tipo: 'sucesso', texto: 'Ficha nova iniciada. O arquivo antigo ficou fora desta conta.' })
    }
  }

  useEffect(() => {
    function revelarMensagemDoCriador() {
      setCreatorMessageUnlocked(true)
      localStorage.setItem(CREATOR_MESSAGE_UNLOCK_KEY, 'sim')
    }

    window.addEventListener(
      'taihenbet:reveal-creator-message',
      revelarMensagemDoCriador,
    )

    return () => {
      window.removeEventListener(
        'taihenbet:reveal-creator-message',
        revelarMensagemDoCriador,
      )
    }
  }, [])

  useEffect(() => {
    let ativo = true

    const recoveryMarcadoNaUrl = () => {
      const params = new URLSearchParams(window.location.search)
      return (
        params.get('recovery') === '1' ||
        window.location.hash.includes('type=recovery')
      )
    }

    const abrirRecuperacao = () => {
      setAvisoInicialAtivo(false)
      setAvisoConfirmado(true)
      setAuthModalMode('reset')
    }

    // O Supabase pode processar o token de recovery antes de o listener
    // do React terminar de montar. A marca na URL funciona como fallback
    // determinístico e evita cair simplesmente logado na Home/Painel.
    if (recoveryMarcadoNaUrl()) {
      abrirRecuperacao()
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!ativo) {
          return
        }

        setAuthSession(data.session ?? null)
        setAuthReady(true)

        if (recoveryMarcadoNaUrl()) {
          abrirRecuperacao()
        }
      })
      .catch(() => {
        if (ativo) {
          setAuthReady(true)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!ativo) {
        return
      }

      setAuthSession(session)
      setAuthReady(true)

      if (event === 'PASSWORD_RECOVERY' || recoveryMarcadoNaUrl()) {
        abrirRecuperacao()
      }
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let ativo = true

    saldoBancoHidratadoRef.current = false

    if (!authSession?.user) {
      setProfile(null)
      setProfileReady(true)
      setLegacyBalancePrompt(false)
      return undefined
    }

    setProfileReady(false)

    supabase
      .from('profiles')
      .select('*')
      .eq('id', authSession.user.id)
      .single()
      .then(({ data, error }) => {
        if (!ativo) return

        if (error) {
          console.error('Falha ao carregar perfil:', error)
          setProfileReady(true)
          setMensagem({
            tipo: 'erro',
            texto: 'A conta entrou, mas o banco de perfis ainda não respondeu. Confira se o SQL da Fase 3.4 foi executado no Supabase.',
          })
          return
        }

        const saldoDoBanco = Math.max(0, Number(data.balance) || 0)

        setProfile(data)
        saldoAtualRef.current = saldoDoBanco
        setSaldo(saldoDoBanco)
        saldoBancoHidratadoRef.current = true
        setProfileReady(true)
        setLegacyBalancePrompt(!data.legacy_balance_imported)
      })

    return () => {
      ativo = false
    }
  }, [authSession?.user?.id])

  useEffect(() => {
    const userId = authSession?.user?.id

    if (!userId) {
      return undefined
    }

    let ativo = true

    const aplicarAtualizacaoRealtime = (perfilAtualizado) => {
      if (!ativo || !perfilAtualizado) return

      aplicarPerfilDaCarteira(perfilAtualizado)
      saldoBancoHidratadoRef.current = true
      setLegacyBalancePrompt(!perfilAtualizado.legacy_balance_imported)
    }

    const canal = supabase
      .channel(`taihenbet-profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          aplicarAtualizacaoRealtime(payload.new)
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime do saldo indisponível; a banca tentará sincronizar ao voltar para a aba.')
        }
      })

    const sincronizarPerfil = async () => {
      if (!ativo || document.visibilityState === 'hidden') return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!ativo) return

      if (error) {
        console.warn('Falha no fallback de sincronização do saldo:', error)
        return
      }

      aplicarAtualizacaoRealtime(data)
    }

    const sincronizarAoVoltar = () => {
      if (document.visibilityState === 'visible') {
        void sincronizarPerfil()
      }
    }

    window.addEventListener('focus', sincronizarAoVoltar)
    document.addEventListener('visibilitychange', sincronizarAoVoltar)

    return () => {
      ativo = false
      window.removeEventListener('focus', sincronizarAoVoltar)
      document.removeEventListener('visibilitychange', sincronizarAoVoltar)
      void supabase.removeChannel(canal)
    }
  }, [authSession?.user?.id])

  useEffect(() => {
    let ativo = true
    historyHydratedRef.current = false
    setLegacyHistoryPrompt(false)

    if (!authSession?.user) {
      setHistorico([])
      setHistoricoJogos([])
      setHistoryReady(true)
      return undefined
    }

    setHistoryReady(false)

    supabase
      .from('user_history_state')
      .select('*')
      .eq('user_id', authSession.user.id)
      .single()
      .then(async ({ data, error }) => {
        if (!ativo) return

        if (error) {
          console.error('Falha ao carregar histórico da conta:', error)
          setHistoryReady(true)
          setMensagem({
            tipo: 'erro',
            texto: 'O perfil entrou, mas o arquivo de histórico ainda não existe. Rode o SQL da Fase 3.6 no Supabase.',
          })
          return
        }

        if (!data.legacy_history_imported) {
          const hasLegacy = historicoLegadoRef.current.length > 0 || historicoJogosLegadoRef.current.length > 0

          if (hasLegacy) {
            setLegacyHistoryPrompt(true)
            return
          }

          const { data: resolved, error: resolveError } = await supabase.rpc('resolve_legacy_history', {
            p_import_local: false,
            p_sports_history: [],
            p_games_history: [],
          })

          if (!ativo) return
          if (resolveError) {
            console.error('Falha ao inicializar histórico:', resolveError)
            setHistoryReady(true)
            return
          }

          hidratarHistoricoDaConta(Array.isArray(resolved) ? resolved[0] : resolved)
          return
        }

        hidratarHistoricoDaConta(data)
      })

    return () => { ativo = false }
  }, [authSession?.user?.id])

  useEffect(() => {
    void carregarMercadosEsportivosAutoritativos()
  }, [])

  useEffect(() => {
    if (profile?.role === 'admin' && authSession?.user?.id) {
      void carregarApostasEsportesAdmin()
    } else {
      setHistoricoEsportesAdmin([])
    }
  }, [profile?.role, authSession?.user?.id])

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
    if (!historyReady) return
    salvarHistoricoNoNavegador('taihenbet-historico-jogos', historicoJogos)
  }, [historicoJogos, historyReady, authSession?.user?.id])

  useEffect(() => {
    if (!historyReady) return
    salvarHistoricoNoNavegador('taihenbet-historico', historico)
  }, [historico, historyReady, authSession?.user?.id])

  useEffect(() => {
    if (publicStatsSyncTimerRef.current) {
      window.clearTimeout(publicStatsSyncTimerRef.current)
      publicStatsSyncTimerRef.current = null
    }

    if (!authSession?.user || !historyReady || legacyHistoryPrompt) {
      return undefined
    }

    const snapshot = calcularSnapshotPerfilPublico(historico, historicoJogos)

    publicStatsSyncTimerRef.current = window.setTimeout(async () => {
      const { error } = await supabase.rpc('sync_my_public_stats', {
        p_stats: snapshot,
      })

      if (error) {
        console.error('Falha ao sincronizar estatísticas públicas:', error)
      }
    }, 700)

    return () => {
      if (publicStatsSyncTimerRef.current) {
        window.clearTimeout(publicStatsSyncTimerRef.current)
        publicStatsSyncTimerRef.current = null
      }
    }
  }, [
    historico,
    historicoJogos,
    historyReady,
    legacyHistoryPrompt,
    authSession?.user?.id,
  ])

  useEffect(() => {
    if (historySyncTimerRef.current) {
      window.clearTimeout(historySyncTimerRef.current)
      historySyncTimerRef.current = null
    }

    if (!authSession?.user || !historyReady || !historyHydratedRef.current || legacyHistoryPrompt) {
      return undefined
    }

    historySyncTimerRef.current = window.setTimeout(async () => {
      const { error } = await supabase.rpc('sync_my_history', {
        p_sports_history: [],
        p_games_history: historicoJogos,
      })

      if (error) console.error('Falha ao sincronizar histórico:', error)
    }, 550)

    return () => {
      if (historySyncTimerRef.current) {
        window.clearTimeout(historySyncTimerRef.current)
        historySyncTimerRef.current = null
      }
    }
  }, [historico, historicoJogos, historyReady, authSession?.user?.id, legacyHistoryPrompt])

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

  async function concluirAnuncioRecompensado() {
    if (
      !anuncioTerminou ||
      recompensaAnuncioEntregueRef.current
    ) {
      return
    }

    recompensaAnuncioEntregueRef.current = true
    const perfilAtualizado = await executarRpcCarteira(
      'claim_ad_reward',
      { p_external_id: crypto.randomUUID() },
      'A banca recusou a recompensa do anúncio. Aguarde um pouco antes de tentar novamente.',
    )

    if (!perfilAtualizado) {
      recompensaAnuncioEntregueRef.current = false
      return
    }

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

  function resolverSaldoLegado(perfilAtualizado) {
    setLegacyBalancePrompt(false)

    if (!perfilAtualizado) return

    const saldoDoBanco = Math.max(0, Number(perfilAtualizado.balance) || 0)
    setProfile(perfilAtualizado)
    saldoAtualRef.current = saldoDoBanco
    setSaldo(saldoDoBanco)
    saldoBancoHidratadoRef.current = true
  }

  function salvarPerfilLocal(perfilAtualizado) {
    if (!perfilAtualizado) return
    setProfile(perfilAtualizado)
  }

  function aplicarPerfilDaCarteira(perfilAtualizado) {
    const perfilFinal = Array.isArray(perfilAtualizado)
      ? perfilAtualizado[0]
      : perfilAtualizado

    if (!perfilFinal) return null

    const perfilComProgressao = {
      ...perfilFinal,
      equipped_title_key:
        perfilFinal.equipped_title_key ??
        profile?.equipped_title_key ??
        null,
    }
    const novoSaldo = Math.max(
      0,
      Number(perfilComProgressao.balance) || 0,
    )
    setProfile(perfilComProgressao)
    saldoAtualRef.current = novoSaldo
    setSaldo(novoSaldo)
    return perfilComProgressao
  }

  async function executarRpcCarteira(nome, argumentos, mensagemErro) {
    if (!authSession?.user) {
      setMensagem({
        tipo: 'erro',
        texto: 'Entre na sua conta para movimentar TaiCoins.',
      })
      return null
    }

    const { data, error } = await supabase.rpc(nome, argumentos)

    if (error) {
      console.error(`Falha na carteira (${nome}):`, error)
      setMensagem({
        tipo: 'erro',
        texto: mensagemErro || 'A banca recusou a movimentação de TaiCoins.',
      })
      return null
    }

    return aplicarPerfilDaCarteira(data)
  }

  function abrirPerfilPublico(userId, origem = pagina) {
    if (!userId) return

    setPublicProfileUserId(userId)
    setPublicProfileOrigin(
      origem && origem !== 'perfil-publico' ? origem : 'inicio',
    )
    setPagina('perfil-publico')
    setMensagem(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function voltarDoPerfilPublico() {
    navegarPara(publicProfileOrigin || 'inicio')
  }

  function navegarPara(novaPagina) {
    const podeAcessarPainel = profile?.role === 'admin'

    if (novaPagina === 'admin' && !podeAcessarPainel) {
      setMensagem({
        tipo: 'erro',
        texto: 'Acesso negado. A Ditadora Suprema não reconheceu suas credenciais administrativas.',
      })
      setPagina('inicio')
      return
    }

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

  async function enviarNotificacaoPessoal({
    tipo,
    titulo,
    texto,
    paginaDestino = null,
    entidadeId = null,
    metadata = {},
  }) {
    if (!authSession?.user) return

    const { error } = await supabase.rpc('push_my_notification', {
      p_type: tipo,
      p_title: titulo,
      p_message: texto,
      p_target_page: paginaDestino,
      p_target_entity_id: entidadeId,
      p_metadata: metadata,
    })

    if (error) {
      console.warn('A Central de Notificações não conseguiu registrar o evento:', error)
    }
  }

  async function confirmarAposta() {
    if (sportsBetSubmittingRef.current) {
      return
    }

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
      await carregarMercadosEsportivosAutoritativos()
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

    if (!authSession?.user) {
      setMensagem({
        tipo: 'erro',
        texto: 'Entre na sua conta para registrar um bilhete.',
      })
      return
    }

    sportsBetSubmittingRef.current = true
    const requestId = crypto.randomUUID()

    try {
      const { data, error } = await supabase.rpc('place_sports_bet', {
        p_stake: valorNumerico,
        p_selections: selecoes.map((selecao) => ({
          marketId: String(selecao.eventoId),
          optionId: String(selecao.opcaoId),
        })),
        p_request_id: requestId,
      })

      if (error) {
        console.error('Falha ao registrar bilhete autoritativo:', error)
        setMensagem({
          tipo: 'erro',
          texto: error.message?.includes('Combined odd')
            ? 'A combinada ficou amaldiçoada demais para a banca. Reduza o número de seleções.'
            : 'A banca recusou o bilhete. As odds ou o saldo podem ter mudado; atualize e tente novamente.',
        })
        await carregarMercadosEsportivosAutoritativos()
        return
      }

      const result = Array.isArray(data) ? data[0] : data
      const perfilAtualizado = aplicarPerfilDaCarteira(result?.profile)

      await carregarApostasEsportivasAutoritativas()
      if (profile?.role === 'admin') {
        await carregarApostasEsportesAdmin()
      }

      setSelecoes([])
      setValorAposta('')

      if (Number(perfilAtualizado?.balance) <= 0) {
        abrirFalencia()
      }

      setMensagem({
        tipo: 'sucesso',
        texto: `Bilhete selado no servidor! ${formatarMoedas(
          valorNumerico,
        )} TaiCoins foram sacrificadas e as odds ficaram travadas no banco.`,
      })
    } finally {
      sportsBetSubmittingRef.current = false
    }
  }

  async function publicarRodadaBahrein(numeroRodada) {
    const rodada = Math.min(
      7,
      Math.max(1, Math.floor(Number(numeroRodada) || 1)),
    )

    const possuiPartidaPendente = eventos.some(
      (evento) =>
        evento.tipo === 'futebol-bahrein' &&
        !evento.resultadoOpcaoId,
    )

    if (possuiPartidaPendente && rodada !== rodadaBahrein) {
      const confirmou = window.confirm(
        `A banca vai tentar publicar a rodada ${rodada}. Se existirem bilhetes pendentes da rodada atual, o servidor recusará a troca até os resultados serem resolvidos. Continuar?`,
      )

      if (!confirmou) return
    }

    const { data, error } = await supabase.rpc(
      'admin_publish_bahrain_round',
      { p_round: rodada },
    )

    if (error) {
      console.error('Falha ao publicar rodada:', error)
      setMensagem({
        tipo: 'erro',
        texto: error.message?.includes('Resolve the current round')
          ? 'Existem bilhetes pendentes na rodada atual. Resolva as partidas antes de trocar a rodada.'
          : 'A banca não conseguiu publicar a rodada no servidor.',
      })
      return
    }

    aplicarSnapshotMercados(data)
    setSessaoAoVivo((sessaoAtual) => ({
      ...sessaoAtual,
      mercadoIds: [],
    }))

    setMensagem({
      tipo: 'sucesso',
      texto: `Rodada ${rodada} publicada pelo servidor com as odds oficiais da Liga do Bahrein.`,
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function salvarMercado(mercado) {
    const { data, error } = await supabase.rpc(
      'admin_save_sports_market',
      { p_market: mercado },
    )

    if (error) {
      console.error('Falha ao salvar mercado:', error)
      setMensagem({
        tipo: 'erro',
        texto: error.message?.includes('pending')
          ? 'Esse mercado possui bilhetes pendentes e não pode ter as odds reescritas agora.'
          : 'O servidor recusou a edição desse mercado.',
      })
      return
    }

    aplicarSnapshotMercados(data)
    setMensagem({
      tipo: 'sucesso',
      texto: mercado.id
        ? 'Mercado salvo no servidor. Odds futuras atualizadas.'
        : 'Novo mercado autoritativo publicado pela banca.',
    })
  }

  async function alternarStatusMercado(mercadoId) {
    const { data, error } = await supabase.rpc(
      'admin_toggle_sports_market',
      { p_market_id: String(mercadoId) },
    )

    if (error) {
      console.error('Falha ao alternar mercado:', error)
      setMensagem({
        tipo: 'erro',
        texto: 'O servidor recusou a mudança de status desse mercado.',
      })
      return
    }

    aplicarSnapshotMercados(data)
    setSelecoes((selecoesAtuais) =>
      selecoesAtuais.filter((selecao) => {
        const evento = (Array.isArray(data?.events) ? data.events : []).find(
          (item) => String(item.id) === String(selecao.eventoId),
        )
        return evento && evento.status !== 'suspenso' && !evento.resultadoOpcaoId
      }),
    )

    setMensagem({
      tipo: 'sucesso',
      texto: 'Status do mercado atualizado no servidor.',
    })
  }

  async function excluirMercado(mercadoId) {
    const confirmou = window.confirm(
      'Arquivar este mercado? Bilhetes pendentes impedem a operação.',
    )

    if (!confirmou) return

    const { data, error } = await supabase.rpc(
      'admin_archive_sports_market',
      { p_market_id: String(mercadoId) },
    )

    if (error) {
      console.error('Falha ao arquivar mercado:', error)
      setMensagem({
        tipo: 'erro',
        texto: error.message?.includes('pending')
          ? 'Esse mercado ainda participa de bilhetes pendentes e não pode ser arquivado.'
          : 'A banca não conseguiu arquivar o mercado.',
      })
      return
    }

    aplicarSnapshotMercados(data)
    setMensagem({
      tipo: 'sucesso',
      texto: 'Mercado arquivado no servidor. O histórico dos bilhetes foi preservado.',
    })
  }

  async function limparMercadosEncerrados() {
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
      `Arquivar ${quantidade} mercado(s) encerrado(s)? Os comprovantes dos bilhetes continuarão no banco.`,
    )

    if (!confirmou) return

    const { data, error } = await supabase.rpc(
      'admin_clear_settled_sports_markets',
    )

    if (error) {
      console.error('Falha ao limpar mercados:', error)
      setMensagem({
        tipo: 'erro',
        texto: 'A banca não conseguiu arquivar os mercados encerrados.',
      })
      return
    }

    aplicarSnapshotMercados(data)
    setMensagem({
      tipo: 'sucesso',
      texto: `${quantidade} mercado(s) encerrado(s) foram arquivados sem apagar os bilhetes.`,
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

  async function resolverMercado(mercadoId, opcaoVencedoraId) {
    const mercado = eventos.find(
      (evento) => String(evento.id) === String(mercadoId),
    )

    if (!mercado) {
      setMensagem({ tipo: 'erro', texto: 'Mercado não encontrado.' })
      return
    }

    const opcaoVencedora = mercado.opcoes.find(
      (opcao) => String(opcao.id) === String(opcaoVencedoraId),
    )

    if (!opcaoVencedora) {
      setMensagem({
        tipo: 'erro',
        texto: 'A opção vencedora não foi encontrada.',
      })
      return
    }

    const { data, error } = await supabase.rpc(
      'admin_resolve_sports_market',
      {
        p_market_id: String(mercadoId),
        p_winner_option_id: String(opcaoVencedoraId),
      },
    )

    if (error) {
      console.error('Falha ao resolver mercado:', error)
      setMensagem({
        tipo: 'erro',
        texto: 'O servidor recusou a resolução desse mercado.',
      })
      return
    }

    const result = Array.isArray(data) ? data[0] : data
    if (result?.markets) {
      aplicarSnapshotMercados(result.markets)
    } else {
      await carregarMercadosEsportivosAutoritativos()
    }

    await carregarApostasEsportivasAutoritativas()
    await carregarApostasEsportesAdmin()

    setSelecoes((selecoesAtuais) =>
      selecoesAtuais.filter(
        (selecao) => String(selecao.eventoId) !== String(mercadoId),
      ),
    )

    const ganhou = Number(result?.wonBets) || 0
    const perdeu = Number(result?.lostBets) || 0
    const payout = Number(result?.payoutTotal) || 0

    let texto = `Resultado oficial: "${result?.winnerName || opcaoVencedora.nome}".`

    if (ganhou > 0) {
      texto += ` ${ganhou} bilhete(s) receberam ${formatarMoedas(payout)} TaiCoins pelo servidor.`
    }

    if (perdeu > 0) {
      texto += ` ${perdeu} bilhete(s) foram destruídos pela banca.`
    }

    if (ganhou === 0 && perdeu === 0) {
      texto += ' Nenhum bilhete completo foi liquidado com este resultado.'
    }

    setMensagem({ tipo: 'sucesso', texto })
  }

  async function resolverAposta(apostaId, resultado) {
    const apostaEncontrada = historicoEsportesAdmin.find(
      (aposta) => String(aposta.id) === String(apostaId),
    )

    if (!apostaEncontrada || apostaEncontrada.status !== 'Pendente') {
      setMensagem({
        tipo: 'erro',
        texto: 'Esse bilhete já foi resolvido ou não pertence ao arquivo autoritativo.',
      })
      return
    }

    const { data, error } = await supabase.rpc(
      'admin_resolve_sports_bet',
      {
        p_bet_id: apostaId,
        p_result: resultado,
      },
    )

    if (error) {
      console.error('Falha ao resolver bilhete manualmente:', error)
      setMensagem({
        tipo: 'erro',
        texto: 'A banca não conseguiu aplicar a resolução manual no servidor.',
      })
      return
    }

    await carregarApostasEsportesAdmin()
    await carregarApostasEsportivasAutoritativas()

    const bet = Array.isArray(data) ? data[0] : data
    const venceu = bet?.status === 'Ganhou'

    setMensagem({
      tipo: venceu ? 'sucesso' : 'erro',
      texto: venceu
        ? `Bilhete liquidado manualmente. ${formatarMoedas(bet?.retornoPago || bet?.retornoEstimado)} TaiCoins foram pagos pelo servidor.`
        : `Bilhete marcado como perdido no servidor. A stake original permanece no ledger.`,
    })
  }

  async function iniciarDerbyAutoritativo(valor, corredoraId) {
    const valorNumerico = Number(valor)

    if (!Number.isFinite(valorNumerico) || valorNumerico < 10) {
      setMensagem({
        tipo: 'erro',
        texto: 'A aposta minima do Derby e de 10 TaiCoins.',
      })
      return null
    }

    if (!authSession?.user) {
      setMensagem({
        tipo: 'erro',
        texto: 'Entre na sua conta para registrar um bilhete do Derby.',
      })
      return null
    }

    const { data, error } = await supabase.rpc('start_derby', {
      p_stake: valorNumerico,
      p_selected_runner: corredoraId,
    })

    if (error) {
      console.error('Falha ao iniciar Derby autoritativo:', error)
      setMensagem({
        tipo: 'erro',
        texto:
          error.message?.includes('Insufficient TaiCoins')
            ? 'Voce nao possui TaiCoins suficientes para esse bilhete.'
            : 'A banca nao conseguiu selar o resultado do Derby no servidor.',
      })
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    if (!estado?.sessionId || !estado?.profile) {
      console.error('Resposta invalida de start_derby:', estado)
      setMensagem({
        tipo: 'erro',
        texto: 'O servidor devolveu uma corrida invalida do Derby.',
      })
      return null
    }

    aplicarPerfilDaCarteira(estado.profile)
    return estado
  }

  async function consultarDerbyAutoritativo(sessionId = null) {
    if (!authSession?.user) {
      return null
    }

    const { data, error } = await supabase.rpc('get_derby', {
      p_session_id: sessionId || null,
    })

    if (error) {
      console.error('Falha ao consultar Derby autoritativo:', error)
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    if (estado?.encerrada && estado?.profile) {
      aplicarPerfilDaCarteira(estado.profile)
    }

    return estado || null
  }

  async function finalizarCorridaDerbyAutoritativa(resultado) {
    if (!resultado?.roundId || !resultado?.encerrada) {
      return
    }

    const ganhou = Boolean(resultado.ganhou)
    const premio = Math.max(0, Number(resultado.premio) || 0)
    const valor = Math.max(0, Number(resultado.entrada) || 0)
    const odd = Math.max(1, Number(resultado.selectedOdd || resultado.odd) || 1)
    const agora = Number.isFinite(Date.parse(resultado.settledAt))
      ? Date.parse(resultado.settledAt)
      : Date.now()
    const idHistorico = `derby-${resultado.roundId}`
    const nomeEscolhida =
      resultado.selectedRunnerName ||
      resultado.corredoraEscolhida?.nome ||
      resultado.selectedRunner ||
      'Corredora desconhecida'
    const nomeVencedora =
      resultado.winnerRunnerName ||
      resultado.corredoraVencedora?.nome ||
      resultado.winnerRunner ||
      'Corredora desconhecida'

    const novaAposta = {
      id: idHistorico,
      tipo: 'derby',
      data: new Date(agora).toLocaleString('pt-BR'),
      criadaEm: agora,
      resolvidaEm: new Date(agora).toLocaleString('pt-BR'),
      resolucao: 'Taihen Derby',
      selecoes: [
        {
          eventoId: `taihen-derby-${resultado.roundId}`,
          eventoTitulo: 'Taihen Derby',
          opcaoId: resultado.selectedRunner,
          opcaoNome: nomeEscolhida,
          odd,
          statusSelecao: ganhou ? 'Ganhou' : 'Perdeu',
        },
      ],
      vencedoraDerby: nomeVencedora,
      valor,
      oddTotal: odd,
      retornoEstimado: valor * odd,
      retornoPago: premio,
      status: ganhou ? 'Ganhou' : 'Perdeu',
      authoritative: true,
      roundId: resultado.roundId,
    }

    setHistorico((historicoAtual) => {
      if (historicoAtual.some((item) => item.id === idHistorico)) {
        return historicoAtual
      }

      const novoHistorico = [novaAposta, ...historicoAtual]
      salvarHistoricoNoNavegador('taihenbet-historico', novoHistorico)
      return novoHistorico
    })

    if (!ganhou && saldoAtualRef.current <= 0) {
      abrirFalencia()
    }

    setMensagem({
      tipo: ganhou ? 'sucesso' : 'erro',
      texto: ganhou
        ? `${nomeVencedora} venceu! +${formatarMoedas(premio)} TaiCoins foram liquidadas pelo servidor.`
        : `${nomeVencedora} venceu o Derby. Seu bilhete em ${nomeEscolhida} foi derrotado.`,
    })
  }

  async function carregarTaiMandiocaAutoritativa() {
    if (!authSession?.user) {
      return null
    }

    const { data, error } = await supabase.rpc(
      'get_active_taimandioca',
    )

    if (error) {
      console.error('Falha ao restaurar TaiMandioca autoritativa:', error)
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    if (estado?.profile) {
      aplicarPerfilDaCarteira(estado.profile)
    }

    return estado || null
  }

  async function iniciarTaiMandiocaAutoritativa(valor, perigos) {
    const valorNumerico = Number(valor)
    const perigosNumericos = Number(perigos)

    if (!Number.isFinite(valorNumerico) || valorNumerico < 10) {
      setMensagem({
        tipo: 'erro',
        texto: 'A entrada mínima da TaiMandioca é de 10 TaiCoins.',
      })
      return null
    }

    if (![8, 11, 14, 17].includes(perigosNumericos)) {
      setMensagem({
        tipo: 'erro',
        texto: 'A banca recusou essa configuração de plantação.',
      })
      return null
    }

    if (!authSession?.user) {
      setMensagem({
        tipo: 'erro',
        texto: 'Entre na sua conta para iniciar uma colheita.',
      })
      return null
    }

    const { data, error } = await supabase.rpc(
      'start_taimandioca',
      {
        p_stake: valorNumerico,
        p_hazards: perigosNumericos,
      },
    )

    if (error) {
      console.error('Falha ao iniciar TaiMandioca autoritativa:', error)
      setMensagem({
        tipo: 'erro',
        texto:
          error.message?.includes('Insufficient TaiCoins')
            ? 'Você não possui TaiCoins suficientes para entrar nessa roça.'
            : 'A banca não conseguiu selar a plantação no servidor.',
      })
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    if (!estado?.sessionId || !estado?.profile) {
      console.error('Resposta inválida de start_taimandioca:', estado)
      setMensagem({
        tipo: 'erro',
        texto: 'O servidor devolveu uma plantação inválida.',
      })
      return null
    }

    aplicarPerfilDaCarteira(estado.profile)
    return estado
  }

  async function revelarTaiMandiocaAutoritativa(sessionId, indice) {
    if (!authSession?.user || !sessionId) {
      return null
    }

    const { data, error } = await supabase.rpc(
      'reveal_taimandioca',
      {
        p_session_id: sessionId,
        p_index: Number(indice),
      },
    )

    if (error) {
      console.error('Falha ao revelar TaiMandioca autoritativa:', error)
      setMensagem({
        tipo: 'erro',
        texto: 'A banca não conseguiu consultar essa mandioca no servidor.',
      })
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    if (!estado?.sessionId) {
      console.error('Resposta inválida de reveal_taimandioca:', estado)
      return null
    }

    if (estado.profile) {
      aplicarPerfilDaCarteira(estado.profile)
    }

    return estado
  }

  async function recolherTaiMandiocaAutoritativa(sessionId) {
    if (!authSession?.user || !sessionId) {
      return null
    }

    const { data, error } = await supabase.rpc(
      'cashout_taimandioca',
      { p_session_id: sessionId },
    )

    if (error) {
      console.error('Falha no cashout autoritativo da TaiMandioca:', error)
      setMensagem({
        tipo: 'erro',
        texto: 'A banca não conseguiu liquidar sua colheita.',
      })
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    if (!estado?.sessionId || !estado?.profile) {
      console.error('Resposta inválida de cashout_taimandioca:', estado)
      return null
    }

    aplicarPerfilDaCarteira(estado.profile)
    return estado
  }

  async function consultarCrashRegimeAutoritativo(sessionId = null) {
    if (!authSession?.user) {
      return null
    }

    const { data, error } = await supabase.rpc(
      'get_crash_regime',
      { p_session_id: sessionId || null },
    )

    if (error) {
      console.error('Falha ao consultar Crash autoritativo:', error)
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    // Durante a operação o saldo já é o pós-stake carregado no início.
    // Ao encerrar, reaplicamos o perfil retornado pelo servidor.
    if (estado?.status !== 'active' && estado?.profile) {
      aplicarPerfilDaCarteira(estado.profile)
    }

    return estado || null
  }

  async function iniciarCrashRegimeAutoritativo(valor) {
    const valorNumerico = Number(valor)

    if (!Number.isFinite(valorNumerico) || valorNumerico < 10) {
      setMensagem({
        tipo: 'erro',
        texto: 'A entrada mínima do Crash do Regime é de 10 TaiCoins.',
      })
      return null
    }

    if (!authSession?.user) {
      setMensagem({
        tipo: 'erro',
        texto: 'Entre na sua conta para financiar uma operação do regime.',
      })
      return null
    }

    const { data, error } = await supabase.rpc(
      'start_crash_regime',
      { p_stake: valorNumerico },
    )

    if (error) {
      console.error('Falha ao iniciar Crash autoritativo:', error)
      setMensagem({
        tipo: 'erro',
        texto:
          error.message?.includes('Insufficient TaiCoins')
            ? 'Você não possui TaiCoins suficientes para essa operação.'
            : error.message?.includes('Crash rate limit')
              ? 'A Comandante bloqueou operações rápidas demais. Aguarde 1 segundo e tente de novo.'
              : 'A banca não conseguiu selar o ponto de confisco no servidor.',
      })
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    if (!estado?.sessionId || !estado?.profile) {
      console.error('Resposta inválida de start_crash_regime:', estado)
      setMensagem({
        tipo: 'erro',
        texto: 'O servidor devolveu uma operação inválida do regime.',
      })
      return null
    }

    aplicarPerfilDaCarteira(estado.profile)
    return estado
  }

  async function retirarCrashRegimeAutoritativo(sessionId) {
    if (!authSession?.user || !sessionId) {
      return null
    }

    const { data, error } = await supabase.rpc(
      'cashout_crash_regime',
      { p_session_id: sessionId },
    )

    if (error) {
      console.error('Falha no cashout autoritativo do Crash:', error)
      setMensagem({
        tipo: 'erro',
        texto:
          error.message?.includes('Crash cashout locked')
            ? 'A retirada do Crash só é liberada a partir de 1.10x.'
            : 'O fiscal não conseguiu validar sua retirada no servidor.',
      })
      return null
    }

    const estado = Array.isArray(data) ? data[0] : data

    if (!estado?.sessionId || !estado?.profile) {
      console.error('Resposta inválida de cashout_crash_regime:', estado)
      return null
    }

    aplicarPerfilDaCarteira(estado.profile)
    return estado
  }

  async function jogarTaigrinhoAutoritativo(valor) {
    const valorNumerico = Number(valor)

    if (!Number.isFinite(valorNumerico) || valorNumerico < 10) {
      setMensagem({
        tipo: 'erro',
        texto: 'A entrada mínima do Taigrinho é de 10 TaiCoins.',
      })
      return null
    }

    if (!authSession?.user) {
      setMensagem({
        tipo: 'erro',
        texto: 'Entre na sua conta para girar o Taigrinho.',
      })
      return null
    }

    const { data, error } = await supabase.rpc(
      'play_taigrinho',
      { p_stake: valorNumerico },
    )

    if (error) {
      console.error('Falha no Taigrinho autoritativo:', error)
      setMensagem({
        tipo: 'erro',
        texto:
          error.message?.includes('Insufficient TaiCoins')
            ? 'Você não possui TaiCoins suficientes para esse giro.'
            : 'A banca não conseguiu selar o giro no servidor.',
      })
      return null
    }

    const rodada = Array.isArray(data) ? data[0] : data

    if (
      !rodada?.roundId ||
      !Array.isArray(rodada.grade) ||
      !rodada.profile
    ) {
      console.error('Resposta inválida de play_taigrinho:', rodada)
      setMensagem({
        tipo: 'erro',
        texto: 'O servidor devolveu uma rodada inválida do Taigrinho.',
      })
      return null
    }

    // O banco já liquidou a rodada inteira atomicamente, mas durante a
    // animação mostramos apenas o saldo após a entrada para não revelar
    // visualmente um prêmio antes de o último rolo parar.
    const saldoDepoisDaEntrada = Math.max(
      0,
      Number(rodada.balanceAfterStake) || 0,
    )

    setProfile((perfilAtual) =>
      perfilAtual
        ? { ...perfilAtual, balance: saldoDepoisDaEntrada }
        : perfilAtual,
    )
    saldoAtualRef.current = saldoDepoisDaEntrada
    setSaldo(saldoDepoisDaEntrada)

    return rodada
  }

  async function finalizarJogo(resultado) {
    const premio = Math.max(
      0,
      Number(resultado.premio) || 0,
    )
    const walletSettled = Boolean(resultado.walletSettled)
    const walletProfile = resultado.walletProfile || null

    if (walletSettled) {
      if (!walletProfile) {
        setMensagem({
          tipo: 'erro',
          texto: 'A rodada foi liquidada, mas a banca perdeu o comprovante do saldo.',
        })
        return
      }

      aplicarPerfilDaCarteira(walletProfile)
    } else if (premio > 0) {
      // Desde a Fase 3.9, todo prêmio dos Jogos da Entidade precisa nascer
      // da RPC autoritativa do próprio jogo. Nunca reabrimos uma ponte
      // genérica de crédito baseada em valores calculados no navegador.
      console.error(
        'Payout não autoritativo recusado pela banca:',
        resultado,
      )
      setMensagem({
        tipo: 'erro',
        texto:
          'A banca recusou um prêmio não autoritativo. Atualize a página e tente a rodada novamente.',
      })
      return
    }

    const agoraRegistro = Date.now()
    const {
      walletProfile: _walletProfile,
      walletSettled: _walletSettled,
      ...resultadoPersistivel
    } = resultado

    const novoRegistro = {
      id: crypto.randomUUID(),
      data: new Date(agoraRegistro).toLocaleString('pt-BR'),
      criadaEm: agoraRegistro,
      ...resultadoPersistivel,
      premio,
      lucro:
        Number(resultado.lucro) ||
        premio - Number(resultado.entrada || 0),
    }

    setHistoricoJogos((historicoAtual) => [
      novoRegistro,
      ...historicoAtual,
    ])

    void enviarNotificacaoPessoal({
      tipo: 'game_result',
      titulo:
        novoRegistro.status === 'Ganhou'
          ? `${novoRegistro.jogo || 'Jogo'} pagou!`
          : `${novoRegistro.jogo || 'Jogo'} cobrou a taxa de sofrimento`,
      texto:
        novoRegistro.status === 'Ganhou'
          ? `Resultado liquidado: +${formatarMoedas(Math.max(0, Number(novoRegistro.lucro) || 0))} TaiCoins de lucro líquido.`
          : `Resultado liquidado: ${formatarMoedas(Number(novoRegistro.lucro) || 0)} TaiCoins no currículo financeiro.`,
      paginaDestino: 'historico',
      entidadeId: String(novoRegistro.id),
      metadata: {
        jogo: novoRegistro.jogo || null,
        status: novoRegistro.status || null,
        premio,
        lucro: Number(novoRegistro.lucro) || 0,
      },
    })

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

  async function receberBonusJogo() {
    const hoje = new Date().toISOString().slice(0, 10)
    const perfilAtualizado = await executarRpcCarteira(
      'claim_daily_bonus',
      { p_claim_date: hoje },
      'A bênção diária já foi recebida hoje ou a banca recusou o pedido.',
    )

    if (!perfilAtualizado) return false

    setMensagem({
      tipo: 'sucesso',
      texto: 'Bênção diária recebida: +250 TaiCoins.',
    })

    void enviarNotificacaoPessoal({
      tipo: 'bonus',
      titulo: 'A Entidade foi generosa',
      texto: 'Bênção diária recebida: +250 TaiCoins foram creditadas na sua carteira.',
      paginaDestino: 'jogos',
      metadata: { amount: 250 },
    })

    return true
  }

  function limparHistorico() {
    const confirmou = window.confirm(
      'Deseja apagar permanentemente todo o histórico de apostas?',
    )

    if (!confirmou) {
      return
    }

    setHistorico([])
    localStorage.removeItem(chaveHistoricoLocal('taihenbet-historico'))

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

  const podeAcessarPainel = profile?.role === 'admin'

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

      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
        />
      )}

      {profileModalOpen && authSession?.user && profile && (
        <ProfileModal
          session={authSession}
          profile={profile}
          saldo={saldo}
          historico={historico}
          historicoJogos={historicoJogos}
          onSaved={salvarPerfilLocal}
          onClose={() => setProfileModalOpen(false)}
        />
      )}

      {legacyBalancePrompt && authSession?.user && profile && (
        <LegacyBalanceModal
          onResolved={resolverSaldoLegado}
        />
      )}

      {legacyHistoryPrompt && authSession?.user && (
        <LegacyHistoryModal
          sportsCount={historicoLegadoRef.current.length}
          gamesCount={historicoJogosLegadoRef.current.length}
          loading={legacyHistoryLoading}
          onImport={() => resolverHistoricoLegado(true)}
          onStartFresh={() => resolverHistoricoLegado(false)}
        />
      )}

      <NeytaiAssistant
        enabled={
          !avisoInicialAtivo &&
          !anuncioAtivo &&
          !falenciaAtiva
        }
        pagina={pagina}
        onNavigate={navegarPara}
        isAdmin={podeAcessarPainel}
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
            data-neytai-target="nav-feed"
            className={pagina === 'feed' ? 'active' : ''}
            onClick={() => navegarPara('feed')}
          >
            Feed
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
            data-neytai-target="nav-grupo"
            className={pagina === 'grupo' ? 'active' : ''}
            onClick={() => navegarPara('grupo')}
          >
            Grupo
          </button>

          <button
            data-neytai-target="nav-ranking"
            className={pagina === 'ranking' ? 'active' : ''}
            onClick={() => navegarPara('ranking')}
          >
            Ranking
          </button>

          <button
            data-neytai-target="nav-progresso"
            className={pagina === 'progresso' ? 'active' : ''}
            onClick={() => navegarPara('progresso')}
          >
            Conquistas
          </button>

          <button
            data-neytai-target="nav-missoes"
            className={pagina === 'missoes' ? 'active' : ''}
            onClick={() => navegarPara('missoes')}
          >
            Missões
          </button>

          <button
            data-neytai-target="nav-evento"
            className={pagina === 'evento' ? 'active' : ''}
            onClick={() => navegarPara('evento')}
          >
            Evento
          </button>

          <button
            data-neytai-target="nav-loja"
            className={pagina === 'loja' ? 'active' : ''}
            onClick={() => navegarPara('loja')}
          >
            Loja
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

          {creatorMessageUnlocked && (
            <button
              data-neytai-target="nav-mensagem-criador"
              className={`creator-message-nav creator-message-nav-unlocked ${
                pagina === 'criador' ? 'active' : ''
              }`}
              onClick={() => navegarPara('criador')}
              title="Mensagem do criador"
            >
              Recado
            </button>
          )}

          {podeAcessarPainel && (
            <button
              data-neytai-target="nav-painel"
              className={pagina === 'admin' ? 'active' : ''}
              onClick={() => navegarPara('admin')}
            >
              Painel
            </button>
          )}
        </nav>

        <div className="header-account-zone" data-neytai-target="account-menu">
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

          <NotificationCenter
            session={authSession}
            onNavigate={navegarPara}
          />

          <AccountMenu
            session={authSession}
            authReady={authReady}
            profile={profile}
            profileReady={profileReady}
            saldo={saldo}
            onOpenAuth={setAuthModalMode}
            onOpenProfile={() => setProfileModalOpen(true)}
          />
        </div>
      </header>

      <main className="page">

        <AccountSuspensionNotice profile={profile} />

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
            onIrParaAoVivo={() => navegarPara('ao-vivo')}
            sessaoAoVivo={sessaoAoVivo}
          />
        ) : pagina === 'feed' ? (
          <CommunityFeedPage
            session={authSession}
            currentUserId={authSession?.user?.id}
            onNavigate={navegarPara}
            onOpenProfile={(userId) => abrirPerfilPublico(userId, 'feed')}
          />
        ) : pagina === 'museu' ? (
          <MuseumPage
            session={authSession}
            profile={profile}
            onOpenAuth={() => setAuthModalMode('login')}
            onOpenProfile={(userId) => abrirPerfilPublico(userId, 'museu')}
          />
        ) : pagina === 'grupo' ? (
          <GroupPage profile={profile} />
        ) : pagina === 'historico' ? (
          <HistoryPage
            sports={historico}
            games={historicoJogos}
            synced={Boolean(authSession?.user && historyReady)}
            onNavigate={navegarPara}
          />
        ) : pagina === 'para-tai' ? (
          <FinalMessagePage
            session={authSession}
            profile={profile}
            onOpenAuth={() => setAuthModalMode('login')}
            onVoltarInicio={() => navegarPara('inicio')}
            onOpenProfile={(userId) => abrirPerfilPublico(userId, 'para-tai')}
          />
        ) : pagina === 'criador' && creatorMessageUnlocked ? (
          <CreatorMessagePage
            onVoltarInicio={() => navegarPara('inicio')}
            onVoltarParaTai={() => navegarPara('para-tai')}
          />
        ) : pagina === 'jogos' ? (
          <GamesPage
            saldo={saldo}
            historicoJogos={historicoJogos}
            onGirarTaigrinho={jogarTaigrinhoAutoritativo}
            onIniciarTaiMandioca={iniciarTaiMandiocaAutoritativa}
            onRevelarTaiMandioca={revelarTaiMandiocaAutoritativa}
            onRecolherTaiMandioca={recolherTaiMandiocaAutoritativa}
            onCarregarTaiMandioca={carregarTaiMandiocaAutoritativa}
            onIniciarCrash={iniciarCrashRegimeAutoritativo}
            onConsultarCrash={consultarCrashRegimeAutoritativo}
            onRetirarCrash={retirarCrashRegimeAutoritativo}
            onFinalizarJogo={finalizarJogo}
            onReceberBonus={receberBonusJogo}
            onIniciarDerby={iniciarDerbyAutoritativo}
            onConsultarDerby={consultarDerbyAutoritativo}
            onFinalizarCorridaDerby={finalizarCorridaDerbyAutoritativa}
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
              currentUserId={authSession?.user?.id}
              refreshKey={`${saldo}:${historico.length}:${historicoJogos.length}:${pagina}`}
              onOpenProfile={(userId) => abrirPerfilPublico(userId, 'ranking')}
            />
          </div>
        ) : pagina === 'progresso' ? (
          <ProgressionPage
            session={authSession}
            profile={profile}
            sports={historico}
            games={historicoJogos}
            onOpenAuth={() => setAuthModalMode('login')}
            onOpenPublicProfile={() =>
              abrirPerfilPublico(authSession?.user?.id, 'progresso')
            }
            onTitleChanged={(equippedTitleKey) =>
              setProfile((perfilAtual) =>
                perfilAtual
                  ? {
                      ...perfilAtual,
                      equipped_title_key: equippedTitleKey,
                    }
                  : perfilAtual,
              )
            }
          />
        ) : pagina === 'missoes' ? (
          <MissionPage
            session={authSession}
            profile={profile}
            onOpenAuth={() => setAuthModalMode('login')}
            onProfileChanged={aplicarPerfilDaCarteira}
            onNavigate={navegarPara}
          />
        ) : pagina === 'evento' ? (
          <EventSeasonPage
            session={authSession}
            profile={profile}
            onOpenAuth={() => setAuthModalMode('login')}
            onProfileChanged={aplicarPerfilDaCarteira}
            onNavigate={navegarPara}
            onOpenProfile={(userId) => abrirPerfilPublico(userId, 'evento')}
          />
        ) : pagina === 'loja' ? (
          <TaiShopPage
            session={authSession}
            profile={profile}
            onOpenAuth={() => setAuthModalMode('login')}
            onProfileChanged={aplicarPerfilDaCarteira}
            onOpenPublicProfile={() =>
              abrirPerfilPublico(authSession?.user?.id, 'loja')
            }
          />
        ) : pagina === 'perfil-publico' ? (
          <PublicProfilePage
            userId={publicProfileUserId}
            currentUserId={authSession?.user?.id}
            localStats={
              historyReady && publicProfileUserId === authSession?.user?.id
                ? calcularSnapshotPerfilPublico(historico, historicoJogos)
                : null
            }
            onBack={voltarDoPerfilPublico}
            onGoAchievements={() => navegarPara('progresso')}
            onGoShop={() => navegarPara('loja')}
          />
        ) : pagina === 'admin' && !podeAcessarPainel ? (
          <section className="history-empty oracle-history-empty">
            <div className="oracle-history-image">
              <img src={entidadeBanca} alt="Entidade da banca" />
            </div>
            <span className="oracle-small-label">ACESSO NEGADO PELA BANCA</span>
            <h2>Você não possui patente suficiente.</h2>
            <p>Somente administradores autorizados podem entrar no centro de comando.</p>
            <button className="hero-button" onClick={() => navegarPara('inicio')}>
              Voltar para a civilização
            </button>
          </section>
        ) : (
          <div
            className="neytai-tour-page-wrapper"
            data-neytai-target="admin-page"
          >
            <AdminPanel
              historico={historicoEsportesAdmin}
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
              <strong>{siteTexts['footer.brand'] || 'TAIHENBET'}</strong>
              <span>{siteTexts['footer.subtitle'] || 'Sob supervisão do Oráculo das Odds'}</span>
            </div>
          </div>

          <div className="footer-anti-betting">
            <p>
              {siteTexts['footer.disclaimer'] ||
                'Este site é uma paródia antiapostas. Não envolve dinheiro, prêmios ou apostas reais.'}
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
