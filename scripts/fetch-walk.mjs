// Fetches what the walkable masks are made from and keeps it, dated, under data-sources/walk/<date>/ (`pnpm walk:fetch [date]`). It needs the network and is not part of `pnpm check`; run it when a district is added
// to scripts/walk.data.json, then `pnpm walk` makes the mask. One OpenStreetMap request per district through the Overpass API (ODbL 1.0, "(c) OpenStreetMap contributors"), a pause after it, a User-Agent that names the
// project and a way to reach its author, a back-off on 429 and 5xx and the second public gateway when the first is busy. A file that is already there is not fetched again.
//
//   osm-<district>.json   what OpenStreetMap maps within the radius of the district's venues (the box round their outlines, widened by `radiusMetres`): the streets and paths, the buildings, the railways, the water, the
//                         squares, parks, parking and platforms, as Overpass returned them (geometry and tags), with the query and the time of OpenStreetMap's data. ODbL data, kept apart from every other file here.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";
import { districtMember } from "../src/district.ts";

const config = JSON.parse(readFileSync(new URL("./walk.data.json", import.meta.url), "utf8"));
const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const out = new URL(`../data-sources/walk/${day}/`, import.meta.url);
mkdirSync(out, { recursive: true });
const USER_AGENT = "kyogijo-venues/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
const GATEWAYS = ["https://overpass-api.de/api/interpreter", "https://lambert.openstreetmap.de/api/interpreter"];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The box round the venues' outlines, widened by `metres` on every side: south, west, north, east. */
function boxOf(keys, metres) {
  const points = keys.flatMap((key) => districtMember(key).ring);
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const [south, north] = [Math.min(...lats), Math.max(...lats)];
  const [west, east] = [Math.min(...lons), Math.max(...lons)];
  const dLat = metres / 111320;
  const dLon = metres / (111320 * Math.cos((((south + north) / 2) * Math.PI) / 180));
  return [south - dLat, west - dLon, north + dLat, east + dLon].map((x) => Math.round(x * 1e6) / 1e6);
}

/** Everything a person on foot or a crowd is stopped by or can stand on. */
const queryOf = (box) => {
  const b = box.join(",");
  return `[out:json][timeout:180];(way["highway"](${b});way["building"](${b});way["building:part"](${b});way["railway"](${b});way["natural"~"^(water|bay|coastline)$"](${b});way["waterway"~"^(riverbank|dock)$"](${b});way["place"="square"](${b});way["area:highway"](${b});way["leisure"~"^(park|garden|playground|pitch|common)$"](${b});way["amenity"~"^(parking|bicycle_parking)$"](${b});way["public_transport"="platform"](${b});way["railway"="platform"](${b});way["man_made"~"^(pier|bridge)$"](${b});way["landuse"~"^(grass|retail|commercial|railway)$"](${b});rel["building"](${b});rel["type"="multipolygon"]["natural"="water"](${b});rel["type"="multipolygon"]["place"="square"](${b});rel["type"="multipolygon"]["leisure"~"^(park|garden)$"](${b});rel["type"="multipolygon"]["highway"="pedestrian"](${b});rel["type"="multipolygon"]["area:highway"](${b});rel["type"="multipolygon"]["amenity"="parking"](${b}););out geom;`;
};

let gateway = 0;
for (const district of config.districts) {
  const file = new URL(`osm-${district.id}.json`, out);
  if (existsSync(file)) continue;
  const box = boxOf(district.venues, config.radiusMetres);
  const query = queryOf(box);
  let answer;
  for (let attempt = 0; attempt < 8 && answer === undefined; attempt += 1) {
    const url = GATEWAYS[gateway % GATEWAYS.length];
    try {
      const response = await fetch(url, { method: "POST", headers: { "user-agent": USER_AGENT, "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: `data=${encodeURIComponent(query)}` });
      const text = await response.text();
      if (response.ok && text.startsWith("{")) {
        const json = JSON.parse(text);
        if (json.remark === undefined || !/runtime error|timed out/i.test(json.remark)) answer = { gateway: url, json };
      }
      if (answer === undefined) {
        console.log(`${district.id}: ${response.status} from ${url}, waiting`);
        gateway += 1;
        await pause(30000 * (1 + Math.floor(attempt / 2)));
      }
    } catch (error) {
      console.log(`${district.id}: ${String(error).slice(0, 80)}, waiting`);
      gateway += 1;
      await pause(30000);
    }
  }
  if (answer === undefined) {
    console.log(`${district.id}: no answer, run again later`);
    continue;
  }
  const { json } = answer;
  writeFileSync(file, `${JSON.stringify({ read: day, licence: "ODbL 1.0, (c) OpenStreetMap contributors, openstreetmap.org/copyright", gateway: answer.gateway, district: district.id, venues: district.venues, box, query, osmBase: json.osm3s?.timestamp_osm_base, elements: json.elements })}\n`);
  console.log(`${district.id}: ${json.elements.length} elements, OSM data of ${json.osm3s?.timestamp_osm_base}`);
  await pause(10000);
}
process.exit(0);
