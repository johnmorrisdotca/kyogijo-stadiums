// A district in 3D: the 3D view of `turn.ts` with several real venues standing on one ground at their real relative positions and orientations. Nothing here is drawn a second way. Each venue is built as it is on its own
// (`buildTurn`: the stands, the walls and the roof, the goals and posts of its field), its planes are turned about the middle of its surface and moved to where the plan puts it, and the floor is the district's flat
// plan drawn with each venue's building only. The model it makes is a `TurnModel`, so the camera, the controls, the pointer, the auto-turn and the steady fit of every other 3D view are this one's; its
// buildings are stacked building by building (`Plane.group`), the far one first, so that a roof never shows through a nearer building.
import { describeDistrict, districtId, drawDistrict, drawMember, nestedDrawing, planDistrict, surfaceCentre, type DistrictOptions, type DistrictPlan } from "./district.ts";
import { blockPlanes, contextUprights, shellBlock, slabPlanes, thinTrees } from "./context.ts";
import { TIER_PROFILES, tierOf } from "./quality.ts";
import type { Box3 } from "./turn.camera.ts";
import { dojo } from "./budo/dojo.api.ts";
import { KODOKAN_FLOORS, KODOKAN_GALLERY_LEVEL } from "./kodokan.ts";
import { APART, n, plane, type Plane, type Upright } from "./turn.kit.ts";
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
function placeInDistrict(p: Plane, placed: { at: Pt; angle: number }, centre: Pt, prefix: string, group: number, lift = 0): Plane {
  const at = (x: number, y: number): Pt => {
    const [rx, ry] = rot([x - centre[0], y - centre[1]], placed.angle);
    return [rx + placed.at[0], ry + placed.at[1]];
  };
  const dir = (x: number, y: number): Pt => rot([x, y], placed.angle);
  const [ox, oy] = at(p.o[0], p.o[1]);
  const [ux, uy] = dir(p.u[0], p.u[1]);
  const [vx, vy] = dir(p.v[0], p.v[1]);
  const moved: Plane = { ...p, id: `${prefix}${p.id}`, o: [ox, oy, p.o[2] + lift], u: [ux, uy, p.u[2]], v: [vx, vy, p.v[2]], group };
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

/** The box a district at `high` is framed to, kept for the options it was worked out for, so that a lower tier is framed exactly as `high` is: the camera does not move when the tier changes. */
const HIGH_BOX = new WeakMap<object, { key: string; box: Box3 }>();

/** The small parts of a venue that the lower tiers leave out: its furniture and fittings, never its stands, walls, floor or roof. */
const SMALL_PARTS: ReadonlySet<string> = new Set(["bench", "glass", "post", "goal", "stanchion", "pole", "pylon", "mast", "fascia", "rail", "platform", "apron", "flag", "board", "frame", "rim", "net", "antenna", "tape"]);

/** How high a venue that is drawn as a block stands, in feet, by what it is: a stand-in for its stands and roof, near what its own model reaches. */
const BLOCK_HEIGHT: Record<string, number> = { arena: 100, stadium: 115, park: 95, hall: 60 };

/** A venue drawn as a proxy is a closed block while it is smaller than this share of the plan's longest side, and a ring of walls open at the top (the field and its stands show inside) above it. */
const SOLID_BELOW = 0.12;

/** The planes of a venue drawn as a proxy, in the venue's own group, tinted as a venue and not as the buildings round it: its outline standing up to its height, closed by a roof when it is small, a ring of walls seen from both sides when it is not. */
function venueBlock(key: string, kind: string, ring: readonly Pt[], prefix: string, group: number, open: boolean): Plane[] {
  const height = BLOCK_HEIGHT[kind] ?? 90;
  const block = shellBlock(`venue-${key}`, ring, open ? height * 0.6 : height, undefined);
  const planes = blockPlanes(block, `${prefix}proxy-`).filter((p) => !open || /w\d+$/.test(p.id));
  return planes.map((p) => {
    const tinted: Plane = { ...p, svg: p.svg.replace(/u-block-roof/g, "u-proxy-roof").replace(/u-block-([abc])/g, "u-proxy-$1").replace(/u-block /g, "u-proxy "), group };
    // Seen from both sides: the inside of the far wall shows over the field.
    if (open) delete tinted.cull;
    return tinted;
  });
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
  // How much is drawn: the tier asked for (a view that chooses by its frames builds it again at each tier).
  const profile = TIER_PROFILES[tierOf(settings.quality)];
  const longest = Math.max(plan.view.w, plan.view.h);
  const labels = options.labels ?? plan.mode === "city";
  const items: Upright[] = [];
  const defs: string[] = [];
  let crowdStyle = "";
  plan.members.forEach((placed, i) => {
    const member = placed.member;
    const prefix = `m${i}-`;
    // A small venue, in a tier that draws such as a block: its outline standing up to its height, and nothing of its stands.
    const xs = placed.footprint.map((q) => q[0]);
    const ys = placed.footprint.map((q) => q[1]);
    const plain = member.shell === undefined && member.parts === undefined && member.elevation === undefined && member.plate === undefined && member.slabs === undefined;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    // (A district of one venue never draws it as a block: it is what the view is of.)
    if (plain && plan.members.length > 1 && profile.proxy > 0 && span < profile.proxy * longest) {
      items.push({ id: `${prefix}proxy`, kind: "blocks", at: placed.at, height: BLOCK_HEIGHT[member.kind] ?? 90, planes: venueBlock(member.key, member.kind, placed.footprint, prefix, i, span >= SOLID_BELOW * longest) });
      return;
    }
    // A venue may have several surfaces (the rooms of a floor): each is built as its own 3D view is, with the crowd drawn without its seats on its floor and the stands raised, and put where the plan puts it, in the venue's one group.
    placed.parts.forEach((pp, j) => {
      const part = pp.part;
      const tag = j === 0 ? "" : `p${j}`;
      const memberId = `${id}-m${i}${tag}`;
      const crowd = (part.options as { crowd?: unknown }).crowd;
      const model = buildTurn({ ...part.options, ...(profile.simple && typeof crowd === "object" && crowd !== null ? { crowd: { ...crowd, detail: "plain", density: Math.min((crowd as { density?: number }).density ?? 0.85, 0.6) } } : {}), language, ...(options.theme === undefined ? {} : { theme: options.theme }), id: `${base}-m${i}${tag}` } as SurfaceOptions, { ...settings, id: memberId, venue: { roof: true, ...(typeof settings.venue === "object" ? settings.venue : {}) }, preset: undefined, view: undefined });
      const centre = surfaceCentre(part.options);
      const pfx = `m${i}${tag}-`;
      // A surface on an upper floor (the Kodokan's dojos) stands that high over the ground, on a floor drawn in the air; the ground under it is left bare.
      const lift = part.elevation ?? 0;
      // Which part of a room is drawn: what stands below the gallery's level, or what stands above it.
      const lowest = (p: Plane): number => Math.min(p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]);
      const shown = (p: Plane): boolean => part.show === undefined || (part.show === "gallery") === (lowest(p) >= KODOKAN_GALLERY_LEVEL - 1e-6);
      for (const item of model.uprights.items) {
        const planes = item.planes.filter((p) => p.kind !== "ground" && shown(p) && !(profile.simple && SMALL_PARTS.has(p.kind))).map((p) => placeInDistrict(p, pp, centre, pfx, i, lift));
        if (planes.length > 0) {
          const [ax, ay] = item.at;
          const [rx, ry] = rot([ax - centre[0], ay - centre[1]], pp.angle);
          items.push({ ...item, id: `${pfx}${item.id}`, at: [rx + pp.at[0], ry + pp.at[1]], height: item.height + lift, planes });
        }
      }
      if (lift > 0 && part.show !== "gallery") {
        const { markup, box, styles } = nestedDrawing(drawMember(member, { ...options, id: base }, i, base, { floor: true }, j));
        for (const block of styles) if (!defs.includes(block)) defs.push(block);
        const floor = plane("floor", "floor", [box.x, box.y, 0], [box.w, 0, 0], [0, box.h, 0], `<g transform="translate(${n(-box.x)} ${n(-box.y)})">${markup}</g>`);
        items.push({ id: `${pfx}floor`, kind: "deck", at: pp.at, height: lift, planes: [placeInDistrict(floor, pp, centre, pfx, i, lift)] });
        // The room's floor is a slab too, with an edge all round (the building's own floors do that for a chosen floor): its mats' rectangle and a hand's width more.
        const spec = (part.options as { dojo?: Parameters<typeof dojo>[0] }).dojo;
        if (member.plate === undefined && spec !== undefined && member.slabThickness !== undefined) {
          const room = dojo(spec);
          const m = 0.12 * FEET_PER_METRE;
          const [w, l] = [room.width * FEET_PER_METRE, room.length * FEET_PER_METRE];
          const corners: Pt[] = [[-m, -m], [w + m, -m], [w + m, l + m], [-m, l + m]].map(([x, y]) => {
            const [rx, ry] = rot([x - centre[0], y - centre[1]], pp.angle);
            return [rx + pp.at[0], ry + pp.at[1]];
          });
          const pixels = 1000 / Math.max(plan.view.w, plan.view.h);
          const thick = Math.min(Math.max(member.slabThickness * FEET_PER_METRE, 10 / pixels), ((member.shell?.height ?? 60) / (member.shell?.storeys ?? 8)) * 0.5);
          items.push({ id: `${pfx}slab`, kind: "deck", at: pp.at, height: lift, planes: slabPlanes(corners, lift, thick, { top: `${pfx}slab-top`, side: `${pfx}slab-s` }, "plain").map((p) => ({ ...p, group: i })) });
        }
      }
      if (model.defs !== "") defs.push(model.defs);
      if (crowdStyle === "" && model.crowdStyle !== "") crowdStyle = model.crowdStyle;
    });
    // The building it stands in: see-through (its walls give way to the eye) or solid, in the venue's group so that it is stacked with it.
    if (member.shell !== undefined && options.building !== "none") {
      // What is seen through its walls: the middle of the rooms in it (the building's own middle where a floor has none).
      const inside: Pt = placed.parts.length === 0 ? placed.at : [placed.parts.reduce((s, q) => s + q.at[0], 0) / placed.parts.length, placed.parts.reduce((s, q) => s + q.at[1], 0) / placed.parts.length];
      const block = shellBlock(member.key, placed.footprint, member.shell.height, options.building === "solid" ? undefined : inside);
      const planes = blockPlanes(block, `${prefix}shell-`).map((p) => ({ ...p, group: i }));
      items.push({ id: `${prefix}shell`, kind: "blocks", at: placed.at, height: member.shell.height, planes });
    }
    // The floors of the building as slabs with an edge: the one chosen is picked out (its plate, with its name over it), the others are faint. A slab is as thick as the venue says and never thinner than ten pixels at the page's own size.
    if (member.slabs !== undefined && options.building !== "none") {
      const pixels = 1000 / Math.max(plan.view.w, plan.view.h);
      const thick = Math.min(Math.max((member.slabThickness ?? 0.6) * FEET_PER_METRE, 10 / pixels), ((member.shell?.height ?? 60) / (member.shell?.storeys ?? 8)) * 0.5);
      for (const slab of member.slabs) {
        const chosen = member.plate?.floor === slab.floor;
        // The great dojo's floor, seen with every floor, has its own slab; and a solid building hides what is in it.
        if (!chosen && ((member.plate === undefined && slab.floor === 7) || options.building === "solid")) continue;
        // The faint floors are as big as the building (each is a layer of its own, a megapixel and more): the lower tiers keep the chosen floor's and leave the others out.
        if (!chosen && profile.simple) continue;
        const ids = chosen ? { top: `${prefix}plate`, side: `${prefix}plate-s` } : { top: `${prefix}plate-f${slab.floor}-top`, side: `${prefix}plate-f${slab.floor}-s` };
        const planes = slabPlanes(placed.footprint, slab.level, thick, ids, chosen ? "chosen" : "faint").map((p) => ({ ...p, group: i }));
        items.push({ id: ids.top, kind: "deck", at: placed.at, height: slab.level, planes });
      }
    }
    if (member.plate !== undefined) {
      const { floor, level } = member.plate;
      const label = KODOKAN_FLOORS.find((f) => f.floor === floor)?.label[language] ?? String(floor);
      const size = Math.max(plan.view.w, plan.view.h) * 0.018;
      items.push({ id: `${prefix}plate-name`, kind: "scoreboard", at: placed.at, height: level + size * 1.7, planes: [sign(`${prefix}plate-name`, label, placed.at, level + size * 0.4, size, i)] });
    }
  });
  // The buildings round the venues stand apart from them: each block's planes are of no venue's group.
  if (plan.context !== undefined) for (const item of contextUprights(plan.context, profile.blocks)) items.push({ ...item, planes: item.planes.map((p) => ({ ...p, group: APART })) });
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
  // The camera is fitted to what the district is at `high`, whatever tier it is drawn at: a view that changes tier keeps its camera where it is, and the lower tiers stand in the same frame.
  let box = sceneBox(planes, area, 0, centre, scale);
  if (profile.tier !== "high") {
    const key = JSON.stringify(settings.venue ?? null);
    const known = HIGH_BOX.get(options);
    if (known?.key === key) box = known.box;
    else {
      box = buildDistrictTurn(options, { ...settings, quality: "high" }).box;
      HIGH_BOX.set(options, { key, box });
    }
  } else HIGH_BOX.set(options, { key: JSON.stringify(settings.venue ?? null), box });
  // (The floor has no names: the 3D view's own signs, which face the eye, carry them.)
  // (The trees of the tiers that draw fewer are thinned on the floor only: a tree is a dot there.)
  const floorPlan: DistrictPlan = profile.trees < 1 && plan.context?.trees !== undefined ? { ...plan, context: { ...plan.context, trees: thinTrees(plan.context.trees, profile.trees) } } : plan;
  const floor = drawDistrict({ ...options, id: base, labels: false }, floorPlan, (member, i, part) => drawMember(member, { ...options, id: base }, i, base, { floor: true }, part));
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
    tiered: true,
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
