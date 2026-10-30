// Made by scripts/build-arenas.mjs from scripts/arenas.data.json: do not edit by hand. One record of src/arenas.data.ts, for a page that draws this venue alone.
import type { ArenaData } from "../arenas.core.ts";

export const ARENA: ArenaData = {
    "id": "boston-garden",
    "wikidata": "Q894567",
    "name": "Boston Garden",
    "nameJa": "ボストン・ガーデン",
    "aliases": [
      {"name": "Boston Garden", "lang": "en", "kind": "wikipedia", "revision": 1379921964, "source": "en.wikipedia.org"},
      {"name": "ボストン・ガーデン", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q894567 sitelink"},
      {"name": "Boston Madison Square Garden", "lang": "en", "kind": "former", "source": "en.wikipedia.org revision 1379921964 (the infobox's former names)"}
    ],
    "city": "Boston",
    "country": "US",
    "lat": 42.3657,
    "lon": -71.06172,
    "status": "past",
    "from": 1928,
    "to": 1995,
    "closed": 1995,
    "demolished": 1998,
    "capacity": {"hockey": 14448, "basketball": 14890},
    "rink": [
      {"length": 58.2, "width": 25.3, "unit": "m", "source": "en.wikipedia.org \"Boston Garden\" revision 1379921964: the hockey rink was undersized at 58.2 by 25.3 metres, nine feet shorter and two feet narrower than the NHL's 200 by 85 feet"}
    ],
    "en": {"title": "Boston Garden", "revision": 1379921964},
  };
