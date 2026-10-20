// The sample boards' content: what Taisen Brackets is asked to draw for the demo (demo/boards-data.js, made by `pnpm boards`) and for the boards gallery (docs/gallery-boards, made by the docs build). Every athlete, official and
// result here is invented; the boards carry Taisen Brackets' own generic icons, and no mark of any games, federation or broadcaster.

/** Each board: what it is (`kind`), the source Taisen Brackets takes, the options it is drawn with, the surface it opens over and where, and a sentence that says what it shows. */
export const SAMPLES = {
  swimming: {
    kind: "results",
    surface: { sport: "swimming" },
    position: "top",
    source: {
      title: "Men's 100m freestyle",
      phase: "Final",
      columns: [{ precision: 2 }],
      rows: [
        { code: "AUS", flag: "AU", name: "Callum Reyes", values: [46.91], record: "OR" },
        { code: "USA", flag: "US", name: "Dominic Ward", values: [47.2] },
        { code: "JPN", flag: "JP", name: "Haruki Tanabe", values: [47.38], record: "NR" },
        { code: "FRA", flag: "FR", name: "Mathis Delorme", values: [47.55] },
        { code: "GBR", flag: "GB", name: "Owen Gallagher", values: [47.61] },
        { code: "BRA", flag: "BR", name: "Tiago Menezes", values: [47.89] },
        { code: "HUN", flag: "HU", name: "Balint Szabo", values: [48.02] },
        { code: "CAN", flag: "CA", name: "Liam Fontaine", values: [48.17] },
      ],
    },
    options: { width: 960, look: "blue", icon: "medal" },
    label: "Men's 100m freestyle, final: Reyes of Australia leads in 46.91, a record badge beside the time.",
  },
  judo: {
    kind: "bout",
    surface: { sport: "judo" },
    position: "top",
    source: {
      title: "Men's -73 kg",
      phase: "Semi-final",
      bout: 23,
      red: { code: "JPN", flag: "JP", name: "TANABE H." },
      blue: { code: "GEO", flag: "GE", name: "GELASHVILI L." },
      officials: [
        { role: "referee", code: "KAZ", flag: "KZ", name: "OMAROV Daniyar" },
        { code: "MGL", flag: "MN", name: "BATTULGA Enkh" },
        { code: "POL", flag: "PL", name: "WOJCIK Marek" },
      ],
    },
    options: { width: 960, look: "blue" },
    label: "Men's -73 kg, semi-final, bout 23: Tanabe of Japan against Gelashvili of Georgia.",
  },
  athletics: {
    kind: "results",
    surface: { sport: "athletics" },
    position: "top",
    source: {
      title: "Men's 100m",
      phase: "Final · Wind +0.3",
      columns: [{ label: "React", precision: 3 }, { label: "Time", precision: 2 }],
      rows: [
        { code: "JAM", flag: "JM", name: "Andre Campbell", values: [0.141, 9.81], record: "NR" },
        { code: "USA", flag: "US", name: "Marcus Hollis", values: [0.152, 9.84] },
        { code: "RSA", flag: "ZA", name: "Thabo Nkosi", values: [0.139, 9.89] },
        { code: "GBR", flag: "GB", name: "Jonas Whitlock", values: [0.147, 9.93] },
        { code: "CAN", flag: "CA", name: "Ethan Duval", values: [0.158, 9.97] },
        { code: "JPN", flag: "JP", name: "Ren Kamiya", values: [0.144, 10.04] },
        { code: "KEN", flag: "KE", name: "Peter Mwangi", values: [0.15, 10.09] },
        { code: "NZL", flag: "NZ", name: "Cody Ashton", values: [null, null], note: "DQ" },
      ],
    },
    options: { width: 960, look: "night", icon: "stopwatch", rankStyle: "medal" },
    label: "Men's 100m, final, wind plus 0.3: Campbell of Jamaica leads in 9.81.",
  },
  skating: {
    kind: "results",
    surface: { sport: "skating", league: "isu-long-track" },
    position: "side",
    source: {
      title: "Women's 1000m",
      phase: "Result",
      columns: [{ label: "Time" }],
      rows: [
        { code: "NED", flag: "NL", name: "Femke de Haan", values: ["1:12.04"], record: "OR" },
        { code: "JPN", flag: "JP", name: "Mio Sakurai", values: ["1:12.31"] },
        { code: "CAN", flag: "CA", name: "Claire Boucher", values: ["1:12.58"] },
        { code: "NOR", flag: "NO", name: "Ida Solberg", values: ["1:12.90"] },
        { code: "USA", flag: "US", name: "Hannah Brooks", values: ["1:13.02"] },
        { code: "GER", flag: "DE", name: "Lea Hartmann", values: ["1:13.27"] },
        { code: "KOR", flag: "KR", name: "Seo-yeon Han", values: ["1:13.44"] },
        { code: "ITA", flag: "IT", name: "Giulia Ferri", values: ["1:13.61"] },
      ],
    },
    options: { width: 960, look: "paper", icon: "stopwatch" },
    label: "Women's 1000m, result: de Haan of the Netherlands leads in 1:12.04.",
  },
  medals: {
    kind: "medals",
    surface: { sport: "athletics" },
    position: "corner",
    source: {
      title: "Medal table",
      subtitle: "Day 12",
      date: "Games",
      rows: [
        { name: "Japan", code: "JPN", flag: "JP", gold: 14, silver: 6, bronze: 9 },
        { name: "Australia", code: "AUS", flag: "AU", gold: 11, silver: 8, bronze: 7 },
        { name: "United States", code: "USA", flag: "US", gold: 10, silver: 12, bronze: 8 },
        { name: "France", code: "FRA", flag: "FR", gold: 8, silver: 7, bronze: 11 },
        { name: "Great Britain", code: "GBR", flag: "GB", gold: 7, silver: 9, bronze: 6 },
        { name: "China", code: "CHN", flag: "CN", gold: 7, silver: 6, bronze: 5 },
        { name: "Netherlands", code: "NED", flag: "NL", gold: 5, silver: 4, bronze: 7 },
        { name: "Brazil", code: "BRA", flag: "BR", gold: 3, silver: 5, bronze: 6 },
      ],
    },
    options: { width: 720, look: "night" },
    label: "Medal table after day 12: Japan 14 gold, Australia 11, the United States 10.",
  },
};

/** The country codes of every flag the samples use, for the flags to be loaded once. */
export const FLAG_CODES = [...new Set(Object.values(SAMPLES).flatMap((sample) => [...(sample.source.rows ?? []).map((row) => row.flag), sample.source.red?.flag, sample.source.blue?.flag, ...(sample.source.officials ?? []).map((official) => official.flag)]).filter(Boolean))].sort();
