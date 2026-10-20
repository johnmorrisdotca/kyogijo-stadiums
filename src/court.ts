// What a net sport's court is for a set of options: the league's figures in feet, the look, the free zone, and the lines, areas and fixtures that follow from
// them, as plain rectangles (and, for the circles of a few sports, rings) in the frame of a drawing lying wide (x along the court from the left end line, y across it from
// the top side line, both in feet).
// Kept apart from the drawing so that the outline, the description, the tests and the drawing agree. Every length that is a rulebook's figure is cited in
// docs/sources.md; the sizes of the symbols (a post, an antenna, the net's line) are ours and are said to be.
import { chooseLeague, netOf, type League } from "./leagues.ts";
import { BADMINTON_LEAGUES, NETBALL_LEAGUES, PADEL_LEAGUES, PICKLEBALL_LEAGUES, RACQUETBALL_LEAGUES, ROUNDNET_LEAGUES, SEPAK_TAKRAW_LEAGUES, SQUASH_LEAGUES, TABLE_TENNIS_LEAGUES, TENNIS_LEAGUES, TEQBALL_LEAGUES, VOLLEYBALL_LEAGUES, type BadmintonFigures, type BadmintonLeague, type FreeZone, type NetLeague, type NetSport, type NetballFigures, type NetballLeague, type PadelFigures, type PadelLeague, type PickleballFigures, type PickleballLeague, type RacquetballFigures, type RacquetballLeague, type RoundnetFigures, type RoundnetLeague, type SepakTakrawFigures, type SepakTakrawLeague, type SquashFigures, type SquashLeague, type TableTennisFigures, type TableTennisLeague, type TennisFigures, type TennisLeague, type TeqballFigures, type TeqballLeague, type VolleyballFigures, type VolleyballLeague } from "./leagues/courts.ts";
import { netballGeometry, none, padelGeometry, racquetballGeometry, roundnetGeometry, sepakTakrawGeometry, squashGeometry, teqballGeometry } from "./court.more.ts";
import type { SurfaceOptions } from "./types.ts";
import { convertLength } from "./units.ts";

/** A rectangle as `[x0, y0, x1, y1]`, in feet. */
export type Rect = readonly [x0: number, y0: number, x1: number, y1: number];

/** A post, an antenna or a stick: a mark of a size, centred on a place. */
export interface Fixture {
  x: number;
  y: number;
  /** The width of a square mark, or the diameter of a round one. */
  size: number;
  shape: "square" | "round";
}

/** The net's plane in the drawing: the line x = `x`, from `y0` to `y1`. */
export interface NetLine {
  x: number;
  y0: number;
  y1: number;
}

/**
 * A line drawn as a circle or an arc of one: `r` is the outer radius (the rulebooks measure to the outside of a line), `w` the line's width and `a0` to `a1` the arc,
 * in radians from the +x axis towards +y (down the page), the whole circle when they are missing.
 */
export interface Ring {
  cx: number;
  cy: number;
  r: number;
  w: number;
  a0?: number;
  a1?: number;
}

/**
 * Something that stands round or beside the court, as a rectangle: a wall (solid), the metal fence between a padel court's walls (`mesh`), the front wall of a squash court
 * laid out flat beside it (`face`) with its tin (`tin`).
 */
export interface Band {
  rect: Rect;
  kind: "wall" | "mesh" | "face" | "tin";
}

/** A solid object on the court: a teqball table (a rectangle) or a roundnet set (a disc). */
export type Solid = { kind: "table"; rect: Rect } | { kind: "set"; cx: number; cy: number; r: number } | { kind: "chair"; rect: Rect } | { kind: "desk"; rect: Rect };

/** The looks each sport has, the sport's default first. */
export const LOOKS: Readonly<Record<NetSport, readonly string[]>> = Object.freeze({
  tennis: ["hard-blue", "hard-green", "clay", "grass"],
  volleyball: ["wood", "blue", "sand"],
  badminton: ["green", "blue", "wood"],
  pickleball: ["blue-green", "green", "red"],
  tabletennis: ["blue", "green"],
  padel: ["blue", "green", "terracotta"],
  squash: ["wood", "blue"],
  racquetball: ["wood", "convertible"],
  sepaktakraw: ["blue", "green", "wood"],
  teqball: ["grey", "blue", "green"],
  roundnet: ["grass", "sand", "indoor"],
  netball: ["wood", "blue", "green"],
});

/** How each sport's board counts: in sets, in games, or (netball) as one total, as any other score is drawn. */
export const BOARD: Readonly<Record<NetSport, "sets" | "games" | "total">> = Object.freeze({
  tennis: "sets",
  volleyball: "sets",
  badminton: "games",
  pickleball: "games",
  tabletennis: "games",
  padel: "sets",
  squash: "games",
  racquetball: "games",
  sepaktakraw: "sets",
  teqball: "sets",
  roundnet: "games",
  netball: "total",
});

/** True for a sport whose court is one of these. */
export const isNetSport = (sport: string): sport is NetSport => Object.prototype.hasOwnProperty.call(BOARD, sport);

/** True for a league of one of these courts. */
export const isNetLeague = (league: League): league is NetLeague => isNetSport(league.family);

/** True for a sport whose score is a board of sets or games (all of these courts but netball's). */
export const hasSetsBoard = (sport: string): sport is NetSport => isNetSport(sport) && BOARD[sport] !== "total";

interface Common {
  /** The look: a name from `LOOKS`. */
  look: string;
  /** The free zone drawn round the court, in feet, or `null`. */
  zone: FreeZone;
  /** How the free zone was asked for. */
  free: "official" | "least" | "none";
  /** Table tennis: the kind of event the playing area is for, and whether its surrounds and its umpires' places are drawn. */
  area: "standard" | "masters" | "wheelchair";
  surrounds: boolean;
  umpires: boolean;
  /** Tennis: the singles sticks are drawn. */
  sticks: boolean;
}

/** A court to draw: the sport, its league and figures (in feet), and how it is shown. */
export type CourtPlan =
  | (Common & { sport: "tennis"; league: TennisLeague; figures: TennisFigures })
  | (Common & { sport: "volleyball"; league: VolleyballLeague; figures: VolleyballFigures })
  | (Common & { sport: "badminton"; league: BadmintonLeague; figures: BadmintonFigures })
  | (Common & { sport: "pickleball"; league: PickleballLeague; figures: PickleballFigures })
  | (Common & { sport: "tabletennis"; league: TableTennisLeague; figures: TableTennisFigures })
  | (Common & { sport: "padel"; league: PadelLeague; figures: PadelFigures })
  | (Common & { sport: "squash"; league: SquashLeague; figures: SquashFigures })
  | (Common & { sport: "racquetball"; league: RacquetballLeague; figures: RacquetballFigures })
  | (Common & { sport: "sepaktakraw"; league: SepakTakrawLeague; figures: SepakTakrawFigures })
  | (Common & { sport: "teqball"; league: TeqballLeague; figures: TeqballFigures })
  | (Common & { sport: "roundnet"; league: RoundnetLeague; figures: RoundnetFigures })
  | (Common & { sport: "netball"; league: NetballLeague; figures: NetballFigures });

const FREE = ["official", "least", "none"] as const;
const AREAS = ["standard", "masters", "wheelchair"] as const;

/**
 * The court the options ask for. A `league` picks the rulebook (the sport's own by default; `fivb-beach` for beach volleyball); `net.look` a named look, `net.free`
 * the free zone, `net.sticks` the tennis singles sticks.
 * @throws Error when the look or the free zone is not one the sport has.
 */
export function courtFor(o: Pick<SurfaceOptions, "sport" | "league" | "net">): CourtPlan {
  const sport = o.sport;
  if (!isNetSport(sport)) throw new Error(`"${String(sport)}" is not a net sport`);
  const picked = chooseLeague(o).league;
  const asked = o.net ?? {};
  const free = asked.free === undefined ? "official" : (FREE as readonly string[]).includes(asked.free) ? asked.free : undefined;
  if (free === undefined) throw new Error(`Unknown free zone "${String(asked.free)}": use one of ${FREE.join(", ")}`);
  const beach = picked?.family === "volleyball" && picked.id === "fivb-beach";
  // World ParaVolley asks for a light indoor floor and white lines (Rule 1.2.2): of the volleyball looks only the wooden floor, and not the beach's sand.
  const names = picked?.id === "wpv-sitting" ? LOOKS.volleyball.slice(0, 1) : LOOKS[sport];
  const look = asked.look === undefined ? (beach ? "sand" : names[0]) : asked.look;
  if (!names.includes(look)) throw new Error(`Unknown look "${String(look)}" for ${sport}: use one of ${names.join(", ")}`);
  const area = asked.area === undefined ? (free === "least" ? "masters" : "standard") : (AREAS as readonly string[]).includes(asked.area) ? asked.area : undefined;
  if (area === undefined) throw new Error(`Unknown area "${String(asked.area)}": use one of ${AREAS.join(", ")}`);
  if (asked.area !== undefined && sport !== "tabletennis") throw new Error(`net.area is for table tennis, not "${sport}"`);
  const common = { look, free, sticks: sport === "tennis" && asked.sticks === true, area, surrounds: asked.surrounds !== false, umpires: asked.umpires !== false };
  const zoneOf = (zones: { official: FreeZone; least: FreeZone }): FreeZone => (free === "none" ? null : zones[free]);
  switch (sport) {
    case "tennis": {
      const league = picked?.family === "tennis" ? picked : TENNIS_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "volleyball": {
      const league = picked?.family === "volleyball" ? picked : VOLLEYBALL_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "badminton": {
      const league = picked?.family === "badminton" ? picked : BADMINTON_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "pickleball": {
      const league = picked?.family === "pickleball" ? picked : PICKLEBALL_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "tabletennis": {
      const league = picked?.family === "tabletennis" ? picked : TABLE_TENNIS_LEAGUES[0];
      const figures = netOf(league);
      // The playing area is the space of the event's kind, the table centred in it; `free` says whether one is drawn at all.
      const space = figures.space[area];
      const zone: FreeZone = free === "none" ? null : { side: (space.width - figures.width) / 2, end: (space.length - figures.length) / 2 };
      return { ...common, sport, league, figures, zone };
    }
    case "padel": {
      const league = picked?.family === "padel" ? picked : PADEL_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "squash": {
      const league = picked?.family === "squash" ? picked : SQUASH_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "racquetball": {
      const league = picked?.family === "racquetball" ? picked : RACQUETBALL_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "sepaktakraw": {
      const league = picked?.family === "sepaktakraw" ? picked : SEPAK_TAKRAW_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "teqball": {
      const league = picked?.family === "teqball" ? picked : TEQBALL_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    case "roundnet": {
      const league = picked?.family === "roundnet" ? picked : ROUNDNET_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport, league, figures, zone: zoneOf(figures.free) };
    }
    default: {
      const league = picked?.family === "netball" ? picked : NETBALL_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport: "netball", league, figures, zone: zoneOf(figures.free) };
    }
  }
}

/** The length and the width of the court in feet: a tennis court is the doubles court. */
export function courtSize(plan: CourtPlan): { length: number; width: number } {
  const f = plan.figures;
  return { length: f.length, width: plan.sport === "tennis" ? (f as TennisFigures).widthDoubles : (f as { width: number }).width };
}

/** The court's lines, painted areas and fixtures, in feet. */
export interface CourtGeometry {
  length: number;
  width: number;
  /** The lines, as the rectangles they cover. */
  lines: Rect[];
  /** Painted areas: the non-volley zones, the volleyball front zones. */
  areas: Rect[];
  /** Short lines outside the court (the attack line's extension, the service zone's limits), a part of `lines` that is drawn only in the full detail. */
  small: Rect[];
  /** The net across the middle, or `null` for a court without one (squash, racquetball, roundnet's circle, netball). */
  net: NetLine | null;
  posts: Fixture[];
  antennae: Fixture[];
  sticks: Fixture[];
  /** Lines drawn as circles and arcs (sepak takraw, netball, roundnet). */
  rings: Ring[];
  /** Walls, fences and the like round or beside the court, outside its rectangle. */
  bands: Band[];
  /** A table or a set standing on the court. */
  solids: Solid[];
  /** Lines painted on a wall, laid flat beside the court (squash's front wall): they may be another colour than the floor's. */
  wallLines: Rect[];
  /** The width of a line that runs beneath the net from side to side (volleyball's and sepak takraw's centre line): it shows between the net's edges. */
  underNet: number | null;
}


const feet = (metres: number): number => convertLength(metres, "m", "ft");

/**
 * Where everything stands, from the figures of the league in feet. A line's rectangle covers the line's width: the court's dimensions are to the outside edge of the
 * lines (tennis Rule 1, pickleball 3.A.2, badminton Law 1.1 and Diagram A, volleyball 1.3.2 "drawn inside the dimensions"), so an end line covers
 * x from 0 to its width and an interior line is placed by the edge the rule measures to.
 */
export function courtGeometry(plan: CourtPlan): CourtGeometry {
  switch (plan.sport) {
    case "tennis":
      return tennisGeometry(plan.figures, plan.sticks);
    case "volleyball":
      return volleyballGeometry(plan.figures, plan.free);
    case "badminton":
      return badmintonGeometry(plan.figures);
    case "pickleball":
      return pickleballGeometry(plan.figures);
    case "tabletennis":
      return tableGeometry(plan.figures, plan);
    case "padel":
      return padelGeometry(plan.figures);
    case "squash":
      return squashGeometry(plan.figures);
    case "racquetball":
      return racquetballGeometry(plan.figures);
    case "sepaktakraw":
      return sepakTakrawGeometry(plan.figures);
    case "teqball":
      return teqballGeometry(plan.figures);
    case "roundnet":
      return roundnetGeometry(plan.figures);
    default:
      return netballGeometry(plan.figures);
  }
}

function tennisGeometry(f: TennisFigures, sticks: boolean): CourtGeometry {
  const { length: L, widthDoubles: W, widthSingles, serviceLine: S, lineWidth: w } = f;
  const cx = L / 2;
  const cy = W / 2;
  const inset = (W - widthSingles) / 2;
  const cw = f.centreServiceWidth;
  const mw = f.centreMark.width;
  const ml = f.centreMark.length;
  const lines: Rect[] = [
    // Baselines, doubles sidelines and singles sidelines.
    [0, 0, w, W], [L - w, 0, L, W],
    [0, 0, L, w], [0, W - w, L, W],
    [0, inset, L, inset + w], [0, W - inset - w, L, W - inset],
    // The service lines, between the singles sidelines, each 21 feet from the net to its outside edge, and the centre service line between them.
    [cx - S, inset, cx - S + w, W - inset], [cx + S - w, inset, cx + S, W - inset],
    [cx - S, cy - cw / 2, cx + S, cy + cw / 2],
    // The centre marks, inside the court from each baseline.
    [w, cy - mw / 2, w + ml, cy + mw / 2], [L - w - ml, cy - mw / 2, L - w, cy + mw / 2],
  ];
  const out = f.net.postsOutside;
  return {
    length: L,
    width: W,
    lines,
    areas: [],
    small: [],
    net: { x: cx, y0: -out, y1: W + out },
    posts: [{ x: cx, y: -out, size: f.net.postSize, shape: "square" }, { x: cx, y: W + out, size: f.net.postSize, shape: "square" }],
    antennae: [],
    sticks: sticks ? [{ x: cx, y: inset - f.net.sticksOutside, size: f.net.stickSize, shape: "square" }, { x: cx, y: W - inset + f.net.sticksOutside, size: f.net.stickSize, shape: "square" }] : [],
    ...none(),
  };
}

function volleyballGeometry(f: VolleyballFigures, free: "official" | "least" | "none"): CourtGeometry {
  const { length: L, width: W, lineWidth: w } = f;
  const cx = L / 2;
  const lines: Rect[] = [[0, 0, w, W], [L - w, 0, L, W], [0, 0, L, w], [0, W - w, L, W]];
  const areas: Rect[] = [];
  const small: Rect[] = [];
  if (f.attackLine !== null) {
    const A = f.attackLine;
    // The axis of the centre line is the middle of the court; each attack line's rear edge is 3 m from it.
    lines.push([cx - w / 2, 0, cx + w / 2, W], [cx - A, 0, cx - A + w, W], [cx + A - w, 0, cx + A, W]);
    areas.push([cx - A, 0, cx, W], [cx, 0, cx + A, W]);
    const ext = f.attackExtension;
    // The FIVB's competitions extend each attack line beyond the side lines by five short lines, the first 20 cm from the side line.
    if (ext !== null && free !== "least") {
      for (const [x0, x1] of [[cx - A, cx - A + w], [cx + A - w, cx + A]] as const) {
        for (let i = 0; i < Math.round(ext.total / (ext.length + ext.gap)); i += 1) {
          const near = ext.gap + i * (ext.length + ext.gap);
          small.push([x0, -(near + ext.length), x1, -near], [x0, W + near, x1, W + near + ext.length]);
        }
      }
    }
  }
  const marks = f.serviceMarks;
  // The service zone is limited by two short lines in the extensions of the side lines, 20 cm behind the end line.
  if (marks !== null) {
    for (const [a, b] of [[-(marks.behind + marks.length), -marks.behind], [L + marks.behind, L + marks.behind + marks.length]] as const) small.push([a, 0, b, w], [a, W - w, b, W]);
  }
  const out = free === "least" ? f.net.postsOutsideLeast : f.net.postsOutside;
  const half = (W - f.net.length) / 2;
  const post = Math.max(feet(0.1), L * 0.01);
  const antenna = Math.max(f.net.antenna.diameter, L * 0.012);
  return {
    length: L,
    width: W,
    lines,
    areas,
    small,
    net: { x: cx, y0: half, y1: W - half },
    posts: [{ x: cx, y: -out, size: post, shape: "round" }, { x: cx, y: W + out, size: post, shape: "round" }],
    // An antenna is fixed at the outer edge of a side band, which stands directly over the side line: at the outer edge of the side line.
    antennae: [{ x: cx, y: 0, size: antenna, shape: "round" }, { x: cx, y: W, size: antenna, shape: "round" }],
    sticks: [],
    ...none(),
    underNet: f.attackLine === null ? null : w,
  };
}

function badmintonGeometry(f: BadmintonFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w, singlesInset: inset, doublesLongServiceInset: ls, shortServiceLine: ss } = f;
  const cx = L / 2;
  const lines: Rect[] = [
    [0, 0, w, W], [L - w, 0, L, W],
    [0, 0, L, w], [0, W - w, L, W],
    // The singles side lines: their outside edges 460 mm inside the doubles side lines' (Diagram A: 40 + 420).
    [0, inset, L, inset + w], [0, W - inset - w, L, W - inset],
    // The doubles long service lines: their outside edges 760 mm inside the back boundary lines'.
    [ls, 0, ls + w, W], [L - ls - w, 0, L - ls, W],
    // The short service lines: their edges nearer the net 1.98 m from it.
    [cx - ss - w, 0, cx - ss, W], [cx + ss, 0, cx + ss + w, W],
    // The centre lines, from each short service line to the back boundary.
    [0, W / 2 - w / 2, cx - ss - w, W / 2 + w / 2], [cx + ss + w, W / 2 - w / 2, L, W / 2 + w / 2],
  ];
  const post = L * 0.005;
  return {
    length: L,
    width: W,
    lines,
    areas: [],
    small: [],
    net: { x: cx, y0: 0, y1: W },
    // The posts stand on the doubles side lines and do not reach into the court beyond them (Law 1.5).
    posts: [{ x: cx, y: w - post / 2, size: post, shape: "round" }, { x: cx, y: W - w + post / 2, size: post, shape: "round" }],
    antennae: [],
    sticks: [],
    ...none(),
  };
}

function pickleballGeometry(f: PickleballFigures): CourtGeometry {
  const { length: L, width: W, lineWidth: w, nonVolley: K } = f;
  const cx = L / 2;
  const lines: Rect[] = [
    [0, 0, w, W], [L - w, 0, L, W],
    [0, 0, L, w], [0, W - w, L, W],
    // The non-volley zone lines, each 7 feet from the net to its outside edge, and the centrelines from them to the baselines.
    [cx - K, 0, cx - K + w, W], [cx + K - w, 0, cx + K, W],
    [0, W / 2 - w / 2, cx - K, W / 2 + w / 2], [cx + K, W / 2 - w / 2, L, W / 2 + w / 2],
  ];
  // The posts are 22 feet apart, inside to inside, so the inside of each stands 1 foot outside a sideline; each is at most 3 inches across.
  const gap = (f.net.postsInside - W) / 2;
  const d = f.net.postDiameter;
  return {
    length: L,
    width: W,
    lines,
    areas: [[cx - K, 0, cx, W], [cx, 0, cx + K, W]],
    small: [],
    net: { x: cx, y0: -gap, y1: W + gap },
    posts: [{ x: cx, y: -gap - d / 2, size: d, shape: "round" }, { x: cx, y: W + gap + d / 2, size: d, shape: "round" }],
    antennae: [],
    sticks: [],
    ...none(),
  };
}

function tableGeometry(f: TableTennisFigures, plan: Pick<Common, "zone" | "surrounds" | "umpires">): CourtGeometry {
  const { length: L, width: W, edgeLine: e, centreLine: c } = f;
  const cx = L / 2;
  const out = f.net.postOutside;
  const post = Math.max(feet(0.03), L * 0.01);
  const bands: Band[] = [];
  const solids: Solid[] = [];
  const zone = plan.zone;
  if (zone !== null) {
    // The playing area is enclosed by surrounds, which are part of it (3.2.3.2 and 3.2.3.3): four boards along the edge of the space, inside it.
    if (plan.surrounds) {
      const t = f.surround.thickness;
      const [x0, y0, x1, y1] = [-zone.end, -zone.side, L + zone.end, W + zone.side];
      bands.push({ kind: "wall", rect: [x0, y0, x1, y0 + t] }, { kind: "wall", rect: [x0, y1 - t, x1, y1] }, { kind: "wall", rect: [x0, y0 + t, x0 + t, y1 - t] }, { kind: "wall", rect: [x1 - t, y0 + t, x1, y1 - t] });
    }
    // The umpire sits or stands in line with the net and the assistant umpire directly facing him or her at the other side of the table (3.3.2.2); the umpires' table is beside the umpire's chair.
    if (plan.umpires) {
      const half = f.umpires.chair / 2;
      const { length: dl, width: dw } = f.umpires.desk;
      solids.push({ kind: "chair", rect: [cx - half, -f.umpires.away - half, cx + half, -f.umpires.away + half] });
      solids.push({ kind: "chair", rect: [cx - half, W + f.umpires.away - half, cx + half, W + f.umpires.away + half] });
      solids.push({ kind: "desk", rect: [cx + half + dl * 0.1, -f.umpires.away - dw / 2, cx + half + dl * 1.1, -f.umpires.away + dw / 2] });
    }
  }
  return {
    length: L,
    width: W,
    lines: [[0, 0, L, e], [0, W - e, L, W], [0, 0, e, W], [L - e, 0, L, W], [0, W / 2 - c / 2, L, W / 2 + c / 2]],
    areas: [],
    small: [],
    // The post's outside limit is 15.25 cm outside the side line; the net runs between the posts.
    net: { x: cx, y0: -out + post, y1: W + out - post },
    posts: [{ x: cx, y: -out + post / 2, size: post, shape: "square" }, { x: cx, y: W + out - post / 2, size: post, shape: "square" }],
    antennae: [],
    sticks: [],
    ...none(),
    bands,
    solids,
  };
}

/** How far the court's fixtures reach beyond its side lines: the net's posts and the antennae's marks. */
export function sideReach(geometry: CourtGeometry): number {
  let reach = 0;
  for (const post of [...geometry.posts, ...geometry.antennae, ...geometry.sticks]) reach = Math.max(reach, -(post.y - post.size / 2), post.y + post.size / 2 - geometry.width);
  return reach;
}

/** How far the walls, fences and the like stand beyond each edge of the court's rectangle: nothing for a court without any. */
export function bandReach(geometry: CourtGeometry): { left: number; right: number; top: number; bottom: number } {
  const reach = { left: 0, right: 0, top: 0, bottom: 0 };
  for (const { rect } of geometry.bands) {
    reach.left = Math.max(reach.left, -rect[0]);
    reach.right = Math.max(reach.right, rect[2] - geometry.length);
    reach.top = Math.max(reach.top, -rect[1]);
    reach.bottom = Math.max(reach.bottom, rect[3] - geometry.width);
  }
  return reach;
}
