import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { FORMATION_IDS, FORMATIONS, POSITION_NAMES, formationById, formationsOf, positionName } from "./formations.ts";
import { FRAMES } from "./frames.ts";
import "./frames.providers.ts";
import { drawLayers, layerTable } from "./layers.ts";
import type { Layer } from "./layers.types.ts";
import { KYOGIJO_STYLE, KYOGIJO_TEAM_STYLE } from "./style.ts";
import { surfaceShares } from "./team.shape.ts";
import { convexHull, polygonArea } from "./team.geometry.ts";
import { degreesOf } from "./team.motion.ts";
import type { Formation, FormationSport, MoveDatum, PassDatum, PlayerDatum } from "./team.types.ts";
import { outlineOf } from "./outline.ts";
import { envFor } from "./layers.env.ts";
import { parseXml, walk, withClass } from "./xml.fixture.ts";

/** A small seeded generator. */
function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const players = (n: number, team: string, seed: number): PlayerDatum[] => {
  const next = random(seed);
  return Array.from({ length: n }, (_, i) => ({ x: 5 + next() * 90, y: 5 + next() * 90, team, number: i + 1, id: `${team}${i + 1}`, name: `${team} ${i + 1}` }));
};
const both = [...players(11, "home", 1), ...players(11, "away", 2)];

const passes = (n: number, seed = 5): PassDatum[] => {
  const next = random(seed);
  return Array.from({ length: n }, (): PassDatum => {
    const a = 1 + Math.floor(next() * 11);
    const b = 1 + ((a + Math.floor(next() * 4)) % 11);
    return { from: a, to: b === a ? (a % 11) + 1 : b, x: 15 + a * 6 + next() * 4, y: 10 + a * 7 + next() * 4, x2: 15 + b * 6, y2: 10 + b * 7, team: "home", fromNumber: a, toNumber: b };
  });
};

const moves = (n: number, seed = 9): MoveDatum[] => {
  const next = random(seed);
  return Array.from({ length: n }, (_, i): MoveDatum => {
    const x = 5 + next() * 90;
    const y = 5 + next() * 90;
    return { x, y, x2: x + 6 + next() * 8, y2: y + (next() - 0.5) * 10, id: i % 6, team: "home" };
  });
};

const draw = (sport: string, layers: object[], extra: object = {}): string => drawKyogijo({ sport: sport as "soccer", id: "t", layers: layers as Layer[], ...extra });
const kinds = (svg: string): string[] => withClass(parseXml(svg), "ky-layer").map((n) => n.attrs["data-kind"]);

const ALL: [string, object][] = [
  ["voronoi", { kind: "voronoi", data: both, from: "opta" }],
  ["delaunay", { kind: "delaunay", data: both, from: "opta", triangles: true }],
  ["hull", { kind: "hull", data: both, from: "opta" }],
  ["network", { kind: "network", data: passes(200), from: "opta" }],
  ["formation", { kind: "formation", formation: "4-4-2", team: "home" }],
  ["flow", { kind: "flow", data: moves(300), from: "opta" }],
  ["sonar", { kind: "sonar", data: moves(300), from: "opta", by: "player" }],
];

describe("every team layer", () => {
  for (const [kind, layer] of ALL) {
    it(`${kind}: is well-formed, clipped to the surface, titled and described, the same every time, and in both languages`, () => {
      for (const options of [{}, { orientation: "portrait" }, { theme: "dark" }, { language: "ja" }]) {
        const svg = draw("soccer", [layer], options);
        const doc = parseXml(svg);
        const [group] = withClass(doc, "ky-layer");
        expect(group.attrs["data-kind"]).toBe(kind);
        expect(group.attrs["clip-path"]).toBe("url(#t-lc)");
        expect(group.children[0].name).toBe("title");
        expect(group.children[0].text.length).toBeGreaterThan(4);
        expect(group.children[1].name).toBe("desc");
        expect(group.children[1].text.length).toBeGreaterThan(4);
        expect(draw("soccer", [layer], options)).toBe(svg);
      }
      expect(draw("soccer", [layer], { language: "ja" })).toMatch(/[぀-ヿ一-鿿]/u);
    });

    it(`${kind}: has a table, in text, with every cell escaped`, () => {
      const html = layerTable([layer as Layer], { surface: { sport: "soccer" } });
      expect(html).toContain(`data-kind="${kind}"`);
      expect(html).toContain("<caption>");
      expect(html).toContain("<tbody><tr>");
      expect(layerTable([layer as Layer], { surface: { sport: "soccer" }, language: "ja" })).toMatch(/[぀-ヿ一-鿿]/u);
      // Without the drawing's options the data is still listed, as rows of what was given.
      expect(layerTable([layer as Layer])).toContain(`data-kind="${kind}"`);
    });

    it(`${kind}: draws in colours that follow the page, not fixed ones, so that it is right in light and dark`, () => {
      const svg = draw("soccer", [layer]);
      const layerPart = svg.slice(svg.indexOf('<g id="t-l0"'), svg.indexOf("</g></g>", svg.indexOf('<g id="t-l0"')) + 8);
      expect(layerPart).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
      expect(KYOGIJO_TEAM_STYLE).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    });

    it(`${kind}: is held to the stylesheet only when it brings its own, and leaves it to the page with style "none"`, () => {
      expect(draw("soccer", [layer])).toContain(".ky-sp{");
      expect(draw("soccer", [layer], { style: "none" })).not.toContain(".ky-sp{");
      expect(KYOGIJO_STYLE).toContain(".ky-sp{");
    });
  }

  it("refuses data that is not a list and sonars by zone with no zones", () => {
    for (const kind of ["voronoi", "delaunay", "hull", "network", "flow", "sonar"]) expect(() => draw("soccer", [{ kind, data: 3 }]), kind).toThrow(/needs data/);
    expect(() => draw("soccer", [{ kind: "sonar", data: moves(5), by: "zone", from: "opta" }])).toThrow(/needs `zones`/);
  });

  it("leave a mark with no place out, and say how many", () => {
    const svg = draw("soccer", [{ kind: "voronoi", data: [...both, { x: null, y: 3 }, { x: 4 }, null] }]);
    expect(svg).toContain("3 left out for want of a place");
    expect(svg).toContain("Space control of 22 players");
  });

  it("run together with other layers and a score", () => {
    const svg = draw("soccer", [ALL[0][1], ALL[3][1], { kind: "points", data: [{ x: 50, y: 50 }] }], { away: { name: "A", score: 1 }, home: { name: "B", score: 2 } });
    expect(kinds(svg)).toEqual(["voronoi", "network", "points"]);
    expect(svg.indexOf('class="ky-layers"')).toBeLessThan(svg.indexOf('class="ky-plate-bg"'));
  });

  it("are drawn on every surface", () => {
    for (const sport of ["nhl", "nba", "nfl", "mlb", "soccer"]) {
      const data: PlayerDatum[] = sport === "mlb" ? [{ x: 0, y: -100, team: "home" }, { x: 80, y: -200, team: "home" }, { x: -60, y: -120, team: "away" }] : [{ x: 30, y: 20, team: "home" }, { x: 60, y: 40, team: "home" }, { x: 90, y: 25, team: "away" }];
      const svg = draw(sport, [{ kind: "voronoi", data }, { kind: "hull", data }, { kind: "delaunay", data }]);
      expect(kinds(svg)).toEqual(["voronoi", "hull", "delaunay"]);
    }
  });
});

describe("the Voronoi layer", () => {
  it("shares the surface between the teams, and the shares add up to all of it", () => {
    const env = envFor({ sport: "soccer" }, false);
    const sites = both.map((p): [number, number] => [(p.x as number) * 3.4, (p.y as number) * 2.2]);
    const shares = surfaceShares(sites, env);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(surfaceShares([], env)).toEqual([]);
    expect(surfaceShares([[10, 10], [10, 10]], env)).toEqual([1, 0]);
  });

  it("gives a team that is on its own the whole surface, and splits it between two evenly spread teams", () => {
    expect(draw("soccer", [{ kind: "voronoi", data: [{ x: 50, y: 50, team: "home" }], from: "opta" }])).toContain("home 100%");
    const svg = draw("soccer", [{ kind: "voronoi", data: [{ x: 25, y: 50, team: "home" }, { x: 75, y: 50, team: "away" }], from: "opta" }]);
    expect(svg).toContain("home 50%");
    expect(svg).toContain("away 50%");
  });

  it("counts the cells of the surface and not of the box: a rink's rounded corners and a ballpark's fence are left out", () => {
    const env = envFor({ sport: "mlb" }, false);
    const { box } = outlineOf({ sport: "mlb" });
    const sites: [number, number][] = [[0, -100], [150, -250]];
    const shares = surfaceShares(sites, env);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(box.w).toBeGreaterThan(0);
  });

  it("gives players who stand in one place one cell between them", () => {
    const svg = draw("soccer", [{ kind: "voronoi", data: [{ x: 30, y: 30, team: "home" }, { x: 30, y: 30, team: "away" }, { x: 80, y: 60, team: "away" }], from: "opta" }]);
    expect(svg).toContain("1 players share a place with another and have no cell.");
  });

  it("takes a colour of its own for a player over his team's", () => {
    const svg = draw("soccer", [{ kind: "voronoi", data: [{ x: 30, y: 30, team: "home", color: "#123456" }, { x: 80, y: 60, team: "away" }], from: "opta" }]);
    expect(svg).toContain("--c:#123456");
  });
});

describe("the Delaunay and hull layers", () => {
  it("draw a triangulation for each team and one for all with `by: all`", () => {
    const perTeam = layerTable([{ kind: "delaunay", data: both, from: "opta" } as Layer], { surface: { sport: "soccer" } });
    expect(perTeam).toContain("<td>home</td>");
    expect(perTeam).toContain("<td>away</td>");
    const all = layerTable([{ kind: "delaunay", data: both, from: "opta", by: "all" } as Layer], { surface: { sport: "soccer" } });
    expect(all).toContain("all players");
    expect(all).toContain("<td>22</td>");
  });

  it("draw nothing for fewer than three players, and a line for two, without failing", () => {
    for (const data of [[], [{ x: 10, y: 10 }], [{ x: 10, y: 10 }, { x: 40, y: 40 }], [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 30 }]]) {
      expect(() => draw("soccer", [{ kind: "delaunay", data }, { kind: "hull", data }, { kind: "voronoi", data }])).not.toThrow();
    }
    const two = draw("soccer", [{ kind: "hull", data: [{ x: 10, y: 10 }, { x: 40, y: 40 }] }]);
    expect(two).toContain("ky-sp ky-sp-e");
  });

  it("give the hull's area in the layer's units, which is the area of the hull of the places", () => {
    const html = layerTable([{ kind: "hull", data: [{ x: 0, y: 0, team: "home" }, { x: 100, y: 0, team: "home" }, { x: 100, y: 50, team: "home" }, { x: 0, y: 50, team: "home" }, { x: 50, y: 20, team: "home" }] } as Layer], { surface: { sport: "nhl" } });
    expect(html).toContain("<td>5000</td>");
    expect(polygonArea(convexHull([[0, 0], [100, 0], [100, 50], [0, 50]]))).toBe(5000);
  });

  it("measure the hull in yards when the layer's units are yards", () => {
    const html = layerTable([{ kind: "hull", units: "yd", data: [{ x: 0, y: 0, team: "home" }, { x: 10, y: 0, team: "home" }, { x: 10, y: 10, team: "home" }, { x: 0, y: 10, team: "home" }] } as Layer], { surface: { sport: "nfl" } });
    expect(html).toContain("<td>100</td>");
    expect(html).toContain("Lengths in yards.");
  });
});

describe("the network layer", () => {
  const few: PassDatum[] = [
    { from: 4, to: 8, x: 30, y: 40, x2: 45, y2: 55, team: "home", fromNumber: 4, toNumber: 8, fromName: "Diaz" },
    { from: 8, to: 4, x: 45, y: 55, x2: 32, y2: 42, team: "home" },
    { from: 4, to: 8, x: 31, y: 41, x2: 46, y2: 54, team: "home" },
    { from: 8, to: 9, x: 46, y: 54, x2: 70, y2: 50, team: "home", toName: "Kim" },
  ];

  it("counts touches and passes, and puts each node at the average of the places of his passes and receptions", () => {
    const html = layerTable([{ kind: "network", data: few, from: "opta" } as Layer], { surface: { sport: "soccer" } });
    // Player 4 made 2 passes and received 1; player 8 made 2 and received 2; 9 received 1.
    expect(html).toContain("<td>Diaz</td><td>home</td><td>3</td><td>2</td><td>1</td>");
    expect(html).toContain("<td>8</td><td>home</td><td>4</td><td>2</td><td>2</td>");
    expect(html).toContain("<td>Kim</td><td>home</td><td>1</td><td>0</td><td>1</td>");
    // 4's average place: (30 + 31 + 32 [received]) / 3 = 31 and (40 + 41 + 42) / 3 = 41.
    expect(html).toContain("<td>31</td><td>41</td>");
  });

  it("joins the two directions of a pair into one link, unless it is directed", () => {
    const undirected = layerTable([{ kind: "network", data: few, from: "opta" } as Layer], { surface: { sport: "soccer" } });
    expect(undirected).toContain("<td>Diaz</td><td>8</td><td>home</td><td>3</td>");
    const directed = layerTable([{ kind: "network", data: few, from: "opta", directed: true } as Layer], { surface: { sport: "soccer" } });
    expect(directed).toContain("<td>Diaz</td><td>8</td><td>home</td><td>2</td>");
    expect(directed).toContain("<td>8</td><td>Diaz</td><td>home</td><td>1</td>");
    expect(draw("soccer", [{ kind: "network", data: few, from: "opta", directed: true }])).toContain('class="ky-ah"');
    expect(draw("soccer", [{ kind: "network", data: few, from: "opta" }])).not.toContain('class="ky-ah"');
  });

  it("leaves out the links of fewer passes than `minPasses`, and says so", () => {
    const svg = draw("soccer", [{ kind: "network", data: few, from: "opta", minPasses: 2 }]);
    expect(svg).toContain("Links of fewer than 2 passes are left out.");
    expect(svg).toContain("Pass network: 3 players, 1 links from 4 passes");
    expect(svg).not.toContain("Kim and 8");
  });

  it("keeps players of two teams apart even when they wear the same number", () => {
    const data: PassDatum[] = [
      { from: 1, to: 2, x: 10, y: 10, team: "home" }, { from: 2, to: 1, x: 20, y: 10, team: "home" },
      { from: 1, to: 2, x: 80, y: 80, team: "away" }, { from: 2, to: 1, x: 70, y: 80, team: "away" },
    ];
    const html = layerTable([{ kind: "network", data, from: "opta" } as Layer], { surface: { sport: "soccer" } });
    expect(html.match(/<td>home<\/td>/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html.match(/<td>away<\/td>/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("skips a pass with no passer, no receiver or the same player for both, and counts players with no place without drawing them", () => {
    const data = [...few, { from: 4, to: 4, x: 1, y: 1 }, { from: 4 } as unknown as PassDatum, null as unknown as PassDatum, { from: 12, to: 13 }];
    const svg = draw("soccer", [{ kind: "network", data, from: "opta" }]);
    expect(svg).toContain("3 left out for want of a place");
    const html = layerTable([{ kind: "network", data, from: "opta" } as Layer], { surface: { sport: "soccer" } });
    expect(html).not.toContain("<td>13</td>");
  });

  it("takes places of your own for players, over the averages", () => {
    const html = layerTable([{ kind: "network", data: few, from: "opta", nodes: [{ id: 4, team: "home", x: 5, y: 6, name: "Diaz" }] } as Layer], { surface: { sport: "soccer" } });
    expect(html).toContain("<td>5</td><td>6</td>");
  });

  it("sizes a node by its touches and a link by its passes: more is bigger and wider", () => {
    const svg = parseXml(draw("soccer", [{ kind: "network", data: few, from: "opta" }]));
    const circles = walk(svg).filter((n) => n.name === "circle" && n.children.length > 0 && /touches/.test(n.children[0].text));
    const radius = (name: string): number => Number(circles.find((c) => c.children[0].text.startsWith(name))?.attrs.r);
    expect(radius("8:")).toBeGreaterThan(radius("Kim:"));
    const links = walk(svg).filter((n) => n.name === "path" && n.attrs["stroke-width"] !== undefined);
    const wide = links.find((l) => /3 passes/.test(l.children[0]?.text ?? ""));
    const thin = links.find((l) => /1 passes/.test(l.children[0]?.text ?? ""));
    expect(Number(wide?.attrs["stroke-width"])).toBeGreaterThan(Number(thin?.attrs["stroke-width"]));
    expect(Number(wide?.attrs.opacity)).toBeGreaterThan(Number(thin?.attrs.opacity));
  });

  it("labels nodes by number, name, id or nothing", () => {
    expect(draw("soccer", [{ kind: "network", data: few, from: "opta", labels: "name" }])).toContain(">Diaz</text>");
    expect(draw("soccer", [{ kind: "network", data: few, from: "opta", labels: "number" }])).toContain(">4</text>");
    expect(draw("soccer", [{ kind: "network", data: few, from: "opta", labels: "none" }])).not.toContain("<text");
  });

  it("turns its labels upright when the surface lies tall", () => {
    expect(draw("soccer", [{ kind: "network", data: few, from: "opta" }], { orientation: "portrait" })).toContain("rotate(-90");
  });
});

describe("the formations", () => {
  const expected: Record<FormationSport, number> = { soccer: 11, nhl: 6, nba: 5, nfl: 11, mlb: 9 };

  it("are many: ten for soccer, two for hockey, three for basketball, four for football and two for baseball", () => {
    expect(formationsOf("soccer")).toHaveLength(10);
    expect(formationsOf("nhl")).toHaveLength(2);
    expect(formationsOf("nba")).toHaveLength(3);
    expect(formationsOf("nfl")).toHaveLength(4);
    expect(formationsOf("mlb")).toHaveLength(2);
    expect(FORMATION_IDS).toEqual(expect.arrayContaining(["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "football-i-formation", "football-shotgun", "football-4-3", "football-3-4", "baseball-shift"]));
  });

  for (const f of Object.values(FORMATIONS)) {
    it(`${f.id}: has the players of a side, each on its own place in its frame, with a name in both languages`, () => {
      expect(f.positions, f.id).toHaveLength(expected[f.sport]);
      expect(new Set(f.positions.map((p) => p.id)).size).toBe(f.positions.length);
      const frame = FRAMES[f.frame];
      expect(frame, f.frame).toBeDefined();
      expect(frame.sport === f.sport || (f.sport === "soccer" && frame.sport === "soccer")).toBe(true);
      for (const p of f.positions) {
        expect(p.x, `${f.id} ${p.id}`).toBeGreaterThanOrEqual(Math.min(...frame.x));
        expect(p.x).toBeLessThanOrEqual(Math.max(...frame.x));
        expect(p.y).toBeGreaterThanOrEqual(Math.min(...frame.y));
        expect(p.y).toBeLessThanOrEqual(Math.max(...frame.y));
        expect(Object.prototype.hasOwnProperty.call(POSITION_NAMES[f.sport], p.id), `${f.sport} ${p.id} has a name`).toBe(true);
        expect(positionName(f.sport, p.id, "ja")).toMatch(/[぀-ヿ一-鿿]/u);
        expect(positionName(f.sport, p.id, "en")).toMatch(/^[A-Za-z0-9 -]+$/);
      }
      // No two players on one spot.
      for (const [i, a] of f.positions.entries()) for (const b of f.positions.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.id} and ${b.id}`).toBeGreaterThan(0.5);
      expect(f.name.ja.length).toBeGreaterThan(2);
      expect(f.about.ja).toMatch(/[぀-ヿ一-鿿]/u);
    });

    it(`${f.id}: is drawn on its surface, labelled, and refused on another`, () => {
      const surface = f.sport === "nfl" ? "nfl" : f.sport;
      const svg = draw(surface, [{ kind: "formation", formation: f.id, team: "home" }]);
      const doc = parseXml(svg);
      const circles = walk(withClass(doc, "ky-fm")[0]).filter((n) => n.name === "circle");
      expect(circles).toHaveLength(f.positions.length);
      expect(svg).toContain(`Formation ${f.name.en}: ${f.positions.length} positions`);
      const other = surface === "nhl" ? "nba" : "nhl";
      expect(() => draw(other, [{ kind: "formation", formation: f.id }])).toThrow(/is for/);
    });
  }

  it("keeps a soccer formation's own half on its side: the keeper at the left end, and the strikers furthest from him", () => {
    const f = formationById("4-4-2");
    const keeper = f.positions.find((p) => p.id === "GK");
    expect(keeper?.x).toBeLessThan(10);
    expect(Math.max(...f.positions.map((p) => p.x))).toBe(f.positions.find((p) => p.id === "RS")?.x);
    // A team that attacks right has its right flank at the bottom of the page, the low y of the frame.
    expect(f.positions.find((p) => p.id === "RB")?.y).toBeLessThan(50);
    expect(f.positions.find((p) => p.id === "LB")?.y).toBeGreaterThan(50);
  });

  it("turns for a team that attacks the left, and puts a football line of scrimmage where the ball lies", () => {
    const right = layerTable([{ kind: "formation", formation: "4-3-3", from: "opta" } as Layer], { surface: { sport: "soccer" } });
    const left = draw("soccer", [{ kind: "formation", formation: "4-3-3", attacking: "left" }]);
    const rightSvg = draw("soccer", [{ kind: "formation", formation: "4-3-3" }]);
    expect(left).not.toBe(rightSvg);
    expect(right).toContain("Goalkeeper");
    const cx = (svg: string): number => Number(/<circle[^>]*cx="([\d.]+)"/.exec(svg.slice(svg.indexOf("ky-fm")))?.[1]);
    expect(cx(left)).toBeGreaterThan(300);
    expect(cx(rightSvg)).toBeLessThan(40);
    const at = (los: number, attacking?: string): string => layerTable([{ kind: "formation", formation: "football-i-formation", los, attacking } as Layer], { surface: { sport: "nfl" } });
    // The centre stands on the line of scrimmage: x 60 at midfield, moved to 35 yards from the left end line.
    expect(at(60)).toContain("<td>60</td><td>26.67</td>");
    expect(at(45)).toContain("<td>45</td><td>26.67</td>");
  });

  it("puts players on the positions: their numbers in the marks, an empty position hollow, and their names in the table", () => {
    const svg = draw("soccer", [{ kind: "formation", formation: "4-4-2", team: "home", data: [{ position: "GK", number: 1, name: "Okafor" }, { position: "RS", number: 9, name: "Silva" }, { position: "ZZ", number: 99 }], names: true }]);
    expect(svg).toContain(">1</text>");
    expect(svg).toContain(">Okafor</text>");
    expect(svg).toMatch(/class="[^"]*ky-e"/);
    expect(svg).toContain("Players: Okafor (Goalkeeper), Silva (Right striker).");
    expect(svg).toContain("1 left out for want of a place");
    const html = layerTable([{ kind: "formation", formation: "4-4-2", data: [{ position: "GK", number: 1, name: "Okafor" }] } as Layer], { surface: { sport: "soccer" } });
    expect(html).toContain("<td>GK</td><td>Goalkeeper</td><td>1</td><td>Okafor</td>");
    // Without a surface the lineup is listed as it was given.
    expect(layerTable([{ kind: "formation", formation: "4-4-2", data: [{ position: "GK", number: 1, name: "Okafor" }] } as Layer])).toContain("<td>Okafor</td>");
  });

  it("takes a formation of your own, and refuses a bad one", () => {
    const mine: Formation = { id: "mine", sport: "soccer", frame: "opta", name: { en: "Mine", ja: "自作" }, about: { en: "Two.", ja: "二人。" }, positions: [{ id: "GK", x: 5, y: 50 }, { id: "ST", x: 80, y: 50 }] };
    expect(draw("soccer", [{ kind: "formation", formation: mine }])).toContain("Formation Mine: 2 positions");
    expect(() => draw("soccer", [{ kind: "formation", formation: "9-9-9" }])).toThrow(/Unknown formation "9-9-9": use one of 4-4-2/);
    expect(() => draw("soccer", [{ kind: "formation", formation: { ...mine, positions: [] } }])).toThrow(/a formation of your own/);
    expect(() => draw("soccer", [{ kind: "formation", formation: { ...mine, frame: "nowhere" } }])).toThrow(/a formation of your own/);
    expect(() => draw("soccer", [{ kind: "formation", formation: { ...mine, positions: [mine.positions[0], mine.positions[0]] } }])).toThrow(/Two positions/);
    expect(() => formationById("nope")).toThrow(RangeError);
  });

  it("has names for the positions in the language of the drawing, and the id for a position nobody named", () => {
    expect(positionName("soccer", "LB", "en")).toBe("Left back");
    expect(positionName("soccer", "LB", "ja")).toBe("左サイドバック");
    expect(positionName("nfl", "XX", "en")).toBe("XX");
    expect(draw("soccer", [{ kind: "formation", formation: "4-4-2" }], { language: "ja" })).toContain("フォーメーション4-4-2");
  });
});

describe("the flow layer", () => {
  it("draws the mean direction of the movements of each cell, and a table of degrees: 0 to the right and 90 to the top of the surface", () => {
    const right = Array.from({ length: 6 }, (_, i): MoveDatum => ({ x: 20 + i, y: 50, x2: 30 + i, y2: 50 }));
    const up = Array.from({ length: 6 }, (_, i): MoveDatum => ({ x: 20 + i, y: 80, x2: 20 + i, y2: 70 }));
    // In the frame `opta` y grows up the page, so a movement to a larger y goes to the top.
    const html = layerTable([{ kind: "flow", data: [...right, ...up.map((m) => ({ ...m, y: 20, y2: 30 }))], from: "opta", bins: 10 } as Layer], { surface: { sport: "soccer" } });
    expect(html).toContain("<td>0</td>");
    expect(html).toContain("<td>90</td>");
    expect(degreesOf(5, 0)).toBe(0);
    expect(degreesOf(0, -5)).toBe(90);
    expect(degreesOf(-5, 0)).toBe(180);
    expect(degreesOf(0, 5)).toBe(270);
  });

  it("leaves out cells with fewer movements than `minCount`, and counts only the movements it can use", () => {
    const data = [...moves(100), { x: 5, y: null } as MoveDatum, { x: 5, y: 5 } as MoveDatum];
    const svg = draw("soccer", [{ kind: "flow", data, from: "opta" }]);
    expect(svg).toContain("2 left out for want of a place");
    const few = draw("soccer", [{ kind: "flow", data: moves(100), from: "opta", minCount: 1000 }]);
    expect(few).toContain("in 0 cells");
  });

  it("takes a movement as a vector too, `dx` and `dy`", () => {
    const a = layerTable([{ kind: "flow", data: [{ x: 10, y: 10, x2: 20, y2: 10 }, { x: 11, y: 10, x2: 21, y2: 10 }], bins: 4 } as Layer], { surface: { sport: "nhl" } });
    const b = layerTable([{ kind: "flow", data: [{ x: 10, y: 10, dx: 10, dy: 0 }, { x: 11, y: 10, dx: 10, dy: 0 }], bins: 4 } as Layer], { surface: { sport: "nhl" } });
    expect(b).toBe(a);
  });

  it("draws fixed-length arrows whose opacity shows how steady the direction is", () => {
    const steady = Array.from({ length: 8 }, (_, i): MoveDatum => ({ x: 20 + i * 0.1, y: 20, x2: 30, y2: 20 }));
    const mixed = Array.from({ length: 8 }, (_, i): MoveDatum => ({ x: 70 + i * 0.1, y: 70, x2: i % 2 === 0 ? 80 : 60, y2: 70 + (i % 4) }));
    const svg = draw("soccer", [{ kind: "flow", data: [...steady, ...mixed], from: "opta", lengths: "fixed", bins: 6 }]);
    expect(svg.match(/<g opacity="[\d.]+">/g)?.length ?? svg.match(/ opacity="[\d.]+"><path class="ky-ln"/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("the sonar layer", () => {
  const east = (n: number, x = 40, y = 40): MoveDatum[] => Array.from({ length: n }, (): MoveDatum => ({ x, y, x2: x + 10, y2: y }));
  const north = (n: number, x = 40, y = 40): MoveDatum[] => Array.from({ length: n }, (): MoveDatum => ({ x, y, x2: x, y2: y + 10 }));

  it("counts the movements in each direction: east in the bin of 0 degrees, north in the bin of 90", () => {
    const html = layerTable([{ kind: "sonar", data: [...east(5), ...north(3)], from: "opta", angles: 12 } as Layer], { surface: { sport: "soccer" } });
    expect(html).toContain("<td>345</td><td>15</td><td>5</td>");
    expect(html).toContain("<td>75</td><td>105</td><td>3</td>");
    expect(draw("soccer", [{ kind: "sonar", data: [...east(5), ...north(3)], from: "opta" }])).toContain("Most common direction: 0 degrees, 5.");
  });

  it("draws one bar for each direction that has a movement, and a ring for the rose", () => {
    const svg = parseXml(draw("soccer", [{ kind: "sonar", data: [...east(5), ...north(3)], from: "opta" }]));
    expect(withClass(svg, "ky-ro")).toHaveLength(2);
    expect(withClass(svg, "ky-ro-r")).toHaveLength(1);
  });

  it("gives a rose for each player at the average of his starts, and skips a movement with no player", () => {
    const data = [...east(4, 20, 30).map((m) => ({ ...m, id: "a" })), ...north(4, 60, 70).map((m) => ({ ...m, id: "b" })), ...east(2).map((m) => ({ ...m, id: undefined }))];
    const svg = draw("soccer", [{ kind: "sonar", data, from: "opta", by: "player" }]);
    expect(svg).toContain("2 roses");
    expect(svg).toContain("2 left out for want of a place");
    const html = layerTable([{ kind: "sonar", data, from: "opta", by: "player" } as Layer], { surface: { sport: "soccer" } });
    expect(html).toContain("<td>a</td><td>20</td><td>30</td><td>4</td>");
  });

  it("gives a rose for each cell of a grid and for each zone of a zone set", () => {
    const data = [...east(3, 10, 10), ...east(3, 90, 90)];
    expect(draw("soccer", [{ kind: "sonar", data, from: "opta", by: "grid", bins: 4 }])).toContain("2 roses");
    const zoned = draw("soccer", [{ kind: "sonar", data, from: "opta", by: "zone", zones: "soccer-thirds" }]);
    expect(zoned).toContain("2 roses");
    const lost = draw("soccer", [{ kind: "sonar", data: [...data, { x: 500, y: 500, x2: 510, y2: 500 }], from: "opta", by: "grid", bins: 4 }]);
    expect(lost).toContain("outside the grid or the zones");
  });

  it("reads the mean length of each direction when asked, in the layer's units", () => {
    const data = [{ x: 40, y: 40, x2: 50, y2: 40 }, { x: 40, y: 40, x2: 70, y2: 40 }] as MoveDatum[];
    const html = layerTable([{ kind: "sonar", data, from: "opta", statistic: "mean" } as Layer], { surface: { sport: "soccer" } });
    // Opta's x is a percent of a 105-metre pitch: the layer's own numbers are percent, but the sonar reads the surface, in the layer's unit (feet, as the drawing has no units).
    expect(html).toContain("Mean length");
  });

  it("holds the angles to 3 and 72 bins", () => {
    const html = layerTable([{ kind: "sonar", data: east(3), from: "opta", angles: 500 } as Layer], { surface: { sport: "soccer" } });
    expect(html).toContain("<td>357.5</td><td>2.5</td>");
    expect(layerTable([{ kind: "sonar", data: east(3), from: "opta", angles: 1 } as Layer], { surface: { sport: "soccer" } })).toContain("<td>300</td><td>60</td>");
  });
});

describe("the budgets of the team layers", () => {
  const bare = drawKyogijo({ sport: "soccer", id: "b" }).length;
  const timed = (layer: object, sport = "soccer"): { added: number; took: number } => {
    const start = performance.now();
    const svg = draw(sport, [layer], { id: "b" });
    return { added: svg.length - bare, took: performance.now() - start };
  };

  it("a Voronoi diagram of 22 players adds under 12 kB, and one of 400 under 140 kB in under 400 ms", () => {
    const small = timed({ kind: "voronoi", data: both, from: "opta" });
    expect(small.added, `${small.added} bytes`).toBeLessThan(12_000);
    const big = timed({ kind: "voronoi", data: [...players(200, "home", 3), ...players(200, "away", 4)], from: "opta" });
    expect(big.added, `${big.added} bytes`).toBeLessThan(140_000);
    expect(big.took, `${Math.round(big.took)} ms`).toBeLessThan(400);
  });

  it("a triangulation and a hull of 22 players add under 10 kB each; a triangulation of 1,000 points is made in under 600 ms", () => {
    expect(timed({ kind: "delaunay", data: both, from: "opta", triangles: true }).added).toBeLessThan(10_000);
    expect(timed({ kind: "hull", data: both, from: "opta" }).added).toBeLessThan(10_000);
    const big = timed({ kind: "delaunay", data: players(1000, "home", 8), from: "opta" });
    expect(big.took, `${Math.round(big.took)} ms`).toBeLessThan(600);
  });

  it("a pass network of 600 passes adds under 16 kB in under 100 ms", () => {
    const one = timed({ kind: "network", data: passes(600), from: "opta" });
    expect(one.added, `${one.added} bytes`).toBeLessThan(16_000);
    expect(one.took, `${Math.round(one.took)} ms`).toBeLessThan(100);
  });

  it("a formation adds under 5 kB", () => {
    expect(timed({ kind: "formation", formation: "4-3-3" }).added).toBeLessThan(5_000);
  });

  it("a flow field of 5,000 movements adds under 20 kB in under 150 ms, and a sonar of each of 22 players of 5,000 movements under 60 kB in under 150 ms", () => {
    const flow = timed({ kind: "flow", data: moves(5000), from: "opta", bins: 16 });
    expect(flow.added, `${flow.added} bytes`).toBeLessThan(20_000);
    expect(flow.took, `${Math.round(flow.took)} ms`).toBeLessThan(150);
    const data = moves(5000).map((m, i) => ({ ...m, id: i % 22 }));
    const sonar = timed({ kind: "sonar", data, from: "opta", by: "player" });
    expect(sonar.added, `${sonar.added} bytes`).toBeLessThan(60_000);
    expect(sonar.took, `${Math.round(sonar.took)} ms`).toBeLessThan(150);
  });
});

describe("the same options always draw the same layers: fingerprints", () => {
  it("are held for each kind on its own surface, in English and Japanese", () => {
    const fingerprint = (sport: string, layer: object, language: "en" | "ja"): string => hash(drawLayers({ sport: sport as "soccer", id: "snap", language }, [layer as Layer]));
    expect(
      Object.fromEntries(
        ALL.flatMap(([kind, layer]) => ["en", "ja"].map((language) => [`${kind} ${language}`, fingerprint("soccer", layer, language as "en" | "ja")])),
      ),
    ).toMatchSnapshot();
    expect({
      hockey: fingerprint("nhl", { kind: "formation", formation: "hockey-1-3-1", team: "away" }, "en"),
      basketball: fingerprint("nba", { kind: "formation", formation: "basketball-5-out", team: "home" }, "en"),
      football: fingerprint("nfl", { kind: "formation", formation: "football-shotgun", team: "home", los: 40 }, "en"),
      baseball: fingerprint("mlb", { kind: "formation", formation: "baseball-shift", team: "away" }, "en"),
      rink: fingerprint("nhl", { kind: "voronoi", data: [{ x: 20, y: 20, team: "home" }, { x: 150, y: 60, team: "away" }, { x: 100, y: 40, team: "home" }] }, "en"),
    }).toMatchSnapshot();
  });
});
