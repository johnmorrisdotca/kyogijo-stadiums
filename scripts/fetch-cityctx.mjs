// Fetches what the city round a district is made from and keeps it, dated, under data-sources/cityctx/<date>/ (`pnpm cityctx:fetch [date]`). It needs the network and is not part of `pnpm check`; run it when an area is
// added to scripts/cityctx.data.json, then `pnpm cityctx` makes src/cityctx.data.ts. Every file says where it came from and under what terms; the three sources are never mixed in one file.
//
//   osm-<area>.json            OpenStreetMap through the Overpass API: the buildings (with height, levels and roof tags), the streets, the water, the parks and woods, the single trees. ODbL 1.0, "(c) OpenStreetMap contributors".
//   seattle-outlines-<area>    City of Seattle, "Building Outlines 2015" (the roof outlines the City's 3D building shells are made from; roof apex elevation in feet): the City's Open Data Policy says a dataset on its
//                              portal is free of any licence requirement or restriction on use, and that a third party shows the source, the version and what it changed. The City gives no warranty.
//   seattle-trees-<area>       City of Seattle, "Combined Tree Point" (street and park trees: place, diameter at breast height). Same terms.
//   seattle-ground-<area>      USGS 3DEP elevation (metres, public domain) at the points the building heights need, from the National Map's ImageServer.
//   vancouver-trees-<area>     City of Vancouver open data, "Public trees" (place and diameter). Open Government Licence - Vancouver.
//   nyc-footprints-<area>      City of New York, Building Footprints (NYC Open Data, dataset 5zhs-2jue: outline, roof height above ground in feet, ground elevation in feet, construction year). NYC's Open Data Law (Administrative
//                              Code 23-502) puts no registration, licence or restriction on use on a public data set; the City may ask that the source and the version be named and what was changed said. No warranty.
//
// One request at a time, a pause after it, a User-Agent that names the project and a way to reach its author, a back-off on 429 and 5xx. A file that is already there is not fetched again.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { setTimeout } from "node:timers";
import { URL } from "node:url";

const config = JSON.parse(readFileSync(new URL("./cityctx.data.json", import.meta.url), "utf8"));
const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const only = process.argv[3]?.split(",");
const out = new URL(`../data-sources/cityctx/${day}/`, import.meta.url);
mkdirSync(out, { recursive: true });
const USER_AGENT = "kyogijo-venues/0.1 (https://github.com/johnmorrisdotca/kyogijo-stadiums; john@johnmorris.ca)";
const GATEWAYS = ["https://overpass-api.de/api/interpreter", "https://lambert.openstreetmap.de/api/interpreter"];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SEATTLE_OUTLINES = "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Building_Outline_2015/FeatureServer/0/query";
const SEATTLE_TREES = "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Combined_Tree_Point/FeatureServer/0/query";
const SAMPLES = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples";
const VANCOUVER = "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets";
const NYC_FOOTPRINTS = "https://data.cityofnewyork.us/resource/5zhs-2jue.json";

async function get(url, init = {}, tries = 6) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    try {
      const response = await fetch(url, { ...init, headers: { "user-agent": USER_AGENT, ...(init.headers ?? {}) } });
      const text = await response.text();
      if (response.ok) return text;
      console.log(`${response.status} from ${url.slice(0, 90)}, waiting`);
    } catch (error) {
      console.log(`${String(error).slice(0, 80)}, waiting`);
    }
    await pause(20000 * (1 + attempt));
  }
  throw new Error(`no answer from ${url.slice(0, 120)}`);
}

const meta = (area, extra) => ({ read: day, area: area.id, origin: area.origin, radius: area.radius, ...extra });

// ---- OpenStreetMap. ----
function osmQuery(area) {
  const around = `(around:${area.radius},${area.origin[1]},${area.origin[0]})`;
  if (area.kind === "city") {
    // The city view keeps the streets (not the service lanes), the water, the big parks and woods, and only the tall buildings OpenStreetMap tags (the City's outlines carry the rest).
    // (A view several kilometres wide keeps the main streets only: the side streets would be noise from so far, and Overpass would not answer for them.)
    const streets = area.radius > 3500 ? "motorway|trunk|primary|secondary|tertiary|motorway_link|trunk_link|primary_link|secondary_link" : "motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|motorway_link|trunk_link|primary_link|secondary_link";
    return `[out:json][timeout:240];(way["highway"~"^(${streets})$"]${around};way["railway"="rail"]${around};way["natural"~"^(water|bay|coastline|wood)$"]${around};way["waterway"~"^(riverbank|dock)$"]${around};rel["type"="multipolygon"]["natural"="water"]${around};way["leisure"~"^(park|garden)$"]${around};rel["type"="multipolygon"]["leisure"="park"]${around};way["building"]["building:levels"~"^([6-9]|[1-9][0-9])$"]${around};way["building"]["height"~"^[0-9]{2,3}"]${around};way["building"="stadium"]${around};);out geom;`;
  }
  if (area.kind === "nature") return `[out:json][timeout:240];(node["natural"="tree"]${around};way["natural"="tree_row"]${around};);out geom;`;
  return `[out:json][timeout:240];(way["building"]${around};rel["building"]${around};way["highway"]${around};way["railway"]${around};way["natural"~"^(water|bay|coastline|wood|scrub|grassland)$"]${around};way["waterway"~"^(riverbank|dock)$"]${around};rel["type"="multipolygon"]["natural"="water"]${around};way["leisure"~"^(park|garden|playground|pitch|common)$"]${around};way["landuse"~"^(grass|forest|recreation_ground|meadow)$"]${around};way["place"="square"]${around};way["amenity"="parking"]${around};node["natural"="tree"]${around};way["natural"="tree_row"]${around};);out geom;`;
}

async function osm(area) {
  const file = new URL(`osm-${area.id}.json`, out);
  if (existsSync(file)) return;
  const query = osmQuery(area);
  let gateway = 0;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const url = GATEWAYS[gateway % GATEWAYS.length];
    try {
      const response = await fetch(url, { method: "POST", headers: { "user-agent": USER_AGENT, "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: `data=${encodeURIComponent(query)}` });
      const text = await response.text();
      if (response.ok && text.startsWith("{")) {
        const json = JSON.parse(text);
        if (json.remark === undefined || !/runtime error|timed out/i.test(json.remark)) {
          writeFileSync(file, `${JSON.stringify({ ...meta(area, { licence: "ODbL 1.0, (c) OpenStreetMap contributors, openstreetmap.org/copyright", gateway: url, query, osmBase: json.osm3s?.timestamp_osm_base }), elements: json.elements })}\n`);
          console.log(`${area.id}: OpenStreetMap, ${json.elements.length} elements`);
          await pause(10000);
          return;
        }
      }
      console.log(`${area.id}: ${response.status} from ${url}, waiting`);
    } catch (error) {
      console.log(`${area.id}: ${String(error).slice(0, 80)}, waiting`);
    }
    gateway += 1;
    await pause(30000 * (1 + Math.floor(attempt / 2)));
  }
  console.log(`${area.id}: OpenStreetMap gave no answer, run again later`);
}

// ---- The City of Seattle. ----
async function arcgisAll(url, area, extra) {
  const features = [];
  for (let offset = 0; ; offset += 2000) {
    const params = new URLSearchParams({ f: "json", geometryType: "esriGeometryPoint", geometry: `${area.origin[0]},${area.origin[1]}`, inSR: "4326", distance: String(area.radius), units: "esriSRUnit_Meter", spatialRel: "esriSpatialRelIntersects", returnGeometry: "true", outSR: "4326", geometryPrecision: "6", resultOffset: String(offset), resultRecordCount: "2000", orderByFields: "OBJECTID", ...extra });
    const json = JSON.parse(await get(`${url}?${params}`));
    if (json.error !== undefined) throw new Error(JSON.stringify(json.error));
    features.push(...json.features);
    if (json.exceededTransferLimit !== true) break;
    await pause(1500);
  }
  return features;
}

async function seattle(area) {
  const outlines = new URL(`seattle-outlines-${area.id}.json`, out);
  if (!existsSync(outlines)) {
    // The city view keeps the buildings that matter from far: wide ones (Shape__Area is in square feet) and tall ones; a detail area keeps every building.
    const where = area.kind === "city" ? "BP99_TYPE IN ('BLD','UNK','U_C','OBS') AND (Shape__Area >= 10000 OR BP99_APEX >= 330)" : "BP99_TYPE IN ('BLD','UNK','U_C','OBS','GAR')";
    const features = await arcgisAll(SEATTLE_OUTLINES, area, { where, outFields: "BP99_TYPE,BP99_APEX,BP99_BLDGKEY,YEARUPDATED,Shape__Area" });
    writeFileSync(outlines, `${JSON.stringify({ ...meta(area, { source: "City of Seattle, Building Outlines 2015 (BLDG2015_PLGN), https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Building_Outline_2015/FeatureServer", licence: "City of Seattle Open Data Policy (V1.0, 2016-02-01): no licence requirement or restriction on use on datasets of its Open Data Portal; show the source and version and say what was changed. No warranty of accuracy (the City's own disclaimer).", where, units: "BP99_APEX is the roof apex elevation in feet above sea level (NAVD88); the geometry is WGS 84 degrees", note: "Edited by Kyogijo Stadiums; not made by the City of Seattle." }), features })}\n`);
    console.log(`${area.id}: Seattle outlines, ${features.length} features`);
    await pause(3000);
  }
  const trees = new URL(`seattle-trees-${area.id}.json`, out);
  // (The city view is too wide to show single trees: it has none.)
  if (area.kind !== "city" && !existsSync(trees)) {
    const features = await arcgisAll(SEATTLE_TREES, area, { where: "1=1", outFields: "SOURCE_DEPT,DBH,COMMON_NAME" });
    writeFileSync(trees, `${JSON.stringify({ ...meta(area, { source: "City of Seattle, Combined Tree Point, https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Combined_Tree_Point/FeatureServer", licence: "City of Seattle Open Data Policy: no restriction on use; show the source and version and say what was changed. No warranty of accuracy.", units: "DBH in inches" }), features })}\n`);
    console.log(`${area.id}: Seattle trees, ${features.length} features`);
    await pause(3000);
  }
}

// ---- Ground elevation under Seattle's buildings (USGS 3DEP, public domain). ----
async function ground(area) {
  const file = new URL(`seattle-ground-${area.id}.json`, out);
  const outlines = new URL(`seattle-outlines-${area.id}.json`, out);
  if (existsSync(file) || !existsSync(outlines)) return;
  const { features } = JSON.parse(readFileSync(outlines, "utf8"));
  // The lowest of the footprint's corners and its middle: what the building stands on is its downhill side.
  const points = [];
  for (const f of features) {
    const ring = f.geometry?.rings?.[0];
    if (ring === undefined) continue;
    const mid = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
    const step = Math.max(1, Math.floor(ring.length / 4));
    const picks = [mid, ...ring.filter((_, i) => i % step === 0).slice(0, 4)];
    points.push(picks.map((p) => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6]));
  }
  const heights = [];
  const flat = points.flat();
  for (let i = 0; i < flat.length; i += 400) {
    const chunk = flat.slice(i, i + 400);
    const body = new URLSearchParams({ f: "json", geometryType: "esriGeometryMultipoint", geometry: JSON.stringify({ points: chunk, spatialReference: { wkid: 4326 } }), returnFirstValueOnly: "true", interpolation: "RSP_BilinearInterpolation", sampleCount: String(chunk.length) });
    const json = JSON.parse(await get(SAMPLES, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body }));
    if (json.samples === undefined) throw new Error(`3DEP gave no samples: ${JSON.stringify(json).slice(0, 200)}`);
    // The answers do NOT come back in the order asked: each carries the index of its point in `locationId`.
    const here = new Array(chunk.length).fill(null);
    for (const s of json.samples) here[Number(s.locationId)] = s.value === "NoData" || s.value === undefined || s.value === "" ? null : Number(s.value);
    heights.push(...here);
    await pause(800);
  }
  writeFileSync(file, `${JSON.stringify({ ...meta(area, { source: "USGS 3D Elevation Program (3DEP), https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer", licence: "US Government work, public domain; USGS asks for credit", units: "metres above sea level (NAVD88), bilinear", pointsPerBuilding: "the middle and up to four corners, in the order of the outlines file; each answer is put back at the index its locationId names" }), perBuilding: points.map((p) => p.length), elevations: heights })}\n`);
  console.log(`${area.id}: 3DEP, ${heights.length} elevations`);
}

// ---- The City of Vancouver. ----
async function vancouverAll(dataset, area, select, where) {
  const rows = [];
  for (let offset = 0; ; offset += 100) {
    const p = new URLSearchParams({ select, limit: "100", offset: String(offset), where: `within_distance(geo_point_2d, geom'POINT(${area.origin[0]} ${area.origin[1]})', ${area.radius}m)${where === undefined ? "" : ` and ${where}`}` });
    const json = JSON.parse(await get(`${VANCOUVER}/${dataset}/records?${p}`));
    rows.push(...json.results);
    if (json.results.length < 100 || offset >= 9900) break;
    await pause(600);
  }
  return rows;
}

async function vancouver(area) {
  const trees = new URL(`vancouver-trees-${area.id}.json`, out);
  if (!existsSync(trees)) {
    const rows = await vancouverAll("public-trees", area, "asset_id,genus_name,height_m,diameter_cm,geo_point_2d");
    writeFileSync(trees, `${JSON.stringify({ ...meta(area, { source: "City of Vancouver open data, Public trees, https://opendata.vancouver.ca/explore/dataset/public-trees/", licence: "Open Government Licence - Vancouver: free to use, credit the City of Vancouver", units: "height in metres, diameter in centimetres" }), rows })}\n`);
    console.log(`${area.id}: Vancouver trees, ${rows.length} rows`);
  }
}

// ---- The City of New York. ----
async function nyc(area) {
  const file = new URL(`nyc-footprints-${area.id}.json`, out);
  if (existsSync(file)) return;
  const rows = [];
  for (let offset = 0; ; offset += 5000) {
    const p = new URLSearchParams({ $select: "bin,height_roof,ground_elevation,construction_year,feature_code,last_status_type,the_geom", $where: `within_circle(the_geom, ${area.origin[1]}, ${area.origin[0]}, ${area.radius + 80})`, $order: "bin", $limit: "5000", $offset: String(offset) });
    const page = JSON.parse(await get(`${NYC_FOOTPRINTS}?${p}`));
    rows.push(...page);
    if (page.length < 5000) break;
    await pause(1500);
  }
  writeFileSync(file, `${JSON.stringify({ ...meta(area, { source: "City of New York, Building Footprints (NYC Open Data, dataset 5zhs-2jue, Office of Technology and Innovation), https://data.cityofnewyork.us/resource/5zhs-2jue", licence: "NYC Open Data: public data set under the Open Data Law (Administrative Code 23-502), no registration, licence or restriction on use; the source and the version are named and changes said; no warranty of accuracy", units: "height_roof and ground_elevation in feet" }), rows })}\n`);
  console.log(`${area.id}: New York footprints, ${rows.length} rows`);
  await pause(3000);
}

for (const area of config.areas) {
  if (only !== undefined && !only.includes(area.id)) continue;
  if (area.city === "seattle") {
    await seattle(area);
    await ground(area);
  } else if (area.city === "nyc") await nyc(area);
  else if (area.city === "vancouver") await vancouver(area);
  await osm(area);
}
process.exit(0);
