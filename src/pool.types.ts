// The types of the aquatic sports: the options of a pool, the lanes of a race and what a swimmer did in it. Plain data only (numbers, text and lists), so that a race can be saved as JSON
// and the same race always draws the same picture.

/** The sports of the pool: the swimming pool, the water polo field, the diving well and the artistic swimming area. */
export type PoolSport = "swimming" | "waterpolo" | "diving" | "artisticswimming";

/**
 * How the water is painted: `flat` (the default) is one clean colour; `water` lays a faint, seeded pattern of light on it, deeper blue at the middle of a long pool; `tiled` shows the tiles of the floor
 * through the water as well.
 */
export type PoolLook = "flat" | "water" | "tiled";

/** How the deck is painted: one colour, or in tiles. */
export type DeckLook = "plain" | "tiled";

/** The swimming pool of a competition, or a warm-up pool: the same lanes and ropes, without the starting blocks, the flags and the false start rope. */
export type PoolKind = "competition" | "warm-up";

/** Why a swimmer has no time. */
export type SwimmerStatus = "dq" | "dns" | "dnf";

/**
 * One swimmer in a lane: who is in it, and, once the race is swum, what happened. The caller passes the flag (an `https:` address, an image `data:` address or an SVG document as text, held to the rules of
 * a team's `logo`); the package bundles no flags. Times are seconds (`26.12`) or text (`"1:46.91"`).
 */
export interface Swimmer {
  /** The lane, as the pool numbers them (1 to 8, or 0 to 9 in a ten-lane pool). */
  lane: number;
  name: string;
  /** A short form for the label: the country's three letters, or a club's. */
  abbr?: string;
  /** The flag or crest, drawn small beside the name. */
  flag?: string;
  /** The swimmer's colour (a cap, a club), drawn as a stripe on the label. */
  color?: string;
  /** The entry time. */
  seed?: number | string;
  /** The final time. */
  time?: number | string;
  /** The place: 1, 2 and 3 get a gold, a silver and a bronze medal. Worked out from the times when it is missing and every swimmer has one. */
  place?: number;
  /** The reaction time off the block, in seconds (`0.62`). */
  reaction?: number;
  /** The cumulative time at each split: at 50, 100 and 150 m of a 200 m race, or each 25 m of a short course. The last is the final time. */
  splits?: readonly (number | string | null | undefined)[];
  /** `dq`, `dns` or `dnf`, written in place of a time. */
  status?: SwimmerStatus;
  /** A record the swim set: `WR`, `OR`, `CR`... written beside the time. */
  record?: string;
}

/** What the labels of a race show. Everything that has data is shown unless it says `false`. */
export interface RaceShow {
  names?: boolean;
  flags?: boolean;
  results?: boolean;
  reaction?: boolean;
  splits?: boolean;
  medals?: boolean;
  seeds?: boolean;
}

/** The split pace bars drawn in the lanes: each split of a race as a bar whose length is the share of the lane that split is, and whose colour is its pace against the field's. */
export interface PaceOptions {
  /** Write the pace in seconds per 100 m on each bar. On by default. */
  labels?: boolean;
}

/** A race: the event, its distance, and the swimmers in their lanes. */
export interface PoolRace {
  /** The name of the event: "Women's 200 m butterfly, final". */
  event?: string;
  /** The distance in metres. Worked out from the splits (the number of splits times the distance between them) when it is missing, else the length of the course. */
  distance?: number;
  /** The metres between two splits: 50 in a long course pool and 25 in a short course one, unless this says another. */
  splitEvery?: number;
  swimmers: readonly Swimmer[];
  show?: RaceShow;
  /** Draw the splits as pace bars in the lanes. */
  pace?: boolean | PaceOptions;
}

/** The boards of a diving well that can be asked for. */
export type DivingPlatform = 1 | 3 | 5 | 7.5 | 10;

/** One pool of a natatorium: which pool it is, and where, in metres from the hall's top left corner. A pool with no place is put by the layout. */
export interface VenuePool {
  sport: PoolSport;
  /** A name for the plan's label. The pool's own by default. */
  name?: string;
  /** For a swimming pool: its course and kind (`short` and `warm-up` for a warm-up pool). */
  course?: "long" | "short";
  kind?: PoolKind;
  lanes?: number;
  x?: number;
  y?: number;
}

/** A natatorium: several pools in one hall, to scale, kept the distance the rules ask of a swimming pool and a diving well. */
export interface VenueOptions {
  pools: readonly VenuePool[];
  /** The metres between two pools. 10 (the preferred distance of the rules) by default. */
  apart?: number;
  /** Write each pool's name on the plan. On by default. */
  labels?: boolean;
  /** Draw the seating for spectators along the top of the hall. On by default. */
  seating?: boolean;
}

/** A side section of a swimming pool: its depth profile, the blocks, the flags and the false start rope. */
export interface PoolSection {
  /** The water's depth in metres. The rules' least for the pool: 2.5 for a 50 m pool, 2.0 for a 25 m one. */
  depth?: number;
  /** How much taller than long the section is drawn. 2.5 by default; the section is not to scale otherwise. */
  exaggerate?: number;
}

/**
 * The look, the size and the data of a pool. Every part is optional. The sport (`swimming`, `waterpolo`, `diving`, `artisticswimming`) says which pool it is; the parts that belong to one pool are
 * said so in their descriptions.
 */
export interface PoolStyle {
  /** Swimming: `long` (50 m, the default) or `short` (25 m). */
  course?: "long" | "short";
  /** Swimming: the lanes, 1 to 10. 8 by default. Ten lanes are numbered 0 to 9. */
  lanes?: number;
  /** Swimming: a temporary pool (26 m wide, ten lanes of 2.5 m) in place of a permanent one (25 m, lanes 0 and 9 of 2.4 m). Only for a ten-lane pool. */
  temporary?: boolean;
  /** Swimming: `competition` (the default) or `warm-up`, a pool of the same lanes without blocks, flags or false start rope. */
  kind?: PoolKind;
  /** How the water is painted: `flat`, `water` or `tiled`. */
  look?: PoolLook;
  /** `plain` or `tiled` deck. */
  deck?: DeckLook;
  /** The seed of the light on the water (`look: "water"`). The same seed always draws the same light. 1 by default. */
  seed?: number;
  /** Swimming: the starting blocks, with their lane numbers. On in a competition pool. */
  blocks?: boolean;
  /** Swimming: the touch panels on the end walls. On in a competition pool. */
  pads?: boolean;
  /** Swimming: the backstroke turn flags at 5 m from each end. On in a competition pool. */
  flags?: boolean;
  /** Swimming: the false start rope at 15 m from the starting end. On in a competition pool. */
  falseStart?: boolean;
  /** Swimming: a side section under the plan, with the depth. */
  section?: boolean | PoolSection;
  /** Swimming: the lanes of a race, with the names, the flags, the results and the splits. */
  race?: PoolRace;
  /** Water polo: the side of the field the official table is on, as the field is drawn wide: `bottom` (the default) or `top`. */
  table?: "top" | "bottom";
  /** Diving: the platforms to draw (1, 3, 5, 7.5, 10). 5, 7.5 and 10 by default. */
  platforms?: readonly DivingPlatform[];
  /** Diving: draw the springboards (the 1 m and the 3 m). On by default. */
  springboards?: boolean;
  /** Diving: how many boards of each height, 2 each by default (a synchronised pair stands side by side). */
  boards?: number;
  /** Artistic swimming: the routine area of the Olympic Games and the World Championships (`olympic`, 30 by 20 m) or the least (`minimum`, 25 by 15 m with a 12 by 12 m deep part). */
  area?: "olympic" | "minimum";
  /** Several pools in one hall: `natatorium`, or a list of your own. Swimming only; the pool of the options is the competition pool. */
  venue?: "natatorium" | VenueOptions;
}
