# Fase 3.20a — Hotfix do avatar do ranking sazonal

## Correção

`avatarDoPerfil()` retorna o objeto de configuração do avatar. O ranking sazonal estava entregando esse objeto inteiro ao atributo `src` da imagem.

A renderização agora usa:

```jsx
avatarDoPerfil(user.avatar_key)?.src
```

Isso alinha a aba Evento ao comportamento já corrigido em Perfis Públicos/TaiShop.

## Escopo

- sem alteração no Supabase;
- sem alteração em pontos de temporada;
- sem alteração em missões;
- sem alteração em recompensas;
- sem alteração nas datas da temporada;
- sem alteração no perfil público.
