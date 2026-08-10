# Regra de negócio — INNOVAR Engenharia e Equipamentos

> O que o sistema **garante**, e por quê. Cada regra aqui existe para impedir
> um erro concreto; onde não houver o erro descrito, a regra é peso morto e
> deve sair.

---

## 1. O negócio, em uma passada

A INNOVAR faz **duas coisas que se sustentam**:

1. **Serviço de engenharia** — instalação e manutenção elétrica, instalações
   hidráulicas, sanitárias e de gás, e sistemas de prevenção contra incêndio.
   Vendido por **orçamento**, para empresa, em Caruaru e no Agreste.
2. **Comércio varejista de material hidráulico** — vendido **pelo site**, com
   carrinho e checkout.

As duas convivem num site só porque o mesmo cliente compra as duas: quem
contrata a instalação compra o material, e quem compra o material acaba
precisando de quem instale. Separar em dois sites jogaria fora essa passagem.

**O que isso impõe ao desenho:** a home tem de responder às DUAS perguntas sem
que uma esconda a outra, e o caminho entre elas precisa existir — a página do
serviço leva ao material que ele usa, e a do produto oferece a instalação.

---

## 2. O funil, e onde ele quebra hoje

```
descobre (busca local)
   ↓
entende se a INNOVAR faz AQUILO        ← é aqui que a maioria desiste
   ↓
confia (obra parecida, registro, prazo)
   ↓
pede orçamento  ─── ou ───  compra material
```

**O degrau que importa é o segundo.** Quem procura "instalação de gás em
Caruaru" não quer um formulário: quer saber se você faz gás **de restaurante**
ou só residencial, se emite ART, e em quanto tempo vai lá olhar. Site que pula
direto para "Solicite seu orçamento" perde essa pessoa para o concorrente que
respondeu a pergunta.

Por isso **cada serviço tem página própria**, e cada página responde, nesta
ordem: o que é · para quem · o que está incluído · o que NÃO está · prazo
típico · o que a INNOVAR entrega de documento (ART, laudo, projeto).

---

## 3. Orçamento

**Não é uma caixa de "mensagem".** O que faz um orçamento ser respondido rápido
é ele chegar com o mínimo para orçar. O formulário pergunta:

| campo | por quê |
|---|---|
| tipo de serviço | roteia para quem orça |
| tipo de imóvel (comércio, indústria, condomínio, obra) | muda a norma aplicável e o preço |
| cidade / bairro | define deslocamento, e o Agreste é grande |
| prazo desejado | separa urgência de planejamento |
| descrição | o texto livre, que sozinho não basta |
| anexo (planta, foto) — opcional | encurta uma visita |
| contato | nome, WhatsApp, e-mail |

**Regras:**

- Sem tipo de serviço e sem contato, **não envia** — e diz qual falta, no campo.
- O envio gera **protocolo** `ORC-AAAA-00000`, sequencial por ano, **nunca
  reaproveitado**. É por ele que o cliente cobra retorno e a equipe acha o
  pedido. Reaproveitar número depois de uma exclusão faria dois orçamentos
  diferentes atenderem pelo mesmo código — e o segundo a aparecer venceria.
- O pedido é **gravado antes** de qualquer tentativa de e-mail ou WhatsApp. Se
  o envio falhar, o orçamento existe e aparece no painel. O contrário — mandar
  primeiro e gravar depois — perde o pedido justamente quando o servidor de
  e-mail está fora.

---

## 4. Loja

### O que é um produto aqui

Material hidráulico: tubo, conexão, registro, caixa d'água, metal sanitário.
Vendido por **unidade** ou por **peça de medida** (metro, barra de 6m).

- **`unidade_medida` é obrigatória** e aparece ao lado do preço. "R$ 42,00" num
  tubo é ambíguo: por metro ou pela barra? A ambiguidade só é descoberta na
  entrega, e aí é troca, frete e cliente irritado.
- **Estoque é número, não sim/não.** Produto com estoque 0 continua visível,
  marcado *sem estoque*, com botão desabilitado — sumir da loja faz quem
  procurou achar que a INNOVAR não trabalha com aquilo.

### Carrinho e checkout

- Carrinho vive no **navegador** (`localStorage`), com o **preço lido do
  servidor** a cada abertura. Preço guardado no navegador é preço que o cliente
  pode editar — e um checkout que confia nele é um checkout que aceita R$ 0,01.
- No fechamento, o servidor **recalcula tudo**: preço, disponibilidade e frete.
  O que o navegador manda é uma **proposta**, nunca um valor.
- Pedido gera `PED-AAAA-00000`, mesma regra do orçamento.
- **Estoque baixa quando o pagamento confirma**, não quando o carrinho fecha.
  Baixar no fechamento reserva peça para quem desistiu, e a loja fica sem
  estoque de mentira.

### Frete

Caruaru e Agreste têm entrega própria; fora disso, retirada ou transportadora.
A regra de frete fica em **tabela editável no painel** (faixa de CEP → valor →
prazo), não no código: mudança de valor de entrega é decisão comercial semanal,
e ela não pode depender de deploy.

---

## 5. Painel `/admin`

**Nada é editado no HTML.** O conteúdo vive no banco e o botão **Publicar**
regenera as páginas estáticas — mesmo modelo do BemEstarClinic, que já provou
funcionar em produção.

**Toda seção e toda tela do site tem correspondente no painel.** A lista de
campos editáveis é a **fonte única** (`CAMPOS` no `server.js`): campo novo é uma
linha ali mais o marcador `<!--#CHAVE-->` no HTML. Nada além disso.

> Consequência que precisa estar clara: **o site publicado só muda quando
> alguém clica em Publicar.** Editar e não publicar é o engano mais comum deste
> modelo, e por isso o painel avisa quando há alteração pendente.

---

## 6. Conteúdo — o feed

Existe para **busca local**, não para volume. Cada matéria responde a uma
pergunta que alguém digita antes de contratar ("quando trocar a fiação?",
"preciso de ART para instalação de gás?"). Três matérias iniciais, escritas por
mim e **marcadas como revisáveis**: quem assina tecnicamente é a INNOVAR, não eu.

> Não há afirmação sobre norma, prazo legal ou obrigação de ART que eu não
> possa sustentar. Onde a resposta depende de projeto ou de fiscalização, o
> texto diz isso em vez de inventar um número.

---

## 7. Dado pessoal (LGPD)

O site recebe nome, telefone, e-mail, endereço e, no orçamento, **planta ou foto
de imóvel**.

- Formulário coleta **o mínimo** para responder — e nada além.
- Aviso de finalidade junto do botão, não escondido em página de política.
- Anexos de orçamento **fora de `assets/`**, servidos só com sessão do painel:
  em `assets/`, bastaria acertar o nome do arquivo para baixar a planta de
  qualquer cliente.
- O pedido guarda **de onde veio** (campanha/origem) para a INNOVAR saber o que
  funciona, mas **não** rastreia a pessoa entre sessões.

---

## 8. O que este sistema NÃO faz (por ora)

Escrito para não ser cobrado como esquecimento:

- **Sem `/restrito`** — decisão do cliente. O painel administra o site e os
  pedidos; ordem de serviço, agenda de equipe e ficha de obra ficam para depois.
- **Sem integração fiscal automática.** A nota é emitida fora; o painel guarda
  o número quando alguém o informa.
- **Sem pagamento no primeiro ar.** O checkout nasce com **pedido + pagamento
  combinado** (PIX/link/transferência registrada no painel). Gateway entra
  quando houver CNPJ, conta e credencial — e ele muda a superfície de segurança
  o suficiente para não ser um detalhe de última hora.
