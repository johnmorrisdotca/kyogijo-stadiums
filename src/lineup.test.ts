import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { FORMATIONS, formationById } from "./formations.ts";
import { layerTable } from "./layers.ts";
import type { Layer } from "./layers.types.ts";
import { LINEUP_CODES, assign, bestFormation, codeOf, formationsFor } from "./lineup.codes.ts";
import { fit, jerseyPath, textWidth } from "./team.lineup.ts";
import type { LineupPlayer } from "./team.types.ts";
import { parseXml, walk, withClass } from "./xml.fixture.ts";

const draw = (sport: string, layers: object[], extra: object = {}): string => drawKyogijo({ sport: sport as "soccer", id: "t", layers: layers as Layer[], ...extra });
const team = (names: string[], codes: string[]): LineupPlayer[] => names.map((name, i) => ({ pos: codes[i], name, number: i + 1 }));
const fourTwoThreeOne = team(["Okafor", "Silva", "Mbeki", "Rossi", "Ito", "Nakamura", "Costa", "Dubois", "Haddad", "Kowalski", "Eze"], ["GK", "RB", "CB", "CB", "LB", "DM", "DM", "RW", "AM", "LW", "ST"]);
const placeOf = (svg: string, id: string): { x: number; y: number } => {
  const group = withClass(parseXml(svg), "ky-fm")[0];
  const marks = group.children.filter((n) => n.name === "circle" || n.name === "path");
  const titles = marks.map((m) => m.children[0]?.text ?? "");
  const at = titles.findIndex((t) => t.startsWith(id));
  const mark = marks[at];
  return { x: Number(mark.attrs.cx), y: Number(mark.attrs.cy) };
};

describe("the codes of a lineup", () => {
  it("are upper case with no spaces or dots, and each sport has a table", () => {
    expect(codeOf(" l.w ")).toBe("LW");
    expect(codeOf(4)).toBe("4");
    expect(codeOf(undefined)).toBe("");
    expect(Object.keys(LINEUP_CODES).sort()).toEqual(Object.keys(FORMATIONS).map((id) => FORMATIONS[id].sport).filter((s, i, all) => all.indexOf(s) === i).sort());
    for (const [sport, table] of Object.entries(LINEUP_CODES)) {
      const ids = new Set(Object.values(FORMATIONS).filter((f) => f.sport === sport).flatMap((f) => [...f.positions, ...(f.extra ?? [])].map((p) => p.id)));
      for (const [code, list] of Object.entries(table)) for (const id of list) expect(ids.has(id), `${sport} ${code} -> ${id}`).toBe(true);
    }
  });

  it("send two centre-backs to the two places of a back four, each to its own, and let a code that names a place have it first", () => {
    const f = formationById("4-4-2");
    const got = assign(f, [{ pos: "CB" }, { pos: "RCB" }, { pos: "CB" }, { pos: "GK" }]);
    expect(got.of).toEqual(["LCB", "RCB", undefined, "GK"]);
    expect(got.placed).toBe(3);
    expect(got.exact).toBe(2);
    // On a back three, a CB has the middle place first.
    expect(assign(formationById("3-5-2"), [{ pos: "CB" }, { pos: "CB" }, { pos: "CB" }]).of).toEqual(["CB", "RCB", "LCB"]);
  });

  it("take the scorer's numbers in baseball, the usual short codes in hockey, football and basketball", () => {
    expect(assign(formationById("baseball-standard"), [1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => ({ pos }))).of).toEqual(["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"]);
    expect(assign(formationById("hockey-5v5"), [{ pos: "D" }, { pos: "D" }, { pos: "W" }, { pos: "W" }, { pos: "C" }, { pos: "GOALIE" }]).of).toEqual(["LD", "RD", "LW", "RW", "C", "G"]);
    expect(assign(formationById("football-4-3"), [{ pos: "DE" }, { pos: "DT" }, { pos: "LB" }, { pos: "S" }, { pos: "CB" }]).of).toEqual(["LDE", "LDT", "MLB", "FS", "LCB"]);
    expect(assign(formationById("basketball-traditional"), [{ pos: "G" }, { pos: "F" }, { pos: "C" }]).of).toEqual(["PG", "SF", "C"]);
  });

  it("put a second line on the places that end in its number", () => {
    const f = formationById("hockey-two-lines");
    expect(assign(f, [{ pos: "LW" }, { pos: "LW", line: 2 }, { pos: "D", line: 2 }, { pos: "D", line: 2 }, { pos: "C", line: 3 }]).of).toEqual(["LW", "LW2", "LD2", "RD2", undefined]);
  });

  it("turn a volleyball team a place clockwise for each rotation: 2 to 1, 1 to 6, 6 to 5, 5 to 4, 4 to 3, 3 to 2", () => {
    const f = formationById("volleyball-rotation");
    const six = [1, 2, 3, 4, 5, 6].map((n) => ({ pos: `P${n}`, number: n }));
    expect(assign(f, six, 1).of).toEqual(["P1", "P2", "P3", "P4", "P5", "P6"]);
    expect(assign(f, six, 2).of).toEqual(["P6", "P1", "P2", "P3", "P4", "P5"]);
    expect(assign(f, six, 7).of).toEqual(assign(f, six, 1).of);
    // The numbers of the zones are codes too.
    expect(assign(f, [1, 2, 3].map((pos) => ({ pos })), 1).of).toEqual(["P1", "P2", "P3"]);
  });

  it("choose the formation that places the most players, and on a tie the first of the table", () => {
    const soccer = formationsFor(["soccer"]);
    expect(bestFormation(soccer, fourTwoThreeOne)?.id).toBe("4-2-3-1");
    expect(bestFormation(soccer, team(["a", "b"], ["GK", "RS"]))?.id).toBe("4-4-2");
    expect(bestFormation(soccer, team(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"], ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"]))?.id).toBe("4-3-3");
    expect(bestFormation(formationsFor(["nfl"]), team(["a", "b", "c"], ["QB", "HB", "TE"]))?.id).toBe("football-i-formation");
    expect(bestFormation(formationsFor(["nfl"]), team(["a", "b", "c"], ["DE", "LB", "S"]))?.id).toBe("football-4-3");
    expect(bestFormation([], [])).toBeUndefined();
  });
});

describe("the text of a lineup", () => {
  it("is measured by a rough count: wide for capitals and Japanese, narrow for i and l", () => {
    expect(textWidth("iii")).toBeLessThan(textWidth("nnn"));
    expect(textWidth("MMM")).toBeGreaterThan(textWidth("nnn"));
    expect(textWidth("大谷翔平")).toBe(4);
  });
  it("is cut short with an ellipsis when it cannot fit, and left out when not three letters fit", () => {
    expect(fit("Okafor", 10)).toBe("Okafor");
    expect(fit("van der Berg-Hoekstra", 4)).toMatch(/…$/);
    expect(textWidth(fit("van der Berg-Hoekstra", 4))).toBeLessThanOrEqual(4);
    expect(fit("van der Berg-Hoekstra", 0.5)).toBe("");
  });
  it("has a jersey with sleeves, a neckline and a body, symmetrical about its middle", () => {
    const d = jerseyPath(100, 50, 20);
    expect(d.startsWith("M96.6 40.4Q100 42.8 103.4 40.4")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    const xs = [...d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    expect(Math.min(...xs) + Math.max(...xs)).toBeCloseTo(200, 5);
  });
});

describe("a lineup layer", () => {
  it("draws a disc with the number for each place, the name under it and a title that says how many are on", () => {
    const svg = draw("soccer", [{ kind: "lineup", side: "home", players: fourTwoThreeOne }]);
    const doc = parseXml(svg);
    const layer = withClass(doc, "ky-layer").find((n) => n.attrs["data-kind"] === "lineup");
    expect(layer).toBeDefined();
    const circles = walk(withClass(doc, "ky-fm")[0]).filter((n) => n.name === "circle");
    expect(circles).toHaveLength(11);
    expect(circles.some((c) => (c.attrs.class ?? "").includes("ky-e"))).toBe(false);
    expect(svg).toContain("Lineup in 4-2-3-1: 11 players");
    expect(svg).toContain("Players: Okafor (Goalkeeper), Silva (Right back)");
    for (const p of fourTwoThreeOne) expect(svg).toContain(`>${p.name}</text>`);
    expect(withClass(doc, "ky-nm").map((n) => n.text)).toEqual(expect.arrayContaining(["1", "9", "11"]));
  });

  it("stands the same players as the formation layer does, on the same places", () => {
    const lineup = draw("soccer", [{ kind: "lineup", formation: "4-2-3-1", players: fourTwoThreeOne }]);
    const formation = draw("soccer", [{ kind: "formation", formation: "4-2-3-1", team: "home" }]);
    for (const id of ["Goalkeeper", "Striker", "Right back", "Left winger"]) expect(placeOf(lineup, id)).toEqual(placeOf(formation, id));
  });

  it("leaves a place hollow when nobody stands on it, with its code in it, and lists the players that have no place", () => {
    const svg = draw("soccer", [{ kind: "lineup", formation: "4-4-2", players: [{ pos: "GK", name: "Okafor", number: 1 }, { pos: "CF", name: "Eze", number: 9 }, { pos: "QB", name: "Nobody", number: 12 }] }]);
    const circles = walk(withClass(parseXml(svg), "ky-fm")[0]).filter((n) => n.name === "circle");
    expect(circles.filter((c) => (c.attrs.class ?? "").includes("ky-e"))).toHaveLength(9);
    expect(svg).toContain("With no place in the formation: Nobody.");
    expect(svg).toContain(">RB</text>");
  });

  it("turns the visitors to attack the left, and keeps a football offence, a baseball fielder and a cricketer where they stand", () => {
    const at = (sport: string, side: string, formation: string, id: string): number => placeOf(draw(sport, [{ kind: "lineup", side, formation, players: [{ pos: id, name: "x", number: 1 }] }]), id === "GK" ? "Goalkeeper" : id === "QB" ? "Quarterback" : id === "SS" ? "Shortstop" : "Wicketkeeper").x;
    expect(at("soccer", "away", "4-4-2", "GK")).toBeGreaterThan(at("soccer", "home", "4-4-2", "GK") + 100);
    expect(at("nfl", "away", "football-i-formation", "QB")).toBe(at("nfl", "home", "football-i-formation", "QB"));
    expect(at("mlb", "away", "baseball-standard", "SS")).toBe(at("mlb", "home", "baseball-standard", "SS"));
    expect(at("cricket", "away", "cricket-test-attacking", "WK")).toBe(at("cricket", "home", "cricket-test-attacking", "WK"));
    // The layer's own `attacking` says where the offence goes, and a defence faces it.
    const left = placeOf(draw("nfl", [{ kind: "lineup", formation: "football-i-formation", attacking: "left", players: [{ pos: "QB", number: 12 }] }]), "Quarterback").x;
    expect(left).toBeGreaterThan(at("nfl", "home", "football-i-formation", "QB"));
  });

  it("colours a team by its side, a player by his own colour, and draws two teams on one pitch", () => {
    const svg = draw("soccer", [
      { kind: "lineup", side: "home", players: [{ pos: "GK", number: 1 }, { pos: "ST", number: 9, color: "#e0245e" }] },
      { kind: "lineup", side: "away", players: [{ pos: "GK", number: 1 }] },
    ]);
    const groups = withClass(parseXml(svg), "ky-fm");
    expect(groups).toHaveLength(2);
    expect(groups[0].attrs.class).toContain("ky-h");
    expect(groups[1].attrs.class).toContain("ky-a");
    expect(svg).toContain("--c:#e0245e");
    expect(withClass(parseXml(svg), "ky-layer").filter((n) => n.attrs["data-kind"] === "lineup")).toHaveLength(2);
  });

  it("draws jerseys, not discs, when asked", () => {
    const svg = draw("nhl", [{ kind: "lineup", shape: "jersey", players: [{ pos: "C", number: 97, name: "McDavid" }] }]);
    const group = withClass(parseXml(svg), "ky-fm")[0];
    expect(group.children.filter((n) => n.name === "path")).toHaveLength(6);
    expect(group.children.filter((n) => n.name === "circle")).toHaveLength(0);
  });

  it("shrinks a long name to fit its neighbours and leaves a short one at the usual size", () => {
    const sizes = (name: string): number => {
      const svg = draw("soccer", [{ kind: "lineup", formation: "4-4-2", players: [{ pos: "LCB", name, number: 4 }, { pos: "RCB", name: "Ng", number: 5 }] }]);
      const text = walk(parseXml(svg)).find((n) => n.name === "text" && n.text.startsWith(name.slice(0, 2)) && (n.attrs.class ?? "") === "ky-lt");
      return Number((text?.attrs.style ?? "").match(/font-size:([\d.]+)px/)?.[1]);
    };
    expect(sizes("Ngo")).toBeGreaterThan(sizes("Van der Berg-Hoekstra"));
    expect(sizes("Van der Berg-Hoekstra")).toBeGreaterThan(0);
  });

  it("gives a captain an armband, and a player a flag badge, and refuses a flag that is a script", () => {
    const flag = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2"><rect width="3" height="2" fill="#c8102e"/></svg>`;
    const svg = draw("soccer", [{ kind: "lineup", players: [{ pos: "GK", number: 1, captain: true, flag }, { pos: "ST", number: 9, flag: "javascript:alert(1)" }] }]);
    expect(svg).toContain('class="ky-lc"');
    expect(svg).toContain(">C</text>");
    expect(svg.match(/<image /g)).toHaveLength(1);
    expect(svg).toContain("Captain: 1.");
    expect(svg).not.toContain("javascript:");
    parseXml(svg);
  });

  it("writes the position, the name or nothing in a mark, and no names under them when told", () => {
    const players = [{ pos: "GK", name: "Okafor", number: 1 }];
    const text = (extra: object): string[] => withClass(parseXml(draw("soccer", [{ kind: "lineup", formation: "4-4-2", players, ...extra }])), "ky-nm").map((n) => n.text);
    expect(text({})).toEqual(["1"]);
    expect(text({ labels: "name" })).toEqual(["Okafor"]);
    expect(text({ labels: "position" })).toEqual(["GK"]);
    expect(text({ labels: "none" })).toEqual([]);
    expect(draw("soccer", [{ kind: "lineup", formation: "4-4-2", players, names: false }])).not.toContain(">Okafor</text>");
  });

  it("is not cut to the surface unless it is asked to be", () => {
    const own = draw("mlb", [{ kind: "lineup", players: [{ pos: "C", number: 2 }] }]);
    expect(own).not.toContain("clip-path=\"url(#t-lc)\"");
    expect(draw("mlb", [{ kind: "lineup", clip: "surface", players: [{ pos: "C", number: 2 }] }])).toContain("clip-path=\"url(#t-lc)\"");
    expect(draw("mlb", [{ kind: "points", data: [{ x: 1, y: 1 }] }])).toContain("clip-path=\"url(#t-lc)\"");
  });

  it("lists the designated hitter beside home plate, for baseball and for softball, and picks the softball defence on a softball field", () => {
    const nine = team(["a", "b", "c", "d", "e", "f", "g", "h", "i"], ["P", "C", "1B", "2B", "SS", "3B", "LF", "CF", "RF"]);
    const withDh = [...nine, { pos: "DH", name: "Ohtani", number: 17 }];
    const baseball = draw("mlb", [{ kind: "lineup", players: withDh }]);
    expect(baseball).toContain("Lineup in Baseball, standard defence: 10 players");
    expect(baseball).toContain("Ohtani (Designated hitter)");
    expect(draw("mlb", [{ kind: "lineup", players: withDh }], { league: "ncaa-softball" })).toContain("Lineup in Softball, standard defence: 10 players");
    expect(draw("mlb", [{ kind: "lineup", players: withDh }], { league: "milb" })).toContain("Baseball, standard defence");
    // A formation layer leaves the designated hitter out.
    expect(walk(withClass(parseXml(draw("mlb", [{ kind: "formation", formation: "baseball-standard" }])), "ky-fm")[0]).filter((n) => n.name === "circle")).toHaveLength(9);
  });

  it("turns a volleyball rotation, and says which", () => {
    const six = team(["a", "b", "c", "d", "e", "f"], ["P1", "P2", "P3", "P4", "P5", "P6"]);
    const first = draw("volleyball", [{ kind: "lineup", players: six }]);
    const second = draw("volleyball", [{ kind: "lineup", rotation: 2, players: six }]);
    expect(second).toContain("Rotation 2 of 6.");
    expect(first).not.toContain("Rotation");
    expect(second).toContain("a (Position 6, centre back)");
    expect(second).toContain("b (Position 1, right back)");
    expect(first).toContain("a (Position 1, right back)");
  });

  it("puts hockey's second line in a row of smaller marks", () => {
    const svg = draw("nhl", [{ kind: "lineup", players: [{ pos: "C", number: 97 }, { pos: "C", number: 29, line: 2 }] }]);
    const radii = walk(withClass(parseXml(svg), "ky-fm")[0]).filter((n) => n.name === "circle" && !(n.attrs.class ?? "").includes("ky-e"));
    expect(radii).toHaveLength(2);
    expect(Math.min(...radii.map((c) => Number(c.attrs.r)))).toBeCloseTo(Math.max(...radii.map((c) => Number(c.attrs.r))) * 0.8, 1);
    expect(svg).toContain("Centre on the second line");
  });

  it("is drawn on every surface that has a formation, in English and Japanese, and refused on another", () => {
    const sports = [...new Set(Object.values(FORMATIONS).map((f) => (f.sport === "nfl" ? "nfl" : f.sport)))];
    for (const sport of sports) {
      const f = Object.values(FORMATIONS).find((g) => g.sport === sport) as (typeof FORMATIONS)[string];
      const players = f.positions.map((p, i) => ({ pos: p.id, name: `P${i + 1}`, number: i + 1 }));
      for (const language of ["en", "ja"] as const) {
        const svg = draw(sport, [{ kind: "lineup", formation: f.id, players }], { language });
        parseXml(svg);
        expect(walk(withClass(parseXml(svg), "ky-fm")[0]).filter((n) => n.name === "circle")).toHaveLength(f.positions.length + (f.extra?.length ?? 0));
        expect(svg).toContain(language === "ja" ? "のラインナップ" : "Lineup in ");
      }
      expect(() => draw(sport === "nhl" ? "nba" : "nhl", [{ kind: "lineup", formation: f.id, players }])).toThrow(/is for/);
    }
  });

  it("needs players, and a formation that exists", () => {
    expect(() => draw("soccer", [{ kind: "lineup" }])).toThrow(/a lineup needs players/);
    expect(() => draw("soccer", [{ kind: "lineup", formation: "9-9-9", players: [] }])).toThrow(/Unknown formation "9-9-9"/);
    expect(() => draw("curling", [{ kind: "lineup", players: [{ pos: "GK" }] }])).toThrow(/There is no formation for curling/);
    expect(draw("soccer", [{ kind: "lineup", players: [] }])).toContain("Lineup in 4-4-2: 0 players");
  });

  it("takes a formation of your own", () => {
    const mine = { id: "mine", sport: "soccer" as const, frame: "opta", name: { en: "Mine", ja: "自作" }, about: { en: "Two.", ja: "二人。" }, positions: [{ id: "GK", x: 5, y: 50 }, { id: "ST", x: 80, y: 50 }] };
    expect(draw("soccer", [{ kind: "lineup", formation: mine, players: [{ pos: "GK", name: "A" }, { pos: "ST", name: "B" }] }])).toContain("Lineup in Mine: 2 players");
  });

  it("has a table: each place with its player and the captain, and each player with no place", () => {
    const html = layerTable([{ kind: "lineup", formation: "4-4-2", players: [{ pos: "GK", name: "Okafor", number: 1, captain: true }, { pos: "QB", name: "Nobody" }] } as Layer], { surface: { sport: "soccer" } });
    expect(html).toContain("<th scope=\"col\">Captain</th>");
    expect(html).toContain("<td>Okafor</td>");
    expect(html).toContain("<td>Nobody</td>");
    expect(html.match(/<tr>/g)).toHaveLength(1 + 11 + 1);
    // Without a surface, the players are listed as given.
    const bare = layerTable([{ kind: "lineup", players: [{ pos: "GK", name: "Okafor", number: 1 }] } as Layer]);
    expect(bare).toContain("<td>GK</td>");
    expect(bare).toContain("<td>Okafor</td>");
  });

  it("turns its labels upright when the surface lies tall", () => {
    expect(draw("soccer", [{ kind: "lineup", players: [{ pos: "GK", name: "Okafor", number: 1, captain: true }] }], { orientation: "portrait" })).toContain("rotate(-90");
  });

  it("escapes what it is given, and draws the same layer every time", () => {
    const players = [{ pos: "GK", name: "<b>&\"'", number: "1<" }];
    const one = draw("soccer", [{ kind: "lineup", players }]);
    expect(one).not.toContain("<b>");
    parseXml(one);
    expect(draw("soccer", [{ kind: "lineup", players }])).toBe(one);
  });

  it("adds under 9 kB for a team of eleven, and under 14 kB for eighteen with jerseys", () => {
    const base = draw("soccer", []).length;
    expect(draw("soccer", [{ kind: "lineup", players: fourTwoThreeOne }]).length - base).toBeLessThan(9_000);
    const afl = team(Array.from({ length: 18 }, (_, i) => `Player ${i + 1}`), formationById("afl-18").positions.map((p) => p.id));
    const aflBase = draw("afl", []).length;
    expect(draw("afl", [{ kind: "lineup", shape: "jersey", players: afl }]).length - aflBase).toBeLessThan(14_000);
  });
});
