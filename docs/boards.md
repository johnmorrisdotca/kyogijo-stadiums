# Boards over a surface

A results board, a bout presentation or a medal table, drawn by anything else, laid over a surface: the final of a swimming race over the pool, a judo bout over the mat, the 100 m over the athletics oval, a medal table in a corner. The `board` option takes the board as an SVG string with its size, in a drawing and in the [3D view](./turn.md), and places it: at the top, a side or a corner, kept off the middle of the surface, in its own shape.

Kyogijo draws no board of its own. The pictures here are [Taisen Brackets](https://github.com/johnmorrisdotca/taisen-brackets)' (`resultsBoard`, `boutBoard`, `broadcastMedalTable`, each with a `...Size` function that gives the size before it is drawn), a development dependency of this repository for the demo and these pages and never of the package: a board is any string of SVG.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { resultsBoard, resultsBoardSize } from "@johnmorrisdotca/taisen-brackets";

const source = {
  title: "Men's 100m freestyle",
  phase: "Final",
  columns: [{ precision: 2 }],
  rows: [
    { code: "AUS", name: "Callum Reyes", values: [46.91], record: "OR" },
    { code: "USA", name: "Dominic Ward", values: [47.2] },
    { code: "JPN", name: "Haruki Tanabe", values: [47.38] },
  ],
};
const size = resultsBoardSize(source.rows.length, { width: 960 });
const svg = drawKyogijo({
  sport: "swimming",
  board: { svg: resultsBoard(source, { width: 960 }), width: size.width, height: size.height, position: "top" },
});
console.log(svg.includes('data-board="top"'), svg.includes('class="ky-board-img"'), svg.includes("<script"));
// true true false
```

The demo's [boards page](https://johnmorrisdotca.github.io/kyogijo-stadiums/boards.html) lays five boards over a pool, a mat and two ovals, in 2D and in 3D, and keeps the placement in its address. The [gallery](https://johnmorrisdotca.github.io/kyogijo-stadiums/docs/gallery-boards.html) shows every position and the limits below. The athletes and results in the pictures are invented.

![A results board over a swimming pool seen from above: a blue title band reading Men's 100m freestyle with a gold medal square, a bar reading Final, and eight rows with a red rank box, a country code, a flag, a name and a time, the winner's with a record badge, centred at the top edge of the pool, over the lane ropes and above the middle](./pictures/boards-swimming-desk-light.webp)

## The option

`board` is `{ svg, width?, height?, position?, share?, margin?, opacity?, cover?, label? }`.

| Field | What it is |
| --- | --- |
| `svg` | The board, as SVG text (`<svg …>…</svg>`, or with an `<?xml?>` line first). Anything else leaves the drawing as it would be with no board. |
| `width`, `height` | The board's own size, the numbers its maker gives (`resultsBoardSize`, `boutBoardSize`, `broadcastMedalSize`): they give its shape. Left out, the `viewBox` of the SVG is read; a board with no size is ignored. |
| `position` | `top` (the default), `bottom`, `side` (the right edge), `left`, `corner` (the top right), `top-left`, `top-right`, `bottom-left`, `bottom-right`, or a point: `{ x, y, anchor? }`. |
| `share` | The width as a share of the drawing's width, 0.1 to 1. By default 0.5 at the top and the bottom, 0.3 at a side, 0.36 in a corner and 0.4 at a point. |
| `margin` | The gap from the edge, as a share of the drawing's width, 0 to 0.2: 0.02. |
| `opacity` | 0 to 1: 1. |
| `cover` | Lets a named position cover the middle of the surface. Off. |
| `label` | A sentence for a reader who cannot see the board. Without it the board is hidden from assistive technology: it is a picture of what the page says elsewhere. |

`BOARD_POSITIONS` lists the names, and `placeBoard(board, box)` is the place a board takes in a box, for a page that wants to know before it draws.

## Off the middle

A named position keeps to its edge and takes the `share` asked for, unless that would reach into the middle of the surface, where the score's panel stands: the middle is `BOARD_CLEAR` (a third, 0.34) of the drawing's width and height, centred. Then the board is made smaller, never moved. A board is never larger than its edge leaves room for, so a tall list at the top of a short drawing is small, and a medal table in a corner is as large as its share. `cover: true` lifts the limit for a named position. A point of your own, `{ x: 0.5, y: 0.5, anchor: "center" }`, is the share of the width and of the height of its top left corner (or of its middle), and is never held to it: you asked. A board stays inside the drawing whatever is asked.

A board is laid over the surface and not over a compact card's strip, so the strip's score stays clear. A badge, which is a strip alone, takes no board. A drawing with no board, or with one that is not a board, is the same text it always was.

## Never stretched

The picture is written as one `<image>` of the board's own shape, with `preserveAspectRatio="xMidYMid meet"`, so that a letter is never stretched: the width is a share of the drawing and the height follows. The SVG is given to the browser as an image (a `data:` address), so nothing in it can run, its styles stay in it and its ids cannot meet the drawing's. A board may be up to 200,000 characters; one that is longer is ignored.

## In 3D

In the 3D view a board is a layer over the view, not a plane of the scene: it does not turn, tip or zoom with the surface, and it never takes the pointer, so a drag on it turns the view. It is laid out by CSS as a share of the view's width, in the board's own shape, and its height is held to what keeps the middle of the view clear in a view of 16 by 10 and any other shape.

```ts no-run
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";

declare const boutSvg: string; // what boutBoard(...) gave
declare const nextBoutSvg: string;

const view = mountKyogijoTurn(document.querySelector("#mat")!, { sport: "judo", board: { svg: boutSvg, width: 960, height: 269, position: "top" } });
view.preset("corner"); // the board stays where it is
view.update({ sport: "judo", board: { svg: nextBoutSvg, width: 960, height: 269, position: "top" } }); // a new board, the view keeps its turn
```

![A judo mat in 3D from a low corner with a bout presentation board over the top of the view: the two athletes in a red and a blue band, the referee and two judges, steady while the mat is turned](./pictures/boards-judo-3d-desk-light.webp)

`turnMarkup` writes the layer into the markup it makes, after the scene, and the stylesheet (`KYOGIJO_TURN_STYLE`) has its rules; where the browser cannot draw in 3D, the flat drawing is shown with the board on it.

## A medal table in a corner

![A medal table over the corner of an athletics stadium: a title band, a bar with a gold, a silver and a bronze disc over their columns and the word total, and eight rows with a flag, a country code and the counts, at the top right, off the middle of the field](./pictures/boards-medals-desk-light.webp)

A board is any SVG: make it with your own code, or with Taisen Brackets' three. They carry no mark of any games, federation or broadcaster, and neither does Kyogijo; a mark of yours is yours to have the right to.
