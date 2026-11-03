// The one replay bar: the keys every replay answers to (on the bar and over a 3D view), and that a game's replay and a race are made from the same bar.
import { describe, expect, it } from "vitest";

import { RACE_STYLE } from "./circuits.race.draw.ts";
import { BAR_STYLE, replayKey, type ReplayKeyActions } from "./replay.bar.ts";
import { REPLAY_STYLE } from "./replay.dom.ts";

const event = (init: Partial<KeyboardEvent> & { tag?: string }): KeyboardEvent => {
  const e = { key: "", code: "", shiftKey: false, altKey: false, ctrlKey: false, metaKey: false, defaultPrevented: false, target: { tagName: init.tag ?? "DIV" }, preventDefault() { e.defaultPrevented = true; }, ...init };
  return e as unknown as KeyboardEvent;
};
const actions = (): ReplayKeyActions & { calls: string[] } => {
  const calls: string[] = [];
  return { calls, toggle: () => calls.push("toggle"), step: (d) => calls.push(`step${d}`), jump: (d) => calls.push(`jump${d}`), start: () => calls.push("start"), end: () => calls.push("end") };
};

describe("the keys of every replay", () => {
  it("on the bar: Space plays, the arrows step, Shift jumps, Home and End go to the ends", () => {
    const a = actions();
    for (const e of [{ key: " " }, { key: "ArrowRight" }, { key: "ArrowLeft" }, { key: "ArrowRight", shiftKey: true }, { key: "ArrowLeft", shiftKey: true }, { key: "Home" }, { key: "End" }]) expect(replayKey(event(e), "bar", a)).toBe(true);
    expect(a.calls).toEqual(["toggle", "step1", "step-1", "jump1", "jump-1", "start", "end"]);
  });

  it("over a 3D view: Space, comma and full stop, Shift to jump, End; the arrows and Home stay the view's", () => {
    const a = actions();
    for (const e of [{ key: " " }, { code: "Period" }, { code: "Comma" }, { code: "Period", shiftKey: true }, { code: "Comma", shiftKey: true }, { key: "End" }]) expect(replayKey(event(e), "stage", a)).toBe(true);
    expect(a.calls).toEqual(["toggle", "step1", "step-1", "jump1", "jump-1", "end"]);
    for (const e of [{ key: "ArrowRight" }, { key: "ArrowLeft" }, { key: "Home" }]) expect(replayKey(event(e), "stage", a)).toBe(false);
    expect(a.calls).toHaveLength(6);
  });

  it("leaves a key alone that a field, a modifier, a handled event or a button's own space takes", () => {
    const a = actions();
    expect(replayKey(event({ key: "ArrowRight", tag: "INPUT" }), "bar", a)).toBe(false);
    expect(replayKey(event({ key: " ", tag: "SELECT" }), "bar", a)).toBe(false);
    expect(replayKey(event({ key: " ", ctrlKey: true }), "bar", a)).toBe(false);
    expect(replayKey(event({ key: " ", defaultPrevented: true }), "bar", a)).toBe(false);
    expect(replayKey(event({ key: " ", tag: "BUTTON" }), "bar", a)).toBe(false);
    expect(replayKey(event({ key: "a" }), "bar", a)).toBe(false);
    expect(a.calls).toEqual([]);
  });

  it("is written once: a game's replay and a race carry the same rules for the bar", () => {
    expect(REPLAY_STYLE).toContain(BAR_STYLE);
    expect(RACE_STYLE).toContain(BAR_STYLE);
  });
});
