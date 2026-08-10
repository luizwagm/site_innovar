# Produto — INNOVAR Engenharia e Equipamentos

> O mapa do site, o que cada página faz e por quê. Quem for mexer no site depois
> lê isto primeiro para não quebrar uma intenção sem saber que ela existia.

---

## 1. Quem chega, e o que quer

| quem | como chega | o que precisa em 10 segundos |
|---|---|---|
| **Responsável de obra / manutenção predial** | busca "instalação elétrica industrial Caruaru" | se a INNOVAR faz **aquele porte**, e se vai lá olhar |
| **Síndico / administrador de condomínio** | indicação, busca "sistema de incêndio condomínio" | documento e norma — AVCB, ART, laudo |
| **Dono de comércio** (restaurante, padaria) | busca "instalação de gás" | prazo, e se resolve a exigência da vistoria |
| **Comprador de material** | busca produto ou preço | preço, unidade, se tem em estoque, quando chega |
| **Concorrente / curioso** | — | (não é público; não desenhar para ele) |

Os quatro primeiros são **B2B local**. Nenhum deles decide num clique — todos
decidem depois de **entender**. É isso que põe o conteúdo técnico à frente do
botão de orçamento.

---

## 2. Mapa do site

```
/                        home — as duas portas (serviço · loja)
/servicos/               os 4 serviços, com o que cada um resolve
/servicos/<slug>/        página por serviço  ← onde a dúvida técnica morre
     eletrica
     hidraulica-sanitaria-gas
     prevencao-incendio
     manutencao
/loja/                   catálogo de material hidráulico (filtro + busca)
/produto/<slug>/         ficha do produto
/carrinho/               conferência antes de fechar
/checkout/               dados, entrega e forma de pagamento
/pedido/<protocolo>/     comprovante + acompanhamento
/orcamento/              o formulário que qualifica
/empresa/                quem é, onde atua, o que entrega de documento
/feed/                   conteúdo de busca local
/feed/<slug>/            matéria
/contato/                telefone, WhatsApp, endereço, horário, mapa
/privacidade/            LGPD
/busca/                  busca no site inteiro
/admin/                  painel (fora do sitemap, fora do robots)
```

### Por que ESTE mapa

- **`/servicos/<slug>/` existe** porque é a página que o Google entrega para
  busca com intenção ("instalação de gás Caruaru"). Uma página só de "Serviços"
  com quatro parágrafos não ranqueia para nenhum dos quatro.
- **`/produto/<slug>/` existe** pelo mesmo motivo, do lado da loja.
- **`/pedido/<protocolo>/`** é público e sem login, acessível pelo protocolo:
  o comprador precisa acompanhar sem criar conta. Protocolo é longo e
  não-sequencial no que é exposto, para não dar para "chutar o próximo".
- **Sem página "Feed" na navegação principal** — ela mora no rodapé e nos links
  internos dos serviços. Feed em menu de topo compete com o que vende.

---

## 3. A home

Uma home que serve a dois negócios erra fácil, então a ordem é deliberada:

1. **Herói** — o que a INNOVAR faz, para quem, onde. Duas ações lado a lado,
   com pesos diferentes: **Pedir orçamento** (primária) e **Ver a loja**
   (secundária). Não é um botão só, porque não é um negócio só.
2. **Os 4 serviços**, em cartões que dizem o problema que resolvem — não o nome
   da técnica.
3. **Como funciona** — 4 passos, do contato à entrega do documento. Existe para
   matar a ansiedade de quem nunca contratou: o desconhecido é o que trava.
4. **Material hidráulico** — faixa da loja, com 4 produtos e "ver tudo".
5. **Prova** — obras, números, registros. Vazia até haver conteúdo real; **não
   preencho com invenção**.
6. **Do feed** — 3 chamadas.
7. **Chamada final** com WhatsApp.

---

## 4. Estados — o que o pedido de "skeleton, lazyload, progresso" quer dizer

Todo bloco que espera dado tem **quatro estados desenhados**, não três:

| estado | o que aparece |
|---|---|
| carregando | **skeleton** com a forma do conteúdo (só acima de 200 ms) |
| vazio | frase que diz o que fazer, nunca "nenhum resultado" solto |
| erro | o que houve **e** o botão de tentar de novo |
| pronto | o conteúdo, entrando com 420 ms de `transform`+`opacity` |

Mais:

- **Barra de progresso** no topo em toda navegação e todo envio de formulário.
- **Imagem com `loading="lazy"`, `decoding="async"` e proporção declarada** —
  sem a proporção, a página pula quando a foto chega, e o dedo acerta o botão
  errado. É a falha de layout mais comum e a mais fácil de evitar.
- **Botão que envia mostra que está enviando** e trava até responder — senão o
  duplo clique vira dois orçamentos.

---

## 5. O painel

Espelha o site tela a tela. Grupos:

| grupo | telas |
|---|---|
| **Painel** | resumo do dia, pendências, situação do site |
| **Loja** | produtos, categorias, estoque, frete, pedidos |
| **Comercial** | orçamentos (com situação e protocolo) |
| **Conteúdo** | feed, obras/prova, dúvidas |
| **A empresa** | serviços, sobre, equipe |
| **Textos do site** | todos os textos de seção, por página |
| **Contato e integrações** | telefone, WhatsApp, e-mail, endereço, CNPJ, redes, códigos de rastreio |

**Todo texto visível no site é editável aqui** — inclusive rótulo de botão e
título de seção. O que fica fixo é o que está amarrado a âncora, a esquema ou à
assinatura do desenvolvedor, e cada exceção está anotada no código.

---

## 6. SEO

- **Uma intenção por página.** Título e `h1` diferentes: o `<title>` é para a
  busca, o `h1` é para quem chegou.
- **JSON-LD**: `LocalBusiness` (com `areaServed` = Caruaru + Agreste) na home,
  `Service` em cada serviço, `Product` + `Offer` em cada produto, `Article` em
  cada matéria, `BreadcrumbList` nas internas.
- **`sitemap.xml`** montado a partir do banco a cada pedido, com `lastmod` de
  verdade — data inventada ensina o buscador a ignorar o arquivo.
- **`robots.txt`** com `/admin`, `/carrinho`, `/checkout` e `/pedido` no
  Disallow: são páginas de estado, indexá-las é lixo no resultado.
- **`llms.txt`** — descreve a empresa, o que faz, onde atua e o que **não** faz,
  para quem consulta por assistente. Sai do mesmo conteúdo do site, então não
  envelhece sozinho.
- **Meta description** por página, editável no painel, com aviso de tamanho.
- **Palavras-chave** por página, editáveis — usadas para orientar o texto, não
  como `<meta keywords>` (que não vale nada há vinte anos).

---

## 7. Desempenho — alvo e o que o sustenta

Alvo **100/100** no Lighthouse, e o que garante isso:

- CSS e JS **próprios, sem framework** — nada de 300 kB para animar um cartão.
- Fonte via `preconnect` + `display=swap`, com fallback do sistema declarado.
- Imagem em **AVIF/WebP** com `<picture>`, e proporção sempre declarada.
- Nada bloqueia a pintura: o JS é `defer`, o CSS crítico é pequeno.
- HTML **montado no servidor a cada pedido**, a partir do SQLite local. Ver a
  decisão registrada na seção 9.


---

## 9. Decisão de arquitetura — por que não há passo de publicação

O plano inicial era o modelo dos projetos irmãos: arquivos HTML na pasta, com
marcadores em comentário, reescritos por um comando de publicação. Ele foi
trocado por **renderização no servidor a cada pedido**, e vale registrar por
quê, porque a troca custa uma decisão e economiza uma classe inteira de
defeitos.

**O que quebrava no modelo antigo.** Com dezoito páginas em arquivo, o
cabeçalho e o rodapé existem copiados dezoito vezes. Trocar o telefone vira
dezoito edições, e a décima nona página que alguém criar nasce com o telefone
velho — foi assim que um site irmão terminou com CNPJs diferentes no rodapé de
páginas diferentes. Pior: o marcador em comentário HTML **não funciona dentro
de `<title>` nem de atributo**, onde `<!-- -->` é texto literal. Na primeira
versão desta home, o marcador apareceu na aba do navegador e dentro do `href`
do telefone, gerando um link quebrado.

**O que se ganha.** Um layout só; "editou no painel, mudou no site" sem passo
intermediário; e o preço da loja lido do banco na hora, que é requisito de
segurança e não de conveniência.

**O que se perde, e por que não pesa.** Perde-se o HTML pré-gerado. Com SQLite
local e consultas preparadas, montar uma página custa abaixo de um
milissegundo — menos que a latência da rede até Caruaru. O CSS, o JS e as
imagens continuam estáticos, com cache de sete dias e `?v=` da versão do
pacote; é onde está o peso de verdade.

**O que fica pendente disso.** Se um dia o volume justificar, entra um cache de
página em memória invalidado pela mesma chave que hoje limpa o cache de textos
(`src/textos.js`). Não antes: cache é a segunda coisa mais difícil de acertar,
e ainda não há problema para ele resolver.
