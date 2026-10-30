// Made by scripts/build-arenas.mjs from scripts/arenas.data.json: do not edit by hand. One record of src/arenas.data.ts, for a page that draws this venue alone.
import type { ArenaData } from "../arenas.core.ts";

export const ARENA: ArenaData = {
    "id": "philadelphia-arena",
    "wikidata": "Q3378842",
    "name": "Philadelphia Arena",
    "names": [
      {"name": "Philadelphia Auditorium and Ice Palace", "from": 1920, "to": 1925},
      {"name": "The Arena", "from": 1925, "to": 1980},
      {"name": "Martin Luther King Jr Arena", "from": 1980, "to": 1983}
    ],
    "nameJa": "フィラデルフィア・アリーナ",
    "aliases": [
      {"name": "Philadelphia Arena", "lang": "en", "kind": "wikipedia", "revision": 1372214135, "source": "en.wikipedia.org"},
      {"name": "Philadelphia Auditorium and Ice Palace", "lang": "en", "kind": "former", "from": 1920, "to": 1925, "source": "en.wikipedia.org revision 1372214135 (the infobox's former names)"},
      {"name": "The Arena", "lang": "en", "kind": "former", "from": 1925, "to": 1980, "source": "en.wikipedia.org revision 1372214135 (the infobox's former names)"},
      {"name": "Martin Luther King Jr Arena", "lang": "en", "kind": "former", "from": 1980, "to": 1983, "source": "en.wikipedia.org revision 1372214135 (the infobox's former names)"}
    ],
    "city": "Philadelphia",
    "country": "US",
    "lat": 39.958,
    "lon": -75.2117,
    "status": "past",
    "from": 1920,
    "to": 1952,
    "closed": 1981,
    "demolished": 1983,
    "rink": [
      {"length": 220, "width": 101, "unit": "ft", "source": "en.wikipedia.org \"Philadelphia Arena\" revision 1372214135: the ice in the new arena (opened 1920) was 220 by 101 feet"}
    ],
    "en": {"title": "Philadelphia Arena", "revision": 1372214135},
  };
