# The race feed

[日本語](race-feed.ja.md) · English

A race on a [circuit](./circuits.md) can play from a feed instead of the [simulation](./circuits.md#a-race): **kyogijo's open race timeline**, a small JSON format any feed, file or program can write, or the lap rows of an OpenF1-style API, read by an adapter. The feed is the reader's: their browser reads the address they give (or the text they paste, or the file they choose), nothing goes through a server of ours (there is none), and nothing is kept beyond the page. Names, codes, teams and times show only in that page, from that feed. The reader is responsible for the terms of the source they use: [Where to find a feed](./where-to-find-a-feed.md) lists the known ones, with their terms.

```ts
import { raceAt, raceFromFeed } from "@johnmorrisdotca/kyogijo-stadiums/circuits";

const race = raceFromFeed({
  kind: "kyogijo-race",
  version: 1,
  circuit: "las-vegas",
  laps: 2,
  cars: [{ id: "a", code: "AAA", name: "Made-up A", team: "Made-up Team", colour: "#3366cc" }, { id: "b", code: "BBB" }],
  crossings: [{ car: "a", lap: 1, t: 101.2 }, { car: "b", lap: 1, t: 102 }, { car: "a", lap: 2, t: 198.4 }, { car: "b", lap: 2, t: 199.9 }],
});
const end = raceAt(race, race.duration);
console.log(race.laps, end.standings.map((s) => s.car.driver.code).join(" "), end.standings[1].gap!.toFixed(1));
// 2 AAA BBB 1.5
```

## The open race timeline

| Field | What it is |
| --- | --- |
| `kind`, `version` | `"kyogijo-race"` and `1`. Anything else is refused, in words. |
| `circuit` | The circuit's key (`las-vegas`), if the feed knows it. A page draws a feed on the circuit it shows. |
| `laps` | The race's laps, if the feed knows them; else the most any car has done. |
| `title` | A line about where the race comes from. |
| `cars` | Each car: an `id` the rest of the feed uses (text or a number), and if it has them a `code` (three letters, as a timing board shows one), a `name`, a `team`, a `colour` (`#rrggbb`) and its `grid` place. At most 40. |
| `crossings` | When each car completed each lap: `{ car, lap, t }`, `t` in seconds from the start (the lights going out). Lap 1 is the first time it crossed the timing line after the start. At least one is needed. |
| `pits` | When a car left the track for the pit lane and joined it again: `{ car, in, out, stop? }`, `stop` being how long it stood still. |
| `out` | When a car retired: `{ car, t }`. |
| `positions` | Where a car was, in the feed's own frame (any unit, any way up): `{ car, t, x, y }`. |
| `live` | `true` while the race is going on: the last lap seen is not the end, and a page may ask again. |

**Read strictly.** `readRaceFeed` refuses anything that is not this format with a sentence that says why (not an object, another `kind` or `version`, no cars, two cars with one id, more than 40 cars, more than 200,000 rows of a list, no lap at all), leaves behind every field it does not name, skips a row of a car the feed does not have, and keeps the feed's text as text: a name is never markup on the page.

**Between the moments a feed gives, the cars run at the lap's own speeds.** A feed says when each car crossed the line, not where it was in between: `raceFromFeed` runs each car round the lap at the speeds the circuit's line allows ([`paceProfile`](./circuits.md#a-race)), stretched to meet each crossing, so it is slow in the turns and quick on the straights, as a car is. A pit stop takes the car down the pit lane between its `in` and `out`. A car still running when a live feed ends goes on round at its last lap's pace. **Location samples are laid on the circuit's own line**: a feed's positions are in its own frame, which is not the drawing's, so each sample is placed by how far round the lap it is (along the path one car drew over a whole lap, from the timing line), never by its numbers, and the dots stay on the road.

`raceToFeed(race)` writes any race in this format: the demo's **sample feed** is the package's own simulated race written so, at `examples/races/las-vegas-sample.json` on the demo's site (made by `node scripts/make-sample-race.mjs`; a test holds the file to what the script makes). It is listed first among the suggestions, as *Sample feed (made up)*.

## OpenF1-style rows

`openF1Feed({ laps, pit?, drivers?, location? })` turns the answers of an OpenF1-style API into a feed: a lap is completed at its `date_start` plus its `lap_duration` (or, where the duration is missing, at the next lap's start), the start is the earliest start of a first lap, a pit stop runs from its row's `date` for its lane's duration, and the drivers' `name_acronym`, `last_name`, `team_name` and `team_colour` name the cars. Only the lap rows are needed: without the rest the race plays by car numbers. `feedFromText` and `loadRaceFeed` find lap rows by their shape (`driver_number` and `lap_number`).

## From an address, pasted or from a file

```ts no-run
import { loadRaceFeed, mountCircuitRace, raceFromFeed } from "@johnmorrisdotca/kyogijo-stadiums/circuits";

const feed = await loadRaceFeed("https://example.org/a-race.json");
const race = mountCircuitRace(document.querySelector("#race")!, { circuit: "las-vegas" }, { race: raceFromFeed(feed, "las-vegas") });
race.play();
```

`loadRaceFeed(address)` reads an http or https address with the reader's browser, sending no cookie and no referrer. For an OpenF1-style lap address (`…/laps?session_key=…`) it also asks the same source for that session's pit stops and drivers, and plays without them if it cannot have them. It throws a `RaceFeedError` whose message says what went wrong: not an address; **a source that does not let pages on other sites read it** (CORS), with the way round it, to paste its answer or save it and choose the file; a refusal (401 or 403); too many requests (429); another status; more than 30 MB; not JSON; not a feed. `feedFromText(text)` reads pasted text or a file's, either format. We never run a relay or proxy to get round a source's CORS: a reader who wants one runs their own.

## Following a race that is going on

```ts no-run
import { followRaceFeed, mountCircuitRace, raceFromFeed } from "@johnmorrisdotca/kyogijo-stadiums/circuits";

let view: ReturnType<typeof mountCircuitRace> | undefined;
const follow = followRaceFeed("https://example.org/live-race.json", (feed) => {
  const race = raceFromFeed(feed, "las-vegas");
  if (view === undefined) view = mountCircuitRace(document.querySelector("#race")!, { circuit: "las-vegas" }, { race });
  else view.replace(race);
});
```

`followRaceFeed(address, onFeed)` asks the address again every 15 seconds (`every`, never faster than 10), and only while the page is visible: a hidden page asks nothing, and the page shown again asks at once. It stops by itself when the feed is no longer `live`, when the source refuses (403) or says it is busy (429), and when `stop` is called; after any other failure it waits twice as long each time, up to two minutes. `view.replace(race)` plays the new race in the same view, the clock where it was. OpenF1-style lap rows carry no `live` mark, so a page following one says so itself.

## In the demo

**[Try a feed: circuits.html?race=1&feed=sample](https://johnmorrisdotca.github.io/kyogijo-stadiums/circuits.html?race=1&feed=sample)**, the sample feed playing live in the demo.

![The circuits page's race panel: buttons for the simulation, the sample feed (made up, chosen), OpenF1 and Jolpica F1, what the sample gives, the feed's address field with Play the feed and Follow live, the fold to paste a feed or choose a file, the line that says the feed is playing and the note on the source's terms](./pictures/circuits-race-feed-desk-light.webp)

[Try a feed: circuits.html?race=1&feed=sample](https://johnmorrisdotca.github.io/kyogijo-stadiums/circuits.html?race=1&feed=sample)

The circuits page's **Race** shows what the race plays: the simulation, *Sample feed (made up)*, or a suggestion from [Where to find a feed](./where-to-find-a-feed.md), which fills the address field (with what it gives, how to find a race's id, its docs and its terms beside it). **Play the feed** reads the address; **Follow live** keeps asking while the race is live; **Paste a feed, or choose a file** reads text or a file for a source the browser cannot reach. The address is kept in the page's own address (`feed=`); pasted text is not kept anywhere.

## Tests

Every test of feeds runs on made-up stubs written for them: invented cars, times and addresses on hosts that do not exist (`*.example.test`), answered by a stub in place of the network. No test, in the unit tests or in the browser, makes a real request.
