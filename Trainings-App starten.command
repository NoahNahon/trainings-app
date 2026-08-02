#!/bin/zsh
# Doppelklick startet die App und zeigt die Adresse fürs Handy inkl. QR-Code.
# Node liegt bei dir unter ~/.nvm und ist nicht global im PATH – daher der explizite Pfad.

cd "$(dirname "$0")" || exit 1

NODE_BIN="$HOME/.nvm/versions/node/v24.18.0/bin"
if [ ! -x "$NODE_BIN/node" ]; then
  # Fallback: irgendeine installierte Node-Version aus nvm nehmen
  NODE_BIN="$(dirname "$(ls -1 "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | tail -1)")"
fi
if [ ! -x "$NODE_BIN/node" ]; then
  echo "Node.js wurde nicht gefunden. Bitte Node installieren (https://nodejs.org) und erneut versuchen."
  read -r "?Mit Enter schließen..."
  exit 1
fi
export PATH="$NODE_BIN:$PATH"

if [ ! -d node_modules ]; then
  echo "Installiere Abhängigkeiten (nur beim ersten Start)…"
  npm install || { read -r "?Fehlgeschlagen. Mit Enter schließen..."; exit 1; }
fi

echo "Baue die App…"
npm run build || { read -r "?Build fehlgeschlagen. Mit Enter schließen..."; exit 1; }

# serve.mjs ermittelt selbst einen freien Port und gibt die tatsächliche Adresse aus,
# damit angezeigte und echte URL nicht auseinanderlaufen können.
node scripts/serve.mjs
