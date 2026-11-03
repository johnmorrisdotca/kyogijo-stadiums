// The examples' made-up games in the demo: a small index of them (`examples/games/index.json`), and each game loaded only when a reader asks for it (a Play a game button, or the game section
// coming into sight), once, and played by the package's own `view.replay` and `mount.replay`. Nothing is sent anywhere, and nothing is stored.
//
// The index says which surface each game is played on, so a page offers Play a game only on a surface that has one: a new game is its file and one line of the index, and no code.

/** Where the games are, beside the page. */
export const GAMES_FOLDER = "examples/games/";
/** The index of the games. */
export const GAMES_URL = `${GAMES_FOLDER}index.json`;

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value) => typeof value === "string" && value.trim() !== "";
/**
 * The games of an index, each checked: an `id`, the `sport` (the surface key it is played on), the `file` beside the index, the `frame` of its timeline and its `title` in English and Japanese.
 * An entry that is not whole is left out, and anything that is not an index gives none.
 * @param {unknown} data
 * @returns {{ id: string, sport: string, file: string, frame: string, title: { en: string, ja: string } }[]}
 */
export function readIndex(data) {
  if (data === null || typeof data !== "object" || data.kind !== "kyogijo-games" || data.version !== 1 || !Array.isArray(data.games)) return [];
  const seen = new Set();
  const out = [];
  for (const g of data.games) {
    if (g === null || typeof g !== "object" || !ID.test(g.id ?? "") || seen.has(g.id) || !ID.test(g.sport ?? "") || !/^[a-z0-9-]+\.json$/.test(g.file ?? "") || !text(g.frame)) continue;
    if (g.title === null || typeof g.title !== "object" || !text(g.title.en) || !text(g.title.ja)) continue;
    seen.add(g.id);
    out.push({ id: g.id, sport: g.sport, file: g.file, frame: g.frame, title: { en: g.title.en, ja: g.title.ja } });
  }
  return out;
}

/** The games played on a surface, in the index's order. */
export const gamesFor = (games, sport) => games.filter((g) => g.sport === sport);

let indexing;
/** The index's games, fetched once; none when it cannot be read (a page then offers no game). */
export function loadGames() {
  indexing ??= fetch(GAMES_URL).then((answer) => (answer.ok ? answer.json() : undefined)).then(readIndex, () => []);
  return indexing;
}

const loading = new Map();
/** A game of the index, fetched once: the first of the index when none is named. */
export function loadGame(entry) {
  const file = entry?.file;
  if (file === undefined) return loadGames().then((games) => (games[0] === undefined ? Promise.reject(new Error("no game in the index")) : loadGame(games[0])));
  if (!loading.has(file)) {
    loading.set(file, fetch(`${GAMES_FOLDER}${file}`).then((answer) => {
      if (!answer.ok) throw new Error(`the game did not load: ${answer.status}`);
      return answer.json();
    }));
    // A game that did not load may be asked for again.
    loading.get(file).catch(() => loading.delete(file));
  }
  return loading.get(file);
}

/** How long a period is on the game clock, in seconds: the replay plays it in a few minutes, and the scoreboard over the arena's ice counts a real period's twenty. */
export const PERIOD_SECONDS = 1200;

const labelled = new WeakMap();
/**
 * The game's timeline in a language: each player's name and number as the label a reader hovers, and each goal's scorer. Made once a language, from the same frames.
 * @param {any} game
 * @param {"en" | "ja"} lang
 * @param {(template: string, values: Record<string, string>) => string} goalWords
 */
export function gameTimeline(game, lang, goalWords) {
  let made = labelled.get(game);
  if (made === undefined) labelled.set(game, (made = {}));
  if (made[lang] !== undefined) return made[lang];
  const names = new Map([...game.rosters.home, ...game.rosters.away].map((p) => [p.id, p.name[lang] ?? p.name.en]));
  const frames = game.timeline.frames.map((frame) => ({ t: frame.t, objects: frame.objects.map((o) => (names.has(o.id) ? { ...o, label: names.get(o.id) } : o)) }));
  const events = game.timeline.events.map((e) => (e.kind === "goal" ? { ...e, label: goalWords({ team: game.teams[e.team].name[lang], name: names.get(e.by) ?? "" }) } : e));
  // The periods are the timeline's: the scoreboard hung over the hero's arena shows the period the clock is in and counts its game clock down through them.
  made[lang] = { ...game.timeline, frames, events, periods: game.periods.map((p) => ({ number: p.number, start: p.start, end: p.end, length: PERIOD_SECONDS })) };
  return made[lang];
}

/** The score at a time: the goals at or before it. */
export function scoreAt(game, t) {
  const score = { home: 0, away: 0 };
  for (const e of game.timeline.events) if (e.kind === "goal" && e.t <= t) score[e.team] += 1;
  return score;
}

/** The period a time is in. */
export const periodAt = (game, t) => (game.periods.find((p) => t <= p.end) ?? game.periods.at(-1)).number;

/** The drawing's options for the game: the rink, the two sides with the score at a time, in a language, each side's name at the end it defends in the period (the home side the left in the first and third). */
export function gameOptions(game, lang, score, period = 1) {
  const team = (side) => ({ name: game.teams[side].name[lang], abbr: game.teams[side].abbr, flag: game.teams[side].flag, color: game.teams[side].color, score: score[side] });
  return { sport: game.sport ?? "nhl", language: lang, style: "none", home: team("home"), away: team("away"), status: "live", homeSide: period === 2 ? "right" : "left" };
}

/** The layer colours of the two sides, for a drawing that has no teams of its own (the hero's arena): the discs and the marks take them. */
export const gameColours = (game) => ({ layerHome: game.teams.home.color, layerAway: game.teams.away.color });
