# リーグごとの違い

日本語 · [English](variants.md)

オプションの `league` は、あるリーグの規則書どおりに競技場を描きます。`sport` は競技の系統を指します（バスケットボールは `nba`、アイスホッケーは `nhl`、アメリカンフットボールとカナディアンフットボールは `nfl`・`cfl`・`ifaf`、野球とソフトボールは `mlb`、カーリングのシートは `curling`、ネット型・ラケット型などのコート競技は `tennis`・`volleyball`・`badminton`・`pickleball`・`tabletennis`・`padel`・`squash`・`racquetball`・`sepaktakraw`・`teqball`・`roundnet`・`netball`、フィールド球技は `lacrosse`・`rugby`・`afl`・`gaelic`・`cricket`・`fieldhockey`・`handball`）。このページは `src/leagues/` から `pnpm docs:make` で作られ、テストがそれとの一致を確かめます。各リーグの寸法（規則書の値を、規則書の単位で載せたもの）と出典の書名や版は、[英語版](variants.md)の表にあります。ここには、リーグの日本語名と、出典の URL（2026-10-13 に読み取ったもの）と、日付のわかる変更の日本語の説明を載せています。

`year` は、出典が変更の日付を示している場合にかぎり、そのシーズンのリーグの描き方になります（各表の下の「日付のわかる変更」）。それ以外のリーグでは `year` は無視され、現在の規則書のとおりに描きます。その競技の標準のリーグ（NBA、NHL、NFL、CFL、IFAF、MLB、World Curling、ITF、FIVB の屋内コート、BWF、USA Pickleball、ITTF、FIP、World Squash のシングルスコート、IRF、ISTAF、FITEQ、International Roundnet Federation、World Netball）は、[`year`](./eras.md) で年ごとの変遷を描けます。

## バスケットボール

`sport: "nba"`

| `league` | 名前 |
| --- | --- |
| `nba`（その競技の標準） | NBAのバスケットボールコート |
| `wnba` | WNBAのバスケットボールコート |
| `fiba` | FIBAのバスケットボールコート |
| `ncaa-men` | NCAA男子のバスケットボールコート |
| `ncaa-women` | NCAA女子のバスケットボールコート |
| `nfhs` | 全米高校連盟（NFHS）のバスケットボールコート |
| `gleague` | NBA Gリーグのバスケットボールコート |

出典の URL：

- `nba-rules`: <https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2026/10/2026-27-Official-NBA-Playing-Rules.pdf>
- `wnba-rules`: <https://cdn.wnba.com/sites/4/2026/05/2026-WNBA-Official-Rule-Book.pdf>
- `fiba-rules`: <https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-0.pdf>
- `ncaa-men-basketball`: <https://ncaaorg.s3.amazonaws.com/championships/sports/basketball/rules/men/PRMBB_RulesBook.pdf>
- `ncaa-news-2015`: <https://www.ncaa.com/news/basketball-men/article/2015-05-15/mens-basketball-rules-committee-recommends-package-proposals>
- `ncaa-women-basketball`: <https://ncaaorg.s3.amazonaws.com/championships/sports/basketball/rules/women/PRWBB_RulesBook.pdf>
- `ncaa-women-history`: <https://ncaaorg.s3.amazonaws.com/championships/sports/basketball/rules/women/2023-24PRWBB_PlayingRulesHistory.pdf>
- `nfhs-basketball`: <https://assets.nfhs.org/umbraco/media/7213108/basketball-court-diagram.pdf>
- `gleague-faq`: <https://gleague.nba.com/faq>
- `gleague-rules`: <https://gleague.nba.com/gleague-playing-rules>

日付のわかる変更：

| 変更 | 内容 |
| --- | --- |
| `wnba.laneWidth.start` | フリースローレーン（ペイントエリア）の幅は12フィート（約3.7m）です。 |
| `wnba.laneWidth.2004` | フリースローレーンの幅が、NBAと同じ16フィート（約4.9m）に広がります。 |
| `ncaa-men.restricted.start` | バスケットの下にリストリクテッドエリア（半円）はありません。 |
| `ncaa-men.restricted.2011` | バスケットの中心から半径3フィート（約0.9m）のリストリクテッドエリア（半円）が描かれます。 |
| `ncaa-men.restricted.2015` | リストリクテッドエリアの半径が4フィート（約1.2m）に広がります。 |
| `ncaa-women.restricted.start` | バスケットの下にリストリクテッドエリア（半円）はありません。 |
| `ncaa-women.restricted.2011` | バスケットの中心から半径3フィート（約0.9m）のリストリクテッドエリア（半円）が描かれます。 |
| `ncaa-women.restricted.2017` | リストリクテッドエリアの半径が4フィート（約1.2m）に広がります。 |
| `ncaa-women.restricted.2023` | リストリクテッドエリアはバスケット直下の区域だけとなり、半円のラインは必須ではなくなります。 |

## アイスホッケー

`sport: "nhl"`

| `league` | 名前 |
| --- | --- |
| `nhl`（その競技の標準） | NHLのアイスホッケーリンク |
| `iihf` | IIHF（国際アイスホッケー連盟）のアイスホッケーリンク |
| `ncaa-men` | NCAA男子のアイスホッケーリンク |
| `ncaa-women` | NCAA女子のアイスホッケーリンク |
| `ahl` | AHLのアイスホッケーリンク |
| `echl` | ECHLのアイスホッケーリンク |
| `ohl` | OHLのアイスホッケーリンク |
| `whl` | WHLのアイスホッケーリンク |
| `qmjhl` | QMJHLのアイスホッケーリンク |
| `ushl` | USHLのアイスホッケーリンク |
| `pwhl` | PWHLのアイスホッケーリンク |
| `olympic` | オリンピックのアイスホッケーリンク（60×26m） |
| `boston-garden` | ボストン・ガーデンのアイスホッケーリンク |

出典の URL：

- `nhl-rules`: <https://media.nhl.com/site/asset/public/ext/2025-26/2025-26Rules.pdf>
- `iihf-2025`: <https://blob.iihf.com/iihf-media/iihfmvc/media/contentimages/4_sport/officiating/rule_book/25_26/2025-26_iihf_rulebook_30062025-v1.pdf>
- `ncaa-hockey`: <https://ncaaorg.s3.amazonaws.com/championships/sports/icehockey/rules/PRXIH_RulesBook.pdf>
- `ncaa-news-2026`: <https://www.ncaa.org/cut-resistant-equipment-approved-in-ice-hockey-for-di-men-nc-women/>
- `ahl-2025`: <https://www.amerks.com/assets/doc/2025-26_AHLRuleBook-7cdc4508dc.pdf>
- `echl-2025`: <https://echl.s3.us-east-2.amazonaws.com/production/echl/uploads/files/2026-27%20ECHL%20Official%20Rulebook.pdf>
- `ohl-2025`: <https://media.chl.ca/wp-content/uploads/sites/5/2025/10/24132227/2025-2026-OHL-Rule-Book.pdf>
- `whl-2025`: <https://media.chl.ca/wp-content/uploads/sites/6/2025/10/01111556/2025-26-WHL-Rule-Book.pdf>
- `qmjhl-2025`: <https://media.chl.ca/wp-content/uploads/sites/2/2025/10/07110453/QMJHL-Playing-Rules-2025-2026.pdf>
- `usa-hockey-junior`: <https://cdn3.sportngin.com/attachments/document/e6a1-3442852/2025-29_USAH_Playing_Rules_-_Junior.pdf>
- `ushl-2021`: <https://cdn1.sportngin.com/attachments/document/69ff-2563252/USHL_Rules_and_Regulations_2021-22.pdf>
- `pwhl-2025`: <https://assets.contentstack.io/v3/assets/bltebdb4296e05d53db/bltb8440fe08a5e6dc5/69178cd0a582d7db321ad107/2025-2026_PWHL_Rulebook.pdf>
- `iihf-milan-2025`: <https://www.si.com/onsi/breakaway/iihf-issues-statement-controversial-olympic-hockey-rink>
- `wp-boston-garden`: <https://en.wikipedia.org/w/index.php?title=Boston_Garden&oldid=1379921964>

日付のわかる変更：

| 変更 | 内容 |
| --- | --- |
| `iihf.blueLine.2018` | ブルーラインはエンドボードから22.86m（75フィート）の位置にあります。 |
| `iihf.trapezoid.2018` | ゴール裏にトラペゾイドはなく、ゴールキーパーはどこでもパックを扱えます。 |
| `iihf.trapezoid.2021` | ゴール裏にゴールキーパーの制限区域（トラペゾイド）が引かれます。ゴールライン側が6.80m、エンドボード側が8.60mです。 |
| `iihf.blueLine.2022` | ブルーラインはエンドボードから22.50mの位置です（2022/23年版ルールブックの図による。線のどちらの縁から測るかは、資料には書かれていません）。 |
| `ncaa-men.trapezoid.start` | ゴール裏にトラペゾイド（台形の区域）はありません。 |
| `ncaa-men.trapezoid.2026` | ディビジョンI男子の試合では、ゴール裏にトラペゾイドが引かれます。ゴールライン側が22フィート、エンドボード側が28フィートです。 |
| `ahl.blueLine.start` | ブルーラインはエンドボードから71フィート（約21.6m）で、アタッキングゾーンは60フィート、ニュートラルゾーンは58フィートです（AHLが発表した4フィートの移動から算出）。 |
| `ahl.blueLine.2005` | ブルーラインがリンクの中央寄りに4フィート移り、アタッキングゾーンは64フィート、ニュートラルゾーンは50フィートになります。 |

## アメリカンフットボールとカナディアンフットボール

`sport: "nfl"`

| `league` | 名前 |
| --- | --- |
| `nfl`（その競技の標準） | NFLのフィールド |
| `cfl`（その競技の標準） | CFLのフィールド |
| `ifaf`（その競技の標準） | IFAFのフィールド |
| `ncaa` | NCAAのフィールド |
| `nfhs` | 全米高校連盟（NFHS）の11人制フィールド |
| `nfhs-9` | 全米高校連盟（NFHS）の9人制フィールド |
| `nfhs-8` | 全米高校連盟（NFHS）の8人制フィールド |
| `nfhs-6` | 全米高校連盟（NFHS）の6人制フィールド |
| `uil-6` | テキサス州（UIL）の6人制フィールド |
| `ifl` | インドア・フットボール・リーグ（IFL）のフィールド |

出典の URL：

- `nfl-rules`: <https://operations.nfl.com/the-rules/nfl-rulebook/>
- `cfl-rules`: <https://www.cfldb.ca/rulebook/conduct-of-the-game/the-field/>
- `ifaf-2021`: <http://www.myiafoa.org/rules/ifaf2021/FieldDiagrams.pdf>
- `ncaa-football`: <https://ncaaorg.s3.amazonaws.com/championships/sports/football/rules/PRMFB_RulesBook.pdf>
- `nfhs-football`: <https://dt5602vnjxv0c.cloudfront.net/portals/50139/docs/2021%20nfhs%20football%20rules%20book.pdf>
- `nfhs-diagrams`: <https://khsaa.org/common_documents/Rules-Football-Rules%20and%20NFHS%20Guidance/2026//2026%20NFHS%20Football%20Field%20Diagrams%20-%20FINAL.pdf>
- `nsaa-eight`: <https://nsaa-static.s3.amazonaws.com/textfile/fbl/8player.pdf>
- `uil-six`: <https://taso.org/wp-content/uploads/2026/09/2026-UIL-6-Player-Exceptions-to-NCAA-Rules-AUGUST-2026-REVISION.pdf>
- `ifl-2024`: <https://s3.us-east-2.amazonaws.com/sidearm.nextgen.sites/nazwranglers.com/documents/2024/4/19/IFL_2024_Website_Rule_Book.pdf>

## 野球とソフトボール

`sport: "mlb"`

| `league` | 名前 |
| --- | --- |
| `mlb`（その競技の標準） | 野球場 |
| `milb` | マイナーリーグ（MiLB）の野球場 |
| `ncaa` | NCAAの野球場 |
| `nfhs` | 全米高校連盟（NFHS）の野球場 |
| `little-league` | リトルリーグの野球場（塁間60フィート） |
| `little-league-intermediate` | リトルリーグ・インターミディエイト（50/70）の野球場 |
| `pony` | ポニーリーグ（14歳以下）の野球場 |
| `pony-bronco` | ポニー・ブロンコ（12歳以下）の野球場 |
| `pony-mustang` | ポニー・マスタング（10歳以下）の野球場 |
| `ncaa-softball` | NCAAのソフトボール場 |
| `nfhs-softball` | 全米高校連盟（NFHS）のソフトボール場 |
| `fastpitch` | USAソフトボール（ファストピッチ）のソフトボール場 |
| `slowpitch` | USAソフトボール（スローピッチ）のソフトボール場 |
| `slowpitch-wbsc` | WBSC（スローピッチ）のソフトボール場 |

出典の URL：

- `obr`: <https://www.mlb.com/official-information/official-rules>
- `obr-2026`: <https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf>
- `ncaa-baseball`: <https://ncaaorg.s3.amazonaws.com/championships/sports/baseball/rules/PRMBA_RulesBook.pdf>
- `nfhs-baseball`: <https://alyb.org/wp-content/uploads/2026/03/NFHS-2026-Baseball-Rules.pdf>
- `little-league-specs`: <https://www.littleleague.org/league-officials/field-specifications/>
- `little-league-major`: <https://www.littleleague.org/downloads/ll-baseball-field-layout/>
- `little-league-intermediate`: <https://ll-production-uploads.s3.amazonaws.com/uploads/2018/03/LL-Baseball-Intermediate-Field-Layout.pdf>
- `pony-2026`: <https://cdn3.sportngin.com/attachments/document/f8cc-2645833/2026_PONY_Baseball_Rule_Book_Final_Proof__1_.pdf>
- `ncaa-softball`: <https://ncaaorg.s3.amazonaws.com/championships/sports/softball/rules/PRWSB_RulesBook.pdf>
- `nfhs-softball`: <https://assets.nfhs.org/umbraco/media/881555/softball_field_diagram_24.pdf>
- `usa-softball-2026`: <https://www.usasoftball.com/wp-content/uploads/sites/120/2026/01/USAS-2026-Rulebook_Digital.pdf>
- `wbsc-slowpitch`: <https://static.wbsc.org/uploads/federations/0/cms/documents/5f45c5e4-54ed-3659-8116-4d7cb5051f69.pdf>

## カーリング

`sport: "curling"`

| `league` | 名前 |
| --- | --- |
| `wcf`（その競技の標準） | ワールドカーリングのシート |
| `curling-canada` | カーリング・カナダのシート |

出典の URL：

- `wcf-rules`: <https://www.worldcurling.org/wp-content/uploads/2026/10/Rules-2026_Clean.pdf>
- `curling-canada-rules`: <https://apollocurling.com/docs/Rule-Book-2022_General-Play_ENG_CC.pdf>

## テニス

`sport: "tennis"`

| `league` | 名前 |
| --- | --- |
| `itf`（その競技の標準） | ITFのテニスコート |

出典の URL：

- `itf-rules`: <https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf>

## バレーボール、ビーチバレー、シッティングバレーボール

`sport: "volleyball"`

| `league` | 名前 |
| --- | --- |
| `fivb`（その競技の標準） | FIVBのバレーボールコート |
| `fivb-beach` | FIVBのビーチバレーボールコート |
| `wpv-sitting` | ワールドパラバレーのシッティングバレーボールコート |

出典の URL：

- `fivb-volleyball`: <https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf>
- `fivb-beach`: <https://www.fivb.com/wp-content/uploads/2025/02/FIVB-BeachVolleyball_Rules2025_2028-EN-v01.pdf>
- `wpv-sitting`: <https://worldparavolley.org/wp-content/uploads/2025/09/2025-2028-WPV-Official-Sitting-Volleyball-Rules-English-2025-07-25.pdf>

## バドミントン

`sport: "badminton"`

| `league` | 名前 |
| --- | --- |
| `bwf`（その競技の標準） | BWFのバドミントンコート |

出典の URL：

- `bwf-laws`: <https://worldbadminton.com/laws/rules_2025.htm>
- `bwf-facilities`: <https://www.badmintonpanam.org/wp-content/uploads/2023/01/3.3.4-Specs-for-Int_l-Standard-Facilities-14-October-2019-V1.1.pdf>

## ピックルボール

`sport: "pickleball"`

| `league` | 名前 |
| --- | --- |
| `usap`（その競技の標準） | USA Pickleballのコート |

出典の URL：

- `usap-rulebook`: <https://pickleballcanada.org/wp-content/uploads/2026/03/2026-Official-Rulebook-EN.pdf>

## 卓球

`sport: "tabletennis"`

| `league` | 名前 |
| --- | --- |
| `ittf`（その競技の標準） | ITTFの卓球台 |

出典の URL：

- `ittf-laws`: <https://www.tabletennisengland.co.uk/content/uploads/2026/07/Laws-of-Table-Tennis-2026-27.pdf>

## パデル

`sport: "padel"`

| `league` | 名前 |
| --- | --- |
| `fip`（その競技の標準） | FIPのパデルコート |

出典の URL：

- `fip-padel`: <https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Rules-of-Padel.pdf>

## スカッシュ

`sport: "squash"`

| `league` | 名前 |
| --- | --- |
| `wsf`（その競技の標準） | ワールドスカッシュのシングルスコート |
| `wsf-doubles` | ワールドスカッシュのダブルスコート |
| `wsf-doubles-wide` | ワールドスカッシュの国際大会規格のダブルスコート |

出典の URL：

- `wsf-court-specs`: <https://www.worldsquash.sport/wp-content/uploads/2021/08/171128_Court-Specifications.pdf>
- `wsf-singles-rules`: <https://www.squashireland.ie/wp-content/uploads/2025/04/Rules-of-Singles-Squash-2024-V1.2.pdf>

## ラケットボール

`sport: "racquetball"`

| `league` | 名前 |
| --- | --- |
| `irf`（その競技の標準） | IRFのラケットボールコート |

出典の URL：

- `irf-racquetball-rules`: <https://www.internationalracquetball.com/wp-content/uploads/2026/06/1-irf-rulebook_mar26-1.pdf>
- `irf-racquetball-courts`: <https://www.internationalracquetball.com/wp-content/uploads/2026/07/IRF_Courts-specifications-2025.pdf>

## セパタクロー

`sport: "sepaktakraw"`

| `league` | 名前 |
| --- | --- |
| `istaf`（その競技の標準） | ISTAFのセパタクローコート |

出典の URL：

- `istaf-law`: <https://sepaktakrawindia.com/wp-content/uploads/2022/04/REGU_TEAM-EVENT.pdf>

## テックボール

`sport: "teqball"`

| `league` | 名前 |
| --- | --- |
| `fiteq`（その競技の標準） | FITEQのテックボールコート |

出典の URL：

- `fiteq-rules`: <https://cdn.buttercms.com/s6Mb1gRkRJuFP38kpMTh>

## ラウンドネット

`sport: "roundnet"`

| `league` | 名前 |
| --- | --- |
| `irf-roundnet`（その競技の標準） | 国際ラウンドネット連盟のコート |

出典の URL：

- `roundnet-rules`: <https://www.roundnetfederation.org/s/IRF-Rules-10212021docx-1.pdf>

## ネットボール

`sport: "netball"`

| `league` | 名前 |
| --- | --- |
| `wn`（その競技の標準） | ワールドネットボールのコート |

出典の URL：

- `world-netball-rules`: <https://netball.sport/wp-content/uploads/2024/01/World-Netball-Rules-Book-2024.pdf>

## ラクロス

`sport: "lacrosse"`

| `league` | 名前 |
| --- | --- |
| `world-men`（その競技の標準） | ワールドラクロスの男子フィールド |
| `world-women` | ワールドラクロスの女子フィールド |
| `ncaa-men` | NCAA男子ラクロスのフィールド |
| `ncaa-women` | NCAA女子ラクロスのフィールド |
| `pll` | PLLのフィールド |
| `nll` | NLLのボックスラクロスのフロア |
| `world-box` | ワールドラクロスのボックスラクロスのフロア |

出典の URL：

- `wl-men`: <https://worldlacrosse.sport/wp-content/uploads/2026/01/WL_Mens-Rules_25-27_FINAL_1.1.pdf>
- `wl-women`: <https://worldlacrosse.sport/wp-content/uploads/2025/03/2025_2026-WF-Rulebook_FINALv1.1-1.pdf>
- `ncaa-men-lacrosse`: <https://ncaaorg.s3.amazonaws.com/championships/sports/lacrosse/rules/men/PRMLA_RulesBook.pdf>
- `ncaa-women-lacrosse`: <https://ncaaorg.s3.amazonaws.com/championships/sports/lacrosse/rules/women/PRWLA_RulesBook.pdf>
- `pll-2024`: <https://premierlacrosseleague.com/wp-content/uploads/2024/03/2024-PLL-Rulebook.pdf>
- `nll-rules`: <https://www.nll.com/wp-content/uploads/2025/12/NLL-2025-26-Rulebook-FINAL-1.pdf>
- `wl-box`: <https://worldlacrosse.sport/wp-content/uploads/2026/05/26-28-Box-Rule-Book_v2_0526.pdf>

## ラグビー

`sport: "rugby"`

| `league` | 名前 |
| --- | --- |
| `world-rugby`（その競技の標準） | ワールドラグビーのグラウンド（ラグビーユニオン） |
| `nrl` | NRLのグラウンド（ラグビーリーグ） |
| `irl` | 国際ラグビーリーグ連盟のグラウンド |

出典の URL：

- `world-rugby-laws`: <https://passport.world.rugby/media/jxrnmptk/2026en-laws-of-the-game-compressed.pdf>
- `nrl-laws`: <https://Nrl.Com/siteassets/operations/the-game/nrl-international-rules-book-2023.pdf>
- `irl-laws`: <https://intrl.sport/uploads/docs/international-rugby-league-laws-of-the-game-2022%20%283%29.pdf>

## オーストラリアンフットボール

`sport: "afl"`

| `league` | 名前 |
| --- | --- |
| `afl`（その競技の標準） | オーストラリアンフットボールのグラウンド（AFL） |

出典の URL：

- `afl-laws`: <https://play.afl/sites/default/files/2026-02/Laws%20of%20Australian%20Football%202026.pdf>

## ゲーリック・フットボールとハーリング

`sport: "gaelic"`

| `league` | 名前 |
| --- | --- |
| `gaa-football`（その競技の標準） | GAAのゲーリック・フットボールのフィールド |
| `gaa-hurling` | GAAのハーリングのフィールド |

出典の URL：

- `gaa-guide`: <https://www.gaa.ie/api/images/image/upload/t_q-best/prd/xi4oyuttzqpaqr2vfhbn.pdf>

## クリケット

`sport: "cricket"`

| `league` | 名前 |
| --- | --- |
| `icc-men`（その競技の標準） | ICC男子のグラウンド |
| `icc-women` | ICC女子のグラウンド |
| `mcc` | クリケット規則（MCC）のグラウンド |

出典の URL：

- `mcc-laws`: <https://www.lords.org/getmedia/1d908298-5c44-468d-b6a7-e1414a1296e0/Laws-of-Cricket-2017-Code-4th-Edition-(2026)_3.pdf>
- `icc-men-odi`: <https://images.icc-cricket.com/image/upload/prd/bxkzkcyvfn6tvi70zh0w.pdf>
- `icc-women-odi`: <https://images.icc-cricket.com/image/upload/prd/qunpw1kfh3ibxlz58jlw.pdf>

## フィールドホッケー

`sport: "fieldhockey"`

| `league` | 名前 |
| --- | --- |
| `fih`（その競技の標準） | FIHのフィールドホッケーのピッチ |

出典の URL：

- `fih-rules`: <https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf>

## ハンドボール

`sport: "handball"`

| `league` | 名前 |
| --- | --- |
| `ihf`（その競技の標準） | IHFのハンドボールコート |

出典の URL：

- `ihf-rules`: <https://www.ihf.info/sites/default/files/2025-07/09A%20-%20Rules%20of%20the%20Game_Indoor%20Handball_E.pdf>

## 柔道

`sport: "judo"`

| `league` | 名前 |
| --- | --- |
| `ijf`（その競技の標準） | 国際柔道連盟の試合場 |
| `ajjf` | 全日本柔道連盟の試合場 |
| `ijf-kata` | 国際柔道連盟の形の試合場 |

出典の URL：

- `ijf-sor`: <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2026/01/IJF_Sport_and_Organisation_Rul-1769443746.pdf>
- `ijf-sor-2020`: <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2020/06/IJF_Sport_and_Organisation_Rul-1592329624.pdf>
- `ajjf-guide`: <https://www.judo.or.jp/cms/wp-content/uploads/2021/03/%E5%A4%A7%E4%BC%9A%E9%81%8B%E5%96%B6%E3%82%AC%E3%82%A4%E3%83%89%E3%83%96%E3%83%83%E3%82%AF2023_20240229.pdf>
- `ijf-kata-handbook`: <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2024/01/2024_IJF_kata_commission_Tourn-1706106608.pdf>
- `ijf-kata-criteria`: <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2025/01/IJF_KATA_EVALUATION_Jan_2025-E-1737012784.pdf>

## 空手

`sport: "karate"`

| `league` | 名前 |
| --- | --- |
| `wkf-kumite`（その競技の標準） | 世界空手連盟の組手の試合場 |
| `wkf-kata` | 世界空手連盟の形の試合場 |

出典の URL：

- `wkf-kumite`: <https://www.wkf.net/files/pdf/documents/WKF_2026_Kumite_Competition_Rules_MASTER_COPY_V13FINAL.pdf>
- `wkf-kata`: <https://www.wkf.net/files/pdf/documents/WKF%20Kata%20Competition%20Rules%202026%20MASTER%20COPY_V2.pdf>

## 剣道

`sport: "kendo"`

| `league` | 名前 |
| --- | --- |
| `fik`（その競技の標準） | 国際剣道連盟の試合場 |

出典の URL：

- `fik-regulations`: <https://kendo.rs/files/202107-Regulations-of-Kendo-Shiai-and-Shinpan.pdf>

## 相撲

`sport: "sumo"`

| `league` | 名前 |
| --- | --- |
| `jsa`（その競技の標準） | 日本相撲協会の土俵 |

出典の URL：

- `jsa-dohyo`: <https://www.ssf.or.jp/knowledge/dictionary/sumo.html>
- `jsa-quiz`: <https://ozumo.jp/dohyo-size/>
- `wikipedia-dohyo`: <https://en.wikipedia.org/wiki/Dohy%C5%8D>

## 弓道

`sport: "kyudo"`

| `league` | 名前 |
| --- | --- |
| `kinteki`（その競技の標準） | 近的の弓道場（28m） |
| `enteki` | 遠的の弓道場（60m） |

出典の URL：

- `znkr-unei`: <https://www.kyudo.jp/pdf/documents/play_direction_manual.pdf>
- `wakayama-kyudo-2015`: <https://www.pref.wakayama.lg.jp/prefg/wakayama2015/kokutai/files/2015/03/edf0b88c95044b1a821a6040e786c4b1.pdf>

## 道場の畳

`sport: "dojo"`

| `league` | 名前 |
| --- | --- |
| `chukyoma`（その競技の標準） | 中京間の畳（1820×910mm） |
| `kyoma` | 京間の畳（1910×955mm） |
| `edoma` | 江戸間の畳（1760×880mm） |
| `danchima` | 団地間の畳（1700×850mm） |
| `judo-2x1` | 柔道畳（2m×1m） |

出典の URL：

- `tatami-sizes`: <https://ja.wikipedia.org/wiki/%E7%95%B3>
- `ajjf-guide`: <https://www.judo.or.jp/cms/wp-content/uploads/2021/03/%E5%A4%A7%E4%BC%9A%E9%81%8B%E5%96%B6%E3%82%AC%E3%82%A4%E3%83%89%E3%83%96%E3%83%83%E3%82%AF2023_20240229.pdf>
- `ijf-sor`: <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2026/01/IJF_Sport_and_Organisation_Rul-1769443746.pdf>

## 総合格闘技のケージ

`sport: "mma"`

| `league` | 名前 |
| --- | --- |
| `nruc`（その競技の標準） | 総合格闘技のケージ（ネバダ州の規則） |
| `immaf` | 総合格闘技のケージ（IMMAFのアマチュア規則） |

出典の URL：

- `nruc`: <https://boxing.nv.gov/uploadedFiles/boxingnvgov/content/faq/sections/2024-11-20-NRUC-OFFICIAL-FINAL.pdf>
- `oar-230-070-0025`: <https://oregon.public.law/rules/oar_230-070-0025>
- `wp-mma-cage`: <https://en.wikipedia.org/w/index.php?title=Mixed_martial_arts_cage&oldid=1377260922>
- `immaf-amateur`: <https://immaf.org/wp-content/uploads/2025/11/MMA-UNIFIED-RULES-FOR-AMATEUR-JUNIOR-SENIOR-January-2021.pdf>

