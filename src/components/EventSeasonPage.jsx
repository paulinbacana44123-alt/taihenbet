import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { avatarDoPerfil } from '../data/profileAvatars'
import './EventSeasonPage.css'
import { useAchievementCatalog, useCosmeticCatalogMap } from '../hooks/useEditableContent'

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

function numero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(numero(valor))
}

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numero(valor))
}

function formatarData(valor) {
  if (!valor) return 'data confiscada'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return 'data confiscada'
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function tempoRestante(valor) {
  const final = new Date(valor).getTime()
  if (!Number.isFinite(final)) return 'prazo desconhecido'
  const diff = Math.max(0, final - Date.now())
  const totalHoras = Math.floor(diff / 3600000)
  const dias = Math.floor(totalHoras / 24)
  const horas = totalHoras % 24
  if (diff <= 0) return 'encerrada'
  if (dias > 0) return `${dias}d ${horas}h restantes`
  return `${Math.max(1, horas)}h restantes`
}

function normalizarEstado(data) {
  const bruto = data && typeof data === 'object' ? data : {}
  return {
    active: bruto.active && typeof bruto.active === 'object' ? bruto.active : null,
    missions: Array.isArray(bruto.missions) ? bruto.missions : [],
    tiers: Array.isArray(bruto.tiers) ? bruto.tiers : [],
    leaderboard: Array.isArray(bruto.leaderboard) ? bruto.leaderboard : [],
    archive: Array.isArray(bruto.archive) ? bruto.archive : [],
    summary: bruto.summary && typeof bruto.summary === 'object' ? bruto.summary : {},
    special_reward:
      bruto.special_reward && typeof bruto.special_reward === 'object'
        ? bruto.special_reward
        : {},
  }
}

function EventMissionCard({ mission, operating, onClaim }) {
  const progress = numero(mission.progress)
  const target = Math.max(1, numero(mission.target))
  const ratio = Math.max(0, Math.min(100, (progress / target) * 100))
  const claimed = Boolean(mission.claimed)
  const claimable = Boolean(mission.claimable) && !claimed
  const busy = operating === `mission:${mission.id}`

  return (
    <article
      className={`season-mission-card ${claimed ? 'is-claimed' : ''} ${claimable ? 'is-ready' : ''}`}
    >
      <header>
        <div>
          <span>MISSÃO DO EVENTO</span>
          <h3>{mission.title}</h3>
        </div>
        <i aria-hidden="true">{claimed ? '✓' : mission.icon || '◆'}</i>
      </header>

      <p>{mission.description}</p>

      <div className="season-mission-progress-copy">
        <strong>
          {formatarNumero(Math.min(progress, target))}/{formatarNumero(target)}
        </strong>
        <small>
          {claimed ? 'ARQUIVADA' : claimable ? 'PRONTA PARA RESGATE' : 'EM ANDAMENTO'}
        </small>
      </div>

      <div className="season-progress-track" aria-hidden="true">
        <span style={{ width: `${claimed ? 100 : ratio}%` }} />
      </div>

      <footer>
        <div>
          <small>RECOMPENSA</small>
          <strong>+{formatarNumero(mission.reward_points)} pts</strong>
          <span>+{formatarMoedas(mission.reward_coins)} T</span>
        </div>
        <button
          type="button"
          disabled={!claimable || busy}
          onClick={() => onClaim(mission)}
        >
          {busy
            ? 'Processando...'
            : claimed
              ? 'Resgatada'
              : claimable
                ? 'Resgatar'
                : 'Ainda não'}
        </button>
      </footer>
    </article>
  )
}

function RewardTier({ tier, operating, onClaim }) {
  const claimed = Boolean(tier.claimed)
  const claimable = Boolean(tier.claimable) && !claimed
  const busy = operating === `tier:${tier.tier_key}`

  return (
    <article className={`season-tier ${claimed ? 'is-claimed' : ''} ${claimable ? 'is-ready' : ''}`}>
      <span className="season-tier-points">{formatarNumero(tier.points_required)} PTS</span>
      <div>
        <small>MARCO DE TEMPORADA</small>
        <h3>{tier.name}</h3>
        <p>
          +{formatarMoedas(tier.reward_coins)} TaiCoins
          {tier.reward_cosmetic_name ? ` · ${tier.reward_cosmetic_name}` : ''}
        </p>
      </div>
      <button
        type="button"
        disabled={!claimable || busy}
        onClick={() => onClaim(tier)}
      >
        {busy
          ? 'Auditando...'
          : claimed
            ? 'Resgatado'
            : claimable
              ? 'Resgatar'
              : 'Bloqueado'}
      </button>
    </article>
  )
}

export default function EventSeasonPage({
  session,
  profile,
  onOpenAuth,
  onProfileChanged,
  onNavigate,
  onOpenProfile,
}) {
  const { map: achievementCatalog } = useAchievementCatalog()
  const cosmeticCatalog = useCosmeticCatalogMap()
  const [estado, setEstado] = useState(() => normalizarEstado(null))
  const [loading, setLoading] = useState(true)
  const [operating, setOperating] = useState('')
  const [notice, setNotice] = useState(null)

  const authenticated = Boolean(session?.user)
  const active = estado.active
  const score = numero(estado.summary?.points)
  const finalTier = useMemo(
    () => estado.tiers.reduce((maior, tier) =>
      numero(tier.points_required) > numero(maior?.points_required) ? tier : maior,
    null),
    [estado.tiers],
  )
  const target = Math.max(1, numero(finalTier?.points_required) || 500)
  const scoreRatio = Math.max(0, Math.min(100, (score / target) * 100))

  async function load({ silent = false } = {}) {
    if (!authenticated) {
      setEstado(normalizarEstado(null))
      setLoading(false)
      return
    }

    if (!silent) setLoading(true)
    const { data, error } = await supabase.rpc('get_my_season_hub')
    if (!silent) setLoading(false)

    if (error) {
      console.error('Falha ao carregar temporada:', error)
      setNotice({
        type: 'error',
        text: 'O calendário sazonal desapareceu. Confira se o SQL da Fase 3.20 foi executado.',
      })
      return
    }

    setEstado(normalizarEstado(data))
  }

  useEffect(() => {
    setNotice(null)
    void load()
  }, [session?.user?.id])

  async function claimMission(mission) {
    if (!authenticated) {
      onOpenAuth?.()
      return
    }
    if (operating) return

    setOperating(`mission:${mission.id}`)
    setNotice(null)

    const { data, error } = await supabase.rpc('claim_my_season_mission', {
      p_mission_id: mission.id,
    })

    if (error) {
      console.error('Resgate sazonal recusado:', error)
      const raw = `${error.message || ''} ${error.details || ''}`
      let text = 'A banca recusou o resgate do evento.'
      if (raw.includes('SEASON_MISSION_NOT_COMPLETE')) text = 'A missão do evento ainda não atingiu a meta.'
      if (raw.includes('SEASON_MISSION_ALREADY_CLAIMED')) text = 'Essa missão do evento já foi resgatada.'
      if (raw.includes('NO_ACTIVE_SEASON')) text = 'Não existe temporada ativa neste momento.'
      if (raw.includes('ACCOUNT_SUSPENDED')) text = 'Conta suspensa: o evento está bloqueado pela Central de Moderação.'
      setNotice({ type: 'error', text })
      setOperating('')
      return
    }

    if (data?.profile) onProfileChanged?.(data.profile)
    setEstado(normalizarEstado(data?.state))
    setNotice({
      type: 'success',
      text: `${mission.title} arquivada: +${formatarNumero(data?.reward_points)} pts e +${formatarMoedas(data?.reward_coins)} T.`,
    })
    setOperating('')
  }

  async function claimTier(tier) {
    if (!authenticated || operating) return
    setOperating(`tier:${tier.tier_key}`)
    setNotice(null)

    const { data, error } = await supabase.rpc('claim_my_season_tier', {
      p_tier_key: tier.tier_key,
    })

    if (error) {
      console.error('Marco sazonal recusado:', error)
      const raw = `${error.message || ''} ${error.details || ''}`
      let text = 'A banca recusou o marco de temporada.'
      if (raw.includes('SEASON_TIER_NOT_REACHED')) text = 'Você ainda não possui pontos suficientes para esse marco.'
      if (raw.includes('SEASON_TIER_ALREADY_CLAIMED')) text = 'Esse marco já foi resgatado.'
      if (raw.includes('ACCOUNT_SUSPENDED')) text = 'Conta suspensa: recompensas sazonais estão bloqueadas.'
      setNotice({ type: 'error', text })
      setOperating('')
      return
    }

    if (data?.profile) onProfileChanged?.(data.profile)
    setEstado(normalizarEstado(data?.state))
    setNotice({
      type: 'success',
      text: data?.reward_cosmetic_name
        ? `${tier.name}: +${formatarMoedas(data?.reward_coins)} T e ${data.reward_cosmetic_name} liberado.`
        : `${tier.name}: +${formatarMoedas(data?.reward_coins)} T liberados.`,
    })
    setOperating('')
  }

  async function toggleSeasonBadge() {
    const reward = estado.special_reward || {}
    if (!reward.owned || operating) return

    const removing = Boolean(reward.equipped)
    setOperating('season-badge')
    setNotice(null)

    const { data, error } = await supabase.rpc('set_my_season_badge', {
      p_enabled: !removing,
    })

    if (error) {
      console.error('Falha ao equipar badge sazonal:', error)
      setNotice({ type: 'error', text: 'A banca não conseguiu alterar o selo da temporada.' })
      setOperating('')
      return
    }

    onProfileChanged?.(data)
    await load({ silent: true })
    setNotice({
      type: 'success',
      text: removing
        ? 'O selo da temporada saiu da sua ficha pública.'
        : 'O selo da temporada agora aparece no seu perfil público.',
    })
    setOperating('')
  }

  if (!authenticated) {
    return (
      <div className="season-page">
        <section className="season-login-card">
          <span>FASE 3.20 · CALENDÁRIO DA BANCA</span>
          <h1>Temporadas também exigem identificação.</h1>
          <p>Entre na conta para acumular pontos, disputar o ranking e transformar atividade questionável em patrimônio cosmético.</p>
          <button type="button" onClick={onOpenAuth}>Entrar na temporada</button>
        </section>
      </div>
    )
  }

  if (loading && !active) {
    return (
      <div className="season-page">
        <section className="season-login-card">
          <span>FASE 3.20 · CALENDÁRIO DA BANCA</span>
          <h1>Consultando a meteorologia da mandioca...</h1>
          <p>A Entidade está verificando se ainda existe uma temporada em circulação.</p>
        </section>
      </div>
    )
  }

  if (!active) {
    return (
      <div className="season-page">
        <section className="season-login-card no-season">
          <span>INTERTEMPORADA</span>
          <h1>A banca está entre safras.</h1>
          <p>Nenhum evento está ativo. O arquivo abaixo continua preservado para fins de constrangimento histórico.</p>
          <button type="button" onClick={() => load()}>Atualizar calendário</button>
        </section>

        {estado.archive.length > 0 && (
          <section className="season-archive-section">
            <header>
              <span>ARQUIVO SAZONAL</span>
              <h2>Temporadas encerradas</h2>
            </header>
            <div className="season-archive-grid">
              {estado.archive.map((item) => (
                <article key={item.id}>
                  <small>{formatarData(item.ends_at)}</small>
                  <h3>{item.name}</h3>
                  <strong>{formatarNumero(item.points)} pts</strong>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="season-page" data-neytai-target="season-page">
      <section className="season-hero">
        <div className="season-hero-copy">
          <span>FASE 3.20 · EVENTO ATIVO</span>
          <small>{active.subtitle}</small>
          <h1>{active.name}</h1>
          <p>{active.description}</p>

          <div className="season-hero-actions">
            <button type="button" onClick={() => load()} disabled={loading}>
              {loading ? 'Auditando...' : 'Atualizar evento'}
            </button>
            <button type="button" className="secondary" onClick={() => onNavigate?.('missoes')}>
              Ver missões normais →
            </button>
          </div>
        </div>

        <aside className="season-score-card">
          <small>PRESTÍGIO SAZONAL</small>
          <strong>{formatarNumero(score)} pts</strong>
          <span>
            {numero(estado.summary?.rank) > 0
              ? `#${formatarNumero(estado.summary.rank)} de ${formatarNumero(estado.summary.participants)}`
              : 'Ainda não ranqueado'}
          </span>
          <div className="season-score-track" aria-hidden="true">
            <span style={{ width: `${scoreRatio}%` }} />
          </div>
          <small>{formatarNumero(Math.min(score, target))}/{formatarNumero(target)} até o marco final</small>
        </aside>
      </section>

      <section className="season-meta-strip">
        <div>
          <span>INÍCIO</span>
          <strong>{formatarData(active.starts_at)}</strong>
        </div>
        <div>
          <span>ENCERRAMENTO</span>
          <strong>{formatarData(active.ends_at)}</strong>
        </div>
        <div>
          <span>RELÓGIO</span>
          <strong>{tempoRestante(active.ends_at)}</strong>
        </div>
        <div>
          <span>CLIENTE</span>
          <strong>{profile?.username || 'Sem crachá'}</strong>
        </div>
      </section>

      {notice && (
        <div className={`season-notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <section className="season-section">
        <header className="season-section-heading">
          <div>
            <span>OBJETIVOS TEMPORÁRIOS</span>
            <h2>Missões da temporada</h2>
          </div>
          <strong>{formatarNumero(estado.summary?.season_missions_claimed)}/{estado.missions.length} arquivadas</strong>
        </header>

        <div className="season-mission-grid">
          {estado.missions.map((mission) => (
            <EventMissionCard
              key={mission.id}
              mission={mission}
              operating={operating}
              onClaim={claimMission}
            />
          ))}
        </div>
      </section>

      <section className="season-section season-reward-section">
        <header className="season-section-heading">
          <div>
            <span>TRILHA DE RECOMPENSAS</span>
            <h2>Marcos da safra</h2>
          </div>
          <strong>{formatarNumero(score)} pontos acumulados</strong>
        </header>

        <div className="season-tier-list">
          {estado.tiers.map((tier) => (
            <RewardTier
              key={tier.tier_key}
              tier={tier}
              operating={operating}
              onClaim={claimTier}
            />
          ))}
        </div>
      </section>

      <section className="season-two-column">
        <div className="season-leaderboard-card">
          <header className="season-section-heading compact">
            <div>
              <span>RANKING SAZONAL</span>
              <h2>Colheita de prestígio</h2>
            </div>
            <strong>{formatarNumero(estado.summary?.participants)} participante(s)</strong>
          </header>

          {estado.leaderboard.length === 0 ? (
            <div className="season-empty">Ninguém pontuou ainda. Uma rara oportunidade de chegar em primeiro sem competência.</div>
          ) : (
            <div className="season-leaderboard-list">
              {estado.leaderboard.map((user) => (
                <button
                  type="button"
                  key={user.user_id}
                  className={user.user_id === session?.user?.id ? 'is-me' : ''}
                  onClick={() => onOpenProfile?.(user.user_id)}
                >
                  <span className="season-rank">#{formatarNumero(user.rank)}</span>
                  <img src={avatarDoPerfil(user.avatar_key)?.src} alt="" aria-hidden="true" />
                  <span className="season-ranked-user">
                    <strong>{user.username}</strong>
                    <small>{achievementCatalog[user.equipped_title_key]?.title || TITULOS[user.equipped_title_key] || (user.role === 'admin' ? 'Admin da banca' : 'Cliente sazonal')}</small>
                  </span>
                  <strong className="season-ranked-points">{formatarNumero(user.points)} pts</strong>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className={`season-exclusive-card ${estado.special_reward?.owned ? 'is-owned' : ''}`}>
          <span>RECOMPENSA FINAL · NÃO VENDIDA NA TAISHOP</span>
          <div className="season-exclusive-icon" aria-hidden="true">🌱</div>
          <h2>{cosmeticCatalog[String(estado.special_reward?.id || '')]?.name || estado.special_reward?.name || 'Sobrevivente da Safra'}</h2>
          <p>
            Um selo permanente para quem atingiu o marco final da temporada e aceitou transformar mandioca em currículo.
          </p>
          <strong>
            {estado.special_reward?.owned
              ? estado.special_reward?.equipped
                ? 'EM EXIBIÇÃO'
                : 'DESBLOQUEADO'
              : 'BLOQUEADO'}
          </strong>
          {estado.special_reward?.owned && (
            <button type="button" onClick={toggleSeasonBadge} disabled={operating === 'season-badge'}>
              {operating === 'season-badge'
                ? 'Processando...'
                : estado.special_reward?.equipped
                  ? 'Desequipar selo'
                  : 'Equipar selo'}
            </button>
          )}
          {!estado.special_reward?.owned && (
            <small>Resgate o marco final de {formatarNumero(target)} pontos para liberar.</small>
          )}
        </aside>
      </section>

      <section className="season-archive-section">
        <header className="season-section-heading">
          <div>
            <span>ARQUIVO SAZONAL</span>
            <h2>Temporadas encerradas</h2>
          </div>
        </header>

        {estado.archive.length === 0 ? (
          <div className="season-empty archive">Nenhuma temporada foi enterrada ainda. Esta é oficialmente a primeira vítima.</div>
        ) : (
          <div className="season-archive-grid">
            {estado.archive.map((item) => (
              <article key={item.id}>
                <small>ENCERRADA EM {formatarData(item.ends_at)}</small>
                <h3>{item.name}</h3>
                <strong>{formatarNumero(item.points)} pts</strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
