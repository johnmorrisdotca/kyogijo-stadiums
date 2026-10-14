// How kyogijo takes an emblem's id wherever it takes a logo, a flag or a mark, with a small renderer of its own making: the plug-in, the safe path, the context a crest is given and
// every place that reads a logo. No emblem art is in this package; the real set is tried in emblems.dougu.test.ts.
import { afterEach, describe, expect, it, vi } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { useEmblems, type EmblemDrawOptions, type EmblemRenderer } from "./emblems-source.ts";
import { drawLayers } from "./layers.ts";
import { emblemDocument, safeLogo } from "./logo.ts";

const NAMES: Record<string, string> = {
  "trophy:cup": "Cup",
  "trophy:hockey-cup": "Hockey cup",
  "trophy:soccer-ball": "Soccer ball trophy",
  "medal:gold": "Gold medal",
  "sport:nhl": "NHL",
  "sport:curling": "Curling",
  "crest:shield": "Shield",
  "crest:roundel": "Roundel",
  "crest:diamond": "Diamond",
  "crest:pennant": "Pennant",
};
const ALIASES: Record<string, string> = { cup: "trophy:cup" };
const calls: Array<[string, EmblemDrawOptions | undefined]> = [];

/** A renderer the way dougu-sports' is: an id, a short name or either with a style; an unknown one throws. */
const fake: EmblemRenderer = (ref, options) => {
  calls.push([ref, options]);
  const [name, style] = ref.split("/");
  const id = ALIASES[name] ?? name;
  if (!(id in NAMES) || (style !== undefined && !["metal", "line", "color"].includes(style))) throw new Error(`Unknown emblem "${ref}"`);
  const ink = style === "line" ? ' stroke="currentColor" fill="none"' : "";
  const letters = id.startsWith("crest:") ? `<text fill="${options?.tint ?? "#888"}" stroke="${options?.accent ?? "none"}">${options?.initials ?? ""}</text>` : "";
  const scheme = options?.theme === "auto" ? "<style>@media(prefers-color-scheme:dark){svg{color:#eef1f3}}</style>" : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"${ink}><title>${NAMES[id]}</title>${scheme}${letters}</svg>`;
};

const decode = (href: string): string => decodeURIComponent(href.slice(href.indexOf(",") + 1));
const UNSAFE = /<script|<foreignObject|<image|<a[\s>]|<iframe|\son[a-z]+\s*=|javascript:|data:|https?:|url\((?!#)|@import|<!\[CDATA/i;
const team = (logo: string, color = "#c8102e") => ({ name: "Harbour City Gulls", abbr: "HCG", score: 3, color, logo });

afterEach(() => {
  useEmblems(undefined);
  calls.length = 0;
  vi.restoreAllMocks();
});

describe("without a renderer", () => {
  it("an id is an address like any other: refused when it has a scheme, a relative path when it is a bare word", () => {
    for (const id of ["trophy:cup", "crest:shield", "medal:gold/line", "sport:nhl"]) expect(safeLogo(id), id).toBeUndefined();
    for (const word of ["cup", "cups", "trophy", "a.svg"]) expect(safeLogo(word), word).toBe(word);
    expect(emblemDocument("trophy:cup")).toBeUndefined();
  });

  it("says so once, in development, and not again", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    safeLogo("crest:shield");
    safeLogo("trophy:cup");
    safeLogo("https://example.com/a.svg");
    const told = warn.mock.calls.length;
    expect(told).toBeLessThanOrEqual(1);
    if (told === 1) {
      expect(String(warn.mock.calls[0][0])).toContain("useEmblems(renderEmblem)");
      expect(String(warn.mock.calls[0][0])).toContain("@johnmorrisdotca/dougu-sports/emblems");
    }
  });

  it("draws a team whose logo is an id as a team with no logo", () => {
    const svg = drawKyogijo({ sport: "nhl", away: team("crest:shield"), home: team("trophy:cup"), status: "final" });
    expect(svg).not.toContain("data:image/svg+xml");
    expect(svg).toContain("<svg");
  });
});

describe("the safe path with a renderer plugged in", () => {
  it("turns an id into an image address that holds the emblem and nothing that runs", () => {
    useEmblems(fake);
    for (const id of Object.keys(NAMES)) {
      const href = safeLogo(id) as string;
      expect(href.startsWith("data:image/svg+xml;charset=utf-8,"), id).toBe(true);
      const svg = decode(href);
      expect(svg).toContain(`<title>${NAMES[id]}</title>`);
      expect(svg.replace(' xmlns="http://www.w3.org/2000/svg"', "")).not.toMatch(UNSAFE);
    }
  });

  it("takes a short name and a style, and the theme the drawing is in", () => {
    useEmblems(fake);
    expect(decode(safeLogo("cup/line") as string)).toContain('stroke="currentColor"');
    expect(calls.at(-1)?.[0]).toBe("cup/line");
    expect(decode(safeLogo("trophy:cup") as string)).toBe(emblemDocument("trophy:cup"));
    expect(calls.at(-1)?.[1]?.theme).toBe("auto");
    safeLogo("trophy:cup", { theme: "dark" });
    expect(calls.at(-1)?.[1]?.theme).toBe("dark");
  });

  it("gives a crest the team's colours and letters, and nothing else", () => {
    useEmblems(fake);
    const svg = decode(safeLogo("crest:shield", { color: "#c8102e", accent: "#f4f0e4", initials: "HCG" }) as string);
    expect(svg).toContain("#c8102e");
    expect(svg).toContain(">HCG<");
    expect(decode(safeLogo("sport:nhl", { color: "#c8102e", initials: "HCG" }) as string)).not.toContain("HCG");
    expect(calls.at(-1)?.[1]).toEqual({ theme: "auto" });
  });

  it("still takes an address, a data address, an SVG document and a relative path exactly as before, and refuses what it did", () => {
    useEmblems(fake);
    for (const ok of ["https://example.com/a.svg", "/logos/a.svg", "logos/a.svg", "a.svg", "data:image/png;base64,AAAA", "cups", "trophy"]) expect(safeLogo(ok), ok).toBe(ok);
    expect(safeLogo('<svg xmlns="http://www.w3.org/2000/svg"><circle r="1"/></svg>')).toContain("data:image/svg+xml;charset=utf-8,");
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>1</script>", 'trophy:cup"onload="x', "trophy:nope", "crest:hex", "sport:", 4, null]) expect(safeLogo(bad), String(bad)).toBeUndefined();
  });

  it("asks the renderer only for what looks like an id, and refuses what a renderer gives that is not a picture", () => {
    useEmblems(fake);
    safeLogo("https://example.com/a.svg");
    safeLogo("logos/a.svg");
    safeLogo("javascript:alert(1)");
    expect(calls).toHaveLength(0);
    useEmblems(() => "not an svg");
    expect(safeLogo("trophy:cup")).toBeUndefined();
  });

  it("can be unplugged", () => {
    useEmblems(fake);
    expect(safeLogo("trophy:cup")).toContain("data:image/svg+xml");
    useEmblems(undefined);
    expect(safeLogo("trophy:cup")).toBeUndefined();
  });
});

describe("the emblems option of one drawing", () => {
  it("plugs a renderer in for that drawing alone", () => {
    const svg = drawKyogijo({ sport: "nhl", away: team("crest:shield"), home: team("trophy:cup"), status: "final", emblems: fake });
    expect(svg).toContain(encodeURIComponent("<title>Cup</title>"));
    expect(safeLogo("trophy:cup")).toBeUndefined();
    const plain = drawKyogijo({ sport: "nhl", away: team("crest:shield"), home: team("trophy:cup"), status: "final" });
    expect(plain).not.toContain("data:image/svg+xml");
  });

  it("goes before the page's own, and puts it back, even when the drawing fails", () => {
    const other: EmblemRenderer = (ref, o) => fake(ref, o).replace("<title>", "<title>Other ");
    useEmblems(other);
    expect(drawKyogijo({ sport: "nhl", away: team("trophy:cup"), home: team("trophy:cup"), status: "final", emblems: fake })).not.toContain(encodeURIComponent("<title>Other "));
    expect(decode(safeLogo("trophy:cup") as string)).toContain("<title>Other Cup");
    expect(() => drawKyogijo({ sport: "nope" as never, emblems: fake })).toThrow();
    expect(decode(safeLogo("trophy:cup") as string)).toContain("<title>Other Cup");
  });
});

describe("everywhere a logo is taken", () => {
  it("a team's logo is an id", () => {
    useEmblems(fake);
    const svg = drawKyogijo({ sport: "nhl", away: team("crest:shield"), home: { ...team("trophy:cup"), name: "Lakeshore Anchors", abbr: "LSA", color: "#0f7a7a" }, status: "final" });
    expect(svg).toContain("data:image/svg+xml");
    expect(svg).toContain(encodeURIComponent(">HCG<"));
    expect(svg).toContain(encodeURIComponent("<title>Cup</title>"));
  });

  it("is a round mark, a compact card, a badge and a pageant stage", () => {
    useEmblems(fake);
    for (const extra of [{ markShape: "round" as const }, { size: "compact" as const }, { size: "badge" as const }, { pageant: "stage" as const }, { pageant: "carpet" as const }]) {
      const svg = drawKyogijo({ sport: "soccer", away: team("crest:roundel"), home: team("crest:diamond", "#1f5fa8"), status: "final", ...extra });
      expect(svg, JSON.stringify(extra)).toContain("data:image/svg+xml");
      expect(svg).not.toMatch(/data:image\/svg\+xml[^"]*%3Cscript/i);
    }
  });

  it("the pageant's emblem is an id, as a round emblem and a plain one", () => {
    useEmblems(fake);
    for (const shape of ["round", "plain"] as const) {
      const svg = drawKyogijo({ sport: "soccer", away: team("crest:shield"), home: team("crest:pennant", "#1f5fa8"), status: "final", pageant: { style: "stage", emblem: "trophy:soccer-ball", emblemShape: shape, emblemName: "Cup" } });
      expect(svg).toContain(encodeURIComponent("<title>Soccer ball trophy</title>"));
    }
  });

  it("a team with no logo of its own can be given a sport's icon, and a crest is a square for the carpet", () => {
    useEmblems(fake);
    const svg = drawKyogijo({ sport: "nhl", away: team("sport:nhl/line"), home: team("sport:curling"), status: "final", pageant: "carpet" });
    expect(svg).toContain("data:image/svg+xml");
  });

  it("a layer's mark", () => {
    useEmblems(fake);
    const layers = drawLayers({ sport: "nhl" }, [{ kind: "points", id: "p", name: "Cups", data: [{ x: 0, y: 0, shape: "logo", logo: "trophy:cup" }] }]);
    expect(layers).toContain(encodeURIComponent("<title>Cup</title>"));
  });
});
