import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import './ProgressionPage.css'
import { useAchievementCatalog, useSiteTexts } from '../hooks/useEditableContent'

const CONQUISTAS_BASE = [
  {
    key: 'primeiro_bilhete',
    nome: 'Primeiro sacrifício',
    descricao: 'Registre seu primeiro bilhete esportivo.',
    titulo: 'Apostador de Schrödinger',
    categoria: 'Bahrein',
    alvo: 1,
    valor: (m) => m.bilhetesEsportivos,
    icone: '1X2',
  },
  {
    key: 'analista_bahrein',
    nome: 'Analista do Bahrein',
    descricao: 'Registre 10 bilhetes esportivos.',
    titulo: 'Especialista em Futebol Bareinita',
    categoria: 'Bahrein',
    alvo: 10,
    valor: (m) => m.bilhetesEsportivos,
    icone: 'BH',
  },
  {
    key: 'primeira_vitoria',
    nome: 'Milagre estatístico',
    descricao: 'Consiga sua primeira vitória liquidada.',
    titulo: 'Milagre Estatístico',
    categoria: 'Geral',
    alvo: 1,
    valor: (m) => m.vitoriasTotais,
    icone: '★',
  },
  {
    key: 'cliente_banca',
    nome: 'Cliente preferencial',
    descricao: 'Complete 10 partidas nos Jogos da Entidade.',
    titulo: 'Cliente Preferencial da Banca',
    categoria: 'Jogos',
    alvo: 10,
    valor: (m) => m.partidasJogos,
    icone: 'T',
  },
  {
    key: 'domador_taigrinho',
    nome: 'Domador de Taigrinho',
    descricao: 'Encare o Taigrinho 5 vezes.',
    titulo: 'Domador de Taigrinho',
    categoria: 'Jogos',
    alvo: 5,
    valor: (m) => m.taigrinho,
    icone: '🐯',
  },
  {
    key: 'agronomo_risco',
    nome: 'Agricultura de risco',
    descricao: 'Jogue TaiMandioca 5 vezes.',
    titulo: 'Agrônomo de Risco',
    categoria: 'Jogos',
    alvo: 5,
    valor: (m) => m.taimandioca,
    icone: '🌱',
  },
  {
    key: 'fugitivo_regime',
    nome: 'Fuga do regime',
    descricao: 'Entre em 5 operações do Crash do Regime.',
    titulo: 'Fugitivo do Regime',
    categoria: 'Jogos',
    alvo: 5,
    valor: (m) => m.crash,
    icone: '↗',
  },
  {
    key: 'joquei_mambo',
    nome: 'Protocolo Mambo',
    descricao: 'Participe de 3 corridas do Taihen Derby.',
    titulo: 'Jóquei do Protocolo Mambo',
    categoria: 'Jogos',
    alvo: 3,
    valor: (m) => m.derby,
    icone: '🏁',
  },
  {
    key: 'investidor_questionavel',
    nome: 'Investidor questionável',
    descricao: 'Acumule 500 TaiCoins em prejuízos liquidados.',
    titulo: 'Investidor Questionável',
    categoria: 'Economia',
    alvo: 500,
    valor: (m) => m.prejuizoAcumulado,
    icone: '−T',
  },
  {
    key: 'inimigo_banca',
    nome: 'Inimigo da banca',
    descricao: 'Acumule 500 TaiCoins de lucro positivo em vitórias.',
    titulo: 'Inimigo da Banca',
    categoria: 'Economia',
    alvo: 500,
    valor: (m) => m.lucroPositivoAcumulado,
    icone: '+T',
  },
  {
    key: 'veterano_ruina',
    nome: 'Veterano da ruína',
    descricao: 'Registre 25 decisões entre apostas e jogos.',
    titulo: 'Veterano da Ruína',
    categoria: 'Geral',
    alvo: 25,
    valor: (m) => m.atividadesTotais,
    icone: '25',
  },
]

function numero(valor) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
}

function normalizarJogo(nome) {
  const texto = String(nome || '').toLowerCase()

  if (texto.includes('taigrinho')) return 'Taigrinho'
  if (texto.includes('mandioca')) return 'TaiMandioca'
  if (texto.includes('crash')) return 'Crash do Regime'
  if (texto.includes('derby')) return 'Taihen Derby'

  return nome || 'Outro'
}

function calcularMetricas(sports = [], games = []) {
  const esportes = Array.isArray(sports) ? sports : []
  const jogos = Array.isArray(games) ? games : []
  const derby = esportes.filter((item) => item?.tipo === 'derby')
  const bilhetes = esportes.filter((item) => item?.tipo !== 'derby')
  const liquidadosEsporte = esportes.filter((item) =>
    ['Ganhou', 'Perdeu'].includes(item?.status),
  )

  const vitoriasEsporte = liquidadosEsporte.filter(
    (item) => item.status === 'Ganhou',
  ).length
  const derrotasEsporte = liquidadosEsporte.filter(
    (item) => item.status === 'Perdeu',
  ).length
  const vitoriasJogos = jogos.filter(
    (item) => item?.status === 'Ganhou',
  ).length
  const derrotasJogos = jogos.filter(
    (item) => item?.status && item.status !== 'Ganhou',
  ).length

  const resultadosFinanceiros = []

  liquidadosEsporte.forEach((item) => {
    const entrada = numero(item.valor)
    const retorno =
      item.status === 'Ganhou'
        ? numero(item.retornoPago ?? item.retornoEstimado)
        : 0
    resultadosFinanceiros.push(retorno - entrada)
  })

  jogos.forEach((item) => {
    const lucroCalculado = Number(item?.lucro)
    resultadosFinanceiros.push(
      Number.isFinite(lucroCalculado)
        ? lucroCalculado
        : numero(item?.premio) - numero(item?.entrada),
    )
  })

  const totalApostadoEsportes = esportes.reduce(
    (total, item) => total + numero(item.valor),
    0,
  )
  const totalApostadoJogos = jogos.reduce(
    (total, item) => total + numero(item.entrada),
    0,
  )
  const lucroLiquido = resultadosFinanceiros.reduce(
    (total, item) => total + item,
    0,
  )
  const prejuizoAcumulado = resultadosFinanceiros.reduce(
    (total, item) => total + Math.max(0, -item),
    0,
  )
  const lucroPositivoAcumulado = resultadosFinanceiros.reduce(
    (total, item) => total + Math.max(0, item),
    0,
  )

  const contagemJogos = new Map()
  jogos.forEach((item) => {
    const nome = normalizarJogo(item?.jogo)
    contagemJogos.set(nome, (contagemJogos.get(nome) || 0) + 1)
  })
  if (derby.length > 0) {
    contagemJogos.set(
      'Taihen Derby',
      (contagemJogos.get('Taihen Derby') || 0) + derby.length,
    )
  }

  const favorito = [...contagemJogos.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]

  const taigrinho = jogos.filter(
    (item) => normalizarJogo(item?.jogo) === 'Taigrinho',
  ).length
  const taimandioca = jogos.filter(
    (item) => normalizarJogo(item?.jogo) === 'TaiMandioca',
  ).length
  const crash = jogos.filter(
    (item) => normalizarJogo(item?.jogo) === 'Crash do Regime',
  ).length

  const resultadosLiquidados =
    liquidadosEsporte.length + jogos.length
  const vitoriasTotais = vitoriasEsporte + vitoriasJogos

  return {
    bilhetesEsportivos: bilhetes.length,
    partidasJogos: jogos.length + derby.length,
    atividadesTotais: bilhetes.length + jogos.length + derby.length,
    vitoriasTotais,
    derrotasTotais: derrotasEsporte + derrotasJogos,
    taxaAcerto:
      resultadosLiquidados > 0
        ? (vitoriasTotais / resultadosLiquidados) * 100
        : 0,
    totalMovimentado: totalApostadoEsportes + totalApostadoJogos,
    lucroLiquido,
    prejuizoAcumulado,
    lucroPositivoAcumulado,
    maiorGanho: Math.max(0, ...resultadosFinanceiros),
    maiorPerda: Math.max(
      0,
      ...resultadosFinanceiros.map((item) => Math.max(0, -item)),
    ),
    jogoFavorito: favorito?.[0] || 'Nenhum ainda',
    jogoFavoritoQuantidade: favorito?.[1] || 0,
    taigrinho,
    taimandioca,
    crash,
    derby: derby.length,
  }
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(numero(valor))
}

function ProgressionPage({
  session,
  profile,
  sports,
  games,
  onOpenAuth,
  onTitleChanged,
  onOpenPublicProfile,
}) {
  const siteTexts = useSiteTexts()
  const { map: catalogoConquistas, loaded: catalogoCarregado } = useAchievementCatalog()
  const conquistas = useMemo(
    () =>
      CONQUISTAS_BASE.map((base) => {
        const editavel = catalogoConquistas[base.key]
        return editavel
          ? {
              ...base,
              nome: editavel.name || base.nome,
              descricao: editavel.description || base.descricao,
              titulo: editavel.title || base.titulo,
              categoria: editavel.category || base.categoria,
              alvo: Number(editavel.target) || base.alvo,
              icone: editavel.icon || base.icone,
              sort_order: Number(editavel.sort_order) || 0,
              active: editavel.active !== false,
            }
          : { ...base, sort_order: 0, active: true }
      })
        .filter((item) => item.active)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [catalogoConquistas],
  )

  const metricas = useMemo(
    () => calcularMetricas(sports, games),
    [sports, games],
  )
  const [desbloqueadas, setDesbloqueadas] = useState([])
  const [tituloEquipado, setTituloEquipado] = useState(
    profile?.equipped_title_key || null,
  )
  const [carregando, setCarregando] = useState(false)
  const [salvandoTitulo, setSalvandoTitulo] = useState(null)
  const [aviso, setAviso] = useState(null)

  const chavesElegiveis = useMemo(
    () =>
      catalogoCarregado
        ? conquistas.filter(
        (conquista) => conquista.valor(metricas) >= conquista.alvo,
          ).map((conquista) => conquista.key)
        : [],
    [metricas, conquistas, catalogoCarregado],
  )

  useEffect(() => {
    setTituloEquipado(profile?.equipped_title_key || null)
  }, [profile?.equipped_title_key])

  useEffect(() => {
    if (!catalogoCarregado) return
    if (!session?.user) {
      setDesbloqueadas([])
      return
    }

    let ativo = true

    async function sincronizar() {
      setCarregando(true)
      const { data, error } = await supabase.rpc(
        'sync_my_achievements',
        { p_keys: chavesElegiveis },
      )

      if (!ativo) return
      setCarregando(false)

      if (error) {
        console.error('Falha ao sincronizar conquistas:', error)
        setAviso({
          tipo: 'erro',
          texto:
            'A banca não conseguiu consultar suas conquistas. Confira se o SQL da Fase 3.15 foi executado.',
        })
        return
      }

      const estado = Array.isArray(data) ? data[0] : data
      const chaves = Array.isArray(estado?.achievements)
        ? estado.achievements.map((item) => item.achievement_key)
        : []
      const novas = Array.isArray(estado?.newly_unlocked)
        ? estado.newly_unlocked
        : []

      setDesbloqueadas(chaves)
      setTituloEquipado(estado?.equipped_title_key || null)

      if (novas.length > 0) {
        setAviso({
          tipo: 'sucesso',
          texto:
            novas.length === 1
              ? 'Nova conquista registrada pela banca.'
              : `${novas.length} novas conquistas foram registradas pela banca.`,
        })
      }
    }

    void sincronizar()

    return () => {
      ativo = false
    }
  }, [session?.user?.id, chavesElegiveis.join('|'), catalogoCarregado])

  async function equiparTitulo(chave) {
    if (!session?.user) return

    const proximo = tituloEquipado === chave ? null : chave
    setSalvandoTitulo(chave)

    const { data, error } = await supabase.rpc(
      'set_my_equipped_title',
      { p_achievement_key: proximo },
    )

    setSalvandoTitulo(null)

    if (error) {
      console.error('Falha ao equipar título:', error)
      setAviso({
        tipo: 'erro',
        texto: 'A banca recusou a troca de título.',
      })
      return
    }

    const novoTitulo = data?.equipped_title_key || null
    setTituloEquipado(novoTitulo)
    onTitleChanged?.(novoTitulo)
    setAviso({
      tipo: 'sucesso',
      texto: novoTitulo
        ? 'Título equipado no seu perfil.'
        : 'Título removido do seu perfil.',
    })
  }

  if (!session?.user) {
    return (
      <section
        className="progression-page progression-guest"
        data-neytai-target="progression-page"
      >
        <span className="progression-kicker">ARQUIVO DE PROGRESSO</span>
        <h1>Suas humilhações precisam de uma conta.</h1>
        <p>
          Entre na TaihenBet para salvar conquistas, títulos e estatísticas
          junto do seu perfil.
        </p>
        <button type="button" onClick={onOpenAuth}>
          Entrar na conta
        </button>
      </section>
    )
  }

  const tituloAtual = conquistas.find(
    (item) => item.key === tituloEquipado,
  )
  const desbloqueadasVisiveis = desbloqueadas.filter((key) =>
    conquistas.some((item) => item.key === key),
  )

  return (
    <div
      className="progression-page"
      data-neytai-target="progression-page"
    >
      <section className="progression-hero">
        <div>
          <span className="progression-kicker">{siteTexts['progression.eyebrow'] || 'FASE 3.15 · PROGRESSÃO'}</span>
          <h1>{siteTexts['progression.title'] || 'Currículo oficial de decisões questionáveis.'}</h1>
          <p>
            {siteTexts['progression.description'] ||
              'A banca transformou seu histórico em estatísticas, conquistas e títulos que continuam ligados à sua conta.'}
          </p>
        </div>

        <aside className="progression-identity">
          <span>TÍTULO EQUIPADO</span>
          <strong>{tituloAtual?.titulo || 'Nenhum título equipado'}</strong>
          <small>@{profile?.username || 'cliente-da-banca'}</small>
          {onOpenPublicProfile && (
            <button
              type="button"
              className="progression-public-profile-button"
              onClick={onOpenPublicProfile}
            >
              Ver meu perfil público →
            </button>
          )}
        </aside>
      </section>

      {aviso && (
        <div className={`progression-notice ${aviso.tipo}`}>
          <span>{aviso.texto}</span>
          <button type="button" onClick={() => setAviso(null)}>
            ×
          </button>
        </div>
      )}

      <section className="progression-stats">
        <article>
          <span>Decisões registradas</span>
          <strong>{metricas.atividadesTotais}</strong>
        </article>
        <article>
          <span>Vitórias</span>
          <strong>{metricas.vitoriasTotais}</strong>
        </article>
        <article>
          <span>Derrotas</span>
          <strong>{metricas.derrotasTotais}</strong>
        </article>
        <article>
          <span>Taxa de acerto</span>
          <strong>{metricas.taxaAcerto.toFixed(1)}%</strong>
        </article>
        <article>
          <span>TaiCoins movimentadas</span>
          <strong>{formatarMoeda(metricas.totalMovimentado)}</strong>
        </article>
        <article className={metricas.lucroLiquido >= 0 ? 'positive' : 'negative'}>
          <span>Lucro líquido</span>
          <strong>
            {metricas.lucroLiquido >= 0 ? '+' : '−'}
            {formatarMoeda(Math.abs(metricas.lucroLiquido))}
          </strong>
        </article>
        <article>
          <span>Maior ganho líquido</span>
          <strong>+{formatarMoeda(metricas.maiorGanho)}</strong>
        </article>
        <article>
          <span>Maior loss</span>
          <strong>−{formatarMoeda(metricas.maiorPerda)}</strong>
        </article>
      </section>

      <section className="progression-favorite">
        <div>
          <span>JOGO MAIS FREQUENTADO</span>
          <h2>{metricas.jogoFavorito}</h2>
          <p>
            {metricas.jogoFavoritoQuantidade > 0
              ? `${metricas.jogoFavoritoQuantidade} registros encontrados no arquivo da conta.`
              : 'Você ainda não deixou provas suficientes nos Jogos da Entidade.'}
          </p>
        </div>

        <div className="progression-mini-breakdown">
          <b>Taigrinho {metricas.taigrinho}</b>
          <b>TaiMandioca {metricas.taimandioca}</b>
          <b>Crash {metricas.crash}</b>
          <b>Derby {metricas.derby}</b>
        </div>
      </section>

      <section className="achievement-section">
        <div className="achievement-heading">
          <div>
            <span>ARQUIVO DE CONQUISTAS</span>
            <h2>
              {desbloqueadasVisiveis.length}/{conquistas.length} desbloqueadas
            </h2>
          </div>
          <small>
            {carregando
              ? 'Sincronizando com a banca...'
              : 'Conquistas desbloqueadas não somem se o histórico for limpo depois.'}
          </small>
        </div>

        <div className="achievement-grid">
          {conquistas.map((conquista) => {
            const valorAtual = conquista.valor(metricas)
            const desbloqueada = desbloqueadas.includes(conquista.key)
            const equipada = tituloEquipado === conquista.key
            const progresso = Math.min(
              100,
              Math.max(0, (valorAtual / conquista.alvo) * 100),
            )

            return (
              <article
                key={conquista.key}
                className={`achievement-card ${
                  desbloqueada ? 'unlocked' : 'locked'
                } ${equipada ? 'equipped' : ''}`}
              >
                <div className="achievement-top">
                  <div className="achievement-icon">{conquista.icone}</div>
                  <span>{conquista.categoria}</span>
                </div>

                <h3>{conquista.nome}</h3>
                <p>{conquista.descricao}</p>

                <div className="achievement-progress-line">
                  <i style={{ width: `${progresso}%` }} />
                </div>
                <small>
                  {Math.min(valorAtual, conquista.alvo).toLocaleString('pt-BR')}
                  {' / '}
                  {conquista.alvo.toLocaleString('pt-BR')}
                </small>

                <div className="achievement-title-box">
                  <span>TÍTULO</span>
                  <strong>{conquista.titulo}</strong>
                </div>

                {desbloqueada ? (
                  <button
                    type="button"
                    className={equipada ? 'unequip' : ''}
                    disabled={salvandoTitulo === conquista.key}
                    onClick={() => equiparTitulo(conquista.key)}
                  >
                    {salvandoTitulo === conquista.key
                      ? 'Salvando...'
                      : equipada
                        ? 'Remover título'
                        : 'Equipar título'}
                  </button>
                ) : (
                  <button type="button" disabled>
                    Bloqueado pela banca
                  </button>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default ProgressionPage
