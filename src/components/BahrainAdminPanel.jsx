import { useMemo, useState } from 'react'
import './BahrainAdminPanel.css'
import {
  gerarRodadaBahrein,
  timesBahreinPorId,
} from '../data/bahrainLeague'

function BahrainAdminPanel({
  eventos,
  rodadaAtual,
  onPublicarRodada,
  onResolverMercado,
  onAlternarMercado,
  onExcluirMercado,
}) {
  const [rodadaSelecionada, setRodadaSelecionada] =
    useState(rodadaAtual || 1)

  const previa = useMemo(
    () => gerarRodadaBahrein(rodadaSelecionada),
    [rodadaSelecionada],
  )

  const partidasAtivas = eventos.filter(
    (evento) => evento.tipo === 'futebol-bahrein',
  )

  return (
    <div className="bahrain-admin">
      <section className="bahrain-admin-control">
        <div className="bahrain-admin-heading">
          <div>
            <span>CONTROLE DO CALENDÁRIO</span>
            <h2>Liga do Bahrein</h2>
            <p>
              São sete rodadas. Cada clube enfrenta todos os
              outros exatamente uma vez.
            </p>
          </div>

          <div>
            <small>RODADA PUBLICADA</small>
            <strong>{rodadaAtual}</strong>
          </div>
        </div>

        <div className="bahrain-round-buttons">
          {Array.from({ length: 7 }, (_, indice) => indice + 1).map(
            (rodada) => (
              <button
                type="button"
                key={rodada}
                className={
                  rodadaSelecionada === rodada
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setRodadaSelecionada(rodada)
                }
              >
                R{rodada}
              </button>
            ),
          )}
        </div>

        <div className="bahrain-preview">
          {previa.map((partida) => {
            const mandante =
              timesBahreinPorId[partida.mandanteId]
            const visitante =
              timesBahreinPorId[partida.visitanteId]

            return (
              <article key={partida.id}>
                <div>
                  <img
                    src={mandante.logo}
                    alt={mandante.nome}
                  />
                  <strong>{mandante.nome}</strong>
                </div>

                <span>{partida.horario}</span>

                <div>
                  <img
                    src={visitante.logo}
                    alt={visitante.nome}
                  />
                  <strong>{visitante.nome}</strong>
                </div>
              </article>
            )
          })}
        </div>

        <button
          type="button"
          className="bahrain-publish-button"
          onClick={() =>
            onPublicarRodada(rodadaSelecionada)
          }
        >
          Publicar rodada {rodadaSelecionada} na página inicial
        </button>
      </section>

      <section className="bahrain-active-matches">
        <div className="bahrain-admin-heading">
          <div>
            <span>PARTIDAS ATUAIS</span>
            <h2>Controle de resultados</h2>
          </div>

          <div>
            <small>JOGOS</small>
            <strong>{partidasAtivas.length}</strong>
          </div>
        </div>

        <div className="bahrain-admin-match-list">
          {partidasAtivas.map((partida) => {
            const mandante =
              timesBahreinPorId[partida.mandanteId]
            const visitante =
              timesBahreinPorId[partida.visitanteId]
            const encerrada = Boolean(
              partida.resultadoOpcaoId,
            )

            return (
              <article key={partida.id}>
                <div className="bahrain-admin-match-top">
                  <span>
                    RODADA {partida.rodada} · {partida.horario}
                  </span>

                  <b>
                    {encerrada
                      ? 'ENCERRADO'
                      : partida.status === 'suspenso'
                        ? 'SUSPENSO'
                        : 'ABERTO'}
                  </b>
                </div>

                <div className="bahrain-admin-versus">
                  <div>
                    <img
                      src={mandante.logo}
                      alt={mandante.nome}
                    />
                    <strong>{mandante.nome}</strong>
                  </div>

                  <span>×</span>

                  <div>
                    <img
                      src={visitante.logo}
                      alt={visitante.nome}
                    />
                    <strong>{visitante.nome}</strong>
                  </div>
                </div>

                {encerrada ? (
                  <div className="bahrain-admin-result">
                    Resultado:
                    <strong>{partida.resultadoNome}</strong>

                    <button
                      type="button"
                      onClick={() =>
                        onExcluirMercado(partida.id)
                      }
                    >
                      Excluir
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bahrain-result-buttons">
                      {partida.opcoes.map((opcao, indice) => (
                        <button
                          type="button"
                          key={opcao.id}
                          onClick={() => {
                            const confirmou = window.confirm(
                              `Definir "${opcao.nome}" como resultado de "${partida.titulo}"?`,
                            )

                            if (confirmou) {
                              onResolverMercado(
                                partida.id,
                                opcao.id,
                              )
                            }
                          }}
                        >
                          <span>
                            {indice === 0
                              ? '1'
                              : indice === 1
                                ? 'X'
                                : '2'}
                          </span>
                          {opcao.nome}
                          <strong>
                            {Number(opcao.odd).toFixed(2)}
                          </strong>
                        </button>
                      ))}
                    </div>

                    <div className="bahrain-admin-actions">
                      <button
                        type="button"
                        onClick={() =>
                          onAlternarMercado(partida.id)
                        }
                      >
                        {partida.status === 'suspenso'
                          ? 'Reabrir'
                          : 'Suspender'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onExcluirMercado(partida.id)
                        }
                      >
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default BahrainAdminPanel
