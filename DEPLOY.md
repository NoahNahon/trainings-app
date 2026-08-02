# Auf GitHub Pages veröffentlichen

Danach läuft die App unter einer HTTPS-Adresse, lässt sich als echte PWA installieren
und funktioniert **offline** — auch im Fitnessstudio, ohne dass dein Mac läuft.

## Vorher wissen

**GitHub Pages ist auf kostenlosen Accounts nur für öffentliche Repos verfügbar.**
(Private Repos + Pages brauchen GitHub Pro.) Das heißt konkret:

| | |
| --- | --- |
| **Öffentlich sichtbar** | Der Quellcode — und damit dein Trainingsplan und alle 16 Rezepte, weil die als Startdaten in `src/data/` liegen. |
| **Nicht im Repo** | Deine PDFs. Das Repo umfasst nur den Ordner `trainings-app`, die PDFs liegen eine Ebene darüber. |
| **Bleibt auf dem Handy** | Dein Trainings-Verlauf, Notizen und Favoriten. Die liegen im localStorage des Browsers und werden nie übertragen. |

Trainingsplan und Rezepte sind nichts Heikles — aber es ist deine Entscheidung. Wenn der
Code nicht öffentlich sein soll, nimm stattdessen **Netlify Drop**
(<https://app.netlify.com/drop>): dort ziehst du nur den fertigen Ordner `dist` hinein,
der Quellcode bleibt auf dem Mac. Ergebnis ist dieselbe HTTPS-PWA.

## Schritt 1 – Repo anlegen

Auf <https://github.com/new>:

- **Repository name:** `trainings-app`
- **Public** auswählen
- **Keine** Häkchen bei „Add a README", „Add .gitignore", „Choose a license" —
  das Repo muss leer sein, hier liegen schon Dateien

Wenn du einen anderen Namen wählst, merke ihn dir: er steckt später in der Adresse.

## Schritt 2 – Pages aktivieren (**vor** dem Push)

Im neuen, noch leeren Repo: **Settings → Pages → Build and deployment → Source:**
`GitHub Actions` auswählen.

Das muss vor dem ersten Push passieren. Sonst startet der Deploy-Lauf, findet noch keine
aktivierte Pages-Konfiguration und schlägt im letzten Schritt fehl. Falls das doch
passiert: Pages jetzt umstellen, dann **Actions → den fehlgeschlagenen Lauf öffnen →
„Re-run all jobs"**.

## Schritt 3 – E-Mail-Adresse schützen

Commits in einem öffentlichen Repo enthalten deine Commit-E-Mail dauerhaft und
maschinenlesbar. Deshalb wird die GitHub-noreply-Adresse verwendet statt deiner echten:
`1234567+DEIN-USER@users.noreply.github.com`.

**Wenn du das Skript aus Schritt 4 nimmst, ist hier nichts zu tun** — es liest die
Nummer selbst aus der öffentlichen GitHub-API und schlägt die Adresse vor.

Manuell findest du sie unter **Settings** (Profilbild oben rechts) → Abschnitt
**„Access"** → **Emails**. Falls dort nur „Email notifications" steht, bist du in den
Einstellungen einer Organisation oder eines Repositories statt in deinen persönlichen.

Der Haken bei „Keep my email addresses private" ist **nicht** Voraussetzung: er steuert
nur, was GitHub bei Commits über die Weboberfläche einsetzt. Die noreply-Adresse
akzeptiert GitHub in jedem Fall und ordnet die Commits trotzdem dir zu. Anhaken ist
trotzdem sinnvoll.

## Schritt 4 – Hochladen

Am einfachsten per Doppelklick auf **„Auf GitHub veroeffentlichen.command"** (liegt im
selben Ordner wie diese Datei). Das Skript fragt Benutzername, Repo-Name und die
noreply-Adresse ab, setzt sie nur für dieses Repo und lädt hoch. Dein Token sieht es
nie — danach fragt git selbst. Wenn etwas schiefgeht, kannst du es einfach nochmal
starten.

Wer es lieber selbst tippt, im Terminal. Ersetze `DEIN-NAME`, die noreply-Adresse aus
Schritt 3 und `DEIN-USER`:

```sh
cd /pfad/zu/trainings-app        # der Ordner, in dem diese Datei liegt

git config user.name "DEIN-NAME"
git config user.email "1234567+DEIN-USER@users.noreply.github.com"

git add -A
git commit -m "Trainingsplan- und Rezept-App"
git remote add origin https://github.com/DEIN-USER/trainings-app.git
git push -u origin main
```

Beim Push fragt GitHub nach Zugangsdaten. Als Passwort **nicht** dein GitHub-Passwort
eingeben, sondern ein Personal Access Token: github.com → Settings → Developer settings →
Personal access tokens → Tokens (classic) → Generate new token.

Dabei **zwei** Häkchen setzen: **`repo`** und **`workflow`**. Das zweite ist nötig, weil
das Repo `.github/workflows/deploy.yml` enthält — GitHub lehnt den Push sonst ab mit
*„refusing to allow a Personal Access Token to create or update workflow … without
`workflow` scope"*. Die Anmeldung ist dann korrekt, nur die Berechtigung fehlt.

Nachträglich ergänzen geht ohne neues Token: Tokens (classic) → Token anklicken → Häkchen
bei `workflow` → **Update token**. Der Token-Wert bleibt gleich, du musst ihn nicht neu
eingeben. Erzeugst du dagegen ein *neues* Token, musst du das alte erst aus der
macOS-Keychain löschen, sonst verwendet git weiter das alte:

```sh
printf "protocol=https\nhost=github.com\n\n" | git credential-osxkeychain erase
```

Unter **Actions** siehst du den Lauf. Nach etwa einer Minute steht dort die Adresse:

```
https://DEIN-USER.github.io/trainings-app/
```

## Schritt 5 – Aufs Handy

1. Die Adresse in **Safari** öffnen (nicht Chrome — nur Safari kann auf iOS zum
   Home-Bildschirm hinzufügen).
2. Einmal komplett laden lassen, kurz durch die Tabs tippen.
3. Teilen-Symbol → **„Zum Home-Bildschirm"**.
4. Kontrolle: in der App unter **Mehr → Daten → Auf dem Handy installieren** muss grün
   „Offline-Betrieb aktiv" stehen. Dann funktioniert sie auch im Flugmodus.

Android: in Chrome öffnen → Menü → „App installieren".

## Daten vom Mac aufs Handy übernehmen

Nur nötig, wenn du am Mac schon Trainings geloggt hast:
**Mehr → Daten → Exportieren** am Mac, JSON-Datei aufs Handy schicken (AirDrop, Mail),
dort in der App **Mehr → Daten → Importieren**.

## Später etwas ändern

Wieder Doppelklick auf **„Auf GitHub veroeffentlichen.command"** — es erkennt, dass das
Repo schon existiert, und schiebt nur die Änderungen nach. Oder manuell:

```sh
cd /pfad/zu/trainings-app
git add -A
git commit -m "Was du geändert hast"
git push
```

Der Workflow baut und veröffentlicht automatisch. Auf dem Handy aktualisiert sich die App
beim nächsten Öffnen selbst (`registerType: 'autoUpdate'`).

Wichtig: Änderungen, die du **in der App** machst (Plan bearbeiten, Rezepte importieren),
liegen nur im Browser deines Geräts — die musst du nicht pushen. Der Code hier ist nur
der Ausgangszustand.

## Das Repo nicht umbenennen

Der Service-Worker-Scope hängt am Pfad `/trainings-app/`. Benennst du das Repo später um,
zeigt das Icon auf dem Home-Bildschirm auf die alte Adresse und lädt nicht mehr. Dann:
Icon auf dem Handy löschen und über die neue Adresse erneut hinzufügen.
