/** Colour keys for training blocks — mirrors the colour bar in Phase1_Trainingsplan_v3.pdf. */
export type BlockColor = 'gray' | 'red' | 'blue' | 'purple' | 'green' | 'amber' | 'slate'

/** The six activities in Sport_und_Ernaehrungsplan_DE_v2.pdf, Teil 1. */
export type Sport = 'calisthenics' | 'bouldern' | 'schwimmen' | 'laufen' | 'sauna' | 'yoga'

/**
 * What a single logged value means.
 *
 * Left optional on purpose: the two calisthenics plans predate it and derive
 * their unit from `hold`. Use `setMetric()` in lib/util rather than reading
 * this field directly, so both shapes stay supported.
 */
export type SetMetric = 'reps' | 'seconds' | 'meters' | 'minutes' | 'check'

export interface Exercise {
  id: string
  name: string
  /** hybridcalisthenics.com tutorial, if the plan lists one */
  link?: string
  /** How many sets to log. 0 = untracked (warm-up / cool-down). */
  sets: number
  /** Target per set as written in the plan: "8–10", "20 Sek.", "10× je Seite". */
  target: string
  /** Rest between sets in seconds; null = no rest listed. */
  restSec: number | null
  note: string
  /** Greyed out in the PDF: only if there's time. */
  optional: boolean
  /** Whether a set is a hold (seconds) rather than reps — drives the timer. */
  hold: boolean
  /** Overrides the unit derived from `hold`. Needed for metres and minutes. */
  metric?: SetMetric
}

export interface Block {
  id: string
  name: string
  /** e.g. "ca. 13 Min." */
  duration: string
  color: BlockColor
  exercises: Exercise[]
}

export interface PlanNote {
  id: string
  label: string
  text: string
}

export interface Plan {
  id: string
  name: string
  subtitle: string
  /** Weekdays this plan runs on, for the "next session" hint. 0 = Sunday. */
  weekdays: number[]
  blocks: Block[]
  notes: PlanNote[]
  /** Optional so v1 payloads load; the store fills it in on migration. */
  sport?: Sport
  /**
   * Set the first time the user changes anything about this plan.
   *
   * Decides who wins on update: an edited plan is never overwritten, an
   * untouched one gets refreshed from the seed so corrections to the built-in
   * plans actually arrive. Without this, a plan saved once to localStorage would
   * be frozen forever.
   */
  userEdited?: boolean
}

/** One logged set. `value` is reps, seconds, metres or minutes — see `setMetric()`. */
export interface LoggedSet {
  done: boolean
  value: string
}

export interface SessionEntry {
  sets: LoggedSet[]
  note: string
}

/**
 * Whole-session numbers that don't fit the set model.
 *
 * Every field is nullable rather than optional, so the workout form can bind
 * to them without guarding each one. Which fields are shown is decided per
 * sport in `SPORT_METRICS`.
 */
export interface SessionMetrics {
  /** Metres. Running is entered in km and converted, so one field covers both. */
  distanceM: number | null
  durationMin: number | null
  /** Schwimmen: number of laps. */
  laps: number | null
  /** Laufen: average heart rate, read off the watch. */
  avgHr: number | null
  /** Sauna: litres drunk — the PDF budgets 0.5–1 L per round. */
  waterL: number | null
  /** Schwimmen: main stroke of the session. */
  stroke: string
  /** Perceived effort, 1–10. */
  rpe: number | null
}

/** One boulder problem. `level` is the gym's own 1–8 scale, 1 = easiest. */
export interface BoulderSend {
  id: string
  level: number
  attempts: number
  /**
   * Sent on the first attempt. Derived from `sent && attempts === 1` whenever
   * either changes, never toggled directly — a "flash" with three attempts
   * would be a contradiction the UI shouldn't be able to produce. Stored rather
   * than recomputed so history queries stay simple.
   */
  flash: boolean
  /** Topped out, as opposed to attempted and given up. */
  sent: boolean
  note: string
}

export interface Session {
  id: string
  planId: string
  planName: string
  /** ISO date, local day: YYYY-MM-DD */
  date: string
  startedAt: string
  finishedAt?: string
  /** keyed by Exercise.id */
  entries: Record<string, SessionEntry>
  note: string
  /** Optional so v1 payloads load; the store fills it in on migration. */
  sport?: Sport
  metrics?: SessionMetrics
  /** Bouldern only. */
  sends?: BoulderSend[]
}

export type RecipeTag =
  | 'Krafttag'
  | 'Ausdauertag'
  | 'Erholungstag'
  | 'Alle Tage'
  | '+Proteinboost'
  | 'Zone-2-Tag'

export interface Recipe {
  id: string
  name: string
  /** Chapter heading it appeared under, e.g. "Asiatische Küche". */
  category: string
  /** Protein per portion in grams, as a number for sorting/filtering. */
  proteinG: number
  /** As printed: "~45g" */
  proteinLabel: string
  portions: string
  time: string
  mealPrep: string
  tags: string[]
  ingredients: string[]
  steps: string[]
  tip?: string
  /** Where it came from: "Rezeptbuch.pdf" or "manuell". */
  source: string
  favorite?: boolean
}

export interface DayType {
  name: string
  activity: string
  proteinTarget: string
  recommendation: string
}

export interface MealOption {
  meal: string
  option: string
  protein: string
  note: string
}

export interface Booster {
  name: string
  protein: string
  when: string
}

export interface AppData {
  version: number
  plans: Plan[]
  activePlanId: string
  sessions: Session[]
  recipes: Recipe[]
}
