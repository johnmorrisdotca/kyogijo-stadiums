// Made by `pnpm boards`: the sample boards of the demo (demo/boards-data.js), drawn with @johnmorrisdotca/taisen-brackets (a development dependency of this package alone: the package takes a board as an SVG string and does not
// import Taisen Brackets) and Hata's flags, from the invented content of scripts/boards-sources.mjs. The file is committed, so the demo and the tests need neither package to run.
import { writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { flag } from "@johnmorrisdotca/hata/load";
import { boutBoard, boutBoardSize, broadcastMedalSize, broadcastMedalTable, resultsBoard, resultsBoardSize } from "@johnmorrisdotca/taisen-brackets";

import { FLAG_CODES, SAMPLES } from "./boards-sources.mjs";

const flags = Object.fromEntries(await Promise.all(FLAG_CODES.map(async (code) => [code, await flag(code, { shape: "4:3" })])));
const draw = (code) => flags[code];

/** One sample drawn: the SVG, the size its maker reports, and the sentence that says what it shows. */
function made({ kind, source, options, label }) {
  const drawn = { ...options, flags: draw };
  if (kind === "bout") return { svg: boutBoard(source, drawn), ...boutBoardSize(source.officials.length, { width: options.width }), label };
  if (kind === "medals") return { svg: broadcastMedalTable(source, drawn), ...broadcastMedalSize(source.rows.length, { width: options.width }), label };
  return { svg: resultsBoard(source, drawn), ...resultsBoardSize(source.rows.length, { width: options.width }), label };
}

const BOARDS = Object.fromEntries(Object.entries(SAMPLES).map(([name, sample]) => [name, made(sample)]));
const out = fileURLToPath(new URL("../demo/boards-data.js", import.meta.url));
writeFileSync(out, `// Made by scripts/make-boards.mjs (pnpm boards) with @johnmorrisdotca/taisen-brackets and Hata's flags; do not edit.\n// Sample boards for the demo, drawn from invented athletes and results (scripts/boards-sources.mjs): no real person or result, no mark of any games or broadcaster.\n// Each is { svg, width, height, label }: the SVG text and the size its maker reports, for \`board\`.\nexport const BOARDS = ${JSON.stringify(BOARDS)};\n`);
for (const [name, board] of Object.entries(BOARDS)) process.stdout.write(`${name}: ${board.width} x ${board.height}, ${Math.round(board.svg.length / 1024)} KB\n`);
