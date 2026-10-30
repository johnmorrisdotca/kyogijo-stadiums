// Made by scripts/build-venues.mjs from the files of data-sources/venues/ (read 2026-10-20): do not edit by hand. One venue of src/venues.osm.data.ts, for a page that draws it.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each venue's building outline (the way OpenStreetMap tags with the
// venue's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the building's height where OpenStreetMap maps one, and the ice where OpenStreetMap maps it. The package is MIT;
// this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (`VENUE_ATTRIBUTION`). Nothing in a CC0
// or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/venues/.
import type { VenueOsm } from "../venues.ts";

export const OSM: VenueOsm = {
  "source": "way/25123637",
  "read": "2026-10-20",
  "base": "2026-10-20T23:09:50Z",
  "licence": "ODbL-1.0",
  "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
  "axis": {"heading": 55.2, "basis": "mapped", "strength": 2.58, "elongation": 2.35, "centre": [-71.062137,42.366296]},
  "ring": [
    [-71.06307, 42.366355],
    [-71.06303, 42.366315],
    [-71.063087, 42.366282],
    [-71.062746, 42.365927],
    [-71.062849, 42.365851],
    [-71.062599, 42.365592],
    [-71.061116, 42.366377],
    [-71.061391, 42.366576],
    [-71.061777, 42.366999],
    [-71.061794, 42.366992],
    [-71.061821, 42.367016],
    [-71.061927, 42.366958],
    [-71.061944, 42.366971],
  ],
  "ice": { "source": "way/837727439", "ring": [[-71.061768, 42.366354], [-71.061776, 42.366342], [-71.061789, 42.366333], [-71.062306, 42.366067], [-71.062323, 42.366062], [-71.062341, 42.36606], [-71.062359, 42.366063], [-71.062376, 42.36607], [-71.062388, 42.366081], [-71.062504, 42.366205], [-71.06251, 42.366218], [-71.06251, 42.366232], [-71.062504, 42.366246], [-71.062492, 42.366257], [-71.061974, 42.366523], [-71.061958, 42.36653], [-71.061939, 42.366533], [-71.06192, 42.366531], [-71.061904, 42.366525], [-71.061891, 42.366517], [-71.061775, 42.366393], [-71.061767, 42.36638], [-71.061765, 42.366367]] },
};
