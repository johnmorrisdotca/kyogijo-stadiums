# Score and layout

A game on a surface: each team's name and logo on its side, the score in the middle, the state of the game, and the surface wide or tall, or as a strip for a list.

## Score mode

Pass `home` and `away`. Each team has a `name`, an optional `abbr`, `score`, `penalties` (a soccer shoot-out), `ends` and `hammer` (curling: the score of each end, and the last stone), `sets`, `tiebreaks`, `points` and `serving` (tennis, volleyball, badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball and roundnet: the score in each set or game, a tie-break's points, the game in progress and the server, [Net sports](./courts.md#a-score)), `goals`, `behinds` and `points` (Australian football's goals and behinds, written `10.12 (72)`; Gaelic games' goals and points, `2-14 (20)`), `wickets`, `overs` and `innings` (cricket: runs for wickets, the overs faced and each innings, [Field sports](./field-sports.md#a-score)), `logo`, `mark` and `markFit` ([round marks](#round-marks)), `color` and `textColor`.

| Option | What it does |
| --- | --- |
| `size` | `full` (on the surface), `compact` (the surface with a strip under it) or `badge` (the strip alone). |
| `status` | `final`, `final-ot`, `final-so`, `final-aet`, `final-pens`, `live`, `half`, `extra-time`, `extra-end`, `penalties`, `postponed` (translated), `end-6` (curling: "End 6"), `set-3` and `game-2` (net sports: "Set 3", "Game 2"), `innings-2` (cricket: "Innings 2"), `tiebreak`, `match-tiebreak`, `retired`, `walkover`, or any text such as `2nd period` or `Bottom 9th`. |
| `competition`, `date` | The round and the day, as written. |
| `label` | A line for the foot of the panel in place of the status and the date. |
| `winner` | `auto` (the leader once the status is a final one), `leader`, `none`, `home` or `away`. |
| `homeSide` | `left` (home first, "Home 2-1 Away") or `right` (away at home). The default is the sport's own convention, [below](#which-side-the-home-team-is-on); a value you give always wins. |
| `uppercase` | Names in capitals. On by default. |
| `markShape` | `plain` (the default) or `round`: a flag or a logo in a circle with a ring, for both teams; a team's `mark` wins. |

A flag or a crest can also be laid large over each half of the surface, with an emblem in the centre: [the pageant](./pageant.md).

A team's logo is an `https:` or relative address, an image `data:` address, the text of an SVG, or, once [Dougu Sports is plugged in](./emblems.md) with `useEmblems`, the id of one of its emblems: `logo: "crest:shield"` is a shield in the team's `color` with its letters, `"sport:nhl"` the icon of a sport and `"trophy:cup"` a cup. It is drawn as an image, so it cannot run a script, and an address of any other kind is ignored. A team without a logo is its name alone.

### Which side the home team is on

A score is drawn the way the sport lists it. Soccer and most of the world's other codes write the home team first, so it is on the left; the North American leagues write the visitor first ("away at home"), so the home team is on the right. `homeSide` overrides either; `homeSideFor(sport, league?)` returns the default (`"left"` or `"right"`), and `HOME_FIRST` (and `HOME_FIRST_LEAGUES` for the leagues that differ from their sport) is the table behind it.

The side decides everything that follows the drawing: the banners and the plate, the badge and the strip of a compact card, the order of the teams in the title and the description ("Calvara 1, Aurelia 2", or in Japanese "Calvara 1、Aurelia 2"), the order of a shoot-out in the status (`Final · 2-4 pens`, the home team's first when it is on the left), the rows of a curling, net-sport or cricket board, and the way `update` pulses a changed score.

| Sport | Default | Why |
| --- | --- | --- |
| `soccer` | home on the left | FIFA's and UEFA's fixture lists and match reports name the home team first ("Home v Away"). |
| `rugby` (union and league) | home on the left | Rugby World Cup, Six Nations and NRL fixtures and results are written home v away; the data feeds tag the first-named team as home. |
| `afl` | home on the left | The AFL fixture lists the home team first ("Home v Away"). |
| `gaelic` | home on the left | GAA fixtures and results name the home team first. |
| `fieldhockey`, `handball` | home on the left | FIH and IHF fixtures and results are written home v away, as other European and international team sports are. |
| `netball` | home on the left | World Netball's fixtures, and those of the Commonwealth countries where the sport is played most, name the home team first ("Home v Away"). Netball is scored in goals, so it has the usual score, not a board of sets. |
| `waterpolo` | home on the left | Water polo fixtures and results, LEN's and World Aquatics', are written home v away. |
| `swimming`, `diving`, `artisticswimming` | home on the right | A dual meet, as the North American leagues that swim them write one, lists the visitor first ("at"). |
| `cricket` | home on the left | Fixtures are written "Home v Away" ("England v Australia"). The board's rows are the two teams; a scorecard in batting order is `homeSide: "right"` or the teams passed the other way round. |
| `lacrosse` | home on the right; home on the left for `world-men`, `world-women` and `world-box` | The leagues of North America (the NCAA, the PLL and the NLL, which writes "Buffalo at Toronto") list the visitor first. The leagues of World Lacrosse, an international federation, follow the international fixture convention. |
| `nfl`, `cfl` | home on the right | North American football lists the visitor first in schedules ("at"), box scores and line scores. |
| `ifaf` | home on the right | Kept as it was. International American football has no single order: one IFAF event schedule is marked "home team listed first" ([2016 U-19 championship](https://www.americanfootballinternational.com/?p=39465)), others list seeds or no home team at all, and most data feeds follow the NFL's box score. Pass `homeSide: "left"` for a listing that is home first. |
| `nhl`, `nba`, `mlb` | home on the right | The North American leagues list the visitor first ("away at home"); a baseball line score has the visitor, who bats first, on top. |
| `curling` | home on the right | A curling game has no home team: the board's rows follow the draw sheet, and the layout is the one it has always had. |
| `tennis`, `volleyball`, `badminton`, `pickleball`, `tabletennis`, `padel`, `squash`, `racquetball`, `sepaktakraw`, `teqball`, `roundnet` | home on the right | The board lists the two sides in the order of the draw, not home against away; the layout is the one it has always had. |

The default is by sport and by `league` only where a league's own convention differs from its sport's (today the lacrosse leagues above); the hockey and basketball leagues of other federations (`iihf`, `fiba`) keep their sport's default. A league that is a sport of its own (`league: "cfl"` on an `nfl`) takes that sport's.

### Round marks

A flag or a crest can be drawn round, as a broadcast graphic draws a country against a country: `mark: "round"` on a team, or `markShape: "round"` on the score for both (a team's own `mark`, `round` or `plain`, wins). The logo is clipped to a circle and ringed, on each side of the surface in the full drawing, in the badge and in the strip of a compact card. It is sized by the place the surface gives the team: the end zone of a pitch, the half of a court. Where the words are turned (along the ends of a wide pitch, and in a tall drawing) the mark is turned back and stays upright.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const flag = (colours: string[]): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20">${colours.map((c, i) => `<rect x="${i * 10}" width="10" height="20" fill="${c}"/>`).join("")}</svg>`;
const svg = drawKyogijo({
  sport: "soccer",
  markShape: "round",
  away: { name: "Aurelia", abbr: "AUR", score: 2, color: "#0f7a7a", logo: flag(["#0f7a7a", "#f4f0e4", "#e07a1f"]) },
  home: { name: "Calvara", abbr: "CAL", score: 1, color: "#6b2d5c" },
});
console.log(svg.split('class="ky-mark"').length - 1, svg.includes("<clipPath"), svg.includes("ky-mark-i"));
// 2 true true
```

A round mark with no logo (Calvara above) is the team's initials on its colour; in the badge, which already writes the three letters, a team with no logo has no mark. `markFit: "contain"` shows a crest whole on a plain disc where `cover` (the default) fills the circle and cuts the edges of a flag. Curling, the net sports and cricket put the teams on the board, not on the surface, so they have no mark. The mark's ring and hairline are `--ky-mark-ring` and `--ky-mark-edge`.

### Without the panel

`plate: false` draws a score with the teams' names and the rest of the surface and no score panel (or board, for curling, cricket and the net sports). It is what the [3D view](./turn.md#the-score) does when it hangs the score up as a scoreboard; the drawing without it is the same text as before.

## Layout

`orientation` is `landscape` (the default), `portrait` or `auto`. Portrait turns the surface a quarter clockwise, so the away team is at the top and the home team at the bottom; every name, number and score is turned back so that it reads upright. `auto` follows `aspect`, the container's width over its height: in a string it is landscape unless `aspect` is given, and the browser helpers measure the container, draw again when its shape changes, and treat a container that is as tall as its content and under 560 pixels wide as tall.

A baseball field is already upright, so in portrait it stays as it is and the teams go in strips above and below it.

## A badge and a compact card

`size: "badge"` is the strip alone, for a list of games; `size: "compact"` is the surface with that strip under it. `drawBadge` draws the strip directly.

```ts
import { drawBadge } from "@johnmorrisdotca/kyogijo-stadiums";

const badge = drawBadge({
  sport: "nba",
  away: { name: "Summit Peaks", abbr: "SMT", score: 98, color: "#14233f" },
  home: { name: "Metro Bolts", abbr: "MTB", score: 104, color: "#c2410c" },
  status: "Q4 2:31",
});
console.log(/viewBox="0 0 440 64"/.test(badge));
// true
```

## Wide and tall

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const game = { away: { name: "Harbour City Gulls", score: 27 }, home: { name: "Prairie Ridge Bison", score: 24 }, status: "final" };
const wide = drawKyogijo({ sport: "nfl", ...game, orientation: "landscape" });
const tall = drawKyogijo({ sport: "nfl", ...game, orientation: "portrait" });
const box = (svg: string) => /viewBox="[^ ]+ [^ ]+ ([^ ]+) ([^ "]+)"/.exec(svg)!.slice(1).map(Number);
console.log(box(wide), box(tall));
// [ 384, 184 ] [ 184, 384 ]
```

See the [gallery](./gallery.md) for each surface wide and tall, and for the badges and the compact cards.
