import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { boosters, bodyWeightKg, dayExamples, dayTypes, mealOptions } from '../data/nutrition'
import { longTermGoals, progressions } from '../data/plans'
import { Button, Chip, Icon, SectionTitle } from '../components/ui'
import { ImportPanel } from './ImportPanel'
import { clsx, plural, todayKey } from '../lib/util'

type Tab = 'nutrition' | 'progress' | 'data'

export function MorePage() {
  const [tab, setTab] = useState<Tab>('nutrition')

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-50">Mehr</h1>

      <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        {(
          [
            ['nutrition', 'Ernährung'],
            ['progress', 'Progression'],
            ['data', 'Daten'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={clsx(
              'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
              tab === value ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'nutrition' && <NutritionTab />}
      {tab === 'progress' && <ProgressionTab />}
      {tab === 'data' && <DataTab />}
    </div>
  )
}

function NutritionTab() {
  const [meal, setMeal] = useState<string | null>(null)
  const meals = [...new Set(mealOptions.map((m) => m.meal))]
  const shown = meal ? mealOptions.filter((m) => m.meal === meal) : mealOptions

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Protein-Leitfaden · {bodyWeightKg} kg</SectionTitle>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          Kein starrer Plan – sondern Optionen. Je nach Tagestyp brauchst du unterschiedlich viel Protein. Wähle deine
          Mahlzeiten flexibel und kombiniere sie so, dass du dein Tagesziel erreichst.
        </p>
        <div className="space-y-2">
          {dayTypes.map((d) => (
            <div key={d.name} className="card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">{d.name}</h3>
                <span className="shrink-0 rounded-lg bg-orange-500/15 px-2 py-0.5 text-sm font-bold tabular-nums text-orange-300">
                  {d.proteinTarget}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{d.activity}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{d.recommendation}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Bausteine für deinen Tag</SectionTitle>
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          <Pill active={meal === null} onClick={() => setMeal(null)}>
            Alle
          </Pill>
          {meals.map((m) => (
            <Pill key={m} active={meal === m} onClick={() => setMeal(meal === m ? null : m)}>
              {m}
            </Pill>
          ))}
        </div>
        <div className="card divide-y divide-slate-800">
          {shown.map((m, i) => (
            <div key={i} className="flex items-baseline gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-100">{m.option}</p>
                <p className="text-[11px] text-slate-500">
                  {m.meal}
                  {m.note && ` · ${m.note}`}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-orange-300">{m.protein}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {dayExamples.map((e) => (
            <div key={e.label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-[11px] font-semibold text-emerald-400">{e.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{e.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Schnelle Proteinbooster</SectionTitle>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          Wenn ein Gericht nicht genug Protein liefert – besonders an Krafttagen – reicht meist eine kleine Ergänzung
          um die Lücke zu schließen.
        </p>
        <div className="card divide-y divide-slate-800">
          {boosters.map((b) => (
            <div key={b.name} className="flex items-baseline gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-100">{b.name}</p>
                <p className="text-[11px] text-slate-500">{b.when}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-400">{b.protein}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-orange-500 bg-orange-500/15 text-orange-300' : 'border-slate-700 text-slate-400',
      )}
    >
      {children}
    </button>
  )
}

function ProgressionTab() {
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Langfristige Progression</SectionTitle>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          Erst zur nächsten Stufe, wenn die aktuelle sauber und kontrolliert sitzt.
        </p>
        <div className="card divide-y divide-slate-800">
          {progressions.map((p) => (
            <div key={p.from} className="px-4 py-3">
              <p className="text-sm leading-snug font-medium text-slate-100">{p.from}</p>
              <p className="mt-1 text-xs text-slate-500">{p.how}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Langfristige Ziele</SectionTitle>
        <ul className="card divide-y divide-slate-800">
          {longTermGoals.map((goal) => (
            <li key={goal} className="flex gap-2.5 px-4 py-3">
              <Icon name="star" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span className="text-sm leading-snug text-slate-200">{goal}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/**
 * Install instructions that tell the truth about the current origin.
 *
 * Service workers need a secure context, so over plain http://192.168.x.x the
 * app can be added to the home screen but will NOT work offline — it reloads
 * from the Mac every time. Promising offline there would be a lie.
 */
function InstallSection() {
  const secure = typeof window !== 'undefined' && window.isSecureContext
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Registered controller = the service worker is actually caching this app.
    void navigator.serviceWorker?.getRegistration().then((reg) => setInstalled(Boolean(reg?.active)))
  }, [])

  return (
    <section className="space-y-3">
      <SectionTitle>Auf dem Handy installieren</SectionTitle>
      <div className="card space-y-3 p-4 text-xs leading-relaxed text-slate-400">
        <p>
          <span className="font-semibold text-slate-200">iPhone:</span> in Safari öffnen → Teilen-Symbol → „Zum
          Home-Bildschirm“.
        </p>
        <p>
          <span className="font-semibold text-slate-200">Android:</span> in Chrome öffnen → Menü → „App installieren“.
        </p>

        {secure ? (
          <p
            className={clsx(
              'rounded-lg border px-3 py-2',
              installed
                ? 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
                : 'border-slate-700 bg-slate-950/50 text-slate-400',
            )}
          >
            {installed
              ? 'Offline-Betrieb aktiv – die App funktioniert auch ohne Internet, z.B. im Fitnessstudio.'
              : 'Diese Adresse ist sicher (HTTPS). Nach dem ersten vollständigen Laden funktioniert die App auch offline.'}
          </p>
        ) : (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-300/90">
            <span className="font-semibold">Achtung – hier kein Offline-Betrieb.</span> Diese Adresse läuft über
            HTTP; Browser erlauben Offline-Speicherung nur über HTTPS. Die App lässt sich zwar zum Home-Bildschirm
            hinzufügen, lädt aber jedes Mal neu vom Mac – funktioniert also nur zu Hause im selben Netz. Für echten
            Offline-Betrieb muss die App auf einem HTTPS-Host liegen.
          </p>
        )}
      </div>
    </section>
  )
}

function DataTab() {
  const { data, exportJson, importJson, resetAll } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  function download() {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trainings-app-backup-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ kind: 'ok', text: 'Backup heruntergeladen.' })
  }

  async function restore(file: File) {
    try {
      importJson(await file.text())
      setMessage({ kind: 'ok', text: 'Backup geladen.' })
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Datei konnte nicht gelesen werden.' })
    }
  }

  return (
    <div className="space-y-6">
      <ImportPanel />

      <section className="space-y-3">
        <SectionTitle>Backup</SectionTitle>
        <div className="card space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Chip>{plural(data.plans.length, 'Plan', 'Pläne')}</Chip>
            <Chip>{plural(data.sessions.filter((s) => s.finishedAt).length, 'Training', 'Trainings')}</Chip>
            <Chip>{plural(data.recipes.length, 'Rezept', 'Rezepte')}</Chip>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Alle Daten liegen nur in diesem Browser. Für einen Wechsel aufs Handy oder als Sicherung: exportieren und
            dort wieder laden.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void restore(file)
              e.target.value = ''
            }}
          />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={download}>
              Exportieren
            </Button>
            <Button className="flex-1" onClick={() => fileRef.current?.click()}>
              Importieren
            </Button>
          </div>
          {message && (
            <p
              className={clsx(
                'rounded-lg border px-3 py-2 text-xs',
                message.kind === 'ok'
                  ? 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
                  : 'border-red-900 bg-red-950/50 text-red-300',
              )}
            >
              {message.text}
            </p>
          )}
        </div>
      </section>

      <InstallSection />

      <section className="space-y-3">
        <SectionTitle>Zurücksetzen</SectionTitle>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (confirm('Alles auf den Ausgangszustand zurücksetzen? Trainings-Verlauf und Änderungen am Plan gehen verloren.')) {
              resetAll()
              setMessage({ kind: 'ok', text: 'Auf Ausgangszustand zurückgesetzt.' })
            }
          }}
        >
          <Icon name="trash" className="h-4 w-4" />
          Alle Daten zurücksetzen
        </Button>
      </section>
    </div>
  )
}
