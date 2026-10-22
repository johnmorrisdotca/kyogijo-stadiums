// Writes src/plateau.data.ts from the dated extracts of data-sources/plateau/ (`pnpm plateau`, or `pnpm plateau 2026-10-22` for a day).
//
// What PLATEAU's CityGML gives a building is far more than a district's background wants, and the package stays small, so each building is cut down here, once, at build time: no tile, no mesh and no request
// at run time. A building is its roof-edge outline in metres east and north of the area's middle (simplified to 0.6 m and put on a half-metre grid), the height of its top above its ground in half metres, and, for a
// building whose LOD2 shape has a pitched roof, how far that roof rises above its eaves. Buildings smaller than 30 square metres and lower than 9 metres are left out (sheds, kiosks), a building with no height of its own
// takes the height of its LOD1 block, and the heights PLATEAU does not give (-9999) take the block too. The ring is the outer ring only. The file is made of the extract and nothing else.
//
// The data is Project PLATEAU's (MLIT), under the PLATEAU Site Policy (free, commercial use included, compatible with CC BY 4.0), edited here: src/plateau.data.ts says so at its head and the credit is
// `PLATEAU_ATTRIBUTION`, NOTICE.md carries it. It is its own file, apart from the OpenStreetMap data (ODbL) and the facts (CC0 and CC BY-SA) of the package's other data files.
import { Buffer } from "node:buffer";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { areaOf, metresFrom, simplified } from "../src/venues.geo.ts";

const root = new URL("../data-sources/plateau/", import.meta.url);
const day = process.argv[2] ?? readdirSync(root).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().at(-1);
if (day === undefined) throw new Error("no data-sources/plateau/<date>/ to read: run `pnpm plateau:fetch` first");
const dir = new URL(`${day}/`, root);
const NAMES = { "tokyo-dome-city": { en: "Tokyo Dome City", ja: "東京ドームシティ" } };

const GRID = 0.5;
const SIMPLIFY = 0.6;
const MIN_AREA = 30;
const LOW = 9;
const MIN_RISE = 1.2;
const snap = (value) => Math.round(value / GRID);

const areas = {};
for (const file of readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
  const extract = JSON.parse(readFileSync(new URL(file, dir), "utf8"));
  const key = extract.area;
  if (NAMES[key] === undefined) throw new Error(`${key}: no name for the area in scripts/build-plateau.mjs`);
  const buildings = [];
  const dropped = { small: 0, flat: 0, thin: 0 };
  let guessed = 0;
  for (const b of extract.buildings) {
    const lod1 = b.lod1 === null ? undefined : b.lod1.top - b.lod1.base;
    let height = b.height !== null && b.height > 0 && b.height < 400 ? b.height : undefined;
    if (height === undefined) {
      height = lod1 !== undefined && lod1 > 0 && lod1 < 400 ? lod1 : 6;
      guessed += 1;
    }
    const metres = metresFrom(extract.centre, b.ring);
    const area = Math.abs(areaOf(metres));
    if (area < MIN_AREA && height < LOW) {
      dropped.small += 1;
      continue;
    }
    // The ring, wound the one way, on the grid, with no repeated point.
    const wound = areaOf(metres) < 0 ? [...metres].reverse() : metres;
    const ring = simplified(wound, SIMPLIFY).map(([x, y]) => [snap(x), snap(y)]).filter((p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]);
    if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
    if (ring.length < 3) {
      dropped.thin += 1;
      continue;
    }
    // A pitched roof: more than half of a LOD2 building's roof is slanted, and it rises more than a step.
    const roof = b.lod2Roof;
    let rise = 0;
    if (roof !== undefined && roof !== null && roof.slantedShare >= 0.5 && roof.slantedZMax !== null && roof.slantedZMax - roof.slantedZMin >= MIN_RISE) rise = Math.min(roof.slantedZMax - roof.slantedZMin, height * 0.6, 12);
    else dropped.flat += roof === undefined ? 0 : 1;
    // Wound the way `simplified` leaves a ring: first point absolute, then each step from the one before.
    const steps = [ring[0][0], ring[0][1]];
    for (let i = 1; i < ring.length; i += 1) steps.push(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
    buildings.push([Math.round(height * 2), Math.round(rise * 2), ...steps]);
  }
  const text = buildings.map((row) => `    [${row.join(",")}],`).join("\n");
  const bytes = Buffer.byteLength(text);
  areas[key] = { extract, buildings, text, dropped, guessed, bytes };
  console.log(`${key}: ${extract.buildings.length} read, ${buildings.length} kept (${JSON.stringify(dropped)}, ${guessed} heights from the block), ${bytes} bytes of data, ${buildings.filter((b) => b[1] > 0).length} pitched roofs`);
}

const head = `// Made by scripts/build-plateau.mjs from the files of data-sources/plateau/${day}/: do not edit by hand.
//
// THIS FILE IS DATA FROM PROJECT PLATEAU, edited: "Project PLATEAU, Ministry of Land, Infrastructure, Transport and Tourism (MLIT), https://www.mlit.go.jp/plateau/". It holds the buildings round a district
// as MLIT's 3D city model of the ward gives them (the 2025 edition, product specification 5.0): each building's roof-edge outline simplified to 0.6 metres and put on a half-metre grid, its height, and for a
// building with a pitched LOD2 roof the rise of that roof. It is not MLIT's own data as published, and MLIT did not make it. The terms are the PLATEAU Site Policy's (https://www.mlit.go.jp/plateau/site-policy/):
// free for anyone, commercial use included, compatible with Creative Commons Attribution 4.0; the credit is \`PLATEAU_ATTRIBUTION\`. The copyright of a ward's data belongs to its local government. It is kept apart from
// the OpenStreetMap data (ODbL 1.0) of the venues' outlines and from every CC0 file of the package, and nothing is copied from one to the other. The raw extract is in data-sources/plateau/.
import type { ContextArea } from "./context.ts";

/** The credit that goes with a drawing made from these buildings: the source, and that it was edited. */
export const PLATEAU_ATTRIBUTION = {
  en: "Project PLATEAU, Ministry of Land, Infrastructure, Transport and Tourism (MLIT), https://www.mlit.go.jp/plateau/ (3D city model of Bunkyo ward, 2025 edition), simplified and edited by Kyogijo Stadiums; not made by MLIT",
  ja: "出典：国土交通省 Project PLATEAU（文京区の3D都市モデル、2025年度）を Kyogijo Stadiums が加工して作成。国土交通省が作成したものではありません。",
};

`;
const body = Object.entries(areas)
  .map(([key, a]) => {
    const e = a.extract;
    const symbol = key.toUpperCase().replace(/-/g, "_");
    return `/** ${NAMES[key].en}: ${a.buildings.length} buildings within ${e.radius} metres of the middle, from ${e.dataset.ward}, ${e.dataset.edition}, read ${e.read}. */
export const ${symbol}: ContextArea = {
  "key": ${JSON.stringify(key)},
  "name": ${JSON.stringify(NAMES[key])},
  "origin": ${JSON.stringify(e.centre)},
  "radius": ${e.radius},
  "grid": ${GRID},
  "layers": {
    "buildings": {
      "source": ${JSON.stringify(`${e.dataset.ward}, ${e.dataset.edition}: ${e.dataset.page}`)},
      "read": ${JSON.stringify(e.read)},
      "licence": "PLATEAU Site Policy clause 3, compatible with CC BY 4.0",
      "attribution": PLATEAU_ATTRIBUTION,
      /** Each building: the height in grid steps, the roof's rise in grid steps (0 for a flat roof), then the first point (east, north) and each step to the next, all in grid steps from \`origin\`. */
      "rows": [
${a.text.replace(/^ {4}/gm, "        ")}
      ],
    },
  },
};
`;
  })
  .join("\n");
writeFileSync(new URL("../src/plateau.data.ts", import.meta.url), `${head}${body}\n/** Every area, by key. */\nexport const PLATEAU_AREAS: Readonly<Record<string, ContextArea>> = { ${Object.keys(areas).map((k) => `${JSON.stringify(k)}: ${k.toUpperCase().replace(/-/g, "_")}`).join(", ")} };\n`);
console.log("src/plateau.data.ts written");
