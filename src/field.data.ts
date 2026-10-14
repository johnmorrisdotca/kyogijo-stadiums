// What a drawing writes on its surface group so that a page can ask the drawing where a click is (pointer.ts): the box of the playing surface in feet in the
// drawing's wide frame, and the few options that decide its rules (the league, the season, the park, the pitch). The group's own `transform` is the quarter turn of a
// tall drawing, so its coordinates are always the wide frame's, whatever the drawing's shape on the page.
import { num } from "./format.ts";
import { outlineOf } from "./outline.ts";
import type { SurfaceOptions } from "./types.ts";

const SIMPLE = ["league", "year", "pitch", "park", "fence", "units", "field"] as const;
const COMPLEX = ["sheet", "net", "pool", "athletics", "skating"] as const;
/** The longest the options that hold data of their own (a pool's race, an athletics meeting) may be, written out, before the drawing leaves them out of the page. */
const MOST = 600;

/** The `data-box` and `data-rules` of a drawing's surface group, or nothing for a drawing the question does not apply to (a special game). */
export function fieldAttributes(o: SurfaceOptions): { "data-box"?: string; "data-rules"?: string } {
  if (o.host !== undefined) return {};
  try {
    const { box } = outlineOf(o);
    const rules: Record<string, unknown> = {};
    for (const key of SIMPLE) if (o[key] !== undefined) rules[key] = o[key];
    for (const key of COMPLEX) if (o[key] !== undefined && JSON.stringify(o[key]).length <= MOST) rules[key] = o[key];
    return { "data-box": [box.x, box.y, box.w, box.h].map(num).join(" "), "data-rules": Object.keys(rules).length === 0 ? undefined : JSON.stringify(rules) };
  } catch {
    return {};
  }
}

/** The box and the options a surface group carries, or `undefined` when it carries none. */
export function readField(get: (name: string) => string | null): { box: { x: number; y: number; w: number; h: number }; rules: Record<string, unknown> } | undefined {
  const raw = get("data-box");
  if (raw === null) return undefined;
  const [x, y, w, h] = raw.split(" ").map(Number);
  if (![x, y, w, h].every(Number.isFinite)) return undefined;
  let rules: Record<string, unknown> = {};
  const text = get("data-rules");
  if (text !== null) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) rules = parsed as Record<string, unknown>;
    } catch {
      rules = {};
    }
  }
  return { box: { x, y, w, h }, rules };
}
