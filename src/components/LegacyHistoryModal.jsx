import './LegacyHistoryModal.css'

export default function LegacyHistoryModal({ sportsCount = 0, gamesCount = 0, onImport, onStartFresh, loading = false }) {
  const total = Number(sportsCount) + Number(gamesCount)

  return (
    <div className="legacy-history-backdrop">
      <section className="legacy-history-modal" role="dialog" aria-modal="true" aria-labelledby="legacy-history-title">
        <div className="legacy-history-seal">ARQUIVO MORTO</div>
        <span className="legacy-history-kicker">AUDITORIA DE PROVAS ANTIGAS</span>
        <h2 id="legacy-history-title">Encontramos decisões questionáveis neste navegador.</h2>
        <p>
          Antes das contas existirem, a TaihenBet guardava o histórico localmente. A banca encontrou <strong>{total} registro(s)</strong> e precisa saber se eles pertencem a esta conta.
        </p>

        <div className="legacy-history-stats">
          <article><span>Apostas esportivas</span><strong>{sportsCount}</strong></article>
          <article><span>Jogos da entidade</span><strong>{gamesCount}</strong></article>
        </div>

        <div className="legacy-history-actions">
          <button type="button" className="primary" onClick={onImport} disabled={loading}>
            {loading ? 'Arquivando provas...' : 'Importar meu histórico antigo'}
          </button>
          <button type="button" onClick={onStartFresh} disabled={loading}>
            Começar com ficha limpa
          </button>
        </div>

        <small>Essa decisão aparece uma única vez por conta. Depois disso, o arquivo passa a viver no Supabase.</small>
      </section>
    </div>
  )
}
