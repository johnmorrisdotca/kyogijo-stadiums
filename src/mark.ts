// The round team mark: a flag or a logo clipped to a circle with a thin ring, or, when a team has no picture, its initials on its colour. One function draws it for the
// score on a surface (a banner at each end, the badge and the strip under a compact card) and for the road-to-the-final chart, so a country has the same mark everywhere.
import { inkOn, safeColour } from "./colour.ts";
import { el, esc, num } from "./format.ts";
import { textWidth } from "./text.ts";

/**
 * The rules of a round team mark: the disc under the picture (the team's colour, or a plain one), the white ring and the hairline outside it, and the initials. The colours
 * are custom properties with fallbacks (`--ky-mark-ring`, `--ky-mark-edge`, `--ky-mark-plain`), so a page can set them. A drawing with a round mark writes these rules in;
 * `KYOGIJO_STYLE` has them for a page that draws with `style: "none"`.
 */
export const KYOGIJO_MARK_STYLE = `
.kyogijo .ky-mark-bg{fill:var(--c,var(--ky-mark-plain,#d9dde0))}
.kyogijo .ky-mark-light{fill:var(--ky-mark-plain,#f4f5f6)}
.kyogijo .ky-mark-ring{fill:none;stroke:var(--ky-mark-ring,#fff)}
.kyogijo .ky-mark-edge{fill:none;stroke:var(--ky-mark-edge,rgba(0,0,0,.32))}
.kyogijo .ky-mark-i{fill:var(--ci,#fff);font-family:var(--ky-font,system-ui,sans-serif);font-weight:800;text-anchor:middle;font-variant-numeric:tabular-nums}`.trim();

/** What a round mark is drawn from. */
export interface RoundMark {
  /** A prefix for the id of the clip path: unique in the drawing. */
  id: string;
  /** The centre and the radius, in the drawing's units. */
  cx: number;
  cy: number;
  r: number;
  /** The picture as `safeLogo` wrote it: an address. Without one the mark is the team's colour with its initials. */
  href?: string;
  /** `cover` (the default; a flag fills the circle, its edges cut) or `contain` (a crest is shown whole on a plain disc). */
  fit?: "cover" | "contain";
  /** The letters for a mark with no picture. */
  initials?: string;
  /** The team's colour (`safeColour`): the disc of a mark with no picture. */
  color?: string;
  /** The colour of the initials on that disc. Black or white by the colour's lightness when missing. */
  ink?: string;
  /** The words for a tooltip. */
  title?: string;
  /** The ring's width: nine hundredths of the radius by default. */
  ring?: number;
  /** The mark's group is turned back by this many degrees: pass the turn of the group the mark is in to hold it upright there. The score does not use it: its mark turns with the zone's words. */
  upright?: number;
  /** A class added to the mark's group (the road chart's `ky-r-dim` for a team that did not advance). */
  className?: string;
}

/** The markup of one round mark. */
export function roundMarkup(m: RoundMark): string {
  const { cx, cy, r } = m;
  const ring = m.ring ?? Math.max(r * 0.09, 0.2);
  const color = safeColour(m.color);
  const ink = safeColour(m.ink) ?? inkOn(color);
  const contain = m.fit === "contain";
  let inner = "";
  if (m.title !== undefined) inner += `<title>${esc(m.title)}</title>`;
  const clip = `${m.id}-c`;
  if (m.href !== undefined) {
    inner += el("clipPath", { id: clip }, el("circle", { cx: num(cx), cy: num(cy), r: num(r) }));
    inner += el("circle", { class: contain ? "ky-mark-bg ky-mark-light" : "ky-mark-bg", cx: num(cx), cy: num(cy), r: num(r) });
    const inset = contain ? r * 0.12 : 0;
    inner += el("image", {
      class: "ky-logo",
      href: m.href,
      x: num(cx - r + inset),
      y: num(cy - r + inset),
      width: num(2 * (r - inset)),
      height: num(2 * (r - inset)),
      preserveAspectRatio: contain ? "xMidYMid meet" : "xMidYMid slice",
      "clip-path": `url(#${clip})`,
    });
  } else {
    inner += el("circle", { class: "ky-mark-bg", cx: num(cx), cy: num(cy), r: num(r) });
    const letters = (m.initials ?? "").trim();
    if (letters !== "") {
      const size = Math.min(r * 0.8, (r * 1.2) / Math.max(1, textWidth(letters)));
      inner += el("text", { class: "ky-mark-i", x: num(cx), y: num(cy + size * 0.36), "font-size": num(size) }, esc(letters));
    }
  }
  inner += el("circle", { class: "ky-mark-ring", cx: num(cx), cy: num(cy), r: num(r - ring / 2), "stroke-width": num(ring) });
  inner += el("circle", { class: "ky-mark-edge", cx: num(cx), cy: num(cy), r: num(r), "stroke-width": num(Math.max(ring * 0.3, 0.1)) });
  const style = [color === undefined ? undefined : `--c:${color}`, m.href === undefined ? `--ci:${ink}` : undefined].filter((part) => part !== undefined).join(";");
  return el(
    "g",
    {
      class: m.className === undefined ? "ky-mark" : `ky-mark ${m.className}`,
      style: style === "" ? undefined : style,
      transform: m.upright === undefined || m.upright === 0 ? undefined : `rotate(${num(-m.upright)} ${num(cx)} ${num(cy)})`,
    },
    inner,
  );
}
