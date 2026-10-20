// The name card of a seat and the badge of its number, as markup: the same drawing in the plan (in the picture's units, `ky-ju-*` classes) and in the 3D view (in feet, `u-card*` classes), so that a seat reads the same
// in both. Nothing here decides whether a name fits: `judging.fit.ts` does, and a card is drawn only for a name that does.
import { el, esc } from "./format.ts";
import type { CardFit } from "./judging.fit.ts";
import { LINE_HEIGHT } from "./text.ts";

/** The class names a card is drawn with. */
export interface CardClasses {
  card: string;
  name: string;
  id: string;
  badge: string;
  badgeEmpty: string;
  n: string;
}

/** The classes of the plan. */
export const PLAN_CARD: CardClasses = { card: "ky-ju-card", name: "ky-ju-card-name", id: "ky-ju-card-id", badge: "ky-ju-badge", badgeEmpty: "ky-ju-badge ky-ju-badge-empty", n: "ky-ju-badge-n" };

/** The classes of the 3D view's planes. */
export const TURN_CARD: CardClasses = { card: "u-card", name: "u-card-name", id: "u-card-id", badge: "u-card-badge", badgeEmpty: "u-card-badge u-card-badge-empty", n: "u-card-n" };

/** The round badge of a seat's number, centred at (cx, cy); hollow when nobody is in the seat. */
export function badge(cls: CardClasses, cx: number, cy: number, r: number, n: number, assigned: boolean): string {
  return el("circle", { class: assigned ? cls.badge : cls.badgeEmpty, cx, cy, r }) + el("text", { class: cls.n, x: cx, y: cy + r * 0.36, "font-size": r * 1.05 }, String(n));
}

/**
 * A card with a name and an ID, `w` by `h` with its top left at (x, y): the text centred in the space under the badge, which straddles the card's top edge, and the badge itself. `fit` is what `fitCard` made of the
 * name and the ID for the space inside `pad` and under `r`.
 */
export function card(cls: CardClasses, fit: CardFit, n: number, x: number, y: number, w: number, h: number, pad: number, r: number, round: number): string {
  const cx = x + w / 2;
  const room = h - 2 * pad - r;
  let out = el("rect", { class: cls.card, x, y, width: w, height: h, rx: round });
  let cy = y + pad + r + Math.max(0, (room - fit.height) / 2);
  for (const line of fit.name) {
    out += el("text", { class: cls.name, x: cx, y: cy + fit.nameSize * 0.88, "font-size": fit.nameSize }, esc(line));
    cy += fit.nameSize * LINE_HEIGHT;
  }
  if (fit.id.length > 0) {
    cy += fit.name.length > 0 ? fit.nameSize * 0.28 : 0;
    for (const line of fit.id) {
      out += el("text", { class: cls.id, x: cx, y: cy + fit.idSize * 0.88, "font-size": fit.idSize }, esc(line));
      cy += fit.idSize * LINE_HEIGHT;
    }
  }
  return out + badge(cls, cx, y, r, n, true);
}
