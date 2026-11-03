// The camera of a race: it zooms slowly into the leader, moves with them, pans out, and always keeps the leader in view. The arithmetic is the follow camera's of a game's replay (`replay.follow.ts`: the shot the play
// asks for, a critically damped spring, a dead zone and a leash that holds the leader in the frame); this file tells it what a race is (the leader is the "puck", the cars behind it are the players) and shows the
// shot, flat by the drawing's `viewBox` and in 3D by the view's aim. The page that runs it is `circuits.race.dom.ts`.
import type { CircuitPlan } from "./circuits.ts";
import type { RaceMoment } from "./circuits.race.moment.ts";
import { type FollowBox, type FollowInput, type FollowLimits, type FollowMode, type FollowShot, followWindow } from "./replay.follow.ts";

/** What the race's camera follows: nothing (the whole circuit), the leader alone, or the leading group (the leader and the cars just behind it, the frame pulling back as they spread). */
export type RaceFollowMode = "off" | "leader" | "pack";

/** A mode from anything: `leader` and `pack` are themselves, everything else is `off`. */
export const raceFollowMode = (value: unknown): RaceFollowMode => (value === "leader" || value === "pack" ? value : "off");

/** The game camera's mode for a race's: the leader is the puck, the pack is the action. */
export const followModeOf = (mode: RaceFollowMode): FollowMode => (mode === "leader" ? "puck" : mode === "pack" ? "action" : "off");

/**
 * How the race's camera frames and moves: it comes in much closer than a game's (a circuit is a long way across and a car a dot), up to six times at the leader and four on the leader alone, with a wider leash so
 * that a leader at speed stays well inside the frame.
 */
export const RACE_FOLLOW_LIMITS: Readonly<Partial<FollowLimits>> = { maxZoom: 6, puckZoom: 4, near: 4, pad: 0.035, dead: 0.08, omega: 4.5, leash: 0.12 };

/** The circuit's box as the follow camera's rectangle, in the plan's feet. */
export const planBox = (plan: CircuitPlan): FollowBox => ({ x: plan.box.x0, y: plan.box.y0, w: plan.box.x1 - plan.box.x0, h: plan.box.y1 - plan.box.y0 });

/**
 * What the camera is told of a moment: the leader as the puck and the cars behind it as the players, in the plan's feet, and the circuit as the surface. A retired car is not part of the group.
 * @example
 * ```ts
 * import { raceAt, raceFollowInput, simulateRace } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const race = simulateRace({ circuit: "las-vegas", laps: 3, cars: 8 });
 * const input = raceFollowInput(race.plan, raceAt(race, 100));
 * console.log(input.objects.filter((o) => o.team === "puck").length, input.box.w > 0);
 * // 1 true
 * ```
 */
export function raceFollowInput(plan: CircuitPlan, moment: RaceMoment, behind = RACE_FOLLOW_LIMITS.near ?? 4): FollowInput {
  const [first, ...rest] = moment.standings;
  const objects: FollowInput["objects"] = first === undefined ? [] : [{ team: "puck", x: first.at[0], y: first.at[1] }, ...rest.filter((line) => line.status !== "out").slice(0, behind).map((line) => ({ team: "home" as const, x: line.at[0], y: line.at[1] }))];
  return { box: planBox(plan), objects };
}

/**
 * Show a shot on a flat drawing: the part of it to show, by its `viewBox` (one attribute), and the whole drawing again for `undefined`. A drawing written again is a new element: it is shown whole until `again`.
 * Returns what to call with a shot, and with a drawing that was just written.
 */
export function flatRaceShow(svg: () => SVGSVGElement | null, box: () => FollowBox, maxZoom: number): { show(shot: FollowShot | undefined): void; again(): void } {
  const whole = new WeakMap<SVGSVGElement, { view: FollowBox; text: string | null }>();
  let shown: FollowShot | undefined;
  const own = (el: SVGSVGElement): { view: FollowBox; text: string | null } => {
    let known = whole.get(el);
    if (known === undefined) {
      const text = el.getAttribute("viewBox");
      const [x, y, w, h] = (text ?? "").split(/[\s,]+/).map(Number);
      known = { view: [x, y, w, h].every(Number.isFinite) ? { x, y, w, h } : { x: 0, y: 0, w: 0, h: 0 }, text };
      whole.set(el, known);
    }
    return known;
  };
  const write = (shot: FollowShot | undefined): void => {
    const el = svg();
    if (el === null) return;
    const known = own(el);
    if (shot === undefined || !(known.view.w > 0)) {
      if (known.text === null) el.removeAttribute("viewBox");
      else if (el.getAttribute("viewBox") !== known.text) el.setAttribute("viewBox", known.text);
      return;
    }
    const w = followWindow(shot, box(), known.view, (p) => p, maxZoom);
    const text = `${w.x} ${w.y} ${w.w} ${w.h}`;
    if (el.getAttribute("viewBox") !== text) el.setAttribute("viewBox", text);
  };
  return {
    show(shot) {
      shown = shot;
      write(shot);
    },
    again() {
      if (shown !== undefined) write(shown);
    },
  };
}
