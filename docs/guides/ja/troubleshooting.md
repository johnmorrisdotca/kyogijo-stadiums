# 困ったとき・よくある質問

日本語 · [English](../troubleshooting.md)

以下は、パッケージを初めてページに入れたときによく出会う問題です。それぞれ、症状、原因、直し方を書いています。ここにない場合は、[issue](https://github.com/johnmorrisdotca/kyogijo-stadiums/issues) からお知らせください。オプションとバージョン（`VERSION`、または図の `data-version`）を添えていただけると、早くお答えできます。

## `<kyogijo-field>` の場所に何も出ない

このタグはカスタム要素で、登録されるまで空です。登録を一度インポートしてください。

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/kyogijo-stadiums@0/dist/element-define.js"></script>
```

バンドラーなら `import "@johnmorrisdotca/kyogijo-stadiums/element/define";` です。`.../element` だけをインポートしても、クラスが得られるだけで登録はされません。Vue では、タグがカスタム要素であることをコンパイラーに伝えないと（`isCustomElement`）、未知のコンポーネントだと警告されます。[フレームワーク](frameworks.md)を参照してください。

## `document is not defined`、またはサーバーで真っ白になる

`mountKyogijo`、`mountKyogijoTurn`、要素には DOM が必要です。サーバーでは文字列を使います。`drawKyogijo(options)` は DOM を必要とせず、SVG のテキストを返します。Next.js、Nuxt、SvelteKit では、ページのサーバー側で呼んで、文字列を挿入してください。

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(typeof document, drawKyogijo({ sport: "nhl" }).startsWith("<svg"));
// undefined true
```

## 図が大きすぎる、または高さがない

`svg` は `display: block; width: 100%; height: auto` なので、横幅はコンテナいっぱいに、高さは形に応じて決まります。幅を持たないコンテナ（`float`、`flex-basis` のない inline-flex のアイテム）では、幅がありません。CSS でコンテナに幅を、または図に `max-width` を与えてください。`orientation: "auto"` では、コンテナの高さか幅が図に依存しないようにしないと、測るものがありません。

## 渡した色と違う

`colors` と `featureColors` が受け付けるのは、16 進の色、`rgb()`、`rgba()`、`hsl()`、`hsla()`、色名、`var(--name)` で、64 文字までです。それ以外はマークアップに書き込まれず無視されます。拒否された値は `safeColour` が `undefined` を返すので分かります。

```ts
import { safeColour } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(safeColour("#1c3f7a"), safeColour("url(javascript:alert(1))"));
// #1c3f7a undefined
```

パッケージの既定値は詳細度が 0 の `:where()` なので、ページのルールもオプションより優先されます。自分のスタイルシートに `--ky-surface` などがないか探してください。[見た目と色](looks-and-colours.md)を参照してください。

## ダークモードがページの切り替えに従わない

既定では、図は `prefers-color-scheme` に従います。ページに独自の切り替えがあるなら、ルート要素に `data-theme="dark"` か `"light"` を付けるか（図が従います）、オプションに `theme` を渡してください。

## 部位の名前や球場が「不明」と言われる

`featureColors` に渡せる名前は `FEATURES[sport]` にあるものです。その競技にない名前はエラーになり、使える名前が一覧されます。球場は `PARKS` のキー（`PARK_IDS` に一覧があります）で、`parkByName` は、英語でも日本語でも、これまで呼ばれたどの名前でも球場を見つけます。

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

try {
  drawKyogijo({ sport: "nhl", featureColors: { "no-such-part": "#fff" } });
} catch (error) {
  console.log(String((error as Error).message).includes("blue-lines"));
}
// true
```

## ロゴが出ない

`logo` は、https または相対の URL、画像のデータ URL、または SVG のテキストです。それ以外の URL（`http:`、`javascript:`、`file:`）は無視され、画像でないデータ URL も無視されます。ロゴは画像として描かれるので、ファイルがページから届く場所にある必要があります。使えるロゴのないチームは、名前だけになります。

## スコアが逆側にある

スコアは、その競技の表記順で描かれます。サッカーやラグビーなど世界の多くの競技はホームが先（左）で、北米のリーグはアウェイが先です。`homeSide: "left"` か `"right"` を設定してください。データを入れ替えてはいけません。[競技面にスコアを載せる](score-and-layout.md#ホームチームはどちら側か)を参照してください。

## ページに図を二つ置くとおかしい、またはページが重い

各図は自分のスタイルシート（8〜10 kB）と ID を持っています。多数を置くなら `style: "none"` を渡し、`KYOGIJO_STYLE` をページに一度だけ置いてください。`id` を渡すときは、図ごとに違うものにしてください。渡さなければ、オプションから ID が作られます。

## アップグレード後にスナップショットテストが失敗する

どの図も `data-version` を持ち、ID もオプションとバージョンから作られます。そのため、図全体のスナップショットは、バージョンが変わると変わります。気にする部分（タイトル、説明、クラス）をスナップショットにするか、`id` を渡して `data-version` を取り除いてください。描き方が変わるリリースは[変更履歴](../../../CHANGELOG.md)に書かれ、互換性を壊すものは[アップグレード](upgrading.md)に一覧があります。

## `toPNG` が失敗する

PNG の出力は Node 用で、省略可能なピア依存パッケージ `@resvg/resvg-js` が必要です。インストールするか、エラーを捕捉してください。比較すべきメッセージは `PNG_PEER_MISSING` です。パッケージのほかの機能にピア依存はありません。

## スマートフォンで 3D 表示が重い

3D 表示は DOM と CSS でできていて、回転の一歩のたびに、動かす要素の数に比例した負担がかかります。`quality: "auto"`（既定）のままにすれば、フレームが少ない端末では描く量を減らします。`low` に固定することもできます。ページあたりの 3D 表示は一つにして、残りは平らな図にしてください。[3D 表示](the-3d-view.md#画質と速さ)を参照してください。

## ポインターのヘルパーが `null` を返す

`clientPointToField` は、`pointer: true` なしで描いた図、`badge` サイズの図、特別な試合（競技面の中に別の競技面を置いたもの）、ページにない要素、3D 表示に対して `null` を返します。[競技面の上のデータ](data-on-a-surface.md#5-クリックを場所にする)を参照してください。

## 対応する Node とブラウザー

サーバーでは Node 22 以降です。ブラウザーは、ES モジュール、`:where()`、画像への SVG 2 の `href` に対応していれば動きます（Chrome と Edge 88、Safari 14、Firefox 78）。カスタム要素にはシャドウ DOM と `part` が必要です。
