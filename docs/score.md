# Score and layout

A game on a surface: each team's name and logo on its side, the score in the middle, the state of the game, and the surface wide or tall, or as a strip for a list.

## Score mode

Pass `home` and `away`. Each team has a `name`, an optional `abbr`, `score`, `penalties` (a soccer shoot-out), `ends` and `hammer` (curling: the score of each end, and the last stone), `sets`, `tiebreaks`, `points` and `serving` (tennis, volleyball, badminton, pickleball and table tennis: the score in each set or game, a tie-break's points, the game in progress and the server, [Net sports](./courts.md#a-score)), `goals`, `behinds` and `points` (Australian football's goals and behinds, written `10.12 (72)`; Gaelic games' goals and points, `2-14 (20)`), `wickets`, `overs` and `innings` (cricket: runs for wickets, the overs faced and each innings, [Field sports](./field-sports.md#a-score)), `logo`, `mark` and `markFit` ([round marks](#round-marks)), `color` and `textColor`.

| Option | What it does |
| --- | --- |
| `size` | `full` (on the surface), `compact` (the surface with a strip under it) or `badge` (the strip alone). |
| `status` | `final`, `final-ot`, `final-so`, `final-aet`, `final-pens`, `live`, `half`, `extra-time`, `extra-end`, `penalties`, `postponed` (translated), `end-6` (curling: "End 6"), `set-3` and `game-2` (net sports: "Set 3", "Game 2"), `innings-2` (cricket: "Innings 2"), `tiebreak`, `match-tiebreak`, `retired`, `walkover`, or any text such as `2nd period` or `Bottom 9th`. |
| `competition`, `date` | The round and the day, as written. |
| `label` | A line for the foot of the panel in place of the status and the date. |
| `winner` | `auto` (the leader once the status is a final one), `leader`, `none`, `home` or `away`. |
| `homeSide` | `right` (the default, as in "away at home") or `left`. |
| `uppercase` | Names in capitals. On by default. |
| `markShape` | `plain` (the default) or `round`: a flag or a logo in a circle with a ring, for both teams; a team's `mark` wins. |

A team's logo is an `https:` or relative address, an image `data:` address, or the text of an SVG. It is drawn as an image, so it cannot run a script, and an address of any other kind is ignored. A team without a logo is its name alone.

### Round marks

A flag or a crest can be drawn round, as a broadcast graphic draws a country against a country: `mark: "round"` on a team, or `markShape: "round"` on the score for both (a team's own `mark`, `round` or `plain`, wins). The logo is clipped to a circle and ringed, on each side of the surface in the full drawing, in the badge and in the strip of a compact card. It is sized by the place the surface gives the team: the end zone of a pitch, the half of a court. Where the words are turned (along the ends of a wide pitch, and in a tall drawing) the mark is turned back and stays upright.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

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

## Layout

`orientation` is `landscape` (the default), `portrait` or `auto`. Portrait turns the surface a quarter clockwise, so the away team is at the top and the home team at the bottom; every name, number and score is turned back so that it reads upright. `auto` follows `aspect`, the container's width over its height: in a string it is landscape unless `aspect` is given, and the browser helpers measure the container, draw again when its shape changes, and treat a container that is as tall as its content and under 560 pixels wide as tall.

A baseball field is already upright, so in portrait it stays as it is and the teams go in strips above and below it.

## A badge and a compact card

`size: "badge"` is the strip alone, for a list of games; `size: "compact"` is the surface with that strip under it. `drawBadge` draws the strip directly.

```ts
import { drawBadge } from "@johnmorrisdotca/kyogijo";

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
import { drawKyogijo } from "@johnmorrisdotca/kyogijo";

const game = { away: { name: "Harbour City Gulls", score: 27 }, home: { name: "Prairie Ridge Bison", score: 24 }, status: "final" };
const wide = drawKyogijo({ sport: "nfl", ...game, orientation: "landscape" });
const tall = drawKyogijo({ sport: "nfl", ...game, orientation: "portrait" });
const box = (svg: string) => /viewBox="[^ ]+ [^ ]+ ([^ ]+) ([^ "]+)"/.exec(svg)!.slice(1).map(Number);
console.log(box(wide), box(tall));
// [ 384, 184 ] [ 184, 384 ]
```

See the [gallery](./gallery.md) for each surface wide and tall, and for the badges and the compact cards.
