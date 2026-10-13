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
| `parks`: the fence of each ballpark | The distances published in the English and Japanese Wikipedia article of each park, at the revision cited below | Facts. The articles are CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/); none of their text, tables or images is used, and the angles between the distances are our own reading |

## The ballparks' articles

Each article was read at the revision named, by its address `https://<en or ja>.wikipedia.org/w/index.php?title=<title>&oldid=<revision>`
(the function `parkSourceUrl` writes it). The authors of an article are listed in its history. The figures are in
`scripts/parks.data.json`, which holds each entry's articles and revisions; docs/references.md explains how they were read.

| Park | English article and revision | Japanese article and revision |
| --- | --- | --- |
| Oriole Park at Camden Yards | Oriole Park at Camden Yards, 1377140400 | – |
| Fenway Park | Fenway Park, 1376280796 | – |
| Yankee Stadium | Yankee Stadium, 1378222004 | – |
| Tropicana Field | Tropicana Field, 1379964475 | – |
| Rogers Centre | Rogers Centre, 1379619269 | – |
| Rate Field | Rate Field, 1379317170 | – |
| Progressive Field | Progressive Field, 1378504146 | – |
| Comerica Park | Comerica Park, 1376178715 | – |
| Kauffman Stadium | Kauffman Stadium, 1376240550 | – |
| Target Field | Target Field, 1379001210 | – |
| Daikin Park | Daikin Park, 1377935430 | – |
| Angel Stadium | Angel Stadium, 1379214381 | – |
| Sutter Health Park | Sutter Health Park, 1379745688 | – |
| T-Mobile Park | T-Mobile Park, 1379419810 | – |
| Globe Life Field | Globe Life Field, 1377936073 | – |
| Truist Park | Truist Park, 1372245868 | – |
| loanDepot Park | LoanDepot Park, 1376431410 | – |
| Citi Field | Citi Field, 1377977619 | – |
| Citizens Bank Park | Citizens Bank Park, 1378696704 | – |
| Nationals Park | Nationals Park, 1379437509 | – |
| Wrigley Field | Wrigley Field, 1377918987 | – |
| Great American Ball Park | Great American Ball Park, 1378720434 | – |
| American Family Field | American Family Field, 1379813094 | – |
| PNC Park | PNC Park, 1379228702 | – |
| Busch Stadium | Busch Stadium, 1377977448 | – |
| Chase Field | Chase Field, 1378357458 | – |
| Coors Field | Coors Field, 1375299958 | – |
| Dodger Stadium | Dodger Stadium, 1375093238 | – |
| Petco Park | Petco Park, 1377977726 | – |
| Oracle Park | Oracle Park, 1372223272 | – |
| Tokyo Dome | Tokyo Dome, 1379232526 | 東京ドーム, 111353030 |
| Hanshin Koshien Stadium | Koshien Stadium, 1374217766 | 阪神甲子園球場, 111237979 |
| Meiji Jingu Stadium | Meiji Jingu Stadium, 1372085507 | 明治神宮野球場, 111058989 |
| Yokohama Stadium | Yokohama Stadium, 1379493268 | 横浜スタジアム, 111000229 |
| Vantelin Dome Nagoya | Vantelin Dome Nagoya, 1377205624 | ナゴヤドーム, 111136533 |
| Mazda Zoom-Zoom Stadium Hiroshima | Mazda Stadium, 1358258868 | MAZDA Zoom-Zoom スタジアム広島, 110177362 |
| ES CON Field Hokkaido | Es Con Field Hokkaido, 1376475578 | エスコンフィールドHOKKAIDO, 110902270 |
| Rakuten Mobile Park Miyagi | Rakuten Mobile Park Miyagi, 1371540312 | 楽天モバイルパーク宮城, 111313121 |
| Belluna Dome | Belluna Dome, 1376434975 | 西武ドーム, 111316508 |
| ZOZO Marine Stadium | Zozo Marine Stadium, 1374482006 | 千葉マリンスタジアム, 111145226 |
| Kyocera Dome Osaka | Kyocera Dome Osaka, 1374181588 | 大阪ドーム, 111044952 |
| Mizuho PayPay Dome Fukuoka | Mizuho PayPay Dome Fukuoka, 1379848632 | 福岡ドーム, 111298622 |
| Sapporo Dome | Sapporo Dome, 1374174778 | 札幌ドーム, 111367977 |
| Hotto Motto Field Kobe | Hotto Motto Field Kobe, 1373207639 | 神戸総合運動公園野球場, 111289486 |
| Hiroshima Municipal Stadium (original) | – | 広島市民球場 (初代), 111360293 |
| Korakuen Stadium | Korakuen Stadium, 1372211321 | 後楽園球場, 111347954 |
| Osaka Stadium | Osaka Stadium, 1372223620 | 大阪スタヂアム, 111155388 |
| Heiwadai Stadium | Heiwadai Stadium, 1372186109 | 平和台野球場, 110987269 |
| Kawasaki Stadium | – | 川崎球場, 110987263 |
| Nagoya Stadium | Nagoya Stadium, 1377205638 | ナゴヤ球場, 111235188 |
