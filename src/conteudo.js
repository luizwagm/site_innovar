/* ==========================================================================
   INNOVAR — o registro de tudo que o cliente pode editar

   ESTE ARQUIVO É A LISTA DE CAMPOS DO PAINEL. Cada entrada vira, de uma vez
   só: a semente no banco, o rótulo do formulário do admin e o tipo de editor.
   Não existe texto de tela escrito direto dentro de uma página — se está na
   tela, a chave está aqui. Foi assim que os projetos irmãos evitaram o "esse
   pedacinho eu preciso te pedir para mudar".

   `painel` agrupa os campos nas telas do admin, e o agrupamento segue a ORDEM
   DE LEITURA DO SITE, não a ordem alfabética: quem vai editar está com a
   página aberta ao lado, procurando "aquele texto embaixo do título".

   Tipos:
     texto   — uma linha (título, botão)
     area    — várias linhas, sem formatação (parágrafo)
     rico    — várias linhas com negrito/lista (corpo de página)
     imagem  — caminho em /assets/img/uploads
   ========================================================================== */
"use strict";

const CAMPOS = [
  /* ------------------------------------------------------------ identidade - */
  { chave: "EMPRESA_NOME", painel: "Identidade", rotulo: "Nome da empresa", tipo: "texto",
    valor: "INNOVAR Engenharia e Equipamentos" },
  { chave: "EMPRESA_CNPJ", painel: "Identidade", rotulo: "CNPJ", tipo: "texto", valor: "" },
  { chave: "EMPRESA_IE", painel: "Identidade", rotulo: "Inscrição estadual", tipo: "texto", valor: "" },
  { chave: "EMPRESA_ENDERECO", painel: "Identidade", rotulo: "Endereço", tipo: "texto", valor: "Caruaru — PE" },
  { chave: "EMPRESA_TELEFONE", painel: "Identidade", rotulo: "Telefone (como aparece)", tipo: "texto", valor: "" },
  { chave: "EMPRESA_TELEFONE_LINK", painel: "Identidade", rotulo: "Telefone (só números, com 55)", tipo: "texto", valor: "" },
  { chave: "EMPRESA_ZAP", painel: "Identidade", rotulo: "WhatsApp (só números, com 55)", tipo: "texto", valor: "" },
  { chave: "EMPRESA_EMAIL", painel: "Identidade", rotulo: "E-mail", tipo: "texto", valor: "" },
  { chave: "EMPRESA_HORARIO", painel: "Identidade", rotulo: "Horário de atendimento", tipo: "texto",
    valor: "Segunda a sexta, 8h às 18h · Sábado, 8h às 12h" },
  { chave: "EMPRESA_INSTAGRAM", painel: "Identidade", rotulo: "Instagram (endereço completo)", tipo: "texto", valor: "" },
  { chave: "EMPRESA_MAPA", painel: "Identidade", rotulo: "Google Meu Negócio (endereço completo)", tipo: "texto", valor: "" },

  /* ------------------------------------------------------------------ home - */
  { chave: "HOME_OLHO", painel: "Início", rotulo: "Etiqueta acima do título", tipo: "texto",
    valor: "Caruaru e Agreste pernambucano" },
  { chave: "HOME_TITULO", painel: "Início", rotulo: "Título principal", tipo: "texto",
    valor: "Instalação que passa na vistoria — e manutenção que evita a próxima" },
  { chave: "HOME_TEXTO", painel: "Início", rotulo: "Texto de abertura", tipo: "area",
    valor: "Elétrica, hidráulica, gás e prevenção contra incêndio para comércio, indústria e condomínio. Projeto, execução e a documentação que o órgão pede — com a mesma equipe do começo ao fim." },
  { chave: "HOME_BOTAO1", painel: "Início", rotulo: "Botão principal", tipo: "texto", valor: "Pedir orçamento" },
  { chave: "HOME_BOTAO2", painel: "Início", rotulo: "Botão secundário", tipo: "texto", valor: "Ver material hidráulico" },

  { chave: "HOME_SELO1_T", painel: "Início", rotulo: "Selo 1 — título", tipo: "texto", valor: "Documento incluso" },
  { chave: "HOME_SELO1_D", painel: "Início", rotulo: "Selo 1 — descrição", tipo: "area",
    valor: "ART, laudo e as-built quando o serviço exige" },
  { chave: "HOME_SELO2_T", painel: "Início", rotulo: "Selo 2 — título", tipo: "texto", valor: "Visita antes do preço" },
  { chave: "HOME_SELO2_D", painel: "Início", rotulo: "Selo 2 — descrição", tipo: "area",
    valor: "Orçamento sai depois de ver o local, não por telefone" },
  { chave: "HOME_SELO3_T", painel: "Início", rotulo: "Selo 3 — título", tipo: "texto", valor: "Material na hora" },
  { chave: "HOME_SELO3_D", painel: "Início", rotulo: "Selo 3 — descrição", tipo: "area",
    valor: "Loja própria de material hidráulico, sem espera de fornecedor" },

  { chave: "HOME_SERV_OLHO", painel: "Início", rotulo: "Serviços — etiqueta", tipo: "texto", valor: "O que fazemos" },
  { chave: "HOME_SERV_TITULO", painel: "Início", rotulo: "Serviços — título", tipo: "texto",
    valor: "Quatro frentes, uma equipe só" },
  { chave: "HOME_SERV_TEXTO", painel: "Início", rotulo: "Serviços — texto", tipo: "area",
    valor: "Cada frente tem página própria com o que está incluído, o que não está e o prazo típico — para você saber se resolve o seu caso antes de pedir orçamento." },

  { chave: "HOME_PASSOS_OLHO", painel: "Início", rotulo: "Como funciona — etiqueta", tipo: "texto", valor: "Como funciona" },
  { chave: "HOME_PASSOS_TITULO", painel: "Início", rotulo: "Como funciona — título", tipo: "texto",
    valor: "Do primeiro contato à entrega do documento" },
  { chave: "HOME_PASSO1_T", painel: "Início", rotulo: "Passo 1 — título", tipo: "texto", valor: "Você conta o problema" },
  { chave: "HOME_PASSO1_D", painel: "Início", rotulo: "Passo 1 — texto", tipo: "area",
    valor: "Pelo formulário ou WhatsApp. Foto ou planta ajudam e podem encurtar uma visita." },
  { chave: "HOME_PASSO2_T", painel: "Início", rotulo: "Passo 2 — título", tipo: "texto", valor: "Vamos ver no local" },
  { chave: "HOME_PASSO2_D", painel: "Início", rotulo: "Passo 2 — texto", tipo: "area",
    valor: "Preço de instalação por telefone é chute. A visita é o que faz o orçamento valer." },
  { chave: "HOME_PASSO3_T", painel: "Início", rotulo: "Passo 3 — título", tipo: "texto", valor: "Orçamento com escopo" },
  { chave: "HOME_PASSO3_D", painel: "Início", rotulo: "Passo 3 — texto", tipo: "area",
    valor: "Por escrito, dizendo o que entra, o que não entra e em quanto tempo." },
  { chave: "HOME_PASSO4_T", painel: "Início", rotulo: "Passo 4 — título", tipo: "texto", valor: "Execução e entrega" },
  { chave: "HOME_PASSO4_D", painel: "Início", rotulo: "Passo 4 — texto", tipo: "area",
    valor: "Serviço feito, local limpo e a documentação técnica na sua mão." },

  { chave: "HOME_LOJA_OLHO", painel: "Início", rotulo: "Loja — etiqueta", tipo: "texto", valor: "Material hidráulico" },
  { chave: "HOME_LOJA_TITULO", painel: "Início", rotulo: "Loja — título", tipo: "texto", valor: "Compre o material pelo site" },
  { chave: "HOME_LOJA_TEXTO", painel: "Início", rotulo: "Loja — texto", tipo: "area",
    valor: "Tubos, conexões, registros e metais. Preço com a unidade sempre à vista — por metro, por barra ou por peça, sem ambiguidade." },

  { chave: "HOME_CTA_OLHO", painel: "Início", rotulo: "Chamada final — etiqueta", tipo: "texto", valor: "Vamos conversar" },
  { chave: "HOME_CTA_TITULO", painel: "Início", rotulo: "Chamada final — título", tipo: "texto",
    valor: "Conte o que precisa. A visita não custa nada." },
  { chave: "HOME_CTA_TEXTO", painel: "Início", rotulo: "Chamada final — texto", tipo: "area",
    valor: "Respondemos em horário comercial. Se for urgência de elétrica ou vazamento, chame direto no WhatsApp." },

  /* -------------------------------------------------------------- serviços - */
  { chave: "SERV_TITULO", painel: "Serviços", rotulo: "Título da página", tipo: "texto", valor: "Serviços" },
  { chave: "SERV_TEXTO", painel: "Serviços", rotulo: "Texto de abertura", tipo: "area",
    valor: "Instalação, manutenção e adequação para quem tem um imóvel comercial funcionando — com escopo por escrito e a documentação que a vistoria pede." },

  /* ----------------------------------------------------------------- obras - */
  { chave: "OBRAS_TITULO", painel: "Obras", rotulo: "Título da página", tipo: "texto",
    valor: "Obras entregues" },
  { chave: "OBRAS_TEXTO", painel: "Obras", rotulo: "Texto de abertura", tipo: "area",
    valor: "Cada obra com o problema que existia, o que foi feito e o que mudou depois. Onde o cliente autorizou, o nome está lá; onde não autorizou, o porte e o tipo de imóvel dizem o que você precisa saber." },
  { chave: "OBRAS_HOME_OLHO", painel: "Início", rotulo: "Obras — etiqueta", tipo: "texto", valor: "Obras entregues" },
  { chave: "OBRAS_HOME_TITULO", painel: "Início", rotulo: "Obras — título", tipo: "texto",
    valor: "Já foi feito antes, no porte do seu" },
  { chave: "OBRAS_VAZIO", painel: "Obras", rotulo: "Texto quando não há obra cadastrada", tipo: "area",
    valor: "Ainda não publicamos obras aqui. Peça um orçamento e a gente mostra trabalhos parecidos com o seu na visita." },

  /* ------------------------------------------------------------------ loja - */
  { chave: "LOJA_TITULO", painel: "Loja", rotulo: "Título da página", tipo: "texto", valor: "Material hidráulico" },
  { chave: "LOJA_TEXTO", painel: "Loja", rotulo: "Texto de abertura", tipo: "area",
    valor: "Tubos, conexões, registros e metais das marcas que a gente usa no próprio serviço. Retirada em Caruaru ou entrega combinada." },
  { chave: "LOJA_AVISO_ENTREGA", painel: "Loja", rotulo: "Aviso de entrega e retirada", tipo: "area",
    valor: "Retirada na loja sem custo. Entrega em Caruaru e região combinada por WhatsApp depois do pedido — o frete varia com o volume do material." },
  { chave: "CHECKOUT_AVISO", painel: "Loja", rotulo: "Aviso do fechamento do pedido", tipo: "area",
    valor: "O pedido é uma reserva: nós conferimos o estoque, combinamos frete e forma de pagamento pelo WhatsApp e só então ele é faturado." },

  /* --------------------------------------------------------------- empresa - */
  { chave: "EMPRESA_TITULO", painel: "A empresa", rotulo: "Título da página", tipo: "texto",
    valor: "Engenharia de quem atende o Agreste" },
  { chave: "EMPRESA_TEXTO", painel: "A empresa", rotulo: "Texto principal", tipo: "rico",
    valor: "<p>A INNOVAR nasceu para atender uma faixa mal servida em Caruaru: a empresa que precisa de instalação bem feita e com documento, mas é pequena demais para contratar uma construtora e grande demais para resolver com o eletricista do bairro.</p><p>Trabalhamos com a mesma equipe do orçamento à entrega. Quem visita o local é quem executa — não há repasse para terceiros no meio do caminho, que é onde o escopo combinado costuma se perder.</p>" },
  { chave: "EMPRESA_VALOR1_T", painel: "A empresa", rotulo: "Valor 1 — título", tipo: "texto", valor: "Escopo por escrito" },
  { chave: "EMPRESA_VALOR1_D", painel: "A empresa", rotulo: "Valor 1 — texto", tipo: "area",
    valor: "O orçamento diz o que entra e o que não entra. Serviço extra é orçado à parte, nunca embutido depois." },
  { chave: "EMPRESA_VALOR2_T", painel: "A empresa", rotulo: "Valor 2 — título", tipo: "texto", valor: "Documentação técnica" },
  { chave: "EMPRESA_VALOR2_D", painel: "A empresa", rotulo: "Valor 2 — texto", tipo: "area",
    valor: "ART, laudo e as-built quando o serviço exige — é o que vale na vistoria e na renovação do alvará." },
  { chave: "EMPRESA_VALOR3_T", painel: "A empresa", rotulo: "Valor 3 — título", tipo: "texto", valor: "Obra que funciona durante" },
  { chave: "EMPRESA_VALOR3_D", painel: "A empresa", rotulo: "Valor 3 — texto", tipo: "area",
    valor: "Trabalhamos em horário combinado e por etapas para o comércio não fechar as portas por causa da reforma." },

  /* --------------------------------------------------------------- contato - */
  { chave: "CONTATO_TITULO", painel: "Contato", rotulo: "Título da página", tipo: "texto", valor: "Falar com a equipe" },
  { chave: "CONTATO_TEXTO", painel: "Contato", rotulo: "Texto de abertura", tipo: "area",
    valor: "Para urgência de elétrica ou vazamento, o WhatsApp é o caminho mais rápido. Para orçamento com escopo, use o formulário — assim já chega com os dados que a gente precisa." },

  /* ------------------------------------------------------------- orçamento - */
  { chave: "ORC_TITULO", painel: "Orçamento", rotulo: "Título da página", tipo: "texto", valor: "Pedir orçamento" },
  { chave: "ORC_TEXTO", painel: "Orçamento", rotulo: "Texto de abertura", tipo: "area",
    valor: "Conte onde é, o que precisa e para quando. Respondemos combinando a visita — é ela que faz o preço valer." },
  { chave: "ORC_OBRIGADO", painel: "Orçamento", rotulo: "Mensagem depois de enviar", tipo: "area",
    valor: "Recebemos o seu pedido. Vamos responder em horário comercial para combinar a visita. Guarde o protocolo abaixo." },

  /* ------------------------------------------------------------------ feed - */
  { chave: "FEED_TITULO", painel: "Feed", rotulo: "Título da página", tipo: "texto", valor: "Manutenção e segurança predial" },
  { chave: "FEED_TEXTO", painel: "Feed", rotulo: "Texto de abertura", tipo: "area",
    valor: "O que a gente explica toda semana em obra, escrito para quem administra o imóvel e precisa decidir." },

  /* -------------------------------------------------------------- rodapé ---- */
  { chave: "RODAPE_SOBRE", painel: "Rodapé", rotulo: "Texto ao lado do logo", tipo: "area",
    valor: "Instalações elétricas, hidráulicas, de gás e de prevenção contra incêndio. Loja de material hidráulico. Caruaru e Agreste pernambucano." },

  /* --------------------------------------------------------------- buscas --- */
  { chave: "SEO_TITULO", painel: "SEO", rotulo: "Título no Google (início)", tipo: "texto",
    valor: "INNOVAR Engenharia e Equipamentos — instalações elétricas, hidráulicas e de incêndio em Caruaru" },
  { chave: "SEO_DESCRICAO", painel: "SEO", rotulo: "Descrição no Google (início)", tipo: "area",
    valor: "Instalação e manutenção elétrica, hidráulica, sanitária e de gás, e sistemas de prevenção contra incêndio para empresas em Caruaru e no Agreste. Também vendemos material hidráulico." },
  { chave: "SEO_ANALYTICS", painel: "SEO", rotulo: "Google Analytics (código G-)", tipo: "texto", valor: "" },
  { chave: "SEO_PIXEL_META", painel: "SEO", rotulo: "Pixel da Meta (número)", tipo: "texto", valor: "" },
  { chave: "SEO_SEARCH_CONSOLE", painel: "SEO", rotulo: "Google Search Console (verificação)", tipo: "texto", valor: "" },

  /* ------------------------------------------------------------ privacidade - */
  { chave: "PRIV_TEXTO", painel: "Privacidade", rotulo: "Política de privacidade", tipo: "rico", valor: "" },
];

const POR_CHAVE = new Map(CAMPOS.map((c) => [c.chave, c]));
const PAINEIS = [...new Set(CAMPOS.map((c) => c.painel))];

module.exports = { CAMPOS, POR_CHAVE, PAINEIS };
