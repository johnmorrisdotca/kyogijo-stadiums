// Made-up data for the demo's "Data" section, generated from a fixed seed: no real game, player or team. The same call always gives
// the same marks, so the demo, its tests and the README's pictures agree.

/** A small, fast, seeded random number generator (mulberry32): the same seed gives the same run. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n) => Math.round(n * 10) / 10;

/** A normal deviate from two uniform ones. */
const normal = (random) => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());

/**
 * A shot map for the rink: shots in feet on the NHL rink as it is drawn wide (the home team attacks the left end, the end its name is at in a score drawing, and the away team the right), each with the
 * chance it had (`value`, from its distance and angle), who took it, and whether it scored.
 */
export function shotMap(count = 44, seed = 2610) {
  const random = seeded(seed);
  const data = [];
  for (let i = 0; i < count; i += 1) {
    const team = i % 2 === 0 ? "home" : "away";
    const goalX = team === "home" ? 11 : 189;
    const depth = Math.min(75, Math.abs(normal(random)) * 24 + 8);
    const x = goalX + (team === "home" ? depth : -depth);
    const y = Math.max(4, Math.min(81, 42.5 + normal(random) * 15));
    const distance = Math.hypot(goalX - x, 42.5 - y);
    const angle = Math.atan2(Math.abs(42.5 - y), Math.abs(goalX - x));
    const chance = Math.max(0.01, Math.min(0.6, 0.45 * Math.exp(-distance / 24) * (1 - angle / 2.2)));
    const outcome = random() < chance * 1.15 ? "goal" : random() < 0.34 ? "blocked" : "shot";
    data.push({ x: round1(x), y: round1(y), team, outcome, value: Math.round(chance * 100) / 100, title: `${team === "home" ? "Home" : "Away"} ${outcome}, ${distance.toFixed(0)} ft out, ${Math.round(chance * 100)}% chance` });
  }
  return [{ kind: "points", name: "shots", data, style: { size: { range: [1.8, 5.2] }, outcomes: { blocked: { hollow: true, shape: "x" } } } }];
}

/**
 * A pass map for a football field, in the yards of NFL tracking data (x along the field with its end zones, y across it from the
 * bottom): the offence moves to the right, each pass an arrow that is dashed when it was not caught.
 */
export function passMap(count = 20, seed = 2611) {
  const random = seeded(seed);
  const passes = [];
  const marks = [];
  for (let i = 0; i < count; i += 1) {
    const x = 28 + random() * 42;
    const y = 12 + random() * 29;
    const reach = 4 + random() * 30;
    const x2 = Math.min(118, x + reach);
    const y2 = Math.max(2, Math.min(51, y + normal(random) * 9));
    const outcome = random() < 0.68 ? "complete" : "incomplete";
    passes.push({ x: round1(x), y: round1(y), x2: round1(x2), y2: round1(y2), outcome, curve: reach > 22 ? -0.14 : 0.08, title: `Pass ${i + 1}: ${outcome}, ${(x2 - x).toFixed(0)} yards` });
    if (outcome === "complete" && reach > 18) marks.push({ x: round1(x2), y: round1(y2 + 1.8), text: Math.round(x2 - x) });
  }
  return [
    { kind: "arrows", name: "passes", from: "nfl-tracking", data: passes, style: { curve: 0.1, width: 1.6, head: "triangle", color: { by: "outcome", colors: { complete: "var(--ky-layer-home)", incomplete: "var(--ky-layer-away)" } } } },
    { kind: "text", name: "gains", from: "nfl-tracking", data: marks, style: { size: 6.5 } },
  ];
}

/**
 * A spray chart for a ballpark: where balls in play came down, in feet from home plate (x to the right, y out), each with a line from
 * the plate that fades in along its flight. Hits are filled; outs are hollow; a home run is a star.
 */
export function sprayChart(count = 64, seed = 2612) {
  const random = seeded(seed);
  const hits = [];
  const flights = [];
  for (let i = 0; i < count; i += 1) {
    const roll = random();
    const outcome = roll < 0.52 ? "out" : roll < 0.78 ? "single" : roll < 0.88 ? "double" : roll < 0.93 ? "triple" : "homer";
    const angle = Math.max(-44, Math.min(44, normal(random) * 22));
    const wall = 400 - 70 * Math.min(1, (Math.abs(angle) / 45) ** 1.2);
    const depth = outcome === "homer" ? wall - 4 - random() * 10 : outcome === "out" ? 110 + random() * 200 : outcome === "single" ? 90 + random() * 150 : 200 + random() * 120;
    const x = round1(depth * Math.sin((angle * Math.PI) / 180));
    const y = round1(depth * Math.cos((angle * Math.PI) / 180));
    const team = i % 3 === 0 ? "away" : "home";
    hits.push({ x, y, team, outcome, title: `${outcome}, ${Math.round(depth)} ft to ${angle < -8 ? "left" : angle > 8 ? "right" : "centre"}` });
    flights.push({ x: 0, y: 0, x2: x, y2: y, team, outcome, curve: angle < 0 ? 0.04 : -0.04 });
  }
  return [
    { kind: "lines", name: "flights", from: "retrosheet", data: flights, style: { width: 0.5, opacity: 0.45, dash: "solid", comet: { from: 0.0 } } },
    { kind: "points", name: "balls in play", from: "retrosheet", data: hits, style: { size: 7, outcomes: { homer: { shape: "star", scale: 1.5 }, double: { scale: 1.15 }, triple: { scale: 1.3 }, out: { hollow: true } } } },
  ];
}
