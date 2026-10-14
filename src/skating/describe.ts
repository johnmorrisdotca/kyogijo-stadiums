// What a skating drawing says of itself: its sentence about the rink, and what the options mark on it. Cheap (it reads the options, not the plan), so that a title and a description cost nothing.
import { fill, KYOGIJO_STRINGS } from "../strings.ts";
import type { Language, SurfaceOptions } from "../types.ts";
import { raceById } from "./events.ts";
import { furnitureOf, racesOf, skatingLeague } from "./plan.ts";
import { longOval } from "./track.ts";

/** The words of a race in a language. */
export const raceName = (id: string, language: Language): string => raceById(id)?.name[language] ?? id;

/** The sentence about the rink, as a fragment: "a 400 m speed skating track with two lanes of 4 m...". */
export function skatingAbout(o: Pick<SurfaceOptions, "sport" | "league" | "skating">, language: Language): string {
  const words = KYOGIJO_STRINGS[language].skating;
  const league = skatingLeague(o);
  const d = league.dimensions;
  if (d.kind === "long-track") {
    const oval = longOval(o.skating?.innerRadius, o.skating?.laneWidth, d);
    return fill(words.longTrack, { radius: oval.a, outer: oval.w2, straight: Math.round(oval.straight * 100) / 100 });
  }
  if (d.kind === "short-track") return fill(words.shortTrack, { length: o.skating?.rink?.length ?? d.rink.length, width: o.skating?.rink?.width ?? d.rink.width, tracks: o.skating?.tracks ?? 5 });
  return fill(words.figure, { length: o.skating?.rink?.length ?? d.length.drawn, width: o.skating?.rink?.width ?? d.width.drawn });
}

/** The sentences that follow it: the races marked, the furniture of a figure skating rink and the close-up. Each starts after a gap. */
export function skatingSentences(o: Pick<SurfaceOptions, "sport" | "league" | "skating" | "range">, language: Language): string {
  const words = KYOGIJO_STRINGS[language].skating;
  const { gap } = KYOGIJO_STRINGS[language].said;
  const sep = KYOGIJO_STRINGS[language].layers.listSep;
  const discipline = skatingLeague(o).dimensions.kind;
  const out: string[] = [];
  if (discipline === "figure") {
    const furniture = furnitureOf(o.skating);
    if (furniture.length > 0) out.push(fill(words.furniture, { list: furniture.map((f) => words.furnitureNames[f]).join(sep) }));
  } else {
    const races = racesOf(o.skating, discipline);
    if (races.length > 0) out.push(fill(words.races, { list: races.map((r) => raceName(r, language)).join(sep) }));
  }
  const range = typeof o.range === "string" ? o.range : typeof o.range === "object" && o.range !== null && "name" in o.range ? o.range.name : undefined;
  if (range === "start" && discipline !== "figure") out.push(fill(words.start, { race: raceName(o.skating?.start ?? "500m", language) }));
  if (range === "finish" && discipline !== "figure") out.push(words.finish);
  return out.map((t) => `${gap}${t}`).join("");
}
