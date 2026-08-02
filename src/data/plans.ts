import type { Block, Exercise, Plan, SetMetric } from '../types'
import { zone2Range } from './profile.ts'

const HC = 'https://hybridcalisthenics.com'

/** Compact helper so the seed reads like the table in the PDF. */
function ex(
  id: string,
  name: string,
  sets: number,
  target: string,
  restSec: number | null,
  note: string,
  opts: { link?: string; optional?: boolean; hold?: boolean; metric?: SetMetric } = {},
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
    metric: opts.metric,
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
  sport: 'calisthenics',
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
  sport: 'calisthenics',
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

/**
 * Bouldern, Mi & Sa. Warm-up and cool-down are transcribed from
 * Sport_und_Ernaehrungsplan_DE_v2.pdf, Teil 6 — including the "Pflicht!" marker
 * on the finger stretch. The main part is deliberately empty: problems get
 * logged individually in the workout view, because you don't know in advance
 * which ones the gym has set.
 */
export const bouldern: Plan = {
  id: 'bouldern',
  sport: 'bouldern',
  name: 'Bouldern',
  subtitle: 'Mi & Sa · Haupttag zusammen mit Calisthenics · Level 1–8 der Halle',
  weekdays: [3, 6],
  blocks: [
    block('bo-warmup', 'Warm-up', 'ca. 10 Min.', 'gray', [
      ex('bo-wrist', 'Handgelenksrotationen', 0, '10× je Richtung', null, 'Beide Handgelenke – Gelenke aufwärmen'),
      ex('bo-forearm', 'Unterarmkreisen', 0, '10× je Richtung', null, 'Arme ausgestreckt, große Kreise'),
      ex('bo-fingers', 'Finger mobilisieren', 0, '5–10 Sek. je Finger', null, 'Jeden Finger einzeln strecken, beugen und kreisen'),
      ex('bo-traverse', 'Leichtes Traversieren', 0, '5 Min.', null, 'Einfachste Griffe, ohne Krafteinsatz – Gewebe aufwärmen', {
        metric: 'minutes',
      }),
    ]),
    block('bo-main', 'Boulder', 'Hauptteil', 'purple', [
      ex('bo-problems', 'Boulder', 0, 'nach Gefühl', null, 'Jeden Boulder unten einzeln eintragen: Level, Versuche, geschafft. Erst auf aufgewärmte Finger harte Züge und Overhänge'),
    ]),
    block('bo-cooldown', 'Cool-down', 'ca. 5 Min.', 'slate', [
      ex('bo-cd-finger', 'Finger-Extension-Stretch', 0, '30 Sek. je Hand', null, 'PFLICHT: Handfläche auf flache Fläche drücken, Finger gestreckt'),
      ex('bo-cd-forearm', 'Unterarm-Stretch', 0, '30 Sek. je Seite', null, 'Arm ausstrecken, Hand nach unten abknicken lassen'),
      ex('bo-cd-shoulder', 'Schulter Cross-Stretch', 0, '30 Sek. je Seite', null, 'Arm vor der Brust, mit der anderen Hand heranziehen'),
      ex('bo-cd-flexion', 'Handgelenk-Flexion', 0, '30 Sek. je Seite', null, 'Arm ausstrecken, Hand nach oben abknicken'),
    ]),
  ],
  notes: [
    { id: 'bo-n1', label: 'Finger nie kalt', text: 'Niemals kalt in harte Züge gehen – Finger sind das kritischste. Erst nach 5 Min. Traversieren an Routen' },
    { id: 'bo-n2', label: 'Reihenfolge am Haupttag', text: 'Bouldern vor Calisthenics: Technik braucht frische Finger und einen wachen Kopf, Kraft geht auch müde' },
    { id: 'bo-n3', label: 'Level 1–8', text: '1 = leicht, 8 = schwer. Fortschritt zeigt sich am schwersten geschafften Boulder pro Session, nicht an der Menge' },
    { id: 'bo-n4', label: 'Cool-down', text: 'Finger-Extension ist im Plan als Pflicht markiert – direkt in der Halle, nicht erst zu Hause' },
  ],
}

/**
 * Schwimmen, Mo & Fr. The plan calls these days "aktive Erholung", so the
 * volume stays low on purpose. Structure reflects the current state: breast
 * stroke carries the endurance part, front crawl appears only as technique
 * drills over 25 m — short enough that form doesn't fall apart.
 */
export const schwimmen: Plan = {
  id: 'schwimmen',
  sport: 'schwimmen',
  name: 'Schwimmen',
  subtitle: 'Mo & Fr · Aktive Erholung · Brust als Basis, Kraul als Technik',
  weekdays: [1, 5],
  blocks: [
    block('sw-land', 'Warm-up an Land', 'ca. 2–3 Min.', 'gray', [
      ex('sw-arms', 'Armkreisen', 0, '10× vor/zurück', null, 'Schultern mobilisieren'),
      ex('sw-neck', 'Nackenrollen', 0, 'langsam, 5× je Seite', null, 'Ohne Druck, nur Mobilisation'),
      ex('sw-shoulder', 'Schulterrotationen', 0, '10× je Richtung', null, 'Groß und kontrolliert'),
    ]),
    block('sw-in', 'Einschwimmen', 'ca. 5 Min.', 'blue', [
      ex('sw-easy', 'Locker einschwimmen', 2, '50 m', 30, 'Bewusst langsam, Technikschwerpunkt – nicht ins Schwimmen stürzen', {
        metric: 'meters',
      }),
    ]),
    block('sw-technique', 'Kraul-Technik', 'ca. 15 Min.', 'purple', [
      ex('sw-kick', 'Beinschlag mit Brett', 4, '25 m', 30, 'Aus der Hüfte, Knie fast gestreckt, Füße locker. Kopf im Wasser', {
        metric: 'meters',
      }),
      ex('sw-onearm', 'Einarmiges Kraul', 4, '25 m', 30, 'Zwei Bahnen je Arm. Der ruhende Arm bleibt vorne gestreckt – zeigt sofort, wo der Zug schlampig wird', {
        metric: 'meters',
      }),
      ex('sw-breath', 'Seitliche Atmung', 4, '25 m', 30, 'Kopf rollt mit dem Körper, ein Auge bleibt im Wasser. Ausatmen unter Wasser, nicht anhalten', {
        metric: 'meters',
      }),
      ex('sw-full', 'Kraul komplett', 2, '25 m', 45, 'Nur solange die Technik hält. Wird der Zug hektisch: abbrechen, das übt sonst Fehler ein', {
        metric: 'meters',
        optional: true,
      }),
    ]),
    block('sw-main', 'Hauptteil Brust', 'ca. 15 Min.', 'green', [
      ex('sw-breast', 'Brust locker', 6, '50 m', 30, 'Gleichmäßig, Atmung ruhig. Aktive Erholung heißt: du könntest jederzeit noch eine Bahn dranhängen', {
        metric: 'meters',
      }),
    ]),
    block('sw-out', 'Ausschwimmen', 'ca. 3 Min.', 'slate', [
      ex('sw-cool', 'Ganz locker', 2, '50 m', null, 'Rückenlage oder Brust im Zeitlupentempo – Schultern ausschütteln', {
        metric: 'meters',
      }),
    ]),
  ],
  notes: [
    { id: 'sw-n1', label: 'Mo und Fr sind Erholung', text: 'Diese Einheiten liegen zwischen den Haupttagen Mi und Sa. Wenn du danach müde bist, war es zu viel – dann Umfang kürzen, nicht Technik' },
    { id: 'sw-n2', label: 'Kraul lernen', text: 'Technik entsteht über kurze Strecken mit Pause, nicht über Ausdauer. 25 m sind lang genug, um etwas zu üben, und kurz genug, dass die Form hält' },
    { id: 'sw-n3', label: 'Warm-up im Wasser', text: 'Der Plan sieht die ersten 2–3 Bahnen langsam mit Technikschwerpunkt vor – das ist das eigentliche Warm-up' },
    { id: 'sw-n4', label: 'Trinken', text: 'Im Wasser merkst du das Schwitzen nicht. Der Plan rechnet mit +0,5 L Mehrbedarf' },
  ],
}

/**
 * Zone 2 Laufen, So. No heart-rate numbers here on purpose: Zone 2 depends on
 * maximum heart rate, and nothing in the source documents states an age or a
 * measured HRmax. The talk test is the honest instruction; the watch's own zone
 * display can be used as a cross-check.
 */
export const laufen: Plan = {
  id: 'laufen',
  sport: 'laufen',
  name: 'Zone 2 Laufen',
  subtitle: 'So · Leichter Wochenabschluss · Puls niedrig halten',
  weekdays: [0],
  blocks: [
    block('lf-warmup', 'Warm-up', 'ca. 7 Min.', 'gray', [
      ex('lf-walk', 'Zügig gehen', 0, '5 Min.', null, 'Kreislauf hochfahren, bevor der erste Laufschritt kommt', {
        metric: 'minutes',
      }),
      ex('lf-hip', 'Hüftkreisen', 0, '10× je Seite', null, 'Rumpf locker halten'),
      ex('lf-swing', 'Beinschwingen', 0, '10× je Seite', null, 'Vor/zurück und seitlich'),
    ]),
    block('lf-main', 'Hauptteil', '30–40 Min.', 'green', [
      ex('lf-zone2', 'Zone 2 Dauerlauf', 1, '30–40 Min.', null, 'Sprechtest: du musst ganze Sätze sprechen können, ohne nach Luft zu schnappen. Geht das nicht mehr, ist es zu schnell – dann gehen, bis der Puls fällt', {
        metric: 'minutes',
      }),
    ]),
    block('lf-cooldown', 'Cool-down', 'ca. 8 Min.', 'slate', [
      ex('lf-walkout', 'Auslaufen / Gehen', 0, '5 Min.', null, 'Nicht abrupt stehen bleiben', { metric: 'minutes' }),
      ex('lf-quad', 'Oberschenkel-Stretch', 0, '30 Sek. je Seite', null, 'Im Stehen Ferse zum Gesäß ziehen'),
      ex('lf-calf', 'Wadenstretch', 0, '30 Sek. je Seite', null, 'Hinteres Bein gestreckt, Ferse am Boden'),
      ex('lf-hipflex', 'Hüftbeuger-Stretch', 0, '30–40 Sek. je Seite', null, 'Ausfallschritt, Becken nach vorne schieben'),
    ]),
  ],
  notes: [
    {
      id: 'lf-n1',
      label: 'Zone 2 in Zahlen',
      text: `Bei 26 Jahren ergibt die Schätzung 220 − Alter einen Maximalpuls von ${zone2Range().hrMax}, Zone 2 liegt bei 60–70 % davon: ca. ${zone2Range().from}–${zone2Range().to} bpm. Die Formel streut individuell um ±10–12 bpm, ist also ein Anhaltspunkt und kein Messwert. Widersprechen sich Zahl und Sprechtest, gilt der Sprechtest – und die Zonen deiner Apple Watch schlagen beides`,
    },
    { id: 'lf-n2', label: 'Werte eintragen', text: 'Distanz, Zeit und Ø-Puls nach dem Lauf von der Apple Watch ablesen und im Training-Tab eintragen. Die App kann Apple Health nicht auslesen – Websites haben keinen Zugriff darauf' },
    { id: 'lf-n3', label: 'Langsam ist der Sinn', text: 'Zone 2 wirkt über Dauer, nicht Intensität. Der Reiz sitzt in der Grundlagenausdauer – schneller laufen macht die Einheit schlechter, nicht besser' },
    { id: 'lf-n4', label: 'Danach Sauna', text: 'Der Plan kombiniert Sonntag mit Sauna als Wochenabschluss. Vorher trinken, die Sauna kostet noch mal 0,5–1 L' },
  ],
}

/**
 * Sauna, Di / Do / So. The nine steps are the "Optimale Reihenfolge" table from
 * Teil 4 of the PDF, unchanged. Step 9 is marked optional because the source
 * explicitly says to leave 90 °C out for now.
 */
export const sauna: Plan = {
  id: 'sauna',
  sport: 'sauna',
  name: 'Sauna',
  subtitle: 'Di, Do & So · Erholung & Regeneration · 2–3 Gänge reichen',
  weekdays: [2, 4, 0],
  blocks: [
    block('sa-start', 'Vorbereitung', 'ca. 3 Min.', 'gray', [
      ex('sa-shower', 'Duschen', 1, '2–3 Min.', null, 'Kurz warm, dann kalt – bereitet den Körper vor', { metric: 'minutes' }),
    ]),
    block('sa-rounds', 'Gänge', 'ca. 90–120 Min.', 'amber', [
      ex('sa-infrared', 'Infrarot-Kabine', 1, '15–20 Min.', null, '40–60 °C. Wärmt das Gewebe sanft vor, wirkt tiefer in die Muskulatur als klassische Sauna – besonders wertvoll nach Bouldern', {
        metric: 'minutes',
      }),
      ex('sa-60', '60 oder 70 °C', 1, '10–15 Min.', null, 'Erster klassischer Gang, Körper gewöhnt sich an die Hitze', {
        metric: 'minutes',
      }),
      ex('sa-cool1', 'Abkühlung + Pause', 1, '15–20 Min.', null, 'Kalte Dusche oder Tauchbecken, dann Wasser trinken. Hier findet die Regeneration statt', {
        metric: 'minutes',
      }),
      ex('sa-80', '80 °C', 1, '10–15 Min.', null, 'Zweiter Gang, höhere Intensität', { metric: 'minutes' }),
      ex('sa-cool2', 'Abkühlung + Pause', 1, '15–20 Min.', null, 'Wie zuvor – mindestens 15 Min.', { metric: 'minutes' }),
      ex('sa-steam', 'Dampfbad', 1, '10–15 Min.', null, '45–50 °C bei 100 % Luftfeuchtigkeit – gut für die Atemwege', {
        metric: 'minutes',
      }),
      ex('sa-cool3', 'Abkühlung + längere Pause', 1, '20–25 Min.', null, 'Vor einem eventuellen letzten Gang gut erholen', {
        metric: 'minutes',
        optional: true,
      }),
      ex('sa-90', '90 °C', 1, '8–12 Min.', null, 'Im Plan als "vorerst weglassen" markiert: für Stressabbau sind niedrigere Temperaturen mit mehr Pausen effektiver. Nur wenn du dich wirklich fit fühlst', {
        metric: 'minutes',
        optional: true,
      }),
    ]),
  ],
  notes: [
    { id: 'sa-n1', label: 'Von mild zu heiß', text: 'Grundregel des Ablaufs: Körper schrittweise steigern. Infrarot zuerst, nicht zuletzt' },
    { id: 'sa-n2', label: 'Pausen sind der Punkt', text: 'Mindestens 15–20 Min. zwischen den Gängen. Die Erholung passiert in der Pause, nicht in der Hitze' },
    { id: 'sa-n3', label: 'Flüssigkeit', text: '0,5–1 L Verlust pro Gang. Wasser oder Elektrolytgetränk, kein Alkohol. Danach Ingwer-Zitronenwasser' },
    { id: 'sa-n4', label: 'Essen', text: 'Nicht nüchtern, nicht direkt nach einer großen Mahlzeit – ideal 1–2 h nach einer leichten Mahlzeit' },
    { id: 'sa-n5', label: 'Zwei bis drei Gänge', text: 'Mehr bringt für die Erholung nichts. Die letzten beiden Schritte sind deshalb als optional markiert' },
  ],
}

/** Yin Yoga, Do 11 Uhr — a fixed class, so the plan only frames it. */
export const yoga: Plan = {
  id: 'yoga',
  sport: 'yoga',
  name: 'Yin Yoga',
  subtitle: 'Do 11 Uhr · Fixer Kurs · Erholungstag nach dem Haupttag Mi',
  weekdays: [4],
  blocks: [
    block('yo-class', 'Kurs', '60 Min.', 'slate', [
      // Nur abhaken: die Kurslänge ist immer 60 Min., ein Zahlenfeld waere eine
      // Frage, deren Antwort schon feststeht.
      ex('yo-session', 'Kurs besucht', 1, '60 Min.', null, 'Fixer Termin donnerstags 11 Uhr. Passiv halten, nicht in die Dehnung arbeiten', {
        metric: 'check',
      }),
    ]),
  ],
  notes: [
    { id: 'yo-n1', label: 'Warum Donnerstag passt', text: 'Direkt nach dem Haupttag Mittwoch. Löst passiv, was sich beim Bouldern und Calisthenics angesammelt hat – im Grunde ein Cool-down für die ganze Woche' },
    { id: 'yo-n2', label: 'Wirkung auf den Schlaf', text: 'Yin Yoga und Sauna aktivieren das parasympathische Nervensystem – messbarer Einfluss auf die Schlafqualität. Deshalb Do als Erholungstag ideal positioniert' },
    { id: 'yo-n3', label: 'Danach Sauna', text: 'Der Plan koppelt Do an einen Saunabesuch. Reihenfolge: erst Yoga, dann Sauna' },
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

/**
 * Order matters: it drives the sport picker. Calisthenics and Bouldern first
 * because they are the two Haupttage, then the active-recovery days, then
 * the pure recovery ones.
 */
export const seedPlans: Plan[] = [phase1, phase2, bouldern, schwimmen, laufen, sauna, yoga]
