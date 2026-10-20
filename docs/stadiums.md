# The real stadiums

A stadium of football and soccer drawn in the building it stands in: the outline of the building as OpenStreetMap maps it, the field lying in it, and a bowl of seats fitted inside it from what the sources say (how many seats in each configuration, how many seating bowls, what kind of roof). `drawKyogijo({ sport: "cfl", stadium: "bc-place", crowd: { real: true } })` draws it, and the [3D view](./turn.md) raises it. It is [the real venues](./venues.md)' counterpart for a field and not a rink. So far there is one, BC Place in Vancouver, in its two configurations: the football field of the Canadian league and a soccer pitch.

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

The stadium is the key in [`STADIUMS`](#the-stadium) (the key of its ground in [`GROUNDS`](./grounds.md)): `stadium` names it for a football field (`sport: "cfl"`) or a soccer pitch (`sport: "soccer"`), and a soccer drawing whose `ground` is a stadium needs no other. Any other sport, a `league` of your own and `crowd: { real: false }` leave the stands as they were. The demo's [stadiums page](https://johnmorrisdotca.github.io/kyogijo-stadiums/stadiums.html) and the [gallery](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery-stadiums.html) draw both configurations in 2D and in 3D, in English and Japanese, and puts the stadium [beside Rogers Arena](./district.md).

## The two configurations

The building is one, and so is the bowl; what changes is the field and the seats the stadium has for it:

- **Football (`sport: "cfl"`).** The field of the Canadian league, 150 by 65 yards with its 20-yard end zones (the article says the stadium was the first to use a 20-yard end zone), and 54,500 seats: the infobox's first capacity, which Wikidata's capacity (P1083) also gives.
- **Soccer (`sport: "soccer"`).** The pitch at the international 105 by 68 metres, and 52,497 seats: the infobox's figure for the 2026 tournament, 2,003 fewer than its first (the article's own words say neither why nor which seats; the lower bowl is kept and the upper bowl takes the difference). The article gives the soccer pitch as 117 by 75 yards (about 107 by 69 metres), which is not a size of the infobox's for international matches, so [`GROUNDS`](./grounds.md) keeps the international size for this ground and so does the drawing.

The same 27,695 seats are the lower bowl in both: the infobox lists them as "lower bowl", and the article says the stadium's soccer club sold only the lower bowl for years.

## The two levels

**Level one is the building.** The outline is the closed way OpenStreetMap tags with the stadium's Wikidata item, read with the Overpass API on 2026-10-20 and simplified to a metre. It is drawn as it is, annexes and all, under the stands, in the colour of a concourse. The field lies along the **opening in the roof**: OpenStreetMap maps the roof as a multipolygon of its band and the opening in it, and the article says the opening is 100 by 85 metres, "the same size as the field below". The mapped opening measures 101.8 by 85.3 metres, long side 52.8 degrees from north, and the building's own main hall (the largest rectangle that fits its outline) runs the same way to within a few degrees. The drawing is turned so that the field lies along the page, and a small arrow marked N says where north is.

**Level two is the bowl.** From the first row, which stands from a football field's footprint where the package's own gridiron stands have it (42 feet from a side line, 28 from an end line), out to the wall of the building, between them the two bowls:

- The seats are the configuration's. Each bowl's outer edge is placed so that its band holds its share of them, with a walk between the bowls. A bowl that fits holds exactly the configuration's seats; BC Place's building has room for soccer's 52,497 at 3.8 square feet of floor a seat in the plan and for football's 54,500 at 3.4 (the bowl is steeper than the usual drawing's, whose seat takes 4.6), and the plan says `tight` where even 3 would not hold them.
- The lower bowl holds the share the infobox gives, 27,695 seats; the upper bowl the rest.
- The outer edge of the bowl is the largest rounded rectangle, between 1.15 and 1.6 times as long as it is wide, that fits inside the outline round the middle of the field, with a wall's depth to spare.
- The rows rise at most 36 degrees; the heights (5 feet for the first row, 38 and 62 feet of rise for the lower and the upper bowl, a suite level of 24 feet between them) are ours: no source gives them.
- **The roof** (3D, with `venue: { roof: true }`) is the one the article describes: a retractable roof supported by cables. Its rim stands where OpenStreetMap maps it, 48 metres (the building part's height of 61 metres less the roof's own 13), the roof rises 13 metres from the rim to the edge of the opening, and each piece of the roof carries a cable along its edge. Over the opening, with the roof closed, lies the fabric (drawn thin, so that the seats show through it), and in the middle of it the pod, a box hung at the crown's height (its size is ours: the article says the fabric retracts into a pod above the suspended video board, not how large it is). With `venue: { roof: true, roofOpen: true }` the fabric has gathered into the pod and only the pod stays.

## The stadium

<!-- stadiums-table -->
| Key | Stadium | City | Wikidata | CFL football | Soccer | Bowls | Roof | The field | Outline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bc-place` | BC Place | Vancouver, Canada | Q612227 | 54,500 | 52,497 | 2, documented | retractable, cable-supported (documented) | along 52.8° (from the roof's opening) | way 24705904, 38,441 m² |
<!-- /stadiums-table -->

Made by `pnpm stadiums` from `scripts/stadiums.data.json` and the files of `data-sources/stadiums/2026-10-20/`; do not edit by hand. Each fact says whether a source says it (`documented`) or it is ours (`plausible`), and what was read, in the file the table is made from.

## Sources and licences

- **OpenStreetMap, ODbL 1.0, (c) OpenStreetMap contributors.** The outline, the roof's heights and opening (relation 5836463, whose outer way is the building's own and whose inner way is the opening), and the axis worked out from the opening are a derived database. They live only in `src/stadiums.osm.data.ts` and in `data-sources/stadiums/`, are never copied into a CC0 or CC BY-SA file of the package and no such file is copied into them, and are offered under the ODbL with the credit `VENUE_ATTRIBUTION` (`(c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright`). A drawing made from them is a produced work: it carries the credit and the description says so.
- **Wikidata, CC0.** The capacity (P1083) and the coordinates of the stadium's item.
- **English Wikipedia, CC BY-SA 4.0.** The capacity of each configuration and of the lower bowl (the infobox's list), the number of bowls, the kind of roof and the size of its opening, each with the article and the revision; the facts are numbers and words of ours, not the text. The article is credited in [NOTICE.md](../NOTICE.md#the-stadiums-sources).
- **Raw answers** are kept as they were returned in `data-sources/stadiums/2026-10-20/` (`pnpm stadiums:fetch` fetches them: one request at a time, ten seconds apart, with a User-Agent that names the project). `pnpm stadiums` makes the two data files and this page's table from them, and refuses a figure the sources do not give.

## Limits

- The orientation is inferred from the roof's opening, which the article says is the field's size; no source says it in so many words. Where a stadium has no opening mapped, the building's main hall is used, and where it has no direction nothing is said.
- The outline is OpenStreetMap's: where it takes in a plaza or a wing, so does the drawing, and the 3D walls and roof stand on the hall only.
- The bowls are fitted to the outline and the seats; real bowls have sections, overhangs, sightline corners and a suite level that are not drawn. The 3D heights, the pod and the cables' number are ours.
- The seats are the configuration's, from the sources named; they change with a renovation and with an event (the stadium's record crowds were more than either figure).
- A stadium's configurations are the two of this release. Rugby and the soccer club's lower-bowl-only seating (22,120 in the infobox) are not drawn.
