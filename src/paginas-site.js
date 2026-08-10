/* ==========================================================================
   INNOVAR — telas do site (tudo que não é loja)

   Cada função devolve o HTML do MIOLO; o cabeçalho, o rodapé e o `<head>` vêm
   do layout. Nenhuma delas escreve texto fixo de tela: tudo sai de `texto()`
   ou do banco, senão o painel deixaria de ser verdade.
   ========================================================================== */
"use strict";

const { pagina, secao, capa, botao, icone, esc, dinheiro, soDigitos, SITE } = require("./layout");
const { texto } = require("./textos");
const repo = require("./repo");

/* Lista digitada com uma linha por item vira `<ul>`. É o formato que o cliente
   entende no painel — enter para o próximo item — sem editor de HTML. */
const listaDeLinhas = (s, classe = "") => {
  const itens = String(s || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!itens.length) return "";
  return `<ul class="${classe}">${itens.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
};

/* A FOTO É OPCIONAL, e o cartão continua inteiro sem ela — o ícone da marca
   ocupa o lugar. Um cartão que só funciona com foto é um cartão que quebra na
   primeira frente de serviço que o cliente cadastrar sem imagem.

   `loading="lazy"` em tudo que não é a primeira dobra, e proporção declarada
   por `width`/`height`: sem a proporção a página pula quando a foto chega, e o
   dedo que já estava indo acerta o botão errado. */
const cartaoServico = (s) => `
<a class="card card--link serv${s.imagem ? " serv--foto" : ""}" href="/servicos/${esc(s.slug)}/" data-revela>
  ${s.imagem
    ? `<span class="serv__capa"><img src="${esc(s.imagem)}" alt="" width="400" height="300" loading="lazy">
        <span class="serv__icone serv__icone--sobre">${icone(s.icone, 22)}</span></span>`
    : `<span class="serv__icone">${icone(s.icone, 26)}</span>`}
  <span class="serv__texto">
    <h3>${esc(s.nome)}</h3>
    <p>${esc(s.resumo)}</p>
    <span class="serv__link">Ver o que inclui ${icone("seta", 16)}</span>
  </span>
</a>`;

/* ============================================================== início ==== */
function home() {
  const servicos = repo.servicosAtivos();
  const destaques = repo.produtos({ porPagina: 4 }).itens;
  const materias = repo.materias(3);
  /* A prova entra ANTES do "como funciona": quem ainda está decidindo quer ver
     que já foi feito, e só depois se interessa pelo processo. */
  const obrasNaHome = repo.obras({ limite: 3 });

  const corpo = `
<section class="heroi">
  <div class="container heroi__grade">
    <div>
      <p class="olho">${esc(texto("HOME_OLHO"))}</p>
      <h1>${esc(texto("HOME_TITULO"))}</h1>
      <p class="heroi__texto">${esc(texto("HOME_TEXTO"))}</p>
      <div class="heroi__acoes">
        ${botao("/orcamento/", texto("HOME_BOTAO1"), "primario")}
        ${botao("/loja/", texto("HOME_BOTAO2"), "claro")}
      </div>
    </div>

    <!-- Os três selos respondem à primeira dúvida de quem contrata — "vocês
         fazem do meu porte, e com documento?" — antes de qualquer botão. É o
         degrau onde o funil quebra. -->
    <div class="selos">
      ${[1, 2, 3].map((n) => `<div class="selo" data-revela>
        <b>${esc(texto(`HOME_SELO${n}_T`))}</b>
        <span>${esc(texto(`HOME_SELO${n}_D`))}</span>
      </div>`).join("")}
    </div>
  </div>
</section>

${secao({
    olho: texto("HOME_SERV_OLHO"), titulo: texto("HOME_SERV_TITULO"), texto: texto("HOME_SERV_TEXTO"),
    corpo: `<div class="grade grade--4">${servicos.map(cartaoServico).join("")}</div>`,
  })}

${obrasNaHome.length ? secao({
    olho: texto("OBRAS_HOME_OLHO"), titulo: texto("OBRAS_HOME_TITULO"), fundo: "secao--gelo",
    corpo: `<div class="grade grade--3">${obrasNaHome.map(cartaoObra).join("")}</div>
      <p class="secao__pe">${botao("/obras/", "Ver todas as obras", "contorno")}</p>`,
  }) : ""}

${secao({
    olho: texto("HOME_PASSOS_OLHO"), titulo: texto("HOME_PASSOS_TITULO"),
    corpo: `<div class="passos">${[1, 2, 3, 4].map((n) => `<div class="passo" data-revela>
      <h3>${esc(texto(`HOME_PASSO${n}_T`))}</h3>
      <p>${esc(texto(`HOME_PASSO${n}_D`))}</p></div>`).join("")}</div>`,
  })}

${secao({
    olho: texto("HOME_LOJA_OLHO"), titulo: texto("HOME_LOJA_TITULO"), texto: texto("HOME_LOJA_TEXTO"),
    corpo: `<div class="grade grade--4">${destaques.map(cartaoProduto).join("")}</div>
      <p class="secao__pe">${botao("/loja/", "Ver a loja inteira", "contorno")}</p>`,
  })}

${materias.length ? secao({
    olho: "Do feed", titulo: texto("FEED_TITULO"), fundo: "secao--gelo",
    corpo: `<div class="grade grade--3">${materias.map(cartaoMateria).join("")}</div>`,
  }) : ""}

<section class="chamada">
  <div class="container chamada__grade" data-revela>
    <div>
      <p class="olho">${esc(texto("HOME_CTA_OLHO"))}</p>
      <h2>${esc(texto("HOME_CTA_TITULO"))}</h2>
      <p>${esc(texto("HOME_CTA_TEXTO"))}</p>
    </div>
    <div class="chamada__acoes">
      ${botao("/orcamento/", "Pedir orçamento", "primario")}
      ${botao("/contato/", "Falar com a equipe", "claro")}
    </div>
  </div>
</section>`;

  return pagina({
    titulo: texto("SEO_TITULO"),
    descricao: texto("SEO_DESCRICAO"),
    url: "/",
    corpo,
    dadosLd: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: texto("EMPRESA_NOME"),
      url: SITE + "/",
      image: SITE + "/assets/img/og.png",
      description: texto("SEO_DESCRICAO"),
      telephone: texto("EMPRESA_TELEFONE") || undefined,
      email: texto("EMPRESA_EMAIL") || undefined,
      address: { "@type": "PostalAddress", streetAddress: texto("EMPRESA_ENDERECO"), addressLocality: "Caruaru", addressRegion: "PE", addressCountry: "BR" },
      areaServed: [{ "@type": "City", name: "Caruaru" }, { "@type": "AdministrativeArea", name: "Agreste Pernambucano" }],
      makesOffer: servicos.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.nome, url: `${SITE}/servicos/${s.slug}/` } })),
    },
  });
}

/* ============================================================ serviços ==== */
function servicos() {
  const lista = repo.servicosAtivos();
  return pagina({
    titulo: `${texto("SERV_TITULO")} — ${texto("EMPRESA_NOME")}`,
    descricao: texto("SERV_TEXTO"),
    url: "/servicos/",
    corpo: capa({ olho: "O que fazemos", titulo: texto("SERV_TITULO"), texto: texto("SERV_TEXTO"), migalha: [{ rotulo: "Serviços" }] })
      + secao({ corpo: `<div class="grade grade--2">${lista.map(cartaoServico).join("")}</div>` })
      + chamadaFinal(),
  });
}

function servico(s) {
  const corpo = capa({
    olho: "Serviço", titulo: s.nome, texto: s.chamada,
    migalha: [{ rotulo: "Serviços", href: "/servicos/" }, { rotulo: s.nome }],
  }) + `
<section class="secao">
  <div class="container servico__grade">
    <article class="prosa" data-revela>
      ${s.imagem ? `<img class="prosa__foto" src="${esc(s.imagem)}" alt="${esc(s.nome)}"
        width="1200" height="900" fetchpriority="high">` : ""}
      ${s.corpo}
    </article>

    <aside class="lateral">
      <!-- "O QUE NÃO ESTÁ INCLUÍDO" é a parte que mais evita atrito, e por isso
           fica na mesma altura do que está: escopo aberto no começo é
           discussão evitada no fim, e quem lê isso aqui não se sente enganado
           depois. -->
      <div class="card" data-revela>
        <h3 class="lateral__titulo">${icone("ok", 18)} Está incluído</h3>
        ${listaDeLinhas(s.inclui, "lista lista--ok")}
      </div>
      <div class="card" data-revela>
        <h3 class="lateral__titulo">${icone("nao", 18)} Não está incluído</h3>
        ${listaDeLinhas(s.nao_inclui, "lista lista--nao")}
      </div>
      ${s.prazo ? `<div class="card card--marca" data-revela>
        <h3 class="lateral__titulo">${icone("relogio", 18)} Prazo típico</h3>
        <p>${esc(s.prazo)}</p>
      </div>` : ""}
      <div class="lateral__acao">${botao(`/orcamento/?servico=${encodeURIComponent(s.slug)}`, "Pedir orçamento deste serviço", "primario")}</div>
    </aside>
  </div>
</section>` + obrasDoServico(s) + outrosServicos(s.slug) + chamadaFinal();

  return pagina({
    titulo: `${s.nome} em Caruaru — ${texto("EMPRESA_NOME")}`,
    descricao: s.resumo,
    url: `/servicos/${s.slug}/`,
    corpo,
    dadosLd: {
      "@context": "https://schema.org", "@type": "Service",
      name: s.nome, description: s.resumo, serviceType: s.nome,
      provider: { "@type": "LocalBusiness", name: texto("EMPRESA_NOME"), url: SITE + "/" },
      areaServed: [{ "@type": "City", name: "Caruaru" }, { "@type": "AdministrativeArea", name: "Agreste Pernambucano" }],
    },
  });
}

/* As obras DAQUELA frente, dentro da página do serviço. É onde a prova pesa
   mais: a pessoa acabou de ler o que está incluído e a pergunta seguinte é
   "vocês já fizeram isso?". Mandar ela ao portfólio geral para descobrir
   sozinha é perder o momento. */
const obrasDoServico = (s) => {
  const lista = repo.obras({ servico: s.slug, limite: 3 });
  if (!lista.length) return "";
  return secao({
    olho: "Prova", titulo: `Obras de ${s.nome.toLowerCase()}`, fundo: "secao--gelo",
    corpo: `<div class="grade grade--3">${lista.map(cartaoObra).join("")}</div>
      <p class="secao__pe">${botao(`/obras/?servico=${encodeURIComponent(s.slug)}`, "Ver todas desta frente", "contorno")}</p>`,
  });
};

const outrosServicos = (slugAtual) => {
  const outros = repo.servicosAtivos().filter((s) => s.slug !== slugAtual);
  if (!outros.length) return "";
  return secao({ titulo: "Outras frentes", fundo: "secao--gelo",
    corpo: `<div class="grade grade--3">${outros.map(cartaoServico).join("")}</div>` });
};

/* ================================================================ obras === */
/* O cartão do portfólio mostra PORTE E LOCAL antes do texto. É o que o
   responsável de obra usa para decidir se aquilo se parece com o caso dele —
   e é a pergunta que ele faria em dez segundos de conversa. */
const cartaoObra = (o) => `
<a class="card card--link obra" href="/obras/${esc(o.slug)}/" data-revela>
  ${o.foto ? `<span class="obra__foto"><img src="${esc(o.foto)}" alt="" width="480" height="360" loading="lazy">
    ${o.servico ? `<span class="obra__marca">${esc(o.servico)}</span>` : ""}</span>` : ""}
  <span class="obra__corpo">
    <span class="obra__meta">${[o.local, o.ano].filter(Boolean).map(esc).join(" · ")}</span>
    <h3>${esc(o.titulo)}</h3>
    <p>${esc(o.resumo)}</p>
    ${o.porte ? `<span class="obra__porte">${icone("doc", 15)} ${esc(o.porte)}</span>` : ""}
    <span class="serv__link">Ver a obra ${icone("seta", 16)}</span>
  </span>
</a>`;

/* O aviso de exemplo aparece SEMPRE que houver obra semeada no ar — não é
   discreto de propósito. Portfólio é afirmação de fato: obra que não aconteceu
   publicada como real é uma mentira contada ao cliente do cliente, e o custo
   dela chega quando alguém pede a referência. */
const avisoExemplo = () => repo.temObraDeExemplo() ? `
<div class="aviso aviso--atencao" role="status">
  ${icone("nao", 18)}
  <span><strong>Estas obras são exemplos, não trabalhos executados.</strong>
  Foram cadastradas para você ver a tela funcionando. Troque por obras reais no
  painel antes de divulgar o site — nenhum nome de cliente foi inventado, mas os
  casos não aconteceram.</span>
</div>` : "";

function obras(servicoEscolhido = null) {
  const lista = repo.obras({ servico: servicoEscolhido });
  const frentes = repo.servicosComObra();
  const atual = frentes.find((f) => f.slug === servicoEscolhido);

  const filtro = (slug, rotulo, quantas) => {
    const aqui = (slug || null) === servicoEscolhido;
    return `<a class="chip${aqui ? " chip--ativo" : ""}" href="/obras/${slug ? `?servico=${encodeURIComponent(slug)}` : ""}"
      ${aqui ? 'aria-current="true"' : ""}>${esc(rotulo)}${quantas != null ? ` <span>${quantas}</span>` : ""}</a>`;
  };

  const corpo = capa({
    olho: "Portfólio",
    titulo: atual ? atual.nome : texto("OBRAS_TITULO"),
    texto: atual ? "" : texto("OBRAS_TEXTO"),
    migalha: atual ? [{ rotulo: "Obras", href: "/obras/" }, { rotulo: atual.nome }] : [{ rotulo: "Obras" }],
  }) + `
<section class="secao">
  <div class="container">
    ${avisoExemplo()}
    ${frentes.length > 1 ? `<nav class="chips" aria-label="Filtrar por serviço">
      ${filtro("", "Todas", repo.obras().length)}
      ${frentes.map((f) => filtro(f.slug, f.nome, f.quantas)).join("")}
    </nav>` : ""}

    ${lista.length
      ? `<div class="grade grade--3">${lista.map(cartaoObra).join("")}</div>`
      : `<p class="vazio">${esc(texto("OBRAS_VAZIO"))}</p>`}
  </div>
</section>` + chamadaFinal();

  return pagina({
    titulo: `${texto("OBRAS_TITULO")} — ${texto("EMPRESA_NOME")}`,
    descricao: texto("OBRAS_TEXTO"),
    url: "/obras/", corpo,
  });
}

function obra(o) {
  const ficha = [
    ["Local", o.local], ["Ano", o.ano], ["Porte", o.porte],
    ["Duração", o.duracao], ["Frente", o.servico], ["Cliente", o.cliente],
  ].filter(([, v]) => v);

  /* Desafio → solução → resultado, nesta ordem, porque é a ordem em que a
     pergunta chega: "o que estava acontecendo?", "o que vocês fizeram?", "e
     resolveu?". Começar pela solução responde algo que ninguém perguntou. */
  const bloco = (titulo, txt) => txt ? `<div class="obra__bloco" data-revela>
    <h2>${esc(titulo)}</h2><p>${esc(txt)}</p></div>` : "";

  const corpo = capa({
    olho: o.servico || "Obra", titulo: o.titulo, texto: o.resumo,
    migalha: [{ rotulo: "Obras", href: "/obras/" }, { rotulo: o.titulo }],
  }) + `
<section class="secao">
  <div class="container obra__grade">
    <div>
      ${o.exemplo ? avisoExemplo() : ""}
      ${o.foto ? `<img class="prosa__foto" src="${esc(o.foto)}" alt="${esc(o.titulo)}"
        width="1200" height="900" fetchpriority="high">` : ""}
      ${bloco("O problema", o.desafio)}
      ${bloco("O que foi feito", o.solucao)}
      ${bloco("O resultado", o.resultado)}
    </div>

    <aside class="lateral">
      <div class="card" data-revela>
        <h3 class="lateral__titulo">${icone("doc", 18)} A obra</h3>
        <dl class="dados dados--ficha">
          ${ficha.map(([r, v]) => `<dt>${esc(r)}</dt><dd>${esc(v)}</dd>`).join("")}
        </dl>
      </div>
      ${o.escopo ? `<div class="card" data-revela>
        <h3 class="lateral__titulo">${icone("ok", 18)} O que entrou</h3>
        ${listaDeLinhas(o.escopo, "lista lista--ok")}
      </div>` : ""}
      <div class="lateral__acao">
        ${botao(`/orcamento/${o.servico_slug ? `?servico=${encodeURIComponent(o.servico_slug)}` : ""}`,
          "Quero algo parecido", "primario")}
        ${o.servico_slug ? botao(`/servicos/${esc(o.servico_slug)}/`, "Ver o serviço", "contorno") : ""}
      </div>
    </aside>
  </div>
</section>` + outrasObras(o.slug) + chamadaFinal();

  return pagina({
    titulo: `${o.titulo} — ${texto("EMPRESA_NOME")}`,
    descricao: o.resumo, url: `/obras/${o.slug}/`, corpo,
  });
}

const outrasObras = (slugAtual) => {
  const outras = repo.obras({ limite: 4 }).filter((o) => o.slug !== slugAtual).slice(0, 3);
  if (!outras.length) return "";
  return secao({ titulo: "Outras obras", fundo: "secao--gelo",
    corpo: `<div class="grade grade--3">${outras.map(cartaoObra).join("")}</div>` });
};

/* ============================================================== empresa === */
function empresa() {
  const corpo = capa({ olho: "A empresa", titulo: texto("EMPRESA_TITULO"), migalha: [{ rotulo: "A empresa" }] })
    + secao({ estreita: true, corpo: `<div class="prosa" data-revela>${texto("EMPRESA_TEXTO")}</div>` })
    + secao({ fundo: "secao--gelo", titulo: "Como trabalhamos",
      corpo: `<div class="grade grade--3">${[1, 2, 3].map((n) => `<div class="card" data-revela>
        <h3>${esc(texto(`EMPRESA_VALOR${n}_T`))}</h3>
        <p>${esc(texto(`EMPRESA_VALOR${n}_D`))}</p></div>`).join("")}</div>` })
    + chamadaFinal();

  return pagina({
    titulo: `A empresa — ${texto("EMPRESA_NOME")}`,
    descricao: "Quem é a INNOVAR, como trabalhamos e por que o escopo vem por escrito.",
    url: "/empresa/", corpo,
  });
}

/* ============================================================== contato === */
function contato() {
  const zap = soDigitos(texto("EMPRESA_ZAP"));
  const tel = soDigitos(texto("EMPRESA_TELEFONE_LINK"));
  const email = texto("EMPRESA_EMAIL");

  const canal = (icn, rotulo, valor, href) => `<div class="card canal" data-revela>
    <span class="canal__icone">${icone(icn, 22)}</span>
    <h3>${esc(rotulo)}</h3>
    ${valor ? (href ? `<a class="canal__valor" href="${href}">${esc(valor)}</a>` : `<p class="canal__valor">${esc(valor)}</p>`)
      : `<p class="canal__vazio">A cadastrar no painel</p>`}
  </div>`;

  const corpo = capa({ olho: "Contato", titulo: texto("CONTATO_TITULO"), texto: texto("CONTATO_TEXTO"), migalha: [{ rotulo: "Contato" }] })
    + secao({ corpo: `<div class="grade grade--4">
        ${canal("zap", "WhatsApp", zap ? texto("EMPRESA_TELEFONE") || "Chamar" : "", zap ? `https://wa.me/${zap}` : "")}
        ${canal("relogio", "Telefone", texto("EMPRESA_TELEFONE"), tel ? `tel:+${tel}` : "")}
        ${canal("email", "E-mail", email, email ? `mailto:${esc(email)}` : "")}
        ${canal("local", "Endereço", texto("EMPRESA_ENDERECO"), texto("EMPRESA_MAPA") || "")}
      </div>
      <p class="secao__pe secao__pe--nota">${icone("relogio", 16)} ${esc(texto("EMPRESA_HORARIO"))}</p>` })
    + secao({ fundo: "secao--gelo", titulo: "Ou mande pelo formulário",
      texto: "Chega no mesmo lugar, com os dados já organizados.", estreita: true,
      corpo: formularioOrcamento("") })
    ;

  return pagina({
    titulo: `Contato — ${texto("EMPRESA_NOME")}`,
    descricao: texto("CONTATO_TEXTO"),
    url: "/contato/", corpo,
  });
}

/* ============================================================ orçamento === */
function formularioOrcamento(servicoEscolhido) {
  const lista = repo.servicosAtivos();
  return `
<form class="form card" method="post" action="/orcamento/" data-envia data-revela>
  <div class="form__linha">
    <label class="campo"><span>Seu nome <b aria-hidden="true">*</b></span>
      <input name="nome" required maxlength="120" autocomplete="name"></label>
    <label class="campo"><span>Empresa</span>
      <input name="empresa" maxlength="120" autocomplete="organization"></label>
  </div>

  <div class="form__linha">
    <!-- O type="tel" e o inputmode abrem o teclado numérico no celular. Metade
         dos pedidos chega do telefone; teclado errado é campo abandonado. -->
    <label class="campo"><span>Telefone ou WhatsApp <b aria-hidden="true">*</b></span>
      <input name="telefone" type="tel" inputmode="tel" required maxlength="20" autocomplete="tel"></label>
    <label class="campo"><span>E-mail</span>
      <input name="email" type="email" maxlength="160" autocomplete="email"></label>
  </div>

  <div class="form__linha">
    <label class="campo"><span>Cidade</span>
      <input name="cidade" maxlength="80" value="Caruaru" autocomplete="address-level2"></label>
    <label class="campo"><span>Qual serviço</span>
      <select name="servico">
        <option value="">Ainda não sei / outro</option>
        ${lista.map((s) => `<option value="${esc(s.slug)}"${s.slug === servicoEscolhido ? " selected" : ""}>${esc(s.nome)}</option>`).join("")}
      </select></label>
  </div>

  <label class="campo"><span>Para quando</span>
    <select name="prazo">
      <option value="">Sem prazo definido</option>
      <option>É urgente</option>
      <option>Nas próximas duas semanas</option>
      <option>Neste mês</option>
      <option>Estou só levantando preço</option>
    </select></label>

  <label class="campo"><span>Conte o que precisa <b aria-hidden="true">*</b></span>
    <textarea name="mensagem" required rows="5" maxlength="2000"
      placeholder="Onde é, o que está acontecendo e o que você já tentou. Metragem e fotos ajudam."></textarea></label>

  <!-- Campo de armadilha: invisível para gente, irresistível para robô de
       formulário. Preenchido, o envio é descartado em silêncio — responder
       "erro" ensinaria o robô a tentar de novo sem preencher. -->
  <div class="armadilha" aria-hidden="true">
    <label>Não preencha este campo<input name="apelido" tabindex="-1" autocomplete="off"></label>
  </div>

  <div class="form__pe">
    <button class="btn btn--primario" type="submit">Enviar pedido</button>
    <p class="form__nota">Ao enviar você concorda com a nossa
      <a href="/privacidade/">política de privacidade</a>. Não mandamos propaganda.</p>
  </div>
</form>`;
}

function orcamento(servicoEscolhido = "") {
  const corpo = capa({ olho: "Orçamento", titulo: texto("ORC_TITULO"), texto: texto("ORC_TEXTO"), migalha: [{ rotulo: "Orçamento" }] })
    + secao({ estreita: true, corpo: formularioOrcamento(servicoEscolhido) });

  return pagina({
    titulo: `${texto("ORC_TITULO")} — ${texto("EMPRESA_NOME")}`,
    descricao: texto("ORC_TEXTO"), url: "/orcamento/", corpo,
  });
}

function orcamentoEnviado(protocolo) {
  const corpo = capa({ olho: "Recebido", titulo: "Pedido enviado", migalha: [{ rotulo: "Orçamento", href: "/orcamento/" }, { rotulo: "Enviado" }] })
    + secao({ estreita: true, corpo: `<div class="card card--marca recibo" data-revela>
        <p>${esc(texto("ORC_OBRIGADO"))}</p>
        <p class="recibo__protocolo">${esc(protocolo)}</p>
        <p>${botao("/", "Voltar ao início", "contorno")} ${botao("/loja/", "Ver a loja", "contorno")}</p>
      </div>` });

  return pagina({ titulo: `Pedido enviado — ${texto("EMPRESA_NOME")}`,
    descricao: "Recebemos o seu pedido de orçamento.", url: "/orcamento/", corpo, semIndex: true });
}

/* ================================================================= feed === */
const cartaoMateria = (m) => `
<a class="card card--link materia${m.capa ? " materia--capa" : ""}" href="/feed/${esc(m.slug)}/" data-revela>
  ${m.capa ? `<span class="materia__capa"><img src="${esc(m.capa)}" alt="" width="400" height="260" loading="lazy"></span>` : ""}
  <span class="materia__texto">
    <span class="materia__data">${dataLonga(m.publicado_em)}</span>
    <h3>${esc(m.titulo)}</h3>
    <p>${esc(m.resumo)}</p>
    <span class="serv__link">Ler ${icone("seta", 16)}</span>
  </span>
</a>`;

/* A data vem do SQLite como "2026-06-18 09:00:00". `new Date` nessa string é
   interpretado como UTC em alguns navegadores e local em outros — por isso a
   formatação é feita na mão, sem fuso no meio. */
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function dataLonga(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = String(iso).slice(0, 10).split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

function feed() {
  const lista = repo.materias(30);
  const corpo = capa({ olho: "Feed", titulo: texto("FEED_TITULO"), texto: texto("FEED_TEXTO"), migalha: [{ rotulo: "Feed" }] })
    + secao({ corpo: lista.length
      ? `<div class="grade grade--3">${lista.map(cartaoMateria).join("")}</div>`
      : `<p class="vazio">Ainda não há matérias publicadas.</p>` })
    + chamadaFinal();

  return pagina({ titulo: `${texto("FEED_TITULO")} — ${texto("EMPRESA_NOME")}`,
    descricao: texto("FEED_TEXTO"), url: "/feed/", corpo });
}

function materia(m) {
  const outras = repo.materias(4).filter((x) => x.slug !== m.slug).slice(0, 3);
  const corpo = capa({ olho: dataLonga(m.publicado_em), titulo: m.titulo,
    migalha: [{ rotulo: "Feed", href: "/feed/" }, { rotulo: m.titulo }] })
    + secao({ estreita: true, corpo: `<article class="prosa prosa--materia" data-revela>
        ${m.capa ? `<img class="prosa__foto" src="${esc(m.capa)}" alt="" width="1200" height="780" fetchpriority="high">` : ""}
        ${m.corpo}
      </article>
      <p class="materia__autor">${esc(m.autor)}</p>` })
    + (outras.length ? secao({ titulo: "Continue lendo", fundo: "secao--gelo",
      corpo: `<div class="grade grade--3">${outras.map(cartaoMateria).join("")}</div>` }) : "")
    + chamadaFinal();

  return pagina({
    titulo: `${m.titulo} — ${texto("EMPRESA_NOME")}`,
    descricao: m.resumo, url: `/feed/${m.slug}/`, corpo,
    dadosLd: {
      "@context": "https://schema.org", "@type": "Article",
      headline: m.titulo, description: m.resumo,
      datePublished: String(m.publicado_em || "").replace(" ", "T"),
      author: { "@type": "Organization", name: m.autor },
      publisher: { "@type": "Organization", name: texto("EMPRESA_NOME") },
      mainEntityOfPage: `${SITE}/feed/${m.slug}/`,
    },
  });
}

/* ================================================================ busca === */
function busca(termo) {
  const t = String(termo || "").trim();
  const r = t.length >= 2 ? repo.buscar(t) : null;
  const quantos = r ? r.produtos.length + r.servicos.length + r.materias.length : 0;

  const bloco = (titulo, itens, monta) => itens.length
    ? `<div class="busca__grupo"><h2>${esc(titulo)}</h2><div class="grade grade--3">${itens.map(monta).join("")}</div></div>` : "";

  const corpo = capa({ olho: "Busca", titulo: "Buscar no site", migalha: [{ rotulo: "Busca" }] })
    + secao({ corpo: `
      <form class="busca__form card" method="get" action="/busca/" role="search">
        <label class="campo campo--busca"><span class="sr-only">O que você procura</span>
          <input name="q" value="${esc(t)}" placeholder="Tubo 25 mm, hidrante, vazamento…"
                 autofocus maxlength="80" type="search"></label>
        <button class="btn btn--primario" type="submit">Buscar</button>
      </form>

      ${!r ? `<p class="vazio">Digite ao menos duas letras.</p>`
        : quantos === 0 ? `<div class="vazio">
            <p>Nada encontrado para <strong>${esc(t)}</strong>.</p>
            <p>Se for material que a gente não tem no site, ${botao("/contato/", "pergunte pelo WhatsApp", "contorno")} — boa parte do estoque da loja física não está aqui.</p>
          </div>`
        : `<p class="busca__resumo">${quantos} resultado${quantos > 1 ? "s" : ""} para <strong>${esc(t)}</strong>.</p>
          ${bloco("Produtos", r.produtos, (p) => `<a class="card card--link" href="/produto/${esc(p.slug)}/" data-revela>
            <h3>${esc(p.nome)}</h3><p class="prod__preco">${dinheiro(p.preco_cent)} <span class="prod__un">/ ${esc(p.unidade)}</span></p></a>`)}
          ${bloco("Serviços", r.servicos, (s) => `<a class="card card--link" href="/servicos/${esc(s.slug)}/" data-revela>
            <h3>${esc(s.nome)}</h3><p>${esc(s.resumo)}</p></a>`)}
          ${bloco("Feed", r.materias, (m) => `<a class="card card--link" href="/feed/${esc(m.slug)}/" data-revela>
            <h3>${esc(m.titulo)}</h3><p>${esc(m.resumo)}</p></a>`)}`}` });

  return pagina({ titulo: t ? `Busca por ${t} — ${texto("EMPRESA_NOME")}` : `Buscar — ${texto("EMPRESA_NOME")}`,
    descricao: "Busca no site da INNOVAR.", url: "/busca/", corpo, semIndex: true });
}

/* ========================================================== privacidade === */
function privacidade() {
  const corpo = capa({ olho: "Legal", titulo: "Política de privacidade", migalha: [{ rotulo: "Privacidade" }] })
    + secao({ estreita: true, corpo: `<div class="prosa" data-revela>${texto("PRIV_TEXTO")}</div>` });
  return pagina({ titulo: `Política de privacidade — ${texto("EMPRESA_NOME")}`,
    descricao: "Como a INNOVAR trata os dados coletados neste site.", url: "/privacidade/", corpo });
}

/* ========================================================= não encontrado = */
function naoEncontrado() {
  const corpo = capa({ olho: "Erro 404", titulo: "Esta página não existe" })
    + secao({ estreita: true, corpo: `<div class="card" data-revela>
        <p>O endereço pode ter mudado. Estes são os caminhos mais procurados:</p>
        <p class="form__pe">${botao("/servicos/", "Serviços", "contorno")} ${botao("/loja/", "Loja", "contorno")}
          ${botao("/orcamento/", "Pedir orçamento", "primario")}</p>
      </div>` });
  return pagina({ titulo: "Página não encontrada — INNOVAR", descricao: "Página não encontrada.",
    url: "/404", corpo, semIndex: true });
}

/* --------------------------------------------------------------- comuns --- */
function chamadaFinal() {
  return `<section class="chamada">
  <div class="container chamada__grade" data-revela>
    <div>
      <h2>${esc(texto("HOME_CTA_TITULO"))}</h2>
      <p>${esc(texto("HOME_CTA_TEXTO"))}</p>
    </div>
    <div class="chamada__acoes">
      ${botao("/orcamento/", "Pedir orçamento", "primario")}
      ${botao("/contato/", "Falar com a equipe", "claro")}
    </div>
  </div>
</section>`;
}

/* O cartão de produto vive aqui porque a home também o usa; a loja o importa
   daqui em vez de manter uma segunda versão que iria divergir. */
function cartaoProduto(p) {
  const esgotado = p.estoque <= 0;
  return `<article class="card prod${esgotado ? " prod--esgotado" : ""}" data-revela>
  <a class="prod__foto" href="/produto/${esc(p.slug)}/" aria-label="${esc(p.nome)}">
    ${p.foto ? `<img src="${esc(p.foto)}" alt="" loading="lazy" width="400" height="300">`
      : `<span class="prod__sem-foto">${icone("gota", 30)}</span>`}
    ${esgotado ? `<span class="prod__tarja">Sem estoque</span>` : ""}
  </a>
  <div class="prod__corpo">
    ${p.marca ? `<p class="prod__marca">${esc(p.marca)}</p>` : ""}
    <h3 class="prod__nome"><a href="/produto/${esc(p.slug)}/">${esc(p.nome)}</a></h3>
    <p class="prod__preco">${dinheiro(p.preco_cent)}
      <span class="prod__un">/ ${esc(p.unidade)}</span></p>
    <div class="prod__pe">
      ${esgotado
        ? `<a class="btn btn--contorno btn--peq" href="/contato/">Avise-me</a>`
        : `<button class="btn btn--primario btn--peq" data-add="${esc(p.sku)}" type="button">Adicionar</button>`}
    </div>
  </div>
</article>`;
}

module.exports = {
  home, servicos, servico, obras, obra, empresa, contato, orcamento, orcamentoEnviado,
  feed, materia, busca, privacidade, naoEncontrado,
  cartaoProduto, listaDeLinhas, dataLonga, chamadaFinal,
};
