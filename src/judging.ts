// A judging assignment worked out: the options held to what they may be, each mat's seats with who sits in them, and where the seats are on the plan. The plan is the package's own judo area (`budoPlan`), so that the
// seats named here are the seats drawn, in metres from the top left of the tatami. Nothing here draws.
import { budoPlan, type BudoPlan, type MBox } from "./budo/plan.ts";
import { JUDGING_LEAGUE, JUDGING_MATS_MAX, JUDGING_SEATS, JUDGING_STYLES } from "./judging.data.ts";
import type { JudgingAssignment, JudgingMat, JudgingOptions, JudgingResolved, JudgingSeat, JudgingStyle } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import { fill } from "./strings.ts";
import type { Language } from "./types.ts";

/** The longest name, ID and mat label that are taken, in characters. */
export const JUDGING_LIMITS = Object.freeze({ name: 120, id: 64, label: 40 });

/** Text made safe to show: control characters become spaces, runs of spaces one, the ends trimmed. */
const clean = (text: string): string => text.replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim();

/** The seats of a style. @throws TypeError for a style that is not one. */
export function seatsOf(style: unknown): readonly JudgingSeat[] {
  if (typeof style !== "string" || !(JUDGING_STYLES as readonly string[]).includes(style)) throw new TypeError(`judging style is ${JUDGING_STYLES.map((s) => `"${s}"`).join(" or ")}`);
  return JUDGING_SEATS[style as JudgingStyle];
}

/**
 * The seat a name stands for: its number (`3`, `"3"`), its key (`"judge-3"`, `"Judge 3"`) or `"central"`.
 * @throws RangeError for a seat the style does not have, naming the seats it has.
 */
export function seatOf(style: JudgingStyle, seat: unknown): JudgingSeat {
  const seats = seatsOf(style);
  const text = typeof seat === "number" ? String(seat) : typeof seat === "string" ? seat.trim().toLowerCase() : "";
  let found: JudgingSeat | undefined;
  if (text === "central" || text === "centre" || text === "center") found = seats.find((s) => s.role === "central");
  else {
    const m = /^(?:judge)?[-\s]?(\d{1,2})$/.exec(text);
    if (m !== null) found = seats.find((s) => s.n === Number(m[1]));
  }
  if (found === undefined) throw new RangeError(`The ${style} area has no seat ${JSON.stringify(seat)}: its seats are ${seats.map((s) => s.id).join(", ")} (or their numbers, or "central")`);
  return found;
}

/** The label of a mat: the caller's, held to its length, else the language's `Mat {n}`. */
export function matLabel(mat: JudgingMat, n: number, language: Language): string {
  if (mat.label === undefined) return fill(JUDGING_WORDS[language].mat, { n });
  if (typeof mat.label !== "string") throw new TypeError("a mat's label is text");
  const label = clean(mat.label);
  if ([...label].length > JUDGING_LIMITS.label) throw new RangeError(`A mat's label is at most ${JUDGING_LIMITS.label} characters`);
  return label === "" ? fill(JUDGING_WORDS[language].mat, { n }) : label;
}

/** What `drawJudging` and the 3D view work from: the options held to what they may be, and every mat with all of its seats. */
export interface JudgingSetting {
  style: JudgingStyle;
  language: Language;
  /** The mats to draw (all of them, or the one `mat` names), each with every seat of the style. */
  mats: JudgingResolved[];
  /** How many mats the assignment has altogether. */
  total: number;
  chart: "auto" | "always" | "never";
  orientation: "landscape" | "portrait";
  focus: "mat" | "bench";
  width: number;
}

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T, label: string): T => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) throw new TypeError(`${label} is ${allowed.map((a) => `"${a}"`).join(" or ")}`);
  return value as T;
};

/**
 * Hold the options to what they may be and put each official in a seat.
 * @throws TypeError for an option of the wrong kind, RangeError for a number of mats outside 1 to 6, a mat that does not exist, a seat the style does not have, a seat named twice on one mat or a text that is too long.
 */
export function judgingSetting(options: JudgingOptions): JudgingSetting {
  const style = options.style;
  const seats = seatsOf(style);
  if (!Array.isArray(options.mats) || options.mats.length < 1 || options.mats.length > JUDGING_MATS_MAX) throw new RangeError(`An assignment has 1 to ${JUDGING_MATS_MAX} mats`);
  const language: Language = options.language === "ja" ? "ja" : "en";
  const all: JudgingResolved[] = options.mats.map((mat, i): JudgingResolved => {
    if (typeof mat !== "object" || mat === null) throw new TypeError("a mat is { label, officials }");
    const given = new Map<string, JudgingAssignment>();
    for (const official of mat.officials ?? []) {
      if (typeof official !== "object" || official === null) throw new TypeError("an official is { seat, name, id }");
      const seat = seatOf(style, official.seat);
      if (given.has(seat.id)) throw new RangeError(`Mat ${i + 1} names seat ${seat.id} twice`);
      if (official.name !== undefined && typeof official.name !== "string") throw new TypeError("an official's name is text");
      if (official.id !== undefined && typeof official.id !== "string" && typeof official.id !== "number") throw new TypeError("an official's id is text or a number");
      const name = clean(official.name ?? "");
      const id = clean(official.id === undefined ? "" : String(official.id));
      if ([...name].length > JUDGING_LIMITS.name) throw new RangeError(`A name is at most ${JUDGING_LIMITS.name} characters`);
      if ([...id].length > JUDGING_LIMITS.id) throw new RangeError(`An ID is at most ${JUDGING_LIMITS.id} characters`);
      given.set(seat.id, { seat, name, id, assigned: name !== "" || id !== "" });
    }
    return { n: i + 1, label: matLabel(mat, i + 1, language), seats: seats.map((seat) => given.get(seat.id) ?? { seat, name: "", id: "", assigned: false }) };
  });
  let mats = all;
  if (options.mat !== undefined) {
    if (!Number.isInteger(options.mat) || options.mat < 1 || options.mat > all.length) throw new RangeError(`mat is a whole number from 1 to ${all.length}`);
    mats = [all[options.mat - 1]];
  }
  const width = options.width ?? 1000;
  if (typeof width !== "number" || !Number.isFinite(width) || width < 480 || width > 2000) throw new RangeError("width is a number from 480 to 2000");
  return {
    style,
    language,
    mats,
    total: all.length,
    chart: oneOf(options.chart, ["auto", "always", "never"], "auto", "chart"),
    orientation: oneOf(options.orientation, ["landscape", "portrait"], "landscape", "orientation"),
    focus: oneOf(options.focus, ["mat", "bench"], "mat", "focus"),
    width,
  };
}

/** Where the seats are on one mat's plan, in metres from the top left of the tatami, and the plan they are on. */
export interface JudgingPlan {
  plan: BudoPlan;
  /** The chair of each seat, in seat order, and the judges' table behind them. */
  chairs: MBox[];
  table: MBox;
  /** The distance between two seats. */
  pitch: number;
  /** The whole picture of a mat (the free zone, the table, the seats, the coach's chair) and the judges' bench close up. */
  extent: MBox;
  bench: MBox;
}

const plans = new Map<JudgingStyle, JudgingPlan>();

/**
 * The judges' bench close up: the seats and the table with a little round them and a few rows of mats in front, from the seats of one mat or of several side by side. `matTop` is where the mats start (the top of the first
 * contest area), so that the picture shows how the bench sits at the mat's edge; `front` instead says how far in front of the table the picture reaches, in metres (the 3D view, which turns, wants as little of the floor as will do).
 */
export function benchOf(chairs: readonly MBox[], table: MBox, pitch: number, matTop: number, front?: number): MBox {
  const side = (pitch - 0.5) / 2 + 0.15;
  return { x0: Math.min(...chairs.map((c) => c.x0)) - side, y0: chairs[0].y0 - 0.9, x1: Math.max(...chairs.map((c) => c.x1)) + side, y1: front === undefined ? Math.max(table.y1 + 1.8, matTop + 1.2) : table.y1 + front };
}

/** The plan of one mat of a style, with its seats: the package's own judo area, so that the seats named are the seats drawn. */
export function judgingPlan(style: JudgingStyle): JudgingPlan {
  const hit = plans.get(style);
  if (hit !== undefined) return hit;
  seatsOf(style);
  const plan = budoPlan({ sport: "judo", league: JUDGING_LEAGUE[style].league, budo: { style, officials: true } });
  const judges = plan.judo?.judges;
  if (judges === undefined || judges.seats.length !== JUDGING_SEATS[style].length || judges.tables.length === 0) throw new Error(`The ${style} plan has no judges' seats`);
  const chairs = judges.seats.slice(0, JUDGING_SEATS[style].length);
  const table = judges.tables[0];
  const pitch = (chairs[chairs.length - 1].x0 - chairs[0].x0) / (chairs.length - 1);
  const first = plan.judo!.contests[0];
  const bench = benchOf(chairs, table, pitch, first.y0);
  const built: JudgingPlan = { plan, chairs, table, pitch, extent: plan.extent, bench };
  plans.set(style, built);
  return built;
}
