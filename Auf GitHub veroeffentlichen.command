#!/bin/bash
#
# Einmal doppelklicken, um die App nach GitHub Pages zu veroeffentlichen.
#
# Warum dieses Skript und nicht einfach die Befehle aus DEPLOY.md:
# Die zwei Dinge, die man dabei falsch machen kann, sind (1) die echte
# E-Mail-Adresse dauerhaft in oeffentliche Commits schreiben und (2) die
# Remote-URL vertippen. Beides fragt das Skript ab und setzt es exakt.
#
# Das Skript sieht dein Passwort/Token NIE - danach fragt git selbst.

set -u
cd "$(dirname "$0")" || exit 1

trap 'echo; echo "Fenster kann geschlossen werden."; read -r -p "" _ || true' EXIT

line() { printf '%s\n' "------------------------------------------------------------"; }
abort() { echo; echo "ABBRUCH: $1"; exit 1; }

line
echo "  Trainings-App auf GitHub Pages veroeffentlichen"
line
echo
echo "Wichtig zu wissen: GitHub Pages ist bei kostenlosen Accounts nur fuer"
echo "OEFFENTLICHE Repos verfuegbar. Damit sind der Quellcode und dadurch dein"
echo "Trainingsplan und deine 16 Rezepte fuer jeden sichtbar."
echo
echo "NICHT sichtbar: deine PDFs (nicht im Repo) und dein Trainings-Verlauf"
echo "(liegt nur im Browser deines Handys)."
echo
read -r -p "Ist das ok? (ja/nein) " ok
[ "$ok" = "ja" ] || abort "Nichts wurde hochgeladen. Alternative ohne oeffentlichen Code: siehe DEPLOY.md, Netlify Drop."

echo
line
echo "Schritt 1 von 2 - hast du das auf github.com schon gemacht?"
line
echo "  a) Leeres, oeffentliches Repo angelegt (ohne README/gitignore/Lizenz)"
echo "  b) Darin: Settings -> Pages -> Source auf 'GitHub Actions' gestellt"
echo
echo "(b) muss VOR dem Push passieren, sonst schlaegt der Deploy fehl."
echo
read -r -p "Beides erledigt? (ja/nein) " ok
[ "$ok" = "ja" ] || abort "Erst a) und b) auf github.com erledigen, dann dieses Skript nochmal starten."

echo
line
echo "Schritt 2 von 2 - deine Angaben"
line
echo

read -r -p "GitHub-Benutzername: " ghuser
[ -n "$ghuser" ] || abort "Kein Benutzername angegeben."
case "$ghuser" in
  *[!A-Za-z0-9-]*) abort "'$ghuser' sieht nicht wie ein GitHub-Benutzername aus (nur Buchstaben, Zahlen, Bindestrich)." ;;
esac

read -r -p "Repository-Name [trainings-app]: " repo
repo="${repo:-trainings-app}"

# --- noreply-Adresse selbst ermitteln --------------------------------------
# Die Adresse lautet <nummer>+<benutzername>@users.noreply.github.com. Die
# Nummer steht in der oeffentlichen GitHub-API, es braucht also kein Token.
# Nebeneffekt: ein vertippter Benutzername fliegt hier sofort auf, statt erst
# beim Push. Faellt die Abfrage aus (offline, Rate-Limit), wird gefragt.
echo
echo "Pruefe den Benutzernamen bei GitHub ..."
ghid=""
api_body="$(mktemp)" || abort "Konnte keine temporaere Datei anlegen."
api_code="$(curl -s -m 15 -o "$api_body" -w '%{http_code}' \
  "https://api.github.com/users/$ghuser" 2>/dev/null || echo 000)"
if [ "$api_code" = "200" ]; then
  ghid="$(sed -n 's/.*"id"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' "$api_body" | head -1)"
fi
rm -f "$api_body"

if [ "$api_code" = "404" ]; then
  abort "Den Benutzer '$ghuser' gibt es auf github.com nicht. Tippfehler?"
fi

email=""
if [ -n "$ghid" ]; then
  default_email="${ghid}+${ghuser}@users.noreply.github.com"
  echo "Benutzer '$ghuser' gefunden."
  echo
  echo "Deine noreply-Adresse fuer die Commits:"
  echo "  $default_email"
  echo
  echo "Die verbirgt deine echte E-Mail, die sonst dauerhaft und maschinenlesbar"
  echo "in jedem Commit dieses oeffentlichen Repos stehen wuerde."
  echo "Einfach Enter druecken, um sie zu uebernehmen."
  echo
  read -r -p "Commit-E-Mail [Enter = uebernehmen]: " email
  email="${email:-$default_email}"
else
  echo "GitHub war nicht erreichbar (Code $api_code) - deshalb bitte selbst eintragen."
  echo
  echo "Nimm die noreply-Adresse, damit deine echte Adresse nicht dauerhaft im"
  echo "oeffentlichen Repo steht. Du findest sie auf github.com unter"
  echo "Settings (dein Profilbild oben rechts) -> Abschnitt 'Access' -> 'Emails'."
  echo "Form: 1234567+${ghuser}@users.noreply.github.com"
  echo
  read -r -p "Commit-E-Mail: " email
fi
[ -n "$email" ] || abort "Keine E-Mail angegeben."

case "$email" in
  *@users.noreply.github.com) ;;
  *)
    echo
    echo "WARNUNG: '$email' ist keine noreply-Adresse. Sie waere in jedem Commit"
    echo "dieses oeffentlichen Repos dauerhaft und maschinenlesbar zu finden."
    read -r -p "Trotzdem verwenden? (ja/nein) " ok
    [ "$ok" = "ja" ] || abort "Hol dir die noreply-Adresse und starte das Skript neu."
    ;;
esac

read -r -p "Dein Name fuer die Commits [$ghuser]: " ghname
ghname="${ghname:-$ghuser}"

echo
line
echo "Lade hoch nach: https://github.com/$ghuser/$repo"
line
echo

# --- Identitaet nur fuer dieses Repo, nicht global ---
git config user.name "$ghname"   || abort "git config user.name fehlgeschlagen."
git config user.email "$email"   || abort "git config user.email fehlgeschlagen."

git add -A || abort "git add fehlgeschlagen."

if git rev-parse HEAD >/dev/null 2>&1; then
  if git diff --cached --quiet; then
    echo "Keine neuen Aenderungen - nutze den bestehenden Commit."
  else
    git commit -m "Trainingsplan und Rezepte aktualisiert" || abort "git commit fehlgeschlagen."
  fi
else
  git commit -m "Trainingsplan- und Rezept-App" || abort "git commit fehlgeschlagen."
  git branch -M main
fi

# --- Remote setzen (idempotent) ---
url="https://github.com/$ghuser/$repo.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$url"
else
  git remote add origin "$url"
fi

echo
echo "Falls git nach Zugangsdaten fragt: Benutzername ist '$ghuser', als Passwort"
echo "ein Personal Access Token (NICHT dein GitHub-Passwort)."
echo
echo "Das Token braucht ZWEI Haken, weil die App eine GitHub-Actions-Datei"
echo "mitbringt:   [x] repo    [x] workflow"
echo
echo "Zu finden unter: github.com -> Settings -> Developer settings"
echo "  -> Personal access tokens -> Tokens (classic)"
echo
line

# Push-Ausgabe mitschreiben, um bei Ablehnung konkret helfen zu koennen.
# PIPESTATUS statt $?, weil $? sonst den Status von tee liefert.
push_log="$(mktemp)" || abort "Konnte keine temporaere Datei anlegen."
git push -u origin main 2>&1 | tee "$push_log"
push_status="${PIPESTATUS[0]}"

if [ "$push_status" -ne 0 ]; then
  echo
  line
  if grep -q 'workflow' "$push_log" && grep -q 'scope' "$push_log"; then
    echo "Dem Token fehlt die Berechtigung 'workflow'."
    echo
    echo "Die Anmeldung hat funktioniert - GitHub hat nur abgelehnt, weil die App"
    echo ".github/workflows/deploy.yml mitbringt. Genau diese Datei baut und"
    echo "veroeffentlicht sie. Ein Token darf sie nur anlegen, wenn der Haken"
    echo "'workflow' gesetzt ist; 'repo' allein reicht dafuer nicht."
    echo
    echo "So behebst du es, ohne ein neues Token zu erzeugen:"
    echo "  1. github.com -> Settings -> Developer settings"
    echo "     -> Personal access tokens -> Tokens (classic)"
    echo "  2. Dein Token anklicken"
    echo "  3. Haken bei 'workflow' setzen ('repo' bleibt gesetzt)"
    echo "  4. Unten auf 'Update token'"
    echo "  5. Dieses Skript nochmal starten - das Token bleibt dasselbe,"
    echo "     du musst also nichts neu eintippen"
    echo
    echo "Nur falls du stattdessen ein NEUES Token erzeugst: erst das alte aus"
    echo "der Keychain loeschen, sonst nimmt git weiterhin das alte. Dafuer"
    echo "diese Zeile im Terminal:"
    echo
    echo '  printf "protocol=https\nhost=github.com\n\n" | git credential-osxkeychain erase'
  else
    echo "Der Push ist fehlgeschlagen. Die haeufigsten Gruende:"
    echo "  - Repo-Name oder Benutzername vertippt (erwartet: $ghuser/$repo)"
    echo "  - Als Passwort das GitHub-Passwort statt eines Tokens eingegeben"
    echo "  - Das Repo auf github.com ist nicht leer"
    echo
    echo "Falls git gar nicht mehr nach Zugangsdaten fragt, weil ein falsches"
    echo "Token gespeichert wurde, dieses loeschen mit:"
    echo
    echo '  printf "protocol=https\nhost=github.com\n\n" | git credential-osxkeychain erase'
  fi
  echo
  echo "Nichts kaputt, es wurde nichts veroeffentlicht. Korrigieren und dieses"
  echo "Skript einfach nochmal starten."
  line
  rm -f "$push_log"
  exit 1
fi
rm -f "$push_log"

echo
line
echo "  Hochgeladen."
line
echo
echo "1. Auf github.com -> Tab 'Actions': der Lauf braucht etwa eine Minute."
echo "2. Danach ist die App hier erreichbar:"
echo
echo "     https://$ghuser.github.io/$repo/"
echo
echo "3. Diese Adresse auf dem Handy in SAFARI oeffnen (nicht Chrome),"
echo "   einmal komplett laden lassen, dann Teilen -> 'Zum Home-Bildschirm'."
echo
echo "4. Kontrolle in der App: Mehr -> Daten -> Auf dem Handy installieren."
echo "   Dort muss gruen 'Offline-Betrieb aktiv' stehen. Dann laeuft sie"
echo "   auch im Flugmodus, also auch im Fitnessstudio."
echo
echo "Wenn der Actions-Lauf im letzten Schritt rot wird, war Pages doch noch"
echo "nicht auf 'GitHub Actions' gestellt: umstellen, dann im fehlgeschlagenen"
echo "Lauf 'Re-run all jobs' klicken."
echo
