import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import './MuseumPage.css'
import { useSiteTexts } from '../hooks/useEditableContent'
import { supabase } from '../lib/supabase'

import custoTai from '../assets/museu-custo.jpg'
import naoDeAgua from '../assets/museu-nao-de-agua.png'
import aura67 from '../assets/museu-aura-67.gif'
import taihenListening from '../assets/museu-listening.png'
import everybodyHates from '../assets/museu-everybody-hates.png'
import perfilProibido from '../assets/museu-perfil.jpg'
import calendarioTai from '../assets/museu-calendario.png'
import compressaoFinal from '../assets/museu-compressao.png'
import videoNotaSapo from '../assets/museu-nota-sapo.mp4'
import posterNotaSapo from '../assets/museu-nota-sapo-poster.jpg'
import videoBrilho from '../assets/museu-brilho.mp4'
import posterBrilho from '../assets/museu-brilho-poster.jpg'
import entidadeBanca from '../assets/museu-entidade.png'
import comandanteTaihen from '../assets/museu-comandante.png'
import taiMandioca from '../assets/museu-mandioca.png'
import taiInfernal from '../assets/museu-infernal.jpg'

const categorias = [
  {
    id: 'todos',
    nome: 'Acervo completo',
  },
  {
    id: 'clipes',
    nome: 'Clipes históricos',
  },
  {
    id: 'memes',
    nome: 'Memes da comunidade',
  },
  {
    id: 'documentos',
    nome: 'Documentos oficiais',
  },
  {
    id: 'formas',
    nome: 'Formas alternativas',
  },
]

const itensDoMuseu = [
  {
    id: 'custo',
    titulo: 'O custo de estar ali',
    descricao:
      'O chat pediu uma prestação de contas. Em resposta, recebeu um edit de phonk e nenhuma nota fiscal.',
    categoria: 'memes',
    tipo: 'imagem',
    src: custoTai,
    formato: 'largo',
    selo: 'RELÍQUIA Nº 001',
  },
  {
    id: 'nao-de-agua',
    titulo: 'Não dê nem água',
    descricao:
      'Mandado de captura emitido pelo Ministério da Arquitetura, dos Recursos Hídricos e das Casas Questionáveis.',
    categoria: 'documentos',
    tipo: 'imagem',
    src: naoDeAgua,
    formato: 'quadrado',
    selo: 'DOCUMENTO CONFIDENCIAL',
  },
  {
    id: 'aura-67',
    titulo: 'Aura 67',
    descricao:
      'O medidor de aura quebrou, mostrou 67 duas vezes e decidiu que a ciência já tinha ido longe demais.',
    categoria: 'formas',
    tipo: 'imagem',
    src: aura67,
    formato: 'pequeno',
    selo: 'GIF DE ALTA TECNOLOGIA',
  },
  {
    id: 'listening',
    titulo: 'Taihen is listening',
    descricao:
      'Aviso oficial: toda frase dita perto da Tai pode ser ouvida, arquivada e transformada em meme sem aviso prévio.',
    categoria: 'documentos',
    tipo: 'imagem',
    src: taihenListening,
    formato: 'largo',
    selo: 'COMUNICADO OFICIAL',
  },
  {
    id: 'everybody-hates',
    titulo: 'Everybody Hates Taihen',
    descricao:
      'Adaptação não autorizada, orçamento de três reais e elenco escolhido durante uma pane coletiva.',
    categoria: 'memes',
    tipo: 'imagem',
    src: everybodyHates,
    formato: 'retrato',
    selo: 'PRIMEIRA TEMPORADA',
  },
  {
    id: 'perfil-proibido',
    titulo: 'O perfil proibido',
    descricao:
      'Uma conta, um seguidor, zero curtidas e energia suficiente para preocupar todo o departamento jurídico.',
    categoria: 'memes',
    tipo: 'imagem',
    src: perfilProibido,
    formato: 'largo',
    selo: 'ARQUIVO DA INTERNET',
  },
  {
    id: 'calendario',
    titulo: 'Calendário trabalhista da Tai',
    descricao:
      'Estudo científico comprovando que quinta e sábado são os únicos dias reconhecidos pela Constituição das Lives.',
    categoria: 'documentos',
    tipo: 'imagem',
    src: calendarioTai,
    formato: 'quadrado',
    selo: 'PLANEJAMENTO ESTRATÉGICO',
  },
  {
    id: 'compressao',
    titulo: 'A compressão final',
    descricao:
      'Momento exato em que a proporção da imagem desistiu de obedecer às leis da anatomia e do bom senso.',
    categoria: 'formas',
    tipo: 'imagem',
    src: compressaoFinal,
    formato: 'retrato',
    selo: 'FENÔMENO NÃO EXPLICADO',
  },
  {
    id: 'nota-sapo',
    titulo: 'Nota de pesar do Sapo',
    descricao:
      'Registro audiovisual sobre um sapo, uma espada de diamante e uma investigação que o Minecraft se recusou a comentar.',
    categoria: 'clipes',
    tipo: 'video',
    src: videoNotaSapo,
    poster: posterNotaSapo,
    formato: 'retrato',
    selo: 'REGISTRO AUDIOVISUAL Nº 001',
  },
  {
    id: 'brilho',
    titulo: 'Brilho em níveis perigosos',
    descricao:
      'Dez segundos de partículas, pequenas criaturas e uma iluminação capaz de reduzir a bateria de qualquer celular.',
    categoria: 'clipes',
    tipo: 'video',
    src: videoBrilho,
    poster: posterBrilho,
    formato: 'quadrado',
    selo: 'REGISTRO AUDIOVISUAL Nº 002',
  },
  {
    id: 'entidade',
    titulo: 'A Entidade da Banca',
    descricao:
      'A forma canônica usada quando a banca precisa parecer simpática antes de recolher todas as TaiCoins da vítima.',
    categoria: 'formas',
    tipo: 'imagem',
    src: entidadeBanca,
    formato: 'retrato',
    selo: 'FORMA PADRÃO',
  },
  {
    id: 'comandante',
    titulo: 'Comandante Suprema da Banca',
    descricao:
      'Prova definitiva de que um uniforme, uma expressão séria e um painel administrativo já formam um regime econômico.',
    categoria: 'formas',
    tipo: 'imagem',
    src: comandanteTaihen,
    formato: 'retrato',
    selo: 'FORMA MILITAR',
  },
  {
    id: 'mandioca',
    titulo: 'TaiMandioca',
    descricao:
      'Experimento agrícola que respondeu à pergunta que ninguém teve coragem de fazer: e se a mandioca tivesse consciência?',
    categoria: 'formas',
    tipo: 'imagem',
    src: taiMandioca,
    formato: 'largo',
    selo: 'FORMA AGRÍCOLA',
  },
  {
    id: 'infernal',
    titulo: 'Tai Infernal',
    descricao:
      'Registro obtido segundos antes de o orçamento de efeitos especiais pegar fogo e abrir um portal administrativo.',
    categoria: 'formas',
    tipo: 'imagem',
    src: taiInfernal,
    formato: 'largo',
    selo: 'FORMA DEMONÍACA',
  },
]

function RenderizarMidia({
  item,
  destaque = false,
}) {
  if (item.tipo === 'video') {
    return (
      <video
        className="museum-media"
        src={item.src}
        poster={item.poster || undefined}
        muted={destaque}
        autoPlay={destaque}
        loop={destaque}
        playsInline
        preload={destaque ? 'auto' : 'metadata'}
        controls={!destaque}
      />
    )
  }

  return (
    <img
      className="museum-media"
      src={item.src}
      alt={item.titulo}
      loading={destaque ? 'eager' : 'lazy'}
    />
  )
}

const MUSEUM_BUCKET = 'museum-community'
const MAX_MEDIA_BYTES = 50 * 1024 * 1024

const REACOES_MUSEU = [
  { key: 'mandioca', emoji: '🍠', label: 'Mandioca' },
  { key: 'fogo', emoji: '🔥', label: 'Fogo' },
  { key: 'sofrimento', emoji: '😭', label: 'Sofrimento' },
  { key: 'falencia', emoji: '💸', label: 'Falência' },
]

function socialVazio() {
  return {
    reactions: { mandioca: 0, fogo: 0, sofrimento: 0, falencia: 0 },
    total_reactions: 0,
    my_reaction: null,
    comments: [],
  }
}

function normalizarNomeArquivo(nome = 'arquivo') {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-120)
}

function formatarDataMuseu(valor) {
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

function MuseumPage({
  session,
  profile,
  onOpenAuth,
  onOpenProfile,
}) {
  const siteTexts = useSiteTexts()
  const [categoriaAtiva, setCategoriaAtiva] =
    useState('todos')
  const [itemAbertoId, setItemAbertoId] =
    useState(null)
  const [comunidade, setComunidade] = useState([])
  const [carregandoComunidade, setCarregandoComunidade] =
    useState(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaPost, setCategoriaPost] = useState('memes')
  const [arquivo, setArquivo] = useState(null)
  const [publicando, setPublicando] = useState(false)
  const [erroPublicacao, setErroPublicacao] = useState('')
  const [sucessoPublicacao, setSucessoPublicacao] = useState('')
  const [social, setSocial] = useState(socialVazio)
  const [carregandoSocial, setCarregandoSocial] = useState(false)
  const [erroSocial, setErroSocial] = useState('')
  const [comentario, setComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [destaqueId] = useState(
    () =>
      itensDoMuseu[
        Math.floor(Math.random() * itensDoMuseu.length)
      ].id,
  )

  async function carregarComunidade() {
    setCarregandoComunidade(true)

    const { data, error } = await supabase.rpc(
      'get_museum_posts_social',
    )

    if (error) {
      console.error('Falha ao carregar o museu da comunidade:', error)
      setComunidade([])
      setCarregandoComunidade(false)
      return
    }

    const convertidos = (Array.isArray(data) ? data : []).map(
      (post) => {
        const { data: publicData } = supabase.storage
          .from(MUSEUM_BUCKET)
          .getPublicUrl(post.media_path)

        return {
          id: `community-${post.id}`,
          postId: post.id,
          titulo: post.title,
          descricao: post.description || '',
          categoria: post.category,
          tipo: post.media_type,
          src: publicData?.publicUrl || '',
          poster: null,
          formato:
            post.media_type === 'video' ? 'largo' : 'quadrado',
          selo: 'ACERVO DA COMUNIDADE',
          community: true,
          authorName: post.author_name || 'Cliente da banca',
          authorId: post.user_id,
          canDelete: Boolean(post.can_delete),
          mediaPath: post.media_path,
          createdAt: post.created_at,
          reactionCount: Number(post.reaction_count) || 0,
          commentCount: Number(post.comment_count) || 0,
        }
      },
    )

    setComunidade(convertidos)
    setCarregandoComunidade(false)
  }

  useEffect(() => {
    void carregarComunidade()
  }, [session?.user?.id])

  async function carregarSocial(postId) {
    if (!postId) {
      setSocial(socialVazio())
      return
    }

    setCarregandoSocial(true)
    setErroSocial('')

    const { data, error } = await supabase.rpc('get_museum_post_social', {
      p_post_id: postId,
    })

    if (error) {
      console.error('Falha ao carregar interações do Museu:', error)
      setErroSocial(
        error.message || 'A banca perdeu a ata de comentários desta relíquia.',
      )
      setSocial(socialVazio())
      setCarregandoSocial(false)
      return
    }

    const payload = data && typeof data === 'object' ? data : {}
    setSocial({
      reactions: {
        mandioca: Number(payload?.reactions?.mandioca) || 0,
        fogo: Number(payload?.reactions?.fogo) || 0,
        sofrimento: Number(payload?.reactions?.sofrimento) || 0,
        falencia: Number(payload?.reactions?.falencia) || 0,
      },
      total_reactions: Number(payload?.total_reactions) || 0,
      my_reaction: payload?.my_reaction || null,
      comments: Array.isArray(payload?.comments) ? payload.comments : [],
    })
    setCarregandoSocial(false)
  }

  async function reagirAoPost(reactionKey) {
    if (!itemAberto?.community || !itemAberto?.postId) return

    if (!session?.user) {
      onOpenAuth?.()
      return
    }

    setErroSocial('')
    const { error } = await supabase.rpc('set_museum_reaction', {
      p_post_id: itemAberto.postId,
      p_reaction: reactionKey,
    })

    if (error) {
      console.error('Falha ao reagir no Museu:', error)
      setErroSocial(error.message || 'A reação foi confiscada antes de chegar ao arquivo.')
      return
    }

    await Promise.all([
      carregarSocial(itemAberto.postId),
      carregarComunidade(),
    ])
  }

  async function comentarNoPost(evento) {
    evento.preventDefault()

    if (!itemAberto?.community || !itemAberto?.postId) return
    if (!session?.user) {
      onOpenAuth?.()
      return
    }

    const texto = comentario.trim()
    if (!texto) return

    setEnviandoComentario(true)
    setErroSocial('')

    const { error } = await supabase.rpc('create_museum_comment', {
      p_post_id: itemAberto.postId,
      p_comment: texto,
    })

    if (error) {
      console.error('Falha ao comentar no Museu:', error)
      setErroSocial(error.message || 'O comentário foi recusado pela curadoria.')
      setEnviandoComentario(false)
      return
    }

    setComentario('')
    await Promise.all([
      carregarSocial(itemAberto.postId),
      carregarComunidade(),
    ])
    setEnviandoComentario(false)
  }

  async function removerComentario(item) {
    if (!item?.id || !item?.can_delete) return

    const confirmou = window.confirm('Remover este comentário do Museu?')
    if (!confirmou) return

    setErroSocial('')
    const { error } = await supabase.rpc('delete_museum_comment', {
      p_comment_id: item.id,
    })

    if (error) {
      console.error('Falha ao remover comentário:', error)
      setErroSocial(error.message || 'Não foi possível apagar o comentário.')
      return
    }

    await Promise.all([
      carregarSocial(itemAberto?.postId),
      carregarComunidade(),
    ])
  }

  const itensCurados = useMemo(
    () =>
      itensDoMuseu.map((item) => ({
        ...item,
        community: false,
        authorName: 'Curadoria TaihenBet',
      })),
    [],
  )

  const todosItens = useMemo(
    () => [...comunidade, ...itensCurados],
    [comunidade, itensCurados],
  )

  const destaque =
    todosItens.find((item) => item.id === destaqueId) ||
    todosItens[0] ||
    null

  const itensFiltrados = useMemo(
    () =>
      categoriaAtiva === 'todos'
        ? todosItens
        : todosItens.filter(
            (item) => item.categoria === categoriaAtiva,
          ),
    [categoriaAtiva, todosItens],
  )

  const itemAberto =
    todosItens.find((item) => item.id === itemAbertoId) || null

  useEffect(() => {
    setComentario('')
    setErroSocial('')
    if (itemAberto?.community && itemAberto?.postId) {
      void carregarSocial(itemAberto.postId)
    } else {
      setSocial(socialVazio())
    }
  }, [itemAberto?.postId, session?.user?.id])

  useEffect(() => {
    if (!itemAberto) return undefined

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function fecharComEsc(evento) {
      if (evento.key === 'Escape') setItemAbertoId(null)
    }

    window.addEventListener('keydown', fecharComEsc)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', fecharComEsc)
    }
  }, [itemAberto])

  function navegarItem(direcao) {
    if (!itemAberto || todosItens.length === 0) return

    const indiceAtual = todosItens.findIndex(
      (item) => item.id === itemAberto.id,
    )
    const novoIndice =
      (indiceAtual + direcao + todosItens.length) % todosItens.length

    setItemAbertoId(todosItens[novoIndice].id)
  }

  function abrirPublicacao() {
    setErroPublicacao('')
    setSucessoPublicacao('')

    if (!session?.user) {
      onOpenAuth?.()
      return
    }

    setComposerOpen((aberto) => !aberto)
  }

  async function publicarNoMuseu(evento) {
    evento.preventDefault()

    if (!session?.user) {
      onOpenAuth?.()
      return
    }

    setErroPublicacao('')
    setSucessoPublicacao('')

    const tituloFinal = titulo.trim()
    const descricaoFinal = descricao.trim()

    if (!tituloFinal) {
      setErroPublicacao('Dê um nome para a relíquia.')
      return
    }

    if (!arquivo) {
      setErroPublicacao('Escolha uma imagem ou vídeo.')
      return
    }

    if (
      !arquivo.type.startsWith('image/') &&
      !arquivo.type.startsWith('video/')
    ) {
      setErroPublicacao('O Museu aceita apenas imagens e vídeos.')
      return
    }

    if (arquivo.size > MAX_MEDIA_BYTES) {
      setErroPublicacao('O arquivo precisa ter no máximo 50 MB.')
      return
    }

    const mediaType = arquivo.type.startsWith('video/')
      ? 'video'
      : 'imagem'
    const nomeSeguro = normalizarNomeArquivo(arquivo.name)
    const mediaPath = `${session.user.id}/${crypto.randomUUID()}-${nomeSeguro}`

    setPublicando(true)

    const { error: uploadError } = await supabase.storage
      .from(MUSEUM_BUCKET)
      .upload(mediaPath, arquivo, {
        upsert: false,
        cacheControl: '3600',
        contentType: arquivo.type,
      })

    if (uploadError) {
      console.error('Falha ao enviar mídia:', uploadError)
      setErroPublicacao(
        uploadError.message || 'A banca recusou o upload.',
      )
      setPublicando(false)
      return
    }

    const { error: postError } = await supabase.rpc(
      'create_museum_post',
      {
        p_title: tituloFinal,
        p_description: descricaoFinal,
        p_category: categoriaPost,
        p_media_type: mediaType,
        p_media_path: mediaPath,
      },
    )

    if (postError) {
      console.error('Falha ao registrar relíquia:', postError)
      await supabase.storage.from(MUSEUM_BUCKET).remove([mediaPath])
      setErroPublicacao(
        postError.message || 'Não foi possível publicar a relíquia.',
      )
      setPublicando(false)
      return
    }

    setTitulo('')
    setDescricao('')
    setArquivo(null)
    setCategoriaPost('memes')
    setSucessoPublicacao('Relíquia arquivada com sucesso.')
    setComposerOpen(false)
    await carregarComunidade()
    setPublicando(false)
  }

  async function removerPublicacao(item) {
    if (!item?.community || !item?.postId || !item?.canDelete) return

    const confirmou = window.confirm(
      'Remover esta publicação do Museu? Esta ação não pode ser desfeita.',
    )

    if (!confirmou) return

    if (item.mediaPath) {
      const { error: storageError } = await supabase.storage
        .from(MUSEUM_BUCKET)
        .remove([item.mediaPath])

      if (storageError) {
        console.error('Falha ao remover mídia:', storageError)
        setErroPublicacao(
          'A mídia não pôde ser removida do arquivo da banca.',
        )
        return
      }
    }

    const { error } = await supabase.rpc('delete_museum_post', {
      p_post_id: item.postId,
    })

    if (error) {
      console.error('Falha ao remover publicação:', error)
      setErroPublicacao(error.message || 'Não foi possível remover.')
      return
    }

    setItemAbertoId(null)
    await carregarComunidade()
  }

  const totalVideos = todosItens.filter(
    (item) => item.tipo === 'video',
  ).length

  return (
    <section className="museum-page">
      {itemAberto && (
        <div
          className="museum-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={itemAberto.titulo}
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              setItemAbertoId(null)
            }
          }}
        >
          <button
            type="button"
            className="museum-lightbox-close"
            onClick={() => setItemAbertoId(null)}
            aria-label="Fechar"
          >
            ×
          </button>

          <button
            type="button"
            className="museum-lightbox-arrow previous"
            onClick={() => navegarItem(-1)}
            aria-label="Item anterior"
          >
            ‹
          </button>

          <div className="museum-lightbox-card">
            <div
              className={`museum-lightbox-media ${itemAberto.formato}`}
            >
              <RenderizarMidia key={itemAberto.id} item={itemAberto} />
            </div>

            <div className={`museum-lightbox-copy ${itemAberto.community ? 'has-social' : ''}`}>
              <span>{itemAberto.selo}</span>
              <h2>{itemAberto.titulo}</h2>
              <p>{itemAberto.descricao}</p>

              <div className="museum-author-line">
                {itemAberto.community && itemAberto.authorId && onOpenProfile ? (
                  <button
                    type="button"
                    className="museum-author-profile-button"
                    onClick={() => onOpenProfile(itemAberto.authorId)}
                  >
                    {itemAberto.authorName}
                  </button>
                ) : (
                  <strong>{itemAberto.authorName}</strong>
                )}
                <small>
                  {itemAberto.community ? 'PUBLICADO POR' : 'ARQUIVADO POR'}
                  {itemAberto.createdAt
                    ? ` · ${formatarDataMuseu(itemAberto.createdAt)}`
                    : ''}
                </small>
              </div>

              <small>
                ITEM{' '}
                {String(
                  todosItens.findIndex(
                    (item) => item.id === itemAberto.id,
                  ) + 1,
                ).padStart(2, '0')}{' '}
                / {String(todosItens.length).padStart(2, '0')}
              </small>

              {itemAberto.community && (
                <section className="museum-social-panel">
                  <div className="museum-social-heading">
                    <div>
                      <span>INTERAÇÕES DO ACERVO</span>
                      <strong>Reações e depoimentos</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => void carregarSocial(itemAberto.postId)}
                      disabled={carregandoSocial}
                    >
                      {carregandoSocial ? 'Atualizando...' : 'Atualizar'}
                    </button>
                  </div>

                  <div className="museum-reactions">
                    {REACOES_MUSEU.map((reacao) => (
                      <button
                        type="button"
                        key={reacao.key}
                        className={social.my_reaction === reacao.key ? 'active' : ''}
                        onClick={() => reagirAoPost(reacao.key)}
                      >
                        <span>{reacao.emoji}</span>
                        <strong>{social.reactions[reacao.key] || 0}</strong>
                        <small>{reacao.label}</small>
                      </button>
                    ))}
                  </div>

                  {erroSocial && <p className="museum-social-error">{erroSocial}</p>}

                  <form className="museum-comment-form" onSubmit={comentarNoPost}>
                    <textarea
                      value={comentario}
                      maxLength={600}
                      onChange={(evento) => setComentario(evento.target.value)}
                      placeholder={session?.user ? 'Deixe um parecer técnico questionável...' : 'Entre para comentar nesta relíquia.'}
                      disabled={!session?.user || enviandoComentario}
                    />
                    <div>
                      <small>{comentario.length}/600</small>
                      <button
                        type="submit"
                        disabled={!session?.user || enviandoComentario || !comentario.trim()}
                        onClick={(evento) => {
                          if (!session?.user) {
                            evento.preventDefault()
                            onOpenAuth?.()
                          }
                        }}
                      >
                        {enviandoComentario ? 'Arquivando...' : 'Comentar'}
                      </button>
                    </div>
                  </form>

                  {!session?.user && (
                    <button type="button" className="museum-social-login" onClick={() => onOpenAuth?.()}>
                      Entrar para reagir e comentar
                    </button>
                  )}

                  <div className="museum-comment-list">
                    {carregandoSocial && social.comments.length === 0 ? (
                      <div className="museum-social-empty">Consultando depoimentos...</div>
                    ) : social.comments.length === 0 ? (
                      <div className="museum-social-empty">Nenhum comentário. O silêncio ainda é juridicamente seguro.</div>
                    ) : (
                      social.comments.map((item) => (
                        <article className="museum-comment" key={item.id}>
                          <div className="museum-comment-head">
                            {item.user_id && onOpenProfile ? (
                              <button type="button" onClick={() => onOpenProfile(item.user_id)}>
                                {item.author_name}
                              </button>
                            ) : (
                              <strong>{item.author_name}</strong>
                            )}
                            <small>{formatarDataMuseu(item.created_at)}</small>
                          </div>
                          <p>{item.comment}</p>
                          {item.can_delete && (
                            <button
                              type="button"
                              className="museum-comment-delete"
                              onClick={() => removerComentario(item)}
                            >
                              Remover comentário
                            </button>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </section>
              )}

              {itemAberto.community && itemAberto.canDelete && (
                <button
                  type="button"
                  className="museum-delete-post"
                  onClick={() => removerPublicacao(itemAberto)}
                >
                  Remover publicação
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            className="museum-lightbox-arrow next"
            onClick={() => navegarItem(1)}
            aria-label="Próximo item"
          >
            ›
          </button>
        </div>
      )}

      <header className="museum-hero">
        <div className="museum-hero-copy">
          <span className="museum-eyebrow">
            {siteTexts['museum.eyebrow'] || 'ACERVO ABERTO DA COMUNIDADE'}
          </span>

          <h1>{siteTexts['museum.title'] || 'Museu da Taihen'}</h1>

          <p>
            {siteTexts['museum.description'] ||
              'O arquivo agora é coletivo. Quem tiver conta pode registrar imagens, vídeos e descrições — e a autoria fica presa à ficha criminal de quem publicou.'}
          </p>

          <div className="museum-stats">
            <div>
              <strong>{todosItens.length}</strong>
              <span>relíquias</span>
            </div>
            <div>
              <strong>{totalVideos}</strong>
              <span>vídeos</span>
            </div>
            <div>
              <strong>{comunidade.length}</strong>
              <span>da comunidade</span>
            </div>
          </div>

          <button
            type="button"
            className="museum-community-cta"
            onClick={abrirPublicacao}
          >
            {session?.user ? '+ Depositar uma relíquia' : 'Entrar para publicar'}
          </button>
        </div>

        {destaque && (
          <button
            type="button"
            className="museum-featured"
            onClick={() => setItemAbertoId(destaque.id)}
          >
            <div className={`museum-featured-media ${destaque.formato}`}>
              <RenderizarMidia item={destaque} destaque />
              <span>RELÍQUIA ALEATÓRIA DA VISITA</span>
            </div>

            <div>
              <small>{destaque.selo}</small>
              <strong>{destaque.titulo}</strong>
              <p>{destaque.descricao}</p>
              <em className="museum-featured-author">
                por {destaque.authorName}
              </em>
            </div>
          </button>
        )}
      </header>

      {composerOpen && session?.user && (
        <form className="museum-community-composer" onSubmit={publicarNoMuseu}>
          <div className="museum-composer-heading">
            <div>
              <span>NOVA PEÇA DO ACERVO</span>
              <h2>Registrar evidência</h2>
              <p>
                Publicando como <strong>{profile?.username || 'sua conta'}</strong>.
              </p>
            </div>
            <button type="button" onClick={() => setComposerOpen(false)}>
              ×
            </button>
          </div>

          <div className="museum-composer-grid">
            <label>
              <span>Título</span>
              <input
                value={titulo}
                maxLength={90}
                onChange={(evento) => setTitulo(evento.target.value)}
                placeholder="Ex.: O incidente da live de terça"
                required
              />
            </label>

            <label>
              <span>Setor</span>
              <select
                value={categoriaPost}
                onChange={(evento) => setCategoriaPost(evento.target.value)}
              >
                <option value="memes">Memes da comunidade</option>
                <option value="clipes">Clipes históricos</option>
                <option value="documentos">Documentos oficiais</option>
                <option value="formas">Formas alternativas</option>
              </select>
            </label>
          </div>

          <label className="museum-composer-description">
            <span>Descrição</span>
            <textarea
              value={descricao}
              maxLength={1200}
              onChange={(evento) => setDescricao(evento.target.value)}
              placeholder="Contextualize este crime cultural para as futuras gerações..."
            />
          </label>

          <label className="museum-file-picker">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={(evento) => setArquivo(evento.target.files?.[0] || null)}
            />
            <strong>{arquivo ? arquivo.name : 'Escolher imagem ou vídeo'}</strong>
            <span>JPG, PNG, WEBP, GIF, MP4, WEBM ou MOV · até 50 MB</span>
          </label>

          {erroPublicacao && <p className="museum-form-error">{erroPublicacao}</p>}

          <button
            type="submit"
            className="museum-publish-button"
            disabled={publicando}
          >
            {publicando ? 'Arquivando...' : 'Publicar no Museu'}
          </button>
        </form>
      )}

      {sucessoPublicacao && (
        <div className="museum-form-success">{sucessoPublicacao}</div>
      )}
      {erroPublicacao && !composerOpen && (
        <div className="museum-form-error museum-form-error-banner">
          {erroPublicacao}
        </div>
      )}

      <div className="museum-disclaimer">
        <strong>{siteTexts['museum.disclaimer_title'] || 'AVISO DO CURADOR:'}</strong>
        <span>
          {siteTexts['museum.disclaimer'] ||
            'Cada publicação da comunidade exibe o nome da conta responsável. O autor pode apagar o próprio conteúdo e a administração pode remover material do acervo quando necessário.'}
        </span>
      </div>

      <div className="museum-toolbar">
        <div>
          <span>SETORES DO MUSEU</span>
          <h2>Escolha o tipo de relíquia</h2>
        </div>

        <div className="museum-filters">
          {categorias.map((categoria) => (
            <button
              type="button"
              key={categoria.id}
              className={categoriaAtiva === categoria.id ? 'active' : ''}
              onClick={() => setCategoriaAtiva(categoria.id)}
            >
              {categoria.nome}
            </button>
          ))}
          <button type="button" onClick={() => void carregarComunidade()}>
            Atualizar
          </button>
        </div>
      </div>

      {carregandoComunidade && (
        <div className="museum-community-loading">
          Consultando os arquivos da comunidade...
        </div>
      )}

      <div className="museum-wall">
        {itensFiltrados.map((item, indice) => (
          <button
            type="button"
            className={`museum-item ${item.formato}`}
            key={item.id}
            onClick={() => setItemAbertoId(item.id)}
          >
            <div className="museum-item-media">
              {item.tipo === 'video' ? (
                item.poster ? (
                  <img src={item.poster} alt={item.titulo} loading="lazy" />
                ) : (
                  <video
                    src={item.src}
                    muted
                    playsInline
                    preload="metadata"
                  />
                )
              ) : (
                <img src={item.src} alt={item.titulo} loading="lazy" />
              )}

              {item.tipo === 'video' && (
                <span className="museum-play-icon">▶</span>
              )}

              <span className="museum-item-number">
                {String(indice + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="museum-item-copy">
              <small>{item.selo}</small>
              <h3>{item.titulo}</h3>
              <p>{item.descricao}</p>
              <div className="museum-card-author">
                <span>{item.community ? 'POSTADO POR' : 'CURADORIA'}</span>
                {item.community && item.authorId && onOpenProfile ? (
                  <strong
                    className="museum-card-author-link"
                    role="button"
                    tabIndex={0}
                    onClick={(evento) => {
                      evento.stopPropagation()
                      onOpenProfile(item.authorId)
                    }}
                    onKeyDown={(evento) => {
                      if (evento.key === 'Enter' || evento.key === ' ') {
                        evento.preventDefault()
                        evento.stopPropagation()
                        onOpenProfile(item.authorId)
                      }
                    }}
                  >
                    {item.authorName}
                  </strong>
                ) : (
                  <strong>{item.authorName}</strong>
                )}
              </div>
              {item.community && (
                <div className="museum-card-social">
                  <span>♡ {item.reactionCount || 0}</span>
                  <span>💬 {item.commentCount || 0}</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <footer className="museum-footer-note">
        <strong>O ACERVO NÃO TERMINA MAIS AQUI</strong>
        <p>
          Agora qualquer conta autenticada pode contribuir com novas provas,
          clipes, deformações e documentos questionáveis.
        </p>
      </footer>
    </section>
  )
}

export default MuseumPage
