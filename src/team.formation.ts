// The formation layer: a labelled mark for each position of a formation, in the frame the formation is written in, with the players of a lineup on
// them when the layer is given some. Written for this package; the positions are in formations.ts.
import { esc, num } from "./format.ts";
import { FRAMES } from "./frames.ts";
import { formationById, positionName } from "./formations.ts";
import { isNum, newMade, opacityOf, place, unitOfLayer, type Env, type Made } from "./layers.env.ts";
import type { P } from "./layers.marks.ts";
import { fill } from "./strings.ts";
import { attrs, labelOf, paintOf, round, titled, type TeamTable } from "./team.common.ts";
import type { Formation, FormationLayer, FormationPlayer, FormationSport } from "./team.types.ts";
import { FEET_PER } from "./units.ts";

/** The sports whose surface a formation of a sport is drawn on. */
export const SURFACES: Readonly<Record<FormationSport, readonly string[]>> = { soccer: ["soccer"], nhl: ["nhl"], nba: ["nba"], nfl: ["nfl", "ifaf"], mlb: ["mlb"], rugby: ["rugby"], afl: ["afl"], cricket: ["cricket"], volleyball: ["volleyball"], handball: ["handball"], waterpolo: ["waterpolo"], fieldhockey: ["fieldhockey"], netball: ["netball"] };

/** The line of scrimmage the football formations are written for, in the frame `nfl-tracking`. */
const MIDFIELD = 60;

/** The formation a layer names, checked. */
export function formationOf(layer: FormationLayer): Formation {
  const f = typeof layer.formation === "string" ? formationById(layer.formation) : layer.formation;
  if (typeof f !== "object" || f === null || !Array.isArray(f.positions) || f.positions.length === 0 || typeof f.frame !== "string" || !Object.prototype.hasOwnProperty.call(FRAMES, f.frame)) throw new TypeError("a formation of your own has a frame (the name of a registered frame) and a list of positions");
  const seen = new Set<string>();
  for (const p of f.positions) {
    if (!isNum(p.x) || !isNum(p.y) || typeof p.id !== "string" || p.id === "") throw new TypeError("a position has an id and an x and a y");
    if (seen.has(p.id)) throw new RangeError(`Two positions of the formation are called "${p.id}"`);
    seen.add(p.id);
  }
  return f;
}

/** One position, placed. */
export interface Spot {
  id: string;
  name: string;
  /** On the surface, feet. */
  at: P;
  /** In the formation's frame, after the line of scrimmage is moved. */
  given: P;
  player: FormationPlayer | undefined;
}

/** The positions of a layer's formation on the surface, with the players of the lineup on them. */
export function computeFormation(layer: FormationLayer, env: Env): { formation: Formation; spots: Spot[]; unmatched: number } {
  const f = formationOf(layer);
  if (!(SURFACES[f.sport] ?? []).includes(env.o.sport)) throw new RangeError(`The formation "${f.id}" is for ${f.sport}, not ${env.o.sport}`);
  const unit = unitOfLayer(layer, env);
  const language = env.o.language === "ja" ? "ja" : "en";
  // A football formation is written with the ball at midfield; the layer's line of scrimmage is where the ball lies in the frame, whichever way the offence goes.
  const shift = f.sport === "nfl" && isNum(layer.los) ? (layer.attacking === "left" ? FRAMES[f.frame].x[1] - layer.los : layer.los) - MIDFIELD : 0;
  const given = f.positions.map((p): P => [p.x + shift, p.y]);
  const at = place({ ...layer, from: f.frame }, env, given, unit);
  const players = new Map<string, FormationPlayer>();
  let unmatched = 0;
  for (const p of layer.data ?? []) {
    if (typeof p === "object" && p !== null && f.positions.some((q) => q.id === p.position)) players.set(p.position, p);
    else unmatched += 1;
  }
  const spots = f.positions.map((p, i): Spot => ({ id: p.id, name: positionName(f.sport, p.id, language), at: at[i], given: given[i], player: players.get(p.id) }));
  return { formation: f, spots, unmatched };
}

export function drawFormation(layer: FormationLayer, env: Env): Made {
  const made = newMade();
  const words = env.words.team;
  const { formation, spots, unmatched } = computeFormation(layer, env);
  const language = env.o.language === "ja" ? "ja" : "en";
  const k = FEET_PER[unitOfLayer(layer, env)];
  // The marks are as big as is usual, and no bigger than the positions allow (a football line stands shoulder to shoulder).
  let nearest = Infinity;
  spots.forEach((a, i) => spots.forEach((b, j) => (j > i ? (nearest = Math.min(nearest, Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]))) : undefined)));
  const size = isNum(layer.size) && layer.size > 0 ? layer.size * k : Math.min(env.base * 2.6, Math.max(env.base * 1.6, nearest * 0.9));
  const lineup = (layer.data ?? []).length > 0;
  const mode = layer.labels === "position" || layer.labels === "number" || layer.labels === "name" || layer.labels === "none" ? layer.labels : lineup ? "number" : "position";
  made.drawn = spots.length;
  made.skipped = unmatched;
  made.cls = "ky-tm";
  made.opacity = opacityOf(layer.opacity);
  made.style = `--w:${num(size * 0.07)}`;
  const mine = paintOf({ team: layer.team });
  const marks: string[] = [];
  const text: string[] = [];
  for (const s of spots) {
    const player = paintOf(s.player);
    const cls = [player.cls !== "" ? player.cls : mine.cls, lineup && s.player === undefined ? "ky-e" : ""].filter((c) => c !== "").join(" ");
    const tip = [s.name, s.player === undefined ? "" : [s.player.name, s.player.number].filter((t) => t !== undefined && t !== "").join(" ")].filter((t) => t !== "").join(env.words.said.colon);
    marks.push(titled("circle", `${attrs(cls, player.css !== "" ? player.css : mine.css)} cx="${num(s.at[0])}" cy="${num(s.at[1])}" r="${num(size / 2)}"`, s.player?.title ?? tip));
    let label = "";
    if (mode === "position") label = s.id;
    else if (mode === "number") label = s.player?.number === undefined ? (lineup ? "" : s.id) : String(s.player.number);
    else if (mode === "name") label = s.player === undefined ? "" : labelOf(s.player);
    const fs = Math.min(size * 0.5, (size * 0.9) / Math.max(1.2, label.length * 0.62));
    const turn = env.turned ? ` transform="rotate(-90 ${num(s.at[0])} ${num(s.at[1])})"` : "";
    if (label !== "") text.push(`<text class="ky-lt" style="font-size:${num(fs)}px" x="${num(s.at[0])}" y="${num(s.at[1] + fs * 0.36)}"${turn}>${esc(label)}</text>`);
    if (layer.names === true && s.player?.name !== undefined && s.player.name !== "") {
      const small = size * 0.36;
      text.push(`<text class="ky-lt" style="font-size:${num(small)}px" x="${num(s.at[0])}" y="${num(s.at[1] + size * 0.5 + small * 1.1)}"${turn}>${esc(s.player.name)}</text>`);
    }
  }
  made.marks = `<g class="ky-fm${mine.cls === "" ? "" : ` ${mine.cls}`}">${marks.join("")}</g><g text-anchor="middle">${text.join("")}</g>`;
  const name = formation.name[language];
  made.title = fill(words.formationTitle, { name, n: spots.length });
  const parts = [fill(words.formationNote, { list: spots.map((s) => s.name).join(env.words.layers.listSep) })];
  if (lineup) {
    const list = spots.filter((s) => s.player !== undefined).map((s) => fill(words.formationItem, { who: labelOf(s.player as FormationPlayer) || s.id, position: s.name }));
    if (list.length > 0) parts.push(fill(words.formationPlayers, { list: list.join(env.words.layers.listSep) }));
  }
  parts.push(formation.about[language]);
  if (unmatched > 0) parts.push(fill(env.words.layers.skipped, { n: unmatched }));
  made.text = parts.join(env.words.said.gap);
  return made;
}

export function formationTables(layer: FormationLayer, env: Env): TeamTable[] {
  const w = env.words.team;
  const l = env.words.layers;
  const { formation, spots } = computeFormation(layer, env);
  const language = env.o.language === "ja" ? "ja" : "en";
  const frame = FRAMES[formation.frame];
  return [
    {
      head: [l.tableNo, w.tablePosition, w.tableName, w.tableNumber, w.tablePlayer, l.tableX, l.tableY],
      rows: spots.map((s, i) => [i + 1, s.id, s.name, s.player?.number === undefined ? null : String(s.player.number), s.player?.name ?? null, round(s.given[0], 2), round(s.given[1], 2)]),
      title: typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.formationTitle, { name: formation.name[language], n: spots.length }),
      note: fill(l.tableFrame, { frame: formation.frame, unit: frame.unit }),
    },
  ];
}
