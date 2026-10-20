// The game of the fly-through: a short play on the rink, made up for the picture and said to be: five skaters and a goalie a side, a breakout, two passes, a rush and a goal, as a replay's timeline
// (`ReplayTimeline` of `replay.types.ts`, the format the package already animates), so that the dots, their numbers, the puck, its trail and the events are drawn by the replay's own layers. It is NOT a real game's tracking data
// and nothing in it is a real player, a real team or a real play: the shirt numbers are only numbers. Pure and deterministic: the same moment always gives the same frame.
import { renderLayers } from "./layers.ts";
import { replayLayers } from "./replay.ts";
import type { ReplayEvent, ReplayFrame, ReplayLook, ReplayObject, ReplayTimeline } from "./replay.types.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/** A place on the rink, in feet from its top left corner as the drawing has it wide: along the rink (0 to 200) and across it (0 to 85). */
type P = readonly [number, number];
/** A skater's way: where he is at a time (seconds), from one waypoint to the next. */
type Way = readonly (readonly [number, number, number])[];

/** How long the play runs, and how long it is held at the end (the goal's marks still on the ice) before it starts again. */
export const PLAY_SECONDS = 10;
export const PLAY_HOLD = 1.5;
/** The seconds of the whole run, the play and the hold: what the loop's period is. */
export const PLAY_PERIOD = PLAY_SECONDS + PLAY_HOLD;
/** The moment a still of the play (for a reader who prefers reduced motion) is taken at: the shot has just been taken. */
export const PLAY_STILL = 6.4;
/** The seconds the dots fade in and out at the ends of a run, so that the play does not jump back to its start in view. */
export const PLAY_FADE = 0.5;

/** The home skaters, as waypoints `[seconds, x, y]`: the home team attacks to the right. */
const HOME: Record<string, { number: number; way: Way }> = {
  h4: { number: 4, way: [[0, 24, 26], [1.2, 30, 30], [3.5, 60, 24], [6, 110, 30], [8, 130, 35], [10, 135, 38]] },
  h6: { number: 6, way: [[0, 24, 58], [1.5, 40, 60], [3.5, 75, 58], [6, 120, 55], [8, 140, 50], [10, 145, 48]] },
  h17: { number: 17, way: [[0, 45, 12], [1.2, 48, 12], [2.6, 85, 14], [4, 130, 12], [5.4, 165, 18], [6.8, 176, 28], [10, 170, 30]] },
  h9: { number: 9, way: [[0, 60, 40], [2.4, 80, 40], [3.6, 105, 36], [5, 150, 42], [6.2, 166, 42], [7, 180, 44], [10, 178, 46]] },
  h22: { number: 22, way: [[0, 55, 70], [2.6, 90, 70], [4.2, 135, 64], [5.6, 165, 60], [6.4, 178, 50], [10, 176, 52]] },
};
/** The away skaters, who fall back into their own end as the rush comes. */
const AWAY: Record<string, { number: number; way: Way }> = {
  a11: { number: 11, way: [[0, 95, 40], [2, 110, 42], [4, 150, 44], [6, 170, 43], [10, 180, 44]] },
  a14: { number: 14, way: [[0, 100, 20], [3, 125, 22], [5, 160, 24], [6.5, 175, 26], [10, 178, 30]] },
  a27: { number: 27, way: [[0, 98, 65], [3, 128, 62], [5, 158, 62], [6.5, 176, 62], [10, 178, 60]] },
  a5: { number: 5, way: [[0, 150, 30], [4, 160, 30], [6, 172, 34], [10, 180, 32]] },
  a8: { number: 8, way: [[0, 150, 55], [4, 162, 54], [6, 172, 52], [10, 180, 54]] },
};
/** The goalies: the home one stays on his line, the away one moves across his crease as the shot comes. */
const HOME_GOALIE: P = [11, 42.5];
const AWAY_GOAL: P = [189, 42.5];

/** A point of a way at a time: a cubic through the waypoints with the slope between the neighbours at each, so that a skater never stops or turns on a corner. */
export function at(way: Way, t: number): P {
  const last = way.length - 1;
  if (t <= way[0][0]) return [way[0][1], way[0][2]];
  if (t >= way[last][0]) return [way[last][1], way[last][2]];
  let i = 0;
  while (i < last - 1 && t >= way[i + 1][0]) i += 1;
  const [t0, x0, y0] = way[i];
  const [t1, x1, y1] = way[i + 1];
  const slope = (k: number): P => {
    const a = way[Math.max(0, k - 1)];
    const b = way[Math.min(last, k + 1)];
    const span = b[0] - a[0];
    return span === 0 ? [0, 0] : [(b[1] - a[1]) / span, (b[2] - a[2]) / span];
  };
  const [m0, m1] = [slope(i), slope(i + 1)];
  const h = t1 - t0;
  const s = (t - t0) / h;
  const [s2, s3] = [s * s, s * s * s];
  const [h00, h10, h01, h11] = [2 * s3 - 3 * s2 + 1, s3 - 2 * s2 + s, -2 * s3 + 3 * s2, s3 - s2];
  return [h00 * x0 + h10 * h * m0[0] + h01 * x1 + h11 * h * m1[0], h00 * y0 + h10 * h * m0[1] + h01 * y1 + h11 * h * m1[1]];
}

const lerp = (a: P, b: P, u: number): P => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const round = (n: number): number => Math.round(n * 100) / 100;

/** The puck: carried by one skater and then another, passed between them, shot, and in the net. A little ahead of the stick it is carried on. */
interface Leg {
  from: number;
  to: number;
  /** The skater that carries it in this leg, or `null` for a pass or a shot, which go from where the last leg ended to where the next begins. */
  carrier: string | null;
}
const LEGS: readonly Leg[] = [
  { from: 0, to: 1.2, carrier: "h4" },
  { from: 1.2, to: 1.8, carrier: null },
  { from: 1.8, to: 2.6, carrier: "h17" },
  { from: 2.6, to: 3.6, carrier: null },
  { from: 3.6, to: 6.2, carrier: "h9" },
  { from: 6.2, to: 6.55, carrier: null },
  { from: 6.55, to: PLAY_SECONDS, carrier: "net" },
];

const WAYS: Record<string, Way> = Object.fromEntries([...Object.entries(HOME), ...Object.entries(AWAY)].map(([id, one]) => [id, one.way]));
const where = (id: string, t: number): P => (id === "net" ? AWAY_GOAL : at(WAYS[id], t));
/** The puck at a time. */
export function puckAt(t: number): P {
  const time = Math.min(Math.max(t, 0), PLAY_SECONDS);
  const index = LEGS.findIndex((leg) => time <= leg.to);
  const leg = LEGS[index < 0 ? LEGS.length - 1 : index];
  const carried = (id: string, when: number): P => {
    if (id === "net") return AWAY_GOAL;
    const [x, y] = where(id, when);
    return [x + 2.5, y];
  };
  if (leg.carrier !== null) return carried(leg.carrier, time);
  // A pass or a shot goes from the carrier before it, at its start, to the carrier after it, at its end.
  const [before, after] = [LEGS[LEGS.indexOf(leg) - 1], LEGS[LEGS.indexOf(leg) + 1]];
  return lerp(carried(before.carrier!, leg.from), after.carrier === "net" ? AWAY_GOAL : carried(after.carrier!, leg.to), (time - leg.from) / (leg.to - leg.from));
}

/** The away goalie's place: across his crease a little as the shot is taken, and back. */
function awayGoalie(t: number): P {
  const bump = Math.max(0, 1 - Math.abs(t - 6.45) / 0.6);
  return [AWAY_GOAL[0] - 1, AWAY_GOAL[1] - 3 * bump];
}

/** Who has the puck at a time, as a replay says it: a skater's id, or `null` while it is passed or shot. */
const possessionAt = (t: number): string | null => {
  const leg = LEGS.find((one) => t >= one.from && t < one.to);
  return leg === undefined || leg.carrier === null || leg.carrier === "net" ? null : leg.carrier;
};

/** The frames of the play, a tenth of a second apart. */
function frames(): ReplayFrame[] {
  const out: ReplayFrame[] = [];
  for (let step = 0; step <= PLAY_SECONDS * 10; step += 1) {
    const t = step / 10;
    const objects: ReplayObject[] = [];
    for (const [id, one] of Object.entries(HOME)) objects.push({ id, team: "home", number: one.number, x: round(at(one.way, t)[0]), y: round(at(one.way, t)[1]) });
    objects.push({ id: "h30", team: "home", number: 30, x: HOME_GOALIE[0], y: HOME_GOALIE[1] });
    for (const [id, one] of Object.entries(AWAY)) objects.push({ id, team: "away", number: one.number, x: round(at(one.way, t)[0]), y: round(at(one.way, t)[1]) });
    const goalie = awayGoalie(t);
    objects.push({ id: "a35", team: "away", number: 35, x: round(goalie[0]), y: round(goalie[1]) });
    const puck = puckAt(t);
    objects.push({ id: "puck", team: "puck", x: round(puck[0]), y: round(puck[1]) });
    const holder = possessionAt(t);
    out.push({ t, objects, possession: holder });
  }
  return out;
}

const EVENTS: readonly ReplayEvent[] = [
  { t: 1.2, kind: "pass", team: "home", by: "h4", to: "h17", until: 1.8 },
  { t: 2.6, kind: "pass", team: "home", by: "h17", to: "h9", until: 3.6 },
  { t: 6.2, kind: "shot", team: "home", by: "h9", x2: AWAY_GOAL[0], y2: AWAY_GOAL[1], until: 6.55 },
  { t: 6.55, kind: "goal", team: "home", by: "h9", x: AWAY_GOAL[0], y: AWAY_GOAL[1] },
];

/** The play, as a replay's timeline in the surface's own feet. It is made once. */
export const ILLUSTRATIVE_PLAY: ReplayTimeline = Object.freeze({ frames: frames(), events: EVENTS });

/** How the play is drawn: a short trail behind the puck, the dots large enough to see from the stands, events that stay a moment. */
export const PLAY_LOOK: ReplayLook = Object.freeze({ trail: 1.2, hold: 1.5, scale: 1.7, numbers: true });

/** Where a moment of a run is in the play, looping: `seconds` after the run began, brought into one period. */
export const playMoment = (seconds: number): number => ((seconds % PLAY_PERIOD) + PLAY_PERIOD) % PLAY_PERIOD;

/** How much of the play shows at a moment of a run: it fades in at the start and out at the end of each run. 0 to 1. */
export function playAlpha(moment: number): number {
  const m = Math.min(Math.max(moment, 0), PLAY_PERIOD);
  return Math.min(1, m / PLAY_FADE, (PLAY_PERIOD - m) / PLAY_FADE);
}

/**
 * The play at a moment of a run, as the layers' SVG (a `g.ky-layers` in the drawing's own feet, to go inside an `svg.kyogijo` with the floor's viewBox): the dots with their numbers, the puck and its trail, and the events that are on
 * the ice at that time, drawn by the replay's own layers. The same moment always gives the same string.
 */
export function playMarkup(moment: number, options: { id: string; language?: Language }): string {
  const t = Math.min(playMoment(moment), PLAY_SECONDS);
  const language: Language = options.language === "ja" ? "ja" : "en";
  const surface = { sport: "nhl", id: options.id, language } as SurfaceOptions;
  return renderLayers(surface, replayLayers(ILLUSTRATIVE_PLAY, t, PLAY_LOOK, language)).svg;
}
