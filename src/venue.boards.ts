// The LED boards of a venue: the ribbon boards along the fascia between the seating levels, and the scoreboard hung over the middle of the playing surface, in the flat plan and in 3D. The content is generic and ours: panels
// of colour in bands, blocks, chevrons or waves, and a plain score in seven-segment digits (paths, so that no font is needed): never a logo, a sponsor or a line of text from a real board. The colours are the asker's, else
// the crowd's home and away colours, else the package's own amber, blue and white. Every lit shape carries the class `u-led` (`ky-cr-led` in the plan), so that a lighting layer can make it glow. Pure: data in, planes and markup out.
import { outlinePath, type CrowdStands, type Pt, type StandRing } from "./crowd.ts";
import { el } from "./format.ts";
import { bar, flat, n, plane, wall, type Plane } from "./turn.kit.ts";
import type { LedBoardOptions, LedBoardPattern } from "./types.ts";

/** The boards a venue has, with every part's value. */
export interface Boards {
  ribbon: boolean;
  scoreboard: boolean;
  /** Three colours of light (a ribbon's bands and chevrons take them in turn). */
  colors: [string, string, string];
  pattern: LedBoardPattern;
  score: [number, number];
  /** Each lit panel has a halo under it (the venue is lit as at night). */
  glow: boolean;
}

/** The package's own colours of light: amber, blue and a white with a little blue in it. */
export const BOARD_COLORS: readonly [string, string, string] = ["#ffb020", "#2bc4ff", "#f4f7ff"];
export const BOARD_PATTERNS: readonly LedBoardPattern[] = ["bands", "blocks", "chevrons", "waves"];

/** The sizes of the boards, in feet (ours: the usual ones, no plan of a real board). */
export const BOARD = {
  /** How tall a ribbon is, and how long one of its panels. */
  ribbon: 3.8,
  panel: 9,
  /** The scoreboard's share of the surface's length and width, its least and most, and how far its lower edge hangs over the surface (a share of the surface's longer side, least and most). */
  share: { w: 0.14, d: 0.22 },
  wide: [18, 52],
  deep: [12, 30],
  hang: { share: 0.2, least: 28, most: 70 },
  /** The ring of display under the main board, its inset on each side, and the strut it hangs from. */
  ring: { rise: [2.5, 4.5], inset: 0.06 },
  strut: 9,
} as const;

/** A CSS colour that is safe to write into an attribute: a hex, `rgb()`, `hsl()` or a plain name. */
const COLOR = /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%/-]{3,40}\)|[a-z]{3,24})$/i;
export const safeColor = (value: unknown): string | undefined => (typeof value === "string" && COLOR.test(value.trim()) ? value.trim() : undefined);

/** The boards a `boards` option asks for (the crowd's `home` and `away` are the colours when it names none), or `undefined` for none. */
export function resolveBoards(ask: boolean | LedBoardOptions | undefined | null, team: { home?: string; away?: string } = {}, glow = false): Boards | undefined {
  if (ask === undefined || ask === null || ask === false) return undefined;
  const o: LedBoardOptions = ask === true ? {} : ask;
  const given = (Array.isArray(o.colors) ? o.colors : [team.home, team.away]).map(safeColor).filter((c): c is string => c !== undefined).slice(0, 3);
  const colors = [0, 1, 2].map((i) => given[i] ?? (given.length > 0 ? (i === 2 ? given[0] : BOARD_COLORS[2]) : BOARD_COLORS[i])) as Boards["colors"];
  const whole = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? Math.min(99, Math.max(0, Math.trunc(v))) : 0);
  const boards: Boards = {
    ribbon: o.ribbon !== false,
    scoreboard: o.scoreboard !== false,
    colors,
    pattern: BOARD_PATTERNS.includes(o.pattern as LedBoardPattern) ? (o.pattern as LedBoardPattern) : "bands",
    score: [whole(o.score?.[0]), whole(o.score?.[1])],
    glow,
  };
  return boards.ribbon || boards.scoreboard ? boards : undefined;
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const at = (p: Pt): string => `${n(p[0])} ${n(p[1])}`;
const loop = (pts: readonly Pt[]): string => `M${pts.map(at).join("L")}Z`;

/**
 * A ribbon on a quad `[a, b, c, d]` of a plane (a and b along its lower edge, d and c along its upper): a dark housing with panels of light in it, in the pattern asked. `run` is how far along the ribbon this quad starts, in feet,
 * so that the panels carry on in the colour they were from one quad to the next. A quad that is not a quad is the housing alone.
 */
export function ledStrip(corners: readonly Pt[], look: Pick<Boards, "colors" | "pattern"> & { glow?: boolean }, run = 0): string {
  const bed = `<path class="u-led-bed" d="${loop(corners)}"/>`;
  if (corners.length !== 4) return bed;
  const [a, b, c, d] = corners;
  const across = (s: number, t: number): Pt => lerp(lerp(a, b, s), lerp(d, c, s), t);
  const long = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const panels = Math.max(1, Math.round(long / BOARD.panel));
  const first = Math.floor(run / BOARD.panel);
  const lit = new Map<string, string[]>();
  const paint = (color: string, shape: string): void => {
    const list = lit.get(color) ?? [];
    list.push(shape);
    lit.set(color, list);
  };
  const [lo, hi] = [0.14, 0.86];
  const gap = Math.min(0.06, 0.4 / panels);
  if (look.pattern === "waves") {
    // Three waves along the whole quad, one in each colour, a little apart.
    const steps = Math.max(8, Math.round(long / 1.2));
    look.colors.forEach((color, w) => {
      const pts = Array.from({ length: steps + 1 }, (_, k): Pt => {
        const s = k / steps;
        return across(s, 0.5 + 0.3 * Math.sin(((run + s * long) / BOARD.panel) * Math.PI * 1.2 + (w * 2 * Math.PI) / 3));
      });
      paint(color, `M${pts.map(at).join("L")}`);
    });
    const waves = [...lit].map(([color, shapes]) => (look.glow === true ? `<path class="u-led-glow" fill="none" stroke="${color}" stroke-opacity=".3" stroke-width="${n(BOARD.ribbon * 0.7)}" stroke-linecap="round" d="${shapes.join("")}"/>` : "") + `<path class="u-led" fill="none" stroke="${color}" stroke-width="${n(BOARD.ribbon * 0.2)}" stroke-linecap="round" stroke-linejoin="round" d="${shapes.join("")}"/>`);
    return bed + waves.join("");
  }
  for (let i = 0; i < panels; i += 1) {
    const k = first + i;
    const [s0, s1] = [i / panels + gap / 2, (i + 1) / panels - gap / 2];
    const mine = look.colors[k % 3];
    const other = look.colors[(k + 1) % 3];
    if (look.pattern === "blocks") {
      paint(mine, loop([across(s0, lo), across(s1, lo), across(s1, hi), across(s0, hi)]));
    } else if (look.pattern === "chevrons") {
      // An arrow along the ribbon: a thick chevron pointing the way the run goes, in this panel's colour.
      const w = s1 - s0;
      const cell = (x: number, t: number): Pt => across(s0 + x * w, lo + t * (hi - lo));
      paint(mine, loop([cell(0, 0), cell(0.55, 0), cell(1, 0.5), cell(0.55, 1), cell(0, 1), cell(0.45, 0.5)]));
    } else {
      const mid = (lo + hi) / 2;
      paint(mine, loop([across(s0, lo), across(s1, lo), across(s1, mid - 0.03), across(s0, mid - 0.03)]));
      paint(other, loop([across(s0, mid + 0.03), across(s1, mid + 0.03), across(s1, hi), across(s0, hi)]));
    }
  }
  // A halo under each colour's panels: the same shapes, stroked wide and faint, so that the light seems to spill over the housing and the wall beside it.
  const halo = (color: string, shapes: string[]): string => (look.glow === true ? `<path class="u-led-glow" fill="${color}" fill-opacity=".3" stroke="${color}" stroke-opacity=".3" stroke-width="${n(BOARD.ribbon * 0.6)}" stroke-linejoin="round" d="${shapes.join("")}"/>` : "");
  return bed + [...lit].map(([color, shapes]) => `${halo(color, shapes)}<path class="u-led" fill="${color}" d="${shapes.join("")}"/>`).join("");
}

/** The ribbon on a wall, `length` feet long and `height` feet high: the same strip, on a rectangle (its lower edge is the wall's lower edge). */
export const ledWall = (length: number, height: number, look: Pick<Boards, "colors" | "pattern">, run = 0): string => ledStrip([[0, height], [length, height], [length, 0], [0, 0]], look, run);

// ---- The tiers the ribbons go on. ----

/** A walk between two tiers: the tier below it, the one above and the walk's own outlines. */
export interface TierLink {
  c: CrowdStands["concourses"][number];
  before: StandRing;
  after: StandRing;
}

/** The walks between the tiers of a stands model, each with the tier it leaves and the tier it leads to. */
export function tierLinks(stands: CrowdStands): TierLink[] {
  const links: TierLink[] = [];
  stands.concourses.forEach((c, ci) => {
    let at = stands.rings.findIndex((r) => r.hole === c.region);
    if (at < 1) at = Math.min(ci + 1, stands.rings.length - 1);
    const [before, after] = [stands.rings[at - 1], stands.rings[at]];
    if (before !== undefined && after !== undefined) links.push({ c, before, after });
  });
  return links;
}

/** The share of a plane of `rise` feet over a slope `g` (rise per foot across) that a ribbon of `BOARD.ribbon` feet takes at its top; 0 for a plane too flat to be a facade. */
export function ribbonShare(rise: number, g: number): number {
  if (g < 0.25 || rise < BOARD.ribbon) return 0;
  const slant = (rise / g) * Math.hypot(1, g);
  return clamp(BOARD.ribbon / slant, 0.06, 0.4);
}

// ---- The scoreboard. ----

/** The size of the scoreboard over a surface of `w` by `h` feet (its long side along the surface's), and how high its lower edge hangs. */
export function boardSize(w: number, h: number): { w: number; d: number; hang: number } {
  const pick = (share: number, [lo, hi]: readonly [number, number], side: number): number => clamp(side * share, Math.min(lo, side * 0.6), hi);
  return { w: pick(BOARD.share.w, BOARD.wide, w), d: pick(BOARD.share.d, BOARD.deep, h), hang: clamp(Math.max(w, h) * BOARD.hang.share, BOARD.hang.least, BOARD.hang.most) };
}

/** Whether a sport has a scoreboard hung over its surface: a ballpark's stands behind the outfield, so it has none here. */
export const hangsOver = (sport: string | undefined): boolean => sport !== "mlb";

/** The segments of a seven-segment digit, a to g, that are lit for each digit. */
const SEGMENTS = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"] as const;

/** A number of one or two digits in seven segments, `high` feet tall, from (x, y) at its top left: the path and the width it takes. */
function digits(value: number, x: number, y: number, high: number): { d: string; width: number } {
  const text = String(Math.min(99, Math.max(0, Math.trunc(value))));
  const w = high * 0.56;
  const t = high * 0.13;
  const half = high / 2;
  const rects: Record<string, [number, number, number, number]> = {
    a: [t * 0.6, 0, w - t * 1.2, t],
    b: [w - t, t * 0.6, t, half - t * 0.9],
    c: [w - t, half + t * 0.3, t, half - t * 0.9],
    d: [t * 0.6, high - t, w - t * 1.2, t],
    e: [0, half + t * 0.3, t, half - t * 0.9],
    f: [0, t * 0.6, t, half - t * 0.9],
    g: [t * 0.6, half - t / 2, w - t * 1.2, t],
  };
  let d = "";
  [...text].forEach((ch, i) => {
    for (const s of SEGMENTS[Number(ch)]) {
      const [rx, ry, rw, rh] = rects[s];
      d += `M${n(x + i * (w + t) + rx)} ${n(y + ry)}h${n(rw)}v${n(rh)}h${n(-rw)}z`;
    }
  });
  return { d, width: text.length * w + (text.length - 1) * t };
}

/** The face of the main board, `w` by `h` feet: a dark screen with a band of light along its top and bottom, a block of colour at each end, and the score between them. */
function boardFace(w: number, h: number, look: Boards): string {
  const [c0, c1, c2] = look.colors;
  const edge = Math.min(0.5, h * 0.06);
  const band = h * 0.1;
  const halo = look.glow ? `<rect class="u-led-glow" x="${n(-0.8)}" y="${n(-0.8)}" width="${n(w + 1.6)}" height="${n(h + 1.6)}" rx="1" fill="${c2}" fill-opacity=".2"/>` : "";
  let svg = `${halo}<rect class="u-led-bed" width="${n(w)}" height="${n(h)}"/><rect class="u-led-screen" x="${n(edge)}" y="${n(edge)}" width="${n(w - 2 * edge)}" height="${n(h - 2 * edge)}"/>`;
  svg += `<path class="u-led" fill="${c2}" d="M${n(edge)} ${n(edge)}h${n(w - 2 * edge)}v${n(band)}h${n(-(w - 2 * edge))}zM${n(edge)} ${n(h - edge - band)}h${n(w - 2 * edge)}v${n(band)}h${n(-(w - 2 * edge))}z"/>`;
  const block = Math.min(w * 0.2, h * 0.5);
  const [yb, hb] = [h * 0.28, h * 0.44];
  svg += `<path class="u-led" fill="${c0}" d="M${n(edge * 2)} ${n(yb)}h${n(block)}v${n(hb)}h${n(-block)}z"/><path class="u-led" fill="${c1}" d="M${n(w - edge * 2 - block)} ${n(yb)}h${n(block)}v${n(hb)}h${n(-block)}z"/>`;
  // The score: two numbers and a dash, as large as the face between the blocks lets them be.
  const room = w - 2 * (block + edge * 4);
  const digitCount = String(look.score[0]).length + String(look.score[1]).length;
  const dash = 0.4;
  const high = Math.min(h * 0.5, room / (digitCount * 0.56 + (digitCount - 2) * 0.13 + dash + 0.5));
  const [home, away] = [digits(look.score[0], 0, 0, high), digits(look.score[1], 0, 0, high)];
  const gap = high * 0.3;
  const total = home.width + gap + high * dash + gap + away.width;
  const x0 = (w - total) / 2;
  const y0 = (h - high) / 2;
  const [h0, a0] = [digits(look.score[0], x0, y0, high), digits(look.score[1], x0 + home.width + gap * 2 + high * dash, y0, high)];
  svg += `<path class="u-led" fill="${c2}" d="${h0.d}${a0.d}M${n(x0 + home.width + gap)} ${n(y0 + high / 2 - high * 0.065)}h${n(high * dash)}v${n(high * 0.13)}h${n(-high * dash)}z"/>`;
  return svg;
}

/**
 * The scoreboard hung over the middle of a surface: a four sided board with its score on every face, a ring of display under it, a cap on top and a strut up to the rafters. `box` is the surface, `lift` how high the surface stands.
 * Its faces look outwards, each the right way round for an eye outside it.
 */
export function centreBoard(id: string, box: { x: number; y: number; w: number; h: number }, lift: number, look: Boards): Plane[] {
  const size = boardSize(box.w, box.h);
  const [cx, cy] = [box.x + box.w / 2, box.y + box.h / 2];
  const [x0, x1, y0, y1] = [cx - size.w / 2, cx + size.w / 2, cy - size.d / 2, cy + size.d / 2];
  const ring = clamp(size.w * 0.16, BOARD.ring.rise[0], BOARD.ring.rise[1]);
  const body = clamp(size.w * 0.45, 8, 16);
  const [z0, z1, z2] = [lift + size.hang, lift + size.hang + ring, lift + size.hang + ring + body];
  const ins = size.w * BOARD.ring.inset;
  const insD = size.d * BOARD.ring.inset;
  // The faces, each from the left of an eye outside it to its right: +y, -y, +x, -x.
  const faces: { name: string; from: Pt; to: Pt }[] = [
    { name: "south", from: [x0, y1], to: [x1, y1] },
    { name: "north", from: [x1, y0], to: [x0, y0] },
    { name: "east", from: [x1, y1], to: [x1, y0] },
    { name: "west", from: [x0, y0], to: [x0, y1] },
  ];
  const planes: Plane[] = [];
  let run = 0;
  for (const f of faces) {
    const long = Math.hypot(f.to[0] - f.from[0], f.to[1] - f.from[1]);
    planes.push(plane(`${id}-${f.name}`, "hung-board", [f.from[0], f.from[1], z2], [f.to[0] - f.from[0], f.to[1] - f.from[1], 0], [0, 0, z1 - z2], boardFace(long, body, look)));
    // The ring of display under it, set in a little on every side, in the pattern the ribbons have.
    const grow = (p: Pt, q: Pt): [Pt, Pt] => {
      const [dx, dy] = [(q[0] - p[0]) / long, (q[1] - p[1]) / long];
      const cut = f.name === "south" || f.name === "north" ? ins : insD;
      return [[p[0] + dx * cut, p[1] + dy * cut], [q[0] - dx * cut, q[1] - dy * cut]];
    };
    const [r0, r1] = grow(f.from, f.to);
    const span = Math.hypot(r1[0] - r0[0], r1[1] - r0[1]);
    planes.push(plane(`${id}-${f.name}-ring`, "hung-board", [r0[0], r0[1], z1], [r1[0] - r0[0], r1[1] - r0[1], 0], [0, 0, z0 - z1], ledWall(span, ring, look, run)));
    run += long;
  }
  // The cap, a dark top with a thin line of light round its edge, and the strut the board hangs from.
  const [w, d] = [x1 - x0, y1 - y0];
  const rim = Math.min(0.5, d * 0.05);
  const capSvg = `<rect class="u-led-bed" width="${n(w)}" height="${n(d)}"/><path class="u-led" fill="none" stroke="${look.colors[0]}" stroke-width="${n(rim)}" d="M${n(rim * 2)} ${n(rim * 2)}h${n(w - rim * 4)}v${n(d - rim * 4)}h${n(-(w - rim * 4))}z"/>`;
  planes.push(flat(`${id}-cap`, "hung-board", x0, y0, x1, y1, z2, capSvg));
  planes.push(...bar(`${id}-strut`, "frame", [cx, cy, z2], [cx, cy, z2 + BOARD.strut], 0.9, "u-led-bed"));
  return planes;
}

// ---- The flat plan. ----

/** The size of the scoreboard in the flat plan, from the surface's box. */
export const planBoard = (box: { x: number; y: number; w: number; h: number }): { x: number; y: number; w: number; d: number } => {
  const s = boardSize(box.w, box.h);
  return { x: box.x + (box.w - s.w) / 2, y: box.y + (box.h - s.d) / 2, w: s.w, d: s.d };
};

/** The ribbon boards in the flat plan: a lit line along the front of every tier that has a walk below it (the front of the tiers there is no walk to, where the venue has one level), panels of the colours in turn. */
export function planRibbons(stands: CrowdStands, look: Boards): string {
  const links = tierLinks(stands);
  const fronts = links.length > 0 ? links.map((l) => l.after) : stands.rings.filter((r) => r.tier !== "wall" && r.tier !== "bleachers").slice(0, 1);
  const paths = fronts.flatMap((ring) => (ring.hole === null ? [] : [outlinePath(ring.hole)])).join("");
  if (paths === "") return "";
  const cell = BOARD.panel;
  const lit = look.colors.map((color, k) => el("path", { class: "ky-cr-led", d: paths, fill: "none", stroke: color, "stroke-width": 2.2, "stroke-dasharray": `${cell} ${cell * 2}`, "stroke-dashoffset": -cell * k }));
  const glow = look.glow ? look.colors.map((color, k) => el("path", { class: "ky-cr-led-glow", d: paths, fill: "none", stroke: color, "stroke-opacity": 0.3, "stroke-width": 7, "stroke-dasharray": `${cell} ${cell * 2}`, "stroke-dashoffset": -cell * k })).join("") : "";
  return el("g", { class: "ky-cr-ribbon" }, el("path", { class: "ky-cr-led-line", d: paths, "stroke-width": 3.4 }) + glow + lit.join(""));
}

/** The scoreboard in the flat plan, as the board hangs over the surface seen from above: its dark cap with a line of light round it and its four edges' colours. */
export function planScoreboard(box: { x: number; y: number; w: number; h: number }, look: Boards): string {
  const b = planBoard(box);
  const [c0, c1, c2] = look.colors;
  const rim = b.d * 0.07;
  const inner = { x: b.x + rim * 2, y: b.y + rim * 2, w: b.w - rim * 4, d: b.d - rim * 4 };
  const rect = (cls: string, r: { x: number; y: number; w: number; d: number }, extra: Record<string, string | number> = {}): string => el("rect", { class: cls, x: n(r.x), y: n(r.y), width: n(r.w), height: n(r.d), rx: n(rim), ...extra });
  const edge = (x: number, y: number, w: number, h: number, color: string): string => el("rect", { class: "ky-cr-led", x: n(x), y: n(y), width: n(w), height: n(h), fill: color });
  return el(
    "g",
    { class: "ky-cr-board" },
    (look.glow ? rect("ky-cr-led-glow", { x: b.x - rim * 2, y: b.y - rim * 2, w: b.w + rim * 4, d: b.d + rim * 4 }, { fill: c2, "fill-opacity": 0.22 }) : "") +
      rect("ky-cr-led-bed", b) +
      edge(inner.x, inner.y, inner.w, rim, c0) +
      edge(inner.x, inner.y + inner.d - rim, inner.w, rim, c1) +
      edge(inner.x, inner.y, rim, inner.d, c2) +
      edge(inner.x + inner.w - rim, inner.y, rim, inner.d, c2),
  );
}

/** How tall the ribbon on the front of a tier is, for a front `top` feet high: the usual ribbon, or less where the front is low. */
export const ribbonHigh = (top: number): number => Math.min(BOARD.ribbon, top * 0.6);

/** The ribbon on the top of a wall that stands over the line from `a` to `b` and is `top` feet high (the front of a tier): a wall of its own, as tall as `ribbonHigh` says. `run` is how far along the ribbon the wall starts. */
export const fasciaRibbon = (id: string, a: Pt, b: Pt, top: number, look: Boards, run: number): Plane => {
  const high = ribbonHigh(top);
  return wall(id, "ribbon", a[0], a[1], b[0], b[1], top - high, top, ledWall(Math.hypot(b[0] - a[0], b[1] - a[1]), high, look, run));
};

/** A hall's boards as its stadium asks for them: the layout has scoreboards of its own, so the hall has the ribbons and no scoreboard hung over its middle. */
export const hallBoards = (ask: boolean | LedBoardOptions | undefined): boolean | LedBoardOptions | undefined => (ask === undefined || ask === false ? undefined : { ...(ask === true ? {} : ask), scoreboard: false });
