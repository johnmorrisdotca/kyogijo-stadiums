// A special game: one surface set inside another, to scale (a hockey rink in a ballpark, a basketball court on a ship's deck). The host is drawn as it
// is drawn alone; the guest, which is the drawing's own surface, is put on it through one transform, so that the lines, the team banners, the score and
// the data layers are the guest's, in its own frame. Nothing here is a second way of drawing a rink or a field.
import { convertLength } from "./units.ts";
import { num, el } from "./format.ts";
import { MLB } from "./geometry.ts";
import { groundById } from "./grounds.ts";
import { lengthUnit } from "./common.ts";
import { lineLook, restyleLines } from "./restyle.ts";
import { outlineOf, type Outline } from "./outline.ts";
import type { Surface, Zone } from "./surfaces/surface.ts";
import type { HostOptions, Placement, Sport, SurfaceOptions } from "./types.ts";

/** The host as options for a surface of its own: the options `outlineOf` and the drawing take. */
export function hostSurfaceOptions(host: HostOptions, o: Pick<SurfaceOptions, "year" | "detail" | "stripes" | "stripePattern" | "exactLines">): SurfaceOptions | undefined {
  const year = host.year ?? o.year;
  const common = { detail: o.detail, stripes: o.stripes, stripePattern: o.stripePattern, exactLines: o.exactLines, year };
  if (host.park !== undefined) return { ...common, sport: "mlb", park: host.park };
  if (host.ground !== undefined || host.pitch !== undefined) {
    const ground = groundById(host.ground);
    const pitch = host.pitch ?? (ground === undefined || ground.pitchSize === "default" ? undefined : { ...ground.pitch, unit: "m" as const });
    return { ...common, sport: "soccer", ground: host.ground, pitch };
  }
  if (host.field !== undefined) return { ...common, sport: host.field, league: host.league };
  return undefined;
}

/** The host's outline in its frame, in feet. */
export function hostOutline(host: HostOptions, o: Pick<SurfaceOptions, "year" | "detail" | "stripes" | "stripePattern" | "exactLines">): Outline {
  if (host.deck !== undefined) {
    const unit = host.deck.unit ?? "ft";
    const w = convertLength(host.deck.length, unit, "ft");
    const h = convertLength(host.deck.width, unit, "ft");
    const box = { x: 0, y: 0, w, h };
    return { d: `M0 0H${num(w)}V${num(h)}H0Z`, box, contains: (x, y) => x >= 0 && x <= w && y >= 0 && y <= h };
  }
  const options = hostSurfaceOptions(host, o);
  if (options === undefined) throw new Error("A host needs one of park, ground, pitch, field or deck");
  return outlineOf(options);
}

/** The sport of the host as the drawing's palette knows it. */
export function hostSport(host: HostOptions): Sport | "deck" {
  if (host.park !== undefined) return "mlb";
  if (host.ground !== undefined || host.pitch !== undefined) return "soccer";
  if (host.field !== undefined) return host.field;
  return "deck";
}

/** A ballpark's infield is a square 90 feet on a side: its middle is where the line from first base to third crosses the line from home plate to second. */
export const INFIELD_CENTRE = Math.round((MLB.base * Math.SQRT2 * 100) / 2) / 100;

/** The point of the guest that is put at the placement's `x` and `y`: the middle of the playing surface, and for a ballpark home plate. */
export function guestAnchor(o: Pick<SurfaceOptions, "sport" | "park" | "fence" | "units" | "pitch" | "league" | "year" | "sheet" | "net">): { x: number; y: number } {
  const outline = outlineOf(o);
  if (o.sport === "mlb") return { x: 0, y: 0 };
  return { x: outline.box.x + outline.box.w / 2, y: outline.box.y + outline.box.h / 2 };
}

/**
 * Where the guest stands when the options do not say: the middle of the host's field, with the guest as it lies; the middle of a ballpark's infield; for a
 * ballpark set inside another surface, its infield's middle on the middle of the host.
 */
export function defaultPlacement(o: SurfaceOptions): Placement {
  const host = o.host as HostOptions;
  const box = hostOutline(host, o).box;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  if (o.sport === "mlb") return { x: cx, y: cy + INFIELD_CENTRE, angle: 0 };
  if (host.park !== undefined) return { x: 0, y: -INFIELD_CENTRE, angle: 0 };
  return { x: cx, y: cy, angle: 0 };
}

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** The placement the options ask for, with a part it leaves out filled from the default. */
export function placementOf(o: SurfaceOptions): Placement {
  const base = defaultPlacement(o);
  const p = o.placement;
  if (p === undefined) return base;
  return { x: finite(p.x) ? p.x : base.x, y: finite(p.y) ? p.y : base.y, angle: finite(p.angle) ? p.angle : base.angle };
}

/** The point of the guest's own frame at the host's, for a placement. */
export function guestToHost(o: SurfaceOptions, p: Placement): (x: number, y: number) => [number, number] {
  const a = guestAnchor(o);
  const t = (p.angle * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  return (x, y) => {
    const dx = x - a.x;
    const dy = y - a.y;
    return [p.x + dx * cos - dy * sin, p.y + dx * sin + dy * cos];
  };
}

/** The transform that does the same, as SVG writes it. */
export function guestTransform(o: SurfaceOptions, p: Placement): string {
  const a = guestAnchor(o);
  return `translate(${num(p.x)} ${num(p.y)})${p.angle === 0 ? "" : ` rotate(${num(p.angle)})`}${a.x === 0 && a.y === 0 ? "" : ` translate(${num(-a.x)} ${num(-a.y)})`}`;
}

/** How a guest sits in its host: the share of the guest's surface that lies outside the host's outline, from 0 (wholly inside) to 1. */
export interface Fit {
  /** True when every point of the guest's surface is inside the host's outline. */
  inside: boolean;
  /** The share of the guest's area outside the host's outline, to a thousandth. */
  outside: number;
}

/**
 * How the guest sits in its host, worked out on a grid over the guest's outline (a rink's rounded corners and a fence's curve are the guest's own).
 * For a ballpark the host's outline is the fair ground inside the fence: a rink across the infield reaches into foul ground, which this reports as outside.
 */
export function fitOf(o: SurfaceOptions): Fit {
  const host = o.host as HostOptions;
  const hostBox = hostOutline(host, o);
  const guest = outlineOf(o);
  const to = guestToHost(o, placementOf(o));
  const steps = 60;
  let all = 0;
  let out = 0;
  for (let i = 0; i < steps; i += 1) {
    for (let j = 0; j < steps; j += 1) {
      const gx = guest.box.x + ((i + 0.5) / steps) * guest.box.w;
      const gy = guest.box.y + ((j + 0.5) / steps) * guest.box.h;
      if (!guest.contains(gx, gy)) continue;
      all += 1;
      const [hx, hy] = to(gx, gy);
      if (!hostBox.contains(hx, hy)) out += 1;
    }
  }
  return { inside: out === 0, outside: all === 0 ? 0 : Math.round((out / all) * 1000) / 1000 };
}

/** The leading ground rectangle of a surface's markup (the apron, or a ballpark's foul ground): a guest has none, as it is on the host's ground. */
const GROUND = /^<rect class="ky-(?:apron|foul)(?: [^"]*)?"[^>]*\/>/;

/** Turn a text's angle upright: the least turn that leaves words readable, between -90 and 90 degrees. */
const upright = (angle: number): number => {
  let a = ((((angle + 90) % 180) + 180) % 180) - 90;
  if (Object.is(a, -0)) a = 0;
  return a === -90 ? 90 : a;
};

const moved = (zone: Zone, to: (x: number, y: number) => [number, number], angle: number): Zone => {
  const [cx, cy] = to(zone.cx, zone.cy);
  return { ...zone, cx, cy, rot: upright(zone.rot + angle) };
};

/** The corners of a box, moved by `to`. */
function corners(box: { x: number; y: number; w: number; h: number }, to: (x: number, y: number) => [number, number]): [number, number][] {
  return [
    to(box.x, box.y),
    to(box.x + box.w, box.y),
    to(box.x + box.w, box.y + box.h),
    to(box.x, box.y + box.h),
  ];
}

/**
 * The host and the guest as one surface. `guest` is the drawing's own surface, built wide with no margin; `build` draws the host as a surface of its own.
 * The result has the host's frame, the guest's team places and score moved onto the guest, and `frame`, the transform the guest's data goes through.
 */
export function composeSpecial(o: SurfaceOptions, guest: Surface, build: (options: SurfaceOptions, id: string) => Surface, id: string): Surface {
  const host = o.host as HostOptions;
  const placement = placementOf(o);
  const to = guestToHost(o, placement);
  const frame = guestTransform(o, placement);
  const hostSurface = hostSurfaceOptions(host, o);
  const outline = hostOutline(host, o);
  const guestBox = outlineOf(o).box;
  const margin = typeof o.margin === "number" && Number.isFinite(o.margin) && o.margin >= 0 ? convertLength(o.margin, lengthUnit(o), "ft") : 8;

  let base: string;
  let defs = guest.defs;
  let view: { x: number; y: number; w: number; h: number };
  const sport = hostSport(host);
  if (hostSurface === undefined) {
    // A plain rectangle, such as the deck of a ship.
    const b = outline.box;
    view = { x: b.x - margin, y: b.y - margin, w: b.w + 2 * margin, h: b.h + 2 * margin };
    base = el("g", { class: "ky-host", "data-sport": sport }, el("rect", { class: "ky-deck", x: b.x, y: b.y, width: b.w, height: b.h }));
  } else {
    const surface = build(hostSurface, `${id}-host`);
    view = { ...surface.view };
    base = el("g", { class: "ky-host", "data-sport": sport }, surface.base + surface.lines);
    defs = surface.defs + defs;
  }
  // The view holds the host and the guest with a margin round it, wherever the guest hangs over.
  const points = corners({ x: guestBox.x - margin, y: guestBox.y - margin, w: guestBox.w + 2 * margin, h: guestBox.h + 2 * margin }, to);
  const x0 = Math.min(view.x, ...points.map(([x]) => x));
  const y0 = Math.min(view.y, ...points.map(([, y]) => y));
  const x1 = Math.max(view.x + view.w, ...points.map(([x]) => x));
  const y1 = Math.max(view.y + view.h, ...points.map(([, y]) => y));
  view = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };

  const unit = lengthUnit(o);
  const look = lineLook(o, guest.lineRef, unit);
  const guestLines = look === undefined ? guest.lines : restyleLines(guest.lines, look);
  const apron = el("rect", { class: "ky-apron", x: view.x, y: view.y, width: view.w, height: view.h });
  const own = el("g", { class: "ky-guest", transform: frame }, guest.base.replace(GROUND, ""));
  const [px, py] = to(guest.plate.cx, guest.plate.cy);
  return {
    sport: guest.sport,
    view,
    base: apron + base + own,
    lines: el("g", { class: "ky-guest-lines", transform: frame }, guestLines),
    defs,
    left: moved(guest.left, to, placement.angle),
    right: moved(guest.right, to, placement.angle),
    plate: { ...guest.plate, cx: px, cy: py },
    turned: false,
    bannersOver: guest.bannersOver,
    box: outline.box,
    frame,
  };
}
