// The plan of a judging assignment, as the plan view and the broadcast view both draw it: the package's own judo area moved and clipped to the part that is shown, with a badge (or a name card) at every seat, and the
// numbers a picture is laid out in. Kept apart from `judging.draw.ts` so that the two views share it.
import { drawKyogijo } from "./draw.ts";
import { el, num } from "./format.ts";
import { PLAN_CARD, badge, card } from "./judging.card.ts";
import { fitSeats } from "./judging.fit.ts";
import { JUDGING_LEAGUE } from "./judging.data.ts";
import { seatIn, type JudgingPlan, type JudgingSetting } from "./judging.ts";
import type { JudgingResolved } from "./judging.types.ts";
import { JUDGING_WORDS } from "./judging.words.ts";
import type { MBox } from "./budo/plan.ts";

/** Feet in a metre: the surface's own drawing is in feet. */
const FT = 1 / 0.3048;
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** One mat's surface as markup: the drawing's own, without its title, its stylesheet and its apron. */
export function inner(svg: string): { body: string; style: string; look: string | undefined } {
  const look = /^<svg[^>]* data-look="([^"]*)"/.exec(svg)?.[1];
  const style = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? "";
  let body = svg.replace(/<style>[\s\S]*?<\/style>/, "");
  body = body.slice(body.indexOf("</desc>") + "</desc>".length, body.lastIndexOf("</svg>"));
  body = body.replace(/<rect class="ky-apron"[^>]*\/>/g, "");
  return { body, style, look };
}


/** The numbers a drawing is laid out in, all in the picture's own units and proportional to its width, so that the picture is the same at any width. */
export interface Metrics {
  k: number;
  pad: number;
  gap: number;
  titleH: number;
  panelGap: number;
  badge: number;
  rowPad: number;
  role: number;
  nameMax: number;
  nameMin: number;
  cardMin: number;
}
export const metricsOf = (width: number): Metrics => {
  const k = width / 1000;
  return { k, pad: 28 * k, gap: 28 * k, titleH: 62 * k, panelGap: 40 * k, badge: 60 * k, rowPad: 14 * k, role: 17 * k, nameMax: 34 * k, nameMin: 22 * k, cardMin: 12 * k };
};


/** The plan of one mat at (x, y) in a box: the surface moved and clipped to the region shown, with a badge or a card at every seat. */
export function planMarkup(
  mat: JudgingResolved,
  surface: { body: string },
  geom: JudgingPlan,
  region: MBox,
  box: { x: number; y: number; w: number; h: number },
  m: Metrics,
  setting: JudgingSetting,
  clip: string,
  frame = true,
): { markup: string; width: number; height: number; fits: boolean[]; x: number; y: number; scale: number } {
  const rw = region.x1 - region.x0;
  const rh = region.y1 - region.y0;
  const s = Math.min(box.w / rw, box.h / rh);
  const w = rw * s;
  const h = rh * s;
  const x = box.x + (box.w - w) / 2;
  const y = box.y;
  const sf = s / FT;
  const X = (mx: number): number => x + (mx - region.x0) * s;
  const Y = (my: number): number => y + (my - region.y0) * s;
  const words = JUDGING_WORDS[setting.language];
  let markup = el("clipPath", { id: clip }, el("rect", { x: num(region.x0 * FT), y: num(region.y0 * FT), width: num(rw * FT), height: num(rh * FT) }));
  markup += el("rect", { class: "ky-apron", x, y, width: w, height: h });
  markup += el("g", { class: "ky-ju-plan", "clip-path": `url(#${clip})`, transform: `translate(${num(x - region.x0 * FT * sf)} ${num(y - region.y0 * FT * sf)}) scale(${(sf).toFixed(5)})` }, surface.body);
  if (frame) markup += el("rect", { class: "ky-ju-plan-frame", x, y, width: w, height: h });
  // The card of a seat is the place the plan gives it: for a kata judge its chair and the table in front of it, for a contest's referee and side judges a card of their own.
  const boxes = mat.seats.map((a) => {
    const c = geom.places[a.seat.n - 1].card;
    const cw = (c.x1 - c.x0) * s;
    const ch = (c.y1 - c.y0) * s;
    const pad = Math.max(2 * m.k, cw * 0.05);
    const r = clamp(cw * 0.2, 6 * m.k, 14 * m.k);
    return { cw, ch, pad, r, width: cw - 2 * pad, height: ch - 2 * pad - r, max: Math.min(cw * 0.3, 26 * m.k) };
  });
  // The names are on the seats only when asked for; otherwise every seat is its number, and the chart is the key.
  const fitted = setting.seatNames ? fitSeats(mat.seats, boxes, { min: m.cardMin, idLabel: words.chart.idLabel }) : mat.seats.map(() => undefined);
  // A seat outside the picture (the referee in a close-up of the bench) has its name in the chart only: it does not fit.
  const shown = mat.seats.map((a) => seatIn(geom.places[a.seat.n - 1], region));
  const fits = mat.seats.map((a, i) => !a.assigned || (shown[i] && fitted[i] !== undefined));
  mat.seats.forEach((a, i) => {
    if (!shown[i]) return;
    const place = geom.places[a.seat.n - 1];
    const b = boxes[i];
    const fit = fitted[i];
    let g = "";
    if (fit !== undefined) g += card(PLAN_CARD, fit, a.seat.n, X(place.card.x0), Y(place.card.y0), b.cw, b.ch, b.pad, b.r, 3 * m.k);
    else {
      const br = clamp(Math.min(b.cw, 1.25 * s) * 0.42, 10 * m.k, 30 * m.k);
      g += badge(PLAN_CARD, X((place.chair.x0 + place.chair.x1) / 2), Y((place.chair.y0 + place.chair.y1) / 2), br, a.seat.n, a.assigned);
    }
    markup += el("g", { class: "ky-ju-seat", "data-mat": mat.n, "data-seat": a.seat.id, "data-card": fit === undefined ? "no" : "yes" }, g);
  });
  return { markup, width: w, height: h, fits, x, y, scale: s };
}


/** Each mat's surface, drawn by the package: once for its stylesheet and its look, then once for each mat (its ids differ). `mode` `chart` draws none. */
export function surfacesOf(setting: JudgingSetting, o: { css?: "embed" | "none" }, gid: string, drawn = true): { surfaces: { body: string }[]; style: string; look: string | undefined } {
  const league = JUDGING_LEAGUE[setting.style].league;
  let style = "";
  let look: string | undefined;
  const surfaces = drawn
    ? setting.mats.map((mat, i) => {
        const one = inner(drawKyogijo({ sport: "judo", league, budo: { style: setting.style, officials: true }, language: setting.language, id: `${gid}-s${mat.n}`, style: i === 0 && o.css !== "none" ? "embed" : "none" }));
        if (i === 0) {
          style = one.style;
          look = one.look;
        }
        return one;
      })
    : [];
  return { surfaces, style, look };
}
