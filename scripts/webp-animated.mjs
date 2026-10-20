// An animated WebP made of lossy WebP frames of one size, by hand: the container is RIFF, a VP8X header with the animation flag, an ANIM chunk and one ANMF chunk for each frame (the WebP container
// specification, https://developers.google.com/speed/webp/docs/riff_container). Used by readme-animation.mjs, which takes the frames from the browser's own encoder, so that no tool beyond Playwright is needed.
import { Buffer } from "node:buffer";

/** The picture chunk ('VP8 ', lossy) of a still WebP, with its header and padding: the browser's encoder writes a VP8X header and a colour profile first, which an animation's frames leave out. */
export function chunkOf(webp) {
  if (webp.toString("ascii", 0, 4) !== "RIFF" || webp.toString("ascii", 8, 12) !== "WEBP") throw new Error("a frame is not a WebP");
  for (let at = 12; at + 8 <= webp.length; ) {
    const size = webp.readUInt32LE(at + 4);
    const end = at + 8 + size + (size % 2);
    if (webp.toString("ascii", at, at + 4) === "VP8 ") return webp.subarray(at, end);
    at = end;
  }
  throw new Error("a frame is not a lossy WebP");
}

const le = (value, bytes) => {
  const out = Buffer.alloc(bytes);
  out.writeUIntLE(value, 0, bytes);
  return out;
};
const chunk = (name, body) => Buffer.concat([Buffer.from(name, "ascii"), le(body.length, 4), body, body.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);

/** An animated WebP from frames that are each a lossy WebP of one size: the VP8X header with the animation flag, ANIM (loop for ever) and an ANMF chunk for each frame. */
export function animated(frames, w, h, duration) {
  const anmf = frames.map((frame) => chunk("ANMF", Buffer.concat([le(0, 3), le(0, 3), le(w - 1, 3), le(h - 1, 3), le(duration, 3), Buffer.from([0]), chunkOf(frame)])));
  const body = Buffer.concat([Buffer.from("WEBP", "ascii"), chunk("VP8X", Buffer.concat([Buffer.from([0x02, 0, 0, 0]), le(w - 1, 3), le(h - 1, 3)])), chunk("ANIM", Buffer.concat([Buffer.alloc(4, 255), le(0, 2)])), ...anmf]);
  return Buffer.concat([Buffer.from("RIFF", "ascii"), le(body.length, 4), body]);
}
