// A judging assignment in 3D: the 3D view of `turn.ts` over the package's own judo floor (`drawKyogijo`, with as many areas side by side as there are mats), with each judge's chair and the judges' table stood up, a name
// card on the table in front of every judge who has a name (turned to face the eye, so that it is read from wherever the view is) and the name of each mat on a sign over its judges' table. Nothing is drawn a second
// way: the card is the plan's card (`judging.card.ts`), fitted by the same rule. The model it makes is a `TurnModel`, so the camera, the controls, the pointer, the auto-turn and the tests of every other 3D view are this one's.
import type { MBox } from "./budo/plan.ts";
import { drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { FEET_PER_METRE as FT } from "./geometry.ts";
import { TURN_CARD, badge, card } from "./judging.card.ts";
import { JUDGING_LEAGUE } from "./judging.data.ts";
import { fitCard, fitSeats } from "./judging.fit.ts";
import { benchOf, judgingPlan, judgingSetting, seatIn, type JudgingPlan, type JudgingSetting } from "./judging.ts";
import { judgingDrawing, judgingText } from "./judging.draw.ts";
import type { JudgingOptions } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import { mountTurn, type KyogijoTurn } from "./turn.dom.ts";
import { turnMarkupOf } from "./turn.markup.ts";
import { TURN_PRESETS, type PresetTable } from "./turn.camera.ts";
import { WORLD_PX, openingView, sceneBox, type TurnModel, type TurnSettings } from "./turn.model.ts";
import { box, n, plane, pole, rect, thinnest, type Plane, type Upright } from "./turn.kit.ts";
import { planesOf, type Uprights } from "./uprights.ts";
import type { Language, SurfaceOptions } from "./types.ts";

/** How high things stand, in metres (ours: no rule gives them): the table's top, a chair's seat, a name card on the table, the sign over it. */
export const JUDGING_HEIGHTS = Object.freeze({ table: 0.75, chair: 0.45, card: 0.95, sign: 0.7, signAbove: 0.25, post: 1.0 });

/** The lens of a view close up on several benches at once: the scene turns about the middle of them, and a bench several metres from it would swell as it swung toward the eye, so the lens is long (the default is 8). */
const BENCHES_LENS = 60;

/** The bench the 3D view is fitted to when it is close up: a kata's seats at their tables, a contest's technical tables and referees, all mats in one box, reaching as little of the floor in front as will do. */
function benchNear(style: JudgingSetting["style"], geom: JudgingPlan, count: number): MBox {
  if (style === "shiai") {
    const b = geom.mats.slice(0, count).map((m) => m.bench);
    return { x0: Math.min(...b.map((x) => x.x0)), y0: Math.min(...b.map((x) => x.y0)), x1: Math.max(...b.map((x) => x.x1)), y1: Math.max(...b.map((x) => x.y1)) };
  }
  const chairs = geom.mats.slice(0, count).flatMap((m) => m.places.map((p) => p.chair));
  return benchOf(chairs, geom.table, geom.pitch, geom.plan.judo!.contests[0].y0, 2.2);
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * The four viewpoints of a judging view. A card stands upright, so a high eye squashes its type: the broadcast view is from the mat side, so that the judges' table is at the far side and the cards face the eye, at a
 * pitch where the type is still two thirds as tall as it is wide; the others are as every surface's but for the pitch of the corner and the end.
 */
export const JUDGING_PRESETS: PresetTable = { overhead: TURN_PRESETS.overhead, broadcast: { yaw: 0, pitch: 42, zoom: 1 }, end: { yaw: -90, pitch: 50, zoom: 1 }, corner: { yaw: -35, pitch: 48, zoom: 1 } };

/**
 * A judging assignment as a 3D model: the judo floor with every mat's judges' chairs and table, a name card on the table at each seat that has a name and fits one, a number badge at the others, and the mat's name on a sign.
 * A `TurnModel` like any other: `turnMarkupOf` and `mountJudgingTurn` make a view of it. `mat` in the options builds one mat alone (a tab); without it the mats stand side by side.
 */
export function buildJudgingTurn(options: JudgingOptions, settings: TurnSettings = {}): TurnModel {
  const setting: JudgingSetting = judgingSetting(options);
  const language: Language = setting.language;
  const words = JUDGING_WORDS[language];
  const league = JUDGING_LEAGUE[setting.style].league;
  const count = setting.mats.length;
  const id = settings.id ?? (typeof options.id === "string" && options.id !== "" ? `${options.id}-turn` : `ky-turn-${hash(JSON.stringify([options, settings.preset]))}`);
  const floorOptions = { sport: "judo", league, budo: { style: setting.style, officials: true, areas: count }, language, margin: 2, id: `${id}-floor`, ...(options.theme === undefined ? {} : { theme: options.theme }), ...(options.css === "none" ? { style: "none" as const } : {}) } as unknown as SurfaceOptions;
  const floor = drawKyogijo({ ...floorOptions, orientation: "landscape" } as SurfaceOptions);
  const found = /viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/.exec(floor);
  if (found === null) throw new Error("the floor of a 3D view must be an SVG with a viewBox");
  const [vx, vy, vw, vh] = found.slice(1).map(Number);
  const geom = judgingPlan(setting.style, count);
  // The plan's own frame is metres from the top left of the tatami, and the drawing's is feet from the same corner.
  const ft = (m: number): number => m * FT;
  const H = JUDGING_HEIGHTS;
  const items: Upright[] = [];
  const tableTop = ft(H.table);
  const cardH = ft(H.card);
  const minName = 0.62;
  // Close up on the bench, only the seats at it stand (the referee and the side judges of a contest are out of the picture, and in the chart).
  const near = setting.focus === "bench" ? benchNear(setting.style, geom, count) : undefined;

  setting.mats.forEach((mat, mi) => {
    const places = geom.mats[mi];
    const table = places.table;
    const boxes = mat.seats.map((a) => {
      const c = places.places[a.seat.n - 1].card;
      const w = ft(c.x1 - c.x0);
      const pad = Math.max(0.08, w * 0.05);
      const r = clamp(w * 0.2, 0.2, 0.45);
      return { w, pad, r, width: w - 2 * pad, height: cardH - 2 * pad - r, max: Math.min(w * 0.3, 0.75) };
    });
    const fitted = fitSeats(mat.seats, boxes, { min: minName, idLabel: words.chart.idLabel });
    const furniture: Plane[] = [];
    furniture.push(...box(`m${mat.n}-table`, "desk", rect(ft(table.x0), ft(table.y0), ft(table.x1 - table.x0), ft(table.y1 - table.y0)), tableTop, "u-bench"));
    const cards: Plane[] = [];
    const stands: Plane[] = [];
    mat.seats.forEach((a, si) => {
      const place = places.places[a.seat.n - 1];
      if (near !== undefined && !seatIn(place, near)) return;
      const b = boxes[si];
      // A chair for the seats that have one (the referee stands on the mat).
      if (a.seat.role !== "referee") furniture.push(...box(`m${mat.n}-chair-${a.seat.n}`, "chair", rect(ft(place.chair.x0), ft(place.chair.y0), ft(place.chair.x1 - place.chair.x0), ft(place.chair.y1 - place.chair.y0)), ft(H.chair), "u-bench"));
      const cx = ft((place.card.x0 + place.card.x1) / 2);
      // A card at a table stands on the table; any other on a post, at the height of a standing official's chest.
      const atTable = a.seat.where === "table";
      const cy = atTable ? ft((table.y0 + table.y1) / 2) : ft((place.card.y0 + place.card.y1) / 2);
      const base = atTable ? tableTop : ft(H.post);
      if (!atTable) stands.push(...pole(`m${mat.n}-post-${a.seat.n}`, "pole", cx, cy, 0, base, ft(0.06), "u-pole"));
      const fit = setting.seatNames ? fitted[si] : undefined;
      if (fit !== undefined) {
        const p = plane(`m${mat.n}-card-${a.seat.n}`, "card", [cx - b.w / 2, cy, base + cardH], [b.w, 0, 0], [0, 0, -cardH], card(TURN_CARD, fit, a.seat.n, 0, 0, b.w, cardH, b.pad, b.r, 0.1));
        cards.push({ ...p, billboard: true, lean: true });
      } else {
        // The names are not on the seats, or this one does not fit a card: the seat's number alone, on a round badge like the chart's, with the name in the chart.
        const br = 0.9;
        const p = plane(`m${mat.n}-badge-${a.seat.n}`, "card", [cx - br, cy, base + 2 * br], [2 * br, 0, 0], [0, 0, -2 * br], badge(TURN_CARD, br, br, br * 0.92, a.seat.n, a.assigned));
        cards.push({ ...p, billboard: true, lean: true });
      }
    });
    // The mat's name on a sign over the whole table, on a pole at each end of it.
    const midX = ft((table.x0 + table.x1) / 2);
    const midY = ft((table.y0 + table.y1) / 2);
    const signW = ft(table.x1 - table.x0);
    const signH = ft(H.sign);
    const signBottom = tableTop + cardH + ft(H.signAbove);
    const text = fitCard({ name: mat.label, id: "", idLabel: "", width: signW * 0.9, height: signH * 0.86, max: signH * 0.62, min: signH * 0.3, maxLines: 2, breakWords: true });
    const lines = text?.name ?? [mat.label];
    const size = text?.nameSize ?? signH * 0.3;
    const label = lines.map((line, i) => `<text class="u-sign-text" x="${n(signW / 2)}" y="${n(signH / 2 + (i - (lines.length - 1) / 2) * size * 1.1 + size * 0.34)}" font-size="${n(size)}">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>`).join("");
    const sign: Plane = { ...plane(`m${mat.n}-sign`, "sign", [midX - signW / 2, midY, signBottom + signH], [signW, 0, 0], [0, 0, -signH], `<rect class="u-sign" width="${n(signW)}" height="${n(signH)}" rx="${n(signH * 0.12)}"/>${label}`), billboard: true, lean: true };
    const poles = [table.x0, table.x1].flatMap((px, k) => pole(`m${mat.n}-sign-pole-${k + 1}`, "pole", ft(px), midY, tableTop, signBottom + signH * 0.5, ft(0.06), "u-pole"));
    items.push({ id: `m${mat.n}-furniture`, kind: "officials", at: [midX, midY], height: tableTop, planes: furniture });
    items.push({ id: `m${mat.n}-judges`, kind: "judges", at: [midX, midY], height: tableTop + cardH, planes: [...cards, ...stands, ...poles, sign] });
  });

  // The view is fitted to the whole floor, or to the officials' bench close up (the scene then turns about the bench, so that the cards stay where they are read).
  const area = near === undefined ? { x0: vx, y0: vy, x1: vx + vw, y1: vy + vh } : { x0: ft(near.x0), y0: ft(near.y0), x1: ft(near.x1), y1: ft(near.y1) };
  const uprights: Uprights = { items, lift: 0, thin: thinnest(vw, vh), area, whole: true };
  const planes = planesOf(uprights);
  const scale = WORLD_PX / Math.max(vw, vh);
  const centre: [number, number] = [(area.x0 + area.x1) / 2, (area.y0 + area.y1) / 2];
  const look = /^<svg[^>]* data-look="([^"]*)"/.exec(floor)?.[1];
  const { title, description } = judgingText(setting, options, true);
  const surfaceLike = { sport: "judo", language, ...(options.theme === undefined ? {} : { theme: options.theme }), ...(options.css === "none" ? { style: "none" } : {}) } as unknown as SurfaceOptions;
  return {
    id,
    language,
    options: surfaceLike,
    title,
    description: `${description}${language === "ja" ? "" : " "}${setting.seatNames ? words.turn.standing : words.turn.standingBadges}`,
    standing: setting.seatNames ? words.turn.standing : words.turn.standingBadges,
    floor,
    viewBox: { x: vx, y: vy, w: vw, h: vh },
    scale,
    uprights,
    defs: "",
    crowdStyle: "",
    venue: false,
    look: { sport: "judo", look: look ?? "yellow-red" },
    planes,
    box: sceneBox(planes, uprights.area!, 0, centre, scale),
    centre,
    view: openingView({ preset: "broadcast", ...settings }, JUDGING_PRESETS),
    turnable: true,
    presets: JUDGING_PRESETS,
    ...(near !== undefined && count > 1 ? { lens: BENCHES_LENS } : {}),
    flat: judgingDrawing(options).svg,
  };
}

/**
 * Mount a judging assignment as a 3D view in a container: the same view as `mountKyogijoTurn`'s, with the controls, the pointer, the keys and the auto-turn of every 3D view, over the judo floor with each mat's judges'
 * table, the name cards on it and the mat's name over it. Where the browser cannot turn it, the flat picture with its chart is shown.
 * @example
 * ```ts no-run
 * import { mountJudgingTurn } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * const view = mountJudgingTurn(document.querySelector("#mat")!, { style: "kata", mats: [{ officials: [{ seat: 1, name: "Aiko Mori", id: "J-1042" }] }] });
 * view.set({ yaw: 40 });
 * ```
 */
export function mountJudgingTurn(host: HTMLElement, options: JudgingOptions, settings: TurnSettings = {}): KyogijoTurn<JudgingOptions> {
  return mountTurn(host, options, settings, buildJudgingTurn);
}

/** A judging assignment as the markup of a 3D view, still until a page's script makes it turn: pure, so a server can make it. */
export function judgingTurnMarkup(options: JudgingOptions, settings: TurnSettings = {}): string {
  return turnMarkupOf(buildJudgingTurn(options, settings), settings);
}
