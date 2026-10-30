// Made by scripts/build-arenas.mjs from scripts/arenas.data.json: do not edit by hand. One record of src/arenas.data.ts, for a page that draws this venue alone.
import type { ArenaData } from "../arenas.core.ts";

export const ARENA: ArenaData = {
    "id": "matthews-arena",
    "wikidata": "Q919959",
    "name": "Matthews Arena",
    "names": [
      {"name": "Boston Arena", "from": 1909, "to": 1982}
    ],
    "nameJa": "マシューズ・アリーナ",
    "aliases": [
      {"name": "Matthews Arena", "lang": "en", "kind": "wikipedia", "revision": 1372084660, "source": "en.wikipedia.org"},
      {"name": "Boston Arena", "lang": "en", "kind": "former", "from": 1909, "to": 1982, "source": "en.wikipedia.org revision 1372084660 (the infobox's former names)"}
    ],
    "city": "Boston",
    "country": "US",
    "lat": 42.3411,
    "lon": -71.0844,
    "status": "past",
    "from": 1910,
    "to": 1973,
    "closed": 2025,
    "demolished": 2026,
    "capacity": {"hockey": 4666, "basketball": 5066},
    "rink": [
      {"length": 220, "width": 90, "unit": "ft", "to": 1971, "source": "en.wikipedia.org \"Matthews Arena\" revision 1372084660: the original ice surface was 220 by 90 feet, until it was reduced before the Whalers began play in 1972"},
      {"length": 200, "width": 80, "unit": "ft", "from": 1972, "to": 1994, "source": "en.wikipedia.org \"Matthews Arena\" revision 1372084660: reduced to 200 by 80 feet, which stood until the renovation of 1995"},
      {"length": 200, "width": 90, "unit": "ft", "from": 1995, "source": "en.wikipedia.org \"Matthews Arena\" revision 1372084660: the 1995 renovation widened the ice from 200 by 80 to 200 by 90 feet"}
    ],
    "en": {"title": "Matthews Arena", "revision": 1372084660},
  };
