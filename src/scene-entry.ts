// A drawing as plain data: the shapes it is painted with, in order, their colours worked out for light or dark; and the SVG that needs no stylesheet.
import "./full.ts";
// The real venues of the NHL's arenas, as this entry has always had them (the lean district reads the ones it shows).
import "./venues.all.ts";
export { sceneFromSvg, sceneOf } from "./scene.ts";
export { sceneToSvg } from "./scene.flat.ts";
export type { FlatOptions } from "./scene.flat.ts";
export { pathCommands } from "./scene.path.ts";
export { parseSvg, writeSvg } from "./scene.xml.ts";
export type { SvgNode } from "./scene.xml.ts";
export type { Matrix, Paint, PathCommand, Scene, SceneBase, SceneCircle, SceneClip, SceneEllipse, SceneGradient, SceneImage, SceneItem, SceneLine, SceneOptions, ScenePath, ScenePattern, ScenePoly, SceneRect, SceneShape, SceneSource, SceneStyle, SceneText } from "./scene.types.ts";
