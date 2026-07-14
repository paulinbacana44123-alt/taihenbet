import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import './MuseumPage.css'

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
import videoJeffersonCaminhoes from '../assets/museu-jefferson-caminhoes.mp4'
import posterJeffersonCaminhoes from '../assets/museu-jefferson-caminhoes-poster.jpg'
import videoTaiBaixinha from '../assets/museu-baixinha.mp4'
import posterTaiBaixinha from '../assets/museu-baixinha-poster.jpg'

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
    titulo: 'MOSTRA O COSTO',
    descricao:
      'Uma mensagem enigmática e profunda, até hoje o departamento policial tenta entender o que esse pequeno coágulo tentou dizer.',
    categoria: 'memes',
    tipo: 'imagem',
    src: custoTai,
    formato: 'largo',
    selo: 'RELÍQUIA Nº 001',
  },
  {
    id: 'nao-de-agua',
    titulo: 'NÃO DÊ NEM ÁGUA',
    descricao:
      'Mandado de captura emitido pelo Ministério da Arquitetura e dos Recursos Hídricos.',
    categoria: 'documentos',
    tipo: 'imagem',
    src: naoDeAgua,
    formato: 'quadrado',
    selo: 'DOCUMENTO CONFIDENCIAL',
  },
  {
    id: 'aura-67',
    titulo: 'AURA MONSTER',
    descricao:
      'Bandido quer chocolex, bandido quer chocolex e resenhax, na ceia de natal todo mundo resenhax no clubex.',
    categoria: 'formas',
    tipo: 'imagem',
    src: aura67,
    formato: 'pequeno',
    selo: 'GIF DE ALTA TECNOLOGIA',
  },
  {
    id: 'listening',
    titulo: 'TAIHEN IS LISTENING',
    descricao:
      'Você não pode me ouvir porque eu nem to falando nada, eu só to escrevendo, se fodeu KKKKKKKKKKK.',
    categoria: 'documentos',
    tipo: 'imagem',
    src: taihenListening,
    formato: 'largo',
    selo: 'COMUNICADO OFICIAL',
  },
  {
    id: 'everybody-hates',
    titulo: 'EVERYBODY HATES TAI',
    descricao:
      'Um dos melhores seriados de todos os tempos, que tem o mesmo orçamento que a placa de vídeo da Tai, ou seja, uns 100 reais no máximo.',
    categoria: 'memes',
    tipo: 'imagem',
    src: everybodyHates,
    formato: 'retrato',
    selo: 'PRIMEIRA TEMPORADA',
  },
  {
    id: 'perfil-proibido',
    titulo: 'HENTAISZ',
    descricao:
      'O que? É o nome do perfil, não olhe estranho pra mim, reclama com quem fez.',
    categoria: 'memes',
    tipo: 'imagem',
    src: perfilProibido,
    formato: 'largo',
    selo: 'ARQUIVO DA INTERNET',
  },
  {
    id: 'calendario',
    titulo: 'CALENDÁRIO TRABALHISTA DA TAI',
    descricao:
      'Tem mais símbolos vermelhos do que a prova teórica do Detran nas questões de placas de trânsito.',
    categoria: 'documentos',
    tipo: 'imagem',
    src: calendarioTai,
    formato: 'quadrado',
    selo: 'PLANEJAMENTO ESTRATÉGICO',
  },
  {
    id: 'compressao',
    titulo: 'TAI BUGADA',
    descricao:
      'Eu não sei porque, mas na minha cabeça, seu modelo nesse formato ficou parecendo aqueles tubos de ensaio que os cientistas usam.',
    categoria: 'formas',
    tipo: 'imagem',
    src: compressaoFinal,
    formato: 'retrato',
    selo: 'FENÔMENO NÃO EXPLICADO',
  },
  {
    id: 'nota-sapo',
    titulo: 'DESCANSE EM PAZ',
    descricao:
      'Morto, mas jamais esquecido, por que você fez isso Tai? PORQUE ELE E NÃO EU?',
    categoria: 'clipes',
    tipo: 'video',
    src: videoNotaSapo,
    poster: posterNotaSapo,
    formato: 'retrato',
    selo: 'REGISTRO AUDIOVISUAL Nº 001',
  },
  {
    id: 'brilho',
    titulo: 'TAI CICLOPE',
    descricao:
      'Ficou parecendo aquele ovo do gato de botas KKKKKKKKKKKKKKK.',
    categoria: 'clipes',
    tipo: 'video',
    src: videoBrilho,
    poster: posterBrilho,
    formato: 'quadrado',
    selo: 'REGISTRO AUDIOVISUAL Nº 002',
  },
  {
    id: 'entidade',
    titulo: 'NEYTAI',
    descricao:
      'Talvez a coisa mais linda que eu já vi, depois do mundial do corinthians.',
    categoria: 'formas',
    tipo: 'imagem',
    src: entidadeBanca,
    formato: 'retrato',
    selo: 'FORMA PADRÃO',
  },
  {
    id: 'comandante',
    titulo: 'TAI DITADORA',
    descricao:
      'Por favor, não me machuque, eu tenho uma família pra sustentar, no minecraft, mas tenho.',
    categoria: 'formas',
    tipo: 'imagem',
    src: comandanteTaihen,
    formato: 'retrato',
    selo: 'FORMA MILITAR',
  },
  {
    id: 'mandioca',
    titulo: 'TAIMANDIOCA',
    descricao:
      'Definitivamente uma mandioca, acabou minha criatividade já.',
    categoria: 'formas',
    tipo: 'imagem',
    src: taiMandioca,
    formato: 'largo',
    selo: 'FORMA AGRÍCOLA',
  },
  {
    id: 'infernal',
    titulo: 'TAI DO INFERNO',
    descricao:
      'Antes ditadora e agora rainha do inferno, eu diria que você sofreu um upgrade na sua carreira, parabéns, eu acho.',
    categoria: 'formas',
    tipo: 'imagem',
    src: taiInfernal,
    formato: 'largo',
    selo: 'FORMA DEMONÍACA',
  },
  {
    id: 'jefferson-caminhoes',
    titulo: 'JEFFERSON CAMINHÕES',
    descricao:
      'Uma interação meio estranha, mas cada um com seus gostos ai né.',
    categoria: 'clipes',
    tipo: 'video',
    src: videoJeffersonCaminhoes,
    poster: posterJeffersonCaminhoes,
    formato: 'retrato',
    selo: 'REGISTRO AUDIOVISUAL Nº 003',
  },
  {
    id: 'taihen-baixinha',
    titulo: 'TAIHEN É MUITO BAIXINHA',
    descricao:
      'Acho que agora sim chegamos no fundo do poço, obrigado a todos que chegaram até aqui, eu irei me jogar de um dirigível(É meme).',
    categoria: 'clipes',
    tipo: 'video',
    src: videoTaiBaixinha,
    poster: posterTaiBaixinha,
    formato: 'retrato',
    selo: 'REGISTRO AUDIOVISUAL Nº 004',
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
        poster={item.poster}
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

function MuseumPage() {
  const [categoriaAtiva, setCategoriaAtiva] =
    useState('todos')
  const [itemAbertoId, setItemAbertoId] =
    useState(null)
  const [destaqueId] = useState(
    () =>
      itensDoMuseu[
        Math.floor(
          Math.random() * itensDoMuseu.length,
        )
      ].id,
  )

  const destaque =
    itensDoMuseu.find(
      (item) => item.id === destaqueId,
    ) || itensDoMuseu[0]

  const itensFiltrados = useMemo(
    () =>
      categoriaAtiva === 'todos'
        ? itensDoMuseu
        : itensDoMuseu.filter(
            (item) =>
              item.categoria === categoriaAtiva,
          ),
    [categoriaAtiva],
  )

  const itemAberto =
    itensDoMuseu.find(
      (item) => item.id === itemAbertoId,
    ) || null

  useEffect(() => {
    if (!itemAberto) {
      return undefined
    }

    const overflowAnterior =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    function fecharComEsc(evento) {
      if (evento.key === 'Escape') {
        setItemAbertoId(null)
      }
    }

    window.addEventListener('keydown', fecharComEsc)

    return () => {
      document.body.style.overflow =
        overflowAnterior
      window.removeEventListener(
        'keydown',
        fecharComEsc,
      )
    }
  }, [itemAberto])

  function navegarItem(direcao) {
    if (!itemAberto) {
      return
    }

    const indiceAtual = itensDoMuseu.findIndex(
      (item) => item.id === itemAberto.id,
    )

    const novoIndice =
      (indiceAtual +
        direcao +
        itensDoMuseu.length) %
      itensDoMuseu.length

    setItemAbertoId(
      itensDoMuseu[novoIndice].id,
    )
  }

  return (
    <section className="museum-page">
      {itemAberto && (
        <div
          className="museum-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={itemAberto.titulo}
          onMouseDown={(evento) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
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
              <RenderizarMidia
                key={itemAberto.id}
                item={itemAberto}
              />
            </div>

            <div className="museum-lightbox-copy">
              <span>{itemAberto.selo}</span>
              <h2>{itemAberto.titulo}</h2>
              <p>{itemAberto.descricao}</p>

              <small>
                ITEM{' '}
                {String(
                  itensDoMuseu.findIndex(
                    (item) =>
                      item.id === itemAberto.id,
                  ) + 1,
                ).padStart(2, '0')}{' '}
                /{' '}
                {String(
                  itensDoMuseu.length,
                ).padStart(2, '0')}
              </small>
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

      <header
        className="museum-hero"
        data-neytai-target="museum-page"
      >
        <div className="museum-hero-copy">
          <span className="museum-eyebrow">
            ACERVO NÃO OFICIAL DA COMUNIDADE
          </span>

          <h1>
            Museu da
            <br />
            <b>Taihen</b>
          </h1>

          <p>
            As melhores fotos e vídeos da Tai — ao menos
            os que eu tive competência de achar e que o
            Pietro me mandou.
          </p>

          <div className="museum-stats">
            <div>
              <strong>{itensDoMuseu.length}</strong>
              <span>relíquias</span>
            </div>

            <div>
              <strong>
                {
                  itensDoMuseu.filter(
                    (item) =>
                      item.tipo === 'video',
                  ).length
                }
              </strong>
              <span>vídeos</span>
            </div>

            <div>
              <strong>
                {
                  categorias.filter(
                    (categoria) =>
                      categoria.id !== 'todos',
                  ).length
                }
              </strong>
              <span>setores</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="museum-featured"
          onClick={() =>
            setItemAbertoId(destaque.id)
          }
        >
          <div
            className={`museum-featured-media ${destaque.formato}`}
          >
            <RenderizarMidia
              item={destaque}
              destaque
            />

            <span>
              RELÍQUIA ALEATÓRIA DA VISITA
            </span>
          </div>

          <div>
            <small>{destaque.selo}</small>
            <strong>{destaque.titulo}</strong>
            <p>{destaque.descricao}</p>
          </div>
        </button>
      </header>

      <div className="museum-disclaimer">
        <strong>AVISO DO CURADOR:</strong>
        <span>
          Acervo feito por brincadeira com conteúdos
          encontrados ou enviados pela comunidade. Nenhuma
          peça possui valor histórico, embora algumas tenham
          causado danos culturais permanentes.
        </span>
      </div>

      <div className="museum-toolbar">
        <div>
          <span>SETORES DO MUSEU</span>
          <h2>Escolha o tipo de relíquia</h2>
        </div>

        <div
          className="museum-filters"
          data-neytai-target="museum-filters"
        >
          {categorias.map((categoria) => (
            <button
              type="button"
              key={categoria.id}
              className={
                categoriaAtiva === categoria.id
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setCategoriaAtiva(categoria.id)
              }
            >
              {categoria.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="museum-wall">
        {itensFiltrados.map((item, indice) => (
          <button
            type="button"
            className={`museum-item ${item.formato}`}
            key={item.id}
            onClick={() =>
              setItemAbertoId(item.id)
            }
          >
            <div className="museum-item-media">
              {item.tipo === 'video' ? (
                <>
                  <img
                    src={item.poster}
                    alt={item.titulo}
                    loading="lazy"
                  />

                  <span className="museum-play-icon">
                    ▶
                  </span>
                </>
              ) : (
                <img
                  src={item.src}
                  alt={item.titulo}
                  loading="lazy"
                />
              )}

              <span className="museum-item-number">
                {String(indice + 1).padStart(
                  2,
                  '0',
                )}
              </span>
            </div>

            <div className="museum-item-copy">
              <small>{item.selo}</small>
              <h3>{item.titulo}</h3>
              <p>{item.descricao}</p>
            </div>
          </button>
        ))}
      </div>

      <footer className="museum-footer-note">
        <strong>FIM TEMPORÁRIO DO ACERVO</strong>
        <p>
          O museu continuará aceitando novas provas, clipes,
          deformações e documentos que jamais deveriam ter
          sobrevivido ao grupo do Discord.
        </p>
      </footer>
    </section>
  )
}

export default MuseumPage
