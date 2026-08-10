/* ==========================================================================
   INNOVAR — gerador do ícone e da imagem de compartilhamento

   POR QUE GERAR EM CÓDIGO, e não exportar de um editor: estas duas imagens
   NASCEM das mesmas constantes do design system (o marinho, o laranja, o
   ângulo de 115° das barras do NN). Exportadas à mão, elas descolam da marca
   na primeira vez que uma cor mudar, e ninguém percebe — porque ninguém abre o
   ícone da aba para conferir. Aqui, mudou o token, roda de novo.

   Sem biblioteca de imagem: PNG é cabeçalho + IHDR + IDAT (zlib) + IEND, e o
   `zlib` já vem no Node. Uma dependência a mais para desenhar dois retângulos
   é dependência que um dia vai ter CVE.

       node ferramentas/gerar-imagens.cjs

   ========================================================================== */
"use strict";

const zlib = require("node:zlib");
const fs = require("node:fs");
const path = require("node:path");

const SAIDA = path.join(__dirname, "..", "assets", "img");

/* As MESMAS cores de docs/IDENTIDADE.md. Se divergirem daqui, o ícone deixa de
   ser a marca e vira um quadrado azul parecido. */
const MARINHO = [0x24, 0x1b, 0x63];
const MARINHO_2 = [0x1a, 0x14, 0x49];
const LARANJA = [0xf0, 0x56, 0x1f];
const AMBAR = [0xf8, 0x9a, 0x1c];
const BRANCO = [0xff, 0xff, 0xff];

/* -------------------------------------------------------------------- PNG -- */
const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pedaco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

/* `pinta(x, y)` devolve [r,g,b]. Cada linha do PNG começa com o byte do filtro
   (0 = nenhum): sem ele o decodificador lê o primeiro pixel como instrução e a
   imagem sai deslocada — erro que só aparece na imagem pronta. */
/* SUPERAMOSTRAGEM 3×3. Uma diagonal desenhada pixel a pixel sai serrilhada —
   a borda vira escada, e escada num logo lê-se como imagem de baixa qualidade,
   justo no cartão que representa a empresa no WhatsApp. Medir a cor em nove
   pontos dentro do pixel e tirar a média dá a borda macia de graça: onde a
   barra cobre metade do pixel, a média já é meio-termo entre as duas cores. */
const AMOSTRAS = [1 / 6, 3 / 6, 5 / 6];

function gravarPNG(arquivo, largura, altura, pinta) {
  const linha = largura * 3 + 1;
  const cru = Buffer.alloc(linha * altura);
  for (let y = 0; y < altura; y++) {
    const base = y * linha;
    cru[base] = 0;
    for (let x = 0; x < largura; x++) {
      let r = 0, g = 0, b = 0;
      for (const dy of AMOSTRAS) for (const dx of AMOSTRAS) {
        const c = pinta(x + dx, y + dy);
        r += c[0]; g += c[1]; b += c[2];
      }
      const n = AMOSTRAS.length * AMOSTRAS.length;
      cru[base + 1 + x * 3] = Math.round(r / n);
      cru[base + 2 + x * 3] = Math.round(g / n);
      cru[base + 3 + x * 3] = Math.round(b / n);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;        /* 8 bits por canal */
  ihdr[9] = 2;        /* cor verdadeira, sem alfa */
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco("IHDR", ihdr),
    pedaco("IDAT", zlib.deflateSync(cru, { level: 9 })),
    pedaco("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(arquivo, png);
  return png.length;
}

/* ------------------------------------------------------------- desenho ---- */
const misturar = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/* As barras do NN, com o MESMO ângulo e o MESMO sentido de `simbolo.svg`: no
   logo a barra sobe da esquerda para a direita (`/`), do ponto (17,47) ao
   (31,17). O sinal de menos aqui é o que garante isso — com sinal de mais a
   barra deita para o outro lado e o ícone vira o espelho da marca, que passa
   despercebido no arquivo e salta aos olhos ao lado do letreiro. */
function fazBarras(largura, altura, larguraBarra, deslocamentos) {
  const inclinacao = Math.tan((25 * Math.PI) / 180);  /* 115° medido do eixo x */
  return (x, y) => {
    const u = (x - (altura - y) * inclinacao) / largura;
    for (let i = 0; i < deslocamentos.length; i++) {
      const d = deslocamentos[i];
      if (u >= d && u < d + larguraBarra) return i;
    }
    return -1;
  };
}

/* ÍCONE (apple-touch-icon, manifesto e favicon grande). Nada de texto: a 60px
   do iOS, letra vira borrão — a forma sobrevive.

   Os números saem de `simbolo.svg`, não de estimativa: lá as barras vivem
   entre y=17 e y=47 de 64, e cada uma tem 10 de 64 de largura na horizontal.
   Divididos por 64, viram as frações abaixo. Copiar a proporção em vez de
   redesenhar "parecido" é o que impede o ícone e o SVG de divergirem — lado a
   lado, a diferença de meio grau salta aos olhos. */
const BANDA = [17 / 64, 47 / 64];                   /* topo e base das barras */
const BARRA_LARGURA = 10 / 64;
const BARRA_INICIOS = [(17 / 64 + 31 / 64) / 2, (33 / 64 + 47 / 64) / 2];

function icone(lado) {
  const inclinacao = Math.tan((25 * Math.PI) / 180);
  const meio = lado * (BANDA[0] + BANDA[1]) / 2;
  return (x, y) => {
    const fundo = misturar(MARINHO, MARINHO_2, y / lado);
    if (y < lado * BANDA[0] || y > lado * BANDA[1]) return fundo;
    const u = (x - (meio - y) * inclinacao) / lado;
    for (let i = 0; i < BARRA_INICIOS.length; i++) {
      if (u >= BARRA_INICIOS[i] && u < BARRA_INICIOS[i] + BARRA_LARGURA) return i === 0 ? AMBAR : LARANJA;
    }
    return fundo;
  };
}

/* IMAGEM DE COMPARTILHAMENTO 1200×630. Sem texto pelo mesmo motivo de sempre:
   texto embutido em imagem não é traduzido, não é lido por leitor de tela e
   fica errado no dia em que o telefone mudar. O título quem dá é a `og:title`.
   Aqui é só a marca ocupando o espaço, legível no cartão pequeno do WhatsApp. */
function compartilhar(largura, altura) {
  const barras = fazBarras(largura, altura, 0.075, [0.56, 0.68, 0.8]);
  const cores = [AMBAR, LARANJA, BRANCO];
  return (x, y) => {
    const i = barras(x, y);
    if (i >= 0) return misturar(misturar(MARINHO, MARINHO_2, y / altura), cores[i], 0.92);
    return misturar(MARINHO, MARINHO_2, (x / largura) * 0.4 + (y / altura) * 0.6);
  };
}

/* ------------------------------------------------------------- execução --- */
const trabalhos = [
  ["icone-180.png", 180, 180, icone(180)],
  ["icone-512.png", 512, 512, icone(512)],
  ["icone-192.png", 192, 192, icone(192)],
  ["og.png", 1200, 630, compartilhar(1200, 630)],
];

for (const [nome, l, a, pinta] of trabalhos) {
  const bytes = gravarPNG(path.join(SAIDA, nome), l, a, pinta);
  console.log(`  ${nome.padEnd(16)} ${l}x${a}  ${(bytes / 1024).toFixed(1)} kB`);
}
console.log("\n  pronto — assets/img/\n");
