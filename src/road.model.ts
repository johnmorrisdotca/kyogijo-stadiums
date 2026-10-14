// The road chart's data, read and checked: the scores split into the two sides, who won each match, the words under each score, the rounds in the order played, and
// the sentences and the table that say the same in words. Nothing here draws.
import { esc } from "./format.ts";
import { safeClass } from "./common.ts";
import { KYOGIJO_STRINGS, fill, type KyogijoWords } from "./strings.ts";
import { abbreviate } from "./text.ts";
import type { RoadDecided, RoadFinal, RoadFinalist, RoadGroupMatch, RoadMatch, RoadOptions, RoadRecord, RoadScore, RoadTotals } from "./road.types.ts";
import type { Language, Team } from "./types.ts";

/** Who won a match, from the finalist's side. `unknown` when the score is not a pair of numbers. */
export type Result = "win" | "loss" | "draw" | "unknown";

/** A match as it is drawn: the two scores written, who won, and how it was decided. */
export interface MatchView {
  /** The round's key; empty for a match of the group stage. */
  round: string;
  opponent: Team;
  /** The finalist's score and the opponent's, written. For a score that is one text that could not be split, `whole` is that text and the two are empty. */
  mine: string;
  theirs: string;
  whole?: string;
  result: Result;
  decided: RoadDecided;
  pens?: [string, string];
  /** The words that replace the usual ones under the score, or undefined. */
  note?: string;
  /** Whether the usual words (FT, AET, the shoot-out) are written: always for a knockout match, only when asked for a group match. */
  says: boolean;
  homeFirst?: boolean;
}

/** The chart's data, ready to draw. */
export interface Model {
  language: Language;
  words: KyogijoWords;
  finalists: [Team, Team];
  /** The matches of the group stage, for each finalist. */
  group: [MatchView[], MatchView[]];
  /** The knockout matches for each finalist, by round key. */
  path: [Map<string, MatchView>, Map<string, MatchView>];
  /** The rounds, the earliest first. */
  rounds: string[];
  /** The final, if played: the scores of the first finalist and the second. */
  final?: MatchView;
  label(key: string): string;
  groupLabel: string;
  title: string;
  subtitle: string | undefined;
}

const own = (object: object | undefined, key: string): boolean => object !== undefined && Object.prototype.hasOwnProperty.call(object, key);

/** A number from a number or from text that is one, else undefined. */
export function numeric(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && /^\s*-?\d+(?:\.\d+)?\s*$/.test(value)) return Number(value);
  return undefined;
}

const written = (value: unknown): string => (value === undefined || value === null ? "" : String(value).trim());

/** The two sides of a score. */
function split(score: RoadScore): { mine: string; theirs: string; whole?: string } {
  if (Array.isArray(score) && score.length === 2) return { mine: written(score[0]), theirs: written(score[1]) };
  const text = written(score);
  const parts = /^(\S+?)\s*[-–—:]\s*(\S+)$/.exec(text);
  if (parts !== null) return { mine: parts[1], theirs: parts[2] };
  return { mine: "", theirs: "", whole: text };
}

function resultOf(mine: string, theirs: string, pens: [string, string] | undefined): Result {
  const a = numeric(mine);
  const b = numeric(theirs);
  if (a === undefined || b === undefined) return "unknown";
  if (a !== b) return a > b ? "win" : "loss";
  const p = pens === undefined ? undefined : [numeric(pens[0]), numeric(pens[1])];
  if (p !== undefined && p[0] !== undefined && p[1] !== undefined && p[0] !== p[1]) return p[0] > p[1] ? "win" : "loss";
  return "draw";
}

function pensOf(value: unknown): [string, string] | undefined {
  return Array.isArray(value) && value.length === 2 && written(value[0]) !== "" && written(value[1]) !== "" ? [written(value[0]), written(value[1])] : undefined;
}

function viewOf(m: RoadMatch | RoadGroupMatch | RoadFinal, opponent: Team, round: string, knockout: boolean): MatchView {
  const { mine, theirs, whole } = split(m.score);
  const pens = pensOf(m.pens);
  const decided: RoadDecided = m.decidedBy === "aet" || m.decidedBy === "pens" || m.decidedBy === "ft" ? m.decidedBy : pens !== undefined ? "pens" : "ft";
  const note = typeof m.note === "string" ? m.note.trim() : undefined;
  return {
    round,
    opponent,
    mine,
    theirs,
    ...(whole === undefined ? {} : { whole }),
    result: resultOf(mine, theirs, pens),
    decided,
    ...(pens === undefined ? {} : { pens }),
    ...(note === undefined ? {} : { note }),
    says: knockout || m.decidedBy !== undefined || pens !== undefined,
    ...("homeFirst" in m && typeof m.homeFirst === "boolean" ? { homeFirst: m.homeFirst } : {}),
  };
}

/** The rounds of two paths, the earliest first: a round both have is once, and a round only one has stays after the round before it. */
export function mergeRounds(paths: readonly (readonly string[])[]): string[] {
  const out: string[] = [];
  for (const path of paths) {
    let at = 0;
    for (const key of path) {
      const found = out.indexOf(key);
      if (found >= 0) at = found + 1;
      else {
        out.splice(at, 0, key);
        at += 1;
      }
    }
  }
  return out;
}

const isTeam = (value: unknown): value is Team => typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as Team).name === "string";

/** Read and check what `roadToFinal` was given. */
export function readModel(finalists: readonly RoadFinalist[], options: RoadOptions): Model {
  if (!Array.isArray(finalists) || finalists.length !== 2) throw new TypeError("roadToFinal takes the two finalists as a list of two teams, each with a path");
  const language: Language = options.language === "ja" ? "ja" : "en";
  const words = KYOGIJO_STRINGS[language];
  const w = words.road;
  const teams = finalists as [RoadFinalist, RoadFinalist];
  for (const [i, f] of teams.entries()) {
    if (!isTeam(f)) throw new TypeError(`Finalist ${i + 1} is a team with a name`);
    if (!Array.isArray(f.path)) throw new TypeError(`Finalist ${i + 1} (${f.name}) needs a path: the list of its matches before the final`);
    if (f.group !== undefined && !Array.isArray(f.group)) throw new TypeError(`The group of ${f.name} is a list of matches`);
    for (const m of [...f.path, ...(f.group ?? [])]) {
      if (typeof m !== "object" || m === null || !isTeam(m.opponent) || m.score === undefined || m.score === null) throw new TypeError(`Every match of ${f.name} has an opponent (a team with a name) and a score`);
    }
    for (const m of f.path) if (typeof m.round !== "string" || m.round.trim() === "") throw new TypeError(`Every match of the path of ${f.name} has a round`);
  }
  const path = teams.map((f) => {
    const map = new Map<string, MatchView>();
    for (const m of f.path) map.set(m.round.trim(), viewOf(m, m.opponent, m.round.trim(), true));
    return map;
  }) as Model["path"];
  const group = teams.map((f) => (f.group ?? []).map((m) => viewOf(m, m.opponent, "", false))) as Model["group"];
  const rounds = mergeRounds(teams.map((f) => f.path.map((m) => m.round.trim())));
  const labels = options.labels;
  const model: Model = {
    language,
    words,
    finalists: teams,
    group,
    path,
    rounds,
    label: (key) => (own(labels, key) && typeof labels?.[key] === "string" ? (labels[key] as string) : own(w.rounds, key) ? w.rounds[key as keyof typeof w.rounds] : key),
    groupLabel: typeof options.groupLabel === "string" && options.groupLabel.trim() !== "" ? options.groupLabel.trim() : w.group,
    title: typeof options.title === "string" && options.title.trim() !== "" ? options.title.trim() : w.title,
    subtitle: typeof options.subtitle === "string" && options.subtitle.trim() !== "" ? options.subtitle.trim() : typeof options.title === "string" && options.title.trim() !== "" ? w.title : undefined,
  };
  if (options.final !== undefined) {
    if (typeof options.final !== "object" || options.final === null || options.final.score === undefined || options.final.score === null) throw new TypeError("The final is { score }: the first finalist's score first");
    model.final = viewOf(options.final, teams[1], "final", true);
  }
  return model;
}

/** The words under a score: FT, AET or the shoot-out (the first side's numbers first), a note in their place, or nothing. */
export function decidedWords(view: MatchView, w: KyogijoWords["road"], mineFirst: boolean): string {
  if (view.note !== undefined) return view.note;
  if (!view.says) return "";
  if (view.decided === "aet") return w.aet;
  if (view.decided === "pens" && view.pens !== undefined) return fill(w.pens, mineFirst ? { a: view.pens[0], b: view.pens[1] } : { a: view.pens[1], b: view.pens[0] });
  return view.decided === "pens" ? w.aet : w.ft;
}

/** The score of a match as one text, the first side's first. */
export function scoreText(view: MatchView, mineFirst = true): string {
  if (view.whole !== undefined) return view.whole;
  return mineFirst ? `${view.mine}-${view.theirs}` : `${view.theirs}-${view.mine}`;
}

/** The abbreviation written under a mark: the team's own, else made from its name. */
export function codeOf(team: Team): string {
  return (typeof team.abbr === "string" && team.abbr.trim() !== "" ? team.abbr.trim() : abbreviate(String(team.name ?? ""))).slice(0, 5).toLocaleUpperCase("en");
}

function record(f: RoadFinalist, group: MatchView[], path: Map<string, MatchView>): RoadRecord {
  const all = [...group, ...path.values()];
  let scored = 0;
  let conceded = 0;
  for (const v of all) {
    const a = numeric(v.mine);
    const b = numeric(v.theirs);
    if (a !== undefined && b !== undefined) {
      scored += a;
      conceded += b;
    }
  }
  return { name: f.name, matches: all.length, won: all.filter((v) => v.result === "win").length, drawn: all.filter((v) => v.result === "draw").length, lost: all.filter((v) => v.result === "loss").length, scored, conceded };
}

/** The numbers behind the chart. */
export function totalsOf(model: Model): RoadTotals {
  const [a, b] = model.finalists as [RoadFinalist, RoadFinalist];
  const final = model.final;
  const champion = final === undefined || final.result === "unknown" || final.result === "draw" ? null : final.result === "win" ? a.name : b.name;
  return { finalists: [record(a, model.group[0], model.path[0]), record(b, model.group[1], model.path[1])], rounds: [...model.rounds], played: final !== undefined, champion };
}

/** The chart's accessible name. */
export function nameOf(model: Model): string {
  const heading = [model.title, model.subtitle].filter((part) => part !== undefined).join(model.words.said.sep);
  return fill(model.words.road.name, { a: model.finalists[0].name, b: model.finalists[1].name, title: heading });
}

/** What the chart shows, in a sentence or two. */
export function summaryOf(model: Model): string {
  const w = model.words.road;
  const [a, b] = model.finalists;
  const t = totalsOf(model);
  const parts = [fill(w.summary, { a: a.name, b: b.name, an: t.finalists[0].matches, bn: t.finalists[1].matches })];
  const final = model.final;
  if (final === undefined) parts.push(w.toPlay);
  else {
    parts.push(fill(w.final, { a: a.name, b: b.name, score: scoreText(final), how: decidedWords(final, w, true) || w.ft }));
    if (t.champion !== null) parts.push(fill(w.champion, { name: t.champion }));
  }
  return parts.join(model.words.said.gap);
}

/** One HTML table with a row for every match: the group stage, the knockout rounds in order, and the final. */
export function tableOf(model: Model, options: { className?: string } = {}): string {
  const w = model.words.road;
  const cls = safeClass(options.className) || "ky-table";
  const [a, b] = model.finalists;
  const result = (r: Result): string => (r === "win" ? w.won : r === "loss" ? w.lost : r === "draw" ? w.drew : "");
  const row = (team: Team, round: string, v: MatchView): string =>
    `<tr><th scope="row">${esc(team.name)}</th><td>${esc(round)}</td><td>${esc(v.opponent.name)}</td><td>${esc(scoreText(v))}</td><td>${esc(decidedWords(v, w, true))}</td><td>${esc(result(v.result))}</td></tr>`;
  const rows: string[] = [];
  for (const [i, team] of [a, b].entries()) {
    for (const v of model.group[i]) rows.push(row(team, model.groupLabel, v));
    for (const key of model.rounds) {
      const v = model.path[i].get(key);
      if (v !== undefined) rows.push(row(team, model.label(key), v));
    }
  }
  if (model.final !== undefined) rows.push(row(a, model.label("final"), { ...model.final, opponent: b }));
  const head = [w.tableTeam, w.tableRound, w.tableOpponent, w.tableScore, w.tableDecided, w.tableResult].map((name) => `<th scope="col">${esc(name)}</th>`).join("");
  return `<table class="${cls}" data-kind="road"><caption>${esc(fill(w.caption, { a: a.name, b: b.name }))}</caption><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}
