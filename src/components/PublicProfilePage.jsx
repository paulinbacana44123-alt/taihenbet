import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { avatarDoPerfil } from '../data/profileAvatars'
import {
  classeCosmetico,
  nomeCosmetico,
  rotuloBadge,
} from '../data/taishopCosmetics'
import './PublicProfilePage.css'
import { useAchievementCatalog, useCosmeticCatalogMap } from '../hooks/useEditableContent'

const CONQUISTAS_PUBLICAS = {
  primeiro_bilhete: {
    nome: 'Primeiro sacrifício',
    titulo: 'Apostador de Schrödinger',
    icone: '1X2',
  },
  analista_bahrein: {
    nome: 'Analista do Bahrein',
    titulo: 'Especialista em Futebol Bareinita',
    icone: 'BH',
  },
  primeira_vitoria: {
    nome: 'Milagre estatístico',
    titulo: 'Milagre Estatístico',
    icone: '★',
  },
  cliente_banca: {
    nome: 'Cliente preferencial',
    titulo: 'Cliente Preferencial da Banca',
    icone: 'T',
  },
  domador_taigrinho: {
    nome: 'Domador de Taigrinho',
    titulo: 'Domador de Taigrinho',
    icone: '🐯',
  },
  agronomo_risco: {
    nome: 'Agricultura de risco',
    titulo: 'Agrônomo de Risco',
    icone: '🌱',
  },
  fugitivo_regime: {
    nome: 'Fuga do regime',
    titulo: 'Fugitivo do Regime',
    icone: '↗',
  },
  joquei_mambo: {
    nome: 'Protocolo Mambo',
    titulo: 'Jóquei do Protocolo Mambo',
    icone: '🏁',
  },
  investidor_questionavel: {
    nome: 'Investidor questionável',
    titulo: 'Investidor Questionável',
    icone: '−T',
  },
  inimigo_banca: {
    nome: 'Inimigo da banca',
    titulo: 'Inimigo da Banca',
    icone: '+T',
  },
  veterano_ruina: {
    nome: 'Veterano da ruína',
    titulo: 'Veterano da Ruína',
    icone: '25',
  },
}

const TOTAL_CONQUISTAS = Object.keys(CONQUISTAS_PUBLICAS).length

function numero(valor) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
}

function formatarNumero(valor, casas = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(numero(valor))
}

function formatarData(valor) {
  if (!valor) return 'data arquivada em local desconhecido'

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(valor))
  } catch {
    return 'data arquivada em local desconhecido'
  }
}

function bannerSeguro(valor) {
  if (!valor) return null

  try {
    const url = new URL(valor)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function PublicProfilePage({
  userId,
  currentUserId,
  localStats,
  onBack,
  onGoAchievements,
  onGoShop,
}) {
  const { map: achievementCatalog, rows: achievementRows } = useAchievementCatalog()
  const cosmeticCatalog = useCosmeticCatalogMap()
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(false)
  const [bio, setBio] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState('')

  async function carregarPerfil() {
    if (!userId) {
      setPerfil(null)
      setErro('A ficha pública não recebeu um usuário válido.')
      setCarregando(false)
      return
    }

    setCarregando(true)
    setErro('')

    const { data, error } = await supabase.rpc('get_public_profile', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Falha ao carregar perfil público:', error)
      setPerfil(null)
      setErro(
        error.message ||
          'A banca não conseguiu localizar esta ficha pública.',
      )
      setCarregando(false)
      return
    }

    if (!data) {
      setPerfil(null)
      setErro('Esta conta não possui uma ficha pública disponível.')
      setCarregando(false)
      return
    }

    setPerfil(data)
    setBio(data.public_bio || '')
    setBannerUrl(data.public_banner_url || '')
    setCarregando(false)
  }

  useEffect(() => {
    void carregarPerfil()
  }, [userId])

  const dono = Boolean(
    currentUserId && perfil?.id && currentUserId === perfil.id,
  )

  const conquistas = useMemo(() => {
    const registros = Array.isArray(perfil?.achievements)
      ? perfil.achievements
      : []

    return registros
      .map((registro) => ({
        ...registro,
        definicao: achievementCatalog[registro.achievement_key]
          ? achievementCatalog[registro.achievement_key].active === false
            ? null
            : {
                nome: achievementCatalog[registro.achievement_key].name,
                titulo: achievementCatalog[registro.achievement_key].title,
                icone: achievementCatalog[registro.achievement_key].icon,
              }
          : CONQUISTAS_PUBLICAS[registro.achievement_key],
      }))
      .filter((registro) => registro.definicao)
  }, [perfil?.achievements, achievementCatalog])

  const tituloEquipado = perfil?.equipped_title_key
    ? achievementCatalog[perfil.equipped_title_key]?.title || CONQUISTAS_PUBLICAS[perfil.equipped_title_key]?.titulo
    : null
  const totalConquistas = achievementRows.length
    ? achievementRows.filter((item) => item.active !== false).length
    : TOTAL_CONQUISTAS

  const estatisticas = dono && localStats ? localStats : perfil
  const vitorias = numero(estatisticas?.wins)
  const derrotas = numero(estatisticas?.losses)
  const liquidados = vitorias + derrotas
  const taxaAcerto = liquidados > 0 ? (vitorias / liquidados) * 100 : 0
  const decisoes =
    numero(estatisticas?.sports_count) + numero(estatisticas?.games_count)
  const lucro = numero(estatisticas?.net_profit)
  const banner = bannerSeguro(perfil?.public_banner_url)
  const frameClass = classeCosmetico(perfil?.equipped_avatar_frame)
  const nameClass = classeCosmetico(perfil?.equipped_name_color)
  const effectClass = classeCosmetico(perfil?.equipped_profile_effect)
  const badgeClass = classeCosmetico(perfil?.equipped_badge)
  const cosmeticName = (key, fallback) =>
    cosmeticCatalog[String(key || '')]?.name || nomeCosmetico(key, fallback)
  const badgeLabel = (key) =>
    cosmeticCatalog[String(key || '')]?.name || rotuloBadge(key)

  async function salvarPerfil(evento) {
    evento.preventDefault()
    if (!dono || salvando) return

    const bioFinal = bio.trim()
    const bannerFinal = bannerUrl.trim()

    if (bioFinal.length > 320) {
      setAviso('A bio passou do limite de 320 caracteres.')
      return
    }

    if (bannerFinal && !bannerSeguro(bannerFinal)) {
      setAviso('O banner precisa ser uma URL http/https válida.')
      return
    }

    setSalvando(true)
    setAviso('')

    const { error } = await supabase.rpc('update_my_public_profile', {
      p_public_bio: bioFinal,
      p_public_banner_url: bannerFinal || null,
    })

    if (error) {
      console.error('Falha ao atualizar perfil público:', error)
      setAviso(
        error.message === 'ACCOUNT_SUSPENDED'
          ? 'Conta suspensa: a banca bloqueou alterações públicas.'
          : error.message || 'A banca recusou a atualização da ficha.',
      )
      setSalvando(false)
      return
    }

    await carregarPerfil()
    setEditando(false)
    setAviso('Ficha pública atualizada.')
    setSalvando(false)
  }

  if (carregando) {
    return (
      <section className="public-profile-state">
        <span>ARQUIVO SOCIAL</span>
        <h1>Abrindo a ficha criminal...</h1>
        <p>A banca está cruzando registros públicos da conta.</p>
      </section>
    )
  }

  if (erro || !perfil) {
    return (
      <section className="public-profile-state error">
        <span>FICHA NÃO LOCALIZADA</span>
        <h1>Esse cliente sumiu do arquivo.</h1>
        <p>{erro}</p>
        <button type="button" onClick={onBack}>
          Voltar
        </button>
      </section>
    )
  }

  return (
    <div className="public-profile-page" data-neytai-target="public-profile-page">
      <button type="button" className="public-profile-back" onClick={onBack}>
        ← Voltar
      </button>

      <section
        className={`public-profile-hero ${banner ? 'has-banner' : ''} ${effectClass}`}
        style={
          banner
            ? {
                '--profile-banner-image': `url("${banner.replaceAll('"', '%22')}")`,
              }
            : undefined
        }
      >
        <div className="public-profile-banner-overlay" />

        <div className="public-profile-identity">
          <div className={`public-profile-avatar-shell ${frameClass}`}>
            <img
              src={avatarDoPerfil(perfil.avatar_key).src}
              alt={`Avatar de ${perfil.username}`}
            />
          </div>

          <div className="public-profile-name-block">
            <div className="public-profile-badges">
              {perfil.role === 'admin' && <span>ADMIN DA BANCA</span>}
              {dono && <span className="self">SEU PERFIL</span>}
              {perfil.equipped_badge && (
                <span className={`shop-badge ${badgeClass}`}>
                  {badgeLabel(perfil.equipped_badge)}
                </span>
              )}
            </div>

            <h1 className={nameClass}>{perfil.username}</h1>
            <strong>
              {tituloEquipado || 'Cliente sem título oficialmente suspeito'}
            </strong>
            <small>@{perfil.username}</small>
          </div>

          {dono && (
            <button
              type="button"
              className="public-profile-edit-button"
              onClick={() => {
                setEditando((valor) => !valor)
                setAviso('')
              }}
            >
              {editando ? 'Cancelar edição' : 'Editar perfil público'}
            </button>
          )}
        </div>
      </section>

      {aviso && <div className="public-profile-notice">{aviso}</div>}

      {dono && editando && (
        <form className="public-profile-editor" onSubmit={salvarPerfil}>
          <div>
            <span>EDIÇÃO DA FICHA</span>
            <h2>Personalize o que os outros clientes veem.</h2>
            <p>
              E-mail e histórico detalhado continuam fora do perfil público.
            </p>
          </div>

          <label>
            <span>Bio pública</span>
            <textarea
              value={bio}
              maxLength={320}
              onChange={(evento) => setBio(evento.target.value)}
              placeholder="Escreva algo sobre você, sua relação juridicamente questionável com a banca ou qualquer outra informação pública."
            />
            <small>{bio.length} / 320</small>
          </label>

          <label>
            <span>URL do banner</span>
            <input
              type="url"
              value={bannerUrl}
              maxLength={700}
              onChange={(evento) => setBannerUrl(evento.target.value)}
              placeholder="https://..."
            />
            <small>Deixe vazio para usar o banner padrão da TaihenBet.</small>
          </label>

          <button type="submit" disabled={salvando}>
            {salvando ? 'Arquivando...' : 'Salvar ficha pública'}
          </button>
        </form>
      )}

      <section className="public-profile-main-grid">
        <article className="public-profile-about">
          <span>SOBRE O CLIENTE</span>
          <h2>{perfil.public_bio ? 'Declaração registrada' : 'Bio não declarada'}</h2>
          <p>
            {perfil.public_bio ||
              'Este usuário preferiu deixar que as decisões financeiras falem por ele.'}
          </p>
          <small>Membro da banca desde {formatarData(perfil.joined_at)}.</small>
        </article>

        <article className="public-profile-title-card">
          <span>TÍTULO EM EXIBIÇÃO</span>
          <strong>{tituloEquipado || 'Nenhum título equipado'}</strong>
          <p>
            {tituloEquipado
              ? 'Conquista selecionada para acompanhar a identidade pública.'
              : 'A banca ainda não recebeu autorização para exibir uma alcunha.'}
          </p>
          {dono && onGoAchievements && (
            <button type="button" onClick={onGoAchievements}>
              Gerenciar títulos
            </button>
          )}
        </article>
      </section>

      <section className="public-profile-cosmetics">
        <div className="public-profile-section-heading">
          <div>
            <span>IDENTIDADE FINANCIADA</span>
            <h2>Cosméticos em exibição</h2>
          </div>
          {dono && onGoShop ? (
            <button type="button" onClick={onGoShop}>Abrir TaiShop →</button>
          ) : (
            <p>Compras fictícias, consequências estéticas permanentes.</p>
          )}
        </div>

        <div className="public-profile-cosmetic-grid">
          <article>
            <span>MOLDURA</span>
            <strong>{cosmeticName(perfil.equipped_avatar_frame)}</strong>
          </article>
          <article>
            <span>COR DO NOME</span>
            <strong>{cosmeticName(perfil.equipped_name_color)}</strong>
          </article>
          <article>
            <span>EFEITO</span>
            <strong>{cosmeticName(perfil.equipped_profile_effect)}</strong>
          </article>
          <article>
            <span>BADGE</span>
            <strong>{cosmeticName(perfil.equipped_badge)}</strong>
          </article>
        </div>
      </section>

      <section className="public-profile-stats">
        <article>
          <span>Saldo público</span>
          <strong>{formatarNumero(perfil.balance, 2)} T</strong>
        </article>
        <article>
          <span>Decisões registradas</span>
          <strong>{formatarNumero(decisoes)}</strong>
        </article>
        <article>
          <span>Vitórias</span>
          <strong>{formatarNumero(vitorias)}</strong>
        </article>
        <article>
          <span>Derrotas</span>
          <strong>{formatarNumero(derrotas)}</strong>
        </article>
        <article>
          <span>Taxa de acerto</span>
          <strong>{formatarNumero(taxaAcerto, 1)}%</strong>
        </article>
        <article>
          <span>TaiCoins arriscadas</span>
          <strong>{formatarNumero(estatisticas?.total_staked, 2)}</strong>
        </article>
        <article className={lucro >= 0 ? 'positive' : 'negative'}>
          <span>Lucro líquido</span>
          <strong>
            {lucro >= 0 ? '+' : '−'}{formatarNumero(Math.abs(lucro), 2)}
          </strong>
        </article>
        <article>
          <span>Pendentes</span>
          <strong>{formatarNumero(estatisticas?.pending)}</strong>
        </article>
      </section>

      <section className="public-profile-community-strip">
        <div>
          <span>PEÇAS NO MUSEU</span>
          <strong>{formatarNumero(perfil.museum_posts_count)}</strong>
        </div>
        <div>
          <span>MENSAGENS PARA A TAI</span>
          <strong>{formatarNumero(perfil.tai_messages_count)}</strong>
        </div>
        <div>
          <span>CONQUISTAS</span>
          <strong>{conquistas.length}/{totalConquistas}</strong>
        </div>
      </section>

      <section className="public-profile-achievements">
        <div className="public-profile-section-heading">
          <div>
            <span>TROFÉUS PÚBLICOS</span>
            <h2>Conquistas arquivadas</h2>
          </div>
          <p>
            Só aparecem conquistas já desbloqueadas; o progresso incompleto
            continua sendo assunto entre o usuário e a banca.
          </p>
        </div>

        {conquistas.length === 0 ? (
          <div className="public-profile-empty-achievements">
            Nenhuma conquista pública registrada ainda.
          </div>
        ) : (
          <div className="public-profile-achievement-grid">
            {conquistas.map((registro) => {
              const equipada =
                registro.achievement_key === perfil.equipped_title_key

              return (
                <article
                  key={registro.achievement_key}
                  className={equipada ? 'equipped' : ''}
                >
                  <div>{registro.definicao.icone}</div>
                  <span>{registro.definicao.nome}</span>
                  <strong>{registro.definicao.titulo}</strong>
                  {equipada && <small>EM EXIBIÇÃO</small>}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default PublicProfilePage
