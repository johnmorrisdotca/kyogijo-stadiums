// Made by scripts/build-stadiums.mjs from the files of data-sources/stadiums/2026-10-20/: do not edit by hand.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each stadium's building outline (the way OpenStreetMap tags with the
// stadium's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the roof OpenStreetMap maps over it (its heights and the opening in it) and the axis worked out from them. The package is
// MIT; this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (`VENUE_ATTRIBUTION`). Nothing in a CC0 or
// CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/stadiums/.
import type { StadiumOsm } from "./stadiums.ts";

export const STADIUM_OSM: Record<string, StadiumOsm> = {
  "bc-place": {
    "source": "way/24705904",
    "read": "2026-10-20",
    "base": "2026-10-20T21:46:16Z",
    "licence": "ODbL-1.0",
    "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
    "axis": {"heading": 52.8, "basis": "opening", "strength": 1.47, "elongation": 1.19, "centre": [-123.112002,49.276698]},
    "roof": {
      "source": "relation/5836463",
      "height": 61,
      "rise": 13,
      "outer": "way/390133856",
      "opening": { "source": "way/390133855", "ring": [
        [-123.111972, 49.277139],
        [-123.112337, 49.277016],
        [-123.112599, 49.276841],
        [-123.112723, 49.276687],
        [-123.112664, 49.276512],
        [-123.11246, 49.276337],
        [-123.112245, 49.276253],
        [-123.112009, 49.276257],
        [-123.111607, 49.276414],
        [-123.111323, 49.276614],
        [-123.111296, 49.276806],
        [-123.111403, 49.276943],
        [-123.111564, 49.277065],
        [-123.111757, 49.277146],
      ] },
    },
    "ring": [
      [-123.113517, 49.276312],
      [-123.113285, 49.276073],
      [-123.112893, 49.275773],
      [-123.112614, 49.275683],
      [-123.112399, 49.27566],
      [-123.112137, 49.275686],
      [-123.11166, 49.275795],
      [-123.111225, 49.275999],
      [-123.110853, 49.276199],
      [-123.110572, 49.276409],
      [-123.110433, 49.276556],
      [-123.110371, 49.276724],
      [-123.110396, 49.276902],
      [-123.110692, 49.277303],
      [-123.111152, 49.277629],
      [-123.111379, 49.277714],
      [-123.111649, 49.277751],
      [-123.111894, 49.277728],
      [-123.112475, 49.277543],
      [-123.112833, 49.277379],
      [-123.113189, 49.27718],
      [-123.113573, 49.276831],
      [-123.113643, 49.276657],
      [-123.113623, 49.276478],
    ],
  },
};
