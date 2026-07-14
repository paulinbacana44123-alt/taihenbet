import './SportsHome.css'
import entidadeBanca from '../assets/entidade-banca.png'
import museuCusto from '../assets/museu-custo.jpg'
import museuListening from '../assets/museu-listening.png'
import museuCalendario from '../assets/museu-calendario.png'
import {
  timesBahrein,
  timesBahreinPorId,
} from '../data/bahrainLeague'

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function SportsHome({
  eventos,
  rodada,
  saldo,
  selecoes,
  valorAposta,
  oddTotal,
  retornoEstimado,
  onSelecionarOdd,
  onRemoverSelecao,
  onLimparBilhete,
  onValorApostaChange,
  onAdicionarValor,
  onConfirmarAposta,
  onIrParaJogos,
  onIrParaMuseu,
}) {
  const partidas = eventos
    .filter(
      (evento) => evento.tipo === 'futebol-bahrein',
    )
    .sort(
      (a, b) =>
        String(a.horario).localeCompare(String(b.horario)),
    )

  function opcaoSelecionada(eventoId, opcaoId) {
    return selecoes.some(
      (selecao) =>
        String(selecao.eventoId) === String(eventoId) &&
        String(selecao.opcaoId) === String(opcaoId),
    )
  }

  return (
    <section className="sports-home" id="mercados">
      <div
        className="sports-hero general-home-hero"
        data-neytai-target="home-general"
      >
        <div className="sports-hero-copy">
          <span className="sports-eyebrow">
            CENTRAL GERAL DA TAIHENBET
          </span>

          <h1>
            Toda a maluquice
            <br />
            <b>em um único site.</b>
          </h1>

          <p>
            Apostas esportivas fictícias, minijogos absurdos,
            corridas manipuladas pela Mambo, anúncios em troca de
            TaiCoins e nenhuma intenção de parecer uma plataforma
            séria.
          </p>

          <div className="sports-hero-actions">
            <button
              type="button"
              className="general-primary-action"
              onClick={onIrParaJogos}
            >
              Explorar jogos da entidade
            </button>

            <a
              href="#rodada-bahrein"
              data-neytai-target="sports-button"
            >
              Ver apostas esportivas
            </a>
          </div>

          <div className="general-home-features">
            <article>
              <span>01</span>
              <div>
                <strong>Jogos da Entidade</strong>
                <small>
                  TaiMandioca, Taigrinho, Crash e Taihen Derby.
                </small>
              </div>
            </article>

            <article>
              <span>02</span>
              <div>
                <strong>Apostas esportivas</strong>
                <small>
                  Uma liga inteira do Bahrein controlada pelo painel.
                </small>
              </div>
            </article>

            <article>
              <span>03</span>
              <div>
                <strong>Comunidade fictícia</strong>
                <small>
                  Ranking, histórico, sessão ao vivo e TaiCoins sem valor.
                </small>
              </div>
            </article>
          </div>
        </div>

        <aside className="general-home-overview">
          <div className="sports-oracle-badge general-oracle-badge">
            <img
              src={entidadeBanca}
              alt="Entidade da banca"
            />

            <span>
              <small>ENTIDADE RESPONSÁVEL</small>
              <strong>Administrando o caos</strong>
            </span>
          </div>

          <div className="general-home-stats">
            <div>
              <strong>4</strong>
              <span>minijogos</span>
            </div>

            <div>
              <strong>8</strong>
              <span>times</span>
            </div>

            <div>
              <strong>0</strong>
              <span>dinheiro real</span>
            </div>
          </div>

          <div className="general-league-preview">
            <div>
              <span>EM DESTAQUE AGORA</span>
              <strong>
                Liga do Bahrein · Rodada {rodada}
              </strong>
              <small>
                Quatro partidas esportivas disponíveis nesta rodada.
              </small>
            </div>

            <div className="general-crest-strip">
              {timesBahrein.map((time) => (
                <div key={time.id} title={time.nome}>
                  <img src={time.logo} alt={time.nome} />
                </div>
              ))}
            </div>

            <a href="#rodada-bahrein">
              Conferir confrontos
            </a>
          </div>
        </aside>
      </div>

      <div className="sports-warning">
        <strong>PARÓDIA ANTIAPOSTAS</strong>
        <span>
          Sem dinheiro real, depósitos, saques ou prêmios.
          TaiCoins são apenas pontos fictícios.
        </span>
      </div>

      <section
        className="home-museum-preview"
        data-neytai-target="home-museum-preview"
      >
        <div className="home-museum-heading">
          <div>
            <span>DO ACERVO DA COMUNIDADE</span>
            <h2>Museu da Taihen</h2>
            <p>
              Memes, clipes, documentos e deformações
              encontradas nas profundezas da internet.
            </p>
          </div>

          <button
            type="button"
            onClick={onIrParaMuseu}
          >
            Visitar o museu completo
          </button>
        </div>

        <div className="home-museum-grid">
          <button
            type="button"
            onClick={onIrParaMuseu}
          >
            <img
              src={museuCusto}
              alt="O custo de estar ali"
            />
            <span>
              <small>MEME DA COMUNIDADE</small>
              <strong>O custo de estar ali</strong>
            </span>
          </button>

          <button
            type="button"
            onClick={onIrParaMuseu}
          >
            <img
              src={museuListening}
              alt="Taihen is listening"
            />
            <span>
              <small>COMUNICADO OFICIAL</small>
              <strong>Taihen is listening</strong>
            </span>
          </button>

          <button
            type="button"
            onClick={onIrParaMuseu}
          >
            <img
              src={museuCalendario}
              alt="Calendário trabalhista da Tai"
            />
            <span>
              <small>DOCUMENTO HISTÓRICO</small>
              <strong>Calendário trabalhista</strong>
            </span>
          </button>
        </div>
      </section>

      <div
        className="sports-main-grid"
        id="rodada-bahrein"
        data-neytai-target="sports-section"
      >
        <div className="sports-round">
          <div className="sports-section-heading">
            <div>
              <span>APOSTAS ESPORTIVAS · LIGA DO BAHREIN</span>
              <h2>Partidas da rodada {rodada}</h2>
              <p>
                Os confrontos alternam pelo calendário de sete
                rodadas controlado no Painel.
              </p>
            </div>

            <div className="sports-round-counter">
              <small>PARTIDAS ABERTAS</small>
              <strong>{partidas.length}/4</strong>
            </div>
          </div>

          {partidas.length === 0 ? (
            <div className="sports-empty">
              <img src={entidadeBanca} alt="" />

              <div>
                <span>A BANCA AINDA NÃO PUBLICOU A RODADA</span>
                <h2>Nenhuma partida disponível</h2>
                <p>
                  Abra o Painel e publique uma rodada da Liga do
                  Bahrein.
                </p>
              </div>
            </div>
          ) : (
            <div className="sports-match-list">
              {partidas.map((partida) => {
                const mandante =
                  timesBahreinPorId[partida.mandanteId]
                const visitante =
                  timesBahreinPorId[partida.visitanteId]
                const encerrada = Boolean(
                  partida.resultadoOpcaoId,
                )
                const suspensa =
                  partida.status === 'suspenso'

                return (
                  <article
                    className={`sports-match-card ${
                      encerrada ? 'closed' : ''
                    } ${suspensa ? 'suspended' : ''}`}
                    key={partida.id}
                  >
                    <div className="sports-match-meta">
                      <span>
                        RODADA {partida.rodada} ·{' '}
                        {partida.horario}
                      </span>

                      <b>
                        {encerrada
                          ? 'ENCERRADO'
                          : suspensa
                            ? 'SUSPENSO'
                            : 'APOSTAS ABERTAS'}
                      </b>
                    </div>

                    <div className="sports-match-teams">
                      <div className="sports-team home">
                        <img
                          src={mandante?.logo}
                          alt={mandante?.nome}
                        />

                        <strong>{mandante?.nome}</strong>
                        <small>MANDANTE</small>
                      </div>

                      <div className="sports-versus">
                        <span>VS</span>
                        <small>Bahrein</small>
                      </div>

                      <div className="sports-team away">
                        <img
                          src={visitante?.logo}
                          alt={visitante?.nome}
                        />

                        <strong>{visitante?.nome}</strong>
                        <small>VISITANTE</small>
                      </div>
                    </div>

                    <div className="sports-odds">
                      {partida.opcoes.map((opcao, indice) => (
                        <button
                          type="button"
                          key={opcao.id}
                          disabled={encerrada || suspensa}
                          className={
                            opcaoSelecionada(
                              partida.id,
                              opcao.id,
                            )
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            onSelecionarOdd(
                              partida,
                              opcao,
                            )
                          }
                        >
                          <span>
                            {indice === 0
                              ? '1'
                              : indice === 1
                                ? 'X'
                                : '2'}
                          </span>

                          <small>{opcao.nome}</small>
                          <strong>
                            {Number(opcao.odd).toFixed(2)}
                          </strong>
                        </button>
                      ))}
                    </div>

                    {encerrada && (
                      <div className="sports-result">
                        Resultado oficial:
                        <strong>{partida.resultadoNome}</strong>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside
          className="sports-betslip"
          data-neytai-target="sports-betslip"
        >
          <div className="sports-betslip-heading">
            <div>
              <span>BILHETE ESPORTIVO</span>
              <h2>Suas seleções</h2>
            </div>

            {selecoes.length > 0 && (
              <button
                type="button"
                onClick={onLimparBilhete}
              >
                Limpar
              </button>
            )}
          </div>

          {selecoes.length === 0 ? (
            <div className="sports-betslip-empty">
              <img
                src={entidadeBanca}
                alt="Entidade da banca"
              />

              <strong>Nenhuma odd selecionada</strong>
              <p>
                Clique em 1, X ou 2 em uma das partidas.
              </p>
            </div>
          ) : (
            <div className="sports-selections">
              {selecoes.map((selecao) => (
                <div
                  className="sports-selection"
                  key={`${selecao.eventoId}-${selecao.opcaoId}`}
                >
                  <div>
                    <span>{selecao.eventoTitulo}</span>
                    <strong>{selecao.opcaoNome}</strong>
                  </div>

                  <b>
                    {Number(selecao.odd).toFixed(2)}
                  </b>

                  <button
                    type="button"
                    onClick={() =>
                      onRemoverSelecao(selecao.opcaoId)
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="sports-stake">
            <span>Valor da aposta</span>

            <input
              type="number"
              min="10"
              max={saldo}
              value={valorAposta}
              placeholder="10"
              onChange={(event) =>
                onValorApostaChange(event.target.value)
              }
            />
          </label>

          <div className="sports-quick-values">
            {[10, 25, 50, 100].map((valor) => (
              <button
                type="button"
                key={valor}
                onClick={() => onAdicionarValor(valor)}
              >
                +{valor}
              </button>
            ))}
          </div>

          <div className="sports-ticket-summary">
            <div>
              <span>Saldo</span>
              <strong>
                {formatarMoedas(saldo)} T
              </strong>
            </div>

            <div>
              <span>Odd total</span>
              <strong>
                {selecoes.length > 0
                  ? Number(oddTotal).toFixed(2)
                  : '0.00'}
              </strong>
            </div>

            <div>
              <span>Retorno possível</span>
              <strong>
                {formatarMoedas(retornoEstimado)} T
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="sports-confirm-button"
            disabled={selecoes.length === 0}
            onClick={onConfirmarAposta}
          >
            Confirmar bilhete
          </button>

          <p className="sports-betslip-disclaimer">
            Apostas exclusivamente fictícias. Nenhum resultado
            gera dinheiro ou prêmio real.
          </p>
        </aside>
      </div>

      <div
        className="sports-clubs"
        data-neytai-target="sports-clubs"
      >
        <div className="sports-section-heading">
          <div>
            <span>OS OITO ESCOLHIDOS</span>
            <h2>Clubes da liga</h2>
          </div>
        </div>

        <div className="sports-club-grid">
          {timesBahrein.map((time) => (
            <article key={time.id}>
              <img src={time.logo} alt={time.nome} />
              <div>
                <strong>{time.nome}</strong>
                <span>{time.abreviacao}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SportsHome
