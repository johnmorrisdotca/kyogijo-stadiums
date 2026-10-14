# Tennis, volleyball, badminton, pickleball and table tennis

Five net sports, each drawn to scale from its own rulebook: `sport: "tennis"` (the ITF's Rules of Tennis), `"volleyball"` (the FIVB's Official Volleyball Rules; beach volleyball is `league: "fivb-beach"`, from the FIVB's Beach Volleyball Rules), `"badminton"` (the BWF's Laws of Badminton), `"pickleball"` (USA Pickleball's rulebook) and `"tabletennis"` (the ITTF's Laws of Table Tennis). Every figure is cited, rule by rule, in [sources.md](./sources.md#the-net-sports). They lie wide, with the net across the middle and the teams' score on a board over it; `orientation: "portrait"` lays them tall.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const court = drawKyogijo({ sport: "tennis" });
const beach = drawKyogijo({ sport: "volleyball", league: "fivb-beach" });
console.log(court.includes('data-sport="tennis"'), beach.includes('data-look="sand"'));
// true true
console.log(court.match(/viewBox="([^"]*)"/)?.[1], "|", drawKyogijo({ sport: "tennis", orientation: "portrait" }).match(/viewBox="([^"]*)"/)?.[1]);
// -23.73 -14.73 125.46 65.46 | 0 0 65.46 125.46
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

ATP and WTA matches are played by the ITF's rules, so there is one tennis league, `itf` (the sport's own). The volleyball sport has two: `fivb`, the indoor court, and `fivb-beach`.

## Options

| Option | What it does |
| --- | --- |
| `league` | Volleyball only: `fivb` (the default) or `fivb-beach`. The other sports have one rulebook each. |
| `net.look` | A named look (below): the colour of the court and of the ground round it. The lines and the sizes are the rulebook's whatever the look. An unknown name is an error that lists the ones the sport has. |
| `net.free` | The free zone drawn round the court: `official` (the default), `least` or `none`. Where a rulebook gives figures: tennis's Appendix X recommends 21 ft behind the baselines and 12 ft beside the sidelines for international play (`official`) and 18 ft and 10 ft for clubs (`least`); volleyball's Rule 1.1 asks 5 m beside the side lines and 6.5 m behind the end lines for the FIVB's competitions (`official`, with its extension of the attack line and its posts 1 m out) and 3 m all round at least (`least`, with the posts 0.5 m out and no extension); beach volleyball's 5 and 3 m; pickleball's 3.A.3 recommends a playing surface of 34 by 64 ft for tournaments (`official`) and asks at least 30 by 60 (`least`). Badminton's Laws and the ITTF's give no figure, so there is no zone to draw. |
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

The colours are ours: no rulebook prints a colour for a tennis court or a pickleball court (the FIVB asks only that the court, the free zone and the lines differ). Each look has a light and a dark set, chosen by the device's setting, `data-theme` or `theme`, as the other surfaces' are.

| `sport` | `net.look` (the first is the default) |
| --- | --- |
| `tennis` | `hard-blue`, `hard-green`, `clay`, `grass` |
| `volleyball` | `wood`, `blue`, `sand` (the default for `fivb-beach`, with its lines in blue) |
| `badminton` | `green`, `blue`, `wood` |
| `pickleball` | `blue-green` (a blue court on green ground, the non-volley zone lighter), `green`, `red` |
| `tabletennis` | `blue`, `green` |

The look is the drawing's `data-look`, and its rules are written into the drawing for that look only. `KYOGIJO_COURTS_STYLE` has every look for a page that draws with `style: "none"` (and is part of `KYOGIJO_STYLE`).

## A score

A net sport's score is a board over the net, with a team in each row. A team's `sets` is its score in each set (in tennis its games; in pickleball and table tennis the points of each game), in order, and the set in progress is the last one given. `score` is the sets (or games) it has won. In tennis `points` is the game in progress (`0`, `15`, `30`, `40`, `Ad`, or a tie-break's points) and `tiebreaks` the points of a tie-break in a set, written small beside the games. `serving` puts a ball beside the team that is serving, on the board and in the corner of its block on the badge.

The board has as many columns as the sets a match can run to (tennis 3, volleyball 5, beach volleyball 3, badminton 3, pickleball 3, table tennis 5) and more when a team gives more, a column for the points of the game when a team has any, and a column of the sets or games won ("Sets" for tennis and volleyball, "Games" for badminton, pickleball and table tennis, which is the word each rulebook uses). In each set the lower score is dimmed.

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

## Zones and frames

The zone set `net-court` counts a data layer's marks into each side of the net, split at the court's own line: tennis's service line, volleyball's attack line, badminton's short service line and pickleball's non-volley zone line, into a front court and a back court; beach volleyball and table tennis have no such line, so each side is one half court ([data layers](./layers.md)). The zones are ours: the rules name the lines and not the areas.

Each sport has a frame of its own, named like the sport: the centre of the net, on the court, as the origin, with x along the court (positive towards the end drawn at the right) and y across it (positive towards the top as the court is drawn wide), in the unit its rulebook prints first ([coordinate frames](./frames.md)). Tennis, badminton, pickleball and table tennis have one size each; a volleyball court is indoor or beach, so its frame is given the size it is placed on.

```ts
import { toSurface } from "@johnmorrisdotca/kyogijo-stadiums/frames";

// The T of the right half: the service line is 21 feet from the net, on the centre service line.
console.log(toSurface([[21, 0]], { from: "tennis" }));
// [ [ 60, 18 ] ]
```

## Where it differs from `@sportsdataverse/sporty`

[`@sportsdataverse/sporty`](https://github.com/sportsdataverse/sdvplot-js) (MIT) draws tennis and volleyball too. Its numbers for the ITF's court (it lists the ATP, ITA, ITF, NCAA, USTA and WTA with the same figures) are the same as these: 78 by 27 and 36 feet, the service lines 21 feet from the net, a centre mark of 4 inches, a net of 42 feet between the posts. Where this package differs, and why:

- **Pickleball, badminton, table tennis and beach volleyball are not in it**; here each has its own rulebook cited.
- **The line widths and the fixtures.** Its tennis lines are 2 inches wide, the greatest of the rule's 1 to 2 inches for the lines other than the baselines; so are these, drawn a little thicker unless `exactLines` is set. Its table has the court, the net's length, the line's thickness and the run-back (21 and 12 feet, which are Appendix X's international figures); it has no singles sticks, no centre service line width and no net heights. Here they are (Rule 1), the sticks are drawn on request, and Appendix X's club figures (18 and 10 feet) are `net.free: "least"`.
- **Volleyball's free zone** is a number per league in its table (5 and 6.5 m for the FIVB, 3 and 4.5 m for the NCAA and USA Volleyball); here it is the FIVB's rule (1.1: at least 3 m, and for the FIVB's competitions 5 m beside the side lines and 6.5 m behind the end lines), as the rulebook gives it, with the choice between them in `net.free`. The NCAA's and USA Volleyball's own books are not read here, so those two leagues are not drawn.
- **The attack line.** Its table has `attack_line_edge_to_center_line: 3` too; here it is read as the rule words it: the rear edge is 3 m from the axis of the centre line (Rule 1.3.4). The FIVB's competitions' extension of five 15 cm lines to 1.75 m is part of `official`.
- **The rest of the rules around the court** (which side of the net a zone is, a tie-break, the order of play in a set) are in the code here, from the rules cited.

No code of sporty, and none of GPL-3.0 sportypy or sportyR, was used: only sporty's table of numbers was read, as facts, and every figure was read again from the rulebooks.

## What is not drawn

The tennis courts for 10-and-under play (the ITF's "Red" and "Orange" courts of Appendix VIII), the net's mesh and tape, the umpire's chair and the officials' places, the warm-up areas, the volleyball substitution and libero replacement zones and warm-up areas (1.4.3 to 1.4.5), pickleball's server number and the table tennis table's legs. They are left for another change, not for want of a rule.
