import type { Block, Exercise, Plan } from '../types'

const HC = 'https://hybridcalisthenics.com'

/** Compact helper so the seed reads like the table in the PDF. */
function ex(
  id: string,
  name: string,
  sets: number,
  target: string,
  restSec: number | null,
  note: string,
  opts: { link?: string; optional?: boolean; hold?: boolean } = {},
): Exercise {
  return {
    id,
    name,
    sets,
    target,
    restSec,
    note,
    link: opts.link,
    optional: opts.optional ?? false,
    hold: opts.hold ?? false,
  }
}

function block(id: string, name: string, duration: string, color: Block['color'], exercises: Exercise[]): Block {
  return { id, name, duration, color, exercises }
}

/**
 * Phase 1, transcribed from Phase1_Trainingsplan_v3.pdf (27.07.).
 * That file supersedes the Mo/Fr schedule in Trainings_Lifestyle_Guide.pdf.
 */
export const phase1: Plan = {
  id: 'phase-1',
  name: 'Phase 1 – Trainingsplan',
  subtitle: 'Wochen 1–4 · Kern ca. 50–60 Min. · Ausgegraut = optional, wenn Zeit vorhanden',
  weekdays: [3, 6], // Mittwoch & Samstag
  blocks: [
    block('warmup', 'Warm-up', 'ca. 7–8 Min.', 'gray', [
      ex('wu-arm', 'Armkreisen', 0, '10× vor/zurück je Seite', null, 'Schultern mobilisieren'),
      ex('wu-shoulder', 'Schulterrotationen', 0, '10× je Richtung', null, 'Groß und kontrolliert'),
      ex('wu-hip', 'Hüftkreisen', 0, '10× je Seite', null, 'Rumpf locker lassen'),
      ex('wu-leg', 'Beinschwingen', 0, '10× vor/zurück + seitlich', null, 'Je Seite'),
      ex('wu-squat', 'Tiefe Kniebeuge', 0, '5× langsam', null, 'Unten kurz halten, Hüfte öffnen'),
      ex('wu-jj', 'Jumping Jacks', 0, '20 Wdh.', null, 'Puls steigern'),
    ]),
    block('push', 'Push – Drücken', 'ca. 13 Min.', 'red', [
      ex('dips', 'Dips', 3, '8–10', 90, 'Compound-Drücken – Brust und Trizeps. Kontrolliert ablassen (2–3 Sek.)', {
        link: `${HC}/dips`,
      }),
      ex('pushups', 'Liegestütze (normal)', 3, '8–12', 60, 'Fokus auf saubere Form und volle Tiefe. Ziel: 3 × 15 bis Ende Phase 1', {
        link: `${HC}/pushups`,
      }),
      ex('pushups-close', 'Enge Liegestütze', 2, '6–10', 60, 'Hände deutlich enger als schulterbreit, Ellenbogen bleiben am Körper – stärkt Trizeps gezielt', {
        link: `${HC}/pushups`,
        optional: true,
      }),
    ]),
    block('pull', 'Pull – Ziehen', 'ca. 12 Min.', 'blue', [
      ex('pullup', 'Pull-up / Chin-up (mit Band)', 3, '5–7', 90, 'Mi: Pull-up, Sa: Chin-up. Band = 5 kg Unterstützung. Schulterblätter ZUERST runterziehen, dann Arme', {
        link: `${HC}/pullups`,
      }),
      ex('row', 'Australian Row', 3, '10–12', 60, 'Horizontaler Zug – Schulterblatt-Stabilisatoren. Wichtig gegen Rückenprobleme und Schulterblockade', {
        link: `${HC}/pullups`,
      }),
    ]),
    block('grip', 'Grip – Griffkraft', 'ca. 8 Min.', 'purple', [
      ex('lean-hang', 'Lean Hangs (Stufe 1)', 3, '20–30 Sek.', 60, 'Stange in Hüfthöhe, nach hinten lehnen. Einstieg ohne volles Körpergewicht – schont das Handgelenk', {
        link: `${HC}/grip`,
        hold: true,
      }),
      ex('dead-hang', 'Bar Hangs / Dead Hang (Stufe 3)', 3, '20–30 Sek.', 60, 'Nur wenn Lean Hangs problemlos – volles Hängen. Wrist-Check: Kein Druckgefühl? Dann steigern', {
        link: `${HC}/grip`,
        hold: true,
      }),
    ]),
    block('legs', 'Beine – Unterkörper', 'ca. 12 Min.', 'green', [
      ex('squat', 'Kniebeuge', 3, '15', 60, 'Fersen evtl. leicht erhöht (Handtuch). Oberkörper darf sich neigen – Wirbelsäule muss neutral bleiben', {
        link: `${HC}/squats`,
      }),
      ex('lunge', 'Ausfallschritte', 3, '8 je Seite', 60, 'Kontrolliert, Oberkörper aufrecht, Knie über Zehen', {
        link: `${HC}/lunges`,
        optional: true,
      }),
      ex('glute-bridge', 'Glute Bridge', 3, '20', 45, 'Hüfte oben halten, Gesäß fest anspannen, 2 Sek. oben halten', {
        link: `${HC}/bridges`,
      }),
    ]),
    block('core', 'Core & Rücken – Rumpf', 'ca. 12 Min.', 'amber', [
      ex('hollow', 'Hollow Body Hold', 3, '20 Sek.', 60, 'Rücken flach, Beine angehoben. Grundlage für alle fortgeschrittenen Übungen', {
        hold: true,
      }),
      ex('plank', 'Plank', 2, '45 Sek.', 45, 'Gesäß aktiv anspannen – kein Hohlkreuz. Core immer zuletzt', { hold: true }),
      ex('side-plank', 'Side Plank', 2, '25 Sek.', 45, 'Je Seite – laterale Rumpfstabilität', {
        optional: true,
        hold: true,
      }),
      ex('straight-bridge', 'Straight Bridge', 3, '20', 45, 'Sitzend, Hände hinter dir, Hüfte hoch bis Körper gerade. Posterior Chain – gegen Rückenschmerzen', {
        link: `${HC}/straight-bridges`,
        optional: true,
      }),
      ex('leg-twist', 'Straight Leg Twist #1', 2, '40 Sek.', 45, 'Im Sitzen drehen, Beine gestreckt, beide Seiten. Besser nach Yin Yoga', {
        link: `${HC}/straight-leg-twists`,
        optional: true,
        hold: true,
      }),
    ]),
    block('cooldown', 'Cool-down', 'ca. 7–10 Min.', 'slate', [
      ex('cd-chest', 'Brust / Schulter-Stretch', 0, '30–40 Sek.', null, 'Arme hinter Rücken strecken und anheben. Kann auch auf dem Heimweg gemacht werden'),
      ex('cd-hip', 'Hüftbeuger-Stretch', 0, '30–40 Sek.', null, 'Ausfallschritt-Position, Oberkörper aufrecht – je Seite. Flexibel: vor Ort oder zu Hause'),
      ex('cd-child', "Child's Pose", 0, '60 Sek.', null, 'Knie breit, Arme gestreckt, 5 tiefe Atemzüge'),
      ex('cd-twist', 'Twist Hold', 0, '40 Sek.', null, 'Beide Seiten – als Abschluss-Dehnung'),
      ex('cd-forearm', 'Unterarm-Stretch', 0, '30 Sek.', null, 'Arm ausstrecken, Hand nach unten abknicken – je Seite. PRIORITÄT: vor Ort nach Grip-Übungen'),
      ex('cd-finger', 'Finger-Extension-Stretch', 0, '30 Sek.', null, 'Alle Finger gleichzeitig flach auf Oberfläche drücken – je Hand. Einzelne Finger nacharbeiten wenn Zeit'),
    ]),
  ],
  notes: [
    { id: 'n1', label: 'Pause zwischen Blöcken', text: '2 Min. zwischen Blöcken – Zeit zum Trinken und kurz durchatmen' },
    { id: 'n2', label: 'Handgelenk (rechts)', text: 'Bei jedem Grip-Satz prüfen: Druckgefühl? Sofort stoppen. Lean Hangs haben Priorität vor Dead Hangs' },
    { id: 'n3', label: 'Rücken bei Kniebeugen', text: 'Nur so tief gehen wie Wirbelsäule neutral bleibt. Fersen auf Handtuch erhöhen wenn Fersen sich heben' },
    { id: 'n4', label: 'Pull-up Schulter', text: 'Schulterblätter aktiv runterziehen BEVOR die Arme ziehen – löst den Blockade-Punkt beim Übergang' },
    { id: 'n5', label: 'Progression', text: 'Erst zur nächsten Stufe wenn alle Sätze mit sauberer Form erledigt sind – kein Zeitdruck' },
    { id: 'n6', label: 'Cool-down', text: 'Unterarm- und Finger-Stretch: direkt nach dem Training (Pflicht). Rest flexibel – Heimweg oder zu Hause' },
    { id: 'n7', label: 'HC Tutorials', text: 'Jede Übung mit Link zu hybridcalisthenics.com – dort Video-Tutorials für jede Stufe' },
  ],
}

/** Phase 2 from Trainings_Lifestyle_Guide.pdf — ready to switch to after week 4. */
export const phase2: Plan = {
  id: 'phase-2',
  name: 'Phase 2 – Aufbau',
  subtitle: 'Wochen 5–8 · Gleiche Struktur, schwerere Varianten · Exzentrik gezielt einsetzen',
  weekdays: [3, 6],
  blocks: [
    block('p2-warmup', 'Warm-up', 'ca. 7–8 Min.', 'gray', [
      ex('p2-wu-arm', 'Armkreisen', 0, '10× vor/zurück je Seite', null, 'Schultern mobilisieren'),
      ex('p2-wu-shoulder', 'Schulterrotationen', 0, '10× je Richtung', null, 'Groß und kontrolliert'),
      ex('p2-wu-hip', 'Hüftkreisen', 0, '10× je Seite', null, 'Rumpf locker lassen'),
      ex('p2-wu-leg', 'Beinschwingen', 0, '10× vor/zurück + seitlich', null, 'Je Seite'),
      ex('p2-wu-jj', 'Jumping Jacks', 0, '20 Wdh.', null, 'Puls steigern'),
    ]),
    block('p2-push', 'Push – Drücken', 'ca. 15 Min.', 'red', [
      ex('p2-pike', 'Pike Push-up (erhöht)', 3, '10–12', 90, 'Füße auf Stuhl – näher am Handstand Push-up', {
        link: `${HC}/pushups`,
      }),
      ex('p2-dips', 'Dips', 3, '10–12', 90, 'Langsam ablassen (3 Sek.) für mehr Reiz', { link: `${HC}/dips` }),
      ex('p2-archer', 'Archer Push-up', 3, '6–8 je Seite', 90, 'Asymmetrisch – Vorstufe zum einarmigen Liegestütz', {
        link: `${HC}/pushups`,
      }),
    ]),
    block('p2-pull', 'Pull – Ziehen', 'ca. 13 Min.', 'blue', [
      ex('p2-pullup', 'Pull-up (langsam)', 3, '5–6', 90, '5 Sek. ablassen – exzentrische Belastung', {
        link: `${HC}/pullups`,
      }),
      ex('p2-row', 'Australian Row', 3, '12–15', 60, 'Füße erhöht für mehr Schwierigkeit', { link: `${HC}/pullups` }),
    ]),
    block('p2-grip', 'Grip – Griffkraft', 'ca. 8 Min.', 'purple', [
      ex('p2-hang', 'Dead Hang', 3, '30–45 Sek.', 60, 'Handgelenk-Check bleibt Pflicht – bei Druckgefühl zurück zu Lean Hangs', {
        link: `${HC}/grip`,
        hold: true,
      }),
    ]),
    block('p2-legs', 'Beine – Unterkörper', 'ca. 14 Min.', 'green', [
      ex('p2-bulgarian', 'Bulgarian Split Squat', 3, '8–10 je Seite', 60, 'Hinterer Fuß auf Stuhl – Gleichgewicht + Kraft', {
        link: `${HC}/squats`,
      }),
      ex('p2-jump-lunge', 'Sprung-Ausfallschritte', 3, '8 je Seite', 60, 'Explosiv – Kraft und Koordination', {
        link: `${HC}/lunges`,
      }),
      ex('p2-glute', 'Glute Bridge einbeinig', 3, '12 je Seite', 45, 'Ein Bein gestreckt halten', {
        link: `${HC}/bridges`,
      }),
    ]),
    block('p2-core', 'Core & Rücken – Rumpf', 'ca. 12 Min.', 'amber', [
      ex('p2-hollow', 'Hollow Body Hold', 3, '40 Sek.', 60, 'Auf 40–45 Sek. steigern', { hold: true }),
      ex('p2-side-plank', 'Side Plank + Rotation', 2, '30 Sek.', 45, 'Hüfte heben und senken im Rhythmus', {
        hold: true,
      }),
      ex('p2-lsit', 'L-Sit Vorbereitung', 3, '10–15 Sek.', 60, 'Zwischen Stühlen: Knie anziehen, dann strecken', {
        hold: true,
      }),
    ]),
    block('p2-cooldown', 'Cool-down', 'ca. 7–10 Min.', 'slate', [
      ex('p2-cd-chest', 'Brust / Schulter-Stretch', 0, '30–40 Sek.', null, 'Arme hinter Rücken strecken und anheben'),
      ex('p2-cd-hip', 'Hüftbeuger-Stretch', 0, '30–40 Sek.', null, 'Je Seite'),
      ex('p2-cd-forearm', 'Unterarm-Stretch', 0, '30 Sek.', null, 'PRIORITÄT: direkt nach den Grip-Übungen'),
      ex('p2-cd-finger', 'Finger-Extension-Stretch', 0, '30 Sek.', null, 'Je Hand'),
    ]),
  ],
  notes: [
    { id: 'p2-n1', label: 'Reihenfolge-Prinzip', text: 'Schwierigste Übungen zuerst (wenn frisch) · Push/Pull abwechseln möglich · Core immer zuletzt' },
    { id: 'p2-n2', label: 'Exzentrik', text: 'Langsames Ablassen ist in Phase 2 der Hauptreiz – 3–5 Sek. pro Wiederholung' },
    { id: 'p2-n3', label: 'Bouldern am Folgetag', text: 'Zugvolumen bewusst moderat halten – Finger und Rücken brauchen Reserven für die Halle' },
  ],
}

/** Long-term progressions from the guide — shown read-only under "Mehr". */
export const progressions = [
  { from: 'Liegestütz → Archer Push-up → Einarmiger Liegestütz', how: 'Asymmetrische Belastung schrittweise erhöhen' },
  { from: 'Pike Push-up → Pike Push-up erhöht → Handstand Push-up an der Wand', how: 'Schulterwinkel schrittweise steiler machen' },
  { from: 'Pull-up → Langsames Ablassen → Weighted Pull-up', how: 'Exzentrische Phase und Zusatzgewicht' },
  { from: 'Kniebeuge → Bulgarian Split Squat → Pistol Squat', how: 'Einbeinige Variante als Endziel' },
  { from: 'Plank → Hollow Body Hold → L-Sit', how: 'Von statischer Spannung zur komprimierten Form' },
  { from: 'Dips → Ring Dips → Weighted Dips', how: 'Instabilität durch Ringe erhöht die Anforderung' },
]

export const longTermGoals = [
  'Pistol Squat – einbeinige Kniebeuge, klassisches Calisthenics-Beinziel',
  'L-Sit – Beine gestreckt halten zwischen zwei Stühlen oder am Boden',
  'Handstand Push-up – über erhöhte Pike Push-ups erreichbar',
  'Muscle-Up – Kombination aus Pull-up und Dip, langfristiges Highlight',
  'Einarmiger Liegestütz – über Archer Push-up Progression',
]

export const seedPlans: Plan[] = [phase1, phase2]
