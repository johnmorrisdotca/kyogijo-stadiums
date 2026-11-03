// A made-up game of hockey, shaped from a public play-by-play: the events of a real game (their kinds, roughly where on the ice and in what order) become the events of an invented one, between
// invented sides with invented players, so that no team, player, date or sequence of the real game can be read from it. Pure and seeded: the same play-by-play and seed give the same game.
//
// What changes: the teams (the play-by-play's away side becomes the home side), every name and number, the places (turned so that each side attacks one end per period, mirrored across the
// rink, and jittered), the times (each gap re-timed, so the game plays in minutes), and the result (an overtime is left out, and one late goal of the away side is a shot that is saved).
// What is added: the play-by-play has events only, so the five skaters and the goaltender of each side are moved between them, in a plausible shape round the puck; the goaltenders stay in
// their crease. The real game's coordinates are in feet from centre ice, the frame `from: "nhl-api"` reads.
// Dead time is hockey's, from the package's rule set (src/replay.hockey.ts): every stoppage stops the game clock, the puck stays where play stopped and is then out of sight, the players glide to
// the face-off's line-up at the dot the rules give (centre after a goal, the end-zone dot after a save, the offending side's end after icing or a penalty, the neutral-zone dot after offside), a line
// coming off goes to its bench and the next comes on from it, and the clock runs again at the drop. The real game's face-off spots are only compared with the rules' (`agreement`), never kept.

import { addDeadTime } from "../src/replay.deadtime.ts";
import { HOCKEY_DEAD_TIME, HOCKEY_DOTS, HOCKEY_RULES, hockeyFaceoffDot, hockeyFormation, hockeyStopOf } from "../src/replay.hockey.ts";

/** A seeded generator of numbers from 0 to 1 (mulberry32). */
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
const round2 = (n) => Math.round(n * 100) / 100;
const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
const smooth = (x) => x * x * (3 - 2 * x);
const secondsOf = (clock) => {
  const [m, s] = String(clock ?? "0:0").split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
};

/** The invented sides: names in English and Japanese, a colour each, and the rosters (goaltenders, then forwards in lines of three, then defence in pairs). */
export const SIDES = {
  home: {
    name: { en: "Canada", ja: "カナダ" },
    abbr: "CAN",
    flag: "CA",
    color: "#d52b1e",
    prefix: "c",
    goalies: [[30, "Callum Ashdown", "カラム・アッシュダウン"], [35, "Wade Pellerin", "ウェイド・ペルラン"]],
    forwards: [
      [9, "Rory Kilbride", "ローリー・キルブライド"], [11, "Jonah Hartwell", "ジョナ・ハートウェル"], [14, "Mathis Gauvreau", "マティス・ゴーヴロー"],
      [16, "Ethan Brannock", "イーサン・ブラノック"], [18, "Felix Ouimette", "フェリックス・ウィメット"], [19, "Declan Rousse", "デクラン・ルース"],
      [21, "Noah Whitcombe", "ノア・ウィットコム"], [22, "Simon Vachonne", "シモン・ヴァション"], [24, "Cole Ardagh", "コール・アーダー"],
      [26, "Gabriel Brisebane", "ガブリエル・ブリズベイン"], [27, "Tristan Mulcahey", "トリスタン・マルケイヒー"], [29, "Owen Pelletreau", "オーウェン・ペルトロー"],
    ],
    defence: [[2, "Isaac Rennick", "アイザック・レニック"], [4, "Lucas Fairbairn", "ルーカス・フェアベアン"], [5, "Marc-Olivier Danjou", "マルク＝オリヴィエ・ダンジュー"], [7, "Theo Galloway", "テオ・ギャロウェイ"], [44, "Brendan Sorley", "ブレンダン・ソーリー"], [55, "Henri Cadotte", "アンリ・カドット"]],
  },
  away: {
    name: { en: "Japan", ja: "日本" },
    abbr: "JPN",
    flag: "JP",
    color: "#1d3f8f",
    prefix: "j",
    goalies: [[1, "Haruto Onodera", "小野寺 陽翔"], [31, "Ren Hoshikawa", "星川 蓮"]],
    forwards: [
      [8, "Sota Iwaki", "岩城 颯太"], [10, "Yuto Kumagiri", "熊切 悠斗"], [13, "Kaito Okitsu", "沖津 海斗"],
      [15, "Riku Nagase", "長瀬 陸"], [17, "Daichi Hayami", "速水 大地"], [19, "Takumi Kurose", "黒瀬 拓海"],
      [20, "Kenta Uchiyama", "内山 健太"], [23, "Shun Hirose", "広瀬 駿"], [25, "Itsuki Fujinami", "藤波 樹"],
      [28, "Kota Nanase", "七瀬 光太"], [33, "Yamato Takebe", "武部 大和"], [39, "Haru Shinozaki", "篠崎 晴"],
    ],
    defence: [[2, "Naoki Sugawara", "菅原 直樹"], [4, "Sho Ishikura", "石倉 翔"], [5, "Tatsuya Moriwaki", "森脇 達也"], [6, "Yu Kanda", "神田 悠"], [7, "Ryo Takatsuki", "高槻 涼"], [27, "Kei Shiozaki", "塩崎 圭"]],
  },
};

/** A roster as the game file has it: each player's id, number, names and place. */
export function rosterOf(side) {
  const s = SIDES[side];
  const one = (position) => ([number, en, ja]) => ({ id: `${s.prefix}${number}`, number, name: { en, ja }, position });
  return [...s.goalies.map(one("G")), ...s.forwards.map(one("F")), ...s.defence.map(one("D"))];
}


/** What a kind of play is to the made-up game. A delayed penalty is not a stoppage (play goes on until the side it is against touches the puck), so it is left out. */
const KINDS = { faceoff: "faceoff", "shot-on-goal": "shot", "missed-shot": "miss", "blocked-shot": "block", goal: "goal", hit: "hit", giveaway: "giveaway", takeaway: "takeaway", stoppage: "whistle", penalty: "whistle" };

/** Which side had the puck at a beat: the one that shot, gave it away, took it or won the draw; a block is the shooters' too; a hit or a whistle says nothing. */
const carrier = (beat) => (["shot", "miss", "goal", "giveaway", "takeaway", "faceoff"].includes(beat.kind) ? beat.team : beat.kind === "block" ? (beat.team === "home" ? "away" : "home") : undefined);

/** The net a side shoots at in a period: home attacks the right end (x > 0) in the first and third, the left in the second. */
const netOf = (side, period) => ((side === "home") === (period !== 2) ? 89 : -89);
/** The end a side attacks (1 for the right), and the end it defends (the other). */
const attacksOf = (side, period) => Math.sign(netOf(side, period));

// Where each skater stands, along the way a side attacks (x) and across (y), in feet from the puck's line: with the puck, and without it.
const WITH = { C: [4, 0], LW: [-2, -17], RW: [-2, 17], LD: [-30, -13], RD: [-30, 13] };
const WITHOUT = { C: [-9, 0], LW: [-13, -15], RW: [-13, 15], LD: [-24, -9], RD: [-24, 9] };
const ROLES = ["C", "LW", "RW", "LD", "RD"];
const nearestDot = (x, y) => HOCKEY_DOTS.reduce((best, dot) => (Math.hypot(dot[0] - x, dot[1] - y) < Math.hypot(best[0] - x, best[1] - y) ? dot : best));
const STOPPING = new Set(["whistle", "goal"]);
/** Seconds the players stand still at the end of a period before the next one. */
const PERIOD_END_HOLD = 2;

/**
 * Make the game.
 * @param {{ plays: object[], homeTeam: { id: number }, awayTeam: { id: number } }} pbp the play-by-play
 * @param {{ seed?: number, rate?: number }} [options] `rate`: key frames a second (2)
 */
export function fictionGame(pbp, { seed = 5310, rate = 2 } = {}) {
  const random = seeded(seed);
  const jitter = (size) => (random() - 0.5) * 2 * size;
  // The play-by-play's away side is the made-up home side.
  const sideOf = (teamId) => (teamId === pbp.awayTeam.id ? "home" : teamId === pbp.homeTeam.id ? "away" : undefined);
  const plays = [...pbp.plays].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const beats = [];
  for (const play of plays) {
    const period = play.periodDescriptor?.number;
    if (!(period >= 1 && period <= 3)) continue;
    const kind = KINDS[play.typeDescKey];
    if (kind === undefined) continue;
    const d = play.details ?? {};
    let x = d.xCoord;
    let y = d.yCoord;
    const team = sideOf(d.eventOwnerTeamId);
    if (typeof x === "number" && typeof y === "number") {
      // The made-up home side is the play-by-play's away side: it defends the end its opponent attacks.
      const homeDefendsLeft = play.homeTeamDefendingSide === "right";
      const wanted = period !== 2;
      if (homeDefendsLeft !== wanted) [x, y] = [-x, -y];
      // Mirrored across the rink, and jittered.
      y = -y;
      x = clamp(x + jitter(3), -97, 97);
      y = clamp(y + jitter(3), -40, 40);
    } else if (kind !== "whistle") continue;
    const beat = { period, real: secondsOf(play.timeInPeriod), kind, team, x, y };
    if (kind === "whistle") beat.reason = hockeyStopOf(play.typeDescKey, d.reason);
    // A face-off's real spot is only compared with the rules' spot, then forgotten.
    if (kind === "faceoff" && typeof x === "number") beat.real = { at: beat.real, dot: nearestDot(x, y) };
    beats.push(beat);
  }
  for (const b of beats) if (b.kind === "faceoff") [b.realDot, b.real] = [b.real.dot, b.real.at];
  // One late goal of the away side is a save: the result is not the real one.
  const late = beats.filter((b) => b.kind === "goal" && b.team === "away" && b.period === 3).at(-1);
  if (late !== undefined) late.kind = "shot";

  // ---- Re-timed: a gap of the real game is a second or a few, play stops at every whistle and goal, and every period opens with the players lined up at centre ice. Each stoppage is an instant
  // here (the play, then the line-up on the dot); `addDeadTime` opens it into the dead time of the rules once the frames are made. The puck's places are made as the beats are timed, so a
  // stoppage knows where the puck was when play stopped. ----
  const periods = [];
  const stops = [];
  const stoppages = [];
  const keys = [];
  const drops = [];
  let t = 0;
  let agreed = 0;
  let compared = 0;
  const puckAt = (time) => {
    let k = 0;
    while (k + 1 < keys.length && keys[k + 1].t <= time) k += 1;
    const a = keys[k];
    const b = keys[k + 1];
    if (a === undefined) return [0, 0];
    if (b === undefined || b.t <= a.t || time <= a.t) return [a.x, a.y];
    const f = (time - a.t) / (b.t - a.t);
    // A pass is quick off the stick and slows: eased in a short segment, carried evenly in a long one.
    const e = b.t - a.t < 1.6 ? smooth(f) : f;
    return [a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e];
  };
  const timed = [];
  for (const period of [1, 2, 3]) {
    const own = beats.filter((b) => b.period === period);
    if (own.length === 0) continue;
    // A period opens with a face-off at centre ice.
    if (own[0].kind !== "faceoff") own.unshift({ period, real: 0, kind: "faceoff", team: undefined, x: 0, y: 0 });
    const start = t;
    let real = 0;
    let held;
    own.forEach((b, i) => {
      if (i === 0) {
        // The line-up before the opening face-off: the clock reads the period's full time until the drop.
        b.t = round2(start + HOCKEY_DEAD_TIME.lineUp);
        stoppages.push({ start: round2(start), end: b.t, reason: "period-start", x: 0, y: 0 });
        [b.x, b.y] = [0, 0];
        b.stop = { reason: "period-start" };
        if (b.realDot !== undefined) {
          compared += 1;
          if (b.realDot[0] === 0 && b.realDot[1] === 0) agreed += 1;
        }
      } else if (b.kind === "faceoff") {
        // The stoppage before it: the whistles and goals just before the face-off, else the play just before it (a save with no whistle in the play-by-play).
        let first = i;
        while (first - 1 > 0 && STOPPING.has(own[first - 1].kind) && own[first - 1].stop === undefined) first -= 1;
        const run = own.slice(first, i);
        const before = own[first - 1];
        let reason;
        let stopT;
        let team;
        let defends;
        const goal = run.find((r) => r.kind === "goal");
        const penalty = run.find((r) => r.reason === "penalty");
        if (goal !== undefined) {
          reason = "goal";
          stopT = round2(goal.t + 0.35);
        } else if (run.length > 0) {
          reason = penalty !== undefined ? "penalty" : run[0].reason ?? "whistle";
          stopT = run[0].t;
        } else {
          reason = ["shot", "miss"].includes(before.kind) ? "save" : "whistle";
          stopT = round2(before.t + (reason === "save" ? 0.7 : 0.5));
        }
        const [px, py] = puckAt(stopT);
        let at = [px, py];
        if (reason === "save") {
          // The end of the net the shot was at, on the side it came from.
          const shot = [...own.slice(0, first)].reverse().find((r) => ["shot", "miss"].includes(r.kind));
          const shooter = shot === undefined ? undefined : carrier(shot);
          if (shot !== undefined && shooter !== undefined) at = [netOf(shooter, period), shot.y];
        }
        // Who it was against: the side that took the penalty; for icing and offside, the side the source's face-off was against (its spot's end), else the side that had the puck.
        const realEnd = b.realDot === undefined ? 0 : Math.sign(b.realDot[0]);
        if (reason === "penalty") team = penalty.team;
        else if ((reason === "icing" || reason === "offside") && realEnd !== 0) team = ["home", "away"].find((s) => attacksOf(s, period) === (reason === "icing" ? -realEnd : realEnd));
        else if (reason === "icing" || reason === "offside") team = held;
        if (team !== undefined) defends = -attacksOf(team, period);
        // The spot's side of the rink: after icing and a penalty the side not at fault chooses it, after offside it is the side the puck crossed the line on, and the play-by-play says neither: the
        // source's side is taken.
        if ((reason === "icing" || reason === "penalty" || reason === "offside") && b.realDot !== undefined && b.realDot[1] !== 0) at = [at[0], b.realDot[1]];
        const dot = hockeyFaceoffDot({ reason, x: at[0], y: at[1], defends });
        const last = Math.max(stopT, ...run.map((r) => r.t));
        b.t = round2(last + 0.04);
        [b.x, b.y] = dot;
        b.stop = { reason };
        stops.push({ t: stopT, until: b.t, reason, x: dot[0], y: dot[1], ...(team === undefined ? {} : { team }) });
        b.whistleAt = reason === "goal" ? undefined : { t: stopT, x: round1(px), y: round1(py) };
        if (b.realDot !== undefined) {
          compared += 1;
          if (b.realDot[0] === dot[0] && b.realDot[1] === dot[1]) agreed += 1;
        }
      } else {
        const sameMoment = b.real <= real;
        const gap = b.kind === "whistle" && sameMoment ? 0.5 : clamp(1 + Math.max(0, b.real - real) * 0.07, 1, 4) + jitter(0.25);
        b.t = round2(t + gap);
      }
      real = b.real;
      if (b.x === undefined) [b.x, b.y] = puckAt(b.t);
      t = b.t;
      held = carrier(b) ?? held;
      // The puck: dropped on the dot at a face-off (held where it was until then); to the net on a shot; where the play was at a hit, a giveaway or a takeaway; still at a whistle.
      if (b.kind === "faceoff") {
        if (keys.length > 0) keys.push({ t: round2(b.t - 0.04), x: keys.at(-1).x, y: keys.at(-1).y });
        keys.push({ t: b.t, x: b.x, y: b.y });
        drops.push(b);
      } else if (b.kind !== "whistle") {
        keys.push({ t: b.t, x: b.x, y: b.y });
        const shooter = carrier(b);
        if (["shot", "goal", "miss"].includes(b.kind) && shooter !== undefined) {
          const net = netOf(shooter, b.period);
          const to = b.kind === "goal" ? { x: net + Math.sign(net) * 1.5, y: jitter(1.5) } : b.kind === "shot" ? { x: net - Math.sign(net) * 4, y: clamp(b.y * 0.12, -3, 3) } : { x: net + Math.sign(net) * 2, y: (random() < 0.5 ? -1 : 1) * (5 + random() * 4) };
          keys.push({ t: round2(b.t + 0.35), x: round1(to.x), y: round1(to.y), shot: true });
          b.to = to;
        }
      }
      timed.push(b);
    });
    t += 2;
    const end = round2(t);
    periods.push({ number: period, start: round2(start), end, length: 1200 });
    // The end of the period: the horn, and the players stand a moment; the puck is dead where it was.
    stoppages.push({ start: end, end: round2(end + PERIOD_END_HOLD), reason: "period-end" });
    t = round2(end + PERIOD_END_HOLD + 0.04);
  }
  beats.length = 0;
  beats.push(...timed);

  // ---- Who has the puck between beats, and the lines on the ice. ----
  const possessionAt = [];
  let held;
  beats.forEach((b) => {
    held = carrier(b) ?? held;
    possessionAt.push(held);
  });
  const rosters = { home: rosterOf("home"), away: rosterOf("away") };
  const lineOf = (side, f, d) => {
    const r = rosters[side];
    const fw = r.filter((p) => p.position === "F");
    const de = r.filter((p) => p.position === "D");
    return { C: fw[f * 3], LW: fw[f * 3 + 1], RW: fw[f * 3 + 2], LD: de[d * 2], RD: de[d * 2 + 1], G: r[0] };
  };
  const lines = { home: { f: 0, d: 0, since: 0 }, away: { f: 1, d: 1, since: 0 } };

  // ---- The frames: every key of the puck and a frame every 1/rate seconds while play is on; the skaters ease toward where they would stand, the goaltenders follow the puck across their crease;
  // at a drop everyone is in the line-up. ----
  const dropAt = new Map(drops.map((b) => [b.t, b]));
  const times = new Set();
  for (const p of periods) {
    const opening = drops.find((b) => b.period === p.number);
    for (let s = opening.t; s <= p.end + 1e-9; s += 1 / rate) times.add(round2(s));
    times.add(p.start);
    times.add(p.end);
    times.add(round2(p.end + PERIOD_END_HOLD));
  }
  for (const k of keys) times.add(k.t);
  for (const s of stops) times.add(s.t);
  // Nothing is made between a stoppage and its drop: that is the dead time the rules make.
  const inStop = (time) => stops.some((s) => time > s.t && time < s.until) || stoppages.some((s) => s.reason === "period-start" && time > s.start && time < s.end);
  const ordered = [...times].filter((s) => s >= 0 && !inStop(s)).sort((a, b) => a - b);
  const periodOf = (time) => periods.find((p) => time >= p.start && time <= p.end + PERIOD_END_HOLD + 1e-9) ?? periods.at(-1);
  const sway = new Map();
  const swayOf = (id) => {
    if (!sway.has(id)) sway.set(id, { a: random() * 6.283, b: random() * 6.283, amp: 1 + random() * 1.5, rate: 0.4 + random() * 0.4 });
    return sway.get(id);
  };
  const state = new Map();
  const frames = [];
  const holders = new Map();
  let beat = 0;
  let coming = 0;
  let before = 0;
  let lastObjects = [];
  for (const time of ordered) {
    const period = periodOf(time);
    if (time > period.end + 1e-9) {
      // The players stand where they were at the end of the period.
      frames.push({ t: time, objects: lastObjects });
      continue;
    }
    while (beat < beats.length && beats[beat].t <= time) beat += 1;
    // The beat at or after this moment: the side that has the puck is the one that does something with it next.
    while (coming < beats.length && beats[coming].t < time) coming += 1;
    const opening = time === period.start;
    const drop = dropAt.get(time) ?? (opening ? drops.find((b) => b.period === period.number) : undefined);
    // A line change at a face-off, once a line has had its shift, and at the start of a period.
    if (drop !== undefined) {
      for (const side of ["home", "away"]) {
        if (time - lines[side].since >= 40 || opening) {
          if (!opening || time > 0) {
            lines[side].f = (lines[side].f + 1) % 4;
            lines[side].d = (lines[side].d + 1) % 3;
          }
          lines[side].since = time;
        }
      }
    }
    const [px, py] = puckAt(time);
    const poss = possessionAt[Math.min(coming, beats.length - 1)];
    const dt = Math.max(0, time - before);
    before = time;
    const objects = [];
    for (const side of ["home", "away"]) {
      const on = lineOf(side, lines[side].f, lines[side].d);
      const dir = attacksOf(side, period.number);
      const lineUp = drop === undefined ? undefined : hockeyFormation([drop.x, drop.y], dir);
      const mine = poss === side;
      // The skater of the side with the puck nearest it carries it.
      let holder;
      if (mine) {
        let best = Infinity;
        for (const role of ROLES) {
          const was = state.get(on[role].id);
          const dist = was === undefined ? Infinity : Math.hypot(was[0] - px, was[1] - py);
          if (dist < best) [best, holder] = [dist, role];
        }
        holder ??= "C";
        holders.set(time + side, on[holder].id);
      }
      // The nearest skater of the other side presses the puck.
      let presser;
      if (!mine) {
        let best = Infinity;
        for (const role of ROLES) {
          const was = state.get(on[role].id);
          const dist = was === undefined ? Infinity : Math.hypot(was[0] - px, was[1] - py);
          if (dist < best) [best, presser] = [dist, role];
        }
      }
      for (const role of ROLES) {
        const player = on[role];
        let x;
        let y;
        if (lineUp !== undefined) [x, y] = lineUp[role];
        else {
          const [ax, ay] = (mine ? WITH : WITHOUT)[role];
          const s = swayOf(player.id);
          let tx = clamp(px * 0.8 + ax * dir + Math.sin(time * s.rate + s.a) * s.amp, -95, 95);
          let ty = clamp(py * 0.45 + ay * (side === "home" ? 1 : -1) + Math.cos(time * s.rate + s.b) * s.amp, -39, 39);
          let tau = 0.55;
          if (role === holder) [tx, ty, tau] = [px - dir * 2.2, py + 1, 0.08];
          else if (role === presser) [tx, ty, tau] = [px + dir * 7, py - 2, 0.3];
          const was = state.get(player.id);
          const k = was === undefined ? 1 : 1 - Math.exp(-dt / tau);
          x = was === undefined ? tx : was[0] + (tx - was[0]) * k;
          y = was === undefined ? ty : was[1] + (ty - was[1]) * k;
        }
        state.set(player.id, [x, y]);
        objects.push({ id: player.id, team: side, number: player.number, x: round1(clamp(x, -96, 96)), y: round1(clamp(y, -40, 40)) });
      }
      // The goaltender in the crease, across it with the puck; square in the middle of it for a face-off.
      const g = on.G;
      const gx = -dir * 85;
      const gy = lineUp !== undefined ? 0 : clamp(py * 0.1, -3, 3);
      state.set(g.id, [gx, gy]);
      objects.push({ id: g.id, team: side, number: g.number, x: round1(gx), y: round1(gy) });
    }
    // Out of sight in the line-up before a period's first drop: the linesman has it.
    if (!(time >= period.start && time < drops.find((b) => b.period === period.number).t)) objects.push({ id: "puck", team: "puck", x: round1(px), y: round1(py) });
    frames.push({ t: time, objects });
    lastObjects = objects;
  }

  // ---- The events: shots, goals and whistles where they were, the face-offs, and the passes between the beats of one side. ----
  const events = [];
  let score = { home: 0, away: 0 };
  const byPeriod = periods.map(() => ({ home: 0, away: 0 }));
  beats.forEach((b, i) => {
    const shooter = carrier(b);
    const by = shooter === undefined ? undefined : holders.get(b.t + shooter);
    if (b.kind === "goal" && shooter !== undefined) {
      score = { ...score, [shooter]: score[shooter] + 1 };
      byPeriod[periods.findIndex((p) => p.number === b.period)][shooter] += 1;
      events.push({ t: b.t, kind: "goal", team: shooter, ...(by === undefined ? {} : { by }), x: round1(b.x), y: round1(b.y), ...(b.to === undefined ? {} : { x2: round1(b.to.x), y2: round1(b.to.y) }) });
    } else if (["shot", "miss", "block"].includes(b.kind) && shooter !== undefined) {
      events.push({ t: b.t, kind: "shot", team: shooter, ...(by === undefined ? {} : { by }), x: round1(b.x), y: round1(b.y), ...(b.to === undefined ? {} : { x2: round1(b.to.x), y2: round1(b.to.y) }) });
    } else if (b.kind === "faceoff") {
      // The whistle that stopped play (a goal has its horn), then the drop.
      if (b.whistleAt !== undefined) events.push({ t: b.whistleAt.t, kind: "whistle", x: b.whistleAt.x, y: b.whistleAt.y });
      events.push({ t: b.t, kind: "faceoff", x: b.x, y: b.y });
    }
    // A pass: the side that had the puck at this beat has it at the next, a few strides away, with no stoppage between.
    const next = beats[i + 1];
    if (next === undefined || next.period !== b.period || next.kind === "faceoff" || ["shot", "goal", "miss", "block", "whistle"].includes(b.kind)) return;
    const side = possessionAt[i + 1];
    if (side === undefined || carrier(next) !== side) return;
    const far = Math.hypot(next.x - b.x, next.y - b.y);
    const from = holders.get(b.t + side);
    const to = holders.get(next.t + side);
    if (far >= 25 && far <= 110 && from !== undefined && to !== undefined && from !== to) events.push({ t: round2(b.t + 0.05), kind: "pass", team: side, by: from, to, until: next.t });
  });
  events.sort((a, b) => a.t - b.t);

  // ---- The dead time: each stoppage opened into the rules' line-up, the clock stopped through it. ----
  const live = { from: "nhl-api", frames, events, stoppages, periods };
  const played = addDeadTime(live, stops, HOCKEY_RULES);

  return {
    kind: "kyogijo-game",
    version: 1,
    sport: "nhl",
    note: {
      en: "A made-up game, shaped from a public NHL play-by-play; teams and players are invented.",
      ja: "公開されているNHLのプレーバイプレーをもとに作った架空の試合です。チームも選手も架空のものです。",
    },
    teams: Object.fromEntries(["home", "away"].map((side) => [side, { name: SIDES[side].name, abbr: SIDES[side].abbr, flag: SIDES[side].flag, color: SIDES[side].color }])),
    rosters,
    score: { ...score, byPeriod: byPeriod.map((p) => [p.home, p.away]) },
    periods: played.periods.map((p) => ({ number: p.number, start: p.start, end: p.end })),
    timeline: { from: "nhl-api", frames: played.frames, events: played.events, stoppages: played.stoppages },
    agreement: { compared, agreed },
  };
}
