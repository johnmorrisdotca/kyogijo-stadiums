import { describe, expect, it } from "vitest";
import { ARENAS, ARENA_IDS, arenaById, arenaByName, arenaCourtIn, arenaNameIn, arenaOfficialName, arenaRinkIn, arenaSourceUrl, arenasByName } from "./arenas.ts";
import { PLACES, atlasFacets, placeById, placeByName, placesBy, placesByClub, surfaceOf, surfacesOf } from "./atlas.ts";
import { describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { GROUNDS } from "./grounds.ts";
import { PARKS } from "./parks.ts";
import { outlineOf } from "./outline.ts";
import { TENANTS } from "./tenants.ts";

/** Rough boxes round the two countries: [south, north, west, east]. */
const BOXES: Record<string, [number, number, number, number]> = { US: [24.4, 49.5, -125, -66.9], CA: [41.6, 83.2, -141, -52.5] };
const LEAGUES = ["NHL", "NBA", "WNBA", "PWHL"];
const KANJI = /[一-鿿々]/u;
const KANA = /^[぀-ゖァ-ヺー・\s0-9A-Za-z()（）.!&-]+$/u;
const arenas = ARENA_IDS.map((id) => ARENAS[id]);
const viewBox = (svg: string): string => /viewBox="([^"]+)"/.exec(svg)?.[1] ?? "";

describe("the arenas", () => {
  it("are listed once each, with a key and a Wikidata item no park, ground or other arena has", () => {
    expect(arenas.length).toBeGreaterThan(150);
    expect(new Set(ARENA_IDS).size).toBe(ARENA_IDS.length);
    expect(new Set(arenas.map((a) => a.wikidata)).size).toBe(arenas.length);
    const others = new Set([...Object.values(PARKS), ...Object.values(GROUNDS)].flatMap((p) => [p.id, p.wikidata]));
    for (const a of arenas) {
      expect(a.wikidata, a.id).toMatch(/^Q[1-9]\d*$/);
      expect(others.has(a.id) || others.has(a.wikidata), a.id).toBe(false);
      expect(a.id, a.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("stand inside their country's rough box, so that a slipped sign is caught, and have a name, a city and years in order", () => {
    for (const a of arenas) {
      const box = BOXES[a.country];
      expect(box, `${a.id}: ${a.country}`).toBeDefined();
      expect(a.lat >= box[0] && a.lat <= box[1] && a.lon >= box[2] && a.lon <= box[3], `${a.id} (${a.lat}, ${a.lon})`).toBe(true);
      expect(a.name.length, a.id).toBeGreaterThan(1);
      expect(a.nameJa.length, a.id).toBeGreaterThan(1);
      expect(a.city.length, a.id).toBeGreaterThan(0);
      if (a.from !== undefined && a.to !== undefined) expect(a.from, a.id).toBeLessThanOrEqual(a.to);
      if (a.status === "current") expect(a.to, a.id).toBeUndefined();
      if (KANJI.test(a.nameJa)) expect(a.readingJa, `${a.id}: ${a.nameJa}`).toMatch(KANA);
      else expect(a.readingJa, a.id).toBeUndefined();
      for (const seats of Object.values(a.capacity ?? {})) expect(seats, a.id).toBeGreaterThan(500);
    }
  });

  it("each have a club of the NHL, the NBA, the WNBA or the PWHL as a tenant, and are current when one still plays there", () => {
    for (const a of arenas) {
      const clubs = (TENANTS[a.id] ?? []).filter((t) => LEAGUES.includes(t.league));
      expect(clubs.length, a.id).toBeGreaterThan(0);
      expect(a.status, a.id).toBe(clubs.some((t) => t.to === undefined && t.from !== undefined) ? "current" : "past");
    }
  });

  it("are every current NHL arena (32) and every current NBA arena (30)", () => {
    const current = (league: string) => arenas.filter((a) => (TENANTS[a.id] ?? []).some((t) => t.league === league && t.from !== undefined && t.to === undefined));
    expect(current("NHL")).toHaveLength(32);
    expect(current("NBA")).toHaveLength(30);
    expect(current("NHL").map((a) => a.id)).toEqual(expect.arrayContaining(["td-garden", "madison-square-garden", "bell-centre", "scotiabank-arena", "delta-center"]));
    expect(arenas.filter((a) => a.status === "current").length).toBeGreaterThanOrEqual(50);
  });

  it("go back to the early years of the leagues", () => {
    for (const id of ["montreal-forum", "maple-leaf-gardens", "boston-garden", "chicago-stadium", "madison-square-garden-1925", "spectrum", "detroit-olympia", "mutual-street-arena", "montreal-arena", "jubilee-arena", "mount-royal-arena", "the-arena-ottawa", "ottawa-auditorium", "matthews-arena"]) {
      expect(arenaById(id), id).toBeDefined();
      expect(arenaById(id)?.status, id).toBe("past");
    }
    expect(Math.min(...arenas.map((a) => a.from ?? 9999))).toBeLessThan(1910);
    expect(arenaById("montreal-forum")).toMatchObject({ city: "Montreal", country: "CA" });
    expect(arenaById("maple-leaf-gardens")).toMatchObject({ from: 1931, city: "Toronto" });
  });

  it("have the seats of each sport, only for the sports clubs played there", () => {
    expect(arenaById("td-garden")?.capacity).toBeUndefined();
    expect(arenaById("united-center")?.capacity).toMatchObject({ hockey: expect.any(Number), basketball: expect.any(Number) });
    expect(arenaById("united-center")!.capacity!.hockey).toBeLessThan(arenaById("united-center")!.capacity!.basketball!);
    expect(arenaById("bell-centre")?.capacity?.basketball).toBeUndefined();
    expect(arenaById("chase-center")?.capacity?.hockey).toBeUndefined();
  });
});

describe("the sizes of a rink", () => {
  it("are only those an article publishes, each with its source", () => {
    const sized = arenas.filter((a) => a.rink !== undefined);
    expect(sized.map((a) => a.id).sort()).toEqual(["barton-street-arena", "boston-garden", "matthews-arena", "philadelphia-arena", "windsor-arena"]);
    for (const a of sized) for (const size of a.rink!) {
      expect(size.source, a.id).toMatch(/en\.wikipedia\.org .*revision \d{6,}/);
      expect(size.length, a.id).toBeGreaterThan(size.width);
    }
    expect(arenas.filter((a) => a.court !== undefined)).toEqual([]);
  });

  it("give the rink of Boston Garden in feet, and the Boston Arena's by the year", () => {
    expect(arenaRinkIn(arenaById("boston-garden"))).toEqual({ length: 190.9, width: 83 });
    const matthews = arenaById("matthews-arena");
    expect(arenaRinkIn(matthews, 1926)).toEqual({ length: 220, width: 90 });
    expect(arenaRinkIn(matthews, 1972)).toEqual({ length: 200, width: 80 });
    expect(arenaRinkIn(matthews, 2000)).toEqual({ length: 200, width: 90 });
    expect(arenaRinkIn(matthews)).toEqual({ length: 200, width: 90 });
    expect(arenaRinkIn(arenaById("td-garden"))).toBeUndefined();
    expect(arenaRinkIn(undefined)).toBeUndefined();
    expect(arenaCourtIn(arenaById("td-garden"))).toBeUndefined();
  });

  it("say that the Chicago Stadium, the Buffalo Auditorium and the Cow Palace had a short rink that no article measures", () => {
    for (const id of ["chicago-stadium", "buffalo-memorial-auditorium", "cow-palace"]) {
      expect(arenaById(id)?.rinkUnknown, id).toBe(true);
      expect(arenaById(id)?.rink, id).toBeUndefined();
      expect(describeDrawing({ sport: "nhl", arena: id }).description, id).toContain("shorter than the NHL's");
    }
    expect(describeDrawing({ sport: "nhl", arena: "td-garden" }).description).not.toContain("shorter");
  });
});

describe("names", () => {
  it("are the names of the time: Staples Center until 2019", () => {
    const crypto = arenaById("crypto-com-arena")!;
    expect(arenaNameIn(crypto)).toBe("Crypto.com Arena");
    expect(arenaNameIn(crypto, 2005)).toBe("Staples Center");
    expect(arenaNameIn(crypto, 2024)).toBe("Crypto.com Arena");
    expect(arenaNameIn(crypto, 2005, "ja")).toBe(crypto.nameJa);
    expect(arenaOfficialName(crypto, "en")).toBeUndefined();
  });

  it("are found by any name, in English or in Japanese, ignoring case and punctuation", () => {
    expect(arenaByName("Staples Center")?.id).toBe("crypto-com-arena");
    expect(arenaByName("fleetcenter")?.id).toBe("td-garden");
    expect(arenaByName("Boston Garden")?.id).toBe("boston-garden");
    expect(arenasByName("Boston Garden").map((a) => a.id)).toEqual(["boston-garden", "td-garden"]);
    expect(arenaByName("マディソン・スクエア・ガーデン")?.id).toBe("madison-square-garden");
    expect(arenaByName("Centre Bell")?.id).toBe("bell-centre");
    expect(arenaByName("nothing here")).toBeUndefined();
    expect(arenaByName(undefined)).toBeUndefined();
    expect(placeByName("Staples Center")?.id).toBe("crypto-com-arena");
  });

  it("link to the revision of the article they were read from", () => {
    const { en } = arenaById("boston-garden")!;
    expect(arenaSourceUrl(en)).toBe(`https://en.wikipedia.org/w/index.php?title=Boston_Garden&oldid=${en.revision}`);
  });
});

describe("in the atlas", () => {
  it("are places of the kind arena, with a hockey or a basketball sport, and both where both were played", () => {
    const place = placeById("td-garden")!;
    expect(place).toMatchObject({ kind: "arena", sport: "hockey", sports: ["hockey", "basketball"], status: "current", country: "US", city: "Boston", wikidata: "Q432105" });
    expect(place.leagues).toEqual(expect.arrayContaining(["NHL", "NBA"]));
    expect(placeById("chase-center")).toMatchObject({ sport: "basketball", sports: ["basketball"] });
    expect(placeById("bell-centre")).toMatchObject({ sport: "hockey", sports: ["hockey"] });
    expect(PLACES.filter((p) => p.kind === "arena")).toHaveLength(arenas.length);
    expect(atlasFacets().sports).toEqual(["baseball", "basketball", "budo", "hockey", "soccer"]);
    expect(atlasFacets().leagues).toEqual(expect.arrayContaining(["NHL", "NBA", "WNBA", "PWHL"]));
  });

  it("are filtered by sport, league, status and year, and a place of both sports is found by either", () => {
    const hockey = placesBy({ sport: "hockey" });
    const basketball = placesBy({ sport: "basketball" });
    expect(hockey.every((p) => p.kind === "arena")).toBe(true);
    expect(hockey.map((p) => p.id)).toContain("td-garden");
    expect(basketball.map((p) => p.id)).toContain("td-garden");
    expect(hockey.map((p) => p.id)).not.toContain("chase-center");
    expect(placesBy({ sport: ["hockey", "basketball"] }).length).toBe(arenas.length);
    expect(placesBy({ league: "NHL", status: "current", kind: "arena" }).length).toBeGreaterThanOrEqual(32);
    expect(placesBy({ league: "WNBA" }).map((p) => p.id)).toContain("wintrust-arena");
    expect(placesBy({ league: "PWHL" }).map((p) => p.id)).toContain("place-bell");
    expect(placesBy({ sport: "baseball" }).every((p) => p.kind === "park")).toBe(true);
    expect(placesBy({ year: 1935, sport: "hockey" }).map((p) => p.id)).toEqual(expect.arrayContaining(["boston-garden", "maple-leaf-gardens", "montreal-forum", "chicago-stadium"]));
    expect(placesBy({ year: 1935, sport: "hockey" }).map((p) => p.id)).not.toContain("td-garden");
  });

  it("are found by the club that played there, in English and in Japanese", () => {
    expect(placesByClub("Boston Bruins").map((p) => p.id)).toEqual(expect.arrayContaining(["td-garden", "boston-garden", "matthews-arena"]));
    expect(placesBy({ text: "canadiens" }).map((p) => p.id)).toEqual(expect.arrayContaining(["bell-centre", "montreal-forum"]));
    expect(placesBy({ text: "ボストン・ブルーインズ" }).map((p) => p.id)).toContain("td-garden");
    expect(placesBy({ text: "staples" }).map((p) => p.id)).toContain("crypto-com-arena");
    expect(placesBy({ text: "ガーデン", sport: "hockey" }).map((p) => p.id)).toEqual(expect.arrayContaining(["td-garden", "boston-garden"]));
  });

  it("offer the rink and the court, each with the arena, whichever clubs played there", () => {
    expect(surfacesOf(placeById("td-garden")!)).toEqual([{ sport: "nhl", arena: "td-garden" }, { sport: "nba", arena: "td-garden" }]);
    expect(surfacesOf(placeById("chase-center")!)).toEqual([{ sport: "nba", arena: "chase-center" }]);
    expect(surfaceOf(placeById("bell-centre")!)).toEqual({ sport: "nhl", arena: "bell-centre" });
    expect(surfaceOf(placeById("td-garden")!, "nba")).toEqual({ sport: "nba", arena: "td-garden" });
    expect(surfaceOf(placeById("td-garden")!, "nhl")).toEqual({ sport: "nhl", arena: "td-garden" });
    expect(surfaceOf(placeById("bell-centre")!, "nba")).toBeUndefined();
    expect(surfaceOf(placeById("chase-center")!, "nhl")).toBeUndefined();
    // A park a basketball club played in offers the NBA's court, with no arena.
    expect(surfaceOf(placeById("rogers-centre")!, "nba")).toEqual({ sport: "nba" });
  });
});

describe("drawn", () => {
  it("at the rink's own size when an article gives one, the league's otherwise", () => {
    const standard = drawKyogijo({ sport: "nhl", style: "none" });
    const garden = drawKyogijo({ sport: "nhl", arena: "boston-garden", style: "none" });
    expect(viewBox(garden)).not.toBe(viewBox(standard));
    expect(viewBox(garden)).toBe("-8 -8 206.9 99");
    expect(viewBox(drawKyogijo({ sport: "nhl", arena: "td-garden", style: "none" }))).toBe(viewBox(standard));
    expect(viewBox(drawKyogijo({ sport: "nhl", arena: "chicago-stadium", style: "none" }))).toBe(viewBox(standard));
    expect(drawKyogijo({ sport: "nba", arena: "boston-garden", style: "none" })).toContain('data-sport="nba"');
    expect(viewBox(drawKyogijo({ sport: "nba", arena: "boston-garden", style: "none" }))).toBe(viewBox(drawKyogijo({ sport: "nba", style: "none" })));
  });

  it("at the size of the year: the Boston Arena's ice was 220 by 90 feet in the 1920s and 200 by 80 in 1972", () => {
    const sizes = [1926, 1972, 2000].map((year) => viewBox(drawKyogijo({ sport: "nhl", arena: "matthews-arena", year, style: "none" })));
    expect(sizes).toEqual(["-8 -8 236 106", "-8 -8 216 96", "-8 -8 216 106"]);
    expect(outlineOf({ sport: "nhl", arena: "matthews-arena", year: 1926 }).box).toMatchObject({ w: 220, h: 90 });
    expect(outlineOf({ sport: "nhl", arena: "boston-garden" }).box.w).toBeCloseTo(190.9, 1);
    expect(outlineOf({ sport: "nhl" }).box).toMatchObject({ w: 200, h: 85 });
  });

  it("with the arena's name of the year in the title, in both languages, and the size said in the description", () => {
    expect(describeDrawing({ sport: "nhl", arena: "boston-garden" })).toEqual({ title: "Boston Garden, hockey rink", description: expect.stringContaining("190.9 by 83 feet (58.2 by 25.3 metres)") });
    expect(describeDrawing({ sport: "nhl", arena: "boston-garden" }).description).toContain("The size is the one published for Boston Garden.");
    expect(describeDrawing({ sport: "nhl", arena: "matthews-arena", year: 1926 }).title).toBe("Boston Arena, hockey rink");
    expect(describeDrawing({ sport: "nba", arena: "crypto-com-arena", year: 2005 }).title).toBe("Staples Center, basketball court");
    expect(describeDrawing({ sport: "nba", arena: "crypto-com-arena", language: "ja" }).title).toBe(`${ARENAS["crypto-com-arena"].nameJa}のバスケットボールコート`);
    expect(describeDrawing({ sport: "nhl", arena: "boston-garden", language: "ja" }).description).toContain("約58.2m");
    expect(describeDrawing({ sport: "nhl" }).title).toBe("NHL hockey rink");
  });

  it("only for the NHL and the NBA, and a league of your own wins over the arena's size", () => {
    expect(drawKyogijo({ sport: "soccer", arena: "boston-garden", style: "none", id: "a" })).toBe(drawKyogijo({ sport: "soccer", style: "none", id: "a" }));
    expect(drawKyogijo({ sport: "nhl", league: "iihf", arena: "boston-garden", style: "none", id: "a" })).toBe(drawKyogijo({ sport: "nhl", league: "iihf", style: "none", id: "a" }));
  });

  it("with an arena that is not one making no mark on the markup", () => {
    const hostile = '"><script>alert(1)</script>';
    const svg = drawKyogijo({ sport: "nhl", arena: hostile, style: "none", id: "a" });
    expect(svg).toBe(drawKyogijo({ sport: "nhl", style: "none", id: "a" }));
    expect(svg).not.toContain("<script");
    expect(describeDrawing({ sport: "nhl", arena: "nowhere" }).title).toBe("NHL hockey rink");
  });

  it("every surface every arena offers", () => {
    for (const a of arenas) {
      for (const surface of surfacesOf(placeById(a.id)!)) {
        const svg = drawKyogijo({ ...surface, style: "none" });
        expect(svg.startsWith("<svg"), `${a.id} ${surface.sport}`).toBe(true);
        expect(svg, `${a.id} ${surface.sport}`).toContain(`data-sport="${surface.sport}"`);
      }
    }
  });
});
