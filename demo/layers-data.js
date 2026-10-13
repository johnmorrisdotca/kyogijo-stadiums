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

/**
 * A heat map of shots for the rink: many made-up shots from both ends, their places the same kind as `shotMap`'s, counted into 4-foot
 * cells and cut to the boards, with a legend.
 */
export function shotHeat(count = 900, seed = 2620) {
  const random = seeded(seed);
  const data = [];
  for (let i = 0; i < count; i += 1) {
    const home = i % 2 === 0;
    const goalX = home ? 11 : 189;
    const depth = Math.min(70, Math.abs(normal(random)) * 22 + 6);
    const x = Math.max(2, Math.min(198, goalX + (home ? depth : -depth)));
    const y = Math.max(2, Math.min(83, 42.5 + normal(random) * 13));
    data.push({ x: round1(x), y: round1(y) });
  }
  return [{ kind: "heatmap", name: "shots", data, bins: [50, 21], legend: { title: "Shots in each 4 by 4 feet" } }];
}

/**
 * An NBA shot-zone chart: made-up shots at one basket, in the units of stats.nba.com's shot chart (tenths of a foot from the hoop, the
 * right basket attacked), each made or missed with a chance that falls with the distance, counted into the six zones, each zone coloured
 * by its field-goal percentage against a made-up league figure of 46 percent and written as a percent and as made over taken.
 */
export function nbaZones(count = 520, seed = 2621) {
  const random = seeded(seed);
  const data = [];
  for (let i = 0; i < count; i += 1) {
    const roll = random();
    // Distance in feet from the hoop: a few at the rim, many in the midrange, a good share from three.
    const r = roll < 0.22 ? random() * 3.8 : roll < 0.4 ? 4 + random() * 6 : roll < 0.66 ? 10 + random() * 12 : 22 + random() * 5;
    const spread = r < 4 ? 160 : r < 12 ? 100 : 80;
    const angle = Math.max(-spread, Math.min(spread, normal(random) * (r > 22 ? 52 : 60))) * (Math.PI / 180);
    const along = r * Math.cos(angle);
    const across = r * Math.sin(angle);
    const chance = r < 4 ? 0.64 : r < 10 ? 0.43 : r < 22 ? 0.41 : 0.37;
    data.push({ x: Math.round(across * 100) / 10, y: Math.round(along * 100) / 10, outcome: random() < chance ? "made" : "missed" });
  }
  return [
    {
      kind: "zones",
      name: "shots",
      zones: "nba-shot",
      from: "nba-stats",
      end: "right",
      data,
      statistic: "rate",
      statisticName: "Field goals made, %",
      center: 46,
      minCount: 3,
      labels: { show: ["value", "ratio"] },
      legend: { title: "Field-goal % (46 is the league)", ticks: 5, position: "top" },
    },
  ];
}

/**
 * A positional heat map for the soccer pitch: made-up touches by a team attacking to the right, counted into juego de posición's
 * thirty zones (five lanes by six bands) and written as each zone's share of all the touches.
 */
export function touchZones(count = 760, seed = 2622) {
  const random = seeded(seed);
  const data = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.max(1, Math.min(344, 175 + normal(random) * 78));
    const wide = random() < 0.35;
    const y = Math.max(1, Math.min(222, wide ? (random() < 0.5 ? 25 : 198) + normal(random) * 20 : 111 + normal(random) * 52));
    data.push({ x: round1(x), y: round1(y) });
  }
  return [{ kind: "zones", name: "touches", zones: "soccer-positional", direction: "right", data, statistic: "percent", ramp: "ocean", labels: { decimals: 1 }, legend: { title: "Share of the touches" } }];
}

/**
 * A density contour for a ballpark: made-up balls in play, in feet from home plate (x to the right, y out), with a kernel density estimate
 * (Scott's rule) drawn as filled bands, and the balls beneath as small points.
 */
export function sprayDensity(count = 260, seed = 2623) {
  const random = seeded(seed);
  const data = [];
  for (let i = 0; i < count; i += 1) {
    const angle = Math.max(-42, Math.min(42, normal(random) * 20 - 6));
    const depth = Math.max(40, Math.min(380, 150 + normal(random) * 80));
    data.push({ x: round1(depth * Math.sin((angle * Math.PI) / 180)), y: round1(depth * Math.cos((angle * Math.PI) / 180)) });
  }
  return [
    { kind: "contour", name: "balls in play", from: "retrosheet", data, levels: 6, ramp: "ocean", opacity: 0.85, legend: { title: "Density, share of the peak" } },
    { kind: "points", name: "balls in play", from: "retrosheet", data, style: { size: 3.4, opacity: 0.55, stroke: "none" } },
  ];
}
