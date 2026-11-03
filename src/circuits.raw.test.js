// The circuits' drawing held to the raw answers it was made from (data-sources/circuits/<date>/): the lap joined again from OpenStreetMap's ways, as they were returned, measures what the published length says to
// within a few percent and what the drawn line measures to within a metre; every drawn point lies on the raw line; the turns, the start, the finish, the pit lane and the pit building are the raw ones; and the
// documented facts are in the raw answers of Wikidata and Wikipedia. A change to src/circuits.osm.data.ts by hand, or a build from other data, fails here.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CIRCUITS, circuitPlan } from "./circuits-entry.ts";
import { lineLength, nearestOn } from "./circuits.geo.ts";
import { metresFrom } from "./venues.geo.ts";

const root = "data-sources/circuits";
const day = readdirSync(root).filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name)).sort().at(-1);
const read = (name) => JSON.parse(readFileSync(`${root}/${day}/${name}`, "utf8"));

describe.each(CIRCUITS.map((c) => [c.id, c]))("%s against the raw answers", (id, circuit) => {
  const answer = read(`osm-${id}.json`);
  const elements = answer.osm.elements;
  const relation = elements.find((e) => e.type === "relation");
  const ways = new Map(elements.filter((e) => e.type === "way").map((e) => [e.id, e]));
  const nodes = new Map(elements.filter((e) => e.type === "node").map((e) => [e.id, e]));
  // The lap as OpenStreetMap returned it: the driven ways, in order, each the way it runs.
  const raw = relation.members
    .filter((m) => m.type === "way" && (m.role === "forward" || m.role === "backward"))
    .flatMap((m) => {
      const line = ways.get(m.ref).geometry.map((p) => [p.lon, p.lat]);
      return m.role === "backward" ? line.reverse() : line;
    });
  const origin = circuit.osm.lap[0];
  const rawMetres = metresFrom(origin, raw);

  it("is the relation the record names, tagged with its Wikidata item", () => {
    expect(`relation/${relation.id}`).toBe(circuit.osm.source);
    expect(relation.tags.wikidata).toBe(circuit.wikidata);
    expect(answer.read).toBe(circuit.osm.read);
  });

  it("measures, joined from the raw ways, within 3 percent of the published length, and within a metre of the drawn line", () => {
    const rawLength = lineLength(rawMetres, false);
    const drawn = circuitPlan(circuit).measured;
    expect(Math.abs(rawLength / circuit.length.value - 1)).toBeLessThan(0.03);
    expect(Math.abs(drawn - rawLength)).toBeLessThan(1);
    // The figure the docs give: 6,210 metres drawn against 6,201 published, 0.15 percent long.
    if (id === "las-vegas") expect((drawn / circuit.length.value - 1) * 100).toBeCloseTo(0.15, 1);
  });

  it("draws no point off the raw line by more than the tolerance it was simplified to", () => {
    for (const p of metresFrom(origin, circuit.osm.lap)) expect(nearestOn(rawMetres, p, false).d).toBeLessThan(circuit.osm.tolerance + 0.1);
  });

  it("numbers the turns where the raw nodes are, and starts and finishes where they say", () => {
    for (const t of circuit.osm.turns) {
      const node = nodes.get(Number(t.source.split("/")[1]));
      expect(node.tags.ref).toBe(String(t.n));
      expect(t.at[0]).toBeCloseTo(node.lon, 5);
      expect(t.at[1]).toBeCloseTo(node.lat, 5);
    }
    expect(nodes.get(Number(circuit.osm.start.source.split("/")[1])).tags.raceway).toBe("start");
    expect(nodes.get(Number(circuit.osm.finish.source.split("/")[1])).tags.raceway).toBe("finish");
    expect(relation.members.find((m) => m.role === "pit_lane").ref).toBe(Number(circuit.osm.pitLane.source.split("/")[1]));
  });

  it("stands the pit building at the height OpenStreetMap maps", () => {
    const b = circuit.osm.pitBuilding;
    if (b === undefined) return;
    const way = ways.get(Number(b.source.split("/")[1]));
    expect(Number(way.tags.height)).toBe(b.height);
    expect(Number(way.tags["building:levels"])).toBe(b.levels);
  });

  it("draws no kerb, run-off or gravel, because OpenStreetMap maps none for racing here", () => {
    // What the answer holds of kerbs are pedestrians' (lowered, with tactile paving, at the crossings of the streets), not a circuit's: the drawing has none.
    const racing = elements.filter((e) => e.tags !== undefined && (["runoff", "gravel_trap", "escape", "kerb"].includes(e.tags.raceway) || e.tags.landuse === "gravel" || e.tags.natural === "sand"));
    expect(racing).toEqual([]);
    const kerbs = elements.filter((e) => e.tags?.barrier === "kerb" && e.type === "node");
    expect(kerbs.every((e) => ["lowered", "flush"].includes(e.tags.kerb))).toBe(true);
  });

  it("holds the documented facts to the raw answers of Wikidata and Wikipedia", () => {
    const item = read("wikidata.json").entities[circuit.wikidata];
    const articles = read("wikipedia.json").articles;
    expect(item.labels.en.value).toBe(circuit.names.en);
    expect(item.labels.ja.value).toBe(circuit.names.ja);
    expect(item.claims.P1619[0].mainsnak.datavalue.value.time.startsWith(`+${circuit.opened.value}`)).toBe(true);
    expect(articles[`${id}-en`].revision).toBe(circuit.en.revision);
    expect(articles[`${id}-ja`].revision).toBe(circuit.ja.revision);
    expect(articles[`${id}-en`].infobox).toContain(`length_km = ${(circuit.length.value / 1000).toFixed(3)}`);
    expect(articles[`${id}-en`].infobox).toContain(`turns = ${circuit.corners.value}`);
  });
});
