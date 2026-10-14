// The pageant drawn: a carpet (a flag or logo laid flat, with a border band and a gentle fabric of light and shade) or a stage (a crest on a round disc with a ring) for each team, and the
// emblem on a disc in the centre. Every picture is drawn in the eye's frame (its group is turned back when the drawing lies tall), so a flag is always the right way up for a reader.
import { inkOn } from "./colour.ts";
import { el, esc, num } from "./format.ts";
import { roundMarkup } from "./mark.ts";
import type { Pageant, PageantLayout, PageantTeam, Placed } from "./pageant.ts";
import { LINE_HEIGHT, fitLines } from "./text.ts";

/** What a drawing gives the pageant to draw with. */
export interface PageantDraw {
  /** The prefix of the ids: unique in the drawing. */
  id: string;
  turned: boolean;
  /** Small, or `detail: "simple"`: no fabric, no hairlines, no name pills. */
  simple: boolean;
  parts: boolean;
}

/** The gold of a stage's ring, light to dark to light, as a gradient across the disc. */
const GOLD: readonly (readonly [number, string])[] = [[0, "#f7e6a6"], [0.3, "#d8ae4a"], [0.62, "#a67a1d"], [1, "#ecca6c"]];

const gradient = (id: string, x1: number, y1: number, x2: number, y2: number, stops: readonly (readonly [number, string, number?])[]): string =>
  el(
    "linearGradient",
    { id, gradientUnits: "userSpaceOnUse", x1: num(x1), y1: num(y1), x2: num(x2), y2: num(y2) },
    stops.map(([offset, colour, opacity]) => el("stop", { offset: num(offset), style: `stop-color:${colour}${opacity === undefined ? "" : `;stop-opacity:${num(opacity)}`}` })).join(""),
  );

/**
 * The fabric of a carpet: two gentle waves of light and of shade, as linear gradients across it at slightly different angles, fixed numbers and no random. They lie over the picture at
 * a few hundredths of opacity, so that a flag reads as cloth and its colours stay its own.
 */
function fabric(id: string, w: number, h: number): { defs: string; markup: (x: number, y: number, cw: number, ch: number) => string } {
  const light = [0, 0.1, 0, 0.07, 0, 0.1, 0, 0.06, 0];
  const shade = [0.07, 0, 0.09, 0, 0.06, 0, 0.09, 0, 0.05];
  const stops = (values: readonly number[], colour: string): [number, string, number][] => values.map((v, i): [number, string, number] => [i / (values.length - 1), colour, v]);
  const defs = gradient(`${id}-a`, -w / 2, -h * 0.28, w / 2, h * 0.28, stops(light, "#fff")) + gradient(`${id}-b`, -w * 0.46, h * 0.34, w * 0.5, -h * 0.3, stops(shade, "#000"));
  return { defs, markup: (x, y, cw, ch) => el("rect", { class: "ky-pg-fabric", x: num(x), y: num(y), width: num(cw), height: num(ch), fill: `url(#${id}-a)` }) + el("rect", { class: "ky-pg-fabric", x: num(x), y: num(y), width: num(cw), height: num(ch), fill: `url(#${id}-b)` }) };
}

/** The group a picture lies in: moved to its centre and turned back upright when the drawing lies tall. */
function standing(cx: number, cy: number, turned: boolean, classes: string, inner: string, o: PageantDraw, part: string | undefined, title: string | undefined, data: Record<string, string | undefined> = {}): string {
  return el(
    "g",
    { class: classes, transform: `translate(${num(cx)} ${num(cy)})${turned ? " rotate(-90)" : ""}`, part: o.parts ? part : undefined, "data-pg": "1", ...data },
    (title === undefined ? "" : `<title>${esc(title)}</title>`) + el("g", { class: "ky-pg-art" }, inner),
  );
}

const colourVars = (team: PageantTeam): string | undefined => {
  const parts = [team.color === undefined ? undefined : `--c:${team.color}`, team.ink === undefined && team.color === undefined ? undefined : `--ci:${team.ink ?? inkOn(team.color)}`].filter((part): part is string => part !== undefined);
  return parts.length === 0 ? undefined : parts.join(";");
};

/** A team's name on its picture, in a pill straddling the picture's lower edge. */
function pill(team: PageantTeam, w: number, h: number, bottom: number, simple: boolean): string {
  if (simple) return "";
  const ph = Math.max(h * 0.17, 0.2);
  const fit = fitLines(team.name, w * 0.78, ph * 0.62, ph * 0.46);
  const pw = Math.min(w * 0.92, fit.width + ph * 1.1);
  return el("g", { class: "ky-pg-label" }, el("rect", { class: "ky-pg-pill", x: num(-pw / 2), y: num(bottom - ph / 2), width: num(pw), height: num(ph), rx: num(ph / 2) }) + el("text", { class: "ky-text ky-pg-pilltext", x: 0, y: num(bottom + fit.size * 0.36), "font-size": num(fit.size) }, esc(fit.lines[0])));
}

/** The words of a team with no picture, on a band across its carpet: its name, or its letters when the name would be too small to read. */
function bandText(team: PageantTeam, w: number, bandH: number): string {
  const fit = fitLines(team.name, w * 0.88, bandH * 0.82, bandH * 0.6);
  const small = fit.size < bandH * 0.22;
  const lines = small ? [team.abbr] : fit.lines;
  const size = small ? Math.min(bandH * 0.6, (w * 0.8) / Math.max(1, [...team.abbr].length * 0.75)) : fit.size;
  const step = size * LINE_HEIGHT;
  return lines.map((row, i) => el("text", { class: "ky-text ky-pg-name", x: 0, y: num((i - (lines.length - 1) / 2) * step + size * 0.36), "font-size": num(size) }, esc(row))).join("");
}

/** A carpet: the border band, then the picture at its own ratio, then the fabric. */
function carpet(pl: Placed, p: Pageant, o: PageantDraw, names: boolean): { markup: string; defs: string; top?: string } {
  const { team, w, h } = pl;
  const b = Math.min(w, h) * p.borderWidth;
  const x = -w / 2 + b;
  const y = -h / 2 + b;
  const iw = w - 2 * b;
  const ih = h - 2 * b;
  const base = `${o.id}-pg-${pl.spot}`;
  let defs = el("clipPath", { id: `${base}-c` }, el("rect", { x: num(x), y: num(y), width: num(iw), height: num(ih) }));
  const borderFill = p.border === "dark" ? undefined : p.border === "team" ? team.color : p.border;
  let inner = "";
  const drop = Math.min(w, h) * 0.03;
  inner += el("rect", { class: "ky-pg-shadow", x: num(-w / 2 + drop * 0.6), y: num(-h / 2 + drop), width: num(w), height: num(h), rx: num(Math.min(w, h) * 0.012) });
  inner += el("rect", { class: "ky-pg-border", x: num(-w / 2), y: num(-h / 2), width: num(w), height: num(h), style: borderFill === undefined ? undefined : `fill:${borderFill}` });
  let picture = "";
  let top: string | undefined;
  if (team.href !== undefined && team.fit !== "contain") {
    picture += el("image", { class: "ky-logo ky-pg-picture", href: team.href, x: num(x), y: num(y), width: num(iw), height: num(ih), preserveAspectRatio: "xMidYMid slice" });
  } else if (team.href !== undefined) {
    const pad = Math.min(iw, ih) * 0.1;
    picture += el("rect", { class: "ky-pg-plain", x: num(x), y: num(y), width: num(iw), height: num(ih), style: colourVars(team)?.split(";")[0] });
    picture += el("image", { class: "ky-logo ky-pg-picture", href: team.href, x: num(x + pad), y: num(y + pad), width: num(iw - 2 * pad), height: num(ih - 2 * pad), preserveAspectRatio: "xMidYMid meet" });
  } else {
    // No flag or logo: the team's colours as a carpet of two, with its name across a band.
    const band = ih * 0.38;
    picture += el("rect", { class: "ky-pg-ground", x: num(x), y: num(y), width: num(iw), height: num(ih), style: colourVars(team) });
    picture += el("rect", { class: "ky-pg-band", x: num(x), y: num(-band / 2), width: num(iw), height: num(band), style: colourVars(team) });
    // The name is written over the surface's lines, whichever way they lie, so that a crease or a net does not cross it.
    if (p.names !== false) top = el("g", { style: colourVars(team) }, bandText(team, iw, band));
  }
  inner += el("g", { "clip-path": `url(#${base}-c)` }, picture);
  if (p.fabric && !o.simple) {
    const f = fabric(`${base}-f`, iw, ih);
    defs += f.defs;
    inner += el("g", { "clip-path": `url(#${base}-c)` }, f.markup(x, y, iw, ih));
  }
  if (!o.simple) {
    inner += el("rect", { class: "ky-pg-seam", x: num(x), y: num(y), width: num(iw), height: num(ih), "stroke-width": num(Math.max(Math.min(w, h) * 0.006, 0.08)) });
    inner += el("rect", { class: "ky-pg-edge", x: num(-w / 2), y: num(-h / 2), width: num(w), height: num(h), "stroke-width": num(Math.max(Math.min(w, h) * 0.005, 0.06)) });
  }
  if (names && team.href !== undefined) inner += pill(team, w, h, h / 2, o.simple);
  return { markup: inner, defs, top };
}

/** A stage: the ring (gold, the team's colour or a colour of the caller's), a dark disc, and the crest in a circle on it. */
function stage(pl: Placed, p: Pageant, o: PageantDraw, names: boolean): { markup: string; defs: string } {
  const { team } = pl;
  const R = pl.r ?? pl.w / 2;
  const base = `${o.id}-pg-${pl.spot}`;
  let defs = "";
  let ringFill: string;
  if (p.ring === "gold") {
    defs += gradient(`${base}-g`, -R, -R, R, R, GOLD.map(([offset, colour]) => [offset, colour]));
    ringFill = `url(#${base}-g)`;
  } else ringFill = p.ring === "team" ? (team.color ?? "#c9a24a") : p.ring;
  let inner = "";
  inner += el("circle", { class: "ky-pg-shadow", cx: num(R * 0.03), cy: num(R * 0.06), r: num(R) });
  inner += el("circle", { class: "ky-pg-ringband", cx: 0, cy: 0, r: num(R), fill: ringFill });
  if (!o.simple) inner += el("circle", { class: "ky-pg-groove", cx: 0, cy: 0, r: num(R * 0.925), "stroke-width": num(Math.max(R * 0.012, 0.06)) });
  inner += el("circle", { class: "ky-pg-disc", cx: 0, cy: 0, r: num(R * 0.9) });
  inner += roundMarkup({ id: base, cx: 0, cy: 0, r: R * 0.8, href: team.href, fit: team.fit, initials: team.abbr, color: team.color, ink: team.ink, ring: Math.max(R * 0.025, 0.08) });
  if (!o.simple) inner += el("circle", { class: "ky-pg-edge", cx: 0, cy: 0, r: num(R), "stroke-width": num(Math.max(R * 0.006, 0.05)) });
  if (names) inner += pill(team, 2 * R, 2 * R, R * 0.98, o.simple);
  return { markup: inner, defs };
}

/** The motion classes of a picture: its entrance, and the way a carpet rolls out. */
const motion = (p: Pageant, kind: string, tall: boolean): string => (p.animate === "none" ? "" : ` ky-pg-${p.animate}${kind === "carpet" && tall ? " ky-pg-tall" : ""}`);

/** The pictures of a pageant: each team's carpet or stage, drawn in its place. Under the surface's lines (`lines: "over"`) or over them (`"under"`). */
export function picturesMarkup(layout: PageantLayout, p: Pageant, o: PageantDraw): { markup: string; defs: string; names: string } {
  let markup = "";
  let defs = "";
  let tops = "";
  for (const placed of layout.pictures) {
    const { team } = placed;
    // Only a team with no flag or logo has its name on its picture, unless the options ask for names.
    const names = p.names ?? false;
    const made: { markup: string; defs: string; top?: string } = p.style === "stage" ? stage(placed, p, o, names) : carpet(placed, p, o, names);
    defs += made.defs;
    const classes = `ky-pg ky-pg-${p.style} ky-pg-${placed.spot}${motion(p, p.style, o.turned)}`;
    markup += standing(placed.cx, placed.cy, o.turned, classes, made.markup, o, `pageant ${team.role}`, team.name, { "data-team": team.role, "data-state": team.state });
    if (made.top !== undefined) tops += standing(placed.cx, placed.cy, o.turned, `ky-pg ky-pg-words ky-pg-${placed.spot}${motion(p, p.style, o.turned)}`, made.top, o, undefined, undefined, { "data-team": team.role });
  }
  return { markup: `<g class="ky-pageant"${p.lines === "through" ? ' opacity=".9"' : ""}>${markup}</g>`, defs, names: tops };
}

/** The emblem: a competition's picture or a trophy on a disc with a ring in the centre circle, or as it is for a cut-out. */
export function emblemMarkup(layout: PageantLayout, p: Pageant, o: PageantDraw): { markup: string; defs: string } {
  const place = layout.emblem;
  const emblem = p.emblem;
  if (place === undefined || emblem === undefined) return { markup: "", defs: "" };
  const R = place.r;
  const base = `${o.id}-pg-emblem`;
  let defs = "";
  let inner: string;
  if (emblem.shape === "plain") {
    inner = el("ellipse", { class: "ky-pg-shadow", cx: 0, cy: num(R * 0.78), rx: num(R * 0.62), ry: num(R * 0.13) }) + el("image", { class: "ky-logo ky-pg-emblem-image", href: emblem.href, x: num(-R * 1.05), y: num(-R * 1.05), width: num(R * 2.1), height: num(R * 2.1), preserveAspectRatio: "xMidYMid meet" });
  } else {
    defs += gradient(`${base}-g`, -R, -R, R, R, GOLD.map(([offset, colour]) => [offset, colour]));
    inner = el("circle", { class: "ky-pg-shadow", cx: num(R * 0.03), cy: num(R * 0.06), r: num(R) });
    inner += el("circle", { class: "ky-pg-ringband", cx: 0, cy: 0, r: num(R), fill: `url(#${base}-g)` });
    inner += el("circle", { class: "ky-pg-light", cx: 0, cy: 0, r: num(R * 0.9) });
    inner += roundMarkup({ id: base, cx: 0, cy: 0, r: R * 0.82, href: emblem.href, fit: emblem.fit, ring: Math.max(R * 0.02, 0.06) });
    if (!o.simple) inner += el("circle", { class: "ky-pg-edge", cx: 0, cy: 0, r: num(R), "stroke-width": num(Math.max(R * 0.006, 0.05)) });
  }
  return { markup: standing(place.cx, place.cy, o.turned, `ky-pg ky-pg-emblem${p.animate === "none" ? "" : ` ky-pg-${p.animate}`}`, inner, o, "emblem", emblem.name), defs };
}
