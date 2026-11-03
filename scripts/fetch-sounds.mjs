// Fetches the raw recordings the demo's sounds are made from (`pnpm sounds:fetch`) into data-sources/sounds/raw/, which git leaves out: each file of scripts/sounds.data.json from the address
// of its licence page's file, one at a time with a pause, with a User-Agent that names the project. A file already there is not fetched again. It needs the network and is not part of
// `pnpm check`; then `pnpm sounds` makes demo/sounds/ from them.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const data = JSON.parse(readFileSync(new URL("./sounds.data.json", import.meta.url), "utf8"));
const out = new URL("../data-sources/sounds/raw/", import.meta.url);
mkdirSync(out, { recursive: true });
const USER_AGENT = "kyogijo-sounds/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const entry of data.sounds) {
  const file = new URL(entry.raw, out);
  if (existsSync(file)) {
    console.log(`have ${entry.raw}`);
    continue;
  }
  const answer = await fetch(entry.url, { headers: { "User-Agent": USER_AGENT } });
  if (!answer.ok) {
    console.error(`FAIL ${entry.url}: ${answer.status}`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(file, Buffer.from(await answer.arrayBuffer()));
  console.log(`got  ${entry.raw}`);
  await pause(1500);
}
