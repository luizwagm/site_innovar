/* ==========================================================================
   INNOVAR — recorte do logo do cliente

   O arquivo que o cliente mandou é 4501×4501 com o letreiro no meio de uma
   larga moldura marinha. Usado como está, ele traz dois problemas que só
   aparecem depois de publicado:

   1. O MARINHO DELE NÃO É O ÚNICO MARINHO DO SITE. O cabeçalho parado, o
      cabeçalho rolado e o rodapé têm tons diferentes de propósito — e sobre
      qualquer um deles o logo apareceria como um retângulo mais claro, com
      quina reta. Ninguém sabe dizer o que está errado, mas todo mundo vê.

   2. 139 kB e 4501 px para desenhar 38 px de altura no cabeçalho. O navegador
      baixa e redimensiona a imagem inteira antes de pintar.

   Este utilitário decodifica o PNG, acha o retângulo do que não é fundo,
   recorta com uma margem de respiro e grava com FUNDO TRANSPARENTE. O alfa sai
   da distância até a cor de fundo, e a cor é desmultiplicada — sem isso a
   borda antisserrilhada guarda o marinho antigo e o letreiro fica com um halo
   escuro sobre fundo claro, que é o defeito clássico de logo recortado.

       node ferramentas/recortar-logo.cjs

   ========================================================================== */
"use strict";

const zlib = require("node:zlib");
const fs = require("node:fs");
const path = require("node:path");

const ENTRADA = path.join(__dirname, "..", "assets", "img", "logo.png");
const SAIDA = path.join(__dirname, "..", "assets", "img", "logo-marca.png");

/* ------------------------------------------------------------- decodificar - */
function lerPNG(arquivo) {
  const buf = fs.readFileSync(arquivo);
  let i = 8, ihdr = null;
  const idat = [];
  while (i < buf.length) {
    const tam = buf.readUInt32BE(i);
    const tipo = buf.toString("ascii", i + 4, i + 8);
    const dados = buf.subarray(i + 8, i + 8 + tam);
    if (tipo === "IHDR") ihdr = { largura: dados.readUInt32BE(0), altura: dados.readUInt32BE(4), bits: dados[8], cor: dados[9], entrelacado: dados[12] };
    else if (tipo === "IDAT") idat.push(dados);
    else if (tipo === "IEND") break;
    i += 12 + tam;
  }
  if (!ihdr) throw new Error("PNG sem IHDR");
  if (ihdr.bits !== 8 || ihdr.entrelacado !== 0 || (ihdr.cor !== 2 && ihdr.cor !== 6)) {
    throw new Error(`PNG em formato não previsto: bits=${ihdr.bits} cor=${ihdr.cor} entrelaçado=${ihdr.entrelacado}`);
  }

  const canais = ihdr.cor === 6 ? 4 : 3;
  const cru = zlib.inflateSync(Buffer.concat(idat));
  const passo = ihdr.largura * canais;
  const px = Buffer.alloc(passo * ihdr.altura);

  /* DESFILTRAGEM. Cada linha do PNG guarda o modo de filtro no primeiro byte, e
     os modos 2..4 dependem da linha ANTERIOR já desfiltrada — por isso isto tem
     de ser sequencial, e por isso pular um modo dá uma imagem "quase certa" com
     faixas, que é pior que uma que falha. */
  for (let y = 0; y < ihdr.altura; y++) {
    const filtro = cru[y * (passo + 1)];
    const linha = cru.subarray(y * (passo + 1) + 1, y * (passo + 1) + 1 + passo);
    const destino = y * passo, acima = destino - passo;
    for (let x = 0; x < passo; x++) {
      const a = x >= canais ? px[destino + x - canais] : 0;   // pixel à esquerda
      const b = y > 0 ? px[acima + x] : 0;                    // pixel acima
      const c = (x >= canais && y > 0) ? px[acima + x - canais] : 0;
      let v = linha[x];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      px[destino + x] = v & 0xff;
    }
  }
  return { ...ihdr, canais, px, passo };
}

/* ---------------------------------------------------------------- gravar --- */
const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
const crc32 = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = TABELA_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function pedaco(tipo, dados) {
  const t = Buffer.alloc(4); t.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(corpo));
  return Buffer.concat([t, corpo, c]);
}
function gravarRGBA(arquivo, largura, altura, rgba) {
  const linha = largura * 4 + 1;
  const cru = Buffer.alloc(linha * altura);
  for (let y = 0; y < altura; y++) {
    cru[y * linha] = 0;
    rgba.copy(cru, y * linha + 1, y * largura * 4, (y + 1) * largura * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0); ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco("IHDR", ihdr), pedaco("IDAT", zlib.deflateSync(cru, { level: 9 })), pedaco("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(arquivo, png);
  return png.length;
}

/* --------------------------------------------------------------- trabalho -- */
const img = lerPNG(ENTRADA);
const cor = (x, y) => {
  const o = y * img.passo + x * img.canais;
  return [img.px[o], img.px[o + 1], img.px[o + 2]];
};

/* A cor de fundo vem do canto, não de um valor cravado: se o cliente mandar
   outra arte amanhã, o utilitário continua certo sem alguém lembrar de trocar
   um hexadecimal aqui. */
const FUNDO = cor(2, 2);
const dist = (c) => Math.hypot(c[0] - FUNDO[0], c[1] - FUNDO[1], c[2] - FUNDO[2]);
const LIMIAR = 42;                 /* abaixo disto é fundo; acima, marca */

let x0 = img.largura, y0 = img.altura, x1 = -1, y1 = -1;
for (let y = 0; y < img.altura; y++) {
  for (let x = 0; x < img.largura; x++) {
    if (dist(cor(x, y)) > LIMIAR) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
}
if (x1 < 0) throw new Error("nada além do fundo — cor de fundo ou limiar errados");

/* Margem de respiro proporcional: 2% da maior dimensão da marca. Colada na
   borda, a marca encosta no que estiver ao lado dela no layout. */
const respiro = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
x0 = Math.max(0, x0 - respiro); y0 = Math.max(0, y0 - respiro);
x1 = Math.min(img.largura - 1, x1 + respiro); y1 = Math.min(img.altura - 1, y1 + respiro);

/* REDUÇÃO POR MÉDIA DE BLOCO. O cabeçalho desenha ~40 px de altura; guardar
   3000 é baixar meio megabyte para jogar fora. A média de bloco (e não pegar
   um pixel a cada N) é o que preserva a borda suave do letreiro. */
const larguraOrig = x1 - x0 + 1, alturaOrig = y1 - y0 + 1;
const ALVO = 900;                                   /* serve até retina em 300px */
const fator = Math.max(1, Math.round(larguraOrig / ALVO));
const largura = Math.floor(larguraOrig / fator), altura = Math.floor(alturaOrig / fator);

const rgba = Buffer.alloc(largura * altura * 4);
for (let y = 0; y < altura; y++) {
  for (let x = 0; x < largura; x++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = 0; dy < fator; dy++) for (let dx = 0; dx < fator; dx++) {
      const c = cor(x0 + x * fator + dx, y0 + y * fator + dy);
      r += c[0]; g += c[1]; b += c[2]; n++;
    }
    const c = [r / n, g / n, b / n];

    /* ALFA PELA DISTÂNCIA e cor DESMULTIPLICADA. Sem a desmultiplicação, o
       pixel meio-transparente da borda continua carregando o marinho do fundo
       antigo; sobre um fundo claro isso vira um contorno escuro em volta de
       cada letra. */
    const a = Math.max(0, Math.min(1, dist(c) / LIMIAR));
    const o = (y * largura + x) * 4;
    for (let k = 0; k < 3; k++) {
      const v = a === 0 ? FUNDO[k] : FUNDO[k] + (c[k] - FUNDO[k]) / a;
      rgba[o + k] = Math.max(0, Math.min(255, Math.round(v)));
    }
    rgba[o + 3] = Math.round(a * 255);
  }
}

const bytes = gravarRGBA(SAIDA, largura, altura, rgba);
console.log(`
  entrada   ${img.largura}x${img.altura}  fundo rgb(${FUNDO})
  recorte   x ${x0}..${x1}   y ${y0}..${y1}
  saida     ${largura}x${altura}  ${(bytes / 1024).toFixed(1)} kB  ->  assets/img/logo-marca.png
`);
