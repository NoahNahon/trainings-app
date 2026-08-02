export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

/** Local YYYY-MM-DD — never use toISOString(), that shifts across midnight in CEST. */
export function todayKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export function weekdayName(i: number): string {
  return WEEKDAYS[i] ?? '—'
}

export function formatDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d)
  return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatShortDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Days until the next occurrence of one of `weekdays` (0 = Sunday). 0 = today. */
export function daysUntilNext(weekdays: number[], from = new Date()): number | null {
  if (weekdays.length === 0) return null
  const today = from.getDay()
  const deltas = weekdays.map((w) => (w - today + 7) % 7)
  return Math.min(...deltas)
}

export function clsx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/** "1 Training" / "2 Trainings" — German plurals aren't just an "s". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/** Midpoint of a target like "8–12" or "20 Sek." — used to prefill the logger. */
export function targetMidpoint(target: string): string {
  const range = target.match(/(\d+)\s*[–-]\s*(\d+)/)
  if (range) return String(Math.round((Number(range[1]) + Number(range[2])) / 2))
  const single = target.match(/\d+/)
  return single ? single[0] : ''
}

/** Seconds in a hold target like "20–30 Sek." → 30 (upper bound, so the timer is generous). */
export function holdSeconds(target: string): number | null {
  const nums = target.match(/\d+/g)
  if (!nums) return null
  return Number(nums[nums.length - 1])
}
