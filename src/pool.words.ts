// What a pool says of itself in a drawing's description, in a language: what the pool is, how big, with how many lanes or which boards, the lanes of a race with their places, times and splits, and the side section.
import { artisticPlan, divePlan, poloPlan, swimPlan, venueOf, type PoolPlan, type SwimPlan } from "./pool.ts";
import { STATUS_TEXT, formatTime } from "./pool.race.ts";
import { MEDALS } from "./pool.labels.ts";
import { WATER_POLO } from "./pool.figures.ts";
import { KYOGIJO_STRINGS, fill } from "./strings.core.ts";
import type { Language, SurfaceOptions } from "./types.ts";

const trimmed = (value: number): string => String(Math.round(value * 100) / 100);

/** The plan of a pool sport's options. */
export function planOf(o: Pick<SurfaceOptions, "sport" | "pool">): PoolPlan {
  switch (o.sport) {
    case "swimming":
      return swimPlan(o);
    case "waterpolo":
      return poloPlan(o);
    case "diving":
      return divePlan(o);
    default:
      return artisticPlan(o);
  }
}

const sizeText = (language: Language, length: number, width: number): string => fill(KYOGIJO_STRINGS[language].pool.size, { length: trimmed(length), width: trimmed(width) });

/** Items as a list in a language: "a, b and c". */
export function listOf(items: readonly string[], language: Language): string {
  const w = KYOGIJO_STRINGS[language].pool;
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(w.sep)}${w.last}${items[items.length - 1]}`;
}

/** The sentences about the lanes of a race, one for each swimmer that has a lane, in the order down the page. */
function raceSentences(plan: SwimPlan, language: Language): string[] {
  const race = plan.race;
  if (race === undefined) return [];
  const words = KYOGIJO_STRINGS[language];
  const w = words.pool;
  const { stop } = words.said;
  const out: string[] = [];
  if (race.event !== undefined) out.push(`${fill(w.event, { event: race.event })}${/[.。]$/.test(race.event) ? "" : stop}`);
  for (const row of race.rows) {
    const parts: string[] = [`${fill(w.lane, { lane: row.lane, name: row.name })}${row.abbr === "" ? "" : fill(w.abbr, { abbr: row.abbr })}`];
    if (race.show.results && row.status !== undefined) parts.push(w.status[row.status]);
    else if (race.show.results) {
      if (row.place !== undefined) parts.push(fill(w.place, { n: row.place }));
      if (race.show.medals && row.place !== undefined && MEDALS[row.place] !== undefined) parts.push(w.medal[(["gold", "silver", "bronze"] as const)[row.place - 1]]);
      if (row.timeText !== undefined) parts.push(fill(w.time, { time: row.timeText }));
      if (race.show.reaction && row.reaction !== undefined) parts.push(fill(w.reaction, { rt: row.reaction.toFixed(2) }));
      if (race.show.splits && row.splits.some((s) => Number.isFinite(s))) parts.push(fill(w.splits, { list: row.splits.filter((s) => Number.isFinite(s)).map(formatTime).join(w.joiner) }));
      if (row.record !== undefined) parts.push(fill(w.record, { record: row.record }));
    }
    if (race.show.seeds && row.seed !== undefined && row.timeText === undefined && row.status === undefined) parts.push(fill(w.seed, { time: row.seed }));
    out.push(`${parts.join(w.joiner)}${stop}`);
  }
  if (race.pace !== null && race.fastest !== undefined) out.push(w.pace);
  return out;
}

/** What the pool is, as a fragment for the description, and the sentences that follow it. */
export function poolDescription(o: Pick<SurfaceOptions, "sport" | "pool">, language: Language): { about: string; after: string[] } {
  const words = KYOGIJO_STRINGS[language];
  const w = words.pool;
  const venue = o.sport === "swimming" && o.pool?.venue !== undefined ? venueOf(o.pool) : undefined;
  if (venue !== undefined) {
    const names = venue.pools.map((pool) => {
      const key = pool.sport === "swimming" ? (pool.kind === "warm-up" ? "warmUp" : "competition") : pool.sport === "diving" ? "diving" : pool.sport === "waterpolo" ? "waterPolo" : "artistic";
      return pool.name ?? w.names[key];
    });
    return { about: fill(w.venue, { n: venue.pools.length, list: listOf(names, language) }).replace(/[.。]$/, ""), after: [] };
  }
  const plan = planOf(o);
  switch (plan.sport) {
    case "swimming": {
      const lanes = plan.lanes.length === 1 ? w.laneOne : fill(w.lanes, { n: plan.lanes.length });
      const about = fill(plan.kind === "warm-up" ? w.aboutWarmUp : w.aboutSwimming, { size: sizeText(language, plan.length, plan.width), lanes });
      const after = raceSentences(plan, language);
      if (plan.section !== undefined) after.push(fill(w.section, { depth: trimmed(plan.depth) }));
      return { about, after };
    }
    case "waterpolo":
      return { about: fill(w.aboutWaterPolo, { size: sizeText(language, WATER_POLO.length, WATER_POLO.width) }), after: [] };
    case "diving": {
      const heights = plan.boards.filter((b) => b.kind === "platform").map((b) => b.height).sort((a, b) => a - b);
      const hasBoards = plan.boards.some((b) => b.kind === "springboard");
      const list = listOf(heights.map(String), language);
      const boards = [hasBoards ? w.boards : "", heights.length > 0 ? fill(w.platforms, { list }) : ""].filter((part) => part !== "").join(w.and);
      return { about: fill(w.aboutDiving, { size: sizeText(language, plan.length, plan.width), boards: boards === "" ? "" : boards }).replace(/,\s*with\s*$/, "").replace(/で、があります$/, "です"), after: [] };
    }
    default: {
      const deep = plan.deep === undefined ? "" : fill(w.deep, { size: sizeText(language, plan.deep.length, plan.deep.width) });
      return { about: `${fill(w.aboutArtistic, { size: sizeText(language, plan.length, plan.width) })}${deep}`, after: [] };
    }
  }
}

export { STATUS_TEXT };
