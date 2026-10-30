// Made by scripts/build-venues.mjs from the files of data-sources/venues/ (read 2026-10-20): do not edit by hand. One venue of src/venues.osm.data.ts, for a page that draws it.
//
// THIS FILE IS ODbL 1.0 DATA FROM OPENSTREETMAP: "(c) OpenStreetMap contributors", https://www.openstreetmap.org/copyright. It holds each venue's building outline (the way OpenStreetMap tags with the
// venue's Wikidata item, simplified to a metre, longitude and latitude to six decimals), the building's height where OpenStreetMap maps one, and the ice where OpenStreetMap maps it. The package is MIT;
// this file is a derived database under the ODbL, offered under it with the credit above. The drawings made from it are produced works and need only the credit (`VENUE_ATTRIBUTION`). Nothing in a CC0
// or CC BY-SA file of the package is copied from here or into here. The raw responses are in data-sources/venues/.
import type { VenueOsm } from "../venues.ts";

export const OSM: VenueOsm = {
  "source": "way/130358195",
  "read": "2026-10-20",
  "base": "2026-10-20T23:22:53Z",
  "licence": "ODbL-1.0",
  "attribution": "(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright",
  "axis": {"heading": 18.7, "basis": "mapped", "strength": 1.79, "elongation": 2.39, "centre": [-79.989505,40.439603]},
  "ring": [
    [-79.989854, 40.440254],
    [-79.989909, 40.440307],
    [-79.990005, 40.440296],
    [-79.9901, 40.440161],
    [-79.990195, 40.439974],
    [-79.990292, 40.439651],
    [-79.990384, 40.439439],
    [-79.99053, 40.439233],
    [-79.990296, 40.438953],
    [-79.990078, 40.438934],
    [-79.990083, 40.438897],
    [-79.989229, 40.438858],
    [-79.989226, 40.438894],
    [-79.989057, 40.438886],
    [-79.989055, 40.438914],
    [-79.988816, 40.438905],
    [-79.988719, 40.440196],
    [-79.989007, 40.44027],
    [-79.98901, 40.440339],
    [-79.989308, 40.440343],
  ],
  "ice": { "source": "way/1557965070", "ring": [[-79.989472, 40.439913], [-79.989488, 40.439914], [-79.989506, 40.43991], [-79.989527, 40.439903], [-79.989547, 40.439891], [-79.989558, 40.439881], [-79.989768, 40.439405], [-79.989766, 40.439391], [-79.989757, 40.439374], [-79.989747, 40.439359], [-79.989735, 40.439347], [-79.989724, 40.43934], [-79.989538, 40.439292], [-79.989521, 40.43929], [-79.989508, 40.439291], [-79.989489, 40.439295], [-79.989475, 40.439304], [-79.989465, 40.439313], [-79.989455, 40.439323], [-79.989242, 40.439801], [-79.989242, 40.439814], [-79.989244, 40.439828], [-79.98925, 40.43984], [-79.989262, 40.439851], [-79.989271, 40.439859], [-79.989286, 40.439865]] },
};
