# TaihenBet 2.0 — Fase 3.4.1

Hotfix do controle de acesso ao Painel.

## Mudança
- Remove o bypass `import.meta.env.DEV` do acesso administrativo.
- Agora, inclusive no localhost, somente perfis com `role = 'admin'` veem e acessam o Painel.
- O bloco de ferramentas visuais de desenvolvimento continua condicionado a `import.meta.env.DEV`, mas só pode ser alcançado depois que a conta passa pelo guard de admin.

## Teste esperado
1. Entre com uma conta `role = 'user'`: a aba Painel não deve aparecer.
2. Entre com a conta `role = 'admin'`: a aba Painel deve aparecer normalmente.

## Segurança
Esconder a interface no React não substitui autorização no banco. Quando as operações administrativas forem ligadas ao Supabase, cada escrita administrativa também deverá validar a role no servidor/RLS/RPC.
