// The small pictures a situation is told with, each drawn upright in a frame of its own whose origin is its middle: the pill of hockey's strength, the scorebug of baseball (the diamond
// with its runners, the outs, the inning and the count), the tag of football's down and distance, and the strip of a hockey shootout. `size` is the height of a letter in the frame's
// units, so a widget is as big on a surface (feet) as it is in a badge (pixels) when it is given the right size. The drawing places them (`situation.draw.ts`, `score.ts`).
import { el, esc, num } from "./format.ts";
import { textWidth as measure } from "./text.ts";

/** The width of a text in ems, with room to spare for a face wider than the estimate. */
const textWidth = (value: string): number => measure(value) * 1.12;

/** A widget: its markup, centred on the origin, and the box it fills. */
export interface Widget {
  markup: string;
  w: number;
  h: number;
}

const text = (cls: string, x: number, y: number, size: number, value: string, anchor: "start" | "middle" | "end" = "middle"): string =>
  el("text", { class: `ky-text ${cls}`, x, y: y + size * 0.36, "font-size": size, "text-anchor": anchor }, esc(value));

/** A rounded plate behind a widget. */
const plate = (w: number, h: number, cls = "ky-sit-bg"): string => el("rect", { class: cls, x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(h / 2, h * 0.34) });

/** A triangle pointing at `angle` degrees (0 right, 90 down) centred on a point, `r` from its middle to its tip. */
export const triangle = (cx: number, cy: number, r: number, angle: number, cls: string): string => {
  const a = (angle * Math.PI) / 180;
  const pts = [0, 140, 220].map((k) => {
    const t = a + (k * Math.PI) / 180;
    const rr = k === 0 ? r : r * 0.8;
    return `${num(cx + rr * Math.cos(t))} ${num(cy + rr * Math.sin(t))}`;
  });
  return el("path", { class: cls, d: `M${pts.join("L")}Z` });
};

/** The pill: a line of text on a rounded plate, with a dot of the benefiting team's colour at its head when `dot` names its side. */
export function pillWidget(label: string, size: number, dot?: "left" | "right"): Widget {
  const h = size * 1.6;
  const dotW = dot === undefined ? 0 : size * 1.15;
  const w = textWidth(label) * size + size * 1.4 + dotW;
  let m = plate(w, h);
  if (dot !== undefined) m += el("circle", { class: `ky-sit-dot ky-sit-dot-${dot}`, cx: -w / 2 + size * 0.95, cy: 0, r: size * 0.4, "stroke-width": size * 0.14 });
  m += text("ky-sit-t", dotW / 2, 0, size, label);
  return { markup: el("g", { class: "ky-sit-pill" }, m), w, h };
}

/** A football tag: the down and distance, with the yard line beneath it and an arrow for the way the offence is going (`angle`, 0 right, 90 down, 180 left, -90 up). */
export function tagWidget(main: string, sub: string | undefined, size: number, angle?: number): Widget {
  const subSize = size * 0.72;
  const arrow = angle === undefined ? 0 : size * 1.2;
  const lead = arrow * 1.35;
  const textW = Math.max(textWidth(main) * size, sub === undefined ? 0 : textWidth(sub) * subSize);
  const w = textW + size * 1.7 + arrow * 1.35;
  const h = sub === undefined ? size * 1.6 : size * 2.5;
  let m = plate(w, h);
  const cx = lead / 2;
  if (angle !== undefined) m += triangle(-w / 2 + size * 1.1, 0, size * 0.52, angle, "ky-sit-arrow");
  m += text("ky-sit-t", cx, sub === undefined ? 0 : -size * 0.42, size, main);
  if (sub !== undefined) m += text("ky-sit-t ky-sit-sub", cx, size * 0.82, subSize, sub);
  return { markup: el("g", { class: "ky-sit-tag" }, m), w, h };
}

/** What a scorebug shows; a part left out is not drawn. */
export interface Scorebug {
  bases?: readonly [boolean, boolean, boolean];
  outs?: number;
  inning?: number;
  half?: "top" | "bottom";
  balls?: number;
  strikes?: number;
}

/**
 * The classic scorebug: a diamond whose occupied bases are lit, the outs as three dots under it, the inning with an arrow for its half, and the count. `size` is a letter's height;
 * the diamond is 3.4 of them across. `bg` draws the plate behind it (a badge has its own).
 */
export function scorebugWidget(s: Scorebug, size: number, bg: boolean): Widget {
  const u = size;
  const right = s.inning !== undefined || (s.balls !== undefined && s.strikes !== undefined);
  const left = 3.5 * u;
  const w = left + (right ? 3.3 * u : 0) + 0.8 * u;
  const h = 3.9 * u;
  const x0 = -w / 2 + 0.4 * u + left / 2;
  const cy = s.outs === undefined ? 0 : -0.5 * u;
  let m = bg ? plate(w, h) : "";
  // The diamond: a square turned a quarter, a base at each corner, home at the foot.
  const r = 0.98 * u;
  const base = (dx: number, dy: number, on: boolean, name: string): string => {
    const k = 0.5 * u;
    return el("path", { class: `ky-sit-base ky-sit-b-${name}${on ? " ky-sit-on" : ""}`, "stroke-width": u * 0.1, d: `M${num(x0 + dx)} ${num(cy + dy - k)}L${num(x0 + dx + k)} ${num(cy + dy)}L${num(x0 + dx)} ${num(cy + dy + k)}L${num(x0 + dx - k)} ${num(cy + dy)}Z` });
  };
  m += el("path", { class: "ky-sit-dia", d: `M${num(x0)} ${num(cy - r)}L${num(x0 + r)} ${num(cy)}L${num(x0)} ${num(cy + r)}L${num(x0 - r)} ${num(cy)}Z`, fill: "none", "stroke-width": u * 0.12 });
  m += base(r, 0, s.bases?.[0] === true, "1") + base(0, -r, s.bases?.[1] === true, "2") + base(-r, 0, s.bases?.[2] === true, "3");
  if (s.outs !== undefined) {
    for (let i = 0; i < 3; i += 1) m += el("circle", { class: `ky-sit-out${i < s.outs ? " ky-sit-on" : ""}`, cx: x0 + (i - 1) * 1.05 * u, cy: cy + r + 0.95 * u, r: 0.34 * u });
  }
  if (right) {
    const x1 = -w / 2 + 0.4 * u + left + 0.3 * u + 1.35 * u;
    const rows = s.inning !== undefined && s.balls !== undefined && s.strikes !== undefined ? 2 : 1;
    const y = (row: number): number => (rows === 1 ? 0 : (row === 0 ? -1 : 1) * 0.95 * u);
    if (s.inning !== undefined) {
      const iy = y(0);
      if (s.half !== undefined) m += triangle(x1 - 0.95 * u, iy, 0.5 * u, s.half === "top" ? -90 : 90, "ky-sit-arrow");
      m += text("ky-sit-t", x1 + (s.half === undefined ? 0 : 0.35 * u), iy, 1.25 * u, String(s.inning));
    }
    if (s.balls !== undefined && s.strikes !== undefined) m += text("ky-sit-t ky-sit-count", x1, y(1), 1.2 * u, `${s.balls}-${s.strikes}`);
  }
  return { markup: el("g", { class: "ky-sit-bug" }, m), w, h };
}

/** What a shootout strip is given: the rounds as `[away, home]`, with `null` for an attempt not yet taken, the rounds after the third being sudden death, and the two rows' labels. */
export interface ShootoutStrip {
  rounds: readonly (readonly [boolean | null, boolean | null])[];
  goals: readonly [number, number];
  sudden: number;
  labels: readonly [string, string];
  /** The two rows' sides on the drawing, for the colour of their labels. */
  sides?: readonly ["left" | "right", "left" | "right"];
  /** The short word over the sudden-death rounds. */
  suddenWord: string;
}

/** The shootout as two rows of dots, a goal filled (●) and a miss hollow (○), the rounds not yet taken a faint speck, with each team's goals at the end. */
export function shootoutWidget(s: ShootoutStrip, size: number, bg: boolean): Widget {
  const u = size;
  const columns = Math.max(3, s.rounds.length);
  const regular = Math.min(columns, 3);
  const sd = columns - regular;
  const pitch = 2 * u;
  const label = Math.max(3.2 * u, ...s.labels.map((l) => textWidth(l) * 1.05 * u + 0.6 * u));
  const gap = sd > 0 ? 1.1 * u : 0;
  const total = 2.2 * u;
  const top = sd > 0 ? 1.3 * u : 0;
  const w = 0.8 * u + label + columns * pitch + gap + total + 0.4 * u;
  const h = top + 5.2 * u;
  let m = bg ? plate(w, h) : "";
  const left = -w / 2 + 0.8 * u;
  const y0 = -h / 2 + top + 1.55 * u;
  const colX = (i: number): number => left + label + pitch * i + pitch / 2 + (i >= regular ? gap : 0);
  for (let row = 0; row < 2; row += 1) {
    const y = y0 + row * 2.1 * u;
    const side = s.sides?.[row];
    m += text(`ky-sit-lab${side === undefined ? "" : ` ky-sit-lab-${side}`}`, left, y, 1.1 * u, s.labels[row], "start");
    for (let i = 0; i < columns; i += 1) {
      const shot = s.rounds[i]?.[row] ?? null;
      const x = colX(i);
      const sudden = i >= regular;
      if (shot === true) m += el("circle", { class: `ky-sit-goal${sudden ? " ky-sit-sd" : ""}`, cx: x, cy: y, r: 0.66 * u, "stroke-width": sudden ? 0.14 * u : undefined });
      else if (shot === false) m += el("circle", { class: `ky-sit-miss${sudden ? " ky-sit-sd" : ""}`, cx: x, cy: y, r: 0.58 * u, "stroke-width": 0.2 * u });
      else m += el("circle", { class: "ky-sit-wait", cx: x, cy: y, r: 0.2 * u });
    }
    m += text("ky-sit-t ky-sit-total", w / 2 - 0.5 * u - total / 2, y, 1.5 * u, String(s.goals[row]));
  }
  if (sd > 0) {
    const x = colX(regular) - pitch / 2 - gap / 2;
    m += el("path", { class: "ky-sit-split", d: `M${num(x)} ${num(-h / 2 + top + 0.2 * u)}V${num(h / 2 - 0.2 * u)}`, "stroke-width": 0.14 * u });
    m += text("ky-sit-sdw", (colX(regular) + colX(columns - 1)) / 2, -h / 2 + 0.75 * u, 0.9 * u, s.suddenWord);
  }
  return { markup: el("g", { class: "ky-sit-strip" }, m), w, h };
}
