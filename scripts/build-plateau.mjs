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
import { dojo } from "../src/budo/dojo.api.ts";
import { areaOf, inside, lonLatFrom, metresFrom, simplified, edgeDistance } from "../src/venues.geo.ts";

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
import { PLATEAU_ATTRIBUTION } from "./plateau.credit.ts";

export { PLATEAU_ATTRIBUTION };

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

// ---- The Kodokan: one building, and where its main dojo lies in it. ----
// The building is the one of the extract that holds the point English Wikipedia's infobox gives for the Kodokan (35.7076 N, 139.7534 E) and that PLATEAU counts as 8 storeys above ground (OpenStreetMap's way 170598646, Wikidata Q1165384, building:levels 8, is the same outline: read as a check, not copied).
// Its main dojo is 420 jo (the count of the Kodokan's own page, English Wikipedia and the IJF) on the 7th floor, four contest areas on a floor that must be 26 metres square at least, and a gallery on the 8th: the room, walls to the far edge
// of the gallery, is 31.8 metres square with no wood round the mats (`SIDE`). The shape of the floor is ours (no source gives it): the square is put where it stands farthest from the building's walls, whatever way it is turned.
const KODOKAN = { find: [139.7534024, 35.7076186], storeys: 8 };
const SIDE = 31.8;
{
  const extract = JSON.parse(readFileSync(new URL(`${[...Object.keys(areas)][0]}.json`, dir), "utf8"));
  const hit = extract.buildings.filter((b) => b.storeys === KODOKAN.storeys && inside(b.ring.map((p) => [p[0], p[1]]), KODOKAN.find));
  if (hit.length !== 1) throw new Error(`the Kodokan: ${hit.length} buildings of ${KODOKAN.storeys} storeys hold ${KODOKAN.find}`);
  const b = hit[0];
  const origin = b.ring[0];
  const ring = simplified(metresFrom(origin, b.ring), 0.3);
  const corners = (cx, cy, h) => {
    const a = (h * Math.PI) / 180;
    const [c, s, r] = [Math.cos(a), Math.sin(a), SIDE / 2];
    const pts = [];
    for (let i = 0; i < 16; i += 1) {
      const t = -r + (2 * r * i) / 16;
      for (const [u, v] of [[-r, t], [r, -t], [-t, -r], [t, r]]) pts.push([cx + u * c - v * s, cy + u * s + v * c]);
    }
    return pts;
  };
  let best = { clear: -Infinity, cx: 0, cy: 0, h: 0 };
  for (let h = 0; h < 90; h += 0.5) {
    for (let cx = -12; cx <= 36; cx += 0.25) {
      for (let cy = -6; cy <= 44; cy += 0.25) {
        const pts = corners(cx, cy, h);
        if (!pts.every((p) => inside(ring, p))) continue;
        const clear = Math.min(...pts.map((p) => edgeDistance(ring, p)));
        if (clear > best.clear) best = { clear, cx, cy, h };
      }
    }
  }
  if (best.clear <= 0) throw new Error("the Kodokan: the room does not fit in the building");
  const fixed = (lonLat) => lonLat.map((v) => Math.round(v * 1e6) / 1e6);
  // The dojo's x axis lies along the compass heading 90 less the angle (anticlockwise from east) the search turned the square by.
  const heading = (((90 - best.h) % 180) + 180) % 180;
  // The dojos of the 5th and 6th floors (the Kodokan's own floor guide: the school dojo of 240 jo and the international dojo of 192 jo on the 6th; the women's dojo of 240, the boys' of 114 and a special dojo on the 5th, which the guide gives no count).
  // The building gives no plan: the rooms are the dojo builder's own shape for their counts (a special dojo's, no count published, is ours: 40 jo), laid out in two rows (6th) and two rows with the smaller two side by side (5th), a metre and a half apart,
  // and each floor's block is put where it stands farthest from the building's walls, whichever way it is turned. All of it ours but the counts.
  const GAP = 1.5;
  const size = (jo) => {
    const d = dojo({ mats: jo, surround: 0 });
    return { w: Math.round(d.width * 100) / 100, l: Math.round(d.length * 100) / 100 };
  };
  const LAYOUTS = {
    6: [{ id: "school", jo: 240 }, { id: "international", jo: 192 }],
    5: [{ id: "womens", jo: 240 }, { id: "boys", jo: 114 }, { id: "special", jo: 40 }],
  };
  const floors = {};
  for (const [floor, list] of Object.entries(LAYOUTS)) {
    const rooms = list.map((r) => ({ ...r, ...size(r.jo) }));
    // Offsets of each room's middle in the block's own frame (x along the rooms, y across, in metres from the block's middle).
    let offsets;
    let W;
    let L;
    if (floor === "6") {
      [W, L] = [Math.max(rooms[0].w, rooms[1].w), rooms[0].l + GAP + rooms[1].l];
      offsets = [[0, -L / 2 + rooms[0].l / 2], [0, L / 2 - rooms[1].l / 2]];
    } else {
      const row = rooms[1].w + GAP + rooms[2].w;
      const second = Math.max(rooms[1].l, rooms[2].l);
      [W, L] = [Math.max(rooms[0].w, row), rooms[0].l + GAP + second];
      offsets = [[0, -L / 2 + rooms[0].l / 2], [-row / 2 + rooms[1].w / 2, L / 2 - second / 2], [row / 2 - rooms[2].w / 2, L / 2 - second / 2]];
    }
    const block = (cx, cy, h) => {
      const a = (h * Math.PI) / 180;
      const [c, sn] = [Math.cos(a), Math.sin(a)];
      const pts = [];
      for (let i = 0; i < 16; i += 1) {
        const t = -0.5 + i / 16;
        for (const [u, v] of [[-W / 2, t * L], [W / 2, -t * L], [-t * W, -L / 2], [t * W, L / 2]]) pts.push([cx + u * c - v * sn, cy + u * sn + v * c]);
      }
      return pts;
    };
    let fit = { clear: -Infinity, cx: 0, cy: 0, h: 0 };
    for (let h = 0; h < 180; h += 0.5) {
      for (let cx = -12; cx <= 36; cx += 0.25) {
        for (let cy = -6; cy <= 44; cy += 0.25) {
          const pts = block(cx, cy, h);
          if (!pts.every((p) => inside(ring, p))) continue;
          const clear = Math.min(...pts.map((p) => edgeDistance(ring, p)));
          if (clear > fit.clear) fit = { clear, cx, cy, h };
        }
      }
    }
    if (fit.clear <= 0) throw new Error(`the Kodokan: the ${floor}th floor's rooms do not fit in the building`);
    const a = (fit.h * Math.PI) / 180;
    floors[floor] = {
      heading: (((90 - fit.h) % 180) + 180) % 180,
      clearance: Math.round(fit.clear * 100) / 100,
      rooms: rooms.map((r, i) => {
        // The room's x axis lies along the block's, its y across: a step down the page is a step at a right angle clockwise on the map.
        const [dx, dy] = offsets[i];
        const at = [fit.cx + dx * Math.cos(a) + dy * Math.sin(a), fit.cy + dx * Math.sin(a) - dy * Math.cos(a)];
        return { id: r.id, jo: r.jo, w: r.w, l: r.l, centre: fixed(lonLatFrom(origin, at)) };
      }),
    };
  }
  const kodokan = `// Made by scripts/build-plateau.mjs from data-sources/plateau/${day}/: do not edit by hand.
//
// THIS FILE IS DATA FROM PROJECT PLATEAU, edited: the Kodokan's building (its roof-edge outline simplified to 0.3 metres, its height and its storeys, from MLIT's 3D city model of Bunkyo ward, 2025 edition) and where the main dojo's
// room is put in it (worked out here from the outline, ours). The credit is \`PLATEAU_ATTRIBUTION\` (plateau.credit.ts), the terms the PLATEAU Site Policy's (free, commercial use included, compatible with CC BY 4.0). Apart from the
// OpenStreetMap data (ODbL 1.0); nothing is copied from one to the other. The raw extract is in data-sources/plateau/.

/** The Kodokan's building and the place of its main dojo in it. */
export const KODOKAN_BUILDING = {
  /** The building's id in PLATEAU's file (bldg:Building gml:id). */
  "source": ${JSON.stringify(b.id)},
  "read": ${JSON.stringify(extract.read)},
  /** The roof-edge outline, \`[longitude, latitude]\`. */
  "ring": ${JSON.stringify(ring.map((p) => fixed(lonLatFrom(origin, p))))},
  /** The height of the building's top above its ground, in metres, and its storeys above ground. */
  "height": ${b.height},
  "storeys": ${b.storeys},
  /** The middle of the main dojo's room, \`[longitude, latitude]\`, the compass heading of its x axis (0 to under 180) and the length of its side in metres, walls and gallery included. */
  "room": { "centre": ${JSON.stringify(fixed(lonLatFrom(origin, [best.cx, best.cy])))}, "heading": ${heading}, "side": ${SIDE}, "clearance": ${Math.round(best.clear * 100) / 100} },
  /** The rooms of the 5th and 6th floors: each floor's heading (of its rooms' x axis), and for each room its count in jo, its size in metres (the dojo builder's shape for the count) and the middle of it, \`[longitude, latitude]\`. Ours but the counts. */
  "floors": ${JSON.stringify(floors)},
} as const;
`;
  writeFileSync(new URL("../src/kodokan.data.ts", import.meta.url), kodokan);
  console.log(`src/kodokan.data.ts written: ${b.id} ${b.height} m, ${b.storeys} storeys, ${ring.length} points, room at heading ${heading}, ${Math.round(best.clear * 100) / 100} m clear; floors ${Object.entries(floors).map(([f, v]) => `${f}: heading ${v.heading}, ${v.clearance} m clear`).join("; ")}`);
}
