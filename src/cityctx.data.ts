// Made by scripts/build-cityctx.mjs from the files of data-sources/cityctx/2026-10-22/: do not edit by hand.
//
// Every area of the surroundings of Seattle and of Vancouver's water and trees, joined: the cityctx entry. The data is in one file for each area (src/cityctx.<area>.data.ts, OpenStreetMap, ODbL 1.0, with the Cities' open data,
// each file saying so at its head), so that a page that shows one area carries only that one: import the area's file, or ask `loadArea` of the `areas` entry for it. This file is only the list.
import type { ContextArea } from "./context.ts";
import { VANCOUVER_NATURE } from "./cityctx.vancouver-nature.data.ts";
import { SEATTLE_SODO } from "./cityctx.seattle-sodo.data.ts";
import { SEATTLE_CENTER } from "./cityctx.seattle-center.data.ts";
import { SEATTLE_CITY } from "./cityctx.seattle-city.data.ts";

export { VANCOUVER_NATURE, SEATTLE_SODO, SEATTLE_CENTER, SEATTLE_CITY };

/** Every area, by key. */
export const CITYCTX_AREAS: Readonly<Record<string, ContextArea>> = { "vancouver-nature": VANCOUVER_NATURE, "seattle-sodo": SEATTLE_SODO, "seattle-center": SEATTLE_CENTER, "seattle-city": SEATTLE_CITY };
