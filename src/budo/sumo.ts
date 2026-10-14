// A sumo dohyō: the clay square of 6.7 m, the circle of 4.55 m made of 20 tawara (4 tokudawara among them), the band of sand outside it (the jano-me), the two shikiri-sen at the centre and, if asked,
// the four tassels of the roof in the colours of the four quarters, from the Japan Sumo Association's Sumo Rules (Dohyō Regulations, Article 1) and its quizzes. In metres, the origin at the top left of
// the clay square, north at the top (the shōmen). Nothing here draws SVG.
import type { SumoFigures } from "../leagues/budo.ts";
import { annulusD, discArea, rectArea, tapeBar, within } from "./kit.ts";
import { emptyParts, grow, type MBox, type MMark, type Parts } from "./parts.ts";
import { num } from "../format.ts";

/** What a sumo plan is. */
export interface SumoLayout {
  parts: Parts;
  /** The clay square: the playing surface. */
  platform: MBox;
  extent: MBox;
  centre: [number, number];
  /** The circle: the radius of its inside, the wrestlers' ring, and of the outer edge of the tawara. */
  ring: number;
  outer: number;
  /** The centres of the 20 tawara, as angles in degrees (0 east, growing clockwise as the eye sees it), the tokudawara at 0, 90, 180 and 270. */
  bales: { angle: number; tokuda: boolean }[];
  /** The length of a tawara along the circle. */
  baleLength: number;
  height: number;
  marks: MMark[];
  ranges: Record<string, MBox>;
}

/** The height of the clay square the options ask for, held to 34 cm to 60 cm. */
export const dohyoHeight = (asked: number | undefined, fig: SumoFigures): number => (asked === undefined ? fig.height.drawn : within(asked, fig.height.min, fig.height.max, "The dohyō's height", "the Sumo Rules (Dohyō Regulations, Article 1)"));

const rd = (v: number): number => Math.round(v * 1000) / 1000;

/** The plan of the dohyō the options ask for. */
export function sumoParts(fig: SumoFigures, o: { height: number; tawara: boolean; tassels: boolean }): SumoLayout {
  const side = fig.platform;
  const c = side / 2;
  const platform: MBox = { x0: 0, y0: 0, x1: side, y1: side };
  const inner = fig.circle / 2;
  const wb = fig.bale.width;
  const rb = inner + wb / 2;
  const outer = inner + wb;
  const parts = emptyParts();
  parts.areas.push(rectArea("platform", "clay", "ky-bud-clay", platform));
  // The ring's inside is the same clay. The band of sand lies just outside the tawara.
  if (o.tawara) parts.areas.push({ id: "jano-me", feature: "jano-me", cls: "ky-bud-sand", d: annulusD(c, c, outer, outer + fig.jano), evenodd: true });
  // The 20 tawara are 4 tokudawara and 4 between each of them: one every 18 degrees, laid along the circle; a tokudawara stands a little way out.
  const n = fig.tawara.count;
  const step = 360 / n;
  const bales: SumoLayout["bales"] = [];
  const baleLength = ((2 * Math.PI * rb) / n) * 0.96;
  const perQuarter = fig.tawara.between + 1;
  const polys: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const tokuda = i % perQuarter === 0;
    const angle = i * step;
    bales.push({ angle, tokuda });
    const t = (angle * Math.PI) / 180;
    const R = rb + (tokuda ? fig.bale.out : 0);
    const px = c + R * Math.cos(t);
    const py = c + R * Math.sin(t);
    const tx = -Math.sin(t);
    const ty = Math.cos(t);
    const nx = Math.cos(t);
    const ny = Math.sin(t);
    const hl = baleLength / 2;
    const hw = wb / 2;
    const corners = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(([a, b]) => [rd(px + a * tx + b * nx), rd(py + a * ty + b * ny)]);
    polys.push(`M${corners.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z`);
  }
  if (o.tawara) {
    parts.areas.push({ id: "tawara", feature: "tawara", cls: "ky-bud-tawara", d: polys.join("") });
    // The shikiri-sen, two white lines across the line between the wrestlers, 70 cm apart, 90 cm long and 6 cm wide.
    const s = fig.shikiri;
    for (const [k, dx] of [["east", 1], ["west", -1]] as const) {
      const x = c + dx * (s.apart / 2 + s.width / 2);
      parts.shapes.push(tapeBar(`shikiri-${k}`, "shikiri-sen", "ky-bud-white-fill", { x0: x - s.width / 2, y0: c - s.length / 2, x1: x + s.width / 2, y1: c + s.length / 2 }));
    }
  }
  // The four tassels, in the colours of the quarters: green east, red south, white west, black north.
  if (o.tassels) {
    const at = 0.22;
    parts.areas.push(discArea("tassel-east", "tassels", "ky-bud-tassel-e", side - at, c, 0.12), discArea("tassel-south", "tassels", "ky-bud-tassel-s", c, side - at, 0.12), discArea("tassel-west", "tassels", "ky-bud-tassel-w", at, c, 0.12), discArea("tassel-north", "tassels", "ky-bud-tassel-n", c, at, 0.12));
  }
  const reach = outer + fig.bale.out;
  const ranges: Record<string, MBox> = { ring: { x0: c - reach - 0.3, y0: c - reach - 0.3, x1: c + reach + 0.3, y1: c + reach + 0.3 }, start: { x0: c - 1.2, y0: c - 0.9, x1: c + 1.2, y1: c + 0.9 } };
  const marks: MMark[] = [
    { id: "dohyo", x: side * 0.1, y: side * 0.12, side: "top" },
    { id: "ring", x: c - 0.9, y: c - inner * 0.62, side: "top" },
    { id: "tawara", x: c + rb * Math.cos((1.5 * step * Math.PI) / 180), y: c - rb * Math.sin((1.5 * step * Math.PI) / 180) * -1, side: "bottom" },
    { id: "tokudawara", x: c + rb + fig.bale.out, y: c, side: "bottom" },
    { id: "shikiri-sen", x: c - fig.shikiri.apart / 2 - fig.shikiri.width / 2, y: c + fig.shikiri.length / 2, side: "bottom" },
  ];
  if (o.tawara) marks.push({ id: "jano-me", x: c - (outer + fig.jano / 2) * Math.SQRT1_2, y: c - (outer + fig.jano / 2) * Math.SQRT1_2, side: "top" });
  return { parts, platform, extent: grow(platform, 0.5), centre: [c, c], ring: inner, outer, bales, baleLength, height: o.height, marks, ranges };
}
