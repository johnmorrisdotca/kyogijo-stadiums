// The demo's made-up teams, and their emblems: original shapes in plain colours, on a white ground so that they read on any colour.
const disc = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff"/>${inner}</svg>`;

export const EMBLEMS = {
  gull: disc(`<path d="M12 56Q32 18 50 50Q68 18 88 56Q68 46 50 72Q32 46 12 56Z" fill="#1f5fa8"/>`),
  bison: disc(`<path d="M20 42Q26 28 42 34H58Q74 28 80 42Q74 44 70 46Q74 62 62 76Q50 82 38 76Q26 62 30 46Q26 44 20 42Z" fill="#b5452c"/><path d="M20 42Q14 32 22 22M80 42Q86 32 78 22" stroke="#b5452c" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="41" cy="52" r="3" fill="#fff"/><circle cx="59" cy="52" r="3" fill="#fff"/>`),
  owl: disc(`<path d="M24 28L38 38H62L76 28V58Q76 78 50 80Q24 78 24 58Z" fill="#3a2d6b"/><circle cx="38" cy="52" r="8" fill="#fff"/><circle cx="62" cy="52" r="8" fill="#fff"/><path d="M46 62H54L50 70Z" fill="#f2c230"/>`),
  anchor: disc(`<path d="M46 20H54V30H64V38H54V66Q70 64 74 50L68 52L78 40L86 52L80 54Q76 76 50 78Q24 76 20 54L14 52L22 40L32 52L26 50Q30 64 46 66V38H36V30H46Z" fill="#0f7a7a"/>`),
  peak: disc(`<path d="M10 76L38 28L52 52L62 38L90 76Z" fill="#14233f"/><path d="M38 28L46 42L38 40L30 42Z" fill="#fff"/>`),
  bolt: disc(`<path d="M56 12L24 56H44L38 88L76 40H54Z" fill="#e0a100"/>`),
  star: disc(`<path d="M50 14L60 40L88 40L66 57L74 84L50 68L26 84L34 57L12 40L40 40Z" fill="#c8102e"/>`),
  pine: disc(`<path d="M50 12L72 44H62L80 68H58V86H42V68H20L38 44H28Z" fill="#1f6b3c"/>`),
};

/** A made-up game for each sport: [away, home], each a name, a short form, a colour and an emblem. */
export const TEAMS = {
  football: { away: { name: "Harbour City Gulls", abbr: "HCG", color: "#1f5fa8", emblem: "gull" }, home: { name: "Prairie Ridge Bison", abbr: "PRB", color: "#b5452c", emblem: "bison" } },
  hockey: { away: { name: "Northern Owls", abbr: "NOW", color: "#3a2d6b", emblem: "owl" }, home: { name: "Lakeshore Anchors", abbr: "LSA", color: "#0f7a7a", emblem: "anchor" } },
  basketball: { away: { name: "Summit Peaks", abbr: "SMT", color: "#14233f", emblem: "peak" }, home: { name: "Metro Bolts", abbr: "MTB", color: "#c2410c", emblem: "bolt" } },
  soccer: { away: { name: "Valley Rovers", abbr: "VRV", color: "#c8102e", emblem: "star" }, home: { name: "Summit Town", abbr: "SUM", color: "#14233f", emblem: "peak" } },
  curling: { away: { name: "Harbour City Gulls", abbr: "HCG", color: "#1f5fa8", emblem: "gull" }, home: { name: "Prairie Ridge Bison", abbr: "PRB", color: "#b5452c", emblem: "bison" } },
  baseball: { away: { name: "Valley Stars", abbr: "VLY", color: "#c8102e", emblem: "star" }, home: { name: "Coastal Pines", abbr: "CPN", color: "#1f6b3c", emblem: "pine" } },
};

/** The same teams with Japanese names, for the page in Japanese. */
export const TEAMS_JA = {
  football: { away: "港町ガルズ", home: "草原バイソンズ" },
  hockey: { away: "北国オウルズ", home: "湖畔アンカーズ" },
  basketball: { away: "山頂ピークス", home: "メトロボルツ" },
  soccer: { away: "渓谷ローヴァーズ", home: "サミット・タウン" },
  baseball: { away: "渓谷スターズ", home: "海岸パインズ" },
  curling: { away: "港町ガルズ", home: "草原バイソンズ" },
};

export const FAMILIES = { nfl: "football", cfl: "football", ifaf: "football", nhl: "hockey", nba: "basketball", mlb: "baseball", soccer: "soccer", curling: "curling" };

/** Typical scores and a competition line for each sport. */
export const GAMES = {
  nfl: { away: 27, home: 24, status: "final", competition: "Championship Game", date: "Jan 26" },
  cfl: { away: 31, home: 34, status: "final-ot", competition: "Cup Final", date: "Nov 23" },
  ifaf: { away: 14, home: 17, status: "final", competition: "World Championship", date: "Jul 12" },
  nhl: { away: 3, home: 2, status: "final-ot", competition: "Cup Final, Game 7", date: "Jun 24" },
  nba: { away: 108, home: 112, status: "final", competition: "Finals, Game 6", date: "Jun 19" },
  soccer: { away: 2, home: 2, status: "final-pens", competition: "Cup Final", date: "May 24", awayPens: 4, homePens: 2 },
  mlb: { away: 4, home: 6, status: "Bottom 9th", competition: "Division Series", date: "Oct 9" },
  curling: { away: 5, home: 4, status: "end-10", competition: "Final", date: "Mar 8", awayEnds: [0, 1, 0, 2, 0, 0, 1, 0, 1, "X"], homeEnds: [1, 0, 2, 0, 1, 0, 0, 1, 0], hammer: "home" },
};
