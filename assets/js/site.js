/* ==========================================================================
   INNOVAR — comportamento do site

   Três princípios, e eles explicam quase todas as decisões daqui:

   1. NADA AQUI É REQUISITO PARA O CONTEÚDO EXISTIR. Sem JavaScript, a página
      abre inteira e legível — o que este arquivo faz é entrada suave, estado
      de espera e carrinho. Um site de serviço técnico que exige JS para
      mostrar o telefone perde justamente quem está com a rede da obra.

   2. SÓ `transform` E `opacity` ANIMAM. Animar altura ou posição força o
      navegador a refazer o layout a cada quadro, e no celular real isso
      engasga. O olho não vê a diferença; o dedo vê.

   3. `prefers-reduced-motion` MANDA. Quem pediu menos movimento recebe o
      conteúdo direto, sem deslocamento — enxaqueca vestibular não é
      preferência estética.
   ========================================================================== */
"use strict";

const CALMO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const escapar = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const dinheiro = (centavos) =>
  (Number(centavos || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ==========================================================================
   BARRA DE PROGRESSO

   Responde à única pergunta que faz alguém clicar de novo: "travou ou está
   indo?". Sobe rápido até 80% e só fecha quando termina de verdade — fingir
   100% antes da hora é pior que não ter barra, porque ensina a não confiar
   nela.
   ========================================================================== */
const Progresso = (() => {
  let el = null, timer = null;
  const criar = () => {
    if (el) return el;
    el = document.createElement("div");
    el.className = "progresso";
    el.setAttribute("role", "progressbar");
    el.setAttribute("aria-label", "Carregando");
    document.body.appendChild(el);
    return el;
  };
  return {
    comecar() {
      const b = criar();
      clearTimeout(timer);
      b.style.opacity = "1";
      b.style.width = "12%";
      requestAnimationFrame(() => { b.style.width = "80%"; });
    },
    terminar() {
      if (!el) return;
      el.style.width = "100%";
      timer = setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => { if (el) el.style.width = "0"; }, 320);
      }, 180);
    },
  };
})();

/* ==========================================================================
   ENTRADA DOS BLOCOS

   `IntersectionObserver` acende cada bloco quando ele entra na tela, uma vez
   só (`unobserve`): reanimar ao rolar de volta transforma leitura em desfile.
   ========================================================================== */
function ligarRevelacao(raiz = document) {
  const alvos = raiz.querySelectorAll("[data-revela]:not(.visivel)");
  if (!alvos.length) return;

  if (CALMO || !("IntersectionObserver" in window)) {
    alvos.forEach((e) => e.classList.add("visivel"));
    return;
  }

  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("visivel");
      obs.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: .08 });

  alvos.forEach((el) => {
    /* Cascata dentro do MESMO pai, com teto de 6. Sem o teto, o décimo cartão
       de uma grade grande demoraria quase um segundo para aparecer — e aí não
       é ritmo, é espera. */
    const irmaos = [...(el.parentElement ? el.parentElement.children : [])].filter((x) => x.hasAttribute("data-revela"));
    const pos = Math.min(irmaos.indexOf(el), 5);
    if (pos > 0) el.style.setProperty("--i", pos);
    obs.observe(el);
  });
}

/* ==========================================================================
   SKELETON — só acima de 200 ms

   Abaixo disso ele pisca, e o piscar parece defeito: a tela mostra uma forma
   cinza e a troca antes de a pessoa entender o que era.
   ========================================================================== */
function comEsqueleto(alvo, trabalho, molde) {
  const t = setTimeout(() => { alvo.innerHTML = molde || moldePadrao(); }, 200);
  Progresso.comecar();

  return Promise.resolve()
    .then(trabalho)
    .then((html) => { alvo.innerHTML = html; ligarRevelacao(alvo); return html; })
    .catch((e) => {
      /* O estado de ERRO é o que mais falta nos sites: sem ele, uma falha de
         rede vira tela vazia, e vazio se lê como "não existe nada". */
      alvo.innerHTML = `<div class="erro"><p>${escapar(e.message || "Não foi possível carregar.")}</p>
        <button class="btn btn--contorno btn--peq" data-recarregar>Tentar de novo</button></div>`;
      alvo.querySelector("[data-recarregar]")?.addEventListener("click", () => comEsqueleto(alvo, trabalho, molde));
    })
    .finally(() => { clearTimeout(t); Progresso.terminar(); });
}
const moldePadrao = () => `<div class="esqueleto esqueleto--titulo"></div>
  <div class="esqueleto esqueleto--linha"></div><div class="esqueleto esqueleto--linha" style="width:80%"></div>`;

/* ==========================================================================
   CABEÇALHO
   ========================================================================== */
function ligarCabecalho() {
  const cab = document.querySelector(".cab");
  if (cab) {
    /* `passive: true`: sem isso o navegador espera o ouvinte terminar antes de
       rolar, e a rolagem fica pesada no celular. */
    const olhar = () => cab.classList.toggle("rolou", window.scrollY > 8);
    olhar();
    window.addEventListener("scroll", olhar, { passive: true });
  }

  const botao = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");
  if (!botao || !nav) return;
  botao.addEventListener("click", () => {
    const aberto = nav.classList.toggle("aberta");
    botao.setAttribute("aria-expanded", String(aberto));
  });
  /* Escolher um item fecha o menu. Sem isto, no celular a pessoa toca no link,
     a página troca e o menu continua aberto por cima do conteúdo novo. */
  nav.addEventListener("click", (ev) => {
    if (ev.target.closest("a")) { nav.classList.remove("aberta"); botao.setAttribute("aria-expanded", "false"); }
  });
}

/* ==========================================================================
   CARRINHO — no navegador, com o PREÇO SEMPRE DO SERVIDOR

   Aqui ficam apenas o código do produto e a quantidade. O preço NÃO é
   guardado: preço no navegador é preço que o cliente pode editar, e um
   checkout que confia nele é um checkout que aceita R$ 0,01. O valor é lido do
   servidor a cada abertura do carrinho e recalculado no fechamento.
   ========================================================================== */
const Carrinho = {
  CHAVE: "innovar_carrinho",
  ler() {
    try {
      const v = JSON.parse(localStorage.getItem(this.CHAVE) || "[]");
      return Array.isArray(v) ? v.filter((i) => i && typeof i.sku === "string") : [];
    } catch { return []; }          /* dado corrompido não derruba a loja */
  },
  gravar(itens) {
    try { localStorage.setItem(this.CHAVE, JSON.stringify(itens)); } catch { /* modo privativo: segue sem lembrar */ }
    this.pintar();
  },
  somar(sku, qtd) {
    const itens = this.ler();
    const achado = itens.find((i) => i.sku === sku);
    if (achado) achado.qtd = Math.min(999, Math.max(1, achado.qtd + qtd));
    else itens.push({ sku, qtd: Math.max(1, qtd) });
    this.gravar(itens);
  },
  trocar(sku, qtd) {
    const itens = this.ler();
    const achado = itens.find((i) => i.sku === sku);
    if (!achado) return;
    achado.qtd = Math.min(999, Math.max(1, qtd));
    this.gravar(itens);
  },
  tirar(sku) { this.gravar(this.ler().filter((i) => i.sku !== sku)); },
  esvaziar() { this.gravar([]); },
  quantos() { return this.ler().reduce((a, i) => a + Number(i.qtd || 0), 0); },
  pintar() {
    const el = document.querySelector(".carrinho-btn__n");
    if (!el) return;
    const n = this.quantos();
    el.textContent = n > 99 ? "99+" : String(n);
    el.hidden = n === 0;          /* zero não aparece: ruído permanente ensina a ignorar o lugar */
  },
  /* Uma ida ao servidor para saber preço, nome e estoque atuais. É esta
     resposta, e não o que está guardado aqui, que a tela mostra. */
  async resolver() {
    const itens = this.ler();
    if (!itens.length) return { itens: [], total: 0 };
    const r = await fetch("/api/carrinho/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens }),
    });
    if (!r.ok) throw new Error("Não foi possível consultar os preços agora.");
    const dados = await r.json();

    /* O servidor devolve só o que ainda existe. O que sumiu do catálogo sai do
       carrinho aqui — senão o item fantasma fica para sempre, e a pessoa tenta
       fechar o pedido sem entender por que não conta. */
    const vivos = new Set(dados.itens.map((i) => i.sku));
    if (vivos.size !== itens.length) {
      try { localStorage.setItem(this.CHAVE, JSON.stringify(itens.filter((i) => vivos.has(i.sku)))); } catch { /* segue */ }
      this.pintar();
    }
    return dados;
  },
};

/* ------------------------------------------------------------- avisinho --- */
/* Confirmação curta e discreta. Sem ela, clicar em "Adicionar" no meio da
   grade não muda nada visível além do contador lá em cima, e a pessoa clica
   de novo — e leva dois. */
function avisar(mensagem) {
  let caixa = document.querySelector(".aviso-flutuante");
  if (!caixa) {
    caixa = document.createElement("div");
    caixa.className = "aviso-flutuante";
    caixa.setAttribute("role", "status");
    caixa.setAttribute("aria-live", "polite");
    document.body.appendChild(caixa);
  }
  caixa.textContent = mensagem;
  caixa.classList.add("visivel");
  clearTimeout(caixa._t);
  caixa._t = setTimeout(() => caixa.classList.remove("visivel"), 2600);
}

function ligarBotoesDeCompra() {
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-add]");
    if (!b) return;
    Carrinho.somar(b.dataset.add, 1);
    avisar("Adicionado ao carrinho.");
  });

  document.querySelectorAll("[data-comprar]").forEach((form) => {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const qtd = Math.max(1, Number(form.querySelector('[name="qtd"]').value) || 1);
      Carrinho.somar(form.dataset.comprar, qtd);
      avisar(`${qtd} item${qtd > 1 ? "s" : ""} no carrinho.`);
    });
  });
}

/* ==========================================================================
   TELA DO CARRINHO
   ========================================================================== */
function ligarTelaCarrinho() {
  const alvo = document.querySelector("[data-carrinho]");
  if (!alvo) return;

  const desenhar = () => comEsqueleto(alvo, async () => {
    const { itens, total } = await Carrinho.resolver();
    if (!itens.length) {
      return `<div class="vazio" data-revela>
        <p>Seu carrinho está vazio.</p>
        <p><a class="btn btn--primario" href="/loja/">Ver o material</a></p></div>`;
    }

    const linha = (i) => `<tr>
      <td>
        <a href="/produto/${escapar(i.slug)}/">${escapar(i.nome)}</a>
        <span class="tab__sub">${escapar(i.sku)} · ${dinheiro(i.preco_cent)} / ${escapar(i.unidade)}</span>
        ${i.quantidade > i.estoque ? `<span class="tab__alerta">Só ${i.estoque} em estoque</span>` : ""}
      </td>
      <td class="num">
        <input class="qtd" type="number" inputmode="numeric" min="1" max="999"
               value="${i.quantidade}" data-qtd="${escapar(i.sku)}" aria-label="Quantidade de ${escapar(i.nome)}">
      </td>
      <td class="num">${dinheiro(i.subtotal_cent)}</td>
      <td class="num"><button class="btn-tirar" type="button" data-tirar="${escapar(i.sku)}"
            aria-label="Tirar ${escapar(i.nome)} do carrinho">&times;</button></td>
    </tr>`;

    return `<div class="card" data-revela>
      <div class="tabela-rolagem">
        <table class="tabela">
          <thead><tr><th>Item</th><th class="num">Qtd</th><th class="num">Subtotal</th><th></th></tr></thead>
          <tbody>${itens.map(linha).join("")}</tbody>
          <tfoot><tr><th colspan="2">Total</th><td class="num total">${dinheiro(total)}</td><td></td></tr></tfoot>
        </table>
      </div>
      <div class="form__pe">
        <a class="btn btn--primario" href="/checkout/">Fechar pedido</a>
        <a class="btn btn--contorno" href="/loja/">Continuar comprando</a>
        <button class="btn btn--texto" type="button" data-esvaziar>Esvaziar</button>
      </div>
    </div>`;
  });

  alvo.addEventListener("change", (ev) => {
    const campo = ev.target.closest("[data-qtd]");
    if (!campo) return;
    Carrinho.trocar(campo.dataset.qtd, Number(campo.value));
    desenhar();
  });
  alvo.addEventListener("click", (ev) => {
    const tirar = ev.target.closest("[data-tirar]");
    if (tirar) { Carrinho.tirar(tirar.dataset.tirar); return desenhar(); }
    if (ev.target.closest("[data-esvaziar]")) { Carrinho.esvaziar(); return desenhar(); }
  });

  desenhar();
}

/* ==========================================================================
   CHECKOUT
   ========================================================================== */
function ligarCheckout() {
  const form = document.querySelector("[data-checkout]");
  const resumo = document.querySelector("[data-resumo]");
  if (!form || !resumo) return;

  /* O endereço só aparece para quem escolheu entrega. Campo pedido sem
     necessidade é campo abandonado — e a maioria dos clientes é de Caruaru e
     retira na loja. */
  const enderecos = form.querySelector("[data-so-entrega]");
  const olharEntrega = () => {
    const entrega = form.querySelector('[name="entrega"]:checked')?.value === "entrega";
    enderecos.hidden = !entrega;
    enderecos.querySelectorAll("input").forEach((i) => { i.required = entrega && i.name === "endereco"; });
  };
  form.querySelectorAll('[name="entrega"]').forEach((r) => r.addEventListener("change", olharEntrega));
  olharEntrega();

  comEsqueleto(resumo, async () => {
    const { itens, total } = await Carrinho.resolver();
    if (!itens.length) {
      form.querySelector('[type="submit"]').disabled = true;
      return `<h2>Resumo</h2><p class="vazio">Não há itens no carrinho.
        <a href="/loja/">Voltar à loja</a>.</p>`;
    }
    return `<h2>Resumo</h2>
      <ul class="resumo__itens">${itens.map((i) => `<li>
        <span>${escapar(i.nome)}<small>${i.quantidade} × ${dinheiro(i.preco_cent)} / ${escapar(i.unidade)}</small></span>
        <b>${dinheiro(i.subtotal_cent)}</b></li>`).join("")}</ul>
      <p class="resumo__total"><span>Total</span><b>${dinheiro(total)}</b></p>
      <p class="resumo__nota">O frete, quando houver, é combinado depois — por isso ele não entra nesta conta.</p>`;
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const botao = form.querySelector('[type="submit"]');
    botao.setAttribute("aria-busy", "true");
    botao.disabled = true;
    Progresso.comecar();

    try {
      const dados = Object.fromEntries(new FormData(form));
      dados.itens = Carrinho.ler();
      const r = await fetch("/checkout/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const resposta = await r.json();
      if (!r.ok) throw new Error(resposta.erro || "Não foi possível enviar o pedido.");

      /* O carrinho só é esvaziado DEPOIS de o servidor confirmar o protocolo.
         Esvaziar antes e falhar o envio deixaria a pessoa sem pedido e sem
         carrinho — o pior dos dois mundos. */
      Carrinho.esvaziar();
      window.location.href = `/pedido/${encodeURIComponent(resposta.protocolo)}/`;
    } catch (e) {
      avisar(e.message);
      botao.removeAttribute("aria-busy");
      botao.disabled = false;
      Progresso.terminar();
    }
  });
}

/* ==========================================================================
   FORMULÁRIOS COMUNS

   Trava o botão enquanto envia. Sem isto, o duplo clique num formulário lento
   vira dois orçamentos — e a pessoa não sabe se o primeiro chegou.
   ========================================================================== */
function ligarFormularios() {
  document.querySelectorAll("form[data-envia]:not([data-checkout])").forEach((form) => {
    form.addEventListener("submit", () => {
      const b = form.querySelector('[type="submit"]');
      if (b) { b.setAttribute("aria-busy", "true"); b.disabled = true; }
      Progresso.comecar();
    });
  });
}

/* ==========================================================================
   PARTIDA — cada peça isolada da vizinha

   Sem o `try`, um erro em `ligarCabecalho` interromperia a função inteira e
   `ligarRevelacao` nunca rodaria — e aí os blocos com `data-revela` ficariam
   apagados. Um menu quebrado é um aborrecimento; meia página invisível é o
   site fora do ar.
   ========================================================================== */
function comSegurança(nome, fn) {
  try { fn(); } catch (e) { console.error(`[innovar] ${nome} falhou:`, e); }
}

document.addEventListener("DOMContentLoaded", () => {
  comSegurança("revelação", () => ligarRevelacao());      /* primeiro: é o que esconde conteúdo */
  comSegurança("cabeçalho", ligarCabecalho);
  comSegurança("formulários", ligarFormularios);
  comSegurança("botões de compra", ligarBotoesDeCompra);
  comSegurança("tela do carrinho", ligarTelaCarrinho);
  comSegurança("checkout", ligarCheckout);
  comSegurança("carrinho", () => Carrinho.pintar());
  /* O ano do rodapé sai do relógio: um ano cravado no HTML fica velho em
     1º de janeiro, e ninguém percebe até o cliente perceber. */
  comSegurança("ano", () => {
    document.querySelectorAll("[data-ano]").forEach((e) => { e.textContent = new Date().getFullYear(); });
  });
});

window.INNOVAR = { Progresso, Carrinho, comEsqueleto, avisar };
