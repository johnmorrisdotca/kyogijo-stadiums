// The dimensions of every surface, in feet, with the few functions that follow from them.
export { DEFAULT_FENCE, FEET_PER_METRE, FEET_PER_YARD, FENCE_ANGLES, FOOTBALL, GOALPOST_WIDTH, HASH_LENGTH, MLB, NBA, NHL, fenceAt, fencePoints, dimensionsOf, fenceIn, footballLength, inch, surfaceSize, secondBase, skinJoin, threePointJoin } from "./geometry.ts";
export type { FencePoint, FootballSpec, SizedSport } from "./geometry.ts";
export { boardsY } from "./surfaces/hockey.ts";
export { FEET_PER, SURFACE_UNITS, UNITS, convertLength, convertPoint, isUnit, lengthsIn } from "./units.ts";
export type { Point, Scaled, Unit } from "./units.ts";
