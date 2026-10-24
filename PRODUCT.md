# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Famílias de médio e alto padrão na Grande Porto Alegre/RS que querem construir a casa própria (ou reformar) e buscam acompanhamento técnico completo, sem precisar gerenciar o canteiro no dia a dia.

## Product Purpose

Site institucional da Reis Engenharia & Construções: apresentar a empresa, demonstrar credibilidade e portfólio real de obras, e gerar leads qualificados via WhatsApp e formulário de contato.

## Positioning

Gestão completa de obra sem envolvimento do cliente no dia a dia do canteiro, aliada ao Método REIS FRAME™ (Steel Frame industrializado com projeto em BIM) e à responsabilidade técnica formal de um engenheiro com registro ativo no CREA-RS — combinação que empreiteiras informais da região não oferecem.

## Operating Context

Obras residenciais na Grande Porto Alegre/RS, em dois sistemas construtivos: alvenaria estrutural convencional e Light Steel Frame. Contato primário via WhatsApp ((51) 98151-9380); formulário de contato do site envia via Web3Forms para contato@reisengenhariars.com.br. Perfil no Instagram: @reisengenharia_rs.

## Capabilities and Constraints

Site estático (HTML/CSS/JS puro, sem framework ou build step). Hospedado na Hostinger, domínio reisengenhariars.com.br, servido de `/domains/reisengenhariars.com.br/public_html/` (não da raiz `public_html/` da conta). Publicação automática: todo merge na `main` que altera arquivos do site roda `.github/workflows/deploy-site.yml` (ou manualmente em Actions > "Publicar site"), que executa o `deploy.py` com as credenciais guardadas no secret `FTP_CREDENTIALS_JSON`. O `deploy.py` também continua funcionando localmente (FTP, lista de permissão explícita de pastas — nunca publica a pasta `crm-backend` nem outros projetos que também vivem neste diretório local). Cache-busting de CSS/JS é automático (hash do conteúdo, calculado pelo próprio `deploy.py`) — nunca depender de bump manual de versão.

Fotos e depoimentos reais vêm de pastas do Google Drive da empresa (`02. MARKETING`, subpastas como `FOTOS TRATADAS`, `FOTOS DE OBRAS`, `Steel Frame`). Nunca inventar depoimentos, preços, prazos ou estatísticas não confirmados pelo cliente. Imagens claramente geradas por IA (ex: renders conceituais "meio-pronto/meio-estrutura" usados na seção Steel Frame) podem ilustrar o sistema construtivo em geral, mas nunca devem ser apresentadas como fotos de obra real.

## Brand Commitments

Nome: Reis Engenharia & Construções. Responsável técnico: Eng. Jeferson Reis da Silva, CREA-RS 236502. Instagram: @reisengenharia_rs. Fonte: Montserrat. Paleta: navy escuro (#0e1a2b), teal (#4ecdc4), dourado de apoio (#f2c230). Logos em `assets/img/logo/`.

## Funil de anúncios (/orcamento/)

Página separada da institucional, usada como destino dos anúncios do Instagram: simulação em 6 etapas (sistema construtivo, terreno e condomínio fechado, tamanho, investimento, prazo e prioridades, contato). Envia o lead ao CRM (`POST https://crm.reisengenhariars.com.br/api/funil/lead`, código no repositório `crm-reis-engenharia`) e dispara o Pixel do Meta (dataset "CRM Reis Engenharia", ID 1394932546062127: PageView, ViewContent, QuizStart, QuizStep, Lead). UTMs da URL seguem para o CRM. No fim, o cliente pode continuar no WhatsApp com as respostas na mensagem. Para testar sem enviar nada ao CRM, abra a página com `?preview=1`. Arquivos em `orcamento/` (publicados pelo `deploy.py`); artes dos anúncios em `assets/img/anuncios/`. Metragem é só pergunta de qualificação: os títulos e anúncios não limitam o tamanho da casa.

## Evidence on Hand

- 6 depoimentos reais de clientes (extraídos de PDF da empresa): Anderson e Franciele, Jenifer e Vinícius, Daniel e Mariana, Vitória e Nicolas, Adriele e Gabriel, Diego e Jeisse — cada um com cidade e metragem da casa.
- Fotos reais de obras em `assets/img/galeria/` (15 fachadas/ambientes tratados profissionalmente), `assets/img/obras/` e `assets/img/steelframe/` (canteiro real de Steel Frame).
- Estatísticas confirmadas pelo cliente: +100 obras entregues, 20.000m² construídos em obras residenciais.
- Retrato e foto de obra do Eng. Jeferson Reis em `assets/img/equipe/`.
- Não há: cases de imprensa, prêmios, ou depoimentos além dos 6 já catalogados — não inventar.

## Product Principles

1. Autenticidade acima de tudo: fotos e depoimentos são sempre reais; nada genérico ou gerado por IA é apresentado como obra própria.
2. Prova de responsabilidade técnica (engenheiro nomeado, CREA-RS) visível nos pontos-chave de decisão do visitante.
3. Caminho de conversão sempre curto: WhatsApp e formulário de contato acessíveis a partir de qualquer seção.
4. Distinção clara entre os dois sistemas construtivos (alvenaria convencional vs. Steel Frame) sem confundir o visitante sobre qual está vendo.
5. Confiabilidade operacional do próprio site: deploys nunca devem quebrar cache do visitante nem expor dados/segredos de outros projetos que compartilham a mesma pasta local.
