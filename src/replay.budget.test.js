// The size of the replay's code, and that it fetches nothing. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("the replay's code", () => {
  const files = ["src/replay.ts", "src/replay.control.ts", "src/replay.dom.ts", "src/replay.types.ts", "src/replay-entry.ts"].map((file) => [file, readFileSync(file, "utf8")]);

  it("is a few thousand lines of text at most: the source, comments and all, is under 80 kB", () => {
    expect(files.reduce((sum, [, text]) => sum + text.length, 0)).toBeLessThan(80_000);
  });

  it("fetches nothing and opens no connection: the data is the caller's", () => {
    for (const [file, text] of files) expect(text, file).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(/);
  });

  it("sets a timer nowhere: the clock is animation frames, and only while playing", () => {
    for (const [file, text] of files) expect(text, file).not.toMatch(/\bsetInterval\s*\(|\bsetTimeout\s*\(/);
  });
});

describe("the replay on the 3D view's code", () => {
  const files = ["src/turn.replay.ts", "src/turn.replay.dom.ts", "src/turn.replay.board.ts"].map((file) => [file, readFileSync(file, "utf8")]);

  it("fetches nothing, sets no timer, and asks for frames only through the view's own requests", () => {
    for (const [file, text] of files) {
      expect(text, file).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(/);
      expect(text, file).not.toMatch(/\bsetInterval\s*\(|\bsetTimeout\s*\(|\brequestAnimationFrame\s*\(/);
    }
  });

  // (24 kB since the scoreboard hung over the surface follows the game: the board's file is about 4 kB of it.)
  it("is small: under 24 kB of source", () => {
    expect(files.reduce((sum, [, text]) => sum + text.length, 0)).toBeLessThan(24_000);
  });
});

describe("the follow camera's code", () => {
  const files = ["src/replay.follow.ts", "src/replay.follow.dom.ts", "src/turn.follow.ts"].map((file) => [file, readFileSync(file, "utf8")]);

  it("fetches nothing, sets no timer and asks for no frame of its own: it moves only when the replay's clock does", () => {
    for (const [file, text] of files) {
      expect(text, file).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(/);
      expect(text, file).not.toMatch(/\bsetInterval\s*\(|\bsetTimeout\s*\(|\brequestAnimationFrame\s*\(/);
    }
  });

  it("is small: under 32 kB of source, comments and all", () => {
    expect(files.reduce((sum, [, text]) => sum + text.length, 0)).toBeLessThan(32_000);
  });
});
