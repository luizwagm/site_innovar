#!/usr/bin/env bash
# ==========================================================================
#  enviar.sh — manda esta pasta para o servidor e reinicia o serviço
#
#  Uso:  ./enviar.sh            (da máquina de desenvolvimento, não do servidor)
#
#  QUANDO USAR ESTE, E QUANDO USAR O GIT: o repositório é
#  github.com/luizwagm/site_innovar, e o caminho normal de atualização passa a
#  ser `git push` daqui + `deploy.sh` no servidor, como nos projetos irmãos —
#  ele guarda o banco antes do pull e o devolve depois.
#
#  Este script continua valendo para dois casos: a PRIMEIRA instalação (quando
#  ainda não há clone no servidor) e o envio de emergência, com o repositório
#  fora do caminho. Ele não depende de rsync: usa `tar` por SSH, porque o Git
#  Bash do Windows não traz rsync — descobri isso com o comando falhando no
#  meio do primeiro deploy.
#
#  O QUE NUNCA É ENVIADO (e por quê):
#    data/          o banco é do SERVIDOR. Mandar o daqui apagaria os pedidos,
#                   os orçamentos e os textos que o cliente editou no painel.
#    node_modules/  o better-sqlite3 é COMPILADO para a plataforma. O binário
#                   do Windows no Linux dá "invalid ELF header" e o banco fica
#                   ilegível — com o conteúdo intacto, o que confunde mais
#                   ainda. Quem instala é o `npm ci` lá.
#    assets/img/uploads/  fotos enviadas pelo painel moram lá.
#    .git/, backups/, *.log
# ==========================================================================
set -uo pipefail

SERVIDOR="${SERVIDOR:-deploy@204.168.208.52}"
CHAVE="${CHAVE:-$HOME/.ssh/hetzner_budget_new}"
DESTINO="${DESTINO:-/var/www/projetos/Innovar-Engenharia}"
SERVICO="${SERVICO:-innovar.service}"
PORTA="${PORTA:-5195}"
DOMINIO="${DOMINIO:-innovar.projetos.luizaugust.me}"

APP_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
cd "$APP_DIR" || exit 1

azul()    { printf "\033[1;34m%s\033[0m\n" "$1"; }
verde()   { printf "\033[1;32m%s\033[0m\n" "$1"; }
amarelo() { printf "\033[1;33m%s\033[0m\n" "$1"; }
vermelho(){ printf "\033[1;31m%s\033[0m\n" "$1"; }

SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$CHAVE")

azul "1/5  Conferindo o que vai subir"
VERSAO=$(node -p "require('./package.json').version" 2>/dev/null || echo "?")
echo "     versão $VERSAO  →  $SERVIDOR:$DESTINO"

azul "2/5  Enviando arquivos"
rsync -az --delete \
  -e "ssh -o BatchMode=yes -i $CHAVE" \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='data/' \
  --exclude='backups/' \
  --exclude='assets/img/uploads/' \
  --exclude='*.log' \
  --exclude='.env' \
  ./ "$SERVIDOR:$DESTINO/" || { vermelho "     rsync falhou"; exit 1; }
verde "     arquivos no servidor"

azul "3/5  Dependências no servidor"
"${SSH[@]}" "$SERVIDOR" "cd $DESTINO && npm ci --omit=dev --no-audit --no-fund 2>&1 | tail -3" \
  || { vermelho "     npm ci falhou"; exit 1; }
verde "     node_modules em dia (compilado LÁ, para a plataforma de lá)"

azul "4/5  Reiniciando o serviço"
"${SSH[@]}" "$SERVIDOR" "sudo systemctl restart $SERVICO && sleep 3 && systemctl is-active $SERVICO" \
  || { vermelho "     o serviço não subiu"; "${SSH[@]}" "$SERVIDOR" "journalctl -u $SERVICO -n 25 --no-pager"; exit 1; }

azul "5/5  Conferindo"
# Por DENTRO prova que o Node subiu; por FORA prova que o visitante consegue
# chegar. Medir só por dentro e dizer "está no ar" já me enganou antes:
# certificado vencido e bloco desabilitado passam despercebidos assim.
DENTRO=$("${SSH[@]}" "$SERVIDOR" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORTA/saude")
FORA=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://$DOMINIO/" || echo 000)
echo "     127.0.0.1:$PORTA/saude  →  $DENTRO"
echo "     https://$DOMINIO/       →  $FORA"

echo
if [ "$FORA" = "200" ]; then
  verde "No ar: https://$DOMINIO/  (versão $VERSAO)"
else
  amarelo "O endereço público respondeu $FORA."
  amarelo "Se for a primeira instalação, falta o vhost e o certificado:"
  echo    "  ssh $SERVIDOR"
  echo    "  cd $DESTINO && sudo ./nginx/criar-site.sh $DOMINIO $PORTA"
fi
