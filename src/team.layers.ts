// The team layers as the drawing sees them: one function that draws a layer of any of the eight kinds, and one that lists its numbers as tables.
// Each kind is written in a file of its own (team.shape.ts, team.network.ts, team.formation.ts, team.motion.ts).
import type { Env, Made } from "./layers.env.ts";
import { drawFormation, formationTables } from "./team.formation.ts";
import { drawLineup, lineupTables } from "./team.lineup.ts";
import { drawFlow, drawSonar, flowTable, sonarTables } from "./team.motion.ts";
import { drawNetwork, networkTables } from "./team.network.ts";
import { delaunayTable, drawDelaunay, drawHull, drawVoronoi, hullTable, voronoiTable } from "./team.shape.ts";
import type { TeamTable } from "./team.common.ts";
import type { DelaunayLayer, FlowLayer, FormationLayer, HullLayer, LineupLayer, NetworkLayer, SonarLayer, VoronoiLayer } from "./team.types.ts";

export type { TeamTable } from "./team.common.ts";

/** The layers this file draws. */
export type TeamLayer = NetworkLayer | FormationLayer | LineupLayer | VoronoiLayer | DelaunayLayer | HullLayer | FlowLayer | SonarLayer;

/** The kinds of team layer. */
export const TEAM_KINDS: readonly string[] = Object.freeze(["network", "formation", "lineup", "voronoi", "delaunay", "hull", "flow", "sonar"]);

/** True for a layer of one of the team kinds. */
export const isTeamLayer = (layer: { kind: string }): layer is TeamLayer => TEAM_KINDS.includes(layer.kind);

/** Draw a team layer. */
export function drawTeam(layer: TeamLayer, env: Env): Made {
  switch (layer.kind) {
    case "network": return drawNetwork(layer, env);
    case "formation": return drawFormation(layer, env);
    case "lineup": return drawLineup(layer, env);
    case "voronoi": return drawVoronoi(layer, env);
    case "delaunay": return drawDelaunay(layer, env);
    case "hull": return drawHull(layer, env);
    case "flow": return drawFlow(layer, env);
    default: return drawSonar(layer, env);
  }
}

/** The numbers of a team layer, as tables. */
export function teamTables(layer: TeamLayer, env: Env): TeamTable[] {
  switch (layer.kind) {
    case "network": return networkTables(layer, env);
    case "formation": return formationTables(layer, env);
    case "lineup": return lineupTables(layer, env);
    case "voronoi": return voronoiTable(layer, env);
    case "delaunay": return delaunayTable(layer, env);
    case "hull": return hullTable(layer, env);
    case "flow": return flowTable(layer, env);
    default: return sonarTables(layer, env);
  }
}
