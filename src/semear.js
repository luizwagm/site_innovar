/* ==========================================================================
   INNOVAR — semeadura

   Roda a cada partida do servidor e é IDEMPOTENTE: só insere o que ainda não
   existe, e nunca sobrescreve o que o painel já editou. É a diferença entre
   "reiniciei o serviço" e "reiniciei o serviço e o cliente perdeu os textos
   que passou a tarde ajustando".

   O conteúdo daqui é ponto de partida real, não texto de recheio: o cliente
   disse "crie, depois atualizo". Um site entregue com "Lorem ipsum" volta com
   "Lorem ipsum" publicado.
   ========================================================================== */
"use strict";

const db = require("./db");
const { CAMPOS } = require("./conteudo");
const { esquecer } = require("./textos");

/* ------------------------------------------------------- textos de tela --- */
const inserirTexto = db.prepare("INSERT OR IGNORE INTO conteudo (chave, valor) VALUES (?, ?)");

/* ---------------------------------------------------------------- serviços - */
const SERVICOS = [
  {
    slug: "eletrica", nome: "Instalação e manutenção elétrica", icone: "raio", ordem: 1,
    resumo: "Entrada de energia, quadros, circuitos, aterramento e correção do que está sobrecarregado.",
    chamada: "Da entrada de energia ao último ponto — dimensionado para a carga que você realmente usa.",
    corpo: "<p>A maior parte dos problemas elétricos que atendemos em comércio não é defeito: é instalação dimensionada para o consumo de dez anos atrás. Ar-condicionado novo, câmara fria, forno, carregador — a carga cresceu e o quadro continuou o mesmo.</p><p>Fazemos o levantamento da carga instalada, corrigimos o que está subdimensionado e deixamos o quadro identificado circuito por circuito. Quem for mexer depois — você, o técnico do ar, o bombeiro na vistoria — encontra tudo indicado.</p>",
    inclui: "Levantamento da carga instalada e do que está subdimensionado\nEntrada de energia e padrão da concessionária\nQuadro de distribuição com disjuntores e DR dimensionados\nCircuitos novos, tomadas e iluminação\nAterramento e proteção contra surto\nIdentificação de todos os circuitos no quadro\nART do serviço quando exigido",
    nao_inclui: "Projeto elétrico de edificação nova em fase de aprovação\nFornecimento de luminárias decorativas\nServiço de alvenaria para embutir infraestrutura nova",
    prazo: "De 1 a 5 dias úteis para adequação de quadro e circuitos. Entrada de energia depende do prazo da concessionária.",
  },
  {
    slug: "hidraulica-gas", nome: "Hidráulica, sanitária e gás", icone: "gota", ordem: 2,
    resumo: "Água fria e quente, esgoto, ralos e instalação de gás — com teste de estanqueidade.",
    chamada: "Instalação e conserto sem quebrar mais do que o necessário para achar o problema.",
    corpo: "<p>Vazamento em imóvel comercial costuma ser descoberto pela conta de água, não pela poça. Localizamos o ponto antes de quebrar, o que quase sempre é a diferença entre um reparo de um dia e uma obra de uma semana.</p><p>Em gás, o serviço só é entregue com teste de estanqueidade — a instalação pode estar visualmente perfeita e ter perda no ponto de rosca, e isso não se vê.</p>",
    inclui: "Água fria e quente, colunas e ramais\nEsgoto, caixas de gordura e ralos\nLocalização de vazamento antes da quebra\nInstalação de gás GLP e gás natural\nTeste de estanqueidade com laudo\nTroca de registros, metais e louças\nReserva de água: caixa, bomba e boia",
    nao_inclui: "Perfuração de poço\nProjeto e execução de piscina\nDesobstrução de rede pública (é da concessionária)",
    prazo: "Reparo localizado no mesmo dia ou no dia seguinte. Instalação completa, de 3 a 10 dias úteis conforme a metragem.",
  },
  {
    slug: "prevencao-incendio", nome: "Prevenção contra incêndio", icone: "chama", ordem: 3,
    resumo: "Hidrantes, extintores, sinalização e iluminação de emergência para a vistoria do Corpo de Bombeiros.",
    chamada: "O sistema instalado e a documentação que o Corpo de Bombeiros pede na vistoria.",
    corpo: "<p>Quem procura este serviço quase sempre está com um prazo na mão: alvará vencendo, vistoria marcada ou exigência do seguro. A parte demorada raramente é a instalação — é a documentação, e é por ela que a gente começa.</p><p>Fazemos o levantamento do que o projeto aprovado exige, comparamos com o que está instalado e apresentamos o que falta antes de qualquer serviço. Você decide sabendo o tamanho do problema.</p>",
    inclui: "Levantamento do exigido pelo projeto aprovado\nHidrantes, mangueiras e abrigos\nExtintores dentro da validade e na classe certa\nSinalização de emergência e rotas de fuga\nIluminação de emergência com autonomia testada\nCentral de alarme e acionadores\nAcompanhamento na vistoria",
    nao_inclui: "Elaboração e aprovação do projeto no Corpo de Bombeiros (encaminhamos a um projetista)\nSistema de chuveiros automáticos em edificação de grande porte\nBrigada de incêndio e treinamento",
    prazo: "Levantamento em até 3 dias úteis. Execução de 5 a 20 dias conforme o porte e o que já existe instalado.",
  },
  {
    slug: "manutencao-predial", nome: "Manutenção predial", icone: "chave", ordem: 4,
    resumo: "Contrato mensal com ronda preventiva — a alternativa a chamar alguém só quando já parou.",
    chamada: "Ronda mensal com relatório: o que foi conferido, o que foi corrigido e o que vai precisar de atenção.",
    corpo: "<p>Manutenção corretiva é sempre mais cara que a preventiva, mas a diferença que pesa não é o preço do reparo: é a loja fechada, a produção parada e o serviço feito às pressas com o material que dava para comprar naquele momento.</p><p>No contrato mensal a mesma equipe conhece a instalação, e o relatório da ronda diz o que ainda vai precisar de atenção — para o gasto entrar no orçamento em vez de aparecer como urgência.</p>",
    inclui: "Ronda mensal de elétrica, hidráulica e prevenção contra incêndio\nRelatório do que foi conferido e corrigido\nPequenos reparos inclusos na visita\nAtendimento prioritário fora da ronda\nControle de validade de extintores e recargas\nRegistro fotográfico do que exigir acompanhamento",
    nao_inclui: "Peças e material de reposição (orçados à parte)\nObra civil\nManutenção de elevador e de ar-condicionado central (especializadas)",
    prazo: "Contrato mensal, com dia de ronda combinado. Chamado prioritário atendido em até 24 horas úteis.",
  },
];

/* -------------------------------------------------------------- catálogo --- */
const CATEGORIAS = [
  { slug: "tubos", nome: "Tubos", ordem: 1 },
  { slug: "conexoes", nome: "Conexões", ordem: 2 },
  { slug: "registros", nome: "Registros e válvulas", ordem: 3 },
  { slug: "metais", nome: "Metais e acabamentos", ordem: 4 },
  { slug: "caixas", nome: "Caixas e reservatórios", ordem: 5 },
  { slug: "vedacao", nome: "Vedação e acessórios", ordem: 6 },
];

/* Catálogo de partida com preço e estoque plausíveis, para o cliente ver a
   loja funcionando e corrigir número por número no painel. A UNIDADE é o campo
   que mais evita discussão na entrega — por isso ela é obrigatória no banco. */
const PRODUTOS = [
  ["TUB-PVC-25", "tubos", "Tubo PVC soldável 25 mm", "barra 6 m", 3290, 48, "Tigre",
    "Tubo em PVC rígido soldável para água fria, pressão de serviço de 7,5 kgf/cm². Barra de 6 metros."],
  ["TUB-PVC-32", "tubos", "Tubo PVC soldável 32 mm", "barra 6 m", 4890, 32, "Tigre",
    "Tubo em PVC rígido soldável para água fria, 32 mm. Barra de 6 metros."],
  ["TUB-ESG-100", "tubos", "Tubo esgoto série normal 100 mm", "barra 6 m", 7990, 20, "Amanco",
    "Tubo para esgoto predial série normal, 100 mm, ponta e bolsa com anel."],
  ["TUB-PEX-20", "tubos", "Tubo PEX água quente 20 mm", "metro", 1450, 300, "Amanco",
    "Tubo flexível PEX para água quente até 95 °C. Vendido por metro."],
  ["CON-JOE-25", "conexoes", "Joelho 90° soldável 25 mm", "peça", 290, 240, "Tigre",
    "Joelho de 90 graus em PVC soldável, 25 mm."],
  ["CON-TE-25", "conexoes", "Tê soldável 25 mm", "peça", 380, 180, "Tigre",
    "Tê em PVC soldável para derivação, 25 mm."],
  ["CON-LUV-32", "conexoes", "Luva soldável 32 mm", "peça", 340, 160, "Tigre",
    "Luva de emenda em PVC soldável, 32 mm."],
  ["CON-ADP-25", "conexoes", "Adaptador soldável com flange 25 mm", "peça", 690, 90, "Amanco",
    "Adaptador com flange e anel de vedação para caixa d'água, 25 mm."],
  ["REG-ESF-25", "registros", "Registro esfera 25 mm", "peça", 2490, 60, "Docol",
    "Registro esfera em PVC com alavanca, 25 mm."],
  ["REG-GAV-32", "registros", "Registro de gaveta bruto 32 mm", "peça", 5890, 24, "Deca",
    "Registro de gaveta em metal, corpo bruto, 1 polegada."],
  ["REG-PRE-20", "registros", "Registro de pressão 20 mm", "peça", 4790, 18, "Deca",
    "Registro de pressão para chuveiro, corpo bruto."],
  ["MET-TOR-COZ", "metais", "Torneira de bancada para cozinha", "peça", 12900, 12, "Docol",
    "Torneira de mesa com bica móvel e arejador, acabamento cromado."],
  ["MET-CHU-QUA", "metais", "Chuveiro quadrado 20 cm", "peça", 9900, 9, "Lorenzetti",
    "Chuveiro de teto em ABS cromado, 20 × 20 cm, com braço."],
  ["MET-SIF-UNI", "metais", "Sifão universal sanfonado", "peça", 1890, 70, "Astra",
    "Sifão sanfonado universal para pia e lavatório."],
  ["CAI-1000", "caixas", "Caixa d'água polietileno 1.000 L", "peça", 44900, 6, "Fortlev",
    "Caixa d'água em polietileno com tampa, 1.000 litros."],
  ["CAI-500", "caixas", "Caixa d'água polietileno 500 L", "peça", 28900, 8, "Fortlev",
    "Caixa d'água em polietileno com tampa, 500 litros."],
  ["CAI-BOI-34", "caixas", "Boia automática 3/4", "peça", 3490, 26, "Astra",
    "Boia de nível automática para caixa d'água, entrada de 3/4."],
  ["VED-FIT-18", "vedacao", "Fita veda-rosca 18 mm × 50 m", "rolo", 990, 120, "Tigre",
    "Fita de PTFE para vedação de roscas, 18 mm por 50 metros."],
  ["VED-ADE-175", "vedacao", "Adesivo plástico para PVC 175 g", "peça", 2290, 44, "Tigre",
    "Adesivo para soldagem de tubos e conexões em PVC, bisnaga de 175 g."],
  ["VED-LIX-100", "vedacao", "Lixa d'água grão 100", "folha", 250, 200, "Norton",
    "Folha de lixa d'água para preparo de superfície antes da solda."],
];

/* ------------------------------------------------------------------ feed --- */
const MATERIAS = [
  {
    slug: "quadro-de-luz-sobrecarregado-sinais",
    titulo: "Sete sinais de que o quadro de luz da sua empresa está sobrecarregado",
    resumo: "Disjuntor que desarma no fim da tarde, tomada que esquenta, luz que oscila quando o compressor liga — o que cada sinal quer dizer e o que fazer antes de virar incêndio.",
    publicado_em: "2026-06-18 09:00:00",
    corpo: `<p>Quase toda instalação elétrica de comércio em Caruaru foi dimensionada para uma carga que já não existe. O ponto não é que ela foi mal feita: é que o ar-condicionado dobrou, entrou uma câmara fria, entrou um forno elétrico, e o quadro continuou o mesmo. Estes são os sinais que aparecem antes do problema sério.</p>

<h2>1. O disjuntor desarma sempre no mesmo horário</h2>
<p>Desarme aleatório costuma ser defeito. Desarme com hora marcada — meio da tarde, quando tudo está ligado ao mesmo tempo — é carga: o circuito está trabalhando no limite e o disjuntor faz exatamente o que deveria. Trocar o disjuntor por um de maior amperagem sem trocar o cabo é o erro mais comum e o mais perigoso: você acabou de tirar a proteção de um cabo que continua fino.</p>

<h2>2. Tomada ou plugue esquentando</h2>
<p>Aquecimento é mau contato, e mau contato é resistência. Encoste na tomada de um equipamento pesado depois de uma hora ligado. Morna passa; quente, não. É a causa mais frequente de princípio de incêndio em ponto de energia.</p>

<h2>3. A luz oscila quando um motor liga</h2>
<p>Uma queda breve na partida do compressor ou do elevador é normal. Se a luz da loja inteira pisca, a queda de tensão está grande demais para a seção do cabo — sinal de que a alimentação está subdimensionada, e não de que a lâmpada é ruim.</p>

<h2>4. Cheiro de plástico quente perto do quadro</h2>
<p>Este é o único item da lista que não admite agendamento. Desligue a chave geral e chame alguém no mesmo dia.</p>

<h2>5. O quadro não tem nada identificado</h2>
<p>Parece organização, mas é segurança: numa emergência alguém vai precisar desligar um circuito específico, rápido, possivelmente no escuro. Quadro sem identificação vira desligamento geral — e desligamento geral, num comércio, é a câmara fria descongelando.</p>

<h2>6. Não existe DR</h2>
<p>O disjuntor protege a instalação; o dispositivo diferencial residual protege a pessoa. Em área molhada — cozinha, banheiro, área de lavagem — ele não é opcional pela norma. É o item mais barato desta lista e o único que salva vida.</p>

<h2>7. Emenda com fita isolante à vista</h2>
<p>Toda emenda tem de estar dentro de caixa. Emenda aparente, ainda que bem feita, está exposta a umidade, a poeira e ao esbarrão de quem passa.</p>

<h2>O que fazer</h2>
<p>O primeiro passo não é obra: é o levantamento da carga instalada comparado com a capacidade real da entrada e dos circuitos. Com esse número na mão dá para separar o que é urgente do que pode entrar no orçamento do ano que vem — e, principalmente, dá para parar de trocar disjuntor achando que o disjuntor é o problema.</p>`,
  },
  {
    slug: "vistoria-bombeiros-o-que-e-exigido",
    titulo: "Vistoria do Corpo de Bombeiros: o que costuma reprovar (e dá para resolver antes)",
    resumo: "Extintor fora de validade é o motivo mais comum de reprovação — e o mais fácil de evitar. O que conferir antes de marcar a vistoria do seu imóvel comercial.",
    publicado_em: "2026-07-09 09:00:00",
    corpo: `<p>Reprovação em vistoria raramente é surpresa técnica. Na maioria das vezes é item de conferência que ninguém conferiu, porque o responsável pelo imóvel não sabia que aquilo era com ele. Vale passar esta lista antes de marcar.</p>

<h2>Extintor: validade, classe e altura</h2>
<p>São três coisas diferentes, e a reprovação pode vir por qualquer uma. A recarga tem validade; o teste hidrostático do cilindro tem outra, mais longa. A classe tem de bater com o risco do local — pó químico onde o projeto pede pó químico, CO₂ onde o risco é elétrico. E a sinalização precisa estar visível de quem está em pé no corredor, não escondida atrás de uma prateleira que chegou depois.</p>

<h2>Iluminação de emergência com autonomia real</h2>
<p>Acender ao apertar o botão de teste não basta: o exigido é a autonomia, normalmente uma hora. Bateria velha acende e apaga em dez minutos. O teste que vale é desligar o circuito e cronometrar.</p>

<h2>Rota de fuga desobstruída</h2>
<p>É o item que mais reprova em loja e depósito, e o mais fácil de resolver: mercadoria encostada na saída, porta corta-fogo com calço para ficar aberta, corredor virando estoque temporário que virou permanente. A vistoria vê o local no dia — e o dia da vistoria é sempre o dia em que chegou carga.</p>

<h2>Hidrante: mangueira, chave e teste</h2>
<p>Abrigo com mangueira dentro não significa sistema funcionando. A mangueira tem teste hidrostático com validade, o esguicho e a chave têm de estar no abrigo, e a pressão no ponto mais desfavorável precisa atender ao projeto. Bomba de incêndio que não é acionada há meses costuma não partir.</p>

<h2>O projeto aprovado é a régua</h2>
<p>Aqui está o mal-entendido mais caro: a vistoria não confere se o imóvel é seguro na opinião do vistoriador, confere se ele está conforme o projeto aprovado. Se o layout mudou — parede nova, mezanino, mudança de uso —, o projeto precisa ser atualizado antes. Instalar mais equipamento do que o projeto prevê não resolve; diverge.</p>

<h2>Comece pelo papel</h2>
<p>Antes de comprar qualquer coisa, tenha em mãos o projeto aprovado e compare com o instalado. É o levantamento que diz o tamanho real do problema — e evita a compra de vinte extintores que não eram o que estava faltando.</p>`,
  },
  {
    slug: "vazamento-conta-de-agua-alta",
    titulo: "Conta de água alta sem vazamento aparente: como encontrar o ponto",
    resumo: "O teste do hidrômetro em cinco minutos, o que ele prova, e por que localizar antes de quebrar é a diferença entre um dia de serviço e uma semana de obra.",
    publicado_em: "2026-07-30 09:00:00",
    corpo: `<p>Vazamento em instalação comercial quase nunca aparece como poça. Aparece na conta, dois meses depois de começar, e a essa altura já custou mais em água do que vai custar em conserto. Dá para fazer o primeiro diagnóstico sozinho, em cinco minutos, sem ferramenta.</p>

<h2>O teste do hidrômetro</h2>
<p>Feche todas as torneiras e válvulas do imóvel — todas mesmo, inclusive a boia da caixa d'água e a alimentação de máquinas. Anote o número do hidrômetro e observe o disco ou a estrelinha do relógio. Se ele continua girando com tudo fechado, existe passagem de água em algum ponto. Se está parado, anote o número, espere uma hora sem consumo e confira de novo: perda pequena não move o disco visivelmente, mas move o número.</p>

<h2>Separando o antes e o depois da caixa</h2>
<p>Feche o registro de saída da caixa d'água e repita o teste. Se o hidrômetro parou, a perda está na distribuição interna; se continua girando, está entre o cavalete e a caixa — o que inclui o trecho enterrado, o mais chato e o mais comum em imóvel antigo.</p>

<h2>Os suspeitos, em ordem</h2>
<p>Antes de pensar em tubulação rompida, elimine o barato: <strong>a válvula de descarga</strong> passando é a campeã, e o teste é encostar papel higiênico seco na parede do vaso — se molha, está passando. Depois vem <strong>a boia da caixa</strong>, que quando não veda de todo devolve água pelo ladrão sem ninguém ver. E as <strong>torneiras de área externa</strong>, que pingam para o ralo e não deixam marca.</p>

<h2>Por que localizar antes de quebrar</h2>
<p>Existe equipamento para localizar o ponto de perda sem abrir: geofone para escutar a fuga sob o piso e pressurização por trechos para isolar o ramal. Custa uma visita. Quebrar por tentativa custa o piso, o serviço de recomposição e o tempo em que o local fica interditado — e a segunda tentativa custa tudo de novo.</p>

<h2>Quando é urgente</h2>
<p>Água aparecendo em parede junto a quadro elétrico ou a tomada não é caso de agendar. Desligue o circuito da área e feche o registro geral no mesmo momento.</p>`,
  },
];

/* ------------------------------------------------------------- privacidade - */
const PRIVACIDADE = `
<p>Esta política explica quais dados a ${"INNOVAR Engenharia e Equipamentos"} coleta neste site, para que usa e por quanto tempo guarda, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

<h2>Que dados coletamos</h2>
<p><strong>Quando você pede um orçamento:</strong> nome, empresa, telefone, e-mail, cidade e a descrição do serviço. São os dados necessários para responder — sem telefone não há como marcar a visita.</p>
<p><strong>Quando você faz um pedido na loja:</strong> nome, telefone, e-mail, documento e endereço de entrega. O documento é exigido para a emissão da nota fiscal.</p>
<p><strong>Enquanto você navega:</strong> dados de uso agregados por ferramentas de medição, quando ativadas. Eles não identificam você pessoalmente.</p>
<p><strong>No seu carrinho:</strong> os itens ficam guardados apenas no seu navegador, e não no nosso servidor, até você fechar o pedido.</p>

<h2>Para que usamos</h2>
<p>Para responder ao seu pedido, executar o serviço ou a venda contratada, emitir documento fiscal e cumprir obrigações legais. Não vendemos, não alugamos e não cedemos seus dados a terceiros para fins de publicidade.</p>

<h2>Com quem compartilhamos</h2>
<p>Apenas com quem é indispensável para entregar o que você contratou: transportadora, no caso de entrega; contabilidade e a Receita, no caso de nota fiscal; e o provedor que hospeda este site. Cada um recebe só o dado necessário para a sua parte.</p>

<h2>Por quanto tempo guardamos</h2>
<p>Pedidos de orçamento não convertidos: até 2 anos. Pedidos e notas fiscais: pelo prazo que a legislação fiscal exige, hoje 5 anos. Depois disso, os dados são apagados ou anonimizados.</p>

<h2>Seus direitos</h2>
<p>Você pode pedir a qualquer momento a confirmação de que tratamos seus dados, o acesso a eles, a correção do que estiver errado, a exclusão do que não formos obrigados a guardar e a informação sobre com quem compartilhamos. Basta escrever para o e-mail de contato desta página; respondemos em até 15 dias.</p>

<h2>Segurança</h2>
<p>O site trafega em conexão criptografada. O acesso aos dados é restrito a quem precisa deles para trabalhar. Nenhum sistema é inviolável — se houver incidente com risco a você, comunicaremos você e a autoridade competente.</p>

<h2>Alterações</h2>
<p>Se esta política mudar, a data abaixo muda junto. Vale sempre a versão publicada aqui.</p>
`;

/* ==========================================================================
   FOTOS DE BANCO DE IMAGEM

   Ponto de partida, para o cliente trocar pelas fotos das obras dele — e o
   painel vai permitir isso item a item. Elas ficam em `assets/img/banco/` com
   a procedência registrada em CREDITOS.md (ver ferramentas/buscar-imagens.cjs).

   A ligação é feita SÓ ONDE AINDA NÃO HÁ FOTO (`WHERE foto = ''`): assim,
   reiniciar o serviço nunca desfaz a foto que o cliente subiu. A mesma regra
   de toda a semeadura.

   O produto herda a foto da CATEGORIA quando não tem uma própria. Um tubo de
   25 e um de 32 são visualmente o mesmo objeto na miniatura; foto genérica
   correta é melhor que quadrado cinza, e muito melhor que a foto do produto
   errado.
   ========================================================================== */
const BANCO = "/assets/img/banco/";

const FOTO_POR_SERVICO = {
  "eletrica": "serv-eletrica.jpg",
  "hidraulica-gas": "serv-hidraulica.jpg",
  "prevencao-incendio": "serv-incendio.jpg",
  "manutencao-predial": "serv-manutencao.jpg",
};

const CAPA_POR_MATERIA = {
  "quadro-de-luz-sobrecarregado-sinais": "feed-quadro.jpg",
  "vistoria-bombeiros-o-que-e-exigido": "feed-vistoria.jpg",
  /* A matéria de vazamento usa a foto de tubulação aparente: é o assunto dela,
     e evita duas fotos de retrato de profissional em páginas vizinhas. */
  "vazamento-conta-de-agua-alta": "cat-tubos.jpg",
};

const FOTO_POR_CATEGORIA = {
  tubos: "cat-tubos.jpg",
  conexoes: "cat-conexoes.jpg",
  registros: "cat-registros.jpg",
  metais: "cat-metais.jpg",
  caixas: "cat-caixas.jpg",
  vedacao: "cat-vedacao.jpg",
};

/* Produtos que o olho reconhece de longe merecem foto própria — nestes, a foto
   da categoria seria uma perda de informação real para quem está comprando. */
const FOTO_POR_SKU = {
  "TUB-ESG-100": "prod-tubo-esgoto.jpg",
  "MET-TOR-COZ": "prod-torneira.jpg",
};

function ligarFotos() {
  const porServico = db.prepare("UPDATE servicos SET imagem = ? WHERE slug = ? AND imagem = ''");
  for (const [slug, arquivo] of Object.entries(FOTO_POR_SERVICO)) porServico.run(BANCO + arquivo, slug);

  const porMateria = db.prepare("UPDATE materias SET capa = ? WHERE slug = ? AND capa = ''");
  for (const [slug, arquivo] of Object.entries(CAPA_POR_MATERIA)) porMateria.run(BANCO + arquivo, slug);

  const porSku = db.prepare("UPDATE produtos SET foto = ? WHERE sku = ? AND foto = ''");
  for (const [sku, arquivo] of Object.entries(FOTO_POR_SKU)) porSku.run(BANCO + arquivo, sku);

  const porCategoria = db.prepare(`UPDATE produtos SET foto = ?
    WHERE foto = '' AND categoria_id = (SELECT id FROM categorias WHERE slug = ?)`);
  for (const [slug, arquivo] of Object.entries(FOTO_POR_CATEGORIA)) porCategoria.run(BANCO + arquivo, slug);
}

/* ============================================================== execução == */
/* ==========================================================================
   RENOMEAÇÕES DE CHAVE

   Quando uma chave de conteúdo muda de nome, o valor JÁ EDITADO pelo cliente
   tem de ir junto. Sem isto, "blog" virar "feed" apagaria o texto que ele
   escreveu — a chave nova nasceria com o padrão de fábrica e a antiga ficaria
   órfã no banco, invisível e ocupando lugar.

   Roda antes da semeadura: primeiro o valor antigo vira o novo, depois o
   `INSERT OR IGNORE` vê a chave já preenchida e não encosta nela.
   ========================================================================== */
const RENOMEADAS = [
  ["BLOG_TITULO", "FEED_TITULO"],
  ["BLOG_TEXTO", "FEED_TEXTO"],
];

function renomearChaves() {
  const ler = db.prepare("SELECT valor FROM conteudo WHERE chave = ?");
  const gravarNova = db.prepare("INSERT OR IGNORE INTO conteudo (chave, valor) VALUES (?, ?)");
  const apagarVelha = db.prepare("DELETE FROM conteudo WHERE chave = ?");
  for (const [velha, nova] of RENOMEADAS) {
    const linha = ler.get(velha);
    if (!linha) continue;
    gravarNova.run(nova, linha.valor);
    apagarVelha.run(velha);
  }
}

function semear() {
  const tudo = db.transaction(() => {
    renomearChaves();
    for (const c of CAMPOS) inserirTexto.run(c.chave, c.valor);
    inserirTexto.run("PRIV_TEXTO", PRIVACIDADE.trim());

    const insServico = db.prepare(`INSERT OR IGNORE INTO servicos
      (slug, nome, resumo, icone, chamada, corpo, inclui, nao_inclui, prazo, ordem)
      VALUES (@slug, @nome, @resumo, @icone, @chamada, @corpo, @inclui, @nao_inclui, @prazo, @ordem)`);
    for (const s of SERVICOS) insServico.run(s);

    const insCategoria = db.prepare("INSERT OR IGNORE INTO categorias (slug, nome, ordem) VALUES (@slug, @nome, @ordem)");
    for (const c of CATEGORIAS) insCategoria.run(c);

    const idCategoria = db.prepare("SELECT id FROM categorias WHERE slug = ?");
    const insProduto = db.prepare(`INSERT OR IGNORE INTO produtos
      (sku, slug, nome, categoria_id, descricao, marca, unidade, preco_cent, estoque)
      VALUES (@sku, @slug, @nome, @categoria_id, @descricao, @marca, @unidade, @preco_cent, @estoque)`);
    for (const [sku, cat, nome, unidade, preco, estoque, marca, descricao] of PRODUTOS) {
      insProduto.run({
        sku, slug: apelido(nome), nome, categoria_id: idCategoria.get(cat)?.id ?? null,
        descricao, marca, unidade, preco_cent: preco, estoque,
      });
    }

    const insMateria = db.prepare(`INSERT OR IGNORE INTO materias
      (slug, titulo, resumo, corpo, publicado_em) VALUES (@slug, @titulo, @resumo, @corpo, @publicado_em)`);
    for (const m of MATERIAS) insMateria.run(m);

    ligarFotos();
  });

  tudo();
  esquecer();
}

/* O apelido do produto vira o endereço da página. Acento fora, espaço vira
   traço: `/produto/tubo-pvc-soldavel-25-mm/` é o que o Google indexa e o que a
   pessoa consegue ler antes de clicar. */
function apelido(s) {
  /* Os acentos são tirados filtrando por PONTO DE CÓDIGO, e não com uma faixa
     de caracteres combinantes dentro de uma expressão regular: aquela faixa é
     invisível no editor — são acentos soltos, sem letra — e some ou se
     multiplica ao passar por qualquer ferramenta que reescreva o arquivo.
     Custou meia dúzia de tentativas descobrir isso aqui mesmo. */
  return [...String(s).normalize("NFD")]
    .filter((c) => { const n = c.codePointAt(0); return n < 0x300 || n > 0x36f; })
    .join("").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

module.exports = { semear, apelido };
