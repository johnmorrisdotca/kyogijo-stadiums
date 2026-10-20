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
    "wikidataSeats": [54500],
    "tiers": {"count": 2, "basis": "documented", "lowerSeats": 27695, "read": "the infobox's lower bowl of 27,695 seats, and the article's lower and upper bowls (the club that plays soccer there sold only the lower bowl)"},
    "roof": {"kind": "cable", "basis": "documented", "read": "the article: a retractable roof supported by cables, the largest of its kind, its opening 100 by 85 metres (the size of the field), the fabric retracting into a pod in the middle of the opening above the suspended video board", "opening": {"length": 100, "width": 85, "unit": "m"}},
  },
  {
    "id": "lumen-field",
    "kind": "stadium",
    "wikidata": "Q612736",
    "ground": "lumen-field",
    "gridiron": "nfl",
    "en": {"title": "Lumen Field", "revision": 1373998493},
    "configs": {"nfl": {"sport": "nfl", "seats": 68740, "source": "wikipedia", "read": "the infobox's capacity for the NFL, 68,740 (expandable to 72,000 for special events)"}, "soccer": {"sport": "soccer", "seats": 37722, "source": "wikipedia", "read": "the infobox's capacity for MLS, 37,722, the upper and lower sections tarped off beyond it"}},
    "bowlSeats": 68740,
    "wikidataSeats": [67000,72000],
    "tiers": {"count": 3, "basis": "documented", "read": "the article names the lower concourse levels, the club and suite levels and the Summit levels above them"},
    "roof": {"kind": "canopy", "basis": "documented", "cover": 0.7, "read": "the article: a roof of 200,000 square feet that covers 70 percent of the seats and leaves the field open, spanning 720 feet between concrete pylons at the north and south ends"},
  },
  {
    "id": "t-mobile-park",
    "kind": "park",
    "wikidata": "Q1193117",
    "park": "t-mobile-park",
    "en": {"title": "T-Mobile Park", "revision": 1379419810},
    "configs": {"mlb": {"sport": "mlb", "seats": 47368, "source": "wikipedia", "read": "the infobox's capacity for baseball, 47,368"}},
    "wikidataSeats": [47476],
    "tiers": {"count": 4, "basis": "documented", "tierSeats": {"lower": 20521, "upper": 22075, "bleachers": 3666}, "read": "the article's levels: the Main Level of 20,521 seats (most of the lower bowl), the Club Level of 4,123, the Suite Level of 2,050 and the View Level of 15,902, and two bleacher sections of 3,666"},
    "roof": {"kind": "panels", "basis": "documented", "bottom": 217, "top": 269, "read": "the article: a retractable roof in four sections that does not fully enclose the ballpark, its bottom 217 feet and its top 269 feet above the field, resting over the railway tracks to the east when open"},
  },
];
