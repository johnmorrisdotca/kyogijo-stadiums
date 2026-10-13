import type { Layer } from "../src/layers.types.ts";

export function seeded(seed: number): () => number;
export function shotMap(count?: number, seed?: number): Layer[];
export function passMap(count?: number, seed?: number): Layer[];
export function sprayChart(count?: number, seed?: number): Layer[];
export function shotHeat(count?: number, seed?: number): Layer[];
export function nbaZones(count?: number, seed?: number): Layer[];
export function touchZones(count?: number, seed?: number): Layer[];
export function sprayDensity(count?: number, seed?: number): Layer[];
