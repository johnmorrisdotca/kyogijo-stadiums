import { el, num } from "../format.ts";
import { feet, reachOf, venueLayout, type PoolPlan, type VenueLayout } from "../pool.ts";
import { deckMarkup, paintDefs, poolIds, type PoolCtx } from "../pool.kit.ts";
import { KYOGIJO_STRINGS } from "../strings.core.ts";
import type { Language, PoolStyle } from "../types.ts";
import { artistic } from "./artistic.ts";
import { diving } from "./dive.ts";
import { swimming } from "./pool.ts";
import { waterPolo } from "./polo.ts";
import { quarterTurn, textOn, type BuildOptions, type Surface } from "./surface.ts";

/** One pool of a hall drawn on its own with no deck: the surface its sport's builder makes. */
function built(o: BuildOptions, plan: PoolPlan, ctx: PoolCtx): Surface {
  switch (plan.sport) {
    case "swimming":
      return swimming(o, { ...plan, race: undefined, section: undefined }, ctx);
    case "waterpolo":
      return waterPolo(o, plan, ctx);
    case "diving":
      return diving(o, plan, ctx);
    default:
      return artistic(o, plan, ctx);
  }
}

/** The name each pool of a hall is called on the plan, in a language. */
export function venueName(item: VenueLayout["items"][number], language: Language): string {
  if (item.pool.name !== undefined) return item.pool.name;
  const names = KYOGIJO_STRINGS[language].pool.names;
  const plan = item.plan;
  return plan.sport === "swimming" ? (plan.kind === "warm-up" ? names.warmUp : names.competition) : plan.sport === "diving" ? names.diving : plan.sport === "waterpolo" ? names.waterPolo : names.artistic;
}

/**
 * Several pools in one hall, to scale: each pool is drawn by its own sport's builder (the competition pool of 8 lanes, a diving well, a warm-up pool, a water polo pool or an artistic swimming area) and set at its place,
 * with the deck round the hall drawn once and the paint of the water and the deck defined once for all of them. The pools stand at least 8 m apart, 10 m by default, as the rules keep a swimming pool and a diving well
 * (Part Two 15.15.1). The water of the whole hall is the surface's `box`.
 */
export function natatorium(o: BuildOptions, style: PoolStyle, look: { look: "flat" | "water" | "tiled"; deck: "plain" | "tiled"; seed: number }, language: Language): Surface {
  const layout = venueLayout(style) as VenueLayout;
  const ids = poolIds(o.id);
  const m = o.margin ?? feet(3.5);
  const W = feet(layout.width);
  const H = feet(layout.height);
  const label = 3.2;
  const labelRoom = layout.labels ? feet(3.4) : 0;
  const reach = layout.reach;
  // The hall inside its walls: the water of every pool, what stands beyond it, the deck round it and the names under the pools.
  const hall = { x: -feet(reach.left) - m, y: -feet(reach.top) - m, w: W + feet(reach.left + reach.right) + 2 * m, h: H + feet(reach.top + reach.bottom) + 2 * m + labelRoom };
  const seats = layout.seating ? feet(6) : 0;
  const rim = m * 0.4;
  const view0 = { x: hall.x - rim, y: hall.y - seats - (layout.seating ? feet(1) : 0) - rim, w: hall.w + 2 * rim, h: hall.h + seats + (layout.seating ? feet(1) : 0) + 2 * rim };
  let base = deckMarkup(o, ids, look.deck, view0.x, view0.y, view0.w, view0.h);
  base += el("rect", { class: "ky-pl-hw", x: hall.x, y: hall.y, width: hall.w, height: hall.h });
  if (layout.seating) {
    const top = hall.y - feet(1) - seats;
    let rows = "";
    for (let r = 1; r < 6; r += 1) rows += `M${num(hall.x)} ${num(top + (seats * r) / 6)}H${num(hall.x + hall.w)}`;
    base += el("rect", { class: "ky-pl-seat", x: hall.x, y: top, width: hall.w, height: seats });
    base += el("path", { class: "ky-pl-rows", d: rows });
  }
  let lines = "";
  let names = "";
  for (const [i, item] of layout.items.entries()) {
    const child = built({ ...o, margin: 0, score: false, landmarks: false, portrait: false, id: `${o.id}-${i}` }, item.plan, { ids, bare: true });
    const move = `translate(${num(feet(item.x))} ${num(feet(item.y))})`;
    base += el("g", { class: "ky-pl-hall", transform: move }, child.base);
    lines += el("g", { class: "ky-pl-hall", transform: move }, child.lines);
    if (layout.labels) {
      const below = feet(item.y + item.plan.width + reachOf(item.plan).bottom);
      names += textOn(o.portrait, feet(item.x + item.plan.length / 2), below + feet(1.2) + label * 0.36, venueName(item, language), { size: label, anchor: "middle", cls: "ky-pl-vn", weight: 800 });
    }
  }
  if (layout.seating) names += textOn(o.portrait, hall.x + hall.w / 2, hall.y - feet(1) - seats / 2 + label * 0.36, KYOGIJO_STRINGS[language].pool.names.seating, { size: label, anchor: "middle", cls: "ky-pl-vn", weight: 800 });
  const cy = H / 2;
  const turned = o.portrait;
  const surface: Surface = {
    sport: "swimming",
    view: view0,
    base,
    lines: lines + names,
    defs: paintDefs(ids, look.look, look.deck, look.seed),
    left: { cx: hall.x + m / 2, cy, w: H, h: m, rot: -90 },
    right: { cx: hall.x + hall.w - m / 2, cy, w: H, h: m, rot: 90 },
    plate: turned ? { cx: W / 2, cy, w: H * 0.8, h: W * 0.3 } : { cx: W / 2, cy, w: W * 0.3, h: H * 0.4 },
    turned,
  };
  surface.box = { x: 0, y: 0, w: W, h: H };
  surface.lineRef = { width: 0.8, feet: 1 };
  if (turned) {
    const t = quarterTurn(view0);
    surface.view = t.view;
    surface.turn = t.turn;
  }
  return surface;
}
