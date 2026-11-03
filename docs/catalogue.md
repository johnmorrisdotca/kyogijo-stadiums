# The catalogue

[日本語](catalogue.ja.md) · English

Every venue the package draws today, the ones being built and the ones we want, in one list with ids, names in English and Japanese, places, sports and Wikidata items. It is published two ways, with the same data: a static file, `catalogue.json`, at a stable address and inside the npm package, and the typed entry `@johnmorrisdotca/kyogijo-stadiums/catalogue`. There is no server. The demo's [catalogue page](https://johnmorrisdotca.github.io/kyogijo-stadiums/catalogue.html) shows it as cards with a map, and the [real stadiums](./stadiums.md) and [real venues](./venues.md) pages say how a venue is drawn in its building.

- **Supported**: every real venue the package draws, made from its own data and never typed again: the real stadiums (`STADIUMS`) and the NHL's real venues (`VENUES`) are drawn **in their buildings**, inside the outline OpenStreetMap maps with a bowl of their seats; every other key of `PARKS`, `GROUNDS`, `ARENAS` and `HALLS` is drawn **as a field, court, rink, park or floor only**, at the venue's own size where the data gives one.
- **Working on**: the ten tennis show courts of ticket KYOGIJO-STADIUMS-22, open to an outside contributor.
- **Wanted**: every venue of the NFL and the CFL this season that is not drawn yet, and groups of world-class venues of sports the package draws (soccer, cricket, rugby, Gaelic and Australian football, sumo and the budō, athletics, college football, baseball, skating and swimming, indoor sports), each in order of how famous it is; and the circuits of Formula One's 2026 calendar and other great circuits, which wait for a circuit surface. A venue the package draws as a field only that a league or a group lists is wanted for its building's outline, and is not listed twice.

![The demo's catalogue page with the Wanted tab chosen: five cards of the leagues' coverage, each with a bar of what is drawn in its building and as a field only, rows of chips for the sports and the groups, a search box, a world map with a pin on each venue and the first cards, each with its country's flag, its city, its sport and a Wanted badge](./pictures/catalogue-desk-light.webp)

<!-- catalogue-counts -->
| Section | Venues |
| --- | --- |
| Supported | 331 |
| Supported: drawn in its building | 43 |
| Supported: drawn as a field, court or floor only | 288 |
| Supported: of them, the building's outline is wanted | 69 |
| Working on | 10 |
| Wanted | 133 |
<!-- /catalogue-counts -->

## Using it

The JSON is at <https://johnmorrisdotca.github.io/kyogijo-stadiums/catalogue.json> (published with the demo) and in the package as `@johnmorrisdotca/kyogijo-stadiums/catalogue.json`. It has a `schemaVersion` (1; a change that breaks a reader raises it), `generatedAt` (the day the sources were read, not the day the file was written), the package's version, the licence of the facts, the counts, the sports and groups with their names in both languages, the countries' names, and `venues`, one object per venue.

```js no-run
const catalogue = await (await fetch("https://johnmorrisdotca.github.io/kyogijo-stadiums/catalogue.json")).json();
const wanted = catalogue.venues.filter((venue) => venue.status === "wanted");
console.log(catalogue.schemaVersion, wanted.length);
```

The entry has the same data with its types, and a few lookups:

```ts
import { CATALOGUE, catalogueById, catalogueBySport, catalogueByStatus, catalogueCoverage } from "@johnmorrisdotca/kyogijo-stadiums/catalogue";
import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(catalogueByStatus("supported").length + catalogueByStatus("working-on").length + catalogueByStatus("wanted").length === CATALOGUE.length);
// true
const nfl = catalogueCoverage("nfl");
console.log(`NFL: ${nfl.outline} of ${nfl.venues} drawn in its building, ${nfl.surface} as a field only, ${nfl.notYet} not yet`);
// NFL: 2 of 30 drawn in its building, 9 as a field only, 19 not yet
const lambeau = catalogueById("lambeau-field")!;
console.log(lambeau.status, lambeau.nameJa, lambeau.teams?.map((team) => team.name).join());
// wanted ランボー・フィールド Green Bay Packers
const fenway = catalogueById("fenway-park")!;
console.log(fenway.drawn, fenway.want, drawKyogijo({ ...fenway.draw!, style: "none" }).startsWith("<svg"));
// surface outline true
console.log(catalogueBySport("motor-racing").every((venue) => venue.needs === "circuit-surface"));
// true
```

A venue (`CatalogueEntry`) has:

| Field | What it is |
| --- | --- |
| `id` | Kebab case and unique. A supported venue's is the package's own key (`fenway-park`, `bc-place`); a renamed venue keeps its key. A new venue's is made from its name. |
| `status` | `supported`, `working-on` or `wanted`. |
| `drawn` | For a supported venue: `outline` (in its building) or `surface` (its field, court, rink, park or floor only). |
| `want`, `needs` | What is wanted: `outline` (the building of a venue drawn as a surface today) or `venue`; `needs: "circuit-surface"` for a circuit, which waits for a surface the package does not have. |
| `name`, `nameJa`, `nameJaFrom` | The everyday name in English (the package's, or the title of the English Wikipedia's article) and in Japanese, and where the Japanese was read: the package, Wikidata's label, the Japanese Wikipedia's title, or a name a reviewer checked. |
| `city`, `cityJa`, `country` | The city, in both languages, and the ISO 3166-1 alpha-2 code of the country. |
| `lat`, `lon` | Wikidata's coordinates (P625). |
| `sports` | The sports, in kebab case (`CATALOGUE_SPORTS` names each and gives the `sport` of `drawKyogijo` that draws it). |
| `wikidata` | The Wikidata item. |
| `capacity` | For a venue not drawn yet: the seats, where Wikidata gives one figure (P1083). A supported venue's seats are in its own data. |
| `leagues`, `teams` | The leagues that play there this season, and their clubs in both languages. |
| `groups` | The leagues and collections it is listed in. |
| `ticket` | The ticket of a venue being built. |
| `draw`, `demo` | For a supported venue: the options that draw it with `drawKyogijo`, and its page of the demo, relative to `CATALOGUE_SITE`. |
| `missing` | The facts left out, each with why. A blank is better than a guess. |

## The leagues

Every venue of the season of five leagues of North America is listed, whether it is drawn or not. A stadium two clubs share is listed once, with both (MetLife Stadium, SoFi Stadium). NBA, MLB and NHL venues are the package's own (`ARENAS`, `PARKS` and `VENUES`, with their clubs); the NFL's and the CFL's that it does not draw are checked against the English Wikipedia's list of the league's stadiums, at the revision in `source.articles`.

<!-- catalogue-leagues -->
| League | Season | Venues | In its building | As a field only | Not drawn yet |
| --- | --- | --- | --- | --- | --- |
| NBA arenas | 2026-27 | 30 | 12 | 18 | 0 |
| MLB ballparks | 2026 | 30 | 3 | 27 | 0 |
| NFL stadiums | 2026 | 30 | 2 | 9 | 19 |
| CFL stadiums | 2026 | 9 | 1 | 1 | 7 |
| NHL arenas | 2026-27 | 32 | 32 | 0 | 0 |
<!-- /catalogue-leagues -->

<!-- catalogue-league-venues -->
### NBA arenas: 12 of 30 drawn in its building

| Key | Venue | City | Teams | Drawn | Wikidata |
| --- | --- | --- | --- | --- | --- |
| `american-airlines-center` | American Airlines Center | Dallas, United States | Dallas Mavericks | in its building | [Q463345](https://www.wikidata.org/wiki/Q463345) |
| `ball-arena` | Ball Arena | Denver, United States | Denver Nuggets | in its building | [Q795470](https://www.wikidata.org/wiki/Q795470) |
| `barclays-center` | Barclays Center | Brooklyn, United States | Brooklyn Nets | in its building | [Q807966](https://www.wikidata.org/wiki/Q807966) |
| `capital-one-arena` | Capital One Arena | Washington, United States | Washington Wizards | in its building | [Q223240](https://www.wikidata.org/wiki/Q223240) |
| `crypto-com-arena` | Crypto.com Arena | Los Angeles, United States | Los Angeles Lakers | in its building | [Q186080](https://www.wikidata.org/wiki/Q186080) |
| `delta-center` | Delta Center | Salt Lake City, United States | Utah Jazz | in its building | [Q82294](https://www.wikidata.org/wiki/Q82294) |
| `little-caesars-arena` | Little Caesars Arena | Detroit, United States | Detroit Pistons | in its building | [Q18154984](https://www.wikidata.org/wiki/Q18154984) |
| `madison-square-garden` | Madison Square Garden | New York, United States | New York Knicks | in its building | [Q186125](https://www.wikidata.org/wiki/Q186125) |
| `scotiabank-arena` | Scotiabank Arena | Toronto, Canada | Toronto Raptors | in its building | [Q406972](https://www.wikidata.org/wiki/Q406972) |
| `td-garden` | TD Garden | Boston, United States | Boston Celtics | in its building | [Q432105](https://www.wikidata.org/wiki/Q432105) |
| `united-center` | United Center | Chicago, United States | Chicago Bulls | in its building | [Q639975](https://www.wikidata.org/wiki/Q639975) |
| `xfinity-mobile-arena` | Xfinity Mobile Arena | Philadelphia, United States | Philadelphia 76ers | in its building | [Q818735](https://www.wikidata.org/wiki/Q818735) |
| `chase-center` | Chase Center | San Francisco, United States | Golden State Warriors | field only | [Q15262098](https://www.wikidata.org/wiki/Q15262098) |
| `fedexforum` | FedExForum | Memphis, United States | Memphis Grizzlies | field only | [Q641212](https://www.wikidata.org/wiki/Q641212) |
| `fiserv-forum` | Fiserv Forum | Milwaukee, United States | Milwaukee Bucks | field only | [Q20372160](https://www.wikidata.org/wiki/Q20372160) |
| `frost-bank-center` | Frost Bank Center | San Antonio, United States | San Antonio Spurs | field only | [Q298573](https://www.wikidata.org/wiki/Q298573) |
| `gainbridge-fieldhouse` | Gainbridge Fieldhouse | Indianapolis, United States | Indiana Pacers | field only | [Q545007](https://www.wikidata.org/wiki/Q545007) |
| `golden-1-center` | Golden 1 Center | Sacramento, United States | Sacramento Kings | field only | [Q7011384](https://www.wikidata.org/wiki/Q7011384) |
| `intuit-dome` | Intuit Dome | Inglewood, United States | Los Angeles Clippers | field only | [Q54958436](https://www.wikidata.org/wiki/Q54958436) |
| `kaseya-center` | Kaseya Center | Miami, United States | Miami Heat | field only | [Q420129](https://www.wikidata.org/wiki/Q420129) |
| `kia-center` | Kia Center | Orlando, United States | Orlando Magic | field only | [Q481795](https://www.wikidata.org/wiki/Q481795) |
| `moda-center` | Moda Center | Portland, United States | Portland Trail Blazers | field only | [Q1347442](https://www.wikidata.org/wiki/Q1347442) |
| `mortgage-matchup-center` | Mortgage Matchup Center | Phoenix, United States | Phoenix Suns | field only | [Q1538690](https://www.wikidata.org/wiki/Q1538690) |
| `paycom-center` | Paycom Center | Oklahoma City, United States | Oklahoma City Thunder | field only | [Q665434](https://www.wikidata.org/wiki/Q665434) |
| `rocket-arena` | Rocket Arena | Cleveland, United States | Cleveland Cavaliers | field only | [Q387157](https://www.wikidata.org/wiki/Q387157) |
| `smoothie-king-center` | Smoothie King Center | New Orleans, United States | New Orleans Pelicans | field only | [Q1515840](https://www.wikidata.org/wiki/Q1515840) |
| `spectrum-center` | Spectrum Center | Charlotte, United States | Charlotte Hornets | field only | [Q983870](https://www.wikidata.org/wiki/Q983870) |
| `state-farm-arena` | State Farm Arena | Atlanta, United States | Atlanta Hawks | field only | [Q1123297](https://www.wikidata.org/wiki/Q1123297) |
| `target-center` | Target Center | Minneapolis, United States | Minnesota Timberwolves | field only | [Q282675](https://www.wikidata.org/wiki/Q282675) |
| `toyota-center` | Toyota Center | Houston, United States | Houston Rockets | field only | [Q1166157](https://www.wikidata.org/wiki/Q1166157) |

### MLB ballparks: 3 of 30 drawn in its building

| Key | Venue | City | Teams | Drawn | Wikidata |
| --- | --- | --- | --- | --- | --- |
| `citi-field` | Citi Field | New York, United States | New York Mets | in its building | [Q1072882](https://www.wikidata.org/wiki/Q1072882) |
| `t-mobile-park` | T-Mobile Park | Seattle, United States | Seattle Mariners | in its building | [Q1193117](https://www.wikidata.org/wiki/Q1193117) |
| `yankee-stadium` | Yankee Stadium | New York, United States | New York Yankees | in its building | [Q753529](https://www.wikidata.org/wiki/Q753529) |
| `american-family-field` | American Family Field | Milwaukee, United States | Milwaukee Brewers | field only | [Q1339293](https://www.wikidata.org/wiki/Q1339293) |
| `angel-stadium` | Angel Stadium | Anaheim, United States | Los Angeles Angels | field only | [Q531897](https://www.wikidata.org/wiki/Q531897) |
| `busch-stadium` | Busch Stadium | St. Louis, United States | St. Louis Cardinals | field only | [Q253546](https://www.wikidata.org/wiki/Q253546) |
| `chase-field` | Chase Field | Phoenix, United States | Arizona Diamondbacks | field only | [Q1068011](https://www.wikidata.org/wiki/Q1068011) |
| `citizens-bank-park` | Citizens Bank Park | Philadelphia, United States | Philadelphia Phillies | field only | [Q912770](https://www.wikidata.org/wiki/Q912770) |
| `comerica-park` | Comerica Park | Detroit, United States | Detroit Tigers | field only | [Q868482](https://www.wikidata.org/wiki/Q868482) |
| `coors-field` | Coors Field | Denver, United States | Colorado Rockies | field only | [Q1129916](https://www.wikidata.org/wiki/Q1129916) |
| `daikin-park` | Daikin Park | Houston, United States | Houston Astros | field only | [Q1193671](https://www.wikidata.org/wiki/Q1193671) |
| `dodger-stadium` | Dodger Stadium | Los Angeles, United States | Los Angeles Dodgers | field only | [Q247420](https://www.wikidata.org/wiki/Q247420) |
| `fenway-park` | Fenway Park | Boston, United States | Boston Red Sox | field only | [Q49136](https://www.wikidata.org/wiki/Q49136) |
| `globe-life-field` | Globe Life Field | Arlington, United States | Texas Rangers | field only | [Q24284037](https://www.wikidata.org/wiki/Q24284037) |
| `great-american-ball-park` | Great American Ball Park | Cincinnati, United States | Cincinnati Reds | field only | [Q979975](https://www.wikidata.org/wiki/Q979975) |
| `kauffman-stadium` | Kauffman Stadium | Kansas City, United States | Kansas City Royals | field only | [Q1737017](https://www.wikidata.org/wiki/Q1737017) |
| `loandepot-park` | loanDepot Park | Miami, United States | Miami Marlins | field only | [Q1368138](https://www.wikidata.org/wiki/Q1368138) |
| `nationals-park` | Nationals Park | Washington, United States | Washington Nationals | field only | [Q517545](https://www.wikidata.org/wiki/Q517545) |
| `oracle-park` | Oracle Park | San Francisco, United States | San Francisco Giants | field only | [Q298585](https://www.wikidata.org/wiki/Q298585) |
| `oriole-park-at-camden-yards` | Oriole Park at Camden Yards | Baltimore, United States | Baltimore Orioles | field only | [Q1141174](https://www.wikidata.org/wiki/Q1141174) |
| `petco-park` | Petco Park | San Diego, United States | San Diego Padres | field only | [Q1194586](https://www.wikidata.org/wiki/Q1194586) |
| `pnc-park` | PNC Park | Pittsburgh, United States | Pittsburgh Pirates | field only | [Q1151177](https://www.wikidata.org/wiki/Q1151177) |
| `progressive-field` | Progressive Field | Cleveland, United States | Cleveland Guardians | field only | [Q1154053](https://www.wikidata.org/wiki/Q1154053) |
| `rate-field` | Rate Field | Chicago, United States | Chicago White Sox | field only | [Q633613](https://www.wikidata.org/wiki/Q633613) |
| `rogers-centre` | Rogers Centre | Toronto, Canada | Toronto Blue Jays | field only | [Q76318](https://www.wikidata.org/wiki/Q76318) |
| `sutter-health-park` | Sutter Health Park | West Sacramento, United States | Athletics | field only | [Q3418115](https://www.wikidata.org/wiki/Q3418115) |
| `target-field` | Target Field | Minneapolis, United States | Minnesota Twins | field only | [Q1156635](https://www.wikidata.org/wiki/Q1156635) |
| `tropicana-field` | Tropicana Field | St. Petersburg, United States | Tampa Bay Rays | field only | [Q1810119](https://www.wikidata.org/wiki/Q1810119) |
| `truist-park` | Truist Park | Cumberland, United States | Atlanta Braves | field only | [Q17003430](https://www.wikidata.org/wiki/Q17003430) |
| `wrigley-field` | Wrigley Field | Chicago, United States | Chicago Cubs | field only | [Q1052807](https://www.wikidata.org/wiki/Q1052807) |

### NFL stadiums: 2 of 30 drawn in its building

| Key | Venue | City | Teams | Drawn | Wikidata |
| --- | --- | --- | --- | --- | --- |
| `lumen-field` | Lumen Field | Seattle, United States | Seattle Seahawks | in its building | [Q612736](https://www.wikidata.org/wiki/Q612736) |
| `metlife-stadium` | MetLife Stadium | East Rutherford, United States | New York Giants, New York Jets | in its building | [Q10862290](https://www.wikidata.org/wiki/Q10862290) |
| `arrowhead-stadium` | Arrowhead Stadium | Kansas City, United States | Kansas City Chiefs | field only | [Q544553](https://www.wikidata.org/wiki/Q544553) |
| `att-stadium` | AT&T Stadium | Arlington, United States | Dallas Cowboys | field only | [Q838284](https://www.wikidata.org/wiki/Q838284) |
| `gillette-stadium` | Gillette Stadium | Foxborough, United States | New England Patriots | field only | [Q373355](https://www.wikidata.org/wiki/Q373355) |
| `hard-rock-stadium` | Hard Rock Stadium | Miami Gardens, United States | Miami Dolphins | field only | [Q864339](https://www.wikidata.org/wiki/Q864339) |
| `levis-stadium` | Levi's Stadium | Santa Clara, United States | San Francisco 49ers | field only | [Q7419343](https://www.wikidata.org/wiki/Q7419343) |
| `lincoln-financial-field` | Lincoln Financial Field | Philadelphia, United States | Philadelphia Eagles | field only | [Q1052370](https://www.wikidata.org/wiki/Q1052370) |
| `mercedes-benz-stadium` | Mercedes-Benz Stadium | Atlanta, United States | Atlanta Falcons | field only | [Q7007552](https://www.wikidata.org/wiki/Q7007552) |
| `nrg-stadium` | Reliant Stadium | Houston, United States | Houston Texans | field only | [Q1058864](https://www.wikidata.org/wiki/Q1058864) |
| `sofi-stadium` | SoFi Stadium | Inglewood, United States | Los Angeles Chargers, Los Angeles Rams | field only | [Q19520501](https://www.wikidata.org/wiki/Q19520501) |
| `acrisure-stadium` | Acrisure Stadium | Pittsburgh, United States | Pittsburgh Steelers | Not drawn yet | [Q1067148](https://www.wikidata.org/wiki/Q1067148) |
| `allegiant-stadium` | Allegiant Stadium | Paradise, United States | Las Vegas Raiders | Not drawn yet | [Q27768421](https://www.wikidata.org/wiki/Q27768421) |
| `bank-of-america-stadium` | Bank of America Stadium | Charlotte, United States | Carolina Panthers | Not drawn yet | [Q806673](https://www.wikidata.org/wiki/Q806673) |
| `caesars-superdome` | Caesars Superdome | New Orleans, United States | New Orleans Saints | Not drawn yet | [Q756452](https://www.wikidata.org/wiki/Q756452) |
| `empower-field-at-mile-high` | Empower Field at Mile High | Denver, United States | Denver Broncos | Not drawn yet | [Q1046135](https://www.wikidata.org/wiki/Q1046135) |
| `everbank-stadium` | EverBank Stadium | Jacksonville, United States | Jacksonville Jaguars | Not drawn yet | [Q635117](https://www.wikidata.org/wiki/Q635117) |
| `ford-field` | Ford Field | Detroit, United States | Detroit Lions | Not drawn yet | [Q1142586](https://www.wikidata.org/wiki/Q1142586) |
| `highmark-stadium` | Highmark Stadium | Orchard Park, United States | Buffalo Bills | Not drawn yet | [Q16251517](https://www.wikidata.org/wiki/Q16251517) |
| `huntington-bank-field` | Huntington Bank Field | Cleveland, United States | Cleveland Browns | Not drawn yet | [Q1100756](https://www.wikidata.org/wiki/Q1100756) |
| `lambeau-field` | Lambeau Field | Green Bay, United States | Green Bay Packers | Not drawn yet | [Q860790](https://www.wikidata.org/wiki/Q860790) |
| `lucas-oil-stadium` | Lucas Oil Stadium | Indianapolis, United States | Indianapolis Colts | Not drawn yet | [Q867160](https://www.wikidata.org/wiki/Q867160) |
| `mt-bank-stadium` | M&T Bank Stadium | Baltimore, United States | Baltimore Ravens | Not drawn yet | [Q1141336](https://www.wikidata.org/wiki/Q1141336) |
| `nissan-stadium-nashville` | Nissan Stadium | Nashville, United States | Tennessee Titans | Not drawn yet | [Q1142992](https://www.wikidata.org/wiki/Q1142992) |
| `northwest-stadium` | Northwest Stadium | Landover, United States | Washington Commanders | Not drawn yet | [Q583085](https://www.wikidata.org/wiki/Q583085) |
| `paycor-stadium` | Paycor Stadium | Cincinnati, United States | Cincinnati Bengals | Not drawn yet | [Q1632294](https://www.wikidata.org/wiki/Q1632294) |
| `raymond-james-stadium` | Raymond James Stadium | Tampa, United States | Tampa Bay Buccaneers | Not drawn yet | [Q1141343](https://www.wikidata.org/wiki/Q1141343) |
| `soldier-field` | Soldier Field | Chicago, United States | Chicago Bears | Not drawn yet | [Q1132413](https://www.wikidata.org/wiki/Q1132413) |
| `state-farm-stadium` | State Farm Stadium | Glendale, United States | Arizona Cardinals | Not drawn yet | [Q756433](https://www.wikidata.org/wiki/Q756433) |
| `us-bank-stadium` | U.S. Bank Stadium | Minneapolis, United States | Minnesota Vikings | Not drawn yet | [Q7929512](https://www.wikidata.org/wiki/Q7929512) |

### CFL stadiums: 1 of 9 drawn in its building

| Key | Venue | City | Teams | Drawn | Wikidata |
| --- | --- | --- | --- | --- | --- |
| `bc-place` | BC Place | Vancouver, Canada | BC Lions | in its building | [Q612227](https://www.wikidata.org/wiki/Q612227) |
| `bmo-field` | BMO Field | Toronto, Canada | Toronto Argonauts | field only | [Q796351](https://www.wikidata.org/wiki/Q796351) |
| `commonwealth-stadium` | Commonwealth Stadium | Edmonton, Canada | Edmonton Elks | Not drawn yet | [Q130381](https://www.wikidata.org/wiki/Q130381) |
| `hamilton-stadium` | Hamilton Stadium | Hamilton, Canada | Hamilton Tiger-Cats | Not drawn yet | [Q7008048](https://www.wikidata.org/wiki/Q7008048) |
| `mcmahon-stadium` | McMahon Stadium | Calgary, Canada | Calgary Stampeders | Not drawn yet | [Q1810204](https://www.wikidata.org/wiki/Q1810204) |
| `mosaic-stadium` | Mosaic Stadium | Regina, Canada | Saskatchewan Roughriders | Not drawn yet | [Q7011148](https://www.wikidata.org/wiki/Q7011148) |
| `percival-molson-memorial-stadium` | Percival Molson Memorial Stadium | Montreal, Canada | Montreal Alouettes | Not drawn yet | [Q732147](https://www.wikidata.org/wiki/Q732147) |
| `princess-auto-stadium` | Princess Auto Stadium | Winnipeg, Canada | Winnipeg Blue Bombers | Not drawn yet | [Q1671788](https://www.wikidata.org/wiki/Q1671788) |
| `td-place-stadium` | TD Place Stadium | Ottawa, Canada | Ottawa Redblacks | Not drawn yet | [Q1442809](https://www.wikidata.org/wiki/Q1442809) |

### NHL arenas: 32 of 32 drawn in its building

| Key | Venue | City | Teams | Drawn | Wikidata |
| --- | --- | --- | --- | --- | --- |
| `amerant-bank-arena` | Amerant Bank Arena | Sunrise, United States | Florida Panthers | in its building | [Q795526](https://www.wikidata.org/wiki/Q795526) |
| `american-airlines-center` | American Airlines Center | Dallas, United States | Dallas Stars | in its building | [Q463345](https://www.wikidata.org/wiki/Q463345) |
| `ball-arena` | Ball Arena | Denver, United States | Colorado Avalanche | in its building | [Q795470](https://www.wikidata.org/wiki/Q795470) |
| `bell-centre` | Bell Centre | Montreal, Canada | Montreal Canadiens | in its building | [Q522282](https://www.wikidata.org/wiki/Q522282) |
| `benchmark-international-arena` | Benchmark International Arena | Tampa, United States | Tampa Bay Lightning | in its building | [Q940199](https://www.wikidata.org/wiki/Q940199) |
| `bridgestone-arena` | Bridgestone Arena | Nashville, United States | Nashville Predators | in its building | [Q302869](https://www.wikidata.org/wiki/Q302869) |
| `canada-life-centre` | Canada Life Centre | Winnipeg, Canada | Winnipeg Jets | in its building | [Q656928](https://www.wikidata.org/wiki/Q656928) |
| `canadian-tire-centre` | Canadian Tire Centre | Ottawa, Canada | Ottawa Senators | in its building | [Q1327290](https://www.wikidata.org/wiki/Q1327290) |
| `capital-one-arena` | Capital One Arena | Washington, United States | Washington Capitals | in its building | [Q223240](https://www.wikidata.org/wiki/Q223240) |
| `climate-pledge-arena` | Climate Pledge Arena | Seattle, United States | Seattle Kraken | in its building | [Q977529](https://www.wikidata.org/wiki/Q977529) |
| `crypto-com-arena` | Crypto.com Arena | Los Angeles, United States | Los Angeles Kings | in its building | [Q186080](https://www.wikidata.org/wiki/Q186080) |
| `delta-center` | Delta Center | Salt Lake City, United States | Utah Mammoth | in its building | [Q82294](https://www.wikidata.org/wiki/Q82294) |
| `enterprise-center` | Enterprise Center | St. Louis, United States | St. Louis Blues | in its building | [Q1067700](https://www.wikidata.org/wiki/Q1067700) |
| `grand-casino-arena` | Grand Casino Arena | Saint Paul, United States | Minnesota Wild | in its building | [Q1421388](https://www.wikidata.org/wiki/Q1421388) |
| `honda-center` | Honda Center | Anaheim, United States | Anaheim Ducks | in its building | [Q774138](https://www.wikidata.org/wiki/Q774138) |
| `keybank-center` | KeyBank Center | Buffalo, United States | Buffalo Sabres | in its building | [Q1110789](https://www.wikidata.org/wiki/Q1110789) |
| `lenovo-center` | Lenovo Center | Raleigh, United States | Carolina Hurricanes | in its building | [Q39177](https://www.wikidata.org/wiki/Q39177) |
| `little-caesars-arena` | Little Caesars Arena | Detroit, United States | Detroit Red Wings | in its building | [Q18154984](https://www.wikidata.org/wiki/Q18154984) |
| `madison-square-garden` | Madison Square Garden | New York, United States | New York Rangers | in its building | [Q186125](https://www.wikidata.org/wiki/Q186125) |
| `nationwide-arena` | Nationwide Arena | Columbus, United States | Columbus Blue Jackets | in its building | [Q166503](https://www.wikidata.org/wiki/Q166503) |
| `ppg-paints-arena` | PPG Paints Arena | Pittsburgh, United States | Pittsburgh Penguins | in its building | [Q595460](https://www.wikidata.org/wiki/Q595460) |
| `prudential-center` | Prudential Center | Newark, United States | New Jersey Devils | in its building | [Q849027](https://www.wikidata.org/wiki/Q849027) |
| `rogers-arena` | Rogers Arena | Vancouver, Canada | Vancouver Canucks | in its building | [Q517318](https://www.wikidata.org/wiki/Q517318) |
| `rogers-place` | Rogers Place | Edmonton, Canada | Edmonton Oilers | in its building | [Q5339036](https://www.wikidata.org/wiki/Q5339036) |
| `sap-center` | SAP Center | San Jose, United States | San Jose Sharks | in its building | [Q261863](https://www.wikidata.org/wiki/Q261863) |
| `scotiabank-arena` | Scotiabank Arena | Toronto, Canada | Toronto Maple Leafs | in its building | [Q406972](https://www.wikidata.org/wiki/Q406972) |
| `scotiabank-saddledome` | Scotiabank Saddledome | Calgary, Canada | Calgary Flames | in its building | [Q1140083](https://www.wikidata.org/wiki/Q1140083) |
| `t-mobile-arena` | T-Mobile Arena | Las Vegas, United States | Vegas Golden Knights | in its building | [Q3338973](https://www.wikidata.org/wiki/Q3338973) |
| `td-garden` | TD Garden | Boston, United States | Boston Bruins | in its building | [Q432105](https://www.wikidata.org/wiki/Q432105) |
| `ubs-arena` | UBS Arena | Elmont, United States | New York Islanders | in its building | [Q48742753](https://www.wikidata.org/wiki/Q48742753) |
| `united-center` | United Center | Chicago, United States | Chicago Blackhawks | in its building | [Q639975](https://www.wikidata.org/wiki/Q639975) |
| `xfinity-mobile-arena` | Xfinity Mobile Arena | Philadelphia, United States | Philadelphia Flyers | in its building | [Q818735](https://www.wikidata.org/wiki/Q818735) |
<!-- /catalogue-league-venues -->

## Supported

By the first sport each venue is drawn for. A venue of the past is drawn as it was (its fence, its rink).

<!-- catalogue-supported -->
### Baseball (94)

| Key | Venue | City | Drawn | Wikidata |
| --- | --- | --- | --- | --- |
| `oriole-park-at-camden-yards` | Oriole Park at Camden Yards | Baltimore, United States | field only | [Q1141174](https://www.wikidata.org/wiki/Q1141174) |
| `fenway-park` | Fenway Park | Boston, United States | field only | [Q49136](https://www.wikidata.org/wiki/Q49136) |
| `yankee-stadium` | Yankee Stadium | New York, United States | in its building | [Q753529](https://www.wikidata.org/wiki/Q753529) |
| `tropicana-field` | Tropicana Field | St. Petersburg, United States | field only | [Q1810119](https://www.wikidata.org/wiki/Q1810119) |
| `rogers-centre` | Rogers Centre | Toronto, Canada | field only | [Q76318](https://www.wikidata.org/wiki/Q76318) |
| `rate-field` | Rate Field | Chicago, United States | field only | [Q633613](https://www.wikidata.org/wiki/Q633613) |
| `progressive-field` | Progressive Field | Cleveland, United States | field only | [Q1154053](https://www.wikidata.org/wiki/Q1154053) |
| `comerica-park` | Comerica Park | Detroit, United States | field only | [Q868482](https://www.wikidata.org/wiki/Q868482) |
| `kauffman-stadium` | Kauffman Stadium | Kansas City, United States | field only | [Q1737017](https://www.wikidata.org/wiki/Q1737017) |
| `target-field` | Target Field | Minneapolis, United States | field only | [Q1156635](https://www.wikidata.org/wiki/Q1156635) |
| `daikin-park` | Daikin Park | Houston, United States | field only | [Q1193671](https://www.wikidata.org/wiki/Q1193671) |
| `angel-stadium` | Angel Stadium | Anaheim, United States | field only | [Q531897](https://www.wikidata.org/wiki/Q531897) |
| `sutter-health-park` | Sutter Health Park | West Sacramento, United States | field only | [Q3418115](https://www.wikidata.org/wiki/Q3418115) |
| `t-mobile-park` | T-Mobile Park | Seattle, United States | in its building | [Q1193117](https://www.wikidata.org/wiki/Q1193117) |
| `globe-life-field` | Globe Life Field | Arlington, United States | field only | [Q24284037](https://www.wikidata.org/wiki/Q24284037) |
| `truist-park` | Truist Park | Cumberland, United States | field only | [Q17003430](https://www.wikidata.org/wiki/Q17003430) |
| `loandepot-park` | loanDepot Park | Miami, United States | field only | [Q1368138](https://www.wikidata.org/wiki/Q1368138) |
| `citi-field` | Citi Field | New York, United States | in its building | [Q1072882](https://www.wikidata.org/wiki/Q1072882) |
| `citizens-bank-park` | Citizens Bank Park | Philadelphia, United States | field only | [Q912770](https://www.wikidata.org/wiki/Q912770) |
| `nationals-park` | Nationals Park | Washington, United States | field only | [Q517545](https://www.wikidata.org/wiki/Q517545) |
| `wrigley-field` | Wrigley Field | Chicago, United States | field only | [Q1052807](https://www.wikidata.org/wiki/Q1052807) |
| `great-american-ball-park` | Great American Ball Park | Cincinnati, United States | field only | [Q979975](https://www.wikidata.org/wiki/Q979975) |
| `american-family-field` | American Family Field | Milwaukee, United States | field only | [Q1339293](https://www.wikidata.org/wiki/Q1339293) |
| `pnc-park` | PNC Park | Pittsburgh, United States | field only | [Q1151177](https://www.wikidata.org/wiki/Q1151177) |
| `busch-stadium` | Busch Stadium | St. Louis, United States | field only | [Q253546](https://www.wikidata.org/wiki/Q253546) |
| `chase-field` | Chase Field | Phoenix, United States | field only | [Q1068011](https://www.wikidata.org/wiki/Q1068011) |
| `coors-field` | Coors Field | Denver, United States | field only | [Q1129916](https://www.wikidata.org/wiki/Q1129916) |
| `dodger-stadium` | Dodger Stadium | Los Angeles, United States | field only | [Q247420](https://www.wikidata.org/wiki/Q247420) |
| `petco-park` | Petco Park | San Diego, United States | field only | [Q1194586](https://www.wikidata.org/wiki/Q1194586) |
| `oracle-park` | Oracle Park | San Francisco, United States | field only | [Q298585](https://www.wikidata.org/wiki/Q298585) |
| `baker-bowl` | Baker Bowl | Philadelphia, United States | field only (past) | [Q4849117](https://www.wikidata.org/wiki/Q4849117) |
| `exposition-park-pittsburgh` | Exposition Park | Pittsburgh, United States | field only (past) | [Q5421611](https://www.wikidata.org/wiki/Q5421611) |
| `polo-grounds` | Polo Grounds | New York, United States | field only (past) | [Q1276360](https://www.wikidata.org/wiki/Q1276360) |
| `south-end-grounds` | South End Grounds | Boston, United States | field only (past) | [Q6646308](https://www.wikidata.org/wiki/Q6646308) |
| `huntington-avenue-grounds` | Huntington Avenue Grounds | Boston, United States | field only (past) | [Q1056422](https://www.wikidata.org/wiki/Q1056422) |
| `league-park-cleveland` | League Park | Cleveland, United States | field only (past) | [Q870897](https://www.wikidata.org/wiki/Q870897) |
| `sportsmans-park` | Sportsman's Park | St. Louis, United States | field only (past) | [Q7579980](https://www.wikidata.org/wiki/Q7579980) |
| `hilltop-park` | Hilltop Park | New York, United States | field only (past) | [Q5764114](https://www.wikidata.org/wiki/Q5764114) |
| `forbes-field` | Forbes Field | Pittsburgh, United States | field only (past) | [Q1963954](https://www.wikidata.org/wiki/Q1963954) |
| `shibe-park` | Shibe Park | Philadelphia, United States | field only (past) | [Q7496044](https://www.wikidata.org/wiki/Q7496044) |
| `comiskey-park` | Comiskey Park | Chicago, United States | field only (past) | [Q1114772](https://www.wikidata.org/wiki/Q1114772) |
| `griffith-stadium` | Griffith Stadium | Washington, United States | field only (past) | [Q5608924](https://www.wikidata.org/wiki/Q5608924) |
| `crosley-field` | Crosley Field | Cincinnati, United States | field only (past) | [Q3003747](https://www.wikidata.org/wiki/Q3003747) |
| `tiger-stadium` | Tiger Stadium | Detroit, United States | field only (past) | [Q1750255](https://www.wikidata.org/wiki/Q1750255) |
| `ebbets-field` | Ebbets Field | Brooklyn, United States | field only (past) | [Q1278537](https://www.wikidata.org/wiki/Q1278537) |
| `braves-field` | Braves Field | Boston, United States | field only (past) | [Q11335096](https://www.wikidata.org/wiki/Q11335096) |
| `yankee-stadium-1923` | Yankee Stadium (1923) | New York, United States | field only (past) | [Q675214](https://www.wikidata.org/wiki/Q675214) |
| `cleveland-stadium` | Cleveland Stadium | Cleveland, United States | field only (past) | [Q2113078](https://www.wikidata.org/wiki/Q2113078) |
| `milwaukee-county-stadium` | Milwaukee County Stadium | Milwaukee, United States | field only (past) | [Q3314569](https://www.wikidata.org/wiki/Q3314569) |
| `baltimore-memorial-stadium` | Memorial Stadium (Baltimore) | Baltimore, United States | field only (past) | [Q2748739](https://www.wikidata.org/wiki/Q2748739) |
| `municipal-stadium-kansas-city` | Municipal Stadium | Kansas City, United States | field only (past) | [Q6936283](https://www.wikidata.org/wiki/Q6936283) |
| `seals-stadium` | Seals Stadium | San Francisco, United States | field only (past) | [Q7440659](https://www.wikidata.org/wiki/Q7440659) |
| `candlestick-park` | Candlestick Park | San Francisco, United States | field only (past) | [Q1033076](https://www.wikidata.org/wiki/Q1033076) |
| `wrigley-field-los-angeles` | Wrigley Field (Los Angeles) | Los Angeles, United States | field only (past) | [Q3297716](https://www.wikidata.org/wiki/Q3297716) |
| `metropolitan-stadium` | Metropolitan Stadium | Bloomington, United States | field only (past) | [Q1415967](https://www.wikidata.org/wiki/Q1415967) |
| `colt-stadium` | Colt Stadium | Houston, United States | field only (past) | [Q5149429](https://www.wikidata.org/wiki/Q5149429) |
| `robert-f-kennedy-memorial-stadium` | Robert F. Kennedy Memorial Stadium | Washington, United States | field only (past) | [Q153312](https://www.wikidata.org/wiki/Q153312) |
| `shea-stadium` | Shea Stadium | New York, United States | field only (past) | [Q1056326](https://www.wikidata.org/wiki/Q1056326) |
| `astrodome` | Astrodome | Houston, United States | field only (past) | [Q1025406](https://www.wikidata.org/wiki/Q1025406) |
| `atlanta-fulton-county-stadium` | Atlanta–Fulton County Stadium | Atlanta, United States | field only (past) | [Q641243](https://www.wikidata.org/wiki/Q641243) |
| `busch-memorial-stadium` | Busch Memorial Stadium | St. Louis, United States | field only (past) | [Q1017286](https://www.wikidata.org/wiki/Q1017286) |
| `oakland-coliseum` | Oakland Coliseum | Oakland, United States | field only (past) | [Q1147732](https://www.wikidata.org/wiki/Q1147732) |
| `sicks-stadium` | Sick's Stadium | Seattle, United States | field only (past) | [Q6127401](https://www.wikidata.org/wiki/Q6127401) |
| `jarry-park-stadium` | Jarry Park Stadium | Montreal, Canada | field only (past) | [Q3495641](https://www.wikidata.org/wiki/Q3495641) |
| `three-rivers-stadium` | Three Rivers Stadium | Pittsburgh, United States | field only (past) | [Q1189339](https://www.wikidata.org/wiki/Q1189339) |
| `riverfront-stadium` | Riverfront Stadium | Cincinnati, United States | field only (past) | [Q153824](https://www.wikidata.org/wiki/Q153824) |
| `veterans-stadium` | Veterans Stadium | Philadelphia, United States | field only (past) | [Q1545870](https://www.wikidata.org/wiki/Q1545870) |
| `arlington-stadium` | Arlington Stadium | Arlington, United States | field only (past) | [Q2861657](https://www.wikidata.org/wiki/Q2861657) |
| `exhibition-stadium` | Exhibition Stadium | Toronto, Canada | field only (past) | [Q1383747](https://www.wikidata.org/wiki/Q1383747) |
| `olympic-stadium-montreal` | Olympic Stadium | Montreal, Canada | in its building | [Q285467](https://www.wikidata.org/wiki/Q285467) |
| `metrodome` | Hubert H. Humphrey Metrodome | Minneapolis, United States | field only (past) | [Q1072186](https://www.wikidata.org/wiki/Q1072186) |
| `mile-high-stadium` | Mile High Stadium | Denver, United States | field only (past) | [Q1934586](https://www.wikidata.org/wiki/Q1934586) |
| `globe-life-park-in-arlington` | Choctaw Stadium | Arlington, United States | field only (past) | [Q1634492](https://www.wikidata.org/wiki/Q1634492) |
| `turner-field` | Turner Field | Atlanta, United States | field only (past) | [Q1150936](https://www.wikidata.org/wiki/Q1150936) |
| `tokyo-dome` | Tokyo Dome | Tokyo, Japan | in its building | [Q733748](https://www.wikidata.org/wiki/Q733748) |
| `hanshin-koshien-stadium` | Koshien Stadium | Nishinomiya, Japan | in its building | [Q959811](https://www.wikidata.org/wiki/Q959811) |
| `meiji-jingu-stadium` | Meiji Jingu Stadium | Tokyo, Japan | field only | [Q944559](https://www.wikidata.org/wiki/Q944559) |
| `yokohama-stadium` | Yokohama Stadium | Yokohama, Japan | field only | [Q1148681](https://www.wikidata.org/wiki/Q1148681) |
| `vantelin-dome-nagoya` | Vantelin Dome Nagoya | Nagoya, Japan | field only | [Q929524](https://www.wikidata.org/wiki/Q929524) |
| `mazda-stadium-hiroshima` | Mazda Stadium | Hiroshima, Japan | field only | [Q1038647](https://www.wikidata.org/wiki/Q1038647) |
| `es-con-field-hokkaido` | ES CON Field Hokkaido | Kitahiroshima, Japan | field only | [Q96395338](https://www.wikidata.org/wiki/Q96395338) |
| `rakuten-mobile-park-miyagi` | Rakuten Mobile Saikyo Park Miyagi | Sendai, Japan | field only | [Q489699](https://www.wikidata.org/wiki/Q489699) |
| `belluna-dome` | Belluna Dome | Tokorozawa, Japan | field only | [Q1194822](https://www.wikidata.org/wiki/Q1194822) |
| `zozo-marine-stadium` | ZOZO Marine Stadium | Chiba, Japan | field only | [Q486192](https://www.wikidata.org/wiki/Q486192) |
| `kyocera-dome-osaka` | Kyocera Dome Osaka | Osaka, Japan | field only | [Q128836](https://www.wikidata.org/wiki/Q128836) |
| `mizuho-paypay-dome-fukuoka` | Mizuho PayPay Dome Fukuoka | Fukuoka, Japan | field only | [Q1365961](https://www.wikidata.org/wiki/Q1365961) |
| `sapporo-dome` | Sapporo Dome | Sapporo, Japan | field only | [Q494860](https://www.wikidata.org/wiki/Q494860) |
| `hotto-motto-field-kobe` | Hotto Motto Field Kobe | Kobe, Japan | field only | [Q849183](https://www.wikidata.org/wiki/Q849183) |
| `hiroshima-municipal-stadium` | Hiroshima Municipal Stadium (original) | Hiroshima, Japan | field only (past) | [Q8012748](https://www.wikidata.org/wiki/Q8012748) |
| `korakuen-stadium` | Korakuen Stadium | Tokyo, Japan | field only (past) | [Q473519](https://www.wikidata.org/wiki/Q473519) |
| `osaka-stadium` | Osaka Stadium | Osaka, Japan | field only (past) | [Q861117](https://www.wikidata.org/wiki/Q861117) |
| `heiwadai-stadium` | Heiwadai Stadium | Fukuoka, Japan | field only (past) | [Q5365631](https://www.wikidata.org/wiki/Q5365631) |
| `kawasaki-stadium` | Kawasaki Stadium | Kawasaki, Japan | field only (past) | [Q6379828](https://www.wikidata.org/wiki/Q6379828) |
| `nagoya-stadium` | Nagoya Stadium | Nagoya, Japan | field only (past) | [Q5369853](https://www.wikidata.org/wiki/Q5369853) |

### Soccer (64)

| Key | Venue | City | Drawn | Wikidata |
| --- | --- | --- | --- | --- |
| `estadio-centenario` | Estadio Centenario | Montevideo, Uruguay | field only | [Q498245](https://www.wikidata.org/wiki/Q498245) |
| `stadio-nazionale-pnf` | Stadio Nazionale PNF | Rome, Italy | field only (past) | [Q642958](https://www.wikidata.org/wiki/Q642958) |
| `stade-yves-du-manoir` | Stade Yves-du-Manoir | Colombes, France | field only | [Q754502](https://www.wikidata.org/wiki/Q754502) |
| `maracana` | Maracanã Stadium | Rio de Janeiro, Brazil | field only | [Q155174](https://www.wikidata.org/wiki/Q155174) |
| `wankdorf` | Wankdorf Stadium | Bern, Switzerland | field only (past) | [Q676004](https://www.wikidata.org/wiki/Q676004) |
| `rasunda` | Råsunda Stadium | Solna, Sweden | field only (past) | [Q725623](https://www.wikidata.org/wiki/Q725623) |
| `estadio-nacional-santiago` | Julio Martínez Prádanos National Stadium | Santiago, Chile | field only | [Q594994](https://www.wikidata.org/wiki/Q594994) |
| `wembley-1923` | Wembley Stadium (1923) | London, United Kingdom | field only (past) | [Q43279](https://www.wikidata.org/wiki/Q43279) |
| `wembley` | Wembley Stadium | London, United Kingdom | field only | [Q128468](https://www.wikidata.org/wiki/Q128468) |
| `estadio-azteca` | Estadio Azteca | Mexico City, Mexico | field only | [Q320454](https://www.wikidata.org/wiki/Q320454) |
| `olympiastadion-munich` | Munich Olympic Stadium | Munich, Germany | field only | [Q131610](https://www.wikidata.org/wiki/Q131610) |
| `monumental` | Estadio Monumental | Buenos Aires, Argentina | field only | [Q276354](https://www.wikidata.org/wiki/Q276354) |
| `santiago-bernabeu` | Santiago Bernabéu Stadium | Madrid, Spain | field only | [Q164027](https://www.wikidata.org/wiki/Q164027) |
| `stadio-olimpico-rome` | Stadio Olimpico | Rome, Italy | field only | [Q159884](https://www.wikidata.org/wiki/Q159884) |
| `rose-bowl` | Rose Bowl | Pasadena, United States | field only | [Q582280](https://www.wikidata.org/wiki/Q582280) |
| `stade-de-france` | Stade de France | Saint-Denis, France | field only | [Q13205](https://www.wikidata.org/wiki/Q13205) |
| `nissan-stadium-yokohama` | Nissan Stadium | Yokohama, Japan | field only | [Q116601](https://www.wikidata.org/wiki/Q116601) |
| `olympiastadion-berlin` | Berlin Olympic Stadium | Berlin, Germany | field only | [Q151374](https://www.wikidata.org/wiki/Q151374) |
| `soccer-city` | FNB Stadium | Johannesburg, South Africa | field only | [Q163521](https://www.wikidata.org/wiki/Q163521) |
| `luzhniki` | Luzhniki Stadium | Moscow, Russia | field only | [Q202163](https://www.wikidata.org/wiki/Q202163) |
| `lusail` | Lusail Stadium | Lusail, Qatar | field only | [Q1186333](https://www.wikidata.org/wiki/Q1186333) |
| `metlife-stadium` | MetLife Stadium | East Rutherford, United States | in its building | [Q10862290](https://www.wikidata.org/wiki/Q10862290) |
| `att-stadium` | AT&T Stadium | Arlington, United States | field only | [Q838284](https://www.wikidata.org/wiki/Q838284) |
| `arrowhead-stadium` | Arrowhead Stadium | Kansas City, United States | field only | [Q544553](https://www.wikidata.org/wiki/Q544553) |
| `nrg-stadium` | Reliant Stadium | Houston, United States | field only | [Q1058864](https://www.wikidata.org/wiki/Q1058864) |
| `mercedes-benz-stadium` | Mercedes-Benz Stadium | Atlanta, United States | field only | [Q7007552](https://www.wikidata.org/wiki/Q7007552) |
| `hard-rock-stadium` | Hard Rock Stadium | Miami Gardens, United States | field only | [Q864339](https://www.wikidata.org/wiki/Q864339) |
| `sofi-stadium` | SoFi Stadium | Inglewood, United States | field only | [Q19520501](https://www.wikidata.org/wiki/Q19520501) |
| `levis-stadium` | Levi's Stadium | Santa Clara, United States | field only | [Q7419343](https://www.wikidata.org/wiki/Q7419343) |
| `lumen-field` | Lumen Field | Seattle, United States | in its building | [Q612736](https://www.wikidata.org/wiki/Q612736) |
| `gillette-stadium` | Gillette Stadium | Foxborough, United States | field only | [Q373355](https://www.wikidata.org/wiki/Q373355) |
| `lincoln-financial-field` | Lincoln Financial Field | Philadelphia, United States | field only | [Q1052370](https://www.wikidata.org/wiki/Q1052370) |
| `bmo-field` | BMO Field | Toronto, Canada | field only | [Q796351](https://www.wikidata.org/wiki/Q796351) |
| `bc-place` | BC Place | Vancouver, Canada | in its building | [Q612227](https://www.wikidata.org/wiki/Q612227) |
| `estadio-bbva` | Estadio BBVA | Guadalupe, Mexico | field only | [Q3058827](https://www.wikidata.org/wiki/Q3058827) |
| `estadio-akron` | Estadio Akron | Zapopan, Mexico | field only | [Q666183](https://www.wikidata.org/wiki/Q666183) |
| `tianhe-stadium` | Tianhe Stadium | Guangzhou, People's Republic of China | field only | [Q929126](https://www.wikidata.org/wiki/Q929126) |
| `dignity-health-sports-park` | Dignity Health Sports Park | Carson, United States | field only | [Q200684](https://www.wikidata.org/wiki/Q200684) |
| `hongkou-football-stadium` | Hongkou Football Stadium | Shanghai, People's Republic of China | field only | [Q201773](https://www.wikidata.org/wiki/Q201773) |
| `waldstadion-frankfurt` | Deutsche Bank Park | Frankfurt, Germany | field only | [Q157273](https://www.wikidata.org/wiki/Q157273) |
| `groupama-stadium` | Groupama Stadium | Décines-Charpieu, France | field only | [Q8507](https://www.wikidata.org/wiki/Q8507) |
| `stadium-australia` | Stadium Australia | Sydney, Australia | field only | [Q295886](https://www.wikidata.org/wiki/Q295886) |
| `camp-nou` | Camp Nou | Barcelona, Spain | field only | [Q159848](https://www.wikidata.org/wiki/Q159848) |
| `san-siro` | San Siro | Milan, Italy | field only | [Q133566](https://www.wikidata.org/wiki/Q133566) |
| `old-trafford` | Old Trafford | Manchester, United Kingdom | field only | [Q83457](https://www.wikidata.org/wiki/Q83457) |
| `anfield` | Anfield | Liverpool, United Kingdom | field only | [Q45671](https://www.wikidata.org/wiki/Q45671) |
| `signal-iduna-park` | Signal Iduna Park | Dortmund, Germany | field only | [Q150928](https://www.wikidata.org/wiki/Q150928) |
| `allianz-arena` | Allianz Arena | Munich, Germany | field only | [Q127429](https://www.wikidata.org/wiki/Q127429) |
| `la-bombonera` | La Bombonera | Buenos Aires, Argentina | field only | [Q499855](https://www.wikidata.org/wiki/Q499855) |
| `hampden-park` | Hampden Park | Glasgow, United Kingdom | field only | [Q193651](https://www.wikidata.org/wiki/Q193651) |
| `celtic-park` | Celtic Park | Glasgow, United Kingdom | field only | [Q216037](https://www.wikidata.org/wiki/Q216037) |
| `estadio-da-luz` | Estádio da Luz | Lisbon, Portugal | field only | [Q7875112](https://www.wikidata.org/wiki/Q7875112) |
| `parc-des-princes` | Parc des Princes | Paris, France | field only | [Q193431](https://www.wikidata.org/wiki/Q193431) |
| `saitama-stadium-2002` | Saitama Stadium 2002 | Saitama, Japan | field only | [Q482446](https://www.wikidata.org/wiki/Q482446) |
| `seoul-world-cup-stadium` | Seoul World Cup Stadium | Seoul, South Korea | field only | [Q175477](https://www.wikidata.org/wiki/Q175477) |
| `emirates-stadium` | Emirates Stadium | London, United Kingdom | field only | [Q163995](https://www.wikidata.org/wiki/Q163995) |
| `etihad-stadium` | Etihad Stadium | Manchester, United Kingdom | field only | [Q48159](https://www.wikidata.org/wiki/Q48159) |
| `stamford-bridge` | Stamford Bridge | London, United Kingdom | field only | [Q171458](https://www.wikidata.org/wiki/Q171458) |
| `tottenham-hotspur-stadium` | Tottenham Hotspur Stadium | London, United Kingdom | field only | [Q55074091](https://www.wikidata.org/wiki/Q55074091) |
| `ibrox` | Ibrox Stadium | Glasgow, United Kingdom | field only | [Q208709](https://www.wikidata.org/wiki/Q208709) |
| `johan-cruyff-arena` | Johan Cruyff Arena | Amsterdam, Kingdom of the Netherlands | field only | [Q207109](https://www.wikidata.org/wiki/Q207109) |
| `allianz-stadium-turin` | Allianz Stadium | Turin, Italy | field only | [Q62149](https://www.wikidata.org/wiki/Q62149) |
| `japan-national-stadium` | Japan National Stadium | Tokyo, Japan | field only | [Q14862239](https://www.wikidata.org/wiki/Q14862239) |
| `kashima-soccer-stadium` | Kashima Soccer Stadium | Kashima, Japan | field only | [Q494769](https://www.wikidata.org/wiki/Q494769) |

### Budō and sumo (5)

| Key | Venue | City | Drawn | Wikidata |
| --- | --- | --- | --- | --- |
| `kodokan` | Kodokan | Tokyo, Japan | field only | [Q1165384](https://www.wikidata.org/wiki/Q1165384) |
| `nippon-budokan` | Nippon Budokan | Tokyo, Japan | field only | [Q386246](https://www.wikidata.org/wiki/Q386246) |
| `ryogoku-kokugikan` | Ryōgoku Kokugikan | Tokyo, Japan | field only | [Q176821](https://www.wikidata.org/wiki/Q176821) |
| `kyu-butokuden` | Kyū Butokuden | Kyoto, Japan | field only | [Q1017987](https://www.wikidata.org/wiki/Q1017987) |
| `budokwai` | The Budokwai | London, United Kingdom | field only | [Q3646473](https://www.wikidata.org/wiki/Q3646473) |

### Ice hockey (90)

| Key | Venue | City | Drawn | Wikidata |
| --- | --- | --- | --- | --- |
| `amerant-bank-arena` | Amerant Bank Arena | Sunrise, United States | in its building | [Q795526](https://www.wikidata.org/wiki/Q795526) |
| `american-airlines-center` | American Airlines Center | Dallas, United States | in its building | [Q463345](https://www.wikidata.org/wiki/Q463345) |
| `ball-arena` | Ball Arena | Denver, United States | in its building | [Q795470](https://www.wikidata.org/wiki/Q795470) |
| `bell-centre` | Bell Centre | Montreal, Canada | in its building | [Q522282](https://www.wikidata.org/wiki/Q522282) |
| `benchmark-international-arena` | Benchmark International Arena | Tampa, United States | in its building | [Q940199](https://www.wikidata.org/wiki/Q940199) |
| `bridgestone-arena` | Bridgestone Arena | Nashville, United States | in its building | [Q302869](https://www.wikidata.org/wiki/Q302869) |
| `canada-life-centre` | Canada Life Centre | Winnipeg, Canada | in its building | [Q656928](https://www.wikidata.org/wiki/Q656928) |
| `canadian-tire-centre` | Canadian Tire Centre | Ottawa, Canada | in its building | [Q1327290](https://www.wikidata.org/wiki/Q1327290) |
| `capital-one-arena` | Capital One Arena | Washington, United States | in its building | [Q223240](https://www.wikidata.org/wiki/Q223240) |
| `climate-pledge-arena` | Climate Pledge Arena | Seattle, United States | in its building | [Q977529](https://www.wikidata.org/wiki/Q977529) |
| `crypto-com-arena` | Crypto.com Arena | Los Angeles, United States | in its building | [Q186080](https://www.wikidata.org/wiki/Q186080) |
| `delta-center` | Delta Center | Salt Lake City, United States | in its building | [Q82294](https://www.wikidata.org/wiki/Q82294) |
| `enterprise-center` | Enterprise Center | St. Louis, United States | in its building | [Q1067700](https://www.wikidata.org/wiki/Q1067700) |
| `grand-casino-arena` | Grand Casino Arena | Saint Paul, United States | in its building | [Q1421388](https://www.wikidata.org/wiki/Q1421388) |
| `honda-center` | Honda Center | Anaheim, United States | in its building | [Q774138](https://www.wikidata.org/wiki/Q774138) |
| `keybank-center` | KeyBank Center | Buffalo, United States | in its building | [Q1110789](https://www.wikidata.org/wiki/Q1110789) |
| `lenovo-center` | Lenovo Center | Raleigh, United States | in its building | [Q39177](https://www.wikidata.org/wiki/Q39177) |
| `little-caesars-arena` | Little Caesars Arena | Detroit, United States | in its building | [Q18154984](https://www.wikidata.org/wiki/Q18154984) |
| `madison-square-garden` | Madison Square Garden | New York, United States | in its building | [Q186125](https://www.wikidata.org/wiki/Q186125) |
| `nationwide-arena` | Nationwide Arena | Columbus, United States | in its building | [Q166503](https://www.wikidata.org/wiki/Q166503) |
| `ppg-paints-arena` | PPG Paints Arena | Pittsburgh, United States | in its building | [Q595460](https://www.wikidata.org/wiki/Q595460) |
| `prudential-center` | Prudential Center | Newark, United States | in its building | [Q849027](https://www.wikidata.org/wiki/Q849027) |
| `rogers-arena` | Rogers Arena | Vancouver, Canada | in its building | [Q517318](https://www.wikidata.org/wiki/Q517318) |
| `rogers-place` | Rogers Place | Edmonton, Canada | in its building | [Q5339036](https://www.wikidata.org/wiki/Q5339036) |
| `sap-center` | SAP Center | San Jose, United States | in its building | [Q261863](https://www.wikidata.org/wiki/Q261863) |
| `scotiabank-arena` | Scotiabank Arena | Toronto, Canada | in its building | [Q406972](https://www.wikidata.org/wiki/Q406972) |
| `scotiabank-saddledome` | Scotiabank Saddledome | Calgary, Canada | in its building | [Q1140083](https://www.wikidata.org/wiki/Q1140083) |
| `t-mobile-arena` | T-Mobile Arena | Las Vegas, United States | in its building | [Q3338973](https://www.wikidata.org/wiki/Q3338973) |
| `td-garden` | TD Garden | Boston, United States | in its building | [Q432105](https://www.wikidata.org/wiki/Q432105) |
| `ubs-arena` | UBS Arena | Elmont, United States | in its building | [Q48742753](https://www.wikidata.org/wiki/Q48742753) |
| `united-center` | United Center | Chicago, United States | in its building | [Q639975](https://www.wikidata.org/wiki/Q639975) |
| `xfinity-mobile-arena` | Xfinity Mobile Arena | Philadelphia, United States | in its building | [Q818735](https://www.wikidata.org/wiki/Q818735) |
| `barclays-center` | Barclays Center | Brooklyn, United States | in its building | [Q807966](https://www.wikidata.org/wiki/Q807966) |
| `mortgage-matchup-center` | Mortgage Matchup Center | Phoenix, United States | field only | [Q1538690](https://www.wikidata.org/wiki/Q1538690) |
| `pacific-coliseum` | Pacific Coliseum | Vancouver, Canada | field only | [Q832644](https://www.wikidata.org/wiki/Q832644) |
| `state-farm-arena` | State Farm Arena | Atlanta, United States | field only | [Q1123297](https://www.wikidata.org/wiki/Q1123297) |
| `coca-cola-coliseum` | Coca-Cola Coliseum | Toronto, Canada | field only | [Q541481](https://www.wikidata.org/wiki/Q541481) |
| `place-bell` | Place Bell | Laval, Canada | field only | [Q3389723](https://www.wikidata.org/wiki/Q3389723) |
| `the-arena-ottawa` | The Arena (Ottawa) | Ottawa, Canada | field only (past) | [Q7714219](https://www.wikidata.org/wiki/Q7714219) |
| `barton-street-arena` | Barton Street Arena | Hamilton, Canada | field only (past) | [Q4865692](https://www.wikidata.org/wiki/Q4865692) |
| `big-e-coliseum` | The Big E Coliseum | West Springfield, United States | field only (past) | [Q7717607](https://www.wikidata.org/wiki/Q7717607) |
| `boston-garden` | Boston Garden | Boston, United States | field only (past) | [Q894567](https://www.wikidata.org/wiki/Q894567) |
| `buffalo-memorial-auditorium` | Buffalo Memorial Auditorium | Buffalo, United States | field only (past) | [Q2927640](https://www.wikidata.org/wiki/Q2927640) |
| `capital-centre` | Capital Centre | Landover, United States | field only (past) | [Q3656844](https://www.wikidata.org/wiki/Q3656844) |
| `chicago-coliseum` | Chicago Coliseum | Chicago, United States | field only (past) | [Q2370898](https://www.wikidata.org/wiki/Q2370898) |
| `chicago-stadium` | Chicago Stadium | Chicago, United States | field only (past) | [Q2703852](https://www.wikidata.org/wiki/Q2703852) |
| `civic-arena` | Civic Arena | Pittsburgh, United States | field only (past) | [Q1237181](https://www.wikidata.org/wiki/Q1237181) |
| `colisee-de-quebec` | Colisée de Québec | Quebec City, Canada | field only (past) | [Q600226](https://www.wikidata.org/wiki/Q600226) |
| `cow-palace` | Cow Palace | Daly City, United States | field only (past) | [Q604015](https://www.wikidata.org/wiki/Q604015) |
| `desert-diamond-arena` | Desert Diamond Arena | Glendale, United States | field only (past) | [Q1421377](https://www.wikidata.org/wiki/Q1421377) |
| `detroit-olympia` | Detroit Olympia | Detroit, United States | field only (past) | [Q1201545](https://www.wikidata.org/wiki/Q1201545) |
| `duquesne-gardens` | Duquesne Gardens | Pittsburgh, United States | field only (past) | [Q3041488](https://www.wikidata.org/wiki/Q3041488) |
| `expo-hall` | Expo Hall | Tampa, United States | field only (past) | [Q1384652](https://www.wikidata.org/wiki/Q1384652) |
| `first-horizon-coliseum` | First Horizon Coliseum | Greensboro, United States | field only (past) | [Q133089582](https://www.wikidata.org/wiki/Q133089582) |
| `joe-louis-arena` | Joe Louis Arena | Detroit, United States | field only (past) | [Q168579](https://www.wikidata.org/wiki/Q168579) |
| `jubilee-arena` | Jubilee Arena | Montreal, Canada | field only (past) | [Q599978](https://www.wikidata.org/wiki/Q599978) |
| `kia-forum` | Kia Forum | Inglewood, United States | field only (past) | [Q639129](https://www.wikidata.org/wiki/Q639129) |
| `los-angeles-memorial-sports-arena` | Los Angeles Memorial Sports Arena | Los Angeles, United States | field only (past) | [Q1571403](https://www.wikidata.org/wiki/Q1571403) |
| `madison-square-garden-1925` | Madison Square Garden (1925) | New York, United States | field only (past) | [Q6728098](https://www.wikidata.org/wiki/Q6728098) |
| `maple-leaf-gardens` | Maple Leaf Gardens | Toronto, Canada | field only (past) | [Q1814534](https://www.wikidata.org/wiki/Q1814534) |
| `massmutual-center` | MassMutual Center | Springfield, United States | field only (past) | [Q6783965](https://www.wikidata.org/wiki/Q6783965) |
| `matthews-arena` | Matthews Arena | Boston, United States | field only (past) | [Q919959](https://www.wikidata.org/wiki/Q919959) |
| `mcnichols-sports-arena` | McNichols Sports Arena | Denver, United States | field only (past) | [Q2081796](https://www.wikidata.org/wiki/Q2081796) |
| `meadowlands-arena` | Meadowlands Arena | East Rutherford, United States | field only (past) | [Q538218](https://www.wikidata.org/wiki/Q538218) |
| `met-center` | Met Center | Bloomington, United States | field only (past) | [Q3307175](https://www.wikidata.org/wiki/Q3307175) |
| `miami-arena` | Miami Arena | Miami, United States | field only (past) | [Q1857422](https://www.wikidata.org/wiki/Q1857422) |
| `montreal-arena` | Montreal Arena | Westmount, Canada | field only (past) | [Q849938](https://www.wikidata.org/wiki/Q849938) |
| `montreal-forum` | Montreal Forum | Montreal, Canada | field only (past) | [Q367272](https://www.wikidata.org/wiki/Q367272) |
| `mount-royal-arena` | Mount Royal Arena | Montreal, Canada | field only (past) | [Q544559](https://www.wikidata.org/wiki/Q544559) |
| `mullett-arena` | Mullett Arena | Tempe, United States | field only (past) | [Q111169373](https://www.wikidata.org/wiki/Q111169373) |
| `mutual-street-arena` | Mutual Street Arena | Toronto, Canada | field only (past) | [Q3331013](https://www.wikidata.org/wiki/Q3331013) |
| `nassau-coliseum` | Nassau Coliseum | Uniondale, United States | field only (past) | [Q1048921](https://www.wikidata.org/wiki/Q1048921) |
| `northlands-coliseum` | Northlands Coliseum | Edmonton, Canada | field only (past) | [Q1139489](https://www.wikidata.org/wiki/Q1139489) |
| `oakland-arena` | Oakland Arena | Oakland, United States | field only (past) | [Q1139021](https://www.wikidata.org/wiki/Q1139021) |
| `omni-coliseum` | Omni Coliseum | Atlanta, United States | field only (past) | [Q1970067](https://www.wikidata.org/wiki/Q1970067) |
| `ottawa-auditorium` | Ottawa Auditorium | Ottawa, Canada | field only (past) | [Q7109141](https://www.wikidata.org/wiki/Q7109141) |
| `peoplesbank-arena` | PeoplesBank Arena | Hartford, United States | field only (past) | [Q1783634](https://www.wikidata.org/wiki/Q1783634) |
| `philadelphia-arena` | Philadelphia Arena | Philadelphia, United States | field only (past) | [Q3378842](https://www.wikidata.org/wiki/Q3378842) |
| `quebec-arena` | Quebec Arena | Quebec City, Canada | field only (past) | [Q7269749](https://www.wikidata.org/wiki/Q7269749) |
| `reunion-arena` | Reunion Arena | Dallas, United States | field only (past) | [Q1859962](https://www.wikidata.org/wiki/Q1859962) |
| `richfield-coliseum` | Richfield Coliseum | Richfield, United States | field only (past) | [Q2982682](https://www.wikidata.org/wiki/Q2982682) |
| `st-louis-arena` | St. Louis Arena | St. Louis, United States | field only (past) | [Q3495282](https://www.wikidata.org/wiki/Q3495282) |
| `spectrum` | Spectrum | Philadelphia, United States | field only (past) | [Q2085822](https://www.wikidata.org/wiki/Q2085822) |
| `stampede-corral` | Stampede Corral | Calgary, Canada | field only (past) | [Q1147148](https://www.wikidata.org/wiki/Q1147148) |
| `td-place-arena` | TD Place Arena | Ottawa, Canada | field only (past) | [Q1143666](https://www.wikidata.org/wiki/Q1143666) |
| `windsor-arena` | Windsor Arena | Windsor, Canada | field only (past) | [Q8024565](https://www.wikidata.org/wiki/Q8024565) |
| `winnipeg-arena` | Winnipeg Arena | Winnipeg, Canada | field only (past) | [Q1165024](https://www.wikidata.org/wiki/Q1165024) |
| `total-mortgage-arena` | Total Mortgage Arena | Bridgeport, United States | field only (past) | [Q7978892](https://www.wikidata.org/wiki/Q7978892) |
| `tsongas-center` | Tsongas Center | Lowell, United States | field only (past) | [Q2076478](https://www.wikidata.org/wiki/Q2076478) |
| `verdun-auditorium` | Verdun Auditorium | Montreal, Canada | field only (past) | [Q2870805](https://www.wikidata.org/wiki/Q2870805) |

### Basketball (77)

| Key | Venue | City | Drawn | Wikidata |
| --- | --- | --- | --- | --- |
| `chase-center` | Chase Center | San Francisco, United States | field only | [Q15262098](https://www.wikidata.org/wiki/Q15262098) |
| `fedexforum` | FedExForum | Memphis, United States | field only | [Q641212](https://www.wikidata.org/wiki/Q641212) |
| `fiserv-forum` | Fiserv Forum | Milwaukee, United States | field only | [Q20372160](https://www.wikidata.org/wiki/Q20372160) |
| `frost-bank-center` | Frost Bank Center | San Antonio, United States | field only | [Q298573](https://www.wikidata.org/wiki/Q298573) |
| `gainbridge-fieldhouse` | Gainbridge Fieldhouse | Indianapolis, United States | field only | [Q545007](https://www.wikidata.org/wiki/Q545007) |
| `golden-1-center` | Golden 1 Center | Sacramento, United States | field only | [Q7011384](https://www.wikidata.org/wiki/Q7011384) |
| `intuit-dome` | Intuit Dome | Inglewood, United States | field only | [Q54958436](https://www.wikidata.org/wiki/Q54958436) |
| `kaseya-center` | Kaseya Center | Miami, United States | field only | [Q420129](https://www.wikidata.org/wiki/Q420129) |
| `kia-center` | Kia Center | Orlando, United States | field only | [Q481795](https://www.wikidata.org/wiki/Q481795) |
| `moda-center` | Moda Center | Portland, United States | field only | [Q1347442](https://www.wikidata.org/wiki/Q1347442) |
| `paycom-center` | Paycom Center | Oklahoma City, United States | field only | [Q665434](https://www.wikidata.org/wiki/Q665434) |
| `rocket-arena` | Rocket Arena | Cleveland, United States | field only | [Q387157](https://www.wikidata.org/wiki/Q387157) |
| `smoothie-king-center` | Smoothie King Center | New Orleans, United States | field only | [Q1515840](https://www.wikidata.org/wiki/Q1515840) |
| `spectrum-center` | Spectrum Center | Charlotte, United States | field only | [Q983870](https://www.wikidata.org/wiki/Q983870) |
| `target-center` | Target Center | Minneapolis, United States | field only | [Q282675](https://www.wikidata.org/wiki/Q282675) |
| `toyota-center` | Toyota Center | Houston, United States | field only | [Q1166157](https://www.wikidata.org/wiki/Q1166157) |
| `carefirst-arena` | CareFirst Arena | Washington, United States | field only | [Q30488454](https://www.wikidata.org/wiki/Q30488454) |
| `michelob-ultra-arena` | Michelob Ultra Arena | Las Vegas, United States | field only | [Q1888848](https://www.wikidata.org/wiki/Q1888848) |
| `wintrust-arena` | Wintrust Arena | Chicago, United States | field only | [Q16991688](https://www.wikidata.org/wiki/Q16991688) |
| `kemper-arena` | Kemper Arena | Kansas City, United States | field only (past) | [Q1489399](https://www.wikidata.org/wiki/Q1489399) |
| `baltimore-civic-center` | Baltimore Civic Center | Baltimore, United States | field only (past) | [Q2739940](https://www.wikidata.org/wiki/Q2739940) |
| `69th-regiment-armory` | 69th Regiment Armory | New York, United States | field only (past) | [Q2781236](https://www.wikidata.org/wiki/Q2781236) |
| `allen-county-war-memorial-coliseum` | Allen County War Memorial Coliseum | Fort Wayne, United States | field only (past) | [Q1144284](https://www.wikidata.org/wiki/Q1144284) |
| `orlando-arena` | Orlando Arena | Orlando, United States | field only (past) | [Q481794](https://www.wikidata.org/wiki/Q481794) |
| `arco-arena` | ARCO Arena | Sacramento, United States | field only (past) | [Q93831](https://www.wikidata.org/wiki/Q93831) |
| `arco-arena-1985` | ARCO Arena I | Sacramento, United States | field only (past) | [Q4653610](https://www.wikidata.org/wiki/Q4653610) |
| `arizona-veterans-memorial-coliseum` | Arizona Veterans Memorial Coliseum | Phoenix, United States | field only (past) | [Q670890](https://www.wikidata.org/wiki/Q670890) |
| `baltimore-coliseum` | Baltimore Coliseum | Baltimore, United States | field only (past) | [Q4852825](https://www.wikidata.org/wiki/Q4852825) |
| `bill-graham-civic-auditorium` | Bill Graham Civic Auditorium | San Francisco, United States | field only (past) | [Q4909197](https://www.wikidata.org/wiki/Q4909197) |
| `rochester-community-war-memorial` | Rochester Community War Memorial | Rochester, United States | field only (past) | [Q885674](https://www.wikidata.org/wiki/Q885674) |
| `bradley-center` | Bradley Center | Milwaukee, United States | field only (past) | [Q737976](https://www.wikidata.org/wiki/Q737976) |
| `calihan-hall` | Calihan Hall | Detroit, United States | field only (past) | [Q5021351](https://www.wikidata.org/wiki/Q5021351) |
| `charlotte-coliseum` | Charlotte Coliseum | Charlotte, United States | field only (past) | [Q632138](https://www.wikidata.org/wiki/Q632138) |
| `cincinnati-gardens` | Cincinnati Gardens | Cincinnati, United States | field only (past) | [Q1092220](https://www.wikidata.org/wiki/Q1092220) |
| `cleveland-arena` | Cleveland Arena | Cleveland, United States | field only (past) | [Q5132059](https://www.wikidata.org/wiki/Q5132059) |
| `cobo-arena` | Cobo Arena | Detroit, United States | field only (past) | [Q1104711](https://www.wikidata.org/wiki/Q1104711) |
| `the-summit` | The Summit | Houston, United States | field only (past) | [Q2435324](https://www.wikidata.org/wiki/Q2435324) |
| `denver-auditorium-arena` | Denver Auditorium Arena | Denver, United States | field only (past) | [Q5259672](https://www.wikidata.org/wiki/Q5259672) |
| `edgerton-park-arena` | Edgerton Park Arena | Rochester, United States | field only (past) | [Q5337822](https://www.wikidata.org/wiki/Q5337822) |
| `hofheinz-pavilion` | Hofheinz Pavilion | Houston, United States | field only (past) | [Q5876764](https://www.wikidata.org/wiki/Q5876764) |
| `hemisfair-arena` | HemisFair Arena | San Antonio, United States | field only (past) | [Q1145169](https://www.wikidata.org/wiki/Q1145169) |
| `hinkle-fieldhouse` | Hinkle Fieldhouse | Indianapolis, United States | field only (past) | [Q3785713](https://www.wikidata.org/wiki/Q3785713) |
| `international-amphitheatre` | International Amphitheatre | Chicago, United States | field only (past) | [Q1666325](https://www.wikidata.org/wiki/Q1666325) |
| `rutgers-athletic-center` | Rutgers Athletic Center | Piscataway, United States | field only (past) | [Q6686804](https://www.wikidata.org/wiki/Q6686804) |
| `kiel-auditorium` | Kiel Auditorium | St. Louis, United States | field only (past) | [Q3024991](https://www.wikidata.org/wiki/Q3024991) |
| `loyola-field-house` | Loyola Field House | New Orleans, United States | field only (past) | [Q6694553](https://www.wikidata.org/wiki/Q6694553) |
| `market-square-arena` | Market Square Arena | Indianapolis, United States | field only (past) | [Q3294309](https://www.wikidata.org/wiki/Q3294309) |
| `alexander-memorial-coliseum` | Alexander Memorial Coliseum | Atlanta, United States | field only (past) | [Q1492102](https://www.wikidata.org/wiki/Q1492102) |
| `memphis-pyramid` | Memphis Pyramid | Memphis, United States | field only (past) | [Q2226897](https://www.wikidata.org/wiki/Q2226897) |
| `minneapolis-armory` | Minneapolis Armory | Minneapolis, United States | field only (past) | [Q745327](https://www.wikidata.org/wiki/Q745327) |
| `minneapolis-auditorium` | Minneapolis Auditorium | Minneapolis, United States | field only (past) | [Q125537911](https://www.wikidata.org/wiki/Q125537911) |
| `moody-coliseum` | Moody Coliseum | University Park, United States | field only (past) | [Q9035055](https://www.wikidata.org/wiki/Q9035055) |
| `municipal-auditorium-kansas-city` | Municipal Auditorium (Kansas City) | Kansas City, United States | field only (past) | [Q14704450](https://www.wikidata.org/wiki/Q14704450) |
| `municipal-auditorium-new-orleans` | Municipal Auditorium (New Orleans) | New Orleans, United States | field only (past) | [Q6936134](https://www.wikidata.org/wiki/Q6936134) |
| `omaha-civic-auditorium` | Omaha Civic Auditorium | Omaha, United States | field only (past) | [Q7089414](https://www.wikidata.org/wiki/Q7089414) |
| `palace-of-auburn-hills` | The Palace of Auburn Hills | Auburn Hills, United States | field only (past) | [Q1327633](https://www.wikidata.org/wiki/Q1327633) |
| `pechanga-arena` | Pechanga Arena | San Diego, United States | field only (past) | [Q3106621](https://www.wikidata.org/wiki/Q3106621) |
| `philadelphia-convention-hall-and-civic-center` | Philadelphia Convention Hall and Civic Center | Philadelphia, United States | field only (past) | [Q3378843](https://www.wikidata.org/wiki/Q3378843) |
| `salt-palace` | Salt Palace | Salt Lake City, United States | field only (past) | [Q17030210](https://www.wikidata.org/wiki/Q17030210) |
| `sheboygan-armory` | Sheboygan Municipal Auditorium and Armory | Sheboygan, United States | field only (past) | [Q7492276](https://www.wikidata.org/wiki/Q7492276) |
| `war-memorial-gymnasium` | War Memorial Gymnasium | San Francisco, United States | field only (past) | [Q781955](https://www.wikidata.org/wiki/Q781955) |
| `tacoma-dome` | Tacoma Dome | Tacoma, United States | field only (past) | [Q1570942](https://www.wikidata.org/wiki/Q1570942) |
| `the-hippodrome` | The Hippodrome | Waterloo, United States | field only (past) | [Q6801072](https://www.wikidata.org/wiki/Q6801072) |
| `toyota-coliseum` | Toyota Coliseum | Syracuse, United States | field only (past) | [Q7603208](https://www.wikidata.org/wiki/Q7603208) |
| `uline-arena` | Uline Arena | Washington, United States | field only (past) | [Q7971729](https://www.wikidata.org/wiki/Q7971729) |
| `onondaga-county-war-memorial` | Onondaga County War Memorial | Syracuse, United States | field only (past) | [Q3566224](https://www.wikidata.org/wiki/Q3566224) |
| `milwaukee-arena` | Milwaukee Arena | Milwaukee, United States | field only (past) | [Q1142808](https://www.wikidata.org/wiki/Q1142808) |
| `veterans-memorial-coliseum` | Veterans Memorial Coliseum | Portland, United States | field only (past) | [Q549437](https://www.wikidata.org/wiki/Q549437) |
| `wharton-field-house` | Wharton Field House | Moline, United States | field only (past) | [Q14688239](https://www.wikidata.org/wiki/Q14688239) |
| `allstate-arena` | Allstate Arena | Rosemont, United States | field only (past) | [Q1336027](https://www.wikidata.org/wiki/Q1336027) |
| `bok-center` | BOK Center | Tulsa, United States | field only (past) | [Q2877349](https://www.wikidata.org/wiki/Q2877349) |
| `college-park-center` | College Park Center | Arlington, United States | field only (past) | [Q2982974](https://www.wikidata.org/wiki/Q2982974) |
| `credit-union-1-arena` | Credit Union 1 Arena | Chicago, United States | field only (past) | [Q3547208](https://www.wikidata.org/wiki/Q3547208) |
| `mohegan-sun-arena` | Mohegan Sun Arena | Uncasville, United States | field only (past) | [Q2056942](https://www.wikidata.org/wiki/Q2056942) |
| `reliant-arena` | Reliant Arena | Houston, United States | field only (past) | [Q7311038](https://www.wikidata.org/wiki/Q7311038) |
| `westchester-county-center` | Westchester County Center | White Plains, United States | field only (past) | [Q7987239](https://www.wikidata.org/wiki/Q7987239) |
| `rhode-island-auditorium` | Rhode Island Auditorium | Providence, United States | field only (past) | [Q7320897](https://www.wikidata.org/wiki/Q7320897) |

### Boxing (1)

| Key | Venue | City | Drawn | Wikidata |
| --- | --- | --- | --- | --- |
| `korakuen-hall` | Korakuen Hall | Tokyo, Japan | in its building | [Q4389857](https://www.wikidata.org/wiki/Q4389857) |
<!-- /catalogue-supported -->

## Working on

The four Grand Slams' show courts and Tokyo's, ticket KYOGIJO-STADIUMS-22: drawn in their buildings when they are done.

<!-- catalogue-working-on -->
| Key | Venue | City | Sport | Ticket | Wikidata |
| --- | --- | --- | --- | --- | --- |
| `arthur-ashe-stadium` | Arthur Ashe Stadium | New York City, United States | Tennis | KYOGIJO-STADIUMS-22 | [Q609551](https://www.wikidata.org/wiki/Q609551) |
| `louis-armstrong-stadium` | Louis Armstrong Stadium | New York City, United States | Tennis | KYOGIJO-STADIUMS-22 | [Q47487977](https://www.wikidata.org/wiki/Q47487977) |
| `rod-laver-arena` | Rod Laver Arena | Melbourne, Australia | Tennis | KYOGIJO-STADIUMS-22 | [Q222878](https://www.wikidata.org/wiki/Q222878) |
| `margaret-court-arena` | Margaret Court Arena | Melbourne, Australia | Tennis | KYOGIJO-STADIUMS-22 | [Q732679](https://www.wikidata.org/wiki/Q732679) |
| `john-cain-arena` | John Cain Arena | Melbourne, Australia | Tennis | KYOGIJO-STADIUMS-22 | [Q1245311](https://www.wikidata.org/wiki/Q1245311) |
| `court-philippe-chatrier` | Court Philippe-Chatrier | Paris, France | Tennis | KYOGIJO-STADIUMS-22 | [Q3026397](https://www.wikidata.org/wiki/Q3026397) |
| `court-suzanne-lenglen` | Court Suzanne-Lenglen | Paris, France | Tennis | KYOGIJO-STADIUMS-22 | [Q547549](https://www.wikidata.org/wiki/Q547549) |
| `centre-court` | Centre Court | London, United Kingdom | Tennis | KYOGIJO-STADIUMS-22 | [Q2603183](https://www.wikidata.org/wiki/Q2603183) |
| `no-1-court` | No. 1 Court | London, United Kingdom | Tennis | KYOGIJO-STADIUMS-22 | [Q2306600](https://www.wikidata.org/wiki/Q2306600) |
| `ariake-coliseum` | Ariake Coliseum | Tokyo, Japan | Tennis | KYOGIJO-STADIUMS-22 | [Q3299452](https://www.wikidata.org/wiki/Q3299452) |
<!-- /catalogue-working-on -->

## Wanted

By group, in order of how famous each venue is. "The building's outline" is a venue the package already draws as a field; "the venue" is one it does not draw yet.

<!-- catalogue-wanted -->
### World soccer (10)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `camp-nou` | Camp Nou | Barcelona, Spain | Soccer | the building's outline |  | [Q159848](https://www.wikidata.org/wiki/Q159848) |
| 2 | `santiago-bernabeu` | Santiago Bernabéu Stadium | Madrid, Spain | Soccer | the building's outline |  | [Q164027](https://www.wikidata.org/wiki/Q164027) |
| 3 | `maracana` | Maracanã Stadium | Rio de Janeiro, Brazil | Soccer | the building's outline |  | [Q155174](https://www.wikidata.org/wiki/Q155174) |
| 4 | `wembley` | Wembley Stadium | London, United Kingdom | Soccer | the building's outline |  | [Q128468](https://www.wikidata.org/wiki/Q128468) |
| 5 | `old-trafford` | Old Trafford | Manchester, United Kingdom | Soccer | the building's outline |  | [Q83457](https://www.wikidata.org/wiki/Q83457) |
| 6 | `san-siro` | San Siro | Milan, Italy | Soccer | the building's outline |  | [Q133566](https://www.wikidata.org/wiki/Q133566) |
| 7 | `anfield` | Anfield | Liverpool, United Kingdom | Soccer | the building's outline |  | [Q45671](https://www.wikidata.org/wiki/Q45671) |
| 8 | `estadio-azteca` | Estadio Azteca | Mexico City, Mexico | Soccer | the building's outline |  | [Q320454](https://www.wikidata.org/wiki/Q320454) |
| 9 | `signal-iduna-park` | Signal Iduna Park | Dortmund, Germany | Soccer | the building's outline |  | [Q150928](https://www.wikidata.org/wiki/Q150928) |
| 10 | `la-bombonera` | La Bombonera | Buenos Aires, Argentina | Soccer | the building's outline |  | [Q499855](https://www.wikidata.org/wiki/Q499855) |

### Cricket grounds (10)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `lords` | Lord's | London, United Kingdom | Cricket | the venue | 31,100 | [Q331613](https://www.wikidata.org/wiki/Q331613) |
| 2 | `melbourne-cricket-ground` | Melbourne Cricket Ground | Melbourne, Australia | Cricket, Australian football | the venue | 100,024 | [Q330136](https://www.wikidata.org/wiki/Q330136) |
| 3 | `eden-gardens` | Eden Gardens | Kolkata, India | Cricket | the venue | 68,000 | [Q2035004](https://www.wikidata.org/wiki/Q2035004) |
| 4 | `narendra-modi-stadium` | Narendra Modi Stadium | India | Cricket | the venue | 132,000 | [Q3531421](https://www.wikidata.org/wiki/Q3531421) |
| 5 | `the-oval` | The Oval | London, United Kingdom | Cricket | the venue | 23,500 | [Q1155836](https://www.wikidata.org/wiki/Q1155836) |
| 6 | `wankhede-stadium` | Wankhede Stadium | Mumbai, India | Cricket | the venue | 33,108 | [Q177067](https://www.wikidata.org/wiki/Q177067) |
| 7 | `sydney-cricket-ground` | Sydney Cricket Ground | Sydney, Australia | Cricket, Australian football | the venue | 43,649 | [Q856393](https://www.wikidata.org/wiki/Q856393) |
| 8 | `adelaide-oval` | Adelaide Oval | Australia | Cricket, Australian football | the venue | 53,500 | [Q2462430](https://www.wikidata.org/wiki/Q2462430) |
| 9 | `newlands-cricket-ground` | Newlands Cricket Ground | Cape Town, South Africa | Cricket | the venue | 25,000 | [Q3045283](https://www.wikidata.org/wiki/Q3045283) |
| 10 | `old-trafford-cricket-ground` | Old Trafford Cricket Ground | United Kingdom | Cricket | the venue | 19,000 | [Q1572215](https://www.wikidata.org/wiki/Q1572215) |

### Rugby (8)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `twickenham-stadium` | Twickenham Stadium | London, United Kingdom | Rugby | the venue | 82,000 | [Q209725](https://www.wikidata.org/wiki/Q209725) |
| 2 | `eden-park` | Eden Park | New Zealand | Rugby, Cricket | the venue | 50,000 | [Q312411](https://www.wikidata.org/wiki/Q312411) |
| 3 | `millennium-stadium` | Millennium Stadium | Cardiff, United Kingdom | Rugby | the venue | 73,931 | [Q204496](https://www.wikidata.org/wiki/Q204496) |
| 4 | `murrayfield-stadium` | Murrayfield Stadium | Edinburgh, United Kingdom | Rugby | the venue | 67,144 | [Q1024926](https://www.wikidata.org/wiki/Q1024926) |
| 5 | `aviva-stadium` | Aviva Stadium | Dublin, Ireland | Rugby, Soccer | the venue | 51,700 | [Q244402](https://www.wikidata.org/wiki/Q244402) |
| 6 | `ellis-park-stadium` | Ellis Park Stadium | South Africa | Rugby | the venue | 62,567 | [Q182081](https://www.wikidata.org/wiki/Q182081) |
| 7 | `hanazono-rugby-stadium` | Hanazono Rugby Stadium | Japan | Rugby | the venue | 30,000 | [Q1267545](https://www.wikidata.org/wiki/Q1267545) |
| 8 | `chichibunomiya-rugby-stadium` | Chichibunomiya Rugby Stadium | Tokyo, Japan | Rugby | the venue | 24,871 | [Q631237](https://www.wikidata.org/wiki/Q631237) |

### Gaelic and Australian football (4)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `croke-park` | Croke Park | Dublin, Ireland | Gaelic games | the venue | 82,300 | [Q478225](https://www.wikidata.org/wiki/Q478225) |
| 2 | `optus-stadium` | Perth Stadium | Australia | Australian football, Cricket | the venue | 60,000 | [Q7170896](https://www.wikidata.org/wiki/Q7170896) |
| 3 | `marvel-stadium` | Docklands Stadium | Melbourne, Australia | Australian football | the venue | 56,771 | [Q917998](https://www.wikidata.org/wiki/Q917998) |
| 4 | `the-gabba` | The Gabba | Brisbane, Australia | Cricket, Australian football | the venue | 42,000 | [Q2462392](https://www.wikidata.org/wiki/Q2462392) |

### Sumo and budō halls of Japan (6)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `ryogoku-kokugikan` | Ryōgoku Kokugikan | Tokyo, Japan | Budō and sumo | the building's outline |  | [Q176821](https://www.wikidata.org/wiki/Q176821) |
| 2 | `nippon-budokan` | Nippon Budokan | Tokyo, Japan | Budō and sumo | the building's outline |  | [Q386246](https://www.wikidata.org/wiki/Q386246) |
| 3 | `kodokan` | Kodokan | Tokyo, Japan | Budō and sumo | the building's outline |  | [Q1165384](https://www.wikidata.org/wiki/Q1165384) |
| 4 | `osaka-prefectural-gymnasium` | Osaka Prefectural Gymnasium | Osaka, Japan | Budō and sumo | the venue | 8,000 | [Q7105594](https://www.wikidata.org/wiki/Q7105594) |
| 5 | `aichi-international-arena` | Aichi International Arena | Nagoya, Japan | Budō and sumo | the venue | 17,000 | [Q124460245](https://www.wikidata.org/wiki/Q124460245) |
| 6 | `fukuoka-kokusai-center` | Fukuoka Kokusai Center | Fukuoka, Japan | Budō and sumo | the venue |  | [Q11592190](https://www.wikidata.org/wiki/Q11592190) |

### Olympic stadiums and athletics (8)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `beijing-national-stadium` | Beijing National Stadium | Beijing, People's Republic of China | Athletics, Soccer | the venue | 80,000 | [Q133525](https://www.wikidata.org/wiki/Q133525) |
| 2 | `london-stadium` | London Stadium | London, United Kingdom | Athletics, Soccer | the venue | 62,500 | [Q172190](https://www.wikidata.org/wiki/Q172190) |
| 3 | `los-angeles-memorial-coliseum` | Los Angeles Memorial Coliseum | Los Angeles, United States | Athletics, American football | the venue | 77,500 | [Q849784](https://www.wikidata.org/wiki/Q849784) |
| 4 | `athens-olympic-stadium` | Olympic Stadium | Greece | Athletics, Soccer | the venue | 69,618 | [Q189663](https://www.wikidata.org/wiki/Q189663) |
| 5 | `estadi-olimpic-lluis-companys` | Estadi Olímpic Lluís Companys | Barcelona, Spain | Athletics, Soccer | the venue | 55,926 | [Q275715](https://www.wikidata.org/wiki/Q275715) |
| 6 | `hayward-field` | Hayward Field | Eugene, United States | Athletics | the venue | 10,500 | [Q1568417](https://www.wikidata.org/wiki/Q1568417) |
| 7 | `letzigrund` | Letzigrund | Switzerland | Athletics, Soccer | the venue | 25,000 | [Q207623](https://www.wikidata.org/wiki/Q207623) |
| 8 | `bislett-stadium` | Bislett Stadium | Norway | Athletics | the venue | 15,400 | [Q866409](https://www.wikidata.org/wiki/Q866409) |

### College football (7)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `michigan-stadium` | Michigan Stadium | Ann Arbor, United States | American football | the venue | 107,601 | [Q1640118](https://www.wikidata.org/wiki/Q1640118) |
| 2 | `beaver-stadium` | Beaver Stadium | United States | American football | the venue | 106,572 | [Q692816](https://www.wikidata.org/wiki/Q692816) |
| 3 | `ohio-stadium` | Ohio Stadium | Columbus, United States | American football | the venue | 102,780 | [Q774694](https://www.wikidata.org/wiki/Q774694) |
| 4 | `kyle-field` | Kyle Field | United States | American football | the venue | 102,733 | [Q945223](https://www.wikidata.org/wiki/Q945223) |
| 5 | `neyland-stadium` | Neyland Stadium | Knoxville, United States | American football | the venue | 102,455 | [Q1984022](https://www.wikidata.org/wiki/Q1984022) |
| 6 | `tiger-stadium-lsu` | Tiger Stadium | Baton Rouge, United States | American football | the venue | 102,321 | [Q1594708](https://www.wikidata.org/wiki/Q1594708) |
| 7 | `rose-bowl` | Rose Bowl | Pasadena, United States | Soccer | the building's outline |  | [Q582280](https://www.wikidata.org/wiki/Q582280) |

### Baseball around the world (4)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `jamsil-baseball-stadium` | Jamsil Baseball Stadium | Seoul, South Korea | Baseball | the venue | 30,265 | [Q490616](https://www.wikidata.org/wiki/Q490616) |
| 2 | `gocheok-sky-dome` | Gocheok Sky Dome | Seoul, South Korea | Baseball | the venue |  | [Q10855359](https://www.wikidata.org/wiki/Q10855359) |
| 3 | `taipei-dome` | Taipei Dome | Taipei, Taiwan | Baseball | the venue | 40,000 | [Q858333](https://www.wikidata.org/wiki/Q858333) |
| 4 | `estadio-latinoamericano` | Estadio Latinoamericano | Havana, Cuba | Baseball | the venue | 55,000 | [Q1369326](https://www.wikidata.org/wiki/Q1369326) |

### Ovals and pools (7)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `thialf` | Thialf | Heerenveen, Kingdom of the Netherlands | Speed skating | the venue | 12,500 | [Q1371953](https://www.wikidata.org/wiki/Q1371953) |
| 2 | `olympic-oval-calgary` | Olympic Oval | Canada | Speed skating | the venue | 4,000 | [Q1341643](https://www.wikidata.org/wiki/Q1341643) |
| 3 | `utah-olympic-oval` | Utah Olympic Oval | United States | Speed skating | the venue | 3,000 | [Q1369595](https://www.wikidata.org/wiki/Q1369595) |
| 4 | `london-aquatics-centre` | London Aquatics Centre | London, United Kingdom | Swimming | the venue | 17,500 | [Q308874](https://www.wikidata.org/wiki/Q308874) |
| 5 | `beijing-national-aquatics-center` | Water Cube | Beijing, People's Republic of China | Swimming, Curling | the venue | 17,000 | [Q244877](https://www.wikidata.org/wiki/Q244877) |
| 6 | `tokyo-aquatics-centre` | Tokyo Aquatics Centre | Tokyo, Japan | Swimming | the venue |  | [Q65038183](https://www.wikidata.org/wiki/Q65038183) |
| 7 | `duna-arena` | Danube Arena | Budapest, Hungary | Swimming | the venue | 12,880 | [Q25454740](https://www.wikidata.org/wiki/Q25454740) |

### Great indoor halls (5)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `mgm-grand-garden-arena` | MGM Grand Garden Arena | United States | Boxing | the venue | 17,157 | [Q717472](https://www.wikidata.org/wiki/Q717472) |
| 2 | `maracanazinho` | Ginásio do Maracanãzinho | Brazil | Volleyball | the venue | 11,800 | [Q1300456](https://www.wikidata.org/wiki/Q1300456) |
| 3 | `istora-gelora-bung-karno` | Istora Gelora Bung Karno | Indonesia | Badminton | the venue | 7,166 | [Q15108473](https://www.wikidata.org/wiki/Q15108473) |
| 4 | `lanxess-arena` | Lanxess Arena | Cologne, Germany | Handball, Ice hockey | the venue | 20,000 | [Q310525](https://www.wikidata.org/wiki/Q310525) |
| 5 | `ariake-arena` | Ariake Arena | Tokyo, Japan | Volleyball | the venue |  | [Q28068157](https://www.wikidata.org/wiki/Q28068157) |

### Formula One, the 2026 calendar (23)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `albert-park-circuit` | Albert Park Circuit | Melbourne, Australia | Motor racing | the venue (a circuit surface first) |  | [Q171288](https://www.wikidata.org/wiki/Q171288) |
| 2 | `shanghai-international-circuit` | Shanghai International Circuit | Shanghai, People's Republic of China | Motor racing | the venue (a circuit surface first) |  | [Q171358](https://www.wikidata.org/wiki/Q171358) |
| 3 | `suzuka-circuit` | Suzuka Circuit | Suzuka, Japan | Motor racing | the venue (a circuit surface first) |  | [Q174170](https://www.wikidata.org/wiki/Q174170) |
| 4 | `miami-international-autodrome` | Miami International Autodrome | Miami Gardens, United States | Motor racing | the venue (a circuit surface first) |  | [Q106544792](https://www.wikidata.org/wiki/Q106544792) |
| 5 | `circuit-gilles-villeneuve` | Circuit Gilles Villeneuve | Montreal, Canada | Motor racing | the venue (a circuit surface first) | 100,000 | [Q172860](https://www.wikidata.org/wiki/Q172860) |
| 6 | `circuit-de-monaco` | Circuit de Monaco | Monaco, Monaco | Motor racing | the venue (a circuit surface first) |  | [Q171400](https://www.wikidata.org/wiki/Q171400) |
| 7 | `circuit-de-barcelona-catalunya` | Circuit de Barcelona-Catalunya | Montmeló, Spain | Motor racing | the venue (a circuit surface first) |  | [Q171404](https://www.wikidata.org/wiki/Q171404) |
| 8 | `red-bull-ring` | Red Bull Ring | Spielberg, Austria | Motor racing | the venue (a circuit surface first) |  | [Q171566](https://www.wikidata.org/wiki/Q171566) |
| 9 | `silverstone-circuit` | Silverstone Circuit | Silverstone, United Kingdom | Motor racing | the venue (a circuit surface first) |  | [Q171402](https://www.wikidata.org/wiki/Q171402) |
| 10 | `circuit-de-spa-francorchamps` | Circuit de Spa-Francorchamps | Stavelot, Belgium | Motor racing | the venue (a circuit surface first) |  | [Q172851](https://www.wikidata.org/wiki/Q172851) |
| 11 | `hungaroring` | Hungaroring | Mogyoród, Hungary | Motor racing | the venue (a circuit surface first) |  | [Q171356](https://www.wikidata.org/wiki/Q171356) |
| 12 | `circuit-zandvoort` | Circuit Zandvoort | Zandvoort, Kingdom of the Netherlands | Motor racing | the venue (a circuit surface first) |  | [Q173083](https://www.wikidata.org/wiki/Q173083) |
| 13 | `monza-circuit` | Monza Circuit | Monza, Italy | Motor racing | the venue (a circuit surface first) |  | [Q171417](https://www.wikidata.org/wiki/Q171417) |
| 14 | `madring` | Madring | Madrid, Spain | Motor racing | the venue (a circuit surface first) |  | [Q126193406](https://www.wikidata.org/wiki/Q126193406) |
| 15 | `baku-city-circuit` | Baku City Circuit | Baku, Azerbaijan | Motor racing | the venue (a circuit surface first) |  | [Q17004958](https://www.wikidata.org/wiki/Q17004958) |
| 16 | `sepang-international-circuit` | Sepang International Circuit | Sepang, Malaysia | Motor racing | the venue (a circuit surface first) |  | [Q172738](https://www.wikidata.org/wiki/Q172738) |
| 17 | `marina-bay-street-circuit` | Marina Bay Street Circuit | Singapore, Singapore | Motor racing | the venue (a circuit surface first) |  | [Q171390](https://www.wikidata.org/wiki/Q171390) |
| 18 | `circuit-of-the-americas` | Circuit of the Americas | Austin, United States | Motor racing | the venue (a circuit surface first) |  | [Q59626](https://www.wikidata.org/wiki/Q59626) |
| 19 | `autodromo-hermanos-rodriguez` | Autódromo Hermanos Rodríguez | Mexico City, Mexico | Motor racing | the venue (a circuit surface first) |  | [Q173099](https://www.wikidata.org/wiki/Q173099) |
| 20 | `interlagos-circuit` | Interlagos Circuit | São Paulo, Brazil | Motor racing | the venue (a circuit surface first) |  | [Q171387](https://www.wikidata.org/wiki/Q171387) |
| 21 | `las-vegas-strip-circuit` | Las Vegas Strip Circuit | Paradise, United States | Motor racing | the venue (a circuit surface first) |  | [Q113112116](https://www.wikidata.org/wiki/Q113112116) |
| 22 | `lusail-international-circuit` | Lusail International Circuit | Lusail, Qatar | Motor racing | the venue (a circuit surface first) |  | [Q547535](https://www.wikidata.org/wiki/Q547535) |
| 23 | `yas-marina-circuit` | Yas Marina Circuit | Abu Dhabi, United Arab Emirates | Motor racing | the venue (a circuit surface first) |  | [Q172869](https://www.wikidata.org/wiki/Q172869) |

### More great circuits (29)

| # | Key | Venue | City | Sport | Wanted | Capacity | Wikidata |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `indianapolis-motor-speedway` | Indianapolis Motor Speedway | Speedway, United States | Motor racing | the venue (a circuit surface first) | 257,325 | [Q172732](https://www.wikidata.org/wiki/Q172732) |
| 2 | `circuit-de-la-sarthe` | Circuit de la Sarthe | Le Mans, France | Motor racing | the venue (a circuit surface first) |  | [Q174090](https://www.wikidata.org/wiki/Q174090) |
| 3 | `daytona-international-speedway` | Daytona International Speedway | Daytona Beach, United States | Motor racing | the venue (a circuit surface first) |  | [Q1179250](https://www.wikidata.org/wiki/Q1179250) |
| 4 | `nurburgring` | Nürburgring | Germany | Motor racing | the venue (a circuit surface first) |  | [Q152207](https://www.wikidata.org/wiki/Q152207) |
| 5 | `mount-panorama-circuit` | Mount Panorama Circuit | Australia | Motor racing | the venue (a circuit surface first) |  | [Q1950645](https://www.wikidata.org/wiki/Q1950645) |
| 6 | `talladega-superspeedway` | Talladega Superspeedway | United States | Motor racing | the venue (a circuit surface first) |  | [Q1547320](https://www.wikidata.org/wiki/Q1547320) |
| 7 | `bristol-motor-speedway` | Bristol Motor Speedway | Bristol, United States | Motor racing | the venue (a circuit surface first) |  | [Q383490](https://www.wikidata.org/wiki/Q383490) |
| 8 | `charlotte-motor-speedway` | Charlotte Motor Speedway | United States | Motor racing | the venue (a circuit surface first) |  | [Q1067286](https://www.wikidata.org/wiki/Q1067286) |
| 9 | `darlington-raceway` | Darlington Raceway | United States | Motor racing | the venue (a circuit surface first) |  | [Q1166378](https://www.wikidata.org/wiki/Q1166378) |
| 10 | `fuji-speedway` | Fuji Speedway | Oyama, Japan | Motor racing | the venue (a circuit surface first) |  | [Q171399](https://www.wikidata.org/wiki/Q171399) |
| 11 | `sebring-international-raceway` | Sebring International Raceway | United States | Motor racing | the venue (a circuit surface first) |  | [Q172883](https://www.wikidata.org/wiki/Q172883) |
| 12 | `bahrain-international-circuit` | Bahrain International Circuit | Sakhir, Bahrain | Motor racing | the venue (a circuit surface first) |  | [Q171332](https://www.wikidata.org/wiki/Q171332) |
| 13 | `jeddah-corniche-circuit` | Jeddah Corniche Circuit | Saudi Arabia | Motor racing | the venue (a circuit surface first) |  | [Q102141307](https://www.wikidata.org/wiki/Q102141307) |
| 14 | `imola-circuit` | Imola Circuit | Imola, Italy | Motor racing | the venue (a circuit surface first) |  | [Q171313](https://www.wikidata.org/wiki/Q171313) |
| 15 | `mugello-circuit` | Mugello Circuit | Scarperia e San Piero, Italy | Motor racing | the venue (a circuit surface first) |  | [Q782455](https://www.wikidata.org/wiki/Q782455) |
| 16 | `misano-world-circuit` | Misano World Circuit | Misano Adriatico, Italy | Motor racing | the venue (a circuit surface first) |  | [Q1347804](https://www.wikidata.org/wiki/Q1347804) |
| 17 | `phillip-island-grand-prix-circuit` | Phillip Island Grand Prix Circuit | Phillip Island, Australia | Motor racing | the venue (a circuit surface first) |  | [Q571271](https://www.wikidata.org/wiki/Q571271) |
| 18 | `tt-circuit-assen` | TT Circuit Assen | Assen, Kingdom of the Netherlands | Motor racing | the venue (a circuit surface first) |  | [Q843925](https://www.wikidata.org/wiki/Q843925) |
| 19 | `sachsenring` | Sachsenring | Hohenstein-Ernstthal, Germany | Motor racing | the venue (a circuit surface first) |  | [Q567770](https://www.wikidata.org/wiki/Q567770) |
| 20 | `motegi-circuit` | Motegi Circuit | Motegi, Japan | Motor racing | the venue (a circuit surface first) |  | [Q1420895](https://www.wikidata.org/wiki/Q1420895) |
| 21 | `circuito-de-jerez` | Circuito de Jerez | Jerez de la Frontera, Spain | Motor racing | the venue (a circuit surface first) |  | [Q172884](https://www.wikidata.org/wiki/Q172884) |
| 22 | `buriram-international-circuit` | Buriram International Circuit | Buriram, Thailand | Motor racing | the venue (a circuit surface first) |  | [Q16307503](https://www.wikidata.org/wiki/Q16307503) |
| 23 | `circuit-ricardo-tormo` | Circuit Ricardo Tormo | Cheste, Spain | Motor racing | the venue (a circuit surface first) |  | [Q786577](https://www.wikidata.org/wiki/Q786577) |
| 24 | `motorland-aragon` | MotorLand Aragón | Alcañiz, Spain | Motor racing | the venue (a circuit surface first) |  | [Q1321650](https://www.wikidata.org/wiki/Q1321650) |
| 25 | `mandalika-international-street-circuit` | Mandalika International Street Circuit | Indonesia | Motor racing | the venue (a circuit surface first) |  | [Q105061873](https://www.wikidata.org/wiki/Q105061873) |
| 26 | `autodromo-internacional-do-algarve` | Algarve International Circuit | Portimão, Portugal | Motor racing | the venue (a circuit surface first) |  | [Q789427](https://www.wikidata.org/wiki/Q789427) |
| 27 | `balaton-park-circuit` | Balaton Park Circuit | Balatonfőkajár, Hungary | Motor racing | the venue (a circuit surface first) |  | [Q118511681](https://www.wikidata.org/wiki/Q118511681) |
| 28 | `brno-circuit` | Brno Circuit | Brno, Czech Republic | Motor racing | the venue (a circuit surface first) |  | [Q222686](https://www.wikidata.org/wiki/Q222686) |
| 29 | `autodromo-internacional-ayrton-senna-goiania` | Autódromo Internacional Ayrton Senna | Goiânia, Brazil | Motor racing | the venue (a circuit surface first) |  | [Q789407](https://www.wikidata.org/wiki/Q789407) |
<!-- /catalogue-wanted -->

## What a circuit needs

The package draws no circuit, so every circuit waits (`needs: "circuit-surface"`). A circuit surface would be the track as OpenStreetMap maps it (`highway=raceway`, the ways of the circuit's relation), with its pit lane, start line and sectors where they are mapped: geometry under the ODbL, kept apart from every other file with its credit, as the real venues' outlines are (`src/venues.osm.data.ts`), fetched once and kept dated in `data-sources/`. Its length and its corners would be checked against what the circuit's article publishes.

## Sources and licences

- **Wikidata, CC0**: every item, the names in English and Japanese, the coordinates, the countries, the capacities and the places a venue is located in (P131, which the city is checked against).
- **English Wikipedia, CC BY-SA 4.0**: the title of each new venue's article (its everyday name), and, as evidence only, which venues a league's list and a season's calendar link from their tables: the NFL's and the CFL's lists of stadiums, the calendars of Formula One and MotoGP for 2026. No text of an article is copied.
- **The package's own data** for every supported venue: see [NOTICE.md](../NOTICE.md).
- `pnpm catalogue:fetch` keeps the raw answers, dated, in `data-sources/catalogue/` (one request at a time, three seconds apart, with a User-Agent that names the package). `pnpm catalogue` makes `src/catalogue.data.ts`, `catalogue.json` and this page's tables from them; do not edit the tables by hand. A test holds every item to the raw answers, the JSON to the entry and these tables to the data.

## Limits

- A city is given only where Wikidata's places agree with it (or, for a league's or a calendar's venue, the article's row does); where they do not, it is left out and `missing.city` says why. The same holds for a name in Japanese, a country and coordinates.
- A capacity is Wikidata's when it gives one figure: a stadium's seats change with its configuration, so read it as a guide.
- The wanted groups are a choice of famous venues, not a ranking anyone published.
