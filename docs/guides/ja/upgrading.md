# アップグレード

日本語 · [English](../upgrading.md)

パッケージは 0.x なので、マイナーバージョンで描き方が変わることがあります。すべてのリリースは[変更履歴](../../../CHANGELOG.md)に日付付きで書かれ、コードや保存した図を壊しうる変更には **Breaking** と印が付いています。このガイドでは、これまでに起きたそれぞれについて何をすればよいか、そして次のアップグレードを楽にする方法を説明します。

## アップグレードの前に

1. 自分のバージョンから新しいバージョンまでの変更履歴を、**Breaking** の文字に注意して読みます。
2. 今のバージョンを確かめます。`VERSION` はメインのエントリーポイントからエクスポートされ、各図は `data-version` として持っています。
3. 新しいバージョンをブランチで入れて、テストを実行します。図全体のスナップショットはバージョンとともに変わるので（[困ったとき](troubleshooting.md#アップグレード後にスナップショットテストが失敗する)を参照）、バイト列ではなく部分を比べてください。

```ts
import { VERSION, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(/^\d+\.\d+\.\d+$/.test(VERSION), drawKyogijo({ sport: "nhl" }).includes(`data-version="${VERSION}"`));
// true true
```

## 保存した図

同じバージョンの中では、同じオプションから同じ文字列ができます。つまり、保存した SVG はオプションのキャッシュです。オプションも一緒に保存し、`data-version` が現在のバージョンでなければ描き直してください。古い文字列をいつまでも持ち続けないでください。NHL と MLB の図は 0.2.0 で変わり（台形、ハッシュマーク、ベースが現在のルールブックに従うようになりました）、英語と日本語のすべての図が 0.3.0 で変わりました（名前と言葉）。

## `@johnmorrisdotca/kyogijo` から `kyogijo-stadiums` へ（0.4.0）

パッケージの名前が変わりました。コードも、その中の名前もそのままです。`drawKyogijo`、`mountKyogijo`、`<kyogijo-field>`、`kyogijo` クラスです。変わるのは、インストールとインポートの元だけです。

```sh
npm uninstall @johnmorrisdotca/kyogijo
npm install @johnmorrisdotca/kyogijo-stadiums
```

そのうえで、エントリーポイント（`/charts`、`/replay`、`/layouts`）や CDN の URL を含め、インポートのパスをすべて書き換えます。`.../kyogijo@0/...` は `.../kyogijo-stadiums@0/...` になります。古いパッケージの最後のバージョンは 0.3.0 です。

## ホームチームが先（0.4.0）

サッカー、ラグビー（ユニオンとリーグ）、オーストラリアンフットボール、ゲーリック・ゲームズ、フィールドホッケー、ハンドボール、クリケットは、既定でホームチームを先に、つまり左に置くようになりました。以前の配置にしたいときは `homeSide: "right"` を渡します。NFL、CFL、IFAF、NHL、NBA、MLB は変わりません。

## 決勝への道のりの移動（0.4.0）

`roadToFinal` と決勝への道のりのチャートは、`@johnmorrisdotca/taisen-brackets`（その `/road` エントリーポイント）に移りました。そこでトーナメント表の見た目を共有します。互換用の再エクスポートはありません。`roadToFinal`、`ROAD_SIZES`、`KYOGIJO_ROAD_STYLE` と、決勝への道のりに関する型は `charts` からなくなりました。

## 球場とスタジアムの名前（0.3.0）

`name` は普段の名前、`nameJa` は普段の日本語の名前になり、引用した記事の題名ではなくなりました。古い名前は `aliases` に入っています。`Ground.nameLocal` は `localName` になりました。球場の名前を保存して比べていたなら、`parkByName` を使ってください。球場がこれまで呼ばれたどの名前でも見つけます。

```ts
import { parkByName } from "@johnmorrisdotca/kyogijo-stadiums/parks";

console.log(parkByName("Hanshin Koshien Stadium")?.id, parkByName("甲子園球場")?.id);
// hanshin-koshien-stadium hanshin-koshien-stadium
```

## 球場のステータス（0.2.0）

`Park["status"]` は `"current" | "secondary" | "past"` で、値 `"historic"` は `"past"` になりました。`Sport` は同じリリースで 6 から 20 の競技に増え（今は 43）、`Sport` に対する default のない TypeScript の `switch` には新しい case が必要です。

## ルールの訂正（0.2.0）

NHL の台形はゴールラインで幅 22 フィート（2014-15 年より前は 18 フィートで、`rulesFor("nhl", year)` は今もそれを返します）、NHL のハッシュマークの間隔は 5 フィート 7 インチ、MLB のベースは 2023 年から 18 インチ四方です。`year` を設定して描いた図は、そのシーズンのルールで描かれます。

## 次のアップグレードを楽にする

- 必要な中でいちばん狭いエントリーポイント（メインではなく `.../parks`）からインポートします。別のエントリーポイントの変更が影響しなくなります。
- 元データにするのは SVG ではなくオプションです。
- バージョンはロックファイルで固定し、変更履歴を開いたうえで、意図してアップグレードします。
