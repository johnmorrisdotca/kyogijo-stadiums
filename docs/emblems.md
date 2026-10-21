# Emblems: trophies, medals, balls and crests

Kyogijo Stadiums draws no trophy, medal, ball or crest of its own. They come from its sister package, [Dougu Sports](https://johnmorrisdotca.github.io/dougu-sports/), which has 325 of them (0.13.0): the trophies, medals and awards, four generic crests, a pennant, an icon for each of the 42 sports (the budo too: judo, karate, kendo, sumo and kyudo, and the combat sports MMA, boxing, wrestling and professional wrestling; a dojo takes the judo one), and the ball and the gear of each. Plug it in once, and an emblem's id goes anywhere a logo, a flag or a mark is taken. Kyogijo keeps zero dependencies: it asks a function you give it to draw the emblem, and it bundles none.

## Trophies, medals, balls and crests from Dougu Sports

Install both, and plug the one into the other in one line:

```ts
import { drawKyogijo, useEmblems } from "@johnmorrisdotca/kyogijo-stadiums";
import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";

useEmblems(renderEmblem);

const svg = drawKyogijo({
  sport: "soccer",
  away: { name: "Japan", abbr: "JPN", score: 2, color: "#bc002d", logo: "crest:shield" },
  home: { name: "Canada", abbr: "CAN", score: 1, color: "#d52b1e", logo: "crest:roundel" },
  status: "final",
  pageant: { style: "stage", emblem: "trophy:soccer-globe", emblemName: "Northern Cup" },
});
console.log(svg.includes(encodeURIComponent("<title>Shield crest</title>")), svg.includes(encodeURIComponent(">JPN<")));
// true true
```

`useEmblems(render)` is in the main entry and in `@johnmorrisdotca/kyogijo-stadiums/element`, so a page that only uses the [custom element](./getting-started.md) plugs it in from there. `render` is `renderEmblem` of Dougu Sports, or any function with its shape (`EmblemRenderer`): it takes an id, which may end in `/metal`, `/line` or `/color`, and some options, returns a document of SVG, and throws for an id it does not know. Plug it in once, when the page starts; `useEmblems(undefined)` takes it out.

### Where an id works

An id goes wherever a picture is taken, through the same safe path as an address:

- a team's `logo` in a score, a compact card and a badge, and the round marks (`markShape: "round"`);
- the [pageant](./pageant.md)'s `emblem` (the centre circle, centre ice, centre court or the mound), and the pictures of a `carpet` or a `stage`;
- a [layer](./layers.md)'s `logo`, a swimmer's flag and a court's `centreLogo`;
- the custom element's `home-logo` and `away-logo` attributes.

```ts
import { drawKyogijo, useEmblems } from "@johnmorrisdotca/kyogijo-stadiums";
import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";

useEmblems(renderEmblem);

const svg = drawKyogijo({
  sport: "nhl",
  away: { name: "USA", abbr: "USA", score: 3, color: "#1c3f7a", logo: "sport:nhl/line" },
  home: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e", logo: "ball:puck" },
  status: "final",
  pageant: { emblem: "cup" },
});
console.log(svg.includes(encodeURIComponent("<title>Cup</title>")));
// true
```

A crest takes the team's `color` as its colour, `textColor` as its second, and the first three letters of its `abbr` as its letters, so `logo: "crest:shield"` on two teams gives two different crests. Any other emblem is drawn as it is. A trophy or an award may be written without its group (`"cup"` for `"trophy:cup"`), and `/line` after an id gives the one-outline style, which reads at 14 pixels in the page's ink.

An emblem is drawn as an image, so it cannot run a script, and its ink follows the device's light or dark setting (or the drawing's `theme`). Dougu Sports' [gallery](https://johnmorrisdotca.github.io/dougu-sports/) shows every emblem with its id; its README says how to turn one in 3D and how to take a single emblem without the rest.

### For one drawing

`emblems: render` in the options of a drawing or of a layer drawing plugs a renderer in for that drawing alone, over the page's own. It is the way for a library that draws with Kyogijo and must not change the page's setting.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { renderEmblem } from "@johnmorrisdotca/dougu-sports/emblems";

const svg = drawKyogijo({
  sport: "nba",
  away: { name: "Australia", abbr: "AUS", score: 101, logo: "crest:diamond", color: "#00843d" },
  home: { name: "Japan", abbr: "JPN", score: 99, logo: "crest:pennant", color: "#bc002d" },
  status: "final",
  emblems: renderEmblem,
});
console.log(svg.includes(encodeURIComponent(">AUS<")));
// true
```

### Without a renderer

With none plugged in, an id is an address like any other: `"crest:shield"` has a scheme Kyogijo does not allow, so it is refused and the team is drawn with no logo, and a bare word such as `"cup"` is a relative path. In development (anywhere `process.env.NODE_ENV` is not `"production"`) the first refused id with a group (`"trophy:cup"`, `"crest:shield"`) prints one hint to the console saying how to plug Dougu Sports in; production prints nothing.

With one plugged in, a name that is an emblem's id is the emblem and not a file of that name: write `./cup` for the file.

```ts
import { safeLogo, useEmblems } from "@johnmorrisdotca/kyogijo-stadiums";

useEmblems(undefined);
console.log(safeLogo("trophy:cup"), safeLogo("logos/cup.svg"));
// undefined logos/cup.svg
```

### Another renderer

`render` can be any function that returns an SVG document: your own set, or a wrapper that adds to Dougu Sports'. Only a document that starts with `<svg` (or `<?xml`) is taken; it is written into an image, as any SVG logo is.

```ts
import { drawKyogijo, useEmblems, type EmblemRenderer } from "@johnmorrisdotca/kyogijo-stadiums";

const mine: EmblemRenderer = (id, options) => {
  if (id !== "club:badge") throw new Error(`Unknown emblem "${id}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>Badge</title><circle cx="5" cy="5" r="4" fill="${options?.tint ?? "#444"}"/></svg>`;
};
useEmblems(mine);

const svg = drawKyogijo({ sport: "nhl", away: { name: "USA", score: 3, logo: "club:badge", color: "#1c3f7a" }, home: { name: "Canada", score: 2 }, status: "final" });
console.log(svg.includes(encodeURIComponent("<title>Badge</title>")));
// true
```

The renderer is asked only for a string that looks like an id: lower-case words, one optional `group:`, one optional style. So it is never asked for an address, a data address or a document, and it may throw for any it does not know. Only a `crest:` id is given the team's colour (`tint`), second colour (`accent`) and letters (`initials`); `theme` is `auto` unless the drawing asks for `light` or `dark`.

### TypeScript

`EmblemRenderer` is exported. `EmblemId` is the union of Dougu Sports' ids when `@johnmorrisdotca/dougu-sports` is installed beside the package, so an editor completes `logo: "cr…"`; where it is not, it is `string`. Nothing is imported at run time. `EmblemRef` is an id, an id with a style, or any string.

```ts
import type { EmblemId, EmblemRef, EmblemRenderer } from "@johnmorrisdotca/kyogijo-stadiums";

const logo: EmblemRef = "crest:shield";
const id: EmblemId = "trophy:cup";
const render: EmblemRenderer | undefined = undefined;
console.log(logo, id, render);
// crest:shield trophy:cup undefined
```
