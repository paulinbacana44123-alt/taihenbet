# Fase 3.18a — Header Layout Hotfix

Hotfix visual e isolado para a regressão de navegação observada após a entrada da TaiShop.

## Alteração

`HeaderLayoutHotfix.css` é importado **depois** do tema principal para atuar apenas como camada de override. Em desktop ele:

- força `header`, `navigation` e `header-account-zone` a permanecerem sem quebra de linha;
- permite que a navegação utilize o espaço flexível central;
- reduz gaps e paddings progressivamente entre 1181px e 1460px;
- mantém labels em `white-space: nowrap`;
- não interfere nas regras responsivas antigas abaixo de 1181px.

## Não alterado

- Supabase;
- saldo/carteira;
- TaiShop;
- inventário;
- equipamentos cosméticos;
- Central de Notificações;
- perfis públicos;
- rotas e lógica de navegação.
