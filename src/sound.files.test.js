// The demo's recordings: each is listed with its source, its author and a licence that lets it ship (CC0 or the public domain, never NC or ND), in scripts/sounds.data.json and in
// docs/sound-credits.md; each is there as Opus and as AAC; and what any sport loads stays under the stated budget. None is in the npm package.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SOUND_BEDS, SOUND_OF_SPORT } from "./sound.sets.ts";
import { soundSetOf } from "./sound.mix.ts";

const data = JSON.parse(readFileSync("scripts/sounds.data.json", "utf8"));
const credits = readFileSync("docs/sound-credits.md", "utf8");
const folder = "demo/sounds";
const names = data.sounds.map((s) => s.name);
/** The budget of one sport's recordings, in bytes: as Opus and as AAC. */
const BUDGET = { ogg: 160 * 1024, m4a: 250 * 1024 };

describe("the demo's recordings", () => {
  it("are each CC0 or in the public domain, with where they were read, who made them and the part used", () => {
    for (const s of data.sounds) {
      expect(["CC0 1.0", "Public domain"], s.name).toContain(s.licence);
      expect(s.licence).not.toMatch(/NC|ND|BY-SA/);
      for (const key of ["url", "page", "source", "licenceUrl"]) expect(s[key], `${s.name} ${key}`).toMatch(/^https?:\/\//);
      expect(s.author.length, s.name).toBeGreaterThan(0);
      expect(s.what.length, s.name).toBeGreaterThan(0);
      expect(s.seconds, s.name).toBeGreaterThan(0);
      expect(s.loop ? typeof s.rms : typeof s.peak, s.name).toBe("number");
    }
  });

  it("are each in the credits, with their page, author and licence", () => {
    for (const s of data.sounds) {
      const row = credits.split("\n").find((line) => line.startsWith(`| \`${s.name}\``));
      expect(row, s.name).toBeDefined();
      expect(row).toContain(s.page);
      expect(row).toContain(s.author);
      expect(row).toContain(s.licence);
    }
  });

  it("are the folder's files, each as Opus and as AAC, and nothing else", () => {
    const files = readdirSync(folder).sort();
    expect(files).toEqual(names.flatMap((n) => [`${n}.m4a`, `${n}.ogg`]).sort());
  });

  it("keep every sport's set under the budget", () => {
    let most = { ogg: 0, m4a: 0 };
    for (const sport of Object.keys(SOUND_OF_SPORT)) {
      const set = soundSetOf(sport);
      const wanted = new Set(SOUND_BEDS[set.bed].layers.filter((n) => names.includes(n)));
      for (const ext of ["ogg", "m4a"]) {
        const bytes = [...wanted].reduce((sum, n) => sum + statSync(`${folder}/${n}.${ext}`).size, 0);
        expect(bytes, `${sport} ${ext}`).toBeLessThanOrEqual(BUDGET[ext]);
        most[ext] = Math.max(most[ext], bytes);
      }
    }
    // The credits page states the most any sport loads.
    expect(most.ogg).toBeLessThan(110 * 1024);
    expect(most.m4a).toBeLessThan(190 * 1024);
  });

  it("are not in the npm package", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.files.some((f) => f.startsWith("demo"))).toBe(false);
  });
});
