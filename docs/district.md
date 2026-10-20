# A district of venues

Several real venues of one city on one plan, each at its real position and turned as it lies in the world. `drawDistrict({ venues: ["bc-place", "rogers-arena"] })` draws BC Place and Rogers Arena side by side as they stand in Vancouver, and `mountDistrictTurn` turns the pair around together in [3D](./turn.md). A district is a list of venue keys, whichever kinds they are (an arena of [the real venues](./venues.md), a stadium of [the real stadiums](./stadiums.md)), and the plan fits itself to them, so a city with stadiums near each other is a longer list and nothing else.

Each venue is drawn the way its own page draws it: nothing is drawn a second way. The district adds the ground, a grid, a scale, one north arrow and, where asked, a name beside each; it takes out each venue's own arrow and apron. There is no street, no park and no mark of a club, a league or a tournament.

![BC Place and Rogers Arena in 3D from the main camera: the football field in its roofed stadium on the left and the hockey rink in its arena on the right, on one ground with a grid, a scale of 50 metres and a north arrow, each with its name over it](./images/district-bc-rogers-3d-desk-light.webp)

```ts
import { drawDistrict, planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";

const plan = planDistrict({ venues: ["bc-place", "rogers-arena"] });
console.log(plan.mode, plan.members.map((m) => m.member.key).join(" "), Math.round(plan.between[0].metres));
// neighbours bc-place:cfl rogers-arena 264
const svg = drawDistrict({ venues: ["bc-place:soccer", "rogers-arena"] });
console.log(svg.includes("ky-district"), svg.includes('data-venue="bc-place:soccer"'));
// true true
```

The demo's [district page](https://johnmorrisdotca.github.io/kyogijo-stadiums/district.html?venues=bc-place,rogers-arena) shows it in 2D and 3D, with the venues, the fit, the turn and the names to choose, in English and Japanese.

## The venues

A venue is a key of `VENUES` (the NHL arenas) or `STADIUMS`, as a string or an object: `"rogers-arena"`; `"bc-place"` (a stadium in its first configuration); `"bc-place:soccer"` or `{ id: "bc-place", config: "soccer" }` (the configuration named). `districtMember(key)` says what a key is: its name in both languages, its outline, the middle of its surface, the way the surface lies, its seats and the options it is drawn from. An unknown key throws and names the keys there are (`DISTRICT_IDS`); a venue twice in a district throws, except one stadium in two configurations, which is a comparison and not a twin.

## The plan

`planDistrict` puts each surface where it is on the ground and turns it as it lies:

- The distance and the direction from one venue to the next come from the coordinates of OpenStreetMap's outlines (the middle of each surface: the ice or the field), on a plane tangent to the earth at the district's middle. The distance between middles is the great-circle distance to a metre or so (`plan.between`); Rogers Arena stands 264 metres north-east of BC Place's field.
- Each venue's drawing, which has its surface along the page, is turned by the heading of the surface's long side less a quarter turn (`placed.angle`), about the middle of the surface, and put where the plan says. A venue whose orientation is not known (an arena whose building has no direction) lies east-west, as it is drawn alone.
- The map is turned by `turn` degrees clockwise: 0 (the default) has north at the top; `"auto"` turns it so that the district's long way lies across the page.
- The frame fits the buildings' outlines with a margin that depends on the mode.

### Neighbours and a city

`mode` says how far apart the venues are, and so how the plan is fitted:

| | `neighbours` (the default) | `city` |
| --- | --- | --- |
| For | Buildings within a few hundred metres of each other: BC Place and Rogers Arena | Venues kilometres apart |
| The frame | Tight round the buildings (9 percent margin) | The real distances, a wider margin (12 percent) |
| The grid | A line every 100 metres | A line every kilometre |
| Names | Off unless asked | Beside every venue |

The scale bar is the largest round length (50, 100, 200, 500, 1,000, 2,000 or 5,000 metres) that is no more than a fifth of the plan's width. A venue that is a long way off is a small building on a large ground: that is the distance, drawn to scale, and the 3D view zooms to it.

## In 3D

`buildDistrictTurn` makes a [`TurnModel`](./turn.md) like any other, so the camera, the four viewpoints, the controls, the pointer, the keys and the auto-turn are the 3D view's own, and its fit is steady: the scale and the place are one for the whole circle, so turning never zooms in and out or sways. Each venue is built as it is on its own (`buildTurn`: the stands, the walls and the roof with `venue: { roof: true }`, the goals and the posts), its planes turned about the middle of its surface and moved to its place; the floor is the district's plan with each building's outline only.

**The buildings are drawn one after another.** The 3D view stacks its planes by the depth of their middles, which puts the roof of a far building over the wall of a near one when the two stand close. A district gives each building its planes' `group` and the model its buildings' convex hulls (`TurnModel.groups`); from a view, one building is in front of another when a line can be put between them and the eye is on its side of it (and a nearer middle where no line can), and the far one is drawn first. For BC Place and Rogers Arena this puts the buildings in the right order in every one of 168 views tried (every five degrees of turn at three tips) where depth alone got 56 of them wrong; within a building the planes go by depth as before. `groupRanks` is the rule.

The viewpoints turn with the map (`districtPresets`): the main camera looks over the district from the south when north is up. `labels` stands a name over each building on a sign that faces the eye.

## Limits

- The plan is the venues' own outlines, not a map: no street, water or park is drawn, which would need more OpenStreetMap data and its credit. `city` is the real distances without a base map.
- A building's outline is OpenStreetMap's: where it takes in a plaza or a wing, so does the plan, and two outlines can touch.
- Depth between buildings is exact for buildings a line can separate; two that no line separates (outlines that overlap) are ordered by their middles.
- The ground is flat: no hill or street level.

Every drawing and view carries the credit `VENUE_ATTRIBUTION` in its description: (c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright.
