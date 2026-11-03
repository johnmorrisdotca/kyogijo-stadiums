// Make the examples' made-up game from a play-by-play kept outside the repository: `node scripts/make-game.mjs <play-by-play.json> [out.json]`. The play-by-play is read and nothing
// of it is copied; the game is `fictionGame` of `scripts/game-fiction.mjs`, written compactly, one frame a line. Only the made-up game is committed.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

import { fictionGame } from "./game-fiction.mjs";

const [source, out = "examples/games/canada-japan.json"] = process.argv.slice(2);
if (source === undefined) {
  console.error("usage: node scripts/make-game.mjs <play-by-play.json> [out.json]");
  process.exit(2);
}
const game = fictionGame(JSON.parse(readFileSync(source, "utf8")));
const { frames, events } = game.timeline;
const head = JSON.stringify({ ...game, timeline: { from: game.timeline.from, frames: [], events: [] } }, null, 1);
// One frame, one event a line: diffs stay readable, and the file stays small.
const text = head.replace('"frames": []', `"frames": [\n${frames.map((f) => JSON.stringify(f)).join(",\n")}\n ]`).replace('"events": []', `"events": [\n${events.map((e) => JSON.stringify(e)).join(",\n")}\n ]`);
writeFileSync(out, `${text}\n`);
const goals = events.filter((e) => e.kind === "goal");
console.log(`${out}: ${(text.length / 1024).toFixed(0)} kB, ${frames.length} frames, ${events.length} events, ${goals.length} goals, ${game.score.home}-${game.score.away}, ${game.periods.at(-1).end.toFixed(0)} s`);
