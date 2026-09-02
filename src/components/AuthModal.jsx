import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import entidadeBanca from '../assets/entidade-banca.png'
import './AuthModal.css'


const PASSWORD_SHAME_RULES = [
  { test: /^(123456|1234567|12345678|123456789)$/i, user: 'NeymarPNG' },
  { test: /^(senha123|senha1234|senha12345)$/i, user: 'TaiMandioca' },
  { test: /^(password|password1|password123)$/i, user: 'SapoDoPix' },
  { test: /^(qwerty|qwerty123)$/i, user: 'AlKhaldiyaFan' },
  { test: /^(111111|000000|654321)$/i, user: 'RoboDaBanca' },
  { test: /^(abcdef|abc123|abcdef123)$/i, user: 'UsuarioPadrao' },
  { test: /^(taihen123|taihenbet|taihenbet123)$/i, user: 'EntidadeDaBanca' },
  { test: /^(neymar|neymar10|neymar123)$/i, user: 'NeymarJuniorPNG' },
  { test: /^(memphis|memphis10|memphis123)$/i, user: 'DepayDaShopee' },
  { test: /^(corinthians|corinthians123|timao123)$/i, user: 'PedroRaul9' },
]

const LINGUICA_USERS = [
  'NeymarPNG',
  'TaiMandioca',
  'SapoDoPix',
  'AlKhaldiyaFan',
  'DepayDaShopee',
  'PedroRaul9',
  'EntidadeDaBanca',
  'RoboDaBanca',
]

function donoAleatorioLinguiça() {
  return LINGUICA_USERS[Math.floor(Math.random() * LINGUICA_USERS.length)]
}

function detectarSenhaVergonhosa(password = '') {
  const senha = String(password).trim()
  if (!senha) return null

  const regra = PASSWORD_SHAME_RULES.find(({ test }) => test.test(senha))
  if (regra) return regra.user

  if (/^(.)\1{5,}$/.test(senha)) return 'RoboDaBanca'
  if (/^(1234|4321|abcd|qwer)/i.test(senha) && senha.length <= 10) return 'EstagiarioDaBanca'

  return null
}

const HUMAN_CHALLENGES = [
  {
    question: 'Qual dessas opções provavelmente é um ser humano?',
    options: ['TaiMandioca', 'Uma pessoa', 'Neymar PNG', 'Al Khaldiya'],
    answer: 'Uma pessoa',
  },
  {
    question: 'Complete a regra fundamental da TaihenBet: “A casa sempre ____.”',
    options: ['devolve seu dinheiro', 'vence', 'toma banho', 'respeita a CVM'],
    answer: 'vence',
  },
  {
    question: 'Quanto é 2 + 2?',
    options: ['358,7 TaiCoins', '5', '4', 'Memphis Depay'],
    answer: '4',
  },
  {
    question: 'Você é um robô?',
    options: ['Sim, modelo T-800', 'Não, só sou irresponsável financeiramente', 'Sou uma API', 'Bip bop'],
    answer: 'Não, só sou irresponsável financeiramente',
  },
  {
    question: 'Qual destes NÃO deve receber sua senha?',
    options: ['Um estranho no Discord', 'Um formulário suspeito', 'A TaiMandioca', 'Nenhum deles'],
    answer: 'Nenhum deles',
  },
  {
    question: 'Escolha a afirmação cientificamente mais segura.',
    options: [
      'TaiCoins pagam boleto',
      'A TaihenBet é um banco central',
      'Dinheiro real não é usado aqui',
      'O sapo controla a inflação',
    ],
    answer: 'Dinheiro real não é usado aqui',
  },
]

function novoDesafio(anterior = -1) {
  if (HUMAN_CHALLENGES.length === 1) return 0

  let next = Math.floor(Math.random() * HUMAN_CHALLENGES.length)
  while (next === anterior) {
    next = Math.floor(Math.random() * HUMAN_CHALLENGES.length)
  }
  return next
}

function traduzirErroAuth(mensagem = '') {
  const erro = String(mensagem).toLowerCase()

  if (erro.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }

  if (erro.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.'
  }

  if (erro.includes('user already registered')) {
    return 'Já existe uma conta com esse e-mail.'
  }

  if (erro.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }

  if (erro.includes('unable to validate email address')) {
    return 'Digite um e-mail válido.'
  }

  if (erro.includes('signup is disabled')) {
    return 'O cadastro está temporariamente desativado no Supabase.'
  }

  return mensagem || 'A Entidade da Banca recusou a operação.'
}

export default function AuthModal({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [linguicaSize, setLinguicaSize] = useState('')
  const [linguicaRejectedValue, setLinguicaRejectedValue] = useState('')
  const [linguicaOwner, setLinguicaOwner] = useState('')
  const [linguicaValidated, setLinguicaValidated] = useState(false)

  const [humanOpen, setHumanOpen] = useState(false)
  const [humanPassed, setHumanPassed] = useState(false)
  const [humanFeedback, setHumanFeedback] = useState('')
  const [challengeIndex, setChallengeIndex] = useState(() => novoDesafio())

  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'
  const isLogin = mode === 'login'
  const challenge = HUMAN_CHALLENGES[challengeIndex]
  const canClose = !isReset || Boolean(success)

  const passwordOwner = useMemo(
    () => ((isRegister || isReset) ? detectarSenhaVergonhosa(password) : null),
    [isRegister, isReset, password],
  )

  const title = useMemo(() => {
    if (isRegister) return 'Criar conta'
    if (isForgot) return 'Pedido de amnésia'
    if (isReset) return 'Escolha uma nova senha vergonhosa'
    return 'Entrar na banca'
  }, [isRegister, isForgot, isReset])

  useEffect(() => {
    setMode(initialMode)
    setError('')
    setSuccess('')
  }, [initialMode])

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function fecharComEsc(event) {
      if (event.key === 'Escape' && canClose) {
        onClose()
      }
    }

    window.addEventListener('keydown', fecharComEsc)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', fecharComEsc)
    }
  }, [onClose, canClose])

  function resetLinguicaAudit() {
    setLinguicaSize('')
    setLinguicaRejectedValue('')
    setLinguicaOwner('')
    setLinguicaValidated(false)
  }

  function auditarLinguica() {
    if (!isRegister) return

    const valor = String(linguicaSize).trim()
    const numero = Number(valor.replace(',', '.'))

    if (!valor || !Number.isFinite(numero) || numero <= 0) {
      setLinguicaValidated(false)
      setLinguicaOwner('')
      return
    }

    if (!linguicaRejectedValue) {
      setLinguicaRejectedValue(valor)
      setLinguicaOwner(donoAleatorioLinguiça())
      setLinguicaValidated(false)
      return
    }

    if (valor === linguicaRejectedValue) {
      setLinguicaValidated(false)
      return
    }

    setLinguicaOwner('')
    setLinguicaValidated(true)
  }

  function resetHumanCheck() {
    setHumanOpen(false)
    setHumanPassed(false)
    setHumanFeedback('')
    setChallengeIndex((current) => novoDesafio(current))
  }

  function trocarModo(novoModo) {
    setMode(novoModo)
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    resetHumanCheck()
    resetLinguicaAudit()
  }

  function abrirHumanCheck() {
    if (humanPassed) return
    setHumanOpen(true)
    setHumanFeedback('')
  }

  function responderHumanCheck(opcao) {
    if (opcao === challenge.answer) {
      setHumanPassed(true)
      setHumanFeedback('HUMANIDADE APROVADA — inteligência suficiente para perder TaiCoins.')
      return
    }

    setHumanPassed(false)
    setHumanFeedback('COMPORTAMENTO SUSPEITO — possível robô, bot ou torcedor do Al Khaldiya.')

    window.setTimeout(() => {
      setChallengeIndex((current) => novoDesafio(current))
      setHumanFeedback('Tente novamente. A auditoria da mandioca continua.')
    }, 650)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const emailLimpo = email.trim()
    const usernameLimpo = username.trim()

    if (isForgot) {
      if (!emailLimpo) {
        setError('Digite o e-mail da conta que perdeu a memória.')
        return
      }

      setLoading(true)
      try {
        const redirectTo = `${window.location.origin}${window.location.pathname || '/'}`
        const { error: authError } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
          redirectTo,
        })

        if (authError) throw authError

        setSuccess(
          'Se esse e-mail estiver cadastrado, a banca enviará um link de recuperação. Confira também o spam — a reputação financeira da casa é questionável.',
        )
      } catch (authError) {
        setError(traduzirErroAuth(authError?.message))
      } finally {
        setLoading(false)
      }
      return
    }

    if (isReset) {
      if (!password) {
        setError('Digite sua nova senha.')
        return
      }

      if (password.length < 6) {
        setError('A senha precisa ter pelo menos 6 caracteres.')
        return
      }

      if (passwordOwner) {
        setError(`O usuário ${passwordOwner} já possui esta senha. Invente uma nova tragédia criptográfica.`)
        return
      }

      if (password !== confirmPassword) {
        setError('As duas senhas não combinam. Nem a banca consegue contabilizar isso.')
        return
      }

      setLoading(true)
      try {
        const { error: authError } = await supabase.auth.updateUser({
          password,
        })

        if (authError) throw authError

        setSuccess('Senha alterada. A banca concordou em fingir que você nunca esqueceu.')
      } catch (authError) {
        const mensagem = String(authError?.message || '')
        if (mensagem.toLowerCase().includes('same password')) {
          setError('A nova senha precisa ser diferente da antiga. Isso não é uma recuperação, é um replay.')
        } else if (mensagem.toLowerCase().includes('session')) {
          setError('O link de recuperação expirou ou a sessão não existe mais. Peça um novo e-mail.')
        } else {
          setError(traduzirErroAuth(mensagem))
        }
      } finally {
        setLoading(false)
      }
      return
    }

    if (!emailLimpo || !password) {
      setError('Preencha e-mail e senha.')
      return
    }

    if (isRegister && usernameLimpo.length < 2) {
      setError('Escolha um nome com pelo menos 2 caracteres.')
      return
    }

    if (isRegister && !String(linguicaSize).trim()) {
      setError('A banca exige uma resposta para a pergunta da linguiça. Ninguém sabe por quê.')
      return
    }

    if (isRegister && !linguicaValidated) {
      auditarLinguica()
      setError('Resolva a auditoria completamente necessária da linguiça antes de criar a conta.')
      return
    }

    if (isRegister && passwordOwner) {
      setError(`O usuário ${passwordOwner} já possui esta senha. Escolha uma senha menos previsível.`)
      return
    }

    if (isRegister && !humanPassed) {
      setError('A auditoria exige confirmação de que você não é uma mandioca.')
      return
    }

    setLoading(true)

    try {
      if (isRegister) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: emailLimpo,
          password,
          options: {
            data: {
              username: usernameLimpo,
            },
          },
        })

        if (authError) {
          throw authError
        }

        if (data.session) {
          onClose()
          return
        }

        setSuccess(
          'Conta criada. Confira seu e-mail para confirmar o cadastro e liberar a entrada na banca.',
        )
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password,
      })

      if (authError) {
        throw authError
      }

      onClose()
    } catch (authError) {
      setError(traduzirErroAuth(authError?.message))
    } finally {
      setLoading(false)
    }
  }

  const description = isRegister
    ? 'Crie sua identidade para salvar TaiCoins, apostas e conquistas.'
    : isForgot
      ? 'Informe o e-mail da conta e a banca enviará um procedimento oficial de recuperação de memória.'
      : isReset
        ? 'O link foi aceito. Agora escolha uma nova senha antes que a banca mude de ideia.'
        : 'Entre para continuar sua carreira financeira fictícia.'

  const oracleBadge = isForgot || isReset ? 'DEPARTAMENTO DE AMNÉSIA' : 'ACESSO À BANCA'
  const oracleText = isForgot
    ? 'Perder TaiCoins é aceitável. Perder a senha exige papelada.'
    : isReset
      ? 'A banca autorizou uma única cirurgia de credencial.'
      : 'Seu histórico de decisões ruins começa aqui.'

  return (
    <div
      className="auth-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && canClose) {
          onClose()
        }
      }}
    >
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {canClose && (
          <button
            type="button"
            className="auth-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        )}

        <div className="auth-modal-oracle">
          <div className="auth-modal-oracle-glow" />
          <img src={entidadeBanca} alt="Entidade da Banca" />
          <span>{oracleBadge}</span>
          <strong>{oracleText}</strong>
        </div>

        <div className="auth-modal-content">
          <div className="auth-modal-kicker">
            {isForgot || isReset ? 'TAIHENBET · RECUPERAÇÃO' : 'TAIHENBET ONLINE'}
          </div>
          <h2 id="auth-modal-title">{title}</h2>
          <p>{description}</p>

          {!isForgot && !isReset && (
            <div className="auth-mode-switch" role="tablist">
              <button
                type="button"
                className={!isRegister ? 'active' : ''}
                onClick={() => trocarModo('login')}
              >
                Entrar
              </button>
              <button
                type="button"
                className={isRegister ? 'active' : ''}
                onClick={() => trocarModo('register')}
              >
                Criar conta
              </button>
            </div>
          )}

          {isForgot && (
            <div className="recovery-notice">
              <b>🔐 A banca recebeu um pedido de amnésia.</b>
              <span>O link enviado por e-mail só serve para redefinir a sua própria senha.</span>
            </div>
          )}

          {isReset && (
            <div className="recovery-notice recovery-notice-gold">
              <b>🔑 Autorização temporária concedida.</b>
              <span>Defina a nova senha nesta tela. Não compartilhe o link de recuperação com ninguém.</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                <span>Nome na TaihenBet</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Ex.: Paulotário"
                  autoComplete="nickname"
                  maxLength={24}
                />
              </label>
            )}

            {isRegister && (
              <label>
                <span>Qual o tamanho da sua linguiça?</span>
                <div className="linguica-input-wrap">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.1"
                    max="999"
                    step="0.1"
                    value={linguicaSize}
                    onChange={(event) => {
                      const novoValor = event.target.value
                      setLinguicaSize(novoValor)
                      setLinguicaOwner('')
                      setError('')

                      const numero = Number(String(novoValor).replace(',', '.'))
                      const mudouDoPrimeiro = Boolean(linguicaRejectedValue) && novoValor !== linguicaRejectedValue
                      setLinguicaValidated(mudouDoPrimeiro && Number.isFinite(numero) && numero > 0)
                    }}
                    onBlur={auditarLinguica}
                    placeholder="Ex.: 18"
                    aria-describedby="linguica-privacy-note"
                  />
                  <b>cm</b>
                </div>

                {linguicaOwner && String(linguicaSize).trim() === linguicaRejectedValue && (
                  <div className="linguica-shame" role="alert">
                    <strong>🌭 O usuário <code>{linguicaOwner}</code> já possui esse tamanho de linguiça.</strong>
                    <span>Escolha outro tamanho. A banca não aceita linguiças duplicadas.</span>
                  </div>
                )}

                {linguicaValidated && (
                  <div className="linguica-ok">
                    ✓ Tamanho disponível. Informação completamente inútil aprovada pela banca.
                  </div>
                )}

                <small id="linguica-privacy-note" className="linguica-privacy">
                  Esse valor não é salvo, enviado ao Supabase nem associado à sua conta. Sim, a pergunta é inútil.
                </small>
              </label>
            )}

            {!isReset && (
              <label>
                <span>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  autoComplete="email"
                />
              </label>
            )}

            {!isForgot && (
              <label>
                <span>{isReset ? 'Nova senha' : 'Senha'}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  placeholder={isReset ? 'Digite a nova vergonha criptográfica' : 'Mínimo de 6 caracteres'}
                  autoComplete={isRegister || isReset ? 'new-password' : 'current-password'}
                  minLength={6}
                />
                {(isRegister || isReset) && passwordOwner && (
                  <div className="password-shame" role="alert">
                    <strong>⚠️ O usuário <code>{passwordOwner}</code> já possui esta senha.</strong>
                    <span>Tente inventar algo que não esteja no kit inicial da humanidade.</span>
                    <small>Detector local de senha fraca — nenhuma senha de outro usuário é consultada.</small>
                  </div>
                )}
              </label>
            )}

            {isReset && (
              <label>
                <span>Repita a nova senha</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setError('')
                  }}
                  placeholder="Pra provar que você lembra dela por 8 segundos"
                  autoComplete="new-password"
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <small className="password-mismatch">As senhas ainda não são iguais.</small>
                )}
              </label>
            )}

            {isRegister && (
              <div className={`human-check ${humanPassed ? 'passed' : ''}`}>
                <button
                  type="button"
                  className="human-check-row"
                  onClick={abrirHumanCheck}
                  aria-expanded={humanOpen}
                >
                  <span className="human-check-box" aria-hidden="true">
                    {humanPassed ? '✓' : ''}
                  </span>
                  <span className="human-check-copy">
                    <strong>{humanPassed ? 'Humanidade aprovada' : 'Não sou uma mandioca'}</strong>
                    <small>
                      {humanPassed
                        ? 'A banca infelizmente reconhece sua existência.'
                        : 'Clique para iniciar a auditoria de humanidade.'}
                    </small>
                  </span>
                  <span className="human-check-brand">
                    <b>🔔</b>
                    <small>TAIHEN™</small>
                  </span>
                </button>

                {humanOpen && !humanPassed && (
                  <div className="human-challenge">
                    <div className="human-challenge-head">
                      <span>VERIFICAÇÃO DE HUMANIDADE DUVIDOSA</span>
                      <button
                        type="button"
                        onClick={() => {
                          setChallengeIndex((current) => novoDesafio(current))
                          setHumanFeedback('')
                        }}
                      >
                        outro teste ↻
                      </button>
                    </div>
                    <strong>{challenge.question}</strong>
                    <div className="human-options">
                      {challenge.options.map((option) => (
                        <button
                          type="button"
                          key={option}
                          onClick={() => responderHumanCheck(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <small>Protegido por tecnologia questionável e uma mandioca auditora.</small>
                  </div>
                )}

                {humanFeedback && (
                  <div className={`human-feedback ${humanPassed ? 'success' : 'error'}`}>
                    {humanFeedback}
                  </div>
                )}
              </div>
            )}

            {isLogin && (
              <button
                type="button"
                className="auth-forgot"
                onClick={() => trocarModo('forgot')}
              >
                Esqueceu sua senha? <span>A banca pode fingir que isso nunca aconteceu.</span>
              </button>
            )}

            {error && <div className="auth-feedback error">{error}</div>}
            {success && <div className="auth-feedback success">{success}</div>}

            {!isReset || !success ? (
              <button
                type="submit"
                className="auth-submit"
                disabled={
                  loading ||
                  Boolean(success) ||
                  (isRegister && (!humanPassed || !linguicaValidated || Boolean(passwordOwner))) ||
                  (isReset && (Boolean(passwordOwner) || !password || password !== confirmPassword))
                }
              >
                {loading
                  ? 'Consultando a Entidade...'
                  : isForgot
                    ? 'Enviar procedimento de amnésia'
                    : isReset
                      ? passwordOwner
                        ? 'Essa senha já tem dono 😭'
                        : 'Registrar nova senha'
                      : isRegister
                        ? passwordOwner
                          ? 'Essa senha já tem dono 😭'
                          : !linguicaValidated
                            ? 'Resolva a questão da linguiça 🌭'
                            : humanPassed
                              ? 'Criar minha conta'
                              : 'Prove que não é uma mandioca'
                        : 'Entrar na TaihenBet'}
              </button>
            ) : (
              <button
                type="button"
                className="auth-submit"
                onClick={onClose}
              >
                Voltar para a TaihenBet
              </button>
            )}

            {isForgot && (
              <button
                type="button"
                className="auth-back-login"
                onClick={() => trocarModo('login')}
              >
                ← Lembrei milagrosamente da senha
              </button>
            )}
          </form>

          <small className="auth-legal">
            A TaihenBet usa apenas moeda fictícia. Nenhum dinheiro real é apostado aqui.
          </small>
        </div>
      </section>
    </div>
  )
}
