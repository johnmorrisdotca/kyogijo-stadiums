// The width, the dashes and the opacity of a surface's painted lines (`lineWidth`, `lineDash`, `lineOpacity`): the lines are written by the surface at the
// widths its rules give, and these options are laid over what it wrote, element by element, by class. The marks that are fixtures (the posts, the rims, the
// nets, the fence) and the filled marks (the plates, the bases, the hog lines) keep their size; a line that is dashed by its rules keeps its own dashes.
import { num } from "./format.ts";
import { FEET_PER, isUnit, type Unit } from "./units.ts";
import type { LineDash, LineWidth, SurfaceOptions } from "./types.ts";

/** The classes that are painted lines: they take a width, a dash and an opacity. */
const LINES: ReadonlySet<string> = new Set(["ky-line", "ky-red", "ky-blue", "ky-band", "ky-crease"]);
/** The dashes in the centre line of a rink are lines too, but they are dashes already. */
const WIDTH: ReadonlySet<string> = new Set([...LINES, "ky-dash"]);
/** The classes of marks painted as a fill, which take an opacity. */
const FILLS: ReadonlySet<string> = new Set(["ky-fill-line", "ky-red-fill", "ky-blue-fill", "ky-num"]);

/** What the options ask of the lines, in the units of the markup they are applied to. */
export interface LineLook {
  scale: number;
  dash: readonly number[] | undefined;
  opacity: number | undefined;
}

/** How wide the surface's ordinary line is drawn, in the units of its markup, and how many feet one of them is (`Surface.lineRef`). */
export interface LineRef {
  width: number;
  feet: number;
}

const finitePositive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/**
 * The look of the lines the options ask for, or `undefined` when they ask for none of it. A width is a multiple of the width the lines are drawn at (`2`,
 * `{ scale: 2 }`) or an absolute width in `units` (`{ width: 0.5 }`), turned into a multiple here; a value that cannot be read is left out, as the other options'
 * are, so that a page's markup cannot break a drawing.
 */
export function lineLook(o: Pick<SurfaceOptions, "lineWidth" | "lineDash" | "lineOpacity">, ref: LineRef | undefined, unit: Unit): LineLook | undefined {
  if (ref === undefined) return undefined;
  const width: LineWidth | undefined = o.lineWidth;
  let scale = 1;
  if (finitePositive(width)) scale = width;
  else if (typeof width === "object" && width !== null && "scale" in width && finitePositive(width.scale)) scale = width.scale;
  else if (typeof width === "object" && width !== null && "width" in width && finitePositive(width.width) && isUnit(unit)) scale = (width.width * FEET_PER[unit]) / ref.feet / ref.width;
  scale = Math.min(Math.max(scale, 0.05), 40);
  const drawn = ref.width * scale;
  const dashed: LineDash | undefined = o.lineDash;
  let dash: number[] | undefined;
  if (dashed === "dashed") dash = [6 * drawn, 4 * drawn];
  else if (dashed === "dotted") dash = [drawn, 2 * drawn];
  else if (dashed === "dash-dot") dash = [6 * drawn, 3 * drawn, drawn, 3 * drawn];
  else if (Array.isArray(dashed) && dashed.length > 0 && dashed.every(finitePositive) && isUnit(unit)) dash = dashed.map((length) => (length * FEET_PER[unit]) / ref.feet);
  const opacity = typeof o.lineOpacity === "number" && Number.isFinite(o.lineOpacity) && o.lineOpacity < 1 ? Math.max(0, o.lineOpacity) : undefined;
  if (scale === 1 && dash === undefined && opacity === undefined) return undefined;
  return { scale, dash, opacity };
}

const SHAPE = /<(path|rect|circle|ellipse|line|text)\b([^>]*?)(\/?)>/g;

/** The markup of a surface's lines with the look applied. */
export function restyleLines(markup: string, look: LineLook): string {
  return markup.replace(SHAPE, (whole, tag: string, attrs: string, close: string) => {
    const cls = /\sclass="([^"]*)"/.exec(attrs)?.[1].split(/\s+/) ?? [];
    const line = cls.some((c) => LINES.has(c));
    const filled = cls.some((c) => FILLS.has(c));
    const wide = cls.some((c) => WIDTH.has(c));
    if (!line && !filled && !wide) return whole;
    let out = attrs;
    if (wide && look.scale !== 1) out = out.replace(/(\sstroke-width=")([^"]*)(")/, (_m, a: string, v: string, b: string) => `${a}${num(Number(v) * look.scale)}${b}`);
    let extra = "";
    if (line && look.dash !== undefined && !/\sstroke-dasharray=/.test(out)) extra += ` stroke-dasharray="${look.dash.map(num).join(" ")}"`;
    if (look.opacity !== undefined) {
      if (line || cls.includes("ky-dash")) extra += ` stroke-opacity="${num(look.opacity)}"`;
      else if (filled) extra += ` fill-opacity="${num(look.opacity)}"`;
    }
    return `<${tag}${out}${extra}${close}>`;
  });
}
