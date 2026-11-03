// The race's camera: the leader is what it follows (alone, or with the cars just behind), it comes in slowly, it never loses the leader from its frame however fast the race goes, it goes back out to the whole circuit, and
// the shot it works out is shown as a window of the drawing.
import { describe, expect, it } from "vitest";

import { RACE_FOLLOW_LIMITS, followModeOf, flatRaceShow, planBox, raceAt, raceFollowInput, raceFollowMode, simulateRace } from "./circuits-entry.ts";
import { followCamera, followShot, frameOf, wholeShot, type FollowShot } from "./replay.follow.ts";

const race = simulateRace({ circuit: "las-vegas", laps: 10, cars: 20, seed: 7 });
const box = planBox(race.plan);

const holds = (shot: FollowShot, p: readonly [number, number]): boolean => {
  const f = frameOf(shot, box);
  return p[0] >= f.x - 1e-6 && p[0] <= f.x + f.w + 1e-6 && p[1] >= f.y - 1e-6 && p[1] <= f.y + f.h + 1e-6;
};

describe("the race's camera: what it follows", () => {
  it("knows the modes: the leader is the puck and the pack the action, and anything else is off", () => {
    expect(raceFollowMode("leader")).toBe("leader");
    expect(raceFollowMode("pack")).toBe("pack");
    expect(raceFollowMode("puck")).toBe("off");
    expect(raceFollowMode(undefined)).toBe("off");
    expect(followModeOf("leader")).toBe("puck");
    expect(followModeOf("pack")).toBe("action");
    expect(followModeOf("off")).toBe("off");
  });

  it("tells the camera the leader as the puck, the cars just behind it as the players, and the circuit as the surface", () => {
    for (const t of [0, 100, 600, race.flag - 1]) {
      const moment = raceAt(race, t);
      const input = raceFollowInput(race.plan, moment);
      const puck = input.objects.filter((o) => o.team === "puck");
      expect(puck).toHaveLength(1);
      expect([puck[0].x, puck[0].y]).toEqual([...moment.standings[0].at]);
      expect(input.objects.filter((o) => o.team === "home").length).toBeLessThanOrEqual(RACE_FOLLOW_LIMITS.near ?? 4);
      expect(input.box).toEqual(box);
    }
    expect(box.w).toBeGreaterThan(0);
  });
});

describe("the race's camera: zooming in, following and keeping the leader in view", () => {
  it("frames the leader closely: the leader alone at the puck zoom, in the middle; the group never closer than the limit", () => {
    const input = raceFollowInput(race.plan, raceAt(race, 600));
    const alone = followShot("puck", input, RACE_FOLLOW_LIMITS);
    expect(alone.zoom).toBe(RACE_FOLLOW_LIMITS.puckZoom);
    const pack = followShot("action", input, RACE_FOLLOW_LIMITS);
    expect(pack.zoom).toBeGreaterThan(1);
    expect(pack.zoom).toBeLessThanOrEqual(RACE_FOLLOW_LIMITS.maxZoom!);
    expect(followShot("off", input, RACE_FOLLOW_LIMITS)).toEqual(wholeShot(box));
  });

  it("comes in slowly: a spring takes seconds to get to the leader, never past it, with no jump from frame to frame", () => {
    const camera = followCamera(RACE_FOLLOW_LIMITS);
    const input = raceFollowInput(race.plan, raceAt(race, 300));
    let was = wholeShot(box);
    const zooms: number[] = [];
    for (let i = 0; i < 360; i += 1) {
      const shot = camera.update("puck", input, 1 / 60);
      zooms.push(shot.zoom);
      // Never a jump: each frame's step of the zoom is small, and it only goes in.
      expect(shot.zoom).toBeGreaterThanOrEqual(was.zoom - 1e-9);
      expect(shot.zoom / was.zoom).toBeLessThan(1.05);
      was = shot;
    }
    expect(zooms[10]).toBeLessThan(RACE_FOLLOW_LIMITS.puckZoom! * 0.6);
    expect(zooms[359]).toBeCloseTo(RACE_FOLLOW_LIMITS.puckZoom!, 1);
  });

  it("never loses the leader from the frame, in either mode, over a whole race played at 60 times and at 600 times", () => {
    for (const mode of ["puck", "action"] as const) {
      for (const speed of [60, 600]) {
        const camera = followCamera(RACE_FOLLOW_LIMITS);
        // The page's frames: one every sixtieth of a second of the reader's time, so the race moves `speed / 60` seconds a frame.
        let t = 0;
        let worst = Infinity;
        for (let frame = 0; t < race.duration; frame += 1) {
          const moment = raceAt(race, t);
          const shot = camera.update(mode, raceFollowInput(race.plan, moment), frame === 0 ? undefined : 1 / 60);
          const f = frameOf(shot, box);
          const lead = moment.standings[0].at;
          expect(holds(shot, lead), `${mode} at ${speed}x, t=${t.toFixed(1)}`).toBe(true);
          worst = Math.min(worst, Math.min(lead[0] - f.x, f.x + f.w - lead[0]) / f.w);
          t += speed / 60;
        }
        expect(worst).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("pans out to the whole circuit when it is let go, and rests there", () => {
    const camera = followCamera(RACE_FOLLOW_LIMITS);
    const input = raceFollowInput(race.plan, raceAt(race, 300));
    for (let i = 0; i < 300; i += 1) camera.update("puck", input, 1 / 60);
    expect(camera.shot()!.zoom).toBeGreaterThan(3);
    let shot = camera.shot()!;
    for (let i = 0; i < 600; i += 1) shot = camera.update("off", input, 1 / 60);
    expect(shot).toEqual(wholeShot(box));
    expect(camera.resting()).toBe(true);
  });

  it("goes to the new leader after a pass without a jump: the shot moves by no more than a frame's step", () => {
    // Find a pass.
    let t = 1;
    const was = raceAt(race, t).standings[0].car.id;
    while (t < race.duration && raceAt(race, t).standings[0].car.id === was) t += 0.5;
    const camera = followCamera(RACE_FOLLOW_LIMITS);
    let prev: FollowShot | undefined;
    for (let s = t - 20; s < t + 20; s += 1 / 6) {
      const shot = camera.update("puck", raceFollowInput(race.plan, raceAt(race, s)), s === t - 20 ? undefined : 1 / 60);
      if (prev !== undefined) {
        const f = frameOf(shot, box);
        expect(Math.hypot(shot.x - prev.x, shot.y - prev.y)).toBeLessThan(f.w * 0.2);
      }
      prev = shot;
    }
  });
});

describe("the race's camera: showing a shot on a flat drawing", () => {
  const fake = (attrs: Record<string, string>): SVGSVGElement => {
    const a = { ...attrs };
    return { getAttribute: (n: string) => a[n] ?? null, setAttribute: (n: string, v: string) => void (a[n] = v), removeAttribute: (n: string) => void delete a[n] } as unknown as SVGSVGElement;
  };

  it("writes the drawing's viewBox for a shot, keeps its shape, puts the whole back for none, and shows a drawing written again at the same shot", () => {
    let svg = fake({ viewBox: "-50 -120 1100 1000" });
    const camera = flatRaceShow(() => svg, () => box, RACE_FOLLOW_LIMITS.maxZoom!);
    const shot = { x: box.x + box.w * 0.3, y: box.y + box.h * 0.4, zoom: 4 };
    camera.show(shot);
    const [x, y, w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    expect(w / h).toBeCloseTo(1100 / 1000, 1);
    expect(w).toBeLessThan(1100 / 3);
    expect(x).toBeGreaterThanOrEqual(-50);
    expect(y).toBeGreaterThanOrEqual(-120);
    expect(x + w).toBeLessThanOrEqual(1050 + 1e-6);
    // The drawing is written again: a new element, whole, until `again`.
    svg = fake({ viewBox: "-50 -120 1100 1000" });
    camera.again();
    expect(svg.getAttribute("viewBox")).not.toBe("-50 -120 1100 1000");
    camera.show(undefined);
    expect(svg.getAttribute("viewBox")).toBe("-50 -120 1100 1000");
  });
});
