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
