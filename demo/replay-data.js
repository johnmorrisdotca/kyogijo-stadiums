// A made-up play for the demo's "Replay" section, for the tests and for the docs: a team brings the ball forward with passes and scores. No real game,
// player or team is behind it, and every number comes from a fixed seed, so the same call always gives the same frames. The shape is a timeline of
// `@johnmorrisdotca/kyogijo-stadiums/replay`: frames of { t, objects, possession }, in the numbers of a provider's frame (Opta's 0 to 100 for the pitch, the NHL
// API's feet from centre ice for the rink).
import { seeded } from "./layers-data.js";

const round = (n) => Math.round(n * 100) / 100;
const smooth = (x) => x * x * (3 - 2 * x);
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

/** What differs between the sports: the frame, the size of the frame, where each player stands when the team defends, and the goal. Home attacks to the right. */
const SPECS = {
  soccer: {
    sport: "soccer",
    from: "opta",
    x: [0, 100],
    y: [0, 100],
    // Goalkeeper, four defenders, four midfielders, two forwards.
    anchors: [[4, 50], [22, 86], [20, 63], [20, 37], [22, 14], [48, 86], [45, 62], [45, 38], [48, 14], [62, 62], [62, 38]],
    numbers: [1, 2, 5, 4, 3, 7, 8, 6, 11, 9, 10],
    // How far each stands from the ball's side of the pitch: the goalkeeper hardly moves.
    lean: [0.12, 0.3, 0.3, 0.3, 0.3, 0.38, 0.38, 0.38, 0.38, 0.34, 0.34],
    sway: 2.4,
    goal: [100, 50, 5],
    ball: "ball",
    gap: 2.4,
    flight: 0.8,
    official: true,
  },
  hockey: {
    sport: "nhl",
    from: "nhl-api",
    x: [-100, 100],
    y: [-42.5, 42.5],
    // A centre, two wings, two defence and a goaltender.
    anchors: [[30, 0], [44, 19], [44, -19], [14, 14], [14, -14], [-89, 0]],
    numbers: [91, 17, 28, 5, 8, 31],
    lean: [0.32, 0.34, 0.34, 0.3, 0.3, 0.1],
    sway: 4,
    goal: [89, 0, 3],
    ball: "puck",
    gap: 1.5,
    flight: 0.55,
    official: true,
  },
};

/**
 * A timeline of a play: a team passes the ball (or puck) forward, shoots and scores.
 * @param {"soccer" | "hockey"} kind
 * @param {{ seconds?: number, fps?: number, seed?: number }} [options]
 */
export function replayPlay(kind = "soccer", { seconds = 24, fps = 25, seed = kind === "soccer" ? 4101 : 4102 } = {}) {
  const spec = SPECS[kind];
  const random = seeded(seed);
  const [x0, x1] = spec.x;
  const [y0, y1] = spec.y;
  const centre = [(x0 + x1) / 2, (y0 + y1) / 2];
  const mirror = ([x, y]) => [x0 + x1 - x, y0 + y1 - y];
  const players = [];
  for (const team of ["home", "away"]) {
    spec.anchors.forEach((anchor, i) => {
      players.push({ id: `${team === "home" ? "h" : "a"}${i + 1}`, team, number: spec.numbers[i], anchor: team === "home" ? anchor : mirror(anchor), lean: spec.lean[i], a: random() * 6.283, b: random() * 6.283, amp: spec.sway * (0.6 + 0.8 * random()), rate: 0.35 + random() * 0.3 });
    });
  }
  const home = players.filter((p) => p.team === "home");
  // The chain of holders: each pass goes to a team-mate further forward more often than not, and the last holder shoots.
  const lead = spec.flight + 1.1;
  const passes = Math.max(1, Math.floor((seconds - lead - 1) / spec.gap));
  const chain = [{ player: home[spec.anchors.length - 3], at: 0.6 }];
  for (let k = 1; k <= passes; k += 1) {
    const from = chain[k - 1].player;
    const others = home.filter((p) => p !== from && p.anchor[0] > spec.x[0] + (x1 - x0) * 0.12);
    const forward = others.filter((p) => p.anchor[0] >= from.anchor[0] - 6);
    const pool = k === passes ? others.filter((p) => p.anchor[0] > centre[0]) : forward.length > 0 ? forward : others;
    chain.push({ player: pool[Math.floor(random() * pool.length)], at: chain[k - 1].at + spec.gap });
  }
  const shotAt = chain[passes].at + 0.5;
  const goalAt = shotAt + spec.flight + 0.2;

  /** Where the team's attention is at a time: the holder's anchor, eased from one holder to the next while the ball is in the air. */
  const focus = (t) => {
    let k = 0;
    while (k + 1 < chain.length && chain[k + 1].at - spec.flight <= t) k += 1;
    const here = chain[k].player.anchor;
    if (k + 1 >= chain.length) return here;
    const start = chain[k + 1].at - spec.flight;
    if (t < start) return here;
    const f = smooth(clamp((t - start) / spec.flight, 0, 1));
    const next = chain[k + 1].player.anchor;
    return [here[0] + (next[0] - here[0]) * f, here[1] + (next[1] - here[1]) * f];
  };
  const place = (p, t) => {
    const f = focus(t);
    const x = p.anchor[0] + p.lean * (f[0] - centre[0]) * 0.5 + p.amp * Math.sin(p.rate * t + p.a);
    const y = p.anchor[1] + p.lean * (f[1] - centre[1]) * 0.5 + p.amp * 0.8 * Math.cos(p.rate * 1.3 * t + p.b);
    return [clamp(x, x0 + 1, x1 - 1), clamp(y, y0 + 1, y1 - 1)];
  };
  const goalPoint = [spec.goal[0], spec.goal[1] + (random() < 0.5 ? -1 : 1) * spec.goal[2] * 0.7];

  /** The ball: carried by the holder, passed in a smooth flight, then shot. */
  const ball = (t) => {
    for (let k = chain.length - 1; k >= 0; k -= 1) {
      if (t < chain[k].at - (k === 0 ? Infinity : spec.flight)) continue;
      const holder = place(chain[k].player, t);
      if (k === chain.length - 1) {
        if (t < shotAt) return { at: holder, held: chain[k].player.id };
        const f = clamp((t - shotAt) / spec.flight, 0, 1);
        const start = place(chain[k].player, shotAt);
        return { at: [start[0] + (goalPoint[0] - start[0]) * f, start[1] + (goalPoint[1] - start[1]) * f], held: null };
      }
      const start = chain[k + 1].at - spec.flight;
      if (t < start) return { at: holder, held: chain[k].player.id };
      const f = smooth(clamp((t - start) / spec.flight, 0, 1));
      const from = place(chain[k].player, start);
      const to = place(chain[k + 1].player, chain[k + 1].at);
      return { at: [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f], held: f >= 1 ? chain[k + 1].player.id : null };
    }
    return { at: place(chain[0].player, t), held: chain[0].player.id };
  };

  const frames = [];
  const total = Math.round(seconds * fps);
  for (let i = 0; i <= total; i += 1) {
    const t = round(i / fps);
    const objects = players.map((p) => {
      const [x, y] = place(p, t);
      return { id: p.id, team: p.team, number: p.number, x: round(x), y: round(y) };
    });
    const b = ball(t);
    objects.push({ id: spec.ball, team: spec.ball, x: round(clamp(b.at[0], x0, x1)), y: round(clamp(b.at[1], y0, y1)) });
    if (spec.official) {
      const f = focus(t);
      objects.push({ id: "ref", team: "official", label: "Referee", x: round(clamp(f[0] * 0.75 + centre[0] * 0.25, x0 + 2, x1 - 2)), y: round(clamp(centre[1] + (y1 - y0) * 0.38, y0 + 2, y1 - 2)) });
    }
    frames.push({ t, possession: b.held, objects });
  }
  const events = [];
  for (let k = 0; k < passes; k += 1) {
    const start = chain[k + 1].at - spec.flight;
    events.push({ t: round(start), kind: "pass", team: "home", by: chain[k].player.id, to: chain[k + 1].player.id, until: round(chain[k + 1].at) });
  }
  events.push({ t: round(shotAt), kind: "shot", team: "home", by: chain[passes].player.id, x2: goalPoint[0], y2: round(goalPoint[1]), until: round(goalAt) });
  events.push({ t: round(goalAt), kind: "goal", team: "home", x: goalPoint[0], y: round(goalPoint[1]) });
  if (goalAt + 1 < seconds) events.push({ t: round(seconds), kind: "whistle", x: round(centre[0]), y: round(centre[1]) });
  return { from: spec.from, frames, events };
}

/** The options of the drawing each play is laid on. */
export const REPLAY_SURFACES = { soccer: { sport: "soccer" }, hockey: { sport: "nhl" } };
