// The road chart, drawn: the two finalists' big round marks with their names, the round names down the middle on a dotted road, each finalist's matches on its side as
// the round marks of both teams with the score between them, and the group stage as a compact row at the foot. Each size has its own arrangement: `card`, `square` and
// `phone` stack the finalists over the rounds; `wide` puts them at the two ends. Nothing is measured in a browser: type is set by estimates (`textWidth`).
import { safeColour } from "./colour.ts";
import { safeLogo } from "./logo.ts";
import { safeClass } from "./common.ts";
import { el, esc, num } from "./format.ts";
import { KYOGIJO_MARK_STYLE, roundMarkup } from "./mark.ts";
import { codeOf, decidedWords, nameOf, summaryOf, type MatchView, type Model } from "./road.model.ts";
import { KYOGIJO_ROAD_STYLE } from "./road.style.ts";
import type { RoadOptions, RoadSize, RoadSizeInfo } from "./road.types.ts";
import { capitals, fitLines, textWidth } from "./text.ts";
import type { Team } from "./types.ts";
import { VERSION } from "./version.ts";

/** The sizes in pixels: `card` 1080 by 1350, `square` 1080 by 1080, `wide` 1200 by 675 and `phone` 390 wide and as tall as the rounds need. */
export const ROAD_SIZES: Readonly<Record<RoadSize, RoadSizeInfo>> = Object.freeze({
  card: { width: 1080, height: 1350, about: "1080 by 1350, a tall post" },
  square: { width: 1080, height: 1080, about: "1080 by 1080, a square post" },
  wide: { width: 1200, height: 675, about: "1200 by 675, a wide card with the finalists at the two ends" },
  phone: { width: 390, height: undefined, about: "390 wide, as tall as the rounds need" },
});

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
type Anchor = "start" | "middle" | "end";
/** A text centred on `y`, `size` high. */
const text = (cls: string, x: number, y: number, size: number, content: string, anchor: Anchor = "middle"): string =>
  el("text", { class: cls, x: num(x), y: num(y + size * 0.36), "font-size": num(size), "text-anchor": anchor }, esc(content));

/** The width of a match's score block in ems of its number size: the two numbers and the dash. */
const scoreEms = (v: MatchView): number => (v.whole !== undefined ? textWidth(v.whole) : textWidth(v.mine) + textWidth(v.theirs) + 1.1);

interface Lane {
  x0: number;
  x1: number;
}

/** The group stage's score as one text. */
const sub0 = (v: MatchView): boolean => v.note !== undefined ? v.note !== "" : v.says;
const groupScore = (v: MatchView): string => v.whole ?? `${v.mine}–${v.theirs}`;

/** Draw the chart as an SVG string. `gid` is the prefix of its ids. */
export function drawRoad(model: Model, o: RoadOptions, gid: string): string {
  const size: RoadSize = o.size !== undefined && Object.prototype.hasOwnProperty.call(ROAD_SIZES, o.size) ? o.size : "card";
  const info = ROAD_SIZES[size];
  const w = model.words.road;
  const W = info.width;
  const phone = size === "phone";
  const wide = size === "wide";
  const [fa, fb] = model.finalists;
  const rounds = [...model.rounds].reverse();
  const R = rounds.length;
  const nGroup = Math.max(model.group[0].length, model.group[1].length);
  const emphasis = o.winner !== "none";
  const codes = o.codes !== false;
  const theme = o.theme === "light" || o.theme === "dark" ? o.theme : undefined;
  let marks = 0;

  const markOf = (team: Team, cx: number, cy: number, r: number, cls: string): string =>
    roundMarkup({
      id: `${gid}-m${marks++}`,
      cx,
      cy,
      r,
      href: safeLogo(team.logo, { color: team.color, accent: team.textColor, initials: codeOf(team).slice(0, 3), theme }),
      fit: team.markFit === "contain" ? "contain" : undefined,
      initials: codeOf(team).slice(0, 3),
      color: safeColour(team.color),
      ink: safeColour(team.textColor),
      title: team.name,
      className: cls,
    });

  // ---- The type and the room round the edge. ----
  const tall = info.height ?? 1e9;
  const pad = phone ? 16 : Math.round(Math.min(W * 0.045, tall * 0.05));
  const ts = clamp(Math.min(W * 0.044, tall * 0.056), 17, 48);
  const es = clamp(Math.min(W * 0.0185, tall * 0.022), 9, 20);
  const room = W - 2 * pad;
  const titleFit = fitLines(model.title, room * 0.94, ts * 2.3, ts);
  const subSize = model.subtitle === undefined ? 0 : Math.min(ts * 0.5, (room * 0.94) / Math.max(1, textWidth(model.subtitle)));
  const headH = titleFit.height + (model.subtitle === undefined ? 0 : subSize * 1.5) + ts * 0.45;
  const note = o.endnote === undefined ? "" : String(o.endnote).trim();
  const endSize = note === "" ? 0 : Math.min(es, room / Math.max(1, textWidth(note, false)));
  const footH = endSize === 0 ? 0 : endSize * 2.4;

  // ---- The columns: the middle one holds the rounds' names; a wide chart has a column for each finalist at its end. ----
  const cl = phone ? 70 : wide ? W * 0.12 : W * 0.175;
  const fc = wide ? W * 0.17 : 0;
  const sideW = (W - 2 * pad - cl - 2 * fc) / 2;
  const lanes: [Lane, Lane] = [
    { x0: pad + fc, x1: pad + fc + sideW },
    { x0: W - pad - fc - sideW, x1: W - pad - fc },
  ];
  const cx = W / 2;

  // ---- The group stage: how many marks in a row, and how large. ----
  const maxCols = Math.max(1, Math.floor(sideW / (phone ? 46 : W * 0.062)));
  const cols = nGroup === 0 ? 1 : Math.min(maxCols, nGroup <= 4 ? nGroup : Math.ceil(nGroup / 2));
  const groupRows = nGroup === 0 ? 0 : Math.ceil(nGroup / cols);
  const cw = sideW / cols;
  const dm = Math.min(cw * 0.56, phone ? 36 : Math.min(W * 0.052, tall * 0.065));
  const cellH = dm * 2.08;
  const groupBlock = nGroup === 0 ? 0 : groupRows * cellH + (groupRows - 1) * dm * 0.2 + (phone ? 26 : dm * 0.1);

  // ---- The big marks, the rows and the vertical room. ----
  const rowLabelH = phone ? 22 : 0;
  let H = info.height ?? 0;
  let D = wide ? Math.min(fc * 0.8, H * 0.36) : Math.min(sideW * 0.68, (info.height ?? 1e9) * 0.19);
  const names = (d: number): ReturnType<typeof fitLines>[] => [fa, fb].map((t) => fitLines(capitals(t.name), (wide ? fc : sideW) * 0.96, d * 0.17 * 2.3, d * 0.17));
  const slots = wide ? R + 1 : R;
  const minRow = W * 0.085;
  let rowH = phone ? 76 : 0;
  let bandH = 0;
  let regionTop = 0;
  let regionBottom = 0;
  const gapS = phone ? 14 : (info.height ?? 1000) * 0.016;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    bandH = D + D * 0.08 + Math.max(...names(D).map((n) => n.height));
    if (phone) {
      regionTop = pad + headH + bandH + gapS;
      regionBottom = regionTop + R * (rowH + rowLabelH);
      H = regionBottom + (nGroup > 0 ? gapS + groupBlock : 0) + footH + pad;
      break;
    }
    regionTop = pad + headH + (wide ? 0 : bandH + gapS);
    regionBottom = H - pad - footH - (nGroup > 0 ? groupBlock + gapS : 0);
    rowH = slots > 0 ? (regionBottom - regionTop) / slots : 0;
    if (wide || rowH >= minRow || D < sideW * 0.25) break;
    D *= 0.86;
  }
  rowH = Math.min(rowH, W * 0.2);

  // ---- The pieces of a row: the marks, the numbers, the gaps. ----
  const subRatio = 0.42;
  let ns = rowH * 0.34;
  let d = rowH * 0.58;
  let ems = 2.2;
  for (const key of rounds) {
    for (const i of [0, 1] as const) {
      const v = model.path[i].get(key);
      if (v !== undefined) ems = Math.max(ems, scoreEms(v), textWidth(decidedWords(v, w, true), false) * subRatio);
    }
  }
  const fit = Math.min(1, (sideW * 0.97) / (2 * d + 2 * d * 0.14 + ems * ns));
  ns *= fit;
  d *= fit;
  const pair = 2 * d + 2 * d * 0.14 + ems * ns;

  // The top of a row, the first being the last round. A wide chart's first slot is the final.
  const rowTop = (i: number): number => {
    if (phone) return regionTop + i * (rowH + rowLabelH) + rowLabelH;
    return regionTop + (regionBottom - regionTop - slots * rowH) / 2 + (wide ? i + 1 : i) * rowH;
  };
  const dimOf = (result: string, forFinalist: boolean): string => (emphasis && ((forFinalist && result === "loss") || (!forFinalist && result === "win")) ? " ky-r-dim" : "");

  // The round's name: a panel in the middle column, or a line over the row on a phone.
  const panel = (words: string, yc: number, height: number, width: number): string => {
    const fitted = fitLines(words, width * 0.88, height * 0.74, height * 0.54);
    const lines = fitted.lines.map((line, i) => text("ky-r-lab", cx, yc + (i - (fitted.lines.length - 1) / 2) * fitted.size * 1.1, fitted.size, line));
    return el("rect", { class: "ky-r-panel", x: num(cx - width / 2), y: num(yc - height / 2), width: num(width), height: num(height), rx: num(height / 2) }) + lines.join("");
  };
  const label = (key: string, yc: number): string => {
    const words = model.label(key);
    if (!phone) return panel(words, yc, Math.min(rowH * 0.34, cl * 0.2), cl * 0.94);
    const y = yc - rowH / 2 - rowLabelH / 2;
    const width = textWidth(words) * 11.5 + 20;
    return el("rect", { class: "ky-r-panel", x: num(cx - width / 2), y: num(y - 9), width: num(width), height: 18, rx: 9 }) + text("ky-r-lab", cx, y, 11.5, words);
  };

  // One finalist's match in a row: the two marks and the score between them.
  const matchMarkup = (lane: Lane, side: 0 | 1, yc: number, v: MatchView): string => {
    const left = v.homeFirst !== undefined ? v.homeFirst : side === 0;
    const xc = (lane.x0 + lane.x1) / 2;
    const y = yc - rowH * 0.04;
    const lx = xc - pair / 2 + d / 2;
    const rx = xc + pair / 2 - d / 2;
    let out = markOf(model.finalists[side], left ? lx : rx, y, d / 2, `${side === 0 ? "ky-r-left" : "ky-r-right"}${dimOf(v.result, true)}`);
    out += markOf(v.opponent, left ? rx : lx, y, d / 2, `ky-r-plain${dimOf(v.result, false)}`);
    if (codes) out += text(`ky-r-code${dimOf(v.result, false)}`, left ? rx : lx, y + d / 2 + d * 0.2, d * 0.2, codeOf(v.opponent));
    out += scoreMarkup(v, xc, y, ns, left);
    const sub = decidedWords(v, w, left);
    return sub === "" ? out : out + text("ky-r-sub", xc, y + ns * 0.82, ns * subRatio, sub);
  };
  // The score: the two numbers either side of a dash, the loser's quiet. The first side's number is on the left when `left`.
  const scoreMarkup = (v: MatchView, x: number, y: number, n: number, left: boolean): string => {
    if (v.whole !== undefined) return text("ky-r-n", x, y, n * 0.9, v.whole);
    const [a, b, lowA, lowB] = left ? [v.mine, v.theirs, v.result === "loss", v.result === "win"] : [v.theirs, v.mine, v.result === "win", v.result === "loss"];
    return (
      text(`ky-r-n${emphasis && lowA ? " ky-r-low" : ""}`, x - n * 0.4, y, n, a, "end") +
      text("ky-r-dash", x, y, n * 0.8, "–") +
      text(`ky-r-n${emphasis && lowB ? " ky-r-low" : ""}`, x + n * 0.4, y, n, b, "start")
    );
  };

  let body = "";
  for (const [i, key] of rounds.entries()) {
    const yc = rowTop(i) + rowH / 2;
    body += label(key, yc);
    for (const side of [0, 1] as const) {
      const v = model.path[side].get(key);
      if (v !== undefined) body += matchMarkup(lanes[side], side, yc, v);
    }
  }

  // ---- The finalists. ----
  const final = model.final;
  const lost = (side: 0 | 1): boolean => emphasis && final !== undefined && (side === 0 ? final.result === "loss" : final.result === "win");
  const named = names(D);
  const flagX: [number, number] = wide ? [pad + fc / 2, W - pad - fc / 2] : [(lanes[0].x0 + lanes[0].x1) / 2, (lanes[1].x0 + lanes[1].x1) / 2];
  const flagY = wide ? (regionTop + regionBottom) / 2 - (D * 0.08 + Math.max(...named.map((n) => n.height))) / 2 : pad + headH + (phone ? 0 : (info.height ?? 1000) * 0.008) + D / 2;
  let band = "";
  for (const side of [0, 1] as const) {
    const dim = lost(side) ? " ky-r-dim" : "";
    band += markOf(model.finalists[side], flagX[side], flagY, D / 2, `${side === 0 ? "ky-r-left" : "ky-r-right"}${dim}`);
    const nb = named[side];
    const top = flagY + D / 2 + D * 0.08;
    band += nb.lines.map((line, k) => text(`ky-r-name${dim}`, flagX[side], top + nb.size * 0.55 + k * nb.size * 1.1, nb.size, line)).join("");
  }

  // The final between them: its name over its score, or "v" when it is not played.
  const fy = wide ? rowTop(-1) + rowH / 2 : flagY;
  const labelSize = clamp(cl * 0.13, 9, 26);
  const fs = wide ? Math.min(clamp(cl * 0.27, 14, 58), rowH * 0.36) : clamp(cl * 0.27, 14, 58);
  let middle = text("ky-r-sub", cx, fy - (wide ? fs * 0.95 : Math.min(D * 0.3, cl * 0.34)), labelSize, model.label("final"));
  if (final === undefined) middle += text("ky-r-vs", cx, fy + labelSize * 0.2, fs * 0.9, w.vs);
  else {
    middle += scoreMarkup(final, cx, fy, fs, true);
    const sub = decidedWords(final, w, true);
    if (sub !== "") middle += text("ky-r-sub", cx, fy + fs * 0.85, fs * 0.4, sub);
  }

  // ---- The road: a dotted line down the middle, behind the round names, from the final down to the group stage. ----
  const groupTop = phone ? regionBottom + gapS : H - pad - footH - groupBlock;
  const roadTop = wide ? fy + rowH * 0.42 : fy + (final === undefined ? labelSize * 1.6 : fs * (sub0(final) ? 1.5 : 1.0));
  const roadEnd = nGroup > 0 ? groupTop + (phone ? 0 : cellH / 2) : R > 0 ? rowTop(R - 1) + rowH / 2 : roadTop;
  const spine =
    R > 0 && roadEnd > roadTop
      ? el("path", { class: "ky-r-spine", d: `M${num(cx)} ${num(roadTop)}V${num(roadEnd)}`, "stroke-width": num(clamp(W * 0.004, 1.5, 4)), "stroke-dasharray": `0.1 ${num(clamp(W * 0.014, 5, 16))}`, fill: "none" })
      : "";

  // ---- The group stage: small round marks with their codes and scores. ----
  let groupMarkup = "";
  if (nGroup > 0) {
    const gy = groupTop + (phone ? 26 : 0);
    if (phone) {
      const width = textWidth(model.groupLabel) * 11.5 + 20;
      groupMarkup += el("rect", { class: "ky-r-panel", x: num(cx - width / 2), y: num(groupTop + 1), width: num(width), height: 18, rx: 9 }) + text("ky-r-lab", cx, groupTop + 10, 11.5, model.groupLabel);
    } else groupMarkup += panel(model.groupLabel, gy + cellH / 2, Math.min(cellH * 0.42, cl * 0.2), cl * 0.94);
    for (const side of [0, 1] as const) {
      const lane = lanes[side];
      model.group[side].forEach((v, k) => {
        const row = Math.floor(k / cols);
        const inRow = Math.min(cols, model.group[side].length - row * cols);
        const x = (lane.x0 + lane.x1) / 2 - (inRow * cw) / 2 + (k % cols) * cw + cw / 2;
        const y = gy + row * (cellH + dm * 0.2);
        const dim = dimOf(v.result, false);
        groupMarkup += markOf(v.opponent, x, y + dm / 2, dm / 2, `ky-r-plain${dim}`);
        if (codes) groupMarkup += text(`ky-r-code${dim}`, x, y + dm * 1.27, dm * 0.3, codeOf(v.opponent));
        groupMarkup += text(`ky-r-n${emphasis && v.result === "loss" ? " ky-r-low" : ""}`, x, y + dm * 1.78, dm * 0.44, groupScore(v));
      });
    }
  }

  // ---- The head and the foot. ----
  let head = titleFit.lines.map((line, k) => text("ky-r-t", cx, pad + titleFit.size * 0.55 + k * titleFit.size * 1.1, titleFit.size, line)).join("");
  if (model.subtitle !== undefined) head += text("ky-r-s", cx, pad + titleFit.height + subSize * 0.7, subSize, model.subtitle);
  const foot = endSize === 0 ? "" : text("ky-r-e", cx, H - pad - endSize * 0.2, endSize, note);

  const sheet = o.style === "none" ? "" : `${KYOGIJO_MARK_STYLE}\n${KYOGIJO_ROAD_STYLE}`;
  const extra = safeClass(o.className);
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      class: `kyogijo kyogijo-road${extra === "" ? "" : ` ${extra}`}`,
      viewBox: `0 0 ${num(W)} ${num(H)}`,
      role: "img",
      "aria-labelledby": `${gid}-t ${gid}-d`,
      "data-size": size,
      "data-theme": theme,
      "data-version": VERSION,
    },
    `<title id="${gid}-t">${esc(nameOf(model))}</title><desc id="${gid}-d">${esc(summaryOf(model))}</desc>` +
      (sheet === "" ? "" : `<style>${sheet}</style>`) +
      el("rect", { class: "ky-r-bg", x: 0, y: 0, width: num(W), height: num(H) }) +
      head +
      spine +
      band +
      middle +
      body +
      groupMarkup +
      foot,
  );
}
