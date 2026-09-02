import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { rotuloBadge } from '../data/taishopCosmetics'
import './MissionPage.css'
import { useCosmeticCatalogMap, useSiteTexts } from '../hooks/useEditableContent'

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

function normalizarEstado(data) {
  const bruto = data && typeof data === 'object' ? data : {}
  return {
    daily: Array.isArray(bruto.daily) ? bruto.daily : [],
    weekly: Array.isArray(bruto.weekly) ? bruto.weekly : [],
    summary: bruto.summary && typeof bruto.summary === 'object'
      ? bruto.summary
      : {},
    special_reward: bruto.special_reward && typeof bruto.special_reward === 'object'
      ? bruto.special_reward
      : {},
  }
}

function MissionCard({ mission, onClaim, operating, cosmeticCatalog }) {
  const progress = numero(mission.progress)
  const target = Math.max(1, numero(mission.target))
  const ratio = Math.max(0, Math.min(100, (progress / target) * 100))
  const claimed = Boolean(mission.claimed)
  const claimable = Boolean(mission.claimable) && !claimed
  const busy = operating === mission.id

  return (
    <article className={`mission-card ${claimed ? 'is-claimed' : ''} ${claimable ? 'is-ready' : ''}`}>
      <header className="mission-card-header">
        <div>
          <span>{mission.cadence === 'daily' ? 'DIÁRIA' : 'SEMANAL'}</span>
          <h3>{mission.title}</h3>
        </div>
        <i aria-hidden="true">{claimed ? '✓' : mission.icon || 'T'}</i>
      </header>

      <p>{mission.description}</p>

      <div className="mission-progress-row">
        <strong>{formatarNumero(Math.min(progress, target))}/{formatarNumero(target)}</strong>
        <small>{claimed ? 'RESGATADA' : claimable ? 'PRONTA PARA RESGATE' : 'EM ANDAMENTO'}</small>
      </div>

      <div className="mission-progress-track" aria-hidden="true">
        <span style={{ width: `${claimed ? 100 : ratio}%` }} />
      </div>

      <footer className="mission-card-footer">
        <div className="mission-reward">
          <small>RECOMPENSA</small>
          <strong>+{formatarMoedas(mission.reward_coins)} T</strong>
          {mission.reward_cosmetic_id && (
            <span>+ {cosmeticCatalog?.[String(mission.reward_cosmetic_id)]?.name || mission.reward_cosmetic_name || 'Cosmético especial'}</span>
          )}
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

export default function MissionPage({
  session,
  profile,
  onOpenAuth,
  onProfileChanged,
  onNavigate,
}) {
  const siteTexts = useSiteTexts()
  const cosmeticCatalog = useCosmeticCatalogMap()
  const [estado, setEstado] = useState(() => normalizarEstado(null))
  const [loading, setLoading] = useState(true)
  const [operating, setOperating] = useState('')
  const [notice, setNotice] = useState(null)

  const authenticated = Boolean(session?.user)

  async function load({ silent = false } = {}) {
    if (!authenticated) {
      setEstado(normalizarEstado(null))
      setLoading(false)
      return
    }

    if (!silent) setLoading(true)
    const { data, error } = await supabase.rpc('get_my_missions')
    if (!silent) setLoading(false)

    if (error) {
      console.error('Falha ao carregar missões:', error)
      setNotice({
        type: 'error',
        text: 'A folha de ponto sumiu. Confira se o SQL da Fase 3.19 foi executado.',
      })
      return
    }

    setEstado(normalizarEstado(data))
  }

  useEffect(() => {
    setNotice(null)
    void load()
  }, [session?.user?.id])

  const dailyReady = useMemo(
    () => estado.daily.filter((item) => item.claimable && !item.claimed).length,
    [estado.daily],
  )
  const weeklyReady = useMemo(
    () => estado.weekly.filter((item) => item.claimable && !item.claimed).length,
    [estado.weekly],
  )

  async function claim(mission) {
    if (!authenticated) {
      onOpenAuth?.()
      return
    }
    if (operating) return

    setOperating(mission.id)
    setNotice(null)

    const { data, error } = await supabase.rpc('claim_my_mission', {
      p_mission_id: mission.id,
    })

    if (error) {
      console.error('Resgate de missão recusado:', error)
      const raw = `${error.message || ''} ${error.details || ''}`
      let text = 'A banca recusou o resgate.'
      if (raw.includes('MISSION_NOT_COMPLETE')) text = 'A missão ainda não atingiu a meta.'
      if (raw.includes('MISSION_ALREADY_CLAIMED')) text = 'Essa missão já foi resgatada neste período.'
      if (raw.includes('ACCOUNT_SUSPENDED')) text = 'Conta suspensa: recompensas estão bloqueadas pela Central de Moderação.'
      setNotice({ type: 'error', text })
      setOperating('')
      return
    }

    if (data?.profile) onProfileChanged?.(data.profile)
    setEstado(normalizarEstado(data?.state))
    setNotice({
      type: 'success',
      text: data?.reward_cosmetic_id
        ? `Missão concluída: +${formatarMoedas(data.reward_coins)} T e o badge ${data.reward_cosmetic_name || 'especial'} foram arquivados.`
        : `Missão concluída: +${formatarMoedas(data?.reward_coins)} TaiCoins creditadas pela banca.`,
    })
    setOperating('')
  }

  async function toggleSpecialBadge() {
    const reward = estado.special_reward || {}
    if (!reward.owned || operating) return

    const removing = Boolean(reward.equipped)
    setOperating('special-badge')
    setNotice(null)

    const { data, error } = await supabase.rpc('set_my_taishop_cosmetic', {
      p_category: 'badge',
      p_cosmetic_id: removing ? null : reward.id,
    })

    if (error) {
      console.error('Falha ao equipar badge de missão:', error)
      setNotice({ type: 'error', text: 'A banca não conseguiu alterar o badge especial.' })
      setOperating('')
      return
    }

    onProfileChanged?.(data)
    await load({ silent: true })
    setNotice({
      type: 'success',
      text: removing
        ? 'Auditor da Semana saiu da sua ficha pública.'
        : 'Auditor da Semana agora aparece no seu perfil público.',
    })
    setOperating('')
  }

  if (!authenticated) {
    return (
      <div className="missions-page">
        <section className="missions-login-card">
          <span>FASE 3.19 · RH DA BANCA</span>
          <h1>Até a exploração precisa de crachá.</h1>
          <p>Entre na sua conta para receber missões, bater metas fictícias e ganhar dinheiro igualmente fictício.</p>
          <button type="button" onClick={onOpenAuth}>Entrar na banca</button>
        </section>
      </div>
    )
  }

  return (
    <div className="missions-page" data-neytai-target="missions-page">
      <section className="missions-hero">
        <div>
          <span>{siteTexts['missions.eyebrow'] || 'FASE 3.19 · DEPARTAMENTO DE PRODUTIVIDADE'}</span>
          <h1>{siteTexts['missions.title'] || 'A banca agora chama vício de produtividade.'}</h1>
          <p>
            {siteTexts['missions.description'] ||
              'Jogue, aposte e movimente TaiCoins para preencher metas que nenhum sindicato aprovou.'}
          </p>
        </div>

        <aside className="missions-summary-card">
          <small>CLIENTE EM EXPEDIENTE</small>
          <strong>{profile?.username || 'Funcionário sem crachá'}</strong>
          <span>{formatarMoedas(profile?.balance)} T disponíveis</span>
          <div>
            <b>{dailyReady + weeklyReady}</b>
            <small>recompensa(s) pronta(s)</small>
          </div>
        </aside>
      </section>

      {notice && (
        <div className={`missions-notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <section className="missions-rules">
        <div>
          <strong>Reset diário</strong>
          <span>00:00 · horário de Brasília</span>
        </div>
        <div>
          <strong>Reset semanal</strong>
          <span>Segunda-feira · 00:00</span>
        </div>
        <div>
          <strong>Progresso</strong>
          <span>Registrado pelo servidor da banca</span>
        </div>
        <button type="button" onClick={() => load()} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar progresso'}
        </button>
      </section>

      <section className="missions-section">
        <header>
          <div>
            <span>EXPEDIENTE DE HOJE</span>
            <h2>Missões diárias</h2>
          </div>
          <strong>{numero(estado.summary.daily_claimed)}/{estado.daily.length} resgatadas</strong>
        </header>

        <div className="missions-grid">
          {loading && estado.daily.length === 0 ? (
            <div className="missions-loading">Consultando o RH da Entidade...</div>
          ) : (
            estado.daily.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClaim={claim}
                operating={operating}
                cosmeticCatalog={cosmeticCatalog}
              />
            ))
          )}
        </div>
      </section>

      <section className="missions-section weekly">
        <header>
          <div>
            <span>METAS QUE DURAM MAIS QUE A DIGNIDADE</span>
            <h2>Missões semanais</h2>
          </div>
          <strong>{numero(estado.summary.weekly_claimed)}/{estado.weekly.length} resgatadas</strong>
        </header>

        <div className="missions-grid">
          {estado.weekly.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onClaim={claim}
              operating={operating}
              cosmeticCatalog={cosmeticCatalog}
            />
          ))}
        </div>
      </section>

      <section className={`mission-special-reward ${estado.special_reward?.owned ? 'is-owned' : ''}`}>
        <div className="mission-special-icon">✓</div>
        <div>
          <span>RECOMPENSA EXCLUSIVA · NÃO VENDIDA NA TAISHOP</span>
          <h2>{cosmeticCatalog[String(estado.special_reward?.id || '')]?.name || estado.special_reward?.name || 'Auditor da Semana'}</h2>
          <p>
            Resgate a missão semanal “Auditoria da semana” para receber este badge permanente.
            Depois disso ele pode ser equipado aqui sempre que você quiser substituir seu badge atual.
          </p>
        </div>
        <aside>
          {estado.special_reward?.owned ? (
            <>
              <strong>ADQUIRIDO</strong>
              <button
                type="button"
                onClick={toggleSpecialBadge}
                disabled={operating === 'special-badge'}
              >
                {operating === 'special-badge'
                  ? 'Processando...'
                  : estado.special_reward?.equipped
                    ? 'Desequipar badge'
                    : 'Equipar badge'}
              </button>
            </>
          ) : (
            <>
              <strong>BLOQUEADO</strong>
              <span>{rotuloBadge('badge_weekly_auditor')}</span>
            </>
          )}
        </aside>
      </section>

      <section className="missions-footer-actions">
        <button type="button" onClick={() => onNavigate?.('loja')}>Gastar recompensas na TaiShop →</button>
        <button type="button" onClick={() => onNavigate?.('progresso')}>Ver conquistas →</button>
      </section>
    </div>
  )
}
