// Coordinate frames: where a data provider puts a point on a surface, and the functions that move points between a provider's frame, the surface and another provider's frame.
export { FRAMES, attackingIn, convert, convertPoints, flipEnds, frameByName, framesOf, fromSurface, piecewise, registerFrame, span, toSurface } from "./frames.ts";
export type { Attacking, ConvertOptions, Ends, Frame, FrameMap, FrameUnit, Landmark, Mapper, PlaceOptions, SurfaceSize } from "./frames.ts";
export { RETROSHEET_ZONES, zoneAt, zoneToPoint } from "./frames.providers.ts";
export { convertLength, convertPoint } from "./units.ts";
export type { Point, Unit } from "./units.ts";
// The soccer providers register themselves as frames when this entry loads.
import "./surfaces/soccer-providers.ts";
export { SOCCER_PROVIDER_IDS, SOCCER_PROVIDERS, rescale, soccerFrame, soccerLandmarks } from "./surfaces/soccer-providers.ts";
export type { Rescaler, SoccerFrame, SoccerProvider, SoccerProviderId } from "./surfaces/soccer-providers.ts";
