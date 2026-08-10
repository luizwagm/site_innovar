/* ==========================================================================
   INNOVAR — telas da loja

   A REGRA QUE ORGANIZA TUDO AQUI: o navegador guarda apenas CÓDIGO e
   QUANTIDADE. Preço, nome, unidade e disponibilidade são lidos do banco a cada
   tela. Guardar preço no navegador é guardar um número que o comprador pode
   editar, e um checkout que confia nele fecha pedido de um centavo.

   Consequência prática: carrinho e conferência são montados por JavaScript a
   partir de uma consulta ao servidor. Sem JS, a loja ainda navega, o produto
   ainda abre e o telefone continua na tela — só não dá para fechar o pedido
   sozinho. É a degradação honesta possível.
   ========================================================================== */
"use strict";

const { pagina, secao, capa, botao, icone, esc, dinheiro, SITE } = require("./layout");
const { texto } = require("./textos");
const { cartaoProduto } = require("./paginas-site");
const repo = require("./repo");

/* =============================================================== vitrine == */
function loja({ categoria = null, busca = null, pagina: numPagina = 1 } = {}) {
  const cats = repo.categorias();
  const r = repo.produtos({ categoria, busca, pagina: numPagina, porPagina: 12 });
  const atual = cats.find((c) => c.slug === categoria);

  const filtro = (slug, rotulo, quantos) => {
    const ativo = (slug || null) === categoria;
    return `<a class="chip${ativo ? " chip--ativo" : ""}" href="/loja/${slug ? `?categoria=${encodeURIComponent(slug)}` : ""}"
      ${ativo ? 'aria-current="true"' : ""}>${esc(rotulo)}${quantos != null ? ` <span>${quantos}</span>` : ""}</a>`;
  };

  const corpo = capa({
    olho: "Loja", titulo: atual ? atual.nome : texto("LOJA_TITULO"),
    texto: atual ? "" : texto("LOJA_TEXTO"),
    migalha: atual ? [{ rotulo: "Loja", href: "/loja/" }, { rotulo: atual.nome }] : [{ rotulo: "Loja" }],
  }) + `
<section class="secao">
  <div class="container">
    <nav class="chips" aria-label="Categorias">
      ${filtro("", "Tudo", r.total && !categoria ? r.total : null)}
      ${cats.map((c) => filtro(c.slug, c.nome, c.quantos)).join("")}
    </nav>

    ${r.itens.length
      ? `<div class="grade grade--4">${r.itens.map(cartaoProduto).join("")}</div>
         ${paginacao(r, categoria)}`
      : `<p class="vazio">Nenhum item nesta categoria ainda.</p>`}

    <p class="aviso" data-revela>${icone("doc", 18)} ${esc(texto("LOJA_AVISO_ENTREGA"))}</p>
  </div>
</section>`;

  return pagina({
    titulo: atual ? `${atual.nome} — Loja ${texto("EMPRESA_NOME")}` : `${texto("LOJA_TITULO")} — ${texto("EMPRESA_NOME")}`,
    descricao: texto("LOJA_TEXTO"),
    url: "/loja/", corpo,
  });
}

/* A paginação preserva o filtro no endereço. Sem isso, "página 2" joga a
   pessoa de volta no catálogo inteiro — e ela não entende por quê. */
function paginacao(r, categoria) {
  if (r.paginas <= 1) return "";
  const url = (n) => `/loja/?${categoria ? `categoria=${encodeURIComponent(categoria)}&` : ""}pagina=${n}`;
  const paginas = [];
  for (let n = 1; n <= r.paginas; n++) {
    paginas.push(n === r.pagina
      ? `<span class="pag__n pag__n--aqui" aria-current="page">${n}</span>`
      : `<a class="pag__n" href="${url(n)}">${n}</a>`);
  }
  return `<nav class="pag" aria-label="Páginas">
    ${r.pagina > 1 ? `<a class="pag__seta" href="${url(r.pagina - 1)}" rel="prev">Anterior</a>` : ""}
    ${paginas.join("")}
    ${r.pagina < r.paginas ? `<a class="pag__seta" href="${url(r.pagina + 1)}" rel="next">Próxima</a>` : ""}
  </nav>`;
}

/* =============================================================== produto == */
function produto(p) {
  const esgotado = p.estoque <= 0;
  const relacionados = repo.produtos({ categoria: p.categoria_slug, porPagina: 5 })
    .itens.filter((x) => x.id !== p.id).slice(0, 4);

  const corpo = capa({
    olho: p.categoria || "Material", titulo: p.nome,
    migalha: [
      { rotulo: "Loja", href: "/loja/" },
      ...(p.categoria ? [{ rotulo: p.categoria, href: `/loja/?categoria=${encodeURIComponent(p.categoria_slug)}` }] : []),
      { rotulo: p.nome },
    ],
  }) + `
<section class="secao">
  <div class="container produto__grade">
    <div class="produto__foto card" data-revela>
      ${p.foto ? `<img src="${esc(p.foto)}" alt="${esc(p.nome)}" width="800" height="600">`
        : `<span class="prod__sem-foto">${icone("gota", 60)}</span>`}
    </div>

    <div class="produto__lado" data-revela>
      ${p.marca ? `<p class="prod__marca">${esc(p.marca)}</p>` : ""}
      <p class="produto__sku">Código ${esc(p.sku)}</p>

      <p class="produto__preco">${dinheiro(p.preco_cent)}
        <span class="prod__un">/ ${esc(p.unidade)}</span></p>

      <!-- A UNIDADE ao lado do preço não é detalhe de layout: "R$ 32,90" num
           tubo é ambíguo entre o metro e a barra de seis metros, e a
           ambiguidade só aparece na hora da entrega, quando já virou
           discussão. -->
      <p class="produto__estoque ${esgotado ? "produto__estoque--zero" : ""}">
        ${esgotado ? `${icone("nao", 16)} Sem estoque no momento`
          : `${icone("ok", 16)} ${p.estoque} ${esc(p.unidade)}${p.estoque > 1 ? "s" : ""} em estoque`}</p>

      ${esgotado ? `<p>${botao("/contato/", "Avise-me quando chegar", "contorno")}</p>` : `
      <form class="produto__compra" data-comprar="${esc(p.sku)}">
        <label class="campo campo--qtd"><span>Quantidade</span>
          <input name="qtd" type="number" inputmode="numeric" value="1" min="1" max="${p.estoque}" step="1"></label>
        <button class="btn btn--primario" type="submit">Adicionar ao carrinho</button>
      </form>`}

      ${p.descricao ? `<div class="produto__desc"><h2>Descrição</h2><p>${esc(p.descricao)}</p></div>` : ""}
      <p class="aviso aviso--peq">${icone("doc", 16)} ${esc(texto("LOJA_AVISO_ENTREGA"))}</p>
    </div>
  </div>
</section>

${relacionados.length ? secao({ titulo: "Costuma sair junto", fundo: "secao--gelo",
    corpo: `<div class="grade grade--4">${relacionados.map(cartaoProduto).join("")}</div>` }) : ""}`;

  return pagina({
    titulo: `${p.nome} — ${texto("EMPRESA_NOME")}`,
    descricao: p.descricao || p.nome,
    url: `/produto/${p.slug}/`, corpo,
    dadosLd: {
      "@context": "https://schema.org", "@type": "Product",
      name: p.nome, sku: p.sku, description: p.descricao || undefined,
      brand: p.marca ? { "@type": "Brand", name: p.marca } : undefined,
      offers: {
        "@type": "Offer", priceCurrency: "BRL", price: (p.preco_cent / 100).toFixed(2),
        availability: esgotado ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        url: `${SITE}/produto/${p.slug}/`,
      },
    },
  });
}

/* ============================================================== carrinho == */
/* A tela chega VAZIA e é preenchida pelo script com o que o servidor responder
   para os códigos guardados no navegador. O esqueleto ocupa o espaço enquanto
   isso — sem ele a página pula quando os itens chegam, e o clique de quem já
   estava mirando o botão acerta outra coisa. */
function carrinho() {
  const corpo = capa({ olho: "Loja", titulo: "Seu carrinho", migalha: [{ rotulo: "Loja", href: "/loja/" }, { rotulo: "Carrinho" }] })
    + `<section class="secao"><div class="container">
    <div id="carrinho" data-carrinho>
      <div class="esqueleto esqueleto--linha"></div>
      <div class="esqueleto esqueleto--linha" style="width:70%"></div>
      <div class="esqueleto esqueleto--linha" style="width:40%"></div>
    </div>
    <noscript><p class="vazio">O carrinho precisa de JavaScript. Você pode
      <a href="/contato/">pedir pelo WhatsApp</a> — mande os códigos dos itens.</p></noscript>
  </div></section>`;

  return pagina({ titulo: `Carrinho — ${texto("EMPRESA_NOME")}`,
    descricao: "Itens escolhidos na loja da INNOVAR.", url: "/carrinho/", corpo, semIndex: true });
}

/* ============================================================== checkout == */
function checkout() {
  const corpo = capa({ olho: "Loja", titulo: "Fechar pedido", migalha: [{ rotulo: "Carrinho", href: "/carrinho/" }, { rotulo: "Fechar pedido" }] })
    + `<section class="secao"><div class="container checkout__grade">
  <form class="form card" id="checkout" method="post" action="/checkout/" data-checkout data-envia>
    <h2>Seus dados</h2>
    <div class="form__linha">
      <label class="campo"><span>Nome completo <b aria-hidden="true">*</b></span>
        <input name="nome" required maxlength="120" autocomplete="name"></label>
      <label class="campo"><span>CPF ou CNPJ <b aria-hidden="true">*</b></span>
        <input name="documento" required maxlength="20" inputmode="numeric"
               autocomplete="off" placeholder="Para a nota fiscal"></label>
    </div>
    <div class="form__linha">
      <label class="campo"><span>Telefone ou WhatsApp <b aria-hidden="true">*</b></span>
        <input name="telefone" type="tel" inputmode="tel" required maxlength="20" autocomplete="tel"></label>
      <label class="campo"><span>E-mail</span>
        <input name="email" type="email" maxlength="160" autocomplete="email"></label>
    </div>

    <h2>Entrega</h2>
    <!-- Retirada primeiro e marcada por padrão: é a opção sem custo e sem
         espera, e a maioria dos clientes é de Caruaru. Padrão que serve à
         maioria é um campo a menos para preencher. -->
    <div class="opcoes">
      <label class="opcao"><input type="radio" name="entrega" value="retirada" checked>
        <span><b>Retirar na loja</b><small>Sem custo, em Caruaru</small></span></label>
      <label class="opcao"><input type="radio" name="entrega" value="entrega">
        <span><b>Entrega combinada</b><small>Frete calculado pelo volume, no WhatsApp</small></span></label>
    </div>

    <div class="form__linha" data-so-entrega hidden>
      <label class="campo"><span>CEP</span>
        <input name="cep" maxlength="9" inputmode="numeric" autocomplete="postal-code"></label>
      <label class="campo"><span>Endereço completo</span>
        <input name="endereco" maxlength="200" autocomplete="street-address"
               placeholder="Rua, número, bairro e ponto de referência"></label>
    </div>

    <h2>Pagamento</h2>
    <div class="opcoes">
      <label class="opcao"><input type="radio" name="pagamento" value="pix" checked>
        <span><b>PIX</b><small>Enviamos a chave junto com a confirmação</small></span></label>
      <label class="opcao"><input type="radio" name="pagamento" value="cartao">
        <span><b>Cartão na retirada</b><small>Débito ou crédito, na loja</small></span></label>
      <label class="opcao"><input type="radio" name="pagamento" value="faturado">
        <span><b>Faturado</b><small>Para cliente com cadastro aprovado</small></span></label>
    </div>

    <label class="campo"><span>Observação</span>
      <textarea name="obs" rows="3" maxlength="600" placeholder="Algo que a gente precise saber sobre o pedido"></textarea></label>

    <div class="armadilha" aria-hidden="true">
      <label>Não preencha<input name="apelido" tabindex="-1" autocomplete="off"></label>
    </div>

    <div class="form__pe">
      <button class="btn btn--primario" type="submit">Enviar pedido</button>
      <p class="form__nota">${esc(texto("CHECKOUT_AVISO"))}</p>
    </div>
  </form>

  <aside class="checkout__resumo card" data-resumo>
    <h2>Resumo</h2>
    <div class="esqueleto esqueleto--linha"></div>
    <div class="esqueleto esqueleto--linha" style="width:60%"></div>
  </aside>
</div></section>`;

  return pagina({ titulo: `Fechar pedido — ${texto("EMPRESA_NOME")}`,
    descricao: "Conclusão do pedido na loja da INNOVAR.", url: "/checkout/", corpo, semIndex: true });
}

/* ================================================================ pedido == */
function pedido(p) {
  const linha = (i) => `<tr>
    <td>${esc(i.nome)}<span class="tab__sub">${esc(i.sku)} · ${esc(i.unidade)}</span></td>
    <td class="num">${i.quantidade}</td>
    <td class="num">${dinheiro(i.preco_cent)}</td>
    <td class="num">${dinheiro(i.preco_cent * i.quantidade)}</td>
  </tr>`;

  const corpo = capa({ olho: "Pedido recebido", titulo: p.protocolo, migalha: [{ rotulo: "Loja", href: "/loja/" }, { rotulo: "Pedido" }] })
    + secao({ estreita: true, corpo: `
    <div class="card card--marca recibo" data-revela>
      <p>${esc(texto("CHECKOUT_AVISO"))}</p>
      <p class="recibo__nota">Guarde este número: <strong>${esc(p.protocolo)}</strong>. É por ele que a gente encontra o seu pedido.</p>
    </div>

    <div class="card" data-revela>
      <h2>Itens</h2>
      <div class="tabela-rolagem">
        <table class="tabela">
          <thead><tr><th>Item</th><th class="num">Qtd</th><th class="num">Unitário</th><th class="num">Total</th></tr></thead>
          <tbody>${p.itens.map(linha).join("")}</tbody>
          <tfoot><tr><th colspan="3">Total</th><td class="num total">${dinheiro(p.total_cent)}</td></tr></tfoot>
        </table>
      </div>
      <dl class="dados">
        <dt>Nome</dt><dd>${esc(p.nome)}</dd>
        <dt>Contato</dt><dd>${esc(p.telefone)}${p.email ? ` · ${esc(p.email)}` : ""}</dd>
        <dt>Entrega</dt><dd>${p.entrega === "entrega" ? `Entrega combinada${p.endereco ? ` — ${esc(p.endereco)}` : ""}` : "Retirada na loja"}</dd>
        <dt>Pagamento</dt><dd>${esc({ pix: "PIX", cartao: "Cartão na retirada", faturado: "Faturado" }[p.pagamento] || p.pagamento)}</dd>
        ${p.obs ? `<dt>Observação</dt><dd>${esc(p.obs)}</dd>` : ""}
      </dl>
      <p class="form__pe">${botao("/loja/", "Continuar comprando", "contorno")}</p>
    </div>` });

  return pagina({ titulo: `Pedido ${p.protocolo} — ${texto("EMPRESA_NOME")}`,
    descricao: "Comprovante do pedido.", url: `/pedido/${p.protocolo}/`, corpo, semIndex: true });
}

module.exports = { loja, produto, carrinho, checkout, pedido };
