// The stylesheet of the field sports: the colours a surface has when its sport's differ from the grass the base rules paint (a handball court's floor, a hockey pitch's turf), in light and in dark, at no weight so that a
// look, a page's rule and the options' `colors` all win. Kept apart so that a drawing of another sport does not carry them. These are our colours: no rulebook prints one for a floor or a pitch.
import type { FieldSport } from "./types.ts";

interface Colours {
  surface: string;
  apron: string;
  key?: string;
}

const LOOKS: Partial<Record<FieldSport, { light: Colours; dark: Colours }>> = {
  handball: { light: { surface: "#2f6aa8", apron: "#cfd6df", key: "#e8812b" }, dark: { surface: "#245489", apron: "#1a1d21", key: "#b8651f" } },
  fieldhockey: { light: { surface: "#2d79b8", apron: "#cfd6df" }, dark: { surface: "#235f93", apron: "#1a1d21" } },
};

const vars = (c: Colours): string => `--ky-surface:${c.surface};--ky-surface-alt:${c.surface};--ky-apron:${c.apron}${c.key === undefined ? "" : `;--ky-key:${c.key}`}`;

/** The rules of a drawing of this sport: none for a sport that is painted as the base rules paint it. */
export function fieldsStyle(sport: string): string {
  const look = LOOKS[sport as FieldSport];
  if (look === undefined) return "";
  const at = `[data-sport=${sport}]`;
  return [
    `:where(.kyogijo${at}){${vars(look.light)}}`,
    `@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo${at}:not([data-theme=light])){${vars(look.dark)}}}`,
    `:where(html[data-theme=dark] .kyogijo${at},.kyogijo[data-theme=dark]${at}){${vars(look.dark)}}`,
  ].join("\n");
}

/** The rules of every field sport's colours, for a page that draws with `style: "none"` and supplies the stylesheet itself. */
export const KYOGIJO_FIELDS_STYLE = (Object.keys(LOOKS) as FieldSport[]).map(fieldsStyle).join("\n");
