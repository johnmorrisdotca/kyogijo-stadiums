// The tournament layouts page: a preset, a hall, the stadium switched on and off, the fit said in words, light and dark, Japanese, and nothing wider than the screen.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, serve, tap } from "./demo.mjs";

async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://kyogijo.test/halls.html${query}`);
  await page.waitForSelector('body[data-ready="true"] svg.kyogijo');
  return errors;
}

test("a layout is drawn to scale and the stadium is off until it is switched on", async ({ page }) => {
  const errors = await open(page, "?preset=curling-1x4&venue=nhl-ice-pad");
  const stage = page.locator(at("stage"));
  await expect(stage.locator("svg.kyogijo")).toHaveAttribute("data-layout", "curling-1x4");
  await expect(stage.locator(".ky-crowd")).toHaveCount(0);
  await expect(page.locator("#fit")).toContainText("it fits");
  await page.locator("#stadium").check();
  await expect(stage.locator(".ky-crowd")).toHaveCount(1);
  await expect(stage.locator("svg.kyogijo")).toHaveAttribute("data-stadium", "on");
  await page.locator("#stadium").uncheck();
  await expect(stage.locator(".ky-crowd")).toHaveCount(0);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

test("a layout that does not fit says so, and the picture shows where it hangs over", async ({ page }) => {
  await open(page, "?preset=pickleball-4x4&venue=copper-box-arena");
  await expect(page.locator("#fit")).toContainText("does not fit");
  await expect(page.locator("#fit")).toHaveAttribute("data-fit", "false");
  await expect(page.locator(`${at("stage")} .ky-mu-over`)).toHaveCount(1);
  await page.locator("#venue").selectOption("");
  await expect(page.locator("#fit")).not.toContainText("does not fit");
});

test("the choices change the grid, the places and the names, and the table says the same", async ({ page }) => {
  await open(page, "?preset=tabletennis-4");
  const stage = page.locator(at("stage"));
  await expect(stage.locator("[data-cell]")).toHaveCount(4);
  await page.locator("#columns").fill("3");
  await page.locator("#columns").dispatchEvent("change");
  await expect(stage.locator("[data-cell]")).toHaveCount(6);
  await page.locator("#slots").uncheck();
  await expect(stage.locator(".ky-mu-slot")).toHaveCount(0);
  await page.locator("#labels").uncheck();
  await expect(stage.locator(".ky-mu-label")).toHaveCount(0);
  await page.locator("details summary").click();
  await expect(page.locator("#table table")).toContainText("Table 6");
});

test("it follows light and dark and speaks Japanese", async ({ page }) => {
  await open(page, "?preset=judo-1x3&lang=ja");
  await expect(page.locator("h1")).toHaveText("大会向けレイアウト");
  await expect(page).toHaveTitle("競技場 Kyogijo Stadiums：大会向けレイアウト");
  await expect(page.locator("#controls")).toHaveAttribute("aria-label", "レイアウトの選択");
  await expect(page.locator("#event")).toContainText("バクー");
  await expect(page.locator(`${at("stage")} svg`)).toContainText("第1試合場");
  await page.locator("#theme").selectOption("dark");
  await expect(page.locator(`${at("stage")} svg.kyogijo`)).toHaveAttribute("data-theme", "dark");
  await page.locator("#language").selectOption("en");
  await expect(page.locator("h1")).toHaveText("Tournament layouts");
  await expect(page).toHaveTitle("Kyogijo Stadiums: tournament layouts");
  await expect(page.locator("#controls")).toHaveAttribute("aria-label", "Layout choices");
});

test("the main demo leads to the layouts: a link in its header, and under a sport that has layouts a link that chooses its preset; the page leads back", async ({ page }) => {
  await serve(page);
  await page.goto("http://kyogijo.test/?sport=judo&lang=en&help=off");
  await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
  await expect(page.locator('header nav a[href="halls.html"]')).toHaveText("Tournament layouts");
  const link = page.locator(at("hall-link"));
  await expect(link).toBeVisible();
  await expect(link).toHaveText("See it as a tournament floor");
  await expect(link).toHaveAttribute("href", "halls.html?preset=judo-1x3");
  // A sport with no layout has no link.
  await page.goto("http://kyogijo.test/?sport=nhl&lang=en&help=off");
  await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
  await expect(page.locator("#hall-link")).toBeHidden();
  // The link in Japanese carries the language, and the layouts page leads back to the demo with the sport of its layout.
  await page.goto("http://kyogijo.test/?sport=tabletennis&lang=ja&help=off");
  await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
  await expect(page.locator(at("hall-link"))).toHaveAttribute("href", "halls.html?preset=tabletennis-4&lang=ja");
  await page.locator(at("hall-link")).click();
  await page.waitForSelector('body[data-ready="true"] svg.kyogijo');
  await expect(page.locator("svg.kyogijo")).toHaveAttribute("data-layout", "tabletennis-4");
  await expect(page.locator(at("back"))).toHaveAttribute("href", "./?sport=tabletennis&lang=ja");
  await page.locator("#language").selectOption("en");
  await expect(page.locator(at("back"))).toHaveText("Back to the Kyogijo Stadiums demo");
  await expect(page.locator(at("back"))).toHaveAttribute("href", "./?sport=tabletennis");
  await page.locator(at("back")).click();
  await page.waitForSelector(`${at("stage")}[data-ready="true"] svg.kyogijo`);
  expect(new URL(page.url()).searchParams.get("sport")).toBe("tabletennis");
  await noSidewaysScroll(page);
});

// ---- The 3D view of a layout: the same view the main demo has, over the layout's floor. ----
const STAGE = at("stage");
const turn = (page) => page.locator(`${STAGE} .ky-turn`);
const floorMatrix = (page) => page.locator(`${STAGE} .ky-turn-floor`).evaluate((el) => el.style.transform);
/** The area the floor covers on the screen, as the browser has drawn its matrix (perspective included). */
const floorArea = (page) =>
  page.locator(`${STAGE} .ky-turn-floor`).evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    const w = Number.parseFloat(el.style.width) || el.offsetWidth;
    const h = Number.parseFloat(el.style.height) || el.offsetHeight;
    const p = [[0, 0], [w, 0], [w, h], [0, h]].map(([x, y]) => {
      const q = m.transformPoint(new DOMPoint(x, y));
      return [q.x / q.w, q.y / q.w];
    });
    return Math.abs(p.reduce((sum, a, i) => sum + a[0] * p[(i + 1) % 4][1] - p[(i + 1) % 4][0] * a[1], 0)) / 2;
  });

test("opens in 3D from the address, with the tables on legs, the nets, the surrounds and the scoreboard standing on the floor", async ({ page }) => {
  const errors = await open(page, "?preset=tabletennis-4&view=3d");
  expect(errors).toEqual([]);
  await expect(page.locator("#view")).toHaveValue("3d");
  await expect(turn(page)).toHaveAttribute("data-mode", "3d");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await expect(view).toHaveAttribute("aria-roledescription", "3D view");
  await expect(view).toHaveAccessibleName(/Table tennis, four areas/);
  await expect(page.locator(`${STAGE} .ky-turn-floor svg.kyogijo`)).toHaveAttribute("data-layout", "tabletennis-4");
  for (const n of [1, 2, 3, 4]) {
    await expect(page.locator(`${STAGE} [data-part="c${n}-net"]`)).toHaveCount(1);
    await expect(page.locator(`${STAGE} [data-part="c${n}-table-top"]`)).toHaveCount(1);
  }
  await expect(page.locator(`${STAGE} .ky-up-leg`)).toHaveCount(32);
  await expect(page.locator(`${STAGE} .ky-up-surround`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part="scoreboard"]`)).toHaveCount(1);
  // The roof is for the stadium, and the stadium is not on.
  await expect(page.locator("#roof-row")).toBeHidden();
  await expect(page.locator(`${STAGE} .ky-up-seats`)).toHaveCount(0);
  // Nothing of it needs the browser's own 3D context, and the flat drawing's text alternative is the same table.
  const nested = await page.locator(`${STAGE}, ${STAGE} *`).evaluateAll((all) => all.filter((el) => getComputedStyle(el).transformStyle === "preserve-3d").length);
  expect(nested).toBe(0);
  await noSidewaysScroll(page);
});

test("the view switch goes to 3D and back, keeps the choices, and the address follows", async ({ page }) => {
  await open(page, "?preset=badminton-1x4");
  await expect(turn(page)).toHaveCount(0);
  await page.locator("#view").selectOption("3d");
  await expect(turn(page)).toHaveAttribute("data-mode", "3d");
  expect(new URL(page.url()).searchParams.get("view")).toBe("3d");
  // A court turned across the layout has its net along the layout.
  await expect(page.locator(`${STAGE} [data-part="c4-net"]`)).toHaveCount(1);
  await page.locator("#columns").fill("3");
  await page.locator("#columns").dispatchEvent("change");
  await expect(page.locator(`${STAGE} [data-part="c3-net"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part="c4-net"]`)).toHaveCount(0);
  // The view stays where it was put while the layout changes.
  await page.locator("#view").selectOption("flat");
  await expect(turn(page)).toHaveCount(0);
  await expect(page.locator(`${at("stage")} > svg.kyogijo`)).toHaveAttribute("data-layout", "badminton-1x4");
  expect(new URL(page.url()).searchParams.get("view")).toBeNull();
});

test("has the controls of the 3D view: four viewpoints that follow the address, turn, tilt, zoom, reset and the auto-turn", async ({ page }, testInfo) => {
  await open(page, "?preset=tabletennis-4&view=3d");
  const bar = page.locator(`${STAGE} .ky-turn-controls`);
  const sizes = await bar.locator("button").evaluateAll((all) => all.map((b) => [Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height)]));
  // Four viewpoints, six moves, the reset, the auto-turn and Reverse: every one a finger wide.
  expect(sizes.length).toBe(13);
  for (const [w, h] of sizes) {
    expect(w).toBeGreaterThanOrEqual(44);
    expect(h).toBeGreaterThanOrEqual(44);
  }
  await expect(bar.getByRole("button", { name: "Overhead" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Broadcast" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "End-on" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Low corner" })).toHaveAttribute("aria-pressed", "true");
  const first = await floorMatrix(page);
  await tap(page, bar.getByRole("button", { name: "End-on" }), testInfo);
  await expect(turn(page)).toHaveAttribute("data-preset", "end");
  expect(await floorMatrix(page)).not.toBe(first);
  expect(new URL(page.url()).searchParams.get("viewpoint")).toBe("end");
  // The view of the address opens on the viewpoint it names.
  await open(page, "?preset=tabletennis-4&view=3d&viewpoint=broadcast");
  await expect(turn(page)).toHaveAttribute("data-preset", "broadcast");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await view.focus();
  const before = await floorMatrix(page);
  await page.keyboard.press("ArrowLeft");
  await expect(turn(page)).toHaveAttribute("data-preset", "custom");
  expect(await floorMatrix(page)).not.toBe(before);
  await page.keyboard.press("+");
  // Reset puts the view back where it opened: on the viewpoint the address named.
  await tap(page, page.locator(`${STAGE} .ky-turn-controls`).getByRole("button", { name: "Reset the view" }), testInfo);
  await expect(turn(page)).toHaveAttribute("data-preset", "broadcast");
  // Nothing turns until Play; Play turns the view of the layout, and pauses.
  await tap(page, page.locator(`${STAGE} button[data-act="play"]`), testInfo);
  await expect(page.locator(`${STAGE} button[data-act="play"]`)).toHaveAttribute("aria-pressed", "true");
  const turning = await floorMatrix(page);
  await expect.poll(() => floorMatrix(page)).not.toBe(turning);
  await tap(page, page.locator(`${STAGE} button[data-act="play"]`), testInfo);
  await expect(page.locator(`${STAGE} button[data-act="play"]`)).toHaveAttribute("aria-pressed", "false");
});

test("a layout keeps its size as it goes once round and the whole floor stays in the view, with and without the stadium, light and dark", async ({ page }) => {
  for (const query of ["preset=tabletennis-8&theme=light", "preset=tabletennis-4&stadium=on&theme=dark", "preset=curling-1x4&theme=light", "preset=judo-1x3&theme=dark", "preset=badminton-1x4&stadium=on&theme=light"]) {
    await open(page, `?${query}&view=3d`);
    await page.locator(`${STAGE} .ky-turn-view`).focus();
    const areas = [];
    for (let i = 0; i < 60; i += 1) {
      areas.push(await floorArea(page));
      // The floor's corners are inside the view (a 1 px slack for the rounding of the box).
      const inside = await page.evaluate((stage) => {
        const v = document.querySelector(`${stage} .ky-turn-view`).getBoundingClientRect();
        const f = document.querySelector(`${stage} .ky-turn-floor`).getBoundingClientRect();
        return f.left >= v.left - 1 && f.right <= v.right + 1 && f.top >= v.top - 1 && f.bottom <= v.bottom + 1;
      }, STAGE);
      expect(inside, `${query} turn ${i}`).toBe(true);
      await page.keyboard.press("ArrowLeft");
    }
    expect(Math.max(...areas) / Math.min(...areas), query).toBeLessThan(1.02);
    const step = Math.max(...areas.map((a, i) => Math.max(a, areas[(i + 1) % 60]) / Math.min(a, areas[(i + 1) % 60])));
    expect(step, query).toBeLessThan(1.01);
  }
});

test("a table's legs stay under its top whichever way the layout is turned, each table by itself", async ({ page }) => {
  await open(page, "?preset=tabletennis-4&view=3d&viewpoint=broadcast");
  await page.locator(`${STAGE} .ky-turn-view`).focus();
  for (let i = 0; i < 15; i += 1) {
    const orders = await page.evaluate((stage) => {
      const stack = (selector) => Number(document.querySelector(`${stage} ${selector}`).style.zIndex);
      return [1, 2, 3, 4].map((n) => {
        const parts = [...document.querySelectorAll(`${stage} [data-part^="c${n}-leg-"]`)].map((el) => Number(el.style.zIndex));
        return { top: stack(`[data-part="c${n}-table-top"]`), low: Math.min(...parts), high: Math.max(...parts) };
      });
    }, STAGE);
    // Some legs of each table are behind its top and some in front of it, whichever way it is turned.
    for (const z of orders) {
      expect(z.low, `turn ${i}`).toBeLessThan(z.top);
      expect(z.high, `turn ${i}`).toBeGreaterThan(z.top);
    }
    for (let k = 0; k < 5; k += 1) await page.keyboard.press("ArrowLeft");
  }
});

test("the stadium round the floor stands up in 3D, its roof is a toggle, and both are in the address", async ({ page }) => {
  await open(page, "?preset=tabletennis-4&view=3d&stadium=on");
  await expect(page.locator("#roof-row")).toBeVisible();
  await expect(page.locator(`${STAGE} .ky-up-seats`).first()).toBeAttached();
  expect(await page.locator(`${STAGE} .ky-up-seats`).count()).toBeGreaterThan(30);
  await expect(page.locator(`${STAGE} .ky-up-roof`)).toHaveCount(0);
  await page.locator("#roof").check();
  expect(await page.locator(`${STAGE} .ky-up-roof`).count()).toBeGreaterThan(0);
  expect(new URL(page.url()).searchParams.get("roof")).toBe("1");
  await page.locator("#stadium").uncheck();
  await expect(page.locator(`${STAGE} .ky-up-seats`)).toHaveCount(0);
  await expect(page.locator("#roof-row")).toBeHidden();
  expect(new URL(page.url()).searchParams.get("roof")).toBeNull();
});

test("the stadium round the floor has LED boards on request: ribbons round it in the plan and in 3D, none over the middle (the layout has its own scoreboards), and the address keeps them", async ({ page }) => {
  await open(page, "?preset=tabletennis-4");
  await expect(page.locator("#boards-row")).toBeHidden();
  await page.locator("#stadium").check();
  await expect(page.locator("#boards-row")).toBeVisible();
  await expect(page.locator(`${STAGE} svg .ky-cr-ribbon`)).toHaveCount(0);
  await page.locator("#boards").check();
  await expect(page.locator(`${STAGE} svg .ky-cr-ribbon`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg .ky-cr-board`)).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("boards")).toBe("1");
  await page.goto("http://kyogijo.test/halls.html?preset=tabletennis-4&view=3d&stadium=on&boards=1");
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(page.locator("#boards")).toBeChecked();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} .ky-up-hung-board`)).toHaveCount(0);
  await page.locator("#boards").uncheck();
  await expect(page.locator(`${STAGE} .ky-up-ribbon`)).toHaveCount(0);
});

test("the stadium round the floor can be lit with a preset, in the plan and in 3D, with a colour of light over it, and the address keeps it", async ({ page }) => {
  await open(page, "?preset=tabletennis-4");
  await expect(page.locator("#lighting-row")).toBeHidden();
  await page.locator("#stadium").check();
  await expect(page.locator("#lighting-row")).toBeVisible();
  await page.locator("#lighting").selectOption("game");
  await expect(page.locator(`${STAGE} svg .ky-half`)).toHaveCount(1);
  await page.locator("#lighting").selectOption("lightsDown");
  await page.locator("#wash").selectOption("blue");
  await expect(page.locator(`${STAGE} svg .ky-down`)).toHaveCount(1);
  const params = new URL(page.url()).searchParams;
  expect([params.get("lighting"), params.get("wash")]).toEqual(["lightsDown", "blue"]);
  await page.goto("http://kyogijo.test/halls.html?preset=tabletennis-4&view=3d&stadium=on&lighting=concert");
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-lighting", "concert");
  await expect(page.locator(`${STAGE} [data-part="light-wash"]`)).toHaveCount(1);
  await page.locator("#lighting").selectOption("off");
  await expect(page.locator(`${STAGE} .ky-turn`)).not.toHaveAttribute("data-lighting", /.*/);
});

test("the 3D view of a layout speaks Japanese, and says what stands on it", async ({ page }) => {
  await open(page, "?preset=tabletennis-4&view=3d&lang=ja");
  await expect(page.locator(`${STAGE} .ky-turn-view`)).toHaveAttribute("aria-roledescription", "3D表示");
  await expect(page.locator(`${STAGE} .ky-turn-controls`).getByRole("button", { name: "真上" })).toBeVisible();
  await expect(page.locator(`${STAGE} .ky-turn-help`)).toContainText("競技エリアのフェンス");
  await expect(page.locator("#l-view")).toHaveText("表示");
  await page.locator("#language").selectOption("en");
  await expect(page.locator(`${STAGE} .ky-turn-controls`).getByRole("button", { name: "Overhead" })).toBeVisible();
});

test("the 3D view of a layout fits a phone: nothing beyond the page's width", async ({ page }) => {
  await open(page, "?preset=pickleball-2x4&view=3d&stadium=on");
  await noSidewaysScroll(page);
  const box = await page.locator(`${STAGE} .ky-turn-view`).boundingBox();
  expect(box.width).toBeGreaterThan(300);
});

test("the places are dressed with a sample event unless the box is cleared, and the address keeps the choice", async ({ page }) => {
  const errors = await open(page, "?preset=judo-1x3");
  const stage = page.locator(at("stage"));
  // Sample content is the default: the event's line on the mats and the boards, an emblem in each logo place, no dashed place on the floor.
  await expect(page.locator("#sample")).toBeChecked();
  await expect(stage.locator(".ky-mu-sample-text").first()).toContainText("Kyogijo Open 2026");
  expect(await stage.locator(".ky-mu-emblems").count()).toBeGreaterThan(0);
  await expect(stage.locator(".ky-mu-slot")).toHaveCount(0);
  // Cleared: the empty places come back, and the address says so.
  await page.locator("#sample").uncheck();
  await expect(stage.locator(".ky-mu-slot").first()).toBeAttached();
  await expect(stage.locator(".ky-mu-sample-text")).toHaveCount(0);
  expect(new URL(page.url()).searchParams.get("sample")).toBe("0");
  // The address alone brings the empty places, and Japanese has its own invented event.
  await open(page, "?preset=judo-1x3&sample=0");
  await expect(page.locator("#sample")).not.toBeChecked();
  await expect(page.locator(`${at("stage")} .ky-mu-slot`).first()).toBeAttached();
  await open(page, "?preset=judo-1x3&lang=ja");
  await expect(page.locator(`${at("stage")} .ky-mu-sample-text`).first()).toContainText("競技場杯");
  expect(errors).toEqual([]);
});

test("the 3D layout waits still and turns while the pointer is over it, and Reverse turns it the other way and is kept in the address as dir=cw", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "?preset=tabletennis-4&view=3d");
  const play = page.locator(`${STAGE} button[data-act="play"]`);
  const reverse = page.locator(`${STAGE} button[data-act="reverse"]`);
  const angle = () => page.locator(`${STAGE} .ky-turn-floor`).evaluate((floor) => {
    const m = new DOMMatrix(getComputedStyle(floor).transform);
    return Math.atan2(m.m12, m.m11);
  });
  const swing = async () => {
    const a = await angle();
    await page.waitForTimeout(700);
    const d = (await angle()) - a;
    return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) < 1e-4 ? 0 : Math.sign(Math.atan2(Math.sin(d), Math.cos(d)));
  };
  await expect(play).toHaveAttribute("aria-pressed", "false");
  expect(await swing()).toBe(0);
  await page.locator(`${STAGE} .ky-turn-view`).hover();
  await expect(play).toHaveAttribute("aria-pressed", "true");
  const way = await swing();
  expect(way).not.toBe(0);
  // Reverse, with the pointer on the buttons: the view is the reader's own now, and the address keeps the way.
  await reverse.click();
  await expect(reverse).toHaveAttribute("aria-pressed", "true");
  expect(page.url()).toContain("dir=cw");
  await page.locator(`${STAGE} .ky-turn-view`).hover();
  expect(await swing()).toBe(-way);
  await page.mouse.move(2, 2);
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await page.goto(page.url());
  await page.waitForSelector(`${STAGE} .ky-turn`);
  await expect(page.locator(`${STAGE} button[data-act="reverse"]`)).toHaveAttribute("aria-pressed", "true");
});
