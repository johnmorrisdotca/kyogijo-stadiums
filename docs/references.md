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

## Where the figures were read

- **NFL rulebook, Rule 1; CFL rulebook, "The Field"** ([cfldb.ca](https://cfldb.ca/rulebook/conduct-of-the-game/the-field/), and the [2015 edition](https://cfldb.ca/rulebook/2015/conduct-of-the-game/the-field/)); **NHL rulebook, Rule 1; NBA rulebook, Rule 1** ([official.nba.com](https://official.nba.com/rule-no-1-court-dimensions/)); **Official Baseball Rules**, 2.01 to 2.05. Dimensions are facts, cited in [sources.md](./sources.md).
- **Wikipedia, CC BY-SA 4.0**: "[American football field](https://en.wikipedia.org/wiki/American_football_field)", "[Canadian football field](https://en.wikipedia.org/wiki/Canadian_football_field)", "[Ice hockey rink](https://en.wikipedia.org/wiki/Ice_hockey_rink)", "[Basketball court](https://en.wikipedia.org/wiki/Basketball_court)", "[Key (basketball)](https://en.wikipedia.org/wiki/Key_(basketball))". Facts only; no text is copied.

## The ballparks

- **What:** the English and Japanese Wikipedia article of each of the 50 parks, at the revision named for each in [NOTICE.md](../NOTICE.md) and `scripts/parks.data.json`. Each gives the fence distances at the foul lines, the alleys and the middle: in feet for MLB, in metres (両翼, 中堅, 左右中間) for Japan.
- **Useful for:** each park's fence, drawn through its published distances; the names in English and Japanese; the teams.
- **May use:** the distances, which are facts. The articles are CC BY-SA 4.0 and none of their text, tables or pictures is used, so the share-alike condition does not reach the package; the articles are cited by revision so that the figures can be checked and credit is given.
- **How they were read:** a distance is taken as the article's label says (foul line, left-center, center) and placed at 45, 22.5 and 0 degrees from dead centre; where a park lists more than one figure between, they are spread in the order listed. This is our reading, since the articles give distances and not directions. Where an article has several periods (Kauffman Stadium's alleys changed for 2026) the current figure is used. Where the Japanese article gives announced and measured distances (Korakuen, Kawasaki) the measured are used. Japanese figures are in metres and converted once, at 3.280839895 feet to the metre.
- **Not used:** per-park equations from any source with no licence (item 3 above). [bdilday/GeomMLBStadiums](https://github.com/bdilday/GeomMLBStadiums) was looked at as a permissive source: its LICENSE file is only the two-line stub of an R package's MIT licence (year and holder), GitHub does not recognise a licence, and the outlines' own provenance is not stated, so nothing of it is used.
