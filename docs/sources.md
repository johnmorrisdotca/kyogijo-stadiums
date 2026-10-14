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
| Hash marks on the end-zone circles | two red lines at the outer edge of each side of each circle, parallel to the goal line, 2 inches wide and 2 feet long, 5 feet 7 inches apart (two marks a side, so 4 feet of line beyond the gap, 9 feet 7 inches in all) | NHL Official Rules 2025-26 and 2026-27, Rule 1.9 (the same words in 2024-25) |
| Crease | straight sides 4.5 feet from the goal line, 1 foot outside each post, and an arc of 6-foot radius; hash marks 4 feet from the goal line | Wikipedia, "Ice hockey rink" |
| Goal | 72 inches wide, 40 inches deep | Wikipedia, "Ice hockey rink" |
| Trapezoid | 22 feet at the goal line, 28 feet at the end boards (18 feet at the goal line from 2005-06 to 2013-14) | NHL Official Rules 2025-26 and 2026-27, Rule 1.8 and Rule 27.8 (see below); Wikipedia, "Ice hockey rink" (revision 1369579112) and "National Hockey League rules" (revision 1379666522) for the dates |
| Referee's crease | a semicircle of 10 feet in front of the scorer's bench | Wikipedia, "Ice hockey rink" |

**Rule 1.9, the hash marks.** The rule reads: "At the outer edge of both sides of each face-off circle and parallel to the goal line shall be marked two red lines, two inches (2'') wide and two feet (2') in length and five feet seven inches (5'7") apart." The lines run parallel to the goal line, so the 2 inches of width lie across the other way and add nothing to the distance between them: the 5 feet 7 inches is the gap between the near ends of the two marks on one side of a circle, and each mark runs 2 feet out from it. That is what is drawn (`NHL.hashApart`); an earlier version of this package drew 5 feet 11 inches, adding the lines' width to a gap it does not enter. The rule does not say which end of a line "apart" is taken from; the gap between the near ends is the plain reading, and CBS Sports, "NHL adopts modification to face-off circle hash marks for 2014-15" (6 October 2014, <https://www.cbssports.com/nhl/news/nhl-adopts-modification-to-face-off-circle-hash-marks-for-2014-15>) says the NHL moved the marks from 3 feet apart to 5 feet 7 inches, "more in line with" international ice. The 2014-15 move is drawn as a change (`nhl.hashApart.2014`): the marks stood 3 feet apart before it, as the 2012-13 rulebook (Rule 1.9: "three feet (3') apart", read in the NHL's PDF) and the joint NHL and NHLPA release of 6 October 2014 both say, and 5 feet 7 inches from 2014-15. The 3 feet is cited from the 2012-13 rulebook, the earliest read, so seasons before 2012-13 are a gap in `rulesFor("nhl", year).gaps` and are drawn at 3 feet; the AHL, ECHL, OHL, WHL and PWHL have no dated history for their marks and keep 5 feet 7 inches in every season.

**Rule 1.8 and Rule 27.8, the trapezoid.** The NHL Official Rules of 2024-25, 2025-26 and 2026-27 all print both, and they disagree. Rule 1.8, Goalkeeper's Restricted Area: "Seven feet (7') outside of each goal crease (eight feet (8') from each goal post), a two-inch (2") red line shall be painted extending from the goal line to a point on the end of the rink ten feet (10') from the goal crease (eleven feet (11') from the goal post)". With the posts 6 feet apart inside (Rule 2.1) that is 6 + 2 x 8 = 22 feet at the goal line and 6 + 2 x 11 = 28 feet at the boards. Rule 27.8, Restricted Area: "lines that begin six feet (6') from either goal post and extend diagonally to points twenty-eight feet (28') apart at the end boards", which makes 6 + 2 x 6 = 18 feet at the goal line, the figure of 2005-06 to 2013-14 (the 2014 widening moved each line 2 feet out). Rule 27.8 is the penalty rule, and its 18 feet is the old figure; the painted line is Rule 1.8's, and the package draws 22 feet, the figure of Rule 1.8 and of the 2014-15 widening. The rule texts were read in the books at <https://media.nhl.com/site/asset/public/ext/2025-26/2025-26Rules.pdf>, <https://media.nhl.com/site/asset/public/ext/2024-25/2024-25Rules.pdf> and <https://media.nhl.com/site/asset/public/ext/2026-27/2026-27Rules.pdf>; the diagrams on their pages iv and v were not read. The PWHL's Rule 27.8 says it applies no restricted area.

**Ours.** The trapezoid's dates (18 feet from 2005-06, 22 from 2014-15) are read from the two Wikipedia articles above. Line widths are drawn thicker than painted unless `exactLines` is set.

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
| Bases | a 90-foot square, the diagonal 127 feet 3⅜ inches | Official Baseball Rules, 2.01 |
| Base size | first, second and third bases 18 inches square from the 2023 season (15 inches before), not less than 3 nor more than 5 inches thick | Official Baseball Rules, 2.03 (the 2024 edition reads "The bags shall be 18 inches square"); MLB, 9 September 2022 |
| Pitcher's plate | 60 feet 6 inches from the back point of home plate | Official Baseball Rules, 2.01 |
| Mound | 18 feet across | Official Baseball Rules, 2.01 |
| Infield | the dirt cut by an arc of 95 feet round the pitcher's plate | Official Baseball Rules, 2.01 |
| Home plate | 17 inches wide, with sides of 8½ and 12 inches | Official Baseball Rules, 2.02 (Home Base; 2.03 is The Bases; checked in the 2024 edition) |
| Batter's boxes | 4 by 6 feet, 6 inches from the plate | Official Baseball Rules, 2.04 |
| Running lane | 3 feet wide, in foul ground, the last 45 feet to first base | Official Baseball Rules, 6.05 |
| Least fence | 325 feet at the foul lines, 400 at the middle (for new parks) | Official Baseball Rules, 2.01 |

**Ours.** The warning track (15 feet, the usual), the infield's grass diamond, the home and base circles of dirt and the mowing arcs are style. The bases, the plates and the mound are drawn larger than life unless `exactLines` is set. The fence of each park is a curve through its published distances: see [references.md](./references.md) for how the angles were chosen.

## Ballparks

The fence distances of the 30 current MLB parks, the 44 past ones and the 20 NPB parks are in `scripts/parks.data.json`, each with the article and revision it was read from. Each figure is a distance in feet (MLB) or metres (NPB) as the article gives it. The angle at which a distance is taken is not published and is **ours**: the foul-line figures are at 45 degrees either side of dead centre, the middle at 0, and a figure labelled left-center or right-center at 22.5 degrees unless a park has more than one, in which case they are spread between the line and the middle in the order the article lists them. A fence is a monotone cubic through the points, so it never goes beyond them.

The NPB parks of the past (Hiroshima Municipal Stadium, Korakuen, Osaka Stadium, Heiwadai, Kawasaki, Nagoya Stadium) are drawn with the figures of the article for the park as it was, as the Japanese article gives them (Korakuen and Kawasaki by their measured distances, not their announced ones).

The MLB parks of the past are read the same way, from the English article of each at the revision cited in [NOTICE.md](../NOTICE.md); where an article dates more than one fence (the Polo Grounds, Shibe Park, Huntington Avenue Grounds and others) each is kept as a period with its first and last season, and `year` picks one. A ground whose article gives no distances is not in `PARKS`; the list is in [references.md](./references.md).

## Curling

| Figure | Value | Source |
| --- | --- | --- |
| Sheet length | at least 45.720 m (150 ft); 44.501 m (146 ft) "if the size of an existing facility will not permit"; drawn at 150 ft. Curling Canada: 146 to 150 ft, "recommended" | World Curling, *The Rules of Curling and Rules of Competition*, 1 September 2026, R1(a); Curling Canada, *Rules of Curling for General Play*, September 2022 to August 2026, Rule 3(1) |
| Sheet width | at most 4.750 m (15 ft 7 in), at least 4.420 m (14 ft 6 in) in an existing facility; drawn at 15 ft 7 in. Curling Canada: 14 ft 2 in (4.318 m) to 15 ft 7 in | R1(a); Rule 3(1) |
| Tee line | centre 17.375 m (57 ft) from the middle of the sheet; Curling Canada: 114 ft (34.747 m) from tee to tee, 16 ft from the backboard on a 146-ft sheet and 18 ft on a 150-ft sheet | R1(b)I; Rule 3(3)(a) |
| Back line | outside edge 1.829 m (6 ft) from the centre of the tee line; "a tangent with the outer edge of the 12-foot circle" | R1(b)II; Rule 3(3)(b) |
| Hog line | 102 mm (4 in) wide, the inside (circle side) edge 6.401 m (21 ft) from the centre of the tee line | R1(b)III; Rule 3(3)(c) |
| Centre line | joins the tee lines and extends 3.658 m (12 ft) beyond each tee | R1(b)IV; Rule 3(2) |
| Tee, back and centre lines | at most 13 mm (1/2 in) wide | R1(b); Rule 3(2) and 3(3) |
| Circles | radii 1.829 m, 1.219 m and 610 mm (6, 4 and 2 ft) and an innermost circle of at least 152 mm (6 in); the tee and centre lines may be omitted from the button | R1(d); Rule 3(4) |
| Hacks | World Curling: two, the inside edge of each 76 mm (3 in) from the midpoint of the centre line, at most 152 mm (6 in) wide, at most 203 mm (8 in) in front of the hack line. Curling Canada: back edge 12 ft from the tee, inside edge at most 3 in from the centre line, at most 8 in long (its width is not printed: 6 in is drawn, as World Curling's) | R1(e); Rule 3(6) |
| Hack line | 457 mm (1 ft 6 in) long, at each end of the centre line (World Curling only) | R1(b)V |
| Courtesy lines | 152 mm (6 in) long, 1.219 m (4 ft) outside and parallel to the hog lines, on each side of the sheet (World Curling only) | R1(b)VI |
| Free guard zone | the area between the tee line and the hog line at the playing end, excluding the house; a stone biting the tee line outside the house is not in it (Curling Canada) | R6(a); Rule 12(1) |
| A stone | a circumference of at most 914 mm (36 in); drawn at 36 in, 11.46 in across | R2(a); Rule 4(2) |
| A stone that is out of play | one that touches a sideline or a divider; one that does not come to rest completely beyond the inside edge of the hog line; one that completely crosses the outside edge of the back line | R2(f) to (h); Rule 13(1), (4) to (6) |
| A stone that scores | World Curling: "each of its own stones located in or touching the house that are closer to the tee than any stone of the opposition". Curling Canada: "each stone, any part of which is within six feet of the tee, is eligible", one point for each that is closer to the tee than any of the opposing team's | R12(b); Rule 13(9) and (10) |
| Stones as near as each other | "considered equal": if the measure decides which team scores, the end is blanked; if it decides more points, only the stones closer count | R12(f); Rule 13(12) |
| The hammer | "the stone that will be the last stone delivered in that end"; the team that did not score has it in the next end, and a blank end leaves it where it was | World Curling, definitions and R5(a): the team that most recently scored delivers first, so the other has the last stone; Curling Canada, Rule 5(3) |
| Ends | 10 scheduled (8 in mixed doubles and mixed), and extra ends to break a tie | R12(a), R16(g) and R17 for mixed doubles; Rules of Competition C5 |

**Ours.** The stone's drawn size (a circle of 36 inches, the most the rules allow), the colours of the house (blue 12-foot band, white 8-foot band, red 4-foot band, white button, which neither book prints), the colour of the hog line, the place of the board, and the width of Curling Canada's hacks. The sheet's apron is not set by the rules. Both books print metres and feet; the feet are used to draw, and `wcf`'s figures are kept in the metres it prints first (so `45.72` and `4.75` m, which are 150 ft and 15.583 ft to the thousandth of a foot, and a tee line 17.375 m from the middle, which is 57.003 ft against Curling Canada's 57). The books say nothing of the colour of a stone's handle; red and yellow are the usual.

## The net sports

Tennis, volleyball and beach volleyball, badminton, pickleball and table tennis ([the page](./courts.md)). Each rulebook's figures are in `src/leagues/courts.ts` in the unit it prints first and are held by `src/courts.test.ts`, one test for each rule below. A court is measured, as each book measures it, to the outside edge of its lines. The documents, with the edition and the address read on 2026-10-13, are in `LEAGUE_SOURCES` (`itf-rules`, `fivb-volleyball`, `fivb-beach`, `bwf-laws`, `usap-rulebook`, `ittf-laws`).

### Tennis

*Rules of Tennis*, International Tennis Federation, 2026. The ITF's own server refused an automated download, so the text was read in Tennis Canada's *Rules of the Court 2026* (https://assets.tenniscanada.com/production/Rules-of-the-Court-2026.pdf), which prints the ITF's rules in full with its own notes marked "TC Note"; only the ITF's text was used.

| Figure | Value | Source |
| --- | --- | --- |
| The court | a rectangle 78 ft (23.77 m) long, 27 ft (8.23 m) wide for singles and 36 ft (10.97 m) for doubles | Rule 1 |
| The net | 3 ft 6 in (1.07 m) at the posts, 3 ft (0.914 m) at the centre, held down by a strap | Rule 1 |
| The net posts | for doubles, their centres 3 ft (0.914 m) outside the doubles court; at most 6 in square or round | Rule 1 |
| Singles sticks | with a doubles net used for singles, their centres 3 ft outside the singles court, at most 3 in square or round; Appendix X: 16 ft 6 in from the middle of the net, the posts 21 ft | Rule 1; Appendix X |
| The service lines | between the singles sidelines, 21 ft (6.40 m) from the net; the centre service line half way between the singles sidelines | Rule 1 |
| The centre mark | 4 in (10 cm) long, inside the court, 2 in (5 cm) wide; the centre service line 2 in wide | Rule 1 |
| The other lines | 1 to 2 in (2.5 to 5 cm) wide, the baselines up to 4 in (10 cm); all court measurements to the outside of the lines | Rule 1 |
| The ground round the court | as a guide for international competitions at least 21 ft (6.40 m) behind the baselines and 12 ft (3.66 m) beside the sidelines; for recreational and club play 18 ft (5.48 m) and 10 ft (3.05 m) | Appendix X, the note at its foot |
| The score | a game: love, 15, 30, 40, deuce and advantage; a tie-break game to seven points with a margin of two; a set to six games with a margin of two, or a tie-break at six all; a match the best of 3 or 5 sets | Rules 5, 6 and 7 |
| ATP and WTA | "the rules and regulations followed by the International Tennis Federation (ITF), the WTA Tour, and the ATP Tour" | the foreword of the Tennis Canada book that prints the rules |

**Ours.** The colours of the four looks. The service line's place: the rule measures to the outside of the lines and the figure is taken to the edge nearer the baseline, so the service box is 21 ft deep to the outer edge of its line. The centre mark is drawn from the inside edge of the baseline. The lines are drawn 2 in wide, the greatest of the rule's 1 to 2 in. The sizes of the net's line, and of the singles sticks' and posts' marks (the posts at the greatest 6 in, the sticks 3 in). Rule 1's courts for 10-and-under play (Appendix VIII) are not drawn.

### Volleyball and beach volleyball

*Official Volleyball Rules 2025-2028* and *Official Beach Volleyball Rules 2025-2028*, FIVB, approved by the 39th FIVB World Congress 2024 and in force from 1 January 2025.

| Figure | Value | Source |
| --- | --- | --- |
| The indoor court | 18 by 9 m, a free zone of at least 3 m on all sides; for FIVB, World and Official Competitions 5 m beside the side lines and 6.5 m behind the end lines | Rule 1.1 |
| The lines | all 5 cm wide; boundary lines drawn inside the dimensions of the court | Rules 1.3.1, 1.3.2 |
| The centre line | its axis divides the court into two of 9 by 9 m, and it runs beneath the net from side line to side line | Rule 1.3.3 |
| The attack line | the rear edge 3 m from the axis of the centre line; for FIVB, World and Official Competitions extended by five 15 cm lines 5 cm wide, 20 cm from each other, to a total length of 1.75 m | Rule 1.3.4 |
| The front zone | between the axis of the centre line and the rear edge of the attack line, and beyond the side lines to the end of the free zone | Rule 1.4.1 |
| The service zone | 9 m wide behind each end line, limited by two 15 cm lines 20 cm behind the end line as extensions of the side lines | Rule 1.4.2 |
| The net | 1 m (± 3 cm) wide, 9.50 to 10 m long with 25 to 50 cm on each side of the side bands; the top 2.43 m for men and 2.24 m for women | Rules 2.1.1, 2.2 |
| The side bands and antennae | the side bands 5 cm wide and 1 m long directly above each side line; an antenna 1.80 m long and 10 mm across at the outer edge of each side band, the top 80 cm above the net | Rules 2.3, 2.4 |
| The posts | 0.50 to 1.00 m outside the side lines, 2.55 m high; for FIVB, World and Official Competitions 1 m | Rule 2.5.1 |
| The beach court | 16 by 8 m, a free zone of at least 3 m (at least 5 m and at most 6 m for the FIVB's competitions); lines 5 cm wide, inside the dimensions, no centre line; the service zone 8 m wide | Beach Rules 1.1.1, 1.1.2, 1.3.1, 1.3.2, 1.4.1 |
| The beach net | 8.5 m long and 1 m wide (an 8.0 m net may be used in FIVB competitions), the same heights; side bands and antennae as indoors; the posts 0.70 to 1.00 m outside the side lines, 1 m for the FIVB's competitions | Beach Rules 2.1.1, 2.2 to 2.5.1 |
| The score | a set to 25 with a lead of two, the deciding fifth to 15; beach: a set to 21, the deciding third to 15 | Rules 6.2, 6.3; Beach Rules 6.2, 6.3 |

**Ours.** The colours; the front zone is painted a little apart from the back (Rule 1.2.2 allows a court of two colours for the front and back zones); the marks for the posts and antennae (the rules give a post no diameter and an antenna a diameter of 10 mm, too small to see at the scale of a court, so a mark of a least size is drawn at the figure's place). `official` draws the FIVB competitions' figures (the 5 m and 6.5 m free zone, the extension of the attack line, the posts 1 m out) and `least` the rules' least (3 m, no extension, the posts 0.5 m out, or 0.7 m on the beach). The net drawn is the 10 m one indoors and the 8.5 m one on the beach (the 8.0 m net the beach rules allow in FIVB competitions is not drawn). The NCAA's and USA Volleyball's own rule books were not read.

### Badminton

*Laws of Badminton*, Badminton World Federation, as amended and adopted by the BWF on 26 April 2025 (https://worldbadminton.com/laws/rules_2025.htm). The BWF's page says the 2026 amendments take effect on 4 January 2027 and that the 2025 Laws apply until then; the amended Laws could not be read (the page that should hold them answered "Not Found"), and Law 1 was not among the changes the page names. The figures of Diagram A are read from its picture (https://worldbadminton.com/laws/images/courtDiagram.png), in millimetres.

| Figure | Value | Source |
| --- | --- | --- |
| The court | a rectangle marked with lines 40 mm wide; 13 400 by 6 100 mm overall | Law 1.1; Diagram A |
| The lines | the lines easily distinguishable and preferably white or yellow; all the lines part of the area they define | Laws 1.2, 1.3 |
| The singles side lines | 40 + 420 mm inside the doubles side lines (so the singles court is 5 180 mm wide outside to outside) | Diagram A |
| The doubles long service lines | 40 + 720 mm inside the back boundary lines | Diagram A |
| The short service lines | 1 980 mm from the net (to the line's edge nearer the net) | Diagram A |
| The centre lines | from each short service line to the back boundary line, dividing the right and left service courts | Diagram A |
| The posts | 1.55 m high from the surface, on the doubles side lines whether singles or doubles is played, not extending into the court beyond the side lines | Laws 1.4, 1.5 |
| The net | 760 mm deep, at least 6.1 m wide; the top 1.524 m at the centre and 1.55 m over the side lines | Laws 1.7, 1.10 |
| The score | a match the best of three games; a game to 21, at 20-all a two-point lead, at 29-all the 30th point | Laws 7.1, 7.2, 7.4, 7.5 |

**Ours.** The colours; the sizes of the posts' marks; the figures of the net's depth and height are held and not drawn (a plan view). The BWF's Laws give no figure for the ground round the court, so none is drawn.

### Pickleball

*USA Pickleball Official Rulebook*, 2026, Section 3 Court and Equipment, as hosted by Pickleball Canada (https://pickleballcanada.org/wp-content/uploads/2026/03/2026-Official-Rulebook-EN.pdf).

| Figure | Value | Source |
| --- | --- | --- |
| The court | a rectangle 20 ft (6.10 m) wide and 44 ft (13.41 m) long for singles and doubles; measured to the outside edge of the perimeter and non-volley zone lines | Rules 3.A.1, 3.A.2 |
| The playing surface | at least 30 by 60 ft (9.14 by 18.29 m); recommended 34 by 64 ft (10.36 by 19.5 m) for new construction and tournament play | Rule 3.A.3 |
| The non-volley zone | 7 ft (2.13 m) from the net on each side, between the two sidelines; its lines are part of it | Rule 3.A.4.c |
| The centerline | down the middle of each end, from the non-volley zone line to the baseline | Rule 3.A.4.d |
| The lines | 2 in (5.08 cm) wide, one colour contrasting with the surface | Rule 3.A.4.e |
| The posts | 22 ft +/- 1 in (6.71 m) from the inside of one to the inside of the other, at most 3 in (7.62 cm) across | Rule 3.B.2 |
| The net | at least 21 ft 9 in (6.63 m) long, at least 30 in high; 36 in +/- 0.25 at the outer edge of the sidelines and 34 in +/- 0.25 at the centre | Rules 3.B.3, 3.B.6, 3.B.7 |
| The score | games to 11, 15 or 21; a match one game, best of 3 or best of 5 | Rule 15.C |

**Ours.** The colours; the non-volley zone is painted a little apart from the rest of the court; the posts are drawn 1 ft outside each sideline (22 ft apart, inside to inside, less the court's 20 ft, halved) at their greatest diameter of 3 in.

### Table tennis

*Laws of Table Tennis*, International Table Tennis Federation, 2026 statutes, as reproduced by Table Tennis England in *The Laws of Table Tennis*, issue 1, July 2026 (https://www.tabletennisengland.co.uk/content/uploads/2026/07/Laws-of-Table-Tennis-2026-27.pdf). The ITTF Handbook itself was not read.

| Figure | Value | Source |
| --- | --- | --- |
| The table | the playing surface 2.74 m long, 1.525 m wide, in a horizontal plane 76 cm above the floor | Law 2.1.1 |
| The lines | a white side line 2 cm wide along each 2.74 m edge and a white end line 2 cm wide along each 1.525 m edge; for doubles a white centre line 3 mm wide, parallel with the side lines | Laws 2.1.4, 2.1.6 |
| The net | divides the surface into two equal courts, parallel with the end lines; its top 15.25 cm above the playing surface | Laws 2.1.5, 2.2.3 |
| The posts | 15.25 cm high, the outside limits of each 15.25 cm outside the side line | Law 2.2.2 |
| The score | a game to 11 points unless both reach 10; a match the best of any odd number of games | Laws 2.11.1, 2.12.1 |

**Ours.** The colours; the post's width (a mark of a least size). The playing area round a table is in the ITTF's regulations, not in the Laws, and was not read: no free zone is drawn.

## The field sports

Lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey and handball ([the page](./field-sports.md)). Each rulebook's figures are in `src/leagues/` (`lacrosse.ts`, `rugby.ts`, `aussie.ts`, `gaelic.ts`, `cricket.ts`, `fieldhockey.ts`, `handball.ts`) in the unit it prints first and are held by one test file a sport (`src/rugby.test.ts` and the rest), a test for each rule below. The documents, with the edition and the address read on 2026-10-13, are in `LEAGUE_SOURCES`. Each was read as text from the governing body's own PDF; where a figure is only on a diagram it was read off the diagram and the table says so. Where a book gives a range, the range is kept (`Span` in `src/leagues/fields.ts`) and the size drawn is the greatest unless this says another. The lines of each sport are placed as its rulebook measures them (to the outside edge, to the inside edge or to the centre of a line, where it says), and a line's drawn width is a little more than its true width unless `exactLines` is set.

### Rugby union

*Laws of the Game, Rugby Union*, Law 1 "The ground", World Rugby, 2026 (the book's own label: "Laws of the game Rugby Union, incorporating the playing charter, 2026"; it prints no date of effect), <https://passport.world.rugby/media/jxrnmptk/2026en-laws-of-the-game-compressed.pdf>, pages 26 to 28.

| Figure | Value | Source |
| --- | --- | --- |
| The field of play | at most 100 m and at least 94 m between the try lines; at most 70 m and at least 68 m wide | Law 1.3, the dimensions table |
| An in-goal | at most 22 m and at least 6 m deep | Law 1.3, the table |
| The playing area | rectangular | Law 1.3 a |
| A shorter or narrower field | "the distance between the 10-metre lines and 22-metre lines is reduced accordingly", and the 15-metre lines' when the width is less than 70 m | Law 1.3 c and d |
| Solid lines | the dead-ball lines and touch-in-goal lines, the try lines, the 22-metre lines, the half-way line, the touchlines | Law 1.4 |
| Dash lines | each dash 5 m: 5 m from and parallel to each touchline; 15 m from each touchline; 10 m from each side of the half-way line; 5 m from each try line | Law 1.5 |
| The half-way mark | one line 0.5 m long that intersects the centre of the half-way line | Law 1.6 |
| The 22 | 22 m from the try line; the 10-metre lines 10 m from the half-way line; the 5 m and 15 m lines from the touchlines | the ground diagram, page 26 |
| The goal posts | 5.6 m apart, "3m to top edge of bar", a minimum height of 3.4 m, on the try line | the goal posts diagram, page 28 |
| The flag posts | 14, each at least 1.2 m high: one at each intersection of the touch-in-goal lines and the try lines and of the touch-in-goal lines and the dead-ball lines (8), and one in line with the 22-metre line and the half-way line on each side, 2 m outside the touchlines (6) | Law 1.8 to 1.10 |

**Ours.** The width of the lines: Law 1 prints none, and 0.1 m is drawn. The depth of the in-goal drawn, 10 m, which is inside the Law's range of 6 to 22 m. Where the dashes stand along each dash line (a first dash from the 5 m line to 10 m, then one centred on each 22-metre line, 10-metre line and the half-way line, then one ending 5 m from the far try line; across the field at 5 m from the try lines dashes centred 5 m either side of the middle and on the 5 m and 15 m lines, and at the 10-metre lines also on the middle and 10 m either side): the Law gives the length of a dash and the lines they lie on, and the places are read off the ground diagram. How much a shorter field's lines are reduced: proportionally. The technical zones of the diagram (10 m by 3 m, 2 m from the touchline) are not drawn: their place along the touchline is not labelled.

### Rugby league

*Rugby League Laws of the Game, International Level, with Notes on the Laws and NRL Telstra Premiership Interpretations*, NRL, 2023 edition (April 2023), Section 1 "The Playing Field" and Section 18 "Ground Markings and Dimension Guidelines", <https://Nrl.Com/siteassets/operations/the-game/nrl-international-rules-book-2023.pdf>. *The International Laws of the Game and Notes on the Laws*, International Rugby League, 2024 (the cover's year), Section 1 and its plan, <https://intrl.sport/uploads/docs/international-rugby-league-laws-of-the-game-2022%20%283%29.pdf>.

| Figure | Value | Source |
| --- | --- | --- |
| The NRL's field | field width 68 m; length 100 m from goal line to goal line; in-goal areas 68 by 8 m; goal posts 16 m high and 5.5 m wide | NRL Section 18 |
| The NRL's lines | unbroken lines, 15 cm wide and white, at 10 m, 20 m, 30 m, the half-way line, the try line, the dead-ball line and the touchline; "an unbroken red line shall be used for each of the two 20 meter and 40 metre lines"; 15 cm wide | NRL Section 18 (a), Section 1 note 6 |
| The NRL's scrum lines | marked 10 m and 20 m in from the touchline, 10 cm wide and white | NRL Section 18 (d) |
| The IRL's field | 100 m between the goal lines, 68 m wide, in-goal 6 to 11 m, a line across at every 10 m (10, 20, 30, 40 from each goal line, the half-way line at 50), the goal posts 5.50 m apart and 16 m high, the crossbar "3m" | IRL Section 1, the plan |
| Transverse lines | "must be marked across the full width of the field" | IRL Section 1 note 5, NRL Section 1 note 5 |

**Ours.** The IRL's in-goal drawn at 8 m (the NRL's, inside its range of 6 to 11 m); its line width and colours, which its book does not print: the NRL's 15 cm, white. The scrum lines' dashes: the notes say the broken lines "shall consist of marks or dots on the ground not more than 2 metres apart", so 1 m marks and 1 m gaps are drawn. The NRL's media line (1.5 m from each touchline, 10 cm, red) is not drawn: no length is given. The plan's other broken lines and the numbers on the field are not drawn.

### Australian football

*Laws of Australian Football*, Law 3 "Playing Surface and Posts" and its Diagram 1, AFL, 2026, <https://play.afl/sites/default/files/2026-02/Laws%20of%20Australian%20Football%202026.pdf>, pages 18 to 20.

| Figure | Value | Source |
| --- | --- | --- |
| The Playing Surface | oval in shape, between 135 and 185 m in length and between 110 and 155 m in width; the field of play "inside the Boundary Line, Goal Line and Behind Line" | Law 3.2 (a), Law 1 definitions |
| The Boundary Line | a white line in the shape of an arc from the behind post at one end to the behind post at the other | Law 3.2 (b) |
| The posts | goal posts 6.4 m apart; behind posts 6.4 m on each side of them, in a straight line | Law 3.3.1 |
| The goal square | two lines at right angles to the Goal Line for 9 m from each goal post, joined by the Kick-Off Line | Law 3.4, Diagram 1 (6.4 m wide, 9 m deep) |
| The centre | a Centre Square 50 m by 50 m; a Centre Circle 3 m across and a Ten Metre Circle 10 m across, in its middle, each divided in two by a line parallel to the goal lines | Law 3.5 (a), (b) |
| A Fifty Metre Arc | at each end of the Playing Surface, 50 m from the centre of the Goal Line | Law 3.5 (f), Law 1 definitions, Diagram 1 |

**Named grounds**, the length by the width in metres that the AFL's venue page prints under "Ground dimensions" (afl.com.au/venues/N, read 2026-10-13): MCG 160 by 141 (13), Optus Stadium 165 by 130 (65), the Gabba 156 by 138 (22), the SCG 149 by 136 (9), Marvel Stadium 159.5 by 128.8 (3) and GMHBA Stadium 170 by 114 (15). Other published figures disagree a little (an AFL article of 2018 prints 161 by 138 for the MCG, 155 by 136 for the SCG and 170 by 116 for GMHBA Stadium), and the pages do not say what they measure; only the stadium's own fact sheet says, for Optus Stadium, "boundary line to boundary line". Adelaide Oval's page prints 190 by 125 m, a length beyond the Laws' 185 m, so it is not drawn.

**Ours.** The shape: the Laws say "oval" and draw one; it is an ellipse of the ground's width across and a length such that, at the Goal Line, it is as wide as the Goal Line and the two Behind Lines together (19.2 m), the ends being cut by them as Diagram 1 shows; the Fifty Metre Arc runs between the places it meets the Boundary Line. The width of the lines (Law 3 prints none: 0.1 m). The size drawn, the MCG's, since the Laws give a range. The interchange area (15 m wide, on a wing: the Laws give no place) and the nine-metre line of Law 20 are not drawn.

### Gaelic football and hurling

*Official Guide Part 2* (the playing rules of hurling and football), Rules of Specification, Rule 1 "The Field of Play", Gaelic Athletic Association, effective from 27 March 2026 (the edition effective from 10 March 2025 has Rule 1 word for word the same), <https://www.gaa.ie/api/images/image/upload/t_q-best/prd/xi4oyuttzqpaqr2vfhbn.pdf>, pages 4 to 6.

| Figure | Value | Source |
| --- | --- | --- |
| The field | rectangular; length 130 m minimum and 145 m maximum; width 80 m minimum and 90 m maximum | Rule 1.1 |
| The lines across | at 13 m, 20 m, 45 m and 65 m (Hurling) from each end line, parallel to the end line; flags at their intersections with the sidelines and of the end lines with the sidelines | Rule 1.2 (i) |
| The midline | "a length of 10m in the centre of the pitch"; lines of 5 m "marked out from the 10m midline, at intervals of 5m across the field"; flags where the dashed lines meet the sideline | Rule 1.2 (i) |
| The lines | 90 mm ± 13 mm wide, white; the boundary lines are part of the field | Rule 1.2 (i) and (ii) |
| The scoring space | two goalposts at the centre of each end line, at least 7 m high and 6.5 m apart; the inside edge of the end line at a tangent to the front edge of the posts' bases; a crossbar 2.5 m above the ground | Rule 1.3 (i), (ii) |
| The rectangles | 14 by 4.5 m, its lines 4.5 m long and 3.75 m from the inside of each goalpost; 19 by 13 m, its lines 13 m long and 6.25 m from the inside of each goalpost; the end line is part of each | Rule 1.3 (a) to (c) |
| The arcs | a semicircular arc of 13 m radius centred on the middle of each 20 m line, outside it; for football, a semicircular arc of 40 m centred on the middle of the goal line, outside each 20 m line | Rule 1.4 |
| The penalty point | for football, 11 m from the centre of the goal line | Rule 1.5 |

**Ours.** The 65 m lines are drawn for hurling only, as the Guide marks them "(Hurling)". Whether the dashes of the midline begin at once or after a gap is not said: they begin where the midline ends. The Guide's diagram (an image) was not read. The substitution zone (Rule 1.6, 5 m either side of the centre line, on the sideline) is not drawn. The 20 m arc of the set-play rules is Rule 1.4's 13 m arc.

### Cricket

*The Laws of Cricket* (2017 Code), 4th Edition 2026, MCC, Laws 6, 7 and 8, <https://www.lords.org/getmedia/1d908298-5c44-468d-b6a7-e1414a1296e0/Laws-of-Cricket-2017-Code-4th-Edition-(2026)_3.pdf>. *ICC Men's One-Day International Playing Conditions*, effective from October 2026, clauses 6 to 8, 19.1, 28.7.2.1 and Appendix C, <https://images.icc-cricket.com/image/upload/prd/bxkzkcyvfn6tvi70zh0w.pdf> (the men's Test and T20I conditions' 19.1.3 is the same, and the T20I's 28.7.3 the same circle); *ICC Women's One-Day International Playing Conditions*, effective from October 2026, 19.1.3 and 28.7.2.1, <https://images.icc-cricket.com/image/upload/prd/qunpw1kfh3ibxlz58jlw.pdf>.

| Figure | Value | Source |
| --- | --- | --- |
| The pitch | a rectangular area 22 yards (20.12 m) long and 10 feet (3.05 m) wide, bounded at each end by the bowling creases and at each side by lines 5 feet (1.52 m) from the line of the middle stumps | MCC 6.1; ICC 6.1 |
| The bowling crease | the line that marks the end of the pitch, 8 ft 8 in (2.64 m) long | MCC 7.2; ICC 7.2 |
| The popping crease | in front of and parallel to the bowling crease, 4 feet (1.22 m) from it; marked at least 6 ft (1.83 m) either side of the line of the middle stumps in the Laws, and at least 25 ft (7.5 m) in the ICC's conditions | MCC 7.3; ICC 7.3 and Appendix C |
| The return creases | at right angles to the popping crease, their inside edges 4 ft 4 in (1.32 m) either side of that line, marked at least 8 feet (2.44 m) behind the popping crease | MCC 7.4; ICC 7.4 |
| The wickets | each set 9 inches (22.86 cm) wide, in the centres of the bowling creases; the stumps 28 in (71.12 cm) high | MCC 8.1, 8.2; ICC 8.1, 8.2 |
| The boundary | the Laws give none; the ICC's men's conditions: not longer than 90 yards (82.29 m) and not shorter than 65 yards (59.43 m) from the centre of the pitch; the women's: not longer than 70 yards (64 m) and not shorter than 60 yards (54.86 m) | ICC men's 19.1.3; ICC women's 19.1.3 |
| The fielding restriction's circle | two semicircles with the middle stump at either end of the pitch as their centre, of radius 30 yards (27.43 m) for the men and 25.15 yards (23 m) for the women, linked by two parallel straight lines; marked by a continuous white line or dots every 5 yards | ICC men's 28.7.2.1; ICC women's 28.7.2.1 |

**Ours.** The width of the creases (the Laws print none: 2 inches, drawn thin beside the ground). The boundary drawn, 75 yards for the men and the Laws' league and 65 for the women, inside each range; the boundary is a parameter. The pitch's colour. The league `icc-men` is the ground with the 30-yard circle, which applies in limited-overs cricket (ODI and T20I); the Test conditions have none. Not drawn: Appendix C's wide guidelines and protected-area indicators, whose figures (17 in, 1 ft) are labels of a diagram, the sight screens and the run-ups.

### Field hockey

*Rules of Hockey including explanations*, Rule 1 and the "Field and Equipment Specifications" 1.1 to 1.8, FIH, effective from 1 March 2026, <https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf>, pages 14 and 55 to 62.

| Figure | Value | Source |
| --- | --- | --- |
| The field | rectangular, 91.40 m long bounded by side-lines and 55 m wide bounded by back-lines; lines 75 mm wide, white, and part of the field | Specifications 1.1, 1.2 |
| The 22.90 m lines | across the field 22.90 m from each back-line "as measured between the furthest edges of each line"; the 23-metres areas | Specifications 1.3 e |
| The circle | a line 3.66 m long, its outside edge 14.63 m from the outside edge of the back-line, continued in uninterrupted arcs to the back-lines as quarter-circles with centres at the inside front corner of the nearer goal-posts | Specifications 1.4 a to c |
| The broken line | outer edges 5 m from the outer edge of each circle-line, starting with a solid section at the top centre, each 300 mm long with gaps of 3 m; mandatory for senior international matches | Specifications 1.4 d |
| The penalty spot | 150 mm across, its centre 6.475 m from the outer edge of the goal-line (6.40 m from the inner edge, Rule 1) | Specifications 1.3 i |
| The marks outside the pitch | lines 300 mm long on each side-line, the further edge 14.63 m from the outer edge of the back-line; on each back-line on both sides of the goal at 5 m and 10 m from the outer edge of the nearer goal-post | Specifications 1.3 f, g |
| The goal | the posts' inner edges 3.66 m apart, 2.14 m from the crossbar's lower edge to the ground, outside the pitch at the centre of the back-line; the net at least 0.90 m deep at the crossbar and 1.20 m at the ground | Specifications 1.5 d, e; Rule 1 |
| The flag-posts | 1.20 to 1.50 m high, at each corner of the field | Specifications 1.8 |

**Ours.** The goal's depth drawn, 1.20 m (the least the Rules allow at the ground). The posts are 50 mm wide (Specifications 1.5 b), which sets the corner marks' places from their outer edges. The clause numbers of Rule 1 (page 14) are read from a text whose labels were separated from their sentences: the table cites the Specifications, whose numbers are clear. Not drawn: the run-off areas and the side-boards and back-boards (1.6).

### Team handball

*IX. Rules of the Game for Indoor Handball*, Rule 1 "Playing Court", IHF, edition of 1 July 2025, <https://www.ihf.info/sites/default/files/2025-07/09A%20-%20Rules%20of%20the%20Game_Indoor%20Handball_E.pdf>, pages 4 to 7; and the *Guidelines for Playing Courts and Goals*, V, which are not part of the rules.

| Figure | Value | Source |
| --- | --- | --- |
| The court | a rectangle 40 m long and 20 m wide; lines are fully part of the area they enclose | 1:1, 1:3 |
| The goal | in the centre of each outer goal line, interior height 2 m, width 3 m; the rear side of the posts in line with the rear edge of the goal line | 1:2 |
| The lines | the goal lines 8 cm wide between the posts, all other lines 5 cm | 1:3 |
| The goal-area line (6 m) | a 3 m line parallel to the goal line, 6 m away "measured from the rear edge of the goal line to the front edge of the goal-area line", and two quarter circles of radius 6 m "measured from the rear inner corner of the goalposts" | 1:4 |
| The free-throw line (9 m) | a broken line 3 m outside the goal-area line, segments and spaces 15 cm | 1:5 |
| The 7-metre line | 1 m long, 7 m from the rear edge of the goal line to its front edge | 1:6 |
| The 4-metre line | 15 cm long, 4 m from the rear edge of the goal line to its front edge | 1:7 |
| The centre line and the throw-off area | the centre line connects the midpoints of the side lines; the throw-off area, a circle 4 m across in the middle of it | 1:8, 1:9 |
| The substitution line | a segment of the side line from the centre line to 4.5 m from it, ended by a line parallel to the centre line extending 15 cm inside and 15 cm outside the side line | 1:10 |
| The net's depth | 0.9 m behind the goal line at the top, 1.1 m at the bottom | Guidelines V (h) |

**Ours.** The substitution lines' end marks are drawn on one side line (the book's diagram image was not read). The free-throw line is cut where it meets the side lines: the goal area is 15 m across at the goal line and the line stands 3 m outside it, so it would be 21 m across, more than the court's 20 m. The colours: the floor and the goal areas' paint. Not drawn: the coaching zone (1:11), the benches and the table.

### Lacrosse

| Surface | Figures | Rule |
| --- | --- | --- |
| World Lacrosse's men's field | 91.4 to 100 m by 50 to 60 m between the lines; goals 1.83 m (6 ft) apart and high, 12 m from each end line, the net 2.1 m behind the goal line; a crease of 3 m radius; goal area lines 22 m from the goal line; wing lines 18 m from the centre, extending 10 m either side of the centre line; lines 5 cm, the centre line 10 cm | *Men's Field Lacrosse Official Playing Rules* 2025-2027, v1.1 (January 2025): 1.1, 2.1, 2.2, 3.1, 4.1, 5.1, 7.1, 12.1; <https://worldlacrosse.sport/wp-content/uploads/2026/01/WL_Mens-Rules_25-27_FINAL_1.1.pdf> |
| World Lacrosse's women's field | 91.4 to 100 m by 50 to 60 m; the goal line 12 m from the end lines, 1.83 m long; a goal circle of 3 m radius; a 15 m marking area from the middle of the goal line to each goal line extended, marked from 3 m to 15 m; an 11 m marking area, with a line from where the goal line extended meets the goal circle at 45 degrees to it out to the 11 m radius; restraining lines 22 m from each goal line; a centre line 3 m long and a centre circle of 9 m radius; lines 5 to 10 cm | *Women's Field Lacrosse Official Playing Rules* 2025-2026, v1.1 (January 2025): 1.A.2, 1.A.5 to 1.A.11; <https://worldlacrosse.sport/wp-content/uploads/2025/03/2025_2026-WF-Rulebook_FINALv1.1-1.pdf> |
| World Lacrosse's box floor | 200 ft by 85 ft (the diagram's labels); the goal 4 ft 9 in apart, 4 ft high, 12 ft from the end boards; a crease of 9 ft 3 in radius cut by a straight line 1 ft from the point of the base of the goal; restraining lines 42 ft 6 in out from the centre line; the centre face-off circle of 11 ft radius with a dotted circle of 17 in; corner face-off spots 5 yards from the boards and 5 yards inside the restraining lines; all lines 2 in | *Box Lacrosse Official Playing Rules* 2026-2028, v2.0 (May 2026): 1.1.3, 1.1.5, 1.1.7, 1.1.9, 1.2.1, and the diagram of Appendix B; <https://worldlacrosse.sport/wp-content/uploads/2026/05/26-28-Box-Rule-Book_v2_0526.pdf> |
| The NCAA's men's field | 110 by 60 yards; the goal 6 ft by 6 ft, 15 yards from each end line; a crease of 9 ft radius and a goal mouth of 6 ft radius; the net 7 ft back; an attack-area line 40 yards long, centred on goal, 20 yards from the goal line, joined to the end lines; a defensive-area line 20 yards from the goal line, sideline to sideline; wing lines 20 yards from the centre, 10 yards each side; the goal line and goal mouth 2 in wide, the centre line 4 in | *NCAA Men's Lacrosse Rules and Interpretations* 2027 and 2028 (August 2026), Rule 1-2 to 1-9; <https://ncaaorg.s3.amazonaws.com/championships/sports/lacrosse/rules/men/PRMLA_RulesBook.pdf> |
| The NCAA's women's field | 110 by 60 m optimal, 101 to 110 by 55 to 64 m allowed, the goals 92 m apart (82 to 92 m) with 9 m behind each goal line; a goal circle of 2.6 m radius; a restraining line 27 m from each goal line; a centre circle of 9 m radius and a 3 m line through the centre; an arc of 8 m and a fan of 12 m from the goal circles, 10.6 m and 14.6 m from the middle of the goal line, the arc ending at lines at 45 degrees to the goal line extended (8.58 m long) and the fan at the goal line extended | *NCAA Women's Lacrosse Rules* 2026 and 2027 (February 2026), Rule 1-1 to 1-6, 1-21 and Diagram 2; <https://ncaaorg.s3.amazonaws.com/championships/sports/lacrosse/rules/women/PRWLA_RulesBook.pdf> |
| The PLL's field | 100 by 60 yards; the goal 6 ft by 6 ft, 15 yards from each end line; a crease of outer radius 9 ft; the two-point arc 13 yards from the middle of the goal line at the goal line extended, parallel to the sideline until it is 15 yards from the middle, then an arc of 15 yards, extended by two lines from the goal line extended to the end line; wing lines 19 yards from the centre, 10 yards either side; the centre line and the arc 4 in wide | *2024 PLL Rulebook* (the newest found), Section II A to H; <https://premierlacrosseleague.com/wp-content/uploads/2024/03/2024-PLL-Rulebook.pdf> |
| The NLL's floor | 180 to 200 ft by 85 ft, corners of 28 ft radius (Diagram A's labels "180'-200'", "85", "28' r"); the goal 4 ft 9 in apart and 4 ft high, 12 ft from the end boards, poles of 4 ft 6 in; a crease of 9 ft 3 in radius, its line 5 in wide, cut by a straight line 1 ft from the point of the base of the goal (Diagram B); restraining lines 42 ft 6 in from the centre line; the face-off circle of 11 ft radius with a dotted circle of 17 in; corner face-off spots 5 yards from the boards and 5 yards inside the attack lines | *NLL Official Rules* 2025-26, 1.5, 2.1, 2.2, 3.1, 6.1, 6.2, Diagrams A and B (the 2024-25 and 2019-20 books have the same); <https://www.nll.com/wp-content/uploads/2025/12/NLL-2025-26-Rulebook-FINAL-1.pdf> |

**Ours.** Where a book prints a range the greatest is drawn (the NCAA women's, whose book names an optimal size, draws that). The NLL's line width, which its book does not print: World Lacrosse's 2 in is drawn. The width of the face-off circle's line, the men's field's X (World Lacrosse says "X" or a 10 cm square) and the net's depth in World Lacrosse's women's book (it prints none: the men's 2.1 m is drawn). The crease's flat is read as one foot behind the apex of the goal's poles, where Diagram B draws it (the text says "one foot from the point of the base of the goal"), the apex being as far behind the goal line as poles of 4 ft 6 in meeting over a goal 4 ft 9 in wide allow. The two-point arc's straight parts end where the arc of 15 yards begins, which is 7.48 yards from the goal line extended (the book says "until it reaches 15 yards from the center of the goalline"). World Lacrosse's box rules also say the goals stand "25 m from the midline", which does not fit its own 200 ft and 12 ft; the feet are drawn. Not drawn: the benches, the penalty boxes, the timer's table, the substitution areas and the coaches' areas of every book, and the NLL's 10 ft radius at the table.

## Athletics

The athletics stadium ([the page](./athletics.md)). The figures are in `src/leagues/athletics.ts` (the tracks and the stagger tables, in metres), `src/athletics/` (the races, the geometry and the facilities) and are held by `src/athletics.test.ts`. The documents, with the edition and the address read, are in `LEAGUE_SOURCES` (`wa-facilities-manual`, `wa-marking-plan`, `wa-technical-rules`, `wa-short-track-plan`), all from World Athletics' own downloads: the *Track and Field Facilities Manual* (2019 edition, Chapters 1 to 3), its *400 Metre Standard Track Marking Plan* (Figure 2.2.1.6a, 2019), Books C1.1 and C2.1 of the *Competition and Technical Rules* (in force 1 July 2026) and the *Marking Plan for the Standard Short Track* (Figure 8.3.6c, 1 January 2026). Each was read as text and the figures of a drawing were read off it where the text has none; no text, table or diagram is copied.

| Part | Figures | Rule |
| --- | --- | --- |
| The 400 m track | two semicircles of 36.50 m radius at the kerb joined by straights of 84.39 m; a lap of 398.1163 m at the kerb and 400.0012 m on lane 1's running line; the kerb 50 mm drawn (the rule allows 50 to 250 mm) | Manual 2.2.1.1, Table 2.2.1.1; Rule 14.1 |
| The lanes | 1.22 m wide including the 50 mm line on the right; the running line 0.30 m from the kerb in lane 1 and 0.20 m from the line on the left in the others; eight lanes at least for the major competitions and nine at the most; safety zones 1.00 m | Rule 14.2, 14.4, 14.5; Manual 2.2.1.1, 2.2.1.5 |
| The finish straight | 6 to 10 lanes of 1.22 m, a starting area of 3 m behind the first start line and a run-out of 17 m | Manual 2.2.2, 2.2.2.1 |
| The staggers | the 200 m and 400 m: π times the difference of the diameters of the running lines, for each bend (3.519 to 26.515 m and 7.037 to 53.030 m for lanes 2 to 8); the 800 m: the breakline's construction, an involute of the circle of lane 1's second bend (wire 84.39 m), 3.526 to 26.93 m; the 4 x 400 m: two bends and the breakline, 10.563 to 79.96 m. Worked out in `track.ts` and `races.ts`, and held to the table's own numbers by a test: 200 m and 400 m within 0.6 mm, 800 m and 4 x 400 m within 2.5 mm | Manual 2.2.1.6, Table 2.2.1.6a; Rule 17.5.1 |
| The curved starts | the line is the involute of lane 1's circle through lane 1's start; a group start's second line is the involute of lane 5's circle (radius 41.58 m) offset by the 800 m's lane 5 stagger, 15.151 m | Rule 17.5.2; Manual 2.2.1.6 |
| The hurdles | 100 m (women) and 110 m (men): 13 m and 13.72 m to the first, 8.50 m and 9.14 m between, 10.50 m and 14.02 m to the finish, ten hurdles; 400 m: 45 m, 35 m and 40 m; the 60 m hurdles of the covered track as for the sprint hurdles | Rule 22.2, 22.3; Table 2.2.3.1 |
| The relays | the 4 x 100 m: takeover zones of 30 m with the scratch line 20 m from the start of the zone; the 4 x 400 m: 20 m with the scratch line in the middle | Rule 24.3 |
| The steeplechase | the lap with the water jump inside: 396.0849 m, with the second bend diverted by two arcs of the oval's radius, two transitions of 16.20 m radius (13.41545 m each) and a straight of 30.2020 m; with the jump outside: 419.407 m, with a straight of 9.86 m, a semicircle of 36.70 m and another straight; five hurdles a lap (21.997, 101.214, 180.431, 259.648 and 338.865 m from the finish inside; 17.866, 101.747, 185.628, 269.509 and 353.390 m outside), the fourth the water jump; the 3000 m starts 172.594 m (inside) or 355.256 m (outside) from the finish line; the hurdle 3.94 m wide, 0.127 m square at the top, the pit 3.66 m | Rule 23, 23.5, 23.6; Manual 2.2.4.1, Figures 2.2.4.1a to 2.2.4.1e |
| The jumps | high jump: uprights 4.02 m apart, a landing area of 6 m by 4 m at the least, the bar 0.5 m inside the front of the mat, the 50 mm lines 3 m outside each upright, a run-up fan; pole vault: a box 1.00 m long, 0.60 m wide at the front and 0.15 m at the stop board, the 0-line 10 mm wide, a mat of 6 m by 6 m at the least with front pieces 2 m long, a runway of 45 m; long and triple jump: a runway of two lines 1.22 m apart, boards of 1.22 m by 0.20 m, a pit of 8 m by 3 m, the long jump's board 3 m from the pit and the triple jump's 13 m (men) or 11 m (women) | Rules 27 to 31; Manual 2.3.1, 2.3.3, 2.3.4 |
| The throws | the circle of 2.50 m (2.135 m for the shot and the hammer), the 0.75 m lines at right angles to the sector's axis; the stop board 1.21 m long and 0.112 m wide; the sector of 34.92 degrees (lines 0.6 m further apart for every metre from the centre, 2 asin 0.3); the cage's mouth 6 m wide, 7 m in front of the circle; the javelin's runway 4 m wide, the arc of 8 m radius, the sector of 28.96 degrees (2 asin of 2/8), reaches of 25 m (shot), 80 m (discus), 90 m (hammer) and 100 m (javelin) | Rules 32 to 37; Manual 2.1.1.3, 2.4.1 to 2.4.4 |
| The standard arena | where each facility stands: the pole vault runways and two shot put circles in the first segment, the combined discus and hammer circle, the high jumps and the third shot put in the second, a javelin runway through the middle of each, the long and triple jump beyond the back straight, the pitch's turf 12 m in from the semicircles' centres | Manual 2.5, Figure 2.5a, read off the Marking Plan to the metre (the precision of its scale) |
| The covered track | 200 m: bends of construction radius 17.205 m, their centres 44.983 m apart, banked 10.000 degrees; lanes 1.00 m on the oval and 1.22 m on the infield straight, four to six; the stagger tables of the Marking Plan: 5.597 to 30.523 m for two bends in lanes, 8.407 to 46.092 m for three, 2.81 to 15.57 m for one | Rules 41 to 44 (Rule 43: lanes 0.90 to 1.22 m); Marking Plan, 1 January 2026 |

**Ours.** The colours of the tracks and of the ground. The cages' rear (an arc about the circle's centre). The covered track's bends, which the plan builds from ascending and descending sections and are drawn here as one circle of the same radius. The water jump's pit (its place on the diverted lap) and the water in it. The lane tags, the stencil digits (a face of our own, drawn as paths) and the sizes of every number. The reach at which a sector's grass ends. The places of the facilities, read off the Marking Plan at its scale of 1:350. The 60 m's start on the infield straight. Not drawn: the starting blocks, the officials' places, the photo-finish gantry, the benches, the sponsors' boards, the wind gauge.

## Ice skating

The skating rinks ([the page](./skating.md)). The figures are in `src/leagues/skating.ts` (the three rinks, in metres), `src/skating/` (the geometry, the starts and the parts) and are held by `src/skating.test.ts`. The documents, with the edition and the address read, are in `LEAGUE_SOURCES` (`isu-speed-skating-rules`, `isu-short-track-rules`, `isu-figure-skating-rules`), all from the International Skating Union's own downloads: *Sports Rules - Speed Skating* (Special Regulations and Technical Rules, effective 12 June 2026) with its "H. Track" layout plan and measurements, the *Special Regulations and Technical Rules Short Track Speed Skating* (2024) and *Sports Rules - Figure Skating* (effective 12 June 2026). Each was read as text, and the layout plan, the short track's diagram and the tables as pictures; no text, table or diagram is copied.

| Part | Figures | Rule |
| --- | --- | --- |
| The long track | two lanes, the inner 4 m wide and the outer at least 4 m; a competition track of at most 400 m (333 1/3 m at least), two curves of 180 degrees, the inner curve's radius 25 m to 26 m; the crossing is the whole straight from the end of a curve | Rule 203 |
| The measurements | the track measured 0.5 m outside the inner edge; for an inner radius of 25 m, 25.5 m and 26 m and lanes of 4 m: a straight f of 113.57 m, 112.00 m and 110.43 m between the centres of the curves, the inner curve (radius + 0.5) x pi = 80.11 m, 81.68 m, 83.25 m, the outer curve (radius + 4.5) x pi = 92.68 m, 94.25 m, 95.82 m and the crossing sqrt(f^2 + 4^2) - f = 0.07 m: 400.0 m. Worked out in `track.ts` and held to the table by a test (within 6 mm) | Rule 227.1; "Measurements of standard 400m speed skating tracks" |
| The lines | the lanes' demarcation: fully painted lines 5 cm wide, in the straights and the curves; blocks inside the painted lines, at most 5 cm high, 50 cm apart for the first 15 m of a curve and 2 m apart for the rest, a closed cone (10 cm recommended) as the first block at the entrance of each curve | Rule 226 |
| The warm-up lane | inside the competition lanes, at least 4 m wide | Rules 205 and 206 |
| The starting and finishing lines | coloured lines not more than 5 cm wide at right angles to the straight or its extension; a pre-start line 2 m before the starting line; the last 5 m before the finishing line marked by the metre; on a standard 400 m track the finishing line for the 1000 m in the middle of the finishing straight, the others towards the end of it (h = f - 100: the 400 m mark, 100 m from the beginning of the straight), the team pursuit and the team sprint in the middle of the straights | Rules 227.2, 253.3.2 and 256.1.2 |
| The starts | the 500 m on the 300 m mark; the 1000 m, 1500 m, 3000 m and 5000 m on the crossing straight, derived from the race's distance back from its finishing line, lane by lane (no change of lanes on the first straight of the 1000 m and the 1500 m): the 1000 m's lines 6.32 m (k) and 6.25 m (j) from the middle, the 3000 m's and 5000 m's 7.32 m (i) and 19.89 m after the beginning of the next curve, 12.57 m apart; the mass start in the middle of the finishing straight, in rows of at most 6 at least 1 m apart | Rules 254.5b, 256.1.2, 257.3, "Measurements" |
| The coaches' area | a line 2 cm wide, 1 m from the outside edge of the track, beginning 25 m from the end of the curve and ending 10 m before the entrance to the next curve, on the crossing straight | Rule 227.3 |
| The padding | at least 80 cm high and 30 cm thick, in the curves and 20 m on the straights; permanent installations at least 3 m from the inner and outer edge | Rule 228.2 |
| The armbands | white for the inner lane and red for the outer, on the right arm | Rule 253.3.1 |
| The short track | an oval of 111.12 m: 2 x S = 57.71 m and 2 x C x pi = 53.41 m, S = 28.85 m, C = R8.50 m, the blocks on R8.00 m; seven blocks in each curve; the rink at least 60 by 30 m; the straight at least 7 m wide, the apex block at least 4 m from the barrier; a line between the last block of a curve and the first of the next | Rule 280.1 and 280.4, the diagram of the tracks |
| The short track's tracks | five tracks moved 1.00 m apart along the straight, starting lines 2.00 m apart, or seven moved 0.70 m, lines 1.40 m apart; for all tracks one finishing line | Rule 280.1e, the diagram |
| The short track's lines | starting and finishing lines at most 2 cm wide; the starting lines from the barrier across the width of the straight, the finishing line that and 1.5 m more; for the 500 m and the 1000 m five dots of 2 cm every 1.3 m from 50 cm out from the inner side; the inner surface, when coloured, symmetrical to the track | Rule 280.2 |
| The laps | 500 m = 4 1/2, 1000 m = 9, 1500 m = 13 1/2, 2000 m = 18, 3000 m = 27, 5000 m = 45 | the diagram's table |
| The figure skating rink | the skating area rectangular, if possible 60 m by 30 m, not larger and not less than 56 m by 26 m; the judges and the referee at the rinkboard, the technical panel in an elevated position if possible | Rule 342.1 |

**Ours.** The colours of the ice, the floor, the warm-up lane and the looks. The warm-up lane's lines (the Rules require the lane and name no marking). The padding's place (3 m from the outer edge, 0.3 m thick) and the crossing's straight line from lane to lane (the table's model). The blocks' size as drawn, and the angle of the short track's seven blocks (30 degrees apart: the diagram shows seven and the Rules give no angle). The short track's rink corner (8.5 m). The figure skating rink's corner and boards, and the place and size of the judges' seats, the referee's, the technical panel's table and the kiss and cry (the Rules give none; nine judges is the Olympic Winter Games' panel). The short track's lap is 111.11 m as S and C make it (the diagram prints 111.12 m). Not drawn: the lap counters, the officials' places on the long track, the cones of a team race's changeover and of a relay's exchange zone, the long track's start of a relay.

## Surface units

`SURFACE_UNITS` (`src/units.ts`) is the unit each rulebook states its principal figures in. The drawing is made in feet and a figure is one conversion from the rulebook's own.

| Surface | Unit | Source |
| --- | --- | --- |
| NFL, CFL | yards | NFL rulebook, Rule 1 and CFL rulebook, "The Field": the lengths of the field and its end zones are in yards (the widths of the NFL's markings in feet and inches) |
| IFAF | yards (**ours**) | Appendix D gives its figures in feet (hash marks, numbers) and in five-yard segments; the field's length follows the football fields, so it is listed in yards |
| NHL, NBA | feet | NHL rulebook, Rule 1 and NBA rulebook, Rule 1 |
| Baseball | feet | Official Baseball Rules, 2.01 to 2.05 |
| Curling | metres for World Curling (the unit it prints first, with feet beside it), feet for Curling Canada (which prints feet first) | R1 of the World Curling rules; Rule 3 of Curling Canada's |
| Tennis, pickleball | feet (each also gives metres beside it) | Rule 1 of the ITF's Rules of Tennis ("78 feet (23.77 m)"); Rule 3.A.1 of USA Pickleball's rulebook ("20 feet (6.10 m)") |
| Volleyball, badminton, table tennis | metres | Rule 1.1 of the FIVB's rules; Law 1 and Diagram A of the BWF's (millimetres on the diagram); Law 2.1 of the ITTF's |
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
| Names | the names the infobox lists (`former_names`, `nickname`) with the years it dates them; the name of a World Cup (`Miami Stadium` in 2026) where it lists one; the everyday and the official names, in Japanese and in the language of the place (`aliases`, each with its `source`) | the infobox and the opening text; the Japanese article for the name Japanese media use (`日産スタジアム`, from 1 March 2005) and its reading; Wikidata (CC0) for the labels, aliases and the properties official name, nickname and name |
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

## Special games

The 18 games of `EVENTS` ([special-games.md](./special-games.md)) are read from the English Wikipedia article of each game and of its venue, at the revision named in [NOTICE.md](../NOTICE.md), and from three articles of the press for where a rink stood. They are facts (a day, a venue, a length); no text, table or picture is used. Each was read on 2026-10-13. A game's own surface is the one drawn alone, from the sources of its own section (the NHL rink and the NBA's and NCAA's courts, the CFL's and the NCAA's fields, a ballpark's fence); what is here is the rest.

| Figure | Value | Source |
| --- | --- | --- |
| The day of each game | the day or days the article of the game gives | 2009, 2010, 2017, 2018, 2019, 2022 and 2023 NHL Winter Classic, 2014 NHL Stadium Series, 2003, 2011, 2014, 2016, 2019 and 2023 NHL Heritage Classic, Carrier Classic, MLB London Series |
| The venue | the stadium the article names; a ballpark by its key in `PARKS`, a football stadium by the field its football tenant plays on | the same, and the articles of Commonwealth Stadium, McMahon Stadium, BC Place, Princess Auto Stadium, Mosaic Stadium and Notre Dame Stadium |
| The rink | 200 by 85 feet, the NHL's (Rule 1); the 2009 story prints that size for Wrigley Field | the Hockey section above; Sports Video Group, 30 December 2008 |
| Wrigley Field, 2009 | the rink ran from first base to third; its edge toward center field was 112 feet from home plate and 288 from the 400-foot wall; center ice was "basically at the pitching mound" | Sports Video Group, "2009 NHL Winter Classic Takes the Mound"; NHL.com, "Winter Classic at Wrigley evokes memories of 1st outdoor game at Cubs' home" (Tracey Myers, 29 December 2024) |
| Fenway Park, 2023 | the 200-foot rink roughly centered length-wise across first and third bases, along a second-to-third-base axis | The Boston Globe, 18 December 2022 |
| The deck of USS Carl Vinson | 1,092 feet overall length and 252 feet overall beam, the Nimitz class's | the Nimitz-class article; the Carrier Classic article for the game, the Carl Vinson article for the ship |
| London Stadium | a field of play of 105 by 68 metres; the baseball field laid over the running track and the pitch; the fence 330 feet to the poles, 382 to left center and right center and 385 to center in 2019, 387 in the power alleys and 392 to center in 2023 | the London Stadium and MLB London Series articles |

**Ours.**

- **Where no source says where the surface stood, a convention places it, and the game says so.** `midfield` is the middle of the host's field with the surface's length along it; `deck` the same on a deck; `infield` the middle of a ballpark's infield (63.64 feet from home plate, the point where the line from first base to third crosses the line from home plate to second) with the rink's length from first base to third, the direction the Wrigley Field rink of 2009 had; `diamond` the middle of a baseball field's infield on the middle of a pitch, home plate to center field along it. No offset or angle is made up beyond those: a test holds each game's numbers to the rule it names.
- **Wrigley Field, 2009.** The two numbers 112 and 288 add to the 400 feet to the center-field wall, so 112 is read as the rink's edge toward the wall, the one reading under which the rink also covers the pitching mound, as "splits the pitchers' mound from first to third" says. That puts its middle 69.5 feet out, 9 feet from the mound that NHL.com's Dan Craig names. The sources differ by that much, and by what was planned before: the diagram had center ice at second base before the rink was moved into the infield.
- **Fenway Park, 2023.** "Roughly centered" is read as the middle halfway between first and third, and "a second-to-third-base axis" as the rink's length turned 45 degrees from third base toward second. The article says the 2023 layout differs from the 2010 one and does not describe the 2010 one, so 2010 is by convention.
- **The deck** is the bounding rectangle of the class's overall length and beam; the ship's own flight deck is angled and narrower at its ends.
- **London's five fence distances** are the five of the `fence` option. The article's two points where the temporary fences join the wall are drawn at the usual angle of left center and right center, and the 330 feet to the poles in 2023 is that of 2019, which the article does not restate.
- **A football stadium's field** is the CFL's, or the NCAA's at Notre Dame Stadium, whose field is the stadium's tenant's; BC Place's roof was closed for its game, and the drawing says so.
- **What was looked for and not found:** a source for where the rink stood in each of the other ballparks, in the football stadiums, and for the court on the carrier's deck; the exact figures of the 2024 London fence; and the placement of the football fields at Wrigley Field, of which only directions are published (see [special-games.md](./special-games.md#what-is-not-drawn)).

## Coordinate frames

`src/frames.providers.ts` holds the frames of the providers below, as landmarks on the drawing's own coordinates (feet; x along the surface from its left end, y across it from the top, a ballpark's x across and y minus out from home plate). Only facts were read: ranges, units, origins and conventions. No code of sportypy, sportyR or hockey_rink (all GPL) was read for them; the MIT projects sdv-plot, sporty and mplsoccer are credited in [references.md](./references.md) for ideas. Each page below was read on 2026-10-13.

| Frame | Read from | What it gives |
| --- | --- | --- |
| `nhl-api` | puckapi.com, "get_plays" (`x_coord` "Rink x, -100..100 along the length", `y_coord` "Rink y, -42..42 across"); Carnegie Mellon Sports Analytics Conference 2021, An and Nguyen, "A Web Application for Manually Tracking Locational Event Data in Ice Hockey" (as quoted by a search result: "The center of the rink has coordinates (0,0)", x from -100 feet on the left to 100 feet on the right); Meghan Hall, "Shot locations" (Y "from mid-rink, -43 to 43", values in feet, goal line at 89 feet) | x -100 to 100 feet, y -42.5 to 42.5 feet (the rink's width halved), the origin at centre ice |
| `hockeytech` | sportsdataverse-py pull request 725, "raw pbp coordinates are 600x300 in every league" (a canvas "with a top-left origin", "centre ice is (300,150)", no value over 600 or 300; the PR's own conversion: 0..600 to -100..100 feet and 0..300 to 42.5..-42.5 feet); fastRhockey pull request 75 (HockeyTech data in a centre-origin feet frame) | a canvas of 600 by 300 with its top left at the rink's top left corner; the whole canvas is the rink |
| `nba-stats` | sdvplotR pull request 24, "NBA legacy shot coordinates" (tenths of a foot, the hoop at the origin, "negative x is the shooter's left corner", left corner threes at LOC_X -249 to -221, minimum LOC_Y -52 which puts the baseline at -52.5, basket 5.25 feet from the baseline); wehoop-wnba-stats-data pull request 20 (the origin is the basket and not the baseline, positive y towards half court, `hypot(x, y) / 10` matches the shot distance, NBA 2024-25 y from -39 to 835) | LOC_X across the court, negative at the shooter's left; LOC_Y along it from the hoop towards half court; both in tenths of a foot; every shot at the basket attacked, which is placed at the right basket |
| `nfl-tracking` | nfl-football-ops/Big-Data-Bowl, `schema.md` (x "along the long axis of the field, 0 - 120 yards", y "along the short axis of the field, 0 - 53.3 yards") | x counts the end zones (the goal lines at 10 and 110 yards), y spans the field's width |
| `mlbam` | Beanumber, "Analyzing Baseball Data with R", 3rd ed., Appendix C (`hc_x` and `hc_y` are "x location" and "y location of batted ball when it lands"; the spray angle is atan((hc_x - 125.42) / (198.27 - hc_y))); Baseball Savant, "Statcast Search CSV Documentation" (`hc_x`, `hc_y` "Hit coordinate X/Y of batted ball", no unit given); MLBAnalytic, "Build a Spray Chart from Statcast" (the origin is the top left of a pixel image; 125.42 and 198.27 are home plate's place; a unit is "roughly 2.5 feet", the ratio to `hit_distance_sc` clustering at 2.48); yasumorishima/baseball-field-viz README (the same transform with a scale of 2.5) | home plate at (125.42, 198.27), x growing to right field, y growing down the image |
| `curling` | this package's own frame: the button of the house the stones are played to as the origin, feet, x across (positive to the thrower's right), y along (positive towards the back line) | the rules score a stone by its distance from the tee (World Curling R12(d), Curling Canada Rule 14), so the tee is the origin; no data provider's format was read |
| `tennis`, `volleyball`, `badminton`, `pickleball`, `tabletennis` | this package's own frames: the centre of the net, on the court, as the origin; x along the court (positive towards the end drawn at the right), y across it (positive towards the top as the court is drawn wide); feet for tennis and pickleball, metres for the others | each rulebook measures its court from the net (the service line, the attack line, the short service line and the non-volley zone line from it); no tracking provider's format was read (Hawk-Eye's and the others' are not published) |
| `lacrosse`, `rugby`, `afl`, `gaelic`, `cricket`, `fieldhockey`, `handball` | this package's own frames: the centre of the surface as the origin; x along it (positive towards the end drawn at the right), y across it (positive towards the top as it is drawn wide); metres, and yards for cricket, whose origin is the middle of the pitch | each of these surfaces has a range of sizes, so the frame is fitted to the size the surface is drawn at; no data provider's format was read |
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
| `nhl-rules-2012` | National Hockey League, "National Hockey League Official Rules 2012-2013, Rule 1.9 Face-off Spots and Circles" (<https://www.nhl.com/nhl/en/v3/ext/pdfs/2012-13_RuleBook.pdf>) | the hash marks: "two red lines, two inches (2'') wide and two feet (2') in length and three feet (3') apart" |
| `nhl-hash-2014` | NHL and NHLPA (joint release, as posted by the NHLPA), 6 October 2014, "NHL to adopt modification to face-off circle hash marks for 2014-15 season" (<https://www.nhlpa.com/news/1-12488/nhl-to-adopt-modification-to-face-off-circle-hash-marks-for-2014-15-season>) | the modification to Rule 1.9 moves the end-zone hash marks from three feet apart to five feet seven inches apart, implemented for the commencement of the 2014-15 season after a preseason trial |
| `cbs-hash-2014` | CBS Sports, 6 October 2014, "NHL adopts modification to face-off circle hash marks for 2014-15" (<https://www.cbssports.com/nhl/news/nhl-adopts-modification-to-face-off-circle-hash-marks-for-2014-15>) | the hash marks moved from 3 feet apart to 5 feet 7 inches for 2014-15, "more in line with" the marks on international ice |
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
| `mlb-2023` | Major League Baseball, 9 September 2022, "MLB announces rule changes for 2023 season" (<https://www.mlb.com/press-release/press-release-mlb-announces-rule-changes-for-2023-season>) | for 2023 the size of first, second and third base increases from the standard 15 inches square to 18 inches square, cutting the distance between first and second and between second and third by 4.5 inches |
| `cbs-bases-2023` | CBS Sports, 2 March 2023, "MLB rules changes: What to know about the bigger bases, how they could increase stolen bases" (<https://www.cbssports.com/mlb/news/mlb-rules-changes-what-to-know-about-the-bigger-bases-how-they-could-increase-stolen-bases>) | the bases had been 15 inches square "for well over a century" and are 18 inches from the 2023 season |
| `obr-2024` | Office of the Commissioner of Baseball (as reproduced by Baseball Canada), "Official Baseball Rules, 2024 edition, Rule 2.03 The Bases" (<https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf>) | "The bags shall be 18 inches square, not less than three nor more than five inches thick" |
| `wp-baseball` | Wikipedia, "Baseball field", revision 1376335066 ([Baseball_field](https://en.wikipedia.org/w/index.php?title=Baseball_field&oldid=1376335066)) | the pitcher's box at 45 feet, 50 feet from 1881, its 1887 size, the plate at 60 feet 6 inches from 1893, the mound's height, the home plate through the years, the batter's boxes of 1874 and 1885 |

**Ours, and where the sources disagree.**

- **A marking no source covers keeps the nearest cited state.** The NHL's goal lines are cited from 1997 (11 feet) and the blue lines from 1998 (73 feet), so an earlier season draws them there and `rulesFor(...).gaps` names them. A gap is never listed among a season's `differences`. What was looked for and not found is in [references.md](./references.md#surfaces-through-the-years).
- **The size of the bases.** 15 inches square before 2023 and 18 from 2023 (the Official Baseball Rules, Rule 2.03; MLB's announcement of 9 September 2022). CBS Sports calls the 15 inches the size "for well over a century"; no source read dates an earlier size or says when 15 inches began, so every season before 2023 is drawn at 15 and the change is the only dated one. Wikipedia's "Base (baseball)" gives no history of the size. The bases are drawn larger than life unless `exactLines` is set, in both sizes.
- **An approximate state.** The baseball pitcher's box is cited at 45 feet (the 1870s) and 50 feet (from 1881) but its size only from 1887 (4 by 5½ feet); the earlier boxes are drawn at the 1887 size and `approx` says so.
- **The mound is drawn with the plate.** The sources give a raised mound but not the year it came; from 1893 the pitcher's plate is set on it, so the dirt circle of the mound is drawn from 1893 and not before. The mound's height (15 inches from 1903 to 1968, 10 from 1969) is data only: a top view does not show it. The article also says "from 1893 to 1950" in another sentence; 1903 is the date it gives with the figure.
- **The home plate** is drawn from the shapes and places the article dates (round 1857 to 1867, a square 1868 to 1870, turned 1871 to 1899, the pentagon from 1900; centred on the foul lines' meeting 1861 to 1874, wholly behind it 1875 and 1876, in front of it from 1877). The dates are those of the National Association and the National League, which the article names; no other league's is claimed. The batter's boxes of 1885 are the National League's (the American Association followed in 1886).
- **The NFL's goal posts.** The slingshot is dated 1967 (Sports Illustrated: "up until 1967" they were an H); a search result said Wikipedia's article on the goal post has the shape "first seen in 1966", an article that was not read here. The NFL's hash marks before 1933 are none: a game of the 1932 playoffs used them once, and they were adopted for 1933. The one-yard sideline ticks, which the drawing keeps in every season, are not dated by any source read.
- **The NHL's hash marks** (`hashApart`) are cited at 3 feet from 2012-13 and 5 feet 7 inches from 2014-15, from the NHL's own rulebook and its joint release with the NHLPA; CBS Sports says the same. Nothing earlier than the 2012-13 book was read, so earlier seasons keep the nearest cited state and `gaps` names `hashApart`.
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
| `curling-house` | At each end: the button (radius 6 in), the 4-foot ring (to a radius of 2 ft), the 8-foot ring (4 ft) and the 12-foot ring (6 ft), by the centre of the stone; and the free guard zone, between the tee line and the hog line (the hog line's inside edge, 21 ft), outside the 12-foot ring. | R1(d) and R6(a) of the World Curling rules; Rule 3(4) and Rule 12(1) of Curling Canada's. The zones are ours: the rules name the rings and the zone, and do not count stones into them. |
| `net-court` | On each side of the net: the front court, between the net and the line the sport's own rules draw there, and the back court behind it. The line is tennis's service line (21 ft from the net), volleyball's attack line (3 m), badminton's short service line (1.98 m) and pickleball's non-volley zone line (7 ft); beach volleyball and table tennis have no such line, so each side is one half court. | Rule 1 of the ITF's rules; Rule 1.3.4 of the FIVB's; Diagram A of the BWF's; Rule 3.A.4.c of USA Pickleball's. The zones are ours: the rules name the lines and not the areas. |
| `athletics-track` | The track in parts: the infield inside the kerb; the finish straight and the back straight between the centres of the semicircles; the first bend (the right-hand one, entered from the finish line) and the second. A point is in the part it lies over; lane by lane is the lane lines' business. | Ours, on the figures of the Athletics section above. The rules name no area of the track. |
| `skating-track` | The rink in parts: the infield inside the track's inner edge; the finishing straight and the crossing straight between the centres of the curves; the first curve (the right-hand one, entered from the finishing straight) and the second. A figure skating rink is cut in three along its length. | Ours, on the figures of the Ice skating section above. The Rules name no area of the ice. |
| `field-thirds` | The surface cut in three equal parts along its length, counted from the team's own end, for lacrosse, rugby, Australian football, Gaelic games, field hockey and handball. | Common usage; the cut is equal. |
| `cricket-ground` | The pitch (22 yards by 10 feet, Laws 6.1); the rest of the ground inside the fielding restriction's circle (the ICC's two semicircles of 30 yards, or 25.15 for the women, about the middle stumps, joined by two lines, 28.7.2.1), where the league has one; and the outfield. | MCC Law 6.1; ICC 28.7.2.1. The zones are ours: the rules name the lines and not the areas. |
| `football-pass` | Short: up to 15 yards past the line of scrimmage, a pass thrown behind it included; deep: more than 15. Left, middle and right across the field: middle is between the hash marks; left and right are the passer's, facing the way the offence attacks. The line of scrimmage is the layer's `los`. | The field names are nflverse's `pass_length` (short or deep) and `pass_location` (left, middle or right) in the [nflreadr play-by-play dictionary](https://nflreadr.nflverse.com/articles/dictionary_pbp.html). That dictionary does not give the edges (nflverse takes them from the play's text, not from air yards), so the 15 yards and the hash marks are ours. |

The colour ramps are Kyogijo's own: nine stops each, chosen by luminance and checked by a test against the surface colours and the ground a heat layer paints (see [data layers](./layers.md)); no palette of a plotting package is copied.

## Formations

The named formations of `src/formations.ts`. A formation is a convention: coaches draw each one a little differently, no rulebook fixes where a player stands, and the numbers here are ours, an example of each shape in the frame of its sport (the table in [Team shape](./team-shape.md#formations) says which). What a source settles is the sport's surface, the frame, and in a few places a rule.

| Sport | What the figures are | Source |
| --- | --- | --- |
| Soccer (`opta` frame: 0 to 100 along and across, from the team's own goal) | The shapes by their usual names: 4-4-2, 4-3-3, 4-2-3-1, 4-1-4-1, 3-5-2, 3-4-3, 5-3-2, 5-4-1, 4-3-2-1 and the 4-4-2 diamond. Each line stands at a depth that is typical, not measured. The position names are the conventional ones; Law 3 of the IFAB Laws of the Game names the goalkeeper and no other position, and the Laws give no formation. | Ours; the Laws of the Game (IFAB) for the goalkeeper. |
| Hockey (`nhl-api`, feet from centre ice) | The goaltender and five skaters in their own half at even strength, and a 1-3-1 power play in the attacking zone. The positions (goaltender, left and right defence, left wing, centre, right wing) are conventional; the places are ours. | Ours. |
| Basketball (`nba-stats`, tenths of a foot from the hoop) | Five out (all five on the three-point line, 23 feet 9 inches from the hoop's centre at the top), four out and one in, and a 1-4 high set with forwards at the elbows (the free-throw line is 19 feet from the hoop's centre in the frame). The positions (point guard, shooting guard, small forward, power forward, centre) are conventional. | Ours, on the court's figures in the Basketball section above. |
| Football (`nfl-tracking`, yards) | The I formation and the shotgun for the offence, the 4-3 and the 3-4 for the defence, with the ball at midfield (`los` moves it): a centre, two guards and two tackles shoulder to shoulder on the line of scrimmage, the rest at the usual depths. The positions are the usual ones. | Ours, on the field's figures in the Football section above. |
| Baseball (`retrosheet`, feet from the back of home plate) | The nine fielders where they usually stand, and an infield shift against a left-handed pull hitter. The nine fielders are the ones the Official Baseball Rules name; the scorer's numbers 1 to 9 are not drawn. Since 2023 Rule 5.02 requires two infielders on each side of second base, with their feet on the infield dirt (a 95-foot radius from the pitcher's plate): the shift is not allowed in MLB today and is drawn for the leagues and the seasons that allow it. | The Official Baseball Rules, Rule 5.02 (the 2023 change; the text was read as reproduced in an MLB Players Association document, whose draft and final language could not be told apart, so the exact wording is not quoted); the places are ours. |

## League variants

`league` (`src/leagues/`) draws a surface as one league's rulebook marks it. Every figure is the rulebook's, in its own unit (`LEAGUES[sport][i].unit`); `LEAGUE_SOURCES` names each document with its edition and the address it was read at on 2026-10-13, and docs/variants.md lists the figures of every league with its sources. Arcs are measured as the rule measures them (to the outside edge of the line unless said), and lines are drawn thicker than painted unless `exactLines` is set, as everywhere in this package. No text, table or drawing of a rulebook is copied. Figures marked "diagram" are labels read off the rulebook's own diagram. [sporty](https://github.com/sportsdataverse/sdvplot-js) (MIT) was checked against after the figures were read; where ours differ, and why, is below.

### Basketball

| League | Figures | Rule |
| --- | --- | --- |
| WNBA | 94 by 50 feet (diagram); the lane 16 feet to the outside (diagram); the free-throw line 15 feet from the backboard's plane; the arc 22 ft 1¾ in with the straights 36 in from the sidelines; the restricted area a half circle of 4 feet then parallel to the lane; the small marks as the NBA's | WNBA Official Rules 2026, Rule 1, I-c, I-d, I-i |
| FIBA | 28 by 15 m; the lane 4.90 m; the free-throw line 5.80 m; the circles 1.80 m; the arc 6.75 m, its straights 0.90 m from the sidelines; the basket 1.575 m and the backboard 1.20 m from the endline, 1.80 m wide; the ring's inside diameter at least 450 mm; the no-charge semicircle 1.30 m with straights ending at the backboard | FIBA Official Basketball Rules 2026, Rule Two 2.1, 2.5.2 to 2.5.7; the Equipment rules 1.1.3, 1.1.8, 1.2.1 |
| NCAA men | 94 by 50 feet; the lane 12 feet to the outside; the free-throw line 15 feet from the backboard's plane (19 from the baseline); the arc 22 ft 1¾ in, 21 ft 7⅞ in in the corners (the straights 40⅛ in from the sidelines); the restricted-area arc 4 feet to its inside edge; the lane-space marks 3, 1, 3, 3 and 3 feet apart and the 28-foot sideline marks (diagram) | NCAA Men's Basketball Rules 2026-27, 1-2-2, 1-6-1, 1-6-5, 1-7-1, 1-8, 1-13-1 |
| NCAA women | the same court; the restricted area is "the area directly underneath the basket", with no required arc since 2023-24 | NCAA Women's Basketball Rules, 1-8-1 |
| NFHS | an ideal court 84 by 50 feet (at most 94 by 50); the lane 12 feet; the free-throw line 15 feet from the backboard; the semicircle 19 ft 9 in from the basket, with 63-inch straights to the end line; the backboard 4 feet from the end line; no restricted-area arc | NFHS Basketball Rules, 1-1, 1-4-1, 1-5-1, 1-6, 1-7 (the 2017-18 text; the diagram is undated) |
| G League | the NBA's court: its rules are "in addition to the standard NBA game rules" | NBA G League playing rules; FAQ item 23 |

**Dated history, drawn with `year`.** The WNBA's lane was 12 feet and became 16 for 2004 (Seattle Times, 18 December 2003, a news report; the WNBA's own page was not readable). The NCAA's restricted-area arc: none, 3 feet in Division I men's and women's games from 2011-12 (NCAA News, 26 May 2011), 4 feet for the men from 2015-16 (NCAA.com, 15 May 2015) and for the women from 2017-18 (the women's playing rules history), and no required arc for the women from 2023-24.

**Dated, not drawn** (the earlier figure's other half is not in the sources, so a drawing would be made up): the NCAA men's three-point line, introduced in 1986-87 at 19 ft 9 in, moved to 20 ft 9 in in 2008-09 and 22 ft 1¾ in in 2019-20; the women's, 19 ft 9 in from 1987-88, 20 ft 9 in from 2011-12, 22 ft 1¾ in from 2021-22; the WNBA's, 20 ft 6¼ in from 2004 and 22 ft 1¾ in from 2013; FIBA's, 6.25 m until the rules of 1 October 2010 and 6.75 m after, with the trapezoid lane made a rectangle; the NFHS's, 19 ft 9 in from 1987-88. The corner distance of each earlier line was not found, and an arc shorter than the corner distance cannot be drawn.

**Ours.** The WNBA's basket and backboard distances (5 ft 3 in and 4 feet) are the NBA's: the WNBA diagram labels only the 15 inches from the board to the ring's centre. The small marks of the WNBA and NCAA courts are placed as the NBA's (7, 11, 14 and 17 feet from the baseline, from the diagram's 3, 1, 3, 3 and 3 feet) and the lower defensive box is the NBA's and the WNBA's alone. The NFHS backboard is drawn 6 feet wide (the rules allow 6 by 4, 6 by 3½ and a 54-inch fan). The NCAA arc of 4 feet is drawn at the figure the rule gives (to the inside edge). **Where sporty differs.** Its NCAA women's line is the 20 ft 9 in of before 2021-22; its FIBA no-charge arc is 1.25 m (the 2010 figure to the inner edge; the 2026 book gives 1.30 m to the outer edge, the same line); it has no small marks drawn for the NFHS court.

### Hockey

| League | Figures | Rule |
| --- | --- | --- |
| IIHF | 60 m by 26 to 30 m (30 drawn), corners 7.0 to 8.5 m (8.5 drawn); the goal line 4.0 m; the blue line 22.50 m (diagram); the circles 4.50 m, the spots 6.00 m from the goal line and 7.00 m either side of the axis (diagram), the neutral spots 1.50 m from the blue lines; the hash marks 60 cm long, 1.70 m apart; the crease radius 1.83 m, 2.45 m wide (diagram); the goal 1.83 m by 1.22 m; the trapezoid 6.80 m at the goal line and 8.60 m at the boards; the officials' crease 3.0 m | IIHF Official Rule Book 2025/26, 1.2, 1.5, 1.7 to 1.9 and Appendix VI (2026/27 the same) |
| NCAA men and women | 200 by 85 feet, corners 20 feet; the goal line 11 feet (10 to 15 allowed); the blue line 64 feet from the goal line (60 at least) so 75 from the boards; the circles 15 feet; the hash marks 5 ft 7 in apart; the men's trapezoid 22 feet and 28 feet from 2026-27 (Division I), the women's none | NCAA Men's and Women's Ice Hockey Rules 2026-27, 1.2, 1.4, 1.6, 1.9; NCAA.org, 23 July 2026 |
| AHL, ECHL, OHL, WHL | Rule 1 is the NHL's, nearly word for word (200 by 85 feet, 28-foot corners, goal line 11 feet, blue line 64 feet from the goal line); the side glass is 5 feet, not 6 | each league's rules 2025-26, Rule 1 |
| QMJHL | the same, with the hash marks 2 feet long and 5 feet apart | QMJHL Playing Rules 2025-26, 1 |
| USHL | the USA Hockey Junior rink, which its rules name: 185 to 200 by 85 to 100 feet (200 by 85 drawn), goal line 11 feet, blue line 64 feet from the goal line, circles 30 feet across, hash marks 2 feet long and 4 apart, no trapezoid | USA Hockey Junior Rules 2025-29, 101 to 105 |
| PWHL | the NHL's Rule 1 with no restricted area for goalkeepers | PWHL Rulebook 2025-26, 1.8 and 27.8 |

**Dated history, drawn with `year`.** The IIHF's blue lines were 22.86 m (75 feet) from the end boards in the 2018-22 book and are 22.50 m in the 2022/23 diagram; the goalkeepers' restricted area came with the unified rule book of 2021/22 (IIHF news, 25 June 2021). The AHL moved its blue lines 4 feet towards centre ice for 2005-06 (so they stood at 71 feet); the NCAA men's trapezoid is from 2026-27.

**Ours.** The IIHF rules give a range for the width and the corner radius; the largest is drawn. The IIHF net's depth (1 m) is ours: Rule 2 gives none. The USHL's corner radius is the NHL's: the rule says only "uniformly rounded". The 2022/23 blue line is read from a diagram that does not say which edge of the line is meant, and the 2018-22 distance "includes full line widths". The NHL's hash marks are 5 ft 7 in apart (Rule 1.9), and the AHL, ECHL, OHL, WHL and PWHL read the same words in their Rule 1, as does the NCAA; the QMJHL prints 5 feet and the USHL's source 4. **Where the sources disagree.** The NHL's Rule 1.8 and the diagram give a trapezoid 8 feet from each post (22 feet at the goal line), and Rule 27.8 says 6 feet (18 feet), in the 2024-25, 2025-26 and 2026-27 books alike (see Hockey above); the package draws 22. The ECHL's blue-line sentence reads "sixty feet (64')": the numeral is taken. **Where sporty differs.** Its IIHF rink is 60 by 30 m with a 4.5 m circle and 8.5 m corners as here; it draws the IIHF blue lines at the NHL's 15 m neutral zone (ours: 22.50 m from the boards, the same 15 m); its NCAA corner radius is 20 feet as here.

### Football

| League | Figures | Rule |
| --- | --- | --- |
| NCAA | 100 yards between the goal lines, 10-yard end zones, 160 feet wide; the hash marks 60 feet from each sideline (40 apart); the numbers up to 6 feet by 4, their tops 9 yards from the sideline; the posts on the end line, 18 ft 6 in apart | NCAA Football Rules 2026, 1-2-1-h, 1-2-1-j, 1-2-5, 2-12 and Appendix D |
| NFHS, 11 players | 360 by 160 feet; the hash marks 53 ft 4 in from each sideline (in thirds); the numbers' tops 9 yards in; the posts 23 ft 4 in apart | NFHS Football Rules (2021 text; the 2026 text is sold), 1-1-2, 1-2-3, 1-2-5; the 2026 diagrams |
| NFHS, 9 players | 80 by 40 yards between the goal lines, 10-yard end zones; the hash marks 48 ft 4 in from each sideline; the numbers' tops 7 yards in | the NFHS nine-player diagram and Rules Differences |
| NFHS, 8 and 6 players | the same size; the hash marks 45 feet from each sideline (the eight-player rules of Nebraska and Kansas follow the NFHS's) | the NFHS eight- and six-player diagram; NSAA Eight-Player Rules Differences; KSHSAA Football Manual |
| Texas six-man | 80 by 40 yards, the hash marks 40 feet from each sideline, the posts 25 feet apart; the rest is the NCAA's | UIL exceptions to the NCAA rules, 2026 |
| IFL (indoor) | 50 by 28 yards inside padded walls, 8-yard end zones; the wide set of hash marks 30 feet apart; the posts 10 feet apart, centred on the end line; yard lines every 5 yards; no yard numbers are named | 2024 IFL Rule Book, Rule 1, Articles 2, 3 and 5 |

**Ours.** The goal posts of every league added here are drawn as a slingshot, the common modern shape; the rules read give their width and place, not their shape. The numbers are drawn 6 feet tall for every league, as the NCAA and NFHS give them ("should be"). The NFHS states a restraining line and nine-yard marks, which are not drawn. The IFL's hash marks: the book names two sets, a wide one (30 feet apart) and a narrow one (10), and the wide is drawn. **Where sporty agrees and differs.** Its hash-mark distances, number places and field sizes for the NCAA and the NFHS 11-, 9-, 8- and 6-player fields are the same as these (its NFHS 9-player hash 7.78 yd apart is 23 ft 4 in). It has no Texas six-man or indoor field.

### Baseball and softball

| League | Figures | Rule |
| --- | --- | --- |
| MiLB | the Official Baseball Rules' 90-foot square, the plate 60 ft 6 in, 18-inch bases, a fence of at least 325 feet at the lines and 400 to the middle; Minor League Baseball's own facility standards are not public | Official Baseball Rules 2026, 2.01, 2.03, 2.04 |
| NCAA baseball | 90 feet, 60 ft 6 in, boxes 4 by 6 feet, the fence 330 feet at the lines, 375 in the alleys and 400 in the middle, the backstop 45 feet | NCAA Baseball Rules 2027-28, 1-2-a, 1-2-b, 1-3-a, 1-5-b |
| NFHS baseball | 90 feet, 60 ft 6 in, the mound's centre 59 feet, boxes 4 by 6 feet, a new fence at least 300 feet at the lines and 350 in the middle | NFHS Baseball Rules 2026, 1-2-1, 1-2-5, 1-2-6, 1-2-11, 2-7-2 |
| Little League | bases 60 feet, the pitching distance 46 feet (to the front of the plate), a fence of 200 feet; Intermediate (50/70): 70 and 50 feet, the infield arc 95 feet | Little League Field Specifications (2026) and its layouts |
| PONY | Pony 14U 80 and 54 feet, fence 275 and 315, backstop 40; Bronco 12U 70 and 50, 225 and 275, 30; Mustang 10U 60 and 46, 175 and 225 | PONY Baseball Rule Book 2026, Rule 7-A, 7-B, 7-D |
| NCAA softball | 60-foot base lines, the plate 43 feet, a pitcher's circle of 8 feet radius, the skinned arc 60 feet, boxes 3 by 7 feet, a new fence 200 feet at the lines and 220 in the middle | NCAA Softball Rules 2026-27, 2.4, 2.8, 2.15, 2.19, 2.25, 2.27 |
| NFHS softball | 60 feet and 43 for fast pitch, a 16-foot circle, the skinned infield 60 feet recommended, a fence arc of 185 to 235 feet (the least drawn) | NFHS Softball field diagram 2025; the comparison of USA Softball, NCAA and NFHS rules, 1-1-2, 1-1-3a, 1-2-2 |
| USA Softball fast pitch | adult women: 60 and 43 feet, a fence of 200 to 250 feet (200 drawn) | USA Softball Official Rules 2026, Rule 2 |
| USA Softball slow pitch | adult women: 70-foot bases, the plate 50 feet, the skinned arc 70 feet, a fence of 265 to 300 feet (265 drawn) | the same, the Official Distance Table |
| WBSC slow pitch | 65-foot bases, the plate 50 feet, the skinned arc 60 feet, a women's fence of at least 275 feet | WBSC Slow Pitch rules 2026-29, Appendix 1 F |

**Ours.** Where the rules give a range of fence distances the least is drawn, and where they give only the lines and the middle the fence is a curve through those points and no others. The infield's dirt arc is drawn at the rule's radius where it gives one (95 feet for the Little League Intermediate field, the NCAA and the NFHS; 60 and 70 feet for softball) and at 5 feet more than the bases elsewhere. Little League Majors' plate (18 by 4 inches) and home plate, and the 15-inch bases of Little League, PONY and the NFHS softball, are the figures of a secondary copy of its rule book or inferred (the rule text is in a phone app only). The pitching distance of PONY is from the plate's front edge, as for the other leagues: the book does not say. A softball pitcher's circle is drawn with the mound's dirt. The home plate, the 24 by 6 inch pitcher's plate and the running lane are as the Official Baseball Rules for every league that does not say otherwise. **Where sporty differs.** Its Little League has the plate 47 feet from home (46 to the middle of a 5-foot mound) and a 50-foot infield arc (the layouts label no such arc for the Majors), boxes of 3 by 7 feet (6 by 3 in the one copy of the rule found); its NCAA and NFHS baseball fences are 355 and 400 feet (the rules above give 330, 375 and 400, and at least 300 and 350); its PONY fence 265 and 315 (7-D gives 275 and 315).
