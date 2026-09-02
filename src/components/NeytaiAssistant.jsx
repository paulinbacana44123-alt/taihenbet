import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './NeytaiAssistant.css'
import neytaiImagem from '../assets/neytai-assistente.png'
import { supabase } from '../lib/supabase'
import { NEYTAI_DEFAULT_STEPS } from '../data/neytaiTour'

const STORAGE_ETAPA = 'taihenbet-neytai-etapa'
const STORAGE_CONCLUIDO = 'taihenbet-neytai-concluido'
const STORAGE_VERSAO = 'taihenbet-neytai-versao'
const VERSAO_TOUR = 'tour-completo-v7-feed-missoes-evento-loja'

const etapas = NEYTAI_DEFAULT_STEPS

const idsValidos = Object.keys(etapas)

function garantirVersaoAtual() {
  const versaoAnterior = localStorage.getItem(STORAGE_VERSAO)

  if (versaoAnterior === VERSAO_TOUR) {
    return
  }

  const etapaAnterior = localStorage.getItem(STORAGE_ETAPA)
  const jaTinhaConcluido =
    localStorage.getItem(STORAGE_CONCLUIDO) === 'sim'

  localStorage.setItem(STORAGE_VERSAO, VERSAO_TOUR)

  // A 3.23c acrescenta quatro áreas que ainda não tinham visita guiada.
  // Quem já concluiu a versão anterior começa direto nesse bloco novo, sem
  // precisar refazer quarenta etapas que já viu.
  if (jaTinhaConcluido) {
    localStorage.setItem(STORAGE_ETAPA, 'irFeed')
    localStorage.removeItem(STORAGE_CONCLUIDO)
    return
  }

  // Se a versão anterior já estava no antigo final/pós-créditos, também volta
  // apenas para as novidades. Assim Feed, Missões, Evento e Loja não são
  // pulados por quem instalou a 3.23b primeiro.
  if (
    ['final', 'faltouUmBagui', 'mensagemCriador', 'finalReal'].includes(
      etapaAnterior,
    )
  ) {
    localStorage.setItem(STORAGE_ETAPA, 'irFeed')
    localStorage.removeItem(STORAGE_CONCLUIDO)
    return
  }

  // Um tour que estava no meio continua do mesmo ponto quando a etapa ainda
  // existe. As novas visitas entram naturalmente antes do falso final.
  if (etapaAnterior && idsValidos.includes(etapaAnterior)) {
    localStorage.setItem(STORAGE_ETAPA, etapaAnterior)
    localStorage.removeItem(STORAGE_CONCLUIDO)
    return
  }

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
  isAdmin = false,
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
  const [mensagensCustomizadas, setMensagensCustomizadas] =
    useState({})
  const timersRef = useRef([])

  async function carregarMensagensCustomizadas() {
    try {
      const { data, error } = await supabase.rpc(
        'get_public_neytai_message_overrides',
      )

      if (error) {
        return
      }

      setMensagensCustomizadas(
        data && typeof data === 'object' ? data : {},
      )
    } catch {
      // Se o SQL da 3.23a ainda não existir, o Neytai continua
      // usando as falas padrão do código sem quebrar o tour.
    }
  }

  const ordemEtapas = useMemo(
    () =>
      Object.keys(etapas).filter(
        (id) => isAdmin || !etapas[id].adminOnly,
      ),
    [isAdmin],
  )

  const etapa = useMemo(() => {
    const candidata = etapas[etapaId]

    const base =
      !candidata ||
      (candidata.adminOnly && !isAdmin)
        ? etapas.boasVindas
        : candidata

    const override = mensagensCustomizadas[base.id]

    if (!override) {
      return base
    }

    return {
      ...base,
      titulo:
        typeof override.titulo === 'string'
          ? override.titulo
          : base.titulo,
      texto:
        typeof override.texto === 'string'
          ? override.texto
          : base.texto,
      instrucao:
        typeof override.instrucao === 'string'
          ? override.instrucao
          : base.instrucao,
      botaoPausa:
        typeof override.botaoPausa === 'string'
          ? override.botaoPausa
          : base.botaoPausa,
      dicas: Array.isArray(override.dicas)
        ? override.dicas
        : base.dicas,
    }
  }, [etapaId, isAdmin, mensagensCustomizadas])

  const indiceAtual = ordemEtapas.indexOf(etapa.id)
  const numeroAtual = Math.max(1, indiceAtual + 1)
  const TOTAL_ETAPAS = ordemEtapas.length
  const progresso = Math.min(
    100,
    Math.max(
      0,
      (numeroAtual / TOTAL_ETAPAS) * 100,
    ),
  )

  function proximaEtapaId() {
    if (indiceAtual < 0) {
      return ordemEtapas[0]
    }

    return ordemEtapas[indiceAtual + 1] || null
  }

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
      setEtapaId('finalReal')
      setAberto(true)
      return
    }

    if (etapa.modo === 'alvo') {
      setAberto(true)
      return
    }

    const proxima = proximaEtapaId()

    if (proxima) {
      irParaEtapa(proxima)
      return
    }

    setAberto(true)
  }

  function avancarManualmente() {
    const proxima = proximaEtapaId()

    if (proxima) {
      irParaEtapa(proxima)
    }
  }

  function abrirPosCreditos() {
    const proxima = proximaEtapaId()

    if (proxima) {
      irParaEtapa(proxima)
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
    setEtapaId('finalReal')
    window.dispatchEvent(new Event('taihenbet:reveal-creator-message'))

    localStorage.setItem(STORAGE_ETAPA, 'finalReal')
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
    void carregarMensagensCustomizadas()

    function atualizarConteudo() {
      void carregarMensagensCustomizadas()
    }

    window.addEventListener(
      'taihenbet-content-updated',
      atualizarConteudo,
    )

    return () => {
      window.removeEventListener(
        'taihenbet-content-updated',
        atualizarConteudo,
      )
    }
  }, [])

  useEffect(() => {
    if (etapaId === 'faltouUmBagui') {
      window.dispatchEvent(
        new Event('taihenbet:reveal-creator-message'),
      )
    }
  }, [etapaId])

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
        proximaEtapaId() && irParaEtapa(proximaEtapaId())
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
            : `Continuar · ${numeroAtual}/${TOTAL_ETAPAS}`}
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
              {numeroAtual}/{TOTAL_ETAPAS}
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

          {etapa.modo === 'fake-final' && (
            <button
              type="button"
              className="neytai-primary-action"
              onClick={abrirPosCreditos}
            >
              {etapa.botaoPausa || 'Encerrar tour'}
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

          {!['final', 'fake-final'].includes(etapa.modo) && (
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
