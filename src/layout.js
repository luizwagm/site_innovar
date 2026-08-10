/* ==========================================================================
   INNOVAR — layout único

   O CABEÇALHO E O RODAPÉ EXISTEM UMA VEZ SÓ, aqui. A alternativa — um arquivo
   HTML por página com o topo copiado — parece mais simples no primeiro dia e
   cobra no segundo: mudar o telefone vira dezoito edições, e a décima nona
   página que alguém criar vai nascer com o telefone velho. Já vi o rodapé de
   um site ter três CNPJs diferentes por causa disso.

   Aqui a página informa só o que é dela (título, endereço, miolo) e recebe o
   resto pronto.
   ========================================================================== */
"use strict";

const { texto } = require("./textos");
const repo = require("./repo");

const APP_VERSION = require("../package.json").version;
const SITE = "https://inovarengenharia.com.br";

/* ==========================================================================
   ESCAPE

   Tudo que vem do banco passa por aqui antes de virar HTML. O conteúdo é
   escrito pelo cliente no painel, não por um atacante — mas o nome digitado no
   checkout e o termo digitado na busca voltam para a tela, e esses vêm de
   qualquer um. Uma função só, usada sempre, é mais segura que duas usadas às
   vezes.
   ========================================================================== */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Dinheiro sai de CENTAVOS INTEIROS. A divisão acontece só aqui, na hora de
   mostrar — nenhuma conta do sistema trabalha com fração. */
const dinheiro = (centavos) =>
  (Number(centavos || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const soDigitos = (s) => String(s ?? "").replace(/\D/g, "");

/* ==========================================================================
   ÍCONES

   Desenhados em linha, e não como arquivo: são cinco traços cada um, e um
   arquivo por ícone significa cinco requisições a mais no carregamento — mais
   caro que o próprio desenho. `currentColor` faz o ícone herdar a cor do texto
   ao redor, então ele funciona no cartão claro e no rodapé escuro sem uma
   segunda versão.
   ========================================================================== */
const ICONES = {
  raio: '<path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"/>',
  gota: '<path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3Z"/>',
  chama: '<path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.6.7-2.8 1.6-4 .3 1 .9 1.7 1.7 2 .3-2.6.9-5 1.7-7Z"/>',
  chave: '<path d="M14.5 3a5.5 5.5 0 0 0-5.2 7.3L3 16.6V21h4.4l6.3-6.3A5.5 5.5 0 1 0 14.5 3Z"/><circle cx="16.5" cy="7.5" r="1.2"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  zap: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.7-4.3A8.5 8.5 0 1 1 20.5 11.5Z"/>',
  local: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  carrinho: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 11.6a2 2 0 0 0 2 1.4h7.7a2 2 0 0 0 2-1.5L21 8H6"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  ok: '<path d="m5 13 4 4L19 7"/>',
  nao: '<path d="M6 6 18 18M18 6 6 18"/>',
};

function icone(nome, tamanho = 24) {
  const d = ICONES[nome] || ICONES.raio;
  return `<svg viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" fill="none" stroke="currentColor"
    stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

/* ==========================================================================
   MENU

   Uma lista só, usada no cabeçalho e no rodapé. Separadas, elas divergem — o
   rodapé fica com a página que saiu do menu e ninguém percebe porque ninguém
   rola até lá para conferir.
   ========================================================================== */
const MENU = [
  { href: "/", rotulo: "Início" },
  { href: "/servicos/", rotulo: "Serviços" },
  { href: "/obras/", rotulo: "Obras" },
  { href: "/loja/", rotulo: "Loja" },
  { href: "/feed/", rotulo: "Feed" },
  { href: "/empresa/", rotulo: "A empresa" },
  { href: "/contato/", rotulo: "Contato" },
];

/* O item do menu fica marcado também quando estamos numa página FILHA: em
   `/servicos/eletrica/`, "Serviços" continua sendo onde a pessoa está. Sem
   isto o menu inteiro fica apagado nas páginas internas, e o visitante perde a
   referência de onde entrou. */
const naSecao = (atual, href) => href === "/" ? atual === "/" : atual.startsWith(href);

function cabecalho(atual) {
  const itens = MENU.map((m) => {
    const aqui = naSecao(atual, m.href);
    return `<a href="${m.href}"${aqui ? ' aria-current="page"' : ""}>${esc(m.rotulo)}</a>`;
  }).join("");

  return `
<header class="cab">
  <div class="container cab__linha">
    <a class="marca" href="/" aria-label="${esc(texto("EMPRESA_NOME"))} — início">
      <img src="/assets/img/logo-marca.png?v=${APP_VERSION}" alt="${esc(texto("EMPRESA_NOME"))}"
           width="1012" height="298" fetchpriority="high">
    </a>

    <button class="menu-btn" type="button" aria-label="Abrir o menu" aria-expanded="false" aria-controls="nav">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>

    <nav class="nav" id="nav" aria-label="Principal">${itens}</nav>

    <div class="cab__acoes">
      <a class="acao-icone" href="/busca/" aria-label="Buscar no site">${icone("busca", 20)}</a>
      <a class="acao-icone carrinho-btn" href="/carrinho/" aria-label="Carrinho de compras">
        ${icone("carrinho", 20)}<span class="carrinho-btn__n" hidden>0</span>
      </a>
      <a class="btn btn--peq btn--primario" href="/orcamento/">Orçamento</a>
    </div>
  </div>
</header>`;
}

function rodape() {
  const zap = soDigitos(texto("EMPRESA_ZAP"));
  const tel = soDigitos(texto("EMPRESA_TELEFONE_LINK"));
  const email = texto("EMPRESA_EMAIL");
  const cnpj = texto("EMPRESA_CNPJ");
  const insta = texto("EMPRESA_INSTAGRAM");

  /* Contato só vira link se houver número. Um `href="tel:"` vazio é um link
     que não faz nada — e o visitante conclui que o site está quebrado, não que
     o telefone ainda não foi cadastrado. */
  const linhaContato = (cond, href, conteudo) =>
    cond ? `<li><a href="${href}">${conteudo}</a></li>` : `<li class="rodape__vazio">${conteudo}</li>`;

  return `
<footer class="rodape">
  <div class="container">
    <div class="rodape__grade">
      <div>
        <img class="rodape__logo" src="/assets/img/logo-marca.png?v=${APP_VERSION}"
             alt="${esc(texto("EMPRESA_NOME"))}" width="1012" height="298" loading="lazy">
        <p class="rodape__sobre">${esc(texto("RODAPE_SOBRE"))}</p>
        ${insta ? `<a class="rodape__rede" href="${esc(insta)}" rel="me noopener" target="_blank">Instagram</a>` : ""}
      </div>

      <div>
        <h4>Serviços</h4>
        <ul>${repo.servicosAtivos().map((s) =>
          `<li><a href="/servicos/${s.slug}/">${esc(s.nome)}</a></li>`).join("")}</ul>
      </div>

      <div>
        <h4>Site</h4>
        <ul>${MENU.filter((m) => m.href !== "/").map((m) => `<li><a href="${m.href}">${esc(m.rotulo)}</a></li>`).join("")}
          <li><a href="/privacidade/">Privacidade</a></li></ul>
      </div>

      <div>
        <h4>Contato</h4>
        <ul class="rodape__contato">
          ${linhaContato(!!tel, `tel:+${tel}`, `${icone("relogio", 16)}${esc(texto("EMPRESA_TELEFONE") || "Telefone a cadastrar")}`)}
          ${linhaContato(!!email, `mailto:${esc(email)}`, `${icone("email", 16)}${esc(email || "E-mail a cadastrar")}`)}
          <li>${icone("local", 16)}${esc(texto("EMPRESA_ENDERECO"))}</li>
          <li>${icone("relogio", 16)}${esc(texto("EMPRESA_HORARIO"))}</li>
        </ul>
      </div>
    </div>

    <div class="rodape__fim">
      <span>© <span data-ano>2026</span> ${esc(texto("EMPRESA_NOME"))}${cnpj ? ` · CNPJ ${esc(cnpj)}` : " · CNPJ a cadastrar"}</span>
      <a class="dev-credit" href="https://luizaugust.me" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/>
        </svg>
        <span>Desenvolvido por LA</span>
      </a>
    </div>
  </div>
</footer>

${zap ? `<a class="zap" href="https://wa.me/${zap}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
  ${icone("zap", 26)}</a>` : ""}`;
}

/* ==========================================================================
   A PÁGINA INTEIRA
   ========================================================================== */
function pagina({ titulo, descricao, url = "/", corpo, dadosLd = null, classe = "", semIndex = false }) {
  const analytics = texto("SEO_ANALYTICS");
  const pixel = texto("SEO_PIXEL_META");
  const verificacao = texto("SEO_SEARCH_CONSOLE");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Marca que há JavaScript vivo. Os blocos que entram animados só ficam
     escondidos se esta classe existir; sem ela a página abre inteira em vez de
     sumir. Tem de vir antes do CSS, senão eles piscam antes de esconder. -->
<script>document.documentElement.classList.add("js")</script>

<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${SITE}${url}">
${semIndex ? '<meta name="robots" content="noindex,follow">' : ""}
${verificacao ? `<meta name="google-site-verification" content="${esc(verificacao)}">` : ""}

<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(texto("EMPRESA_NOME"))}">
<meta property="og:url" content="${SITE}${url}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:image" content="${SITE}/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#241B63">

<link rel="icon" href="/assets/img/simbolo.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/icone-180.png">
<link rel="manifest" href="/manifest.webmanifest">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500;600;700&display=swap">

<!-- O "?v=" acompanha a versão do pacote: sem ele, uma correção publicada hoje
     só chegaria a quem já visitou o site daqui a uma semana, porque o CSS é
     servido com cache longo. Sem crase aqui: dentro de um template literal ela
     fecha a string e derruba o arquivo inteiro. -->
<link rel="stylesheet" href="/assets/css/base.css?v=${APP_VERSION}">
<link rel="stylesheet" href="/assets/css/site.css?v=${APP_VERSION}">
<script src="/assets/js/site.js?v=${APP_VERSION}" defer></script>
${dadosLd ? `<script type="application/ld+json">${JSON.stringify(dadosLd)}</script>` : ""}
${analytics ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(analytics)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());gtag('config','${esc(analytics)}')</script>` : ""}
${pixel ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;
n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${esc(pixel)}');fbq('track','PageView')</script>` : ""}
</head>

<body${classe ? ` class="${classe}"` : ""}>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${cabecalho(url)}
<main id="conteudo">${corpo}</main>
${rodape()}
</body>
</html>`;
}

/* ==========================================================================
   PEÇAS DE PÁGINA

   Usadas por todas as telas. Uma seção com etiqueta, título e texto aparece
   sete vezes no site; escrita sete vezes, viraria sete espaçamentos
   ligeiramente diferentes.
   ========================================================================== */
function secao({ olho, titulo, texto: t, corpo, fundo = "", id = "", estreita = false }) {
  return `<section class="secao ${fundo}"${id ? ` id="${id}"` : ""}>
  <div class="container${estreita ? " container--estreito" : ""}">
    ${olho || titulo || t ? `<div class="secao__topo" data-revela>
      ${olho ? `<p class="olho">${esc(olho)}</p>` : ""}
      ${titulo ? `<h2>${esc(titulo)}</h2>` : ""}
      ${t ? `<p class="secao__texto">${esc(t)}</p>` : ""}
    </div>` : ""}
    ${corpo || ""}
  </div>
</section>`;
}

/* Cabeçalho das páginas internas. Marinho como o herói da home, mais baixo —
   a página interna não precisa reconquistar quem já entrou. */
function capa({ olho, titulo, texto: t, migalha = [] }) {
  return `<section class="capa">
  <div class="container">
    ${migalha.length ? `<nav class="migalha" aria-label="Você está aqui"><ol>
      <li><a href="/">Início</a></li>
      ${migalha.map((m) => m.href
        ? `<li><a href="${m.href}">${esc(m.rotulo)}</a></li>`
        : `<li aria-current="page">${esc(m.rotulo)}</li>`).join("")}
    </ol></nav>` : ""}
    ${olho ? `<p class="olho">${esc(olho)}</p>` : ""}
    <h1>${esc(titulo)}</h1>
    ${t ? `<p class="capa__texto">${esc(t)}</p>` : ""}
  </div>
</section>`;
}

const botao = (href, rotulo, tipo = "primario", extra = "") =>
  `<a class="btn btn--${tipo}" href="${href}"${extra}>${esc(rotulo)}</a>`;

module.exports = { pagina, secao, capa, botao, icone, esc, dinheiro, soDigitos, MENU, SITE, APP_VERSION };
