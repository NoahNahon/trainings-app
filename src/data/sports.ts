import type { BlockColor, Sport } from '../types'

/** Which whole-session fields a sport asks for. Drives the workout form. */
export type MetricKey = 'distanceM' | 'durationMin' | 'laps' | 'avgHr' | 'waterL' | 'stroke' | 'rpe'

export interface SportMeta {
  id: Sport
  name: string
  /** Character of the day, taken from Teil 1 of the plan. */
  role: string
  color: BlockColor
  /** 0 = Sunday, matching Date.getDay(). */
  weekdays: number[]
  /** Whole-session fields, in the order they appear in the form. */
  metrics: MetricKey[]
  /** Bouldern logs individual problems instead of only sets. */
  sends?: boolean
  /**
   * Session length that never varies, in minutes.
   *
   * Set for the yoga class: it's always 60, so the duration is filled in
   * automatically and the field is left out of the form entirely.
   */
  fixedDurationMin?: number
}

/**
 * The week from Sport_und_Ernaehrungsplan_DE_v2.pdf, Teil 1.
 *
 * Note the PDF contradicts itself twice: Teil 2 lists swimming as "Di / Fr" and
 * Teil 7 mentions a "Boulder + Sauna Tag (Di/Sa)". Teil 1, the summary table and
 * the meal plan all agree on Mo/Fr swimming and Mi/Sa bouldering, so that is
 * what's encoded here.
 */
export const SPORTS: SportMeta[] = [
  {
    id: 'calisthenics',
    name: 'Calisthenics',
    role: 'Haupttag – Kraft',
    color: 'red',
    weekdays: [3, 6],
    metrics: ['durationMin', 'rpe'],
  },
  {
    id: 'bouldern',
    name: 'Bouldern',
    role: 'Haupttag – Technik',
    color: 'purple',
    weekdays: [3, 6],
    metrics: ['durationMin', 'rpe'],
    sends: true,
  },
  {
    id: 'schwimmen',
    name: 'Schwimmen',
    role: 'Aktive Erholung',
    color: 'blue',
    weekdays: [1, 5],
    metrics: ['laps', 'distanceM', 'durationMin', 'stroke', 'rpe'],
  },
  {
    id: 'laufen',
    name: 'Zone 2 Laufen',
    role: 'Leichter Wochenabschluss',
    color: 'green',
    weekdays: [0],
    metrics: ['distanceM', 'durationMin', 'avgHr', 'rpe'],
  },
  {
    id: 'sauna',
    name: 'Sauna',
    role: 'Erholung & Regeneration',
    color: 'amber',
    weekdays: [2, 4, 0],
    metrics: ['durationMin', 'waterL'],
  },
  {
    id: 'yoga',
    // Fixed 60-minute class: nothing to measure, so there are no metric fields
    // and the single "exercise" is a checkbox.
    name: 'Yin Yoga',
    role: 'Erholungstag – fixer Kurs',
    color: 'slate',
    weekdays: [4],
    metrics: [],
    fixedDurationMin: 60,
  },
]

export function sportMeta(sport: Sport): SportMeta {
  // Never undefined in practice; the fallback keeps a corrupted payload renderable.
  return SPORTS.find((s) => s.id === sport) ?? SPORTS[0]
}

export interface MetricSpec {
  label: string
  unit: string
  /** How the number is entered — metres are typed as km for running. */
  kind: 'number' | 'decimal' | 'text'
  hint?: string
}

export const METRIC_SPECS: Record<MetricKey, MetricSpec> = {
  distanceM: { label: 'Distanz', unit: 'm', kind: 'number' },
  durationMin: { label: 'Dauer', unit: 'Min.', kind: 'number' },
  laps: { label: 'Bahnen', unit: '', kind: 'number' },
  avgHr: { label: 'Ø-Puls', unit: 'bpm', kind: 'number', hint: 'Von der Apple Watch ablesen' },
  waterL: { label: 'Getrunken', unit: 'L', kind: 'decimal', hint: '0,5–1 L pro Saunagang' },
  stroke: { label: 'Hauptstil', unit: '', kind: 'text' },
  rpe: { label: 'Anstrengung', unit: '/10', kind: 'number', hint: '1 = sehr leicht, 10 = maximal' },
}

/** Running is entered in kilometres but stored in metres, like every other distance. */
export const RUN_DISTANCE_SPEC: MetricSpec = { label: 'Distanz', unit: 'km', kind: 'decimal' }

export const STROKES = ['Brust', 'Kraul', 'Rücken', 'Technik', 'Gemischt']

/** The gym's own scale: 1 = easiest, 8 = hardest. */
export const BOULDER_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8]
