// The curling chart: the stones of an end on the house, each in its team's colour with its number, the stones that score ringed and the shot rock
// ringed twice, and the score of the end worked out by the rules (a stone in or touching the house counts when it is nearer the button than every
// stone of the other team). Written for this package from World Curling's R2, R12 and Curling Canada's Rules 4 and 13; nothing of any other
// package is used.
import { CURLING, STONE_DIAMETER } from "./geometry.ts";
import { convertLength } from "./units.ts";
import { sheetFor } from "./sheet.ts";
import type { CurlingOptions, CurlingStone, CurlingStoneResult, CurlingTotals, Chart, KeyItem } from "./charts.types.ts";
import type { Layer, PointDatum, TextDatum } from "./layers.types.ts";
import { assemble, clean, drawingOptions, keyItems, keyLayers, languageOf, round, wordsOf, type KeyEntry, type Look } from "./charts.ts";
import { fill } from "./strings.ts";
import { outlineOf } from "./outline.ts";
import { isUnit } from "./units.ts";
import type { SheetStyle } from "./types.ts";
import { isPortrait } from "./common.ts";
import { foldPlan } from "./surfaces/curling.fold.ts";
import { teesOf } from "./surfaces/curling.ts";

const R = STONE_DIAMETER / 2;
const EPS = 1e-6;

/** The colours of the two teams' stones, the handles' colours of a game: red and yellow. */
export const CURLING_COLORS = { home: "#cf2e2e", away: "#f2c230" } as const;

const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/**
 * Judge the stones of an end by the rules. A stone is out of play, and taken off the sheet, when it touches a sideline, when it does not come to rest
 * wholly beyond the hog line, or when it has wholly crossed the back line. A stone with any part within 6 feet of the button (in or touching the
 * house) can score; the team with the stone nearest the button scores one point for each of its stones that are nearer than every stone of the other
 * team. Stones as near as each other are equal, and equal stones do not count: if the two nearest are of different teams and as near, the end is
 * blank. Places are feet from the button (in `units`, feet by default), x across and y along.
 * @example
 * ```ts
 * import { curlingScore } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const end = curlingScore([
 *   { x: 0.3, y: 0.2, team: "home" },
 *   { x: -1.5, y: 1, team: "home" },
 *   { x: 2, y: -2, team: "away" },
 * ]);
 * console.log(end.scoring, end.points, end.shot);
 * // home 2 0
 * ```
 */
export function curlingScore(stones: readonly CurlingStone[], options: { units?: CurlingOptions["units"]; width?: number } = {}): CurlingTotals {
  if (!Array.isArray(stones)) throw new TypeError("stones is a list of stones");
  const unit = options.units === undefined ? "ft" : options.units;
  if (!isUnit(unit)) throw new RangeError(`Unknown units "${String(unit)}": use one of ft, in, yd, m, cm, mm`);
  const half = (options.width ?? CURLING.width) / 2;
  const results: CurlingStoneResult[] = [];
  let skipped = 0;
  const near: { index: number; distance: number; team: string }[] = [];
  stones.forEach((stone, index) => {
    if (typeof stone !== "object" || stone === null || !isNum(stone.x) || !isNum(stone.y)) {
      skipped += 1;
      return;
    }
    const x = convertLength(stone.x, unit, "ft");
    const y = convertLength(stone.y, unit, "ft");
    const distance = Math.hypot(x, y);
    const inPlay = Math.abs(x) + R < half && y - R > -CURLING.hogLine && y - R <= CURLING.backLine;
    const inHouse = inPlay && distance - R <= CURLING.rings.twelve + EPS;
    results.push({ index, distance, inPlay, inHouse, counting: false, shot: false });
    if (inHouse) near.push({ index, distance, team: typeof stone.team === "string" && stone.team !== "" ? stone.team : "home" });
  });
  near.sort((a, b) => a.distance - b.distance || a.index - b.index);
  let scoring: string | null = null;
  let blank = true;
  let shot: number | null = null;
  const counting: number[] = [];
  if (near.length > 0) {
    const first = near[0];
    const rival = near.find((s) => s.team !== first.team);
    if (rival === undefined || rival.distance - first.distance > EPS) {
      scoring = first.team;
      blank = false;
      shot = first.index;
      for (const s of near) if (s.team === first.team && (rival === undefined || rival.distance - s.distance > EPS)) counting.push(s.index);
    }
  }
  for (const r of results) {
    r.counting = counting.includes(r.index);
    r.shot = r.index === shot;
  }
  return {
    stones: results.length,
    inPlay: results.filter((r) => r.inPlay).length,
    out: results.filter((r) => !r.inPlay).length,
    counting: counting.length,
    points: counting.length,
    scoring,
    shot,
    blank,
    skipped,
    results,
  };
}

const LOOKS: Record<string, Look> = { stone: {}, counting: { hollow: true }, "shot-rock": { hollow: true, scale: 1.3 } };

/**
 * A chart of the stones of an end on the house: each stone as seen from above (grey granite and its team's handle, with its number), the stones
 * that score ringed and the shot rock, the nearest, ringed twice, and the score of the end under the rules (`curlingScore`). It shows the half of
 * the sheet from the hog line to the back line, with the free guard zone shaded, at the house on the left (the top of a tall drawing) or the right.
 * Stones out of play are taken off, as the rules take them. `layerTable` and `chart.table()` list every stone with its distance from the button.
 * @example
 * ```ts
 * import { curlingStones } from "@johnmorrisdotca/kyogijo-stadiums/charts";
 * const chart = curlingStones(
 *   [
 *     { x: 0.4, y: 0.3, team: "home", number: 8 },
 *     { x: -1.2, y: -0.8, team: "home", number: 6 },
 *     { x: 1.9, y: 1.1, team: "away", number: 7 },
 *     { x: 0, y: -12, team: "away", number: 3 },
 *   ],
 *   { end: 6, hammer: "home", names: { home: "Canada", away: "Japan" } },
 * );
 * console.log(chart.totals.points, chart.totals.scoring, chart.title);
 * // 2 home Curling stones, End 6
 * ```
 */
export function curlingStones(stones: readonly CurlingStone[], options: CurlingOptions = {}): Chart<CurlingTotals> & { key: KeyItem[] } {
  if (!Array.isArray(stones)) throw new TypeError("stones is a list of stones");
  const language = languageOf(options);
  const all = wordsOf(language);
  const w = all.charts;
  const house = options.house === "right" ? "right" : "left";
  const title = options.end === undefined ? w.titleCurling : `${w.titleCurling}${all.said.sep}${fill(w.curlingEnd, { n: options.end })}`;
  const surface = options.surface ?? {};
  // The two stone colours and the half of the sheet with the free guard zone, under whatever the caller laid over them.
  const sheet: SheetStyle = { show: options.show ?? "half", end: house, guardZone: true, ...(surface.sheet ?? {}) };
  const o = drawingOptions("curling", { ...options, surface: { ...surface, sheet, colors: { layerHome: CURLING_COLORS.home, layerAway: CURLING_COLORS.away, ...(surface.colors ?? {}) } } }, title, { margin: 4.5 });
  const plan = sheetFor(o);
  const totals = curlingScore(stones, { units: options.units, width: plan.spec.width });
  const unit = options.units ?? "ft";
  const feet = (value: number): number => convertLength(value, unit, "ft");
  const name = (team: string | undefined): string => (team === "away" ? options.names?.away ?? all.said.away : team === "home" || team === undefined ? options.names?.home ?? all.said.home : team);
  const at = { from: "curling", units: "ft" as const, ...(house === "left" ? { attacking: "left" as const } : {}) };

  const inPlay = totals.results.filter((r) => r.inPlay);
  const stone = (r: CurlingStoneResult): CurlingStone => stones[r.index];
  const handles: PointDatum[] = inPlay.map((r) => {
    const s = stone(r);
    const notes = [r.shot ? w.curlingNoteShot : undefined, r.counting && !r.shot ? w.curlingNoteCounting : undefined].filter((n) => n !== undefined);
    const base = s.title ?? fill(w.curlingFrom, { name: `${name(s.team)}${isNum(s.number) ? ` ${s.number}` : ""}`, d: round(r.distance, 2) });
    return clean({
      x: feet(s.x as number),
      y: feet(s.y as number),
      team: s.team ?? "home",
      outcome: r.shot ? "shot-rock" : r.counting ? "counting" : "stone",
      value: round(r.distance, 2),
      title: s.title ?? `${base}${notes.length === 0 ? "" : `${all.said.sep}${notes.join(all.said.sep)}`}`,
    });
  });
  const ring = (id: string, factor: number, cond: (r: CurlingStoneResult) => boolean, label: string): Layer | undefined => {
    const data = inPlay.filter(cond).map((r) => ({ x: feet(stone(r).x as number), y: feet(stone(r).y as number), outcome: id }));
    return data.length === 0 ? undefined : { kind: "points", id, name: label, ...at, data, style: { shape: "circle", size: STONE_DIAMETER * factor, fill: "rgba(0,0,0,0)", stroke: "#d99a00" } };
  };
  const layers: Layer[] = [];
  const shotRing = ring("shot-rock", 2, (r) => r.shot, w.curlingShot);
  const countRing = ring("counting", 1.5, (r) => r.counting, w.curlingCounting);
  if (shotRing !== undefined) layers.push(shotRing);
  if (countRing !== undefined) layers.push(countRing);
  // The granite of each stone, then its handle in the team's colour, which is the layer that carries the data.
  layers.push({ kind: "points", id: "granite", name: w.curlingStone, ...at, data: handles.map((d) => ({ x: d.x, y: d.y })), style: { size: STONE_DIAMETER, fill: "#9aa3a9", stroke: "var(--ky-layer-edge)" } });
  layers.push({
    kind: "points",
    id: "stones",
    name: w.curlingStone,
    title: fill(all.layers.count, { n: inPlay.length, noun: w.curlingStone.toLowerCase() === "stone" ? "stones" : w.curlingStone }),
    ...at,
    data: handles,
    style: { size: STONE_DIAMETER * 0.72, outcomes: { counting: {}, "shot-rock": {}, stone: {} } },
  });
  if (options.numbers !== false) {
    const numbers: TextDatum[] = inPlay.filter((r) => isNum(stone(r).number)).map((r) => ({ x: feet(stone(r).x as number), y: feet(stone(r).y as number), text: stone(r).number as number }));
    if (numbers.length > 0) layers.push({ kind: "text", id: "numbers", name: w.curlingStone, ...at, data: numbers, style: { size: STONE_DIAMETER * 0.4, weight: 800 } });
  }
  // The key: a stone, a stone that scores, the shot rock; over the half of the sheet that is shown.
  const entries: KeyEntry[] = [
    { label: w.curlingStone, outcome: "stone" },
    ...(totals.counting > 0 ? [{ label: w.curlingCounting, outcome: "counting" }] : []),
    ...(totals.shot !== null ? [{ label: w.curlingShot, outcome: "shot-rock" }] : []),
  ];
  if (options.key !== false) {
    const { box } = outlineOf(o);
    const tee = house === "left" ? box.w / 2 - CURLING.teeFromMiddle : box.w / 2 + CURLING.teeFromMiddle;
    if (plan.show === "folded") {
      // A folded sheet's key runs along the top of the whole drawing, above the enlarged house that is there.
      const margin = typeof o.margin === "number" ? convertLength(o.margin, o.units ?? "ft", "ft") : 3;
      const fold = foldPlan(plan.spec, teesOf(plan.spec), { panels: plan.panels, fit: plan.fit, margin, turned: isPortrait(o), id: "k" });
      layers.push(...keyLayers(o, entries, LOOKS, all, [], { x: box.x, w: box.w, y: fold.view.y + margin * 0.5 }));
    } else {
      const shown = { x: house === "left" ? tee - CURLING.backLine : tee - CURLING.hogLine - 1, w: CURLING.backLine + CURLING.hogLine + 1 };
      layers.push(...keyLayers(o, entries, LOOKS, all, [], shown));
    }
  }
  const teamName = totals.scoring === null ? "" : name(totals.scoring);
  const parts = [
    totals.blank ? fill(w.sumCurlingBlank, { n: totals.inPlay }) : fill(w.sumCurling, { n: totals.inPlay, team: teamName, points: totals.points }),
    totals.out > 0 ? fill(w.curlingOut, { n: totals.out }) : "",
    options.hammer === undefined ? "" : fill(all.said.hammer, { name: name(options.hammer) }),
  ];
  const chart = assemble(o, layers, { title, summary: parts.filter((p) => p !== "").join(all.said.gap), totals, tableLayers: ["stones"] });
  chart.key = keyItems(entries, LOOKS);
  return chart;
}
