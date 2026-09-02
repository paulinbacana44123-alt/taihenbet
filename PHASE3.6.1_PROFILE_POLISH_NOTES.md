# TaihenBet 2.0 — Fase 3.6.1: Profile Polish

Hotfix visual para aplicar **por cima da Fase 3.6**.

## O que mudou

- O modal de **Meu Perfil** agora respeita a altura real da janela (`100dvh`).
- Em desktop, a coluna de identidade e o editor têm rolagem interna independente, evitando título/botões cortados em telas de 768p ou menores.
- Em telas baixas, avatar e espaçamentos ficam automaticamente mais compactos.
- Em mobile, o modal volta para uma única rolagem contínua.
- O e-mail deixou de ficar exposto na coluna principal do perfil.
- O UUID deixou de ocupar espaço no visual normal.
- Agora existe um cartão **Identidade vinculada / E-mail confirmado pela banca**.
- E-mail e UUID continuam acessíveis em **Ver dados técnicos da conta**, recolhido por padrão.
- Nenhuma alteração de banco de dados, RLS, carteira, ranking ou histórico.

## Como aplicar

Copie a pasta `src` deste patch por cima da pasta `src` do projeto e permita substituir os arquivos existentes.

Não é necessário rodar SQL nem instalar pacote novo.

Se o Vite estiver aberto, normalmente ele atualiza sozinho. Se preferir, reinicie com:

```bash
npm run dev
```

## Teste rápido

1. Entre na conta.
2. Abra **Meu Perfil**.
3. Confirme que o topo `Meu perfil` aparece inteiro.
4. Role apenas a parte direita e confirme que o modal continua dentro da tela.
5. Abra **Ver dados técnicos da conta** para conferir e-mail/ID.
6. Teste salvar username/avatar normalmente.
