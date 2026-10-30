// The animated WebP the README's moving pictures are made into (scripts/webp-animated.mjs): a RIFF container with the animation flag, a loop count and one frame chunk for each lossy frame of the same size. The frames
// here are the package's own still pictures (lossy WebP, of one size), and the shipped moving pictures are read back the same way.
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { animated, chunkOf, retimed } from "../scripts/webp-animated.mjs";

const still = (name) => readFileSync(`docs/images/${name}.webp`);
/** The chunks of a RIFF WebP: [name, size, offset of the body]. */
function chunks(file) {
  const out = [];
  for (let at = 12; at + 8 <= file.length; ) {
    const size = file.readUInt32LE(at + 4);
    out.push([file.toString("ascii", at, at + 4), size, at + 8]);
    at += 8 + size + (size % 2);
  }
  return out;
}
const canvasOf = (file) => [file.readUIntLE(24, 3) + 1, file.readUIntLE(27, 3) + 1];

describe("an animated WebP made from frames", () => {
  it("finds the picture chunk of a still the browser's encoder wrote, past its header and colour profile", () => {
    const frame = chunkOf(still("hero-desk-light"));
    expect(frame.toString("ascii", 0, 4)).toBe("VP8 ");
    expect(frame.length % 2).toBe(0);
    expect(() => chunkOf(Buffer.from("not a webp, not at all, not even close"))).toThrow(/not a WebP/);
  });

  it("is a RIFF file of its own length with the animation flag, an endless loop and a frame chunk for each frame, each of the size of the canvas and the duration asked", () => {
    const frames = [still("hero-desk-light"), still("hero-desk-light"), still("hero-desk-light")];
    const [w, h] = [1248, 629];
    const file = animated(frames, w, h, 50);
    expect(file.toString("ascii", 0, 4)).toBe("RIFF");
    expect(file.readUInt32LE(4)).toBe(file.length - 8);
    expect(file.toString("ascii", 8, 12)).toBe("WEBP");
    const list = chunks(file);
    expect(list.map(([name]) => name)).toEqual(["VP8X", "ANIM", "ANMF", "ANMF", "ANMF"]);
    expect(file[20] & 0x02).toBe(0x02);
    expect(canvasOf(file)).toEqual([w, h]);
    const [, , anim] = list[1];
    expect(file.readUInt16LE(anim + 4)).toBe(0);
    for (const [, , body] of list.slice(2)) {
      expect([file.readUIntLE(body + 6, 3) + 1, file.readUIntLE(body + 9, 3) + 1]).toEqual([w, h]);
      expect(file.readUIntLE(body + 12, 3)).toBe(50);
      expect(file.toString("ascii", body + 16, body + 20)).toBe("VP8 ");
    }
  });

  it("is what the README shows: the moving pictures in docs/images are such files, 60 frames of 200 milliseconds (half the speed they first turned at), at the size of a picture and under their budget", () => {
    for (const name of ["turning-venue-desk-light", "turning-venue-desk-dark", "turning-hall-desk-light", "turning-hall-desk-dark"]) {
      const file = still(name);
      expect(file.toString("ascii", 0, 4), name).toBe("RIFF");
      expect(file.readUInt32LE(4), name).toBe(file.length - 8);
      const list = chunks(file);
      expect(list.filter(([kind]) => kind === "ANMF"), name).toHaveLength(60);
      expect(file[20] & 0x02, name).toBe(0x02);
      expect(canvasOf(file)[0], name).toBe(640);
      expect(file.length, name).toBeLessThan(1024 * 1024);
      for (const [kind, , body] of list.filter(([k]) => k === "ANMF")) expect([kind, file.readUIntLE(body + 12, 3)], name).toEqual(["ANMF", 200]);
    }
  });

  it("is retimed by changing only the duration of each frame: the same size, the same frames, a new time", () => {
    const frames = [still("hero-desk-light"), still("hero-desk-light")];
    const slow = animated(frames, 1248, 629, 100);
    const half = retimed(slow, 200);
    expect(half.length).toBe(slow.length);
    const durations = (file) => chunks(file).filter(([kind]) => kind === "ANMF").map(([, , body]) => file.readUIntLE(body + 12, 3));
    expect(durations(slow)).toEqual([100, 100]);
    expect(durations(half)).toEqual([200, 200]);
    // Everything else is as it was.
    const same = Buffer.from(half);
    for (const [kind, , body] of chunks(same)) if (kind === "ANMF") same.writeUIntLE(100, body + 12, 3);
    expect(same.equals(slow)).toBe(true);
  });

  it("turns the README's moving pictures at half their first speed: the arena and the hall 200 milliseconds a frame, the fly-through 520", () => {
    const first = (name) => { const file = still(name); const [, , body] = chunks(file).find(([kind]) => kind === "ANMF"); return file.readUIntLE(body + 12, 3); };
    for (const scheme of ["light", "dark"]) {
      expect(first(`turning-venue-desk-${scheme}`)).toBe(200);
      expect(first(`turning-hall-desk-${scheme}`)).toBe(200);
      expect(first(`turning-flythrough-desk-${scheme}`)).toBe(520);
    }
  });
});
