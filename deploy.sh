#!/usr/bin/env bash
# ==========================================================================
#  deploy.sh — atualiza a INNOVAR em produção sem arriscar o conteúdo
#
#  Uso (NO SERVIDOR):  cd /var/www/projetos/Innovar-Engenharia && sudo ./deploy.sh
#
#  O banco data/innovar.db é TODO o conteúdo do site: os textos de cada seção,
#  os serviços, o catálogo da loja com preço e estoque, as obras do portfólio,
#  as matérias do feed, os pedidos e os orçamentos recebidos. Ele vive SÓ no
#  servidor — está no .gitignore. Um deploy que "deu certo" mas comeu os
#  pedidos não deu certo, e é por isso que este script conta o conteúdo antes e
#  depois, e restaura sozinho se a contagem mudar.
#
#  Sequência: trava → inventário → parar → backup → pull → dependências →
#             permissões → subir → conferir (inventário, saúde, endereço).
#
#  IRMÃO DESTE: enviar.sh, que manda os arquivos da máquina de desenvolvimento
#  por SSH. Aquele serve para a PRIMEIRA instalação, quando ainda não há clone
#  aqui; a partir daí o caminho é git push lá + este script aqui.
# ==========================================================================
set -uo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$(readlink -f "$0")")" && pwd)}"
SERVICO="${SERVICO:-innovar.service}"
PORTA="${PORTA:-5195}"
DOMINIO="${DOMINIO:-innovar.projetos.luizaugust.me}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
MANTER_BACKUPS=20

cd "$APP_DIR" || { echo "Diretório $APP_DIR não existe"; exit 1; }

azul()    { printf "\033[1;34m%s\033[0m\n" "$1"; }
verde()   { printf "\033[1;32m%s\033[0m\n" "$1"; }
amarelo() { printf "\033[1;33m%s\033[0m\n" "$1"; }
vermelho(){ printf "\033[1;31m%s\033[0m\n" "$1"; }

# --------------------------------------------------------------- inventário
# Conta o que existe no banco. Serve para PROVAR, no fim, que nada sumiu.
#
# Devolve "ILEGIVEL" sem detalhe quando não consegue ler — e o detalhe importa:
# a mensagem de erro inteira seria COMPARADA com o inventário do fim, e
# "não consegui ler" contra "6 obras · 20 produtos…" pareceria conteúdo
# alterado, disparando uma restauração à toa. Já aconteceu num projeto irmão,
# quando o node_modules veio com o binário de outra plataforma.
inventario() {
  [ -f data/innovar.db ] || { echo "SEM BANCO"; return; }
  node -e '
    try {
      const db = require("better-sqlite3")("data/innovar.db", { readonly: true });
      const n = (t) => { try { return db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c; } catch { return 0; } };
      console.log(`${n("conteudo")} textos · ${n("servicos")} serviços · ${n("produtos")} produtos · ` +
                  `${n("obras")} obras · ${n("materias")} matérias · ${n("pedidos")} pedidos · ${n("orcamentos")} orçamentos`);
    } catch (e) { console.log("ILEGIVEL"); }
  ' 2>/dev/null
}

sem_leitura() { case "$1" in "ILEGIVEL"|"SEM BANCO"|"") return 0;; *) return 1;; esac; }

# O better-sqlite3 é COMPILADO para a plataforma. Se o node_modules vier do
# repositório (compilado no Windows), o Linux recusa com "invalid ELF header" e
# o banco fica ilegível — mesmo intacto. Nomear isso cedo evita perseguir um
# problema de dados que não existe.
diagnosticar_banco() {
  local motivo
  motivo=$(node -e 'try{require("better-sqlite3")("data/innovar.db",{readonly:true}).close()}catch(e){console.log(e.message.split("\n")[0])}' 2>&1 | head -1)
  [ -z "$motivo" ] && return 0
  vermelho "     não consigo LER o banco: $motivo"
  case "$motivo" in
    *"invalid ELF header"*|*ERR_DLOPEN*)
      amarelo "     É o driver compilado para OUTRA plataforma. O conteúdo está intacto."
      amarelo "     Conserte com:  rm -rf node_modules && npm ci --omit=dev"
      ;;
  esac
  return 1
}

restaurar_e_sair() {
  vermelho "$1"
  # SEMPRE guarda o banco que está no disco AGORA, antes de escrever por cima.
  # Sem isto, uma restauração equivocada é irreversível.
  if [ -f data/innovar.db ]; then
    SOCORRO="$BACKUP_DIR/innovar.antes-de-restaurar.$(date +%Y-%m-%d_%H%M%S).db"
    mkdir -p "$BACKUP_DIR" && cp data/innovar.db "$SOCORRO" 2>/dev/null \
      && amarelo "O banco que estava no disco foi guardado em: $SOCORRO"
  fi
  if [ -f "${BACKUP:-}" ]; then
    if [ -f data/innovar.db ] && [ data/innovar.db -nt "$BACKUP" ]; then
      vermelho "NÃO restaurei: o banco no disco é MAIS NOVO que o backup."
      amarelo  "  Voltar o backup apagaria o que entrou depois dele."
      amarelo  "  Se ainda assim quiser:  cp \"$BACKUP\" data/innovar.db"
    else
      cp "$BACKUP" data/innovar.db
      # O -wal guarda escritas que ainda não foram para o .db. Restaurar o .db
      # deixando um -wal de outro momento mistura dois estados do banco.
      rm -f data/innovar.db-wal data/innovar.db-shm
      amarelo "Banco restaurado de: $BACKUP"
    fi
  fi
  systemctl start "$SERVICO" 2>/dev/null
  exit 1
}

# ------------------------------------------------- 0. o banco corre risco?
# TRAVA. Enquanto o banco for rastreado pelo git, todo pull escreve por cima do
# banco de PRODUÇÃO a cópia da máquina de quem desenvolve — e o site volta ao
# conteúdo de exemplo. Não dá para "contornar com cuidado": o risco volta a
# cada atualização. Por isso o deploy para aqui e diz como resolver.
if git ls-files --error-unmatch data/innovar.db >/dev/null 2>&1; then
  vermelho "PAREI: o banco data/innovar.db está VERSIONADO no git."
  echo
  amarelo "  Resolva na SUA MÁQUINA (não aqui) e envie:"
  echo    "    git rm -r --cached data"
  echo    "    git commit -m \"chore: tira o banco do versionamento\""
  echo    "    git push"
  exit 1
fi

# ----------------------------------------------------------- 1. inventário
azul "1/8  Conteúdo atual"
ANTES=$(inventario)
echo "     $ANTES"
sem_leitura "$ANTES" && diagnosticar_banco || true

# --------------------------------------------------------------- 2. parar
azul "2/8  Parando o serviço"
systemctl stop "$SERVICO" 2>/dev/null
sleep 1
verde "     parado — o SQLite fecha o arquivo e grava o -wal antes de copiarmos"

# -------------------------------------------------------------- 3. backup
# DEPOIS de parar, de propósito: com o serviço no ar, copiar o .db sem o -wal
# entrega um banco sem as últimas escritas. Parado, o fechamento limpo já
# levou tudo para o arquivo principal.
azul "3/8  Backup do banco"
mkdir -p "$BACKUP_DIR"
if [ -f data/innovar.db ]; then
  BACKUP="$BACKUP_DIR/innovar.$(date +%Y-%m-%d_%H%M%S).db"
  cp data/innovar.db "$BACKUP"
  [ -f data/innovar.db-wal ] && cp data/innovar.db-wal "$BACKUP-wal"
  verde "     $BACKUP ($(du -h "$BACKUP" | cut -f1))"
  ls -1t "$BACKUP_DIR"/innovar.*.db 2>/dev/null | tail -n +$((MANTER_BACKUPS + 1)) | xargs -r rm -f --
else
  amarelo "     ainda não existe banco (primeira instalação)"
fi

# ----------------------------------------------------------------- 4. pull
azul "4/8  Baixando a versão nova"
DE=$(git rev-parse --short HEAD 2>/dev/null || echo "?")
if ! git pull --ff-only; then
  restaurar_e_sair "     git pull falhou — nada foi alterado."
fi
PARA=$(git rev-parse --short HEAD)
if [ "$DE" = "$PARA" ]; then
  amarelo "     já estava atualizado ($PARA)"
else
  verde "     $DE → $PARA"
  git log --oneline "$DE..$PARA" | sed 's/^/       /'
fi

# --------------------------------------------------------- 5. dependências
azul "5/8  Dependências"
if command -v npm >/dev/null 2>&1; then
  if npm ci --omit=dev --no-audit --no-fund 2>/dev/null || npm install --omit=dev --no-audit --no-fund; then
    verde "     node_modules em dia (compilado AQUI, para a plataforma daqui)"
  else
    restaurar_e_sair "     npm falhou — sem o better-sqlite3 o site não sobe."
  fi
else
  restaurar_e_sair "     npm não encontrado — instale com: apt install -y npm"
fi

# ------------------------------------------------------------ 6. permissões
# O dono precisa ser o usuário DO SERVIÇO, não um palpite: com o dono errado o
# SQLite responde "attempt to write a readonly database" e o painel não salva
# nada — sem erro visível na tela. systemd sem User= significa root.
azul "6/8  Permissões"
DONO=$(systemctl show "$SERVICO" -p User --value 2>/dev/null); [ -z "$DONO" ] && DONO="root"
GRUPO=$(systemctl show "$SERVICO" -p Group --value 2>/dev/null); [ -z "$GRUPO" ] && GRUPO="$DONO"
mkdir -p data assets/img/uploads "$BACKUP_DIR"
chown -R "$DONO:$GRUPO" data assets/img/uploads "$BACKUP_DIR" 2>/dev/null
# A PASTA precisa ser gravável: o SQLite cria o -wal AO LADO do banco.
chmod 755 data assets/img/uploads "$BACKUP_DIR" 2>/dev/null
[ -f data/innovar.db ] && chmod 644 data/innovar.db
verde "     dono: $DONO:$GRUPO"

# ----------------------------------------------------------------- 7. subir
azul "7/8  Subindo o serviço"
systemctl start "$SERVICO"
sleep 3

# -------------------------------------------------------------- 8. conferir
azul "8/8  Conferindo"
DEPOIS=$(inventario)
echo "     antes : $ANTES"
echo "     depois: $DEPOIS"
if sem_leitura "$ANTES" || sem_leitura "$DEPOIS"; then
  amarelo "     não deu para comparar o conteúdo (o banco não pôde ser lido em um dos momentos)."
  amarelo "     NADA foi restaurado — o backup do passo 3 segue guardado."
  diagnosticar_banco || true
elif [ "$ANTES" != "$DEPOIS" ]; then
  # A semeadura pode ACRESCENTAR (campo novo, serviço novo) — isso é esperado e
  # acontece em quase todo deploy. O que não pode é DIMINUIR: conteúdo que
  # existia e sumiu.
  #
  # A comparação é CAMPO A CAMPO. Olhar só o primeiro número deixaria passar o
  # caso que mais importa: os textos continuarem iguais e os PEDIDOS sumirem —
  # exatamente o dado que não dá para recuperar de lugar nenhum.
  diminuiu() {
    local -a A B; local i
    read -ra A <<< "$(echo "$1" | grep -oE '[0-9]+' | tr '\n' ' ')"
    read -ra B <<< "$(echo "$2" | grep -oE '[0-9]+' | tr '\n' ' ')"
    for i in "${!A[@]}"; do
      [ -z "${B[i]:-}" ] && return 0                 # sumiu um campo inteiro
      [ "${A[i]}" -gt "${B[i]}" ] && return 0
    done
    return 1
  }
  if diminuiu "$ANTES" "$DEPOIS"; then
    restaurar_e_sair "     O CONTEÚDO DIMINUIU. Restaurando por segurança."
  else
    amarelo "     o conteúdo cresceu (semeadura de campo novo) — seguindo"
  fi
fi

OK=0
for _ in $(seq 1 10); do
  CODIGO=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORTA/saude" || echo 000)
  [ "$CODIGO" = "200" ] && { OK=1; break; }
  sleep 2
done

if [ "$OK" != "1" ]; then
  echo
  vermelho "A aplicação não respondeu (HTTP $CODIGO). Últimas linhas do log:"
  journalctl -u "$SERVICO" -n 25 --no-pager | sed 's/^/  /'
  echo
  amarelo "O banco está intacto em data/innovar.db e no backup: ${BACKUP:-(nenhum)}"
  exit 1
fi

# ------------------------------------------------------------------------
# O ENDEREÇO PÚBLICO, MEDIDO DE FORA.
#
# Responder em 127.0.0.1 só prova que o Node subiu. Quem serve o visitante é o
# nginx, com TLS e cabeçalhos — e é lá que mora o erro que passa despercebido:
# certificado vencido, bloco desabilitado, proxy na porta errada. Medir de
# dentro e anunciar "está no ar" já enganou gente antes.
# ------------------------------------------------------------------------
echo
echo "  Conferindo pelo endereço público:"
COD=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "https://$DOMINIO/" || echo 000)
case "$COD" in
  200) verde   "    https://$DOMINIO  →  $COD" ;;
  000) amarelo "    https://$DOMINIO  →  sem resposta (falta o vhost? certificado pendente?)"
       amarelo "    Primeira instalação:  sudo ./nginx/criar-site.sh $DOMINIO $PORTA" ;;
  *)   amarelo "    https://$DOMINIO  →  $COD  (veja /var/log/nginx/$DOMINIO.error.log)" ;;
esac

VERSAO=$(node -p "require('./package.json').version" 2>/dev/null || echo "?")
echo
verde "Deploy concluído — INNOVAR v$VERSAO"
echo "  Backup desta atualização: ${BACKUP:-nenhum (primeira instalação)}"
