import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import './AnimationArchivePanel.css'

import entidadeBanca from '../assets/entidade-banca.png'
import neytaiAssistente from '../assets/neytai-assistente.png'
import taiMandioca from '../assets/taihen-mandioca.png'
import mandiocaNormal from '../assets/mandioca-normal.jpeg'
import paquetaMeme from '../assets/paqueta-meme.jpg'
import taihenDitadora from '../assets/taihen-ditadora.png'
import fiscalRegime from '../assets/mbappe-ditador.jpg'
import sapoMinecraft from '../assets/sapo-minecraft.webp'

import silenceSuzuka from '../assets/silence-suzuka.png'
import tokaiTeio from '../assets/tokai-teio.png'
import mejiroMcqueen from '../assets/mejiro-mcqueen.jpg'
import goldShip from '../assets/gold-ship.jpg'
import matikanetannhauser from '../assets/matikanetannhauser.jpg'
import meishoDoto from '../assets/meisho-doto.jpg'

import posterNotaSapo from '../assets/museu-nota-sapo-poster.jpg'
import posterBrilho from '../assets/museu-brilho-poster.jpg'
import posterJefferson from '../assets/museu-jefferson-caminhoes-poster.jpg'
import posterBaixinha from '../assets/museu-baixinha-poster.jpg'

import videoFalencia from '../assets/zero-taicoins.mp4'
import videoAnuncio1 from '../assets/anuncio-20-taicoins.mp4'
import videoAnuncio2 from '../assets/anuncio-20-taicoins-2.mp4'
import videoMegaGanho from '../assets/taigrinho-megawin.mp4'

import videoSilenceSuzuka from '../assets/silence-suzuka-vitoria.mp4'
import videoTokaiTeio from '../assets/tokai-teio-vitoria.mp4'
import videoMejiroMcqueen from '../assets/mejiro-mcqueen-vitoria.mp4'
import videoGoldShip from '../assets/gold-ship-vitoria.mp4'
import videoMatikanetannhauser from '../assets/matikanetannhauser-vitoria.mp4'
import videoMeishoDoto from '../assets/meisho-doto-vitoria.mp4'

import videoNotaSapo from '../assets/museu-nota-sapo.mp4'
import videoBrilho from '../assets/museu-brilho.mp4'
import videoJefferson from '../assets/museu-jefferson-caminhoes.mp4'
import videoBaixinha from '../assets/museu-baixinha.mp4'

const categorias = [
  {
    id: 'todas',
    nome: 'Todas',
  },
  {
    id: 'sistema',
    nome: 'Sistema',
  },
  {
    id: 'taimandioca',
    nome: 'TaiMandioca',
  },
  {
    id: 'taigrinho',
    nome: 'Taigrinho',
  },
  {
    id: 'crash',
    nome: 'Crash',
  },
  {
    id: 'derby',
    nome: 'Derby',
  },
  {
    id: 'museu',
    nome: 'Museu',
  },
]

const itens = [
  {
    id: 'aviso-antiapostas',
    categoria: 'sistema',
    titulo: 'Aviso antiapostas',
    descricao:
      'A tela que aparece antes de toda a irresponsabilidade fictícia começar.',
    tipo: 'animacao',
    variante: 'aviso',
    miniatura: entidadeBanca,
    selo: 'ABERTURA',
  },
  {
    id: 'entrada-neytai',
    categoria: 'sistema',
    titulo: 'Entrada do Neytai',
    descricao:
      'A aparição oficial do funcionário encarregado de explicar o inexplicável.',
    tipo: 'animacao',
    variante: 'neytai',
    miniatura: neytaiAssistente,
    selo: 'ASSISTENTE',
  },
  {
    id: 'carta-final',
    categoria: 'sistema',
    titulo: 'Carta final',
    descricao:
      'A rara animação em que o site para de fazer piada durante alguns segundos.',
    tipo: 'animacao',
    variante: 'carta',
    miniatura: entidadeBanca,
    selo: 'EPÍLOGO',
  },
  {
    id: 'bonus-diario',
    categoria: 'sistema',
    titulo: 'Bênção diária',
    descricao:
      'A Entidade distribuindo dinheiro que não existe para financiar decisões ruins.',
    tipo: 'animacao',
    variante: 'bonus',
    miniatura: entidadeBanca,
    selo: 'ECONOMIA FICTÍCIA',
  },
  {
    id: 'falencia',
    categoria: 'sistema',
    titulo: 'Falência total',
    descricao:
      'O pronunciamento cinematográfico exibido quando o saldo chega a zero.',
    tipo: 'video',
    src: videoFalencia,
    miniatura: entidadeBanca,
    selo: 'VÍDEO DO SISTEMA',
  },
  {
    id: 'anuncio-1',
    categoria: 'sistema',
    titulo: 'Anúncio recompensado nº 1',
    descricao:
      'Publicidade obrigatoriamente opcional valendo vinte TaiCoins imaginárias.',
    tipo: 'video',
    src: videoAnuncio1,
    miniatura: entidadeBanca,
    selo: 'PROPAGANDA',
  },
  {
    id: 'anuncio-2',
    categoria: 'sistema',
    titulo: 'Anúncio recompensado nº 2',
    descricao:
      'A segunda peça publicitária do maior conglomerado econômico sem economia.',
    tipo: 'video',
    src: videoAnuncio2,
    miniatura: entidadeBanca,
    selo: 'PROPAGANDA',
  },
  {
    id: 'mandioca-segura',
    categoria: 'taimandioca',
    titulo: 'TaiMandioca encontrada',
    descricao:
      'A revelação segura de uma mandioca que teve a educação de nascer com rosto.',
    tipo: 'animacao',
    variante: 'mandioca-segura',
    miniatura: taiMandioca,
    selo: 'COLHEITA',
  },
  {
    id: 'mandioca-perfeita',
    categoria: 'taimandioca',
    titulo: 'Colheita perfeita',
    descricao:
      'O final raro para quem encontrou todas as TaiMandiocas sem cometer agricultura.',
    tipo: 'animacao',
    variante: 'mandioca-vitoria',
    miniatura: taiMandioca,
    selo: 'FINAL DE VITÓRIA',
  },
  {
    id: 'mandiocada',
    categoria: 'taimandioca',
    titulo: 'Mandiocada',
    descricao:
      'A animação dedicada a quem escolheu uma mandioca comum e pagou pela falta de bom gosto.',
    tipo: 'animacao',
    variante: 'mandioca-derrota',
    miniatura: mandiocaNormal,
    selo: 'FINAL DE DERROTA',
  },
  {
    id: 'giro-taigrinho',
    categoria: 'taigrinho',
    titulo: 'Giro dos rolos',
    descricao:
      'Uma simulação dos rolos girando antes de a banca escolher qual emoção será destruída.',
    tipo: 'animacao',
    variante: 'taigrinho-giro',
    miniatura: entidadeBanca,
    selo: 'GIRO',
  },
  {
    id: 'mega-ganho',
    categoria: 'taigrinho',
    titulo: 'Mega ganho',
    descricao:
      'A surpresa máxima do Taigrinho, agora disponível sem depender de sorte.',
    tipo: 'video',
    src: videoMegaGanho,
    miniatura: entidadeBanca,
    selo: 'FINAL DE VITÓRIA',
  },
  {
    id: 'derrota-taigrinho',
    categoria: 'taigrinho',
    titulo: 'Comunicado de derrota',
    descricao:
      'A banca agradecendo pelas TaiCoins com a delicadeza institucional de sempre.',
    tipo: 'animacao',
    variante: 'taigrinho-derrota',
    miniatura: paquetaMeme,
    selo: 'FINAL DE DERROTA',
  },
  {
    id: 'crash-subida',
    categoria: 'crash',
    titulo: 'Multiplicador em subida',
    descricao:
      'A setinha subindo enquanto o bom senso implora para você retirar.',
    tipo: 'animacao',
    variante: 'crash-subida',
    miniatura: taihenDitadora,
    selo: 'CORRIDA DO MULTIPLICADOR',
  },
  {
    id: 'crash-fuga',
    categoria: 'crash',
    titulo: 'Fuga do regime',
    descricao:
      'O final positivo em que você recolhe as TaiCoins antes do confisco.',
    tipo: 'animacao',
    variante: 'crash-fuga',
    miniatura: taihenDitadora,
    selo: 'FINAL DE VITÓRIA',
  },
  {
    id: 'crash-confisco',
    categoria: 'crash',
    titulo: 'Confisco do regime',
    descricao:
      'O fiscal chegando para explicar que propriedade privada era apenas uma sugestão.',
    tipo: 'animacao',
    variante: 'crash-confisco',
    miniatura: fiscalRegime,
    selo: 'FINAL DE DERROTA',
  },
  {
    id: 'corrida-derby',
    categoria: 'derby',
    titulo: 'Corrida do Taihen Derby',
    descricao:
      'A largada completa dos seis cavalinhos pocotó antes do resultado manipulado.',
    tipo: 'animacao',
    variante: 'derby-corrida',
    miniatura: matikanetannhauser,
    selo: 'CORRIDA',
  },
  {
    id: 'derby-silence-suzuka',
    categoria: 'derby',
    titulo: 'Silence Suzuka venceu',
    descricao:
      'Vídeo especial de vitória da fugitiva silenciosa.',
    tipo: 'video',
    src: videoSilenceSuzuka,
    miniatura: silenceSuzuka,
    selo: 'VITÓRIA DO DERBY',
  },
  {
    id: 'derby-tokai-teio',
    categoria: 'derby',
    titulo: 'Tokai Teio venceu',
    descricao:
      'Vídeo especial da soberana do Hachimi cruzando a chegada.',
    tipo: 'video',
    src: videoTokaiTeio,
    miniatura: tokaiTeio,
    selo: 'VITÓRIA DO DERBY',
  },
  {
    id: 'derby-mejiro',
    categoria: 'derby',
    titulo: 'Mejiro McQueen venceu',
    descricao:
      'Vídeo especial da corredora que aparentemente possui velocidade 95.',
    tipo: 'video',
    src: videoMejiroMcqueen,
    miniatura: mejiroMcqueen,
    selo: 'VITÓRIA DO DERBY',
  },
  {
    id: 'derby-gold-ship',
    categoria: 'derby',
    titulo: 'Gold Ship venceu',
    descricao:
      'Vídeo especial do caos de elite finalmente atravessando a linha.',
    tipo: 'video',
    src: videoGoldShip,
    miniatura: goldShip,
    selo: 'VITÓRIA DO DERBY',
  },
  {
    id: 'derby-mambo',
    categoria: 'derby',
    titulo: 'Matikanetannhauser venceu',
    descricao:
      'O vídeo mais provável do Derby. O Protocolo Mambo agradece sua colaboração.',
    tipo: 'video',
    src: videoMatikanetannhauser,
    miniatura: matikanetannhauser,
    selo: 'VITÓRIA DO DERBY',
  },
  {
    id: 'derby-meisho-doto',
    categoria: 'derby',
    titulo: 'Meisho Doto venceu',
    descricao:
      'Vídeo especial da esperança confusa realizando o impossível.',
    tipo: 'video',
    src: videoMeishoDoto,
    miniatura: meishoDoto,
    selo: 'VITÓRIA DO DERBY',
  },
  {
    id: 'museu-sapo',
    categoria: 'museu',
    titulo: 'DESCANSE EM PAZ',
    descricao:
      'O registro audiovisual do sapo que jamais será esquecido.',
    tipo: 'video',
    src: videoNotaSapo,
    miniatura: posterNotaSapo,
    selo: 'VÍDEO DO MUSEU',
  },
  {
    id: 'museu-ciclope',
    categoria: 'museu',
    titulo: 'TAI CICLOPE',
    descricao:
      'A relíquia oval que encerrou qualquer compromisso com proporções normais.',
    tipo: 'video',
    src: videoBrilho,
    miniatura: posterBrilho,
    selo: 'VÍDEO DO MUSEU',
  },
  {
    id: 'museu-jefferson',
    categoria: 'museu',
    titulo: 'JEFFERSON CAMINHÕES',
    descricao:
      'Uma interação estranha preservada para futuras gerações julgarem por conta própria.',
    tipo: 'video',
    src: videoJefferson,
    miniatura: posterJefferson,
    selo: 'VÍDEO DO MUSEU',
  },
  {
    id: 'museu-baixinha',
    categoria: 'museu',
    titulo: 'TAIHEN É MUITO BAIXINHA',
    descricao:
      'O fundo do poço audiovisual, agora com controles de reprodução.',
    tipo: 'video',
    src: videoBaixinha,
    miniatura: posterBaixinha,
    selo: 'VÍDEO DO MUSEU',
  },
]

function Particulas({
  quantidade = 20,
}) {
  return (
    <div
      className="animation-preview-particles"
      aria-hidden="true"
    >
      {Array.from(
        { length: quantidade },
        (_, indice) => (
          <span key={indice} />
        ),
      )}
    </div>
  )
}

function ConteudoAnimado({
  variante,
}) {
  if (variante === 'aviso') {
    return (
      <div className="archive-scene warning-scene">
        <div className="warning-scan" />
        <img src={entidadeBanca} alt="" />
        <span>ANTES DE CONTINUAR</span>
        <h2>ISTO É UMA PARÓDIA ANTIAPOSTAS</h2>
        <p>
          Sem dinheiro real, depósitos, saques ou prêmios.
        </p>
        <button type="button">Entendi, apostar é paia</button>
      </div>
    )
  }

  if (variante === 'neytai') {
    return (
      <div className="archive-scene neytai-scene">
        <div className="neytai-scene-glow" />
        <img src={neytaiAssistente} alt="" />
        <div>
          <span>ASSISTENTE PESSOAL</span>
          <h2>Neytai entrou no site</h2>
          <p>
            “Eu fui chamado porque aparentemente ninguém
            confiou na navegação.”
          </p>
        </div>
      </div>
    )
  }

  if (variante === 'carta') {
    return (
      <div className="archive-scene letter-scene">
        <div className="letter-paper">
          <span>PARA A TAI</span>
          <h2>
            Texto no qual eu fiquei com preguiça de pensar no
            título
          </h2>
          <p>
            O resto do site é uma grande piada. Esta página não
            é.
          </p>
          <strong>— Paulotário</strong>
        </div>
      </div>
    )
  }

  if (variante === 'bonus') {
    return (
      <div className="archive-scene bonus-scene">
        <Particulas quantidade={24} />
        <img src={entidadeBanca} alt="" />
        <span>BÊNÇÃO DIÁRIA RECEBIDA</span>
        <h2>+250 TaiCoins</h2>
        <p>Patrimônio sem valor financeiro adquirido.</p>
      </div>
    )
  }

  if (variante === 'mandioca-segura') {
    return (
      <div className="archive-scene cassava-safe-scene">
        <div className="cassava-card-reveal">
          <span>?</span>
          <img src={taiMandioca} alt="" />
        </div>
        <strong>TAI!</strong>
        <p>Uma mandioca aceitável foi encontrada.</p>
      </div>
    )
  }

  if (
    variante === 'mandioca-vitoria' ||
    variante === 'mandioca-derrota'
  ) {
    const ganhou = variante === 'mandioca-vitoria'

    return (
      <div
        className={`archive-scene cassava-result-scene ${
          ganhou ? 'won' : 'lost'
        }`}
      >
        <Particulas quantidade={18} />

        <div className="cassava-result-rings">
          <i />
          <i />
          <i />
        </div>

        <img
          src={ganhou ? taiMandioca : mandiocaNormal}
          alt=""
        />

        <span>RESULTADO DA COLHEITA</span>
        <h2>
          {ganhou
            ? 'COLHEITA PERFEITA!'
            : 'VOCÊ FOI MANDIOCADA'}
        </h2>
        <p>
          {ganhou
            ? 'Todas as TaiMandiocas foram encontradas.'
            : 'A mandioca normal ficou com a sua entrada.'}
        </p>
      </div>
    )
  }

  if (variante === 'taigrinho-giro') {
    const simbolos = [
      entidadeBanca,
      taiMandioca,
      sapoMinecraft,
    ]

    return (
      <div className="archive-scene slot-spin-scene">
        <span>GIRO EM ANDAMENTO</span>
        <div className="slot-spin-reels">
          {Array.from({ length: 5 }, (_, coluna) => (
            <div key={coluna}>
              {simbolos.map((simbolo, indice) => (
                <img
                  key={`${coluna}-${indice}`}
                  src={simbolo}
                  alt=""
                />
              ))}
            </div>
          ))}
        </div>
        <h2>O Taigrinho está pensando...</h2>
      </div>
    )
  }

  if (variante === 'taigrinho-derrota') {
    return (
      <div className="archive-scene slot-loss-scene">
        <img src={paquetaMeme} alt="" />
        <span>COMUNICADO OFICIAL DA BANCA</span>
        <h2>A banca agradece pelas TaiCoins.</h2>
        <p>Nenhuma linha vencedora encontrada.</p>
      </div>
    )
  }

  if (variante === 'crash-subida') {
    return (
      <div className="archive-scene crash-rise-scene">
        <div className="crash-grid" />
        <svg viewBox="0 0 600 260" aria-hidden="true">
          <path
            d="M20 235 C 90 228, 120 210, 170 198 S 250 160, 300 147 S 390 105, 440 80 S 520 38, 580 18"
          />
          <circle cx="580" cy="18" r="10" />
        </svg>
        <div className="crash-rise-number">
          <span>REGIME CRASH</span>
          <strong>12.48x</strong>
          <small>RETIRE ANTES DO CONFISCO</small>
        </div>
      </div>
    )
  }

  if (
    variante === 'crash-fuga' ||
    variante === 'crash-confisco'
  ) {
    const confiscado = variante === 'crash-confisco'

    return (
      <div
        className={`archive-scene regime-result-scene ${
          confiscado ? 'confiscated' : 'escaped'
        }`}
      >
        <div className="regime-scan" />

        <div className="regime-characters">
          <img src={taihenDitadora} alt="" />
          {confiscado && (
            <img src={fiscalRegime} alt="" />
          )}
        </div>

        <span>
          {confiscado
            ? 'DECRETO DA COMANDANTE'
            : 'RETIRADA NÃO AUTORIZADA'}
        </span>

        <h2>
          {confiscado
            ? 'BENS CONFISCADOS'
            : 'VOCÊ FUGIU DO REGIME'}
        </h2>

        <p>
          {confiscado
            ? 'O fiscal chegou antes da sua retirada.'
            : '+1.248 TaiCoins fictícias recuperadas.'}
        </p>
      </div>
    )
  }

  if (variante === 'derby-corrida') {
    const corredoras = [
      {
        imagem: silenceSuzuka,
        nome: 'Suzuka',
      },
      {
        imagem: tokaiTeio,
        nome: 'Teio',
      },
      {
        imagem: mejiroMcqueen,
        nome: 'McQueen',
      },
      {
        imagem: goldShip,
        nome: 'Gold Ship',
      },
      {
        imagem: matikanetannhauser,
        nome: 'Mambo',
      },
      {
        imagem: meishoDoto,
        nome: 'Doto',
      },
    ]

    return (
      <div className="archive-scene derby-race-scene">
        <div className="derby-race-header">
          <span>TAIHEN DERBY</span>
          <strong>CORRIDA EM ANDAMENTO</strong>
        </div>

        <div className="derby-race-track">
          {corredoras.map((corredora, indice) => (
            <div
              key={corredora.nome}
              style={{
                '--archive-runner-index': indice,
              }}
            >
              <small>{corredora.nome}</small>
              <img src={corredora.imagem} alt="" />
              <i />
            </div>
          ))}
        </div>

        <p>
          O Protocolo Mambo está calculando uma coincidência
          estatística.
        </p>
      </div>
    )
  }

  return null
}

function AnimationArchivePanel() {
  const [categoriaAtiva, setCategoriaAtiva] =
    useState('todas')
  const [itemAbertoId, setItemAbertoId] =
    useState(null)

  const itensFiltrados = useMemo(
    () =>
      categoriaAtiva === 'todas'
        ? itens
        : itens.filter(
            (item) =>
              item.categoria === categoriaAtiva,
          ),
    [categoriaAtiva],
  )

  const itemAberto =
    itens.find(
      (item) => item.id === itemAbertoId,
    ) || null

  const indiceAberto = itemAberto
    ? itens.findIndex(
        (item) => item.id === itemAberto.id,
      )
    : -1

  function navegar(direcao) {
    if (indiceAberto < 0) {
      return
    }

    const novoIndice =
      (indiceAberto + direcao + itens.length) %
      itens.length

    setItemAbertoId(itens[novoIndice].id)
  }

  useEffect(() => {
    if (!itemAberto) {
      return undefined
    }

    const overflowAnterior =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    function controlarTeclado(evento) {
      if (evento.key === 'Escape') {
        setItemAbertoId(null)
      }

      if (evento.key === 'ArrowLeft') {
        navegar(-1)
      }

      if (evento.key === 'ArrowRight') {
        navegar(1)
      }
    }

    window.addEventListener(
      'keydown',
      controlarTeclado,
    )

    return () => {
      document.body.style.overflow =
        overflowAnterior
      window.removeEventListener(
        'keydown',
        controlarTeclado,
      )
    }
  }, [itemAbertoId])

  return (
    <section
      className="animation-archive-panel"
      data-neytai-target="animation-gallery"
    >
      {itemAberto && (
        <div
          className="animation-player-overlay"
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
            className="animation-player-close"
            onClick={() => setItemAbertoId(null)}
            aria-label="Fechar"
          >
            ×
          </button>

          <button
            type="button"
            className="animation-player-arrow previous"
            onClick={() => navegar(-1)}
            aria-label="Anterior"
          >
            ‹
          </button>

          <div className="animation-player-card">
            <div className="animation-player-stage">
              {itemAberto.tipo === 'video' ? (
                <video
                  key={itemAberto.id}
                  src={itemAberto.src}
                  poster={itemAberto.miniatura}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                />
              ) : (
                <ConteudoAnimado
                  key={itemAberto.id}
                  variante={itemAberto.variante}
                />
              )}
            </div>

            <div className="animation-player-copy">
              <span>{itemAberto.selo}</span>
              <h2>{itemAberto.titulo}</h2>
              <p>{itemAberto.descricao}</p>

              <small>
                PRÉVIA{' '}
                {String(indiceAberto + 1).padStart(
                  2,
                  '0',
                )}{' '}
                /{' '}
                {String(itens.length).padStart(2, '0')}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="animation-player-arrow next"
            onClick={() => navegar(1)}
            aria-label="Próxima"
          >
            ›
          </button>
        </div>
      )}

      <header className="animation-archive-header">
        <div>
          <span>
            ARQUIVO AUDIOVISUAL DA BANCA
          </span>

          <h2>Central de animações</h2>

          <p>
            Assista aos finais, vídeos e efeitos especiais sem
            gastar TaiCoins, alterar o histórico ou depender de
            uma sorte que provavelmente nunca viria.
          </p>
        </div>

        <div className="animation-archive-summary">
          <strong>{itens.length}</strong>
          <span>prévias disponíveis</span>

          <button
            type="button"
            onClick={() =>
              setItemAbertoId(itens[0].id)
            }
          >
            Iniciar sessão de cinema
          </button>
        </div>
      </header>

      <div className="animation-archive-warning">
        <strong>SPOILERS OFICIAIS:</strong>
        <span>
          Esta seção mostra todos os finais e vídeos do site. Os
          botões apenas reproduzem as prévias e não modificam o
          saldo, apostas, bônus ou resultados dos jogos.
        </span>
      </div>

      <div className="animation-archive-filters">
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

            <span>
              {categoria.id === 'todas'
                ? itens.length
                : itens.filter(
                    (item) =>
                      item.categoria === categoria.id,
                  ).length}
            </span>
          </button>
        ))}
      </div>

      <div className="animation-archive-grid">
        {itensFiltrados.map((item, indice) => (
          <article
            className="animation-archive-item"
            key={item.id}
          >
            <button
              type="button"
              className="animation-archive-thumbnail"
              onClick={() =>
                setItemAbertoId(item.id)
              }
            >
              <img
                src={item.miniatura}
                alt=""
                loading="lazy"
              />

              <span className="animation-archive-play">
                {item.tipo === 'video' ? '▶' : '✦'}
              </span>

              <small>
                {String(indice + 1).padStart(
                  2,
                  '0',
                )}
              </small>
            </button>

            <div className="animation-archive-item-copy">
              <span>{item.selo}</span>
              <h3>{item.titulo}</h3>
              <p>{item.descricao}</p>

              <button
                type="button"
                onClick={() =>
                  setItemAbertoId(item.id)
                }
              >
                {item.tipo === 'video'
                  ? 'Assistir vídeo'
                  : 'Mostrar animação'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AnimationArchivePanel
