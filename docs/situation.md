# The situation of a game

`situation` says what is happening in a game, and the drawing shows it where a reader looks: on the surface, in the [badge and the compact card](./score.md), and in the description a screen reader hears. It is for hockey, baseball (softball and the NPB too) and football. Nothing about it changes a drawing that has none: the same options without it give the same text, to the byte.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nhl",
  away: { name: "USA", abbr: "USA", score: 3, color: "#1c3f7a" },
  home: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e" },
  status: "live",
  situation: { awaySkaters: 5, homeSkaters: 4, clock: "1:42" },
});
console.log(svg.includes("5v4 PP 1:42"), svg.includes("Power play: USA have 5 skaters against 4."));
// true true
```

A value the sport cannot have (seven skaters, a fourth down on the CFL's field, a clock that is not a time) is left out, and so is a situation with nothing in it that can be drawn; nothing throws. A [special game](./special-games.md) draws no situation. The drawing's stylesheet gets the situation's rules only when there is one to draw.

## Hockey

| Option | What it is |
| --- | --- |
| `awaySkaters`, `homeSkaters` | The skaters on the ice without the goalkeeper, 3 to 6 (a team that has pulled its goalkeeper has 6). |
| `clock` | The time left on the penalty, as `1:42`, `0:09.4` or a whole number of seconds. Written at the end of the pill. |
| `emptyNet` | `"home"` or `"away"` for the team that has pulled its goalkeeper, or `true` for the team with more skaters. |
| `delayedPenalty` | `"home"` or `"away"` for the team that will be penalised. The other team has the puck, and attacks. |
| `shootout` | `{ rounds: [[away, home], ...] }`: `true` a goal, `false` a miss, `null` an attempt not yet taken. The visitors shoot first, as in the NHL. |
| `toward` | `"left"` or `"right"`: the end the attackers are heading for. |

The **pill** says the strength with the attacker's count first (`5v4 PP`), `EN` for an empty net, `DEL PEN` for a delayed penalty, and the clock. A dot in the attacking team's colour says who has the advantage. Five against five with nothing else to say draws nothing. The **attacking zone**, from the blue line to the end boards, is tinted in the attacker's colour, and an empty net is ringed.

The attacker is the team with its goalkeeper pulled, else the team with more skaters, else the team that has the puck in a delayed penalty. The end it heads for is, in this order: `toward`; the end the [`direction`](./annotations.md) option says that team attacks (in the period it names); the end opposite that team's own side.

A **shootout** is a strip of dots across centre ice, under the score's panel: a goal filled (●), a miss hollow (○), an attempt not yet taken a faint speck, each team's goals at the end. The first three rounds are the regular ones; the rounds after the third are sudden death and stand apart, after a divider. The strip is drawn instead of the pill, and in the badge the pill reads `SO 3–2` with the goals.

The word follows the league: `SO` and "shootout" (シュートアウト) in the NHL and the leagues that play as it does, `GWS` and "game winning shots" (ゲームウイニングショット) under the `iihf` and `olympic` rinks, as the IIHF's rules call them.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "nhl",
  status: "final-so",
  situation: { shootout: { rounds: [[true, false], [true, true], [false, true], [false, false], [true, false]] } },
});
console.log((svg.match(/class="ky-sit-goal/g) ?? []).length, (svg.match(/class="ky-sit-miss/g) ?? []).length);
// 5 5
```

## Baseball

| Option | What it is |
| --- | --- |
| `bases` | `[first, second, third]`, `true` for a base with a runner. |
| `outs` | 0 to 3. |
| `inning`, `half` | The inning (1 or more) and `"top"` (the visitors bat) or `"bottom"`. |
| `balls`, `strikes` | The count: balls 0 to 3 and strikes 0 to 2. Both are needed for it to be drawn. |

The occupied bases are lit on the park's diamond, whichever park, league or season. The **scorebug** stands behind home plate: the diamond with its runners lit, the outs as three dots under it, the inning with an arrow for its half, and the count. In the badge and the compact card the scorebug takes the place of the picture of the field.

```ts
import { situationText } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(situationText({ sport: "mlb", situation: { inning: 7, half: "top", outs: 2, balls: 3, strikes: 2 } }));
console.log(situationText({ sport: "mlb", language: "ja", situation: { inning: 7, half: "bottom", outs: 0 } }));
// Top 7 · 2 out · 3-2
// 7回裏 · ノーアウト
```

## Football

| Option | What it is |
| --- | --- |
| `ballOn` | The ball, in yards from the offence's own goal line: 35 is its own 35, 88 the opponent's 12. 0 to 100 (0 to 110 on the CFL's field). |
| `toGo` | The yards to a first down, or `"goal"`. |
| `down` | 1 to 4 (1 to 3 on the CFL's field: a fourth down there is left out). |
| `possession` | `"home"` or `"away"`: the team with the ball. |
| `redZone` | The red zone is tinted when the ball is in it; `false` leaves it out and `true` tints it with no ball. |
| `drive` | A drive chart: `[{ team, from, to, result }]`, the yards from the team's own goal line. `team` is the team in possession when missing. |
| `toward` | `"left"` or `"right"`: the end zone the offence is heading for. |

The **line of scrimmage** is blue and the **first-down line** yellow, each across the field, the first-down line left out when the goal line is nearer (the tag then says `& Goal`). The **red zone**, the last 20 yards before the goal line the offence attacks, is tinted. A **tag** near the line says the down and distance and the yard line (`3rd & 7`, `OPP 12`), with an arrow for the way the offence is going. The end the offence heads for is read the way hockey's is: `toward`, then `direction`, then the end opposite its own side.

A **drive chart** draws an arrow for each drive, from where it began to where it ended, in a lane of its own across the field, coloured by how it ended and labelled with a short code: `touchdown` (`TD`), `field-goal` (`FG`), `missed-field-goal` (`MFG`), `punt` (`PUNT`), `turnover` (`TO`), `interception` (`INT`), `fumble` (`FUM`), `downs` (`DOWNS`), `safety` (`SAF`) and `end-of-half` (`END`). With the score's panel in the middle the lanes lie in the band under it; at most 24 drives are drawn.

The field is the drawing's own: the CFL's is 110 yards between the goal lines with end zones of 20 yards, and a team has three downs; a `league` (the NCAA's) or a `year` changes the field as it does without a situation.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const svg = drawKyogijo({
  sport: "cfl",
  situation: { ballOn: 98, toGo: 12, down: 3, possession: "away", drive: [{ from: 25, to: 98, result: "touchdown" }] },
});
// The CFL's end zone is 60 feet deep: 98 yards on from its own goal line is 354 feet along the field.
console.log(svg.includes('d="M354 0V195"'), svg.includes(">TD<"));
// true true
```

## Words and the description

`situationText(options)` is the short label a drawing writes: `5v4 PP 1:42`, `Top 7 · 2 out · 3-2`, `3rd & 7 · OPP 12`. The description adds a sentence for each part of the situation, in English or Japanese by `language`, naming the teams when the drawing has them (`Power play: USA have 5 skaters against 4.`). The short words (`PP`, `EN`, `DEL PEN`, `SO`) are in `KYOGIJO_STRINGS[language].situation`, and the drive codes in `DRIVE_CODES`.

## Styling

The pill, the scorebug and the tag take the score panel's colours (`--ky-plate`, `--ky-plate-ink`), so they follow the theme. These custom properties are the situation's own: `--ky-sit-on` (a lit base, the shootout's goals), `--ky-sit-los`, `--ky-sit-fd`, `--ky-sit-red`, `--ky-sit-td`, `--ky-sit-fg` and `--ky-sit-lose` (the drive arrows' colours). The attacking zone takes the attacking team's colour. `KYOGIJO_SITUATION_STYLE` is the stylesheet, for a page that draws with `style: "none"`.

## Not drawn yet

A basketball shot clock and bonus, and soccer's stoppage time, are not drawn: they are a number beside the score that would sit well in the badge, and were left for a later release. Hockey's penalty box, football's timeouts and the yard line of a kick are not either.

The [gallery](./gallery.md) draws each of these.
