// A follow camera on a 3D view, the parts that know no replay: the shot turned into what the view looks at, and the Auto-follow toggle beside the view's Auto-turn. A game's replay (`turn.follow.ts`) and a race on a
// circuit (`circuits.race.dom.ts`) both use them, so that a race's page loads none of the replay's drawing.
import { FOLLOW_LIMITS, zoomFor, type FollowShot } from "./replay.follow.ts";
import type { Aim } from "./turn.dom.ts";
import type { TurnModel } from "./turn.model.ts";
import type { TurnInternals } from "./turn.replay.dom.ts";

/**
 * What a 3D view looks at for a shot: the shot's middle as a point of the floor in the scene's pixels from its middle, and the zoom on top of the view's. The scene at a zoom of 1 holds more
 * than the surface (the boards, the stands): the zoom is worked out against how much more, so that the closest shot frames the same share of the surface as a flat drawing's.
 */
export function aimOf(shot: FollowShot, model: Pick<TurnModel, "scale" | "centre" | "box">, surface: { w: number; h: number }, maxZoom = FOLLOW_LIMITS.maxZoom): Aim {
  const s = model.scale;
  const room = Math.hypot(model.box.x1 - model.box.x0, model.box.y1 - model.box.y0) / Math.max(1e-9, Math.hypot(surface.w * s, surface.h * s));
  return { focus: [(shot.x - model.centre[0]) * s, (shot.y - model.centre[1]) * s], zoom: zoomFor(shot.zoom, Math.min(3, room), maxZoom) };
}

/** The toggle beside the view's Auto-turn that turns a follow camera on and off. */
export interface AutoFollowButton {
  button: HTMLButtonElement;
  /** Press it in or out: written only when it changed. */
  set(on: boolean): void;
  destroy(): void;
}

/**
 * Put an **Auto-follow** toggle in the view's button row, right after Auto-turn and made like it (the same pill, pressed while it is on), so that the two read as a family and can be on together: the view turns
 * slowly while the camera follows. `onPress` is told what pressing it asks for. The button is made again if the view's buttons are (call `again()`); `undefined` when the view has no row of buttons.
 */
export function autoFollowButton(view: Pick<TurnInternals, "doc" | "root">, word: string, label: string, onPress: () => void): (AutoFollowButton & { again(): void }) | undefined {
  const turn = view.root.querySelector<HTMLElement>("button[data-act=play]");
  if (turn === null) return undefined;
  const button = view.doc.createElement("button");
  button.type = "button";
  button.dataset.act = "follow";
  button.dataset.wide = "";
  button.setAttribute("aria-pressed", "false");
  button.textContent = word;
  button.title = label;
  button.addEventListener("click", onPress);
  turn.after(button);
  let on = false;
  return {
    button,
    set(next) {
      on = next;
      if (button.getAttribute("aria-pressed") !== String(next)) button.setAttribute("aria-pressed", String(next));
    },
    // The view made its buttons again: ours goes back in beside Auto-turn.
    again() {
      if (button.isConnected) return;
      view.root.querySelector("button[data-act=play]")?.after(button);
      button.setAttribute("aria-pressed", String(on));
    },
    destroy() {
      button.removeEventListener("click", onPress);
      button.remove();
    },
  };
}
