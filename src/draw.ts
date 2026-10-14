import { ballparkDrawn, ballparkFor, ballparkSentences } from "./ballpark.ts";
import { inkOn, safeColour, safeLogo } from "./colour.ts";
import { drawingId, feetFence, isPortrait, lengthUnit, safeClass } from "./common.ts";
import { el, esc, num } from "./format.ts";
import { ERA_SPORTS, footballIn, rulesFor, seasonLabel, type EraSport } from "./eras.ts";
import { FOOTBALL } from "./geometry.ts";
import { renderLayers } from "./layers.ts";
import { groundById, groundNameIn, groundOfficialName } from "./grounds.ts";
import { courtFor, isNetSport, type CourtPlan } from "./court.ts";
import { cricketBoardMarkup } from "./cricket.board.ts";
import { fieldPlan, isFieldSport } from "./fields.ts";
import { fieldScoreText, fieldTotal } from "./field.score.ts";
import { fieldsStyle } from "./fields.style.ts";
import { resolveHomeSide } from "./homeside.ts";
import { LEAGUES, chooseLeague, courtOf, diamondOf, fieldOf, hasHistory, leagueSeason, leagueSize, netOf, rinkOf, sheetOf, type League } from "./leagues.ts";
import { diamondFence } from "./leagues/baseball.ts";
import { fenceFor, parkById, parkNameIn, parkOfficialName } from "./parks.ts";
import { boardMarkup, endText } from "./curling.board.ts";
import { sheetFor } from "./sheet.ts";
import { cropToRange, describeRange, rangeLabel, shows } from "./ranges.ts";
import { badgeMarkup, bannerMarkup, plateMarkup, stateOf, type TeamView } from "./score.ts";
import { setsBoardMarkup } from "./sets.board.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.ts";
import { courtStyle } from "./courts.style.ts";
import { annotate, annotated, wideView, type Notes } from "./annotate.ts";
import { KYOGIJO_BACKGROUND_STYLE, laidOn } from "./background.ts";
import { KYOGIJO_HARDWOOD_STYLE, resolveHardwood } from "./hardwood.ts";
import { featureColours, featureStyle } from "./features.ts";
import { isLook, lookStyle } from "./look.ts";
import { lineLook, restyleLines } from "./restyle.ts";
import { KYOGIJO_MARK_STYLE } from "./mark.ts";
import { KYOGIJO_BASE_STYLE, KYOGIJO_CURLING_STYLE, KYOGIJO_FOLD_STYLE, KYOGIJO_NOTE_STYLE, KYOGIJO_WALLS_STYLE } from "./style.ts";
import { convertLength, type Unit } from "./units.ts";
import { baseball } from "./surfaces/baseball.ts";
import { curling } from "./surfaces/curling.ts";
import { netCourt } from "./surfaces/net.ts";
import { fieldSurface } from "./surfaces/field.ts";
import { basketball } from "./surfaces/basketball.ts";
import { football } from "./surfaces/football.ts";
import { hockey } from "./surfaces/hockey.ts";
import { soccer } from "./surfaces/soccer.ts";
import { frameMatrix, layoutFromFrame, resolveFrame } from "./surfaces/soccer-providers.ts";
import { composeSpecial, hostSport } from "./special.ts";
import { specialStyle } from "./special.style.ts";
import { specialText } from "./events.ts";
import { layoutOf, soccerSpec, type SoccerPitchId, type SoccerSize, type SoccerSpec } from "./surfaces/soccer-spec.ts";
import type { BuildOptions, Surface } from "./surfaces/surface.ts";
import { abbreviate, capitals } from "./text.ts";
import type { Colors, CourtStyle, FieldSport, GoalStyle, Language, ScoreOptions, Side, Sport, StripePattern, SurfaceOptions, Team, TeamMark } from "./types.ts";
import { VERSION } from "./version.ts";

export { isPortrait };

/** The sports that can be drawn, in the order a menu lists them. */
export const SPORTS: readonly Sport[] = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "soccer", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"];

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

const SHEET_PROPERTIES: Readonly<Record<string, string>> = { outer: "--ky-rg-o", middle: "--ky-rg-m", inner: "--ky-rg-i", button: "--ky-rg-b" };

const isScore = (o: SurfaceOptions | ScoreOptions): o is ScoreOptions => (o as Partial<ScoreOptions>).home !== undefined && (o as Partial<ScoreOptions>).away !== undefined;

/** How many set columns a net sport's board always has: the sets or games a match can run to (best of 3 or 5). */
function minSets(sport: Sport, league: string | undefined): number {
  if (sport === "volleyball") return league === "fivb-beach" ? 3 : 5;
  return sport === "tabletennis" ? 5 : 3;
}

/** The standard statuses, spelled out. */
const FINAL = /^(?:final|f\b|ft\b|試合終了|終了)/i;

/** The words of a status in a language: a standard one is translated, any other text is kept as it is. */
export function statusLabel(status: string | undefined, language: Language = "en"): string | undefined {
  if (status === undefined || status.trim() === "") return undefined;
  const key = status.trim().toLowerCase().replace(/[\s/]+/g, "-");
  const words = KYOGIJO_STRINGS[language].status;
  // A curling end: "end-6", "End 6" or "第6エンド".
  const end = /^(?:end-?(\d{1,2})|第(\d{1,2})エンド)$/.exec(key);
  if (end !== null) return fill(KYOGIJO_STRINGS[language].endStatus, { n: Number(end[1] ?? end[2]) });
  // A set or a game of the net sports: "set-3", "Set 3", "第3セット", "game-2", "第2ゲーム".
  const set = /^(?:set-?(\d{1,2})|第(\d{1,2})セット)$/.exec(key);
  if (set !== null) return fill(KYOGIJO_STRINGS[language].setStatus, { n: Number(set[1] ?? set[2]) });
  const game = /^(?:game-?(\d{1,2})|第(\d{1,2})ゲーム)$/.exec(key);
  if (game !== null) return fill(KYOGIJO_STRINGS[language].gameStatus, { n: Number(game[1] ?? game[2]) });
  // A cricket innings: "innings-2", "Innings 2" or "第2イニング".
  const innings = /^(?:innings-?(\d{1,2})|第(\d{1,2})イニング)$/.exec(key);
  if (innings !== null) return fill(KYOGIJO_STRINGS[language].field.inningsStatus, { n: Number(innings[1] ?? innings[2]) });
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
export function winnerOf(o: Pick<ScoreOptions, "home" | "away" | "status" | "winner"> & { sport?: Sport }): "home" | "away" | "none" {
  const mode = o.winner ?? "auto";
  if (mode === "home" || mode === "away" || mode === "none") return mode;
  const h = fieldTotal(o.sport, o.home) ?? numeric(o.home.score);
  const a = fieldTotal(o.sport, o.away) ?? numeric(o.away.score);
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
 * "Final · 4-2 pens" (the shoot-out score in the order of the drawing's sides: the home team's first when it is on the left, which is
 * the default for soccer and the other sports that list the home team first). Pass `sport` (and `league`) for the sport's default; with
 * neither, the away team's is first unless `homeSide` is left.
 */
export function statusText(o: Pick<ScoreOptions, "home" | "away" | "status" | "homeSide"> & Partial<Pick<ScoreOptions, "sport" | "league">>, language: Language = "en"): string | undefined {
  const label = statusLabel(o.status, language);
  const pens = shootout(o);
  if (pens === undefined) return label;
  const homeLeft = resolveHomeSide(o) === "left";
  const left = homeLeft ? pens.home : pens.away;
  const right = homeLeft ? pens.away : pens.home;
  const text = fill(KYOGIJO_STRINGS[language].said.pens, { a: left, b: right });
  const base = (o.status ?? "").trim().toLowerCase() === "final-pens" ? statusLabel("final", language) : label;
  return base === undefined ? text : `${base} · ${text}`;
}

const safeLength = (value: number | string | undefined): string | undefined => {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? num(value) : undefined;
  return typeof value === "string" && /^\d+(?:\.\d+)?(?:px|%|em|rem|vw|vh)?$/.test(value.trim()) ? value.trim() : undefined;
};

const PATTERNS: readonly StripePattern[] = ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal", "circles", "rings", "fan", "none"];
const GOALS: readonly GoalStyle[] = ["box", "line", "strip", "none"];

/** The pitch the options ask for: a `pitch` of the caller's, else the size a `ground` publishes, else none (the international pitch). */
export function pitchOf(o: SurfaceOptions): SoccerPitchId | SoccerSize | undefined {
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
      half: !scored && o.range === undefined && (o.half === "left" || o.half === "right") ? o.half : undefined,
      pattern: PATTERNS.includes(o.stripePattern as StripePattern) ? (o.stripePattern as StripePattern) : "bands",
      goals: GOALS.includes(o.goals as GoalStyle) ? (o.goals as GoalStyle) : "box",
      flags: typeof o.cornerFlags === "boolean" ? o.cornerFlags : detail === "full",
      frame: frame === undefined ? undefined : { id: frame.id, matrix: frameMatrix(frame, spec) },
    },
    common,
  );
}

/** What a drawing adds to what the builders are given: the features with a colour of their own, and a margin the annotations ask for. */
interface Extra {
  features: ReadonlySet<string> | undefined;
  margin?: number;
  /** The ground the annotations need beyond the cut of a range, which is not the surface's own margin. */
  room?: number;
}

/** One text for both ends or sides, or a pair of them. */
const pair = (text: string | [string, string] | undefined): [string, string] | undefined => (text === undefined ? undefined : typeof text === "string" ? [text, text] : text);

/** The surface the options ask for, whole: before it is cropped to a `range`. */
function buildWhole(o: SurfaceOptions, portrait: boolean, id: string, score: boolean, scored: boolean, extra: Extra): Surface {
  const court: CourtStyle | undefined = o.court;
  const baselineText: [string, string] | undefined = pair(court?.baselineText);
  const unit: Unit = lengthUnit(o);
  const common: BuildOptions = {
    portrait,
    margin: typeof o.margin === "number" && Number.isFinite(o.margin) && o.margin >= 0 ? convertLength(o.margin, unit, "ft") : extra.margin,
    exact: o.exactLines === true,
    detail: o.detail === "simple" ? "simple" : "full",
    stripes: o.stripes !== false,
    id,
    score,
    court: { baselineText, centreLogo: safeLogo(court?.centreLogo), paintThreePoint: court?.paintThreePoint, hardwood: resolveHardwood(court, o.detail === "simple", o.width), sidelineText: pair(court?.sidelineText) },
    features: extra.features,
    mow: PATTERNS.includes(o.stripePattern as StripePattern) ? (o.stripePattern as StripePattern) : undefined,
    goals: GOALS.includes(o.goals as GoalStyle) ? (o.goals as GoalStyle) : undefined,
    goalMarkup: typeof o.goalMarkup === "function" ? o.goalMarkup : undefined,
    landmarks: o.landmarks === true,
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
        return baseball(fenceFor(parkById(o.park), feetFence(o.fence, unit), o.year, diamondFence(diamond)), { ...common, ballpark: ballparkFor(o) }, undefined, diamond);
      }
      return baseball(fenceFor(parkById(o.park), feetFence(o.fence, unit), o.year), { ...common, ballpark: ballparkFor(o) }, rulesFor("mlb", o.year).rules);
    }
    case "soccer":
      return buildSoccer(o, common, scored, unit);
    case "curling": {
      const plan = sheetFor(o);
      // A score always shows the whole sheet, for the board's sake.
      const words = KYOGIJO_STRINGS[o.language === "ja" ? "ja" : "en"].ranges.folded;
      const labels: [string, string] = portrait ? [words.top, words.bottom] : [words.left, words.right];
      return curling(common, { pebble: plan.pebble, guardZone: plan.guardZone, show: scored ? "sheet" : plan.show, end: plan.end, figures: plan.spec, fold: { panels: plan.panels, fit: plan.fit, labels } });
    }
    case "tennis":
    case "volleyball":
    case "badminton":
    case "pickleball":
    case "tabletennis":
      return netCourt(common, courtFor({ ...o, sport }));
    case "lacrosse":
    case "rugby":
    case "afl":
    case "gaelic":
    case "cricket":
    case "fieldhockey":
    case "handball":
      return fieldSurface(common, fieldPlan({ ...o, sport, detail: common.detail }), { goals: common.goals });
    default:
      throw new Error(`Unknown sport "${String(o.sport)}": use one of ${SPORTS.join(", ")}`);
  }
}

/** The surface the options ask for, cropped to their `range` when they have one (a curling sheet's named ranges are its builder's own: `sheet.show`). */
function buildSurface(o: SurfaceOptions, portrait: boolean, id: string, score: boolean, scored: boolean, extra: Extra): Surface {
  const surface = buildWhole(o, portrait, id, score, scored, extra);
  // A score on a curling sheet shows all of it, for the board's sake.
  if (o.range === undefined || (scored && chooseLeague(o).sport === "curling")) return surface;
  const given = typeof o.margin === "number" && Number.isFinite(o.margin) && o.margin >= 0 ? convertLength(o.margin, lengthUnit(o), "ft") : undefined;
  return cropToRange(surface, o, { id, margin: extra.room ?? extra.margin ?? given, panel: score });
}

/** The custom properties a drawing sets on its root, from the options' colours. */
function colourStyle(o: SurfaceOptions, teams: { left?: Team; right?: Team; home?: Team; away?: Team }, features: readonly (readonly [string, string])[]): string {
  const props: string[] = [];
  const set = (name: string, value: unknown): void => {
    const colour = safeColour(value);
    if (colour !== undefined) props.push(`${name}:${colour}`);
  };
  for (const [key, property] of Object.entries(COLOR_PROPERTIES)) set(property, o.colors?.[key as keyof Colors]);
  if (o.court !== undefined) for (const [key, property] of Object.entries(COURT_PROPERTIES)) set(property, (o.court as Record<string, unknown>)[key]);
  if (o.sheet?.rings !== undefined) for (const [key, property] of Object.entries(SHEET_PROPERTIES)) set(property, (o.sheet.rings as Record<string, unknown>)[key]);
  for (const [name, colour] of features) props.push(`--ky-f-${name}:${colour}`);
  // A data layer's team marks take the teams' own colours, unless the colours say otherwise.
  const marked = (o.layers !== undefined && o.layers.length > 0) || o.direction !== undefined;
  const homeMarks = marked ? safeColour(teams.home?.color) : undefined;
  const awayMarks = marked ? safeColour(teams.away?.color) : undefined;
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
  // A hardwood floor's border behind each baseline: the court's colour for it, else the team's, else the border's.
  if (o.court?.hardwood !== undefined && o.court.hardwood !== false) {
    const ends = pair(o.court.baselineColor);
    const endLeft = safeColour(ends?.[0]) ?? left;
    const endRight = safeColour(ends?.[1]) ?? right;
    if (endLeft !== undefined) props.push(`--ky-hw-end-left:${endLeft}`);
    if (endRight !== undefined) props.push(`--ky-hw-end-right:${endRight}`);
  }
  return props.join(";");
}

/** The round mark of a team, when its own `mark` or the score's `markShape` asks for one: the fit, the colour of its disc and the ink of its initials. */
function roundOf(team: Team, markShape: TeamMark | undefined): Pick<TeamView, "round" | "fit" | "color" | "ink"> | undefined {
  const shape = team.mark === "round" || team.mark === "plain" ? team.mark : markShape;
  if (shape !== "round") return undefined;
  return { round: true, fit: team.markFit === "contain" ? "contain" : undefined, color: safeColour(team.color), ink: safeColour(team.textColor) };
}

function teamView(team: Team, side: Side, role: "home" | "away", winner: "home" | "away" | "none", uppercase: boolean, sport: Sport, markShape?: TeamMark): TeamView {
  const name = String(team.name ?? "");
  const written = fieldScoreText(sport, team);
  const score = written ?? (team.score === undefined || team.score === null || String(team.score).trim() === "" ? "–" : String(team.score));
  return {
    side,
    role,
    name: uppercase ? capitals(name) : name,
    abbr: (team.abbr !== undefined && team.abbr.trim() !== "" ? team.abbr.trim() : abbreviate(name)).slice(0, 5),
    score,
    logo: safeLogo(team.logo),
    ...roundOf(team, markShape),
    state: stateOf(winner, role),
    ends: Array.isArray(team.ends) ? team.ends.map(endText) : undefined,
    hammer: team.hammer === true ? true : undefined,
    sets: Array.isArray(team.sets) ? team.sets.map(endText) : undefined,
    tiebreaks: Array.isArray(team.tiebreaks) ? team.tiebreaks.map(endText) : undefined,
    points: team.points === undefined || team.points === null ? undefined : String(team.points).trim().slice(0, 3),
    serving: team.serving === true ? true : undefined,
    wickets: sport === "cricket" && team.wickets !== undefined && team.wickets !== null && String(team.wickets).trim() !== "" ? String(team.wickets).trim().slice(0, 2) : undefined,
    overs: sport === "cricket" && team.overs !== undefined && team.overs !== null && String(team.overs).trim() !== "" ? String(team.overs).trim().slice(0, 6) : undefined,
    innings: sport === "cricket" && Array.isArray(team.innings) ? team.innings.map((value) => (typeof value === "number" ? (Number.isFinite(value) ? String(value) : "") : typeof value === "string" ? value.trim().slice(0, 7) : "")) : undefined,
  };
}

const trimmed = (value: number): string => String(Math.round(value * 100) / 100);

/** What a league's surface is, in a sentence fragment: its size or its bases, from the league's own figures in the unit its rulebook uses. */
function leagueAbout(league: League, year: number | undefined, language: Language, sheet?: { length: number; width: number }): string {
  const words = KYOGIJO_STRINGS[language].league;
  // The field sports: their size is the surface drawn (the one the options ask for), in the unit their rulebook prints first.
  if (league.family === "lacrosse" || league.family === "rugby" || league.family === "afl" || league.family === "gaelic" || league.family === "cricket" || league.family === "fieldhockey" || league.family === "handball") {
    const sized = sheet ?? leagueSize(league.family, league.id);
    const to = league.unit;
    const size = fill(words.size, { length: trimmed(convertLength(sized.length, "ft", to)), width: trimmed(convertLength(sized.width, "ft", to)), unit: words.units[to === "m" || to === "yd" ? to : "ft"] });
    const key = league.family === "lacrosse" && league.dimensions.kind === "box" ? "lacrosseBox" : league.family === "rugby" && league.dimensions.code === "league" ? "rugbyLeague" : league.family === "gaelic" && league.dimensions.code === "hurling" ? "hurling" : league.family;
    return fill(words[key], { size });
  }
  if (league.family === "baseball") {
    const diamond = diamondOf(league, year);
    return fill(league.game === "softball" ? words.softball : words.baseball, { base: trimmed(diamond.base), pitch: trimmed(diamond.pitcher) });
  }
  const size =
    league.family === "basketball"
      ? courtOf(league, year)
      : league.family === "hockey"
        ? rinkOf(league, year)
        : league.family === "curling"
          ? (sheet ?? sheetOf(league))
          : league.family === "tennis" || league.family === "volleyball" || league.family === "badminton" || league.family === "pickleball" || league.family === "tabletennis"
            ? (() => {
                const f = netOf(league) as { length: number; width?: number; widthDoubles?: number };
                return { length: f.length, width: f.widthDoubles ?? (f.width as number) };
              })()
            : (() => {
            const field = fieldOf(league, year);
            return { length: field.length + 2 * field.endZone, width: field.width };
          })();
  const to = league.unit;
  const text = fill(words.size, { length: trimmed(convertLength(size.length, "ft", to)), width: trimmed(convertLength(size.width, "ft", to)), unit: words.units[to === "m" || to === "yd" ? to : "ft"] });
  return fill(league.family === "volleyball" && league.id === "fivb-beach" ? words.beachVolleyball : words[league.family], { size: text });
}

/** A drawing's title and description, in a language. */
export function describe(o: SurfaceOptions | ScoreOptions): { title: string; description: string } {
  // A special game is drawn whole: a `range` is for a surface of its own.
  if (o.host !== undefined && o.range !== undefined) return describe({ ...o, range: undefined });
  const language: Language = o.language === "ja" ? "ja" : "en";
  const words = KYOGIJO_STRINGS[language];
  const { sport, league } = chooseLeague(o);
  const park = sport === "mlb" ? parkById(o.park) : undefined;
  const parkName = park === undefined ? undefined : parkNameIn(park, language);
  const pitch = sport === "soccer" ? soccerSpec(pitchOf(o)) : undefined;
  // A ground names a full-size pitch; a small-sided pitch or futsal court the caller asked for keeps its own name.
  const ground = pitch?.format === "11" ? groundById(o.ground) : undefined;
  const groundName = ground === undefined ? undefined : groundNameIn(ground, o.year, language);
  // A league other than the sport's own is named by its rulebook's, and its description is made from its figures.
  const surfaceName = groundName !== undefined ? (language === "ja" ? `${groundName}のピッチ` : `${groundName}, soccer pitch`) : league !== undefined && parkName === undefined ? league.name[language] : parkName === undefined ? (pitch?.format === "futsal" ? words.soccer.futsal : words.surface[sport]) : language === "ja" ? `${parkName}のグラウンド` : `${parkName}, baseball field`;
  const { stop, colon, gap } = words.said;
  const sentence = (text: string): string => (/[.。]$/.test(text) ? text : `${text}${stop}`);
  const metres = (value: number): string => String(Math.round(value * 10) / 10);
  const plan = sport === "curling" ? sheetFor(o) : undefined;
  // A field sport: the surface as drawn, at the size the options ask for.
  const field = isFieldSport(sport) ? fieldPlan({ ...o, sport }) : undefined;
  const aboutText = field !== undefined ? leagueAbout(league ?? LEAGUES[sport as FieldSport][0], o.year, language, { length: field.length, width: field.width }) : plan !== undefined ? leagueAbout(plan.league, o.year, language, plan.spec) : league !== undefined ? leagueAbout(league, o.year, language) : pitch === undefined ? words.about[sport] : fill(pitch.format === "futsal" ? words.soccer.aboutFutsal : words.about.soccer, { length: metres(pitch.length), width: metres(pitch.width) });
  const about = `${words.said.on}${colon}${aboutText}${stop}`;
  const halfLine = pitch !== undefined && !isScore(o) && (o.half === "left" || o.half === "right") ? `${gap}${words.soccer.half}` : "";
  // What the ground says about the size: that it is the published one, or that the ground has none and the international pitch is drawn.
  const year = typeof o.year === "number" && Number.isFinite(o.year) ? o.year : undefined;
  const groundOfficial = ground === undefined ? undefined : groundOfficialName(ground, language, year);
  const parkOfficial = park === undefined ? undefined : parkOfficialName(park, language, year);
  const officially = (name: string | undefined): string => (name === undefined ? "" : `${gap}${fill(words.said.officially, { name })}`);
  const groundLine = ground === undefined || groundName === undefined || o.pitch !== undefined ? "" : `${gap}${fill(ground.pitchSize === "published" ? words.said.ground : words.said.groundDefault, { ground: groundName })}${officially(groundOfficial)}`;
  // A park's walls and quirks that are drawn are said too.
  const ballpark = park === undefined ? undefined : ballparkFor(o);
  const special = specialText(o, language, surfaceName);
  const parkLine = (parkName === undefined ? `${groundLine}${halfLine}` : `${gap}${fill(words.said.park, { park: parkName })}${officially(parkOfficial)}${ballpark === undefined ? "" : ballparkSentences(ballpark).map((line) => `${gap}${line}`).join("")}`) + (special === undefined ? "" : `${gap}${special.text}`);
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
  // A range says what is shown; a curling score shows all of the sheet, whatever the range.
  const hasData = o.layers !== undefined && o.layers.length > 0;
  // A folded sheet says what is enlarged and where, in place of the range's own sentence.
  const foldedWords = words.ranges.folded;
  const rangeLine =
    isScore(o) && sport === "curling"
      ? ""
      : plan?.show === "folded"
        ? `${gap}${[foldedWords[isPortrait(o) ? "tall" : "wide"], foldedWords[plan.panels], hasData ? foldedWords.data : ""].filter((part) => part !== "").join(gap)}`
        : describeRange(o, language, hasData);
  if (!isScore(o)) return { title: o.title ?? special?.title ?? surfaceName, description: o.description ?? `${about}${parkLine}${eraLine}${rangeLine}` };
  const winner = winnerOf({ ...o, sport });
  const s = (t: Team): string => fieldScoreText(sport, t) ?? (t.score === undefined || String(t.score) === "" ? "–" : String(t.score));
  // The sentence follows the drawing: the team on the left is first. The words' {away} and {home} are the first and the second team named.
  const order: [Team, Team] = resolveHomeSide({ ...o, sport }) === "left" ? [o.home, o.away] : [o.away, o.home];
  const line = fill(words.scoreTitle, { away: order[0].name, awayScore: s(order[0]), home: order[1].name, homeScore: s(order[1]) });
  const status = statusText({ ...o, sport }, language);
  const pens = shootout(o);
  const extra = [o.competition, status, o.date].filter((part): part is string => part !== undefined && part !== "").join(words.said.sep);
  const level = (fieldTotal(sport, o.home) ?? numeric(o.home.score)) !== undefined && (fieldTotal(sport, o.home) ?? numeric(o.home.score)) === (fieldTotal(sport, o.away) ?? numeric(o.away.score));
  const result =
    winner === "none"
      ? ""
      : level && pens !== undefined
        ? `${gap}${fill(words.said.wonPens, { name: winner === "home" ? o.home.name : o.away.name, a: winner === "home" ? pens.home : pens.away, b: winner === "home" ? pens.away : pens.home })}`
        : `${gap}${fill(words.said.won, { name: winner === "home" ? o.home.name : o.away.name })}`;
  const tied = winner === "none" && level ? `${gap}${words.said.tied}` : "";
  // Curling: who has the hammer, and the score of each end, which the board shows and a reader of the description would otherwise miss.
  const curlingLine =
    sport !== "curling"
      ? ""
      : order
          .flatMap((team) => [
            team.hammer === true ? fill(words.said.hammer, { name: team.name }) : "",
            Array.isArray(team.ends) && team.ends.length > 0 ? fill(words.said.ends, { name: team.name, list: team.ends.map((value) => endText(value) || "–").join(words.layers.listSep) }) : "",
          ])
          .filter((part) => part !== "")
          .map((part) => `${gap}${part}`)
          .join("");
  // The net sports: who is serving, the score in each set (or game), and the points of the game in progress, which the board shows.
  const net = words.net;
  const setList = (team: Team): string =>
    (team.sets ?? []).map((value, i) => {
      const tb = endText(team.tiebreaks?.[i]);
      return `${endText(value) || "–"}${tb === "" ? "" : ` (${tb})`}`;
    }).join(words.layers.listSep);
  const netLine = !isNetSport(sport)
    ? ""
    : order
        .flatMap((team) => [
          team.serving === true ? fill(net.serving, { name: team.name }) : "",
          Array.isArray(team.sets) && team.sets.length > 0 ? fill(sport === "badminton" || sport === "pickleball" || sport === "tabletennis" ? net.byGame : net.bySet, { name: team.name, list: setList(team) }) : "",
          team.points !== undefined && team.points !== null && String(team.points).trim() !== "" ? fill(net.gamePoints, { name: team.name, points: String(team.points).trim() }) : "",
        ])
        .filter((part) => part !== "")
        .map((part) => `${gap}${part}`)
        .join("");
  // The field sports: goals and behinds, goals and points, and a cricket team's runs, wickets, overs and innings, which the board shows.
  const fw = words.field;
  const fieldLine =
    sport === "afl" || sport === "gaelic"
      ? order
          .filter((team) => fieldScoreText(sport, team) !== undefined)
          .map((team) => `${gap}${fill(sport === "afl" ? fw.aflScore : fw.gaelicScore, { name: team.name, goals: String(team.goals), behinds: String(team.behinds), points: String(team.points) })}`)
          .join("")
      : sport === "cricket"
        ? order
            .flatMap((team) => [
              team.wickets !== undefined && team.wickets !== null && String(team.wickets) !== "" && team.overs !== undefined && team.overs !== null && String(team.overs) !== "" ? fill(fw.cricketScore, { name: team.name, runs: s(team), wickets: String(team.wickets), overs: String(team.overs) }) : "",
              Array.isArray(team.innings) && team.innings.length > 0 ? fill(fw.cricketInnings, { name: team.name, list: team.innings.map((value) => endText(value) || "–").join(words.layers.listSep) }) : "",
            ])
            .filter((part) => part !== "")
            .map((part) => `${gap}${part}`)
            .join("")
        : "";
  return {
    title: o.title ?? (status === undefined ? line : `${line}${words.said.sep}${status}`),
    description: o.description ?? `${extra === "" ? "" : `${sentence(extra)}${gap}`}${sentence(line)}${result}${tied}${curlingLine}${netLine}${fieldLine}${gap}${about}${parkLine}${eraLine}${rangeLine}`.trim(),
  };
}

/**
 * Draw a surface, or a score on a surface, as an SVG string. With `home` and `away` it is a score; without them, the
 * bare surface. The same options always give the same string.
 * @example
 * ```ts
 * import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
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
  if (o.host !== undefined && o.range !== undefined) return drawKyogijo({ ...o, range: undefined });
  const language: Language = o.language === "ja" ? "ja" : "en";
  // The sport as drawn: a league that is a sport of its own (`league: "cfl"` on an `nfl`) is that sport.
  const { sport } = chooseLeague(o);
  // A special game is drawn as its host lies, wide.
  const portrait = isPortrait(o) && o.host === undefined;
  // The court of a net sport: its look is the root's `data-look`, and its rules are written in beside the base rules.
  const plan: CourtPlan | undefined = isNetSport(sport) ? courtFor({ ...o, sport }) : undefined;
  const look = plan?.look;
  // A tall curling sheet is 30 feet wide on the page and a strip under it would be unreadable: its compact size is the board on the ice.
  const asked = isScore(o) ? (o.size === "compact" || o.size === "badge" ? o.size : "full") : "full";
  let sized = asked === "compact" && sport === "curling" && portrait ? "full" : asked;
  const id = drawingId(o);
  const parts = o.parts === true;
  const homeSide: Side = isScore(o) ? resolveHomeSide({ ...o, sport }) : "right";
  const awaySide: Side = homeSide === "left" ? "right" : "left";
  const uppercase = !isScore(o) || o.uppercase !== false;

  let left: TeamView | undefined;
  let right: TeamView | undefined;
  let leftTeam: Team | undefined;
  let rightTeam: Team | undefined;
  let winner: "home" | "away" | "none" = "none";
  let status: string | undefined;
  if (isScore(o)) {
    winner = winnerOf({ ...o, sport });
    status = statusText({ ...o, sport }, language);
    const home = teamView(o.home, homeSide, "home", winner, uppercase, sport, o.markShape);
    const away = teamView(o.away, awaySide, "away", winner, uppercase, sport, o.markShape);
    left = homeSide === "left" ? home : away;
    right = homeSide === "left" ? away : home;
    leftTeam = homeSide === "left" ? o.home : o.away;
    rightTeam = homeSide === "left" ? o.away : o.home;
  }
  const { title, description: said } = describe(o);
  let description = said;
  const titleId = `${id}-t`;
  const descId = `${id}-d`;
  // The features that have a colour of their own, for the sport as drawn (a `league` of another sport is that sport's).
  const featured = featureColours(sport, o.featureColors);
  const features = featured.length === 0 ? undefined : new Set(featured.map(([name]) => name));
  const walled = sport === "mlb" && ballparkDrawn(ballparkFor(o));
  const hardwood = sport === "nba" && o.court?.hardwood !== undefined && o.court.hardwood !== false;
  const style = colourStyle(o, { left: leftTeam, right: rightTeam, home: isScore(o) ? o.home : undefined, away: isScore(o) ? o.away : undefined }, featured);
  const palette = isLook(o.look) ? o.look : undefined;
  let notes: Notes | undefined;
  const theme = o.theme === "light" || o.theme === "dark" ? o.theme : undefined;

  let viewBox: string;
  let body: string;
  let defs = "";
  let grounded = false;
  let foldedSheet = false;
  if (isScore(o) && left !== undefined && right !== undefined && sized === "badge") {
    const badge = badgeMarkup(left, right, { sport, status, parts, id });
    viewBox = `0 0 ${badge.w} ${badge.h}`;
    body = badge.markup;
  } else {
    // A special game: the drawing's own surface is built with no ground round it and set inside the host.
    const make = (more: Extra): Surface => {
      if (o.host === undefined) return buildSurface(o, portrait, id, isScore(o) && sized === "full", isScore(o), more);
      const guest = buildSurface({ ...o, margin: 0 }, false, id, isScore(o) && sized === "full", isScore(o), more);
      return composeSpecial(o, guest, (host, hostId) => buildSurface(host, false, hostId, false, false, { features: undefined }), id);
    };
    let surface = make({ features });
    foldedSheet = surface.folded === true;
    // A range too small to hold the score's panel: the score goes to the strip under the drawing, as a compact card does.
    if (surface.plateFits === false) {
      sized = "compact";
      surface = buildSurface(o, portrait, id, false, true, { features });
    }
    // A folded sheet has no margin for the annotations to stand in: they are not drawn on it.
    if (annotated(o) && o.host === undefined && surface.folded !== true) {
      const teams = { home: isScore(o) ? o.home.name : undefined, away: isScore(o) ? o.away.name : undefined };
      notes = annotate({ o, surface, turned: surface.turned, words: KYOGIJO_STRINGS[language], teams });
      // The annotations need room in the margin: unless the options fix it, the surface is drawn again with a margin that holds them.
      // Cropped to a range, the surface's own margin is at its edges and the cut's is round the rest: both must hold them.
      const have = surface.ground ?? (surface.box === undefined ? 0 : surface.box.y - wideView(surface).y);
      const roomed = surface.room ?? have;
      if (o.margin === undefined && (notes.need > have + 0.01 || notes.need > roomed + 0.01)) {
        surface = make({ features, margin: notes.need > have + 0.01 ? notes.need : undefined, room: notes.need });
        notes = annotate({ o, surface, turned: surface.turned, words: KYOGIJO_STRINGS[language], teams });
      }
    }
    // The width, dashes and opacity of the lines are laid over what the surface wrote.
    const lines = lineLook(o, surface.lineRef, lengthUnit(o));
    if (lines !== undefined) surface.lines = restyleLines(surface.lines, lines);
    // A ground (a pattern, a colour or a photograph) is laid on the apron, under the surface.
    const ground = laidOn(surface.base, o.background, id);
    grounded = ground.base !== surface.base;
    defs = surface.defs + ground.defs;
    let inner = ground.base;
    let teams = "";
    if (isScore(o) && left !== undefined && right !== undefined && sized === "full") {
      const onColour = surface.onColour ?? (sport === "nfl" || sport === "cfl" || sport === "ifaf" || sport === "soccer");
      // A curling sheet, the net sports' courts and a cricket ground have no place for the names: the board names the teams.
      if (sport !== "curling" && !isNetSport(sport) && sport !== "cricket") {
        // Cropped to a range, a team's name is written only where its place is in what is shown.
        if (shows(surface, surface.left)) teams += bannerMarkup(surface.left, left, { turned: surface.turned, onColour, parts, id });
        if (shows(surface, surface.right)) teams += bannerMarkup(surface.right, right, { turned: surface.turned, onColour, parts, id });
      }
    }
    // The teams are painted under the lines, unless the surface asks for them over (a panel that must hide them).
    inner += surface.bannersOver === true ? surface.lines + teams : teams + surface.lines;
    // Data goes over the markings and under the score's panel.
    const layered = renderLayers(o, o.layers, surface.turned, surface.whole === undefined ? undefined : surface.box);
    inner += surface.frame === undefined || layered.svg === "" ? layered.svg : el("g", { transform: surface.frame }, layered.svg);
    // A surface drawn in parts shows the data again in each enlarged part, with its own ids, hidden from a reader of the drawing (the strip says it). A colour bar sized
    // against the whole sheet falls outside the panels' part of it and is cut away there; one given a `region` inside a panel's part is drawn there, large.
    if (surface.panels !== undefined && layered.svg !== "" && o.layers !== undefined) {
      surface.panels.forEach((panel, i) => {
        const copy = renderLayers({ ...o, id: `${id}-f${i}` }, o.layers, surface.turned);
        if (copy.svg !== "") inner += el("g", { class: "ky-fold-data", "aria-hidden": "true", transform: panel.transform, "clip-path": `url(#${panel.clip})` }, copy.svg);
      });
    }
    if (layered.summaries.length > 0 && o.description === undefined) {
      const { colon, gap } = KYOGIJO_STRINGS[language].said;
      description = `${said}${gap}${KYOGIJO_STRINGS[language].layers.data}${colon}${layered.summaries.join(gap)}`;
    }
    if (surface.over !== undefined) inner += surface.over;
    if (notes !== undefined && notes.svg !== "") {
      inner += notes.svg;
      if (notes.summaries.length > 0 && o.description === undefined) description = `${description}${KYOGIJO_STRINGS[language].said.gap}${notes.summaries.join(KYOGIJO_STRINGS[language].said.gap)}`;
    }
    if (isScore(o) && left !== undefined && right !== undefined && sized === "full" && o.plate !== false) {
      const foot = o.label !== undefined && o.label !== "" ? o.label : [status, o.date].filter((part): part is string => part !== undefined && part !== "").join(" · ");
      if (sport === "curling") {
        const board = boardMarkup(surface.plate, left, right, { competition: o.competition, foot: foot === "" ? undefined : foot, total: KYOGIJO_STRINGS[language].said.total }, { turned: surface.turned, parts });
        inner += el("g", { transform: `translate(${num(surface.plate.cx)} ${num(surface.plate.cy)})${surface.turned ? " rotate(-90)" : ""}` }, board);
      } else if (sport === "cricket") {
        const words = KYOGIJO_STRINGS[language].field;
        const board = cricketBoardMarkup(surface.plate, left, right, { competition: o.competition, foot: foot === "" ? undefined : foot, innings: words.innings, total: words.total, overs: words.overs }, { parts });
        inner += el("g", { transform: `translate(${num(surface.plate.cx)} ${num(surface.plate.cy)})${surface.turned ? " rotate(-90)" : ""}` }, board);
      } else if (isNetSport(sport)) {
        const board = setsBoardMarkup(surface.plate, left, right, { competition: o.competition, foot: foot === "" ? undefined : foot, head: KYOGIJO_STRINGS[language].net[sport === "badminton" || sport === "pickleball" || sport === "tabletennis" ? "games" : "sets"], points: KYOGIJO_STRINGS[language].net.points }, { parts, least: minSets(sport, chooseLeague(o).league?.id) });
        inner += el("g", { transform: `translate(${num(surface.plate.cx)} ${num(surface.plate.cy)})${surface.turned ? " rotate(-90)" : ""}` }, board);
      } else inner += plateMarkup(surface.plate, left, right, { competition: o.competition, foot: foot === "" ? undefined : foot }, { turned: surface.turned, parts, surfaceSport: sport });
    }
    const group = el("g", { class: "ky-surface-group", transform: surface.turn, part: parts ? "surface" : undefined }, inner);
    const v = surface.view;
    if (isScore(o) && left !== undefined && right !== undefined && sized === "compact") {
      const badge = badgeMarkup(left, right, { sport, status, parts, id });
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
      "data-range": isScore(o) && sport === "curling" ? undefined : rangeLabel(o),
      "data-event": o.host !== undefined && typeof o.event === "string" ? safeClass(o.event) : undefined,
      "data-look": look,
      "data-size": sized,
      "data-orientation": portrait ? "portrait" : "landscape",
      "data-theme": theme,
      "data-palette": palette,
      "data-winner": isScore(o) ? winner : undefined,
      "data-version": VERSION,
      width: safeLength(o.width),
      height: safeLength(o.height),
      part: parts ? "svg" : undefined,
      style: style === "" ? undefined : style,
    },
    `<title id="${titleId}">${esc(title)}</title><desc id="${descId}">${esc(description)}</desc>` +
      (o.style === "none" ? "" : `<style>${KYOGIJO_BASE_STYLE}${left?.round === true || right?.round === true ? `\n${KYOGIJO_MARK_STYLE}` : ""}${sport === "curling" ? `\n${KYOGIJO_CURLING_STYLE}` : ""}${foldedSheet ? `\n${KYOGIJO_FOLD_STYLE}` : ""}${plan === undefined ? "" : `\n${courtStyle(plan.sport, plan.look)}`}${fieldsStyle(sport) === "" ? "" : `\n${fieldsStyle(sport)}`}${palette === undefined ? "" : `\n${lookStyle(palette)}`}${walled ? `\n${KYOGIJO_WALLS_STYLE}` : ""}${hardwood ? `\n${KYOGIJO_HARDWOOD_STYLE}` : ""}${features === undefined ? "" : `\n${featureStyle(sport, features)}`}${notes === undefined || notes.svg === "" ? "" : `\n${KYOGIJO_NOTE_STYLE}`}${grounded ? `\n${KYOGIJO_BACKGROUND_STYLE}` : ""}${o.host === undefined ? "" : `\n${specialStyle(hostSport(o.host))}`}</style>`) +
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
