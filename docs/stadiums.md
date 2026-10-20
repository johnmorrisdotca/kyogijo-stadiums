# The real stadiums

A stadium of football and soccer, or a ballpark, drawn in the building it stands in: the outline of the building as OpenStreetMap maps it, the field lying in it, and a bowl of seats fitted inside it from what the sources say (how many seats in each configuration, how many seating bowls, what kind of roof). `drawKyogijo({ sport: "cfl", stadium: "bc-place", crowd: { real: true } })` draws one, and the [3D view](./turn.md) raises it. It is [the real venues](./venues.md)' counterpart for a field and not a rink. So far there are three: **BC Place** in Vancouver (the football field of the Canadian league and a soccer pitch, under its cable roof), **Lumen Field** in Seattle (the NFL's field and a soccer pitch, under its canopies) and **T-Mobile Park**, the Mariners' ballpark (a baseball field, under its retractable roof). [Beside each other](./district.md), the two of SoDo, and a city view with Climate Pledge Arena.

It is a plausible bowl, never a seat map. Nothing here is read or copied from a club's, a ticket seller's or a federation's seating chart: no section, row or seat of a real plan is drawn, and no mark of a club, a league or a tournament. The bowl has the right number of seats in the right number of bowls inside the right outline, and says so where it only looks right.

![BC Place's soccer pitch under its roof in 3D from the main camera: two bowls of seats round the pitch, walls round the building and a roof of cable-supported pieces rising to an opening over the pitch, with the pod that holds the fabric in its middle](./images/stadiums-bc-place-3d-desk-light.webp)

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { planStadium, stadiumById } from "@johnmorrisdotca/kyogijo-stadiums/stadiums";

const svg = drawKyogijo({ sport: "soccer", stadium: "bc-place", crowd: { real: true } });
console.log(svg.includes("ky-cr-shell"), svg.includes("ky-cr-north"));
// true true
const plan = planStadium(stadiumById("bc-place")!, "soccer", { x: 0, y: 0, w: 344.5, h: 223.1 });
console.log(plan.orientation.basis, plan.seats.map((t) => `${t.tier} ${t.seats}`).join(", "), plan.total);
// opening lower 27695, upper 24802 52497
```

The stadium is the key in [`STADIUMS`](#the-stadiums) (the key of its ground in [`GROUNDS`](./grounds.md), or of its park in [`PARKS`](./ballparks.md)): `stadium` names it for a football field (`sport: "cfl"` or `"nfl"`) or a soccer pitch (`sport: "soccer"`), and `park` for a baseball field (`sport: "mlb"`), and a soccer drawing whose `ground` is a stadium needs no other. Any other sport, a `league` of your own and `crowd: { real: false }` leave the stands as they were. The demo's [stadiums page](https://johnmorrisdotca.github.io/kyogijo-stadiums/stadiums.html) and the [gallery](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery-stadiums.html) draw both configurations in 2D and in 3D, in English and Japanese, and puts the stadium [beside Rogers Arena](./district.md).

## BC Place: the two configurations

The building is one, and so is the bowl; what changes is the field and the seats the stadium has for it:

- **Football (`sport: "cfl"`).** The field of the Canadian league, 150 by 65 yards with its 20-yard end zones (the article says the stadium was the first to use a 20-yard end zone), and 54,500 seats: the infobox's first capacity, which Wikidata's capacity (P1083) also gives.
- **Soccer (`sport: "soccer"`).** The pitch at the international 105 by 68 metres, and 52,497 seats: the infobox's figure for the 2026 tournament, 2,003 fewer than its first (the article's own words say neither why nor which seats; the lower bowl is kept and the upper bowl takes the difference). The article gives the soccer pitch as 117 by 75 yards (about 107 by 69 metres), which is not a size of the infobox's for international matches, so [`GROUNDS`](./grounds.md) keeps the international size for this ground and so does the drawing.

The same 27,695 seats are the lower bowl in both: the infobox lists them as "lower bowl", and the article says the stadium's soccer club sold only the lower bowl for years.

## The two levels, in BC Place

**Level one is the building.** The outline is the closed way OpenStreetMap tags with the stadium's Wikidata item, read with the Overpass API on 2026-10-20 and simplified to a metre. It is drawn as it is, annexes and all, under the stands, in the colour of a concourse. The field lies along the **opening in the roof**: OpenStreetMap maps the roof as a multipolygon of its band and the opening in it, and the article says the opening is 100 by 85 metres, "the same size as the field below". The mapped opening measures 101.8 by 85.3 metres, long side 52.8 degrees from north, and the building's own main hall (the largest rectangle that fits its outline) runs the same way to within a few degrees. The drawing is turned so that the field lies along the page, and a small arrow marked N says where north is.

**Level two is the bowl.** From the first row, which stands from a football field's footprint where the package's own gridiron stands have it (42 feet from a side line, 28 from an end line), out to the wall of the building, between them the two bowls:

- The seats are the configuration's. Each bowl's outer edge is placed so that its band holds its share of them, with a walk between the bowls. A bowl that fits holds exactly the configuration's seats; BC Place's building has room for soccer's 52,497 at 3.8 square feet of floor a seat in the plan and for football's 54,500 at 3.4 (the bowl is steeper than the usual drawing's, whose seat takes 4.6), and the plan says `tight` where even 3 would not hold them.
- The lower bowl holds the share the infobox gives, 27,695 seats; the upper bowl the rest.
- The outer edge of the bowl is the largest rounded rectangle, between 1.15 and 1.6 times as long as it is wide, that fits inside the outline round the middle of the field, with a wall's depth to spare.
- The rows rise at most 36 degrees; the heights (5 feet for the first row, 38 and 62 feet of rise for the lower and the upper bowl, a suite level of 24 feet between them) are ours: no source gives them.
- **The roof** (3D, with `venue: { roof: true }`) is the one the article describes: a retractable roof supported by cables. Its rim stands where OpenStreetMap maps it, 48 metres (the building part's height of 61 metres less the roof's own 13), the roof rises 13 metres from the rim to the edge of the opening, and each piece of the roof carries a cable along its edge. Over the opening, with the roof closed, lies the fabric (drawn thin, so that the seats show through it), and in the middle of it the pod, a box hung at the crown's height (its size is ours: the article says the fabric retracts into a pod above the suspended video board, not how large it is). With `venue: { roof: true, roofOpen: true }` the fabric has gathered into the pod and only the pod stays.

## Lumen Field

A stadium with two configurations in one bowl: the NFL's field (`sport: "nfl"`, 120 by 53.3 yards, 68,740 seats: the infobox's figure, which the article says is expandable to 72,000 for special events) and a soccer pitch (`sport: "soccer"`, the 116 by 75 yards the article publishes, 37,722 seats for the league's matches). `drawKyogijo({ sport: "nfl", stadium: "lumen-field", crowd: { real: true } })` draws it, and a soccer drawing whose `ground` is `lumen-field` needs no `stadium`.

- **The field lies as OpenStreetMap maps the pitches**: both pitches, the American football one and the soccer one, are mapped inside the building and lie north and south (0 degrees), so the field's orientation is mapped, not inferred, and the arrow marked N points along the field.
- **One bowl, a configuration opens its seats from the lowest up.** The bowl holds 68,740 seats in three bowls (the article names the lower levels, the club and suite levels and the Summit levels above them) and is the same for both; the soccer configuration opens 37,722 of them from the lowest bowl up and the rest, the upper bowl and part of the middle one, are closed: drawn as empty seats, with no people. The share of the seats in each bowl is ours (the article does not say it).
- **The canopies.** The article says the roof covers 70 percent of the seats and leaves the field open, and OpenStreetMap maps it as two parts, one each side of the field, with their heights (36 metres at the top, a rise of 10). The drawing keeps their outlines, cut into strips by the rays from the middle of the field, each strip a pair of triangles; the low edge (26 metres, over the field's side) and the high one (over the back of the stands) are the map's, and which way a canopy slopes is ours. The bowl is lowered under it: the top row stands at least 6 feet under the canopy's low edge, so the bowl's heights are scaled to fit (ours).
- Walls stand on the building's outline up to just over the top row; the ends and the field are open.

## T-Mobile Park

A ballpark (`kind: "park"`), so its frame is home plate's, as every ballpark's is: `drawKyogijo({ sport: "mlb", park: "t-mobile-park", crowd: { real: true } })`, with the fence at the distances published for the park (331, 378, 401, 381 and 326 feet) and the stands behind it.

- **The seats**: 47,368 for baseball (the infobox's figure; Wikidata's own capacity, 47,476, is kept beside it). The usual ballpark stands (`parkLayout`: a lower and an upper band along the lines and round home plate, bleachers behind the outfield fence) with each band as deep as the seats of its levels need: the Main Level's 20,521 seats are the lower bowl, the Club (4,123), Suite (2,050) and View (15,902) levels the upper bowl, and the two bleacher sections' 3,666 the bleachers (all from the article's layout). The bands hold the seats to within two percent.
- **How home plate faces.** OpenStreetMap maps the infield (the grass inside the base paths, a square with its sides along the baselines, 4.4 degrees from north) but not which corner is home plate. The way to centre field is one of four, 45 degrees from the baselines; the one where the park's fence, and 20 metres of stands behind it, lie wholly inside the building's outline is 49.4 degrees (north-east), and the other three leave the fence outside it at several points. The build refuses to choose when the outline does not decide.
- **The roof.** A retractable roof in four sections (the article's count, not checked against another source) that does not fully enclose the ballpark, 217 feet above the field at its lowest and 269 at its top, and at rest over the railway to the east (all the article's). Closed, the drawing's roof is a band from the rim of the building's outline (92 percent of it) up to a crown over the middle with the fabric laid across it; open (`roofOpen`), the sections rest as slabs over the east third of the building. How they are cut into four and how thick they are is ours. The building's walls stand at the 21 metres OpenStreetMap maps for it, far under the roof.

## The stadiums

<!-- stadiums-table -->
| Key | Stadium | City | Wikidata | Seats | Bowls | Roof | The field | Outline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bc-place` | BC Place | Vancouver, Canada | Q612227 | 54,500 (cfl), 52,497 (soccer) | 2, documented | retractable, cable-supported (documented) | along 52.8° (from the roof's opening) | way 24705904, 38,441 m² |
| `lumen-field` | Lumen Field | Seattle, United States | Q612736 | 68,740 (nfl), 37,722 (soccer) | 3, documented | canopy over 70 percent of the seats (documented) | along 0° (as OpenStreetMap maps the pitch) | relation 2305831, 49,516 m² |
| `t-mobile-park` | T-Mobile Park | Seattle, United States | Q1193117 | 47,368 (mlb) | 4, documented | retractable, in four sections (documented) | home to centre field 49.4° (from the mapped infield and the outline) | relation 3008332, 42,127 m² |
<!-- /stadiums-table -->

Made by `pnpm stadiums` from `scripts/stadiums.data.json` and the files of `data-sources/stadiums/2026-10-20/`; do not edit by hand. Each fact says whether a source says it (`documented`) or it is ours (`plausible`), and what was read, in the file the table is made from.

## Sources and licences

- **OpenStreetMap, ODbL 1.0, (c) OpenStreetMap contributors.** The outline (a way, or a relation whose outer ways are joined into a ring), the roof's heights and opening (BC Place's relation 5836463, whose outer way is the building's own and whose inner way is the opening) or canopies (Lumen Field's two roof parts), the pitches (Lumen Field's) or the infield (T-Mobile Park's), and the axis worked out from them are a derived database. They live only in `src/stadiums.osm.data.ts` and in `data-sources/stadiums/`, are never copied into a CC0 or CC BY-SA file of the package and no such file is copied into them, and are offered under the ODbL with the credit `VENUE_ATTRIBUTION` (`(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright`). A drawing made from them is a produced work: it carries the credit and the description says so.
- **Wikidata, CC0.** The capacity (P1083) and the coordinates of the stadium's item.
- **English Wikipedia, CC BY-SA 4.0.** The capacity of each configuration and of the lower bowl (the infobox's list), the seats of a ballpark's levels, the number of bowls, the kind of roof, the size of BC Place's opening, the share of Lumen Field's seats its canopies cover and the heights of T-Mobile Park's roof, each with the article and the revision; the facts are numbers and words of ours, not the text. The article is credited in [NOTICE.md](../NOTICE.md#the-stadiums-sources).
- **Raw answers** are kept as they were returned in `data-sources/stadiums/2026-10-20/` (`pnpm stadiums:fetch` fetches them: one request at a time, ten seconds apart, with a User-Agent that names the project). `pnpm stadiums` makes the two data files and this page's table from them, and refuses a figure the sources do not give.

## Limits

- BC Place's orientation is inferred from the roof's opening, which the article says is the field's size; no source says it in so many words. Lumen Field's is mapped (its pitches); T-Mobile Park's is the mapped infield with the outline's choice of the way out. Where a stadium has none of these, the building's main hall is used, and where it has no direction nothing is said.
- The outline is OpenStreetMap's: where it takes in a plaza or a wing, so does the drawing, and the 3D walls and roof stand on the hall only.
- The bowls are fitted to the outline and the seats; real bowls have sections, overhangs, sightline corners and a suite level that are not drawn. The 3D heights, the pod and the cables' number are ours.
- The seats are the configuration's, from the sources named; they change with a renovation and with an event (the stadium's record crowds were more than either figure).
- BC Place's two configurations, Lumen Field's two and T-Mobile Park's one are all there are. Rugby, BC Place's lower-bowl-only seating (22,120 in the infobox) and the stadiums' other events are not drawn; a ballpark's football configuration (the article's 30,144) is not either.
- A ballpark's stands are the usual ones scaled to its seats: the shape of its decks, its overhangs and its bleachers' real places are not. The roof's sections and the way a canopy slopes are drawn as the sources say and ours where they do not.
