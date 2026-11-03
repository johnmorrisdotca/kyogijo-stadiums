// The sound of a surface in a page: a crowd bed at a level, the room it is heard in, and the cues of a game, from a replay it follows or from events a page pushes as they happen. Off until a
// page turns it on (a browser lets audio start only after a press anyway): nothing is fetched, made or decoded before that. One audio context serves every sound of a page, and it is
// suspended whenever none of them is heard: turned off, at no volume, the page hidden, the surface out of sight or its game paused. A bed's loops play only while it is heard.
import { cueKindOf, cuesOf, cuesOfChange, excitementAt, levelFor, soundLevelsOf, soundMix, soundSetOf, soundVoicesOf } from "./sound.mix.ts";
import type { GameMoment, SoundContext, SoundCue, SoundMix, SoundPeriod, SoundVenue } from "./sound.mix.ts";
import { SOUND_BEDS } from "./sound.sets.ts";
import type { SoundLayer, SoundLevel, SoundVoice } from "./sound.sets.ts";
import { bufferOf, impulseSamples, layerBuffer, layerFilter, makeVoice, LAYER_SECONDS, noiseSamples } from "./sound.synth.ts";
import type { VoiceBuffers } from "./sound.synth.ts";
import type { ReplayController } from "./replay.control.ts";
import type { ReplayEvent } from "./replay.types.ts";

/** The recordings a page may give, by the layer or the voice they stand for; anything not given is made in the browser. */
export type SoundFileName = SoundLayer | SoundVoice;

/** What the engine needs of an audio context: a page's `AudioContext`, or a stand-in in a test. */
export type SoundAudioContext = BaseAudioContext & { resume(): Promise<void>; suspend(): Promise<void> };

/** How the engine fetches a recording: `fetch` by default. */
export type SoundFetch = (url: string) => Promise<{ ok: boolean; arrayBuffer(): Promise<ArrayBuffer> }>;

/** A crowd level, or `auto`: the level follows the game a sound follows (`excitementAt`), and is `engaged` with no game. */
export type SoundLevelChoice = SoundLevel | "auto";

/** The settings of a surface's sound. */
export interface SoundSettings {
  /** The surface (`nhl`, `soccer`, ...). A surface with no sound set makes no sound and offers no levels (`state().has`). */
  sport: string;
  venue?: SoundVenue;
  /** The share of the seats taken, 0 to 1: 0 is no crowd (a page's Crowd off). */
  crowd?: number;
  view?: "2d" | "3d";
  /** The crowd's level: `engaged` by default. */
  level?: SoundLevelChoice;
  /** 0 to 1: 0.6 by default. 0 is muted, and nothing is heard or made. */
  volume?: number;
  /** Recordings by name, for the voices and layers a page has files for (the demo's: `demo/sounds/`). Fetched only when the sound is first turned on, and decoded only when it is heard. */
  files?: Partial<Record<SoundFileName, string>>;
  /** Makes the page's one audio context: `new AudioContext()` by default. A test gives a stand-in. */
  audio?: () => SoundAudioContext;
  fetch?: SoundFetch;
  /** The element the surface is drawn in: the sound stops while it is out of sight. */
  host?: Element;
  /** The page, for whether it is hidden: `document` by default. */
  doc?: Document;
  /** Told of every cue as it plays: a page may show it. */
  onCue?: (cue: SoundCue) => void;
}

/** Why a sound is not heard. */
export type SoundQuiet = "no-sound" | "off" | "muted" | "hidden" | "out-of-sight" | "paused";

/** What a sound is doing. */
export interface SoundState {
  /** The surface has a sound set: a page shows the sound's controls only when it has. */
  has: boolean;
  on: boolean;
  /** Heard now: on, with volume, the page shown, the surface in sight and its game not paused. */
  audible: boolean;
  /** Why it is not heard, when it is not. */
  quiet?: SoundQuiet;
  sport: string;
  volume: number;
  level: SoundLevelChoice;
  /** The level heard: the choice, the game's under `auto`, held to what the surface offers. */
  heard: SoundLevel;
  /** The levels the surface offers, quietest first. */
  levels: readonly SoundLevel[];
  /** The voices its cues use. */
  voices: readonly SoundVoice[];
  /** The recordings fetched (they are decoded when heard). */
  fetched: readonly SoundFileName[];
  /** Following a replay. */
  following: boolean;
}

/** Following a replay: its periods and its score at a time, for the cues of the periods' ends and for the level under `auto`. */
export interface SoundFollow {
  periods?: readonly SoundPeriod[];
  scoreAt?: (t: number) => { home: number; away: number };
}

/** A surface's sound in a page. */
export interface KyogijoSound {
  /** Turn it on: call it from a press, so that the browser lets the audio start. The first call makes the audio context and fetches the recordings. */
  enable(): Promise<void>;
  /** Turn it off: nothing is heard, made or decoded, and the audio context is suspended when no other sound of the page is heard. */
  disable(): void;
  setVolume(volume: number): void;
  setLevel(level: SoundLevelChoice): void;
  /** Change the context: another surface, venue, crowd or view. The levels and cues offered follow the surface. */
  setContext(context: Partial<SoundContext>): void;
  /** Follow a replay's controller: the cues of its events as they go by while it plays, quiet while it is paused, the level under `auto` from its game. Returns a function that stops it. */
  follow(controller: ReplayController, game?: SoundFollow): () => void;
  /** A live event, pushed as it happens: its cues play now. A goal lifts the level under `auto` for a few seconds. */
  cue(event: Pick<ReplayEvent, "kind" | "team">): void;
  /** The live game's state for the level under `auto`, or `undefined` for none. */
  game(moment: GameMoment | undefined): void;
  state(): SoundState;
  /** Stop and take everything away. */
  destroy(): void;
}

interface Hub {
  context?: SoundAudioContext;
  users: Set<{ audible(): boolean }>;
}
const hubs = new Map<() => SoundAudioContext, Hub>();
const DEFAULT_AUDIO = (): SoundAudioContext => new AudioContext();

/** The page's audio context for a maker, made the first time a sound is turned on. */
function hubOf(audio: () => SoundAudioContext): Hub {
  let hub = hubs.get(audio);
  if (hub === undefined) {
    hub = { users: new Set() };
    hubs.set(audio, hub);
  }
  return hub;
}

/** Run the context while any sound of the page is heard, and suspend it when none is. */
function settle(hub: Hub): void {
  const context = hub.context;
  if (context === undefined) return;
  const wanted = [...hub.users].some((user) => user.audible());
  if (wanted && context.state !== "running") void context.resume().catch(() => undefined);
  else if (!wanted && context.state === "running") void context.suspend().catch(() => undefined);
}

const clamp = (value: number, least: number, greatest: number): number => Math.min(greatest, Math.max(least, value));
const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
/** How fast a level glides to another, in seconds (a time constant). */
const GLIDE = 0.6;
/** The same voice twice within this many seconds plays once. */
const SAME_VOICE = 0.2;
/** How long the sound is held on after a game's clock stopped on a cue (its end), in seconds. */
export const SOUND_TAIL = 5;
const TAIL = SOUND_TAIL;
/** How long a goal lifts the level under `auto`, in seconds. */
const GOAL_LIFT = 6;

interface Graph {
  master: GainNode;
  mix: GainNode;
  wet: GainNode;
  dry: GainNode;
  convolver: ConvolverNode;
  decay: number;
  layers: Map<SoundLayer, { source: AudioBufferSourceNode; gain: GainNode }>;
  swell: { source: AudioBufferSourceNode; gain: GainNode } | undefined;
  cues: GainNode;
}

/**
 * The sound of a surface: its crowd bed at a level and the cues of its game. Nothing happens until `enable()`, which a page calls from a press.
 * @example
 * ```ts no-run
 * import { createKyogijoSound } from "@johnmorrisdotca/kyogijo-stadiums/sound";
 * import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";
 *
 * const host = document.querySelector<HTMLElement>("#rink")!;
 * const sound = createKyogijoSound({ sport: "nhl", venue: { roof: "fixed", seats: 18000 }, view: "3d", level: "auto", host });
 * document.querySelector("#sound")!.addEventListener("click", () => sound.enable());
 * const view = mountKyogijoTurn(host, { sport: "nhl" });
 * const replay = view.replay({ frames: [{ t: 0, objects: [] }, { t: 60, objects: [] }], events: [{ t: 30, kind: "goal", team: "home" }] });
 * sound.follow(replay, { periods: [{ start: 0, end: 60 }] });
 * ```
 */
export function createKyogijoSound(settings: SoundSettings): KyogijoSound {
  const audio = settings.audio ?? DEFAULT_AUDIO;
  const get = settings.fetch ?? ((url: string) => fetch(url));
  const doc = settings.doc ?? (typeof document === "undefined" ? undefined : document);
  const files = { ...settings.files };
  const context: SoundContext = { sport: settings.sport, venue: settings.venue, crowd: settings.crowd, view: settings.view };
  let level: SoundLevelChoice = settings.level ?? "engaged";
  let volume = isNum(settings.volume) ? clamp(settings.volume, 0, 1) : 0.6;
  let on = false;
  let inSight = true;
  let paused = false;
  let following: { stop(): void } | undefined;
  let followMoment: GameMoment | undefined;
  let liveMoment: GameMoment | undefined;
  /** The context's time until which a live goal holds the level up. */
  let liftUntil = -1;
  let graph: Graph | undefined;
  let destroyed = false;
  /** The level the bed was last glided to, and whether a setting changed since: the bed is glided only then, not on every frame of a game. */
  let glidedTo: SoundLevel | undefined;
  let dirty = false;
  /** The timer that ends the hold after a game's clock stopped on a cue. */
  let tailing: ReturnType<typeof setTimeout> | undefined;
  const hub = hubOf(audio);
  const fetched = new Map<SoundFileName, ArrayBuffer>();
  const decoded = new Map<SoundFileName, AudioBuffer | "failed" | Promise<void>>();
  const lastPlayed = new Map<SoundVoice, number>();
  const made: { noise?: AudioBuffer; applause?: AudioBuffer; layers: Map<SoundLayer, AudioBuffer> } = { layers: new Map() };
  const user = { audible: () => audible() };
  hub.users.add(user);

  const hidden = (): boolean => doc?.visibilityState === "hidden";
  const has = (): boolean => soundSetOf(context.sport) !== undefined;
  function quiet(): SoundQuiet | undefined {
    if (!has()) return "no-sound";
    if (!on) return "off";
    if (volume === 0) return "muted";
    if (hidden()) return "hidden";
    if (!inSight) return "out-of-sight";
    if (paused) return "paused";
    return undefined;
  }
  function audible(): boolean {
    if (destroyed) return false;
    const why = quiet();
    return why === undefined || (why === "paused" && tailing !== undefined);
  }
  /** Hold the sound on for `TAIL` seconds after the clock stopped on a cue, then let it go quiet: one timer, once. */
  function tail(): void {
    if (tailing !== undefined) clearTimeout(tailing);
    tailing = setTimeout(() => {
      tailing = undefined;
      refresh();
    }, TAIL * 1000);
  }
  function heard(): SoundLevel {
    if (level !== "auto") return levelFor(context.sport, level);
    const ctx = hub.context;
    if (ctx !== undefined && ctx.currentTime < liftUntil) return levelFor(context.sport, "roar");
    const moment = followMoment ?? liveMoment;
    return levelFor(context.sport, moment === undefined ? "engaged" : excitementAt(moment));
  }
  const mixNow = (): SoundMix | undefined => soundMix(context, heard());

  /** The names a surface needs: its bed's layers and its cues' voices that a page has files for. */
  const wanted = (): SoundFileName[] => {
    const found = soundSetOf(context.sport);
    if (found === undefined) return [];
    return [...SOUND_BEDS[found.bed].layers, ...soundVoicesOf(context.sport)].filter((name) => typeof files[name] === "string");
  };
  /** Fetch what the surface needs and has not been fetched: only after the sound was first turned on. */
  function fetchWanted(): Promise<void> {
    return Promise.all(
      wanted()
        .filter((name) => !fetched.has(name) && !decoded.has(name))
        .map((name) =>
          get(files[name] as string).then(
            (answer) => (answer.ok ? answer.arrayBuffer().then((bytes) => void fetched.set(name, bytes)) : void decoded.set(name, "failed")),
            () => void decoded.set(name, "failed"),
          ),
        ),
    ).then(() => undefined);
  }
  /** Decode the fetched recordings, only while heard; when they are ready the bed is laid again with them. */
  function decodeFetched(): void {
    const ctx = hub.context;
    if (ctx === undefined || !audible()) return;
    for (const [name, bytes] of fetched) {
      if (decoded.has(name)) continue;
      const job = ctx.decodeAudioData(bytes.slice(0)).then(
        (buffer) => {
          decoded.set(name, buffer);
          fetched.delete(name);
          if (graph !== undefined && (SOUND_BEDS[soundSetOf(context.sport)?.bed ?? "arena"].layers as readonly string[]).includes(name)) relayBed();
        },
        () => {
          decoded.set(name, "failed");
          fetched.delete(name);
        },
      );
      decoded.set(name, job);
    }
  }
  const recording = (name: SoundFileName): AudioBuffer | undefined => {
    const found = decoded.get(name);
    return found !== undefined && typeof found === "object" && "getChannelData" in found ? found : undefined;
  };

  const buffers = (ctx: SoundAudioContext): VoiceBuffers => ({
    noise: () => (made.noise ??= bufferOf(ctx, [noiseSamples(Math.round(LAYER_SECONDS * ctx.sampleRate), 71, "pink")])),
    applause: () => (made.applause ??= layerBuffer(ctx, "applause")),
  });
  const madeLayer = (ctx: SoundAudioContext, layer: SoundLayer): AudioBuffer => {
    let buffer = made.layers.get(layer);
    if (buffer === undefined) {
      buffer = layer === "applause" ? buffers(ctx).applause() : layerBuffer(ctx, layer);
      made.layers.set(layer, buffer);
    }
    return buffer;
  };

  /** A looping source of a layer, through its filter when it is made. */
  function loop(ctx: SoundAudioContext, layer: SoundLayer, into: AudioNode): AudioBufferSourceNode {
    const source = ctx.createBufferSource();
    const recorded = recording(layer);
    source.buffer = recorded ?? madeLayer(ctx, layer);
    source.loop = true;
    if (recorded === undefined) {
      const filter = layerFilter(ctx, layer);
      source.connect(filter);
      filter.connect(into);
    } else source.connect(into);
    source.start();
    return source;
  }

  function impulse(ctx: SoundAudioContext, decay: number): AudioBuffer {
    return bufferOf(ctx, impulseSamples(decay, ctx.sampleRate, 97));
  }

  /** Lay the bed of the surface into the graph: a loop for each of its layers, and the roar's swell. */
  function layBed(ctx: SoundAudioContext, g: Graph, mix: SoundMix): void {
    for (const layer of mix.bed.layers) {
      const gain = ctx.createGain();
      gain.gain.value = mix.layers[layer] * mix.gain;
      gain.connect(g.mix);
      g.layers.set(layer, { gain, source: loop(ctx, layer, gain) });
    }
    if (mix.bed.layers.includes("roar")) {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(g.mix);
      g.swell = { gain, source: loop(ctx, "roar", gain) };
    }
  }
  function clearBed(g: Graph): void {
    for (const { source, gain } of [...g.layers.values(), ...(g.swell === undefined ? [] : [g.swell])]) {
      source.stop();
      source.disconnect();
      gain.disconnect();
    }
    g.layers.clear();
    g.swell = undefined;
  }
  function relayBed(): void {
    const ctx = hub.context;
    const mix = mixNow();
    if (ctx === undefined || graph === undefined) return;
    clearBed(graph);
    if (mix !== undefined) layBed(ctx, graph, mix);
  }

  /** Make the graph and start the bed: when the sound becomes heard. */
  function build(ctx: SoundAudioContext): void {
    const mix = mixNow();
    if (mix === undefined) return;
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    const mixBus = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse(ctx, mix.decay);
    dry.gain.value = 1 - mix.wet;
    wet.gain.value = mix.wet;
    mixBus.connect(dry);
    mixBus.connect(convolver);
    convolver.connect(wet);
    dry.connect(master);
    wet.connect(master);
    const cues = ctx.createGain();
    cues.gain.value = 0.9;
    cues.connect(mixBus);
    graph = { master, mix: mixBus, dry, wet, convolver, decay: mix.decay, layers: new Map(), swell: undefined, cues };
    glidedTo = mix.level;
    dirty = false;
    layBed(ctx, graph, mix);
  }
  /** Stop the bed and take the graph away: when the sound stops being heard. */
  function tearDown(): void {
    if (graph === undefined) return;
    clearBed(graph);
    for (const node of [graph.cues, graph.mix, graph.dry, graph.wet, graph.convolver, graph.master]) node.disconnect();
    graph = undefined;
  }

  /** Glide the bed to the mix of now: the level, the room, the volume. */
  function glide(): void {
    const ctx = hub.context;
    if (ctx === undefined || graph === undefined) return;
    const mix = mixNow();
    if (mix === undefined) return;
    dirty = false;
    glidedTo = mix.level;
    const now = ctx.currentTime;
    graph.master.gain.setTargetAtTime(volume, now, 0.05);
    graph.dry.gain.setTargetAtTime(1 - mix.wet, now, GLIDE);
    graph.wet.gain.setTargetAtTime(mix.wet, now, GLIDE);
    for (const [layer, { gain }] of graph.layers) gain.gain.setTargetAtTime(mix.layers[layer] * mix.gain, now, GLIDE);
    if (Math.abs(mix.decay - graph.decay) > graph.decay * 0.1) {
      graph.convolver.buffer = impulse(ctx, mix.decay);
      graph.decay = mix.decay;
    }
  }

  /** Bring the graph to whether the sound is heard: made when it starts being heard, taken away when it stops, and the context run or suspended. */
  function refresh(): void {
    const ctx = hub.context;
    if (ctx !== undefined) {
      if (audible()) {
        if (graph === undefined) build(ctx);
        else if (dirty || heard() !== glidedTo) glide();
        decodeFetched();
      } else tearDown();
    }
    settle(hub);
  }

  /**
   * A recording as a cue: whole, or for the end of a game two short whistles and a long one, or for applause (a loop) three seconds that rise and fall away, so that a loop's cut is
   * never heard.
   */
  function playRecording(ctx: SoundAudioContext, out: AudioNode, buffer: AudioBuffer, voice: SoundVoice, now: number): void {
    const one = (at: number, length?: number): void => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(out);
      const until = at + (length ?? buffer.duration);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(1, at + (voice === "applause" ? 0.3 : 0.005));
      gain.gain.setValueAtTime(1, Math.max(at + 0.01, until - (voice === "applause" ? 1.2 : 0.05)));
      gain.gain.linearRampToValueAtTime(0, until);
      source.start(at, 0, length ?? buffer.duration);
      source.stop(until);
    };
    if (voice === "whistle-end") {
      one(now, 0.25);
      one(now + 0.4, 0.25);
      one(now + 0.8);
    } else if (voice === "applause") one(now, Math.min(buffer.duration, 3.5));
    else one(now);
  }

  function play(cue: SoundCue): void {
    const ctx = hub.context;
    if (ctx === undefined || graph === undefined || !audible()) return;
    const now = ctx.currentTime;
    const last = lastPlayed.get(cue.voice);
    if (last !== undefined && now - last < SAME_VOICE) return;
    lastPlayed.set(cue.voice, now);
    settings.onCue?.(cue);
    if (cue.voice === "swell") {
      const swell = graph.swell;
      const mix = mixNow();
      if (swell === undefined || mix === undefined || mix.crowd === 0) return;
      const g = swell.gain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(mix.crowd * mix.gain, now + 0.5);
      g.setValueAtTime(mix.crowd * mix.gain, now + 2.5);
      g.setTargetAtTime(0, now + 2.5, 1.5);
      return;
    }
    const recorded = recording(cue.voice === "whistle-end" ? "whistle" : cue.voice);
    if (recorded !== undefined) playRecording(ctx, graph.cues, recorded, cue.voice, now);
    else makeVoice(ctx, cue.voice, graph.cues, buffers(ctx), now);
  }

  const onVisibility = (): void => refresh();
  doc?.addEventListener("visibilitychange", onVisibility);
  let observer: IntersectionObserver | undefined;
  if (settings.host !== undefined && typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last === undefined) return;
      inSight = last.isIntersecting;
      refresh();
    });
    observer.observe(settings.host);
  }

  const sound: KyogijoSound = {
    async enable() {
      if (destroyed) return;
      on = true;
      hub.context ??= audio();
      refresh();
      await fetchWanted();
      refresh();
    },
    disable() {
      on = false;
      refresh();
    },
    setVolume(next) {
      volume = isNum(next) ? clamp(next, 0, 1) : volume;
      dirty = true;
      refresh();
    },
    setLevel(next) {
      level = next;
      dirty = true;
      refresh();
    },
    setContext(next) {
      const before = soundSetOf(context.sport)?.bed;
      Object.assign(context, next);
      dirty = true;
      if (soundSetOf(context.sport)?.bed !== before) {
        tearDown();
        if (on) void fetchWanted().then(refresh);
      }
      refresh();
    },
    follow(controller, game = {}) {
      following?.stop();
      const periods = game.periods ?? [];
      let lastT = controller.state().t;
      let goalAt: number | undefined;
      const momentOf = (t: number, start: number, end: number): GameMoment => ({ t, start, end, periods, score: game.scoreAt?.(t), sinceGoal: goalAt === undefined ? undefined : t - goalAt });
      const take = (s: ReturnType<ReplayController["state"]>): void => {
        paused = !s.playing;
        if (s.playing && tailing !== undefined) {
          clearTimeout(tailing);
          tailing = undefined;
        }
        followMoment = momentOf(s.t, s.start, s.end);
      };
      take(controller.state());
      const stop = controller.subscribe((change) => {
        const cues = cuesOfChange(change, lastT, context.sport, periods);
        if (change.state.t < lastT || change.reason === "seek") goalAt = undefined;
        for (const event of change.crossed) {
          const kind = cueKindOf(event);
          if (change.reason === "tick" && (kind === "goal" || kind === "point")) goalAt = event.t;
        }
        lastT = change.state.t;
        // The cues of the last move are heard out, though the clock stopped with it (the horn at the end of the game): the sound goes quiet a few seconds later.
        if (cues.length > 0 && !change.state.playing) tail();
        take(change.state);
        refresh();
        for (const cue of cues) play(cue);
      });
      const handle = {
        stop() {
          stop();
          if (following === handle) {
            following = undefined;
            followMoment = undefined;
            paused = false;
            refresh();
          }
        },
      };
      following = handle;
      refresh();
      return () => handle.stop();
    },
    cue(event) {
      const voices = cuesOf(event, context.sport);
      const ctx = hub.context;
      const kind = cueKindOf(event);
      if (ctx !== undefined && (kind === "goal" || kind === "point") && voices.length > 0) liftUntil = ctx.currentTime + GOAL_LIFT;
      dirty = true;
      refresh();
      if (kind === undefined) return;
      const t = ctx?.currentTime ?? 0;
      for (const voice of voices) play(event.team === undefined ? { voice, kind, t } : { voice, kind, t, team: event.team });
    },
    game(moment) {
      liveMoment = moment;
      refresh();
    },
    state() {
      const why = quiet();
      return {
        has: has(),
        on,
        audible: audible(),
        ...(why === undefined ? {} : { quiet: why }),
        sport: context.sport,
        volume,
        level,
        heard: heard(),
        levels: soundLevelsOf(context.sport),
        voices: soundVoicesOf(context.sport),
        fetched: [...new Set([...fetched.keys(), ...[...decoded].filter(([, v]) => v !== "failed").map(([k]) => k)])],
        following: following !== undefined,
      };
    },
    destroy() {
      if (destroyed) return;
      following?.stop();
      destroyed = true;
      on = false;
      if (tailing !== undefined) clearTimeout(tailing);
      tailing = undefined;
      tearDown();
      doc?.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      hub.users.delete(user);
      settle(hub);
    },
  };
  return sound;
}
