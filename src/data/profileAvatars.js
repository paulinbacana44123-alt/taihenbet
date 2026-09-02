import taihen from '../assets/taihen-modelo-2026.png'
import mandioca from '../assets/taihen-mandioca.png'
import ditadora from '../assets/taihen-ditadora.png'
import entidade from '../assets/entidade-banca.png'

export const PROFILE_AVATARS = [
  {
    key: 'taihen',
    label: 'Taihen 2026',
    src: taihen,
  },
  {
    key: 'mandioca',
    label: 'TaiMandioca',
    src: mandioca,
  },
  {
    key: 'ditadora',
    label: 'Ditadora Suprema',
    src: ditadora,
  },
  {
    key: 'entidade',
    label: 'Entidade da Banca',
    src: entidade,
  },
]

export function avatarDoPerfil(key) {
  return (
    PROFILE_AVATARS.find((avatar) => avatar.key === key) ||
    PROFILE_AVATARS[0]
  )
}
