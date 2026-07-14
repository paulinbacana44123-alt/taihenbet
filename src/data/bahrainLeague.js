import muharraqLogo from '../assets/muharraq.png'
import alKhaldiyaLogo from '../assets/al-khaldiya.png'
import riffaLogo from '../assets/riffa.png'
import aaliLogo from '../assets/aali.png'
import malkiyaLogo from '../assets/malkiya.png'
import hiddLogo from '../assets/hidd.png'
import alAhliLogo from '../assets/al-ahli.png'
import sitraLogo from '../assets/sitra.png'

export const timesBahrein = [
  {
    id: 'muharraq',
    nome: 'Muharraq',
    abreviacao: 'MUH',
    logo: muharraqLogo,
    forca: 88,
  },
  {
    id: 'al-khaldiya',
    nome: 'Al Khaldiya',
    abreviacao: 'KHA',
    logo: alKhaldiyaLogo,
    forca: 85,
  },
  {
    id: 'riffa',
    nome: 'Riffa',
    abreviacao: 'RIF',
    logo: riffaLogo,
    forca: 82,
  },
  {
    id: 'aali',
    nome: "A'ali",
    abreviacao: 'AAL',
    logo: aaliLogo,
    forca: 68,
  },
  {
    id: 'malkiya',
    nome: 'Malkiya',
    abreviacao: 'MAL',
    logo: malkiyaLogo,
    forca: 72,
  },
  {
    id: 'hidd',
    nome: 'Hidd',
    abreviacao: 'HID',
    logo: hiddLogo,
    forca: 71,
  },
  {
    id: 'al-ahli',
    nome: 'Al Ahli',
    abreviacao: 'AHL',
    logo: alAhliLogo,
    forca: 78,
  },
  {
    id: 'sitra',
    nome: 'Sitra',
    abreviacao: 'SIT',
    logo: sitraLogo,
    forca: 75,
  },
]

export const timesBahreinPorId = Object.fromEntries(
  timesBahrein.map((time) => [time.id, time]),
)

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor))
}

function calcularOdds(mandante, visitante, indicePartida) {
  const diferenca = mandante.forca - visitante.forca
  const variacao = ((indicePartida * 7) % 5) * 0.008

  const probabilidadeEmpate = limitar(
    0.27 - Math.abs(diferenca) * 0.002,
    0.19,
    0.29,
  )

  const restante = 1 - probabilidadeEmpate

  const probabilidadeMandante = limitar(
    restante / 2 + diferenca * 0.006 + 0.055 + variacao,
    0.22,
    0.68,
  )

  const probabilidadeVisitante = limitar(
    1 - probabilidadeEmpate - probabilidadeMandante,
    0.14,
    0.58,
  )

  const margem = 0.91

  return {
    mandante: Number(
      Math.max(1.12, margem / probabilidadeMandante).toFixed(2),
    ),
    empate: Number(
      Math.max(2.35, margem / probabilidadeEmpate).toFixed(2),
    ),
    visitante: Number(
      Math.max(1.12, margem / probabilidadeVisitante).toFixed(2),
    ),
  }
}

export function gerarCalendarioBahrein() {
  const ids = timesBahrein.map((time) => time.id)
  const fixo = ids[0]
  let rotacao = ids.slice(1)
  const rodadas = []

  for (let rodada = 0; rodada < ids.length - 1; rodada += 1) {
    const ordem = [fixo, ...rotacao]
    const partidas = []

    for (let indice = 0; indice < ids.length / 2; indice += 1) {
      let mandanteId = ordem[indice]
      let visitanteId = ordem[ordem.length - 1 - indice]

      if ((rodada + indice) % 2 === 1) {
        ;[mandanteId, visitanteId] = [
          visitanteId,
          mandanteId,
        ]
      }

      partidas.push({
        mandanteId,
        visitanteId,
      })
    }

    rodadas.push(partidas)

    rotacao = [
      rotacao.at(-1),
      ...rotacao.slice(0, -1),
    ]
  }

  return rodadas
}

export const calendarioBahrein = gerarCalendarioBahrein()

export function gerarRodadaBahrein(numeroRodada = 1) {
  const rodadaNormalizada = limitar(
    Math.floor(Number(numeroRodada) || 1),
    1,
    calendarioBahrein.length,
  )

  const horarios = [
    '18:00',
    '19:15',
    '20:30',
    '21:45',
  ]

  return calendarioBahrein[rodadaNormalizada - 1].map(
    (partida, indice) => {
      const mandante = timesBahreinPorId[partida.mandanteId]
      const visitante = timesBahreinPorId[partida.visitanteId]
      const id = `bahrein-r${rodadaNormalizada}-j${indice + 1}`
      const odds = calcularOdds(
        mandante,
        visitante,
        rodadaNormalizada * 10 + indice,
      )

      return {
        id,
        tipo: 'futebol-bahrein',
        liga: 'Liga do Bahrein',
        rodada: rodadaNormalizada,
        horario: horarios[indice],
        categoria: `LIGA DO BAHREIN · RODADA ${rodadaNormalizada}`,
        titulo: `${mandante.nome} x ${visitante.nome}`,
        mandanteId: mandante.id,
        visitanteId: visitante.id,
        status: 'aberto',
        opcoes: [
          {
            id: `${id}-mandante`,
            nome: mandante.nome,
            tipoResultado: 'mandante',
            odd: odds.mandante,
          },
          {
            id: `${id}-empate`,
            nome: 'Empate',
            tipoResultado: 'empate',
            odd: odds.empate,
          },
          {
            id: `${id}-visitante`,
            nome: visitante.nome,
            tipoResultado: 'visitante',
            odd: odds.visitante,
          },
        ],
      }
    },
  )
}
