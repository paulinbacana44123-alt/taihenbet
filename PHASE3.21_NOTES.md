# TaihenBet 2.0 — Fase 3.21

## Comentários e Reações no Museu

A fase transforma as publicações comunitárias do Museu em peças sociais persistentes.

### Reações

- `🍠 Mandioca`
- `🔥 Fogo`
- `😭 Sofrimento`
- `💸 Falência`

Existe uma reação por conta em cada publicação. Repetir a reação ativa remove o voto; escolher outra substitui a anterior. A primeira reação de outra pessoa gera uma notificação para o autor da peça, mas trocas de emoji não geram spam.

### Comentários

Comentários têm de 1 a 600 caracteres e ficam vinculados à conta autora. O próprio autor pode apagá-los pelo Museu. Administradores removem comentários pela Central de Moderação para que a ação fique registrada no log administrativo.

### Notificações

A Central da Banca recebe o novo tipo `museum`:

- nova reação em publicação própria;
- novo comentário em publicação própria;
- remoção administrativa continua usando o tipo `moderation`.

Ações feitas no próprio conteúdo não geram notificação para si mesmo.

### Segurança

As tabelas sociais usam RLS e não concedem escrita direta a `anon`/`authenticated`. Alterações passam por RPCs `security definer`, validam autenticação e preservam o bloqueio de contas suspensas da Fase 3.14.

### Moderação

A Central de Moderação recebe:

- contador de comentários;
- aba **Comentários**;
- busca por autor, peça ou conteúdo;
- remoção administrativa;
- ação `museum_comment_removed` no log;
- notificação automática ao autor do comentário removido.

### Compatibilidade

`get_museum_posts()` permanece intacta. A interface da Fase 3.21 usa `get_museum_posts_social()` para receber também os contadores de reação e comentário.
