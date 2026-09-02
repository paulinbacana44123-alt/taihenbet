import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import './NotificationCenter.css'

const ICONES = {
  achievement: '★',
  title: 'T',
  sports_result: '1X2',
  game_result: '🎲',
  moderation: '⚖',
  account: '!',
  bonus: '+T',
  shop: 'T$',
  mission: '✓',
  season: '◆',
  museum: '💬',
  system: 'i',
}

function tempoRelativo(valor) {
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''

  const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000))
  if (segundos < 45) return 'agora'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `há ${dias} d`
  return data.toLocaleDateString('pt-BR')
}

function normalizarLista(data) {
  if (!Array.isArray(data)) return []
  return data.map((item) => ({
    ...item,
    id: String(item.id),
  }))
}

export default function NotificationCenter({ session, onNavigate }) {
  const [aberto, setAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const raizRef = useRef(null)

  const userId = session?.user?.id || null
  const naoLidas = useMemo(
    () => notificacoes.filter((item) => !item.read_at).length,
    [notificacoes],
  )

  async function carregar({ silencioso = false } = {}) {
    if (!userId) {
      setNotificacoes([])
      return
    }

    if (!silencioso) setCarregando(true)
    const { data, error } = await supabase.rpc('get_my_notifications', {
      p_limit: 60,
    })
    if (!silencioso) setCarregando(false)

    if (error) {
      console.error('Falha ao carregar notificações:', error)
      setErro('A banca perdeu o livro de recados. Confira o SQL da Fase 3.17.')
      return
    }

    setErro(null)
    setNotificacoes(normalizarLista(data))
  }

  useEffect(() => {
    setAberto(false)
    if (!userId) {
      setNotificacoes([])
      return undefined
    }

    void carregar()

    const canal = supabase
      .channel(`taihenbet-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => void carregar({ silencioso: true }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [userId])

  useEffect(() => {
    function fecharFora(evento) {
      if (raizRef.current && !raizRef.current.contains(evento.target)) {
        setAberto(false)
      }
    }

    function fecharEsc(evento) {
      if (evento.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', fecharFora)
    document.addEventListener('keydown', fecharEsc)
    return () => {
      document.removeEventListener('mousedown', fecharFora)
      document.removeEventListener('keydown', fecharEsc)
    }
  }, [])

  async function marcarLida(id) {
    setNotificacoes((lista) =>
      lista.map((item) =>
        item.id === String(id) && !item.read_at
          ? { ...item, read_at: new Date().toISOString() }
          : item,
      ),
    )

    const { error } = await supabase.rpc('mark_my_notification_read', {
      p_notification_id: Number(id),
    })

    if (error) {
      console.warn('Falha ao marcar notificação como lida:', error)
      void carregar({ silencioso: true })
    }
  }

  async function marcarTodas() {
    if (!naoLidas) return
    const agora = new Date().toISOString()
    setNotificacoes((lista) => lista.map((item) => ({ ...item, read_at: item.read_at || agora })))

    const { error } = await supabase.rpc('mark_all_my_notifications_read')
    if (error) {
      console.warn('Falha ao ler todas as notificações:', error)
      void carregar({ silencioso: true })
    }
  }

  async function limparLidas() {
    const anteriores = notificacoes
    setNotificacoes((lista) => lista.filter((item) => !item.read_at))
    const { error } = await supabase.rpc('clear_my_read_notifications')
    if (error) {
      console.warn('Falha ao limpar notificações lidas:', error)
      setNotificacoes(anteriores)
    }
  }

  async function abrirNotificacao(item) {
    if (!item.read_at) await marcarLida(item.id)
    if (item.target_page) {
      onNavigate?.(item.target_page)
      setAberto(false)
    }
  }

  if (!session?.user) return null

  return (
    <div className="notification-center" ref={raizRef} data-neytai-target="notifications">
      <button
        type="button"
        className={`notification-bell ${aberto ? 'is-open' : ''}`}
        onClick={() => {
          setAberto((valor) => !valor)
          if (!aberto) void carregar({ silencioso: true })
        }}
        aria-label={naoLidas ? `${naoLidas} notificações não lidas` : 'Notificações'}
        aria-expanded={aberto}
        title="Central de Notificações"
      >
        <span className="notification-bell-icon" aria-hidden="true">♢</span>
        {naoLidas > 0 && (
          <span className="notification-badge">{naoLidas > 99 ? '99+' : naoLidas}</span>
        )}
      </button>

      {aberto && (
        <section className="notification-popover" aria-label="Central de Notificações">
          <header className="notification-popover-header">
            <div>
              <span>CENTRAL DA BANCA</span>
              <h2>Notificações</h2>
            </div>
            {naoLidas > 0 && (
              <button type="button" onClick={marcarTodas}>Ler todas</button>
            )}
          </header>

          <div className="notification-list">
            {carregando && notificacoes.length === 0 ? (
              <div className="notification-empty">Consultando os arquivos da Entidade...</div>
            ) : erro ? (
              <div className="notification-empty notification-error">{erro}</div>
            ) : notificacoes.length === 0 ? (
              <div className="notification-empty">
                <strong>Nenhum comunicado.</strong>
                <span>Por enquanto a banca não tem nada para usar contra você.</span>
              </div>
            ) : (
              notificacoes.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`notification-item ${item.read_at ? 'is-read' : 'is-unread'}`}
                  onClick={() => abrirNotificacao(item)}
                >
                  <span className="notification-item-icon" aria-hidden="true">
                    {ICONES[item.type] || ICONES.system}
                  </span>
                  <span className="notification-item-copy">
                    <span className="notification-item-topline">
                      <strong>{item.title}</strong>
                      <small>{tempoRelativo(item.created_at)}</small>
                    </span>
                    <span>{item.message}</span>
                  </span>
                  {!item.read_at && <i className="notification-unread-dot" aria-label="Não lida" />}
                </button>
              ))
            )}
          </div>

          {notificacoes.some((item) => item.read_at) && (
            <footer className="notification-popover-footer">
              <button type="button" onClick={limparLidas}>Limpar lidas</button>
            </footer>
          )}
        </section>
      )}
    </div>
  )
}
