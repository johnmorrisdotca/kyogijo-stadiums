// The named features of each surface, so that a caller can list them and give each a colour of its own (`featureColors`). A feature is the part
// of a drawing that carries one class, `ky-f-<name>`, which the surface puts on its elements only for a feature that was given a colour; the
// colour is the custom property `--ky-f-<name>` on the drawing, and a rule hands it to the property the part is painted with. Written for this
// package. sportypy's `update_colors` (a colour per named feature) was the idea; none of its code or names is used.
import { safeColour } from "./colour.ts";
import type { Sport } from "./types.ts";

/** A part of a surface that can be coloured on its own. */
export interface Feature {
  /** What a caller names it by: `blue-lines`. */
  name: string;
  /**
   * What its colour is given to: the custom properties the part is painted with (`--ky-red`), or a CSS property (`stroke`) for a part the stylesheet paints in a
   * colour that is not a property.
   */
  props: readonly string[];
  /** What it is, for the docs. */
  about: string;
}

const f = (name: string, props: string | readonly string[], about: string): Feature => ({ name, props: typeof props === "string" ? [props] : props, about });

const LINE = "--ky-line";
const FOOTBALL: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the field."),
  f("turf", "--ky-surface", "The grass."),
  f("mowing", "--ky-surface-alt", "The lighter tone of the mown pattern."),
  f("end-zone-left", "--ky-left", "The left end zone."),
  f("end-zone-right", "--ky-right", "The right end zone."),
  f("boundary", LINE, "The sidelines and the end lines."),
  f("yard-lines", LINE, "The lines across the field every five yards."),
  f("goal-lines", LINE, "The two goal lines."),
  f("hash-marks", LINE, "The hash marks and the sideline ticks."),
  f("numbers", LINE, "The yard numbers and their arrows."),
  f("posts", "--ky-post", "The goal posts."),
  f("pylons", "--ky-pylon", "The pylons at the corners."),
];

const HOCKEY: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the rink."),
  f("boards", "--ky-boards", "The boards."),
  f("ice", "--ky-surface", "The ice."),
  f("centre-line", "--ky-red", "The red centre line."),
  f("centre-dashes", "--ky-surface", "The dashes in the centre line."),
  f("blue-lines", "--ky-blue", "The two blue lines."),
  f("goal-lines", "--ky-red", "The two goal lines."),
  f("centre-circle", "--ky-blue", "The centre face-off circle."),
  f("centre-dot", "--ky-blue", "The centre face-off dot."),
  f("face-off-circles", "--ky-red", "The four end-zone face-off circles."),
  f("face-off-dots", "--ky-red", "The end-zone and neutral-zone face-off dots."),
  f("hash-marks", "--ky-red", "The hash marks beside the end-zone circles."),
  f("crease", "--ky-crease", "The fill of the goalkeeper's crease."),
  f("crease-marks", "--ky-red", "The short marks on the crease's edge."),
  f("trapezoid", "--ky-red", "The goalkeeper's trapezoid behind the goal."),
  f("nets", "--ky-red", "The nets."),
  f("referee-crease", "--ky-red", "The referee's crease at the boards."),
];

const ATHLETICS: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the stadium."),
  f("track", "--ky-track", "The synthetic surface of the track, the straights and the segments."),
  f("infield", "--ky-surface", "The turf inside the track."),
  f("mowing", "--ky-surface-alt", "The lighter tone of the mown turf."),
  f("kerb", LINE, "The kerb on the inside edge of the track."),
  f("lane-lines", LINE, "The lines between the lanes and the track's outer edge."),
  f("lane-numbers", LINE, "The lane numbers painted before the finish and the starts."),
  f("finish-line", LINE, "The finish line and the short lines 1 m before it."),
  f("start-lines", LINE, "The start lines: straight, staggered and curved."),
  f("breakline", "--ky-ath-g", "The breakline of the 800 m and the 4 x 400 m."),
  f("relay-zones", ["--ky-ath-y", "--ky-ath-b", LINE], "The takeover zones' marks and the scratch lines."),
  f("hurdle-marks", ["--ky-ath-y", "--ky-ath-b", "--ky-ath-g"], "The marks of the hurdles on the track."),
  f("steeplechase-hurdles", "--ky-ath-k", "The steeplechase's hurdles."),
  f("water-jump", ["--ky-water", LINE, "--ky-ath-k"], "The water jump: its pit, its border and its hurdle."),
  f("high-jump", ["--ky-mat", LINE, "--ky-ath-k"], "The high jump: the mat, the crossbar and the lines."),
  f("pole-vault", ["--ky-mat", "--ky-pad", LINE], "The pole vault: the mats, the boxes and the runways."),
  f("long-jump", ["--ky-sand", LINE], "The long jump's pits, boards and runways."),
  f("triple-jump", ["--ky-sand", LINE], "The triple jump's pits, boards and runways."),
  f("shot-put", ["--ky-concrete", LINE], "The shot put's circles, stop boards and sectors."),
  f("discus-throw", ["--ky-concrete", LINE], "The discus throw's circle and sector."),
  f("hammer-throw", ["--ky-concrete", LINE], "The hammer throw's circle and sector."),
  f("javelin-throw", LINE, "The javelin's runway, arc and sector."),
  f("cage", "--ky-ath-k", "The discus and hammer cage."),
  f("banking", "--ky-ath-k", "The shade of the covered track's banked bends."),
];

const SKATING: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the rink."),
  f("ice", "--ky-surface", "The ice."),
  f("infield", "--ky-surface-alt", "The floor or the ice inside the track."),
  f("warm-up", "--ky-surface-alt", "The warm-up lane of the long track."),
  f("padding", "--ky-boards", "The padding round the track."),
  f("boards", "--ky-boards", "The boards of a figure skating rink."),
  f("lane-lines", "--ky-blue", "The lines that demarcate the lanes of the long track."),
  f("track-line", ["--ky-blue", "--ky-ink"], "The line of the short track and the line between its blocks."),
  f("blocks", "--ky-ink", "The blocks of a curve."),
  f("cones", "--ky-red", "The cones at the entrance of a curve."),
  f("finish-line", "--ky-red", "The finishing line."),
  f("finish-marks", "--ky-blue", "The lines 1 m apart in the last 5 m before the finishing line."),
  f("start-lines", "--ky-red", "The starting lines of the races marked."),
  f("pre-start-lines", "--ky-blue", "The pre-start line 2 m before each starting line."),
  f("start-positions", "--ky-ink", "The starting positions of the short track's 500 m and 1000 m."),
  f("coaches-area", "--ky-red", "The coaches' area on the crossing straight."),
  f("judges", "--ky-ink", "The judges' seats at the rinkboard."),
  f("referee", "--ky-ink", "The referee's seat."),
  f("technical-panel", "--ky-ink", "The technical panel's table."),
  f("kiss-and-cry", "--ky-red", "The kiss and cry."),
];

const JUDO: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the competition area."),
  f("free-zone", "--ky-free", "The free zone of 50 cm kept round the competition area."),
  f("platform", "--ky-bud-floor", "The platform under the tatami, when there is one."),
  f("floor", "--ky-bud-floor", "The arena floor under the surface, when there is one (the Budokan's)."),
  f("contest-area", "--ky-surface", "The tatami of the contest area."),
  f("safety-area", "--ky-surface-alt", "The tatami of the safety area."),
  f("danger-zone", "--ky-red", "The red tatami of the danger zone inside a contest area (the AJJF's)."),
  f("seams", "--ky-ink", "The seams between the mats."),
  f("start-right", ["--ky-blue", "--ky-red"], "The tape where the contestant to the referee's right starts: blue, or red in the AJJF's."),
  f("start-left", "--ky-line", "The tape where the contestant to the referee's left starts."),
  f("officials", "--ky-ink", "The technical table."),
];

const KARATE: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the mats."),
  f("floor", "--ky-bud-floor", "The arena floor under the surface, when there is one (the Budokan's)."),
  f("safety-area", "--ky-surface-alt", "The mats of the safety area."),
  f("boundary-band", "--ky-red", "The outer metre of a kumite area, in another colour."),
  f("competition-area", "--ky-surface", "The mats inside the boundary band."),
  f("start-mats", "--ky-red", "The two mats turned over at the start."),
  f("seams", "--ky-ink", "The seams between the mats."),
  f("judges", "--ky-ink", "The judges' seats."),
  f("referee", "--ky-ink", "The referee's place."),
  f("officials", "--ky-ink", "The officials' table."),
];

const KENDO: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the shiai-jo."),
  f("outside", "--ky-free", "The 1.5 m kept clear outside the boundary lines."),
  f("floor", "--ky-bud-floor", "The wooden floor."),
  f("boards", "--ky-ink", "The seams between the floorboards."),
  f("boundary-lines", "--ky-line", "The boundary lines."),
  f("cross", "--ky-line", "The cross at the centre."),
  f("start-lines", "--ky-line", "The two kaishi-sen."),
  f("outer-boundary", "--ky-ink", "The outer boundary, 1.5 m outside."),
];

const SUMO: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the dohyō."),
  f("clay", "--ky-dirt", "The clay of the platform and of the ring."),
  f("jano-me", "--ky-sand", "The sand outside the tawara."),
  f("tawara", "--ky-bud-straw", "The tawara of the ring."),
  f("shikiri-sen", "--ky-line", "The two shikiri-sen."),
];

const MMA: readonly Feature[] = [
  f("apron", "--ky-apron", "The floor of the hall round the platform."),
  f("platform", "--ky-bud-floor", "The platform the cage stands on."),
  f("steps", "--ky-bud-floor", "The steps up to the platform."),
  f("canvas", "--ky-surface", "The canvas inside the fence."),
  f("fence", "--ky-ink", "The fence, one line on each flat."),
  f("gates", "--ky-ink", "The swing of the two gates."),
  f("posts", "--ky-ink", "The eight padded posts."),
];

const BOXING: readonly Feature[] = [
  f("apron", "--ky-apron", "The floor of the hall round the platform."),
  f("canvas", "--ky-surface", "The canvas of the platform, ring and apron."),
  f("ropes", "--ky-bud-rope", "The ropes, and their extensions to the posts."),
  f("steps", "--ky-bud-floor", "The steps up to the platform."),
  f("corners", "--ky-ink", "The four corner posts with their pads."),
];

const WRESTLING: readonly Feature[] = [
  f("apron", "--ky-apron", "The floor of the hall round the mat."),
  f("platform", "--ky-bud-floor", "The platform the mat stands on."),
  f("border", "--ky-surface-alt", "The matted area round the circle (the UWW's protection area)."),
  f("circle", "--ky-surface", "The wrestling area, inside the circle."),
  f("passivity", "--ky-red", "The orange passivity band of the UWW's mat."),
  f("rim", "--ky-line", "The line that outlines a folkstyle circle."),
  f("centre-circle", "--ky-line", "The circle in the middle of the mat."),
  f("starting-lines", "--ky-line", "The two starting lines of a folkstyle mat with their green and red ends."),
];

const PROWRESTLING: readonly Feature[] = [
  f("apron", "--ky-apron", "The floor of the hall round the platform."),
  f("canvas", "--ky-surface", "The canvas of the platform, ring and apron."),
  f("ropes", "--ky-bud-rope", "The three ropes, and their extensions to the posts."),
  f("steps", "--ky-bud-floor", "The steps beside the platform."),
  f("corners", "--ky-ink", "The four corner posts with their pads."),
];

const KYUDO: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the range."),
  f("shajo", "--ky-bud-floor", "The floor of the shajō."),
  f("yamichi", "--ky-surface", "The yamichi."),
  f("yatori-michi", "--ky-surface-alt", "The path for fetching the arrows."),
  f("azuchi", "--ky-dirt", "The azuchi, the mound."),
  f("shooting-positions", "--ky-line", "The shooting positions and their line."),
  f("honza", "--ky-line", "The honza and their line."),
  f("targets", "--ky-line", "The targets."),
  f("roofs", "--ky-ink", "The outlines of the roofs of the shajō and the matoba."),
];

const DOJO: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the dojo."),
  f("mats", "--ky-surface", "The mats, or the first tone of a checker or a competition floor."),
  f("mats-alt", "--ky-surface-alt", "The second tone of a checker or a competition floor."),
  f("border", "--ky-red", "The border of another colour of a border floor."),
  f("seams", "--ky-ink", "The seams between the mats."),
  f("heri", "--ky-ink", "The heri, the cloth along the long sides of a traditional mat."),
  f("walls", "--ky-boards", "The walls."),
  f("doors", "--ky-apron", "The doors."),
  f("windows", "--ky-blue", "The windows."),
  f("shrine", "--ky-red", "The shinzen, the shrine."),
  f("dais", "--ky-bud-floor", "The raised platform of the seat of honour."),
  f("banner", "--ky-ink", "The banner on the kamiza wall."),
];

const KEY = ["--ky-key", "--ky-key-left", "--ky-key-right"];
const BASKETBALL: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the court."),
  f("border", "--ky-boards", "The out-of-bounds border."),
  f("floor", "--ky-surface", "The wood."),
  f("planks", "--ky-surface-alt", "The second tone of the planks."),
  f("key", KEY, "The paint of both keys."),
  f("three-point-area", KEY, "The three-point areas, when they are painted."),
  f("centre-paint", "--ky-centre", "The paint inside the centre circle."),
  f("boundary", LINE, "The sidelines and the baselines."),
  f("halfway-line", LINE, "The halfway line."),
  f("centre-circle", LINE, "The centre circle."),
  f("lane-lines", LINE, "The edges of the keys."),
  f("free-throw-circles", LINE, "The free-throw circles."),
  f("three-point-line", LINE, "The three-point lines."),
  f("restricted-areas", LINE, "The restricted areas under the baskets."),
  f("court-marks", LINE, "The marks along the keys, the sidelines and the lower defensive boxes."),
  f("backboards", LINE, "The backboards and their arms."),
  f("rims", "stroke", "The rims."),
  f("baseline-text", "--ky-baseline", "The words along the baselines."),
];

const BASEBALL: readonly Feature[] = [
  f("foul-ground", "--ky-foul", "The ground outside the foul lines."),
  f("outfield", "--ky-surface", "The grass of fair ground."),
  f("mowing", "--ky-surface-alt", "The lighter tone of the mown pattern."),
  f("warning-track", "--ky-dirt", "The warning track."),
  f("infield-dirt", "--ky-dirt", "The dirt of the infield, the mound and the circles about the bases."),
  f("infield-grass", "--ky-infield", "The grass inside the bases."),
  f("foul-lines", LINE, "The two foul lines."),
  f("batters-boxes", LINE, "The batter's boxes."),
  f("running-lane", LINE, "The running lane to first base."),
  f("home-plate", LINE, "Home plate."),
  f("pitchers-plate", LINE, "The pitcher's plate or box."),
  f("bases", LINE, "The bases."),
  f("fence", "--ky-boards", "The outfield fence."),
];

const SOCCER: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the pitch."),
  f("turf", "--ky-surface", "The grass."),
  f("mowing", "--ky-surface-alt", "The lighter tone of the mown pattern."),
  f("touchlines", LINE, "The touchlines and the goal lines."),
  f("halfway-line", LINE, "The halfway line."),
  f("centre-circle", LINE, "The centre circle."),
  f("centre-mark", LINE, "The centre mark."),
  f("penalty-areas", LINE, "The penalty areas, the goal areas and the penalty arcs."),
  f("penalty-marks", LINE, "The penalty marks."),
  f("corner-arcs", LINE, "The corner arcs."),
  f("corner-marks", LINE, "The corner-kick marks off the pitch."),
  f("goals", LINE, "The goals: the posts' line, the net and the strip."),
  f("goal-posts", "--ky-post", "The ends of the goalposts."),
  f("corner-flags", ["--ky-pylon", "--ky-post"], "The corner flags."),
];

const CURLING: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the sheet."),
  f("boards", "--ky-boards", "The boards."),
  f("ice", "--ky-surface", "The ice."),
  f("pebble", "--ky-pebble", "The pebble, when it is drawn."),
  f("guard-zone", "--ky-fgz", "The free guard zone, when it is shaded."),
  f("house-outer", "--ky-rg-o", "The band of the house between the 12-foot and the 8-foot circles."),
  f("house-middle", "--ky-rg-m", "The band between the 8-foot and the 4-foot circles."),
  f("house-inner", "--ky-rg-i", "The band between the 4-foot circle and the button."),
  f("button", "--ky-rg-b", "The button."),
  f("tee-lines", LINE, "The tee lines."),
  f("back-lines", LINE, "The back lines."),
  f("centre-line", LINE, "The centre line."),
  f("courtesy-lines", LINE, "The hack lines and the courtesy lines."),
  f("hog-lines", "--ky-hog", "The hog lines."),
  f("hacks", "--ky-hack", "The hacks."),
];

const ROPES = ["--ky-pg", "--ky-pb", "--ky-py"] as const;

const SWIMMING: readonly Feature[] = [
  f("apron", "--ky-apron", "The deck round the pool."),
  f("gutter", "--ky-boards", "The gutter and the coping round the water."),
  f("water", "--ky-surface", "The water."),
  f("lane-lines", LINE, "The lane markings on the floor with their cross lines, the cross lines at 15 m, the marks on the deck and the target lines."),
  f("touch-pads", "--ky-pd", "The touch panels on the end walls."),
  f("starting-blocks", "--ky-pk", "The starting blocks."),
  f("lane-ropes", ROPES, "The lane ropes' green, blue and yellow floats; the red floats near the walls are `rope-red` and the distinct marks `rope-white`."),
  f("rope-green", "--ky-pg", "The green ropes of the outside lanes."),
  f("rope-blue", "--ky-pb", "The blue ropes."),
  f("rope-yellow", "--ky-py", "The yellow ropes of the middle lanes."),
  f("rope-red", "--ky-pr", "The red floats within 5 m of each wall."),
  f("rope-white", "--ky-pw", "The floats of a distinct colour at 15 m and 25 m."),
  f("backstroke-flags", ["--ky-fa"], "The backstroke flags' rope 5 m from each wall."),
  f("false-start-rope", "--ky-pf", "The false start rope 15 m from the starting end."),
  f("pace-bars", "--ky-pe", "The outline of the split pace bars."),
];

const WATER_POLO: readonly Feature[] = [
  f("apron", "--ky-apron", "The deck round the pool."),
  f("gutter", "--ky-boards", "The gutter round the water."),
  f("water", "--ky-surface", "The water."),
  f("goal-lines", "--ky-pw", "The two goal lines."),
  f("half-distance-line", "--ky-pw", "The half distance line."),
  f("two-metre-lines", "--ky-pr", "The 2 m lines."),
  f("five-metre-marks", "--ky-pr", "The 5 m marks, where a penalty throw is taken from."),
  f("six-metre-lines", "--ky-py", "The 6 m lines."),
  f("goal-area-lines", "--ky-pr", "The lines 2 m long from the goal posts that make the goal areas."),
  f("re-entry-areas", "--ky-pr", "The excluded players' re-entry areas."),
  f("referee-platforms", ["--ky-pr", "--ky-py", "--ky-pg"], "The referees' platforms along both sides, coloured as the ropes are."),
  f("lane-ropes", ROPES, "The ropes along the sides: their green floats, their yellow floats; the red ones are `rope-red`, the white ones `rope-white`."),
  f("rope-green", "--ky-pg", "The green floats from 6 m to the half distance line."),
  f("rope-yellow", "--ky-py", "The yellow floats from 2 to 6 m."),
  f("rope-red", "--ky-pr", "The red floats from the goal line to 2 m and the 5 m mark."),
  f("rope-white", "--ky-pw", "The white floats at the goal lines and the half distance line."),
  f("goals", "--ky-pw", "The goals: the crossbar and the net."),
  f("goal-posts", "--ky-pw", "The goal posts."),
  f("official-table", "--ky-pk", "The official table."),
  f("substitution-areas", ["--ky-left", "--ky-right"], "The areas for flying substitutions, in each team's colour."),
];

const DIVING: readonly Feature[] = [
  f("apron", "--ky-apron", "The deck round the well."),
  f("gutter", "--ky-boards", "The gutter round the well."),
  f("water", "--ky-surface", "The water."),
  f("lane-lines", LINE, "The three lines across the well."),
  f("stands", "--ky-boards", "The stands the boards are fixed to."),
  f("platforms", "--ky-pc", "The platforms."),
  f("springboards", "--ky-pbd", "The springboards."),
];

const ARTISTIC_SWIMMING: readonly Feature[] = [
  f("apron", "--ky-apron", "The deck round the pool."),
  f("gutter", "--ky-boards", "The gutter round the water."),
  f("water", "--ky-surface", "The water."),
  f("floor-lines", LINE, "The lines on the floor along the pool."),
  f("judges-platform", "--ky-pk", "The judges' platform."),
  f("starting-platform", "--ky-pk", "The starting platform."),
];

const NET: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the court."),
  f("free-zone", "--ky-free", "The free zone round the court, where the rules give one."),
  f("court", "--ky-surface", "The court."),
  f("areas", "--ky-area", "The painted areas: the non-volley zones and the volleyball front zones."),
  f("lines", LINE, "The painted lines."),
  f("net", "--ky-net", "The net."),
  f("posts", "--ky-net", "The posts and the singles sticks."),
  f("antennae", "--ky-red", "The antennae of a volleyball net."),
];

const APRON_COURT: readonly Feature[] = [f("apron", "--ky-apron", "The ground round the court."), f("court", "--ky-surface", "The court."), f("lines", LINE, "The painted lines.")];
/** A padel court: the net's features, and the walls and the metal fence of its enclosure. */
const PADEL: readonly Feature[] = [...NET, f("walls", "--ky-wall", "The walls of the enclosure."), f("fence", "--ky-mesh", "The metal fence between the walls.")];
/** A table tennis area: the net's features, the surrounds round the playing area, the umpires' table and their chairs. */
const TABLE_TENNIS: readonly Feature[] = [...NET, f("walls", "--ky-wall", "The surrounds that enclose the playing area."), f("umpires-table", "--ky-table", "The umpires' table."), f("chairs", "--ky-chair", "The umpire's chair and the assistant umpire's.")];
/** A squash court: no net, walls round it, and its front wall laid flat beside it, with its tin. */
const SQUASH: readonly Feature[] = [...APRON_COURT, f("walls", "--ky-wall", "The walls round the court."), f("wall-face", "--ky-face", "The front wall, laid flat beside the court."), f("tin", "--ky-tin", "The tin, on the front wall."), f("wall-lines", "--ky-wall-line", "The lines on the front wall.")];
/** A racquetball court: no net, and walls round it. */
const RACQUETBALL: readonly Feature[] = [...APRON_COURT, f("walls", "--ky-wall", "The walls round the court.")];
/** A teqball court: the net, the table, and the court surrounds. */
const TEQBALL: readonly Feature[] = [...APRON_COURT, f("net", "--ky-net", "The net."), f("table", "--ky-table", "The teqball table."), f("walls", "--ky-wall", "The court surrounds.")];
/** A roundnet court: the ground, the lines (the circles and the service marks), and the set. */
const ROUNDNET: readonly Feature[] = [...APRON_COURT, f("net", "--ky-net", "The set: its rim.")];
/** A netball court: the ground and free zone, the lines and circles, and the goalposts. */
const NETBALL: readonly Feature[] = [f("apron", "--ky-apron", "The ground round the court."), f("free-zone", "--ky-free", "The court surround."), f("court", "--ky-surface", "The court."), f("lines", LINE, "The painted lines and circles."), f("posts", "--ky-net", "The goalposts.")];


const TURF: readonly Feature[] = [f("apron", "--ky-apron", "The ground round the surface."), f("turf", "--ky-surface", "The grass."), f("mowing", "--ky-surface-alt", "The lighter tone of the mown pattern.")];
const POST = "--ky-post";

const RUGBY: readonly Feature[] = [
  ...TURF,
  f("in-goal-left", "--ky-left", "The left in-goal area, in a score."),
  f("in-goal-right", "--ky-right", "The right in-goal area, in a score."),
  f("boundary", LINE, "The touchlines, the touch-in-goal lines and the dead-ball lines."),
  f("try-lines", LINE, "The try lines (the goal lines in league)."),
  f("halfway-line", LINE, "The half-way line, and the mark across it."),
  f("twenty-two-lines", LINE, "The 22-metre lines (union)."),
  f("dash-lines", LINE, "The dashes of the lines 5 and 15 m from the touchlines, 5 m from the try lines and 10 m from the half-way line (union)."),
  f("ten-metre-lines", LINE, "The lines across the field every 10 m (league)."),
  f("red-lines", "--ky-red", "The 20 m and 40 m lines, where the league marks them red (the NRL)."),
  f("scrum-lines", LINE, "The scrum lines in from the touchlines (the NRL)."),
  f("posts", POST, "The goal posts."),
  f("flags", POST, "The flag posts and the corner posts."),
];

const LACROSSE: readonly Feature[] = [
  ...TURF,
  f("boards", "--ky-boards", "The boards round a box floor."),
  f("boundary", LINE, "The sidelines and the end lines."),
  f("centre-line", LINE, "The centre line and the mark at the centre."),
  f("goal-lines", LINE, "The goal lines between the posts."),
  f("goals", LINE, "The goal nets."),
  f("goal-posts", POST, "The goal posts."),
  f("crease", LINE, "The crease, the goal mouth and the goal circle."),
  f("restraining-lines", LINE, "The restraining lines and the attack-area lines."),
  f("wing-lines", LINE, "The wing lines."),
  f("arcs", LINE, "The marking areas, the arc and fan, the two-point arc."),
  f("centre-circle", LINE, "The centre circle (the women's game)."),
  f("face-off-circles", LINE, "The face-off circles of a box floor."),
  f("face-off-spots", LINE, "The corner face-off spots of a box floor."),
];

const AFL: readonly Feature[] = [
  ...TURF,
  f("boundary", LINE, "The Boundary Line."),
  f("goal-lines", LINE, "The goal lines and the behind lines."),
  f("goal-squares", LINE, "The goal squares."),
  f("arcs", LINE, "The Fifty Metre Arcs."),
  f("centre-square", LINE, "The centre square."),
  f("centre-circle", LINE, "The Centre Circle and the Ten Metre Circle."),
  f("posts", POST, "The goal posts and the behind posts."),
];

const GAELIC: readonly Feature[] = [
  ...TURF,
  f("boundary", LINE, "The sidelines and the end lines."),
  f("distance-lines", LINE, "The lines across at 13, 20, 45 and (hurling) 65 m."),
  f("midline", LINE, "The half-way line: the midline and its dashes."),
  f("rectangles", LINE, "The small and the large rectangle at each end."),
  f("arcs", LINE, "The 13 m arcs and, in football, the 40 m arcs."),
  f("penalty-points", LINE, "The penalty point (football)."),
  f("posts", POST, "The goalposts."),
  f("flags", POST, "The flags on the lines."),
];

const CRICKET: readonly Feature[] = [
  ...TURF,
  f("boundary", LINE, "The boundary rope."),
  f("circle", LINE, "The fielding restriction's circle (the 30-yard circle)."),
  f("pitch", "--ky-dirt", "The pitch."),
  f("creases", LINE, "The bowling, popping and return creases."),
  f("wickets", LINE, "The wickets."),
];

const FIELD_HOCKEY: readonly Feature[] = [
  ...TURF,
  f("boundary", LINE, "The side-lines and the back-lines."),
  f("centre-line", LINE, "The centre line."),
  f("twenty-three-lines", LINE, "The 23-metre lines."),
  f("circle-lines", LINE, "The circles."),
  f("broken-circle-lines", LINE, "The broken lines outside the circles."),
  f("penalty-spots", LINE, "The penalty spots."),
  f("outside-marks", LINE, "The marks outside the pitch."),
  f("flags", POST, "The flag-posts."),
  f("goals", LINE, "The goals."),
];

const HANDBALL: readonly Feature[] = [
  f("apron", "--ky-apron", "The ground round the court."),
  f("floor", "--ky-surface", "The floor."),
  f("goal-areas", "--ky-key", "The goal areas' paint."),
  f("boundary", LINE, "The side lines and the outer goal lines."),
  f("centre-line", LINE, "The centre line."),
  f("centre-circle", LINE, "The throw-off area."),
  f("goal-area-line", LINE, "The goal-area lines (6 m)."),
  f("free-throw-line", LINE, "The free-throw lines (9 m)."),
  f("seven-metre-line", LINE, "The 7-metre lines."),
  f("four-metre-line", LINE, "The 4-metre lines."),
  f("goal-lines", LINE, "The goal lines between the posts."),
  f("substitution-lines", LINE, "The marks that end the substitution lines."),
  f("goal-posts", POST, "The goal posts."),
  f("goals", LINE, "The goal nets."),
];

/** The features of each sport, with what each colours. A sport whose surface has none named (one added since) is missing here. */
export const FEATURE_INFO: Readonly<Record<string, readonly Feature[]>> = Object.freeze({
  nfl: FOOTBALL,
  cfl: FOOTBALL,
  ifaf: FOOTBALL,
  nhl: HOCKEY,
  nba: BASKETBALL,
  mlb: BASEBALL,
  soccer: SOCCER,
  curling: CURLING,
  swimming: SWIMMING,
  waterpolo: WATER_POLO,
  diving: DIVING,
  artisticswimming: ARTISTIC_SWIMMING,
  tennis: NET,
  volleyball: NET,
  badminton: NET,
  pickleball: NET,
  tabletennis: TABLE_TENNIS,
  padel: PADEL,
  squash: SQUASH,
  racquetball: RACQUETBALL,
  sepaktakraw: NET,
  teqball: TEQBALL,
  roundnet: ROUNDNET,
  netball: NETBALL,
  lacrosse: LACROSSE,
  rugby: RUGBY,
  afl: AFL,
  gaelic: GAELIC,
  cricket: CRICKET,
  fieldhockey: FIELD_HOCKEY,
  handball: HANDBALL,
  athletics: ATHLETICS,
  skating: SKATING,
  judo: JUDO,
  karate: KARATE,
  kendo: KENDO,
  sumo: SUMO,
  kyudo: KYUDO,
  dojo: DOJO,
  mma: MMA,
  boxing: BOXING,
  wrestling: WRESTLING,
  prowrestling: PROWRESTLING,
});

/**
 * The names of the features of each sport: the keys `featureColors` takes. Football's three fields have the same, and so have the five net sports.
 * @example
 * ```ts
 * import { FEATURES } from "@johnmorrisdotca/kyogijo-stadiums";
 * console.log(FEATURES.nhl.includes("blue-lines"), FEATURES.nfl.length);
 * // true 12
 * ```
 */
export const FEATURES: Readonly<Record<string, readonly string[]>> = Object.freeze(Object.fromEntries(Object.entries(FEATURE_INFO).map(([sport, list]) => [sport, Object.freeze(list.map((one) => one.name))])));

const has = (table: object, key: string): boolean => Object.prototype.hasOwnProperty.call(table, key);

/** The features a drawing was asked to colour, as `[name, colour]`: a colour that is not safe is left out, and a name the sport does not have is an error that lists the names. */
export function featureColours(sport: Sport | string, given: Readonly<Record<string, string>> | undefined): [string, string][] {
  if (given === undefined || given === null || typeof given !== "object") return [];
  const known = has(FEATURES, sport) ? FEATURES[sport] : [];
  const out: [string, string][] = [];
  for (const [name, value] of Object.entries(given)) {
    if (!known.includes(name)) throw new RangeError(`Unknown feature "${name}" for ${sport}: ${known.length === 0 ? "this surface has none named" : `use one of ${known.join(", ")}`}`);
    const colour = safeColour(value);
    if (colour !== undefined) out.push([name, colour]);
  }
  return out;
}

/** The rule that hands a feature's colour to the properties its part is painted with. */
const rule = (selector: string, name: string, props: readonly string[]): string => `${selector}{${props.map((prop) => `${prop}:var(--ky-f-${name})`).join(";")}}`;

/** The rules for the features a drawing colours: its own stylesheet, for a drawing of one sport. */
export function featureStyle(sport: Sport | string, names: Iterable<string>): string {
  const list = has(FEATURE_INFO, sport) ? FEATURE_INFO[sport] : [];
  return [...names]
    .map((name) => list.find((one) => one.name === name))
    .filter((one): one is Feature => one !== undefined)
    .map((one) => rule(`.kyogijo .ky-f-${one.name}`, one.name, one.props))
    .join("\n");
}

/** Every feature of every sport as rules, for a page that draws with `style: "none"`: a rule is said once for the sports that share it. */
function allFeatureRules(): string {
  const groups = new Map<string, { sports: string[]; name: string; props: readonly string[] }>();
  for (const [sport, list] of Object.entries(FEATURE_INFO)) {
    for (const one of list) {
      const key = `${one.name}|${one.props.join(",")}`;
      const group = groups.get(key) ?? { sports: [], name: one.name, props: one.props };
      group.sports.push(sport);
      groups.set(key, group);
    }
  }
  return [...groups.values()].map((group) => rule(group.sports.map((sport) => `.kyogijo[data-sport=${sport}] .ky-f-${group.name}`).join(","), group.name, group.props)).join("\n");
}

/** The rules of every named feature: a colour in `--ky-f-<name>` on the drawing goes to the part. A drawing that colours a feature carries the rules it needs; a page that draws with `style: "none"` puts this in once. */
export const KYOGIJO_FEATURE_STYLE = allFeatureRules();
