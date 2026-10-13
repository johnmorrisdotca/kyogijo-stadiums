import type { ReplayTimeline } from "../src/replay.types.ts";

export function replayPlay(kind?: "soccer" | "hockey", options?: { seconds?: number; fps?: number; seed?: number }): ReplayTimeline;
export const REPLAY_SURFACES: { soccer: { sport: "soccer" }; hockey: { sport: "nhl" } };
