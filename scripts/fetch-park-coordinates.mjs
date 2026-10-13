// Writes the coordinates of every ballpark, and the years it opened and closed, into scripts/parks.data.json (`pnpm parks:coordinates`). It needs the network and is not
// part of `pnpm check`; run it when a park is added, then `pnpm parks` to make src/parks.data.ts.
//
// Each park names its Wikidata item; the item's coordinate location (P625, CC0) becomes the park's `lat` and `lon`, in degrees to five
// places; its inception (P571) and dissolution or demolition (P576) become `opened` and `closed`, the year of each where Wikidata gives
// one to the year. A request at a time, a pause between them, and a User-Agent that names the project and a way to reach its author, as Wikimedia
// asks. A park whose item has no coordinates is reported and left without, so the build stops there.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const file = new URL("./parks.data.json", import.meta.url);
const parks = JSON.parse(readFileSync(file, "utf8"));
const USER_AGENT = "kyogijo-parks-coordinates/0.1 (https://github.com/johnmorrisdotca/kyogijo; john@johnmorris.ca)";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ask = async (ids) => {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=claims&format=json&formatversion=2&redirects=yes`;
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Wikidata answered ${response.status}`);
  await pause(1500);
  return (await response.json()).entities;
};

const entities = {};
for (let i = 0; i < parks.length; i += 25) Object.assign(entities, await ask(parks.slice(i, i + 25).map((p) => p.wikidata)));
/** The year of a Wikidata time, when the claim is exact to the year or finer. */
const yearOf = (claims) => {
  const value = claims?.[0]?.mainsnak?.datavalue?.value;
  return value !== undefined && value.precision >= 9 ? Number(/^[+-]?(\d+)-/.exec(value.time)?.[1]) : undefined;
};
const round = (degrees) => Math.round(degrees * 1e5) / 1e5;
let missing = 0;
for (const park of parks) {
  const at = entities[park.wikidata]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  if (at === undefined) {
    missing += 1;
    console.log(`${park.id} (${park.wikidata}): the item has no coordinates`);
    continue;
  }
  park.lat = round(at.latitude);
  park.lon = round(at.longitude);
  const claims = entities[park.wikidata].claims;
  const [opened, closed] = [yearOf(claims.P1619) ?? yearOf(claims.P571), yearOf(claims.P3999) ?? yearOf(claims.P576)];
  // A year Wikidata does not give stays as the entry has it, for the few that were read from an article by hand.
  if (opened !== undefined) park.opened = opened;
  if (closed !== undefined) park.closed = closed;
}
// lat and lon sit after country in each entry, as the grounds' do after country, and opened and closed after status.
const placed = parks.map((park) => {
  const { lat, lon, opened, closed, ...rest } = park;
  const out = {};
  for (const [key, value] of Object.entries(rest)) {
    out[key] = value;
    if (key === "country" && lat !== undefined) Object.assign(out, { lat, lon });
    if (key === "status") Object.assign(out, opened === undefined ? {} : { opened }, closed === undefined ? {} : { closed });
  }
  return out;
});
writeFileSync(file, `${JSON.stringify(placed, null, 1)}`);
console.log(`${parks.length - missing} of ${parks.length} parks have coordinates`);
process.exit(missing === 0 ? 0 : 1);
