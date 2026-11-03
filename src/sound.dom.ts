// The sound of a surface in a page: a crowd bed at a level, in the room it is heard in. Off until a page turns it on (a browser lets audio start only after a press anyway): nothing is
// fetched, made or decoded before that. One audio context serves every sound of a page, and it is suspended whenever none of them is heard: turned off, at no volume, the page hidden or
// the surface out of sight. A bed's loops play only while it is heard.
import { levelFor, soundLevelsOf, soundMix, soundSetOf } from "./sound.mix.ts";
import type { SoundContext, SoundMix, SoundVenue } from "./sound.mix.ts";
import { SOUND_BEDS } from "./sound.sets.ts";
import type { SoundLayer, SoundLevel } from "./sound.sets.ts";
import { bufferOf, impulseSamples, layerBuffer, layerFilter } from "./sound.synth.ts";

/** The recordings a page may give, by the layer they stand for; anything not given is made in the browser. */
export type SoundFileName = SoundLayer;

/** What the engine needs of an audio context: a page's `AudioContext`, or a stand-in in a test. */
export type SoundAudioContext = BaseAudioContext & { resume(): Promise<void>; suspend(): Promise<void> };

/** How the engine fetches a recording: `fetch` by default. */
export type SoundFetch = (url: string) => Promise<{ ok: boolean; arrayBuffer(): Promise<ArrayBuffer> }>;

/** The settings of a surface's sound. */
export interface SoundSettings {
  /** The surface (`nhl`, `soccer`, ...). A surface with no sound set makes no sound and offers no levels (`state().has`). */
  sport: string;
  venue?: SoundVenue;
  /** The share of the seats taken, 0 to 1: 0 is no crowd (a page's Crowd off). */
  crowd?: number;
  view?: "2d" | "3d";
  /** The crowd's level: `engaged` by default. */
  level?: SoundLevel;
  /** 0 to 1: 0.6 by default. 0 is muted, and nothing is heard or made. */
  volume?: number;
  /** Recordings by name, for the layers a page has files for (the demo's: `demo/sounds/`). Fetched only when the sound is first turned on, and decoded only when it is heard. */
  files?: Partial<Record<SoundFileName, string>>;
  /** Makes the page's one audio context: `new AudioContext()` by default. A test gives a stand-in. */
  audio?: () => SoundAudioContext;
  fetch?: SoundFetch;
  /** The element the surface is drawn in: the sound stops while it is out of sight. */
  host?: Element;
  /** The page, for whether it is hidden: `document` by default. */
  doc?: Document;
}

/** Why a sound is not heard. */
export type SoundQuiet = "no-sound" | "off" | "muted" | "hidden" | "out-of-sight";

/** What a sound is doing. */
export interface SoundState {
  /** The surface has a sound set: a page shows the sound's controls only when it has. */
  has: boolean;
  on: boolean;
  /** Heard now: on, with volume, the page shown and the surface in sight. */
  audible: boolean;
  /** Why it is not heard, when it is not. */
  quiet?: SoundQuiet;
  sport: string;
  volume: number;
  level: SoundLevel;
  /** The level heard: the choice, held to what the surface offers. */
  heard: SoundLevel;
  /** The levels the surface offers, quietest first. */
  levels: readonly SoundLevel[];
  /** The recordings fetched (they are decoded when heard). */
  fetched: readonly SoundFileName[];
}

/** A surface's sound in a page. */
export interface KyogijoSound {
  /** Turn it on: call it from a press, so that the browser lets the audio start. The first call makes the audio context and fetches the recordings. */
  enable(): Promise<void>;
  /** Turn it off: nothing is heard, made or decoded, and the audio context is suspended when no other sound of the page is heard. */
  disable(): void;
  setVolume(volume: number): void;
  setLevel(level: SoundLevel): void;
  /** Change the context: another surface, venue, crowd or view. The levels offered follow the surface. */
  setContext(context: Partial<SoundContext>): void;
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

interface Graph {
  master: GainNode;
  mix: GainNode;
  wet: GainNode;
  dry: GainNode;
  convolver: ConvolverNode;
  decay: number;
  layers: Map<SoundLayer, { source: AudioBufferSourceNode; gain: GainNode }>;
}

/**
 * The sound of a surface: its crowd bed at a level, in its venue's room. Nothing happens until `enable()`, which a page calls from a press.
 * @example
 * ```ts no-run
 * import { createKyogijoSound } from "@johnmorrisdotca/kyogijo-stadiums/sound";
 *
 * const host = document.querySelector("#rink")!;
 * const sound = createKyogijoSound({ sport: "nhl", venue: { roof: "fixed", seats: 18000 }, view: "3d", level: "loud", host });
 * document.querySelector("#sound")!.addEventListener("click", () => sound.enable());
 * sound.setLevel("roar");
 * ```
 */
export function createKyogijoSound(settings: SoundSettings): KyogijoSound {
  const audio = settings.audio ?? DEFAULT_AUDIO;
  const get = settings.fetch ?? ((url: string) => fetch(url));
  const doc = settings.doc ?? (typeof document === "undefined" ? undefined : document);
  const files = { ...settings.files };
  const context: SoundContext = { sport: settings.sport, venue: settings.venue, crowd: settings.crowd, view: settings.view };
  let level: SoundLevel = settings.level ?? "engaged";
  let volume = isNum(settings.volume) ? clamp(settings.volume, 0, 1) : 0.6;
  let on = false;
  let inSight = true;
  let graph: Graph | undefined;
  let destroyed = false;
  /** The level the bed was last glided to, and whether a setting changed since: the bed is glided only then, not on every frame of a game. */
  let glidedTo: SoundLevel | undefined;
  let dirty = false;
  const hub = hubOf(audio);
  const fetched = new Map<SoundFileName, ArrayBuffer>();
  const decoded = new Map<SoundFileName, AudioBuffer | "failed" | Promise<void>>();
  const made = new Map<SoundLayer, AudioBuffer>();
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
    return undefined;
  }
  function audible(): boolean {
    return !destroyed && quiet() === undefined;
  }
  const heard = (): SoundLevel => levelFor(context.sport, level);
  const mixNow = (): SoundMix | undefined => soundMix(context, heard());

  /** The names a surface needs: its bed's layers that a page has files for. */
  const wanted = (): SoundFileName[] => {
    const found = soundSetOf(context.sport);
    if (found === undefined) return [];
    return SOUND_BEDS[found.bed].layers.filter((name) => typeof files[name] === "string");
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

  const madeLayer = (ctx: SoundAudioContext, layer: SoundLayer): AudioBuffer => {
    let buffer = made.get(layer);
    if (buffer === undefined) {
      buffer = layerBuffer(ctx, layer);
      made.set(layer, buffer);
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

  /** Lay the bed of the surface into the graph: a loop for each of its layers. */
  function layBed(ctx: SoundAudioContext, g: Graph, mix: SoundMix): void {
    for (const layer of mix.bed.layers) {
      const gain = ctx.createGain();
      gain.gain.value = mix.layers[layer] * mix.gain;
      gain.connect(g.mix);
      g.layers.set(layer, { gain, source: loop(ctx, layer, gain) });
    }
  }
  function clearBed(g: Graph): void {
    for (const { source, gain } of g.layers.values()) {
      source.stop();
      source.disconnect();
      gain.disconnect();
    }
    g.layers.clear();
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
    graph = { master, mix: mixBus, dry, wet, convolver, decay: mix.decay, layers: new Map() };
    glidedTo = mix.level;
    dirty = false;
    layBed(ctx, graph, mix);
  }
  /** Stop the bed and take the graph away: when the sound stops being heard. */
  function tearDown(): void {
    if (graph === undefined) return;
    clearBed(graph);
    for (const node of [graph.mix, graph.dry, graph.wet, graph.convolver, graph.master]) node.disconnect();
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
        fetched: [...new Set([...fetched.keys(), ...[...decoded].filter(([, v]) => v !== "failed").map(([k]) => k)])],
      };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      on = false;
      tearDown();
      doc?.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      hub.users.delete(user);
      settle(hub);
    },
  };
  return sound;
}
