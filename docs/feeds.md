# Feeds

[日本語](feeds.ja.md) · English

A feed is a game as data: the places of the players and the ball over time, and what happened (the shots, the goals, the whistles), with the sides and the periods. The [replay](./replay.md) plays it flat or [in 3D](./replay.md#in-3d), with the arena's scoreboard showing its score, period and clock. We host no feed and keep no league's data: the feed is yours. It comes from a file you pick or from text you paste.

## The rules we keep

- **No server or proxy of ours.** Nothing goes anywhere.
- **Nothing is kept.** No cache beyond the open page, no storage, nothing copied into the repository.
- **Names come from the feed, at run time.** The package ships no league's or team's names, logos or marks; whatever the feed names is shown as text while the page is open.
- **The terms are the source's.** You are responsible for following the terms of the source of a feed you play.
- **Tests use answers we made up**, never a real request.

## The open timeline

kyogijo's own format is the [replay timeline](./replay.md#the-timeline), as JSON: `frames` (each a time `t` and its `objects`, every one an `id`, a `team` of `home`, `away`, `ball`, `puck` or `official`, and `x`, `y`), `events` (a `t`, a `kind` such as `pass`, `shot`, `goal` or `whistle`, a `team` and a place), and for a scoreboard `periods` (each a `number`, a `start`, an `end`, and a `length` on the board's clock when the replay is re-timed) and `clock` (`down`, the time left, or `up`, the time gone). The sides go in `teams` (`home` and `away`, each an `abbr`, a `name` and a `color`), which `readFeed` gives back as the game's `teams`. `from` names the frame the places are in (`nhl-api`, `opta`: [frames](./frames.md)). A game file, as the [example game](./example-games.md) is, wraps a timeline with its sides, rosters and periods (`kind: "kyogijo-game"`); both read.

```json
{
  "from": "nhl-api",
  "frames": [{ "t": 0, "objects": [{ "id": "puck", "team": "puck", "x": 0, "y": 0 }] }, { "t": 30, "objects": [{ "id": "puck", "team": "puck", "x": 80, "y": 4 }] }],
  "events": [{ "t": 30, "kind": "goal", "team": "home", "x": 80, "y": 4 }],
  "periods": [{ "number": 1, "start": 0, "end": 1200 }],
  "teams": { "home": { "abbr": "AAA" }, "away": { "abbr": "BBB" } }
}
```

Every value is checked as it is read: a frame without a time, an object without a place or of an unknown team, an event without a time is left out; text is only ever text, cut short; every list is capped (`FEED_LIMITS`), so that a broken or hostile answer cannot hold the page.

## Read a feed

`@johnmorrisdotca/kyogijo-stadiums/feeds` reads an answer into a game: its `timeline`, whether the feed says it is over (`ended`), and the `players` it names. `readFeed(json, format?)` tells the formats apart by itself (`auto`), or takes `kyogijo` or `nhl`; `readFeedText(text)` reads text first, as a file or a paste gives it. What was wrong is a `FeedError` with a `kind` and a sentence.

```ts
import { readFeed } from "@johnmorrisdotca/kyogijo-stadiums/feeds";

const game = readFeed({
  frames: [{ t: 0, objects: [{ id: "puck", team: "puck", x: 0, y: 0 }] }, { t: 30, objects: [{ id: "puck", team: "puck", x: 80, y: 4 }] }],
  events: [{ t: 30, kind: "goal", team: "home" }],
});
console.log(game.format, game.timeline.frames.length, game.ended);
// kyogijo 2 true
```

### From a file or a paste

A browser that cannot reach a feed can still play it: the reader saves the answer and picks it as a file, or pastes it.

```ts no-run
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";
import { readFeedText } from "@johnmorrisdotca/kyogijo-stadiums/feeds";

const view = mountKyogijoTurn(document.querySelector("#rink")!, { sport: "nhl" }, { preset: "broadcast" });
document.querySelector<HTMLInputElement>("#file")!.addEventListener("change", async (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file !== undefined) view.replay(readFeedText(await file.text()).timeline).play();
});
```

## Adapters

An adapter is a pure function from a feed's own shape to the open timeline, tested on answers we made up. Each is listed here with what it reads.

| Format | Function | Reads |
| --- | --- | --- |
| `kyogijo` | `kyogijoFeed` | The open timeline, or a game file. |
| `nhl` | `nhlPlayByPlay` | A play-by-play shaped as the NHL's public one: `plays` (each with `periodDescriptor`, `timeInPeriod`, `typeDescKey`, `sortOrder` and `details` with `xCoord`, `yCoord`, `eventOwnerTeamId` and the player's id), `homeTeam` and `awayTeam` (`id`, `abbrev`, `commonName`), `rosterSpots` and `gameState`. |

A play-by-play has events and no tracking, so `nhlPlayByPlay` moves the puck between the places of the plays in a straight line (modelled between the known places), marks each shot, goal and whistle where it was, puts every play on the game's own clock (twenty minutes a period, an overtime of five in the regular season and twenty in the playoffs; the shoot-out is left out, and its goals are not the score's), and names the sides by their `abbrev` and the players by their names, at run time. `ended` is true once `gameState` is `OFF` or `FINAL`.


## In the demo

[Bring your own feed](https://johnmorrisdotca.github.io/kyogijo-stadiums/#feed), in the game section of the demo, plays a feed from a file or a paste.
