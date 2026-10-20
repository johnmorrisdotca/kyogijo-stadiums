// The fly-through as markup: the stage with its three layers (the map, the site plan, the 3D arena), the pin, the scale bar and the caption, then the controls, the credit and a live region. Pure: strings in,
// a string out, so that it can be made on a server and tested in Node; `flythrough.dom.ts` makes it move. Nothing here is stretched: the layers are pictures, and every word is plain HTML over them, at a fixed size.
import type { StageId } from "./flythrough.path.ts";
import { FLYTHROUGH_STYLE } from "./flythrough.style.ts";
import { FLYTHROUGH_WORDS, say, type FlythroughWords } from "./flythrough.words.ts";
import { esc } from "./format.ts";
import type { Language } from "./types.ts";

/**
 * A map drawn by chizu as a layer: its opening tag is rewritten so that it fills its box whatever the box's shape (`preserveAspectRatio="none"`: the layer is given a viewBox that is true to the ground, and the
 * box a square), is hidden from a screen reader (the stage says what it shows) and keeps its own `viewBox` to start from. The rest, the style and the shapes, is left as drawn. A map with text in it would be
 * stretched with it, so the text is taken out: the stage's words are HTML.
 */
export function mapMarkup(svg: string): string {
  const open = /^<svg\b[^>]*>/.exec(svg.trim());
  if (open === null) throw new Error("a map must be an SVG");
  const viewBox = /\sviewBox="([^"]*)"/.exec(open[0])?.[1];
  if (viewBox === undefined) throw new Error("a map must have a viewBox");
  const rest = svg.trim().slice(open[0].length).replace(/<text\b[\s\S]*?<\/text>/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" class="chizu" viewBox="${esc(viewBox)}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${rest}`;
}

/**
 * The map to start from when none is given: the sea and a graticule (a line for every five degrees of longitude and of latitude) round the arena, in metres from it, on the plane that is true to the ground
 * there. It shows where on the earth the camera is and how far it has come, and nothing more.
 */
export function graticuleMarkup(lat: number, reach = 70): { svg: string; width: number } {
  const mx = (111195 * Math.cos((lat * Math.PI) / 180)) * 1;
  const my = 111195;
  const half = reach * mx;
  const tall = reach * my;
  const lines: string[] = [];
  for (let d = -reach; d <= reach; d += 5) {
    lines.push(`M${(d * mx).toFixed(0)} ${(-tall).toFixed(0)}V${tall.toFixed(0)}`);
    lines.push(`M${(-half).toFixed(0)} ${(d * my).toFixed(0)}H${half.toFixed(0)}`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="chizu" viewBox="${(-half).toFixed(0)} ${(-tall).toFixed(0)} ${(2 * half).toFixed(0)} ${(2 * tall).toFixed(0)}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect x="${(-half).toFixed(0)}" y="${(-tall).toFixed(0)}" width="${(2 * half).toFixed(0)}" height="${(2 * tall).toFixed(0)}" fill="var(--kf-sea)"/><path d="${lines.join("")}" fill="none" stroke="var(--kf-grid)" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
  return { svg, width: 2 * half };
}

/** The lines of the site's grid as a path, in pixels: vertical and horizontal lines `spacing` apart through `(x, y)`, reaching `reach` pixels from it. Drawn in a group turned about `(x, y)`. */
export function gridPath(x: number, y: number, spacing: number, reach: number): string {
  if (!(spacing >= 4)) return "";
  const k = Math.ceil(reach / spacing);
  const out: string[] = [];
  for (let i = -k; i <= k; i += 1) {
    out.push(`M${(x + i * spacing).toFixed(1)} ${(y - reach).toFixed(1)}V${(y + reach).toFixed(1)}`);
    out.push(`M${(x - reach).toFixed(1)} ${(y + i * spacing).toFixed(1)}H${(x + reach).toFixed(1)}`);
  }
  return out.join("");
}

/** What the markup is made from. */
export interface MarkupInput {
  id: string;
  language: Language;
  theme?: "light" | "dark";
  /** The arena's name, and where it is (`Anaheim, United States`), in the page's language. */
  arena: string;
  place: string;
  /** The stages flown, in order. */
  stages: readonly StageId[];
  /** The drawn map (already through `mapMarkup`), and whether it is chizu's (so that the credit names it). */
  map: string;
  mapCredit: boolean;
  /** The inside of the site plan's svg, drawn by the mount once it knows the sizes. */
  plan?: string;
  controls?: boolean;
}

/** The words of a language for the stage names: a stage's name and what is said of it. */
export const stageWords = (language: Language, stage: StageId, values: { arena: string; place: string }): { name: string; text: string } => {
  const words = FLYTHROUGH_WORDS[language].stage[stage];
  return { name: words.name, text: say(words.text, values) };
};

/** The controls under the stage: back, play, next and a button for each stage. */
export function controlsMarkup(words: FlythroughWords, stages: readonly StageId[], current: StageId, playing: boolean): string {
  const chips = stages.map((id, i) => `<li><button type="button" data-stage="${id}" aria-keyshortcuts="${i + 1}"${id === current ? ' aria-current="step"' : ""}>${i + 1}. ${esc(words.stage[id].name)}</button></li>`).join("");
  return (
    `<div class="kf-controls">` +
    `<button type="button" data-act="back" aria-keyshortcuts="ArrowLeft">◀ ${esc(words.back)}</button>` +
    `<button type="button" data-act="play" data-wide aria-pressed="${playing}" aria-keyshortcuts="Space"><span data-glyph aria-hidden="true">${playing ? "❚❚" : "▶"}</span> <span data-word>${esc(playing ? words.pause : words.play)}</span></button>` +
    `<button type="button" data-act="next" aria-keyshortcuts="ArrowRight">${esc(words.next)} ▶</button>` +
    `<ol class="kf-group" role="group" aria-label="${esc(words.stages)}">${chips}</ol>` +
    `</div>`
  );
}

/** The whole fly-through as markup. */
export function flythroughMarkup(input: MarkupInput): string {
  const words = FLYTHROUGH_WORDS[input.language];
  const values = { arena: input.arena, place: input.place };
  const first = input.stages[0];
  const intro = stageWords(input.language, first, values);
  const label = say(words.title, values);
  return (
    `<div class="kf" id="${esc(input.id)}" lang="${input.language}" data-stage="${first}"${input.theme === undefined ? "" : ` data-theme="${input.theme}"`}>` +
    `<style>${FLYTHROUGH_STYLE}</style>` +
    `<div class="kf-stage" tabindex="0" role="group" aria-roledescription="${esc(words.region)}" aria-label="${esc(label)}" aria-describedby="${esc(input.id)}-about ${esc(input.id)}-help">` +
    `<div class="kf-layer kf-map" aria-hidden="true"><div class="kf-map-box">${input.map}</div></div>` +
    `<svg class="kf-layer kf-site kyogijo ky-nhl" data-sport="nhl" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"${input.theme === undefined ? "" : ` data-theme="${input.theme}"`}><path class="kf-grid" d=""/><g class="kf-plan">${input.plan ?? ""}</g></svg>` +
    `<div class="kf-layer kf-3d" inert></div>` +
    `<div class="kf-pin" aria-hidden="true"></div>` +
    `<div class="kf-scale" aria-hidden="true"><span class="kf-scale-bar"></span><span class="kf-scale-text"></span></div>` +
    `<div class="kf-caption" aria-hidden="true"><span class="kf-title">${esc(intro.name)}</span><span class="kf-text">${esc(intro.text)}</span></div>` +
    `</div>` +
    `<p class="kf-help" id="${esc(input.id)}-help">${esc(words.keys)}</p>` +
    `<p class="kf-help" id="${esc(input.id)}-about" hidden>${esc(say(words.about, values))}</p>` +
    (input.controls === false ? "" : controlsMarkup(words, input.stages, first, false)) +
    `<p class="kf-credit">${esc(input.mapCredit ? words.creditMap : words.creditPlain)}</p>` +
    `<div class="kf-live" role="status" aria-live="polite"></div>` +
    `</div>`
  );
}
