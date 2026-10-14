// Where kyogijo gets ready-made emblems from: a renderer that the page plugs in, so that kyogijo bundles no art and keeps zero dependencies. The renderer is
// `renderEmblem` of @johnmorrisdotca/dougu-sports (or any function with its shape); `useEmblems(renderEmblem)` plugs it in for the page, `emblems: renderEmblem` for one drawing.
// This module knows nothing of any emblem: it only decides whether a string might be an emblem's id, asks the renderer, and keeps what the renderer gives back.

/** The styles an emblem is drawn in: full colour with metallic gradients, one outline in the page's ink, or flat fills. */
export type EmblemStyleName = "metal" | "line" | "color";

/** What kyogijo asks of a renderer. It is a subset of dougu-sports' `EmblemOptions`. */
export interface EmblemDrawOptions {
  style?: EmblemStyleName;
  /** The colour of the emblem's main part: a crest takes the team's colour. */
  tint?: string;
  /** A second colour: a crest's band. */
  accent?: string;
  /** The letters of a crest, up to three. */
  initials?: string;
  /** `inherit`, `auto` (by the device's setting), `light` or `dark`. */
  theme?: "inherit" | "auto" | "light" | "dark";
  size?: number;
}

/**
 * A function that draws an emblem from its id as a document of SVG, and throws for an id it does not know: `renderEmblem` of `@johnmorrisdotca/dougu-sports/emblems` is one.
 * The id may end in `/metal`, `/line` or `/color`, and the renderer reads that suffix.
 */
export type EmblemRenderer = (id: string, options?: EmblemDrawOptions) => string;

// `IsAny`: the type of an import that did not resolve is `any`, which is turned into `string` here.
type Known<T> = 0 extends 1 & T ? string : T;
// A block comment, so that the declaration file keeps it: where the package is not installed the import is `any` and says nothing.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/** @ts-ignore optional: resolves only where @johnmorrisdotca/dougu-sports is installed; elsewhere it is `any`, which `Known` turns into `string`. */
type DouguId = import("@johnmorrisdotca/dougu-sports/emblems").EmblemId;

/**
 * The ids of dougu-sports' emblems (`"trophy:cup"`, `"crest:shield"`), when that package is installed, so that an editor completes them; any other string otherwise. An id may end in `/metal`, `/line` or `/color`,
 * and a trophy or an award may be written without its group (`"cup"`). Nothing is imported at run time.
 */
export type EmblemId = Known<DouguId>;
/** An emblem as a logo, a mark or a pageant's emblem is given: its id, with or without a style, or any string (an address, a data address or an SVG document). */
export type EmblemRef = EmblemId | `${EmblemId}/${EmblemStyleName}` | (string & {});

let plugged: EmblemRenderer | undefined;
let scoped: EmblemRenderer | undefined;

/**
 * Plug a renderer of ready-made emblems into kyogijo, for every drawing on the page: after this `logo: "crest:shield"` and `emblem: "trophy:hockey-cup"` are drawn. Call it once, at start-up. Without one, an id is
 * an address and is refused. `useEmblems(undefined)` unplugs it.
 * @example
 * ```ts
 * import { useEmblems } from "@johnmorrisdotca/kyogijo-stadiums";
 * import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";
 * useEmblems(renderEmblem);
 * ```
 */
export function useEmblems(render: EmblemRenderer | undefined): void {
  plugged = typeof render === "function" ? render : undefined;
}

/** Run a drawing with a renderer for that drawing alone (the `emblems` option), putting back whatever was there. Without a renderer it runs as it is. */
export function withEmblems<T>(render: EmblemRenderer | undefined, draw: () => T): T {
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
export function emblemRenderer(): EmblemRenderer | undefined {
  return scoped ?? plugged;
}

/** The look of an id: lower-case words, optionally `group:name`, optionally a style. An address, a path with a dot or a slash, a data address or an SVG document never has it. */
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*(?::[a-z0-9]+(?:-[a-z0-9]+)*)?(?:\/(?:metal|line|color))?$/;
/** An id with its group, which no address has in practice: what a missing renderer is told about. */
export const GROUPED_ID = /^(?:trophy|medal|award|crest|sport|ball|gear):[a-z0-9]+(?:-[a-z0-9]+)*(?:\/(?:metal|line|color))?$/;

/** The SVG document for a value that names an emblem, drawn by the renderer in use, or `undefined` (no renderer, not the look of an id, or an id the renderer does not know). */
export function renderedEmblem(value: unknown, options?: EmblemDrawOptions): string | undefined {
  const render = emblemRenderer();
  if (render === undefined || typeof value !== "string") return undefined;
  const text = value.trim();
  if (text.length > 60 || !ID.test(text)) return undefined;
  let svg: unknown;
  try {
    svg = render(text, options);
  } catch {
    return undefined;
  }
  return typeof svg === "string" && /^\s*(?:<\?xml|<svg)\b/i.test(svg) ? svg : undefined;
}
