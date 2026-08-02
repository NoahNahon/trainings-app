import type { Booster, DayType, MealOption } from '../types'

/** Protein guide from Rezeptbuch.pdf, page 1. Reference weight: 68 kg. */
export const bodyWeightKg = 68

export const dayTypes: DayType[] = [
  {
    name: 'Krafttag',
    activity: 'Calisthenics, Bouldern',
    proteinTarget: '95–115g',
    recommendation: 'Hähnchen, Pute, Makrele, Sardinen – oder plant-based + Proteinboost',
  },
  {
    name: 'Ausdauertag',
    activity: 'Schwimmen',
    proteinTarget: '80–95g',
    recommendation: 'Mix aus allen Gerichten, mittlere Portionen',
  },
  {
    name: 'Zone-2-Tag',
    activity: 'Joggen (leicht)',
    proteinTarget: '68–82g',
    recommendation: 'Plant-based Gerichte vollkommen ausreichend',
  },
  {
    name: 'Erholungstag',
    activity: 'Yin Yoga, Sauna',
    proteinTarget: '68–82g',
    recommendation: 'Leichte Mahlzeiten, kein Druck auf Protein-Ziel',
  },
]

export const mealOptions: MealOption[] = [
  { meal: 'Frühstück', option: 'Overnight Oats', protein: '~20g', note: '' },
  { meal: 'Frühstück', option: 'Vollkornbrot + 2 Eier', protein: '~18g', note: '' },
  { meal: 'Frühstück', option: 'Vollkornbrot + Quark (200g)', protein: '~22g', note: '' },
  { meal: 'Frühstück', option: 'Griechischer Joghurt + Beeren', protein: '~15g', note: '' },
  { meal: 'Mittagessen', option: 'Hähnchen-Bowl / Puten-Blech', protein: '~40–45g', note: 'Ideal für Krafttage' },
  { meal: 'Mittagessen', option: 'Pasta mit Hähnchen', protein: '~35g', note: '' },
  { meal: 'Mittagessen', option: 'Spaghetti Bolognese (Pute)', protein: '~38g', note: 'Rotwein + Parmesan' },
  { meal: 'Mittagessen', option: 'Makrele + Reis', protein: '~35g', note: '' },
  { meal: 'Mittagessen', option: 'Sardinen auf Brot', protein: '~22g', note: '' },
  { meal: 'Mittagessen', option: 'Kichererbsen-Curry', protein: '~18g', note: 'An Krafttagen +Ei' },
  { meal: 'Mittagessen', option: 'Linsen-Eintopf', protein: '~16g', note: 'An Krafttagen +Ei' },
  { meal: 'Mittagessen', option: 'Kichererbsen-Linsen-Gemüse', protein: '~30g', note: 'Mit Rotwein & Parmesan' },
  { meal: 'Abendessen', option: 'Quark + Banane + Kiwi', protein: '~22g', note: '' },
  { meal: 'Abendessen', option: 'Hüttenkäse + Beeren + Kiwi', protein: '~20g', note: '' },
  { meal: 'Abendessen', option: 'Körniger Frischkäse + Pumpernickel', protein: '~22g', note: '' },
  { meal: 'Abendessen', option: 'Joghurt + Walnüsse + Kiwi', protein: '~12g', note: 'Leichter Abschluss' },
  { meal: 'Snack', option: 'Skyr (150g)', protein: '~18g', note: 'Ideal wenn Lücke bleibt' },
  { meal: 'Snack', option: '2 Eier (hart gekocht)', protein: '~12g', note: 'Schnell und einfach' },
  { meal: 'Snack', option: 'Edamame (Handvoll)', protein: '~8g', note: '' },
]

export const boosters: Booster[] = [
  { name: '1–2 Eier (hart gekocht oder Rührei)', protein: '+12–16g', when: 'Passt in fast jedes Gericht oder daneben' },
  { name: '200g Quark', protein: '+22g', when: 'Als Abendessen oder Dip' },
  { name: '150g Skyr (naturell)', protein: '+18g', when: 'Als Snack oder nach dem Essen' },
  { name: '200g Hüttenkäse / körniger Frischkäse', protein: '+22g', when: 'Auf Brot oder pur' },
  { name: '100g angebratener Tofu', protein: '+8g', when: 'Direkt ins Curry oder den Eintopf' },
  { name: 'Handvoll Edamame (ca. 80g)', protein: '+8g', when: 'Als Snack zwischendurch' },
  { name: '150g griechischer Joghurt', protein: '+15g', when: 'Als Beilage oder in Overnight Oats' },
  { name: 'Sardinen (1 Dose)', protein: '+14g', when: 'Auf Brot oder über Salat' },
]

export const dayExamples = [
  {
    label: 'Beispiel Krafttag (Ziel ~100g)',
    text: 'Overnight Oats ~20g + Hähnchen-Bowl ~45g + Quark ~22g + Edamame ~8g = ~95g',
  },
  {
    label: 'Beispiel Erholungstag (Ziel ~75g)',
    text: 'Vollkornbrot + Quark ~22g + Linsen-Eintopf ~16g + Hüttenkäse ~20g + Joghurt ~12g = ~70g',
  },
]
