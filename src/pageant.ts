// The pageant: each team's flag or logo laid out large over its half of the surface, as a stadium lays giant flags and crests on the pitch for a final's ceremony
// (a `carpet`: a rectangle at the flag's own ratio with a border; a `stage`: a crest on a large round disc with a ring), and an emblem or a trophy in the centre circle. This file
// decides what is asked (`pageantOf`) and where each picture goes (`pageantLayout`); `pageant.draw.ts` draws them. Written for this package; the idea is a broadcast's, and no
// flag, crest or emblem is drawn or supplied here.
import { safeColour } from "./colour.ts";
import { renderedEmblem } from "./emblems-source.ts";
import { safeLogo } from "./logo.ts";
import { isNetSport } from "./court.ts";
import type { Outline } from "./outline.ts";
import type { Surface } from "./surfaces/surface.ts";
import type { PageantOptions, PageantStyle, Side, Sport, SurfaceOptions, Team } from "./types.ts";

/** The border band of a carpet, as a share of its shorter side: the least, the most and the usual. */
export const PAGEANT_BORDER = { min: 0.02, max: 0.15, usual: 0.06 } as const;

/** The least and the most a carpet or a stage is scaled to, as a share of the room its half gives it. */
export const PAGEANT_SCALE = { min: 0.4, max: 1 } as const;

/** The ratio of a carpet's width over its height: a flag of 3 to 2 unless the team or its SVG says otherwise, held between a square and 3 to 1. */
export const PAGEANT_RATIO = { min: 1, max: 3, usual: 1.5 } as const;

/** How far a filled carpet's ratio may differ from its flag's, as a factor either way: the art is stretched and cropped by its square root. */
export const PAGEANT_FILL_LIMIT = 1.75;

/** What the plate is shrunk to when it stays in the middle of a pageant, so that the pictures have room. */
const PLATE_SCALE = 0.85;

/** What a pageant is, with every choice made. */
export interface Pageant {
  style: PageantStyle;
  border: "dark" | "team" | string;
  borderWidth: number;
  fabric: boolean;
  lines: "over" | "under" | "through";
  ring: "gold" | "team" | string;
  emblem?: { href: string; shape: "round" | "plain"; fit: "contain" | "cover"; name?: string };
  /** Where the score goes: the plate in the middle, the compact strip under the drawing, or `auto`, which the drawing decides once it has laid the pictures out (`autoScore`). */
  score: "auto" | "centre" | "strip";
  scale: number;
  fit: "fill" | "ratio";
  names: boolean | undefined;
  animate: "none" | "unfurl" | "fade";
}

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined => (allowed as readonly unknown[]).includes(value) ? (value as T) : undefined;

/** A colour or one of the words a choice also takes. */
const colourOrWord = (value: unknown, words: readonly string[], fallback: string): string => {
  if (typeof value === "string" && words.includes(value)) return value;
  return safeColour(value) ?? fallback;
};

const finite = (value: unknown, least: number, most: number, fallback: number): number => (typeof value === "number" && Number.isFinite(value) ? Math.min(most, Math.max(least, value)) : fallback);

/** The sports whose scoreboard covers the middle of the surface (a table of sets and games, an innings board): their score goes to the strip in a pageant. */
const BOARDS = (sport: Sport): boolean => isNetSport(sport) || sport === "cricket";

/** The sports whose score is a plate that a pageant can shrink: a curling sheet's and a net court's boards are drawn to the room they are given and are not. */
export const plateShrinks = (sport: Sport): boolean => !BOARDS(sport) && sport !== "curling";

/**
 * What the options ask of a pageant, or `undefined` for none: `pageant` unset or `false`, a drawing with no score, one of the badge size, or a special game. A choice that is not one of
 * the values is the default's; a colour must pass `safeColour`, the emblem `safeLogo`, a number is held to its range.
 */
export function pageantOf(o: SurfaceOptions & { home?: unknown; away?: unknown; size?: unknown }): Pageant | undefined {
  const given = o.pageant;
  if (given === undefined || given === false || given === null) return undefined;
  if (o.home === undefined || o.away === undefined || o.size === "badge" || o.host !== undefined) return undefined;
  const p: PageantOptions = given === true ? {} : typeof given === "string" ? { style: given } : typeof given === "object" ? given : {};
  const style = oneOf(p.style, ["carpet", "stage"] as const) ?? "carpet";
  const href = safeLogo(p.emblem, { theme: o.theme === "light" || o.theme === "dark" ? o.theme : undefined });
  const asked = oneOf(p.score, ["auto", "centre", "strip"] as const) ?? "auto";
  // The emblem takes the middle, and a board is as wide as the middle: both send the score to the strip, unless the options say otherwise.
  const score = asked === "auto" && (href !== undefined || BOARDS(o.sport)) ? "strip" : asked;
  return {
    style,
    border: colourOrWord(p.border, ["dark", "team"], "dark"),
    borderWidth: finite(p.borderWidth, PAGEANT_BORDER.min, PAGEANT_BORDER.max, PAGEANT_BORDER.usual),
    fabric: p.fabric !== false,
    lines: oneOf(p.lines, ["over", "under", "through"] as const) ?? "over",
    ring: colourOrWord(p.ring, ["gold", "team"], "gold"),
    ...(href === undefined ? {} : { emblem: { href, shape: oneOf(p.emblemShape, ["round", "plain"] as const) ?? "round", fit: oneOf(p.emblemFit, ["contain", "cover"] as const) ?? "contain", name: typeof p.emblemName === "string" && p.emblemName.trim() !== "" ? p.emblemName.trim().slice(0, 60) : undefined } }),
    score,
    scale: finite(p.scale, PAGEANT_SCALE.min, PAGEANT_SCALE.max, PAGEANT_SCALE.max),
    fit: oneOf(p.fit, ["fill", "ratio"] as const) ?? "fill",
    names: typeof p.names === "boolean" ? p.names : undefined,
    animate: oneOf(p.animate, ["none", "unfurl", "fade"] as const) ?? "none",
  };
}

/** The ratio of an SVG document's picture: its `viewBox`, else its `width` and `height`. */
function svgRatio(text: string): number | undefined {
  const head = text.slice(0, 2000);
  const open = /<svg\b[^>]*>/i.exec(head)?.[0] ?? head;
  const box = /viewBox\s*=\s*["']\s*[-\d.e]+[\s,]+[-\d.e]+[\s,]+([\d.e]+)[\s,]+([\d.e]+)/i.exec(open);
  if (box !== null && Number(box[1]) > 0 && Number(box[2]) > 0) return Number(box[1]) / Number(box[2]);
  const w = /\swidth\s*=\s*["']\s*([\d.]+)/i.exec(open);
  const h = /\sheight\s*=\s*["']\s*([\d.]+)/i.exec(open);
  return w !== null && h !== null && Number(w[1]) > 0 && Number(h[1]) > 0 ? Number(w[1]) / Number(h[1]) : undefined;
}

/** How wide a team's carpet is for its height: the team's `logoRatio`, else its SVG logo's own, else 3 to 2; held between a square and 3 to 1. */
export function ratioOf(team: Pick<Team, "logo" | "logoRatio">): number {
  const clamp = (value: number): number => Math.min(PAGEANT_RATIO.max, Math.max(PAGEANT_RATIO.min, value));
  if (typeof team.logoRatio === "number" && Number.isFinite(team.logoRatio) && team.logoRatio > 0) return clamp(team.logoRatio);
  const logo = typeof team.logo === "string" ? team.logo.trim() : "";
  let found: number | undefined;
  if (renderedEmblem(logo) !== undefined) found = 1;
  else if (/^(?:<\?xml|<svg)\b/i.test(logo)) found = svgRatio(logo);
  else if (/^data:image\/svg\+xml/i.test(logo)) {
    const comma = logo.indexOf(",");
    try {
      const body = /;base64/i.test(logo.slice(0, comma)) ? atob(logo.slice(comma + 1)) : decodeURIComponent(logo.slice(comma + 1));
      found = svgRatio(body);
    } catch {
      found = undefined;
    }
  }
  return clamp(found ?? PAGEANT_RATIO.usual);
}

/** A team as the pageant lays it out: a picture or none, its colours and the ratio of its carpet. */
export interface PageantTeam {
  side: Side;
  role: "home" | "away";
  name: string;
  abbr: string;
  state: "win" | "lose" | "none";
  href: string | undefined;
  /** `cover` fills a carpet or a stage with the picture, `contain` shows it whole on a plain ground. */
  fit: "cover" | "contain";
  ratio: number;
  color: string | undefined;
  ink: string | undefined;
}

/** One picture's place, in the surface's frame and in the eye's: the centre, and the size as the eye sees it (a stage's `r` is its radius). */
export interface Placed {
  team: PageantTeam;
  /** The place it fills: the first (left) or the second (right) of the surface. */
  spot: "left" | "right";
  cx: number;
  cy: number;
  w: number;
  h: number;
  r?: number;
  /** A carpet that fills its room: its art is fitted to it by stretching and cropping, not by its own ratio. */
  filled?: boolean;
}

/** Where everything of a pageant goes. */
export interface PageantLayout {
  pictures: Placed[];
  emblem?: { cx: number; cy: number; r: number };
  /** The size the plate is drawn at in the middle, as a share of its own. */
  plateScale: number;
}

/** A rectangle's outline, as points the outline's `contains` is asked about: corners, then more along each side. */
function ring(cx: number, cy: number, w: number, h: number, grow: number, to: (ex: number, ey: number) => [number, number]): [number, number][] {
  const out: [number, number][] = [];
  const hw = w / 2 + grow;
  const hh = h / 2 + grow;
  const steps = 6;
  for (let i = 0; i <= steps; i += 1) {
    const t = -1 + (2 * i) / steps;
    for (const [ex, ey] of [[t * hw, -hh], [t * hw, hh], [-hw, t * hh], [hw, t * hh]] as const) {
      const [dx, dy] = to(ex, ey);
      out.push([cx + dx, cy + dy]);
    }
  }
  return out;
}

const around = (cx: number, cy: number, r: number, grow: number): [number, number][] => Array.from({ length: 16 }, (_, i): [number, number] => [cx + (r + grow) * Math.cos((i * Math.PI) / 8), cy + (r + grow) * Math.sin((i * Math.PI) / 8)]);

/** What the layout is given besides the surface. */
export interface LayoutInput {
  pageant: Pageant;
  surface: Surface;
  outline: Outline;
  left: PageantTeam;
  right: PageantTeam;
  /** True when the drawing lies tall: the halves are then the top and the bottom as the eye sees them, and each picture is turned back upright. */
  turned: boolean;
  sport: Sport;
  /** True when the plate is drawn in the middle of the surface (a full-size score with its score in the centre). */
  plate: boolean;
}

/**
 * Where each team's picture and the emblem go. A picture is sized to the room its half gives it (less a margin) at its own ratio, and is moved in until it lies inside the surface's outline
 * (a rink's rounded corners, a ballpark's fence, an oval's curve). The middle is kept clear of the emblem and of the plate: the pictures are narrower where they must be.
 * @returns `undefined` when the surface has no playing area to lay a picture on.
 */
export function pageantLayout(input: LayoutInput): PageantLayout | undefined {
  const { pageant: p, surface, outline, turned } = input;
  const box = surface.whole ?? surface.box ?? outline.box;
  if (!(box.w > 0 && box.h > 0)) return undefined;
  const minDim = Math.min(box.w, box.h);
  const margin = (p.fit === "fill" ? 0.05 : 0.03) * minDim;
  const mid = box.x + box.w / 2;
  const plan = surface.pageant;
  const centre = plan?.centre ?? { cx: mid, cy: box.y + box.h / 2, r: surface.centreRadius ?? 0.14 * minDim };
  const emblemR = p.emblem === undefined ? 0 : centre.r * 0.92;
  const scale = plateShrinks(input.sport) ? PLATE_SCALE : 1;
  // What the middle holds: the emblem's disc, the plate's length along the surface, the cricket pitch.
  const plateAlong = input.plate && plateShrinks(input.sport) && plan?.left === undefined ? ((turned ? surface.plate.h : surface.plate.w) * scale) / 2 : 0;
  const clear = Math.max(emblemR, plateAlong, plan?.clear ?? 0);
  const eye = (ex: number, ey: number): [number, number] => (turned ? [ey, -ex] : [ex, ey]);
  const place = (team: PageantTeam, which: "left" | "right", spot: { x0: number; x1: number; y0: number; y1: number; disc?: number }): Placed => {
    const along = spot.x1 - spot.x0;
    const across = spot.y1 - spot.y0;
    const cx = (spot.x0 + spot.x1) / 2;
    const cy = (spot.y0 + spot.y1) / 2;
    // The room as the eye sees it: a tall drawing's halves lie one above the other.
    const roomW = turned ? across : along;
    const roomH = turned ? along : across;
    if (p.style === "stage") {
      let r = (spot.disc === undefined ? Math.min(roomW, roomH) : Math.min(spot.disc, roomW, roomH)) / 2 * p.scale;
      for (let i = 0; i < 50 && !around(cx, cy, r, margin * 0.5).every(([x, y]) => outline.contains(x, y)); i += 1) r *= 0.96;
      return { team, spot: which, cx, cy, w: 2 * r, h: 2 * r, r };
    }
    const ratio = team.ratio;
    let ratioOfCarpet = ratio;
    let filled = false;
    let w: number;
    // In a round room (a curling house) the rectangle's corners lie on the circle; in a box it is the box's own shape that limits it.
    if (spot.disc !== undefined) w = Math.min(((spot.disc * ratio) / Math.sqrt(1 + ratio * ratio)) * 0.94, roomW, roomH * ratio) * p.scale;
    else if (p.fit === "fill") {
      // The carpet is the room's own shape, as far as its flag's ratio allows: not more than PAGEANT_FILL_LIMIT either way.
      const shape = Math.min(Math.max(roomW / roomH, ratio / PAGEANT_FILL_LIMIT), ratio * PAGEANT_FILL_LIMIT);
      w = Math.min(roomW, roomH * shape) * p.scale;
      filled = true;
      ratioOfCarpet = shape;
    } else w = Math.min(roomW, roomH * ratio) * p.scale;
    let h = w / ratioOfCarpet;
    let px = cx;
    for (let i = 0; i < 60 && !ring(px, cy, w, h, margin * 0.5, eye).every(([x, y]) => outline.contains(x, y)); i += 1) {
      if (filled) {
        // Pull in the outer edge, along the surface, so that a rink's rounded corner or a fence is cleared and the carpet keeps its full breadth across.
        const cut = (turned ? h : w) * 0.03;
        if (turned) h -= cut;
        else w -= cut;
        px += ((which === "left" ? 1 : -1) * cut) / 2;
      } else {
        w *= 0.96;
        h *= 0.96;
      }
    }
    return { team, spot: which, cx: px, cy, w, h, ...(filled ? { filled } : {}) };
  };
  const spotOf = (side: Side): { x0: number; x1: number; y0: number; y1: number; disc?: number } => {
    const given = side === "left" ? plan?.left : plan?.right;
    if (given !== undefined) return { x0: given.cx - given.w / 2, x1: given.cx + given.w / 2, y0: given.cy - given.h / 2, y1: given.cy + given.h / 2, ...(given.disc === undefined ? {} : { disc: given.disc }) };
    const y0 = box.y + margin;
    const y1 = box.y + box.h - margin;
    return side === "left" ? { x0: box.x + margin, x1: mid - clear - margin, y0, y1 } : { x0: mid + clear + margin, x1: box.x + box.w - margin, y0, y1 };
  };
  const pictures = [place(input.left, "left", spotOf("left")), place(input.right, "right", spotOf("right"))];
  if (!pictures.every((picture) => picture.w > 0 && picture.h > 0 && Number.isFinite(picture.cx + picture.cy))) return undefined;
  const layout: PageantLayout = { pictures, plateScale: scale };
  if (p.emblem !== undefined && emblemR > 0) layout.emblem = { cx: centre.cx, cy: centre.cy, r: emblemR };
  return layout;
}

/** How much of their width the pictures must keep with the plate in the middle, against without it, before the plate in the middle gives way to the strip. */
export const PLATE_COST = 0.7;

/**
 * Where the score goes when the options say `auto` and there is no emblem or board: the plate stays in the middle if the pictures lose little of their size to it, otherwise the score
 * goes to the strip under the drawing and the pictures take the room.
 */
export function autoScore(input: LayoutInput): "centre" | "strip" {
  const withPlate = pageantLayout({ ...input, plate: true });
  const without = pageantLayout({ ...input, plate: false });
  if (withPlate === undefined || without === undefined) return "centre";
  const size = (layout: PageantLayout): number => Math.min(...layout.pictures.map((picture) => picture.w));
  return size(withPlate) >= PLATE_COST * size(without) ? "centre" : "strip";
}
