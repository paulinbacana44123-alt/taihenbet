import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { NEYTAI_DEFAULT_STEPS } from '../data/neytaiTour'
import './ContentAdminPanel.css'

const EMPTY = {
  achievements: [],
  missions: [],
  cosmetics: [],
  seasons: [],
  season_missions: [],
  season_tiers: [],
  companies: [],
  texts: [],
  neytai_messages: [],
}

const COMPANY_EMPTY = {
  id: null,
  name: '',
  symbol: '',
  sector: '',
  slogan: '',
  description: '',
  status_label: 'OPERANDO',
  status_tone: 'green',
  image_key: '',
}

const COMPANY_IMAGE_OPTIONS = [
  { value: '', label: 'Sem imagem' },
  { value: 'taihen-airlines', label: 'Taihen Airlines' },
  { value: 'dji', label: 'DJI' },
  { value: 'nasa', label: 'NASA' },
  { value: 'siv', label: 'SIV' },
  { value: 'godot', label: 'Godot' },
]

const PROMO_EMPTY = {
  id: null,
  code: '',
  label: '',
  amount: 100,
  audience: 'everyone',
  allowed_usernames: [],
  max_uses_per_user: 1,
  max_total_uses: '',
  active: true,
  starts_at: '',
  expires_at: '',
  note: '',
  total_redemptions: 0,
}

function numero(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function dataLocalInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="content-studio-section-header">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="content-studio-header-actions">{actions}</div>}
    </header>
  )
}

function Toggle({ checked, onChange, label = 'Ativo' }) {
  return (
    <label className="content-studio-toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export default function ContentAdminPanel() {
  const [tab, setTab] = useState('textos')
  const [snapshot, setSnapshot] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [companyDraft, setCompanyDraft] = useState(COMPANY_EMPTY)
  const [promoCodes, setPromoCodes] = useState([])
  const [promoDraft, setPromoDraft] = useState(PROMO_EMPTY)
  const [neytaiQuery, setNeytaiQuery] = useState('')
  const [neytaiGroup, setNeytaiGroup] = useState('todos')
  const [neytaiSelectedId, setNeytaiSelectedId] = useState('boasVindas')

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true)

    const [contentResult, promoResult] = await Promise.all([
      supabase.rpc('get_content_studio_snapshot'),
      supabase.rpc('get_admin_promo_codes'),
    ])

    if (!silent) setLoading(false)

    if (contentResult.error) {
      setNotice({ type: 'error', text: contentResult.error.message || 'A Central de Conteúdo não respondeu.' })
      return
    }

    setSnapshot({ ...EMPTY, ...(contentResult.data || {}) })
    setPromoCodes(
      promoResult.error || !Array.isArray(promoResult.data)
        ? []
        : promoResult.data,
    )
    setDrafts({})

    if (promoResult.error && !String(promoResult.error?.message || '').includes('function')) {
      setNotice({ type: 'error', text: promoResult.error.message || 'O editor de códigos não respondeu.' })
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function getDraft(kind, id, original) {
    return drafts[`${kind}:${id}`] || original
  }

  function updateDraft(kind, id, original, field, value) {
    const key = `${kind}:${id}`
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] || original),
        [field]: value,
      },
    }))
  }

  async function run(key, rpc, args, success) {
    if (busy) return
    setBusy(key)
    setNotice(null)
    const { error } = await supabase.rpc(rpc, args)
    if (error) {
      setNotice({ type: 'error', text: error.message || 'A banca recusou a alteração.' })
      setBusy('')
      return false
    }
    await load({ silent: true })
    window.dispatchEvent(new Event('taihenbet-content-updated'))
    setNotice({ type: 'success', text: success })
    setBusy('')
    return true
  }

  async function saveAchievement(item) {
    const d = getDraft('achievement', item.key, item)
    await run(
      `achievement:${item.key}`,
      'admin_update_achievement_catalog',
      {
        p_key: item.key,
        p_name: d.name,
        p_description: d.description,
        p_title: d.title,
        p_category: d.category,
        p_target: numero(d.target),
        p_icon: d.icon,
        p_sort_order: Number.parseInt(d.sort_order, 10) || 0,
        p_active: Boolean(d.active),
      },
      `Conquista “${d.name}” atualizada.`,
    )
  }

  async function saveMission(item) {
    const d = getDraft('mission', item.id, item)
    await run(
      `mission:${item.id}`,
      'admin_update_mission_catalog',
      {
        p_id: item.id,
        p_title: d.title,
        p_description: d.description,
        p_icon: d.icon,
        p_target: numero(d.target),
        p_reward_coins: numero(d.reward_coins),
        p_sort_order: Number.parseInt(d.sort_order, 10) || 0,
        p_active: Boolean(d.active),
      },
      `Missão “${d.title}” atualizada.`,
    )
  }

  async function saveCosmetic(item) {
    const d = getDraft('cosmetic', item.id, item)
    await run(
      `cosmetic:${item.id}`,
      'admin_update_cosmetic_catalog',
      {
        p_id: item.id,
        p_name: d.name,
        p_description: d.description,
        p_price: numero(d.price),
        p_rarity: d.rarity,
        p_sort_order: Number.parseInt(d.sort_order, 10) || 0,
        p_active: Boolean(d.active),
      },
      `Cosmético “${d.name}” atualizado.`,
    )
  }

  async function saveSeason(item) {
    const d = getDraft('season', item.id, item)
    await run(
      `season:${item.id}`,
      'admin_update_season',
      {
        p_id: item.id,
        p_name: d.name,
        p_subtitle: d.subtitle,
        p_description: d.description,
        p_starts_at: new Date(d.starts_at).toISOString(),
        p_ends_at: new Date(d.ends_at).toISOString(),
        p_active: Boolean(d.active),
        p_sort_order: Number.parseInt(d.sort_order, 10) || 0,
      },
      `Temporada “${d.name}” atualizada.`,
    )
  }

  async function saveSeasonMission(item) {
    const id = `${item.season_id}:${item.mission_id}`
    const d = getDraft('seasonMission', id, item)
    await run(
      `seasonMission:${id}`,
      'admin_update_season_mission',
      {
        p_season_id: item.season_id,
        p_mission_id: item.mission_id,
        p_title: d.title,
        p_description: d.description,
        p_icon: d.icon,
        p_target: numero(d.target),
        p_reward_coins: numero(d.reward_coins),
        p_reward_points: Number.parseInt(d.reward_points, 10) || 0,
        p_sort_order: Number.parseInt(d.sort_order, 10) || 0,
      },
      `Objetivo sazonal “${d.title}” atualizado.`,
    )
  }

  async function saveTier(item) {
    const id = `${item.season_id}:${item.tier_key}`
    const d = getDraft('tier', id, item)
    await run(
      `tier:${id}`,
      'admin_update_season_tier',
      {
        p_season_id: item.season_id,
        p_tier_key: item.tier_key,
        p_name: d.name,
        p_points_required: Number.parseInt(d.points_required, 10) || 1,
        p_reward_coins: numero(d.reward_coins),
        p_sort_order: Number.parseInt(d.sort_order, 10) || 0,
      },
      `Marco “${d.name}” atualizado.`,
    )
  }

  async function saveText(item) {
    const d = getDraft('text', item.key, item)
    await run(
      `text:${item.key}`,
      'admin_update_site_text',
      { p_key: item.key, p_value: d.value },
      `Texto “${item.label}” atualizado.`,
    )
  }

  async function resetText(item) {
    await run(
      `text-reset:${item.key}`,
      'admin_reset_site_text',
      { p_key: item.key },
      `Texto “${item.label}” voltou ao padrão.`,
    )
  }

  async function saveNeytaiMessage(item) {
    const d = getDraft('neytai', item.id, item)
    await run(
      `neytai:${item.id}`,
      'admin_upsert_neytai_message_override',
      {
        p_step_id: item.id,
        p_title: d.titulo || '',
        p_body: d.texto || '',
        p_instruction: d.instrucao || '',
        p_pause_button: d.botaoPausa || '',
        p_tips: Array.isArray(d.dicas) ? d.dicas : [],
      },
      `Fala “${item.id}” do Neytai atualizada.`,
    )
  }

  async function resetNeytaiMessage(item) {
    await run(
      `neytai-reset:${item.id}`,
      'admin_reset_neytai_message_override',
      { p_step_id: item.id },
      `Fala “${item.id}” voltou ao texto original.`,
    )
  }

  function editCompany(company = null) {
    setCompanyDraft(company ? { ...company } : { ...COMPANY_EMPTY })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveCompany(event) {
    event.preventDefault()
    const d = companyDraft
    const ok = await run(
      `company:${d.id || 'new'}`,
      'admin_upsert_taihen_group_company',
      {
        p_company_id: d.id || null,
        p_name: d.name,
        p_symbol: d.symbol,
        p_sector: d.sector,
        p_slogan: d.slogan,
        p_description: d.description,
        p_status_label: d.status_label,
        p_status_tone: d.status_tone,
        p_image_key: d.image_key || '',
      },
      d.id ? `Empresa “${d.name}” atualizada.` : `Empresa “${d.name}” adicionada ao grupo.`,
    )
    if (ok) setCompanyDraft(COMPANY_EMPTY)
  }

  async function deleteCompany(company) {
    if (!window.confirm(`Remover ${company.name} do Grupo TaihenBet?`)) return
    await run(
      `company-delete:${company.id}`,
      'admin_delete_taihen_group_company',
      { p_company_id: company.id },
      `${company.name} removida do conglomerado.`,
    )
  }

  function editPromoCode(item = null) {
    if (!item) {
      setPromoDraft({ ...PROMO_EMPTY })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setPromoDraft({
      ...PROMO_EMPTY,
      ...item,
      allowed_usernames: Array.isArray(item.allowed_usernames) ? item.allowed_usernames : [],
      max_uses_per_user: item.max_uses_per_user ?? '',
      max_total_uses: item.max_total_uses ?? '',
      starts_at: dataLocalInput(item.starts_at),
      expires_at: dataLocalInput(item.expires_at),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function nullableInteger(value) {
    if (value === '' || value === null || value === undefined) return null
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  function nullableDate(value) {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  async function savePromoCode(event) {
    event.preventDefault()

    const allowed = Array.isArray(promoDraft.allowed_usernames)
      ? promoDraft.allowed_usernames
      : String(promoDraft.allowed_usernames || '')
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean)

    const ok = await run(
      `promo:${promoDraft.id || 'new'}`,
      'admin_upsert_promo_code',
      {
        p_id: promoDraft.id || null,
        p_code: promoDraft.code,
        p_label: promoDraft.label,
        p_amount: numero(promoDraft.amount),
        p_audience: promoDraft.audience,
        p_allowed_usernames: allowed,
        p_max_uses_per_user: nullableInteger(promoDraft.max_uses_per_user),
        p_max_total_uses: nullableInteger(promoDraft.max_total_uses),
        p_active: Boolean(promoDraft.active),
        p_starts_at: nullableDate(promoDraft.starts_at),
        p_expires_at: nullableDate(promoDraft.expires_at),
        p_note: promoDraft.note || '',
      },
      promoDraft.id
        ? `Código “${promoDraft.code}” atualizado.`
        : `Código “${promoDraft.code}” criado.`,
    )

    if (ok) setPromoDraft({ ...PROMO_EMPTY })
  }

  async function deletePromoCode(item) {
    if (!window.confirm(`Excluir o código “${item.code}” e o histórico de resgates dele?`)) return

    const ok = await run(
      `promo-delete:${item.id}`,
      'admin_delete_promo_code',
      { p_id: item.id },
      `Código “${item.code}” removido da banca.`,
    )

    if (ok && promoDraft.id === item.id) setPromoDraft({ ...PROMO_EMPTY })
  }

  const activeSeason = useMemo(
    () => snapshot.seasons.find((item) => item.active) || snapshot.seasons[0] || null,
    [snapshot.seasons],
  )

  const seasonMissions = useMemo(
    () => snapshot.season_missions.filter((item) => item.season_id === activeSeason?.id),
    [snapshot.season_missions, activeSeason?.id],
  )

  const seasonTiers = useMemo(
    () => snapshot.season_tiers.filter((item) => item.season_id === activeSeason?.id),
    [snapshot.season_tiers, activeSeason?.id],
  )

  const textSections = useMemo(() => {
    const groups = new Map()
    snapshot.texts.forEach((item) => {
      if (!groups.has(item.section)) groups.set(item.section, [])
      groups.get(item.section).push(item)
    })
    return [...groups.entries()]
  }, [snapshot.texts])

  const neytaiSteps = useMemo(() => {
    const overrides = new Map(
      snapshot.neytai_messages.map((item) => [item.step_id, item]),
    )

    return Object.values(NEYTAI_DEFAULT_STEPS).map((step) => {
      const custom = overrides.get(step.id)
      return {
        ...step,
        titulo: custom ? custom.title : step.titulo,
        texto: custom ? custom.body : step.texto,
        instrucao: custom ? custom.instruction || '' : step.instrucao || '',
        botaoPausa: custom ? custom.pause_button || '' : step.botaoPausa || '',
        dicas: custom && Array.isArray(custom.tips)
          ? custom.tips
          : step.dicas || [],
        customized: Boolean(custom),
      }
    })
  }, [snapshot.neytai_messages])

  const neytaiGroups = useMemo(
    () => [...new Set(neytaiSteps.map((item) => item.grupo))],
    [neytaiSteps],
  )

  const filteredNeytaiSteps = useMemo(() => {
    const q = neytaiQuery.trim().toLowerCase()
    return neytaiSteps.filter((item) => {
      if (neytaiGroup !== 'todos' && item.grupo !== neytaiGroup) return false
      if (!q) return true
      return [item.id, item.grupo, item.titulo, item.texto, item.pagina, item.alvo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    })
  }, [neytaiSteps, neytaiQuery, neytaiGroup])

  const selectedNeytaiStep = useMemo(
    () =>
      filteredNeytaiSteps.find((item) => item.id === neytaiSelectedId) ||
      filteredNeytaiSteps[0] ||
      null,
    [filteredNeytaiSteps, neytaiSelectedId],
  )

  if (loading) {
    return <div className="content-studio-state">Abrindo o editor do universo...</div>
  }

  return (
    <section className="content-studio">
      <SectionHeader
        eyebrow="CENTRAL DE CONTEÚDO"
        title="Edite o site sem abrir o código."
        description="Textos, metas, recompensas, títulos, preços, temporada e empresas ficam sob controle da banca. IDs internos e tipos de evento continuam protegidos para não destruir a lógica do site."
        actions={<button type="button" onClick={() => load()}>Atualizar dados</button>}
      />

      {notice && (
        <div className={`content-studio-notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <nav className="content-studio-tabs">
        {[
          ['textos', 'Textos do site'],
          ['neytai', 'Neytai'],
          ['conquistas', 'Conquistas'],
          ['missoes', 'Missões'],
          ['loja', 'TaiShop'],
          ['temporada', 'Temporada'],
          ['codigos', 'Códigos'],
          ['empresas', 'Empresas'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'textos' && (
        <div className="content-studio-stack">
          {textSections.map(([section, items]) => (
            <section className="content-studio-group" key={section}>
              <h3>{section}</h3>
              <div className="content-studio-text-grid">
                {items.map((item) => {
                  const d = getDraft('text', item.key, item)
                  return (
                    <article className="content-studio-card" key={item.key}>
                      <small>{item.key}</small>
                      <h4>{item.label}</h4>
                      <textarea
                        rows={Math.max(2, Math.min(7, Math.ceil(String(d.value || '').length / 70) + 2))}
                        value={d.value || ''}
                        onChange={(e) => updateDraft('text', item.key, item, 'value', e.target.value)}
                      />
                      <div className="content-studio-card-actions">
                        <button type="button" className="secondary" onClick={() => resetText(item)} disabled={Boolean(busy)}>Restaurar padrão</button>
                        <button type="button" onClick={() => saveText(item)} disabled={Boolean(busy)}>{busy === `text:${item.key}` ? 'Salvando...' : 'Salvar'}</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === 'neytai' && (
        <div className="content-studio-stack">
          <SectionHeader
            eyebrow="ASSISTENTE PESSOAL"
            title="Editor de falas da Neytai"
            description="Altere títulos, mensagens, instruções, botões e dicas sem tocar no fluxo técnico do tour. Página, alvo, modo, ordem e IDs continuam protegidos pelo código."
          />

          <div className="neytai-studio-filters">
            <label>
              Buscar fala
              <input
                value={neytaiQuery}
                onChange={(e) => setNeytaiQuery(e.target.value)}
                placeholder="Ex.: Museu, mandioca, boasVindas..."
              />
            </label>
            <label>
              Grupo
              <select value={neytaiGroup} onChange={(e) => setNeytaiGroup(e.target.value)}>
                <option value="todos">Todos os grupos</option>
                {neytaiGroups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </label>
            <div className="neytai-studio-count">
              <strong>{filteredNeytaiSteps.length}</strong>
              <span>falas encontradas</span>
            </div>
          </div>

          <div className="neytai-studio-layout">
            <aside className="neytai-studio-list">
              {filteredNeytaiSteps.length === 0 ? (
                <div className="content-studio-state">Nenhuma fala encontrada.</div>
              ) : (
                filteredNeytaiSteps.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${selectedNeytaiStep?.id === item.id ? 'active' : ''} ${item.customized ? 'customized' : ''}`}
                    onClick={() => setNeytaiSelectedId(item.id)}
                  >
                    <span>{item.numero}. {item.grupo}</span>
                    <strong>{item.titulo}</strong>
                    <small>{item.id}{item.customized ? ' · PERSONALIZADA' : ''}</small>
                  </button>
                ))
              )}
            </aside>

            {selectedNeytaiStep && (() => {
              const item = selectedNeytaiStep
              const d = getDraft('neytai', item.id, item)
              const tips = Array.isArray(d.dicas) ? d.dicas : []
              return (
                <article className="content-studio-editor featured neytai-studio-editor" key={item.id}>
                  <div className="content-studio-editor-title">
                    <div>
                      <small>{item.id} · ETAPA {item.numero}</small>
                      <h3>{d.titulo || 'Fala sem título'}</h3>
                    </div>
                    <span className={`neytai-custom-state ${item.customized ? 'customized' : ''}`}>
                      {item.customized ? 'PERSONALIZADA' : 'PADRÃO DO CÓDIGO'}
                    </span>
                  </div>

                  <div className="neytai-tech-grid">
                    <div><span>Grupo</span><strong>{item.grupo}</strong></div>
                    <div><span>Página</span><strong>{item.pagina || 'qualquer'}</strong></div>
                    <div><span>Modo</span><strong>{item.modo}</strong></div>
                    <div><span>Alvo</span><strong>{item.alvo || '—'}</strong></div>
                  </div>

                  <div className="content-studio-form-grid neytai-form-grid">
                    <label className="wide">
                      Título da fala
                      <input
                        value={d.titulo || ''}
                        onChange={(e) => updateDraft('neytai', item.id, item, 'titulo', e.target.value)}
                      />
                    </label>
                    <label className="wide">
                      Mensagem principal
                      <textarea
                        rows="7"
                        value={d.texto || ''}
                        onChange={(e) => updateDraft('neytai', item.id, item, 'texto', e.target.value)}
                      />
                    </label>
                    <label className="wide">
                      Instrução destacada
                      <textarea
                        rows="2"
                        value={d.instrucao || ''}
                        onChange={(e) => updateDraft('neytai', item.id, item, 'instrucao', e.target.value)}
                        placeholder="Deixe vazio se esta etapa não usa instrução."
                      />
                    </label>
                    <label>
                      Texto do botão de pausa
                      <input
                        value={d.botaoPausa || ''}
                        onChange={(e) => updateDraft('neytai', item.id, item, 'botaoPausa', e.target.value)}
                        placeholder="Usado apenas nas etapas do tipo pausa"
                      />
                    </label>
                    <label className="wide">
                      Dicas — uma por linha
                      <textarea
                        rows="5"
                        value={tips.join('\n')}
                        onChange={(e) =>
                          updateDraft(
                            'neytai',
                            item.id,
                            item,
                            'dicas',
                            e.target.value
                              .split('\n')
                              .map((tip) => tip.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="neytai-message-preview">
                    <div className="neytai-message-preview-top">
                      <span>PREVIEW · ASSISTENTE PESSOAL · {item.grupo}</span>
                      <strong>Neytai</strong>
                    </div>
                    <h4>{d.titulo || 'Fala sem título'}</h4>
                    <p>{d.texto || 'Sem mensagem.'}</p>
                    {tips.length > 0 && (
                      <ul>{tips.map((tip, index) => <li key={`${tip}-${index}`}>{tip}</li>)}</ul>
                    )}
                    {d.instrucao && <div className="neytai-preview-instruction">{d.instrucao}</div>}
                    {item.modo === 'pausa' && (
                      <span className="neytai-preview-button">{d.botaoPausa || 'Continuar'}</span>
                    )}
                  </div>

                  <p className="content-studio-locked">
                    Protegidos: ID, número, grupo, página, alvo, jogo, modo de avanço e restrição administrativa. Isso mantém o tour funcional mesmo com o texto completamente personalizado.
                  </p>

                  <div className="content-studio-card-actions neytai-editor-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => resetNeytaiMessage(item)}
                      disabled={Boolean(busy) || !item.customized}
                    >
                      Restaurar fala original
                    </button>
                    <button
                      type="button"
                      onClick={() => saveNeytaiMessage(item)}
                      disabled={Boolean(busy)}
                    >
                      {busy === `neytai:${item.id}` ? 'Salvando...' : 'Salvar fala da Neytai'}
                    </button>
                  </div>
                </article>
              )
            })()}
          </div>
        </div>
      )}

      {tab === 'conquistas' && (
        <div className="content-studio-list">
          {snapshot.achievements.map((item) => {
            const d = getDraft('achievement', item.key, item)
            return (
              <article className="content-studio-editor" key={item.key}>
                <div className="content-studio-editor-title">
                  <div><small>{item.key}</small><h3>{d.name}</h3></div>
                  <Toggle checked={d.active} onChange={(value) => updateDraft('achievement', item.key, item, 'active', value)} />
                </div>
                <div className="content-studio-form-grid">
                  <label>Nome<input value={d.name || ''} onChange={(e) => updateDraft('achievement', item.key, item, 'name', e.target.value)} /></label>
                  <label>Título desbloqueado<input value={d.title || ''} onChange={(e) => updateDraft('achievement', item.key, item, 'title', e.target.value)} /></label>
                  <label>Categoria<input value={d.category || ''} onChange={(e) => updateDraft('achievement', item.key, item, 'category', e.target.value)} /></label>
                  <label>Ícone<input value={d.icon || ''} onChange={(e) => updateDraft('achievement', item.key, item, 'icon', e.target.value)} /></label>
                  <label>Meta<input type="number" min="0.01" step="0.01" value={d.target} onChange={(e) => updateDraft('achievement', item.key, item, 'target', e.target.value)} /></label>
                  <label>Ordem<input type="number" value={d.sort_order} onChange={(e) => updateDraft('achievement', item.key, item, 'sort_order', e.target.value)} /></label>
                  <label className="wide">Descrição<textarea rows="3" value={d.description || ''} onChange={(e) => updateDraft('achievement', item.key, item, 'description', e.target.value)} /></label>
                </div>
                <button type="button" onClick={() => saveAchievement(item)} disabled={Boolean(busy)}>{busy === `achievement:${item.key}` ? 'Salvando...' : 'Salvar conquista'}</button>
              </article>
            )
          })}
        </div>
      )}

      {tab === 'missoes' && (
        <div className="content-studio-list">
          {snapshot.missions.map((item) => {
            const d = getDraft('mission', item.id, item)
            return (
              <article className="content-studio-editor" key={item.id}>
                <div className="content-studio-editor-title">
                  <div><small>{item.id} · {item.cadence} · {item.event_type}</small><h3>{d.title}</h3></div>
                  <Toggle checked={d.active} onChange={(value) => updateDraft('mission', item.id, item, 'active', value)} />
                </div>
                <div className="content-studio-form-grid">
                  <label>Título<input value={d.title || ''} onChange={(e) => updateDraft('mission', item.id, item, 'title', e.target.value)} /></label>
                  <label>Ícone<input value={d.icon || ''} onChange={(e) => updateDraft('mission', item.id, item, 'icon', e.target.value)} /></label>
                  <label>Meta<input type="number" min="0.01" step="0.01" value={d.target} onChange={(e) => updateDraft('mission', item.id, item, 'target', e.target.value)} /></label>
                  <label>Recompensa (T)<input type="number" min="0" step="0.01" value={d.reward_coins} onChange={(e) => updateDraft('mission', item.id, item, 'reward_coins', e.target.value)} /></label>
                  <label>Ordem<input type="number" value={d.sort_order} onChange={(e) => updateDraft('mission', item.id, item, 'sort_order', e.target.value)} /></label>
                  <label className="wide">Descrição<textarea rows="3" value={d.description || ''} onChange={(e) => updateDraft('mission', item.id, item, 'description', e.target.value)} /></label>
                </div>
                <p className="content-studio-locked">Cadência e tipo de evento ficam travados porque são parte da lógica de contagem.</p>
                <button type="button" onClick={() => saveMission(item)} disabled={Boolean(busy)}>Salvar missão</button>
              </article>
            )
          })}
        </div>
      )}

      {tab === 'loja' && (
        <div className="content-studio-list">
          {snapshot.cosmetics.map((item) => {
            const d = getDraft('cosmetic', item.id, item)
            return (
              <article className="content-studio-editor" key={item.id}>
                <div className="content-studio-editor-title">
                  <div><small>{item.id} · {item.category}</small><h3>{d.name}</h3></div>
                  <Toggle checked={d.active} onChange={(value) => updateDraft('cosmetic', item.id, item, 'active', value)} />
                </div>
                <div className="content-studio-form-grid">
                  <label>Nome<input value={d.name || ''} onChange={(e) => updateDraft('cosmetic', item.id, item, 'name', e.target.value)} /></label>
                  <label>Preço<input type="number" min="0" step="0.01" value={d.price} onChange={(e) => updateDraft('cosmetic', item.id, item, 'price', e.target.value)} /></label>
                  <label>Raridade<input value={d.rarity || ''} onChange={(e) => updateDraft('cosmetic', item.id, item, 'rarity', e.target.value)} /></label>
                  <label>Ordem<input type="number" value={d.sort_order} onChange={(e) => updateDraft('cosmetic', item.id, item, 'sort_order', e.target.value)} /></label>
                  <label className="wide">Descrição<textarea rows="3" value={d.description || ''} onChange={(e) => updateDraft('cosmetic', item.id, item, 'description', e.target.value)} /></label>
                </div>
                <p className="content-studio-locked">A categoria visual fica travada para não equipar uma moldura no slot de badge por acidente.</p>
                <button type="button" onClick={() => saveCosmetic(item)} disabled={Boolean(busy)}>Salvar cosmético</button>
              </article>
            )
          })}
        </div>
      )}

      {tab === 'temporada' && (
        <div className="content-studio-stack">
          {!activeSeason ? (
            <div className="content-studio-state">Nenhuma temporada cadastrada.</div>
          ) : (
            <>
              {(() => {
                const d = getDraft('season', activeSeason.id, activeSeason)
                const safe = { ...d, starts_at: d.starts_at || activeSeason.starts_at, ends_at: d.ends_at || activeSeason.ends_at }
                return (
                  <article className="content-studio-editor featured">
                    <div className="content-studio-editor-title">
                      <div><small>{activeSeason.id}</small><h3>{safe.name}</h3></div>
                      <Toggle checked={safe.active} onChange={(value) => updateDraft('season', activeSeason.id, activeSeason, 'active', value)} label="Temporada ativa" />
                    </div>
                    <div className="content-studio-form-grid">
                      <label>Nome<input value={safe.name || ''} onChange={(e) => updateDraft('season', activeSeason.id, activeSeason, 'name', e.target.value)} /></label>
                      <label>Subtítulo<input value={safe.subtitle || ''} onChange={(e) => updateDraft('season', activeSeason.id, activeSeason, 'subtitle', e.target.value)} /></label>
                      <label>Início<input type="datetime-local" value={dataLocalInput(safe.starts_at)} onChange={(e) => updateDraft('season', activeSeason.id, activeSeason, 'starts_at', e.target.value)} /></label>
                      <label>Fim<input type="datetime-local" value={dataLocalInput(safe.ends_at)} onChange={(e) => updateDraft('season', activeSeason.id, activeSeason, 'ends_at', e.target.value)} /></label>
                      <label>Ordem<input type="number" value={safe.sort_order} onChange={(e) => updateDraft('season', activeSeason.id, activeSeason, 'sort_order', e.target.value)} /></label>
                      <label className="wide">Descrição<textarea rows="4" value={safe.description || ''} onChange={(e) => updateDraft('season', activeSeason.id, activeSeason, 'description', e.target.value)} /></label>
                    </div>
                    <p className="content-studio-warning">Datas alteram imediatamente a janela da temporada. Use com carinho ou a safra pode morrer no meio do expediente.</p>
                    <button type="button" onClick={() => saveSeason({ ...activeSeason, ...safe })} disabled={Boolean(busy)}>Salvar temporada</button>
                  </article>
                )
              })()}

              <SectionHeader eyebrow="OBJETIVOS" title="Missões sazonais" />
              <div className="content-studio-list compact">
                {seasonMissions.map((item) => {
                  const id = `${item.season_id}:${item.mission_id}`
                  const d = getDraft('seasonMission', id, item)
                  return (
                    <article className="content-studio-editor" key={id}>
                      <div className="content-studio-editor-title"><div><small>{item.metric}</small><h3>{d.title}</h3></div></div>
                      <div className="content-studio-form-grid">
                        <label>Título<input value={d.title || ''} onChange={(e) => updateDraft('seasonMission', id, item, 'title', e.target.value)} /></label>
                        <label>Ícone<input value={d.icon || ''} onChange={(e) => updateDraft('seasonMission', id, item, 'icon', e.target.value)} /></label>
                        <label>Meta<input type="number" value={d.target} onChange={(e) => updateDraft('seasonMission', id, item, 'target', e.target.value)} /></label>
                        <label>Recompensa (T)<input type="number" min="0" value={d.reward_coins} onChange={(e) => updateDraft('seasonMission', id, item, 'reward_coins', e.target.value)} /></label>
                        <label>Pontos<input type="number" min="0" value={d.reward_points} onChange={(e) => updateDraft('seasonMission', id, item, 'reward_points', e.target.value)} /></label>
                        <label>Ordem<input type="number" value={d.sort_order} onChange={(e) => updateDraft('seasonMission', id, item, 'sort_order', e.target.value)} /></label>
                        <label className="wide">Descrição<textarea rows="3" value={d.description || ''} onChange={(e) => updateDraft('seasonMission', id, item, 'description', e.target.value)} /></label>
                      </div>
                      <button type="button" onClick={() => saveSeasonMission(item)} disabled={Boolean(busy)}>Salvar objetivo</button>
                    </article>
                  )
                })}
              </div>

              <SectionHeader eyebrow="TRILHA" title="Marcos de recompensa" />
              <div className="content-studio-list compact">
                {seasonTiers.map((item) => {
                  const id = `${item.season_id}:${item.tier_key}`
                  const d = getDraft('tier', id, item)
                  return (
                    <article className="content-studio-editor" key={id}>
                      <div className="content-studio-editor-title"><div><small>{item.tier_key}</small><h3>{d.name}</h3></div></div>
                      <div className="content-studio-form-grid">
                        <label>Nome<input value={d.name || ''} onChange={(e) => updateDraft('tier', id, item, 'name', e.target.value)} /></label>
                        <label>Pontos necessários<input type="number" min="1" value={d.points_required} onChange={(e) => updateDraft('tier', id, item, 'points_required', e.target.value)} /></label>
                        <label>Recompensa (T)<input type="number" min="0" value={d.reward_coins} onChange={(e) => updateDraft('tier', id, item, 'reward_coins', e.target.value)} /></label>
                        <label>Ordem<input type="number" value={d.sort_order} onChange={(e) => updateDraft('tier', id, item, 'sort_order', e.target.value)} /></label>
                      </div>
                      <button type="button" onClick={() => saveTier(item)} disabled={Boolean(busy)}>Salvar marco</button>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'codigos' && (
        <div className="content-studio-promo-layout">
          <form className="content-studio-editor featured" onSubmit={savePromoCode}>
            <div className="content-studio-editor-title">
              <div>
                <small>CORRUPÇÃO PROGRAMÁVEL</small>
                <h3>{promoDraft.id ? 'Editar código' : 'Novo código da banca'}</h3>
              </div>
              <div className="promo-studio-title-actions">
                <Toggle
                  checked={promoDraft.active}
                  onChange={(value) => setPromoDraft((d) => ({ ...d, active: value }))}
                  label="Ativo"
                />
                {promoDraft.id && (
                  <button type="button" className="secondary" onClick={() => setPromoDraft({ ...PROMO_EMPTY })}>
                    Novo código
                  </button>
                )}
              </div>
            </div>

            <div className="content-studio-form-grid promo-studio-form-grid">
              <label>
                Código
                <input
                  required
                  maxLength={80}
                  value={promoDraft.code || ''}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, code: e.target.value }))}
                  placeholder="Ex.: MamboForever"
                />
              </label>
              <label>
                Valor em TaiCoins
                <input
                  required
                  type="number"
                  step="0.01"
                  value={promoDraft.amount}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, amount: e.target.value }))}
                />
              </label>
              <label>
                Público
                <select
                  value={promoDraft.audience}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, audience: e.target.value }))}
                >
                  <option value="everyone">Todos que souberem o código</option>
                  <option value="admin">Somente administradores</option>
                  <option value="allowlist">Lista de usuários</option>
                </select>
              </label>
              <label>
                Usos por conta
                <input
                  type="number"
                  min="1"
                  placeholder="Vazio = infinito"
                  value={promoDraft.max_uses_per_user ?? ''}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, max_uses_per_user: e.target.value }))}
                />
              </label>
              <label>
                Usos totais
                <input
                  type="number"
                  min="1"
                  placeholder="Vazio = infinito"
                  value={promoDraft.max_total_uses ?? ''}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, max_total_uses: e.target.value }))}
                />
              </label>
              <label>
                Nome exibido
                <input
                  value={promoDraft.label || ''}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, label: e.target.value }))}
                  placeholder="Bônus clandestino"
                />
              </label>
              <label>
                Começa em
                <input
                  type="datetime-local"
                  value={promoDraft.starts_at || ''}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, starts_at: e.target.value }))}
                />
              </label>
              <label>
                Expira em
                <input
                  type="datetime-local"
                  value={promoDraft.expires_at || ''}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, expires_at: e.target.value }))}
                />
              </label>

              {promoDraft.audience === 'allowlist' && (
                <label className="wide">
                  Usuários autorizados
                  <textarea
                    rows="2"
                    value={Array.isArray(promoDraft.allowed_usernames)
                      ? promoDraft.allowed_usernames.join(', ')
                      : promoDraft.allowed_usernames || ''}
                    onChange={(e) => setPromoDraft((d) => ({ ...d, allowed_usernames: e.target.value }))}
                    placeholder="Paulin, Pietro"
                  />
                </label>
              )}

              <label className="wide">
                Nota administrativa
                <textarea
                  rows="3"
                  value={promoDraft.note || ''}
                  onChange={(e) => setPromoDraft((d) => ({ ...d, note: e.target.value }))}
                  placeholder="Essa nota só aparece no Painel."
                />
              </label>
            </div>

            <p className="content-studio-warning">
              Valor negativo também funciona. O saldo do usuário nunca fica abaixo de zero.
              Deixe limites vazios para uso ilimitado.
            </p>

            <button type="submit" disabled={Boolean(busy)}>
              {busy === `promo:${promoDraft.id || 'new'}`
                ? 'Protocolando...' : promoDraft.id ? 'Salvar código' : 'Criar código'}
            </button>
          </form>

          <div className="content-studio-promo-list">
            {promoCodes.length === 0 ? (
              <div className="content-studio-state">Nenhum código cadastrado.</div>
            ) : promoCodes.map((item) => (
              <article className="content-studio-card promo-studio-card" key={item.id}>
                <div className="promo-studio-card-top">
                  <div>
                    <small>{item.audience === 'everyone' ? 'PÚBLICO' : item.audience === 'admin' ? 'ADMIN' : 'LISTA PRIVADA'}</small>
                    <h4>{item.code}</h4>
                  </div>
                  <strong className={numero(item.amount) < 0 ? 'negative' : ''}>
                    {numero(item.amount) >= 0 ? '+' : '−'}{Math.abs(numero(item.amount)).toLocaleString('pt-BR')} T
                  </strong>
                </div>
                <p>{item.label || 'Código da banca'}</p>
                <div className="promo-studio-meta">
                  <span>{item.active ? 'ATIVO' : 'DESATIVADO'}</span>
                  <span>{item.total_redemptions || 0} resgates</span>
                  <span>{item.max_uses_per_user ? `${item.max_uses_per_user}x por conta` : '∞ por conta'}</span>
                </div>
                {item.audience === 'allowlist' && (
                  <p className="promo-studio-allowlist">
                    Permitidos: {(item.allowed_usernames || []).join(', ') || 'ninguém'}
                  </p>
                )}
                {item.note && <p className="promo-studio-note">{item.note}</p>}
                <div className="content-studio-card-actions">
                  <button type="button" className="secondary" onClick={() => editPromoCode(item)}>Editar</button>
                  <button type="button" className="danger" onClick={() => deletePromoCode(item)}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'empresas' && (
        <div className="content-studio-company-layout">
          <form className="content-studio-editor featured" onSubmit={saveCompany}>
            <div className="content-studio-editor-title">
              <div><small>DIRETORIA DA HOLDING</small><h3>{companyDraft.id ? 'Editar empresa' : 'Nova empresa'}</h3></div>
              {companyDraft.id && <button type="button" className="secondary" onClick={() => setCompanyDraft(COMPANY_EMPTY)}>Cancelar</button>}
            </div>
            <div className="content-studio-form-grid">
              <label>Nome<input required value={companyDraft.name} onChange={(e) => setCompanyDraft((d) => ({ ...d, name: e.target.value }))} /></label>
              <label>Sigla<input required value={companyDraft.symbol} onChange={(e) => setCompanyDraft((d) => ({ ...d, symbol: e.target.value }))} /></label>
              <label>Setor<input required value={companyDraft.sector} onChange={(e) => setCompanyDraft((d) => ({ ...d, sector: e.target.value }))} /></label>
              <label>Status<input required value={companyDraft.status_label} onChange={(e) => setCompanyDraft((d) => ({ ...d, status_label: e.target.value }))} /></label>
              <label>Tom do status<select value={companyDraft.status_tone} onChange={(e) => setCompanyDraft((d) => ({ ...d, status_tone: e.target.value }))}><option value="green">Verde</option><option value="gold">Dourado</option><option value="pink">Rosa</option><option value="red">Vermelho</option><option value="neutral">Neutro</option></select></label>
              <label>Imagem do card<select value={companyDraft.image_key || ''} onChange={(e) => setCompanyDraft((d) => ({ ...d, image_key: e.target.value }))}>{COMPANY_IMAGE_OPTIONS.map((option) => <option key={option.value || 'none'} value={option.value}>{option.label}</option>)}</select></label>
              <label className="wide">Slogan<input value={companyDraft.slogan} onChange={(e) => setCompanyDraft((d) => ({ ...d, slogan: e.target.value }))} /></label>
              <label className="wide">Descrição<textarea required rows="4" value={companyDraft.description} onChange={(e) => setCompanyDraft((d) => ({ ...d, description: e.target.value }))} /></label>
            </div>
            <button type="submit" disabled={Boolean(busy)}>{companyDraft.id ? 'Salvar empresa' : 'Adicionar empresa'}</button>
          </form>

          <div className="content-studio-company-list">
            {snapshot.companies.map((company) => (
              <article className="content-studio-card" key={company.id}>
                <small>{company.symbol} · {company.sector}</small>
                <h4>{company.name}</h4>
                <p>{company.description}</p>
                <div className="content-studio-card-actions">
                  <button type="button" className="secondary" onClick={() => editCompany(company)}>Editar</button>
                  <button type="button" className="danger" onClick={() => deleteCompany(company)}>Remover</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
