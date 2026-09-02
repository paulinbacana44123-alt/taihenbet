import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { avatarDoPerfil } from '../data/profileAvatars'
import './WalletAdminPanel.css'

function formatarMoedas(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

function lerNumero(valor) {
  const normalizado = String(valor ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.')

  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : null
}

export default function WalletAdminPanel() {
  const [perfis, setPerfis] = useState([])
  const [usuarioId, setUsuarioId] = useState('')
  const [saldoFinal, setSaldoFinal] = useState('')
  const [nota, setNota] = useState('Ajuste manual autorizado pela banca')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [usuarioAtualId, setUsuarioAtualId] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregarPerfis(preferirId = null) {
    setCarregando(true)
    setErro('')

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_key, balance, role, created_at')
      .order('username', { ascending: true })

    if (error) {
      setErro(`A banca não conseguiu listar as carteiras: ${error.message}`)
      setCarregando(false)
      return
    }

    const lista = data || []
    setPerfis(lista)

    const proximoId =
      (preferirId && lista.some((perfil) => perfil.id === preferirId)
        ? preferirId
        : usuarioId && lista.some((perfil) => perfil.id === usuarioId)
          ? usuarioId
          : lista[0]?.id) || ''

    setUsuarioId(proximoId)

    const selecionado = lista.find((perfil) => perfil.id === proximoId)
    if (selecionado) {
      setSaldoFinal(String(Number(selecionado.balance).toFixed(2)).replace('.', ','))
    }

    setCarregando(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuarioAtualId(data?.user?.id || '')
    })

    carregarPerfis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const perfilSelecionado = useMemo(
    () => perfis.find((perfil) => perfil.id === usuarioId) || null,
    [perfis, usuarioId],
  )

  const saldoAtual = Number(perfilSelecionado?.balance || 0)
  const alvo = lerNumero(saldoFinal)
  const ajuste = alvo == null ? null : Number((alvo - saldoAtual).toFixed(2))

  function selecionarUsuario(id) {
    setUsuarioId(id)
    setErro('')
    setSucesso('')

    const perfil = perfis.find((item) => item.id === id)
    if (perfil) {
      setSaldoFinal(String(Number(perfil.balance).toFixed(2)).replace('.', ','))
    }
  }


  async function excluirConta() {
    setErro('')
    setSucesso('')

    if (!perfilSelecionado) {
      setErro('Escolha uma conta antes de tentar fazê-la desaparecer dos registros da banca.')
      return
    }

    if (perfilSelecionado.id === usuarioAtualId) {
      setErro('Sua própria conta está protegida. A banca se recusa a permitir suicídio administrativo.')
      return
    }

    const confirmou = window.confirm(
      `EXCLUIR A CONTA DE ${perfilSelecionado.username}?\n\n` +
        'Isso remove o login e os dados ligados à conta, incluindo saldo, histórico, jogos, mensagens e publicações.\n\n' +
        'Essa operação não possui botão de desfazer.',
    )

    if (!confirmou) return

    const confirmacaoNome = window.prompt(
      `Última confirmação: digite exatamente ${perfilSelecionado.username} para excluir a conta.`,
    )

    if (confirmacaoNome === null) return

    if (confirmacaoNome.trim() !== perfilSelecionado.username) {
      setErro('O nome digitado não confere. A conta continua viva por intervenção burocrática.')
      return
    }

    setExcluindo(true)

    const nomeExcluido = perfilSelecionado.username
    const { data, error } = await supabase.rpc('admin_delete_user_account', {
      p_user_id: perfilSelecionado.id,
    })

    if (error) {
      setErro(`A banca não conseguiu excluir a conta: ${error.message}`)
      setExcluindo(false)
      return
    }

    const caminhosMuseu = Array.isArray(data?.media_paths)
      ? data.media_paths.filter(Boolean)
      : []

    let avisoStorage = ''

    if (caminhosMuseu.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('museum-community')
        .remove(caminhosMuseu)

      if (storageError) {
        avisoStorage =
          ' A conta foi apagada, mas alguns arquivos antigos do Museu podem precisar de limpeza manual no Storage.'
      }
    }

    setSucesso(
      `${nomeExcluido} foi removido da TaihenBet. O RH fictício encerrou o contrato sem aviso prévio.${avisoStorage}`,
    )

    setUsuarioId('')
    setSaldoFinal('')
    await carregarPerfis()
    setExcluindo(false)
  }

  async function aplicarAjuste(event) {
    event.preventDefault()
    setErro('')
    setSucesso('')

    if (!perfilSelecionado) {
      setErro('Escolha uma carteira antes de tentar brincar de Banco Central.')
      return
    }

    if (alvo == null || alvo < 0) {
      setErro('O saldo final precisa ser um número igual ou maior que zero.')
      return
    }

    if (!ajuste) {
      setErro('O saldo final já é exatamente esse. A banca se recusa a trabalhar à toa.')
      return
    }

    const confirmou = window.confirm(
      `Alterar a carteira de ${perfilSelecionado.username}?\n\n` +
        `Saldo atual: ${formatarMoedas(saldoAtual)} T\n` +
        `Ajuste: ${ajuste > 0 ? '+' : ''}${formatarMoedas(ajuste)} T\n` +
        `Saldo final: ${formatarMoedas(alvo)} T\n\n` +
        'A operação ficará registrada no ledger da banca.',
    )

    if (!confirmou) return

    setSalvando(true)

    const { error } = await supabase.rpc('admin_adjust_wallet', {
      p_user_id: perfilSelecionado.id,
      p_amount: ajuste,
      p_note: nota.trim() || 'Ajuste manual autorizado pela banca',
    })

    if (error) {
      setErro(`A Ditadora recusou o ajuste: ${error.message}`)
      setSalvando(false)
      return
    }

    setSucesso(
      `${perfilSelecionado.username} agora possui ${formatarMoedas(alvo)} TaiCoins. O crime contábil fictício foi documentado.`,
    )

    await carregarPerfis(perfilSelecionado.id)
    setSalvando(false)
  }

  return (
    <section className="wallet-admin-page">
      <div className="wallet-admin-hero">
        <div>
          <span>TESOURARIA ALTAMENTE SUSPEITA</span>
          <h2>Controle de carteiras</h2>
          <p>
            Ajustes passam pela função administrativa do Supabase e deixam rastro
            no <strong>wallet_transactions</strong>. Nada de editar balance na mão.
          </p>
        </div>

        <div className="wallet-admin-seal">
          <strong>{perfis.length}</strong>
          <span>contas cadastradas</span>
        </div>
      </div>

      {erro && <div className="wallet-admin-message error">{erro}</div>}
      {sucesso && <div className="wallet-admin-message success">{sucesso}</div>}

      <div className="wallet-admin-layout">
        <div className="wallet-admin-users">
          <div className="wallet-admin-title-row">
            <div>
              <span>CONTAS DA COMUNIDADE</span>
              <h3>Escolha a vítima</h3>
            </div>

            <button type="button" onClick={() => carregarPerfis(usuarioId)} disabled={carregando}>
              {carregando ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          <div className="wallet-admin-user-list">
            {perfis.map((perfil) => {
              const avatar = avatarDoPerfil(perfil.avatar_key)
              const ativo = perfil.id === usuarioId

              return (
                <button
                  type="button"
                  key={perfil.id}
                  className={`wallet-admin-user ${ativo ? 'active' : ''}`}
                  onClick={() => selecionarUsuario(perfil.id)}
                >
                  <img src={avatar.src} alt="" aria-hidden="true" />
                  <span>
                    <strong>{perfil.username}</strong>
                    <small>{perfil.role === 'admin' ? 'ADMIN DA BANCA' : 'CLIENTE DA BANCA'}</small>
                  </span>
                  <b>{formatarMoedas(perfil.balance)} T</b>
                </button>
              )
            })}
          </div>
        </div>

        <form className="wallet-admin-form" onSubmit={aplicarAjuste}>
          <div className="wallet-admin-title-row">
            <div>
              <span>AJUSTE AUDITADO</span>
              <h3>Reescrever patrimônio</h3>
            </div>
          </div>

          {perfilSelecionado ? (
            <>
              <div className="wallet-admin-selected">
                <img
                  src={avatarDoPerfil(perfilSelecionado.avatar_key).src}
                  alt=""
                  aria-hidden="true"
                />
                <div>
                  <span>CARTEIRA SELECIONADA</span>
                  <strong>{perfilSelecionado.username}</strong>
                </div>
                <b>{formatarMoedas(saldoAtual)} T</b>
              </div>

              <label className="wallet-admin-field">
                <span>Saldo final desejado</span>
                <div className="wallet-admin-input-wrap">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={saldoFinal}
                    onChange={(event) => setSaldoFinal(event.target.value)}
                    placeholder="508,70"
                  />
                  <em>T</em>
                </div>
              </label>

              <div className="wallet-admin-preview">
                <article>
                  <span>Saldo atual</span>
                  <strong>{formatarMoedas(saldoAtual)} T</strong>
                </article>
                <article className={ajuste > 0 ? 'positive' : ajuste < 0 ? 'negative' : ''}>
                  <span>Ajuste necessário</span>
                  <strong>
                    {ajuste == null
                      ? '—'
                      : `${ajuste > 0 ? '+' : ''}${formatarMoedas(ajuste)} T`}
                  </strong>
                </article>
                <article>
                  <span>Saldo final</span>
                  <strong>{alvo == null ? '—' : `${formatarMoedas(alvo)} T`}</strong>
                </article>
              </div>

              <label className="wallet-admin-field">
                <span>Motivo registrado no ledger</span>
                <textarea
                  rows="3"
                  value={nota}
                  onChange={(event) => setNota(event.target.value)}
                  placeholder="Ex.: restauração após testes do Taigrinho"
                />
              </label>

              <button
                type="submit"
                className="wallet-admin-submit"
                disabled={salvando || !ajuste || alvo == null || alvo < 0}
              >
                {salvando ? 'Protocolando na banca...' : 'Aplicar ajuste auditado'}
              </button>

              <p className="wallet-admin-footnote">
                Para voltar a Paulin ao estado anterior aos testes, use <strong>508,7</strong> como saldo final.
              </p>


              <div className="wallet-admin-danger-zone">
                <div>
                  <span>ZONA DE PERIGO</span>
                  <h4>Excluir conta da TaihenBet</h4>
                  <p>
                    Remove o login e os dados vinculados a esta conta. A operação é
                    permanente e exige que você digite o nome do usuário para confirmar.
                  </p>
                </div>

                {perfilSelecionado.id === usuarioAtualId ? (
                  <div className="wallet-admin-self-protected">
                    <strong>SUA CONTA ESTÁ PROTEGIDA</strong>
                    <span>Você não pode excluir a sessão administrativa que está usando.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="wallet-admin-delete-account"
                    onClick={excluirConta}
                    disabled={excluindo || salvando}
                  >
                    {excluindo
                      ? 'Apagando vestígios...'
                      : `Excluir conta de ${perfilSelecionado.username}`}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="wallet-admin-empty">Nenhuma conta disponível.</div>
          )}
        </form>
      </div>
    </section>
  )
}
