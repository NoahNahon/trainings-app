/**
 * Persönliche Werte, die Berechnungen brauchen.
 *
 * Bewusst als Konstante und nicht in den bearbeitbaren Daten: das Körpergewicht
 * steht aus demselben Grund schon in `nutrition.ts`. Beides muss von Hand
 * nachgezogen werden, wenn es sich ändert.
 */

/** Zum Geburtstag anpassen — die Zone-2-Spanne hängt daran. */
export const ageYears = 26

export interface Zone2 {
  from: number
  to: number
  hrMax: number
}

/**
 * Zone 2 als Herzfrequenzspanne.
 *
 * `220 − Alter` ist die verbreitete Schätzung für den Maximalpuls, streut aber
 * individuell um etwa ±10–12 bpm; Zone 2 liegt bei 60–70 % davon. Die Spanne ist
 * deshalb ein Anhaltspunkt, kein Messwert — der Sprechtest bleibt vorrangig, und
 * ein gemessener HFmax oder die Zonen der Apple Watch schlagen beide.
 */
export function zone2Range(age = ageYears): Zone2 {
  const hrMax = 220 - age
  return { from: Math.round(hrMax * 0.6), to: Math.round(hrMax * 0.7), hrMax }
}
