/* ==========================================================================
   INNOVAR — busca de fotos de banco de imagem

   POR QUE PEXELS: a licença permite uso comercial, permite modificar e NÃO
   exige atribuição. Isso importa num site de empresa: uma foto que exige
   crédito obriga uma linha de crédito em cada página onde ela aparece, e essa
   linha some no primeiro ajuste de layout — aí o site fica em desacordo com a
   licença sem ninguém perceber. O Openverse foi descartado pelo mesmo motivo:
   a maior parte do acervo dele é CC BY ou BY-SA.

   POR QUE BAIXAR EM VEZ DE APONTAR PARA O ENDEREÇO DELES: uma foto servida de
   fora é um terceiro no caminho da pintura (mais lento), é um endereço que
   pode sair do ar levando junto a vitrine, e é o endereço IP de cada visitante
   vazando para outra empresa. Além de a política de segurança deste site
   (`img-src 'self'`) barrar host externo — de propósito.

   DUAS COISAS APRENDIDAS NA MARRA, e é por elas que o arquivo tem esta forma:

   1. BUSCA DE UMA PALAVRA SÓ. Termo com espaço é redirecionado para outra
      rota que responde 403. "plumbing" funciona; "plumbing pipes" não.

   2. HÁ LIMITE DE TAXA. Dezoito buscas seguidas levam 403 a partir da
      segunda — e o 403 não é do termo, é do ritmo: o mesmo termo que falhou
      passa quando repetido depois de uma pausa. Por isso as fotos são
      AGRUPADAS POR BUSCA (uma busca serve vários destinos) e há espera entre
      elas, com nova tentativa em caso de recusa.

       node ferramentas/buscar-imagens.cjs

   Idempotente: arquivo que já existe não é baixado de novo, então repetir a
   execução só busca o que faltou.
   ========================================================================== */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const PASTA = path.join(__dirname, "..", "assets", "img", "banco");
fs.mkdirSync(PASTA, { recursive: true });

const NAVEGADOR = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Accept": "text/html,application/xhtml+xml",
};

/* ==========================================================================
   O QUE BUSCAR

   `termo` em inglês porque o acervo é indexado em inglês — buscar "quadro de
   luz" devolve quadro de pintura. `pos` é a posição no resultado da busca:
   quando a foto escolhida não serve, troco o número aqui, o que mantém as
   outras do mesmo grupo iguais entre execuções.
   ========================================================================== */
const GRUPOS = [
  { termo: "electrician", exigir: ["electric", "wiring", "cable", "circuit", "panel", "switchboard"], fotos: [
    { arquivo: "serv-eletrica.jpg", pos: 0, largura: 1200 },
    { arquivo: "feed-quadro.jpg", pos: 1, largura: 1200 },
  ] },
  { termo: "plumber", exigir: ["plumb", "pipe", "wrench", "sink", "faucet", "leak"], fotos: [
    { arquivo: "serv-hidraulica.jpg", pos: 0, largura: 1200 },
  ] },
  { termo: "plumbing", exigir: ["pipe", "plumb", "valve", "fitting", "tube"], fotos: [
    { arquivo: "cat-tubos.jpg", pos: 0, largura: 900 },
    { arquivo: "cat-conexoes.jpg", pos: 1, largura: 900 },
    { arquivo: "cat-registros.jpg", pos: 2, largura: 900 },
    { arquivo: "prod-tubo-esgoto.jpg", pos: 3, largura: 900 },
  ] },
  { termo: "extinguisher", exigir: ["extinguisher", "fire"], fotos: [
    { arquivo: "serv-incendio.jpg", pos: 0, largura: 1200 },
    { arquivo: "feed-vistoria.jpg", pos: 1, largura: 1200 },
  ] },
  { termo: "tools", exigir: ["tool", "wrench", "workshop", "toolbox"], fotos: [
    { arquivo: "serv-manutencao.jpg", pos: 0, largura: 1200 },
  ] },
  { termo: "toolbox", exigir: ["toolbox", "tool"], fotos: [
    { arquivo: "cat-vedacao.jpg", pos: 0, largura: 900 },
  ] },
  { termo: "faucet", exigir: ["faucet", "tap", "sink"], fotos: [
    { arquivo: "cat-metais.jpg", pos: 0, largura: 900 },
    { arquivo: "prod-torneira.jpg", pos: 1, largura: 900 },
  ] },
  { termo: "shower", exigir: ["shower head", "showerhead", "bathroom"], fotos: [
    { arquivo: "prod-chuveiro.jpg", pos: 0, largura: 900 },
  ] },
  { termo: "watertank", exigir: ["tank", "water"], fotos: [
    { arquivo: "cat-caixas.jpg", pos: 0, largura: 900 },
  ] },
  { termo: "construction", exigir: ["construction worker", "helmet", "hard hat", "construction site"], fotos: [
    { arquivo: "empresa-equipe.jpg", pos: 0, largura: 1400 },
  ] },
];

/* -------------------------------------------------------------- rede ---- */
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function pegar(url, comoTexto) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: NAVEGADOR, timeout: 30000 }, (res) => {
      /* O `https` do Node não segue redirecionamento sozinho. Seguir à mão é
         necessário aqui porque o Pexels responde 301 para a versão canônica. */
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(pegar(new URL(res.headers.location, url).href, comoTexto));
      }
      if (res.statusCode !== 200) {
        res.resume();
        const erro = new Error(`HTTP ${res.statusCode}`);
        erro.status = res.statusCode;
        return reject(erro);
      }
      const partes = [];
      res.on("data", (p) => partes.push(p));
      res.on("end", () => resolve(comoTexto ? Buffer.concat(partes).toString("utf8") : Buffer.concat(partes)));
    });
    req.on("timeout", () => req.destroy(new Error("tempo esgotado")));
    req.on("error", reject);
  });
}

/* Espera crescente entre tentativas: 4 s, 8 s, 16 s. Insistir no mesmo ritmo
   que levou a recusa é pedir para ser recusado de novo. */
async function pegarInsistindo(url, comoTexto, tentativas = 4) {
  let ultimo;
  for (let i = 0; i < tentativas; i++) {
    try { return await pegar(url, comoTexto); }
    catch (e) {
      ultimo = e;
      if (i < tentativas - 1) {
        const pausa = 4000 * 2 ** i;
        console.log(`      ${e.message} — nova tentativa em ${pausa / 1000}s`);
        await esperar(pausa);
      }
    }
  }
  throw ultimo;
}

/* ==========================================================================
   LER O RESULTADO DA BUSCA

   Não é a API — ela exige chave —, é leitura do HTML que a página já entrega.

   DUAS ARMADILHAS, e as duas custaram foto errada publicada:

   1. AS TRÊS PRIMEIRAS IMAGENS NÃO SÃO RESULTADO. São miniaturas de "buscas
      relacionadas", e o `alt` delas é o termo curto ("fire", "fire safety").
      Os resultados de verdade têm `alt` começando em "Free" e descrevendo a
      cena. Pegar por posição trouxe uma fábrica de confecção para a página de
      elétrica.

   2. POSIÇÃO NÃO É RELEVÂNCIA. Por isso o chamador informa PALAVRAS EXIGIDAS,
      conferidas contra a descrição: uma foto que não fala do assunto não é
      escolhida, mesmo que venha em primeiro lugar. É a diferença entre "o
      utilitário baixou 17 arquivos" e "as 17 fotos são do assunto".
   ========================================================================== */
async function procurar(termo) {
  const html = await pegarInsistindo(`https://www.pexels.com/search/${encodeURIComponent(termo)}/`, true);
  const vistos = new Set(), lista = [];

  for (const m of html.matchAll(/<img[^>]*?>/gi)) {
    const tag = m[0];
    const src = (tag.match(/src="([^"]*images\.pexels\.com\/photos\/\d+\/[^"?]+)/) || [])[1];
    const alt = (tag.match(/alt="([^"]*)"/) || [])[1] || "";
    if (!src) continue;
    if (!/^free\b/i.test(alt)) continue;          // miniatura de busca relacionada
    const id = src.match(/photos\/(\d+)\//)[1];
    if (vistos.has(id)) continue;
    vistos.add(id);
    lista.push({ id, caminho: src, descricao: alt.replace(/^Free\s*/i, "") });
  }
  return lista;
}

/* Fica com as fotos cuja descrição cita pelo menos uma das palavras pedidas. */
const filtrarPorAssunto = (lista, exigir) =>
  lista.filter((f) => exigir.some((palavra) => f.descricao.toLowerCase().includes(palavra)));

/* Confere a assinatura do arquivo. Uma página de erro salva com extensão .jpg
   é um arquivo que só falha na hora em que o cliente abre o site. */
const ehImagem = (b) =>
  b.length > 2048 && ((b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50));

/* ============================================================= execução == */
(async () => {
  const creditos = [];
  let baixados = 0, pulados = 0, falhas = 0;

  for (const grupo of GRUPOS) {
    const faltando = grupo.fotos.filter((f) => !fs.existsSync(path.join(PASTA, f.arquivo)));
    pulados += grupo.fotos.length - faltando.length;
    if (!faltando.length) continue;

    console.log(`\n  busca "${grupo.termo}"`);
    let achados;
    try { achados = await procurar(grupo.termo); }
    catch (e) { console.log(`      desisti: ${e.message}`); falhas += faltando.length; continue; }
    const brutos = achados.length;
    achados = filtrarPorAssunto(achados, grupo.exigir);
    console.log(`      ${brutos} resultados, ${achados.length} falam de ${grupo.exigir[0]}`);

    for (const f of faltando) {
      if (achados.length <= f.pos) { console.log(`      FALTOU  ${f.arquivo} (só ${achados.length} resultados)`); falhas++; continue; }
      const escolhida = achados[f.pos];
      /* `auto=compress` e `w=` fazem o Pexels entregar já redimensionado e
         recomprimido. Baixar o original de 5 MB para mostrar 400 px é
         desperdício de banda nas duas pontas. */
      const url = `${escolhida.caminho}?auto=compress&cs=tinysrgb&fit=crop&w=${f.largura}&h=${Math.round(f.largura * 0.75)}`;
      try {
        const imagem = await pegarInsistindo(url, false, 3);
        if (!ehImagem(imagem)) throw new Error("o que chegou não é imagem");
        fs.writeFileSync(path.join(PASTA, f.arquivo), imagem);
        creditos.push({ arquivo: f.arquivo, termo: grupo.termo, id: escolhida.id, descricao: escolhida.descricao });
        console.log(`      ok      ${f.arquivo.padEnd(22)} #${escolhida.id}  ${escolhida.descricao.slice(0, 58)}`);
        baixados++;
      } catch (e) {
        console.log(`      FALHOU  ${f.arquivo.padEnd(22)} ${e.message}`);
        falhas++;
      }
      await esperar(1200);
    }
    await esperar(3500);            // respiro entre buscas
  }

  if (creditos.length) registrarCreditos(creditos);
  console.log(`\n  ${baixados} baixadas · ${pulados} já existiam · ${falhas} falharam\n`);
  if (falhas) console.log("  Rode de novo para tentar só as que faltaram.\n");
})();

/* A procedência não é exigência da licença do Pexels; é para que daqui a dois
   anos dê para saber de onde veio cada foto sem depender da memória de
   ninguém — e para o cliente poder trocar sabendo o que está trocando. */
function registrarCreditos(creditos) {
  const arquivo = path.join(PASTA, "CREDITOS.md");
  const cabecalho = `# Procedência das fotos

Fotos de banco de imagem usadas como ponto de partida, para o cliente
substituir pelas fotos das obras reais dele. Todas do **Pexels**, cuja licença
permite uso comercial e modificação e **não exige atribuição**
(https://www.pexels.com/license/).

Geradas por \`ferramentas/buscar-imagens.cjs\`.

| arquivo | busca | foto |
|---|---|---|
`;
  /* CHAVEADO PELO NOME DO ARQUIVO, e não acumulando linhas: quando uma foto é
     trocada, a linha antiga tem de SAIR. Juntar tudo num conjunto deixou o
     registro com duas procedências para o mesmo arquivo — um registro que se
     contradiz é pior que nenhum, porque dá a impressão de estar conferido. */
  const porArquivo = new Map();
  if (fs.existsSync(arquivo)) {
    for (const linha of fs.readFileSync(arquivo, "utf8").split("\n")) {
      const nome = (linha.match(/^\| `([^`]+)`/) || [])[1];
      if (nome && fs.existsSync(path.join(PASTA, nome))) porArquivo.set(nome, linha);
    }
  }
  for (const c of creditos) {
    porArquivo.set(c.arquivo,
      `| \`${c.arquivo}\` | ${c.termo} | [pexels ${c.id}](https://www.pexels.com/photo/${c.id}/) | ${c.descricao.slice(0, 70)} |`);
  }
  fs.writeFileSync(arquivo, cabecalho + [...porArquivo.values()].sort().join("\n") + "\n");
}
