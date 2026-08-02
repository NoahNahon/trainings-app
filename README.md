# Trainingsplan & Rezepte

Eine installierbare Web-App (PWA) für den Calisthenics-Trainingsplan und das Rezeptbuch.
Läuft im Browser, lässt sich auf dem Homescreen installieren und funktioniert offline.
Alle Daten bleiben im Browser (localStorage) – kein Server, kein Account.

## Starten

Doppelklick auf **`Trainings-App starten.command`**. Das Skript baut die App und öffnet
sie unter `http://localhost:5180`; im Terminal-Fenster steht außerdem die Adresse, unter
der die App im gleichen WLAN am Handy erreichbar ist.

Alternativ im Terminal:

```sh
export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"   # Node liegt unter ~/.nvm
npm install       # nur beim ersten Mal
npm run dev       # Entwicklungsmodus mit Hot Reload
npm run build     # Typecheck + Produktions-Build nach dist/
npm run preview   # dist/ ausliefern
```

## Funktionen

**Plan** – Blöcke (Warm-up, Push, Pull, Grip, Beine, Core, Cool-down) mit Sätzen,
Wiederholungen, Pausen, Hinweisen und Tutorial-Links. Im Bearbeiten-Modus lassen sich
Übungen ändern, hinzufügen, löschen und verschieben, Blöcke umbenennen und umfärben,
Trainingstage setzen. Zwei Pläne sind hinterlegt: Phase 1 (aktiv) und Phase 2.

**Training** – Session starten, Sätze abhaken, tatsächliche Wiederholungen eintragen
(mit dem Zielwert vorbelegt). Beim Abhaken startet automatisch der Pausen-Timer;
Halte-Übungen haben einen eigenen Timer-Knopf. Eine laufende Session übersteht ein
Neuladen der Seite.

**Verlauf** – abgeschlossene Sessions mit Detailansicht sowie Fortschritt pro Übung
(Gesamtwiederholungen, bester Satz, Verlaufslinie).

**Rezepte** – 16 Gerichte mit Suche über Name und Zutaten, Filter nach Tagestyp,
Sortierung nach Name/Protein/Zeit, Favoriten und abhakbaren Zutaten.

**Mehr** – Protein-Leitfaden, Bausteine pro Mahlzeit, Proteinbooster,
Progressionslogik und Ziele, PDF-Import sowie Export/Import der Daten als JSON.

## PDF-Import

Unter *Mehr → Daten → PDF auswählen* liest die App Rezepte direkt im Browser aus einer
PDF (pdf.js, kein Upload irgendwohin). Erkannt wird das Karten-Layout des Rezeptbuchs:
Name, `~45g`, Portionen, Zeit, Meal Prep, Tags, Zutatenliste und numerierte Schritte.
Vorhandene Rezepte werden anhand des Namens aktualisiert statt doppelt angelegt.

PDFs mit anderem Layout (z.B. `Trainings_Lifestyle_Guide.pdf`, Fließtext ohne
Protein-Angabe) liefern bewusst 0 Treffer; die App zeigt dann den erkannten Rohtext an.

## Datenquellen

Die Startdaten sind aus deinen PDFs übernommen:

| Datei | Verwendet für |
| --- | --- |
| `Phase1_Trainingsplan_v3.pdf` | Phase 1 (aktiver Plan) inkl. Hinweise |
| `Trainings_Lifestyle_Guide.pdf` | Phase 2, Progressionen, Langfristige Ziele |
| `Rezeptbuch.pdf` | 16 Rezepte, Protein-Leitfaden, Bausteine, Proteinbooster |

Phase 1 nennt **Mittwoch & Samstag** als Trainingstage und ist neuer als der
Lifestyle-Guide (Montag & Freitag) – deshalb gilt Mi/Sa.

Eine Abweichung ist beabsichtigt: im Tipp zu *Overnight Oats* sind zwei Tippfehler der
PDF korrigiert („Probiota" → „Probiotika", „macht ein Schritt" → „macht einen Schritt").
Ein erneuter PDF-Import würde die Originalschreibweise zurückholen.

## Entwicklungs-Skripte

```sh
npm run verify:seed                  # prüft src/data/recipes.ts gegen ../Rezeptbuch.pdf
npm run parse:pdf ../Rezeptbuch.pdf  # zeigt, was der Parser aus einer PDF liest
npm run parse:pdf ../foo.pdf --json  # dasselbe als JSON
npm run icons                        # erzeugt public/icon-192.png und icon-512.png
```

`verify:seed` gibt Exit-Code 1 zurück, wenn Seed und PDF auseinanderlaufen – nützlich,
falls du das Rezeptbuch änderst.

## Auf dem Handy

### Über den Mac im lokalen Netz

`Trainings-App starten.command` zeigt die Adresse und einen QR-Code — mit der Handy-Kamera
scannen, dann in Safari öffnen → Teilen → „Zum Home-Bildschirm".

**Einschränkung:** Diese Adresse ist `http://`, nicht `https://`. Browser erlauben
Offline-Speicherung (Service Worker) nur in einem *secure context*, also über HTTPS oder
auf `localhost`. Über die LAN-IP wird der Service Worker deshalb **nicht** registriert:
Das Icon auf dem Homescreen öffnet die App im Vollbild, sie lädt aber jedes Mal neu vom
Mac. Ohne laufenden Mac im selben Netz — etwa im Fitnessstudio — bleibt sie leer.
Die App weist unter *Mehr → Daten → Auf dem Handy installieren* selbst darauf hin.

### Als echte PWA (offline, überall)

Dafür muss `dist/` auf einem HTTPS-Host liegen — die App braucht kein Backend, also genügt
jeder Static-Host. Der Trainings-Verlauf bleibt dabei lokal auf dem Handy (localStorage),
es wird nichts hochgeladen.

Schritt-für-Schritt für GitHub Pages: **[DEPLOY.md](DEPLOY.md)**. Der Workflow
`.github/workflows/deploy.yml` liegt bereit; nach dem Push baut und veröffentlicht
GitHub automatisch.

Die App ist bewusst auf Unterpfad-Hosting ausgelegt (`base: './'`), läuft also sowohl
unter `https://host/` als auch unter `https://user.github.io/trainings-app/`. Prüfen
lässt sich das lokal:

```sh
npm run build
npm run serve:subpath   # http://localhost:5310/trainings-app/
```

## Aufbau

```
src/
  App.tsx              Tab-Navigation
  store.tsx            Zustand + localStorage, Session-Draft
  types.ts             Datenmodell
  data/                Startdaten aus den PDFs
  lib/
    recipeParser.ts    reine Parse-Logik (in Node testbar)
    pdfImport.ts       pdf.js-Anbindung im Browser
    util.ts            Datum, Pluralformen, Zielwerte
  components/          UI-Bausteine, Timer
  pages/               Plan, Workout, Verlauf, Rezepte, Mehr, Import
```
