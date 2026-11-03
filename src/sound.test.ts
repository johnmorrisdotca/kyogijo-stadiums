import { describe, expect, it } from "vitest";
import { SPORTS } from "./draw.ts";
import { createKyogijoSound } from "./sound.dom.ts";
import { fakeAudio, fakeDoc, settled } from "./sound.fixture.ts";
import { LEVEL_MIX, levelFor, soundLevelsOf, soundMix, soundRoom, soundSetOf } from "./sound.mix.ts";
import { CUE_KINDS, SOUND_BEDS, SOUND_LEVELS, SOUND_OF_SPORT, SOUND_SETS } from "./sound.sets.ts";
import { applauseSamples, impulseSamples, murmurSamples, noiseSamples, seeded } from "./sound.synth.ts";
import { SOUND_WORDS } from "./sound.words.ts";

const VOICES = ["horn", "whistle", "whistle-end", "buzzer", "bell", "gun", "beep", "ooh", "cheer", "applause", "swell"];

describe("the index of sound sets", () => {
  it("gives every surface the package draws a set, and every set a bed and known voices", () => {
    for (const sport of SPORTS) {
      const found = soundSetOf(sport);
      expect(found, sport).toBeDefined();
      expect(SOUND_BEDS[found!.bed], sport).toBeDefined();
    }
    expect(Object.keys(SOUND_OF_SPORT).sort()).toEqual([...SPORTS].sort());
    for (const [id, set] of Object.entries(SOUND_SETS)) {
      expect(set.id).toBe(id);
      for (const [kind, voices] of Object.entries(set.cues)) {
        expect(CUE_KINDS, `${id} ${kind}`).toContain(kind);
        for (const voice of voices ?? []) expect(VOICES, `${id} ${kind}`).toContain(voice);
      }
      for (const level of set.levels ?? []) expect(SOUND_BEDS[set.bed].levels).toContain(level);
    }
  });

  it("has no sound for a surface it does not know, and so no levels or voices", () => {
    expect(soundSetOf("circuit")).toBeUndefined();
    expect(soundLevelsOf("circuit")).toEqual([]);
    expect(soundRoom({ sport: "circuit" })).toBeUndefined();
    expect(soundMix({ sport: "circuit" }, "loud")).toBeUndefined();
  });

  it("offers the levels of the venue, fewer for a still sport", () => {
    expect(soundLevelsOf("nhl")).toEqual(SOUND_LEVELS);
    expect(soundLevelsOf("judo")).toEqual(["quiet", "murmur", "engaged", "loud"]);
    expect(soundLevelsOf("kyudo")).toEqual(["quiet", "murmur"]);
    expect(levelFor("kyudo", "roar")).toBe("murmur");
    expect(levelFor("judo", "roar")).toBe("loud");
    expect(levelFor("nhl", "roar")).toBe("roar");
  });

  it("has the words in both languages", () => {
    const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v).map((s) => `${k}.${s}`) : [k])).sort();
    expect(keys(SOUND_WORDS.ja)).toEqual(keys(SOUND_WORDS.en));
    for (const level of SOUND_LEVELS) expect(SOUND_WORDS.ja.levels[level]).not.toBe("");
  });
});

describe("the room and the mix", () => {
  it("rings longer and wetter closed in than open, and from above is drier and further off", () => {
    const arena = soundRoom({ sport: "nhl", venue: { roof: "fixed", seats: 18000 } })!;
    const open = soundRoom({ sport: "soccer", venue: { roof: "open", seats: 50000 } })!;
    const canopy = soundRoom({ sport: "soccer", venue: { roof: "canopy", seats: 50000 } })!;
    expect(arena.enclosure).toBe(1);
    expect(open.enclosure).toBe(0);
    expect(arena.decay).toBeGreaterThan(open.decay);
    expect(canopy.decay).toBeGreaterThan(open.decay);
    expect(arena.wet).toBeGreaterThan(open.wet);
    const flat = soundRoom({ sport: "nhl", venue: { roof: "fixed", seats: 18000 }, view: "2d" })!;
    expect(flat.wet).toBeLessThan(arena.wet);
    expect(flat.gain).toBeLessThan(arena.gain);
  });

  it("takes the bed's own roof when the venue says none, or a word it does not know", () => {
    expect(soundRoom({ sport: "nhl" })!.enclosure).toBe(1);
    expect(soundRoom({ sport: "mlb" })!.enclosure).toBe(0);
    expect(soundRoom({ sport: "mlb", venue: { roof: "a-tent" } })!.enclosure).toBe(0);
    expect(soundRoom({ sport: "mlb", venue: { roof: "dome" } })!.enclosure).toBe(1);
  });

  it("makes the crowd louder with more people, slower than their number, and silent with nobody", () => {
    const full = soundRoom({ sport: "nhl", venue: { seats: 18000 } })!;
    const half = soundRoom({ sport: "nhl", venue: { seats: 18000 }, crowd: 0.5 })!;
    const small = soundRoom({ sport: "nhl", venue: { seats: 1800 } })!;
    const empty = soundRoom({ sport: "nhl", crowd: 0 })!;
    expect(full.crowd).toBeGreaterThan(half.crowd);
    expect(half.crowd).toBeGreaterThan(small.crowd);
    expect(half.crowd / full.crowd).toBeGreaterThan(0.5);
    expect(empty.crowd).toBe(0);
    expect(empty.people).toBe(0);
    const mix = soundMix({ sport: "nhl", crowd: 0 }, "roar")!;
    expect(mix.layers.roar).toBe(0);
    expect(mix.layers.murmur).toBe(0);
    expect(mix.layers.room).toBeGreaterThan(0);
  });

  it("brings the voices up level by level and leaves out a layer the bed has not", () => {
    let roar = -1;
    for (const level of SOUND_LEVELS) {
      expect(LEVEL_MIX[level].roar).toBeGreaterThanOrEqual(roar);
      roar = LEVEL_MIX[level].roar;
    }
    expect(soundMix({ sport: "nhl" }, "loud")!.layers.water).toBe(0);
    expect(soundMix({ sport: "swimming" }, "loud")!.layers.water).toBeGreaterThan(0);
    expect(soundMix({ sport: "judo" }, "loud")!.layers.roar).toBe(0);
  });
});

describe("the sound made", () => {
  it("is the same noise from the same seed", () => {
    expect(seeded(3)()).toBe(seeded(3)());
    expect(Array.from(noiseSamples(64, 5, "pink"))).toEqual(Array.from(noiseSamples(64, 5, "pink")));
    expect(Array.from(noiseSamples(64, 5))).not.toEqual(Array.from(noiseSamples(64, 6)));
    for (const samples of [noiseSamples(2000, 1, "brown"), applauseSamples(2000, 1000, 2), murmurSamples(2000, 1000, 3)]) for (const s of samples) expect(Math.abs(s)).toBeLessThanOrEqual(1.0001);
  });
  it("makes a room's echo that falls away and is as long as its decay", () => {
    const [left, right] = impulseSamples(1.5, 1000, 4);
    expect(left.length).toBe(1500);
    expect(right.length).toBe(1500);
    const energy = (a: Float32Array, from: number, to: number): number => a.slice(from, to).reduce((sum, s) => sum + s * s, 0);
    expect(energy(left, 0, 300)).toBeGreaterThan(energy(left, 1200, 1500) * 100);
  });
});

describe("the engine", () => {
  const make = (extra: Partial<Parameters<typeof createKyogijoSound>[0]> = {}) => {
    const audio = fakeAudio();
    const page = fakeDoc();
    const fetched: string[] = [];
    let made = 0;
    const factory = () => {
      made++;
      return audio.context;
    };
    const sound = createKyogijoSound({
      sport: "nhl",
      audio: factory,
      doc: page.doc,
      fetch: (url) => {
        fetched.push(url);
        return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(16)) });
      },
      ...extra,
    });
    return { audio, page, sound, fetched, made: () => made, factory };
  };

  it("does nothing until it is turned on: no audio context, no fetch, no decode", async () => {
    const { sound, fetched, made, audio } = make({ files: { murmur: "sounds/murmur.ogg", applause: "sounds/applause.ogg" } });
    sound.setLevel("loud");
    sound.setVolume(0.8);
    sound.setContext({ view: "2d" });
    await settled();
    expect(made()).toBe(0);
    expect(fetched).toEqual([]);
    expect(audio.context.decodes).toBe(0);
    expect(sound.state()).toMatchObject({ has: true, on: false, audible: false, quiet: "off" });
  });

  it("turned on, makes the one context, fetches only the files its surface uses, and plays its bed's loops", async () => {
    const { sound, fetched, made, audio } = make({ files: { murmur: "sounds/murmur.ogg", applause: "sounds/applause.ogg", water: "sounds/water.ogg" } });
    await sound.enable();
    await settled();
    expect(made()).toBe(1);
    expect(fetched.sort()).toEqual(["sounds/applause.ogg", "sounds/murmur.ogg"]);
    expect(audio.context.state).toBe("running");
    expect(audio.context.decodes).toBe(2);
    // room, murmur, applause and roar.
    expect(audio.running().filter((n) => n.kind === "source" && n.loop).length).toBe(4);
    expect(sound.state()).toMatchObject({ on: true, audible: true, heard: "engaged" });
    await sound.enable();
    expect(made()).toBe(1);
  });

  it("shares one context between the sounds of a page, and suspends it only when none is heard", async () => {
    const first = make();
    const second = createKyogijoSound({ sport: "soccer", audio: first.factory, doc: first.page.doc });
    await first.sound.enable();
    await second.enable();
    expect(first.made()).toBe(1);
    first.sound.disable();
    expect(first.audio.context.state).toBe("running");
    second.disable();
    expect(first.audio.context.state).toBe("suspended");
    second.destroy();
  });

  it("stops every loop and suspends while muted, hidden or turned off, and starts again after", async () => {
    const { sound, audio, page } = make();
    await sound.enable();
    expect(audio.running().length).toBeGreaterThan(0);
    for (const [quiet, undo] of [
      [() => sound.setVolume(0), () => sound.setVolume(0.5)],
      [() => page.hide(true), () => page.hide(false)],
      [() => sound.disable(), () => sound.enable()],
    ] as const) {
      quiet();
      expect(audio.running()).toEqual([]);
      expect(audio.context.state).toBe("suspended");
      await undo();
      expect(audio.running().length).toBeGreaterThan(0);
      expect(audio.context.state).toBe("running");
    }
    expect(sound.state().quiet).toBeUndefined();
  });

  it("does not decode a recording fetched while it is not heard until it is", async () => {
    const { sound, audio } = make({ files: { murmur: "sounds/murmur.ogg" } });
    const enabling = sound.enable();
    sound.setVolume(0);
    await enabling;
    await settled();
    expect(audio.context.decodes).toBe(0);
    sound.setVolume(0.5);
    await settled();
    expect(audio.context.decodes).toBe(1);
  });

  it("makes a surface with no sound set silent, and offers nothing", async () => {
    const { sound, audio } = make({ sport: "circuit" });
    await sound.enable();
    expect(sound.state()).toMatchObject({ has: false, audible: false, quiet: "no-sound", levels: [] });
    expect(audio.running()).toEqual([]);
  });

  it("glides the bed when the level or a setting changes, and not when nothing did", async () => {
    const { sound, audio } = make();
    await sound.enable();
    const targets = () => audio.context.nodes.reduce((n, node) => n + (node.gain?.calls.filter((c) => c[0] === "target").length ?? 0), 0);
    const before = targets();
    sound.setLevel("engaged");
    sound.setLevel("roar");
    const after = targets();
    expect(after).toBeGreaterThan(before);
    sound.state();
    sound.state();
    expect(targets()).toBe(after);
  });

  it("changes its bed with its surface", async () => {
    const { sound, audio } = make();
    await sound.enable();
    sound.setContext({ sport: "swimming" });
    expect(sound.state().levels).toEqual(SOUND_LEVELS);
    // room, water, murmur, applause and roar.
    expect(audio.running().filter((n) => n.kind === "source" && n.loop).length).toBe(5);
    sound.setContext({ sport: "kyudo" });
    expect(sound.state().levels).toEqual(["quiet", "murmur"]);
    expect(audio.running().filter((n) => n.kind === "source" && n.loop).length).toBe(3);
  });

  it("destroyed, leaves nothing running and no listener", async () => {
    const { sound, audio, page } = make();
    await sound.enable();
    sound.destroy();
    expect(audio.running()).toEqual([]);
    expect(page.listeners()).toBe(0);
    expect(audio.context.state).toBe("suspended");
    sound.setLevel("roar");
    expect(audio.running()).toEqual([]);
    await sound.enable();
    expect(sound.state().on).toBe(false);
  });
});
