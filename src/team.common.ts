// What the team layers share: how a mark's team and colour become a class and a custom property, how a team is named, how data with a place is
// put on the surface, and the shape of a table. Kept apart from the layers themselves so that each file of them is about one kind of layer.
import { safeColour } from "./colour.ts";
import { esc, num } from "./format.ts";
import { isNum, place, type Env } from "./layers.env.ts";
import type { P } from "./layers.marks.ts";
import { FRAMES } from "./frames.ts";
import type { LayerBase, MarkDatum } from "./layers.types.ts";
import { fill } from "./strings.ts";
import type { Unit } from "./units.ts";

/** The words of the team layers. */
export type Words = Env["words"]["team"];

/** A table of a team layer: the heads, the rows, the caption and a note for it. */
export interface TeamTable {
  head: string[];
  rows: (string | number | null)[][];
  title: string;
  note: string;
}

/** The class and the custom property that colour a mark: its own colour, else its team's, else the layer's. */
export function paintOf(d: MarkDatum | undefined): { cls: string; css: string } {
  const mine = safeColour(d?.color);
  if (mine !== undefined) return { cls: "", css: `--c:${mine}` };
  return { cls: d?.team === "home" ? "ky-h" : d?.team === "away" ? "ky-a" : "", css: "" };
}

/** The class of a team that has one: `home` and `away` take the layer's team colours. */
export const teamClass = (team: string): string => (team === "home" ? "ky-h" : team === "away" ? "ky-a" : "");

/** The team of a mark as a key: its text, or nothing. */
export const teamKey = (team: unknown): string => (typeof team === "string" ? team : "");

/** The name of a team to a reader: home and away in the drawing's language, any other team as it was written, and no team as "all players". */
export function teamLabel(team: string, env: Env): string {
  if (team === "") return env.words.team.hullAll;
  return team === "home" ? env.words.said.home : team === "away" ? env.words.said.away : team;
}

/** Attributes for an element: a class, a style and an opacity, each left out when empty. */
export const attrs = (cls: string, css: string, opacity?: number): string => `${cls === "" ? "" : ` class="${cls}"`}${css === "" ? "" : ` style="${css}"`}${opacity === undefined ? "" : ` opacity="${num(opacity)}"`}`;

/** An element with a tooltip, or without when there is none. */
export const titled = (tag: string, open: string, title: string | undefined): string => (typeof title === "string" && title !== "" ? `<${tag}${open}><title>${esc(title)}</title></${tag}>` : `<${tag}${open}/>`);

/** The text to write for a player: his name, else his number, else his id. */
export function labelOf(d: { name?: unknown; number?: unknown; id?: unknown }): string {
  if (typeof d.name === "string" && d.name !== "") return d.name;
  if (typeof d.number === "string" || isNum(d.number)) return String(d.number);
  if (typeof d.id === "string" || isNum(d.id)) return String(d.id);
  return "";
}

/** A mark with a place, put on the surface (feet). */
export interface Placed<D> {
  d: D;
  x: number;
  y: number;
  /** Its index in the layer's data. */
  index: number;
}

/** The marks of a layer that have a place, on the surface, and how many have none. */
export function placeAll<D extends { x: number | null; y: number | null }>(layer: LayerBase, env: Env, data: readonly D[], unit: Unit): { items: Placed<D>[]; skipped: number } {
  const keep: number[] = [];
  const raw: P[] = [];
  let skipped = 0;
  data.forEach((d, i) => {
    if (typeof d === "object" && d !== null && isNum(d.x) && isNum(d.y)) {
      keep.push(i);
      raw.push([d.x, d.y]);
    } else skipped += 1;
  });
  const at = place(layer, env, raw, unit);
  return { items: keep.map((i, j) => ({ d: data[i], x: at[j][0], y: at[j][1], index: i })), skipped };
}

/** A closed path through some places. */
export const polygonPath = (points: readonly P[]): string => `${points.map((p, i) => `${i === 0 ? "M" : "L"}${num(p[0])} ${num(p[1])}`).join("")}Z`;

/** Round to a number of decimal places. */
export const round = (value: number, places = 1): number => Math.round(value * 10 ** places) / 10 ** places;

/** The marks grouped by team, in the order each team first appears; or all in one group (with the key "") for `by: "all"`. */
export function groupByTeam<T extends { d: { team?: unknown } }>(items: readonly T[], by: "team" | "all" | undefined): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = by === "all" ? "" : teamKey(item.d.team);
    const list = groups.get(key);
    if (list === undefined) groups.set(key, [item]);
    else list.push(item);
  }
  return groups;
}

/** The dots that mark players, as a group that the stylesheet's `ky-pts` rule draws. */
export function dots(items: readonly Placed<{ team?: unknown; color?: unknown; title?: string; opacity?: number }>[], radius: number, titles: (item: Placed<{ team?: unknown }>) => string | undefined): string {
  const circles = items.map((item) => {
    const { cls, css } = paintOf(item.d as MarkDatum);
    return titled("circle", `${attrs(cls, css, undefined)} cx="${num(item.x)}" cy="${num(item.y)}" r="${num(radius)}"`, titles(item));
  });
  return circles.length === 0 ? "" : `<g class="ky-pts" style="--w:${num(radius * 0.25)}">${circles.join("")}</g>`;
}

/** The caption's note on a table's coordinates: the frame and its unit, or nothing when the numbers are the surface's own. */
export function frameNote(layer: LayerBase, env: Env): string {
  if (layer.from === undefined) return "";
  const given = typeof layer.from === "string" ? FRAMES[layer.from] : layer.from;
  const name = typeof layer.from === "string" ? layer.from : layer.from.name;
  return fill(env.words.layers.tableFrame, { frame: name, unit: given?.unit ?? "ft" });
}

/** A unit of area as words in the drawing's language: square feet, square yards and square metres by name, any other unit as "square" and its symbol. */
export function squareWord(unit: string, env: Env): string {
  const names = env.words.team.squareUnits as Record<string, string>;
  return Object.prototype.hasOwnProperty.call(names, unit) ? names[unit] : fill(env.words.team.squareOther, { unit });
}

/** A unit as a word in the drawing's language: feet, yards and metres by name, any other unit as its symbol. */
export function unitWord(unit: string, env: Env): string {
  const names = env.words.league.units as Record<string, string>;
  return Object.prototype.hasOwnProperty.call(names, unit) ? names[unit] : unit;
}
