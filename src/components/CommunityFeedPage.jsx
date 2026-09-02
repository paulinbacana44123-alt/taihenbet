import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { avatarDoPerfil } from '../data/profileAvatars'
import './CommunityFeedPage.css'
import { useAchievementCatalog, useSiteTexts } from '../hooks/useEditableContent'

const TITULOS = {
  primeiro_bilhete: 'Apostador de Schrödinger',
  analista_bahrein: 'Especialista em Futebol Bareinita',
  primeira_vitoria: 'Milagre Estatístico',
  cliente_banca: 'Cliente Preferencial da Banca',
  domador_taigrinho: 'Domador de Taigrinho',
  agronomo_risco: 'Agrônomo de Risco',
  fugitivo_regime: 'Fugitivo do Regime',
  joquei_mambo: 'Jóquei do Protocolo Mambo',
  investidor_questionavel: 'Investidor Questionável',
  inimigo_banca: 'Inimigo da Banca',
  veterano_ruina: 'Veterano da Ruína',
}

const FILTROS = [
  { id: 'all', label: 'Tudo' },
  { id: 'museu', label: 'Museu' },
  { id: 'progress', label: 'Progressão' },
  { id: 'season', label: 'Temporada' },
  { id: 'profile', label: 'Perfil' },
]

const GRUPOS = {
  museum: {
    label: 'MUSEU',
    icon: '▣',
  },
  progress: {
    label: 'PROGRESSÃO',
    icon: '★',
  },
  season: {
    label: 'TEMPORADA',
    icon: '🌱',
  },
  profile: {
    label: 'PERFIL',
    icon: '◆',
  },
}

function normalizarItens(valor) {
  return Array.isArray(valor) ? valor : []
}

function filtroParaRpc(filtro) {
  // A interface usa o nome em português, mas o banco armazena o grupo como "museum".
  // Mantemos essa tradução centralizada para evitar que um rótulo de UI quebre a RPC.
  if (filtro === 'museu') return 'museum'
  return filtro
}

function mesclarSemDuplicar(atuais, novos) {
  const mapa = new Map()
  for (const item of [...normalizarItens(atuais), ...normalizarItens(novos)]) {
    mapa.set(String(item.id), item)
  }
  return [...mapa.values()]
}

function tempoRelativo(valor) {
  if (!valor) return 'agora'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return 'em algum momento suspeito'

  const diff = Math.max(0, Date.now() - data.getTime())
  const segundos = Math.floor(diff / 1000)
  if (segundos < 45) return 'agora'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `há ${dias} d`

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function destinoLabel(pagina) {
  if (pagina === 'museu') return 'Abrir Museu'
  if (pagina === 'missoes') return 'Ver missões'
  if (pagina === 'evento') return 'Abrir evento'
  if (pagina === 'progresso') return 'Ver conquistas'
  if (pagina === 'loja') return 'Abrir TaiShop'
  if (pagina === 'perfil-publico') return 'Ver perfil'
  return 'Abrir área'
}

function FeedCard({ item, currentUserId, onNavigate, onOpenProfile, achievementCatalog }) {
  const grupo = GRUPOS[item.activity_group] || GRUPOS.profile
  const titulo = achievementCatalog?.[item.equipped_title_key]?.title || TITULOS[item.equipped_title_key] || ''
  const avatar = avatarDoPerfil(item.avatar_key)
  const isMe = currentUserId && currentUserId === item.user_id

  function abrirDestino() {
    if (item.page === 'perfil-publico') {
      onOpenProfile?.(item.user_id)
      return
    }
    if (item.page) onNavigate?.(item.page)
  }

  return (
    <article className={`community-feed-card feed-group-${item.activity_group || 'profile'}`}>
      <button
        type="button"
        className="community-feed-avatar"
        onClick={() => onOpenProfile?.(item.user_id)}
        aria-label={`Abrir perfil de ${item.username}`}
      >
        <img src={avatar.src} alt={`Avatar de ${item.username}`} />
      </button>

      <div className="community-feed-copy">
        <div className="community-feed-meta">
          <span className="community-feed-group">
            <i aria-hidden="true">{grupo.icon}</i>
            {grupo.label}
          </span>
          <time dateTime={item.created_at}>{tempoRelativo(item.created_at)}</time>
        </div>

        <h3>
          <button type="button" onClick={() => onOpenProfile?.(item.user_id)}>
            {item.username}
          </button>{' '}
          <span>{item.action_text}</span>
        </h3>

        {(titulo || isMe || item.role === 'admin') && (
          <div className="community-feed-identity-line">
            {titulo && <span>{titulo}</span>}
            {item.role === 'admin' && <b>ADMIN DA BANCA</b>}
            {isMe && <em>VOCÊ</em>}
          </div>
        )}

        {item.detail_text && <p>{item.detail_text}</p>}

        {item.page && (
          <button type="button" className="community-feed-open" onClick={abrirDestino}>
            {destinoLabel(item.page)} →
          </button>
        )}
      </div>
    </article>
  )
}

export default function CommunityFeedPage({
  session,
  currentUserId,
  onNavigate,
  onOpenProfile,
}) {
  const siteTexts = useSiteTexts()
  const { map: achievementCatalog } = useAchievementCatalog()
  const [filtroAtivo, setFiltroAtivo] = useState('all')
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const requestIdRef = useRef(0)

  const latest = useMemo(() => normalizarItens(itens)[0]?.created_at || null, [itens])

  async function carregar({ append = false } = {}) {
    const requestId = ++requestIdRef.current

    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setItens([])
    }
    setError('')

    const offset = append ? itens.length : 0
    const { data, error: rpcError } = await supabase.rpc('get_community_activity_feed', {
      p_filter: filtroParaRpc(filtroAtivo),
      p_limit: 20,
      p_offset: offset,
    })

    // Se o usuário trocou de filtro enquanto a RPC estava em voo,
    // a resposta antiga não pode sobrescrever a tela atual.
    if (requestId !== requestIdRef.current) return

    if (append) setLoadingMore(false)
    else setLoading(false)

    if (rpcError) {
      console.error('Falha ao carregar o Feed da comunidade:', rpcError)
      setError('O mural da comunidade entrou em conflito com a própria burocracia. O console provavelmente sabe mais do que a banca está admitindo.')
      if (!append) setItens([])
      setHasMore(false)
      return
    }

    const novos = normalizarItens(data)
    setItens((atuais) => (append ? mesclarSemDuplicar(atuais, novos) : novos))
    setHasMore(novos.length === 20)
  }

  useEffect(() => {
    void carregar()
  }, [filtroAtivo, session?.user?.id])

  return (
    <section className="community-feed-page">
      <header className="community-feed-hero">
        <div>
          <span>{siteTexts['feed.eyebrow'] || 'FASE 3.22 · FOFOCA INSTITUCIONAL'}</span>
          <h1>{siteTexts['feed.title'] || 'O mural que registra até o que ninguém pediu.'}</h1>
          <p>
            {siteTexts['feed.description'] ||
              'Conquistas, relíquias, comentários, missões e temporadas da comunidade reunidos em uma linha do tempo pública. A banca chama isso de transparência; todo mundo normal chama de feed.'}
          </p>
        </div>

        <aside>
          <small>ATIVIDADE CARREGADA</small>
          <strong>{itens.length}</strong>
          <span>{latest ? `Último registro ${tempoRelativo(latest)}` : 'Nenhum registro visível'}</span>
          <button type="button" onClick={() => carregar()} disabled={loading}>
            {loading ? 'Auditando...' : 'Atualizar mural'}
          </button>
        </aside>
      </header>

      <div className="community-feed-toolbar">
        <div>
          <span>FILTRO DA OUVIDORIA</span>
          <strong>Escolha qual tipo de fofoca merece processamento.</strong>
        </div>

        <div className="community-feed-filters">
          {FILTROS.map((filtro) => (
            <button
              type="button"
              key={filtro.id}
              className={filtroAtivo === filtro.id ? 'active' : ''}
              onClick={() => setFiltroAtivo(filtro.id)}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="community-feed-error">
          <span>ERRO DE PROCESSAMENTO</span>
          <h2>O Feed resolveu colaborar com o desenvolvimento.</h2>
          <p>{error}</p>
          <button type="button" onClick={() => carregar()}>
            Tentar novamente
          </button>
        </div>
      ) : loading ? (
        <div className="community-feed-empty">
          <strong>Consultando o arquivo da comunidade...</strong>
          <p>O departamento de fofoca está cruzando tabelas que jamais deveriam ter se conhecido.</p>
        </div>
      ) : itens.length === 0 ? (
        <div className="community-feed-empty">
          <strong>Nenhum acontecimento encontrado.</strong>
          <p>Ou a comunidade finalmente se comportou, ou a consulta ainda não descobriu o escândalo.</p>
        </div>
      ) : (
        <div className="community-feed-list">
          {itens.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              onNavigate={onNavigate}
              onOpenProfile={onOpenProfile}
              achievementCatalog={achievementCatalog}
            />
          ))}
        </div>
      )}

      {!error && !loading && hasMore && (
        <button
          type="button"
          className="community-feed-more"
          onClick={() => carregar({ append: true })}
          disabled={loadingMore}
        >
          {loadingMore ? 'Buscando mais provas...' : 'Carregar registros mais antigos'}
        </button>
      )}

      <footer className="community-feed-footer">
        <strong>{siteTexts['feed.privacy_label'] || 'PRIVACIDADE MÍNIMA, MAS EXISTENTE'}</strong>
        <p>
          {siteTexts['feed.privacy'] ||
            'O Feed não publica saldo, e-mail, histórico bruto, moderação ou dados de autenticação. Contas suspensas deixam de aparecer enquanto a suspensão estiver ativa.'}
        </p>
      </footer>
    </section>
  )
}
