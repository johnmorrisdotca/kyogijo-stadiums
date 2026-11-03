// Writes the demo's sample race feed, examples/races/las-vegas-sample.json: the package's own simulated race (made-up cars, the default seed, a full race distance) in the open race timeline, so that a reader can see
// what a feed looks like and try the feed field with one. Run after `pnpm build`: `node scripts/make-sample-race.mjs`. src/circuits.feed.test.ts holds the file to what this makes.
import { writeFileSync } from "node:fs";
import { raceToFeed, simulateRace } from "../dist/circuits-entry.js";

const feed = raceToFeed(simulateRace({ circuit: "las-vegas" }), "Sample feed (made up): the package's simulated race, 20 invented cars over 50 laps of the Las Vegas Strip Circuit. No real race, driver or team.");
writeFileSync("examples/races/las-vegas-sample.json", `${JSON.stringify(feed)}\n`);
console.log(`examples/races/las-vegas-sample.json: ${feed.cars.length} cars, ${feed.crossings.length} laps, ${feed.pits.length} stops`);
