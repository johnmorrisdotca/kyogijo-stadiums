// Made by scripts/build-arenas.mjs from scripts/arenas.data.json: do not edit by hand. One record of src/arenas.data.ts, for a page that draws this venue alone.
import type { ArenaData } from "../arenas.core.ts";

export const ARENA: ArenaData = {
    "id": "canada-life-centre",
    "wikidata": "Q656928",
    "name": "Canada Life Centre",
    "names": [
      {"name": "MTS Centre", "from": 2004, "to": 2017},
      {"name": "Bell MTS Place", "from": 2017, "to": 2021}
    ],
    "nameJa": "カナダライフ・センター",
    "aliases": [
      {"name": "Canada Life Centre", "lang": "en", "kind": "wikipedia", "revision": 1379717047, "source": "en.wikipedia.org"},
      {"name": "カナダライフ・センター", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q656928 sitelink"},
      {"name": "MTS Centre", "lang": "en", "kind": "former", "from": 2004, "to": 2017, "source": "en.wikipedia.org revision 1379717047 (the infobox's former names)"},
      {"name": "Bell MTS Place", "lang": "en", "kind": "former", "from": 2017, "to": 2021, "source": "en.wikipedia.org revision 1379717047 (the infobox's former names)"},
      {"name": "True North Centre", "lang": "en", "kind": "nickname", "source": "Wikidata Q656928 alias"},
      {"name": "MTSセンター", "lang": "ja", "kind": "nickname", "source": "Wikidata Q656928 alias"}
    ],
    "city": "Winnipeg",
    "country": "CA",
    "lat": 49.89278,
    "lon": -97.14361,
    "status": "current",
    "from": 2004,
    "capacity": {"hockey": 15225},
    "en": {"title": "Canada Life Centre", "revision": 1379717047},
  };
