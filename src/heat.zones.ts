// The named zones of a surface that a zone chart counts into: the soccer pitch's positional zones, thirds and channels, the NBA's shot zones, the
// NHL's slot and home plate, the baseball field's spray zones and Retrosheet's sectors, and the football pass grid. Each zone is a shape on the
// surface (in the drawing's own frame, feet) and a test of whether a point lies in it. The definitions are written down in docs/sources.md; where
// the sport has no single definition (the NHL's slot) the one used here is ours, built on the rink's markings, and says so.
import { CURLING, MLB, NBA, NHL, FEET_PER_METRE, threePointJoin } from "./geometry.ts";
import { RETROSHEET_ZONES } from "./frames.providers.ts";
import { num } from "./format.ts";
import type { Outline } from "./outline.ts";
import { FOOTBALL } from "./geometry.ts";
import { soccerSpec } from "./surfaces/soccer-spec.ts";
import type { KyogijoWords } from "./strings.ts";
import { fill } from "./strings.ts";
import type { Sport, SurfaceOptions } from "./types.ts";
import { lengthUnit } from "./common.ts";
import { courtFor, courtSize } from "./court.ts";
import { fieldPlan } from "./fields.ts";
import { athleticsLanes, athleticsLeague } from "./athletics/plan.ts";
import { skatingPlan } from "./skating/plan.ts";
import { laneEdges } from "./skating/track.ts";
import { iceRadius } from "./skating/long.ts";
import { LEAGUES, chooseLeague, cricketOf } from "./leagues.ts";
import type { CricketLeague } from "./leagues/cricket.ts";

/** The zone sets. */
export type ZoneSetId = "field-thirds" | "cricket-ground" | "soccer-positional" | "soccer-thirds" | "soccer-channels" | "soccer-18" | "nba-shot" | "nhl-slot" | "nhl-home-plate" | "baseball-spray" | "baseball-retrosheet" | "football-pass" | "athletics-track" | "skating-track" | "curling-house" | "net-court";

type Pt = readonly [number, number];

/** One zone: its shape on the surface and whether a point lies in it. */
export interface ZoneShape {
  /** A name for the zone in the data (`restricted-area`, `wing-left-3`), the same in every language. */
  id: string;
  /** The name to show, in the drawing's language. */
  name: string;
  /** The zone's outline as a path, in the drawing's frame (feet). */
  d: string;
  /** Where its label goes. */
  label: Pt;
  /** About how wide and how high a label can be without leaving the zone, in feet. */
  room?: Pt;
  /** Which end of the surface it is at, for a set that has a zone at each end. */
  end?: "left" | "right";
  /** True if the point lies in the zone. */
  has(x: number, y: number): boolean;
}

/** A set of zones. Where zones overlap, the later one is on top, and a point belongs to the last zone that has it. */
export interface ZoneSet {
  id: ZoneSetId;
  zones: ZoneShape[];
  /** The index of the zone a point belongs to, or -1 when it is in none. */
  which(x: number, y: number): number;
}

/** What a zone set needs to know about the drawing and the layer. */
export interface ZoneContext {
  o: Pick<SurfaceOptions, "sport" | "pitch" | "units"> & Partial<Pick<SurfaceOptions, "league" | "net" | "field" | "athletics" | "skating">>;
  outline: Outline;
  /** The way the team attacks as the surface is drawn wide: names the sides and counts the bands from the team's own end. `right` by default. */
  direction: "left" | "right";
  /** `left` or `right` for one end of a basket-and-goal surface, or both. */
  end: "left" | "right" | "both";
  /** The line of scrimmage on a football field, as a distance from the left end line in feet. */
  los: number | undefined;
  /** Which side the batter bats from, for the baseball spray zones: `R` (the default) or `L`. `undefined` names the thirds left, centre and right field. */
  bats: "L" | "R" | undefined;
  words: KyogijoWords["layers"]["zones"];
}

/** Every zone set, with the sports it is for, the source of its definition and its title. */
export const ZONE_SETS: Readonly<Record<ZoneSetId, { sports: readonly Sport[]; title: string; source: string }>> = Object.freeze({
  "soccer-positional": { sports: ["soccer"], title: "Positional zones (juego de posición): five lanes by six bands", source: "https://spielverlagerung.com/2014/11/26/juego-de-posicion-a-short-explanation/" },
  "soccer-thirds": { sports: ["soccer"], title: "Thirds: defensive, middle and attacking", source: "docs/sources.md#zone-sets" },
  "soccer-channels": { sports: ["soccer"], title: "Channels: the five lanes of the positional zones", source: "https://spielverlagerung.com/2014/11/26/juego-de-posicion-a-short-explanation/" },
  "soccer-18": { sports: ["soccer"], title: "The 18 zones: six bands by three lanes", source: "docs/sources.md#zone-sets" },
  "nba-shot": { sports: ["nba"], title: "Shot zones: restricted area, paint, mid-range, corner threes, above the break", source: "https://www.nba.com/stats/players/shooting" },
  "nhl-slot": { sports: ["nhl"], title: "Slot: inner and outer slot, behind the goal line, the rest of the offensive zone", source: "docs/sources.md#zone-sets" },
  "nhl-home-plate": { sports: ["nhl"], title: "Home plate and the rest of the offensive zone", source: "docs/sources.md#zone-sets" },
  "baseball-spray": { sports: ["mlb"], title: "Spray zones: pull, centre, opposite by infield and outfield", source: "docs/sources.md#zone-sets" },
  "baseball-retrosheet": { sports: ["mlb"], title: "Retrosheet hit locations as the nearest sector", source: "https://www.retrosheet.org/location.htm" },
  "curling-house": { sports: ["curling"], title: "The house: the button, the 4-, 8- and 12-foot rings, and the free guard zone", source: "docs/sources.md#zone-sets" },
  "net-court": { sports: ["tennis", "volleyball", "badminton", "pickleball", "tabletennis"], title: "Each side of the net: the front court and the back court, split by the court's own line", source: "docs/sources.md#zone-sets" },
  "field-thirds": { sports: ["lacrosse", "rugby", "afl", "gaelic", "fieldhockey", "handball"], title: "Thirds: defensive, middle and attacking", source: "docs/sources.md#zone-sets" },
  "skating-track": { sports: ["skating"], title: "The rink in parts: the finish straight, the first curve, the crossing straight, the second curve and the infield (a figure skating rink in thirds)", source: "docs/sources.md#zone-sets" },
  "athletics-track": { sports: ["athletics"], title: "The track in parts: the finish straight, the first bend, the back straight, the second bend, and the infield", source: "docs/sources.md#zone-sets" },
  "cricket-ground": { sports: ["cricket"], title: "The pitch, the ground inside the fielding circle, and the outfield", source: "docs/sources.md#zone-sets" },
  "football-pass": { sports: ["nfl", "cfl", "ifaf"], title: "Pass grid: short and deep by left, middle and right", source: "https://nflreadr.nflverse.com/articles/dictionary_pbp.html" },
});

export const ZONE_SET_IDS = Object.freeze(Object.keys(ZONE_SETS) as ZoneSetId[]);

const rectPath = (x0: number, y0: number, x1: number, y1: number): string => `M${num(x0)} ${num(y0)}H${num(x1)}V${num(y1)}H${num(x0)}Z`;
const polyPath = (pts: readonly Pt[]): string => `${pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${num(x)} ${num(y)}`).join("")}Z`;

/** A zone that is a rectangle. The upper edges are inclusive for the last zone of a row so that a point on the surface's edge is in a zone. */
function rect(id: string, name: string, x0: number, y0: number, x1: number, y1: number, lastX: boolean, lastY: boolean, extra: Partial<ZoneShape> = {}): ZoneShape {
  return {
    id,
    name,
    d: rectPath(x0, y0, x1, y1),
    label: [(x0 + x1) / 2, (y0 + y1) / 2],
    room: [Math.abs(x1 - x0), Math.abs(y1 - y0)],
    has: (x, y) => x >= x0 && (lastX ? x <= x1 : x < x1) && y >= y0 && (lastY ? y <= y1 : y < y1),
    ...extra,
  };
}

const lastWins = (zones: readonly ZoneShape[]) => (x: number, y: number): number => {
  for (let i = zones.length - 1; i >= 0; i -= 1) if (zones[i].has(x, y)) return i;
  return -1;
};

const pair = (words: ZoneContext["words"], a: string, b: string): string => fill(words.pair, { a, b });

/** Soccer: lane edges across the pitch (touchline to touchline) from the positional-zones definition: the wings reach the penalty area's width, the half-spaces the goal area's, and the centre is the goal area's width. */
function soccerLanes(ctx: ZoneContext): { edges: number[]; names: string[] } {
  const spec = soccerSpec(ctx.o.pitch, ctx.o.units === undefined ? "m" : lengthUnit(ctx.o));
  const W = ctx.outline.box.h;
  const pw = spec.penaltyWidth * FEET_PER_METRE;
  const gw = (spec.goalAreaWidth > 0 ? spec.goalAreaWidth : spec.goalWidth) * FEET_PER_METRE;
  const w = ctx.words;
  const top = [w.wingLeft, w.halfLeft, w.laneCentre, w.halfRight, w.wingRight];
  const names = ctx.direction === "right" ? top : [...top].reverse();
  return { edges: [0, (W - pw) / 2, (W - gw) / 2, (W + gw) / 2, (W + pw) / 2, W], names };
}

function soccerZones(id: ZoneSetId, ctx: ZoneContext): ZoneShape[] {
  const { box } = ctx.outline;
  const L = box.w;
  const W = box.h;
  const w = ctx.words;
  // Bands are counted from the team's own goal, so that band 1 is at the left end when it attacks right.
  const bandX = (edges: number[]): number[][] => edges.slice(0, -1).map((e, i): number[] => [e, edges[i + 1]]);
  const flipX = (list: number[][]): number[][] => (ctx.direction === "right" ? list : list.map(([a, b]) => [L - b, L - a]));
  const out: ZoneShape[] = [];
  if (id === "soccer-positional" || id === "soccer-channels") {
    const spec = soccerSpec(ctx.o.pitch, ctx.o.units === undefined ? "m" : lengthUnit(ctx.o));
    const lanes = soccerLanes(ctx);
    const pd = spec.penaltyDepth * FEET_PER_METRE;
    const xs = id === "soccer-channels" ? [0, L] : [0, pd, (pd + L / 2) / 2, L / 2, (L / 2 + (L - pd)) / 2, L - pd, L];
    const bands = bandX(xs);
    const ordered = flipX(bands);
    ordered.forEach(([x0, x1], b) => {
      lanes.names.forEach((lane, l) => {
        const name = id === "soccer-channels" ? lane : pair(w, lane, fill(w.band, { n: b + 1 }));
        out.push(rect(id === "soccer-channels" ? `lane-${l + 1}` : `lane-${l + 1}-band-${b + 1}`, name, x0, lanes.edges[l], x1, lanes.edges[l + 1], x1 === L, l === 4));
      });
    });
    return out;
  }
  if (id === "soccer-thirds") {
    const names = ctx.direction === "right" ? [w.defensiveThird, w.middleThird, w.attackingThird] : [w.attackingThird, w.middleThird, w.defensiveThird];
    names.forEach((name, i) => out.push(rect(["defensive", "middle", "attacking"][ctx.direction === "right" ? i : 2 - i] + "-third", name, (L * i) / 3, 0, (L * (i + 1)) / 3, W, i === 2, true)));
    return out;
  }
  // The 18 zones: six bands along the pitch by three lanes across, numbered along the team's attack, a band at a time from the team's left.
  const bands = flipX(bandX(Array.from({ length: 7 }, (_, i) => (L * i) / 6)));
  const rows = ctx.direction === "right" ? [0, 1, 2] : [2, 1, 0];
  bands.forEach(([x0, x1], b) => {
    rows.forEach((r, k) => out.push(rect(`zone-${b * 3 + k + 1}`, fill(w.zone, { n: b * 3 + k + 1 }), x0, (W * r) / 3, x1, (W * (r + 1)) / 3, x1 === L, r === 2)));
  });
  return out;
}

/** The NBA's shot zones at one end. `m` maps a distance from that end's baseline to the surface's x. */
function nbaZones(ctx: ZoneContext): ZoneShape[] {
  const L = ctx.outline.box.w;
  const W = ctx.outline.box.h;
  const w = ctx.words;
  const r = NBA.threePoint.radius;
  const join = threePointJoin();
  const inset = NBA.threePoint.sideInset;
  const hoop = NBA.basket;
  const mid = W / 2;
  const both = ctx.end === "both";
  const ends: ("left" | "right")[] = ctx.end === "both" ? ["left", "right"] : [ctx.end];
  const out: ZoneShape[] = [];
  for (const end of ends) {
    const left = end === "left";
    const X = (x: number): number => (left ? x : L - x);
    // The half of the court this end owns, and a point's distance from the hoop and from the baseline in that half.
    const owns = (x: number): boolean => (left ? x <= L / 2 : x > L / 2);
    const local = (x: number): number => (left ? x : L - x);
    const sweep = left ? 1 : 0;
    const tag = (id: string): string => (both ? `${id}-${end}` : id);
    const name = (n: string): string => (both ? fill(w.atEnd, { name: n, end: left ? w.endLeft : w.endRight }) : n);
    // Left and right are the shooter's, facing the basket (as stats.nba.com's LOC_X is: negative at his left): at the right basket the top of the drawing is his left, at the left basket it is his right.
    const cornerTop = left ? w.cornerRight : w.cornerLeft;
    const cornerBottom = left ? w.cornerLeft : w.cornerRight;
    const dist = (x: number, y: number): number => Math.hypot(local(x) - hoop, y - mid);
    // The zones do not overlap, so each test leaves out the zones inside it.
    const inLane = (x: number, y: number): boolean => local(x) <= NBA.freeThrowLine && Math.abs(y - mid) <= NBA.lane / 2;
    const inArc = (x: number, y: number): boolean => y >= inset && y <= W - inset && (local(x) <= join || dist(x, y) <= r);
    const cornerTopD = rectPath(Math.min(X(0), X(join)), 0, Math.max(X(0), X(join)), inset);
    const cornerBottomD = rectPath(Math.min(X(0), X(join)), W - inset, Math.max(X(0), X(join)), W);
    const midD = `M${num(X(0))} ${num(inset)}H${num(X(join))}A${num(r)} ${num(r)} 0 0 ${sweep} ${num(X(join))} ${num(W - inset)}H${num(X(0))}Z`;
    const paintD = rectPath(Math.min(X(0), X(NBA.freeThrowLine)), mid - NBA.lane / 2, Math.max(X(0), X(NBA.freeThrowLine)), mid + NBA.lane / 2);
    const raD = `M${num(X(hoop - NBA.restricted))} ${num(mid)}a${NBA.restricted} ${NBA.restricted} 0 1 ${sweep} ${num(left ? 2 * NBA.restricted : -2 * NBA.restricted)} 0a${NBA.restricted} ${NBA.restricted} 0 1 ${sweep} ${num(left ? -2 * NBA.restricted : 2 * NBA.restricted)} 0Z`;
    const halfD = rectPath(Math.min(X(0), X(L / 2)), 0, Math.max(X(0), X(L / 2)), W);
    // The zones do not overlap: a zone's outline holds the zones inside it as holes (drawn with the even-odd rule).
    out.push(
      { id: tag("above-the-break"), name: name(w.aboveBreak), d: halfD + midD + cornerTopD + cornerBottomD, label: [X(34), mid], room: [22, 20], end, has: (x, y) => owns(x) && !inArc(x, y) && !(local(x) <= join && (y < inset || y > W - inset)) },
      { id: tag("corner-top"), name: name(cornerTop), d: cornerTopD, label: [X(join / 2 + 1), inset / 2], room: [join, inset], end, has: (x, y) => owns(x) && local(x) <= join && y < inset },
      { id: tag("corner-bottom"), name: name(cornerBottom), d: cornerBottomD, label: [X(join / 2 + 1), W - inset / 2], room: [join, inset], end, has: (x, y) => owns(x) && local(x) <= join && y > W - inset },
      { id: tag("mid-range"), name: name(w.midRange), d: midD + paintD, label: [X(19.5), 11.5], room: [16, 12], end, has: (x, y) => owns(x) && inArc(x, y) && !inLane(x, y) },
      { id: tag("paint"), name: name(w.paint), d: paintD + raD, label: [X(14.5), mid], room: [9, NBA.lane * 0.7], end, has: (x, y) => owns(x) && inLane(x, y) && dist(x, y) > NBA.restricted },
      { id: tag("restricted-area"), name: name(w.restricted), d: raD, label: [X(hoop), mid], room: [2 * NBA.restricted * 0.85, 2 * NBA.restricted * 0.85], end, has: (x, y) => owns(x) && dist(x, y) <= NBA.restricted },
    );
  }
  return out;
}

/** The NHL's zones at each end. Distances are from the end boards along the rink and from the long axis across it. */
function nhlZones(id: ZoneSetId, ctx: ZoneContext): ZoneShape[] {
  const L = ctx.outline.box.w;
  const W = ctx.outline.box.h;
  const w = ctx.words;
  const mid = W / 2;
  const goal = NHL.goalLine;
  const post = NHL.net.width / 2;
  // The face-off circles are 22 feet either side of the axis and 15 feet in radius, so their inner edges are 7 feet from it; the end-zone spots are 20 feet out from the goal line.
  const inner = NHL.spotOffset - NHL.circleRadius;
  const dots = goal + NHL.endSpotFromGoalLine;
  const top = dots + NHL.circleRadius;
  // Home plate: from the goal line out to the line of the dots between the circles, then in to a point at the top of the circles.
  const inPlate = (a: number, b: number): boolean => a >= goal && a <= top && b <= inner && (a <= dots || b <= ((top - a) / (top - dots)) * inner);
  const ends: ("left" | "right")[] = ctx.end === "both" ? ["left", "right"] : [ctx.end];
  const both = ctx.end === "both";
  const out: ZoneShape[] = [];
  for (const end of ends) {
    const left = end === "left";
    const X = (x: number): number => (left ? x : L - x);
    const local = (x: number): number => (left ? x : L - x);
    const owns = (x: number): boolean => (left ? x <= L / 2 : x > L / 2);
    const tag = (zone: string): string => (both ? `${zone}-${end}` : zone);
    const name = (n: string): string => (both ? fill(w.atEnd, { name: n, end: left ? w.endLeft : w.endRight }) : n);
    const poly = (pts: Pt[]): string => polyPath(pts.map(([x, y]): Pt => [X(x), mid + y]));
    const offenceD = rectPath(Math.min(X(0), X(NHL.blueLine)), 0, Math.max(X(0), X(NHL.blueLine)), W);
    const label = (x: number, y: number): Pt => [X(x), mid + y];
    // The zones do not overlap: the rest of the offensive zone's outline holds the others as holes (drawn with the even-odd rule).
    if (id === "nhl-home-plate") {
      const plate: Pt[] = [[goal, -inner], [goal, inner], [dots, inner], [top, 0], [dots, -inner]];
      out.push({ id: tag("outside-home-plate"), name: name(w.outsideHomePlate), d: offenceD + poly(plate), label: label(NHL.blueLine - 14, 26), room: [24, 14], end, has: (x, y) => owns(x) && local(x) <= NHL.blueLine && !inPlate(local(x), Math.abs(y - mid)) });
      out.push({ id: tag("home-plate"), name: name(w.homePlate), d: poly(plate), label: label(goal + 14, 0), room: [dots - goal + 6, 2 * inner], end, has: (x, y) => owns(x) && inPlate(local(x), Math.abs(y - mid)) });
    } else {
      const behindD = rectPath(Math.min(X(0), X(goal)), 0, Math.max(X(0), X(goal)), W);
      const innerP: Pt[] = [[goal, -post], [goal, post], [dots, inner], [dots, -inner]];
      const outerP: Pt[] = [[dots, -inner], [dots, inner], [top, inner], [top, -inner]];
      const inInner = (a: number, b: number): boolean => a >= goal && a < dots && b <= post + ((a - goal) / (dots - goal)) * (inner - post);
      const inOuter = (a: number, b: number): boolean => a >= dots && a <= top && b <= inner;
      out.push(
        { id: tag("offensive-zone"), name: name(w.offensiveZone), d: offenceD + behindD + poly(innerP) + poly(outerP), label: label(NHL.blueLine - 14, 26), room: [24, 14], end, has: (x, y) => owns(x) && local(x) <= NHL.blueLine && local(x) >= goal && !inInner(local(x), Math.abs(y - mid)) && !inOuter(local(x), Math.abs(y - mid)) },
        { id: tag("behind-goal-line"), name: name(w.behindGoalLine), d: behindD, label: label(goal / 2, 12), room: [goal, 22], end, has: (x) => owns(x) && local(x) < goal },
        { id: tag("outer-slot"), name: name(w.outerSlot), d: poly(outerP), label: label((dots + top) / 2, 0), room: [top - dots, 2 * inner], end, has: (x, y) => owns(x) && inOuter(local(x), Math.abs(y - mid)) },
        { id: tag("inner-slot"), name: name(w.innerSlot), d: poly(innerP), label: label((goal + dots) / 2, 0), room: [dots - goal, 2 * inner - (inner - post)], end, has: (x, y) => owns(x) && inInner(local(x), Math.abs(y - mid)) },
      );
    }
  }
  return out;
}

/** The distance from home plate along a ray at `angle` (degrees, 0 straight out to centre field, negative to left) to the edge of the infield: the arc 95 feet round the pitcher's plate. */
function infieldReach(angle: number): number {
  const a = (angle * Math.PI) / 180;
  const along = MLB.pitcher * Math.cos(a);
  return along + Math.sqrt(along * along + MLB.skinRadius * MLB.skinRadius - MLB.pitcher * MLB.pitcher);
}

const onRay = (angle: number, t: number): Pt => [t * Math.sin((angle * Math.PI) / 180), -t * Math.cos((angle * Math.PI) / 180)];

function baseballSpray(ctx: ZoneContext): ZoneShape[] {
  const w = ctx.words;
  const box = ctx.outline.box;
  const far = Math.hypot(box.w, box.h) + 50;
  const sectors: [number, number][] = [[-45, -15], [-15, 15], [15, 45]];
  const bats = ctx.bats;
  const sides = bats === undefined ? [w.leftField, w.centreField, w.rightField] : bats === "R" ? [w.pull, w.sprayCentre, w.opposite] : [w.opposite, w.sprayCentre, w.pull];
  const ids = bats === undefined ? ["left", "centre", "right"] : bats === "R" ? ["pull", "centre", "opposite"] : ["opposite", "centre", "pull"];
  const out: ZoneShape[] = [];
  const steps = 10;
  for (const infield of [true, false]) {
    sectors.forEach(([a0, a1], i) => {
      const arc: Pt[] = [];
      for (let k = 0; k <= steps; k += 1) {
        const a = a0 + ((a1 - a0) * k) / steps;
        arc.push(onRay(a, infieldReach(a)));
      }
      let pts: Pt[];
      if (infield) pts = [[0, 0], ...arc];
      else {
        // From the infield's arc at the first ray, out to the far edge, round it, and back along the arc.
        const farArc: Pt[] = [];
        for (let k = 0; k <= steps; k += 1) farArc.push(onRay(a1 - ((a1 - a0) * k) / steps, far));
        pts = [...arc, ...farArc];
      }
      const mid = (a0 + a1) / 2;
      const labelAt = infield ? onRay(mid, infieldReach(mid) * 0.55) : onRay(mid, Math.min(infieldReach(mid) + 110, 330));
      out.push({
        id: `${ids[i]}-${infield ? "infield" : "outfield"}`,
        name: pair(w, sides[i], infield ? w.infield : w.outfield),
        d: polyPath(pts),
        label: labelAt,
        has: (x, y) => {
          if (y >= 0) return false;
          const angle = (Math.atan2(x, -y) * 180) / Math.PI;
          if (angle < a0 || (i < 2 ? angle >= a1 : angle > a1)) return false;
          const inside = Math.hypot(x, y) <= infieldReach(angle);
          return infield ? inside : !inside;
        },
      });
    });
  }
  return out;
}

/** Retrosheet's sectors as the cells of the nearest-centre partition of the field: each point belongs to the sector whose centre is nearest (`zoneAt` in the frames). */
function retrosheetZones(ctx: ZoneContext): { zones: ZoneShape[]; which: (x: number, y: number) => number } {
  const sites = Object.entries(RETROSHEET_ZONES).map(([code, [x, y]]) => ({ code, x, y: -y }));
  const box = ctx.outline.box;
  const pad = 30;
  const frame: Pt[] = [[box.x - pad, box.y - pad], [box.x + box.w + pad, box.y - pad], [box.x + box.w + pad, box.y + box.h + pad], [box.x - pad, box.y + box.h + pad]];
  const zones = sites.map((s, i): ZoneShape => {
    let poly: Pt[] = frame;
    for (let j = 0; j < sites.length && poly.length > 0; j += 1) {
      if (j === i) continue;
      const t = sites[j];
      // Keep the side nearer to this site: (p - midpoint) . (t - s) <= 0.
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      const nx = t.x - s.x;
      const ny = t.y - s.y;
      const side = (p: Pt): number => (p[0] - mx) * nx + (p[1] - my) * ny;
      const next: Pt[] = [];
      poly.forEach((p, k) => {
        const q = poly[(k + 1) % poly.length];
        const sp = side(p);
        const sq = side(q);
        if (sp <= 0) next.push(p);
        if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) {
          const f = sp / (sp - sq);
          next.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]);
        }
      });
      poly = next;
    }
    return { id: s.code.toLowerCase(), name: s.code, d: poly.length < 3 ? "" : polyPath(poly), label: [s.x, s.y], has: () => false };
  });
  const which = (x: number, y: number): number => {
    let best = -1;
    let bd = Infinity;
    sites.forEach((s, i) => {
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  zones.forEach((zone, i) => {
    zone.has = (x, y) => which(x, y) === i;
  });
  return { zones: zones.filter((z) => z.d !== ""), which: (x, y) => { const i = which(x, y); const id = sites[i]?.code.toLowerCase(); return zones.filter((z) => z.d !== "").findIndex((z) => z.id === id); } };
}

function footballPass(ctx: ZoneContext): ZoneShape[] {
  const L = ctx.outline.box.w;
  const W = ctx.outline.box.h;
  const w = ctx.words;
  const spec = FOOTBALL[ctx.o.sport as "nfl" | "cfl" | "ifaf"] ?? FOOTBALL.nfl;
  const right = ctx.direction === "right";
  const los = Math.max(0, Math.min(L, ctx.los ?? L / 2));
  // Deep is more than 15 yards past the line of scrimmage; short is everything nearer, including a pass thrown behind it.
  const deepAt = Math.max(0, Math.min(L, los + (right ? 45 : -45)));
  const ys = [0, spec.hash, W - spec.hash, W];
  // Left and right are the passer's: facing the way the offence attacks, left is the top of the drawing when it attacks right.
  const sides = right ? [w.sideLeft, w.sideMiddle, w.sideRight] : [w.sideRight, w.sideMiddle, w.sideLeft];
  const sideIds = right ? ["left", "middle", "right"] : ["right", "middle", "left"];
  const out: ZoneShape[] = [];
  const spans: { id: string; name: string; x0: number; x1: number }[] = right
    ? [{ id: "short", name: w.lengthShort, x0: 0, x1: deepAt }, { id: "deep", name: w.lengthDeep, x0: deepAt, x1: L }]
    : [{ id: "short", name: w.lengthShort, x0: deepAt, x1: L }, { id: "deep", name: w.lengthDeep, x0: 0, x1: deepAt }];
  for (const span of spans) {
    sides.forEach((side, i) => {
      out.push(rect(`${span.id}-${sideIds[i]}`, pair(w, span.name, side), span.x0, ys[i], span.x1, ys[i + 1], span.x1 === L, i === 2));
    });
  }
  return out;
}

/**
 * A curling sheet's house at each end, from R1 of the rules: the button and the 4-, 8- and 12-foot circles round the tee, and the free guard zone
 * (R6; Rule 12 of Curling Canada), the ground between the tee line and the hog line outside the house. The rings are the circles' radii, so a stone
 * is in a ring by its centre. The zones do not overlap; a stone elsewhere is in none.
 */
function curlingZones(ctx: ZoneContext): ZoneShape[] {
  const L = ctx.outline.box.w;
  const W = ctx.outline.box.h;
  const w = ctx.words;
  const cy = W / 2;
  const [twelve, eight, four, button] = [CURLING.rings.twelve, CURLING.rings.eight, CURLING.rings.four, CURLING.rings.button];
  const both = ctx.end === "both";
  const ends: ("left" | "right")[] = ctx.end === "both" ? ["left", "right"] : [ctx.end];
  const out: ZoneShape[] = [];
  for (const end of ends) {
    const left = end === "left";
    const tee = left ? L / 2 - CURLING.teeFromMiddle : L / 2 + CURLING.teeFromMiddle;
    // The house is on the tee's far side from the middle of the sheet: a distance towards the middle is positive.
    const towards = (x: number): number => (left ? x - tee : tee - x);
    const sign = left ? 1 : -1;
    const tag = (id: string): string => (both ? `${id}-${end}` : id);
    const name = (n: string): string => (both ? fill(w.atEnd, { name: n, end: left ? w.endLeft : w.endRight }) : n);
    const circle = (r: number): string => `M${num(tee - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0Z`;
    const dist = (x: number, y: number): number => Math.hypot(x - tee, y - cy);
    const hog = tee + sign * CURLING.hogLine;
    // The guard zone: the rectangle from the tee line to the hog line, without the half of the 12-foot circle that lies in it.
    const guardD = `M${num(tee)} 0H${num(hog)}V${num(W)}H${num(tee)}V${num(cy + twelve)}A${num(twelve)} ${num(twelve)} 0 0 ${left ? 0 : 1} ${num(tee)} ${num(cy - twelve)}Z`;
    out.push(
      { id: tag("guard-zone"), name: name(w.guardZone), d: guardD, label: [tee + (sign * (twelve + CURLING.hogLine)) / 2, cy], room: [CURLING.hogLine - twelve, 8], end, has: (x, y) => towards(x) >= 0 && towards(x) <= CURLING.hogLine && dist(x, y) > twelve },
      { id: tag("twelve-foot"), name: name(w.houseTwelve), d: circle(twelve) + circle(eight), label: [tee, cy - (twelve + eight) / 2], room: [3, 1.6], end, has: (x, y) => dist(x, y) > eight && dist(x, y) <= twelve },
      { id: tag("eight-foot"), name: name(w.houseEight), d: circle(eight) + circle(four), label: [tee, cy - (eight + four) / 2], room: [3, 1.6], end, has: (x, y) => dist(x, y) > four && dist(x, y) <= eight },
      { id: tag("four-foot"), name: name(w.houseFour), d: circle(four) + circle(button), label: [tee, cy - (four + button) / 2], room: [3, 1.2], end, has: (x, y) => dist(x, y) > button && dist(x, y) <= four },
      { id: tag("button"), name: name(w.houseButton), d: circle(button), label: [tee, cy], room: [1, 1], end, has: (x, y) => dist(x, y) <= button },
    );
  }
  return out;
}

/**
 * The court of a net sport on each side of the net: the front court, between the net and the line that the sport's own rules draw there, and the back court behind it.
 * That line is tennis's service line (21 ft), volleyball's attack line (3 m), badminton's short service line (1.98 m) and pickleball's non-volley zone line (7 ft); beach
 * volleyball and table tennis have none, so each side is one zone. The zones are ours: the rules name the lines, not the areas.
 */
function netZones(ctx: ZoneContext): ZoneShape[] {
  const plan = courtFor({ sport: ctx.o.sport, league: ctx.o.league, net: ctx.o.net });
  const { length: L, width: W } = courtSize(plan);
  const w = ctx.words;
  const front: number | null = plan.sport === "tennis" ? plan.figures.serviceLine : plan.sport === "volleyball" ? plan.figures.attackLine : plan.sport === "badminton" ? plan.figures.shortServiceLine : plan.sport === "pickleball" ? plan.figures.nonVolley : null;
  const cx = L / 2;
  const both = ctx.end === "both";
  const ends: ("left" | "right")[] = ctx.end === "both" ? ["left", "right"] : [ctx.end];
  const out: ZoneShape[] = [];
  for (const end of ends) {
    const left = end === "left";
    const tag = (id: string): string => (both ? `${id}-${end}` : id);
    const name = (n: string): string => (both ? fill(w.atEnd, { name: n, end: left ? w.endLeft : w.endRight }) : n);
    // A zone from the net outward: `near` and `far` are distances from the net, to the end of this side.
    const band = (near: number, far: number, id: string, text: string): ZoneShape => {
      const x0 = left ? cx - far : cx + near;
      const x1 = left ? cx - near : cx + far;
      return { id: tag(id), name: name(text), d: `M${num(x0)} 0H${num(x1)}V${num(W)}H${num(x0)}Z`, label: [(x0 + x1) / 2, W / 2], room: [far - near, W], end, has: (x, y) => x >= x0 && x <= x1 && y >= 0 && y <= W };
    };
    if (front === null) out.push(band(0, cx, "half-court", w.halfCourt));
    else out.push(band(0, front, "front-court", w.frontCourt), band(front, cx, "back-court", w.backCourt));
  }
  return out;
}

/** The surface in thirds along it, counted from the team's own end: the same for every field sport with ends. */
function fieldThirds(ctx: ZoneContext): ZoneShape[] {
  const { box } = ctx.outline;
  const w = ctx.words;
  const names = ctx.direction === "right" ? [w.defensiveThird, w.middleThird, w.attackingThird] : [w.attackingThird, w.middleThird, w.defensiveThird];
  return names.map((name, i) => rect(["defensive", "middle", "attacking"][ctx.direction === "right" ? i : 2 - i] + "-third", name, (box.w * i) / 3, 0, (box.w * (i + 1)) / 3, box.h, i === 2, true));
}

/**
 * A cricket ground in three: the pitch, the rest of the ground inside the fielding restriction's circle (two semicircles about the middle stumps, joined by two lines) where the league has one, and the outfield.
 * The pitch is the Laws' (22 yards by 10 feet), the circle the ICC's. The zones do not overlap.
 */
function cricketZones(ctx: ZoneContext): ZoneShape[] {
  const plan = fieldPlan({ sport: "cricket", league: ctx.o.league, field: ctx.o.field, units: ctx.o.units });
  const pitch = plan.areas.find((area) => area.id === "pitch")?.rect as readonly [number, number, number, number];
  const [px0, py0, px1, py1] = pitch;
  const picked = chooseLeague({ sport: "cricket", league: ctx.o.league }).league;
  const league = picked?.family === "cricket" ? picked : LEAGUES.cricket[0];
  const circle = ctx.o.field?.circle === false ? null : cricketOf(league as CricketLeague).circle;
  const { length: L, width: W } = plan;
  const w = ctx.words;
  const cx = L / 2;
  const cy = W / 2;
  const inPitch = (x: number, y: number): boolean => x >= px0 && x <= px1 && y >= py0 && y <= py1;
  const half = (px1 - px0) / 2;
  const inCircle = (x: number, y: number): boolean => circle !== null && (Math.abs(x - cx) <= half ? Math.abs(y - cy) <= circle : Math.hypot(Math.abs(x - cx) - half, y - cy) <= circle);
  const ground = `M0 ${num(cy)}A${num(cx)} ${num(cy)} 0 1 1 ${num(L)} ${num(cy)}A${num(cx)} ${num(cy)} 0 1 1 0 ${num(cy)}Z`;
  const ring = circle === null ? "" : `M${num(cx - half)} ${num(cy - circle)}H${num(cx + half)}A${num(circle)} ${num(circle)} 0 0 1 ${num(cx + half)} ${num(cy + circle)}H${num(cx - half)}A${num(circle)} ${num(circle)} 0 0 1 ${num(cx - half)} ${num(cy - circle)}Z`;
  const out: ZoneShape[] = [{ id: "outfield", name: w.outfieldGround, d: ground + ring, label: [cx, cy - (circle ?? 0) - 0.2 * cy], room: [L * 0.4, W * 0.15], has: (x, y) => !inCircle(x, y) && !inPitch(x, y) && ((x - cx) / cx) ** 2 + ((y - cy) / cy) ** 2 <= 1 }];
  if (circle !== null) out.push({ id: "inside-circle", name: w.insideCircle, d: ring + rectPath(px0, py0, px1, py1), label: [cx, cy - circle * 0.6], room: [circle * 2, circle * 0.5], has: (x, y) => inCircle(x, y) && !inPitch(x, y) });
  out.push({ id: "pitch", name: w.pitchZone, d: rectPath(px0, py0, px1, py1), label: [cx, cy], room: [px1 - px0, py1 - py0], has: inPitch });
  return out;
}

/**
 * The athletics track in parts, each a part of the oval as the Manual lays it out (2.2.1.1): the finish straight and the back straight between the centres of the semicircles, the first bend (the right-hand one, which
 * the athletes enter from the finish line) and the second, and the infield inside the kerb. The zones are ours: the rules name no area of the track. Lane by lane is the lane lines' business, not a zone's.
 */
function athleticsZones(ctx: ZoneContext): ZoneShape[] {
  const league = athleticsLeague({ sport: "athletics", league: ctx.o.league });
  const fig = league.dimensions;
  const lanes = athleticsLanes({ sport: "athletics", league: ctx.o.league, athletics: ctx.o.athletics });
  const k = FEET_PER_METRE;
  const { box } = ctx.outline;
  const cx = box.w / 2;
  const cy = box.h / 2;
  const S = fig.straight;
  const R = fig.radius;
  const Ro = R + lanes * fig.lane;
  const w = ctx.words;
  const p = (u: number, v: number): string => `${num(cx + u * k)} ${num(cy + v * k)}`;
  const arc = (r: number, sweep: 0 | 1): string => `A${num(r * k)} ${num(r * k)} 0 0 ${sweep}`;
  const inside = (u: number, v: number, r: number): boolean => Math.abs(v) <= r && (Math.abs(u) <= S / 2 || Math.hypot(Math.abs(u) - S / 2, v) <= r);
  const m = (x: number, y: number): [number, number] => [(x - cx) / k, (y - cy) / k];
  const onTrack = (u: number, v: number): boolean => inside(u, v, Ro) && !inside(u, v, R);
  const stadium = (r: number): string => `M${p(-S / 2, -r)}H${num(cx + (S / 2) * k)}${arc(r, 1)} ${p(S / 2, r)}H${num(cx - (S / 2) * k)}${arc(r, 1)} ${p(-S / 2, -r)}Z`;
  const east = `M${p(S / 2, -Ro)}${arc(Ro, 1)} ${p(S / 2, Ro)}V${num(cy + R * k)}${arc(R, 0)} ${p(S / 2, -R)}Z`;
  const west = `M${p(-S / 2, Ro)}${arc(Ro, 1)} ${p(-S / 2, -Ro)}V${num(cy - R * k)}${arc(R, 0)} ${p(-S / 2, R)}Z`;
  return [
    { id: "infield", name: w.trackInfield, d: stadium(R), label: [cx, cy], room: [S * k, R * k], has: (x, y) => { const [u, v] = m(x, y); return inside(u, v, R); } },
    { id: "home-straight", name: w.homeStraight, d: `M${p(-S / 2, R)}H${num(cx + (S / 2) * k)}V${num(cy + Ro * k)}H${num(cx - (S / 2) * k)}Z`, label: [cx, cy + ((R + Ro) / 2) * k], room: [S * k, (Ro - R) * k], has: (x, y) => { const [u, v] = m(x, y); return onTrack(u, v) && Math.abs(u) <= S / 2 && v > 0; } },
    { id: "first-bend", name: w.firstBend, d: east, label: [cx + (S / 2 + (R + Ro) / 2) * k, cy], room: [(Ro - R) * k, R * k], has: (x, y) => { const [u, v] = m(x, y); return onTrack(u, v) && u > S / 2; } },
    { id: "back-straight", name: w.backStraight, d: `M${p(-S / 2, -Ro)}H${num(cx + (S / 2) * k)}V${num(cy - R * k)}H${num(cx - (S / 2) * k)}Z`, label: [cx, cy - ((R + Ro) / 2) * k], room: [S * k, (Ro - R) * k], has: (x, y) => { const [u, v] = m(x, y); return onTrack(u, v) && Math.abs(u) <= S / 2 && v < 0; } },
    { id: "second-bend", name: w.secondBend, d: west, label: [cx - (S / 2 + (R + Ro) / 2) * k, cy], room: [(Ro - R) * k, R * k], has: (x, y) => { const [u, v] = m(x, y); return onTrack(u, v) && u < -S / 2; } },
  ];
}

/**
 * The skating rink in parts: for a track, the infield inside the inner edge, the finish straight, the first curve, the crossing straight and the second curve between the centres of the curves, each as the
 * plan lays it out (the long track's ice out to its padding, the short track's rink); for a figure skating rink, its length in thirds. The zones are ours: the Rules name no area of the ice.
 */
function skatingZones(ctx: ZoneContext): ZoneShape[] {
  const plan = skatingPlan({ sport: "skating", league: ctx.o.league, skating: ctx.o.skating });
  const k = FEET_PER_METRE;
  const { box } = ctx.outline;
  const w = ctx.words;
  const cx = box.w / 2;
  const cy = box.h / 2;
  if (plan.discipline === "figure") {
    const part = (i: number, id: string, name: string): ZoneShape => rect(id, name, (box.w * i) / 3, 0, (box.w * (i + 1)) / 3, box.h, i === 2, true);
    return [part(0, "left", w.rinkLeft), part(1, "middle", w.rinkMiddle), part(2, "right", w.rinkRight)];
  }
  const S = plan.oval === undefined ? (plan.short as NonNullable<typeof plan.short>).straight : plan.oval.straight;
  const R = plan.oval === undefined ? (plan.short as NonNullable<typeof plan.short>).blocks : laneEdges(plan.oval, 0).inner;
  const Ro = plan.oval === undefined ? (plan.short as NonNullable<typeof plan.short>).width / 2 : iceRadius(plan.oval);
  const p = (u: number, v: number): string => `${num(cx + u * k)} ${num(cy + v * k)}`;
  const arc = (r: number, sweep: 0 | 1): string => `A${num(r * k)} ${num(r * k)} 0 0 ${sweep}`;
  const inside = (u: number, v: number, r: number): boolean => Math.abs(v) <= r && (Math.abs(u) <= S / 2 || Math.hypot(Math.abs(u) - S / 2, v) <= r);
  const m = (x: number, y: number): [number, number] => [(x - cx) / k, (y - cy) / k];
  const onIce = (u: number, v: number): boolean => inside(u, v, Ro) && !inside(u, v, R);
  const stadium = (r: number): string => `M${p(-S / 2, -r)}H${num(cx + (S / 2) * k)}${arc(r, 1)} ${p(S / 2, r)}H${num(cx - (S / 2) * k)}${arc(r, 1)} ${p(-S / 2, -r)}Z`;
  const east = `M${p(S / 2, -Ro)}${arc(Ro, 1)} ${p(S / 2, Ro)}V${num(cy + R * k)}${arc(R, 0)} ${p(S / 2, -R)}Z`;
  const west = `M${p(-S / 2, Ro)}${arc(Ro, 1)} ${p(-S / 2, -Ro)}V${num(cy - R * k)}${arc(R, 0)} ${p(-S / 2, R)}Z`;
  return [
    { id: "infield", name: w.trackInfield, d: stadium(R), label: [cx, cy], room: [S * k, R * k], has: (x, y) => { const [u, v] = m(x, y); return inside(u, v, R); } },
    { id: "home-straight", name: w.finishStraight, d: `M${p(-S / 2, R)}H${num(cx + (S / 2) * k)}V${num(cy + Ro * k)}H${num(cx - (S / 2) * k)}Z`, label: [cx, cy + ((R + Ro) / 2) * k], room: [S * k, (Ro - R) * k], has: (x, y) => { const [u, v] = m(x, y); return onIce(u, v) && Math.abs(u) <= S / 2 && v > 0; } },
    { id: "first-curve", name: w.firstCurve, d: east, label: [cx + (S / 2 + (R + Ro) / 2) * k, cy], room: [(Ro - R) * k, R * k], has: (x, y) => { const [u, v] = m(x, y); return onIce(u, v) && u > S / 2; } },
    { id: "crossing-straight", name: w.crossingStraight, d: `M${p(-S / 2, -Ro)}H${num(cx + (S / 2) * k)}V${num(cy - R * k)}H${num(cx - (S / 2) * k)}Z`, label: [cx, cy - ((R + Ro) / 2) * k], room: [S * k, (Ro - R) * k], has: (x, y) => { const [u, v] = m(x, y); return onIce(u, v) && Math.abs(u) <= S / 2 && v < 0; } },
    { id: "second-curve", name: w.secondCurve, d: west, label: [cx - (S / 2 + (R + Ro) / 2) * k, cy], room: [(Ro - R) * k, R * k], has: (x, y) => { const [u, v] = m(x, y); return onIce(u, v) && u < -S / 2; } },
  ];
}

/** The zones of a set on the surface the context describes. Throws for a set that is not for the surface's sport. */
export function buildZoneSet(id: ZoneSetId, ctx: ZoneContext): ZoneSet {
  if (!Object.prototype.hasOwnProperty.call(ZONE_SETS, id)) throw new RangeError(`Unknown zone set "${String(id)}": use one of ${ZONE_SET_IDS.join(", ")}`);
  const def = ZONE_SETS[id];
  if (!def.sports.includes(ctx.o.sport)) throw new RangeError(`The zone set "${id}" is for ${def.sports.join(", ")}, not ${ctx.o.sport}`);
  if (id === "baseball-retrosheet") {
    const { zones, which } = retrosheetZones(ctx);
    return { id, zones, which };
  }
  const zones = id === "skating-track" ? skatingZones(ctx) : id === "athletics-track" ? athleticsZones(ctx) : id === "field-thirds" ? fieldThirds(ctx) : id === "cricket-ground" ? cricketZones(ctx) : id.startsWith("soccer") ? soccerZones(id, ctx) : id === "nba-shot" ? nbaZones(ctx) : id.startsWith("nhl") ? nhlZones(id, ctx) : id === "baseball-spray" ? baseballSpray(ctx) : id === "curling-house" ? curlingZones(ctx) : id === "net-court" ? netZones(ctx) : footballPass(ctx);
  return { id, zones, which: lastWins(zones) };
}
