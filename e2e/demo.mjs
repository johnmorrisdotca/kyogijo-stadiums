// What every demo test starts from: the built demo in `site/`, served to the page without a port, and the helpers a
// test plays with.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect } from "@playwright/test";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

/** Serve `site/` to a page at http://kyogijo.test/. */
export async function serve(page) {
  if (!existsSync(join(site, "index.html"))) throw new Error("site/ is not built: run `pnpm site` first (`pnpm test:demo` does)");
  await page.route("http://kyogijo.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" });
  });
}

/** Collect anything the page complains of. */
function listen(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  return errors;
}

export const at = (id) => `[data-testid="${id}"]`;
export const svg = (page) => page.locator(`${at("stage")} svg.kyogijo`);

/** Open the demo with a query and wait until its surface is drawn; returns what the page complains of. */
export async function open(page, query = "") {
  const errors = listen(page);
  await serve(page);
  await page.goto(`http://kyogijo.test/${query}`);
  await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
  return errors;
}

/** Nothing the demo drew sits beyond the page's own width. */
export async function noSidewaysScroll(page) {
  const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(client);
}

/** Tap, as a finger would where the page is touched and as a mouse where it is not. */
export async function tap(page, selector, testInfo) {
  const target = typeof selector === "string" ? page.locator(selector).first() : selector;
  await target.scrollIntoViewIfNeeded();
  if (testInfo.project.use.hasTouch === true) await target.tap();
  else await target.click();
}

/**
 * Choose a surface in the playground's picker as a reader does: its kind, then its sport, then (for a sport of several surfaces, such as the
 * football fields) the surface itself. `testInfo` taps as a finger would on a touch screen.
 */
export async function pickSurface(page, sport, testInfo) {
  const picker = page.locator(at("sport"));
  const chip = picker.locator(`${at("surface-sports")} [data-surfaces~="${sport}"]`);
  const press = (target) => (testInfo === undefined ? target.click() : tap(page, target, testInfo));
  const kind = picker.locator(`${at("surface-kinds")} [data-kind="${await chip.getAttribute("data-kind")}"]`);
  if ((await kind.getAttribute("aria-checked")) !== "true") await press(kind);
  await press(chip);
  if ((await chip.getAttribute("data-surfaces")).includes(" ")) await press(picker.locator(`${at("surface-variants")} [data-value="${sport}"]`));
}
/** The surface the picker has chosen: the sport's chip, or for a sport of several surfaces the surface's own in the row under it (its `data-value` is the key). */
export const chosenSurface = (page) => page.locator(`${at("sport")} [role="radio"][aria-checked="true"][data-value]`);

/** Open every group of controls (two are shut when the page opens). */
export const openGroups = (page) => page.locator("details.group").evaluateAll((all) => all.forEach((d) => { d.open = true; }));
