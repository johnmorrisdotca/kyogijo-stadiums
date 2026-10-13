# League variants

`league` in the options draws a surface as one league's rulebook marks it; `sport` names the family (`nba` for basketball, `nhl` for hockey, `nfl`, `cfl` or `ifaf` for football, `mlb` for baseball and softball). This page is made from `src/leagues/` by `pnpm docs:make`; a test holds it to them. Each figure is the rulebook's, in its own unit, and each league's sources, with the edition and the address read on 2026-10-13, are listed under its table. What a figure is and where it is ours is in [sources.md](./sources.md#league-variants); what could not be cited is in [references.md](./references.md#league-variants-not-drawn).

A `year` draws a league's markings of that season only where a source dates a change (the history under each table); for any other league it is ignored, and the drawing is of the rulebook as it is now. The sport's own league (the NBA, the NHL, the NFL, the CFL, the IFAF, MLB) keeps the history of [`year`](./eras.md).

## Basketball

`sport: "nba"`

| `league` | Name | 日本語 | Key figures |
| --- | --- | --- | --- |
| `nba` (the sport's own) | NBA basketball court | NBAのバスケットボールコート | court 94 ft by 50 ft; lane 16 ft wide; free-throw line 19 ft from the baseline; three-point line 23 ft 9 in arc, straights 3 ft from the sidelines; restricted area 4 ft arc |
| `wnba` | WNBA basketball court | WNBAのバスケットボールコート | court 94 ft by 50 ft; lane 16 ft wide; free-throw line 19 ft from the baseline; three-point line 22 ft 1.75 in arc, straights 3 ft from the sidelines; restricted area 4 ft arc |
| `fiba` | FIBA basketball court | FIBAのバスケットボールコート | court 28 m by 15 m; lane 4.9 m wide; free-throw line 5.8 m from the baseline; three-point line 6.75 m arc, straights 0.9 m from the sidelines; restricted area 1.3 m arc |
| `ncaa-men` | NCAA men's basketball court | NCAA男子のバスケットボールコート | court 94 ft by 50 ft; lane 12 ft wide; free-throw line 19 ft from the baseline; three-point line 22 ft 1.75 in arc, straights 3 ft 4.13 in from the sidelines; restricted area 4 ft arc |
| `ncaa-women` | NCAA women's basketball court | NCAA女子のバスケットボールコート | court 94 ft by 50 ft; lane 12 ft wide; free-throw line 19 ft from the baseline; three-point line 22 ft 1.75 in arc, straights 3 ft 4.13 in from the sidelines; restricted area none |
| `nfhs` | High school (NFHS) basketball court | 全米高校連盟（NFHS）のバスケットボールコート | court 84 ft by 50 ft; lane 12 ft wide; free-throw line 19 ft from the baseline; three-point line 19 ft 9 in arc, straights 5 ft 3 in from the sidelines; restricted area none |
| `gleague` | NBA G League basketball court | NBA Gリーグのバスケットボールコート | court 94 ft by 50 ft; lane 16 ft wide; free-throw line 19 ft from the baseline; three-point line 23 ft 9 in arc, straights 3 ft from the sidelines; restricted area 4 ft arc |

Sources:

- `nba-rules`: Official Rules of the National Basketball Association, Rule No. 1, Section I and the court diagram, NBA, 2026-27. <https://ak-static.cms.nba.com/wp-content/uploads/sites/4/2026/10/2026-27-Official-NBA-Playing-Rules.pdf>
- `wnba-rules`: Official Rules of the WNBA, Rule No. 1, Section I and diagram A, WNBA, 2026. <https://cdn.wnba.com/sites/4/2026/05/2026-WNBA-Official-Rule-Book.pdf>
- `fiba-rules`: FIBA Official Basketball Rules, Rule Two, Article 2 Court, and the Equipment rules 1.1.8 and 1.2.1, FIBA, 2026 (v1.0, valid 1 October 2026). <https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-v1-0.pdf>
- `ncaa-men-basketball`: NCAA Men's Basketball Rules, Rule 1 and the court diagram, NCAA, 2026-27. <https://ncaaorg.s3.amazonaws.com/championships/sports/basketball/rules/men/PRMBB_RulesBook.pdf>
- `ncaa-news-2015`: Men's basketball rules committee recommends package of proposals, NCAA.com, 15 May 2015, 2015-16. <https://www.ncaa.com/news/basketball-men/article/2015-05-15/mens-basketball-rules-committee-recommends-package-proposals>
- `ncaa-women-basketball`: NCAA Women's Basketball Rules, Rule 1 and the court diagram, NCAA, 2025-26 and 2026-27. <https://ncaaorg.s3.amazonaws.com/championships/sports/basketball/rules/women/PRWBB_RulesBook.pdf>
- `ncaa-women-history`: Women's Basketball Playing Rules History, NCAA, 2023-24. <https://ncaaorg.s3.amazonaws.com/championships/sports/basketball/rules/women/2023-24PRWBB_PlayingRulesHistory.pdf>
- `nfhs-basketball`: NFHS Basketball Rules, Rule 1 (2017-18 text) and the Basketball Court Diagram, National Federation of State High School Associations, 2017-18 text; undated current diagram; no Rule 1 change in 2025-26. <https://assets.nfhs.org/umbraco/media/7213108/basketball-court-diagram.pdf>
- `gleague-faq`: NBA G League FAQ, item 23, NBA G League, 2025-26. <https://gleague.nba.com/faq>
- `gleague-rules`: NBA G League playing rules, NBA G League, 2025-26. <https://gleague.nba.com/gleague-playing-rules>

History a source dates:

| Change | English | 日本語 |
| --- | --- | --- |
| `wnba.laneWidth.start` | The free-throw lane is 12 feet wide. | フリースローレーン（ペイントエリア）の幅は12フィート（約3.7m）です。 |
| `wnba.laneWidth.2004` | The free-throw lane is widened to 16 feet, the NBA's size. | フリースローレーンの幅が、NBAと同じ16フィート（約4.9m）に広がります。 |
| `ncaa-men.restricted.start` | No restricted-area arc under the baskets. | バスケットの下にリストリクテッドエリア（半円）はありません。 |
| `ncaa-men.restricted.2011` | A restricted-area arc of 3 feet from the middle of the basket is marked. | バスケットの中心から半径3フィート（約0.9m）のリストリクテッドエリア（半円）が描かれます。 |
| `ncaa-men.restricted.2015` | The restricted-area arc grows to 4 feet. | リストリクテッドエリアの半径が4フィート（約1.2m）に広がります。 |
| `ncaa-women.restricted.start` | No restricted-area arc under the baskets. | バスケットの下にリストリクテッドエリア（半円）はありません。 |
| `ncaa-women.restricted.2011` | A restricted-area arc of 3 feet from the middle of the basket is marked. | バスケットの中心から半径3フィート（約0.9m）のリストリクテッドエリア（半円）が描かれます。 |
| `ncaa-women.restricted.2017` | The restricted-area arc grows to 4 feet. | リストリクテッドエリアの半径が4フィート（約1.2m）に広がります。 |
| `ncaa-women.restricted.2023` | The restricted area is only the area under the basket: no arc is required. | リストリクテッドエリアはバスケット直下の区域だけとなり、半円のラインは必須ではなくなります。 |

## Ice hockey

`sport: "nhl"`

| `league` | Name | 日本語 | Key figures |
| --- | --- | --- | --- |
| `nhl` (the sport's own) | NHL hockey rink | NHLのアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `iihf` | IIHF ice hockey rink | IIHF（国際アイスホッケー連盟）のアイスホッケーリンク | rink 60 m by 30 m; corner radius 8.5 m; goal line 4 m from the end boards; blue line 22.5 m from the end boards; face-off circle 4.5 m radius; trapezoid 6.8 m at the goal line, 8.6 m at the boards |
| `ncaa-men` | NCAA men's ice hockey rink | NCAA男子のアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 20 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `ncaa-women` | NCAA women's ice hockey rink | NCAA女子のアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 20 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid none |
| `ahl` | AHL hockey rink | AHLのアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `echl` | ECHL hockey rink | ECHLのアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `ohl` | OHL hockey rink | OHLのアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `whl` | WHL hockey rink | WHLのアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `qmjhl` | QMJHL hockey rink | QMJHLのアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `ushl` | USHL hockey rink | USHLのアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid none |
| `pwhl` | PWHL hockey rink | PWHLのアイスホッケーリンク | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid none |

Sources:

- `nhl-rules`: National Hockey League Official Rules, Rule 1 and the rink diagram, NHL, 2025-26 (the 2026-27 Rule 1 is the same). <https://media.nhl.com/site/asset/public/ext/2025-26/2025-26Rules.pdf>
- `iihf-2025`: IIHF Official Rule Book, Rule 1 (1.2, 1.5, 1.7 to 1.9) and Appendix VI, International Ice Hockey Federation, 2025/26 (v1, 30 June 2025); 2026/27 the same. <https://blob.iihf.com/iihf-media/iihfmvc/media/contentimages/4_sport/officiating/rule_book/25_26/2025-26_iihf_rulebook_30062025-v1.pdf>
- `ncaa-hockey`: NCAA Men's and Women's Ice Hockey Rules and Interpretations, Rules 1.2 to 1.10 and the diagrams, NCAA, 2026-27 and 2027-28 (August 2026). <https://ncaaorg.s3.amazonaws.com/championships/sports/icehockey/rules/PRXIH_RulesBook.pdf>
- `ncaa-news-2026`: Cut-resistant equipment approved in ice hockey for DI men, NC women, NCAA.org, 23 July 2026, 2026-27. <https://www.ncaa.org/cut-resistant-equipment-approved-in-ice-hockey-for-di-men-nc-women/>
- `ahl-2025`: American Hockey League Official Rules, Rule 1, American Hockey League, 2025-26. <https://www.amerks.com/assets/doc/2025-26_AHLRuleBook-7cdc4508dc.pdf>
- `echl-2025`: ECHL Official Rules, Rule 1, ECHL, 2025-26 and 2026-27. <https://echl.s3.us-east-2.amazonaws.com/production/echl/uploads/files/2026-27%20ECHL%20Official%20Rulebook.pdf>
- `ohl-2025`: Ontario Hockey League Official Rules, Rule 1, Ontario Hockey League, 2025-26. <https://media.chl.ca/wp-content/uploads/sites/5/2025/10/24132227/2025-2026-OHL-Rule-Book.pdf>
- `whl-2025`: WHL Rule Book, Rule 1, Western Hockey League, 2025-26. <https://media.chl.ca/wp-content/uploads/sites/6/2025/10/01111556/2025-26-WHL-Rule-Book.pdf>
- `qmjhl-2025`: QMJHL Playing Rules, Rule 1, Quebec Maritimes Junior Hockey League, 2025-26. <https://media.chl.ca/wp-content/uploads/sites/2/2025/10/07110453/QMJHL-Playing-Rules-2025-2026.pdf>
- `usa-hockey-junior`: Official Rules of Ice Hockey, Junior Hockey Edition, Rules 101 to 105 and the rink diagrams, USA Hockey, 2025-29 (adopted 19 January 2025). <https://cdn3.sportngin.com/attachments/document/e6a1-3442852/2025-29_USAH_Playing_Rules_-_Junior.pdf>
- `ushl-2021`: USHL Rules and Regulations, 9.2, United States Hockey League, 2021-22 (the only USHL document found). <https://cdn1.sportngin.com/attachments/document/69ff-2563252/USHL_Rules_and_Regulations_2021-22.pdf>
- `pwhl-2025`: PWHL Official Rulebook, Rule 1, 1.8 and 27.8, Professional Women's Hockey League, 2025-26. <https://assets.contentstack.io/v3/assets/bltebdb4296e05d53db/bltb8440fe08a5e6dc5/69178cd0a582d7db321ad107/2025-2026_PWHL_Rulebook.pdf>

History a source dates:

| Change | English | 日本語 |
| --- | --- | --- |
| `iihf.blueLine.2018` | Blue lines are 22.86 m (75 feet) from the end boards. | ブルーラインはエンドボードから22.86m（75フィート）の位置にあります。 |
| `iihf.trapezoid.2018` | No restricted area behind the goal: the goalkeeper may play the puck anywhere. | ゴール裏にトラペゾイドはなく、ゴールキーパーはどこでもパックを扱えます。 |
| `iihf.trapezoid.2021` | A restricted area for goalkeepers behind the net is marked: 6.80 m at the goal line, 8.60 m at the boards. | ゴール裏にゴールキーパーの制限区域（トラペゾイド）が引かれます。ゴールライン側が6.80m、エンドボード側が8.60mです。 |
| `iihf.blueLine.2022` | Blue lines are 22.50 m from the end boards (the diagram of the 2022/23 rule book; the sources do not say which edge of the line is measured). | ブルーラインはエンドボードから22.50mの位置です（2022/23年版ルールブックの図による。線のどちらの縁から測るかは、資料には書かれていません）。 |
| `ncaa-men.trapezoid.start` | No trapezoid behind the net. | ゴール裏にトラペゾイド（台形の区域）はありません。 |
| `ncaa-men.trapezoid.2026` | Division I men's games have the trapezoid behind the net: 22 feet at the goal line, 28 at the boards. | ディビジョンI男子の試合では、ゴール裏にトラペゾイドが引かれます。ゴールライン側が22フィート、エンドボード側が28フィートです。 |
| `ahl.blueLine.start` | Blue lines are 71 feet from the end boards: 60-foot attack zones and a 58-foot neutral zone (worked out from the AHL's move of 4 feet). | ブルーラインはエンドボードから71フィート（約21.6m）で、アタッキングゾーンは60フィート、ニュートラルゾーンは58フィートです（AHLが発表した4フィートの移動から算出）。 |
| `ahl.blueLine.2005` | Blue lines move 4 feet towards centre ice: 64-foot attack zones and a 50-foot neutral zone. | ブルーラインがリンクの中央寄りに4フィート移り、アタッキングゾーンは64フィート、ニュートラルゾーンは50フィートになります。 |

## Football

`sport: "nfl"`

| `league` | Name | 日本語 | Key figures |
| --- | --- | --- | --- |
| `nfl` (the sport's own) | NFL football field | NFLのフィールド | goal lines 100 yd apart; end zones 10 yd; width 53.33 yd; hash marks 70 ft 9 in from each sideline; goal posts 18 ft 6 in apart, on the end line |
| `cfl` (the sport's own) | CFL football field | CFLのフィールド | goal lines 110 yd apart; end zones 20 yd; width 65 yd; hash marks 84 ft from each sideline; goal posts 18 ft 6 in apart, on the goal line |
| `ifaf` (the sport's own) | IFAF football field | IFAFのフィールド | goal lines 100 yd apart; end zones 10 yd; width 53.33 yd; hash marks 60 ft from each sideline; goal posts 18 ft 6 in apart, on the end line |
| `ncaa` | NCAA football field | NCAAのフィールド | goal lines 100 yd apart; end zones 10 yd; width 53.33 yd; hash marks 60 ft from each sideline; goal posts 18 ft 6 in apart, on the end line |
| `nfhs` | High school (NFHS) football field, 11 players | 全米高校連盟（NFHS）の11人制フィールド | goal lines 100 yd apart; end zones 10 yd; width 53.33 yd; hash marks 53 ft 4 in from each sideline; goal posts 23 ft 4 in apart, on the end line |
| `nfhs-9` | High school (NFHS) football field, 9 players | 全米高校連盟（NFHS）の9人制フィールド | goal lines 80 yd apart; end zones 10 yd; width 40 yd; hash marks 48 ft 4 in from each sideline; goal posts 23 ft 4 in apart, on the end line |
| `nfhs-8` | High school (NFHS) football field, 8 players | 全米高校連盟（NFHS）の8人制フィールド | goal lines 80 yd apart; end zones 10 yd; width 40 yd; hash marks 45 ft from each sideline; goal posts 23 ft 4 in apart, on the end line |
| `nfhs-6` | High school (NFHS) football field, 6 players | 全米高校連盟（NFHS）の6人制フィールド | goal lines 80 yd apart; end zones 10 yd; width 40 yd; hash marks 45 ft from each sideline; goal posts 23 ft 4 in apart, on the end line |
| `uil-6` | Texas (UIL) six-man football field | テキサス州（UIL）の6人制フィールド | goal lines 80 yd apart; end zones 10 yd; width 40 yd; hash marks 40 ft from each sideline; goal posts 25 ft apart, on the end line |
| `ifl` | Indoor Football League field | インドア・フットボール・リーグ（IFL）のフィールド | goal lines 50 yd apart; end zones 8 yd; width 28 yd; hash marks 27 ft from each sideline; goal posts 10 ft apart, on the end line |

Sources:

- `nfl-rules`: Official Playing Rules of the National Football League, Rule 1, NFL, 2025. <https://operations.nfl.com/the-rules/nfl-rulebook/>
- `cfl-rules`: CFL Rule Book, The Field, Canadian Football League, 2025. <https://www.cfldb.ca/rulebook/conduct-of-the-game/the-field/>
- `ifaf-2021`: IFAF Rules 2021, Appendix D, Field Diagrams, International Federation of American Football, 2021. <http://www.myiafoa.org/rules/ifaf2021/FieldDiagrams.pdf>
- `ncaa-football`: NCAA Football Rules and Interpretations, Rules 1-2, 2-12 and Appendix D, NCAA, 2026. <https://ncaaorg.s3.amazonaws.com/championships/sports/football/rules/PRMFB_RulesBook.pdf>
- `nfhs-football`: NFHS Football Rules Book, Rules 1-1, 1-2 and 2-10, and Nine-, Eight- and Six-Player Rules Differences, National Federation of State High School Associations, 2021 text (the 2026 text is sold, not posted). <https://dt5602vnjxv0c.cloudfront.net/portals/50139/docs/2021%20nfhs%20football%20rules%20book.pdf>
- `nfhs-diagrams`: NFHS Football Field Diagrams: eleven-player, nine-player, eight- and six-player, National Federation of State High School Associations, 2026. <https://khsaa.org/common_documents/Rules-Football-Rules%20and%20NFHS%20Guidance/2026//2026%20NFHS%20Football%20Field%20Diagrams%20-%20FINAL.pdf>
- `nsaa-eight`: Eight-Player Rules Differences, Nebraska School Activities Association, updated 11 June 2026. <https://nsaa-static.s3.amazonaws.com/textfile/fbl/8player.pdf>
- `uil-six`: UIL Exceptions for Six Player Football to the NCAA Rules, University Interscholastic League (Texas), effective August 28, 2026. <https://taso.org/wp-content/uploads/2026/09/2026-UIL-6-Player-Exceptions-to-NCAA-Rules-AUGUST-2026-REVISION.pdf>
- `ifl-2024`: 2024 IFL Rule Book, Rule 1 Articles 2, 3 and 5, Indoor Football League, revised 4 February 2024. <https://s3.us-east-2.amazonaws.com/sidearm.nextgen.sites/nazwranglers.com/documents/2024/4/19/IFL_2024_Website_Rule_Book.pdf>

## Baseball and softball

`sport: "mlb"`

| `league` | Name | 日本語 | Key figures |
| --- | --- | --- | --- |
| `mlb` (the sport's own) | Baseball field | 野球場 | bases 90 ft apart; pitching distance 60 ft 6 in; fence 330 ft at the lines, 400 ft in the middle |
| `milb` | Minor League Baseball field | マイナーリーグ（MiLB）の野球場 | bases 90 ft apart; pitching distance 60 ft 6 in; fence 325 ft at the lines, 400 ft in the middle |
| `ncaa` | NCAA baseball field | NCAAの野球場 | bases 90 ft apart; pitching distance 60 ft 6 in; fence 330 ft at the lines, 400 ft in the middle |
| `nfhs` | High school (NFHS) baseball field | 全米高校連盟（NFHS）の野球場 | bases 90 ft apart; pitching distance 60 ft 6 in; fence 300 ft at the lines, 350 ft in the middle |
| `little-league` | Little League baseball field (60-foot bases) | リトルリーグの野球場（塁間60フィート） | bases 60 ft apart; pitching distance 46 ft; fence 200 ft |
| `little-league-intermediate` | Little League Intermediate (50/70) baseball field | リトルリーグ・インターミディエイト（50/70）の野球場 | bases 70 ft apart; pitching distance 50 ft; fence 200 ft |
| `pony` | PONY League (14U) baseball field | ポニーリーグ（14歳以下）の野球場 | bases 80 ft apart; pitching distance 54 ft; fence 275 ft at the lines, 315 ft in the middle |
| `pony-bronco` | PONY Bronco (12U) baseball field | ポニー・ブロンコ（12歳以下）の野球場 | bases 70 ft apart; pitching distance 50 ft; fence 225 ft at the lines, 275 ft in the middle |
| `pony-mustang` | PONY Mustang (10U) baseball field | ポニー・マスタング（10歳以下）の野球場 | bases 60 ft apart; pitching distance 46 ft; fence 175 ft at the lines, 225 ft in the middle |
| `ncaa-softball` | NCAA softball field | NCAAのソフトボール場 | bases 60 ft apart; pitching distance 43 ft; fence 200 ft at the lines, 220 ft in the middle |
| `nfhs-softball` | High school (NFHS) softball field | 全米高校連盟（NFHS）のソフトボール場 | bases 60 ft apart; pitching distance 43 ft; fence 185 ft |
| `fastpitch` | USA Softball fast-pitch field | USAソフトボール（ファストピッチ）のソフトボール場 | bases 60 ft apart; pitching distance 43 ft; fence 200 ft |
| `slowpitch` | USA Softball slow-pitch field | USAソフトボール（スローピッチ）のソフトボール場 | bases 70 ft apart; pitching distance 50 ft; fence 265 ft |
| `slowpitch-wbsc` | WBSC slow-pitch softball field | WBSC（スローピッチ）のソフトボール場 | bases 65 ft apart; pitching distance 50 ft; fence 275 ft |

Sources:

- `obr`: Official Baseball Rules, 2.01 to 2.05, Major League Baseball, 2025. <https://www.mlb.com/official-information/official-rules>
- `obr-2026`: Official Baseball Rules, 2.01, 2.03 and 2.04 (the rules Minor League Baseball plays under), Major League Baseball, 2026. <https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf>
- `ncaa-baseball`: NCAA Baseball Rules, Rule 1, and the field diagram, NCAA, 2027 and 2028 rules book (printed October 2026). <https://ncaaorg.s3.amazonaws.com/championships/sports/baseball/rules/PRMBA_RulesBook.pdf>
- `nfhs-baseball`: NFHS Baseball Rules, Rule 1-2 and Diagram 2, National Federation of State High School Associations, 2026 text; 2023 diagram. <https://alyb.org/wp-content/uploads/2026/03/NFHS-2026-Baseball-Rules.pdf>
- `little-league-specs`: Field Specifications, Little League International, 2026. <https://www.littleleague.org/league-officials/field-specifications/>
- `little-league-major`: Little League Baseball Field Layout (Major/Minor), Little League International, undated. <https://www.littleleague.org/downloads/ll-baseball-field-layout/>
- `little-league-intermediate`: Little League Baseball Intermediate Field Layout, Little League International, last updated 2 March 2018. <https://ll-production-uploads.s3.amazonaws.com/uploads/2018/03/LL-Baseball-Intermediate-Field-Layout.pdf>
- `pony-2026`: PONY Baseball Rule Book, Rule 7 Playing Fields (7-A, 7-B, 7-D), PONY Baseball and Softball, 2026 (final proof). <https://cdn3.sportngin.com/attachments/document/f8cc-2645833/2026_PONY_Baseball_Rule_Book_Final_Proof__1_.pdf>
- `ncaa-softball`: NCAA Softball Rules, Rule 2 and its Dimension Table, NCAA, 2026 and 2027 rules book. <https://ncaaorg.s3.amazonaws.com/championships/sports/softball/rules/PRWSB_RulesBook.pdf>
- `nfhs-softball`: NFHS Softball Rules, Rule 1-1 field diagram, and the 2026 comparison of USA Softball, NCAA and NFHS rules, National Federation of State High School Associations, 2025 diagram; comparison revised 1 January 2026. <https://assets.nfhs.org/umbraco/media/881555/softball_field_diagram_24.pdf>
- `usa-softball-2026`: Official Rules of Softball, Rule 2 Section 1 (Official Distance Table), Section 3 and the Dimension Table, USA Softball, 2026. <https://www.usasoftball.com/wp-content/uploads/sites/120/2026/01/USAS-2026-Rulebook_Digital.pdf>
- `wbsc-slowpitch`: WBSC Slow Pitch Softball rules, Appendix 1 F Quick Reference Table, World Baseball Softball Confederation, 2026-2029 (released March 2026). <https://static.wbsc.org/uploads/federations/0/cms/documents/5f45c5e4-54ed-3659-8116-4d7cb5051f69.pdf>

