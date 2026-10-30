// Made by scripts/build-parks.mjs from scripts/parks.data.json: do not edit by hand.
// Fence distances are facts published in the articles each entry cites; see docs/references.md.
import type { ParkData } from "./parks.core.ts";

export const PARK_DATA: ParkData[] = [
  {
    "id": "oriole-park-at-camden-yards",
    "wikidata": "Q1141174",
    "name": "Oriole Park at Camden Yards",
    "nameJa": "オリオール・パーク・アット・カムデン・ヤーズ",
    "aliases": [
      { "name": "Oriole Park at Camden Yards", "lang": "en", "kind": "wikipedia", "revision": 1377140400, "source": "en.wikipedia.org" },
      { "name": "オリオール・パーク・アット・カムデン・ヤーズ", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1141174 sitelink" },
      { "name": "Camden Yards", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377140400" },
      { "name": "カムデン・ヤーズ", "lang": "ja", "kind": "nickname", "source": "Wikidata Q1141174 alias" }
    ],
    "team": "Baltimore Orioles",
    "city": "Baltimore",
    "country": "US",
    "lat": 39.28389,
    "lon": -76.62167,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1992,
    "points": [
      [-45, 333],
      [-33, 373],
      [-22, 376],
      [-12, 410],
      [0, 400],
      [22.5, 373],
      [45, 318]
    ],
    "en": {
      "title": "Oriole Park at Camden Yards",
      "revision": 1377140400
    },
    "walls": [
      {
        "from": -45,
        "to": -22,
        "height": 7,
        "last": 2021,
        "place": "left"
      },
      {
        "from": -45,
        "to": -22,
        "height": 13,
        "first": 2022,
        "place": "left"
      },
      {
        "from": 22.5,
        "to": 45,
        "height": 21,
        "place": "right"
      }
    ]
  },
  {
    "id": "fenway-park",
    "wikidata": "Q49136",
    "name": "Fenway Park",
    "nameJa": "フェンウェイ・パーク",
    "aliases": [
      { "name": "Fenway Park", "lang": "en", "kind": "wikipedia", "revision": 1376280796, "source": "en.wikipedia.org" },
      { "name": "フェンウェイ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q49136 sitelink" },
      { "name": "America's Most Beloved Ballpark", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376280796" },
      { "name": "Friendly Fenway", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376280796" },
      { "name": "Fenway", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376280796" }
    ],
    "team": "Boston Red Sox",
    "city": "Boston",
    "country": "US",
    "lat": 42.34639,
    "lon": -71.0975,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1912,
    "points": [
      [-45, 310],
      [-24, 379],
      [0, 389.75],
      [18, 420],
      [28, 380],
      [45, 302]
    ],
    "en": {
      "title": "Fenway Park",
      "revision": 1376280796
    },
    "backstop_ft": 60,
    "walls": [
      {
        "from": -45,
        "to": -24,
        "height": 25,
        "first": 1912,
        "last": 1933,
        "place": "left"
      },
      {
        "from": -45,
        "to": -24,
        "height": 37.167,
        "label": "Green Monster",
        "first": 1934,
        "place": "left"
      }
    ],
    "quirks": [
      {
        "kind": "pole",
        "label": "Pesky's Pole",
        "angle": 45,
        "feet": 302
      }
    ]
  },
  {
    "id": "yankee-stadium",
    "wikidata": "Q753529",
    "name": "Yankee Stadium",
    "nameJa": "ヤンキー・スタジアム",
    "aliases": [
      { "name": "Yankee Stadium", "lang": "en", "kind": "wikipedia", "revision": 1378222004, "source": "en.wikipedia.org" },
      { "name": "ヤンキー・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q753529 sitelink" },
      { "name": "The Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378222004" },
      { "name": "The House That Jeter Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378222004" },
      { "name": "The House That George Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378222004" },
      { "name": "New Yankee Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378222004" }
    ],
    "team": "New York Yankees",
    "city": "New York",
    "country": "US",
    "lat": 40.82957,
    "lon": -73.92639,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2009,
    "points": [
      [-45, 318],
      [-22.5, 399],
      [0, 408],
      [22.5, 385],
      [45, 314]
    ],
    "en": {
      "title": "Yankee Stadium",
      "revision": 1378222004
    },
    "backstop_ft": 52.333,
    "walls": [
      {
        "from": -45,
        "to": 22.5,
        "height": 8.417,
        "place": "leftToCenter"
      },
      {
        "from": 22.5,
        "to": 45,
        "height": 8,
        "place": "right"
      }
    ]
  },
  {
    "id": "tropicana-field",
    "wikidata": "Q1810119",
    "name": "Tropicana Field",
    "nameJa": "トロピカーナ・フィールド",
    "aliases": [
      { "name": "Tropicana Field", "lang": "en", "kind": "wikipedia", "revision": 1379964475, "source": "en.wikipedia.org" },
      { "name": "トロピカーナ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1810119 sitelink" },
      { "name": "Florida Suncoast Dome", "lang": "en", "kind": "former", "from": 1990, "to": 1993, "source": "en.wikipedia.org revision 1379964475" },
      { "name": "ThunderDome", "lang": "en", "kind": "former", "from": 1993, "to": 1996, "source": "en.wikipedia.org revision 1379964475" },
      { "name": "The Trop", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379964475" }
    ],
    "team": "Tampa Bay Rays",
    "city": "St. Petersburg",
    "country": "US",
    "lat": 27.76833,
    "lon": -82.65333,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1990,
    "points": [
      [-45, 315],
      [-22.5, 370],
      [0, 404],
      [22.5, 370],
      [45, 322]
    ],
    "en": {
      "title": "Tropicana Field",
      "revision": 1379964475
    },
    "backstop_ft": 50
  },
  {
    "id": "rogers-centre",
    "wikidata": "Q76318",
    "name": "Rogers Centre",
    "nameJa": "ロジャーズ・センター",
    "aliases": [
      { "name": "Rogers Centre", "lang": "en", "kind": "wikipedia", "revision": 1379619269, "source": "en.wikipedia.org" },
      { "name": "ロジャーズ・センター", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q76318 sitelink" },
      { "name": "スカイドーム", "lang": "ja", "kind": "former", "source": "Wikidata Q76318 alias" },
      { "name": "SkyDome", "lang": "en", "kind": "former", "from": 1989, "to": 2005, "source": "en.wikipedia.org revision 1379619269" }
    ],
    "team": "Toronto Blue Jays",
    "city": "Toronto",
    "country": "CA",
    "lat": 43.64139,
    "lon": -79.38917,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1989,
    "points": [
      [-45, 328],
      [-33, 368],
      [-22.5, 381],
      [0, 400],
      [22.5, 372],
      [33, 359],
      [45, 328]
    ],
    "en": {
      "title": "Rogers Centre",
      "revision": 1379619269
    },
    "backstop_ft": 60
  },
  {
    "id": "rate-field",
    "wikidata": "Q633613",
    "name": "Rate Field",
    "nameJa": "レート・フィールド",
    "aliases": [
      { "name": "Rate Field", "lang": "en", "kind": "wikipedia", "revision": 1379317170, "source": "en.wikipedia.org" },
      { "name": "レート・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q633613 sitelink" },
      { "name": "ギャランティード・レート・フィールド", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q633613 label" },
      { "name": "USセルラー・フィールド", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q633613 alias" },
      { "name": "U.S. Cellular Field", "lang": "en", "kind": "sponsor", "from": 2003, "to": 2016, "source": "en.wikipedia.org revision 1379317170" },
      { "name": "Guaranteed Rate Field", "lang": "en", "kind": "sponsor", "from": 2017, "to": 2024, "source": "en.wikipedia.org revision 1379317170" },
      { "name": "Comiskey Park II", "lang": "en", "kind": "former", "from": 1991, "to": 2003, "source": "en.wikipedia.org revision 1379317170" },
      { "name": "White Sox Park", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379317170" },
      { "name": "Sox Park", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379317170" },
      { "name": "New Comiskey", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379317170" },
      { "name": "The Cell", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379317170" }
    ],
    "team": "Chicago White Sox",
    "city": "Chicago",
    "country": "US",
    "lat": 41.83,
    "lon": -87.63389,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1991,
    "points": [
      [-45, 330],
      [-22.5, 375],
      [0, 400],
      [22.5, 375],
      [45, 335]
    ],
    "en": {
      "title": "Rate Field",
      "revision": 1379317170
    },
    "backstop_ft": 60,
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 8,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "progressive-field",
    "wikidata": "Q1154053",
    "name": "Progressive Field",
    "nameJa": "プログレッシブ・フィールド",
    "aliases": [
      { "name": "Progressive Field", "lang": "en", "kind": "wikipedia", "revision": 1378504146, "source": "en.wikipedia.org" },
      { "name": "プログレッシブ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1154053 sitelink" },
      { "name": "ジェイコブス・フィールド", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1154053 alias" },
      { "name": "Jacobs Field", "lang": "en", "kind": "sponsor", "from": 1994, "to": 2007, "source": "en.wikipedia.org revision 1378504146" },
      { "name": "The Jake", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378504146" }
    ],
    "team": "Cleveland Guardians",
    "city": "Cleveland",
    "country": "US",
    "lat": 41.49583,
    "lon": -81.68528,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1994,
    "points": [
      [-45, 325],
      [-22.5, 370],
      [-9, 410],
      [0, 400],
      [22.5, 375],
      [45, 325]
    ],
    "en": {
      "title": "Progressive Field",
      "revision": 1378504146
    },
    "backstop_ft": 60,
    "dugouts": {
      "home": "third",
      "visitors": "first"
    },
    "walls": [
      {
        "from": -45,
        "to": -22.5,
        "height": 19,
        "label": "Little Green Monster",
        "place": "left"
      },
      {
        "from": -22.5,
        "to": 45,
        "height": 9,
        "place": "centerToRight"
      }
    ]
  },
  {
    "id": "comerica-park",
    "wikidata": "Q868482",
    "name": "Comerica Park",
    "nameJa": "コメリカ・パーク",
    "aliases": [
      { "name": "Comerica Park", "lang": "en", "kind": "wikipedia", "revision": 1376178715, "source": "en.wikipedia.org" },
      { "name": "コメリカ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q868482 sitelink" }
    ],
    "team": "Detroit Tigers",
    "city": "Detroit",
    "country": "US",
    "lat": 42.33917,
    "lon": -83.04861,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2000,
    "points": [
      [-45, 342],
      [-22.5, 370],
      [0, 412],
      [22.5, 365],
      [45, 330]
    ],
    "en": {
      "title": "Comerica Park",
      "revision": 1376178715
    },
    "walls": [
      {
        "from": -22.5,
        "to": 45,
        "height": 7,
        "first": 2023,
        "place": "centerToRight"
      }
    ]
  },
  {
    "id": "kauffman-stadium",
    "wikidata": "Q1737017",
    "name": "Kauffman Stadium",
    "nameJa": "カウフマン・スタジアム",
    "aliases": [
      { "name": "Kauffman Stadium", "lang": "en", "kind": "wikipedia", "revision": 1376240550, "source": "en.wikipedia.org" },
      { "name": "カウフマン・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1737017 sitelink" },
      { "name": "ロイヤルズ・スタジアム", "lang": "ja", "kind": "former", "source": "Wikidata Q1737017 alias" },
      { "name": "Royals Stadium", "lang": "en", "kind": "former", "from": 1973, "to": 1993, "source": "en.wikipedia.org revision 1376240550" },
      { "name": "The K", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376240550" }
    ],
    "team": "Kansas City Royals",
    "city": "Kansas City",
    "country": "US",
    "lat": 39.05139,
    "lon": -94.48056,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1973,
    "points": [
      [-45, 330],
      [-22.5, 379],
      [0, 410],
      [22.5, 379],
      [45, 330]
    ],
    "en": {
      "title": "Kauffman Stadium",
      "revision": 1376240550
    },
    "note": "Alleys as posted from 2026.",
    "backstop_ft": 60,
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 12,
        "last": 1994,
        "place": "outfield"
      },
      {
        "from": -45,
        "to": 45,
        "height": 9,
        "first": 1995,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "target-field",
    "wikidata": "Q1156635",
    "name": "Target Field",
    "nameJa": "ターゲット・フィールド",
    "aliases": [
      { "name": "Target Field", "lang": "en", "kind": "wikipedia", "revision": 1379001210, "source": "en.wikipedia.org" },
      { "name": "ターゲット・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1156635 sitelink" }
    ],
    "team": "Minnesota Twins",
    "city": "Minneapolis",
    "country": "US",
    "lat": 44.98167,
    "lon": -93.27833,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2010,
    "points": [
      [-45, 339],
      [-22.5, 377],
      [-6, 411],
      [6, 403],
      [22.5, 367],
      [45, 328]
    ],
    "en": {
      "title": "Target Field",
      "revision": 1379001210
    }
  },
  {
    "id": "daikin-park",
    "wikidata": "Q1193671",
    "name": "Daikin Park",
    "nameJa": "ダイキン・パーク",
    "aliases": [
      { "name": "Daikin Park", "lang": "en", "kind": "wikipedia", "revision": 1377935430, "source": "en.wikipedia.org" },
      { "name": "ダイキン・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1193671 sitelink" },
      { "name": "ミニッツメイド・パーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1193671 alias" },
      { "name": "Enron Field", "lang": "en", "kind": "sponsor", "from": 2000, "to": 2002, "source": "en.wikipedia.org revision 1377935430" },
      { "name": "Minute Maid Park", "lang": "en", "kind": "sponsor", "from": 2002, "to": 2024, "source": "en.wikipedia.org revision 1377935430" },
      { "name": "Astros Field", "lang": "en", "kind": "former", "from": 2002, "to": 2002, "source": "en.wikipedia.org revision 1377935430" },
      { "name": "The Ice Box", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377935430" }
    ],
    "team": "Houston Astros",
    "city": "Houston",
    "country": "US",
    "lat": 29.75694,
    "lon": -95.35556,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2000,
    "points": [
      [-45, 315],
      [-25, 366],
      [-12, 399],
      [0, 409],
      [12, 408],
      [25, 370],
      [45, 326]
    ],
    "en": {
      "title": "Daikin Park",
      "revision": 1377935430
    },
    "note": "Formerly Minute Maid Park.",
    "backstop_ft": 49,
    "walls": [
      {
        "from": -45,
        "to": -25,
        "height": 19,
        "label": "Crawford Boxes",
        "place": "left"
      }
    ],
    "quirks": [
      {
        "kind": "hill",
        "label": "Tal's Hill",
        "angle": 0,
        "feet": 436,
        "width_ft": 90,
        "slope_deg": 30,
        "first": 2000,
        "last": 2016
      }
    ]
  },
  {
    "id": "angel-stadium",
    "wikidata": "Q531897",
    "name": "Angel Stadium",
    "nameJa": "エンゼル・スタジアム・オブ・アナハイム",
    "aliases": [
      { "name": "Angel Stadium", "lang": "en", "kind": "wikipedia", "revision": 1379214381, "source": "en.wikipedia.org" },
      { "name": "エンゼル・スタジアム・オブ・アナハイム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q531897 sitelink" },
      { "name": "Edison International Field of Anaheim", "lang": "en", "kind": "sponsor", "from": 1998, "to": 2003, "source": "en.wikipedia.org revision 1379214381" },
      { "name": "Anaheim Stadium", "lang": "en", "kind": "former", "from": 1966, "to": 1997, "source": "en.wikipedia.org revision 1379214381" },
      { "name": "The Big A", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379214381" }
    ],
    "team": "Los Angeles Angels",
    "city": "Anaheim",
    "country": "US",
    "lat": 33.80028,
    "lon": -117.88278,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1966,
    "points": [
      [-45, 347],
      [-22.5, 390],
      [0, 396],
      [15, 370],
      [28, 365],
      [45, 350]
    ],
    "en": {
      "title": "Angel Stadium",
      "revision": 1379214381
    },
    "backstop_ft": 60.5,
    "walls": [
      {
        "from": 15,
        "to": 28,
        "height": 8,
        "last": 1997,
        "place": "rightCenter"
      },
      {
        "from": 15,
        "to": 28,
        "height": 19,
        "first": 1998,
        "place": "rightCenter"
      }
    ]
  },
  {
    "id": "sutter-health-park",
    "wikidata": "Q3418115",
    "name": "Sutter Health Park",
    "nameJa": "サター・ヘルス・パーク",
    "aliases": [
      { "name": "Sutter Health Park", "lang": "en", "kind": "wikipedia", "revision": 1379745688, "source": "en.wikipedia.org" },
      { "name": "サター・ヘルス・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q3418115 sitelink" },
      { "name": "Raley Field", "lang": "en", "kind": "sponsor", "from": 2000, "to": 2019, "source": "en.wikipedia.org revision 1379745688" }
    ],
    "team": "Athletics",
    "city": "West Sacramento",
    "country": "US",
    "lat": 38.58037,
    "lon": -121.5138,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2000,
    "points": [
      [-45, 330],
      [0, 403],
      [45, 325]
    ],
    "en": {
      "title": "Sutter Health Park",
      "revision": 1379745688
    },
    "note": "Three published figures only.",
    "backstop_ft": 58
  },
  {
    "id": "t-mobile-park",
    "wikidata": "Q1193117",
    "name": "T-Mobile Park",
    "nameJa": "T-モバイル・パーク",
    "aliases": [
      { "name": "T-Mobile Park", "lang": "en", "kind": "wikipedia", "revision": 1379419810, "source": "en.wikipedia.org" },
      { "name": "T-モバイル・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1193117 sitelink" },
      { "name": "セーフコー・フィールド", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1193117 alias" },
      { "name": "Safeco Field", "lang": "en", "kind": "sponsor", "from": 1999, "to": 2018, "source": "en.wikipedia.org revision 1379419810" },
      { "name": "The Safe", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379419810" },
      { "name": "Electric Factory", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379419810" },
      { "name": "The House that Griffey Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379419810" }
    ],
    "team": "Seattle Mariners",
    "city": "Seattle",
    "country": "US",
    "lat": 47.59139,
    "lon": -122.3325,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1999,
    "points": [
      [-45, 331],
      [-22.5, 378],
      [0, 401],
      [22.5, 381],
      [45, 326]
    ],
    "en": {
      "title": "T-Mobile Park",
      "revision": 1379419810
    },
    "backstop_ft": 69
  },
  {
    "id": "globe-life-field",
    "wikidata": "Q24284037",
    "name": "Globe Life Field",
    "nameJa": "グローブライフ・フィールド",
    "aliases": [
      { "name": "Globe Life Field", "lang": "en", "kind": "wikipedia", "revision": 1377936073, "source": "en.wikipedia.org" },
      { "name": "グローブライフ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q24284037 sitelink" }
    ],
    "team": "Texas Rangers",
    "city": "Arlington",
    "country": "US",
    "lat": 32.74736,
    "lon": -97.08417,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2020,
    "points": [
      [-45, 329],
      [-22.5, 372],
      [0, 407],
      [22.5, 374],
      [45, 326]
    ],
    "en": {
      "title": "Globe Life Field",
      "revision": 1377936073
    },
    "backstop_ft": 42
  },
  {
    "id": "truist-park",
    "wikidata": "Q17003430",
    "name": "Truist Park",
    "nameJa": "トゥルーイスト・パーク",
    "aliases": [
      { "name": "Truist Park", "lang": "en", "kind": "wikipedia", "revision": 1372245868, "source": "en.wikipedia.org" },
      { "name": "トゥルーイスト・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q17003430 sitelink" },
      { "name": "サントラスト・パーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q17003430 alias" },
      { "name": "SunTrust Park", "lang": "en", "kind": "sponsor", "from": 2017, "to": 2020, "source": "en.wikipedia.org revision 1372245868" }
    ],
    "team": "Atlanta Braves",
    "city": "Cumberland",
    "country": "US",
    "lat": 33.8912,
    "lon": -84.4683,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2017,
    "points": [
      [-45, 335],
      [-22.5, 385],
      [0, 400],
      [22.5, 375],
      [45, 325]
    ],
    "en": {
      "title": "Truist Park",
      "revision": 1372245868
    }
  },
  {
    "id": "loandepot-park",
    "wikidata": "Q1368138",
    "name": "loanDepot Park",
    "nameJa": "ローンデポ・パーク",
    "aliases": [
      { "name": "LoanDepot Park", "lang": "en", "kind": "wikipedia", "revision": 1376431410, "source": "en.wikipedia.org" },
      { "name": "ローンデポ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1368138 sitelink" },
      { "name": "マーリンズ・パーク", "lang": "ja", "kind": "former", "source": "Wikidata Q1368138 alias" },
      { "name": "Marlins Park", "lang": "en", "kind": "former", "from": 2012, "to": 2020, "source": "en.wikipedia.org revision 1376431410" }
    ],
    "team": "Miami Marlins",
    "city": "Miami",
    "country": "US",
    "lat": 25.77806,
    "lon": -80.21972,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2012,
    "points": [
      [-45, 344],
      [-22.5, 386],
      [0, 400],
      [22.5, 387],
      [45, 335]
    ],
    "en": {
      "title": "LoanDepot Park",
      "revision": 1376431410
    },
    "backstop_ft": 47,
    "dugouts": {
      "home": "third"
    }
  },
  {
    "id": "citi-field",
    "wikidata": "Q1072882",
    "name": "Citi Field",
    "nameJa": "シティ・フィールド",
    "aliases": [
      { "name": "Citi Field", "lang": "en", "kind": "wikipedia", "revision": 1377977619, "source": "en.wikipedia.org" },
      { "name": "シティ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1072882 sitelink" }
    ],
    "team": "New York Mets",
    "city": "New York",
    "country": "US",
    "lat": 40.75699,
    "lon": -73.84578,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2009,
    "points": [
      [-45, 335],
      [-30, 358],
      [-17, 385],
      [0, 408],
      [17, 398],
      [30, 375],
      [45, 330]
    ],
    "en": {
      "title": "Citi Field",
      "revision": 1377977619
    },
    "walls": [
      {
        "from": -45,
        "to": -22.5,
        "height": 16,
        "label": "Great Wall of Flushing",
        "last": 2011,
        "place": "left"
      },
      {
        "from": -45,
        "to": -22.5,
        "height": 8,
        "first": 2012,
        "place": "left"
      }
    ]
  },
  {
    "id": "citizens-bank-park",
    "wikidata": "Q912770",
    "name": "Citizens Bank Park",
    "nameJa": "シチズンズ・バンク・パーク",
    "aliases": [
      { "name": "Citizens Bank Park", "lang": "en", "kind": "wikipedia", "revision": 1378696704, "source": "en.wikipedia.org" },
      { "name": "シチズンズ・バンク・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q912770 sitelink" },
      { "name": "CBP", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378696704" },
      { "name": "The Bank", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378696704" }
    ],
    "team": "Philadelphia Phillies",
    "city": "Philadelphia",
    "country": "US",
    "lat": 39.90583,
    "lon": -75.16667,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2004,
    "points": [
      [-45, 329],
      [-25, 374],
      [-18, 387],
      [-14, 381],
      [-9, 409],
      [0, 401],
      [25, 369],
      [45, 330]
    ],
    "en": {
      "title": "Citizens Bank Park",
      "revision": 1378696704
    }
  },
  {
    "id": "nationals-park",
    "wikidata": "Q517545",
    "name": "Nationals Park",
    "nameJa": "ナショナルズ・パーク",
    "aliases": [
      { "name": "Nationals Park", "lang": "en", "kind": "wikipedia", "revision": 1379437509, "source": "en.wikipedia.org" },
      { "name": "ナショナルズ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q517545 sitelink" }
    ],
    "team": "Washington Nationals",
    "city": "Washington",
    "country": "US",
    "lat": 38.8725,
    "lon": -77.00778,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2008,
    "points": [
      [-45, 337],
      [-22.5, 377],
      [0, 402],
      [22.5, 370],
      [45, 335]
    ],
    "en": {
      "title": "Nationals Park",
      "revision": 1379437509
    }
  },
  {
    "id": "wrigley-field",
    "wikidata": "Q1052807",
    "name": "Wrigley Field",
    "nameJa": "リグレー・フィールド",
    "aliases": [
      { "name": "Wrigley Field", "lang": "en", "kind": "wikipedia", "revision": 1377918987, "source": "en.wikipedia.org" },
      { "name": "リグレー・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1052807 sitelink" },
      { "name": "Weeghman Park", "lang": "en", "kind": "former", "from": 1914, "to": 1920, "source": "en.wikipedia.org revision 1377918987" },
      { "name": "Cubs Park", "lang": "en", "kind": "former", "from": 1920, "to": 1926, "source": "en.wikipedia.org revision 1377918987" },
      { "name": "The Friendly Confines", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377918987" }
    ],
    "team": "Chicago Cubs",
    "city": "Chicago",
    "country": "US",
    "lat": 41.94806,
    "lon": -87.65556,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1914,
    "points": [
      [-45, 355],
      [-36, 357],
      [-30, 360],
      [-22.5, 368],
      [0, 400],
      [22.5, 368],
      [30, 363],
      [45, 353]
    ],
    "en": {
      "title": "Wrigley Field",
      "revision": 1377918987
    },
    "labels": [
      [
        -45,
        "Left field line, the notch in the wall just beyond the foul pole"
      ],
      [
        -36,
        "Where the bleacher wall begins to curve inward in left-centre, the left well (unmarked)"
      ],
      [
        -30,
        "The front of the left-centre well (about 360)"
      ],
      [
        -22.5,
        "Left-centre (marked)"
      ],
      [
        0,
        "The centre field marker, the deepest point (true centre field is unmarked, about 390)"
      ],
      [
        22.5,
        "Right-centre"
      ],
      [
        30,
        "The notch of the right-centre well (unmarked)"
      ],
      [
        45,
        "Right field line"
      ]
    ],
    "backstop_ft": 55,
    "dugouts": {
      "home": "third"
    },
    "walls": [
      {
        "from": -45,
        "to": -30,
        "height": 15,
        "last": 2014,
        "place": "leftCorner"
      },
      {
        "from": -45,
        "to": -30,
        "height": 11,
        "first": 2015,
        "place": "leftCorner"
      },
      {
        "from": -30,
        "to": 30,
        "height": 11.5,
        "place": "outfield"
      },
      {
        "from": 30,
        "to": 45,
        "height": 15,
        "last": 2014,
        "place": "rightCorner"
      },
      {
        "from": 30,
        "to": 45,
        "height": 11,
        "first": 2015,
        "place": "rightCorner"
      }
    ],
    "quirks": [
      {
        "kind": "ivy",
        "from": -45,
        "to": 45,
        "first": 1937
      },
      {
        "kind": "basket",
        "from": -45,
        "to": 45,
        "first": 1970
      }
    ]
  },
  {
    "id": "great-american-ball-park",
    "wikidata": "Q979975",
    "name": "Great American Ball Park",
    "nameJa": "グレート・アメリカン・ボール・パーク",
    "aliases": [
      { "name": "Great American Ball Park", "lang": "en", "kind": "wikipedia", "revision": 1378720434, "source": "en.wikipedia.org" },
      { "name": "グレート・アメリカン・ボール・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q979975 sitelink" },
      { "name": "GABP", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378720434" }
    ],
    "team": "Cincinnati Reds",
    "city": "Cincinnati",
    "country": "US",
    "lat": 39.09722,
    "lon": -84.50694,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2003,
    "points": [
      [-45, 328],
      [-22.5, 379],
      [0, 404],
      [22.5, 370],
      [45, 325]
    ],
    "en": {
      "title": "Great American Ball Park",
      "revision": 1378720434
    },
    "backstop_ft": 55
  },
  {
    "id": "american-family-field",
    "wikidata": "Q1339293",
    "name": "American Family Field",
    "nameJa": "アメリカンファミリー・フィールド",
    "aliases": [
      { "name": "American Family Field", "lang": "en", "kind": "wikipedia", "revision": 1379813094, "source": "en.wikipedia.org" },
      { "name": "アメリカンファミリー・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1339293 sitelink" },
      { "name": "ミラー・パーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1339293 alias" },
      { "name": "Miller Park", "lang": "en", "kind": "sponsor", "from": 2001, "to": 2020, "source": "en.wikipedia.org revision 1379813094" }
    ],
    "team": "Milwaukee Brewers",
    "city": "Milwaukee",
    "country": "US",
    "lat": 43.02833,
    "lon": -87.97111,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2001,
    "points": [
      [-45, 342],
      [-22.5, 371],
      [0, 400],
      [22.5, 374],
      [45, 337]
    ],
    "en": {
      "title": "American Family Field",
      "revision": 1379813094
    },
    "backstop_ft": 56
  },
  {
    "id": "pnc-park",
    "wikidata": "Q1151177",
    "name": "PNC Park",
    "nameJa": "PNCパーク",
    "aliases": [
      { "name": "PNC Park", "lang": "en", "kind": "wikipedia", "revision": 1379228702, "source": "en.wikipedia.org" },
      { "name": "PNCパーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1151177 sitelink" }
    ],
    "team": "Pittsburgh Pirates",
    "city": "Pittsburgh",
    "country": "US",
    "lat": 40.44694,
    "lon": -80.00583,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2001,
    "points": [
      [-45, 325],
      [-27, 383],
      [-13, 410],
      [0, 399],
      [22.5, 375],
      [45, 320]
    ],
    "en": {
      "title": "PNC Park",
      "revision": 1379228702
    },
    "track_ft": 18,
    "backstop_ft": 51,
    "dugouts": {
      "home": "third"
    },
    "walls": [
      {
        "from": -45,
        "to": -22.5,
        "height": 6,
        "place": "left"
      },
      {
        "from": -22.5,
        "to": 22.5,
        "height": 10,
        "place": "center"
      },
      {
        "from": 22.5,
        "to": 45,
        "height": 21,
        "place": "right"
      }
    ]
  },
  {
    "id": "busch-stadium",
    "wikidata": "Q253546",
    "name": "Busch Stadium",
    "nameJa": "ブッシュ・スタジアム",
    "aliases": [
      { "name": "Busch Stadium", "lang": "en", "kind": "wikipedia", "revision": 1377977448, "source": "en.wikipedia.org" },
      { "name": "ブッシュ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q253546 sitelink" },
      { "name": "Busch Stadium III", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377977448" },
      { "name": "Baseball Heaven", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377977448" }
    ],
    "team": "St. Louis Cardinals",
    "city": "St. Louis",
    "country": "US",
    "lat": 38.6225,
    "lon": -90.19306,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2006,
    "points": [
      [-45, 336],
      [-22.5, 375],
      [0, 400],
      [22.5, 375],
      [45, 335]
    ],
    "en": {
      "title": "Busch Stadium",
      "revision": 1377977448
    }
  },
  {
    "id": "chase-field",
    "wikidata": "Q1068011",
    "name": "Chase Field",
    "nameJa": "チェイス・フィールド",
    "aliases": [
      { "name": "Chase Field", "lang": "en", "kind": "wikipedia", "revision": 1378357458, "source": "en.wikipedia.org" },
      { "name": "チェイス・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1068011 sitelink" },
      { "name": "バンクワン・ボール・パーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1068011 alias" },
      { "name": "Bank One Ballpark", "lang": "en", "kind": "sponsor", "from": 1998, "to": 2005, "source": "en.wikipedia.org revision 1378357458" }
    ],
    "team": "Arizona Diamondbacks",
    "city": "Phoenix",
    "country": "US",
    "lat": 33.44528,
    "lon": -112.06694,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1998,
    "points": [
      [-45, 330],
      [-28, 374],
      [-14, 413],
      [0, 407],
      [14, 413],
      [28, 374],
      [45, 334]
    ],
    "en": {
      "title": "Chase Field",
      "revision": 1378357458
    }
  },
  {
    "id": "coors-field",
    "wikidata": "Q1129916",
    "name": "Coors Field",
    "nameJa": "クアーズ・フィールド",
    "aliases": [
      { "name": "Coors Field", "lang": "en", "kind": "wikipedia", "revision": 1375299958, "source": "en.wikipedia.org" },
      { "name": "クアーズ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1129916 sitelink" }
    ],
    "team": "Colorado Rockies",
    "city": "Denver",
    "country": "US",
    "lat": 39.75611,
    "lon": -104.99417,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1995,
    "points": [
      [-45, 347],
      [-22.5, 390],
      [0, 415],
      [22.5, 375],
      [45, 350]
    ],
    "en": {
      "title": "Coors Field",
      "revision": 1375299958
    },
    "backstop_ft": 56,
    "walls": [
      {
        "from": -45,
        "to": -33.75,
        "height": 13,
        "first": 2016,
        "place": "leftCorner"
      },
      {
        "from": -22.5,
        "to": 45,
        "height": 16.5,
        "first": 2016,
        "place": "centerToRight"
      }
    ]
  },
  {
    "id": "dodger-stadium",
    "wikidata": "Q247420",
    "name": "Dodger Stadium",
    "nameJa": "ドジャー・スタジアム",
    "aliases": [
      { "name": "Dodger Stadium", "lang": "en", "kind": "wikipedia", "revision": 1375093238, "source": "en.wikipedia.org" },
      { "name": "ドジャー・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q247420 sitelink" },
      { "name": "Uniqlo Field at Dodger Stadium", "lang": "en", "kind": "sponsor", "source": "en.wikipedia.org revision 1375093238" },
      { "name": "Chavez Ravine", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1375093238" },
      { "name": "Blue Heaven on Earth", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1375093238" }
    ],
    "team": "Los Angeles Dodgers",
    "city": "Los Angeles",
    "country": "US",
    "lat": 34.07361,
    "lon": -118.24,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 1962,
    "points": [
      [-45, 330],
      [-33, 360],
      [-22, 375],
      [-8, 395],
      [0, 400],
      [22, 375],
      [33, 360],
      [45, 330]
    ],
    "en": {
      "title": "Dodger Stadium",
      "revision": 1375093238
    },
    "backstop_ft": 55
  },
  {
    "id": "petco-park",
    "wikidata": "Q1194586",
    "name": "Petco Park",
    "nameJa": "ペトコ・パーク",
    "aliases": [
      { "name": "Petco Park", "lang": "en", "kind": "wikipedia", "revision": 1377977726, "source": "en.wikipedia.org" },
      { "name": "ペトコ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1194586 sitelink" }
    ],
    "team": "San Diego Padres",
    "city": "San Diego",
    "country": "US",
    "lat": 32.70733,
    "lon": -117.15694,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2004,
    "points": [
      [-45, 336],
      [-33, 343],
      [-20, 386],
      [0, 396],
      [20, 391],
      [33, 382],
      [45, 331]
    ],
    "en": {
      "title": "Petco Park",
      "revision": 1377977726
    },
    "walls": [
      {
        "from": 22.5,
        "to": 45,
        "height": 11,
        "last": 2012,
        "place": "right"
      },
      {
        "from": 22.5,
        "to": 45,
        "height": 8,
        "first": 2013,
        "place": "right"
      }
    ]
  },
  {
    "id": "oracle-park",
    "wikidata": "Q298585",
    "name": "Oracle Park",
    "nameJa": "オラクル・パーク",
    "aliases": [
      { "name": "Oracle Park", "lang": "en", "kind": "wikipedia", "revision": 1372223272, "source": "en.wikipedia.org" },
      { "name": "オラクル・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q298585 sitelink" },
      { "name": "SBCパーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q298585 alias" },
      { "name": "パシフィック・ベル・パーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q298585 alias" },
      { "name": "AT&Tパーク", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q298585 alias" },
      { "name": "Pacific Bell Park", "lang": "en", "kind": "sponsor", "from": 2000, "to": 2003, "source": "en.wikipedia.org revision 1372223272" },
      { "name": "SBC Park", "lang": "en", "kind": "sponsor", "from": 2004, "to": 2005, "source": "en.wikipedia.org revision 1372223272" },
      { "name": "AT&T Park", "lang": "en", "kind": "sponsor", "from": 2006, "to": 2018, "source": "en.wikipedia.org revision 1372223272" }
    ],
    "team": "San Francisco Giants",
    "city": "San Francisco",
    "country": "US",
    "lat": 37.77833,
    "lon": -122.38944,
    "league": "MLB",
    "unit": "ft",
    "status": "current",
    "opened": 2000,
    "points": [
      [-45, 339],
      [-33, 354],
      [-20, 399],
      [0, 391],
      [20, 415],
      [33, 365],
      [45, 309]
    ],
    "en": {
      "title": "Oracle Park",
      "revision": 1372223272
    },
    "backstop_ft": 48,
    "walls": [
      {
        "from": -45,
        "to": -20,
        "height": 8,
        "place": "left"
      },
      {
        "from": -20,
        "to": -6,
        "height": 7,
        "place": "center"
      },
      {
        "from": -6,
        "to": 6,
        "height": 10,
        "place": "deadCenter"
      },
      {
        "from": 6,
        "to": 27,
        "height": 20,
        "place": "rightCenter"
      },
      {
        "from": 27,
        "to": 45,
        "height": 24,
        "place": "right"
      }
    ]
  },
  {
    "id": "baker-bowl",
    "wikidata": "Q4849117",
    "name": "Baker Bowl",
    "nameJa": "ベイカー・ボウル",
    "aliases": [
      { "name": "Baker Bowl", "lang": "en", "kind": "wikipedia", "revision": 1375146474, "source": "en.wikipedia.org" },
      { "name": "ベイカー・ボウル", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q4849117 sitelink" },
      { "name": "National League Park", "lang": "en", "kind": "official", "from": 1895, "source": "en.wikipedia.org revision 1375146474" },
      { "name": "Philadelphia Baseball Grounds", "lang": "en", "kind": "former", "from": 1887, "to": 1895, "source": "en.wikipedia.org revision 1375146474" }
    ],
    "team": "Philadelphia Phillies",
    "city": "Philadelphia",
    "country": "US",
    "lat": 39.99306,
    "lon": -75.15583,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1887,
    "closed": 1938,
    "from": 1887,
    "to": 1938,
    "points": [
      [-45, 341],
      [0, 408],
      [22.5, 300],
      [45, 280]
    ],
    "en": {
      "title": "Baker Bowl",
      "revision": 1375146474
    },
    "walls": [
      {
        "from": 22.5,
        "to": 45,
        "height": 60,
        "label": "Baker Wall",
        "place": "right"
      }
    ]
  },
  {
    "id": "exposition-park-pittsburgh",
    "wikidata": "Q5421611",
    "name": "Exposition Park",
    "nameJa": "エクスポジション・パーク (ピッツバーグ)",
    "aliases": [
      { "name": "Exposition Park (Pittsburgh)", "lang": "en", "kind": "wikipedia", "revision": 1372151354, "source": "en.wikipedia.org" },
      { "name": "エクスポジション・パーク (ピッツバーグ)", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q5421611 sitelink" }
    ],
    "team": "Pittsburgh Pirates",
    "city": "Pittsburgh",
    "country": "US",
    "lat": 40.44694,
    "lon": -80.01083,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1890,
    "closed": 1915,
    "from": 1891,
    "to": 1909,
    "points": [
      [-45, 400],
      [0, 450],
      [45, 400]
    ],
    "en": {
      "title": "Exposition Park (Pittsburgh)",
      "revision": 1372151354
    },
    "note": "Three published figures only; the article does not say which of the park's versions they belong to."
  },
  {
    "id": "polo-grounds",
    "wikidata": "Q1276360",
    "name": "Polo Grounds",
    "nameJa": "ポロ・グラウンズ",
    "aliases": [
      { "name": "Polo Grounds", "lang": "en", "kind": "wikipedia", "revision": 1379229018, "source": "en.wikipedia.org" },
      { "name": "ポロ・グラウンズ", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1276360 sitelink" },
      { "name": "Brotherhood Park", "lang": "en", "kind": "former", "from": 1890, "to": 1890, "source": "en.wikipedia.org revision 1379229018" },
      { "name": "Brush Stadium", "lang": "en", "kind": "former", "from": 1911, "to": 1919, "source": "en.wikipedia.org revision 1379229018" },
      { "name": "The Bathtub", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379229018" },
      { "name": "Coogan's Bluff", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379229018" }
    ],
    "team": "New York Giants / New York Yankees / New York Mets",
    "city": "New York",
    "country": "US",
    "lat": 40.83083,
    "lon": -73.9375,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1890,
    "closed": 1963,
    "from": 1891,
    "to": 1963,
    "points": [
      [-45, 279],
      [-37.5, 315],
      [-30, 360],
      [-22.5, 414],
      [-15, 447],
      [-7.5, 455],
      [0, 483],
      [7.5, 455],
      [15, 449],
      [22.5, 395],
      [30, 339],
      [37.5, 294],
      [45, 258]
    ],
    "en": {
      "title": "Polo Grounds",
      "revision": 1379229018
    },
    "periods": [
      {
        "from": 1891,
        "to": 1910,
        "points": [
          [-45, 335],
          [0, 500],
          [45, 335]
        ]
      },
      {
        "from": 1911,
        "to": 1922,
        "points": [
          [-45, 277],
          [0, 433],
          [45, 258]
        ]
      }
    ],
    "note": "The distances are those compiled in the article; 1923 to 1963 is the last fence. Center field is the posted 483 feet.",
    "quirks": [
      {
        "kind": "overhang",
        "from": -45,
        "to": -22.5,
        "depth_ft": 21,
        "first": 1923
      },
      {
        "kind": "bullpen",
        "side": "visitors",
        "angle": -15,
        "feet": 450,
        "first": 1923
      },
      {
        "kind": "bullpen",
        "side": "home",
        "angle": 15,
        "feet": 450,
        "first": 1923
      }
    ]
  },
  {
    "id": "south-end-grounds",
    "wikidata": "Q6646308",
    "name": "South End Grounds",
    "nameJa": "サウス・エンド・グラウンズ",
    "aliases": [
      { "name": "South End Grounds", "lang": "en", "kind": "wikipedia", "revision": 1372231528, "source": "en.wikipedia.org" },
      { "name": "サウス・エンド・グラウンズ", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q6646308 sitelink" },
      { "name": "Walpole Street Grounds", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372231528" },
      { "name": "Grand Pavilion", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372231528" },
      { "name": "Boston Base-Ball Grounds", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372231528" }
    ],
    "team": "Boston Braves",
    "city": "Boston",
    "country": "US",
    "lat": 42.3375,
    "lon": -71.08694,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1871,
    "closed": 1887,
    "from": 1894,
    "to": 1914,
    "points": [
      [-45, 250],
      [-30, 445],
      [-15, 450],
      [0, 440],
      [22.5, 440],
      [45, 255]
    ],
    "en": {
      "title": "South End Grounds",
      "revision": 1372231528
    },
    "note": "The figures are those of the third South End Grounds, built in 1894."
  },
  {
    "id": "huntington-avenue-grounds",
    "wikidata": "Q1056422",
    "name": "Huntington Avenue Grounds",
    "nameJa": "ハンティントン・アベニュー・グラウンズ",
    "aliases": [
      { "name": "Huntington Avenue Grounds", "lang": "en", "kind": "wikipedia", "revision": 1372204570, "source": "en.wikipedia.org" },
      { "name": "ハンティントン・アベニュー・グラウンズ", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1056422 sitelink" },
      { "name": "Huntington Avenue American League Baseball Grounds", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1372204570" }
    ],
    "team": "Boston Red Sox",
    "city": "Boston",
    "country": "US",
    "lat": 42.33889,
    "lon": -71.08889,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1901,
    "closed": 1911,
    "from": 1901,
    "to": 1911,
    "points": [
      [-45, 350],
      [-22.5, 440],
      [0, 635],
      [45, 320]
    ],
    "en": {
      "title": "Huntington Avenue Grounds",
      "revision": 1372204570
    },
    "periods": [
      {
        "from": 1901,
        "to": 1907,
        "points": [
          [-45, 350],
          [-22.5, 440],
          [0, 530],
          [45, 280]
        ]
      }
    ],
    "note": "The centre field fence was moved from 530 to 635 feet and right field from 280 to 320 for 1908. No right-center figure is published.",
    "backstop_ft": 60
  },
  {
    "id": "league-park-cleveland",
    "wikidata": "Q870897",
    "name": "League Park",
    "nameJa": "リーグ・パーク (クリーブランド)",
    "aliases": [
      { "name": "League Park", "lang": "en", "kind": "wikipedia", "revision": 1373475496, "source": "en.wikipedia.org" },
      { "name": "リーグ・パーク (クリーブランド)", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q870897 sitelink" },
      { "name": "Dunn Field", "lang": "en", "kind": "former", "from": 1921, "to": 1927, "source": "en.wikipedia.org revision 1373475496" }
    ],
    "team": "Cleveland Indians",
    "city": "Cleveland",
    "country": "US",
    "lat": 41.51139,
    "lon": -81.64417,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1891,
    "closed": 1946,
    "from": 1901,
    "to": 1946,
    "points": [
      [-45, 375],
      [-30, 415],
      [-15, 460],
      [0, 420],
      [22.5, 340],
      [45, 290]
    ],
    "en": {
      "title": "League Park",
      "revision": 1373475496
    },
    "note": "Deep center, 460 feet, is listed before center field, 420, and is taken left of it."
  },
  {
    "id": "sportsmans-park",
    "wikidata": "Q7579980",
    "name": "Sportsman's Park",
    "nameJa": "スポーツマンズ・パーク",
    "aliases": [
      { "name": "Sportsman's Park", "lang": "en", "kind": "wikipedia", "revision": 1372232220, "source": "en.wikipedia.org" },
      { "name": "スポーツマンズ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q7579980 sitelink" },
      { "name": "Busch Stadium (I)", "lang": "en", "kind": "former", "from": 1953, "to": 1966, "source": "en.wikipedia.org revision 1372232220" }
    ],
    "team": "St. Louis Browns / St. Louis Cardinals",
    "city": "St. Louis",
    "country": "US",
    "lat": 38.65778,
    "lon": -90.22028,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "from": 1902,
    "to": 1966,
    "points": [
      [-45, 351],
      [-37.5, 358],
      [-30, 379],
      [-22.5, 400],
      [-15, 426],
      [-7.5, 425],
      [0, 422],
      [9, 422],
      [18, 405],
      [27, 354],
      [36, 322],
      [45, 310]
    ],
    "en": {
      "title": "Sportsman's Park",
      "revision": 1372232220
    },
    "note": "The deepest corner to the left of center, 426 feet, is taken left of center field, 422.",
    "labels": [
      [
        -45,
        "Left field line"
      ],
      [
        -37.5,
        "Medium left-centre"
      ],
      [
        -30,
        "True left-centre"
      ],
      [
        -22.5,
        "Deep left-centre"
      ],
      [
        -15,
        "Deepest corner, just left of dead centre"
      ],
      [
        -7.5,
        "Just to the right of that corner"
      ],
      [
        0,
        "True centre field"
      ],
      [
        9,
        "Deepest corner, just right of dead centre"
      ],
      [
        18,
        "Deep right-centre"
      ],
      [
        27,
        "True right-centre"
      ],
      [
        36,
        "Medium right-centre"
      ],
      [
        45,
        "Right field line"
      ]
    ],
    "backstop_ft": 68
  },
  {
    "id": "hilltop-park",
    "wikidata": "Q5764114",
    "name": "Hilltop Park",
    "nameJa": "ヒルトップ・パーク",
    "aliases": [
      { "name": "Hilltop Park", "lang": "en", "kind": "wikipedia", "revision": 1372186833, "source": "en.wikipedia.org" },
      { "name": "ヒルトップ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q5764114 sitelink" },
      { "name": "American League Park", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1372186833" }
    ],
    "team": "New York Highlanders / New York Giants",
    "city": "New York",
    "country": "US",
    "lat": 40.84056,
    "lon": -73.94222,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1903,
    "closed": 1912,
    "from": 1903,
    "to": 1912,
    "points": [
      [-45, 365],
      [-22.5, 378],
      [0, 420],
      [22.5, 424],
      [45, 385]
    ],
    "en": {
      "title": "Hilltop Park",
      "revision": 1372186833
    },
    "backstop_ft": 91
  },
  {
    "id": "forbes-field",
    "wikidata": "Q1963954",
    "name": "Forbes Field",
    "nameJa": "フォーブス・フィールド",
    "aliases": [
      { "name": "Forbes Field", "lang": "en", "kind": "wikipedia", "revision": 1372176812, "source": "en.wikipedia.org" },
      { "name": "フォーブス・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1963954 sitelink" },
      { "name": "The House of Thrills", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372176812" },
      { "name": "The Old Lady of Schenley Park", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372176812" },
      { "name": "The Oakland Orchard", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372176812" }
    ],
    "team": "Pittsburgh Pirates",
    "city": "Pittsburgh",
    "country": "US",
    "lat": 40.44118,
    "lon": -79.95255,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1909,
    "closed": 1970,
    "from": 1909,
    "to": 1970,
    "points": [
      [-45, 365],
      [-30, 406],
      [-15, 457],
      [0, 442],
      [15, 436],
      [30, 375],
      [45, 300]
    ],
    "en": {
      "title": "Forbes Field",
      "revision": 1372176812
    },
    "periods": [
      {
        "from": 1909,
        "to": 1911,
        "points": [
          [-45, 360],
          [0, 462],
          [45, 376]
        ]
      }
    ],
    "note": "The final posted distances. Straightaway center was never marked; 442 is the figure some sources give. The original fence of 1909 was 360, 462 and 376 feet.",
    "walls": [
      {
        "from": -45,
        "to": 22.5,
        "height": 12,
        "place": "leftToCenter"
      },
      {
        "from": 22.5,
        "to": 45,
        "height": 9.5,
        "first": 1925,
        "place": "right"
      }
    ]
  },
  {
    "id": "shibe-park",
    "wikidata": "Q7496044",
    "name": "Shibe Park",
    "nameJa": "シャイブ・パーク",
    "aliases": [
      { "name": "Shibe Park", "lang": "en", "kind": "wikipedia", "revision": 1376110848, "source": "en.wikipedia.org" },
      { "name": "シャイブ・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q7496044 sitelink" },
      { "name": "Connie Mack Stadium", "lang": "en", "kind": "former", "from": 1953, "to": 1976, "source": "en.wikipedia.org revision 1376110848" }
    ],
    "team": "Philadelphia Athletics / Philadelphia Phillies",
    "city": "Philadelphia",
    "country": "US",
    "lat": 39.99611,
    "lon": -75.165,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1909,
    "closed": 1970,
    "from": 1909,
    "to": 1970,
    "points": [
      [-45, 334],
      [-22.5, 387],
      [0, 410],
      [22.5, 390],
      [45, 329]
    ],
    "en": {
      "title": "Shibe Park",
      "revision": 1376110848
    },
    "periods": [
      {
        "from": 1909,
        "to": 1924,
        "points": [
          [-45, 378],
          [0, 515],
          [45, 340]
        ]
      },
      {
        "from": 1925,
        "to": 1949,
        "points": [
          [-45, 334],
          [0, 468],
          [45, 331]
        ]
      },
      {
        "from": 1950,
        "to": 1967,
        "points": [
          [-45, 334],
          [-22.5, 420],
          [0, 447],
          [22.5, 405],
          [45, 329]
        ]
      }
    ],
    "note": "Also called Connie Mack Stadium. Opening day of 1909 had left field at 360 feet; center is the deepest corner (515 and 468 feet) in the first two periods.",
    "walls": [
      {
        "from": 22.5,
        "to": 45,
        "height": 12,
        "last": 1934,
        "place": "right"
      },
      {
        "from": 22.5,
        "to": 45,
        "height": 34,
        "first": 1935,
        "place": "right"
      }
    ]
  },
  {
    "id": "comiskey-park",
    "wikidata": "Q1114772",
    "name": "Comiskey Park",
    "nameJa": "コミスキー・パーク",
    "aliases": [
      { "name": "Comiskey Park", "lang": "en", "kind": "wikipedia", "revision": 1379270087, "source": "en.wikipedia.org" },
      { "name": "コミスキー・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1114772 sitelink" },
      { "name": "White Sox Park", "lang": "en", "kind": "former", "from": 1910, "to": 1912, "source": "en.wikipedia.org revision 1379270087" },
      { "name": "White Sox Park", "lang": "en", "kind": "former", "from": 1962, "to": 1975, "source": "en.wikipedia.org revision 1379270087" },
      { "name": "The Baseball Palace of the World", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379270087" },
      { "name": "Old Comiskey Park", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379270087" }
    ],
    "team": "Chicago White Sox",
    "city": "Chicago",
    "country": "US",
    "lat": 41.83167,
    "lon": -87.63417,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1910,
    "closed": 1990,
    "from": 1910,
    "to": 1990,
    "points": [
      [-45, 347],
      [-22.5, 382],
      [0, 409],
      [22.5, 382],
      [45, 347]
    ],
    "en": {
      "title": "Comiskey Park",
      "revision": 1379270087
    },
    "periods": [
      {
        "from": 1910,
        "to": 1985,
        "points": [
          [-45, 363],
          [-22.5, 382],
          [0, 420],
          [22.5, 382],
          [45, 363]
        ]
      }
    ]
  },
  {
    "id": "griffith-stadium",
    "wikidata": "Q5608924",
    "name": "Griffith Stadium",
    "nameJa": "グリフィス・スタジアム",
    "aliases": [
      { "name": "Griffith Stadium", "lang": "en", "kind": "wikipedia", "revision": 1379220233, "source": "en.wikipedia.org" },
      { "name": "グリフィス・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q5608924 sitelink" },
      { "name": "National Park", "lang": "en", "kind": "former", "from": 1911, "to": 1922, "source": "en.wikipedia.org revision 1379220233" }
    ],
    "team": "Washington Senators",
    "city": "Washington",
    "country": "US",
    "lat": 38.9175,
    "lon": -77.02028,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1911,
    "closed": 1961,
    "from": 1911,
    "to": 1961,
    "points": [
      [-45, 388],
      [-22.5, 360],
      [0, 421],
      [22.5, 373],
      [45, 320]
    ],
    "en": {
      "title": "Griffith Stadium",
      "revision": 1379220233
    },
    "note": "The infobox's final figures.",
    "backstop_ft": 61,
    "quirks": [
      {
        "kind": "bullpen",
        "label": "Left-field bullpen",
        "angle": -45,
        "feet": 388,
        "first": 1956,
        "last": 1961
      }
    ],
    "walls": [
      {
        "from": 22.5,
        "to": 45,
        "height": 30,
        "place": "right"
      }
    ]
  },
  {
    "id": "crosley-field",
    "wikidata": "Q3003747",
    "name": "Crosley Field",
    "nameJa": "クロスリー・フィールド",
    "aliases": [
      { "name": "Crosley Field", "lang": "en", "kind": "wikipedia", "revision": 1372078480, "source": "en.wikipedia.org" },
      { "name": "クロスリー・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q3003747 sitelink" },
      { "name": "Redland Field", "lang": "en", "kind": "former", "from": 1912, "to": 1933, "source": "en.wikipedia.org revision 1372078480" },
      { "name": "League Park IV", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372078480" },
      { "name": "Schwab's Field", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372078480" },
      { "name": "The Old Boomerang", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372078480" },
      { "name": "Findlay & Western", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372078480" }
    ],
    "team": "Cincinnati Reds",
    "city": "Cincinnati",
    "country": "US",
    "lat": 39.11667,
    "lon": -84.53528,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1912,
    "closed": 1970,
    "from": 1912,
    "to": 1970,
    "points": [
      [-45, 328],
      [-22.5, 380],
      [0, 387],
      [22.5, 383],
      [45, 366]
    ],
    "en": {
      "title": "Crosley Field",
      "revision": 1372078480
    },
    "periods": [
      {
        "from": 1912,
        "to": 1957,
        "points": [
          [-45, 360],
          [-22.5, 380],
          [0, 420],
          [22.5, 383],
          [45, 360]
        ]
      }
    ],
    "backstop_ft": 78
  },
  {
    "id": "tiger-stadium",
    "wikidata": "Q1750255",
    "name": "Tiger Stadium",
    "nameJa": "タイガー・スタジアム",
    "aliases": [
      { "name": "Tiger Stadium (Detroit)", "lang": "en", "kind": "wikipedia", "revision": 1379484942, "source": "en.wikipedia.org" },
      { "name": "タイガー・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1750255 sitelink" },
      { "name": "Navin Field", "lang": "en", "kind": "former", "from": 1912, "to": 1937, "source": "en.wikipedia.org revision 1379484942" },
      { "name": "Briggs Stadium", "lang": "en", "kind": "former", "from": 1938, "to": 1960, "source": "en.wikipedia.org revision 1379484942" },
      { "name": "The Corner", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379484942" }
    ],
    "team": "Detroit Tigers",
    "city": "Detroit",
    "country": "US",
    "lat": 42.33194,
    "lon": -83.06889,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1912,
    "closed": 2009,
    "from": 1912,
    "to": 1999,
    "points": [
      [-45, 340],
      [-22.5, 365],
      [0, 440],
      [22.5, 370],
      [45, 325]
    ],
    "en": {
      "title": "Tiger Stadium (Detroit)",
      "revision": 1379484942
    },
    "note": "Called Navin Field and Briggs Stadium before.",
    "backstop_ft": 66,
    "quirks": [
      {
        "kind": "overhang",
        "from": 22.5,
        "to": 45,
        "depth_ft": 10,
        "first": 1936
      },
      {
        "kind": "flagpole",
        "angle": -6,
        "feet": 440,
        "height_ft": 125
      }
    ]
  },
  {
    "id": "ebbets-field",
    "wikidata": "Q1278537",
    "name": "Ebbets Field",
    "nameJa": "エベッツ・フィールド",
    "aliases": [
      { "name": "Ebbets Field", "lang": "en", "kind": "wikipedia", "revision": 1378347217, "source": "en.wikipedia.org" },
      { "name": "エベッツ・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1278537 sitelink" }
    ],
    "team": "Brooklyn Dodgers",
    "city": "Brooklyn",
    "country": "US",
    "lat": 40.665,
    "lon": -73.95806,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1913,
    "from": 1913,
    "to": 1957,
    "points": [
      [-45, 348],
      [-22.5, 351],
      [0, 399],
      [22.5, 344],
      [45, 297]
    ],
    "en": {
      "title": "Ebbets Field",
      "revision": 1378347217
    },
    "periods": [
      {
        "from": 1931,
        "to": 1947,
        "points": [
          [-45, 348],
          [-30, 365],
          [-15, 407],
          [0, 399],
          [22.5, 344],
          [45, 297]
        ]
      }
    ],
    "note": "Center field is the posted 399 feet of the notch in deep right-center."
  },
  {
    "id": "braves-field",
    "wikidata": "Q11335096",
    "name": "Braves Field",
    "nameJa": "ブレーブス・フィールド",
    "aliases": [
      { "name": "Braves Field", "lang": "en", "kind": "wikipedia", "revision": 1372863471, "source": "en.wikipedia.org" },
      { "name": "ブレーブス・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q11335096 sitelink" },
      { "name": "National League Park", "lang": "en", "kind": "former", "from": 1936, "to": 1941, "source": "en.wikipedia.org revision 1372863471" },
      { "name": "Boston University Field", "lang": "en", "kind": "former", "from": 1953, "to": 1955, "source": "en.wikipedia.org revision 1372863471" },
      { "name": "The Wigwam", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372863471" },
      { "name": "The Bee Hive", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372863471" }
    ],
    "team": "Boston Braves",
    "city": "Boston",
    "country": "US",
    "lat": 42.35333,
    "lon": -71.11917,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1915,
    "closed": 1952,
    "from": 1915,
    "to": 1952,
    "points": [
      [-45, 337],
      [-22.5, 355],
      [0, 390],
      [22.5, 355],
      [45, 319]
    ],
    "en": {
      "title": "Braves Field",
      "revision": 1372863471
    },
    "note": "The final distances; the article lists the fences as moved almost every year."
  },
  {
    "id": "yankee-stadium-1923",
    "wikidata": "Q675214",
    "name": "Yankee Stadium (1923)",
    "nameJa": "ヤンキー・スタジアム (1923年)",
    "readingJa": "ヤンキー・スタジアム (1923ねん)",
    "aliases": [
      { "name": "Yankee Stadium (1923)", "lang": "en", "kind": "wikipedia", "revision": 1377411197, "source": "en.wikipedia.org" },
      { "name": "ヤンキー・スタジアム (1923年)", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q675214 sitelink" },
      { "name": "The House That Ruth Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377411197" },
      { "name": "The Cathedral of Baseball", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377411197" },
      { "name": "The Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377411197" },
      { "name": "The Bronx Zoo", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377411197" },
      { "name": "Old Yankee Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377411197" },
      { "name": "Yankee Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377411197" }
    ],
    "team": "New York Yankees",
    "city": "New York",
    "country": "US",
    "lat": 40.82694,
    "lon": -73.92806,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1923,
    "closed": 1973,
    "from": 1923,
    "to": 2008,
    "points": [
      [-45, 318],
      [-22.5, 399],
      [0, 408],
      [22.5, 385],
      [45, 314]
    ],
    "en": {
      "title": "Yankee Stadium (1923)",
      "revision": 1377411197
    },
    "note": "The figures after the rebuilding of 1974 and 1975; from 1924 to 1973 the article gives left field at 281 feet and the deepest center at 490.",
    "backstop_ft": 84
  },
  {
    "id": "cleveland-stadium",
    "wikidata": "Q2113078",
    "name": "Cleveland Stadium",
    "nameJa": "クリーブランド・スタジアム",
    "aliases": [
      { "name": "Cleveland Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372955954, "source": "en.wikipedia.org" },
      { "name": "クリーブランド・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q2113078 sitelink" },
      { "name": "Municipal Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372955954" },
      { "name": "Cleveland Municipal Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372955954" }
    ],
    "team": "Cleveland Indians",
    "city": "Cleveland",
    "country": "US",
    "lat": 41.50583,
    "lon": -81.69972,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1931,
    "closed": 1995,
    "from": 1932,
    "to": 1993,
    "points": [
      [-45, 322],
      [-22.5, 385],
      [0, 400],
      [22.5, 385],
      [45, 322]
    ],
    "en": {
      "title": "Cleveland Stadium",
      "revision": 1372955954
    },
    "note": "Also called Cleveland Municipal Stadium.",
    "backstop_ft": 60
  },
  {
    "id": "milwaukee-county-stadium",
    "wikidata": "Q3314569",
    "name": "Milwaukee County Stadium",
    "nameJa": "ミルウォーキー・カウンティ・スタジアム",
    "aliases": [
      { "name": "Milwaukee County Stadium", "lang": "en", "kind": "wikipedia", "revision": 1373618962, "source": "en.wikipedia.org" },
      { "name": "ミルウォーキー・カウンティ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q3314569 sitelink" },
      { "name": "County Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1373618962" }
    ],
    "team": "Milwaukee Braves / Milwaukee Brewers",
    "city": "Milwaukee",
    "country": "US",
    "lat": 43.03028,
    "lon": -87.97361,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1953,
    "closed": 2000,
    "from": 1953,
    "to": 2000,
    "points": [
      [-45, 315],
      [-33.75, 362],
      [-22.5, 382],
      [-11.25, 392],
      [0, 402],
      [11.25, 392],
      [22.5, 382],
      [33.75, 362],
      [45, 315]
    ],
    "en": {
      "title": "Milwaukee County Stadium",
      "revision": 1373618962
    },
    "note": "The White Sox also played some games here in 1968 and 1969.",
    "labels": [
      [
        -45,
        "Left field line"
      ],
      [
        -33.75,
        "Shallow left-centre"
      ],
      [
        -22.5,
        "True left-centre (unposted)"
      ],
      [
        -11.25,
        "Deep left-centre"
      ],
      [
        0,
        "Centre field"
      ],
      [
        11.25,
        "Deep right-centre"
      ],
      [
        22.5,
        "True right-centre (unposted)"
      ],
      [
        33.75,
        "Shallow right-centre"
      ],
      [
        45,
        "Right field line"
      ]
    ],
    "backstop_ft": 60
  },
  {
    "id": "baltimore-memorial-stadium",
    "wikidata": "Q2748739",
    "name": "Memorial Stadium (Baltimore)",
    "nameJa": "メモリアル・スタジアム (ボルチモア)",
    "aliases": [
      { "name": "Baltimore Memorial Stadium", "lang": "en", "kind": "wikipedia", "revision": 1379214788, "source": "en.wikipedia.org" },
      { "name": "メモリアル・スタジアム (ボルチモア)", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q2748739 sitelink" },
      { "name": "The World's Largest Outdoor Insane Asylum", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379214788" },
      { "name": "Memorial Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379214788" }
    ],
    "team": "Baltimore Orioles",
    "city": "Baltimore",
    "country": "US",
    "lat": 39.32944,
    "lon": -76.60139,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1922,
    "closed": 1997,
    "from": 1954,
    "to": 1991,
    "points": [
      [-45, 309],
      [-22.5, 378],
      [0, 405],
      [22.5, 378],
      [45, 309]
    ],
    "en": {
      "title": "Baltimore Memorial Stadium",
      "revision": 1379214788
    },
    "periods": [
      {
        "from": 1954,
        "to": 1979,
        "points": [
          [-45, 309],
          [-22.5, 446],
          [0, 445],
          [22.5, 446],
          [45, 309]
        ]
      },
      {
        "from": 1980,
        "to": 1989,
        "points": [
          [-45, 309],
          [-22.5, 446],
          [0, 405],
          [22.5, 446],
          [45, 309]
        ]
      }
    ],
    "note": "The infobox dates the changes of center field (1980) and of the alleys (1990)."
  },
  {
    "id": "municipal-stadium-kansas-city",
    "wikidata": "Q6936283",
    "name": "Municipal Stadium",
    "nameJa": "カンザスシティ・ミュニシパル・スタジアム",
    "aliases": [
      { "name": "Municipal Stadium (Kansas City, Missouri)", "lang": "en", "kind": "wikipedia", "revision": 1372217632, "source": "en.wikipedia.org" },
      { "name": "カンザスシティ・ミュニシパル・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q6936283 sitelink" },
      { "name": "Muehlebach Field", "lang": "en", "kind": "former", "from": 1923, "to": 1937, "source": "en.wikipedia.org revision 1372217632" },
      { "name": "Ruppert Stadium", "lang": "en", "kind": "former", "from": 1937, "to": 1943, "source": "en.wikipedia.org revision 1372217632" },
      { "name": "Blues Stadium", "lang": "en", "kind": "former", "from": 1943, "to": 1954, "source": "en.wikipedia.org revision 1372217632" }
    ],
    "team": "Kansas City Athletics / Kansas City Royals",
    "city": "Kansas City",
    "country": "US",
    "lat": 39.08583,
    "lon": -94.55694,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1923,
    "closed": 1976,
    "from": 1955,
    "to": 1972,
    "points": [
      [-45, 369],
      [-22.5, 408],
      [0, 421],
      [22.5, 382],
      [45, 338]
    ],
    "en": {
      "title": "Municipal Stadium (Kansas City, Missouri)",
      "revision": 1372217632
    },
    "note": "The article's figures for 1972; those for 1923 (350, 450, 350) are not used."
  },
  {
    "id": "seals-stadium",
    "wikidata": "Q7440659",
    "name": "Seals Stadium",
    "nameJa": "シールズ・スタジアム",
    "aliases": [
      { "name": "Seals Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372229078, "source": "en.wikipedia.org" },
      { "name": "シールズ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q7440659 sitelink" },
      { "name": "The Queen of Concrete", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372229078" }
    ],
    "team": "San Francisco Giants",
    "city": "San Francisco",
    "country": "US",
    "lat": 37.76667,
    "lon": -122.40917,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1931,
    "closed": 1959,
    "from": 1958,
    "to": 1959,
    "points": [
      [-45, 361],
      [-22.5, 364],
      [0, 400],
      [22.5, 397],
      [45, 348]
    ],
    "en": {
      "title": "Seals Stadium",
      "revision": 1372229078
    },
    "periods": [
      {
        "from": 1958,
        "to": 1958,
        "points": [
          [-45, 361],
          [-22.5, 364],
          [0, 410],
          [22.5, 397],
          [45, 348]
        ]
      }
    ]
  },
  {
    "id": "candlestick-park",
    "wikidata": "Q1033076",
    "name": "Candlestick Park",
    "nameJa": "キャンドルスティック・パーク",
    "aliases": [
      { "name": "Candlestick Park", "lang": "en", "kind": "wikipedia", "revision": 1379458213, "source": "en.wikipedia.org" },
      { "name": "キャンドルスティック・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1033076 sitelink" },
      { "name": "3Com Park at Candlestick Point", "lang": "en", "kind": "sponsor", "from": 1995, "to": 2002, "source": "en.wikipedia.org revision 1379458213" },
      { "name": "Monster Park", "lang": "en", "kind": "sponsor", "from": 2004, "to": 2008, "source": "en.wikipedia.org revision 1379458213" },
      { "name": "Harney Stadium", "lang": "en", "kind": "former", "from": 1956, "to": 1959, "source": "en.wikipedia.org revision 1379458213" },
      { "name": "San Francisco Stadium at Candlestick Point", "lang": "en", "kind": "former", "from": 2002, "to": 2004, "source": "en.wikipedia.org revision 1379458213" },
      { "name": "The Stick", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379458213" }
    ],
    "team": "San Francisco Giants",
    "city": "San Francisco",
    "country": "US",
    "lat": 37.71361,
    "lon": -122.38611,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1960,
    "closed": 2015,
    "from": 1960,
    "to": 1999,
    "points": [
      [-45, 335],
      [-22.5, 365],
      [0, 400],
      [22.5, 365],
      [45, 328]
    ],
    "en": {
      "title": "Candlestick Park",
      "revision": 1379458213
    },
    "note": "The later fence; the article also gives the 1960 figures as opened (330, 397, 420, 397, 330 feet), which are not used.",
    "backstop_ft": 66,
    "dugouts": {
      "home": "first",
      "visitors": "third"
    }
  },
  {
    "id": "wrigley-field-los-angeles",
    "wikidata": "Q3297716",
    "name": "Wrigley Field (Los Angeles)",
    "nameJa": "ロサンゼルス・リグレー・フィールド",
    "aliases": [
      { "name": "Wrigley Field (Los Angeles)", "lang": "en", "kind": "wikipedia", "revision": 1373630732, "source": "en.wikipedia.org" },
      { "name": "ロサンゼルス・リグレー・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q3297716 sitelink" },
      { "name": "Wrigley Field", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1373630732" }
    ],
    "team": "Los Angeles Angels",
    "city": "Los Angeles",
    "country": "US",
    "lat": 34.0075,
    "lon": -118.26611,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1925,
    "closed": 1969,
    "from": 1961,
    "to": 1961,
    "points": [
      [-45, 340],
      [-22.5, 345],
      [0, 412],
      [22.5, 345],
      [45, 339]
    ],
    "en": {
      "title": "Wrigley Field (Los Angeles)",
      "revision": 1373630732
    },
    "backstop_ft": 56
  },
  {
    "id": "metropolitan-stadium",
    "wikidata": "Q1415967",
    "name": "Metropolitan Stadium",
    "nameJa": "メトロポリタン・スタジアム",
    "aliases": [
      { "name": "Metropolitan Stadium", "lang": "en", "kind": "wikipedia", "revision": 1376371728, "source": "en.wikipedia.org" },
      { "name": "メトロポリタン・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1415967 sitelink" },
      { "name": "The Met", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376371728" },
      { "name": "Met Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376371728" },
      { "name": "Old Met", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1376371728" }
    ],
    "team": "Minnesota Twins",
    "city": "Bloomington",
    "country": "US",
    "lat": 44.85444,
    "lon": -93.24194,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1956,
    "closed": 1981,
    "from": 1961,
    "to": 1981,
    "points": [
      [-45, 343],
      [-22.5, 365],
      [0, 402],
      [22.5, 370],
      [45, 330]
    ],
    "en": {
      "title": "Metropolitan Stadium",
      "revision": 1376371728
    },
    "backstop_ft": 60,
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 8,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "colt-stadium",
    "wikidata": "Q5149429",
    "name": "Colt Stadium",
    "nameJa": "コルト・スタジアム",
    "aliases": [
      { "name": "Colt Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372077099, "source": "en.wikipedia.org" },
      { "name": "コルト・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q5149429 sitelink" }
    ],
    "team": "Houston Colt .45s",
    "city": "Houston",
    "country": "US",
    "lat": 29.68833,
    "lon": -95.40861,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1962,
    "closed": 1964,
    "from": 1962,
    "to": 1964,
    "points": [
      [-45, 360],
      [-30, 395],
      [-15, 427],
      [0, 420],
      [15, 427],
      [30, 395],
      [45, 360]
    ],
    "en": {
      "title": "Colt Stadium",
      "revision": 1372077099
    }
  },
  {
    "id": "robert-f-kennedy-memorial-stadium",
    "wikidata": "Q153312",
    "name": "Robert F. Kennedy Memorial Stadium",
    "nameJa": "ロバート・F・ケネディ・メモリアル・スタジアム",
    "aliases": [
      { "name": "Robert F. Kennedy Memorial Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372225490, "source": "en.wikipedia.org" },
      { "name": "ロバート・F・ケネディ・メモリアル・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q153312 sitelink" },
      { "name": "District of Columbia Stadium", "lang": "en", "kind": "former", "from": 1961, "to": 1969, "source": "en.wikipedia.org revision 1372225490" },
      { "name": "RFK Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372225490" }
    ],
    "team": "Washington Senators / Washington Nationals",
    "city": "Washington",
    "country": "US",
    "lat": 38.89,
    "lon": -76.97194,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1961,
    "closed": 2019,
    "from": 1962,
    "to": 2007,
    "points": [
      [-45, 335],
      [-22.5, 380],
      [0, 410],
      [22.5, 380],
      [45, 335]
    ],
    "en": {
      "title": "Robert F. Kennedy Memorial Stadium",
      "revision": 1372225490
    },
    "note": "In use for baseball 1962 to 1971 and 2005 to 2007.",
    "backstop_ft": 54
  },
  {
    "id": "shea-stadium",
    "wikidata": "Q1056326",
    "name": "Shea Stadium",
    "nameJa": "シェイ・スタジアム",
    "aliases": [
      { "name": "Shea Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372229796, "source": "en.wikipedia.org" },
      { "name": "シェイ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1056326 sitelink" },
      { "name": "William A. Shea Municipal Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1372229796" },
      { "name": "Flushing Meadow Park Municipal Stadium", "lang": "en", "kind": "former", "from": 1961, "to": 1962, "source": "en.wikipedia.org revision 1372229796" },
      { "name": "Shea", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372229796" }
    ],
    "team": "New York Mets / New York Yankees",
    "city": "New York",
    "country": "US",
    "lat": 40.75556,
    "lon": -73.84806,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1964,
    "closed": 2008,
    "from": 1964,
    "to": 2008,
    "points": [
      [-45, 338],
      [-33.8, 358],
      [-22.5, 371],
      [-11.2, 396],
      [0, 410],
      [11.2, 396],
      [22.5, 371],
      [33.8, 358],
      [45, 338]
    ],
    "en": {
      "title": "Shea Stadium",
      "revision": 1372229796
    },
    "periods": [
      {
        "from": 1964,
        "to": 1977,
        "points": [
          [-45, 341],
          [-33.8, 358],
          [-22.5, 371],
          [-11.2, 396],
          [0, 410],
          [11.2, 396],
          [22.5, 371],
          [33.8, 358],
          [45, 341]
        ]
      }
    ],
    "note": "The Yankees played here in 1974 and 1975."
  },
  {
    "id": "astrodome",
    "wikidata": "Q1025406",
    "name": "Astrodome",
    "nameJa": "アストロドーム",
    "aliases": [
      { "name": "Astrodome", "lang": "en", "kind": "wikipedia", "revision": 1379214658, "source": "en.wikipedia.org" },
      { "name": "アストロドーム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1025406 sitelink" },
      { "name": "Reliant Astrodome", "lang": "en", "kind": "sponsor", "from": 2000, "to": 2014, "source": "en.wikipedia.org revision 1379214658" },
      { "name": "NRG Astrodome", "lang": "en", "kind": "sponsor", "from": 2014, "to": 2026, "source": "en.wikipedia.org revision 1379214658" },
      { "name": "Reliant Astrodome", "lang": "en", "kind": "sponsor", "from": 2026, "source": "en.wikipedia.org revision 1379214658" },
      { "name": "Harris County Domed Stadium", "lang": "en", "kind": "former", "from": 1965, "to": 1965, "source": "en.wikipedia.org revision 1379214658" },
      { "name": "Houston Astrodome", "lang": "en", "kind": "former", "from": 1965, "to": 2000, "source": "en.wikipedia.org revision 1379214658" }
    ],
    "team": "Houston Astros",
    "city": "Houston",
    "country": "US",
    "lat": 29.685,
    "lon": -95.40778,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1965,
    "closed": 2008,
    "from": 1965,
    "to": 1999,
    "points": [
      [-45, 325],
      [-22.5, 375],
      [0, 400],
      [22.5, 375],
      [45, 325]
    ],
    "en": {
      "title": "Astrodome",
      "revision": 1379214658
    },
    "note": "The article's final figures; its original ones (340, 375, 406, 375, 340 feet) are not dated and are not used.",
    "backstop_ft": 52
  },
  {
    "id": "atlanta-fulton-county-stadium",
    "wikidata": "Q641243",
    "name": "Atlanta–Fulton County Stadium",
    "nameJa": "アトランタ・フルトン・カウンティ・スタジアム",
    "aliases": [
      { "name": "Atlanta–Fulton County Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372064804, "source": "en.wikipedia.org" },
      { "name": "アトランタ・フルトン・カウンティ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q641243 sitelink" },
      { "name": "Atlanta Stadium", "lang": "en", "kind": "former", "from": 1965, "to": 1975, "source": "en.wikipedia.org revision 1372064804" },
      { "name": "The Launching Pad", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372064804" },
      { "name": "The House that Aaron Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372064804" },
      { "name": "Fulton County Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372064804" }
    ],
    "team": "Atlanta Braves",
    "city": "Atlanta",
    "country": "US",
    "lat": 33.73944,
    "lon": -84.38944,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1965,
    "closed": 1996,
    "from": 1966,
    "to": 1996,
    "points": [
      [-45, 330],
      [-22.5, 385],
      [0, 402],
      [22.5, 385],
      [45, 330]
    ],
    "en": {
      "title": "Atlanta–Fulton County Stadium",
      "revision": 1372064804
    },
    "periods": [
      {
        "from": 1969,
        "to": 1972,
        "points": [
          [-45, 330],
          [-22.5, 375],
          [0, 402],
          [22.5, 375],
          [45, 330]
        ]
      },
      {
        "from": 1973,
        "to": 1973,
        "points": [
          [-45, 330],
          [-22.5, 375],
          [0, 402],
          [22.5, 385],
          [45, 330]
        ]
      }
    ],
    "note": "The main figures are those of 1966 to 1968 and 1974 to 1996."
  },
  {
    "id": "busch-memorial-stadium",
    "wikidata": "Q1017286",
    "name": "Busch Memorial Stadium",
    "nameJa": "ブッシュ・メモリアル・スタジアム",
    "aliases": [
      { "name": "Busch Memorial Stadium", "lang": "en", "kind": "wikipedia", "revision": 1375705915, "source": "en.wikipedia.org" },
      { "name": "ブッシュ・メモリアル・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1017286 sitelink" },
      { "name": "Civic Center Busch Memorial Stadium", "lang": "en", "kind": "former", "from": 1966, "to": 1981, "source": "en.wikipedia.org revision 1375705915" },
      { "name": "Busch Stadium", "lang": "en", "kind": "former", "from": 1982, "to": 2005, "source": "en.wikipedia.org revision 1375705915" },
      { "name": "Busch Stadium II", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1375705915" },
      { "name": "Baseball Heaven", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1375705915" }
    ],
    "team": "St. Louis Cardinals",
    "city": "St. Louis",
    "country": "US",
    "lat": 38.62389,
    "lon": -90.1925,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "closed": 2005,
    "from": 1966,
    "to": 2005,
    "points": [
      [-45, 330],
      [-22.5, 372],
      [0, 402],
      [22.5, 372],
      [45, 330]
    ],
    "en": {
      "title": "Busch Memorial Stadium",
      "revision": 1375705915
    },
    "periods": [
      {
        "from": 1966,
        "to": 1995,
        "points": [
          [-45, 330],
          [-22.5, 386],
          [0, 414],
          [22.5, 386],
          [45, 330]
        ]
      }
    ],
    "note": "Also called Busch Stadium (II).",
    "backstop_ft": 64
  },
  {
    "id": "oakland-coliseum",
    "wikidata": "Q1147732",
    "name": "Oakland Coliseum",
    "nameJa": "オークランド・アラメダ・カウンティ・コロシアム",
    "aliases": [
      { "name": "Oakland Coliseum", "lang": "en", "kind": "wikipedia", "revision": 1377933344, "source": "en.wikipedia.org" },
      { "name": "オークランド・アラメダ・カウンティ・コロシアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1147732 sitelink" },
      { "name": "Oakland–Alameda County Coliseum", "lang": "en", "kind": "official", "from": 1966, "to": 1998, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "Oakland–Alameda County Coliseum", "lang": "en", "kind": "official", "from": 2008, "to": 2011, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "Oakland–Alameda County Coliseum", "lang": "en", "kind": "official", "from": 2016, "to": 2019, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "Oakland–Alameda County Coliseum", "lang": "en", "kind": "official", "from": 2020, "to": 2020, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "Oakland–Alameda County Coliseum", "lang": "en", "kind": "official", "from": 2023, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "オー・ドットコー・コロシアム", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1147732 label" },
      { "name": "Network Associates Coliseum", "lang": "en", "kind": "sponsor", "from": 1998, "to": 2004, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "McAfee Coliseum", "lang": "en", "kind": "sponsor", "from": 2004, "to": 2008, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "Overstock.com Coliseum", "lang": "en", "kind": "sponsor", "from": 2011, "to": 2011, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "O.co Coliseum", "lang": "en", "kind": "sponsor", "from": 2011, "to": 2016, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "RingCentral Coliseum", "lang": "en", "kind": "sponsor", "from": 2019, "to": 2020, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "RingCentral Coliseum", "lang": "en", "kind": "sponsor", "from": 2020, "to": 2023, "source": "en.wikipedia.org revision 1377933344" },
      { "name": "The Coliseum", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377933344" },
      { "name": "Milk Bowl", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377933344" },
      { "name": "The Black Hole", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377933344" },
      { "name": "Baseball's Last Dive Bar", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377933344" }
    ],
    "team": "Oakland Athletics",
    "city": "Oakland",
    "country": "US",
    "lat": 37.75167,
    "lon": -122.20056,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1966,
    "from": 1968,
    "to": 2024,
    "points": [
      [-45, 330],
      [-22.5, 388],
      [0, 400],
      [22.5, 388],
      [45, 330]
    ],
    "en": {
      "title": "Oakland Coliseum",
      "revision": 1377933344
    },
    "backstop_ft": 60
  },
  {
    "id": "sicks-stadium",
    "wikidata": "Q6127401",
    "name": "Sick's Stadium",
    "nameJa": "シックズ・スタジアム",
    "aliases": [
      { "name": "Sick's Stadium", "lang": "en", "kind": "wikipedia", "revision": 1377791612, "source": "en.wikipedia.org" },
      { "name": "シックズ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q6127401 sitelink" },
      { "name": "Sick's Seattle Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1377791612" }
    ],
    "team": "Seattle Pilots",
    "city": "Seattle",
    "country": "US",
    "lat": 47.57944,
    "lon": -122.29778,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1938,
    "closed": 1976,
    "from": 1969,
    "to": 1969,
    "points": [
      [-45, 305],
      [0, 402],
      [45, 325]
    ],
    "en": {
      "title": "Sick's Stadium",
      "revision": 1377791612
    },
    "note": "The article's figures for 1969; those for 1938 (325, 400, 325) are not used."
  },
  {
    "id": "jarry-park-stadium",
    "wikidata": "Q3495641",
    "name": "Jarry Park Stadium",
    "nameJa": "ジェリー・パーク",
    "localName": "Stade Parc Jarry",
    "localLanguage": "fr",
    "aliases": [
      { "name": "Jarry Park Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372207079, "source": "en.wikipedia.org" },
      { "name": "ジェリー・パーク", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q3495641 sitelink" },
      { "name": "Stade Parc Jarry", "lang": "fr", "kind": "nickname", "source": "en.wikipedia.org revision 1372207079" }
    ],
    "team": "Montreal Expos",
    "city": "Montreal",
    "country": "CA",
    "lat": 45.53278,
    "lon": -73.62694,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1960,
    "closed": 1976,
    "from": 1969,
    "to": 1976,
    "points": [
      [-45, 340],
      [-22.5, 368],
      [0, 420],
      [22.5, 368],
      [45, 340]
    ],
    "en": {
      "title": "Jarry Park Stadium",
      "revision": 1372207079
    },
    "backstop_ft": 60
  },
  {
    "id": "three-rivers-stadium",
    "wikidata": "Q1189339",
    "name": "Three Rivers Stadium",
    "nameJa": "スリー・リバース・スタジアム",
    "aliases": [
      { "name": "Three Rivers Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372243664, "source": "en.wikipedia.org" },
      { "name": "スリー・リバース・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1189339 sitelink" },
      { "name": "The Blast Furnace", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372243664" },
      { "name": "The House that Clemente Built", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372243664" }
    ],
    "team": "Pittsburgh Pirates",
    "city": "Pittsburgh",
    "country": "US",
    "lat": 40.44667,
    "lon": -80.01278,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1970,
    "closed": 2000,
    "from": 1970,
    "to": 2000,
    "points": [
      [-45, 335],
      [-22.5, 375],
      [0, 400],
      [22.5, 375],
      [45, 335]
    ],
    "en": {
      "title": "Three Rivers Stadium",
      "revision": 1372243664
    },
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 10,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "riverfront-stadium",
    "wikidata": "Q153824",
    "name": "Riverfront Stadium",
    "nameJa": "リバーフロント・スタジアム",
    "aliases": [
      { "name": "Riverfront Stadium", "lang": "en", "kind": "wikipedia", "revision": 1380015923, "source": "en.wikipedia.org" },
      { "name": "リバーフロント・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q153824 sitelink" },
      { "name": "Cinergy Field", "lang": "en", "kind": "sponsor", "from": 1996, "to": 2002, "source": "en.wikipedia.org revision 1380015923" },
      { "name": "The Home of the Big Red Machine", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1380015923" },
      { "name": "The Jungle", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1380015923" }
    ],
    "team": "Cincinnati Reds",
    "city": "Cincinnati",
    "country": "US",
    "lat": 39.09667,
    "lon": -84.50833,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1970,
    "closed": 2002,
    "from": 1970,
    "to": 2002,
    "points": [
      [-45, 330],
      [-22.5, 375],
      [0, 404],
      [22.5, 375],
      [45, 330]
    ],
    "en": {
      "title": "Riverfront Stadium",
      "revision": 1380015923
    },
    "backstop_ft": 51,
    "walls": [
      {
        "from": -9,
        "to": 9,
        "height": 40,
        "label": "Black Monster",
        "first": 2001,
        "place": "center"
      }
    ]
  },
  {
    "id": "veterans-stadium",
    "wikidata": "Q1545870",
    "name": "Veterans Stadium",
    "nameJa": "ベテランズ・スタジアム",
    "aliases": [
      { "name": "Veterans Stadium", "lang": "en", "kind": "wikipedia", "revision": 1379233321, "source": "en.wikipedia.org" },
      { "name": "ベテランズ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1545870 sitelink" },
      { "name": "The Vet", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379233321" }
    ],
    "team": "Philadelphia Phillies",
    "city": "Philadelphia",
    "country": "US",
    "lat": 39.90667,
    "lon": -75.17111,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1971,
    "closed": 2004,
    "from": 1971,
    "to": 2003,
    "points": [
      [-45, 330],
      [-22.5, 371],
      [0, 408],
      [22.5, 371],
      [45, 330]
    ],
    "en": {
      "title": "Veterans Stadium",
      "revision": 1379233321
    },
    "backstop_ft": 54
  },
  {
    "id": "arlington-stadium",
    "wikidata": "Q2861657",
    "name": "Arlington Stadium",
    "nameJa": "アーリントン・スタジアム",
    "aliases": [
      { "name": "Arlington Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372064082, "source": "en.wikipedia.org" },
      { "name": "アーリントン・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q2861657 sitelink" },
      { "name": "Turnpike Stadium", "lang": "en", "kind": "former", "from": 1965, "to": 1971, "source": "en.wikipedia.org revision 1372064082" }
    ],
    "team": "Texas Rangers",
    "city": "Arlington",
    "country": "US",
    "lat": 32.75639,
    "lon": -97.08472,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1965,
    "closed": 1993,
    "from": 1972,
    "to": 1993,
    "points": [
      [-45, 330],
      [-22.5, 380],
      [0, 400],
      [22.5, 380],
      [45, 330]
    ],
    "en": {
      "title": "Arlington Stadium",
      "revision": 1372064082
    },
    "backstop_ft": 60
  },
  {
    "id": "exhibition-stadium",
    "wikidata": "Q1383747",
    "name": "Exhibition Stadium",
    "nameJa": "エキシビション・スタジアム",
    "aliases": [
      { "name": "Exhibition Stadium", "lang": "en", "kind": "wikipedia", "revision": 1373389585, "source": "en.wikipedia.org" },
      { "name": "エキシビション・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1383747 sitelink" },
      { "name": "Canadian National Exhibition Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1373389585" },
      { "name": "CNE Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1373389585" },
      { "name": "The Ex", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1373389585" }
    ],
    "team": "Toronto Blue Jays",
    "city": "Toronto",
    "country": "CA",
    "lat": 43.63194,
    "lon": -79.41778,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1959,
    "closed": 1989,
    "from": 1977,
    "to": 1989,
    "points": [
      [-45, 330],
      [-22.5, 375],
      [0, 400],
      [22.5, 375],
      [45, 330]
    ],
    "en": {
      "title": "Exhibition Stadium",
      "revision": 1373389585
    },
    "backstop_ft": 60
  },
  {
    "id": "olympic-stadium-montreal",
    "wikidata": "Q285467",
    "name": "Olympic Stadium",
    "nameJa": "オリンピック・スタジアム (モントリオール)",
    "localName": "Stade olympique",
    "localLanguage": "fr",
    "aliases": [
      { "name": "Olympic Stadium (Montreal)", "lang": "en", "kind": "wikipedia", "revision": 1375638350, "source": "en.wikipedia.org" },
      { "name": "オリンピック・スタジアム (モントリオール)", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q285467 sitelink" },
      { "name": "The Big O", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1375638350" },
      { "name": "The Big Owe", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1375638350" },
      { "name": "Stade olympique", "lang": "fr", "kind": "nickname", "source": "en.wikipedia.org revision 1375638350" }
    ],
    "team": "Montreal Expos",
    "city": "Montreal",
    "country": "CA",
    "lat": 45.55781,
    "lon": -73.55164,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1976,
    "from": 1977,
    "to": 2004,
    "points": [
      [-45, 325],
      [-22.5, 375],
      [0, 404],
      [22.5, 375],
      [45, 325]
    ],
    "en": {
      "title": "Olympic Stadium (Montreal)",
      "revision": 1375638350
    },
    "periods": [
      {
        "from": 1981,
        "to": 1982,
        "points": [
          [-45, 330],
          [-22.5, 375],
          [0, 400],
          [22.5, 375],
          [45, 330]
        ]
      }
    ],
    "note": "The fence of 1977 to 1980 and 1983 on; in 1979 center field was 405 feet."
  },
  {
    "id": "metrodome",
    "wikidata": "Q1072186",
    "name": "Hubert H. Humphrey Metrodome",
    "nameJa": "ヒューバート・H・ハンフリー・メトロドーム",
    "aliases": [
      { "name": "Hubert H. Humphrey Metrodome", "lang": "en", "kind": "wikipedia", "revision": 1378988593, "source": "en.wikipedia.org" },
      { "name": "ヒューバート・H・ハンフリー・メトロドーム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1072186 sitelink" },
      { "name": "Mall of America Field at Hubert H. Humphrey Metrodome", "lang": "en", "kind": "sponsor", "source": "en.wikipedia.org revision 1378988593" },
      { "name": "Metrodome", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1378988593" },
      { "name": "メトロドーム", "lang": "ja", "kind": "nickname", "source": "Wikidata Q1072186 alias" },
      { "name": "HHHメトロドーム", "lang": "ja", "kind": "nickname", "source": "Wikidata Q1072186 alias" }
    ],
    "team": "Minnesota Twins",
    "city": "Minneapolis",
    "country": "US",
    "lat": 44.97389,
    "lon": -93.25806,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1982,
    "closed": 2014,
    "from": 1982,
    "to": 2009,
    "points": [
      [-45, 343],
      [-22.5, 385],
      [0, 408],
      [22.5, 367],
      [45, 327]
    ],
    "en": {
      "title": "Hubert H. Humphrey Metrodome",
      "revision": 1378988593
    },
    "backstop_ft": 60,
    "walls": [
      {
        "from": -45,
        "to": -22.5,
        "height": 7,
        "last": 1984,
        "place": "left"
      },
      {
        "from": -45,
        "to": -22.5,
        "height": 13,
        "first": 1985,
        "last": 1994,
        "place": "left"
      },
      {
        "from": -45,
        "to": -22.5,
        "height": 7,
        "first": 1995,
        "place": "left"
      },
      {
        "from": -22.5,
        "to": 22.5,
        "height": 7,
        "place": "center"
      },
      {
        "from": 22.5,
        "to": 45,
        "height": 23,
        "label": "Baggie",
        "place": "right"
      }
    ]
  },
  {
    "id": "mile-high-stadium",
    "wikidata": "Q1934586",
    "name": "Mile High Stadium",
    "nameJa": "マイル・ハイ・スタジアム",
    "aliases": [
      { "name": "Mile High Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372216043, "source": "en.wikipedia.org" },
      { "name": "マイル・ハイ・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1934586 sitelink" },
      { "name": "Bears Stadium", "lang": "en", "kind": "former", "from": 1948, "to": 1968, "source": "en.wikipedia.org revision 1372216043" }
    ],
    "team": "Colorado Rockies",
    "city": "Denver",
    "country": "US",
    "lat": 39.74611,
    "lon": -105.02167,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1948,
    "closed": 2000,
    "from": 1993,
    "to": 1994,
    "points": [
      [-45, 333],
      [-22.5, 366],
      [0, 423],
      [22.5, 400],
      [45, 370]
    ],
    "en": {
      "title": "Mile High Stadium",
      "revision": 1372216043
    },
    "walls": [
      {
        "from": -22.5,
        "to": 22.5,
        "height": 30,
        "place": "center"
      }
    ]
  },
  {
    "id": "globe-life-park-in-arlington",
    "wikidata": "Q1634492",
    "name": "Choctaw Stadium",
    "nameJa": "チョクトー・スタジアム",
    "aliases": [
      { "name": "Choctaw Stadium", "lang": "en", "kind": "wikipedia", "revision": 1374880883, "source": "en.wikipedia.org" },
      { "name": "チョクトー・スタジアム", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1634492 sitelink" },
      { "name": "アメリクエスト・フィールド・イン・アーリントン", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q1634492 alias" },
      { "name": "Ameriquest Field in Arlington", "lang": "en", "kind": "sponsor", "from": 2005, "to": 2006, "source": "Wikidata Q1634492 P1448" },
      { "name": "Globe Life Park in Arlington", "lang": "en", "kind": "sponsor", "from": 2014, "to": 2021, "source": "Wikidata Q1634492 P1448" },
      { "name": "レンジャーズ・ボールパーク・イン・アーリントン", "lang": "ja", "kind": "former", "source": "Wikidata Q1634492 label" },
      { "name": "The Ballpark in Arlington", "lang": "en", "kind": "former", "from": 1994, "to": 2004, "source": "en.wikipedia.org revision 1374880883" },
      { "name": "Rangers Ballpark in Arlington", "lang": "en", "kind": "former", "from": 2007, "to": 2013, "source": "Wikidata Q1634492 P1448" }
    ],
    "team": "Texas Rangers",
    "city": "Arlington",
    "country": "US",
    "lat": 32.75139,
    "lon": -97.08278,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1994,
    "from": 1994,
    "to": 2019,
    "points": [
      [-45, 332],
      [-22.5, 390],
      [0, 400],
      [22.5, 377],
      [45, 325]
    ],
    "en": {
      "title": "Choctaw Stadium",
      "revision": 1374880883
    },
    "note": "The article is now titled Choctaw Stadium."
  },
  {
    "id": "turner-field",
    "wikidata": "Q1150936",
    "name": "Turner Field",
    "nameJa": "ターナー・フィールド",
    "aliases": [
      { "name": "Turner Field", "lang": "en", "kind": "wikipedia", "revision": 1372246325, "source": "en.wikipedia.org" },
      { "name": "ターナー・フィールド", "lang": "ja", "kind": "wikipedia", "source": "ja.wikipedia.org title, via Wikidata Q1150936 sitelink" },
      { "name": "Centennial Olympic Stadium", "lang": "en", "kind": "former", "from": 1996, "to": 1996, "source": "en.wikipedia.org revision 1372246325" },
      { "name": "The Ted", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372246325" }
    ],
    "team": "Atlanta Braves",
    "city": "Atlanta",
    "country": "US",
    "lat": 33.73528,
    "lon": -84.38944,
    "league": "MLB",
    "unit": "ft",
    "status": "past",
    "opened": 1996,
    "from": 1997,
    "to": 2016,
    "points": [
      [-45, 335],
      [-22.5, 380],
      [0, 400],
      [22.5, 390],
      [45, 330]
    ],
    "en": {
      "title": "Turner Field",
      "revision": 1372246325
    },
    "backstop_ft": 43
  },
  {
    "id": "tokyo-dome",
    "wikidata": "Q733748",
    "name": "Tokyo Dome",
    "nameJa": "東京ドーム",
    "readingJa": "とうきょうドーム",
    "localName": "東京ドーム",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Tokyo Dome", "lang": "en", "kind": "wikipedia", "revision": 1379232526, "source": "en.wikipedia.org" },
      { "name": "東京ドーム", "lang": "ja", "kind": "wikipedia", "revision": 111353030, "reading": "とうきょうドーム", "source": "ja.wikipedia.org" },
      { "name": "The Big Egg", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379232526" },
      { "name": "Tokyo Big Egg", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379232526" },
      { "name": "ビッグエッグ", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 111353030" }
    ],
    "team": "Yomiuri Giants",
    "teamJa": "読売ジャイアンツ",
    "city": "Tokyo",
    "country": "JP",
    "lat": 35.70556,
    "lon": 139.75194,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1988,
    "points": [
      [-45, 100],
      [-22.5, 110],
      [0, 122],
      [22.5, 110],
      [45, 100]
    ],
    "en": {
      "title": "Tokyo Dome",
      "revision": 1379232526
    },
    "ja": {
      "title": "東京ドーム",
      "revision": 111353030
    },
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 4,
        "last": 2009,
        "place": "outfield"
      },
      {
        "from": -45,
        "to": 45,
        "height": 4.24,
        "first": 2010,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "hanshin-koshien-stadium",
    "wikidata": "Q959811",
    "name": "Koshien Stadium",
    "nameJa": "甲子園球場",
    "readingJa": "こうしえんきゅうじょう",
    "localName": "甲子園球場",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Koshien Stadium", "lang": "en", "kind": "wikipedia", "revision": 1374217766, "source": "en.wikipedia.org" },
      { "name": "阪神甲子園球場", "lang": "ja", "kind": "wikipedia", "revision": 111237979, "reading": "はんしんこうしえんきゅうじょう", "source": "ja.wikipedia.org" },
      { "name": "Hanshin Koshien Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1374217766" },
      { "name": "阪神甲子園球場", "lang": "ja", "kind": "official", "reading": "はんしんこうしえんきゅうじょう", "source": "ja.wikipedia.org revision 111237979" },
      { "name": "Koshien Large Sports Field", "lang": "en", "kind": "former", "source": "en.wikipedia.org revision 1374217766" },
      { "name": "甲子園", "lang": "ja", "kind": "nickname", "reading": "こうしえん", "source": "ja.wikipedia.org revision 111237979" }
    ],
    "team": "Hanshin Tigers",
    "teamJa": "阪神タイガース",
    "city": "Nishinomiya",
    "country": "JP",
    "lat": 34.72139,
    "lon": 135.36167,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1924,
    "points": [
      [-45, 95],
      [-22.5, 118],
      [0, 118],
      [22.5, 118],
      [45, 95]
    ],
    "en": {
      "title": "Koshien Stadium",
      "revision": 1374217766
    },
    "ja": {
      "title": "阪神甲子園球場",
      "revision": 111237979
    }
  },
  {
    "id": "meiji-jingu-stadium",
    "wikidata": "Q944559",
    "name": "Meiji Jingu Stadium",
    "nameJa": "神宮球場",
    "readingJa": "じんぐうきゅうじょう",
    "localName": "神宮球場",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Meiji Jingu Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372085507, "source": "en.wikipedia.org" },
      { "name": "明治神宮野球場", "lang": "ja", "kind": "wikipedia", "revision": 111058989, "reading": "めいじじんぐうやきゅうじょう", "source": "ja.wikipedia.org" },
      { "name": "明治神宮野球場", "lang": "ja", "kind": "official", "reading": "めいじじんぐうやきゅうじょう", "source": "ja.wikipedia.org revision 111058989" },
      { "name": "神宮", "lang": "ja", "kind": "nickname", "reading": "じんぐう", "source": "ja.wikipedia.org revision 111058989" },
      { "name": "Jingu Stadium", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1372085507" }
    ],
    "team": "Tokyo Yakult Swallows",
    "teamJa": "東京ヤクルトスワローズ",
    "city": "Tokyo",
    "country": "JP",
    "lat": 35.67457,
    "lon": 139.71714,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1926,
    "points": [
      [-45, 97.5],
      [-22.5, 112.3],
      [0, 120],
      [22.5, 112.3],
      [45, 97.5]
    ],
    "en": {
      "title": "Meiji Jingu Stadium",
      "revision": 1372085507
    },
    "ja": {
      "title": "明治神宮野球場",
      "revision": 111058989
    },
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 3.3,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "yokohama-stadium",
    "wikidata": "Q1148681",
    "name": "Yokohama Stadium",
    "nameJa": "横浜スタジアム",
    "readingJa": "よこはまスタジアム",
    "localName": "横浜スタジアム",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Yokohama Stadium", "lang": "en", "kind": "wikipedia", "revision": 1379493268, "source": "en.wikipedia.org" },
      { "name": "横浜スタジアム", "lang": "ja", "kind": "wikipedia", "revision": 111000229, "reading": "よこはまスタジアム", "source": "ja.wikipedia.org" },
      { "name": "ハマスタ", "lang": "ja", "kind": "nickname", "source": "Wikidata Q1148681 P1813" },
      { "name": "横浜球場", "lang": "ja", "kind": "nickname", "reading": "よこはまきゅうじょう", "source": "Wikidata Q1148681 P1813" }
    ],
    "team": "Yokohama DeNA BayStars",
    "teamJa": "横浜DeNAベイスターズ",
    "city": "Yokohama",
    "country": "JP",
    "lat": 35.44343,
    "lon": 139.6401,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1978,
    "points": [
      [-45, 94.2],
      [-22.5, 111.4],
      [0, 117.7],
      [22.5, 111.4],
      [45, 94.2]
    ],
    "en": {
      "title": "Yokohama Stadium",
      "revision": 1379493268
    },
    "ja": {
      "title": "横浜スタジアム",
      "revision": 111000229
    }
  },
  {
    "id": "vantelin-dome-nagoya",
    "wikidata": "Q929524",
    "name": "Vantelin Dome Nagoya",
    "nameJa": "バンテリンドーム ナゴヤ",
    "localName": "バンテリンドーム ナゴヤ",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Vantelin Dome Nagoya", "lang": "en", "kind": "wikipedia", "revision": 1377205624, "source": "en.wikipedia.org" },
      { "name": "ナゴヤドーム", "lang": "ja", "kind": "wikipedia", "revision": 111136533, "source": "ja.wikipedia.org" },
      { "name": "バンテリンドーム ナゴヤ", "lang": "ja", "kind": "sponsor", "from": 2021, "source": "Wikidata Q929524 P1449" },
      { "name": "ナゴヤドーム", "lang": "ja", "kind": "former", "from": 1997, "to": 2020, "source": "ja.wikipedia.org revision 111136533" },
      { "name": "Nagoya Dome", "lang": "en", "kind": "former", "from": 1997, "to": 2020, "source": "en.wikipedia.org revision 1377205624" }
    ],
    "team": "Chunichi Dragons",
    "teamJa": "中日ドラゴンズ",
    "city": "Nagoya",
    "country": "JP",
    "lat": 35.18598,
    "lon": 136.94731,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1997,
    "points": [
      [-45, 100],
      [-22.5, 110],
      [0, 122],
      [22.5, 110],
      [45, 100]
    ],
    "en": {
      "title": "Vantelin Dome Nagoya",
      "revision": 1377205624
    },
    "ja": {
      "title": "ナゴヤドーム",
      "revision": 111136533
    },
    "note": "Left-center and right-center are 110 m from 2026, when the Home Run Wing was added (116 m before).",
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 4.8,
        "last": 2025,
        "place": "outfield"
      },
      {
        "from": -45,
        "to": 45,
        "height": 3.6,
        "first": 2026,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "mazda-stadium-hiroshima",
    "wikidata": "Q1038647",
    "name": "Mazda Stadium",
    "nameJa": "マツダスタジアム",
    "localName": "マツダスタジアム",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Mazda Stadium", "lang": "en", "kind": "wikipedia", "revision": 1358258868, "source": "en.wikipedia.org" },
      { "name": "MAZDA Zoom-Zoom スタジアム広島", "lang": "ja", "kind": "wikipedia", "revision": 110177362, "reading": "マツダ ズーム・ズーム スタジアムひろしま", "source": "ja.wikipedia.org" },
      { "name": "広島市民球場", "lang": "ja", "kind": "official", "reading": "ひろしましみんきゅうじょう", "source": "ja.wikipedia.org revision 110177362" },
      { "name": "Hiroshima Municipal Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1358258868" },
      { "name": "MAZDA Zoom-Zoom スタジアム広島", "lang": "ja", "kind": "sponsor", "reading": "マツダ ズーム・ズーム スタジアムひろしま", "source": "ja.wikipedia.org revision 110177362" },
      { "name": "Mazda Zoom-Zoom Stadium Hiroshima", "lang": "en", "kind": "sponsor", "source": "en.wikipedia.org revision 1358258868" },
      { "name": "新広島市民球場", "lang": "ja", "kind": "former", "reading": "しんひろしましみんきゅうじょう", "source": "ja.wikipedia.org revision 110177362" },
      { "name": "マツダスタジアム", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 110177362" },
      { "name": "ズムスタ", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 110177362" }
    ],
    "team": "Hiroshima Toyo Carp",
    "teamJa": "広島東洋カープ",
    "city": "Hiroshima",
    "country": "JP",
    "lat": 34.3925,
    "lon": 132.484,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 2009,
    "points": [
      [-45, 101],
      [-22.5, 116],
      [0, 122],
      [22.5, 116],
      [45, 100]
    ],
    "en": {
      "title": "Mazda Stadium",
      "revision": 1358258868
    },
    "ja": {
      "title": "MAZDA Zoom-Zoom スタジアム広島",
      "revision": 110177362
    },
    "walls": [
      {
        "from": -45,
        "to": -22.5,
        "height": 3.6,
        "place": "left"
      },
      {
        "from": -22.5,
        "to": 22.5,
        "height": 2.5,
        "place": "center"
      },
      {
        "from": 22.5,
        "to": 45,
        "height": 3.4,
        "place": "right"
      }
    ]
  },
  {
    "id": "es-con-field-hokkaido",
    "wikidata": "Q96395338",
    "name": "ES CON Field Hokkaido",
    "nameJa": "エスコンフィールド北海道",
    "readingJa": "エスコンフィールドほっかいどう",
    "localName": "エスコンフィールド北海道",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Es Con Field Hokkaido", "lang": "en", "kind": "wikipedia", "revision": 1376475578, "source": "en.wikipedia.org" },
      { "name": "エスコンフィールドHOKKAIDO", "lang": "ja", "kind": "wikipedia", "revision": 110902270, "source": "ja.wikipedia.org" },
      { "name": "エスコンフィールドHOKKAIDO", "lang": "ja", "kind": "official", "source": "ja.wikipedia.org revision 110902270" },
      { "name": "エスコンフィールド北海道", "lang": "ja", "kind": "nickname", "reading": "エスコンフィールドほっかいどう", "source": "ja.wikipedia.org revision 110902270" },
      { "name": "エスコンフィールド", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 110902270" }
    ],
    "team": "Hokkaido Nippon-Ham Fighters",
    "teamJa": "北海道日本ハムファイターズ",
    "city": "Kitahiroshima",
    "country": "JP",
    "lat": 42.99179,
    "lon": 141.5502,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 2023,
    "points": [
      [-45, 97],
      [0, 121],
      [45, 99]
    ],
    "en": {
      "title": "Es Con Field Hokkaido",
      "revision": 1376475578
    },
    "ja": {
      "title": "エスコンフィールドHOKKAIDO",
      "revision": 110902270
    },
    "note": "Three published figures only."
  },
  {
    "id": "rakuten-mobile-park-miyagi",
    "wikidata": "Q489699",
    "name": "Rakuten Mobile Saikyo Park Miyagi",
    "nameJa": "楽天モバイル 最強パーク宮城",
    "readingJa": "らくてんモバイル さいきょうパークみやぎ",
    "localName": "楽天モバイル 最強パーク宮城",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Rakuten Mobile Park Miyagi", "lang": "en", "kind": "wikipedia", "revision": 1371540312, "source": "en.wikipedia.org" },
      { "name": "楽天モバイルパーク宮城", "lang": "ja", "kind": "wikipedia", "revision": 111313121, "reading": "らくてんモバイルパークみやぎ", "source": "ja.wikipedia.org" },
      { "name": "Rakuten Mobile Saikyo Park Miyagi", "lang": "en", "kind": "wikipedia", "revision": 1371540312, "source": "en.wikipedia.org" },
      { "name": "宮城球場", "lang": "ja", "kind": "wikipedia", "revision": 111313121, "reading": "みやぎきゅうじょう", "source": "ja.wikipedia.org" },
      { "name": "宮城球場", "lang": "ja", "kind": "official", "reading": "みやぎきゅうじょう", "source": "ja.wikipedia.org revision 111313121" },
      { "name": "Miyagi Baseball Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1371540312" },
      { "name": "楽天モバイルパーク宮城", "lang": "ja", "kind": "sponsor", "reading": "らくてんモバイルパークみやぎ", "source": "ja.wikipedia.org revision 111313121" },
      { "name": "楽天生命パーク宮城", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111313121" },
      { "name": "楽天Koboスタジアム宮城", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111313121" },
      { "name": "日本製紙クリネックススタジアム宮城", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111313121" },
      { "name": "フルキャストスタジアム宮城", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111313121" },
      { "name": "Fullcast Stadium Miyagi", "lang": "en", "kind": "sponsor", "from": 2005, "to": 2007, "source": "en.wikipedia.org revision 1371540312" },
      { "name": "Kleenex Stadium Miyagi", "lang": "en", "kind": "sponsor", "from": 2008, "to": 2010, "source": "en.wikipedia.org revision 1371540312" },
      { "name": "Nippon Paper Kleenex Stadium Miyagi", "lang": "en", "kind": "sponsor", "from": 2011, "to": 2013, "source": "en.wikipedia.org revision 1371540312" },
      { "name": "Rakuten Kobo Stadium Miyagi", "lang": "en", "kind": "sponsor", "from": 2014, "to": 2016, "source": "en.wikipedia.org revision 1371540312" },
      { "name": "Kobo Park Miyagi", "lang": "en", "kind": "sponsor", "from": 2017, "to": 2017, "source": "en.wikipedia.org revision 1371540312" },
      { "name": "Rakuten Seimei Park Miyagi", "lang": "en", "kind": "sponsor", "from": 2018, "to": 2022, "source": "en.wikipedia.org revision 1371540312" },
      { "name": "Rakuten Mobile Park Miyagi", "lang": "en", "kind": "sponsor", "from": 2023, "to": 2025, "source": "en.wikipedia.org revision 1371540312" },
      { "name": "県営宮城球場", "lang": "ja", "kind": "former", "reading": "けんえいみやぎきゅうじょう", "source": "ja.wikipedia.org revision 111313121" },
      { "name": "Miyagi Baseball Stadium", "lang": "en", "kind": "former", "from": 1950, "to": 2005, "source": "en.wikipedia.org revision 1371540312" }
    ],
    "team": "Tohoku Rakuten Golden Eagles",
    "teamJa": "東北楽天ゴールデンイーグルス",
    "city": "Sendai",
    "country": "JP",
    "lat": 38.25621,
    "lon": 140.9025,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1950,
    "points": [
      [-45, 100.1],
      [-22.5, 110],
      [0, 122],
      [22.5, 112],
      [45, 100.1]
    ],
    "en": {
      "title": "Rakuten Mobile Park Miyagi",
      "revision": 1371540312
    },
    "ja": {
      "title": "楽天モバイルパーク宮城",
      "revision": 111313121
    },
    "note": "Sold under naming rights as Rakuten Mobile Saikyo Park Miyagi."
  },
  {
    "id": "belluna-dome",
    "wikidata": "Q1194822",
    "name": "Belluna Dome",
    "nameJa": "ベルーナドーム",
    "localName": "ベルーナドーム",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Belluna Dome", "lang": "en", "kind": "wikipedia", "revision": 1376434975, "source": "en.wikipedia.org" },
      { "name": "西武ドーム", "lang": "ja", "kind": "wikipedia", "revision": 111316508, "reading": "せいぶドーム", "source": "ja.wikipedia.org" },
      { "name": "メットライフドーム", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111316508" },
      { "name": "インボイスSEIBUドーム", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111316508" },
      { "name": "グッドウィルドーム", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111316508" },
      { "name": "西武プリンスドーム", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111316508" },
      { "name": "Invoice Seibu Dome", "lang": "en", "kind": "sponsor", "from": 2005, "to": 2006, "source": "en.wikipedia.org revision 1376434975" },
      { "name": "Goodwill Dome", "lang": "en", "kind": "sponsor", "from": 2007, "to": 2007, "source": "en.wikipedia.org revision 1376434975" },
      { "name": "Seibu Prince Dome", "lang": "en", "kind": "sponsor", "from": 2015, "to": 2017, "source": "en.wikipedia.org revision 1376434975" },
      { "name": "MetLife Dome", "lang": "en", "kind": "sponsor", "from": 2017, "to": 2022, "source": "en.wikipedia.org revision 1376434975" },
      { "name": "ベルーナドーム", "lang": "ja", "kind": "sponsor", "from": 2022, "source": "Wikidata Q1194822 P1448" },
      { "name": "西武ドーム", "lang": "ja", "kind": "former", "reading": "せいぶドーム", "source": "ja.wikipedia.org revision 111316508" },
      { "name": "Seibu Lions Stadium", "lang": "en", "kind": "former", "from": 1979, "to": 1997, "source": "en.wikipedia.org revision 1376434975" },
      { "name": "Seibu Dome", "lang": "en", "kind": "former", "from": 1998, "to": 2004, "source": "en.wikipedia.org revision 1376434975" },
      { "name": "Seibu Dome", "lang": "en", "kind": "former", "from": 2008, "to": 2015, "source": "en.wikipedia.org revision 1376434975" }
    ],
    "team": "Saitama Seibu Lions",
    "teamJa": "埼玉西武ライオンズ",
    "city": "Tokorozawa",
    "country": "JP",
    "lat": 35.7685,
    "lon": 139.4205,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1979,
    "points": [
      [-45, 100],
      [-22.5, 116],
      [0, 122],
      [22.5, 116],
      [45, 100]
    ],
    "en": {
      "title": "Belluna Dome",
      "revision": 1376434975
    },
    "ja": {
      "title": "西武ドーム",
      "revision": 111316508
    },
    "walls": [
      {
        "from": -45,
        "to": -33.75,
        "height": 4.37,
        "first": 1999,
        "place": "left"
      },
      {
        "from": -11.25,
        "to": 11.25,
        "height": 3.2,
        "first": 1999,
        "place": "center"
      },
      {
        "from": 33.75,
        "to": 45,
        "height": 4.37,
        "first": 1999,
        "place": "right"
      }
    ]
  },
  {
    "id": "zozo-marine-stadium",
    "wikidata": "Q486192",
    "name": "ZOZO Marine Stadium",
    "nameJa": "ZOZOマリンスタジアム",
    "localName": "ZOZOマリンスタジアム",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Zozo Marine Stadium", "lang": "en", "kind": "wikipedia", "revision": 1374482006, "source": "en.wikipedia.org" },
      { "name": "千葉マリンスタジアム", "lang": "ja", "kind": "wikipedia", "revision": 111145226, "reading": "ちばマリンスタジアム", "source": "ja.wikipedia.org" },
      { "name": "Chiba Marine Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1374482006" },
      { "name": "QVCマリンフィールド", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111145226" },
      { "name": "ZOZOマリンスタジアム", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111145226" },
      { "name": "QVC Marine Field", "lang": "en", "kind": "sponsor", "from": 2011, "to": 2016, "source": "en.wikipedia.org revision 1374482006" },
      { "name": "千葉マリンスタジアム", "lang": "ja", "kind": "former", "reading": "ちばマリンスタジアム", "source": "ja.wikipedia.org revision 111145226" },
      { "name": "Marine Stadium", "lang": "en", "kind": "former", "from": 1992, "to": 2011, "source": "en.wikipedia.org revision 1374482006" }
    ],
    "team": "Chiba Lotte Marines",
    "teamJa": "千葉ロッテマリーンズ",
    "city": "Chiba",
    "country": "JP",
    "lat": 35.64524,
    "lon": 140.03092,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1990,
    "points": [
      [-45, 99.5],
      [-22.5, 112.3],
      [0, 122],
      [22.5, 112.3],
      [45, 99.5]
    ],
    "en": {
      "title": "Zozo Marine Stadium",
      "revision": 1374482006
    },
    "ja": {
      "title": "千葉マリンスタジアム",
      "revision": 111145226
    },
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 3.3,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "kyocera-dome-osaka",
    "wikidata": "Q128836",
    "name": "Kyocera Dome Osaka",
    "nameJa": "京セラドーム大阪",
    "readingJa": "きょうセラドームおおさか",
    "localName": "京セラドーム大阪",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Kyocera Dome Osaka", "lang": "en", "kind": "wikipedia", "revision": 1374181588, "source": "en.wikipedia.org" },
      { "name": "大阪ドーム", "lang": "ja", "kind": "wikipedia", "revision": 111044952, "reading": "おおさかドーム", "source": "ja.wikipedia.org" },
      { "name": "大阪ドーム", "lang": "ja", "kind": "former", "from": 1997, "to": 2006, "reading": "おおさかドーム", "source": "ja.wikipedia.org revision 111044952" },
      { "name": "Osaka Dome", "lang": "en", "kind": "former", "from": 1997, "to": 2006, "source": "en.wikipedia.org revision 1374181588" },
      { "name": "京セラドーム", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 111044952" },
      { "name": "Kyocera Dome", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1374181588" }
    ],
    "team": "Orix Buffaloes",
    "teamJa": "オリックス・バファローズ",
    "city": "Osaka",
    "country": "JP",
    "lat": 34.6693,
    "lon": 135.4761,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1997,
    "points": [
      [-45, 100],
      [-22.5, 116],
      [0, 122],
      [22.5, 116],
      [45, 100]
    ],
    "en": {
      "title": "Kyocera Dome Osaka",
      "revision": 1374181588
    },
    "ja": {
      "title": "大阪ドーム",
      "revision": 111044952
    },
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 4.2,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "mizuho-paypay-dome-fukuoka",
    "wikidata": "Q1365961",
    "name": "Mizuho PayPay Dome Fukuoka",
    "nameJa": "みずほPayPayドーム福岡",
    "readingJa": "みずほペイペイドームふくおか",
    "localName": "みずほPayPayドーム福岡",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Mizuho PayPay Dome Fukuoka", "lang": "en", "kind": "wikipedia", "revision": 1379848632, "source": "en.wikipedia.org" },
      { "name": "福岡ドーム", "lang": "ja", "kind": "wikipedia", "revision": 111298622, "reading": "ふくおかドーム", "source": "ja.wikipedia.org" },
      { "name": "Fukuoka Dome", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1379848632" },
      { "name": "福岡ドーム", "lang": "ja", "kind": "official", "reading": "ふくおかドーム", "source": "Wikidata Q1365961 P1448" },
      { "name": "Fukuoka Yahoo! JAPAN Dome", "lang": "en", "kind": "sponsor", "from": 2005, "to": 2013, "source": "en.wikipedia.org revision 1379848632" },
      { "name": "Fukuoka Yafuoku! Dome", "lang": "en", "kind": "sponsor", "from": 2013, "to": 2020, "source": "en.wikipedia.org revision 1379848632" },
      { "name": "Fukuoka PayPay Dome", "lang": "en", "kind": "sponsor", "from": 2020, "to": 2024, "source": "en.wikipedia.org revision 1379848632" },
      { "name": "Fukuoka Dome", "lang": "en", "kind": "former", "from": 1993, "to": 2005, "source": "en.wikipedia.org revision 1379848632" },
      { "name": "福岡 Yahoo! JAPANドーム", "lang": "ja", "kind": "former", "from": 2005, "to": 2013, "source": "Wikidata Q1365961 P2561" },
      { "name": "福岡 ヤフオク!ドーム", "lang": "ja", "kind": "former", "from": 2013, "to": 2020, "source": "Wikidata Q1365961 P2561" },
      { "name": "福岡PayPayドーム", "lang": "ja", "kind": "former", "from": 2020, "to": 2024, "source": "Wikidata Q1365961 P2561" },
      { "name": "PayPay Dome", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1379848632" }
    ],
    "team": "Fukuoka SoftBank Hawks",
    "teamJa": "福岡ソフトバンクホークス",
    "city": "Fukuoka",
    "country": "JP",
    "lat": 33.59528,
    "lon": 130.36222,
    "league": "NPB",
    "unit": "m",
    "status": "current",
    "opened": 1993,
    "points": [
      [-45, 100],
      [-22.5, 110],
      [0, 122],
      [22.5, 110],
      [45, 100]
    ],
    "en": {
      "title": "Mizuho PayPay Dome Fukuoka",
      "revision": 1379848632
    },
    "ja": {
      "title": "福岡ドーム",
      "revision": 111298622
    },
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 5.84,
        "last": 2014,
        "place": "outfield"
      },
      {
        "from": -45,
        "to": 45,
        "height": 4.2,
        "first": 2015,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "sapporo-dome",
    "wikidata": "Q494860",
    "name": "Sapporo Dome",
    "nameJa": "札幌ドーム",
    "readingJa": "さっぽろドーム",
    "localName": "札幌ドーム",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Sapporo Dome", "lang": "en", "kind": "wikipedia", "revision": 1374174778, "source": "en.wikipedia.org" },
      { "name": "札幌ドーム", "lang": "ja", "kind": "wikipedia", "revision": 111367977, "reading": "さっぽろドーム", "source": "ja.wikipedia.org" },
      { "name": "大和ハウス プレミストドーム", "lang": "ja", "kind": "sponsor", "from": 2024, "source": "ja.wikipedia.org revision 111367977" },
      { "name": "Daiwa House Premist Dome", "lang": "en", "kind": "sponsor", "from": 2024, "source": "en.wikipedia.org revision 1374174778" },
      { "name": "Hiroba", "lang": "en", "kind": "nickname", "source": "en.wikipedia.org revision 1374174778" }
    ],
    "team": "Hokkaido Nippon-Ham Fighters (2004-2022)",
    "teamJa": "北海道日本ハムファイターズ（2004〜2022年）",
    "city": "Sapporo",
    "country": "JP",
    "lat": 43.01517,
    "lon": 141.40977,
    "league": "NPB",
    "unit": "m",
    "status": "secondary",
    "opened": 2001,
    "points": [
      [-45, 100],
      [-22.5, 116],
      [0, 122],
      [22.5, 116],
      [45, 100]
    ],
    "en": {
      "title": "Sapporo Dome",
      "revision": 1374174778
    },
    "ja": {
      "title": "札幌ドーム",
      "revision": 111367977
    }
  },
  {
    "id": "hotto-motto-field-kobe",
    "wikidata": "Q849183",
    "name": "Hotto Motto Field Kobe",
    "nameJa": "ほっともっとフィールド神戸",
    "readingJa": "ほっともっとフィールドこうべ",
    "localName": "ほっともっとフィールド神戸",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Hotto Motto Field Kobe", "lang": "en", "kind": "wikipedia", "revision": 1373207639, "source": "en.wikipedia.org" },
      { "name": "神戸総合運動公園野球場", "lang": "ja", "kind": "wikipedia", "revision": 111289486, "reading": "こうべそうごううんどうこうえんやきゅうじょう", "source": "ja.wikipedia.org" },
      { "name": "神戸総合運動公園野球場", "lang": "ja", "kind": "official", "reading": "こうべそうごううんどうこうえんやきゅうじょう", "source": "ja.wikipedia.org revision 111289486" },
      { "name": "Kobe Sports Park Baseball Stadium", "lang": "en", "kind": "official", "source": "en.wikipedia.org revision 1373207639" },
      { "name": "グリーンスタジアム神戸", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111289486" },
      { "name": "Yahoo!BBスタジアム", "lang": "ja", "kind": "sponsor", "source": "ja.wikipedia.org revision 111289486" },
      { "name": "神戸スカイマークスタジアム", "lang": "ja", "kind": "sponsor", "source": "Wikidata Q849183 alias" }
    ],
    "team": "Orix Buffaloes (second park)",
    "teamJa": "オリックス・バファローズ（準本拠地）",
    "city": "Kobe",
    "country": "JP",
    "lat": 34.68066,
    "lon": 135.07342,
    "league": "NPB",
    "unit": "m",
    "status": "secondary",
    "opened": 1988,
    "points": [
      [-45, 99.1],
      [-22.5, 117],
      [0, 122],
      [22.5, 117],
      [45, 99.1]
    ],
    "en": {
      "title": "Hotto Motto Field Kobe",
      "revision": 1373207639
    },
    "ja": {
      "title": "神戸総合運動公園野球場",
      "revision": 111289486
    },
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 3.2,
        "last": 2002,
        "place": "outfield"
      },
      {
        "from": -45,
        "to": 45,
        "height": 2.45,
        "first": 2003,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "hiroshima-municipal-stadium",
    "wikidata": "Q8012748",
    "name": "Hiroshima Municipal Stadium (original)",
    "nameJa": "旧広島市民球場",
    "readingJa": "きゅうひろしましみんきゅうじょう",
    "localName": "旧広島市民球場",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Hiroshima Municipal Stadium (1957)", "lang": "en", "kind": "wikipedia", "source": "en.wikipedia.org title, via Wikidata Q8012748 sitelink" },
      { "name": "広島市民球場 (初代)", "lang": "ja", "kind": "wikipedia", "revision": 111360293, "reading": "ひろしましみんきゅうじょう (しょだい)", "source": "ja.wikipedia.org" },
      { "name": "広島市民球場", "lang": "ja", "kind": "official", "reading": "ひろしましみんきゅうじょう", "source": "ja.wikipedia.org revision 111360293" },
      { "name": "旧広島市民球場", "lang": "ja", "kind": "nickname", "reading": "きゅうひろしましみんきゅうじょう", "source": "ja.wikipedia.org revision 111360293" }
    ],
    "team": "Hiroshima Toyo Carp (1957-2008)",
    "teamJa": "広島東洋カープ（1957〜2008年）",
    "city": "Hiroshima",
    "country": "JP",
    "lat": 34.39698,
    "lon": 132.45496,
    "league": "NPB",
    "unit": "m",
    "status": "past",
    "opened": 1957,
    "closed": 2010,
    "points": [
      [-45, 91.4],
      [-22.5, 109.7],
      [0, 115.8],
      [22.5, 109.7],
      [45, 91.4]
    ],
    "ja": {
      "title": "広島市民球場 (初代)",
      "revision": 111360293
    },
    "walls": [
      {
        "from": -45,
        "to": 45,
        "height": 2.55,
        "place": "outfield"
      }
    ]
  },
  {
    "id": "korakuen-stadium",
    "wikidata": "Q473519",
    "name": "Korakuen Stadium",
    "nameJa": "後楽園球場",
    "readingJa": "こうらくえんきゅうじょう",
    "localName": "後楽園球場",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Korakuen Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372211321, "source": "en.wikipedia.org" },
      { "name": "後楽園球場", "lang": "ja", "kind": "wikipedia", "revision": 111347954, "reading": "こうらくえんきゅうじょう", "source": "ja.wikipedia.org" },
      { "name": "後楽園スタヂアム", "lang": "ja", "kind": "official", "reading": "こうらくえんスタヂアム", "source": "ja.wikipedia.org revision 111347954" }
    ],
    "team": "Yomiuri Giants (1937-1987)",
    "teamJa": "読売ジャイアンツ（1937〜1987年）",
    "city": "Tokyo",
    "country": "JP",
    "lat": 35.70444,
    "lon": 139.75333,
    "league": "NPB",
    "unit": "m",
    "status": "past",
    "opened": 1937,
    "closed": 1987,
    "points": [
      [-45, 87.8],
      [-22.5, 110.1],
      [0, 120.8],
      [22.5, 110.1],
      [45, 87.8]
    ],
    "en": {
      "title": "Korakuen Stadium",
      "revision": 1372211321
    },
    "ja": {
      "title": "後楽園球場",
      "revision": 111347954
    },
    "note": "Measured distances, not the announced 90 m and 120 m."
  },
  {
    "id": "osaka-stadium",
    "wikidata": "Q861117",
    "name": "Osaka Stadium",
    "nameJa": "大阪球場",
    "readingJa": "おおさかきゅうじょう",
    "localName": "大阪球場",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Osaka Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372223620, "source": "en.wikipedia.org" },
      { "name": "大阪スタヂアム", "lang": "ja", "kind": "wikipedia", "revision": 111155388, "reading": "おおさかスタヂアム", "source": "ja.wikipedia.org" },
      { "name": "大阪スタヂアム", "lang": "ja", "kind": "official", "reading": "おおさかスタヂアム", "source": "ja.wikipedia.org revision 111155388" },
      { "name": "大阪球場", "lang": "ja", "kind": "nickname", "reading": "おおさかきゅうじょう", "source": "ja.wikipedia.org revision 111155388" },
      { "name": "ナンバ球場", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 111155388" }
    ],
    "team": "Nankai Hawks (1950-1988)",
    "teamJa": "南海ホークス（1950〜1988年）",
    "city": "Osaka",
    "country": "JP",
    "lat": 34.66147,
    "lon": 135.5018,
    "league": "NPB",
    "unit": "m",
    "status": "past",
    "opened": 1950,
    "closed": 1998,
    "points": [
      [-45, 91.5],
      [-22.5, 109.7],
      [0, 115.8],
      [22.5, 109.7],
      [45, 91.5]
    ],
    "en": {
      "title": "Osaka Stadium",
      "revision": 1372223620
    },
    "ja": {
      "title": "大阪スタヂアム",
      "revision": 111155388
    },
    "walls": [
      {
        "from": -45,
        "to": -33.75,
        "height": 5.5,
        "place": "left"
      },
      {
        "from": -33.75,
        "to": -11.25,
        "height": 3.8,
        "place": "leftCenter"
      },
      {
        "from": -11.25,
        "to": 11.25,
        "height": 3,
        "place": "center"
      },
      {
        "from": 11.25,
        "to": 33.75,
        "height": 3.8,
        "place": "rightCenter"
      },
      {
        "from": 33.75,
        "to": 45,
        "height": 5.5,
        "place": "right"
      }
    ]
  },
  {
    "id": "heiwadai-stadium",
    "wikidata": "Q5365631",
    "name": "Heiwadai Stadium",
    "nameJa": "平和台野球場",
    "readingJa": "へいわだいやきゅうじょう",
    "localName": "平和台野球場",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Heiwadai Stadium", "lang": "en", "kind": "wikipedia", "revision": 1372186109, "source": "en.wikipedia.org" },
      { "name": "平和台野球場", "lang": "ja", "kind": "wikipedia", "revision": 110987269, "reading": "へいわだいやきゅうじょう", "source": "ja.wikipedia.org" },
      { "name": "平和台球場", "lang": "ja", "kind": "nickname", "source": "ja.wikipedia.org revision 110987269" }
    ],
    "team": "Nishitetsu Lions and successors (to 1978)",
    "teamJa": "西鉄ライオンズとその後身（〜1978年）",
    "city": "Fukuoka",
    "country": "JP",
    "lat": 33.58692,
    "lon": 130.38579,
    "league": "NPB",
    "unit": "m",
    "status": "past",
    "opened": 1950,
    "closed": 2000,
    "points": [
      [-45, 92],
      [-22.5, 110],
      [0, 122],
      [22.5, 110],
      [45, 92]
    ],
    "en": {
      "title": "Heiwadai Stadium",
      "revision": 1372186109
    },
    "ja": {
      "title": "平和台野球場",
      "revision": 110987269
    }
  },
  {
    "id": "kawasaki-stadium",
    "wikidata": "Q6379828",
    "name": "Kawasaki Stadium",
    "nameJa": "川崎球場",
    "readingJa": "かわさききゅうじょう",
    "localName": "川崎球場",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Kawasaki Stadium", "lang": "en", "kind": "wikipedia", "source": "en.wikipedia.org title, via Wikidata Q6379828 sitelink" },
      { "name": "川崎球場", "lang": "ja", "kind": "wikipedia", "revision": 110987263, "reading": "かわさききゅうじょう", "source": "ja.wikipedia.org" }
    ],
    "team": "Lotte Orions (1978-1991)",
    "teamJa": "ロッテオリオンズ（1978〜1991年）",
    "city": "Kawasaki",
    "country": "JP",
    "lat": 35.52708,
    "lon": 139.70972,
    "league": "NPB",
    "unit": "m",
    "status": "past",
    "opened": 1952,
    "points": [
      [-45, 89],
      [-22.5, 105],
      [0, 118],
      [22.5, 103],
      [45, 89]
    ],
    "ja": {
      "title": "川崎球場",
      "revision": 110987263
    },
    "note": "Measured distances, not the announced 90 m and 120 m."
  },
  {
    "id": "nagoya-stadium",
    "wikidata": "Q5369853",
    "name": "Nagoya Stadium",
    "nameJa": "ナゴヤ球場",
    "readingJa": "ナゴヤきゅうじょう",
    "localName": "ナゴヤ球場",
    "localLanguage": "ja",
    "aliases": [
      { "name": "Nagoya Stadium", "lang": "en", "kind": "wikipedia", "revision": 1377205638, "source": "en.wikipedia.org" },
      { "name": "ナゴヤ球場", "lang": "ja", "kind": "wikipedia", "revision": 111235188, "reading": "ナゴヤきゅうじょう", "source": "ja.wikipedia.org" },
      { "name": "Chunichi Stadium", "lang": "en", "kind": "former", "source": "en.wikipedia.org revision 1377205638" },
      { "name": "中日球場", "lang": "ja", "kind": "former", "source": "ja.wikipedia.org revision 111235188" },
      { "name": "中日スタヂアム", "lang": "ja", "kind": "former", "source": "ja.wikipedia.org revision 111235188" }
    ],
    "team": "Chunichi Dragons (1948-1996)",
    "teamJa": "中日ドラゴンズ（1948〜1996年）",
    "city": "Nagoya",
    "country": "JP",
    "lat": 35.14735,
    "lon": 136.88673,
    "league": "NPB",
    "unit": "m",
    "status": "past",
    "opened": 1948,
    "points": [
      [-45, 100],
      [0, 122],
      [45, 100]
    ],
    "en": {
      "title": "Nagoya Stadium",
      "revision": 1377205638
    },
    "ja": {
      "title": "ナゴヤ球場",
      "revision": 111235188
    },
    "note": "As rebuilt after the 1998 season."
  }
];
