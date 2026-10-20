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
  await open(page, `?mat=1&focus=bench&${data([{ l: "", o: FIVE.map(([n, i]) => [n.split(" ")[0], i]) }])}`);
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
  const { errors } = await open(page, `?view=3d&focus=bench&mat=1&${data([{ l: "", o: FIVE.map(([n, i]) => [n.split(" ")[0], i]) }])}`);
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
