// The flat crowd's opening against the floor it stands round, for every sport the package draws: the first row of seats clears everything the surface draws round its playing
// area (a court's run-off, a track's sprint straight, runways and pits) on every side and round the corners, nothing of the stands (a tunnel, the benches, the media's desks) is
// drawn on the floor, the opening is centred on the floor, and the bowl is centred in the drawing and wholly inside it, whatever the size and the orientation asked for.
// The geometry here is the test's own: outlines are sampled finely and the distances measured, not read back from the layout's arithmetic.
import { describe, expect, it } from "vitest";
import { FLOOR_CLEAR, type Box, type CrowdStands, type Outline, type Pt } from "./crowd.ts";
import { SPORTS, crowdStands, drawKyogijo, drawSurface } from "./draw.ts";
import type { Sport, SurfaceOptions } from "./types.ts";

/** An outline as a fine polygon: an ellipse in 1440 steps, a rounded rectangle's corners in 180 each. */
function fine(o: Outline): Pt[] {
  if (o.kind === "poly") return o.points;
  if (o.kind === "ellipse") return Array.from({ length: 1440 }, (_, i): Pt => [o.cx + o.rx * Math.cos((i * Math.PI) / 720), o.cy + o.ry * Math.sin((i * Math.PI) / 720)]);
  const r = Math.min(o.r, (o.x1 - o.x0) / 2, (o.y1 - o.y0) / 2);
  const out: Pt[] = [];
  for (const [cx, cy, a0] of [[o.x1 - r, o.y0 + r, -90], [o.x1 - r, o.y1 - r, 0], [o.x0 + r, o.y1 - r, 90], [o.x0 + r, o.y0 + r, 180]] as const)
    for (let i = 0; i <= 180; i += 1) out.push([cx + r * Math.cos(((a0 + i / 2) * Math.PI) / 180), cy + r * Math.sin(((a0 + i / 2) * Math.PI) / 180)]);
  return out;
}

const inside = (poly: readonly Pt[], [x, y]: Pt): boolean => {
  let k = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) k = !k;
  }
  return k;
};

const toSegment = ([px, py]: Pt, [ax, ay]: Pt, [bx, by]: Pt): number => {
  const [dx, dy] = [bx - ax, by - ay];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

/** How far a point lies inside a polygon (negative outside). */
const depth = (poly: readonly Pt[], p: Pt): number => {
  let d = Infinity;
  for (let i = 0; i < poly.length; i += 1) d = Math.min(d, toSegment(p, poly[i], poly[(i + 1) % poly.length]));
  return inside(poly, p) ? d : -d;
};

/** The convex hull of points (Andrew's monotone chain). */
function hull(points: readonly Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Pt[]): Pt[] => {
    const out: Pt[] = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return [...half(p), ...half([...p].reverse())];
}

const viewOf = (svg: string): Box => {
  const [x, y, w, h] = /viewBox="([^"]*)"/.exec(svg)![1].split(" ").map(Number);
  return { x, y, w, h };
};

/** The drawing's own frame of the surface, as the surface lies wide (`seen`: the part of the page that is the surface, when a compact card's strip is under it). */
function wideOf(svg: string, seen: Box = viewOf(svg)): Box {
  const turn = /matrix\(0 1 -1 0 (-?[\d.]+) (-?[\d.]+)\)/.exec(svg);
  if (turn === null) return seen;
  // The quarter turn takes a wide point (x, y) to (tx - y, ty + x) on the page.
  const [tx, ty] = [Number(turn[1]), Number(turn[2])];
  return { x: seen.y - ty, y: tx - (seen.x + seen.w), w: seen.h, h: seen.w };
}

/** The floor with no margin, in the wide frame: the surface's own view. */
const floorBox = (sport: Sport): Box => viewOf(drawSurface({ sport, margin: 0, orientation: "landscape" }));

const team = { home: { name: "Home", abbr: "HOM", score: 2 }, away: { name: "Away", abbr: "AWY", score: 1 } };
const SHOWS = ["full", "compact", "badge", "surface"] as const;
const LAYOUTS: Pick<SurfaceOptions, "orientation" | "aspect">[] = [{ orientation: "landscape" }, { orientation: "portrait" }, { orientation: "auto", aspect: 0.62 }, { orientation: "auto", aspect: 1.7 }];

/** Every check of one sport's stands against its floor (a few variants are walked beside the sports). */
function checkStands(where: string, o: SurfaceOptions, stands: CrowdStands, floor: Box): void {
  const pts = stands.floor?.points ?? [[floor.x, floor.y], [floor.x + floor.w, floor.y], [floor.x + floor.w, floor.y + floor.h], [floor.x, floor.y + floor.h]];
  const shape = hull(pts.map(([x, y]): Pt => [x, y]));
  // The outline spans the floor that is drawn.
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  expect(Math.min(...xs), where).toBeLessThanOrEqual(floor.x + 0.05);
  expect(Math.max(...xs), where).toBeGreaterThanOrEqual(floor.x + floor.w - 0.05);
  expect(Math.min(...ys), where).toBeLessThanOrEqual(floor.y + 0.05);
  expect(Math.max(...ys), where).toBeGreaterThanOrEqual(floor.y + floor.h - 0.05);
  // Every tier's opening holds the whole floor with the clearance to spare, its corners and whatever stands beyond its lines included.
  for (const ring of stands.rings) {
    if (ring.hole === null) continue;
    const hole = fine(ring.hole);
    const least = Math.min(...shape.map((p) => depth(hole, p)));
    expect(least, `${where}: the floor reaches ${(FLOOR_CLEAR - least).toFixed(2)} feet into the ${ring.id} ring`).toBeGreaterThanOrEqual(FLOOR_CLEAR - 0.05);
  }
  // Nothing of the stands is drawn on the floor: the tunnel, the benches, the media's desks and the camera, and the blocks of visitors and of a card display.
  const onFloor = (p: Pt): boolean => depth(shape, p) > 0.01;
  for (const g of stands.gaps) {
    const [x0, y0, x1, y1] = g.box;
    const grid: Pt[] = [];
    for (let i = 0; i <= 12; i += 1) for (let j = 0; j <= 12; j += 1) grid.push([x0 + ((x1 - x0) * i) / 12, y0 + ((y1 - y0) * j) / 12]);
    expect(grid.some(onFloor), `${where}: the ${g.kind} on the floor`).toBe(false);
    expect(shape.some(([x, y]) => x > x0 && x < x1 && y > y0 && y < y1), `${where}: the floor under the ${g.kind}`).toBe(false);
  }
  for (const s of stands.sectors) expect(s.points.some(onFloor), `${where}: the ${s.kind} block on the floor`).toBe(false);
  for (const ring of stands.rings) for (const [a, b] of ring.aisles) expect(onFloor(a) || onFloor(b), `${where}: an aisle of the ${ring.id} ring on the floor`).toBe(false);
  // The opening shares the floor's centre.
  const first = stands.rings.find((r) => r.hole !== null)?.hole;
  if (first !== undefined && first !== null && first.kind !== "poly") {
    const [hx, hy] = first.kind === "ellipse" ? [first.cx, first.cy] : [(first.x0 + first.x1) / 2, (first.y0 + first.y1) / 2];
    expect(Math.abs(hx - (floor.x + floor.w / 2)), `${where}: the opening's centre across`).toBeLessThan(0.5);
    expect(Math.abs(hy - (floor.y + floor.h / 2)), `${where}: the opening's centre along`).toBeLessThan(0.5);
  }
  // The drawing at every size and orientation: the bowl centred in it and wholly inside it, the roof's shade too.
  const { box, reach } = stands;
  const bowl = { x0: box.x - reach.left, x1: box.x + box.w + reach.right, y0: box.y - reach.top, y1: box.y + box.h + reach.bottom };
  for (const layout of LAYOUTS) {
    let page: Box | undefined;
    for (const show of SHOWS) {
      const asked = { ...o, ...layout };
      const svg = show === "surface" ? drawSurface(asked) : drawKyogijo({ ...asked, ...team, size: show });
      const here = `${where} ${show} ${layout.orientation}${layout.aspect === undefined ? "" : ` ${layout.aspect}`}`;
      if (show === "badge") {
        // A badge is a card of the score: no stands are drawn on it.
        expect(svg.includes('<g class="ky-crowd'), here).toBe(false);
        continue;
      }
      expect(svg.includes('<g class="ky-crowd'), here).toBe(true);
      // A compact card is the full drawing with the score's strip under it.
      const own = viewOf(svg);
      if (show === "compact" && page !== undefined) {
        expect([own.x, own.y, own.w], here).toEqual([page.x, page.y, page.w]);
        expect(own.h, here).toBeGreaterThanOrEqual(page.h);
      }
      if (show === "full") page = own;
      const v = wideOf(svg, show === "compact" && page !== undefined ? page : own);
      expect(Math.abs((bowl.x0 + bowl.x1) / 2 - (v.x + v.w / 2)), `${here}: the bowl's centre across the drawing`).toBeLessThan(0.5);
      expect(Math.abs((bowl.y0 + bowl.y1) / 2 - (v.y + v.h / 2)), `${here}: the bowl's centre along the drawing`).toBeLessThan(0.5);
      const shade = 9;
      expect(bowl.x0 - shade, here).toBeGreaterThanOrEqual(v.x - 0.05);
      expect(bowl.y0 - shade, here).toBeGreaterThanOrEqual(v.y - 0.05);
      expect(bowl.x1 + shade, here).toBeLessThanOrEqual(v.x + v.w + 0.05);
      expect(bowl.y1 + shade, here).toBeLessThanOrEqual(v.y + v.h + 0.05);
    }
  }
  // The theme changes colours only: the dark drawing's frame and shapes are the light one's.
  const shapes = (svg: string): string => [viewOf(svg), ...[...svg.matchAll(/ (?:d|x|y|width|height)="([^"]*)"/g)].map((m) => m[1])].join("|");
  expect(shapes(drawSurface({ ...o, theme: "dark" })), `${where} dark`).toBe(shapes(drawSurface({ ...o, theme: "light" })));
}

describe("the flat crowd's opening clears the floor", () => {
  // A ballpark's stands are laid out from its fence (`parkLayout`), not round a floor.
  const sports = SPORTS.filter((s) => s !== "mlb");

  it.each(sports)("%s", (sport) => {
    const o: SurfaceOptions = { sport, crowd: true };
    checkStands(sport, o, crowdStands(o)!, floorBox(sport));
  });

  it("an athletics stadium's opening clears the sprint straight, the jumps' strip and the runways, not only the oval", () => {
    const stands = crowdStands({ sport: "athletics", crowd: true })!;
    const floor = floorBox("athletics");
    // The floor's outline reaches beyond the oval on both sides: the straight on one, the jumps on the other.
    expect(stands.floor?.points.length).toBeGreaterThan(64);
    expect(floor.y).toBeLessThan(-20);
    expect(floor.h).toBeGreaterThan(stands.box.h + 30);
  });

  it("a small floor has a small opening of its own shape: a table tennis area is longer than it is wide, and so is its opening", () => {
    const stands = crowdStands({ sport: "tabletennis", crowd: true })!;
    const floor = floorBox("tabletennis");
    const hole = stands.rings[0].hole as Extract<Outline, { kind: "rrect" }>;
    const [w, h] = [hole.x1 - hole.x0, hole.y1 - hole.y0];
    expect(w / h).toBeGreaterThan(1.3);
    // The same gap all round.
    expect(Math.abs((w - floor.w) - (h - floor.h))).toBeLessThan(0.01);
  });

  it.each([
    ["a soccer pitch in a gridiron's stands", { sport: "soccer", crowd: { stadium: "nfl" } }],
    ["a judo mat on the Budokan's arena floor", { sport: "judo", crowd: true, budo: { hall: "budokan" } }],
    ["two sides round a pool", { sport: "swimming", crowd: { shape: "sides" } }],
    ["a horseshoe round a rugby pitch", { sport: "rugby", crowd: { shape: "horseshoe" } }],
    ["a tifo and the visitors at the corner", { sport: "volleyball", crowd: { tifo: "both", awayEnd: "corner" } }],
    ["an indoor athletics track", { sport: "athletics", crowd: true, athletics: { indoor: true } }],
  ] as [string, SurfaceOptions][])("%s", (name, o) => {
    const floor = viewOf(drawSurface({ ...o, crowd: undefined, margin: 0, orientation: "landscape" }));
    checkStands(name, o, crowdStands(o)!, floor);
  });
});
