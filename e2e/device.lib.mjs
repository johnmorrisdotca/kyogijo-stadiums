// What the speed checks per device class measure, and how (e2e/budgets.device.mjs holds the numbers). Nothing here asserts: it opens a page, counts what it holds and times what a step of the turn costs against a reference
// scene on the same machine, with the same CPU slowing.
/* global PointerEvent, performance, MessageChannel */
import { serve } from "./demo.mjs";

export const STAGE = '[data-testid="stage"]';

/**
 * The district page's presets, as the addresses that make them (the page's own `PRESETS`, which e2e/budgets.device.mjs checks this table against, one for one). The query has `venues` and `mode`; the 3D view and the camera are added.
 */
export const PRESETS = {
  pair: "",
  soccer: "venues=bc-place:soccer,rogers-arena",
  alone: "venues=rogers-arena",
  seattlecenter: "venues=climate-pledge-arena",
  sodo: "venues=t-mobile-park:mlb,lumen-field:nfl",
  seattle: "venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city",
  tokyo: "venues=tokyo-dome:mlb,korakuen-hall:boxing",
  tokyokodokan: "venues=tokyo-dome:mlb,korakuen-hall:boxing,kodokan",
  midtown: "venues=madison-square-garden",
  newyork: "venues=madison-square-garden,barclays-center:nba,yankee-stadium:mlb,citi-field:mlb,metlife-stadium:nfl,ubs-arena&mode=city",
  montrealolympic: "venues=olympic-stadium-montreal:mlb",
  montreal: "venues=bell-centre,olympic-stadium-montreal:mlb&mode=city",
};

/** The venues page's 3D view of the busiest arena. */
export const VENUES_PAGE = "venues.html?venue=td-garden&view=3d&viewpoint=broadcast";

/** Slow the page's CPU `rate` times (Chromium's own throttle, through its protocol); 1 leaves it. WebKit has none. */
export async function throttle(page, rate) {
  if (!(rate > 1)) return;
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate });
}

/** Open a page of the demo and wait until its 3D view is up; returns what the page complains of. */
export async function openView(page, address) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/${address}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} .ky-turn[data-mode="3d"]`);
  return errors;
}

/**
 * What the 3D view holds, which does not depend on how fast the machine is: the layers (the floor and every plane), those drawn at the opening view, every element of the page, the memory the layers take (every layer's box times the
 * device's pixel ratio squared, four bytes a pixel, in megabytes, and the biggest one), the share of its size the layers are made at and the tier drawn.
 */
export function holdings(page) {
  return page.evaluate((stage) => {
    const dpr = window.devicePixelRatio;
    const layers = [...document.querySelectorAll(`${stage} .ky-turn-floor, ${stage} .ky-up`)];
    let pixels = 0;
    let biggest = 0;
    for (const el of layers) {
      const area = el.offsetWidth * el.offsetHeight * dpr * dpr;
      pixels += area;
      biggest = Math.max(biggest, area);
    }
    const root = document.querySelector(`${stage} .ky-turn`);
    return {
      planes: layers.length,
      drawn: layers.filter((el) => el.style.display !== "none").length,
      nodes: document.querySelectorAll("*").length,
      mb: (pixels * 4) / 1048576,
      biggestMb: (biggest * 4) / 1048576,
      share: Number(root.dataset.share ?? 1),
      tier: root.dataset.tier,
      dpr,
    };
  }, STAGE);
}

/**
 * A step of the turn as the page has it: a pointer move on the 3D view, timed twice, by the script it runs (`script`) and to the end of the frame it causes (`frame`); the median of `steps`. Pointer moves are what a drag makes, so
 * the page does what it does when a reader turns it.
 */
export function turnCost(page, steps = 30) {
  return page.evaluate(async ({ stage, steps }) => {
    const view = document.querySelector(`${stage} .ky-turn-view`);
    const box = view.getBoundingClientRect();
    const [x0, y0] = [box.left + box.width / 2, box.top + 40];
    const fire = (type, x, y) => view.dispatchEvent(new PointerEvent(type, { pointerId: 5, pointerType: "mouse", button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true }));
    const frame = () => new Promise((done) => requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => done(); c.port2.postMessage(0); }));
    const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
    fire("pointerdown", x0, y0);
    await frame();
    const [script, total] = [[], []];
    let x = x0;
    for (let i = 0; i < steps; i += 1) {
      x += i % 20 < 10 ? 6 : -6;
      const t0 = performance.now();
      fire("pointermove", x, y0 + (i % 8));
      const t1 = performance.now();
      await frame();
      script.push(t1 - t0);
      total.push(performance.now() - t0);
    }
    fire("pointerup", x, y0);
    return { script: median(script), frame: median(total) };
  }, { stage: STAGE, steps });
}

/**
 * The reference scene: a page of its own, in the same browser with the same CPU slowing, of 600 planes in a 3D box that is turned a step at a time, each step writing every plane's depth and hiding the third that faces
 * away, as the view's step does; its cost is timed as `turnCost` is. A view's cost over this is the same on a fast machine and a slow one, a loaded runner and a quiet one, since both are slowed together, which is why the budgets
 * are on that ratio and not on milliseconds.
 */
export async function referenceCost(context, rate, steps = 30) {
  const page = await context.newPage();
  await throttle(page, rate);
  await page.setContent(`<body style="margin:0"><div id="v" style="width:600px;height:400px;perspective:900px"><div id="s" style="width:100%;height:100%;transform-style:preserve-3d">${Array.from({ length: 600 }, (_, i) => `<div style="position:absolute;left:${(i % 30) * 18}px;top:${Math.floor(i / 30) * 18}px;width:60px;height:40px;background:#8a9;transform:translate3d(0,0,${(i % 7) * 6}px) rotateX(${(i % 5) * 9}deg)"></div>`).join("")}</div></div></body>`);
  const cost = await page.evaluate(async (steps) => {
    const s = document.getElementById("s");
    const planes = [...s.children];
    const frame = () => new Promise((done) => requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => done(); c.port2.postMessage(0); }));
    const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
    await frame();
    const [script, total] = [[], []];
    for (let i = 0; i < steps; i += 1) {
      const t0 = performance.now();
      s.style.transform = `rotateY(${i * 3}deg) rotateX(55deg)`;
      for (let k = 0; k < planes.length; k += 1) {
        planes[k].style.zIndex = String((k * 7 + i * 13) % 600);
        planes[k].style.display = (k + i) % 3 === 0 ? "none" : "";
      }
      const t1 = performance.now();
      await frame();
      script.push(t1 - t0);
      total.push(performance.now() - t0);
    }
    return { script: median(script), frame: median(total) };
  }, steps);
  await page.close();
  return cost;
}
