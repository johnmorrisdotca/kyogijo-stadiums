// The real set: every emblem of @johnmorrisdotca/dougu-sports (a development dependency, never a runtime one) through the safe path and into a drawing.
import { EMBLEM_IDS, SPORT_NAMES, emblemInfo, renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { useEmblems } from "./emblems-source.ts";
import { safeLogo } from "./logo.ts";

const decode = (href: string): string => decodeURIComponent(href.slice(href.indexOf(",") + 1));
const UNSAFE = /<script|<foreignObject|<image|<a[\s>]|<iframe|\son[a-z]+\s*=|javascript:|data:|https?:|url\((?!#)|@import|<!\[CDATA/i;
const team = (logo: string, color = "#c8102e") => ({ name: "Harbour City Gulls", abbr: "HCG", score: 3, color, logo });

beforeEach(() => useEmblems(renderEmblem));
afterEach(() => useEmblems(undefined));

describe("Dougu Sports plugged in", () => {
  it("has an icon for every sport the package draws", () => {
    // The dojo is a room for every budo, not a sport of its own in Dougu Sports: its icon is the judo one (`sport:judo`), the budo a dojo is most often built for and whose mats it is drawn with. The four combat sports
    // (MMA, boxing, wrestling, professional wrestling) have icons of their own since Dougu Sports 0.13.0.
    const icon = (sport: string): string => (sport === "dojo" ? "judo" : sport);
    for (const sport of SPORTS) expect(SPORT_NAMES, sport).toContain(icon(sport));
    // And the combat sports do not borrow a suit's.
    const own = ["mma", "boxing", "wrestling", "prowrestling"].map((sport) => renderEmblem(`sport:${sport}` as never));
    expect(new Set([...own, renderEmblem("sport:judo"), renderEmblem("sport:karate")]).size).toBe(6);
  });

  it("every emblem is an image that holds the emblem and nothing that runs", () => {
    for (const id of EMBLEM_IDS) {
      const href = safeLogo(id) as string;
      expect(href.startsWith("data:image/svg+xml;charset=utf-8,"), id).toBe(true);
      const svg = decode(href);
      expect(svg).toContain(`<title>${emblemInfo(id).en}</title>`);
      // A credit in <desc> may name its source's address; nothing else may hold one.
      expect(svg.replace(/<desc>[^<]*<\/desc>/g, "").replace(' xmlns="http://www.w3.org/2000/svg"', "")).not.toMatch(UNSAFE);
    }
  });

  it("a crest takes the team's colours and letters, a short name and a style work, and an address is an address", () => {
    expect(decode(safeLogo("crest:shield", { color: "#c8102e", accent: "#f4f0e4", initials: "HCG" }) as string)).toContain(">HCG<");
    expect(decode(safeLogo("cup/line") as string)).toContain('stroke="currentColor"');
    expect(safeLogo("logos/a.svg")).toBe("logos/a.svg");
    expect(safeLogo("trophy:nope")).toBeUndefined();
  });

  it("draws a score with a crest, a trophy and a pageant emblem", () => {
    const svg = drawKyogijo({ sport: "soccer", away: team("crest:shield"), home: team("trophy:hockey-cup", "#1f5fa8"), status: "final", pageant: { style: "stage", emblem: "trophy:soccer-ball" } });
    expect(svg).toContain(encodeURIComponent(">HCG<"));
    expect(svg).toContain(encodeURIComponent(`<title>${emblemInfo("trophy:soccer-ball").en}</title>`));
  });
});
