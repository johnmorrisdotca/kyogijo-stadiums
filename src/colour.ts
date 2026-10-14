const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTION = /^(?:rgb|hsl)a?\(\s*[-+0-9.%\s,/]+(?:deg|turn|rad)?[-+0-9.%\s,/]*\)$/i;
const VARIABLE = /^var\(\s*--[a-z0-9_-]+\s*\)$/i;
const NAME = /^[a-z]{3,24}$/i;

/**
 * The colour as it may be written into a style attribute, or `undefined`. A hex colour, `rgb()`, `rgba()`, `hsl()`,
 * `hsla()`, a colour name or `var(--name)` is drawn; anything else is ignored, so nothing from a form or an address
 * can end the attribute or add a rule.
 * @example
 * ```ts
 * import { safeColour } from "@johnmorrisdotca/kyogijo-stadiums";
 * console.log(safeColour("#1f5fa8"), safeColour("red;fill:url(x)"));
 * // #1f5fa8 undefined
 * ```
 */
export function safeColour(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length === 0 || text.length > 64) return undefined;
  if (HEX.test(text) || FUNCTION.test(text) || VARIABLE.test(text) || NAME.test(text)) return text;
  return undefined;
}

const NAMED: Record<string, [number, number, number]> = {
  white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0], green: [0, 128, 0], blue: [0, 0, 255], yellow: [255, 255, 0], orange: [255, 165, 0],
  gold: [255, 215, 0], navy: [0, 0, 128], maroon: [128, 0, 0], purple: [128, 0, 128], teal: [0, 128, 128], gray: [128, 128, 128], grey: [128, 128, 128],
  silver: [192, 192, 192], crimson: [220, 20, 60], royalblue: [65, 105, 225], darkgreen: [0, 100, 0], lightblue: [173, 216, 230], pink: [255, 192, 203],
};

/** The red, green and blue of a colour, when it can be read without a browser (a hex colour, `rgb()` or a common name). */
export function rgbOf(value: string | undefined): [number, number, number] | undefined {
  if (value === undefined) return undefined;
  const text = value.trim().toLowerCase();
  const named = NAMED[text];
  if (named !== undefined) return named;
  const hex = /^#([0-9a-f]{3,8})$/.exec(text)?.[1];
  if (hex !== undefined) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex;
    if (full.length < 6) return undefined;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
  }
  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/.exec(text);
  if (rgb !== null) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return undefined;
}

/** The relative luminance of a colour, 0 (black) to 1 (white). */
export function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or near-black, whichever reads better on the colour. White when the colour cannot be read. */
export function inkOn(color: string | undefined): string {
  const rgb = rgbOf(color);
  if (rgb === undefined) return "#ffffff";
  return luminance(rgb) > 0.4 ? "#161a18" : "#ffffff";
}

/**
 * A logo's address as it may be written into an image's `href`, or `undefined`. An `https:` or `http:` address, a
 * relative path, an image `data:` address, or an SVG document as text (written as an image, which cannot run scripts).
 * @example
 * ```ts
 * import { safeLogo } from "@johnmorrisdotca/kyogijo-stadiums";
 * console.log(safeLogo("https://example.com/gulls.svg"), safeLogo("javascript:alert(1)"));
 * // https://example.com/gulls.svg undefined
 * ```
 */
export function safeLogo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length === 0) return undefined;
  if (/^(?:<\?xml|<svg)\b/i.test(text)) {
    if (text.length > 200_000) return undefined;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
  }
  if (text.length > 300_000) return undefined;
  if (/^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(text)) return text;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(text)) return text;
  // A relative path has no scheme: no colon before the first slash.
  if (/^[^\s"'<>:]*(?:\/[^\s"'<>]*)?$/.test(text) && !/^[a-z][a-z0-9+.-]*:/i.test(text) && !text.startsWith("//")) return text;
  return undefined;
}
