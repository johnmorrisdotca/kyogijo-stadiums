// A replay on the 3D view, as data: the floor is the replay's frame with the ball or the puck, its trail and the events on it, and every player and official stands up on it as a
// disc that faces the eye (a circle for the home side, a square for the away side, a triangle for an official, each with its number), the marks of the flat replay stood up. Pure:
// the same model, timeline, time and look give the same model. `turn.replay.dom.ts` moves it in a page.
import { esc, num } from "./format.ts";
import { drawFrameOf, replayCast, replayPlacer, replaySnapshot, type ReplayGroup } from "./replay.ts";
import type { ReplayLook, ReplayObject, ReplayTeam, ReplayTimeline } from "./replay.types.ts";
import { n, type Plane } from "./turn.kit.ts";
import type { TurnModel } from "./turn.model.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

/** Who stands up on a 3D view: the players and the officials. The ball and the puck stay on the floor. */
export const STANDING: readonly ReplayTeam[] = ["home", "away", "official"];

/** What stands up is in these groups of the flat replay; the 3D view's floor draws the rest (`keepOnFloor`). */
const STOOD = new Set(["replay-players", "replay-numbers", "replay-officials"]);

/** Whether a group of the replay stays on the floor of a 3D view: the trails, the passes, the shots, the goals and the ball do, and the players, their numbers and the officials stand up. */
export const keepOnFloor = (group: Pick<ReplayGroup, "id">): boolean => !STOOD.has(group.id);

/** The settings a 3D replay takes beyond the flat replay's look: `stand: false` keeps the players flat on the floor, as the flat replay draws them. */
export interface TurnReplayLook extends ReplayLook {
  stand?: boolean;
}

/**
 * The size of a disc, in feet: a share of the playing surface's diagonal (the area the view is fitted to, not the ground or the building round it), so that it reads on a rink and on a pitch
 * alike (about 6.5 feet on a hockey rink, 12 on a soccer pitch), times the look's `scale`. It is a mark, not a person: its size says nothing of a player's height.
 */
export function discSize(area: { w: number; h: number }, look: ReplayLook = {}): number {
  const scale = typeof look.scale === "number" && Number.isFinite(look.scale) && look.scale > 0 ? look.scale : 1;
  return Math.hypot(area.w, area.h) * 0.03 * scale;
}

/** The playing surface of a model, in feet: what stands on it says, else the whole floor. */
export const playingArea = (model: Pick<TurnModel, "viewBox" | "uprights">): { w: number; h: number } => {
  const area = model.uprights.area;
  return area === undefined ? model.viewBox : { w: area.x1 - area.x0, h: area.y1 - area.y0 };
};

/** The custom properties a floor drawing sets on its root (the teams' colours among them): the discs stand outside that SVG and take the same. */
export function floorVars(floor: string): string {
  const style = /^<svg[^>]*\sstyle="([^"]*)"/.exec(floor)?.[1];
  return style === undefined ? "" : style.split(";").filter((rule) => /^--ky-[\w-]+:/.test(rule)).join(";");
}

/** What is drawn on a disc of `d` feet: the flat replay's mark for the side, and the number over it, in the drawing's own classes so that they take its colours, light and dark. */
export function discMarkup(o: Pick<ReplayObject, "team" | "number">, d: number, sport: string, theme: string | undefined, vars: string): string {
  const r = d / 2;
  const edge = d * 0.06;
  const shape =
    o.team === "home"
      ? `<circle class="ky-h" cx="${n(r)}" cy="${n(r)}" r="${n(r - edge)}"/>`
      : o.team === "away"
        ? `<rect class="ky-a" x="${n(edge)}" y="${n(edge)}" width="${n(d - 2 * edge)}" height="${n(d - 2 * edge)}" rx="${n(d * 0.08)}"/>`
        : `<path d="M${n(r)} ${n(edge)}L${n(d - edge)} ${n(d - edge)}L${n(edge)} ${n(d - edge)}Z"/>`;
  const number = o.number === undefined || o.number === "" || o.team === "official" ? "" : `<text class="ky-lt" x="${n(r)}" y="${n(r)}" text-anchor="middle" dominant-baseline="central" font-size="${n(d * 0.46)}">${esc(String(o.number))}</text>`;
  const themed = theme === "light" || theme === "dark" ? ` data-theme="${theme}"` : "";
  return `<g class="kyogijo" data-sport="${esc(sport)}"${themed}${vars === "" ? "" : ` style="${esc(vars)}"`}><g class="ky-pts" style="--w:${n(d * 0.05)}">${shape}</g>${number}</g>`;
}

/** The plane of one disc: a billboard that leans to face the eye, its lower edge on the floor when it stands, its middle over (x, y). */
export function discPlane(o: Pick<ReplayObject, "id" | "team" | "number">, x: number, y: number, d: number, lift: number, svg: string): Plane {
  return { id: `replay-${o.id}`, kind: "player", o: [x - d / 2, y, lift + d], u: [d, 0, 0], v: [0, 0, -d], svg, billboard: true, lean: true };
}

/** Put a disc over a new place on the floor, as `discPlane` does: the plane is the caller's, changed in place, so that a page moving many does not make new ones. */
export function moveDisc(plane: Plane, x: number, y: number, d: number, lift: number): void {
  plane.o = [x - d / 2, y, lift + d];
}

/** A replay laid on a 3D view's model: what `replayTurnModel` gives back. */
export interface TurnReplayModel {
  model: TurnModel;
  /** The disc of each one standing, by id, and whether it is on the surface at the time. */
  discs: Map<string, { plane: Plane; on: boolean }>;
  /** The disc's size, in feet. */
  size: number;
  /** The options the floor was drawn with, its `id` among them. */
  floorOptions: SurfaceOptions | ScoreOptions;
}

/** The floor's options for a replay: the model's own, and an id of its own, so that the replay's groups are found in it. */
export const replayFloorOptions = (model: Pick<TurnModel, "id" | "options">): SurfaceOptions | ScoreOptions => ({ ...model.options, id: `${model.id}-replay` });

/**
 * A 3D view's model with a replay on it at a time: the floor drawn as the replay's frame (without the players when they stand), and a disc for each player and official the timeline
 * tracks, after the model's own planes. One that is not on the surface at the time is still a plane, and says so (`on`), so that the elements stay the same while it plays. Pure.
 */
export function replayTurnModel(model: TurnModel, timeline: ReplayTimeline, t: number, look: TurnReplayLook = {}): TurnReplayModel {
  const stand = look.stand !== false;
  const floorOptions = replayFloorOptions(model);
  const floor = drawFrameOf(floorOptions, timeline, t, look, stand ? keepOnFloor : () => true);
  const size = discSize(playingArea(model), look);
  const discs = new Map<string, { plane: Plane; on: boolean }>();
  if (!stand) return { model: { ...model, floor }, discs, size, floorOptions };
  const sport = String((model.options as SurfaceOptions).sport ?? "");
  const theme = (model.options as SurfaceOptions).theme;
  const vars = floorVars(floor);
  const lift = model.uprights.lift;
  const snap = replaySnapshot(timeline, t, look);
  const placed = replayPlacer(floorOptions, timeline)(snap.objects.map((o): [number, number] => [o.x, o.y]));
  const here = new Map(snap.objects.map((o, i) => [o.id, placed[i]]));
  for (const o of replayCast(timeline)) {
    if (!STANDING.includes(o.team)) continue;
    const at = here.get(o.id);
    discs.set(o.id, { plane: discPlane(o, at?.[0] ?? 0, at?.[1] ?? 0, size, lift, discMarkup(o, size, sport, theme, vars)), on: at !== undefined });
  }
  return { model: { ...model, floor, planes: [...model.planes, ...[...discs.values()].map((disc) => disc.plane)] }, discs, size, floorOptions };
}

/** A number for a test or a page that wants to know where a disc stands: its middle on the floor, in feet. */
export const discAt = (plane: Plane): string => `${num(plane.o[0] + plane.u[0] / 2)} ${num(plane.o[1])}`;
