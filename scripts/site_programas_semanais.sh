#!/bin/bash
# Site grid: weekly event + icon for a radio programme. Usage: site_programas_semanais.sh vidioteca|lendas
set -euo pipefail
export PATH=~/.nvm/versions/node/v24.18.1/bin:$PATH
cd /mnt/d/Projetos/olha-que-duas-admin
case "${1:?vidioteca|lendas}" in
  vidioteca) ICON=/mnt/c/Users/leosc/Desktop/video/projetos/vidioteca/arte/icone-vidioteca-128.png; OBJ=vidioteca.png; SQL=supabase/vidioteca-olha-que-duas.sql;;
  lendas) ICON=/mnt/c/Users/leosc/Desktop/video/projetos/lendas-portugal-2026/l6/arte/icone-lendas-128.png; OBJ=lendas-de-portugal.png; SQL=supabase/lendas-de-portugal-semanal.sql;;
esac
URL=https://jjifjbdfpvgeseqbjpkg.supabase.co/storage/v1/object/public/event-icons/icons/$OBJ
want=$(sha256sum "$ICON" | cut -d' ' -f1)
have=$(curl -sf "$URL?v=$want" | sha256sum | cut -d' ' -f1 || true)
if [ "$have" != "$want" ]; then
  # storage cp does not overwrite (409 hidden, exit 0): rm first
  npx supabase storage rm "ss:///event-icons/icons/$OBJ" --linked --experimental --yes >/dev/null 2>&1 || true
  npx supabase storage cp "$ICON" "ss:///event-icons/icons/$OBJ" --linked --experimental --yes --content-type image/png
fi
have=$(curl -sf "$URL?v=$want" | sha256sum | cut -d' ' -f1)
[ "$have" = "$want" ] && echo "icone OK $URL" || { echo "ABORT: icone no storage difere"; exit 1; }
npx supabase db query --linked --yes -f "$SQL" >/dev/null
EV=$(grep -o "'[0-9a-f-]\{36\}'" "$SQL" | head -1 | tr -d "'")
echo "select e.name, e.icon_url, s.day_of_week, s.time, s.end_time from events e join schedule s on s.event_id=e.id where e.id='$EV' order by s.day_of_week, s.time;" > /tmp/site_check.sql
npx supabase db query --linked --read-only -f /tmp/site_check.sql | grep -E '"(name|day_of_week|time|end_time)"'
