import { el, num } from "../format.ts";
import type { SheetSpec } from "../leagues/curling.ts";
import type { SheetShow } from "../types.ts";
import { ft, quarterTurn, type BuildOptions, type Mark, type Surface } from "./surface.ts";

/** What a curling sheet is drawn with besides the figures of its rulebook. */
export interface SheetLook {
  /** The ice's pebble, as a texture of dots over the sheet. */
  pebble: boolean;
  /** The free guard zone, shaded. */
  guardZone: boolean;
  /** How much of the sheet is in view, and at which end. */
  show: SheetShow;
  end: "left" | "right";
  /** Which league's marks to draw: the hack line and the courtesy lines are World Curling's. */
  figures: SheetSpec;
}

/** Where each tee is on the sheet, along it from the left backboard: the left tee and the right tee. */
export function teesOf(spec: Pick<SheetSpec, "length" | "teeFromMiddle">): [number, number] {
  return [spec.length / 2 - spec.teeFromMiddle, spec.length / 2 + spec.teeFromMiddle];
}

/**
 * A curling sheet in the frame of a drawing lying wide: x along it from the left backboard, y across it from the top sideline. A house at
 * each end (the 12-, 8- and 4-foot circles and the button), the tee, back, hog and centre lines, the hacks, and, in World Curling's, the
 * hack lines and the courtesy lines. Every figure is the rulebook's (leagues/curling.ts).
 */
export function curling(o: BuildOptions, look: SheetLook): Surface {
  const spec = look.figures;
  const { length: L, width: W } = spec;
  const m = o.margin ?? 3;
  const cy = W / 2;
  const [tl, tr] = teesOf(spec);
  const [twelve, eight, four, button] = spec.rings;
  const full = o.detail === "full";
  const sticks = (value: number): number => (o.exact ? value : Math.max(value, 0.2));
  const lineW = sticks(spec.lineWidths.line);
  const hogW = spec.lineWidths.hog;
  const board = 0.7;

  let defs = "";
  let base = el("rect", { class: ft(o, "apron", "ky-apron"), x: -m, y: -m, width: L + 2 * m, height: W + 2 * m });
  base += el("path", { class: ft(o, "boards", "ky-boards"), "fill-rule": "evenodd", d: `M${num(-board)} ${num(-board)}H${num(L + board)}V${num(W + board)}H${num(-board)}ZM0 0V${num(W)}H${num(L)}V0Z` });
  base += el("rect", { class: ft(o, "ice", "ky-surface"), x: 0, y: 0, width: L, height: W });
  if (look.pebble) {
    // A few dots in a tile, and the tile laid over the ice.
    defs += el("pattern", { id: `${o.id}-pebble`, class: ft(o, "pebble", "") === "" ? undefined : ft(o, "pebble", "").trim(), width: 1.6, height: 1.6, patternUnits: "userSpaceOnUse" }, el("circle", { cx: 0.3, cy: 0.4, r: 0.09 }) + el("circle", { cx: 1.1, cy: 0.2, r: 0.07 }) + el("circle", { cx: 0.7, cy: 1.0, r: 0.08 }) + el("circle", { cx: 1.4, cy: 1.35, r: 0.07 }) + el("circle", { cx: 0.15, cy: 1.45, r: 0.06 }));
    base += el("rect", { class: "ky-pebble", x: 0, y: 0, width: L, height: W, fill: `url(#${o.id}-pebble)` });
  }
  // The free guard zone: between each hog line and the tee line, outside the house (the house is painted over it).
  if (look.guardZone) {
    base += el("path", { class: ft(o, "guard-zone", "ky-fgz"), d: `M${num(tl)} 0H${num(tl + spec.hogLine)}V${num(W)}H${num(tl)}ZM${num(tr)} 0H${num(tr - spec.hogLine)}V${num(W)}H${num(tr)}Z` });
  }
  // The houses: the 12-foot circle is the outer band, then the 8-foot, the 4-foot and the button.
  for (const t of [tl, tr]) {
    base += el("g", { class: "ky-house" }, [twelve, eight, four, button].map((r, i) => el("circle", { class: ft(o, ["house-outer", "house-middle", "house-inner", "button"][i], `ky-rg-${["o", "m", "i", "b"][i]}`), cx: t, cy, r })).join(""));
  }

  // Lines. The tee and centre lines stop short of the button, where the rules let them be left out.
  let lines = "";
  const gap = button;
  const across = (x: number): string => `M${num(x)} 0V${num(cy - gap)}M${num(x)} ${num(cy + gap)}V${num(W)}`;
  lines += el("path", { class: ft(o, "tee-lines", "ky-line"), d: `${across(tl)}${across(tr)}`, "stroke-width": lineW, fill: "none" });
  lines += el("path", { class: ft(o, "back-lines", "ky-line"), d: `M${num(tl - spec.backLine + lineW / 2)} 0V${num(W)}M${num(tr + spec.backLine - lineW / 2)} 0V${num(W)}`, "stroke-width": lineW, fill: "none" });
  const beyond = spec.centreBeyondTee;
  lines += el("path", { class: ft(o, "centre-line", "ky-line"), d: `M${num(tl - beyond)} ${num(cy)}H${num(tl - gap)}M${num(tl + gap)} ${num(cy)}H${num(tr - gap)}M${num(tr + gap)} ${num(cy)}H${num(tr + beyond)}`, "stroke-width": lineW, fill: "none" });
  // The hog lines, 4 inches wide: the inside edge is the one 21 feet from the tee.
  lines += el("path", { class: ft(o, "hog-lines", "ky-hog"), d: `M${num(tl + spec.hogLine)} 0h${num(hogW)}V${num(W)}h${num(-hogW)}ZM${num(tr - spec.hogLine)} 0h${num(-hogW)}V${num(W)}h${num(hogW)}Z` });
  if (full) {
    // The hacks, two at each end, at the end of the centre line: the inside edge 3 inches from it, in front of the hack line.
    const hack = spec.hack;
    const hacks: string[] = [];
    for (const [t, sign] of [[tl, -1], [tr, 1]] as const) {
      const back = t + sign * beyond;
      for (const side of [-1, 1]) {
        const y0 = side < 0 ? cy - hack.insideFromCentre - hack.width : cy + hack.insideFromCentre;
        hacks.push(`M${num(sign < 0 ? back : back - hack.depth)} ${num(y0)}h${num(hack.depth)}v${num(hack.width)}h${num(-hack.depth)}z`);
      }
    }
    lines += el("path", { class: ft(o, "hacks", "ky-hack"), d: hacks.join("") });
    if (spec.hackLine !== null) {
      lines += el("path", { class: ft(o, "courtesy-lines", "ky-line"), d: `M${num(tl - beyond)} ${num(cy - spec.hackLine / 2)}V${num(cy + spec.hackLine / 2)}M${num(tr + beyond)} ${num(cy - spec.hackLine / 2)}V${num(cy + spec.hackLine / 2)}`, "stroke-width": lineW, fill: "none" });
    }
    if (spec.courtesy !== null) {
      // Short lines at each side, parallel to the hog lines and 4 feet outside them (towards the middle of the sheet).
      const c = spec.courtesy;
      const xs = [tl + spec.hogLine + hogW + c.outsideHog, tr - spec.hogLine - hogW - c.outsideHog];
      lines += el("path", { class: ft(o, "courtesy-lines", "ky-line"), d: xs.map((x) => `M${num(x)} 0v${num(c.length)}M${num(x)} ${num(W)}v${num(-c.length)}`).join(""), "stroke-width": lineW, fill: "none" });
    }
  }

  // What is in view: all of the sheet, the half from the hog line to the back line, or the house, at one end.
  const along = 1.5;
  let view0 = { x: -m, y: -m, w: L + 2 * m, h: W + 2 * m };
  const left = look.end !== "right";
  if (look.show === "half" || look.show === "house") {
    const outer = look.show === "half" ? spec.hogLine + hogW : twelve;
    const x0 = left ? tl - spec.backLine - along : tr - outer - along;
    const x1 = left ? tl + outer + along : tr + spec.backLine + along;
    view0 = { x: x0, y: -m, w: x1 - x0, h: W + 2 * m };
  }

  // The scoreboard's place: between the hog lines, as the eye sees it (so a tall drawing's board is tall, a wide drawing's wide).
  const between = tr - tl - 2 * spec.hogLine - 2 * hogW;
  const turned = o.portrait;
  const surface: Surface = {
    sport: "curling",
    view: view0,
    base,
    lines,
    defs,
    left: { cx: tl, cy, w: twelve * 2, h: twelve * 2, rot: 0 },
    right: { cx: tr, cy, w: twelve * 2, h: twelve * 2, rot: 0 },
    plate: turned ? { cx: L / 2, cy, w: W - 1.6, h: between - 4 } : { cx: L / 2, cy, w: between - 4, h: W - 1.6 },
    turned,
  };
  surface.lineRef = { width: lineW, feet: 1 };
  surface.box = { x: 0, y: 0, w: L, h: W };
  if (o.landmarks === true) {
    const marks: Mark[] = [
      { id: "hog-line", x: tl + spec.hogLine + hogW / 2, y: 0, side: "top" },
      { id: "hog-line", x: tr - spec.hogLine - hogW / 2, y: 0, side: "top" },
      { id: "tee-line", x: tl, y: 0, side: "top" },
      { id: "tee-line", x: tr, y: 0, side: "top" },
      { id: "back-line", x: tl - spec.backLine + lineW / 2, y: 0, side: "top" },
      { id: "back-line", x: tr + spec.backLine - lineW / 2, y: 0, side: "top" },
      { id: "house", x: tl + twelve * Math.SQRT1_2, y: cy + twelve * Math.SQRT1_2, side: "bottom" },
      { id: "house", x: tr + twelve * Math.SQRT1_2, y: cy + twelve * Math.SQRT1_2, side: "bottom" },
      { id: "button", x: tl, y: cy, side: "bottom" },
      { id: "button", x: tr, y: cy, side: "bottom" },
      { id: "centre-line", x: L / 2, y: cy, side: "bottom" },
      { id: "sideline", x: L * 0.3, y: W, side: "bottom" },
    ];
    if (full) {
      marks.push({ id: "hack", x: tl - beyond - spec.hack.depth / 2, y: cy - spec.hack.insideFromCentre - spec.hack.width / 2, side: "top" });
      marks.push({ id: "hack", x: tr + beyond + spec.hack.depth / 2, y: cy - spec.hack.insideFromCentre - spec.hack.width / 2, side: "top" });
    }
    if (look.guardZone) marks.push({ id: "free-guard-zone", x: tl + spec.hogLine / 2, y: 0, side: "top" });
    surface.marks = marks;
  }
  if (turned) {
    const tt = quarterTurn(view0);
    surface.view = tt.view;
    surface.turn = tt.turn;
  }
  return surface;
}
