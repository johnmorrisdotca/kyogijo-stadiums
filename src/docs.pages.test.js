// The documentation pages held to what they promise: every Markdown page is in the contents, every link between pages (and from the README) goes
// somewhere that exists, the site built from them has every page, a search index with every heading, no id twice on a page, and every link
// in the built HTML ends at an id that is there; and the gallery is made from code that runs, with a picture for every surface, league, season,
// layer, heat layer, chart and frame. Plain JavaScript, so that reading files needs no Node types.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, posix, resolve } from "node:path";
import { Marked } from "marked";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cdnUrl, framesBlockHtml, framesFiles, framesItems, galleryData, galleryPageHtml, libraryFrom, literal, runSnippet } from "../scripts/docs-gallery.mjs";
import { NAV, PAGE_LIST, buildDocs, fileOf, headingsOf, readPages, resolveLink, slugOf } from "../scripts/docs-pages.mjs";

const MAIN = "@johnmorrisdotca/kyogijo";
const lib = await libraryFrom(resolve("src"), ".ts", (file) => import(/* @vite-ignore */ file));
const style = lib[MAIN].KYOGIJO_STYLE;
const known = { root: resolve("."), pages: new Set(PAGE_LIST.map((page) => page.slug)) };
const read = (path) => readFileSync(path, "utf8");

/** Every link and image address in a Markdown text, by its tokens. */
function linksOf(markdown) {
  const out = [];
  const walk = (tokens) => {
    for (const token of tokens ?? []) {
      if (token.type === "link" || token.type === "image") out.push(token.href);
      walk(token.tokens);
      if (token.type === "list") for (const item of token.items) walk(item.tokens);
      if (token.type === "table") {
        for (const cell of token.header) walk(cell.tokens);
        for (const row of token.rows) for (const cell of row) walk(cell.tokens);
      }
    }
  };
  walk(new Marked({ gfm: true }).lexer(markdown));
  return out;
}

describe("the contents", () => {
  it("lists every Markdown page of docs/ once, and every page it lists is a file or is made by the build", () => {
    const listed = PAGE_LIST.filter((page) => !page.site).map((page) => fileOf(page.slug).replace(/^docs\//, ""));
    const files = readdirSync("docs").filter((file) => file.endsWith(".md"));
    expect(listed.sort()).toEqual(files.sort());
    expect(new Set(PAGE_LIST.map((page) => page.slug)).size).toBe(PAGE_LIST.length);
    for (const page of PAGE_LIST) expect(page.ja, page.slug).toMatch(/[぀-ヿ一-鿿]/u);
    for (const group of NAV) expect(group.ja, group.id).toMatch(/[぀-ヿ一-鿿]/u);
  });

  it("gives every page one title and unique heading ids", () => {
    for (const page of readPages()) {
      expect(page.headings.filter((heading) => heading.depth === 1), page.file).toHaveLength(1);
      const ids = page.headings.map((heading) => heading.id);
      expect(new Set(ids).size, `${page.file}: a heading id is used twice`).toBe(ids.length);
    }
  });

  it("makes heading ids as GitHub does", () => {
    expect(slugOf("What's in it")).toBe("whats-in-it");
    expect(slugOf("1. A string of SVG")).toBe("1-a-string-of-svg");
    expect(slugOf("The surfaces through the years (eraChanges)")).toBe("the-surfaces-through-the-years-erachanges");
    expect(headingsOf("# A\n\n## Same\n\n## Same\n").map((heading) => heading.id)).toEqual(["a", "same", "same-1"]);
  });
});

describe("the links of the README and of every page", () => {
  const readme = read("README.md");
  const sources = [{ file: "README.md", markdown: readme }, ...readPages().map((page) => ({ file: page.file, markdown: page.markdown }))];
  const headings = new Map([["README.md", headingsOf(readme).map((heading) => heading.id)], ...readPages().map((page) => [page.file, page.headings.map((heading) => heading.id)])]);
  const made = galleryData(lib).map((one) => galleryPageHtml(one, style));
  const madeIds = new Map(made.map((page) => [page.slug, page.headings.map((heading) => heading.id)]));

  for (const { file, markdown } of sources) {
    it(`${file}: every link resolves, and every anchor is a heading`, () => {
      const bad = [];
      for (const href of linksOf(markdown)) {
        const found = resolveLink(file, href, known);
        if (found.kind === "error") {
          bad.push(`${href}: ${found.error}`);
          continue;
        }
        const anchor = found.anchor ?? (href.includes("#") ? href.split("#")[1] : "");
        if (anchor === "" || anchor === undefined) continue;
        if (found.kind === "anchor") {
          if (!headings.get(file).includes(anchor)) bad.push(`${href}: no such heading in ${file}`);
        } else if (found.kind === "page") {
          const target = fileOf(found.slug);
          const ids = target === null ? madeIds.get(found.slug) : headings.get(target);
          if (!ids.includes(anchor)) bad.push(`${href}: no heading "${anchor}" in ${found.slug}`);
        } else if (found.repo === true && !headings.get("README.md").includes(anchor)) bad.push(`${href}: no heading "${anchor}" in the README`);
      }
      expect(bad, `broken links in ${file}`).toEqual([]);
    });
  }

  it("catches a link that goes nowhere", () => {
    expect(resolveLink("docs/soccer.md", "./nowhere.md", known).kind).toBe("error");
    expect(resolveLink("docs/soccer.md", "../NOTHING.md", known).kind).toBe("error");
    expect(resolveLink("docs/soccer.md", "./frames.md#x", known)).toMatchObject({ kind: "page", url: "frames.html#x" });
    expect(resolveLink("docs/soccer.md", "../CHANGELOG.md", known).url).toBe("https://github.com/johnmorrisdotca/kyogijo/blob/main/CHANGELOG.md");
    expect(resolveLink("docs/soccer.md", "https://johnmorrisdotca.github.io/kyogijo/api.html#x", known).url).toBe("../api.html#x");
    expect(resolveLink("docs/soccer.md", "https://johnmorrisdotca.github.io/kyogijo/docs/gallery-data.html", known).kind).toBe("page");
    expect(resolveLink("docs/soccer.md", "https://johnmorrisdotca.github.io/kyogijo/docs/gallery-nothing.html", known).kind).toBe("error");
  });
});

describe("the docs site built from the pages", () => {
  const out = resolve(".cache", "docs-site");
  let result;
  let pages;
  beforeAll(() => {
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    pages = galleryData(lib).map((one) => galleryPageHtml(one, style));
    result = buildDocs({ root: resolve("."), outDir: out, icon: "data:,", extraPages: pages, siteBlocks: { frames: framesBlockHtml(lib, style) }, files: framesFiles(lib) });
  });
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it("has a page for every page of the contents, and a search index with every title and heading", () => {
    expect(readdirSync(out).filter((file) => file.endsWith(".html")).sort()).toEqual(PAGE_LIST.map((page) => `${page.slug}.html`).sort());
    const index = read(join(out, "search-index.js"));
    const rows = JSON.parse(index.slice(index.indexOf("= ") + 2, index.indexOf(";\n")));
    expect(rows).toHaveLength(result.entries);
    for (const page of readPages()) {
      for (const heading of page.headings) expect(rows.some((row) => row[1] === (heading.depth === 1 ? `${page.slug}.html` : `${page.slug}.html#${heading.id}`) && row[0] === heading.text), `${page.file}: ${heading.text}`).toBe(true);
    }
    for (const page of pages) for (const heading of page.headings.filter((one) => one.depth > 1)) expect(rows.some((row) => row[1] === `${page.slug}.html#${heading.id}`), `${page.slug}: ${heading.text}`).toBe(true);
  });

  it("has no id twice on a page, and every link to a page or a heading of the site ends at one", () => {
    const html = new Map(readdirSync(out).filter((file) => file.endsWith(".html")).map((file) => [file, read(join(out, file))]));
    const ids = new Map([...html].map(([file, text]) => [file, [...text.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])]));
    for (const [file, list] of ids) {
      const seen = new Set();
      const twice = list.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
      expect(twice, `${file}: an id is used twice`).toEqual([]);
    }
    const bad = [];
    for (const [file, text] of html) {
      for (const match of text.matchAll(/<a\s[^>]*href="([^"]*)"/g)) {
        const href = match[1].replace(/&amp;/g, "&");
        if (/^(https?:|mailto:|\.\.\/)/.test(href)) continue;
        // A gallery item's own files (its SVG and its page): they are files, and each is there.
        if (href.startsWith("gallery/")) {
          if (!existsSync(join(out, href))) bad.push(`${file}: ${href} is not written`);
          continue;
        }
        const [path, anchor] = href.split("#");
        const target = path === "" ? file : path === "./" ? "index.html" : posix.normalize(path);
        if (!html.has(target) && !/\.(svg|png|webp|css|js)$/.test(target)) bad.push(`${file}: ${href} is no page`);
        else if (anchor !== undefined && anchor !== "" && html.has(target) && !ids.get(target).includes(anchor)) bad.push(`${file}: ${href} has no such id`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("puts a title, a search box, the contents and a pager on each page, and a copy button on each block of code in the script", () => {
    const sample = read(join(out, "soccer.html"));
    expect(sample).toContain('data-testid="docs-search"');
    expect(sample).toContain('data-testid="docs-nav"');
    expect(sample).toContain('class="docs-pager"');
    expect(sample).toContain('rel="prev"');
    expect(sample).toContain('rel="next"');
    expect(read(join(out, "docs.js"))).toContain("docs-copy");
    expect((read(join(out, "index.html")).match(/<h1\b/g) ?? []).length).toBe(2);
  });
});

describe("the gallery", () => {
  const data = galleryData(lib);
  const items = data.flatMap((page) => page.sections.flatMap((one) => one.items));
  const codes = items.map((entry) => entry.code).join("\n");

  it("draws every picture by running the code shown beside it", () => {
    for (const entry of items) {
      expect(entry.svg.startsWith("<svg"), entry.id).toBe(true);
      expect(runSnippet(entry.code, lib), entry.id).toBe(entry.svg);
    }
    const ids = items.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has every surface, every league, a season of every sport that has years, every layer kind, every heat kind and every chart", () => {
    for (const sport of lib[MAIN].SPORTS) expect(codes, sport).toContain(`sport: "${sport}"`);
    for (const sport of ["nba", "nhl", "nfl", "mlb", "volleyball"]) for (const league of lib[`${MAIN}/leagues`].LEAGUES[sport]) if (!league.builtIn) expect(items.some((entry) => entry.id === `league-${sport}-${league.id}`), `${sport} ${league.id}`).toBe(true);
    for (const sport of lib[`${MAIN}/eras`].ERA_SPORTS) expect(items.some((entry) => entry.id.startsWith(`year-${sport}-`)), sport).toBe(true);
    for (const kind of ["points", "lines", "arrows", "text", "heatmap", "hexbin", "zones", "contour", "legend", "network", "formation", "voronoi", "delaunay", "hull", "flow", "sonar"]) expect(codes, kind).toContain(`kind: "${kind}"`);
    for (const chart of ["nbaShotChart", "nhlShotMap", "mlbSprayChart", "nflPassChart", "soccerShotMap", "passNetwork"]) expect(codes, chart).toContain(`${chart}(`);
    for (const name of Object.keys(lib[MAIN].COURT_THEMES)) expect(codes, name).toContain(`COURT_THEMES.${name}`);
    for (const name of Object.keys(lib[MAIN].SOCCER_PITCHES)) expect(items.some((entry) => entry.id === `pitch-${name}`), name).toBe(true);
    expect(items.some((entry) => /park: "(polo-grounds|ebbets-field)"/.test(entry.code))).toBe(true);
    expect(items.some((entry) => entry.code.includes("ground: "))).toBe(true);
  });

  it("draws the same spot in every frame, each frame once", () => {
    const frames = framesItems(lib);
    expect(frames.map((entry) => entry.id).sort()).toEqual(Object.keys(lib[`${MAIN}/frames`].FRAMES).map((name) => `frame-${name}`).sort());
    for (const entry of frames) expect(runSnippet(entry.code, lib).startsWith("<svg"), entry.id).toBe(true);
  });

  it("writes each page with a copy button and its code for every picture, and the stylesheet once", () => {
    for (const page of data) {
      const made = galleryPageHtml(page, style);
      const count = page.sections.reduce((sum, one) => sum + one.items.length, 0);
      expect((made.html.match(/data-testid="gallery-copy"/g) ?? []).length, page.slug).toBe(count);
      expect((made.html.match(/<pre id="code-/g) ?? []).length, page.slug).toBe(count);
      expect(made.html.split(style.slice(0, 80)).length - 1, `${page.slug}: the base stylesheet is in the page once`).toBe(1);
    }
  });

  it("has a page of layouts and backgrounds that shows every preset, every pattern, a key, a chart, a photograph and Japanese", () => {
    const page = data.find((one) => one.slug === "gallery-layouts");
    expect(page).toBeDefined();
    const text = page.sections.flatMap((one) => one.items).map((entry) => entry.code).join("\n");
    for (const preset of Object.keys(lib[`${MAIN}/layouts`].GRID_PRESETS)) expect(text, preset).toContain(`preset: "${preset}"`);
    for (const pattern of lib[`${MAIN}/layouts`].BACKGROUND_PATTERNS) expect(page.sections.flatMap((one) => one.items).some((entry) => entry.id === `bg-${pattern}`), pattern).toBe(true);
    for (const word of ["legend:", "nbaShotChart(", "image: photo", 'language: "ja"', 'theme: "dark"', "columns: 3"]) expect(text, word).toContain(word);
  });

  it("gives every item a download of its drawing and a page that draws it from the published package", () => {
    for (const page of data) {
      const made = galleryPageHtml(page, style);
      const count = page.sections.reduce((sum, one) => sum + one.items.length, 0);
      expect((made.html.match(/data-testid="gallery-download"/g) ?? []).length, page.slug).toBe(count);
      expect((made.html.match(/data-testid="gallery-open"/g) ?? []).length, page.slug).toBe(count);
      expect(made.files, page.slug).toHaveLength(count * 2);
      expect(made.html, "it says that only published versions are served").toContain("serves only released versions");
      for (const entry of page.sections.flatMap((one) => one.items)) {
        expect(made.html).toContain(`href="gallery/${entry.id}.svg" download="${entry.id}.svg"`);
        expect(made.html).toContain(`href="gallery/${entry.id}.html"`);
        // The download is the whole drawing, stylesheet and all, and stands alone.
        expect(made.files.find((file) => file.path === `gallery/${entry.id}.svg`).content).toBe(`${entry.svg}\n`);
        expect(entry.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      }
    }
  });

  it("writes each page as one HTML file that imports the published major version from jsDelivr, runs the snippet and keeps the build's picture", async () => {
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
    const runs = [];
    for (const page of data) {
      const made = galleryPageHtml(page, style);
      for (const entry of page.sections.flatMap((one) => one.items)) {
        const html = made.files.find((file) => file.path === `gallery/${entry.id}.html`).content;
        expect(html.startsWith("<!doctype html>"), entry.id).toBe(true);
        expect(html).toContain(entry.svg);
        expect(html).not.toMatch(/<script src|<link [^>]*href="http|@import/);
        const script = /<script type="module">\n([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
        expect(script, entry.id).not.toMatch(/^\s*import\s*\{/m);
        for (const [, from] of entry.code.matchAll(/from "([^"]+)"/g)) expect(script, `${entry.id} ${from}`).toContain(JSON.stringify(cdnUrl(from, "0")));
        // Run it against the source, with the CDN's address answered by the module it stands for, and see the same picture.
        const seen = {};
        const document = { getElementById: (id) => (seen[id] ??= { textContent: "", innerHTML: "" }) };
        const run = new AsyncFunction("document", "__import", script.replaceAll("await import(", "await __import("));
        runs.push(run(document, (url) => {
          const key = Object.keys(lib).find((name) => cdnUrl(name, "0") === url);
          if (key === undefined) throw new Error(`no module for ${url}`);
          return lib[key];
        }).then(() => {
          expect(seen.art.innerHTML, entry.id).toBe(entry.svg);
          expect(seen.status.textContent).toContain("published package");
        }));
      }
    }
    expect(runs.length).toBeGreaterThan(300);
    await Promise.all(runs);
  });

  it("names the CDN's address of the package and of an entry, for a major version", () => {
    expect(cdnUrl(MAIN, "0")).toBe("https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo@0/+esm");
    expect(cdnUrl(`${MAIN}/charts`, "1")).toBe("https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo@1/charts/+esm");
  });

  it("says what a page does when the published package has no such feature", async () => {
    const entry = data[0].sections[0].items[0];
    const html = galleryPageHtml({ ...data[0], sections: [{ ...data[0].sections[0], items: [entry] }] }, style).files.find((file) => file.path.endsWith(".html")).content;
    const script = /<script type="module">\n([\s\S]*?)<\/script>/.exec(html)[1];
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
    const seen = {};
    const document = { getElementById: (id) => (seen[id] ??= { textContent: "", innerHTML: "kept" }) };
    await new AsyncFunction("document", "__import", script.replaceAll("await import(", "await __import("))(document, () => Promise.reject(new Error("404")));
    expect(seen.art.innerHTML).toBe("kept");
    expect(seen.status.textContent).toMatch(/could not draw this: 404/);
  });

  it("writes JavaScript for a value", () => {
    expect(literal({ a: 1, "b-c": [1, 2], d: { e: "x" } })).toBe('{ a: 1, "b-c": [1, 2], d: { e: "x" } }');
    expect(runSnippet(`import { drawKyogijo } from "${MAIN}";\nconst svg = drawKyogijo(${literal({ sport: "nhl" })});`, lib)).toBe(lib[MAIN].drawKyogijo({ sport: "nhl" }));
    expect(() => runSnippet("const svg = 1;", lib)).toThrow(/SVG string/);
  });
});
