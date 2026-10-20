// The judging assignments page: each mat's judges by seat with a name and an ID, in the seat where they fit and in a chart that never cuts a name, in 2D and 3D, on a tablet both ways up, editable, with the state in the
// address and nothing sent anywhere.
import { expect, test } from "@playwright/test";

import { at, noSidewaysScroll, serve } from "./demo.mjs";

const STAGE = at("stage");

async function open(page, query = "") {
  const errors = [];
  const outside = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("request", (request) => !request.url().startsWith("http://kyogijo.test/") && !request.url().startsWith("data:") && outside.push(request.url()));
  await serve(page);
  await page.goto(`http://kyogijo.test/judging.html${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForSelector(`${STAGE} svg.kyogijo, ${STAGE} .ky-turn`);
  return { errors, outside };
}

/** The data of an address: a mat with the five seats. */
const data = (mats) => `d=${encodeURIComponent(JSON.stringify(mats))}`;
const FIVE = [["Aiko Mori", "J-1042"], ["Daniel Okafor", "J-0377"], ["Sofia Lindqvist-Hernandez", "J-2210"], ["Kenji Watanabe", "J-0918"], ["Marta Kowalczyk", "J-1555"]];

test("opens on mat 1 with every judge's name and ID in the chart, nothing sent anywhere and nothing wider than the screen", async ({ page }) => {
  const { errors, outside } = await open(page);
  const svg = page.locator(`${STAGE} svg.kyogijo`);
  await expect(svg).toHaveAttribute("data-judging", "kata");
  await expect(svg).toHaveAttribute("data-chart", "yes");
  await expect(page.locator(`${STAGE} .ky-ju-chart-row`)).toHaveCount(5);
  await expect(page.locator(`${STAGE} .ky-ju-name`).first()).toHaveText("Aiko Mori");
  await expect(page.locator(`${STAGE} .ky-ju-id`).first()).toHaveText("ID J-1042");
  await expect(page.locator("#tabs button")).toHaveText(["Mat 1", "Mat 2", "All mats"]);
  await expect(page.locator('#tabs button[aria-selected="true"]')).toHaveText("Mat 1");
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("every name and ID in the chart is whole: inside its row, inside the picture, however long", async ({ page }) => {
  await open(page, `?${data([{ l: "", o: [["Maximilian Alexander Friedrich von Hohenlohe-Schillingsfürst und Waldenburg zu Bartenstein", "0123456789-0123456789-0123456789-0123456789-0123456789-abcd"], ["Li", "J-1"], ["", ""], ["山田太郎".repeat(8), ""], ["Sofia Lindqvist-Hernandez", "J-2210"]] }])}&mat=1`);
  const rows = page.locator(`${STAGE} .ky-ju-chart-row`);
  await expect(rows).toHaveCount(5);
  const checked = await rows.evaluateAll((all) => all.map((row) => {
    const box = row.querySelector("rect").getBoundingClientRect();
    return [...row.querySelectorAll("text")].map((t) => {
      const r = t.getBoundingClientRect();
      return { ok: r.left >= box.left - 0.5 && r.right <= box.right + 0.5 && r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5, text: t.textContent };
    });
  }));
  for (const row of checked) for (const item of row) expect(item.ok, item.text).toBe(true);
  // What was typed is all there: the words of the long name, joined, are the name.
  const words = await page.locator(`${STAGE} .ky-ju-chart-row[data-seat="judge-1"] .ky-ju-name`).allTextContents();
  expect(words.join(" ").replace(/\s+/g, "")).toBe("MaximilianAlexanderFriedrichvonHohenlohe-SchillingsfürstundWaldenburgzuBartenstein");
});

test("on a tablet the type is large: the names are at least 20 pixels tall on a 1180 pixel screen, and the chart sits beside the plan, landscape or portrait", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await open(page, "?mat=1");
  const size = async () => page.locator(`${STAGE} .ky-ju-name`).first().evaluate((t) => t.getBoundingClientRect().height);
  expect(await size()).toBeGreaterThan(20);
  const beside = await page.evaluate(() => {
    const plan = document.querySelector(".ky-ju-plan-frame").getBoundingClientRect();
    const chart = document.querySelector(".ky-ju-chart").getBoundingClientRect();
    return chart.left >= plan.right - 1;
  });
  expect(beside).toBe(true);
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.waitForFunction(() => document.querySelector(".ky-ju-chart").getBoundingClientRect().left < document.querySelector(".ky-ju-plan-frame").getBoundingClientRect().right);
  const under = await page.evaluate(() => {
    const plan = document.querySelector(".ky-ju-plan-frame").getBoundingClientRect();
    const chart = document.querySelector(".ky-ju-chart").getBoundingClientRect();
    return chart.top >= plan.bottom - 1;
  });
  expect(under).toBe(true);
  expect(await size()).toBeGreaterThan(18);
  await noSidewaysScroll(page);
  await page.locator("#orientation").selectOption("landscape");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-chart", "yes");
});

test("typing a name changes the picture and the address, a long one goes to the chart, and nothing is stored", async ({ page }) => {
  await open(page, `?mat=1&focus=bench&seatnames=1&${data([{ l: "", o: FIVE.map(([n, i]) => [n.split(" ")[0], i]) }])}`);
  await expect(page.locator(`${STAGE} [data-card="yes"]`)).toHaveCount(5);
  const field = page.locator('#officials input[data-mat="0"][data-seat="1"][data-field="name"]');
  await field.fill("Daniel");
  await expect(page.locator(`${STAGE} [data-seat="judge-2"] .ky-ju-card-name`)).toHaveText("Daniel");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-chart", "no");
  await field.fill("Daniel Okafor-Wellington-Montgomery-Fitzgerald-Blackwood");
  await expect(page.locator(`${STAGE} [data-seat="judge-2"][data-card="no"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-chart", "yes");
  await expect(page.locator(`${STAGE} .ky-ju-chart-row[data-seat="judge-2"] .ky-ju-name`).first()).toHaveText("Daniel");
  const d = JSON.parse(new URL(page.url()).searchParams.get("d"));
  expect(d[0].o[1][0]).toBe("Daniel Okafor-Wellington-Montgomery-Fitzgerald-Blackwood");
  // The mat's own name renames its tab and the picture.
  await page.locator('#officials input[data-mat="0"][data-field="label"]').fill("Final");
  await expect(page.locator("#tabs button").first()).toHaveText("Final");
  await expect(page.locator(`${STAGE} .ky-ju-mat`)).toHaveText("Final");
  const stored = await page.evaluate(() => [globalThis.localStorage.length, globalThis.sessionStorage.length, document.cookie]);
  expect(stored).toEqual([0, 0, ""]);
  // A copy of the address is a copy of the assignment.
  const copy = await page.context().newPage();
  await serve(copy);
  await copy.goto(page.url());
  await copy.waitForSelector('body[data-ready="true"]');
  await expect(copy.locator(`${STAGE} .ky-ju-mat`)).toHaveText("Final");
  await expect(copy.locator('#officials input[data-mat="0"][data-seat="1"][data-field="name"]')).toHaveValue("Daniel Okafor-Wellington-Montgomery-Fitzgerald-Blackwood");
});

test("a tab for each mat, and one for all of them; a mat is added and taken away", async ({ page }) => {
  await open(page);
  await page.locator('#tabs button[data-tab="2"]').click();
  await expect(page.locator(`${STAGE} .ky-ju-mat`)).toHaveText("Mat 2");
  await expect(page.locator(`${STAGE} .ky-ju-name`).first()).toHaveText("Li Wei");
  await page.locator('#tabs button[data-tab="0"]').click();
  await expect(page.locator(`${STAGE} .ky-ju-panel`)).toHaveCount(2);
  expect(new URL(page.url()).searchParams.get("mat")).toBe("0");
  await page.locator("#mats").fill("3");
  await page.locator("#mats").dispatchEvent("change");
  await expect(page.locator(`${STAGE} .ky-ju-panel`)).toHaveCount(3);
  await expect(page.locator("#tabs button")).toHaveText(["Mat 1", "Mat 2", "Mat 3", "All mats"]);
  await page.locator("#mats").fill("1");
  await page.locator("#mats").dispatchEvent("change");
  await expect(page.locator("#tabs button")).toHaveText(["Mat 1"]);
  await expect(page.locator(`${STAGE} .ky-ju-panel`)).toHaveCount(1);
});

test("the same assignment in 3D: the judges' table, a name card on it, the chart beside the view, and a view that turns", async ({ page }) => {
  const { errors } = await open(page, `?view=3d&focus=bench&mat=1&seatnames=1&${data([{ l: "", o: FIVE.map(([n, i]) => [n.split(" ")[0], i]) }])}`);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-mode", "3d");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  await expect(view).toHaveAttribute("aria-roledescription", "3D view");
  await expect(view).toHaveAccessibleName(/Judging assignments: Kata, 5 judges, 1 mat/);
  for (const n of [1, 2, 3, 4, 5]) await expect(page.locator(`${STAGE} [data-part="m1-card-${n}"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part="m1-table-top"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} [data-part="m1-sign"]`)).toContainText("Mat 1");
  await expect(page.locator(`${STAGE} .ky-ju-chart-row`)).toHaveCount(5);
  // A card turns to the eye: its matrix changes with the turn, and the view keeps its size.
  const matrix = () => page.locator(`${STAGE} [data-part="m1-card-1"]`).evaluate((el) => el.style.transform);
  const before = await matrix();
  await view.focus();
  for (let i = 0; i < 4; i += 1) await page.keyboard.press("ArrowLeft");
  await expect.poll(matrix).not.toBe(before);
  // A name that does not fit a card is a badge in 3D, and the name is in the chart.
  await page.locator('#officials input[data-mat="0"][data-seat="2"][data-field="name"]').fill("Sofia Lindqvist-Hernandez");
  await expect(page.locator(`${STAGE} [data-part="m1-card-3"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} [data-part="m1-badge-3"]`)).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("view")).toBe("3d");
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
  await page.locator("#view").selectOption("flat");
  await expect(page.locator(`${STAGE} svg.kyogijo[data-judging]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveCount(0);
});

test("it follows light and dark and speaks Japanese, the names as typed", async ({ page }) => {
  await open(page, `?lang=ja&mat=1&theme=dark&chart=always&${data([{ l: "", o: [["山田 花子", "J-9"], ["", ""], ["", ""], ["", ""], ["", ""]] }])}`);
  await expect(page.locator("h1")).toHaveText("審判員の配置");
  await expect(page).toHaveTitle("競技場 Kyogijo Stadiums：審判員の配置");
  await expect(page.locator(`${STAGE} .ky-ju-mat`)).toHaveText("第1試合場");
  await expect(page.locator(`${STAGE} .ky-ju-name`).first()).toHaveText("山田 花子");
  await expect(page.locator(`${STAGE} .ky-ju-role`).nth(2)).toHaveText("審判員3（中央）");
  await expect(page.locator(`${STAGE} .ky-ju-vacant`).first()).toHaveText("未定");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("#language").selectOption("en");
  await expect(page.locator("h1")).toHaveText("Judging assignments");
  await expect(page.locator(`${STAGE} .ky-ju-mat`)).toHaveText("Mat 1");
  await expect(page.locator(`${STAGE} .ky-ju-vacant`).first()).toHaveText("Not assigned");
  await page.locator("#theme").selectOption("auto");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).not.toHaveAttribute("data-theme", /.+/);
});

test("a damaged address opens on the sample names, and the table says the same as the picture", async ({ page }) => {
  const { errors } = await open(page, "?d=%7Bnot-json&mat=9&view=sideways");
  await expect(page.locator("#tabs button")).toHaveText(["Mat 1", "Mat 2", "All mats"]);
  await expect(page.locator(`${STAGE} .ky-ju-name`).first()).toHaveText("Aiko Mori");
  await page.locator("details", { hasText: "The same as a table" }).locator("summary").click();
  await expect(page.locator("#table table")).toContainText("Judge 3, central");
  await expect(page.locator("#table tbody tr")).toHaveCount(10);
  expect(errors).toEqual([]);
});

test("a contest: the referee, the technical table's three and, when asked for, the side judges, in the chart, on the plan and in 3D", async ({ page }) => {
  const { errors } = await open(page, "?style=shiai&mat=1");
  await expect(page.locator("#style")).toHaveValue("shiai");
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-judging", "shiai");
  await expect(page.locator(`${STAGE} .ky-ju-role`)).toHaveText(["Referee", "Timekeeper", "Scorekeeper", "Referee supervisor", "Side judge 1"]);
  await expect(page.locator(`${STAGE} .ky-ju-name`).first()).toHaveText("Hana Ito");
  // The editor has a row for each seat, side judges included; a side judge who is named is drawn, and the other when asked for.
  await expect(page.locator('#officials input[data-mat="0"][data-field="name"]')).toHaveCount(6);
  await page.locator("#sidejudges").check();
  await expect(page.locator(`${STAGE} .ky-ju-chart-row`)).toHaveCount(6);
  await expect(page.locator(`${STAGE} .ky-ju-role`).nth(5)).toHaveText("Side judge 2");
  expect(new URL(page.url()).searchParams.get("sidejudges")).toBe("1");
  expect(new URL(page.url()).searchParams.get("style")).toBe("shiai");
  // Typing a referee changes the picture; the kata names are kept apart from the contest's.
  await page.locator('#officials input[data-mat="0"][data-seat="0"][data-field="name"]').fill("Yui");
  await expect(page.locator(`${STAGE} .ky-ju-name`).first()).toHaveText("Yui");
  await page.locator("#style").selectOption("kata");
  await expect(page.locator(`${STAGE} .ky-ju-name`).first()).toHaveText("Aiko Mori");
  await page.locator("#style").selectOption("shiai");
  await expect(page.locator(`${STAGE} .ky-ju-name`).first()).toHaveText("Yui");
  // In 3D the referee's card is on a post on the mat, the table's cards on the table.
  await page.locator("#view").selectOption("3d");
  await expect(page.locator(`${STAGE} [data-part="m1-post-1"]`).first()).toBeAttached();
  await expect(page.locator(`${STAGE} [data-part="m1-table-top"]`)).toHaveCount(1);
  await expect(page.locator(`${STAGE} .ky-turn-view`)).toHaveAccessibleName(/Shiai/);
  expect(errors).toEqual([]);
  await noSidewaysScroll(page);
});

test("Japanese contest words", async ({ page }) => {
  await open(page, "?style=shiai&mat=1&lang=ja&chart=always");
  await expect(page.locator(`${STAGE} .ky-ju-role`).first()).toHaveText("主審");
  await expect(page.locator("#style option:checked")).toHaveText("試合（主審と各係）");
});

test("by default the seats are numbers on round badges and the chart is the key; the names go on the seats only when asked for, in the chart's own face", async ({ page }) => {
  await open(page, "?mat=1");
  await expect(page.locator("#seatnames")).not.toBeChecked();
  await expect(page.locator(`${STAGE} svg.kyogijo`)).toHaveAttribute("data-chart", "yes");
  await expect(page.locator(`${STAGE} [data-card="yes"]`)).toHaveCount(0);
  await expect(page.locator(`${STAGE} .ky-ju-seat .ky-ju-badge`)).toHaveCount(5);
  await expect(page.locator(`${STAGE} .ky-ju-card-name`)).toHaveCount(0);
  await page.locator("#focus").selectOption("bench");
  await page.locator("#seatnames").check();
  expect(new URL(page.url()).searchParams.get("seatnames")).toBe("1");
  await expect(page.locator(`${STAGE} .ky-ju-card-name`).first()).toBeVisible();
  // The type on a card is the chart's own face and weight.
  const faces = await page.evaluate(() => {
    const of = (selector) => { const s = getComputedStyle(document.querySelector(selector)); return [s.fontFamily, s.fontWeight]; };
    return [of(".ky-ju-card-name"), of(".ky-ju-name")];
  });
  expect(faces[0]).toEqual(faces[1]);
  // Nothing is stretched or condensed: every text is scaled evenly on the screen, in 2D.
  const uneven = await page.evaluate(() => [...document.querySelectorAll('[data-testid="stage"] svg text')].filter((t) => { const m = t.getScreenCTM(); return Math.abs(Math.hypot(m.a, m.b) / Math.hypot(m.c, m.d) - 1) > 0.001 || t.hasAttribute("textLength") || t.hasAttribute("lengthAdjust"); }).length);
  expect(uneven).toBe(0);
});

test("in 3D the badges and the sign are not squeezed at any viewpoint: their shape on the screen is their shape", async ({ page }) => {
  await open(page, "?view=3d&mat=1");
  const view = page.locator(`${STAGE} .ky-turn-view`);
  for (const name of ["Overhead", "Broadcast", "End-on", "Low corner"]) {
    await page.getByRole("button", { name }).click();
    await page.waitForTimeout(150);
    const ratios = await page.evaluate(() => [...document.querySelectorAll('[data-part^="m1-badge-"], [data-part="m1-sign"]')].map((el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      const w = Number.parseFloat(el.style.width);
      const h = Number.parseFloat(el.style.height);
      const p = (x, y) => { const q = m.transformPoint(new DOMPoint(x, y)); return [q.x / q.w, q.y / q.w]; };
      const [a, b, c] = [p(0, 0), p(w, 0), p(0, h)];
      return (Math.hypot(c[0] - a[0], c[1] - a[1]) / h) / (Math.hypot(b[0] - a[0], b[1] - a[1]) / w);
    }));
    for (const r of ratios) expect(Math.abs(r - 1), name).toBeLessThan(0.08);
  }
  await expect(view).toBeVisible();
});

// ----- The broadcast view (0.19.0): the mat large with the officials on a board at its side.

const rect = (page, selector) => page.locator(selector).first().evaluate((el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; });
const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test("the broadcast view in 2D: 16:9, the mat large, a board beside it with every seat's number, name and ID, the badges on the seats, and the board clear of the mat", async ({ page }) => {
  const { errors, outside } = await open(page, "?view=broadcast&dim=2d&mat=1");
  const svg = page.locator(`${STAGE} svg.kyogijo`);
  await expect(svg).toHaveAttribute("data-view", "broadcast");
  await expect(svg).toHaveAttribute("data-chart", "no");
  await expect(page.locator(`${STAGE} .ky-ju-board-title`)).toHaveText("Mat 1");
  await expect(page.locator(`${STAGE} .ky-ju-board-row`)).toHaveCount(5);
  await expect(page.locator(`${STAGE} .ky-ju-board-row .ky-ink-left`).first()).toHaveText("Aiko Mori");
  await expect(page.locator(`${STAGE} .ky-ju-board-id`).first()).toHaveText("J-1042");
  await expect(page.locator(`${STAGE} .ky-ju-seat`)).toHaveCount(5);
  await expect(page.locator(`${STAGE} .ky-foot`).last()).toHaveText("Round 2 · Kata, 5 judges");
  const box = await rect(page, `${STAGE} svg.kyogijo`);
  expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
  // The board is beside the mat and never over it; the middle of the contest area (the middle of the yellow mats) is clear.
  const board = await rect(page, `${STAGE} .ky-ju-board`);
  const plan = await rect(page, `${STAGE} .ky-ju-plan`);
  expect(overlaps(board, plan)).toBe(false);
  expect(board.left).toBeGreaterThanOrEqual(box.left);
  expect(board.right).toBeLessThanOrEqual(box.right + 0.5);
  const middle = { x: (plan.left + plan.right) / 2, y: (plan.top + plan.bottom) / 2 };
  expect(middle.x < board.left || middle.x > board.right || middle.y < board.top || middle.y > board.bottom).toBe(true);
  // The badges are on the mat, inside the picture of it.
  const badges = await page.locator(`${STAGE} .ky-ju-seat circle`).evaluateAll((all) => all.map((c) => { const r = c.getBoundingClientRect(); return [(r.left + r.right) / 2, (r.top + r.bottom) / 2]; }));
  for (const [x, y] of badges) { expect(x).toBeGreaterThan(plan.left); expect(x).toBeLessThan(plan.right); expect(y).toBeGreaterThan(plan.top); expect(y).toBeLessThan(plan.bottom); }
  // Nothing is stretched: every text is scaled evenly on the screen.
  const uneven = await page.evaluate(() => [...document.querySelectorAll('[data-testid="stage"] svg text')].filter((t) => { const m = t.getScreenCTM(); return Math.abs(Math.hypot(m.a, m.b) / Math.hypot(m.c, m.d) - 1) > 0.001; }).length);
  expect(uneven).toBe(0);
  expect(errors).toEqual([]);
  expect(outside).toEqual([]);
  await noSidewaysScroll(page);
});

test("the broadcast view in 3D opens from the Broadcast camera with the board laid over the view's side, taking no pointer, and a view that still turns", async ({ page }) => {
  const { errors } = await open(page, "?view=broadcast&mat=1");
  await expect(page.locator(`${STAGE} .ky-ju-bc .ky-turn`)).toHaveAttribute("data-mode", "3d");
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "broadcast");
  await expect(page.locator(`${STAGE} .ky-ju-bc-board .ky-ju-board-title`)).toHaveText("Mat 1");
  await expect(page.locator(`${STAGE} .ky-ju-bc-board .ky-ju-board-row`)).toHaveCount(5);
  const view = await rect(page, `${STAGE} .ky-turn-view`);
  const board = await rect(page, `${STAGE} .ky-ju-bc-board`);
  if (view.width >= 640) {
    expect(Math.abs(view.width / view.height - 16 / 9)).toBeLessThan(0.03);
    expect(board.left).toBeGreaterThan(view.left + view.width * 0.6);
    expect(board.right).toBeLessThanOrEqual(view.right);
    expect(board.top).toBeGreaterThanOrEqual(view.top);
    expect(board.bottom).toBeLessThan(view.bottom);
    expect(board.width / view.width).toBeGreaterThan(0.25);
    // The middle of the view (the middle of the mat) is not under the board, and a drag on the board reaches the view under it.
    expect((view.left + view.right) / 2 < board.left).toBe(true);
  } else {
    // A view narrower than 640 px has no room beside the mat for the board without covering it: the board stands under the view, as wide as the view lets it.
    expect(board.top).toBeGreaterThanOrEqual(view.bottom - 1);
    expect(board.width).toBeGreaterThan(Math.min(view.width, 480) * 0.6);
    expect(board.right).toBeLessThanOrEqual(view.right + 1);
  }
  await expect(page.locator(`${STAGE} .ky-ju-bc-board`)).toHaveCSS("pointer-events", "none");
  await page.getByRole("button", { name: "End-on" }).click();
  await expect(page.locator(`${STAGE} .ky-turn`)).toHaveAttribute("data-preset", "end");
  expect(new URL(page.url()).searchParams.get("viewpoint")).toBe("end");
  expect(errors).toEqual([]);
});

test("the broadcast view on a tablet and on a television: the picture fits the screen and the board's type is large", async ({ page }) => {
  for (const [width, height] of [[1180, 820], [820, 1180], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await open(page, "?view=broadcast&dim=2d&mat=1");
    const box = await rect(page, `${STAGE} svg.kyogijo`);
    expect(box.width, `${width}x${height}`).toBeLessThanOrEqual(width);
    expect(box.height, `${width}x${height}`).toBeLessThanOrEqual(height);
    const name = await page.locator(`${STAGE} .ky-ju-board-row .ky-ink-left`).first().evaluate((t) => t.getBoundingClientRect().height);
    expect(name, `${width}x${height}`).toBeGreaterThan(width >= 1180 ? 14 : 9);
    await noSidewaysScroll(page);
  }
});

test("the broadcast view in dark and in Japanese, and the 2D picture is in the address", async ({ page }) => {
  await open(page, "?view=broadcast&dim=2d&mat=2&theme=dark&lang=ja&style=shiai");
  await expect(page.locator(`${STAGE} .ky-ju-board-title`)).toHaveText("第2試合場");
  await expect(page.locator(`${STAGE} .ky-ju-board-vacant`).first()).toHaveText("未定");
  const plate = await page.locator(`${STAGE} .ky-ju-board .ky-plate-bg`).evaluate((el) => getComputedStyle(el).fill);
  expect(plate).toMatch(/^rgba?\(0, 0, 0/);
  const search = new URL(page.url()).searchParams;
  expect([search.get("view"), search.get("dim"), search.get("lang"), search.get("theme")]).toEqual(["broadcast", "2d", "ja", "dark"]);
  await page.locator("#theme").selectOption("light");
  const light = await page.locator(`${STAGE} .ky-ju-board .ky-plate-bg`).evaluate((el) => getComputedStyle(el).fill);
  expect(light).toMatch(/^rgba?\(18, 24, 21/);
});

test("a mat's line is a field of the editor, shows in the board's foot and is kept in the address", async ({ page }) => {
  await open(page, "?view=broadcast&dim=2d&mat=1");
  await page.locator('#officials input[data-mat="0"][data-field="line"]').fill("Final block");
  await expect(page.locator(`${STAGE} .ky-foot`).last()).toHaveText("Final block · Kata, 5 judges");
  expect(JSON.parse(new URL(page.url()).searchParams.get("d"))[0].r).toBe("Final block");
});

test("no box with the picture's words over the mat: the title is not a direct child of the drawing, and the picture is still named by it", async ({ page }) => {
  for (const query of ["?mat=1", "?view=broadcast&dim=2d&mat=1", "?mat=1&view=3d"]) {
    await open(page, query);
    const found = await page.evaluate(() => [...document.querySelectorAll('[data-testid="stage"] svg.kyogijo')].map((svg) => ({ direct: svg.querySelectorAll(":scope > title").length, inside: svg.querySelectorAll("defs > title").length, name: svg.getAttribute("aria-labelledby") })));
    expect(found.length, query).toBeGreaterThan(0);
    for (const one of found) { expect(one.direct, query).toBe(0); expect(one.inside, query).toBe(1); }
  }
  await open(page, "?mat=1");
  await expect(page.locator(`${STAGE} svg.kyogijo`).first()).toHaveAccessibleName(/Judging assignments: Kata, 5 judges, 2 mats/);
});

test("printing: every mat is a page of the chosen paper, one to a page, in the plan-and-chart layout and the light colours, and the rest of the page is left out", async ({ page, browserName }) => {
  await open(page, "?theme=dark&paper=letter");
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; });
  await page.locator("#l-print").click();
  await page.locator("#print-btn").click();
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  await expect(page.locator("#print .ky-ju-sheet")).toHaveCount(2);
  await expect(page.locator('#print .ky-ju-sheet svg.kyogijo[data-chart="yes"]')).toHaveCount(2);
  await expect(page.locator('#print svg.kyogijo[data-theme="light"]')).toHaveCount(2);
  expect(await page.locator("#print-css").textContent()).toContain("size:Letter portrait");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#print")).toBeVisible();
  await expect(page.locator("main")).toBeHidden();
  if (browserName === "chromium") {
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const text = pdf.toString("latin1");
    expect((text.match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBe(2);
    expect(text).toMatch(/\/MediaBox\s*\[0 0 612 792\]/);
  }
});

test("in a wide face (Verdana, DejaVu Sans) every line of the board stays inside its chip or its plate, however long, and so does the chart of the plan view", async ({ page }) => {
  await open(page, `?view=broadcast&dim=2d&mat=1&${data([{ l: "", o: [["Maximilian Alexander Friedrich von Hohenlohe-Schillingsfürst und Waldenburg zu Bartenstein", "0123456789-0123456789-0123456789-0123456789-0123456789-abcd"], ["Li Wei", "J-1"], ["", ""], ["山田太郎".repeat(8), ""], ["Sofia Lindqvist-Hernandez", "J-2210"]] }])}`);
  await page.addStyleTag({ content: '.kyogijo{--ky-font:Verdana,"DejaVu Sans",sans-serif !important}' });
  const out = await page.locator(`${STAGE} .ky-ju-board-row`).evaluateAll((all) => all.flatMap((row) => {
    const chip = (row.querySelector(".ky-ju-chip") ?? row.querySelector(".ky-ju-chip-empty")).getBoundingClientRect();
    const plate = row.closest(".ky-ju-board").querySelector(".ky-plate-bg").getBoundingClientRect();
    return [...row.querySelectorAll("text")].map((t) => { const r = t.getBoundingClientRect(); const box = t.classList.contains("ky-ink-left") ? chip : plate; return { text: t.textContent, ok: r.right <= box.right + 0.5 && r.left >= box.left - 0.5 }; });
  }));
  expect(out.length).toBeGreaterThan(8);
  for (const item of out) expect(item.ok, item.text).toBe(true);
  // The chart of the plan view, in the same face.
  await page.locator("#view").selectOption("flat");
  await page.addStyleTag({ content: '.kyogijo .ky-ju-id{font-family:"Courier New","DejaVu Sans Mono",monospace !important}' });
  const rows = await page.locator(`${STAGE} .ky-ju-chart-row`).evaluateAll((all) => all.flatMap((row) => {
    const box = row.querySelector("rect").getBoundingClientRect();
    return [...row.querySelectorAll("text")].map((t) => { const r = t.getBoundingClientRect(); return { text: t.textContent, ok: r.right <= box.right + 0.5 && r.left >= box.left - 0.5 }; });
  }));
  expect(rows.length).toBeGreaterThan(8);
  for (const item of rows) expect(item.ok, item.text).toBe(true);
});
