// A stand-in for a page's audio context, for the sound's tests: it makes no sound, and records what was made, started, stopped and scheduled, so that a test can say which voices played and
// that nothing runs while the sound is not heard.
import type { SoundAudioContext } from "./sound.dom.ts";

export interface FakeParam {
  value: number;
  calls: [string, ...number[]][];
  setValueAtTime(v: number, t: number): FakeParam;
  linearRampToValueAtTime(v: number, t: number): FakeParam;
  exponentialRampToValueAtTime(v: number, t: number): FakeParam;
  setTargetAtTime(v: number, t: number, c: number): FakeParam;
  cancelScheduledValues(t: number): FakeParam;
}

export interface FakeNode {
  kind: string;
  connected: FakeNode[];
  started?: number;
  stopped?: number;
  type?: string;
  frequency?: FakeParam;
  gain?: FakeParam;
  Q?: FakeParam;
  buffer?: unknown;
  loop?: boolean;
}

function param(value = 0): FakeParam {
  const p: FakeParam = {
    value,
    calls: [],
    setValueAtTime(v, t) {
      p.calls.push(["set", v, t]);
      p.value = v;
      return p;
    },
    linearRampToValueAtTime(v, t) {
      p.calls.push(["linear", v, t]);
      return p;
    },
    exponentialRampToValueAtTime(v, t) {
      p.calls.push(["exp", v, t]);
      return p;
    },
    setTargetAtTime(v, t, c) {
      p.calls.push(["target", v, t, c]);
      return p;
    },
    cancelScheduledValues(t) {
      p.calls.push(["cancel", t]);
      return p;
    },
  };
  return p;
}

export interface FakeAudio {
  context: SoundAudioContext & { nodes: FakeNode[]; resumes: number; suspends: number; decodes: number; currentTime: number };
  /** Sources started and not stopped: what would be sounding. */
  running(): FakeNode[];
  /** The oscillators' frequencies, of every oscillator made. */
  tones(): number[];
}

/** A fake audio context, with a small sample rate so that the made loops are quick to write. */
export function fakeAudio(sampleRate = 800): FakeAudio {
  const nodes: FakeNode[] = [];
  const node = (kind: string, extra: Partial<FakeNode> = {}): FakeNode => {
    const n: FakeNode & { connect(to: FakeNode | FakeParam): void; disconnect(): void; start(t?: number): void; stop(t?: number): void } = {
      kind,
      connected: [],
      ...extra,
      connect(to) {
        if ("kind" in to) n.connected.push(to);
      },
      disconnect() {
        n.connected = [];
      },
      start(t = 0) {
        n.started = t;
      },
      stop(t = 0) {
        n.stopped = t;
      },
    };
    nodes.push(n);
    return n;
  };
  const context = {
    nodes,
    resumes: 0,
    suspends: 0,
    decodes: 0,
    sampleRate,
    currentTime: 0,
    state: "suspended" as AudioContextState,
    destination: node("destination"),
    resume() {
      context.resumes++;
      context.state = "running";
      return Promise.resolve();
    },
    suspend() {
      context.suspends++;
      context.state = "suspended";
      return Promise.resolve();
    },
    createGain: () => node("gain", { gain: param(1) }),
    createBiquadFilter: () => node("filter", { type: "lowpass", frequency: param(350), Q: param(1) }),
    createOscillator: () => node("oscillator", { type: "sine", frequency: param(440) }),
    createBufferSource: () => node("source", { loop: false }),
    createConvolver: () => node("convolver"),
    createBuffer(channels: number, length: number, rate: number) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate: rate, duration: length / rate, getChannelData: (i: number) => data[i] };
    },
    decodeAudioData(bytes: ArrayBuffer) {
      context.decodes++;
      const data = new Float32Array(bytes.byteLength);
      return Promise.resolve({ numberOfChannels: 1, length: data.length, sampleRate, duration: data.length / sampleRate, getChannelData: () => data, decodedFrom: bytes.byteLength });
    },
  };
  return {
    context: context as unknown as FakeAudio["context"],
    running: () => nodes.filter((n) => (n.kind === "source" || n.kind === "oscillator") && n.started !== undefined && n.stopped === undefined),
    tones: () => nodes.filter((n) => n.kind === "oscillator").map((n) => n.frequency?.value ?? 0),
  };
}

/** A page's document, as far as the sound reads it: hidden or not, and its listeners. */
export function fakeDoc(): { doc: Document; hide(hidden: boolean): void; listeners(): number } {
  const listeners = new Set<() => void>();
  const doc = {
    visibilityState: "visible",
    addEventListener: (_: string, f: () => void) => listeners.add(f),
    removeEventListener: (_: string, f: () => void) => listeners.delete(f),
  };
  return {
    doc: doc as unknown as Document,
    hide(hidden) {
      doc.visibilityState = hidden ? "hidden" : "visible";
      for (const f of listeners) f();
    },
    listeners: () => listeners.size,
  };
}

/** Wait for the promises a sound starts (a fetch, a decode) to settle. */
export const settled = (): Promise<void> => new Promise((done) => setTimeout(done, 0));
