# React, Vue, Svelte and Angular

[日本語](ja/frameworks.md) · English

The package imports no framework. A drawing is a string and the element is a standard custom element, so each framework below needs only a few lines, and none of them adds a runtime dependency. Pick the way that fits how your framework treats HTML.

## The shape of every integration

There are two choices, and every framework can use either:

1. **The string.** Compute `drawKyogijo(options)` and insert it as HTML. It is reactive for free, because a changed score is a changed string. Use it when the framework renders on the server.
2. **The element.** Import `element/define` once and write `<kyogijo-field ...>`. It measures its own box for `orientation="auto"`. Use it when the page is built in the browser.

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// What every framework below does underneath.
const svg = drawKyogijo({ sport: "nfl", away: { name: "Mexico", score: 27 }, home: { name: "USA", score: 24 }, status: "final" });
console.log(svg.startsWith("<svg"), svg.includes("Mexico 27, USA 24"));
// true true
```

The string contains no script and every value that came from the options has been escaped, a colour passed through `safeColour` and a logo through `safeLogo`, so inserting it as HTML does not open the page to markup in a team name.

## React

`createKyogijo(React)` makes a component from your own React, which measures its box for `orientation="auto"`. `kyogijoProps` gives props to spread on any element, and nothing in that path imports React.

```tsx
import React from "react";
import { createKyogijo, kyogijoProps } from "@johnmorrisdotca/kyogijo-stadiums/react";

const Kyogijo = createKyogijo(React);

export const Game = () => (
  <Kyogijo sport="nhl" orientation="auto" away={{ name: "USA", score: 3 }} home={{ name: "Canada", score: 2 }} status="final" />
);

// Or props for your own element: it works in a server component too, because nothing here touches the DOM.
export const Plain = () => <div {...kyogijoProps({ sport: "nba" })} />;
```

Make the component once, outside your components, so React does not see a new type on every render.

```ts
import { kyogijoProps } from "@johnmorrisdotca/kyogijo-stadiums/react";

const props = kyogijoProps({ sport: "nba" });
console.log(props["data-kyogijo"], props["data-orientation"], typeof props.dangerouslySetInnerHTML.__html);
// nba landscape string
```

## Vue

Import the registration and tell Vue the tag is a custom element so that it does not look for a component.

```vue
<script setup>
import "@johnmorrisdotca/kyogijo-stadiums/element/define";
</script>

<template>
  <kyogijo-field sport="nfl" orientation="auto" away="Mexico" home="USA" away-score="27" home-score="24" status="final" />
</template>
```

```ts no-check
// vite.config.ts
import vue from "@vitejs/plugin-vue";

export default { plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag: string) => tag === "kyogijo-field" } } })] };
```

## Svelte

Svelte can use either way. The string is the simplest: `$:` recomputes it when the score changes.

```svelte
<script>
  import "@johnmorrisdotca/kyogijo-stadiums/element/define";
  import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
  export let home = 0;
  export let away = 0;
  $: svg = drawKyogijo({ sport: "nhl", away: { name: "USA", score: away }, home: { name: "Canada", score: home } });
</script>

{@html svg}
```

## Angular

Register the element in a module or a standalone component's `schemas`, and import the definition once.

```ts no-check
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import "@johnmorrisdotca/kyogijo-stadiums/element/define";

@Component({
  selector: "app-game",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<kyogijo-field sport="nhl" orientation="auto" [attr.away-score]="away" [attr.home-score]="home" away="USA" home="Canada"></kyogijo-field>`,
})
export class GameComponent {
  away = 3;
  home = 2;
}
```

Bind with `[attr.name]` rather than `[name]`, because the element reads attributes. For server-side rendering in Angular Universal, use the string and `[innerHTML]` instead, with a `DomSanitizer.bypassSecurityTrustHtml` only for the string this package returned.

## A web server with no framework

```js no-run
import { createServer } from "node:http";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const svg = drawKyogijo({ sport: url.searchParams.get("sport") === "nba" ? "nba" : "nhl", away: { name: "USA", score: 3 }, home: { name: "Canada", score: 2 }, status: "final" });
  response.writeHead(200, { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" });
  response.end(svg);
}).listen(6900);
```

An `image/svg+xml` response can be used as the `src` of an `<img>`, in an email, or in an Open Graph card, and the same options give the same bytes, so a CDN can cache it by its address. The [embedding guide](embed-in-a-page.md) has the browser side and the frame.
