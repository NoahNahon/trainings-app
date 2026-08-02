// Mirror of groupIntoLines() from src/lib/pdfImport.ts, without the Vite-only
// `?worker` import so the parser test can run in plain Node.
export function groupIntoLines(items) {
  const lines = []
  let current = null

  const flush = () => {
    if (!current) return
    const text = current.parts.join('').replace(/\s+/g, ' ').trim()
    if (text) lines.push({ text, x: current.x, y: current.y })
  }

  for (const item of items) {
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
