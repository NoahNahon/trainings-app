/** Colour keys for training blocks — mirrors the colour bar in Phase1_Trainingsplan_v3.pdf. */
export type BlockColor = 'gray' | 'red' | 'blue' | 'purple' | 'green' | 'amber' | 'slate'

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
}

/** One logged set. `value` is reps or seconds, depending on Exercise.hold. */
export interface LoggedSet {
  done: boolean
  value: string
}

export interface SessionEntry {
  sets: LoggedSet[]
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
