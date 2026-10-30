// Fetches what could show how each NHL arena's rink lies, and keeps it, dated, under data-sources/venues/<date>/ (`pnpm venues:rink <date>`): for each arena of scripts/venues.data.json, every feature OpenStreetMap maps within 260 metres
// of it that is a sport, an indoor feature, a building part, a stadium, a pitch or a rink, or has an ice, rink, court, floor or bowl in its name (a feature of the building itself, so that an ice or a court mapped inside it is found),
// as the Overpass API returned it (`osm-evidence-<id>.json`, ODbL 1.0, (c) OpenStreetMap contributors). It needs the network and is not part of `pnpm check`; `pnpm venues` reads the files and fails where they show a rink the first read
// of the building did not. A request at a time, 10 seconds apart, a back-off on 429 and 5xx and the second public gateway when the first is busy, and a User-Agent that names the project and a way to reach its author. A file already
// there is not fetched again.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const here = (name) => new URL(`./${name}`, import.meta.url);
const source = JSON.parse(readFileSync(here("venues.data.json"), "utf8"));
const arenas = JSON.parse(readFileSync(here("arenas.data.json"), "utf8"));
const day = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? "")) throw new Error("usage: pnpm venues:rink <date>");
const out = new URL(`../data-sources/venues/${day}/`, import.meta.url);
mkdirSync(out, { recursive: true });
const USER_AGENT = "kyogijo-venues/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
const GATEWAYS = ["https://overpass-api.de/api/interpreter", "https://lambert.openstreetmap.de/api/interpreter"];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const v of source.venues) {
  const file = new URL(`osm-evidence-${v.id}.json`, out);
  if (existsSync(file)) continue;
  const arena = arenas.find((a) => a.id === v.id);
  if (arena === undefined) throw new Error(`${v.id} is not an arena of scripts/arenas.data.json`);
  const near = `(around:260,${arena.lat},${arena.lon})`;
  const query = `[out:json][timeout:60];(nwr${near}["indoor"];nwr${near}["sport"];nwr${near}["leisure"~"pitch|ice_rink|sports_centre|stadium|track"];nwr${near}["building:part"];nwr${near}["name"~"ice|rink|court|floor|bowl",i];nwr${near}["man_made"~"scoreboard"];);out geom;`;
  let done = false;
  for (let attempt = 0; attempt < 4 && !done; attempt += 1) {
    const gateway = GATEWAYS[attempt % 2];
    try {
      const response = await fetch(gateway, { method: "POST", headers: { "user-agent": USER_AGENT, "content-type": "application/x-www-form-urlencoded" }, body: `data=${encodeURIComponent(query)}` });
      if (response.ok) {
        const body = await response.json();
        // A building part with no sport, leisure, indoor or rink-like name says nothing about a rink; it is dropped after the answer comes, to keep the file small, and the count is kept.
        const bare = (e) => e.tags?.["building:part"] !== undefined && !["sport", "leisure", "indoor", "man_made"].some((key) => e.tags[key] !== undefined) && !/ice|rink|court|floor|bowl/i.test(e.tags.name ?? "");
        const elements = body.elements.filter((e) => !bare(e));
        const dropped = { "building:part": body.elements.length - elements.length, why: "a building part with no sport, leisure, indoor or rink-like name says nothing about a rink; dropped after the answer came, to keep the file small" };
        // The answer's header as indented JSON and each feature on a line of its own, geometry and all, so that the file stays readable and small.
        const head = JSON.stringify({ read: day, licence: "ODbL 1.0, (c) OpenStreetMap contributors, openstreetmap.org/copyright", gateway, query, osmBase: body.osm3s?.timestamp_osm_base, wikidata: v.wikidata, dropped }, null, 1);
        writeFileSync(file, `${head.slice(0, -2)},\n "elements": [\n${elements.map((e) => ` ${JSON.stringify(e)}`).join(",\n")}\n ]\n}\n`);
        console.log(`${v.id}: ${elements.length} features`);
        done = true;
      } else {
        console.log(`${v.id}: ${response.status}`);
        await pause(15000);
      }
    } catch (error) {
      console.log(`${v.id}: ${String(error)}`);
      await pause(15000);
    }
  }
  if (!done) throw new Error(`gave up on ${v.id}`);
  await pause(10000);
}
