-- ============================================================================
-- TaihenBet 2.0 — Fase 3.23b
-- Pós-créditos / Mensagem do Criador
-- Execute depois de phase3_23_content_studio.sql.
-- A 3.23a (editor da Neytai) também deve estar instalada para editar as novas
-- falas do pós-créditos pelo Painel.
-- ============================================================================

insert into public.site_text_content (
  key,
  section,
  label,
  value,
  default_value,
  sort_order
)
values
  (
    'creator_message.eyebrow',
    'Mensagem do criador',
    'Chamada superior',
    'PÓS-CRÉDITOS · MENSAGEM DO CRIADOR',
    'PÓS-CRÉDITOS · MENSAGEM DO CRIADOR',
    700
  ),
  (
    'creator_message.title',
    'Mensagem do criador',
    'Título principal',
    'Antes de você ir embora, faltava uma coisa.',
    'Antes de você ir embora, faltava uma coisa.',
    710
  ),
  (
    'creator_message.intro',
    'Mensagem do criador',
    'Introdução',
    'Se você chegou até aqui, esta parte não é da banca, do Neytai nem de um personagem. É só uma mensagem minha para quem acabou entrando nessa maluquice.',
    'Se você chegou até aqui, esta parte não é da banca, do Neytai nem de um personagem. É só uma mensagem minha para quem acabou entrando nessa maluquice.',
    720
  ),
  (
    'creator_message.body',
    'Mensagem do criador',
    'Mensagem geral para todos',
    E'A TaihenBet começou como uma piada e, em algum momento, recebeu uma quantidade completamente desnecessária de sistemas, telas, detalhes e horas de trabalho. Se você explorou o site, riu de alguma coisa, achou alguma referência idiota ou simplesmente ficou curioso para ver até onde isso ia, então já valeu a pena.\n\nObrigado por dedicar um pouco do seu tempo a algo que eu fiz principalmente porque achei engraçado fazer. Não precisa conhecer toda a história por trás do site para estar incluído nessa mensagem.',
    E'A TaihenBet começou como uma piada e, em algum momento, recebeu uma quantidade completamente desnecessária de sistemas, telas, detalhes e horas de trabalho. Se você explorou o site, riu de alguma coisa, achou alguma referência idiota ou simplesmente ficou curioso para ver até onde isso ia, então já valeu a pena.\n\nObrigado por dedicar um pouco do seu tempo a algo que eu fiz principalmente porque achei engraçado fazer. Não precisa conhecer toda a história por trás do site para estar incluído nessa mensagem.',
    730
  ),
  (
    'creator_message.tai_label',
    'Mensagem do criador',
    'Rótulo do trecho especial para a Taihen',
    'E UMA LINHA ESPECIAL PRA TAIHEN',
    'E UMA LINHA ESPECIAL PRA TAIHEN',
    740
  ),
  (
    'creator_message.tai_line',
    'Mensagem do criador',
    'Trecho especial para a Taihen',
    'Tai, se você estiver lendo isso: obviamente essa bagunça inteira não existiria sem você ter virado inspiração para uma quantidade preocupante de piadas internas. Obrigado por, mesmo sem querer, ter dado assunto suficiente para esse projeto existir.',
    'Tai, se você estiver lendo isso: obviamente essa bagunça inteira não existiria sem você ter virado inspiração para uma quantidade preocupante de piadas internas. Obrigado por, mesmo sem querer, ter dado assunto suficiente para esse projeto existir.',
    750
  ),
  (
    'creator_message.signature',
    'Mensagem do criador',
    'Assinatura',
    '— Paulo',
    '— Paulo',
    760
  )
on conflict (key) do nothing;
