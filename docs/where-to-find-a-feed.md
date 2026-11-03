# Where to find a feed

[日本語](where-to-find-a-feed.ja.md) · English

kyogijo holds no league data and runs no server: a race or a game plays from a feed **you** choose, read by your own browser (see [the race feed](./race-feed.md)). This page says where to find one: the known public feeds for each sport, what each gives, a sample address, how to find a race's or game's id, and a link to each source's own docs and terms. **You are responsible for following the terms of the source you use.** Our own sample feeds come first: made up, served from the demo's site, in our open format, so that you can see what a feed looks like and try the address field with one.

The list is one data file, [`examples/feeds/where-to-find.json`](../examples/feeds/where-to-find.json), which the demo reads for its suggestions; a test holds this page to it.

## Racing

| Source | What it gives | Sample address | Finding a race | Docs and terms |
| --- | --- | --- | --- | --- |
| **Sample feed (made up)** | The package's own simulated race in kyogijo's open race timeline: 20 invented cars over 50 laps of the Las Vegas Strip Circuit, with lap times, pit stops and the flag. No real race, driver or team. | `examples/races/las-vegas-sample.json` on the demo's site | None needed: the address is the file. | [The race feed](./race-feed.md); MIT, with the package |
| **OpenF1** | An unofficial, community-run API of Formula 1 timing for sessions since 2023: every car's laps (start and duration), and from the same session its pit stops and drivers, which kyogijo also asks for. Historical sessions are free; live timing needs an account of theirs. Read by kyogijo's OpenF1 adapter. | `https://api.openf1.org/v1/laps?session_key=9644` | A `session_key`: list a weekend's sessions at `https://api.openf1.org/v1/sessions?year=2024&circuit_short_name=Las%20Vegas` and take the Race's `session_key`, then ask `https://api.openf1.org/v1/laps?session_key=<it>`. | [openf1.org](https://openf1.org/): CC BY-NC-SA 4.0, for educational, research and non-commercial fan use (their FAQ); not associated with Formula 1 |
| **Jolpica F1 (the Ergast API's successor)** | Results, and each car's position and time on every lap, for Formula 1 races over many seasons. kyogijo has no adapter for its shape yet: save its answer and turn it into the open race timeline (each lap's time added up gives the times the cars crossed the line). | `https://api.jolpi.ca/ergast/f1/2024/22/laps.json?limit=100` | A season and a round: `https://api.jolpi.ca/ergast/f1/2024.json` lists the season's races and their round numbers. | [github.com/jolpica/jolpica-f1](https://github.com/jolpica/jolpica-f1): read the terms of use linked from its README |

A source that does not let pages on other sites read it (CORS) cannot be read from the demo's page: the page says so, and you can paste its answer or save it and choose the file instead.
