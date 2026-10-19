import { describe, expect, it } from "vitest";
import { drawKyogijo, describe as describeOf } from "./draw.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { DRIVE_CODES, clockText, hockeyPill, readSituation, situationSentences, situationText, type FootballRead, type HockeyRead, type SituationContext } from "./situation.ts";
import type { ScoreOptions } from "./types.ts";
import { parseXml, walk, withClass } from "./xml.fixture.ts";

const away = { name: "Northern Owls", abbr: "NOW", score: 3, color: "#3a2d6b" };
const home = { name: "Lakeshore Anchors", abbr: "LSA", score: 2, color: "#0f7a7a" };
const game = { away, home } as const;

const nhl: SituationContext = { sport: "nhl", homeSide: "right" };
const nfl: SituationContext = { sport: "nfl", homeSide: "right", football: { yards: 100, downs: 4 } };
const cfl: SituationContext = { sport: "cfl", homeSide: "right", football: { yards: 110, downs: 3 } };

const classes = (svg: string, cls: string) => withClass(parseXml(svg), cls);

describe("a situation, read", () => {
  it("is left out when the options have none, when the sport has none, and for a special game", () => {
    const plain = drawKyogijo({ sport: "nhl", ...game });
    expect(drawKyogijo({ sport: "nhl", ...game, situation: undefined })).toBe(plain);
    expect(drawKyogijo({ sport: "nba", ...game, situation: { awaySkaters: 5, homeSkaters: 4 } })).toBe(drawKyogijo({ sport: "nba", ...game }));
    expect(drawKyogijo({ sport: "nhl", ...game, situation: {} })).toBe(plain);
    expect(drawKyogijo({ sport: "nhl", ...game, situation: { awaySkaters: 5, homeSkaters: 5 } })).toBe(plain);
    expect(readSituation({ awaySkaters: 5 }, { sport: "soccer", homeSide: "left" })).toBeUndefined();
    expect(readSituation("power play", nhl)).toBeUndefined();
    expect(readSituation([1, 2], nhl)).toBeUndefined();
  });

  it("is the same text every time", () => {
    const o = { sport: "nfl", ...game, situation: { ballOn: 88, down: 3, toGo: 7, possession: "away", drive: [{ from: 25, to: 48, result: "punt" }] } } as const;
    expect(drawKyogijo(o)).toBe(drawKyogijo(o));
    expect(drawKyogijo({ ...o, size: "badge" })).toBe(drawKyogijo({ ...o, size: "badge" }));
  });

  it("leaves out a value the sport cannot have, and never throws", () => {
    const hockey = readSituation({ awaySkaters: 7, homeSkaters: 2, clock: "soon", emptyNet: "nobody", delayedPenalty: "x" }, nhl);
    expect(hockey).toBeUndefined();
    const some = readSituation({ awaySkaters: 5, homeSkaters: 4.5, clock: "<b>1:42</b>" }, nhl) as HockeyRead;
    expect(some.away).toBe(5);
    expect(some.home).toBeUndefined();
    expect(some.clock).toBeUndefined();
    expect(readSituation({ outs: 4, balls: 4, strikes: 3, inning: 0, half: "middle" }, { sport: "mlb", homeSide: "right" })).toBeUndefined();
    expect(readSituation({ ballOn: 140, toGo: -3, down: 9 }, nfl)).toBeUndefined();
    expect(readSituation({ ballOn: Number.NaN, down: 2 }, nfl)).toMatchObject({ down: 2, ballOn: undefined });
  });

  it("reads a clock as m:ss, m:ss.s or whole seconds", () => {
    expect(clockText("1:42")).toBe("1:42");
    expect(clockText("0:09.4")).toBe("0:09.4");
    expect(clockText(102)).toBe("1:42");
    expect(clockText("1:61")).toBeUndefined();
    expect(clockText(-1)).toBeUndefined();
    expect(clockText("<script>")).toBeUndefined();
  });
});

describe("hockey", () => {
  it("names the team with more skaters as the attacker, heading for the end opposite its banner", () => {
    const read = readSituation({ awaySkaters: 5, homeSkaters: 4 }, nhl) as HockeyRead;
    expect(read.attacker).toBe("away");
    expect(read.powerPlay).toBe(true);
    expect(read.strength).toEqual([5, 4]);
    // Away is on the left by default, so it heads for the right.
    expect(read.toward).toBe("right");
    const flipped = readSituation({ awaySkaters: 5, homeSkaters: 4 }, { ...nhl, homeSide: "left" }) as HockeyRead;
    expect(flipped.toward).toBe("left");
    expect(readSituation({ awaySkaters: 4, homeSkaters: 5 }, nhl)).toMatchObject({ attacker: "home", toward: "left", strength: [5, 4] });
  });

  it("follows the direction options and the situation's own `toward`", () => {
    const direction = { home: "right", away: "left" } as const;
    expect(readSituation({ awaySkaters: 4, homeSkaters: 5 }, { ...nhl, direction })).toMatchObject({ attacker: "home", toward: "right" });
    expect(readSituation({ awaySkaters: 4, homeSkaters: 5 }, { ...nhl, direction: { ...direction, period: 2 } })).toMatchObject({ toward: "left" });
    expect(readSituation({ awaySkaters: 4, homeSkaters: 5, toward: "right" }, nhl)).toMatchObject({ toward: "right" });
  });

  it("writes the pill: strength, PP, EN, DEL PEN and the clock", () => {
    const pill = (s: object): string | undefined => {
      const read = readSituation(s, nhl) as HockeyRead | undefined;
      return read === undefined ? undefined : hockeyPill(read, "en");
    };
    expect(pill({ awaySkaters: 5, homeSkaters: 4, clock: "1:42" })).toBe("5v4 PP 1:42");
    expect(pill({ awaySkaters: 4, homeSkaters: 5 })).toBe("5v4 PP");
    expect(pill({ awaySkaters: 6, homeSkaters: 5, emptyNet: true })).toBe("6v5 PP EN");
    expect(pill({ awaySkaters: 4, homeSkaters: 4 })).toBe("4v4");
    expect(pill({ awaySkaters: 5, homeSkaters: 5, emptyNet: "home" })).toBe("5v5 EN");
    expect(pill({ delayedPenalty: "home" })).toBe("DEL PEN");
    expect(pill({ awaySkaters: 5, homeSkaters: 5 })).toBeUndefined();
    expect(hockeyPill(readSituation({ awaySkaters: 5, homeSkaters: 4 }, nhl) as HockeyRead, "ja")).toBe("5v4 PP");
  });

  it("tints the attacking zone, in the attacker's colour, and rings an empty net", () => {
    const svg = drawKyogijo({ sport: "nhl", ...game, situation: { awaySkaters: 6, homeSkaters: 5, emptyNet: "away" } });
    const zone = classes(svg, "ky-sit-zone")[0];
    // Away is on the left; it attacks the right end: from the blue line (75) to the boards.
    expect(zone.attrs.class).toContain("ky-sit-zone-left");
    expect(Number(zone.attrs.x)).toBe(125);
    expect(Number(zone.attrs.width)).toBe(75);
    expect(svg).toContain('clip-path="url(#');
    const ring = classes(svg, "ky-sit-net")[0];
    // The pulled team's own net is at the left end.
    expect(Number(ring.attrs.x)).toBeLessThan(11);
    expect(classes(drawKyogijo({ sport: "nhl", ...game, situation: { awaySkaters: 6, homeSkaters: 5, emptyNet: "away" }, orientation: "portrait" }), "ky-sit-zone")).toHaveLength(1);
  });

  it("draws a shootout as rows of dots, the rounds after the third being sudden death", () => {
    const rounds: [boolean | null, boolean | null][] = [[true, false], [true, true], [false, true], [false, false], [true, null]];
    const svg = drawKyogijo({ sport: "nhl", ...game, situation: { shootout: { rounds } } });
    expect(classes(svg, "ky-sit-goal")).toHaveLength(5);
    expect(classes(svg, "ky-sit-miss")).toHaveLength(4);
    expect(classes(svg, "ky-sit-wait")).toHaveLength(1);
    expect(classes(svg, "ky-sit-sd").length).toBe(3);
    expect(classes(svg, "ky-sit-split")).toHaveLength(1);
    const read = readSituation({ shootout: { rounds } }, nhl) as HockeyRead;
    expect(read.shootout?.goals).toEqual([3, 2]);
    expect(read.shootout?.sudden).toBe(2);
    // The strip stands under the score's panel and no pill is drawn with it.
    expect(classes(svg, "ky-sit-pill")).toHaveLength(0);
    expect(drawKyogijo({ sport: "nhl", situation: { shootout: { rounds: [[true, false]] } } })).toContain("ky-sit-strip");
    expect(readSituation({ shootout: { rounds: [] } }, nhl)).toBeUndefined();
    expect(readSituation({ shootout: { rounds: [[null, null]] } }, nhl)).toBeUndefined();
    expect((readSituation({ shootout: { rounds: Array.from({ length: 30 }, () => [false, false]) } }, nhl) as HockeyRead).shootout?.rounds).toHaveLength(12);
  });

  it("is drawn on a past rink, a league's rink, a zone and the Olympic rink", () => {
    const situation = { awaySkaters: 5, homeSkaters: 4, clock: "1:42" };
    for (const extra of [{ year: 2000 }, { league: "iihf" }, { league: "olympic" }, { league: "boston-garden" }, { range: "offensive-zone" as const }, { range: "neutral-zone" as const }]) {
      const svg = drawKyogijo({ sport: "nhl", ...game, ...extra, situation });
      expect(classes(svg, "ky-sit-pill"), JSON.stringify(extra)).toHaveLength(1);
    }
    // A 2000 rink has its blue line at 73 feet, and the tint starts there.
    const old = drawKyogijo({ sport: "nhl", ...game, year: 2000, situation });
    expect(Number(classes(old, "ky-sit-zone")[0].attrs.width)).toBe(73);
  });

  it("keeps the pill inside the drawing, wide and tall", () => {
    for (const orientation of ["landscape", "portrait"] as const) {
      const svg = drawKyogijo({ sport: "nhl", ...game, orientation, situation: { awaySkaters: 5, homeSkaters: 4, clock: "1:42" } });
      expect(classes(svg, "ky-sit-w")).toHaveLength(1);
    }
  });
});

describe("baseball", () => {
  const mlb: SituationContext = { sport: "mlb", homeSide: "right" };
  const bases = [true, false, true] as const;

  it("lights the occupied bases and draws the scorebug", () => {
    const svg = drawKyogijo({ sport: "mlb", ...game, situation: { bases, outs: 2, inning: 7, half: "top", balls: 3, strikes: 2 } });
    expect(classes(svg, "ky-sit-lit")).toHaveLength(2);
    expect(classes(svg, "ky-sit-b-1").length + classes(svg, "ky-sit-b-3").length).toBe(2);
    expect(classes(svg, "ky-sit-out")).toHaveLength(3);
    expect(classes(svg, "ky-sit-on").length).toBe(2 + 2);
    expect(classes(drawKyogijo({ sport: "mlb", ...game, situation: { bases: [true, true, true] } }), "ky-sit-lit")).toHaveLength(3);
    expect(classes(drawKyogijo({ sport: "mlb", ...game, situation: { bases: [false, false, false], outs: 0 } }), "ky-sit-lit")).toHaveLength(0);
  });

  it("is drawn on softball, NPB parks and a cropped infield", () => {
    for (const extra of [{ league: "fastpitch" }, { park: "hanshin-koshien-stadium" }, { range: "infield" as const }]) {
      const svg = drawKyogijo({ sport: "mlb", ...game, ...extra, situation: { bases, outs: 1, inning: 3, half: "bottom", balls: 1, strikes: 1 } });
      expect(classes(svg, "ky-sit-bug"), JSON.stringify(extra)).toHaveLength(1);
    }
  });

  it("writes the label and the sentences", () => {
    expect(situationText({ sport: "mlb", situation: { inning: 7, half: "top", outs: 2, balls: 3, strikes: 2 } })).toBe("Top 7 · 2 out · 3-2");
    expect(situationText({ sport: "mlb", language: "ja", situation: { inning: 7, half: "bottom", outs: 0 } })).toBe("7回裏 · ノーアウト");
    const read = readSituation({ bases: [true, true, true], outs: 1, inning: 11, half: "top", balls: 0, strikes: 2 }, mlb) as never;
    expect(situationSentences(read, "en")).toEqual(["Top of the 11th inning.", "1 out.", "The bases are loaded.", "The count is 0 balls and 2 strikes."]);
    expect(situationSentences(readSituation({ bases: [true, false, true], outs: 3, inning: 2, half: "bottom" }, mlb) as never, "en")).toEqual(["Bottom of the 2nd inning.", "3 outs.", "Runners on first and third."]);
    expect(situationSentences(readSituation({ bases: [false, false, false], inning: 9, half: "top" }, mlb) as never, "ja")).toEqual(["9回表です。", "走者はいません。"]);
  });
});

describe("football", () => {
  const some = { ballOn: 88, toGo: 7, down: 3, possession: "away" } as const;

  it("draws the line of scrimmage, the first-down line, the red zone and the tag", () => {
    const svg = drawKyogijo({ sport: "nfl", ...game, situation: some });
    // Away is on the left; its own goal line is the left one. 88 yards on from x = 30 is 30 + 264.
    const los = classes(svg, "ky-sit-los")[0];
    expect(los.attrs.d).toBe("M294 0V160");
    expect(classes(svg, "ky-sit-fd")[0].attrs.d).toBe("M315 0V160");
    const red = classes(svg, "ky-sit-red")[0];
    expect(Number(red.attrs.x)).toBe(270);
    expect(Number(red.attrs.width)).toBe(60);
    expect(classes(svg, "ky-sit-tag")).toHaveLength(1);
    expect(classes(svg, "ky-text").some((n) => n.text === "3rd &amp; 7")).toBe(true);
  });

  it("draws the IFAF's field as the NFL's: 100 yards, four downs, the same marks", () => {
    const nflSvg = drawKyogijo({ sport: "nfl", ...game, situation: some });
    const svg = drawKyogijo({ sport: "ifaf", ...game, situation: some });
    expect(classes(svg, "ky-sit-tag")).toHaveLength(1);
    expect(classes(svg, "ky-sit-los")).toHaveLength(1);
    expect(classes(svg, "ky-sit-red")).toHaveLength(1);
    expect(classes(svg, "ky-text").some((n) => n.text === "3rd &amp; 7")).toBe(true);
    expect(readSituation({ ...some, down: 4 }, { sport: "ifaf", homeSide: "right", football: { yards: 100, downs: 4 } })).toMatchObject({ down: 4 });
    expect(nflSvg).not.toBe("");
  });

  it("heads for the other end when the home team has the ball, and when `toward` or `direction` say so", () => {
    expect(readSituation({ ...some, possession: "home" }, nfl)).toMatchObject({ toward: "left" });
    expect(readSituation({ ...some, toward: "left" }, nfl)).toMatchObject({ toward: "left" });
    expect(readSituation(some, { ...nfl, direction: { home: "right", away: "left", period: 2 } })).toMatchObject({ toward: "right" });
    const svg = drawKyogijo({ sport: "nfl", ...game, situation: { ...some, possession: "home" } });
    expect(classes(svg, "ky-sit-los")[0].attrs.d).toBe("M66 0V160");
  });

  it("leaves the red zone out when the ball is not in it, unless asked, and when told not to", () => {
    expect(classes(drawKyogijo({ sport: "nfl", ...game, situation: { ballOn: 50, down: 1, toGo: 10 } }), "ky-sit-red")).toHaveLength(0);
    expect(classes(drawKyogijo({ sport: "nfl", ...game, situation: { ballOn: 50, redZone: true, possession: "away" } }), "ky-sit-red")).toHaveLength(1);
    expect(classes(drawKyogijo({ sport: "nfl", ...game, situation: { ...some, redZone: false } }), "ky-sit-red")).toHaveLength(0);
  });

  it("writes goal-to-go, and no first-down line when the goal line is nearer", () => {
    const read = readSituation({ ballOn: 96, toGo: 4, down: 1, possession: "away" }, nfl) as FootballRead;
    expect(situationText({ sport: "nfl", situation: { ballOn: 96, toGo: 4, down: 1 } })).toBe("1st & Goal · OPP 4");
    expect(read.redZone).toBe(true);
    expect(classes(drawKyogijo({ sport: "nfl", ...game, situation: { ballOn: 96, toGo: 4, down: 1, possession: "away" } }), "ky-sit-fd")).toHaveLength(0);
    expect(situationText({ sport: "nfl", situation: { ballOn: 90, toGo: "goal", down: 2 } })).toBe("2nd & Goal · OPP 10");
    expect(situationText({ sport: "nfl", situation: { ballOn: 35, toGo: 10, down: 1 } })).toBe("1st & 10 · OWN 35");
    expect(situationText({ sport: "nfl", situation: { ballOn: 50, down: 2, toGo: 3 } })).toBe("2nd & 3 · 50");
  });

  it("respects the CFL: 110 yards, 20-yard end zones and three downs", () => {
    expect(readSituation({ ballOn: 111, down: 1 }, cfl)).toMatchObject({ ballOn: undefined, down: 1 });
    expect(readSituation({ ballOn: 108, down: 4 }, cfl)).toMatchObject({ ballOn: 108, down: undefined, redZone: true });
    expect(readSituation({ down: 4 }, cfl)).toBeUndefined();
    expect(readSituation({ ballOn: 108, down: 4 }, nfl)).toMatchObject({ ballOn: undefined, down: 4 });
    expect(situationText({ sport: "cfl", situation: { ballOn: 55, down: 3, toGo: 12 } })).toBe("3rd & 12 · 55");
    const svg = drawKyogijo({ sport: "cfl", ...game, situation: { ballOn: 98, toGo: 12, down: 3, possession: "away" } });
    // The CFL's end zone is 60 feet deep: 98 yards on is 60 + 294.
    expect(classes(svg, "ky-sit-los")[0].attrs.d).toBe("M354 0V195");
    expect(Number(classes(svg, "ky-sit-red")[0].attrs.x)).toBe(330);
  });

  it("draws a drive chart, an arrow in a lane for each drive, each with its result", () => {
    const drive = [
      { from: 25, to: 48, result: "punt" },
      { from: 30, to: 100, result: "touchdown" },
      { team: "home", from: 25, to: 40, result: "interception" },
      { from: 20, to: 22 },
    ] as const;
    const svg = drawKyogijo({ sport: "nfl", ...game, situation: { possession: "away", drive } });
    expect(classes(svg, "ky-sit-dr")).toHaveLength(4);
    const codes = classes(svg, "ky-sit-dl").map((n) => n.text);
    expect(codes).toEqual([DRIVE_CODES.punt, DRIVE_CODES.touchdown, DRIVE_CODES.interception]);
    expect(classes(svg, "ky-sit-d-touchdown").length).toBeGreaterThan(0);
    const ys = classes(svg, "ky-sit-dr").map((n) => /M[\d.]+ ([\d.]+)/.exec(n.attrs.d)?.[1]);
    expect(new Set(ys).size).toBe(4);
    const home = readSituation({ possession: "away", drive }, nfl) as FootballRead;
    expect(home.drive.map((d) => d.toward)).toEqual(["right", "right", "left", "right"]);
    expect(readSituation({ drive: [{ from: -1, to: 5 }, { from: "a", to: 5 }, null, { from: 1, to: 2, result: "bad" }] }, nfl)).toMatchObject({ drive: [{ from: 1, to: 2, result: undefined }] });
    expect((readSituation({ drive: Array.from({ length: 60 }, () => ({ from: 1, to: 9 })) }, nfl) as FootballRead).drive).toHaveLength(24);
  });

  it("keeps the tag inside a tall field and a cropped red zone", () => {
    for (const extra of [{ orientation: "portrait" as const }, { range: "red-zone" as const }, { league: "ncaa" }, { year: 1980 }]) {
      const svg = drawKyogijo({ sport: "nfl", ...game, ...extra, situation: some });
      expect(classes(svg, "ky-sit-tag"), JSON.stringify(extra)).toHaveLength(1);
    }
  });
});

describe("the badge and the compact card", () => {
  it("shows the pill, the scorebug and the tag in place of the picture of the surface", () => {
    const hockey = drawKyogijo({ sport: "nhl", ...game, size: "badge", situation: { awaySkaters: 5, homeSkaters: 4, clock: "1:42" } });
    expect(classes(hockey, "ky-badge-situation")).toHaveLength(1);
    expect(classes(hockey, "ky-glyph")).toHaveLength(0);
    expect(hockey).toContain("5v4 PP 1:42");
    const bug = drawKyogijo({ sport: "mlb", ...game, size: "badge", status: "Top 7", situation: { bases: [true, false, false], outs: 1, inning: 7, half: "top", balls: 2, strikes: 1 } });
    expect(classes(bug, "ky-sit-bug")).toHaveLength(1);
    expect(classes(bug, "ky-sit-out")).toHaveLength(3);
    const tag = drawKyogijo({ sport: "nfl", ...game, size: "badge", situation: { ballOn: 88, toGo: 7, down: 3 } });
    expect(tag).toContain("3rd &amp; 7");
    expect(tag).toContain("OPP 12");
    expect(parseXml(tag).attrs.viewBox).toBe("0 0 440 64");
    const compact = drawKyogijo({ sport: "nfl", ...game, size: "compact", situation: { ballOn: 88, toGo: 7, down: 3 } });
    expect(classes(compact, "ky-badge-situation")).toHaveLength(1);
    expect(classes(compact, "ky-sit-los")).toHaveLength(1);
  });

  it("draws the usual badge when the situation says nothing", () => {
    expect(drawKyogijo({ sport: "nhl", ...game, size: "badge", situation: { awaySkaters: 5, homeSkaters: 5 } })).toBe(drawKyogijo({ sport: "nhl", ...game, size: "badge" }));
  });

  it("fits what it holds in the middle of the strip, in Japanese as in English", () => {
    for (const language of ["en", "ja"] as const) {
      const svg = drawKyogijo({ sport: "nfl", ...game, language, size: "badge", situation: { ballOn: 88, toGo: 17, down: 3 } });
      const widget = walk(parseXml(svg)).find((n) => (n.attrs.class ?? "") === "ky-sit-tag");
      expect(widget, language).toBeDefined();
    }
  });
});

describe("the words", () => {
  it("are in the description and the title stays the score", () => {
    const o: ScoreOptions = { sport: "nhl", ...game, status: "live", situation: { awaySkaters: 5, homeSkaters: 4, clock: "1:42", emptyNet: "away" } };
    const { title, description } = describeOf(o);
    expect(title).toBe("Northern Owls 3, Lakeshore Anchors 2, Live");
    expect(description).toContain("Power play: Northern Owls have 5 skaters against 4.");
    expect(description).toContain("1:42 left on the penalty.");
    expect(description).toContain("Northern Owls have pulled the goalkeeper");
    expect(describeOf({ ...o, language: "ja" }).description).toContain("パワープレー：Northern Owlsが5人、相手は4人です。");
    expect(describeOf({ sport: "nhl", situation: { delayedPenalty: "home" } }).description).toContain("A penalty to the home team is delayed.");
    expect(describeOf({ sport: "nfl", situation: { possession: "home", ballOn: 88, down: 3, toGo: 7, drive: [{ from: 25, to: 40, result: "field-goal" }] } }).description).toContain("Drive by the home team, from own 25 to own 40: field goal.");
    expect(describeOf({ sport: "nhl", situation: { shootout: { rounds: [[true, false], [true, true], [false, true], [true, false]] } } }).description).toContain("Shootout after 4 rounds: the visitors 3, the home team 2. The rounds after the third are sudden death.");
  });

  it("calls the shootout by the league's word: SO in the NHL, GWS (the game winning shots) under the IIHF and at the Olympics", () => {
    const rounds: [boolean, boolean][] = [[true, false], [true, true], [false, true]];
    const text = (league: string | undefined, language: "en" | "ja"): string | undefined => situationText({ sport: "nhl", league, language, situation: { shootout: { rounds } } });
    expect(text(undefined, "en")).toBe("SO 2–2");
    expect(text("ahl", "en")).toBe("SO 2–2");
    expect(text("iihf", "en")).toBe("GWS 2–2");
    expect(text("olympic", "ja")).toBe("GWS 2–2");
    const said = (league: string | undefined, language: "en" | "ja"): string => describeOf({ sport: "nhl", league, language, situation: { shootout: { rounds } } }).description;
    expect(said(undefined, "ja")).toContain("シュートアウト（3ラウンド終了時点）：アウェイチーム");
    expect(said("iihf", "ja")).toContain("ゲームウイニングショット（3ラウンド終了時点）：アウェイチーム 2、ホームチーム 2。");
    expect(said("olympic", "en")).toContain("Game winning shots after 3 rounds: the visitors 2, the home team 2.");
  });

  it("have the same keys in English and in Japanese", () => {
    const keys = (value: unknown, prefix = ""): string[] => (typeof value === "object" && value !== null ? Object.entries(value).flatMap(([k, v]) => keys(v, `${prefix}${k}.`)) : [prefix]);
    expect(keys(KYOGIJO_STRINGS.ja.situation)).toEqual(keys(KYOGIJO_STRINGS.en.situation));
  });
});

describe("what comes from outside", () => {
  it("is made safe: a clock, a drive's result and a team's name are never markup", () => {
    const hostile = '"><script>alert(1)</script>';
    const svg = drawKyogijo({
      sport: "nhl",
      away: { ...away, name: hostile, abbr: hostile },
      home,
      situation: { awaySkaters: 5, homeSkaters: 4, clock: hostile, shootout: undefined, emptyNet: hostile as never, delayedPenalty: hostile as never },
    });
    expect(svg).not.toContain("<script");
    const football = drawKyogijo({ sport: "nfl", ...game, situation: { ballOn: 50, down: hostile as never, toGo: hostile as never, possession: hostile as never, drive: [{ from: 1, to: 9, result: hostile as never, team: hostile as never }] } });
    expect(football).not.toContain("<script");
    expect(drawKyogijo({ sport: "mlb", ...game, situation: { inning: hostile as never, half: hostile as never, bases: hostile as never } })).toBe(drawKyogijo({ sport: "mlb", ...game }));
  });

  it("is in the stylesheet only when there is a situation", () => {
    expect(drawKyogijo({ sport: "nhl", ...game })).not.toContain("ky-sit-");
    expect(drawKyogijo({ sport: "nhl", ...game, situation: { awaySkaters: 5, homeSkaters: 4 } })).toContain(".ky-sit-zone");
  });
});
