# 設計：図はどう作られるか

日本語 · [English](../architecture.md)

このガイドは、パッケージを変更したい人、またはその振る舞いの理由を理解したい人のための地図です。ファイルごとの一覧は[設計](../../architecture.md)にあります。このページは、その一覧の土台になっている考え方と、それを保つ検査を説明します。

## 三つのルール

1. **図は、オプションだけで決まる純粋な関数です。** 時計も乱数もカウンターも DOM も使いません。同じオプションからは同じ文字列ができ、テストがそれを保証します。図の中の ID は、呼び出し側が渡さなければ、オプションのハッシュから作られます。だから文字列はキャッシュでき、比較でき、スナップショットテストでき、サーバーとブラウザーが一致します。
2. **外から来るものはすべて、入る時点で安全にします。** 文字列はエスケープされ、色は `safeColour` を、ロゴの URL は `safeLogo` を通ります。マークアップに届く新しいオプションには、悪意のある値でのテストが付きます。
3. **どのエントリーポイントも単独で成り立ちます。** エントリーポイントは約 40 あります。`parks` をインポートしてもアイスホッケーリンクの描画コードは読み込まれず、`district` をインポートしてもフットボール場は読み込まれません。ページの大きさはインポートしたものの合計で、ページごとの予算を CI で確認しています（`scripts/bundle-budget.json`）。

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

const options = { sport: "nhl", away: { name: "USA", score: 3 }, home: { name: "Canada", score: 2 }, status: "final" } as const;
console.log(drawKyogijo(options) === drawKyogijo(options));
// true
```

## 一回の呼び出しの流れ

```text
options ──► draw.ts ──► 競技面 (surfaces/*.ts) ──► レイヤー (draw.parts.ts) ──► スコア (score.ts) ──► 一つの文字列
              │               │
              │               └─ geometry.ts がすべての寸法を持ち、それぞれの出典は docs/sources.md にある
              └─ スタイルシートは、`style: "none"` でなければ図ごとに一度書かれる
```

`draw.ts` はオプションを読み、競技面を選び、そのマークアップと、チームやスコアを置く場所を求めます。競技面はマークアップとその場所を返す関数で、スコアのことは何も知りません。`score.ts` が、両チームを両端に、スコアを中央に置きます。レイヤー、観客、旗とエンブレム（`pageant`）、試合の状況は、`full.ts` が埋める表に入っています。そのため、多数の会場を描く軽量な地区は、使わない部分を含みません。

## 数値の出どころ

`src/geometry.ts` のすべての数値は、ルールブック、連盟の図面、球場の公表された数値のどれかに由来し、`docs/sources.md` が出典を示します。寸法を変えるときは出典を示し、古い値を検出できるテストを付けます。球場、スタジアム、アリーナ、会場は手で書いたものではありません。`scripts/*.data.json` が審査済みの一覧（距離だけで、記事の文章や画像は使いません）を持ち、`pnpm parks`、`pnpm grounds`、`pnpm arenas`、`pnpm venues` が `src/*.data.ts` を書き出します。生成されたファイルは決して直接編集せず、元を変えてスクリプトを実行してください。

## レンダラーは描き直さず、図を読む

SVG は一度だけ書かれます。`scene` がそのテキストを単純なデータ（描画順のすべての図形と、ライトかダークかに応じて計算した色）に解析し、`canvas`、`d3`、`plot`、`geojson`、`png` がシーンを読みます。パッケージのテストでは、すべての図で `writeSvg(parseSvg(svg)) === svg` が成り立つので、レンダラーが SVG と食い違うことはありません。

```ts
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
import { parseSvg, sceneOf, writeSvg } from "@johnmorrisdotca/kyogijo-stadiums/scene";

const svg = drawKyogijo({ sport: "nhl", id: "rink" });
console.log(writeSvg(parseSvg(svg)) === svg, sceneOf({ sport: "nhl", id: "rink" }).items.length > 10);
// true true
```

## 3D 表示は、傾けた平らな図

3D 表示は平らな図を床とし、その上にルールブックの部品を `matrix3d` を一つずつ持つ面として立てます。競技面を二度描くことはないので、競技面を変えれば 3D にもすぐ反映されます。カメラ、視点、画質の段階は、地区、サーキット、審判員の配置の表示、フライスルーで共通です。

## 正しさを保つ検査

| 検査 | 何を確かめるか |
| --- | --- |
| `pnpm check` | lint、型、単体テスト（全競技のスナップショット、全見た目のコントラスト、サイズの予算）、ビルド、pack したパッケージ |
| `pnpm test:readme` | README、ドキュメント、これらのガイドのすべての例を、ビルドしたパッケージに対して実行し、コメントに書かれた出力と比べる |
| `pnpm test:demo` | Chromium と WebKit で、スマートフォン幅とデスクトップ幅のデモを確認。三つの端末クラスの速度確認 |
| `pnpm docs:check` | ガイドとその日本語版（タイトル、同じコードブロック、リンク、画像）、README と変更履歴、そしてページのテストとすべての例 |

読む人に見える変更を加えたリリースは、npm のページに反映されるまで終わりではありません。新しい画像は `pnpm screenshots:readme` で作り、README かドキュメントに項目を足します。[CONTRIBUTING](../../../CONTRIBUTING.md) を参照してください。
