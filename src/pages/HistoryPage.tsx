import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Session } from '../types'
import { Button, Chip, Empty, Icon, SectionTitle, Sheet } from '../components/ui'
import { clsx, formatDate, formatShortDate, plural } from '../lib/util'

export function HistoryPage() {
  const { data, plan, removeSession } = useStore()
  const [open, setOpen] = useState<Session | null>(null)
  const [tab, setTab] = useState<'sessions' | 'progress'>('sessions')

  const done = useMemo(() => data.sessions.filter((s) => s.finishedAt), [data.sessions])

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
        <ul className="space-y-2">
          {done.map((session) => {
            const setCount = Object.values(session.entries).reduce(
              (sum, e) => sum + e.sets.filter((s) => s.done).length,
              0,
            )
            return (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => setOpen(session)}
                  className="card flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{formatDate(session.date)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {session.planName} · {plural(setCount, 'Satz', 'Sätze')}
                      {session.note ? ' · Notiz' : ''}
                    </p>
                  </div>
                  <Icon name="down" className="h-4 w-4 shrink-0 -rotate-90 text-slate-600" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <ProgressList sessions={done} />
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

  return (
    <div className="space-y-4">
      {session.note && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-[11px] font-semibold tracking-wide text-orange-400 uppercase">Notiz</p>
          <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap text-slate-300">{session.note}</p>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">In dieser Session wurde kein Satz abgehakt.</p>
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

  if (rows.length === 0) {
    return <Empty title="Noch keine Daten" hint="Hake im Workout Sätze ab, dann erscheint hier der Verlauf pro Übung." />
  }

  return (
    <div className="space-y-3">
      <SectionTitle>Pro Übung</SectionTitle>
      {rows.map(({ exercise, points }) => {
        const first = points[0]
        const last = points[points.length - 1]
        const delta = last.total - first.total
        return (
          <div key={exercise.id} className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-100">{exercise.name}</h3>
              <span className="shrink-0 text-xs text-slate-500">
                {exercise.hold ? 'Sek. gesamt' : 'Wdh. gesamt'}
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
              Bester Satz: {last.best} {exercise.hold ? 'Sek.' : 'Wdh.'} · {plural(last.sets, 'Satz', 'Sätze')} ·{' '}
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
