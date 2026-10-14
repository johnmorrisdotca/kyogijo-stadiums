// The family's backgrounds, for the demo and the README's pictures. scripts/family-backgrounds.ts is the family's shared module, copied byte for byte from taisen-brackets and never edited here
// (test/family-backgrounds.test.ts pins its version and sha256). It is tooling: the package ships none of it and still has no dependency. The demo loads it, as plain JavaScript, only when a
// background is chosen; this file turns the TypeScript into that JavaScript and reads the list of presets from it, so the demo's menu and the module can never disagree.
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";

import ts from "typescript";

/** The module as the plain JavaScript the demo imports (site/family-backgrounds.js). */
export function backgroundsModule() {
  const source = readFileSync(new URL("family-backgrounds.ts", import.meta.url), "utf8");
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
}

/** The module itself, loaded (it imports nothing, so a data address is enough). */
export const loadBackgrounds = () => import(`data:text/javascript;base64,${Buffer.from(backgroundsModule()).toString("base64")}`);

/** The demo's Background menu, as the page writes it: None first, then the family's presets in the family's order. */
export async function backgroundOptions() {
  const { BACKGROUND_PRESETS } = await loadBackgrounds();
  return `<option value="" data-say="backgroundNone"></option>${BACKGROUND_PRESETS.map((name) => `<option value="${name}">${name}</option>`).join("")}`;
}
