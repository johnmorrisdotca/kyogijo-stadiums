// A district in 3D: the 3D view of `turn.ts` with several real venues standing on one ground at their real relative positions and orientations. Nothing here is drawn a second way. Each venue is built as it is on its own
// (`buildTurn`: the stands, the walls and the roof, the goals and posts of its field), its planes are turned about the middle of its surface and moved to where the plan puts it, and the floor is the district's flat
// plan drawn with each venue's building only. The model it makes is a `TurnModel`, so the camera, the controls, the pointer, the auto-turn and the steady fit of every other 3D view are this one's; its
// buildings are stacked building by building (`Plane.group`), the far one first, so that a roof never shows through a nearer building.
import { describeDistrict, districtId, drawDistrict, drawMember, planDistrict, surfaceCentre, type DistrictOptions, type DistrictPlaced, type DistrictPlan } from "./district.ts";
import { n, plane, type Plane, type Upright } from "./turn.kit.ts";
import { TURN_PRESETS, wrap, type PresetTable } from "./turn.camera.ts";
import { mountTurn, type KyogijoTurn } from "./turn.dom.ts";
import { turnMarkupOf } from "./turn.markup.ts";
import { buildTurn, lightingOf, openingView, sceneBox, WORLD_PX, type TurnModel, type TurnSettings } from "./turn.model.ts";
import { planesOf, type Uprights } from "./uprights.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { hullOf } from "./venues.geo.ts";
import { hasOutside, outsideCrowd, outsideLevelOf } from "./outside.ts";
import type { Pt } from "./crowd.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/** What can be asked of a district's 3D view beyond a surface's: `roof` and `roofOpen` for every venue that has one (as `venue: { roof, roofOpen }` of a single venue's view). */
export type DistrictTurnSettings = TurnSettings;

/** The four viewpoints of a district, turned with the map: the main camera looks from the south over the district (north at the top of the page), the end-on view from the west and the low corner from the south-west. */
export function districtPresets(plan: Pick<DistrictPlan, "turn">): PresetTable {
  const turn = plan.turn;
  return {
    overhead: { ...TURN_PRESETS.overhead, yaw: wrap(turn) },
    broadcast: { yaw: wrap(turn - 20), pitch: 58, zoom: 1 },
    end: { yaw: wrap(turn - 90), pitch: 64, zoom: 1 },
    corner: { yaw: wrap(turn - 38), pitch: 66, zoom: 1 },
  };
}

/** Turn a point about the origin by `degrees` clockwise on the page. */
const rot = ([x, y]: Pt, degrees: number): Pt => {
  const a = (degrees * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

/** A plane of a venue's own frame (its surface's middle at `centre`) put in the district's: turned by the venue's angle about that middle and moved to where the plan puts it. */
function placeInDistrict(p: Plane, placed: DistrictPlaced, centre: Pt, prefix: string, group: number): Plane {
  const at = (x: number, y: number): Pt => {
    const [rx, ry] = rot([x - centre[0], y - centre[1]], placed.angle);
    return [rx + placed.at[0], ry + placed.at[1]];
  };
  const dir = (x: number, y: number): Pt => rot([x, y], placed.angle);
  const [ox, oy] = at(p.o[0], p.o[1]);
  const [ux, uy] = dir(p.u[0], p.u[1]);
  const [vx, vy] = dir(p.v[0], p.v[1]);
  const moved: Plane = { ...p, id: `${prefix}${p.id}`, o: [ox, oy, p.o[2]], u: [ux, uy, p.u[2]], v: [vx, vy, p.v[2]], group };
  if (p.shy !== undefined) moved.shy = dir(p.shy[0], p.shy[1]);
  if (p.crop === true) {
    // A picture of the floor over a rectangle keeps its sides along x and y.
    const corners = [at(p.o[0], p.o[1]), at(p.o[0] + p.u[0], p.o[1] + p.u[1]), at(p.o[0] + p.v[0], p.o[1] + p.v[1]), at(p.o[0] + p.u[0] + p.v[0], p.o[1] + p.u[1] + p.v[1])];
    const [x0, x1] = [Math.min(...corners.map((c) => c[0])), Math.max(...corners.map((c) => c[0]))];
    const [y0, y1] = [Math.min(...corners.map((c) => c[1])), Math.max(...corners.map((c) => c[1]))];
    moved.o = [x0, y0, p.o[2]];
    moved.u = [x1 - x0, 0, 0];
    moved.v = [0, y1 - y0, 0];
  }
  return moved;
}

/** A name that faces the eye, standing over a building: its text on a plate. */
function sign(id: string, text: string, at: Pt, bottom: number, size: number, group: number): Plane {
  const wide = Math.max(size * 2.2, size * 0.62 * text.length + size * 1.2);
  const tall = size * 1.7;
  const svg = `<rect width="${n(wide)}" height="${n(tall)}" rx="${n(size * 0.3)}" class="u-signplate"/><text class="u-sign" x="${n(wide / 2)}" y="${n(tall * 0.68)}" text-anchor="middle" font-size="${n(size)}">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`;
  return { ...plane(id, "sign", [at[0] - wide / 2, at[1], bottom + tall], [wide, 0, 0], [0, 0, -tall], svg), billboard: true, lean: true, group };
}

/**
 * A district as a 3D model: the floor is the district's flat plan with each venue's building only, and on it stands each venue as it stands on its own (turned about the middle of its surface and moved to its place in the
 * district), with a name over each where the district has labels. A `TurnModel` like any other: `turnMarkupOf` and `mountDistrictTurn` make a view of it.
 */
export function buildDistrictTurn(options: DistrictOptions, settings: DistrictTurnSettings = {}): TurnModel {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const plan = planDistrict(options);
  const base = districtId(options);
  const id = settings.id ?? `${base}-turn`;
  const labels = options.labels ?? plan.mode === "city";
  const items: Upright[] = [];
  const defs: string[] = [];
  let crowdStyle = "";
  plan.members.forEach((placed, i) => {
    const member = placed.member;
    const memberId = `${id}-m${i}`;
    // Each venue is built as its own 3D view is, with the crowd drawn without its seats on its floor and the stands raised.
    const model = buildTurn({ ...member.options, language, ...(options.theme === undefined ? {} : { theme: options.theme }), id: `${base}-m${i}` } as SurfaceOptions, { ...settings, id: memberId, venue: { roof: true, ...(typeof settings.venue === "object" ? settings.venue : {}) }, preset: undefined, view: undefined });
    const centre = surfaceCentre(member.options);
    const prefix = `m${i}-`;
    for (const item of model.uprights.items) {
      const planes = item.planes.filter((p) => p.kind !== "ground").map((p) => placeInDistrict(p, placed, centre, prefix, i));
      if (planes.length > 0) {
        const [ax, ay] = item.at;
        const [rx, ry] = rot([ax - centre[0], ay - centre[1]], placed.angle);
        items.push({ ...item, id: `${prefix}${item.id}`, at: [rx + placed.at[0], ry + placed.at[1]], planes });
      }
    }
    if (model.defs !== "") defs.push(model.defs);
    if (crowdStyle === "" && model.crowdStyle !== "") crowdStyle = model.crowdStyle;
  });
  if (labels) {
    const size = Math.max(plan.view.w, plan.view.h) * (plan.mode === "city" ? 0.016 : 0.022);
    plan.members.forEach((placed, i) => {
      const top = Math.max(...items.filter((it) => it.id.startsWith(`m${i}-`)).map((it) => it.height), 60);
      const middle: Pt = [placed.footprint.reduce((s, p) => s + p[0], 0) / placed.footprint.length, placed.footprint.reduce((s, p) => s + p[1], 0) / placed.footprint.length];
      items.push({ id: `m${i}-name`, kind: "scoreboard", at: middle, height: top + size * 1.7, planes: [sign(`m${i}-name`, placed.member.name[language], middle, top + size * 0.6, size, i)] });
    });
  }
  const view = plan.view;
  const scale = WORLD_PX / Math.max(view.w, view.h);
  const centre: [number, number] = [view.x + view.w / 2, view.y + view.h / 2];
  const area = { x0: view.x, y0: view.y, x1: view.x + view.w, y1: view.y + view.h };
  const uprights: Uprights = { items, lift: 0, thin: Math.hypot(view.w, view.h) * 0.0012, area, whole: true, ...(defs.length === 0 ? {} : { defs: defs.join("") }) };
  const planes = planesOf(uprights);
  const box = sceneBox(planes, area, 0, centre, scale);
  // (The floor has no names: the 3D view's own signs, which face the eye, carry them.)
  const floor = drawDistrict({ ...options, id: base, labels: false }, plan, (member, i) => drawMember(member, { ...options, id: base }, i, base, { floor: true }));
  const { title, description } = describeDistrict(options, plan);
  const presets = districtPresets(plan);
  const surfaceLike = { sport: "soccer", language, ...(options.theme === undefined ? {} : { theme: options.theme }), ...(options.style === undefined ? {} : { style: options.style }) } as SurfaceOptions;
  return {
    id,
    language,
    options: surfaceLike,
    title,
    description,
    standing: "",
    floor,
    viewBox: { x: view.x, y: view.y, w: view.w, h: view.h },
    scale,
    uprights,
    defs: defs.join(""),
    crowdStyle,
    venue: true,
    ...lightingOf(typeof settings.venue === "object" ? settings.venue : {}, undefined),
    look: undefined,
    planes,
    box,
    centre,
    view: openingView(settings, presets),
    turnable: true,
    presets,
    // A scene that turns about its middle with buildings far from it wants a longer lens, so that what swings toward the eye does not swell.
    lens: 12,
    flat: drawDistrict(options, plan),
    groups: plan.members.map((p) => ({ hull: hullOf(p.footprint) })),
    // The crowd outside, when the district asks for one and has a mask to put it on: the mount paints it on a canvas on the floor.
    ...(options.outside !== undefined && hasOutside(plan) ? { outside: { level: outsideLevelOf(options), crowd: () => outsideCrowd(plan), viewBox: { x: view.x, y: view.y, w: view.w, h: view.h } } } : {}),
  };
}

/**
 * Mount a district as a 3D view in a container: the same view as `mountKyogijoTurn`'s, with the controls, the pointer, the keys and the auto-turn of every 3D view, over the district's plan with each venue standing on it.
 * @example
 * ```ts no-run
 * import { mountDistrictTurn } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const view = mountDistrictTurn(document.querySelector("#city")!, { venues: ["bc-place", "rogers-arena"] }, { preset: "broadcast" });
 * view.set({ yaw: 40 });
 * ```
 */
export function mountDistrictTurn(host: HTMLElement, options: DistrictOptions, settings: DistrictTurnSettings = {}): KyogijoTurn<DistrictOptions> {
  return mountTurn(host, options, settings, buildDistrictTurn);
}

/** A district as the markup of a 3D view, still until a page's script makes it turn: pure, so a server can make it. */
export function districtTurnMarkup(options: DistrictOptions, settings: DistrictTurnSettings = {}): string {
  return turnMarkupOf(buildDistrictTurn(options, settings), settings);
}

/** The distance in feet that a number of metres is: what a test or a caller needs to compare the plan with the ground. */
export const feetOf = (metres: number): number => metres * FEET_PER_METRE;
