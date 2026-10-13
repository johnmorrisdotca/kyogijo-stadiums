# Score and layout

A game on a surface: each team's name and logo on its side, the score in the middle, the state of the game, and the surface wide or tall, or as a strip for a list.

## Score mode

Pass `home` and `away`. Each team has a `name`, an optional `abbr`, `score`, `penalties` (a soccer shoot-out), `logo`, `color` and `textColor`.

| Option | What it does |
| --- | --- |
| `size` | `full` (on the surface), `compact` (the surface with a strip under it) or `badge` (the strip alone). |
| `status` | `final`, `final-ot`, `final-so`, `final-aet`, `final-pens`, `live`, `half`, `extra-time`, `penalties`, `postponed` (translated), or any text such as `2nd period` or `Bottom 9th`. |
| `competition`, `date` | The round and the day, as written. |
| `label` | A line for the foot of the panel in place of the status and the date. |
| `winner` | `auto` (the leader once the status is a final one), `leader`, `none`, `home` or `away`. |
| `homeSide` | `right` (the default, as in "away at home") or `left`. |
| `uppercase` | Names in capitals. On by default. |

A team's logo is an `https:` or relative address, an image `data:` address, or the text of an SVG. It is drawn as an image, so it cannot run a script, and an address of any other kind is ignored. A team without a logo is its name alone.

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
