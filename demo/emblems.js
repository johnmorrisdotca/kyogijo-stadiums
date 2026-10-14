// The demo's ready-made emblems: Dougu Sports (copied into ./dougu by `pnpm site`), plugged into the package with `useEmblems`, which is all a page needs to do. This module is the one
// place that plugs it in, for the page's script and for the build (scripts/site.mjs), which runs the same code to write the first view into the HTML.
import { useEmblems } from "./dist/index.js";
import { EMBLEM_GROUPS, emblemName, renderEmblem } from "./dougu/emblems-entry.js";

useEmblems(renderEmblem);

export { EMBLEM_GROUPS, emblemName, renderEmblem };
