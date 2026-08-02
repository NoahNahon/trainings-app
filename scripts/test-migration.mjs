// Prueft normalize() gegen echte v1-Payloads.
//
// Wozu: Auf dem Handy liegen geloggte Trainings im localStorage. Ein Update darf
// sie nicht verlieren und muss gleichzeitig die neuen Sportarten nachliefern.
// Beides ist per Hand kaum verlaesslich zu pruefen.
//
//   npm run test:migration

import { normalize, DATA_VERSION } from '../src/lib/migrate.ts'
import { seedPlans } from '../src/data/plans.ts'

let failed = 0
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  OK    ${name}`)
  } else {
    failed++
    console.log(`  FEHLT ${name}${detail ? ` – ${detail}` : ''}`)
  }
}

// --- Ein realistischer v1-Stand: zwei Plaene, ein geloggtes Training, ---
// --- ein vom Nutzer umbenannter Plan, keine sport-Felder irgendwo.    ---
const v1 = {
  version: 1,
  activePlanId: 'phase-1',
  plans: [
    {
      id: 'phase-1',
      name: 'Phase 1 – MEIN NAME',
      subtitle: 'selbst bearbeitet',
      weekdays: [3, 6],
      blocks: [
        {
          id: 'push',
          name: 'Push',
          duration: '',
          color: 'red',
          exercises: [
            { id: 'dips', name: 'Dips', sets: 4, target: '9–11', restSec: 90, note: 'angepasst', optional: false, hold: false },
          ],
        },
      ],
      notes: [{ id: 'n1', label: 'Eigene Notiz', text: 'nicht verlieren' }],
    },
    { id: 'phase-2', name: 'Phase 2 – Aufbau', subtitle: '', weekdays: [3, 6], blocks: [], notes: [] },
  ],
  sessions: [
    {
      id: 'session-alt',
      planId: 'phase-1',
      planName: 'Phase 1 – Trainingsplan',
      date: '2026-07-29',
      startedAt: '2026-07-29T17:00:00.000Z',
      finishedAt: '2026-07-29T18:05:00.000Z',
      entries: { dips: { sets: [{ done: true, value: '10' }], note: '' } },
      note: 'lief gut',
    },
  ],
  recipes: [{ id: 'r1', name: 'Overnight Oats', category: '', proteinG: 20, proteinLabel: '~20g', portions: '', time: '', mealPrep: '', tags: [], ingredients: [], steps: [], source: 'Rezeptbuch.pdf', favorite: true }],
}

console.log('\n=== v1-Stand mit geloggtem Training ===')
const out = normalize(v1)

check('Version auf ' + DATA_VERSION + ' gehoben', out.version === DATA_VERSION, `ist ${out.version}`)
check('Geloggtes Training erhalten', out.sessions.length === 1 && out.sessions[0].id === 'session-alt')
check('Saetze im Training unveraendert', out.sessions[0].entries.dips?.sets[0]?.value === '10')
check('Session hat sport bekommen', out.sessions[0].sport === 'calisthenics', `ist ${out.sessions[0].sport}`)
check('Notiz am Training erhalten', out.sessions[0].note === 'lief gut')

const p1 = out.plans.find((p) => p.id === 'phase-1')
check('Eigener Planname erhalten', p1?.name === 'Phase 1 – MEIN NAME', `ist ${p1?.name}`)
check('Eigene Uebungswerte erhalten', p1?.blocks[0]?.exercises[0]?.sets === 4 && p1?.blocks[0]?.exercises[0]?.target === '9–11')
check('Eigene Plannotiz erhalten', p1?.notes[0]?.text === 'nicht verlieren')
check('Plan hat sport bekommen', p1?.sport === 'calisthenics', `ist ${p1?.sport}`)

// Der eigentliche Zweck: die neuen Sportarten muessen nachgeliefert werden.
for (const id of ['bouldern', 'schwimmen', 'laufen', 'sauna', 'yoga']) {
  const added = out.plans.find((p) => p.id === id)
  check(`Neuer Plan "${id}" ergaenzt`, Boolean(added) && added.blocks.length > 0)
}
check('Alle sechs Sportarten vorhanden', new Set(out.plans.map((p) => p.sport)).size === 6,
  `sind ${[...new Set(out.plans.map((p) => p.sport))].join(', ')}`)
check('Reihenfolge folgt den Seeds', out.plans.slice(0, seedPlans.length).every((p, i) => p.id === seedPlans[i].id))
check('Favorit am Rezept erhalten', out.recipes[0]?.favorite === true)

console.log('\n=== Selbst angelegter Plan bleibt erhalten ===')
const withOwn = normalize({
  ...v1,
  plans: [...v1.plans, { id: 'mein-plan', name: 'Eigenes', subtitle: '', weekdays: [2], blocks: [], notes: [] }],
})
check('Eigener Plan noch da', withOwn.plans.some((p) => p.id === 'mein-plan'))
check('Eigener Plan am Ende', withOwn.plans[withOwn.plans.length - 1].id === 'mein-plan')
check('Eigener Plan bekam sport', withOwn.plans.find((p) => p.id === 'mein-plan')?.sport === 'calisthenics')

console.log('\n=== Kaputte und leere Staende ===')
const empty = normalize({})
check('Leeres Objekt ergibt vollen Seed', empty.plans.length === seedPlans.length && empty.sessions.length === 0)
check('activePlanId zeigt auf existierenden Plan', empty.plans.some((p) => p.id === empty.activePlanId))

const bogus = normalize({ plans: [], sessions: 'kaputt', recipes: null, activePlanId: 'gibt-es-nicht' })
check('Leere Planliste faellt auf Seed zurueck', bogus.plans.length === seedPlans.length)
check('Kaputte sessions werden zu []', Array.isArray(bogus.sessions) && bogus.sessions.length === 0)
check('Unbekannte activePlanId wird korrigiert', bogus.plans.some((p) => p.id === bogus.activePlanId),
  `ist ${bogus.activePlanId}`)

console.log('\n=== Wer gewinnt beim Update: Seed oder gespeicherter Plan? ===')

// Fall 1: Plan ohne Markierung (Stand vor dem Flag). Muss erhalten bleiben,
// weil eine damalige Bearbeitung keine Spur hinterlassen hat.
const legacy = normalize({
  ...v1,
  plans: [{ ...v1.plans[0], name: 'Von Hand umgebaut' }, v1.plans[1]],
})
check('Alter Stand ohne Markierung bleibt unangetastet',
  legacy.plans.find((p) => p.id === 'phase-1')?.name === 'Von Hand umgebaut')

// Fall 2: ausdruecklich bearbeitet. Darf nie ueberschrieben werden.
const edited = normalize({
  ...v1,
  plans: [{ ...v1.plans[0], name: 'Mein Umbau', userEdited: true }, v1.plans[1]],
})
check('Bearbeiteter Plan wird nicht ueberschrieben',
  edited.plans.find((p) => p.id === 'phase-1')?.name === 'Mein Umbau')

// Fall 3: ausdruecklich unbearbeitet. Hier soll die Korrektur ankommen.
const untouched = normalize({
  ...v1,
  plans: [
    { ...v1.plans[0], name: 'Veralteter Seed-Name', userEdited: false },
    { ...v1.plans[1], userEdited: false },
  ],
})
const refreshed = untouched.plans.find((p) => p.id === 'phase-1')
check('Unbearbeiteter Plan wird aus dem Seed aktualisiert',
  refreshed?.name === seedPlans[0].name, `ist ${refreshed?.name}`)
check('Aktualisierter Plan hat die vollen Bloecke', (refreshed?.blocks.length ?? 0) > 1)
check('Geloggtes Training bleibt trotz Plan-Aktualisierung erhalten', untouched.sessions.length === 1)

// Fall 4: Yin Yoga muss abhakbar sein, nicht in Minuten.
const yoga = normalize({}).plans.find((p) => p.id === 'yoga')
const yogaEx = yoga?.blocks[0]?.exercises[0]
check('Yin Yoga wird nur abgehakt', yogaEx?.metric === 'check', `ist ${yogaEx?.metric}`)

console.log('\n=== Zweimal migrieren aendert nichts mehr (idempotent) ===')
const once = normalize(v1)
const twice = normalize(structuredClone(once))
check('normalize ist idempotent', JSON.stringify(once) === JSON.stringify(twice))

console.log(
  failed === 0
    ? `\nOK – Migration bestanden, geloggte Trainings bleiben erhalten.\n`
    : `\n${failed} Pruefung(en) fehlgeschlagen.\n`,
)
process.exit(failed === 0 ? 0 : 1)
