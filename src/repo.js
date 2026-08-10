/* ==========================================================================
   INNOVAR — consultas

   Toda leitura e escrita do banco passa por aqui. As páginas montam HTML e não
   sabem escrever SQL; o dia em que uma consulta ficar lenta ou uma regra mudar
   (produto esgotado some da vitrine, matéria só aparece publicada), o conserto
   é num lugar só.

   As instruções são PREPARADAS uma vez e reaproveitadas — além de mais rápido,
   é o que garante que todo valor entra por parâmetro. Concatenar valor em SQL
   é como o `sku` do carrinho vira injeção.
   ========================================================================== */
"use strict";

const db = require("./db");

/* ------------------------------------------------------------- serviços --- */
const qServicosAtivos = db.prepare("SELECT * FROM servicos WHERE ativo = 1 ORDER BY ordem, nome");
const qServicoPorSlug = db.prepare("SELECT * FROM servicos WHERE slug = ? AND ativo = 1");

const servicosAtivos = () => qServicosAtivos.all();
const servicoPorSlug = (slug) => qServicoPorSlug.get(slug);

/* ----------------------------------------------------------------- obras -- */
/* O `LEFT JOIN` e não `JOIN`: uma obra pode não estar amarrada a nenhuma frente
   de serviço (uma reforma que misturou tudo), e com `JOIN` ela sumiria do
   portfólio sem ninguém entender por quê. */
const qObras = db.prepare(`
  SELECT o.*, s.nome AS servico, s.slug AS servico_slug
  FROM obras o LEFT JOIN servicos s ON s.id = o.servico_id
  WHERE o.ativo = 1 AND (@servico IS NULL OR s.slug = @servico)
  ORDER BY o.ordem, o.ano DESC, o.id DESC
  LIMIT @limite`);

const qObraPorSlug = db.prepare(`
  SELECT o.*, s.nome AS servico, s.slug AS servico_slug
  FROM obras o LEFT JOIN servicos s ON s.id = o.servico_id
  WHERE o.slug = ? AND o.ativo = 1`);

/* Só as frentes que TÊM obra publicada viram filtro. Um filtro que devolve
   lista vazia é um beco: a pessoa clica, não vê nada e conclui que o site está
   quebrado — não que aquela frente ainda não tem obra cadastrada. */
const qServicosComObra = db.prepare(`
  SELECT s.slug, s.nome, COUNT(o.id) AS quantas
  FROM servicos s JOIN obras o ON o.servico_id = s.id AND o.ativo = 1
  WHERE s.ativo = 1 GROUP BY s.id ORDER BY s.ordem`);

const qTemExemplo = db.prepare("SELECT COUNT(*) AS n FROM obras WHERE ativo = 1 AND exemplo = 1");

const obras = ({ servico = null, limite = 60 } = {}) => qObras.all({ servico, limite });
const obraPorSlug = (slug) => qObraPorSlug.get(slug);
const servicosComObra = () => qServicosComObra.all();
const temObraDeExemplo = () => qTemExemplo.get().n > 0;

/* ------------------------------------------------------------------ loja -- */
const qCategorias = db.prepare(`
  SELECT c.*, (SELECT COUNT(*) FROM produtos p WHERE p.categoria_id = c.id AND p.ativo = 1) AS quantos
  FROM categorias c ORDER BY c.ordem, c.nome`);

/* A vitrine mostra o esgotado, e de propósito: sumir com o item faz quem
   procurava concluir que a loja não trabalha com aquilo. O que muda é o botão
   — some o "comprar" e entra o "avise-me", que é uma conversa em vez de uma
   porta fechada. */
const qProdutos = db.prepare(`
  SELECT p.*, c.nome AS categoria, c.slug AS categoria_slug
  FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id
  WHERE p.ativo = 1 AND (@categoria IS NULL OR c.slug = @categoria)
    AND (@busca IS NULL OR p.nome LIKE @curinga OR p.sku LIKE @curinga OR p.marca LIKE @curinga)
  ORDER BY (p.estoque = 0), c.ordem, p.nome
  LIMIT @limite OFFSET @salto`);

const qProdutosTotal = db.prepare(`
  SELECT COUNT(*) AS n FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id
  WHERE p.ativo = 1 AND (@categoria IS NULL OR c.slug = @categoria)
    AND (@busca IS NULL OR p.nome LIKE @curinga OR p.sku LIKE @curinga OR p.marca LIKE @curinga)`);

const qProdutoPorSlug = db.prepare(`
  SELECT p.*, c.nome AS categoria, c.slug AS categoria_slug
  FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id
  WHERE p.slug = ? AND p.ativo = 1`);

const qProdutosPorSku = db.prepare(`SELECT * FROM produtos WHERE ativo = 1 AND sku IN (SELECT value FROM json_each(?))`);

const categorias = () => qCategorias.all();

function produtos({ categoria = null, busca = null, pagina = 1, porPagina = 12 } = {}) {
  const p = {
    categoria, busca,
    curinga: busca ? `%${busca}%` : null,
    limite: porPagina,
    salto: (Math.max(1, pagina) - 1) * porPagina,
  };
  const total = qProdutosTotal.get(p).n;
  return {
    itens: qProdutos.all(p),
    total,
    pagina: Math.max(1, pagina),
    porPagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

const produtoPorSlug = (slug) => qProdutoPorSlug.get(slug);

/* O CARRINHO CHEGA DO NAVEGADOR SÓ COM SKU E QUANTIDADE. O preço é buscado
   aqui, sempre. Aceitar o preço que o navegador manda é aceitar o preço que o
   comprador digitou — e um checkout assim fecha pedido de um centavo. */
function carrinhoResolvido(itens) {
  const skus = [...new Set((itens || []).map((i) => String(i.sku || "")).filter(Boolean))].slice(0, 60);
  if (!skus.length) return { linhas: [], total: 0 };

  const achados = new Map(qProdutosPorSku.all(JSON.stringify(skus)).map((p) => [p.sku, p]));
  const linhas = [];
  for (const item of itens) {
    const prod = achados.get(String(item.sku));
    if (!prod) continue;                                   // sumiu do catálogo: sai do carrinho
    const qtd = Math.max(1, Math.min(999, Math.floor(Number(item.qtd) || 1)));
    linhas.push({ produto: prod, quantidade: qtd, subtotal_cent: prod.preco_cent * qtd });
  }
  return { linhas, total: linhas.reduce((a, l) => a + l.subtotal_cent, 0) };
}

/* ------------------------------------------------------------- protocolo -- */
/* PED-2026-00001. O ano no meio conta a idade do pedido sem consulta, e o
   contador reinicia por ano — o cliente lê "00007" em vez de "10432", que
   parece muito para uma loja que abriu semana passada.

   `MAX(...)+1` dentro de uma transação: o SQLite serializa a escrita, então
   dois checkouts simultâneos não tiram o mesmo número. Fora da transação,
   tirariam. */
function proximoProtocolo(tabela, prefixo) {
  const ano = new Date().getFullYear();
  const inicio = `${prefixo}-${ano}-`;
  const ultimo = db.prepare(
    `SELECT protocolo FROM ${tabela} WHERE protocolo LIKE ? ORDER BY protocolo DESC LIMIT 1`
  ).get(`${inicio}%`);
  const n = ultimo ? Number(ultimo.protocolo.slice(inicio.length)) + 1 : 1;
  return inicio + String(n).padStart(5, "0");
}

/* ------------------------------------------------------------- pedidos ---- */
const criarPedido = db.transaction((dados, linhas) => {
  const protocolo = proximoProtocolo("pedidos", "PED");
  const total = linhas.reduce((a, l) => a + l.subtotal_cent, 0);

  const r = db.prepare(`INSERT INTO pedidos
    (protocolo, nome, email, telefone, documento, cep, endereco, entrega, pagamento, total_cent, obs)
    VALUES (@protocolo, @nome, @email, @telefone, @documento, @cep, @endereco, @entrega, @pagamento, @total, @obs)`)
    .run({ ...dados, protocolo, total });

  const inserirItem = db.prepare(`INSERT INTO pedido_itens
    (pedido_id, produto_id, sku, nome, unidade, preco_cent, quantidade)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const baixarEstoque = db.prepare("UPDATE produtos SET estoque = MAX(0, estoque - ?) WHERE id = ?");

  for (const l of linhas) {
    inserirItem.run(r.lastInsertRowid, l.produto.id, l.produto.sku, l.produto.nome,
      l.produto.unidade, l.produto.preco_cent, l.quantidade);
    baixarEstoque.run(l.quantidade, l.produto.id);
  }
  return protocolo;
});

const qPedidoPorProtocolo = db.prepare("SELECT * FROM pedidos WHERE protocolo = ?");
const qItensDoPedido = db.prepare("SELECT * FROM pedido_itens WHERE pedido_id = ? ORDER BY id");

function pedidoPorProtocolo(protocolo) {
  const pedido = qPedidoPorProtocolo.get(protocolo);
  if (!pedido) return null;
  return { ...pedido, itens: qItensDoPedido.all(pedido.id) };
}

/* ----------------------------------------------------------- orçamentos --- */
const criarOrcamento = db.transaction((dados) => {
  const protocolo = proximoProtocolo("orcamentos", "ORC");
  db.prepare(`INSERT INTO orcamentos (protocolo, nome, empresa, email, telefone, cidade, servico, prazo, mensagem)
    VALUES (@protocolo, @nome, @empresa, @email, @telefone, @cidade, @servico, @prazo, @mensagem)`)
    .run({ ...dados, protocolo });
  return protocolo;
});

/* ------------------------------------------------------------------ feed -- */
const qMaterias = db.prepare(
  "SELECT * FROM materias WHERE publicado_em IS NOT NULL ORDER BY publicado_em DESC LIMIT ?");
const qMateriaPorSlug = db.prepare("SELECT * FROM materias WHERE slug = ? AND publicado_em IS NOT NULL");

const materias = (limite = 20) => qMaterias.all(limite);
const materiaPorSlug = (slug) => qMateriaPorSlug.get(slug);

/* --------------------------------------------------------------- busca ---- */
/* Busca em três tabelas com o mesmo termo. Não é índice de texto completo — o
   catálogo tem centenas de itens, não milhões, e um LIKE resolve sem trazer a
   complexidade (e o desalinhamento de acentos) do FTS. */
function buscar(termo) {
  const t = `%${termo}%`;
  return {
    produtos: db.prepare(`SELECT slug, nome, preco_cent, unidade, estoque FROM produtos
      WHERE ativo = 1 AND (nome LIKE ? OR sku LIKE ? OR marca LIKE ? OR descricao LIKE ?) LIMIT 12`).all(t, t, t, t),
    servicos: db.prepare(`SELECT slug, nome, resumo FROM servicos
      WHERE ativo = 1 AND (nome LIKE ? OR resumo LIKE ? OR corpo LIKE ?) LIMIT 8`).all(t, t, t),
    materias: db.prepare(`SELECT slug, titulo, resumo FROM materias
      WHERE publicado_em IS NOT NULL AND (titulo LIKE ? OR resumo LIKE ? OR corpo LIKE ?) LIMIT 8`).all(t, t, t),
  };
}

module.exports = {
  servicosAtivos, servicoPorSlug,
  obras, obraPorSlug, servicosComObra, temObraDeExemplo,
  categorias, produtos, produtoPorSlug, carrinhoResolvido,
  criarPedido, pedidoPorProtocolo,
  criarOrcamento,
  materias, materiaPorSlug,
  buscar,
};
