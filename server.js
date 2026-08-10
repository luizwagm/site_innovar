/* ==========================================================================
   INNOVAR — servidor

   Escuta só em 127.0.0.1: quem fala com a internet é o nginx, com TLS, limites
   e cabeçalhos. Sem isto a porta ficaria exposta direto, contornando os três.

   As páginas são MONTADAS A CADA PEDIDO a partir do banco. A alternativa —
   arquivos HTML reescritos por um passo de publicação — obriga o cabeçalho e o
   rodapé a existirem copiados em cada arquivo, e é assim que um site termina
   com três CNPJs diferentes no rodapé. Montar na hora custa menos de um
   milissegundo com SQLite local, e faz "editou no painel, mudou no site" ser
   verdade sem passo intermediário nenhum.
   ========================================================================== */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const { semear } = require("./src/semear");
const { texto } = require("./src/textos");
const { SITE, APP_VERSION } = require("./src/layout");
const site = require("./src/paginas-site");
const lojaPag = require("./src/paginas-loja");
const repo = require("./src/repo");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5195;
const HOST = process.env.HOST || "127.0.0.1";

semear();

/* ==========================================================================
   ARQUIVOS ESTÁTICOS

   Lista de PERMITIDOS, e por LUGAR — não por extensão. A versão anterior deste
   arquivo autorizava por extensão, e `.js` precisa ser permitido por causa de
   `assets/js/site.js`: resultado, `GET /server.js` respondia 200 e entregava
   este código inteiro. Conferido com curl, não deduzido.

   Agora sai pelo HTTP só o que está dentro de `assets/` e os arquivos de raiz
   nomeados um a um. Esquecer de proibir faz vazar em silêncio; esquecer de
   permitir faz sumir uma página, e alguém avisa no mesmo dia.
   ========================================================================== */
const TIPOS = {
  ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".webmanifest": "application/manifest+json",
};
const RAIZ_PUBLICA = new Set(["manifest.webmanifest", "favicon.ico"]);

function arquivoPermitido(rel) {
  const partes = rel.split(/[\\/]+/).filter(Boolean).map((p) => p.toLowerCase());
  if (!partes.length || partes.some((p) => p.startsWith("."))) return false;
  if (!Object.prototype.hasOwnProperty.call(TIPOS, path.extname(rel).toLowerCase())) return false;
  if (partes[0] === "assets") return true;
  return partes.length === 1 && RAIZ_PUBLICA.has(partes[0]);
}

function servirArquivo(req, res, rel) {
  /* `path.normalize` resolve `..`; a conferência é contra o caminho absoluto e
     DEPOIS de resolvido — comparar antes deixaria passar `%2e%2e%2f`, que só
     vira `..` depois de decodificado. */
  const alvo = path.resolve(ROOT, path.normalize(rel));
  if (!alvo.startsWith(ROOT + path.sep) || !arquivoPermitido(path.relative(ROOT, alvo))) return false;

  let conteudo;
  try { conteudo = fs.readFileSync(alvo); } catch { return false; }

  const ext = path.extname(alvo).toLowerCase();
  res.writeHead(200, {
    ...CABECALHOS_SEGURANCA,
    "Content-Type": TIPOS[ext],
    /* Cache longo é seguro porque o endereço carrega `?v=` com a versão do
       pacote: subiu a versão, muda o endereço, o navegador baixa de novo. */
    "Cache-Control": "public, max-age=604800",
  });
  res.end(req.method === "HEAD" ? undefined : conteudo);
  return true;
}

/* ==========================================================================
   CABEÇALHOS

   `Content-Security-Policy` sem `unsafe-eval` e sem host solto: script só do
   próprio site e dos dois endereços de medição que o cliente pode ligar no
   painel. É a diferença entre um XSS virar roubo de sessão e virar nada.
   `unsafe-inline` em script continua necessário por causa da linha que marca
   `js` no `<html>` e dos trechos do Analytics e do pixel.
   ========================================================================== */
const CABECALHOS_SEGURANCA = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://www.googletagmanager.com https://www.facebook.com",
    "connect-src 'self' https://www.google-analytics.com https://connect.facebook.net",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
  ].join("; "),
};

const responder = (res, html, status = 200) => {
  res.writeHead(status, {
    ...CABECALHOS_SEGURANCA,
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(html);
};

const responderTexto = (res, corpo, tipo, status = 200) => {
  res.writeHead(status, { ...CABECALHOS_SEGURANCA, "Content-Type": tipo, "Cache-Control": "public, max-age=3600" });
  res.end(corpo);
};

const responderJson = (res, dados, status = 200) => {
  res.writeHead(status, { ...CABECALHOS_SEGURANCA, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(dados));
};

const irPara = (res, destino) => { res.writeHead(303, { Location: destino }); res.end(); };

/* ==========================================================================
   CORPO DO PEDIDO

   Limite de 64 kB e corte na hora: sem teto, um POST longo obriga o processo a
   juntar tudo na memória antes de descobrir que era lixo. Um formulário de
   orçamento não passa de alguns kilobytes.
   ========================================================================== */
const LIMITE_CORPO = 64 * 1024;

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let bruto = "", tamanho = 0;
    req.on("data", (p) => {
      tamanho += p.length;
      if (tamanho > LIMITE_CORPO) { req.destroy(); return reject(new Error("corpo grande demais")); }
      bruto += p;
    });
    req.on("end", () => {
      const tipo = String(req.headers["content-type"] || "");
      try {
        if (tipo.includes("application/json")) return resolve(JSON.parse(bruto || "{}"));
        resolve(Object.fromEntries(new URLSearchParams(bruto)));
      } catch { reject(new Error("corpo inválido")); }
    });
    req.on("error", reject);
  });
}

/* ==========================================================================
   FREIO POR IP

   Balde simples em memória para os três POSTs do site. Não é defesa contra
   ataque distribuído — isso é papel do nginx —, é o que impede um script
   sozinho de encher a caixa de entrada do cliente com mil orçamentos.

   O IP vem de `X-Forwarded-For`, e é o ÚLTIMO item que vale, não o primeiro:
   o primeiro é escrito pelo cliente e pode ser inventado. Este erro já custou
   caro em dois projetos irmãos.
   ========================================================================== */
const baldes = new Map();
const JANELA = 10 * 60 * 1000, TETO = 8;

function ipDoPedido(req) {
  const encaminhado = String(req.headers["x-forwarded-for"] || "").split(",").map((s) => s.trim()).filter(Boolean);
  return encaminhado.length ? encaminhado[encaminhado.length - 1] : (req.socket.remoteAddress || "?");
}

function passouNoFreio(req) {
  const ip = ipDoPedido(req), agora = Date.now();
  const marcas = (baldes.get(ip) || []).filter((t) => agora - t < JANELA);
  if (marcas.length >= TETO) { baldes.set(ip, marcas); return false; }
  marcas.push(agora);
  baldes.set(ip, marcas);
  if (baldes.size > 5000) baldes.clear();          // teto de memória, não de segurança
  return true;
}

/* ==========================================================================
   VALIDAÇÃO

   Corta no tamanho e exige o que é obrigatório. O que chega daqui já entra no
   banco por instrução preparada — o `esc()` do layout cuida da volta para a
   tela. As duas pontas, e não uma.
   ========================================================================== */
/* Caracteres de controle viram espaco. O alvo e o par CR+LF que alguem cola
   do Word e que, num campo de uma linha, quebra a apresentacao depois. O
   filtro e por PONTO DE CODIGO e nao por faixa dentro de expressao regular:
   a faixa exige escapes que ja se perderam duas vezes ao passar por
   ferramenta, e o que sobrou foi um hifen sendo apagado de telefone.
   Ver a mesma decisao em src/semear.js, funcao apelido(). */
const limpar = (v, max) => [...String(v ?? "")]
  .map((c) => (c.codePointAt(0) < 32 || c.codePointAt(0) === 127 ? " " : c))
  .join("").trim().slice(0, max);

function validarOrcamento(b) {
  const dados = {
    nome: limpar(b.nome, 120), empresa: limpar(b.empresa, 120),
    email: limpar(b.email, 160), telefone: limpar(b.telefone, 20),
    cidade: limpar(b.cidade, 80), servico: limpar(b.servico, 60),
    prazo: limpar(b.prazo, 60), mensagem: limpar(b.mensagem, 2000),
  };
  const erros = [];
  if (dados.nome.length < 2) erros.push("nome");
  /* Só dígitos contados: "(81) 9 9999-9999" tem 16 caracteres e 11 dígitos. */
  if (dados.telefone.replace(/\D/g, "").length < 10) erros.push("telefone");
  if (dados.mensagem.length < 5) erros.push("mensagem");
  return { dados, erros };
}

function validarPedido(b) {
  const dados = {
    nome: limpar(b.nome, 120), email: limpar(b.email, 160), telefone: limpar(b.telefone, 20),
    documento: limpar(b.documento, 20), cep: limpar(b.cep, 9), endereco: limpar(b.endereco, 200),
    entrega: b.entrega === "entrega" ? "entrega" : "retirada",
    pagamento: ["pix", "cartao", "faturado"].includes(b.pagamento) ? b.pagamento : "pix",
    obs: limpar(b.obs, 600),
  };
  const erros = [];
  if (dados.nome.length < 2) erros.push("nome");
  if (dados.telefone.replace(/\D/g, "").length < 10) erros.push("telefone");
  if (dados.documento.replace(/\D/g, "").length < 11) erros.push("documento");
  if (dados.entrega === "entrega" && dados.endereco.length < 8) erros.push("endereco");
  return { dados, erros };
}

/* ==========================================================================
   ROTAS
   ========================================================================== */
const servidor = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, `http://${req.headers.host || "localhost"}`); }
  catch { return responder(res, "endereço inválido", 400); }

  /* Barra no fim, sempre. `/loja` e `/loja/` seriam dois endereços com o mesmo
     conteúdo — o Google chama isso de conteúdo duplicado, e a força do link se
     divide entre os dois. Um redireciona para o outro, e acabou.

     SÓ PARA LEITURA: redirecionar um POST descarta o corpo, e o formulário
     preenchido vira uma página em branco. Quem envia para o endereço sem barra
     é atendido ali mesmo — a normalização de POST é feita na comparação de
     rota, logo abaixo. */
  let caminho = decodeURIComponent(url.pathname);
  const ehLeitura = req.method === "GET" || req.method === "HEAD";

  /* O health check responde ANTES da normalização de barra. Um monitor que
     recebe 303 registra "fora do ar" — ele confere o código, não segue o
     redirecionamento. */
  if (caminho === "/saude" || caminho === "/saude/") return responderJson(res, { ok: true, versao: APP_VERSION });

  if (ehLeitura && caminho.length > 1 && !caminho.endsWith("/") && !path.extname(caminho)) {
    return irPara(res, caminho + "/" + url.search);
  }
  if (!ehLeitura && !caminho.endsWith("/")) caminho += "/";

  if (ehLeitura) {
    if (servirArquivo(req, res, caminho.replace(/^\/+/, ""))) return;
    return rotearGet(req, res, caminho, url);
  }
  if (req.method === "POST") return rotearPost(req, res, caminho);

  res.writeHead(405, { Allow: "GET, HEAD, POST" });
  res.end("método não permitido");
});

function rotearGet(req, res, caminho, url) {
  const partes = caminho.split("/").filter(Boolean);

  if (caminho === "/") return responder(res, site.home());
  if (caminho === "/servicos/") return responder(res, site.servicos());
  if (caminho === "/obras/") return responder(res, site.obras(url.searchParams.get("servico") || null));
  if (caminho === "/empresa/") return responder(res, site.empresa());
  if (caminho === "/contato/") return responder(res, site.contato());
  if (caminho === "/privacidade/") return responder(res, site.privacidade());
  if (caminho === "/feed/") return responder(res, site.feed());
  if (caminho === "/busca/") return responder(res, site.busca(url.searchParams.get("q")));
  if (caminho === "/orcamento/") return responder(res, site.orcamento(url.searchParams.get("servico") || ""));
  if (caminho === "/carrinho/") return responder(res, lojaPag.carrinho());
  if (caminho === "/checkout/") return responder(res, lojaPag.checkout());

  if (caminho === "/loja/") {
    return responder(res, lojaPag.loja({
      categoria: url.searchParams.get("categoria") || null,
      busca: url.searchParams.get("q") || null,
      pagina: Number(url.searchParams.get("pagina")) || 1,
    }));
  }

  if (partes[0] === "servicos" && partes.length === 2) {
    const s = repo.servicoPorSlug(partes[1]);
    return s ? responder(res, site.servico(s)) : quatroCemQuatro(res);
  }
  if (partes[0] === "feed" && partes.length === 2) {
    const m = repo.materiaPorSlug(partes[1]);
    return m ? responder(res, site.materia(m)) : quatroCemQuatro(res);
  }
  if (partes[0] === "obras" && partes.length === 2) {
    const o = repo.obraPorSlug(partes[1]);
    return o ? responder(res, site.obra(o)) : quatroCemQuatro(res);
  }
  if (partes[0] === "produto" && partes.length === 2) {
    const p = repo.produtoPorSlug(partes[1]);
    return p ? responder(res, lojaPag.produto(p)) : quatroCemQuatro(res);
  }
  if (partes[0] === "pedido" && partes.length === 2) {
    const p = repo.pedidoPorProtocolo(partes[1].toUpperCase());
    return p ? responder(res, lojaPag.pedido(p)) : quatroCemQuatro(res);
  }

  if (caminho === "/sitemap.xml") return responderTexto(res, sitemap(), "application/xml; charset=utf-8");
  if (caminho === "/robots.txt") return responderTexto(res, robots(), "text/plain; charset=utf-8");
  if (caminho === "/llms.txt") return responderTexto(res, llms(), "text/plain; charset=utf-8");

  return quatroCemQuatro(res);
}

async function rotearPost(req, res, caminho) {
  let corpo;
  try { corpo = await lerCorpo(req); }
  catch { return responderJson(res, { erro: "pedido inválido" }, 400); }

  /* A armadilha é conferida antes de tudo: preenchida, o envio é ACEITO na
     aparência e descartado. Responder erro ensinaria o robô a tentar de novo
     sem preencher o campo. */
  const robo = String(corpo.apelido || "").length > 0;

  if (caminho === "/api/carrinho/") {
    const { linhas, total } = repo.carrinhoResolvido(Array.isArray(corpo.itens) ? corpo.itens : []);
    return responderJson(res, {
      total,
      itens: linhas.map((l) => ({
        sku: l.produto.sku, slug: l.produto.slug, nome: l.produto.nome,
        unidade: l.produto.unidade, preco_cent: l.produto.preco_cent,
        estoque: l.produto.estoque, quantidade: l.quantidade, subtotal_cent: l.subtotal_cent,
      })),
    });
  }

  if (!passouNoFreio(req)) {
    return responderJson(res, { erro: "muitos envios seguidos. Tente de novo em alguns minutos." }, 429);
  }

  if (caminho === "/orcamento/") {
    const { dados, erros } = validarOrcamento(corpo);
    if (erros.length) return responder(res, site.orcamento(dados.servico), 400);
    /* O robô recebe a MESMA tela de sucesso, com um protocolo que não existe.
       Uma rota de "enviado" separada seria mais um endereço a manter, e um
       erro visível ensinaria o robô a tentar de novo sem o campo. */
    if (robo) return responder(res, site.orcamentoEnviado("ORC-0000-00000"));
    const protocolo = repo.criarOrcamento(dados);
    return responder(res, site.orcamentoEnviado(protocolo));
  }

  if (caminho === "/checkout/") {
    const { dados, erros } = validarPedido(corpo);
    const { linhas } = repo.carrinhoResolvido(Array.isArray(corpo.itens) ? corpo.itens : []);
    if (erros.length || !linhas.length) {
      return responderJson(res, { erro: "confira os campos", campos: erros, semItens: !linhas.length }, 400);
    }
    if (robo) return responderJson(res, { protocolo: "PED-0000-00000" });
    const protocolo = repo.criarPedido(dados, linhas);
    return responderJson(res, { protocolo });
  }

  return quatroCemQuatro(res);
}

const quatroCemQuatro = (res) => responder(res, site.naoEncontrado(), 404);

/* ==========================================================================
   ARQUIVOS DE BUSCADOR

   Gerados do banco, e não escritos à mão: um sitemap escrito à mão fica velho
   no dia em que o cliente publicar a quarta matéria, e um sitemap velho é pior
   que nenhum — ele afirma que aquele endereço existe.
   ========================================================================== */
function sitemap() {
  const hoje = new Date().toISOString().slice(0, 10);
  const urls = [
    ["/", "1.0", "weekly"], ["/servicos/", "0.9", "monthly"], ["/loja/", "0.9", "weekly"],
    ["/obras/", "0.8", "monthly"],
    ["/empresa/", "0.6", "yearly"], ["/contato/", "0.7", "yearly"],
    ["/orcamento/", "0.8", "monthly"], ["/feed/", "0.7", "weekly"], ["/privacidade/", "0.2", "yearly"],
    ...repo.servicosAtivos().map((s) => [`/servicos/${s.slug}/`, "0.8", "monthly"]),
    ...repo.obras().map((o) => [`/obras/${o.slug}/`, "0.6", "monthly"]),
    ...repo.categorias().map((c) => [`/loja/?categoria=${c.slug}`, "0.6", "weekly"]),
    ...repo.produtos({ porPagina: 1000 }).itens.map((p) => [`/produto/${p.slug}/`, "0.6", "weekly"]),
    ...repo.materias(200).map((m) => [`/feed/${m.slug}/`, "0.6", "monthly"]),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p, f]) => `  <url><loc>${SITE}${u.replace(/&/g, "&amp;")}</loc><lastmod>${hoje}</lastmod><changefreq>${f}</changefreq><priority>${p}</priority></url>`).join("\n")}
</urlset>`;
}

/* Carrinho, checkout e pedido ficam de fora do índice: são telas de estado de
   uma pessoa, não conteúdo. Indexadas, aparecem vazias na busca e derrubam a
   impressão de quem clica. */
const robots = () => `User-agent: *
Allow: /
Disallow: /carrinho/
Disallow: /checkout/
Disallow: /pedido/
Disallow: /busca/

Sitemap: ${SITE}/sitemap.xml
`;

/* llms.txt: o equivalente do robots.txt para modelos de linguagem. Diz em
   texto corrido o que a empresa faz e onde está cada coisa — quem responde
   "quem instala hidrante em Caruaru?" lê isto, não o CSS. */
const llms = () => `# ${texto("EMPRESA_NOME")}

> ${texto("SEO_DESCRICAO")}

Empresa de engenharia em Caruaru, Pernambuco, atendendo o Agreste pernambucano.
Faz instalação e manutenção elétrica, instalações hidráulicas, sanitárias e de
gás, sistemas de prevenção contra incêndio e manutenção predial por contrato.
Também vende material hidráulico pela loja do site, com retirada em Caruaru.

## Serviços
${repo.servicosAtivos().map((s) => `- [${s.nome}](${SITE}/servicos/${s.slug}/): ${s.resumo}`).join("\n")}

## Obras entregues
${repo.obras({ limite: 30 }).map((o) => `- [${o.titulo}](${SITE}/obras/${o.slug}/): ${o.resumo}`).join("\n")}

## Loja
- [Material hidráulico](${SITE}/loja/): tubos, conexões, registros, metais, caixas e vedação.
${repo.categorias().map((c) => `- [${c.nome}](${SITE}/loja/?categoria=${c.slug})`).join("\n")}

## Conteúdo
${repo.materias(20).map((m) => `- [${m.titulo}](${SITE}/feed/${m.slug}/): ${m.resumo}`).join("\n")}

## Contato
- Orçamento: ${SITE}/orcamento/
- Contato: ${SITE}/contato/
- Atendimento: ${texto("EMPRESA_HORARIO")}
`;

servidor.listen(PORT, HOST, () => {
  console.log(`\n  INNOVAR Engenharia e Equipamentos — v${APP_VERSION}`);
  console.log(`  · http://${HOST}:${PORT}/\n`);
});
