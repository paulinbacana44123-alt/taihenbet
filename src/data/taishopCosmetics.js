export const CATEGORIAS_TAISHOP = {
  avatar_frame: {
    nome: 'Molduras',
    descricao: 'Aros para provar que o avatar também pode ter patrimônio.',
  },
  name_color: {
    nome: 'Cores de nome',
    descricao: 'Tinta digital totalmente desnecessária e, portanto, essencial.',
  },
  profile_effect: {
    nome: 'Efeitos de perfil',
    descricao: 'Camadas visuais para transformar a ficha pública em um incidente gráfico.',
  },
  badge: {
    nome: 'Badges',
    descricao: 'Selos oficiais emitidos por uma instituição sem qualquer autoridade.',
  },
}

export const COSMETICOS_TAISHOP = {
  frame_oracle: {
    nome: 'Moldura do Oráculo',
    categoria: 'avatar_frame',
    simbolo: '◉',
  },
  frame_bankrupt: {
    nome: 'Aro da Falência',
    categoria: 'avatar_frame',
    simbolo: '0T',
  },
  frame_mambo: {
    nome: 'Circuito Mambo',
    categoria: 'avatar_frame',
    simbolo: 'M',
  },
  name_oracle: {
    nome: 'Tinta do Oráculo',
    categoria: 'name_color',
    simbolo: 'Aa',
  },
  name_gold: {
    nome: 'Ouro da Banca',
    categoria: 'name_color',
    simbolo: 'T',
  },
  name_profit: {
    nome: 'Lucro Suspeito',
    categoria: 'name_color',
    simbolo: '+T',
  },
  effect_crt: {
    nome: 'CRT Corporativo',
    categoria: 'profile_effect',
    simbolo: '▦',
  },
  effect_bankrupt: {
    nome: 'Aura da Falência',
    categoria: 'profile_effect',
    simbolo: '−T',
  },
  effect_neon: {
    nome: 'Protocolo Neon',
    categoria: 'profile_effect',
    simbolo: '◇',
  },
  badge_rat: {
    nome: 'Rato Certificado',
    categoria: 'badge',
    simbolo: 'R',
    rotulo: 'RATO CERTIFICADO',
  },
  badge_ruin: {
    nome: 'Cliente da Ruína',
    categoria: 'badge',
    simbolo: '25',
    rotulo: 'CLIENTE DA RUÍNA',
  },
  badge_bank_asset: {
    nome: 'Patrimônio da Banca',
    categoria: 'badge',
    simbolo: 'T$',
    rotulo: 'PATRIMÔNIO DA BANCA',
  },
  badge_weekly_auditor: {
    nome: 'Auditor da Semana',
    categoria: 'badge',
    simbolo: '✓',
    rotulo: 'AUDITOR DA SEMANA',
  },
  badge_season_mandioca: {
    nome: 'Sobrevivente da Safra',
    categoria: 'badge',
    simbolo: '🌱',
    rotulo: 'SOBREVIVENTE DA SAFRA',
  },
}

export function classeCosmetico(chave) {
  return chave ? `cosmetic-${String(chave).replaceAll('_', '-')}` : ''
}

export function nomeCosmetico(chave, fallback = 'Padrão da banca') {
  return COSMETICOS_TAISHOP[chave]?.nome || fallback
}

export function rotuloBadge(chave) {
  return COSMETICOS_TAISHOP[chave]?.rotulo || nomeCosmetico(chave, '')
}
