// The sounds made in the browser with Web Audio, for every layer of a crowd's bed that has no recording, or whose recording a page does not give: a crowd is filtered noise, talk is noise
// that rises and falls with syllables, applause many short bursts. The noise and the room's echo are written into buffers once, from a seeded generator, so that the same
// call makes the same sound; nothing here reads a clock but the audio context's own, or makes a sound before it is asked to.
import type { SoundLayer } from "./sound.sets.ts";

/** A seeded generator of numbers from 0 to 1 (mulberry32): the noise is the same every time. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The colours of noise: `white` flat, `pink` falling 3 dB an octave (a crowd's), `brown` falling 6 (a building's air). */
export type NoiseColour = "white" | "pink" | "brown";

/** Samples of noise of a colour, from a seed, between -1 and 1. */
export function noiseSamples(length: number, seed: number, colour: NoiseColour = "white"): Float32Array {
  const random = seeded(seed);
  const out = new Float32Array(length);
  // Paul Kellet's economy filter for pink; a leaky sum for brown.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = random() * 2 - 1;
    if (colour === "pink") {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      out[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
    } else if (colour === "brown") {
      last = (last + 0.02 * white) / 1.02;
      out[i] = last * 3.5;
    } else out[i] = white;
  }
  return out;
}

/** Samples of hands clapping: many short bursts of noise at random moments, `density` claps a second, for `length` samples at `rate`. */
export function applauseSamples(length: number, rate: number, seed: number, density = 220): Float32Array {
  const random = seeded(seed);
  const out = new Float32Array(length);
  const claps = Math.round((length / rate) * density);
  const clap = Math.round(rate * 0.012);
  for (let c = 0; c < claps; c++) {
    const at = Math.floor(random() * length);
    const loud = 0.25 + random() * 0.75;
    for (let i = 0; i < clap; i++) {
      // A loop: a clap near the end goes on at the start, so the loop has no seam.
      const j = (at + i) % length;
      out[j] += (random() * 2 - 1) * loud * Math.exp((-6 * i) / clap);
    }
  }
  let peak = 0;
  for (const s of out) peak = Math.max(peak, Math.abs(s));
  if (peak > 0) for (let i = 0; i < length; i++) out[i] /= peak;
  return out;
}

/** Samples of people talking: noise whose level rises and falls with syllables, about four a second from each of many voices, summed. */
export function murmurSamples(length: number, rate: number, seed: number, voices = 24): Float32Array {
  const random = seeded(seed);
  const noise = noiseSamples(length, seed + 1, "pink");
  const envelope = new Float32Array(length);
  for (let v = 0; v < voices; v++) {
    let at = Math.floor(random() * rate * 0.3);
    while (at < length) {
      const syllable = Math.round(rate * (0.12 + random() * 0.16));
      const loud = 0.3 + random() * 0.7;
      for (let i = 0; i < syllable; i++) envelope[(at + i) % length] += loud * Math.sin((Math.PI * i) / syllable);
      at += syllable + Math.round(rate * random() * (random() < 0.15 ? 0.9 : 0.12));
    }
  }
  let peak = 0;
  for (let i = 0; i < length; i++) {
    noise[i] *= envelope[i];
    peak = Math.max(peak, Math.abs(noise[i]));
  }
  if (peak > 0) for (let i = 0; i < length; i++) noise[i] /= peak;
  return noise;
}

/** A room's echo as an impulse response: noise falling 60 dB over `decay` seconds, two channels a little apart. */
export function impulseSamples(decay: number, rate: number, seed: number): [Float32Array, Float32Array] {
  const length = Math.max(1, Math.round(Math.min(4, Math.max(0.2, decay)) * rate));
  const left = noiseSamples(length, seed, "white");
  const right = noiseSamples(length, seed + 7, "white");
  for (let i = 0; i < length; i++) {
    const fall = Math.exp((-6.9 * i) / length);
    left[i] *= fall;
    right[i] *= fall;
  }
  return [left, right];
}

/** A buffer of the context from samples (one channel, or two). */
export function bufferOf(context: BaseAudioContext, channels: readonly Float32Array[]): AudioBuffer {
  const buffer = context.createBuffer(channels.length, channels[0].length, context.sampleRate);
  channels.forEach((samples, i) => buffer.getChannelData(i).set(samples));
  return buffer;
}

/** How many seconds each made layer loops for: long enough that the loop is not heard. */
export const LAYER_SECONDS = 6;

/**
 * How much each made layer is turned down or up so that, through its filter, it is as loud as the demo's recordings are made (an RMS of -20 dBFS; the pool's water -22, and the building's air
 * a quiet -30): measured once in a browser by rendering each layer offline.
 */
export const LAYER_TRIM: Readonly<Record<SoundLayer, number>> = { room: 0.22, water: 0.45, murmur: 1.58, applause: 1.41, roar: 1.12 };

/** The buffer a layer loops when it has no recording. */
export function layerBuffer(context: BaseAudioContext, layer: SoundLayer): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.round(LAYER_SECONDS * rate);
  const seed = { room: 11, water: 23, murmur: 37, applause: 41, roar: 53 }[layer];
  const colour: NoiseColour = layer === "room" ? "brown" : layer === "water" ? "white" : "pink";
  const make = (s: number): Float32Array => (layer === "murmur" ? murmurSamples(length, rate, s) : layer === "applause" ? applauseSamples(length, rate, s) : noiseSamples(length, s, colour));
  const channels = [make(seed), make(seed + 100)];
  for (const samples of channels) for (let i = 0; i < samples.length; i++) samples[i] *= LAYER_TRIM[layer];
  return bufferOf(context, channels);
}

/** The filter that shapes a made layer: the building's low air, water's hiss, talk's middle, a crowd's voice. */
export function layerFilter(context: BaseAudioContext, layer: SoundLayer): AudioNode {
  const filter = context.createBiquadFilter();
  const shape: Record<SoundLayer, [BiquadFilterType, number, number]> = {
    room: ["lowpass", 260, 0.7],
    water: ["bandpass", 2400, 0.6],
    murmur: ["bandpass", 700, 0.55],
    applause: ["highpass", 900, 0.7],
    roar: ["bandpass", 620, 0.9],
  };
  const [type, frequency, q] = shape[layer];
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  return filter;
}
