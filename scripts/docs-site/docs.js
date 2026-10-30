/* The documentation pages' script: copied to site/docs/docs.js by scripts/docs-pages.mjs. Plain JavaScript, no dependency: the search over the pages' titles and headings, the contents (two views, shut behind a button
   on a phone), the copy buttons, pictures that are drawn when they come near, the gallery's filter, and the words of the page in either language. */
(function () {
  "use strict";
  var words = window.KYOGIJO_DOCS_WORDS || { en: {}, ja: {} };
  var index = window.KYOGIJO_DOCS_INDEX || [];
  var lang = "en";
  var say = function (key) { var own = words[lang] || {}; return key in own ? own[key] : (words.en || {})[key] || key; };
  var fold = function (text) { return String(text).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, ""); };
  var remember = function (key, value) { try { if (value === undefined) return window.localStorage.getItem(key); window.localStorage.setItem(key, value); } catch (e) { void e; /* a private window or blocked storage: the page works without it */ } return null; };

  // ---- Search: every word of the query must be in the title of a page or in a heading (in either language). ----
  var box = document.getElementById("docs-search");
  var list = document.getElementById("docs-results");
  var count = document.getElementById("docs-count");
  var chosen = -1;
  var shown = [];
  var entries = index.map(function (row) { return { title: row[0], url: row[1], page: row[2], pageJa: row[3], depth: row[4], titleJa: row[5] || "", key: fold([row[0], row[2], row[3], row[5] || ""].join(" ")), own: fold([row[0], row[5] || ""].join(" ")) }; });
  var search = function (query) {
    var terms = fold(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    var out = [];
    entries.forEach(function (entry) {
      var all = terms.every(function (term) { return entry.key.indexOf(term) >= 0; });
      if (!all) return;
      var inOwn = terms.every(function (term) { return entry.own.indexOf(term) >= 0; });
      var score = (entry.depth === 0 ? 0 : 10) + (inOwn ? 0 : 5) + (entry.own.indexOf(terms[0]) === 0 ? 0 : 2) + entry.depth;
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

  // ---- The contents: open on a desk, shut behind a button on a phone; two views, remembered on this device. ----
  var toggle = document.getElementById("docs-menu-toggle");
  var nav = document.getElementById("docs-nav");
  if (toggle && nav) {
    var wide = window.matchMedia("(min-width: 900px)");
    var set = function (open) { nav.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); };
    set(wide.matches);
    wide.addEventListener("change", function () { set(wide.matches); });
    toggle.addEventListener("click", function () { set(nav.hidden); });
  }
  var views = document.querySelectorAll(".docs-views [data-view]");
  var panels = document.querySelectorAll(".docs-view[data-view]");
  var showView = function (name, keep) {
    views.forEach(function (button) { button.setAttribute("aria-selected", String(button.getAttribute("data-view") === name)); });
    panels.forEach(function (panel) { panel.hidden = panel.getAttribute("data-view") !== name; });
    if (!keep) remember("kyogijo.docs.view", name);
  };
  if (views.length) {
    views.forEach(function (button) { button.addEventListener("click", function () { showView(button.getAttribute("data-view")); }); });
    var wanted = new URLSearchParams(location.search).get("nav") || remember("kyogijo.docs.view");
    if (wanted === "sport" || wanted === "task") showView(wanted, true);
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
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(area);
      done(ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback); else fallback();
  };
  // A block of code the page was not built with a bar for (one a script wrote) gets one.
  document.querySelectorAll(".docs-article pre").forEach(function (pre) {
    if (pre.closest(".docs-code")) return;
    var wrap = document.createElement("div");
    wrap.className = "docs-code";
    var bar = document.createElement("div");
    bar.className = "docs-code-bar";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "fam-button docs-copy";
    button.setAttribute("data-copy-pre", "");
    button.textContent = say("docsCopy");
    pre.parentNode.insertBefore(wrap, pre);
    bar.appendChild(document.createElement("span")).className = "docs-code-lang";
    bar.appendChild(button);
    wrap.appendChild(bar);
    wrap.appendChild(pre);
  });
  document.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-copy-pre], button[data-copy-for], button[data-copy-code]");
    if (!button) return;
    var status = (button.closest(".g-item, .hub-tile, .docs-code") || document).querySelector(".g-status");
    if (button.hasAttribute("data-copy-code")) { copy(button.getAttribute("data-copy-code"), button, status); return; }
    var source = button.hasAttribute("data-copy-for") ? document.getElementById(button.getAttribute("data-copy-for")) : button.closest(".docs-code").querySelector("pre");
    if (source) copy(source.textContent.replace(/\n$/, ""), button, status);
  });

  // ---- Pictures that come near: a box with a file to fetch (an SVG the build drew); fetched when it is within a screen or two, a few at a time, the build's own stylesheet left out (the page has it once). ----
  var base = window.KYOGIJO_DOCS_BASE || "";
  var strip = function (text) { return base === "" ? text : text.replace(/<style>[\s\S]*?<\/style>/g, function (block) { return block.indexOf(base) >= 0 ? "" : block; }); };
  var queue = [];
  var running = 0;
  var pump = function () {
    while (running < 4 && queue.length) {
      var el = queue.shift();
      running += 1;
      (function (box) {
        window.fetch(box.getAttribute("data-src")).then(function (response) { if (!response.ok) throw new Error(String(response.status)); return response.text(); }).then(function (text) {
          box.innerHTML = strip(text);
          box.setAttribute("data-state", "done");
          box.removeAttribute("aria-busy");
        }).catch(function () {
          var img = document.createElement("img");
          img.src = box.getAttribute("data-src");
          img.alt = box.getAttribute("data-alt") || "";
          box.replaceChildren(img);
          box.setAttribute("data-state", "error");
          box.removeAttribute("aria-busy");
        }).then(function () { running -= 1; pump(); });
      })(el);
    }
  };
  var lazy = Array.prototype.slice.call(document.querySelectorAll(".lazy-art[data-src]"));
  if ("IntersectionObserver" in window) {
    var watcher = new IntersectionObserver(function (changes) {
      changes.forEach(function (change) {
        if (!change.isIntersecting) return;
        watcher.unobserve(change.target);
        change.target.setAttribute("data-state", "load");
        queue.push(change.target);
      });
      pump();
    }, { rootMargin: "900px 0px" });
    lazy.forEach(function (box) { box.setAttribute("data-state", "wait"); watcher.observe(box); });
  } else lazy.forEach(function (box) { queue.push(box); pump(); });

  // ---- The gallery's index: a filter over the pictures' names, and the groups as buttons. ----
  var filter = document.getElementById("g-filter");
  if (filter) {
    var tiles = Array.prototype.slice.call(document.querySelectorAll(".hub-tile[data-text]"));
    var groups = Array.prototype.slice.call(document.querySelectorAll(".hub-section[data-group]"));
    var tally = document.getElementById("g-filter-count");
    var none = document.getElementById("g-none");
    var only = "";
    var apply = function () {
      var terms = fold(filter.value).split(/\s+/).filter(Boolean);
      var total = 0;
      tiles.forEach(function (tile) {
        var group = tile.closest(".hub-section");
        var text = tile.getAttribute("data-text");
        var hit = terms.every(function (term) { return text.indexOf(term) >= 0; }) && (only === "" || (group && group.getAttribute("data-group") === only));
        tile.hidden = !hit;
        if (hit) total += 1;
      });
      groups.forEach(function (group) { group.hidden = group.querySelectorAll(".hub-tile:not([hidden])").length === 0; });
      if (tally) tally.textContent = terms.length === 0 && only === "" ? "" : say("galleryShown").replace("{n}", String(total));
      if (none) none.hidden = total !== 0;
    };
    filter.addEventListener("input", apply);
    document.querySelectorAll("button[data-group-filter]").forEach(function (button) {
      button.addEventListener("click", function () {
        var chosenGroup = button.getAttribute("data-group-filter");
        only = only === chosenGroup ? "" : chosenGroup;
        document.querySelectorAll("button[data-group-filter]").forEach(function (other) { other.setAttribute("aria-pressed", String(other.getAttribute("data-group-filter") === only)); });
        apply();
      });
    });
  }

  // ---- The words, in the page's language. ----
  window.kyDocs = {
    setLanguage: function (next) {
      lang = next === "ja" ? "ja" : "en";
      document.querySelectorAll("[data-docs-copy-label]").forEach(function (el) { el.textContent = say("docsCopy"); });
      document.querySelectorAll("button[data-copy-pre]").forEach(function (el) { el.textContent = say("docsCopy"); });
      document.querySelectorAll("[data-ja]").forEach(function (el) { if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.textContent); el.textContent = lang === "ja" ? el.getAttribute("data-ja") : el.getAttribute("data-en"); });
      if (box && box.value.trim() !== "") render();
      if (filter) filter.dispatchEvent(new Event("input"));
    },
  };
})();
