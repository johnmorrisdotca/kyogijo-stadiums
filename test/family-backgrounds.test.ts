// The family's background module, copied byte for byte into scripts/ for the README pictures and the demo's Background menu (tooling only: the package ships none of it and still has no dependency).
// The file is held to its version and its sha256, so a copy that drifted from the one in taisen-brackets is found, and every preset is drawn the same way every time with ink that reads over it.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

// @ts-expect-error the page script is plain JavaScript
import { backgroundOptions } from "../scripts/backgrounds.mjs";
import { BACKGROUND_PRESETS, FAMILY_BACKGROUNDS_VERSION, backgroundSvg, contrastRatio, parseColor } from "../scripts/family-backgrounds.ts";

/** The sha256 of scripts/family-backgrounds.ts at FAMILY_BACKGROUNDS_VERSION: the same as in taisen-brackets' test/family-backgrounds.test.ts. */
const SHA256 = "584b1c6f5dea2c1e395e3f0d29f69b378039d1adc13eaac136b2ec02ee40c503";
const VERSION = "1.0.1";
const rgb = (text: string) => parseColor(text)!;

test("family-backgrounds.ts is the file the family shares: its version and its sha256 are pinned", () => {
  expect(FAMILY_BACKGROUNDS_VERSION).toBe(VERSION);
  const text = readFileSync(new URL("../scripts/family-backgrounds.ts", import.meta.url));
  expect(createHash("sha256").update(text).digest("hex"), "the file changed: it is never edited here; copy the new one from taisen-brackets and update VERSION and SHA256").toBe(SHA256);
  expect(/^import\s.*from\s/m.test(text.toString("utf8")), "the module imports nothing").toBe(false);
});

test("the twenty-five presets are all there, and each draws a dark and a light picture with ink that reads over it", () => {
  expect(BACKGROUND_PRESETS.length).toBe(25);
  for (const name of BACKGROUND_PRESETS) {
    for (const theme of ["dark", "light"] as const) {
      const made = backgroundSvg(name, { width: 1400, height: 700, theme });
      expect(backgroundSvg(name, { width: 1400, height: 700, theme }), "the same options give the same markup").toEqual(made);
      for (const ground of made.ink.dominant) expect(contrastRatio(rgb(made.ink.text), rgb(ground)), `${name} ${theme}: text on ${ground}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test("the demo's background menu lists None and the twenty-five presets, in the family's order", async () => {
  const html: string = await backgroundOptions();
  expect([...html.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1])).toEqual(["", ...BACKGROUND_PRESETS]);
});

test("the package depends on nothing and ships none of the background module", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  expect(pkg.dependencies ?? {}).toEqual({});
  expect(pkg.files).not.toContain("scripts");
});

test("a hostile id cannot reach the markup: only letters, digits, _ and - are written, and a safe id is used as written", () => {
  const hostile = [`x"><script>alert(7)</script>`, `a}</style><script>alert(7)</script><style>b{`, `x" onload="alert(7)`, `1 starts with a digit`, `.x{fill:red}`, `a\nb`, `url(#x)`, ``];
  for (const name of BACKGROUND_PRESETS) {
    for (const id of hostile) {
      const made = backgroundSvg(name, { width: 1080, height: 1350, id });
      const svg = made.defs + made.body;
      expect(/<script|\sonload=|\(7\)/.test(svg), `${name} ${JSON.stringify(id)}: nothing of the id's markup`).toBe(false);
      const ids = [...made.defs.matchAll(/ id="([^"]*)"/g)].map((m) => m[1]);
      expect(ids.length).toBeGreaterThan(0);
      for (const written of ids) expect(written, `${name} ${JSON.stringify(id)}: element id`).toMatch(/^[A-Za-z][\w-]*$/);
      for (const ref of made.body.matchAll(/url\(#([^)]*)\)/g)) expect(ids, `${name} ${JSON.stringify(id)}: ${ref[1]} is defined`).toContain(ref[1]);
    }
  }
  expect(backgroundSvg("midnight", { width: 100, height: 100, id: "x\"y" }).defs).toContain('id="x-yg"');
  expect(backgroundSvg("midnight", { width: 100, height: 100, id: "7 mat" }).defs).toContain('id="bg-7-matg"');
  const plain = backgroundSvg("midnight", { width: 100, height: 100, id: "my-board_2" });
  expect(plain.defs).toContain('id="my-board_2g"');
  expect(plain.body).toContain("url(#my-board_2g)");
  expect(backgroundSvg("midnight", { width: 100, height: 100, id: "my-board_2" })).toEqual(plain);
});
