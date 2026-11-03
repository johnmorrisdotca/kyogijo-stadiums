// The frames of a 3D view: one window frame for everything that moves, a callback taken back never runs (even in the frame that has begun), and a stopped view asks for nothing more: not the shared frame, not
// the display's measure, not a frame asked for in the same tick as the stop. A made-up window counts what is asked.
import { describe, expect, it } from "vitest";
import { displayProbe, frameBatch, type FrameWindow } from "./turn.frames.ts";

/** A window whose frames and timers run only when the test says. */
function fakeWindow() {
  let id = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const timers = new Map<number, () => void>();
  let asked = 0;
  const win: FrameWindow = {
    requestAnimationFrame(callback) {
      asked += 1;
      id += 1;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(frame) {
      frames.delete(frame);
    },
    setTimeout(callback) {
      id += 1;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(timer) {
      if (timer !== undefined) timers.delete(timer);
    },
  };
  let now = 0;
  return {
    win,
    asked: () => asked,
    pending: () => frames.size + timers.size,
    /** Run the frames waiting now, as one frame of the display. */
    frame(ms = 16) {
      now += ms;
      const run = [...frames.values()];
      frames.clear();
      for (const callback of run) callback(now);
    },
    timers() {
      const run = [...timers.values()];
      timers.clear();
      for (const callback of run) callback();
    },
  };
}

describe("one frame for everything that moves", () => {
  it("runs every callback asked for before the frame in one window frame", () => {
    const w = fakeWindow();
    const batch = frameBatch(w.win);
    const ran: string[] = [];
    batch.request(() => ran.push("turn"));
    batch.request(() => ran.push("race"));
    expect(w.asked()).toBe(1);
    w.frame();
    expect(ran).toEqual(["turn", "race"]);
    expect(w.pending()).toBe(0);
  });

  it("cancels the window frame when the last callback is taken back", () => {
    const w = fakeWindow();
    const batch = frameBatch(w.win);
    const a = batch.request(() => undefined);
    const b = batch.request(() => undefined);
    batch.cancel(a);
    expect(w.pending()).toBe(1);
    batch.cancel(b);
    expect(w.pending()).toBe(0);
  });

  it("does not run a callback that an earlier one of the same frame took back, so a view stopped in a frame asks for nothing after it", () => {
    const w = fakeWindow();
    const batch = frameBatch(w.win);
    let tick = 0;
    // The auto-turn asks for its frame again each time it runs, as a loop does.
    const loop = (): void => {
      tick += 1;
      turn = batch.request(loop);
    };
    batch.request(() => batch.clear());
    let turn = batch.request(loop);
    w.frame();
    expect(tick).toBe(0);
    expect(turn).toBeGreaterThan(0);
    expect(w.pending()).toBe(0);
    w.frame();
    expect(w.asked()).toBe(1);
  });

  it("clears everything, a frame asked for in the same tick as the stop included", () => {
    const w = fakeWindow();
    const batch = frameBatch(w.win);
    let ran = 0;
    batch.request(() => (ran += 1));
    batch.clear();
    expect(w.pending()).toBe(0);
    expect(batch.waiting).toBe(0);
    w.frame();
    expect(ran).toBe(0);
  });
});

describe("the measure of the display", () => {
  it("times its frames and gives the lower decile, then asks for nothing", () => {
    const w = fakeWindow();
    let got: number | undefined;
    displayProbe(w.win, () => false, (ms) => (got = ms), 350, 10);
    w.timers();
    for (let i = 0; i < 11; i += 1) w.frame(i === 5 ? 40 : 16);
    expect(got).toBe(16);
    expect(w.pending()).toBe(0);
  });

  it("stopped before it begins, it asks for no frame when its wait ends", () => {
    const w = fakeWindow();
    const probe = displayProbe(w.win, () => false, () => undefined);
    probe.stop();
    w.timers();
    w.frame();
    expect(w.asked()).toBe(0);
    expect(w.pending()).toBe(0);
  });

  it("stopped between two of its frames, it asks for no more", () => {
    const w = fakeWindow();
    const probe = displayProbe(w.win, () => false, () => undefined);
    w.timers();
    w.frame();
    const asked = w.asked();
    probe.stop();
    w.frame();
    expect(w.asked()).toBe(asked);
    expect(w.pending()).toBe(0);
  });
});
