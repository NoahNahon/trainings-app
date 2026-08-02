// Runs the browser recipe parser against a real PDF in Node, so the layout
// heuristics can be checked without clicking through the UI.
//   node --experimental-strip-types scripts/test-parser.mjs <pdf> [--json]
import { readFileSync } from 'node:fs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { parseRecipes } from '../src/lib/recipeParser.ts'
import { groupIntoLines } from './group-lines.mjs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node --experimental-strip-types scripts/test-parser.mjs <pdf> [--json]')
  process.exit(1)
}

const task = getDocument({ data: new Uint8Array(readFileSync(file)), isEvalSupported: false })
const doc = await task.promise
const pages = []
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p)
  pages.push(groupIntoLines((await page.getTextContent()).items))
  page.cleanup()
}
await task.destroy()

const recipes = parseRecipes(pages, file.split('/').pop())

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(recipes, null, 2))
} else {
  console.log(`${recipes.length} Rezepte erkannt\n`)
  for (const r of recipes) {
    console.log(`▸ ${r.name}  [${r.category}]`)
    console.log(`  ${r.proteinLabel} | ${r.portions} | ${r.time} | ${r.mealPrep}`)
    console.log(`  Tags: ${r.tags.join(', ') || '—'}`)
    console.log(`  Zutaten (${r.ingredients.length}): ${r.ingredients.slice(0, 3).join(' / ')}${r.ingredients.length > 3 ? ' …' : ''}`)
    console.log(`  Schritte (${r.steps.length}): ${(r.steps[0] ?? '—').slice(0, 80)}`)
    console.log(`  Tipp: ${(r.tip ?? '—').slice(0, 70)}`)
    console.log()
  }
}
