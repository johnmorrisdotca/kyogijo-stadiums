import { describe, expect, it } from "vitest";
import { FOLLOW_LIMITS, clampShot, createReplay, followCamera, followShot, followStop, followWindow, frameOf, springStep, zoomFor } from "./replay-entry.ts";
import type { FollowBox, FollowInput, FollowShot, ReplayChange, ReplayTimeline } from "./replay-entry.ts";
import { followRunner } from "./replay.follow.ts";

const RINK: FollowBox = { x: 0, y: 0, w: 200, h: 85 };
const EPS = 1e-6;

/** A small, steady random walk: the same numbers on every run. */
function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Ten skaters and a puck somewhere on the rink. */
function scene(next: () => number): FollowInput {
  const objects: { team: "puck" | "home" | "away"; x: number; y: number }[] = [{ team: "puck", x: next() * 200, y: next() * 85 }];
  for (let i = 0; i < 10; i += 1) objects.push({ team: i % 2 === 0 ? "home" : "away", x: next() * 200, y: next() * 85 });
  return { box: RINK, objects };
}

const inside = (p: { x: number; y: number }, f: FollowBox, slack = EPS): boolean => p.x >= f.x - slack && p.x <= f.x + f.w + slack && p.y >= f.y - slack && p.y <= f.y + f.h + slack;
const onSurface = (shot: FollowShot, box: FollowBox): boolean => {
  const f = frameOf(shot, box);
  return f.x >= box.x - EPS && f.y >= box.y - EPS && f.x + f.w <= box.x + box.w + EPS && f.y + f.h <= box.y + box.h + EPS;
};

describe("followShot: the shot the play asks for", () => {
  it("always holds the puck, stays on the surface and within the limits, wherever the play is", () => {
    const next = random(7);
    for (let i = 0; i < 500; i += 1) {
      const input = scene(next);
      for (const mode of ["action", "puck"] as const) {
        const shot = followShot(mode, input);
        expect(inside(input.objects[0], frameOf(shot, RINK))).toBe(true);
        expect(onSurface(shot, RINK)).toBe(true);
        expect(shot.zoom).toBeGreaterThanOrEqual(1);
        expect(shot.zoom).toBeLessThanOrEqual(FOLLOW_LIMITS.maxZoom);
      }
    }
  });

  it("closes in when the play is bunched at one end and pulls back when the players spread", () => {
    const bunched: FollowInput = { box: RINK, objects: [{ team: "puck", x: 175, y: 40 }, ...[0, 1, 2, 3, 4].map((i) => ({ team: "home" as const, x: 165 + i * 4, y: 30 + i * 4 })), { team: "away", x: 20, y: 40 }] };
    const spread: FollowInput = { box: RINK, objects: [{ team: "puck", x: 100, y: 40 }, ...[0, 1, 2, 3, 4].map((i) => ({ team: "home" as const, x: 20 + i * 40, y: 10 + i * 15 }))] };
    const close = followShot("action", bunched);
    const wide = followShot("action", spread);
    expect(close.zoom).toBeGreaterThan(2);
    expect(close.x).toBeGreaterThan(140);
    expect(wide.zoom).toBeLessThan(1.3);
    // The frame of the action holds the five nearest players.
    for (const o of bunched.objects.slice(1, 6)) expect(inside(o, frameOf(close, RINK))).toBe(true);
  });

  it("is never closer than the limit, even for a puck alone", () => {
    expect(followShot("action", { box: RINK, objects: [{ team: "puck", x: 100, y: 40 }] }).zoom).toBe(FOLLOW_LIMITS.maxZoom);
    expect(followShot("action", { box: RINK, objects: [{ team: "puck", x: 100, y: 40 }] }, { maxZoom: 1.5 }).zoom).toBe(1.5);
  });

  it("puts the puck in the middle at its zoom, and moves in from the boards", () => {
    expect(followShot("puck", { box: RINK, objects: [{ team: "puck", x: 100, y: 40 }] })).toEqual({ x: 100, y: 40, zoom: 2 });
    expect(followShot("puck", { box: RINK, objects: [{ team: "puck", x: 199, y: 84 }] })).toEqual({ x: 150, y: 63.75, zoom: 2 });
    // A puck off the ice (over the boards, on a bench) is held to the ice.
    expect(onSurface(followShot("puck", { box: RINK, objects: [{ team: "puck", x: 400, y: -50 }] }), RINK)).toBe(true);
  });

  it("goes to the faceoff dot in a stoppage, and shows the whole surface when off or with nothing to follow", () => {
    const input: FollowInput = { box: RINK, objects: [{ team: "puck", x: 20, y: 20 }], stop: [169, 64.5] };
    const shot = followShot("action", input);
    expect(inside({ x: 169, y: 64.5 }, frameOf(shot, RINK))).toBe(true);
    expect(shot.zoom).toBe(FOLLOW_LIMITS.maxZoom);
    expect(followShot("off", input)).toEqual({ x: 100, y: 42.5, zoom: 1 });
    expect(followShot("action", { box: RINK, objects: [] })).toEqual({ x: 100, y: 42.5, zoom: 1 });
    // No puck: the players' middle.
    expect(followShot("puck", { box: RINK, objects: [{ team: "home", x: 150, y: 40 }] }).x).toBeGreaterThan(120);
  });

  it("holds a shot to the surface and the limits", () => {
    expect(clampShot({ x: -50, y: 500, zoom: 9 }, RINK)).toEqual({ x: 40, y: 68, zoom: 2.5 });
    expect(clampShot({ x: 10, y: 10, zoom: 0.2 }, RINK)).toEqual({ x: 100, y: 42.5, zoom: 1 });
    expect(clampShot({ x: Number.NaN, y: 10, zoom: Number.NaN }, RINK)).toEqual({ x: 100, y: 42.5, zoom: 1 });
  });
});

describe("springStep", () => {
  it("never overshoots, and comes to the goal", () => {
    let [x, v] = [0, 0];
    let most = 0;
    for (let i = 0; i < 300; i += 1) {
      [x, v] = springStep(x, v, 10, 1 / 60, 3.2);
      most = Math.max(most, x);
    }
    expect(most).toBeLessThanOrEqual(10);
    expect(x).toBeCloseTo(10, 3);
    // One long step lands nearer, never past.
    expect(springStep(0, 0, 10, 5, 3.2)[0]).toBeLessThanOrEqual(10);
    expect(springStep(3, 1, 10, 0, 3.2)).toEqual([3, 1]);
  });
});

describe("followCamera: the camera that eases after the play", () => {
  /** The puck skating about: a smooth path with a little noise, at 60 frames a second. */
  const path = (seed: number, frames: number): FollowInput[] => {
    const next = random(seed);
    let [x, y, vx, vy] = [100, 42, 30, 10];
    const out: FollowInput[] = [];
    const players = [0, 1, 2, 3, 4, 5].map(() => [next() * 200, next() * 85]);
    for (let i = 0; i < frames; i += 1) {
      vx += (next() - 0.5) * 20;
      vy += (next() - 0.5) * 20;
      [vx, vy] = [Math.max(-60, Math.min(60, vx)), Math.max(-40, Math.min(40, vy))];
      x += vx / 60;
      y += vy / 60;
      if (x < 2 || x > 198) vx = -vx;
      if (y < 2 || y > 83) vy = -vy;
      [x, y] = [Math.max(0, Math.min(200, x)), Math.max(0, Math.min(85, y))];
      for (const p of players) [p[0], p[1]] = [p[0] + (x - p[0]) * 0.02, p[1] + (y - p[1]) * 0.02];
      out.push({ box: RINK, objects: [{ team: "puck", x, y }, ...players.map(([px, py], j) => ({ team: (j % 2 === 0 ? "home" : "away") as "home" | "away", x: px, y: py }))] });
    }
    return out;
  };

  it("keeps the puck in the frame, on the surface and within the limits at every frame, and eases: no frame moves it far", () => {
    for (const mode of ["action", "puck"] as const) {
      const camera = followCamera();
      let before: FollowShot | undefined;
      let jump = 0;
      for (const input of path(mode === "action" ? 3 : 11, 1200)) {
        const shot = camera.update(mode, input, 1 / 60);
        expect(inside(input.objects[0], frameOf(shot, RINK))).toBe(true);
        expect(onSurface(shot, RINK)).toBe(true);
        expect(shot.zoom).toBeGreaterThanOrEqual(1);
        expect(shot.zoom).toBeLessThanOrEqual(FOLLOW_LIMITS.maxZoom);
        if (before !== undefined) jump = Math.max(jump, Math.hypot(shot.x - before.x, shot.y - before.y));
        before = shot;
      }
      // A frame at 60 a second moves the middle a couple of feet at most: about two per cent of the rink.
      expect(jump).toBeLessThan(4);
    }
  });

  it("comes to rest when the play is still, and then gives the very same shot; a little noise does not move it", () => {
    const camera = followCamera();
    const still: FollowInput = { box: RINK, objects: [{ team: "puck", x: 170, y: 30 }, { team: "home", x: 160, y: 25 }, { team: "away", x: 180, y: 50 }] };
    let shot = camera.update("action", still, 1 / 60);
    for (let i = 0; i < 600; i += 1) shot = camera.update("action", still, 1 / 60);
    const rest = { ...shot };
    const next = random(5);
    for (let i = 0; i < 300; i += 1) {
      const shaken: FollowInput = { ...still, objects: still.objects.map((o) => ({ ...o, x: o.x + (next() - 0.5), y: o.y + (next() - 0.5) })) };
      expect(camera.update("action", shaken, 1 / 60)).toEqual(rest);
    }
  });

  it("starts from the whole surface, and eases back to it when turned off", () => {
    const camera = followCamera();
    const input: FollowInput = { box: RINK, objects: [{ team: "puck", x: 180, y: 40 }] };
    expect(camera.update("puck", input, 1 / 60).zoom).toBeLessThan(1.01);
    for (let i = 0; i < 600; i += 1) camera.update("puck", input, 1 / 60);
    expect(camera.shot()).toEqual({ x: 150, y: 40, zoom: 2 });
    const out = camera.update("off", input, 1 / 60);
    expect(out.zoom).toBeGreaterThan(1.9);
    for (let i = 0; i < 600; i += 1) camera.update("off", input, 1 / 60);
    expect(camera.shot()).toEqual({ x: 100, y: 42.5, zoom: 1 });
    expect(camera.resting()).toBe(true);
    // At once: a seek or a step goes straight there.
    expect(camera.update("puck", input)).toEqual({ x: 150, y: 40, zoom: 2 });
  });
});

describe("followStop: the faceoff dot of a stoppage", () => {
  const timeline: ReplayTimeline = {
    frames: [{ t: 0, objects: [] }, { t: 60, objects: [] }],
    events: [{ t: 5, kind: "shot" }, { t: 10, kind: "whistle" }, { t: 18, kind: "faceoff", x: 69, y: -22 }, { t: 30, kind: "goal", team: "home" }, { t: 40, kind: "faceoff", x: 0, y: 0 }, { t: 50, kind: "whistle" }],
  };
  it("is the next faceoff's place from a whistle or a goal until the faceoff, and nothing while the play goes on", () => {
    expect([2, 10, 17.9, 18, 25, 35, 45, 55].map((t) => followStop(timeline, t))).toEqual([undefined, [69, -22], [69, -22], undefined, undefined, [0, 0], undefined, undefined]);
  });
});

describe("followWindow: the part of a flat drawing shown", () => {
  const view = { x: -8, y: -8, w: 216, h: 101 };
  it("is the whole drawing at a zoom of 1, and at any zoom holds the shot's frame, inside the drawing and of its shape", () => {
    expect(followWindow({ x: 100, y: 42.5, zoom: 1 }, RINK, view)).toEqual(view);
    const next = random(9);
    for (let i = 0; i < 300; i += 1) {
      const shot = clampShot({ x: next() * 200, y: next() * 85, zoom: 1 + next() * 1.5 }, RINK);
      const w = followWindow(shot, RINK, view);
      const f = frameOf(shot, RINK);
      expect(w.x).toBeLessThanOrEqual(f.x + 0.01);
      expect(w.y).toBeLessThanOrEqual(f.y + 0.01);
      expect(w.x + w.w).toBeGreaterThanOrEqual(f.x + f.w - 0.02);
      expect(w.y + w.h).toBeGreaterThanOrEqual(f.y + f.h - 0.02);
      expect(w.x).toBeGreaterThanOrEqual(view.x - 0.01);
      expect(w.x + w.w).toBeLessThanOrEqual(view.x + view.w + 0.02);
      expect(w.w / w.h).toBeCloseTo(view.w / view.h, 2);
    }
  });
  it("turns with a surface laid tall in its drawing", () => {
    const tall = { x: 0, y: 0, w: 101, h: 216 };
    const map = ([x, y]: [number, number]): [number, number] => [-y + 93, x + 8];
    const w = followWindow({ x: 160, y: 42.5, zoom: 2.5 }, RINK, tall, map);
    // The far end of the rink is the bottom of the tall drawing.
    expect(w.y + w.h / 2).toBeGreaterThan(140);
    expect(w.h).toBeLessThan(100);
  });
  it("magnifies a view with room round the surface more, so that the closest shot frames as much of the surface", () => {
    expect(zoomFor(1, 2)).toBe(1);
    expect(zoomFor(2.5, 1)).toBeCloseTo(2.5, 9);
    expect(zoomFor(2.5, 2)).toBeCloseTo(5, 9);
    expect(zoomFor(9, 2)).toBeCloseTo(5, 9);
  });
});

describe("the replay's controller and the follow camera", () => {
  const timeline: ReplayTimeline = { frames: [0, 1, 2, 3, 4].map((t) => ({ t, objects: [{ id: "puck", team: "puck" as const, x: 20 + t * 40, y: 40 }] })) };

  it("keeps the mode, says each change, and lets a hold go when the mode changes or the camera is resumed", () => {
    const replay = createReplay(timeline, { follow: "action" });
    const said: string[] = [];
    replay.subscribe((change) => said.push(`${change.reason} ${change.state.follow} ${change.state.followHeld}`));
    expect(replay.state()).toMatchObject({ follow: "action", followHeld: false });
    replay.holdFollow(true);
    replay.holdFollow(true);
    replay.holdFollow(false);
    replay.holdFollow(true);
    replay.setFollow("puck");
    replay.setFollow("puck");
    replay.setFollow("off");
    // An off camera is never held.
    replay.holdFollow(true);
    expect(said).toEqual(["follow action true", "follow action false", "follow action true", "follow puck false", "follow off false"]);
    expect(createReplay(timeline, { follow: "sideways" as never }).state().follow).toBe("off");
  });

  it("moves the camera on ticks by the time that went by, at once on a seek or while paused, and not at all while held, or off and at rest", () => {
    const replay = createReplay(timeline);
    let now = 0;
    const shown: (FollowShot | undefined)[] = [];
    const runner = followRunner({ timeline, now: () => now, at: (t) => ({ box: RINK, objects: [{ team: "puck", x: 20 + t * 40, y: 40 }] }), show: (shot) => shown.push(shot) });
    replay.subscribe((change: ReplayChange) => runner.paint(change));
    // Off and at rest: nothing.
    replay.seek(2);
    expect(shown).toEqual([]);
    // Turned on while paused: at once.
    replay.setFollow("puck");
    expect(shown).toEqual([{ x: 100, y: 40, zoom: 2 }]);
    // Playing: the first tick only starts the clock; the next eases by the time that went by.
    replay.play();
    now = 16;
    replay.advance(0.016);
    expect(shown).toHaveLength(1);
    now = 32;
    replay.advance(0.5);
    expect(shown).toHaveLength(2);
    expect(shown[1]!.x).toBeGreaterThan(100);
    expect(shown[1]!.x).toBeLessThan(101);
    // Held: nothing moves.
    replay.holdFollow(true);
    now = 48;
    replay.advance(0.016);
    expect(shown).toHaveLength(2);
    // Off while paused: back to the whole drawing at once.
    replay.pause();
    replay.setFollow("off");
    expect(shown.at(-1)).toBeUndefined();
    const count = shown.length;
    replay.seek(3);
    expect(shown).toHaveLength(count);
  });
});
