# Accessibility, English and Japanese

[日本語](ja/accessibility-and-languages.md) · English

A drawing is a picture, and a picture of a score has to be read by people who cannot see it. This guide lists what each drawing already says for itself, what the page around it still has to do, and how the English and Japanese words work.

## What a drawing says for itself

Each drawing is an `svg` with `role="img"`, a `<title>` (the teams and the score, or the surface) and a `<desc>` (the competition, the status, the result and what the surface is), joined by `aria-labelledby`. `describe` returns the same two strings so a page can use them anywhere: as the `alt` of an `<img>`, in a table caption or in a live region.

```ts
import { describe, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const game = { sport: "nhl", away: { name: "USA", score: 3 }, home: { name: "Canada", score: 2 }, status: "final" } as const;
const { title, description } = describe(game);
console.log(title);
console.log(description.startsWith("Final. USA 3, Canada 2. USA won."));
console.log(drawKyogijo(game).includes('role="img"'));
// USA 3, Canada 2, Final
// true
// true
```

A `title` that is a direct child of the `svg` is also the browser's tooltip for the whole drawing. A page that does not want a box over wherever the pointer rests moves the `<title>` into a `<defs>`: the label still works, because `aria-labelledby` finds it there. Pass `title` and `description` in the options to say it your own way.

## What does not depend on colour

- The winner is marked by a bar under the score, and the loser's side is lighter.
- A missed shot is hollow and a failed pass is dashed, so an outcome is never told by colour alone.
- The score sits on a dark panel with white words in both themes, and a team's words on its colour are black or white by the colour's lightness, or the `textColor` you give.
- Every look is held to WCAG 2.2: lines 3:1 against what they are painted on, words 4.5:1 against the apron.
- In a tall drawing the surface is turned and the words are turned back, so the text is always upright.

## Motion

A drawing is still. A [replay](../replay.md) moves only when told to play, steps for a reader who prefers reduced motion, pauses when the page is hidden, and each of its controls has a name, a size of at least 44 pixels and a visible focus. A changed score swells and settles once, or only fades in with reduced motion. The [3D view](the-3d-view.md) turns only after Play, and glides between viewpoints only when motion is welcome.

## What the page still has to do

The package does not announce a score change. A page that changes the score may announce it with its own polite live region:

```ts no-run
const live = document.querySelector("#score-live")!; // <p id="score-live" role="status" aria-live="polite" class="visually-hidden">
live.textContent = "Goal. USA 3, Canada 2.";
```

Give a frame (`<iframe>`) a `title`. Give a data layer its table (`layerTable`), so the numbers are there without the picture. Keep the drawing's size in CSS at least as large as the words need: the package makes the text scale with the drawing, and a tiny drawing has tiny words.

## English and Japanese

`language` is `en` or `ja`. It changes the title, the description, the status words and the sentence of each rule change in `eraChanges`; the demo is in both too. Team names, competitions and dates are written as you give them, in any language.

```ts
import { KYOGIJO_STRINGS, describe } from "@johnmorrisdotca/kyogijo-stadiums";

const game = { sport: "nhl", away: { name: "USA", score: 3 }, home: { name: "Canada", score: 2 }, status: "final" } as const;
console.log(describe({ ...game, language: "ja" }).title);
console.log(Object.keys(KYOGIJO_STRINGS).join());
// USA 3、Canada 2、試合終了
// en,ja
```

Names of places have their own pairs: a park, ground or arena has `name` and `nameJa`, with a reading in kana for the Japanese name of a park (`readingJa`). The words are listed beside their English in [the Japanese of Kyogijo](../strings-ja.md), and the terms the rule books use are in [terminology](../terminology.md). The Japanese has not yet been read by a native reader; the demo says so when it is shown, and a correction is welcome as an [issue](https://github.com/johnmorrisdotca/kyogijo-stadiums/issues).

See also the page [accessibility](../accessibility.md) for the shorter reference.
