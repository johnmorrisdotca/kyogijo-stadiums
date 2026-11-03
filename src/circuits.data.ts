// Made by scripts/build-circuits.mjs from scripts/circuits.data.json and data-sources/circuits/2026-11-03/: do not edit by hand.
// The facts are those of the Wikidata items and the English and Japanese Wikipedia articles (revisions) each entry cites, in our own words; see docs/circuits.md and NOTICE.md. Wikidata is CC0; the facts read from
// Wikipedia are numbers and words of ours, not its text (CC BY-SA 4.0). What OpenStreetMap gave is in circuits.osm.data.ts, apart, because it is ODbL.
import type { CircuitData } from "./circuits.types.ts";

export const CIRCUIT_DATA: CircuitData[] = [
  {
    "id": "las-vegas",
    "wikidata": "Q113112116",
    "en": {"title":"Las Vegas Strip Circuit","revision":1376988769},
    "ja": {"title":"ラスベガス・ストリップ・サーキット","revision":108197128},
    "names": {"en":"Las Vegas Strip Circuit","ja":"ラスベガス・ストリップ・サーキット"},
    "country": "US",
    "opened": {"value":"2023-11-16","basis":"documented","source":"wikidata","read":"P1619, date of official opening, 16 November 2023; the English article says it opened on November 16, 2023, and the Japanese infobox gives the same day"},
    "length": {"value":6201,"basis":"documented","source":"wikipedia","read":"the English infobox's length, 6.201 km (3.853 mi), which the Japanese infobox also gives; the Japanese article's prose says 6.120 km, which neither infobox nor the English article does, and is not used"},
    "corners": {"value":17,"basis":"documented","source":"wikipedia","read":"the English infobox's turns, 17, and its prose: 14 corners when announced, 17 after a chicane was added; the Japanese infobox gives 17 too"},
    "direction": {"value":"counterclockwise","basis":"documented","source":"wikipedia","read":"the English article: the street circuit runs counterclockwise; the Japanese article says the same (反時計回り)"},
    "width": {"value":12,"basis":"plausible","read":"ours: no source we read gives the track's width (OpenStreetMap maps no width on the lap's ways, and neither article gives one), so the ribbon is drawn 12 metres wide"},
    "pitLaneWidth": {"value":8,"basis":"plausible","read":"ours: no source gives the pit lane's width"},
    "turnNumbers": {"basis":"documented","source":"openstreetmap","read":"the relation's member nodes tagged junction=yes with ref 1 to 17, one at each turn as OpenStreetMap maps them; the English article's account of the lap (Turn 1 a hairpin after the pits, Turns 10 and 11 on Sands Avenue, Turn 12 onto Las Vegas Boulevard, Turn 13 on the Strip, Turns 14 to 16 onto Harmon Avenue, Turn 17 before the pits) agrees with where they lie"},
    "pitBuilding": {"basis":"documented","source":"openstreetmap","read":"the building OpenStreetMap maps inside the circuit's area beside the pit lane, 19.5 metres high in 4 levels (its height and building:levels tags)"},
  },
];
