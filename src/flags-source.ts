// Where kyogijo gets country flags from: a renderer that the page plugs in, so that kyogijo bundles no flag and keeps zero dependencies. The renderer is a synchronous function from a
// country code and a request to an SVG string; `@johnmorrisdotca/hata` draws the flags, and its `flag()` is asynchronous, so a page loads the codes it needs first and plugs in a lookup
// (docs/flags.md). `useFlags(render)` plugs it in for the page, `flags: render` for one drawing. The shape of the renderer is the one Taisen Brackets takes, so one adapter serves both.
// This module knows nothing of any flag: it asks the renderer, checks what it gives back, and returns an SVG document or nothing.

/** How a flag is framed: `round` for a circle, `square` as wide as it is tall, `rect` in its own proportions. */
export type FlagShape = "round" | "square" | "rect";

/** What a drawing asks a `flags` renderer for. */
export interface FlagRequest {
  shape: FlagShape;
  /** The width in pixels the flag is drawn at, nominally (a drawing scales, so this is the size of a typical use): the diameter of a round flag. */
  size: number;
  /** `light` or `dark` for a drawing in that look, else `inherit`. */
  theme: "inherit" | "light" | "dark";
}

/**
 * A function from a country code and a request to an SVG string, or `null` or `undefined` for a code it has no flag for. It must be synchronous: a drawing is a pure function of its
 * options. `@johnmorrisdotca/hata`'s `flag()` is asynchronous, so load the flags first (`await flag(code, { shape: "round" })` for each code) and pass a lookup.
 */
export type FlagRenderer = (code: string, request: FlagRequest) => string | null | undefined;

let plugged: FlagRenderer | undefined;
let scoped: FlagRenderer | undefined;

/**
 * Plug a renderer of country flags into kyogijo, for every drawing on the page: after this a team's `flag: "CA"` is drawn. Call it once, at start-up. Without one a team's `flag` is
 * ignored and its `logo` (or its initials) is drawn. `useFlags(undefined)` unplugs it.
 * @example
 * ```ts
 * import { useFlags } from "@johnmorrisdotca/kyogijo-stadiums";
 * const loaded = { round: { CA: "<svg viewBox='0 0 1 1'>...</svg>" } } as Record<string, Record<string, string>>;
 * useFlags((code, { shape }) => loaded[shape]?.[code.toUpperCase()]);
 * ```
 */
export function useFlags(render: FlagRenderer | undefined): void {
  plugged = typeof render === "function" ? render : undefined;
}

/** Run a drawing with a renderer for that drawing alone (the `flags` option), putting back whatever was there. Without a renderer it runs as it is. */
export function withFlags<T>(render: FlagRenderer | undefined, draw: () => T): T {
  if (typeof render !== "function") return draw();
  const before = scoped;
  scoped = render;
  try {
    return draw();
  } finally {
    scoped = before;
  }
}

/** The renderer in use: the drawing's own, else the page's, else none. */
export function flagRenderer(): FlagRenderer | undefined {
  return scoped ?? plugged;
}

/** The look of a country or region code: letters and digits in one or two parts (`CA`, `usa`, `GB-ENG`, `JP-13`). */
const CODE = /^[A-Za-z0-9]{2,8}(?:-[A-Za-z0-9]{1,8})?$/;

/**
 * The flag of a country code as an SVG document, drawn by the renderer in use, or `undefined`: no renderer, a value that does not look like a code, a code the renderer has no flag for,
 * a renderer that throws, or one that returns something that is not an `<svg>`. It never throws.
 */
export function flagDocument(code: unknown, request: FlagRequest): string | undefined {
  const render = flagRenderer();
  if (render === undefined || typeof code !== "string") return undefined;
  const text = code.trim();
  if (!CODE.test(text)) return undefined;
  let svg: unknown;
  try {
    svg = render(text, { shape: request.shape, size: Math.round(request.size), theme: request.theme });
  } catch {
    return undefined;
  }
  return typeof svg === "string" && /^\s*(?:<\?xml|<svg)\b/i.test(svg) ? svg : undefined;
}

/** The theme a drawing tells a renderer: `light` or `dark` when the options say so, else `inherit`. */
export const flagTheme = (theme: unknown): FlagRequest["theme"] => (theme === "light" || theme === "dark" ? theme : "inherit");
