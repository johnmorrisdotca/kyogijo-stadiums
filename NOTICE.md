# Notice: the data's sources

The code of this package is under the MIT licence (see [LICENSE](LICENSE)). The package also carries numbers that
come from other people's published facts. A dimension or a distance is a fact, not a work, and no text, table,
picture or code of the sources is copied; each source is named here so that the facts can be checked.

| Entry point | Made from | Terms |
| --- | --- | --- |
| `geometry`: the football fields | The NFL rulebook (Rule 1, The Field), the CFL rulebook ("The Field"), and Appendix D, "Field Diagrams", of the IFAF 2021 rules (http://www.myiafoa.org/rules/ifaf2021/FieldDiagrams.pdf) | Facts; no text or drawing copied |
| `geometry`: the NHL rink | The NHL rulebook (Rule 1, The Rink), and Wikipedia's article "Ice hockey rink" for the dimensions of the creases, spots and trapezoid | Facts |
| `geometry`: the NBA court | The NBA rulebook (Rule 1, Court Dimensions and Equipment, official.nba.com), and Wikipedia's "Basketball court" and "Key (basketball)" | Facts |
| `geometry`: the baseball field | The Official Baseball Rules, rules 2.01 to 2.05 | Facts |
| `parks`: the fence of each ballpark, current and past, and the seasons of a past park | The distances (and, for a park whose fence moved, the years an article dates them) published in the English and Japanese Wikipedia article of each park, at the revision cited below; the seasons a club played there from the same article's list of tenants | Facts. The articles are CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/); none of their text, tables or images is used, and the angles between the distances are our own reading |
| `parks`: the Wikidata item of each ballpark (`wikidata`) | The item (`Q49136`) that each cited article is linked to, read with the MediaWiki API (`pageprops`, `wikibase_item`) and checked against the item's label | Wikidata's data is CC0 (https://creativecommons.org/publicdomain/zero/1.0/) |

## The ballparks' articles

Each article was read at the revision named (94 parks: the 30 current MLB parks, 44 past ones, the 12 NPB home parks and 8 other NPB grounds), by its address `https://<en or ja>.wikipedia.org/w/index.php?title=<title>&oldid=<revision>`
(the function `parkSourceUrl` writes it). The authors of an article are listed in its history. The figures are in
`scripts/parks.data.json`, which holds each entry's articles and revisions; docs/references.md explains how they were read.

| Park | Wikidata item | English article and revision | Japanese article and revision |
| --- | --- | --- | --- |
| Oriole Park at Camden Yards | Q1141174 | Oriole Park at Camden Yards, 1377140400 | – |
| Fenway Park | Q49136 | Fenway Park, 1376280796 | – |
| Yankee Stadium | Q753529 | Yankee Stadium, 1378222004 | – |
| Tropicana Field | Q1810119 | Tropicana Field, 1379964475 | – |
| Rogers Centre | Q76318 | Rogers Centre, 1379619269 | – |
| Rate Field | Q633613 | Rate Field, 1379317170 | – |
| Progressive Field | Q1154053 | Progressive Field, 1378504146 | – |
| Comerica Park | Q868482 | Comerica Park, 1376178715 | – |
| Kauffman Stadium | Q1737017 | Kauffman Stadium, 1376240550 | – |
| Target Field | Q1156635 | Target Field, 1379001210 | – |
| Daikin Park | Q1193671 | Daikin Park, 1377935430 | – |
| Angel Stadium | Q531897 | Angel Stadium, 1379214381 | – |
| Sutter Health Park | Q3418115 | Sutter Health Park, 1379745688 | – |
| T-Mobile Park | Q1193117 | T-Mobile Park, 1379419810 | – |
| Globe Life Field | Q24284037 | Globe Life Field, 1377936073 | – |
| Truist Park | Q17003430 | Truist Park, 1372245868 | – |
| loanDepot Park | Q1368138 | LoanDepot Park, 1376431410 | – |
| Citi Field | Q1072882 | Citi Field, 1377977619 | – |
| Citizens Bank Park | Q912770 | Citizens Bank Park, 1378696704 | – |
| Nationals Park | Q517545 | Nationals Park, 1379437509 | – |
| Wrigley Field | Q1052807 | Wrigley Field, 1377918987 | – |
| Great American Ball Park | Q979975 | Great American Ball Park, 1378720434 | – |
| American Family Field | Q1339293 | American Family Field, 1379813094 | – |
| PNC Park | Q1151177 | PNC Park, 1379228702 | – |
| Busch Stadium | Q253546 | Busch Stadium, 1377977448 | – |
| Chase Field | Q1068011 | Chase Field, 1378357458 | – |
| Coors Field | Q1129916 | Coors Field, 1375299958 | – |
| Dodger Stadium | Q247420 | Dodger Stadium, 1375093238 | – |
| Petco Park | Q1194586 | Petco Park, 1377977726 | – |
| Oracle Park | Q298585 | Oracle Park, 1372223272 | – |
| Baker Bowl | Q4849117 | Baker Bowl, 1375146474 | – |
| Exposition Park | Q5421611 | Exposition Park (Pittsburgh), 1372151354 | – |
| Polo Grounds | Q1276360 | Polo Grounds, 1379229018 | – |
| South End Grounds | Q6646308 | South End Grounds, 1372231528 | – |
| Huntington Avenue Grounds | Q1056422 | Huntington Avenue Grounds, 1372204570 | – |
| League Park | Q870897 | League Park, 1373475496 | – |
| Sportsman's Park | Q7579980 | Sportsman's Park, 1372232220 | – |
| Hilltop Park | Q5764114 | Hilltop Park, 1372186833 | – |
| Forbes Field | Q1963954 | Forbes Field, 1372176812 | – |
| Shibe Park | Q7496044 | Shibe Park, 1376110848 | – |
| Comiskey Park | Q1114772 | Comiskey Park, 1379270087 | – |
| Griffith Stadium | Q5608924 | Griffith Stadium, 1379220233 | – |
| Crosley Field | Q3003747 | Crosley Field, 1372078480 | – |
| Tiger Stadium | Q1750255 | Tiger Stadium (Detroit), 1379484942 | – |
| Ebbets Field | Q1278537 | Ebbets Field, 1378347217 | – |
| Braves Field | Q11335096 | Braves Field, 1372863471 | – |
| Yankee Stadium (1923) | Q675214 | Yankee Stadium (1923), 1377411197 | – |
| Cleveland Stadium | Q2113078 | Cleveland Stadium, 1372955954 | – |
| Milwaukee County Stadium | Q3314569 | Milwaukee County Stadium, 1373618962 | – |
| Memorial Stadium (Baltimore) | Q2748739 | Baltimore Memorial Stadium, 1379214788 | – |
| Municipal Stadium | Q6936283 | Municipal Stadium (Kansas City, Missouri), 1372217632 | – |
| Seals Stadium | Q7440659 | Seals Stadium, 1372229078 | – |
| Candlestick Park | Q1033076 | Candlestick Park, 1379458213 | – |
| Wrigley Field (Los Angeles) | Q3297716 | Wrigley Field (Los Angeles), 1373630732 | – |
| Metropolitan Stadium | Q1415967 | Metropolitan Stadium, 1376371728 | – |
| Colt Stadium | Q5149429 | Colt Stadium, 1372077099 | – |
| Robert F. Kennedy Memorial Stadium | Q153312 | Robert F. Kennedy Memorial Stadium, 1372225490 | – |
| Shea Stadium | Q1056326 | Shea Stadium, 1372229796 | – |
| Astrodome | Q1025406 | Astrodome, 1379214658 | – |
| Atlanta–Fulton County Stadium | Q641243 | Atlanta–Fulton County Stadium, 1372064804 | – |
| Busch Memorial Stadium | Q1017286 | Busch Memorial Stadium, 1375705915 | – |
| Oakland Coliseum | Q1147732 | Oakland Coliseum, 1377933344 | – |
| Sick's Stadium | Q6127401 | Sick's Stadium, 1377791612 | – |
| Jarry Park Stadium | Q3495641 | Jarry Park Stadium, 1372207079 | – |
| Three Rivers Stadium | Q1189339 | Three Rivers Stadium, 1372243664 | – |
| Riverfront Stadium | Q153824 | Riverfront Stadium, 1380015923 | – |
| Veterans Stadium | Q1545870 | Veterans Stadium, 1379233321 | – |
| Arlington Stadium | Q2861657 | Arlington Stadium, 1372064082 | – |
| Exhibition Stadium | Q1383747 | Exhibition Stadium, 1373389585 | – |
| Olympic Stadium | Q285467 | Olympic Stadium (Montreal), 1375638350 | – |
| Hubert H. Humphrey Metrodome | Q1072186 | Hubert H. Humphrey Metrodome, 1378988593 | – |
| Mile High Stadium | Q1934586 | Mile High Stadium, 1372216043 | – |
| Globe Life Park in Arlington | Q1634492 | Choctaw Stadium, 1374880883 | – |
| Turner Field | Q1150936 | Turner Field, 1372246325 | – |
| Tokyo Dome | Q733748 | Tokyo Dome, 1379232526 | 東京ドーム, 111353030 |
| Hanshin Koshien Stadium | Q959811 | Koshien Stadium, 1374217766 | 阪神甲子園球場, 111237979 |
| Meiji Jingu Stadium | Q944559 | Meiji Jingu Stadium, 1372085507 | 明治神宮野球場, 111058989 |
| Yokohama Stadium | Q1148681 | Yokohama Stadium, 1379493268 | 横浜スタジアム, 111000229 |
| Vantelin Dome Nagoya | Q929524 | Vantelin Dome Nagoya, 1377205624 | ナゴヤドーム, 111136533 |
| Mazda Zoom-Zoom Stadium Hiroshima | Q1038647 | Mazda Stadium, 1358258868 | MAZDA Zoom-Zoom スタジアム広島, 110177362 |
| ES CON Field Hokkaido | Q96395338 | Es Con Field Hokkaido, 1376475578 | エスコンフィールドHOKKAIDO, 110902270 |
| Rakuten Mobile Park Miyagi | Q489699 | Rakuten Mobile Park Miyagi, 1371540312 | 楽天モバイルパーク宮城, 111313121 |
| Belluna Dome | Q1194822 | Belluna Dome, 1376434975 | 西武ドーム, 111316508 |
| ZOZO Marine Stadium | Q486192 | Zozo Marine Stadium, 1374482006 | 千葉マリンスタジアム, 111145226 |
| Kyocera Dome Osaka | Q128836 | Kyocera Dome Osaka, 1374181588 | 大阪ドーム, 111044952 |
| Mizuho PayPay Dome Fukuoka | Q1365961 | Mizuho PayPay Dome Fukuoka, 1379848632 | 福岡ドーム, 111298622 |
| Sapporo Dome | Q494860 | Sapporo Dome, 1374174778 | 札幌ドーム, 111367977 |
| Hotto Motto Field Kobe | Q849183 | Hotto Motto Field Kobe, 1373207639 | 神戸総合運動公園野球場, 111289486 |
| Hiroshima Municipal Stadium (original) | Q8012748 | – | 広島市民球場 (初代), 111360293 |
| Korakuen Stadium | Q473519 | Korakuen Stadium, 1372211321 | 後楽園球場, 111347954 |
| Osaka Stadium | Q861117 | Osaka Stadium, 1372223620 | 大阪スタヂアム, 111155388 |
| Heiwadai Stadium | Q5365631 | Heiwadai Stadium, 1372186109 | 平和台野球場, 110987269 |
| Kawasaki Stadium | Q6379828 | – | 川崎球場, 110987263 |
| Nagoya Stadium | Q5369853 | Nagoya Stadium, 1377205638 | ナゴヤ球場, 111235188 |
