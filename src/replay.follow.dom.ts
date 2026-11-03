// Following the play in a page: the buttons in the replay's bar (Action, Puck or Ball, and Resume), and the camera of a flat replay, which shows part of the drawing by its `viewBox`. The
// arithmetic is replay.follow.ts's; the 3D view's camera is turn.follow.ts's.
import { outlineOf } from "./outline.ts";
import type { ReplayController } from "./replay.control.ts";
import { FOLLOW_LIMITS, followRunner, followWindow, type FollowBox, type FollowRunner } from "./replay.follow.ts";
import { replayPlacer, replaySnapshot } from "./replay.ts";
import type { ReplayLook, ReplayState, ReplayTimeline } from "./replay.types.ts";
import type { KyogijoWords } from "./strings.core.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

type P = [number, number];

/** The buttons' own rules, added to the replay's stylesheet: a word beside each icon. */
export const FOLLOW_STYLE = `
.ky-replay .ky-follow{display:inline-flex;flex-wrap:wrap;gap:.5rem}
.ky-replay .ky-follow button{gap:.35rem}
.ky-replay .ky-follow svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
`.trim();

const SHAPES = {
  action: "M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5M9 12h6M12 9v6",
  puck: "M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0.01 0",
  resume: "M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5",
};

/** The buttons of the follow camera, for the replay's bar, and how to make them say the state. */
export interface FollowControls {
  parts: HTMLElement[];
  sync(state: Readonly<ReplayState>): void;
}

/** What the timeline follows: a puck, a ball, or neither (then there is no Puck button). */
const followed = (timeline: ReplayTimeline): "puck" | "ball" | undefined => {
  for (const frame of timeline.frames) for (const o of frame.objects) if (o.team === "puck" || o.team === "ball") return o.team;
  return undefined;
};

/**
 * The buttons: Action and Puck (Ball for a game with a ball) press in and out, one at a time, and pressing the one that is in turns the camera off (held or not); Resume shows only while the
 * reader's own turn or zoom holds the camera.
 */
export function followControls(doc: Document, words: KyogijoWords["replay"], controller: ReplayController, timeline: ReplayTimeline): FollowControls {
  const group = doc.createElement("span");
  group.className = "ky-follow";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", words.follow);
  const button = (name: string, word: string, label: string, onClick: () => void): HTMLButtonElement => {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = `ky-follow-${name}`;
    b.setAttribute("aria-label", label);
    b.title = label;
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${SHAPES[name as keyof typeof SHAPES]}"/></svg><span>${word}</span>`;
    b.addEventListener("click", onClick);
    return b;
  };
  const press = (mode: "action" | "puck") => () => controller.setFollow(controller.state().follow === mode ? "off" : mode);
  const ball = followed(timeline);
  const action = button("action", words.followAction, words.followActionLabel, press("action"));
  const puck = button("puck", ball === "ball" ? words.followBall : words.followPuck, ball === "ball" ? words.followBallLabel : words.followPuckLabel, press("puck"));
  puck.hidden = ball === undefined;
  const resume = button("resume", words.followResume, words.followResumeLabel, () => controller.holdFollow(false));
  group.append(action, puck, resume);
  return {
    parts: [group],
    sync(state) {
      action.setAttribute("aria-pressed", String(state.follow === "action"));
      puck.setAttribute("aria-pressed", String(state.follow === "puck"));
      resume.hidden = !state.followHeld;
      group.dataset.follow = state.followHeld ? "held" : state.follow;
    },
  };
}

/** The matrix that takes the replay's layers to the drawing's own units: a surface laid tall is turned a quarter inside its drawing. */
function layersToDrawing(svg: SVGSVGElement): (p: P) => P {
  const layers = svg.querySelector("g.ky-layers");
  let m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  for (let el = layers?.parentElement ?? null; el !== null && el !== (svg as Element); el = el.parentElement) {
    const t = (el as unknown as SVGGraphicsElement).transform?.baseVal?.consolidate?.()?.matrix;
    if (t === undefined || t === null) continue;
    // The outer transform after the inner: t times m.
    m = { a: t.a * m.a + t.c * m.b, b: t.b * m.a + t.d * m.b, c: t.a * m.c + t.c * m.d, d: t.b * m.c + t.d * m.d, e: t.a * m.e + t.c * m.f + t.e, f: t.b * m.e + t.d * m.f + t.f };
  }
  return ([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}

/** What the flat camera is given: the drawing now, what it was drawn from, the timeline and how its frames are drawn. */
export interface FlatFollowSource {
  svg(): SVGSVGElement | null;
  options(): SurfaceOptions | ScoreOptions;
  timeline: ReplayTimeline;
  look: ReplayLook;
  now(): number;
}

/**
 * The camera of a flat replay: it shows the part of the drawing the shot frames by writing the drawing's `viewBox`, one attribute, and puts the whole drawing back when it is off. A drawing
 * written again (a theme, a score) is shown at the same shot by `again`.
 */
export function flatFollow(source: FlatFollowSource): FollowRunner {
  const whole = new WeakMap<SVGSVGElement, { view: FollowBox; text: string | null; map: (p: P) => P }>();
  const own = (svg: SVGSVGElement): { view: FollowBox; text: string | null; map: (p: P) => P } => {
    let known = whole.get(svg);
    if (known === undefined) {
      const text = svg.getAttribute("viewBox");
      const [x, y, w, h] = (text ?? "").split(/[\s,]+/).map(Number);
      known = { view: [x, y, w, h].every(Number.isFinite) ? { x, y, w, h } : { x: 0, y: 0, w: 0, h: 0 }, text, map: layersToDrawing(svg) };
      whole.set(svg, known);
    }
    return known;
  };
  const box = (): FollowBox => outlineOf(source.options() as SurfaceOptions).box;
  return followRunner({
    timeline: source.timeline,
    now: source.now,
    at(t, stop) {
      const place = replayPlacer(source.options(), source.timeline);
      const objects = replaySnapshot(source.timeline, t, source.look).objects;
      const placed = place(objects.map((o): P => [o.x, o.y]));
      return { box: box(), objects: objects.map((o, i) => ({ team: o.team, x: placed[i][0], y: placed[i][1] })), stop: stop === undefined ? undefined : place([[stop[0], stop[1]]])[0] };
    },
    show(shot) {
      const svg = source.svg();
      if (svg === null) return;
      const known = own(svg);
      if (shot === undefined || !(known.view.w > 0)) {
        if (known.text === null) svg.removeAttribute("viewBox");
        else svg.setAttribute("viewBox", known.text);
        return;
      }
      const w = followWindow(shot, box(), known.view, known.map, FOLLOW_LIMITS.maxZoom);
      const text = `${w.x} ${w.y} ${w.w} ${w.h}`;
      if (svg.getAttribute("viewBox") !== text) svg.setAttribute("viewBox", text);
    },
  });
}
