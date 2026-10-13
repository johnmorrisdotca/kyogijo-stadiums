// What a net sport's court is for a set of options: the league's figures in feet, the look, the free zone, and the lines, areas and fixtures that follow from
// them, as plain rectangles in the frame of a drawing lying wide (x along the court from the left end line, y across it from the top side line, both in feet).
// Kept apart from the drawing so that the outline, the description, the tests and the drawing agree. Every length that is a rulebook's figure is cited in
// docs/sources.md; the sizes of the symbols (a post, an antenna, the net's line) are ours and are said to be.
import { chooseLeague, netOf } from "./leagues.ts";
import { BADMINTON_LEAGUES, PICKLEBALL_LEAGUES, TABLE_TENNIS_LEAGUES, TENNIS_LEAGUES, VOLLEYBALL_LEAGUES, type BadmintonFigures, type BadmintonLeague, type FreeZone, type NetSport, type PickleballFigures, type PickleballLeague, type TableTennisFigures, type TableTennisLeague, type TennisFigures, type TennisLeague, type VolleyballFigures, type VolleyballLeague } from "./leagues/courts.ts";
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

/** The looks each sport has, the sport's default first. */
export const LOOKS: Readonly<Record<NetSport, readonly string[]>> = Object.freeze({
  tennis: ["hard-blue", "hard-green", "clay", "grass"],
  volleyball: ["wood", "blue", "sand"],
  badminton: ["green", "blue", "wood"],
  pickleball: ["blue-green", "green", "red"],
  tabletennis: ["blue", "green"],
});

/** True for a sport whose court is one of these. */
export const isNetSport = (sport: string): sport is NetSport => sport === "tennis" || sport === "volleyball" || sport === "badminton" || sport === "pickleball" || sport === "tabletennis";

interface Common {
  /** The look: a name from `LOOKS`. */
  look: string;
  /** The free zone drawn round the court, in feet, or `null`. */
  zone: FreeZone;
  /** How the free zone was asked for. */
  free: "official" | "least" | "none";
  /** Tennis: the singles sticks are drawn. */
  sticks: boolean;
}

/** A court to draw: the sport, its league and figures (in feet), and how it is shown. */
export type CourtPlan =
  | (Common & { sport: "tennis"; league: TennisLeague; figures: TennisFigures })
  | (Common & { sport: "volleyball"; league: VolleyballLeague; figures: VolleyballFigures })
  | (Common & { sport: "badminton"; league: BadmintonLeague; figures: BadmintonFigures })
  | (Common & { sport: "pickleball"; league: PickleballLeague; figures: PickleballFigures })
  | (Common & { sport: "tabletennis"; league: TableTennisLeague; figures: TableTennisFigures });

const FREE = ["official", "least", "none"] as const;

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
  const names = LOOKS[sport];
  const look = asked.look === undefined ? (beach ? "sand" : names[0]) : asked.look;
  if (!names.includes(look)) throw new Error(`Unknown look "${String(look)}" for ${sport}: use one of ${names.join(", ")}`);
  const common = { look, free, sticks: sport === "tennis" && asked.sticks === true };
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
    default: {
      const league = picked?.family === "tabletennis" ? picked : TABLE_TENNIS_LEAGUES[0];
      const figures = netOf(league);
      return { ...common, sport: "tabletennis", league, figures, zone: zoneOf(figures.free) };
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
  net: NetLine;
  posts: Fixture[];
  antennae: Fixture[];
  sticks: Fixture[];
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
    default:
      return tableGeometry(plan.figures);
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
  };
}

function tableGeometry(f: TableTennisFigures): CourtGeometry {
  const { length: L, width: W, edgeLine: e, centreLine: c } = f;
  const cx = L / 2;
  const out = f.net.postOutside;
  const post = Math.max(feet(0.03), L * 0.01);
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
  };
}

/** How far the court's fixtures reach beyond its side lines: the net's posts and the antennae's marks. */
export function sideReach(geometry: CourtGeometry): number {
  let reach = 0;
  for (const post of [...geometry.posts, ...geometry.antennae, ...geometry.sticks]) reach = Math.max(reach, -(post.y - post.size / 2), post.y + post.size / 2 - geometry.width);
  return reach;
}
