import { EVENT_DATA, EVENT_SOURCES, type EventSource, type PlacementRule, type SpecialEventData } from "./events.data.ts";
import { heldGround, groundNameIn } from "./grounds.core.ts";
import { heldPark, parkNameIn } from "./parks.core.ts";
import { INFIELD_CENTRE, fitOf, hostOutline, type Fit } from "./special.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.ts";
import type { HostOptions, Language, Placement, SurfaceOptions } from "./types.ts";

export { EVENT_SOURCES } from "./events.data.ts";
export type { EventSource, PlacementBasis, PlacementRule, SpecialEventData, Words } from "./events.data.ts";
export { INFIELD_CENTRE, fitOf, guestToHost, hostOutline, placementOf } from "./special.ts";
export type { Fit } from "./special.ts";

/** A special game: a game played on a surface set inside another. */
export type SpecialEvent = SpecialEventData;

/**
 * The special games, by key, in the order they were played: the NHL's outdoor games in ballparks and football stadiums, a college basketball game on the
 * deck of a carrier and Major League Baseball in London. Each has its dates, its venue, what its surface was set inside and where, and the sources of all of it.
 * @example
 * ```ts
 * import { EVENTS, EVENT_IDS } from "@johnmorrisdotca/kyogijo-stadiums/events";
 * const { name, dates, venue } = EVENTS["winter-classic-2009"];
 * console.log(name.en, dates[0], venue.en, EVENT_IDS.length);
 * // 2009 NHL Winter Classic 2009-01-01 Wrigley Field 18
 * ```
 */
export const EVENTS: Readonly<Record<string, SpecialEvent>> = Object.freeze(Object.fromEntries([...EVENT_DATA].sort((a, b) => a.dates[0].localeCompare(b.dates[0])).map((event) => [event.id, event])));

/** The keys of `EVENTS`, in the order the games were played. */
export const EVENT_IDS: readonly string[] = Object.freeze(Object.keys(EVENTS));

/** The game with a key, or `undefined`. */
export const eventById = (id: string | undefined): SpecialEvent | undefined => (id !== undefined && Object.prototype.hasOwnProperty.call(EVENTS, id) ? EVENTS[id] : undefined);

/**
 * The options that draw a game: its sport and season, its host and where its surface stands in it. Spread them into `drawKyogijo` with a score or without.
 * @example
 * ```ts
 * import { drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";
 * import { eventOptions } from "@johnmorrisdotca/kyogijo-stadiums/events";
 * const svg = drawKyogijo({ ...eventOptions("winter-classic-2009") });
 * console.log(svg.includes("2009 NHL Winter Classic"), svg.includes("Wrigley Field"));
 * // true true
 * ```
 */
export function eventOptions(id: string): SurfaceOptions {
  const event = eventById(id);
  if (event === undefined) throw new Error(`Unknown special game "${id}": use one of ${EVENT_IDS.join(", ")}`);
  const { sport, year, league, fence } = event.guest;
  return {
    sport,
    year,
    ...(league === undefined ? {} : { league }),
    ...(fence === undefined ? {} : { fence: { ...fence } }),
    host: { ...event.host },
    placement: { ...event.placement },
    event: id,
  };
}

/** The sources of a game, in the order they are listed in its entry. */
export function eventSources(event: SpecialEvent): EventSource[] {
  return event.sources.map((id) => EVENT_SOURCES[id]);
}

/**
 * The place a convention gives a surface in its host, in the host's frame: `midfield` the middle of the host's field, `deck` the middle of the deck, both with the surface as it lies;
 * `infield` the middle of a ballpark's infield, with the surface's length across the field from first base to third; `diamond` a ballpark's infield on the middle of the host.
 */
export function conventionPlacement(rule: PlacementRule, host: HostOptions, o: Pick<SurfaceOptions, "year" | "detail" | "stripes" | "stripePattern" | "exactLines"> = {}): Placement {
  const box = hostOutline(host, o).box;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const round = (n: number): number => Math.round(n * 100) / 100;
  switch (rule) {
    case "infield":
      return { x: 0, y: -INFIELD_CENTRE, angle: 0 };
    case "diamond":
      return { x: round(cx - INFIELD_CENTRE), y: round(cy), angle: 90 };
    default:
      return { x: round(cx), y: round(cy), angle: 0 };
  }
}

/** How a game's surface sits in its host: wholly inside its outline, or the share of it that lies outside. For a ballpark the outline is the fair ground inside the fence. */
export const eventFit = (id: string): Fit => fitOf(eventOptions(id));

const finiteYear = (n: number | undefined): n is number => typeof n === "number" && Number.isFinite(n);

/** A date `YYYY-MM-DD` as it is written in a language. */
function dateIn(iso: string, language: Language): string {
  const words = KYOGIJO_STRINGS[language].special;
  const [year, month, day] = iso.split("-").map(Number);
  return fill(words.date, { year, month: words.months.split(",")[month - 1], day });
}

/** The name of the host in a language: a game's venue, the host's own name, a park's or a ground's. */
function hostName(o: SurfaceOptions, language: Language): string {
  const host = o.host as HostOptions;
  const event = eventById(o.event);
  if (event !== undefined) return event.venue[language];
  if (host.name !== undefined) return language === "ja" ? (host.nameJa ?? host.name) : host.name;
  const park = heldPark(host.park);
  if (park !== undefined) return parkNameIn(park, language);
  const ground = heldGround(host.ground);
  if (ground !== undefined) return groundNameIn(ground, finiteYear(host.year) ? host.year : o.year, language);
  const unnamed = KYOGIJO_STRINGS[language].special.unnamed;
  return host.deck !== undefined ? unnamed.deck : host.field !== undefined ? unnamed.field : unnamed.pitch;
}

/**
 * What a drawing of a special game says: its title, and the sentences added to the description (the game and its day, where the surface stands and how that was decided,
 * and whether the surface lies inside the host). `undefined` for a drawing with no host.
 */
export function specialText(o: SurfaceOptions, language: Language, guestName?: string): { title: string; text: string } | undefined {
  if (o.host === undefined) return undefined;
  const words = KYOGIJO_STRINGS[language];
  const special = words.special;
  const { gap, stop } = words.said;
  const host = hostName(o, language);
  const guest = special.guest[o.sport];
  const event = eventById(o.event);
  const parts: string[] = [];
  if (event !== undefined) {
    parts.push(fill(special.game, { event: event.name[language], date: event.dates.map((day) => dateIn(day, language)).join(special.and) }));
    if (event.basis.kind === "published") parts.push(fill(special.published, { note: event.basis.note[language] }));
    else parts.push(fill(special.convention, { rule: special.rules[event.basis.rule] }));
    if (event.note !== undefined) parts.push(event.note[language]);
  }
  const fit = fitOf(o);
  parts.push(fit.inside ? fill(special.inside, { guest, host }) : fill(special.hangs, { guest, host, pct: Math.round(fit.outside * 100) }));
  if (!fit.inside && (o.host as HostOptions).park !== undefined) parts.push(special.foul);
  const sentence = (text: string): string => (/[.。]$/.test(text) ? text : `${text}${stop}`);
  return { title: fill(special.title, { guest: guestName ?? words.surface[o.sport], host }), text: parts.map(sentence).join(gap) };
}
