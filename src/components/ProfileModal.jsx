import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PROFILE_AVATARS, avatarDoPerfil } from '../data/profileAvatars'
import './ProfileModal.css'

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function formatarData(valor) {
  if (!valor) return 'Data confiscada pela banca'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(valor))
}

export default function ProfileModal({ session, profile, saldo, historico = [], historicoJogos = [], onClose, onSaved }) {
  const [username, setUsername] = useState(profile?.username || '')
  const [avatarKey, setAvatarKey] = useState(profile?.avatar_key || 'taihen')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const avatarAtual = useMemo(() => avatarDoPerfil(avatarKey), [avatarKey])
  const registros = [...historico, ...historicoJogos]
  const wins = registros.filter((item) => item.status === 'Ganhou').length
  const losses = registros.filter((item) => item.status === 'Perdeu').length
  const staked = historico.reduce((sum, item) => sum + Number(item.valor || 0), 0)
    + historicoJogos.reduce((sum, item) => sum + Number(item.entrada || 0), 0)
  const payout = historico.filter((item) => item.status === 'Ganhou').reduce((sum, item) => sum + Number(item.retornoPago ?? item.retornoEstimado ?? 0), 0)
    + historicoJogos.reduce((sum, item) => sum + Number(item.premio || 0), 0)
  const net = payout - staked

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function fecharComEsc(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', fecharComEsc)
    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', fecharComEsc)
    }
  }, [onClose])

  async function salvar(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const nome = username.trim()
    if (nome.length < 2) return setError('O nome precisa ter pelo menos 2 caracteres.')
    if (nome.length > 24) return setError('O nome pode ter no máximo 24 caracteres.')

    setLoading(true)
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ username: nome, avatar_key: avatarKey })
      .eq('id', session.user.id)
      .select('*')
      .single()
    setLoading(false)

    if (updateError) {
      setError(updateError.message || 'A banca se recusou a editar seu perfil.')
      return
    }

    setSuccess('Perfil atualizado. A burocracia venceu mais uma vez.')
    onSaved?.(data)
  }

  return (
    <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="profile-modal profile-modal-complete" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <button type="button" className="profile-close" onClick={onClose} aria-label="Fechar">×</button>

        <aside className="profile-preview">
          <div className="profile-preview-kicker">IDENTIDADE CADASTRADA</div>
          <div className="profile-preview-avatar"><img src={avatarAtual.src} alt="Avatar escolhido" /></div>
          <strong>{username.trim() || profile?.username || 'Apostador'}</strong>
          <small className="profile-verified-line">✓ Conta verificada pela banca</small>

          <div className="profile-balance-card"><span>Patrimônio fictício</span><b>{formatarMoedas(saldo)} TaiCoins</b></div>
          {profile?.role === 'admin' && <div className="profile-admin-badge">✦ ADMINISTRADOR DA BANCA</div>}

          <div className="profile-record-mini">
            <div><span>V</span><strong>{wins}</strong></div>
            <div><span>D</span><strong>{losses}</strong></div>
            <div><span>Registros</span><strong>{registros.length}</strong></div>
          </div>
        </aside>

        <form className="profile-editor" onSubmit={salvar}>
          <div className="profile-kicker">TAIHENBET ONLINE · FICHA DA CONTA</div>
          <h2 id="profile-title">Meu perfil</h2>
          <p>Agora sua ficha criminal fictícia tem patrimônio, arquivo persistente e estatísticas suficientes para ser julgada pela comunidade.</p>

          <div className="profile-stat-grid">
            <article><span>Conta criada em</span><strong>{formatarData(profile?.created_at)}</strong></article>
            <article><span>Patente</span><strong>{profile?.role === 'admin' ? 'Admin da banca' : 'Apostador'}</strong></article>
            <article><span>Total colocado em risco</span><strong>{formatarMoedas(staked)} T</strong></article>
            <article><span>Lucro líquido registrado</span><strong className={net >= 0 ? 'positive' : 'negative'}>{net > 0 ? '+' : ''}{formatarMoedas(net)} T</strong></article>
          </div>

          <label className="profile-field">
            <span>Nome na TaihenBet</span>
            <input type="text" value={username} onChange={(event) => { setUsername(event.target.value); setError(''); setSuccess('') }} minLength={2} maxLength={24} autoComplete="nickname" />
          </label>

          <fieldset className="avatar-picker">
            <legend>Avatar oficial da vergonha</legend>
            <div className="avatar-grid">
              {PROFILE_AVATARS.map((avatar) => (
                <button type="button" key={avatar.key} className={avatarKey === avatar.key ? 'selected' : ''} onClick={() => { setAvatarKey(avatar.key); setError(''); setSuccess('') }}>
                  <img src={avatar.src} alt="" aria-hidden="true" /><span>{avatar.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="profile-verification-card">
            <div className="profile-verification-icon">✓</div>
            <div>
              <span>IDENTIDADE VINCULADA</span>
              <strong>E-mail confirmado pela banca</strong>
              <small>Os dados técnicos ficam escondidos para não transformar seu perfil num painel de banco de dados.</small>
            </div>
          </div>

          <details className="profile-technical">
            <summary>Ver dados técnicos da conta</summary>
            <div className="profile-technical-content">
              <div className="profile-readonly"><span>E-mail vinculado</span><strong>{session?.user?.email}</strong></div>
              <div className="profile-readonly"><span>ID da conta</span><strong className="profile-id">{session?.user?.id}</strong></div>
              <p>Essas informações aparecem apenas no seu próprio perfil. Não fazem parte do ranking público.</p>
            </div>
          </details>

          {error && <div className="profile-feedback error">{error}</div>}
          {success && <div className="profile-feedback success">{success}</div>}
          <button type="submit" className="profile-save" disabled={loading}>{loading ? 'Carimbando documentos...' : 'Salvar identidade'}</button>
        </form>
      </section>
    </div>
  )
}
