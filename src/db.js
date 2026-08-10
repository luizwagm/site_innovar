/* ==========================================================================
   INNOVAR — banco

   SQLite em arquivo, com WAL. É um site de uma empresa em Caruaru: o volume
   cabe folgado, e um banco em arquivo é um banco que se copia com `cp` e se
   restaura sem serviço no ar. Postgres entra no dia em que houver mais de um
   processo escrevendo — não antes, porque servidor de banco a manter é
   servidor de banco a cair de madrugada.

   `better-sqlite3` e não `node:sqlite`: o `node:sqlite` já vem no Node 24, mas
   os serviços irmãos deste servidor rodam com `better-sqlite3` há meses e o
   deploy dele é conhecido. Dependência nova em produção é risco novo, e este
   não paga nada em troca.
   ========================================================================== */
"use strict";

const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");

const PASTA = path.join(__dirname, "..", "data");
fs.mkdirSync(PASTA, { recursive: true });

const db = new Database(path.join(PASTA, "innovar.db"));

/* WAL: leitura não espera escrita. Sem isto, um pedido sendo gravado no
   checkout tranca todo mundo que está só navegando na loja.
   `foreign_keys` NÃO é ligado por padrão no SQLite — sem esta linha as chaves
   estrangeiras existem no esquema e não valem nada em tempo de execução. */
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  /* ------------------------------------------------------ conteúdo do site --
     Uma linha por trecho editável. Chave em maiúsculas, igual ao que aparece
     no painel. O site NUNCA lê texto de dentro do código: se está na tela,
     está aqui, e por isso o cliente consegue mudar sem me chamar. */
  CREATE TABLE IF NOT EXISTS conteudo (
    chave       TEXT PRIMARY KEY,
    valor       TEXT NOT NULL DEFAULT '',
    atualizado  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  /* ------------------------------------------------------------- serviços --
     Cada frente de trabalho com página própria. 'ordem' decide a posição na
     home e no menu; 'ativo' tira do ar sem apagar (e sem quebrar o link que
     alguém já mandou por WhatsApp). */
  CREATE TABLE IF NOT EXISTS servicos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    nome        TEXT NOT NULL,
    resumo      TEXT NOT NULL DEFAULT '',
    icone       TEXT NOT NULL DEFAULT 'raio',
    chamada     TEXT NOT NULL DEFAULT '',
    corpo       TEXT NOT NULL DEFAULT '',
    inclui      TEXT NOT NULL DEFAULT '',
    nao_inclui  TEXT NOT NULL DEFAULT '',
    prazo       TEXT NOT NULL DEFAULT '',
    ordem       INTEGER NOT NULL DEFAULT 0,
    ativo       INTEGER NOT NULL DEFAULT 1
  );

  /* --------------------------------------------------------------- loja ----
     PREÇO EM CENTAVOS, inteiro. Dinheiro em ponto flutuante acumula erro de
     arredondamento, e o lugar onde isso aparece é a soma do carrinho — o
     cliente confere a conta na mão e o site perde a discussão.

     'unidade' é obrigatória por regra de negócio: "R$ 42,00" num tubo é
     ambíguo entre o metro e a barra de seis metros, e a ambiguidade só é
     descoberta na entrega. */
  CREATE TABLE IF NOT EXISTS categorias (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    slug   TEXT NOT NULL UNIQUE,
    nome   TEXT NOT NULL,
    ordem  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    sku           TEXT NOT NULL UNIQUE,
    slug          TEXT NOT NULL UNIQUE,
    nome          TEXT NOT NULL,
    categoria_id  INTEGER REFERENCES categorias(id),
    descricao     TEXT NOT NULL DEFAULT '',
    marca         TEXT NOT NULL DEFAULT '',
    unidade       TEXT NOT NULL,
    preco_cent    INTEGER NOT NULL CHECK (preco_cent >= 0),
    estoque       INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
    foto          TEXT NOT NULL DEFAULT '',
    ativo         INTEGER NOT NULL DEFAULT 1,
    criado        TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS ix_produtos_categoria ON produtos(categoria_id, ativo);

  /* ------------------------------------------------------------- pedidos ---
     'protocolo' é o que o cliente diz no telefone: PED-2026-00001. O id
     interno não serve para isso — número sequencial cru convida a tentar o do
     vizinho, e não diz de que ano é. */
  CREATE TABLE IF NOT EXISTS pedidos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    protocolo  TEXT NOT NULL UNIQUE,
    nome       TEXT NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    telefone   TEXT NOT NULL,
    documento  TEXT NOT NULL DEFAULT '',
    cep        TEXT NOT NULL DEFAULT '',
    endereco   TEXT NOT NULL DEFAULT '',
    entrega    TEXT NOT NULL DEFAULT 'retirada',
    pagamento  TEXT NOT NULL DEFAULT 'combinar',
    total_cent INTEGER NOT NULL DEFAULT 0,
    situacao   TEXT NOT NULL DEFAULT 'recebido',
    obs        TEXT NOT NULL DEFAULT '',
    criado     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  /* O item guarda NOME E PREÇO do momento da compra, e não só a chave do
     produto: o preço do tubo muda mês que vem, e o pedido de hoje tem de
     continuar contando a história de hoje. */
  CREATE TABLE IF NOT EXISTS pedido_itens (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id    INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id   INTEGER REFERENCES produtos(id),
    sku          TEXT NOT NULL,
    nome         TEXT NOT NULL,
    unidade      TEXT NOT NULL,
    preco_cent   INTEGER NOT NULL,
    quantidade   INTEGER NOT NULL CHECK (quantidade > 0)
  );
  CREATE INDEX IF NOT EXISTS ix_itens_pedido ON pedido_itens(pedido_id);

  /* ----------------------------------------------------------- orçamentos --
     O funil de serviço. Mesma ideia de protocolo dos pedidos. */
  CREATE TABLE IF NOT EXISTS orcamentos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    protocolo  TEXT NOT NULL UNIQUE,
    nome       TEXT NOT NULL,
    empresa    TEXT NOT NULL DEFAULT '',
    email      TEXT NOT NULL DEFAULT '',
    telefone   TEXT NOT NULL,
    cidade     TEXT NOT NULL DEFAULT '',
    servico    TEXT NOT NULL DEFAULT '',
    prazo      TEXT NOT NULL DEFAULT '',
    mensagem   TEXT NOT NULL DEFAULT '',
    situacao   TEXT NOT NULL DEFAULT 'novo',
    criado     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  /* ---------------------------------------------------------------- obras --
     O portfolio. E a prova que falta no funil: quem contrata instalacao quer
     ver que ja foi feito antes, no porte dele.

     'cliente' e 'local' podem ficar VAZIOS de proposito — boa parte dos
     clientes de obra nao autoriza divulgar o nome. Sem o nome a obra continua
     valendo: "comercio de medio porte no centro de Caruaru" prova porte e
     tipo, que e o que o visitante esta medindo.

     'exemplo' marca a obra semeada por mim, que NAO aconteceu. A tela avisa
     quando ha exemplo no ar — portfolio e afirmacao de fato, e publicar obra
     inventada como real e mentir para o cliente do cliente. */
  CREATE TABLE IF NOT EXISTS obras (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    titulo      TEXT NOT NULL,
    cliente     TEXT NOT NULL DEFAULT '',
    local       TEXT NOT NULL DEFAULT '',
    ano         INTEGER,
    porte       TEXT NOT NULL DEFAULT '',
    duracao     TEXT NOT NULL DEFAULT '',
    servico_id  INTEGER REFERENCES servicos(id),
    resumo      TEXT NOT NULL DEFAULT '',
    desafio     TEXT NOT NULL DEFAULT '',
    solucao     TEXT NOT NULL DEFAULT '',
    resultado   TEXT NOT NULL DEFAULT '',
    escopo      TEXT NOT NULL DEFAULT '',
    foto        TEXT NOT NULL DEFAULT '',
    exemplo     INTEGER NOT NULL DEFAULT 0,
    ordem       INTEGER NOT NULL DEFAULT 0,
    ativo       INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS ix_obras_servico ON obras(servico_id, ativo);

  /* ---------------------------------------------------------------- blog ---
     'publicado_em' nulo = rascunho. Um campo em vez de dois (rascunho +
     data) porque dois campos permitem o estado impossível "publicado sem
     data", e o estado impossível sempre acontece. */
  CREATE TABLE IF NOT EXISTS materias (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT NOT NULL UNIQUE,
    titulo        TEXT NOT NULL,
    resumo        TEXT NOT NULL DEFAULT '',
    corpo         TEXT NOT NULL DEFAULT '',
    capa          TEXT NOT NULL DEFAULT '',
    autor         TEXT NOT NULL DEFAULT 'Equipe INNOVAR',
    publicado_em  TEXT
  );
`);

/* ==========================================================================
   COLUNAS ACRESCENTADAS DEPOIS

   O SQLite não tem `ADD COLUMN IF NOT EXISTS`, e repetir o `ALTER` derruba a
   partida do serviço na segunda vez. Conferir o esquema antes é o que torna
   este arquivo seguro para rodar a cada início — que é o modelo aqui: sem
   ferramenta de migração, o esquema é isto e mais nada.
   ========================================================================== */
function garantirColuna(tabela, coluna, definicao) {
  const existe = db.prepare(`PRAGMA table_info(${tabela})`).all().some((c) => c.name === coluna);
  if (!existe) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
}

garantirColuna("servicos", "imagem", "TEXT NOT NULL DEFAULT ''");

module.exports = db;
