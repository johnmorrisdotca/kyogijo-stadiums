// The one path every logo, flag, emblem and mark takes into a drawing: an address, an image `data:` address, an SVG document as text, or, when a renderer of ready-made emblems is plugged in
// (`useEmblems`, or the `emblems` option), the id of one (`"trophy:cup"`, `"crest:shield"`, `"sport:hockey/line"`). The result is an address that may be written into an image's `href`, or `undefined`.
import { safePicture } from "./colour.ts";
import { GROUPED_ID, emblemRenderer, renderedEmblem } from "./emblems-source.ts";
import { flagDocument, flagTheme, type FlagShape } from "./flags-source.ts";

/** What a caller says about the team an emblem stands for: its colours and letters, so a crest id takes them; and the theme of the drawing it goes in. */
export interface EmblemContext {
  color?: string;
  accent?: string;
  initials?: string;
  theme?: "inherit" | "auto" | "light" | "dark";
}

let told = false;
/** Once, in development: an id with its group was given and nothing is plugged in to draw it. */
function hint(value: unknown): void {
  if (told || typeof value !== "string" || !GROUPED_ID.test(value.trim())) return;
  const process = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  if (process?.env?.NODE_ENV === "production") return;
  told = true;
  console.warn(`[kyogijo-stadiums] "${value.trim().slice(0, 40)}" is the id of an emblem, but no emblem renderer is plugged in, so it was ignored. Plug in Dougu Sports once: import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems"; useEmblems(renderEmblem); (or pass emblems: renderEmblem). See https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/emblems.html`);
}

/**
 * The SVG document for a value that names an emblem (`"trophy:cup"`, `"crest:shield"`, `"sport:nhl/line"`), or `undefined` when it does not or when no renderer is plugged in. Drawn for an image: the theme is `auto` unless
 * the context says otherwise. A crest takes the context's colours and letters.
 */
export function emblemDocument(value: unknown, context?: EmblemContext): string | undefined {
  const crest = typeof value === "string" && value.trim().startsWith("crest:");
  return renderedEmblem(value, {
    theme: context?.theme ?? "auto",
    ...(crest ? { tint: context?.color, accent: context?.accent, initials: context?.initials } : {}),
  });
}

/**
 * A logo as it may be written into an image's `href`, or `undefined`. An `https:` or `http:` address, a relative path, an image `data:` address, an SVG document as text (written as an image, which cannot
 * run scripts), or, with a renderer of emblems plugged in, the id of an emblem (`"trophy:cup"`, `"medal:gold"`, `"sport:nhl"`, `"crest:shield"`, a trophy or award by its short name such as `"cup"`, with `/line`
 * for the outline style), drawn for an image with the outline in dark or pale ink by the device's setting. The second argument gives a crest the team's colours and letters. With a renderer, a name that is
 * an emblem's id is the emblem, not a file of that name: write `./cup` for the file. Without one, an id is an address like any other, and `"trophy:cup"` is refused.
 * @example
 * ```ts
 * import { safeLogo } from "@johnmorrisdotca/kyogijo-stadiums";
 * console.log(safeLogo("https://example.com/gulls.svg"), safeLogo("javascript:alert(1)"));
 * // https://example.com/gulls.svg undefined
 * ```
 */
export function safeLogo(value: unknown, context?: EmblemContext): string | undefined {
  const emblem = emblemDocument(value, context);
  if (emblem !== undefined) return safePicture(emblem);
  const picture = safePicture(value);
  if (picture === undefined && emblemRenderer() === undefined) hint(value);
  return picture;
}

/**
 * The picture of a country's flag as it may be written into an image's `href`, or `undefined` when no renderer of flags is plugged in (`useFlags`, or the `flags` option), it has no flag for the code, or
 * `code` is not a code. `size` is the nominal width in pixels the renderer is told; `theme` is the drawing's.
 */
export function flagPicture(code: unknown, shape: FlagShape, size: number, theme?: unknown): string | undefined {
  return safePicture(flagDocument(code, { shape, size, theme: flagTheme(theme) }));
}
