// Made by scripts/build-venues.mjs from the files of data-sources/venues/ (read 2026-10-20): do not edit by hand. One venue of src/venues.osm.data.ts, for a page that draws it.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each venue's building outline (the way OpenStreetMap tags with the
// venue's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the building's height where OpenStreetMap maps one, and the ice where OpenStreetMap maps it. The package is MIT;
// this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (`VENUE_ATTRIBUTION`). Nothing in a CC0
// or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/venues/.
import type { VenueOsm } from "../venues.ts";

export const OSM: VenueOsm = {
  "source": "way/19911284",
  "read": "2026-10-20",
  "base": "2026-10-20T23:14:51Z",
  "licence": "ODbL-1.0",
  "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
  "axis": {"heading": 132, "basis": "building", "strength": 2.28, "elongation": 1.53, "centre": [-73.569281,45.496067]},
  "ring": [
    [-73.570363, 45.496182],
    [-73.569576, 45.496827],
    [-73.569294, 45.496653],
    [-73.569259, 45.496681],
    [-73.568425, 45.496166],
    [-73.568449, 45.496144],
    [-73.568418, 45.496124],
    [-73.568329, 45.496108],
    [-73.5683, 45.496056],
    [-73.568168, 45.495975],
    [-73.56905, 45.495279],
    [-73.569731, 45.49569],
    [-73.570154, 45.495977],
    [-73.570107, 45.496015],
  ],
};
