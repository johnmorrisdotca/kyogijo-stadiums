import type { Language, Team } from "../src/types.ts";

export const FLAGS: Record<"bands" | "columns" | "diamond" | "disc" | "diagonal" | "quarters" | "chevron", (...colours: string[]) => string>;
export const NATIONS: Record<string, { name: string; ja: string; abbr: string; color: string; flag: string }>;
export function nation(key: string, language?: Language, extra?: Partial<Team>): Team;
