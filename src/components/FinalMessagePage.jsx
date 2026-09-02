import { useEffect, useState } from 'react'
import './FinalMessagePage.css'
import { supabase } from '../lib/supabase'
import entidadeBanca from '../assets/entidade-banca.png'

function formatarDataMensagem(valor) {
  if (!valor) return ''

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(valor))
  } catch {
    return ''
  }
}

function FinalMessagePage({
  onVoltarInicio,
  session,
  profile,
  onOpenAuth,
  onOpenProfile,
}) {
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregarMensagens() {
    setCarregando(true)

    const { data, error } = await supabase.rpc('get_tai_messages')

    if (error) {
      console.error('Falha ao carregar mensagens para a Tai:', error)
      setErro('A banca não conseguiu abrir o mural agora.')
      setMensagens([])
      setCarregando(false)
      return
    }

    setMensagens(Array.isArray(data) ? data : [])
    setCarregando(false)
  }

  useEffect(() => {
    void carregarMensagens()
  }, [session?.user?.id])

  async function enviarMensagem(evento) {
    evento.preventDefault()

    if (!session?.user) {
      onOpenAuth?.()
      return
    }

    const mensagemFinal = texto.trim()
    if (!mensagemFinal) return

    setErro('')
    setSucesso('')
    setEnviando(true)

    const { error } = await supabase.rpc('create_tai_message', {
      p_message: mensagemFinal,
    })

    if (error) {
      console.error('Falha ao publicar mensagem:', error)
      setErro(error.message || 'A mensagem não pôde ser entregue.')
      setEnviando(false)
      return
    }

    setTexto('')
    setSucesso('Mensagem entregue ao mural da Tai.')
    await carregarMensagens()
    setEnviando(false)
  }

  async function removerMensagem(mensagem) {
    if (!mensagem?.can_delete) return

    const confirmou = window.confirm(
      'Remover esta mensagem do mural? Esta ação não pode ser desfeita.',
    )

    if (!confirmou) return

    const { error } = await supabase.rpc('delete_tai_message', {
      p_message_id: mensagem.id,
    })

    if (error) {
      console.error('Falha ao remover mensagem:', error)
      setErro(error.message || 'A mensagem não pôde ser removida.')
      return
    }

    await carregarMensagens()
  }

  return (
    <section
      className="final-message-page tai-community-page"
      data-neytai-target="final-message-page"
    >
      <div className="final-message-background">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <header className="tai-community-hero">
        <div className="tai-community-portrait">
          <img src={entidadeBanca} alt="Entidade da TaihenBet" />
        </div>

        <div>
          <span className="final-message-eyebrow">MURAL DA COMUNIDADE</span>
          <h1>Para a Tai.</h1>
          <p>
            A carta antiga saiu de circulação. Este espaço agora pertence às
            pessoas que quiserem deixar uma mensagem para a Taihen — cada texto
            aparece assinado pelo nome da conta que publicou.
          </p>
        </div>
      </header>

      <div className="tai-community-layout">
        <aside className="tai-message-composer-card">
          <span>DEIXAR UMA MENSAGEM</span>
          <h2>Escreva para a Tai</h2>

          {session?.user ? (
            <form onSubmit={enviarMensagem}>
              <div className="tai-writing-as">
                Publicando como <strong>{profile?.username || 'sua conta'}</strong>
              </div>

              <textarea
                value={texto}
                maxLength={1600}
                onChange={(evento) => setTexto(evento.target.value)}
                placeholder="Escreva algo que você gostaria que a Tai lesse..."
              />

              <div className="tai-message-counter">
                {texto.length} / 1600
              </div>

              {erro && <p className="tai-message-error">{erro}</p>}
              {sucesso && <p className="tai-message-success">{sucesso}</p>}

              <button type="submit" disabled={enviando || !texto.trim()}>
                {enviando ? 'Entregando...' : 'Enviar para a Tai'}
              </button>
            </form>
          ) : (
            <div className="tai-login-required">
              <p>Você precisa entrar em uma conta para assinar uma mensagem.</p>
              <button type="button" onClick={() => onOpenAuth?.()}>
                Entrar para escrever
              </button>
            </div>
          )}

          <div className="tai-community-rules">
            <strong>O nome da conta fica visível.</strong>
            <p>
              Você pode apagar sua própria mensagem depois. A administração
              também pode remover conteúdo do mural quando necessário.
            </p>
          </div>

          <button
            type="button"
            className="tai-back-home"
            onClick={onVoltarInicio}
          >
            Voltar para o início
          </button>
        </aside>

        <section className="tai-message-wall">
          <div className="tai-message-wall-heading">
            <div>
              <span>CAIXA DE ENTRADA COLETIVA</span>
              <h2>Mensagens da comunidade</h2>
              <p>{mensagens.length} mensagem(ns) arquivada(s).</p>
            </div>

            <button type="button" onClick={() => void carregarMensagens()}>
              Atualizar mural
            </button>
          </div>

          {carregando ? (
            <div className="tai-message-empty">Buscando correspondências...</div>
          ) : mensagens.length === 0 ? (
            <div className="tai-message-empty">
              Ainda não há mensagens. Alguém precisa inaugurar a papelada.
            </div>
          ) : (
            <div className="tai-message-list">
              {mensagens.map((mensagem) => (
                <article className="tai-community-message" key={mensagem.id}>
                  <div className="tai-community-message-top">
                    <div>
                      <span>ENVIADO POR</span>
                      {mensagem.user_id && onOpenProfile ? (
                        <button
                          type="button"
                          className="tai-message-author-link"
                          onClick={() => onOpenProfile(mensagem.user_id)}
                        >
                          {mensagem.author_name}
                        </button>
                      ) : (
                        <strong>{mensagem.author_name}</strong>
                      )}
                    </div>
                    <time>{formatarDataMensagem(mensagem.created_at)}</time>
                  </div>

                  <p>{mensagem.message}</p>

                  {mensagem.can_delete && (
                    <button
                      type="button"
                      onClick={() => removerMensagem(mensagem)}
                    >
                      Remover mensagem
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default FinalMessagePage
