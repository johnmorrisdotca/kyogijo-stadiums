// Lane numbers painted on a track, as paths: a stencil face of our own, with no font and no file. A digit stands in a box 0.62 wide and 1 high (scaled by the figure's height `h`) and is a few thick
// strokes with the gaps (bridges) a stencil has, so that it reads at a glance from far off. Written for this package; no typeface was used or looked at.
/** A number to four places: a figure under a metre tall needs more than the drawing's two. */
const num = (value: number): string => {
  const rounded = Math.round(value * 10000) / 10000;
  return Object.is(rounded, -0) || rounded === 0 ? "0" : String(rounded);
};

/** The width of a digit over its height, and the gap between two digits over the height. */
export const DIGIT_WIDTH = 0.62;
export const DIGIT_GAP = 0.14;
/** The thickness of a stroke over the height. */
export const STROKE = 0.18;

// A stroke is a path of the pen's centre line in the box: `M x y`, `L x y` and `A rx ry sweep x y` (an arc of less than a half turn). The ends are butt, so a gap is a gap.
const xl = 0.09;
const xr = 0.53;
const xm = 0.31;
const yt = 0.09;
const yb = 0.91;

/** A closed ellipse as two half turns, with no bridge: the loops of a 6, an 8 and a 9. */
function loop(xc: number, yc: number, a: number, b: number): string {
  const f = (n: number): string => String(Math.round(n * 1000) / 1000);
  return `M${f(xc - a)} ${f(yc)}A${f(a)} ${f(b)} 0 0 1 ${f(xc + a)} ${f(yc)}A${f(a)} ${f(b)} 0 0 1 ${f(xc - a)} ${f(yc)}`;
}

const SIX = [`M0.5 ${yt}H0.31A0.22 0.2 0 0 0 ${xl} 0.29V0.68`, loop(xm, 0.68, 0.22, 0.23)];

/** A glyph turned half a turn about the middle of its box: a 6 is a 9. */
const turned = (strokes: readonly string[]): string[] =>
  strokes.map((d) =>
    d.replace(/([MLHVA])([^MLHVA]*)/g, (_m, cmd: string, rest: string) => {
      const v = rest.trim().split(/[\s,]+/).filter((t) => t !== "").map(Number);
      const f = (n: number): string => String(Math.round(n * 1000) / 1000);
      switch (cmd) {
        case "M":
        case "L":
          return `${cmd}${f(DIGIT_WIDTH - v[0])} ${f(1 - v[1])}`;
        case "H":
          return `H${f(DIGIT_WIDTH - v[0])}`;
        case "V":
          return `V${f(1 - v[0])}`;
        default:
          return `A${v[0]} ${v[1]} 0 ${v[3]} ${v[4]} ${f(DIGIT_WIDTH - v[5])} ${f(1 - v[6])}`;
      }
    }),
  );

const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  "0": [`M0.27 ${yt}A0.18 0.22 0 0 0 ${xl} 0.31V0.69A0.18 0.22 0 0 0 0.27 ${yb}`, `M0.35 ${yt}A0.18 0.22 0 0 1 ${xr} 0.31V0.69A0.18 0.22 0 0 1 0.35 ${yb}`],
  "1": [`M0.15 0.3L${xm} ${yt}V${yb}`],
  "2": [`M${xl} 0.29A0.22 0.2 0 0 1 ${xr} 0.29L${xl} ${yb}H${xr}`],
  "3": [`M${xl} ${yt}H0.30A0.23 0.19 0 0 1 0.30 0.455H0.2`, `M0.2 0.545H0.30A0.23 0.19 0 0 1 0.30 ${yb}H${xl}`],
  "4": [`M0.4 ${yb}V${yt}L${xl} 0.65H0.55`],
  "5": [`M${xr} ${yt}H${xl}V0.4`, `M0.19 0.45H0.30A0.23 0.23 0 0 1 0.30 ${yb}H${xl}`],
  "6": SIX,
  "7": [`M${xl} ${yt}H${xr}`, `M${xr} 0.18L0.26 ${yb}`],
  "8": [loop(xm, 0.285, 0.2, 0.195), loop(xm, 0.715, 0.22, 0.195)],
  "9": turned(SIX),
};

/** The width of a string of digits at the height `h`. */
export const digitsWidth = (text: string, h: number): number => (text.length * DIGIT_WIDTH + Math.max(0, text.length - 1) * DIGIT_GAP) * h;

const scalePath = (d: string, h: number, ox: number, oy: number): string =>
  d.replace(/([MLHVA])([^MLHVA]*)/g, (_m, cmd: string, rest: string) => {
    const v = rest.trim().split(/[\s,]+/).filter((s) => s !== "").map(Number);
    switch (cmd) {
      case "M":
      case "L":
        return `${cmd}${num(ox + v[0] * h)} ${num(oy + v[1] * h)}`;
      case "H":
        return `H${num(ox + v[0] * h)}`;
      case "V":
        return `V${num(oy + v[0] * h)}`;
      default:
        return `A${num(v[0] * h)} ${num(v[1] * h)} 0 ${v[3]} ${v[4]} ${num(ox + v[5] * h)} ${num(oy + v[6] * h)}`;
    }
  });

/**
 * A string of digits as one path of strokes, centred on `(cx, cy)`, `h` tall, upright. `stroke-width` is `strokeWidth(h)`. Characters that are not digits are left out.
 */
export function digitsD(text: string, h: number, cx: number, cy: number): string {
  const digits = [...text].filter((c) => Object.prototype.hasOwnProperty.call(GLYPHS, c));
  const width = digitsWidth(digits.join(""), h);
  let x = cx - width / 2;
  const top = cy - h / 2;
  let out = "";
  for (const c of digits) {
    out += GLYPHS[c].map((d) => scalePath(d, h, x, top)).join("");
    x += (DIGIT_WIDTH + DIGIT_GAP) * h;
  }
  return out;
}

/** The thickness of a stroke at the height `h`. */
export const strokeWidth = (h: number): number => STROKE * h;
