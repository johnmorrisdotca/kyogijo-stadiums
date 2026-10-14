import { ballparkDrawn, ballparkFor, ballparkSentences } from "./ballpark.ts";
import { inkOn, safeColour } from "./colour.ts";
import { withEmblems } from "./emblems-source.ts";
import { safeLogo } from "./logo.ts";
import { drawingId, feetFence, isPortrait, lengthUnit, safeClass } from "./common.ts";
import { el, esc, num } from "./format.ts";
import { fieldAttributes } from "./field.data.ts";
import { ERA_SPORTS, footballIn, rulesFor, seasonLabel, type EraSport } from "./eras.ts";
import { FOOTBALL } from "./geometry.ts";
import { renderLayers } from "./layers.ts";
import { groundById, groundNameIn, groundOfficialName } from "./grounds.ts";
import { BOARD, courtFor, hasSetsBoard, isNetLeague, isNetSport, type CourtPlan } from "./court.ts";
import { cricketBoardMarkup } from "./cricket.board.ts";
import { athleticsPlan } from "./athletics/plan.ts";
import { skatingPlan } from "./skating/plan.ts";
import { skatingAbout, skatingSentences } from "./skating/describe.ts";
import { skatingStyle } from "./skating.style.ts";
import { skatingSurface } from "./surfaces/skating.ts";
import { athleticsAbout, athleticsSentences } from "./athletics/describe.ts";
import { athleticsStyle, athleticsTrackRules } from "./athletics.style.ts";
import { athleticsSurface, pitchGroup, type Embedded } from "./surfaces/athletics.ts";
import { fieldPlan, isFieldSport } from "./fields.ts";
import { fieldScoreText, fieldTotal } from "./field.score.ts";
import { fieldsStyle } from "./fields.style.ts";
import { resolveHomeSide } from "./homeside.ts";
import { LEAGUES, chooseLeague, courtOf, diamondOf, fieldOf, hasHistory, leagueSeason, leagueSize, netOf, rinkOf, sheetOf, type League } from "./leagues.ts";
import { MLB_DIAMOND, diamondFence } from "./leagues/baseball.ts";
import { fenceFor, parkById, parkNameIn, parkOfficialName, parkWallsIn } from "./parks.ts";
import { boardMarkup, endText } from "./curling.board.ts";
import { sheetFor } from "./sheet.ts";
import { commonOf, isPoolSport, swimPlan, poloPlan, divePlan, artisticPlan } from "./pool.ts";
import { natatorium } from "./surfaces/venue.ts";
import { poolDescription } from "./pool.words.ts";
import { KYOGIJO_POOL_STYLE, poolStyle } from "./pool.style.ts";
import { swimming } from "./surfaces/pool.ts";
import { waterPolo } from "./surfaces/polo.ts";
import { diving } from "./surfaces/dive.ts";
import { artistic } from "./surfaces/artistic.ts";
import { cropToRange, describeRange, rangeLabel, shows } from "./ranges.ts";
import { badgeMarkup, bannerMarkup, plateMarkup, stateOf, type TeamView } from "./score.ts";
import { setsBoardMarkup } from "./sets.board.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.ts";
import { courtStyle } from "./courts.style.ts";
import { annotate, annotated, wideView, type Notes } from "./annotate.ts";
import { KYOGIJO_BACKGROUND_STYLE, laidOn } from "./background.ts";
import { KYOGIJO_HARDWOOD_STYLE, resolveHardwood } from "./hardwood.ts";
import { WALL_SEATS, densityOf, layoutOf as crowdLayout, resolveCrowd, type Crowd, type CrowdStands } from "./crowd.ts";
import { drawCrowd, KYOGIJO_CROWD_STYLE } from "./crowd.draw.ts";
import { parkLayout } from "./crowd.park.ts";
import { featureColours, featureStyle } from "./features.ts";
import { isLook, lookStyle } from "./look.ts";
import { lineLook, restyleLines } from "./restyle.ts";
import { KYOGIJO_MARK_STYLE } from "./mark.ts";
import { readSituation, situationSentences, type SituationContext, type SituationRead } from "./situation.ts";
import { badgeSituation, drawSituation } from "./situation.draw.ts";
import { KYOGIJO_SITUATION_STYLE } from "./situation.style.ts";
import { outlineOf } from "./outline.ts";
import { autoScore, pageantLayout, pageantOf, ratioOf, type Pageant, type PageantTeam } from "./pageant.ts";
import { emblemMarkup, picturesMarkup } from "./pageant.draw.ts";
import { KYOGIJO_PAGEANT_MOTION, KYOGIJO_PAGEANT_STYLE } from "./pageant.style.ts";
import { KYOGIJO_BASE_STYLE, KYOGIJO_CURLING_STYLE, KYOGIJO_FOLD_STYLE, KYOGIJO_NOTE_STYLE, KYOGIJO_WALLS_STYLE } from "./style.ts";
import { convertLength, type Unit } from "./units.ts";
import { baseball, fenceOutline } from "./surfaces/baseball.ts";
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
export const SPORTS: readonly Sport[] = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "soccer", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball", "swimming", "waterpolo", "diving", "artisticswimming", "athletics", "skating", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"];

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
  // Table tennis, squash (World Squash Singles Rules 2.3) and racquetball (IRF Rule 1.5) are played to the best of five games.
  return sport === "tabletennis" || sport === "squash" || sport === "racquetball" ? 5 : 3;
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

/** The athletics stadium: its plan, with the soccer pitch laid inside the track as the soccer builder draws it. */
function buildAthletics(o: SurfaceOptions, common: BuildOptions): Surface {
  const plan = athleticsPlan({ ...o, detail: common.detail });
  let embedded: Embedded | undefined;
  if (plan.pitch !== undefined) {
    const spec = plan.pitch.spec;
    const goals = common.goals ?? "box";
    const pitch = soccer(
      { spec, layout: layoutOf(spec), half: undefined, pattern: "bands", goals, flags: common.detail === "full", frame: undefined },
      { ...common, portrait: false, margin: 0, score: false, landmarks: false, id: `${common.id}-pitch` },
    );
    embedded = { base: pitchGroup(pitch.base), lines: pitch.lines, defs: pitch.defs };
  }
  // A cropped view has less ground round it than the stadium whole.
  return athleticsSurface(common, plan, embedded, common.margin ?? (o.range === undefined ? 20 : 5));
}

/** The skating rink: its plan, drawn as it lies. */
function buildSkating(o: SurfaceOptions, common: BuildOptions): Surface {
  const plan = skatingPlan({ ...o, detail: common.detail });
  return skatingSurface(common, plan, common.margin ?? (o.range === undefined ? 20 : 5));
}

/** What a drawing adds to what the builders are given: the features with a colour of their own, and a margin the annotations ask for. */
interface Extra {
  features: ReadonlySet<string> | undefined;
  margin?: number;
  /** The ground the annotations need beyond the cut of a range, which is not the surface's own margin. */
  room?: number;
  /** The drawing is a pageant: the teams' ends are not painted in their colours. */
  pageant?: boolean;
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
    pageant: extra.pageant === true ? true : undefined,
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
    case "padel":
    case "squash":
    case "racquetball":
    case "sepaktakraw":
    case "teqball":
    case "roundnet":
    case "netball":
      return netCourt(common, courtFor({ ...o, sport }));
    case "swimming":
      if (o.pool?.venue !== undefined) return natatorium(common, o.pool, commonOf(o.pool), o.language === "ja" ? "ja" : "en");
      return swimming(common, swimPlan({ ...o, sport }));
    case "waterpolo":
      return waterPolo(common, poloPlan(o));
    case "diving":
      return diving(common, divePlan(o));
    case "artisticswimming":
      return artistic(common, artisticPlan(o));
    case "lacrosse":
    case "rugby":
    case "afl":
    case "gaelic":
    case "cricket":
    case "fieldhockey":
    case "handball":
      return fieldSurface(common, fieldPlan({ ...o, sport, detail: common.detail }), { goals: common.goals });
    case "athletics":
      return buildAthletics({ ...o, sport }, common);
    case "skating":
      return buildSkating({ ...o, sport }, common);
    default:
      throw new Error(`Unknown sport "${String(o.sport)}": use one of ${SPORTS.join(", ")}`);
  }
}

/**
 * The crowd the options ask for, or `undefined` for none: a special game has none, and nor has a folded curling sheet (its houses are enlarged over where the stands would be, so the
 * stands would show only as strips behind the panels). A score on a curling sheet shows the whole sheet, which has its stands.
 */
function crowdOf(o: SurfaceOptions): Crowd | undefined {
  if (o.host !== undefined) return undefined;
  if (chooseLeague(o).sport === "curling" && !isScore(o) && sheetFor(o).show === "folded") return undefined;
  return resolveCrowd(o.crowd);
}

/** The surface the options ask for, cropped to their `range` when they have one (a curling sheet's named ranges are its builder's own: `sheet.show`). */
function buildSurface(o: SurfaceOptions, portrait: boolean, id: string, score: boolean, scored: boolean, extra: Extra): Surface {
  const crowd = crowdOf(o);
  const surface = crowd === undefined ? buildWhole(o, portrait, id, score, scored, extra) : buildCrowded(o, portrait, id, score, scored, extra, crowd);
  // A score on a curling sheet shows all of it, for the board's sake.
  if (o.range === undefined || (scored && chooseLeague(o).sport === "curling")) return surface;
  // A close-up of a start is the athletics builder's own view, turned to the start's line.
  if (chooseLeague(o).sport === "athletics" && rangeLabel(o) === "start") return surface;
  const given = typeof o.margin === "number" && Number.isFinite(o.margin) && o.margin >= 0 ? convertLength(o.margin, lengthUnit(o), "ft") : undefined;
  return cropToRange(surface, o, { id, margin: extra.room ?? extra.margin ?? given ?? surface.crowdMargin, panel: score });
}

/** The fence of the ballpark the options ask for, as the drawing has it, and how far behind home plate the backstop stands. */
function parkFence(o: SurfaceOptions): { points: ReturnType<typeof fenceFor>; backstop: number } {
  const unit = lengthUnit(o);
  const { league } = chooseLeague(o);
  if (league?.family === "baseball") {
    const diamond = diamondOf(league, o.year);
    return { points: fenceFor(parkById(o.park), feetFence(o.fence, unit), o.year, diamondFence(diamond)), backstop: diamond.backstop };
  }
  return { points: fenceFor(parkById(o.park), feetFence(o.fence, unit), o.year), backstop: MLB_DIAMOND.backstop };
}

/** The stands round a surface, laid out from its box (or, for a ballpark, from its fence). */
function standsFor(o: SurfaceOptions, surface: Surface, crowd: Crowd): CrowdStands {
  const { sport } = chooseLeague(o);
  const awaySide: Side = resolveHomeSide({ ...o, sport }) === "left" ? "right" : "left";
  if (sport === "mlb") {
    const { points, backstop } = parkFence(o);
    // The walls that have seats on top of them: the ones the package knows (Fenway Park's Green Monster), or, asked for, every wall of 25 feet or more.
    const park = parkById(o.park);
    const walls = park === undefined || crowd.wallSeats === false ? [] : parkWallsIn(park, o.year).filter((w) => (crowd.wallSeats === true ? w.height_ft >= 25 : w.label !== undefined && WALL_SEATS[park.id] === w.label));
    return parkLayout({ fence: fenceOutline(points), backstop, crowd, seatsOnWalls: walls.map((w) => ({ from: w.from, to: w.to, height: w.height_ft })) });
  }
  return crowdLayout({ sport, box: surface.whole ?? surface.box ?? { x: 0, y: 0, w: 100, h: 100 }, crowd, awaySide, ground: o.ground });
}

/** True when the drawing is asked to be small: `detail: "simple"` or a `width` under 480 pixels. */
const smallDrawing = (o: SurfaceOptions): boolean => {
  const w = typeof o.width === "number" ? o.width : typeof o.width === "string" && /^\s*\d+(?:\.\d+)?(?:px)?\s*$/.test(o.width) ? parseFloat(o.width) : undefined;
  return o.detail === "simple" || (w !== undefined && w < 480);
};

/** A surface with the stands and the crowd round it: the ground is made as wide as the stands need, then the stands are laid on it under the surface. */
function buildCrowded(o: SurfaceOptions, portrait: boolean, id: string, score: boolean, scored: boolean, extra: Extra, crowd: Crowd): Surface {
  let margin = extra.margin;
  if (!(typeof o.margin === "number" && Number.isFinite(o.margin) && o.margin >= 0)) {
    // How much ground the stands need beyond what the surface has with none, then the surface is made again with it.
    const probe = buildWhole({ ...o, margin: 0 }, portrait, id, score, scored, { ...extra, margin: undefined });
    const stands = standsFor(o, probe, crowd);
    const view = wideView(probe);
    const have = { left: stands.box.x - view.x, right: view.x + view.w - stands.box.x - stands.box.w, top: stands.box.y - view.y, bottom: view.y + view.h - stands.box.y - stands.box.h };
    const need = Math.max(stands.reach.left - have.left, stands.reach.right - have.right, stands.reach.top - have.top, stands.reach.bottom - have.bottom);
    margin = Math.max(margin ?? 0, need + 6);
  }
  const surface = buildWhole(o, portrait, id, score, scored, { ...extra, margin });
  const stands = standsFor(o, surface, crowd);
  const seats = stands.seats;
  const ground = groundById(o.ground)?.capacity;
  const fine = crowd.detail === "fine" || (crowd.detail === "auto" && !smallDrawing(o));
  const first = /^<[^>]*\/>/.exec(surface.base)?.[0] ?? "";
  const bg = /class="([^"]*)"/.exec(first)?.[1] ?? "ky-apron";
  const drawn = drawCrowd(stands, { id, crowd, density: densityOf(crowd, seats, ground), fine, ground: bg });
  surface.base = first + drawn.markup + surface.base.slice(first.length);
  surface.defs += drawn.defs;
  surface.lines += drawn.over;
  surface.crowdMargin = margin;
  return surface;
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
  // The crowd's colours: the home fans in the home team's colour and the visitors in the other's, or the colours the crowd names.
  const crowd = crowdOf(o);
  if (crowd !== undefined) {
    const homeLeft = resolveHomeSide({ ...o, sport: chooseLeague(o).sport }) === "left";
    props.push(`--ky-cr-home:${safeColour(crowd.home) ?? (homeLeft ? left : right) ?? `var(--ky-${homeLeft ? "left" : "right"})`}`);
    props.push(`--ky-cr-away:${safeColour(crowd.away) ?? (homeLeft ? right : left) ?? `var(--ky-${homeLeft ? "right" : "left"})`}`);
  }
  return props.join(";");
}

/** The round mark of a team, when its own `mark` or the score's `markShape` asks for one: the fit, the colour of its disc and the ink of its initials. */
function roundOf(team: Team, markShape: TeamMark | undefined): Pick<TeamView, "round" | "fit" | "color" | "ink"> | undefined {
  const shape = team.mark === "round" || team.mark === "plain" ? team.mark : markShape;
  if (shape !== "round") return undefined;
  return { round: true, fit: team.markFit === "contain" ? "contain" : undefined, color: safeColour(team.color), ink: safeColour(team.textColor) };
}

function teamView(team: Team, side: Side, role: "home" | "away", winner: "home" | "away" | "none", uppercase: boolean, sport: Sport, markShape?: TeamMark, theme?: "light" | "dark"): TeamView {
  const name = String(team.name ?? "");
  const abbr = (team.abbr !== undefined && team.abbr.trim() !== "" ? team.abbr.trim() : abbreviate(name)).slice(0, 5);
  const written = fieldScoreText(sport, team);
  const score = written ?? (team.score === undefined || team.score === null || String(team.score).trim() === "" ? "–" : String(team.score));
  return {
    side,
    role,
    name: uppercase ? capitals(name) : name,
    abbr,
    score,
    logo: safeLogo(team.logo, { color: team.color, accent: team.textColor, initials: abbr.slice(0, 3), theme }),
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

/** A team as the pageant lays it out. */
function pageantTeam(view: TeamView, team: Team): PageantTeam {
  return { side: view.side, role: view.role, name: view.name, abbr: view.abbr, state: view.state, href: view.logo, fit: team.markFit === "contain" ? "contain" : "cover", ratio: ratioOf(team), color: safeColour(team.color), ink: safeColour(team.textColor) };
}

/** True when the drawing is asked to be small: its `width` is under 320 pixels. The pageant then leaves out its fabric, hairlines and name pills. */
function tiny(width: SurfaceOptions["width"]): boolean {
  const px = typeof width === "number" ? width : typeof width === "string" && /^\d+(?:\.\d+)?(?:px)?$/.test(width.trim()) ? Number.parseFloat(width) : undefined;
  return px !== undefined && Number.isFinite(px) && px < 320;
}

/** What a pageant adds to a drawing: the pictures (under or over the lines), the emblem, the ids they need, and how small the plate is drawn. */
interface PageantParts {
  pictures: string;
  /** The names of the teams with no picture, written over the lines. */
  names: string;
  emblem: string;
  defs: string;
  plateScale: number;
}

/** The teams that fill the first and the second place of a surface: a diamond's outfield is the visitors' and its infield the home team's, whichever side each is on. */
function pageantPair(surface: Surface, t: { left: TeamView; right: TeamView; leftTeam: Team; rightTeam: Team }): [PageantTeam, PageantTeam] {
  const l = pageantTeam(t.left, t.leftTeam);
  const r = pageantTeam(t.right, t.rightTeam);
  return surface.pageant?.byRole === true && l.role === "home" ? [r, l] : [l, r];
}

function pageantParts(o: SurfaceOptions, surface: Surface, p: Pageant, t: { left: TeamView; right: TeamView; leftTeam: Team; rightTeam: Team; sport: Sport; id: string; plate: boolean; parts: boolean }): PageantParts | undefined {
  const [first, second] = pageantPair(surface, t);
  const layout = pageantLayout({ pageant: p, surface, outline: outlineOf(o), left: first, right: second, turned: surface.turned, sport: t.sport, plate: t.plate });
  if (layout === undefined) return undefined;
  // Cropped to a range, an emblem that does not lie wholly in what is shown is left out.
  const shown = surface.whole === undefined ? undefined : surface.box;
  if (layout.emblem !== undefined && shown !== undefined) {
    const e = layout.emblem;
    if (e.cx - e.r < shown.x || e.cx + e.r > shown.x + shown.w || e.cy - e.r < shown.y || e.cy + e.r > shown.y + shown.h) delete layout.emblem;
  }
  const draw = { id: t.id, turned: surface.turned, simple: o.detail === "simple" || tiny(o.width), parts: t.parts };
  const pictures = picturesMarkup(layout, p, draw);
  const emblem = emblemMarkup(layout, p, draw);
  return { pictures: pictures.markup, names: pictures.names, emblem: emblem.markup, defs: pictures.defs + emblem.defs, plateScale: layout.plateScale };
}

const trimmed = (value: number): string => String(Math.round(value * 100) / 100);

/** What a league's surface is, in a sentence fragment: its size or its bases, from the league's own figures in the unit its rulebook uses. */
function leagueAbout(league: League, year: number | undefined, language: Language, sheet?: { length: number; width: number }): string {
  const words = KYOGIJO_STRINGS[language].league;
  if (league.family === "skating") return skatingAbout({ sport: "skating", league: league.id }, language);
  if (league.family === "athletics") return athleticsAbout({ sport: "athletics", league: league.id, athletics: sheet === undefined ? undefined : undefined }, language);
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
          : isNetLeague(league)
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
  return fill(league.family === "volleyball" && league.id === "fivb-beach" ? words.beachVolleyball : league.family === "volleyball" && league.id === "wpv-sitting" ? words.sittingVolleyball : words[league.family], { size: text });
}

/** The football field a drawing is on, for a situation to know the yards between the goal lines and the downs a team has (the CFL's three). */
function footballFieldOf(o: SurfaceOptions, sport: Sport, league: League | undefined): { yards: number; downs: number } | undefined {
  if (sport !== "nfl" && sport !== "cfl" && sport !== "ifaf") return undefined;
  const spec = league?.family === "football" ? fieldOf(league, o.year) : sport === "ifaf" ? FOOTBALL.ifaf : footballIn(sport, o.year);
  return { yards: spec.length / 3, downs: spec.id === "cfl" ? 3 : 4 };
}

/** The situation the options ask for, read: which team attacks, which end, what is lit. `undefined` for none, for a sport that has no situation and for a special game. */
function situationOf(o: SurfaceOptions | ScoreOptions): SituationRead | undefined {
  if (o.situation === undefined || o.host !== undefined) return undefined;
  const { sport, league } = chooseLeague(o);
  const ctx: SituationContext = {
    sport,
    homeSide: resolveHomeSide({ ...o, sport }),
    direction: o.direction,
    football: footballFieldOf(o, sport, league),
    names: isScore(o) ? { home: String(o.home.name ?? ""), away: String(o.away.name ?? "") } : undefined,
    league: league?.id,
  };
  return readSituation(o.situation, ctx);
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
  const trackGround = sport === "athletics" ? groundById(o.ground) : undefined;
  const trackGroundName = trackGround === undefined ? undefined : groundNameIn(trackGround, o.year, language);
  const surfaceName = trackGroundName !== undefined ? fill(words.athletics.ground, { ground: trackGroundName }) : groundName !== undefined ? (language === "ja" ? `${groundName}のピッチ` : `${groundName}, soccer pitch`) : league !== undefined && parkName === undefined ? league.name[language] : parkName === undefined ? (pitch?.format === "futsal" ? words.soccer.futsal : words.surface[sport]) : language === "ja" ? `${parkName}のグラウンド` : `${parkName}, baseball field`;
  const { stop, colon, gap } = words.said;
  const sentence = (text: string): string => (/[.。]$/.test(text) ? text : `${text}${stop}`);
  const metres = (value: number): string => String(Math.round(value * 10) / 10);
  const plan = sport === "curling" ? sheetFor(o) : undefined;
  // A field sport: the surface as drawn, at the size the options ask for.
  const field = isFieldSport(sport) ? fieldPlan({ ...o, sport }) : undefined;
  const pools = isPoolSport(sport) ? poolDescription({ sport, pool: o.pool }, language) : undefined;
  const poolLine = pools === undefined ? "" : pools.after.map((line) => `${gap}${line}`).join("");
  const aboutText = pools !== undefined ? pools.about : sport === "skating" ? skatingAbout(o, language) : sport === "athletics" ? athleticsAbout(o, language) : field !== undefined ? leagueAbout(league ?? LEAGUES[sport as FieldSport][0], o.year, language, { length: field.length, width: field.width }) : plan !== undefined ? leagueAbout(plan.league, o.year, language, plan.spec) : league !== undefined ? leagueAbout(league, o.year, language) : pitch === undefined ? words.about[sport] : fill(pitch.format === "futsal" ? words.soccer.aboutFutsal : words.about.soccer, { length: metres(pitch.length), width: metres(pitch.width) });
  const about = `${words.said.on}${colon}${aboutText}${stop}${sport === "athletics" ? athleticsSentences(o, language) : sport === "skating" ? skatingSentences(o, language) : ""}`;
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
  // A situation says what the pill, the lit bases or the line of scrimmage show.
  const read = situationOf(o);
  const situationLine = read === undefined ? "" : situationSentences(read, language, isScore(o) ? { home: o.home.name, away: o.away.name } : undefined).map((line) => `${gap}${line}`).join("");
  if (!isScore(o)) return { title: o.title ?? special?.title ?? surfaceName, description: o.description ?? `${about}${parkLine}${eraLine}${rangeLine}${situationLine}${poolLine}` };
  const winner = winnerOf({ ...o, sport });
  // A pageant says what lies on each half, and the emblem in the middle.
  const pageant = pageantOf(o);
  const pg = KYOGIJO_STRINGS[language].pageant;
  const pageantLine = pageant === undefined ? "" : `${gap}${pageant.style === "stage" ? pg.stage : pg.carpet}${pageant.emblem === undefined ? "" : `${gap}${pageant.emblem.name === undefined ? pg.emblem : fill(pg.emblemNamed, { name: pageant.emblem.name })}`}`;
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
  const netLine = !hasSetsBoard(sport)
    ? ""
    : order
        .flatMap((team) => [
          team.serving === true ? fill(net.serving, { name: team.name }) : "",
          Array.isArray(team.sets) && team.sets.length > 0 ? fill(BOARD[sport] === "games" ? net.byGame : net.bySet, { name: team.name, list: setList(team) }) : "",
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
    description: o.description ?? `${extra === "" ? "" : `${sentence(extra)}${gap}`}${sentence(line)}${result}${tied}${curlingLine}${netLine}${fieldLine}${gap}${about}${parkLine}${eraLine}${rangeLine}${situationLine}${pageantLine}${poolLine}`.trim(),
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
  return withEmblems(o.emblems, () => drawnKyogijo(o));
}

function drawnKyogijo(o: SurfaceOptions | ScoreOptions): string {
  if (o.host !== undefined && o.range !== undefined) return drawKyogijo({ ...o, range: undefined });
  // A special game is a surface set inside another, drawn to scale with no stands.
  if (o.host !== undefined && o.crowd !== undefined) return drawKyogijo({ ...o, crowd: undefined });
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
  // A pageant that sends the score to the strip makes the drawing compact; a tall curling sheet cannot have a strip, so its board stays in the middle and the emblem is left out.
  let pageant: Pageant | undefined = isScore(o) ? pageantOf(o) : undefined;
  if (pageant !== undefined && pageant.score === "strip") {
    if (sport === "curling" && portrait) pageant = { ...pageant, score: "centre", emblem: undefined };
    else if (sized === "full") sized = "compact";
  }
  // The situation of the game (hockey's skaters, baseball's runners, football's down), decided once: the surface, the badge and the description draw from it.
  const situation = situationOf(o);
  // A situation that is not drawn (a sport that has none, nothing the sport can have in it) leaves the drawing, its ids included, as it was.
  const id = drawingId(o.situation !== undefined && situation === undefined ? { ...o, situation: undefined } : o);
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
    const home = teamView(o.home, homeSide, "home", winner, uppercase, sport, o.markShape, o.theme === "light" || o.theme === "dark" ? o.theme : undefined);
    const away = teamView(o.away, awaySide, "away", winner, uppercase, sport, o.markShape, o.theme === "light" || o.theme === "dark" ? o.theme : undefined);
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
  const crowded = crowdOf(o) !== undefined;
  const style = colourStyle(o, { left: leftTeam, right: rightTeam, home: isScore(o) ? o.home : undefined, away: isScore(o) ? o.away : undefined }, featured);
  const palette = isLook(o.look) ? o.look : undefined;
  let notes: Notes | undefined;
  const theme = o.theme === "light" || o.theme === "dark" ? o.theme : undefined;

  let viewBox: string;
  let body: string;
  let defs = "";
  let grounded = false;
  let foldedSheet = false;
  let pg: PageantParts | undefined;
  if (isScore(o) && left !== undefined && right !== undefined && sized === "badge") {
    const badge = badgeMarkup(left, right, { sport, status, parts, id, situation: situation === undefined ? undefined : badgeSituation(situation, language) });
    viewBox = `0 0 ${badge.w} ${badge.h}`;
    body = badge.markup;
  } else {
    // A special game: the drawing's own surface is built with no ground round it and set inside the host.
    const make = (more: Extra): Surface => {
      if (o.host === undefined) return buildSurface(o, portrait, id, isScore(o) && sized === "full", isScore(o), more);
      const guest = buildSurface({ ...o, margin: 0 }, false, id, isScore(o) && sized === "full", isScore(o), more);
      return composeSpecial(o, guest, (host, hostId) => buildSurface(host, false, hostId, false, false, { features: undefined }), id);
    };
    let surface = make({ features, pageant: pageant !== undefined });
    // The score of a pageant with no emblem and no board: the plate stays in the middle if the pictures lose little to it, else it goes to the strip and the surface is built again.
    if (pageant !== undefined && pageant.score === "auto") {
      let score: "centre" | "strip" = "centre";
      if (isScore(o) && left !== undefined && right !== undefined && leftTeam !== undefined && rightTeam !== undefined && sized === "full") {
        const [first, second] = pageantPair(surface, { left, right, leftTeam, rightTeam });
        score = autoScore({ pageant, surface, outline: outlineOf(o), left: first, right: second, turned: surface.turned, sport, plate: true });
      }
      pageant = { ...pageant, score };
      if (score === "strip") {
        sized = "compact";
        surface = make({ features, pageant: true });
      }
    }
    foldedSheet = surface.folded === true;
    // A range too small to hold the score's panel: the score goes to the strip under the drawing, as a compact card does.
    if (surface.plateFits === false) {
      sized = "compact";
      surface = buildSurface(o, portrait, id, false, true, { features, pageant: pageant !== undefined });
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
        surface = make({ features, pageant: pageant !== undefined, margin: notes.need > have + 0.01 ? notes.need : undefined, room: notes.need });
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
    // The situation: a tint under the lines, and the rest over them and the data (cut with the surface when it is cropped).
    const sit =
      situation === undefined
        ? undefined
        : drawSituation(situation, surface, {
            id,
            language,
            homeSide,
            abbrs: left !== undefined && right !== undefined ? ({ [left.role]: left.abbr, [right.role]: right.abbr } as { home: string; away: string }) : undefined,
            plate: isScore(o) && sized === "full" && o.plate !== false,
          });
    const cutSit = (markup: string): string => (markup !== "" && surface.defs.includes(`id="${id}-rg"`) ? el("g", { "clip-path": `url(#${id}-rg)` }, markup) : markup);
    let inner = ground.base + (sit === undefined ? "" : cutSit(sit.under));
    if (sit !== undefined) defs += sit.defs;
    let teams = "";
    // A pageant lays each team's picture over its half, in place of the names painted at the ends.
    if (pageant !== undefined && isScore(o) && left !== undefined && right !== undefined && leftTeam !== undefined && rightTeam !== undefined && (sized === "full" || sized === "compact")) {
      pg = pageantParts(o, surface, pageant, { left, right, leftTeam, rightTeam, sport, id, plate: sized === "full", parts });
      if (pg !== undefined) {
        defs += pg.defs;
        if (sized === "full" && pg.plateScale !== 1) surface.plate = { ...surface.plate, w: surface.plate.w * pg.plateScale, h: surface.plate.h * pg.plateScale };
      }
    }
    if (isScore(o) && left !== undefined && right !== undefined && sized === "full" && pg === undefined) {
      const onColour = surface.onColour ?? (sport === "nfl" || sport === "cfl" || sport === "ifaf" || sport === "soccer");
      // A curling sheet, the net sports' courts and a cricket ground have no place for the names: the board names the teams.
      if (sport !== "curling" && !hasSetsBoard(sport) && sport !== "cricket") {
        // Cropped to a range, a team's name is written only where its place is in what is shown.
        if (shows(surface, surface.left)) teams += bannerMarkup(surface.left, left, { turned: surface.turned, onColour, parts, id });
        if (shows(surface, surface.right)) teams += bannerMarkup(surface.right, right, { turned: surface.turned, onColour, parts, id });
      }
    }
    // The teams are painted under the lines, unless the surface asks for them over (a panel that must hide them).
    if (pg !== undefined && pageant !== undefined) {
      // A surface cropped with room for its annotations is clipped to the cut; the pictures are cut with it.
      const cut = surface.defs.includes(`id="${id}-rg"`);
      const laid = cut ? el("g", { "clip-path": `url(#${id}-rg)` }, pg.pictures) : pg.pictures;
      inner += pageant.lines !== "over" ? surface.lines + laid + pg.names + pg.emblem : laid + surface.lines + pg.names + pg.emblem;
    } else inner += surface.bannersOver === true ? surface.lines + teams : teams + surface.lines;
    // Data goes over the markings and under the score's panel.
    const layered = renderLayers(o, o.layers, surface.turned, surface.whole === undefined ? undefined : surface.box, surface.upright);
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
    if (sit !== undefined) inner += cutSit(sit.over);
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
      } else if (hasSetsBoard(sport)) {
        const board = setsBoardMarkup(surface.plate, left, right, { competition: o.competition, foot: foot === "" ? undefined : foot, head: KYOGIJO_STRINGS[language].net[BOARD[sport] === "games" ? "games" : "sets"], points: KYOGIJO_STRINGS[language].net.points }, { parts, least: minSets(sport, chooseLeague(o).league?.id) });
        inner += el("g", { transform: `translate(${num(surface.plate.cx)} ${num(surface.plate.cy)})${surface.turned ? " rotate(-90)" : ""}` }, board);
      } else inner += plateMarkup(surface.plate, left, right, { competition: o.competition, foot: foot === "" ? undefined : foot }, { turned: surface.turned, parts, surfaceSport: sport });
    }
    const group = el("g", { class: "ky-surface-group", transform: surface.turn, part: parts ? "surface" : undefined, ...(o.pointer === true ? fieldAttributes({ ...o, sport }) : {}) }, inner);
    const v = surface.view;
    if (isScore(o) && left !== undefined && right !== undefined && sized === "compact") {
      const badge = badgeMarkup(left, right, { sport, status, parts, id, situation: situation === undefined ? undefined : badgeSituation(situation, language) });
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
      "data-track": sport === "athletics" ? o.athletics?.track : undefined,
      "data-winner": isScore(o) ? winner : undefined,
      "data-pageant": pg === undefined ? undefined : pageant?.style,
      "data-version": VERSION,
      width: safeLength(o.width),
      height: safeLength(o.height),
      part: parts ? "svg" : undefined,
      style: style === "" ? undefined : style,
    },
    `<title id="${titleId}">${esc(title)}</title><desc id="${descId}">${esc(description)}</desc>` +
      (o.style === "none" ? "" : `<style>${KYOGIJO_BASE_STYLE}${left?.round === true || right?.round === true || (pg !== undefined && pageant?.style === "stage") || (pg !== undefined && pageant?.emblem?.shape !== "plain" && pageant?.emblem !== undefined) ? `\n${KYOGIJO_MARK_STYLE}` : ""}${pg === undefined ? "" : `\n${KYOGIJO_PAGEANT_STYLE}${pageant?.animate === undefined || pageant.animate === "none" ? "" : `\n${KYOGIJO_PAGEANT_MOTION}`}`}${sport === "curling" ? `\n${KYOGIJO_CURLING_STYLE}` : ""}${foldedSheet ? `\n${KYOGIJO_FOLD_STYLE}` : ""}${isPoolSport(sport) ? `\n${o.pool?.venue !== undefined ? KYOGIJO_POOL_STYLE : poolStyle({ sport, ...commonOf(o.pool ?? {}), race: o.pool?.race !== undefined, section: o.pool?.section !== undefined && o.pool.section !== false })}` : ""}${plan === undefined ? "" : `\n${courtStyle(plan.sport, plan.look)}`}${fieldsStyle(sport) === "" ? "" : `\n${fieldsStyle(sport)}`}${athleticsStyle(sport) === "" ? "" : `\n${athleticsStyle(sport)}`}${skatingStyle(sport) === "" ? "" : `\n${skatingStyle(sport)}`}${palette === undefined ? "" : `\n${lookStyle(palette)}`}${athleticsTrackRules(sport, o.athletics?.track) === "" ? "" : `\n${athleticsTrackRules(sport, o.athletics?.track)}`}${walled ? `\n${KYOGIJO_WALLS_STYLE}` : ""}${hardwood ? `\n${KYOGIJO_HARDWOOD_STYLE}` : ""}${features === undefined ? "" : `\n${featureStyle(sport, features)}`}${notes === undefined || notes.svg === "" ? "" : `\n${KYOGIJO_NOTE_STYLE}`}${grounded ? `\n${KYOGIJO_BACKGROUND_STYLE}` : ""}${crowded ? `\n${KYOGIJO_CROWD_STYLE}` : ""}${situation === undefined ? "" : `\n${KYOGIJO_SITUATION_STYLE}`}${o.host === undefined ? "" : `\n${specialStyle(hostSport(o.host))}`}</style>`) +
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

/**
 * The stands round a surface as data: the rings of seats with their outlines, heights and rake, the blocks of visitors and the places left open, in feet in the surface's
 * wide frame, so that another view (a 3D one) can raise them. `undefined` when the options ask for no crowd (or for a special game, which has none).
 * @example
 * ```ts
 * import { crowdStands } from "@johnmorrisdotca/kyogijo-stadiums";
 * const stands = crowdStands({ sport: "soccer", crowd: true });
 * console.log(stands?.rings.map((ring) => ring.id).join(" "), stands?.shape, stands?.stadium);
 * // lower upper bowl purpose
 * ```
 */
export function crowdStands(o: SurfaceOptions): CrowdStands | undefined {
  const crowd = crowdOf(o);
  if (crowd === undefined) return undefined;
  const probe = buildWhole({ ...o, margin: 0 }, false, drawingId(o), false, false, { features: undefined });
  return standsFor(o, probe, crowd);
}
