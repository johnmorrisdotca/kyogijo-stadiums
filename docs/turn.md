# The 3D view

A surface drawn flat hides what stands on it: a net, a basket, a goal, the posts of a football field. `@johnmorrisdotca/kyogijo-stadiums/turn` shows any surface as a floor that turns. The floor is the flat drawing itself, with its score, its data layers and its labels; it is tipped and turned by the mouse, a finger, the wheel or the keys, and what the rulebook puts on the surface stands up on it, at the rulebook's height.

![A volleyball court from behind an end line: the net at 2.43 m on its posts, with the antennae, and the viewpoint buttons under it](./images/turn-volleyball-desk-light.webp)

It is plain DOM and CSS, with no dependency and no canvas. Each part that stands up (a net, a pane of glass, a backboard, the two strips that make a post) is a flat rectangle with a little SVG on it, and each carries its whole place on the screen in one `matrix3d`; the parts are stacked far to near by `z-index`. Nothing is nested in 3D (no `preserve-3d`, no `perspective` on a parent), so a browser that cannot keep nested 3D layers, as Safari on a phone sometimes cannot, draws it as it is meant. The drawing it is made from is the one `drawKyogijo` draws, so the 3D view is an enhancement over the static SVG, which stays what a server renders.

## Put one in a page

```ts no-run
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";

const view = mountKyogijoTurn(
  document.querySelector("#court")!,
  { sport: "volleyball", home: { name: "Harbour City Gulls", score: 3 }, away: { name: "Prairie Ridge Bison", score: 2 }, status: "final" },
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

`turn` switches the 3D view on, `turn-view` names the viewpoint it opens on, `turn-controls="false"` leaves the buttons out, `turn-uprights="false"` leaves out what stands on the surface, and `turn-touch="turn"` keeps every touch for the view. Take it off and the flat drawing comes back. The element's `turn` property is the handle, and `turnSettings` takes the settings the attributes cannot say.

## The viewpoints

| Viewpoint | Key | Looks from |
| --- | --- | --- |
| `overhead` | 1 | Straight down. |
| `broadcast` | 2 | High on one side line, as the main camera. For the net sports, whose net runs across the court, high behind an end line, as a television camera: from the side line a net is a stick. |
| `end` | 3 | Low, behind an end line, along the surface: where a net, a goal or a basket is best seen. |
| `corner` | 4 | Low, from a corner, with the nearest net or goal in front. The view a mount opens on. |

A view is `{ yaw, pitch, zoom }`: the turn about the vertical in degrees, the tip back from straight overhead in degrees (0 to 84, so the eye never goes below the floor), and the zoom (0.5 to 4). The scene is fitted to the box at every view, so every viewpoint and every turn shows the whole surface. `TURN_PRESETS` and `NET_PRESETS` are the viewpoints as numbers.

![A hockey rink from a low corner: the boards, the glass and a goal at each end](./images/turn-rink-desk-light.webp)

## Hands

- **Drag** with the mouse turns the view across and tips it up and down; **double click** puts it back.
- **A finger** drags sideways to turn the view and leaves a vertical swipe to the page, so that a page of views can still be scrolled with a thumb. `touch: "turn"` keeps every touch for the view, which then also tips it; **two fingers** pinch to zoom.
- **The wheel** is the page's, so that the page scrolls over a view. Ctrl and the wheel (a pinch on a trackpad) zoom; with the view focused, the wheel tips it and Shift with the wheel turns it.
- **The keys**, with the view focused: the arrows turn and tip (Shift for bigger steps), plus and minus zoom, 1 to 4 pick a viewpoint, 0 or Home puts it back.
- **The buttons** under the view are the four viewpoints, turn left and right, raise and lower, zoom in and out, and reset: each is 44 pixels square or more.

## What stands on each surface

Heights are the rulebooks' and are cited in [Sources](./sources.md); where the rules give a least (a post's height, the glass above a rink's boards) the least is drawn, and where the rules leave the size to the maker (the mesh of a net, the thickness of a strip) it is ours. A strip is never thinner than a thousandth of the surface's diagonal, so that a 3-inch post on a 500-foot ground stays in sight.

| Surface | What stands up |
| --- | --- |
| Volleyball, beach volleyball | The net, 2.43 m (men) or 2.24 m (women, `netHeight: "women"`), a metre wide with its tape and side bands; posts 2.55 m; antennae 1.8 m long, 80 cm over the net, in bands of red and white. |
| Tennis | The net, 3 ft 6 in at the posts and 3 ft at the centre, with its strap; the posts; singles sticks (`net: { sticks: true }`). |
| Badminton | The net, 1.55 m at the posts and 1.524 m at the centre, 76 cm deep; the posts. |
| Pickleball | The net, 36 in at the posts and 34 in at the centre; the posts. |
| Table tennis | The table lifted 76 cm on four legs, the net 15.25 cm over it, the clamps. |
| Basketball | Each basket: the backboard (9 ft to 12 ft 6 in), the rim at 10 ft with its net, and the padded stanchion behind the baseline. |
| Hockey | The boards (42 in) with 5 ft of glass above them, and a goal 6 ft wide and 4 ft high on each goal line (`boards: false` leaves the boards out). |
| Soccer | A goal 7.32 by 2.44 m (the pitch's own size) on each goal line, and a corner flag 1.5 m high at each corner (`cornerFlags: false`). |
| Handball, field hockey, lacrosse | The goal: 3 by 2 m; 3.66 by 2.14 m; 6 by 6 ft (4 by 4 ft in a box). |
| NFL, CFL, IFAF | The goal posts: a crossbar at 10 ft and uprights 18 ft 6 in apart, reaching 35 ft over the bar in the NFL and 20 ft elsewhere, on a slingshot support or an H; the eight pylons. |
| Rugby | The posts: a crossbar at 3 m, uprights 5.6 m apart reaching 3.4 m over it; the flags. |
| Gaelic games | The posts: a crossbar at 2.5 m, uprights 6.5 m apart and 7 m high; the corner flags. |
| Australian football | Two goal posts 6 m high and two behind posts 3 m high at each end. |
| Cricket | Three stumps 28 in high at each end of the pitch. |
| Baseball | The fence as high as its walls (the Green Monster's 37 ft at Fenway Park; 8 ft where no wall is listed), a foul pole at each line, and the backstop. |
| Curling | Nothing: a sheet is flat. |

`uprightsFor(options, { only: ["net"] })` says what stands on a surface as planes in the drawing's frame (x along the surface, y across it, z the height, in feet), and `describeUprights(options, uprights, "ja")` says it in a sentence: the view's description ends with it, so a reader who cannot see the view hears what stands in it.

## Settings

| Setting | What it does |
| --- | --- |
| `preset` | The viewpoint it opens on: `overhead`, `broadcast`, `end` or `corner` (the default). |
| `view` | An exact opening view, `{ yaw, pitch, zoom }`, laid over the preset. |
| `controls` | `false` leaves the buttons out; the keys and the pointer work either way. |
| `uprights` | `false` for the floor alone, or `{ netHeight, boards, only }`. |
| `touch` | `scroll` (the default) or `turn`. |
| `motion` | `auto` (the default) glides between viewpoints unless the reader prefers reduced motion; `smooth` or `none` say it for them. |
| `floor` | A function that draws the floor in place of `drawKyogijo`: pass a chart's `draw` to turn a shot chart. |
| `lens` | How long a lens the eye has, as a multiple of the view's longer side: 2.4 by default; the larger, the flatter. |
| `size` | For `turnMarkup`, the box the first view is worked out for: 960 by 600. |
| `id` | The prefix of the ids in the view, for a page with more than one. |
| `onChange` | Called with the view and the viewpoint it is (`undefined` when it was turned by hand). |

The handle `mountKyogijoTurn` gives back has `view()`, `set(view, glide?)`, `preset(name)`, `reset()`, `update(options)`, `svg()` (the flat drawing that is the floor), `destroy()` and `mode`.

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

- The view is a `group` named by the drawing's title, with the role description "3D view" (3D表示), focusable, with `aria-keyshortcuts` and a description that gives the keys and what stands on the surface, with its heights in the rulebook's own unit.
- The flat drawing keeps its own `role="img"`, title and description. The parts that stand up are decoration and hidden from a screen reader.
- A viewpoint, a reset and the end of a drag or a run of keys are said in a polite live region ("End-on view", "Turned to 40 degrees, raised 34 degrees"); a drag is not said as it goes.
- With `prefers-reduced-motion` the view jumps between viewpoints instead of gliding, and nothing ever moves by itself. Nothing is polled: the elements' transforms are written when the view changes, and a glide is half a second of animation frames.
- Focus is shown with a 3 px outline, and the controls are 44 pixels or more.

## Looks

The colours of what stands up are custom properties on `.ky-turn`, light and dark, in `KYOGIJO_TURN_STYLE`: `--ky-up-pole`, `--ky-up-white`, `--ky-up-yellow`, `--ky-up-red`, `--ky-up-orange`, `--ky-up-mesh`, `--ky-up-netfill`, `--ky-up-tape`, `--ky-up-glass`, `--ky-up-backboard`, `--ky-up-board`, `--ky-up-wall`, `--ky-up-table`, `--ky-up-pad`, `--ky-up-rim` and a few more; `--ky-turn-ratio` is the box's shape (16/10, and 5/4 on a phone). The defaults are in `:where()`, so a page's own rule wins. Pass `style: "none"` in the options to leave the stylesheet out and put `KYOGIJO_TURN_STYLE` in the page once.

![A basketball court from the main camera: a basket at each end](./images/turn-court-desk-light.webp)

[Open the demo in 3D](https://johnmorrisdotca.github.io/kyogijo-stadiums/?sport=volleyball&view=3d&viewpoint=end): the View switch in the playground turns any surface.
