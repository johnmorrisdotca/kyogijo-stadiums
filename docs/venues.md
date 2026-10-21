# The real venues

An arena of the NHL drawn in the building it stands in: the outline of the building as OpenStreetMap maps it, the rink lying in it, and a bowl of seats fitted inside it from what the sources say (how many seats, how many seating levels, what kind of roof). `drawKyogijo({ sport: "nhl", arena, crowd: { real: true } })` draws it, and the [3D view](./turn.md) raises it. All thirty-two arenas of the NHL have one: the Western Conference's Pacific and Central Divisions and the Eastern Conference's Atlantic and Metropolitan Divisions.

It is a plausible bowl, never a seat map. Nothing here is read or copied from a team's, a ticket seller's or a venue's own seating chart: no section, row or seat of a real plan is drawn, and no mark of a team or a league. The bowl has the right number of seats in the right number of tiers inside the right outline, and says so where it only looks right.

![The Honda Center's hockey rink in the outline of its building seen from above: a grey building outline with a small arrow marked N at its top right, a bowl of two tiers of seats round the ice with a walk between them, and the rink's boards, lines and face-off circles in the middle](./pictures/venues-honda-desk-light.webp)

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({ sport: "nhl", arena: "honda-center", crowd: { real: true } });
console.log(svg.includes("ky-cr-shell"), svg.includes("ky-cr-north"));
// true true
```

The venue is the arena's key in [`ARENAS`](./arenas.md): `arena` names it, and an arena with no venue (every arena but these thirty-two) is drawn with the usual stands. A `league` of your own, another sport and `crowd: { real: false }` leave the stands as they were. The demo's [venues page](https://johnmorrisdotca.github.io/kyogijo-stadiums/venues.html) draws each of the thirty-two in 2D and in 3D, in English and Japanese, grouped by conference and division, and the [gallery](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery-venues.html) shows all thirty-two with the code for each.

## Divisions and conferences

Each venue has a `division` (`pacific`, `central`, `atlantic`, `metropolitan`) and the divisions sit in the league's two conferences: `venuesIn("central")` lists a division's venues in the order of the data, `venuesInConference("western")` a conference's, division by division, `conferenceOf` and `VENUE_CONFERENCES` say which division is in which. A division with no venue yet gives an empty list. The demo's venues page has a conference and a division chooser over the tabs.

## The two levels

**Level one is the building.** The outline is the closed way (or, for the Grand Casino Arena, the relation of two ways that join into one ring) OpenStreetMap tags with the arena's Wikidata item, read with the Overpass API on 2026-10-20 and simplified to a metre. It is drawn as it is, annexes and all, under the stands, in the colour of a concourse. Where OpenStreetMap or the building says how the rink lies, the drawing is turned so that the rink lies along the page, and a small arrow marked N says where north is. Where nothing says, the rink is drawn east-west with north at the top and no arrow.

**Level two is the bowl.** From the first row, which stands from the boards where the NHL profile of [the crowd](./crowd.md) has it, out to the wall of the building, between them the tiers:

- The seats are the venue's seats for ice hockey. Each tier's outer edge is placed so that its band holds its share of them, with a walk between two tiers. A bowl that fits holds exactly the venue's seats.
- A seat takes 3.8 square feet of the floor in the plan (a bowl of today's arenas is steeper than the usual drawing's, whose seat is 2 by 2.3 feet). A building with less room than that needs gets a steeper bowl, down to 3 square feet a seat; where even that is too little the plan says `tight` and the bowl holds fewer seats than the venue. None of the thirty-two is tight, and all but three are drawn at the first density: the Rogers Arena and the Scotiabank Arena, whose outlines are small for their seats, are drawn at 3, and TD Garden at 3.4.
- The outer edge of the bowl is the largest rounded rectangle, between 1.15 and 1.6 times as long as it is wide, that fits inside the outline round the middle of the building's main hall, with a wall's depth to spare; its corners are as round as a bowl's are.
- The rows rise at most 36 degrees, so that a bowl with less depth is lower and not steeper; the heights of the tiers (4 feet for the first row, the rise of each tier, a suite level of 16 feet between them) are ours: no source gives them.
- The roof (3D, with `venue: { roof: true }`) stands over the building's hall at least 22 feet over the last row, or at the height OpenStreetMap maps for the building where that is more. A `fixed` roof is a lid that rises 22 feet towards the middle; the `saddle` roof of the Scotiabank Saddledome rises 30 feet at the two ends of the rink and falls to the walls at the two sides. The sources say the roof's kind, not its height. The walls and the roof can be raised apart: `venue: { walls: true }` is the walls alone, `venue: { roof: true, walls: false }` the roof alone, and `roof: true` as it always was both; `turn.update(options, { venue })` changes them on a view that is turning.
- **Nothing is left as a bare gray sheet in 3D.** The walk between two tiers is the suite level, a facing wall with a band of windows (a pane to every 7 feet) and a ledge; the apron between the boards and the first row is a thin dark floor, with, on the bench side, the players' benches, the penalty boxes and the timekeeper's table at the usual places along the boards; the back of the upper tier is a wall with a coping, closing the bowl, and between it and the walls of the hall lies a darker concourse floor with its lanes and joints, going on to the building's outline where the building has annexes beyond the hall. The back wall gives way to the eye as the walls of the building do. All of it is ours, plausible and no plan of the building (`src/venue.fill.ts`); the benches' places and sizes are the usual ones for a rink, and none of it is a source's.

![The Scotiabank Saddledome's bowl in 3D from the main camera: two tiers of seats round the rink, a roof that sags at the sides and rises at the two ends over them, and walls round the building](./images/venues-saddledome-3d-desk-light.webp)

## The thirty-two venues

Made by `pnpm venues` from `scripts/venues.data.json` and the files of `data-sources/venues/2026-10-20/`; do not edit by hand. Each fact says whether a source says it (`documented`) or it is ours (`plausible`), and what was read, in the file the table is made from.

<!-- venues-table -->
| Key | Arena | Division | City | Wikidata | Seats for hockey | Tiers | Roof | The rink | Outline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `honda-center` | Honda Center | Pacific | Anaheim, United States | Q774138 | 17,174 (Wikipedia; Wikidata's capacity 17,174) | 2, plausible | fixed, plausible | along 90° (inferred) | way 120623151, 14,067 m² |
| `scotiabank-saddledome` | Scotiabank Saddledome | Pacific | Calgary, Canada | Q1140083 | 19,289 (Wikipedia; Wikidata's capacity 16,605) | 2, documented | saddle, documented | not known | way 4397328, 15,792 m² |
| `rogers-place` | Rogers Place | Pacific | Edmonton, Canada | Q5339036 | 18,641 (Wikidata; Wikidata's capacity 18,641) | 2, plausible | fixed, plausible | along 93° (inferred) | way 448626254, 22,634 m² |
| `crypto-com-arena` | Crypto.com Arena | Pacific | Los Angeles, United States | Q186080 | 18,145 (Wikipedia; Wikidata's capacity 19,060) | 2, documented | fixed, plausible | not known | way 428021739, 23,467 m² |
| `sap-center` | SAP Center | Pacific | San Jose, United States | Q261863 | 17,435 (Wikipedia; Wikidata's capacity 19,190) | 2, plausible | fixed, plausible | not known | way 24169210, 18,294 m² |
| `climate-pledge-arena` | Climate Pledge Arena | Pacific | Seattle, United States | Q977529 | 17,151 (Wikipedia; Wikidata's capacity 18,000) | 2, documented | fixed, documented | along 0° (inferred) | way 25123756, 18,041 m² |
| `rogers-arena` | Rogers Arena | Pacific | Vancouver, Canada | Q517318 | 18,871 (Wikipedia; Wikidata's capacity 18,422) | 2, plausible | fixed, plausible | along 102° (inferred) | way 24705911, 13,837 m² |
| `t-mobile-arena` | T-Mobile Arena | Pacific | Las Vegas, United States | Q3338973 | 17,500 (Wikipedia; Wikidata's capacity 20,000) | 2, plausible | fixed, plausible | along 90° (inferred) | way 364489406, 29,859 m² |
| `united-center` | United Center | Central | Chicago, United States | Q639975 | 19,717 (Wikipedia; Wikidata's capacity 23,500) | 2, documented | fixed, plausible | along 90° (inferred) | way 205221993, 18,684 m² |
| `ball-arena` | Ball Arena | Central | Denver, United States | Q795470 | 17,809 (Wikipedia; Wikidata's capacity 19,155) | 2, plausible | fixed, plausible | not known | way 25312645, 19,762 m² |
| `american-airlines-center` | American Airlines Center | Central | Dallas, United States | Q463345 | 18,532 (Wikipedia; Wikidata's capacity 19,200) | 2, plausible | fixed, plausible | along 144° (inferred) | way 25312698, 17,632 m² |
| `grand-casino-arena` | Grand Casino Arena | Central | Saint Paul, United States | Q1421388 | 17,954 (Wikidata; Wikidata's capacity 17,954) | 3, documented | fixed, plausible | along 120° (inferred) | relation 20658401, 19,188 m² |
| `bridgestone-arena` | Bridgestone Arena | Central | Nashville, United States | Q302869 | 17,510 (Wikidata; Wikidata's capacity 17,510) | 2, plausible | fixed, plausible | along 156° (inferred) | way 130905914, 24,099 m² |
| `enterprise-center` | Enterprise Center | Central | St. Louis, United States | Q1067700 | 18,096 (Wikipedia; Wikidata's capacity 18,400) | 2, documented | fixed, plausible | along 105° (inferred) | way 42369176, 16,931 m² |
| `delta-center` | Delta Center | Central | Salt Lake City, United States | Q82294 | 16,020 (Wikipedia; Wikidata's capacity 19,911) | 2, plausible | fixed, plausible | along 45° (inferred) | way 23335190, 18,183 m² |
| `canada-life-centre` | Canada Life Centre | Central | Winnipeg, Canada | Q656928 | 15,225 (Wikipedia; Wikidata's capacity 15,004) | 2, documented | fixed, plausible | along 162° (inferred) | way 14869890, 12,765 m² |
| `td-garden` | TD Garden | Atlantic | Boston, United States | Q432105 | 17,850 (Wikipedia; Wikidata's capacity 18,624) | 2, plausible | fixed, plausible | along 55.2° (mapped) | way 25123637, 12,751 m² |
| `keybank-center` | KeyBank Center | Atlantic | Buffalo, United States | Q1110789 | 19,070 (Wikipedia; Wikidata's capacity 19,070) | 3, documented | fixed, plausible | along 144° (inferred) | way 626433722, 20,083 m² |
| `little-caesars-arena` | Little Caesars Arena | Atlantic | Detroit, United States | Q18154984 | 19,515 (Wikipedia; Wikidata's capacity none) | 2, plausible | fixed, plausible | along 147° (inferred) | way 526548805, 25,798 m² |
| `amerant-bank-arena` | Amerant Bank Arena | Atlantic | Sunrise, United States | Q795526 | 19,250 (Wikipedia; Wikidata's capacity 20,737) | 2, plausible | fixed, plausible | not known | way 43903801, 22,287 m² |
| `bell-centre` | Bell Centre | Atlantic | Montreal, Canada | Q522282 | 20,962 (Wikipedia; Wikidata's capacity 21,273) | 3, documented | fixed, plausible | along 132° (inferred) | way 19911284, 14,929 m² |
| `canadian-tire-centre` | Canadian Tire Centre | Atlantic | Ottawa, Canada | Q1327290 | 17,010 (Wikipedia; Wikidata's capacity 19,153) | 3, documented | fixed, plausible | not known | way 449048777, 19,131 m² |
| `benchmark-international-arena` | Benchmark International Arena | Atlantic | Tampa, United States | Q940199 | 19,092 (Wikipedia; Wikidata's capacity 19,204) | 2, plausible | fixed, plausible | not known | relation 12296444, 18,050 m² |
| `scotiabank-arena` | Scotiabank Arena | Atlantic | Toronto, Canada | Q406972 | 18,819 (Wikipedia; Wikidata's capacity 19,800) | 2, plausible | fixed, plausible | not known | way 19882585, 16,007 m² |
| `lenovo-center` | Lenovo Center | Metropolitan | Raleigh, United States | Q39177 | 18,547 (Wikipedia; Wikidata's capacity 19,722) | 2, documented | fixed, plausible | not known | way 47732090, 21,960 m² |
| `nationwide-arena` | Nationwide Arena | Metropolitan | Columbus, United States | Q166503 | 18,500 (Wikipedia; Wikidata's capacity 18,144) | 2, plausible | fixed, plausible | along 93° (inferred) | way 30266537, 26,258 m² |
| `prudential-center` | Prudential Center | Metropolitan | Newark, United States | Q849027 | 16,514 (Wikipedia; Wikidata's capacity 17,625) | 2, documented | fixed, plausible | along 21° (inferred) | way 1421198650, 25,650 m² |
| `ubs-arena` | UBS Arena | Metropolitan | Elmont, United States | Q48742753 | 17,255 (Wikipedia; Wikidata's capacity none) | 2, plausible | fixed, plausible | along 18° (inferred) | way 328876880, 22,886 m² |
| `madison-square-garden` | Madison Square Garden | Metropolitan | New York, United States | Q186125 | 18,006 (Wikipedia; Wikidata's capacity 18,006) | 2, documented | fixed, plausible | not known | way 138141251, 15,025 m² |
| `xfinity-mobile-arena` | Xfinity Mobile Arena | Metropolitan | Philadelphia, United States | Q818735 | 19,173 (Wikipedia; Wikidata's capacity 20,328) | 2, plausible | fixed, plausible | along 15.6° (mapped) | way 25312366, 21,134 m² |
| `ppg-paints-arena` | PPG Paints Arena | Metropolitan | Pittsburgh, United States | Q595460 | 18,187 (Wikipedia; Wikidata's capacity 18,387) | 2, plausible | fixed, plausible | along 18.7° (mapped) | way 130358195, 20,150 m² |
| `capital-one-arena` | Capital One Arena | Metropolitan | Washington, United States | Q223240 | 18,573 (Wikipedia; Wikidata's capacity 20,674) | 2, plausible | fixed, plausible | not known | way 48041466, 18,700 m² |
<!-- /venues-table -->

## How the rink's orientation is found

OpenStreetMap maps the ice inside three of these thirty-two buildings (TD Garden, the Xfinity Mobile Arena and PPG Paints Arena: `osm.ice` holds its outline), so their rinks lie as the ice does; for the other twenty-nine the rink's orientation is an inference from the building, and says so (`basis`):

- `mapped`: from the ice where OpenStreetMap maps it: a closed way (or a relation of one) tagged as an ice rink or a pitch of ice hockey, the size of a rink (1,000 to 2,600 square metres) with its middle inside the building, whose long side (at least 1.5 times its short side) gives the heading, and whose middle is the rink's. The Xfinity Mobile Arena's is a relation of one way named "Philadelphia Flyers Ice Rink" in OpenStreetMap.
- `building`: from the long axis of the building's main hall, which a rink usually follows. The main hall is the largest rectangle that fits inside the outline, over every direction three degrees apart; it does not see a wing, a plaza or a ramp that a rectangle cannot fill. It is said when the building has a direction (the largest rectangle in its best direction is at least 1.25 times the largest in its worst) and the hall is at least 1.1 times as long as it is wide.
- `none`: a round or squarish building has no direction, and nothing is said. Eleven buildings are drawn east-west with north at the top: the Scotiabank Saddledome, the Crypto.com Arena, the SAP Center, the Ball Arena, the Amerant Bank Arena, the Canadian Tire Centre, the Benchmark International Arena, the Scotiabank Arena, the Lenovo Center, Madison Square Garden and the Capital One Arena.

The middle of the rink is the middle of the main hall (or of the ice, where it is mapped). The stored axis is the result of `coreOf` on the stored outline, and a test recomputes it.

## Sources and licences

- **OpenStreetMap, ODbL 1.0, (c) OpenStreetMap contributors.** The outline, the height of the building where OpenStreetMap maps one, and the axis worked out from the outline are a derived database. They live only in `src/venues.osm.data.ts` and in `data-sources/venues/`, are never copied into a CC0 or CC BY-SA file of the package and no such file is copied into them, and are offered under the ODbL with the credit `VENUE_ATTRIBUTION` (`(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright`). A drawing made from them is a produced work: it carries the credit and the description says so.
- **Wikidata, CC0.** The capacity (P1083, with the sport it applies to, P641) and the coordinates of each arena's item. Wikidata's figure for ice hockey is used where its item has one (Rogers Place, the Grand Casino Arena, the Bridgestone Arena; where it has two for different years, the later one: the Grand Casino Arena's 17,954 from 2012, not the 18,064 of 2000); elsewhere its one capacity is for another event or another year (the Saddledome's 16,605 are its 1983 seats) and is kept beside the figure used (`null` where the item gives none: the Little Caesars Arena's and the UBS Arena's).
- **English Wikipedia, CC BY-SA 4.0.** The seats for ice hockey where Wikidata has none for it, the number of seating levels and the kind of roof where an article says them, each with the article and the revision; the facts are numbers and words of ours, not the text. The articles are credited in [NOTICE.md](../NOTICE.md#the-venues-sources).
- **Raw answers** are kept as they were returned in `data-sources/venues/2026-10-20/` (`pnpm venues:fetch <date> <division>` fetches them: one request at a time, ten seconds apart, with a User-Agent that names the project; the files are `wikidata-<division>.json`, `wikipedia-<division>.json` and `osm-<arena>.json`). `pnpm venues` makes the two data files and the tables of this page and of NOTICE.md from them.

Neither Wikidata nor OpenStreetMap says how many seating levels an arena has or what shape its roof is, and no open dataset of arenas drawn as bowls was found (searches on 2026-10-20): OpenStreetMap has outlines, Wikidata capacities, and the seating charts that exist are the teams' and the ticket sellers', which are not used. So a number of tiers is `documented` only where an article says it and `plausible` (two bowls, a lower and an upper, as an arena of 17,000 seats usually has) where none does, and the table says which.

## Limits

- The orientation is mapped for three of the thirty-two, inferred for eighteen and not known for eleven.
- The outline is OpenStreetMap's: where it takes in a plaza or a wing of the building (Rogers Place's, the Crypto.com Arena's), so does the drawing, and the 3D walls and roof stand on the hall only.
- The tiers are fitted to the outline and the seats; real bowls have sections, overhangs and sightline corners that are not drawn, and their suite level is a plain wall of windows. The 3D heights are ours.
- The seats are the hockey configuration's, from the sources named; they change with a renovation (the Rogers Arena's 18,871 are its seats since 2018).

See also the [world venue checklist](./research/venue-checklist.md), which ranks the districts and single venues worth drawing next.
