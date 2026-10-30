// A judging assignment worked out: the options held to what they may be, each mat's seats with who sits in them, and where the seats are on the plan. The plan is the package's own judo area (`budoPlan`), so that the
// seats named here are the seats drawn, in metres from the top left of the tatami. Nothing here draws.
import { budoPlan, type BudoPlan, type MBox } from "./budo/plan.ts";
import { JUDGING_LEAGUE, JUDGING_MATS_MAX, JUDGING_SEATS, JUDGING_SEAT_WORDS, JUDGING_STYLES } from "./judging.data.ts";
import type { JudgingAssignment, JudgingMat, JudgingOptions, JudgingResolved, JudgingSeat, JudgingStyle } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import { fill } from "./strings.core.ts";
import type { Language } from "./types.ts";

/** The longest name, ID and mat label that are taken, in characters. */
export const JUDGING_LIMITS = Object.freeze({ name: 120, id: 64, label: 40, line: 60 });

/** Text made safe to show: control characters become spaces, runs of spaces one, the ends trimmed. */
const clean = (text: string): string => text.replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim();

/** The seats of a style: every one, or without the optional ones (the side judges of a contest). @throws TypeError for a style that is not one. */
export function seatsOf(style: unknown, only: "all" | "listed" = "all"): readonly JudgingSeat[] {
  if (typeof style !== "string" || !(JUDGING_STYLES as readonly string[]).includes(style)) throw new TypeError(`judging style is ${JUDGING_STYLES.map((s) => `"${s}"`).join(" or ")}`);
  const seats = JUDGING_SEATS[style as JudgingStyle];
  return only === "all" ? seats : seats.filter((s) => s.optional !== true);
}

/**
 * The seat a name stands for: its number (`3`, `"3"`), its key (`"judge-3"`, `"Judge 3"`, `"referee"`, `"timekeeper"`) or a word (`"central"`, `"scorer"`, `"jury"`).
 * @throws RangeError for a seat the style does not have, naming the seats it has.
 */
export function seatOf(style: JudgingStyle, seat: unknown): JudgingSeat {
  const seats = seatsOf(style);
  const text = typeof seat === "number" ? String(seat) : typeof seat === "string" ? seat.trim().toLowerCase().replace(/\s+/g, "-") : "";
  let found: JudgingSeat | undefined;
  if (/^\d{1,2}$/.test(text)) found = seats.find((s) => s.n === Number(text));
  else found = seats.find((s) => s.id === text) ?? seats.find((s) => JUDGING_SEAT_WORDS[s.id]?.includes(text) === true);
  if (found === undefined) throw new RangeError(`The ${style} area has no seat ${JSON.stringify(seat)}: its seats are ${seats.map((s) => s.id).join(", ")} (or their numbers)`);
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

/** The line of a mat's broadcast board: the caller's, held to its length, or nothing. */
export function matLine(mat: JudgingMat): string {
  if (mat.line === undefined) return "";
  if (typeof mat.line !== "string") throw new TypeError("a mat's line is text");
  const line = clean(mat.line);
  if ([...line].length > JUDGING_LIMITS.line) throw new RangeError(`A mat's line is at most ${JUDGING_LIMITS.line} characters`);
  return line;
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
  /** `plan`: the plan with its chart; `broadcast`: the mat large with the board at its side. */
  view: "plan" | "broadcast";
  orientation: "landscape" | "portrait";
  focus: "mat" | "bench";
  width: number;
  /** Whether the names are on the seats (`seatNames`). */
  seatNames: boolean;
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
  const given = options.mats.map((mat, i) => {
    if (typeof mat !== "object" || mat === null) throw new TypeError("a mat is { label, officials }");
    const byId = new Map<string, JudgingAssignment>();
    for (const official of mat.officials ?? []) {
      if (typeof official !== "object" || official === null) throw new TypeError("an official is { seat, name, id }");
      const seat = seatOf(style, official.seat);
      if (byId.has(seat.id)) throw new RangeError(`Mat ${i + 1} names seat ${seat.id} twice`);
      if (official.name !== undefined && typeof official.name !== "string") throw new TypeError("an official's name is text");
      if (official.id !== undefined && typeof official.id !== "string" && typeof official.id !== "number") throw new TypeError("an official's id is text or a number");
      const name = clean(official.name ?? "");
      const id = clean(official.id === undefined ? "" : String(official.id));
      if ([...name].length > JUDGING_LIMITS.name) throw new RangeError(`A name is at most ${JUDGING_LIMITS.name} characters`);
      if ([...id].length > JUDGING_LIMITS.id) throw new RangeError(`An ID is at most ${JUDGING_LIMITS.id} characters`);
      byId.set(seat.id, { seat, name, id, assigned: name !== "" || id !== "" });
    }
    return byId;
  });
  if (options.sideJudges !== undefined && typeof options.sideJudges !== "boolean") throw new TypeError("sideJudges is true or false");
  if (options.seatNames !== undefined && typeof options.seatNames !== "boolean") throw new TypeError("seatNames is true or false");
  // The seats that are drawn: every one that is not optional, and an optional one when asked for or when a mat names it.
  const shown = seats.filter((seat) => seat.optional !== true || options.sideJudges === true || given.some((m) => m.has(seat.id)));
  const all: JudgingResolved[] = options.mats.map((mat, i): JudgingResolved => ({ n: i + 1, label: matLabel(mat, i + 1, language), line: matLine(mat), seats: shown.map((seat) => given[i].get(seat.id) ?? { seat, name: "", id: "", assigned: false }) }));
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
    view: oneOf(options.view, ["plan", "broadcast"], "plan", "view"),
    orientation: oneOf(options.orientation, ["landscape", "portrait"], "landscape", "orientation"),
    focus: oneOf(options.focus, ["mat", "bench"], "mat", "focus"),
    width,
    seatNames: options.seatNames === true,
  };
}

/** Where one seat is on a mat's plan, in metres from the top left of the tatami: its chair (or the place where the official stands) and the card that carries the name, which may lie over the table in front of it. */
export interface SeatPlace {
  chair: MBox;
  card: MBox;
}

/** One mat's seats, in the order the style lists them (`JUDGING_SEATS`, optional seats included), its table and its bench. */
export interface MatPlaces {
  places: SeatPlace[];
  /** The judges' table or the technical table behind the seats at it. */
  table: MBox;
  /** The seats at the table close up: the picture of `focus: "bench"`. */
  bench: MBox;
}

/** Where the seats are on the plan of a style, and the plan they are on. */
export interface JudgingPlan {
  plan: BudoPlan;
  /** Each mat's seats, for the mats side by side the plan has (`count`). */
  mats: MatPlaces[];
  /** The first mat's seats, its table and its bench, as `mats[0]` has them (the chairs of the seats, in order). */
  places: SeatPlace[];
  chairs: MBox[];
  table: MBox;
  bench: MBox;
  /** The distance between two seats at the table. */
  pitch: number;
  /** The whole picture of a mat (the free zone, the table, the seats, their cards): what `focus: "mat"` shows, for the first mat. */
  extent: MBox;
}

const plans = new Map<string, JudgingPlan>();

/** A box of a given centre and size. */
const around = (cx: number, cy: number, w: number, h: number): MBox => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 });

const union = (boxes: readonly MBox[]): MBox => ({ x0: Math.min(...boxes.map((b) => b.x0)), y0: Math.min(...boxes.map((b) => b.y0)), x1: Math.max(...boxes.map((b) => b.x1)), y1: Math.max(...boxes.map((b) => b.y1)) });

/** A card for a seat that is not at a table (the referee on the mat, a side judge at a corner): 2.6 m by 1.8 m, since there is room round them (ours). */
const FREE_CARD = { w: 2.6, h: 1.8 };

/**
 * The judges' bench close up: the seats and their table with a little round them and a few rows of mats in front, from the seats of one mat or of several side by side. `matTop` is where the mats start (the top of the first
 * contest area), so that the picture shows how the bench sits at the mat's edge; `front` instead says how far in front of the table the picture reaches, in metres (the 3D view, which turns, wants as little of the floor as
 * will do).
 */
export function benchOf(chairs: readonly MBox[], table: MBox, pitch: number, matTop: number, front?: number): MBox {
  const side = (pitch - 0.5) / 2 + 0.15;
  return { x0: Math.min(...chairs.map((c) => c.x0)) - side, y0: chairs[0].y0 - 0.9, x1: Math.max(...chairs.map((c) => c.x1)) + side, y1: front === undefined ? Math.max(table.y1 + 1.8, matTop + 1.2) : table.y1 + front };
}

/** A kata area's seats: five chairs behind one table, each with the card that lies over its chair and the table in front of it. */
function kataPlaces(chairs: readonly MBox[], table: MBox, pitch: number): SeatPlace[] {
  return chairs.map((chair) => {
    const cx = (chair.x0 + chair.x1) / 2;
    return { chair, card: { x0: cx - (pitch / 2 - 0.03), y0: chair.y0 - 0.05, x1: cx + (pitch / 2 - 0.03), y1: table.y1 } };
  });
}

/**
 * A contest's seats round one contest area (ours, but for the referee's: 2 m back from the line the athletes start on, at the centre, facing the table): the timekeeper, the scorekeeper and the referee supervisor in chairs
 * behind the technical table, 1 m apart, and the side judges at two opposite corners of the contest area, 2 m out from them.
 */
function shiaiPlaces(contest: MBox, desk: MBox): SeatPlace[] {
  const cx = (contest.x0 + contest.x1) / 2;
  const cy = (contest.y0 + contest.y1) / 2;
  const seat = (x: number, y: number, w: number, h: number): SeatPlace => ({ chair: around(x, y, 0.5, 0.5), card: around(x, y, w, h) });
  const chairY = desk.y0 - 0.35;
  const tableSeat = (x: number): SeatPlace => ({ chair: around(x, chairY, 0.5, 0.5), card: { x0: x - 0.47, y0: chairY - 0.3, x1: x + 0.47, y1: desk.y1 } });
  return [
    seat(cx, cy + 2, FREE_CARD.w, FREE_CARD.h),
    tableSeat(cx - 1),
    tableSeat(cx),
    tableSeat(cx + 1),
    seat(contest.x0 - 2, contest.y0 - 2, FREE_CARD.w, FREE_CARD.h),
    seat(contest.x1 + 2, contest.y1 + 2, FREE_CARD.w, FREE_CARD.h),
  ];
}

/** The plan of `count` mats side by side of a style, with its seats: the package's own judo area, so that the seats named are the seats drawn. */
export function judgingPlan(style: JudgingStyle, count = 1): JudgingPlan {
  const key = `${style}:${count}`;
  const hit = plans.get(key);
  if (hit !== undefined) return hit;
  seatsOf(style);
  const plan = budoPlan({ sport: "judo", league: JUDGING_LEAGUE[style].league, budo: { style, officials: true, areas: count } });
  const judo = plan.judo!;
  const mats: MatPlaces[] = [];
  for (let mi = 0; mi < count; mi += 1) {
    const contest = judo.contests[mi];
    if (style === "kata") {
      const per = JUDGING_SEATS.kata.length;
      const chairs = judo.judges.seats.slice(mi * per, (mi + 1) * per);
      const table = judo.judges.tables[mi];
      if (chairs.length !== per || table === undefined) throw new Error("The kata plan has no judges' seats");
      const pitch = (chairs[per - 1].x0 - chairs[0].x0) / (per - 1);
      mats.push({ places: kataPlaces(chairs, table, pitch), table, bench: benchOf(chairs, table, pitch, contest.y0) });
    } else {
      const desk = judo.desks[mi];
      if (desk === undefined) throw new Error("The contest plan has no technical table");
      const places = shiaiPlaces(contest, desk);
      const atTable = places.slice(1, 4);
      // The bench of a contest is its technical table with the three officials at it; the referee and the side judges are on the mat and at its corners, and are not in the picture of the bench.
      const bench: MBox = { x0: Math.min(...atTable.map((p) => p.card.x0)) - 0.4, y0: atTable[0].chair.y0 - 0.9, x1: Math.max(...atTable.map((p) => p.card.x1)) + 0.4, y1: desk.y1 + 1.8 };
      mats.push({ places, table: desk, bench });
    }
  }
  const first = mats[0];
  const chairs = first.places.map((p) => p.chair);
  const pitch = style === "kata" ? (first.places[first.places.length - 1].chair.x0 - first.places[0].chair.x0) / (first.places.length - 1) : 1;
  const extent = union([plan.extent, ...first.places.map((p) => p.card), ...first.places.map((p) => p.chair)]);
  const built: JudgingPlan = { plan, mats, places: first.places, chairs, table: first.table, bench: first.bench, pitch, extent };
  plans.set(key, built);
  return built;
}

/** Whether a seat is in a box: its card's middle is inside it. A seat that is not is not drawn in a close-up of the bench, and its name is in the chart only. */
export function seatIn(place: SeatPlace, box: MBox): boolean {
  const x = (place.card.x0 + place.card.x1) / 2;
  const y = (place.card.y0 + place.card.y1) / 2;
  return x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
}
