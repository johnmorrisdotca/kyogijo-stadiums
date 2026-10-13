# Special games

Some games are played on a surface that was built inside another: an NHL rink on a ballpark's infield, a rink at midfield of a football stadium, a college basketball court on the deck of a carrier, a baseball field laid over a stadium's running track. Kyogijo draws them as they were, to scale: the host as it is drawn alone, and the game's own surface set inside it, at its own size, with its lines, its team banners, its score and its data layers.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

const svg = drawKyogijo({
  sport: "nhl",
  host: { park: "wrigley-field" },
  placement: { x: 0, y: -69.5, angle: 0 },
});
console.log(svg.includes("ky-host"), svg.includes("NHL hockey rink in Wrigley Field"));
// true true
```

`sport` is the game's own surface, as always; `host` is what it is set inside, and `placement` is where it stands there. Nothing else about a drawing changes: `home` and `away` put the teams on the rink's ends and the score at its middle (the score stays upright when the rink is turned), `league` and `year` mark the rink as the NHL did that season, and a drawing with no `host` is the same string it always was.

## The host

Give one of these in `host`; its markings are those of `year` (the host's own, or the drawing's) where it has history.

| Option | The host | Its frame, in feet |
| --- | --- | --- |
| `park` | A ballpark of [`PARKS`](./ballparks.md), with the fence it had that season. | x across the field, y minus the distance out from the back of home plate, so that the outfield is up. |
| `ground` or `pitch` | A soccer [ground](./grounds.md) at its published size, or a pitch of a size or a preset. | x along the pitch from the left, y across it from the top. |
| `field` | A football field: `nfl`, `cfl` or `ifaf`, and a `league` such as `ncaa` for its rulebook. | x along the field from the back of the left end zone, y across it from the top. |
| `deck` | A plain rectangle, `{ length, width, unit }`: the deck of a ship. | x along it from the left, y across it from the top. |

`name` and `nameJa` say what the host is called in the title and the description when it is not a park or a ground that has a name.

## The placement

`placement` is `{ x, y, angle }` in the host's frame: the point of the game's surface that is put at `x` and `y`, and the turn in degrees about it, clockwise as the eye sees it. The point is the middle of a rink, a court or a field, and for a ballpark it is home plate. Without a `placement` the surface stands at the middle of the host's field, as it lies, and at the middle of a ballpark's infield; `conventionPlacement(rule, host)` gives the numbers of each rule.

A drawing of a special game is drawn as its host lies, wide, whatever `orientation` says: a ballpark is upright already, and a quarter turn would turn every word of the host's markings sideways. The view holds the host and the game's surface wherever it hangs over; the annotations of a surface (`direction`, `axes` and `landmarks`) are not drawn.

Data `layers` are in the game's surface, in its own frame and its own numbers: a point at (100, 42.5) is the middle of the rink wherever the rink stands. They are cut to the rink's outline and drawn over its lines.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

const svg = drawKyogijo({
  sport: "nhl",
  host: { field: "cfl", year: 2023 },
  layers: [{ kind: "points", name: "shots", data: [{ x: 100, y: 42.5 }, { x: 175, y: 30 }] }],
});
console.log(svg.includes('transform="translate(225 97.5) translate(-100 -42.5)"'));
// true
```

## The games

`EVENTS` (`@johnmorrisdotca/kyogijo/events`) holds eighteen games, in the order they were played, each with its day or days, its venue, what its surface was set inside, where, and the sources of all of it. `eventOptions(id)` gives the options that draw one; spread them into `drawKyogijo`, with teams for a score or without. The title and the description then say the game and its day, and how its place was decided.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";
import { EVENTS, eventOptions } from "@johnmorrisdotca/kyogijo/events";

const { name, dates, venue } = EVENTS["winter-classic-2009"];
console.log(name.en, dates[0], venue.en);
// 2009 NHL Winter Classic 2009-01-01 Wrigley Field
const svg = drawKyogijo({
  ...eventOptions("winter-classic-2009"),
  away: { name: "Detroit Red Wings", abbr: "DET", score: 6, color: "#ce1126" },
  home: { name: "Chicago Blackhawks", abbr: "CHI", score: 4, color: "#111111" },
  status: "final",
});
console.log(svg.includes("2009 NHL Winter Classic, January 1, 2009."));
// true
```

| `event` | Game | Day | Venue | Set inside | Where it stands | Beyond the host |
| --- | --- | --- | --- | --- | --- | --- |
| `heritage-classic-2003` | 2003 NHL Heritage Classic | November 22, 2003 | Commonwealth Stadium | a CFL field | convention: midfield | no |
| `winter-classic-2009` | 2009 NHL Winter Classic | January 1, 2009 | Wrigley Field | the ballpark | as the sources give it | 30 percent |
| `winter-classic-2010` | 2010 NHL Winter Classic | January 1, 2010 | Fenway Park | the ballpark | convention: infield | 36 percent |
| `heritage-classic-2011` | 2011 NHL Heritage Classic | February 20, 2011 | McMahon Stadium | a CFL field | convention: midfield | no |
| `carrier-classic-2011` | 2011 Carrier Classic | November 11, 2011 | USS Carl Vinson | a deck | convention: deck | no |
| `stadium-series-2014-dodger` | 2014 NHL Stadium Series at Dodger Stadium | January 25, 2014 | Dodger Stadium | the ballpark | convention: infield | 36 percent |
| `stadium-series-2014-yankee` | 2014 NHL Stadium Series at Yankee Stadium | January 26 and 29, 2014 | Yankee Stadium | the ballpark | convention: infield | 36 percent |
| `heritage-classic-2014` | 2014 NHL Heritage Classic | March 2, 2014 | BC Place | a CFL field | convention: midfield | no |
| `heritage-classic-2016` | 2016 NHL Heritage Classic | October 23, 2016 | Investors Group Field | a CFL field | convention: midfield | no |
| `winter-classic-2017` | 2017 NHL Winter Classic | January 2, 2017 | Busch Stadium | the ballpark | convention: infield | 36 percent |
| `winter-classic-2018` | 2018 NHL Winter Classic | January 1, 2018 | Citi Field | the ballpark | convention: infield | 36 percent |
| `winter-classic-2019` | 2019 NHL Winter Classic | January 1, 2019 | Notre Dame Stadium | an NCAA football field | convention: midfield | no |
| `mlb-london-2019` | 2019 MLB London Series | June 29 and 30, 2019 | London Stadium | a 105 by 68 metre pitch | convention: diamond | 64 percent |
| `heritage-classic-2019` | 2019 NHL Heritage Classic | October 26, 2019 | Mosaic Stadium | a CFL field | convention: midfield | no |
| `winter-classic-2022` | 2022 NHL Winter Classic | January 1, 2022 | Target Field | the ballpark | convention: infield | 36 percent |
| `winter-classic-2023` | 2023 NHL Winter Classic | January 2, 2023 | Fenway Park | the ballpark | as the sources give it | 26 percent |
| `mlb-london-2023` | 2023 MLB London Series | June 24 and 25, 2023 | London Stadium | a 105 by 68 metre pitch | convention: diamond | 65 percent |
| `heritage-classic-2023` | 2023 NHL Heritage Classic | October 29, 2023 | Commonwealth Stadium | a CFL field | convention: midfield | no |

Each game's sources, with what each gave, are in [sources.md](./sources.md#special-games); the Wikipedia articles are in the NOTICE as well, each at the revision it was read at. The dates of the Winter Classics of 2009 to 2023 and of the Heritage Classics are those of their articles; the NHL's rink is drawn at the size of its rulebook, 200 by 85 feet, for every game, as the 2009 story that prints that size does, and no source read gives another.

### Where each surface stands

A source gives the place for two games. For the rest no source read says where the surface stood, and **the place is a convention, not a measurement**: the drawing, its description and the table above say so, and no offset was made up.

- **As the sources give it.** *Wrigley Field, 2009:* the rink ran from first base to third, 200 by 85 feet, and "sits 112 feet from home plate and 288 feet from the center-field wall" (Sports Video Group, 30 December 2008): 112 and 288 make the 400 feet to the wall at dead centre, so the rink's edge toward centre field is 112 feet out and its middle is 69.5 feet out, within 9 feet of the pitching mound, where Dan Craig, who built the rink, says centre ice was (NHL.com, 29 December 2024). *Fenway Park, 2023:* the rink is "roughly centered length-wise across the first and third bases", its 200 feet "stretched along a second-to-third-base axis" (The Boston Globe, 18 December 2022), which is drawn as its middle halfway between first and third with its length turned 45 degrees, from third base toward second.
- **`infield`.** A rink in a ballpark with no source for its place: its middle on the middle of the infield, 63.64 feet from the back of home plate (where the line from first base to third crosses the line from home plate to second), its length across the field from first base to third, the direction the rink at Wrigley Field had in 2009.
- **`midfield`.** A rink in a football stadium, or a court on a deck: its middle on the middle of the field (the middle of the end lines and the sidelines, the end zones counted), its length along the field.
- **`diamond`.** A baseball field laid over a stadium's pitch: the middle of its infield on the middle of the pitch, home plate to centre field along the pitch, which is a choice and not a finding: the London Series' article says the field was laid over the running track and the pitch and says no more about where.

`conventionPlacement(rule, host)` works out a convention's numbers, and a test holds every game's to them.

### Inside, or beyond

`eventFit(id)` says how the surface sits in its host: `{ inside, outside }`, where `outside` is the share of the surface's area beyond the host's outline. The rinks in football stadiums and the court on the deck lie wholly inside. A rink on a ballpark reaches beyond the fair ground, over foul ground (the host's outline is the fair ground inside the fence, so this is what a rink across the infield does), and a baseball field laid over a soccer pitch is mostly beyond the pitch, over the track round it. A drawing says which, in its description.

```ts
import { eventFit } from "@johnmorrisdotca/kyogijo/events";

console.log(eventFit("heritage-classic-2023"), eventFit("winter-classic-2009").inside);
// { inside: true, outside: 0 } false
```

## Things to know

- **BC Place** has a retractable roof, and it was closed for the 2014 Heritage Classic; the field is drawn as the CFL's, as the stadium's football tenant plays it, and the same is true of the other Canadian stadiums. **Notre Dame Stadium** is drawn as the NCAA marks a field.
- **The carrier's deck** is a plain rectangle of the Nimitz class's overall length and beam, 1,092 by 252 feet. The flight deck is angled and narrower at its ends, so the rectangle is its bounding box; a court is 94 feet long on it, and tiny, to scale.
- **London Stadium** has a field of play of 105 by 68 metres; the baseball field was laid over it and the running track. Its fence is 330 feet to the foul poles, 382 to left centre and right centre and 385 to centre field in 2019, and 387 and 392 in 2023, as the article gives them. The five distances are those of the usual `fence` option, so the two points the article calls "left center" and "right center" are drawn at the usual 22.5 degrees.
- **The title** of a drawing is the surface and its host (`NHL hockey rink in Wrigley Field`); the description adds the game and its day, where the surface stands, and how much of it is beyond the host. Both are in English and in Japanese.
- **Colours:** the host keeps the colours of its own sport (`.ky-host[data-sport=mlb]` in the stylesheet): a ballpark's grass under a rink's ice, whatever the look. The game's surface takes the drawing's `look`, `colors` and `featureColors`.

## What is not drawn

- **Football in a ballpark.** The Northwestern and Illinois game at Wrigley Field on November 20, 2010 was played on a field that ran east to west, third base to right field, with the east end zone within a foot of the right-field wall and every offensive play toward the west end zone; the Bears' field there, from 1921 to 1970, ran north to south, from left field to the foul side of first base, with a south end zone of eight yards, not ten. (Wikipedia, *Wrigley Field*, revision 1377918987.) Those give a direction in words and no place in feet, and the ballpark's compass heading is in no source read, so there is nothing to place the field by short of inventing it. No football game at Yankee Stadium is drawn either: none was read.
- **Gocheok Sky Dome** (Seoul, 2024) and **Estadio Alfredo Harp Helú** (Mexico City, 2023) are baseball stadiums, not a surface set inside another: they would be parks of their own, and `PARKS` holds the parks of MLB and NPB only. Their fences were not read.
- **The London Series of 2024** (June 8 and 9): the article restates no fence for it, and the 2023 figures are not carried over.
- **The Winter Classics of 2008, 2011 to 2016, 2020, 2024 to 2026** and the Stadium Series games of 2014 at Soldier Field and after, are not in the table; each needs a date, a venue and a host, which a new entry of `EVENTS` gives.

The sources of the figures and the dates are in [sources.md](./sources.md#special-games).
