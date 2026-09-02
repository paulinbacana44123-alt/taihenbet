import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { avatarDoPerfil } from '../data/profileAvatars'
import './RankingPage.css'
import { useAchievementCatalog } from '../hooks/useEditableContent'

const TITULOS = {
  primeiro_bilhete: 'Apostador de Schrödinger',
  analista_bahrein: 'Especialista em Futebol Bareinita',
  primeira_vitoria: 'Milagre Estatístico',
  cliente_banca: 'Cliente Preferencial da Banca',
  domador_taigrinho: 'Domador de Taigrinho',
  agronomo_risco: 'Agrônomo de Risco',
  fugitivo_regime: 'Fugitivo do Regime',
  joquei_mambo: 'Jóquei do Protocolo Mambo',
  investidor_questionavel: 'Investidor Questionável',
  inimigo_banca: 'Inimigo da Banca',
  veterano_ruina: 'Veterano da Ruína',
}

function numero(valor) {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
}

function formatar(valor, casas = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(numero(valor))
}

function taxa(usuario) {
  const wins = numero(usuario.wins)
  const losses = numero(usuario.losses)
  const total = wins + losses
  return total > 0 ? (wins / total) * 100 : 0
}

function RankingPage({ currentUserId, refreshKey, onOpenProfile }) {
  const { map: achievementCatalog } = useAchievementCatalog()
  const [ranking, setRanking] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregarRanking() {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase.rpc('get_public_ranking_v2')

    if (error) {
      console.error('Falha ao carregar ranking público:', error)
      setRanking([])
      setErro(
        error.message ||
          'A banca não conseguiu organizar a fila de investidores.',
      )
      setCarregando(false)
      return
    }

    setRanking(Array.isArray(data) ? data : [])
    setCarregando(false)
  }

  useEffect(() => {
    void carregarRanking()
  }, [refreshKey])

  const podium = useMemo(() => ranking.slice(0, 3), [ranking])

  if (carregando) {
    return (
      <section className="ranking-state-card">
        <span>RANKING DA BANCA</span>
        <h1>Contando TaiCoins alheias...</h1>
        <p>O auditor ainda está fingindo que entende a planilha.</p>
      </section>
    )
  }

  if (erro) {
    return (
      <section className="ranking-state-card error">
        <span>ERRO CONTÁBIL</span>
        <h1>O ranking entrou em recuperação judicial.</h1>
        <p>{erro}</p>
        <button type="button" onClick={() => void carregarRanking()}>
          Tentar de novo
        </button>
      </section>
    )
  }

  return (
    <div className="ranking-page-v2">
      <header className="ranking-hero-v2">
        <div>
          <span>FASE 3.16 · ARQUIVO SOCIAL</span>
          <h1>Ranking oficial da ruína.</h1>
          <p>
            Clique em qualquer cliente para abrir a ficha pública, conferir
            título, conquistas e o tamanho documentado do estrago.
          </p>
        </div>

        <aside>
          <small>CLIENTES RANQUEADOS</small>
          <strong>{ranking.length}</strong>
        </aside>
      </header>

      {podium.length > 0 && (
        <section className="ranking-podium-v2">
          {podium.map((usuario, indice) => {
            const titulo = achievementCatalog[usuario.equipped_title_key]?.title || TITULOS[usuario.equipped_title_key]
            const posicao = indice + 1

            return (
              <button
                type="button"
                className={`ranking-podium-card position-${posicao} ${
                  usuario.id === currentUserId ? 'is-me' : ''
                }`}
                key={usuario.id}
                onClick={() => onOpenProfile?.(usuario.id)}
              >
                <span className="ranking-position">#{posicao}</span>
                <img
                  src={avatarDoPerfil(usuario.avatar_key).src}
                  alt={`Avatar de ${usuario.username}`}
                />
                <div>
                  <small>
                    {usuario.role === 'admin' ? 'ADMIN DA BANCA' : 'CLIENTE'}
                  </small>
                  <h2>{usuario.username}</h2>
                  <em>{titulo || 'Sem título equipado'}</em>
                </div>
                <strong>{formatar(usuario.balance, 2)} T</strong>
              </button>
            )
          })}
        </section>
      )}

      <section className="ranking-list-shell">
        <div className="ranking-list-heading">
          <div>
            <span>CLASSIFICAÇÃO COMPLETA</span>
            <h2>Planilha de patrimônio fictício</h2>
          </div>
          <button type="button" onClick={() => void carregarRanking()}>
            Atualizar ranking
          </button>
        </div>

        {ranking.length === 0 ? (
          <div className="ranking-empty-v2">
            Nenhum cliente encontrado. Até a banca parece preocupada.
          </div>
        ) : (
          <div className="ranking-list-v2">
            {ranking.map((usuario, indice) => {
              const decisions =
                numero(usuario.sports_count) + numero(usuario.games_count)
              const lucro = numero(usuario.net_profit)
              const titulo = achievementCatalog[usuario.equipped_title_key]?.title || TITULOS[usuario.equipped_title_key]

              return (
                <button
                  type="button"
                  className={`ranking-row-v2 ${
                    usuario.id === currentUserId ? 'is-me' : ''
                  }`}
                  key={usuario.id}
                  onClick={() => onOpenProfile?.(usuario.id)}
                >
                  <span className="ranking-row-position">
                    {String(indice + 1).padStart(2, '0')}
                  </span>

                  <img
                    src={avatarDoPerfil(usuario.avatar_key).src}
                    alt=""
                    aria-hidden="true"
                  />

                  <div className="ranking-row-person">
                    <div>
                      <strong>{usuario.username}</strong>
                      {usuario.id === currentUserId && <b>VOCÊ</b>}
                      {usuario.role === 'admin' && <b>ADMIN</b>}
                    </div>
                    <small>{titulo || 'Sem título equipado'}</small>
                  </div>

                  <div className="ranking-row-stat">
                    <span>Saldo</span>
                    <strong>{formatar(usuario.balance, 2)} T</strong>
                  </div>

                  <div className="ranking-row-stat">
                    <span>Decisões</span>
                    <strong>{formatar(decisions)}</strong>
                  </div>

                  <div className="ranking-row-stat">
                    <span>Acerto</span>
                    <strong>{formatar(taxa(usuario), 1)}%</strong>
                  </div>

                  <div
                    className={`ranking-row-stat ${
                      lucro >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    <span>Lucro</span>
                    <strong>
                      {lucro >= 0 ? '+' : '−'}{formatar(Math.abs(lucro), 2)}
                    </strong>
                  </div>

                  <span className="ranking-open-profile">Ver perfil →</span>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default RankingPage
