import './CreatorMessagePage.css'
import entidadeBanca from '../assets/entidade-banca.png'
import { useSiteTexts } from '../hooks/useEditableContent'

const FALLBACK = {
  eyebrow: 'PÓS-CRÉDITOS · MENSAGEM DO CRIADOR',
  title: 'Antes de você ir embora, faltava uma coisa.',
  intro:
    'Se você chegou até aqui, esta parte não é da banca, do Neytai nem de um personagem. É só uma mensagem minha para quem acabou entrando nessa maluquice.',
  body:
    'A TaihenBet começou como uma piada e, em algum momento, recebeu uma quantidade completamente desnecessária de sistemas, telas, detalhes e horas de trabalho. Se você explorou o site, riu de alguma coisa, achou alguma referência idiota ou simplesmente ficou curioso para ver até onde isso ia, então já valeu a pena.\n\nObrigado por dedicar um pouco do seu tempo a algo que eu fiz principalmente porque achei engraçado fazer. Não precisa conhecer toda a história por trás do site para estar incluído nessa mensagem.',
  taiLabel: 'E UMA LINHA ESPECIAL PRA TAIHEN',
  taiLine:
    'Tai, se você estiver lendo isso: obviamente essa bagunça inteira não existiria sem você ter virado inspiração para uma quantidade preocupante de piadas internas. Obrigado por, mesmo sem querer, ter dado assunto suficiente para esse projeto existir.',
  signature: '— Paulo',
}

function paragrafos(texto) {
  return String(texto || '')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function CreatorMessagePage({
  onVoltarInicio,
  onVoltarParaTai,
}) {
  const texts = useSiteTexts()

  const eyebrow =
    texts['creator_message.eyebrow'] || FALLBACK.eyebrow
  const title = texts['creator_message.title'] || FALLBACK.title
  const intro = texts['creator_message.intro'] || FALLBACK.intro
  const body = texts['creator_message.body'] || FALLBACK.body
  const taiLabel =
    texts['creator_message.tai_label'] || FALLBACK.taiLabel
  const taiLine =
    texts['creator_message.tai_line'] || FALLBACK.taiLine
  const signature =
    texts['creator_message.signature'] || FALLBACK.signature

  return (
    <section
      className="creator-message-page"
      data-neytai-target="creator-message-page"
    >
      <div className="creator-message-ambient" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <header className="creator-message-hero">
        <div className="creator-message-seal">
          <img src={entidadeBanca} alt="" aria-hidden="true" />
          <span>FORA DO EXPEDIENTE DA BANCA</span>
        </div>

        <div className="creator-message-heading">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </header>

      <div className="creator-message-paper">
        <div className="creator-message-paper-top">
          <span>RECADO ABERTO</span>
          <small>para qualquer pessoa que chegou até aqui</small>
        </div>

        <div className="creator-message-copy">
          {paragrafos(body).map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
          ))}
        </div>

        <aside className="creator-message-tai">
          <span>{taiLabel}</span>
          <p>{taiLine}</p>
        </aside>

        <footer className="creator-message-signature">
          <span>ASSINADO PELO RESPONSÁVEL PELO PROBLEMA</span>
          <strong>{signature}</strong>
        </footer>
      </div>

      <div className="creator-message-actions">
        <button type="button" className="secondary" onClick={onVoltarParaTai}>
          Voltar para a Tai
        </button>
        <button type="button" onClick={onVoltarInicio}>
          Voltar para o início
        </button>
      </div>
    </section>
  )
}
