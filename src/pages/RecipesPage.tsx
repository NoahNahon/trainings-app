import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Recipe } from '../types'
import { Button, Chip, Empty, Icon, Sheet } from '../components/ui'
import { clsx, plural } from '../lib/util'

const TAG_STYLES: Record<string, string> = {
  Krafttag: 'bg-red-500/15 text-red-300',
  Ausdauertag: 'bg-blue-500/15 text-blue-300',
  Erholungstag: 'bg-emerald-500/15 text-emerald-300',
  'Alle Tage': 'bg-slate-700/40 text-slate-300',
  '+Proteinboost': 'bg-amber-500/15 text-amber-300',
  'Zone-2-Tag': 'bg-purple-500/15 text-purple-300',
}

function tagStyle(tag: string): string {
  return TAG_STYLES[tag] ?? 'bg-slate-800 text-slate-400'
}

type Sort = 'name' | 'protein' | 'time'

export function RecipesPage() {
  const { data } = useStore()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('name')
  const [favOnly, setFavOnly] = useState(false)
  const [open, setOpen] = useState<Recipe | null>(null)

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of data.recipes) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)
  }, [data.recipes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = data.recipes.filter((r) => {
      if (favOnly && !r.favorite) return false
      if (tag && !r.tags.includes(tag)) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q)) ||
        r.category.toLowerCase().includes(q)
      )
    })
    const byName = (a: Recipe, b: Recipe) => a.name.localeCompare(b.name, 'de')
    if (sort === 'protein') return [...list].sort((a, b) => b.proteinG - a.proteinG || byName(a, b))
    if (sort === 'time') return [...list].sort((a, b) => minutesOf(a.time) - minutesOf(b.time) || byName(a, b))
    return [...list].sort(byName)
  }, [data.recipes, query, tag, sort, favOnly])

  // Keep the open sheet in sync with the store (favourite toggling re-creates the object).
  const openRecipe = open ? (data.recipes.find((r) => r.id === open.id) ?? null) : null

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-50">Rezepte</h1>
          <span className="shrink-0 text-xs text-slate-500">{plural(data.recipes.length, 'Gericht', 'Gerichte')}</span>
        </div>

        <div className="relative">
          <Icon name="search" className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="field pl-9"
            type="search"
            placeholder="Rezept oder Zutat suchen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          <FilterPill active={tag === null && !favOnly} onClick={() => { setTag(null); setFavOnly(false) }}>
            Alle
          </FilterPill>
          <FilterPill active={favOnly} onClick={() => { setFavOnly((v) => !v); setTag(null) }}>
            ★ Favoriten
          </FilterPill>
          {allTags.map((t) => (
            <FilterPill key={t} active={tag === t} onClick={() => { setTag(tag === t ? null : t); setFavOnly(false) }}>
              {t}
            </FilterPill>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Sortieren:</span>
          {(
            [
              ['name', 'A–Z'],
              ['protein', 'Protein'],
              ['time', 'Zeit'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              className={clsx(
                'rounded-md px-2 py-1 transition-colors',
                sort === value ? 'bg-slate-800 text-slate-100' : 'hover:text-slate-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <Empty title="Keine Rezepte gefunden" hint="Suche anpassen oder Filter zurücksetzen." />
      ) : (
        <ul className="space-y-2">
          {filtered.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} onOpen={() => setOpen(recipe)} />
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={openRecipe !== null}
        onClose={() => setOpen(null)}
        title={
          openRecipe && (
            <>
              <h2 className="pr-2 text-base leading-snug font-bold text-slate-50">{openRecipe.name}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {openRecipe.category} · {openRecipe.source}
              </p>
            </>
          )
        }
      >
        {openRecipe && <RecipeDetail recipe={openRecipe} />}
      </Sheet>
    </div>
  )
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
        active
          ? 'border-orange-500 bg-orange-500/15 text-orange-300'
          : 'border-slate-700 text-slate-400 hover:text-slate-200',
      )}
    >
      {children}
    </button>
  )
}

function RecipeCard({ recipe, onOpen }: { recipe: Recipe; onOpen: () => void }) {
  const { updateRecipe } = useStore()
  return (
    <div className="card overflow-hidden transition-colors hover:border-slate-700">
      <div className="flex items-start gap-3 p-4">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <h3 className="text-sm leading-snug font-semibold text-slate-100">{recipe.name}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {recipe.portions} · {recipe.time} · {recipe.mealPrep}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <Chip key={t} className={tagStyle(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-lg bg-orange-500/15 px-2 py-1 text-sm font-bold tabular-nums text-orange-300">
            {recipe.proteinLabel}
          </span>
          <button
            type="button"
            aria-label={recipe.favorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
            onClick={() => updateRecipe(recipe.id, { favorite: !recipe.favorite })}
            className={clsx(
              'rounded-lg p-1.5 transition-colors',
              recipe.favorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400',
            )}
          >
            <Icon name="star" className={clsx('h-4 w-4', recipe.favorite && 'fill-amber-400')} />
          </button>
        </div>
      </div>
    </div>
  )
}

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const { updateRecipe, removeRecipe } = useStore()
  const [checked, setChecked] = useState<Set<number>>(new Set())

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat value={recipe.proteinLabel} label="Protein / P." highlight />
        <Stat value={recipe.portions.replace(' Portionen', '').replace(' Portion', '')} label="Portionen" />
        <Stat value={recipe.time} label="Zeit" />
        <Stat value={recipe.mealPrep} label="Meal Prep" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {recipe.tags.map((t) => (
          <Chip key={t} className={tagStyle(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">
          Zutaten
          <span className="ml-2 font-normal normal-case tracking-normal text-slate-600">antippen zum Abhaken</span>
        </h3>
        <ul className="space-y-1">
          {recipe.ingredients.map((item, i) => {
            const isChecked = checked.has(i)
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() =>
                    setChecked((prev) => {
                      const next = new Set(prev)
                      if (next.has(i)) next.delete(i)
                      else next.add(i)
                      return next
                    })
                  }
                  className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1.5 text-left hover:bg-slate-800/50"
                >
                  <span
                    className={clsx(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      isChecked ? 'border-emerald-500 bg-emerald-500/25 text-emerald-400' : 'border-slate-600',
                    )}
                  >
                    {isChecked && <Icon name="check" className="h-3 w-3" />}
                  </span>
                  <span className={clsx('text-sm leading-snug', isChecked ? 'text-slate-500 line-through' : 'text-slate-200')}>
                    {item}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">Zubereitung</h3>
        <ol className="space-y-2.5">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-orange-400">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-slate-200">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {recipe.tip && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
          <p className="text-[11px] font-semibold tracking-wide text-amber-400 uppercase">Tipp</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{recipe.tip}</p>
        </div>
      )}

      <div className="flex gap-2 border-t border-slate-800 pt-3">
        <Button
          variant={recipe.favorite ? 'primary' : 'secondary'}
          className="flex-1"
          onClick={() => updateRecipe(recipe.id, { favorite: !recipe.favorite })}
        >
          <Icon name="star" className={clsx('h-4 w-4', recipe.favorite && 'fill-current')} />
          {recipe.favorite ? 'Favorit' : 'Zu Favoriten'}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm(`"${recipe.name}" löschen?`)) removeRecipe(recipe.id)
          }}
        >
          <Icon name="trash" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className={clsx('rounded-xl px-1 py-2', highlight ? 'bg-orange-500/15' : 'bg-slate-800/60')}>
      <p className={clsx('text-xs leading-tight font-bold', highlight ? 'text-orange-300' : 'text-slate-100')}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{label}</p>
    </div>
  )
}

/** Best-effort minutes from strings like "45–60 Min." or "25 Min. + marinieren".
 *  Takes the lower bound, so sorting by time surfaces the quickest option first. */
function minutesOf(time: string): number {
  const first = time.match(/\d+/)
  return first ? Number(first[0]) : 999
}
