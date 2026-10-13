import { inkOn, safeColour, safeLogo } from "./colour.ts";
import { el, esc, hash, num } from "./format.ts";
import { FOOTBALL } from "./geometry.ts";
import { fenceFor, parkById } from "./parks.ts";
import { badgeMarkup, bannerMarkup, plateMarkup, stateOf, type TeamView } from "./score.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import { baseball } from "./surfaces/baseball.ts";
import { basketball } from "./surfaces/basketball.ts";
import { football } from "./surfaces/football.ts";
import { hockey } from "./surfaces/hockey.ts";
import type { BuildOptions, Surface } from "./surfaces/surface.ts";
import { abbreviate, capitals } from "./text.ts";
import type { Colors, CourtStyle, Language, ScoreOptions, Side, Sport, SurfaceOptions, Team } from "./types.ts";
import { VERSION } from "./version.ts";

/** The sports that can be drawn, in the order a menu lists them. */
export const SPORTS: readonly Sport[] = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb"];

/** The CSS custom property each colour of `Colors` sets. */
export const COLOR_PROPERTIES: Readonly<Record<keyof Colors, string>> = {
  apron: "--ky-apron",
  surface: "--ky-surface",
  surfaceAlt: "--ky-surface-alt",
  line: "--ky-line",
  blue: "--ky-blue",
  red: "--ky-red",
  boards: "--ky-boards",
  zone: "--ky-zone",
  dirt: "--ky-dirt",
  foul: "--ky-foul",
  ink: "--ky-ink",
  halo: "--ky-halo",
  plate: "--ky-plate",
  plateInk: "--ky-plate-ink",
};

const COURT_PROPERTIES: Readonly<Record<string, string>> = {
  wood: "--ky-surface",
  woodAlt: "--ky-surface-alt",
  apron: "--ky-apron",
  border: "--ky-boards",
  key: "--ky-key",
  keyLeft: "--ky-key-left",
  keyRight: "--ky-key-right",
  line: "--ky-line",
  centreCircle: "--ky-centre",
  baselineInk: "--ky-baseline",
};

const isScore = (o: SurfaceOptions | ScoreOptions): o is ScoreOptions => (o as Partial<ScoreOptions>).home !== undefined && (o as Partial<ScoreOptions>).away !== undefined;

/** The standard statuses, spelled out. */
const FINAL = /^(?:final|f\b|ft\b|試合終了|終了)/i;

/** The words of a status in a language: a standard one is translated, any other text is kept as it is. */
export function statusLabel(status: string | undefined, language: Language = "en"): string | undefined {
  if (status === undefined || status.trim() === "") return undefined;
  const key = status.trim().toLowerCase().replace(/[\s/]+/g, "-");
  const words = KYOGIJO_STRINGS[language].status;
  return Object.prototype.hasOwnProperty.call(words, key) ? words[key as keyof typeof words] : status.trim();
}

const numeric = (value: number | string | undefined): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && /^\s*-?\d+(?:\.\d+)?\s*$/.test(value)) return Number(value);
  return undefined;
};

/**
 * Who is ahead in a score drawing, as the drawing's emphasis. `auto` (the default) picks the leader once the status is
 * a final one; `leader` picks the leader of any game; a level game, or a score that is not a number, has none.
 */
export function winnerOf(o: Pick<ScoreOptions, "home" | "away" | "status" | "winner">): "home" | "away" | "none" {
  const mode = o.winner ?? "auto";
  if (mode === "home" || mode === "away" || mode === "none") return mode;
  const h = numeric(o.home.score);
  const a = numeric(o.away.score);
  if (h === undefined || a === undefined || h === a) return "none";
  if (mode === "auto" && !(o.status !== undefined && FINAL.test(o.status.trim()))) return "none";
  return h > a ? "home" : "away";
}

const safeClass = (text: string | undefined): string => (text ?? "").replace(/[^\w -]/g, "").trim();
const safeLength = (value: number | string | undefined): string | undefined => {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? num(value) : undefined;
  return typeof value === "string" && /^\d+(?:\.\d+)?(?:px|%|em|rem|vw|vh)?$/.test(value.trim()) ? value.trim() : undefined;
};

function buildSurface(o: SurfaceOptions, portrait: boolean, id: string, score: boolean): Surface {
  const court: CourtStyle | undefined = o.court;
  const baselineText: [string, string] | undefined = court?.baselineText === undefined ? undefined : typeof court.baselineText === "string" ? [court.baselineText, court.baselineText] : court.baselineText;
  const common: BuildOptions = {
    portrait,
    margin: typeof o.margin === "number" && Number.isFinite(o.margin) && o.margin >= 0 ? o.margin : undefined,
    exact: o.exactLines === true,
    detail: o.detail === "simple" ? "simple" : "full",
    stripes: o.stripes !== false,
    id,
    score,
    court: { baselineText, centreLogo: safeLogo(court?.centreLogo), paintThreePoint: court?.paintThreePoint },
  };
  switch (o.sport) {
    case "nfl":
    case "cfl":
    case "ifaf":
      return football(FOOTBALL[o.sport], common);
    case "nhl":
      return hockey(common);
    case "nba":
      return basketball(common);
    case "mlb":
      return baseball(fenceFor(parkById(o.park), o.fence), common);
    default:
      throw new Error(`Unknown sport "${String(o.sport)}": use one of ${SPORTS.join(", ")}`);
  }
}

/** The custom properties a drawing sets on its root, from the options' colours. */
function colourStyle(o: SurfaceOptions, teams: { left?: Team; right?: Team }): string {
  const props: string[] = [];
  const set = (name: string, value: unknown): void => {
    const colour = safeColour(value);
    if (colour !== undefined) props.push(`${name}:${colour}`);
  };
  for (const [key, property] of Object.entries(COLOR_PROPERTIES)) set(property, o.colors?.[key as keyof Colors]);
  if (o.court !== undefined) for (const [key, property] of Object.entries(COURT_PROPERTIES)) set(property, (o.court as Record<string, unknown>)[key]);
  const left = safeColour(teams.left?.color) ?? safeColour(o.leftColor);
  const right = safeColour(teams.right?.color) ?? safeColour(o.rightColor);
  if (left !== undefined) props.push(`--ky-left:${left}`);
  if (right !== undefined) props.push(`--ky-right:${right}`);
  const leftInk = safeColour(teams.left?.textColor) ?? (left === undefined ? undefined : inkOn(left));
  const rightInk = safeColour(teams.right?.textColor) ?? (right === undefined ? undefined : inkOn(right));
  if (leftInk !== undefined) props.push(`--ky-left-ink:${leftInk}`);
  if (rightInk !== undefined) props.push(`--ky-right-ink:${rightInk}`);
  return props.join(";");
}

function teamView(team: Team, side: Side, role: "home" | "away", winner: "home" | "away" | "none", uppercase: boolean): TeamView {
  const name = String(team.name ?? "");
  const score = team.score === undefined || team.score === null || String(team.score).trim() === "" ? "–" : String(team.score);
  return {
    side,
    role,
    name: uppercase ? capitals(name) : name,
    abbr: (team.abbr !== undefined && team.abbr.trim() !== "" ? team.abbr.trim() : abbreviate(name)).slice(0, 5),
    score,
    logo: safeLogo(team.logo),
    state: stateOf(winner, role),
  };
}

/** A drawing's title and description, in a language. */
export function describe(o: SurfaceOptions | ScoreOptions): { title: string; description: string } {
  const language: Language = o.language === "ja" ? "ja" : "en";
  const words = KYOGIJO_STRINGS[language];
  const park = o.sport === "mlb" ? parkById(o.park) : undefined;
  const parkName = park === undefined ? undefined : language === "ja" ? (park.nameJa ?? park.name) : park.name;
  const surfaceName = parkName === undefined ? words.surface[o.sport] : language === "ja" ? `${parkName}のグラウンド` : `${parkName}, baseball field`;
  const { stop, colon, gap } = words.said;
  const sentence = (text: string): string => (/[.。]$/.test(text) ? text : `${text}${stop}`);
  const about = `${words.said.on}${colon}${words.about[o.sport]}${stop}`;
  const parkLine = parkName === undefined ? "" : `${gap}${fill(words.said.park, { park: parkName })}`;
  if (!isScore(o)) return { title: o.title ?? surfaceName, description: o.description ?? `${about}${parkLine}` };
  const winner = winnerOf(o);
  const s = (t: Team): string => (t.score === undefined || String(t.score) === "" ? "–" : String(t.score));
  const line = fill(words.scoreTitle, { away: o.away.name, awayScore: s(o.away), home: o.home.name, homeScore: s(o.home) });
  const status = statusLabel(o.status, language);
  const extra = [o.competition, status, o.date].filter((part): part is string => part !== undefined && part !== "").join(words.said.sep);
  const result = winner === "none" ? "" : `${gap}${fill(words.said.won, { name: winner === "home" ? o.home.name : o.away.name })}`;
  const tied = winner === "none" && numeric(o.home.score) !== undefined && numeric(o.home.score) === numeric(o.away.score) ? `${gap}${words.said.tied}` : "";
  return {
    title: o.title ?? (status === undefined ? line : `${line}${words.said.sep}${status}`),
    description: o.description ?? `${extra === "" ? "" : `${sentence(extra)}${gap}`}${sentence(line)}${result}${tied}${gap}${about}${parkLine}`.trim(),
  };
}

/** True when a drawing with these options lies in portrait. */
export function isPortrait(o: Pick<SurfaceOptions, "orientation" | "aspect">): boolean {
  if (o.orientation === "portrait") return true;
  return o.orientation === "auto" && typeof o.aspect === "number" && Number.isFinite(o.aspect) && o.aspect > 0 && o.aspect < 1;
}

/**
 * Draw a surface, or a score on a surface, as an SVG string. With `home` and `away` it is a score; without them, the
 * bare surface. The same options always give the same string.
 * @example
 * ```ts
 * import { drawKyogijo } from "@johnmorrisdotca/kyogijo";
 * const svg = drawKyogijo({
 *   sport: "nhl",
 *   away: { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" },
 *   home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" },
 *   status: "final-ot",
 * });
 * console.log(svg.startsWith("<svg"), svg.includes("Harbour City Gulls"));
 * // true true
 * ```
 */
export function drawKyogijo(o: SurfaceOptions | ScoreOptions): string {
  const language: Language = o.language === "ja" ? "ja" : "en";
  const portrait = isPortrait(o);
  const sized = isScore(o) ? (o.size === "compact" || o.size === "badge" ? o.size : "full") : "full";
  const id = safeClass(o.id).replace(/ /g, "-") || `ky-${hash(JSON.stringify([o, VERSION]))}`;
  const parts = o.parts === true;
  const homeSide: Side = isScore(o) && o.homeSide === "left" ? "left" : "right";
  const awaySide: Side = homeSide === "left" ? "right" : "left";
  const uppercase = !isScore(o) || o.uppercase !== false;

  let left: TeamView | undefined;
  let right: TeamView | undefined;
  let leftTeam: Team | undefined;
  let rightTeam: Team | undefined;
  let winner: "home" | "away" | "none" = "none";
  let status: string | undefined;
  if (isScore(o)) {
    winner = winnerOf(o);
    status = statusLabel(o.status, language);
    const home = teamView(o.home, homeSide, "home", winner, uppercase);
    const away = teamView(o.away, awaySide, "away", winner, uppercase);
    left = homeSide === "left" ? home : away;
    right = homeSide === "left" ? away : home;
    leftTeam = homeSide === "left" ? o.home : o.away;
    rightTeam = homeSide === "left" ? o.away : o.home;
  }
  const { title, description } = describe(o);
  const titleId = `${id}-t`;
  const descId = `${id}-d`;
  const style = colourStyle(o, { left: leftTeam, right: rightTeam });
  const theme = o.theme === "light" || o.theme === "dark" ? o.theme : undefined;

  let viewBox: string;
  let body: string;
  let defs = "";
  if (isScore(o) && left !== undefined && right !== undefined && sized === "badge") {
    const badge = badgeMarkup(left, right, { sport: o.sport, status, parts });
    viewBox = `0 0 ${badge.w} ${badge.h}`;
    body = badge.markup;
  } else {
    const surface = buildSurface(o, portrait, id, isScore(o) && sized === "full");
    defs = surface.defs;
    let inner = surface.base;
    let teams = "";
    if (isScore(o) && left !== undefined && right !== undefined && sized === "full") {
      const onColour = o.sport === "nfl" || o.sport === "cfl" || o.sport === "ifaf";
      teams += bannerMarkup(surface.left, left, { turned: surface.turned, onColour, parts });
      teams += bannerMarkup(surface.right, right, { turned: surface.turned, onColour, parts });
    }
    // The teams are painted under the lines, unless the surface asks for them over (a panel that must hide them).
    inner += surface.bannersOver === true ? surface.lines + teams : teams + surface.lines;
    if (isScore(o) && left !== undefined && right !== undefined && sized === "full") {
      const foot = o.label !== undefined && o.label !== "" ? o.label : [status, o.date].filter((part): part is string => part !== undefined && part !== "").join(" · ");
      inner += plateMarkup(surface.plate, left, right, { competition: o.competition, foot: foot === "" ? undefined : foot }, { turned: surface.turned, parts, surfaceSport: o.sport });
    }
    const group = el("g", { class: "ky-surface-group", transform: surface.turn, part: parts ? "surface" : undefined }, inner);
    const v = surface.view;
    if (isScore(o) && left !== undefined && right !== undefined && sized === "compact") {
      const badge = badgeMarkup(left, right, { sport: o.sport, status, parts });
      const scale = v.w / badge.w;
      const gap = badge.h * scale * 0.12;
      body = group + el("g", { class: "ky-strip", transform: `translate(${num(v.x)} ${num(v.y + v.h + gap)}) scale(${scale.toFixed(4)})` }, badge.markup);
      viewBox = `${num(v.x)} ${num(v.y)} ${num(v.w)} ${num(v.h + gap + badge.h * scale)}`;
    } else {
      body = group;
      viewBox = `${num(v.x)} ${num(v.y)} ${num(v.w)} ${num(v.h)}`;
    }
  }

  const root = el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo ky-${o.sport}${safeClass(o.className) === "" ? "" : ` ${safeClass(o.className)}`}`,
      viewBox,
      role: "img",
      "aria-labelledby": `${titleId} ${descId}`,
      "data-sport": o.sport,
      "data-size": sized,
      "data-orientation": portrait ? "portrait" : "landscape",
      "data-theme": theme,
      "data-winner": isScore(o) ? winner : undefined,
      "data-version": VERSION,
      width: safeLength(o.width),
      height: safeLength(o.height),
      part: parts ? "svg" : undefined,
      style: style === "" ? undefined : style,
    },
    `<title id="${titleId}">${esc(title)}</title><desc id="${descId}">${esc(description)}</desc>` +
      (o.style === "none" ? "" : `<style>${KYOGIJO_STYLE}</style>`) +
      (defs === "" ? "" : `<defs>${defs}</defs>`) +
      body,
  );
  return root;
}

/** Draw a bare surface. The same as `drawKyogijo` without teams. */
export function drawSurface(options: SurfaceOptions): string {
  const { ...rest } = options as SurfaceOptions & Partial<ScoreOptions>;
  delete rest.home;
  delete rest.away;
  return drawKyogijo(rest);
}

/** Draw a score on a surface. */
export function drawScore(options: ScoreOptions): string {
  return drawKyogijo(options);
}

/** Draw a score as one compact strip, for a list. The same as `drawScore` with `size: "badge"`. */
export function drawBadge(options: ScoreOptions): string {
  return drawKyogijo({ ...options, size: "badge" });
}
