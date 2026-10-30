// Writes src/stadiums.data.ts, src/stadiums.osm.data.ts and the table of docs/stadiums.md from scripts/stadiums.data.json and the dated files under data-sources/stadiums/ (`pnpm stadiums`).
//
// The two data files are kept apart because their licences are, as the venues' are (scripts/build-venues.mjs): src/stadiums.data.ts holds facts (the seats of each configuration, the number of bowls, the kind of
// roof) with the Wikidata item or the English Wikipedia article and revision each was read from, and no text; src/stadiums.osm.data.ts holds what was read from OpenStreetMap (a building's outline, the roof, the
// pitches and the infield where they are mapped), which is ODbL 1.0 data, "(c) OpenStreetMap contributors", and says so at its head and on every entry. Nothing else is copied. The way the field lies is worked out
// from the roof's opening, the pitch or the infield (and, for a ballpark, the outline) and is a derived fact of the same data. See docs/stadiums.md and NOTICE.md.
//
// The raw responses (`pnpm stadiums:fetch`) stay in data-sources/stadiums/<date>/ as they were returned, and this script reads the newest date (or the one given: `pnpm stadiums 2026-10-20`).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { URL } from "node:url";
import { areaOf, centroidOf, coreOf, edgeDistance, inside, lonLatFrom, metresFrom, middleOf, simplified, smallestBox } from "../src/venues.geo.ts";

/** The distance from a point to the nearest edge of a polygon. */
const edgeDistanceTo = (poly, p) => edgeDistance(poly, p);

const read = (name) => JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url), "utf8"));
const source = read("stadiums.data.json");
const grounds = read("grounds.data.json");
const parks = read("parks.data.json");
const root = new URL("../data-sources/stadiums/", import.meta.url);
const day = process.argv[2] ?? readdirSync(root).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().at(-1);
if (day === undefined) throw new Error("no data-sources/stadiums/<date>/ to read: run `pnpm stadiums:fetch` first");
const dir = new URL(`${day}/`, root);
// A stadium added on a later day has its own OpenStreetMap file in that day's folder (with the day's whole Wikidata and Wikipedia files, which hold every stadium); a stadium of an earlier day keeps its own folder.
const days = readdirSync(root).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().reverse().filter((name) => name <= day);
const load = (name) => JSON.parse(readFileSync(new URL(name, existsSync(new URL(name, dir)) ? dir : new URL(`${days.find((d) => existsSync(new URL(`${d}/${name}`, root)))}/`, root)), "utf8"));
const wikidata = load("wikidata.json").entities;
const wikipediaFile = load("wikipedia.json");
const wikipedia = wikipediaFile.articles;
const wikipediaJa = wikipediaFile.articlesJa ?? {};
const fail = (message) => {
  throw new Error(message);
};

const BASES = ["documented", "plausible"];
const ROOFS = ["cable", "fixed", "canopy", "panels", "dome", "open"];
const SOURCES = ["wikipedia", "wikidata"];
const CONFIGS = { stadium: ["cfl", "nfl", "soccer"], park: ["mlb"], hall: ["boxing", "nba"] };
/** The least and the most seats a configuration of each kind has. */
const SEATS = { stadium: [20000, 100000], park: [20000, 100000], hall: [1000, 5000], arena: [10000, 25000] };
/** The range a configuration is held to: an arena's court is a hall of its own size. */
const seatsRange = (kind, key) => (kind === "hall" && key === "nba" ? SEATS.arena : SEATS[kind]);
const SPORT_OF_TAG = { american_football: ["nfl", "cfl"], canadian_football: ["cfl"], soccer: ["soccer"], baseball: ["mlb"] };
const stadiums = source.stadiums;
const kindOf = (v) => v.kind ?? "stadium";

/** The capacities of an item as Wikidata gives them (P1083). */
const capacities = (entity) => (entity.claims?.P1083 ?? []).map((claim) => Number(claim.mainsnak?.datavalue?.value?.amount));
/** The numbers of an infobox's capacity line, in the order it lists them. */
const listed = (line) => [...(line ?? "").matchAll(/\d{1,3}(?:,\d{3})+/g)].map((m) => Number(m[0].replace(/,/g, "")));
const grouped = (n) => n.toLocaleString("en-US");

const ids = new Set();
const facts = [];
for (const v of stadiums) {
  if (ids.has(v.id)) fail(`${v.id} is listed twice`);
  ids.add(v.id);
  const kind = kindOf(v);
  const item = wikidata[v.wikidata];
  if (item === undefined || item.missing !== undefined) fail(`${v.id}: Wikidata has no ${v.wikidata}`);
  // A hall is not in the package's grounds or parks: its names are Wikidata's labels and its place Wikidata's coordinates.
  if (kind === "hall") {
    if (v.names === undefined || v.names.en !== item.labels?.en?.value || v.names.ja !== item.labels?.ja?.value) fail(`${v.id}: the names are not the item's labels (${item.labels?.en?.value}, ${item.labels?.ja?.value})`);
    const at = item.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
    if (at === undefined || Math.abs(at.latitude - v.lat) > 5e-4 || Math.abs(at.longitude - v.lon) > 5e-4) fail(`${v.id}: the coordinates are not the item's`);
    if (typeof v.city !== "string" || typeof v.country !== "string") fail(`${v.id}: a hall has a city and a country`);
  }
  const place = kind === "hall" ? { name: v.names?.en, city: v.city, country: v.country } : kind === "park" ? parks.find((p) => p.id === v.park) : grounds.find((g) => g.id === v.ground);
  if (place === undefined) fail(`${v.id}: ${v.park ?? v.ground} is not a ${kind === "park" ? "park" : "ground"} of the package`);
  if (kind !== "hall") {
    if (place.wikidata !== v.wikidata) fail(`${v.id}: ${v.wikidata} is not the place's item (${place.wikidata})`);
    if (Math.abs(place.lat - v.lat) > 1e-4 || Math.abs(place.lon - v.lon) > 1e-4) fail(`${v.id}: the coordinates are not the place's`);
  }
  if (item.sitelinks?.enwiki?.title !== v.en.title) fail(`${v.id}: the item's English article is ${item.sitelinks?.enwiki?.title}, not ${v.en.title}`);
  const article = wikipedia[v.id];
  if (article === undefined || article.title !== v.en.title) fail(`${v.id}: the archive has no article ${v.en.title}`);
  if (article.revision !== v.en.revision) fail(`${v.id}: the facts cite revision ${v.en.revision} but the archive read ${article.revision}`);
  // The Japanese article a fact cites, at its revision, and the words of either article that a fact leans on (kept sentences of the archive).
  if (v.ja !== undefined) {
    const ja = wikipediaJa[v.id];
    if (ja === undefined || ja.title !== v.ja.title) fail(`${v.id}: the archive has no Japanese article ${v.ja.title}`);
    if (ja.revision !== v.ja.revision) fail(`${v.id}: the facts cite Japanese revision ${v.ja.revision} but the archive read ${ja.revision}`);
    if (item.sitelinks?.jawiki?.title !== v.ja.title) fail(`${v.id}: the item's Japanese article is ${item.sitelinks?.jawiki?.title}, not ${v.ja.title}`);
  }
  for (const [language, phrases] of Object.entries(v.evidence ?? {})) {
    const kept = (language === "ja" ? wikipediaJa[v.id]?.sentences : article.sentences)?.join(" ") ?? "";
    for (const phrase of phrases) if (!kept.includes(phrase)) fail(`${v.id}: "${phrase}" is not in the ${language} article's kept sentences`);
  }
  if (v.looks !== undefined) for (const [key, read] of Object.entries(v.looks)) if (!["ivyWalls", "dirtInfield", "brickWalls"].includes(key) || typeof read !== "string" || read === "") fail(`${v.id}: looks.${key}`);
  const numbers = listed(article.infoboxCapacity);
  const keys = Object.keys(v.configs);
  if (keys.length === 0 || !keys.every((key) => CONFIGS[kind].includes(key))) fail(`${v.id}: configurations ${keys.join(", ")}`);
  for (const key of keys) {
    const c = v.configs[key];
    if (c.sport !== key) fail(`${v.id}: configuration ${key}`);
    if (!(Number.isInteger(c.seats) && c.seats > seatsRange(kind, key)[0] && c.seats < seatsRange(kind, key)[1])) fail(`${v.id}/${key}: seats`);
    if (!SOURCES.includes(c.source) || typeof c.read !== "string" || c.read === "") fail(`${v.id}/${key}: source and read`);
    // A figure is on the infobox's capacity line (or is Wikidata's, where it says so).
    if (!(c.source === "wikidata" ? capacities(item).includes(c.seats) : numbers.includes(c.seats))) fail(`${v.id}/${key}: ${c.seats} is not what ${c.source} gives (${c.source === "wikidata" ? capacities(item).join(", ") : numbers.join(", ")})`);
  }
  if (v.bowlSeats !== undefined && !(Number.isInteger(v.bowlSeats) && v.bowlSeats >= Math.max(...keys.map((k) => v.configs[k].seats)))) fail(`${v.id}: bowlSeats`);
  if (kind === "stadium" && !["cfl", "nfl"].includes(v.gridiron ?? "cfl")) fail(`${v.id}: gridiron`);
  const { tiers, roof } = v;
  if (![1, 2, 3, 4].includes(tiers.count) || !BASES.includes(tiers.basis) || typeof tiers.read !== "string") fail(`${v.id}: tiers`);
  if (tiers.lowerSeats !== undefined && !(tiers.count > 1 && (numbers.includes(tiers.lowerSeats) || article.sentences.join(" ").includes(grouped(tiers.lowerSeats))) && (kind === "hall" ? tiers.lowerSeats < (v.bowlSeats ?? Infinity) : tiers.lowerSeats < Math.min(...keys.map((k) => v.configs[k].seats)) * 0.8))) fail(`${v.id}: lowerSeats must be on the infobox's line (or in the article's sentences) and under 80 percent of every configuration's (a hall's: under the bowl's seats)`);
  // A ballpark's tiers by their seats: each figure is in the article's sentences, and they add up to within 5 percent of the capacity (some places are standing ones and the like).
  if (tiers.tierSeats !== undefined) {
    const prose = article.sentences.join(" ");
    const total = Object.values(tiers.tierSeats).reduce((a, b) => a + b, 0);
    if (Math.abs(total - Math.max(...keys.map((k) => v.configs[k].seats))) / total > 0.05) fail(`${v.id}: the tiers hold ${total}, not about the capacity`);
    if (tiers.read.match(/\d{1,3}(?:,\d{3})+/g)?.some((n) => !prose.includes(n))) fail(`${v.id}: a figure of tiers.read is not in the article's sentences`);
  }
  if (!ROOFS.includes(roof.kind) || !BASES.includes(roof.basis) || typeof roof.read !== "string") fail(`${v.id}: roof`);
  facts.push({ ...v, wikidataSeats: capacities(item) });
}

// ---- What OpenStreetMap gave. ----
const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;
const closed = (g) => Array.isArray(g) && g.length > 3 && g[0].lat === g.at(-1).lat && g[0].lon === g.at(-1).lon;
const ringOf = (g) => g.slice(0, -1).map((p) => [p.lon, p.lat]);
const lonlat6 = (ring) => ring.map(([lon, lat]) => [round(lon, 6), round(lat, 6)]);
const same = (a, b) => a.lat === b.lat && a.lon === b.lon;
/** The outer ways of a relation joined end to end into closed rings (a ring may be several ways, each the next one's start): a way already closed is a ring of its own. */
function chained(members) {
  const rings = members.filter((m) => closed(m.geometry)).map((m) => ({ ref: m.ref, geometry: m.geometry }));
  const open = members.filter((m) => !closed(m.geometry) && m.geometry.length > 1).map((m) => ({ ref: m.ref, geometry: [...m.geometry] }));
  while (open.length > 0) {
    const chain = open.shift();
    let again = true;
    while (again && !same(chain.geometry[0], chain.geometry.at(-1))) {
      again = false;
      const at = open.findIndex((w) => same(w.geometry[0], chain.geometry.at(-1)) || same(w.geometry.at(-1), chain.geometry.at(-1)));
      if (at >= 0) {
        const [next] = open.splice(at, 1);
        const ordered = same(next.geometry[0], chain.geometry.at(-1)) ? next.geometry : [...next.geometry].reverse();
        chain.geometry = [...chain.geometry, ...ordered.slice(1)];
        again = true;
      }
    }
    if (closed(chain.geometry)) rings.push(chain);
  }
  return rings;
}
/** Every closed outline of an element: a closed way's, or the rings the relation's outer ways make, with the first way's id. */
const outlines = (e) => (e.type === "way" ? (closed(e.geometry) ? [{ ref: e.id, geometry: e.geometry }] : []) : chained((e.members ?? []).filter((m) => m.type === "way" && m.role === "outer" && m.geometry)));
const find = (raw, spec, label) => {
  const [type, id] = spec.split("/");
  return raw.elements.find((e) => e.type === type && String(e.id) === id) ?? fail(`${label}: ${spec} is not in the archive`);
};
/** The outline of an element with the most area (a relation of several outer ways holds the building and its annexes). */
const largest = (e, origin) => outlines(e).reduce((best, o) => (best === undefined || areaOf(metresFrom(origin, ringOf(o.geometry))) > areaOf(metresFrom(origin, ringOf(best.geometry))) ? o : best), undefined);

const osm = {};
for (const v of stadiums) {
  const file = `osm-${v.id}.json`;
  if (!days.some((d) => existsSync(new URL(`${d}/${file}`, root)))) fail(`${v.id}: ${file} is not in ${day}: run \`pnpm stadiums:fetch\``);
  const raw = load(file);
  if (raw.wikidata !== v.wikidata) fail(`${v.id}: ${file} is for ${raw.wikidata}`);
  const kind = kindOf(v);
  let outline;
  let outlineSource;
  let height;
  if (v.osm === undefined) {
    // The building tagged with the stadium's Wikidata item (BC Place's).
    const building = raw.elements.filter((e) => e.type === "way" && e.tags?.wikidata === v.wikidata && closed(e.geometry));
    if (building.length !== 1) fail(`${v.id}: ${building.length} closed ways carry ${v.wikidata}; name the building in "osm"`);
    outline = building[0].geometry;
    outlineSource = `way/${building[0].id}`;
    height = Number(building[0].tags.height);
  } else {
    const e = find(raw, v.osm.building, v.id);
    const first = outlines(e)[0] ?? fail(`${v.id}: ${v.osm.building} has no closed outer way`);
    outline = largest(e, middleOf(ringOf(first.geometry))).geometry;
    outlineSource = `${e.type}/${e.id}`;
    height = Number(e.tags?.height);
  }
  const origin = middleOf(ringOf(outline));
  const metres = metresFrom(origin, ringOf(outline));
  const kept = simplified(metres, 1);
  const ring = lonlat6(ringOf(outline).filter((_, i) => kept.some((k) => k === metres[i])));
  const simple = (g) => {
    const m = metresFrom(origin, ringOf(g));
    const k = simplified(m, 1);
    return lonlat6(ringOf(g).filter((_, i) => k.some((p) => p === m[i])));
  };

  let axis;
  let roof;
  let canopies;
  if (v.osm === undefined) {
    // BC Place: the roof is a multipolygon of its band and the opening over the field, which the article says is the field's size.
    const relation = raw.elements.find((e) => e.type === "relation" && e.id === v.roofRelation);
    if (v.roofRelation !== undefined && relation === undefined) fail(`${v.id}: the roof relation ${v.roofRelation} is not in ${file}`);
    const opening = relation?.members?.find((m) => m.role === "inner" && closed(m.geometry));
    const roofOuter = relation?.members?.find((m) => m.role === "outer" && closed(m.geometry));
    const roofHeight = Number(relation?.tags?.["roof:height"]);
    const top = Number(relation?.tags?.height);
    if (opening !== undefined) {
      const m = metresFrom(origin, ringOf(opening.geometry));
      const box = smallestBox(m);
      axis = { heading: round(box.heading, 1), basis: "opening", strength: round(coreOf(metres).strength, 2), elongation: round(box.length / box.width, 2), centre: lonLatFrom(origin, centroidOf(m)).map((x) => round(x, 6)) };
      const said = v.roof.opening;
      if (said !== undefined && (Math.abs(box.length - said.length) / said.length > 0.05 || Math.abs(box.width - said.width) / said.width > 0.05)) fail(`${v.id}: the mapped opening is ${box.length.toFixed(1)} by ${box.width.toFixed(1)} m, the article says ${said.length} by ${said.width}`);
    } else {
      const core = coreOf(metres);
      axis = { heading: round(core.heading, 1), basis: core.strength >= 1.25 ? "building" : "none", strength: round(core.strength, 2), elongation: round(core.length / core.width, 2), centre: lonLatFrom(origin, core.centre).map((x) => round(x, 6)) };
    }
    if (relation !== undefined) roof = { source: `relation/${relation.id}`, height: Number.isFinite(top) ? top : undefined, rise: Number.isFinite(roofHeight) ? roofHeight : undefined, outer: roofOuter === undefined ? undefined : `way/${roofOuter.ref}`, opening: opening === undefined ? undefined : { source: `way/${opening.ref}`, ring: simple(opening.geometry) } };
    height = Number.isFinite(top) ? top : height;
  } else if (kind === "stadium") {
    // The pitches OpenStreetMap maps in the stadium, one for each sport; the field lies as they do (and they agree with each other).
    const pitches = (v.osm.pitches ?? []).map((spec) => find(raw, spec, v.id));
    if (pitches.length === 0) fail(`${v.id}: a stadium with no pitch mapped needs another way to say how its field lies`);
    const boxes = pitches.map((e) => {
      const m = metresFrom(origin, ringOf(outlines(e)[0].geometry));
      return { e, box: smallestBox(m), centre: centroidOf(m) };
    });
    const headings = boxes.map((b) => b.box.heading);
    const off = (h) => Math.abs((((h - headings[0] + 90) % 180) + 180) % 180 - 90);
    if (Math.max(...headings.map(off)) > 3) fail(`${v.id}: the pitches do not lie the same way (${headings.join(", ")})`);
    // (A stadium whose one mapped pitch serves every configuration says so, `onePitch`: MetLife Stadium's is tagged for soccer for the 2026 tournament, and its note says it was American football's.)
    if (v.osm.onePitch !== true) for (const key of Object.keys(v.configs)) if (!boxes.some((b) => (SPORT_OF_TAG[b.e.tags?.sport] ?? []).includes(key))) fail(`${v.id}: no pitch mapped for ${key}`);
    const mean = [boxes.reduce((s, b) => s + b.centre[0], 0) / boxes.length, boxes.reduce((s, b) => s + b.centre[1], 0) / boxes.length];
    axis = { heading: round(headings[0], 1), basis: "pitch", strength: round(coreOf(metres).strength, 2), elongation: round(boxes[0].box.length / boxes[0].box.width, 2), centre: lonLatFrom(origin, mean).map((x) => round(x, 6)) };
    if (v.osm.roofs !== undefined) {
      canopies = v.osm.roofs.map((spec) => {
        const e = find(raw, spec, v.id);
        return { source: `${e.type}/${e.id}`, height: Number(e.tags?.height), rise: Number(e.tags?.["roof:height"]), ...(typeof e.tags?.["roof:shape"] === "string" ? { shape: e.tags["roof:shape"] } : {}), ring: simple(outlines(e)[0].geometry) };
      });
      for (const c of canopies) if (!Number.isFinite(c.height) || !Number.isFinite(c.rise)) fail(`${v.id}: ${c.source} has no height and roof height`);
    }
  } else if (kind === "hall") {
    // A hall: nothing in OpenStreetMap says how its ring lies, so the building's long axis is an inference, as for an arena, and a near-round building has none.
    const core = coreOf(metres);
    axis = { heading: round(core.heading, 1), basis: core.strength >= 1.25 ? "building" : "none", strength: round(core.strength, 2), elongation: round(core.length / core.width, 2), centre: lonLatFrom(origin, core.centre).map((x) => round(x, 6)) };
  } else {
    // A ballpark. The park's fence, as points in metres on the field (u to the right of the way out to centre field, w out from home plate); a heading is the way out to centre field, degrees clockwise from north.
    const place = parks.find((p) => p.id === v.park);
    const unit = place.unit === "m" ? 1 : 0.3048;
    const radiusAt = (a) => {
      for (let i = 0; i + 1 < place.points.length; i += 1) {
        const [a0, d0] = place.points[i];
        const [a1, d1] = place.points[i + 1];
        if (a >= a0 && a <= a1) return (d0 + ((d1 - d0) * (a - a0)) / (a1 - a0)) * unit;
      }
      return undefined;
    };
    const fence = place.points.map(([a, d]) => [d * unit * Math.sin((a * Math.PI) / 180), d * unit * Math.cos((a * Math.PI) / 180)]);
    const outlineM = metresFrom(origin, ringOf(outline));
    const frame = (h) => {
      const a = (h * Math.PI) / 180;
      return { dir: [Math.sin(a), Math.cos(a)], right: [Math.cos(a), -Math.sin(a)] };
    };
    /** How many points of the fence, and of the stands 20 metres behind it, fall outside the building when home plate is at `home` and the way out is `h`, and how far inside the nearest of them is. */
    const scoreOf = (h, home, depth = 20, round_ = false) => {
      const { dir, right } = frame(h);
      const at = ([u, w]) => [home[0] + u * right[0] + w * dir[0], home[1] + u * right[1] + w * dir[1]];
      const pts = fence.map(at);
      // The stands' outer edge: the fence and, where the backstop stands behind home plate, the points there (the stands round the fair ground reach about `depth` metres beyond them, away from the field's middle).
      const edge = round_ ? [...pts, at([0, -18]), at([-30, -18]), at([30, -18])] : pts;
      const middle = round_ ? at([0, 60]) : home;
      const behind = edge.map(([x, y]) => [x + ((x - middle[0]) / Math.hypot(x - middle[0], y - middle[1])) * depth, y + ((y - middle[1]) / Math.hypot(x - middle[0], y - middle[1])) * depth]);
      const all = [...(round_ ? edge : pts), ...behind];
      return { bad: all.filter((p) => !inside(outlineM, p)).length, clear: Math.min(...all.map((p) => (inside(outlineM, p) ? 1 : -1) * edgeDistanceTo(outlineM, p))) };
    };
    if (v.osm.infield !== undefined) {
      // The infield OpenStreetMap maps (the grass inside the base paths: a square whose sides are the baselines) says how the baselines run; which way is out to centre field is the one of the four that
      // keeps the park's fence, and the stands behind it, inside the building's outline.
      const infield = find(raw, v.osm.infield, v.id);
      const piece = (infield.members ?? []).find((m) => m.ref === v.osm.infieldWay) ?? fail(`${v.id}: way ${v.osm.infieldWay} is not a member of ${v.osm.infield}`);
      const m = metresFrom(origin, ringOf(piece.geometry));
      const box = smallestBox(m);
      const centre = centroidOf(m);
      if (Math.abs(box.length / box.width - 1) > 0.05 || Math.abs(Math.sqrt(areaOf(m)) - 25.5) > 4) fail(`${v.id}: the infield is not the square of grass inside the base paths (${box.length.toFixed(1)} by ${box.width.toFixed(1)} m)`);
      // The baselines lie along the box's sides; home plate is at one of its four corners, so the way to centre field is 45 degrees from a side, and one of four.
      const candidates = [0, 1, 2, 3].map((k) => (((box.heading + 45 + 90 * k) % 360) + 360) % 360);
      const scored = candidates.map((h) => ({ h, bad: scoreOf(h, [centre[0] - 19.4 * Math.sin((h * Math.PI) / 180), centre[1] - 19.4 * Math.cos((h * Math.PI) / 180)]).bad })).sort((a, b) => a.bad - b.bad);
      if (scored[0].bad !== 0 || scored[1].bad < 2) fail(`${v.id}: the outline does not choose one way to centre field (${scored.map((x) => `${x.h.toFixed(1)}:${x.bad}`).join(" ")})`);
      const h = scored[0].h;
      const a = (h * Math.PI) / 180;
      // Home plate is 90 feet times the root of two over two (19.4 m) back from the middle of the infield.
      const home = [centre[0] - 19.4 * Math.sin(a), centre[1] - 19.4 * Math.cos(a)];
      axis = { heading: round(h, 1), basis: "infield", strength: round(coreOf(metres).strength, 2), elongation: 1, centre: lonLatFrom(origin, home).map((x) => round(x, 6)) };
    } else if (v.osm.pitch !== undefined) {
      // The grass of the field OpenStreetMap maps (the whole field, fair ground and foul, an outline a little inside the fence) has the shape of the park's published fence: the heading, and home plate, at which the fence
      // lies nearest to that outline are the way the field lies. Home plate and the heading are searched together (the heading each 4 degrees, home plate on a grid, then refined); the fence is about a round arc,
      // so the minimum is shallow, a few degrees wide, which is what the figure's tolerance says.
      const pitch = find(raw, v.osm.pitch, v.id);
      const pm = metresFrom(origin, ringOf(outlines(pitch)[0].geometry));
      const mid = [pm.reduce((t, p) => t + p[0], 0) / pm.length, pm.reduce((t, p) => t + p[1], 0) / pm.length];
      const samples = Array.from({ length: 37 }, (_, i) => -45 + i * 2.5).map((a) => [radiusAt(a) * Math.sin((a * Math.PI) / 180), radiusAt(a) * Math.cos((a * Math.PI) / 180)]);
      const cost = (h, hx, hy) => {
        const { dir, right } = frame(h);
        let total = 0;
        for (const [u, w] of samples) total += edgeDistanceTo(pm, [mid[0] + hx + u * right[0] + w * dir[0], mid[1] + hy + u * right[1] + w * dir[1]]) ** 2;
        return total / samples.length;
      };
      let best = { c: Infinity, h: 0, hx: 0, hy: 0 };
      for (let h = 0; h < 360; h += 4) for (let hx = -40; hx <= 40; hx += 5) for (let hy = -90; hy <= 90; hy += 5) {
        const c = cost(h, hx, hy);
        if (c < best.c) best = { c, h, hx, hy };
      }
      let [step, turn] = [2, 1];
      for (let i = 0; i < 80; i += 1) {
        let improved = false;
        for (const [dh, dx, dy] of [[turn, 0, 0], [-turn, 0, 0], [0, step, 0], [0, -step, 0], [0, 0, step], [0, 0, -step]]) {
          const c = cost(best.h + dh, best.hx + dx, best.hy + dy);
          if (c < best.c) {
            best = { c, h: best.h + dh, hx: best.hx + dx, hy: best.hy + dy };
            improved = true;
          }
        }
        if (!improved) [step, turn] = [step / 2, turn / 2];
      }
      const rms = Math.sqrt(best.c);
      if (rms > 4) fail(`${v.id}: the mapped field does not have the park's shape (the fence lies ${rms.toFixed(1)} m from it at its nearest)`);
      const h = Math.round((((best.h % 360) + 360) % 360) * 2) / 2;
      const home = [mid[0] + best.hx, mid[1] + best.hy];
      axis = { heading: h, basis: "pitch", strength: round(coreOf(metres).strength, 2), elongation: 1, centre: lonLatFrom(origin, home).map((x) => round(x, 6)), rms: round(rms, 1) };
    } else {
      // Nothing maps how the field lies, and nothing is guessed: the building has no direction to read it from. The drawing needs some way for the field to lie, so it takes the one in which the park's fence and the
      // stands 20 metres behind it fit best inside the building (home plate placed so that the middle of the fair ground is the middle of the building), says so (`none`) and draws no arrow to north.
      const core = coreOf(metres);
      const wedge = [];
      for (let a = -45; a <= 45; a += 5) for (let k = 1; k <= 10; k += 1) wedge.push([((radiusAt(a) * k) / 10) * Math.sin((a * Math.PI) / 180), ((radiusAt(a) * k) / 10) * Math.cos((a * Math.PI) / 180)]);
      const [cu, cw] = [wedge.reduce((t, p) => t + p[0], 0) / wedge.length, wedge.reduce((t, p) => t + p[1], 0) / wedge.length];
      // The stands are about 34 metres deep beyond the fence and behind home plate in a steep modern bowl (ours), and home plate may stand up to 30 metres either way of where the middle of the fair ground is the building's middle.
      // Where a published list of the streets round the park says which way it lies (`orientation`), the heading is that one, and only the place of home plate is searched.
      const headings = v.orientation === undefined ? Array.from({ length: 72 }, (_, i) => i * 5) : [v.orientation.heading];
      const tries = headings.flatMap((h) => {
        const { dir, right } = frame(h);
        return [-30, -20, -10, 0, 10, 20, 30].map((shift) => {
          const home = [core.centre[0] - cu * right[0] - cw * dir[0] + shift * dir[0], core.centre[1] - cu * right[1] - cw * dir[1] + shift * dir[1]];
          return { h, home, shift, ...scoreOf(h, home, 34, true) };
        });
      });
      tries.sort((a, b) => a.bad - b.bad || b.clear - a.clear || Math.abs(a.shift) - Math.abs(b.shift) || a.h - b.h);
      axis = { heading: tries[0].h, basis: v.orientation === undefined ? "none" : v.orientation.basis, strength: round(core.strength, 2), elongation: round(core.length / core.width, 2), centre: lonLatFrom(origin, tries[0].home).map((x) => round(x, 6)) };
    }
    if (v.osm.roof !== undefined) {
      // An air-supported roof (Tokyo Dome's): the outline OpenStreetMap maps for it, its height to the top and how much of that is the roof's own rise.
      const e = find(raw, v.osm.roof, v.id);
      const top = Number(e.tags?.height);
      const rise = Number(e.tags?.["roof:height"]);
      if (!Number.isFinite(top) || !Number.isFinite(rise) || rise <= 5 || top - rise <= 5) fail(`${v.id}: ${v.osm.roof} has no height and roof height`);
      roof = { source: `${e.type}/${e.id}`, height: top, rise, ring: simple(outlines(e)[0].geometry) };
    }
  }
  // A tower beside the building (the Olympic Stadium's): its footprint and its axis. OpenStreetMap maps the observatory at the top of the tower (a viewpoint, `towerTop`) and the line of the funicular where it rides on the shaft (`funicular`: the way
  // tagged above ground, its tunnel being below): the top is the observatory, the foot the end of that line farthest from it, 165 metres below it in height (the height the article and the map give for the tower).
  let tower;
  if (v.osm?.tower !== undefined) {
    if (v.tower === undefined) fail(`${v.id}: the tower is mapped (${v.osm.tower}) but the facts do not say what it is`);
    const e = find(raw, v.osm.tower, v.id);
    const height = Number(e.tags?.height);
    if (height !== v.tower.height) fail(`${v.id}: OpenStreetMap maps the tower ${height} m high, the facts say ${v.tower.height}`);
    const own = outlines(e)[0] ?? fail(`${v.id}: ${v.osm.tower} has no closed outline`);
    const m = metresFrom(origin, ringOf(own.geometry));
    const topNode = find(raw, v.osm.towerTop ?? fail(`${v.id}: the tower's top (towerTop) is not named`), v.id);
    const [topAt] = metresFrom(origin, [[topNode.lon, topNode.lat]]);
    const line = (v.osm.funicular ?? fail(`${v.id}: the tower's funicular is not named`)).flatMap((spec) => metresFrom(origin, find(raw, spec, v.id).geometry.map((p) => [p.lon, p.lat])));
    const foot = line.reduce((best, p) => (Math.hypot(p[0] - topAt[0], p[1] - topAt[1]) > Math.hypot(best[0] - topAt[0], best[1] - topAt[1]) ? p : best), line[0]);
    // The shaft leans over the building: the top is inside the building's outline, the foot outside it, and the run between them agrees with the article's 45 degrees for the height (within a fifth).
    if (!inside(metres, topAt) || inside(metres, foot)) fail(`${v.id}: the tower's top should be over the building and its foot outside it`);
    const run = Math.hypot(foot[0] - topAt[0], foot[1] - topAt[1]);
    const slope = (v.tower.height / run);
    if (Math.abs(Math.atan(slope) * 180 / Math.PI - v.tower.angle) > v.tower.angle * 0.2) fail(`${v.id}: the tower runs ${run.toFixed(0)} m across for ${v.tower.height} m of height, not the article's ${v.tower.angle} degrees`);
    const kept = simplified(m, 1.5);
    tower = { source: `${e.type}/${e.id}`, height, ring: lonlat6(ringOf(own.geometry).filter((_, i) => kept.some((k) => k === m[i]))), base: lonLatFrom(origin, foot).map((x) => round(x, 6)), top: lonLatFrom(origin, topAt).map((x) => round(x, 6)) };
  }
  osm[v.id] = { source: outlineSource, read: raw.read, base: raw.osmBase, ring, ...(Number.isFinite(height) && height > 5 && height < 120 ? { height } : {}), ...(roof === undefined ? {} : { roof }), ...(canopies === undefined ? {} : { canopies }), ...(tower === undefined ? {} : { tower }), axis };
}

// ---- The data files. ----
const q = (value) => JSON.stringify(value).replace(/":/g, '": ').replace(/,"/g, ', "');
const FACT_KEYS = ["id", "kind", "wikidata", "ground", "park", "gridiron", "names", "en", "ja", "looks", "configs", "bowlSeats", "wikidataSeats", "tiers", "roof", "tower", "endTower", "facade"];
const factsText = `// Made by scripts/build-stadiums.mjs from scripts/stadiums.data.json: do not edit by hand.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/stadiums.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in stadiums.osm.data.ts, apart, because it is ODbL.
import type { RealStadiumData } from "./stadiums.ts";

export const STADIUM_DATA: RealStadiumData[] = [
${facts.map((v) => `  {\n${FACT_KEYS.filter((key) => v[key] !== undefined).map((key) => `    "${key}": ${q(v[key])},`).join("\n")}\n  },`).join("\n")}
];
`;
writeFileSync(new URL("../src/stadiums.data.ts", import.meta.url), factsText);

const clean = (value) => JSON.parse(JSON.stringify(value));
const ringText = (ring, pad) => `[\n${ring.map(([lon, lat]) => `${pad}  [${lon}, ${lat}]`).join(",\n")},\n${pad}]`;
const osmText = `// Made by scripts/build-stadiums.mjs from the files of data-sources/stadiums/${day}/: do not edit by hand.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each stadium's building outline (the way or relation OpenStreetMap maps it as, simplified
// to a metre, longitude and latitude to six decimals), the roof OpenStreetMap maps over it (its heights, the opening or the canopies) and the axis worked out from the roof's opening, the pitch or the infield. The package
// is MIT; this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (\`VENUE_ATTRIBUTION\`). Nothing in a CC0 or
// CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/stadiums/.
import type { StadiumOsm } from "./stadiums.ts";

export const STADIUM_OSM: Record<string, StadiumOsm> = {
${stadiums.map((v) => {
  const o = clean(osm[v.id]);
  const roof = o.roof === undefined ? "" : `\n    "roof": {\n      "source": ${q(o.roof.source)},${o.roof.height === undefined ? "" : `\n      "height": ${o.roof.height},`}${o.roof.rise === undefined ? "" : `\n      "rise": ${o.roof.rise},`}${o.roof.outer === undefined ? "" : `\n      "outer": ${q(o.roof.outer)},`}${o.roof.opening === undefined ? "" : `\n      "opening": { "source": ${q(o.roof.opening.source)}, "ring": ${ringText(o.roof.opening.ring, "      ")} },`}${o.roof.ring === undefined ? "" : `\n      "ring": ${ringText(o.roof.ring, "      ")},`}\n    },`;
  const tower = o.tower === undefined ? "" : `\n    "tower": { "source": ${q(o.tower.source)}, "height": ${o.tower.height}, "base": ${q(o.tower.base)}, "top": ${q(o.tower.top)}, "ring": ${ringText(o.tower.ring, "    ")} },`;
  const canopies = o.canopies === undefined ? "" : `\n    "canopies": [\n${o.canopies.map((c) => `      { "source": ${q(c.source)}, "height": ${c.height}, "rise": ${c.rise},${c.shape === undefined ? "" : ` "shape": ${q(c.shape)},`} "ring": ${ringText(c.ring, "      ")} },`).join("\n")}\n    ],`;
  return `  "${v.id}": {\n    "source": ${q(o.source)},\n    "read": ${q(o.read)},\n    "base": ${q(o.base)},\n    "licence": "ODbL-1.0",\n    "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",\n${o.height === undefined ? "" : `    "height": ${o.height},\n`}    "axis": ${q(o.axis)},${roof}${canopies}${tower}\n    "ring": ${ringText(o.ring, "    ")},\n  },`;
}).join("\n")}
};
`;
writeFileSync(new URL("../src/stadiums.osm.data.ts", import.meta.url), osmText);

// docs/stadiums.md: the table of the stadiums between its markers; the rest of the page is written by hand.
const m2 = (ring) => Math.round(areaOf(metresFrom(middleOf(ring), ring)));
const HOW = { opening: "from the roof's opening", pitch: "as OpenStreetMap maps the pitch", infield: "from the mapped infield and the outline", building: "inferred", streets: "from the streets the English Wikipedia lists at the bases and the outfield, to the nearest 45 degrees" };
const how = (a, v) => (a.basis === "none" ? "not known" : kindOf(v) === "park" ? `home to centre field ${a.heading}° (${a.basis === "pitch" ? `from the mapped grass of the field fitted to the fence, about ${a.rms} m off` : HOW[a.basis]})` : `along ${a.heading}° (${HOW[a.basis]})`);
const COUNTRY = { US: "United States", CA: "Canada", JP: "Japan" };
const roofText = (v) => `${{ cable: "retractable, cable-supported", fixed: "fixed", canopy: `canopy over ${Math.round((v.roof.cover ?? 0) * 100)} percent of the seats`, panels: "retractable, in four sections", dome: "air-supported dome", open: "none, open to the air" }[v.roof.kind]} (${v.roof.basis})`;
const seatsText = (v) => Object.entries(v.configs).map(([k, c]) => `${grouped(c.seats)} (${k})`).join(", ");
const table = `| Key | Stadium | City | Wikidata | Seats | Bowls | Roof | The field | Outline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${stadiums.map((v) => {
  const place = kindOf(v) === "hall" ? { name: v.names.en, city: v.city, country: v.country } : kindOf(v) === "park" ? parks.find((p) => p.id === v.park) : grounds.find((x) => x.id === v.ground);
  const o = osm[v.id];
  return `| \`${v.id}\` | ${place.name} | ${place.city}, ${COUNTRY[place.country] ?? place.country} | ${v.wikidata} | ${seatsText(v)} | ${v.tiers.count}, ${v.tiers.basis} | ${roofText(v)} | ${how(o.axis, v)} | ${o.source.replace("way/", "way ").replace("relation/", "relation ")}, ${m2(o.ring.map(([a, b]) => [a, b])).toLocaleString("en-US")} m² |`;
}).join("\n")}`;
const page = new URL("../docs/stadiums.md", import.meta.url);
if (existsSync(page)) {
  const text = readFileSync(page, "utf8");
  const marked = /<!-- stadiums-table -->[\s\S]*?<!-- \/stadiums-table -->/;
  if (!marked.test(text)) fail("docs/stadiums.md has no <!-- stadiums-table --> markers");
  writeFileSync(page, text.replace(marked, () => `<!-- stadiums-table -->\n${table}\n<!-- /stadiums-table -->`));
}
console.log(`src/stadiums.data.ts, src/stadiums.osm.data.ts: ${stadiums.length} stadium(s), read ${day}`);
