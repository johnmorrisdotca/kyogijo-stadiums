import { describe, expect, it } from "vitest";
import { PLACES, atlasFacets, placeById, placesBy, surfaceOf } from "./atlas.ts";
import { drawKyogijo } from "./draw.ts";
import { GROUNDS } from "./grounds.ts";
import { PARKS } from "./parks.ts";

/** Rough boxes round each country: [south, north, west, east]. A sign slipped in a coordinate puts a place in the sea. */
const BOXES: Record<string, [number, number, number, number]> = {
  UY: [-35.1, -30, -58.5, -53], IT: [36, 47.2, 6.5, 18.6], FR: [41, 51.2, -5.5, 9.7], BR: [-34, 5.5, -74, -34], CH: [45.7, 47.9, 5.9, 10.6], SE: [55, 69.1, 10.9, 24.2],
  CL: [-56, -17, -76, -66], GB: [49.8, 60.9, -8.7, 1.8], MX: [14.5, 32.8, -118.5, -86.5], DE: [47.2, 55.1, 5.8, 15.1], AR: [-55.1, -21.7, -73.6, -53.6], ES: [36, 43.9, -9.4, 3.4],
  US: [24.4, 49.5, -125, -66.9], JP: [24, 45.6, 122.9, 146], ZA: [-35, -22, 16.4, 33], RU: [41, 82, 27, 180], QA: [24.4, 26.2, 50.7, 51.7], CA: [41.6, 83.2, -141, -52.5],
  CN: [18, 53.6, 73.5, 135.1], AU: [-44, -10, 112, 154], PT: [36.9, 42.2, -9.6, -6.1], KR: [33, 38.7, 124.5, 132], NL: [50.7, 53.6, 3.3, 7.3],
};

describe("the places", () => {
  it("are every ballpark and every ground, once each", () => {
    expect(PLACES).toHaveLength(Object.keys(PARKS).length + Object.keys(GROUNDS).length);
    expect(PLACES.filter((place) => place.kind === "park")).toHaveLength(Object.keys(PARKS).length);
    expect(PLACES.filter((place) => place.kind === "ground")).toHaveLength(Object.keys(GROUNDS).length);
    expect(PLACES.filter((place) => place.sport === "baseball")).toHaveLength(Object.keys(PARKS).length);
  });

  it("have unique ids and unique Wikidata items", () => {
    expect(new Set(PLACES.map((place) => place.id)).size).toBe(PLACES.length);
    expect(new Set(PLACES.map((place) => place.wikidata)).size).toBe(PLACES.length);
    for (const place of PLACES) expect(place.wikidata, place.id).toMatch(/^Q[1-9]\d*$/);
  });

  it("have coordinates inside their country's rough box, so a slipped sign is caught", () => {
    for (const place of PLACES) {
      expect(Number.isFinite(place.lat) && place.lat >= -90 && place.lat <= 90, `${place.id} latitude`).toBe(true);
      expect(Number.isFinite(place.lon) && place.lon >= -180 && place.lon <= 180, `${place.id} longitude`).toBe(true);
      const box = BOXES[place.country];
      expect(box, `${place.id}: no box for ${place.country}`).toBeDefined();
      const [south, north, west, east] = box;
      expect(place.lat >= south && place.lat <= north && place.lon >= west && place.lon <= east, `${place.id} (${place.lat}, ${place.lon}) is outside ${place.country}`).toBe(true);
    }
  });

  it("have a name, a city, a known status and years in order", () => {
    for (const place of PLACES) {
      expect(place.name.length, place.id).toBeGreaterThan(0);
      expect(place.city.length, place.id).toBeGreaterThan(0);
      expect(["current", "past"]).toContain(place.status);
      if (place.kind === "ground") expect(place.nameJa?.length, place.id).toBeGreaterThan(0);
      if (place.from !== undefined && place.to !== undefined) expect(place.from, place.id).toBeLessThanOrEqual(place.to);
      if (place.status === "current") expect(place.to, place.id).toBeUndefined();
    }
  });

  it("carry the facts of the park or ground they come from", () => {
    expect(placeById("fenway-park")).toMatchObject({ kind: "park", sport: "baseball", leagues: ["MLB"], country: "US", status: "current", team: "Boston Red Sox", wikidata: "Q49136", lat: 42.34639, lon: -71.0975 });
    expect(placeById("polo-grounds")).toMatchObject({ status: "past", from: 1891, to: 1963 });
    expect(placeById("tokyo-dome")).toMatchObject({ leagues: ["NPB"], country: "JP", nameJa: "東京ドーム" });
    expect(placeById("sapporo-dome")?.status).toBe("current");
    expect(placeById("maracana")).toMatchObject({ kind: "ground", sport: "soccer", country: "BR", leagues: expect.arrayContaining(["FIFA World Cup"]) });
    expect(placeById("nowhere")).toBeUndefined();
    expect(placeById(undefined)).toBeUndefined();
  });
});

describe("placesBy", () => {
  it("keeps everything when it is given nothing", () => {
    expect(placesBy()).toHaveLength(PLACES.length);
    expect(placesBy({})).toHaveLength(PLACES.length);
  });

  it("filters by sport, kind, league, country and status, and a list matches any of its members", () => {
    expect(placesBy({ sport: "baseball" }).every((place) => place.kind === "park")).toBe(true);
    expect(placesBy({ sport: "soccer" }).every((place) => place.kind === "ground")).toBe(true);
    expect(placesBy({ kind: "ground" })).toEqual(placesBy({ sport: "soccer" }));
    expect(placesBy({ league: "NPB" })).toHaveLength(20);
    expect(placesBy({ league: "MLB", status: "current" })).toHaveLength(30);
    expect(placesBy({ league: "MLB", status: "past" })).toHaveLength(44);
    expect(placesBy({ league: ["NPB", "MLB"] })).toHaveLength(94);
    expect(placesBy({ country: "JP", sport: "baseball", status: "current" })).toHaveLength(14);
    expect(placesBy({ country: ["CA", "JP"], sport: "baseball" }).every((place) => place.country === "CA" || place.country === "JP")).toBe(true);
    expect(placesBy({ league: "FIFA World Cup" }).every((place) => place.sport === "soccer")).toBe(true);
    expect(placesBy({ country: "ZZ" })).toEqual([]);
  });

  it("filters by a year: a place is in use from its first year to its last, and an unknown bound shuts nothing out", () => {
    const in1950 = placesBy({ year: 1950 }).map((place) => place.id);
    expect(in1950).toEqual(expect.arrayContaining(["ebbets-field", "polo-grounds"]));
    expect(in1950).not.toContain("citi-field");
    expect(in1950).not.toContain("shea-stadium");
    expect(placesBy({ year: 1962, sport: "baseball", country: "US" }).map((place) => place.id)).toEqual(expect.arrayContaining(["dodger-stadium", "polo-grounds", "colt-stadium", "robert-f-kennedy-memorial-stadium"]));
    expect(placesBy({ year: 1962 }).map((place) => place.id)).not.toContain("tokyo-dome");
    // Before any place opened, only the places that give no first year are left.
    expect(placesBy({ year: 1800 }).every((place) => place.from === undefined)).toBe(true);
    expect(placesBy({ year: 2026, status: "current" }).length).toBeGreaterThan(80);
    // Not a number: ignored, like a filter not given.
    expect(placesBy({ year: Number.NaN })).toHaveLength(PLACES.length);
    // Every place with both years known is found in each of them, and not the year before or after.
    for (const place of PLACES) {
      if (place.from !== undefined) {
        expect(placesBy({ year: place.from }).map((p) => p.id), place.id).toContain(place.id);
        expect(placesBy({ year: place.from - 1 }).map((p) => p.id), place.id).not.toContain(place.id);
      }
      if (place.to !== undefined) expect(placesBy({ year: place.to + 1 }).map((p) => p.id), place.id).not.toContain(place.id);
    }
  });

  it("finds words in the name, the name in Japanese, the city or the club, ignoring case and accents", () => {
    expect(placesBy({ text: "fenway" }).map((place) => place.id)).toEqual(["fenway-park"]);
    expect(placesBy({ text: "red sox" }).map((place) => place.id)).toContain("fenway-park");
    expect(placesBy({ text: "東京" }).map((place) => place.id)).toContain("tokyo-dome");
    expect(placesBy({ text: "MARACANA" }).map((place) => place.id)).toContain("maracana");
    expect(placesBy({ text: "  " })).toHaveLength(PLACES.length);
    expect(placesBy({ text: "boston fenway" }).map((place) => place.id)).toEqual(["fenway-park"]);
    expect(placesBy({ text: "fenway tokyo" })).toEqual([]);
    expect(placesBy({ text: "wembley", sport: "baseball" })).toEqual([]);
  });
});

describe("atlasFacets", () => {
  it("lists the sports, leagues and countries, sorted, and the span of years", () => {
    const facets = atlasFacets();
    expect(facets.sports).toEqual(["baseball", "soccer"]);
    expect(facets.leagues).toEqual(["FIFA Women's World Cup", "FIFA World Cup", "MLB", "NPB"]);
    expect(facets.countries).toEqual([...facets.countries].sort());
    expect(facets.countries).toEqual(expect.arrayContaining(["US", "JP", "CA", "BR"]));
    expect(facets.years.min).toBeLessThan(1900);
    expect(facets.years.max).toBeGreaterThanOrEqual(2024);
  });
});

describe("surfaceOf", () => {
  it("names the options that draw a place's surface, and they draw it", () => {
    expect(surfaceOf(placeById("fenway-park")!)).toEqual({ sport: "mlb", park: "fenway-park" });
    expect(surfaceOf(placeById("maracana")!)).toEqual({ sport: "soccer", ground: "maracana" });
    for (const place of PLACES) expect(drawKyogijo({ ...surfaceOf(place), style: "none" }).startsWith("<svg"), place.id).toBe(true);
  });
});
