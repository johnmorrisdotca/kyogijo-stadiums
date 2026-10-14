import { describe, expect, it } from "vitest";
import { PLACES, atlasFacets, placeById, placesBy, placesByClub, surfaceOf, surfacesOf, tenantsOf } from "./atlas.ts";
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
    expect(placeById("fenway-park")).toMatchObject({ kind: "park", sport: "baseball", leagues: expect.arrayContaining(["MLB"]), country: "US", status: "current", team: "Boston Red Sox", wikidata: "Q49136", lat: 42.34639, lon: -71.0975 });
    // A park is known first by its own league, then by the leagues of the other clubs that played there.
    expect(placeById("fenway-park")?.leagues[0]).toBe("MLB");
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
    // The 30 MLB parks in use, and Hard Rock Stadium, a ground the Marlins played in until 2011.
    expect(placesBy({ league: "MLB", status: "current" })).toHaveLength(31);
    expect(placesBy({ league: "MLB", status: "current", kind: "park" })).toHaveLength(30);
    expect(placesBy({ league: "MLB", status: "past" })).toHaveLength(44);
    expect(placesBy({ league: ["NPB", "MLB"] })).toHaveLength(95);
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
    expect(facets.leagues).toEqual([...facets.leagues].sort());
    // The tournaments, and every league a club that played in a place belonged to.
    expect(facets.leagues).toEqual(expect.arrayContaining(["FIFA Women's World Cup", "FIFA World Cup", "MLB", "NPB", "NFL", "CFL", "NBA", "NHL", "MLS", "Premier League", "J1 League"]));
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

describe("surfaceOf with a sport", () => {
  it("is the place's own surface with none, for every place, and draws what it always drew", () => {
    for (const place of PLACES) {
      const own = place.kind === "park" ? { sport: "mlb", park: place.id } : { sport: "soccer", ground: place.id };
      expect(surfaceOf(place), place.id).toEqual(own);
      expect(surfacesOf(place)[0], place.id).toEqual(own);
      expect(drawKyogijo({ ...surfaceOf(place), style: "none" }), place.id).toBe(drawKyogijo({ ...own, style: "none" } as Parameters<typeof drawKyogijo>[0]));
    }
  });

  it("offers the sports the clubs that played there play, each once, and nothing for a sport none has", () => {
    const bcPlace = placeById("bc-place")!;
    expect(surfacesOf(bcPlace)).toEqual([{ sport: "soccer", ground: "bc-place" }, { sport: "cfl" }]);
    expect(surfaceOf(bcPlace, "cfl")).toEqual({ sport: "cfl" });
    expect(surfaceOf(bcPlace, "soccer")).toEqual({ sport: "soccer", ground: "bc-place" });
    expect(surfaceOf(bcPlace, "mlb")).toBeUndefined();
    expect(surfaceOf(bcPlace, "nfl")).toBeUndefined();
    // A park offers its fence, and the field of a football club that played in it.
    expect(surfacesOf(placeById("olympic-stadium-montreal")!).map((surface) => surface.sport)).toEqual(["mlb", "cfl", "nfl", "soccer"]);
    expect(surfaceOf(placeById("olympic-stadium-montreal")!, "mlb")).toEqual({ sport: "mlb", park: "olympic-stadium-montreal" });
    expect(surfacesOf(placeById("metlife-stadium")!)).toEqual([{ sport: "soccer", ground: "metlife-stadium" }, { sport: "nfl" }]);
    expect(surfacesOf(placeById("stadium-australia")!)).toEqual(expect.arrayContaining([{ sport: "rugby", league: "nrl" }, { sport: "afl" }]));
    // A ground has no fence to draw for a baseball club that played in it.
    expect(surfaceOf(placeById("hard-rock-stadium")!, "mlb")).toBeUndefined();
    // A park a single club of a single sport has called home offers its fence and nothing else.
    expect(surfacesOf(placeById("oriole-park-at-camden-yards")!)).toEqual([{ sport: "mlb", park: "oriole-park-at-camden-yards" }]);
  });

  it("draws every surface every place offers", () => {
    for (const place of PLACES) {
      for (const surface of surfacesOf(place)) {
        const svg = drawKyogijo({ ...surface, style: "none" });
        expect(svg.startsWith("<svg"), `${place.id} ${surface.sport}`).toBe(true);
        expect(svg, `${place.id} ${surface.sport}`).toContain(`data-sport="${surface.sport}"`);
      }
    }
    // A pitch for a ground is at the ground's size; one for a park is the international size.
    expect(drawKyogijo({ ...surfaceOf(placeById("anfield")!, "soccer")!, style: "none" })).not.toBe(drawKyogijo({ sport: "soccer", style: "none" }));
    expect(drawKyogijo({ ...surfaceOf(placeById("olympic-stadium-montreal")!, "soccer")!, style: "none" })).toBe(drawKyogijo({ sport: "soccer", style: "none" }));
  });
});

describe("tenants", () => {
  const years = (place: string, club: string) => {
    const tenant = tenantsOf(place).find((t) => t.club === club);
    return tenant === undefined ? undefined : [tenant.league, tenant.from, tenant.to];
  };

  it("know BC Place as the home of the BC Lions and the Whitecaps, as well as a World Cup ground", () => {
    const bcPlace = placeById("bc-place")!;
    expect(bcPlace.leagues).toEqual(expect.arrayContaining(["CFL", "MLS", "FIFA World Cup", "FIFA Women's World Cup"]));
    expect(years("bc-place", "BC Lions")).toEqual(["CFL", 1983, undefined]);
    expect(years("bc-place", "Vancouver Whitecaps FC")).toEqual(["MLS", 2011, undefined]);
    expect(tenantsOf(bcPlace).slice(0, 2).map((t) => t.club)).toEqual(["BC Lions", "Vancouver Whitecaps FC"]);
    expect(tenantsOf("bc-place")[0]).toMatchObject({ sport: "canadian-football", clubJa: expect.stringContaining("ライオンズ"), wikidata: "Q919062", source: { wikidata: "P466 P115", years: "wikidata", wikipedia: { title: "BC Place" } } });
    expect(placesBy({ league: "CFL" }).map((place) => place.id)).toContain("bc-place");
    expect(placesBy({ league: "MLS", country: "CA" }).map((place) => place.id)).toEqual(expect.arrayContaining(["bc-place", "bmo-field"]));
  });

  it("know the clubs that left: the Expos and the Alouettes at the Olympic Stadium, the Raptors at the Rogers Centre", () => {
    expect(years("olympic-stadium-montreal", "Montreal Expos")).toEqual(["MLB", 1977, 2004]);
    expect(years("olympic-stadium-montreal", "Montreal Alouettes")).toEqual(["CFL", 1976, 1997]);
    expect(placeById("olympic-stadium-montreal")?.leagues.slice(0, 2)).toEqual(["MLB", "CFL"]);
    expect(placeById("olympic-stadium-montreal")?.team).toBe("Montreal Expos");
    expect(years("rogers-centre", "Toronto Blue Jays")).toEqual(["MLB", 1989, undefined]);
    expect(years("rogers-centre", "Toronto Argonauts")).toEqual(["CFL", 1989, 2015]);
    expect(years("rogers-centre", "Toronto Raptors")).toEqual(["NBA", 1995, 1999]);
    // The current ones first, then those that have left, the latest to leave first.
    expect(tenantsOf("rogers-centre").map((t) => t.club)).toEqual(["Toronto Blue Jays", "Toronto Argonauts", "Toronto Raptors"]);
  });

  it("know the football grounds' clubs of two sports", () => {
    expect(tenantsOf("metlife-stadium", { current: true }).map((t) => t.club)).toEqual(["New York Giants", "New York Jets"]);
    expect(tenantsOf("gillette-stadium", { current: true }).map((t) => t.club)).toEqual(expect.arrayContaining(["New England Patriots", "New England Revolution"]));
    expect(tenantsOf("lumen-field", { current: true }).map((t) => t.club)).toEqual(["Seattle Seahawks", "Seattle Sounders FC", "Seattle Reign FC"]);
    expect(placeById("lumen-field")?.leagues).toEqual(expect.arrayContaining(["NFL", "MLS", "NWSL"]));
    expect(tenantsOf("lumen-field", { sport: "soccer", year: 2005 }).map((t) => t.club)).toEqual(["Seattle Sounders"]);
    expect(tenantsOf("lumen-field", { league: "NFL" })).toHaveLength(1);
  });

  it("leave a park of one club alone", () => {
    const camden = placeById("oriole-park-at-camden-yards")!;
    expect(camden.leagues).toEqual(["MLB"]);
    expect(camden.tenants.map((t) => t.club)).toEqual(["Baltimore Orioles"]);
    expect(tenantsOf(camden, { year: 1990 })).toEqual([]);
    expect(tenantsOf(camden, { year: 1992 })).toHaveLength(1);
    expect(tenantsOf("nowhere")).toEqual([]);
    expect(tenantsOf(undefined)).toEqual([]);
  });

  it("are held to the rules of the data", () => {
    let count = 0;
    for (const place of PLACES) {
      for (const tenant of place.tenants) {
        count += 1;
        const label = `${place.id}: ${tenant.club}`;
        expect(tenant.club.length, label).toBeGreaterThan(0);
        expect(tenant.league.length, label).toBeGreaterThan(0);
        expect(tenant.wikidata, label).toMatch(/^Q[1-9]\d*$/);
        expect(place.leagues, label).toContain(tenant.league);
        if (tenant.from !== undefined && tenant.to !== undefined) expect(tenant.from, label).toBeLessThanOrEqual(tenant.to);
        // A year has a source, and a tenant has one: Wikidata's statement, the article's line, or both.
        if (tenant.from !== undefined || tenant.to !== undefined) expect(tenant.source.years, label).toMatch(/^(wikidata|wikipedia)$/);
        else expect(tenant.source.years, label).toBeUndefined();
        if (tenant.source.years === "wikidata") expect(tenant.source.wikidata, label).toBeDefined();
        if (tenant.source.years === "wikipedia") expect(tenant.source.wikipedia, label).toBeDefined();
        expect(tenant.source.wikidata !== undefined || tenant.source.wikipedia !== undefined, label).toBe(true);
        if (tenant.source.wikipedia !== undefined) expect(tenant.source.wikipedia.revision, label).toBeGreaterThan(1000);
      }
      // The current tenants come first.
      const gone = place.tenants.findIndex((t) => t.to !== undefined);
      if (gone >= 0) expect(place.tenants.slice(gone).every((t) => t.to !== undefined), place.id).toBe(true);
    }
    expect(count).toBeGreaterThan(400);
    expect(PLACES.filter((place) => place.tenants.length > 0).length).toBeGreaterThan(140);
  });
});

describe("finding a place by its club", () => {
  it("finds the places a club played in, by its name in English or in Japanese, in full or by a word of it", () => {
    expect(placesByClub("BC Lions").map((place) => place.id)).toEqual(["bc-place"]);
    expect(placesByClub("bc lions").map((place) => place.id)).toEqual(["bc-place"]);
    expect(placesByClub("Whitecaps").map((place) => place.id)).toEqual(["bc-place"]);
    expect(placesByClub("Montreal Expos").map((place) => place.id)).toEqual(["jarry-park-stadium", "olympic-stadium-montreal"]);
    expect(placesByClub("ブリティッシュ・コロンビア・ライオンズ").map((place) => place.id)).toEqual(["bc-place"]);
    expect(placesByClub("ライオンズ").map((place) => place.id)).toContain("bc-place");
    expect(placesByClub("ライオンズ").map((place) => place.id)).toContain("belluna-dome");
    expect(placesByClub("seibu lions").map((place) => place.id)).toContain("belluna-dome");
    expect(placesByClub("Boston Braves").map((place) => place.id)).toEqual(expect.arrayContaining(["braves-field", "south-end-grounds"]));
    expect(placesByClub("Nobody Athletic")).toEqual([]);
    expect(placesByClub("  ")).toEqual([]);
    expect(placesByClub(undefined)).toEqual([]);
  });

  it("puts a club of exactly that name before a club with the words in its name", () => {
    const places = placesByClub("Los Angeles Angels").map((place) => place.id);
    expect(places.indexOf("angel-stadium")).toBeLessThan(places.length);
    expect(places).toEqual(expect.arrayContaining(["angel-stadium", "dodger-stadium", "wrigley-field-los-angeles"]));
  });

  it("is found by placesBy's text too", () => {
    // (Oracle Park answers to "bc" too: it was SBC Park.)
    expect(placesBy({ text: "bc lions" }).map((place) => place.id)).toContain("bc-place");
    expect(placesBy({ text: "lions", country: "CA" }).map((place) => place.id)).toContain("bc-place");
    expect(placesBy({ text: "whitecaps" }).map((place) => place.id)).toEqual(["bc-place"]);
    expect(placesBy({ text: "ライオンズ" }).map((place) => place.id)).toEqual(expect.arrayContaining(["bc-place", "belluna-dome"]));
    expect(placesBy({ text: "expos", year: 1980 }).map((place) => place.id)).toContain("olympic-stadium-montreal");
    expect(placesBy({ text: "seahawks sounders" }).map((place) => place.id)).toEqual(["lumen-field"]);
  });
});
