// Made by scripts/build-venues.mjs from the files of data-sources/venues/ (read 2026-10-20): do not edit by hand. One venue of src/venues.osm.data.ts, for a page that draws it.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each venue's building outline (the way OpenStreetMap tags with the
// venue's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the building's height where OpenStreetMap maps one, and the ice where OpenStreetMap maps it. The package is MIT;
// this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (`VENUE_ATTRIBUTION`). Nothing in a CC0
// or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/venues/.
import type { VenueOsm } from "../venues.ts";

export const OSM: VenueOsm = {
  "source": "way/25123756",
  "read": "2026-10-20",
  "base": "2026-10-20T19:40:35Z",
  "licence": "ODbL-1.0",
  "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
  "height": 35,
  "axis": {"heading": 0, "basis": "building", "strength": 1.92, "elongation": 1.31, "centre": [-122.354005,47.622006]},
  "ring": [
    [-122.3548, 47.622659],
    [-122.354019, 47.622657],
    [-122.354018, 47.622796],
    [-122.353958, 47.622795],
    [-122.353959, 47.622657],
    [-122.353164, 47.622653],
    [-122.35317, 47.622115],
    [-122.352964, 47.622114],
    [-122.352964, 47.622073],
    [-122.35317, 47.622074],
    [-122.353177, 47.621539],
    [-122.353274, 47.62154],
    [-122.353271, 47.621365],
    [-122.353996, 47.621278],
    [-122.354722, 47.621372],
    [-122.35472, 47.621546],
    [-122.354813, 47.621546],
    [-122.354807, 47.622083],
    [-122.35499, 47.622084],
    [-122.35499, 47.622124],
    [-122.354806, 47.622124],
  ],
};
