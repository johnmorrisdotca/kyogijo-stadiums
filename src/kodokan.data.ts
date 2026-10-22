// Made by scripts/build-plateau.mjs from data-sources/plateau/2026-10-22/: do not edit by hand.
//
// THIS FILE IS DATA FROM PROJECT PLATEAU, edited: the Kodokan's building (its roof-edge outline simplified to 0.3 metres, its height and its storeys, from MLIT's 3D city model of Bunkyo ward, 2025 edition) and where the main dojo's
// room is put in it (worked out here from the outline, ours). The credit is `PLATEAU_ATTRIBUTION` (plateau.credit.ts), the terms the PLATEAU Site Policy's (free, commercial use included, compatible with CC BY 4.0). Apart from the
// OpenStreetMap data (ODbL 1.0); nothing is copied from one to the other. The raw extract is in data-sources/plateau/.

/** The Kodokan's building and the place of its main dojo in it. */
export const KODOKAN_BUILDING = {
  /** The building's id in PLATEAU's file (bldg:Building gml:id). */
  "source": "bldg_ec4aa7a9-f8cb-4abb-af0c-a2cef6d06dd8",
  "read": "2026-10-22",
  /** The roof-edge outline, `[longitude, latitude]`. */
  "ring": [[139.753281,35.707485],[139.753287,35.707464],[139.753659,35.707456],[139.753548,35.707846],[139.753502,35.707837],[139.753496,35.707859],[139.753195,35.707801],[139.753268,35.707546],[139.753193,35.707532],[139.75321,35.707472]],
  /** The height of the building's top above its ground, in metres, and its storeys above ground. */
  "height": 43.1,
  "storeys": 8,
  /** The middle of the main dojo's room, `[longitude, latitude]`, the compass heading of its x axis (0 to under 180) and the length of its side in metres, walls and gallery included. */
  "room": { "centre": [139.75342,35.707654], "heading": 77, "side": 31.8, "clearance": 0.18 },
  /** The rooms of the 5th and 6th floors: each floor's heading (of its rooms' x axis), and for each room its count in jo, its size in metres (the dojo builder's shape for the count) and the middle of it, `[longitude, latitude]`. Ours but the counts. */
  "floors": {"5":{"heading":167,"clearance":2.59,"rooms":[{"id":"womens","jo":240,"w":27.3,"l":14.56,"centre":[139.753353,35.707641]},{"id":"boys","jo":114,"w":17.29,"l":10.92,"centre":[139.75352,35.707624]},{"id":"special","jo":40,"w":9.1,"l":7.28,"centre":[139.753483,35.707752]}]},"6":{"heading":77,"clearance":2.43,"rooms":[{"id":"school","jo":240,"w":27.3,"l":14.56,"centre":[139.7534,35.707724]},{"id":"international","jo":192,"w":21.84,"l":14.56,"centre":[139.75344,35.707583]}]}},
} as const;
