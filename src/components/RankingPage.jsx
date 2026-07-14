import './RankingPage.css'
import entidadeBanca from '../assets/entidade-banca.png'

const participantesBase = [
  {
    id: 'taihen',
    nome: 'Taihen',
    titulo: 'Dona da banca',
    avatar: 'T',
    saldo: 12540,
    apostas: 48,
    ganhas: 31,
    perdidas: 12,
  },
  {
    id: 'pietro',
    nome: 'Pietro',
    titulo: 'Especialista em decisões ruins',
    avatar: 'P',
    saldo: 4870,
    apostas: 61,
    ganhas: 18,
    perdidas: 39,
  },
  {
    id: 'onion',
    nome: 'Onion Jr.',
    titulo: 'Profeta dos onions',
    avatar: 'O',
    saldo: 3260,
    apostas: 27,
    ganhas: 14,
    perdidas: 10,
  },
  {
    id: 'chat',
    nome: 'Chat da madrugada',
    titulo: 'Apostador coletivo',
    avatar: 'C',
    saldo: 740,
    apostas: 83,
    ganhas: 20,
    perdidas: 58,
  },
]

function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function calcularTaxa(ganhas, perdidas) {
  const resolvidas = ganhas + perdidas

  if (resolvidas === 0) {
    return 0
  }

  return (ganhas / resolvidas) * 100
}

function RankingPage({ historico = [], saldo = 0 }) {
  const ganhas = historico.filter(
    (aposta) => aposta.status === 'Ganhou',
  ).length

  const perdidas = historico.filter(
    (aposta) => aposta.status === 'Perdeu',
  ).length

  const pendentes = historico.filter(
    (aposta) => aposta.status === 'Pendente',
  ).length

  const totalApostado = historico.reduce(
    (total, aposta) => total + Number(aposta.valor || 0),
    0,
  )

  const premiosRecebidos = historico
    .filter((aposta) => aposta.status === 'Ganhou')
    .reduce(
      (total, aposta) =>
        total + Number(aposta.retornoEstimado || 0),
      0,
    )

  const lucroLiquido = premiosRecebidos - totalApostado

  const jogadorAtual = {
    id: 'voce',
    nome: 'Paulo',
    titulo: 'Criador da TaihenBet',
    avatar: 'P',
    saldo: Number(saldo) || 0,
    apostas: historico.length,
    ganhas,
    perdidas,
    pendentes,
  }

  const ranking = [...participantesBase, jogadorAtual].sort(
    (primeiro, segundo) => segundo.saldo - primeiro.saldo,
  )

  const posicaoAtual =
    ranking.findIndex(
      (participante) => participante.id === 'voce',
    ) + 1

  const topTres = ranking.slice(0, 3)

  const ordemPodio = [
    topTres[1],
    topTres[0],
    topTres[2],
  ].filter(Boolean)

  const maiorAzarado = [...ranking].sort(
    (primeiro, segundo) =>
      segundo.perdidas - primeiro.perdidas,
  )[0]

  return (
    <section className="ranking-page">
      <div className="ranking-header">
        <div>
          <span className="ranking-eyebrow">
            CLASSIFICAÇÃO ABSOLUTAMENTE CIENTÍFICA
          </span>

          <h1>Ranking da comunidade</h1>

          <p>
            Quem acumulou mais TaiCoins, quem acertou mais
            palpites e quem financiou a banca sozinho.
          </p>
        </div>

        <div className="ranking-local-badge">
          VERSÃO LOCAL / DEMONSTRATIVA
        </div>
      </div>

      <div className="ranking-player-summary">
        <article>
          <span>Sua posição</span>
          <strong>#{posicaoAtual}</strong>
        </article>

        <article>
          <span>Seu saldo</span>
          <strong>{formatarNumero(saldo)}</strong>
        </article>

        <article>
          <span>Taxa de acerto</span>
          <strong>
            {formatarNumero(
              calcularTaxa(ganhas, perdidas),
            )}
            %
          </strong>
        </article>

        <article>
          <span>Lucro líquido</span>
          <strong
            className={
              lucroLiquido >= 0
                ? 'ranking-positive'
                : 'ranking-negative'
            }
          >
            {lucroLiquido >= 0 ? '+' : ''}
            {formatarNumero(lucroLiquido)}
          </strong>
        </article>
      </div>

      <div className="ranking-podium">
        {ordemPodio.map((participante) => {
          const posicao =
            ranking.findIndex(
              (item) => item.id === participante.id,
            ) + 1

          return (
            <article
              className={`podium-card podium-position-${posicao}`}
              key={participante.id}
            >
              <div className="podium-position">
                {posicao === 1 ? '★' : posicao}
              </div>

              <div className="podium-avatar">
                {participante.avatar}
              </div>

              <h2>{participante.nome}</h2>
              <p>{participante.titulo}</p>

              <strong>
                {formatarNumero(participante.saldo)}
                <span> TaiCoins</span>
              </strong>

              <div className="podium-record">
                <span>{participante.ganhas} vitórias</span>
                <span>{participante.perdidas} derrotas</span>
              </div>
            </article>
          )
        })}
      </div>

      <div className="ranking-content-grid">
        <div className="ranking-table-card">
          <div className="ranking-section-heading">
            <div>
              <span>CLASSIFICAÇÃO GERAL</span>
              <h2>Os maiores especialistas</h2>
            </div>

            <strong>{ranking.length}</strong>
          </div>

          <div className="ranking-table">
            <div className="ranking-table-head">
              <span>#</span>
              <span>Participante</span>
              <span>Saldo</span>
              <span>Apostas</span>
              <span>V / D</span>
              <span>Acerto</span>
            </div>

            {ranking.map((participante, indice) => (
              <div
                className={`ranking-table-row ${
                  participante.id === 'voce'
                    ? 'ranking-current-player'
                    : ''
                }`}
                key={participante.id}
              >
                <strong className="ranking-number">
                  {indice + 1}
                </strong>

                <div className="ranking-person">
                  <div>{participante.avatar}</div>

                  <span>
                    <strong>
                      {participante.nome}
                      {participante.id === 'voce' && (
                        <em>VOCÊ</em>
                      )}
                    </strong>

                    <small>{participante.titulo}</small>
                  </span>
                </div>

                <strong className="ranking-balance">
                  {formatarNumero(participante.saldo)}
                </strong>

                <span>{participante.apostas}</span>

                <span>
                  {participante.ganhas} /{' '}
                  {participante.perdidas}
                </span>

                <span>
                  {formatarNumero(
                    calcularTaxa(
                      participante.ganhas,
                      participante.perdidas,
                    ),
                  )}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="ranking-side">
          <article className="ranking-entity-card">
            <div className="ranking-entity-image">
              <img
                src={entidadeBanca}
                alt="Mascote oficial da TaihenBet"
              />

              <span>ENTIDADE DA BANCA</span>
            </div>

            <div className="ranking-entity-content">
              <span className="ranking-card-label">
                O ORÁCULO DAS ODDS
              </span>

              <h2>A banca está observando.</h2>

              <p>
                Cada palpite ruim fortalece a entidade oficial
                da TaihenBet.
              </p>

              <div className="ranking-entity-verdict">
                <span>Escolhido do Hall da Vergonha</span>

                <strong>{maiorAzarado.nome}</strong>

                <small>
                  {maiorAzarado.perdidas} derrotas registradas
                </small>
              </div>
            </div>
          </article>

          <article className="ranking-your-stats">
            <span className="ranking-card-label">
              SEUS NÚMEROS
            </span>

            <div>
              <span>Apostas pendentes</span>
              <strong>{pendentes}</strong>
            </div>

            <div>
              <span>Total apostado</span>
              <strong>
                {formatarNumero(totalApostado)}
              </strong>
            </div>

            <div>
              <span>Prêmios recebidos</span>
              <strong>
                {formatarNumero(premiosRecebidos)}
              </strong>
            </div>

            <div>
              <span>Vitórias / derrotas</span>
              <strong>
                {ganhas} / {perdidas}
              </strong>
            </div>
          </article>
        </aside>
      </div>

      <p className="ranking-disclaimer">
        Os outros participantes são dados demonstrativos.
        Quando a TaihenBet tiver login e banco de dados, o
        ranking poderá ser compartilhado entre usuários reais.
      </p>
    </section>
  )
}

export default RankingPage
