// The two pages that lead into the rest of the docs site, made from code so that they show live pictures: the home page's block (`<!-- site:home -->` in docs/README.md) and
// the gallery's index (`<!-- site:gallery-index -->` in docs/gallery.md). Each is a set of tiles: a sport or a place with a picture, a line, and links to its guide and its pictures.
// The pictures of the sports and of the real venues are the gallery's own drawings, drawn when they come near the screen (docs.js), never all at once; the 3D views of places are
// stills of the demo with a link to the live page.
import { existsSync } from "node:fs";
import { join } from "node:path";

import { GALLERY_GROUPS, NAV, PLACES, SPORTS } from "./docs-nav.mjs";
import { escapeHtml, pictureHtml } from "./docs-pages.mjs";
import { lazyArt } from "./docs-gallery.mjs";

const DEMO = "https://johnmorrisdotca.github.io/kyogijo-stadiums/";
const fold = (text) => String(text).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
const dataJa = (en, ja) => `data-ja="${escapeHtml(ja)}"`;

/** The gallery's pages by slug and its items by id: `{ pages: Map(slug -> page), items: Map(id -> { entry, page, section }) }`. */
export function galleryIndex(gallery) {
  const pages = new Map(gallery.map((page) => [page.slug, page]));
  const items = new Map();
  for (const page of gallery) for (const section of page.sections) for (const entry of section.items) items.set(entry.id, { entry, page, section });
  return { pages, items };
}

const countOf = (page) => page.sections.reduce((sum, section) => sum + section.items.length, 0);

/** The tiles a gallery page's entry in a sport asks for: a section's first items, one item, or the first item of each section of the page. */
function tilesFor(spec, index, limit) {
  const page = index.pages.get(spec.slug);
  if (page === undefined) throw new Error(`docs-nav.mjs names the gallery page "${spec.slug}", which the gallery does not have`);
  const section = page.sections.find((one) => one.id === spec.at);
  if (spec.at && section === undefined) {
    const found = index.items.get(spec.at);
    if (found === undefined || found.page.slug !== spec.slug) throw new Error(`docs-nav.mjs names "${spec.at}" on ${spec.slug}, which is neither a section nor a picture of it`);
    return [found];
  }
  if (section !== undefined) return section.items.slice(0, limit).map((entry) => ({ entry, page, section }));
  return page.sections.slice(0, limit).map((one) => ({ entry: one.items[0], page, section: one }));
}

/** A tile with a live drawing: the picture, its name, a line, the link to it in its gallery page, and a button that copies its code. */
function liveTile({ entry, page, section }, { title, blurb, extra = "" } = {}) {
  const text = fold(`${entry.title} ${entry.id} ${section.title} ${page.title}`);
  return `<li class="hub-tile" data-text="${escapeHtml(text)}" data-testid="gallery-tile">
  <a class="hub-main" href="${page.slug}.html#${entry.id}"><div class="hub-art">${lazyArt(entry)}</div><div class="hub-body"><h3>${escapeHtml(title ?? entry.title)}</h3>${blurb ? `<p>${escapeHtml(blurb)}</p>` : ""}</div></a>
  <div class="hub-links">${extra}<button type="button" class="fam-button" data-copy-code="${escapeHtml(entry.code)}" aria-label="Copy the code of ${escapeHtml(entry.title)}" data-testid="tile-copy"><span data-docs-copy-label>Copy</span></button><span class="g-status" role="status" aria-live="polite"></span></div>
</li>`;
}

/** The picture of a place: the still of its 3D view (a light file with a dark twin under docs/images or docs/pictures), or three stills side by side. */
function placeArt(place, root) {
  const files = Array.isArray(place.picture) ? place.picture : [place.picture];
  const one = (base, alt) => {
    const file = `docs/${base}-light.webp`;
    if (!existsSync(join(root, file))) throw new Error(`docs-nav.mjs names the picture ${file}, which does not exist`);
    return pictureHtml({ url: `${base}-light.webp`, file, alt, root });
  };
  return `<div class="hub-art hub-art--photo${files.length > 1 ? " hub-art--strip" : ""}">${files.map((base) => one(base, `${place.en}: ${place.blurb}`)).join("")}</div>`;
}

function placeTile(place, root) {
  const text = fold(`${place.en} ${place.ja} ${place.blurb} venue district 3d`);
  return `<li class="hub-tile" id="place-${place.id}" data-text="${escapeHtml(text)}" data-testid="place-tile">
  <a class="hub-main" href="${place.page}.html${place.at ? `#${place.at}` : ""}">${placeArt(place, root)}<div class="hub-body"><h3 ${dataJa(place.en, place.ja)}>${escapeHtml(place.en)}</h3><p>${escapeHtml(place.blurb)}</p></div></a>
  <div class="hub-links"><a href="${DEMO}${place.demo}" rel="noopener">${escapeHtml(place.demoEn)}</a></div>
</li>`;
}

/** The home page's block: the ways in, a tile for each sport, the places, and the tasks. */
export function homeBlock({ gallery, root }) {
  const index = galleryIndex(gallery);
  const sports = SPORTS.map((sport) => {
    const found = index.items.get(sport.thumb);
    if (found === undefined) throw new Error(`docs-nav.mjs: the picture "${sport.thumb}" of ${sport.id} is not in the gallery`);
    const guide = NAV.flatMap((one) => one.pages).find((page) => page.slug === sport.guide);
    if (guide === undefined) throw new Error(`docs-nav.mjs: the guide "${sport.guide}" of ${sport.id} is not a page`);
    const pictures = `gallery.html#${sport.id}`;
    return `<li class="hub-tile" id="sport-${sport.id}" data-testid="sport-tile">
  <a class="hub-main" href="${sport.guide}.html"><div class="hub-art">${lazyArt(found.entry)}</div><div class="hub-body"><h3 ${dataJa(sport.en, sport.ja)}>${escapeHtml(sport.en)}</h3><p>${escapeHtml(sport.blurb)}</p></div></a>
  <div class="hub-links"><a href="${sport.guide}.html" data-say="navGuide">Guide</a><a href="${pictures}" data-say="navPictures">Pictures</a></div>
</li>`;
  }).join("\n");
  const places = PLACES.map((place) => placeTile(place, root)).join("\n");
  const tasks = [
    { en: "Draw a game", blurb: "A surface with the teams and the score, in your colours.", links: [["getting-started", "Getting started"], ["examples", "Recipes"], ["score", "Score and layout"], ["theming", "Theming"]] },
    { en: "Show a real venue", blurb: "Arenas and stadiums in the outline of their buildings.", links: [["venues", "The thirty-two arenas"], ["stadiums", "Real stadiums"], ["district", "Districts"], ["roof-photos-needed", "What still needs a photo"]] },
    { en: "Turn it in 3D", blurb: "A floor that turns, the stands, the roof, the night.", links: [["turn", "The 3D view"], ["quality", "Quality levels"], ["flythrough", "The fly-through"], ["outside", "The crowd outside"]] },
    { en: "Put data on a surface", blurb: "Shots, heat maps, passes, a replay, in any provider's numbers.", links: [["layers", "Data layers"], ["charts", "Ready-made charts"], ["frames", "Coordinate frames"], ["replay", "Replay"]] },
    { en: "Lay out an event", blurb: "Several mats or tables on one floor, the judges, the boards.", links: [["multi", "Tournament layouts"], ["judging", "Who judges where"], ["boards", "Boards over a surface"], ["budo", "The budō"]] },
    { en: "Look something up", blurb: "Every entry, limit, source and the other packages.", links: [["entry-points", "Entry points"], ["limits", "Limits"], ["sources", "Sources of the dimensions"], ["compare", "How it compares"]] },
  ]
    .map((task) => `<li class="hub-task"><h3>${escapeHtml(task.en)}</h3><p>${escapeHtml(task.blurb)}</p><ul>${task.links.map(([slug, label]) => `<li><a href="${slug}.html">${escapeHtml(label)}</a></li>`).join("")}</ul></li>`)
    .join("\n");
  return `<div class="hub-actions"><a href="${DEMO}" data-primary rel="noopener">Open the demo</a><a href="getting-started.html">Getting started</a><a href="gallery.html">The gallery</a><a href="${DEMO}api.html" rel="noopener">API reference</a></div>
<section class="hub-section" aria-labelledby="by-sport"><h2 id="by-sport">Browse by sport</h2>
<p>Each sport with a picture drawn from its code, its guide and its pictures.</p>
<ul class="hub-tiles" data-testid="sport-tiles">
${sports}
</ul></section>
<section class="hub-section" aria-labelledby="by-place"><h2 id="by-place">Venues and districts</h2>
<p>Real buildings as OpenStreetMap maps them, in 3D, each with the page of the demo that shows it live.</p>
<ul class="hub-tiles" data-testid="place-tiles">
${places}
</ul></section>
<section class="hub-section" aria-labelledby="by-task"><h2 id="by-task">Browse by task</h2>
<ul class="hub-tasks">
${tasks}
</ul></section>
`;
}

/** The gallery index: a filter, the places, and a group of live tiles for each sport and kind of picture, each with links to the full pages. */
export function galleryIndexBlock({ gallery, root }) {
  const index = galleryIndex(gallery);
  const featured = ["venue-scotiabank-saddledome", "venue-madison-square-garden", "venue-bell-centre", "venue-climate-pledge-arena", "venue-rogers-arena", "stadium-bc-cfl", "stadium-lumen-nfl", "stadium-tokyo-dome", "stadium-koshien", "district-seattle", "district-tokyo", "arena-nhl-boston-garden"];
  const groupTiles = (group) => {
    if (group.id === "venues") {
      return featured.map((id) => {
        const found = index.items.get(id);
        if (found === undefined) throw new Error(`docs-hub.mjs: the featured picture "${id}" is not in the gallery`);
        return found;
      });
    }
    const sport = SPORTS.find((one) => one.id === group.id);
    if (sport !== undefined) {
      const seen = new Set();
      const tiles = [];
      for (const spec of sport.pages.filter((page) => page.slug.startsWith("gallery-"))) for (const tile of tilesFor(spec, index, 4)) if (!seen.has(tile.entry.id)) { seen.add(tile.entry.id); tiles.push(tile); }
      return tiles.slice(0, 8);
    }
    // A group of pages: the first picture of each section, one page after another, the pages taking turns.
    const lists = group.pages.map((slug) => tilesFor({ slug }, index, 12));
    const tiles = [];
    for (let i = 0; tiles.length < 8 && lists.some((one) => i < one.length); i += 1) for (const one of lists) if (i < one.length && tiles.length < 8) tiles.push(one[i]);
    return tiles;
  };
  const sections = GALLERY_GROUPS.map((group) => {
    const tiles = groupTiles(group);
    const pages = group.pages.map((slug) => {
      const page = index.pages.get(slug);
      if (page === undefined) throw new Error(`docs-nav.mjs: the gallery group ${group.id} names ${slug}, which the gallery does not have`);
      return page;
    });
    const total = pages.reduce((sum, page) => sum + countOf(page), 0);
    const sport = SPORTS.find((one) => one.id === group.id);
    const more = pages.map((page) => `<a href="${page.slug}.html">${escapeHtml(page.title.replace(/^Gallery: /, ""))} (${countOf(page)})</a>`).join("");
    return `<section class="hub-section" id="${group.id}" data-group="${group.id}" aria-labelledby="h-${group.id}">
<h2 id="h-${group.id}"><span ${dataJa(group.en, group.ja)}>${escapeHtml(group.en)}</span><span class="g-count">${total} pictures</span></h2>
<p>${escapeHtml(group.blurb)}${sport ? ` <a href="${sport.guide}.html">The guide</a>.` : ""}</p>
<ul class="hub-tiles">
${tiles.map((tile) => liveTile(tile)).join("\n")}
</ul>
<p class="hub-more"><strong>All of them:</strong>${more}</p>
</section>`;
  }).join("\n");
  const places = PLACES.map((place) => placeTile(place, root)).join("\n");
  const chips = GALLERY_GROUPS.map((group) => `<button type="button" aria-pressed="false" data-group-filter="${group.id}" ${dataJa(group.en, group.ja)}>${escapeHtml(group.en)}</button>`).join("");
  return `<div class="g-filter"><input class="fam-field" id="g-filter" type="search" autocomplete="off" data-say-label="galleryFilter" data-say-placeholder="galleryFilterPlaceholder" data-testid="gallery-filter" maxlength="60"><span class="g-filter-count" id="g-filter-count" role="status" aria-live="polite"></span></div>
<div class="g-chips" role="group" aria-label="Show one group">${chips}</div>
<p class="g-none" id="g-none" data-say="galleryNone" hidden></p>
<section class="hub-section" id="places" aria-labelledby="h-places"><h2 id="h-places">Real places in 3D</h2>
<p>Stills of the demo's 3D views, each with the page that shows it live: the new work of New York, Montreal and the Saddledome, the roof switch and the quality levels among it.</p>
<ul class="hub-tiles" data-testid="place-tiles">
${places}
</ul></section>
${sections}
`;
}
