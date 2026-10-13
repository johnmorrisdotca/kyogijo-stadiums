// The stylesheet and the script of the documentation pages (site/docs/docs.css and docs.js), kept here as text for scripts/docs-pages.mjs
// to write. The pages use the family's own variables (family.css), so light and dark follow the device and the cloth, and nothing here
// names a colour of its own except the gallery's frame. The script is plain JavaScript with no dependency: the search box over the pages'
// titles and headings, the contents on a phone, the copy buttons, and the words of the page in either language.

export const DOCS_CSS = `/* The documentation pages: made by scripts/docs-pages.mjs. */
.docs-bar { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin: 0 0 18px; }
.docs-search { position: relative; flex: 1 1 260px; max-width: 560px; min-width: 0; }
.docs-search input { width: 100%; }
.docs-results { position: absolute; z-index: 20; left: 0; right: 0; top: 100%; margin: 4px 0 0; padding: 4px; list-style: none; background: var(--surface); border: 1px solid var(--rule); border-radius: 12px; max-height: min(60vh, 28rem); overflow: auto; box-shadow: 0 8px 24px rgba(0, 0, 0, .18); }
.docs-results li { margin: 0; }
.docs-results a { display: block; min-height: 44px; padding: 6px 10px; border-radius: 8px; text-decoration: none; color: inherit; overflow-wrap: anywhere; }
.docs-results a:hover, .docs-results a[aria-selected="true"] { background: color-mix(in srgb, var(--ink) 9%, transparent); }
.docs-results small { display: block; color: var(--muted); font-size: .78rem; }
.docs-results .docs-none { padding: 10px; color: var(--muted); font-size: .9rem; }
.docs-count { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.docs-layout { display: grid; gap: 18px 36px; grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 900px) { .docs-layout { grid-template-columns: 17.5rem minmax(0, 1fr); } .docs-menu-toggle { display: none; } }
.docs-menu { min-width: 0; }
@media (min-width: 900px) { .docs-menu { position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow: auto; padding-right: 6px; } }
.docs-menu-toggle { width: 100%; justify-content: space-between; }
.docs-nav { display: grid; gap: 14px; margin-top: 10px; font-size: .9rem; }
.docs-nav[hidden] { display: none; }
.docs-nav h2 { margin: 0 0 2px; font-size: .72rem; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
.docs-nav ul { list-style: none; margin: 0; padding: 0; }
.docs-nav li > a { display: flex; align-items: center; min-height: 40px; padding: 0 8px; border-radius: 8px; text-decoration: none; color: inherit; overflow-wrap: anywhere; }
.docs-nav li > a:hover { background: color-mix(in srgb, var(--ink) 9%, transparent); }
.docs-nav li > a[aria-current="page"] { font-weight: 700; background: color-mix(in srgb, var(--accent) 16%, transparent); }
.docs-nav ul ul { margin: 2px 0 6px 12px; border-left: 1px solid var(--rule); }
.docs-nav ul ul a { min-height: 32px; font-size: .82rem; color: var(--muted); }
.docs-article { min-width: 0; max-width: 100%; line-height: 1.6; }
.docs-article > * { max-width: 100%; }
.docs-article h1 { font-size: 1.7rem; margin: 0 0 12px; }
.docs-article h2 { font-size: 1.3rem; margin: 36px 0 8px; padding-top: 8px; border-top: 1px solid var(--rule); }
.docs-article h3 { font-size: 1.08rem; margin: 26px 0 6px; }
.docs-article h4 { font-size: 1rem; margin: 18px 0 4px; }
.docs-article :is(h1, h2, h3, h4) { scroll-margin-top: 14px; overflow-wrap: anywhere; }
.docs-article :is(h2, h3, h4) .docs-anchor { margin-left: .4em; opacity: 0; color: var(--muted); text-decoration: none; font-weight: 400; }
.docs-article :is(h2, h3, h4):hover .docs-anchor, .docs-article .docs-anchor:focus { opacity: 1; }
.docs-article p, .docs-article li { max-width: 76ch; overflow-wrap: anywhere; }
.docs-article ul, .docs-article ol { padding-left: 1.4rem; }
.docs-article li { margin: 3px 0; }
.docs-article a { text-underline-offset: 2px; }
.docs-article :not(pre) > code { font-size: .88em; border: 1px solid var(--rule); border-radius: 6px; padding: 0 5px; background: var(--surface); overflow-wrap: anywhere; }
.docs-article blockquote { margin: 12px 0; padding: 2px 14px; border-left: 3px solid var(--accent); color: var(--muted); }
.docs-article img { max-width: 100%; height: auto; }
.docs-article hr { border: 0; border-top: 1px solid var(--rule); margin: 24px 0; }
.docs-code { position: relative; margin: 12px 0; max-width: 100%; }
.docs-code pre { padding-right: 5.2rem; }
.docs-code .docs-copy { position: absolute; top: 6px; right: 6px; min-height: 36px; padding: 0 10px; font-size: .78rem; }
.docs-table { overflow-x: auto; max-width: 100%; margin: 12px 0; border: 1px solid var(--rule); border-radius: 12px; background: var(--surface); }
.docs-table:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.docs-table table { width: max-content; min-width: 100%; }
.docs-table :is(th, td) { text-align: left; vertical-align: top; padding: 6px 10px; border-bottom: 1px solid var(--rule); min-width: 6.5rem; max-width: 34rem; }
.docs-table tr:last-child td { border-bottom: 0; }
.docs-table th { position: sticky; top: 0; background: var(--surface); font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.docs-table.docs-wide td:first-child, .docs-table.docs-wide th:first-child { position: sticky; left: 0; background: var(--surface); z-index: 1; min-width: 8rem; border-right: 1px solid var(--rule); }
.docs-note { color: var(--muted); font-size: .88rem; }
.docs-pager { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; margin: 36px 0 8px; padding-top: 14px; border-top: 1px solid var(--rule); }
.docs-pager a { display: inline-flex; flex-direction: column; min-height: 52px; justify-content: center; padding: 6px 14px; border: 1px solid var(--rule); border-radius: 12px; text-decoration: none; min-width: 9rem; max-width: 100%; }
.docs-pager a:hover { border-color: var(--ink); }
.docs-pager small { color: var(--muted); font-size: .75rem; }
.docs-pager a[rel="next"] { text-align: right; margin-left: auto; }
.docs-edit { margin-top: 10px; font-size: .85rem; color: var(--muted); }
.docs-english { display: none; margin: 0 0 14px; font-size: .88rem; color: var(--muted); }
html[lang="ja"] .docs-english { display: block; }

/* The gallery. */
.g-groups { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); list-style: none; padding: 0; margin: 12px 0; }
.g-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr)); margin: 10px 0 24px; }
.g-item { margin: 0; min-width: 0; border: 1px solid var(--rule); border-radius: 14px; background: var(--surface); padding: 10px; display: grid; gap: 8px; align-content: start; }
.g-item h3 { margin: 0; padding: 0; border: 0; font-size: .98rem; }
.g-art { min-width: 0; display: flex; justify-content: center; align-items: center; background: var(--page); border-radius: 10px; padding: 6px; min-height: 90px; }
.g-art svg { max-width: 100%; height: auto; }
.g-art svg[data-orientation="portrait"] { width: auto; max-height: 24rem; }
.g-note { margin: 0; font-size: .85rem; color: var(--muted); }
.g-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.g-status { font-size: .8rem; color: var(--muted); }
.g-actions a.fam-button { text-decoration: none; }
.g-published { font-size: .75rem; }
.g-code { min-width: 0; }
.g-code summary { cursor: pointer; font-size: .85rem; min-height: 32px; display: flex; align-items: center; }
.g-code pre { margin-top: 6px; max-height: 22rem; overflow: auto; white-space: pre; }
.g-item--wide { grid-column: 1 / -1; }
.g-frames { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); margin: 12px 0; }
.g-frames .g-art svg { width: 100%; }
`;

export const DOCS_JS = `/* The documentation pages' script: made by scripts/docs-pages.mjs. */
(function () {
  "use strict";
  var words = window.KYOGIJO_DOCS_WORDS || { en: {}, ja: {} };
  var index = window.KYOGIJO_DOCS_INDEX || [];
  var lang = "en";
  var say = function (key) { var own = words[lang] || {}; return key in own ? own[key] : (words.en || {})[key] || key; };
  var fold = function (text) { return String(text).toLowerCase().normalize("NFKD").replace(/[\\u0300-\\u036f]/g, ""); };

  // ---- Search: every word of the query must be in the title of a page or in a heading (in either language). ----
  var box = document.getElementById("docs-search");
  var list = document.getElementById("docs-results");
  var count = document.getElementById("docs-count");
  var chosen = -1;
  var shown = [];
  var entries = index.map(function (row) { return { title: row[0], url: row[1], page: row[2], pageJa: row[3], depth: row[4], titleJa: row[5] || "", key: fold([row[0], row[2], row[3], row[5] || ""].join(" ")), own: fold([row[0], row[5] || ""].join(" ")) }; });
  var search = function (query) {
    var words = fold(query).split(/\\s+/).filter(Boolean);
    if (words.length === 0) return [];
    var out = [];
    entries.forEach(function (entry) {
      var all = words.every(function (word) { return entry.key.indexOf(word) >= 0; });
      if (!all) return;
      var inOwn = words.every(function (word) { return entry.own.indexOf(word) >= 0; });
      var score = (entry.depth === 0 ? 0 : 10) + (inOwn ? 0 : 5) + (entry.own.indexOf(words[0]) === 0 ? 0 : 2) + entry.depth;
      out.push({ entry: entry, score: score });
    });
    out.sort(function (a, b) { return a.score - b.score || a.entry.title.length - b.entry.title.length; });
    return out.slice(0, 14).map(function (row) { return row.entry; });
  };
  var close = function () { list.hidden = true; box.setAttribute("aria-expanded", "false"); box.removeAttribute("aria-activedescendant"); chosen = -1; };
  var mark = function (at) {
    var links = list.querySelectorAll("a");
    links.forEach(function (link, i) { link.setAttribute("aria-selected", String(i === at)); });
    chosen = at;
    if (at >= 0 && links[at]) { box.setAttribute("aria-activedescendant", links[at].id); links[at].scrollIntoView({ block: "nearest" }); } else box.removeAttribute("aria-activedescendant");
  };
  var render = function () {
    var query = box.value.trim();
    if (query === "") { list.replaceChildren(); close(); count.textContent = ""; return; }
    shown = search(query);
    list.replaceChildren();
    if (shown.length === 0) {
      var none = document.createElement("li");
      none.className = "docs-none";
      none.textContent = say("docsNone").replace("{q}", query);
      list.appendChild(none);
    }
    shown.forEach(function (entry, i) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = entry.url;
      a.id = "docs-result-" + i;
      a.setAttribute("role", "option");
      a.setAttribute("aria-selected", "false");
      var title = lang === "ja" && entry.titleJa ? entry.titleJa : entry.title;
      var page = lang === "ja" && entry.pageJa ? entry.pageJa : entry.page;
      a.textContent = title;
      if (entry.depth !== 0) { var small = document.createElement("small"); small.textContent = page; a.appendChild(small); }
      li.appendChild(a);
      list.appendChild(li);
    });
    list.hidden = false;
    box.setAttribute("aria-expanded", "true");
    count.textContent = shown.length === 0 ? say("docsNone").replace("{q}", query) : say("docsCount").replace("{n}", String(shown.length));
    chosen = -1;
  };
  if (box && list) {
    box.addEventListener("input", render);
    box.addEventListener("focus", function () { if (box.value.trim() !== "") render(); });
    box.addEventListener("keydown", function (event) {
      var links = list.querySelectorAll("a");
      if (event.key === "ArrowDown" && links.length) { event.preventDefault(); mark((chosen + 1) % links.length); }
      else if (event.key === "ArrowUp" && links.length) { event.preventDefault(); mark(chosen <= 0 ? links.length - 1 : chosen - 1); }
      else if (event.key === "Enter") { var pick = links[chosen >= 0 ? chosen : 0]; if (pick) { event.preventDefault(); window.location.href = pick.href; } }
      else if (event.key === "Escape") { if (box.value !== "") { box.value = ""; render(); } else close(); }
    });
    document.addEventListener("click", function (event) { if (!event.target.closest(".docs-search")) close(); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { event.preventDefault(); box.focus(); box.select(); }
    });
    var asked = new URLSearchParams(location.search).get("q");
    if (asked) { box.value = asked; render(); }
  }

  // ---- The contents: open on a desk, shut behind a button on a phone. ----
  var toggle = document.getElementById("docs-menu-toggle");
  var nav = document.getElementById("docs-nav");
  if (toggle && nav) {
    var wide = window.matchMedia("(min-width: 900px)");
    var set = function (open) { nav.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); };
    set(wide.matches);
    wide.addEventListener("change", function () { set(wide.matches); });
    toggle.addEventListener("click", function () { set(nav.hidden); });
  }

  // ---- Copy buttons: on every block of code, and on each gallery item's own. ----
  var copy = function (text, button, status) {
    var done = function (ok) {
      var label = button.querySelector("[data-copy-label]") || button;
      var before = button.getAttribute("data-label") || label.textContent;
      button.setAttribute("data-label", before);
      var message = ok ? say("docsCopied") : say("docsCopyFailed");
      if (status) status.textContent = message;
      label.textContent = ok ? say("docsCopiedShort") : before;
      window.setTimeout(function () { label.textContent = say("docsCopy"); if (status) status.textContent = ""; }, 1800);
    };
    var fallback = function () {
      var area = document.createElement("textarea");
      area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (error) { ok = false; }
      document.body.removeChild(area);
      done(ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback); else fallback();
  };
  document.querySelectorAll(".docs-article pre").forEach(function (pre) {
    if (pre.closest(".g-item") || pre.parentNode.classList.contains("docs-code")) return;
    var wrap = document.createElement("div");
    wrap.className = "docs-code";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    var button = document.createElement("button");
    button.type = "button";
    button.className = "fam-button docs-copy";
    button.setAttribute("data-copy-pre", "");
    button.textContent = say("docsCopy");
    wrap.appendChild(button);
  });
  document.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-copy-pre], button[data-copy-for]");
    if (!button) return;
    var source = button.hasAttribute("data-copy-for") ? document.getElementById(button.getAttribute("data-copy-for")) : button.parentNode.querySelector("pre");
    var status = button.parentNode.querySelector(".g-status");
    if (source) copy(source.textContent.replace(/\\n$/, ""), button, status);
  });

  // ---- The words, in the page's language. ----
  window.kyDocs = {
    setLanguage: function (next) {
      lang = next === "ja" ? "ja" : "en";
      document.querySelectorAll("[data-docs-copy-label]").forEach(function (el) { el.textContent = say("docsCopy"); });
      document.querySelectorAll("button[data-copy-pre]").forEach(function (el) { el.textContent = say("docsCopy"); });
      document.querySelectorAll("[data-ja]").forEach(function (el) { if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.textContent); el.textContent = lang === "ja" ? el.getAttribute("data-ja") : el.getAttribute("data-en"); });
      if (box && box.value.trim() !== "") render();
    },
  };
})();
`;
