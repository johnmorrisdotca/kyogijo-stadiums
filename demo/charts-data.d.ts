import type { Ball, NbaShot, NflPass, NhlShot, SoccerShot } from "../src/charts.types.ts";

export function nbaShots(count?: number, seed?: number): NbaShot[];
export function nhlShots(count?: number, seed?: number): NhlShot[];
export function mlbBalls(fence?: (angle: number) => number, count?: number, seed?: number): Ball[];
export function nflPasses(los?: number, count?: number, seed?: number): NflPass[];
export function soccerShots(count?: number, seed?: number): SoccerShot[];
