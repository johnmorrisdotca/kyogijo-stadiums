import type { Language, Team } from "../src/types.ts";

export const NATIONS: Record<string, { name: string; ja: string; abbr: string; color: string; flag: string }>;
export const FLAG_CODES: string[];
export function nation(key: string, language?: Language, extra?: Partial<Team>): Team;
