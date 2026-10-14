import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { buildZoneSet } from "./heat.zones.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { outlineOf } from "./outline.ts";
import { fenceAt } from "./geometry.ts";
import { courtOf, leagueById } from "./leagues.ts";
import type { BasketballLeague } from "./leagues/basketball.ts";
import { PARKS } from "./parks.ts";
import { RULE_IDS } from "./rules.types.ts";
import { PARKS_WITHOUT_WALL_HEIGHTS, betweenHashes, homeRun, inCrease, inPaint, inPenaltyArea, inRedZone, inRestrictedArea, inSixYardBox, inSlot, isFair, isHomeRun, isThreePointer, onWarningTrack, overWall, wallHeightAt, zoneAt, zoneName, zoneResolver } from "./zones-entry.ts";
import type { Sport, SurfaceOptions } from "./types.ts";

const words = KYOGIJO_STRINGS.en.layers.zones;

describe("hockey, from the rink's own figures", () => {
  const at = (x: number, y: number, o: object = {}) => zoneAt("nhl", [x, y], { frame: "nhl-api", ...o });

  it("splits the ice at the blue lines, 75 feet from the boards", () => {
    expect(at(-26, 0).zone).toBe("defensive-zone");
    expect(at(-24, 0).zone).toBe("neutral-zone");
    expect(at(0, 0).zone).toBe("neutral-zone");
    expect(at(24, 0).zone).toBe("neutral-zone");
    expect(at(26, 0).zone).toBe("offensive-zone");
    expect(at(99, 0).zone).toBe("offensive-zone");
  });

  it("knows the crease, the slot, the circles and behind the net", () => {
    // The goal line is 11 feet from the boards, so x = 89 in the NHL API's feet: the crease reaches out from it.
    expect(at(85, 0).subzone).toBe("crease");
    expect(inCrease([85, 3.9], { frame: "nhl-api" })).toBe(true);
    expect(inCrease([85, 4.5], { frame: "nhl-api" })).toBe(false);
    expect(inCrease([80, 0], { frame: "nhl-api" })).toBe(false);
    expect(at(97, 0).zones).toContain("behind-goal-line");
    expect(at(97, 0).zones).toContain("trapezoid");
    expect(at(97, 20).zones).not.toContain("trapezoid");
    expect(inSlot([80, 0], { frame: "nhl-api" })).toBe(true);
    expect(inSlot([66, 0], { frame: "nhl-api" })).toBe(true);
    expect(inSlot([52, 0], { frame: "nhl-api" })).toBe(false);
    expect(inSlot([75, 12], { frame: "nhl-api" })).toBe(false);
    // The right end-zone face-off dot, 69 feet from centre ice and 22 to a side.
    expect(at(69, 22).zones).toContain("faceoff-circle");
    expect(at(69, 22).subzone).toBe("faceoff-circle");
    expect(at(69, 38).zones).not.toContain("faceoff-circle");
    expect(at(0, 0).subzone).toBe("centre-circle");
  });

  it("is the same on both ends, and turns a team that attacks the left", () => {
    expect(at(-85, 0).subzone).toBe("crease");
    expect(at(-85, 0).zone).toBe("defensive-zone");
    expect(at(-85, 0, { attacking: "left" }).zone).toBe("offensive-zone");
  });

  it("agrees with the package's own slot zones on a grid, and names a league's rink by its own blue line", () => {
    const o = { sport: "nhl" } as const;
    const set = buildZoneSet("nhl-slot", { o, outline: outlineOf(o), direction: "right", end: "right", los: undefined, bats: undefined, words });
    for (let x = 100; x <= 200; x += 2) {
      for (let y = 0; y <= 85; y += 2.5) {
        const zone = set.zones[set.which(x, y)]?.id;
        const slot = zone === "inner-slot" || zone === "outer-slot";
        expect(inSlot([x, y]), `${x},${y}`).toBe(slot);
      }
    }
    // The IIHF's blue lines are 22.5 m from the end boards, not the NHL's 75 feet.
    expect(zoneAt("nhl", [(60 - 22.5 - 1) * 3.2808, 15 * 3.2808], { league: "iihf" }).zone).toBe("neutral-zone");
    expect(zoneAt("nhl", [(60 - 22.5 + 1) * 3.2808, 15 * 3.2808], { league: "iihf" }).zone).toBe("offensive-zone");
  });
});

describe("basketball, from the court's own figures", () => {
  const at = (x: number, y: number, o: object = {}) => zoneAt("nba", [x, y], { frame: "nba-stats", ...o });

  it("is the frontcourt or the backcourt of the basket it attacks", () => {
    expect(at(0, 100).zone).toBe("frontcourt");
    expect(at(0, 500).zone).toBe("backcourt");
  });

  it("finds the restricted area, the paint, the mid-range, the corners and the arc", () => {
    expect(at(0, 0).subzone).toBe("restricted-area");
    expect(inRestrictedArea([0, 30], { frame: "nba-stats" })).toBe(true);
    expect(inRestrictedArea([0, 50], { frame: "nba-stats" })).toBe(false);
    expect(at(0, 80).subzone).toBe("paint");
    expect(inPaint([0, 80], { frame: "nba-stats" })).toBe(true);
    expect(at(0, 120).subzone).toBe("paint");
    expect(at(0, 150).subzone).toBe("mid-range");
    // Tenths of a foot, and LOC_X is negative at the shooter's left: the corner three is 22 feet out, the arc 23.75 feet from the hoop.
    expect(at(-225, 30).subzone).toBe("corner-three-left");
    expect(at(225, 30).subzone).toBe("corner-three-right");
    expect(at(0, 250).subzone).toBe("above-the-break");
  });

  it("says three from the line's own geometry, the corners 22 feet out and the arc 23.75", () => {
    expect(isThreePointer([0, 236], { frame: "nba-stats" })).toBe(false);
    expect(isThreePointer([0, 240], { frame: "nba-stats" })).toBe(true);
    expect(isThreePointer([215, 10], { frame: "nba-stats" })).toBe(false);
    expect(isThreePointer([225, 10], { frame: "nba-stats" })).toBe(true);
    // From the backcourt a heave is beyond the line too.
    expect(isThreePointer([0, 500], { frame: "nba-stats" })).toBe(true);
  });

  it("takes a league's court: FIBA's arc is 6.75 m, and the 1990s NBA's was 22 feet", () => {
    // 23.0 feet out from the hoop is a three on the FIBA court (6.75 m = 22.15 ft) and not on the NBA's (23.75).
    expect(isThreePointer([0, 230], { frame: "nba-stats" })).toBe(false);
    const fiba = courtOf(leagueById("nba", "fiba") as BasketballLeague);
    const from = (feet: number) => [fiba.length - (fiba.basket + feet), fiba.width / 2] as const;
    expect(isThreePointer(from(22.5), { league: "fiba" })).toBe(true);
    expect(isThreePointer(from(21.5), { league: "fiba" })).toBe(false);
    expect(isThreePointer([0, 225], { frame: "nba-stats", year: 1995 })).toBe(true);
    expect(isThreePointer([0, 225], { frame: "nba-stats", year: 2020 })).toBe(false);
  });

  it("agrees with the package's own shot zones on a grid", () => {
    const o = { sport: "nba" } as const;
    const set = buildZoneSet("nba-shot", { o, outline: outlineOf(o), direction: "right", end: "right", los: undefined, bats: undefined, words });
    const map: Record<string, string> = { "corner-top": "corner-three-left", "corner-bottom": "corner-three-right", "above-the-break": "above-the-break", "mid-range": "mid-range", paint: "paint", "restricted-area": "restricted-area" };
    for (let x = 47.2; x <= 94; x += 1.3) {
      for (let y = 0.2; y <= 50; y += 1.7) {
        const theirs = set.zones[set.which(x, y)]?.id;
        expect(zoneAt("nba", [x, y]).subzone, `${x},${y}`).toBe(theirs === undefined ? undefined : map[theirs]);
      }
    }
  });
});

describe("soccer, from the Laws' own figures", () => {
  const at = (x: number, y: number, o: object = {}) => zoneAt("soccer", [x, y], { frame: "opta", ...o });

  it("has thirds, the six-yard box, the penalty area, the D and the half-spaces", () => {
    expect(at(10, 50).zone).toBe("defensive-third");
    expect(at(50, 50).zone).toBe("middle-third");
    expect(at(90, 50).zone).toBe("attacking-third");
    // Opta's penalty line is at 83: the box reaches 17 of 100 in.
    expect(at(95, 50).subzone).toBe("six-yard-box");
    expect(inSixYardBox([95, 50], { frame: "opta" })).toBe(true);
    expect(inPenaltyArea([88, 50], { frame: "opta" })).toBe(true);
    expect(inPenaltyArea([88, 10], { frame: "opta" })).toBe(false);
    expect(inPenaltyArea([80, 50], { frame: "opta" })).toBe(false);
    expect(at(80, 50).subzone).toBe("penalty-arc");
    // Opta's y grows up the drawing, and the attacker, facing the right end, has his left at the top: a low y is his right.
    expect(at(80, 30).subzone).toBe("half-space-right");
    expect(at(60, 35).subzone).toBe("half-space-right");
    expect(at(60, 65).subzone).toBe("half-space-left");
    expect(at(60, 5).subzone).toBe("wing-right");
    expect(at(60, 95).subzone).toBe("wing-left");
    expect(at(60, 50).subzone).toBe("central-corridor");
  });

  it("is the same at the end the team defends, with its own ids", () => {
    expect(at(5, 50).zones).toContain("own-six-yard-box");
    expect(at(12, 50).zones).toContain("own-penalty-area");
    expect(at(12, 50, { attacking: "left" }).zones).toContain("penalty-area");
  });

  it("keeps to a pitch of its own size, and a small-sided format's semicircle", () => {
    expect(zoneAt("soccer", [3, 34], { units: "m", pitch: { length: 105, width: 68, unit: "m" } }).subzone).toBe("own-six-yard-box");
    expect(zoneAt("soccer", [102, 34], { units: "m", pitch: { length: 105, width: 68, unit: "m" } }).subzone).toBe("six-yard-box");
    expect(zoneAt("soccer", [3, 20], { units: "m", pitch: "7-a-side" }).zones.some((z) => z.includes("penalty-area"))).toBe(true);
  });

  it("names every id it uses in English and Japanese", () => {
    for (const id of RULE_IDS) {
      expect(zoneName(id, "en"), id).not.toBe(id);
      expect(zoneName(id, "ja"), id).not.toBe(zoneName(id, "en"));
    }
  });
});

describe("baseball, from the park's own fence", () => {
  it("is fair between the foul lines, the lines themselves fair", () => {
    expect(isFair([0, 100], { frame: "retrosheet" })).toBe(true);
    expect(isFair([100, 100], { frame: "retrosheet" })).toBe(true);
    expect(isFair([101, 100], { frame: "retrosheet" })).toBe(false);
    expect(isFair([0, -5], { frame: "retrosheet" })).toBe(false);
  });

  it("is the infield inside the 95-foot arc, the outfield beyond it, and the warning track at the fence", () => {
    expect(zoneAt("mlb", [0, 100], { frame: "retrosheet" }).zone).toBe("infield");
    expect(zoneAt("mlb", [0, 150], { frame: "retrosheet" }).zone).toBe("infield");
    expect(zoneAt("mlb", [0, 160], { frame: "retrosheet" }).zone).toBe("outfield");
    expect(zoneAt("mlb", [0, 200], { frame: "retrosheet" }).zone).toBe("outfield");
    expect(zoneAt("mlb", [0, 200], { frame: "retrosheet" }).subzone).toBe("centre-field");
    expect(zoneAt("mlb", [-120, 250], { frame: "retrosheet" }).subzone).toBe("left-field");
    // Fenway Park's centre field fence is 390 feet; the generic field's is 400.
    expect(onWarningTrack([0, 380], { frame: "retrosheet", park: "fenway-park" })).toBe(true);
    expect(onWarningTrack([0, 350], { frame: "retrosheet", park: "fenway-park" })).toBe(false);
    expect(zoneAt("mlb", [0, 392], { frame: "retrosheet" }).subzone).toBe("warning-track");
  });

  it("goes over the wall by the park's own fence, not a generic one", () => {
    expect(overWall([0, 395], { frame: "retrosheet", park: "fenway-park" })).toBe(true);
    expect(overWall([0, 385], { frame: "retrosheet", park: "fenway-park" })).toBe(false);
    expect(overWall([0, 395], { frame: "retrosheet" })).toBe(false);
    expect(overWall([300, 100], { frame: "retrosheet" })).toBe(false);
    expect(zoneAt("mlb", [0, 500], { frame: "retrosheet" }).inBounds).toBe(false);
    expect(zoneAt("mlb", [0, 500], { frame: "retrosheet" }).zone).toBe("over-the-wall");
  });
});

describe("home runs from the park's own fence and wall", () => {
  it("is a home run beyond the fence in fair territory, whatever the wall, when no height is given", () => {
    for (const id of Object.keys(PARKS)) {
      const park = PARKS[id];
      const fence = fenceAt(park.points, 0);
      expect(homeRun(id, [0, fence + 10], { frame: "retrosheet" }).homeRun, id).toBe(true);
      expect(homeRun(id, [0, fence - 10], { frame: "retrosheet" }).homeRun, id).toBe(false);
      expect(homeRun(id, [-500, 10], { frame: "retrosheet" }).reason, id).toBe("foul");
    }
  });

  it("compares a ball's height to the wall, and says where the wall's height is missing", () => {
    const left = [-250, 250] as const;
    expect(homeRun("fenway-park", left, { frame: "retrosheet", height: 30 }).reason).toBe("struck-wall");
    expect(isHomeRun("fenway-park", left, { frame: "retrosheet", height: 40 })).toBe(true);
    expect(homeRun("fenway-park", left, { frame: "retrosheet" }).wall).toBeCloseTo(37.167, 3);
    expect(wallHeightAt(PARKS["fenway-park"], -35)).toBeCloseTo(37.167, 3);
    // Before 1934 the Fenway wall in left was 25 feet.
    expect(wallHeightAt(PARKS["fenway-park"], -35, 1920)).toBe(25);
    const bare = PARKS_WITHOUT_WALL_HEIGHTS[0];
    const verdict = homeRun(bare, [0, fenceAt(PARKS[bare].points, 0) + 20], { frame: "retrosheet", height: 12 });
    expect(verdict.homeRun).toBeUndefined();
    expect(verdict.reason).toBe("unknown-wall");
    expect(verdict.wallData).toBe(false);
    expect(PARKS_WITHOUT_WALL_HEIGHTS.length + Object.values(PARKS).filter((p) => (p.walls ?? []).length > 0).length).toBe(Object.keys(PARKS).length);
    expect(() => homeRun("nowhere", [0, 1])).toThrow(/Unknown park/);
  });
});

describe("football, from the field's own figures", () => {
  const at = (x: number, y: number, o: object = {}) => zoneAt("nfl", [x, y], { frame: "nfl-tracking", ...o });

  it("has end zones, halves, the red zone and the hashes", () => {
    expect(at(5, 26).zone).toBe("own-end-zone");
    expect(at(30, 26).zone).toBe("own-half");
    expect(at(80, 26).zone).toBe("opponent-half");
    expect(at(105, 26).zone).toBe("red-zone");
    expect(inRedZone([91, 26], { frame: "nfl-tracking" })).toBe(true);
    expect(inRedZone([89, 26], { frame: "nfl-tracking" })).toBe(false);
    expect(at(115, 26).zone).toBe("opponent-end-zone");
    expect(at(115, 26).zones).toContain("end-zone");
    expect(betweenHashes([60, 26.7], { frame: "nfl-tracking" })).toBe(true);
    expect(betweenHashes([60, 10], { frame: "nfl-tracking" })).toBe(false);
    expect(at(60, 10).subzone).toBe("outside-hashes-right");
    expect(at(60, 45).subzone).toBe("outside-hashes-left");
  });

  it("takes a league's hashes: the CFL's are 84 feet from the sideline", () => {
    const cfl = (y: number) => zoneAt("cfl", [225, y], {}).subzone;
    expect(cfl(80)).toBe("outside-hashes-left");
    expect(cfl(97.5)).toBe("between-the-hashes");
  });
});

describe("every other sport answers in its zone sets", () => {
  it("names a zone from the sport's own set", () => {
    expect(zoneAt("tennis", [10, 3]).zone).toBe("back-court-left");
    expect(zoneAt("curling", [0, 0], { frame: "curling" }).zone).toContain("button");
    expect(zoneAt("lacrosse", [10, 10]).zone).toBeDefined();
    expect(Object.keys(zoneAt("tennis", [10, 3]).sets)).toEqual(["net-court"]);
  });

  it("is nothing off the surface", () => {
    const off = zoneAt("nhl", [-500, 0], { frame: "nhl-api" });
    expect(off.inBounds).toBe(false);
    expect(off.zone).toBeUndefined();
    expect(off.zones).toEqual([]);
  });

  it("answers every sport at its middle, and refuses a bad point", () => {
    const sports: Sport[] = ["nfl", "cfl", "ifaf", "nhl", "nba", "mlb", "soccer", "curling", "tennis", "volleyball", "badminton", "pickleball", "tabletennis", "padel", "squash", "racquetball", "sepaktakraw", "teqball", "roundnet", "netball", "swimming", "waterpolo", "diving", "artisticswimming", "athletics", "skating", "lacrosse", "rugby", "afl", "gaelic", "cricket", "fieldhockey", "handball"];
    for (const sport of sports) {
      const box = outlineOf({ sport } as SurfaceOptions).box;
      const a = zoneAt(sport, [box.x + box.w * 0.55, box.y + box.h * 0.5]);
      expect(a.sport).toBe(sport);
      expect(a.at).toHaveLength(2);
    }
    expect(() => zoneAt("nhl", [Number.NaN, 0])).toThrow(/finite/);
  });

  it("gives the same answer as the resolver the marks use", () => {
    const resolve = zoneResolver("nhl");
    const a = zoneAt("nhl", [169, 20.5]);
    expect(resolve(169, 20.5)).toBe(a.subzone ?? a.zone);
  });

  it("marks a layer's points with the zone, the index and the caller's id", () => {
    const svg = drawKyogijo({ sport: "nhl", layers: [{ kind: "points", data: [{ x: 169, y: 20.5, id: "shot-7" }, { x: 50, y: 10 }] }] });
    expect(svg).toContain('data-mark-id="shot-7" data-index="0" data-zone="faceoff-circle"');
    expect(svg).toContain('data-mark-id="1" data-index="1" data-zone="defensive-zone"');
  });
});
