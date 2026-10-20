// Made by scripts/build-stadiums.mjs from scripts/stadiums.data.json: do not edit by hand.
// The facts are those of the Wikidata items and the English Wikipedia articles (revisions) each entry cites, in our own words; see docs/stadiums.md and NOTICE.md. Wikidata is CC0; the facts read from
// English Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in stadiums.osm.data.ts, apart, because it is ODbL.
import type { RealStadiumData } from "./stadiums.ts";

export const STADIUM_DATA: RealStadiumData[] = [
  {
    "id": "bc-place",
    "wikidata": "Q612227",
    "ground": "bc-place",
    "en": {"title": "BC Place", "revision": 1372065649},
    "configs": {"cfl": {"sport": "cfl", "seats": 54500, "source": "wikipedia", "read": "the infobox's first capacity, 54,500, which Wikidata's capacity (P1083) also gives; the article's stand for football of the CFL's club"}, "soccer": {"sport": "soccer", "seats": 52497, "source": "wikipedia", "read": "the infobox's capacity for the 2026 world cup of soccer, 52,497, 2,003 fewer than its first"}},
    "tiers": {"count": 2, "basis": "documented", "lowerSeats": 27695, "read": "the infobox's lower bowl of 27,695 seats, and the article's lower and upper bowls (the club that plays soccer there sold only the lower bowl)"},
    "roof": {"kind": "cable", "basis": "documented", "read": "the article: a retractable roof supported by cables, the largest of its kind, its opening 100 by 85 metres (the size of the field), the fabric retracting into a pod in the middle of the opening above the suspended video board", "opening": {"length": 100, "width": 85, "unit": "m"}},
  },
];
