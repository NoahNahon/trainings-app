// Explizite .ts-Endungen, damit scripts/test-migration.mjs dieses Modul direkt
// in Node laden kann (Node loest erweiterungslose relative Pfade nicht auf).
// tsconfig hat dafuer allowImportingTsExtensions gesetzt, wie bei verify-seed.
import { seedPlans } from '../data/plans.ts'
import { seedRecipes } from '../data/recipes.ts'
import type { AppData, Plan, SessionMetrics } from '../types.ts'

export const DATA_VERSION = 2

export function seedData(): AppData {
  return {
    version: DATA_VERSION,
    // `userEdited: false` is written explicitly rather than left undefined:
    // "known untouched" and "don't know" must stay distinguishable, because only
    // the first allows overwriting on update. See normalize().
    plans: structuredClone(seedPlans).map((p) => ({ ...p, userEdited: false })),
    activePlanId: seedPlans[0].id,
    sessions: [],
    recipes: structuredClone(seedRecipes),
  }
}

export function emptyMetrics(): SessionMetrics {
  return { distanceM: null, durationMin: null, laps: null, avgHr: null, waterL: null, stroke: '', rpe: null }
}

/**
 * Bring any stored payload up to the current shape.
 *
 * Lives in its own module so `scripts/test-migration.mjs` can exercise it in
 * Node — this code decides whether a phone full of logged sessions survives an
 * update, which is not something to verify by hand.
 *
 * The important part is the plan merge. A v1 payload contains only the two
 * calisthenics plans, and loading prefers stored plans over seeds — so without
 * merging, the five new sports would never appear on a device that already has
 * data. Seed plans missing by id are added; plans that exist are kept exactly as
 * the user edited them and only gain a `sport` if it was absent.
 */
export function normalize(parsed: Partial<AppData>): AppData {
  const fresh = seedData()
  const stored = Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : fresh.plans
  const storedById = new Map(stored.map((p) => [p.id, p]))

  const plans: Plan[] = [
    // Seed order defines the order of the sport picker.
    ...fresh.plans.map((seed) => {
      const own = storedById.get(seed.id)
      if (!own) return seed
      // Refresh only a plan that is *known* to be untouched, so corrections to
      // the built-in plans (a wrong unit, a better exercise) reach an installed
      // app instead of being frozen in localStorage forever.
      //
      // `userEdited === undefined` means the payload predates the flag, and an
      // edit back then left no trace. Treated as edited on purpose: silently
      // overwriting someone's reworked plan is far worse than carrying an
      // outdated one, which they can still fix by hand.
      if (own.userEdited === false) return seed
      return { ...own, sport: own.sport ?? seed.sport }
    }),
    // Anything the user created themselves keeps existing, appended at the end.
    ...stored
      .filter((p) => !fresh.plans.some((s) => s.id === p.id))
      .map((p) => ({ ...p, sport: p.sport ?? ('calisthenics' as const) })),
  ]

  const sportOfPlan = new Map(plans.map((p) => [p.id, p.sport]))
  const sessions = (Array.isArray(parsed.sessions) ? parsed.sessions : []).map((s) => ({
    ...s,
    sport: s.sport ?? sportOfPlan.get(s.planId) ?? ('calisthenics' as const),
  }))

  const activePlanId = plans.some((p) => p.id === parsed.activePlanId)
    ? (parsed.activePlanId as string)
    : fresh.activePlanId

  return {
    version: DATA_VERSION,
    plans,
    activePlanId,
    sessions,
    recipes: Array.isArray(parsed.recipes) && parsed.recipes.length > 0 ? parsed.recipes : fresh.recipes,
  }
}
