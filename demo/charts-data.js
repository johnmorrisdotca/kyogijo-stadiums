// Made-up data for the demo's "Charts" section and for the tests and docs of the charts: no real game, player or team. Every function is a
// fixed seed, so the same call always gives the same marks. The shapes are those the charts take (`NbaShot`, `NhlShot`, `Ball`, `NflPass`,
// `SoccerShot`), in the numbers of the provider each chart reads: stats.nba.com, the NHL API, Statcast, NFL tracking data and StatsBomb.
import { seeded } from "./layers-data.js";

const round = (n, places = 1) => Math.round(n * 10 ** places) / 10 ** places;
const normal = (random) => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());

/** Shots for the NBA chart, in the numbers of stats.nba.com's shot chart (`LOC_X`, `LOC_Y` in tenths of a foot from the hoop), made or missed. */
export function nbaShots(count = 420, seed = 2630) {
  const random = seeded(seed);
  const shots = [];
  for (let i = 0; i < count; i += 1) {
    const roll = random();
    // Distance in feet from the hoop: at the rim, in the paint, in the mid-range, from three.
    const r = roll < 0.24 ? random() * 3.6 : roll < 0.4 ? 4 + random() * 6 : roll < 0.62 ? 10 + random() * 12 : 23.8 + random() * 3.6;
    const corner = r > 22 && random() < 0.22;
    const angle = corner ? (random() < 0.5 ? -1 : 1) * (Math.PI / 2 - 0.1 - random() * 0.12) : Math.max(-1.5, Math.min(1.5, normal(random) * (r < 4 ? 1.1 : 0.8)));
    const reach = corner ? 22 / Math.cos(Math.PI / 2 - Math.abs(angle)) : r;
    const across = Math.max(-24.5, Math.min(24.5, reach * Math.sin(angle)));
    const along = Math.max(-4, reach * Math.cos(angle));
    const chance = r < 4 ? 0.64 : r < 10 ? 0.44 : r < 22 ? 0.4 : corner ? 0.4 : 0.35;
    shots.push({ x: Math.round(across * 10), y: Math.round(along * 10), made: random() < chance });
  }
  return shots;
}

/** Shots for the NHL map, in the NHL API's feet from centre ice, at both ends, each with the chance it had and a team. */
export function nhlShots(count = 90, seed = 2631) {
  const random = seeded(seed);
  const shots = [];
  for (let i = 0; i < count; i += 1) {
    const home = i % 2 === 0;
    const goalX = home ? 89 : -89;
    const depth = Math.min(62, Math.abs(normal(random)) * 20 + 7);
    const x = goalX + (home ? -depth : depth);
    const y = Math.max(-40, Math.min(40, normal(random) * 13));
    const distance = Math.hypot(goalX - x, y);
    const angle = Math.atan2(Math.abs(y), Math.abs(goalX - x));
    const xg = Math.max(0.01, Math.min(0.55, 0.42 * Math.exp(-distance / 22) * (1 - angle / 2.3)));
    const roll = random();
    const outcome = roll < xg * 1.1 ? "goal" : roll < 0.52 ? "saved" : roll < 0.74 ? "missed" : "blocked";
    shots.push({ x: round(x), y: round(y), outcome, xg: round(xg, 2), team: home ? "home" : "away", title: `${home ? "Home" : "Away"} ${outcome}, ${Math.round(distance)} ft out` });
  }
  return shots;
}

/**
 * Balls in play for the spray chart, in Statcast's `hc_x` and `hc_y` (the pixels of the Gameday image, home plate at 125.42, 198.27, about 2.5
 * feet to a unit). `fence(angle)` is the distance to the fence at an angle from dead centre, in feet (left is negative), so that a home run comes
 * down beyond it and every other ball inside.
 */
export function mlbBalls(fence = () => 390, count = 150, seed = 2632) {
  const random = seeded(seed);
  const balls = [];
  for (let i = 0; i < count; i += 1) {
    const roll = random();
    const type = roll < 0.5 ? "field_out" : roll < 0.72 ? "single" : roll < 0.84 ? "double" : roll < 0.88 ? "triple" : "home_run";
    const angle = Math.max(-44, Math.min(44, normal(random) * 21));
    const wall = fence(angle);
    const depth = type === "home_run" ? wall + 2 + random() * 22 : type === "field_out" ? 80 + random() * Math.max(40, wall - 110) : type === "single" ? 70 + random() * 150 : type === "double" ? 190 + random() * Math.max(30, wall - 215) : Math.max(120, wall - 40 - random() * 40);
    const reach = type === "home_run" ? depth : Math.min(depth, wall - 4);
    const t = (angle * Math.PI) / 180;
    balls.push({ x: round(125.42 + (reach * Math.sin(t)) / 2.5, 2), y: round(198.27 - (reach * Math.cos(t)) / 2.5, 2), type, value: Math.round(70 + random() * 38) });
  }
  return balls;
}

/** Passes for the NFL chart, in the yards of NFL tracking data (x along the field with its end zones, y across it), the offence going right from a line of scrimmage. */
export function nflPasses(los = 62, count = 48, seed = 2633) {
  const random = seeded(seed);
  const passes = [];
  for (let i = 0; i < count; i += 1) {
    const air = Math.round(-3 + random() ** 1.5 * 38);
    const x = Math.min(119, los + air + (random() - 0.5) * 2);
    const y = Math.max(2, Math.min(51, 26.6 + normal(random) * 11));
    const complete = random() < Math.max(0.28, 0.82 - air * 0.016);
    const roll = random();
    const outcome = x > 108 && complete ? "touchdown" : complete ? "complete" : roll < 0.12 ? "interception" : "incomplete";
    passes.push({ x: round(x), y: round(y), fromX: round(los - 5 - random() * 2), fromY: round(26.6 + normal(random) * 3), outcome, airYards: air });
  }
  return passes;
}

/**
 * Shots for the soccer map, in StatsBomb's yards (x 0 to 120, y 0 to 80 down the picture, the team attacking right), each with the chance it had and, for
 * those on target or off it, where it crossed the goal line: `goalY` yards from the centre of the goal and `goalZ` yards up.
 */
export function soccerShots(count = 28, seed = 2634) {
  const random = seeded(seed);
  const shots = [];
  for (let i = 0; i < count; i += 1) {
    const depth = Math.min(42, 7 + Math.abs(normal(random)) * 14);
    const x = 120 - depth;
    const y = Math.max(8, Math.min(72, 40 + normal(random) * 11));
    const distance = Math.hypot(120 - x, y - 40);
    const xg = Math.max(0.02, Math.min(0.78, 0.55 * Math.exp(-distance / 11) * (1 - Math.abs(y - 40) / 60)));
    const roll = random();
    const outcome = roll < xg * 1.15 ? "goal" : roll < 0.5 ? "saved" : roll < 0.72 ? "missed" : roll < 0.9 ? "blocked" : "post";
    const wide = outcome === "missed";
    const goalY = outcome === "blocked" ? null : wide ? (random() < 0.5 ? -1 : 1) * (4.3 + random() * 3.5) : (outcome === "post" ? (random() < 0.5 ? -1 : 1) * 4 : normal(random) * 2.1);
    const goalZ = outcome === "blocked" ? null : wide && random() < 0.4 ? 2.8 + random() * 1.6 : Math.max(0.1, Math.min(2.6, 0.2 + random() * 2.3));
    shots.push({ x: round(x), y: round(y), outcome, xg: round(xg, 2), goalY: goalY === null ? null : round(goalY, 2), goalZ: goalZ === null ? null : round(goalZ, 2), team: "home", title: `${outcome}, ${Math.round(distance)} yd out, xG ${round(xg, 2)}` });
  }
  return shots;
}
