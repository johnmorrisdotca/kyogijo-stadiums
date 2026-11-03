// A replay on a 3D view in a page: the replay's controls under the view's, the floor's marks moved as the flat replay moves them, and the discs of the players moved on the floor, each
// animation frame writing only what moved. The view is the mount's (`turn.dom.ts`); it hands this file what it needs through `TurnInternals`, and goes on turning, tipping and zooming as
// it plays. Nothing runs while the replay is paused, the page hidden or the view out of sight.
import type { KyogijoReplay } from "./mount.ts";
import { createReplayView, replayDriver, replayPainter } from "./replay.dom.ts";
import { useTurnReplay } from "./turn.dom.ts";
import { drawFrameOf, replayPlacer, replaySnapshot } from "./replay.ts";
import type { ReplaySettings, ReplayTimeline } from "./replay.types.ts";
import type { TurnModel } from "./turn.model.ts";
import { keepOnFloor, moveDisc, replayTurnModel, type TurnReplayLook, type TurnReplayModel } from "./turn.replay.ts";
import type { Language } from "./types.ts";

/** What a 3D view lends a replay: its elements, its model, a way to lay the replay on the model, and a way to paint the view again. */
export interface TurnInternals {
  doc: Document;
  /** The view's root (`.ky-turn`) and the element that turns (`.ky-turn-view`). */
  root: HTMLElement;
  stage: HTMLElement;
  model(): TurnModel;
  /** Lay a replay on every model the view makes from now on (`undefined` takes it off), draw the world again with it, and call `after` once it is drawn, then and each time after. */
  setDecorate(decorate: ((model: TurnModel) => TurnModel) | undefined, after?: () => void): void;
  /** Paint the view as it is now: the planes whose place changed are written, the others are not touched. */
  repaint(): void;
  /** The view's own frame requests, which the auto-turn shares: one animation frame a frame, whatever runs. */
  requestFrame(callback: FrameRequestCallback): number;
  cancelFrame(id: number): void;
}

/** Settings of a replay on a 3D view: the flat replay's, and `stand`. */
export type TurnReplaySettings = ReplaySettings & TurnReplayLook;

/** Attach a replay to a 3D view. The controller it gives back has `destroy`, which takes the replay away and leaves the view as it was. */
export function attachTurnReplay(view: TurnInternals, timeline: ReplayTimeline, settings: TurnReplaySettings): KyogijoReplay {
  const { doc, root, stage } = view;
  const look: TurnReplayLook = settings;
  let language: Language = view.model().language;
  let laid: TurnReplayModel | undefined;
  let floorSvg: SVGSVGElement | null = null;
  /** The element of each disc, and whether it was last shown. */
  let discs = new Map<string, { el: HTMLElement | null; shown: boolean }>();
  let placedAt = Number.NaN;

  const painter = replayPainter({
    doc,
    timeline,
    look,
    svg: () => floorSvg,
    options: () => laid?.floorOptions ?? view.model().options,
    language: () => language,
    keep: look.stand === false ? undefined : keepOnFloor,
    redraw: (t) => {
      // The floor alone is drawn again (a mark that cannot be matched): the planes round it stay.
      if (floorSvg === null || laid === undefined) return;
      const scratch = doc.createElement("div");
      scratch.innerHTML = drawFrameOf(laid.floorOptions, timeline, t, look, look.stand === false ? () => true : keepOnFloor);
      const fresh = scratch.querySelector<SVGSVGElement>("svg.kyogijo");
      if (fresh === null) return;
      floorSvg.replaceWith(fresh);
      floorSvg = fresh;
    },
  });

  /** Move the discs to a time: a plane's place changes, and an element is shown or hidden only when that changes. */
  const place = (t: number): void => {
    if (laid === undefined || t === placedAt) return;
    placedAt = t;
    const snap = replaySnapshot(timeline, t, look);
    const placed = replayPlacer(laid.floorOptions, timeline)(snap.objects.map((o): [number, number] => [o.x, o.y]));
    const here = new Map<string, [number, number]>();
    snap.objects.forEach((o, i) => here.set(o.id, placed[i]));
    const lift = view.model().uprights.lift;
    for (const [id, disc] of laid.discs) {
      const at = here.get(id);
      if (at !== undefined) moveDisc(disc.plane, at[0], at[1], laid.size, lift);
      const node = discs.get(id);
      if (node?.el !== null && node !== undefined && node.shown !== (at !== undefined)) {
        node.shown = at !== undefined;
        node.el.style.visibility = node.shown ? "" : "hidden";
      }
    }
  };

  const wrap = doc.createElement("div");
  wrap.className = "ky-replay ky-turn-replay";
  const driver = replayDriver(doc, timeline, settings, {
    paint: (t) => {
      painter.paint(t);
      place(t);
      view.repaint();
    },
    language,
    keysOn: wrap,
    holder: wrap,
    seen: stage,
    help: "turn",
    frames: { request: view.requestFrame, cancel: view.cancelFrame },
  });
  const { style, hint, bar, live } = driver.parts;
  wrap.append(style, hint, bar, live);
  const controls = root.querySelector(".ky-turn-controls");
  if (controls !== null) controls.after(wrap);
  else root.append(wrap);
  // The view's own description, and the replay's keys after it.
  const described = stage.getAttribute("aria-describedby");
  stage.setAttribute("aria-describedby", `${described ?? ""} ${hint.id}`.trim());
  const shortcuts = stage.getAttribute("aria-keyshortcuts");
  stage.setAttribute("aria-keyshortcuts", `${shortcuts ?? ""} , . Shift+, Shift+. End`.trim());

  // The keys of the view itself: Space plays and pauses the replay (the Auto-turn button still turns the view), comma and full stop step, End goes to the end. The arrows stay the view's.
  const onStageKey = (event: KeyboardEvent): void => {
    const target = event.target as Node | null;
    if (target === null || (target !== stage && !stage.contains(target))) return;
    driver.key(event, "stage");
  };
  root.addEventListener("keydown", onStageKey, true);

  // Each time the view draws its world (now, and again after `update` or a change of quality), the model has the replay at the clock's time: the elements are found again.
  const after = (): void => {
    language = view.model().language;
    driver.setLanguage(language);
    floorSvg = root.querySelector<SVGSVGElement>(".ky-turn-floor > svg.kyogijo");
    discs = new Map();
    if (laid !== undefined) {
      const byPart = new Map([...root.querySelectorAll<HTMLElement>(".ky-up-player")].map((el) => [el.dataset.part ?? "", el]));
      for (const [id, disc] of laid.discs) {
        const el = byPart.get(disc.plane.id) ?? null;
        if (el !== null && !disc.on) el.style.visibility = "hidden";
        discs.set(id, { el, shown: disc.on });
      }
    }
    const t = driver.controller.state().t;
    placedAt = t;
    painter.bind(t);
  };
  view.setDecorate((model) => {
    laid = replayTurnModel(model, timeline, driver.controller.state().t, look);
    return laid.model;
  }, after);

  if (settings.autoplay === true && driver.controller.state().motion === "smooth" && doc.visibilityState !== "hidden") driver.controller.play();

  return {
    ...driver.controller,
    destroy() {
      driver.destroy();
      root.removeEventListener("keydown", onStageKey, true);
      if (described === null) stage.removeAttribute("aria-describedby");
      else stage.setAttribute("aria-describedby", described);
      if (shortcuts === null) stage.removeAttribute("aria-keyshortcuts");
      else stage.setAttribute("aria-keyshortcuts", shortcuts);
      wrap.remove();
      laid = undefined;
      discs = new Map();
      floorSvg = null;
      view.setDecorate(undefined);
    },
  };
}

// The view's `replay` plays with this file's code once it is loaded.
useTurnReplay({ attach: attachTurnReplay, flat: createReplayView });
