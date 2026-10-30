// The documentation site: docs/*.md as pages of the demo site (site/docs/), made by `pnpm site`. Every page has the family's header
// and footer, a contents with the pages in groups, a search box over the titles and headings of every page (plain JavaScript,
// built from the pages themselves), the pages before and after, and a copy button on every block of code. The Markdown is read
// with `marked`, a development dependency of this package alone; nothing here is in the package. A page that no Markdown file
// holds (the gallery) is made by scripts/docs-gallery.mjs from the code and passed in.
//
//   import { buildDocs } from "./docs-pages.mjs";
//   await buildDocs({ root, outDir: "site/docs", id: "kyogijo-stadiums", name: "Kyogijo Stadiums", icon, version, siteBlocks, extraPages });
//
// What a link in a Markdown page may be (`resolveLink` says, and a test holds every page to it): another page of docs/ (`./soccer.md#data-providers`),
// a heading of the same page (`#units`), a file of the repository (`../CHANGELOG.md`, shown as its page on GitHub), the demo or its API page by their
// address on GitHub Pages (kept relative on the site), the README by `../README.md#anchor`, a page of the gallery by its address, or any other https address.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import process from "node:process";

import { Marked } from "marked";

import { DOCS_CSS, DOCS_JS } from "./docs-assets.mjs";
import { NAV, NAV_WORDS, PLACES, SPORTS } from "./docs-nav.mjs";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";
import { iconLinks } from "./icon-links.mjs";
import { RELEASE_PAGE, firstPaintHead, sayEnglish } from "./first-paint.mjs";

export const SITE_ORIGIN = "https://johnmorrisdotca.github.io/kyogijo-stadiums/";
export const REPO = "https://github.com/johnmorrisdotca/kyogijo-stadiums";

export { NAV };

/** Every page of the contents, in order. */
export const PAGE_LIST = NAV.flatMap((group) => group.pages.map((page) => ({ ...page, group: group.id })));

/** The Markdown file of a page, relative to the repository, or `null` for a page the build makes from code. */
export const fileOf = (slug) => (PAGE_LIST.find((page) => page.slug === slug)?.site ? null : slug === "index" ? "docs/README.md" : `docs/${slug}.md`);

export const escapeHtml = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A heading's id the way GitHub makes it: lower case, only letters, digits, hyphens, underscores and spaces kept, spaces as hyphens. */
export const slugOf = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\p{M}_\- ]/gu, "")
    .replace(/ /g, "-");

const plainOf = (tokens) =>
  (tokens ?? [])
    .map((token) => {
      if (token.type === "codespan" || token.type === "text" || token.type === "escape") return token.tokens ? plainOf(token.tokens) : token.text;
      if (token.type === "html") return "";
      return token.tokens ? plainOf(token.tokens) : (token.text ?? "");
    })
    .join("");

/** The headings of a Markdown text, as [{ depth, text, id }], with ids made unique the way GitHub does (`-1`, `-2`). Headings in fenced code are not headings. */
export function headingsOf(markdown) {
  const seen = new Map();
  const out = [];
  for (const token of new Marked({ gfm: true }).lexer(markdown)) {
    if (token.type !== "heading") continue;
    const text = plainOf(token.tokens).trim();
    const base = slugOf(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.push({ depth: token.depth, text, id: n === 0 ? base : `${base}-${n}` });
  }
  return out;
}

const read = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

/** The title of a Markdown page: its one `#`. */
export const titleOf = (markdown) => headingsOf(markdown).find((heading) => heading.depth === 1)?.text ?? "";

/**
 * Where a link in a page of the repository goes. `from` is the file the link is in, relative to the repository (`docs/soccer.md`, `README.md`);
 * `known` says which pages and files exist: `{ root, pages: Set of slugs }`. Returns `{ kind, url, slug?, anchor?, error? }`, `kind` being
 * `anchor`, `page`, `site`, `asset`, `repo`, `external` or `error`. `url` is the address on the site, from a page in site/docs/.
 */
export function resolveLink(from, href, known) {
  const [path, rawAnchor] = href.split("#");
  const anchor = rawAnchor === undefined ? "" : rawAnchor;
  const hash = anchor === "" ? "" : `#${anchor}`;
  if (href.startsWith("#")) return { kind: "anchor", url: href, anchor, slug: undefined };
  if (/^mailto:/i.test(href)) return { kind: "external", url: href };
  if (href.startsWith(SITE_ORIGIN)) {
    const rest = path.slice(SITE_ORIGIN.length);
    const page = /^docs\/(.*)\.html$/.exec(rest);
    if (page) return known.pages.has(page[1]) ? { kind: "page", url: `${page[1]}.html${hash}`, slug: page[1], anchor } : { kind: "error", error: `no page "${page[1]}" on the docs site` };
    if (rest === "docs/") return { kind: "page", url: `index.html${hash}`, slug: "index", anchor };
    return { kind: "site", url: `../${rest}${hash}` };
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return { kind: "external", url: href };
  const target = path === "" ? from : posix.normalize(posix.join(posix.dirname(from), path));
  if (target.startsWith("..")) return { kind: "error", error: `${href} leaves the repository` };
  if (target === "README.md") return { kind: "external", url: `${REPO}${hash}`, repo: true };
  const page = /^docs\/([^/.]+)\.md$/.exec(target);
  if (page || target === "docs/README.md") {
    const slug = target === "docs/README.md" ? "index" : page[1];
    if (!known.pages.has(slug)) return { kind: "error", error: `${href} is not a page of the docs (${target})` };
    return { kind: "page", url: `${slug}.html${hash}`, slug, anchor };
  }
  if (!existsSync(join(known.root, target))) return { kind: "error", error: `${href} (${target}) is not a file of the repository` };
  // A picture of the docs: beside the pages (`atlas-map.svg`), or in docs/images (the README's) or docs/pictures (the pages'), each served at the same relative path on the site.
  if (/^docs\/([^/]+|images\/[^/]+|pictures\/[^/]+)\.(svg|png|webp)$/.test(target)) return { kind: "asset", url: target.slice("docs/".length), file: target };
  const directory = statSync(join(known.root, target)).isDirectory();
  return { kind: "repo", url: `${REPO}/${directory ? "tree" : "blob"}/main/${target}${hash}` };
}

/** The width and height of a WebP or a PNG file, or `undefined`: so that a picture keeps its room before it has loaded. */
export function imageSize(file) {
  let bytes;
  try {
    bytes = readFileSync(file);
  } catch {
    return undefined;
  }
  if (bytes.length > 30 && bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP") {
    const kind = bytes.toString("latin1", 12, 16);
    if (kind === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const bits = bytes.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  if (bytes.length > 24 && bytes.toString("latin1", 1, 4) === "PNG") return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  return undefined;
}

/**
 * A picture of the docs as HTML. A `-light` file with a `-dark` twin is a `<picture>` that follows the device, as the README's do; the size is in the tag so that the page
 * does not move when it loads, and it loads when it comes near.
 */
export function pictureHtml({ url, file, alt, title, root }) {
  const size = file && root ? imageSize(join(root, file)) : undefined;
  const dims = size ? ` width="${size.width}" height="${size.height}"` : "";
  const img = `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""}${dims} loading="lazy" decoding="async">`;
  if (/-light\.(webp|png)$/.test(url) && file && root && existsSync(join(root, file.replace("-light.", "-dark.")))) return `<picture><source media="(prefers-color-scheme: dark)" srcset="${escapeHtml(url.replace("-light.", "-dark."))}">${img}</picture>`;
  return img;
}

/** An address on the page `from` (in site/docs/) to a link target. */
function renderer(from, known, headings, siteBlocks) {
  let headingAt = 0;
  return {
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const own = headings[headingAt++];
      const id = own?.id ?? slugOf(plainOf(tokens));
      const anchor = depth > 1 ? `<a class="docs-anchor" href="#${id}" aria-label="${escapeHtml(plainOf(tokens))}">#</a>` : "";
      return `<h${depth} id="${id}">${inner}${anchor}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const found = resolveLink(from, href, known);
      const url = found.kind === "error" ? href : found.url;
      const external = found.kind === "external" || found.kind === "repo";
      return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external ? ' rel="noopener"' : ""}>${inner}</a>`;
    },
    image({ href, title, text }) {
      const found = resolveLink(from, href, known);
      const url = found.kind === "asset" ? found.url : found.kind === "error" ? href : found.url;
      return pictureHtml({ url, file: found.kind === "asset" ? found.file : undefined, alt: text, title, root: known.root });
    },
    code({ text, lang }) {
      const language = (lang ?? "").split(/\s+/)[0];
      return `<div class="docs-code"><div class="docs-code-bar"><span class="docs-code-lang">${escapeHtml(language || "text")}</span><button type="button" class="fam-button docs-copy" data-copy-pre data-docs-copy-label data-testid="docs-copy">Copy</button></div><pre tabindex="0"><code${language ? ` class="language-${escapeHtml(language)}"` : ""}>${escapeHtml(text)}\n</code></pre></div>\n`;
    },
    table(token) {
      const head = token.header.map((cell, i) => `<th${token.align[i] ? ` style="text-align:${token.align[i]}"` : ""}>${this.parser.parseInline(cell.tokens)}</th>`).join("");
      const rows = token.rows.map((row) => `<tr>${row.map((cell, i) => `<td${token.align[i] ? ` style="text-align:${token.align[i]}"` : ""}>${this.parser.parseInline(cell.tokens)}</td>`).join("")}</tr>`).join("\n");
      const wide = token.header.length >= 7 ? " docs-wide" : "";
      return `<div class="docs-table${wide}" tabindex="0" role="region" aria-label="${escapeHtml(plainOf(token.header[0].tokens) || "Table")}"><table><thead><tr>${head}</tr></thead><tbody>\n${rows}\n</tbody></table></div>\n`;
    },
    html({ text }) {
      const marker = /^<!-- site:([\w-]+) -->\s*$/.exec(text.trim());
      if (marker) return siteBlocks[marker[1]] ?? "";
      return text;
    },
  };
}

/** One page's Markdown as HTML: `{ html, headings }`. `siteBlocks` fills the `<!-- site:name -->` markers with HTML the build made from code. */
export function markdownToHtml(markdown, from, known, siteBlocks = {}) {
  const headings = headingsOf(markdown);
  const marked = new Marked({ gfm: true, renderer: renderer(from, known, headings, siteBlocks) });
  return { html: marked.parse(markdown), headings };
}

/** The words of the documentation pages in both languages, laid over the family's. */
export const DOCS_WORDS = {
  en: {
    pitch: "Guides, the reference, a gallery of every picture it can draw, and how it compares: the pages are made from the package's own files when the site is built.",
    name: "",
    nameLink: "About the name",
    foot: "Made from the package's own docs folder.",
    pageBack: "Demo",
    pageApi: "API reference",
    pageDocs: "Docs",
    docsSearchLabel: "Search the docs",
    docsSearchPlaceholder: "Search the docs (press /)",
    docsMenu: "Contents",
    docsNone: "No title or heading has all of: {q}",
    docsCount: "{n} matches",
    docsCopy: "Copy",
    docsCopyCode: "Copy code",
    docsCopied: "Copied to the clipboard.",
    docsCopiedShort: "Copied",
    docsCopyFailed: "Could not copy: select the code and copy it.",
    docsPrev: "Previous",
    docsNext: "Next",
    docsEdit: "Edit this page on GitHub",
    docsEnglishOnly: "The pages are in English; this contents, the search and the buttons are in Japanese.",
    docsShowCode: "Show the code",
    docsDownload: "Download SVG",
    docsOpenPage: "Open in a page",
    docsOpenNote: "Open in a page loads the published package from jsDelivr, which serves only released versions.",
    galleryFilter: "Filter the pictures",
    galleryFilterPlaceholder: "Filter by name: a sport, a venue, a look",
    galleryShown: "{n} pictures shown",
    galleryNone: "No picture has all of those words.",
    galleryAll: "All pictures",
    ...NAV_WORDS.en,
  },
  ja: {
    pitch: "使い方のガイド、リファレンス、描けるすべての図のギャラリー、他のパッケージとの比較。これらのページは、パッケージ内のファイルから「pnpm site」で作っています。",
    name: "",
    nameLink: "名前の由来（英語）",
    foot: "パッケージのdocsフォルダーから作っています。",
    pageBack: "デモ",
    pageApi: "APIリファレンス（英語）",
    pageDocs: "ドキュメント",
    docsSearchLabel: "ドキュメントを検索",
    docsSearchPlaceholder: "ドキュメントを検索（「/」キー）",
    docsMenu: "目次",
    docsNone: "「{q}」のすべての語を含むタイトルや見出しはありません。",
    docsCount: "{n}件見つかりました",
    docsCopy: "コピー",
    docsCopyCode: "コードをコピー",
    docsCopied: "クリップボードにコピーしました。",
    docsCopiedShort: "コピーしました",
    docsCopyFailed: "コピーできませんでした。コードを選択してコピーしてください。",
    docsPrev: "前へ",
    docsNext: "次へ",
    docsEdit: "GitHubでこのページを編集",
    docsEnglishOnly: "ページ本文は英語です。目次、検索、ボタンは日本語で表示しています。",
    docsShowCode: "コードを表示",
    docsDownload: "SVGを保存",
    docsOpenPage: "ページで開く",
    docsOpenNote: "「ページで開く」は、公開済みのパッケージをjsDelivrから読み込みます。jsDelivrが配信するのは公開済みのバージョンだけです。",
    galleryFilter: "図を絞り込む",
    galleryFilterPlaceholder: "名前で絞り込み：競技、会場、見た目",
    galleryShown: "{n}点を表示中",
    galleryNone: "これらの語をすべて含む図はありません。",
    galleryAll: "すべての図",
    ...NAV_WORDS.ja,
  },
};

const pageUrl = (slug) => `${slug}.html`;

/** The title of a page of the contents, in English: its own heading, or the contents' name for a page the build makes. */
const titleIn = (slug, headingsByPage) => headingsByPage.get(slug)?.title ?? slug;

/** The sidebar: its two views. By task, every group of pages (the one holding this page open), and under the page being read the h2 headings it holds. By sport, each sport with its guide and its pictures. */
function sidebar(current, headingsByPage) {
  const group = PAGE_LIST.find((page) => page.slug === current)?.group;
  const task = NAV.map((one) => {
    const items = one.pages
      .map((page) => {
        const title = titleIn(page.slug, headingsByPage);
        const here = page.slug === current;
        const subs = here ? (headingsByPage.get(page.slug)?.headings ?? []).filter((heading) => heading.depth === 2).slice(0, 40) : [];
        const nested = subs.length > 0 ? `<ul>${subs.map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join("")}</ul>` : "";
        return `<li><a href="${pageUrl(page.slug)}"${here ? ' aria-current="page"' : ""} data-ja="${escapeHtml(page.ja)}">${escapeHtml(title)}</a>${nested}</li>`;
      })
      .join("");
    return `<details class="docs-group"${one.id === group ? " open" : ""}><summary><span data-ja="${escapeHtml(one.ja)}">${escapeHtml(one.en)}</span></summary><ul>${items}</ul></details>`;
  }).join("\n");
  const sportOf = (sport) => {
    const open = sport.guide === current || sport.pages.some((page) => page.slug === current);
    const link = (slug, at, en, ja, cls = "") => {
      const here = slug === current;
      return `<li><a href="${pageUrl(slug)}${at ? `#${at}` : ""}"${here ? " data-current" : ""}${cls ? ` class="${cls}"` : ""} data-ja="${escapeHtml(ja)}">${escapeHtml(en)}</a></li>`;
    };
    const guide = PAGE_LIST.find((page) => page.slug === sport.guide);
    const items = [link(sport.guide, "", titleIn(sport.guide, headingsByPage), guide?.ja ?? "", "docs-sub-guide"), ...sport.pages.map((page) => link(page.slug, page.at, page.en, page.ja))].join("");
    return `<details class="docs-group"${open ? " open" : ""}><summary><span data-ja="${escapeHtml(sport.ja)}">${escapeHtml(sport.en)}</span></summary><ul>${items}</ul></details>`;
  };
  const places = PLACES.map((place) => `<li><a href="${pageUrl(place.page)}${place.at ? `#${place.at}` : ""}" data-ja="${escapeHtml(place.ja)}">${escapeHtml(place.en)}</a></li>`).join("");
  const placesGroup = `<details class="docs-group"><summary><span data-ja="${escapeHtml("会場と地区")}">Venues and districts</span></summary><ul>${places}</ul></details>`;
  return `<div class="docs-views" role="tablist" data-say-label="navViews">
            <button type="button" role="tab" aria-selected="true" data-view="task" data-say="navByTask"></button>
            <button type="button" role="tab" aria-selected="false" data-view="sport" data-say="navBySport"></button>
          </div>
          <div class="docs-view" data-view="task" role="tabpanel">
${task}
          </div>
          <div class="docs-view" data-view="sport" role="tabpanel" hidden>
${SPORTS.map(sportOf).join("\n")}
${placesGroup}
          </div>`;
}

/** One whole page of the docs site: the family's header and footer, the search box, the contents, the article and the pager. */
export function docsPage({ id, name, icon, slug, title, description, article, headingsByPage, editFile }) {
  const order = PAGE_LIST.map((page) => page.slug);
  const at = order.indexOf(slug);
  const titleOfSlug = (s) => titleIn(s, headingsByPage);
  const jaOfSlug = (s) => PAGE_LIST.find((page) => page.slug === s)?.ja ?? "";
  const pager = (s, rel, say) => (s === undefined ? "" : `<a href="${pageUrl(s)}" rel="${rel}"><small data-say="${say}"></small><span data-ja="${escapeHtml(jaOfSlug(s))}">${escapeHtml(titleOfSlug(s))}</span></a>`);
  const prev = order[at - 1];
  const next = order[at + 1];
  const edit = editFile ? `<p class="docs-edit"><a href="${REPO}/edit/main/${editFile}" data-say="docsEdit" rel="noopener"></a></p>` : "";
  const drawings = /lazy-art|class="kyogijo/.test(article) ? `\n    <link rel="stylesheet" href="drawings.css" />` : "";
  return sayEnglish(`<!doctype html>
<html lang="en">
  <head>
    ${familyHead({ id, title: slug === "index" ? `${name} documentation` : `${title} · ${name} documentation`, description })}
    ${icon === undefined ? iconLinks("../") : `<link rel="icon" href="${icon}" />`}
    ${firstPaintHead(id)}
    <link rel="stylesheet" href="../family.css" />
    <link rel="stylesheet" href="docs.css" />${drawings}
  </head>
  <body class="docs-page">
    <main>
      ${familyHeader({ id, links: [{ href: "../", say: "pageBack" }, { href: "../api.html", say: "pageApi" }, { href: "./", say: "pageDocs" }] })}
      <div class="docs-bar">
        <div class="docs-search" role="search">
          <input class="fam-field" id="docs-search" type="search" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="docs-results" aria-autocomplete="list" data-say-label="docsSearchLabel" data-say-placeholder="docsSearchPlaceholder" data-testid="docs-search" maxlength="80" />
          <ul class="docs-results" id="docs-results" role="listbox" hidden data-testid="docs-results"></ul>
          <div class="docs-count" id="docs-count" role="status" aria-live="polite"></div>
        </div>
        <button type="button" class="fam-button docs-menu-toggle" id="docs-menu-toggle" aria-expanded="true" aria-controls="docs-nav" data-testid="docs-menu-toggle"><span data-say="docsMenu"></span><span aria-hidden="true">≡</span></button>
      </div>
      <div class="docs-layout">
        <div class="docs-menu">
          <div class="docs-nav" id="docs-nav" role="navigation" aria-label="Documentation" data-testid="docs-nav">
          ${sidebar(slug, headingsByPage)}
          </div>
        </div>
        <article class="docs-article" data-testid="docs-article" data-page="${slug}">
          <p class="docs-english" data-say="docsEnglishOnly"></p>
${article}
          <div class="docs-pager">${pager(prev, "prev", "docsPrev")}${pager(next, "next", "docsNext")}</div>
          ${edit}
        </article>
      </div>
      ${familyUnreviewed({ id })}
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script src="search-index.js"></script>
    <script src="docs.js"></script>
    <script>familyLanguage({ id: ${JSON.stringify(id)}, words: window.KYOGIJO_DOCS_WORDS, onChange: window.kyDocs.setLanguage });window.kyDocs.setLanguage(document.documentElement.lang);${RELEASE_PAGE}</script>
  </body>
</html>
`, DOCS_WORDS.en);
}

/**
 * Write the documentation site into `outDir` (site/docs). `extraPages` are the pages made from code:
 * `{ slug, title, description, html, headings }`. `siteBlocks` fills the Markdown pages' `<!-- site:name -->` markers; `files` are more files for the site (`{ path, content }`);
 * `drawingsCss` is the stylesheet of the drawings (the pages that hold drawings link it once) and `drawingsBase` the start of the one block of it that a drawing carries, which
 * the page leaves out of each drawing it draws; `searchExtra` are more rows for the search (`[title, url, page, pageJa, depth, titleJa]`).
 */
export function buildDocs({ root = process.cwd(), outDir = "site/docs", id = "kyogijo-stadiums", name = "Kyogijo Stadiums", icon, extraPages = [], siteBlocks = {}, files = [], wordsExtra = {}, drawingsCss = "", drawingsBase = "", searchExtra = [] }) {
  const extra = new Map(extraPages.map((page) => [page.slug, page]));
  const known = { root, pages: new Set(PAGE_LIST.map((page) => page.slug)) };
  mkdirSync(outDir, { recursive: true });
  const rendered = new Map();
  const headingsByPage = new Map();
  for (const page of PAGE_LIST) {
    const file = fileOf(page.slug);
    if (file === null) {
      const one = extra.get(page.slug);
      if (one === undefined) throw new Error(`the docs page "${page.slug}" is made from code and none was given`);
      rendered.set(page.slug, { html: one.html, headings: one.headings, description: one.description, file: null });
      headingsByPage.set(page.slug, { title: one.title, headings: one.headings });
      continue;
    }
    const markdown = read(join(root, file));
    const made = markdownToHtml(markdown, file, known, siteBlocks);
    const title = titleOf(markdown);
    if (title === "") throw new Error(`${file} has no title (a # heading)`);
    const firstParagraph = /\n\n([^#\n|`<\-*>][^\n]*)/.exec(markdown)?.[1] ?? title;
    const description = firstParagraph.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*_]/g, "").slice(0, 280);
    rendered.set(page.slug, { html: made.html, headings: made.headings, description, file });
    headingsByPage.set(page.slug, { title, headings: made.headings });
  }
  for (const page of PAGE_LIST) {
    const one = rendered.get(page.slug);
    const info = headingsByPage.get(page.slug);
    writeFileSync(
      join(outDir, pageUrl(page.slug)),
      docsPage({ id, name, icon, slug: page.slug, title: info.title, description: one.description, article: one.html, headingsByPage, editFile: one.file }),
    );
  }
  // The search index: each page's title, then each of its headings below the first, with the page they are on; then the sports and the places the home page names.
  const rows = [];
  for (const page of PAGE_LIST) {
    const info = headingsByPage.get(page.slug);
    rows.push([info.title, pageUrl(page.slug), info.title, page.ja, 0, page.ja]);
    for (const heading of info.headings) if (heading.depth > 1) rows.push([heading.text, `${pageUrl(page.slug)}#${heading.id}`, info.title, page.ja, heading.depth - 1, ""]);
  }
  for (const sport of SPORTS) rows.push([sport.en, `gallery.html#${sport.id}`, "Gallery", "ギャラリー", 1, sport.ja]);
  for (const place of PLACES) rows.push([place.en, `gallery.html#place-${place.id}`, "Gallery", "ギャラリー", 1, place.ja]);
  rows.push(...searchExtra);
  const words = { en: { ...DOCS_WORDS.en, ...(wordsExtra.en ?? {}) }, ja: { ...DOCS_WORDS.ja, ...(wordsExtra.ja ?? {}) } };
  writeFileSync(join(outDir, "search-index.js"), `/* The titles and headings of every page of the docs: made by scripts/docs-pages.mjs. */\nwindow.KYOGIJO_DOCS_INDEX = ${JSON.stringify(rows)};\nwindow.KYOGIJO_DOCS_WORDS = ${JSON.stringify(words)};\nwindow.KYOGIJO_DOCS_BASE = ${JSON.stringify(drawingsBase)};\n`);
  writeFileSync(join(outDir, "docs.css"), DOCS_CSS);
  writeFileSync(join(outDir, "docs.js"), DOCS_JS);
  if (drawingsCss !== "") writeFileSync(join(outDir, "drawings.css"), drawingsCss);
  // The files of the pages made from code: each gallery item's drawing as an SVG and as a page that draws it from the published package.
  for (const page of [...extraPages, { files }]) {
    for (const file of page.files ?? []) {
      mkdirSync(dirname(join(outDir, file.path)), { recursive: true });
      writeFileSync(join(outDir, file.path), file.content);
    }
  }
  // Pictures the pages show: beside the pages, and the README's (docs/images) and the pages' own (docs/pictures), each under its own name.
  for (const file of readdirSync(join(root, "docs"))) if (/\.(svg|png|webp)$/.test(file)) cpSync(join(root, "docs", file), join(outDir, file));
  for (const folder of ["images", "pictures"]) {
    mkdirSync(join(outDir, folder), { recursive: true });
    for (const file of readdirSync(join(root, "docs", folder))) if (/\.(png|webp|svg)$/.test(file)) cpSync(join(root, "docs", folder, file), join(outDir, folder, file));
  }
  return { pages: PAGE_LIST.length, entries: rows.length };
}

/** For a test: the pages as `{ slug, file, headings }`, read from the repository. */
export function readPages(root = ".") {
  return PAGE_LIST.filter((page) => !page.site).map((page) => {
    const file = fileOf(page.slug);
    const markdown = read(join(root, file));
    return { slug: page.slug, file, markdown, headings: headingsOf(markdown) };
  });
}
