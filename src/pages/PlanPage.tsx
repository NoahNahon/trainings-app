import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Block, Exercise, Plan, Sport } from '../types'
import { Button, Chip, Field, Icon, SectionTitle, blockStyles, colorOptions } from '../components/ui'
import { SPORTS, sportMeta } from '../data/sports'
import { clsx, daysUntilNext, formatShortDate, plural, weekdayName } from '../lib/util'

/**
 * Plan tab: pick a sport first, then its plan.
 *
 * The picker is a gate rather than a row of tabs because six sports don't fit
 * across a phone, and because the week only ever has one or two of them on any
 * given day — so the useful default view is "what's today", not "everything".
 */
export function PlanPage({ onStartWorkout }: { onStartWorkout: () => void }) {
  const [sport, setSport] = useState<Sport | null>(null)

  if (!sport) return <SportPicker onPick={setSport} />
  return <PlanDetail sport={sport} onBack={() => setSport(null)} onStartWorkout={onStartWorkout} />
}

function SportPicker({ onPick }: { onPick: (sport: Sport) => void }) {
  const { data, setActivePlan } = useStore()
  const today = new Date().getDay()

  /** Newest session per sport — sessions are already sorted newest first. */
  const lastBySport = useMemo(() => {
    const map = new Map<Sport, string>()
    for (const s of data.sessions) {
      const key = s.sport ?? 'calisthenics'
      if (!map.has(key)) map.set(key, s.date)
    }
    return map
  }, [data.sessions])

  function pick(sport: Sport) {
    // Point the Training tab at this sport before navigating into it.
    const first = data.plans.find((p) => (p.sport ?? 'calisthenics') === sport)
    if (first) setActivePlan(first.id)
    onPick(sport)
  }

  const todaysSports = SPORTS.filter((s) => s.weekdays.includes(today))

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl leading-tight font-bold text-slate-50">Sportart wählen</h1>
        <p className="mt-1 text-sm text-slate-400">
          {todaysSports.length > 0
            ? `Heute ist ${weekdayName(today)}: ${todaysSports.map((s) => s.name).join(' + ')}`
            : `Heute ist ${weekdayName(today)} – kein Training im Plan`}
        </p>
      </header>

      <div className="grid gap-3">
        {SPORTS.map((meta) => {
          const isToday = meta.weekdays.includes(today)
          const plans = data.plans.filter((p) => (p.sport ?? 'calisthenics') === meta.id)
          const last = lastBySport.get(meta.id)
          const style = blockStyles[meta.color]

          return (
            <button
              key={meta.id}
              type="button"
              onClick={() => pick(meta.id)}
              className={clsx(
                'flex items-stretch gap-3 overflow-hidden rounded-2xl border text-left transition-colors',
                isToday
                  ? 'border-orange-500/50 bg-orange-500/5'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700',
              )}
            >
              <span className={clsx('w-1.5 shrink-0', style.bar)} aria-hidden="true" />
              <span className="min-w-0 flex-1 py-3 pr-3">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold text-slate-100">{meta.name}</span>
                  {isToday && (
                    <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-medium text-orange-300">
                      heute
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-400">{meta.role}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  <span>{meta.weekdays.map((d) => weekdayName(d).slice(0, 2)).join(' · ')}</span>
                  <span aria-hidden="true">•</span>
                  <span>{plural(plans.length, 'Plan', 'Pläne')}</span>
                  <span aria-hidden="true">•</span>
                  <span>{last ? `zuletzt ${formatShortDate(last)}` : 'noch nichts geloggt'}</span>
                </span>
              </span>
              <span className="flex items-center pr-3 text-slate-600">
                <Icon name="down" className="h-4 w-4 -rotate-90" />
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Die Wochenstruktur stammt aus deinem Sport- und Ernährungsplan: Mi und Sa sind die Haupttage, Mo und Fr
        aktive Erholung, Di / Do / So Regeneration.
      </p>
    </div>
  )
}

function PlanDetail({
  sport,
  onBack,
  onStartWorkout,
}: {
  sport: Sport
  onBack: () => void
  onStartWorkout: () => void
}) {
  const { data, plan, setActivePlan } = useStore()
  const [editing, setEditing] = useState(false)
  const [showOptional, setShowOptional] = useState(true)
  const meta = sportMeta(sport)

  const sportPlans = data.plans.filter((p) => (p.sport ?? 'calisthenics') === sport)
  // Guard against the active plan belonging to another sport (e.g. after an import).
  const shown = sportPlans.some((p) => p.id === plan.id) ? plan : sportPlans[0]

  if (!shown) {
    return (
      <div className="space-y-4">
        <BackBar label={meta.name} onBack={onBack} />
        <p className="text-sm text-slate-400">Für diese Sportart ist kein Plan vorhanden.</p>
      </div>
    )
  }

  const inDays = daysUntilNext(shown.weekdays)
  const nextLabel =
    inDays === null
      ? null
      : inDays === 0
        ? 'Heute ist Trainingstag'
        : inDays === 1
          ? 'Morgen ist Trainingstag'
          : `Nächster Trainingstag in ${inDays} Tagen`

  const coreExercises = shown.blocks.flatMap((b) => b.exercises).filter((e) => !e.optional && e.sets > 0)
  const totalSets = coreExercises.reduce((sum, e) => sum + e.sets, 0)

  // "Sätze" only means something where you actually count sets. The sauna plan
  // has nine steps, and a Zone-2 run is one continuous effort — calling either
  // of those "Sätze im Kern" would be noise.
  const volumeLabel =
    totalSets === 0
      ? null
      : sport === 'sauna'
        ? plural(totalSets, 'Schritt', 'Schritte')
        : sport === 'laufen' || sport === 'yoga'
          ? null
          : `${plural(totalSets, 'Satz', 'Sätze')} im Kern`

  return (
    <div className="space-y-5">
      <BackBar label={meta.name} onBack={onBack} />

      <header className="space-y-3">
        {sportPlans.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sportPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePlan(p.id)}
                className={clsx(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  p.id === shown.id
                    ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200',
                )}
              >
                {p.name.replace(' – Trainingsplan', '').replace(' – Aufbau', '')}
              </button>
            ))}
          </div>
        )}

        <div>
          <h1 className="text-2xl leading-tight font-bold text-slate-50">{shown.name}</h1>
          <p className="mt-1 text-sm text-slate-400">{shown.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip className="bg-slate-800 text-slate-300">
            {shown.weekdays.map(weekdayName).join(' & ') || 'Keine Tage gesetzt'}
          </Chip>
          {volumeLabel && <Chip className="bg-slate-800 text-slate-300">{volumeLabel}</Chip>}
          {nextLabel && (
            <Chip className={inDays === 0 ? 'bg-orange-500/15 text-orange-300' : 'bg-slate-800 text-slate-400'}>
              {nextLabel}
            </Chip>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={onStartWorkout}>
            <Icon name="play" className="h-4 w-4" />
            Training starten
          </Button>
          <Button variant={editing ? 'primary' : 'secondary'} onClick={() => setEditing((v) => !v)}>
            <Icon name={editing ? 'check' : 'pencil'} className="h-4 w-4" />
            {editing ? 'Fertig' : 'Bearbeiten'}
          </Button>
        </div>

        {!editing && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showOptional}
              onChange={(e) => setShowOptional(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-orange-500"
            />
            Optionale Übungen anzeigen
          </label>
        )}
      </header>

      {editing && <PlanMetaEditor plan={shown} />}

      <div className="space-y-4">
        {shown.blocks.map((block, i) => (
          <BlockCard
            key={block.id}
            plan={shown}
            block={block}
            editing={editing}
            showOptional={showOptional}
            isFirst={i === 0}
            isLast={i === shown.blocks.length - 1}
          />
        ))}
      </div>

      {editing && (
        <BlockAdder planId={shown.id} />
      )}

      <NotesSection plan={shown} editing={editing} />
    </div>
  )
}

function BackBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="-ml-1 flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm text-slate-400 transition-colors hover:text-slate-200"
    >
      <Icon name="down" className="h-4 w-4 rotate-90" />
      Alle Sportarten
      <span className="text-slate-600">·</span>
      <span className="text-slate-300">{label}</span>
    </button>
  )
}

function BlockAdder({ planId }: { planId: string }) {
  const { addBlock } = useStore()
  return (
    <Button variant="secondary" className="w-full" onClick={() => addBlock(planId)}>
      <Icon name="plus" className="h-4 w-4" />
      Block hinzufügen
    </Button>
  )
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function PlanMetaEditor({ plan }: { plan: Plan }) {
  const { updatePlan } = useStore()
  return (
    <div className="card space-y-3 p-4">
      <SectionTitle>Plan</SectionTitle>
      <Field label="Name">
        <input className="field" value={plan.name} onChange={(e) => updatePlan(plan.id, { name: e.target.value })} />
      </Field>
      <Field label="Untertitel">
        <textarea
          className="field resize-none"
          rows={2}
          value={plan.subtitle}
          onChange={(e) => updatePlan(plan.id, { subtitle: e.target.value })}
        />
      </Field>
      <div>
        <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-slate-400 uppercase">
          Trainingstage
        </span>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_ORDER.map((d) => {
            const active = plan.weekdays.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() =>
                  updatePlan(plan.id, {
                    weekdays: active ? plan.weekdays.filter((w) => w !== d) : [...plan.weekdays, d].sort(),
                  })
                }
                className={clsx(
                  'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200',
                )}
              >
                {weekdayName(d).slice(0, 2)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BlockCard({
  plan,
  block,
  editing,
  showOptional,
  isFirst,
  isLast,
}: {
  plan: Plan
  block: Block
  editing: boolean
  showOptional: boolean
  isFirst: boolean
  isLast: boolean
}) {
  const { updateBlock, removeBlock, moveBlock, addExercise } = useStore()
  // Only one exercise form is open at a time — 30 expanded forms is an unusable scroll.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const style = blockStyles[block.color]
  const visible = editing ? block.exercises : block.exercises.filter((e) => showOptional || !e.optional)
  const hiddenCount = block.exercises.length - visible.length

  return (
    <section className={clsx('card overflow-hidden', style.ring)}>
      <div className={clsx('flex items-center justify-between gap-2 px-4 py-2.5', style.bar)}>
        {editing ? (
          <input
            className="min-w-0 flex-1 rounded border border-white/25 bg-black/20 px-2 py-1 text-sm font-semibold text-white placeholder:text-white/50 focus:outline-none"
            value={block.name}
            onChange={(e) => updateBlock(plan.id, block.id, { name: e.target.value })}
          />
        ) : (
          <h2 className="text-sm font-bold tracking-wide text-white uppercase">{block.name}</h2>
        )}
        {editing ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <IconBtn label="Nach oben" disabled={isFirst} onClick={() => moveBlock(plan.id, block.id, -1)}>
              <Icon name="up" className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Nach unten" disabled={isLast} onClick={() => moveBlock(plan.id, block.id, 1)}>
              <Icon name="down" className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Block löschen" onClick={() => removeBlock(plan.id, block.id)}>
              <Icon name="trash" className="h-4 w-4" />
            </IconBtn>
          </div>
        ) : (
          block.duration && <span className="shrink-0 text-xs font-medium text-white/80">{block.duration}</span>
        )}
      </div>

      {editing && (
        <div className="grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-950/40 px-4 py-3">
          <Field label="Dauer">
            <input
              className="field"
              placeholder="ca. 13 Min."
              value={block.duration}
              onChange={(e) => updateBlock(plan.id, block.id, { duration: e.target.value })}
            />
          </Field>
          <Field label="Farbe">
            <select
              className="field"
              value={block.color}
              onChange={(e) => updateBlock(plan.id, block.id, { color: e.target.value as Block['color'] })}
            >
              {colorOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <ul className="divide-y divide-slate-800">
        {visible.map((exercise, i) => (
          <li key={exercise.id}>
            {editing ? (
              <ExerciseEditor
                planId={plan.id}
                blockId={block.id}
                exercise={exercise}
                isFirst={i === 0}
                isLast={i === visible.length - 1}
                expanded={expandedId === exercise.id}
                onToggle={() => setExpandedId((id) => (id === exercise.id ? null : exercise.id))}
              />
            ) : (
              <ExerciseRow exercise={exercise} color={block.color} />
            )}
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="px-4 py-6 text-center text-xs text-slate-500">
          {hiddenCount > 0
            ? `${plural(hiddenCount, 'optionale Übung', 'optionale Übungen')} ausgeblendet`
            : 'Noch keine Übungen'}
        </p>
      )}

      {!editing && hiddenCount > 0 && visible.length > 0 && (
        <p className="px-4 py-2 text-[11px] text-slate-500">+ {hiddenCount} optional ausgeblendet</p>
      )}

      {editing && (
        <div className="px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              addExercise(plan.id, block.id)
              setExpandedId(null)
            }}
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Übung hinzufügen
          </Button>
        </div>
      )}
    </section>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1.5 text-white/80 transition-colors hover:bg-black/25 hover:text-white disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function ExerciseRow({ exercise, color }: { exercise: Exercise; color: Block['color'] }) {
  const style = blockStyles[color]
  const dim = exercise.optional
  return (
    <div className={clsx('px-4 py-3', dim && 'opacity-55')}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={clsx('text-sm font-semibold', dim ? 'text-slate-400 italic' : 'text-slate-100')}>
          {exercise.name}
          {exercise.optional && <span className="ml-1.5 text-[11px] font-normal">(optional)</span>}
        </h3>
        <span className={clsx('shrink-0 text-sm font-semibold tabular-nums', style.text)}>
          {exercise.sets > 0 ? `${exercise.sets} × ${exercise.target}` : exercise.target}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {exercise.restSec !== null && <span>Pause {exercise.restSec} Sek.</span>}
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
      {exercise.note && <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{exercise.note}</p>}
    </div>
  )
}

function ExerciseEditor({
  planId,
  blockId,
  exercise,
  isFirst,
  isLast,
  expanded,
  onToggle,
}: {
  planId: string
  blockId: string
  exercise: Exercise
  isFirst: boolean
  isLast: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const { updateExercise, removeExercise, moveExercise } = useStore()
  const set = (patch: Partial<Exercise>) => updateExercise(planId, blockId, exercise.id, patch)

  return (
    <div className={clsx(expanded && 'bg-slate-950/40')}>
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left hover:bg-slate-800/50">
          <span className="flex items-baseline gap-2">
            <span className={clsx('min-w-0 flex-1 truncate text-sm', exercise.optional ? 'text-slate-400 italic' : 'text-slate-100')}>
              {exercise.name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-slate-500">
              {exercise.sets > 0 ? `${exercise.sets} × ${exercise.target}` : exercise.target}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center text-slate-500">
          <button
            type="button"
            aria-label="Nach oben"
            disabled={isFirst}
            onClick={() => moveExercise(planId, blockId, exercise.id, -1)}
            className="rounded p-1.5 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-25"
          >
            <Icon name="up" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Nach unten"
            disabled={isLast}
            onClick={() => moveExercise(planId, blockId, exercise.id, 1)}
            className="rounded p-1.5 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-25"
          >
            <Icon name="down" className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={expanded ? 'Bearbeiten schließen' : 'Übung bearbeiten'}
            onClick={onToggle}
            className={clsx('rounded p-1.5 hover:bg-slate-800 hover:text-slate-100', expanded && 'text-orange-400')}
          >
            <Icon name="pencil" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 px-4 pt-1 pb-4">
          <Field label="Name">
            <input className="field font-medium" value={exercise.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Sätze">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={20}
                className="field"
                value={exercise.sets}
                onChange={(e) => set({ sets: Math.max(0, Math.min(20, Number(e.target.value) || 0)) })}
              />
            </Field>
            <Field label="Ziel">
              <input
                className="field"
                placeholder="8–12"
                value={exercise.target}
                onChange={(e) => set({ target: e.target.value })}
              />
            </Field>
            <Field label="Pause (Sek.)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="field"
                placeholder="–"
                value={exercise.restSec ?? ''}
                onChange={(e) =>
                  set({ restSec: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </Field>
          </div>

          <Field label="Hinweis">
            <textarea
              className="field resize-none"
              rows={2}
              value={exercise.note}
              onChange={(e) => set({ note: e.target.value })}
            />
          </Field>

          <Field label="Tutorial-Link">
            <input
              className="field"
              placeholder="https://hybridcalisthenics.com/…"
              value={exercise.link ?? ''}
              onChange={(e) => set({ link: e.target.value || undefined })}
            />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={exercise.optional}
                  onChange={(e) => set({ optional: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-orange-500"
                />
                Optional
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={exercise.hold}
                  onChange={(e) => set({ hold: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-orange-500"
                />
                Halte-Übung (Sek.)
              </label>
            </div>
            <Button size="sm" variant="danger" onClick={() => removeExercise(planId, blockId, exercise.id)}>
              <Icon name="trash" className="h-3.5 w-3.5" />
              Löschen
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotesSection({ plan, editing }: { plan: Plan; editing: boolean }) {
  const { updateNote, addNote, removeNote } = useStore()
  if (plan.notes.length === 0 && !editing) return null

  return (
    <section>
      <SectionTitle
        action={
          editing ? (
            <Button size="sm" variant="ghost" onClick={() => addNote(plan.id)}>
              <Icon name="plus" className="h-3.5 w-3.5" />
              Hinweis
            </Button>
          ) : undefined
        }
      >
        Hinweise
      </SectionTitle>
      <div className="card divide-y divide-slate-800">
        {plan.notes.map((note) =>
          editing ? (
            <div key={note.id} className="space-y-2 px-4 py-3">
              <div className="flex gap-2">
                <input
                  className="field flex-1"
                  value={note.label}
                  onChange={(e) => updateNote(plan.id, note.id, { label: e.target.value })}
                />
                <Button
                  size="sm"
                  variant="danger"
                  aria-label="Hinweis löschen"
                  onClick={() => removeNote(plan.id, note.id)}
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                </Button>
              </div>
              <textarea
                className="field resize-none"
                rows={2}
                value={note.text}
                onChange={(e) => updateNote(plan.id, note.id, { text: e.target.value })}
              />
            </div>
          ) : (
            <div key={note.id} className="px-4 py-3">
              <p className="text-xs font-semibold text-orange-400">{note.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{note.text}</p>
            </div>
          ),
        )}
      </div>
    </section>
  )
}
