import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { avatarDoPerfil } from '../data/profileAvatars'
import './ModerationAdminPanel.css'

const MUSEUM_BUCKET = 'museum-community'

function formatarData(valor) {
  if (!valor) return '—'

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(valor))
  } catch {
    return String(valor)
  }
}

function formatarSaldo(valor) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function textoDaAcao(acao) {
  const mapa = {
    user_suspended: 'CONTA SUSPENSA',
    user_reactivated: 'CONTA REATIVADA',
    user_deleted: 'CONTA EXCLUÍDA',
    museum_post_removed: 'PEÇA REMOVIDA',
    museum_comment_removed: 'COMENTÁRIO REMOVIDO',
    tai_message_removed: 'MENSAGEM REMOVIDA',
  }

  return mapa[acao] || String(acao || 'AÇÃO').replaceAll('_', ' ').toUpperCase()
}

function ModerationAdminPanel() {
  const [aba, setAba] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [posts, setPosts] = useState([])
  const [comentarios, setComentarios] = useState([])
  const [mensagens, setMensagens] = useState([])
  const [logs, setLogs] = useState([])
  const [usuarioAtualId, setUsuarioAtualId] = useState(null)
  const [buscaUsuarios, setBuscaUsuarios] = useState('')
  const [buscaPosts, setBuscaPosts] = useState('')
  const [buscaComentarios, setBuscaComentarios] = useState('')
  const [buscaMensagens, setBuscaMensagens] = useState('')
  const [motivos, setMotivos] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregarCentral() {
    setCarregando(true)
    setErro('')

    const [
      authResult,
      usersResult,
      postsResult,
      commentsResult,
      messagesResult,
      logsResult,
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc('get_admin_moderation_users'),
      supabase.rpc('get_admin_museum_posts'),
      supabase.rpc('get_admin_museum_comments'),
      supabase.rpc('get_admin_tai_messages'),
      supabase.rpc('get_admin_moderation_logs', { p_limit: 150 }),
    ])

    const falha =
      authResult.error ||
      usersResult.error ||
      postsResult.error ||
      commentsResult.error ||
      messagesResult.error ||
      logsResult.error

    if (falha) {
      console.error('Falha ao carregar Central de Moderação:', {
        auth: authResult.error,
        users: usersResult.error,
        posts: postsResult.error,
        comments: commentsResult.error,
        messages: messagesResult.error,
        logs: logsResult.error,
      })
      setErro(
        falha.message ||
          'A Central de Moderação não conseguiu consultar o servidor.',
      )
      setCarregando(false)
      return
    }

    setUsuarioAtualId(authResult.data?.user?.id || null)
    setUsuarios(Array.isArray(usersResult.data) ? usersResult.data : [])
    setPosts(Array.isArray(postsResult.data) ? postsResult.data : [])
    setComentarios(
      Array.isArray(commentsResult.data) ? commentsResult.data : [],
    )
    setMensagens(
      Array.isArray(messagesResult.data) ? messagesResult.data : [],
    )
    setLogs(Array.isArray(logsResult.data) ? logsResult.data : [])
    setCarregando(false)
  }

  useEffect(() => {
    carregarCentral()
  }, [])

  const usuariosFiltrados = useMemo(() => {
    const termo = buscaUsuarios.trim().toLowerCase()
    if (!termo) return usuarios

    return usuarios.filter((usuario) =>
      [
        usuario.username,
        usuario.role,
        usuario.suspended_reason,
        usuario.is_suspended ? 'suspenso' : 'ativo',
      ]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo)),
    )
  }, [usuarios, buscaUsuarios])

  const postsFiltrados = useMemo(() => {
    const termo = buscaPosts.trim().toLowerCase()
    if (!termo) return posts

    return posts.filter((post) =>
      [post.title, post.description, post.author_name, post.category]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo)),
    )
  }, [posts, buscaPosts])

  const comentariosFiltrados = useMemo(() => {
    const termo = buscaComentarios.trim().toLowerCase()
    if (!termo) return comentarios

    return comentarios.filter((item) =>
      [item.author_name, item.post_title, item.comment]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo)),
    )
  }, [comentarios, buscaComentarios])

  const mensagensFiltradas = useMemo(() => {
    const termo = buscaMensagens.trim().toLowerCase()
    if (!termo) return mensagens

    return mensagens.filter((item) =>
      [item.author_name, item.message]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo)),
    )
  }, [mensagens, buscaMensagens])

  const suspensos = usuarios.filter((usuario) => usuario.is_suspended).length

  async function alterarSuspensao(usuario, suspender) {
    if (!usuario || usuario.id === usuarioAtualId) return

    const motivo = String(motivos[usuario.id] || '').trim()

    if (suspender && !motivo) {
      setErro(`Escreva um motivo antes de suspender ${usuario.username}.`)
      return
    }

    const confirmado = window.confirm(
      suspender
        ? `Suspender ${usuario.username}? A conta continuará podendo entrar, mas jogos, apostas e publicações serão bloqueados.`
        : `Reativar ${usuario.username}? A conta voltará a poder jogar, apostar e publicar imediatamente.`,
    )

    if (!confirmado) return

    setOcupado(`user-${usuario.id}`)
    setErro('')
    setSucesso('')

    const { data, error } = await supabase.rpc(
      'admin_set_user_suspension',
      {
        p_user_id: usuario.id,
        p_suspended: suspender,
        p_reason: suspender ? motivo : null,
      },
    )

    if (error) {
      console.error('Falha ao alterar suspensão:', error)
      setErro(error.message || 'Não foi possível alterar a conta.')
      setOcupado(null)
      return
    }

    setMotivos((atual) => ({ ...atual, [usuario.id]: '' }))
    setSucesso(
      suspender
        ? `${data?.username || usuario.username} entrou em modo espectador obrigatório.`
        : `${data?.username || usuario.username} foi devolvido à sociedade TaihenBet.`,
    )
    await carregarCentral()
    setOcupado(null)
  }

  async function removerPost(post) {
    const confirmado = window.confirm(
      `Remover “${post.title}” do Museu? A publicação e o arquivo enviado serão apagados.`,
    )

    if (!confirmado) return

    setOcupado(`post-${post.id}`)
    setErro('')
    setSucesso('')

    const { data, error } = await supabase.rpc(
      'admin_remove_museum_post',
      { p_post_id: post.id },
    )

    if (error) {
      console.error('Falha ao moderar Museu:', error)
      setErro(error.message || 'Não foi possível remover a peça.')
      setOcupado(null)
      return
    }

    const mediaPath = data?.media_path || post.media_path
    if (mediaPath) {
      const { error: storageError } = await supabase.storage
        .from(MUSEUM_BUCKET)
        .remove([mediaPath])

      if (storageError) {
        console.warn(
          'Registro removido, mas a limpeza do Storage falhou:',
          storageError,
        )
      }
    }

    setSucesso(`“${post.title}” foi confiscado pelo Ministério da Curadoria.`)
    await carregarCentral()
    setOcupado(null)
  }

  async function removerComentario(item) {
    const confirmado = window.confirm(
      `Remover o comentário de ${item.author_name} em “${item.post_title}”?`,
    )

    if (!confirmado) return

    setOcupado(`comment-${item.id}`)
    setErro('')
    setSucesso('')

    const { error } = await supabase.rpc('admin_remove_museum_comment', {
      p_comment_id: item.id,
    })

    if (error) {
      console.error('Falha ao moderar comentário do Museu:', error)
      setErro(error.message || 'Não foi possível remover o comentário.')
      setOcupado(null)
      return
    }

    setSucesso(`O comentário de ${item.author_name} foi removido do acervo.`)
    await carregarCentral()
    setOcupado(null)
  }

  async function removerMensagem(item) {
    const confirmado = window.confirm(
      `Remover a mensagem de ${item.author_name}?`,
    )

    if (!confirmado) return

    setOcupado(`message-${item.id}`)
    setErro('')
    setSucesso('')

    const { error } = await supabase.rpc('admin_remove_tai_message', {
      p_message_id: item.id,
    })

    if (error) {
      console.error('Falha ao moderar Para a Tai:', error)
      setErro(error.message || 'Não foi possível remover a mensagem.')
      setOcupado(null)
      return
    }

    setSucesso(`A correspondência de ${item.author_name} foi arquivada no vazio.`)
    await carregarCentral()
    setOcupado(null)
  }

  function urlDoPost(post) {
    if (!post?.media_path) return ''

    return supabase.storage
      .from(MUSEUM_BUCKET)
      .getPublicUrl(post.media_path).data.publicUrl
  }

  return (
    <section
      className="moderation-admin-panel"
      data-neytai-target="moderation-admin-panel"
    >
      <div className="moderation-admin-hero">
        <div>
          <span>MINISTÉRIO DA ORDEM QUESTIONÁVEL</span>
          <h2>Central de Moderação</h2>
          <p>
            Contas, publicações, comentários e correspondências em um único lugar.
            Toda ação destrutiva passa pelo servidor e deixa rastro no
            livro-caixa moral da banca.
          </p>
        </div>

        <button
          type="button"
          className="moderation-refresh"
          onClick={carregarCentral}
          disabled={carregando || Boolean(ocupado)}
        >
          {carregando ? 'Consultando...' : 'Atualizar central'}
        </button>
      </div>

      <div className="moderation-stats">
        <article>
          <span>CONTAS</span>
          <strong>{usuarios.length}</strong>
          <small>{suspensos} suspensa(s)</small>
        </article>
        <article>
          <span>MUSEU COMUNITÁRIO</span>
          <strong>{posts.length}</strong>
          <small>peça(s) publicadas</small>
        </article>
        <article>
          <span>COMENTÁRIOS</span>
          <strong>{comentarios.length}</strong>
          <small>parecer(es) no Museu</small>
        </article>
        <article>
          <span>PARA A TAI</span>
          <strong>{mensagens.length}</strong>
          <small>mensagem(ns) arquivadas</small>
        </article>
        <article>
          <span>RASTRO ADMIN</span>
          <strong>{logs.length}</strong>
          <small>ações recentes carregadas</small>
        </article>
      </div>

      {erro && <div className="moderation-feedback error">{erro}</div>}
      {sucesso && (
        <div className="moderation-feedback success">{sucesso}</div>
      )}

      <div className="moderation-tabs">
        <button
          type="button"
          className={aba === 'usuarios' ? 'active' : ''}
          onClick={() => setAba('usuarios')}
        >
          Usuários <span>{usuarios.length}</span>
        </button>
        <button
          type="button"
          className={aba === 'museu' ? 'active' : ''}
          onClick={() => setAba('museu')}
        >
          Museu <span>{posts.length}</span>
        </button>
        <button
          type="button"
          className={aba === 'comentarios' ? 'active' : ''}
          onClick={() => setAba('comentarios')}
        >
          Comentários <span>{comentarios.length}</span>
        </button>
        <button
          type="button"
          className={aba === 'mensagens' ? 'active' : ''}
          onClick={() => setAba('mensagens')}
        >
          Para a Tai <span>{mensagens.length}</span>
        </button>
        <button
          type="button"
          className={aba === 'logs' ? 'active' : ''}
          onClick={() => setAba('logs')}
        >
          Logs <span>{logs.length}</span>
        </button>
      </div>

      {carregando ? (
        <div className="moderation-empty">A banca está consultando os arquivos...</div>
      ) : aba === 'usuarios' ? (
        <div className="moderation-section">
          <div className="moderation-toolbar">
            <div>
              <span>CONTAS DA COMUNIDADE</span>
              <h3>Suspender sem apagar</h3>
            </div>
            <input
              type="search"
              value={buscaUsuarios}
              onChange={(event) => setBuscaUsuarios(event.target.value)}
              placeholder="Buscar nome, cargo, status ou motivo..."
            />
          </div>

          <div className="moderation-user-list">
            {usuariosFiltrados.length === 0 ? (
              <div className="moderation-empty">Nenhuma vítima encontrada.</div>
            ) : (
              usuariosFiltrados.map((usuario) => {
                const propriaConta = usuario.id === usuarioAtualId
                const processando = ocupado === `user-${usuario.id}`

                return (
                  <article
                    className={`moderation-user-card ${
                      usuario.is_suspended ? 'suspended' : ''
                    }`}
                    key={usuario.id}
                  >
                    <div className="moderation-user-main">
                      <img
                        src={avatarDoPerfil(usuario.avatar_key).src}
                        alt=""
                        aria-hidden="true"
                      />
                      <div>
                        <div className="moderation-user-title">
                          <strong>{usuario.username}</strong>
                          <span className={`moderation-user-status ${usuario.is_suspended ? 'off' : 'on'}`}>
                            {usuario.is_suspended ? 'SUSPENSA' : 'ATIVA'}
                          </span>
                          {propriaConta && <span className="moderation-self">VOCÊ</span>}
                        </div>
                        <small>
                          {usuario.role === 'admin' ? 'ADMIN DA BANCA' : 'CLIENTE DA BANCA'} · {formatarSaldo(usuario.balance)} T
                        </small>
                      </div>
                    </div>

                    {usuario.is_suspended ? (
                      <div className="moderation-suspension-box">
                        <div>
                          <span>MOTIVO DA SENTENÇA</span>
                          <p>{usuario.suspended_reason || 'Sem motivo registrado.'}</p>
                          <small>
                            Desde {formatarData(usuario.suspended_at)}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="moderation-reactivate"
                          disabled={propriaConta || processando}
                          onClick={() => alterarSuspensao(usuario, false)}
                        >
                          {processando ? 'Processando...' : 'Reativar conta'}
                        </button>
                      </div>
                    ) : propriaConta ? (
                      <div className="moderation-protected">
                        Sua conta administrativa está protegida contra suspensão pelo próprio painel.
                      </div>
                    ) : (
                      <div className="moderation-suspend-controls">
                        <input
                          type="text"
                          maxLength="500"
                          value={motivos[usuario.id] || ''}
                          onChange={(event) =>
                            setMotivos((atual) => ({
                              ...atual,
                              [usuario.id]: event.target.value,
                            }))
                          }
                          placeholder="Motivo da suspensão (fica visível para a conta)..."
                        />
                        <button
                          type="button"
                          disabled={processando}
                          onClick={() => alterarSuspensao(usuario, true)}
                        >
                          {processando ? 'Suspendendo...' : 'Suspender conta'}
                        </button>
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </div>
        </div>
      ) : aba === 'museu' ? (
        <div className="moderation-section">
          <div className="moderation-toolbar">
            <div>
              <span>CURADORIA CENTRAL</span>
              <h3>Museu comunitário</h3>
            </div>
            <input
              type="search"
              value={buscaPosts}
              onChange={(event) => setBuscaPosts(event.target.value)}
              placeholder="Buscar título, autor ou categoria..."
            />
          </div>

          <div className="moderation-content-list">
            {postsFiltrados.length === 0 ? (
              <div className="moderation-empty">Nenhuma peça comunitária encontrada.</div>
            ) : (
              postsFiltrados.map((post) => {
                const publicUrl = urlDoPost(post)
                const processando = ocupado === `post-${post.id}`

                return (
                  <article className="moderation-content-card" key={post.id}>
                    <div className="moderation-media-preview">
                      {post.media_type === 'video' ? (
                        <video src={publicUrl} muted preload="metadata" />
                      ) : (
                        <img src={publicUrl} alt="" />
                      )}
                    </div>
                    <div className="moderation-content-copy">
                      <span>{post.category || 'ACERVO'} · {formatarData(post.created_at)}</span>
                      <h4>{post.title}</h4>
                      <strong>Publicado por {post.author_name}</strong>
                      <p>{post.description || 'Sem descrição.'}</p>
                    </div>
                    <button
                      type="button"
                      className="moderation-remove"
                      disabled={processando}
                      onClick={() => removerPost(post)}
                    >
                      {processando ? 'Removendo...' : 'Remover do Museu'}
                    </button>
                  </article>
                )
              })
            )}
          </div>
        </div>
      ) : aba === 'comentarios' ? (
        <div className="moderation-section">
          <div className="moderation-toolbar">
            <div>
              <span>OUVIDORIA DO ACERVO</span>
              <h3>Comentários do Museu</h3>
            </div>
            <input
              type="search"
              value={buscaComentarios}
              onChange={(event) => setBuscaComentarios(event.target.value)}
              placeholder="Buscar autor, relíquia ou comentário..."
            />
          </div>

          <div className="moderation-message-list">
            {comentariosFiltrados.length === 0 ? (
              <div className="moderation-empty">Nenhum parecer social encontrado.</div>
            ) : (
              comentariosFiltrados.map((item) => {
                const processando = ocupado === `comment-${item.id}`

                return (
                  <article className="moderation-message-card moderation-comment-card" key={item.id}>
                    <div className="moderation-message-head">
                      <div>
                        <span>COMENTÁRIO DE</span>
                        <strong>{item.author_name}</strong>
                      </div>
                      <small>{formatarData(item.created_at)}</small>
                    </div>
                    <small className="moderation-comment-post">
                      Em: {item.post_title}
                    </small>
                    <p>{item.comment}</p>
                    <button
                      type="button"
                      className="moderation-remove"
                      disabled={processando}
                      onClick={() => removerComentario(item)}
                    >
                      {processando ? 'Removendo...' : 'Remover comentário'}
                    </button>
                  </article>
                )
              })
            )}
          </div>
        </div>
      ) : aba === 'mensagens' ? (
        <div className="moderation-section">
          <div className="moderation-toolbar">
            <div>
              <span>CAIXA DE ENTRADA SOB VIGILÂNCIA</span>
              <h3>Mensagens para a Tai</h3>
            </div>
            <input
              type="search"
              value={buscaMensagens}
              onChange={(event) => setBuscaMensagens(event.target.value)}
              placeholder="Buscar autor ou conteúdo..."
            />
          </div>

          <div className="moderation-message-list">
            {mensagensFiltradas.length === 0 ? (
              <div className="moderation-empty">Nenhuma correspondência encontrada.</div>
            ) : (
              mensagensFiltradas.map((item) => {
                const processando = ocupado === `message-${item.id}`

                return (
                  <article className="moderation-message-card" key={item.id}>
                    <div className="moderation-message-head">
                      <div>
                        <span>ENVIADO POR</span>
                        <strong>{item.author_name}</strong>
                      </div>
                      <small>{formatarData(item.created_at)}</small>
                    </div>
                    <p>{item.message}</p>
                    <button
                      type="button"
                      className="moderation-remove"
                      disabled={processando}
                      onClick={() => removerMensagem(item)}
                    >
                      {processando ? 'Removendo...' : 'Remover mensagem'}
                    </button>
                  </article>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="moderation-section">
          <div className="moderation-toolbar log-toolbar">
            <div>
              <span>CAIXA-PRETA DA ADMINISTRAÇÃO</span>
              <h3>Rastro administrativo</h3>
            </div>
            <small>Últimas {logs.length} ações carregadas</small>
          </div>

          <div className="moderation-log-list">
            {logs.length === 0 ? (
              <div className="moderation-empty">
                Nenhum crime administrativo documentado nesta fase.
              </div>
            ) : (
              logs.map((log) => (
                <article className="moderation-log-card" key={log.id}>
                  <span className={`moderation-log-action action-${log.action}`}>
                    {textoDaAcao(log.action)}
                  </span>
                  <div>
                    <strong>{log.actor_name}</strong>
                    <p>
                      {log.target_name
                        ? `Alvo: ${log.target_name}`
                        : `Alvo: ${log.target_type}`}
                    </p>
                    {log.details?.reason && (
                      <small>Motivo: {log.details.reason}</small>
                    )}
                  </div>
                  <time>{formatarData(log.created_at)}</time>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default ModerationAdminPanel
