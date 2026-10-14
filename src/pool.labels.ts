// The data of a race on a pool: who is in each lane (the lane number, the flag, the name, the country's letters), what each swam (the place as a medal, the time, the reaction time, the splits) and the
// split pace bars in the lanes. Drawn in feet in the frame of a pool lying wide; a pool lying tall turns it with the pool, so that the labels lie along the lanes, and only the numbers in the discs are
// turned back upright. Nothing here is a rule of the sport: the sizes are ours.
import { safeColour, safeLogo } from "./colour.ts";
import { el, esc, num } from "./format.ts";
import { feet, type SwimPlan } from "./pool.ts";
import { STATUS_TEXT, formatTime, pacePer100, splitMetres, type RaceRow } from "./pool.race.ts";
import { textOn, ft, type BuildOptions } from "./surfaces/surface.ts";
import { textWidth } from "./text.ts";

/** What the data of a race draws: the plates at each end, the title above, the pace bars on the water, and how far each reaches beyond the pool, in feet. */
export interface RaceArt {
  /** The plates at the starting end (the names), at the turning end (the results), and the event and the distances above the pool. */
  left: string;
  right: string;
  top: string;
  /** The pace bars, over the water and under the ropes' labels. */
  pace: string;
  reachLeft: number;
  reachRight: number;
  reachTop: number;
}

const ROW = feet(2.5);
const NAME = 2.7;
const SMALL = 2.0;
const DISC = 1.75;
const GAP = 1.1;
/** The medal each of the first three places wins: gold, silver and bronze, in these colours whatever the look. */
export const MEDALS: Readonly<Record<number, string>> = Object.freeze({ 1: "#d9a620", 2: "#aeb6c0", 3: "#b8733a" });

/** The width of text in feet, with a margin of a tenth: the estimate is for a bold face, and the pages' fonts differ. */
const tw = (text: string, size: number): number => textWidth(text) * size * 1.1;

/** The most splits a plate writes; a longer race has its splits in the pace bars. */
const MOST_SPLITS = 8;

/** The pace bar colours, slowest to fastest: a dark to light scale that stays legible on the water and in print (the scale of viridis, reversed in meaning so that bright is fast). */
const PACE_STOPS: readonly (readonly [number, number, number])[] = [
  [68, 1, 84],
  [59, 82, 139],
  [33, 145, 140],
  [94, 201, 98],
  [253, 231, 37],
];

/** The colour of a pace between the field's slowest (0) and fastest (1). */
export function paceColour(t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (PACE_STOPS.length - 1);
  const k = Math.min(PACE_STOPS.length - 2, Math.floor(x));
  const f = x - k;
  const c = PACE_STOPS[k].map((v, i) => Math.round(v + (PACE_STOPS[k + 1][i] - v) * f));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** The ink that reads on a colour. */
const inkFor = (hex: string): string => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#10161c" : "#ffffff";
};

function disc(o: Pick<BuildOptions, "portrait">, cx: number, cy: number, text: string, cls: string, fill?: string): string {
  const r = DISC;
  const size = text.length > 2 ? r * 0.95 : r * 1.25;
  return el("circle", { class: cls, cx, cy, r, fill }) + textOn(o.portrait, cx, cy + size * 0.36, text, { size, anchor: "middle", cls: "ky-pl-dn", weight: 800 });
}

function flagMarkup(row: RaceRow, x: number, cy: number, w: number, h: number): string {
  const logo = safeLogo(row.flag);
  if (logo === undefined) return "";
  return el("image", { class: "ky-logo", href: logo, x, y: cy - h / 2, width: w, height: h, preserveAspectRatio: "xMidYMid slice" }) + el("rect", { class: "ky-pl-fb", x, y: cy - h / 2, width: w, height: h, rx: 0.25, fill: "none" });
}

/** The plate of a swimmer at the starting end, and its width in feet. */
function namePlate(plan: SwimPlan, o: Pick<BuildOptions, "portrait">, row: RaceRow, cy: number, widths: { name: number; abbr: number; seed: number; flag: number }, size: number): string {
  const race = plan.race;
  if (race === undefined) return "";
  const show = race.show;
  const h = ROW * 0.84;
  const plateW = plateWidth(plan, widths);
  const x1 = -labelEdge();
  const x0 = x1 - plateW;
  let out = el("rect", { class: "ky-pl-pl", x: x0, y: cy - h / 2, width: plateW, height: h, rx: h * 0.18 });
  const colour = safeColour(row.color);
  if (colour !== undefined) out += el("rect", { x: x0, y: cy - h / 2, width: 0.7, height: h, fill: colour, rx: 0.3 });
  let x = x0 + GAP + (colour === undefined ? 0 : 0.7);
  if (show.flags && widths.flag > 0) {
    out += flagMarkup(row, x, cy, widths.flag, widths.flag * 0.667);
    x += widths.flag + GAP;
  }
  if (show.names) {
    out += el("text", { class: "ky-text ky-pl-nm", x, y: cy + size * 0.36, "font-size": size }, esc(row.name));
    x += widths.name + GAP;
  }
  if (widths.abbr > 0) {
    out += el("text", { class: "ky-text ky-pl-ab", x, y: cy + SMALL * 0.36, "font-size": SMALL }, esc(row.abbr));
    x += widths.abbr + GAP;
  }
  if (widths.seed > 0) {
    out += el("text", { class: "ky-text ky-pl-ab", x, y: cy + SMALL * 0.36, "font-size": SMALL * 0.9 }, esc(row.seed ?? ""));
    x += widths.seed + GAP;
  }
  out += disc(o, x1 - GAP - DISC, cy, String(row.lane), "ky-pl-ld");
  return el("g", { class: "ky-pl-row", "data-lane": row.lane }, out);
}

/** How far from the pool's end wall the plates stand, in feet: past the blocks. */
function labelEdge(): number {
  return feet(1.6) + 1.2;
}

function plateWidth(plan: SwimPlan, widths: { name: number; abbr: number; seed: number; flag: number }): number {
  const show = plan.race?.show;
  let w = GAP + DISC * 2 + GAP;
  if (show?.flags && widths.flag > 0) w += widths.flag + GAP;
  if (show?.names) w += widths.name + GAP;
  if (widths.abbr > 0) w += widths.abbr + GAP;
  if (widths.seed > 0) w += widths.seed + GAP;
  return w;
}

/** The text of a row's splits: the cumulative times at 50, 100... as the scoreboard writes them. */
const splitsText = (row: RaceRow): string => row.splits.filter((s) => Number.isFinite(s)).map(formatTime).join("  ");

/** The plate of a result at the turning end. */
function resultPlate(plan: SwimPlan, o: Pick<BuildOptions, "portrait">, row: RaceRow, cy: number, measure: { time: number; extra: number; lines: number }, length: number): string {
  const race = plan.race;
  if (race === undefined) return "";
  const show = race.show;
  const h = ROW * 0.84;
  const x0 = length + labelEdge();
  const plateW = measure.time + measure.extra + 2 * GAP + (show.medals ? DISC * 2 + GAP : 0);
  let out = el("rect", { class: "ky-pl-pl", x: x0, y: cy - h / 2, width: plateW, height: h, rx: h * 0.18 });
  let x = x0 + GAP;
  const place = row.place;
  if (show.medals && row.status === undefined) {
    if (place !== undefined) {
      const colour = MEDALS[place];
      out += disc(o, x + DISC, cy, String(place), colour === undefined ? "ky-pl-ld" : "ky-pl-mm", colour);
      if (colour !== undefined) out += el("circle", { class: "ky-pl-mr", cx: x + DISC, cy, r: DISC - 0.35 });
    }
    x += DISC * 2 + GAP;
  } else if (show.medals) x += DISC * 2 + GAP;
  const time = row.status !== undefined ? STATUS_TEXT[row.status] : (row.timeText ?? "");
  const two = measure.lines === 2;
  const topY = two ? cy - ROW * 0.12 : cy;
  out += el("text", { class: "ky-text ky-pl-tm", x, y: topY + NAME * 0.36, "font-size": NAME }, esc(time));
  let tail = x + tw(time, NAME) + GAP * 1.6;
  if (row.record !== undefined) {
    out += el("text", { class: "ky-text ky-pl-rc", x: tail, y: topY + SMALL * 0.36, "font-size": SMALL * 0.9 }, esc(row.record));
    tail += tw(row.record, SMALL * 0.9) + GAP * 1.2;
  }
  if (show.reaction && row.reaction !== undefined) out += el("text", { class: "ky-text ky-pl-ab", x: tail, y: topY + SMALL * 0.36, "font-size": SMALL * 0.9 }, esc(`RT ${row.reaction.toFixed(2)}`));
  if (two) out += el("text", { class: "ky-text ky-pl-sp", x, y: cy + ROW * 0.22 + SMALL * 0.3, "font-size": SMALL * 0.9 }, esc(splitsText(row)));
  return el("g", { class: "ky-pl-row", "data-lane": row.lane }, out);
}

/** The pace bars of the race: each split a bar along its share of the lane, in the colour of its pace. */
function paceBars(plan: SwimPlan, o: Pick<BuildOptions, "portrait" | "features">): string {
  const race = plan.race;
  if (race === undefined || race.pace === null || race.fastest === undefined || race.slowest === undefined) return "";
  const L = feet(plan.length);
  const lanes = new Map(plan.lanes.map((lane) => [lane.number, lane]));
  const span = race.slowest - race.fastest;
  let out = "";
  for (const row of race.rows) {
    const lane = lanes.get(row.lane);
    if (lane === undefined) continue;
    const cy = feet(lane.y);
    const h = ROW * 0.5;
    row.splits.forEach((cum, i) => {
      const from = i === 0 ? 0 : row.splits[i - 1];
      if (!Number.isFinite(cum) || !Number.isFinite(from)) return;
      const metres = splitMetres(i, race.splitEvery, race.distance);
      const pace = pacePer100(from, cum, metres);
      const colour = paceColour(span <= 1e-9 ? 0.5 : 1 - (pace - race.fastest!) / span);
      const x0 = ((i * race.splitEvery) / race.distance) * L;
      const x1 = Math.min(L, x0 + (metres / race.distance) * L);
      const gap = 0.35;
      out += el("rect", { class: "ky-pl-pb", x: x0 + gap, y: cy - h / 2, width: Math.max(0.1, x1 - x0 - 2 * gap), height: h, rx: 0.7, fill: colour, "data-pace": num(pace) });
      if (race.pace?.labels === true) {
        const text = formatTime(cum - from);
        const size = Math.min(2.1, ((x1 - x0 - 2 * gap) * 0.9) / Math.max(1, tw(text, 1)), h * 0.5);
        if (size >= 0.9) out += el("text", { class: `ky-text ky-pl-pt ky-pl-pt-${inkFor(colour) === "#ffffff" ? "l" : "d"}`, x: (x0 + x1) / 2, y: cy + size * 0.36, "font-size": size, "text-anchor": "middle" }, esc(text));
      }
    });
  }
  return el("g", { class: ft(o, "pace-bars", "ky-pl-pace") }, out);
}

/** The distances above the pool for the pace bars: where each split ends, in metres of the race. */
function paceAxis(plan: SwimPlan): string {
  const race = plan.race;
  if (race === undefined || race.pace === null) return "";
  const L = feet(plan.length);
  let out = "";
  const count = Math.max(1, Math.round(race.distance / race.splitEvery));
  for (let i = 0; i <= count; i += 1) {
    const d = Math.min(race.distance, i * race.splitEvery);
    const x = (d / race.distance) * L;
    out += el("text", { class: "ky-text ky-pl-ax", x, y: -feet(0.85), "font-size": 2, "text-anchor": i === 0 ? "start" : i === count ? "end" : "middle" }, `${num(d)} m`);
    out += el("path", { class: "ky-line ky-pl-tick", d: `M${num(x)} ${num(-feet(0.5))}V${num(-feet(0.1))}`, "stroke-width": 0.25 });
  }
  return out;
}

/** Everything the data of the race draws. */
export function raceArt(plan: SwimPlan, o: Pick<BuildOptions, "portrait" | "features" | "exact">): RaceArt {
  const race = plan.race;
  const none: RaceArt = { left: "", right: "", top: "", pace: "", reachLeft: 0, reachRight: 0, reachTop: 0 };
  if (race === undefined) return none;
  const show = race.show;
  const lanes = new Map(plan.lanes.map((lane) => [lane.number, lane]));
  const length = feet(plan.length);
  // The widths of the columns: the longest name fitted into a plate at most this wide (the size shrinks for it).
  const longest = Math.max(0, ...race.rows.map((r) => tw(r.name, NAME)));
  const nameMax = 44;
  const size = longest > nameMax ? NAME * (nameMax / longest) : NAME;
  const widths = {
    name: show.names ? Math.min(nameMax, Math.max(14, longest)) : 0,
    abbr: show.names ? Math.max(0, ...race.rows.map((r) => tw(r.abbr, SMALL))) : 0,
    seed: show.seeds && race.rows.some((r) => r.seed !== undefined) ? Math.max(...race.rows.map((r) => tw(r.seed ?? "", SMALL * 0.9))) : 0,
    flag: show.flags && race.rows.some((r) => safeLogo(r.flag) !== undefined) ? 4.5 : 0,
  };
  let left = "";
  let reachLeft = 0;
  if (race.rows.length > 0 && (show.names || show.flags)) {
    for (const row of race.rows) {
      const lane = lanes.get(row.lane);
      if (lane !== undefined) left += namePlate(plan, o, row, feet(lane.y), widths, size);
    }
    reachLeft = labelEdge() + plateWidth(plan, widths);
  }
  let right = "";
  let reachRight = 0;
  if (race.rows.length > 0 && show.results && race.hasResults) {
    const splits = show.splits && race.rows.some((r) => r.splits.length > 0 && r.splits.length <= MOST_SPLITS);
    const lines = splits ? 2 : 1;
    const times = Math.max(...race.rows.map((r) => tw(r.status !== undefined ? STATUS_TEXT[r.status] : (r.timeText ?? ""), NAME)));
    const extras = Math.max(
      ...race.rows.map((r) => {
        const head = GAP * 0.6 + (r.record === undefined ? 0 : tw(r.record, SMALL * 0.9) + GAP * 1.2) + (show.reaction && r.reaction !== undefined ? tw(`RT ${r.reaction.toFixed(2)}`, SMALL * 0.9) + GAP : 0);
        const splitW = splits && r.splits.length <= MOST_SPLITS ? tw(splitsText(r), SMALL * 0.9) - times : 0;
        return Math.max(head + GAP, splitW);
      }),
    );
    const measure = { time: times, extra: Math.max(0, extras), lines };
    for (const row of race.rows) {
      const lane = lanes.get(row.lane);
      if (lane === undefined) continue;
      const rowSplits = splits && row.splits.length > 0 && row.splits.length <= MOST_SPLITS;
      right += resultPlate(plan, o, row, feet(lane.y), { ...measure, lines: rowSplits ? 2 : 1 }, length);
    }
    reachRight = labelEdge() + measure.time + measure.extra + 2 * GAP + (show.medals ? DISC * 2 + GAP : 0);
  }
  let top = "";
  let reachTop = 0;
  if (race.event !== undefined) {
    top += el("text", { class: "ky-text ky-pl-ev", x: -reachLeft, y: race.pace === null ? -feet(1.2) : -feet(2.5), "font-size": 3.1 }, esc(race.event));
  }
  const pace = race.pace === null ? "" : paceBars(plan, o);
  if (race.pace !== null) {
    top += paceAxis(plan);
    reachTop = feet(race.event === undefined ? 1.6 : 3.1);
  }
  return { left, right, top, pace, reachLeft, reachRight, reachTop };
}
