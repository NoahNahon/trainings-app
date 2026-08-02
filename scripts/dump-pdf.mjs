// Textauszug einer PDF, zeilenweise nach y-Position gruppiert.
//
// Wozu: macOS hat hier keine PDF-Kommandozeilenwerkzeuge (kein poppler, kein
// pdftotext), und die vorhandenen Skripte sind auf das Rezeptbuch-Layout
// zugeschnitten. Dieses hier ist absichtlich dumm und layout-agnostisch: es
// dient dem Lesen, nicht dem Parsen.
//
//   npm run dump:pdf -- ../Ein_Plan.pdf
//   npm run dump:pdf -- ../Ein_Plan.pdf 3      # nur Seite 3
//
// Achtung: Pfade zeigen typischerweise eine Ebene hoeher, wo die privaten PDFs
// liegen. Deren Inhalt gehoert NICHT in dieses Repo.

import { readFileSync } from 'node:fs'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

const file = process.argv[2]
const onlyPage = process.argv[3] ? Number(process.argv[3]) : null

if (!file) {
  console.error('Aufruf: npm run dump:pdf -- <datei.pdf> [seite]')
  process.exit(1)
}

const task = pdfjs.getDocument({ data: new Uint8Array(readFileSync(file)) })
try {
  const doc = await task.promise
  for (let p = 1; p <= doc.numPages; p++) {
    if (onlyPage && p !== onlyPage) continue
    const page = await doc.getPage(p)
    const content = await page.getTextContent()

    // Nach gerundeter y-Position gruppieren: alles auf gleicher Hoehe ist eine
    // Zeile. Innerhalb der Zeile nach x sortieren, damit Spalten die Reihenfolge
    // behalten.
    const rows = new Map()
    for (const item of content.items) {
      if (!item.str?.trim()) continue
      const y = Math.round(item.transform[5])
      if (!rows.has(y)) rows.set(y, [])
      rows.get(y).push({ x: item.transform[4], s: item.str })
    }

    console.log(`\n===== Seite ${p} von ${doc.numPages} =====`)
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      const line = rows
        .get(y)
        .sort((a, b) => a.x - b.x)
        .map((i) => i.s)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (line) console.log(line)
    }
  }
} finally {
  await task.destroy()
}
