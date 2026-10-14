// What stands on the courts of the net sports: the net hung between its posts, the antennae of volleyball, the sticks of singles tennis, and a table tennis
// table lifted on its legs (the other net sports, with walls, a table or a ring, are in uprights.more.ts). The figures are the rulebooks' own (docs/sources.md): the court's geometry says where the net and the posts stand, the league's
// figures how high; what the rules leave to the maker (a post's height in tennis, the size of the mesh) is said where it is chosen.
import type { CourtGeometry, CourtPlan } from "./court.ts";
import type { TennisFigures, VolleyballFigures, BadmintonFigures, PickleballFigures, TableTennisFigures } from "./leagues/courts.ts";
import { bar, flat, n, pole, type Upright } from "./turn.kit.ts";
import { moreUprights } from "./uprights.more.ts";
import { netPlane, sag, tableBody } from "./uprights.netkit.ts";
import { convertLength } from "./units.ts";

export interface NetEnd {
  items: Upright[];
  /** How high the surface stands over the ground: a table's top. */
  lift: number;
}

/** The uprights of a court: what hangs on its posts. `thin` is the least thickness drawn, in feet. */
export function netUprights(plan: CourtPlan, geo: CourtGeometry, settings: { netHeight?: "men" | "women"; boards?: boolean }, thin: number): NetEnd {
  const { x, y0, y1 } = geo.net ?? { x: geo.length / 2, y0: 0, y1: geo.width };
  const items: Upright[] = [];
  const posts = (height: number, cls = "u-pole"): Upright => ({
    id: "posts",
    kind: "netposts",
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
      if (geo.sticks.length > 0) items.push({ id: "sticks", kind: "netposts", at: [x, (y0 + y1) / 2], height: p, planes: geo.sticks.flatMap((s, i) => pole(`stick-${i === 0 ? "a" : "b"}`, "post", s.x, s.y, 0, p, Math.max(s.size, thin * 1.1), "u-tape")) });
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
      // The FIVB's posts are 2.55 m, 12 cm over the men's net; sitting volleyball's rules cited give their distance from the side lines only, so the same 12 cm is ours.
      items.push(posts(f.net.heightMen + convertLength(0.12, "m", "ft")));
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
    case "tabletennis": {
      const f: TableTennisFigures = plan.figures;
      const lift = f.height;
      const { height: h, postHeight } = f.net;
      const cell = Math.max(convertLength(0.01, "m", "ft") * 1.5, thin * 3);
      items.push({ id: "net", kind: "net", at: [x, (y0 + y1) / 2], height: lift + h, planes: [netPlane({ id: "net", x, y0, y1, top: () => h, bottom: () => 0, cell, tape: Math.max(0.03, thin * 0.8) }, lift)] });
      items.push({
        id: "clamps",
        kind: "netposts",
        at: [x, (y0 + y1) / 2],
        height: lift + postHeight,
        planes: geo.posts.flatMap((p, i) => pole(`post-${i === 0 ? "a" : "b"}`, "post", p.x, p.y, lift, lift + postHeight, Math.max(p.size, thin * 1.6), "u-pole")),
      });
      // The table: a skirt under its top, and four legs set in from its ends.
      const L = geo.length;
      const W = geo.width;
      items.push({ id: "table", kind: "table-legs", at: [L / 2, W / 2], height: lift, planes: tableBody(0, 0, L, W, lift, thin, false) });
      // The floor of the hall, under the table.
      const room = Math.max(L, W) * 5;
      items.push({ id: "ground", kind: "table-legs", at: [L / 2, W / 2], height: 0, planes: [flat("ground", "ground", -room, -room, L + room, W + room, 0, `<rect width="${n(L + 2 * room)}" height="${n(W + 2 * room)}" class="u-ground"/>`)] });
      return { items, lift };
    }
    default:
      return moreUprights(plan, geo, settings, thin);
  }
}
