// The renderers held to a real browser: the scene's colours, widths and fonts against what Chromium works out for the same SVG (`getComputedStyle`), and a canvas drawn by
// `drawToCanvas` against the same SVG drawn by the browser as an image. Chromium only: the canvas and the filters it is held to are the browser's own. The page imports the
// compiled library that `pnpm site` copies to `site/dist`, and no port is opened.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

test.skip(({ browserName }) => browserName !== "chromium", "the canvas and the style are held to Chromium's");
test.describe.configure({ timeout: 120_000 });

/** Drawings in the page: every sport as a score, tall and bare and as a strip, then layers of each kind and two charts. All without a logo, which an image of an SVG cannot load. */
const DRAWINGS = `
  const { SPORTS, drawKyogijo } = await import("/dist/index.js");
  const { nbaShotChart, nflPassChart } = await import("/dist/charts-entry.js");
  const { nbaShots, nflPasses } = await import("/charts-data.js");
  const { shotMap, shotHeat, sprayChart } = await import("/layers-data.js");
  const game = { away: { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" }, home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" }, status: "final-ot", competition: "Cup Final, Game 7", date: "June 24", id: "e2e" };
  const drawings = [];
  for (const sport of SPORTS) {
    drawings.push({ name: sport + " score", svg: drawKyogijo({ sport, ...game }) });
    drawings.push({ name: sport + " tall", svg: drawKyogijo({ sport, orientation: "portrait", id: "e2e" }) });
    drawings.push({ name: sport + " badge", svg: drawKyogijo({ sport, ...game, size: "badge" }) });
  }
  drawings.push({ name: "hardwood floor", svg: drawKyogijo({ sport: "nba", id: "e2e", court: { hardwood: true, baselineText: ["North", "South"], sidelineText: "League" } }) });
  drawings.push({ name: "hardwood floor, plain, tall, with a score", svg: drawKyogijo({ sport: "nba", ...game, orientation: "portrait", court: { hardwood: { detail: "plain" } } }) });
  drawings.push({ name: "crowd round a pitch", svg: drawKyogijo({ sport: "soccer", id: "e2e", crowd: { tifo: "both" }, leftColor: "#1d4f91", rightColor: "#b5452c" }) });
  drawings.push({ name: "crowd in a ballpark, thumbnail", svg: drawKyogijo({ sport: "mlb", id: "e2e", park: "fenway-park", crowd: { detail: "plain" } }) });
  drawings.push({ name: "rink with shots", svg: drawKyogijo({ sport: "nhl", id: "e2e", layers: shotMap() }) });
  drawings.push({ name: "rink heat map", svg: drawKyogijo({ sport: "nhl", id: "e2e", layers: shotHeat(500) }) });
  drawings.push({ name: "spray chart", svg: drawKyogijo({ sport: "mlb", id: "e2e", layers: sprayChart() }) });
  drawings.push({ name: "nba chart", svg: nbaShotChart(nbaShots(120), { league: 46, id: "e2e" }).draw() });
  drawings.push({ name: "nfl chart", svg: nflPassChart(nflPasses(), { los: 62, id: "e2e" }).draw() });
`;

for (const scheme of ["light", "dark"]) {
  test(`the scene's style is the browser's, ${scheme}: fill, stroke, widths, opacity, dashes, fonts and text anchors of every painted element`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    await serve(page);
    await page.goto("http://kyogijo.test/docs/");
    const result = await page.evaluate(
      async ({ DRAWINGS, scheme }) => {
        const { sceneFromSvg } = await import("/dist/scene-entry.js");
        const make = new Function(`return (async () => { ${DRAWINGS}; return drawings; })()`);
        const drawings = await make();
        const colour = (value) => {
          const c = document.createElement("canvas").getContext("2d");
          c.fillStyle = "#010203";
          c.fillStyle = value;
          return c.fillStyle;
        };
        const out = [];
        for (const d of drawings) {
          const holder = document.createElement("div");
          holder.innerHTML = d.svg;
          document.body.append(holder);
          const svg = holder.firstElementChild;
          const scene = sceneFromSvg(d.svg, { theme: scheme });
          const painted = [...svg.querySelectorAll("rect,circle,ellipse,line,polygon,polyline,path,text,tspan,image")].filter((e) => !e.closest("defs,clipPath,pattern") && !(e.tagName === "text" && e.querySelector("tspan")));
          const wrong = [];
          if (painted.length !== scene.items.length) wrong.push(`${painted.length} elements, ${scene.items.length} items`);
          painted.slice(0, scene.items.length).forEach((e, i) => {
            const item = scene.items[i];
            const cs = getComputedStyle(e);
            let opacity = 1;
            for (let up = e; up !== null && up !== holder; up = up.parentElement) opacity *= Number(getComputedStyle(up).opacity);
            const say = (what, got, want) => wrong.push(`#${i} ${item.class}: ${what} ${got} / ${want}`);
            if (item.kind === "image") return;
            const paint = (value, browser, what) => {
              if (typeof value !== "string") return;
              if (value === "none") {
                if (browser !== "none") say(what, browser, value);
              } else if (!browser.startsWith("url") && colour(browser) !== colour(value)) say(what, browser, value);
            };
            paint(item.style.fill, cs.fill, "fill");
            paint(item.style.stroke, cs.stroke, "stroke");
            if (item.style.stroke !== "none" && Math.abs(parseFloat(cs.strokeWidth) - item.style.strokeWidth) > 1e-3 * Math.max(1, item.style.strokeWidth)) say("stroke-width", cs.strokeWidth, item.style.strokeWidth);
            if (Math.abs(opacity - item.style.opacity) > 1e-6) say("opacity", opacity, item.style.opacity);
            if (Math.abs(Number(cs.fillOpacity) - item.style.fillOpacity) > 1e-6) say("fill-opacity", cs.fillOpacity, item.style.fillOpacity);
            if (item.style.stroke !== "none") {
              if (cs.strokeLinejoin !== item.style.lineJoin) say("linejoin", cs.strokeLinejoin, item.style.lineJoin);
              if (cs.strokeLinecap !== item.style.lineCap) say("linecap", cs.strokeLinecap, item.style.lineCap);
              const dashes = cs.strokeDasharray === "none" ? undefined : cs.strokeDasharray.replace(/px/g, "").split(/[ ,]+/).map(Number);
              if (JSON.stringify(dashes?.map((v) => Math.round(v * 1e3))) !== JSON.stringify(item.style.dash?.map((v) => Math.round(v * 1e3)))) say("dash", cs.strokeDasharray, item.style.dash);
            }
            if (item.kind === "text") {
              if (Math.abs(parseFloat(cs.fontSize) - item.fontSize) > 1e-3) say("font-size", cs.fontSize, item.fontSize);
              if (Number(cs.fontWeight) !== item.fontWeight) say("font-weight", cs.fontWeight, item.fontWeight);
              if (cs.textAnchor !== item.anchor) say("text-anchor", cs.textAnchor, item.anchor);
            }
          });
          holder.remove();
          out.push({ name: d.name, items: scene.items.length, wrong: wrong.slice(0, 5) });
        }
        return out;
      },
      { DRAWINGS, scheme },
    );
    expect(result.length).toBeGreaterThan(40);
    for (const one of result) expect(one.wrong, `${one.name} (${one.items} items)`).toEqual([]);
    await context.close();
  });
}

test("a canvas drawn by drawToCanvas differs from the browser's own drawing of the SVG in a few pixels only: the letters' edges", async ({ browser }) => {
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  await serve(page);
  await page.goto("http://kyogijo.test/docs/");
  const result = await page.evaluate(async (DRAWINGS) => {
    const { drawToCanvas } = await import("/dist/canvas-entry.js");
    const make = new Function(`return (async () => { ${DRAWINGS}; return drawings; })()`);
    const drawings = await make();
    const out = [];
    for (const theme of ["light", "dark"]) {
      for (const d of drawings) {
        // The theme is the drawing's own (`data-theme`), which an SVG used as an image reads without a page round it.
        const svg = d.svg.replace(/^<svg /, `<svg data-theme="${theme}" `);
        const [, , w, h] = /viewBox="([^"]+)"/.exec(svg)[1].split(" ").map(Number);
        const width = 600;
        const height = Math.round((width * h) / w);
        const image = new Image();
        const url = URL.createObjectURL(new Blob([svg.replace(/^<svg /, `<svg width="${width}" height="${height}" `)], { type: "image/svg+xml" }));
        await new Promise((done, fail) => {
          image.onload = done;
          image.onerror = () => fail(new Error(`${d.name} did not load`));
          image.src = url;
        });
        const a = document.createElement("canvas");
        a.width = width;
        a.height = height;
        const ca = a.getContext("2d");
        ca.fillStyle = "#fff";
        ca.fillRect(0, 0, width, height);
        ca.drawImage(image, 0, 0, width, height);
        const b = document.createElement("canvas");
        b.width = width;
        b.height = height;
        const cb = b.getContext("2d");
        cb.fillStyle = "#fff";
        cb.fillRect(0, 0, width, height);
        drawToCanvas(cb, svg, { width, theme });
        const pa = ca.getImageData(0, 0, width, height).data;
        const pb = cb.getImageData(0, 0, width, height).data;
        let far = 0;
        for (let i = 0; i < pa.length; i += 4) if (Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2])) > 48) far += 1;
        out.push({ name: `${d.name}, ${theme}`, far: far / (width * height) });
      }
    }
    return out;
  }, DRAWINGS);
  expect(result.length).toBeGreaterThan(80);
  const sorted = result.map((one) => one.far).sort((x, y) => x - y);
  expect(sorted[Math.floor(sorted.length / 2)], "the median drawing").toBeLessThan(0.015);
  for (const one of result) expect(one.far, one.name).toBeLessThan(0.05);
  await context.close();
});
