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
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";
import { iconLinks } from "./icon-links.mjs";
import { RELEASE_PAGE, firstPaintHead, sayEnglish } from "./first-paint.mjs";

export const SITE_ORIGIN = "https://johnmorrisdotca.github.io/kyogijo-stadiums/";
export const REPO = "https://github.com/johnmorrisdotca/kyogijo-stadiums";

/** The contents: groups of pages, in order. A page is the name of its file in docs/ (`index` is docs/README.md); `ja` is its title in Japanese. */
export const NAV = [
  {
    id: "start",
    en: "Start here",
    ja: "最初に読む",
    pages: [
      { slug: "index", ja: "ドキュメントの概要" },
      { slug: "getting-started", ja: "はじめに" },
      { slug: "surfaces", ja: "競技場" },
      { slug: "score", ja: "得点とレイアウト" },
      { slug: "theming", ja: "テーマと色" },
      { slug: "annotations", ja: "攻撃方向・目盛り・部位名の注釈" },
      { slug: "ranges", ja: "表示範囲とズーム" },
      { slug: "layouts", ja: "レイアウトと背景" },
      { slug: "pageant", ja: "ハーフに広げる旗とエンブレム" },
      { slug: "situation", ja: "試合の状況（人数・走者・ダウン）" },
      { slug: "emblems", ja: "トロフィー・メダル・ボール・エンブレム" },
      { slug: "flags", ja: "国旗（国コードからHataで描く）" },
      { slug: "accessibility", ja: "アクセシビリティ" },
    ],
  },
  {
    id: "places",
    en: "Sports and places",
    ja: "競技と場所",
    pages: [
      { slug: "soccer", ja: "サッカー" },
      { slug: "curling", ja: "カーリング" },
      { slug: "courts", ja: "ネット型・ラケット型などのコート競技" },
      { slug: "hardwood", ja: "リアルなバスケットボールコートの床" },
      { slug: "field-sports", ja: "ラクロス、ラグビーなどのフィールド" },
      { slug: "crowd", ja: "スタンドと観客" },
      { slug: "pools", ja: "競泳・水球・飛込・アーティスティックスイミングのプール" },
      { slug: "athletics", ja: "陸上競技場" },
      { slug: "skating", ja: "スケートリンク" },
      { slug: "budo", ja: "武道" },
      { slug: "combat", ja: "格闘技（総合格闘技のケージ）" },
      { slug: "multi", ja: "大会向けレイアウト（複数の競技面）" },
      { slug: "judging", ja: "審判員の配置" },
      { slug: "special-games", ja: "特設会場での試合" },
      { slug: "ballparks", ja: "球場" },
      { slug: "grounds", ja: "スタジアム" },
      { slug: "arenas", ja: "アリーナ" },
      { slug: "variants", ja: "リーグごとの違い" },
      { slug: "eras", ja: "年ごとの競技場" },
      { slug: "atlas", ja: "球場とスタジアムの地図" },
    ],
  },
  {
    id: "data",
    en: "Data on a surface",
    ja: "競技場の上のデータ",
    pages: [
      { slug: "units", ja: "単位" },
      { slug: "frames", ja: "座標系" },
      { slug: "zones", ja: "ゾーンとルール" },
      { slug: "pointer", ja: "図上の位置を調べる" },
      { slug: "layers", ja: "データレイヤー" },
      { slug: "charts", ja: "すぐ使えるチャート" },
      { slug: "targets", ja: "ゴールマウス・ストライクゾーン・スタンプ" },
      { slug: "team-shape", ja: "チームの形" },
      { slug: "replay", ja: "リプレイ" },
      { slug: "turn", ja: "3D表示" },
      { slug: "renderers", ja: "レンダラー" },
    ],
  },
  {
    id: "gallery",
    en: "Gallery",
    ja: "ギャラリー",
    pages: [
      { slug: "gallery", ja: "ギャラリーの案内" },
      { slug: "gallery-surfaces", en: "Gallery: surfaces and scores", ja: "ギャラリー：競技場と得点", site: true },
      { slug: "gallery-soccer", en: "Gallery: the soccer pitch", ja: "ギャラリー：サッカーのピッチ", site: true },
      { slug: "gallery-leagues", en: "Gallery: every league's surface", ja: "ギャラリー：リーグごとの競技場", site: true },
      { slug: "gallery-years", en: "Gallery: surfaces through the years", ja: "ギャラリー：年ごとの競技場", site: true },
      { slug: "gallery-places", en: "Gallery: ballparks, grounds and arenas", ja: "ギャラリー：球場、スタジアム、アリーナ", site: true },
      { slug: "gallery-special", en: "Gallery: special games", ja: "ギャラリー：特設会場での試合", site: true },
      { slug: "gallery-data", en: "Gallery: data on a surface", ja: "ギャラリー：競技場の上のデータ", site: true },
      { slug: "gallery-curling", en: "Gallery: curling", ja: "ギャラリー：カーリング", site: true },
      { slug: "gallery-courts", en: "Gallery: net, racket and court sports", ja: "ギャラリー：ネット型・ラケット型などのコート競技", site: true },
      { slug: "gallery-fields", en: "Gallery: lacrosse, rugby, Australian football, Gaelic games, cricket, hockey and handball", ja: "ギャラリー：ラクロス、ラグビー、オーストラリアンフットボール、ゲーリック・ゲームズ、クリケット、フィールドホッケー、ハンドボール", site: true },
      { slug: "gallery-pools", en: "Gallery: swimming, water polo, diving and artistic swimming", ja: "ギャラリー：競泳、水球、飛込、アーティスティックスイミング", site: true },
      { slug: "gallery-athletics", en: "Gallery: the athletics stadium", ja: "ギャラリー：陸上競技場", site: true },
      { slug: "gallery-skating", en: "Gallery: the skating rinks", ja: "ギャラリー：スケートリンク", site: true },
      { slug: "gallery-budo", en: "Gallery: the budō", ja: "ギャラリー：武道", site: true },
      { slug: "gallery-combat", en: "Gallery: the combat sports", ja: "ギャラリー：格闘技（総合格闘技のケージ）", site: true },
      { slug: "gallery-styling", en: "Gallery: looks and annotations", ja: "ギャラリー：スタイルと注釈", site: true },
      { slug: "gallery-ranges", en: "Gallery: display ranges and zoom", ja: "ギャラリー：表示範囲とズーム", site: true },
      { slug: "gallery-layouts", en: "Gallery: layouts and backgrounds", ja: "ギャラリー：レイアウトと背景", site: true },
      { slug: "gallery-multi", en: "Gallery: tournament layouts", ja: "ギャラリー：大会向けレイアウト", site: true },
      { slug: "gallery-judging", en: "Gallery: judging assignments", ja: "ギャラリー：審判員の配置", site: true },
      { slug: "gallery-pageant", en: "Gallery: flags on the halves", ja: "ギャラリー：ハーフに広げる旗", site: true },
      { slug: "gallery-situation", en: "Gallery: the situation of a game", ja: "ギャラリー：試合の状況", site: true },
    ],
  },
  {
    id: "compare",
    en: "Compare",
    ja: "比較",
    pages: [{ slug: "compare", ja: "他のパッケージとの比較" }],
  },
  {
    id: "reference",
    en: "Reference",
    ja: "リファレンス",
    pages: [
      { slug: "entry-points", ja: "エントリーポイント" },
      { slug: "limits", ja: "数と上限" },
      { slug: "sources", ja: "寸法の出典" },
      { slug: "references", ja: "参考資料" },
      { slug: "parks", ja: "球場の識別キー" },
      { slug: "strings-ja", ja: "日本語訳の一覧" },
      { slug: "terminology", ja: "用語集" },
      { slug: "architecture", ja: "アーキテクチャ" },
    ],
  },
];

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
  if (/^docs\/[^/]+\.(svg|png|webp)$/.test(target)) return { kind: "asset", url: posix.basename(target), file: target };
  const directory = statSync(join(known.root, target)).isDirectory();
  return { kind: "repo", url: `${REPO}/${directory ? "tree" : "blob"}/main/${target}${hash}` };
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
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy">`;
    },
    code({ text, lang }) {
      const language = (lang ?? "").split(/\s+/)[0];
      return `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ""}>${escapeHtml(text)}\n</code></pre>\n`;
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

/** The words of the documentation pages in both languages, laid over the family's. `pageTitles` and `groups` are filled from NAV. */
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
    docsSearchPlaceholder: "Search titles and headings (press / to start)",
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
    docsSearchPlaceholder: "タイトルと見出しを検索（「/」キーで入力開始）",
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
  },
};

const pageUrl = (slug) => `${slug}.html`;

/** The sidebar: every group, every page, and under the page being read the h2 headings it holds. */
function sidebar(current, headingsByPage) {
  return NAV.map((group) => {
    const items = group.pages
      .map((page) => {
        const title = headingsByPage.get(page.slug)?.title ?? page.slug;
        const here = page.slug === current;
        const subs = here ? (headingsByPage.get(page.slug)?.headings ?? []).filter((heading) => heading.depth === 2).slice(0, 40) : [];
        const nested = subs.length > 0 ? `<ul>${subs.map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join("")}</ul>` : "";
        return `<li><a href="${pageUrl(page.slug)}"${here ? ' aria-current="page"' : ""} data-ja="${escapeHtml(page.ja)}">${escapeHtml(title)}</a>${nested}</li>`;
      })
      .join("");
    return `<div><h2 data-ja="${escapeHtml(group.ja)}">${escapeHtml(group.en)}</h2><ul>${items}</ul></div>`;
  }).join("\n");
}

/** One whole page of the docs site: the family's header and footer, the search box, the contents, the article and the pager. */
export function docsPage({ id, name, icon, slug, title, description, article, headingsByPage, editFile }) {
  const order = PAGE_LIST.map((page) => page.slug);
  const at = order.indexOf(slug);
  const titleOfSlug = (s) => headingsByPage.get(s)?.title ?? s;
  const jaOfSlug = (s) => PAGE_LIST.find((page) => page.slug === s)?.ja ?? "";
  const pager = (s, rel, say) => (s === undefined ? "" : `<a href="${pageUrl(s)}" rel="${rel}"><small data-say="${say}"></small><span data-ja="${escapeHtml(jaOfSlug(s))}">${escapeHtml(titleOfSlug(s))}</span></a>`);
  const prev = order[at - 1];
  const next = order[at + 1];
  const edit = editFile ? `<p class="docs-edit"><a href="${REPO}/edit/main/${editFile}" data-say="docsEdit" rel="noopener"></a></p>` : "";
  return sayEnglish(`<!doctype html>
<html lang="en">
  <head>
    ${familyHead({ id, title: `${title} · ${name} documentation`, description })}
    ${icon === undefined ? iconLinks("../") : `<link rel="icon" href="${icon}" />`}
    ${firstPaintHead(id)}
    <link rel="stylesheet" href="../family.css" />
    <link rel="stylesheet" href="docs.css" />
  </head>
  <body>
    <main>
      ${familyHeader({ id, links: [{ href: "../", say: "pageBack" }, { href: "../api.html", say: "pageApi" }, { href: "./", say: "pageDocs" }] })}
      <div class="docs-bar">
        <div class="docs-search" role="search">
          <input class="fam-field" id="docs-search" type="search" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="docs-results" aria-autocomplete="list" data-say-label="docsSearchLabel" data-say-placeholder="docsSearchPlaceholder" data-testid="docs-search" maxlength="80" />
          <ul class="docs-results" id="docs-results" role="listbox" hidden data-testid="docs-results"></ul>
          <div class="docs-count" id="docs-count" role="status" aria-live="polite"></div>
        </div>
      </div>
      <div class="docs-layout">
        <div class="docs-menu">
          <button type="button" class="fam-button docs-menu-toggle" id="docs-menu-toggle" aria-expanded="true" aria-controls="docs-nav" data-testid="docs-menu-toggle"><span data-say="docsMenu"></span><span aria-hidden="true">≡</span></button>
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
 * `{ slug, title, description, html, headings }`. `siteBlocks` fills the Markdown pages' `<!-- site:name -->` markers; `files` are more files for the site (`{ path, content }`).
 */
export function buildDocs({ root = process.cwd(), outDir = "site/docs", id = "kyogijo-stadiums", name = "Kyogijo Stadiums", icon, extraPages = [], siteBlocks = {}, files = [], wordsExtra = {} }) {
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
  // The search index: each page's title, then each of its headings below the first, with the page they are on.
  const rows = [];
  for (const page of PAGE_LIST) {
    const info = headingsByPage.get(page.slug);
    rows.push([info.title, pageUrl(page.slug), info.title, page.ja, 0, page.ja]);
    for (const heading of info.headings) if (heading.depth > 1) rows.push([heading.text, `${pageUrl(page.slug)}#${heading.id}`, info.title, page.ja, heading.depth - 1, ""]);
  }
  const words = { en: { ...DOCS_WORDS.en, ...(wordsExtra.en ?? {}) }, ja: { ...DOCS_WORDS.ja, ...(wordsExtra.ja ?? {}) } };
  writeFileSync(join(outDir, "search-index.js"), `/* The titles and headings of every page of the docs: made by scripts/docs-pages.mjs. */\nwindow.KYOGIJO_DOCS_INDEX = ${JSON.stringify(rows)};\nwindow.KYOGIJO_DOCS_WORDS = ${JSON.stringify(words)};\n`);
  writeFileSync(join(outDir, "docs.css"), DOCS_CSS);
  writeFileSync(join(outDir, "docs.js"), DOCS_JS);
  // The files of the pages made from code: each gallery item's drawing as an SVG and as a page that draws it from the published package.
  for (const page of [...extraPages, { files }]) {
    for (const file of page.files ?? []) {
      mkdirSync(dirname(join(outDir, file.path)), { recursive: true });
      writeFileSync(join(outDir, file.path), file.content);
    }
  }
  // Pictures the pages show.
  for (const file of readdirSync(join(root, "docs"))) if (/\.(svg|png|webp)$/.test(file)) cpSync(join(root, "docs", file), join(outDir, file));
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
