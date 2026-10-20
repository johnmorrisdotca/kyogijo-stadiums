// The surfaces of the budō (武道): the contest areas of judo and karate, the shiai-jo of kendo, the dohyō of sumo, the kyūdōjō, and the tatami of a dojo, each from the rulebook or the
// federation's own page it was read in, with every figure in metres. A figure that no rule gives is said so in its comment (ours). Nothing here draws.
import { span, type Span } from "./fields.ts";
import type { LeagueBase } from "./types.ts";

/** A mat: its length and width in metres. */
export interface Mat {
  length: number;
  width: number;
}

/** The figures of a judo contest area (a competition tatami), in metres. */
export interface JudoFigures {
  kind: "judo";
  /** The contest area, a square: 8 m to 10 m a side (IJF SOR 8.7); 10 m at the Olympic Games, the World Championships and the Masters, which is the size drawn. */
  contest: Span;
  /** The safety area round it: at least 3 m (SOR 8.7). At the Games it is 4 m (the common and the exterior one); that is drawn. The rules give no greatest, so the drawing allows up to 6 m (ours). */
  safety: Span;
  /** The distance between two adjoining contest areas: a common safe zone of at least 4 m may serve (SOR 8.7). */
  common: number;
  /** The free zone kept round the whole competition area: at least 0.5 m (SOR 8.7). */
  freeZone: number;
  /** The tatami: 1 m by 2 m by 5 cm of pressed foam (SOR 8.7); the AJJF's own is 182 cm by 91 cm, 5 or 6 cm thick (guidebook 2-1). */
  tatami: Mat & { thickness: number };
  /** A solid platform under the tatami is one metre wider and longer than the tatami (SOR 8.7), with an exterior safety area of 4 m. */
  platform: number;
  /** The tape that marks where the contestants start: 10 cm by 50 cm (SOR 2020 18.1), and how far each is from the centre. */
  marks: { width: number; length: number; fromCentre: number } | null;
  /** The domestic red tatami of the danger zone, as wide as one tatami, inside the contest area; none in an IJF contest area (the guidebook 2-3 allows it at events other than the Games, the Worlds and the Masters). */
  danger: boolean;
  /** A kata area: two white tapes 5 cm by 50 cm, 3 m from the centre either side, and a safety area of 2 m (SOR B1.8). */
  kata: boolean;
  /** A kata area: the strip of tape of the same colour at the centre of the area, 5 cm by 50 cm (SOR B1.8; the Kata Commission's Tournament Handbook 2024). None in a contest area. */
  centre: { width: number; length: number } | null;
  /** A kata area: the panel of judges, `count` of them on the shomen side, sitting about `apart` metres from each other, the central one at the centre of the area (SOR, Kata judges and the system of judging). None in a contest area. */
  panel: { count: number; apart: number } | null;
}

/** The figures of a karate competition area, in metres. */
export interface KarateFigures {
  kind: "karate";
  /** The matted square, 8 m a side measured from the outside (WKF Kumite 1.1, Kata 1.1). */
  area: number;
  /** Kumite: the outer 1 m of the square is in another colour, marking the boundary (1.1). None for kata. */
  band: number;
  /** The safety area round the square: 2 m (1.1). */
  safety: number;
  /** The least distance between two competition areas: 2 m (1.2). */
  between: number;
  /** Kumite: the two mats turned over, red side up, 1 m from the centre (1.5). The mat's size is not in the rules: 1 m by 1 m (ours, the size of a WKF-approved mat). */
  startMats: { size: number; fromCentre: number } | null;
  /** The referee stands at the middle, 2 m from the boundary (1.6); each judge sits about 1.5 m off a corner in the safety area (1.6). */
  referee: number;
  judges: number;
}

/** The figures of a kendo shiai-jo, in metres. */
export interface KendoFigures {
  kind: "kendo";
  /** A square or a rectangle of 9 m to 11 m a side, inclusive of the width of the line (Article 2). 10 m is drawn: the middle (ours). */
  side: Span;
  /** The lines are 5 cm to 10 cm wide and white as a rule (Subsidiary Rules, Article 1). */
  lineWidth: Span;
  /** The cross at the centre: 30 cm to 40 cm (Figure 1). */
  cross: Span;
  /** The two kaishi-sen, each 50 cm long and 1.4 m from the centre (Figure 1). */
  startLine: { length: number; fromCentre: number };
  /** A space of at least 1.5 m is kept outside the shiai-jo (Subsidiary Rules, Article 1). */
  outside: number;
}

/** The figures of a sumo dohyō, in metres. */
export interface SumoFigures {
  kind: "sumo";
  /** The clay square: 6.7 m a side (Sumo Rules, Dohyō Regulations, Article 1). */
  platform: number;
  /** Its height: 34 cm to 60 cm for a public dohyō (Article 1); 55 cm is drawn (ours). */
  height: Span;
  /** The circle of tawara: 4.55 m, 15 shaku (Article 1). Taken as the inside of the ring, where the wrestlers stand (ours: the rule does not say which edge). */
  circle: number;
  /** The tawara of the circle: 20, which are 4 tokudawara and 4 between each of them (Quiz No. 355). */
  tawara: { count: number; tokuda: number; between: number };
  /** The shikiri-sen: two white lines 90 cm long, 6 cm wide and 70 cm apart (Quiz No. 1091). */
  shikiri: { length: number; width: number; apart: number };
  /** The width of a tawara's cross-section and how far a tokudawara stands out from the circle: the rules give neither (ours). */
  bale: { width: number; out: number };
  /** The band of sand, the jano-me, outside the tawara: the rules give no width (ours). */
  jano: number;
}

/** The figures of a kyūdōjō, in metres. */
export interface KyudoFigures {
  kind: "kyudo";
  /** The distance from the shooting position (射位) to the face of the target: 28 m (kinteki) or 60 m (enteki) (Wakayama 2015; ANKF manual 4). */
  distance: number;
  /** The target: 36 cm across (a kasumi-mato) for kinteki, 100 cm for enteki; its centre 27 cm above the azuchi's base and tilted 5 degrees, or 97 cm above the ground and tilted 15 degrees. */
  target: { diameter: number; centre: number; tilt: number };
  /** The shooters' places: 1.8 m apart (1.6 m to 2.0 m) for kinteki and 1.6 m (1.4 m to 1.8 m) for enteki, a line of 5 (ANKF manual 6). */
  step: Span;
  count: number;
  /** The distance from the shooting position back to the honza (本座): 2.0 m for kinteki and 1.1 m for enteki (ANKF manual 6). */
  honza: number;
  /** The ceiling of the shajō: 4.0 m, at least 3.8 m (ANKF manual 6). */
  ceiling: number;
  /** The shooters stand to one side or the other of the door: the distance to the wall behind the last shooter, at least 1.4 m, and the least distance from the honza to the officials' seats behind (3.0 m for kinteki, 4.0 m for enteki). */
  behind: { wall: number; officials: number };
  /**
   * The shajō in the manual's figures (Figures II-1 and II-3): 9.0 m from the front edge to the row of the officials' seats, with the shooting positions 2.1 m behind the front edge; 2.7 m (kinteki) or 2.2 m (enteki) from the first and the
   * last shooter to the side walls, so that the frontage of 5 shooters is 12.6 m or 10.8 m; 3.6 m more for the judges' side. How far the back wall stands beyond the officials' row is not given: 1.5 m (ours).
   */
  hall: { front: number; depth: number; side: number; judges: number; rear: number };
  /** The distance from the honza back to the row of the officials' seats: 4.9 m (kinteki) and 5.8 m (enteki), Figures II-1 and II-3. */
  row: number;
  /** The width of the yamichi beyond the line of targets on each side, and the depth, the height and the margin of the azuchi: the rules give none (ours). */
  yamichi: { margin: number };
  azuchi: { depth: number; height: number; margin: number };
}

/** The figures of a dojo's mat: one tatami of a region. */
export interface DojoFigures {
  kind: "dojo";
  /** One mat, a jō (畳), twice as long as it is wide. */
  mat: Mat;
  /** Where the standard is used. */
  region: { en: string; ja: string };
}

/** The figures of a budō league. */
export type BudoFigures = JudoFigures | KarateFigures | KendoFigures | SumoFigures | KyudoFigures | DojoFigures;

/** The leagues of each budō sport. */
export type JudoLeague = LeagueBase<"judo", JudoFigures>;
export type KarateLeague = LeagueBase<"karate", KarateFigures>;
export type KendoLeague = LeagueBase<"kendo", KendoFigures>;
export type SumoLeague = LeagueBase<"sumo", SumoFigures>;
export type KyudoLeague = LeagueBase<"kyudo", KyudoFigures>;
export type DojoLeague = LeagueBase<"dojo", DojoFigures>;

/** A league with a budō surface of its own. */
export type BudoLeague = JudoLeague | KarateLeague | KendoLeague | SumoLeague | KyudoLeague | DojoLeague;

/** The IJF's contest area (Sport and Organisation Rules 8.7, version of 21 January 2026) as drawn for the Games, the Worlds and the Masters. */
export const IJF_CONTEST: JudoFigures = {
  kind: "judo",
  contest: span(8, 10, 10),
  safety: span(3, 6, 4),
  common: 4,
  freeZone: 0.5,
  tatami: { length: 2, width: 1, thickness: 0.05 },
  platform: 1,
  marks: { width: 0.1, length: 0.5, fromCentre: 2 },
  danger: false,
  kata: false,
  centre: null,
  panel: null,
};

/** The All Japan Judo Federation's: the tatami of 182 cm by 91 cm, the red tatami of the danger zone, and the red and white tape 4 m (2 ken) apart (Tournament Management Guidebook 2023, 2-1, 2-3, 2-4). */
export const AJJF_CONTEST: JudoFigures = {
  ...IJF_CONTEST,
  contest: span(8, 10, 8),
  safety: span(3, 6, 3),
  tatami: { length: 1.82, width: 0.91, thickness: 0.06 },
  danger: true,
};

/**
 * The kata area (SOR 21 January 2026, B1.8; the Kata Commission's Tournament Handbook 2024): 10 m for the World Championships and 8 m for other events, a safety area of at least 2 m between and round the
 * areas, two white tapes of 5 cm by 50 cm 3 m from the centre either side (the 6 m line), a tape of the same colour at the centre, five judges on the shomen side 1.25 m apart with the central judge at the centre.
 */
export const IJF_KATA: JudoFigures = {
  ...IJF_CONTEST,
  contest: span(8, 10, 10),
  safety: span(2, 6, 2),
  common: 2,
  marks: { width: 0.05, length: 0.5, fromCentre: 3 },
  kata: true,
  centre: { width: 0.05, length: 0.5 },
  panel: { count: 5, apart: 1.25 },
};

/** The WKF's kumite area (Kumite Competition Rules 2026.01, Article 1). */
export const WKF_KUMITE: KarateFigures = { kind: "karate", area: 8, band: 1, safety: 2, between: 2, startMats: { size: 1, fromCentre: 1 }, referee: 2, judges: 1.5 };

/** The WKF's kata area (Kata Competition Rules 2026, Article 1): the same square, with no band and no start mats. */
export const WKF_KATA: KarateFigures = { kind: "karate", area: 8, band: 0, safety: 2, between: 2, startMats: null, referee: 2, judges: 1.5 };

/** The kendo shiai-jo (FIK Regulations, Article 2, the Subsidiary Rules' Article 1 and Figure 1). */
export const FIK_SHIAI_JO: KendoFigures = { kind: "kendo", side: span(9, 11, 10), lineWidth: span(0.05, 0.1, 0.05), cross: span(0.3, 0.4, 0.35), startLine: { length: 0.5, fromCentre: 1.4 }, outside: 1.5 };

/** The dohyō of the Japan Sumo Association (Sumo Rules, Dohyō Regulations, Article 1, and the Association's quizzes). */
export const JSA_DOHYO: SumoFigures = {
  kind: "sumo",
  platform: 6.7,
  height: span(0.34, 0.6, 0.55),
  circle: 4.55,
  tawara: { count: 20, tokuda: 4, between: 4 },
  shikiri: { length: 0.9, width: 0.06, apart: 0.7 },
  bale: { width: 0.2, out: 0.2 },
  jano: 0.5,
};

/** The kyūdōjō for kinteki (近的), the 28 m range of a competition (ANKF competition manual 6 and the National Sports Festival's rules). */
export const KINTEKI: KyudoFigures = {
  kind: "kyudo",
  distance: 28,
  target: { diameter: 0.36, centre: 0.27, tilt: 5 },
  step: span(1.6, 2, 1.8),
  count: 5,
  honza: 2,
  ceiling: 4,
  behind: { wall: 1.4, officials: 3 },
  hall: { front: 2.1, depth: 9, side: 2.7, judges: 3.6, rear: 1.5 },
  row: 4.9,
  yamichi: { margin: 1.2 },
  azuchi: { depth: 2.4, height: 1.5, margin: 1.8 },
};

/** The kyūdōjō for enteki (遠的), 60 m, with the target of 1 m. */
export const ENTEKI: KyudoFigures = {
  kind: "kyudo",
  distance: 60,
  target: { diameter: 1, centre: 0.97, tilt: 15 },
  step: span(1.4, 1.8, 1.6),
  count: 5,
  honza: 1.1,
  ceiling: 4,
  behind: { wall: 1.4, officials: 4 },
  hall: { front: 2.1, depth: 9, side: 2.2, judges: 3.6, rear: 1.5 },
  row: 5.8,
  yamichi: { margin: 1.6 },
  azuchi: { depth: 3, height: 1.8, margin: 2.4 },
};

const mat = (length: number, width: number, en: string, ja: string): DojoFigures => ({ kind: "dojo", mat: { length, width }, region: { en, ja } });

/** The budō leagues: for each sport the rulebook's own first. */
export const JUDO_LEAGUES: readonly JudoLeague[] = [
  { id: "ijf", family: "judo", name: { en: "IJF contest area", ja: "国際柔道連盟の試合場" }, unit: "m", dimensions: IJF_CONTEST, sources: ["ijf-sor", "ijf-sor-2020"], builtIn: true },
  { id: "ajjf", family: "judo", name: { en: "AJJF contest area", ja: "全日本柔道連盟の試合場" }, unit: "m", dimensions: AJJF_CONTEST, sources: ["ajjf-guide", "ijf-sor"] },
  { id: "ijf-kata", family: "judo", name: { en: "IJF kata area", ja: "国際柔道連盟の形の試合場" }, unit: "m", dimensions: IJF_KATA, sources: ["ijf-sor", "ijf-kata-handbook", "ijf-kata-criteria"] },
];

export const KARATE_LEAGUES: readonly KarateLeague[] = [
  { id: "wkf-kumite", family: "karate", name: { en: "WKF kumite area", ja: "世界空手連盟の組手の試合場" }, unit: "m", dimensions: WKF_KUMITE, sources: ["wkf-kumite"], builtIn: true },
  { id: "wkf-kata", family: "karate", name: { en: "WKF kata area", ja: "世界空手連盟の形の試合場" }, unit: "m", dimensions: WKF_KATA, sources: ["wkf-kata"] },
];

export const KENDO_LEAGUES: readonly KendoLeague[] = [{ id: "fik", family: "kendo", name: { en: "FIK shiai-jo", ja: "国際剣道連盟の試合場" }, unit: "m", dimensions: FIK_SHIAI_JO, sources: ["fik-regulations"], builtIn: true }];

export const SUMO_LEAGUES: readonly SumoLeague[] = [{ id: "jsa", family: "sumo", name: { en: "Japan Sumo Association dohyō", ja: "日本相撲協会の土俵" }, unit: "m", dimensions: JSA_DOHYO, sources: ["jsa-dohyo", "jsa-quiz", "wikipedia-dohyo"], builtIn: true }];

export const KYUDO_LEAGUES: readonly KyudoLeague[] = [
  { id: "kinteki", family: "kyudo", name: { en: "Kyūdōjō for kinteki, 28 m", ja: "近的の弓道場（28m）" }, unit: "m", dimensions: KINTEKI, sources: ["znkr-unei", "wakayama-kyudo-2015"], builtIn: true },
  { id: "enteki", family: "kyudo", name: { en: "Kyūdōjō for enteki, 60 m", ja: "遠的の弓道場（60m）" }, unit: "m", dimensions: ENTEKI, sources: ["znkr-unei", "wakayama-kyudo-2015"] },
];

export const DOJO_LEAGUES: readonly DojoLeague[] = [
  { id: "chukyoma", family: "dojo", name: { en: "Chūkyōma tatami, 1820 by 910 mm", ja: "中京間の畳（1820×910mm）" }, unit: "m", dimensions: mat(1.82, 0.91, "Nagoya and the Chūbu region", "名古屋・中部"), sources: ["tatami-sizes", "ajjf-guide"], builtIn: true },
  { id: "kyoma", family: "dojo", name: { en: "Kyōma tatami, 1910 by 955 mm", ja: "京間の畳（1910×955mm）" }, unit: "m", dimensions: mat(1.91, 0.955, "Kyoto and the Kansai region", "京都・関西"), sources: ["tatami-sizes"] },
  { id: "edoma", family: "dojo", name: { en: "Edoma tatami, 1760 by 880 mm", ja: "江戸間の畳（1760×880mm）" }, unit: "m", dimensions: mat(1.76, 0.88, "Edo (Tokyo) and the Kantō region", "江戸・関東"), sources: ["tatami-sizes"] },
  { id: "danchima", family: "dojo", name: { en: "Danchima tatami, 1700 by 850 mm", ja: "団地間の畳（1700×850mm）" }, unit: "m", dimensions: mat(1.7, 0.85, "housing complexes", "団地"), sources: ["tatami-sizes"] },
  { id: "judo-2x1", family: "dojo", name: { en: "Judo tatami, 2 m by 1 m", ja: "柔道畳（2m×1m）" }, unit: "m", dimensions: mat(2, 1, "the IJF's standard", "国際柔道連盟の標準"), sources: ["ijf-sor", "ajjf-guide"] },
];

/** Every budō league, once each. */
export const BUDO_LEAGUES: readonly BudoLeague[] = Object.freeze([...JUDO_LEAGUES, ...KARATE_LEAGUES, ...KENDO_LEAGUES, ...SUMO_LEAGUES, ...KYUDO_LEAGUES, ...DOJO_LEAGUES]);
