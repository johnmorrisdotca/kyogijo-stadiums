import { SPORTS } from "./draw.ts";
import { mountKyogijo, type KyogijoMount } from "./mount.ts";
import type { ScoreOptions, Side, Size, Sport, StatusWord, SurfaceOptions, Team } from "./types.ts";

/** The tag of the element. */
export const KYOGIJO_TAG = "kyogijo-field";

/** The attributes the element reads. */
export const KYOGIJO_ATTRIBUTES = [
  "sport", "size", "theme", "language", "orientation", "park", "year", "detail", "margin", "stripes", "exact-lines", "uppercase",
  "pitch", "pitch-type", "half", "goals", "stripe-pattern", "corner-flags",
  "home", "away", "home-abbr", "away-abbr", "home-score", "away-score", "home-penalties", "away-penalties", "score", "home-logo", "away-logo", "home-color", "away-color",
  "status", "competition", "date", "label", "winner", "home-side", "description", "options",
] as const;

/** `3-2`, `3–2` or `3:2` as home and away. */
function parseScore(text: string | null): [string, string] | undefined {
  const match = text === null ? null : /^\s*(\w+)\s*[-–—:]\s*(\w+)\s*$/.exec(text);
  return match === null ? undefined : [match[1], match[2]];
}

const asNumber = (text: string | null): number | string | undefined => {
  if (text === null || text === "") return undefined;
  return /^-?\d+(?:\.\d+)?$/.test(text.trim()) ? Number(text) : text;
};

/** The options an element's attributes (and its `options` attribute and property) make. */
export function optionsFromAttributes(read: (name: string) => string | null, base?: Partial<ScoreOptions>): SurfaceOptions | ScoreOptions {
  let json: Partial<ScoreOptions> = {};
  const raw = read("options");
  if (raw !== null && raw.trim() !== "") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) json = parsed as Partial<ScoreOptions>;
    } catch {
      /* Text that is not JSON is ignored. */
    }
  }
  const merged: Partial<ScoreOptions> = { ...base, ...json };
  const sport = read("sport") ?? merged.sport;
  const o: Record<string, unknown> = { ...merged, sport: (SPORTS as readonly string[]).includes(String(sport)) ? (sport as Sport) : "nhl" };
  const text = (name: string, key = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())): void => {
    const value = read(name);
    if (value !== null && value !== "") o[key] = value;
  };
  text("theme"); text("language"); text("orientation"); text("park"); text("detail"); text("pitch"); text("pitch-type"); text("half"); text("goals"); text("stripe-pattern"); text("competition"); text("date"); text("label"); text("winner"); text("description");
  const size = read("size");
  if (size !== null) o.size = size as Size;
  const status = read("status");
  if (status !== null && status !== "") o.status = status as StatusWord;
  const side = read("home-side");
  if (side === "left" || side === "right") o.homeSide = side as Side;
  const year = read("year");
  if (year !== null && /^\d{4}$/.test(year.trim())) o.year = Number(year);
  const margin = read("margin");
  if (margin !== null && margin !== "") o.margin = Number(margin);
  if (read("stripes") === "false") o.stripes = false;
  if (read("exact-lines") !== null) o.exactLines = read("exact-lines") !== "false";
  if (read("uppercase") === "false") o.uppercase = false;
  if (read("corner-flags") !== null) o.cornerFlags = read("corner-flags") !== "false";
  const scores = parseScore(read("score"));
  const team = (role: "home" | "away", given: Team | undefined): Team | undefined => {
    const name = read(role) ?? given?.name;
    if (name === null || name === undefined) return given;
    const out: Team = { ...given, name };
    const abbr = read(`${role}-abbr`);
    if (abbr !== null) out.abbr = abbr;
    const score = asNumber(read(`${role}-score`)) ?? asNumber(scores === undefined ? null : scores[role === "home" ? 0 : 1]);
    if (score !== undefined) out.score = score;
    const penalties = asNumber(read(`${role}-penalties`));
    if (penalties !== undefined) out.penalties = penalties;
    const logo = read(`${role}-logo`);
    if (logo !== null) out.logo = logo;
    const color = read(`${role}-color`);
    if (color !== null) out.color = color;
    return out;
  };
  const home = team("home", merged.home);
  const away = team("away", merged.away);
  if (home !== undefined) o.home = home;
  if (away !== undefined) o.away = away;
  if (home === undefined || away === undefined) {
    delete o.home;
    delete o.away;
  }
  o.parts = true;
  return o as unknown as SurfaceOptions | ScoreOptions;
}

/**
 * `<kyogijo-field>`: a surface, or a score on one, as a standard custom element. The drawing is in an open shadow root,
 * its parts named (`svg`, `surface`, `plate`, `team`, `home`, `away`, `score`, `home-score`, `away-score`, `badge`), so that a page
 * styles them with `kyogijo-field::part(plate)` and sets the colours with custom properties (`--ky-left`, `--ky-plate`, ...)
 * on the element. With `orientation="auto"` it lies tall or wide with its box.
 */
// Importing the module in a server or a test with no DOM must not fail: the class stands on an empty base there.
const Base: typeof HTMLElement = typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

export class KyogijoField extends Base {
  static observedAttributes = KYOGIJO_ATTRIBUTES;
  #mount: KyogijoMount | undefined;
  #host: HTMLElement | undefined;
  #options: Partial<ScoreOptions> | undefined;
  #theme: MutationObserver | undefined;

  /** The options given as a property: an object, laid under the attributes. */
  get options(): Partial<ScoreOptions> | undefined {
    return this.#options;
  }

  set options(value: Partial<ScoreOptions> | undefined) {
    this.#options = value;
    this.#draw();
  }

  connectedCallback(): void {
    if (this.#host === undefined) {
      const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>:host{display:block;contain:content}:host([hidden]){display:none}.f{display:block;width:100%}</style><div class="f" part="figure"></div>`;
      this.#host = root.querySelector<HTMLElement>(".f") ?? undefined;
    }
    // A page that sets data-theme on its root sets the theme of every drawing in a shadow root too.
    this.#theme = new MutationObserver(() => this.#draw());
    this.#theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    this.#draw();
  }

  disconnectedCallback(): void {
    this.#theme?.disconnect();
    this.#mount?.destroy();
    this.#mount = undefined;
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.#draw();
  }

  #draw(): void {
    if (this.#host === undefined || !this.isConnected) return;
    const options = optionsFromAttributes((name) => this.getAttribute(name), this.#options);
    const page = document.documentElement.getAttribute("data-theme");
    if (options.theme === undefined && (page === "light" || page === "dark")) options.theme = page;
    if (this.#mount === undefined) this.#mount = mountKyogijo(this.#host, options);
    else this.#mount.update(options);
  }
}

/** Register `<kyogijo-field>` (or the tag you give), once. Returns the class. */
export function defineKyogijoField(tag: string = KYOGIJO_TAG): typeof KyogijoField {
  if (typeof customElements !== "undefined" && customElements.get(tag) === undefined) customElements.define(tag, KyogijoField);
  return KyogijoField;
}
