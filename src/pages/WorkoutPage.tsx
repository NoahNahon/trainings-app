import { useEffect, useMemo, useState } from 'react'
import { emptyMetrics, loadDraft, newSession, saveDraft, useStore } from '../store'
import type { BoulderSend, Exercise, LoggedSet, Session, SessionMetrics } from '../types'
import { Button, Chip, Empty, Icon, blockStyles } from '../components/ui'
import { TimerBar, useCountdown } from '../components/Timer'
import { BOULDER_LEVELS, METRIC_SPECS, RUN_DISTANCE_SPEC, STROKES, sportMeta, type MetricKey } from '../data/sports'
import {
  clsx,
  formatDate,
  holdSeconds,
  metricUnit,
  metricUsesTimer,
  pacePerKm,
  parseDecimal,
  setMetric,
  targetMidpoint,
  uid,
} from '../lib/util'

/**
 * Logged sets for an exercise, padded to the plan's current set count and
 * prefilled with the target so the common case needs no typing at all.
 */
function setsOf(session: Session | null, exercise: Exercise): LoggedSet[] {
  const existing = session?.entries[exercise.id]?.sets
  if (existing && existing.length === exercise.sets) return existing
  // Seconds take the upper bound of the target; everything else its midpoint —
  // "25 m" and "30–40 Min." both prefill sensibly that way.
  const prefill =
    setMetric(exercise) === 'seconds'
      ? String(holdSeconds(exercise.target) ?? '')
      : targetMidpoint(exercise.target)
  return Array.from({ length: exercise.sets }, (_, i) => existing?.[i] ?? { done: false, value: prefill })
}

export function WorkoutPage({ onFinished }: { onFinished: () => void }) {
  const { plan, saveSession, data } = useStore()
  const [session, setSession] = useState<Session | null>(() => {
    const draft = loadDraft()
    return draft && !draft.finishedAt ? draft : null
  })
  const timer = useCountdown()

  useEffect(() => {
    saveDraft(session)
  }, [session])

  const lastSession = useMemo(
    () => data.sessions.find((s) => s.planId === plan.id && s.finishedAt),
    [data.sessions, plan.id],
  )

  if (!session) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-50">Training</h1>
        <div className="card space-y-4 p-5">
          <div>
            <p className="text-sm text-slate-300">{plan.name}</p>
            <p className="mt-1 text-xs text-slate-500">{plan.subtitle}</p>
          </div>
          {lastSession && (
            <p className="text-xs text-slate-500">Letztes Training: {formatDate(lastSession.date)}</p>
          )}
          <Button variant="primary" className="w-full" onClick={() => setSession(newSession(plan))}>
            <Icon name="play" className="h-4 w-4" />
            Session starten
          </Button>
        </div>
        {data.sessions.length === 0 && (
          <Empty
            title="Noch keine Trainings geloggt"
            hint="Starte eine Session – Sätze abhaken, Wiederholungen eintragen, fertig."
          />
        )}
      </div>
    )
  }

  // A session references exercises by id; the plan is the source of truth for what to show.
  const trackable = plan.blocks.flatMap((b) => b.exercises.filter((e) => e.sets > 0).map((e) => ({ block: b, e })))
  const doneSets = trackable.reduce(
    (sum, { e }) => sum + (session.entries[e.id]?.sets.filter((s) => s.done).length ?? 0),
    0,
  )
  const totalSets = trackable.filter(({ e }) => !e.optional).reduce((sum, { e }) => sum + e.sets, 0)
  const pct = totalSets === 0 ? 0 : Math.min(100, Math.round((doneSets / totalSets) * 100))

  const sport = plan.sport ?? 'calisthenics'
  const meta = sportMeta(sport)
  const metrics = session.metrics ?? emptyMetrics()
  const sends = session.sends ?? []

  function patchMetrics(patch: Partial<SessionMetrics>) {
    setSession((prev) =>
      prev ? { ...prev, metrics: { ...(prev.metrics ?? emptyMetrics()), ...patch } } : prev,
    )
  }

  function patchSends(fn: (list: BoulderSend[]) => BoulderSend[]) {
    setSession((prev) => (prev ? { ...prev, sends: fn(prev.sends ?? []) } : prev))
  }

  function entryFor(exercise: Exercise): LoggedSet[] {
    return setsOf(session, exercise)
  }

  function patchSet(exercise: Exercise, index: number, patch: Partial<LoggedSet>) {
    // Read from `prev`, not the render-time session, so rapid taps can't clobber each other.
    setSession((prev) => {
      if (!prev) return prev
      const sets = setsOf(prev, exercise).map((s, i) => (i === index ? { ...s, ...patch } : s))
      return {
        ...prev,
        entries: { ...prev.entries, [exercise.id]: { sets, note: prev.entries[exercise.id]?.note ?? '' } },
      }
    })
  }

  function toggleSet(exercise: Exercise, index: number) {
    const wasDone = entryFor(exercise)[index]?.done ?? false
    patchSet(exercise, index, { done: !wasDone })
    // Checking a set off starts the rest countdown; unchecking shouldn't.
    if (!wasDone && exercise.restSec) {
      timer.start(exercise.restSec, `Pause · ${exercise.name} (Satz ${index + 1})`)
    }
  }

  function finish() {
    const finished: Session = { ...session!, finishedAt: new Date().toISOString() }
    saveSession(finished)
    saveDraft(null)
    setSession(null)
    timer.stop()
    onFinished()
  }

  function discard() {
    if (!confirm('Session verwerfen? Alle Eingaben dieser Session gehen verloren.')) return
    saveDraft(null)
    setSession(null)
    timer.stop()
  }

  return (
    <div className="space-y-5 pb-24">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-50">{plan.name}</h1>
            <p className="text-xs text-slate-500">{formatDate(session.date)} · läuft</p>
          </div>
          {/* Sätze sind für Bouldern die falsche Einheit — dort zählen Boulder. */}
          {sport === 'bouldern' ? (
            <Chip className="bg-orange-500/15 text-orange-300">
              {sends.filter((s) => s.sent).length} / {sends.length} Boulder
            </Chip>
          ) : (
            totalSets > 0 && (
              <Chip className="bg-orange-500/15 text-orange-300">
                {doneSets} / {totalSets} Sätze
              </Chip>
            )
          )}
        </div>
        {totalSets > 0 && (
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-orange-500 transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        )}
      </header>

      <div className="space-y-4">
        {plan.blocks.map((block) => {
          const logged = block.exercises.filter((e) => e.sets > 0)
          const info = block.exercises.filter((e) => e.sets === 0)
          const style = blockStyles[block.color]
          return (
            <section key={block.id} className={clsx('card overflow-hidden', style.ring)}>
              <div className={clsx('px-4 py-2', style.bar)}>
                <h2 className="text-xs font-bold tracking-wide text-white uppercase">{block.name}</h2>
              </div>
              {logged.length === 0 ? (
                <ul className="divide-y divide-slate-800">
                  {info.map((e) => (
                    <li key={e.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                      <span className="text-sm text-slate-300">{e.name}</span>
                      <span className="shrink-0 text-xs text-slate-500">{e.target}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {logged.map((exercise) => (
                    <li key={exercise.id}>
                      <ExerciseLogger
                        exercise={exercise}
                        sets={entryFor(exercise)}
                        note={session.entries[exercise.id]?.note ?? ''}
                        color={block.color}
                        onToggle={(i) => toggleSet(exercise, i)}
                        onValue={(i, value) => patchSet(exercise, i, { value })}
                        onNote={(note) =>
                          setSession((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  entries: {
                                    ...prev.entries,
                                    [exercise.id]: { sets: entryFor(exercise), note },
                                  },
                                }
                              : prev,
                          )
                        }
                        onHold={() => {
                          const secs = holdSeconds(exercise.target)
                          if (secs) timer.start(secs, `Halten · ${exercise.name}`)
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {meta.sends && <SendsCard sends={sends} onChange={patchSends} />}

      {meta.metrics.length > 0 && (
        <MetricsCard sport={sport} keys={meta.metrics} metrics={metrics} onChange={patchMetrics} />
      )}

      <div className="card space-y-2 p-4">
        <label className="block text-[11px] font-medium tracking-wide text-slate-400 uppercase">
          Notiz zur Session
        </label>
        <textarea
          className="field resize-none"
          rows={3}
          placeholder="Wie lief es? Handgelenk okay? Was nächstes Mal steigern?"
          value={session.note}
          onChange={(e) => setSession((prev) => (prev ? { ...prev, note: e.target.value } : prev))}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={finish}>
          <Icon name="check" className="h-4 w-4" />
          Training abschließen
        </Button>
        <Button variant="danger" onClick={discard}>
          Verwerfen
        </Button>
      </div>

      <TimerBar timer={timer} />
    </div>
  )
}

function ExerciseLogger({
  exercise,
  sets,
  note,
  color,
  onToggle,
  onValue,
  onNote,
  onHold,
}: {
  exercise: Exercise
  sets: LoggedSet[]
  note: string
  color: keyof typeof blockStyles
  onToggle: (index: number) => void
  onValue: (index: number, value: string) => void
  onNote: (note: string) => void
  onHold: () => void
}) {
  const [showNote, setShowNote] = useState(note.length > 0)
  const style = blockStyles[color]
  const allDone = sets.length > 0 && sets.every((s) => s.done)
  const metric = setMetric(exercise)
  const unit = metricUnit(metric)

  return (
    <div className={clsx('px-4 py-3', exercise.optional && 'bg-slate-950/30')}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={clsx('text-sm font-semibold', allDone ? 'text-emerald-400' : 'text-slate-100')}>
          {exercise.name}
          {exercise.optional && <span className="ml-1.5 text-[11px] font-normal text-slate-500">(optional)</span>}
        </h3>
        <span className={clsx('shrink-0 text-xs font-semibold tabular-nums', style.text)}>
          Ziel {exercise.sets} × {exercise.target}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {sets.map((set, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Satz ${i + 1} ${set.done ? 'zurücksetzen' : 'abhaken'}`}
              onClick={() => onToggle(i)}
              className={clsx(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                set.done
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-600 hover:border-slate-500',
              )}
            >
              {set.done ? <Icon name="check" className="h-4 w-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
            </button>
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="numeric"
                className="field pr-16 tabular-nums"
                placeholder={unit}
                value={set.value}
                onChange={(e) => onValue(i, e.target.value)}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-500">
                {unit}
              </span>
            </div>
            {metricUsesTimer(metric) && (
              <Button size="sm" variant="secondary" aria-label="Halte-Timer starten" onClick={onHold}>
                <Icon name="timer" className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs">
        {exercise.restSec !== null && <span className="text-slate-500">Pause {exercise.restSec} Sek.</span>}
        <button
          type="button"
          onClick={() => setShowNote((v) => !v)}
          className="text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-orange-400"
        >
          {showNote ? 'Notiz ausblenden' : 'Notiz'}
        </button>
        {exercise.link && (
          <a
            href={exercise.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-orange-400"
          >
            <Icon name="link" className="h-3 w-3" />
            Tutorial
          </a>
        )}
      </div>

      {showNote && (
        <textarea
          className="field mt-2 resize-none"
          rows={2}
          placeholder="z.B. Band nicht mehr nötig / Handgelenk gezogen"
          value={note}
          onChange={(e) => onNote(e.target.value)}
        />
      )}

      {exercise.note && <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{exercise.note}</p>}
    </div>
  )
}

/**
 * A number field that keeps its own text while you type.
 *
 * Necessary because "7," is not a number yet: binding the input straight to the
 * parsed value would delete the comma the moment it's typed. The effect only
 * resyncs when the outside value stops matching what the text parses to, which
 * happens on draft restore but not during editing.
 */
function MetricInput({
  value,
  unit,
  decimal,
  placeholder,
  onChange,
}: {
  value: number | null
  unit: string
  decimal: boolean
  placeholder?: string
  onChange: (value: number | null) => void
}) {
  const asText = (v: number | null) => (v == null ? '' : String(v).replace('.', ','))
  const [text, setText] = useState(() => asText(value))

  useEffect(() => {
    if (parseDecimal(text) !== value) setText(asText(value))
    // Intentionally keyed on `value` only — depending on `text` would fight the typist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative">
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        className={clsx('field tabular-nums', unit && 'pr-14')}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onChange(parseDecimal(e.target.value))
        }}
      />
      {unit && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-500">
          {unit}
        </span>
      )}
    </div>
  )
}

function MetricsCard({
  sport,
  keys,
  metrics,
  onChange,
}: {
  sport: string
  keys: MetricKey[]
  metrics: SessionMetrics
  onChange: (patch: Partial<SessionMetrics>) => void
}) {
  const pace = sport === 'laufen' ? pacePerKm(metrics.distanceM, metrics.durationMin) : null

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Ergebnis der Einheit</h2>
        {pace && <span className="text-xs font-semibold tabular-nums text-emerald-400">{pace}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {keys.map((key) => {
          // Running is the one sport entered in kilometres; everything else in metres.
          const isRunKm = key === 'distanceM' && sport === 'laufen'
          const spec = isRunKm ? RUN_DISTANCE_SPEC : METRIC_SPECS[key]

          if (key === 'stroke') {
            return (
              <label key={key} className="col-span-2 block">
                <span className="mb-1 block text-[11px] text-slate-400">{spec.label}</span>
                <select
                  className="field"
                  value={metrics.stroke}
                  onChange={(e) => onChange({ stroke: e.target.value })}
                >
                  <option value="">— nicht angegeben —</option>
                  {STROKES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )
          }

          const raw = metrics[key]
          const value = typeof raw === 'number' ? (isRunKm ? raw / 1000 : raw) : null

          return (
            <label key={key} className="block">
              <span className="mb-1 block text-[11px] text-slate-400">{spec.label}</span>
              <MetricInput
                value={value}
                unit={spec.unit}
                decimal={spec.kind === 'decimal'}
                onChange={(n) => onChange({ [key]: isRunKm && n != null ? Math.round(n * 1000) : n })}
              />
              {spec.hint && <span className="mt-1 block text-[10px] leading-snug text-slate-500">{spec.hint}</span>}
            </label>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Boulder log. Tapping a level adds a problem straight away, because in the gym
 * you want one tap per boulder, not a form. Corrections happen in the list below.
 */
function SendsCard({
  sends,
  onChange,
}: {
  sends: BoulderSend[]
  onChange: (fn: (list: BoulderSend[]) => BoulderSend[]) => void
}) {
  function add(level: number) {
    onChange((list) => [
      ...list,
      { id: uid('send'), level, attempts: 1, flash: true, sent: true, note: '' },
    ])
  }

  /** Flash is derived, never toggled by hand — it can only mean "sent first try". */
  function patch(id: string, next: Partial<BoulderSend>) {
    onChange((list) =>
      list.map((s) => {
        if (s.id !== id) return s
        const merged = { ...s, ...next }
        return { ...merged, flash: merged.sent && merged.attempts === 1 }
      }),
    )
  }

  const sent = sends.filter((s) => s.sent)
  const hardest = sent.length > 0 ? Math.max(...sent.map((s) => s.level)) : null

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-baseline justify-between gap-3">
        {/* Nicht nur "Boulder": der Plan hat schon einen Block mit dem Namen. */}
        <h2 className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">Boulder-Protokoll</h2>
        {hardest !== null && (
          <span className="text-xs text-slate-400">
            Schwerster geschafft: <span className="font-semibold text-purple-300">Level {hardest}</span>
          </span>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-[11px] text-slate-400">Level antippen zum Hinzufügen</span>
        <div className="grid grid-cols-8 gap-1.5">
          {BOULDER_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => add(level)}
              className="h-10 rounded-lg border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-200 transition-colors hover:border-purple-500 hover:text-purple-300 active:bg-purple-500/20"
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {sends.length === 0 ? (
        <p className="text-xs text-slate-500">Noch kein Boulder eingetragen. 1 = leicht, 8 = schwer.</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {sends.map((send) => (
            <li key={send.id} className="flex items-center gap-2 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-sm font-bold text-purple-300">
                {send.level}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Ein Versuch weniger"
                  onClick={() => patch(send.id, { attempts: Math.max(1, send.attempts - 1) })}
                >
                  −
                </Button>
                <span className="w-10 text-center text-xs tabular-nums text-slate-300">{send.attempts}×</span>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Ein Versuch mehr"
                  onClick={() => patch(send.id, { attempts: send.attempts + 1 })}
                >
                  +
                </Button>
              </div>

              <button
                type="button"
                onClick={() => patch(send.id, { sent: !send.sent })}
                className={clsx(
                  'ml-auto shrink-0 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors',
                  send.sent
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-700 text-slate-500',
                )}
              >
                {send.sent ? (send.flash ? 'Flash' : 'Top') : 'Versucht'}
              </button>

              <button
                type="button"
                aria-label="Boulder entfernen"
                onClick={() => onChange((list) => list.filter((s) => s.id !== send.id))}
                className="shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:text-red-400"
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
