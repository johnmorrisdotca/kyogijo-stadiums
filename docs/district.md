# A district of venues

Several real venues of one city on one plan, each at its real position and turned as it lies in the world. `drawDistrict({ venues: ["bc-place", "rogers-arena"] })` draws BC Place and Rogers Arena side by side as they stand in Vancouver, and `mountDistrictTurn` turns the pair around together in [3D](./turn.md). A district is a list of venue keys, whichever kinds they are (an arena of [the real venues](./venues.md), a stadium, a ballpark or a hall of [the real stadiums](./stadiums.md)), and the plan fits itself to them, so a city with stadiums near each other is a longer list and nothing else.

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

A venue is a key of `VENUES` (the NHL arenas) or `STADIUMS` (the stadiums and the ballparks), as a string or an object: `"rogers-arena"`; `"bc-place"` (a stadium in its first configuration); `"bc-place:soccer"` or `{ id: "bc-place", config: "soccer" }` (the configuration named); `"t-mobile-park"` (a ballpark has one, `mlb`); `"korakuen-hall"` (a hall has one, `boxing`). `districtMember(key)` says what a key is: its name in both languages, its outline, the middle of its surface, the way the surface lies, its seats and the options it is drawn from. An unknown key throws and names the keys there are (`DISTRICT_IDS`); a venue twice in a district throws, except one stadium in two configurations, which is a comparison and not a twin.

## The plan

`planDistrict` puts each surface where it is on the ground and turns it as it lies:

- The distance and the direction from one venue to the next come from the coordinates of OpenStreetMap's outlines (the middle of each surface: the ice or the field), on a plane tangent to the earth at the district's middle. The distance between middles is the great-circle distance to a metre or so (`plan.between`); Rogers Arena stands 264 metres north-east of BC Place's field.
- Each venue's drawing, which has its surface along the page, is turned by the heading of the surface's long side less a quarter turn (`placed.angle`), about the middle of the surface, and put where the plan says. A ballpark's drawing is about home plate and its frame is turned a quarter from the way out to centre field, so its angle is the heading of that way: T-Mobile Park's drawing is turned 49.4 degrees, centre field to the north-east. A venue whose orientation is not known lies as it is drawn alone: an arena whose building has no direction east-west, and a ballpark nothing says how it lies (Tokyo Dome) the way that fits its building, with `basis` `none` and no arrow of its own.
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

## Seattle: two neighbours and a city

The same keys give a second district, of three different venues: `["t-mobile-park", "lumen-field"]` for the two stadiums of SoDo, 459 metres apart, a ballpark and a football stadium side by side with Lumen Field to the north; and `["t-mobile-park", "lumen-field", "climate-pledge-arena"]` with `mode: "city"` for the three, the arena (already drawn in [the real venues](./venues.md)) 3.4 kilometres from Lumen Field and 3.8 from the ballpark, at their real distances, with a grid of kilometres and a name beside each (the scale bar is 500 metres). In 3D each is a building of its own and the far one is drawn first from every side, which for three at these distances is the same rule as for two.

![Lumen Field and T-Mobile Park in 3D from the main camera: a football stadium under two canopies to the north and a ballpark under its roof to the south, on one ground with a grid, a scale of 50 metres and a north arrow, each with its name over it](./images/district-seattle-3d-desk-light.webp)

```ts
import { planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";

const sodo = planDistrict({ venues: ["t-mobile-park", "lumen-field"] });
console.log(sodo.mode, Math.round(sodo.between[0].metres), sodo.members[0].angle.toFixed(1));
// neighbours 459 49.4
const city = planDistrict({ venues: ["t-mobile-park", "lumen-field", "climate-pledge-arena"], mode: "city" });
console.log(city.mode, city.between.map((b) => Math.round(b.metres)).join(" "));
// city 459 3782 3425
```

The demo's [district page](https://johnmorrisdotca.github.io/kyogijo-stadiums/district.html?venues=t-mobile-park,lumen-field&labels=1) has both as presets.

## Tokyo Dome City: a ballpark and a hall

`["tokyo-dome", "korakuen-hall"]` puts Tokyo Dome, a ballpark under its air-supported roof, and Korakuen Hall, the hall with a boxing ring that stands in the same complex about 140 metres south of the Dome's middle, side by side as neighbours: the ballpark's key has the one configuration `mlb` and the hall's the one `boxing`, so the district names them `tokyo-dome:mlb` and `korakuen-hall:boxing`. The hall is a kind of venue of its own (`member.kind` is `"hall"`) and is drawn with the boxing ring in the middle of its seats. Tokyo Dome's orientation is not known (no diamond is mapped in the dome), so its drawing lies the way that fits its building, `basis` is `none`, and the district's north arrow is the only one; the hall's is inferred from its building's long axis. In 3D each is a building of its own, the Dome's roof a lens over the whole ballpark.

![Tokyo Dome and Korakuen Hall in 3D from a low corner: a ballpark under an air-supported roof, a lens of pale pieces over the stands and the field, and a small hall to its south with its lid, on one ground with a grid, a scale of 50 metres and a north arrow, each with its name over it](./pictures/district-tokyo-3d-desk-light.webp)

```ts
import { planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";

const tokyo = planDistrict({ venues: ["tokyo-dome", "korakuen-hall"] });
console.log(tokyo.mode, tokyo.members.map((m) => `${m.member.key} ${m.member.kind} ${m.member.basis}`).join(", "));
// neighbours tokyo-dome:mlb park none, korakuen-hall:boxing hall building
```

The demo's [district page](https://johnmorrisdotca.github.io/kyogijo-stadiums/district.html?venues=tokyo-dome,korakuen-hall&labels=1) has it as a preset, in English and Japanese.

## Among its buildings: Project PLATEAU

A district can stand among the buildings round it. `context` takes areas of data a page passes in, and `@johnmorrisdotca/kyogijo-stadiums/plateau` has one, `TOKYO_DOME_CITY`: the 734 buildings within 500 metres of the middle of Tokyo Dome City, from Project PLATEAU, the Ministry of Land, Infrastructure, Transport and Tourism's 3D city model of Bunkyo ward (2025 edition). A district that does not ask for them is drawn as it always was and carries none of the data.

![Tokyo Dome City among its buildings in 3D from a low corner: the ballpark under its roof and the hall beside it, with the blocks of the neighbourhood standing round them at their real heights, the hotel tower in front and the ward office tower behind, on one ground with a scale of 100 metres](./pictures/district-tokyo-context-3d-desk-light.webp)

```ts
import { planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";
import { TOKYO_DOME_CITY } from "@johnmorrisdotca/kyogijo-stadiums/plateau";

const plan = planDistrict({ venues: ["tokyo-dome", "korakuen-hall"], context: [TOKYO_DOME_CITY] });
const { blocks, owned } = plan.context!;
const heights = blocks.map((b) => b.height / 3.28084);
console.log(blocks.length, owned, blocks.filter((b) => b.ghost).length, Math.max(...heights).toFixed(1));
// 364 2 1 155.0
```

- **What is drawn.** On the floor every building in the frame, flat, in four tones by height (under 15 metres, 45, 100, and taller), under the venues; in 3D the 130 biggest and tallest of them as blocks, a wall for each side of its outline up to its eaves, lit by the way it faces in three tones, and a roof (a hip roof, with its ridge along the building's long side, where PLATEAU's LOD2 shape has a pitched roof and the outline is a plain convex one; a flat one otherwise). The detail is low on purpose: the heights are the point.
- **The frame.** It takes in the streets round the venues, 150 metres on every side, and grows to take in any landmark, a building of 100 metres or more within 400 metres of them: Tokyo Dome Hotel, 155 metres (154.9 as PLATEAU measured it; heights are kept to half a metre), stands 370 metres from the hall, and Bunkyo Civic Center, about 139 metres, to the north.
- **A venue is its own.** The Dome is drawn from its own outline and shell, so the buildings of the model that are the Dome's (its stands and its roof, `plan.context.owned`) are left out. Korakuen Hall stands inside a larger building of the model that would hide it, so that building is a ghost: pale on the floor and nearly clear in 3D. The hall in its building, at its floor, is a later release's.
- **Heights.** A height is PLATEAU's measured height of the building's top above its ground (a building the model gives none, or a bad one, takes its LOD1 block's, or six metres). The Dome is 54.8 metres in PLATEAU, 56.19 in OpenStreetMap and Wikipedia, and the venue keeps the figure it has. The ground is flat.
- **How it is made, once, at build time.** `pnpm plateau:fetch` reads the ward's CityGML by range requests (the 640 MB zip is not downloaded: its directory and the four building files the area touches, 2 to 5 MB each compressed), keeps the buildings round the middle as PLATEAU gives them in `data-sources/plateau/<date>/`, and `pnpm plateau` cuts them down: the roof-edge outline simplified to 0.6 metres on a half-metre grid, the height, and the rise of a pitched roof. Nothing is read or requested at run time. The file is 40 KB (16 KB gzipped); `docs/entry-points.md` has the entry.
- **The data file is made of layers.** A `ContextArea` is one frame (an origin in longitude and latitude, a grid step and a radius, in metres east and north of the origin) and separate `layers`, each with its own source, licence, credit and rows: today `buildings`; trees and land cover from another source are added beside it, in the same frame, with no change to the buildings.

**The terms.** PLATEAU's [site policy](https://www.mlit.go.jp/plateau/site-policy/) (clause 3) lets anyone use its data free of charge, commercial use included, and is compatible with Creative Commons Attribution 4.0 and the Public Data License 1.0; the source is to be credited and what was edited is to say so, and MLIT's name is not to be used as though it made the result. The copyright of a ward's data belongs to its local government. The credit goes in the description of every drawing and view that uses the buildings, in the district's language: "Project PLATEAU, Ministry of Land, Infrastructure, Transport and Tourism (MLIT), https://www.mlit.go.jp/plateau/ (3D city model of Bunkyo ward, 2025 edition), simplified and edited by Kyogijo Stadiums; not made by MLIT". The data is in `src/plateau.data.ts`, apart from OpenStreetMap's (ODbL) and from every CC0 file, and `NOTICE.md` names it.

## The Kodokan: the great dojo in the air

`"kodokan"` is a venue of a district like the others: the Kodokan Judo Institute in Kasuga, Bunkyo, about 300 metres north-east of Tokyo Dome, with its main dojo, the great dojo, drawn in the air, on its real floor, inside the building. The building is PLATEAU's, the room and its mats are the package's own judo dojo, [the one the atlas draws](./budo.md#famous-halls-on-the-atlas), and the floor of the room is as high over the ground as the 7th floor of an 8-storey building.

![The Kodokan's main dojo in 3D: four pale contest areas on green mats on a floor in the air, a gallery of seats on all four sides and the raised seat of honour at the front wall, inside the building's outline drawn as a see-through ghost](./pictures/district-kodokan-3d-desk-light.webp)

```ts
import { planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";

const plan = planDistrict({ venues: ["kodokan"] });
const member = plan.members[0].member;
console.log(member.key, member.kind, member.seats, (member.elevation! / 3.28084).toFixed(1));
// kodokan hall 900 31.9
```

- **What a source says.** The main dojo is on the 7th floor, has 420 mats and four official contests can be held in it at the same time; the gallery is on the 8th floor and seats about 900; the building has eight floors and a basement. The Kodokan's own page ([its facilities page](https://kdkjudo.org/%e6%96%bd%e8%a8%ad%e3%81%ae%e3%81%94%e6%a1%88%e5%86%85/)), [English Wikipedia](https://en.wikipedia.org/wiki/Kodokan_Judo_Institute) (read on 2026-10-22; last edited 2026-04-20) and the [IJF](https://www.ijf.org/news/show/kodokan-an-institution-a-legendary-place-and-a-training-venue) say it. The floor is drawn as 420 jō (the atlas's count, a floor of 26.4 metres square, on which the four 8-metre areas fit), the gallery with 3 rows of seats on each side.
- **What the building says.** PLATEAU's model of Bunkyo ward has it as one building: 8 storeys above ground, 43.1 metres, an outline of ten points (OpenStreetMap's way 170598646, with 8 levels and Wikidata Q1165384, is the same outline, read as a check and not copied). The 7th floor is six storeys up at the building's own storey height, 5.4 metres, which puts the floor 32.3 metres up; the room is 11.2 metres high (the dojo's 4.5-metre walls, the gallery level with their tops, the lid), two storeys, so the floor is set at 31.9 metres to leave the room under the roof.
- **What is ours.** No source gives the shape of the floor or the room's place in the building, so the floor is a square, and the room (walls and gallery, 31.8 metres square) is put where it stands farthest from the building's walls, whichever way it is turned (`scripts/build-plateau.mjs`; 0.18 metre clear). Its wood is none: the atlas draws 4 metres of wood all round the mats, which would not stand inside the real outline. The storey height is the building's average.
- **The building.** `building: "xray"` (the default) draws it with each wall giving way to the eye as the view comes round to that side and looks in, to a trace of itself, and the roof nearly clear; `"solid"` draws it whole; `"none"` leaves it out and the dojo floats on its floor alone. On the plan it is a pale ghost, in its tone of height when solid, under the room. The building of the model that is the same one is left out of the surrounding `context`, whichever you ask.
- **The credit.** A district with the Kodokan carries PLATEAU's credit in its description, with or without the surrounding buildings.

The demo's [district page](https://johnmorrisdotca.github.io/kyogijo-stadiums/district.html?venues=tokyo-dome,korakuen-hall,kodokan) has the Kodokan as a choice in the Tokyo district and a preset, "Tokyo Dome City and the Kodokan", with the building's three states in the address (`building=solid`, `building=none`). The main camera looks over the district from the south, where taller buildings stand in front of the Kodokan: turn the view with the arrows, or open it with `yaw` and `pitch` in the address, as [this view from the north](https://johnmorrisdotca.github.io/kyogijo-stadiums/district.html?venues=tokyo-dome,korakuen-hall,kodokan&view=3d&yaw=150&pitch=55) does.

## In 3D

`buildDistrictTurn` makes a [`TurnModel`](./turn.md) like any other, so the camera, the four viewpoints, the controls, the pointer, the keys and the auto-turn are the 3D view's own, and its fit is steady: the scale and the place are one for the whole circle, so turning never zooms in and out or sways. Each venue is built as it is on its own (`buildTurn`: the stands, the walls and the roof with `venue: { roof: true }`, the goals and the posts), its planes turned about the middle of its surface and moved to its place; the floor is the district's plan with each building's outline only.

**The buildings are drawn one after another.** The 3D view stacks its planes by the depth of their middles, which puts the roof of a far building over the wall of a near one when the two stand close. A district gives each building its planes' `group` and the model its buildings' convex hulls (`TurnModel.groups`); from a view, one building is in front of another when a line can be put between them and the eye is on its side of it (and a nearer middle where no line can), and the far one is drawn first. For BC Place and Rogers Arena this puts the buildings in the right order in every one of 168 views tried (every five degrees of turn at three tips) where depth alone got 56 of them wrong; within a building the planes go by depth as before. `groupRanks` is the rule.

The viewpoints turn with the map (`districtPresets`): the main camera looks over the district from the south when north is up. `labels` stands a name over each building on a sign that faces the eye.

## The crowd outside

`outside: { level: 25 }` puts a quarter of the venues' seats' worth of people on the sidewalks, plazas and grounds round the buildings, never on a road, in 2D (`mountDistrict`) and in 3D, for BC Place and Rogers Arena. It is [its own page](./outside.md): the walkable ground it stands on, the levels, the licence and the cost.

## Limits

- The plan is the venues' own outlines and, with `context`, the buildings round them, not a map: no street, water or park is drawn (a [crowd outside](./outside.md) shows where the roads are by where it is not), which would need more OpenStreetMap data and its credit. `city` is the real distances without a base map (a base map from OpenStreetMap, or Chizu's, is not here).
- A venue a few kilometres off is a small building on a large ground: the 3D view zooms to it, and flying from one to the next is [the fly-through](./flythrough.md)'s, which does not take a district.
- A building's outline is OpenStreetMap's: where it takes in a plaza or a wing, so does the plan, and two outlines can touch.
- Depth between buildings is exact for buildings a line can separate; two that no line separates (outlines that overlap) are ordered by their middles.
- The ground is flat: no hill or street level.

Every drawing and view carries the credit `VENUE_ATTRIBUTION` in its description: (c) OpenStreetMap contributors, ODbL 1.0, openstreetmap.org/copyright; one with `context` carries the credit of its buildings too.
