// Make the demo's recordings (demo/sounds/) from the raw files listed in scripts/sounds.data.json, each CC0 or in the public domain: the part of each that is used, cut, high-passed, made one
// channel, brought to one loudness (a loop to an RMS level, a one-shot to a peak), a loop's end crossfaded into its start so that it repeats with no seam, and written twice, as Ogg Opus and
// as AAC in .m4a for a browser that cannot decode Opus. The raw files are kept outside git (data-sources/sounds/raw/, fetched by `pnpm sounds:fetch`); only what this makes is committed.
//
//   node scripts/make-sounds.mjs           make every file
//   node scripts/make-sounds.mjs --look    print each raw file's peak every tenth of a second, to choose a part
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { Buffer } from "node:buffer";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "scripts/sounds.data.json"), "utf8"));
const RAW = join(root, "data-sources/sounds/raw");
const OUT = join(root, "demo/sounds");
const RATE = 48000;

/** A raw file as one channel of 32-bit floats at 48 kHz, high-passed at 80 Hz (the rumble of a hall and a microphone's handling). */
function decode(file, highpass = 80) {
  const ran = spawnSync("ffmpeg", ["-v", "error", "-i", join(RAW, file), "-ac", "1", "-ar", String(RATE), "-af", `highpass=f=${highpass}`, "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  if (ran.status !== 0) throw new Error(`ffmpeg could not read ${file}: ${ran.stderr}`);
  const bytes = ran.stdout;
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4).slice();
}

/** Samples written by ffmpeg in a format. */
function encode(samples, out, args) {
  const ran = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(RATE), "-ac", "1", "-i", "-", ...args, "-map_metadata", "-1", out], { input: Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength) });
  if (ran.status !== 0) throw new Error(`ffmpeg could not write ${out}: ${ran.stderr}`);
}

const rms = (s) => Math.sqrt(s.reduce((sum, v) => sum + v * v, 0) / s.length);
const peak = (s) => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const db = (gain) => 20 * Math.log10(gain);

/** A loop from `seg`: its first `length` samples, with the `fade` samples after them crossfaded (equal power) into its start, so that its end runs into its start. */
function seamless(seg, length, fade) {
  const out = seg.slice(0, length);
  for (let i = 0; i < fade; i++) {
    const x = i / fade;
    out[i] = seg[i] * Math.sin((x * Math.PI) / 2) + seg[length + i] * Math.cos((x * Math.PI) / 2);
  }
  return out;
}

/** A one-shot's short fades in and out, so that it neither clicks nor stops dead. */
function edges(s, fadeIn = 0.005, fadeOut = 0.08) {
  const a = Math.round(fadeIn * RATE);
  const b = Math.min(s.length, Math.round(fadeOut * RATE));
  for (let i = 0; i < a; i++) s[i] *= i / a;
  for (let i = 0; i < b; i++) s[s.length - 1 - i] *= i / b;
  return s;
}

function make(entry) {
  const all = decode(entry.raw, entry.highpass);
  const from = Math.round(entry.from * RATE);
  const length = Math.round(entry.seconds * RATE);
  let samples;
  if (entry.loop) {
    const fade = Math.round((entry.fade ?? 0.5) * RATE);
    if (from + length + fade > all.length) throw new Error(`${entry.name}: the part runs past the end of ${entry.raw}`);
    samples = seamless(all.subarray(from, from + length + fade), length, fade);
    const gain = 10 ** (entry.rms / 20) / rms(samples);
    for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  } else {
    samples = edges(all.slice(from, Math.min(all.length, from + length)));
    const gain = 10 ** (entry.peak / 20) / peak(samples);
    for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  }
  const top = peak(samples);
  if (top > 0.99) for (let i = 0; i < samples.length; i++) samples[i] *= 0.99 / top;
  const ogg = join(OUT, `${entry.name}.ogg`);
  const m4a = join(OUT, `${entry.name}.m4a`);
  encode(samples, ogg, ["-c:a", "libopus", "-b:a", `${entry.kbps}k`, "-vbr", "on", "-application", "audio"]);
  encode(samples, m4a, ["-c:a", "aac", "-b:a", `${entry.kbps + 16}k`, "-movflags", "+faststart"]);
  return { name: entry.name, seconds: Math.round((samples.length / RATE) * 100) / 100, rms: Math.round(db(rms(samples))), ogg: statSync(ogg).size, m4a: statSync(m4a).size };
}

if (process.argv.includes("--look")) {
  for (const entry of data.sounds) {
    const all = decode(entry.raw);
    const step = RATE / 10;
    const peaks = [];
    for (let i = 0; i < all.length; i += step) peaks.push(Math.round(db(peak(all.subarray(i, i + step))) || -99));
    console.log(`${entry.name} (${entry.raw}, ${(all.length / RATE).toFixed(1)} s):\n  ${peaks.join(" ")}`);
  }
} else {
  mkdirSync(OUT, { recursive: true });
  const made = data.sounds.map(make);
  for (const m of made) console.log(`${m.name.padEnd(9)} ${String(m.seconds).padStart(5)} s  ${String(m.rms).padStart(4)} dB RMS  ogg ${(m.ogg / 1024).toFixed(1)} kB  m4a ${(m.m4a / 1024).toFixed(1)} kB`);
}
