// Made by scripts/build-venues.mjs from the files of data-sources/venues/ (read 2026-10-20): do not edit by hand. One venue of src/venues.osm.data.ts, for a page that draws it.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each venue's building outline (the way OpenStreetMap tags with the
// venue's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the building's height where OpenStreetMap maps one, and the ice where OpenStreetMap maps it. The package is MIT;
// this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (`VENUE_ATTRIBUTION`). Nothing in a CC0
// or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/venues/.
import type { VenueOsm } from "../venues.ts";

export const OSM: VenueOsm = {
  "source": "way/14869890",
  "read": "2026-10-20",
  "base": "2026-10-20T21:40:19Z",
  "licence": "ODbL-1.0",
  "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
  "height": 15,
  "axis": {"heading": 162, "basis": "building", "strength": 2.55, "elongation": 1.57, "centre": [-97.143717,49.892609]},
  "ring": [
    [-97.144608, 49.893039],
    [-97.144619, 49.893025],
    [-97.144553, 49.892939],
    [-97.144589, 49.892931],
    [-97.144197, 49.892203],
    [-97.144242, 49.892143],
    [-97.144286, 49.892134],
    [-97.144231, 49.892033],
    [-97.144188, 49.892043],
    [-97.14403, 49.891994],
    [-97.14399, 49.891921],
    [-97.143964, 49.891914],
    [-97.143862, 49.891938],
    [-97.143868, 49.891949],
    [-97.142843, 49.892177],
    [-97.142852, 49.892194],
    [-97.142835, 49.892198],
    [-97.14287, 49.89226],
    [-97.142887, 49.892256],
    [-97.143448, 49.89329],
    [-97.143472, 49.893397],
    [-97.143544, 49.893435],
    [-97.143634, 49.893423],
    [-97.143674, 49.893381],
  ],
};
