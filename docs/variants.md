# League variants

[日本語](variants.ja.md) · English

`league` in the options draws a surface as one league's rulebook marks it; `sport` names the family (`nba` for basketball, `nhl` for hockey, `nfl`, `cfl` or `ifaf` for football, `mlb` for baseball and softball, `curling` for a curling sheet, `tennis`, `volleyball`, `badminton`, `pickleball`, `tabletennis`, `padel`, `squash`, `racquetball`, `sepaktakraw`, `teqball`, `roundnet` and `netball` for the net, racket and court sports, `lacrosse`, `rugby`, `afl`, `gaelic`, `cricket`, `fieldhockey` and `handball` for the field sports). This page is made from `src/leagues/` by `pnpm docs:make`; a test holds it to them. Each figure is the rulebook's, in its own unit, and each league's sources, with the edition and the address read on 2026-10-13, are listed under its table. What a figure is and where it is ours is in [sources.md](./sources.md#league-variants); what could not be cited is in [references.md](./references.md#league-variants-not-drawn).

A `year` draws a league's markings of that season only where a source dates a change (the history under each table); for any other league it is ignored, and the drawing is of the rulebook as it is now. The sport's own league (the NBA, the NHL, the NFL, the CFL, the IFAF, MLB, World Curling, the ITF, the FIVB's indoor court, the BWF, USA Pickleball, the ITTF, the FIP, World Squash's singles court, the IRF, the ISTAF, the FITEQ, the International Roundnet Federation and World Netball) keeps the history of [`year`](./eras.md).

## Basketball

`sport: "nba"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `nba` (the sport's own) | NBA basketball court | court 94 ft by 50 ft; lane 16 ft wide; free-throw line 19 ft from the baseline; three-point line 23 ft 9 in arc, straights 3 ft from the sidelines; restricted area 4 ft arc |
| `wnba` | WNBA basketball court | court 94 ft by 50 ft; lane 16 ft wide; free-throw line 19 ft from the baseline; three-point line 22 ft 1.75 in arc, straights 3 ft from the sidelines; restricted area 4 ft arc |
| `fiba` | FIBA basketball court | court 28 m by 15 m; lane 4.9 m wide; free-throw line 5.8 m from the baseline; three-point line 6.75 m arc, straights 0.9 m from the sidelines; restricted area 1.3 m arc |
| `ncaa-men` | NCAA men's basketball court | court 94 ft by 50 ft; lane 12 ft wide; free-throw line 19 ft from the baseline; three-point line 22 ft 1.75 in arc, straights 3 ft 4.13 in from the sidelines; restricted area 4 ft arc |
| `ncaa-women` | NCAA women's basketball court | court 94 ft by 50 ft; lane 12 ft wide; free-throw line 19 ft from the baseline; three-point line 22 ft 1.75 in arc, straights 3 ft 4.13 in from the sidelines; restricted area none |
| `nfhs` | High school (NFHS) basketball court | court 84 ft by 50 ft; lane 12 ft wide; free-throw line 19 ft from the baseline; three-point line 19 ft 9 in arc, straights 5 ft 3 in from the sidelines; restricted area none |
| `gleague` | NBA G League basketball court | court 94 ft by 50 ft; lane 16 ft wide; free-throw line 19 ft from the baseline; three-point line 23 ft 9 in arc, straights 3 ft from the sidelines; restricted area 4 ft arc |

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

| Change | What changed |
| --- | --- |
| `wnba.laneWidth.start` | The free-throw lane is 12 feet wide. |
| `wnba.laneWidth.2004` | The free-throw lane is widened to 16 feet, the NBA's size. |
| `ncaa-men.restricted.start` | No restricted-area arc under the baskets. |
| `ncaa-men.restricted.2011` | A restricted-area arc of 3 feet from the middle of the basket is marked. |
| `ncaa-men.restricted.2015` | The restricted-area arc grows to 4 feet. |
| `ncaa-women.restricted.start` | No restricted-area arc under the baskets. |
| `ncaa-women.restricted.2011` | A restricted-area arc of 3 feet from the middle of the basket is marked. |
| `ncaa-women.restricted.2017` | The restricted-area arc grows to 4 feet. |
| `ncaa-women.restricted.2023` | The restricted area is only the area under the basket: no arc is required. |

## Ice hockey

`sport: "nhl"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `nhl` (the sport's own) | NHL hockey rink | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `iihf` | IIHF ice hockey rink | rink 60 m by 30 m; corner radius 8.5 m; goal line 4 m from the end boards; blue line 22.5 m from the end boards; face-off circle 4.5 m radius; trapezoid 6.8 m at the goal line, 8.6 m at the boards |
| `ncaa-men` | NCAA men's ice hockey rink | rink 200 ft by 85 ft; corner radius 20 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `ncaa-women` | NCAA women's ice hockey rink | rink 200 ft by 85 ft; corner radius 20 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid none |
| `ahl` | AHL hockey rink | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `echl` | ECHL hockey rink | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `ohl` | OHL hockey rink | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `whl` | WHL hockey rink | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `qmjhl` | QMJHL hockey rink | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |
| `ushl` | USHL hockey rink | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid none |
| `pwhl` | PWHL hockey rink | rink 200 ft by 85 ft; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid none |
| `olympic` | Olympic ice hockey rink (60 by 26 m) | rink 60 m by 26 m; corner radius 8.5 m; goal line 4 m from the end boards; blue line 22.5 m from the end boards; face-off circle 4.5 m radius; trapezoid 6.8 m at the goal line, 8.6 m at the boards |
| `boston-garden` | Boston Garden hockey rink | rink 190 ft 11.34 in by 83 ft 0.06 in; corner radius 28 ft; goal line 11 ft from the end boards; blue line 75 ft from the end boards; face-off circle 15 ft radius; trapezoid 22 ft at the goal line, 28 ft at the boards |

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
- `iihf-milan-2025`: IIHF Issues Statement on Controversial Olympic Hockey Rink (the IIHF's statement of the ice of Milano Cortina 2026: 60.0 by 26.0 metres, the Beijing 2022 size, consistent with the NHL's Global Series arena specifications), Sports Illustrated, Seth Dowdle, 9 December 2025, quoting the IIHF, 2026 Olympic Winter Games. <https://www.si.com/onsi/breakaway/iihf-issues-statement-controversial-olympic-hockey-rink>
- `wp-boston-garden`: Boston Garden, Wikipedia (CC BY-SA 4.0), revision 1379921964, read for facts only, revision 1379921964. <https://en.wikipedia.org/w/index.php?title=Boston_Garden&oldid=1379921964>

History a source dates:

| Change | What changed |
| --- | --- |
| `iihf.blueLine.2018` | Blue lines are 22.86 m (75 feet) from the end boards. |
| `iihf.trapezoid.2018` | No restricted area behind the goal: the goalkeeper may play the puck anywhere. |
| `iihf.trapezoid.2021` | A restricted area for goalkeepers behind the net is marked: 6.80 m at the goal line, 8.60 m at the boards. |
| `iihf.blueLine.2022` | Blue lines are 22.50 m from the end boards (the diagram of the 2022/23 rule book; the sources do not say which edge of the line is measured). |
| `ncaa-men.trapezoid.start` | No trapezoid behind the net. |
| `ncaa-men.trapezoid.2026` | Division I men's games have the trapezoid behind the net: 22 feet at the goal line, 28 at the boards. |
| `ahl.blueLine.start` | Blue lines are 71 feet from the end boards: 60-foot attack zones and a 58-foot neutral zone (worked out from the AHL's move of 4 feet). |
| `ahl.blueLine.2005` | Blue lines move 4 feet towards centre ice: 64-foot attack zones and a 50-foot neutral zone. |

## Football

`sport: "nfl"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `nfl` (the sport's own) | NFL football field | goal lines 100 yd apart; end zones 10 yd; width 53.33 yd; hash marks 70 ft 9 in from each sideline; goal posts 18 ft 6 in apart, on the end line |
| `cfl` (the sport's own) | CFL football field | goal lines 110 yd apart; end zones 20 yd; width 65 yd; hash marks 84 ft from each sideline; goal posts 18 ft 6 in apart, on the goal line |
| `ifaf` (the sport's own) | IFAF football field | goal lines 100 yd apart; end zones 10 yd; width 53.33 yd; hash marks 60 ft from each sideline; goal posts 18 ft 6 in apart, on the end line |
| `ncaa` | NCAA football field | goal lines 100 yd apart; end zones 10 yd; width 53.33 yd; hash marks 60 ft from each sideline; goal posts 18 ft 6 in apart, on the end line |
| `nfhs` | High school (NFHS) football field, 11 players | goal lines 100 yd apart; end zones 10 yd; width 53.33 yd; hash marks 53 ft 4 in from each sideline; goal posts 23 ft 4 in apart, on the end line |
| `nfhs-9` | High school (NFHS) football field, 9 players | goal lines 80 yd apart; end zones 10 yd; width 40 yd; hash marks 48 ft 4 in from each sideline; goal posts 23 ft 4 in apart, on the end line |
| `nfhs-8` | High school (NFHS) football field, 8 players | goal lines 80 yd apart; end zones 10 yd; width 40 yd; hash marks 45 ft from each sideline; goal posts 23 ft 4 in apart, on the end line |
| `nfhs-6` | High school (NFHS) football field, 6 players | goal lines 80 yd apart; end zones 10 yd; width 40 yd; hash marks 45 ft from each sideline; goal posts 23 ft 4 in apart, on the end line |
| `uil-6` | Texas (UIL) six-man football field | goal lines 80 yd apart; end zones 10 yd; width 40 yd; hash marks 40 ft from each sideline; goal posts 25 ft apart, on the end line |
| `ifl` | Indoor Football League field | goal lines 50 yd apart; end zones 8 yd; width 28 yd; hash marks 27 ft from each sideline; goal posts 10 ft apart, on the end line |

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

| `league` | Name | Key figures |
| --- | --- | --- |
| `mlb` (the sport's own) | Baseball field | bases 90 ft apart; pitching distance 60 ft 6 in; fence 330 ft at the lines, 400 ft in the middle |
| `milb` | Minor League Baseball field | bases 90 ft apart; pitching distance 60 ft 6 in; fence 325 ft at the lines, 400 ft in the middle |
| `ncaa` | NCAA baseball field | bases 90 ft apart; pitching distance 60 ft 6 in; fence 330 ft at the lines, 400 ft in the middle |
| `nfhs` | High school (NFHS) baseball field | bases 90 ft apart; pitching distance 60 ft 6 in; fence 300 ft at the lines, 350 ft in the middle |
| `little-league` | Little League baseball field (60-foot bases) | bases 60 ft apart; pitching distance 46 ft; fence 200 ft |
| `little-league-intermediate` | Little League Intermediate (50/70) baseball field | bases 70 ft apart; pitching distance 50 ft; fence 200 ft |
| `pony` | PONY League (14U) baseball field | bases 80 ft apart; pitching distance 54 ft; fence 275 ft at the lines, 315 ft in the middle |
| `pony-bronco` | PONY Bronco (12U) baseball field | bases 70 ft apart; pitching distance 50 ft; fence 225 ft at the lines, 275 ft in the middle |
| `pony-mustang` | PONY Mustang (10U) baseball field | bases 60 ft apart; pitching distance 46 ft; fence 175 ft at the lines, 225 ft in the middle |
| `ncaa-softball` | NCAA softball field | bases 60 ft apart; pitching distance 43 ft; fence 200 ft at the lines, 220 ft in the middle |
| `nfhs-softball` | High school (NFHS) softball field | bases 60 ft apart; pitching distance 43 ft; fence 185 ft |
| `fastpitch` | USA Softball fast-pitch field | bases 60 ft apart; pitching distance 43 ft; fence 200 ft |
| `slowpitch` | USA Softball slow-pitch field | bases 70 ft apart; pitching distance 50 ft; fence 265 ft |
| `slowpitch-wbsc` | WBSC slow-pitch softball field | bases 65 ft apart; pitching distance 50 ft; fence 275 ft |

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

## Curling

`sport: "curling"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `wcf` (the sport's own) | World Curling sheet | sheet 45.72 m by 4.75 m; least sheet 44.501 m by 4.42 m; tee to tee 34.75 m; back line 1.829 m from the tee; hog line 6.401 m from the tee; house circles of 1.829 m, 1.219 m and 0.61 m radius, a button of 0.152 m; courtesy line 1.219 m outside each hog line |
| `curling-canada` | Curling Canada sheet | sheet 150 ft by 15 ft 7 in; least sheet 146 ft by 14 ft 2 in; tee to tee 114 ft; back line 6 ft from the tee; hog line 21 ft from the tee; house circles of 6 ft, 4 ft and 2 ft radius, a button of 6 in; courtesy line none |

Sources:

- `wcf-rules`: The Rules of Curling and Rules of Competition, R1 Sheet, R2 Stones, R6 Free Guard Zone, R12 Scoring and the definitions, World Curling, 1 September 2026. <https://www.worldcurling.org/wp-content/uploads/2026/10/Rules-2026_Clean.pdf>
- `curling-canada-rules`: Rules of Curling for General Play, Rule 3 Sheet of Ice, 4 Stones, 12 Free Guard Zone and 13 Stones in Play and Scoring, Curling Canada, September 2022 to August 2026. <https://apollocurling.com/docs/Rule-Book-2022_General-Play_ENG_CC.pdf>

## Tennis

`sport: "tennis"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `itf` (the sport's own) | ITF tennis court | court 78 ft by 36 ft (singles 27 ft wide); service line 21 ft from the net; net 3 ft 6 in at the posts, 3 ft at the centre; net posts 3 ft outside the doubles court; free zone 21 ft behind the baselines, 12 ft beside the sidelines |

Sources:

- `itf-rules`: Rules of Tennis, Rule 1 The Court, Rule 5 Score in a Game, Rule 6 Score in a Set and Appendix X, International Tennis Federation, 2026. <https://www.itftennis.com/media/7221/2026-rules-of-tennis-english.pdf>

## Volleyball, beach volleyball and sitting volleyball

`sport: "volleyball"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `fivb` (the sport's own) | FIVB volleyball court | court 18 m by 9 m; attack line 3 m from the centre line; net 10 m long, 2.43 m high (women's 2.24 m); posts 1 m outside the side lines; free zone 6.5 m behind the end lines, 5 m beside the side lines |
| `fivb-beach` | FIVB beach volleyball court | court 16 m by 8 m; attack line none; net 8.5 m long, 2.43 m high (women's 2.24 m); posts 1 m outside the side lines; free zone 5 m behind the end lines, 5 m beside the side lines |
| `wpv-sitting` | World ParaVolley sitting volleyball court | court 10 m by 6 m; attack line 2 m from the centre line; net 7 m long, 1.15 m high (women's 1.05 m); posts 1 m outside the side lines; free zone 6 m behind the end lines, 4 m beside the side lines |

Sources:

- `fivb-volleyball`: Official Volleyball Rules 2025-2028, Rules 1 Playing Area and 2 Net and Posts, and Diagram 2, FIVB, 2025-2028 (approved by the 39th FIVB World Congress 2024, in force from 1 January 2025). <https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf>
- `fivb-beach`: Official Beach Volleyball Rules 2025-2028, Rules 1 Playing Area and 2 Net and Posts, and Diagram 2, FIVB, 2025-2028 (approved by the 39th FIVB World Congress 2024, in force from 1 January 2025). <https://www.fivb.com/wp-content/uploads/2025/02/FIVB-BeachVolleyball_Rules2025_2028-EN-v01.pdf>
- `wpv-sitting`: Official Sitting Volleyball Rules 2025-2028, Rules 1 Playing Area and 2 Net and Posts, World ParaVolley, 2025-2028 (the English text of 25 July 2025). <https://worldparavolley.org/wp-content/uploads/2025/09/2025-2028-WPV-Official-Sitting-Volleyball-Rules-English-2025-07-25.pdf>

## Badminton

`sport: "badminton"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `bwf` (the sport's own) | BWF badminton court | court 13.4 m by 6.1 m (singles 5.18 m wide); short service line 1.98 m from the net; doubles long service line 0.76 m inside the back boundary; net 1.524 m at the centre, 1.55 m over the side lines |

Sources:

- `bwf-laws`: Laws of Badminton, Law 1 Court and Court Equipment and Diagram A, Law 7 Scoring System, Badminton World Federation, as amended and adopted by the BWF 26 April 2025 (the 2026 amendments take effect on 4 January 2027 and could not be read). <https://worldbadminton.com/laws/rules_2025.htm>
- `bwf-facilities`: BWF Statutes, Section 5.3.4 Specifications for International Standard Facilities, 2.1.3, 2.1.4 and 2.2.3 (the space round and between courts), Badminton World Federation, in force 14 October 2019, version 1.1. <https://www.badmintonpanam.org/wp-content/uploads/2023/01/3.3.4-Specs-for-Int_l-Standard-Facilities-14-October-2019-V1.1.pdf>

## Pickleball

`sport: "pickleball"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `usap` (the sport's own) | USA Pickleball court | court 44 ft by 20 ft; non-volley zone 7 ft from the net; net 3 ft at the sidelines, 2 ft 10 in at the centre; playing surface at least 30 ft by 60 ft |

Sources:

- `usap-rulebook`: USA Pickleball Official Rulebook, Section 3 Court and Equipment (3.A and 3.B), USA Pickleball, 2026. <https://pickleballcanada.org/wp-content/uploads/2026/03/2026-Official-Rulebook-EN.pdf>

## Table tennis

`sport: "tabletennis"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `ittf` (the sport's own) | ITTF table | table 2.74 m by 1.525 m, 0.76 m high; net 0.153 m above the playing surface; lines 0.02 m at the edges, a 0.003 m centre line |

Sources:

- `ittf-laws`: Laws of Table Tennis, 2.1 The Table, 2.2 The Net Assembly, 2.11 A Game and 2.12 A Match, International Table Tennis Federation, 2026 statutes, as reproduced by Table Tennis England (issue 1, July 2026). <https://www.tabletennisengland.co.uk/content/uploads/2026/07/Laws-of-Table-Tennis-2026-27.pdf>

## Padel

`sport: "padel"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `fip` (the sport's own) | FIP padel court | court 20 m by 10 m, inside its walls; service line 6.95 m from the net; net 0.88 m at the centre, 0.92 m at the ends, 10 m long; walls the end walls 4 m high, the side walls 4 m long at each end |

Sources:

- `fip-padel`: Rules of Padel, The Court: Dimensions, Net and Enclosures, and Rule 1 Score in a Game, International Padel Federation, review of application 1 January 2026. <https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Rules-of-Padel.pdf>

## Squash

`sport: "squash"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `wsf` (the sport's own) | World Squash singles court | court 9.75 m by 6.4 m; short line 4.26 m from the back wall to its nearest edge; service box 1.6 m square inside its lines; front wall the tin 0.48 m, the service line 1.78 m and the front wall line 4.57 m up |
| `wsf-doubles` | World Squash doubles court | court 9.75 m by 7.62 m; short line 4.26 m from the back wall to its nearest edge; service box 1.6 m square inside its lines; front wall the tin 0.48 m, the service line 1.78 m and the front wall line 4.57 m up |
| `wsf-doubles-wide` | World Squash international competition width doubles court | court 9.75 m by 8.42 m; short line 4.26 m from the back wall to its nearest edge; service box 1.6 m square inside its lines; front wall the tin 0.33 m, the service line 1.78 m and the front wall line 4.57 m up |

Sources:

- `wsf-court-specs`: Specifications for Squash Courts, clauses 4.01 to 4.03 and 5, and Appendices 1 and 2, World Squash Federation (World Squash), 28 November 2017, the full specification that applies in World Squash's 2026 transition year. <https://www.worldsquash.sport/wp-content/uploads/2021/08/171128_Court-Specifications.pdf>
- `wsf-singles-rules`: World Squash Singles Rules, Rule 2 Scoring (2.1 to 2.3), World Squash, 2024, effective 1 January 2024 (updated November 2023). <https://www.squashireland.ie/wp-content/uploads/2025/04/Rules-of-Singles-Squash-2024-V1.2.pdf>

## Racquetball

`sport: "racquetball"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `irf` (the sport's own) | IRF racquetball court | court 40 ft by 20 ft, 20 ft high; short line 20 ft from the back wall to its back edge; service line 5 ft in front of the short line; receiving line 5 ft behind the short line |

Sources:

- `irf-racquetball-rules`: Official Rules 2026-2028, Indoor Racquetball, Rule 1.5 Match, Games, Tiebreaker and Rule 2.1 Court Specifications, International Racquetball Federation, March 2026 (the 2024 Official Rules of Racquetball, copyright IRF, reprinted for 2026-2028). <https://www.internationalracquetball.com/wp-content/uploads/2026/06/1-irf-rulebook_mar26-1.pdf>
- `irf-racquetball-courts`: Racquetball Court Specifications, Section Two Court Dimensions and Tolerances and Section Three Court Markings, International Racquetball Federation, 2025 (revised 1988, 1997, 2013, 2014 and 2024). <https://www.internationalracquetball.com/wp-content/uploads/2026/07/IRF_Courts-specifications-2025.pdf>

## Sepak takraw

`sport: "sepaktakraw"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `istaf` (the sport's own) | ISTAF sepak takraw court | court 13.4 m by 6.1 m; quarter circles 0.9 m radius, at the ends of the centre line; service circles 0.3 m radius, 2.45 m from the back line; net 1.52 m high at the centre (women's 1.42 m) |

Sources:

- `istaf-law`: Law of the Game (Regu team event), Laws 1 The Court, 2 The Posts and 3 The Net, International Sepaktakraw Federation, 2013, dated 9 December 2013. <https://sepaktakrawindia.com/wp-content/uploads/2022/04/REGU_TEAM-EVENT.pdf>

## Teqball

`sport: "teqball"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `fiteq` (the sport's own) | FITEQ teqball court | court at least 16 m by 12 m; table 3 m by 1.5 m; service line 3.5 m from the middle of the table; net 1.7 m wide, 0.14 m high |

Sources:

- `fiteq-rules`: The Official Rules and Regulations of Teqball, 1 The official TEQ table, 2 The teqball court and 6.2 Scoring system, FITEQ (the International Teqball Federation), 2026. <https://cdn.buttercms.com/s6Mb1gRkRJuFP38kpMTh>

## Roundnet

`sport: "roundnet"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `irf-roundnet` (the sport's own) | International Roundnet Federation court | court at least 10 m by 10 m, with no out of bounds; set 0.914 m across; serving line a circle of 2.6 m radius; no hit zone a circle of 0.9 m radius |

Sources:

- `roundnet-rules`: International Roundnet Federation Rules, Chapter 1 Equipment and Court (1.1.2, 1.2.1 to 1.2.4) and 3.4 and 3.5, International Roundnet Federation, adopted 21 October 2022. <https://www.roundnetfederation.org/s/IRF-Rules-10212021docx-1.pdf>

## Netball

`sport: "netball"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `wn` (the sport's own) | World Netball court | court 30.5 m by 15.25 m; centre circle 0.9 m across; goal circles semicircles of 4.9 m radius; goalposts 3.05 m high, at the middle of each goal line |

Sources:

- `world-netball-rules`: Rules of Netball, Rule 1 Technical specifications (Court and related areas, items 1 to 14), World Netball, 2024 edition (copyright World Netball). <https://netball.sport/wp-content/uploads/2024/01/World-Netball-Rules-Book-2024.pdf>

## Lacrosse

`sport: "lacrosse"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `world-men` (the sport's own) | World Lacrosse men's field | field 91.4 m to 100 m by 50 m to 60 m; goal 1.83 m wide and 1.83 m high, its line 12 m from the end line; crease a circle of 3 m radius; restraining line 22 m from the goal line |
| `world-women` | World Lacrosse women's field | field 91.4 m to 100 m by 50 m to 60 m; goal 1.83 m wide and 1.83 m high, its line 12 m from the end line; goal circle 3 m radius; restraining line 22 m from the goal line |
| `ncaa-men` | NCAA men's lacrosse field | field 110 yd by 60 yd; goal 2 yd wide and 2 yd high, its line 15 yd from the end line; crease a circle of 3 yd radius; restraining line 20 yd from the goal line |
| `ncaa-women` | NCAA women's lacrosse field | field 101 m to 110 m by 55 m to 64 m; goal 1.83 m wide and 1.83 m high, its line 9 m from the end line; goal circle 2.6 m radius; restraining line 27 m from the goal line |
| `pll` | PLL field | field 100 yd by 60 yd; goal 2 yd wide and 2 yd high, its line 15 yd from the end line; crease a circle of 3 yd radius; two-point arc 13 yd from the goal at the goal line extended, then an arc of 15 yd |
| `nll` | NLL box lacrosse floor | floor 180 ft to 200 ft by 85 ft; goal 4 ft 9 in wide and 4 ft high, its line 12 ft from the end boards; crease a circle of 9 ft 3 in radius; restraining line 42 ft 6 in from the centre line |
| `world-box` | World Lacrosse box lacrosse floor | floor 200 ft by 85 ft; goal 4 ft 9 in wide and 4 ft high, its line 12 ft from the end boards; crease a circle of 9 ft 3 in radius; restraining line 42 ft 6 in from the centre line |

Sources:

- `wl-men`: Men's Field Lacrosse Official Playing Rules, Rules 1 to 7 and 12, World Lacrosse, 2025-2027, version 1.1 (January 2025). <https://worldlacrosse.sport/wp-content/uploads/2026/01/WL_Mens-Rules_25-27_FINAL_1.1.pdf>
- `wl-women`: Women's Field Lacrosse Official Playing Rules, Rule 1.A and 2.A, World Lacrosse, 2025-2026, version 1.1 (January 2025). <https://worldlacrosse.sport/wp-content/uploads/2025/03/2025_2026-WF-Rulebook_FINALv1.1-1.pdf>
- `ncaa-men-lacrosse`: NCAA Men's Lacrosse Rules and Interpretations, Rule 1, Sections 2 to 9 and the Men's Lacrosse Field of Play diagram, NCAA, 2027 and 2028 (August 2026). <https://ncaaorg.s3.amazonaws.com/championships/sports/lacrosse/rules/men/PRMLA_RulesBook.pdf>
- `ncaa-women-lacrosse`: NCAA Women's Lacrosse Rules, Rule 1 The Playing Area and Goals (1-1 to 1-21) and Diagram 2, NCAA, 2026 and 2027 (February 2026). <https://ncaaorg.s3.amazonaws.com/championships/sports/lacrosse/rules/women/PRWLA_RulesBook.pdf>
- `pll-2024`: 2024 PLL Rulebook, Section II The Field (A to H), Premier Lacrosse League, 2024, the newest book found: the 2025 and 2026 books could not be read. <https://premierlacrosseleague.com/wp-content/uploads/2024/03/2024-PLL-Rulebook.pdf>
- `nll-rules`: NLL Official Rules, Section 1 The Arena (1.5, 2.1, 2.2, 3.1, 6.1, 6.2), Diagram A Official dimensions of the floor and Diagram B Detail of goal crease, National Lacrosse League, 2025-26 season (the 2024-25 and 2019-20 books have the same figures). <https://www.nll.com/wp-content/uploads/2025/12/NLL-2025-26-Rulebook-FINAL-1.pdf>
- `wl-box`: Box Lacrosse Official Playing Rules, Rule 1 (1.1.3 to 1.1.9, 1.2.1) and the diagram of Appendix B, World Lacrosse, 2026-2028, version 2.0 (May 2026). <https://worldlacrosse.sport/wp-content/uploads/2026/05/26-28-Box-Rule-Book_v2_0526.pdf>

## Rugby

`sport: "rugby"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `world-rugby` (the sport's own) | World Rugby field (rugby union) | field of play 94 m to 100 m by 68 m to 70 m; in-goal 6 m to 22 m deep; goal posts 5.6 m apart, the crossbar 3 m up; 22-metre line 22 m from the try line |
| `nrl` | NRL field (rugby league) | field of play 100 m by 68 m; in-goal 8 m deep; goal posts 5.5 m apart, the crossbar 3 m up; lines across every 10 m from each goal line |
| `irl` | International Rugby League field | field of play 100 m by 68 m; in-goal 6 m to 11 m deep; goal posts 5.5 m apart, the crossbar 3 m up; lines across every 10 m from each goal line |

Sources:

- `world-rugby-laws`: Laws of the Game, Rugby Union, Law 1 The ground (1.3 to 1.10) and its ground diagram, World Rugby, 2026 (the book's own label; no date of effect is printed). <https://passport.world.rugby/media/jxrnmptk/2026en-laws-of-the-game-compressed.pdf>
- `nrl-laws`: Rugby League Laws of the Game, International Level, with Notes on the Laws and NRL Telstra Premiership Interpretations, Section 1 The Playing Field and Section 18 Ground Markings and Dimension Guidelines, National Rugby League, 2023 edition (April 2023). <https://Nrl.Com/siteassets/operations/the-game/nrl-international-rules-book-2023.pdf>
- `irl-laws`: The International Laws of the Game and Notes on the Laws, Section 1 The Playing Field and its plan, International Rugby League, 2024 (the cover's year; the file is named 2022). <https://intrl.sport/uploads/docs/international-rugby-league-laws-of-the-game-2022%20%283%29.pdf>

## Australian football

`sport: "afl"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `afl` (the sport's own) | Australian football ground (AFL) | ground an oval 135 m to 185 m long and 110 m to 155 m wide; goal posts 6.4 m apart, behind posts 6.4 m either side; goal square 9 m deep; centre square 50 m by 50 m; fifty metre arc 50 m from the middle of the goal line |

Sources:

- `afl-laws`: Laws of Australian Football, Law 3 Playing Surface and Posts (3.2 to 3.5) and Diagram 1, Australian Football League, 2026. <https://play.afl/sites/default/files/2026-02/Laws%20of%20Australian%20Football%202026.pdf>

## Gaelic football and hurling

`sport: "gaelic"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `gaa-football` (the sport's own) | GAA field for Gaelic football | field 130 m to 145 m by 80 m to 90 m; lines across 13 m, 20 m, 45 m; goalposts 6.5 m apart, the crossbar 2.5 m up; rectangles 4.5 m deep and 13 m deep |
| `gaa-hurling` | GAA field for hurling | field 130 m to 145 m by 80 m to 90 m; lines across 13 m, 20 m, 45 m, 65 m; goalposts 6.5 m apart, the crossbar 2.5 m up; rectangles 4.5 m deep and 13 m deep |

Sources:

- `gaa-guide`: Official Guide Part 2, Rules of Specification, Rule 1 The Field of Play (1.1 to 1.7) and its diagram, Gaelic Athletic Association, effective from 27 March 2026 (the 2025 edition's Rule 1 is word for word the same). <https://www.gaa.ie/api/images/image/upload/t_q-best/prd/xi4oyuttzqpaqr2vfhbn.pdf>

## Cricket

`sport: "cricket"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `icc-men` (the sport's own) | ICC men's ground | pitch 22 yd by 10 ft; bowling crease 8 ft 8 in long; popping crease 4 ft in front of the bowling crease, marked 25 ft either side of the middle stumps at least; return creases 4 ft 4 in either side of the middle stumps, marked 8 ft behind the popping crease; wickets 9 in wide; boundary 65 yd to 90 yd from the centre of the pitch; circle 30 yd radius about each middle stump |
| `icc-women` | ICC women's ground | pitch 22 yd by 10 ft; bowling crease 8 ft 8 in long; popping crease 4 ft in front of the bowling crease, marked 25 ft either side of the middle stumps at least; return creases 4 ft 4 in either side of the middle stumps, marked 8 ft behind the popping crease; wickets 9 in wide; boundary 60 yd to 70 yd from the centre of the pitch; circle 25.15 yd radius about each middle stump |
| `mcc` | Laws of Cricket ground (MCC) | pitch 22 yd by 10 ft; bowling crease 8 ft 8 in long; popping crease 4 ft in front of the bowling crease, marked 6 ft either side of the middle stumps at least; return creases 4 ft 4 in either side of the middle stumps, marked 8 ft behind the popping crease; wickets 9 in wide; boundary no size given; circle none |

Sources:

- `mcc-laws`: The Laws of Cricket (2017 Code), Laws 6 The pitch, 7 The creases and 8 The wickets, Marylebone Cricket Club, 4th Edition, 2026. <https://www.lords.org/getmedia/1d908298-5c44-468d-b6a7-e1414a1296e0/Laws-of-Cricket-2017-Code-4th-Edition-(2026)_3.pdf>
- `icc-men-odi`: ICC Men's One-Day International Playing Conditions, 6 to 8, 19.1 Boundaries, 28.7 Restrictions on the placement of fielders and Appendix C The venue, International Cricket Council, effective from October 2026 (the men's Test and T20I conditions have the same 19.1.3 and the T20I's 28.7.3 the same circle). <https://images.icc-cricket.com/image/upload/prd/bxkzkcyvfn6tvi70zh0w.pdf>
- `icc-women-odi`: ICC Women's One-Day International Playing Conditions, 19.1.3 Boundaries and 28.7.2.1 the fielding restriction circle, International Cricket Council, effective from October 2026. <https://images.icc-cricket.com/image/upload/prd/qunpw1kfh3ibxlz58jlw.pdf>

## Field hockey

`sport: "fieldhockey"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `fih` (the sport's own) | FIH hockey pitch | pitch 91.4 m by 55 m; 23-metre lines 22.9 m from each back-line; circle 14.63 m from the back-line; goal 3.66 m wide and 2.14 m high |

Sources:

- `fih-rules`: Rules of Hockey including explanations, Rule 1 and the Field and Equipment Specifications 1.1 to 1.8, International Hockey Federation, effective from 1 March 2026. <https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf>

## Handball

`sport: "handball"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `ihf` (the sport's own) | IHF handball court | court 40 m by 20 m; goal area line 6 m from the goal line; free-throw line 9 m from the goal line; goal 3 m wide and 2 m high |

Sources:

- `ihf-rules`: IX. Rules of the Game for Indoor Handball, Rule 1 The Playing Court (1:1 to 1:11) and the Guidelines for Playing Courts and Goals, V, International Handball Federation, 1 July 2025. <https://www.ihf.info/sites/default/files/2025-07/09A%20-%20Rules%20of%20the%20Game_Indoor%20Handball_E.pdf>

## Judo

`sport: "judo"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `ijf` (the sport's own) | IJF contest area | contest area 8 m to 10 m square (10 m drawn); safety area at least 3 m wide; at least 4 m between two areas; tatami 2 m by 1 m by 5 cm; free zone at least 50 cm round the competition area; platform 1 m wider and longer than the tatami; start tape 10 cm by 50 cm, 2 m from the centre |
| `ajjf` | AJJF contest area | contest area 8 m to 10 m square (8 m drawn); safety area at least 3 m wide; at least 4 m between two areas; tatami 1.82 m by 0.91 m by 6 cm; free zone at least 50 cm round the competition area; platform 1 m wider and longer than the tatami; start tape 10 cm by 50 cm, 2 m from the centre |
| `ijf-kata` | IJF kata area | contest area 8 m to 10 m square (10 m drawn); safety area at least 2 m wide; at least 2 m between two areas; tatami 2 m by 1 m by 5 cm; free zone at least 50 cm round the competition area; platform 1 m wider and longer than the tatami; start tape 5 cm by 50 cm, 3 m from the centre |

Sources:

- `ijf-sor`: Sport and Organisation Rules of the International Judo Federation, 8.7 Field of Play and Competition Area, Article 9 and B1.8 (the kata area), International Judo Federation, version of 21 January 2026. <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2026/01/IJF_Sport_and_Organisation_Rul-1769443746.pdf>
- `ijf-sor-2020`: Sports and Organization Rules of the International Judo Federation, 18.1 Competition Area, International Judo Federation, 2020 (the version of June 2020). <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2020/06/IJF_Sport_and_Organisation_Rul-1592329624.pdf>
- `ajjf-guide`: 大会運営ガイドブック2023 (Tournament Management Guidebook 2023), 2-1 畳, 2-3 試合場 and 2-4 開始線と選手の位置, 公益財団法人全日本柔道連盟 (All Japan Judo Federation), 2023, as of 2023-12-15. <https://www.judo.or.jp/cms/wp-content/uploads/2021/03/%E5%A4%A7%E4%BC%9A%E9%81%8B%E5%96%B6%E3%82%AC%E3%82%A4%E3%83%89%E3%83%96%E3%83%83%E3%82%AF2023_20240229.pdf>
- `ijf-kata-handbook`: IJF Kata Commission Tournament Handbook, Competition Area, International Judo Federation, Kata Commission, 2024. <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2024/01/2024_IJF_kata_commission_Tourn-1706106608.pdf>
- `ijf-kata-criteria`: Kata Competition, Criteria for the Evaluation, General elements, International Judo Federation, Kata Commission, January 2025. <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2025/01/IJF_KATA_EVALUATION_Jan_2025-E-1737012784.pdf>

## Karate

`sport: "karate"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `wkf-kumite` (the sport's own) | WKF kumite area | area 8 m square, measured from the outside; boundary band the outer 1 m in another colour; safety area 2 m, and 2 m between areas; start mats 1 m from the centre; referee 2 m from the boundary; each judge 1.5 m off a corner |
| `wkf-kata` | WKF kata area | area 8 m square, measured from the outside; boundary band none; safety area 2 m, and 2 m between areas; start mats none; referee 2 m from the boundary; each judge 1.5 m off a corner |

Sources:

- `wkf-kumite`: WKF Kumite Competition Rules, Article 1: Kumite Competition Area, and 8.6 (the scale of points), World Karate Federation, Rules version 2026.01. <https://www.wkf.net/files/pdf/documents/WKF_2026_Kumite_Competition_Rules_MASTER_COPY_V13FINAL.pdf>
- `wkf-kata`: WKF Kata Competition Rules, Article 1: Kata Competition Area, World Karate Federation, valid from 1 January 2026. <https://www.wkf.net/files/pdf/documents/WKF%20Kata%20Competition%20Rules%202026%20MASTER%20COPY_V2.pdf>

## Kendo

`sport: "kendo"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `fik` (the sport's own) | FIK shiai-jo | shiai-jo 9 m to 11 m a side, wooden floor; lines 5 cm to 10 cm, white; centre cross 30 cm to 40 cm; kaishi-sen 50 cm long, 1.4 m from the centre; outside 1.5 m kept clear |

Sources:

- `fik-regulations`: Regulations of Kendo Shiai and Shinpan, Article 2 (Shiai-jo), the Subsidiary Rules' Article 1 and Figure 1, International Kendo Federation, with the All Japan Kendo Federation, the bilingual text of July 2021, as the Kendo Association of Serbia publishes it. <https://kendo.rs/files/202107-Regulations-of-Kendo-Shiai-and-Shinpan.pdf>

## Sumo

`sport: "sumo"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `jsa` (the sport's own) | Japan Sumo Association dohyō | platform 6.7 m square, 34 cm to 60 cm high; ring 4.55 m across, 20 tawara (4 tokudawara); shikiri-sen 90 cm long, 6 cm wide, 70 cm apart |

Sources:

- `jsa-dohyo`: 相撲規則 土俵規定 第一条 (Sumo Rules, Dohyō Regulations, Article 1), as 笹川スポーツ財団 (Sasakawa Sports Foundation) quotes it: 高さ34から60センチ, 一辺6メートル70, 円の直径4メートル55, 二十俵, 日本相撲協会 (Japan Sumo Association), read in the Sasakawa Sports Foundation's sports dictionary, the page as read on the date given. <https://www.ssf.or.jp/knowledge/dictionary/sumo.html>
- `jsa-quiz`: 大相撲クイズ No.355 (the 20 tawara of the circle: 4 tokudawara and 4 between each) and No.1091 (the shikiri-sen: 6 cm wide, 90 cm long, 70 cm apart), as ozumo.jp sets them out, 日本相撲協会 (Japan Sumo Association), read on ozumo.jp, the page as read on the date given. <https://ozumo.jp/dohyo-size/>
- `wikipedia-dohyo`: Dohyō (English Wikipedia): the ring of 15 shaku, the square platform, the tokudawara, the shikiri-sen and the four tassels of the roof, Wikipedia contributors (CC BY-SA 4.0), the article as read on the date given. <https://en.wikipedia.org/wiki/Dohy%C5%8D>

## Kyūdō

`sport: "kyudo"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `kinteki` (the sport's own) | Kyūdōjō for kinteki, 28 m | distance 28 m from the shooting position to the target; target 36 cm across, its centre 27 cm up, tilted 5 degrees; shooters 1.8 m apart (1.6 m to 2 m), 2 m from the shooting position to the honza; shajō 9 m deep, 2.7 m from the end shooters to the walls, ceiling 4 m |
| `enteki` | Kyūdōjō for enteki, 60 m | distance 60 m from the shooting position to the target; target 100 cm across, its centre 97 cm up, tilted 15 degrees; shooters 1.6 m apart (1.4 m to 1.8 m), 1.1 m from the shooting position to the honza; shajō 9 m deep, 2.2 m from the end shooters to the walls, ceiling 4 m |

Sources:

- `znkr-unei`: 弓道競技運営要領 (運営マニュアル), 第6条 射場の設営 and the figures of the appendix, 公益財団法人全日本弓道連盟 (All Nippon Kyudo Federation), revised 1 April 2016 (平成28年4月1日改訂). <https://www.kyudo.jp/pdf/documents/play_direction_manual.pdf>
- `wakayama-kyudo-2015`: 国民体育大会 弓道競技実施要項 (Wakayama 2015), 競技種目: 近的競技 (射距離28m, 36cm霞的, 標的の中心は安土敷より27cm, 傾斜5度), 遠的競技 (射距離60m, 100cm得点的, 標的の中心は地上97cm, 傾斜15度), 和歌山県 (Wakayama Prefecture), applying the 全日本弓道連盟 rules, 2015. <https://www.pref.wakayama.lg.jp/prefg/wakayama2015/kokutai/files/2015/03/edf0b88c95044b1a821a6040e786c4b1.pdf>

## Dojo mats

`sport: "dojo"`

| `league` | Name | Key figures |
| --- | --- | --- |
| `chukyoma` (the sport's own) | Chūkyōma tatami, 1820 by 910 mm | tatami 1.82 m by 0.91 m (Nagoya and the Chūbu region); area of a mat 1.656 square metres |
| `kyoma` | Kyōma tatami, 1910 by 955 mm | tatami 1.91 m by 0.955 m (Kyoto and the Kansai region); area of a mat 1.824 square metres |
| `edoma` | Edoma tatami, 1760 by 880 mm | tatami 1.76 m by 0.88 m (Edo (Tokyo) and the Kantō region); area of a mat 1.549 square metres |
| `danchima` | Danchima tatami, 1700 by 850 mm | tatami 1.7 m by 0.85 m (housing complexes); area of a mat 1.445 square metres |
| `judo-2x1` | Judo tatami, 2 m by 1 m | tatami 2 m by 1 m (the IJF's standard); area of a mat 2 square metres |

Sources:

- `tatami-sizes`: Tatami (English Wikipedia) and 畳 (Japanese Wikipedia): the sizes of Kyōma 1910 by 955 mm, Chūkyōma 1820 by 910 mm, Edoma 1760 by 880 mm and Danchima 1700 by 850 mm, and the layouts in which four mats never meet at a corner, Wikipedia contributors (CC BY-SA 4.0), the articles as read on the date given. <https://ja.wikipedia.org/wiki/%E7%95%B3>
- `ajjf-guide`: 大会運営ガイドブック2023 (Tournament Management Guidebook 2023), 2-1 畳, 2-3 試合場 and 2-4 開始線と選手の位置, 公益財団法人全日本柔道連盟 (All Japan Judo Federation), 2023, as of 2023-12-15. <https://www.judo.or.jp/cms/wp-content/uploads/2021/03/%E5%A4%A7%E4%BC%9A%E9%81%8B%E5%96%B6%E3%82%AC%E3%82%A4%E3%83%89%E3%83%96%E3%83%83%E3%82%AF2023_20240229.pdf>
- `ijf-sor`: Sport and Organisation Rules of the International Judo Federation, 8.7 Field of Play and Competition Area, Article 9 and B1.8 (the kata area), International Judo Federation, version of 21 January 2026. <https://78884ca60822a34fb0e6-082b8fd5551e97bc65e327988b444396.ssl.cf3.rackcdn.com/up/2026/01/IJF_Sport_and_Organisation_Rul-1769443746.pdf>

