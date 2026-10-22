// Prints what the crowd outside costs at 100 percent for BC Place and Rogers Arena together (`pnpm outside:cost`): the one-off work of the mask and of the crowd, and what each size of canvas costs to paint, best of
// five, in Node. The browser's side (a level's paint on a page and what a turning frame costs) is measured by e2e/district.demo.mjs and docs/outside.md quotes both.
import { performance } from "node:perf_hooks";
import process from "node:process";
import { planDistrict } from "../src/district.ts";
import { outsideCrowd } from "../src/outside.ts";
import { frameOf, rasterOutside } from "../src/outside.paint.ts";

const plan = planDistrict({ venues: ["bc-place", "rogers-arena"], outside: { level: 100 } });
const started = performance.now();
const crowd = outsideCrowd(plan);
const first = performance.now() - started;
console.log(`the mask and the crowd, once: ${first.toFixed(0)} ms for ${crowd.count} people (${crowd.venues.map((v) => `${v.key} ${v.placed}/${v.seats}`).join(", ")})`);
for (const width of [800, 1960, 3072]) {
  const frame = frameOf(plan.view, width);
  const times = [];
  let stats;
  for (let i = 0; i < 5; i += 1) {
    const at = performance.now();
    stats = rasterOutside(crowd, 100, frame, [194, 65, 12]).stats;
    times.push(performance.now() - at);
  }
  console.log(`paint at ${frame.width} x ${frame.height}: ${Math.min(...times).toFixed(1)} ms best of 5, ${stats.mode}, ${stats.stamps} stamps for ${stats.people} people (${(stats.stamps / stats.people).toFixed(1)} each)`);
}
process.exit(0);
