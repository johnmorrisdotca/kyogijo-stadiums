// What an athletics drawing says of itself: its sentence about the track, and what the options mark on it. Cheap (it reads the options, not the plan), so that a title and a description cost nothing.
import { fill, KYOGIJO_STRINGS } from "../strings.ts";
import type { Language, SurfaceOptions } from "../types.ts";
import { fieldEventById, raceById } from "./events.ts";
import { athleticsLanes, athleticsLeague, eventsOf, racesOf } from "./plan.ts";

/** The words of a race or a field event in a language. */
export const raceName = (id: string, language: Language): string => raceById(id)?.name[language] ?? id;
export const fieldEventName = (id: string, language: Language): string => fieldEventById(id)?.name[language] ?? id;

/** The sentence about the track, as a fragment: "an athletics track of 400 metres with 8 lanes...". */
export function athleticsAbout(o: Pick<SurfaceOptions, "sport" | "league" | "athletics">, language: Language): string {
  const words = KYOGIJO_STRINGS[language].athletics;
  const league = athleticsLeague(o);
  return fill(league.dimensions.banking === null ? words.track400 : words.track200, { lanes: athleticsLanes(o) });
}

/** The sentences that follow it: the infield, the events and the races marked, the close-up and the layout. Each starts after a gap. */
export function athleticsSentences(o: Pick<SurfaceOptions, "sport" | "league" | "athletics" | "range">, language: Language): string {
  const words = KYOGIJO_STRINGS[language].athletics;
  const { gap } = KYOGIJO_STRINGS[language].said;
  const sep = KYOGIJO_STRINGS[language].layers.listSep;
  const style = o.athletics;
  const league = athleticsLeague(o);
  const indoor = league.dimensions.banking !== null;
  const out: string[] = [];
  if (style?.layout !== undefined) return `${gap}${fill(words.layout, { event: fieldEventName(style.layout, language) })}`;
  const infield = style?.infield ?? (indoor ? "none" : "pitch");
  out.push(infield === "pitch" ? words.infieldPitch : infield === "grass" ? words.infieldGrass : words.infieldNone);
  if (!indoor) {
    const events = eventsOf(style);
    if (events.length > 0) out.push(fill(words.events, { list: events.map((e) => fieldEventName(e, language)).join(sep) }));
  }
  const races = racesOf(style, indoor);
  if (races.length > 0) out.push(fill(words.races, { list: races.map((r) => r.name[language]).join(sep) }));
  const range = typeof o.range === "string" ? o.range : typeof o.range === "object" && o.range !== null && "name" in o.range ? o.range.name : undefined;
  if (range === "start") out.push(fill(words.start, { race: raceName(style?.start ?? "400m", language) }));
  if (range === "finish") out.push(words.finish);
  return out.map((t) => `${gap}${t}`).join("");
}
