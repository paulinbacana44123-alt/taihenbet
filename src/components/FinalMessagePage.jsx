import './FinalMessagePage.css'
import entidadeBanca from '../assets/entidade-banca.png'
import neytaiAssistente from '../assets/neytai-assistente.png'

function FinalMessagePage({
  onVoltarInicio,
}) {
  function relerMensagem() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <section
      className="final-message-page"
      data-neytai-target="final-message-page"
    >
      <div className="final-message-background">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <header className="final-message-hero">
        <div className="final-message-portrait">
          <img
            src={entidadeBanca}
            alt="Imagem usada no projeto TaihenBet"
          />

          <span>ÚLTIMA CATEGORIA DO SITE</span>
        </div>

        <div className="final-message-heading">
          <span className="final-message-eyebrow">
            UMA MENSAGEM UM POUCO MAIS SÉRIA
          </span>

          <h1>
            Texto no qual eu fiquei com preguiça de pensar no
            título
          </h1>

          <p>
            Depois de futebol do Bahrein, mandiocas conscientes,
            ditaduras econômicas e um museu inteiro de provas,
            finalmente chegamos à parte em que o programador
            tenta falar normalmente.
          </p>
        </div>
      </header>

      <article className="final-letter">
        <div className="final-letter-top">
          <div>
            <span>CARTA Nº 001</span>
            <strong>Para a Tai</strong>
          </div>

          <div className="final-letter-stamp">
            <img src={neytaiAssistente} alt="" />
            <span>ENTREGUE PELO NEYTAI</span>
          </div>
        </div>

        <div className="final-letter-body">
          <p>
            Olá Tai, ou Tay, até agora eu não sei se é com i ou
            com y, enfim, depois de todo derretimento mental que
            foi explorar esse site, eu quis escrever um mini
            texto pra tu, um pouco mais sincero dessa vez.
          </p>

          <p>
            Primeiramente, obrigado se você chegou até aqui,
            foram alguns dias trabalhando nisso, então só de ter
            chegado em ti eu já fico feliz, espero que você tenha
            rido com pelo menos alguma coisa desse site, eu não
            sou a pessoa mais engraçada do mundo, mas espero que
            tu tenha se divertido de alguma forma.
          </p>

          <p>
            O projeto no inicio não era pra ter essa mensagem,
            era pra ser mais uma parada só pra rir mesmo, mas eu
            achei conveniente botar algo aqui, pq sla man,
            resenha.
          </p>

          <p>
            Eu te admiro muito como criadora de conteúdo, mesmo
            te conhecendo a pouco tempo, da pra ver que você
            sempre tenta ser gentil com todo mundo nas lives e no
            server, mesmo que eu ache que às vezes as pessoas
            passam do ponto contigo.
          </p>

          <p>
            Eu não conversei muito com tu, também nunca tento
            puxar muito papo porque eu não quero parecer um
            entrosa e consequentemente incomodar, mas no pouco
            que a gente trocou conversa no server ou até na live,
            eu te achei uma pessoa muito daora.
          </p>

          <p>
            Eu espero que você esteja bem quando estiver lendo
            isso, mas se você não estiver bem, seja lá o motivo,
            eu quero dizer que você é uma pessoa forte Tai, e eu
            acredito em você, todos acreditam.
          </p>

          <p>
            Eu não sou um coach motivacional da vida, mas eu
            quero ao menos que você possa ver que você é uma
            pessoa muito boa e muito forte, essa é a forma que eu
            tenho de te apoiar como um fã, pelo menos eu acho.
          </p>

          <p>
            Enfim, agradeço se leu aqui.
          </p>
        </div>

        <div className="final-letter-signature">
          <span>Abraços,</span>
          <strong>
            Paulotário
          </strong>
          <small>
            (Eu preciso mudar esse nick, meu Deus)
          </small>
        </div>

        <div className="final-letter-footer">
          <span>
            Feito com alguns dias de trabalho, muitas piadas e
            zero reais apostados.
          </span>

          <div>
            <button
              type="button"
              onClick={relerMensagem}
            >
              Reler do início
            </button>

            <button
              type="button"
              onClick={onVoltarInicio}
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </article>

      <footer className="final-message-note">
        <div className="final-message-heart">
          ♥
        </div>

        <div>
          <strong>
            Obrigado por chegar até o fim da TaihenBet.
          </strong>

          <p>
            O resto do site é uma grande piada. Esta página não
            é.
          </p>
        </div>
      </footer>
    </section>
  )
}

export default FinalMessagePage
