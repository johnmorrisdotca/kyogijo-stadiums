# Net, racket and court sports

Twelve court sports, each drawn to scale from its own rulebook. The first five are the net sports:  `sport: "tennis"` (the ITF's Rules of Tennis), `"volleyball"` (the FIVB's Official Volleyball Rules; beach volleyball is `league: "fivb-beach"`, from the FIVB's Beach Volleyball Rules), `"badminton"` (the BWF's Laws of Badminton), `"pickleball"` (USA Pickleball's rulebook) and `"tabletennis"` (the ITTF's Laws of Table Tennis). Seven more follow: `"padel"` (the FIP's Rules of Padel), `"squash"` (World Squash's court specifications), `"racquetball"` (the IRF's rules and court specifications), `"sepaktakraw"` (the ISTAF's Law of the Game), `"teqball"` (the FITEQ's rules), `"roundnet"` (the International Roundnet Federation's rules) and `"netball"` (World Netball's Rules of Netball); sitting volleyball is `league: "wpv-sitting"` of `volleyball` (World ParaVolley's rules). Every figure is cited, rule by rule, in [sources.md](./sources.md#the-net-sports). They lie wide, with the net across the middle (where there is one) and the teams' score on a board over it; `orientation: "portrait"` lays them tall. Squash, racquetball, roundnet and netball have no net, and netball is scored as a goals sport, with the usual score and not a board of sets.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const court = drawKyogijo({ sport: "tennis" });
const beach = drawKyogijo({ sport: "volleyball", league: "fivb-beach" });
console.log(court.includes('data-sport="tennis"'), beach.includes('data-look="sand"'));
// true true
console.log(court.match(/viewBox="([^"]*)"/)?.[1], "|", drawKyogijo({ sport: "tennis", orientation: "portrait" }).match(/viewBox="([^"]*)"/)?.[1]);
// -23.73 -14.73 125.46 65.46 | 0 0 65.46 125.46
```

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const sitting = drawKyogijo({ sport: "volleyball", league: "wpv-sitting" });
const squash = drawKyogijo({ sport: "squash" });
console.log(sitting.includes('data-league="wpv-sitting"'), squash.match(/viewBox="([^"]*)"/)?.[1]);
// true -16.28 -1.61 49.88 24.22
```

## The figures

Each is the rulebook's, in the unit it prints first: feet for the ITF and USA Pickleball, metres for the FIVB, the BWF and the ITTF. All court sizes are to the outside edge of the lines, as each book measures them.

| Sport | Court | The lines | The net |
| --- | --- | --- | --- |
| Tennis (ITF, Rule 1) | 78 ft by 36 ft for doubles, 27 ft wide for singles | the service lines 21 ft from the net, the centre service line between them, the centre mark 4 in long inside each baseline; lines 2 in wide (the rule allows 1 to 2 in, baselines up to 4) | 3 ft 6 in at the posts, 3 ft at the centre; the centres of the posts 3 ft outside the doubles court, singles sticks 3 ft outside the singles court |
| Volleyball (FIVB, Rules 1 and 2) | 18 by 9 m | lines 5 cm wide inside the dimensions; the centre line's axis in the middle; the attack line's rear edge 3 m from it; for the FIVB's competitions, the attack line extended by five 15 cm lines to 1.75 m | 1 m wide, 9.50 to 10 m long; 2.43 m (men) or 2.24 m (women) high; antennae 1.80 m long at the outer edge of the side bands; posts 0.50 to 1.00 m outside the side lines (1 m for the FIVB's competitions) |
| Beach volleyball (FIVB Beach, Rules 1 and 2) | 16 by 8 m | lines 5 cm wide, no centre line and no attack line | 8.5 m long, 1 m wide, the same heights; posts 0.70 to 1.00 m outside the side lines |
| Badminton (BWF, Law 1 and Diagram A) | 13.40 by 6.10 m, 5.18 m wide for singles | lines 40 mm wide; the short service lines 1.98 m from the net; the doubles long service lines 760 mm inside the back boundary; the centre lines from the short service lines to the back boundary | 1.524 m at the centre and 1.55 m over the side lines, 760 mm deep, at least 6.1 m wide; posts 1.55 m high on the doubles side lines |
| Pickleball (USA Pickleball, Section 3) | 44 by 20 ft | the non-volley zone 7 ft from the net on each side, the centerline from it to each baseline; lines 2 in wide | 36 in at the sidelines, 34 in at the center; posts 22 ft apart, inside to inside, at most 3 in across; at least 21 ft 9 in long |
| Table tennis (ITTF, Laws 2.1 and 2.2) | 2.74 by 1.525 m, 76 cm above the floor | a white side line and end line 2 cm wide, a centre line 3 mm wide | 15.25 cm above the playing surface, on posts 15.25 cm high whose outside limits are 15.25 cm outside the side line |
| Sitting volleyball (World ParaVolley, Rules 1 and 2) | 10 by 6 m | lines 5 cm wide inside the dimensions; the attack line's rear edge 2 m from the centre line's axis; for World ParaVolley's competitions the attack line extended by five 15 cm lines to 1.75 m | 0.80 m wide, 6.5 to 7 m long; 1.15 m (men) or 1.05 m (women) high; antennae 1.60 m long; posts 0.5 to 1.0 m outside the side lines (1 m for those competitions) |
| Padel (FIP, The Court) | 20 by 10 m inside its walls, a 0.5% tolerance | no lines round it; service lines 6.95 m from the net; the central service line, 20 cm past each service line; lines 5 cm wide | 10 m long, 0.88 m high at the centre and 0.92 m at the ends, on posts at most 1.05 m high; end walls 4 m high (3 m of wall, 1 m of fence), side walls of 4 m at each end with fence between |
| Squash (World Squash, Specifications 4 and 5, Appendices 1 and 2) | 9.75 by 6.4 m (singles), 7.62 m wide (doubles), 8.42 m wide (international competition width) | markings 50 mm wide; the short line's nearest edge 4.26 m from the back wall; the half court line from the back wall to it; two service boxes of 1.60 m inside their lines; on the front wall the tin 480 mm (330 mm for the wide court), the service line 1.78 m and the front wall line 4.57 m up | none |
| Racquetball (IRF, Rule 2.1 and the court specifications) | 40 by 20 feet, 20 feet high | lines 1 1/2 inches wide; the short line's back edge 20 feet from the back wall; the service line's front edge 5 feet in front of it; service boxes and drive serve lines 18 inches and 3 feet from the side walls; the broken receiving line 5 feet behind the short line | none |
| Sepak takraw (ISTAF, Laws 1 to 3) | 13.4 by 6.1 m | boundary lines at most 4 cm wide, drawn inwards; a centre line 2 cm wide; quarter circles of 0.9 m at the ends of the centre line; service circles of 0.3 m, their centres 2.45 m from the back line | 0.7 m wide, at least 6.1 m long; 1.52 m (men) or 1.42 m (women) high at the centre; posts 0.3 m outside the sidelines, 1.55 m (men) or 1.45 m (women) high |
| Teqball (FITEQ, sections 1 and 2) | at least 16 by 12 m, a table of 3.0 by 1.5 m in the exact middle | the halfway line, and a service line 3.5 m from the middle of the table on each side, each 20 to 50 mm wide; court surrounds 0.5 to 1.5 m high | 1.7 m wide, 20 mm thick, 140 mm above the table, which is 0.9 m high with the net |
| Roundnet (International Roundnet Federation, Rules 1.1 and 1.2) | at least 10 by 10 m, recommended, with no out of bounds | a serving line circle 2.6 m from the centre of the set, with a mark at each of the four service positions 90 degrees apart; a no hit zone line circle 0.9 m from the centre | a set 91.4 cm across and 20.3 cm high |
| Netball (World Netball, Rule 1) | 30.5 by 15.25 m, inside a court surround of 3.05 m | lines 50 mm wide; two transverse lines in thirds; a centre circle 0.9 m across; goal circles of 4.9 m radius, semicircles on the goal lines | goalposts 3.05 m high at the middle of each goal line, with a ring of 380 mm inside diameter |

```ts
import { dimensionsOf, surfaceSize } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
import { LEAGUES, leagueFigures } from "@johnmorrisdotca/kyogijo-stadiums/leagues";

console.log(surfaceSize("tennis", "ft"), surfaceSize("volleyball"), dimensionsOf("badminton", "m").shortServiceLine);
// { length: 78, width: 36, unit: 'ft' } { length: 18, width: 9, unit: 'm' } 1.98
console.log(leagueFigures(LEAGUES.tennis[0]).slice(0, 2).map(([name, value]) => `${name}: ${value}`).join("; "));
// court: 78 ft by 36 ft (singles 27 ft wide); service line: 21 ft from the net
console.log(leagueFigures(LEAGUES.volleyball[1]).slice(0, 2).map(([name, value]) => `${name}: ${value}`).join("; "));
// court: 16 m by 8 m; attack line: none
```

ATP and WTA matches are played by the ITF's rules, so there is one tennis league, `itf` (the sport's own). The volleyball sport has three: `fivb`, the indoor court, `fivb-beach` and `wpv-sitting`, World ParaVolley's sitting volleyball court. Squash has three: `wsf` (singles), `wsf-doubles` and `wsf-doubles-wide` (the international competition width). The other sports have one league each, the sport's own.

## Options

| Option | What it does |
| --- | --- |
| `league` | Volleyball: `fivb` (the default), `fivb-beach` or `wpv-sitting`; squash: `wsf` (the default, singles), `wsf-doubles` or `wsf-doubles-wide`. The other sports have one rulebook each. |
| `net.look` | A named look (below): the colour of the court and of the ground round it. The lines and the sizes are the rulebook's whatever the look. An unknown name is an error that lists the ones the sport has. |
| `net.free` | The free zone drawn round the court: `official` (the default), `least` or `none`. Where a rulebook gives figures: tennis's Appendix X recommends 21 ft behind the baselines and 12 ft beside the sidelines for international play (`official`) and 18 ft and 10 ft for clubs (`least`); volleyball's Rule 1.1 asks 5 m beside the side lines and 6.5 m behind the end lines for the FIVB's competitions (`official`, with its extension of the attack line and its posts 1 m out) and 3 m all round at least (`least`, with the posts 0.5 m out and no extension); beach volleyball's 5 and 3 m; pickleball's 3.A.3 recommends a playing surface of 34 by 64 ft for tournaments (`official`) and asks at least 30 by 60 (`least`); sitting volleyball's Rule 1.1 asks 4 m beside the side lines and 6 m behind the end lines for World ParaVolley's competitions (`official`) and 3 m at least (`least`); sepak takraw's Law 1.5 asks 3.0 m round the court and netball's Rule 1 (item 8) a court surround of 3.05 m (one figure each, so `official` and `least` are the same). Badminton's Laws, the ITTF's, the FIP's, World Squash's, the IRF's, the FITEQ's and the Roundnet Federation's give no figure, so there is no zone to draw. |
| `net.sticks` | Tennis: draw the two singles sticks that hold a doubles net up for a singles match, 3 ft outside the singles court (Rule 1). Off by default. |
| `orientation` | `landscape` (the default for these sports), `portrait` or `auto`. |
| `detail: "simple"` | Leaves out the singles sticks, the antennae and the short lines outside a volleyball court (the extension of the attack line, the service zone's limits). |
| `exactLines` | Lines at their true widths (the lines are drawn a little thicker than painted otherwise, as the other surfaces' are). |
| `margin` | The ground drawn beyond the free zone, in `units` (feet by default). |

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const club = drawKyogijo({ sport: "tennis", net: { free: "least", sticks: true } });
console.log(club.match(/class="ky-free" x="([^"]*)" y="([^"]*)"/)?.slice(1).join(" "), (club.match(/class="ky-nt-post"/g) ?? []).length);
// -18 -10 4
```

### Looks

The colours are ours: no rulebook prints a colour for a tennis court or a pickleball court (the FIVB asks only that the court, the free zone and the lines differ; where a rulebook prefers or recommends one, the table says so). Each look has a light and a dark set, chosen by the device's setting, `data-theme` or `theme`, as the other surfaces' are.

| `sport` | `net.look` (the first is the default) |
| --- | --- |
| `tennis` | `hard-blue`, `hard-green`, `clay`, `grass` |
| `volleyball` | `wood`, `blue`, `sand` (the default for `fivb-beach`, with its lines in blue); `wpv-sitting` has `wood` only, since World ParaVolley asks for a light indoor floor and white lines (Rule 1.2.2) |
| `badminton` | `green`, `blue`, `wood` |
| `pickleball` | `blue-green` (a blue court on green ground, the non-volley zone lighter), `green`, `red` |
| `tabletennis` | `blue`, `green` |
| `padel` | `blue`, `green`, `terracotta` (the FIP's rules prefer a floor in green, blue or terracotta, and lines white or black: white here) |
| `squash` | `wood` (red lines), `blue` (white lines on the floor, red on the wall); the front wall, laid flat, is drawn pale. World Squash's specification asks only that markings contrast with the surfaces beside them (5.01.01) and lets them be any colour that does, the wall's lines unlike the floor's (10.13); red is ours, as the colour squash lines are painted |
| `racquetball` | `wood` (the IRF's recommended bright red lines), `convertible` (blue lines, which the IRF recommends, with black, on a convertible court with a movable glass back wall); the floor is light, so the lines read at 3:1 |
| `sepaktakraw` | `blue`, `green`, `wood` |
| `teqball` | `grey` (a blue table on a grey floor), `blue`, `green` (the FITEQ asks that the table, the floor, the surrounds and the ball all differ in colour) |
| `roundnet` | `grass`, `sand`, `indoor` |
| `netball` | `wood` (the Rules say a wooden surface, preferably sprung), `blue`, `green`; the lines are white, which the Rules prefer |

The look is the drawing's `data-look`, and its rules are written into the drawing for that look only. `KYOGIJO_COURTS_STYLE` has every look for a page that draws with `style: "none"` (and is part of `KYOGIJO_STYLE`).

## A score

A net sport's score is a board over the net, with a team in each row (netball, which is scored in goals, has the usual score instead, with the teams' names in its goal thirds and the home team on the left; a roundnet court has no net to lie over, so its board lies on the ground below the serving line). A team's `sets` is its score in each set (in tennis and padel its games; in the other sports the points of each set or game), in order, and the set in progress is the last one given. `score` is the sets (or games) it has won. In tennis `points` is the game in progress (`0`, `15`, `30`, `40`, `Ad`, or a tie-break's points) and `tiebreaks` the points of a tie-break in a set, written small beside the games. `serving` puts a ball beside the team that is serving, on the board and in the corner of its block on the badge.

The board has as many columns as the sets a match can run to (tennis 3, volleyball 5, beach volleyball 3, sitting volleyball 5, badminton 3, pickleball 3, table tennis 5, padel 3, squash 5, racquetball 5, sepak takraw 3, teqball 3, roundnet 3) and more when a team gives more, a column for the points of the game when a team has any, and a column of the sets or games won ("Sets" for tennis, volleyball, padel, sepak takraw and teqball, "Games" for badminton, pickleball, table tennis, squash, racquetball and roundnet, which is the word each rulebook uses). In each set the lower score is dimmed.

```ts
import { drawKyogijo, statusLabel } from "@johnmorrisdotca/kyogijo-stadiums";

const game = {
  sport: "tennis" as const,
  away: { name: "Harbour City Gulls", abbr: "HCG", score: 1, color: "#1d4f91", sets: [6, 6, 2], tiebreaks: [5, null, null], points: "40", serving: true },
  home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 1, color: "#a8452c", sets: [7, 3, 3], points: "30" },
  status: "set-3",
};
const svg = drawKyogijo(game);
console.log(svg.includes("Set 3"), svg.includes("Harbour City Gulls is serving."));
// true true
console.log(statusLabel("set-3"), statusLabel("tiebreak"), statusLabel("set-3", "ja"), statusLabel("Game 2", "ja"));
// Set 3 Tiebreak 第3セット 第2ゲーム
```

- **Statuses.** `set-3` (or "Set 3", or `第3セット`) is "Set 3", `game-2` is "Game 2", and `tiebreak`, `match-tiebreak`, `retired` and `walkover` are written out; `final` decides the winner as for any game. The status is also the board's foot. A tie-break game goes to seven points with a lead of two (Rule 5(b)); the 5 in `tiebreaks` is the loser's points in the tie-break that decided the set, as scores are written, 7-6(5).
- **The sizes.** `size: "badge"` is the strip, with the court as its picture; `size: "compact"` is the court with that strip under it. A tall court has its board turned back, upright.
- **The description** says who is serving, each team's score in each set (or game) and, in tennis, the points of the game, as well as the score, so that a reader who cannot see the board has it. A tie-break is written in brackets after its set: "6 (5), 6, 2".
- **Words.** All of it is in English and Japanese. The Japanese of each string is in [strings-ja.md](./strings-ja.md).

## How the newer courts are laid out

- **Padel** has no lines round it: its walls are its limits. The end walls and the 4 m walls at the ends of the sides are drawn solid, the metal fence between them lighter. The central service line runs under the net and 20 cm past each service line (the Rules' least).
- **Squash and racquetball** lie with the front wall at the left and the walls drawn round the court. A squash court's front wall is laid flat beside it, as if hinged on its foot, so that its lines show at their heights: the tin, the service line and the front wall line. The back wall line and the side wall line (which slopes from 4.57 m to 2.13 m) are held in the figures and not drawn. A racquetball court's receiving line is drawn broken, as the IRF specifies: a 21 inch segment at each wall and sixteen of 6 inches between.
- **Sepak takraw** has four quarter circles, one inside the court on each side of the net at each end of the centre line, which together read as a half circle across the net, and a service circle on each side.
- **Teqball** has its table (3 m by 1.5 m) in the middle, its net across the middle of the table's length and the halfway line under it.
- **Roundnet** has no sides: a square of ground, the set in the middle and its two circles. It is square, so `orientation: "portrait"` draws it the same.
- **Netball** has its goalposts at the middle of each goal line, each with its ring seen from above.

## Zones and frames

The zone set `net-court` counts a data layer's marks into each side of the net, split at the court's own line: tennis's service line, volleyball's attack line (sitting volleyball's is 2 m), badminton's short service line, pickleball's non-volley zone line, padel's service line and teqball's, into a front court and a back court; beach volleyball, table tennis and sepak takraw have no such line, so each side is one half court ([data layers](./layers.md)). Squash and racquetball have the set `wall-court` (the front court, from the front wall to the short line, and the back court behind it), roundnet `roundnet-rings` (the no hit zone, the ring out to the serving line, and the rest of the court) and netball the `field-thirds` it shares with the field sports (its goal thirds and centre third). The zones are ours: the rules name the lines and not the areas.

Each sport has a frame of its own, named like the sport: the centre of the net, on the court, as the origin (the centre of the court, for squash, racquetball, roundnet and netball, which have no net), with x along the court (positive towards the end drawn at the right) and y across it (positive towards the top as the court is drawn wide), in the unit its rulebook prints first ([coordinate frames](./frames.md)). Most have one size each; a volleyball court is indoor, beach or sitting and a squash court singles, doubles or wide doubles, so their frames are given the size they are placed on.

```ts
import { toSurface } from "@johnmorrisdotca/kyogijo-stadiums/frames";

// The T of the right half: the service line is 21 feet from the net, on the centre service line.
console.log(toSurface([[21, 0]], { from: "tennis" }));
// [ [ 60, 18 ] ]
```

## Where it differs from `@sportsdataverse/sporty`

[`@sportsdataverse/sporty`](https://github.com/sportsdataverse/sdvplot-js) (MIT) draws tennis and volleyball too. Its numbers for the ITF's court (it lists the ATP, ITA, ITF, NCAA, USTA and WTA with the same figures) are the same as these: 78 by 27 and 36 feet, the service lines 21 feet from the net, a centre mark of 4 inches, a net of 42 feet between the posts. Where this package differs, and why:

- **Pickleball, badminton, table tennis, beach volleyball, sitting volleyball, padel, squash, racquetball, sepak takraw, teqball, roundnet and netball are not in it**; here each has its own rulebook cited.
- **The line widths and the fixtures.** Its tennis lines are 2 inches wide, the greatest of the rule's 1 to 2 inches for the lines other than the baselines; so are these, drawn a little thicker unless `exactLines` is set. Its table has the court, the net's length, the line's thickness and the run-back (21 and 12 feet, which are Appendix X's international figures); it has no singles sticks, no centre service line width and no net heights. Here they are (Rule 1), the sticks are drawn on request, and Appendix X's club figures (18 and 10 feet) are `net.free: "least"`.
- **Volleyball's free zone** is a number per league in its table (5 and 6.5 m for the FIVB, 3 and 4.5 m for the NCAA and USA Volleyball); here it is the FIVB's rule (1.1: at least 3 m, and for the FIVB's competitions 5 m beside the side lines and 6.5 m behind the end lines), as the rulebook gives it, with the choice between them in `net.free`. The NCAA's and USA Volleyball's own books are not read here, so those two leagues are not drawn.
- **The attack line.** Its table has `attack_line_edge_to_center_line: 3` too; here it is read as the rule words it: the rear edge is 3 m from the axis of the centre line (Rule 1.3.4). The FIVB's competitions' extension of five 15 cm lines to 1.75 m is part of `official`.
- **The rest of the rules around the court** (which side of the net a zone is, a tie-break, the order of play in a set) are in the code here, from the rules cited.

No code of sporty, and none of GPL-3.0 sportypy or sportyR, was used: only sporty's table of numbers was read, as facts, and every figure was read again from the rulebooks.

## What is not drawn

The tennis courts for 10-and-under play (the ITF's "Red" and "Orange" courts of Appendix VIII), the net's mesh and tape, the umpire's chair and the officials' places, the warm-up areas, the volleyball substitution and libero replacement zones and warm-up areas (1.4.3 to 1.4.5), pickleball's server number and its stadium court (3.A.3: 50 by 80 feet), the table tennis table's legs, padel's entrances and its safety area for play outside the court, squash's back wall and side wall lines, its ceiling and its door, racquetball's out-of-court line on the back wall and its screen lines, the sepak takraw A-board, the teqball table's curve, roundnet's rims and legs and netball's bench zone and the ring's net. They are left for another change, not for want of a rule.
