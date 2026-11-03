// Following the play on a 3D view: the shot of replay.follow.ts turned into what the view looks at (a point of the floor, and a zoom on top of the view's own), so that the auto-turn, the
// tip and every viewpoint go on as they were while the camera follows. The reader's own turn, tip or zoom holds it until Resume; a viewpoint or Reset also takes it back to the whole surface,
// in the same glide. It runs in the replay's own paint, inside the view's one animation frame, and never asks for a frame of its own.
import { outlineOf } from "./outline.ts";
import type { ReplayController } from "./replay.control.ts";
import { followRunner, zoomFor, type FollowShot } from "./replay.follow.ts";
import { replayPlacer, replaySnapshot } from "./replay.ts";
import type { ReplayChange, ReplayLook, ReplayTimeline } from "./replay.types.ts";
import type { Aim } from "./turn.dom.ts";
import type { TurnModel } from "./turn.model.ts";
import type { TurnInternals } from "./turn.replay.dom.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

type P = [number, number];

/**
 * What a 3D view looks at for a shot: the shot's middle as a point of the floor in the scene's pixels from its middle, and the zoom on top of the view's. The scene at a zoom of 1 holds more
 * than the surface (the boards, the stands): the zoom is worked out against how much more, so that the closest shot frames the same share of the surface as a flat drawing's.
 */
export function aimOf(shot: FollowShot, model: Pick<TurnModel, "scale" | "centre" | "box">, surface: { w: number; h: number }): Aim {
  const s = model.scale;
  const room = Math.hypot(model.box.x1 - model.box.x0, model.box.y1 - model.box.y0) / Math.max(1e-9, Math.hypot(surface.w * s, surface.h * s));
  return { focus: [(shot.x - model.centre[0]) * s, (shot.y - model.centre[1]) * s], zoom: zoomFor(shot.zoom, Math.min(3, room)) };
}

/** What `turnFollow` gives back: the paint the replay calls on each change of its clock, and `destroy`. */
export interface TurnFollow {
  paint(change: ReplayChange): void;
  destroy(): void;
}

/** The camera of a replay on a 3D view. `floor` is the options the floor is drawn with (the replay's), or `undefined` before it is laid. */
export function turnFollow(view: TurnInternals, controller: () => ReplayController, timeline: ReplayTimeline, look: ReplayLook, floor: () => SurfaceOptions | ScoreOptions | undefined): TurnFollow {
  const surface = (): { x: number; y: number; w: number; h: number } => outlineOf((floor() ?? view.model().options) as SurfaceOptions).box;
  const runner = followRunner({
    timeline,
    now: () => view.doc.defaultView?.performance.now() ?? 0,
    at(t, stop) {
      const place = replayPlacer(floor() ?? view.model().options, timeline);
      const objects = replaySnapshot(timeline, t, look).objects;
      const placed = place(objects.map((o): P => [o.x, o.y]));
      return { box: surface(), objects: objects.map((o, i) => ({ team: o.team, x: placed[i][0], y: placed[i][1] })), stop: stop === undefined ? undefined : place([[stop[0], stop[1]]])[0] };
    },
    show: (shot) => view.aim(shot === undefined ? undefined : aimOf(shot, view.model(), surface())),
  });
  const stop = view.onUser((kind) => {
    if (controller().state().follow === "off") return;
    controller().holdFollow(true);
    if (kind === "preset") {
      runner.reset();
      view.aim(undefined, true);
    }
  });
  return {
    paint: (change) => runner.paint(change),
    destroy() {
      stop();
      view.aim(undefined);
    },
  };
}
