import { afterEach, describe, expect, it, vi } from "vitest";
import { SPORTS } from "./draw.ts";
import { createReplay } from "./replay.control.ts";
import { SOUND_TAIL, createKyogijoSound } from "./sound.dom.ts";
import { fakeAudio, fakeDoc, settled } from "./sound.fixture.ts";
import { LEVEL_MIX, cueKindOf, cuesOf, cuesOfChange, excitementAt, levelFor, soundLevelsOf, soundMix, soundRoom, soundSetOf, soundVoicesOf } from "./sound.mix.ts";
import { CUE_KINDS, SOUND_BEDS, SOUND_LEVELS, SOUND_OF_SPORT, SOUND_SETS } from "./sound.sets.ts";
import { applauseSamples, impulseSamples, murmurSamples, noiseSamples, seeded } from "./sound.synth.ts";
import { SOUND_WORDS } from "./sound.words.ts";
import type { ReplayChange, ReplayTimeline } from "./replay.types.ts";

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
    expect(soundVoicesOf("circuit")).toEqual([]);
    expect(soundRoom({ sport: "circuit" })).toBeUndefined();
    expect(soundMix({ sport: "circuit" }, "loud")).toBeUndefined();
  });

  it("gives each sport its own cues: a horn for hockey, a buzzer for basketball, a whistle for soccer, a bell for the ring", () => {
    expect(cuesOf({ kind: "goal" }, "nhl")).toEqual(["horn", "swell"]);
    expect(cuesOf({ kind: "period-end" }, "nba")).toEqual(["buzzer"]);
    expect(cuesOf({ kind: "whistle" }, "soccer")).toEqual(["whistle"]);
    expect(cuesOf({ kind: "goal" }, "soccer")).toEqual(["swell"]);
    expect(cuesOf({ kind: "round-start" }, "boxing")).toEqual(["bell"]);
    expect(cuesOf({ kind: "start" }, "athletics")).toEqual(["gun"]);
    expect(cuesOf({ kind: "start" }, "swimming")).toEqual(["beep"]);
    expect(cuesOf({ kind: "goal" }, "tennis")).toEqual(["applause"]);
    expect(soundVoicesOf("nhl")).toEqual(["horn", "swell", "ooh", "whistle", "buzzer"]);
  });

  it("offers the levels of the venue, fewer for a still sport", () => {
    expect(soundLevelsOf("nhl")).toEqual(SOUND_LEVELS);
    expect(soundLevelsOf("judo")).toEqual(["quiet", "murmur", "engaged", "loud"]);
    expect(soundLevelsOf("kyudo")).toEqual(["quiet", "murmur"]);
    expect(levelFor("kyudo", "roar")).toBe("murmur");
    expect(levelFor("judo", "roar")).toBe("loud");
    expect(levelFor("nhl", "roar")).toBe("roar");
  });

  it("reads a timeline's own words as kinds of moment", () => {
    expect(cueKindOf({ kind: "Touchdown" })).toBe("goal");
    expect(cueKindOf({ kind: "full-time" })).toBe("game-end");
    expect(cueKindOf({ kind: "foul" })).toBe("whistle");
    expect(cueKindOf({ kind: "pass" })).toBeUndefined();
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

describe("the game's excitement", () => {
  const periods = [
    { start: 0, end: 100 },
    { start: 120, end: 220 },
    { start: 240, end: 340 },
  ];
  const at = (t: number, score?: { home: number; away: number }, sinceGoal?: number) => excitementAt({ t, start: 0, end: 340, periods, score, sinceGoal });
  it("murmurs before, between and after the periods", () => {
    expect(at(-1)).toBe("murmur");
    expect(at(110)).toBe("murmur");
    expect(at(340)).toBe("murmur");
  });
  it("is engaged in play, loud late in a close game, roars after a goal, and quiet in a game already won", () => {
    expect(at(50, { home: 0, away: 0 })).toBe("engaged");
    expect(at(300, { home: 3, away: 2 })).toBe("loud");
    expect(at(300, { home: 5, away: 0 })).toBe("murmur");
    expect(at(150, { home: 1, away: 0 }, 2)).toBe("roar");
    expect(at(150, { home: 1, away: 0 }, 8)).toBe("engaged");
  });
});

describe("the cues of a replay's moves", () => {
  const state = { t: 10, start: 0, end: 300, playing: true, ended: false, speed: 1, loop: false, motion: "smooth" as const, follow: "off" as const, followHeld: false };
  const change = (reason: ReplayChange["reason"], t: number, crossed: ReplayChange["crossed"] = []): ReplayChange => ({ state: { ...state, t }, reason, crossed });
  const periods = [
    { start: 0, end: 100 },
    { start: 120, end: 220 },
  ];
  it("plays an event's cue while the clock plays or steps forward, and none on a seek or going back", () => {
    const goal = [{ t: 9.5, kind: "goal", team: "home" as const }];
    expect(cuesOfChange(change("tick", 10, goal), 9, "nhl").map((c) => c.voice)).toEqual(["horn", "swell"]);
    expect(cuesOfChange(change("step", 10, goal), 9, "nhl").map((c) => c.voice)).toEqual(["horn", "swell"]);
    expect(cuesOfChange(change("seek", 10, goal), 9, "nhl")).toEqual([]);
    expect(cuesOfChange(change("tick", 8, goal), 9, "nhl")).toEqual([]);
    expect(cuesOfChange(change("tick", 10, goal), 9, "circuit")).toEqual([]);
  });
  it("calls a period's end, and the game's at the last", () => {
    expect(cuesOfChange(change("tick", 101), 99, "nhl", periods).map((c) => `${c.kind} ${c.voice}`)).toEqual(["period-end buzzer"]);
    expect(cuesOfChange(change("tick", 221), 219, "nhl", periods).map((c) => `${c.kind} ${c.voice}`)).toEqual(["game-end buzzer", "game-end horn", "game-end swell"]);
    expect(cuesOfChange(change("tick", 121), 119, "soccer", periods).map((c) => `${c.kind} ${c.voice}`)).toEqual(["period-start whistle"]);
    expect(cuesOfChange(change("tick", 101), 99, "soccer", periods).map((c) => `${c.kind} ${c.voice}`)).toEqual(["period-end whistle-end"]);
  });
  it("orders the cues by time, and keeps the team", () => {
    const crossed = [
      { t: 99.6, kind: "whistle" },
      { t: 99.2, kind: "shot", team: "away" as const },
    ];
    const cues = cuesOfChange(change("tick", 101, crossed), 99, "nhl", periods);
    expect(cues.map((c) => c.voice)).toEqual(["ooh", "whistle", "buzzer"]);
    expect(cues[0].team).toBe("away");
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

const TIMELINE: ReplayTimeline = {
  frames: [0, 10, 20, 30, 40].map((t) => ({ t, objects: [{ id: "puck", team: "puck" as const, x: t, y: 0 }] })),
  events: [
    { t: 5, kind: "goal", team: "home" },
    { t: 25, kind: "whistle" },
  ],
};
const NHL_PERIODS = [{ number: 1, start: 0, end: 40 }];

describe("the engine", () => {
  afterEach(() => vi.useRealTimers());
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
    const { sound, fetched, made, audio } = make({ files: { murmur: "sounds/murmur.ogg", whistle: "sounds/whistle.ogg" } });
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
    const { sound, fetched, made, audio } = make({ files: { murmur: "sounds/murmur.ogg", whistle: "sounds/whistle.ogg", bell: "sounds/bell.ogg", water: "sounds/water.ogg" } });
    await sound.enable();
    await settled();
    expect(made()).toBe(1);
    expect(fetched.sort()).toEqual(["sounds/murmur.ogg", "sounds/whistle.ogg"]);
    expect(audio.context.state).toBe("running");
    expect(audio.context.decodes).toBe(2);
    // room, murmur, applause and roar, and the roar's swell.
    expect(audio.running().filter((n) => n.kind === "source" && n.loop).length).toBe(5);
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
    expect(sound.state()).toMatchObject({ has: false, audible: false, quiet: "no-sound", levels: [], voices: [] });
    expect(audio.running()).toEqual([]);
  });

  it("follows a replay: the horn and the swell at the goal, the whistle at the stoppage, nothing on a seek, quiet while paused", async () => {
    const cues: string[] = [];
    const { sound, audio } = make({ onCue: (cue) => cues.push(`${cue.t} ${cue.voice}`) });
    await sound.enable();
    vi.useFakeTimers();
    const replay = createReplay(TIMELINE);
    sound.follow(replay, { periods: NHL_PERIODS });
    expect(sound.state()).toMatchObject({ following: true, audible: false, quiet: "paused" });
    expect(audio.running()).toEqual([]);
    replay.play();
    expect(sound.state().audible).toBe(true);
    replay.advance(6);
    expect(cues).toEqual(["5 horn", "5 swell"]);
    // The horn is three low saws and a fourth a little apart.
    expect(audio.tones().filter((f) => f < 150).length).toBe(4);
    replay.seek(4);
    replay.seek(30);
    expect(cues.length).toBe(2);
    replay.seek(20);
    audio.context.currentTime = 1;
    replay.advance(6);
    expect(cues).toEqual(["5 horn", "5 swell", "25 whistle"]);
    audio.context.currentTime = 2;
    replay.advance(20);
    expect(cues.slice(3)).toEqual(["40 buzzer", "40 horn", "40 swell"]);
    expect(replay.state().playing).toBe(false);
    // The end's cues are heard out, and then it goes quiet.
    expect(sound.state()).toMatchObject({ quiet: "paused", audible: true });
    expect(audio.context.state).toBe("running");
    vi.advanceTimersByTime(SOUND_TAIL * 1000);
    expect(sound.state().audible).toBe(false);
    expect(audio.context.state).toBe("suspended");
    expect(audio.running()).toEqual([]);
  });

  it("follows the game's excitement under auto: a roar just after the goal, then engaged", async () => {
    const { sound } = make({ level: "auto" });
    await sound.enable();
    const replay = createReplay(TIMELINE);
    sound.follow(replay, { periods: NHL_PERIODS, scoreAt: (t) => ({ home: t >= 5 ? 1 : 0, away: 0 }) });
    replay.play();
    replay.advance(2);
    expect(sound.state().heard).toBe("engaged");
    replay.advance(4);
    expect(sound.state().heard).toBe("roar");
    replay.advance(8);
    expect(sound.state().heard).toBe("engaged");
    sound.setLevel("quiet");
    expect(sound.state().heard).toBe("quiet");
  });

  it("glides the bed only when the level or a setting changes, not on every frame", async () => {
    const { sound, audio } = make({ level: "auto" });
    await sound.enable();
    const replay = createReplay(TIMELINE);
    sound.follow(replay, { periods: NHL_PERIODS });
    replay.play();
    const targets = () => audio.context.nodes.reduce((n, node) => n + (node.gain?.calls.filter((c) => c[0] === "target").length ?? 0), 0);
    replay.advance(0.5);
    const before = targets();
    for (let i = 0; i < 30; i++) replay.advance(0.02);
    expect(targets()).toBe(before);
    sound.setVolume(0.3);
    expect(targets()).toBeGreaterThan(before);
  });

  it("plays a live event's cue at once, and a goal lifts the level under auto", async () => {
    const cues: string[] = [];
    const { sound, audio } = make({ sport: "boxing", level: "auto", onCue: (cue) => cues.push(cue.voice) });
    await sound.enable();
    sound.cue({ kind: "round-start" });
    expect(cues).toEqual(["bell"]);
    expect(audio.tones().filter((f) => f === 830).length).toBe(3);
    sound.game({ t: 50, start: 0, end: 540, periods: [{ start: 0, end: 180 }], score: { home: 0, away: 0 } });
    expect(sound.state().heard).toBe("engaged");
    sound.cue({ kind: "knockout", team: "home" });
    expect(sound.state().heard).toBe("roar");
    audio.context.currentTime = 7;
    expect(sound.state().heard).toBe("engaged");
    sound.cue({ kind: "pass" });
    expect(cues).toEqual(["bell", "swell"]);
  });

  it("plays the same voice twice in a moment only once", async () => {
    const cues: string[] = [];
    const { sound, audio } = make({ onCue: (cue) => cues.push(cue.voice) });
    await sound.enable();
    sound.cue({ kind: "whistle" });
    sound.cue({ kind: "whistle" });
    audio.context.currentTime = 0.5;
    sound.cue({ kind: "whistle" });
    expect(cues).toEqual(["whistle", "whistle"]);
  });

  it("changes its bed with its surface", async () => {
    const { sound, audio } = make();
    await sound.enable();
    sound.setContext({ sport: "swimming" });
    expect(sound.state().levels).toEqual(SOUND_LEVELS);
    // room, water, murmur, applause, roar and the swell.
    expect(audio.running().filter((n) => n.kind === "source" && n.loop).length).toBe(6);
    sound.setContext({ sport: "kyudo" });
    expect(sound.state().levels).toEqual(["quiet", "murmur"]);
    expect(audio.running().filter((n) => n.kind === "source" && n.loop).length).toBe(3);
  });

  it("destroyed, leaves nothing running and no listener", async () => {
    const { sound, audio, page } = make();
    await sound.enable();
    const replay = createReplay(TIMELINE);
    sound.follow(replay);
    replay.play();
    sound.destroy();
    expect(audio.running()).toEqual([]);
    expect(page.listeners()).toBe(0);
    expect(audio.context.state).toBe("suspended");
    replay.advance(10);
    expect(audio.running()).toEqual([]);
    await sound.enable();
    expect(sound.state().on).toBe(false);
  });
});
