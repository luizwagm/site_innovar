/* ==========================================================================
   INNOVAR — leitura do conteúdo editável

   O CACHE EM MEMÓRIA existe porque uma página do site lê umas trinta chaves,
   e trinta idas ao banco por visita para buscar texto que muda uma vez por mês
   é desperdício puro. O cache é invalidado na hora em que o painel grava —
   não por tempo. Cache com validade em minutos gera a pergunta "salvei e não
   mudou, será que salvou?", e essa pergunta custa mais que a consulta.
   ========================================================================== */
"use strict";

const db = require("./db");
const { CAMPOS } = require("./conteudo");

let cache = null;

function carregar() {
  if (cache) return cache;
  cache = new Map();
  for (const linha of db.prepare("SELECT chave, valor FROM conteudo").all()) {
    cache.set(linha.chave, linha.valor);
  }
  return cache;
}

/* O valor de fábrica do CAMPOS é a rede de segurança: se o painel apagar um
   texto sem querer, a tela mostra o original em vez de um buraco. Só vale para
   chave AUSENTE — string vazia é uma escolha legítima (o cliente pode querer
   sumir com um selo), e sobrescrevê-la seria desfazer o que ele fez. */
function texto(chave) {
  const mapa = carregar();
  if (mapa.has(chave)) return mapa.get(chave);
  const campo = CAMPOS.find((c) => c.chave === chave);
  return campo ? campo.valor : "";
}

function gravar(chave, valor) {
  db.prepare(`INSERT INTO conteudo (chave, valor, atualizado) VALUES (?, ?, datetime('now'))
              ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado = excluded.atualizado`)
    .run(chave, String(valor ?? ""));
  esquecer();
}

const esquecer = () => { cache = null; };

module.exports = { texto, gravar, esquecer };
