# The arenas

Made by `pnpm arenas` from `scripts/arenas.data.json`; do not edit by hand. 167 arenas: 57 that a club of the NHL, the NBA, the WNBA or the PWHL plays in today and 110 of the past. Every fact is read from the English Wikipedia article named in [NOTICE.md](../NOTICE.md) at the revision named there, the coordinates are Wikidata's (CC0), and the clubs that played there are the tenants of [the atlas](./atlas.md#tenants). An arena is listed when a club of those leagues has played its home games there (the BAA, the NBA's first league, counts as the NBA); a practice rink, a hall that only staged a game or a college gym whose only link is a game is not. Each arena in `ARENAS` has its city and country, its Wikidata item and coordinates, the names it had with their years (`year` picks one: `arenaNameIn`), its name in Japanese, the years it opened and closed or was pulled down, the seats the article gives for hockey and for basketball, the size of its rink where an article gives one other than the NHL's, and the article and revision each fact was read from. `drawKyogijo({ sport: "nhl", arena })` draws the rink at the size in the Rink column and `{ sport: "nba", arena }` the court; an arena with neither draws the league's.

| Key | Arena | City | Wikidata | Open | Seats | Rink |
| --- | --- | --- | --- | --- | --- | --- |
| `amerant-bank-arena` | Amerant Bank Arena | Sunrise, United States | Q795526 | 1998– | 19,250 hockey |  |
| `american-airlines-center` | American Airlines Center | Dallas, United States | Q463345 | 2001– | 18,532 hockey, 19,200 basketball |  |
| `ball-arena` | Ball Arena | Denver, United States | Q795470 | 1999– | 17,809 hockey, 19,520 basketball |  |
| `bell-centre` | Bell Centre (Centre Bell) | Montreal, Canada | Q522282 | 1996– | 20,962 hockey |  |
| `benchmark-international-arena` | Benchmark International Arena | Tampa, United States | Q940199 | 1996– |  |  |
| `bridgestone-arena` | Bridgestone Arena | Nashville, United States | Q302869 | 1996– | 17,510 hockey |  |
| `canada-life-centre` | Canada Life Centre | Winnipeg, Canada | Q656928 | 2004– | 15,225 hockey |  |
| `canadian-tire-centre` | Canadian Tire Centre | Ottawa, Canada | Q1327290 | 1996– | 17,010 hockey |  |
| `capital-one-arena` | Capital One Arena | Washington, United States | Q223240 | 1997– | 18,573 hockey, 20,356 basketball |  |
| `climate-pledge-arena` | Climate Pledge Arena | Seattle, United States | Q977529 | 1962– | 17,151 hockey, 18,300 basketball |  |
| `crypto-com-arena` | Crypto.com Arena | Los Angeles, United States | Q186080 | 1999– | 18,145 hockey, 19,079 basketball |  |
| `delta-center` | Delta Center | Salt Lake City, United States | Q82294 | 1991– | 16,020 hockey, 18,186 basketball |  |
| `enterprise-center` | Enterprise Center | St. Louis, United States | Q1067700 | 1994– | 18,096 hockey |  |
| `grand-casino-arena` | Grand Casino Arena | Saint Paul, United States | Q1421388 | 2000– | 17,954 hockey |  |
| `honda-center` | Honda Center | Anaheim, United States | Q774138 | 1993– | 17,174 hockey, 18,336 basketball |  |
| `keybank-center` | KeyBank Center | Buffalo, United States | Q1110789 | 1996– | 19,070 hockey |  |
| `lenovo-center` | Lenovo Center | Raleigh, United States | Q39177 | 1999– | 18,547 hockey |  |
| `little-caesars-arena` | Little Caesars Arena | Detroit, United States | Q18154984 | 2017– | 19,515 hockey, 20,332 basketball |  |
| `madison-square-garden` | Madison Square Garden | New York, United States | Q186125 | 1968– |  |  |
| `nationwide-arena` | Nationwide Arena | Columbus, United States | Q166503 | 2000– | 18,500 hockey |  |
| `ppg-paints-arena` | PPG Paints Arena | Pittsburgh, United States | Q595460 | 2010– | 18,187 hockey |  |
| `prudential-center` | Prudential Center | Newark, United States | Q849027 | 2007– | 16,514 hockey, 18,711 basketball |  |
| `rogers-arena` | Rogers Arena | Vancouver, Canada | Q517318 | 1995– | 18,871 hockey, 19,193 basketball |  |
| `rogers-place` | Rogers Place | Edmonton, Canada | Q5339036 | 2016– |  |  |
| `sap-center` | SAP Center | San Jose, United States | Q261863 | 1993– | 17,435 hockey, 18,543 basketball |  |
| `scotiabank-arena` | Scotiabank Arena | Toronto, Canada | Q406972 | 1999– | 18,819 hockey, 19,800 basketball |  |
| `scotiabank-saddledome` | Scotiabank Saddledome | Calgary, Canada | Q1140083 | 1983– | 19,289 hockey |  |
| `t-mobile-arena` | T-Mobile Arena | Las Vegas, United States | Q3338973 | 2016– | 17,500 hockey |  |
| `td-garden` | TD Garden | Boston, United States | Q432105 | 1995– |  |  |
| `ubs-arena` | UBS Arena | Elmont, United States | Q48742753 | 2021– | 17,255 hockey |  |
| `united-center` | United Center | Chicago, United States | Q639975 | 1994– | 19,717 hockey, 20,917 basketball |  |
| `xfinity-mobile-arena` | Xfinity Mobile Arena | Philadelphia, United States | Q818735 | 1996– | 19,173 hockey, 20,478 basketball |  |
| `barclays-center` | Barclays Center | Brooklyn, United States | Q807966 | 2012– | 15,795 hockey, 17,732 basketball |  |
| `mortgage-matchup-center` | Mortgage Matchup Center | Phoenix, United States | Q1538690 | 1992– |  |  |
| `pacific-coliseum` | Pacific Coliseum | Vancouver, Canada | Q832644 | 1968– | 15,041 hockey |  |
| `state-farm-arena` | State Farm Arena | Atlanta, United States | Q1123297 | 1999– | 17,624 hockey, 20,233 basketball |  |
| `chase-center` | Chase Center | San Francisco, United States | Q15262098 | 2019– | 18,064 basketball |  |
| `fedexforum` | FedExForum | Memphis, United States | Q641212 | 2004– | 16,667 basketball |  |
| `fiserv-forum` | Fiserv Forum | Milwaukee, United States | Q20372160 | 2018– | 17,385 basketball |  |
| `frost-bank-center` | Frost Bank Center | San Antonio, United States | Q298573 | 2002– | 19,217 basketball |  |
| `gainbridge-fieldhouse` | Gainbridge Fieldhouse | Indianapolis, United States | Q545007 | 1999– | 17,274 basketball |  |
| `golden-1-center` | Golden 1 Center | Sacramento, United States | Q7011384 | 2016– | 17,608 basketball |  |
| `intuit-dome` | Intuit Dome | Inglewood, United States | Q54958436 | 2024– | 18,300 basketball |  |
| `kaseya-center` | Kaseya Center | Miami, United States | Q420129 | 1999– | 19,600 basketball |  |
| `kia-center` | Kia Center | Orlando, United States | Q481795 | 2010– | 18,846 basketball |  |
| `moda-center` | Moda Center | Portland, United States | Q1347442 | 1995– | 19,393 basketball |  |
| `paycom-center` | Paycom Center | Oklahoma City, United States | Q665434 | 2002– | 18,203 basketball |  |
| `rocket-arena` | Rocket Arena | Cleveland, United States | Q387157 | 1994– | 19,432 basketball |  |
| `smoothie-king-center` | Smoothie King Center | New Orleans, United States | Q1515840 | 1999– | 16,867 basketball |  |
| `spectrum-center` | Spectrum Center | Charlotte, United States | Q983870 | 2005– | 19,444 basketball |  |
| `target-center` | Target Center | Minneapolis, United States | Q282675 | 1990– | 18,798 basketball |  |
| `toyota-center` | Toyota Center | Houston, United States | Q1166157 | 2003– | 18,104 basketball |  |
| `carefirst-arena` | CareFirst Arena | Washington, United States | Q30488454 | 2018– | 4,200 basketball |  |
| `coca-cola-coliseum` | Coca-Cola Coliseum | Toronto, Canada | Q541481 | 1921– | 8,140 hockey, 8,500 basketball |  |
| `michelob-ultra-arena` | Michelob Ultra Arena | Las Vegas, United States | Q1888848 | 1999– | 12,000 basketball |  |
| `wintrust-arena` | Wintrust Arena | Chicago, United States | Q16991688 | 2017– | 10,387 basketball |  |
| `place-bell` | Place Bell | Laval, Canada | Q3389723 | 2017– |  |  |
| `the-arena-ottawa` | The Arena (Ottawa) | Ottawa, Canada | Q7714219 | 1908–1923 | 4,500 hockey |  |
| `barton-street-arena` | Barton Street Arena | Hamilton, Canada | Q4865692 | 1910–1925 | 4,500 hockey | 200 × 80 ft |
| `big-e-coliseum` | The Big E Coliseum | West Springfield, United States | Q7717607 | 1916–1975 | 6,000 hockey |  |
| `boston-garden` | Boston Garden | Boston, United States | Q894567 | 1928–1995 | 14,448 hockey, 14,890 basketball | 190.9 × 83 ft |
| `buffalo-memorial-auditorium` | Buffalo Memorial Auditorium | Buffalo, United States | Q2927640 | 1940–1996 | 12,280 hockey, 17,000 basketball |  |
| `capital-centre` | Capital Centre | Landover, United States | Q3656844 | 1973–1997 | 18,130 hockey, 19,035 basketball |  |
| `chicago-coliseum` | Chicago Coliseum | Chicago, United States | Q2370898 | –1963 |  |  |
| `chicago-stadium` | Chicago Stadium | Chicago, United States | Q2703852 | 1929–1994 |  |  |
| `civic-arena` | Civic Arena | Pittsburgh, United States | Q1237181 | 1961–2010 | 16,940 hockey |  |
| `colisee-de-quebec` | Colisée de Québec | Quebec City, Canada | Q600226 | 1949–1995 | 15,176 hockey |  |
| `cow-palace` | Cow Palace | Daly City, United States | Q604015 | 1941–1993 | 13,550 hockey, 14,000 basketball |  |
| `desert-diamond-arena` | Desert Diamond Arena | Glendale, United States | Q1421377 | 2003–2022 | 17,125 hockey |  |
| `detroit-olympia` | Detroit Olympia | Detroit, United States | Q1201545 | 1927–1979 |  |  |
| `duquesne-gardens` | Duquesne Gardens | Pittsburgh, United States | Q3041488 | –1947 |  |  |
| `expo-hall` | Expo Hall | Tampa, United States | Q1384652 | 1977–1993 | 10,425 hockey |  |
| `first-horizon-coliseum` | First Horizon Coliseum | Greensboro, United States | Q133089582 | 1959–1999 | 22,000 hockey |  |
| `kemper-arena` | Kemper Arena | Kansas City, United States | Q1489399 | 1974–1985 |  |  |
| `joe-louis-arena` | Joe Louis Arena | Detroit, United States | Q168579 | 1979–2017 | 19,275 hockey, 20,153 basketball |  |
| `jubilee-arena` | Jubilee Arena | Montreal, Canada | Q599978 | –1919 | 3,200 hockey |  |
| `kia-forum` | Kia Forum | Inglewood, United States | Q639129 | 1967–2000 |  |  |
| `los-angeles-memorial-sports-arena` | Los Angeles Memorial Sports Arena | Los Angeles, United States | Q1571403 | 1959–1999 | 14,546 hockey, 16,161 basketball |  |
| `madison-square-garden-1925` | Madison Square Garden (1925) | New York, United States | Q6728098 | 1925–1968 | 15,925 hockey, 18,496 basketball |  |
| `maple-leaf-gardens` | Maple Leaf Gardens | Toronto, Canada | Q1814534 | 1931–2024 | 12,473 hockey |  |
| `massmutual-center` | MassMutual Center | Springfield, United States | Q6783965 | 1972–1980 | 6,793 hockey |  |
| `matthews-arena` | Matthews Arena | Boston, United States | Q919959 | 1910–1973 | 4,666 hockey, 5,066 basketball | 220 × 90 ft (–1971); 200 × 80 ft (1972–1994); 200 × 90 ft (1995–) |
| `mcnichols-sports-arena` | McNichols Sports Arena | Denver, United States | Q2081796 | 1975–1999 |  |  |
| `meadowlands-arena` | Meadowlands Arena | East Rutherford, United States | Q538218 | 1981–2010 |  |  |
| `met-center` | Met Center | Bloomington, United States | Q3307175 | 1967–1993 |  |  |
| `miami-arena` | Miami Arena | Miami, United States | Q1857422 | 1988–1999 |  |  |
| `montreal-arena` | Montreal Arena (Aréna de Westmount) | Westmount, Canada | Q849938 | 1898–1918 | 4,300 hockey |  |
| `montreal-forum` | Montreal Forum (Forum de Montréal) | Montreal, Canada | Q367272 | 1924–1996 | 17,959 hockey |  |
| `mount-royal-arena` | Mount Royal Arena | Montreal, Canada | Q544559 | 1920–1926 | 6,000 hockey |  |
| `mullett-arena` | Mullett Arena | Tempe, United States | Q111169373 | 2022–2024 |  |  |
| `mutual-street-arena` | Mutual Street Arena | Toronto, Canada | Q3331013 | 1912–1931 |  |  |
| `nassau-coliseum` | Nassau Coliseum | Uniondale, United States | Q1048921 | 1972–2021 | 13,900 hockey, 14,500 basketball |  |
| `northlands-coliseum` | Northlands Coliseum | Edmonton, Canada | Q1139489 | 1974–2016 | 17,100 hockey |  |
| `oakland-arena` | Oakland Arena | Oakland, United States | Q1139021 | 1966–2019 | 19,596 basketball |  |
| `omni-coliseum` | Omni Coliseum | Atlanta, United States | Q1970067 | 1972–1997 | 15,078 hockey, 16,181 basketball |  |
| `ottawa-auditorium` | Ottawa Auditorium | Ottawa, Canada | Q7109141 | 1923–1934 |  |  |
| `peoplesbank-arena` | PeoplesBank Arena | Hartford, United States | Q1783634 | 1975–1997 | 14,750 hockey, 15,495 basketball |  |
| `philadelphia-arena` | Philadelphia Arena | Philadelphia, United States | Q3378842 | 1920–1952 |  | 220 × 101 ft |
| `quebec-arena` | Quebec Arena | Quebec City, Canada | Q7269749 | 1913–1942 | 6,000 hockey |  |
| `reunion-arena` | Reunion Arena | Dallas, United States | Q1859962 | 1980–2001 | 16,500 hockey, 17,772 basketball |  |
| `richfield-coliseum` | Richfield Coliseum | Richfield, United States | Q2982682 | 1974–1994 | 18,544 hockey, 20,273 basketball |  |
| `st-louis-arena` | St. Louis Arena | St. Louis, United States | Q3495282 | 1929–1994 | 14,200 hockey |  |
| `spectrum` | Spectrum | Philadelphia, United States | Q2085822 | 1967–1996 | 17,380 hockey, 18,168 basketball |  |
| `stampede-corral` | Stampede Corral | Calgary, Canada | Q1147148 | 1950–1983 | 7,475 hockey |  |
| `td-place-arena` | TD Place Arena | Ottawa, Canada | Q1143666 | 1967–2026 | 10,500 hockey |  |
| `windsor-arena` | Windsor Arena | Windsor, Canada | Q8024565 | 1924–1927 | 4,400 hockey | 195 × 80 ft |
| `winnipeg-arena` | Winnipeg Arena | Winnipeg, Canada | Q1165024 | 1955–1996 | 10,100 hockey |  |
| `baltimore-civic-center` | Baltimore Civic Center | Baltimore, United States | Q2739940 | 1962–1973 |  |  |
| `69th-regiment-armory` | 69th Regiment Armory | New York, United States | Q2781236 | –1960 |  |  |
| `allen-county-war-memorial-coliseum` | Allen County War Memorial Coliseum | Fort Wayne, United States | Q1144284 | 1952–1957 | 13,000 basketball |  |
| `orlando-arena` | Orlando Arena | Orlando, United States | Q481794 | 1989–2010 | 15,077 basketball |  |
| `arco-arena` | ARCO Arena | Sacramento, United States | Q93831 | 1988–2016 |  |  |
| `arco-arena-1985` | ARCO Arena I | Sacramento, United States | Q4653610 | 1985–1988 | 10,333 basketball |  |
| `arizona-veterans-memorial-coliseum` | Arizona Veterans Memorial Coliseum | Phoenix, United States | Q670890 | 1965–1992 |  |  |
| `baltimore-coliseum` | Baltimore Coliseum | Baltimore, United States | Q4852825 | 1939–1954 | 4,500 basketball |  |
| `bill-graham-civic-auditorium` | Bill Graham Civic Auditorium | San Francisco, United States | Q4909197 | 1915–1971 | 8,500 basketball |  |
| `rochester-community-war-memorial` | Rochester Community War Memorial | Rochester, United States | Q885674 | 1955–1957 |  |  |
| `bradley-center` | Bradley Center | Milwaukee, United States | Q737976 | 1988–2018 | 18,850 basketball |  |
| `calihan-hall` | Calihan Hall | Detroit, United States | Q5021351 | 1952–1961 | 7,917 basketball |  |
| `charlotte-coliseum` | Charlotte Coliseum | Charlotte, United States | Q632138 | 1988–2005 | 23,388 basketball |  |
| `cincinnati-gardens` | Cincinnati Gardens | Cincinnati, United States | Q1092220 | 1949–1972 | 10,208 basketball |  |
| `cleveland-arena` | Cleveland Arena | Cleveland, United States | Q5132059 | 1937–1974 | 11,000 basketball |  |
| `cobo-arena` | Cobo Arena | Detroit, United States | Q1104711 | 1960–1978 |  |  |
| `the-summit` | The Summit | Houston, United States | Q2435324 | 1975–2003 | 16,800 basketball |  |
| `denver-auditorium-arena` | Denver Auditorium Arena | Denver, United States | Q5259672 | 1908–1975 |  |  |
| `edgerton-park-arena` | Edgerton Park Arena | Rochester, United States | Q5337822 | 1892–1955 | 4,200 basketball |  |
| `hofheinz-pavilion` | Hofheinz Pavilion | Houston, United States | Q5876764 | 1969–1975 | 7,035 basketball |  |
| `hemisfair-arena` | HemisFair Arena | San Antonio, United States | Q1145169 | 1968–1993 | 16,057 basketball |  |
| `hinkle-fieldhouse` | Hinkle Fieldhouse | Indianapolis, United States | Q3785713 | 1928–2022 | 9,100 basketball |  |
| `international-amphitheatre` | International Amphitheatre | Chicago, United States | Q1666325 | 1934–1967 | 9,000 basketball |  |
| `rutgers-athletic-center` | Rutgers Athletic Center | Piscataway, United States | Q6686804 | 1977–1981 | 8,000 basketball |  |
| `kiel-auditorium` | Kiel Auditorium | St. Louis, United States | Q3024991 | 1934–1968 | 9,300 basketball |  |
| `loyola-field-house` | Loyola Field House | New Orleans, United States | Q6694553 | 1954–1975 | 6,500 basketball |  |
| `market-square-arena` | Market Square Arena | Indianapolis, United States | Q3294309 | 1974–1999 | 16,530 basketball |  |
| `alexander-memorial-coliseum` | Alexander Memorial Coliseum | Atlanta, United States | Q1492102 | 1956–2018 | 8,600 basketball |  |
| `memphis-pyramid` | Memphis Pyramid | Memphis, United States | Q2226897 | 1991–2004 |  |  |
| `minneapolis-armory` | Minneapolis Armory | Minneapolis, United States | Q745327 | –1960 |  |  |
| `minneapolis-auditorium` | Minneapolis Auditorium | Minneapolis, United States | Q125537911 | 1927–1960 | 10,000 basketball |  |
| `moody-coliseum` | Moody Coliseum | University Park, United States | Q9035055 | 1956–1973 | 7,000 basketball |  |
| `municipal-auditorium-kansas-city` | Municipal Auditorium (Kansas City) | Kansas City, United States | Q14704450 | 1935–1974 |  |  |
| `municipal-auditorium-new-orleans` | Municipal Auditorium (New Orleans) | New Orleans, United States | Q6936134 | 1930–1975 | 7,853 basketball |  |
| `omaha-civic-auditorium` | Omaha Civic Auditorium | Omaha, United States | Q7089414 | 1954–1975 | 9,300 basketball |  |
| `palace-of-auburn-hills` | The Palace of Auburn Hills | Auburn Hills, United States | Q1327633 | 1988–2017 | 22,076 basketball |  |
| `pechanga-arena` | Pechanga Arena | San Diego, United States | Q3106621 | 1966–1984 | 14,500 basketball |  |
| `philadelphia-convention-hall-and-civic-center` | Philadelphia Convention Hall and Civic Center | Philadelphia, United States | Q3378843 | 1931–1967 | 9,600 basketball |  |
| `salt-palace` | Salt Palace | Salt Lake City, United States | Q17030210 | 1969–1991 | 12,616 basketball |  |
| `sheboygan-armory` | Sheboygan Municipal Auditorium and Armory | Sheboygan, United States | Q7492276 | 1942–1951 |  |  |
| `war-memorial-gymnasium` | War Memorial Gymnasium | San Francisco, United States | Q781955 | 1958–1965 | 3,005 basketball |  |
| `tacoma-dome` | Tacoma Dome | Tacoma, United States | Q1570942 | 1983–1995 | 21,000 basketball |  |
| `the-hippodrome` | The Hippodrome | Waterloo, United States | Q6801072 | 1919–1951 | 5,155 basketball |  |
| `toyota-coliseum` | Toyota Coliseum | Syracuse, United States | Q7603208 | –1951 |  |  |
| `uline-arena` | Uline Arena | Washington, United States | Q7971729 | 1941–1951 | 8,000 basketball |  |
| `onondaga-county-war-memorial` | Onondaga County War Memorial | Syracuse, United States | Q3566224 | 1951–1963 | 7,000 basketball |  |
| `milwaukee-arena` | Milwaukee Arena | Milwaukee, United States | Q1142808 | 1950–1988 | 12,700 basketball |  |
| `veterans-memorial-coliseum` | Veterans Memorial Coliseum | Portland, United States | Q549437 | 1960–1995 | 12,000 basketball |  |
| `wharton-field-house` | Wharton Field House | Moline, United States | Q14688239 | 1928–1951 | 7,250 basketball |  |
| `allstate-arena` | Allstate Arena | Rosemont, United States | Q1336027 | 1980–2017 | 17,500 basketball |  |
| `bok-center` | BOK Center | Tulsa, United States | Q2877349 | 2008–2015 | 17,839 basketball |  |
| `college-park-center` | College Park Center | Arlington, United States | Q2982974 | 2012–2026 | 7,000 basketball |  |
| `credit-union-1-arena` | Credit Union 1 Arena | Chicago, United States | Q3547208 | 1982–2009 | 10,300 basketball |  |
| `mohegan-sun-arena` | Mohegan Sun Arena | Uncasville, United States | Q2056942 | 2001–2026 | 9,323 basketball |  |
| `reliant-arena` | Reliant Arena | Houston, United States | Q7311038 | 1974– | 8,000 basketball |  |
| `westchester-county-center` | Westchester County Center | White Plains, United States | Q7987239 | 1930–2019 | 5,000 basketball |  |
| `total-mortgage-arena` | Total Mortgage Arena | Bridgeport, United States | Q7978892 | 2001–2024 | 8,412 hockey |  |
| `tsongas-center` | Tsongas Center | Lowell, United States | Q2076478 | 1998–2026 | 6,500 hockey |  |
| `verdun-auditorium` | Verdun Auditorium (Auditorium de Verdun) | Montreal, Canada | Q2870805 | 1939–2024 | 3,795 hockey |  |
| `rhode-island-auditorium` | Rhode Island Auditorium | Providence, United States | Q7320897 | 1926–1949 | 5,300 basketball |  |

## What `from` and `to` are

`from` is the year the arena opened (the infobox's, else Wikidata's). A current arena has no `to`. For an arena of the past `to` is the last year a club of the leagues played its home games there, as a park's is its last MLB season (the arena may have stood longer: the Montreal Forum, the Kia Forum and the Nassau Coliseum still stand); where the tenants give no year it is the year the arena closed or was pulled down. `closed` and `demolished` are the years the article gives for the building itself, where it gives them. `status` is `current` when a club of the leagues plays there today and `past` otherwise.

## Rinks and courts of another size

The NHL's rink is 200 by 85 feet and the NBA's court 94 by 50, and an arena is drawn at those sizes unless an article gives its own. 5 arenas have a rink of their own, each with the article and revision and in a few words what it says:

- `barton-street-arena`, Barton Street Arena: 200 × 80 ft (en.wikipedia.org "Barton Street Arena" revision 1372066713: the ice surface was 200 by 80 feet)
- `boston-garden`, Boston Garden: 190.9 × 83 ft (en.wikipedia.org "Boston Garden" revision 1379921964: the hockey rink was undersized at 58.2 by 25.3 metres, nine feet shorter and two feet narrower than the NHL's 200 by 85 feet)
- `matthews-arena`, Matthews Arena: 220 × 90 ft (from the start to 1971) (en.wikipedia.org "Matthews Arena" revision 1372084660: the original ice surface was 220 by 90 feet, until it was reduced before the Whalers began play in 1972); 200 × 80 ft (1972 to 1994) (en.wikipedia.org "Matthews Arena" revision 1372084660: reduced to 200 by 80 feet, which stood until the renovation of 1995); 200 × 90 ft (1995 on) (en.wikipedia.org "Matthews Arena" revision 1372084660: the 1995 renovation widened the ice from 200 by 80 to 200 by 90 feet)
- `philadelphia-arena`, Philadelphia Arena: 220 × 101 ft (en.wikipedia.org "Philadelphia Arena" revision 1372214135: the ice in the new arena (opened 1920) was 220 by 101 feet)
- `windsor-arena`, Windsor Arena: 195 × 80 ft (en.wikipedia.org "Windsor Arena" revision 1372252144: the ice is 80 by 195 feet (given in the present tense))

No article gives the size of any court. Three arenas are said to have had a rink shorter than the NHL's with no figure (the Chicago Stadium, Buffalo's Memorial Auditorium and the Cow Palace); they are drawn at the NHL's size, and the description of the drawing says so. The size of a rink changes with the year: `drawKyogijo({ sport: "nhl", arena: "matthews-arena", year: 1926 })` is the 220 by 90 feet ice of the first years and `year: 1972` the 200 by 80 feet of the Whalers.

## Notes

- `bell-centre`: Ice hockey: 20,962 is the article's figure for 2025–present; 21,273 was its figure for 1996–2014.
- `bridgestone-arena`: Ice hockey: 17,510 is Wikidata's figure for ice hockey (P1083 with P641 ice hockey); the article's infobox gives 17,159 undated.
- `canadian-tire-centre`: Ice hockey: 17,010 is the article's figure for 2026–present; 18,500 was its figure for 1996–2005.
- `grand-casino-arena`: Ice hockey: 17,954 is the article's figure for 2012–present; 18,064 was its figure for 2000–2012.
- `keybank-center`: Ice hockey: 19,070 is the article's figure for 2013–present; 18,595 was its figure for 1996–1999.
- `lenovo-center`: Ice hockey: 18,547 is the article's figure for 2026–present; 18,730 was its figure for 1999–2006.
- `ppg-paints-arena`: Ice hockey: 18,187 is the article's figure for 2023–present; 18,087 was its figure for 2010–2011.
- `prudential-center`: Ice hockey: 16,514 is the article's figure for 2015–present; 17,625 was its figure for 2007–2013.
- `rogers-arena`: Ice hockey: 18,871 is the article's figure for 2018–present; 18,422 was its figure for 1995–2002.
- `sap-center`: Ice hockey: 17,435 is the article's figure for 2023–present; 17,562 was its figure for 2001–2023.
- `scotiabank-saddledome`: Ice hockey: 19,289 is the article's figure for 1995–present; 16,605 was its figure for 1983–1988.
- `state-farm-arena`: Ice hockey: 17,624 is the article's last ice-hockey figure (2010–2011); the article gives none after 2011. 18,545 was its figure for 1999–2010.
- `buffalo-memorial-auditorium`: The article says the ice sheet fell short of the NHL's 200 by 85 feet and gives no figure: the rink is drawn at the NHL's size.
- `chicago-stadium`: The article says the Stadium's ice was shorter than the NHL's regulation size, the distance taken out of the neutral zone, and gives no figure: the rink is drawn at the NHL's size.
- `cow-palace`: The article says the rink was smaller than the NHL's and gives no figure: it is drawn at the NHL's size.
- `detroit-olympia`: The article gives 242 by 110 feet for the skating rink at the opening of 1927, which is the whole skating floor and not the ice of a game: the rink is drawn at the NHL's size.
- `peoplesbank-arena`: The Civic Center closed for repairs after the roof fell in 1978 and reopened in 1980; the Whalers and the Celtics played there until 1997 and 1995.
- `alexander-memorial-coliseum`: The Coliseum was rebuilt as McCamish Pavilion in 2011; the Atlanta Dream of the WNBA played in the new building in 2017 and 2018.

## Names

An arena has the name people used when the league played there and every other name it answers to, each with where it was read: `name` is the everyday name in English, `nameJa` in Japanese (with `readingJa` in kana where it has kanji), `names` the names it had for some years (`arenaNameIn(arena, year)` picks the one of a year), and `aliases` the others, `{ name, lang, kind, from?, to?, source?, revision? }` as for [grounds](./grounds.md#names). `arenaByName(name)` finds an arena by any of them in English or Japanese. Where the everyday name is not the title of the article cited (it is a name of the time the league played there, or the article's title carries a disambiguation) the article is an alias:

| Key | Everyday name | English article |
| --- | --- | --- |
| `big-e-coliseum` | The Big E Coliseum | Big E Coliseum |
| `capital-centre` | Capital Centre | Capital Centre (Landover, Maryland) |
| `civic-arena` | Civic Arena | Civic Arena (Pittsburgh) |
| `kemper-arena` | Kemper Arena | Hy-Vee Arena |
| `spectrum` | Spectrum | Spectrum (arena) |
| `baltimore-civic-center` | Baltimore Civic Center | CFG Bank Arena |
| `orlando-arena` | Orlando Arena | Amway Arena |
| `arco-arena-1985` | ARCO Arena I | ARCO Arena (1985) |
| `rochester-community-war-memorial` | Rochester Community War Memorial | Blue Cross Arena |
| `cobo-arena` | Cobo Arena | Huntington Place |
| `the-summit` | The Summit | Lakewood Church Central Campus |
| `hofheinz-pavilion` | Hofheinz Pavilion | Fertitta Center |
| `rutgers-athletic-center` | Rutgers Athletic Center | Jersey Mike's Arena |
| `alexander-memorial-coliseum` | Alexander Memorial Coliseum | McCamish Pavilion |
| `municipal-auditorium-kansas-city` | Municipal Auditorium (Kansas City) | Municipal Auditorium (Kansas City, Missouri) |
| `salt-palace` | Salt Palace | Salt Palace (arena) |
| `sheboygan-armory` | Sheboygan Municipal Auditorium and Armory | Sheboygan Armory |
| `war-memorial-gymnasium` | War Memorial Gymnasium | Sobrato Center |
| `onondaga-county-war-memorial` | Onondaga County War Memorial | Upstate Medical University Arena |
| `milwaukee-arena` | Milwaukee Arena | UW–Milwaukee Panther Arena |
| `veterans-memorial-coliseum` | Veterans Memorial Coliseum | Veterans Memorial Coliseum (Portland, Oregon) |
