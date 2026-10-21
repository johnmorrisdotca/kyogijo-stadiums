// A stadium that stages more than one field is one drawing but for its field: the building, the bowl, the crowd, the ground and the frame are the same for every configuration, pixel for pixel, in 2D and in 3D overhead, and the
// seats a configuration closes are the same empty block every time. Rendered in a real browser at one size and compared, with nothing but the field's surround (everything inside the first row) and the closed block left out.
import { expect, test } from "@playwright/test";

import { crowdStands, drawKyogijo } from "../dist/index.js";
import { serve } from "./demo.mjs";

const STADIUMS = [
  ["bc-place", ["cfl", "soccer"]],
  ["lumen-field", ["nfl", "soccer"]],
];
const WIDTH = 960;

/** The path of a rounded rectangle. */
const rrect = (o) => {
  const r = Math.min(o.r, (o.x1 - o.x0) / 2, (o.y1 - o.y0) / 2);
  return `M${o.x0 + r} ${o.y0}H${o.x1 - r}A${r} ${r} 0 0 1 ${o.x1} ${o.y0 + r}V${o.y1 - r}A${r} ${r} 0 0 1 ${o.x1 - r} ${o.y1}H${o.x0 + r}A${r} ${r} 0 0 1 ${o.x0} ${o.y1 - r}V${o.y0 + r}A${r} ${r} 0 0 1 ${o.x0 + r} ${o.y0}Z`;
};

/** What a configuration owns in the venue's frame, as one path (evenodd): the field's surround inside the first row, the closed bands and the closed blocks. */
function ownPath(stands) {
  const [first] = stands.rings;
  const parts = [rrect(first.hole)];
  for (const ring of stands.rings) if (ring.closed === true) parts.push(rrect(ring.region), rrect(ring.hole));
  const blocks = stands.sectors.filter((s) => s.kind === "closed").map((s) => `M${s.points.map(([x, y]) => `${x} ${y}`).join("L")}Z`);
  return { surround: parts[0], closed: parts.slice(1).join(""), blocks: blocks.join("") };
}

/** The pixels of two images that differ, outside a mask (dilated by `grow` pixels); also how many pixels the mask holds. */
async function diff(page, a, b, mask, grow = 3) {
  return page.evaluate(
    async ([x, y, m, g]) => {
      const load = async (data) => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0);
        return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      };
      const [ia, ib, im] = await Promise.all([load(x), load(y), load(m)]);
      const { width, height } = ia;
      // The mask is dark where something is left out; grow it, so that a pixel on the edge of a field or a block is left out too.
      const dark = new Uint8Array(width * height);
      for (let i = 0; i < dark.length; i += 1) dark[i] = im.data[i * 4] < 128 ? 1 : 0;
      const out = new Uint8Array(width * height);
      for (let j = 0; j < height; j += 1) for (let i = 0; i < width; i += 1) if (dark[j * width + i] === 1) for (let dj = -g; dj <= g; dj += 1) for (let di = -g; di <= g; di += 1) { const jj = j + dj; const ii = i + di; if (jj >= 0 && jj < height && ii >= 0 && ii < width) out[jj * width + ii] = 1; }
      let differ = 0;
      let masked = 0;
      let first = null;
      for (let i = 0; i < out.length; i += 1) {
        if (out[i] === 1) { masked += 1; continue; }
        if (ia.data[i * 4] !== ib.data[i * 4] || ia.data[i * 4 + 1] !== ib.data[i * 4 + 1] || ia.data[i * 4 + 2] !== ib.data[i * 4 + 2] || ia.data[i * 4 + 3] !== ib.data[i * 4 + 3]) { differ += 1; first ??= [i % width, Math.floor(i / width)]; }
      }
      return { differ, masked, size: [width, height], first };
    },
    [a.toString("base64"), b.toString("base64"), mask.toString("base64"), grow],
  );
}

const shot = async (page, html) => {
  await page.setContent(`<body style="margin:0;background:#fff"><div id="box" style="width:${WIDTH}px">${html}</div></body>`);
  return page.locator("#box").screenshot();
};

for (const scheme of ["light", "dark"]) {
  for (const [stadium, sports] of STADIUMS) {
    test(`${stadium}: the two configurations are the same drawing but for the field and the closed block, pixel for pixel (2D, ${scheme})`, async ({ page }) => {
      await page.setViewportSize({ width: 1000, height: 900 });
      await page.emulateMedia({ colorScheme: scheme });
      const make = (sport) => drawKyogijo({ sport, stadium, crowd: { real: true } });
      const [svgA, svgB] = sports.map(make);
      // One viewBox, byte for byte.
      const view = (svg) => /viewBox="([^"]+)"/.exec(svg)[1];
      expect(view(svgB)).toBe(view(svgA));
      const [pngA, pngB] = [await shot(page, svgA), await shot(page, svgB)];
      // What a configuration owns, in the venue's frame, drawn in the same viewBox.
      const own = sports.map((sport) => ownPath(crowdStands({ sport, stadium, crowd: { real: true } })));
      const frame = view(svgA);
      // Everything inside the first row, and every closed band and block of either configuration.
      const closed = own.map((o) => o.closed).join("");
      const blocks = own.map((o) => o.blocks).join("");
      const mask = await shot(page, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frame}" width="${WIDTH}"><rect x="-9999" y="-9999" width="20000" height="20000" fill="#fff"/><path d="${own[0].surround}" fill="#000"/><path d="${closed}" fill="#000" fill-rule="evenodd"/><path d="${blocks}" fill="#000"/></svg>`);
      const result = await diff(page, pngA, pngB, mask);
      // The mask leaves out a part of the picture, not all of it, and without it the two do differ (the test sees the field).
      expect(result.masked).toBeGreaterThan(1000);
      expect(result.masked).toBeLessThan(result.size[0] * result.size[1] * 0.4);
      const blank = await shot(page, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frame}" width="${WIDTH}"><rect x="-9999" y="-9999" width="20000" height="20000" fill="#fff"/></svg>`);
      expect((await diff(page, pngA, pngB, blank, 0)).differ).toBeGreaterThan(1000);
      expect(result, JSON.stringify(result)).toMatchObject({ differ: 0 });
      // The closed seats are the same block every time: two renders of the same configuration are the same image.
      const again = await shot(page, make(sports[1]));
      const same = await diff(page, await shot(page, make(sports[1])), again, mask, 0);
      expect(same.differ).toBe(0);
    });
  }
}

/**
 * The pixels of two 3D views that differ, outside what each configuration owns: `owned` is a list of pairs of images of one configuration, as it is and with what is its own (the field, what stands on it, the closed seats) taken out;
 * where a pair differs, the configuration owns the pixel. The mask is grown by `grow` pixels.
 */
async function diffOwned(page, a, b, owned, grow = 3) {
  return page.evaluate(
    async ([x, y, pairs, g]) => {
      const load = async (data) => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0);
        return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      };
      const [ia, ib] = await Promise.all([load(x), load(y)]);
      const { width, height } = ia;
      const own = new Uint8Array(width * height);
      for (const [p, q] of pairs) {
        const [ip, iq] = await Promise.all([load(p), load(q)]);
        for (let i = 0; i < own.length; i += 1) if (ip.data[i * 4] !== iq.data[i * 4] || ip.data[i * 4 + 1] !== iq.data[i * 4 + 1] || ip.data[i * 4 + 2] !== iq.data[i * 4 + 2]) own[i] = 1;
      }
      const out = new Uint8Array(width * height);
      for (let j = 0; j < height; j += 1) for (let i = 0; i < width; i += 1) if (own[j * width + i] === 1) for (let dj = -g; dj <= g; dj += 1) for (let di = -g; di <= g; di += 1) { const jj = j + dj; const ii = i + di; if (jj >= 0 && jj < height && ii >= 0 && ii < width) out[jj * width + ii] = 1; }
      let differ = 0;
      let masked = 0;
      let first = null;
      for (let i = 0; i < out.length; i += 1) {
        if (out[i] === 1) { masked += 1; continue; }
        if (ia.data[i * 4] !== ib.data[i * 4] || ia.data[i * 4 + 1] !== ib.data[i * 4 + 1] || ia.data[i * 4 + 2] !== ib.data[i * 4 + 2]) { differ += 1; first ??= [i % width, Math.floor(i / width)]; }
      }
      return { differ, masked, size: [width, height], first };
    },
    [a.toString("base64"), b.toString("base64"), owned.map(([p, q]) => [p.toString("base64"), q.toString("base64")]), grow],
  );
}

/** A configuration's 3D view from overhead, in a box of one size, as it is and with what is its own taken out. */
async function overhead(page, stadium, sport) {
  await page.evaluate(
    async ([stadium, sport]) => {
      const { mountKyogijoTurn } = await import("/dist/turn-entry.js");
      document.body.innerHTML = '<div id="t" style="width:960px;height:600px"></div>';
      mountKyogijoTurn(document.getElementById("t"), { sport, stadium, crowd: { real: true } }, { preset: "overhead", controls: false, motion: "none" });
    },
    [stadium, sport],
  );
  await page.waitForSelector("#t [data-part]");
  await page.waitForTimeout(300);
  const view = page.locator("#t");
  const normal = await view.screenshot();
  // Take out what the configuration owns: the field, what stands on it, the apron round it (inside the first row) and the closed seats (the polygons painted with the empty seats).
  await page.evaluate(() => {
    const t = document.getElementById("t");
    for (const el of t.querySelectorAll(".ky-surface-group")) el.style.display = "none";
    for (const el of t.querySelectorAll('[data-part^="posts"], [data-part^="pylon"], [data-part^="goal"], [data-part^="flag"], [data-part^="net"], [data-part^="scoreboard"], [data-part^="apron"]')) el.style.display = "none";
    for (const el of t.querySelectorAll('polygon[fill*="-cr-e)"]')) {
      const plane = el.parentElement;
      const mine = [...plane.querySelectorAll("polygon")].filter((p) => p === el || p.classList.contains("ky-cr-shut-veil") || p.previousElementSibling === el || p.nextElementSibling === el);
      for (const p of mine) p.style.display = "none";
    }
  });
  const taken = await view.screenshot();
  return { normal, taken };
}

for (const scheme of ["light", "dark"]) {
  for (const [stadium, sports] of STADIUMS) {
    test(`${stadium}: the two configurations are the same 3D view from overhead but for the field and the closed seats, pixel for pixel (${scheme})`, async ({ page }) => {
      await page.setViewportSize({ width: 1000, height: 700 });
      await page.emulateMedia({ colorScheme: scheme });
      await serve(page);
      await page.goto("http://kyogijo.test/stadiums.html");
      await page.waitForSelector('body[data-ready="true"]');
      const [one, two] = [await overhead(page, stadium, sports[0]), await overhead(page, stadium, sports[1])];
      const result = await diffOwned(page, one.normal, two.normal, [[one.normal, one.taken], [two.normal, two.taken]]);
      expect(result.masked).toBeGreaterThan(1000);
      expect(result.masked).toBeLessThan(result.size[0] * result.size[1] * 0.4);
      const blank = await diffOwned(page, one.normal, two.normal, []);
      expect(blank.differ).toBeGreaterThan(500);
      expect(result, JSON.stringify(result)).toMatchObject({ differ: 0 });
      // The same configuration twice is the same image, closed seats and all.
      const again = await overhead(page, stadium, sports[1]);
      expect((await diffOwned(page, two.normal, again.normal, [], 0)).differ).toBe(0);
    });
  }
}
