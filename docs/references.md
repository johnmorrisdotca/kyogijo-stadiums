# References

The links John has sent, and the ones the package's figures were read from: what each is, what it is useful for, and what we may use of it. A licence here is a note, not legal advice: when in doubt, nothing is copied.

## Sent to us

1. **[From PDF to production: building broadcast-style graphics](https://athlyticz.substack.com/p/from-pdf-to-production-building-broadcast) and [the NFL D3 demo](https://athlyticz.com/demo/nfl-d3)**
   - *What:* a broadcast-style D3 drawing of an NFL field, made from a rules PDF.
   - *Useful for:* the look and the approach, a field drawn from the rulebook's own measurements with the score on it.
   - *May use:* inspiration only. No code, drawing or text is copied; Kyogijo's field is written from the rules.
2. **[IFAF 2021 field diagrams](http://www.myiafoa.org/rules/ifaf2021/FieldDiagrams.pdf)** (Appendix D of the IFAF 2021 rules)
   - *What:* the field diagram and the groundsmen's notes of the international federation: dimensions and markings of the 120 by 53⅓ yard field.
   - *Useful for:* the IFAF field: hash marks 60 feet from the sidelines, numbers 27 feet from them, posts on the end lines, no yard lines in the end zones.
   - *May use:* its dimensions and markings, which are facts, cited in [sources.md](./sources.md). The diagram itself is not copied.
3. **[mlb_field_equations.py](https://github.com/Robbiedudz34/daily_mlb_pitching_reports/blob/main/mlb_field_equations.py)** (daily_mlb_pitching_reports)
   - *What:* piecewise polar equations for each ballpark's outfield wall.
   - *Useful for:* knowing that per-park outlines are wanted and can be made.
   - *May use:* nothing. The repository has no licence, so all rights are reserved: none of its code, equations or constants is used. The outlines are built from published fence distances instead (see below).
4. **[The Ringer, 2020: NBA court designs](https://www.theringer.com/2020/06/16/nba/nba-court-designs-floors)**
   - *What:* a survey of NBA floors: paint colours, wordmarks, centre logos, borders, wood tones, alternate and City Edition floors.
   - *Useful for:* the options of `court`: the key's paint, the border and apron colour, the wood tone, a logo at centre court, words on the baselines, two-tone keys.
   - *May use:* as inspiration for options. No images or text are copied; every team logo comes from the caller.
5. **[NBA.com: the In-Season Tournament courts for all 30 teams](https://www.nba.com/news/nba-debuts-in-season-tournament-courts-for-all-30-teams)**
   - *What:* the full-colour painted floors of the NBA Cup, one per team.
   - *Useful for:* the `tournament` court look: a floor painted edge to edge, with coloured keys and border and centre and baseline marks.
   - *May use:* inspiration only. NBA.com's terms forbid reuse of its content: no images or text are copied and no team marks are bundled.
6. **[Grantland: NBA court design power rankings](https://grantland.com/features/nba-court-design-power-rankings/)**
   - *What:* a critique of what makes a court design work: the wood tone, the key colour, borders, where a logo goes, restraint against clutter.
   - *Useful for:* the defaults and the presets of `COURT_THEMES`: a few clear colours, a border, a restrained centre.
   - *May use:* as design guidance. No text or images are copied.
7. **[bdilday/GeomMLBStadiums](https://github.com/bdilday/GeomMLBStadiums)** (R, ggplot2)
   - *What:* outlines of the 30 current MLB parks and a generic one, as paths (foul lines, home plate, infield inner and outer, outfield inner and outer) in MLBAM's Statcast `hc_x`/`hc_y` hit coordinates, with a transform to feet-like axes and a spray-chart geom. Last data change 2023 (Camden Yards).
   - *Useful for:* the features worth matching: a wall drawn as a path rather than five distances, the infield and warning track as their own segments, and batted balls drawn on the same axes (our roadmap's "players on the surface").
   - *May use:* nothing (see "Not used" below). The paths sit in MLBAM's own pixel space, which points to MLB's Gameday images as their origin, and no source is named.
8. **[gavinr/mlb-spring-training-stadiums](https://github.com/gavinr/mlb-spring-training-stadiums)**
   - *What:* the Cactus and Grapefruit League parks as CSV and GeoJSON (name, latitude, longitude, teams, Wikipedia address), read from Wikipedia's "Spring training" page in 2013 and refreshed in 2021, with an ArcGIS map in the README.
   - *Useful for:* a spring-training set and the idea of a map of every ground in the README and the demo.
   - *May use:* the idea only. The repository has no licence. Coordinates and names are facts we can read from Wikidata (CC0) ourselves; the list is also out of date (it still says Cleveland Indians, and Oakland at Hohokam).
9. **[sportsdataverse/sportypy](https://github.com/sportsdataverse/sportypy)** and its R twin [sportyR](https://github.com/sportsdataverse/sportyR)
   - *What:* regulation surfaces for baseball, basketball, curling, football, hockey, soccer, tennis and volleyball (about 45 leagues: FIBA, WNBA, NCAA, NFHS, IIHF, AHL, ECHL, OHL, QMJHL, EPL, MLS, ITF, FIVB, WCF and more), each in its rulebook's unit, with `display_range` (red zone, house, half court), rotation, colour updates and a unit option.
   - *Useful for:* the bar for coverage: the leagues, the surface units table, display ranges.
   - *May use:* ideas and facts only. Both are GPL-3.0, so no code or data files are copied into an MIT package; every figure is read from its rulebook.
10. **[sportsdataverse/sdvplot-js](https://github.com/sportsdataverse/sdvplot-js)** (`@sportsdataverse/sporty` on npm)
    - *What:* the TypeScript port of sportyR: nine sports, 53 league surfaces as a scene of polygons, SVG/canvas/Observable Plot/d3 renderers, coordinate frames (`toSurfaceFrame`: stats.nba.com, HockeyTech, ESPN yard line), NBA shot zones. Its sister packages do team colours, logos and tables.
    - *Useful for:* the nearest rival in JavaScript; what to match (renderers, frames, units converting the anchors too) and what it lacks (score mode, ballparks by name, eras, layouts for a phone, Japanese).
    - *May use:* MIT, so ideas freely and code with credit; we write our own and credit it here.
11. **[the-bucketless/hockey_rink](https://github.com/the-bucketless/hockey_rink)** (Python, Matplotlib)
    - *What:* NHL, NWHL and IIHF rinks (old and new) with partial rinks, and plotting on them: scatter, lines, arrows, wavy arrows, text, binned statistics, heatmaps, hexbins, contours, clipping to the boards, and animation of tracking data.
    - *Useful for:* the list of hockey charts to beat: shot maps, heatmaps, zone views, animated replays.
    - *May use:* ideas only. GPL-3.0: no code is copied.
12. **[andrewRowlinson/mplsoccer](https://github.com/andrewRowlinson/mplsoccer)** (Python, Matplotlib; hockey_rink's inspiration)
    - *What:* soccer pitches in nine providers' coordinates (StatsBomb, Opta, Wyscout, Tracab, Second Spectrum, SkillCorner, Metrica, Impect, UEFA) with a standardiser between them; scatter, lines, comet lines, arrows, heatmaps (positional zones), hexbins, KDE, pass networks, flow, Voronoi, Delaunay, convex hulls, sonars, formations, radar, pizza and bumpy charts, grids with title and endnote, animation, and a StatsBomb open-data loader. Its gallery is the standard for documentation.
    - *Useful for:* the bar for the soccer module and for data layers in every sport.
    - *May use:* MIT, so ideas freely and code with credit; we write our own. StatsBomb's open data has its own terms and is not bundled.
    - *Its docs:* the [Pitch types](https://mplsoccer.readthedocs.io/en/latest/gallery/pitch_setup/plot_pitch_types.html) page, one section per provider with a short note, the code and a picture with axes and labels, is the model for our page per coordinate system (we add a summary table, a side-by-side comparison and a live converter).
13. **[Torvaney/ggsoccer](https://github.com/Torvaney/ggsoccer)** (R, ggplot2)
    - *What:* soccer pitches as ggplot layers; a pitch is a spec of a few numbers (length, width, penalty box, six-yard box, spot, goal width, arc, origin), with specs for StatsPerform/Opta (100 by 100, the default), StatsBomb (120 by 80), Wyscout, Tracab (centred, variable size), Impect and the international 105 by 68; `rescale_coordinates(from, to)` between them; goal styles (box, line, strip, or your own function); colour, fill, line width, line type and alpha; a direction-of-play label; partial pitches by plot limits.
    - *Useful for:* providers as specs, rescaling landmark to landmark, goal styles, line styling, the direction label.
    - *May use:* MIT (`LICENSE.md`, Benjamin Torvaney 2019): ideas freely, and the provider figures are facts from each provider's documentation, which we cite ourselves.
14. **[shawnmlevin/NFL-Stadium-Polygons](https://github.com/shawnmlevin/NFL-Stadium-Polygons)**
    - *What:* one GeoJSON of 65 polygons, the field and the outline of about 35 NFL stadiums plus Wembley, Twickenham and Azteca, drawn by hand on Mapbox in 2017 and 2018.
    - *Useful for:* the idea of a stadium's footprint and its field's real bearing on a map, and a reminder that NFL games are played abroad.
    - *May use:* nothing. The repository has no licence, and the shapes were traced over Mapbox imagery.

## Where the figures were read

- **NFL rulebook, Rule 1; CFL rulebook, "The Field"** ([cfldb.ca](https://cfldb.ca/rulebook/conduct-of-the-game/the-field/), and the [2015 edition](https://cfldb.ca/rulebook/2015/conduct-of-the-game/the-field/)); **NHL rulebook, Rule 1; NBA rulebook, Rule 1** ([official.nba.com](https://official.nba.com/rule-no-1-court-dimensions/)); **Official Baseball Rules**, 2.01 to 2.05. Dimensions are facts, cited in [sources.md](./sources.md).
- **Wikipedia, CC BY-SA 4.0**: "[American football field](https://en.wikipedia.org/wiki/American_football_field)", "[Canadian football field](https://en.wikipedia.org/wiki/Canadian_football_field)", "[Ice hockey rink](https://en.wikipedia.org/wiki/Ice_hockey_rink)", "[Basketball court](https://en.wikipedia.org/wiki/Basketball_court)", "[Key (basketball)](https://en.wikipedia.org/wiki/Key_(basketball))". Facts only; no text is copied.

## The ballparks

- **What:** the English and Japanese Wikipedia article of each of the 94 parks (30 current MLB parks, 44 past MLB parks, 12 NPB home parks and 8 other NPB grounds), at the revision named for each in [NOTICE.md](../NOTICE.md) and `scripts/parks.data.json`. Each gives the fence distances at the foul lines, the alleys and the middle: in feet for MLB, in metres (両翼, 中堅, 左右中間) for Japan.
- **Useful for:** each park's fence, drawn through its published distances; the names in English and Japanese; the teams.
- **May use:** the distances, which are facts. The articles are CC BY-SA 4.0 and none of their text, tables or pictures is used, so the share-alike condition does not reach the package; the articles are cited by revision so that the figures can be checked and credit is given.
- **How they were read:** a distance is taken as the article's label says (foul line, left-center, center) and placed at 45, 22.5 and 0 degrees from dead centre; where a park lists more than one figure between, they are spread in the order listed. This is our reading, since the articles give distances and not directions. Where an article has several periods (Kauffman Stadium's alleys changed for 2026) the current figure is used. Where the Japanese article gives announced and measured distances (Korakuen, Kawasaki) the measured are used. Japanese figures are in metres and converted once, at 3.280839895 feet to the metre.

### The past MLB parks

- **Which:** every ground an MLB club called home that the SPX Stats archive holds (its public `api.venue_place` and `api.venue_info` views, read in October 2026: 54 MLB rows), and the classic ones besides: Forbes Field, Ebbets Field, the Polo Grounds, Shibe Park, Crosley Field, Sportsman's Park, Griffith Stadium, Comiskey Park, Tiger Stadium, Baker Bowl, Braves Field, League Park, Cleveland Stadium, Municipal Stadium (Kansas City), Memorial Stadium, County Stadium, Candlestick Park, Seals Stadium, Wrigley Field (Los Angeles), 44 in all. Each has its `status` as `past`, and `from` and `to`, the first and last season an MLB club played there (read from the article's list of tenants; Robert F. Kennedy Memorial Stadium has two spells, 1962 to 1971 and 2005 to 2007, and the `from` and `to` span both).
- **The key to join on:** every park, current, past and NPB, has `wikidata`, the Wikidata item of its ground (`Q49136` for Fenway Park). Each was read as the `wikibase_item` that the cited article carries (MediaWiki API, `prop=pageprops`), then checked against the item's English label. Where SPX Stats holds the ground, its `api.venue_place.wikidata_id` is the same item. The items are unique across the 94 parks.
- **The last fence is the park's fence.** `points` is the fence the article gives as the park's last (or its only). Where the article dates earlier fences (Huntington Avenue Grounds moved center field from 530 to 635 feet in 1908; the Polo Grounds had three fences; Shibe Park four), each is a period in `periods` with its first and last season, and `drawKyogijo({ sport: "mlb", park, year })` draws the one in effect that season. A season in no period, or no `year`, gets `points`. Periods are only the complete fences that an article dates; a figure the article gives for a single year without the other distances (Shibe Park's 360 feet on opening day of 1909, Braves Field's fences moved nearly every year) is left out or noted, never filled in.
- **Choosing among an article's figures.** The infobox's set of five (left, left-center, center, right-center, right) is used when it has one. Where an article lists the posted distances of the whole wall (the Polo Grounds, Forbes Field, Sportsman's Park, County Stadium, Shea Stadium) those are used, in the order listed, spread between the foul lines and the middle as above. Where a deepest corner stands beside center (Sportsman's Park 426, Forbes Field's 442, Ebbets Field's notch at 399) the figure labelled center is center and the corner is read left of it. A park's article that gives one figure to a position and a different one in its text uses the infobox (Griffith Stadium's left-center, listed at 360 feet next to left field at 388, is as published). Four figures only (Baker Bowl, Huntington Avenue Grounds) or three (Exposition Park, Sick's Stadium) are drawn through just those; the curve does not invent a right-center.
- **Not guessed:** a park without published distances is left out. These grounds were looked for and are missing:
  - *League Park* in Cincinnati (`Q6508941`, Reds 1884 to 1901): the article gives left field, 253 feet, and nothing else.
  - *Palace of the Fans* (`Q7126271`, Reds 1902 to 1911): the infobox gives five figures, but its right field (450 feet) is longer than its center (400) and its left-center is 418; the labels look transposed and we do not correct them.
  - *Kingdome* (`Q990430`, Mariners 1977 to 1999), *Hard Rock Stadium* as Joe Robbie Stadium (`Q864339`, Marlins 1993 to 2011), *Bennett Park* (`Q4889721`, Tigers 1901 to 1911), *American League Park* in Washington (`Q4744320`), *West Side Park* (`Q3299098`, Cubs), *Eastern Park* (`Q5330371`), *Congress Street Grounds* (`Q5160829`), *Washington Park* in Brooklyn (`Q49577200`) and *South Side Park* (`Q7568485`, White Sox 1901 to 1910): the article gives no distances.
  - *Los Angeles Memorial Coliseum* (`Q849784`, Dodgers 1958 to 1961): left field, 251 feet, and the alleys, 320 feet; no center or right.
  - *Robison Field* (`Q11350605`, Cardinals 1893 to 1920): the article's figures for 1909 have no right field, and those of 1893 are for the ground before its rebuilding.
  - The 19th-century grounds of the National League and the American Association, the Federal League's, and the neutral or one-off sites of the regular season (Estadio de Béisbol Monterrey, the Tokyo Dome, Rickwood Field and so on) were not looked for.

### Not used

- Per-park equations from any source with no licence (item 3 above). [bdilday/GeomMLBStadiums](https://github.com/bdilday/GeomMLBStadiums) was looked at as a permissive source: its LICENSE file is only the two-line stub of an R package's MIT licence (year and holder), GitHub does not recognise a licence, and the outlines' own provenance is not stated, so nothing of it is used. Nor were Sports Reference or ESPN, whose terms forbid it, or sportypy.

## The coordinate frames and the units

- **What was read:** the pages named in [sources.md](./sources.md#coordinate-frames), for facts only: ranges, units, origins and conventions of each provider's coordinates. No text or code of any is copied.
- **Ideas credited (MIT, so ideas freely and code with credit; we wrote our own):**
  - [sportsdataverse/sdvplot-js](https://github.com/sportsdataverse/sdvplot-js) (`@sportsdataverse/sporty`, item 10 above), whose `toSurfaceFrame` showed that a provider's frame can be a named, documented thing a drawing maps into, and that units should convert a figure's anchors and limits with its points.
  - [andrewRowlinson/mplsoccer](https://github.com/andrewRowlinson/mplsoccer) (item 12) and [Torvaney/ggsoccer](https://github.com/Torvaney/ggsoccer) (item 13), whose standardiser between providers (landmark to landmark, with a variable pitch size) is the model for `convert(from, to)` and for the piecewise-linear `piecewise` mapper; the soccer providers are registered through `registerFrame` from `src/surfaces/soccer-providers.ts`.
  - The pull requests of sportsdataverse (sportsdataverse-py, fastRhockey, sdvplotR, wehoop-wnba-stats-data), MIT, which are where the HockeyTech and NBA conventions were read.
- **Not used:** [sportypy](https://github.com/sportsdataverse/sportypy), [sportyR](https://github.com/sportsdataverse/sportyR) and [hockey_rink](https://github.com/the-bucketless/hockey_rink) (items 9 and 11, GPL-3.0) for the frames: none of their code or data files was read or copied. [bdilday/GeomMLBStadiums](https://github.com/bdilday/GeomMLBStadiums) was not used for the MLBAM frame: the figures come from the pages named in sources.md.
- **Units:** the rulebook's own unit for each surface (`SURFACE_UNITS`) follows the sportypy and sportyR idea (item 9) that each surface keeps its rulebook's unit, written again from the rulebooks.

## The soccer pitch and its providers

- **What was read:** Law 1 of the IFAB Laws of the Game, the FIFA Futsal Laws, UEFA's Stadium Infrastructure Regulations, the MLS, NCAA and Premier League documents and the FA's, and each provider's own pages, all named in [sources.md](./sources.md#soccer): for facts only. No text, table or diagram of any is copied.
- **Ideas credited (MIT, so ideas freely and code with credit; we wrote our own):**
  - [Torvaney/ggsoccer](https://github.com/Torvaney/ggsoccer) (item 13): a pitch as a spec of a few numbers (the penalty box, the six-yard box, the spot, the goal, the origin and the way y runs), the providers as specs, `rescale_coordinates` from one to another landmark to landmark, and the goal styles (box, line, strip, none). Its comment on Wyscout's goal says the figure came from the provider's support, which the sources page repeats.
  - [andrewRowlinson/mplsoccer](https://github.com/andrewRowlinson/mplsoccer) (item 12): the pitch types as one page each, and the point that Opta, StatsBomb and Wyscout fix their lines' numbers while Tracab, Metrica, SkillCorner and Second Spectrum follow the pitch. Its `uefa` type is 105 by 68 in its code and 65 in its documentation text; UEFA's own regulations say 68.
  - [kloppy](https://github.com/PySport/kloppy) (BSD-3-Clause) and [floodlight](https://github.com/floodlight-sports/floodlight) (MIT), read for the origin, unit and direction of the providers whose own specifications are not public (Opta, Tracab, Second Spectrum), each said in the frame's `source`.
- **Not used:** sportypy, sportyR (GPL-3.0) and hockey_rink: none of their code or data was read or copied; the soccer figures come from the Laws and the pages above.
