# TaihenBet 2.0 — Phase 3.11 — Community Spaces + Grupo TaihenBet

## Museu
O Museu passa a combinar o acervo original com publicações da comunidade.

Usuários autenticados podem publicar:
- imagem ou vídeo;
- título;
- descrição;
- categoria.

Cada publicação mostra o `profiles.username` da conta responsável.
Arquivos ficam no bucket `museum-community` em uma pasta com o UUID do autor.

O cliente não recebe permissão direta de escrita em `museum_posts`.
Criação e exclusão passam por RPCs com `auth.uid()`.

## Para a Tai
A antiga carta fixa foi removida da interface.
A página agora é um mural coletivo.

Usuários autenticados podem escrever mensagens de até 1600 caracteres.
Cada mensagem mostra o nome da conta autora e a data.

## Empresas do Grupo TaihenBet
Nova página pública **Grupo** na navegação.

Ela funciona como um organograma/paródia corporativa do universo da TaihenBet.
O SQL já cadastra quatro empresas iniciais:
- NASA;
- SIV;
- DJI;
- Taihen Airlines.

A própria página deixa explícito que as participações são fictícias e que não existe vínculo ou aquisição real das organizações citadas.

Cada card possui:
- nome;
- símbolo/sigla;
- setor;
- slogan;
- descrição;
- status corporativo e tom visual.

### Administração
Conta comum apenas visualiza.
Conta com `profiles.role = 'admin'` recebe, dentro da página Grupo:
- `+ Registrar empresa`;
- editar empresa;
- excluir empresa.

O navegador não recebe `INSERT`, `UPDATE` ou `DELETE` direto na tabela `taihen_group_companies`.
A administração usa RPCs protegidas por `is_current_user_admin()`.

RPCs:
- `get_taihen_group_companies`
- `admin_upsert_taihen_group_company`
- `admin_delete_taihen_group_company`

## Moderação da comunidade
- dono pode remover a própria publicação/mensagem;
- admin pode remover qualquer publicação/mensagem;
- e-mails não são expostos;
- textos são renderizados como texto pelo React, sem HTML do usuário.

## Storage
Bucket: `museum-community`

Tipos permitidos:
- JPEG
- PNG
- WEBP
- GIF
- MP4
- WEBM
- QuickTime/MOV

Limite por arquivo: 50 MB.
