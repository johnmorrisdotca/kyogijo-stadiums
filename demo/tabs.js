// Folds that stood one under another (facts, the choices, print, the table) become tabs: one pane on the screen at a time, chosen by a row of
// buttons, so what is chosen and its options are on one screen and nothing has to be scrolled past (John, 2026-11-02, KYOGIJO-STADIUMS-18:
// "I hate having to scroll all the way down to see stuff"). The markup stays a run of <details data-pane> with a <summary> each, so a page
// without script still has its folds; the script opens them all, hides their summaries and draws a row of tabs from the summaries' words (kept
// in step as the language changes) and from each pane's `hidden`. `data-pane-default` names the pane shown first.
// Arrow keys, Home and End move between tabs. Call `panesToTabs()` once, after the page has made its words.

const STYLE = `
.pane-tabs { display: inline-flex; flex-wrap: wrap; gap: 4px; margin: 12px 0 0; padding: 3px; background: var(--card); border: 1px solid var(--line); border-radius: 999px; max-width: 100%; }
.pane-tabs button { font: inherit; font-size: .95rem; font-weight: 700; min-height: var(--hit, 48px); padding: 0 18px; border-radius: 999px; border: 0; background: transparent; color: var(--ink); cursor: pointer; }
.pane-tabs button:hover:not([aria-selected="true"]) { background: color-mix(in srgb, var(--ink) 8%, transparent); }
.pane-tabs button[aria-selected="true"] { background: var(--tab, var(--ink)); color: var(--tab-ink, var(--bg)); }
details.pane > summary { display: none; }
details.pane:not(.pane-on) { display: none; }
details.pane { margin-top: 8px; }
@media (max-width: 600px) { .pane-tabs button { flex: 1 1 auto; padding: 0 12px; } }
`;

/** Make tabs of every run of `details[data-pane]` that share a parent. */
export function panesToTabs(root = document) {
  if (!root.querySelector("details[data-pane]")) return;
  if (!document.getElementById("pane-tabs-style")) {
    const style = document.createElement("style");
    style.id = "pane-tabs-style";
    style.textContent = STYLE;
    document.head.append(style);
  }
  const groups = new Map();
  for (const pane of root.querySelectorAll("details[data-pane]")) {
    const list = groups.get(pane.parentElement) ?? [];
    list.push(pane);
    groups.set(pane.parentElement, list);
  }
  for (const panes of groups.values()) tabsOf(panes);
}

function tabsOf(panes) {
  const bar = document.createElement("div");
  bar.className = "pane-tabs";
  bar.setAttribute("role", "tablist");
  bar.dataset.testid = "pane-tabs";
  panes[0].before(bar);
  const tabs = panes.map((pane, i) => {
    pane.open = true;
    pane.classList.add("pane");
    pane.setAttribute("role", "tabpanel");
    const tab = document.createElement("button");
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.id = `tab-${pane.id || i}`;
    tab.dataset.pane = pane.id || String(i);
    if (pane.id) tab.setAttribute("aria-controls", pane.id);
    pane.setAttribute("aria-labelledby", tab.id);
    bar.append(tab);
    return tab;
  });
  const visible = () => panes.filter((pane) => !pane.hidden);
  function sync() {
    panes.forEach((pane, i) => {
      tabs[i].textContent = pane.querySelector("summary")?.textContent ?? "";
      tabs[i].hidden = pane.hidden;
    });
    // The pane that was shown went away (a page hid it): show the first one left.
    if (!panes.some((pane) => pane.classList.contains("pane-on") && !pane.hidden)) show(visible()[0]);
    bar.hidden = visible().length < 2;
  }
  function show(chosen) {
    panes.forEach((pane, i) => {
      const on = pane === chosen;
      pane.classList.toggle("pane-on", on);
      tabs[i].setAttribute("aria-selected", String(on));
      tabs[i].tabIndex = on ? 0 : -1;
    });
  }
  bar.addEventListener("click", (event) => {
    const tab = event.target.closest("button");
    if (tab) show(panes[tabs.indexOf(tab)]);
  });
  bar.addEventListener("keydown", (event) => {
    const shown = tabs.filter((tab) => !tab.hidden);
    const at = shown.indexOf(document.activeElement);
    const to = event.key === "ArrowRight" ? at + 1 : event.key === "ArrowLeft" ? at - 1 : event.key === "Home" ? 0 : event.key === "End" ? shown.length - 1 : -1;
    if (to < 0 || at < 0) return;
    event.preventDefault();
    const next = shown[(to + shown.length) % shown.length];
    next.focus();
    show(panes[tabs.indexOf(next)]);
  });
  const watch = new MutationObserver(sync);
  for (const pane of panes) {
    watch.observe(pane, { attributes: true, attributeFilter: ["hidden"] });
    const summary = pane.querySelector("summary");
    if (summary) watch.observe(summary, { childList: true, characterData: true, subtree: true });
  }
  show(panes.find((pane) => pane.hasAttribute("data-pane-default") && !pane.hidden) ?? visible()[0]);
  sync();
}
