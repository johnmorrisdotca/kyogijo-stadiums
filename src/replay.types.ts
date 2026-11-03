// The types of a replay: tracking data over time on a surface. Plain data only (numbers, text and lists), so that a timeline can be
// saved as JSON and the same timeline at the same time always draws the same frame.
import type { Attacking, Frame, Landmark, SurfaceSize } from "./frames.ts";
import type { Unit } from "./units.ts";

/** What a tracked object is. `home` and `away` are players; the rest are drawn smaller and in the layer's plain colours. */
export type ReplayTeam = "home" | "away" | "ball" | "puck" | "official";

/** One tracked object in one frame of the data. */
export interface ReplayObject {
  /** Who it is, the same in every frame it is in: `h7`, `ball`. */
  id: string;
  team: ReplayTeam;
  /** Where it is, in the timeline's frame (`from`) and unit. */
  x: number;
  y: number;
  /** A name for the tooltip: "Rivera". */
  label?: string;
  /** A shirt number, written on the mark of a player. */
  number?: number | string;
}

/** The positions at one time. */
export interface ReplayFrame {
  /** Seconds. The frames of a timeline run forward in time (they are sorted if they do not). */
  t: number;
  objects: readonly ReplayObject[];
  /**
   * Who has the ball or the puck, when the data says: the `id` of an object, or `home` or `away` for a team without a named player.
   * `null` says nobody does (a loose ball, a pass in flight). It holds until a later frame says otherwise.
   */
  possession?: string | null;
}

/** The standard kinds of event. Any other word is an event of your own; its `label` is what is said. */
export type ReplayEventKind = "pass" | "shot" | "goal" | "whistle" | (string & {});

/** Something that happened at a time: a pass, a shot, a goal, a whistle. */
export interface ReplayEvent {
  /** Seconds, on the same clock as the frames. */
  t: number;
  kind: ReplayEventKind;
  /** The team it belongs to; it colours the mark. */
  team?: "home" | "away";
  /** Where it began, in the timeline's frame; else the place of the object `by` at `t`; else the ball's or the puck's at `t`. */
  x?: number;
  y?: number;
  /** Where it ended (a pass's receiver, a shot's end), in the timeline's frame; else the place of the object `to` at `until`. A mark with no end is a point. */
  x2?: number;
  y2?: number;
  /** The object that made it. */
  by?: string;
  /** The object that received it. */
  to?: string;
  /** When it ended, for `to` and for how long the mark stays: seconds. `t` by default. */
  until?: number;
  /** What is said of it, over the standard words: "Goal, Rivera". */
  label?: string;
}

/** A period of the game (or a half, a quarter, an inning) on the timeline's clock: what a scoreboard on the surface shows as the period and counts its clock in. */
export interface ReplayPeriod {
  /** The period's number as the board writes it. Its place in the list (1 for the first) when missing. */
  number?: number;
  /** Where it begins and ends, in seconds on the timeline's clock. */
  start: number;
  end: number;
  /** How long the period is on the game clock, in seconds, when the replay is re-timed (a made-up game played in minutes: 1200 for a hockey period). The board's clock runs through it from start to end. Else the clock runs in the timeline's own seconds. */
  length?: number;
}

/**
 * A stoppage: play is dead from `start` to `end` (the drop of the puck, a throw-in, a snap), in seconds on the timeline's clock. The game clock stands still in it while the replay's own clock (the
 * slider) moves on: the players skate to their places for the restart, and the ball or the puck is dead.
 */
export interface ReplayStoppage {
  /** When play stopped. */
  start: number;
  /** When play starts again: the game clock runs from here. */
  end: number;
  /** Why: a word of the sport's rule set (in hockey `goal`, `save`, `frozen`, `icing`, `offside`, `penalty`, `whistle`, `period-start`, `period-end`), or one of your own. */
  reason?: string;
  /** Where play starts again (the face-off dot), in the timeline's frame. */
  x?: number;
  y?: number;
  /** The side the stoppage was called against (the side that iced the puck, went offside or took the penalty), when there is one. */
  team?: "home" | "away";
}

/**
 * A penalty: a player in the penalty box from `start` (the call, a stoppage) to `end` (when he leaves it: his time ran out on the game clock, or a power-play goal ended a minor), in seconds on the
 * timeline's clock. His side plays a skater short in that time unless `short` is `false` (a misconduct, or coincidental penalties, which leave the strength even).
 */
export interface ReplayPenalty {
  team: "home" | "away";
  /** The player who serves it: the id of his object, which the frames put in the box. */
  by?: string;
  start: number;
  /** When he leaves the box. Without it, the penalty runs for its `minutes` of game clock from the drop after the call. */
  end?: number;
  /** Its length on the game clock: 2 for a minor, 4 for a double minor, 5 for a major, 10 for a misconduct. */
  minutes: number;
  /** A word of the sport's rule set (in hockey `minor`, `double-minor`, `major`, `misconduct`, `bench-minor`), or one of your own. */
  kind?: string;
  /** Whether his side plays short while he sits: `true` unless said otherwise. */
  short?: boolean;
  /** `goal` when a power-play goal ended it before its time was up: until that goal the board counts its minutes down as if it would run them all. */
  endedBy?: "goal";
}

/** Tracking data over time on a surface. Do not change a timeline after it has been used: make a new one. */
export interface ReplayTimeline {
  /** The positions, from the first moment to the last. */
  frames: readonly ReplayFrame[];
  /** What happened, by time. */
  events?: readonly ReplayEvent[];
  /** The frame the positions are in (a name in `FRAMES`, or a `Frame`), as for a layer. Without it they are the surface's own: feet from the top left of the surface as drawn wide. */
  from?: Frame | string;
  /** The unit of the positions, as for a layer. */
  units?: Unit | "rulebook";
  /** The end the home team attacks, as for a layer, for a frame fixed to the surface. */
  attacking?: Attacking;
  /** The surface's size, for a frame that fits any size. */
  surfaceSize?: SurfaceSize;
  /** Landmarks of your own for an axis of the frame. */
  anchors?: { x?: readonly Landmark[]; y?: readonly Landmark[] };
  /** The periods of the game, in order. A scoreboard hung over a 3D view shows the one the clock is in. */
  periods?: readonly ReplayPeriod[];
  /** Whether a scoreboard's game clock counts the time left in the period (`down`, the default: hockey, basketball, football) or the time gone (`up`: soccer). */
  clock?: "down" | "up";
  /** The stoppages, in order. The game clock stands still in each, from its `start` to its `end`, and the board shows the same time all through it. */
  stoppages?: readonly ReplayStoppage[];
  /** The penalties, in order of their calls: who sits in the box, and for how long on the game clock. The board shows each side's strength and the time left of each penalty. */
  penalties?: readonly ReplayPenalty[];
}

/** How a frame is drawn. */
export interface ReplayLook {
  /** Seconds of trail behind the objects named in `trailOf`; 0 for none. 2 by default. */
  trail?: number;
  /** Whose trail is drawn. The ball and the puck by default. */
  trailOf?: readonly ReplayTeam[];
  /** Round the corners of the path between frames: `true` for a Catmull-Rom curve through the frames, or a share from 0 (straight lines, the default) to 1. */
  smooth?: boolean | number;
  /** Seconds an event's mark stays on the surface after it. 3 by default. */
  hold?: number;
  /** Write the shirt numbers on the players. On by default. */
  numbers?: boolean;
  /** A multiple of the size of the players' marks. 1 by default. */
  scale?: number;
}

/** What the controller and the controls can be told, over how a frame is drawn. */
export interface ReplaySettings extends ReplayLook {
  /** The speed of play: 0.25 to 4. 1 by default. */
  speed?: number;
  /** Start again at the end. */
  loop?: boolean;
  /** Play when the replay is attached. Ignored for a reader who prefers reduced motion, and while the page is hidden. */
  autoplay?: boolean;
  /** The bar of controls under the drawing (play, step, speed, loop, position). On by default; the keyboard works without it. */
  controls?: boolean;
  /** Announce goals, shots and the other events to a screen reader as they pass. On by default. */
  announce?: boolean;
  /** `auto` (the default) follows the reader's `prefers-reduced-motion`: with reduced motion nothing plays by itself and play steps instead. `smooth` and `step` force one. */
  motion?: "auto" | "smooth" | "step";
  /** In step mode, how many seconds a step moves. 1 by default. */
  stepSeconds?: number;
  /** The time to begin at, in seconds from the first frame. 0 by default. */
  start?: number;
  /** The camera follows the play: `action` (the players near the puck or ball), `puck` (the puck or ball), or `off` (the default). See `followShot`. */
  follow?: "off" | "action" | "puck";
}

/** A tracked object at a moment, and the trail behind it. */
export interface ReplayTrail {
  id: string;
  team: ReplayTeam;
  /** The places over the last seconds, oldest first, the last the object's place now. */
  points: [number, number][];
}

/** An event that is on the surface now, with its places worked out. */
export interface ActiveEvent {
  /** Its place in the timeline's `events`. */
  index: number;
  event: ReplayEvent;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
}

/** Who has the ball, when the data says. */
export interface Possession {
  holder?: string;
  team?: "home" | "away";
}

/** What the controller is doing. */
export interface ReplayState {
  /** Seconds on the timeline's clock. */
  t: number;
  /** The first and last moments of the timeline. */
  start: number;
  end: number;
  playing: boolean;
  /** Stopped at the end (and not looping). */
  ended: boolean;
  speed: number;
  loop: boolean;
  /** `step` for a reader who prefers reduced motion: play moves a step, never by itself. */
  motion: "smooth" | "step";
  /** What the camera follows, and whether the reader's own turn or zoom of a 3D view holds it until it is resumed. */
  follow: "off" | "action" | "puck";
  followHeld: boolean;
}

/** Why the controller told its listeners. */
export type ReplayReason = "play" | "pause" | "seek" | "step" | "tick" | "speed" | "loop" | "motion" | "follow";

/** What a listener of the controller is told. */
export interface ReplayChange {
  state: Readonly<ReplayState>;
  reason: ReplayReason;
  /** The events that went by in this move (moving forward only), for the live region. */
  crossed: readonly ReplayEvent[];
}
