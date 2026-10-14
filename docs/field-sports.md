# Lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey and handball

Seven field sports, each drawn to scale from its own current rulebook: `sport: "lacrosse"` (World Lacrosse's men's and women's fields and its box floor, the NCAA's men's and women's fields, the PLL's field and the NLL's floor), `"rugby"` (World Rugby's Law 1 for union; the NRL's and the IRL's playing field for league), `"afl"` (the AFL's Laws of Australian Football), `"gaelic"` (the GAA's field, for football and for hurling), `"cricket"` (the Laws of Cricket and the ICC's playing conditions), `"fieldhockey"` (the FIH's Rules of Hockey) and `"handball"` (the IHF's Rules of the Game for Indoor Handball). Every figure is cited, rule by rule, in [sources.md](./sources.md#the-field-sports). They lie wide, with the teams' names at the ends and the score in the middle; `orientation: "portrait"` lays them tall.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const rugby = drawKyogijo({ sport: "rugby" });
const ground = drawKyogijo({ sport: "afl", field: { ground: "mcg" } });
console.log(rugby.includes('data-sport="rugby"'), ground.includes('data-sport="afl"'));
// true true
console.log(rugby.match(/viewBox="([^"]*)"/)?.[1], "|", drawKyogijo({ sport: "rugby", orientation: "portrait" }).match(/viewBox="([^"]*)"/)?.[1]);
// -16.4 -16.4 426.51 262.47 | 0 0 262.47 426.51
```

## The figures

Each is the rulebook's, in the unit it prints first: metres for World Rugby, the NRL and the IRL, the AFL, the GAA, the FIH, the IHF and World Lacrosse's fields; yards for cricket's pitch and boundary, the NCAA's men's field and the PLL's; feet for the box floor. Where a rulebook gives a range, the range is kept and a size inside it is drawn (the greatest, unless this says another): `field.length` and `field.width` ask for another.

| Sport | The surface | The marks |
| --- | --- | --- |
| Rugby union (World Rugby, Law 1, 2026) | the field of play 94 to 100 m between the try lines and 68 to 70 m wide; each in-goal 6 to 22 m deep (10 m drawn: the Law names none) | the 22-metre lines 22 m from the try lines; the half-way line; dash lines 5 m and 15 m from the touchlines, 10 m either side of the half-way line and 5 m from the try lines, each dash 5 m; the half-way mark 0.5 m; goal posts 5.6 m apart on the try line, the crossbar 3 m up; 14 flag posts |
| Rugby league (NRL, Sections 1 and 18, 2023; IRL, Section 1, 2024) | 100 m between the goal lines and 68 m wide; in-goal 8 m (the NRL's) or 6 to 11 m (the IRL's) | a line across the field every 10 m, the 20 m and 40 m lines red (the NRL); the scrum lines 10 m and 20 m in from the touchlines (the NRL); posts 5.5 m apart, the crossbar 3 m up; lines 15 cm |
| Australian football (AFL, Law 3, 2026) | an oval, 135 to 185 m long (goal line to goal line) and 110 to 155 m wide; the MCG's 160 by 141 m drawn | goal posts 6.4 m apart, behind posts 6.4 m either side; the goal square 9 m deep; the centre square 50 by 50 m, the Centre Circle 3 m and the Ten Metre Circle 10 m across; a Fifty Metre Arc at each end |
| Gaelic games (GAA, Rule 1, 2026) | 130 to 145 m by 80 to 90 m, football and hurling alike | lines across at 13, 20 and 45 m (and, for hurling, 65 m) from each end line; the 10 m midline with dashes of 5 m at intervals of 5 m; goalposts 6.5 m apart, the crossbar 2.5 m up; a rectangle 14 by 4.5 m and one 19 by 13 m at each end; a 13 m arc on each 20 m line; for football, a 40 m arc and the penalty point 11 m out |
| Cricket (MCC Laws 6 to 8, 2026; ICC, October 2026) | a pitch 22 yards by 10 feet in a ground whose boundary is a parameter: 65 to 90 yards from the centre of the pitch for the men, 60 to 70 for the women | the bowling crease 8 ft 8 in, the popping crease 4 ft in front of it, return creases 4 ft 4 in either side of the middle stumps, wickets 9 in wide; the fielding restriction's circle, two semicircles of 30 yards (25.15 for the women) about the middle stumps, joined by two lines |
| Field hockey (FIH, 2026) | 91.40 by 55.00 m, lines 75 mm | the 22.90 m lines; the circle, a 3.66 m line 14.63 m from the back-line with quarter-circles to it; the broken line 5 m outside it; penalty spots; goals 3.66 m by 2.14 m; marks outside the pitch and flag-posts |
| Team handball (IHF, 2025) | 40 by 20 m, lines 5 cm | goals 3 by 2 m; the goal-area line (6 m); the free-throw line (9 m), broken, 15 cm and 15 cm; the 7-metre and 4-metre lines; the throw-off area 4 m across; the substitution lines' end marks |
| Lacrosse (World Lacrosse, the NCAA, the PLL, the NLL) | a field 91.4 to 100 by 50 to 60 m (World Lacrosse), 110 by 60 yd (the NCAA's men's), 101 to 110 by 55 to 64 m (the NCAA's women's), 100 by 60 yd (the PLL), or a floor 180 to 200 by 85 ft with rounded corners and boards | goals 6 ft (1.83 m) by 6 ft, or 4 ft 9 in by 4 ft on the floor; the crease; the restraining lines; wing lines; the women's goal circle, marking areas, arc and fan; the PLL's two-point arc; the floor's face-off circle and spots |

```ts
import { dimensionsOf, surfaceSize } from "@johnmorrisdotca/kyogijo-stadiums/geometry";
import { LEAGUES, leagueFigures, leagueSize } from "@johnmorrisdotca/kyogijo-stadiums/leagues";

console.log(surfaceSize("handball"), dimensionsOf("fieldhockey", "m").circleRadius);
// { length: 40, width: 20, unit: 'm' } 14.63
console.log(leagueFigures(LEAGUES.rugby[1]).slice(0, 2).map(([name, value]) => `${name}: ${value}`).join("; "));
// field of play: 100 m by 68 m; in-goal: 8 m deep
console.log(leagueFigures(LEAGUES.cricket[0]).slice(0, 2).map(([name, value]) => `${name}: ${value}`).join("; "), leagueSize("rugby", "nrl"));
// pitch: 22 yd by 10 ft; bowling crease: 8 ft 8 in long { length: 116, width: 68, unit: 'm' }
```

The leagues, the sport's own first:

| `sport` | `league` | Surface |
| --- | --- | --- |
| `lacrosse` | `world-men` (the default), `world-women`, `ncaa-men`, `ncaa-women`, `pll`, `nll`, `world-box` | World Lacrosse's men's field, its women's field, the NCAA's two fields, the PLL's field, the NLL's floor, World Lacrosse's box floor |
| `rugby` | `world-rugby` (the default), `nrl`, `irl` | rugby union, then rugby league as the NRL and the IRL mark it |
| `afl` | `afl` | the Laws' ground |
| `gaelic` | `gaa-football` (the default), `gaa-hurling` | football, hurling |
| `cricket` | `icc-men` (the default), `icc-women`, `mcc` | the ICC's men's ground with the 30-yard circle, the women's with its 25.15-yard circle, and the Laws' ground, which has no circle |
| `fieldhockey` | `fih` | the FIH's pitch |
| `handball` | `ihf` | the IHF's court |

## Options

| Option | What it does |
| --- | --- |
| `league` | The rulebook, as in the table above. |
| `field.length`, `field.width` | The size of the surface, in `units` (feet by default), within the league's range: rugby's try line to try line, the AFL's goal line to goal line, the other sports' end line to end line. A size outside the range is an error that says it, in the league's own unit. |
| `field.inGoal` | Rugby: how deep each in-goal area is, within the league's range (6 to 22 m in union, 6 to 11 m in the IRL's league). |
| `field.ground` | Australian football: a named ground (`mcg`, `optus-stadium`, `gabba`, `scg`, `marvel-stadium`, `gmhba-stadium`), at the length and width the AFL's venue page prints. `length` and `width` win over it. |
| `field.boundary` | Cricket: the boundary, as its distance from the centre of the pitch (a circle) or `{ straight, square }` (an ellipse), within the league's range. |
| `field.circle` | Cricket: `false` leaves out the fielding restriction's circle. |
| `orientation` | `landscape` (the default), `portrait` or `auto`. A cricket ground is round unless its boundary says otherwise. |
| `goals` | How the goals are drawn, as for a soccer pitch: `box`, `line`, `strip` or `none`; `goalMarkup` draws them as you say. |
| `detail: "simple"` | Leaves out the flag posts, the posts of an Australian football ground, the corner marks and the small marks of a pitch, a cricket ground's return creases. |
| `exactLines` | Lines at their true widths. Where a book prints none (the AFL's, the NLL's, World Rugby's, the Laws'), the figure drawn is ours, and `docs/sources.md` says so. |
| `stripes`, `stripePattern` | The mown bands of the grass: on by default for the grass sports, not for handball or the box floor. |

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const short = drawKyogijo({ sport: "rugby", units: "m", field: { length: 94, width: 68, inGoal: 6 } });
console.log(short.match(/viewBox="([^"]*)"/)?.[1]);
// -16.4 -16.4 380.58 255.91
const refused = (): string => {
  try {
    return drawKyogijo({ sport: "afl", units: "m", field: { length: 190 } });
  } catch (error) {
    return (error as Error).message;
  }
};
console.log(refused());
// The length of 190 m is outside what the rules allow: 135 to 185 m
```

## A score

Rugby, lacrosse, field hockey and handball write a score as every other surface does: the team's `score`, its name painted at its end (in a rugby field's in-goal areas, in the teams' colours) and the score in the middle. The others write it their own way.

- **Australian football** writes goals, behinds and the total: a team's `goals` and `behinds` are written `10.12 (72)`, a goal being 6 and a behind 1. The total is worked out unless the team gives a `score`.
- **Gaelic games** write goals, points and the total: a team's `goals` and `points` are written `2-14 (20)`, a goal being 3 and a point 1.
- **Cricket** has a board, as curling and the net sports have: a team's `score` is its runs, `wickets` the wickets it has lost, written `245/6`, and `overs` the overs it has faced; for a match of more than one innings, `innings` is each innings as `"312"` or `"178/4"`. `innings-2` (or "Innings 2", or `第2イニング`) is a status.

```ts
import { drawKyogijo, statusLabel } from "@johnmorrisdotca/kyogijo-stadiums";

const afl = drawKyogijo({
  sport: "afl",
  away: { name: "Harbour City Gulls", abbr: "HCG", goals: 10, behinds: 12, color: "#1d4f91" },
  home: { name: "Prairie Ridge Bison", abbr: "PRB", goals: 9, behinds: 14, color: "#a8452c" },
  status: "final",
});
console.log(afl.includes("10.12 (72)"), afl.includes("Harbour City Gulls scored 10 goals and 12 behinds."));
// true true
const cricket = drawKyogijo({
  sport: "cricket",
  away: { name: "Harbour City Gulls", abbr: "HCG", score: 245, wickets: 6, overs: "50", color: "#1d4f91", innings: [245] },
  home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 187, wickets: 10, overs: "41.2", color: "#a8452c", innings: [187] },
  status: "final",
});
console.log(cricket.includes("245/6"), cricket.includes("Harbour City Gulls: 245 runs for 6 wickets in 50 overs."));
console.log(statusLabel("innings-2"), statusLabel("innings-2", "ja"));
// true true
// Innings 2 第2イニング
```

- **Winners.** `final` decides the winner by the total (the runs, or the goals and behinds worked out); a level game has none.
- **The sizes.** `size: "badge"` is the strip, with the field as its picture; `size: "compact"` is the surface with that strip under it. A cricket ground has no place to paint a team's name, so its board names the teams.
- **The description** says each team's goals and behinds (or points), or its runs, wickets, overs and innings, as well as the score, so that a reader who cannot see it has it.

## Ranges, zones and frames

Each sport has named ranges ([display ranges](./ranges.md)): rugby `half`, `twenty-two` (union) or `twenty` (league) and `in-goal`; lacrosse `half` and `crease`; Australian football `half`, `forward-fifty` and `centre-square`; the Gaelic games `half` and `large-rectangle`; cricket `pitch` and, where the league has one, `circle`; field hockey `half`, `circle` and `twenty-three`; handball `half` and `goal-area`. A range the league has not is an error that says so.

The zone set `field-thirds` counts a data layer's marks into the thirds of a field, from the team's own end, for every sport but cricket; `cricket-ground` counts them into the pitch, the ground inside the fielding circle and the outfield ([data layers](./layers.md)). The thirds are ours; the rules name the lines, not the areas.

Each sport has a frame of its own, named like the sport: the centre of the surface as the origin, x along it (positive towards the end drawn at the right) and y across it (positive towards the top as it is drawn wide), in metres, and in yards for cricket, fitted to the size the surface is drawn at ([coordinate frames](./frames.md)).

```ts
import { toSurface } from "@johnmorrisdotca/kyogijo-stadiums/frames";

// The middle of the right 22-metre line of a rugby field 120 metres long with its in-goal areas: 28 metres to the right of the centre.
console.log(toSurface([[28, 0]], { from: "rugby", size: { length: 393.7, width: 229.66, unit: "ft" } }));
// [ [ 288.7135170603674, 114.83 ] ]
```

## The looks and the features

A field sport is painted from the look's base, so the seven named looks apply to it ([theming](./theming.md)): `grass` (the default), `night`, `chalkboard`, `blueprint`, `print`, `broadcast` and `high-contrast`, each held to the same contrast as the others. Handball's floor and a hockey pitch's turf are our blues, with the goal areas in orange: no rulebook prints a colour. `featureColors` names each part: `FEATURES.rugby` has the try lines, the 22-metre lines and the dash lines, `FEATURES.cricket` the pitch, the creases and the circle, and so on.

## What is not drawn

World Rugby's technical zones (a diagram's labels, whose place along the touchline is not given); the NRL's media line (it gives no length) and the benches; the AFL's interchange area (its width, not its place, is in the Laws; the diagram puts it on a wing) and the nine-metre line of the diagram of Law 20; the GAA's substitution zone (5 m either side of the centre line, on the sideline); cricket's wide guidelines and protected-area indicators (Appendix C), the sight screens and the run-ups; the FIH's run-off areas; the IHF's coaching zone, the bench and the table; the lacrosse benches, the penalty boxes and the timer's table of every book.

The PLL's figures are those of its 2024 rulebook, the newest that could be read; its later books were not found. A size the AFL's own page prints outside the Laws' range, Adelaide Oval's 190 metres, is left out of the named grounds. No sport is left out for want of a citable figure.
