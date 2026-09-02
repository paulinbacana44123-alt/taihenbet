import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { avatarDoPerfil } from '../data/profileAvatars'
import './AccountMenu.css'

function nomeDoUsuario(user, profile) {
  const profileName = profile?.username?.trim()
  if (profileName) return profileName

  const metadataName = user?.user_metadata?.username?.trim()
  if (metadataName) return metadataName

  return user?.email?.split('@')[0] || 'Apostador'
}

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

export default function AccountMenu({
  session,
  authReady,
  profile,
  profileReady,
  saldo,
  onOpenAuth,
  onOpenProfile,
}) {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function fecharFora(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', fecharFora)
    return () => document.removeEventListener('mousedown', fecharFora)
  }, [])

  if (!authReady) {
    return <div className="auth-header-loading" aria-label="Carregando conta" />
  }

  if (!session?.user) {
    return (
      <div className="auth-header-actions">
        <button type="button" onClick={() => onOpenAuth('login')}>
          Entrar
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => onOpenAuth('register')}
        >
          Criar conta
        </button>
      </div>
    )
  }

  const user = session.user
  const username = nomeDoUsuario(user, profile)
  const initial = username.charAt(0).toUpperCase()
  const avatar = avatarDoPerfil(profile?.avatar_key)

  async function sair() {
    setSigningOut(true)
    await supabase.auth.signOut()
    setSigningOut(false)
    setOpen(false)
  }

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        className="account-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="account-avatar image-avatar">
          {profileReady ? <img src={avatar.src} alt="" aria-hidden="true" /> : initial}
        </span>
        <span className="account-copy">
          <small>{profile?.role === 'admin' ? 'Admin da banca' : 'Conta conectada'}</small>
          <strong>{username}</strong>
        </span>
        <span className="account-chevron">⌄</span>
      </button>

      {open && (
        <div className="account-dropdown">
          <div className="account-dropdown-head">
            <span className="account-avatar large image-avatar">
              {profileReady ? <img src={avatar.src} alt="" aria-hidden="true" /> : initial}
            </span>
            <div>
              <strong>{username}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <div className="account-wallet-row">
            <span>Patrimônio</span>
            <strong>{formatarMoedas(saldo)} T</strong>
          </div>

          <div className="account-online-badge">
            <i />
            {profileReady ? 'Perfil sincronizado' : 'Consultando a banca...'}
          </div>

          <button
            type="button"
            className="account-profile-button"
            onClick={() => {
              setOpen(false)
              onOpenProfile?.()
            }}
            disabled={!profileReady || !profile}
          >
            Meu perfil
          </button>

          <button
            type="button"
            className="account-signout"
            onClick={sair}
            disabled={signingOut}
          >
            {signingOut ? 'Saindo...' : 'Sair da conta'}
          </button>
        </div>
      )}
    </div>
  )
}
