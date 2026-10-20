# The real venues

An arena of the NHL drawn in the building it stands in: the outline of the building as OpenStreetMap maps it, the rink lying in it, and a bowl of seats fitted inside it from what the sources say (how many seats, how many seating levels, what kind of roof). `drawKyogijo({ sport: "nhl", arena, crowd: { real: true } })` draws it, and the [3D view](./turn.md) raises it. So far the eight arenas of the Pacific Division have one; the other divisions follow, one release at a time.

It is a plausible bowl, never a seat map. Nothing here is read or copied from a team's, a ticket seller's or a venue's own seating chart: no section, row or seat of a real plan is drawn, and no mark of a team or a league. The bowl has the right number of seats in the right number of tiers inside the right outline, and says so where it only looks right.

![The Honda Center's hockey rink in the outline of its building seen from above: a grey building outline with a small arrow marked N at its top right, a bowl of two tiers of seats round the ice with a walk between them, and the rink's boards, lines and face-off circles in the middle](./images/venues-honda-desk-light.webp)

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({ sport: "nhl", arena: "honda-center", crowd: { real: true } });
console.log(svg.includes("ky-cr-shell"), svg.includes("ky-cr-north"));
// true true
```

The venue is the arena's key in [`ARENAS`](./arenas.md): `arena` names it, and an arena with no venue (every arena but these eight) is drawn with the usual stands. A `league` of your own, another sport and `crowd: { real: false }` leave the stands as they were. The demo's [venues page](https://johnmorrisdotca.github.io/kyogijo-stadiums/venues.html) draws each of the eight in 2D and in 3D, in English and Japanese, and the [gallery](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery-venues.html) shows all eight with the code for each.

## The two levels

**Level one is the building.** The outline is the closed way OpenStreetMap tags with the arena's Wikidata item, read with the Overpass API on 2026-10-20 and simplified to a metre. It is drawn as it is, annexes and all, under the stands, in the colour of a concourse. Where OpenStreetMap or the building says how the rink lies, the drawing is turned so that the rink lies along the page, and a small arrow marked N says where north is. Where nothing says, the rink is drawn east-west with north at the top and no arrow.

**Level two is the bowl.** From the first row, which stands from the boards where the NHL profile of [the crowd](./crowd.md) has it, out to the wall of the building, between them the tiers:

- The seats are the venue's seats for ice hockey. Each tier's outer edge is placed so that its band holds its share of them, with a walk between two tiers. A bowl that fits holds exactly the venue's seats.
- A seat takes 3.8 square feet of the floor in the plan (a bowl of today's arenas is steeper than the usual drawing's, whose seat is 2 by 2.3 feet). A building with less room than that needs gets a steeper bowl, down to 3 square feet a seat; where even that is too little the plan says `tight` and the bowl holds fewer seats than the venue. None of the eight is tight at the first density but Rogers Arena, whose outline is small for its seats, which is drawn at 3.
- The outer edge of the bowl is the largest rounded rectangle, between 1.15 and 1.6 times as long as it is wide, that fits inside the outline round the middle of the building's main hall, with a wall's depth to spare; its corners are as round as a bowl's are.
- The rows rise at most 36 degrees, so that a bowl with less depth is lower and not steeper; the heights of the tiers (4 feet for the first row, the rise of each tier, a suite level of 16 feet between them) are ours: no source gives them.
- The roof (3D, with `venue: { roof: true }`) stands over the building's hall at least 22 feet over the last row, or at the height OpenStreetMap maps for the building where that is more. A `fixed` roof is a lid that rises 22 feet towards the middle; the `saddle` roof of the Scotiabank Saddledome rises 30 feet at the two ends of the rink and falls to the walls at the two sides. The sources say the roof's kind, not its height.

![The Scotiabank Saddledome's bowl in 3D from the main camera: two tiers of seats round the rink, a roof that sags at the sides and rises at the two ends over them, and walls round the building](./images/venues-saddledome-3d-desk-light.webp)

## The eight venues

Made by `pnpm venues` from `scripts/venues.data.json` and the files of `data-sources/venues/2026-10-20/`; do not edit by hand. Each fact says whether a source says it (`documented`) or it is ours (`plausible`), and what was read, in the file the table is made from.

<!-- venues-table -->
| Key | Arena | City | Wikidata | Seats for hockey | Tiers | Roof | The rink | Outline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `honda-center` | Honda Center | Anaheim, United States | Q774138 | 17,174 (Wikipedia; Wikidata's capacity 17,174) | 2, plausible | fixed, plausible | along 90° (inferred) | way 120623151, 14,067 m² |
| `scotiabank-saddledome` | Scotiabank Saddledome | Calgary, Canada | Q1140083 | 19,289 (Wikipedia; Wikidata's capacity 16,605) | 2, documented | saddle, documented | not known | way 4397328, 15,792 m² |
| `rogers-place` | Rogers Place | Edmonton, Canada | Q5339036 | 18,641 (Wikidata; Wikidata's capacity 18,641) | 2, plausible | fixed, plausible | along 93° (inferred) | way 448626254, 22,634 m² |
| `crypto-com-arena` | Crypto.com Arena | Los Angeles, United States | Q186080 | 18,145 (Wikipedia; Wikidata's capacity 19,060) | 2, documented | fixed, plausible | not known | way 428021739, 23,467 m² |
| `sap-center` | SAP Center | San Jose, United States | Q261863 | 17,435 (Wikipedia; Wikidata's capacity 19,190) | 2, plausible | fixed, plausible | not known | way 24169210, 18,294 m² |
| `climate-pledge-arena` | Climate Pledge Arena | Seattle, United States | Q977529 | 17,151 (Wikipedia; Wikidata's capacity 18,000) | 2, documented | fixed, documented | along 0° (inferred) | way 25123756, 18,041 m² |
| `rogers-arena` | Rogers Arena | Vancouver, Canada | Q517318 | 18,871 (Wikipedia; Wikidata's capacity 18,422) | 2, plausible | fixed, plausible | along 102° (inferred) | way 24705911, 13,837 m² |
| `t-mobile-arena` | T-Mobile Arena | Las Vegas, United States | Q3338973 | 17,500 (Wikipedia; Wikidata's capacity 20,000) | 2, plausible | fixed, plausible | along 90° (inferred) | way 364489406, 29,859 m² |
<!-- /venues-table -->

## How the rink's orientation is found

OpenStreetMap maps the ice inside none of these eight buildings (`osm.ice` is empty for each), so the rink's orientation is an inference from the building, and says so (`basis`):

- `mapped`: from the ice where OpenStreetMap maps it, which none of the eight has (a venue elsewhere may).
- `building`: from the long axis of the building's main hall, which a rink usually follows. The main hall is the largest rectangle that fits inside the outline, over every direction three degrees apart; it does not see a wing, a plaza or a ramp that a rectangle cannot fill. It is said when the building has a direction (the largest rectangle in its best direction is at least 1.25 times the largest in its worst) and the hall is at least 1.1 times as long as it is wide.
- `none`: a round or squarish building has no direction, and nothing is said. The Scotiabank Saddledome, the Crypto.com Arena and the SAP Center are drawn east-west with north at the top.

The middle of the rink is the middle of the main hall (or of the ice, where it is mapped). The stored axis is the result of `coreOf` on the stored outline, and a test recomputes it.

## Sources and licences

- **OpenStreetMap, ODbL 1.0, (c) OpenStreetMap contributors.** The outline, the height of the building where OpenStreetMap maps one, and the axis worked out from the outline are a derived database. They live only in `src/venues.osm.data.ts` and in `data-sources/venues/`, are never copied into a CC0 or CC BY-SA file of the package and no such file is copied into them, and are offered under the ODbL with the credit `VENUE_ATTRIBUTION` (`(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright`). A drawing made from them is a produced work: it carries the credit and the description says so.
- **Wikidata, CC0.** The capacity (P1083, with the sport it applies to, P641) and the coordinates of each arena's item. Wikidata's figure for ice hockey is used where its item has one (Rogers Place); elsewhere its one capacity is for another event or another year (the Saddledome's 16,605 are its 1983 seats) and is kept beside the figure used.
- **English Wikipedia, CC BY-SA 4.0.** The seats for ice hockey where Wikidata has none for it, the number of seating levels and the kind of roof where an article says them, each with the article and the revision; the facts are numbers and words of ours, not the text. The articles are credited in [NOTICE.md](../NOTICE.md#the-venues-sources).
- **Raw answers** are kept as they were returned in `data-sources/venues/2026-10-20/` (`pnpm venues:fetch` fetches them: one request at a time, ten seconds apart, with a User-Agent that names the project). `pnpm venues` makes the two data files and this page's table from them.

Neither Wikidata nor OpenStreetMap says how many seating levels an arena has or what shape its roof is, and no open dataset of arenas drawn as bowls was found (searches on 2026-10-20): OpenStreetMap has outlines, Wikidata capacities, and the seating charts that exist are the teams' and the ticket sellers', which are not used. So a number of tiers is `documented` only where an article says it and `plausible` (two bowls, a lower and an upper, as an arena of 17,000 seats usually has) where none does, and the table says which.

## Limits

- The orientation is inferred for five of the eight and not known for three; none is mapped.
- The outline is OpenStreetMap's: where it takes in a plaza or a wing of the building (Rogers Place's, the Crypto.com Arena's), so does the drawing, and the 3D walls and roof stand on the hall only.
- The tiers are fitted to the outline and the seats; real bowls have sections, overhangs, sightline corners and a suite level that are not drawn. The 3D heights are ours.
- The seats are the hockey configuration's, from the sources named; they change with a renovation (the Rogers Arena's 18,871 are its seats since 2018).

See also the [world venue checklist](./research/venue-checklist.md), which ranks the districts and single venues worth drawing next.
