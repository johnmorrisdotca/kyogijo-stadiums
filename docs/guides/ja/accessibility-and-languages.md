# アクセシビリティ、英語と日本語

日本語 · [English](../accessibility-and-languages.md)

図は画像であり、スコアを示す画像は、目で見られない人にも読み取れなければなりません。このガイドでは、各図が自分で伝えていること、まわりのページがしなければならないこと、英語と日本語の言葉のしくみを示します。

## 図が自分で伝えること

各図は `role="img"` を持つ `svg` で、`<title>`（チームとスコア、または競技面）と `<desc>`（大会、ステータス、結果、競技面の説明）を持ち、`aria-labelledby` で結ばれています。`describe` は同じ二つの文字列を返すので、ページはそれをどこにでも使えます。`<img>` の `alt`、表のキャプション、ライブリージョンなどです。

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

`svg` の直下の子である `title` は、ブラウザーが図全体に付けるツールチップにもなります。ポインターを置いた場所にツールチップを出したくないページは、`<title>` を `<defs>` の中へ移します。`aria-labelledby` がそこでも見つけるので、ラベルは働き続けます。自分の言葉にしたいときは、オプションに `title` と `description` を渡します。

## 色に頼らないこと

- 勝者はスコアの下の棒で示され、負けた側は薄く描かれます。
- 外れたシュートは中抜きで、失敗したパスは破線なので、結果が色だけで伝わることはありません。
- スコアは、どちらのテーマでも暗いパネルの上の白い文字です。チームの文字は、その色の明るさに応じて黒か白になり、`textColor` を渡せばそれが優先されます。
- すべての見た目が WCAG 2.2 を満たします。線は下地に対して 3:1、文字はエプロン（競技面の周りの部分）に対して 4.5:1 です。
- 縦長の図では競技面を回して文字を戻すので、文字はいつも読める向きです。

## 動き

図は静止しています。[リプレイ](../../replay.md)は再生を指示したときにしか動かず、動きを減らす設定の人には一コマずつ切り替わり、ページが隠れると止まります。各ボタンには名前があり、大きさは 44 ピクセル以上で、フォーカスがはっきり見えます。スコアが変わると一度だけ膨らんで落ち着き、動きを減らす設定ではフェードインだけです。[3D 表示](the-3d-view.md)は再生を押した後にしか回らず、視点の間をなめらかに動くのも、動きを減らす設定でないときだけです。

## ページがしなければならないこと

パッケージはスコアの変化を読み上げません。スコアを変えるページは、独自の `aria-live="polite"` のライブリージョンで知らせるとよいでしょう。

```ts no-run
const live = document.querySelector("#score-live")!; // <p id="score-live" role="status" aria-live="polite" class="visually-hidden">
live.textContent = "Goal. USA 3, Canada 2.";
```

フレーム（`<iframe>`）には `title` を付けてください。データのレイヤーには表（`layerTable`）を付けて、図がなくても数値が分かるようにします。CSS での図の大きさは、文字が読める大きさ以上に保ってください。文字は図に合わせて拡縮するので、小さすぎる図の文字も小さくなります。

## 英語と日本語

`language` は `en` か `ja` です。タイトル、説明、ステータスの語、`eraChanges` の各ルール変更の文が切り替わり、デモも両方の言語に対応しています。チーム名、大会名、日付は、渡したとおりに（どの言語でも）書かれます。

```ts
import { KYOGIJO_STRINGS, describe } from "@johnmorrisdotca/kyogijo-stadiums";

const game = { sport: "nhl", away: { name: "USA", score: 3 }, home: { name: "Canada", score: 2 }, status: "final" } as const;
console.log(describe({ ...game, language: "ja" }).title);
console.log(Object.keys(KYOGIJO_STRINGS).join());
// USA 3、Canada 2、試合終了
// en,ja
```

場所の名前には、それぞれの組があります。球場、スタジアム、アリーナには `name` と `nameJa` があり、球場の日本語名にはかなの読み（`readingJa`）があります。言葉の一覧は[競技場の日本語](../../strings-ja.md)に英語と並べてあり、ルールブックが使う用語は[用語集](../../terminology.md)にあります。日本語はまだネイティブの読み手に読んでもらっていません。デモには、表示するときにその旨が出ます。訂正は [issue](https://github.com/johnmorrisdotca/kyogijo-stadiums/issues) で歓迎します。

より短いリファレンスは[アクセシビリティ](../../accessibility.md)のページにもあります。
