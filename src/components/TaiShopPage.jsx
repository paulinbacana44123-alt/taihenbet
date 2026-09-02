import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { avatarDoPerfil } from '../data/profileAvatars'
import {
  CATEGORIAS_TAISHOP,
  COSMETICOS_TAISHOP,
  classeCosmetico,
} from '../data/taishopCosmetics'
import './TaiShopPage.css'
import { useSiteTexts } from '../hooks/useEditableContent'

function numero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numero(valor))
}

function normalizarEstado(data) {
  const estado = data && typeof data === 'object' ? data : {}
  return {
    owned: Array.isArray(estado.owned) ? estado.owned.map(String) : [],
    equipped:
      estado.equipped && typeof estado.equipped === 'object'
        ? estado.equipped
        : {},
    balance: numero(estado.balance),
  }
}

function CosmeticPreview({ item, profile }) {
  const chave = item.id
  const meta = COSMETICOS_TAISHOP[chave] || {}
  const classe = classeCosmetico(chave)
  const avatar = profile?.avatar_key ? avatarDoPerfil(profile.avatar_key)?.src : null
  const usuario = profile?.username || 'Cliente da banca'

  if (item.category === 'avatar_frame') {
    return (
      <div className={`taishop-preview taishop-preview-frame ${classe}`}>
        <div className="taishop-avatar-preview">
          {avatar ? (
            <img src={avatar} alt="" aria-hidden="true" />
          ) : (
            <strong aria-hidden="true">T</strong>
          )}
        </div>
        <span>{meta.simbolo || '◉'}</span>
      </div>
    )
  }

  if (item.category === 'name_color') {
    return (
      <div className={`taishop-preview taishop-preview-name ${classe}`}>
        <small>IDENTIDADE PÚBLICA</small>
        <strong>{usuario}</strong>
        <span>{meta.simbolo || 'Aa'}</span>
      </div>
    )
  }

  if (item.category === 'profile_effect') {
    return (
      <div className={`taishop-preview taishop-preview-effect ${classe}`}>
        <i />
        <small>FICHA PÚBLICA</small>
        <strong>{meta.simbolo || '◇'}</strong>
      </div>
    )
  }

  return (
    <div className={`taishop-preview taishop-preview-badge ${classe}`}>
      <span>{meta.simbolo || 'T'}</span>
      <strong>{meta.rotulo || item.name}</strong>
    </div>
  )
}

export default function TaiShopPage({
  session,
  profile,
  onOpenAuth,
  onProfileChanged,
  onOpenPublicProfile,
}) {
  const siteTexts = useSiteTexts()
  const [catalogo, setCatalogo] = useState([])
  const [estado, setEstado] = useState(() => normalizarEstado(null))
  const [filtro, setFiltro] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [operando, setOperando] = useState('')
  const [aviso, setAviso] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [resgatandoCodigo, setResgatandoCodigo] = useState(false)
  const [historicoCodigos, setHistoricoCodigos] = useState([])

  const autenticado = Boolean(session?.user)
  const ownedSet = useMemo(() => new Set(estado.owned), [estado.owned])

  async function carregar({ silencioso = false } = {}) {
    if (!silencioso) setCarregando(true)

    const { data: catalogData, error: catalogError } = await supabase.rpc(
      'get_taishop_catalog',
    )

    if (catalogError) {
      console.error('Falha ao carregar TaiShop:', catalogError)
      setAviso({
        tipo: 'erro',
        texto: 'A loja não abriu. Confira se o SQL da Fase 3.18 foi executado.',
      })
      if (!silencioso) setCarregando(false)
      return
    }

    setCatalogo(Array.isArray(catalogData) ? catalogData : [])

    if (!autenticado) {
      setEstado(normalizarEstado(null))
      setHistoricoCodigos([])
      if (!silencioso) setCarregando(false)
      return
    }

    const { data: stateData, error: stateError } = await supabase.rpc(
      'get_my_taishop_state',
    )

    if (stateError) {
      console.error('Falha ao carregar inventário da TaiShop:', stateError)
      setAviso({
        tipo: 'erro',
        texto: 'O catálogo abriu, mas a banca perdeu seu inventário.',
      })
    } else {
      setEstado(normalizarEstado(stateData))
    }

    const { data: promoHistory, error: promoHistoryError } = await supabase.rpc(
      'get_my_promo_code_history',
      { p_limit: 6 },
    )

    if (!promoHistoryError) {
      setHistoricoCodigos(Array.isArray(promoHistory) ? promoHistory : [])
    } else if (!String(promoHistoryError?.message || '').includes('function')) {
      console.warn('Histórico de códigos indisponível:', promoHistoryError)
    }

    if (!silencioso) setCarregando(false)
  }

  useEffect(() => {
    void carregar()
  }, [session?.user?.id])

  const itensVisiveis = useMemo(
    () =>
      catalogo.filter(
        (item) => filtro === 'todos' || item.category === filtro,
      ),
    [catalogo, filtro],
  )

  function estaEquipado(item) {
    return String(estado.equipped?.[item.category] || '') === String(item.id)
  }

  function traduzirErro(error, fallback) {
    const texto = `${error?.message || ''} ${error?.details || ''}`
    if (texto.includes('ACCOUNT_SUSPENDED')) {
      return 'Conta suspensa: a Central de Moderação bloqueou compras e trocas de cosméticos.'
    }
    if (texto.includes('Insufficient TaiCoins')) {
      return 'TaiCoins insuficientes. A banca recomenda péssimas decisões financeiras adicionais.'
    }
    if (texto.includes('COSMETIC_ALREADY_OWNED')) {
      return 'Esse item já consta no seu inventário.'
    }
    if (texto.includes('COSMETIC_NOT_OWNED')) {
      return 'Você precisa comprar esse cosmético antes de equipá-lo.'
    }
    return error?.message || fallback
  }

  async function comprar(item) {
    if (!autenticado) {
      onOpenAuth?.()
      return
    }
    if (operando) return

    setOperando(`buy:${item.id}`)
    setAviso(null)

    const { data, error } = await supabase.rpc('buy_taishop_cosmetic', {
      p_cosmetic_id: item.id,
    })

    if (error) {
      console.error('Compra recusada pela TaiShop:', error)
      setAviso({
        tipo: 'erro',
        texto: traduzirErro(error, 'A banca recusou a compra.'),
      })
      setOperando('')
      return
    }

    if (data?.profile) onProfileChanged?.(data.profile)
    await carregar({ silencioso: true })
    setAviso({
      tipo: 'sucesso',
      texto: `${item.name} entrou no inventário. O patrimônio foi devidamente reduzido.`,
    })
    setOperando('')
  }

  async function definirCosmetico(item, remover = false) {
    if (!autenticado) {
      onOpenAuth?.()
      return
    }
    if (operando) return

    setOperando(`${remover ? 'off' : 'equip'}:${item.id}`)
    setAviso(null)

    const { data, error } = await supabase.rpc('set_my_taishop_cosmetic', {
      p_category: item.category,
      p_cosmetic_id: remover ? null : item.id,
    })

    if (error) {
      console.error('Falha ao equipar cosmético:', error)
      setAviso({
        tipo: 'erro',
        texto: traduzirErro(error, 'A banca recusou a alteração estética.'),
      })
      setOperando('')
      return
    }

    onProfileChanged?.(data)
    await carregar({ silencioso: true })
    setAviso({
      tipo: 'sucesso',
      texto: remover
        ? `${item.name} saiu da ficha pública.`
        : `${item.name} agora está equipado no perfil público.`,
    })
    setOperando('')
  }


  function traduzirErroCodigo(error) {
    const texto = `${error?.message || ''} ${error?.details || ''}`

    if (texto.includes('AUTH_REQUIRED')) return 'Entre na sua conta antes de tentar subornar a banca.'
    if (texto.includes('PROMO_CODE_EMPTY')) return 'Digite um código primeiro, criatura.'
    if (texto.includes('PROMO_CODE_INVALID')) return 'Esse código não existe nos arquivos da banca.'
    if (texto.includes('PROMO_CODE_INACTIVE')) return 'Esse código foi aposentado pela diretoria.'
    if (texto.includes('PROMO_CODE_NOT_STARTED')) return 'O código existe, mas a corrupção ainda não começou.'
    if (texto.includes('PROMO_CODE_EXPIRED')) return 'O prazo desse código já foi de arrasta pra cima.'
    if (texto.includes('PROMO_CODE_NOT_FOR_YOU')) return 'Esse código existe, mas seu nome não está na lista de favorecidos.'
    if (texto.includes('PROMO_CODE_USER_LIMIT')) return 'Você já usou esse código o máximo de vezes permitido.'
    if (texto.includes('PROMO_CODE_TOTAL_LIMIT')) return 'Chegaram antes de você e secaram esse código.'
    if (texto.includes('ACCOUNT_SUSPENDED')) return 'Conta suspensa: até a corrupção fictícia foi bloqueada.'
    return error?.message || 'A banca olhou para o código e fingiu que não entendeu.'
  }

  async function resgatarCodigo(event) {
    event?.preventDefault()

    if (!autenticado) {
      onOpenAuth?.()
      return
    }

    const valor = codigo.trim()
    if (!valor || resgatandoCodigo) return

    setResgatandoCodigo(true)
    setAviso(null)

    const { data, error } = await supabase.rpc('redeem_promo_code', {
      p_code: valor,
    })

    if (error) {
      console.error('Código recusado pela banca:', error)
      setAviso({
        tipo: 'erro',
        texto: traduzirErroCodigo(error),
      })
      setResgatandoCodigo(false)
      return
    }

    if (data?.profile) onProfileChanged?.(data.profile)

    const aplicado = numero(data?.amount)
    setAviso({
      tipo: aplicado < 0 ? 'erro' : 'sucesso',
      texto:
        data?.message ||
        (aplicado >= 0
          ? `+${formatarMoedas(aplicado)} TaiCoins liberadas.`
          : `${formatarMoedas(Math.abs(aplicado))} TaiCoins confiscadas.`),
    })
    setCodigo('')
    await carregar({ silencioso: true })
    setResgatandoCodigo(false)
  }

  const saldoExibido = autenticado
    ? numero(profile?.balance ?? estado.balance)
    : 0

  return (
    <div className="taishop-page" data-neytai-target="taishop-page">
      <section className="taishop-hero">
        <div>
          <span>{siteTexts['shop.eyebrow'] || 'FASE 3.18 · CONSUMISMO FICTÍCIO'}</span>
          <h1>{siteTexts['shop.title'] || 'Gaste antes que a banca perceba.'}</h1>
          <p>
            {siteTexts['shop.description'] ||
              'Molduras, cores, efeitos e selos para transformar TaiCoins em absolutamente nenhum benefício financeiro.'}
          </p>
        </div>

        <aside className="taishop-wallet-card">
          <small>SEU PODER DE COMPRA</small>
          {autenticado ? (
            <>
              <strong>{formatarMoedas(saldoExibido)} T</strong>
              <span>{estado.owned.length}/{catalogo.length || 12} itens adquiridos</span>
            </>
          ) : (
            <>
              <strong>CONTA NECESSÁRIA</strong>
              <span>Entre para comprar e equipar cosméticos.</span>
              <button type="button" onClick={onOpenAuth}>Entrar na banca</button>
            </>
          )}
        </aside>
      </section>

      {aviso && (
        <div className={`taishop-notice ${aviso.tipo}`}>
          <span>{aviso.texto}</span>
          <button type="button" onClick={() => setAviso(null)}>×</button>
        </div>
      )}


      <section className="taishop-promo-vault">
        <div className="taishop-promo-copy">
          <span>CÓDIGOS DA BANCA</span>
          <h2>Insira a sequência de corrupção autorizada.</h2>
          <p>
            Alguns códigos aparecem por aí e liberam TaiCoins. Outros existem
            exclusivamente para provar que você não deveria digitar qualquer
            coisa que alguém mandar.
          </p>
        </div>

        <form className="taishop-promo-form" onSubmit={resgatarCodigo}>
          {autenticado ? (
            <>
              <div className="taishop-promo-input-row">
                <input
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value)}
                  placeholder="Digite um código"
                  maxLength={80}
                  autoComplete="off"
                  spellCheck="false"
                  aria-label="Código da banca"
                />
                <button type="submit" disabled={resgatandoCodigo || !codigo.trim()}>
                  {resgatandoCodigo ? 'Auditando...' : 'Resgatar'}
                </button>
              </div>
              <small>
                Códigos podem ter limite por conta, validade, público específico
                e até valor negativo. A banca não assume responsabilidade pela
                sua curiosidade.
              </small>
            </>
          ) : (
            <button type="button" className="taishop-promo-login" onClick={onOpenAuth}>
              Entrar para resgatar códigos
            </button>
          )}
        </form>

        {autenticado && historicoCodigos.length > 0 && (
          <div className="taishop-promo-history">
            <strong>ÚLTIMOS RESGATES</strong>
            <div>
              {historicoCodigos.map((item) => (
                <span key={item.redemption_id}>
                  <b>{item.code}</b>
                  <em className={numero(item.amount) < 0 ? 'negative' : ''}>
                    {numero(item.amount) >= 0 ? '+' : '−'}
                    {formatarMoedas(Math.abs(numero(item.amount)))} T
                  </em>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="taishop-toolbar">
        <div className="taishop-tabs" role="tablist" aria-label="Categorias da TaiShop">
          <button
            type="button"
            className={filtro === 'todos' ? 'active' : ''}
            onClick={() => setFiltro('todos')}
          >
            Tudo
          </button>
          {Object.entries(CATEGORIAS_TAISHOP).map(([id, categoria]) => (
            <button
              type="button"
              key={id}
              className={filtro === id ? 'active' : ''}
              onClick={() => setFiltro(id)}
            >
              {categoria.nome}
            </button>
          ))}
        </div>

        {autenticado && (
          <button type="button" className="taishop-profile-link" onClick={onOpenPublicProfile}>
            Ver meu perfil público →
          </button>
        )}
      </section>

      {carregando ? (
        <section className="taishop-state">
          <span>ABRINDO O CAIXA</span>
          <h2>Precificando pixels...</h2>
        </section>
      ) : itensVisiveis.length === 0 ? (
        <section className="taishop-state">
          <span>PRATELEIRA VAZIA</span>
          <h2>Nada foi encontrado nessa categoria.</h2>
        </section>
      ) : (
        <section className="taishop-grid">
          {itensVisiveis.map((item) => {
            const adquirido = ownedSet.has(String(item.id))
            const equipado = estaEquipado(item)
            const ocupado = Boolean(operando)
            const processando = operando.endsWith(`:${item.id}`)

            return (
              <article
                key={item.id}
                className={`taishop-item ${equipado ? 'is-equipped' : ''}`}
              >
                <CosmeticPreview item={item} profile={profile} />

                <div className="taishop-item-copy">
                  <div className="taishop-item-meta">
                    <span>{item.rarity}</span>
                    <small>{CATEGORIAS_TAISHOP[item.category]?.nome || item.category}</small>
                  </div>
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                </div>

                <div className="taishop-item-footer">
                  <strong><i>T</i>{formatarMoedas(item.price)}</strong>

                  {!autenticado ? (
                    <button type="button" onClick={onOpenAuth}>Entrar para comprar</button>
                  ) : !adquirido ? (
                    <button
                      type="button"
                      disabled={ocupado || saldoExibido < numero(item.price)}
                      onClick={() => comprar(item)}
                    >
                      {processando
                        ? 'Cobrando...'
                        : saldoExibido < numero(item.price)
                          ? 'Saldo insuficiente'
                          : 'Comprar'}
                    </button>
                  ) : equipado ? (
                    <button
                      type="button"
                      className="secondary"
                      disabled={ocupado}
                      onClick={() => definirCosmetico(item, true)}
                    >
                      {processando ? 'Removendo...' : 'Desequipar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => definirCosmetico(item, false)}
                    >
                      {processando ? 'Equipando...' : 'Equipar'}
                    </button>
                  )}
                </div>

                {equipado && <span className="taishop-equipped-tag">EM EXIBIÇÃO</span>}
              </article>
            )
          })}
        </section>
      )}

      <section className="taishop-disclaimer">
        <strong>POLÍTICA DE DEVOLUÇÃO DA TAIShop</strong>
        <p>
          Não existe. Os itens são permanentes, as TaiCoins são fictícias e
          nenhum cosmético altera odds, prêmios ou qualquer mecânica de jogo.
        </p>
      </section>
    </div>
  )
}
