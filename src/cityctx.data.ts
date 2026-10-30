// Made by scripts/build-cityctx.mjs from the files of data-sources/cityctx/: do not edit by hand.
//
// Every area of the surroundings of Seattle and of Vancouver's water and trees, joined: the cityctx entry. The data is in one file for each area (src/cityctx.<area>.data.ts, OpenStreetMap, ODbL 1.0, with the Cities' open data,
// each file saying so at its head), so that a page that shows one area carries only that one: import the area's file, or ask `loadArea` of the `areas` entry for it. This file is only the list.
import type { ContextArea } from "./context.ts";
import { VANCOUVER_NATURE } from "./cityctx.vancouver-nature.data.ts";
import { SEATTLE_SODO } from "./cityctx.seattle-sodo.data.ts";
import { SEATTLE_CENTER } from "./cityctx.seattle-center.data.ts";
import { SEATTLE_CITY } from "./cityctx.seattle-city.data.ts";
import { NYC_MIDTOWN } from "./cityctx.nyc-midtown.data.ts";
import { NYC_BRONX } from "./cityctx.nyc-bronx.data.ts";
import { NYC_FLUSHING } from "./cityctx.nyc-flushing.data.ts";
import { NYC_BROOKLYN } from "./cityctx.nyc-brooklyn.data.ts";
import { MEADOWLANDS } from "./cityctx.meadowlands.data.ts";
import { BELMONT_PARK } from "./cityctx.belmont-park.data.ts";
import { MONTREAL_DOWNTOWN } from "./cityctx.montreal-downtown.data.ts";
import { MONTREAL_OLYMPIC } from "./cityctx.montreal-olympic.data.ts";
import { MONTREAL_CITY } from "./cityctx.montreal-city.data.ts";

export { VANCOUVER_NATURE, SEATTLE_SODO, SEATTLE_CENTER, SEATTLE_CITY, NYC_MIDTOWN, NYC_BRONX, NYC_FLUSHING, NYC_BROOKLYN, MEADOWLANDS, BELMONT_PARK, MONTREAL_DOWNTOWN, MONTREAL_OLYMPIC, MONTREAL_CITY };

/** Every area, by key. */
export const CITYCTX_AREAS: Readonly<Record<string, ContextArea>> = { "vancouver-nature": VANCOUVER_NATURE, "seattle-sodo": SEATTLE_SODO, "seattle-center": SEATTLE_CENTER, "seattle-city": SEATTLE_CITY, "nyc-midtown": NYC_MIDTOWN, "nyc-bronx": NYC_BRONX, "nyc-flushing": NYC_FLUSHING, "nyc-brooklyn": NYC_BROOKLYN, "meadowlands": MEADOWLANDS, "belmont-park": BELMONT_PARK, "montreal-downtown": MONTREAL_DOWNTOWN, "montreal-olympic": MONTREAL_OLYMPIC, "montreal-city": MONTREAL_CITY };
