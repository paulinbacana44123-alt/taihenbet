# Fase 3.18 — TaiShop

A loja adiciona uma economia cosmética sem alterar odds ou resultados dos jogos.

## Segurança / saldo

O navegador nunca recebe permissão para atualizar `profiles.balance` diretamente.
`buy_taishop_cosmetic()` chama a função interna endurecida `_wallet_apply()` e usa
uma operação `admin_adjustment` com metadata `source = taishop`. Isso preserva a
allowlist da carteira da Fase 3.9 e mantém o débito no ledger sem reabrir uma RPC
genérica de gasto para o cliente.

## Persistência

- catálogo: `cosmetic_catalog`;
- inventário: `user_cosmetics`;
- slots equipados: colunas `equipped_*` em `profiles`;
- aparência pública: `get_public_profile()` retorna apenas os IDs equipados.

## Slots

Cada conta pode exibir simultaneamente:
- 1 moldura de avatar;
- 1 cor de nome;
- 1 efeito de perfil;
- 1 badge.

Comprar não equipa automaticamente. Desequipar não remove o item do inventário.
