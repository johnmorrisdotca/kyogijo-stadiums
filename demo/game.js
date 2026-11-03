// The examples' made-up game in the demo: loaded only when a reader asks for it (the hero's Play game, or the game section coming into sight), once, and played by the package's own
// `view.replay` and `mount.replay`. The file is `examples/games/canada-japan.json`; nothing is sent anywhere, and nothing is stored.

/** Where the game is, beside the page. */
export const GAME_URL = "examples/games/canada-japan.json";

let loading;
/** The game, fetched once. */
export function loadGame() {
  loading ??= fetch(GAME_URL).then((answer) => {
    if (!answer.ok) throw new Error(`the game did not load: ${answer.status}`);
    return answer.json();
  });
  return loading;
}

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
  made[lang] = { ...game.timeline, frames, events };
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
  return { sport: "nhl", language: lang, style: "none", home: team("home"), away: team("away"), status: "live", homeSide: period === 2 ? "right" : "left" };
}

/** The layer colours of the two sides, for a drawing that has no teams of its own (the hero's arena): the discs and the marks take them. */
export const gameColours = (game) => ({ layerHome: game.teams.home.color, layerAway: game.teams.away.color });
