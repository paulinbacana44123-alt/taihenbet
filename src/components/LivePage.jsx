import { useEffect, useMemo, useState } from 'react'
import './LivePage.css'
import entidadeBanca from '../assets/entidade-banca.png'

function formatarTempo(segundos) {
  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  const segundosRestantes = segundos % 60

  return [horas, minutos, segundosRestantes]
    .map((valor) => String(valor).padStart(2, '0'))
    .join(':')
}

function formatarHorario(timestamp) {
  if (!timestamp) {
    return '--:--'
  }

  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function LivePage({
  eventos = [],
  historico = [],
  sessaoAoVivo,
  selecoes = [],
  onSelecionarOdd,
  onAbrirBilhete,
}) {
  const [agora, setAgora] = useState(Date.now())

  useEffect(() => {
    const cronometro = window.setInterval(() => {
      setAgora(Date.now())
    }, 1000)

    return () => window.clearInterval(cronometro)
  }, [])

  const sessaoAtiva = Boolean(sessaoAoVivo?.ativa)
  const mercadoIds = useMemo(
    () => new Set((sessaoAoVivo?.mercadoIds || []).map(String)),
    [sessaoAoVivo?.mercadoIds],
  )

  const mercadosAoVivo = useMemo(
    () =>
      eventos.filter(
        (evento) =>
          mercadoIds.has(String(evento.id)) &&
          evento.status !== 'suspenso' &&
          !evento.resultadoOpcaoId,
      ),
    [eventos, mercadoIds],
  )

  const apostasDaSessao = useMemo(() => {
    if (!sessaoAoVivo?.iniciadaEm) {
      return []
    }

    return historico.filter((aposta) => {
      if (Number(aposta.criadaEm || 0) < sessaoAoVivo.iniciadaEm) {
        return false
      }

      return aposta.selecoes.some((selecao) =>
        mercadoIds.has(String(selecao.eventoId)),
      )
    })
  }, [historico, mercadoIds, sessaoAoVivo?.iniciadaEm])

  const segundosNoAr = sessaoAtiva
    ? Math.max(
        0,
        Math.floor(
          (agora - Number(sessaoAoVivo.iniciadaEm || agora)) /
            1000,
        ),
      )
    : 0

  const oddCombinada = selecoes.reduce(
    (total, selecao) => total * Number(selecao.odd || 1),
    1,
  )

  const atualizacoes = sessaoAoVivo?.atualizacoes || []
  const ultimaAtualizacao = atualizacoes[0]

  function contarApostasDoMercado(mercadoId) {
    return apostasDaSessao.filter((aposta) =>
      aposta.selecoes.some(
        (selecao) =>
          String(selecao.eventoId) === String(mercadoId),
      ),
    ).length
  }

  if (!sessaoAtiva) {
    return (
      <section className="live-page live-offline-page">
        <div className="live-offline-card">
          <div className="live-offline-icon">OFF</div>

          <span className="live-offline-eyebrow">
            NENHUMA SESSÃO ATIVA
          </span>

          <h1>O “Ao vivo” agora só existe quando for real.</h1>

          <p>
            A banca ainda não iniciou uma sessão. Sem número de
            espectadores inventado, sem cronômetro falso e sem
            acontecimentos automáticos.
          </p>

          {sessaoAoVivo?.encerradaEm && (
            <div className="live-last-session">
              <span>Última sessão encerrada</span>
              <strong>
                {formatarHorario(sessaoAoVivo.encerradaEm)}
              </strong>
            </div>
          )}

          <div className="live-offline-instruction">
            Para começar, entre em <strong>Painel</strong>, abra a
            aba <strong>Sessão ao vivo</strong>, selecione os
            mercados e clique em iniciar.
          </div>

          <div className="live-offline-entity">
            <img
              src={entidadeBanca}
              alt="Entidade da banca"
            />

            <div>
              <span>ENTIDADE DA BANCA</span>
              <strong>
                Mesmo offline, ela continua observando.
              </strong>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="live-page">
      <div className="live-hero real-live-hero">
        <div className="live-hero-content">
          <div className="live-status-line">
            <span className="live-status-pill">
              <i />
              SESSÃO AO VIVO
            </span>

            <span>Modo local administrado pela banca</span>
          </div>

          <h1>
            {sessaoAoVivo.titulo || 'Sessão ao vivo'}
          </h1>

          <p>
            Os mercados, o cronômetro, as apostas e a linha do
            tempo abaixo usam somente informações registradas de
            verdade neste navegador.
          </p>

          <div className="live-clock-row">
            <div>
              <span>Tempo de transmissão</span>
              <strong>{formatarTempo(segundosNoAr)}</strong>
            </div>

            <div>
              <span>Mercados ao vivo</span>
              <strong>{mercadosAoVivo.length}</strong>
            </div>

            <div>
              <span>Bilhetes nesta sessão</span>
              <strong>{apostasDaSessao.length}</strong>
            </div>
          </div>
        </div>

        <div className="live-orbit">
          <div className="live-orbit-ring" />
          <div className="live-orbit-ring second" />
          <div className="live-core">LIVE</div>
        </div>
      </div>

      <div className="live-ticker">
        <span className="live-ticker-label">
          ÚLTIMA ATUALIZAÇÃO
        </span>

        <strong>
          {ultimaAtualizacao
            ? ultimaAtualizacao.texto
            : 'A banca ainda não publicou nenhum acontecimento.'}
        </strong>

        <i>
          {ultimaAtualizacao
            ? formatarHorario(ultimaAtualizacao.criadaEm)
            : '--:--'}
        </i>
      </div>

      <div className="live-layout">
        <div className="live-main-column">
          <div className="live-section-title">
            <div>
              <span className="live-pulse-dot" />
              MERCADOS SELECIONADOS PELA BANCA
            </div>

            <small>
              {apostasDaSessao.length} bilhete(s) registrado(s)
              desde o início
            </small>
          </div>

          {mercadosAoVivo.length === 0 ? (
            <div className="live-empty">
              <div>0</div>
              <h2>Nenhum mercado disponível</h2>
              <p>
                Os mercados selecionados podem ter sido suspensos
                ou encerrados. Atualize a sessão pelo painel.
              </p>
            </div>
          ) : (
            <div className="live-markets">
              {mercadosAoVivo.map((evento) => {
                const apostasNoMercado =
                  contarApostasDoMercado(evento.id)

                return (
                  <article
                    className="live-market-card"
                    key={evento.id}
                  >
                    <div className="live-market-head">
                      <div>
                        <span className="live-market-category">
                          {evento.categoria}
                        </span>

                        <h2>{evento.titulo}</h2>
                      </div>

                      <div className="live-market-open-badge">
                        ABERTO
                      </div>
                    </div>

                    <div className="live-odds">
                      {evento.opcoes.map((opcao) => {
                        const selecionada = selecoes.some(
                          (selecao) =>
                            String(selecao.opcaoId) ===
                            String(opcao.id),
                        )

                        return (
                          <button
                            type="button"
                            className={
                              selecionada
                                ? 'live-odd selected'
                                : 'live-odd'
                            }
                            key={opcao.id}
                            onClick={() =>
                              onSelecionarOdd?.(evento, opcao)
                            }
                          >
                            <span>{opcao.nome}</span>
                            <strong>
                              {Number(opcao.odd).toFixed(2)}
                            </strong>
                          </button>
                        )
                      })}
                    </div>

                    <div className="live-market-footer">
                      <span>
                        <i />
                        Mercado incluído manualmente na sessão
                      </span>

                      <strong>
                        {apostasNoMercado} bilhete(s) neste mercado
                      </strong>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside className="live-sidebar">
          <article className="live-slip-preview">
            <div className="live-sidebar-heading">
              <div>
                <span>SEU BILHETE</span>
                <h2>Resumo ao vivo</h2>
              </div>

              <strong>{selecoes.length}</strong>
            </div>

            {selecoes.length === 0 ? (
              <div className="live-slip-empty">
                <div>T</div>
                <p>
                  Escolha uma odd ao vivo para adicioná-la ao
                  bilhete real da página inicial.
                </p>
              </div>
            ) : (
              <>
                <div className="live-selected-list">
                  {selecoes.slice(0, 3).map((selecao) => (
                    <div key={selecao.opcaoId}>
                      <span>{selecao.opcaoNome}</span>
                      <strong>
                        {Number(selecao.odd).toFixed(2)}
                      </strong>
                    </div>
                  ))}

                  {selecoes.length > 3 && (
                    <small>
                      +{selecoes.length - 3} outra(s) seleção(ões)
                    </small>
                  )}
                </div>

                <div className="live-combined-odd">
                  <span>Odd combinada</span>
                  <strong>{oddCombinada.toFixed(2)}</strong>
                </div>
              </>
            )}

            <button
              type="button"
              className="live-open-slip"
              onClick={onAbrirBilhete}
            >
              Abrir bilhete completo
            </button>
          </article>

          <article className="live-timeline">
            <div className="live-sidebar-heading">
              <div>
                <span>LINHA DO TEMPO REAL</span>
                <h2>Atualizações da banca</h2>
              </div>
            </div>

            <div className="live-timeline-list">
              {atualizacoes.length === 0 ? (
                <p className="live-timeline-empty">
                  Nenhuma atualização publicada.
                </p>
              ) : (
                atualizacoes.map((atualizacao, indice) => (
                  <div
                    className={indice === 0 ? 'current' : ''}
                    key={atualizacao.id}
                  >
                    <i />
                    <span>
                      <strong>
                        {formatarHorario(atualizacao.criadaEm)}
                      </strong>
                      {atualizacao.texto}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="live-warning honest-live-warning">
            <strong>Transparência:</strong> esta versão é local.
            Não existe contador de pessoas online porque ainda não
            há servidor, login ou conexão em tempo real entre
            usuários.
          </article>

          <article className="live-entity-card">
            <div className="live-entity-thumb">
              <img
                src={entidadeBanca}
                alt="Mascote oficial da TaihenBet"
              />

              <span>ENTIDADE DA BANCA</span>
            </div>

            <div className="live-entity-body">
              <span className="live-entity-eyebrow">
                SUPERVISÃO OFICIAL
              </span>

              <h3>O Oráculo das Odds acompanha a sessão.</h3>

              <p>
                Cada clique em uma odd é, tecnicamente, uma
                oferenda para a entidade responsável por manter a
                banca viva.
              </p>
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}

export default LivePage
