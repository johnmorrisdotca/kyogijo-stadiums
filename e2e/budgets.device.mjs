// Speed checks per device class, so that a change cannot make the 3D view slower or heavier on a phone without a test saying so. Each device class is a project of the config (`device-desk`, `device-mid-phone`, `device-slow-android`), played
// in a job of its own on the public repository's free CI; every district preset and the venues page is opened at the tier that class is held at, and what it holds is checked against the budgets of `e2e/device.budgets.json`:
//
//   - the layers (planes), those drawn at the opening view, the elements of the page, the memory the layers take at the device's pixel ratio and the biggest single layer: EXACT counts, the same on a fast machine and a slow one, so
//     they are the budget with a margin of 15 percent (a change that makes a district heavier fails here, on every runner, every time);
//   - the cost of a step of the turn to the end of its frame, as a RATIO to a reference scene measured on the same machine with the same CPU slowing (`referenceCost`): a loaded runner slows both, so the ratio holds where
//     milliseconds would not. A ratio's budget is twice what it measured (and at least one more), so it catches a view twice as slow as it was and not a noisy minute.
//
// The tier is pinned (`quality=` in the address) because `auto` steps down when a runner's frames are slow, and a step changes what is counted: the budgets say what each class is held at, and the governor has its own tests (e2e/quality.demo.mjs).
// To make the budgets again after a change that is meant: `DEVICE_MEASURE=file.jsonl pnpm exec playwright test --project=device-desk` (and the other two) writes what each page measured, and the budgets are those numbers with the margins above.
import { appendFileSync, readFileSync } from "node:fs";
import process from "node:process";
import { expect, test } from "@playwright/test";

import { PRESETS, VENUES_PAGE, holdings, openView, referenceCost, throttle, turnCost } from "./device.lib.mjs";

// One after another in one worker: two pages measured at once slow each other, and the ratios are what is judged.
test.describe.configure({ mode: "serial" });

const BUDGETS = JSON.parse(readFileSync(new URL("./device.budgets.json", import.meta.url), "utf8"));

async function check(page, info, name, address, tiered = true) {
  const { tier, cpu } = info.project.metadata;
  await throttle(page, cpu);
  const errors = await openView(page, address);
  const held = await holdings(page);
  const step = await turnCost(page);
  const reference = await referenceCost(page.context(), cpu);
  const ratio = step.frame / reference.frame;
  const seen = { planes: held.planes, drawn: held.drawn, nodes: held.nodes, mb: Math.round(held.mb * 10) / 10, biggestMb: Math.round(held.biggestMb * 10) / 10, ratio: Math.round(ratio * 100) / 100 };
  if (process.env.DEVICE_MEASURE) {
    appendFileSync(process.env.DEVICE_MEASURE, `${JSON.stringify({ project: info.project.name, name, tier: held.tier, share: held.share, dpr: held.dpr, ...seen, stepMs: Math.round(step.frame * 10) / 10, referenceMs: Math.round(reference.frame * 10) / 10 })}\n`);
    return;
  }
  const budget = BUDGETS[info.project.name]?.[name];
  expect(budget, `a budget for ${name} in ${info.project.name}`).toBeDefined();
  // (The tier is what the address asked for, so a count is of the tier the class is held at; the venues page has none and draws at `high`.)
  expect(held.tier).toBe(tiered ? tier : "high");
  const note = JSON.stringify(seen);
  expect(held.planes, `layers ${note}`).toBeLessThanOrEqual(budget.planes);
  expect(held.drawn, `drawn at the opening view ${note}`).toBeLessThanOrEqual(budget.drawn);
  expect(held.nodes, `elements of the page ${note}`).toBeLessThanOrEqual(budget.nodes);
  expect(held.mb, `megabytes of layers ${note}`).toBeLessThanOrEqual(budget.mb);
  expect(held.biggestMb, `the biggest layer, megabytes ${note}`).toBeLessThanOrEqual(budget.biggestMb);
  expect(ratio, `a step to the end of its frame, against the reference scene's (${step.frame.toFixed(1)} and ${reference.frame.toFixed(1)} ms) ${note}`).toBeLessThanOrEqual(budget.ratio);
  expect(errors).toEqual([]);
}

for (const [name, preset] of Object.entries(PRESETS)) {
  test(`the district preset ${name} stays inside its budget`, async ({ page }, info) => {
    test.setTimeout(240_000);
    await check(page, info, name, `district.html?${preset}${preset === "" ? "" : "&"}view=3d&viewpoint=broadcast&quality=${info.project.metadata.tier}`);
  });
}

test("the venues page's 3D view stays inside its budget", async ({ page }, info) => {
  test.setTimeout(240_000);
  await check(page, info, "venues", VENUES_PAGE, false);
});

test("every preset of the district page has a budget, and every budget is of a preset of the page", async () => {
  const page = readFileSync(new URL("../demo/district.html", import.meta.url), "utf8");
  const made = new Set([...page.matchAll(/^\s{8}(\w+): \{ venues: \[/gm)].map((m) => m[1]));
  expect(made.size).toBeGreaterThan(10);
  expect([...made].sort()).toEqual(Object.keys(PRESETS).sort());
  for (const [project, budgets] of Object.entries(BUDGETS)) expect(Object.keys(budgets).sort(), project).toEqual([...made, "venues"].sort());
});
