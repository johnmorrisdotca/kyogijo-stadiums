// A situation drawn on a surface: hockey's pill and tinted attacking zone, its empty net and shootout strip; baseball's lit bases and scorebug; football's line of scrimmage, first-down line,
// red zone, tag and drive chart. What is under the surface's lines (a tint) is `under`, what is over them is `over`; both are in the surface's wide frame, in feet, with the widgets set
// upright (turned back when the surface is turned a quarter).
import { wideView } from "./annotate.ts";
import { el, num } from "./format.ts";
import { DRIVE_CODES, downTag, hockeyPill, yardLineText, type BaseballRead, type FootballRead, type HockeyRead, type SituationRead } from "./situation.ts";
import { pillWidget, scorebugWidget, shootoutWidget, tagWidget, type Widget } from "./situation.widgets.ts";
import { KYOGIJO_STRINGS } from "./strings.ts";
import { roundedRect, textOn, type Surface } from "./surfaces/surface.ts";
import type { Language, Side } from "./types.ts";

/** What a situation is drawn with. */
export interface SituationEnv {
  id: string;
  language: Language;
  /** The side the home team is on. */
  homeSide: Side;
  /** The two teams' short names, when the drawing has teams. */
  abbrs?: { home: string; away: string };
  /** The score's panel stands in the middle of the surface. */
  plate: boolean;
}

/** What a situation adds to a drawing. */
export interface SituationDrawn {
  /** Over the surface's ground and under its lines. */
  under: string;
  /** Over the lines and the data, under the score's panel. */
  over: string;
  defs: string;
}

type View = { x: number; y: number; w: number; h: number };

/** A widget set where the eye wants it, upright however the surface lies. */
function put(widget: Widget, cx: number, cy: number, turned: boolean): string {
  return el("g", { class: "ky-sit-w", transform: `translate(${num(cx)} ${num(cy)})${turned ? " rotate(-90)" : ""}` }, widget.markup);
}

/** A value held between `lo` and `hi`; the middle of them when they cross. */
const within = (value: number, lo: number, hi: number): number => (hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, value)));

/**
 * A widget's centre held inside a box with a little to spare. A surface turned a quarter turns the widget back, so its width then lies along the wide frame's y and its height along x.
 */
function inside(widget: Widget, turned: boolean, box: View, cx: number, cy: number): [number, number] {
  const hx = (turned ? widget.h : widget.w) / 2 + 1;
  const hy = (turned ? widget.w : widget.h) / 2 + 1;
  return [within(cx, box.x + hx, box.x + box.w - hx), within(cy, box.y + hy, box.y + box.h - hy)];
}

const sideOf = (team: "home" | "away", homeSide: Side): Side => ((team === "home") === (homeSide === "left") ? "left" : "right");

/** The rotation, on the eye's page, of an arrow that points to the `left` or `right` end of a surface drawn wide (turned a quarter, `right` is down). */
const headAngle = (toward: "left" | "right", turned: boolean): number => (turned ? (toward === "right" ? 90 : -90) : toward === "right" ? 0 : 180);

function drawHockey(read: HockeyRead, surface: Surface, env: SituationEnv): SituationDrawn {
  const a = surface.anchors?.kind === "hockey" ? surface.anchors : undefined;
  const out: SituationDrawn = { under: "", over: "", defs: "" };
  if (a === undefined) return out;
  const vb: View = surface.box ?? { x: 0, y: 0, w: a.length, h: a.width };
  const size = 5.2;
  const words = KYOGIJO_STRINGS[env.language].situation;
  if (read.shootout !== undefined) {
    const labels: [string, string] = [env.abbrs?.away ?? words.awayShort, env.abbrs?.home ?? words.homeShort];
    const strip = shootoutWidget({ rounds: read.shootout.rounds, goals: read.shootout.goals, sudden: read.shootout.sudden, labels, sides: [sideOf("away", env.homeSide), sideOf("home", env.homeSide)], suddenWord: words.sudden }, size * 0.56, true);
    const cx = vb.x + vb.w / 2;
    // Under the score's panel when it stands in the middle, else across the middle of what is shown.
    const below = env.plate ? surface.plate.cy + surface.plate.h / 2 + 2 + strip.h / 2 : vb.y + vb.h / 2;
    out.over = put(strip, ...inside(strip, surface.turned, vb, cx, below), surface.turned);
    return out;
  }
  const label = hockeyPill(read, env.language);
  if (read.attacker !== undefined && read.toward !== undefined) {
    // The attacking zone, from the blue line to the end boards, in the attacking team's colour, cut to the ice.
    const x0 = read.toward === "right" ? a.length - a.blueLine : 0;
    out.defs = el("clipPath", { id: `${env.id}-sit-ice` }, el("path", { d: roundedRect(0, 0, a.length, a.width, a.cornerRadius) }));
    out.under = el("g", { class: "ky-sit-zone-g", "clip-path": `url(#${env.id}-sit-ice)` }, el("rect", { class: `ky-sit-zone ky-sit-zone-${sideOf(read.attacker, env.homeSide)}`, x: x0, y: 0, width: a.blueLine, height: a.width }));
  }
  if (read.emptyNet !== undefined && read.toward !== undefined) {
    // The empty net is at the end the attackers are leaving: ringed.
    const gx = read.toward === "right" ? a.goalLine : a.length - a.goalLine;
    const dir = read.toward === "right" ? -1 : 1;
    const pad = 1.3;
    out.over += el("rect", { class: "ky-sit-net", x: dir < 0 ? gx - a.net.depth - pad : gx - pad, y: a.width / 2 - a.net.width / 2 - pad, width: a.net.depth + 2 * pad, height: a.net.width + 2 * pad, rx: 1.2 });
  }
  if (label !== undefined) {
    const pill = pillWidget(label, size, read.attacker === undefined ? undefined : sideOf(read.attacker, env.homeSide));
    // Wide, at the top of the ice in the middle; tall, just inside the top blue line, in the middle across.
    const at = surface.turned
      ? inside(pill, true, vb, (vb.x <= a.blueLine ? a.blueLine : vb.x) + pill.h / 2 + 3, vb.y + vb.h / 2)
      : inside(pill, false, vb, vb.x + vb.w / 2, vb.y + pill.h / 2 + 3);
    out.over += put(pill, ...at, surface.turned);
  }
  return out;
}

function drawBaseball(read: BaseballRead, surface: Surface): SituationDrawn {
  const a = surface.anchors?.kind === "baseball" ? surface.anchors : undefined;
  const out: SituationDrawn = { under: "", over: "", defs: "" };
  if (a === undefined) return out;
  // The occupied bases, lit larger than they are drawn so that they read from a distance.
  if (read.bases !== undefined) {
    const k = a.half * 2.6;
    read.bases.forEach((on, i) => {
      if (!on) return;
      const [u, v] = a.bases[i];
      out.over += el("path", { class: "ky-sit-lit", d: `M${num(u)} ${num(v - k)}L${num(u + k)} ${num(v)}L${num(u)} ${num(v + k)}L${num(u - k)} ${num(v)}Z` });
    });
  }
  // The scorebug at the foot of the field, behind home plate, held inside what is shown.
  const view = wideView(surface);
  const bug = { bases: read.bases, outs: read.outs, inning: read.inning, half: read.half, balls: read.balls, strikes: read.strikes };
  if (Object.values(bug).some((value) => value !== undefined)) {
    let u = Math.min(11, view.h * 0.2, view.w * 0.1);
    let widget = scorebugWidget(bug, u, true);
    // A drawing cut very small gets a bug that fits it.
    if (widget.w > view.w * 0.9) {
      u *= (view.w * 0.9) / widget.w;
      widget = scorebugWidget(bug, u, true);
    }
    out.over += put(widget, within(0, view.x + widget.w / 2 + 1, view.x + view.w - widget.w / 2 - 1), view.y + view.h - widget.h / 2 - 3, false);
  }
  return out;
}

function drawFootball(read: FootballRead, surface: Surface, env: SituationEnv): SituationDrawn {
  const a = surface.anchors?.kind === "football" ? surface.anchors : undefined;
  const out: SituationDrawn = { under: "", over: "", defs: "" };
  if (a === undefined) return out;
  const e = a.endZone;
  const G = a.length;
  const W = a.width;
  const dir = read.toward === "right" ? 1 : -1;
  // A distance in yards from a team's own goal line, as a place along the field, for a team heading for `toward`.
  const at = (yards: number, toward: "left" | "right"): number => (toward === "right" ? e + yards * 3 : e + G - yards * 3);
  const vb: View = surface.box ?? { x: 0, y: 0, w: G + 2 * e, h: W };
  // The red zone: the last 20 yards before the goal line the offence is attacking.
  if (read.redZone) {
    const goal = read.toward === "right" ? e + G : e;
    out.under = el("rect", { class: "ky-sit-red", x: Math.min(goal, goal - dir * 60), y: 0, width: 60, height: W });
  }
  let x: number | undefined;
  if (read.ballOn !== undefined) {
    x = at(read.ballOn, read.toward);
    out.over += el("path", { class: "ky-sit-los-halo", d: `M${num(x)} 0V${num(W)}`, fill: "none" });
    // The first-down line, ten yards on or where the options put it, unless the goal line is nearer.
    if (typeof read.toGo === "number" && read.ballOn + read.toGo < read.yards) {
      const fd = at(read.ballOn + read.toGo, read.toward);
      out.over += el("path", { class: "ky-sit-fd-halo", d: `M${num(fd)} 0V${num(W)}`, fill: "none" });
      out.over += el("path", { class: "ky-sit-fd", d: `M${num(fd)} 0V${num(W)}`, fill: "none" });
    }
    out.over += el("path", { class: "ky-sit-los", d: `M${num(x)} 0V${num(W)}`, fill: "none" });
  }
  // The drive chart: an arrow for each drive, in a lane of its own across the field.
  const n = read.drive.length;
  if (n > 0) {
    // The lanes lie across the field; the score's panel stands over the middle of it, so they go in the band below it.
    const y0 = env.plate ? surface.plate.cy + surface.plate.h / 2 + 3 : 10;
    const y1 = env.plate ? W - 6 : W - 10;
    const step = Math.min(10, Math.max(2.4, (y1 - y0) / n));
    const top = y0 + (y1 - y0 - step * n) / 2;
    read.drive.forEach((leg, i) => {
      const y = top + step * (i + 0.5);
      const x0 = at(leg.from, leg.toward);
      const x1 = at(leg.to, leg.toward);
      const d = Math.sign(x1 - x0) || (leg.toward === "right" ? 1 : -1);
      const head = Math.min(3.4, Math.abs(x1 - x0));
      const cls = `ky-sit-d-${leg.result ?? "none"}`;
      out.over += el("path", { class: `ky-sit-dr-halo`, d: `M${num(x0)} ${num(y)}H${num(x1 - d * head * 0.6)}`, fill: "none" });
      out.over += el("path", { class: `ky-sit-dr ${cls}`, d: `M${num(x0)} ${num(y)}H${num(x1 - d * head * 0.6)}`, fill: "none" });
      out.over += el("circle", { class: `ky-sit-dot-s ${cls}`, cx: x0, cy: y, r: 1.2 });
      if (head > 0.5) out.over += el("path", { class: `ky-sit-dh ${cls}`, d: `M${num(x1)} ${num(y)}L${num(x1 - d * head)} ${num(y - head * 0.62)}V${num(y + head * 0.62)}Z` });
      if (leg.result !== undefined) out.over += textOn(surface.turned, x1 + d * 1.8, y + 3.6 * 0.36, DRIVE_CODES[leg.result], { size: 3.6, anchor: d > 0 ? "start" : "end", cls: "ky-sit-dl", weight: 800 });
    });
  }
  // The tag: the down and distance, with the yard line, behind the line of scrimmage near the far sideline.
  const main = downTag(read, env.language);
  const where = read.ballOn === undefined ? undefined : yardLineText(read.ballOn, read.yards, env.language);
  if (main !== undefined || where !== undefined) {
    const tag = tagWidget(main ?? where ?? "", main === undefined ? undefined : where, 5.6, headAngle(read.toward, surface.turned));
    const along = (surface.turned ? tag.h : tag.w) / 2;
    const across = (surface.turned ? tag.w : tag.h) / 2;
    const cy = vb.y + across + 5;
    // Behind the line of scrimmage, 4 feet off it; nudged along the field, to the line first and then away from it, until it covers none of the yard numbers and the arrows beside them that point to a goal line.
    // Where there is no such room it keeps off the arrows at least.
    const clear = (cx: number, hide: readonly (readonly [number, number, number, number])[]): boolean => {
      const [px, py] = inside(tag, surface.turned, vb, cx, cy);
      return !hide.some(([ox, oy, hx, hy]) => Math.abs(ox - px) < along + hx + 0.8 && Math.abs(oy - py) < across + hy + 0.8);
    };
    const gaps = [4, 3, 2, 1, 0.5, ...Array.from({ length: 36 }, (_, i) => 5 + i)];
    const gap = x === undefined ? undefined : (gaps.find((g) => clear(x - dir * (along + g), [...a.arrows, ...a.numerals])) ?? gaps.find((g) => clear(x - dir * (along + g), a.arrows)) ?? 4);
    const beside = x === undefined || gap === undefined ? vb.x + vb.w / 2 : x - dir * (along + gap);
    out.over += put(tag, ...inside(tag, surface.turned, vb, beside, cy), surface.turned);
  }
  return out;
}

/** A situation drawn on a surface, or `undefined` when nothing is to be drawn. */
export function drawSituation(read: SituationRead, surface: Surface, env: SituationEnv): SituationDrawn | undefined {
  const drawn = read.kind === "hockey" ? drawHockey(read, surface, env) : read.kind === "baseball" ? drawBaseball(read, surface) : drawFootball(read, surface, env);
  return drawn.under === "" && drawn.over === "" ? undefined : drawn;
}

/** The widest a badge's middle holds, in the badge's units. */
const BADGE_ROOM = 74;

/**
 * A situation as the badge (and the compact card's strip) shows it in place of the picture of the surface: the markup centred on the origin of a box 76 wide, and `undefined` when there is
 * nothing to show. Hockey's pill, baseball's scorebug and football's tag, each shrunk to fit.
 */
export function badgeSituation(read: SituationRead, language: Language): string | undefined {
  let widget: Widget | undefined;
  if (read.kind === "hockey") {
    const label = hockeyPill(read, language);
    widget = label === undefined ? undefined : pillWidget(label, 9);
  } else if (read.kind === "baseball") {
    const bug = { bases: read.bases, outs: read.outs, inning: read.inning, half: read.half, balls: read.balls, strikes: read.strikes };
    widget = Object.values(bug).some((value) => value !== undefined) ? scorebugWidget(bug, 8.4, false) : undefined;
  } else {
    const main = downTag(read, language);
    const where = read.ballOn === undefined ? undefined : yardLineText(read.ballOn, read.yards, language);
    widget = main === undefined && where === undefined ? undefined : tagWidget(main ?? where ?? "", main === undefined ? undefined : where, 8.2);
  }
  if (widget === undefined) return undefined;
  const k = Math.min(1, BADGE_ROOM / widget.w);
  return k === 1 ? widget.markup : el("g", { transform: `scale(${k.toFixed(3)})` }, widget.markup);
}
