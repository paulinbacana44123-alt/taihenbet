# TaihenBet 2.0 — Fase 3.5: Recuperação de senha

Patch incremental para aplicar por cima da Fase 3.4.1.

## O que entrou

- Link **Esqueceu sua senha?** no login.
- Envio do e-mail oficial de recuperação com `supabase.auth.resetPasswordForEmail()`.
- Detecção do evento `PASSWORD_RECOVERY` quando o usuário volta pelo link do e-mail.
- Tela obrigatória de nova senha.
- Confirmação da nova senha.
- Detector de senha vergonhosa também funciona na recuperação.
- O aviso inicial da TaihenBet não cobre a tela de recuperação quando o usuário volta pelo link.
- A role do perfil (`admin`, `user`, etc.) não é alterada ao trocar a senha.

## Instalação

1. Extraia o patch por cima do projeto atual e substitua os arquivos.
2. Não há SQL novo.
3. Não há pacote npm novo.
4. Reinicie o Vite se necessário: `npm run dev`.

## Supabase — URL de redirecionamento

Em **Authentication > URL Configuration**, confirme que a URL usada para testar está permitida. Para desenvolvimento:

`http://localhost:5173`

Quando publicar, adicione também a URL real do Vercel.

## Teste recomendado

1. Saia da conta admin.
2. Abra **Entrar**.
3. Clique em **Esqueceu sua senha?**.
4. Digite o e-mail da conta admin.
5. Abra o e-mail recebido e clique no link.
6. A TaihenBet deve abrir diretamente em **Escolha uma nova senha vergonhosa**.
7. Teste uma senha fraca como `123456` para conferir a piada.
8. Escolha uma senha nova válida e confirme.
9. Saia da conta e entre novamente usando a nova senha.
10. A conta deve continuar com `role = admin` e com o mesmo saldo/perfil.

## Template opcional do e-mail

No Supabase, abra **Authentication > Emails > Templates > Reset Password** (o nome pode aparecer como Recovery) e use:

**Assunto:** `🔐 A banca recebeu um pedido de amnésia`

O HTML pronto está em `supabase/password_recovery_email.html`.

Não altere a variável `{{ .ConfirmationURL }}` do botão.
