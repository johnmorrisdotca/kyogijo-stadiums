# Flags: a country's code, drawn by Hata

Kyogijo Stadiums draws no flag of its own. A team is given a country's code, `flag: "CA"`, and the flag comes from a function you plug in, as the emblems come from [Dougu Sports](./emblems.md). The flags are the sister package [Hata 旗](https://github.com/johnmorrisdotca/hata)'s: 465 of them, every one at the proportions its government gives it, with a round frame that never misrepresents it. Kyogijo keeps zero dependencies: it asks a function you give it, and it bundles none. Hata is an optional peer dependency that Kyogijo never imports.

## The adapter

The function is a **flag renderer**: `(code, { shape, size, theme }) => string`, an SVG document, or `undefined` for a code it has no flag for. It must be synchronous, because a drawing is a pure function of its options, and Hata's `flag()` is asynchronous. So load the flags you need first, then plug in a lookup. The shape of the renderer is the one [Taisen Brackets](https://github.com/johnmorrisdotca/taisen-brackets) takes, so the same adapter serves both packages (and Dougu Sports).

```ts
import { drawKyogijo, useFlags } from "@johnmorrisdotca/kyogijo-stadiums";
import { flag } from "@johnmorrisdotca/hata/load";

// Load each flag you draw, in the three shapes a drawing asks for: `round` in a circle, `square` as wide as it is tall, `rect` in its own proportions.
const codes = ["CA", "JP"];
const framing = { round: "round", square: "1:1", rect: "flag" } as const;
const loaded: Record<string, Record<string, string>> = {};
for (const shape of Object.keys(framing) as Array<keyof typeof framing>) {
  loaded[shape] = Object.fromEntries(await Promise.all(codes.map(async (code) => [code, (await flag(code, { shape: framing[shape] })) as string])));
}

// Plug in a synchronous lookup, once, when the page starts.
useFlags((code, { shape }) => loaded[shape]?.[code.toUpperCase()]);

const svg = drawKyogijo({
  sport: "soccer",
  markShape: "round",
  away: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e", flag: "CA" },
  home: { name: "Japan", abbr: "JPN", score: 1, color: "#bc002d", flag: "JP" },
  status: "final",
});
console.log(svg.split("<image").length - 1, svg.includes("data:image/svg+xml"));
// 2 true
```

`useFlags(render)` is in the main entry and in `@johnmorrisdotca/kyogijo-stadiums/element`, so a page that only uses the [custom element](./getting-started.md) plugs it in from there. Plug it in once; `useFlags(undefined)` takes it out. A code is passed as you wrote it (`ca`, `CA`, `GB-ENG`), so a lookup should upper-case it, as above.

## What the renderer is asked

- **`shape`** is how the flag is framed where it is drawn:
  - `round` for a [round mark](./score.md#round-marks) and a pageant's stage;
  - `rect` for a plain mark, a banner, a badge, a pageant's carpet, a layer's mark, a swimmer's or a player's badge: the flag in its own proportions, which a carpet reads from the `viewBox`;
  - `square` is in the renderer's type for a caller that wants it; Kyogijo itself asks for `round` and `rect`.
  
  Hata's own names for them are `"round"`, `"flag"` (its own proportions) and `"1:1"`.
- **`size`** is a nominal width in pixels (the diameter, for a round flag). A drawing scales, so it is the size of a typical use: 48 for a team's mark, 240 for a pageant's, 24 for a small badge. A renderer may use it to choose a level of detail, and Hata ignores it.
- **`theme`** is `light` or `dark` where the drawing's `theme` says so, else `inherit`.

## Where a code works

A code goes wherever a country is drawn, through the same safe path as a logo: the SVG is written as an image, which cannot run a script.

| Where | The code is |
| --- | --- |
| A team in a score: the banners at the ends, a compact card, a badge, a round mark | `Team.flag`, `round` in a round mark (`markShape: "round"` or the team's `mark: "round"`), `rect` otherwise |
| The [pageant](./pageant.md) | `Team.flag`: `rect` on a carpet, at the flag's own ratio, `round` on a stage |
| A [layer](./layers.md)'s mark of the shape `logo` for a team | `Team.flag`, `rect` |
| A swimmer on a pool's [race](./pools.md) | `Swimmer.country`, `rect`, where `flag` (a picture) is missing |
| A player of a [lineup](./layers.md) | `LineupPlayer.country`, `rect`, where `flag` is missing |
| An athlete or a skater of a [lane draw](./athletics.md) or a [start list](./skating.md) | `country`, `rect`, where `flag` is missing: nothing is drawn, and nothing made room for, where there is no flag for it |
| The custom element | the attributes `home-flag` and `away-flag` |

A team's `flag` wins over its `logo` where the renderer has a flag for the code; where it has none, or no renderer is plugged in, the `logo` is drawn, or the team's initials on its colour. Nothing throws: a renderer that throws, or gives something that is not an `<svg>`, is a code with no flag. A value that does not look like a code (letters and digits, with a `-` for a region) is not even asked about.

A round flag turns with its team's name where the name is turned, along a pitch's ends and in a tall drawing, as a round logo does.

## For one drawing

`flags: render` in the options of a drawing, or in the `surface` of a chart, plugs a renderer in for that drawing alone, over the page's own. It is the way for a library that draws with Kyogijo and must not change the page's setting.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const own = (code: string): string | undefined =>
  code.toUpperCase() === "CA" ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect width="60" height="30" fill="#d52b1e"/></svg>' : undefined;

const svg = drawKyogijo({
  sport: "nhl",
  away: { name: "Canada", abbr: "CAN", score: 3, color: "#d52b1e", flag: "CA" },
  home: { name: "Atlantis", abbr: "ATL", score: 2, color: "#123456", flag: "ZZ" },
  status: "final",
  flags: own,
});
// One flag, for the one code the renderer has; Atlantis is drawn as a team with no logo.
console.log(svg.split("<image").length - 1);
// 1
```

## Your own logo beside a flag

A flag and a logo of your own are the same kind of thing to a drawing, so a team can have either: `flag: "JP"` for the national flag, `logo` for a picture of your own, such as a crest you have the right to use. The demo shows both: a country's flag, and, on a tap of "Own logo", a maple leaf with the word CANADA and a red sun disc with the word JAPAN, drawn in the demo's own code.

Use country names and national flags; do not use a national federation's crest or logo, or the Olympic rings, which are protected marks.

## Credits

Hata credits the source, author and licence of every flag; a page that draws them should carry its [notice](https://github.com/johnmorrisdotca/hata/blob/main/NOTICE.md). Kyogijo's demo carries Hata's licence and notice beside the flags it uses.
