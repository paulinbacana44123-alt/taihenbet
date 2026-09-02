import './AccountSuspensionNotice.css'

function AccountSuspensionNotice({ profile }) {
  if (!profile?.is_suspended) return null

  return (
    <section className="account-suspension-notice" role="status">
      <div className="account-suspension-symbol">!</div>

      <div>
        <span>CONTA SUSPENSA PELA BANCA</span>
        <strong>Modo espectador ativado.</strong>
        <p>
          Você ainda pode entrar e navegar pela TaihenBet, mas jogos,
          apostas e publicações da comunidade ficam bloqueados até a
          administração reativar sua conta.
        </p>

        {profile.suspended_reason && (
          <small>
            <b>Motivo registrado:</b> {profile.suspended_reason}
          </small>
        )}
      </div>
    </section>
  )
}

export default AccountSuspensionNotice
