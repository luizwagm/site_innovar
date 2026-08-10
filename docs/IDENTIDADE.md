# Identidade — INNOVAR Engenharia e Equipamentos

> Tudo aqui foi **derivado do logo**, não inventado ao lado dele. Onde houve
> escolha, ela está justificada — cor, tipo e movimento têm de responder por
> que existem, senão viram gosto pessoal disfarçado de design.

---

## 0. Uma divergência a resolver

O logo escreve **INNOVAR**, com dois N — e os dois N **são** o elemento
gráfico da marca (as barras diagonais laranja). O domínio informado é
`inovarengenharia.com.br`, com um N.

Enquanto não houver decisão, o site usa:

| onde | o quê |
|---|---|
| marca escrita, `<title>`, JSON-LD, rodapé | **INNOVAR** |
| domínio, e-mail, canônica | `inovarengenharia.com.br` |

**Por que isso importa:** o nome que o Google associa à marca sai do conteúdo,
não do domínio. Escrever "Inovar" no site com o logo dizendo "INNOVAR" divide
a autoridade entre duas grafias e ainda faz quem chega pelo cartão de visita
achar que errou de site. Resolver depois de indexado custa redirecionamento e
tempo de recuperação.

---

## 1. Cores — tiradas do logo

| token | valor | de onde vem | onde manda |
|---|---|---|---|
| `--marinho` | `#241B63` | fundo do logo | fundo institucional, cabeçalho, rodapé, texto de peso |
| `--laranja` | `#F0561F` | barra escura do N | ação primária, preço, destaque de dado |
| `--ambar` | `#F89A1C` | barra clara do N | segundo plano do gradiente, estados de progresso |
| `--gelo` | `#F6F7FB` | — | fundo das áreas de leitura |
| `--branco` | `#FFFFFF` | logo | superfícies |
| `--grafite` | `#1B1F2E` | — | texto corrido |
| `--cinza` | `#5C6478` | — | texto de apoio |
| `--linha` | `#E2E6EF` | — | bordas e divisores |

**O gradiente da marca** — `linear-gradient(115deg, var(--ambar), var(--laranja))`
— reproduz o ângulo das barras do logo (≈115°, não 90° nem 45°). É a assinatura
visual: aparece na barra de progresso, no sublinhado dos títulos de seção e no
estado ativo. Usar o ângulo certo é o que faz o site parecer feito **para** este
logo, e não com um laranja qualquer.

### A regra do laranja

O laranja é **ação e número**, nunca fundo de área grande. Em engenharia, laranja
é cor de alerta e de sinalização — em bloco, cansa e grita. Reservado, ele
carrega a ação: quem procura "onde clico" acha em um segundo.

### Contraste — obrigação, não gentileza

- `--marinho` sobre branco: **13,4:1** (AAA)
- branco sobre `--marinho`: **13,4:1** (AAA)
- `--laranja` sobre branco: **3,6:1** → **só a partir de 24px ou 18,5px negrito**.
  Em texto pequeno, laranja vira `--laranja-escuro` `#C2410C` (**5,9:1**).

O último item não é detalhe: é onde quase todo site com laranja falha, porque a
cor "parece" legível na tela do designer e some no celular no sol — que é
exatamente onde o encarregado de obra vai abrir este site.

---

## 2. Tipografia

| papel | fonte | por quê |
|---|---|---|
| títulos | **Archivo** (600/700) | grotesca condensável, com a mesma tensão geométrica do logo; aguenta caixa alta sem parecer institucional-genérica |
| corpo | **Inter** (400/500/600) | desenhada para tela, altura-x alta — o público lê ficha técnica no celular, em obra |
| número | **Inter** com `font-variant-numeric: tabular-nums` | preço, medida e código não podem dançar de largura entre linhas |

Escala fluida com `clamp()`, sem breakpoint para tamanho de letra:

```
--t-hero:  clamp(2.25rem, 1.4rem + 3.6vw, 4.25rem)
--t-h2:    clamp(1.6rem,  1.2rem + 1.6vw, 2.5rem)
--t-h3:    clamp(1.15rem, 1.0rem + 0.6vw, 1.5rem)
--t-corpo: clamp(1rem,    0.96rem + 0.2vw, 1.125rem)
```

---

## 3. Grade e forma

- Contêiner `min(1200px, 100% - 2.5rem)`; leitura longa em `68ch`.
- Espaçamento numa escala de 4px (`--e1: .25rem` … `--e10: 6rem`).
- **Raio pequeno**: `--r: 10px`, `--r-sm: 6px`. Engenharia é retilínea; canto
  muito arredondado empurra a marca para o lado "app de consumo".
- **Corte diagonal a 115°** como motivo de repetição (cabeçalhos de seção,
  cantos de card em destaque) — o mesmo ângulo das barras do logo.
- Sombra em duas camadas, curta e opaca (`0 1px 2px`, `0 8px 24px -12px`):
  sombra difusa e larga é linguagem de cartão de rede social, não de catálogo
  técnico.

---

## 4. Movimento

O pedido foi "smooth animation de entrada e saída, lazyload, skeleton,
progresso em todos os elementos". Traduzido em regra:

| gesto | duração | curva |
|---|---|---|
| micro (hover, foco) | 140 ms | `cubic-bezier(.2,.8,.3,1)` |
| entrada de bloco | 420 ms | mesma curva, com `translateY(14px)` |
| troca de tela/rota | 260 ms | `ease-out` na saída, `ease-in-out` na entrada |

**Três regras que o movimento tem de obedecer:**

1. **`prefers-reduced-motion` desliga tudo.** Não é acessibilidade decorativa:
   quem tem enxaqueca vestibular passa mal com paralaxe. A animação vira
   `opacity` instantânea.
2. **Nada anima layout.** Só `transform` e `opacity` — animar `height` ou `top`
   força recálculo a cada quadro e engasga no celular de obra, que é o aparelho
   real deste público.
3. **Skeleton só acima de 200 ms.** Abaixo disso ele pisca e o resultado é pior
   que a espera: a tela parece quebrada em vez de carregando.

---

## 5. O símbolo

O elemento reproduzível do logo são **as duas barras diagonais** do NN. Elas
viram o símbolo autônomo (favicon, marca d'água, ícone do PWA, carregador),
porque funcionam a 16px — a palavra inteira, não.

> **Pendente:** o arquivo original do logo (SVG ou PNG grande) precisa ser
> colocado em `assets/img/`. O símbolo geométrico foi reconstruído a partir da
> imagem enviada e é fiel ao ângulo e às cores, mas o **letreiro** deve vir do
> arquivo do cliente — reconstruir letra por letra sempre erra a métrica, e é o
> tipo de erro que só aparece impresso, do lado do cartão de visita.

---

## 6. O que este site NÃO faz

Escrito porque a maioria dos sites do segmento faz, e o pedido foi "inove,
surpreenda":

- **Sem banco de imagem genérico de "engenheiro apontando para prancheta".** O
  público reconhece o clichê e ele diz "não temos foto do nosso trabalho".
- **Sem carrossel de destaque na home.** Ninguém espera o segundo slide; o
  primeiro é o único que existe, e os outros são conteúdo escondido.
- **Sem contador animado de "anos de experiência".** Número que sobe sozinho é
  entretenimento, não prova.
- **Sem "Solicite um orçamento" como único caminho.** Em serviço técnico B2B,
  quem chega quer primeiro entender **se você faz aquilo** — o orçamento vem
  depois de a dúvida técnica ser respondida.


---

## Arquivos da marca

| arquivo | de onde vem | onde é usado |
|---|---|---|
| `assets/img/logo.png` | **original do cliente**, 4501×4501 | fonte; não vai para a tela |
| `assets/img/logo-marca.png` | recortado do original por `ferramentas/recortar-logo.cjs` | cabeçalho e rodapé |
| `assets/img/simbolo.svg` | redução às duas barras do NN | favicon |
| `assets/img/icone-{180,192,512}.png` | `ferramentas/gerar-imagens.cjs` | ícone de aplicativo e manifesto |
| `assets/img/og.png` | `ferramentas/gerar-imagens.cjs` | cartão de compartilhamento |

**O letreiro na tela é o arquivo do cliente, não texto redesenhado.** Escrever
"INNOVAR" com uma fonte parecida fica igual em uma tela e diferente em todas as
outras — a marca é dele.

O original tem uma larga moldura marinha e um marinho (`#1B1464`) que **não é**
o `--marinho` do site. Usado como está, ele apareceria como um retângulo mais
claro sobre o cabeçalho rolado e sobre o rodapé. Por isso o recorte tira a
moldura e transforma o fundo em transparência, com a cor da borda
desmultiplicada — sem isso o antisserrilhado guarda o marinho antigo e cada
letra ganha um contorno escuro.

Os ícones e o cartão de compartilhamento são **desenhados em código** a partir
dos mesmos tokens: as barras usam a geometria exata do `simbolo.svg` (banda de
17 a 47 de 64, largura 10 de 64, 115°). Exportados à mão, descolariam da marca
na primeira vez que uma cor mudasse — e ninguém abre o ícone da aba para
conferir.
