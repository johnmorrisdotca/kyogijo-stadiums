// The dimensions of every surface, in feet, with the few functions that follow from them.
export { BADMINTON, BEACH_VOLLEYBALL, CURLING, PICKLEBALL, STONE_DIAMETER, TABLE_TENNIS, TENNIS, VOLLEYBALL, DEFAULT_FENCE, FEET_PER_METRE, FEET_PER_YARD, FENCE_ANGLES, FOOTBALL, GOALPOST_WIDTH, HASH_LENGTH, MLB, NBA, NHL, fenceAt, fencePoints, dimensionsOf, fenceIn, footballLength, inch, surfaceSize, secondBase, skinJoin, threePointJoin } from "./geometry.ts";
export type { FencePoint, FootballSpec, SizedSport } from "./geometry.ts";
export { boardsY } from "./surfaces/hockey.ts";
export { FEET_PER, SURFACE_UNITS, UNITS, convertLength, convertPoint, isUnit, lengthsIn } from "./units.ts";
export type { Point, Scaled, Unit } from "./units.ts";
export { METRES_PER_FOOT, METRES_PER_YARD, SOCCER, SOCCER_PITCHES, SOCCER_PITCH_IDS, fullPitch, goalAreaWidth, penaltyAreaWidth, soccerPitchClass, soccerSpec } from "./surfaces/soccer-spec.ts";
export type { SoccerArea, SoccerFormat, SoccerPitchClass, SoccerPitchId, SoccerSize, SoccerSpec } from "./surfaces/soccer-spec.ts";
