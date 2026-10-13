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
}

/** Why the controller told its listeners. */
export type ReplayReason = "play" | "pause" | "seek" | "step" | "tick" | "speed" | "loop" | "motion";

/** What a listener of the controller is told. */
export interface ReplayChange {
  state: Readonly<ReplayState>;
  reason: ReplayReason;
  /** The events that went by in this move (moving forward only), for the live region. */
  crossed: readonly ReplayEvent[];
}
