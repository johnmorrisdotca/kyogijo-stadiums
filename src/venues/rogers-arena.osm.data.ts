// Made by scripts/build-venues.mjs from the files of data-sources/venues/ (read 2026-10-20): do not edit by hand. One venue of src/venues.osm.data.ts, for a page that draws it.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each venue's building outline (the way OpenStreetMap tags with the
// venue's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the building's height where OpenStreetMap maps one, and the ice where OpenStreetMap maps it. The package is MIT;
// this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (`VENUE_ATTRIBUTION`). Nothing in a CC0
// or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/venues/.
import type { VenueOsm } from "../venues.ts";

export const OSM: VenueOsm = {
  "source": "way/24705911",
  "read": "2026-10-20",
  "base": "2026-10-20T19:40:35Z",
  "licence": "ODbL-1.0",
  "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
  "axis": {"heading": 102, "basis": "building", "strength": 1.41, "elongation": 1.8, "centre": [-123.108759,49.277775]},
  "ring": [
    [-123.109011, 49.278442],
    [-123.108814, 49.278491],
    [-123.108793, 49.278382],
    [-123.108555, 49.278355],
    [-123.108011, 49.278089],
    [-123.107932, 49.277975],
    [-123.107822, 49.277973],
    [-123.107839, 49.277355],
    [-123.108512, 49.277358],
    [-123.109354, 49.27747],
    [-123.109445, 49.2775],
    [-123.109531, 49.277551],
    [-123.109677, 49.277582],
    [-123.110122, 49.277768],
    [-123.110143, 49.277815],
    [-123.110126, 49.277856],
    [-123.110033, 49.277924],
  ],
};
