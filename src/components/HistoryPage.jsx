import React from 'react'
import './HistoryPage.css'
import entidadeBanca from '../assets/entidade-banca.png'

function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function statusClass(status = '') {
  return String(status).toLowerCase().replaceAll(' ', '-')
}

export default function HistoryPage({ sports = [], games = [], synced = false, onNavigate }) {
  const [tab, setTab] = React.useState('todos')
  const sportsEntries = sports.map((item) => ({ ...item, arquivoTipo: 'sports' }))
  const gamesEntries = games.map((item) => ({ ...item, arquivoTipo: 'game' }))
  const all = [...sportsEntries, ...gamesEntries].sort((a, b) => Number(b.criadaEm || 0) - Number(a.criadaEm || 0))
  const entries = tab === 'sports' ? sportsEntries : tab === 'games' ? gamesEntries : all

  const totalStaked = sports.reduce((sum, item) => sum + Number(item.valor || 0), 0)
    + games.reduce((sum, item) => sum + Number(item.entrada || 0), 0)
  const totalWon = all.filter((item) => item.status === 'Ganhou').length
  const totalLost = all.filter((item) => item.status === 'Perdeu').length
  const pending = sports.filter((item) => item.status === 'Pendente').length

  return (
    <section className="account-history-page" data-neytai-target="history-page">
      <header className="account-history-header">
        <div>
          <span>ARQUIVO PERSISTENTE DA BANCA</span>
          <h1>Histórico da conta</h1>
          <p>Agora as decisões ruins sobrevivem a F5, troca de navegador e tentativas de esquecer o passado.</p>
        </div>
        <div className={`history-cloud-badge ${synced ? 'ready' : ''}`}>
          <i /> {synced ? 'SINCRONIZADO COM A CONTA' : 'CONSULTANDO O ARQUIVO'}
        </div>
      </header>

      <div className="account-history-summary">
        <article><span>Registros</span><strong>{all.length}</strong></article>
        <article><span>TaiCoins colocadas em risco</span><strong>{formatarNumero(totalStaked)}</strong></article>
        <article><span>Vitórias / derrotas</span><strong>{totalWon} / {totalLost}</strong></article>
        <article><span>Pendentes</span><strong>{pending}</strong></article>
      </div>

      <div className="history-tabs">
        <button className={tab === 'todos' ? 'active' : ''} onClick={() => setTab('todos')}>Tudo <b>{all.length}</b></button>
        <button className={tab === 'sports' ? 'active' : ''} onClick={() => setTab('sports')}>Apostas esportivas <b>{sports.length}</b></button>
        <button className={tab === 'games' ? 'active' : ''} onClick={() => setTab('games')}>Jogos da entidade <b>{games.length}</b></button>
      </div>

      {entries.length === 0 ? (
        <div className="history-empty oracle-history-empty account-history-empty">
          <div className="oracle-history-image"><img src={entidadeBanca} alt="Entidade da banca" /></div>
          <span className="oracle-small-label">O ORÁCULO NÃO ENCONTROU PROVAS</span>
          <h2>Nenhuma decisão registrada</h2>
          <p>A ficha está limpa. A entidade considera isso temporário.</p>
          <button className="hero-button" onClick={() => onNavigate?.('jogos')}>Produzir evidências</button>
        </div>
      ) : (
        <div className="account-history-list">
          {entries.map((entry, index) => (
            <article className="account-history-card" key={`${entry.arquivoTipo}-${entry.id || index}`}>
              <div className="account-history-card-head">
                <div>
                  <span>{entry.arquivoTipo === 'game' ? 'JOGO DA ENTIDADE' : entry.tipo === 'derby' ? 'TAIHEN DERBY' : 'BILHETE ESPORTIVO'}</span>
                  <h2>{entry.arquivoTipo === 'game' ? (entry.jogo || 'Minijogo') : (entry.tipo === 'derby' ? 'Corrida do Derby' : `Bilhete com ${entry.selecoes?.length || 0} seleção(ões)`)}</h2>
                  <small>{entry.data || 'Data não registrada'}</small>
                </div>
                <strong className={`account-history-status status-${statusClass(entry.status)}`}>{entry.status || 'Registrado'}</strong>
              </div>

              {entry.arquivoTipo === 'sports' ? (
                <>
                  <div className="account-history-selection-list">
                    {(entry.selecoes || []).map((selection, selectionIndex) => (
                      <div key={`${selection.opcaoId || selectionIndex}-${selectionIndex}`}>
                        <span>{selection.eventoTitulo || 'Mercado'}</span>
                        <strong>{selection.opcaoNome || 'Seleção'} <b>{Number(selection.odd || 0).toFixed(2)}</b></strong>
                      </div>
                    ))}
                  </div>
                  <div className="account-history-meta">
                    <div><span>Entrada</span><strong>{formatarNumero(entry.valor)} T</strong></div>
                    <div><span>Odd</span><strong>{Number(entry.oddTotal || 0).toFixed(2)}</strong></div>
                    <div><span>Retorno possível</span><strong>{formatarNumero(entry.retornoEstimado)} T</strong></div>
                  </div>
                </>
              ) : (
                <div className="account-history-meta game-meta">
                  <div><span>Jogo</span><strong>{entry.jogo || 'Minijogo'}</strong></div>
                  <div><span>Entrada</span><strong>{formatarNumero(entry.entrada)} T</strong></div>
                  <div><span>Prêmio</span><strong>{formatarNumero(entry.premio)} T</strong></div>
                  <div><span>Lucro</span><strong className={Number(entry.lucro || 0) >= 0 ? 'positive' : 'negative'}>{Number(entry.lucro || 0) > 0 ? '+' : ''}{formatarNumero(entry.lucro)} T</strong></div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="account-history-disclaimer">O histórico detalhado é privado da conta. O Ranking recebe apenas estatísticas agregadas — nunca seu e-mail ou a lista completa de apostas.</p>
    </section>
  )
}

