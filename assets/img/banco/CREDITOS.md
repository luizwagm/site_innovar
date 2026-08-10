# Procedência das fotos

Fotos de banco de imagem usadas como ponto de partida, para o cliente
substituir pelas fotos das obras reais dele. Todas do **Pexels**, cuja licença
permite uso comercial e modificação e **não exige atribuição**
(https://www.pexels.com/license/). Este registro existe para rastreabilidade,
não por obrigação da licença.

Geradas por `ferramentas/buscar-imagens.cjs` — rodar de novo só busca o que
faltar, e nunca sobrescreve arquivo existente.

| arquivo | busca | foto | descrição |
|---|---|---|---|
| `cat-caixas.jpg` | watertank | [pexels 27566315](https://www.pexels.com/photo/27566315/) | White water tanks on a rooftop with architectural design |
| `cat-conexoes.jpg` | plumbing | [pexels 4494655](https://www.pexels.com/photo/4494655/) | Industrial water pressure gauges and pipes |
| `cat-metais.jpg` | faucet | [pexels 36215888](https://www.pexels.com/photo/36215888/) | Close-up of a dripping outdoor water faucet |
| `cat-registros.jpg` | plumbing | [pexels 6419128](https://www.pexels.com/photo/6419128/) | Plumber's hands installing steel pipes |
| `cat-tubos.jpg` | plumbing | [pexels 8488035](https://www.pexels.com/photo/8488035/) | Close-up of exposed plumbing pipes |
| `cat-vedacao.jpg` | toolbox | [pexels 21470316](https://www.pexels.com/photo/21470316/) | Vintage toolbox amidst scrap metal pieces |
| `empresa-equipe.jpg` | construction | [pexels 32716845](https://www.pexels.com/photo/32716845/) | Urban construction site with a tower crane |
| `feed-quadro.jpg` | electrician | [pexels 17018103](https://www.pexels.com/photo/17018103/) | Electricians in safety gear working on power lines |
| `feed-vistoria.jpg` | extinguisher | [pexels 4805958](https://www.pexels.com/photo/4805958/) | Red fire extinguisher against a gray wall |
| `prod-torneira.jpg` | faucet | [pexels 30560253](https://www.pexels.com/photo/30560253/) | Chrome bathroom faucet, close-up |
| `prod-tubo-esgoto.jpg` | plumbing | [pexels 29226620](https://www.pexels.com/photo/29226620/) | Plumber installing a radiator pipe |
| `serv-eletrica.jpg` | electrician | [pexels 33694016](https://www.pexels.com/photo/33694016/) | Technician repairing a circuit board |
| `serv-hidraulica.jpg` | plumber | [pexels 8486978](https://www.pexels.com/photo/8486978/) | Handywoman in safety gear holding a pipe wrench |
| `serv-incendio.jpg` | extinguisher | [pexels 18510503](https://www.pexels.com/photo/18510503/) | Fire extinguishers secured inside a storage compartment |
| `serv-manutencao.jpg` | tools | [pexels 31501005](https://www.pexels.com/photo/31501005/) | Ratchet and socket tool set |

## Onde cada uma é usada

Definido em `src/semear.js`, função `ligarFotos()`, e gravado no banco — o
painel poderá trocar item a item sem mexer em código.

- **Serviços**: `serv-*.jpg`, uma por frente de trabalho.
- **Matérias do feed**: `feed-quadro.jpg` e `feed-vistoria.jpg`. A matéria de
  vazamento usa `cat-tubos.jpg` — é o assunto dela, e evita dois retratos de
  profissional em páginas vizinhas.
- **Produtos**: `cat-*.jpg` por categoria, com `prod-*.jpg` nos itens que o
  olho reconhece de longe. Um tubo de 25 e um de 32 são o mesmo objeto na
  miniatura; foto genérica correta é melhor que quadrado cinza, e muito melhor
  que a foto do produto errado.
- **A empresa**: `empresa-equipe.jpg`.

## Pendente

`prod-chuveiro.jpg` não foi baixada — o termo "showerhead" responde
redirecionamento e o "shower" bateu no limite de taxa do Pexels. O chuveiro usa
a foto da categoria de metais até lá. Rodar `npm run fotos` de novo resolve.
