import { useRef, useState } from 'react'
import { useStore } from '../store'
import type { Recipe } from '../types'
import { Button, Chip, Icon, SectionTitle } from '../components/ui'
import { clsx, plural } from '../lib/util'

type State =
  | { phase: 'idle' }
  | { phase: 'reading'; fileName: string }
  | { phase: 'preview'; fileName: string; recipes: Recipe[]; text: string; selected: Set<string> }
  | { phase: 'error'; message: string }

export function ImportPanel() {
  const { addRecipes, data } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>({ phase: 'idle' })
  const [result, setResult] = useState<string | null>(null)
  const [showText, setShowText] = useState(false)

  async function handleFile(file: File) {
    setResult(null)
    setShowText(false)
    setState({ phase: 'reading', fileName: file.name })
    try {
      // Loaded lazily so pdf.js (~1 MB) isn't in the initial bundle.
      const { importRecipesFromPdf } = await import('../lib/pdfImport')
      const { recipes, text } = await importRecipesFromPdf(file)
      setState({
        phase: 'preview',
        fileName: file.name,
        recipes,
        text,
        selected: new Set(recipes.map((r) => r.id)),
      })
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'PDF konnte nicht gelesen werden.' })
    }
  }

  function confirmImport() {
    if (state.phase !== 'preview') return
    const chosen = state.recipes.filter((r) => state.selected.has(r.id))
    if (chosen.length === 0) return
    const { added, replaced } = addRecipes(chosen)
    setResult(
      [added > 0 && `${added} neu`, replaced > 0 && `${replaced} aktualisiert`].filter(Boolean).join(' · ') ||
        'Keine Änderung',
    )
    setState({ phase: 'idle' })
  }

  return (
    <section className="space-y-3">
      <SectionTitle>Rezepte aus PDF einlesen</SectionTitle>

      <div className="card space-y-3 p-4">
        <p className="text-xs leading-relaxed text-slate-400">
          Wähle eine PDF im Format deines Rezeptbuchs – Name, Protein, Portionen, Zutaten und Zubereitung werden
          automatisch erkannt. Bereits vorhandene Rezepte werden anhand des Namens aktualisiert, nicht doppelt
          angelegt.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
        />

        <Button
          variant="primary"
          className="w-full"
          disabled={state.phase === 'reading'}
          onClick={() => inputRef.current?.click()}
        >
          <Icon name="upload" className="h-4 w-4" />
          {state.phase === 'reading' ? `Lese ${state.fileName}…` : 'PDF auswählen'}
        </Button>

        {result && (
          <p className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-3 py-2 text-xs text-emerald-300">
            Import fertig: {result}. Insgesamt {data.recipes.length} Rezepte.
          </p>
        )}

        {state.phase === 'error' && (
          <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs text-red-300">
            {state.message}
          </p>
        )}
      </div>

      {state.phase === 'preview' && (
        <div className="card space-y-3 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-100">{state.fileName}</h3>
            <Chip className={state.recipes.length > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}>
              {state.recipes.length} erkannt
            </Chip>
          </div>

          {state.recipes.length === 0 ? (
            <>
              <p className="text-xs leading-relaxed text-slate-400">
                In dieser PDF wurden keine Rezeptkarten gefunden – sie nutzt wahrscheinlich ein anderes Layout (z.B.
                Fließtext statt Karten mit Protein-Angabe). Der erkannte Text steht unten, du kannst daraus manuell
                Rezepte anlegen.
              </p>
              <Button size="sm" variant="secondary" onClick={() => setShowText((v) => !v)}>
                {showText ? 'Text ausblenden' : 'Erkannten Text anzeigen'}
              </Button>
              {showText && (
                <pre className="max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-slate-400">
                  {state.text}
                </pre>
              )}
            </>
          ) : (
            <>
              <ul className="divide-y divide-slate-800">
                {state.recipes.map((recipe) => {
                  const known = data.recipes.some((r) => r.name.toLowerCase() === recipe.name.toLowerCase())
                  const checked = state.selected.has(recipe.id)
                  return (
                    <li key={recipe.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => {
                            if (prev.phase !== 'preview') return prev
                            const selected = new Set(prev.selected)
                            if (selected.has(recipe.id)) selected.delete(recipe.id)
                            else selected.add(recipe.id)
                            return { ...prev, selected }
                          })
                        }
                        className="flex w-full items-start gap-3 py-2.5 text-left"
                      >
                        <span
                          className={clsx(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            checked ? 'border-orange-500 bg-orange-500/25 text-orange-400' : 'border-slate-600',
                          )}
                        >
                          {checked && <Icon name="check" className="h-3 w-3" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-slate-100">{recipe.name}</span>
                          <span className="block text-[11px] text-slate-500">
                            {recipe.proteinLabel} · {plural(recipe.ingredients.length, 'Zutat', 'Zutaten')} ·{' '}
                            {plural(recipe.steps.length, 'Schritt', 'Schritte')}
                            {known && ' · aktualisiert bestehendes Rezept'}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="flex gap-2">
                <Button variant="primary" className="flex-1" onClick={confirmImport} disabled={state.selected.size === 0}>
                  <Icon name="check" className="h-4 w-4" />
                  {state.selected.size} übernehmen
                </Button>
                <Button variant="ghost" onClick={() => setState({ phase: 'idle' })}>
                  Abbrechen
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
