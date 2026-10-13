import { describe, expect, it } from "vitest";
import { GAME } from "./scene.fixture.ts";
import { PNG_PEER_MISSING, toPNG } from "./png.ts";

// resvg-js is an optional peer dependency and is not installed with this package's own: the tests that need it are skipped unless it is there
// (`npm install --no-save @resvg/resvg-js` to run them), and the test of the error that says what to install runs only when it is not.
const name = "@resvg/resvg-js";
const installed = await import(/* @vite-ignore */ name).then(
  () => true,
  () => false,
);

const size = (png: Uint8Array): [number, number] => {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return [view.getUint32(16), view.getUint32(20)];
};

describe("toPNG without the peer", () => {
  it.skipIf(installed)("says what to install, and that it is for Node", async () => {
    await expect(toPNG({ sport: "nhl", id: "p" })).rejects.toThrow(PNG_PEER_MISSING);
    expect(PNG_PEER_MISSING).toMatch(/npm install @resvg\/resvg-js/);
    expect(PNG_PEER_MISSING).toMatch(/Node only/);
    expect(PNG_PEER_MISSING).toMatch(/drawToCanvas/);
  });
});

describe("toPNG with @resvg/resvg-js installed (skipped when it is not)", () => {
  it.skipIf(!installed)("is a PNG of the width asked for, with the drawing's shape", async () => {
    const png = await toPNG({ sport: "nhl", ...GAME }, { width: 800 });
    expect([...png.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(size(png)).toEqual([800, 374]);
    expect(size(await toPNG({ sport: "nhl", id: "p" }, { height: 202 }))).toEqual([432, 202]);
    expect(size(await toPNG({ sport: "nhl", id: "p" }))).toEqual([1200, 561]);
  });

  it.skipIf(!installed)("is light or dark by its option, and the same every time", async () => {
    const light = await toPNG({ sport: "nba", id: "p" }, { width: 300, theme: "light" });
    const dark = await toPNG({ sport: "nba", id: "p" }, { width: 300, theme: "dark" });
    expect(Array.from(light)).not.toEqual(Array.from(dark));
    expect(Array.from(await toPNG({ sport: "nba", id: "p" }, { width: 300, theme: "light" }))).toEqual(Array.from(light));
  });

  it.skipIf(!installed)("takes the SVG of a chart or a replay frame as it takes options", async () => {
    const svg = (await import("./scene.fixture.ts")).corpus().find((d) => d.name === "chart nfl")?.svg ?? "";
    expect(size(await toPNG(svg, { width: 400 }))[0]).toBe(400);
  });
});
