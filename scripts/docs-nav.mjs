// The contents of the documentation site, in the two ways a reader comes to it: by task (what am I doing: starting, drawing a game, building a venue, putting data on
// a surface) and by sport (what do I draw: a rink, a ballpark, a judo mat). Each is data; docs-pages.mjs draws the sidebar from it, docs-hub.mjs the home page and the
// gallery's index, and a test holds every page and every gallery picture named here to exist.
//
// A page is the name of its file in docs/ (`index` is docs/README.md); `ja` is its title in Japanese (the contents, the search and the buttons of the site are in
// Japanese when the reader chooses it; the pages' own words stay in English, one language to a page).

/** The contents by task: groups of pages, in the order of the pager. */
export const NAV = [
  {
    id: "start",
    en: "Start here",
    ja: "最初に読む",
    pages: [
      { slug: "index", ja: "ドキュメントの概要" },
      { slug: "getting-started", ja: "はじめに" },
      { slug: "examples", ja: "コード例" },
      { slug: "surfaces", ja: "競技場" },
      { slug: "score", ja: "得点とレイアウト" },
      { slug: "theming", ja: "テーマと色" },
      { slug: "annotations", ja: "攻撃方向・目盛り・部位名の注釈" },
      { slug: "ranges", ja: "表示範囲とズーム" },
      { slug: "layouts", ja: "レイアウトと背景" },
      { slug: "pageant", ja: "ハーフに広げる旗とエンブレム" },
      { slug: "situation", ja: "試合の状況（人数・走者・ダウン）" },
      { slug: "emblems", ja: "トロフィー・メダル・ボール・エンブレム" },
      { slug: "flags", ja: "国旗（国コードからHataで描く）" },
      { slug: "accessibility", ja: "アクセシビリティ" },
    ],
  },
  {
    id: "sports",
    en: "Sports",
    ja: "競技",
    pages: [
      { slug: "soccer", ja: "サッカー" },
      { slug: "curling", ja: "カーリング" },
      { slug: "courts", ja: "ネット型・ラケット型などのコート競技" },
      { slug: "hardwood", ja: "リアルなバスケットボールコートの床" },
      { slug: "field-sports", ja: "ラクロス、ラグビーなどのフィールド" },
      { slug: "pools", ja: "競泳・水球・飛込・アーティスティックスイミングのプール" },
      { slug: "athletics", ja: "陸上競技場" },
      { slug: "skating", ja: "スケートリンク" },
      { slug: "budo", ja: "武道" },
      { slug: "combat", ja: "格闘技" },
      { slug: "variants", ja: "リーグごとの違い" },
      { slug: "eras", ja: "年ごとの競技場" },
    ],
  },
  {
    id: "venues",
    en: "Venues and 3D",
    ja: "会場と3D表示",
    pages: [
      { slug: "crowd", ja: "スタンドと観客" },
      { slug: "ballparks", ja: "球場" },
      { slug: "grounds", ja: "スタジアム" },
      { slug: "arenas", ja: "アリーナ" },
      { slug: "venues", ja: "実在の会場" },
      { slug: "roof-photos-needed", ja: "屋根の写真が必要な会場" },
      { slug: "stadiums", ja: "実在のスタジアム" },
      { slug: "district", ja: "会場の地区" },
      { slug: "outside", ja: "会場の外の人出" },
      { slug: "gates", ja: "会場のゲート" },
      { slug: "flythrough", ja: "フライスルー" },
      { slug: "special-games", ja: "特設会場での試合" },
      { slug: "atlas", ja: "球場とスタジアムの地図" },
      { slug: "multi", ja: "大会向けレイアウト（複数の競技面）" },
      { slug: "judging", ja: "審判員の配置" },
      { slug: "boards", ja: "競技面に重ねるボード" },
      { slug: "turn", ja: "3D表示" },
      { slug: "quality", ja: "3D表示の画質" },
    ],
  },
  {
    id: "data",
    en: "Data on a surface",
    ja: "競技場の上のデータ",
    pages: [
      { slug: "units", ja: "単位" },
      { slug: "frames", ja: "座標系" },
      { slug: "zones", ja: "ゾーンとルール" },
      { slug: "pointer", ja: "図上の位置を調べる" },
      { slug: "layers", ja: "データレイヤー" },
      { slug: "charts", ja: "すぐ使えるチャート" },
      { slug: "targets", ja: "ゴールマウス・ストライクゾーン・スタンプ" },
      { slug: "team-shape", ja: "チームの形" },
      { slug: "replay", ja: "リプレイ" },
      { slug: "renderers", ja: "レンダラー" },
    ],
  },
  {
    id: "gallery",
    en: "Gallery",
    ja: "ギャラリー",
    pages: [
      { slug: "gallery", ja: "ギャラリーの案内" },
      { slug: "gallery-surfaces", en: "Gallery: surfaces and scores", ja: "ギャラリー：競技場と得点", site: true },
      { slug: "gallery-soccer", en: "Gallery: the soccer pitch", ja: "ギャラリー：サッカーのピッチ", site: true },
      { slug: "gallery-leagues", en: "Gallery: every league's surface", ja: "ギャラリー：リーグごとの競技場", site: true },
      { slug: "gallery-years", en: "Gallery: surfaces through the years", ja: "ギャラリー：年ごとの競技場", site: true },
      { slug: "gallery-places", en: "Gallery: ballparks, grounds and arenas", ja: "ギャラリー：球場、スタジアム、アリーナ", site: true },
      { slug: "gallery-venues", en: "Gallery: the real venues", ja: "ギャラリー：実在の会場", site: true },
      { slug: "gallery-stadiums", en: "Gallery: the real stadiums and a district", ja: "ギャラリー：実在のスタジアムと会場の地区", site: true },
      { slug: "gallery-special", en: "Gallery: special games", ja: "ギャラリー：特設会場での試合", site: true },
      { slug: "gallery-data", en: "Gallery: data on a surface", ja: "ギャラリー：競技場の上のデータ", site: true },
      { slug: "gallery-curling", en: "Gallery: curling", ja: "ギャラリー：カーリング", site: true },
      { slug: "gallery-courts", en: "Gallery: net, racket and court sports", ja: "ギャラリー：ネット型・ラケット型などのコート競技", site: true },
      { slug: "gallery-fields", en: "Gallery: lacrosse, rugby, Australian football, Gaelic games, cricket, hockey and handball", ja: "ギャラリー：ラクロス、ラグビー、オーストラリアンフットボール、ゲーリック・ゲームズ、クリケット、フィールドホッケー、ハンドボール", site: true },
      { slug: "gallery-pools", en: "Gallery: swimming, water polo, diving and artistic swimming", ja: "ギャラリー：競泳、水球、飛込、アーティスティックスイミング", site: true },
      { slug: "gallery-athletics", en: "Gallery: the athletics stadium", ja: "ギャラリー：陸上競技場", site: true },
      { slug: "gallery-skating", en: "Gallery: the skating rinks", ja: "ギャラリー：スケートリンク", site: true },
      { slug: "gallery-budo", en: "Gallery: the budō", ja: "ギャラリー：武道", site: true },
      { slug: "gallery-combat", en: "Gallery: the combat sports", ja: "ギャラリー：格闘技", site: true },
      { slug: "gallery-styling", en: "Gallery: looks and annotations", ja: "ギャラリー：スタイルと注釈", site: true },
      { slug: "gallery-ranges", en: "Gallery: display ranges and zoom", ja: "ギャラリー：表示範囲とズーム", site: true },
      { slug: "gallery-layouts", en: "Gallery: layouts and backgrounds", ja: "ギャラリー：レイアウトと背景", site: true },
      { slug: "gallery-multi", en: "Gallery: tournament layouts", ja: "ギャラリー：大会向けレイアウト", site: true },
      { slug: "gallery-judging", en: "Gallery: judging assignments", ja: "ギャラリー：審判員の配置", site: true },
      { slug: "gallery-boards", en: "Gallery: boards over a surface", ja: "ギャラリー：競技面に重ねるボード", site: true },
      { slug: "gallery-pageant", en: "Gallery: flags on the halves", ja: "ギャラリー：ハーフに広げる旗", site: true },
      { slug: "gallery-situation", en: "Gallery: the situation of a game", ja: "ギャラリー：試合の状況", site: true },
    ],
  },
  {
    id: "compare",
    en: "Compare",
    ja: "比較",
    pages: [{ slug: "compare", ja: "他のパッケージとの比較" }],
  },
  {
    id: "reference",
    en: "Reference",
    ja: "リファレンス",
    pages: [
      { slug: "entry-points", ja: "エントリーポイント" },
      { slug: "limits", ja: "数と上限" },
      { slug: "sources", ja: "寸法の出典" },
      { slug: "references", ja: "参考資料" },
      { slug: "parks", ja: "球場の識別キー" },
      { slug: "strings-ja", ja: "日本語訳の一覧" },
      { slug: "terminology", ja: "用語集" },
      { slug: "architecture", ja: "アーキテクチャ" },
    ],
  },
];

/**
 * The contents by sport. `thumb` is the gallery picture that stands for the sport (an id of a gallery item), `guide` the page that explains it, `gallery` the
 * gallery pages that show it (with `at`, a section of the page, where only part of the page is about the sport) and `more` other pages that matter to it.
 * Names in Japanese are the sports' usual ones.
 */
export const SPORTS = [
  {
    id: "hockey", en: "Hockey", ja: "アイスホッケー", thumb: "score-nhl", guide: "surfaces",
    blurb: "The NHL rink and every league's rinks, the situation of a game, the thirty-two real arenas.",
    pages: [
      { slug: "gallery-surfaces", at: "bare-nhl", en: "The NHL rink, bare and with a score", ja: "NHLのリンク（得点なし・あり）" },
      { slug: "gallery-leagues", at: "hockey", en: "Every league's rink", ja: "リーグごとのリンク" },
      { slug: "gallery-situation", at: "hockey", en: "Power play, empty net, shoot-out", ja: "パワープレー・エンプティネット・シュートアウト" },
      { slug: "gallery-venues", en: "The thirty-two NHL arenas", ja: "NHLの32アリーナ" },
      { slug: "arenas", en: "Arenas, past and present", ja: "アリーナ（過去と現在）" },
      { slug: "gallery-special", at: "ballparks", en: "Winter Classics and other outdoor games", ja: "ウィンタークラシックなど屋外の試合" },
    ],
  },
  {
    id: "basketball", en: "Basketball", ja: "バスケットボール", thumb: "score-nba", guide: "hardwood",
    blurb: "The NBA, FIBA and college courts, a maple floor with grain, the arenas.",
    pages: [
      { slug: "gallery-surfaces", at: "hardwood", en: "The hardwood floor", ja: "木製のコート（ハードウッド）" },
      { slug: "gallery-leagues", at: "basketball", en: "Every league's court", ja: "リーグごとのコート" },
      { slug: "gallery-places", at: "arenas", en: "Arenas", ja: "アリーナ" },
      { slug: "gallery-years", at: "years-nba", en: "The court through the years", ja: "年ごとのコート" },
    ],
  },
  {
    id: "baseball", en: "Baseball", ja: "野球", thumb: "score-mlb", guide: "ballparks",
    blurb: "Ninety-four ballparks with their fences as published, past parks in their seasons, walls and quirks.",
    pages: [
      { slug: "gallery-places", at: "parks", en: "Ballparks", ja: "球場" },
      { slug: "gallery-places", at: "past", en: "Ballparks of the past", ja: "過去の球場" },
      { slug: "gallery-places", at: "walls", en: "Walls and quirks", ja: "フェンスと独特な形状" },
      { slug: "gallery-situation", at: "baseball", en: "Runners, outs and count", ja: "走者・アウト・カウント" },
      { slug: "gallery-leagues", at: "baseball", en: "Little League to the minors", ja: "リトルリーグからマイナーまで" },
    ],
  },
  {
    id: "football", en: "Football", ja: "アメリカンフットボール", thumb: "score-nfl", guide: "variants",
    blurb: "NFL, CFL and IFAF fields, high school sizes, the down and distance, the stadiums.",
    pages: [
      { slug: "gallery-surfaces", at: "bare-nfl", en: "The three fields", ja: "NFL・CFL・IFAFのフィールド" },
      { slug: "gallery-leagues", at: "football", en: "College and high school fields", ja: "大学・高校のフィールド" },
      { slug: "gallery-situation", at: "football", en: "Down, distance and drives", ja: "ダウン・距離・ドライブ" },
      { slug: "gallery-years", at: "years-nfl", en: "The field through the years", ja: "年ごとのフィールド" },
      { slug: "gallery-stadiums", en: "Real stadiums", ja: "実在のスタジアム" },
    ],
  },
  {
    id: "soccer", en: "Soccer", ja: "サッカー", thumb: "score-soccer", guide: "soccer",
    blurb: "A pitch to the Laws of the Game at any size, mowing patterns, goal styles, sixty-four grounds.",
    pages: [
      { slug: "gallery-soccer", en: "Pitches, patterns and goals", ja: "ピッチ・芝の刈り模様・ゴール" },
      { slug: "gallery-places", at: "grounds", en: "Famous grounds", ja: "有名なスタジアム" },
      { slug: "grounds", en: "The sixty-four grounds", ja: "64のスタジアム" },
    ],
  },
  {
    id: "curling", en: "Curling", ja: "カーリング", thumb: "score-curling", guide: "curling",
    blurb: "A sheet from the rulebooks, the house, the stones of an end, a folded view of both houses.",
    pages: [{ slug: "gallery-curling", en: "Sheets, houses, stones and ends", ja: "シート・ハウス・ストーン・エンド" }],
  },
  {
    id: "courts", en: "Net and racket", ja: "ネット型・ラケット型", thumb: "court-tennis", guide: "courts",
    blurb: "Tennis, volleyball, badminton, pickleball, table tennis, padel, squash and more, each in its looks.",
    pages: [
      { slug: "gallery-courts", en: "Twelve sports, their looks and boards", ja: "12競技の見た目とボード" },
      { slug: "gallery-multi", at: "tabletennis", en: "Table tennis on one floor", ja: "一つのフロアに並ぶ卓球台" },
    ],
  },
  {
    id: "fields", en: "Field sports", ja: "フィールド球技", thumb: "fields-rugby", guide: "field-sports",
    blurb: "Lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey and handball.",
    pages: [{ slug: "gallery-fields", en: "Fields, scores and grounds", ja: "フィールド・得点・スタジアム" }],
  },
  {
    id: "water", en: "Water", ja: "水泳・水球・飛込", thumb: "pools-long", guide: "pools",
    blurb: "The 50 m and 25 m pools, water polo, the diving well, artistic swimming, race replays.",
    pages: [{ slug: "gallery-pools", en: "Pools, races and halls", ja: "プール・レース・競技会場" }],
  },
  {
    id: "athletics", en: "Athletics", ja: "陸上競技", thumb: "ath-stadium", guide: "athletics",
    blurb: "The 400 m track with every start worked out, hurdles, the steeplechase, the field events.",
    pages: [{ slug: "gallery-athletics", en: "The stadium, the races and the field events", ja: "競技場・レース・フィールド種目" }],
  },
  {
    id: "skating", en: "Skating", ja: "スケート", thumb: "ska-long", guide: "skating",
    blurb: "Long track, short track and figure skating, each race's lines lane by lane.",
    pages: [{ slug: "gallery-skating", en: "The three rinks and their races", ja: "3種類のリンクとレース" }],
  },
  {
    id: "budo", en: "Budō", ja: "武道", thumb: "budo-judo", guide: "budo",
    blurb: "Judo, karate, kendo, sumo, kyūdō and a dojo of tatami laid as real units, the Kodokan.",
    pages: [
      { slug: "gallery-budo", en: "Areas, rings and the dojo builder", ja: "試合場・土俵・道場ビルダー" },
      { slug: "gallery-judging", en: "Who judges where", ja: "審判員の配置" },
      { slug: "gallery-multi", at: "budo", en: "Judo and karate mats on one floor", ja: "一つのフロアに並ぶ柔道・空手の試合場" },
    ],
  },
  {
    id: "combat", en: "Combat sports", ja: "格闘技", thumb: "mma-cage", guide: "combat",
    blurb: "The MMA cage, boxing rings, wrestling mats and a professional wrestling ring.",
    pages: [{ slug: "gallery-combat", en: "Cage, rings and mats", ja: "ケージ・リング・マット" }],
  },
];

/** Places that are not a sport: real venues and what stands round them. A tile for each, with a still of the 3D view (a file under docs/pictures or docs/images) and the demo page that shows it live. */
export const PLACES = [
  {
    id: "new-york", en: "New York", ja: "ニューヨーク", picture: "pictures/district-midtown-3d-desk", page: "district", at: "new-york-and-montreal",
    demo: "district.html?venues=madison-square-garden&view=3d&viewpoint=main&roof=1", demoEn: "Madison Square Garden in the demo",
    blurb: "Madison Square Garden among the blocks of Midtown, Yankee Stadium, Citi Field, MetLife Stadium and Barclays Center, six venues on one plan.",
  },
  {
    id: "montreal", en: "Montreal", ja: "モントリオール", picture: "pictures/district-montreal-olympic-3d-desk", page: "district", at: "new-york-and-montreal",
    demo: "district.html?venues=olympic-stadium-montreal&view=3d&viewpoint=corner&roof=1", demoEn: "The Olympic Stadium in the demo",
    blurb: "The Olympic Stadium with its 38 ribs and its leaning tower, and the Bell Centre, six kilometres away.",
  },
  {
    id: "saddledome", en: "The Saddledome", ja: "サドルドーム", picture: "images/venues-saddledome-3d-desk", page: "venues", at: "the-scotiabank-saddledome",
    demo: "venues.html?venue=scotiabank-saddledome&view=3d&roof=1", demoEn: "The Saddledome in the demo",
    blurb: "A round building under one saddle-shaped roof: a net of quads on a reverse hyperbolic paraboloid.",
  },
  {
    id: "roof", en: "The roof switch", ja: "屋根の切り替え", picture: "pictures/vancouver-roof-open-3d-desk", page: "district", at: "bc-places-roof-masts-and-gates",
    demo: "district.html?venues=bc-place&view=3d&viewpoint=broadcast&roofopen=1&context=0", demoEn: "BC Place with its roof open",
    blurb: "A Roof pill on every page with a 3D view of a venue: on or off, and open where the roof retracts, kept in the address.",
  },
  {
    id: "quality", en: "Quality levels", ja: "画質のレベル", picture: ["pictures/quality-high-3d-desk", "pictures/quality-medium-3d-desk", "pictures/quality-low-3d-desk"], page: "quality", at: "the-tiers",
    demo: "district.html?venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city&view=3d&quality=auto", demoEn: "Seattle in the demo, with its quality choice",
    blurb: "High, medium and low: how much a district draws, chosen by the frames the view really makes.",
  },
  {
    id: "vancouver", en: "Vancouver", ja: "バンクーバー", picture: "images/district-bc-rogers-3d-desk", page: "district", at: "among-the-streets-of-downtown-vancouver",
    demo: "district.html?venues=bc-place,rogers-arena&view=3d&viewpoint=main&roof=1", demoEn: "BC Place and Rogers Arena in the demo",
    blurb: "BC Place and Rogers Arena on one plan, with the streets between them, every gate, and a crowd outside on the sidewalks.",
  },
  {
    id: "seattle", en: "Seattle", ja: "シアトル", picture: "images/district-seattle-3d-desk", page: "district", at: "seattle-two-neighbours-and-a-city",
    demo: "district.html?venues=t-mobile-park:mlb,lumen-field:nfl,climate-pledge-arena&mode=city&view=3d", demoEn: "Seattle's three venues in the demo",
    blurb: "Lumen Field, T-Mobile Park and Climate Pledge Arena, the city between them, Elliott Bay to the west.",
  },
  {
    id: "tokyo", en: "Tokyo and the Kodokan", ja: "東京と講道館", picture: "pictures/district-kodokan-3d-desk", page: "district", at: "tokyo-dome-city-a-ballpark-and-a-hall",
    demo: "district.html?venues=tokyo-dome,korakuen-hall&view=3d&viewpoint=corner&roof=1", demoEn: "Tokyo Dome City in the demo",
    blurb: "Tokyo Dome, Korakuen Hall and the Kodokan's great dojo in the air on its real floor, among PLATEAU's buildings.",
  },
  {
    id: "halls", en: "Tournament halls", ja: "大会会場のレイアウト", picture: "images/multi-tabletennis-3d-desk", page: "multi", at: "",
    demo: "halls.html?preset=tabletennis-4&view=3d&viewpoint=corner", demoEn: "Four table tennis areas in the demo",
    blurb: "Judo, table tennis and other areas on one floor, to scale, in a hall or a stadium, flat or in 3D.",
  },
  {
    id: "judging", en: "Who judges where", ja: "審判員の配置", picture: "images/judging-broadcast-3d-desk", page: "judging", at: "",
    demo: "judging.html", demoEn: "The judging page",
    blurb: "Each mat's officials by seat, a broadcast view with the officials on a board, and a page to print.",
  },
];

/** The gallery's index is grouped like this: a group of sports or of kinds of picture, with the gallery pages it holds. */
export const GALLERY_GROUPS = [
  { id: "venues", en: "Real venues and districts", ja: "実在の会場と地区", blurb: "The buildings as OpenStreetMap maps them, with a plausible bowl, tiers and roof; districts of several venues on one plan.", pages: ["gallery-venues", "gallery-stadiums", "gallery-places", "gallery-special"] },
  ...SPORTS.map((sport) => ({ id: sport.id, en: sport.en, ja: sport.ja, blurb: sport.blurb, pages: [...new Set(sport.pages.map((page) => page.slug).filter((slug) => slug.startsWith("gallery-") && !["gallery-venues", "gallery-stadiums", "gallery-places", "gallery-special"].includes(slug)))] })).filter((group) => group.pages.length > 0),
  { id: "surfaces", en: "Every surface, and its looks", ja: "すべての競技面と見た目", blurb: "The forty surfaces bare and with a score, every league's rulebook, the seasons, the eight named looks, the ranges, the layouts, the pageant and the situation of a game.", pages: ["gallery-surfaces", "gallery-leagues", "gallery-years", "gallery-styling", "gallery-ranges", "gallery-layouts", "gallery-pageant", "gallery-situation"] },
  { id: "events", en: "Tournaments and boards", ja: "大会とボード", blurb: "Several surfaces on one floor, who judges where, boards laid over a surface.", pages: ["gallery-multi", "gallery-judging", "gallery-boards"] },
  { id: "data", en: "Data on a surface", ja: "競技場の上のデータ", blurb: "Points, heat maps, charts, team shapes, replays and targets.", pages: ["gallery-data"] },
];

/** The words of the sidebar's two views and the other chrome this module is the source of (the docs' own words, laid over the family's). */
export const NAV_WORDS = {
  en: { navByTask: "By task", navBySport: "By sport", navViews: "Contents: choose a view", navGuide: "Guide", navPictures: "Pictures" },
  ja: { navByTask: "目的から探す", navBySport: "競技から探す", navViews: "目次の表示を選ぶ", navGuide: "ガイド", navPictures: "図の一覧" },
};
