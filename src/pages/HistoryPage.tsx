import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Session, Sport } from '../types'
import { Button, Chip, Empty, Icon, SectionTitle, Sheet, blockStyles } from '../components/ui'
import { SPORTS, sportMeta } from '../data/sports'
import { clsx, formatDate, formatShortDate, formatKm, metricUnit, mmss, plural, setMetric } from '../lib/util'
import type { SetMetric } from '../types'

const sportOf = (s: Session): Sport => s.sport ?? 'calisthenics'

/** Column heading for the per-exercise totals — "Meter gesamt", not "Wdh. gesamt". */
const METRIC_TOTALS: Record<SetMetric, string> = {
  reps: 'Wdh. gesamt',
  seconds: 'Sek. gesamt',
  meters: 'Meter gesamt',
  minutes: 'Min. gesamt',
}

/** Pace in seconds per kilometre, or null when the inputs don't allow it. */
function paceSeconds(session: Session): number | null {
  const { distanceM, durationMin } = session.metrics ?? {}
  if (!distanceM || !durationMin) return null
  const sec = (durationMin * 60) / (distanceM / 1000)
  return Number.isFinite(sec) && sec > 0 && sec < 20 * 60 ? sec : null
}

function hardestSent(session: Session): number | null {
  const sent = (session.sends ?? []).filter((s) => s.sent)
  return sent.length > 0 ? Math.max(...sent.map((s) => s.level)) : null
}

/** One line describing a session in the units that sport actually cares about. */
function sessionSummary(session: Session): string {
  const m = session.metrics
  const parts: string[] = []

  switch (sportOf(session)) {
    case 'laufen': {
      if (m?.distanceM) parts.push(formatKm(m.distanceM))
      const pace = paceSeconds(session)
      if (pace) parts.push(`${mmss(pace)} /km`)
      if (m?.avgHr) parts.push(`${m.avgHr} bpm`)
      break
    }
    case 'schwimmen': {
      if (m?.laps) parts.push(plural(m.laps, 'Bahn', 'Bahnen'))
      if (m?.distanceM) parts.push(`${m.distanceM} m`)
      if (m?.stroke) parts.push(m.stroke)
      break
    }
    case 'bouldern': {
      const sent = (session.sends ?? []).filter((s) => s.sent).length
      if (sent > 0) parts.push(plural(sent, 'Boulder', 'Boulder'))
      const best = hardestSent(session)
      if (best !== null) parts.push(`bis Level ${best}`)
      const flashes = (session.sends ?? []).filter((s) => s.flash).length
      if (flashes > 0) parts.push(`${flashes}× Flash`)
      break
    }
    default: {
      const setCount = Object.values(session.entries).reduce((sum, e) => sum + e.sets.filter((s) => s.done).length, 0)
      if (setCount > 0) parts.push(plural(setCount, 'Satz', 'Sätze'))
      break
    }
  }

  if (parts.length === 0 && m?.durationMin) parts.push(`${m.durationMin} Min.`)
  return parts.join(' · ')
}

export function HistoryPage() {
  const { data, plan, removeSession } = useStore()
  const [open, setOpen] = useState<Session | null>(null)
  const [tab, setTab] = useState<'sessions' | 'progress'>('sessions')
  const [filter, setFilter] = useState<Sport | 'alle'>('alle')

  const done = useMemo(() => data.sessions.filter((s) => s.finishedAt), [data.sessions])
  const shown = useMemo(() => (filter === 'alle' ? done : done.filter((s) => sportOf(s) === filter)), [done, filter])

  // Only offer a filter for sports that actually have something logged.
  const usedSports = useMemo(() => SPORTS.filter((m) => done.some((s) => sportOf(s) === m.id)), [done])

  if (done.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-50">Verlauf</h1>
        <Empty title="Noch keine abgeschlossenen Trainings" hint="Nach dem ersten Training erscheint hier dein Verlauf." />
      </div>
    )
  }

  const streak = weeklyStreak(done)

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-50">Verlauf</h1>
        <div className="flex flex-wrap gap-2">
          <Chip className="bg-slate-800 text-slate-300">{plural(done.length, 'Training', 'Trainings')}</Chip>
          <Chip className="bg-slate-800 text-slate-300">{sessionsThisWeek(done)} diese Woche</Chip>
          {streak > 1 && <Chip className="bg-orange-500/15 text-orange-300">{streak} Wochen in Folge</Chip>}
        </div>

        {usedSports.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ id: 'alle' as const, name: 'Alle' }, ...usedSports].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                className={clsx(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === s.id
                    ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200',
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          {(['sessions', 'progress'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={clsx(
                'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
                tab === t ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200',
              )}
            >
              {t === 'sessions' ? 'Sessions' : 'Fortschritt'}
            </button>
          ))}
        </div>
      </header>

      {tab === 'sessions' ? (
        shown.length === 0 ? (
          <Empty title="Nichts für diesen Filter" hint="Für diese Sportart ist noch kein Training abgeschlossen." />
        ) : (
          <ul className="space-y-2">
            {shown.map((session) => {
              const summary = sessionSummary(session)
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(session)}
                    className="card flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900"
                  >
                    <span
                      className={clsx(
                        'h-9 w-1 shrink-0 rounded-full',
                        blockStyles[sportMeta(sportOf(session)).color].bar,
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{formatDate(session.date)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {sportMeta(sportOf(session)).name}
                        {summary ? ` · ${summary}` : ''}
                        {session.note ? ' · Notiz' : ''}
                      </p>
                    </div>
                    <Icon name="down" className="h-4 w-4 shrink-0 -rotate-90 text-slate-600" />
                  </button>
                </li>
              )
            })}
          </ul>
        )
      ) : (
        <ProgressList sessions={shown} />
      )}

      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title={
          <>
            <h2 className="text-base font-bold text-slate-50">{open && formatDate(open.date)}</h2>
            <p className="text-xs text-slate-500">{open?.planName}</p>
          </>
        }
        footer={
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (open && confirm('Diese Session löschen?')) {
                removeSession(open.id)
                setOpen(null)
              }
            }}
          >
            <Icon name="trash" className="h-4 w-4" />
            Session löschen
          </Button>
        }
      >
        {open && <SessionDetail session={open} planName={plan.name} />}
      </Sheet>
    </div>
  )
}

function SessionDetail({ session, planName }: { session: Session; planName: string }) {
  const { data } = useStore()
  // Names come from whichever plan the session was logged against.
  const sourcePlan = data.plans.find((p) => p.id === session.planId)
  const names = new Map(
    (sourcePlan ?? data.plans[0]).blocks.flatMap((b) => b.exercises.map((e) => [e.id, e.name] as const)),
  )
  const entries = Object.entries(session.entries).filter(([, e]) => e.sets.some((s) => s.done))

  const m = session.metrics
  const sends = session.sends ?? []
  const pace = paceSeconds(session)

  const facts: { label: string; value: string }[] = []
  if (m?.laps) facts.push({ label: 'Bahnen', value: String(m.laps) })
  if (m?.distanceM) {
    facts.push({
      label: 'Distanz',
      value: sportOf(session) === 'laufen' ? formatKm(m.distanceM) : `${m.distanceM} m`,
    })
  }
  if (m?.durationMin) facts.push({ label: 'Dauer', value: `${m.durationMin} Min.` })
  if (pace) facts.push({ label: 'Pace', value: `${mmss(pace)} /km` })
  if (m?.avgHr) facts.push({ label: 'Ø-Puls', value: `${m.avgHr} bpm` })
  if (m?.stroke) facts.push({ label: 'Stil', value: m.stroke })
  if (m?.waterL) facts.push({ label: 'Getrunken', value: `${String(m.waterL).replace('.', ',')} L` })
  if (m?.rpe) facts.push({ label: 'Anstrengung', value: `${m.rpe}/10` })

  return (
    <div className="space-y-4">
      {session.note && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-[11px] font-semibold tracking-wide text-orange-400 uppercase">Notiz</p>
          <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap text-slate-300">{session.note}</p>
        </div>
      )}

      {facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-2">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
              <dt className="text-[10px] tracking-wide text-slate-500 uppercase">{f.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-100">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {sends.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-purple-300 uppercase">
            {sends.filter((s) => s.sent).length} von {plural(sends.length, 'Boulder', 'Bouldern')} geschafft
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {sends.map((send) => (
              <li
                key={send.id}
                className={clsx(
                  'rounded-lg border px-2 py-1 text-[11px] tabular-nums',
                  send.sent ? 'border-purple-500/40 bg-purple-500/10 text-purple-200' : 'border-slate-700 text-slate-500',
                )}
              >
                L{send.level}
                {send.flash ? ' Flash' : ` · ${send.attempts}×`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {entries.length === 0 ? (
        sends.length === 0 && facts.length === 0 ? (
          <p className="text-sm text-slate-400">In dieser Session wurde nichts eingetragen.</p>
        ) : null
      ) : (
        <ul className="divide-y divide-slate-800">
          {entries.map(([id, entry]) => (
            <li key={id} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-slate-100">{names.get(id) ?? `Übung (${planName})`}</span>
                <span className="shrink-0 text-sm tabular-nums text-orange-300">
                  {entry.sets
                    .filter((s) => s.done)
                    .map((s) => s.value || '–')
                    .join(' · ')}
                </span>
              </div>
              {entry.note && <p className="mt-1 text-xs text-slate-500">{entry.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * What "progress" means per sport.
 *
 * Reps and sets say nothing about a Zone-2 run or a boulder session, so each
 * sport gets the series that actually tracks improvement for it. `lowerIsBetter`
 * flips the colour of the delta — a falling pace is progress, a falling boulder
 * level isn't.
 */
interface SportSeries {
  sport: Sport
  label: string
  value: (s: Session) => number | null
  format: (n: number) => string
  lowerIsBetter?: boolean
  /** Neither direction is clearly good — show the delta without a verdict. */
  neutral?: boolean
}

const SPORT_SERIES: SportSeries[] = [
  { sport: 'laufen', label: 'Distanz', value: (s) => s.metrics?.distanceM ?? null, format: (n) => formatKm(n) },
  { sport: 'laufen', label: 'Pace', value: paceSeconds, format: (n) => `${mmss(n)} /km`, lowerIsBetter: true },
  {
    sport: 'laufen',
    label: 'Ø-Puls',
    value: (s) => s.metrics?.avgHr ?? null,
    format: (n) => `${n} bpm`,
    // A lower heart rate at the same pace suggests fitness, but on its own it
    // could just mean an easier route. Not something to call good or bad.
    neutral: true,
  },
  { sport: 'schwimmen', label: 'Distanz', value: (s) => s.metrics?.distanceM ?? null, format: (n) => `${n} m` },
  { sport: 'schwimmen', label: 'Bahnen', value: (s) => s.metrics?.laps ?? null, format: (n) => String(n) },
  { sport: 'bouldern', label: 'Schwerster Boulder', value: hardestSent, format: (n) => `Level ${n}` },
  {
    sport: 'bouldern',
    label: 'Geschaffte Boulder',
    value: (s) => (s.sends ?? []).filter((x) => x.sent).length || null,
    format: (n) => String(n),
  },
  { sport: 'sauna', label: 'Dauer', value: (s) => s.metrics?.durationMin ?? null, format: (n) => `${n} Min.` },
  { sport: 'yoga', label: 'Dauer', value: (s) => s.metrics?.durationMin ?? null, format: (n) => `${n} Min.` },
]

function ProgressList({ sessions }: { sessions: Session[] }) {
  const { data } = useStore()
  const exercises = useMemo(
    () =>
      data.plans.flatMap((p) =>
        p.blocks.flatMap((b) => b.exercises.filter((e) => e.sets > 0).map((e) => ({ ...e, planId: p.id }))),
      ),
    [data.plans],
  )

  // Oldest first, so the sparkline reads left → right in time.
  const chronological = useMemo(() => [...sessions].reverse(), [sessions])

  const seriesRows = SPORT_SERIES.map((series) => {
    const points = chronological
      .filter((s) => sportOf(s) === series.sport)
      .map((s) => ({ date: s.date, n: series.value(s) }))
      .filter((p): p is { date: string; n: number } => p.n !== null)
    return { series, points }
  }).filter((r) => r.points.length > 0)

  const rows = exercises
    .map((exercise) => {
      const points = chronological
        .map((s) => {
          const done = s.entries[exercise.id]?.sets.filter((x) => x.done) ?? []
          if (done.length === 0) return null
          const total = done.reduce((sum, x) => sum + (Number(x.value) || 0), 0)
          return { date: s.date, total, best: Math.max(...done.map((x) => Number(x.value) || 0)), sets: done.length }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
      return { exercise, points }
    })
    .filter((r) => r.points.length > 0)

  if (rows.length === 0 && seriesRows.length === 0) {
    return (
      <Empty
        title="Noch keine Daten"
        hint="Trage im Training Sätze, Distanzen oder Boulder ein – dann erscheint hier der Verlauf."
      />
    )
  }

  return (
    <div className="space-y-3">
      {seriesRows.length > 0 && (
        <>
          <SectionTitle>Pro Sportart</SectionTitle>
          {seriesRows.map(({ series, points }) => {
            const first = points[0]
            const last = points[points.length - 1]
            const delta = last.n - first.n
            const good = series.lowerIsBetter ? delta < 0 : delta > 0
            return (
              <div key={`${series.sport}-${series.label}`} className="card p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-100">{series.label}</h3>
                  <span className="shrink-0 text-xs text-slate-500">{sportMeta(series.sport).name}</span>
                </div>
                <div className="mt-2 flex items-end gap-3">
                  <span className="text-2xl leading-none font-bold tabular-nums text-slate-50">
                    {series.format(last.n)}
                  </span>
                  {points.length > 1 && delta !== 0 && (
                    <span
                      className={clsx(
                        'text-xs font-semibold tabular-nums',
                        series.neutral ? 'text-slate-500' : good ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {delta > 0 ? '+' : '−'}
                      {series.format(Math.abs(delta))} seit {formatShortDate(first.date)}
                    </span>
                  )}
                </div>
                <Sparkline points={points.map((p) => p.n)} />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {plural(points.length, 'Eintrag', 'Einträge')}
                  {series.lowerIsBetter && ' · weniger ist besser'}
                </p>
              </div>
            )
          })}
        </>
      )}

      {rows.length > 0 && <SectionTitle>Pro Übung</SectionTitle>}
      {rows.map(({ exercise, points }) => {
        const first = points[0]
        const last = points[points.length - 1]
        const delta = last.total - first.total
        return (
          <div key={exercise.id} className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-100">{exercise.name}</h3>
              <span className="shrink-0 text-xs text-slate-500">
                {METRIC_TOTALS[setMetric(exercise)]}
              </span>
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-2xl leading-none font-bold tabular-nums text-slate-50">{last.total}</span>
              {points.length > 1 && (
                <span
                  className={clsx(
                    'text-xs font-semibold tabular-nums',
                    delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-500',
                  )}
                >
                  {delta > 0 ? '+' : ''}
                  {delta} seit {formatShortDate(first.date)}
                </span>
              )}
            </div>
            <Sparkline points={points.map((p) => p.total)} />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Bester Satz: {last.best} {metricUnit(setMetric(exercise))} · {plural(last.sets, 'Satz', 'Sätze')} ·{' '}
              {plural(points.length, 'Eintrag', 'Einträge')}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const w = 100
  const h = 28
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p - min) / span) * (h - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2.5 h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="#f97316" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** ISO-ish week key (year + week number), used for the streak. */
function weekKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return weekKeyOf(new Date(y, (m ?? 1) - 1, d))
}

function weekKeyOf(date: Date): string {
  const thursday = new Date(date)
  thursday.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3)
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return `${thursday.getFullYear()}-${String(week).padStart(2, '0')}`
}

function sessionsThisWeek(sessions: Session[]): number {
  const current = weekKeyOf(new Date())
  return sessions.filter((s) => weekKey(s.date) === current).length
}

/** Consecutive weeks with at least one session, counting back from this week or last. */
function weeklyStreak(sessions: Session[]): number {
  const weeks = new Set(sessions.map((s) => weekKey(s.date)))
  let cursor = new Date()
  // An empty current week shouldn't break a streak that's still alive — start at last week.
  if (!weeks.has(weekKeyOf(cursor))) cursor = new Date(cursor.getTime() - 7 * 86400000)
  let streak = 0
  while (weeks.has(weekKeyOf(cursor))) {
    streak++
    cursor = new Date(cursor.getTime() - 7 * 86400000)
  }
  return streak
}
