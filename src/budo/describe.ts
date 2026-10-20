// What a budō drawing says of itself: its sentence about the surface, and what the options mark on it. Built from the plan, so that the words and the drawing agree.
import { fill, KYOGIJO_STRINGS } from "../strings.ts";
import type { Language, SurfaceOptions, Team } from "../types.ts";
import { budoView } from "../budo.score.ts";
import { kimariteName } from "./kimarite.ts";
import type { DojoFigures } from "../leagues/budo.ts";
import { budoPlan, type BudoPlan } from "./plan.ts";

const trim = (n: number): string => String(Math.round(n * 100) / 100);
const cm = (n: number): string => String(Math.round(n * 1000) / 10);

type Opt = Pick<SurfaceOptions, "sport" | "league" | "budo" | "dojo" | "range" | "detail">;

/** The sentence about the surface, as a fragment: "a judo contest area of 10 by 10 metres in a safety area 4 metres wide...". */
export function budoAbout(o: Opt, language: Language, plan: BudoPlan = budoPlan(o)): string {
  const words = KYOGIJO_STRINGS[language].budo;
  const mat = (m: { length: number; width: number }): string => fill(words.tatami, { length: trim(m.length), width: trim(m.width) });
  if (plan.judo !== undefined) {
    const L = plan.judo;
    const c = L.contests[0];
    const contest = trim(c.x1 - c.x0);
    const safety = trim(c.x0);
    const tatami = mat(L.mat);
    if (plan.league === "ijf-kata") return fill(words.judoKata, { contest, safety, tatami });
    return L.contests.length > 1 ? fill(words.judoMany, { areas: L.contests.length, contest, safety, gap: trim(L.gap), tatami }) : fill(words.judo, { contest, safety, tatami });
  }
  if (plan.karate !== undefined) {
    const L = plan.karate;
    const area = trim(L.areas[0].x1 - L.areas[0].x0);
    const safety = trim(L.areas[0].x0);
    if (plan.league === "wkf-kata") return fill(words.karateKata, { area, safety });
    return L.areas.length > 1 ? fill(words.karateMany, { areas: L.areas.length, area, gap: trim(L.gap), safety }) : fill(words.karate, { area, safety });
  }
  if (plan.kendo !== undefined) return fill(words.kendo, { side: trim(plan.kendo.side) });
  if (plan.sumo !== undefined) {
    const L = plan.sumo;
    const fig = plan.figures as { platform: number; circle: number; tawara: { count: number } };
    const bare = !L.parts.areas.some((a) => a.id === "tawara");
    return fill(bare ? words.sumoBare : words.sumo, { platform: trim(fig.platform), height: cm(L.height), circle: trim(fig.circle), count: fig.tawara.count });
  }
  if (plan.mma !== undefined) {
    const L = plan.mma;
    const platform = L.height > 0.0005 ? fill(words.mmaPlatform, { height: cm(L.height) }) : words.mmaFloor;
    return fill(words.mma, { width: trim(L.width), feet: trim(L.width / 0.3048), fence: cm(L.fence), platform });
  }
  if (plan.boxing !== undefined) {
    const L = plan.boxing;
    const platform = L.height > 0.0005 ? fill(words.boxingPlatform, { height: cm(L.height) }) : words.boxingFloor;
    return fill(words.boxing, { size: trim(L.size), feet: trim(L.size / 0.3048), apron: cm(L.apron), platform });
  }
  if (plan.prowrestling !== undefined) {
    const L = plan.prowrestling;
    const platform = L.height > 0.0005 ? fill(words.boxingPlatform, { height: cm(L.height) }) : words.boxingFloor;
    return fill(words.prowrestling, { size: trim(L.size), feet: trim(L.size / 0.3048), apron: cm(L.apron), platform });
  }
  if (plan.wrestling !== undefined) {
    const L = plan.wrestling;
    const fig = plan.figures as { passivity: number; border: { drawn: number } };
    const platform = L.height > 0.0005 ? fill(words.wrestlingPlatform, { height: trim(L.height) }) : words.wrestlingFloor;
    if (fig.passivity > 0) return fill(words.wrestlingUww, { circle: trim(L.circle), border: trim(L.border), band: trim(fig.passivity), platform });
    return fill(words.wrestlingFolk, { feet: trim(L.circle / 0.3048), circle: trim(L.circle), border: trim(L.border / 0.3048), platform });
  }
  if (plan.kyudo !== undefined) {
    const L = plan.kyudo;
    const fig = plan.figures as { distance: number };
    return fill(plan.league === "enteki" ? words.kyudoEnteki : words.kyudo, { n: L.shooters, distance: trim(fig.distance) });
  }
  const L = plan.dojo;
  if (L === undefined) return "";
  const template = L.pattern === "competition" ? words.dojoCompetition : L.pattern === "checker" ? words.dojoChecker : L.pattern === "border" ? words.dojoBorder : words.dojoTraditional;
  return fill(template, { jo: trim(L.jo), width: trim(L.width), length: trim(L.length), mat: fill(words.tatami, { length: trim(L.mat.length), width: trim(L.mat.width) }) });
}

/** The sentences that follow it: what the options mark. Each starts after a gap. */
export function budoSentences(o: Opt, language: Language, plan: BudoPlan = budoPlan(o)): string {
  const words = KYOGIJO_STRINGS[language].budo;
  const { gap } = KYOGIJO_STRINGS[language].said;
  const out: string[] = [];
  if (plan.judo !== undefined) {
    const L = plan.judo;
    const fig = plan.figures as { marks: { fromCentre: number } | null };
    if (L.danger > 0) out.push(words.danger);
    if (o.budo?.platform === true) out.push(words.platform);
    if (plan.shapes.some((s) => s.kind === "bar" && s.feature.startsWith("start")) && fig.marks !== null) out.push(fill(words.start, { apart: trim(2 * fig.marks.fromCentre) }));
    if (o.budo?.officials === true) out.push(words.officials);
  }
  if (plan.karate !== undefined && plan.areas.some((a) => a.feature === "judges" || a.feature === "referee")) out.push(words.karateOfficials);
  if (plan.sumo !== undefined && plan.areas.some((a) => a.feature === "tassels")) out.push(words.tassels);
  if (plan.mma !== undefined) {
    if (plan.mma.gates.length > 0) out.push(words.mmaGates);
    if (plan.mma.steps.length > 0) out.push(words.mmaSteps);
  }
  if (plan.prowrestling !== undefined) {
    out.push(words.prowrestlingRopes);
    if (plan.prowrestling.steps.length > 0) out.push(words.prowrestlingSteps);
  }
  if (plan.wrestling !== undefined) {
    const fig = plan.figures as { centre: { diameter: number } | null; lines: unknown };
    if (fig.centre !== null && o.budo?.circle !== false) out.push(fill(words.wrestlingCentre, { d: trim(fig.centre.diameter) }));
    if (fig.lines !== null && plan.wrestling.start !== undefined) out.push(words.wrestlingLines);
  }
  if (plan.boxing !== undefined) {
    if (o.budo?.corners !== false) out.push(words.boxingCorners);
    if (plan.boxing.steps.length > 0) out.push(words.boxingSteps);
  }
  if (plan.dojo !== undefined) {
    const L = plan.dojo;
    out.push(fill(words.dojoKamiza, { side: words.sides[L.kamiza] }));
    if (L.dais !== undefined) out.push(words.dojoDais);
    if (L.banner !== undefined) out.push(words.dojoBanner);
    if (L.shrine !== undefined) out.push(words.dojoShinzen);
    if (L.contests.length > 0) out.push(fill(words.dojoAreas, { n: L.contests.length }));
  }
  return out.map((t) => `${gap}${t}`).join("");
}

/** The mat of a dojo league, for a caller that wants its size in words. */
export const dojoMat = (f: DojoFigures): string => `${trim(f.mat.length)} × ${trim(f.mat.width)} m`;

/** What each side scored, in sentences, for a judo, karate, kendo or sumo score: the counts the board shows. Each starts after a gap. */
export function budoScoreSentences(sport: string, order: readonly Pick<Team, "name" | "budo">[], language: Language): string {
  const words = KYOGIJO_STRINGS[language].budo;
  const { gap } = KYOGIJO_STRINGS[language].said;
  const sep = KYOGIJO_STRINGS[language].layers.listSep;
  const out: string[] = [];
  for (const team of order) {
    const v = budoView(team.budo);
    if (v === undefined) continue;
    const list: string[] = [];
    const count = (n: number | undefined, label: string): void => {
      if (n !== undefined && n > 0) list.push(language === "ja" ? `${label}${n}` : `${n} ${label.toLowerCase()}`);
    };
    if (sport === "judo" || sport === "karate") {
      count(v.ippon, words.board.ippon);
      count(v.wazaari, words.board.wazaari);
      count(v.yuko, words.board.yuko);
      count(v.shido, sport === "judo" ? words.board.shido : words.board.chui);
      if (v.senshu === true) list.push(words.board.senshu);
      if (list.length > 0) out.push(fill(sport === "judo" ? words.board.judoScore : words.board.karateScore, { name: team.name, list: list.join(sep) }));
    } else if (sport === "kendo" && v.techniques !== undefined) {
      const named = v.techniques.map((t) => words.board.techniques[t as keyof typeof words.board.techniques] ?? t);
      out.push(fill(words.board.kendoScore, { name: team.name, list: named.join(sep) }));
    } else if (sport === "sumo" && v.kimarite !== undefined) {
      out.push(fill(words.board.sumoScore, { name: team.name, kimarite: kimariteName(v.kimarite, language) }));
    }
  }
  return out.map((t) => `${gap}${t}`).join("");
}
