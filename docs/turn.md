# The 3D view

A surface drawn flat hides what stands on it: a net, a basket, a goal, the posts of a football field. `@johnmorrisdotca/kyogijo-stadiums/turn` shows any surface as a floor that turns. The floor is the flat drawing itself, with its score, its data layers and its labels; it is tipped and turned by the mouse, a finger, the wheel or the keys, and what the rulebook puts on the surface stands up on it, at the rulebook's height.

![A volleyball court from behind an end line: the net at 2.43 m on its posts, with the antennae, and the viewpoint buttons under it](./images/turn-volleyball-desk-light.webp)

It is plain DOM and CSS, with no dependency and no canvas. Each part that stands up (a net, a pane of glass, a backboard, the two strips that make a post) is a flat rectangle with a little SVG on it, and each carries its whole place on the screen in one `matrix3d`; the parts are stacked far to near by `z-index`. Nothing is nested in 3D (no `preserve-3d`, no `perspective` on a parent), so a browser that cannot keep nested 3D layers, as Safari on a phone sometimes cannot, draws it as it is meant. The drawing it is made from is the one `drawKyogijo` draws, so the 3D view is an enhancement over the static SVG, which stays what a server renders.

A tournament layout (several surfaces on one floor) turns the same way: `mountMultiTurn` of [the layouts page](./multi.md#in-3d) gives it these viewpoints, controls and camera. So does a [judging assignment](./judging.md#in-3d): `mountJudgingTurn` stands the judges' table with a name card in front of each judge. A results board, a bout presentation or a medal table can lie over the view as a layer that does not turn with it: [boards over a surface](./boards.md#in-3d).

## Put one in a page

```ts no-run
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const view = mountKyogijoTurn(
  document.querySelector("#court")!,
  { sport: "volleyball", home: { name: "Japan", score: 3 }, away: { name: "USA", score: 2 }, status: "final" },
  { preset: "end" },
);
view.preset("corner");        // glide to a viewpoint
view.set({ yaw: 60 });        // or to any view
view.update({ sport: "nba" }); // draw another surface, keeping the view
```

Or the custom element, with no script of your own:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/dist/element-define.js"></script>
<kyogijo-field sport="nhl" turn turn-view="broadcast"></kyogijo-field>
```

`turn` switches the 3D view on, `turn-view` names the viewpoint it opens on, `turn-controls="false"` leaves the buttons out, `turn-uprights="false"` leaves out what stands on the surface, `turn-score="floor"` leaves the score panel on the floor, and `turn-touch="turn"` keeps every touch for the view. Take it off and the flat drawing comes back. The element's `turn` property is the handle, and `turnSettings` takes the settings the attributes cannot say.

## The viewpoints

| Viewpoint | Key | Looks from |
| --- | --- | --- |
| `overhead` | 1 | Straight down. |
| `broadcast` | 2 | High on one side line, as the main camera, turned a little towards one end so that the boards, nets and goals show their faces. For the net sports, whose net runs across the court, high behind an end line, as a television camera: from the side line a net is a stick. A football field and a hockey rink are turned less, and a curling sheet is seen square on from the side. |
| `end` | 3 | Low, behind an end line, along the surface: where a net, a goal or a basket is best seen. |
| `corner` | 4 | Low, from a corner, with the nearest net or goal in front. The view a mount opens on. |

The end and corner views look from the side opposite the scoreboard of a field (see below), so that it stands behind the far end.

A view is `{ yaw, pitch, zoom }`: the turn about the vertical in degrees, the tip back from straight overhead in degrees (0 to 84, so the eye never goes below the floor), and the zoom (0.5 to 4). The scene is fitted to the box once for the whole turn at the view's pitch, so every viewpoint and every turn shows the whole surface, and turning never changes the zoom (see below). `TURN_PRESETS`, `LONG_PRESETS`, `NET_PRESETS` and `CURLING_PRESETS` are the viewpoints as numbers.

### A steady zoom

The fit looks at the scene at **every angle of the circle** at the view's pitch (every 5 degrees, with a margin of 3 percent of the box round it) and takes the one scale and the one centre that hold all of them. So the scale does not change while the view turns, by hand or by itself, and the surface does not sway: at no angle is any of it outside the box, and the floor is the same size side-on as end-on. The fit used to be made for each angle alone, which kept every angle in the box but zoomed the surface in and out as it turned: the largest scale was about 1.7 to 1.9 times the smallest overhead, 1.5 times at 30 degrees and 1.15 to 1.65 times from 60 to 80, for a long floor.

The steady scale is the smallest the old fit used over the turn, so the floor is never larger than it was at its tightest angle, and it is smaller than it was at the angles where it had room (down to 0.55 of its old size overhead and 0.5 to 0.7 at the low views, at the angle where it used to be largest).

**Tipping the view still rescales it**: the pitch changes how much of the box the scene covers, so the placement is worked out again for each pitch (a floor is drawn about 1.6 times as large at a tip of 84 degrees as overhead). Fitting over every pitch as well was tried and not kept: it fits the scene at the overhead view, where a long floor has to fit the box's height, so at a tip of 60 degrees the floor would be 0.64 of the size it can have. Zoom (`+` and `-`, the buttons, a pinch or Ctrl and the wheel) is laid on top of the fit and does not change it. `fit(box, view, width, height, distance)` takes the view's pitch and not its yaw.

![A hockey rink from a low corner: the boards, the glass and a goal at each end](./images/turn-rink-desk-light.webp)

## Hands

- **Drag** with the mouse turns the view across and tips it up and down; **double click** puts it back.
- **A finger** drags sideways to turn the view and leaves a vertical swipe to the page, so that a page of views can still be scrolled with a thumb. `touch: "turn"` keeps every touch for the view, which then also tips it; **two fingers** pinch to zoom.
- **The wheel** is the page's, so that the page scrolls over a view. Ctrl and the wheel (a pinch on a trackpad) zoom; with the view focused, the wheel tips it and Shift with the wheel turns it. Up always lifts the near edge of the surface toward the viewer, as if it were held there: a drag up, the wheel up, the up arrow and the \"Tip the surface away\" button all do it, and down lowers it.
- **The keys**, with the view focused: the arrows turn and tip the way a drag toward that side does (Left and Right carry the near side that way; Up tips as a drag up does, Down as a drag down; Shift for bigger steps), plus and minus zoom, 1 to 4 pick a viewpoint, 0 or Home puts it back.
- **Space**, with the view focused, starts and stops the [auto-turn](#the-auto-turn).
- **The buttons** under the view are the four viewpoints, turn left and right, the up and down arrows, zoom in and out, reset, and the Auto-turn toggle: each is 44 pixels square or more, and a button takes the view toward its side as the arrow key does. `nudge(view, "left" | "right" | "up" | "down", degrees)` is that step, for a page with controls of its own.

## What stands on each surface

Heights are the rulebooks', read from the current rulebooks and cited by rule number in [Sources](./sources.md#heights-in-the-3d-view); where the rules give a range or a least (a post's height, the glass above a rink's boards) the least is drawn, and where the rules leave a size open (the mesh of a net, the thickness of a strip, a baseball fence's height, a corner flag's) it is ours and is said to be. A strip is never thinner than a thousandth of the surface's diagonal, so that a 3-inch post on a 500-foot ground stays in sight.

| Surface | What stands up |
| --- | --- |
| Volleyball, beach volleyball | The net, 2.43 m (men) or 2.24 m (women, `netHeight: "women"`), a metre wide with its tape and side bands; posts 2.55 m; antennae 1.8 m long, the top 80 cm over the net, in bands of red and white (FIVB 2.1, 2.2, 2.4, 2.5.1). |
| Sitting volleyball | The net, 1.15 m (men) or 1.05 m (women), 80 cm wide; antennae 1.6 m long, the top 80 cm over the net; posts 12 cm over the men's net (World ParaVolley 2.1.1, 2.2, 2.4; the posts' height is ours). |
| Tennis | The net, 3 ft 6 in at the posts and 3 ft at the centre, with its strap; the posts; singles sticks (`net: { sticks: true }`). |
| Badminton | The net, 1.55 m at the posts and 1.524 m at the centre, 76 cm deep; the posts. |
| Pickleball | The net, 36 in at the posts and 34 in at the centre; the posts. |
| Table tennis | The table lifted 76 cm on four legs, the net 15.25 cm over it, the clamps, and the table's shadow on the hall's floor. The top is drawn over the legs on the far side and under the ones on the near side, whichever way the view is turned. |
| Padel | The net, 0.92 m at the ends and 0.88 m at the centre, on posts 1.05 m high; the enclosure: end walls of 3 m of glass with 1 m of metal fence over them (4 m), side walls 3 m high at each end with fence between (FIP, The Court; `boards: false` leaves the walls out). |
| Squash | The walls up to their out lines: the front wall 4.57 m, the back wall 2.13 m, the side walls sloping from the one to the other (World Squash 5.02, 5.03; `boards: false` leaves them out). |
| Racquetball | The walls, 20 ft high all round, the front wall solid (IRF 2.1(a); `boards: false` leaves them out). |
| Sepak takraw | The net, 1.52 m (men) or 1.42 m (women, `netHeight: "women"`) at the centre and 1.55 m or 1.45 m at the posts, 0.7 m wide (ISTAF Laws 2 and 3). |
| Teqball | The table, its top 76 cm up (900 mm with the net) on four legs, and the net 14 cm over it (FITEQ 1.1, 1.2). |
| Roundnet | The set: a net in a ring 91.4 cm across, its rim 20.3 cm up, on four legs (International Roundnet Federation 1.1.2). |
| Netball | A goalpost at the middle of each goal line, 3.05 m high, with its ring on a bar 150 mm long (World Netball, Rule 1, items 13 and 14). |
| Swimming | A starting block 0.7 m high in each lane at each end, numbered; a flagged rope 1.8 m above the water 5 m from each wall; the false start rope 1.2 m above it at 15 m (World Aquatics CR (February 2026) Part Two 15.8.1, 15.9.1; the false start rope is the June 2025 edition's CR 16.1.12 and unverified in February 2026). A warm-up pool and a natatorium have none. |
| Diving | The springboards at 1 m and 3 m on their stands, and the platforms (5, 7.5 and 10 m, or what `pool.platforms` asks for) on their towers, at the heights of Appendix 2 (CR Part Four, 15.3.2 and 15.4.3; June 2025: 13.1.1 and 13.1.2). |
| Water polo | A floating goal on each goal line: 3 m between the posts, the underside of the bar 0.9 m over the water, a net behind (CR Part Six, 21.6.3.2 and 21.6.4.2). |
| Artistic swimming | The judges' platform 0.6 m high along the top side and the starting platform 0.7 m high (CR Part Seven, 12.2.5 and 12.2.4). |
| Athletics | The high jump's uprights 4.02 m apart with a bar at 2.00 m (ours) and the pole vault's 5.20 m apart with a bar at 5.00 m (ours); the discus and hammer cage, its netting 4 m high and 6 m at the front (Facilities Manual 2.4.1.3); the hurdles of the races marked (110 m 1.067 m, 100 m 0.838 m, 400 m 0.914 m) and the steeplechase's barriers with the water jump's pit (0.914 m). The javelin has nothing standing. |
| Skating | The padding round a long or a short track, 0.80 m high (ISU Rule 228.2), and a figure skating rink's boards, 3.5 ft with no glass. The padding and the boards give way to the eye. The blocks are not drawn. |
| Basketball | Each basket: the backboard (6 ft by 3 1/2 ft, FIBA 1.80 by 1.05 m, its lower edge 150 mm under the ring's top), the ring at 10 ft (FIBA 3.05 m) with its 18 in net, and the padded stanchion, its padding 2 m behind the end line. |
| Hockey | The boards (42 in) with glass over them, 8 ft at the ends and 6 ft along the sides (NHL 1.3), and a goal 6 ft wide and 4 ft high on each goal line (NHL 2.1; `boards: false` leaves the boards out). |
| Soccer | A goal 7.32 by 2.44 m (the pitch's own size) on each goal line, and a corner flag 1.5 m high at each corner (`cornerFlags: false`). |
| Handball, field hockey, lacrosse | The goal: 3 by 2 m; 3.66 by 2.14 m; 6 by 6 ft (4 by 4 ft in a box). |
| NFL, CFL, IFAF | The goal posts: a crossbar at 10 ft and uprights 18 ft 6 in apart, 45 ft high in the NFL (35 ft over the bar), 40 ft in the CFL and at least 30 ft in the NCAA and the rest, on a slingshot support or an H; the eight pylons. |
| Rugby | Union: a crossbar at 3 m, uprights 5.6 m apart, drawn 3.4 m over the bar; league: posts 16 m high; the flag posts, 1.2 m. |
| Gaelic games | The posts: a crossbar at 2.5 m, uprights 6.5 m apart and 7 m high; the corner flags (1.5 m, ours). |
| Australian football | Two goal posts 6 m high and two behind posts 3 m high at each end. |
| Cricket | Three stumps 28 in high at each end of the pitch. |
| Baseball | The fence as high as its walls (the Green Monster's 37 ft at Fenway Park; 8 ft where no wall is listed), a foul pole at each line, and the backstop. |
| Curling | Nothing but the scoreboard: a sheet is flat. |
| Any score drawing | The scoreboard: see below. |

**Walls give way.** The walls of a padel, squash or racquetball court and the boards and glass of a rink are cut away when they stand between the eye and the court: a wall whose outside faces the eye fades as the eye comes down (`fadeOf`, `Layout.fade`), to about a tenth of what it was when the eye is low, and is whole again seen from straight above or from the far side. A page that lays the planes out itself reads `Plane.shy`, the direction a wall faces away from the surface, and `fadeOf(plane, yaw, pitch)`.

`uprightsFor(options, { only: ["net"] })` says what stands on a surface as planes in the drawing's frame (x along the surface, y across it, z the height, in feet), and `describeUprights(options, uprights, "ja")` says it in a sentence: the view's description ends with it, so a reader who cannot see the view hears what stands in it.

## The venue

A surface with spectators or walls does not stand in a void. The 3D view raises what the package already knows about the room round it, from `crowdStands()` and `dojoRoom()`, as more planes of the same kind: nothing new is drawn, and no seat is an element.

| What | Made of |
| --- | --- |
| Stands | Each tier of `crowdStands().rings` is a strip of raked planes between its inner and its outer outline: one to each straight side and three to each corner of a rounded rectangle (a ring round an oval is cut into 28, a ballpark's grandstand into its own points). A plane runs from the height of the tier's first row to that of its last, which is the rake the data gives, and wears the crowd's own pattern: the people, the empty seats, the lines of the rows, the aisles and the visitors' block and the tifo, all one texture to a plane. The places the stands are left open (the ends of two sides, the open end of a horseshoe) are left open. |
| Walks and low walls | A plane from the top of one tier up to the first row of the next, and a low wall from the floor to the first row of the lowest. |
| A ballpark | The grandstands and the bleachers behind the fence, with the gap at the batter's eye, and, where the park has them (Fenway Park's Green Monster), the seats on top of the wall, starting at the wall's own height (37 feet 2 inches). The outfield walls are the fence's own planes, at the heights the park's data gives. |
| Roofs | `roof: true` puts a canopy over the back of the top tier in the open air (62 per cent of its depth, 26 feet over its last row, dropping 6 feet towards the pitch) and a lid over a hall's (rising 26 feet over its inner edge). The heights are ours: no rule gives them. The drawing's own `crowd: { roof: false }` says no. |
| A dojo | The walls, 3 m high (ours), or 4.5 m, a storey, where the dojo has a gallery: honey wood panelling the whole height under a gallery, a cream wall over a belt-high wainscot where there is none, in the floor's own look, with the doors and windows of `dojoRoom()` in them. On the kamiza's wall, a recessed alcove of darker wood with a white-framed shrine and a scroll, a plain purple banner beside it, the dais of the seat of honour (0.3 m) as a block, the dark banner (1 m to 3 m up the wall) and the shrine of `shinzen`. The balconies on the upper level: each a floor slab (0.35 m thick, ours) that projects over the room a wall's thickness and half a metre beyond the first row, a white rail on its edge, and behind it three rows as steps, a dark tread with the blocks of seats on it (each seat a cushion and its back) and the aisles between the blocks in lighter wood, with their stairs in the risers, from the gallery's floor, level with the top of the walls at 4.5 m, up to 5.7 m (ours). Above the seats a plain off-white wall with, on the kamiza's side, a round clock at the middle and a door at each end, and three large windows on the east side; `roof: true` adds a pale grey ceiling band over the galleries with a box light every 6 m (open over the floor). The seats are empty: a crowd is only drawn when `density` or `attendance` asks for one. And the edge of the mats: a competition area's mat is 5 cm thick (the IJF's tatami), a dojo's ours, drawn at least 0.12 feet thick so that it stays in sight. The floor is the drawing's own, so its look (the era of a hall, `budo.look`) is the room's: a floor painted in a look gives the world the drawing's class, sport and look, and the wood and walls follow it. The Kodokan's main dojo has the gallery as its owner counts it: 3 rows, in blocks of 5, 8, 8, 8 and 5 seats (`balcony: { rows: 3, sections: [5, 8, 8, 8, 5] }`). |
| A dohyō | A solid block of clay at the plan's height (34 to 60 cm): four sides, darker than the top, and a flat top that is the drawing's own clay with the ring of straw bales on it. The floor round it lies on the hall's floor and is fitted whole, so none of it is cut off at any angle; the stands round it stand on the hall's floor. |

**The stands give way.** Every plane of the venue knows the way it faces out of the room (`Plane.shy`), so the stands and the gallery on the side nearest the eye fade as the walls of a padel court and the boards of a rink do (`fadeOf`): the nearer the eye is to a side, and the lower, the less is left of it (down to 0.08, and to 0.01 for a dojo's room, whose steps and walls lie over one another on the screen and would add up to a veil: `Plane.fadeTo`), and the surface is never hidden. Seen from straight overhead, or from the far side, they are whole.

**It is light.** A venue is planes and textures: the patterns are written once, in one `defs`, and each plane reads them by id. A full soccer bowl with a roof is about 110 planes and 500 elements in all, the biggest ones (an athletics stadium, Fenway Park) under 1,000, and the count does not change with the seats taken or the capacity. `detail` sets how finely the curves are cut: `low` gives each corner one facet, `auto` three, `high` six.

```ts
import { turnMarkup, uprightsFor } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const options = { sport: "soccer", crowd: true } as const;
const kinds = uprightsFor(options, { venue: { id: "bowl" } }).items.map((item) => item.kind);
console.log(kinds.filter((kind) => kind === "stands" || kind === "roof").join(" "));
// stands
const html = turnMarkup(options, { venue: { roof: true } });
console.log(html.includes("ky-up-roof"), html.includes("ky-crowd"));
// true false
```

The venue is on when the drawing has a `crowd` or is a dojo, and `venue: false` leaves it out (the floor then draws the flat crowd as before). With it on the floor draws no crowd, only the ground the stands stand on. `uprights: false` leaves the venue out too, unless `venue: true` asks for it. A badge has none.

## The auto-turn

A trophy case's slow turn of the whole view. Nothing moves until the reader presses the **Auto-turn** button (a toggle, `aria-pressed` while it turns, named for what it is in either language, with a tooltip that says what pressing it does) or **Space**, with the view focused. The page can ask for more:

```ts no-run
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const view = mountKyogijoTurn(document.querySelector("#hall")!, { sport: "dojo", dojo: { jo: 20, dais: true, balcony: true } }, { autoPlay: true, speed: 10 });
view.pause();
view.togglePlay();      // true: it turns again
view.setDirection("clockwise"); // the other way, without stopping it
console.log(view.playing, view.direction());
```

- `autoPlay: true` starts it when the view is mounted, and not for a reader who prefers reduced motion (it starts paused, and the button is there for the reader to press); `autoPlay: "force"` starts it anyway.
- `speed` is degrees of yaw a second, 12 by default; a positive number turns it as a drag to the right does (the near side goes to the right), a negative one the other way.
- `direction` says which way, seen from above: `"counterclockwise"` (the default, how it has always turned: the near side swings to the viewer's right) or `"clockwise"` (to the left); `turnDirection(value)` reads a direction from anything (`"clockwise"` is clockwise and everything else the default). The **Reverse** button of the view (a toggle, `aria-pressed` while it goes clockwise) and `setDirection(direction)` change it at once and without stopping the turn, `direction()` says which it is, and `onDirectionChange(direction)` tells the page. A drag, the keys and the buttons are not reversed, and a negative `speed` reverses it too. The element reads `turn-direction="clockwise"`.
- The demo's pages (the main one, the venues, the stadiums, the districts, the tournament layouts, the judging page, the boards and the fly-through) wait still when they open, turn while the pointer is over the view (a tap on a phone starts it and a second tap holds it) at half the speed the package turns by when it is not told (6 degrees a second), and keep the way in the address as `dir=cw`; Auto-turn and Play still start it for good, and a reader who prefers reduced motion is never turned for by the pointer. The page does this itself (`demo/turn-way.js`): the package only has `play()`, `pause()` and `setDirection()`.
- It holds while the pointer holds the view and goes on when it lets go. It does nothing while the page is hidden or the view is scrolled out of sight, and starts again when it is back. The arrow keys, a viewpoint, the reset or a call to `set` or `preset` take the view over and stop it; zooming does not.
- About thirty frames a second are drawn, each a write of the planes' `matrix3d` and nothing else; nothing is polled and nothing runs while it is stopped. `onPlayChange(playing)` says when it starts and stops, and `onChange` is called once when it stops, with the view it ended on, and not at every frame.
- The handle has `playing`, `play()`, `pause()` and `togglePlay()`, each of which gives whether it is turning now, and `direction()` and `setDirection()`.

## The score

In a drawing with a score the 3D view does not lay the score's panel on the floor: it hangs it up. The badge of the score (the strip `size: "badge"` draws) is put on a dark board that turns to face the eye, so that it reads from wherever the view is. A court or a rink (basketball, hockey, volleyball, badminton, handball, tennis, pickleball) has it hung on cables over the middle; a field, a pitch, a table and a curling sheet have it standing on legs behind an end, and a ballpark behind centre field. The floor keeps the teams' names and everything else, and loses the panel: the drawing option `plate: false`, which any drawing takes, is how. `score: "floor"` in the settings leaves the panel on the floor and the board off; so does `uprights: false`, since the board is one of the things that stand up. The sizes and heights of the board are ours: no rulebook gives a scoreboard.

## Settings

| Setting | What it does |
| --- | --- |
| `preset` | The viewpoint it opens on: `overhead`, `broadcast`, `end` or `corner` (the default). |
| `view` | An exact opening view, `{ yaw, pitch, zoom }`, laid over the preset. |
| `controls` | `false` leaves the buttons out; the keys and the pointer work either way. |
| `uprights` | `false` for the floor alone, or `{ netHeight, boards, only, score }`. |
| `venue` | `true`, `false` or `{ roof, walls, boards, lighting, detail }`: the stands and the room, raised. On when the drawing has a `crowd` or is a dojo. `roof: true` adds a roof or canopy; `walls` is the walls of a real venue's building, which follow `roof` when left out (`walls: true` alone raises the walls, `roof: true, walls: false` the roof alone); `boards` is the LED boards ([the real venues](./venues.md#led-boards)) and `lighting` the night lighting ([night lighting](./venues.md#night-lighting)); `detail` is `low`, `auto` or `high`. |
| `autoPlay` | `true` starts the auto-turn at once, unless the reader prefers reduced motion; `"force"` starts it anyway. Left out, nothing moves until Play. |
| `speed` | The auto-turn's degrees of yaw a second: 12 by default. |
| `direction` | `counterclockwise` (the default) or `clockwise`; see the auto-turn above. |
| `onDirectionChange` | Called with the direction when the Reverse button or `setDirection` changes it. |
| `onPlayChange` | Called with `true` when the auto-turn starts and `false` when it stops. |
| `score` | `board` (the default) hangs the score up as a scoreboard; `floor` leaves the panel on the floor. |
| `touch` | `scroll` (the default) or `turn`. |
| `motion` | `auto` (the default) glides between viewpoints unless the reader prefers reduced motion; `smooth` or `none` say it for them. |
| `floor` | A function that draws the floor in place of `drawKyogijo`: pass a chart's `draw` to turn a shot chart. |
| `lens` | How long a lens the eye has, as a multiple of the view's longer side: 8 by default; the larger, the flatter. A short lens makes the nearer end of a turning floor swell (at 1.7 the floor's area varied by up to a quarter over a turn; at 8 it varies by about one percent). |
| `size` | For `turnMarkup`, the box the first view is worked out for: 960 by 600. |
| `id` | The prefix of the ids in the view, for a page with more than one. |
| `onChange` | Called with the view and the viewpoint it is (`undefined` when it was turned by hand). |

The handle `mountKyogijoTurn` gives back has `view()`, `set(view, glide?)`, `preset(name)`, `reset()`, `update(options, change?)`, `svg()` (the flat drawing that is the floor), `destroy()`, `mode`, and for the auto-turn `playing`, `play()`, `pause()` and `togglePlay()`.

`update(options)` draws the scene again with new options and keeps the view and the auto-turn: a turning view goes on turning from where it is. `update(options, { venue: { roof, walls, boards, lighting } })` also changes what the venue's walls and roof stand on, so that a page can switch them on and off without mounting the view again (the demo's venues page does, with a button for each).

The 3D view always shows the whole surface, lying wide: a `range`, a `half` and a tall `orientation` are left to the flat drawing, and a badge is not a surface and stays a badge.

## On a server

`turnMarkup(options, settings)` is the same view as a string of HTML, laid out for `settings.size`; it is pure, so it can be made on a server and given to the page, which a script then makes turn.

```ts
import { turnMarkup } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const html = turnMarkup({ sport: "nba" }, { preset: "broadcast" });
console.log(html.includes('data-part="hoop-left-backboard"'), html.includes("preserve-3d"));
// true false
```

A page with no script keeps the flat drawing: render `drawKyogijo(options)` into the container and let `mountKyogijoTurn` replace it, and a reader whose script does not run, or whose browser cannot draw the planes (`turnSupported()` says), still has the drawing, with a sentence that says why it does not turn.

## Reading it

- The view is a `group` named by the drawing's title, with the role description "3D view" (in Japanese, the same words), focusable, with `aria-keyshortcuts` and a description that gives the keys and what stands on the surface, with its heights in the rulebook's own unit.
- The flat drawing keeps its own `role="img"`, title and description. The parts that stand up are decoration and hidden from a screen reader.
- A viewpoint, a reset and the end of a drag or a run of keys are said in a polite live region ("End-on view", "Turned to 40 degrees, seen from 34 degrees above the floor"); a drag is not said as it goes.
- With `prefers-reduced-motion` the view jumps between viewpoints instead of gliding, and nothing ever moves by itself: the auto-turn runs only after the reader presses Play or Space, or when the page's `autoPlay` asks (not for a reader who prefers reduced motion, whose view starts paused; and the demo's pointer never turns it for them). Nothing is polled: the elements' transforms are written when the view changes, and a glide is half a second of animation frames.
- Focus is shown with a 3 px outline, and the controls are 44 pixels or more.

## Looks

The colours of what stands up are custom properties on `.ky-turn`, light and dark, in `KYOGIJO_TURN_STYLE`: `--ky-up-pole`, `--ky-up-white`, `--ky-up-yellow`, `--ky-up-red`, `--ky-up-orange`, `--ky-up-mesh`, `--ky-up-netfill`, `--ky-up-tape`, `--ky-up-glass`, `--ky-up-backboard`, `--ky-up-board`, `--ky-up-wall`, `--ky-up-table`, `--ky-up-pad`, `--ky-up-rim` and a few more; `--ky-turn-ratio` is the box's shape (16/10, and 5/4 on a phone). The defaults are in `:where()`, so a page's own rule wins. Pass `style: "none"` in the options to leave the stylesheet out and put `KYOGIJO_TURN_STYLE` in the page once.

![A basketball court from the main camera: a basket at each end](./images/turn-court-desk-light.webp)

[Open the demo in 3D](https://johnmorrisdotca.github.io/kyogijo-stadiums/?sport=volleyball&view=3d&viewpoint=end): the View switch in the playground turns any surface.
