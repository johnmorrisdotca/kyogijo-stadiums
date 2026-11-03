# React、Vue、Svelte、Angular での使い方

日本語 · [English](../frameworks.md)

パッケージはフレームワークを一切インポートしません。図は文字列で、要素は標準のカスタム要素なので、どのフレームワークでも数行で足り、実行時の依存も増えません。フレームワークが HTML をどう扱うかに合わせて選んでください。

## どの連携にも共通する形

選択肢は二つで、どのフレームワークでもどちらも使えます。

1. **文字列。** `drawKyogijo(options)` を計算し、HTML として挿入します。スコアが変われば文字列が変わるので、追加の仕組みなしでリアクティブになります。フレームワークがサーバーで描画する場合に向いています。
2. **要素。** `element/define` を一度インポートして `<kyogijo-field ...>` と書きます。`orientation="auto"` のために自身のボックスを測ります。ページをブラウザーで組み立てる場合に向いています。

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

// 以下のどのフレームワークも、内部ではこれをしています。
const svg = drawKyogijo({ sport: "nfl", away: { name: "Mexico", score: 27 }, home: { name: "USA", score: 24 }, status: "final" });
console.log(svg.startsWith("<svg"), svg.includes("Mexico 27, USA 24"));
// true true
```

文字列にスクリプトは含まれず、オプション由来の値はすべてエスケープ済みです。色は `safeColour`、ロゴは `safeLogo` を通るので、チーム名にマークアップが入っていても、HTML として挿入してページが危険にさらされることはありません。

## React

`createKyogijo(React)` は、利用側の React を使って、`orientation="auto"` のためにボックスを測るコンポーネントを作ります。`kyogijoProps` は、どの要素にも展開できる props を返し、この経路では React をインポートしません。

```tsx
import React from "react";
import { createKyogijo, kyogijoProps } from "@johnmorrisdotca/kyogijo-stadiums/react";

const Kyogijo = createKyogijo(React);

export const Game = () => (
  <Kyogijo sport="nhl" orientation="auto" away={{ name: "USA", score: 3 }} home={{ name: "Canada", score: 2 }} status="final" />
);

// または自分の要素に展開する props：DOM に触れないので、サーバーコンポーネントでも動きます。
export const Plain = () => <div {...kyogijoProps({ sport: "nba" })} />;
```

React がレンダーのたびに新しい型と見なさないよう、このコンポーネントはほかのコンポーネントの外で一度だけ作ってください。

```ts
import { kyogijoProps } from "@johnmorrisdotca/kyogijo-stadiums/react";

const props = kyogijoProps({ sport: "nba" });
console.log(props["data-kyogijo"], props["data-orientation"], typeof props.dangerouslySetInnerHTML.__html);
// nba landscape string
```

## Vue

登録をインポートし、タグがコンポーネントではなくカスタム要素であることを Vue に伝えます。

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

Svelte ではどちらの方法も使えます。いちばん簡単なのは文字列で、スコアが変わると `$:` が再計算します。

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

モジュール、またはスタンドアロンコンポーネントの `schemas` に要素を登録し、定義を一度インポートします。

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

要素は属性を読むので、`[name]` ではなく `[attr.name]` でバインドします。Angular Universal でのサーバーサイドレンダリングでは、代わりに文字列を `[innerHTML]` で使い、このパッケージが返した文字列に限って `DomSanitizer.bypassSecurityTrustHtml` を使ってください。

## フレームワークを使わない Web サーバー

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

`image/svg+xml` の応答は `<img>` の `src` にも、メールにも、Open Graph のカードにも使えます。同じオプションからは同じバイト列ができるので、CDN が URL をキーにしてキャッシュできます。ブラウザー側とフレームは[埋め込みのガイド](embed-in-a-page.md)にあります。
