import { describe, expect, it } from "vitest";

import { drawKyogijo, describe as describeDrawing } from "./draw.ts";
import { EVENTS, EVENT_IDS, EVENT_SOURCES, conventionPlacement, eventById, eventFit, eventOptions, eventSources } from "./events.ts";
import { guestToHost, hostOutline, placementOf } from "./special.ts";
import { outlineOf } from "./outline.ts";
import { sceneOf } from "./scene.ts";
import { PARKS } from "./parks.ts";
import { KYOGIJO_STYLE } from "./style.ts";
import { MLB } from "./geometry.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

const teams = { away: { name: "Away", abbr: "AWY", score: 2, color: "#2f6db0" }, home: { name: "Home", abbr: "HOM", score: 3, color: "#b5452c" } };

const REAL = /[぀-ヿ一-鿿]/u;

describe("the special games", () => {
  it("are 18, in the order they were played, each with a Japanese name, a venue and a day", () => {
    expect(EVENT_IDS).toHaveLength(18);
    const firsts = EVENT_IDS.map((id) => EVENTS[id].dates[0]);
    expect([...firsts].sort()).toEqual(firsts);
    for (const id of EVENT_IDS) {
      const event = EVENTS[id];
      expect(event.id).toBe(id);
      expect(event.name.ja, id).toMatch(REAL);
      expect(event.venue.ja, id).toMatch(REAL);
      for (const day of event.dates) expect(day, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (event.basis.kind === "published") expect(event.basis.note.ja, id).toMatch(REAL);
      if (event.note !== undefined) expect(event.note.ja, id).toMatch(REAL);
    }
  });

  it("cite sources that exist, and every source is used", () => {
    const used = new Set<string>();
    for (const id of EVENT_IDS) {
      const event = EVENTS[id];
      expect(event.sources.length, id).toBeGreaterThan(0);
      for (const source of event.sources) {
        expect(EVENT_SOURCES[source], `${id}: ${source}`).toBeDefined();
        used.add(source);
      }
      if (event.basis.kind === "published") for (const source of event.basis.sources) expect(event.sources, id).toContain(source);
      expect(eventSources(event).map((s) => s.id)).toEqual(event.sources);
    }
    expect([...used].sort()).toEqual(Object.keys(EVENT_SOURCES).sort());
    for (const source of Object.values(EVENT_SOURCES)) {
      expect(source.url, source.id).toMatch(/^https:\/\//);
      expect(source.edition, source.id).toMatch(/\S/);
      expect(source.gave, source.id).toMatch(/\S/);
    }
  });

  it("have the dates and the venues the sources give", () => {
    const day = (id: string): string => EVENTS[id].dates.join(" ");
    expect(day("winter-classic-2009")).toBe("2009-01-01");
    expect(day("winter-classic-2010")).toBe("2010-01-01");
    expect(day("winter-classic-2017")).toBe("2017-01-02");
    expect(day("winter-classic-2018")).toBe("2018-01-01");
    expect(day("winter-classic-2019")).toBe("2019-01-01");
    expect(day("winter-classic-2022")).toBe("2022-01-01");
    expect(day("winter-classic-2023")).toBe("2023-01-02");
    expect(day("stadium-series-2014-dodger")).toBe("2014-01-25");
    expect(day("stadium-series-2014-yankee")).toBe("2014-01-26 2014-01-29");
    expect(day("heritage-classic-2003")).toBe("2003-11-22");
    expect(day("heritage-classic-2011")).toBe("2011-02-20");
    expect(day("heritage-classic-2014")).toBe("2014-03-02");
    expect(day("heritage-classic-2016")).toBe("2016-10-23");
    expect(day("heritage-classic-2019")).toBe("2019-10-26");
    expect(day("heritage-classic-2023")).toBe("2023-10-29");
    expect(day("carrier-classic-2011")).toBe("2011-11-11");
    expect(day("mlb-london-2019")).toBe("2019-06-29 2019-06-30");
    expect(day("mlb-london-2023")).toBe("2023-06-24 2023-06-25");
    expect(EVENTS["winter-classic-2019"].venue.en).toBe("Notre Dame Stadium");
    expect(EVENTS["heritage-classic-2016"].venue.en).toBe("Investors Group Field");
  });

  it("use a ballpark of the package where the venue is one, and its own fence where the source gives it", () => {
    for (const id of EVENT_IDS) {
      const host = EVENTS[id].host;
      if (host.park !== undefined) expect(PARKS[host.park], id).toBeDefined();
    }
    expect(EVENTS["mlb-london-2019"].guest.fence).toEqual({ left: 330, leftCenter: 382, center: 385, rightCenter: 382, right: 330 });
    expect(EVENTS["mlb-london-2023"].guest.fence).toEqual({ left: 330, leftCenter: 387, center: 392, rightCenter: 387, right: 330 });
    expect(EVENTS["winter-classic-2009"].host.park).toBe("wrigley-field");
    expect(EVENTS["winter-classic-2023"].host.park).toBe("fenway-park");
    expect(EVENTS["winter-classic-2019"].host).toMatchObject({ field: "nfl", league: "ncaa" });
  });

  it("draw, every one, in both languages, with its name, its day and how its place was decided", () => {
    for (const id of EVENT_IDS) {
      const event = EVENTS[id];
      const en = drawKyogijo({ ...eventOptions(id), ...teams, status: "final" } as ScoreOptions);
      expect(en.startsWith("<svg"), id).toBe(true);
      expect(en, id).toContain(event.name.en);
      expect(en, id).toContain(`data-event="${id}"`);
      expect(en, id).toContain('data-orientation="landscape"');
      expect(en, id).toContain("Away 2, Home 3");
      expect(en, id).toContain(event.basis.kind === "published" ? "Where it stands follows the sources" : "placed by convention");
      const ja = drawKyogijo({ ...eventOptions(id), ...teams, status: "final", language: "ja" } as ScoreOptions);
      expect(ja, id).toContain(event.name.ja);
      expect(ja, id).toContain(event.venue.ja);
      expect(ja, id).not.toMatch(/\{[a-z]+\}/);
      const bare = drawKyogijo(eventOptions(id));
      expect(bare, id).toContain(`${event.name.en}, `);
      expect(sceneOf(eventOptions(id)).items.length, id).toBeGreaterThan(20);
    }
  });

  it("put the surface in the host: wholly inside a football field, or flagged where it reaches beyond", () => {
    for (const id of EVENT_IDS) {
      const options = eventOptions(id);
      const fit = eventFit(id);
      expect(fit.inside, id).toBe(fit.outside === 0);
      const text = describeDrawing(options).description;
      if (fit.inside) expect(text, id).toContain("lies wholly inside the outline of");
      else expect(text, id).toContain(`${Math.round(fit.outside * 100)} percent of its area, lies outside the outline of`);
      // The rink's four corners, by their own arithmetic, against the host's outline.
      const host = hostOutline(options.host!, options);
      const rink = outlineOf(options);
      const to = guestToHost(options, placementOf(options));
      const corners = [to(rink.box.x, rink.box.y), to(rink.box.x + rink.box.w, rink.box.y), to(rink.box.x + rink.box.w, rink.box.y + rink.box.h), to(rink.box.x, rink.box.y + rink.box.h)];
      if (options.host!.field !== undefined) {
        for (const [x, y] of corners) expect(host.contains(x, y), `${id}: a corner of the rink at ${x}, ${y}`).toBe(true);
        expect(fit.inside, id).toBe(true);
      }
    }
    // The ballpark games reach into foul ground, as the rinks did: their outline is the fair ground only.
    for (const id of EVENT_IDS) if (EVENTS[id].host.park !== undefined && EVENTS[id].guest.sport === "nhl") expect(eventFit(id).inside, id).toBe(false);
    // The baseball field laid over a stadium's pitch is mostly beyond it, and the court on a deck is wholly on it.
    expect(eventFit("mlb-london-2019").outside).toBeGreaterThan(0.5);
    expect(eventFit("carrier-classic-2011").inside).toBe(true);
  });

  it("place each surface where its source says, or by the convention that is worked out, never by an offset of our own", () => {
    for (const id of EVENT_IDS) {
      const event = EVENTS[id];
      if (event.basis.kind === "convention") {
        const wanted = conventionPlacement(event.basis.rule, event.host, { year: event.host.year });
        expect(event.placement.x, `${id} x`).toBeCloseTo(wanted.x, 1);
        expect(event.placement.y, `${id} y`).toBeCloseTo(wanted.y, 1);
        expect(event.placement.angle, `${id} angle`).toBe(wanted.angle);
      }
    }
    // The infield's middle is where the line from first to third crosses the line from home plate to second.
    expect(conventionPlacement("infield", { park: "fenway-park" }).y).toBeCloseTo(-(MLB.base * Math.SQRT2) / 2, 1);
    // Wrigley Field 2009: the rink's edge toward centre field is 112 feet from home plate and 288 from the 400-foot wall; the rink is 85 feet wide.
    expect(EVENTS["winter-classic-2009"].placement).toEqual({ x: 0, y: -(112 - 85 / 2), angle: 0 });
    expect(112 + 288).toBe(PARKS["wrigley-field"].points.find(([angle]) => angle === 0)![1]);
    // Fenway Park 2023: centred across first and third, its length along the line from third base to second, which runs at 45 degrees.
    expect(EVENTS["winter-classic-2023"].placement.angle).toBe(-45);
  });

  it("give a convention's numbers for each rule", () => {
    expect(conventionPlacement("midfield", { field: "cfl" })).toEqual({ x: 225, y: 97.5, angle: 0 });
    expect(conventionPlacement("midfield", { field: "nfl", league: "ncaa" })).toEqual({ x: 180, y: 80, angle: 0 });
    expect(conventionPlacement("deck", { deck: { length: 1092, width: 252 } })).toEqual({ x: 546, y: 126, angle: 0 });
    const diamond = conventionPlacement("diamond", { pitch: { length: 105, width: 68, unit: "m" } });
    expect(diamond.angle).toBe(90);
    expect(diamond.y).toBeCloseTo(111.55, 1);
  });
});

describe("a host in the options", () => {
  const rink: SurfaceOptions = { sport: "nhl", host: { park: "wrigley-field" } };

  it("is drawn with the host's own colours under the guest's, and says so in the root", () => {
    const svg = drawKyogijo(rink);
    expect(svg).toContain('class="ky-host" data-sport="mlb"');
    expect(svg).toContain('class="ky-guest"');
    expect(svg).toContain('data-sport="nhl"');
    expect(svg).toContain(".ky-host[data-sport=mlb]");
    expect(svg).not.toContain(".ky-host[data-sport=soccer]");
    expect(KYOGIJO_STYLE).toContain(".ky-host[data-sport=soccer]");
  });

  it("leaves a drawing with no host byte for byte what it was", () => {
    for (const options of [{ sport: "nhl" }, { sport: "mlb", park: "fenway-park" }, { sport: "cfl" }, { sport: "nba" }, { sport: "soccer" }] as SurfaceOptions[]) {
      const plain = drawKyogijo(options);
      expect(drawKyogijo({ ...options, host: undefined, placement: undefined, event: undefined }), options.sport).toBe(plain);
      expect(plain).not.toContain("ky-host");
      expect(plain).not.toContain("data-event");
    }
  });

  it("puts the guest at the middle of a football field by default, and of a ballpark's infield", () => {
    expect(placementOf({ sport: "nhl", host: { field: "cfl" } })).toEqual({ x: 225, y: 97.5, angle: 0 });
    const park = placementOf(rink);
    expect(park.x).toBe(0);
    expect(park.y).toBeCloseTo(-63.64, 2);
    expect(placementOf({ ...rink, placement: { x: 10, y: -80, angle: 30 } })).toEqual({ x: 10, y: -80, angle: 30 });
    expect(placementOf({ ...rink, placement: { x: Number.NaN, y: -80, angle: Number.POSITIVE_INFINITY } as never }).y).toBe(-80);
  });

  it("is drawn wide, whatever the orientation says", () => {
    const svg = drawKyogijo({ sport: "nhl", host: { field: "nfl" }, orientation: "portrait" });
    expect(svg).toContain('data-orientation="landscape"');
  });

  it("carries the teams and the score on the guest, the score upright, and turns the words with the guest", () => {
    const svg = drawKyogijo({ sport: "nhl", host: { field: "cfl" }, placement: { x: 225, y: 97.5, angle: -45 }, ...teams, status: "final" } as ScoreOptions);
    const banner = /<g class="ky-banner ky-banner-left[^"]*" transform="translate\(([\d.-]+) ([\d.-]+)\)(?: rotate\(([\d.-]+)\))?"/.exec(svg);
    expect(banner).not.toBeNull();
    const [, x, y, turn] = banner as RegExpExecArray;
    // The left end of a rink 200 feet long, turned 45 degrees about the middle of the field, lies up and to the left of it.
    expect(Number(x)).toBeLessThan(225);
    expect(Number(y)).toBeGreaterThan(97.5);
    expect(Number(turn)).toBe(-45);
    const plate = /<g class="ky-plate" transform="translate\(([\d.-]+) ([\d.-]+)\)"/.exec(svg) as RegExpExecArray;
    expect(Number(plate[1])).toBeCloseTo(225, 0);
    expect(Number(plate[2])).toBeCloseTo(97.5, 0);
  });

  it("puts a data layer through the guest's frame, so that its numbers are the rink's", () => {
    const svg = drawKyogijo({ sport: "nhl", host: { field: "cfl" }, layers: [{ kind: "points", name: "shots", data: [{ x: 100, y: 42.5 }] }] });
    const frame = 'transform="translate(225 97.5) translate(-100 -42.5)"';
    expect(svg.split(frame).length - 1).toBe(3);
    expect(svg).toContain("Data: ");
  });

  it("makes a view that holds the guest where it hangs over the host", () => {
    const svg = drawKyogijo({ sport: "mlb", host: { pitch: { length: 105, width: 68, unit: "m" } } });
    const [x, y, w, h] = /viewBox="([^"]+)"/.exec(svg)![1].split(" ").map(Number);
    // The pitch is 344 by 223 feet; the baseball field laid over it is much bigger.
    expect(w).toBeGreaterThan(344.49);
    expect(h).toBeGreaterThan(223.1);
    expect(x).toBeLessThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(0);
  });

  it("takes a deck of any size, in any unit", () => {
    const feet = drawKyogijo({ sport: "nba", host: { deck: { length: 100, width: 40 } } });
    const metres = drawKyogijo({ sport: "nba", host: { deck: { length: 30.48, width: 12.192, unit: "m" } } });
    expect(feet).toContain('class="ky-deck"');
    expect(/viewBox="([^"]+)"/.exec(metres)![1].split(" ").map(Number)[2]).toBeGreaterThan(90);
  });

  it("says no host with nothing to say what it is", () => {
    expect(() => drawKyogijo({ sport: "nhl", host: {} })).toThrow(/needs one of/);
  });

  it("names a ground's host by the ground, a park's by the park, and an unnamed one by what it is, in Japanese too", () => {
    expect(describeDrawing({ sport: "nhl", host: { ground: "wembley" } }).description).toContain("Wembley Stadium");
    expect(describeDrawing({ sport: "nhl", host: { park: "tokyo-dome" }, language: "ja" }).description).toContain("東京ドーム");
    expect(describeDrawing({ sport: "nhl", host: { field: "nfl" } }).description).toContain("the football field");
    expect(describeDrawing({ sport: "nhl", host: { field: "nfl" }, language: "ja" }).description).toContain("フットボールのフィールド");
    expect(describeDrawing({ sport: "nba", host: { deck: { length: 100, width: 40 }, name: "A deck" } }).description).toContain("A deck");
    expect(describeDrawing({ sport: "nhl", host: { park: "fenway-park" } }).title).toBe("NHL hockey rink in Fenway Park");
  });

  it("restyles the guest's lines and no others", () => {
    const thick = drawKyogijo({ sport: "nhl", host: { field: "cfl" }, lineWidth: 3 });
    const plain = drawKyogijo({ sport: "nhl", host: { field: "cfl" } });
    expect(thick).not.toBe(plain);
    expect(thick).toContain('class="ky-host"');
  });

  it("knows the games by key, and says so when it does not", () => {
    expect(eventById("winter-classic-2009")?.venue.en).toBe("Wrigley Field");
    expect(eventById("nothing")).toBeUndefined();
    expect(eventById(undefined)).toBeUndefined();
    expect(() => eventOptions("nothing")).toThrow(/Unknown special game/);
  });
});

describe("the title of a special game", () => {
  it("names a league's surface, not the sport's own", () => {
    expect(describeDrawing(eventOptions("carrier-classic-2011")).title).toContain("USS Carl Vinson");
    expect(describeDrawing(eventOptions("carrier-classic-2011")).title).not.toContain("NBA");
  });
});

describe("a special game and a range", () => {
  it("ignores the range, which is for a surface of its own", () => {
    const whole = drawKyogijo({ sport: "nhl", host: { field: "cfl" } });
    expect(drawKyogijo({ sport: "nhl", host: { field: "cfl" }, range: "offensive-zone" })).toBe(whole);
  });
});
