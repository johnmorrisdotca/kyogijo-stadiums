// The stands and the crowd as SVG: each tier a band of seats under a tile of a pattern, and the people in it a few dozen dots, a shirt and a head each, written once per tile
// (a dot is a stroke of no length with round caps, a few bytes), so that a stadium is a few shapes however many seats it has, in the home colours with the empty seats showing.
// All of it is patterns, paths and rectangles, which every renderer of the package reads. The tiles are made from a seed with a generator of our own, so the same options give
// the same crowd. Written for this package; no photograph or other drawing was copied.
import { el, num } from "./format.ts";
import { generator, outlinePath, rayAt, type Crowd, type CrowdStands, type Pt, type StandRing, type StandSector } from "./crowd.ts";

/** The width and the height of a tile of the crowd, in feet, and the seats' pitch. */
const TILE = 14.4;
const PITCH = 2.4;

const SHIRTS = ["#9aa3b0", "#3a4252", "#6a7384", "#a08f76", "#2a2c33", "#7d90a8"];
const HAIR = ["#17120e", "#251a12", "#3d2a1b", "#8c7040", "#5c5c5c", "#b07c5a"];

const n1 = (v: number): string => {
  const t = (Math.round(v * 10) / 10).toString();
  return t === "-0" ? "0" : t.replace(/^0\./, ".");
};

/** One tile of people: the seats of a block 18 feet square, each taken with the probability `density`, in the colour of a team with the probability `share` and else in a neutral. */
function tile(seed: number, density: number, share: number, team: "ky-cr-h" | "ky-cr-a"): string {
  const next = generator(seed);
  const shirts = new Map<string, string[]>();
  const heads = new Map<string, string[]>();
  const empty: string[] = [];
  const put = (map: Map<string, string[]>, key: string, x: number, y: number): void => {
    const list = map.get(key) ?? [];
    list.push(`M${n1(x)} ${n1(y)}h.01`);
    map.set(key, list);
  };
  for (let j = 0; j < TILE / PITCH; j += 1) {
    for (let i = 0; i < TILE / PITCH; i += 1) {
      const x = (i + 0.5) * PITCH + (next() - 0.5) * 0.2;
      const y = (j + 0.5) * PITCH + (next() - 0.5) * 0.2;
      const taken = next() < density;
      const shirt = next();
      const hair = next();
      if (!taken) {
        empty.push(`M${n1(x)} ${n1(y)}h.01`);
        continue;
      }
      // A team's fans are in its colour, some of them in a darker shade of it (a jacket, a shadow), the rest in neutrals.
      put(shirts, shirt < share * 0.72 ? team : shirt < share ? `${team}-d` : `#${SHIRTS[Math.floor(next() * SHIRTS.length)].slice(1)}`, x, y);
      put(heads, HAIR[Math.floor(hair * HAIR.length)], x, y);
    }
  }
  let out = "";
  if (empty.length > 0) out += el("path", { class: "ky-cr-seat", d: empty.join("") });
  for (const [key, list] of shirts) out += key.startsWith("ky-") ? el("path", { class: key, d: list.join("") }) : el("path", { stroke: key, d: list.join("") });
  const headPaths = [...heads].map(([colour, list]) => el("path", { stroke: colour, "stroke-width": 1.15, d: list.join("") })).join("");
  return el("rect", { class: "ky-cr-bed", width: TILE, height: TILE }) + el("g", { fill: "none", "stroke-linecap": "round", "stroke-width": 2.3 }, out + headPaths);
}

/** The tiles a crowd needs: the home tile, the home tile of the upper tiers (emptier) and the visitors', and the display tiles. */
function patterns(id: string, crowd: Crowd, density: number, tifo: { home: boolean; away: boolean } | undefined): string {
  const make = (suffix: string, body: string, size = TILE): string => el("pattern", { id: `${id}-cr-${suffix}`, width: size, height: size, patternUnits: "userSpaceOnUse" }, body);
  let out = make("h", tile(crowd.seed * 7 + 1, density, 0.88, "ky-cr-h")) + make("a", tile(crowd.seed * 7 + 3, Math.min(1, density * 1.04), 0.94, "ky-cr-a"));
  if (tifo !== undefined) {
    const stripes = (cls: string): string => el("rect", { class: cls, width: 3, height: 6 }) + el("rect", { class: "ky-cr-tw", x: 3, width: 3, height: 6 });
    const checks = (cls: string): string => el("rect", { class: cls, width: 3, height: 3 }) + el("rect", { class: cls, x: 3, y: 3, width: 3, height: 3 }) + el("rect", { class: "ky-cr-tw", x: 3, width: 3, height: 3 }) + el("rect", { class: "ky-cr-tw", y: 3, width: 3, height: 3 });
    const one = crowd.tifoDesign === "checks" ? checks : stripes;
    if (tifo.home) out += make("th", one("ky-cr-th"), 6);
    if (tifo.away) out += make("ta", one("ky-cr-ta"), 6);
  }
  return out;
}

const path = (ring: StandRing): string => [ring.region, ...(ring.more ?? [])].map((o) => outlinePath(o)).join("") + (ring.hole === null ? "" : outlinePath(ring.hole, true));

/** The aisles of a band: short lines across it, every so often, along its straight parts (a rectangle), at equal angles (an ellipse), or between the two edges (a polygon). */
function aisles(ring: StandRing): string {
  const d: string[] = [];
  const r = ring.region;
  const h = ring.hole;
  const step = 34;
  if (r.kind === "rrect" && h !== null && h.kind === "rrect") {
    const hr = Math.min(h.r, (h.x1 - h.x0) / 2, (h.y1 - h.y0) / 2);
    for (let x = h.x0 + hr + step / 2; x < h.x1 - hr; x += step) d.push(`M${n1(x)} ${n1(r.y0)}V${n1(h.y0)}M${n1(x)} ${n1(h.y1)}V${n1(r.y1)}`);
    for (let y = h.y0 + hr + step / 2; y < h.y1 - hr; y += step) d.push(`M${n1(r.x0)} ${n1(y)}H${n1(h.x0)}M${n1(h.x1)} ${n1(y)}H${n1(r.x1)}`);
  } else if (r.kind === "ellipse" && h !== null && h.kind === "ellipse") {
    for (let i = 0; i < 48; i += 1) {
      const a = (i * Math.PI) / 24;
      const [x0, y0] = rayAt(h, h.cx, h.cy, a);
      const [x1, y1] = rayAt(r, r.cx, r.cy, a);
      d.push(`M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}`);
    }
  } else if (r.kind === "poly" && h === null) {
    const pts = r.points;
    const n = pts.length;
    for (let i = 2; i < n / 2 - 1; i += 3) d.push(`M${n1(pts[i][0])} ${n1(pts[i][1])}L${n1(pts[n - 1 - i][0])} ${n1(pts[n - 1 - i][1])}`);
  }
  return d.length === 0 ? "" : el("path", { class: "ky-cr-aisle", d: d.join(""), "stroke-width": 1.1 });
}

const poly = (points: readonly Pt[]): string => `M${points.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L")}Z`;

/** How the crowd is drawn: the prefix of ids, the options read, the share of seats taken, the detail, and the class of the ground the stands stand on. */
export interface DrawInput {
  id: string;
  crowd: Crowd;
  density: number;
  fine: boolean;
  ground: string;
}

/** The stands and the crowd as markup and the defs it uses. The markup is laid over the ground and under the surface. */
export function drawCrowd(stands: CrowdStands, o: DrawInput): { defs: string; markup: string; over: string } {
  const { id, crowd, density, fine } = o;
  const tifo = { home: stands.sectors.some((s) => s.kind === "tifo-home"), away: stands.sectors.some((s) => s.kind === "tifo-away") };
  let body = "";
  // A ballpark's stands stand on a plaza of their own, not on the grass of the foul ground.
  if (stands.sport === "mlb") for (const ring of stands.rings) body += el("path", { class: "ky-cr-plaza", d: path(ring) });
  // A gridiron stadium's field under a soccer pitch is drawn over the pitch, faintly, so that the gap between the two is seen.
  let over = "";
  if (stands.footprint !== undefined) {
    const { field, endZones } = stands.footprint;
    over += endZones.map((z) => el("rect", { class: "ky-cr-ez", x: n1(z.x), y: n1(z.y), width: n1(z.w), height: n1(z.h) })).join("");
    const lines: string[] = [];
    for (let x = field.x + endZones[0].w; x <= field.x + field.w - endZones[1].w + 0.01; x += 15) lines.push(`M${n1(x)} ${n1(field.y)}v${n1(field.h)}`);
    over += el("path", { class: "ky-cr-yard", d: lines.join(""), "stroke-width": 0.5 });
    over += el("rect", { class: "ky-cr-yard", x: n1(field.x), y: n1(field.y), width: n1(field.w), height: n1(field.h), "stroke-width": 0.9, fill: "none", "stroke-dasharray": "5 3" });
    over = el("g", { class: "ky-cr-footprint" }, over);
  }
    for (const ring of stands.rings) {
    // The upper tiers are a little emptier: their paint is the same tile with the empty seats' bed showing through a veil.
    if (fine) body += el("path", { class: "ky-cr-people", d: path(ring), fill: `url(#${id}-cr-h)` });
    else body += el("path", { class: "ky-cr-bed", d: path(ring) }) + el("path", { class: "ky-cr-blk", d: path(ring), "fill-opacity": num(0.28 + 0.6 * density * ring.fill) });
    if (fine && ring.fill < 0.95) body += el("path", { class: "ky-cr-bed", d: path(ring), "fill-opacity": num(Math.min(0.5, (1 - ring.fill) * 1.6)) });
  }
  for (const s of stands.sectors) body += sector(s, id, fine, density);
  if (fine) for (const ring of stands.rings) body += aisles(ring);
  // Depth: the front wall of a tier throws a shade on its first rows (and the ground in front of it), the roof's edge on the last rows of the upper tier.
  if (fine) {
    for (const ring of stands.rings) {
      if (ring.hole !== null) body += el("path", { d: outlinePath(ring.hole), fill: "none", stroke: "#000", "stroke-opacity": 0.2, "stroke-width": 7 });
      if (ring.tier === "upper") body += el("path", { d: outlinePath(ring.region), fill: "none", stroke: "#000", "stroke-opacity": 0.16, "stroke-width": 18 });
    }
  }
  for (const ring of stands.rings) body += el("path", { class: "ky-cr-rim", d: path(ring), "stroke-width": 0.9 });
  for (const [x0, y0, x1, y1] of stands.covers) body += el("rect", { class: o.ground, x: n1(x0), y: n1(y0), width: n1(x1 - x0), height: n1(y1 - y0) });
  for (const g of stands.gaps) {
    const [x0, y0, x1, y1] = g.box;
    body += el("rect", { class: `ky-cr-${g.kind}`, x: n1(x0), y: n1(y0), width: n1(x1 - x0), height: n1(y1 - y0), rx: g.kind === "bench" ? 1 : undefined });
  }
  return { defs: (fine ? patterns(id, crowd, density, tifo.home || tifo.away ? tifo : undefined) : ""), markup: el("g", { class: "ky-crowd" }, body), over };
}

/** A block of visitors or a card display, a polygon over the band it is in. */
function sector(s: StandSector, id: string, fine: boolean, density: number): string {
  if (s.kind === "away") return fine ? el("path", { class: "ky-cr-people", d: poly(s.points), fill: `url(#${id}-cr-a)` }) : el("path", { class: "ky-cr-blk-a", d: poly(s.points), "fill-opacity": num(0.3 + 0.6 * density) });
  const team = s.kind === "tifo-home" ? "th" : "ta";
  return fine ? el("path", { class: "ky-cr-tifo", d: poly(s.points), fill: `url(#${id}-cr-${team})` }) : el("path", { class: s.kind === "tifo-home" ? "ky-cr-th" : "ky-cr-ta", d: poly(s.points) });
}

/** The rules of the stands and the crowd, written into a drawing that has one (and in `KYOGIJO_STYLE`, for a page that supplies the stylesheet), light and dark. */
export const KYOGIJO_CROWD_STYLE = `
:where(.kyogijo){--ky-cr-bed:#4a525d;--ky-cr-empty:#7d8794;--ky-cr-aisle:#c4cbd3;--ky-cr-rim:#1c2127;--ky-cr-dim:1}
@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){--ky-cr-bed:#242a32;--ky-cr-empty:#4a535f;--ky-cr-aisle:#7d8794;--ky-cr-rim:#07090c;--ky-cr-dim:.82}}
:where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){--ky-cr-bed:#242a32;--ky-cr-empty:#4a535f;--ky-cr-aisle:#7d8794;--ky-cr-rim:#07090c;--ky-cr-dim:.82}
.kyogijo .ky-crowd{opacity:var(--ky-cr-dim)}
.kyogijo .ky-cr-bed{fill:var(--ky-cr-bed)}
.kyogijo .ky-cr-seat{fill:none;stroke:var(--ky-cr-empty);stroke-width:1.3;stroke-opacity:.65}
.kyogijo .ky-cr-h{stroke:var(--ky-cr-home,var(--ky-right))}
.kyogijo .ky-cr-a{stroke:var(--ky-cr-away,var(--ky-left))}
.kyogijo .ky-cr-h-d{stroke:var(--ky-cr-home,var(--ky-right));stroke-opacity:.6}
.kyogijo .ky-cr-a-d{stroke:var(--ky-cr-away,var(--ky-left));stroke-opacity:.6}
.kyogijo .ky-cr-blk{fill:var(--ky-cr-home,var(--ky-right))}
.kyogijo .ky-cr-blk-a{fill:var(--ky-cr-away,var(--ky-left))}
.kyogijo .ky-cr-th{fill:var(--ky-cr-home,var(--ky-right))}
.kyogijo .ky-cr-ta{fill:var(--ky-cr-away,var(--ky-left))}
.kyogijo .ky-cr-tw{fill:#f2f0ea}
.kyogijo .ky-cr-aisle{fill:none;stroke:var(--ky-cr-aisle);stroke-opacity:.5}
.kyogijo .ky-cr-rim{fill:none;stroke:var(--ky-cr-rim);stroke-opacity:.55}
.kyogijo .ky-cr-tunnel{fill:#101317;fill-opacity:.72}
.kyogijo .ky-cr-bench{fill:#1c2127;fill-opacity:.55}
.kyogijo .ky-cr-media{fill:#1c2127;fill-opacity:.4}
.kyogijo .ky-cr-camera{fill:#1c2127;fill-opacity:.75}
.kyogijo .ky-cr-plaza{fill:var(--ky-apron);stroke:var(--ky-apron);stroke-width:16;stroke-linejoin:round}
.kyogijo .ky-cr-ez{fill:var(--ky-line);fill-opacity:.16}
.kyogijo .ky-cr-yard{stroke:var(--ky-line);stroke-opacity:.5;fill:none}`.trim();
