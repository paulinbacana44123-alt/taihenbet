# TaihenBet 2.0 — Fase 3.22

## Feed de Atividades / Mural da Comunidade

A fase adiciona a nova aba **Feed**, uma linha do tempo pública que conecta os sistemas sociais e de progressão já existentes.

### Atividades registradas

- conquistas desbloqueadas;
- publicações da comunidade no Museu;
- comentários publicados no Museu;
- missões diárias e semanais resgatadas;
- objetivos sazonais resgatados;
- marcos da temporada resgatados;
- títulos equipados;
- cosméticos equipados.

### Integrações

- avatar/nome levam ao perfil público;
- cada atividade pode levar para Museu, Missões, Evento, Conquistas ou perfil;
- atividades antigas compatíveis são importadas no primeiro run do SQL;
- publicações/comentários removidos deixam de aparecer no Feed;
- contas suspensas deixam de aparecer enquanto a suspensão estiver ativa;
- saldo, e-mail, histórico bruto, autenticação e ações de moderação não são expostos.

### Filtros

O mural possui filtros por tipo de atividade e paginação em blocos de 20 registros.
