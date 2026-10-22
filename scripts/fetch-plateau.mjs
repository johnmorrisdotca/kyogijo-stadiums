// Fetches the buildings round a district from Project PLATEAU (the Ministry of Land, Infrastructure, Transport and Tourism's 3D city models of Japan) and keeps what the package is drawn from, dated, under
// data-sources/plateau/<date>/ (`pnpm plateau:fetch [date]`). It needs the network and is not part of `pnpm check`; run it when an area is added or PLATEAU publishes a new edition.
//
// The dataset is the CityGML of Bunkyo ward, 2025 edition (spec 5.0), published on the G-Spatial Information Center and in PLATEAU's data catalog. Its whole zip is 640 MB, so the zip is not downloaded: its
// directory is read with a range request, and only the few building files (one per third mesh the area touches, 40 to 60 MB of XML each, 2 to 5 MB compressed) are fetched, one request each. Nothing is
// written but the extract: for each building whose middle lies within the area's radius, the fields the drawing is made from, as PLATEAU gives them (the outline of the roof's edge at full precision, the height
// the model measured, the storeys, the use, the height of the LOD1 block, and for a building that has a LOD2 shape, the heights and the slopes of its roof surfaces).
//
// Licence: the PLATEAU Site Policy (https://www.mlit.go.jp/plateau/site-policy/), clause 3. Free for anyone to use, commercial use included; compatible with Creative Commons Attribution 4.0 (CC BY 4.0) and the
// Public Data License 1.0; the source must be credited, and what is edited must say that it was. The copyright of the data of a ward belongs to the ward's local government. The extract says so, and NOTICE.md
// carries the credit. It is kept apart from every other file here: it is neither CC0 nor ODbL.
import { Buffer } from "node:buffer";
import { mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { inflateRawSync } from "node:zlib";

/** The areas to extract: a name, the middle and the radius in metres. Add one for a new district; a new edition of the data is a new dated folder. */
const AREAS = {
  "tokyo-dome-city": { name: "Tokyo Dome City, Bunkyo", centre: [139.7518, 35.7048], radius: 500 },
};
const DATASET = {
  ward: "Bunkyo ward, Tokyo (13105)",
  edition: "2025, product specification 5.0",
  zip: "https://assets.cms.plateau.reearth.io/assets/4b/ac4a9f-1bdf-4978-bbfa-8ba8a80d12a0/13105_bunkyo-ku_pref_2025_citygml_1_op.zip",
  page: "https://www.geospatial.jp/ckan/dataset/plateau-13105-bunkyo-ku-2025",
  catalog: "https://api.plateauview.mlit.go.jp/datacatalog/plateau-datasets",
  creator: "Ministry of Land, Infrastructure, Transport and Tourism (MLIT), Urban Bureau, Project PLATEAU",
};
const LICENCE = "PLATEAU Site Policy clause 3 (https://www.mlit.go.jp/plateau/site-policy/): free use including commercial, compatible with CC BY 4.0 and the Public Data License 1.0; credit the source and say what was edited";
const USER_AGENT = "kyogijo-venues/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";

const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const out = new URL(`../data-sources/plateau/${day}/`, import.meta.url);
mkdirSync(out, { recursive: true });

// ---- A zip read by range requests. ----
const range = async (from, to) => {
  const response = await fetch(DATASET.zip, { headers: { range: `bytes=${from}-${to}`, "user-agent": USER_AGENT } });
  if (response.status !== 206) throw new Error(`the server did not answer a range request (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
};
const head = await fetch(DATASET.zip, { method: "HEAD", headers: { "user-agent": USER_AGENT } });
const size = Number(head.headers.get("content-length"));
if (!Number.isFinite(size) || size <= 0) throw new Error("no length for the zip");

// The end of the central directory, then the directory itself.
const tail = await range(size - 65557, size - 1);
const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0) throw new Error("no end of central directory");
const [entries, directorySize, directoryAt] = [tail.readUInt16LE(eocd + 10), tail.readUInt32LE(eocd + 12), tail.readUInt32LE(eocd + 16)];
if (directoryAt === 0xffffffff) throw new Error("a zip64 archive: not handled");
const directory = await range(directoryAt, directoryAt + directorySize - 1);
const files = new Map();
for (let at = 0, i = 0; i < entries; i += 1) {
  const [method, compressed, uncompressed, nameLength, extraLength, commentLength, local] = [directory.readUInt16LE(at + 10), directory.readUInt32LE(at + 20), directory.readUInt32LE(at + 24), directory.readUInt16LE(at + 28), directory.readUInt16LE(at + 30), directory.readUInt16LE(at + 32), directory.readUInt32LE(at + 42)];
  files.set(directory.toString("utf8", at + 46, at + 46 + nameLength), { method, compressed, uncompressed, local });
  at += 46 + nameLength + extraLength + commentLength;
}
const entryText = async (name) => {
  const e = files.get(name);
  if (e === undefined) return undefined;
  const header = await range(e.local, e.local + 29);
  const start = e.local + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
  const data = await range(start, start + e.compressed - 1);
  return (e.method === 0 ? data : inflateRawSync(data)).toString("utf8");
};

// ---- The third mesh (the 1 km by 1.1 km cell the files are named by) of a longitude and a latitude. ----
const meshOf = (lon, lat) => {
  const [p, a] = [Math.floor(lat * 1.5), (lat * 1.5) % 1];
  const [u, b] = [Math.floor(lon) - 100, lon % 1];
  const [q, c] = [Math.floor(a * 8), (a * 8) % 1];
  const [v, d] = [Math.floor(b * 8), (b * 8) % 1];
  return `${p}${u}${q}${v}${Math.floor(c * 10)}${Math.floor(d * 10)}`;
};
const RAD = Math.PI / 180;
const EARTH = 6371008.8;
const metres = ([lon, lat], [lon0, lat0]) => [(lon - lon0) * RAD * EARTH * Math.cos(lat0 * RAD), (lat - lat0) * RAD * EARTH];

// ---- What a building gives. ----
const nums = (text) => text.trim().split(/\s+/).map(Number);
const rings = (xml) => [...xml.matchAll(/<gml:posList>([^<]+)<\/gml:posList>/g)].map((m) => nums(m[1]));
const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits;

function roofOf(xml) {
  const surfaces = [...xml.matchAll(/<bldg:RoofSurface\b[^>]*>([\s\S]*?)<\/bldg:RoofSurface>/g)].map((m) => rings(m[1]).filter((r) => r.length >= 9));
  if (surfaces.length === 0) return undefined;
  // Each roof surface: its area and the slope of its plane (the vertical share of its normal) by Newell's method, on points in metres.
  const parts = [];
  for (const polygons of surfaces) {
    for (const r of polygons) {
      const pts = [];
      for (let i = 0; i + 2 < r.length; i += 3) pts.push([r[i + 1], r[i], r[i + 2]]);
      const [lon0, lat0] = pts[0];
      const flat = pts.map(([lon, lat, z]) => [...metres([lon, lat], [lon0, lat0]), z]);
      let [nx, ny, nz] = [0, 0, 0];
      flat.forEach(([x, y, z], i) => {
        const [x2, y2, z2] = flat[(i + 1) % flat.length];
        nx += (y - y2) * (z + z2);
        ny += (z - z2) * (x + x2);
        nz += (x - x2) * (y + y2);
      });
      const len = Math.hypot(nx, ny, nz);
      if (len < 1e-6) continue;
      parts.push({ area: len / 2, up: Math.abs(nz) / len, zs: flat.map((p) => p[2]) });
    }
  }
  if (parts.length === 0) return undefined;
  const area = parts.reduce((s, p) => s + p.area, 0);
  const slanted = parts.filter((p) => p.up < 0.95);
  const slantedArea = slanted.reduce((s, p) => s + p.area, 0);
  const zs = parts.flatMap((p) => p.zs);
  const sz = slanted.flatMap((p) => p.zs);
  return {
    surfaces: parts.length,
    zMin: round(Math.min(...zs), 2),
    zMax: round(Math.max(...zs), 2),
    slantedShare: round(slantedArea / area, 3),
    slantedZMin: sz.length === 0 ? null : round(Math.min(...sz), 2),
    slantedZMax: sz.length === 0 ? null : round(Math.max(...sz), 2),
  };
}

function buildingOf(id, xml) {
  const edge = /<bldg:lod0RoofEdge>[\s\S]*?<gml:exterior>[\s\S]*?<gml:posList>([^<]+)<\/gml:posList>/.exec(xml);
  if (edge === null) return undefined;
  const flat = nums(edge[1]);
  const ring = [];
  for (let i = 0; i + 1 < flat.length; i += 3) ring.push([round(flat[i + 1], 7), round(flat[i], 7)]);
  if (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]) ring.pop();
  const read = (tag) => {
    const m = new RegExp(`<bldg:${tag}\\b[^>]*>([^<]*)<`).exec(xml);
    return m === null ? null : Number(m[1]);
  };
  const lod1 = /<bldg:lod1Solid>([\s\S]*?)<\/bldg:lod1Solid>/.exec(xml);
  const zs = lod1 === null ? [] : rings(lod1[1]).flatMap((r) => r.filter((_, i) => i % 3 === 2));
  const lod2 = /<bldg:lod2Solid>/.test(xml);
  return {
    id,
    height: read("measuredHeight"),
    storeys: read("storeysAboveGround"),
    usage: /<bldg:usage\b[^>]*>(\d+)</.exec(xml)?.[1] ?? null,
    lod1: zs.length === 0 ? null : { base: round(Math.min(...zs), 3), top: round(Math.max(...zs), 3) },
    ring,
    ...(lod2 ? { lod2Roof: roofOf(xml) ?? null } : {}),
  };
}

// ---- Run. ----
for (const [key, area] of Object.entries(AREAS)) {
  const span = [area.radius / (EARTH * RAD), area.radius / (EARTH * RAD * Math.cos(area.centre[1] * RAD))];
  const corners = [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => meshOf(area.centre[0] + b * span[1], area.centre[1] + a * span[0]));
  const meshes = [...new Set(corners)].sort();
  const buildings = [];
  const read = [];
  for (const mesh of meshes) {
    const name = `udx/bldg/${mesh}_bldg_6697_op.gml`;
    if (!files.has(name)) {
      console.log(`${mesh}: not in the dataset (outside the ward)`);
      continue;
    }
    console.log(`${mesh}: reading ${(files.get(name).compressed / 1e6).toFixed(1)} MB (${(files.get(name).uncompressed / 1e6).toFixed(0)} MB of XML)`);
    const xml = await entryText(name);
    read.push({ file: name, bytes: files.get(name).uncompressed });
    for (const m of xml.matchAll(/<bldg:Building gml:id="([^"]+)">([\s\S]*?)<\/bldg:Building>/g)) {
      const b = buildingOf(m[1], m[2]);
      if (b === undefined) continue;
      const middle = [b.ring.reduce((s, p) => s + p[0], 0) / b.ring.length, b.ring.reduce((s, p) => s + p[1], 0) / b.ring.length];
      const [east, north] = metres(middle, area.centre);
      if (Math.hypot(east, north) <= area.radius) buildings.push(b);
    }
  }
  buildings.sort((a, b) => (a.id < b.id ? -1 : 1));
  const extract = {
    read: day,
    area: key,
    name: area.name,
    centre: area.centre,
    radius: area.radius,
    dataset: DATASET,
    licence: LICENCE,
    attribution: "Project PLATEAU, Ministry of Land, Infrastructure, Transport and Tourism (MLIT), https://www.mlit.go.jp/plateau/ (3D city model of Bunkyo ward, 2025 edition). Simplified and edited by Kyogijo Stadiums; not made by MLIT.",
    note: "The building outlines are the roof edges (bldg:lod0RoofEdge) in WGS 84, longitude and latitude. `height` is bldg:measuredHeight in metres above the building's ground; `lod1` is the block's lowest and highest z as the file gives them (metres above the ellipsoid), which is not always the height; `lod2Roof` summarises the roof surfaces of a building that has a LOD2 shape. Only the buildings whose middle is within `radius` metres of `centre` are kept.",
    meshes: read,
    count: buildings.length,
    buildings,
  };
  const body = JSON.stringify(extract, null, 0).replace(/\},\{"id"/g, "},\n{\"id\"").replace(/"buildings":\[/, '"buildings":[\n');
  writeFileSync(new URL(`${key}.json`, out), `${body}\n`);
  console.log(`${key}.json written: ${buildings.length} buildings, ${(body.length / 1024).toFixed(0)} KB`);
}
