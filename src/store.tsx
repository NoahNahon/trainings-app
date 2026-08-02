import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, Block, Exercise, Plan, Recipe, Session } from './types'
import { emptyMetrics, normalize, seedData } from './lib/migrate'
import { sportMeta } from './data/sports'
import { todayKey, uid } from './lib/util'

export { emptyMetrics }

const STORAGE_KEY = 'trainings-app:v1'

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedData()
    // A half-written or older payload shouldn't wipe the app.
    return normalize(JSON.parse(raw) as Partial<AppData>)
  } catch {
    return seedData()
  }
}

interface Store {
  data: AppData
  plan: Plan
  setActivePlan: (id: string) => void

  updatePlan: (planId: string, patch: Partial<Omit<Plan, 'id' | 'blocks'>>) => void
  updateBlock: (planId: string, blockId: string, patch: Partial<Omit<Block, 'id' | 'exercises'>>) => void
  addBlock: (planId: string) => void
  removeBlock: (planId: string, blockId: string) => void
  moveBlock: (planId: string, blockId: string, dir: -1 | 1) => void

  updateExercise: (planId: string, blockId: string, exerciseId: string, patch: Partial<Omit<Exercise, 'id'>>) => void
  addExercise: (planId: string, blockId: string) => void
  removeExercise: (planId: string, blockId: string, exerciseId: string) => void
  moveExercise: (planId: string, blockId: string, exerciseId: string, dir: -1 | 1) => void

  updateNote: (planId: string, noteId: string, patch: { label?: string; text?: string }) => void
  addNote: (planId: string) => void
  removeNote: (planId: string, noteId: string) => void

  saveSession: (session: Session) => void
  removeSession: (sessionId: string) => void

  addRecipes: (recipes: Recipe[]) => { added: number; replaced: number }
  updateRecipe: (id: string, patch: Partial<Recipe>) => void
  removeRecipe: (id: string) => void

  exportJson: () => string
  importJson: (json: string) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)

/**
 * Rewrite one plan in place, leaving the rest of the state untouched.
 *
 * Every plan edit goes through here, which is why the `userEdited` flag is set
 * here too — one place instead of a dozen call sites that could forget it.
 */
function mapPlan(data: AppData, planId: string, fn: (plan: Plan) => Plan): AppData {
  return {
    ...data,
    plans: data.plans.map((p) => (p.id === planId ? { ...fn(p), userEdited: true } : p)),
  }
}

function mapBlock(plan: Plan, blockId: string, fn: (block: Block) => Block): Plan {
  return { ...plan, blocks: plan.blocks.map((b) => (b.id === blockId ? fn(b) : b)) }
}

function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (index < 0 || target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)
  // Skip the very first write so a fresh install doesn't persist before the user touches anything.
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.warn('Speichern fehlgeschlagen', err)
    }
  }, [data])

  const plan = useMemo(
    () => data.plans.find((p) => p.id === data.activePlanId) ?? data.plans[0],
    [data.plans, data.activePlanId],
  )

  const setActivePlan = useCallback((id: string) => setData((d) => ({ ...d, activePlanId: id })), [])

  const updatePlan = useCallback<Store['updatePlan']>((planId, patch) => {
    setData((d) => mapPlan(d, planId, (p) => ({ ...p, ...patch })))
  }, [])

  const updateBlock = useCallback<Store['updateBlock']>((planId, blockId, patch) => {
    setData((d) => mapPlan(d, planId, (p) => mapBlock(p, blockId, (b) => ({ ...b, ...patch }))))
  }, [])

  const addBlock = useCallback<Store['addBlock']>((planId) => {
    setData((d) =>
      mapPlan(d, planId, (p) => ({
        ...p,
        blocks: [
          ...p.blocks,
          { id: uid('block'), name: 'Neuer Block', duration: '', color: 'slate', exercises: [] },
        ],
      })),
    )
  }, [])

  const removeBlock = useCallback<Store['removeBlock']>((planId, blockId) => {
    setData((d) => mapPlan(d, planId, (p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== blockId) })))
  }, [])

  const moveBlock = useCallback<Store['moveBlock']>((planId, blockId, dir) => {
    setData((d) =>
      mapPlan(d, planId, (p) => ({
        ...p,
        blocks: move(p.blocks, p.blocks.findIndex((b) => b.id === blockId), dir),
      })),
    )
  }, [])

  const updateExercise = useCallback<Store['updateExercise']>((planId, blockId, exerciseId, patch) => {
    setData((d) =>
      mapPlan(d, planId, (p) =>
        mapBlock(p, blockId, (b) => ({
          ...b,
          exercises: b.exercises.map((e) => (e.id === exerciseId ? { ...e, ...patch } : e)),
        })),
      ),
    )
  }, [])

  const addExercise = useCallback<Store['addExercise']>((planId, blockId) => {
    setData((d) =>
      mapPlan(d, planId, (p) =>
        mapBlock(p, blockId, (b) => ({
          ...b,
          exercises: [
            ...b.exercises,
            {
              id: uid('ex'),
              name: 'Neue Übung',
              sets: 3,
              target: '8–12',
              restSec: 60,
              note: '',
              optional: false,
              hold: false,
            },
          ],
        })),
      ),
    )
  }, [])

  const removeExercise = useCallback<Store['removeExercise']>((planId, blockId, exerciseId) => {
    setData((d) =>
      mapPlan(d, planId, (p) =>
        mapBlock(p, blockId, (b) => ({ ...b, exercises: b.exercises.filter((e) => e.id !== exerciseId) })),
      ),
    )
  }, [])

  const moveExercise = useCallback<Store['moveExercise']>((planId, blockId, exerciseId, dir) => {
    setData((d) =>
      mapPlan(d, planId, (p) =>
        mapBlock(p, blockId, (b) => ({
          ...b,
          exercises: move(b.exercises, b.exercises.findIndex((e) => e.id === exerciseId), dir),
        })),
      ),
    )
  }, [])

  const updateNote = useCallback<Store['updateNote']>((planId, noteId, patch) => {
    setData((d) =>
      mapPlan(d, planId, (p) => ({
        ...p,
        notes: p.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
      })),
    )
  }, [])

  const addNote = useCallback<Store['addNote']>((planId) => {
    setData((d) =>
      mapPlan(d, planId, (p) => ({ ...p, notes: [...p.notes, { id: uid('note'), label: 'Hinweis', text: '' }] })),
    )
  }, [])

  const removeNote = useCallback<Store['removeNote']>((planId, noteId) => {
    setData((d) => mapPlan(d, planId, (p) => ({ ...p, notes: p.notes.filter((n) => n.id !== noteId) })))
  }, [])

  const saveSession = useCallback<Store['saveSession']>((session) => {
    setData((d) => {
      const exists = d.sessions.some((s) => s.id === session.id)
      const sessions = exists
        ? d.sessions.map((s) => (s.id === session.id ? session : s))
        : [session, ...d.sessions]
      sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      return { ...d, sessions }
    })
  }, [])

  const removeSession = useCallback<Store['removeSession']>((sessionId) => {
    setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== sessionId) }))
  }, [])

  // Derived from the current snapshot rather than a setState updater, so the caller
  // gets accurate counts even when React double-invokes updaters in StrictMode.
  const addRecipes = useCallback<Store['addRecipes']>(
    (incoming) => {
      const next = [...data.recipes]
      let added = 0
      let replaced = 0
      for (const recipe of incoming) {
        const at = next.findIndex((r) => r.name.toLowerCase() === recipe.name.toLowerCase())
        if (at >= 0) {
          // keep the original id (favourites reference it) and the favourite flag
          next[at] = { ...recipe, id: next[at].id, favorite: next[at].favorite }
          replaced++
        } else {
          next.push(recipe)
          added++
        }
      }
      setData((d) => ({ ...d, recipes: next }))
      return { added, replaced }
    },
    [data.recipes],
  )

  const updateRecipe = useCallback<Store['updateRecipe']>((id, patch) => {
    setData((d) => ({ ...d, recipes: d.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  }, [])

  const removeRecipe = useCallback<Store['removeRecipe']>((id) => {
    setData((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== id) }))
  }, [])

  const exportJson = useCallback(() => JSON.stringify(data, null, 2), [data])

  const importJson = useCallback<Store['importJson']>((json) => {
    const parsed = JSON.parse(json) as Partial<AppData>
    if (!Array.isArray(parsed.plans) || parsed.plans.length === 0) {
      throw new Error('Datei enthält keine Trainingspläne.')
    }
    // Same path as load(), so an export from an older version imports cleanly.
    setData(normalize(parsed))
  }, [])

  const resetAll = useCallback(() => setData(seedData()), [])

  const value: Store = {
    data,
    plan,
    setActivePlan,
    updatePlan,
    updateBlock,
    addBlock,
    removeBlock,
    moveBlock,
    updateExercise,
    addExercise,
    removeExercise,
    moveExercise,
    updateNote,
    addNote,
    removeNote,
    saveSession,
    removeSession,
    addRecipes,
    updateRecipe,
    removeRecipe,
    exportJson,
    importJson,
    resetAll,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore muss innerhalb von <StoreProvider> verwendet werden.')
  return ctx
}

/** The draft session for a plan, restored from localStorage so a reload mid-workout is safe. */
const DRAFT_KEY = 'trainings-app:draft'

export function loadDraft(): Session | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveDraft(session: Session | null): void {
  try {
    if (session) localStorage.setItem(DRAFT_KEY, JSON.stringify(session))
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* quota / private mode — the in-memory session still works */
  }
}

export function newSession(plan: Plan): Session {
  const sport = plan.sport ?? 'calisthenics'
  const fixed = sportMeta(sport).fixedDurationMin ?? null
  return {
    id: uid('session'),
    planId: plan.id,
    planName: plan.name,
    sport,
    date: todayKey(),
    startedAt: new Date().toISOString(),
    entries: {},
    note: '',
    // Fixed-length sports (the yoga class) get their duration filled in, so the
    // history shows it without asking a question that has one answer.
    metrics: { ...emptyMetrics(), durationMin: fixed },
    sends: [],
  }
}
