import { useEffect, useState } from 'react'
import './LiveAdmin.css'
import BahrainAdminPanel from './BahrainAdminPanel'
import AnimationArchivePanel from './AnimationArchivePanel'
import WalletAdminPanel from './WalletAdminPanel'
import ModerationAdminPanel from './ModerationAdminPanel'
import ContentAdminPanel from './ContentAdminPanel'

function gerarId() {
  return crypto.randomUUID()
}

function criarFormularioVazio() {
  return {
    id: null,
    categoria: '',
    titulo: '',
    status: 'aberto',
    opcoes: [
      {
        id: gerarId(),
        nome: '',
        odd: '',
      },
      {
        id: gerarId(),
        nome: '',
        odd: '',
      },
    ],
  }
}

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function AdminPanel({
  historico,
  eventos,
  onResolver,
  onResolverMercado,
  onSalvarMercado,
  onAlternarMercado,
  onExcluirMercado,
  onLimparMercadosEncerrados,
  rodadaBahrein,
  onPublicarRodadaBahrein,
  sessaoAoVivo,
  onIniciarSessaoAoVivo,
  onAtualizarMercadosAoVivo,
  onAdicionarAtualizacaoAoVivo,
  onEncerrarSessaoAoVivo,
}) {
  const [aba, setAba] = useState('bahrein')
  const [formulario, setFormulario] = useState(
    criarFormularioVazio,
  )
  const [erroFormulario, setErroFormulario] = useState('')
  const [tituloSessao, setTituloSessao] = useState(
    sessaoAoVivo?.titulo || 'Live da Taihen',
  )
  const [mercadosSelecionados, setMercadosSelecionados] =
    useState(
      (sessaoAoVivo?.mercadoIds || []).map(String),
    )
  const [novaAtualizacao, setNovaAtualizacao] = useState('')

  useEffect(() => {
    setTituloSessao(
      sessaoAoVivo?.titulo || 'Live da Taihen',
    )
    setMercadosSelecionados(
      (sessaoAoVivo?.mercadoIds || []).map(String),
    )
  }, [sessaoAoVivo])

  const mercadosDisponiveisAoVivo = eventos.filter(
    (evento) =>
      evento.status !== 'suspenso' &&
      !evento.resultadoOpcaoId,
  )

  const mercadosEncerrados = eventos.filter(
    (evento) => Boolean(evento.resultadoOpcaoId),
  )

  const pendentes = historico.filter(
    (aposta) => aposta.status === 'Pendente',
  )

  const ganhas = historico.filter(
    (aposta) => aposta.status === 'Ganhou',
  ).length

  const perdidas = historico.filter(
    (aposta) => aposta.status === 'Perdeu',
  ).length

  function alternarMercadoDaSessao(mercadoId) {
    const id = String(mercadoId)

    setMercadosSelecionados((selecionadosAtuais) =>
      selecionadosAtuais.includes(id)
        ? selecionadosAtuais.filter(
            (selecionado) => selecionado !== id,
          )
        : [...selecionadosAtuais, id],
    )
  }

  function iniciarSessao(event) {
    event.preventDefault()

    onIniciarSessaoAoVivo({
      titulo: tituloSessao,
      mercadoIds: mercadosSelecionados,
    })
  }

  function salvarMercadosDaSessao() {
    onAtualizarMercadosAoVivo(mercadosSelecionados)
  }

  function publicarAtualizacao(event) {
    event.preventDefault()

    if (!novaAtualizacao.trim()) {
      return
    }

    onAdicionarAtualizacaoAoVivo(novaAtualizacao)
    setNovaAtualizacao('')
  }

  function encerrarSessao() {
    const confirmou = window.confirm(
      'Encerrar a sessão ao vivo agora?',
    )

    if (confirmou) {
      onEncerrarSessaoAoVivo()
    }
  }

  function alterarCampo(campo, valor) {
    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      [campo]: valor,
    }))
  }

  function alterarOpcao(opcaoId, campo, valor) {
    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      opcoes: formularioAtual.opcoes.map((opcao) =>
        opcao.id === opcaoId
          ? {
              ...opcao,
              [campo]: valor,
            }
          : opcao,
      ),
    }))
  }

  function adicionarOpcao() {
    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      opcoes: [
        ...formularioAtual.opcoes,
        {
          id: gerarId(),
          nome: '',
          odd: '',
        },
      ],
    }))

    setErroFormulario('')
  }

  function removerOpcao(opcaoId) {
    if (formulario.opcoes.length <= 2) {
      setErroFormulario(
        'Um mercado precisa ter pelo menos duas opções.',
      )

      return
    }

    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      opcoes: formularioAtual.opcoes.filter(
        (opcao) => opcao.id !== opcaoId,
      ),
    }))

    setErroFormulario('')
  }

  function confirmarResultadoMercado(mercado, opcao) {
    const confirmou = window.confirm(
      `Definir "${opcao.nome}" como vencedora de "${mercado.titulo}"?\n\nIsso resolverá automaticamente os bilhetes relacionados e não poderá ser desfeito nesta versão.`,
    )

    if (!confirmou) {
      return
    }

    if (typeof onResolverMercado !== 'function') {
      window.alert(
        'Não foi possível resolver o mercado: a função de resolução não foi recebida pelo painel.',
      )
      return
    }

    onResolverMercado(mercado.id, opcao.id)
  }

  function editarMercado(mercado) {
    setFormulario({
      id: mercado.id,
      categoria: mercado.categoria,
      titulo: mercado.titulo,
      status: mercado.status || 'aberto',
      opcoes: mercado.opcoes.map((opcao) => ({
        ...opcao,
        odd: String(opcao.odd),
      })),
    })

    setErroFormulario('')
    setAba('mercados')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function cancelarEdicao() {
    setFormulario(criarFormularioVazio())
    setErroFormulario('')
  }

  function enviarFormulario(event) {
    event.preventDefault()

    const categoria = formulario.categoria.trim()
    const titulo = formulario.titulo.trim()

    if (!categoria || !titulo) {
      setErroFormulario(
        'Preencha a categoria e a pergunta do mercado.',
      )

      return
    }

    const possuiOpcaoInvalida = formulario.opcoes.some(
      (opcao) =>
        !opcao.nome.trim() ||
        !Number.isFinite(Number(opcao.odd)) ||
        Number(opcao.odd) <= 1,
    )

    if (possuiOpcaoInvalida) {
      setErroFormulario(
        'Preencha todas as opções e use odds maiores que 1.',
      )

      return
    }

    const mercado = {
      id: formulario.id || gerarId(),
      categoria: categoria.toUpperCase(),
      titulo,
      status: formulario.status || 'aberto',
      opcoes: formulario.opcoes.map((opcao) => ({
        id: opcao.id || gerarId(),
        nome: opcao.nome.trim(),
        odd: Number(opcao.odd),
      })),
    }

    onSalvarMercado(mercado)
    setFormulario(criarFormularioVazio())
    setErroFormulario('')
  }

  return (
    <section className="admin-page" data-neytai-target="admin-page">
      <div className="admin-header">
        <div>
          <span className="admin-eyebrow">
            ACESSO ALTAMENTE QUESTIONÁVEL
          </span>

          <h1>Painel da banca</h1>

          <p>
            Publique rodadas da Liga do Bahrein, controle as odds
            e resolva os bilhetes esportivos fictícios.
          </p>
        </div>

        <div className="admin-badge">
          <span>●</span>
          MODO ADMINISTRADOR
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={aba === 'bahrein' ? 'active' : ''}
          onClick={() => setAba('bahrein')}
        >
          Liga do Bahrein
          <span>R{rodadaBahrein}</span>
        </button>

        <button
          type="button"
          className={aba === 'mercados' ? 'active' : ''}
          onClick={() => setAba('mercados')}
        >
          Editar odds
          <span>{eventos.length}</span>
        </button>

        <button
          type="button"
          className={aba === 'resultados' ? 'active' : ''}
          onClick={() => setAba('resultados')}
        >
          Resolver apostas
          <span>{pendentes.length}</span>
        </button>

        <button
          type="button"
          className={aba === 'sessao' ? 'active' : ''}
          onClick={() => setAba('sessao')}
        >
          Sessão ao vivo
          <span>{sessaoAoVivo?.ativa ? '●' : '0'}</span>
        </button>

        <button
          type="button"
          className={aba === 'carteiras' ? 'active' : ''}
          onClick={() => setAba('carteiras')}
        >
          Carteiras
          <span>T</span>
        </button>

        <button
          type="button"
          data-neytai-target="admin-moderation-tab"
          className={aba === 'moderacao' ? 'active' : ''}
          onClick={() => setAba('moderacao')}
        >
          Moderação
          <span>!</span>
        </button>

        <button
          type="button"
          className={aba === 'conteudo' ? 'active' : ''}
          onClick={() => setAba('conteudo')}
        >
          Conteúdo do site
          <span>✎</span>
        </button>

        <button
          type="button"
          data-neytai-target="admin-animation-tab"
          className={aba === 'animacoes' ? 'active' : ''}
          onClick={() => setAba('animacoes')}
        >
          Central de animações
          <span>27</span>
        </button>
      </div>

      {aba === 'bahrein' ? (
        <BahrainAdminPanel
          eventos={eventos}
          rodadaAtual={rodadaBahrein}
          onPublicarRodada={onPublicarRodadaBahrein}
          onResolverMercado={onResolverMercado}
          onAlternarMercado={onAlternarMercado}
          onExcluirMercado={onExcluirMercado}
        />
      ) : aba === 'mercados' ? (
        <div className="market-manager">
          <form
            className="market-form"
            onSubmit={enviarFormulario}
          >
            <div className="market-form-header">
              <div>
                <span>
                  {formulario.id
                    ? 'EDITANDO MERCADO'
                    : 'NOVO MERCADO'}
                </span>

                <h2>
                  {formulario.id
                    ? 'Atualizar aposta'
                    : 'Abrir nova aposta'}
                </h2>
              </div>

              {formulario.id && (
                <button
                  type="button"
                  className="cancel-edit-button"
                  onClick={cancelarEdicao}
                >
                  Cancelar
                </button>
              )}
            </div>

            <label className="admin-field">
              <span>Categoria</span>

              <input
                type="text"
                placeholder="Ex.: PIETRO SPECIAL"
                value={formulario.categoria}
                onChange={(event) =>
                  alterarCampo(
                    'categoria',
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="admin-field">
              <span>Pergunta do mercado</span>

              <textarea
                rows="3"
                placeholder="Ex.: Pietro será banido da própria comunidade hoje?"
                value={formulario.titulo}
                onChange={(event) =>
                  alterarCampo(
                    'titulo',
                    event.target.value,
                  )
                }
              />
            </label>

            <div className="options-editor">
              <div className="options-editor-title">
                <span>Opções e odds</span>

                <button
                  type="button"
                  onClick={adicionarOpcao}
                >
                  + Adicionar opção
                </button>
              </div>

              {formulario.opcoes.map(
                (opcao, indice) => (
                  <div
                    className="option-editor-row"
                    key={opcao.id}
                  >
                    <span className="option-number">
                      {indice + 1}
                    </span>

                    <input
                      type="text"
                      placeholder="Nome da opção"
                      value={opcao.nome}
                      onChange={(event) =>
                        alterarOpcao(
                          opcao.id,
                          'nome',
                          event.target.value,
                        )
                      }
                    />

                    <input
                      className="odd-editor-input"
                      type="number"
                      min="1.01"
                      step="0.01"
                      placeholder="Odd"
                      value={opcao.odd}
                      onChange={(event) =>
                        alterarOpcao(
                          opcao.id,
                          'odd',
                          event.target.value,
                        )
                      }
                    />

                    <button
                      type="button"
                      className="remove-option-button"
                      onClick={() =>
                        removerOpcao(opcao.id)
                      }
                      title="Remover opção"
                    >
                      ×
                    </button>
                  </div>
                ),
              )}
            </div>

            {erroFormulario && (
              <div className="market-form-error">
                {erroFormulario}
              </div>
            )}

            <button
              type="submit"
              className="save-market-button"
            >
              {formulario.id
                ? 'Salvar alterações'
                : 'Criar mercado'}
            </button>
          </form>

          <div className="market-list-panel">
            <div className="market-list-header">
              <div>
                <span>MERCADOS REGISTRADOS</span>
                <h2>Controle da banca</h2>
              </div>

              <div className="market-list-header-actions">
                {mercadosEncerrados.length > 0 && (
                  <button
                    type="button"
                    className="clear-closed-markets-button"
                    onClick={onLimparMercadosEncerrados}
                  >
                    Limpar encerrados
                  </button>
                )}

                <strong>{eventos.length}</strong>
              </div>
            </div>

            {eventos.length === 0 ? (
              <div className="market-list-empty">
                <div>T</div>
                <h3>Nenhum mercado aberto</h3>
                <p>Crie uma pergunta para iniciar o caos.</p>
              </div>
            ) : (
              <div className="admin-markets-list">
                {eventos.map((mercado) => {
                  const suspenso =
                    mercado.status === 'suspenso'

                  const encerrado = Boolean(
                    mercado.resultadoOpcaoId,
                  )

                  return (
                    <article
                      className={`admin-market-card ${
                        suspenso
                          ? 'admin-market-suspended'
                          : ''
                      }`}
                      key={mercado.id}
                    >
                      <div className="admin-market-top">
                        <div>
                          <span>{mercado.categoria}</span>
                          <h3>{mercado.titulo}</h3>
                        </div>

                        <span
                          className={`market-status ${
                            encerrado
                              ? 'closed'
                              : suspenso
                                ? 'suspended'
                                : 'open'
                          }`}
                        >
                          {encerrado
                            ? 'Encerrado'
                            : suspenso
                              ? 'Suspenso'
                              : 'Aberto'}
                        </span>
                      </div>

                      <div className="admin-market-options">
                        {mercado.opcoes.map((opcao) => {
                          const opcaoVencedora =
                            String(
                              mercado.resultadoOpcaoId,
                            ) === String(opcao.id)

                          return (
                            <div
                              className={`admin-market-option-row ${
                                opcaoVencedora
                                  ? 'admin-market-option-winner'
                                  : ''
                              }`}
                              key={opcao.id}
                            >
                              <span>{opcao.nome}</span>

                              <div className="admin-market-option-actions">
                                <strong>
                                  {Number(
                                    opcao.odd,
                                  ).toFixed(2)}
                                </strong>

                                {!encerrado && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      confirmarResultadoMercado(
                                        mercado,
                                        opcao,
                                      )
                                    }
                                  >
                                    Definir vencedora
                                  </button>
                                )}

                                {opcaoVencedora && (
                                  <em>Vencedora</em>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {encerrado ? (
                        <>
                          <div className="admin-market-result">
                            Resultado definido como
                            <strong>
                              {mercado.resultadoNome}
                            </strong>

                            {mercado.resultadoResolvidoEm && (
                              <span>
                                em{' '}
                                {
                                  mercado.resultadoResolvidoEm
                                }
                              </span>
                            )}
                          </div>

                          <div className="admin-market-actions admin-market-closed-actions">
                            <button
                              type="button"
                              className="delete-market-button"
                              onClick={() =>
                                onExcluirMercado(
                                  mercado.id,
                                )
                              }
                            >
                              Excluir mercado encerrado
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="admin-market-actions">
                          <button
                            type="button"
                            className="edit-market-button"
                            onClick={() =>
                              editarMercado(mercado)
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="toggle-market-button"
                            onClick={() =>
                              onAlternarMercado(
                                mercado.id,
                              )
                            }
                          >
                            {suspenso
                              ? 'Reabrir'
                              : 'Suspender'}
                          </button>

                          <button
                            type="button"
                            className="delete-market-button"
                            onClick={() =>
                              onExcluirMercado(
                                mercado.id,
                              )
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : aba === 'resultados' ? (
        <>
          <div className="admin-summary">
            <article>
              <span>Aguardando resultado</span>
              <strong>{pendentes.length}</strong>
            </article>

            <article>
              <span>Apostas ganhas</span>
              <strong>{ganhas}</strong>
            </article>

            <article>
              <span>Apostas perdidas</span>
              <strong>{perdidas}</strong>
            </article>

            <article>
              <span>Total registrado</span>
              <strong>{historico.length}</strong>
            </article>
          </div>

          {historico.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">T</div>

              <h2>Nenhuma aposta encontrada</h2>

              <p>Ninguém tomou decisões ruins ainda.</p>
            </div>
          ) : (
            <div className="admin-list">
              {historico.map((aposta, indice) => (
                <article
                  className="admin-card"
                  key={aposta.id}
                >
                  <div className="admin-card-header">
                    <div>
                      <span>
                        APOSTA #
                        {historico.length - indice}
                      </span>

                      <h2>{aposta.data}</h2>
                      {aposta.clienteNome && (
                        <small>Cliente: {aposta.clienteNome}</small>
                      )}
                    </div>

                    <span
                      className={`history-status status-${aposta.status.toLowerCase()}`}
                    >
                      {aposta.status}
                    </span>
                  </div>

                  <div className="admin-selections">
                    {aposta.selecoes.map((selecao) => (
                      <div
                        className="admin-selection"
                        key={selecao.opcaoId}
                      >
                        <div>
                          <span>
                            {selecao.eventoTitulo}
                          </span>

                          <strong>
                            {selecao.opcaoNome}
                          </strong>
                        </div>

                        <b>
                          {Number(
                            selecao.odd,
                          ).toFixed(2)}
                        </b>
                      </div>
                    ))}
                  </div>

                  <div className="admin-card-bottom">
                    <div className="admin-values">
                      <div>
                        <span>Valor apostado</span>

                        <strong>
                          {formatarMoedas(
                            aposta.valor,
                          )}{' '}
                          TaiCoins
                        </strong>
                      </div>

                      <div>
                        <span>Odd total</span>

                        <strong>
                          {Number(
                            aposta.oddTotal,
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Prêmio em caso de vitória
                        </span>

                        <strong className="admin-prize">
                          {formatarMoedas(
                            aposta.retornoEstimado,
                          )}{' '}
                          TaiCoins
                        </strong>
                      </div>
                    </div>

                    {aposta.status === 'Pendente' ? (
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-lose-button"
                          onClick={() =>
                            onResolver(
                              aposta.id,
                              'perdeu',
                            )
                          }
                        >
                          Marcar como perdeu
                        </button>

                        <button
                          type="button"
                          className="admin-win-button"
                          onClick={() =>
                            onResolver(
                              aposta.id,
                              'ganhou',
                            )
                          }
                        >
                          Marcar como ganhou
                        </button>
                      </div>
                    ) : (
                      <div className="admin-resolved">
                        Resultado já definido
                        {aposta.resolvidaEm &&
                          ` em ${aposta.resolvidaEm}`}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : aba === 'carteiras' ? (
        <WalletAdminPanel />
      ) : aba === 'moderacao' ? (
        <ModerationAdminPanel />
      ) : aba === 'conteudo' ? (
        <ContentAdminPanel />
      ) : aba === 'animacoes' ? (
        <AnimationArchivePanel />
      ) : (
        <section className="live-admin-page">
          <div className="live-admin-status-card">
            <div>
              <span className="live-admin-eyebrow">
                CONTROLE HONESTO DA TRANSMISSÃO
              </span>

              <h2>
                {sessaoAoVivo?.ativa
                  ? sessaoAoVivo.titulo
                  : 'Nenhuma sessão ativa'}
              </h2>

              <p>
                Nada de espectadores inventados ou acontecimentos
                automáticos. Tudo que aparece aqui é iniciado e
                publicado por você.
              </p>
            </div>

            <span
              className={`live-admin-status ${
                sessaoAoVivo?.ativa ? 'active' : 'inactive'
              }`}
            >
              {sessaoAoVivo?.ativa ? 'AO VIVO' : 'OFFLINE'}
            </span>
          </div>

          <div className="live-admin-grid">
            <div className="live-admin-controls">
              {!sessaoAoVivo?.ativa ? (
                <form onSubmit={iniciarSessao}>
                  <div className="live-admin-section-heading">
                    <span>NOVA SESSÃO</span>
                    <h3>Iniciar transmissão</h3>
                  </div>

                  <label className="admin-field">
                    <span>Título da sessão</span>
                    <input
                      type="text"
                      value={tituloSessao}
                      placeholder="Ex.: Live de domingo da Taihen"
                      onChange={(event) =>
                        setTituloSessao(event.target.value)
                      }
                    />
                  </label>

                  <div className="live-admin-market-picker">
                    <div className="live-admin-picker-heading">
                      <span>Mercados que aparecerão ao vivo</span>
                      <strong>
                        {mercadosSelecionados.length} selecionado(s)
                      </strong>
                    </div>

                    {mercadosDisponiveisAoVivo.length === 0 ? (
                      <p className="live-admin-no-markets">
                        Não existem mercados abertos disponíveis.
                      </p>
                    ) : (
                      mercadosDisponiveisAoVivo.map((mercado) => {
                        const selecionado =
                          mercadosSelecionados.includes(
                            String(mercado.id),
                          )

                        return (
                          <label
                            className={`live-admin-market-option ${
                              selecionado ? 'selected' : ''
                            }`}
                            key={mercado.id}
                          >
                            <input
                              type="checkbox"
                              checked={selecionado}
                              onChange={() =>
                                alternarMercadoDaSessao(
                                  mercado.id,
                                )
                              }
                            />

                            <span>
                              <strong>{mercado.titulo}</strong>
                              <small>{mercado.categoria}</small>
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>

                  <button
                    type="submit"
                    className="live-admin-start-button"
                  >
                    Iniciar sessão ao vivo
                  </button>
                </form>
              ) : (
                <>
                  <div className="live-admin-section-heading">
                    <span>SESSÃO ATIVA</span>
                    <h3>Mercados transmitidos</h3>
                  </div>

                  <div className="live-admin-market-picker">
                    <div className="live-admin-picker-heading">
                      <span>Marque o que deve aparecer</span>
                      <strong>
                        {mercadosSelecionados.length} selecionado(s)
                      </strong>
                    </div>

                    {mercadosDisponiveisAoVivo.map((mercado) => {
                      const selecionado =
                        mercadosSelecionados.includes(
                          String(mercado.id),
                        )

                      return (
                        <label
                          className={`live-admin-market-option ${
                            selecionado ? 'selected' : ''
                          }`}
                          key={mercado.id}
                        >
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() =>
                              alternarMercadoDaSessao(
                                mercado.id,
                              )
                            }
                          />

                          <span>
                            <strong>{mercado.titulo}</strong>
                            <small>{mercado.categoria}</small>
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    className="live-admin-save-button"
                    onClick={salvarMercadosDaSessao}
                  >
                    Atualizar mercados da sessão
                  </button>

                  <button
                    type="button"
                    className="live-admin-stop-button"
                    onClick={encerrarSessao}
                  >
                    Encerrar sessão ao vivo
                  </button>
                </>
              )}
            </div>

            <div className="live-admin-updates-panel">
              <div className="live-admin-section-heading">
                <span>ATUALIZAÇÕES MANUAIS</span>
                <h3>Linha do tempo da live</h3>
              </div>

              {sessaoAoVivo?.ativa ? (
                <form
                  className="live-admin-update-form"
                  onSubmit={publicarAtualizacao}
                >
                  <textarea
                    rows="4"
                    placeholder="Ex.: Pietro acabou de tomar um mute de 10 minutos."
                    value={novaAtualizacao}
                    onChange={(event) =>
                      setNovaAtualizacao(event.target.value)
                    }
                  />

                  <button type="submit">
                    Publicar atualização
                  </button>
                </form>
              ) : (
                <div className="live-admin-offline-note">
                  Inicie uma sessão para publicar acontecimentos.
                </div>
              )}

              <div className="live-admin-updates-list">
                {(sessaoAoVivo?.atualizacoes || []).length === 0 ? (
                  <p>Nenhuma atualização registrada.</p>
                ) : (
                  sessaoAoVivo.atualizacoes.map((atualizacao) => (
                    <article key={atualizacao.id}>
                      <time>
                        {new Date(
                          atualizacao.criadaEm,
                        ).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </time>

                      <span>{atualizacao.texto}</span>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  )
}

export default AdminPanel
