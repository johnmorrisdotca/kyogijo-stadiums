import { describe, expect, it } from "vitest";
import { CONTEXT_BLOCKS, CONTEXT_REACH, CONTEXT_TONES, blockPlanes, contextFloor, contextUprights, decodeBuilding, placeContext, toneOf, type ContextArea } from "./context.ts";
import { describeDistrict, districtId, drawDistrict, planDistrict, type DistrictOptions } from "./district.ts";
import { buildDistrictTurn, districtTurnMarkup } from "./district.turn.ts";
import { PLATEAU_AREAS, PLATEAU_ATTRIBUTION, TOKYO_DOME_CITY } from "./plateau.data.ts";
import { FEET_PER_METRE } from "./geometry.ts";
import { boxOf, hullOf, inside } from "./venues.geo.ts";
import { APART } from "./turn.kit.ts";
import { layoutOf } from "./turn.markup.ts";
import { eyeDistance } from "./turn.camera.ts";

const TOKYO: DistrictOptions = { venues: ["tokyo-dome", "korakuen-hall"], context: [TOKYO_DOME_CITY] };
const BARE: DistrictOptions = { venues: ["tokyo-dome", "korakuen-hall"] };
const buildings = (area: ContextArea) => area.layers.buildings!.rows.map((row) => decodeBuilding(area, row));

describe("the PLATEAU area of Tokyo Dome City", () => {
  it("is one frame (an origin, a grid and a radius) with a layer of buildings that says where it came from and under what terms", () => {
    expect(PLATEAU_AREAS["tokyo-dome-city"]).toBe(TOKYO_DOME_CITY);
    expect(TOKYO_DOME_CITY).toMatchObject({ key: "tokyo-dome-city", origin: [139.7518, 35.7048], radius: 500, grid: 0.5 });
    const layer = TOKYO_DOME_CITY.layers.buildings!;
    expect(layer.rows.length).toBe(734);
    expect(layer.licence).toMatch(/PLATEAU Site Policy.*CC BY 4\.0/);
    expect(layer.source).toContain("13105");
    expect(layer.read).toBe("2026-10-22");
    // Room for the layers that come beside it (trees, land cover) is the shape of the type: each layer has its own source and licence, all in this frame.
    expect(Object.keys(TOKYO_DOME_CITY.layers)).toEqual(["buildings"]);
  });

  it("credits MLIT's Project PLATEAU, says the data was edited and not made by MLIT, in English and in Japanese", () => {
    expect(PLATEAU_ATTRIBUTION.en).toMatch(/Project PLATEAU.*Ministry of Land, Infrastructure, Transport and Tourism.*edited.*not made by MLIT/);
    expect(PLATEAU_ATTRIBUTION.ja).toMatch(/国土交通省.*Project PLATEAU.*加工して作成/);
    expect(TOKYO_DOME_CITY.layers.buildings!.attribution).toBe(PLATEAU_ATTRIBUTION);
  });

  it("holds well-formed buildings: three or more points, a height, a roof's rise that is less than the height, all inside the radius", () => {
    const all = buildings(TOKYO_DOME_CITY);
    for (const b of all) {
      expect(b.ring.length).toBeGreaterThanOrEqual(3);
      expect(b.height).toBeGreaterThan(0);
      expect(b.height).toBeLessThan(200);
      expect(b.rise).toBeGreaterThanOrEqual(0);
      expect(b.rise).toBeLessThanOrEqual(b.height * 0.6 + 0.5);
      for (const [e, n] of b.ring) expect(Math.hypot(e, n)).toBeLessThan(TOKYO_DOME_CITY.radius + 150);
    }
    expect(all.filter((b) => b.rise > 0).length).toBe(28);
  });

  it("has the tallest building Tokyo Dome Hotel's 155 metres and Tokyo Dome's own 54.8 metres, as PLATEAU measured them", () => {
    const heights = buildings(TOKYO_DOME_CITY).map((b) => b.height);
    expect(Math.max(...heights)).toBeCloseTo(155, 0);
    expect(heights.some((h) => Math.abs(h - 55) <= 0.5)).toBe(true);
    // OpenStreetMap and Wikipedia say the dome is 56.19 metres: within a metre and a half.
    expect(Math.abs(56.19 - 54.8)).toBeLessThan(1.5);
  });

  it("decodes a row: first point absolute, then each step, heights and coordinates in grid steps of half a metre", () => {
    expect(decodeBuilding({ grid: 0.5 }, [21, 4, 448, -157, -4, 7, -15, -9])).toEqual({ ring: [[224, -78.5], [222, -75], [214.5, -79.5]], height: 10.5, rise: 2 });
  });
});

describe("a district with context", () => {
  const plan = planDistrict(TOKYO);
  const bare = planDistrict(BARE);

  it("is the district it was, with the buildings added: nothing changes for a district that asks for none", () => {
    expect(bare.context).toBeUndefined();
    expect(planDistrict({ ...BARE, context: [] }).context).toBeUndefined();
    expect(districtId({ ...BARE, context: [] })).toBe(districtId(BARE));
    expect(districtId(TOKYO)).not.toBe(districtId(BARE));
    expect(drawDistrict(BARE)).not.toContain("ky-dist-context");
    expect(buildDistrictTurn(BARE).planes.some((p) => p.group === APART)).toBe(false);
    expect(plan.members.map((m) => m.at)).toEqual(bare.members.map((m) => m.at));
  });

  it("widens the frame by 150 metres on every side, to take in the streets round the buildings", () => {
    expect(plan.view.w - bare.view.w).toBeGreaterThan(0);
    const venues = plan.members.flatMap((m) => m.footprint);
    const box = boxOf(venues);
    // At least that far on every side: the south grows further, to take in the hotel (a landmark 370 metres off).
    for (const gap of [box.x0 - plan.view.x, plan.view.x + plan.view.w - box.x1, box.y0 - plan.view.y, plan.view.y + plan.view.h - box.y1]) expect(gap).toBeGreaterThanOrEqual(CONTEXT_REACH - 1e-6);
    expect(plan.view.y + plan.view.h - box.y1).toBeGreaterThan(CONTEXT_REACH * 1.5);
    expect(CONTEXT_REACH).toBeCloseTo(150 * FEET_PER_METRE, 6);
  });

  it("keeps the buildings of the frame, leaves out the ones that are a venue's own, and holds the building Korakuen Hall stands in as a ghost", () => {
    const blocks = plan.context!.blocks;
    expect(blocks.length).toBeGreaterThan(100);
    expect(plan.context!.owned).toBeGreaterThanOrEqual(1);
    const [dome, hall] = plan.members;
    const hull = hullOf(dome.footprint);
    for (const b of blocks) {
      const c: [number, number] = [b.ring.reduce((s, p) => s + p[0], 0) / b.ring.length, b.ring.reduce((s, p) => s + p[1], 0) / b.ring.length];
      expect(inside(hull, c), `${b.id} is inside the dome`).toBe(false);
    }
    const ghosts = blocks.filter((b) => b.ghost);
    expect(ghosts.length).toBe(1);
    expect(inside(ghosts[0].ring, [hall.footprint.reduce((s, p) => s + p[0], 0) / hall.footprint.length, hall.footprint.reduce((s, p) => s + p[1], 0) / hall.footprint.length])).toBe(true);
    // Every building is touched by the frame; the whole ones are inside it.
    for (const b of blocks) {
      const box = boxOf(b.ring);
      expect(box.x1 >= plan.view.x && box.x0 <= plan.view.x + plan.view.w && box.y1 >= plan.view.y && box.y0 <= plan.view.y + plan.view.h).toBe(true);
      if (b.whole) expect(box.x0 >= plan.view.x && box.x1 <= plan.view.x + plan.view.w && box.y0 >= plan.view.y && box.y1 <= plan.view.y + plan.view.h).toBe(true);
    }
  });

  it("turns the buildings with the map, as the venues are", () => {
    const turned = planDistrict({ ...TOKYO, turn: 90 });
    expect(turned.context!.blocks.length).toBeGreaterThan(100);
    const tall = (p: typeof plan) => p.context!.blocks.reduce((best, b) => (b.height > best.height ? b : best));
    // The hotel's middle is south-west of the dome's: at a turn of 0 that is left of and below it, at 90 degrees clockwise it is left of and above it.
    const [a, b] = [tall(plan), tall(turned)];
    const mid = (r: readonly (readonly [number, number])[]) => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];
    const [ma, mb] = [mid(a.ring), mid(b.ring)];
    expect(ma[0]).toBeLessThan(plan.members[0].at[0]);
    expect(ma[1]).toBeGreaterThan(plan.members[0].at[1]);
    expect(mb[0]).toBeLessThan(turned.members[0].at[0]);
    expect(mb[1]).toBeLessThan(turned.members[0].at[1]);
    expect(a.id).toBe(b.id);
  });

  it("draws the buildings flat on the floor in four tones by height and a ghost, under the venues and clipped to the frame, deterministically", () => {
    const svg = drawDistrict(TOKYO);
    expect(svg).toBe(drawDistrict(TOKYO));
    expect(svg).toContain('class="ky-dist-context"');
    for (const tone of ["ky-dist-b0", "ky-dist-b1", "ky-dist-b2", "ky-dist-b3", "ky-dist-ghost"]) expect(svg, tone).toContain(tone);
    expect(svg.indexOf("ky-dist-context")).toBeLessThan(svg.indexOf("ky-dist-venue"));
    expect(svg.indexOf("ky-dist-grid")).toBeLessThan(svg.indexOf("ky-dist-context"));
    expect(svg).toMatch(/<g clip-path="url\(#[\w-]+-clip\)"><g class="ky-dist-context"/);
    expect(contextFloor({ blocks: [], owned: 0, attribution: { en: [], ja: [] } })).toBe("");
    expect(toneOf(10 * FEET_PER_METRE)).toBe(0);
    expect(toneOf(CONTEXT_TONES[1] * FEET_PER_METRE)).toBe(2);
    expect(toneOf(155 * FEET_PER_METRE)).toBe(3);
  });

  it("says where the buildings come from in its description, in each language", () => {
    expect(describeDistrict(TOKYO).description).toContain("Project PLATEAU");
    expect(describeDistrict({ ...TOKYO, language: "ja" }).description).toContain("国土交通省");
    expect(describeDistrict(BARE).description).not.toContain("PLATEAU");
    expect(plan.context!.attribution).toEqual({ en: [PLATEAU_ATTRIBUTION.en], ja: [PLATEAU_ATTRIBUTION.ja] });
  });

  it("places an area on its own too: a building outside the frame is left out", () => {
    const tiny = placeContext([TOKYO_DOME_CITY], plan.origin as [number, number], 0, { x: 0, y: 0, w: 10, h: 10 }, []);
    expect(tiny.blocks.length).toBeLessThan(3);
    const none = placeContext([], plan.origin as [number, number], 0, plan.view, []);
    expect(none.blocks).toEqual([]);
  });
});

describe("a district with context in 3D", () => {
  const model = buildDistrictTurn(TOKYO);
  const bare = buildDistrictTurn(BARE);
  const blocks = model.uprights.items.filter((i) => i.kind === "blocks");

  it("raises a pitched roof as four faces up to a ridge along the long side, over walls that stop at the eaves", () => {
    const ring: [number, number][] = [[0, 0], [100, 0], [100, 40], [0, 40]];
    const [item] = contextUprights({ blocks: [{ id: "x", ring, height: 60, rise: 20, area: 4000, ghost: false, whole: true }], owned: 0, attribution: { en: [], ja: [] } });
    const zs = (p: { o: readonly number[]; u: readonly number[]; v: readonly number[] }) => [p.o[2], p.o[2] + p.u[2], p.o[2] + p.v[2], p.o[2] + p.u[2] + p.v[2]];
    const faces = item.planes.filter((p) => /-r\d+$/.test(p.id));
    const walls = item.planes.filter((p) => /-w\d+$/.test(p.id));
    expect(faces.length).toBe(4);
    expect(walls.length).toBe(4);
    for (const w of walls) expect(Math.max(...zs(w))).toBeCloseTo(40, 6);
    expect(Math.max(...faces.flatMap(zs))).toBeCloseTo(60, 6);
    expect(Math.min(...faces.flatMap(zs))).toBeCloseTo(40, 6);
    expect(item.height).toBe(60);
    // A flat roof is one plane at the height; a ring that is not convex gets one too, whatever its rise.
    const flat = contextUprights({ blocks: [{ id: "y", ring, height: 60, rise: 0, area: 4000, ghost: false, whole: true }], owned: 0, attribution: { en: [], ja: [] } })[0];
    expect(flat.planes.filter((p) => p.id.endsWith("-top")).length).toBe(1);
    const bent: [number, number][] = [[0, 0], [100, 0], [100, 40], [50, 10], [0, 40]];
    expect(contextUprights({ blocks: [{ id: "z", ring: bent, height: 60, rise: 20, area: 3000, ghost: false, whole: true }], owned: 0, attribution: { en: [], ja: [] } })[0].planes.filter((p) => p.id.endsWith("-top")).length).toBe(1);
  });

  it("raises the biggest and the tallest buildings of the frame as blocks, at most CONTEXT_BLOCKS of them, every plane apart from the venues' groups", () => {
    expect(blocks.length).toBeGreaterThan(50);
    expect(blocks.length).toBeLessThanOrEqual(CONTEXT_BLOCKS);
    for (const item of blocks) for (const p of item.planes) {
      expect(p.group).toBe(APART);
      expect(p.kind).toBe("block");
      expect([...p.o, ...p.u, ...p.v].every(Number.isFinite)).toBe(true);
    }
    expect(model.planes.length - bare.planes.length).toBe(blocks.flatMap((b) => b.planes).length);
    expect(model.planes.length).toBeLessThan(2200);
    // Every venue's own planes are unchanged by it.
    expect(model.planes.filter((p) => p.group !== APART).map((p) => p.id)).toEqual(bare.planes.map((p) => p.id));
  });

  it("stands the hotel, the tallest, on the floor at its real height in feet", () => {
    const tallest = Math.max(...blocks.map((b) => b.height));
    expect(tallest / FEET_PER_METRE).toBeCloseTo(154.9, 0);
    expect(model.box.z1 / model.scale).toBeGreaterThanOrEqual(tallest - 1e-6);
  });

  it("lights each wall by the way it faces (three tones) and draws a lighter roof", () => {
    const svg = blocks.flatMap((b) => b.planes.map((p) => p.svg)).join("");
    for (const cls of ["u-block u-block-a", "u-block u-block-b", "u-block u-block-c", "u-block-roof"]) expect(svg, cls).toContain(cls);
  });

  it("gives way, always, in the building Korakuen Hall stands in, so that the hall shows", () => {
    const ghost = planeOfGhost();
    expect(ghost.length).toBeGreaterThan(4);
    for (const p of ghost) expect(p).toMatchObject({ shy: [0, 0], fadeTo: 0.16 });
    function planeOfGhost() {
      const g = planDistrict(TOKYO).context!.blocks.find((b) => b.ghost)!;
      return blocks.flatMap((b) => b.planes).filter((p) => p.id.startsWith(`c-${g.id}-`));
    }
  });

  it("is stacked far to near in one pass: each plane has its own place in the stack, and a venue's planes keep the order its buildings give", () => {
    for (const yaw of [0, 33, 90, 215, 300]) {
      const layout = layoutOf(model, { ...model.view, yaw }, 1200, 800);
      const stack = layout.stack.slice(1);
      expect(new Set(stack).size).toBe(stack.length);
      const ranks = (group: number) => model.planes.map((p, i) => (p.group === group ? stack[i] : undefined)).filter((s): s is number => s !== undefined);
      expect(ranks(0).length + ranks(1).length).toBeGreaterThan(800);
      // Building by building: all of one venue's planes are drawn before all of the other's, or after (the rule of the district's groups, unchanged).
      const [a, b] = [ranks(0), ranks(1)];
      expect(Math.max(...a) < Math.min(...b) || Math.max(...b) < Math.min(...a)).toBe(true);
    }
  });

  it("makes markup that carries the blocks, and the stylesheet that colours them, in light and dark", () => {
    const markup = districtTurnMarkup(TOKYO);
    expect(markup).toContain("ky-up-block");
    expect(markup).toContain("--ky-up-blk-a");
    expect(markup.match(/--ky-up-blk-a:/g)!.length).toBe(3);
    expect(markup).toContain(".ky-turn .u-block-roof");
  });
});

describe("a context layer's frame", () => {
  it("is the same frame for every layer: the row of a buildings layer is in grid steps of the area's own grid", () => {
    const double: ContextArea = { ...TOKYO_DOME_CITY, grid: 1 };
    const [a, b] = [buildings(TOKYO_DOME_CITY)[0], buildings(double)[0]];
    expect(b.height).toBeCloseTo(a.height * 2, 9);
    expect(b.ring[0][0]).toBeCloseTo(a.ring[0][0] * 2, 9);
  });
});

describe("the walls of a solid building that face away from the eye", () => {
  const ring: [number, number][] = [[0, 0], [100, 0], [100, 60], [0, 60]];
  const block = (extra: Partial<Parameters<typeof blockPlanes>[0]> = {}) => blockPlanes({ id: "t", ring, height: 50, rise: 0, area: 6000, ghost: false, whole: true, ...extra }, "t-");

  it("are marked on the opaque walls and nowhere else: not on the roof, not on a ghost's walls, not on a see-through building's", () => {
    const planes = block();
    expect(planes.filter((p) => p.cull !== undefined).map((p) => p.id)).toEqual(["t-w0", "t-w1", "t-w2", "t-w3"]);
    expect(planes.find((p) => p.id === "t-top")!.cull).toBeUndefined();
    expect(block({ ghost: true }).every((p) => p.cull === undefined)).toBe(true);
    expect(block({ xray: [50, 30] }).every((p) => p.cull === undefined)).toBe(true);
    // The outside of the wall is the other side of it for a ring wound the other way round.
    const back = block({ ring: [...ring].reverse() });
    expect(back.find((p) => p.id === "t-w0")!.cull).toBe(-(planes.find((p) => p.id === "t-w0")!.cull as number));
  });

  it("are left out exactly when the eye is on the inside of their plane, at every turn and tilt, and the rest are laid out as they are without the asking", () => {
    const model = buildDistrictTurn(TOKYO);
    const [w, h] = [1200, 800];
    const flagged = model.planes.map((p, i) => ({ p, i })).filter(({ p }) => p.cull !== undefined);
    expect(flagged.length).toBeGreaterThan(300);
    let hidden = 0;
    let shown = 0;
    for (const yaw of [0, 37, 90, 144, 215, 300]) {
      for (const pitch of [18, 40, 64, 85]) {
        const view = { yaw, pitch, zoom: 1 };
        const all = layoutOf(model, view, w, h);
        const layout = layoutOf(model, view, w, h, undefined, true);
        expect(all.culled).toBeUndefined();
        expect(layout.culled!.length).toBe(model.planes.length + 1);
        // Where the eye is, in the scene's own pixels from its middle: the camera looks along z at a distance, and the scene was turned, tipped and moved to be seen.
        const k = layout.at.k;
        const [yw, pt] = [(yaw * Math.PI) / 180, (pitch * Math.PI) / 180];
        const [x2, y3, z3] = [-layout.at.tx, -layout.at.ty, eyeDistance(w, h, model.lens)];
        const y2 = y3 * Math.cos(pt) + z3 * Math.sin(pt);
        const eye = [(x2 * Math.cos(yw) + y2 * Math.sin(yw)) / k, (-x2 * Math.sin(yw) + y2 * Math.cos(yw)) / k, (-y3 * Math.sin(pt) + z3 * Math.cos(pt)) / k];
        for (const { p, i } of flagged) {
          const mid = [0, 1, 2].map((a) => (p.o[a] + (p.u[a] + p.v[a]) / 2 - (a < 2 ? model.centre[a] : 0)) * model.scale);
          const [u, v] = [p.u, p.v];
          const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]].map((c) => c * (p.cull as number));
          const facing = normal[0] * (eye[0] - mid[0]) + normal[1] * (eye[1] - mid[1]) + normal[2] * (eye[2] - mid[2]);
          if (Math.abs(facing) < 1e-6 * Math.hypot(...normal) * Math.hypot(...eye)) continue;
          expect(layout.culled![i + 1], `${p.id} at yaw ${yaw}, pitch ${pitch}`).toBe(facing < 0);
          if (facing < 0) hidden += 1;
          else shown += 1;
          // What is drawn is laid out as it always was.
          if (facing > 0) expect(layout.transforms[i + 1]).toBe(all.transforms[i + 1]);
          else expect(layout.transforms[i + 1]).toBe("");
        }
        // Planes with nothing to cull are not touched.
        for (let i = 0; i < model.planes.length; i += 1) if (model.planes[i].cull === undefined) expect(layout.transforms[i + 1]).toBe(all.transforms[i + 1]);
      }
    }
    // About half of the faces turn away, whatever the view.
    expect(hidden).toBeGreaterThan(shown * 0.3);
    expect(shown).toBeGreaterThan(hidden * 0.3);
  });

  it("stack the rest as they were stacked with every plane: the same far-to-near order", () => {
    const model = buildDistrictTurn(TOKYO);
    for (const yaw of [10, 130, 250]) {
      const view = { yaw, pitch: 52, zoom: 1 };
      const all = layoutOf(model, view, 1200, 800);
      const layout = layoutOf(model, view, 1200, 800, undefined, true);
      const kept = model.planes.map((_, i) => i + 1).filter((i) => layout.culled![i] !== true);
      const byAll = [...kept].sort((a, b) => all.stack[a] - all.stack[b]);
      const byCull = [...kept].sort((a, b) => layout.stack[a] - layout.stack[b]);
      expect(byCull).toEqual(byAll);
    }
  });
});
