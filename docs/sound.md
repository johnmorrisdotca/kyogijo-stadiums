# Sound

[日本語](sound.ja.md) · English

A surface can be heard: the crowd of its kind of venue at a level from quiet to a roar, in the room its venue makes. `@johnmorrisdotca/kyogijo-stadiums/sound` has it, with no dependency: everything is made in the browser with Web Audio, and a page may give recordings of its own for the layers it has files for. It is **off until the reader turns it on**, and nothing is fetched, made or decoded before that.

[The demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/venues.html?sound=on) has a Sound button on the real arenas, under the surface in Try it, and over the arena at the top of the page.

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
| `level` | `quiet`, `murmur`, `engaged` (the default), `loud`, or `roar`. |
| `volume` | 0 to 1 (0.6). 0 is muted, and then nothing is heard or made. |
| `files` | Recordings by name (`murmur`, `applause`, `water`, or any layer): fetched at the first `enable()`, decoded only when heard. Anything not given is made in the browser. |
| `host` | The element the surface is drawn in: the sound stops while it is out of sight. |
| `audio`, `fetch`, `doc` | The audio context's maker, the fetch and the document, for a test. |

`setLevel`, `setVolume` and `setContext({ sport, venue, crowd, view })` change it as it plays: the bed glides to the new level in about a second, and a new surface lays its own bed. `state()` says what it does: `has`, `on`, `audible`, `quiet` (why not: `no-sound`, `off`, `muted`, `hidden`, `out-of-sight`), the level chosen and the level `heard`, the `levels` the surface offers, and the files fetched. `destroy()` stops it and takes its listeners away.

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

The circuits have no set yet, so they show no sound.

```ts
import { SOUND_BEDS, soundLevelsOf, soundSetOf } from "@johnmorrisdotca/kyogijo-stadiums/sound";

console.log(soundSetOf("nhl")?.bed, SOUND_BEDS.arena.indoor, soundLevelsOf("kyudo").join());
console.log(soundSetOf("circuit"));
// arena true quiet,murmur
// undefined
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

## What it costs

- **Off by default.** Nothing is fetched, made or decoded before `enable()`. A test turns every setter and holds that no audio context was made and no file asked for.
- **One audio context per page.** Every sound of a page shares it, and it is suspended whenever none of them is heard.
- **Nothing plays or decodes while it is not heard.** Turned off, at no volume, the page hidden, the surface out of sight (an `IntersectionObserver` on `host`): the bed's loops are stopped and the graph is taken away, and a recording fetched then is decoded only when it is heard. No timer runs and no animation frame is asked for.
- **The bed glides only when its level or a setting changes.**
- **Small.** The made loops are six seconds, written once from a seed when first heard. The demo's recordings are short loops and one-shots, one channel, Opus with AAC for a browser that cannot decode Opus: the most any sport loads is under 110 kB as Opus and under 190 kB as AAC, and a test holds every sport's set under 160 kB and 250 kB. They are not in the npm package.

## Recordings

The package ships no recording: its crowd is made in the browser (filtered noise whose level moves slowly, talk as noise that rises and falls with syllables, applause as many short bursts). The demo gives its own, CC0 or in the public domain, each listed with its source, author and licence in [sound credits](./sound-credits.md); `pnpm sounds:fetch` and `pnpm sounds` make them, loudness matched, high-passed and with seamless loops. A page of yours may give any of its own the same way, by name in `files`; never a team's goal song, horn or chant, and never a recording whose licence forbids it.

## Care for the reader

- The sound never starts by itself: an address that says `sound=on` (the demo's) turns it on at the reader's first press anywhere on the page.
- The controls are buttons with names in English and Japanese (`SOUND_WORDS`), a slider for the volume, and the levels a row of buttons, never a list to fold open. A reader who prefers reduced motion still hears the sound: that setting is for what moves.
- A test plays no audio: the tests use a stand-in for the audio context, and the browser tests render the real graph into memory (`OfflineAudioContext`) to hold it neither silent nor clipped, and louder level by level.
