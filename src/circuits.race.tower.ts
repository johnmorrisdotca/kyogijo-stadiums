// The racing scoreboard: a timing tower (lap n of N, the first ten with their gaps, the rest as a ticker, the flag and the fastest lap) and the podium at the flag. This file has what they show (pure, from a moment of the
// race, with the same gaps the timing board writes), the tower as markup (one design that stands in the plan view, stands up in the 3D view and floats over the view as an overlay) and how to write only what changed
// into it. The page that places them and moves them is `circuits.race.dom.ts`.
import { nearestOn } from "./circuits.geo.ts";
import type { CircuitPlan } from "./circuits.ts";
import type { RaceMoment, RaceStanding, RaceStatus } from "./circuits.race.moment.ts";
import type { CircuitRace } from "./circuits.race.ts";
import { lapTime, raceStage, standingGap } from "./circuits.race.text.ts";
import { RACE_WORDS } from "./circuits.race.words.ts";
import type { Pt } from "./crowd.ts";
import { el, esc } from "./format.ts";
import { fill } from "./strings.core.ts";
import type { Language } from "./types.ts";

/** How many cars the tower lists; the rest go in the ticker under them. */
export const TOWER_ROWS = 10;

/** A time of a race that took the flag: `1:22:14.532`, or `22:14.532` under an hour. */
export function raceTimeText(seconds: number): string {
  const thousandths = Math.round(Math.max(0, seconds) * 1000);
  const h = Math.floor(thousandths / 3_600_000);
  const rest = thousandths - h * 3_600_000;
  const m = Math.floor(rest / 60_000);
  const s = (rest - m * 60_000) / 1000;
  const sec = `${String(Math.floor(s)).padStart(2, "0")}.${String(Math.round((s % 1) * 1000)).padStart(3, "0")}`;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** One line of the tower. */
export interface TowerRow {
  id: string;
  position: number;
  code: string;
  colour: string;
  /** What the gap column says: the leader's race time once it has taken the flag, otherwise the same words as the timing board (the pit lane is `PIT`). */
  gap: string;
  status: RaceStatus;
}

/** What the tower shows at a moment. */
export interface TowerData {
  /** The clock's line: `Lap 10 / 50`, `On the grid`, `Chequered flag`. */
  stage: string;
  flag: "grid" | "green" | "chequered";
  rows: TowerRow[];
  /** The codes of the cars after the listed ones, in order, or the empty string. */
  rest: string;
  /** `FL RTO 1:37.996 L12`, or the empty string before a flying lap is done. */
  fastest: string;
}

/** The finish time of a car that has taken the flag, or undefined. */
const finishOf = (race: CircuitRace, line: RaceStanding): number | undefined => (line.status === "finished" ? race.finish[line.index] : undefined);

/** What the tower shows at a moment of a race. Pure: the same race, moment and language always give the same data. */
export function towerData(race: CircuitRace, moment: RaceMoment, language: Language): TowerData {
  const w = RACE_WORDS[language];
  const rows = moment.standings.slice(0, TOWER_ROWS).map((line): TowerRow => {
    const done = line.position === 1 ? finishOf(race, line) : undefined;
    return {
      id: line.car.id,
      position: line.position,
      code: line.car.driver.code,
      colour: line.car.team.colour,
      gap: done !== undefined ? raceTimeText(done) : line.status === "pit" ? w.tower.pit : standingGap(line, language, "gap"),
      status: line.status,
    };
  });
  const f = moment.fastest;
  return {
    stage: raceStage(moment, language),
    flag: moment.flag ? "chequered" : moment.t <= 0 ? "grid" : "green",
    rows,
    rest: moment.standings
      .slice(TOWER_ROWS)
      .map((line) => line.car.driver.code)
      .join(" "),
    fastest: f === undefined ? "" : `${w.tower.fastShort} ${race.cars[f.index].driver.code} ${lapTime(f.time)} ${fill(w.tower.lapShort, { lap: f.lap })}`,
  };
}

/** One line of the podium. */
export interface PodiumLine {
  id: string;
  position: number;
  /** The driver's name and the team's, made up. */
  name: string;
  team: string;
  colour: string;
  ink: string;
  /** The race time for the winner, the gap for a car that has taken the flag behind, or `still racing`. */
  time: string;
  finished: boolean;
}

/** What the podium card shows at a moment: the first three, the fastest lap, and whether the three have all taken the flag (so the order is final). */
export interface PodiumData {
  lines: PodiumLine[];
  /** `Fastest lap: RTO Rautio, 1:37.996, lap 12`, or the empty string. */
  fastest: string;
  final: boolean;
}

/** The podium at a moment of a race: the first three as the board has them, a car that has taken the flag with its time or gap and one still racing as such. At the end of the race it is the finishing order. */
export function podiumData(race: CircuitRace, moment: RaceMoment, language: Language): PodiumData {
  const w = RACE_WORDS[language];
  const lines = moment.standings.slice(0, 3).map((line): PodiumLine => {
    const finished = line.status === "finished";
    const done = line.position === 1 ? finishOf(race, line) : undefined;
    return {
      id: line.car.id,
      position: line.position,
      name: line.car.driver.name[language],
      team: line.car.team.name[language],
      colour: line.car.team.colour,
      ink: line.car.team.ink,
      time: !finished ? w.podium.pending : done !== undefined ? raceTimeText(done) : standingGap(line, language, "gap"),
      finished,
    };
  });
  const f = moment.fastest;
  return {
    lines,
    fastest: f === undefined ? "" : fill(w.podium.fastest, { code: race.cars[f.index].driver.code, name: race.cars[f.index].driver.name[language], time: lapTime(f.time), lap: f.lap }),
    final: lines.length > 0 && lines.every((l) => l.finished),
  };
}

// ---- The tower as markup: one design in its own units, for the plan view, the 3D view and the overlay. ----

/** The design's width, and the height of its head, of a row, and of the ticker and the fastest lap under the rows, in design units. */
export const TOWER_W = 220;
const HEAD = 30;
const ROW = 19;
const FOOT = 40;
/** The height of a tower of `rows` rows. */
export const towerHeight = (rows: number): number => HEAD + rows * ROW + FOOT;

/** The chequered flag's squares, in the head: a 4 by 2 pattern. */
const chequer = (x: number, y: number, s: number): string => {
  let out = "";
  for (let r = 0; r < 2; r += 1) for (let c = 0; c < 4; c += 1) out += el("rect", { x: x + c * s, y: y + r * s, width: s, height: s, class: (r + c) % 2 === 0 ? "ky-tw-sq-dark" : "ky-tw-sq-light" });
  return out;
};

/**
 * The tower at a moment as the inside of an SVG group of `TOWER_W` by `towerHeight(rows)` units: a head with the clock's line and the flag, a line for each of the first cars (its position, the team's colour, its code and its
 * gap), the ticker for the rest and the fastest lap. Its texts carry `data-t` so that `writeTower` can change them in place.
 */
export function towerMarkup(data: TowerData, rows: number, language: Language): string {
  const w = RACE_WORDS[language];
  const h = towerHeight(rows);
  let out = el("rect", { class: "ky-tw-bg", x: 0, y: 0, width: TOWER_W, height: h, rx: 9 });
  out += el("text", { class: "ky-tw-stage", "data-t": "stage", x: 12, y: 20, "font-size": 14 }, esc(data.stage));
  out += el("rect", { class: "ky-tw-flag", "data-t": "flag", x: TOWER_W - 40, y: 8, width: 28, height: 16, rx: 2 });
  out += el("g", { class: "ky-tw-chq" }, chequer(TOWER_W - 40, 8, 7));
  for (let i = 0; i < rows; i += 1) {
    const row = data.rows[i];
    const y = HEAD + i * ROW;
    let inner = el("text", { class: "ky-tw-pos", "data-t": "pos", x: 26, y: 14, "font-size": 12, "text-anchor": "end" }, row === undefined ? "" : String(row.position));
    inner += el("rect", { class: "ky-tw-sw", "data-t": "sw", x: 33, y: 4.5, width: 8, height: 9, rx: 1.5, fill: row?.colour ?? "none" });
    inner += el("text", { class: "ky-tw-code", "data-t": "code", x: 48, y: 14, "font-size": 12 }, row === undefined ? "" : esc(row.code));
    inner += el("text", { class: "ky-tw-gap", "data-t": "gap", x: TOWER_W - 12, y: 14, "font-size": 11, "text-anchor": "end" }, row === undefined ? "" : esc(row.gap));
    out += el("g", { class: "ky-tw-row", "data-row": i, transform: `translate(0 ${y})`, ...(row === undefined ? { display: "none" } : {}) }, inner);
  }
  const foot = HEAD + rows * ROW;
  out += el("text", { class: "ky-tw-rest", "data-t": "rest", x: 12, y: foot + 14, "font-size": 8.5 }, esc(data.rest));
  out += el("text", { class: "ky-tw-fast", "data-t": "fast", x: 12, y: foot + 32, "font-size": 11 }, esc(data.fastest));
  return el("title", {}, esc(w.tower.caption)) + el("g", { class: "ky-tw", "data-flag": data.flag }, out);
}

/** The tower's own rules: it is dark with light type on any ground, and the first row and the fastest lap are the accent. Scoped to where a tower can be (the plan view, the 3D view, the overlay). */
export const TOWER_STYLE = `
.ky-circuit .ky-tw-bg,.ky-turn .ky-tw-bg,.ky-race-overlay .ky-tw-bg{fill:#12161b;fill-opacity:.9;stroke:#2b323b;stroke-width:1.5}
.ky-circuit .ky-tw text,.ky-turn .ky-tw text,.ky-race-overlay .ky-tw text{fill:#f1f3f5;font-family:var(--ky-font,system-ui,sans-serif);font-variant-numeric:tabular-nums}
.ky-circuit .ky-tw-stage,.ky-turn .ky-tw-stage,.ky-race-overlay .ky-tw-stage{font-weight:800}
.ky-circuit .ky-tw-code,.ky-turn .ky-tw-code,.ky-race-overlay .ky-tw-code{font-weight:800}
.ky-circuit .ky-tw-row:first-of-type .ky-tw-pos,.ky-turn .ky-tw-row:first-of-type .ky-tw-pos,.ky-race-overlay .ky-tw-row:first-of-type .ky-tw-pos{fill:var(--ky-ci-lead,#f5b50a)}
.ky-circuit .ky-tw-rest,.ky-turn .ky-tw-rest,.ky-race-overlay .ky-tw-rest{fill:#aab2bb}
.ky-circuit .ky-tw-fast,.ky-turn .ky-tw-fast,.ky-race-overlay .ky-tw-fast{fill:#c9a6ff}
.ky-circuit .ky-tw-sw,.ky-turn .ky-tw-sw,.ky-race-overlay .ky-tw-sw{stroke:#ffffff55;stroke-width:.8}
.ky-circuit .ky-tw-flag,.ky-turn .ky-tw-flag,.ky-race-overlay .ky-tw-flag{fill:#2f9e44}
.ky-circuit .ky-tw[data-flag=grid] .ky-tw-flag,.ky-turn .ky-tw[data-flag=grid] .ky-tw-flag,.ky-race-overlay .ky-tw[data-flag=grid] .ky-tw-flag{fill:#6b7480}
.ky-circuit .ky-tw-chq,.ky-turn .ky-tw-chq,.ky-race-overlay .ky-tw-chq{display:none}
.ky-circuit .ky-tw[data-flag=chequered] .ky-tw-chq,.ky-turn .ky-tw[data-flag=chequered] .ky-tw-chq,.ky-race-overlay .ky-tw[data-flag=chequered] .ky-tw-chq{display:inline}
.ky-circuit .ky-tw[data-flag=chequered] .ky-tw-flag,.ky-turn .ky-tw[data-flag=chequered] .ky-tw-flag,.ky-race-overlay .ky-tw[data-flag=chequered] .ky-tw-flag{display:none}
.ky-circuit .ky-tw-sq-dark,.ky-turn .ky-tw-sq-dark,.ky-race-overlay .ky-tw-sq-dark{fill:#111}
.ky-circuit .ky-tw-sq-light,.ky-turn .ky-tw-sq-light,.ky-race-overlay .ky-tw-sq-light{fill:#fff}
`.trim();

/** A tower that is in the page: the elements `writeTower` writes into. */
export interface TowerView {
  root: Element;
  stage: Element | null;
  flag: Element | null;
  rest: Element | null;
  fast: Element | null;
  rows: { g: Element; pos: Element | null; sw: Element | null; code: Element | null; gap: Element | null }[];
  /** What was last written, so that nothing is written twice. */
  last: string;
}

/** Find the elements of a tower made by `towerMarkup` inside `root`. */
export function bindTower(root: Element): TowerView {
  const part = (parent: Element, name: string): Element | null => parent.querySelector(`[data-t="${name}"]`);
  return {
    root,
    stage: part(root, "stage"),
    flag: root.querySelector(".ky-tw"),
    rest: part(root, "rest"),
    fast: part(root, "fast"),
    rows: [...root.querySelectorAll(".ky-tw-row")].map((g) => ({ g, pos: part(g, "pos"), sw: part(g, "sw"), code: part(g, "code"), gap: part(g, "gap") })),
    last: "",
  };
}

const setText = (el: Element | null, text: string): void => {
  if (el !== null && el.textContent !== text) el.textContent = text;
};

/** Write what the tower shows into a tower that is in the page: only what changed, and nothing at all when nothing did. Makes no element. */
export function writeTower(view: TowerView, data: TowerData): void {
  const key = JSON.stringify(data);
  if (key === view.last) return;
  view.last = key;
  setText(view.stage, data.stage);
  if (view.flag?.getAttribute("data-flag") !== data.flag) view.flag?.setAttribute("data-flag", data.flag);
  setText(view.rest, data.rest);
  setText(view.fast, data.fastest);
  view.rows.forEach((r, i) => {
    const row = data.rows[i];
    const shown = row !== undefined;
    if ((r.g.getAttribute("display") === "none") === shown) {
      if (shown) r.g.removeAttribute("display");
      else r.g.setAttribute("display", "none");
    }
    if (row === undefined) return;
    setText(r.pos, String(row.position));
    setText(r.code, row.code);
    setText(r.gap, row.gap);
    if (r.sw?.getAttribute("fill") !== row.colour) r.sw?.setAttribute("fill", row.colour);
  });
}

/** The points of a line, and between them one every `step` units, so that a rectangle that a segment crosses has a point in it. */
function dense(points: readonly Pt[], closed: boolean, step: number): Pt[] {
  const out: Pt[] = [];
  const last = closed ? points.length : points.length - 1;
  for (let i = 0; i < last; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < n; j += 1) out.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
  }
  return out;
}

/**
 * Where the tower stands in the plan: its middle, beside the start and finish straight, on the side where its rectangle (and a margin the width of the track) is clear of the lap and the pit lane, as near the straight
 * as that allows, and inside what the plan draws. In feet, like the plan.
 */
export function towerPlace(plan: CircuitPlan, w: number, h: number): { at: Pt; side: -1 | 1 } {
  const [dx, dy] = plan.start.dir;
  const across: Pt = [-dy, dx];
  const margin = plan.width / 2 + 0.03 * w;
  const road = [...dense(plan.lap, true, Math.max(plan.width, h / 8)), ...dense(plan.pitLane, false, Math.max(plan.width, h / 8))];
  const clear = (at: Pt): boolean => road.every((p) => Math.abs(p[0] - at[0]) > w / 2 + margin || Math.abs(p[1] - at[1]) > h / 2 + margin);
  const inside = (at: Pt): boolean => at[0] - w / 2 >= plan.box.x0 && at[0] + w / 2 <= plan.box.x1 && at[1] - h / 2 >= plan.box.y0 && at[1] + h / 2 <= plan.box.y1;
  let best: { at: Pt; side: -1 | 1; room: number } | undefined;
  for (let reach = plan.width / 2 + w / 3; reach <= plan.width / 2 + 14 * h; reach += h / 10) {
    for (const side of [1, -1] as const) {
      const at: Pt = [plan.start.at[0] + across[0] * side * reach, plan.start.at[1] + across[1] * side * reach];
      if (inside(at) && clear(at)) return { at, side };
      const room = Math.min(nearestOn(plan.lap, at, true).d, nearestOn(plan.pitLane, at, false).d) - (inside(at) ? 0 : 1e6);
      if (best === undefined || room > best.room) best = { at, side, room };
    }
  }
  return { at: best!.at, side: best!.side };
}

/** The tower's size and place in the plan, for a race of `cars` cars on a plan drawn with `k` (a thousandth of its longer side): its width is 17 of them. */
export function towerFrame(plan: CircuitPlan, k: number, cars: number): { rows: number; at: Pt; w: number; h: number; s: number } {
  const rows = Math.min(TOWER_ROWS, cars);
  const w = 170 * k;
  const s = w / TOWER_W;
  const h = towerHeight(rows) * s;
  return { rows, at: towerPlace(plan, w, h).at, w, h, s };
}
