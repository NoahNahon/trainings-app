// Compares the hand-written seed in src/data/recipes.ts against what the parser
// reads out of the real PDF, so the two can't silently drift apart.
import { existsSync, readFileSync } from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { parseRecipes } from '../src/lib/recipeParser.ts'
import { seedRecipes } from '../src/data/recipes.ts'
import { groupIntoLines } from './group-lines.mjs'

// Die PDF liegt im übergeordneten Ordner und ist bewusst nicht Teil des Repos.
const PDF = process.argv[2] ?? '../Rezeptbuch.pdf'
if (!existsSync(PDF)) {
  console.log(`Übersprungen: ${PDF} nicht gefunden.`)
  console.log('Dieses Skript vergleicht die Startdaten mit dem Original-Rezeptbuch und')
  console.log('läuft daher nur lokal, wo die PDF neben dem Projektordner liegt.')
  process.exit(0)
}

const task = getDocument({ data: new Uint8Array(readFileSync(PDF)) })
const doc = await task.promise
const pages = []
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p)
  pages.push(groupIntoLines((await page.getTextContent()).items))
  page.cleanup()
}
await task.destroy()

const parsed = parseRecipes(pages, 'Rezeptbuch.pdf')
const byName = new Map(parsed.map((r) => [r.name, r]))
let issues = 0

// Deliberate deviations: typos in the PDF that the seed corrects on purpose.
const EXPECTED_DIFFS = new Set(['Overnight Oats · tip'])
let expected = 0

for (const seed of seedRecipes) {
  const p = byName.get(seed.name)
  if (!p) { console.log(`MISSING in PDF: ${seed.name}`); issues++; continue }
  const check = (field, a, b) => {
    if (String(a) === String(b)) return
    if (EXPECTED_DIFFS.has(`${seed.name} · ${field}`)) { expected++; return }
    console.log(`${seed.name} · ${field}\n  seed: ${a}\n  pdf : ${b}`)
    issues++
  }
  check('proteinLabel', seed.proteinLabel, p.proteinLabel)
  check('portions', seed.portions, p.portions)
  check('time', seed.time, p.time)
  check('mealPrep', seed.mealPrep, p.mealPrep)
  check('category', seed.category, p.category)
  check('tags', seed.tags.join('|'), p.tags.join('|'))
  check('ingredientCount', seed.ingredients.length, p.ingredients.length)
  check('stepCount', seed.steps.length, p.steps.length)
  seed.ingredients.forEach((ing, i) => check(`ingredient[${i}]`, ing, p.ingredients[i]))
  seed.steps.forEach((s, i) => check(`step[${i}]`, s, p.steps[i]))
  check('tip', seed.tip ?? '', p.tip ?? '')
}
for (const p of parsed) if (!seedRecipes.some((s) => s.name === p.name)) { console.log(`MISSING in seed: ${p.name}`); issues++ }

const note = expected > 0 ? ` (${expected} bewusste Korrektur/en übersprungen)` : ''
console.log(
  issues === 0
    ? `\nOK – alle ${seedRecipes.length} Rezepte identisch zur PDF${note}.`
    : `\n${issues} unerwartete Abweichung(en)${note}.`,
)
process.exit(issues === 0 ? 0 : 1)
