import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import entidadeBanca from '../assets/entidade-banca.png'
import './LegacyBalanceModal.css'

export default function LegacyBalanceModal({ onResolved }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflowAnterior
    }
  }, [])

  async function ativarCarteira() {
    if (loading) return

    setLoading(true)
    setError('')

    // A Fase 3.9 encerrou a importação de valores escolhidos pelo navegador.
    // A RPC preserva a assinatura antiga por compatibilidade, mas confirma
    // somente o saldo que já existe no banco para esta conta.
    const { data, error: rpcError } = await supabase.rpc(
      'resolve_legacy_balance',
      {
        p_import_local: false,
        p_local_balance: null,
      },
    )

    setLoading(false)

    if (rpcError) {
      setError(
        rpcError.message ||
          'A banca não conseguiu ativar a carteira online.',
      )
      return
    }

    onResolved?.(Array.isArray(data) ? data[0] : data)
  }

  return (
    <div className="legacy-balance-backdrop">
      <section
        className="legacy-balance-modal"
        role="dialog"
        aria-modal="true"
      >
        <img src={entidadeBanca} alt="Entidade da Banca" />
        <div className="legacy-kicker">CARTEIRA ONLINE DA BANCA</div>
        <h2>A contabilidade antiga foi oficialmente aposentada.</h2>
        <p>
          A TaihenBet não aceita mais números vindos do armazenamento local como
          patrimônio real da conta. Sua carteira passa a usar somente o saldo
          registrado no servidor.
        </p>

        <div className="legacy-balance-number">
          <span>Saldo inicial oficial</span>
          <strong>1.000 T</strong>
        </div>

        {error && <div className="legacy-error">{error}</div>}

        <div className="legacy-actions">
          <button
            type="button"
            className="import"
            onClick={ativarCarteira}
            disabled={loading}
          >
            {loading ? 'Carimbando documentos...' : 'Ativar minha carteira'}
          </button>
        </div>

        <small>
          O navegador pode lembrar preferências. TaiCoins, agora, só existem na
          contabilidade do servidor.
        </small>
      </section>
    </div>
  )
}
