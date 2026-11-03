# サウンド

日本語 · [English](sound.md)

競技面に音を付けられます。会場の種類に合った観客の音を「静か」から「大歓声」まで段階を選んで鳴らし、会場の屋根や広さに応じた響きで聞かせます。さらに、その競技の試合の音（ゴールのときのホーンと観客の沸き上がり、プレーが止まったときの笛、ピリオド終了のブザー、リングのゴング）を、再生中のリプレイから、またはページが送るライブのイベントから鳴らします。`@johnmorrisdotca/kyogijo-stadiums/sound` に入っていて、依存パッケージはありません。音はすべてブラウザーの中でWeb Audioを使って作ります。録音ファイルを持っている音は、ページ側からそのファイルを渡すこともできます。**見る人がオンにするまでは鳴りません**。それまでは何も取得せず、何も作らず、何もデコードしません。

[デモ](https://johnmorrisdotca.github.io/kyogijo-stadiums/venues.html?sound=on&lang=ja)では、実在のアリーナのページ、「試してみる」の競技面の下、ページ冒頭のアリーナの上、試合のセクションに「サウンド」ボタンがあります。

## 観客の音だけを鳴らす

```ts no-run
import { createKyogijoSound } from "@johnmorrisdotca/kyogijo-stadiums/sound";

const host = document.querySelector("#rink")!;
const sound = createKyogijoSound({ sport: "nhl", venue: { roof: "fixed", seats: 18000 }, view: "3d", level: "loud", host });
document.querySelector("#sound")!.addEventListener("click", () => sound.enable()); // ブラウザーは操作のあとでしか音を出せないため、ボタンの押下で呼ぶ
sound.setLevel("roar");
sound.setVolume(0.4);
sound.disable();
```

`createKyogijoSound(settings)` は `enable()` を呼ぶまで何も作りません。`enable()` はボタンを押したときなど、見る人の操作から呼びます（ブラウザーは操作のあとでしか音を出せません）。最初の `enable()` で、ページに1つだけのオーディオコンテキストを作り、`files` で渡された録音のうちその競技面で使うものを取得します。ページ内のすべてのサウンドが、このコンテキストを共有します。

| 設定 | 内容 |
| --- | --- |
| `sport` | 競技面（`nhl`、`soccer`、`judo` など）。サウンドセットのない競技面は音を出しません（`state().has` が false）。その場合、ページにはサウンドの操作を表示しません。 |
| `venue` | `{ roof, seats }`。屋根の種類（実在の会場のデータと同じ `open`、`canopy`、`cable`、`panels`、`fixed`、`dome`、`saddle`、`barrel`）と座席数です。省略すると会場の種類ごとの既定値を使います。 |
| `crowd` | 埋まっている座席の割合で、0から1まで（既定は1）。0は観客のいない建物で、館内の空気の音だけになり、盛り上がりの段階は選べません。 |
| `view` | `3d` は建物の中で聞く音、`2d` は真上から見た図で、中継のように観客が遠く、響きの少ない音になります。 |
| `level` | `quiet`、`murmur`、`engaged`（既定）、`loud`、`roar`、または `auto`（試合に合わせる。後述）。 |
| `volume` | 0から1まで（既定は0.6）。0は消音で、その間は何も鳴らさず、何も作りません。 |
| `files` | 名前ごとの録音（`murmur`、`applause`、`water`、`whistle`、`bell`、`ooh`、`cheer`、またはほかの音やレイヤーの名前）。最初の `enable()` で取得し、聞こえる状態になって初めてデコードします。渡されなかった音はブラウザーの中で作ります。 |
| `host` | 競技面を描いている要素。画面の外に出ている間は音を止めます。 |
| `onCue` | 合図の音が鳴るたびに呼ばれます。 |
| `audio`、`fetch`、`doc` | テスト用に差し替える、オーディオコンテキストを作る関数、fetch、document。 |

`setLevel`、`setVolume`、`setContext({ sport, venue, crowd, view })` で、鳴らしながら変えられます。観客の音はおよそ1秒かけて新しい段階に移り、競技面が変わればその会場の観客の音に切り替わります。`state()` は今の状態を返します。内容は `has`、`on`、`audible`、`quiet`（鳴っていない理由：`no-sound`、`off`、`muted`、`hidden`、`out-of-sight`、`paused`）、選んだ段階と実際に鳴っている段階（`heard`）、その競技面で選べる `levels` と使う `voices`、取得したファイルです。`destroy()` で止め、リスナーも取り除きます。

## サウンドセットの一覧

競技面の音は、ページごとに書くのではなく、一覧から引きます。会場の種類ごとに観客の音（**ベッド**）があり、競技ごとにベッドと合図の音をまとめた**セット**があります。ページの操作はそのセットに従い、選べる段階だけを表示します。セットのない競技面には何も表示しません。

| ベッド | 屋内 | 残響 | 段階 | 競技 |
| --- | --- | --- | --- | --- |
| `arena` | はい | 2.2秒 | 5段階すべて | アイスホッケー、バスケットボール、スピードスケート、フィギュアスケート |
| `stadium` | いいえ | 0.7秒 | 5段階すべて | 各種フットボール、サッカー、ラグビー、オーストラリアンフットボール、ゲーリック・ゲームズ、ラクロス、フィールドホッケー |
| `ballpark` | いいえ | 0.6秒 | 5段階すべて | 野球、クリケット |
| `hall` | はい | 1.6秒 | 5段階すべて | ネット球技・ラケット競技・コート球技のすべて、ハンドボール、ネットボール、カーリング（3段階） |
| `pool` | はい | 2.6秒 | 5段階すべてと水の音 | 競泳、水球、飛込、アーティスティックスイミング |
| `dojo` | はい | 1.3秒 | 「静か」から「歓声」まで | 柔道、空手、剣道、道場。弓道は「静か」と「ざわめき」のみ |
| `ring` | はい | 1.8秒 | 5段階すべて | 相撲、総合格闘技、ボクシング、レスリング、プロレス |
| `track` | いいえ | 0.8秒 | 5段階すべて | 陸上競技 |

競技ごとの合図の音は、場面の種類で決まります。アイスホッケーではゴールで**ホーン**と観客の**沸き上がり**、プレーが止まると**笛**、ピリオドの終わりに**ブザー**が鳴ります。バスケットボールもピリオドの終わりはブザーです。サッカーとフィールド球技では、プレーが止まると**笛**、試合終了では笛を3回吹き、ゴールでは観客が沸き上がります。コート球技の得点には**拍手**、リングではラウンドの開始と終了に**ゴング**、陸上競技のスタートには**号砲**、競泳のスタートには**電子音**が鳴ります。惜しいシュートでは観客が「**おお**」と声を上げます。サーキットにはまだセットがないため、サウンドの操作は表示しません。

```ts
import { SOUND_BEDS, cuesOf, soundLevelsOf, soundSetOf } from "@johnmorrisdotca/kyogijo-stadiums/sound";

console.log(soundSetOf("nhl")?.bed, SOUND_BEDS.arena.indoor, soundLevelsOf("kyudo").join());
console.log(cuesOf({ kind: "goal" }, "nhl").join(), cuesOf({ kind: "goal" }, "soccer").join(), soundSetOf("circuit"));
// arena true quiet,murmur
// horn,swell swell undefined
```

`SOUND_BEDS`、`SOUND_SETS`、`SOUND_OF_SPORT` が一覧です。パッケージが描くすべての競技面（サーキットを除く）にセットがあることを、テストで確かめています。

## 会場の響きと観客

音は競技面だけでなく、そのときの条件（コンテキスト）によっても変わります。`soundRoom(context)` は、会場がどれだけ囲まれているか（屋根）、どれだけ長く響くか（囲まれているほど、建物が大きいほど長くなります）、残響の量、そして観客の大きさを返します。観客の大きさは、座席数に埋まっている割合を掛けた人数から求めます。観客の音は人数に比例して大きくなるわけではないため、人数よりゆるやかに増える尺度を使っています。`soundMix(context, level)` は、これに加えて、その段階での各レイヤーの音量を返します。

```ts
import { soundMix, soundRoom } from "@johnmorrisdotca/kyogijo-stadiums/sound";

const arena = soundRoom({ sport: "nhl", venue: { roof: "fixed", seats: 18000 } })!;
const open = soundRoom({ sport: "soccer", venue: { roof: "open", seats: 50000 } })!;
console.log(arena.decay > open.decay, arena.wet > open.wet, soundRoom({ sport: "nhl", crowd: 0 })!.crowd);
const flat = soundRoom({ sport: "nhl", venue: { roof: "fixed", seats: 18000 }, view: "2d" })!;
console.log(flat.wet < arena.wet, soundMix({ sport: "judo" }, "roar")!.level);
// true true 0
// true loud
```

ベッドは4つのループを上げ下げして作ります。館内の**空気**、人々の**話し声**、**拍手**、観客全体の**声**です（プールには**水の音**が加わります）。静かな館内はほとんどが空気の音で、大歓声はほとんどが人の声です。その競技にない段階を選ぶと、いちばん近い段階になります。道場で「大歓声」を選ぶと「歓声」になります。

## 試合の合図

`sound.follow(controller, { periods, scoreAt })` は、音をリプレイのコントローラー（[`mount.replay`](./replay.md#playing-it-in-a-page) または [`view.replay`](./replay.md#in-3d)）に連動させます。再生中に通過したイベントの合図と、ピリオドの開始と終了の合図（最後の終了は試合終了）を鳴らし、一時停止中は音を止めます。`level: "auto"` では観客の盛り上がりが試合に合わせて変わります。

```ts no-run
import { createKyogijoSound } from "@johnmorrisdotca/kyogijo-stadiums/sound";
import { mountKyogijoTurn } from "@johnmorrisdotca/kyogijo-stadiums/turn";
import type { ReplayTimeline } from "@johnmorrisdotca/kyogijo-stadiums/replay";

declare const game: { timeline: ReplayTimeline; periods: { start: number; end: number }[] };
declare function scoreAt(game: unknown, t: number): { home: number; away: number };
const host = document.querySelector<HTMLElement>("#rink")!;
const view = mountKyogijoTurn(host, { sport: "nhl" });
const sound = createKyogijoSound({ sport: "nhl", level: "auto", host });
const replay = view.replay(game.timeline);
const stop = sound.follow(replay, { periods: game.periods, scoreAt: (t) => scoreAt(game, t) });
replay.play();
```

- **合図は再生中にだけ鳴ります。** 再生中に時計が進んだとき、または1コマ先へ進めたときに、通過した場面の合図を鳴らします。シーク、巻き戻し、一時停止、速度の変更では鳴りません。つまみをドラッグしている間は読み上げをしないのと同じです。このきまりは純粋関数 `cuesOfChange(change, from, sport, periods)` にまとめてあります。
- **タイムライン独自の語も読み取ります。** `cueKindOf` は `goal`、`touchdown`、`try`、`run`、`ippon`、`knockout` をゴール、`basket`、`point`、`score` を得点、`shot`、`save`、`miss` を惜しい場面、`whistle`、`foul`、`penalty`、`offside` をプレーの中断として読み、ピリオド、ラウンド、レースの開始と終了も読み取ります。`pass` では何も鳴りません。
- **「試合に合わせる」**（`excitementAt`）では、試合開始前、ピリオドの間、試合終了後は「ざわめき」、プレー中は「盛り上がり」、接戦（両チームの差が1点以内）の終盤3分の1は「歓声」、ゴールのあと6秒間は「大歓声」になります。終盤で一方が3点以上リードしていると「ざわめき」に戻ります。
- **試合の終わりは最後まで聞かせます。** 合図とともに時計が止まったとき（試合終了のホーンなど）は、`SOUND_TAIL`（5秒）のあいだ鳴らし続けてから止めます。使うタイマーはこの1つだけで、1回だけ動きます。
- **同じ音が0.2秒以内に重なったときは1回だけ鳴らします。** 速い再生でも笛が重なりません。

## ライブのイベント

試合がリプレイではなく、イベントが起きるたびに届くフィードの場合は、ページがイベントを送ります。`sound.cue({ kind, team })` はそのイベントの合図をすぐに鳴らし、`sound.game(moment)` は「試合に合わせる」ための試合の状態（`{ t, start, end, periods, score }`）を渡します。「試合に合わせる」では、ゴールのあと6秒間は「大歓声」になります。デモの[得点が動く例](https://johnmorrisdotca.github.io/kyogijo-stadiums/#live)は、この方法でゴールのたびにイベントを送っています。

```ts no-run
import { createKyogijoSound } from "@johnmorrisdotca/kyogijo-stadiums/sound";

declare const rounds: { start: number; end: number }[];
const sound = createKyogijoSound({ sport: "boxing", level: "auto" });
await sound.enable();
sound.cue({ kind: "round-start" });                      // ゴング
sound.game({ t: 50, start: 0, end: 540, periods: rounds, score: { home: 0, away: 0 } });
sound.cue({ kind: "knockout", team: "home" });           // 観客の沸き上がりと大歓声
```

## 処理の負担

- **既定ではオフです。** `enable()` の前には何も取得せず、何も作らず、何もデコードしません。すべての設定を変えても、オーディオコンテキストが作られず、ファイルも要求されないことをテストで確かめています。
- **オーディオコンテキストはページに1つです。** ページ内のすべてのサウンドが共有し、どれも聞こえていないときは一時停止します。
- **聞こえていない間は、鳴らすこともデコードすることもしません。** オフのとき、音量が0のとき、ページが非表示のとき、競技面が画面の外にあるとき（`host` を `IntersectionObserver` で見ています）、試合が一時停止しているときは、ベッドのループを止めて音の経路を取り除きます。その間に取得した録音は、聞こえる状態になってからデコードします。タイマーは動かず、アニメーションフレームも要求しません。唯一のタイマーは、試合の終わりを聞かせるためのものです。
- **ベッドの音量を動かすのは、段階か設定が変わったときだけです。** 試合の毎フレームには動かしません。
- **小さく作っています。** ブラウザーで作るループは6秒で、初めて聞こえるときにシードから一度だけ書き出します。デモの録音は短いループと単発の音で、モノラルのOpus（Opusをデコードできないブラウザー向けにAAC）です。どの競技でも読み込む量はOpusで110 kB未満、AACで190 kB未満で、すべての競技のセットが160 kBと250 kB以内に収まることをテストで確かめています。録音はnpmパッケージには含めません。

## 録音

パッケージには録音を含めません。音はブラウザーの中で作ります（笛はトリルを付けた高い音、ホーンはフィルターを通した3つの低いのこぎり波を1つの和音として伸ばしたもので、旋律にはしません。観客の声は、フィルターを通したノイズの音量をゆっくり変えて作ります）。デモは自前の録音を使います。どれもCC0かパブリックドメインで、出典、作者、ライセンスを[サウンドのクレジット](./sound-credits.md)に載せています。`pnpm sounds:fetch` と `pnpm sounds` で作り、音量をそろえ、低域を切り、ループのつなぎ目を消しています。自分のページでも、同じように `files` に名前で録音を渡せます。ただし、チームのゴールソング、ホーン、チャントは使わないでください。ライセンスで禁じられた録音も使えません。

## 見る人への配慮

- 音が勝手に鳴り始めることはありません。アドレスに `sound=on` がある場合（デモ）も、見る人がページのどこかを最初に押したときにオンになります。
- どの合図にも目で見える手がかりがあります。リプレイはライブリージョンでイベントを読み上げ、ページは `onCue` の内容を表示することもできます。
- 操作には英語と日本語の名前（`SOUND_WORDS`）が付いたボタン、音量のスライダーがあり、段階はボタンを横に並べています。折りたたんで開くリストにはしていません。動きを減らす設定にしている人にも音は聞こえます。この設定は画面の動きに関するものだからです。
- テストでは音を鳴らしません。オーディオコンテキストの代わりを使い、ブラウザーのテストでは実際の音の経路をメモリー上に書き出して（`OfflineAudioContext`）、無音でも音割れでもなく、段階ごとに大きくなることを確かめています。
