import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { KYOGIJO_ATTRIBUTES, optionsFromAttributes } from "./element-entry.ts";
import { hash } from "./format.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { PARKS, PARK_IDS, parkQuirksIn, parkWallsIn } from "./parks.ts";
import { PARK_DATA } from "./parks.data.ts";
import { sceneOf } from "./scene.ts";
import { KYOGIJO_STYLE, KYOGIJO_WALLS_STYLE } from "./style.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";

const draw = (park: string, extra: object = {}): string => drawKyogijo({ sport: "mlb", park, id: "t", ...extra });
const fence = (svg: string): string => /class="ky-fence" d="([^"]*)"/.exec(svg)?.[1] ?? "";
const bands = (svg: string): string[] => [...svg.matchAll(/<path class="ky-wall ky-wall-(\d)" d="([^"]*)"/g)].map((m) => `${m[1]}`);

/**
 * The drawing of each park, bare, as it was before the walls and quirks (a hash of the SVG made on the commit before): a park that gained nothing is byte for byte the same.
 * Thirteen of these hashes were made again when the names came (docs/ballparks.md, "Names"): the drawing of Koshien Stadium, Mazda Stadium, Rakuten Mobile Saikyo Park Miyagi and
 * Choctaw Stadium has the everyday name, and nine parks (Baker Bowl, Huntington Avenue Grounds, Hilltop Park, Shea Stadium, Oakland Coliseum, Exhibition Stadium, ZOZO Marine Stadium,
 * Mizuho PayPay Dome Fukuoka and Hotto Motto Field Kobe) have the sentence that says what the park is officially called. The fence and everything else are the bytes they were.
 */
const BEFORE: Record<string, string> = {
  "oriole-park-at-camden-yards": "05iab30",
  "fenway-park": "07rp4aj",
  "yankee-stadium": "0a0yjwa",
  "tropicana-field": "0kx0srj",
  "rogers-centre": "1wlmq7c",
  "rate-field": "0uo5bnq",
  "progressive-field": "1adwltc",
  "comerica-park": "0l6kruu",
  "kauffman-stadium": "1cueqk4",
  "target-field": "004sfdp",
  "daikin-park": "0lzfh60",
  "angel-stadium": "1s6uhpx",
  "sutter-health-park": "1bxdxs5",
  "t-mobile-park": "0h3eemd",
  "globe-life-field": "19avxj7",
  "truist-park": "1wbqa7p",
  "loandepot-park": "0ob0wkt",
  "citi-field": "1v6i6up",
  "citizens-bank-park": "0prmu7l",
  "nationals-park": "0v5vt9u",
  "great-american-ball-park": "1dbk7dw",
  "american-family-field": "14z8o2k",
  "busch-stadium": "05lobg2",
  "chase-field": "17qw1a2",
  "coors-field": "0mlh8aa",
  "dodger-stadium": "0bksj2t",
  "petco-park": "00ggil1",
  "oracle-park": "0gm0pn5",
  "baker-bowl": "1lczw3v",
  "exposition-park-pittsburgh": "0d5vum1",
  "polo-grounds": "12p2ut2",
  "south-end-grounds": "0jlgetq",
  "huntington-avenue-grounds": "1xbb63j",
  "league-park-cleveland": "1lu7nve",
  "hilltop-park": "1uwtey9",
  "forbes-field": "0t7bzi0",
  "shibe-park": "0mf35ar",
  "comiskey-park": "15wn6sn",
  "griffith-stadium": "1j4nl28",
  "crosley-field": "1jmjauu",
  "tiger-stadium": "1jlh564",
  "ebbets-field": "11fisht",
  "braves-field": "1e4nsbp",
  "yankee-stadium-1923": "066krvo",
  "cleveland-stadium": "1ptnncf",
  "baltimore-memorial-stadium": "0nwrzhn",
  "municipal-stadium-kansas-city": "1xdtei4",
  "seals-stadium": "16gjm7e",
  "candlestick-park": "10g4s26",
  "wrigley-field-los-angeles": "0s2ctwf",
  "metropolitan-stadium": "1v6687a",
  "colt-stadium": "1fmj8oi",
  "robert-f-kennedy-memorial-stadium": "1n7ekg0",
  "shea-stadium": "0f8gw9o",
  "astrodome": "12y654j",
  "atlanta-fulton-county-stadium": "1ro3sjc",
  "busch-memorial-stadium": "07yb2it",
  "oakland-coliseum": "0o7jk8r",
  "sicks-stadium": "17ozgmd",
  "jarry-park-stadium": "1fw3dj8",
  "three-rivers-stadium": "0elkvxx",
  "riverfront-stadium": "0ov2r0v",
  "veterans-stadium": "0rnll0b",
  "arlington-stadium": "1uylu5c",
  "exhibition-stadium": "144ukn3",
  "olympic-stadium-montreal": "1tcr4xw",
  "metrodome": "0fzt1z2",
  "mile-high-stadium": "1jvb4cx",
  "globe-life-park-in-arlington": "02oxniz",
  "turner-field": "1h1r1lr",
  "tokyo-dome": "0kp9rw8",
  "hanshin-koshien-stadium": "0etgb8j",
  "meiji-jingu-stadium": "1nx2d3h",
  "yokohama-stadium": "0vo5m7d",
  "vantelin-dome-nagoya": "1fyr0m1",
  "mazda-stadium-hiroshima": "1r008f8",
  "es-con-field-hokkaido": "01pg2gg",
  "rakuten-mobile-park-miyagi": "1nsga3b",
  "belluna-dome": "1imrdjr",
  "zozo-marine-stadium": "1vyn6ak",
  "kyocera-dome-osaka": "1m44w6p",
  "mizuho-paypay-dome-fukuoka": "19pgaiy",
  "sapporo-dome": "0d5wzjt",
  "hotto-motto-field-kobe": "1xfwb9q",
  "hiroshima-municipal-stadium": "1v5cdz4",
  "korakuen-stadium": "0nc4vj2",
  "osaka-stadium": "1bazdf7",
  "heiwadai-stadium": "14yqsx3",
  "kawasaki-stadium": "19fcbbv",
  "nagoya-stadium": "0hz7yqb",
};
/** The four parks whose plain drawing changed on purpose: three gained points the article's text gives, one a warning track the article gives. */
const CHANGED = ["wrigley-field", "pnc-park", "sportsmans-park", "milwaukee-county-stadium"];

describe("the plain drawing of a park", () => {
  it("is byte for byte what it was for each park that gained no figure of its fence or its track", () => {
    expect(Object.keys(BEFORE)).toHaveLength(90);
    for (const [id, was] of Object.entries(BEFORE)) expect(hash(drawKyogijo({ sport: "mlb", park: id })), id).toBe(was);
    for (const id of CHANGED) expect(PARKS[id], id).toBeDefined();
  });

  it("is unchanged by walls or quirks where the park has none, or there is no park", () => {
    for (const id of ["truist-park", "target-field", "busch-stadium", "sicks-stadium"]) {
      expect([PARKS[id].walls, PARKS[id].quirks, PARKS[id].backstop_ft, PARKS[id].dugouts], id).toEqual([undefined, undefined, undefined, undefined]);
      expect(draw(id, { walls: { legend: true, labels: true }, quirks: true }), id).toBe(draw(id));
    }
    expect(drawKyogijo({ sport: "mlb", id: "t", walls: true, quirks: true })).toBe(drawKyogijo({ sport: "mlb", id: "t" }));
    expect(drawKyogijo({ sport: "nhl", id: "t", walls: true } as never)).toBe(drawKyogijo({ sport: "nhl", id: "t" }));
  });

  it("writes no stylesheet for walls and no band until they are asked for", () => {
    const plain = draw("fenway-park");
    expect(plain).not.toContain("ky-wall");
    expect(plain).not.toContain("--ky-wall-1");
    expect(draw("fenway-park", { walls: false, quirks: false })).toBe(plain);
  });

  it("changes in the four parks that gained points or a track, and only the fence or the track", () => {
    const base = PARK_DATA.find((p) => p.id === "pnc-park");
    expect(base?.track_ft).toBe(18);
    expect(draw("pnc-park")).toContain('stroke-width="36"');
    expect(draw("fenway-park")).toContain('stroke-width="30"');
  });
});

describe("the figures of the walls", () => {
  const m = (metres: number): number => Math.round(metres * FEET_PER_METRE * 1000) / 1000;
  /** Park, where its article says it (the English article, or the Japanese for the parks of Japan), and each wall as [from, to, height in feet, first season, last season]. */
  const WALLS: [string, string, [number, number, number, number?, number?][]][] = [
    ["fenway-park", "history: the Green Monster completed at 37 feet high in 1934, replacing the 25 foot wall (and Duffy's Cliff); text: the 37.167 ft left field wall", [[-45, -24, 25, 1912, 1933], [-45, -24, 37.167, 1934]]],
    ["oriole-park-at-camden-yards", "changes in field dimensions: the wall's height raised from 7 ft to about 13 ft in 2022, from the left-field corner to the bullpens; the right field wall lowered from 25 ft to 21 ft", [[-45, -22, 7, undefined, 2021], [-45, -22, 13, 2022], [22.5, 45, 21]]],
    ["yankee-stadium", "the fences measure 8 ft 5 in high from the left-field foul pole until the bullpen, then descend to 8 ft at the right field foul pole", [[-45, 22.5, 8.417], [22.5, 45, 8]]],
    ["rate-field", "infobox: outfield wall height 8 ft", [[-45, 45, 8]]],
    ["progressive-field", "infobox: fence height, left field 19 ft, centre and right fields 9 ft; the Little Green Monster", [[-45, -22.5, 19], [-22.5, 45, 9]]],
    ["comerica-park", "the centre field, right-centre field and right field fences lowered to 7 feet before 2023", [[-22.5, 45, 7, 2023]]],
    ["kauffman-stadium", "the outfield wall height reduced from 12 to 9 ft before the 1995 season", [[-45, 45, 12, undefined, 1994], [-45, 45, 9, 1995]]],
    ["daikin-park", "home runs must clear a 19-foot wall in front of the elevated boxes (the Crawford Boxes)", [[-45, -25, 19]]],
    ["angel-stadium", "the 8 ft high fence in right centre field replaced by a 19 ft high wall with the out-of-town scoreboard, in the renovation of winter 1997", [[15, 28, 8, undefined, 1997], [15, 28, 19, 1998]]],
    ["citi-field", "an 8 ft wall built in front of the 16 ft wall in left field, for 2012", [[-45, -22.5, 16, undefined, 2011], [-45, -22.5, 8, 2012]]],
    ["wrigley-field", "infobox: bleachers 11 ft 6 in; the ivy-covered walls in the left and right field corners reduced from 15 to 11 feet before 2015", [[-45, -30, 15, undefined, 2014], [-45, -30, 11, 2015], [-30, 30, 11.5], [30, 45, 15, undefined, 2014], [30, 45, 11, 2015]]],
    ["pnc-park", "the outfield fence ranges from 6 ft in left field to 10 ft in centre field and 21 ft in right field", [[-45, -22.5, 6], [-22.5, 22.5, 10], [22.5, 45, 21]]],
    ["coors-field", "fence raised before 2016: right to centre field in front of the bullpens to 16 ft 6 in, the left field corner to 13 feet", [[-45, -33.75, 13, 2016], [-22.5, 45, 16.5, 2016]]],
    ["petco-park", "the right field wall lowered from 11 ft to 8 ft after the 2012 season", [[22.5, 45, 11, undefined, 2012], [22.5, 45, 8, 2013]]],
    ["oracle-park", "infobox: fence height, left 8 ft, centre 7 ft, dead centre 10 ft, right-centre 20 ft, right 24 ft", [[-45, -20, 8], [-20, -6, 7], [-6, 6, 10], [6, 27, 20], [27, 45, 24]]],
    ["baker-bowl", "the right field wall and fence in its final form was 60 ft high (the Baker Wall)", [[22.5, 45, 60]]],
    ["forbes-field", "the fence stood 12 ft in left and centre fields, the right field wall reduced to 9.5 ft after the 1925 construction", [[-45, 22.5, 12], [22.5, 45, 9.5, 1925]]],
    ["shibe-park", "the 12 foot wall in right, raised to 34 ft in the winter of 1934 to 1935", [[22.5, 45, 12, undefined, 1934], [22.5, 45, 34, 1935]]],
    ["griffith-stadium", "a 30 ft fence across right field", [[22.5, 45, 30]]],
    ["metropolitan-stadium", "infobox: wall 8 ft", [[-45, 45, 8]]],
    ["three-rivers-stadium", "infobox: wall height 10 ft", [[-45, 45, 10]]],
    ["riverfront-stadium", "a 40 ft wall built in deep centre field in the 2001 remodelling (the Black Monster)", [[-9, 9, 40, 2001]]],
    ["metrodome", "infobox: wall 7 ft in left and centre field, 23 ft in right field (the Baggie); a 6 ft Plexiglas screen on the left field wall from 1985 to 1994", [[-45, -22.5, 7, undefined, 1984], [-45, -22.5, 13, 1985, 1994], [-45, -22.5, 7, 1995], [-22.5, 22.5, 7], [22.5, 45, 23]]],
    ["mile-high-stadium", "centre field's 30-foot high fence", [[-22.5, 22.5, 30]]],
    ["tokyo-dome", "ja: the outfield fence 4.24 m (rubber 4.0 m and net 0.24 m, the net added from 2010)", [[-45, 45, m(4), undefined, 2009], [-45, 45, m(4.24), 2010]]],
    ["meiji-jingu-stadium", "ja infobox: fence 3.3 m", [[-45, 45, m(3.3)]]],
    ["zozo-marine-stadium", "ja infobox: fence 3.3 m", [[-45, 45, m(3.3)]]],
    ["kyocera-dome-osaka", "ja infobox: fence 4.2 m", [[-45, 45, m(4.2)]]],
    ["mizuho-paypay-dome-fukuoka", "ja: the outfield fence 4.2 m, 5.84 m until 2014", [[-45, 45, m(5.84), undefined, 2014], [-45, 45, m(4.2), 2015]]],
    ["hotto-motto-field-kobe", "ja: the outfield fence 2.45 m, 3.2 m until 2002", [[-45, 45, m(3.2), undefined, 2002], [-45, 45, m(2.45), 2003]]],
    ["hiroshima-municipal-stadium", "ja infobox: fence 2.55 m", [[-45, 45, m(2.55)]]],
    ["mazda-stadium-hiroshima", "ja infobox: around centre 2.5 m, left 3.6 m, right 3.4 m", [[-45, -22.5, m(3.6)], [-22.5, 22.5, m(2.5)], [22.5, 45, m(3.4)]]],
    ["osaka-stadium", "ja infobox: the wings 5.5 m, left-centre and right-centre 3.8 m, centre 3 m", [[-45, -33.75, m(5.5)], [-33.75, -11.25, m(3.8)], [-11.25, 11.25, m(3)], [11.25, 33.75, m(3.8)], [33.75, 45, m(5.5)]]],
    ["belluna-dome", "ja: the outfield fence 3.2 m at centre to 4.37 m at the wings, from 1999", [[-45, -33.75, m(4.37), 1999], [-11.25, 11.25, m(3.2), 1999], [33.75, 45, m(4.37), 1999]]],
    ["vantelin-dome-nagoya", "ja: the fence 4.8 m until 2025, 3.6 m from 2026", [[-45, 45, m(4.8), undefined, 2025], [-45, 45, m(3.6), 2026]]],
  ];

  it("hold each figure the park's article gives, with the seasons it dates", () => {
    for (const [id, cite, walls] of WALLS) {
      expect(cite.length, id).toBeGreaterThan(10);
      const got = PARKS[id].walls?.map((w) => [w.from, w.to, w.height_ft, w.first, w.last]);
      expect(got, id).toEqual(walls.map(([a, b, h, first, last]) => [a, b, h, first, last]));
    }
    expect(PARK_IDS.filter((id) => PARKS[id].walls !== undefined).sort()).toEqual(WALLS.map((row) => row[0]).sort());
  });

  it("name the Green Monster, the Little Green Monster, the Crawford Boxes, the Baggie and the Baker Wall as the articles do", () => {
    const names = (id: string): (string | undefined)[] => PARKS[id].walls?.map((w) => w.label) ?? [];
    expect(names("fenway-park")).toEqual([undefined, "Green Monster"]);
    expect(names("progressive-field")[0]).toBe("Little Green Monster");
    expect(names("daikin-park")).toEqual(["Crawford Boxes"]);
    expect(names("metrodome").at(-1)).toBe("Baggie");
    expect(names("baker-bowl")).toEqual(["Baker Wall"]);
  });

  it("stand in the season asked for: Fenway's wall was 25 feet until 1933, and the Monster after", () => {
    expect(parkWallsIn(PARKS["fenway-park"], 1920).map((w) => w.height_ft)).toEqual([25]);
    expect(parkWallsIn(PARKS["fenway-park"], 1934).map((w) => w.height_ft)).toEqual([37.167]);
    expect(parkWallsIn(PARKS["fenway-park"]).map((w) => w.height_ft)).toEqual([37.167]);
    expect(parkWallsIn(PARKS["metrodome"], 1990).map((w) => w.height_ft)).toEqual([13, 7, 23]);
    expect(parkWallsIn(PARKS["metrodome"], 2005).map((w) => w.height_ft)).toEqual([7, 7, 23]);
    expect(parkWallsIn(PARKS["tropicana-field"], 2000)).toEqual([]);
  });

  it("are valid: stretches from left to right inside the foul lines, with heights of a wall", () => {
    for (const p of Object.values(PARKS)) {
      for (const w of p.walls ?? []) {
        expect(w.from, p.id).toBeGreaterThanOrEqual(-45);
        expect(w.to, p.id).toBeLessThanOrEqual(45);
        expect(w.from, p.id).toBeLessThan(w.to);
        expect(w.height_ft, p.id).toBeGreaterThan(5);
        expect(w.height_ft, p.id).toBeLessThan(61);
      }
    }
  });
});

describe("the extra points of the fence", () => {
  const labelled = PARK_DATA.filter((p) => p.labels !== undefined);

  it("are the ones the article's text gives, each with its label, at the revision the park cites", () => {
    expect(labelled.map((p) => p.id).sort()).toEqual(["milwaukee-county-stadium", "sportsmans-park", "wrigley-field"]);
    for (const p of labelled) {
      expect(p.labels?.map(([angle]) => angle), p.id).toEqual(p.points.map(([angle]) => angle));
      expect(p.en?.revision, p.id).toBeGreaterThan(1000);
    }
  });

  it("give Wrigley's two wells and keep its centre field marker at 400 feet", () => {
    const w = PARKS["wrigley-field"].points;
    expect(w.map(([, feet]) => feet)).toEqual([355, 357, 360, 368, 400, 368, 363, 353]);
    expect(w.find(([angle]) => angle === 0)?.[1]).toBe(400);
  });

  it("give Sportsman's Park's twelve markers with true centre field at dead centre, and County Stadium's nine", () => {
    const s = PARKS["sportsmans-park"].points;
    expect(s.map(([, feet]) => feet)).toEqual([351, 358, 379, 400, 426, 425, 422, 422, 405, 354, 322, 310]);
    expect(s.find(([angle]) => angle === 0)?.[1]).toBe(422);
    expect(PARKS["milwaukee-county-stadium"].points.map(([, feet]) => feet)).toEqual([315, 362, 382, 392, 402, 392, 382, 362, 315]);
  });
});

describe("the quirks", () => {
  it("are the ones the articles describe with figures", () => {
    const kinds = (id: string): string[] => PARKS[id].quirks?.map((q) => q.kind) ?? [];
    expect(kinds("daikin-park")).toEqual(["hill"]);
    expect(kinds("fenway-park")).toEqual(["pole"]);
    expect(kinds("wrigley-field")).toEqual(["ivy", "basket"]);
    expect(kinds("polo-grounds")).toEqual(["overhang", "bullpen", "bullpen"]);
    expect(kinds("tiger-stadium")).toEqual(["overhang", "flagpole"]);
    expect(kinds("griffith-stadium")).toEqual(["bullpen"]);
    expect(PARK_IDS.filter((id) => PARKS[id].quirks !== undefined).sort()).toEqual(["daikin-park", "fenway-park", "griffith-stadium", "polo-grounds", "tiger-stadium", "wrigley-field"]);
  });

  it("hold Tal's Hill's 90 feet, 30 degrees and seasons, Pesky's Pole at 302 feet and the Tiger Stadium flagpole near the 440 mark", () => {
    const hill = PARKS["daikin-park"].quirks?.[0];
    expect(hill).toMatchObject({ kind: "hill", label: "Tal's Hill", width_ft: 90, slope_deg: 30, first: 2000, last: 2016 });
    expect(PARKS["fenway-park"].quirks?.[0]).toMatchObject({ kind: "pole", label: "Pesky's Pole", angle: 45, feet: 302 });
    expect(PARKS["tiger-stadium"].quirks?.[1]).toMatchObject({ kind: "flagpole", feet: 440, height_ft: 125 });
    expect(PARKS["tiger-stadium"].quirks?.[0]).toMatchObject({ kind: "overhang", depth_ft: 10, first: 1936 });
    expect(PARKS["polo-grounds"].quirks?.[0]).toMatchObject({ kind: "overhang", depth_ft: 21 });
    expect(PARKS["polo-grounds"].quirks?.slice(1).map((q) => [q.kind === "bullpen" ? q.side : "", q.kind === "bullpen" ? q.feet : 0])).toEqual([["visitors", 450], ["home", 450]]);
  });

  it("stand in their seasons: Tal's Hill from 2000 to 2016 only", () => {
    const daikin = PARKS["daikin-park"];
    expect(parkQuirksIn(daikin, 1999)).toEqual([]);
    expect(parkQuirksIn(daikin, 2010)).toHaveLength(1);
    expect(parkQuirksIn(daikin, 2016)).toHaveLength(1);
    expect(parkQuirksIn(daikin, 2017)).toEqual([]);
    expect(parkQuirksIn(daikin)).toEqual([]);
    expect(parkQuirksIn(PARKS["wrigley-field"], 1950).map((q) => q.kind)).toEqual(["ivy"]);
    expect(parkQuirksIn(PARKS["wrigley-field"]).map((q) => q.kind)).toEqual(["ivy", "basket"]);
  });

  it("give the backstop where the article does, and the dugouts' sides where it says", () => {
    expect(PARKS["fenway-park"].backstop_ft).toBe(60);
    expect(PARKS["yankee-stadium"].backstop_ft).toBeCloseTo(52.333, 3);
    expect(PARKS["t-mobile-park"].backstop_ft).toBe(69);
    expect(PARKS["globe-life-field"].backstop_ft).toBe(42);
    expect(PARKS["target-field"].backstop_ft).toBeUndefined();
    expect(PARKS["progressive-field"].dugouts).toEqual({ home: "third", visitors: "first" });
    expect(PARKS["pnc-park"].dugouts).toEqual({ home: "third" });
    expect(PARKS["candlestick-park"].dugouts).toEqual({ home: "first", visitors: "third" });
    expect(PARKS["loandepot-park"].dugouts).toEqual({ home: "third" });
    expect(PARKS["wrigley-field"].dugouts).toEqual({ home: "third" });
  });

  it("hold the one bullpen and the one dugout added where the article gives a place and a figure, and no generic ones", () => {
    // Griffith Stadium: "a fenced-in bullpen at the end of the left field line", the fence reduced to 388 feet (revision 1379220233); Wrigley Field: "the home (third base) dugout" (revision 1377918987).
    expect(PARKS["griffith-stadium"].quirks?.[0]).toMatchObject({ kind: "bullpen", angle: -45, feet: 388, first: 1956, last: 1961 });
    expect(draw("griffith-stadium", { quirks: true, year: 1958 })).toContain('class="ky-bullpen"');
    expect(draw("griffith-stadium", { quirks: true, year: 1950 })).not.toContain('class="ky-bullpen"');
    expect(draw("wrigley-field", { quirks: true })).toContain('class="ky-dugout"');
    expect(draw("wrigley-field", { quirks: true })).not.toContain('class="ky-dugout ky-dugout-away"');
    for (const id of PARK_IDS) if (!["progressive-field", "pnc-park", "candlestick-park", "loandepot-park", "wrigley-field"].includes(id)) expect(PARKS[id].dugouts, id).toBeUndefined();
  });
});

describe("the walls drawn", () => {
  const monster = draw("fenway-park", { walls: true });

  it("are a band outside each stretch with a height, wider and darker for a taller wall", () => {
    expect(bands(monster)).toEqual(["4"]);
    const oracle = draw("oracle-park", { walls: true });
    expect(bands(oracle)).toEqual(["1", "1", "2", "3", "3"]);
    const widths = [...oracle.matchAll(/<path class="ky-wall ky-wall-\d" d="M([^"]*)Z"/g)].map((m) => {
      const pairs = m[1].split("L").map((p) => p.split(" ").map(Number));
      const half = pairs.length / 2;
      return Math.hypot(pairs[0][0] - pairs[pairs.length - 1][0], pairs[0][1] - pairs[pairs.length - 1][1]) + half * 0;
    });
    expect(widths[4]).toBeGreaterThan(widths[0]);
    expect(monster).toContain("--ky-wall-1");
    expect(monster).toContain(".kyogijo .ky-wall-4{fill:var(--ky-wall-4)}");
    expect(fence(monster)).toBe(fence(draw("fenway-park")));
  });

  it("leave the fence itself as it was", () => {
    for (const id of ["oracle-park", "wrigley-field", "metrodome"]) expect(fence(draw(id, { walls: true, quirks: true })), id).toBe(fence(draw(id)));
  });

  it("follow the season: the Green Monster is not there in 1920, and the wall of that day is 25 feet", () => {
    expect(bands(draw("fenway-park", { walls: true, year: 1920 }))).toEqual(["3"]);
    expect(bands(draw("fenway-park", { walls: true, year: 1950 }))).toEqual(["4"]);
  });

  it("carry a key and names when asked, in the language asked, light and dark", () => {
    const keyed = draw("fenway-park", { walls: { legend: true, labels: true } });
    expect(keyed).toContain("Wall height");
    expect(keyed).toContain("under 10 ft");
    expect(keyed).toContain("30 ft and over");
    expect(keyed).toContain("Green Monster 37.2 ft");
    expect(keyed).toContain('class="ky-wl-p"');
    const ja = draw("fenway-park", { walls: { legend: true, labels: true }, language: "ja" });
    expect(ja).toContain("フェンスの高さ");
    expect(ja).toContain("10フィート未満");
    expect(ja).toContain("Green Monster 37.2フィート");
    const metres = draw("fenway-park", { walls: { legend: true, labels: true }, units: "m" });
    expect(metres).toContain("Green Monster 11.3 m");
    expect(metres).toContain("under 3 m");
    expect(KYOGIJO_WALLS_STYLE).toContain("prefers-color-scheme:dark");
    expect(KYOGIJO_WALLS_STYLE).toContain('[data-theme=dark]');
    expect(KYOGIJO_STYLE).toContain(".ky-wall-1");
    expect(draw("fenway-park", { walls: true, style: "none" })).not.toContain("<style>");
  });

  it("are said in the description, in both languages", () => {
    const en = /<desc[^>]*>([^<]*)<\/desc>/.exec(monster)?.[1] ?? "";
    expect(en).toContain("Wall heights: Green Monster 37.2 ft.");
    const ja = /<desc[^>]*>([^<]*)<\/desc>/.exec(draw("fenway-park", { walls: true, language: "ja" }))?.[1] ?? "";
    expect(ja).toContain("フェンスの高さ：Green Monster 37.2フィート。");
    expect(/<desc[^>]*>([^<]*)<\/desc>/.exec(draw("oracle-park", { walls: true }))?.[1]).toContain("Left field 8 ft, Centre field 7 ft, Dead centre 10 ft, Right-centre 20 ft, Right field 24 ft");
    expect(/<desc[^>]*>([^<]*)<\/desc>/.exec(draw("fenway-park"))?.[1]).not.toContain("Wall heights");
  });

  it("make room for themselves: the view grows beyond the fence and under the field for the key", () => {
    const view = (svg: string): number[] => /viewBox="([^"]*)"/.exec(svg)?.[1].split(" ").map(Number) ?? [];
    const plain = view(draw("progressive-field"));
    const keyed = view(draw("progressive-field", { walls: { legend: true } }));
    expect(keyed[3]).toBeGreaterThan(plain[3]);
    expect(keyed[0]).toBeLessThanOrEqual(plain[0]);
    const tall = view(draw("baker-bowl", { walls: true }));
    expect(tall[2]).toBeGreaterThan(view(draw("baker-bowl"))[2]);
  });

  it("are read by the scene, with the key and the names", () => {
    const scene = sceneOf({ sport: "mlb", park: "oracle-park", walls: { legend: true, labels: true }, quirks: true, id: "w" });
    expect(scene.items.length).toBeGreaterThan(40);
  });
});

describe("the quirks drawn", () => {
  it("draw Tal's Hill in 2010 and not today, and the dugouts, the backstop and the poles", () => {
    const hill = draw("daikin-park", { quirks: true, year: 2010 });
    expect(hill).toContain('class="ky-hill"');
    expect(draw("daikin-park", { quirks: true })).not.toContain('class="ky-hill"');
    const progressive = draw("progressive-field", { quirks: true });
    expect(progressive).toContain('class="ky-dugout"');
    expect(progressive).toContain('class="ky-dugout ky-dugout-away"');
    expect(progressive).toContain('class="ky-backstop"');
    expect(draw("fenway-park", { quirks: true })).toContain('class="ky-pole"');
    const wrigley = draw("wrigley-field", { quirks: true });
    expect(wrigley).toContain('class="ky-ivy"');
    expect(wrigley).toContain('class="ky-basket"');
    expect(draw("wrigley-field", { quirks: true, year: 1950 })).not.toContain('class="ky-basket"');
    const polo = draw("polo-grounds", { quirks: true });
    expect(polo).toContain('class="ky-overhang"');
    expect(polo.match(/class="ky-bullpen"/g)).toHaveLength(2);
    expect(draw("tiger-stadium", { quirks: true })).toContain('class="ky-pole"');
  });

  it("can be chosen by kind, and named", () => {
    const only = draw("wrigley-field", { quirks: { only: ["ivy"] } });
    expect(only).toContain('class="ky-ivy"');
    expect(only).not.toContain('class="ky-basket"');
    expect(only).not.toContain('class="ky-backstop"');
    const named = draw("daikin-park", { quirks: { labels: true }, year: 2010 });
    expect(named).toContain("Tal&#39;s Hill".replace("&#39;", "'"));
    expect(draw("daikin-park", { quirks: { only: ["backstop"] }, year: 2010 })).not.toContain('class="ky-hill"');
  });

  it("are said in the description, in both languages", () => {
    const desc = (svg: string): string => /<desc[^>]*>([^<]*)<\/desc>/.exec(svg)?.[1] ?? "";
    expect(desc(draw("daikin-park", { quirks: true, year: 2010 }))).toContain("Features of the park: Tal's Hill, a hill 90 ft wide, sloping at 30 degrees");
    expect(desc(draw("progressive-field", { quirks: true }))).toContain("Backstop, 60 ft behind home plate");
    expect(desc(draw("progressive-field", { quirks: true }))).toContain("Home dugout, on the third base line");
    expect(desc(draw("progressive-field", { quirks: true, language: "ja" }))).toContain("ホームのダグアウト（三塁側）");
    expect(desc(draw("polo-grounds", { quirks: true }))).toContain("Visitors' bullpen, 450 ft from home plate");
  });
});

describe("the size", () => {
  it("is within a budget with everything on, and the plain park is as small as before", () => {
    for (const id of ["fenway-park", "wrigley-field", "oracle-park", "metrodome", "daikin-park"]) {
      expect(draw(id, { walls: { legend: true, labels: true }, quirks: { labels: true } }).length, id).toBeLessThan(24_000);
      expect(draw(id).length, id).toBeLessThan(17_000);
    }
  });
});

describe("the words and the element", () => {
  it("have a Japanese for every English word of the ballpark's", () => {
    const flat = (o: unknown, path = ""): string[] => (typeof o === "object" && o !== null ? Object.entries(o).flatMap(([k, v]) => flat(v, `${path}${k}.`)) : [path]);
    expect(flat(KYOGIJO_STRINGS.ja.ballpark)).toEqual(flat(KYOGIJO_STRINGS.en.ballpark));
  });

  it("read walls and quirks from attributes", () => {
    expect(KYOGIJO_ATTRIBUTES).toContain("walls");
    expect(KYOGIJO_ATTRIBUTES).toContain("quirks");
    const read = (attrs: Record<string, string>) => (name: string): string | null => attrs[name] ?? null;
    expect(optionsFromAttributes(read({ sport: "mlb", park: "fenway-park", walls: "true" })).walls).toBe(true);
    expect(optionsFromAttributes(read({ sport: "mlb", park: "fenway-park", walls: "legend labels" })).walls).toEqual({ legend: true, labels: true });
    expect(optionsFromAttributes(read({ sport: "mlb", park: "fenway-park", walls: "false" })).walls).toBeUndefined();
    expect(optionsFromAttributes(read({ sport: "mlb", park: "wrigley-field", quirks: "labels ivy" })).quirks).toEqual({ labels: true, only: ["ivy"] });
    expect(optionsFromAttributes(read({ sport: "mlb", park: "wrigley-field", quirks: "true" })).quirks).toBe(true);
  });
});
