// The lineup layer: a team's players placed by position code on the surface, each as a disc or a jersey with the shirt number in it and the name under it, with a captain's
// armband and a small flag where they are given. It reads where each position stands from a formation (formations.ts, formations.sports.ts) and so needs no coordinates; two
// teams are two layers. Written for this package.
import { flagPicture, safeLogo } from "./logo.ts";
import { esc, num } from "./format.ts";
import { FRAMES } from "./frames.ts";
import { positionName } from "./formations.ts";
import { assign, bestFormation, formationsFor, spotsOf } from "./lineup.codes.ts";
import { isNum, newMade, opacityOf, unitOfLayer, type Env, type Made } from "./layers.env.ts";
import { chooseLeague } from "./leagues.ts";
import { SURFACES, computeFormation, formationOf, type Spot } from "./team.formation.ts";
import { attrs, labelOf, paintOf, round, titled, type TeamTable } from "./team.common.ts";
import type { Formation, FormationLayer, FormationPlayer, FormationSport, LineupLayer, LineupPlayer } from "./team.types.ts";
import { fill } from "./strings.ts";
import { FEET_PER } from "./units.ts";

/** The sports whose team turns round for the visitors: a side that attacks the other end. Baseball's fielders, football's offence and a cricket field do not. */
const TURNS: ReadonlySet<string> = new Set(["soccer", "nhl", "nba", "rugby", "afl", "volleyball", "handball", "waterpolo", "fieldhockey", "netball"]);

/** How wide a text is, in ems of a bold sans-serif face, by a rough count: wide for Japanese and capitals, narrow for the letters that are. */
export function textWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x2e80) width += 1;
    else if ("iljtfI.,:;'!| ()".includes(ch)) width += 0.32;
    else if (/[A-Z0-9MWmw@%]/.test(ch)) width += 0.7;
    else width += 0.6;
  }
  return width;
}

/** A name cut to fit `ems` of width, with an ellipsis; nothing when not even three letters fit. */
export function fit(name: string, ems: number): string {
  if (textWidth(name) <= ems) return name;
  const letters = [...name];
  while (letters.length > 0 && textWidth(`${letters.join("").trimEnd()}…`) > ems) letters.pop();
  return letters.length < 3 ? "" : `${letters.join("").trimEnd()}…`;
}

/** The jersey as a path through its corners, `size` wide, centred on `(x, y)`: sleeves, shoulders, a neckline and the body. */
export function jerseyPath(x: number, y: number, size: number): string {
  const p = (dx: number, dy: number): string => `${num(x + dx * size)} ${num(y + dy * size)}`;
  return `M${p(-0.17, -0.48)}Q${p(0, -0.36)} ${p(0.17, -0.48)}L${p(0.5, -0.3)}L${p(0.42, -0.02)}L${p(0.34, -0.07)}L${p(0.34, 0.48)}L${p(-0.34, 0.48)}L${p(-0.34, -0.07)}L${p(-0.42, -0.02)}L${p(-0.5, -0.3)}Z`;
}

/** The formation a lineup is drawn in, and how the players stand in it. */
export interface Lineup {
  formation: Formation;
  /** The layer as a formation layer: the players put on the places they were given. */
  layer: FormationLayer;
  spots: Spot[];
  /** The players with no place in the formation. */
  unplaced: LineupPlayer[];
  /** The player standing on each place, with everything the lineup knows of him. */
  stands: Map<string, LineupPlayer>;
}

/** The formation a lineup uses: the one named, one of your own, or the best fit among those of the surface's sport (the softball one for a softball field). */
export function lineupFormation(layer: LineupLayer, env: Env): Formation {
  if (!Array.isArray(layer.players)) throw new TypeError("a lineup needs players: a list of { pos, name, number }");
  if (layer.formation !== undefined) return formationOf({ kind: "formation", formation: layer.formation });
  const sports = (Object.keys(SURFACES) as FormationSport[]).filter((sport) => SURFACES[sport].includes(env.o.sport));
  const softball = (() => { const league = chooseLeague(env.o).league; return league?.family === "baseball" && league.game === "softball"; })();
  const among = formationsFor(sports).filter((f) => (f.id === "softball-standard") === softball);
  const best = bestFormation(among, layer.players, layer.rotation);
  if (best === undefined) throw new RangeError(`There is no formation for ${env.o.sport}: give the formation of your own`);
  return best;
}

/** A lineup's places on the surface and the players on them. */
export function computeLineup(layer: LineupLayer, env: Env): Lineup {
  const formation = lineupFormation(layer, env);
  const f = formationOf({ kind: "formation", formation });
  const spotsList = spotsOf(f);
  const made = assign(f, layer.players, layer.rotation);
  const stands = new Map<string, LineupPlayer>();
  const unplaced: LineupPlayer[] = [];
  const data: FormationPlayer[] = [];
  layer.players.forEach((p, i) => {
    const id = made.of[i];
    if (id === undefined || typeof p !== "object" || p === null) {
      if (typeof p === "object" && p !== null) unplaced.push(p);
      return;
    }
    stands.set(id, p);
    data.push({ ...p, position: id, team: p.team ?? layer.side ?? "home" } as FormationPlayer);
  });
  const side = layer.side === "away" ? "away" : "home";
  // The visitors attack the other end, except where the sport does not turn: a football offence goes right unless the layer says, and a defence faces it.
  const attacking = layer.attacking ?? (side === "away" && TURNS.has(env.o.sport) ? "left" : undefined);
  const asLayer: FormationLayer = { ...layer, kind: "formation", formation: { ...f, positions: spotsList, extra: undefined }, team: side, data, attacking, labels: undefined, names: undefined, size: layer.size };
  const { spots } = computeFormation(asLayer, env);
  return { formation, layer: asLayer, spots, unplaced, stands };
}

const NUMBER_INK = "ky-nm";

export function drawLineup(layer: LineupLayer, env: Env): Made {
  const made = newMade();
  const words = env.words.team;
  const language = env.o.language === "ja" ? "ja" : "en";
  const { formation, spots, unplaced, stands } = computeLineup(layer, env);
  const k = FEET_PER[unitOfLayer(layer, env)];
  const rel = new Map(spotsOf(formation).map((p) => [p.id, p.size ?? 1]));
  // The marks are as big as is usual and no bigger than the first line's places allow; the second line's are smaller.
  const first = spots.filter((s) => (rel.get(s.id) ?? 1) >= 1);
  let nearest = Infinity;
  first.forEach((a, i) => first.forEach((b, j) => (j > i ? (nearest = Math.min(nearest, Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]))) : undefined)));
  // A football line stands shoulder to shoulder, so sizing by the nearest neighbour would shrink the offence and not the defence: both teams get one size.
  const football = env.o.sport === "nfl" || env.o.sport === "ifaf";
  const base = isNum(layer.size) && layer.size > 0 ? layer.size * k : football ? env.base * 2.4 : Math.min(env.base * 3.4, Math.max(env.base * 2, (Number.isFinite(nearest) ? nearest : env.base * 2) * 0.9));
  const jersey = layer.shape === "jersey";
  const mode = layer.labels === "position" || layer.labels === "number" || layer.labels === "name" || layer.labels === "none" ? layer.labels : "number";
  const showNames = layer.names !== false && mode !== "name";
  const side = layer.side === "away" ? "away" : "home";
  const mine = paintOf({ team: side });
  const marks: string[] = [];
  const badges: string[] = [];
  const text: string[] = [];
  spots.forEach((s) => {
    const player = stands.get(s.id);
    const size = base * (rel.get(s.id) ?? 1);
    const [cx, cy] = s.at;
    const own = paintOf(player === undefined ? undefined : { color: player.color, team: player.team ?? side });
    const cls = [own.cls !== "" ? own.cls : mine.cls, player === undefined ? "ky-e" : ""].filter((c) => c !== "").join(" ");
    const tip = [s.name, player === undefined ? "" : [player.name, player.number].filter((t) => t !== undefined && t !== "").join(" ")].filter((t) => t !== "").join(env.words.said.colon);
    const turn = env.turned ? ` transform="rotate(-90 ${num(cx)} ${num(cy)})"` : "";
    marks.push(titled(jersey ? "path" : "circle", `${attrs(cls, own.css)} ${jersey ? `d="${jerseyPath(cx, cy, size * 1.08)}"` : `cx="${num(cx)}" cy="${num(cy)}" r="${num(size / 2)}"`}`, player?.title ?? tip));
    // What is in the mark.
    let label = "";
    if (mode === "position") label = s.id;
    else if (mode === "number") label = player === undefined ? s.id : player.number === undefined || player.number === "" ? s.id : String(player.number);
    else if (mode === "name") label = player === undefined ? s.id : labelOf(player);
    if (label !== "") {
      const room = jersey ? size * 0.6 : size * 0.86;
      const fs = Math.min(size * 0.46, room / Math.max(0.9, textWidth(label)));
      text.push(`<text class="${player === undefined ? "ky-lt" : NUMBER_INK}" style="font-size:${num(fs)}px" x="${num(cx)}" y="${num(cy + fs * 0.36 + (jersey ? size * 0.07 : 0))}"${turn}>${esc(label)}</text>`);
    }
    // The name, under the mark, as wide as the neighbours allow and no wider: it shrinks, and is squeezed if it must be.
    if (showNames && player?.name !== undefined && player.name !== "") {
      let neighbour = Infinity;
      for (const other of spots) if (other !== s) neighbour = Math.min(neighbour, Math.hypot(other.at[0] - cx, other.at[1] - cy));
      const room = Math.max(size * 1.05, Math.min(size * 3.4, (Number.isFinite(neighbour) ? neighbour : size * 3) * 0.92));
      // The name shrinks to fit, down to a quarter of the mark's width; a name still too long is cut short with an ellipsis, and one that cannot keep three letters is left out
      // (a football line stands shoulder to shoulder). The whole name is in the tooltip, the description and the table.
      const fs = Math.min(size * 0.4, Math.max(size * 0.26, room / textWidth(player.name)));
      const shown = fit(player.name, room / fs);
      if (shown !== "") text.push(`<text class="ky-lt" style="font-size:${num(fs)}px" x="${num(cx)}" y="${num(cy + size * (jersey ? 0.54 : 0.5) + fs * 1.05)}"${turn}>${esc(shown)}</text>`);
    }
    // The captain's armband and the flag.
    if (player?.captain === true) {
      const r = size * 0.2;
      const bx = cx - size * 0.4;
      const by = cy - size * 0.4;
      badges.push(titled("circle", ` class="ky-lc" cx="${num(bx)}" cy="${num(by)}" r="${num(r)}"`, words.captainTip));
      text.push(`<text class="ky-cl" style="font-size:${num(r * 1.25)}px" x="${num(bx)}" y="${num(by + r * 0.45)}"${env.turned ? ` transform="rotate(-90 ${num(bx)} ${num(by)})"` : ""}>${esc(words.captainMark)}</text>`);
    }
    const flag = safeLogo(player?.flag) ?? flagPicture(player?.country, "rect", 24);
    if (flag !== undefined) {
      const h = size * 0.3;
      const w = h * 1.5;
      const fx = cx + size * 0.42 - w / 2;
      const fy = cy + size * 0.4 - h / 2;
      const spin = env.turned ? ` transform="rotate(-90 ${num(fx + w / 2)} ${num(fy + h / 2)})"` : "";
      badges.push(`<g${spin}><image href="${esc(flag)}" x="${num(fx)}" y="${num(fy)}" width="${num(w)}" height="${num(h)}" preserveAspectRatio="xMidYMid slice"/><rect class="ky-lf" x="${num(fx)}" y="${num(fy)}" width="${num(w)}" height="${num(h)}"/></g>`);
    }
  });
  made.drawn = spots.length;
  made.skipped = unplaced.length;
  made.cls = "ky-tm";
  made.opacity = opacityOf(layer.opacity);
  made.style = `--w:${num(base * 0.07)}`;
  made.marks = `<g class="ky-fm${mine.cls === "" ? "" : ` ${mine.cls}`}">${marks.join("")}</g>${badges.length === 0 ? "" : `<g class="ky-lb">${badges.join("")}</g>`}<g text-anchor="middle">${text.join("")}</g>`;
  const name = formation.name[language];
  made.title = fill(words.lineupTitle, { name, n: stands.size });
  const parts: string[] = [];
  const list = spots.filter((s) => stands.has(s.id)).map((s) => fill(words.formationItem, { who: labelOf(stands.get(s.id) as LineupPlayer) || s.id, position: s.name }));
  if (list.length > 0) parts.push(fill(words.formationPlayers, { list: list.join(env.words.layers.listSep) }));
  const captain = [...stands.values()].find((p) => p.captain === true);
  if (captain !== undefined) parts.push(fill(words.lineupCaptain, { who: labelOf(captain) }));
  if (formation.sport === "volleyball" && isNum(layer.rotation) && layer.rotation >= 1) parts.push(fill(words.lineupRotation, { n: Math.floor(layer.rotation) }));
  if (unplaced.length > 0) parts.push(fill(words.lineupUnplaced, { list: unplaced.map((p) => labelOf(p) || String(p.pos)).join(env.words.layers.listSep) }));
  parts.push(formation.about[language]);
  made.text = parts.join(env.words.said.gap);
  return made;
}

export function lineupTables(layer: LineupLayer, env: Env): TeamTable[] {
  const w = env.words.team;
  const l = env.words.layers;
  const { formation, spots, unplaced, stands } = computeLineup(layer, env);
  const language = env.o.language === "ja" ? "ja" : "en";
  const frame = FRAMES[formation.frame];
  const yes = w.captainMark;
  const rows: (string | number | null)[][] = spots.map((s, i) => {
    const p = stands.get(s.id);
    return [i + 1, s.id, s.name, p?.number === undefined ? null : String(p.number), p?.name ?? null, p === undefined ? null : p.captain === true ? yes : null, round(s.given[0], 2), round(s.given[1], 2)];
  });
  unplaced.forEach((p, i) => rows.push([spots.length + i + 1, String(p.pos), positionName(formation.sport, String(p.pos), language), p.number === undefined ? null : String(p.number), p.name ?? null, p.captain === true ? yes : null, null, null]));
  return [
    {
      head: [l.tableNo, w.tablePosition, w.tableName, w.tableNumber, w.tablePlayer, w.tableCaptain, l.tableX, l.tableY],
      rows,
      title: typeof layer.title === "string" && layer.title !== "" ? layer.title : fill(w.lineupTitle, { name: formation.name[language], n: stands.size }),
      note: fill(l.tableFrame, { frame: formation.frame, unit: frame.unit }),
    },
  ];
}
