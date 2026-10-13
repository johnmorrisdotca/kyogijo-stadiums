import { describe, expect, it } from "vitest";
import { SPORTS, describe as describeDrawing, drawBadge, drawKyogijo, drawScore, drawSurface, statusLabel, winnerOf } from "./draw.ts";
import { PARKS, PARK_IDS } from "./parks.ts";
import type { ScoreOptions, Sport } from "./types.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const away = { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" };
const home = { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" };
const game = (sport: Sport, extra: Partial<ScoreOptions> = {}): ScoreOptions => ({ sport, away, home, status: "final", ...extra });
const parse = (svg: string): Node => parseXml(svg);
const box = (svg: Node): number[] => svg.attrs.viewBox.split(" ").map(Number);

describe("every surface", () => {
  for (const sport of SPORTS) {
    it(`${sport} is well-formed SVG that says what it is`, () => {
      for (const options of [{ sport }, game(sport), { ...game(sport), size: "compact" as const }, { ...game(sport), size: "badge" as const }, { sport, orientation: "portrait" as const }, { ...game(sport), orientation: "portrait" as const }]) {
        const svg = parse(drawKyogijo(options));
        expect(svg.name).toBe("svg");
        expect(svg.attrs.role).toBe("img");
        expect(svg.attrs.xmlns).toBe("http://www.w3.org/2000/svg");
        const [titleId, descId] = svg.attrs["aria-labelledby"].split(" ");
        const byId = (id: string): Node | undefined => walk(svg).find((n) => n.attrs.id === id);
        expect(byId(titleId)?.name).toBe("title");
        expect(byId(descId)?.name).toBe("desc");
        expect(byId(titleId)?.text.length).toBeGreaterThan(3);
        expect(byId(descId)?.text.length).toBeGreaterThan(20);
        expect(svg.attrs.class).toContain("kyogijo");
        expect(box(svg).every(Number.isFinite)).toBe(true);
      }
    });

    it(`${sport} draws the same drawing for the same options, and not for different ones`, () => {
      expect(drawKyogijo(game(sport))).toBe(drawKyogijo(game(sport)));
      expect(drawKyogijo(game(sport))).not.toBe(drawKyogijo(game(sport, { home: { ...home, score: 9 } })));
    });

    it(`${sport} lies tall when portrait and wide when landscape`, () => {
      // A curling sheet, 150 feet by 15, lies tall unless it is asked to lie wide.
      const wide = box(parse(drawKyogijo({ sport, orientation: "landscape" })));
      const tall = box(parse(drawKyogijo({ sport, orientation: "portrait" })));
      // A ballpark and a cricket ground (a circle unless its boundary says otherwise) are as high as they are wide.
      if (sport === "mlb" || sport === "cricket") expect(tall[3] / tall[2]).toBeGreaterThan(0.9);
      else {
        expect(wide[2]).toBeGreaterThan(wide[3]);
        expect(tall[3]).toBeGreaterThan(tall[2]);
        expect(tall[2]).toBeCloseTo(wide[3], 1);
        expect(tall[3]).toBeCloseTo(wide[2], 1);
      }
    });

    it(`${sport} follows aspect when the orientation is auto`, () => {
      expect(parse(drawKyogijo({ sport, orientation: "auto", aspect: 0.6 })).attrs["data-orientation"]).toBe("portrait");
      expect(parse(drawKyogijo({ sport, orientation: "auto", aspect: 1.6 })).attrs["data-orientation"]).toBe("landscape");
      expect(parse(drawKyogijo({ sport, orientation: "auto" })).attrs["data-orientation"]).toBe("landscape");
      expect(parse(drawKyogijo({ sport })).attrs["data-orientation"]).toBe(sport === "curling" ? "portrait" : "landscape");
    });
  }

  it("refuses a sport it does not know", () => {
    expect(() => drawKyogijo({ sport: "kabaddi" as Sport })).toThrow(/Unknown sport/);
  });
});

describe("the football fields", () => {
  it("have 360 by 160 feet of NFL field, with a yard line every 5 yards between the goal lines", () => {
    const svg = parse(drawKyogijo({ sport: "nfl", margin: 0 }));
    expect(box(svg)).toEqual([0, 0, 360, 160]);
    const lines = withClass(svg, "ky-line").filter((n) => n.attrs.d?.startsWith("M45 0V160"));
    expect(lines).toHaveLength(1);
    expect((lines[0].attrs.d.match(/M/g) ?? []).length).toBe(19);
  });

  it("have a hash mark at every yard but those with a yard line, in the field of play only", () => {
    const svg = parse(drawKyogijo({ sport: "nfl", margin: 0 }));
    const hash = withClass(svg, "ky-line").find((n) => /^M31 /.test(n.attrs.d ?? "") === false && /M33 /.test(n.attrs.d ?? "") && n.attrs.d.includes("v2"));
    expect(hash).toBeDefined();
    const xs = [...hash!.attrs.d.matchAll(/M(\d+(?:\.\d+)?) /g)].map((m) => Number(m[1]));
    expect(Math.min(...xs)).toBeGreaterThan(30 - 1e-9);
    expect(Math.max(...xs)).toBeLessThan(330 + 1e-9);
  });

  it("number every ten yards, 50 in the middle", () => {
    const numbers = withClass(parse(drawKyogijo({ sport: "nfl" })), "ky-num");
    const labels = numbers.map((n) => n.text);
    expect(labels.filter((t) => t === "5" || t === "0").length).toBeGreaterThan(0);
    expect(labels.length).toBe(2 * (9 * 2 - 0));
  });

  it("put the CFL's posts on the goal lines and number its centre C", () => {
    const svg = parse(drawKyogijo({ sport: "cfl", margin: 0 }));
    expect(box(svg)).toEqual([0, 0, 450, 195]);
    expect(withClass(svg, "ky-num").some((n) => n.text === "C")).toBe(true);
    const post = withClass(svg, "ky-post")[0].attrs.d;
    expect(post.startsWith("M60 ")).toBe(true);
  });

  it("stand the IFAF's goal posts on the end lines", () => {
    const post = withClass(parse(drawKyogijo({ sport: "ifaf" })), "ky-post")[0].attrs.d;
    expect(Number(/^M(-?[\d.]+)/.exec(post)?.[1])).toBeLessThan(0);
  });

  it("colour the end zones by the teams' colours", () => {
    const svg = drawKyogijo(game("nfl"));
    expect(svg).toContain("--ky-left:#1f5fa8");
    expect(svg).toContain("--ky-right:#b5452c");
    expect(svg).toContain("ky-zone-left");
  });
});

describe("the NHL rink", () => {
  const svg = parse(drawKyogijo({ sport: "nhl", margin: 0 }));
  it("is 200 by 85 feet with five face-off circles, eight spots and two creases", () => {
    expect(box(svg)).toEqual([0, 0, 200, 85]);
    const circles = walk(svg).filter((n) => n.name === "circle");
    expect(circles.filter((n) => n.attrs.r === "15")).toHaveLength(5);
    expect(circles.filter((n) => n.attrs.class === "ky-red-fill")).toHaveLength(8);
    expect(withClass(svg, "ky-crease")).toHaveLength(2);
    expect(withClass(svg, "ky-net")).toHaveLength(2);
  });

  it("has the centre line, two blue lines 50 feet apart and goal lines 11 feet from the ends", () => {
    expect(withClass(svg, "ky-blue").find((n) => n.attrs.d === "M75 0V85M125 0V85")).toBeDefined();
    expect(withClass(svg, "ky-red").some((n) => n.attrs.d === "M100 0V85")).toBe(true);
    expect(withClass(svg, "ky-red").some((n) => /^M11 /.test(n.attrs.d ?? "") && /M189 /.test(n.attrs.d ?? ""))).toBe(true);
  });
});

describe("the NBA court", () => {
  const svg = parse(drawKyogijo({ sport: "nba", margin: 0 }));
  it("is 94 by 50 feet with two keys 16 feet wide and 19 feet long", () => {
    expect(box(svg)).toEqual([0, 0, 94, 50]);
    const keys = withClass(svg, "ky-key").filter((n) => n.name === "rect");
    expect(keys).toHaveLength(2);
    expect(keys[0].attrs).toMatchObject({ x: "0", y: "17", width: "19", height: "16" });
  });

  it("has two three-point lines whose corners are 3 feet from the sidelines", () => {
    const three = withClass(svg, "ky-line").find((n) => /^M0 3H14\.2A23\.75/.test(n.attrs.d ?? ""));
    expect(three).toBeDefined();
    expect(three!.attrs.d).toContain("M94 3H79.8A23.75");
  });
});

describe("the baseball field", () => {
  it("draws a different fence for each park", () => {
    // Parks whose published figures are the same (Tokyo Dome and Mizuho PayPay Dome, say) have the same fence.
    const fences = new Set(PARK_IDS.map((park) => withClass(parse(drawKyogijo({ sport: "mlb", park })), "ky-fence")[0].attrs.d));
    const figures = new Set(PARK_IDS.map((park) => JSON.stringify(PARKS[park].points)));
    expect(fences.size).toBe(figures.size);
    expect(fences.size).toBeGreaterThan(40);
  });

  it("draws a generic field without a park, and does not fail for an unknown one", () => {
    expect(drawKyogijo({ sport: "mlb", id: "p" })).toBe(drawKyogijo({ sport: "mlb", id: "p", park: "no-such-park" }));
  });

  it("draws the fence a park had in the season asked for, and its last fence for any other season", () => {
    const fence = (year?: number) => withClass(parse(drawKyogijo({ sport: "mlb", park: "polo-grounds", year })), "ky-fence")[0].attrs.d;
    expect(fence(1905)).not.toBe(fence(1915));
    expect(fence(1915)).not.toBe(fence());
    expect(fence(1930)).toBe(fence());
    expect(fence(1700)).toBe(fence());
    // A park with one fence, and a generic field, keep their fence in every season (the markings of the season are another matter: see eras.test.ts).
    const once = (park: string | undefined, year?: number) => withClass(parse(drawKyogijo({ sport: "mlb", id: "x", park, year })), "ky-fence")[0].attrs.d;
    expect(once("fenway-park", 1950)).toBe(once("fenway-park"));
    expect(once(undefined, 1950)).toBe(once(undefined));
  });

  it("takes fence distances over the park's", () => {
    const near = box(parse(drawKyogijo({ sport: "mlb", fence: { left: 300, right: 300 } })));
    const far = box(parse(drawKyogijo({ sport: "mlb", fence: { left: 360, right: 360 } })));
    expect(far[2]).toBeGreaterThan(near[2]);
  });

  it("stays in a fixed clip path of its own", () => {
    const svg = parse(drawKyogijo({ sport: "mlb", id: "park1" }));
    expect(walk(svg).filter((n) => n.name === "clipPath").map((n) => n.attrs.id)).toEqual(["park1-fair"]);
  });

  it("makes room for the teams above and below it in portrait, and beside the plate in landscape", () => {
    const bare = box(parse(drawKyogijo({ sport: "mlb", orientation: "portrait" })));
    const scored = box(parse(drawKyogijo(game("mlb", { orientation: "portrait" }))));
    expect(scored[3]).toBeGreaterThan(bare[3]);
  });
});

const NET_SPORTS: readonly string[] = ["tennis", "volleyball", "badminton", "pickleball", "tabletennis", "cricket"];

describe("a score", () => {
  it("writes both teams' names, the scores, the abbreviations and the status on the surface", () => {
    for (const sport of SPORTS) {
      const svg = parse(drawKyogijo(game(sport, { competition: "Cup Final, Game 7", date: "June 24" })));
      const text = walk(svg).filter((n) => n.name === "text").map((n) => n.text);
      // A long name may be set on two lines: the lines read as the name.
      const words = text.join(" ");
      expect(words, sport).toContain("HARBOUR");
      expect(words.replace(/\s+/g, " "), sport).toMatch(/HARBOUR (CITY )?(GULLS)?/);
      expect(words, sport).toContain("BISON");
      expect(text, sport).toContain("3");
      expect(text, sport).toContain("2");
      // The board of a net sport names the teams in full and has the abbreviations on its strip (the badge), where there is room for only them.
      if (!NET_SPORTS.includes(sport)) expect(text, sport).toContain("HCG");
      expect(text, sport).toContain("Cup Final, Game 7");
      expect(text, sport).toContain("Final · June 24");
    }
  });

  it("puts the away team on the left and the home team on the right, or the other way", () => {
    const svg = parse(drawKyogijo(game("nhl")));
    const names = withClass(svg, "ky-banner");
    expect(names[0].attrs["data-team"]).toBe("away");
    expect(parse(drawKyogijo(game("nhl", { homeSide: "left" }))).children.find((n) => n.name === "g")).toBeDefined();
    expect(withClass(parse(drawKyogijo(game("nhl", { homeSide: "left" }))), "ky-banner")[0].attrs["data-team"]).toBe("home");
  });

  it("emphasises the winner of a finished game, and of a game in play only when asked", () => {
    expect(parse(drawKyogijo(game("nhl"))).attrs["data-winner"]).toBe("away");
    expect(parse(drawKyogijo(game("nhl", { status: "live" }))).attrs["data-winner"]).toBe("none");
    expect(parse(drawKyogijo(game("nhl", { status: "live", winner: "leader" }))).attrs["data-winner"]).toBe("away");
    expect(parse(drawKyogijo(game("nhl", { winner: "home" }))).attrs["data-winner"]).toBe("home");
    expect(parse(drawKyogijo(game("nhl", { winner: "none" }))).attrs["data-winner"]).toBe("none");
  });

  it("emphasises nobody in a level game or when a score is not a number", () => {
    expect(winnerOf({ home: { name: "H", score: 2 }, away: { name: "A", score: 2 }, status: "final" })).toBe("none");
    expect(winnerOf({ home: { name: "H", score: "–" }, away: { name: "A", score: 2 }, status: "final" })).toBe("none");
    expect(winnerOf({ home: { name: "H", score: "4" }, away: { name: "A", score: 2 }, status: "Final/OT" })).toBe("home");
  });

  it("tints the loser and marks the winner with a bar", () => {
    const svg = parse(drawKyogijo(game("nba")));
    expect(withClass(svg, "ky-winbar")).toHaveLength(1);
    expect(withClass(svg, "ky-lose").length).toBeGreaterThan(0);
  });

  it("fills a missing score with a dash and a missing abbreviation from the name", () => {
    const svg = parse(drawKyogijo({ sport: "nhl", away: { name: "Harbour City Gulls" }, home: { name: "Prairie Ridge Bison" } }));
    const text = walk(svg).filter((n) => n.name === "text").map((n) => n.text);
    expect(text).toContain("HCG");
    expect(text.filter((t) => t === "–").length).toBeGreaterThanOrEqual(2);
  });

  it("draws a logo given by address or as SVG text, as an image", () => {
    const svg = parse(drawKyogijo(game("nfl", { away: { ...away, logo: "https://example.com/gulls.svg" }, home: { ...home, logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>' } })));
    const images = walk(svg).filter((n) => n.name === "image");
    expect(images.map((n) => n.attrs.href)[0]).toBe("https://example.com/gulls.svg");
    expect(images[1].attrs.href.startsWith("data:image/svg+xml")).toBe(true);
  });

  it("draws the badge as one strip and the compact size as the surface with that strip under it", () => {
    expect(box(parse(drawBadge(game("nhl"))))).toEqual([0, 0, 440, 64]);
    const compact = parse(drawKyogijo(game("nhl", { size: "compact" })));
    expect(withClass(compact, "ky-strip")).toHaveLength(1);
    expect(withClass(compact, "ky-plate")).toHaveLength(0);
    const bare = box(parse(drawKyogijo({ sport: "nhl" })));
    expect(box(compact)[3]).toBeGreaterThan(bare[3]);
  });

  it("is drawn by drawScore and drawSurface as by drawKyogijo", () => {
    expect(drawScore(game("nba"))).toBe(drawKyogijo(game("nba")));
    expect(drawSurface(game("nba"))).toBe(drawKyogijo({ sport: "nba", status: "final" }));
  });
});

describe("the words the drawing says", () => {
  it("title a score with the teams and the scores, and describe the surface and the result", () => {
    const { title, description } = describeDrawing(game("nhl", { competition: "Cup Final, Game 7", date: "June 24", status: "final-ot" }));
    expect(title).toBe("Harbour City Gulls 3, Prairie Ridge Bison 2, Final/OT");
    expect(description).toContain("Cup Final, Game 7");
    expect(description).toContain("Harbour City Gulls won.");
    expect(description).toContain("ice hockey rink");
  });

  it("say that a level game is level", () => {
    expect(describeDrawing(game("nhl", { home: { ...home, score: 3 } })).description).toContain("The game is level.");
  });

  it("name a park in the title and say the fence follows its figures", () => {
    const { title, description } = describeDrawing({ sport: "mlb", park: "fenway-park" });
    expect(title).toBe("Fenway Park, baseball field");
    expect(description).toContain("Fenway Park");
  });

  it("speak Japanese and name a Japanese park in Japanese", () => {
    expect(describeDrawing({ sport: "mlb", park: "tokyo-dome", language: "ja" }).title).toBe("東京ドームのグラウンド");
    expect(describeDrawing(game("nhl", { language: "ja" })).title).toBe("Harbour City Gulls 3、Prairie Ridge Bison 2、試合終了");
    expect(statusLabel("final-so", "ja")).toBe("試合終了（SO）");
    expect(statusLabel("Bottom 9th")).toBe("Bottom 9th");
    expect(statusLabel("  ")).toBeUndefined();
  });

  it("take the title and the description the caller gives", () => {
    const { title, description } = describeDrawing({ sport: "nba", title: "My court", description: "A court." });
    expect([title, description]).toEqual(["My court", "A court."]);
  });
});

describe("what comes from outside the package", () => {
  const hostile = '<script>alert(1)</script>"&\'';
  const svgText = drawKyogijo(game("nfl", {
    away: { name: hostile, abbr: hostile, score: hostile, color: "red;fill:url(javascript:1)", logo: "javascript:alert(1)" },
    home: { name: "Safe", color: "#112233", textColor: "red}</style><script>x</script>" },
    competition: hostile, date: hostile, label: undefined, status: hostile, title: hostile, description: hostile,
    className: 'x" onload="alert(1)', id: 'a" onload="b', width: "100%\" onload=\"x", colors: { surface: "red;background:url(x)" },
  }));

  it("stays well-formed with no script element and no event attribute", () => {
    const svg = parse(svgText);
    expect(walk(svg).some((n) => n.name === "script")).toBe(false);
    for (const n of walk(svg)) for (const key of Object.keys(n.attrs)) expect(key.startsWith("on"), `${n.name} ${key}`).toBe(false);
    expect(svgText).not.toContain("<script");
    expect(svgText).not.toContain("javascript:");
  });

  it("keeps text as text", () => {
    expect(svgText).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("ignores colours that are not colours", () => {
    expect(svgText).not.toContain("url(");
    expect(svgText).toContain("--ky-right:#112233");
    expect(svgText).not.toMatch(/--ky-left:red/);
  });

  it("draws no logo from an address it does not trust", () => {
    expect(parse(svgText).children.some((n) => n.name === "image")).toBe(false);
    expect(walk(parse(svgText)).filter((n) => n.name === "image")).toHaveLength(0);
  });
});

describe("the look", () => {
  it("writes the stylesheet into the drawing unless told not to, so that a saved file stands alone", () => {
    expect(walk(parse(drawKyogijo({ sport: "nhl" }))).some((n) => n.name === "style")).toBe(true);
    expect(walk(parse(drawKyogijo({ sport: "nhl", style: "none" }))).some((n) => n.name === "style")).toBe(false);
  });

  it("forces a theme with data-theme and leaves it to the device otherwise", () => {
    expect(parse(drawKyogijo({ sport: "nhl", theme: "dark" })).attrs["data-theme"]).toBe("dark");
    expect(parse(drawKyogijo({ sport: "nhl" })).attrs["data-theme"]).toBeUndefined();
  });

  it("sets the colours the options give as custom properties on the root", () => {
    const svg = parse(drawKyogijo({ sport: "nfl", colors: { surface: "#123456", plate: "rgba(0,0,0,.5)" }, leftColor: "#ffd23f" }));
    expect(svg.attrs.style).toContain("--ky-surface:#123456");
    expect(svg.attrs.style).toContain("--ky-plate:rgba(0,0,0,.5)");
    expect(svg.attrs.style).toContain("--ky-left:#ffd23f");
    expect(svg.attrs.style).toContain("--ky-left-ink:#161a18");
  });

  it("gives each part a name when asked, for styling inside a shadow root", () => {
    const svg = parse(drawKyogijo(game("nhl", { parts: true })));
    expect(svg.attrs.part).toBe("svg");
    expect(withClass(svg, "ky-plate")[0].attrs.part).toBe("plate");
    expect(withClass(svg, "ky-banner")[0].attrs.part).toBe("team away");
    expect(withClass(parse(drawKyogijo(game("nhl"))), "ky-plate")[0].attrs.part).toBeUndefined();
  });

  it("styles the court from its own theme", () => {
    const svg = parse(drawKyogijo({ sport: "nba", court: { wood: "#bb8844", key: "#223355", keyLeft: "#aa2233", border: "#111", baselineText: "HARBOUR CITY", paintThreePoint: true } }));
    expect(svg.attrs.style).toContain("--ky-surface:#bb8844");
    expect(svg.attrs.style).toContain("--ky-key-left:#aa2233");
    expect(walk(svg).some((n) => n.name === "text" && n.text === "HARBOUR CITY")).toBe(true);
    expect(withClass(svg, "ky-key").filter((n) => n.name === "path")).toHaveLength(2);
  });
});
