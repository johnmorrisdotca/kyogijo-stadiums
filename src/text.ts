// Measuring and fitting text without a browser. Widths are estimates for a bold sans-serif face, a little generous so
// that a name stays inside its place whichever font the page falls back to.

const NARROW = new Set("iIjl!|.,:;'`");
const WIDE = new Set("MWmw@%");

/** An estimate of the width of a string, in ems. Characters of Japanese and other full-width scripts are one em. */
export function textWidth(text: string, bold = true): number {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x2e80) width += 1.02;
    else if (ch === " ") width += 0.3;
    else if (NARROW.has(ch)) width += 0.34;
    else if (WIDE.has(ch)) width += 0.92;
    else if (ch >= "0" && ch <= "9") width += 0.62;
    else if (ch >= "A" && ch <= "Z") width += 0.7;
    else if (ch === "-" || ch === "–" || ch === "—") width += 0.45;
    else width += 0.58;
  }
  return bold ? width * 1.04 : width;
}

/** The text in capitals when it has Latin letters; any other text is left as it is. */
export function capitals(text: string): string {
  return /[a-z]/i.test(text) ? text.toLocaleUpperCase("en") : text;
}

/**
 * A short form of a name: its initials when it has several words, else its first letters. Japanese names give their first two or three characters.
 *
 * This is a guess at a label, not a code. For a national team it is often not the code the sport uses: "Spain" gives SPA, where FIFA's
 * three-letter code is ESP ("Germany" gives GER, which happens to match; "Netherlands" gives NET, FIFA's is NED). Pass each team's `abbr` yourself
 * (the FIFA, World Rugby or ICC code your data carries); the package bundles no table of country codes.
 */
export function abbreviate(name: string): string {
  const clean = name.trim();
  if (clean.length === 0) return "";
  // Japanese: the first two characters of a name with kanji (読売), the first three of one in kana alone (メトロ).
  if (/[\u2e80-\u9fff\uff00-\uffef]/.test(clean)) return [...clean].slice(0, /[\u3400-\u9fff]/.test(clean) ? 2 : 3).join("");
  const words = clean.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word));
  if (words.length >= 2) return words.slice(0, 3).map((word) => word[0]).join("").toLocaleUpperCase("en");
  return clean.slice(0, 3).toLocaleUpperCase("en");
}

/** The ways a name splits into two lines at a space, each as [first, second]. */
function splits(name: string): [string, string][] {
  const words = name.split(" ");
  const out: [string, string][] = [];
  for (let i = 1; i < words.length; i += 1) out.push([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
  return out;
}

/** The lines a name is set in, the font size that fits them, and the width of the widest. */
export interface FittedLines {
  lines: string[];
  size: number;
  width: number;
  height: number;
}

/** The line height as a multiple of the font size. */
export const LINE_HEIGHT = 1.1;

/**
 * Set a name in the biggest size that fits a box, on one line or, at a space, on two.
 * @example
 * ```ts
 * import { fitLines } from "@johnmorrisdotca/kyogijo";
 * console.log(fitLines("GOLDEN STATE WARRIORS", 40, 12, 8).lines);
 * // [ 'GOLDEN STATE', 'WARRIORS' ]
 * ```
 */
export function fitLines(name: string, maxWidth: number, maxHeight: number, maxSize: number): FittedLines {
  const one = (): FittedLines => {
    const w = textWidth(name);
    const size = Math.max(0.1, Math.min(maxSize, maxHeight / LINE_HEIGHT, w === 0 ? maxSize : maxWidth / w));
    return { lines: [name], size, width: w * size, height: size * LINE_HEIGHT };
  };
  const single = one();
  let two: FittedLines | undefined;
  for (const [a, b] of splits(name)) {
    const w = Math.max(textWidth(a), textWidth(b));
    const size = Math.max(0.1, Math.min(maxSize, maxHeight / (2 * LINE_HEIGHT), w === 0 ? maxSize : maxWidth / w));
    if (two === undefined || size > two.size) two = { lines: [a, b], size, width: w * size, height: 2 * size * LINE_HEIGHT };
  }
  // Two lines are worth it only when they are clearly bigger than one.
  const best = two !== undefined && two.size > single.size * 1.18 ? two : single;
  return best;
}
