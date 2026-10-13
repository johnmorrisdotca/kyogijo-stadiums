import type { Layer } from "../src/layers.types.ts";

export function seeded(seed: number): () => number;
export function shotMap(count?: number, seed?: number): Layer[];
export function passMap(count?: number, seed?: number): Layer[];
export function sprayChart(count?: number, seed?: number): Layer[];
