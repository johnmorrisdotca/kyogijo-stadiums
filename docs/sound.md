# Sound

[日本語](sound.ja.md) · English

A surface can be heard: the crowd of its kind of venue at a level from quiet to a roar, in the room its venue makes, and the sounds of its sport's game (a goal horn and the crowd's swell at a goal, a whistle at a stoppage, a buzzer at the end of a period, a ring's bell) from a replay it follows or from events a page pushes as they happen. `@johnmorrisdotca/kyogijo-stadiums/sound` has it, with no dependency: everything is made in the browser with Web Audio, and a page may give recordings of its own for the voices it has files for. It is **off until the reader turns it on**, and nothing is fetched, made or decoded before that.

[The demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/venues.html?sound=on) has a Sound button on the real arenas, under the surface in Try it, over the arena at the top of the page and in the game section.

## A crowd on its own

```ts no-run
import { createKyogijoSound } from "@johnmorrisdotca/kyogijo-stadiums/sound";

const host = document.querySelector("#rink")!;
const sound = createKyogijoSound({ sport: "nhl", venue: { roof: "fixed", seats: 18000 }, view: "3d", level: "loud", host });
document.querySelector("#sound")!.addEventListener("click", () => sound.enable()); // a press: a browser starts audio only after one
sound.setLevel("roar");
sound.setVolume(0.4);
sound.disable();
```

`createKyogijoSound(settings)` makes nothing until `enable()`, which a page calls from a press (a browser lets audio start only after one). The first `enable()` makes the page's one audio context and fetches the recordings given in `files` that the surface uses; every sound of a page shares that context.

| Setting | What it is |
| --- | --- |
| `sport` | The surface (`nhl`, `soccer`, `judo`, ...). A surface with no sound set makes none (`state().has` is false): a page shows no sound controls for it. |
| `venue` | `{ roof, seats }`: the kind of roof (`open`, `canopy`, `cable`, `panels`, `fixed`, `dome`, `saddle`, `barrel`, as the real venues give it) and the seats. Without it, the bed's own. |
| `crowd` | The share of the seats taken, 0 to 1 (1). 0 is an empty building: only its air, and no level to choose. |
| `view` | `3d` is in the building; `2d` is the drawing from above, heard as a broadcast is, the crowd further off and the room drier. |
| `level` | `quiet`, `murmur`, `engaged` (the default), `loud`, `roar`, or `auto`: the game's (below). |
| `volume` | 0 to 1 (0.6). 0 is muted, and then nothing is heard or made. |
| `files` | Recordings by name (`murmur`, `applause`, `water`, `whistle`, `bell`, `ooh`, `cheer`, or any voice or layer): fetched at the first `enable()`, decoded only when heard. Anything not given is made in the browser. |
| `host` | The element the surface is drawn in: the sound stops while it is out of sight. |
| `onCue` | Told of each cue as it plays. |
| `audio`, `fetch`, `doc` | The audio context's maker, the fetch and the document, for a test. |

`setLevel`, `setVolume` and `setContext({ sport, venue, crowd, view })` change it as it plays: the bed glides to the new level in about a second, and a new surface lays its own bed. `state()` says what it does: `has`, `on`, `audible`, `quiet` (why not: `no-sound`, `off`, `muted`, `hidden`, `out-of-sight`, `paused`), the level chosen and the level `heard`, the `levels` and `voices` the surface offers, and the files fetched. `destroy()` stops it and takes its listeners away.

## The index of sound sets

The sound of a surface is looked up, not written into each page: a crowd **bed** for each kind of venue, and a **set** for each sport with its bed and its cues. A page's controls are the set's: the levels it offers, and nothing for a surface with none.

| Bed | Indoors | Rings for | Levels | Sports |
| --- | --- | --- | --- | --- |
| `arena` | yes | 2.2 s | all five | ice hockey, basketball, speed and figure skating |
| `stadium` | no | 0.7 s | all five | the football codes, soccer, rugby, Australian football, Gaelic games, lacrosse, field hockey |
| `ballpark` | no | 0.6 s | all five | baseball, cricket |
| `hall` | yes | 1.6 s | all five | every net, racket and court sport, handball, netball, curling (three) |
| `pool` | yes | 2.6 s | all five, and the water | swimming, water polo, diving, artistic swimming |
| `dojo` | yes | 1.3 s | quiet to loud | judo, karate, kendo, the dojo; kyudo (quiet and murmur) |
| `ring` | yes | 1.8 s | all five | sumo, MMA, boxing, wrestling, pro wrestling |
| `track` | no | 0.8 s | all five | athletics |

A sport's cues, by the kind of moment: hockey's goal is the **horn** and the crowd's **swell**, its stoppage a **whistle**, a period's end the **buzzer**; basketball's period ends on the buzzer; soccer and the field games blow the **whistle** at a stoppage and three times at the end, and a goal is the swell; a court sport's point is **applause**; the ring has its **bell** at a round's start and end; athletics starts with a **gun** and swimming with a **beep**; a near miss (a shot) lifts the crowd ("**ooh**"). The circuits have no set yet, so they show no sound.

```ts
import { SOUND_BEDS, cuesOf, soundLevelsOf, soundSetOf } from "@johnmorrisdotca/kyogijo-stadiums/sound";

console.log(soundSetOf("nhl")?.bed, SOUND_BEDS.arena.indoor, soundLevelsOf("kyudo").join());
console.log(cuesOf({ kind: "goal" }, "nhl").join(), cuesOf({ kind: "goal" }, "soccer").join(), soundSetOf("circuit"));
// arena true quiet,murmur
// horn,swell swell undefined
```

`SOUND_BEDS`, `SOUND_SETS` and `SOUND_OF_SPORT` are the index; every surface the package draws has a set, and a test holds it.

## The room and the crowd

The context changes the sound, not only the surface: `soundRoom(context)` says how closed in the venue is (its roof), how long it rings (longer closed in, and longer for a larger building), how much echo, and how loud the crowd is for the people in it (the seats times the share taken, on a scale that grows slower than their number, as a crowd's sound does). `soundMix(context, level)` adds each layer's gain at a level.

```ts
import { soundMix, soundRoom } from "@johnmorrisdotca/kyogijo-stadiums/sound";

const arena = soundRoom({ sport: "nhl", venue: { roof: "fixed", seats: 18000 } })!;
const open = soundRoom({ sport: "soccer", venue: { roof: "open", seats: 50000 } })!;
console.log(arena.decay > open.decay, arena.wet > open.wet, soundRoom({ sport: "nhl", crowd: 0 })!.crowd);
const flat = soundRoom({ sport: "nhl", venue: { roof: "fixed", seats: 18000 }, view: "2d" })!;
console.log(flat.wet < arena.wet, soundMix({ sport: "judo" }, "roar")!.level);
// true true 0
// true loud
```

A bed is four loops, turned up and down: the building's **air**, people **talking**, **applause** and the crowd's **voice** together (the pool adds its **water**). A quiet room is mostly air; a roar mostly voices. A level the sport does not offer is held to the nearest it does: a dojo asked to roar is loud.

## Game cues

`sound.follow(controller, { periods, scoreAt })` follows a replay's controller ([`mount.replay`](./replay.md#playing-it-in-a-page) or [`view.replay`](./replay.md#in-3d)): the cues of its events as they go by while it plays, the cues of its periods' starts and ends (the last end is the game's), quiet while it is paused, and under `level: "auto"` the crowd follows the game.

```ts no-run
import { createKyogijoSound } from "@johnmorrisdotca/kyogijo-stadiums/sound";
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";
import type { ReplayTimeline } from "@johnmorrisdotca/kyogijo-stadiums/replay";

declare const game: { timeline: ReplayTimeline; periods: { start: number; end: number }[] };
declare function scoreAt(game: unknown, t: number): { home: number; away: number };
const host = document.querySelector<HTMLElement>("#rink")!;
const view = mountKyogijoTurn(host, { sport: "nhl" });
const sound = createKyogijoSound({ sport: "nhl", level: "auto", host });
const replay = view.replay(game.timeline);
const stop = sound.follow(replay, { periods: game.periods, scoreAt: (t) => scoreAt(game, t) });
replay.play();
```

- **A cue comes only from play.** A move of the clock while it plays, or a step forward, calls the cues of what it went by; a seek, a jump back, a pause and a change of speed call none, as scrubbing announces nothing. `cuesOfChange(change, from, sport, periods)` is the rule, pure.
- **A timeline's own words are read.** `cueKindOf` reads `goal`, `touchdown`, `try`, `run`, `ippon` and `knockout` as a goal; `basket`, `point` and `score` as a point; `shot`, `save` and `miss` as a near miss; `whistle`, `foul`, `penalty` and `offside` as a stoppage; and the starts and ends of periods, rounds and races. A `pass` calls nothing.
- **Auto follows the game** (`excitementAt`): a murmur before the start, between periods and after the end; engaged in play; loud in the last third of a close game (one goal or none between the sides); a roar for six seconds after a goal; back to a murmur when one side is three ahead late on.
- **The end is heard out.** When the clock stops on a cue (the horn at the end of the game) the sound stays on for `SOUND_TAIL` seconds (5) and then goes quiet: one timer, once.
- **The same voice twice in a fifth of a second plays once**, so a fast replay does not stack whistles.

## Live events

A game that is not a replay, a feed as it comes, pushes its events: `sound.cue({ kind, team })` plays the event's cues at once, and `sound.game(moment)` gives the game's state (`{ t, start, end, periods, score }`) for the level under `auto`. A goal lifts the level under `auto` to a roar for six seconds. The demo's [live score](https://johnmorrisdotca.github.io/kyogijo-stadiums/#live) pushes each goal this way.

```ts no-run
import { createKyogijoSound } from "@johnmorrisdotca/kyogijo-stadiums/sound";

declare const rounds: { start: number; end: number }[];
const sound = createKyogijoSound({ sport: "boxing", level: "auto" });
await sound.enable();
sound.cue({ kind: "round-start" });                      // the bell
sound.game({ t: 50, start: 0, end: 540, periods: rounds, score: { home: 0, away: 0 } });
sound.cue({ kind: "knockout", team: "home" });           // the crowd's swell, and a roar
```

## What it costs

- **Off by default.** Nothing is fetched, made or decoded before `enable()`. A test turns every setter and holds that no audio context was made and no file asked for.
- **One audio context per page.** Every sound of a page shares it, and it is suspended whenever none of them is heard.
- **Nothing plays or decodes while it is not heard.** Turned off, at no volume, the page hidden, the surface out of sight (an `IntersectionObserver` on `host`) or its game paused: the bed's loops are stopped and the graph is taken away, and a recording fetched then is decoded only when it is heard. No timer runs and no animation frame is asked for; the one timer is the end's hold.
- **The bed glides only when its level or a setting changes**, never on every frame of a game.
- **Small.** The made loops are six seconds, written once from a seed when first heard. The demo's recordings are short loops and one-shots, one channel, Opus with AAC for a browser that cannot decode Opus: the most any sport loads is under 110 kB as Opus and under 190 kB as AAC, and a test holds every sport's set under 160 kB and 250 kB. They are not in the npm package.

## Recordings

The package ships no recording: its voices are made in the browser (a whistle as a high tone with a trill, the horn as three low saws through a filter, held as one chord and never a tune, the crowd as filtered noise whose level moves slowly). The demo gives its own, CC0 or in the public domain, each listed with its source, author and licence in [sound credits](./sound-credits.md); `pnpm sounds:fetch` and `pnpm sounds` make them, loudness matched, high-passed and with seamless loops. A page of yours may give any of its own the same way, by name in `files`; never a team's goal song, horn or chant, and never a recording whose licence forbids it.

## Care for the reader

- The sound never starts by itself: an address that says `sound=on` (the demo's) turns it on at the reader's first press anywhere on the page.
- Every cue has something to see too: a replay announces its events in its live region, and a page may show `onCue`'s.
- The controls are buttons with names in English and Japanese (`SOUND_WORDS`), a slider for the volume, and the levels a row of buttons, never a list to fold open. A reader who prefers reduced motion still hears the sound: that setting is for what moves.
- A test plays no audio: the tests use a stand-in for the audio context, and the browser tests render the real graph into memory (`OfflineAudioContext`) to hold it neither silent nor clipped, and louder level by level.
