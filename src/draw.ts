import { inkOn, safeColour, safeLogo } from "./colour.ts";
import { drawingId, feetFence, isPortrait, lengthUnit, safeClass } from "./common.ts";
import { el, esc, num } from "./format.ts";
import { ERA_SPORTS, footballIn, rulesFor, seasonLabel, type EraSport } from "./eras.ts";
import { FOOTBALL } from "./geometry.ts";
import { renderLayers } from "./layers.ts";
import { groundById, groundNameIn } from "./grounds.ts";
import { chooseLeague, courtOf, diamondOf, fieldOf, hasHistory, leagueSeason, rinkOf, type League } from "./leagues.ts";
import { diamondFence } from "./leagues/baseball.ts";
import { fenceFor, parkById } from "./parks.ts";
import { badgeMarkup, bannerMarkup, plateMarkup, stateOf, type TeamView } from "./score.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.ts";
import { KYOGIJO_BASE_STYLE } from "./style.ts";
import { convertLength, type Unit } from "./units.ts";
import { baseball } from "./surfaces/baseball.ts";
import { basketball } from "./surfaces/basketball.ts";
import { football } from "./surfaces/football.ts";
import { hockey } from "./surfaces/hockey.ts";
import { soccer } from "./surfaces/soccer.ts";
import { frameMatrix, layoutFromFrame, resolveFrame } from "./surfaces/soccer-providers.ts";
import { layoutOf, soccerSpec, type SoccerPitchId, type SoccerSize, type SoccerSpec } from "./surfaces/soccer-spec.ts";
import type { BuildOptions, Surface } from "./surfaces/surface.ts";
import { abbreviate, capitals } from "./text.ts";
import type { Colors, CourtStyle, GoalStyle, Language, ScoreOptions, Side, Sport, StripePattern, SurfaceOptions, Team } from "./types.ts";
import { VERSION } from "./version.ts";

export { isPortrait };

/** The sports that can be drawn, in the order a menu lists them. */
export const SPORTS: readonly Sport[] = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "soccer"];

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
  layer: "--ky-layer",
  layerHome: "--ky-layer-home",
  layerAway: "--ky-layer-away",
  layerEdge: "--ky-layer-edge",
  layerHollow: "--ky-layer-hollow",
  layerInk: "--ky-layer-ink",
  layerHalo: "--ky-layer-halo",
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

/** The penalty shoot-out of a game, when both teams have a score in it. */
function shootout(o: Pick<ScoreOptions, "home" | "away">): { home: number; away: number } | undefined {
  const home = numeric(o.home.penalties);
  const away = numeric(o.away.penalties);
  return home === undefined || away === undefined ? undefined : { home, away };
}

/**
 * Who is ahead in a score drawing, as the drawing's emphasis. `auto` (the default) picks the leader once the status is
 * a final one; `leader` picks the leader of any game; a level game has none unless both teams have a penalty shoot-out
 * score (`penalties`) and the shoot-out was not level; a score that is not a number has none.
 */
export function winnerOf(o: Pick<ScoreOptions, "home" | "away" | "status" | "winner">): "home" | "away" | "none" {
  const mode = o.winner ?? "auto";
  if (mode === "home" || mode === "away" || mode === "none") return mode;
  const h = numeric(o.home.score);
  const a = numeric(o.away.score);
  if (h === undefined || a === undefined) return "none";
  if (mode === "auto" && !(o.status !== undefined && FINAL.test(o.status.trim()))) return "none";
  if (h === a) {
    const pens = shootout(o);
    return pens === undefined || pens.home === pens.away ? "none" : pens.home > pens.away ? "home" : "away";
  }
  return h > a ? "home" : "away";
}

/**
 * The words of a status, with the penalty shoot-out beside them when both teams have one: "Final/AET", or
 * "Final · 4-2 pens" (the shoot-out score in the order of the drawing's sides, the away team's first unless `homeSide` is left).
 */
export function statusText(o: Pick<ScoreOptions, "home" | "away" | "status" | "homeSide">, language: Language = "en"): string | undefined {
  const label = statusLabel(o.status, language);
  const pens = shootout(o);
  if (pens === undefined) return label;
  const left = o.homeSide === "left" ? pens.home : pens.away;
  const right = o.homeSide === "left" ? pens.away : pens.home;
  const text = fill(KYOGIJO_STRINGS[language].said.pens, { a: left, b: right });
  const base = (o.status ?? "").trim().toLowerCase() === "final-pens" ? statusLabel("final", language) : label;
  return base === undefined ? text : `${base} · ${text}`;
}

const safeLength = (value: number | string | undefined): string | undefined => {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? num(value) : undefined;
  return typeof value === "string" && /^\d+(?:\.\d+)?(?:px|%|em|rem|vw|vh)?$/.test(value.trim()) ? value.trim() : undefined;
};

const PATTERNS: readonly StripePattern[] = ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal", "none"];
const GOALS: readonly GoalStyle[] = ["box", "line", "strip", "none"];

/** The pitch the options ask for: a `pitch` of the caller's, else the size a `ground` publishes, else none (the international pitch). */
function pitchOf(o: SurfaceOptions): SoccerPitchId | SoccerSize | undefined {
  if (o.pitch !== undefined) return o.pitch;
  const ground = groundById(o.ground);
  return ground === undefined || ground.pitchSize === "default" ? undefined : { ...ground.pitch, unit: "m" };
}

function buildSoccer(o: SurfaceOptions, common: BuildOptions, scored: boolean, unit: Unit): Surface {
  const spec: SoccerSpec = soccerSpec(pitchOf(o), o.units === undefined ? "m" : unit);
  const frame = resolveFrame(o.pitchType, spec);
  // A provider's own lines stand where it puts them, on a full pitch only: a small-sided pitch and futsal keep the markings of their own rules.
  const own = frame !== undefined && spec.format === "11";
  const detail = common.detail;
  return soccer(
    {
      spec,
      layout: own ? layoutFromFrame(frame, spec) : layoutOf(spec),
      half: !scored && (o.half === "left" || o.half === "right") ? o.half : undefined,
      pattern: PATTERNS.includes(o.stripePattern as StripePattern) ? (o.stripePattern as StripePattern) : "bands",
      goals: GOALS.includes(o.goals as GoalStyle) ? (o.goals as GoalStyle) : "box",
      flags: typeof o.cornerFlags === "boolean" ? o.cornerFlags : detail === "full",
      frame: frame === undefined ? undefined : { id: frame.id, matrix: frameMatrix(frame, spec) },
    },
    common,
  );
}

function buildSurface(o: SurfaceOptions, portrait: boolean, id: string, score: boolean, scored: boolean): Surface {
  const court: CourtStyle | undefined = o.court;
  const baselineText: [string, string] | undefined = court?.baselineText === undefined ? undefined : typeof court.baselineText === "string" ? [court.baselineText, court.baselineText] : court.baselineText;
  const unit: Unit = lengthUnit(o);
  const common: BuildOptions = {
    portrait,
    margin: typeof o.margin === "number" && Number.isFinite(o.margin) && o.margin >= 0 ? convertLength(o.margin, unit, "ft") : undefined,
    exact: o.exactLines === true,
    detail: o.detail === "simple" ? "simple" : "full",
    stripes: o.stripes !== false,
    id,
    score,
    court: { baselineText, centreLogo: safeLogo(court?.centreLogo), paintThreePoint: court?.paintThreePoint },
  };
  // A league's rulebook (`league`), else the markings of the season asked for (`year`), today's without one.
  const { sport, league } = chooseLeague(o);
  switch (sport) {
    case "nfl":
    case "cfl":
    case "ifaf": {
      if (league?.family === "football") return football({ ...fieldOf(league, o.year), id: sport }, common, { hashMarks: true, postShape: "slingshot" });
      if (sport === "ifaf") return football(FOOTBALL.ifaf, common);
      const season = rulesFor(sport, o.year).rules;
      return football(footballIn(sport, o.year), common, { hashMarks: season.hash !== null, postShape: season.postShape });
    }
    case "nhl":
      return league?.family === "hockey" ? hockey(common, undefined, rinkOf(league, o.year)) : hockey(common, rulesFor("nhl", o.year).rules);
    case "nba":
      return league?.family === "basketball" ? basketball(common, undefined, courtOf(league, o.year)) : basketball(common, rulesFor("nba", o.year).rules);
    case "mlb": {
      if (league?.family === "baseball") {
        const diamond = diamondOf(league, o.year);
        return baseball(fenceFor(parkById(o.park), feetFence(o.fence, unit), o.year, diamondFence(diamond)), common, undefined, diamond);
      }
      return baseball(fenceFor(parkById(o.park), feetFence(o.fence, unit), o.year), common, rulesFor("mlb", o.year).rules);
    }
    case "soccer":
      return buildSoccer(o, common, scored, unit);
    default:
      throw new Error(`Unknown sport "${String(o.sport)}": use one of ${SPORTS.join(", ")}`);
  }
}

/** The custom properties a drawing sets on its root, from the options' colours. */
function colourStyle(o: SurfaceOptions, teams: { left?: Team; right?: Team; home?: Team; away?: Team }): string {
  const props: string[] = [];
  const set = (name: string, value: unknown): void => {
    const colour = safeColour(value);
    if (colour !== undefined) props.push(`${name}:${colour}`);
  };
  for (const [key, property] of Object.entries(COLOR_PROPERTIES)) set(property, o.colors?.[key as keyof Colors]);
  if (o.court !== undefined) for (const [key, property] of Object.entries(COURT_PROPERTIES)) set(property, (o.court as Record<string, unknown>)[key]);
  // A data layer's team marks take the teams' own colours, unless the colours say otherwise.
  const homeMarks = o.layers === undefined || o.layers.length === 0 ? undefined : safeColour(teams.home?.color);
  const awayMarks = o.layers === undefined || o.layers.length === 0 ? undefined : safeColour(teams.away?.color);
  if (homeMarks !== undefined && safeColour(o.colors?.layerHome) === undefined) props.push(`--ky-layer-home:${homeMarks}`);
  if (awayMarks !== undefined && safeColour(o.colors?.layerAway) === undefined) props.push(`--ky-layer-away:${awayMarks}`);
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

const trimmed = (value: number): string => String(Math.round(value * 100) / 100);

/** What a league's surface is, in a sentence fragment: its size or its bases, from the league's own figures in the unit its rulebook uses. */
function leagueAbout(league: League, year: number | undefined, language: Language): string {
  const words = KYOGIJO_STRINGS[language].league;
  if (league.family === "baseball") {
    const diamond = diamondOf(league, year);
    return fill(league.game === "softball" ? words.softball : words.baseball, { base: trimmed(diamond.base), pitch: trimmed(diamond.pitcher) });
  }
  const size =
    league.family === "basketball"
      ? courtOf(league, year)
      : league.family === "hockey"
        ? rinkOf(league, year)
        : (() => {
            const field = fieldOf(league, year);
            return { length: field.length + 2 * field.endZone, width: field.width };
          })();
  const to = league.unit;
  const text = fill(words.size, { length: trimmed(convertLength(size.length, "ft", to)), width: trimmed(convertLength(size.width, "ft", to)), unit: words.units[to === "m" || to === "yd" ? to : "ft"] });
  return fill(words[league.family], { size: text });
}

/** A drawing's title and description, in a language. */
export function describe(o: SurfaceOptions | ScoreOptions): { title: string; description: string } {
  const language: Language = o.language === "ja" ? "ja" : "en";
  const words = KYOGIJO_STRINGS[language];
  const { sport, league } = chooseLeague(o);
  const park = sport === "mlb" ? parkById(o.park) : undefined;
  const parkName = park === undefined ? undefined : language === "ja" ? (park.nameJa ?? park.name) : park.name;
  const pitch = sport === "soccer" ? soccerSpec(pitchOf(o)) : undefined;
  // A ground names a full-size pitch; a small-sided pitch or futsal court the caller asked for keeps its own name.
  const ground = pitch?.format === "11" ? groundById(o.ground) : undefined;
  const groundName = ground === undefined ? undefined : groundNameIn(ground, o.year, language);
  // A league other than the sport's own is named by its rulebook's, and its description is made from its figures.
  const surfaceName = groundName !== undefined ? (language === "ja" ? `${groundName}のピッチ` : `${groundName}, soccer pitch`) : league !== undefined && parkName === undefined ? league.name[language] : parkName === undefined ? (pitch?.format === "futsal" ? words.soccer.futsal : words.surface[sport]) : language === "ja" ? `${parkName}のグラウンド` : `${parkName}, baseball field`;
  const { stop, colon, gap } = words.said;
  const sentence = (text: string): string => (/[.。]$/.test(text) ? text : `${text}${stop}`);
  const metres = (value: number): string => String(Math.round(value * 10) / 10);
  const aboutText = league !== undefined ? leagueAbout(league, o.year, language) : pitch === undefined ? words.about[sport] : fill(pitch.format === "futsal" ? words.soccer.aboutFutsal : words.about.soccer, { length: metres(pitch.length), width: metres(pitch.width) });
  const about = `${words.said.on}${colon}${aboutText}${stop}`;
  const halfLine = pitch !== undefined && !isScore(o) && (o.half === "left" || o.half === "right") ? `${gap}${words.soccer.half}` : "";
  // What the ground says about the size: that it is the published one, or that the ground has none and the international pitch is drawn.
  const groundLine = ground === undefined || groundName === undefined || o.pitch !== undefined ? "" : `${gap}${fill(ground.pitchSize === "published" ? words.said.ground : words.said.groundDefault, { ground: groundName })}`;
  const parkLine = parkName === undefined ? `${groundLine}${halfLine}` : `${gap}${fill(words.said.park, { park: parkName })}`;
  // A drawing of a past season says which: the markings are those of that season.
  const dated = typeof o.year === "number" && Number.isFinite(o.year);
  const eraLine =
    dated && league !== undefined
      ? hasHistory(league)
        ? `${gap}${fill(words.said.era, { season: leagueSeason(league.family, o.year as number) })}`
        : ""
      : dated && ERA_SPORTS.includes(sport as EraSport)
        ? `${gap}${fill(words.said.era, { season: seasonLabel(sport as EraSport, o.year as number) })}`
        : "";
  if (!isScore(o)) return { title: o.title ?? surfaceName, description: o.description ?? `${about}${parkLine}${eraLine}` };
  const winner = winnerOf(o);
  const s = (t: Team): string => (t.score === undefined || String(t.score) === "" ? "–" : String(t.score));
  const line = fill(words.scoreTitle, { away: o.away.name, awayScore: s(o.away), home: o.home.name, homeScore: s(o.home) });
  const status = statusText(o, language);
  const pens = shootout(o);
  const extra = [o.competition, status, o.date].filter((part): part is string => part !== undefined && part !== "").join(words.said.sep);
  const level = numeric(o.home.score) !== undefined && numeric(o.home.score) === numeric(o.away.score);
  const result =
    winner === "none"
      ? ""
      : level && pens !== undefined
        ? `${gap}${fill(words.said.wonPens, { name: winner === "home" ? o.home.name : o.away.name, a: winner === "home" ? pens.home : pens.away, b: winner === "home" ? pens.away : pens.home })}`
        : `${gap}${fill(words.said.won, { name: winner === "home" ? o.home.name : o.away.name })}`;
  const tied = winner === "none" && level ? `${gap}${words.said.tied}` : "";
  return {
    title: o.title ?? (status === undefined ? line : `${line}${words.said.sep}${status}`),
    description: o.description ?? `${extra === "" ? "" : `${sentence(extra)}${gap}`}${sentence(line)}${result}${tied}${gap}${about}${parkLine}${eraLine}`.trim(),
  };
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
  // The sport as drawn: a league that is a sport of its own (`league: "cfl"` on an `nfl`) is that sport.
  const { sport } = chooseLeague(o);
  const portrait = isPortrait(o);
  const sized = isScore(o) ? (o.size === "compact" || o.size === "badge" ? o.size : "full") : "full";
  const id = drawingId(o);
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
    status = statusText(o, language);
    const home = teamView(o.home, homeSide, "home", winner, uppercase);
    const away = teamView(o.away, awaySide, "away", winner, uppercase);
    left = homeSide === "left" ? home : away;
    right = homeSide === "left" ? away : home;
    leftTeam = homeSide === "left" ? o.home : o.away;
    rightTeam = homeSide === "left" ? o.away : o.home;
  }
  const { title, description: said } = describe(o);
  let description = said;
  const titleId = `${id}-t`;
  const descId = `${id}-d`;
  const style = colourStyle(o, { left: leftTeam, right: rightTeam, home: isScore(o) ? o.home : undefined, away: isScore(o) ? o.away : undefined });
  const theme = o.theme === "light" || o.theme === "dark" ? o.theme : undefined;

  let viewBox: string;
  let body: string;
  let defs = "";
  if (isScore(o) && left !== undefined && right !== undefined && sized === "badge") {
    const badge = badgeMarkup(left, right, { sport, status, parts });
    viewBox = `0 0 ${badge.w} ${badge.h}`;
    body = badge.markup;
  } else {
    const surface = buildSurface(o, portrait, id, isScore(o) && sized === "full", isScore(o));
    defs = surface.defs;
    let inner = surface.base;
    let teams = "";
    if (isScore(o) && left !== undefined && right !== undefined && sized === "full") {
      const onColour = sport === "nfl" || sport === "cfl" || sport === "ifaf" || sport === "soccer";
      teams += bannerMarkup(surface.left, left, { turned: surface.turned, onColour, parts });
      teams += bannerMarkup(surface.right, right, { turned: surface.turned, onColour, parts });
    }
    // The teams are painted under the lines, unless the surface asks for them over (a panel that must hide them).
    inner += surface.bannersOver === true ? surface.lines + teams : teams + surface.lines;
    // Data goes over the markings and under the score's panel.
    const layered = renderLayers(o, o.layers, surface.turned);
    inner += layered.svg;
    if (layered.summaries.length > 0 && o.description === undefined) {
      const { colon, gap } = KYOGIJO_STRINGS[language].said;
      description = `${said}${gap}${KYOGIJO_STRINGS[language].layers.data}${colon}${layered.summaries.join(gap)}`;
    }
    if (isScore(o) && left !== undefined && right !== undefined && sized === "full") {
      const foot = o.label !== undefined && o.label !== "" ? o.label : [status, o.date].filter((part): part is string => part !== undefined && part !== "").join(" · ");
      inner += plateMarkup(surface.plate, left, right, { competition: o.competition, foot: foot === "" ? undefined : foot }, { turned: surface.turned, parts, surfaceSport: sport });
    }
    const group = el("g", { class: "ky-surface-group", transform: surface.turn, part: parts ? "surface" : undefined }, inner);
    const v = surface.view;
    if (isScore(o) && left !== undefined && right !== undefined && sized === "compact") {
      const badge = badgeMarkup(left, right, { sport, status, parts });
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
      class: `kyogijo ky-${sport}${safeClass(o.className) === "" ? "" : ` ${safeClass(o.className)}`}`,
      viewBox,
      role: "img",
      "aria-labelledby": `${titleId} ${descId}`,
      "data-sport": sport,
      "data-league": o.league === undefined || o.league === "" ? undefined : o.league,
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
      (o.style === "none" ? "" : `<style>${KYOGIJO_BASE_STYLE}</style>`) +
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
