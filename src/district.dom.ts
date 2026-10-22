// A district's 2D plan in a page, with the crowd outside over it: `mountDistrict` writes `drawDistrict`'s SVG into a container and, where the district asks for a crowd (`DistrictOptions.outside`) and has a mask to put it on,
// lays one canvas over the drawing (`outside.dom.ts`). The plan is still: nothing animates, and the crowd is painted when its level or the box's size changes. Without a crowd it is `drawDistrict` written into the container.
import { drawDistrict, planDistrict, type DistrictOptions, type DistrictPlan } from "./district.ts";
import { hasOutside, outsideCrowd, outsideLevelOf } from "./outside.ts";
import { attachOutsidePlan, type OutsideLayer } from "./outside.dom.ts";
import type { OutsideLevel } from "./outside.paint.ts";

/** What `mountDistrict` gives back. */
export interface KyogijoDistrict {
  readonly mode: "2d";
  /** Draw again with other options (venues, fit, theme, level): the container's contents are replaced. */
  update(options: DistrictOptions): void;
  /** Show another level of the crowd outside at once, without drawing the plan again. A district with no crowd does nothing. */
  setOutside(level: OutsideLevel): void;
  /** What the crowd's last paint cost, in milliseconds, how many people it drew and how, or `undefined` where there is no crowd or it has not been drawn. */
  outsideCost(): { ms: number; people: number; mode: string; pixels: number } | undefined;
  /** The plan's SVG, or `null` after `destroy`. */
  svg(): SVGSVGElement | null;
  /** Empty the container and stop listening. */
  destroy(): void;
}

/**
 * Mount a district's plan in a container, with the crowd outside over it when `options.outside` asks for one.
 * @example
 * ```ts no-run
 * import { mountDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district";
 * const plan = mountDistrict(document.querySelector("#city")!, { venues: ["bc-place", "rogers-arena"], outside: { level: 50 } });
 * plan.setOutside(100);
 * ```
 */
export function mountDistrict(host: HTMLElement, options: DistrictOptions): KyogijoDistrict {
  let layer: OutsideLayer | undefined;
  let alive = true;
  const draw = (next: DistrictOptions): void => {
    layer?.destroy();
    layer = undefined;
    const plan: DistrictPlan = planDistrict(next);
    host.innerHTML = `<div class="ky-district-view" style="position:relative">${drawDistrict(next, plan)}</div>`;
    const wrap = host.firstElementChild as HTMLElement;
    const svg = wrap.querySelector<SVGSVGElement>("svg.ky-district");
    if (next.outside !== undefined && svg !== null && hasOutside(plan)) layer = attachOutsidePlan(wrap, svg, { level: outsideLevelOf(next), crowd: () => outsideCrowd(plan), viewBox: plan.view });
  };
  draw(options);
  return {
    mode: "2d",
    update(next) {
      if (alive) draw(next);
    },
    setOutside(level) {
      if (alive) layer?.setLevel(level);
    },
    outsideCost() {
      const last = layer?.last;
      return last === undefined ? undefined : { ms: last.ms, people: last.stats.people, mode: last.stats.mode, pixels: last.pixels };
    },
    svg: () => (alive ? host.querySelector<SVGSVGElement>("svg.ky-district") : null),
    destroy() {
      if (!alive) return;
      alive = false;
      layer?.destroy();
      host.replaceChildren();
    },
  };
}
