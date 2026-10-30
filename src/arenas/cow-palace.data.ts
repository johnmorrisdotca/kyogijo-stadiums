// Made by scripts/build-arenas.mjs from scripts/arenas.data.json: do not edit by hand. One record of src/arenas.data.ts, for a page that draws this venue alone.
import type { ArenaData } from "../arenas.core.ts";

export const ARENA: ArenaData = {
    "id": "cow-palace",
    "wikidata": "Q604015",
    "name": "Cow Palace",
    "names": [
      {"name": "California State Livestock Pavilion", "from": 1941, "to": 1944}
    ],
    "nameJa": "カウ・パレス",
    "aliases": [
      {"name": "Cow Palace", "lang": "en", "kind": "wikipedia", "revision": 1372078143, "source": "en.wikipedia.org"},
      {"name": "California State Livestock Pavilion", "lang": "en", "kind": "former", "from": 1941, "to": 1944, "source": "en.wikipedia.org revision 1372078143 (the infobox's former names)"}
    ],
    "city": "Daly City",
    "country": "US",
    "lat": 37.70667,
    "lon": -122.41861,
    "status": "past",
    "from": 1941,
    "to": 1993,
    "capacity": {"hockey": 13550, "basketball": 14000},
    "rinkUnknown": true,
    "note": "The article says the rink was smaller than the NHL's and gives no figure: it is drawn at the NHL's size.",
    "en": {"title": "Cow Palace", "revision": 1372078143},
  };
