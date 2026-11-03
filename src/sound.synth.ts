// The sounds made in the browser with Web Audio, for every voice and layer that has no recording, or whose recording a page does not give: a whistle is an oscillator with a trill, a horn
// three low saws through a filter, a crowd filtered noise whose level moves slowly. The noise and the room's echo are written into buffers once, from a seeded generator, so that the same
// call makes the same sound; nothing here reads a clock but the audio context's own, or makes a sound before it is asked to.
import type { SoundLayer, SoundVoice } from "./sound.sets.ts";

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

/** An envelope on a gain: up in `attack`, held, then down in `release`, from `when`. */
function envelope(gain: AudioParam, when: number, peak: number, attack: number, hold: number, release: number): number {
  gain.setValueAtTime(0, when);
  gain.linearRampToValueAtTime(peak, when + attack);
  gain.setValueAtTime(peak, when + attack + hold);
  gain.linearRampToValueAtTime(0, when + attack + hold + release);
  return when + attack + hold + release;
}

/** An oscillator from `when` to `until`, into `into`. */
function tone(context: BaseAudioContext, into: AudioNode, type: OscillatorType, frequency: number, when: number, until: number): OscillatorNode {
  const osc = context.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.connect(into);
  osc.start(when);
  osc.stop(until);
  return osc;
}

/** A burst of noise from a buffer, from `when` to `until`, into `into`. */
function burst(context: BaseAudioContext, into: AudioNode, noise: AudioBuffer, when: number, until: number): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  source.connect(into);
  source.start(when);
  source.stop(until);
  return source;
}

/** One blast of a pea whistle: a high tone with a fast trill, and a little breath. */
function whistleBlast(context: BaseAudioContext, out: AudioNode, noise: AudioBuffer, when: number, length: number): number {
  const amp = context.createGain();
  amp.connect(out);
  const until = envelope(amp.gain, when, 0.35, 0.015, length, 0.06);
  const osc = tone(context, amp, "sine", 2900, when, until);
  const trill = context.createOscillator();
  trill.frequency.value = 28;
  const depth = context.createGain();
  depth.gain.value = 140;
  trill.connect(depth);
  depth.connect(osc.frequency);
  trill.start(when);
  trill.stop(until);
  const breath = context.createBiquadFilter();
  breath.type = "bandpass";
  breath.frequency.value = 2900;
  breath.Q.value = 4;
  const breathGain = context.createGain();
  breathGain.gain.value = 0.25;
  breath.connect(breathGain);
  breathGain.connect(amp);
  burst(context, breath, noise, when, until);
  return until;
}

/** One strike of a ring's bell: three partials that ring down. */
function bellStrike(context: BaseAudioContext, out: AudioNode, when: number): number {
  const until = when + 1.4;
  for (const [frequency, loud] of [[830, 0.3], [1490, 0.18], [2210, 0.12]] as const) {
    const amp = context.createGain();
    amp.gain.setValueAtTime(loud, when);
    amp.gain.exponentialRampToValueAtTime(0.0001, until);
    amp.connect(out);
    tone(context, amp, "sine", frequency, when, until);
  }
  return until;
}

/** A crowd's vowel: noise through a filter that opens from `from` to `to` hertz, swelling and falling away. */
function vowel(context: BaseAudioContext, out: AudioNode, noise: AudioBuffer, when: number, from: number, to: number, peak: number, attack: number, release: number): number {
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, when);
  filter.frequency.linearRampToValueAtTime(to, when + attack);
  const amp = context.createGain();
  filter.connect(amp);
  amp.connect(out);
  const until = envelope(amp.gain, when, peak, attack, 0.1, release);
  burst(context, filter, noise, when, until);
  return until;
}

/** The loops a made voice is cut from, made the first time a voice needs one and kept by the caller. */
export interface VoiceBuffers {
  /** Pink noise. */
  noise(): AudioBuffer;
  /** Hands clapping. */
  applause(): AudioBuffer;
}

/**
 * Make a voice in the browser at `when` on the context's clock, into `out`, from the noise of `noise` (a pink loop). Returns when it ends. The horn is one chord held, never a tune; the
 * swell is not here, as it moves the bed's roar (the engine does it).
 */
export function makeVoice(context: BaseAudioContext, voice: Exclude<SoundVoice, "swell">, out: AudioNode, buffers: VoiceBuffers, when: number): number {
  const noise = buffers.noise();
  switch (voice) {
    case "whistle":
      return whistleBlast(context, out, noise, when, 0.45);
    case "whistle-end": {
      const second = whistleBlast(context, out, noise, when, 0.22) + 0.12;
      const third = whistleBlast(context, out, noise, second, 0.22) + 0.12;
      return whistleBlast(context, out, noise, third, 1.3);
    }
    case "horn": {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      filter.Q.value = 1;
      const amp = context.createGain();
      filter.connect(amp);
      amp.connect(out);
      const until = envelope(amp.gain, when, 0.22, 0.06, 2.6, 0.6);
      for (const frequency of [98, 98.6, 123.5, 146.8]) tone(context, filter, "sawtooth", frequency, when, until);
      return until;
    }
    case "buzzer": {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2200;
      const amp = context.createGain();
      filter.connect(amp);
      amp.connect(out);
      const until = envelope(amp.gain, when, 0.16, 0.01, 1.3, 0.04);
      tone(context, filter, "square", 196, when, until);
      tone(context, filter, "sawtooth", 392, when, until);
      return until;
    }
    case "bell":
      return [0, 0.3, 0.6].reduce((end, at) => Math.max(end, bellStrike(context, out, when + at)), when);
    case "gun": {
      const filter = context.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 700;
      const amp = context.createGain();
      filter.connect(amp);
      amp.connect(out);
      amp.gain.setValueAtTime(0.9, when);
      amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
      burst(context, filter, noise, when, when + 0.35);
      const thump = context.createGain();
      thump.gain.setValueAtTime(0.6, when);
      thump.gain.exponentialRampToValueAtTime(0.0001, when + 0.25);
      thump.connect(out);
      tone(context, thump, "sine", 85, when, when + 0.25);
      return when + 0.35;
    }
    case "beep": {
      const amp = context.createGain();
      amp.connect(out);
      const until = envelope(amp.gain, when, 0.18, 0.005, 0.45, 0.02);
      tone(context, amp, "square", 1000, when, until);
      return until;
    }
    case "ooh":
      return vowel(context, out, noise, when, 360, 640, 1.2, 0.35, 1.5);
    case "cheer":
      return vowel(context, out, noise, when, 700, 1100, 1, 0.08, 1.2);
    case "applause": {
      const amp = context.createGain();
      amp.connect(out);
      const until = envelope(amp.gain, when, 0.6, 0.25, 1.8, 1.6);
      const source = context.createBufferSource();
      source.buffer = buffers.applause();
      source.loop = true;
      const filter = layerFilter(context, "applause");
      source.connect(filter);
      filter.connect(amp);
      source.start(when);
      source.stop(until);
      return until;
    }
  }
}
