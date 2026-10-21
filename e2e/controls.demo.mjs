// No control of any demo page is left in the browser's own style: every visible button and select has been styled (a border, a ground or a shape of its own), in light and in dark, on the desk and on a phone.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

const PAGES = ["", "stadiums.html", "stadiums.html?view=3d", "district.html", "district.html?view=3d", "halls.html", "judging.html", "boards.html", "flythrough.html", "venues.html", "venues.html?view=3d", "embed.html", "api.html"];

/** The visible buttons and selects that still look as the browser draws them: the same border, ground and corners as a fresh, unstyled control of the same kind. */
async function unstyled(page) {
  return page.evaluate(() => {
    const look = (el) => {
      const s = getComputedStyle(el);
      return [s.borderTopStyle, s.borderTopWidth, s.borderTopColor, s.backgroundColor, s.borderTopLeftRadius, s.backgroundImage].join("|");
    };
    const probes = new Map();
    const probe = (tag) => {
      if (!probes.has(tag)) {
        const el = document.createElement(tag);
        el.style.cssText = "all: revert; position: absolute; visibility: hidden";
        document.body.append(el);
        probes.set(tag, look(el));
        el.remove();
      }
      return probes.get(tag);
    };
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
    };
    return [...document.querySelectorAll("button, select")].filter((el) => visible(el) && look(el) === probe(el.tagName.toLowerCase())).map((el) => `${el.tagName.toLowerCase()}${el.id === "" ? "" : `#${el.id}`}${el.className === "" || typeof el.className !== "string" ? "" : `.${el.className.split(" ")[0]}`} "${(el.textContent ?? "").trim().slice(0, 30)}" in ${el.parentElement?.id || el.parentElement?.className || el.parentElement?.tagName}`);
  });
}

for (const scheme of ["light", "dark"]) {
  for (const path of PAGES) {
    test(`${path === "" ? "the home page" : path} has no control in the browser's own style (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await serve(page);
      await page.goto(`http://kyogijo.test/${path}`);
      await page.waitForSelector("svg.kyogijo, .ky-turn", { timeout: 4000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      // Shut groups hide some controls: open them all.
      await page.locator("details").evaluateAll((all) => all.forEach((d) => { d.open = true; }));
      expect(await unstyled(page)).toEqual([]);
    });
  }
}
