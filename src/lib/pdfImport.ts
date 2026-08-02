import * as pdfjs from 'pdfjs-dist'
// Bundled as a worker chunk, so the import also works offline and without a CDN.
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import type { Recipe } from '../types'
import { type Line, parseRecipes } from './recipeParser'

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()

/**
 * Extracts lines per page. pdf.js hands back positioned glyph runs; runs that
 * share a baseline are one line, and we keep the left edge for column detection.
 */
export async function extractPages(file: File): Promise<Line[][]> {
  const buffer = await file.arrayBuffer()
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) })
  const pages: Line[][] = []

  try {
    const doc = await task.promise
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      pages.push(groupIntoLines(content.items))
      page.cleanup()
    }
  } finally {
    // Frees the worker's copy of the file — without this, importing several
    // PDFs in a row keeps every one of them in memory.
    await task.destroy()
  }

  return pages
}

type TextItem = { str?: string; transform?: number[] }

export function groupIntoLines(items: readonly unknown[]): Line[] {
  const lines: Line[] = []
  let current: { parts: string[]; x: number; y: number } | null = null

  const flush = () => {
    if (!current) return
    const text = current.parts.join('').replace(/\s+/g, ' ').trim()
    if (text) lines.push({ text, x: current.x, y: current.y })
  }

  for (const raw of items) {
    const item = raw as TextItem
    if (typeof item.str !== 'string' || !item.transform) continue
    const x = Math.round(item.transform[4])
    const y = Math.round(item.transform[5])
    if (current && Math.abs(y - current.y) <= 2) {
      current.parts.push(item.str)
      current.x = Math.min(current.x, x)
    } else {
      flush()
      current = { parts: [item.str], x, y }
    }
  }
  flush()
  return lines
}

export async function importRecipesFromPdf(file: File): Promise<{ recipes: Recipe[]; text: string }> {
  const pages = await extractPages(file)
  return {
    recipes: parseRecipes(pages, file.name),
    text: pages.map((lines, i) => `— Seite ${i + 1} —\n${lines.map((l) => l.text).join('\n')}`).join('\n\n'),
  }
}
