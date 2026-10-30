// Writes src/cityctx.<area>.data.ts, one file for each area, and src/cityctx.data.ts, which joins them, from the dated files of data-sources/cityctx/ (`pnpm cityctx`, or `pnpm cityctx 2026-10-22` for a day).
//
// What a district's surroundings are made of, cut down once, at build time, to a few tens of kilobytes an area: no tile and no request at run time. Each area is one frame (the origin, a grid step and a radius) and
// separate layers laid in it (`ContextArea.layers`, the format `scripts/build-osm-context.mjs` makes downtown Vancouver's buildings and streets in, and its helpers are used here):
//   buildings  the outline (simplified, on the grid), the height and for a pitched roof its rise. Outlines are OpenStreetMap's; heights are the City of Seattle's LiDAR heights where it publishes them (Building Outlines
//              2015, roof apex elevation less the ground under the building from USGS 3DEP), else the `height` or `building:levels` OpenStreetMap gives, else a plain default. A City outline that OpenStreetMap
//              does not map (a building the map lacks) is a building of its own.
//   streets    OpenStreetMap's carriageways, viaducts and bridges, railways, and (in a detail area) sidewalks and paths as lines with a width: `streetOf` of scripts/walk-rules.mjs, the rule the crowd's mask shares.
//   landCover  water, green and wood outlines, from the grid of land cover VoxCity makes from OpenStreetMap (scripts/cityctx_vox.py).
//   trees      single trees: the City of Seattle's and the City of Vancouver's tree inventories and OpenStreetMap's tree nodes, a crown radius each. Not in the city view.
// A `nature` area (Vancouver's) has only land cover and trees: its buildings and streets are `VANCOUVER_CENTRE`'s. The data is OpenStreetMap's (ODbL 1.0) with the Cities' open data laid on it, edited here;
// each area's file says so at its head, each layer has its credit, and the file is apart from the CC0 files and from PLATEAU's.
import { Buffer } from "node:buffer";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { areaOf, centroidOf, inside, metresFrom, outerRingOf, simplified } from "../src/venues.geo.ts";
import { packed, simplifiedLine as lineSimplified } from "./osm-geometry.mjs";
import { buildingHeight, classify, streetOf } from "./walk-rules.mjs";

const config = JSON.parse(readFileSync(new URL("./cityctx.data.json", import.meta.url), "utf8"));
const root = new URL("../data-sources/cityctx/", import.meta.url);
const day = process.argv[2] ?? readdirSync(root).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().at(-1);
if (day === undefined) throw new Error("no data-sources/cityctx/<date>/ to read: run `pnpm cityctx:fetch` first");
const dir = new URL(`${day}/`, root);
const read = (name) => (existsSync(new URL(name, dir)) ? JSON.parse(readFileSync(new URL(name, dir), "utf8")) : undefined);
const FT = 0.3048;

// ---- Small helpers. ----
const parseMetres = (text) => {
  if (text === undefined) return undefined;
  const m = String(text).trim().match(/^(\d+(?:[.,]\d+)?)\s*(m|meters?|metres?|ft|feet|')?$/i);
  if (m === null) return undefined;
  const v = Number(m[1].replace(",", "."));
  return /^(ft|feet|')$/i.test(m[2] ?? "") ? v * FT : v;
};
const pointsIn = (ring, p) => inside(ring, p);
const grid = (area) => area.grid;
const snap = (v, g) => Math.round(v / g);

/** A cell index of points, to find the polygons near a point without testing them all. */
function indexOf(items, key, cell = 60) {
  const map = new Map();
  items.forEach((item, i) => {
    const b = key(item);
    for (let x = Math.floor(b.x0 / cell); x <= Math.floor(b.x1 / cell); x += 1) for (let y = Math.floor(b.y0 / cell); y <= Math.floor(b.y1 / cell); y += 1) {
      const k = `${x},${y}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(i);
    }
  });
  return (x, y) => map.get(`${Math.floor(x / cell)},${Math.floor(y / cell)}`) ?? [];
}
const boxOfRing = (ring) => ({ x0: Math.min(...ring.map((p) => p[0])), y0: Math.min(...ring.map((p) => p[1])), x1: Math.max(...ring.map((p) => p[0])), y1: Math.max(...ring.map((p) => p[1])) });

/** A ring or a line on the grid as a row's tail: the first point, then each step to the next; repeated points are dropped. */
function steps(points, g) {
  const snapped = points.map(([x, y]) => [snap(x, g), snap(y, g)]).filter((p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]);
  const out = [snapped[0][0], snapped[0][1]];
  for (let i = 1; i < snapped.length; i += 1) out.push(snapped[i][0] - snapped[i - 1][0], snapped[i][1] - snapped[i - 1][1]);
  return { out, count: snapped.length };
}

// ---- The buildings. ----
function osmBuildings(osm, origin) {
  const found = [];
  for (const e of osm.elements) {
    const tags = e.tags ?? {};
    // A building that stops a crowd (the rule the walkable mask has): not a roof, a canopy, a carport or a ruin.
    if (tags.building === undefined || classify(tags, true)?.kind !== "block-area") continue;
    const ring = outerRingOf(e);
    if (ring === undefined) continue;
    const metres = metresFrom(origin, ring.slice(0, -1).map((p) => [p.lon, p.lat]));
    if (metres.length < 3) continue;
    const shape = tags["roof:shape"];
    const pitched = ["gabled", "hipped", "half-hipped", "pyramidal", "gambrel", "mansard", "round", "dome"].includes(shape);
    const roofHeight = parseMetres(tags["roof:height"]);
    found.push({
      ring: metres,
      // `height`, else `building:levels` at 3.2 metres (the helper the Vancouver context shares).
      height: buildingHeight(tags) ?? undefined,
      rise: pitched ? (roofHeight ?? (Number(tags["roof:levels"]) > 0 ? Number(tags["roof:levels"]) * 2.5 : 3)) : 0,
      kind: tags.building,
      from: "osm",
    });
  }
  return found;
}

function seattleOutlines(file, ground, origin) {
  if (file === undefined) return [];
  let at = 0;
  const per = ground?.perBuilding ?? [];
  const elevations = ground?.elevations ?? [];
  return file.features.flatMap((f, index) => {
    const n = per[index] ?? 0;
    const here = elevations.slice(at, at + n).filter((v) => v !== null && Number.isFinite(v));
    at += n;
    const ring = f.geometry?.rings?.[0];
    if (ring === undefined || ring.length < 4) return [];
    const apex = f.attributes.BP99_APEX;
    let height;
    if (apex > 0 && here.length > 0) {
      const h = apex * FT - Math.min(...here);
      if (h >= 2 && h < 400) height = h;
    }
    return [{ ring: metresFrom(origin, ring.slice(0, -1)), height, type: f.attributes.BP99_TYPE }];
  });
}

/** The polygons of `source` that go with each polygon of `target`: a source whose middle lies in the target, or a target whose middle lies in the source. Returns the first match's index, or -1. */
function matcher(source) {
  const near = indexOf(source, (s) => boxOfRing(s.ring));
  const mids = source.map((s) => centroidOf(s.ring));
  return (ring) => {
    const [cx, cy] = centroidOf(ring);
    for (const i of near(cx, cy)) if (pointsIn(source[i].ring, [cx, cy]) || pointsIn(ring, mids[i])) return i;
    return -1;
  };
}

function buildingsOf(area, files) {
  const origin = area.origin;
  const osm = osmBuildings(files.osm, origin);
  const sources = seattleOutlines(files.outlines, files.ground, origin);
  const find = matcher(sources);
  const used = new Set();
  const all = [];
  for (const b of osm) {
    const i = find(b.ring);
    const matched = i >= 0 ? sources[i] : undefined;
    if (i >= 0) used.add(i);
    // The City's measured height wins over a tag in Seattle (LiDAR of 2015, the ground taken from 3DEP); a tagged height is used where the City has none.
    const city = matched?.height;
    const tagged = b.height;
    const guess = 10;
    const height = city ?? tagged ?? guess;
    all.push({ ring: b.ring, height, rise: b.rise, from: "osm", source: city === undefined ? (b.height !== undefined ? "tag" : "default") : "city" });
  }
  // A City outline that the map does not have: a building of its own.
  {
    sources.forEach((s, i) => {
      if (used.has(i) || s.type === "GAR" && Math.abs(areaOf(s.ring)) < 40) return;
      all.push({ ring: s.ring, height: s.height ?? (10), rise: 0, from: "city", source: s.height === undefined ? "default" : "city" });
    });
  }
  return all;
}

// ---- The streets. ----
const GRIDWIDTH = (area, metres) => Math.max(1, Math.round(metres / area.grid));
function streetsRows(area, osm) {
  const rows = [];
  const tol = area.kind === "detail" ? 0.6 : 7;
  for (const e of osm.elements) {
    const t = e.tags ?? {};
    if (e.type !== "way" || e.geometry === undefined) continue;
    const street = streetOf(t);
    if (street === null) continue;
    // The city view has the carriageways, the viaducts and the railways, not the sidewalks, the paths or the service lanes.
    if (area.kind === "city" && (street.kind === 3 || t.highway === "service")) continue;
    const pts = metresFrom(area.origin, e.geometry.map((p) => [p.lon, p.lat]));
    if (pts.every((p) => Math.hypot(p[0], p[1]) > area.radius)) continue;
    const line = lineSimplified(pts, tol);
    // From far, a short lane is noise.
    if (area.kind === "city" && line.reduce((n, p, i) => (i === 0 ? 0 : n + Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1])), 0) < (street.kind === 0 && street.width < 6 ? 90 : 45)) continue;
    const row = packed(line, area.grid);
    if (row.length >= 4) rows.push([street.kind, GRIDWIDTH(area, street.width), ...row]);
  }
  return rows;
}

// ---- Land cover. ----
const LAND = ["water", "green", "wood"];
function landCoverOf(area, vox) {
  const rows = [];
  const g = grid(area);
  if (vox?.outlines === undefined) return rows;
  LAND.forEach((name, cls) => {
    for (const ring of vox.outlines[name] ?? []) {
      if (Math.abs(areaOf(ring)) < (area.kind === "city" ? 2500 : 40)) continue;
      const s = steps(simplified(ring, area.kind === "city" ? 4 : 0.8), g);
      if (s.count >= 3) rows.push([cls, ...s.out]);
    }
  });
  return rows;
}

// ---- Trees. ----
const TREE_MAX = 1400;
const crown = (dbhCm) => Math.min(7, Math.max(1.6, 1.2 + dbhCm * 0.055));
function treesOf(area, files, blocks) {
  if (area.kind === "city") return [];
  const found = [];
  const add = (lon, lat, r) => {
    const [p] = metresFrom(area.origin, [[lon, lat]]);
    if (Math.hypot(p[0], p[1]) <= area.radius) found.push({ x: p[0], y: p[1], r });
  };
  for (const r of files.vtrees?.rows ?? []) if (r.geo_point_2d !== undefined) add(r.geo_point_2d.lon, r.geo_point_2d.lat, crown(r.diameter_cm ?? 25));
  for (const f of files.strees?.features ?? []) if (f.geometry !== undefined) add(f.geometry.x, f.geometry.y, crown((f.attributes.DBH ?? 10) * 2.54));
  for (const e of files.osm.elements) {
    const t = e.tags ?? {};
    if (e.type === "node" && t.natural === "tree") add(e.lon, e.lat, Math.min(7, Math.max(1.6, parseMetres(t.diameter_crown) ? parseMetres(t.diameter_crown) / 2 : 2.6)));
    // A row of trees: one every six metres along the line.
    if (e.type === "way" && t.natural === "tree_row" && e.geometry !== undefined) {
      const pts = metresFrom(area.origin, e.geometry.map((p) => [p.lon, p.lat]));
      for (let i = 0; i + 1 < pts.length; i += 1) {
        const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        for (let d = 0; d < len; d += 6) {
          const k = d / len;
          const [lon, lat] = [e.geometry[i].lon + (e.geometry[i + 1].lon - e.geometry[i].lon) * k, e.geometry[i].lat + (e.geometry[i + 1].lat - e.geometry[i].lat) * k];
          add(lon, lat, 2.4);
        }
      }
    }
  }
  // One tree to every four metres, none under a building, the largest crowns first, and at most TREE_MAX of them.
  const near = indexOf(blocks, (b) => b.box);
  const cell = new Map();
  const kept = [];
  for (const t of found.sort((a, b) => b.r - a.r || a.x - b.x || a.y - b.y)) {
    const key = `${Math.floor(t.x / 4)},${Math.floor(t.y / 4)}`;
    if (cell.has(key)) continue;
    if (near(t.x, t.y).some((i) => blocks[i].box.x0 <= t.x && t.x <= blocks[i].box.x1 && blocks[i].box.y0 <= t.y && t.y <= blocks[i].box.y1 && pointsIn(blocks[i].ring, [t.x, t.y]))) continue;
    cell.set(key, true);
    kept.push(t);
    if (kept.length >= TREE_MAX) break;
  }
  return kept.sort((a, b) => a.y - b.y || a.x - b.x);
}

// ---- The areas. ----
const areas = {};
for (const area of config.areas) {
  const files = {
    osm: read(`osm-${area.id}.json`),
    vtrees: read(`vancouver-trees-${area.id}.json`),
    outlines: read(`seattle-outlines-${area.id}.json`),
    ground: read(`seattle-ground-${area.id}.json`),
    strees: read(`seattle-trees-${area.id}.json`),
    vox: read(`voxcity-${area.id}.json`),
  };
  if (files.osm === undefined) {
    console.log(`${area.id}: no OpenStreetMap file in ${day}, skipped`);
    continue;
  }
  const g = grid(area);
  const everything = area.kind === "nature" ? [] : buildingsOf(area, files);
  const minArea = area.kind === "detail" ? 25 : 120;
  const kept = [];
  const bySource = { city: 0, tag: 0, default: 0 };
  const rows = [];
  for (const b of everything) {
    const a = Math.abs(areaOf(b.ring));
    if (a < minArea && b.height < 9) continue;
    // From far, a building matters when it is wide or tall.
    if (area.kind === "city" && a < 1200 && b.height < 24) continue;
    if (Math.hypot(...centroidOf(b.ring)) > area.radius + 100) continue;
    const wound = areaOf(b.ring) < 0 ? [...b.ring].reverse() : b.ring;
    const ring = simplified(wound, area.kind === "detail" ? 0.6 : 3.5);
    const s = steps(ring, g);
    if (s.count < 3) continue;
    const height = Math.min(b.height, 400);
    const rise = b.rise > 1.2 ? Math.min(b.rise, height * 0.6, 12) : 0;
    rows.push([Math.round(height / g), Math.round(rise / g), ...s.out]);
    kept.push({ ring: b.ring, box: boxOfRing(b.ring) });
    bySource[b.source] += 1;
  }
  const streets = area.kind === "nature" ? [] : streetsRows(area, files.osm);
  const landCover = landCoverOf(area, files.vox);
  const treeList = treesOf(area, files, kept).map((t) => [snap(t.x, g), snap(t.y, g), Math.max(1, Math.round(t.r / g))]);
  // One row: the first tree (east, north, radius), then each next tree's step from the one before in east and north, and its radius.
  const trees = treeList.length === 0 ? [] : [treeList.flatMap((t, i) => (i === 0 ? t : [t[0] - treeList[i - 1][0], t[1] - treeList[i - 1][1], t[2]]))];
  const text = (list) => list.map((row) => `        [${row.join(",")}],`).join("\n");
  const bytes = { buildings: Buffer.byteLength(text(rows)), streets: Buffer.byteLength(text(streets)), landCover: Buffer.byteLength(text(landCover)), trees: Buffer.byteLength(text(trees)) };
  const treeCount = treeList.length;
  areas[area.id] = { area, files, rows, streets, landCover, trees, treeCount, text, bytes, bySource };
  console.log(`${area.id}: ${rows.length} buildings (heights from ${JSON.stringify(bySource)}), ${streets.length} street lines, ${landCover.length} land cover rings, ${treeCount} trees; bytes ${JSON.stringify(bytes)} = ${Object.values(bytes).reduce((a, b) => a + b, 0)}`);
}

// ---- The file. ----
const OSM = { en: "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright", ja: "© OpenStreetMap contributors（ODbL 1.0）、openstreetmap.org/copyright" };
const EDITED = { en: "simplified and edited by Kyogijo Stadiums", ja: "Kyogijo Stadiums が加工して作成" };
const CREDITS = {
  osm: OSM,
  vancouverTrees: { en: "Trees: City of Vancouver open data, Public trees, under the Open Government Licence - Vancouver", ja: "樹木：バンクーバー市オープンデータ「Public trees」（Open Government Licence - Vancouver）" },
  seattleBuildings: { en: "Building outlines and roof heights: City of Seattle, Building Outlines 2015 (the City gives no warranty of its accuracy); ground levels: USGS 3D Elevation Program", ja: "建物の輪郭と屋根の高さ：シアトル市「Building Outlines 2015」（市は正確性を保証しません）、地面の標高：USGS 3D Elevation Program" },
  seattleTrees: { en: "Trees: City of Seattle, Combined Tree Point", ja: "樹木：シアトル市「Combined Tree Point」" },
  vox: { en: "Land cover made with VoxCity (MIT) from OpenStreetMap", ja: "土地被覆：OpenStreetMap から VoxCity（MIT）で作成" },
};
const clauses = (...keys) => ({ en: keys.map((k) => CREDITS[k].en).join("; "), ja: keys.map((k) => CREDITS[k].ja).join("；") });
// One credit for the area, said once: the buildings' layer carries the OpenStreetMap credit and the Cities' heights (and that it was edited); the others say only what is theirs, and the streets nothing more.
const LAYER_CREDITS = (area) => ({
  buildings: { en: `${clauses("osm", "seattleBuildings").en}; ${EDITED.en}`, ja: `${clauses("osm", "seattleBuildings").ja}；${EDITED.ja}` },
  streets: { en: "", ja: "" },
  landCover: clauses("vox"),
  // (A nature area's buildings and streets are VANCOUVER_CENTRE's, which carry OpenStreetMap's credit: its land cover and trees say their own, with the edit.)
  trees: area.kind === "nature" ? { en: `${CREDITS.vancouverTrees.en}; ${EDITED.en}`, ja: `${CREDITS.vancouverTrees.ja}；${EDITED.ja}` } : clauses("seattleTrees"),
});
const SOURCES = {
  vancouver: { trees: "OpenStreetMap natural=tree and the City of Vancouver's Public trees: https://opendata.vancouver.ca/explore/dataset/public-trees/" },
  seattle: { buildings: "OpenStreetMap (Overpass) with the City of Seattle's Building Outlines 2015 (https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Building_Outline_2015/FeatureServer) and USGS 3DEP ground levels", trees: "OpenStreetMap natural=tree and the City of Seattle's Combined Tree Point (https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Combined_Tree_Point/FeatureServer)" },
};
const LICENCES = {
  vancouver: { trees: "ODbL 1.0 (OpenStreetMap) and the Open Government Licence - Vancouver" },
  seattle: { buildings: "ODbL 1.0 (outlines, OpenStreetMap); the City of Seattle's outlines and heights under its Open Data Policy (no licence requirement or restriction on use; source, version and changes shown); USGS 3DEP, public domain", trees: "ODbL 1.0 (OpenStreetMap) and the City of Seattle's Open Data Policy (no restriction on use; source, version and changes shown)" },
};
const symbol = (id) => id.toUpperCase().replace(/-/g, "_");
const head = `// Made by scripts/build-cityctx.mjs from the files of data-sources/cityctx/${day}/: do not edit by hand.
//
// THIS FILE IS OPENSTREETMAP DATA (ODbL 1.0) WITH THE CITIES' OPEN DATA LAID ON IT, edited: "(c) OpenStreetMap contributors, openstreetmap.org/copyright". It holds the surroundings of a district for the 2D plan and the
// 3D view: Seattle's buildings (outline, height, for a pitched roof its rise) and streets and railways as lines, and water, green and wood outlines and single trees for Seattle and for Vancouver (whose buildings and
// streets are src/osm.context.data.ts's). The outlines of the buildings, the streets, the trees' places and the land cover are OpenStreetMap's. Seattle's heights are the City's (Building Outlines 2015 with USGS 3DEP ground
// levels; the City's Open Data Policy asks that the source, the version and the changes be shown); the trees of the two Cities' inventories (Vancouver Public trees under the Open Government Licence - Vancouver, Seattle
// Combined Tree Point) are added to OpenStreetMap's. The land cover is the grid VoxCity (MIT, https://github.com/kunifujiwara/VoxCity) makes from OpenStreetMap, vectorized. The data was cut down here (outlines
// simplified to a few tenths of a metre, put on a grid) and is not the Cities' own, which did not make it. The raw answers are kept, dated, in data-sources/cityctx/. This file is kept apart from every CC0 file
// of the package and from PLATEAU's data, and nothing is copied from one to the other.
import type { ContextArea } from "./context.ts";

`;
const files = Object.values(areas)
  .map(({ area, rows, streets, landCover, trees, treeCount, text, files }) => {
    const credits = LAYER_CREDITS(area);
    const vox = files.vox;
    const layer = (name, source, read, licence, attribution, list, doc) => `    ${JSON.stringify(name)}: {
      "source": ${JSON.stringify(source)},
      "read": ${JSON.stringify(read)},
      "licence": ${JSON.stringify(licence)},
      "attribution": ${JSON.stringify(attribution)},
      /** ${doc} */
      "rows": [
${text(list)}
      ],
    },`;
    const layers = [
      ...(rows.length === 0 ? [] : [layer("buildings", SOURCES[area.city].buildings, day, LICENCES[area.city].buildings, credits.buildings, rows, "Each building: the height in grid steps, the roof's rise in grid steps (0 for a flat roof), then the first point (east, north) and each step to the next, in grid steps from `origin`.")]),
      ...(streets.length === 0 ? [] : [layer("streets", "OpenStreetMap highways, railways, sidewalks and paths (Overpass; the kinds are scripts/walk-rules.mjs's streetOf)", day, "ODbL 1.0", credits.streets, streets, "Each line: the kind (0 a carriageway at street level, 1 one on a viaduct or a bridge, 2 a railway, 3 a sidewalk or a path), the width in grid steps, then the first point (east, north) and each step to the next, in grid steps from `origin`.")]),
      ...(landCover.length === 0 ? [] : [layer("landCover", `VoxCity ${vox.source.match(/VoxCity [\d.]+/)?.[0].slice(8)} land cover from OpenStreetMap`, day, "ODbL 1.0 (OpenStreetMap); VoxCity is MIT", credits.landCover, landCover, "Each outline: the class (0 water, 1 green, 2 wood), then the first point (east, north) and each step to the next, in grid steps from `origin`. A hole is an outline of its own (filled even-odd).")]),
      ...(trees.length === 0 ? [] : [layer("trees", SOURCES[area.city].trees, day, LICENCES[area.city].trees, credits.trees, trees, "One row for all the trees: the first tree's east, north and crown radius, then each next tree's step in east and north from the one before and its crown radius, all in grid steps.")]),
    ].join("\n");
    const text1 = `/** ${area.name.en}: ${rows.length} buildings, ${streets.length} street lines, ${landCover.length} land cover outlines and ${treeCount} trees within ${area.radius} metres of the middle, read ${day}. */
export const ${symbol(area.id)}: ContextArea = {
  "key": ${JSON.stringify(area.id)},
  "name": ${JSON.stringify(area.name)},
  "origin": ${JSON.stringify(area.origin)},
  "radius": ${area.radius},
  "grid": ${area.grid},
  "layers": {
${layers}
  },
};
`;
    return { id: area.id, text: text1 };
  });

for (const { id, text: area } of files) {
  writeFileSync(new URL(`../src/cityctx.${id}.data.ts`, import.meta.url), `${head}${area}`);
  console.log(`src/cityctx.${id}.data.ts written`);
}
// The file that joins them: what the `cityctx` entry exports. A page that wants one area imports that area's file (or asks `loadArea` of `./areas.ts` for it) and carries no other.
const join = `// Made by scripts/build-cityctx.mjs from the files of data-sources/cityctx/${day}/: do not edit by hand.
//
// Every area of the surroundings of Seattle and of Vancouver's water and trees, joined: the cityctx entry. The data is in one file for each area (src/cityctx.<area>.data.ts, OpenStreetMap, ODbL 1.0, with the Cities' open data,
// each file saying so at its head), so that a page that shows one area carries only that one: import the area's file, or ask \`loadArea\` of the \`areas\` entry for it. This file is only the list.
import type { ContextArea } from "./context.ts";
${Object.keys(areas).map((k) => `import { ${symbol(k)} } from "./cityctx.${k}.data.ts";`).join("\n")}

export { ${Object.keys(areas).map(symbol).join(", ")} };

/** Every area, by key. */
export const CITYCTX_AREAS: Readonly<Record<string, ContextArea>> = { ${Object.keys(areas).map((k) => `${JSON.stringify(k)}: ${symbol(k)}`).join(", ")} };
`;
writeFileSync(new URL("../src/cityctx.data.ts", import.meta.url), join);
console.log("src/cityctx.data.ts written");
