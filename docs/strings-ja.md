# The Japanese of Kyogijo

Made from `src/strings.ts` and `demo/words.js` by `pnpm docs:make`; a test holds this file to them. The Japanese has not yet been read by a native reader: a correction is welcome as a *Fix a translation* issue.

## The drawing's words (`KYOGIJO_STRINGS`)

| Key | English | 日本語 |
| --- | --- | --- |
| `surface.nfl` | NFL football field | NFLのフィールド |
| `surface.cfl` | CFL football field | CFLのフィールド |
| `surface.ifaf` | IFAF football field | IFAFのフィールド |
| `surface.nhl` | NHL hockey rink | NHLのアイスホッケーリンク |
| `surface.nba` | NBA basketball court | NBAのバスケットボールコート |
| `surface.mlb` | Baseball field | 野球場 |
| `surface.soccer` | Soccer pitch | サッカーのピッチ |
| `about.nfl` | an American football field, 120 by 53 and a third yards with its end zones, with a yard line every 5 yards, hash marks, numbers and goal posts | アメリカンフットボールのフィールド。エンドゾーンを含めて120ヤード×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります |
| `about.cfl` | a Canadian football field, 150 by 65 yards with its 20-yard end zones, with a yard line every 5 yards, hash marks, numbers and goal posts on the goal lines | カナディアンフットボールのフィールド。20ヤードのエンドゾーンを含めて150ヤード×65ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールライン上のゴールポストがあります |
| `about.ifaf` | an international (IFAF) football field, 120 by 53 and a third yards with its end zones, with a yard line every 5 yards, hash marks, numbers and goal posts | 国際アメリカンフットボール連盟（IFAF）規格のフィールド。エンドゾーンを含めて120ヤード×53⅓ヤードで、5ヤードごとのヤードライン、ハッシュマーク、ヤードナンバー、ゴールポストがあります |
| `about.nhl` | an ice hockey rink, 200 by 85 feet with rounded corners, with its red and blue lines, face-off circles, creases and goal nets | アイスホッケーのリンク。200フィート（約61m）×85フィート（約26m）で角が丸く、レッドライン、ブルーライン、フェイスオフサークル、クリース、ゴールがあります |
| `about.nba` | a basketball court, 94 by 50 feet, with its keys, three-point lines, free-throw circles and the centre circle | バスケットボールのコート。94フィート（約28.7m）×50フィート（約15.2m）で、ペイントエリア、スリーポイントライン、フリースローサークル、センターサークルがあります |
| `about.mlb` | a baseball field, with a 90-foot infield, the mound, the foul lines and the outfield fence | 野球場。塁間90フィート（約27.4m）の内野、マウンド、ファウルライン、外野フェンスがあります |
| `about.soccer` | a soccer pitch, {length} by {width} metres, with the halfway line, the centre circle, both penalty areas, goal areas, penalty marks and arcs, the corner arcs and the goals | サッカーのピッチ。{length}m×{width}mで、ハーフウェーライン、センターサークル、両側のペナルティエリアとゴールエリア、ペナルティマークとペナルティアーク、コーナーアーク、ゴールがあります |
| `status.final` | Final | 試合終了 |
| `status.final-ot` | Final/OT | 試合終了（延長） |
| `status.final-so` | Final/SO | 試合終了（SO） |
| `status.final-aet` | Final/AET | 試合終了（延長戦） |
| `status.final-pens` | Final/Pens | 試合終了（PK戦） |
| `status.live` | Live | 試合中 |
| `status.half` | Halftime | ハーフタイム |
| `status.extra-time` | Extra time | 延長戦 |
| `status.penalties` | Penalties | PK戦 |
| `status.postponed` | Postponed | 延期 |
| `soccer.futsal` | Futsal court | フットサルのコート |
| `soccer.aboutFutsal` | a futsal court, {length} by {width} metres, with the halfway line, the centre circle, both penalty areas, the penalty marks and the goals | フットサルのコート。{length}m×{width}mで、ハーフウェーライン、センターサークル、両側のペナルティエリア、ペナルティマーク、ゴールがあります |
| `soccer.half` | Half of it is shown. | 半面のみ表示しています。 |
| `scoreTitle` | {away} {awayScore}, {home} {homeScore} | {away} {awayScore}、{home} {homeScore} |
| `said.home` | home | ホーム |
| `said.away` | away | アウェイ |
| `said.won` | {name} won. | {name}の勝ちです。 |
| `said.tied` | The game is level. | 同点です。 |
| `said.park` | The outfield fence follows the figures published for {park}. | 外野フェンスは、{park}の公表されている距離をもとに描かれています。 |
| `said.ground` | The pitch follows the size published for {ground}. | ピッチは、{ground}の公表されている広さをもとに描かれています。 |
| `said.groundDefault` | No pitch size is published for {ground}, so the pitch has the international size of 105 by 68 metres. | {ground}のピッチの広さは公表されていないため、国際標準の105×68mで描かれています。 |
| `said.era` | The markings are those of the {season} season. | ラインやマークは{season}シーズンのものです。 |
| `said.wonPens` | {name} won {a}-{b} on penalties. | {name}がPK戦を{a}-{b}で制しました。 |
| `said.pens` | {a}-{b} pens | PK戦 {a}-{b} |
| `said.on` | Drawn as | 図の内容 |
| `said.sep` | ,  | 、 |
| `said.stop` | . | 。 |
| `said.colon` | :  | ： |
| `said.gap` |   |  |
| `layers.pointOne` | point | データ点 |
| `layers.pointMany` | points | データ点 |
| `layers.lineOne` | line | 線 |
| `layers.lineMany` | lines | 線 |
| `layers.arrowOne` | arrow | 矢印 |
| `layers.arrowMany` | arrows | 矢印 |
| `layers.textOne` | label | ラベル |
| `layers.textMany` | labels | ラベル |
| `layers.count` | {n} {noun} | {noun} {n}件 |
| `layers.item` | {name} {n} | {name} {n}件 |
| `layers.listSep` | ,  | 、 |
| `layers.outcomes` | By outcome: {list}. | 結果別：{list}。 |
| `layers.teams` | By team: {list}. | チーム別：{list}。 |
| `layers.values` | Values from {min} to {max}. | 値の範囲：{min}～{max}。 |
| `layers.skipped` | {n} left out for want of a place. | 位置が不明なため{n}件は描かれていません。 |
| `layers.data` | Data | データ |
| `layers.tableNo` | No. | 番号 |
| `layers.tableX` | x | x |
| `layers.tableY` | y | y |
| `layers.tableToX` | to x | 終点のx |
| `layers.tableToY` | to y | 終点のy |
| `layers.tablePath` | Path | 経路 |
| `layers.tableValue` | Value | 値 |
| `layers.tableTeam` | Team | チーム |
| `layers.tableOutcome` | Outcome | 結果 |
| `layers.tableNote` | Note | 備考 |
| `layers.tableText` | Text | ラベル |
| `layers.tableFrame` | Coordinates in {frame}, in {unit}. | 座標系：{frame}、単位：{unit}。 |
| `layers.tableMore` | The first {shown} of {total} rows. | 全{total}行のうち先頭の{shown}行を表示しています。 |
| `layers.heatTitle` | Heat map of {n} {noun} | {noun}のヒートマップ（{n}件） |
| `layers.hexTitle` | Hexagon map of {n} {noun} | {noun}の六角形ビン図（{n}件） |
| `layers.zonesTitle` | Zone chart of {n} {noun} | {noun}のゾーン別集計（{n}件） |
| `layers.contourTitle` | Density contours of {n} {noun} | {noun}の密度等高線（{n}件） |
| `layers.legendTitle` | Legend: {name} | 凡例：{name} |
| `layers.range` | {min} to {max} | {min}～{max} |
| `layers.heatNote` | {stat} in {n} cells, from {min} to {max}. | {n}個のセルの{stat}は{min}～{max}です。 |
| `layers.hexNote` | {stat} in {n} hexagons, from {min} to {max}. | {n}個の六角形の{stat}は{min}～{max}です。 |
| `layers.zoneNote` | {stat} in {n} zones, from {min} to {max}. | {n}個のゾーンの{stat}は{min}～{max}です。 |
| `layers.contourNote` | {n} density contours; the peak is near {x}, {y}. | 密度の等高線は{n}本です。ピークは({x}, {y})付近です。 |
| `layers.top` | Highest: {list}. | 上位：{list}。 |
| `layers.outside` | {n} outside the grid or the zones. | グリッドまたはゾーンの範囲外のデータが{n}件あります。 |
| `layers.stat.count` | Count | 件数 |
| `layers.stat.sum` | Sum | 合計 |
| `layers.stat.mean` | Mean | 平均 |
| `layers.stat.median` | Median | 中央値 |
| `layers.stat.percent` | Share of all, % | 全体に占める割合（％） |
| `layers.stat.max` | Highest | 最大 |
| `layers.stat.min` | Lowest | 最小 |
| `layers.stat.rate` | Success rate, % | 成功率（％） |
| `layers.stat.custom` | Value | 値 |
| `layers.stat.density` | Density, share of the peak, % | 密度（ピークに対する割合、％） |
| `layers.stat.mass` | Share of the data inside, % | 内側に含まれるデータの割合（％） |
| `layers.tableZone` | Zone | ゾーン |
| `layers.tableCount` | Count | 件数 |
| `layers.tableShare` | Share, % | 割合（％） |
| `layers.tableLevel` | Level | レベル |
| `layers.tableCell` | Cell | セル |
| `layers.tableCells` | {stat}. Centres of the cells in {frame}, in {unit}. | {stat}。各セルの中心の位置です。座標系：{frame}、単位：{unit}。 |
| `layers.tableCellsPlain` | {stat}. Centres of the cells, in {unit}. | {stat}。各セルの中心の位置です。単位：{unit}。 |
| `layers.valueItem` | {name} ({n}) | {name}（{n}） |
| `layers.zones.pair` | {a}, {b} | {a}・{b} |
| `layers.zones.atEnd` | {name} ({end}) | {name}（{end}） |
| `layers.zones.endLeft` | left end | 左ゴール側 |
| `layers.zones.endRight` | right end | 右ゴール側 |
| `layers.zones.band` | band {n} | {n}列目 |
| `layers.zones.zone` | Zone {n} | ゾーン{n} |
| `layers.zones.wingLeft` | Left wing | 左サイド |
| `layers.zones.halfLeft` | Left half-space | 左ハーフスペース |
| `layers.zones.laneCentre` | Centre | 中央 |
| `layers.zones.halfRight` | Right half-space | 右ハーフスペース |
| `layers.zones.wingRight` | Right wing | 右サイド |
| `layers.zones.defensiveThird` | Defensive third | ディフェンディングサード |
| `layers.zones.middleThird` | Middle third | ミドルサード |
| `layers.zones.attackingThird` | Attacking third | アタッキングサード |
| `layers.zones.restricted` | Restricted area | リストリクテッドエリア |
| `layers.zones.paint` | In the paint (non-RA) | ペイント内（リストリクテッドエリア外） |
| `layers.zones.midRange` | Mid-range | ミッドレンジ |
| `layers.zones.cornerLeft` | Left corner 3 | 左コーナー3 |
| `layers.zones.cornerRight` | Right corner 3 | 右コーナー3 |
| `layers.zones.aboveBreak` | Above the break 3 | アバブ・ザ・ブレイク3 |
| `layers.zones.innerSlot` | Inner slot | 内側スロット |
| `layers.zones.outerSlot` | Outer slot | 外側スロット |
| `layers.zones.offensiveZone` | Offensive zone | アタッキングゾーン |
| `layers.zones.behindGoalLine` | Behind the goal line | ゴールライン後方 |
| `layers.zones.homePlate` | Home plate | ゴール前の五角形エリア |
| `layers.zones.outsideHomePlate` | Outside home plate | 五角形エリアの外 |
| `layers.zones.pull` | Pull | 引っ張り方向 |
| `layers.zones.opposite` | Opposite | 逆方向 |
| `layers.zones.sprayCentre` | Centre | センター方向 |
| `layers.zones.leftField` | Left field | レフト方向 |
| `layers.zones.centreField` | Centre field | センター方向 |
| `layers.zones.rightField` | Right field | ライト方向 |
| `layers.zones.infield` | infield | 内野 |
| `layers.zones.outfield` | outfield | 外野 |
| `layers.zones.lengthShort` | Short | ショートパス |
| `layers.zones.lengthDeep` | Deep | ディープパス |
| `layers.zones.sideLeft` | left | 左 |
| `layers.zones.sideMiddle` | middle | 中央 |
| `layers.zones.sideRight` | right | 右 |

## The demo's words (`WORDS`)

| Key | English | 日本語 |
| --- | --- | --- |
| `pitch` | Sports fields, rinks, courts and ballparks drawn to scale as SVG, with each team's name and logo on its side and the score in the middle. Light and dark, tall or wide, and one line to put it in your page. | フィールド・リンク・コート・球場を縮尺どおりにSVGで描きます。両チームの名前とロゴを両脇に、得点を中央に表示できます。ライト・ダーク、縦・横に対応し、1行でページに組み込めます。 |
| `name` | 競技場 (kyōgijō) is Japanese for a sports ground. | 競技場（きょうぎじょう）は、スポーツの試合や競技を行う場所のことです。 |
| `nameLink` | About the name | 名前の由来（英語） |
| `foot` | Every dimension is from a rulebook or a published figure; the sources are in the repository. | 寸法はすべて、ルールブックまたは公表されている数値に基づいています。出典はリポジトリに載っています。 |
| `pageApi` | API reference | API（英語） |
| `groupSurface` | Surface | 競技場 |
| `groupTeams` | Teams | チーム |
| `tryTitle` | Try it | 試してみる |
| `tryText` | Pick a surface, give it two teams and a score, and copy the line that draws it. Everything here runs in your browser. | 競技場を選び、2チームと得点を入力すると、その図を描く1行のコードをコピーできます。すべてブラウザー上で動作します。 |
| `sport` | Sport | 競技 |
| `sport_nfl` | NFL | NFL |
| `sport_cfl` | CFL | CFL |
| `sport_ifaf` | IFAF | IFAF |
| `sport_nhl` | NHL | NHL |
| `sport_nba` | NBA | NBA |
| `sport_mlb` | Baseball | 野球 |
| `sport_soccer` | Soccer | サッカー |
| `pitchLabel` | Pitch | ピッチ |
| `pitch_fifa` | International, 105 × 68 m | 国際試合 105×68m |
| `pitch_uefa` | UEFA, 105 × 68 m | UEFA 105×68m |
| `pitch_mls` | MLS least size, 110 × 70 yd | MLSの最小サイズ 110×70ヤード |
| `pitch_ncaa` | NCAA best size, 120 × 75 yd | NCAAの推奨サイズ 120×75ヤード |
| `pitch_law_min` | Smallest under the Laws, 90 × 45 m | 競技規則の最小サイズ 90×45m |
| `pitch_law_max` | Largest under the Laws, 120 × 90 m | 競技規則の最大サイズ 120×90m |
| `pitch_9_a_side` | 9-a-side (FA), 80 × 50 yd | 9人制（FA） 80×50ヤード |
| `pitch_7_a_side` | 7-a-side (FA), 60 × 40 yd | 7人制（FA） 60×40ヤード |
| `pitch_5_a_side` | 5-a-side (FA), 40 × 30 yd | 5人制（FA） 40×30ヤード |
| `pitch_futsal` | Futsal (FIFA), 40 × 20 m | フットサル（FIFA） 40×20m |
| `groundLabel` | Ground | スタジアム |
| `groundNone` | None (the pitch above) | なし（上のピッチ） |
| `groundGroupFinals` | World Cup finals | ワールドカップ決勝の会場 |
| `groundGroup2026` | Other 2026 World Cup venues | 2026年ワールドカップのその他の会場 |
| `groundGroupClubs` | Club and other grounds | クラブなどのスタジアム |
| `pitchTypeLabel` | Provider's frame | 提供元の座標系 |
| `pitchTypeNone` | None (the Laws') | なし（競技規則どおり） |
| `stripePattern` | Mowing | 芝の模様 |
| `pattern_bands` | Bands | 短辺に沿った縞 |
| `pattern_wide` | Wide | 太い縞 |
| `pattern_narrow` | Narrow | 細い縞 |
| `pattern_lengthwise` | Lengthwise | 長辺に沿った縞 |
| `pattern_checks` | Checks | 市松 |
| `pattern_diagonal` | Diagonal | 斜め |
| `pattern_none` | None | なし |
| `goalStyle` | Goals | ゴール |
| `goals_box` | Net | ネット |
| `goals_line` | Line | 線 |
| `goals_strip` | Strip | 帯 |
| `goals_none` | None | なし |
| `half` | Show | 表示範囲 |
| `half_none` | Whole pitch | ピッチ全体 |
| `half_left` | Left half | 左半面 |
| `half_right` | Right half | 右半面 |
| `cornerFlags` | Corner flags | コーナーフラッグ |
| `teamPens` | Pens | PK |
| `park` | Ballpark | 球場 |
| `parkGeneric` | A generic field | 標準的なグラウンド |
| `parkGroupMlb` | MLB, today's home parks | MLB（現在の本拠地） |
| `parkGroupMlbPast` | MLB, parks of the past | MLB（過去の球場） |
| `parkGroupNpb` | NPB, today's home parks | NPB（現在の本拠地） |
| `parkGroupOther` | NPB, other and past grounds | NPB（準本拠地・過去の球場） |
| `era` | Season | シーズン |
| `era_today` | Today | 現在 |
| `era_past` | A past season | 過去のシーズン |
| `eraYear` | Year | 年 |
| `eraNotes` | How it differed from today | 現在との違い |
| `eraNone` | Nothing on this surface differs from today's. | この競技場には、現在と異なる点はありません。 |
| `eraPlanned` | Announced for this season, not yet played. | このシーズンに向けて発表された変更で、まだ行われていません。 |
| `size` | Show | 表示 |
| `size_full` | On the surface | 競技場に重ねる |
| `size_compact` | Compact | コンパクト |
| `size_badge` | Badge | バッジ |
| `size_surface` | Surface only | 競技場のみ |
| `orientation` | Layout | 向き |
| `orientation_landscape` | Wide | 横 |
| `orientation_portrait` | Tall | 縦 |
| `orientation_auto` | Fit the box | 枠に合わせる |
| `theme` | Page theme | ページのテーマ |
| `theme_auto` | Device | 端末に合わせる |
| `theme_light` | Light | ライト |
| `theme_dark` | Dark | ダーク |
| `away` | Away team | アウェイ |
| `awayBaseball` | Away team | ビジター |
| `home` | Home team | ホーム |
| `teamName` | Name | 名前 |
| `teamAbbr` | Short | 略称 |
| `teamScore` | Score | 得点 |
| `teamColour` | Colour | 色 |
| `teamLogo` | Logo | ロゴ |
| `logo_none` | None | なし |
| `logo_emblem` | Emblem | エンブレム |
| `logo_url` | Address | URL |
| `logoUrl` | Logo address (https) | ロゴのURL（https） |
| `swap` | Swap sides | 左右を入れ替える |
| `game` | The game | 試合 |
| `status` | Status | 状況 |
| `status_final` | Final | 試合終了 |
| `status_final_ot` | Final/OT | 延長で試合終了 |
| `status_final_so` | Final/SO | シュートアウトで試合終了 |
| `status_live` | Live | 試合中 |
| `status_half` | Halftime | ハーフタイム |
| `status_final_aet` | Final/AET | 延長戦で試合終了 |
| `status_final_pens` | Final/Pens | PK戦で試合終了 |
| `status_custom` | Your own | 自由入力 |
| `statusCustom` | Status text | 状況のテキスト |
| `competition` | Competition | 大会 |
| `date` | Date | 日付 |
| `label` | Foot line | 下段の文言 |
| `winner` | Emphasis | 強調 |
| `winner_auto` | Winner of a final | 終了時の勝者 |
| `winner_leader` | Leader | リード側 |
| `winner_none` | None | なし |
| `winner_home` | Home | ホーム |
| `winner_away` | Away | アウェイ |
| `look` | The look | 見た目 |
| `detail` | Markings | ライン表示 |
| `detail_full` | All | すべて |
| `detail_simple` | Simple | 簡略 |
| `stripes` | Mown stripes | 芝の縞模様 |
| `exact` | True line widths | 実寸の線幅 |
| `court` | Court | コート |
| `court_default` | Theme's own | 標準 |
| `court_maple` | Maple | メープル |
| `court_twoTone` | Two-tone | ツートン |
| `court_night` | Night | ナイト |
| `court_sunburst` | Sunburst | サンバースト |
| `court_tournament` | Tournament | トーナメント |
| `baseline` | Words on the baselines | ベースラインの文字 |
| `centreLogo` | Logo at centre court | センターのロゴ |
| `usesTitle` | Everything is one call | すべては1つの呼び出し |
| `embedTitle` | Put it in your page | ページに組み込む |
| `embedText` | Four ways, from one line of HTML to a string of SVG. Each shows the call for what you have set above. | 1行のHTMLからSVG文字列まで、4つの方法があります。上の設定に合わせた呼び出しコードを、それぞれ表示します。 |
| `embed_module` | Module | モジュール |
| `embed_element` | Element | 要素 |
| `embed_iframe` | Iframe | iframe |
| `embed_svg` | SVG | SVG |
| `embedModuleNote` | Import the package from npm or a CDN and call it. It returns a string of SVG. | npmまたはCDNからパッケージを読み込んで呼び出します。SVGの文字列が返ります。 |
| `embedElementNote` | A standard custom element: no build step and no framework. Its parts can be styled from the page. | 標準のカスタム要素です。ビルドもフレームワークも要りません。各部分はページ側のCSSでスタイルを指定できます。 |
| `embedIframeNote` | For a page that cannot run scripts of its own: a frame that draws itself from the address. | スクリプトを実行できないページ向けです。URLを指定するだけで描画されるフレームです。 |
| `embedSvgNote` | The finished drawing as one file, with its stylesheet inside. Save it, or paste it into a page. | 完成した図を1つのファイルにしたものです。スタイルシートも含まれています。保存するか、ページに貼り付けます。 |
| `copy` | Copy | コピー |
| `copied` | Copied | コピーしました |
| `download` | Download SVG | SVGを保存 |
| `galleryTitle` | Every sport | すべての競技 |
| `galleryText` | A score on each surface, each laid out for the box it is in. | それぞれの競技場に得点を載せ、枠に合わせて配置しています。 |
| `sideTitle` | Wide and tall | 横と縦 |
| `sideText` | The same game, turned a quarter for a phone. The words stay upright and the teams go top and bottom. | 同じ試合を、スマートフォン向けに90度回しました。文字は回転せず水平のまま、チームは上下に並びます。 |
| `badgeTitle` | Badges for a list | 一覧用のバッジ |
| `badgeText` | One strip each: the team, the score, a picture of the sport and the status. | 1本の帯に、チーム、得点、競技のアイコン、状況をまとめます。 |
| `compactTitle` | Compact cards | コンパクトなカード |
| `compactText` | The surface with the score under it, for a card. | 競技場の下に得点の帯を付けた、カード向けの形です。 |
| `courtTitle` | Court looks | コートの見た目 |
| `courtText` | The paint, the border, the wood and the words on the baselines are options. These use plain colours and no one's marks. | ペイント、縁取り、床の木目、ベースラインの文字は設定できます。ここでは単色だけを使い、実在するチームのマークは使っていません。 |
| `dataTitle` | Data on the surface | 競技場の上のデータ |
| `dataText` | Shots, passes and balls in play over the surface they happened on: sized by chance, coloured by team, hollow for a miss, dashed for a pass not caught. Heat maps, shot zones, positional zones and density contours count the marks into cells, zones and bands instead. The data is made up from a fixed seed; no real game, player or team is in it. | シュート、パス、打球の落下点などを、起きた位置に合わせて競技場の上に描きます。大きさは得点の見込み、色はチーム、白抜きは外れたシュート、破線は通らなかったパスを表します。ヒートマップ、シュートゾーン、ポジショナルプレーのゾーン、密度の等高線は、点を一つずつ描くかわりに、セルやゾーン、帯ごとに集計して表します。データは固定のシード値から作った架空のもので、実際の試合、選手、チームは含まれていません。 |
| `data_shots` | A shot map on the rink | リンク上のシュートマップ |
| `data_passes` | A pass map on the field | フィールド上のパスマップ |
| `data_spray` | A spray chart on a ballpark | 球場上の打球方向図 |
| `data_heat` | A heat map of shots on the rink | リンク上のシュートのヒートマップ |
| `data_zones` | An NBA shot-zone chart with field-goal percentages | フィールドゴール成功率つきのNBAシュートゾーン図 |
| `data_positional` | A positional heat map on the pitch | ピッチ上のヒートマップ（ポジショナルプレーのゾーン別） |
| `data_density` | A density contour on a ballpark | 野球場の打球密度の等高線 |
| `dataTable` | Show the data as a table | データを表で見る |
| `parksTitle` | Ballparks | 球場 |
| `parksText` | Thirty current MLB parks and forty-four past ones, and the NPB's twelve home parks and eight other grounds, each fence drawn from the distances its article publishes. Press one to try it. | 現在のMLB30球場と過去の44球場、NPBの本拠地12球場とその他8球場。外野フェンスは、各球場の記事で公表されている距離をもとに描いています。球場を選ぶと試せます。 |
| `parksShow` | Show the parks | 球場を表示する |
| `pitchesTitle` | The soccer pitch | サッカーのピッチ |
| `pitchesText` | A pitch from the Laws of the Game at any size, with the presets of UEFA, the MLS, the NCAA, the FA and FIFA's futsal, the size of sixty-four famous grounds, half pitches, and a score that ends after extra time or on penalties. | 競技規則に基づくピッチを、好きな広さで描けます。UEFA、MLS、NCAA、FA、FIFAフットサルの規格、有名な64のスタジアムの広さ、半面表示に対応し、延長戦やPK戦で決着した試合の得点も表示できます。 |
| `pitchCompact` | Compact card, after extra time | 延長戦後のコンパクトなカード |
| `pitchHalf` | Half a pitch, in checks | 半面を市松模様で |
| `patternsTitle` | Mowing and goals | 芝の模様とゴール |
| `providersTitle` | Data providers' pitches | データ提供元ごとのピッチ |
| `providersText` | Each provider writes the pitch in its own numbers. Drawn in its own frame, the lines stand where the provider puts them and raw data plots without converting. | データ提供元ごとに、ピッチの座標の取り方が違います。提供元の座標系で描くと、ラインは提供元の定める位置に引かれ、生のデータを変換せずにそのまま描き込めます。 |
| `providerFixed` | fixed figures | 固定値 |
| `providerSized` | follows the pitch | ピッチの大きさに連動 |
| `convTitle` | Move a point between providers | 提供元どうしで点を変換する |
| `convText` | A point on a line of the pitch stays on that line: the penalty line of one provider is the penalty line of the other. | ピッチのライン上の点は、変換しても同じライン上にあります。たとえば、一方の提供元のペナルティエリアのラインは、もう一方の提供元のペナルティエリアのラインに移ります。 |
| `convFrom` | From | 変換元 |
| `convTo` | To | 変換先 |
| `convSpot` | The penalty mark | ペナルティマーク |
| `convResult` | Becomes | 変換後 |
| `convBad` | Two numbers, please | 数値を2つ入力してください |
| `liveTitle` | A live score | 得点が動く例 |
| `liveText` | The score moves and the drawing is drawn again. Nothing is fetched: it is a made-up game. | 得点が動くたびに図を描き直します。通信はしません。架空の試合です。 |
| `liveStep` | Next play | 次のプレー |
| `livePlay` | Play | 再生 |
| `livePause` | Pause | 一時停止 |
| `liveNew` | New game | 新しい試合 |
| `elementTitle` | As an element | 要素として |
| `elementText` | Each of these is a <kyogijo-field> tag with attributes and no script of its own. | ここにあるのはどれも、属性だけを指定した <kyogijo-field> タグで、専用のスクリプトはありません。 |
| `moreText` | Everything here is a call of one function. | ここにあるものは、すべて1つの関数の呼び出しです。 |
| `copiedLine` | Copied to the clipboard | クリップボードにコピーしました |

## The surfaces through the years (`eraChanges`)

| Change | English | 日本語 |
| --- | --- | --- |
| `nfl.hash.start` | No hash marks: a play starts where the ball was whistled dead. | ハッシュマークはなく、プレーはボールデッドになった地点から再開されます。 |
| `nfl.posts.1920` | The goal posts stand on the goal line. | ゴールポストはゴールラインの上に立っています。 |
| `nfl.postShape.1920` | The goal posts are an H: two poles in the ground joined by the crossbar. | ゴールポストは「H」の形で、地面に立つ2本の支柱をクロスバーがつないでいます。 |
| `nfl.posts.1927` | The goal posts move back to the end line, at the back of the end zone. | ゴールポストがエンドゾーンの奥、エンドラインの上に下がります。 |
| `nfl.hash.1933` | Hash marks are adopted, 10 yards (30 feet) from each sideline. | ハッシュマークが採用され、両サイドラインから10ヤード（30フィート）の位置に引かれます。 |
| `nfl.posts.1933` | The goal posts come forward again to the goal line, to encourage field goals. | フィールドゴールを増やすため、ゴールポストがゴールラインの上に戻ります。 |
| `nfl.hash.1935` | The hash marks move in to 15 yards (45 feet) from each sideline. | ハッシュマークが内側に寄り、両サイドラインから15ヤード（45フィート）の位置になります。 |
| `nfl.hash.1945` | The hash marks move in to 20 yards (60 feet) from each sideline. | ハッシュマークが内側に寄り、両サイドラインから20ヤード（60フィート）の位置になります。 |
| `nfl.postShape.1967` | The slingshot post is introduced: one curved support behind the crossbar. | スリングショット型のゴールポストが登場します。クロスバーの後ろに湾曲した1本の支柱が立つ形です。 |
| `nfl.hash.1972` | The hash marks move in to 70 feet 9 inches from each sideline, the width of the goal posts. | ハッシュマークが内側に寄り、両サイドラインから70フィート9インチ（約21.6m）の位置になって、左右の間隔がゴールポストの幅と同じになります。 |
| `nfl.posts.1974` | The goal posts go back to the end line, to discourage field goals. | フィールドゴールを減らすため、ゴールポストがエンドラインの上に下がります。 |
| `cfl.endZone.start` | End zones are 25 yards deep (a field 160 yards long in all). | エンドゾーンの奥行きは25ヤードで、エンドゾーンを含むフィールド全体の長さは160ヤードです。 |
| `cfl.length.start` | 110 yards between the goal lines. | ゴールライン間は110ヤードです。 |
| `cfl.posts.start` | The goal posts stand on the goal line. | ゴールポストはゴールラインの上に立っています。 |
| `cfl.endZone.1986` | End zones are cut to 20 yards deep. | エンドゾーンの奥行きが20ヤードに短くなります。 |
| `cfl.hash.2015` | Hash marks are 24 yards from each sideline, 17 yards apart. | ハッシュマークは両サイドラインから24ヤードで、間隔は17ヤードです。 |
| `cfl.hash.2022` | The hash marks move in to 28 yards from each sideline, 9 yards apart. | ハッシュマークが内側に寄り、両サイドラインから28ヤードの位置になって、間隔は9ヤードになります。 |
| `cfl.endZone.2027` | Planned: end zones 15 yards deep. | 予定：エンドゾーンの奥行きが15ヤードになります。 |
| `cfl.length.2027` | Planned: 100 yards between the goal lines. | 予定：ゴールライン間が100ヤードになります。 |
| `cfl.posts.2027` | Planned: the goal posts move to the end line, the back of the end zone. | 予定：ゴールポストがエンドゾーンの奥、エンドラインの上に移ります。 |
| `nhl.centreLine.start` | No centre red line: two blue lines divide the ice and nothing marks the middle. | センターレッドラインはなく、リンクを分けるのは2本のブルーラインだけで、中央に線はありません。 |
| `nhl.trapezoid.start` | No trapezoid behind the net: the goaltender may play the puck anywhere. | ゴール裏にトラペゾイド（台形の区域）はなく、ゴールキーパーはどこでもパックを扱えます。 |
| `nhl.centreLine.1943` | The centre red line is added, so that a team can pass out of its own zone up to it. | センターレッドラインが加わり、自陣ゾーンからこのラインまでのパスが認められるようになります。 |
| `nhl.goalLine.1997` | Goal lines are 11 feet from the end boards. | ゴールラインはエンドボードから11フィート（約3.4m）です。 |
| `nhl.blueLine.1998` | Blue lines are 73 feet from the end boards: a 54-foot neutral zone and 73-foot offensive zones. | ブルーラインはエンドボードから73フィート（約22.3m）で、ニュートラルゾーンは54フィート（約16.5m）です。 |
| `nhl.goalLine.1998` | Goal lines move out to 13 feet from the end boards, for room behind the net. | ゴールラインがエンドボードから13フィート（約4.0m）の位置に移り、ゴール裏が広くなります。 |
| `nhl.blueLine.2005` | Blue lines move out to 75 feet from the end boards, cutting the neutral zone to 50 feet. | ブルーラインがエンドボードから75フィート（約22.9m）に移り、ニュートラルゾーンが50フィート（約15.2m）に狭まります。 |
| `nhl.goalLine.2005` | Goal lines move back to 11 feet from the end boards. | ゴールラインがエンドボードから11フィートの位置に戻ります。 |
| `nhl.trapezoid.2005` | The goaltender's trapezoid is marked behind each net: 18 feet at the goal line, 28 feet at the end boards. | 各ゴールの裏に、ゴールキーパーがパックを扱える区域として台形（トラペゾイド）が引かれます。ゴールライン側が18フィート、エンドボード側が28フィートです。 |
| `nhl.trapezoid.2014` | The trapezoid is widened to 22 feet at the goal line (2 feet each side). | トラペゾイドのゴールライン側が左右2フィートずつ広がり、22フィートになります。 |
| `nba.keyWidth.start` | The lane is 6 feet wide, the narrow keyhole the key is named for. | レーン（ペイントエリア）の幅は6フィート（約1.8m）で、細い鍵穴のような形です。「キー」という呼び名はこの形に由来します。 |
| `nba.threePoint.start` | No three-point line. | スリーポイントラインはありません。 |
| `nba.restrictedArea.start` | No restricted area under the basket. | バスケットの下にノーチャージセミサークル（リストリクテッドエリア）はありません。 |
| `nba.keyWidth.1951` | The lane is widened to 12 feet, against George Mikan. | ジョージ・マイカンへの対策として、レーンの幅が12フィート（約3.7m）に広がります。 |
| `nba.keyWidth.1964` | The lane is widened to 16 feet, against Wilt Chamberlain. | ウィルト・チェンバレンへの対策として、レーンの幅が16フィート（約4.9m）に広がります。 |
| `nba.threePoint.1979` | The three-point line is adopted: 23 feet 9 inches from the basket, 22 feet in the corners. | スリーポイントラインが採用されます。バスケットから23フィート9インチ（約7.24m）、コーナーは22フィート（約6.7m）です。 |
| `nba.threePoint.1994` | The three-point line is shortened to a uniform 22 feet all the way round. | スリーポイントラインが短くなり、全周でバスケットから22フィートになります。 |
| `nba.restrictedArea.1997` | The restricted area is marked, a half circle of 4 feet from the middle of the basket. | バスケットの中心から半径4フィート（約1.2m）の半円で、ノーチャージセミサークル（リストリクテッドエリア）が描かれます。 |
| `nba.threePoint.1997` | The three-point line goes back to 23 feet 9 inches (22 feet in the corners). | スリーポイントラインが元の23フィート9インチ（コーナーは22フィート）に戻ります。 |
| `mlb.battersBox.start` | No batter's boxes: the batter hits with the front foot on a line through the centre of the plate. | バッターボックスはなく、打者は本塁の中心を通る線の上に前足を置いて打ちます。 |
| `mlb.plateShape.1857` | Home plate is a round iron plate of one square foot, about 13½ inches across. | 本塁は面積が1平方フィートの円形の鉄板で、直径は約13.5インチです。 |
| `mlb.platePlacement.1861` | The centre of home plate stands on the meeting of the foul lines. | 本塁の中心がファウルラインの交点に置かれます。 |
| `mlb.plateShape.1868` | Home plate is a 12-inch square, its flat sides towards the pitcher and the catcher. | 本塁は一辺12インチの正方形で、平らな辺が投手と捕手のほうを向きます。 |
| `mlb.pitcher.1871` | The pitcher throws from a chalked box whose front edge is 45 feet from home plate (its size is not given; drawn as the 1887 box). | 投手は、本塁側の辺が本塁から45フィート（約13.7m）の位置にある、チョークで描いたピッチャーズボックスの中から投げます（ボックスの大きさは不明のため、1887年のものと同じ大きさで描いています）。 |
| `mlb.plateShape.1871` | The 12-inch square is turned 45 degrees, a corner towards the pitcher. | 一辺12インチの正方形が45度回され、角が投手のほうを向きます。 |
| `mlb.battersBox.1874` | Batter's boxes appear, 6 feet by 3 feet, 12 inches from the plate. | バッターボックスが登場し、6フィート×3フィートで、本塁から12インチ離れています。 |
| `mlb.platePlacement.1875` | Home plate is moved wholly into foul ground, the pitcher's point on the meeting of the foul lines. | 本塁が完全にファウルゾーンへ移り、投手側の角がファウルラインの交点に置かれます。 |
| `mlb.platePlacement.1877` | Home plate is moved forward to its modern place, wholly in fair ground, its back point on the foul lines' meeting. | 本塁が現在の位置、つまり完全にフェアゾーンの中に移り、後ろの角がファウルラインの交点に置かれます。 |
| `mlb.pitcher.1881` | The box's front edge moves back to 50 feet (its size is not given; drawn as the 1887 box). | ピッチャーズボックスの本塁側の辺が本塁から50フィート（約15.2m）の位置に遠ざかります（ボックスの大きさは不明のため、1887年のものと同じ大きさで描いています）。 |
| `mlb.battersBox.1885` | Batter's boxes take their modern size, 6 feet by 4 feet, 6 inches from the plate (the National League in 1885). | バッターボックスが現在と同じ6フィート×4フィートの大きさになり、本塁から6インチ離れます（ナショナルリーグでは1885年）。 |
| `mlb.pitcher.1887` | The box is 4 feet wide and 5½ feet deep, its front edge 50 feet from home plate. | ピッチャーズボックスは幅4フィート、奥行き5.5フィートで、本塁側の辺は本塁から50フィートです。 |
| `mlb.pitcher.1893` | The box gives way to the pitcher's plate, its front edge 60 feet 6 inches from home plate. | ピッチャーズボックスに代わって投手板が使われ、その本塁側の縁は本塁から60フィート6インチ（約18.44m）です。 |
| `mlb.plateShape.1900` | The five-sided plate of white rubber is adopted, as it is today. | 現在と同じ五角形の白いゴム製の本塁が採用されます。 |
| `mlb.moundHeight.1903` | The mound may stand 15 inches above home plate. | マウンドは本塁より15インチ（約38cm）まで高くできます。 |
| `mlb.moundHeight.1969` | The mound is lowered to 10 inches, after the Year of the Pitcher. | 「投手の年」と呼ばれた1968年のあと、マウンドの高さが10インチ（約25cm）に低くなります。 |

## The parks' Japanese names

| Key | English | 日本語 | Team |
| --- | --- | --- | --- |
| `tokyo-dome` | Tokyo Dome | 東京ドーム | 読売ジャイアンツ |
| `hanshin-koshien-stadium` | Hanshin Koshien Stadium | 阪神甲子園球場 | 阪神タイガース |
| `meiji-jingu-stadium` | Meiji Jingu Stadium | 明治神宮野球場 | 東京ヤクルトスワローズ |
| `yokohama-stadium` | Yokohama Stadium | 横浜スタジアム | 横浜DeNAベイスターズ |
| `vantelin-dome-nagoya` | Vantelin Dome Nagoya | バンテリンドーム ナゴヤ | 中日ドラゴンズ |
| `mazda-stadium-hiroshima` | Mazda Zoom-Zoom Stadium Hiroshima | MAZDA Zoom-Zoom スタジアム広島 | 広島東洋カープ |
| `es-con-field-hokkaido` | ES CON Field Hokkaido | エスコンフィールドHOKKAIDO | 北海道日本ハムファイターズ |
| `rakuten-mobile-park-miyagi` | Rakuten Mobile Park Miyagi | 楽天モバイルパーク宮城 | 東北楽天ゴールデンイーグルス |
| `belluna-dome` | Belluna Dome | ベルーナドーム | 埼玉西武ライオンズ |
| `zozo-marine-stadium` | ZOZO Marine Stadium | ZOZOマリンスタジアム | 千葉ロッテマリーンズ |
| `kyocera-dome-osaka` | Kyocera Dome Osaka | 京セラドーム大阪 | オリックス・バファローズ |
| `mizuho-paypay-dome-fukuoka` | Mizuho PayPay Dome Fukuoka | みずほPayPayドーム福岡 | 福岡ソフトバンクホークス |
| `sapporo-dome` | Sapporo Dome | 札幌ドーム | 北海道日本ハムファイターズ（2004〜2022年） |
| `hotto-motto-field-kobe` | Hotto Motto Field Kobe | ほっともっとフィールド神戸 | オリックス・バファローズ（準本拠地） |
| `hiroshima-municipal-stadium` | Hiroshima Municipal Stadium (original) | 旧広島市民球場 | 広島東洋カープ（1957〜2008年） |
| `korakuen-stadium` | Korakuen Stadium | 後楽園球場 | 読売ジャイアンツ（1937〜1987年） |
| `osaka-stadium` | Osaka Stadium | 大阪球場 | 南海ホークス（1950〜1988年） |
| `heiwadai-stadium` | Heiwadai Stadium | 平和台野球場 | 西鉄ライオンズとその後身（〜1978年） |
| `kawasaki-stadium` | Kawasaki Stadium | 川崎球場 | ロッテオリオンズ（1978〜1991年） |
| `nagoya-stadium` | Nagoya Stadium | ナゴヤ球場 | 中日ドラゴンズ（1948〜1996年） |

## The grounds' Japanese names

| Key | English | 日本語 | Name in the place's language |
| --- | --- | --- | --- |
| `estadio-centenario` | Estadio Centenario | エスタディオ・センテナリオ | Estadio Centenario |
| `stadio-nazionale-pnf` | Stadio Nazionale PNF | スタディオ・ナツィオナーレPNF | Stadio Nazionale del PNF |
| `stade-yves-du-manoir` | Stade Yves-du-Manoir | スタッド・デパルトモンタル・イヴ＝デュ＝マノワール | Stade départemental Yves-du-Manoir |
| `maracana` | Maracanã Stadium | エスタジオ・ド・マラカナン | Estádio do Maracanã |
| `wankdorf` | Wankdorf Stadium | シュタディオン・ヴァンクドルフ | Wankdorfstadion |
| `rasunda` | Råsunda Stadium | ロースンダ・スタディオン | Råsunda fotbollsstadion |
| `estadio-nacional-santiago` | Julio Martínez Prádanos National Stadium | エスタディオ・ナシオナル・デ・チリ | Estadio Nacional Julio Martínez Prádanos |
| `wembley-1923` | Wembley Stadium (1923) | 旧ウェンブリー・スタジアム |  |
| `wembley` | Wembley Stadium | ウェンブリー・スタジアム |  |
| `estadio-azteca` | Estadio Azteca | エスタディオ・アステカ | Estadio Azteca |
| `olympiastadion-munich` | Olympiastadion (Munich) | ミュンヘン・オリンピアシュタディオン | Olympiastadion München |
| `monumental` | Estadio Monumental | エスタディオ・モヌメンタル・アントニオ・ベスプチオ・リベルティ | Estadio Monumental |
| `santiago-bernabeu` | Santiago Bernabéu Stadium | エスタディオ・サンティアゴ・ベルナベウ | Estadio Santiago Bernabéu |
| `stadio-olimpico-rome` | Stadio Olimpico | スタディオ・オリンピコ・ディ・ローマ | Stadio Olimpico |
| `rose-bowl` | Rose Bowl | ローズボウル |  |
| `stade-de-france` | Stade de France | スタッド・ド・フランス | Stade de France |
| `nissan-stadium-yokohama` | Nissan Stadium | 横浜国際総合競技場 | 横浜国際総合競技場 |
| `olympiastadion-berlin` | Olympiastadion Berlin | ベルリン・オリンピアシュタディオン | Olympiastadion Berlin |
| `soccer-city` | FNB Stadium | FNBスタジアム |  |
| `luzhniki` | Luzhniki Stadium | ルジニキ・スタジアム | стадион «Лужники» |
| `lusail` | Lusail Stadium | ルサイル・アイコニック・スタジアム | استاد لوسيل |
| `metlife-stadium` | MetLife Stadium | メットライフ・スタジアム |  |
| `att-stadium` | AT&T Stadium | AT&Tスタジアム |  |
| `arrowhead-stadium` | Arrowhead Stadium | アローヘッド・スタジアム |  |
| `nrg-stadium` | Reliant Stadium | リライアント・スタジアム |  |
| `mercedes-benz-stadium` | Mercedes-Benz Stadium | メルセデス・ベンツ・スタジアム |  |
| `hard-rock-stadium` | Hard Rock Stadium | ハードロック・スタジアム |  |
| `sofi-stadium` | SoFi Stadium | SoFiスタジアム |  |
| `levis-stadium` | Levi's Stadium | リーバイス・スタジアム |  |
| `lumen-field` | Lumen Field | ルーメン・フィールド |  |
| `gillette-stadium` | Gillette Stadium | ジレット・スタジアム |  |
| `lincoln-financial-field` | Lincoln Financial Field | リンカーン・フィナンシャル・フィールド |  |
| `bmo-field` | BMO Field | BMOフィールド |  |
| `bc-place` | BC Place | BCプレイス |  |
| `estadio-bbva` | Estadio BBVA | エスタディオBBVA | Estadio BBVA |
| `estadio-akron` | Estadio Akron | エスタディオ・アクロン | Estadio Akron |
| `tianhe-stadium` | Tianhe Stadium | 天河体育中心体育場 | 天河体育中心体育场 |
| `dignity-health-sports-park` | Dignity Health Sports Park | ディグニティ・ヘルス・スポーツ・パーク |  |
| `hongkou-football-stadium` | Hongkou Football Stadium | 上海虹口足球場 | 虹口足球场 |
| `waldstadion-frankfurt` | Deutsche Bank Park | ヴァルトシュタディオン | Deutsche Bank Park |
| `groupama-stadium` | Parc Olympique Lyonnais | パルク・オリンピック・リヨン | Parc Olympique Lyonnais |
| `stadium-australia` | Stadium Australia | スタジアム・オーストラリア |  |
| `camp-nou` | Camp Nou | カンプ・ノウ | Camp Nou |
| `san-siro` | San Siro | スタディオ・ジュゼッペ・メアッツァ | Stadio Giuseppe Meazza |
| `old-trafford` | Old Trafford | オールド・トラッフォード |  |
| `anfield` | Anfield | アンフィールド |  |
| `signal-iduna-park` | Signal Iduna Park | ジグナル・イドゥナ・パルク | Signal Iduna Park |
| `allianz-arena` | Allianz Arena | アリアンツ・アレーナ | Allianz Arena |
| `la-bombonera` | La Bombonera | ラ・ボンボネーラ | Estadio Alberto José Armando |
| `hampden-park` | Hampden Park | ハムデン・パーク |  |
| `celtic-park` | Celtic Park | セルティック・パーク |  |
| `estadio-da-luz` | Estádio da Luz | エスタディオ・ダ・ルス | Estádio da Luz |
| `parc-des-princes` | Parc des Princes | パルク・デ・プランス | Parc des Princes |
| `saitama-stadium-2002` | Saitama Stadium 2002 | 埼玉スタジアム2002 | 埼玉スタジアム2002 |
| `seoul-world-cup-stadium` | Seoul World Cup Stadium | ソウルワールドカップ競技場 | 서울월드컵경기장 |
| `emirates-stadium` | Emirates Stadium | エミレーツ・スタジアム |  |
| `etihad-stadium` | Etihad Stadium | シティ・オブ・マンチェスター・スタジアム |  |
| `stamford-bridge` | Stamford Bridge | スタンフォード・ブリッジ |  |
| `tottenham-hotspur-stadium` | Tottenham Hotspur Stadium | トッテナム・ホットスパー・スタジアム |  |
| `ibrox` | Ibrox Stadium | アイブロックス・スタジアム |  |
| `johan-cruyff-arena` | Johan Cruyff Arena | ヨハン・クライフ・アレナ | Johan Cruijff ArenA |
| `allianz-stadium-turin` | Allianz Stadium | ユヴェントス・スタジアム | Allianz Stadium |
| `japan-national-stadium` | Japan National Stadium | 国立競技場 | 国立競技場 |
| `kashima-soccer-stadium` | Kashima Soccer Stadium | 茨城県立カシマサッカースタジアム | 茨城県立カシマサッカースタジアム |
