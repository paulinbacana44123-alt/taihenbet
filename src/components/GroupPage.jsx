import { useCallback, useEffect, useMemo, useState } from 'react'
import './GroupPage.css'
import { supabase } from '../lib/supabase'
import { useSiteTexts } from '../hooks/useEditableContent'
import taihenAirlinesImage from '../assets/group/taihen-airlines.png'
import djiImage from '../assets/group/dji.png'
import nasaImage from '../assets/group/nasa.png'
import sivImage from '../assets/group/siv.png'
import godotImage from '../assets/group/godot.png'

const EMPTY_FORM = {
  name: '',
  symbol: '',
  sector: '',
  slogan: '',
  description: '',
  status_label: 'OPERANDO',
  status_tone: 'green',
  image_key: '',
}


const COMPANY_IMAGES = {
  'taihen-airlines': taihenAirlinesImage,
  dji: djiImage,
  nasa: nasaImage,
  siv: sivImage,
  godot: godotImage,
}

const IMAGE_OPTIONS = [
  { value: '', label: 'Sem imagem' },
  { value: 'taihen-airlines', label: 'Taihen Airlines' },
  { value: 'dji', label: 'DJI' },
  { value: 'nasa', label: 'NASA' },
  { value: 'siv', label: 'SIV' },
  { value: 'godot', label: 'Godot' },
]

const STATUS_TONES = [
  { value: 'green', label: 'Verde' },
  { value: 'gold', label: 'Dourado' },
  { value: 'pink', label: 'Rosa' },
  { value: 'red', label: 'Vermelho' },
  { value: 'neutral', label: 'Neutro' },
]

function normalizeCompany(row) {
  return {
    id: row.id,
    name: row.name || 'Empresa sem nome',
    symbol: row.symbol || 'TB',
    sector: row.sector || 'Operações questionáveis',
    slogan: row.slogan || '',
    description: row.description || '',
    status_label: row.status_label || 'OPERANDO',
    status_tone: row.status_tone || 'neutral',
    image_key: row.image_key || '',
    created_at: row.created_at,
  }
}

function GroupPage({ profile }) {
  const siteTexts = useSiteTexts()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const isAdmin = profile?.role === 'admin'

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: rpcError } = await supabase.rpc(
      'get_taihen_group_companies',
    )

    if (rpcError) {
      setError(
        rpcError.message || 'A holding se recusou a entregar os documentos.',
      )
      setLoading(false)
      return
    }

    setCompanies(
      (Array.isArray(data) ? data : []).map(normalizeCompany),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const sectors = useMemo(
    () => new Set(companies.map((company) => company.sector)).size,
    [companies],
  )

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setEditorOpen(true)
    setError('')
    setNotice('')
  }

  function openEdit(company) {
    setEditingId(company.id)
    setForm({
      name: company.name,
      symbol: company.symbol,
      sector: company.sector,
      slogan: company.slogan,
      description: company.description,
      status_label: company.status_label,
      status_tone: company.status_tone,
      image_key: company.image_key || '',
    })
    setEditorOpen(true)
    setError('')
    setNotice('')
  }

  function closeEditor() {
    if (saving) return
    setEditorOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveCompany(event) {
    event.preventDefault()
    if (!isAdmin || saving) return

    setSaving(true)
    setError('')
    setNotice('')

    const { error: rpcError } = await supabase.rpc(
      'admin_upsert_taihen_group_company',
      {
        p_company_id: editingId,
        p_name: form.name,
        p_symbol: form.symbol,
        p_sector: form.sector,
        p_slogan: form.slogan,
        p_description: form.description,
        p_status_label: form.status_label,
        p_status_tone: form.status_tone,
        p_image_key: form.image_key || '',
      },
    )

    if (rpcError) {
      setError(rpcError.message || 'A diretoria rejeitou a papelada.')
      setSaving(false)
      return
    }

    setNotice(
      editingId
        ? 'Cadastro corporativo atualizado pela banca.'
        : 'Nova empresa absorvida pelo conglomerado.',
    )
    setEditorOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSaving(false)
    await loadCompanies()
  }

  async function deleteCompany(company) {
    if (!isAdmin || deletingId) return

    const confirmed = window.confirm(
      `Remover ${company.name} do Grupo TaihenBet?`,
    )
    if (!confirmed) return

    setDeletingId(company.id)
    setError('')
    setNotice('')

    const { error: rpcError } = await supabase.rpc(
      'admin_delete_taihen_group_company',
      { p_company_id: company.id },
    )

    if (rpcError) {
      setError(rpcError.message || 'A empresa se recusou a ser desincorporada.')
      setDeletingId(null)
      return
    }

    setNotice(`${company.name} foi removida do organograma.`)
    setDeletingId(null)
    await loadCompanies()
  }

  return (
    <section className="group-page">
      <div className="group-hero">
        <div className="group-hero-copy">
          <span className="group-kicker">
            {siteTexts['group.eyebrow'] || 'CONGLOMERADO 100% FICTÍCIO'}
          </span>
          <h1>{siteTexts['group.title'] || 'Empresas do Grupo TaihenBet'}</h1>
          <p>
            {siteTexts['group.description'] ||
              'Participações, aquisições e divisões empresariais que existem somente dentro da piada. Nenhuma organização real foi comprada pela banca.'}
          </p>

          <div className="group-stats">
            <div>
              <strong>{companies.length}</strong>
              <span>empresas catalogadas</span>
            </div>
            <div>
              <strong>{sectors}</strong>
              <span>setores dominados</span>
            </div>
            <div>
              <strong>0 R$</strong>
              <span>capital real envolvido</span>
            </div>
          </div>
        </div>

        <div className="group-seal" aria-hidden="true">
          <span>TB</span>
          <small>HOLDING</small>
        </div>
      </div>

      <div className="group-toolbar">
        <div>
          <span className="group-kicker">MAPA SOCIETÁRIO DA BANCA</span>
          <h2>Portfólio empresarial</h2>
        </div>

        <div className="group-toolbar-actions">
          <button type="button" className="group-secondary" onClick={loadCompanies}>
            Atualizar
          </button>
          {isAdmin && (
            <button type="button" className="group-primary" onClick={openCreate}>
              + Registrar empresa
            </button>
          )}
        </div>
      </div>

      {notice && <div className="group-notice success">{notice}</div>}
      {error && <div className="group-notice error">{error}</div>}

      {editorOpen && isAdmin && (
        <form className="group-editor" onSubmit={saveCompany}>
          <div className="group-editor-heading">
            <div>
              <span className="group-kicker">DIRETORIA DA HOLDING</span>
              <h3>{editingId ? 'Editar empresa' : 'Nova aquisição fictícia'}</h3>
            </div>
            <button type="button" className="group-close" onClick={closeEditor}>
              ×
            </button>
          </div>

          <div className="group-form-grid">
            <label>
              Nome
              <input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                maxLength={80}
                required
                placeholder="Ex.: Taihen Airlines"
              />
            </label>

            <label>
              Símbolo / sigla
              <input
                value={form.symbol}
                onChange={(e) => updateForm('symbol', e.target.value)}
                maxLength={16}
                required
                placeholder="Ex.: TA"
              />
            </label>

            <label>
              Setor
              <input
                value={form.sector}
                onChange={(e) => updateForm('sector', e.target.value)}
                maxLength={80}
                required
                placeholder="Ex.: Aviação questionável"
              />
            </label>

            <label>
              Status
              <input
                value={form.status_label}
                onChange={(e) => updateForm('status_label', e.target.value)}
                maxLength={50}
                required
                placeholder="Ex.: OPERANDO"
              />
            </label>

            <label className="group-form-wide">
              Slogan
              <input
                value={form.slogan}
                onChange={(e) => updateForm('slogan', e.target.value)}
                maxLength={180}
                placeholder="Frase corporativa duvidosa"
              />
            </label>

            <label>
              Cor do status
              <select
                value={form.status_tone}
                onChange={(e) => updateForm('status_tone', e.target.value)}
              >
                {STATUS_TONES.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Identidade visual
              <select
                value={form.image_key}
                onChange={(e) => updateForm('image_key', e.target.value)}
              >
                {IMAGE_OPTIONS.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="group-form-wide group-description-field">
              Descrição
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                maxLength={1200}
                rows={5}
                required
                placeholder="Explique por que esta empresa caiu nas mãos da banca..."
              />
              <small>{form.description.length}/1200</small>
            </label>
          </div>

          <div className="group-editor-actions">
            <button type="button" className="group-secondary" onClick={closeEditor}>
              Cancelar
            </button>
            <button type="submit" className="group-primary" disabled={saving}>
              {saving ? 'Protocolando...' : editingId ? 'Salvar alterações' : 'Concluir aquisição'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="group-empty">Consultando o organograma secreto da banca...</div>
      ) : companies.length === 0 ? (
        <div className="group-empty">
          A holding está estranhamente sem subsidiárias. Isso parece suspeito.
        </div>
      ) : (
        <div className="group-grid">
          {companies.map((company, index) => (
            <article className="group-company-card" key={company.id}>
              <div className="group-company-topline">
                <span className="group-company-number">
                  EMPRESA {String(index + 1).padStart(2, '0')}
                </span>
                <span className={`group-status ${company.status_tone}`}>
                  {company.status_label}
                </span>
              </div>

              {company.image_key && COMPANY_IMAGES[company.image_key] && (
                <div
                  className={`group-company-media ${
                    company.image_key === 'taihen-airlines' ? 'is-banner' : 'is-logo'
                  }`}
                >
                  <img
                    src={COMPANY_IMAGES[company.image_key]}
                    alt={`Identidade visual de ${company.name}`}
                    loading="lazy"
                  />
                </div>
              )}

              <div className="group-company-identity">
                <div className="group-company-symbol">{company.symbol}</div>
                <div>
                  <span>{company.sector}</span>
                  <h3>{company.name}</h3>
                </div>
              </div>

              {company.slogan && (
                <blockquote>“{company.slogan}”</blockquote>
              )}

              <p className="group-company-description">{company.description}</p>

              <div className="group-company-footer">
                <span>PARTICIPAÇÃO FICTÍCIA • GRUPO TAIHENBET</span>
                {isAdmin && (
                  <div className="group-admin-actions">
                    <button type="button" onClick={() => openEdit(company)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={deletingId === company.id}
                      onClick={() => deleteCompany(company)}
                    >
                      {deletingId === company.id ? 'Removendo...' : 'Excluir'}
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default GroupPage
