// What stands on the courts of the net sports: the net hung between its posts, the antennae of volleyball, the sticks of singles tennis, and a table tennis
// table lifted on its legs. The figures are the rulebooks' own (docs/sources.md): the court's geometry says where the net and the posts stand, the league's
// figures how high; what the rules leave to the maker (a post's height in tennis, the size of the mesh) is said where it is chosen.
import type { CourtGeometry, CourtPlan } from "./court.ts";
import type { TennisFigures, VolleyballFigures, BadmintonFigures, PickleballFigures, TableTennisFigures } from "./leagues/courts.ts";
import { bar, flat, n, plane, pole, threads, wall, type Plane, type Upright } from "./turn.kit.ts";
import { convertLength } from "./units.ts";

/** What a net on a court is: where it hangs, between which posts, and the line of its top and of its bottom. */
interface NetBody {
  id: string;
  x: number;
  y0: number;
  y1: number;
  /** The height of the top edge and of the bottom edge over a place across the court, above the court's own surface. */
  top: (y: number) => number;
  bottom: (y: number) => number;
  /** The mesh's cell, and the tape along the top, in feet. */
  cell: number;
  tape: number;
  /** Vertical white bands across the net at these places across the court (volleyball's side bands), and their width. */
  bands?: { at: readonly number[]; width: number };
}

/** The net: a mesh between a top line and a bottom line, with its tape, on one plane standing over the line x. */
function netPlane(b: NetBody, lift: number): Plane {
  const { y0, y1 } = b;
  const steps = 24;
  const ys = Array.from({ length: steps + 1 }, (_, i) => y0 + ((y1 - y0) * i) / steps);
  const high = Math.max(...ys.map(b.top));
  const low = Math.min(...ys.map(b.bottom));
  const span = y1 - y0;
  const fromTop = (z: number): number => high - z;
  const edge = (f: (y: number) => number): string => ys.map((y) => `${n(y - y0)} ${n(fromTop(f(y)))}`).join("L");
  const top = ys.map((y) => `${n(y - y0)} ${n(fromTop(b.top(y)))}`);
  const bottom = [...ys].reverse().map((y) => `${n(y - y0)} ${n(fromTop(b.bottom(y)))}`);
  const outline = `M${top.join("L")}L${bottom.join("L")}Z`;
  let lines = "";
  // Upright threads, one every cell, from the top line to the bottom line.
  const across = Math.max(2, Math.round(span / b.cell));
  for (let i = 1; i < across; i += 1) {
    const y = y0 + (span * i) / across;
    lines += `M${n(y - y0)} ${n(fromTop(b.top(y)))}V${n(fromTop(b.bottom(y)))}`;
  }
  // Level threads, wherever the net reaches that height.
  const levels = Math.max(1, Math.round((high - low) / b.cell));
  for (let j = 1; j < levels; j += 1) {
    const z = low + ((high - low) * j) / levels;
    let pen = false;
    for (const y of ys) {
      const inside = z <= b.top(y) && z >= b.bottom(y);
      lines += `${inside ? (pen ? "L" : "M") : ""}${inside ? `${n(y - y0)} ${n(fromTop(z))}` : ""}`;
      pen = inside;
    }
  }
  const tape = `<path d="M${edge(b.top)}" class="u-tapeline" fill="none" stroke-width="${n(b.tape)}"/>`;
  const bands = (b.bands?.at ?? []).map((y) => `<rect x="${n(y - y0 - b.bands!.width / 2)}" y="${n(fromTop(b.top(y)))}" width="${n(b.bands!.width)}" height="${n(b.top(y) - b.bottom(y))}" class="u-tape"/>`).join("");
  return plane(b.id, "net", [b.x, y0, lift + high], [0, span, 0], [0, 0, -(high - low)], `<path d="${outline}" class="u-netfill"/>${threads(lines, b.cell)}${bands}${tape}`);
}

/** A parabola from the centre height to the post height: the sag of a net hung between two posts. */
const sag = (y0: number, y1: number, centre: number, posts: number) => (y: number): number => {
  const middle = (y0 + y1) / 2;
  const t = (y - middle) / ((y1 - y0) / 2);
  return centre + (posts - centre) * t * t;
};

interface NetEnd {
  items: Upright[];
  /** How high the surface stands over the ground: a table's top. */
  lift: number;
}

/** The uprights of a court: what hangs on its posts. `thin` is the least thickness drawn, in feet. */
export function netUprights(plan: CourtPlan, geo: CourtGeometry, settings: { netHeight?: "men" | "women" }, thin: number): NetEnd {
  const x = geo.net.x;
  const { y0, y1 } = geo.net;
  const items: Upright[] = [];
  const posts = (height: number, cls = "u-pole"): Upright => ({
    id: "posts",
    kind: "posts",
    at: [x, (y0 + y1) / 2],
    height,
    planes: geo.posts.flatMap((p, i) => pole(`post-${i === 0 ? "a" : "b"}`, "post", p.x, p.y, 0, height, Math.max(p.size, thin * 1.4), cls)),
  });
  switch (plan.sport) {
    case "tennis": {
      const f: TennisFigures = plan.figures;
      const { heightPosts: p, heightCentre: c } = f.net;
      const cell = Math.max(0.25, thin * 6);
      items.push({ id: "net", kind: "net", at: [x, (y0 + y1) / 2], height: p, low: c, planes: [netPlane({ id: "net", x, y0, y1, top: sag(y0, y1, c, p), bottom: () => 0, cell, tape: Math.max(0.17, thin) }, 0)] });
      items.push(posts(p));
      if (geo.sticks.length > 0) items.push({ id: "sticks", kind: "posts", at: [x, (y0 + y1) / 2], height: p, planes: geo.sticks.flatMap((s, i) => pole(`stick-${i === 0 ? "a" : "b"}`, "post", s.x, s.y, 0, p, Math.max(s.size, thin * 1.1), "u-tape")) });
      return { items, lift: 0 };
    }
    case "volleyball": {
      const f: VolleyballFigures = plan.figures;
      const top = settings.netHeight === "women" ? f.net.heightWomen : f.net.heightMen;
      const strip = f.net.width;
      const cell = Math.max(convertLength(0.1, "m", "ft"), thin * 6);
      const side = Math.max(convertLength(0.05, "m", "ft"), thin * 1.2);
      items.push({
        id: "net",
        kind: "net",
        at: [x, (y0 + y1) / 2],
        height: top,
        planes: [netPlane({ id: "net", x, y0, y1, top: () => top, bottom: () => top - strip, cell, tape: Math.max(convertLength(0.07, "m", "ft"), thin * 1.6), bands: { at: [0, geo.width], width: side } }, 0)],
      });
      items.push(posts(convertLength(2.55, "m", "ft")));
      // An antenna is 1.8 m long and stands 80 cm over the net's top, in bands of 10 cm, red and white.
      const reach = f.net.antenna.length;
      const above = convertLength(0.8, "m", "ft");
      const stripe = convertLength(0.1, "m", "ft");
      const antenna = (long: number, wide: number): string => {
        let rects = "";
        for (let a = 0, i = 0; a < long; a += stripe, i += 1) rects += `<rect x="${n(a)}" width="${n(Math.min(stripe, long - a))}" height="${n(wide)}" class="${i % 2 === 0 ? "u-red" : "u-white"}"/>`;
        return rects;
      };
      items.push({
        id: "antennae",
        kind: "antennae",
        at: [x, (y0 + y1) / 2],
        height: top + above,
        planes: geo.antennae.flatMap((a, i) => bar(`antenna-${i === 0 ? "a" : "b"}`, "antenna", [a.x, a.y, top + above - reach], [a.x, a.y, top + above], Math.max(a.size, thin * 1.1), "u-red", antenna)),
      });
      return { items, lift: 0 };
    }
    case "badminton": {
      const f: BadmintonFigures = plan.figures;
      const { postHeight: p, heightCentre: c, heightSides: s, depth } = f.net;
      const cell = Math.max(convertLength(0.02, "m", "ft") * 4, thin * 5);
      items.push({
        id: "net",
        kind: "net",
        at: [x, (y0 + y1) / 2],
        height: s,
        low: c,
        planes: [netPlane({ id: "net", x, y0, y1, top: sag(y0, y1, c, s), bottom: (y) => sag(y0, y1, c, s)(y) - depth, cell, tape: Math.max(convertLength(0.075, "m", "ft"), thin) }, 0)],
      });
      items.push(posts(p));
      return { items, lift: 0 };
    }
    case "pickleball": {
      const f: PickleballFigures = plan.figures;
      const { heightSides: s, heightCentre: c } = f.net;
      const cell = Math.max(0.25, thin * 6);
      items.push({ id: "net", kind: "net", at: [x, (y0 + y1) / 2], height: s, low: c, planes: [netPlane({ id: "net", x, y0, y1, top: sag(y0, y1, c, s), bottom: () => 0, cell, tape: Math.max(0.17, thin) }, 0)] });
      items.push(posts(s * 1.04));
      return { items, lift: 0 };
    }
    default: {
      const f: TableTennisFigures = plan.figures;
      const lift = f.height;
      const { height: h, postHeight } = f.net;
      const cell = Math.max(convertLength(0.01, "m", "ft") * 1.5, thin * 3);
      items.push({ id: "net", kind: "net", at: [x, (y0 + y1) / 2], height: lift + h, planes: [netPlane({ id: "net", x, y0, y1, top: () => h, bottom: () => 0, cell, tape: Math.max(0.03, thin * 0.8) }, lift)] });
      items.push({
        id: "clamps",
        kind: "posts",
        at: [x, (y0 + y1) / 2],
        height: lift + postHeight,
        planes: geo.posts.flatMap((p, i) => pole(`post-${i === 0 ? "a" : "b"}`, "post", p.x, p.y, lift, lift + postHeight, Math.max(p.size, thin * 1.6), "u-pole")),
      });
      // The table: a skirt under its top, and four legs set in from its ends.
      const skirt = Math.max(convertLength(0.05, "m", "ft"), thin * 2);
      const L = geo.length;
      const W = geo.width;
      const body: Plane[] = [
        wall("table-side-a", "table", 0, 0, L, 0, lift - skirt, lift, `<rect width="${n(L)}" height="${n(skirt)}" class="u-table"/>`),
        wall("table-side-b", "table", 0, W, L, W, lift - skirt, lift, `<rect width="${n(L)}" height="${n(skirt)}" class="u-table"/>`),
        wall("table-end-a", "table", 0, 0, 0, W, lift - skirt, lift, `<rect width="${n(W)}" height="${n(skirt)}" class="u-table"/>`),
        wall("table-end-b", "table", L, 0, L, W, lift - skirt, lift, `<rect width="${n(W)}" height="${n(skirt)}" class="u-table"/>`),
      ];
      const leg = Math.max(convertLength(0.05, "m", "ft"), thin * 2.2);
      const inset = Math.max(L * 0.07, leg * 2);
      const legs: Plane[] = [];
      for (const [i, [lx, ly]] of ([[inset, inset], [inset, W - inset], [L - inset, inset], [L - inset, W - inset]] as const).entries()) legs.push(...pole(`leg-${i}`, "leg", lx, ly, 0, lift - skirt, leg, "u-leg"));
      items.push({ id: "table", kind: "table-legs", at: [L / 2, W / 2], height: lift, planes: [...body, ...legs] });
      // The floor of the hall, under the table.
      const room = Math.max(L, W) * 5;
      items.push({ id: "ground", kind: "table-legs", at: [L / 2, W / 2], height: 0, planes: [flat("ground", "ground", -room, -room, L + room, W + room, 0, `<rect width="${n(L + 2 * room)}" height="${n(W + 2 * room)}" class="u-ground"/>`)] });
      return { items, lift };
    }
  }
}
