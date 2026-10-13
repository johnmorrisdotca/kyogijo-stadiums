# Sources of the dimensions

Every number in `src/geometry.ts` (in feet; `src/units.ts` converts them to the unit each rulebook states) is a fact from a rule or a published figure. This file says where, and says
plainly where the figure is ours: a number the sources do not give, drawn as a reasonable reading, is marked **ours**.
No text, table or drawing of a source is copied.

## Football

| Figure | Value | Source |
| --- | --- | --- |
| NFL field | 360 by 160 feet with 30-foot end zones; 300 feet between the goal lines | NFL rulebook, Rule 1; Wikipedia, "American football field" |
| NFL hash marks | 70 feet 9 inches from each sideline (18 feet 6 inches apart, the goal posts' width) | NFL rulebook, Rule 1; Wikipedia, "American football field" |
| NFL numbers | every 10 yards, 6 feet tall, the bottom edge 12 yards from the sideline | Wikipedia, "American football field" |
| NFL and CFL goal posts | 18 feet 6 inches apart (inside to inside), the crossbar 10 feet high | NFL rulebook; CFL rulebook, "The Field" |
| NFL boundary | sidelines and end lines 6 feet wide | Wikipedia, "American football field" |
| Sideline ticks and hash marks | 2 feet long, at every yard inside the sidelines and at the hash-mark lines, in the field of play only | Wikipedia, "American football field"; IFAF Appendix D, notes 6 and 7 |
| CFL field | 150 by 65 yards: 110 yards between the goal lines, 20-yard end zones | CFL rulebook, "The Field" (cfldb.ca); Wikipedia, "Canadian football field" |
| CFL hash marks | 28 yards from each sideline in the current rulebook (24 yards in the 2015 edition) | cfldb.ca/rulebook/conduct-of-the-game/the-field and the 2015 edition |
| CFL goal posts | on the goal lines, 18 feet 6 inches apart | CFL rulebook |
| CFL centre | the 55-yard line, marked C | Wikipedia, "Canadian football field" |
| IFAF field | 360 by 160 feet (20 five-yard segments between two 10-yard end zones); hash marks 60 feet from each sideline, 2 feet long (60 to 58 feet); the top of each number 27 feet from the sideline, 6 by 4 feet; no yard lines in the end zones; goal posts on the end lines, 18 feet 6 inches apart | IFAF 2021 rules, Appendix D, "Field Diagrams", notes 2, 5, 6, 7, 8, 12 and 13 (http://www.myiafoa.org/rules/ifaf2021/FieldDiagrams.pdf) |

**Ours.** The CFL's numerals: the rulebook text read does not give their size or place, so they are drawn as the NFL's. CFL hash marks are drawn at every yard (Wikipedia) although the rulebook text names the 5-yard stripes. The IFAF's end zone is its usual 10 yards (the rules allow 7). The 6-foot NFL boundary band is drawn at its width; the others at about a foot. In a tall drawing the numbers' digits stand side by side on the screen, which is along the field's width.

The CFL is to change in 2027 (100 yards between the goal lines, 15-yard end zones, posts on the end line); a drawing without a `year` is of the field as it is now, and `year: 2027` draws the planned one (see [Surfaces through the years](#surfaces-through-the-years)).

## Hockey

| Figure | Value | Source |
| --- | --- | --- |
| NHL rink | 200 by 85 feet, corner radius 28 feet | NHL rulebook, Rule 1; Wikipedia, "Ice hockey rink" |
| Goal lines, blue lines | goal lines 11 feet and blue lines 75 feet from the end boards (50 feet apart) | Wikipedia, "Ice hockey rink" |
| Face-off circles | radius 15 feet; end-zone spots 20 feet from the goal line, 22 feet either side of the axis (44 feet apart); neutral-zone spots 5 feet from the blue lines; the centre circle blue, 30 feet across, its spot 12 inches | Wikipedia, "Ice hockey rink" |
| Crease | straight sides 4.5 feet from the goal line, 1 foot outside each post, and an arc of 6-foot radius; hash marks 4 feet from the goal line | Wikipedia, "Ice hockey rink" |
| Goal | 72 inches wide, 40 inches deep | Wikipedia, "Ice hockey rink" |
| Trapezoid | 22 feet at the goal line, 28 feet at the end boards (18 feet at the goal line from 2005-06 to 2013-14) | Wikipedia, "Ice hockey rink" (revision 1369579112) and "National Hockey League rules" (revision 1379666522) |
| Referee's crease | a semicircle of 10 feet in front of the scorer's bench | Wikipedia, "Ice hockey rink" |

**Ours.** The hash marks on the end-zone circles are drawn 2 feet long and 5 feet 11 inches apart, at the circle's sides, parallel to the end boards: the rule's wording was not read in full. The trapezoid's figures are read from the two Wikipedia articles above, not from the current rulebook (an earlier version of this package drew 18 feet at the goal line, the figure of 2005-06 to 2013-14; it was corrected to 22 feet, the figure since 2014-15). Line widths are drawn thicker than painted unless `exactLines` is set.

## Basketball

| Figure | Value | Source |
| --- | --- | --- |
| NBA court | 94 by 50 feet | NBA rulebook, Rule 1; Wikipedia, "Basketball court" |
| Free-throw line | 15 feet from the plane of the backboard, which is 4 feet from the baseline (19 feet) | NBA rulebook, Rule 1 |
| Three-point line | an arc of 23 feet 9 inches from the middle of the basket meeting parallel lines 3 feet from the sidelines (22 feet in the corners) | NBA rulebook, Rule 1 |
| Key | 16 feet wide | Wikipedia, "Key (basketball)" |
| Restricted area | a half-circle of 4 feet from the middle of the ring, then parallel to the lane to the backboard | NBA rulebook, Rule 1 |
| Marks | four sideline marks 28 feet from the baseline, extending 3 feet; lower-defensive-box marks 3 feet from the lane, 13 feet from the baseline, 6 inches long; substitution marks 4 feet either side of the midcourt line | NBA rulebook, Rule 1 |
| Centre circle | 12 feet across | Wikipedia, "Basketball court" |
| Basket | 63 inches from the baseline; the ring 18 inches inside, 10 feet high; the backboard 6 feet wide | NBA rulebook, Rule 1, and Section II |

**Ours.** The centre court's inner circle (2-foot radius) and the places of the lane space marks (7, 11, 14 and 17 feet from the baseline, the first drawn heavier as the block) are read from the court diagram, which was not available as text. The painted keys and the wood are style, not dimensions.

## Baseball

| Figure | Value | Source |
| --- | --- | --- |
| Bases | a 90-foot square, the diagonal 127 feet 3⅜ inches; bases 15 inches square | Official Baseball Rules, 2.01 and 2.02 |
| Pitcher's plate | 60 feet 6 inches from the back point of home plate | Official Baseball Rules, 2.01 |
| Mound | 18 feet across | Official Baseball Rules, 2.01 |
| Infield | the dirt cut by an arc of 95 feet round the pitcher's plate | Official Baseball Rules, 2.01 |
| Home plate | 17 inches wide, with sides of 8½ and 12 inches | Official Baseball Rules, 2.03 |
| Batter's boxes | 4 by 6 feet, 6 inches from the plate | Official Baseball Rules, 2.04 |
| Running lane | 3 feet wide, in foul ground, the last 45 feet to first base | Official Baseball Rules, 6.05 |
| Least fence | 325 feet at the foul lines, 400 at the middle (for new parks) | Official Baseball Rules, 2.01 |

**Ours.** The warning track (15 feet, the usual), the infield's grass diamond, the home and base circles of dirt and the mowing arcs are style. The bases, the plates and the mound are drawn larger than life unless `exactLines` is set. The fence of each park is a curve through its published distances: see [references.md](./references.md) for how the angles were chosen.

## Ballparks

The fence distances of the 30 current MLB parks, the 44 past ones and the 20 NPB parks are in `scripts/parks.data.json`, each with the article and revision it was read from. Each figure is a distance in feet (MLB) or metres (NPB) as the article gives it. The angle at which a distance is taken is not published and is **ours**: the foul-line figures are at 45 degrees either side of dead centre, the middle at 0, and a figure labelled left-center or right-center at 22.5 degrees unless a park has more than one, in which case they are spread between the line and the middle in the order the article lists them. A fence is a monotone cubic through the points, so it never goes beyond them.

The NPB parks of the past (Hiroshima Municipal Stadium, Korakuen, Osaka Stadium, Heiwadai, Kawasaki, Nagoya Stadium) are drawn with the figures of the article for the park as it was, as the Japanese article gives them (Korakuen and Kawasaki by their measured distances, not their announced ones).

The MLB parks of the past are read the same way, from the English article of each at the revision cited in [NOTICE.md](../NOTICE.md); where an article dates more than one fence (the Polo Grounds, Shibe Park, Huntington Avenue Grounds and others) each is kept as a period with its first and last season, and `year` picks one. A ground whose article gives no distances is not in `PARKS`; the list is in [references.md](./references.md).

## Surface units

`SURFACE_UNITS` (`src/units.ts`) is the unit each rulebook states its principal figures in. The drawing is made in feet and a figure is one conversion from the rulebook's own.

| Surface | Unit | Source |
| --- | --- | --- |
| NFL, CFL | yards | NFL rulebook, Rule 1 and CFL rulebook, "The Field": the lengths of the field and its end zones are in yards (the widths of the NFL's markings in feet and inches) |
| IFAF | yards (**ours**) | Appendix D gives its figures in feet (hash marks, numbers) and in five-yard segments; the field's length follows the football fields, so it is listed in yards |
| NHL, NBA | feet | NHL rulebook, Rule 1 and NBA rulebook, Rule 1 |
| Baseball | feet | Official Baseball Rules, 2.01 to 2.05 |
| NPB parks | metres | the Japanese Wikipedia article of each park gives 両翼, 中堅 and 左右中間 in metres; they are converted once, at 0.3048 metres to the international foot (3.280839895 feet to the metre), rounded to a tenth of a foot |

## Soccer

Every figure of `src/surfaces/soccer-spec.ts` is in metres, as the Laws give it (with yards beside). Each page was read on 2026-10-13.

| Figure | Value | Source |
| --- | --- | --- |
| Touchline and goal line | the touchline longer than the goal line; 90 to 120 m by 45 to 90 m (100 to 130 yards by 50 to 100) | IFAB Laws of the Game 2025/26, Law 1.3 (theifab.com/laws/2025-26/the-field-of-play/; the 2026/27 text at /laws/latest/ gives the same figures) |
| International matches | 100 to 110 m by 64 to 75 m (110 to 120 yards by 70 to 80) | Law 1.4 |
| Lines | at most 12 cm wide | Law 1.2 |
| Centre circle and arcs | the circle 9.15 m (10 yards) round the centre mark; the penalty arc 9.15 m from the penalty mark, outside the penalty area | Law 1.2, 1.6 |
| Goal area | lines 5.5 m (6 yards) from the inside of each post and 5.5 m into the field | Law 1.5 |
| Penalty area and mark | lines 16.5 m (18 yards) from the inside of each post and 16.5 m into the field; the mark 11 m (12 yards) from the midpoint of the posts | Law 1.6 |
| Corner arc and flags | a quarter circle of 1 m (1 yard); flagposts at least 1.5 m high | Law 1.7, 1.8 |
| Marks off the field | "9.15 m (10 yds) from the corner arc" | Law 1.2 |
| Goal | 7.32 m (8 yards) between the posts, 2.44 m (8 feet) from the ground to the crossbar | Law 1.10 |
| Premier League | 105 by 68 m unless the Board allows otherwise | The Premier League Handbook 2025/26, Section K, rule K.18 |
| UEFA | 105 by 68 m for stadium categories 3 and 4, 100 to 105 by 64 to 68 m for 1 and 2; the markings are the Laws' | UEFA Stadium Infrastructure Regulations, Article 5.01 and 5.02 (documents.uefa.com) |
| MLS | at least 70 yards wide and 110 yards long (the preset is that least size) | 2026 MLS Competition Guidelines, "Playing field dimensions and markings" (mlssoccer.com/about/competition-guidelines) |
| NCAA | length 115 to 120 yards, width 70 to 75 yards, best 120 by 75 | NCAA Men's and Women's Soccer Rules 2026 and 2027, Rule 1.1.1 (ncaa.org) |
| The FA's youth pitches | 5v5 40 by 30 yards, goals 12 by 6 feet; 7v7 60 by 40, 12 by 6 feet; 9v9 80 by 50, 16 by 7 feet | The FA Handbook 2025/26, Section 38, "Goalpost and pitch sizes and line marking" (recommended sizes) |
| The FA's small-sided markings | a centre circle of 3 m, a semicircle of 6 m round the middle of each goal line, the mark 6 m out, a corner arc of 25 cm | The FA, Small Sided Football Laws of the Game, Law 1 (revised 2012) |
| Futsal | the pitch 38 to 42 m by 20 to 25 m for international matches; the lines 8 cm; the centre circle 3 m; the penalty area a quarter circle of 6 m round each post, joined by a line of 3.16 m; the marks at 6 m and 10 m; the corner arc 25 cm; the substitution zone 5 m long and 5 m from the halfway line, closed by marks 80 cm long (40 cm on the pitch and 40 off); marks off the pitch 5 m from each corner arc, 5 cm from the end line, 40 cm long; the goal 3 m by 2 m | FIFA Futsal Laws of the Game 2025/26 (digitalhub.fifa.com), Law 1, sub-sections 2 to 9 |

**Ours.** The Laws do not give these; each is drawn as a reasonable reading.

- **The goal's net**: 2 m deep (1 m in futsal, 1.2 m on a small-sided pitch) and drawn from above with its posts as dots; the crossbar's height is not drawn.
- **The marks' sizes**: penalty and centre marks are drawn as discs larger than a painted mark (22 cm across), corner flags as a small triangle, and the lines thicker than painted unless `exactLines` is set.
- **The marks off the field**: read as 9.15 m from the arc's edge, so 10.15 m from the corner point (the arc's radius added); they are drawn 40 cm long. Futsal's, 5 m from the arc, are read the same way.
- **9-a-side**: the FA's table gives the pitch and the goal, and no text found on any FA page gives the 9v9 penalty area or circle. A box 11 m deep, the goal's width and 11 m either side, a mark at 9 m and a circle of 7.3 m are ours.
- **5- and 7-a-side**: the pitches are the FA's mini-soccer sizes, the markings those of its small-sided laws; the two documents are different games, and which a league uses is its own.
- **NWSL**: no official figure was found, so there is no preset.
- **Mown stripes and colours**: style, not dimensions. Nineteen bands (odd, so that both ends are alike) cut a 105 m pitch into 5.5 m, the depth of the goal area.

### Soccer coordinate frames

`src/surfaces/soccer-providers.ts` registers each provider as a frame. Where a provider's own page gives a figure it is that; where it does not (Opta's, Tracab's and Second Spectrum's specifications are not public), the figure is what the open-source libraries mplsoccer (MIT), ggsoccer (MIT), kloppy and floodlight agree on, which is said in each frame's `source`. No code of any of them is used.

| Frame | Read from | What it gives |
| --- | --- | --- |
| `opta` | not public. mplsoccer `soccer/dimensions.py` and ggsoccer `R/dimensions.R` agree on 17 and 28.9 (21.1 to 78.9), 5.8 and 13.2 (36.8 to 63.2), the mark at 11.5; kloppy and mplsoccer put the posts at 45.2 to 54.8, ggsoccer's goal is wider; the origin and y up are from kloppy and mplsoccer | 0 to 100 on both axes, the origin at the bottom left, y up, each team attacking left to right |
| `statsbomb` | StatsBomb Open Data Events v4.0.0, Appendix 2, "Locations" (github.com/statsbomb/open-data, doc/): the diagram marks (0, 0) top left, (120, 80) bottom right | yards; penalty area 18 yards, 18 to 62; goal area 6 yards, 30 to 50; mark 12 yards; posts 36 to 44 |
| `wyscout` | Wyscout Data Glossary, "Pitch coordinates" (dataglossary.wyscout.com/pitch_coordinates): the box, the goal area and the mark; the posts (44 to 56) are ggsoccer's | 0 to 100, y from the top; penalty area 16, 19 to 81; goal area 6, 37 to 63; mark 10 |
| `tracab` | not public: the origin, unit and direction are those of mplsoccer, kloppy and floodlight | centimetres from the centre spot, y up, the extents the pitch's own; the lines are the Laws' |
| `metrica` | Metrica Sports sample data README (github.com/metrica-sports/sample-data): 0 to 1, (0, 0) top left, (0.5, 0.5) the kick-off | the lines are the Laws' as a fraction of the pitch |
| `skillcorner` | SkillCorner open data README and field diagram (github.com/SkillCorner/opendata) | metres from the centre, y up, the extents the pitch's own |
| `secondspectrum` | not public: the same libraries | metres from the centre, y up |
| `impect` | Impect Glossary, context variables, "How is the pitch defined?" (glossary.impect.com/context-variable): x -52.5 to 52.5, y -34 to 34 with "Outside Left" at +34, the penalty area 36 and 47 for the goal area (from the centre), the mark at 41.5 | metres, y up; the lines are the Laws' |
| `uefa` | UEFA Stadium Infrastructure Regulations 5.01: 105 by 68 m; mplsoccer's `uefa_dims()` is 105 by 68 in its code, though its text says 65 | 0 to 105 by 0 to 68 metres from the bottom left, y up |
| `international` | IFAB Law 1; ggsoccer's `pitch_international` (105 by 68, "UEFA Category 4") | metres from the bottom left, y up, the pitch's own size |

**Ours.**

- **Opta's goal.** Three libraries give three goal widths (9.6, 11.6 and a post at 44.62). The frame uses 9.6 (45.2 to 54.8, mplsoccer and kloppy); a feed settles it.
- **Wyscout's posts** (6 either side) are ggsoccer's, which says its figures came from Wyscout's customer support; the glossary does not mark them.
- **The centre circle** is not a landmark: it is round, 9.15 m, at any pitch size.
- **A fixed frame on another pitch.** Opta's, StatsBomb's and Wyscout's figures are fractions of their own extents, so on a 100 by 64 m pitch a drawn penalty line lies at 17 per cent of 100 m. A frame whose numbers follow the pitch (Tracab, SkillCorner, Second Spectrum, Metrica, `international`) has the Laws' landmarks at the size it is given.
- **The directions** of Tracab's and Second Spectrum's y (up, from the centre) are the libraries'; check one known point against your data.

## Soccer grounds

The facts of the 64 grounds of `scripts/grounds.data.json` (listed in [grounds.md](./grounds.md)) are read from the English Wikipedia article of each ground at the revision named in [NOTICE.md](../NOTICE.md), and its name in Japanese from the Japanese article. They are facts (a length, a year, a name); no text, table or picture of an article is used. Each was read on 2026-10-13.

| Figure | Value | Source |
| --- | --- | --- |
| Pitch | the length and width the infobox gives for football, in the unit it gives them in (metres or yards), where they are a size for international matches (100 to 110 by 64 to 75 m) | the infobox (`dimensions`) of the ground's article; Law 1.4 for the range |
| Names | the names the infobox lists (`former_names`) with the years it dates them; the name of a World Cup (`Miami Stadium` in 2026) where it lists one | the infobox; the Japanese article for Nissan Stadium's naming rights (from 1 March 2005) |
| Years and capacity | the year it opened, the year it closed (`closed`, else `demolished`) and the first capacity the infobox gives | the infobox |
| Place | the city and the country, and the coordinates (P625), the country (P17) and the item itself | the article; Wikidata (CC0), checked by `scripts/check-grounds.mjs` |
| Tournaments | the grounds of the list a World Cup used, and where its final was played | the venue section of the tournament's article, at the revision in NOTICE.md |

**Ours.**

- **A size the article does not give is not guessed.** A ground whose infobox has no football figure (or only that of another sport: the Rose Bowl's American football field, Stadium Australia's oval) is drawn at the international 105 by 68 m and marked `pitchSize: "default"`.
- **A figure that cannot be a pitch for international matches is not used.** The infoboxes of the Stade de France (119 by 75 m) and of Kashima Soccer Stadium (115 by 78 m) give a size outside the 100 to 110 by 64 to 75 m of Law 1.4, and both held World Cup matches; each is listed at the default with the figure in its `pitchNote`. The build refuses a published size outside that range.
- **Where two names share a year,** the later name wins, and an entry further down the list overrides one above it. The infobox's years that meet (`Pro Player Stadium (1996-2005)`, `Dolphins Stadium (2005-2006)`) are kept as they are; the order resolves them.
- **The 1950 World Cup** had a final round and no final; the ground is listed for 1950 without a final.
- **The Parc des Princes** article's infobox dates the first stadium on the site (1897, pulled down in 1967); the present stadium is Paris Saint-Germain's home from 1974. It is listed with no opening year, at the default size, for 1938 and 1998.
- **Capacity** is the first figure of the infobox, which for a stadium of two sports is the first sport's. A capacity the infobox leaves to a template (Hampden Park, Celtic Park) or gives as a range (Wankdorf) is left out.
- **Names in the place's language** are the infobox's native name where it gives one, else the local Wikipedia's title (Wikidata's native label where the two agree).

## Coordinate frames

`src/frames.providers.ts` holds the frames of the providers below, as landmarks on the drawing's own coordinates (feet; x along the surface from its left end, y across it from the top, a ballpark's x across and y minus out from home plate). Only facts were read: ranges, units, origins and conventions. No code of sportypy, sportyR or hockey_rink (all GPL) was read for them; the MIT projects sdv-plot, sporty and mplsoccer are credited in [references.md](./references.md) for ideas. Each page below was read on 2026-10-13.

| Frame | Read from | What it gives |
| --- | --- | --- |
| `nhl-api` | puckapi.com, "get_plays" (`x_coord` "Rink x, -100..100 along the length", `y_coord` "Rink y, -42..42 across"); Carnegie Mellon Sports Analytics Conference 2021, An and Nguyen, "A Web Application for Manually Tracking Locational Event Data in Ice Hockey" (as quoted by a search result: "The center of the rink has coordinates (0,0)", x from -100 feet on the left to 100 feet on the right); Meghan Hall, "Shot locations" (Y "from mid-rink, -43 to 43", values in feet, goal line at 89 feet) | x -100 to 100 feet, y -42.5 to 42.5 feet (the rink's width halved), the origin at centre ice |
| `hockeytech` | sportsdataverse-py pull request 725, "raw pbp coordinates are 600x300 in every league" (a canvas "with a top-left origin", "centre ice is (300,150)", no value over 600 or 300; the PR's own conversion: 0..600 to -100..100 feet and 0..300 to 42.5..-42.5 feet); fastRhockey pull request 75 (HockeyTech data in a centre-origin feet frame) | a canvas of 600 by 300 with its top left at the rink's top left corner; the whole canvas is the rink |
| `nba-stats` | sdvplotR pull request 24, "NBA legacy shot coordinates" (tenths of a foot, the hoop at the origin, "negative x is the shooter's left corner", left corner threes at LOC_X -249 to -221, minimum LOC_Y -52 which puts the baseline at -52.5, basket 5.25 feet from the baseline); wehoop-wnba-stats-data pull request 20 (the origin is the basket and not the baseline, positive y towards half court, `hypot(x, y) / 10` matches the shot distance, NBA 2024-25 y from -39 to 835) | LOC_X across the court, negative at the shooter's left; LOC_Y along it from the hoop towards half court; both in tenths of a foot; every shot at the basket attacked, which is placed at the right basket |
| `nfl-tracking` | nfl-football-ops/Big-Data-Bowl, `schema.md` (x "along the long axis of the field, 0 - 120 yards", y "along the short axis of the field, 0 - 53.3 yards") | x counts the end zones (the goal lines at 10 and 110 yards), y spans the field's width |
| `mlbam` | Beanumber, "Analyzing Baseball Data with R", 3rd ed., Appendix C (`hc_x` and `hc_y` are "x location" and "y location of batted ball when it lands"; the spray angle is atan((hc_x - 125.42) / (198.27 - hc_y))); Baseball Savant, "Statcast Search CSV Documentation" (`hc_x`, `hc_y` "Hit coordinate X/Y of batted ball", no unit given); MLBAnalytic, "Build a Spray Chart from Statcast" (the origin is the top left of a pixel image; 125.42 and 198.27 are home plate's place; a unit is "roughly 2.5 feet", the ratio to `hit_distance_sc` clustering at 2.48); yasumorishima/baseball-field-viz README (the same transform with a scale of 2.5) | home plate at (125.42, 198.27), x growing to right field, y growing down the image |
| `retrosheet` | Retrosheet, "Hit Location Diagram" (retrosheet.org/location.htm and its diagram hitloc.jpg: the Project Scoresheet batted ball location codes, to scale for a park of 330 feet down each line and 405 to centre, outfield sectors about 50 feet deep, the infield sectors by the fielders' numbers) | the codes of the diagram, which `RETROSHEET_ZONES` places at the centre of each sector |

**Ours.** Where the sources read do not settle a convention, the frame carries the common one and says so in its `note`:

- **The NHL API's y.** The ranges and the centre-ice origin are read; the sign of y is not. Positive y is taken as the left of a team attacking right, drawn upward, as in the feet frame of the HockeyTech pull request. A shot at a known side of a known game settles it.
- **NFL tracking's origin.** The schema gives ranges and units, and refers to a figure for the origin. It is taken as the bottom left corner of the field diagram with y up. A play from a known side settles it.
- **MLBAM's scale.** 2.5 feet a unit is the common reading of a pixel frame that is not a survey (one analysis found 2.48 and warns that a ball near a foul line can fall on the wrong side); the extent of the image (0 to 250) is approximate.
- **NBA's LOC_X sign** (negative at the shooter's left) is one source's finding from the names of the zones; the shooter's left is drawn at the top of a surface drawn wide with the team attacking right.
- **The Retrosheet zone centres.** The diagram has no coordinates. The outfield zone centres use the depth of each ring (238, 290, 330 and 380 feet for S, none, D and XD) and the angle of each column (0, 16, 31 and 40.5 degrees either side of dead centre) measured off the picture; the infield and foul zones are read at their place on it. They are good to a few feet and are symmetrical by construction, which a test holds; the diagram is a drawing for scorers and not a survey.
- **Which end is attacked in a period.** Hockey changes ends every period, overtime included (Wikipedia, "Overtime (sports)", as a search result gave it); basketball changes baskets for the second half and an overtime period keeps those ends (NBA rulebook, Rule 5, as a search result gave it); football changes goals after the first and third quarters (the NFL rule as generally stated: the rulebook page was not read here and a search found nothing on it). A period no rule here settles is left to the caller.

## Surfaces through the years

`year` draws a surface as the rules marked it in a season (`rulesFor`, `src/eras.ts`). The changes are data, each with the season it began in, a sentence in English and in Japanese, and the sources that say so; `eraChanges(sport)` lists them and the README's table sums them up. Only facts were read: a figure, a season and what changed. No text, table or picture of a source is copied. Wikipedia (CC BY-SA 4.0) is cited by revision so that a figure can be checked. Every page below was read on 2026-10-13.

**How a year maps to a season.** A season is named by the year it starts in, so `1979` is the 1979-80 season of the NHL and the NBA; the NFL, the CFL and baseball play in one calendar year, and `1974` is the 1974 season. A change "from 1979" is in force for 1979 and every later season until another change. The data were last checked in the 2026 season (`ERA_CURRENT`), which is what a drawing without a `year` shows; a change announced for a later season is `planned` and is drawn only when that season is asked for.

| Id | Page | What was taken |
| --- | --- | --- |
| `wp-offside` | Wikipedia, "Offside (ice hockey)", revision 1366324643 ([Offside_(ice_hockey)](https://en.wikipedia.org/w/index.php?title=Offside_(ice_hockey)&oldid=1366324643)) | the two blue lines of 1928-29, the centre red line introduced in 1943-44 |
| `wp-rink` | Wikipedia, "Ice hockey rink", revision 1369579112 ([Ice_hockey_rink](https://en.wikipedia.org/w/index.php?title=Ice_hockey_rink&oldid=1369579112)) | the NHL's blue lines at 75 feet and goal lines at 11 feet; the trapezoid from 2005-06, 18 feet at the goal line, 22 feet from 2014-15 |
| `wp-nhl-rules` | Wikipedia, "National Hockey League rules", revision 1379666522 ([National_Hockey_League_rules](https://en.wikipedia.org/w/index.php?title=National_Hockey_League_rules&oldid=1379666522)) | the trapezoid since 2005-06, lengthened by 2 feet each side in 2014 |
| `csm-1998` | The Christian Science Monitor, 16 October 1998, "Sports 101" (<https://proof.csmonitor.com/1998/1016/101698.feat.feat.11.html>) | the goal line 'increased from 11 to 13 feet' for 1998-99, the neutral zone 54 feet and the offensive zones 73 |
| `nhl-records` | NHL Records (records.nhl.com), "Historical Rule Changes" (<https://records.nhl.com/history/historical-rule-changes>) | the 2005-06 package: goal lines 11 feet from the end boards, the neutral zone cut from 54 to 50 feet, the trapezoid (as a search result described the page, which is script-rendered; read together with the AHL's release) |
| `ahl-2005` | American Hockey League, "AHL announces rules package for 2005-06" (<https://theahl.com/news/ahl-announces-rules-package-for-2005-06>) | the AHL's goal lines at 11 feet and its blue lines moved 4 feet towards centre ice (50-foot neutral zone), the package the NHL adopted for 2005-06 |
| `wp-key` | Wikipedia, "Key (basketball)", revision 1377850804 ([Key_(basketball)](https://en.wikipedia.org/w/index.php?title=Key_(basketball)&oldid=1377850804)) | the lane 6 feet wide, 12 feet from 1951-52, 16 feet from 1964-65; the restricted area arc from 1997-98 |
| `wp-three-point` | Wikipedia, "Three-point field goal", revision 1372084496 ([Three-point_field_goal](https://en.wikipedia.org/w/index.php?title=Three-point_field_goal&oldid=1372084496)) | the NBA's three-point line from 1979-80, a uniform 22 feet for 1994-95 to 1996-97, 23 feet 9 inches again from 1997-98 |
| `wp-court` | Wikipedia, "Basketball court", revision 1376335874 ([Basketball_court](https://en.wikipedia.org/w/index.php?title=Basketball_court&oldid=1376335874)) | the three-point line of 1979-80 and its 22-foot years; the no-charge arc of 4 feet first in the NBA in 1997-98 |
| `deseret-1997` | Deseret News, 5 October 1997, "Will more paint on the floor lead to more points on the board?" (<https://www.deseret.com/1997/10/5/19338479/nba-tries-to-perk-up-offenses/>) | for 1997-98 the three-point line back to 23 feet 9 inches (22 in the corners) and a four-foot-radius no-charge half circle marked in the key |
| `wp-hash` | Wikipedia, "Hash mark (sports)", revision 1335201669 ([Hash_mark_(sports)](https://en.wikipedia.org/w/index.php?title=Hash_mark_(sports)&oldid=1335201669)) | the NFL's hash marks: none before 1933, 30 feet from the sideline in 1933, 45 in 1935, 60 in 1945, 70 feet 9 inches from 1972; the CFL's 24 yards, narrowed in 2022 |
| `wp-afield` | Wikipedia, "American football field", revision 1379828601 ([American_football_field](https://en.wikipedia.org/w/index.php?title=American_football_field&oldid=1379828601)) | the NFL's hash marks since 1972 and 1945-1971, the goal posts on the goal line until 1974 |
| `si-goalposts` | Sports Illustrated, 21 June 2017, "The History of NFL Goal Posts: Excitement And Danger" (<https://www.si.com/nfl/2017/06/21/history-nfl-goal-posts>) | posts on the goal line from 1920, at the back of the end zone from 1927, back on the goal line in 1933 until 1974; H-shaped until 1967, then the slingshot |
| `wp-canadian` | Wikipedia, "Canadian football", revision 1374069475 ([Canadian_football](https://en.wikipedia.org/w/index.php?title=Canadian_football&oldid=1374069475)) | the CFL's end zones 25 yards deep until 1986, 20 after; the 110-yard goal-line distance; the 2027 field of 100 yards, 15-yard end zones and posts on the end line |
| `cfl-2022` | Canadian Football League, 27 April 2022, "Building on our strengths: game changes put emphasis on big CFL field, exciting kick returns and high scoring" (<https://press.cfl.ca/building-on-our-strengths-game-changes-put-emphasis-on-big-cfl-field-exciting-kick-returns-and-high-scoring>) | hash marks 28 yards from each sideline instead of 24 (9 yards apart instead of 17); the field 110 yards by 65 with 20-yard end zones |
| `tsn-2026` | TSN, The Canadian Press, 13 April 2026, "Stampeders WR Philpot keeping an open mind about CFL's 2027 field changes" (<https://www.tsn.ca/cfl/article/stampeders-wr-philpot-keeping-an-open-mind-about-cfls-2027-field-changes/>) | for 2027 the field shortened by 10 yards (to 100), the end zones by 5 yards (to 15), the goal posts to the back of the end zones |
| `wp-baseball` | Wikipedia, "Baseball field", revision 1376335066 ([Baseball_field](https://en.wikipedia.org/w/index.php?title=Baseball_field&oldid=1376335066)) | the pitcher's box at 45 feet, 50 feet from 1881, its 1887 size, the plate at 60 feet 6 inches from 1893, the mound's height, the home plate through the years, the batter's boxes of 1874 and 1885 |

**Ours, and where the sources disagree.**

- **A marking no source covers keeps the nearest cited state.** The NHL's goal lines are cited from 1997 (11 feet) and the blue lines from 1998 (73 feet), so an earlier season draws them there and `rulesFor(...).gaps` names them. A gap is never listed among a season's `differences`. What was looked for and not found is in [references.md](./references.md#surfaces-through-the-years).
- **An approximate state.** The baseball pitcher's box is cited at 45 feet (the 1870s) and 50 feet (from 1881) but its size only from 1887 (4 by 5½ feet); the earlier boxes are drawn at the 1887 size and `approx` says so.
- **The mound is drawn with the plate.** The sources give a raised mound but not the year it came; from 1893 the pitcher's plate is set on it, so the dirt circle of the mound is drawn from 1893 and not before. The mound's height (15 inches from 1903 to 1968, 10 from 1969) is data only: a top view does not show it. The article also says "from 1893 to 1950" in another sentence; 1903 is the date it gives with the figure.
- **The home plate** is drawn from the shapes and places the article dates (round 1857 to 1867, a square 1868 to 1870, turned 1871 to 1899, the pentagon from 1900; centred on the foul lines' meeting 1861 to 1874, wholly behind it 1875 and 1876, in front of it from 1877). The dates are those of the National Association and the National League, which the article names; no other league's is claimed. The batter's boxes of 1885 are the National League's (the American Association followed in 1886).
- **The NFL's goal posts.** The slingshot is dated 1967 (Sports Illustrated: "up until 1967" they were an H); a search result said Wikipedia's article on the goal post has the shape "first seen in 1966", an article that was not read here. The NFL's hash marks before 1933 are none: a game of the 1932 playoffs used them once, and they were adopted for 1933. The one-yard sideline ticks, which the drawing keeps in every season, are not dated by any source read.
- **The CFL's hash marks** are cited at 24 yards for the 2015 edition of the rulebook and by Wikipedia's "formerly"; an earlier season draws them there too, and `gaps` says so. The 2027 field's middle is drawn as a 50, not a C: no source says how it will be marked.
- **The 2005-06 NHL package** is dated from NHL Records' "Historical Rule Changes", whose page is script-rendered and was not read directly: a search result's summary of it is what was read, together with the AHL's own release of the package the NHL adopted. The 2004-05 AHL season ran the goal lines at 11 feet already; the NHL's first season with them is 2005-06.

## Zone sets

The named zones that `zones` layers count into (`src/heat.zones.ts`). Each zone is a shape on the surface in the drawing's frame and a test of whether a point lies in it; the zones of a set do not overlap. Where a source names the zones and not their edges, the edges are ours, built on the surface's own markings (the figures above), and are said so here. The tests hold each definition to the points and the lines given below.

| Set | Definition | Source |
| --- | --- | --- |
| `soccer-positional` | Juego de posición: five lanes across, six bands along. The wings reach from the touchline to the edge of the penalty area, the half-spaces from there to the edge of the goal area, the centre is the width of the goal area. The bands run from the goal line to the penalty area's depth, half way from there to the halfway line, the halfway line, and the same on the other side. The lanes and the first band are measured on the pitch drawn (`soccerSpec`), so a 5-a-side pitch or a futsal court has its own. | The idea and the line positions follow the `juego_de_posicion` dimensions of mplsoccer (MIT; read for the definition, no code used), which cites Spielverlagerung, "[Juego de Posición: a short explanation](https://spielverlagerung.com/2014/11/26/juego-de-posicion-a-short-explanation/)" (2014-11-26). |
| `soccer-channels` | The five lanes of the positional zones, the length of the pitch. | As above. |
| `soccer-thirds` | The pitch cut in three equal parts along its length. | Common usage; the cut is equal. |
| `soccer-18` | Six equal bands along the pitch by three equal lanes across, numbered along the team's attack, a band at a time from the team's left. "The 18 zones" has no single authority; this is the equal grid of that count. | Ours. |
| `nba-shot` | At each end: restricted area, a disc of 4 feet round the hoop's centre (the restricted-area arc of Rule 1); in the paint (non-RA), the free-throw lane (16 feet wide, 19 feet from the baseline) outside the disc; left and right corner 3, beyond the straight 22-foot lines (the sidelines' 3-foot strips) up to where they meet the arc, 14.2 feet from the baseline; above the break 3, the rest of the half beyond the 23.75-foot arc; mid-range, inside the arc and outside the lane. A shot belongs to the basket whose half it is in; there is no backcourt zone. Left and right are the shooter's, facing the basket, as the `LOC_X` of the stats.nba.com shot chart is (negative at his left). | The zone names are those of stats.nba.com's shot chart (`SHOT_ZONE_BASIC` and `SHOT_ZONE_AREA`: Restricted Area, In The Paint (Non-RA), Mid-Range, Left Corner 3, Right Corner 3, Above the Break 3, Backcourt). The edges are the court's lines from the NBA's Rule 1 (the Basketball section above); stats.nba.com assigns a shot by its own coordinates, which we have not seen, so a shot on a line may fall in the neighbouring zone there. |
| `nhl-slot` | At each end, measured from the end boards and the rink's long axis: the inner slot is the corridor from the goal line (11 feet) to the line of the end-zone face-off spots (31 feet), 3 feet either side of the axis at the goal line (the goalposts) widening to 7 feet either side at the spots (the inner edges of the two face-off circles, 22 less 15 feet); the outer slot is the rectangle 7 feet either side from the spots to the tops of the circles (46 feet); behind the goal line is everything between the end boards and the goal line; the offensive zone is the rest up to the blue line (75 feet). | Ours, from the face-off circle (15-foot radius), the spots (22 feet from the axis, 20 feet from the goal line), the goal line and the net's 6 feet in the Hockey section above. The slot is not a marked area; no source fixes its edges. |
| `nhl-home-plate` | Home plate: from the goal line (11 feet) between the circles' inner edges (7 feet either side) to the line of the spots (31 feet), then in to a point on the axis at the tops of the circles (46 feet); outside home plate is the rest of the offensive zone. | Ours, on the same figures. Public hockey analytics call an area in front of the net a "home plate" or "high danger" and draw it differently (the descriptions of Natural Stat Trick's danger areas that were found disagree with each other), so no one definition is followed. |
| `baseball-spray` | Fair ground cut at 15 degrees either side of the line from home plate to centre field into three equal thirds (the foul lines are at 45); infield is within 95 feet of the pitcher's plate (the infield's dirt arc, Rule 2.01), outfield beyond. Pull is left field for a right-handed batter and right field for a left-handed one; `bats: "none"` calls the thirds left, centre and right field. Foul ground is in no zone. | Ours, on the figures of the Baseball section above. |
| `baseball-retrosheet` | Retrosheet's 68 hit-location sectors, as the cells of the nearest-centre partition of the field: a point belongs to the sector whose centre is nearest, the same rule as `zoneAt` in the frames. The centres are our reading of the diagram (see the Retrosheet frame above). | Retrosheet, "Hit Location Diagram" (https://www.retrosheet.org/location.htm). The cell edges are ours. |
| `football-pass` | Short: up to 15 yards past the line of scrimmage, a pass thrown behind it included; deep: more than 15. Left, middle and right across the field: middle is between the hash marks; left and right are the passer's, facing the way the offence attacks. The line of scrimmage is the layer's `los`. | The field names are nflverse's `pass_length` (short or deep) and `pass_location` (left, middle or right) in the [nflreadr play-by-play dictionary](https://nflreadr.nflverse.com/articles/dictionary_pbp.html). That dictionary does not give the edges (nflverse takes them from the play's text, not from air yards), so the 15 yards and the hash marks are ours. |

The colour ramps are Kyogijo's own: nine stops each, chosen by luminance and checked by a test against the surface colours and the ground a heat layer paints (see docs/layers.md); no palette of a plotting package is copied.
