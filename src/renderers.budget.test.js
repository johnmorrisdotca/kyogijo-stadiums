// The renderers' code: how large it is, that the core does not carry it, that no renderer carries another, and that nothing in the package imports a
// canvas library, d3, Observable Plot or resvg (the one place any is named is png.ts, which loads resvg by a name held in a variable, when called, in Node).
// Plain JavaScript, so that reading files needs no Node types.
import { readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(`src/${file}`, "utf8");
const size = (files) => files.reduce((sum, file) => sum + read(file).length, 0);
const SCENE = ["scene.types.ts", "scene.xml.ts", "scene.css.ts", "scene.path.ts", "scene.ts", "scene.fit.ts", "scene.flat.ts", "scene-entry.ts"];
const ENTRIES = { canvas: ["canvas.ts", "canvas-entry.ts"], d3: ["d3.ts", "d3-entry.ts"], plot: ["plot.ts", "plot-entry.ts"], geojson: ["geojson.ts", "geojson-entry.ts"], png: ["png.ts", "png-entry.ts"] };

/** The files a source file reaches by its imports (and re-exports), itself included. Names are relative to src/. */
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const match of read(file).matchAll(/^(?:import|export)\s[^;]*?from "(\.{1,2}\/[^"]+)"|^import "(\.{1,2}\/[^"]+)"/gm)) closure(normalize(join(dirname(file), match[1] ?? match[2])), seen);
  return seen;
}

describe("the renderers' code", () => {
  it("is within a budget: the scene under 80 kB of source, comments and all, and each renderer a few kilobytes of its own", () => {
    expect(size(SCENE)).toBeLessThan(80_000);
    const budgets = { canvas: 20_000, d3: 8_000, plot: 10_000, geojson: 14_000, png: 6_000 };
    for (const [name, files] of Object.entries(ENTRIES)) expect(size(files), name).toBeLessThan(budgets[name]);
  });

  it("is not in the main entry, nor in any entry that is not one of the renderers: a page that draws SVG pays for none of it", () => {
    const renderers = new Set([...SCENE, ...Object.values(ENTRIES).flat()]);
    for (const entry of ["index.ts", "layers-entry.ts", "charts-entry.ts", "replay-entry.ts", "mount-entry.ts", "react-entry.ts", "element-entry.ts", "frames-entry.ts", "geometry-entry.ts"]) {
      const reached = [...closure(entry)].filter((file) => renderers.has(file));
      expect(reached, entry).toEqual([]);
    }
  });

  it("has no renderer that carries another: each needs the scene and its own files", () => {
    for (const [name, files] of Object.entries(ENTRIES)) {
      for (const [other, otherFiles] of Object.entries(ENTRIES)) {
        if (other === name) continue;
        expect([...closure(files[1])].filter((file) => otherFiles.includes(file)), `${name} reaches ${other}`).toEqual([]);
      }
    }
  });

  it("imports no canvas library, d3, Observable Plot or resvg, and fetches nothing", () => {
    const files = [...SCENE, ...Object.values(ENTRIES).flat()];
    for (const file of files) {
      const text = read(file);
      for (const [, from] of text.matchAll(/^(?:import|export)\s[^;]*?from "([^"]+)"/gm)) expect(from, `${file} imports ${from}`).toMatch(/^\.\//);
      expect(text, file).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\brequire\(/);
      expect(text, file).not.toMatch(/\bsetInterval\s*\(|\bsetTimeout\s*\(/);
      // Only png.ts loads anything by name, and only the peer.
      if (file !== "png.ts") expect(text, file).not.toMatch(/\bimport\s*\(/);
    }
    expect(read("png.ts")).toMatch(/const name = "@resvg\/resvg-js";/);
    expect([...read("png.ts").matchAll(/\bimport\s*\(/g)].length).toBe(1);
  });

  it("adds no dependency to the package: resvg is an optional peer, and there is no other", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.dependencies).toBeUndefined();
    expect(Object.keys(pkg.peerDependencies)).toEqual(["@resvg/resvg-js"]);
    expect(pkg.peerDependenciesMeta["@resvg/resvg-js"]).toEqual({ optional: true });
    for (const name of ["scene", "canvas", "d3", "plot", "geojson", "png"]) expect(pkg.exports[`./${name}`].import, name).toBe(`./dist/${name}-entry.js`);
  });
});
