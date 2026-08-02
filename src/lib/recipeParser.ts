import type { Recipe } from '../types'

/** One text line from a PDF page, with its left edge — the layout is two-column. */
export interface Line {
  text: string
  x: number
  y: number
}

const KNOWN_TAGS = ['Krafttag', 'Ausdauertag', 'Erholungstag', 'Alle Tage', '+Proteinboost', 'Zone-2-Tag']

/** Headings in Rezeptbuch.pdf that are chapters, not recipes. */
const SECTION_HEADINGS = new Set([
  'Mein Rezeptbuch',
  'Protein-Leitfaden',
  'Bausteine für deinen Tag',
  'Alle Rezepte',
  'Asiatische Küche',
  'Schnelle Proteinbooster',
])

const METRIC_LABELS = new Set(['Protein / P.', 'Protein', 'Portionen', 'Zubereitung', 'Meal Prep', 'Zutaten'])

const PROTEIN_RE = /^~\s*\d+\s*g$/
const STEP_RE = /^\d+\.\s/

/**
 * Parses recipe cards out of extracted lines.
 *
 * A card in Rezeptbuch.pdf is laid out as:
 *   <Name>
 *   ~45g · Protein / P. · 3–4 Portionen · Portionen · 20 Min. · Zubereitung · 4 Tage · Meal Prep
 *   <tags>
 *   Zutaten              Zubereitung
 *   • …                  1. …
 *   Tipp …
 *
 * The metric labels sit *below* their values, so we key off value shapes
 * (`~45g`, `3 Portionen`, `20 Min.`) rather than the labels.
 */
export function parseRecipes(pages: Line[][], sourceName: string): Recipe[] {
  const recipes: Recipe[] = []
  let category = 'Alle Rezepte'

  for (const lines of pages) {
    const texts = lines.map((l) => l.text)

    // A chapter heading on this page changes the category for the cards that follow.
    const heading = texts.find((t) => SECTION_HEADINGS.has(t) && t !== 'Alle Rezepte' && t !== 'Mein Rezeptbuch')
    if (heading === 'Asiatische Küche') category = 'Asiatische Küche'

    // Every standalone protein value marks one card.
    const proteinLines = texts.map((t, i) => (PROTEIN_RE.test(t) ? i : -1)).filter((i) => i >= 0)

    for (const [n, proteinAt] of proteinLines.entries()) {
      const nameAt = findNameAbove(texts, proteinAt)
      if (nameAt === null) continue
      const nextAt = proteinLines[n + 1]
      const end = nextAt === undefined ? lines.length : (findNameAbove(texts, nextAt) ?? nextAt)
      const recipe = parseCard(lines.slice(nameAt, end), category, sourceName)
      if (recipe) recipes.push(recipe)
    }
  }

  return dedupe(recipes)
}

/** The recipe name is the nearest plausible line above the protein value. */
function findNameAbove(texts: string[], proteinAt: number): number | null {
  for (let i = proteinAt - 1; i >= 0 && i >= proteinAt - 4; i--) {
    const t = texts[i]
    if (!t || SECTION_HEADINGS.has(t) || METRIC_LABELS.has(t)) continue
    if (STEP_RE.test(t) || t.startsWith('•') || /^Tipp\b/.test(t)) continue
    return i
  }
  return null
}

function parseCard(lines: Line[], category: string, sourceName: string): Recipe | null {
  const texts = lines.map((l) => l.text)
  const name = texts[0]
  if (!name || name.length < 3) return null

  const ingredientsAt = texts.findIndex((t) => t === 'Zutaten')

  // Metrics and tags all live above the "Zutaten" heading. Restricting the
  // search there keeps phrases like "An Krafttagen: …" in a tip from being
  // mistaken for a Krafttag tag.
  const header = unwrapHeader(texts.slice(0, ingredientsAt >= 0 ? ingredientsAt : texts.length))

  const proteinLabel = (header.find((t) => PROTEIN_RE.test(t)) ?? '').replace(/\s+/g, '')
  const proteinG = Number(proteinLabel.match(/\d+/)?.[0] ?? 0)

  const portions = header.find((t) => /\d.*\bPortion(?:en)?$/.test(t)) ?? ''
  const time = header.find((t) => /\d\s*Min\.?/.test(t) && !STEP_RE.test(t)) ?? ''
  const mealPrep =
    header.find(
      (t) =>
        t !== time &&
        t !== portions &&
        (/^(Frisch|Einfrierbar|Dressing)/.test(t) || (/\bTage?\b/.test(t) && !t.startsWith('Alle Tage'))),
    ) ?? ''

  const tags = KNOWN_TAGS.filter((tag) => header.some((t) => t === tag || t.includes(tag)))
  const firstStepAt = texts.findIndex((t) => STEP_RE.test(t))
  const tipAt = texts.findIndex((t) => /^Tipp\b/.test(t))
  const bodyEnd = tipAt >= 0 ? tipAt : lines.length

  // Column boundary: derive it from where the numbered steps actually start,
  // so this survives a different page size or margin.
  const stepX = firstStepAt >= 0 ? lines[firstStepAt].x : Infinity

  const ingredients: string[] = []
  const steps: string[] = []

  for (let i = 1; i < bodyEnd; i++) {
    const { text, x } = lines[i]
    if (text === 'Zutaten' || text === 'Zubereitung' || METRIC_LABELS.has(text)) continue

    if (text.startsWith('•')) {
      ingredients.push(text.replace(/^•\s*/, '').trim())
      continue
    }
    if (STEP_RE.test(text)) {
      steps.push(text.replace(STEP_RE, '').trim())
      continue
    }
    // Unmarked line: a wrapped continuation of whichever column it sits in.
    const inStepColumn = x >= stepX - 10
    if (inStepColumn && steps.length > 0) {
      steps[steps.length - 1] += ` ${text}`
    } else if (!inStepColumn && ingredients.length > 0 && i > ingredientsAt) {
      ingredients[ingredients.length - 1] += ` ${text}`
    }
  }

  const tip = tipAt >= 0 ? texts.slice(tipAt).join(' ').replace(/^Tipp\s*/, '').replace(/\s+/g, ' ').trim() : ''

  // No ingredients and no steps means this was a table row, not a recipe card.
  if (ingredients.length === 0 && steps.length === 0) return null

  return {
    // Deterministic id from the name: re-importing the same PDF updates rather
    // than duplicates, and the id stays readable in exported JSON.
    id: slug(name),
    name,
    category,
    proteinG,
    proteinLabel,
    portions,
    time,
    mealPrep,
    tags,
    ingredients,
    steps,
    tip: tip || undefined,
    source: sourceName,
  }
}

/**
 * The metric row is narrow, so long values wrap: "25 Min. +" / "marinieren",
 * "2 Tage (Zutaten" / "getrennt)". Fold those continuations back together.
 */
function unwrapHeader(texts: string[]): string[] {
  const out: string[] = []
  for (const text of texts) {
    const prev = out[out.length - 1]
    if (prev !== undefined && isWrapped(prev) && !METRIC_LABELS.has(text)) {
      out[out.length - 1] = `${prev} ${text}`
    } else {
      out.push(text)
    }
  }
  return out
}

function isWrapped(text: string): boolean {
  if (/[+–-]$/.test(text)) return true
  const opens = (text.match(/\(/g) ?? []).length
  const closes = (text.match(/\)/g) ?? []).length
  return opens > closes
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'rezept'
  )
}

function dedupe(recipes: Recipe[]): Recipe[] {
  const seen = new Set<string>()
  return recipes.filter((r) => {
    const key = r.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
