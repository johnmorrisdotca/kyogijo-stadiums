# Replay

A replay plays tracking data on a surface: where each player, the ball and the officials were, second by second, with the passes, the shots and the goals marked as they happen. The data is yours and nothing is fetched. `@johnmorrisdotca/kyogijo-stadiums/replay` has the frame as a string (`drawFrame`) and the pure functions behind it; `mountKyogijo(...).replay(...)` and `<kyogijo-field>` play it in a page.

It is built on the [data layers](./layers.md) and the [coordinate frames](./frames.md): the positions are in a provider's frame (`from: "nhl-api"`, `from: "opta"`) or the surface's own feet, and every mark is an element of the drawing in the surface's own frame, cut to nothing and turned back upright when the surface lies tall.

## One frame

```ts
import { drawFrame } from "@johnmorrisdotca/kyogijo-stadiums/replay";

const frames = [0, 1, 2].map((t) => ({
  t,
  objects: [
    { id: "h9", team: "home" as const, number: 9, x: 10 + t * 12, y: 5 },
    { id: "a4", team: "away" as const, number: 4, x: 40 - t * 5, y: -8 },
    { id: "puck", team: "puck" as const, x: 10 + t * 12, y: 5 },
  ],
}));
const timeline = { from: "nhl-api", frames, events: [{ t: 2, kind: "goal", team: "home" as const }] };
const svg = drawFrame({ sport: "nhl" }, timeline, 1.5);
console.log(svg === drawFrame({ sport: "nhl" }, timeline, 1.5), svg.includes("Shirt numbers"));
console.log(svg.includes("Replay, 0:02. 3 tracked objects. By team: home 1, away 1, puck 1. 1 event."));
// true true
// true
```

`drawFrame(options, timeline, t, look?)` is `drawKyogijo` with the replay's layers added to the ones in `options`. The same options, timeline and time always give the same string; the ids inside the drawing come from the options and the timeline, not from the time, so every frame of a replay has the same ids (give an `id` of your own when two replays share a page). The drawing's description says what the replay is (its length, what it tracks, how many events) and does not change with the time. [The gallery](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery-data.html#replay) draws a frame on the rink and on the pitch from the code beside it.

## The timeline

```ts no-run
const timeline = {
  from: "nhl-api",                 // the frame the positions are in (a name in FRAMES, or a Frame); without it, the surface's own feet
  frames: [
    { t: 0, possession: "h9", objects: [{ id: "h9", team: "home", number: 9, label: "Rivera", x: 12, y: 4 }, { id: "puck", team: "puck", x: 12, y: 4 }] },
    { t: 0.04, objects: [/* ... */] },
  ],
  events: [{ t: 5.2, kind: "pass", team: "home", by: "h9", to: "h17", until: 5.8 }],
};
```

| Field | What it is |
| --- | --- |
| `frames[].t` | Seconds. The frames run forward in time (they are sorted when they do not). A gap of 0.04 s is 25 frames a second; the gaps need not be equal. |
| `frames[].objects[]` | `id` (the same in every frame the object is in), `team` (`home`, `away`, `ball`, `puck` or `official`), `x` and `y` in the timeline's frame, and optionally `label` (the tooltip) and `number` (written on a player). |
| `frames[].possession` | Who has the ball or puck, when the data says: an object's `id`, or `home` or `away`; `null` for nobody. It holds until a later frame says otherwise. |
| `events[]` | `t`, `kind` (`pass`, `shot`, `goal`, `whistle`, or a word of your own), `team`, where it was (`x`, `y`, or the object `by`, else the ball's place), where it ended (`x2`, `y2`, or the object `to` at `until`), `until` and `label`. |
| `from`, `units`, `attacking`, `surfaceSize`, `anchors` | As for a [layer](./layers.md#what-a-layer-takes): the frame, the unit and the rest that put the numbers on the surface. |

An object in two neighbouring frames moves between them; one only in the earlier frame stays where it was until the next; one only in the later frame appears when its frame comes. Objects without a place are left out. A timeline is read once and kept: make a new one rather than changing one that has been used.

What is drawn: the home team as circles and the away team as squares (so that the teams are never told by colour alone), with their numbers; the ball or the puck, smaller and on top, with a trail of the last two seconds; officials as triangles; a pass or a shot as an arrow from where it began to where it ended, dashed for a shot; a goal as a star; a whistle as a cross. An event stays on the surface for three seconds after it. `look` (the fourth argument, and in the settings below) changes `trail` (seconds, 0 for none), `trailOf` (whose trail), `hold` (seconds an event stays), `numbers`, `scale` and `smooth`.

## The functions

Each is pure and takes the timeline and a time in seconds.

```ts
import { activeEvents, interpolate, possession, trails } from "@johnmorrisdotca/kyogijo-stadiums/replay";

const frames = [0, 1, 2, 3].map((t) => ({
  t,
  possession: t < 2 ? "h7" : null,
  objects: [
    { id: "h7", team: "home" as const, x: t * 4, y: 0 },
    { id: "ball", team: "ball" as const, x: t * 4 + 1, y: 0 },
  ],
}));
const timeline = { frames, events: [{ t: 2, kind: "shot", team: "home" as const, by: "h7" }] };
console.log(interpolate(timeline, 1.5).map((o) => `${o.id} ${o.x}`).join());
console.log(trails(timeline, 3, 2, { teams: ["ball"] })[0].points.map((p) => p[0]).join());
console.log(possession(timeline, 1), possession(timeline, 2.5));
console.log(activeEvents(timeline, 2.5).map((a) => `${a.event.kind} at ${a.x}`).join());
// h7 6,ball 7
// 5,9,13
// { holder: 'h7', team: 'home' } undefined
// shot at 8
```

| Function | What it gives |
| --- | --- |
| `interpolate(timeline, t, { smooth? })` | The objects at `t`, in a straight line between frames, or along a Catmull-Rom curve through them (`smooth: true`, or a share from 0 to 1). `t` is held to the first and last moments. |
| `trails(timeline, t, seconds, { teams?, ids?, smooth? })` | The path of each object over the last `seconds`, oldest place first. |
| `possession(timeline, t)` | `{ holder?, team? }` from the latest frame that says, or `undefined` when none does or the latest says nobody. |
| `activeEvents(timeline, t, hold?)` | The events on the surface at `t`, with their places worked out. |
| `eventsBetween(timeline, from, to)` | The events with a time in `(from, to]`: what went by while the clock moved. |
| `describeEvent(event, language?)` | What is said of an event: its `label`, else its kind and team, then the time: "Goal, home, 1:12". |
| `drawFrame`, `replayLayers`, `replaySnapshot` | The frame as a string; its data layers, to put in the `layers` of a drawing of your own; what is on the surface at a time. |
| `replaySummary`, `replayTable` | The sentence a replay adds to the description, and an HTML table of its events for a reader who cannot see the drawing. |
| `replayInfo`, `replayTimes`, `replayEvents`, `replayClock` | The length, the frame times, the events and `0:12` for 12 seconds. |

## Playing it in a page

```ts no-run
import { mountKyogijo } from "@johnmorrisdotca/kyogijo-stadiums/mount";
import type { ReplayTimeline } from "@johnmorrisdotca/kyogijo-stadiums/replay";

declare const timeline: ReplayTimeline;
const mount = mountKyogijo(document.querySelector("#rink")!, { sport: "nhl", language: "en" });
const replay = mount.replay(timeline, { speed: 1, loop: false });
replay.play();
replay.seek(12.4);
replay.step(1);      // the next frame
replay.destroy();    // takes the replay and its controls away; the surface stays
```

`mount.replay(timeline, settings?)` puts the stage and the controls in the container and returns the controller. The controls are a button to play and pause, one to step back and one forward, the speed (0.25, 0.5, 1, 2, 4), a loop switch, a position slider and the time. `update()` keeps the replay, so a theme or a score can change under it. In React, call `mount.replay` from an effect on the container: the component of `/react` draws a still.

```html
<kyogijo-field id="rink" sport="nhl" loop speed="2"></kyogijo-field>
<script type="module">
  import "@johnmorrisdotca/kyogijo-stadiums/element/define";
  document.getElementById("rink").timeline = timeline;   // a timeline is too large for an attribute
</script>
```

The element takes the data as the property `timeline` (and `replaySettings` for the rest), the switches as attributes (`loop`, `autoplay`, `controls="false"`) and the numbers `speed` and `trail`; `element.replay` is the controller.

| Setting | What it does |
| --- | --- |
| `speed`, `loop` | 0.25 to 4, and start again at the end. |
| `autoplay` | Play when attached. Ignored for a reader who prefers reduced motion, and while the page is hidden. Nothing plays by itself otherwise. |
| `controls` | `false` leaves out the bar; the keyboard and the live region stay. |
| `announce` | `false` stops the live region. |
| `motion` | `auto` (the default) follows `prefers-reduced-motion`; `smooth` and `step` force one. |
| `stepSeconds`, `start` | The seconds a step moves in step mode (1), and the time to begin at. |
| `trail`, `trailOf`, `hold`, `numbers`, `scale`, `smooth` | How a frame is drawn, as above. |

How it moves: the drawing is written once. Each animation frame moves only the marks that move (a `transform` on each player, the number and the ball, and the `d` of each trail); a mark that comes or goes (an event that begins, a trail that starts) redraws the replay's own layer and nothing else, and the surface is never redrawn. Nothing runs while the replay is paused or the page is hidden, and nothing is a timer: the clock is `requestAnimationFrame`. A test moves a replay for a while and holds the surface's elements to be the same ones at the end.

| Key | What it does |
| --- | --- |
| Space | Play or pause (in step mode, one step on). |
| Left and right arrow | The previous or the next frame (in step mode, a step). |
| Shift with an arrow | Five seconds back or on. |
| Home and End | The first and the last moment. |

The keys work with the focus on the drawing or on a button; the slider and the speed keep their own.

## A swimming race

`raceTimeline` makes a timeline of a swimming race from the splits of its swimmers: each goes down the first length and back the next at the speed of each split, and the events are the turns and the finishes. It is described with the pool in [a race replay](./pools.md#a-race-replay); the timeline it gives is in the `swimming` frame, in metres, and every function of this page plays it.

## The clock

The controller is a state machine that knows nothing of the page: the caller tells it how many seconds went by. A test, a server and a page that has its own loop can use it as it is.

```ts
import { createReplay } from "@johnmorrisdotca/kyogijo-stadiums/replay";

const frames = [0, 1, 2, 3, 4].map((t) => ({ t, objects: [{ id: "ball", team: "ball" as const, x: t * 10, y: 0 }] }));
const replay = createReplay({ frames, events: [{ t: 2, kind: "goal" }] }, { speed: 2, loop: true });
replay.subscribe((change) => change.crossed.length > 0 && console.log(change.crossed.map((e) => e.kind).join()));
replay.play();
replay.advance(1.5);
replay.advance(1);
console.log(replay.state().t, replay.state().playing);
// goal
// 1 true
```

`play`, `pause`, `toggle`, `seek`, `step(±1)` (a frame; in step mode, `stepSeconds`), `jump(seconds)`, `setSpeed`, `setLoop`, `setMotion`, `advance(seconds)`, `state()` and `subscribe(listener)`. A listener is told the new state, why (`play`, `pause`, `seek`, `step`, `tick`, `speed`, `loop`, `motion`) and the events that went by in the move (going forward), which is what the live region says. At the end the clock stops (`ended: true`) unless it loops; playing at the end begins again.

## Care for the reader

- **Reduced motion.** With `prefers-reduced-motion: reduce` nothing plays by itself and nothing glides: the controls are the previous and next step and the slider, play steps one step on, the speed and loop controls are left out, and each step announces the events it passed. A reader who changes the setting while the page is open is switched over at once.
- **A hidden page pauses.** When the page is hidden (`visibilitychange`) the replay pauses, and it stays paused when the page comes back.
- **Events are announced.** A live region (`role="status"`, polite) says each goal, shot, pass or whistle as it goes by while playing or stepping, with its time: "Goal, home, 0:12". Scrubbing does not announce. `replayTable` lists every event as text.
- **Controls with names.** Every control has an accessible name in English or Japanese (the drawing's `language`), at least 44 pixels square, with a visible focus. The slider says its value in words ("0:09 of 0:14"). The drawing is a group with the keys it answers to in its description.
- **No network.** Nothing is fetched, stored or sent. A test holds the code to it.
- **Colour is not the only sign.** The teams differ in shape (circle and square) and in number, a shot is dashed, a goal a star.

A score that changes through `mount.update()` is highlighted too: the number swells and settles, or, for a reader who prefers reduced motion, only fades in. `highlight: false` in the mount's settings turns it off.

## Limits

Held by tests: 22 players and a ball for 60 seconds at 25 frames a second is 1,501 frames and 24 objects. Reading a position takes about 0.02 ms, a trail 0.01 ms and a whole frame as a string 0.5 ms (the test allows 8), a frame is 17 kB of SVG of which 8 kB is the stylesheet, and the replay's code is under 80 kB of source before it is built. Moving the marks of a frame is a few dozen attribute writes, so it is SVG and not a canvas; at around 200 objects or more a canvas would be the next step, and it is not here.

What it does not do: play video, stream or fetch data, or work out anything the data does not say (a player's speed, a pass's outcome, an offside).

The ideas of a timeline of positions played on a surface were taken from [hockey_rink](https://github.com/the-bucketless/hockey_rink) and [mplsoccer](https://github.com/andrewRowlinson/mplsoccer), which animate tracking data: see [references](./references.md#replay). No code of either is used.
