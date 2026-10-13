// What an example in the README or a page of docs/ says it prints, and how to hold it to what it prints: shared by the test of the examples
// (src/docs.examples.test.js, which runs them against the source) and by `pnpm test:readme` (scripts/check-readme-examples.mjs, which runs them
// against the built package). A block says what it prints in comment lines right after each `console.log`: `// true true`.
import { parts } from "./readme-lint.mjs";

/** The index of the line each `console.log(...)` statement of a block ends on. */
function logEnds(lines) {
  const ends = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes("console.log(")) continue;
    let depth = 0;
    let j = i;
    for (; j < lines.length; j += 1) {
      const bare = lines[j].replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, "");
      for (const ch of bare.slice(j === i ? bare.indexOf("console.log(") : 0)) depth += ch === "(" ? 1 : ch === ")" ? -1 : 0;
      if (depth <= 0) break;
    }
    ends.push(j);
    i = j;
  }
  return ends;
}

/**
 * What a block says it prints, as runs of lines: the `// ` comment lines right after a `console.log`, or a `text` block right after the block.
 * A comment right after an output may also be a remark about the next statement, so `matched` takes from each run only the lines that are what was
 * printed, in order, and leaves the rest as prose.
 */
export function expectedOutput(body, next) {
  const lines = body.split("\n");
  const runs = [];
  for (const end of logEnds(lines)) {
    const run = [];
    for (let k = end + 1; k < lines.length && lines[k].startsWith("// "); k += 1) run.push(lines[k].slice(3));
    if (run.length > 0) runs.push(run);
  }
  if (runs.length === 0 && next !== undefined && next.type === "code" && next.info.split(/\s+/)[0] === "text") runs.push(next.body.split("\n"));
  return runs;
}

/** The lines of the runs that match what was printed, taken in order: a line that is not the next printed line is prose and ends its run. */
export function matched(runs, printed) {
  let at = 0;
  const taken = [];
  for (const run of runs) {
    for (const line of run) {
      if (line !== printed[at]) break;
      taken.push(line);
      at += 1;
    }
  }
  return taken;
}

/**
 * Every ts, js or mjs block of a Markdown file: its line, its language, its code and what it should print (an empty list when it says nothing). A block
 * flagged `no-check` is an excerpt and is left out; one flagged `no-run` is left out unless `withNoRun` asks for it (to be type-checked, not run).
 */
export function blocksOf(markdown, { withNoRun = false } = {}) {
  const all = parts(markdown);
  const out = [];
  all.forEach((part, index) => {
    if (part.type !== "code") return;
    const [language, ...flags] = part.info.split(/\s+/);
    if (!["ts", "js", "mjs"].includes(language) || flags.includes("no-check") || (flags.includes("no-run") && !withNoRun)) return;
    const after = all[index + 1]?.type === "prose" && all[index + 1].text.trim() === "" ? all[index + 2] : all[index + 1];
    out.push({ line: part.line, body: part.body, language, run: !flags.includes("no-run"), expected: expectedOutput(part.body, after) });
  });
  return out;
}
