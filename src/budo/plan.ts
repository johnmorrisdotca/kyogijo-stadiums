// What a budō surface is for a set of options: a judo or karate competition area, a kendo shiai-jo, a sumo dohyō, a kyūdōjō or a dojo, with where each can be cropped to and the names of its parts, as plain
// data in metres (the origin the top left of the playing surface, x along it, y down the page). Kept apart from the drawing so that the outline, the description, the ranges, the tests and the drawing agree:
// a test reads a figure from the plan, not from the markup. Nothing here draws.
import type { Area, Shape } from "../fields.types.ts";
import { chooseLeague } from "../leagues.ts";
import { BUDO_LEAGUES, DOJO_LEAGUES, JUDO_LEAGUES, KARATE_LEAGUES, KENDO_LEAGUES, KYUDO_LEAGUES, SUMO_LEAGUES, type BudoFigures, type BudoLeague, type JudoFigures, type KarateFigures } from "../leagues/budo.ts";
import { MMA_LEAGUES, type MmaFigures } from "../leagues/combat.ts";
import type { SurfaceOptions } from "../types.ts";
import { dojoLayout, dojoLeague, dojoSpecOf, type DojoLayout } from "./dojo.ts";
import { contestOf, gridOf, judoParts, matOf, safetyOf, snapTo, type JudoLayout } from "./judo.ts";
import { karateParts, type KarateLayout } from "./karate.ts";
import { kendoParts, kendoSide, type KendoLayout } from "./kendo.ts";
import { kyudoParts, shootersOf, type KyudoLayout } from "./kyudo.ts";
import { boxD } from "./kit.ts";
import { cageHeight, cageParts, cageWidth, fenceHeight, type CageLayout } from "./cage.ts";
import { emptyParts, grow, union, type MBox, type MMark, type MRange } from "./parts.ts";
import { dohyoHeight, sumoParts, type SumoLayout } from "./sumo.ts";
import { lookOf } from "./looks.ts";
import type { BudoKind, BudoStyle, CombatKind } from "./types.ts";

export type { MBox, MMark, MRange };

/** The apothem of the Nippon Budokan's arena, an octagon 55 m across the flats (the Budokan's leaflet). */
export const BUDOKAN_ARENA = 27.5;

/** What a budō drawing is. */
export interface BudoPlan {
  sport: BudoKind;
  league: string;
  figures: BudoFigures;
  /** The look (the colours of the mats and the floor). */
  look: string;
  /** The mats are drawn with the weave of rice straw. */
  texture: boolean;
  /** The playing surface: the mats of a competition area, the shiai-jo's floor, the dohyō's clay, the whole range of a kyūdōjō, a dojo's floor. The data frame's own box. */
  box: MBox;
  /** Everything drawn: the box and what lies beyond it (the free zone, the furniture). */
  extent: MBox;
  areas: Area[];
  shapes: Shape[];
  /** The width the ordinary line is painted at by the rules, and the width it is drawn at unless `exactLines` says otherwise. */
  lineWidth: number;
  drawnLine: number;
  ranges: Readonly<Record<string, MRange>>;
  marks: MMark[];
  /** The arena floor under the surface, for the Nippon Budokan. */
  hall: "budokan" | undefined;
  /** The centre of the surface and the radius of the circle a pageant's emblem lies in, in metres. */
  centre: { x: number; y: number; r: number };
  /** The layout of the sport: one of these is set. */
  judo?: JudoLayout;
  karate?: KarateLayout;
  kendo?: KendoLayout;
  sumo?: SumoLayout;
  kyudo?: KyudoLayout;
  dojo?: DojoLayout;
  mma?: CageLayout;
}

const isBudoLeague = (l: unknown): l is BudoLeague => typeof l === "object" && l !== null && BUDO_LEAGUES.includes(l as BudoLeague);

/** The sports of the budō family. */
export const BUDO_SPORTS: readonly BudoKind[] = Object.freeze(["judo", "karate", "kendo", "sumo", "kyudo", "dojo"]);

/** True for a sport of the budō family. */
export const isBudoSport = (sport: string): sport is Exclude<BudoKind, CombatKind> => (BUDO_SPORTS as readonly string[]).includes(sport);

/** The combat sports the engine of the budō also draws: the MMA cage. */
export const COMBAT_SPORTS: readonly CombatKind[] = Object.freeze(["mma"]);

/** True for a combat sport (the MMA cage). */
export const isCombatSport = (sport: string): sport is CombatKind => (COMBAT_SPORTS as readonly string[]).includes(sport);

/** True for a sport this engine draws: a sport of the budō or a combat sport. */
export const isMatSport = (sport: string): sport is BudoKind => isBudoSport(sport) || isCombatSport(sport);

const OWN = { judo: JUDO_LEAGUES, karate: KARATE_LEAGUES, kendo: KENDO_LEAGUES, sumo: SUMO_LEAGUES, kyudo: KYUDO_LEAGUES, dojo: DOJO_LEAGUES, mma: MMA_LEAGUES } as const;

/** What `budo.style` asks of a judo area: true for a kata area, false for a contest area, undefined for neither said. @throws TypeError for a value that is not `shiai` or `kata`. */
function kataOf(style: unknown): boolean | undefined {
  if (style === undefined) return undefined;
  if (style !== "shiai" && style !== "kata") throw new TypeError(`budo.style is "shiai" or "kata"`);
  return style === "kata";
}

/** The league a set of options asks for: a rulebook's, else the sport's own. */
export function budoLeague(o: Pick<SurfaceOptions, "sport" | "league" | "budo" | "dojo">): BudoLeague {
  const sport = o.sport as BudoKind;
  // `budo.range` names a kyūdōjō's kind, and `dojo.standard` a dojo's mats, where `league` does not.
  const kata = sport === "judo" ? kataOf(o.budo?.style) : undefined;
  if (kata !== undefined && o.league !== undefined && o.league !== "" && (o.league === "ijf-kata") !== kata) throw new Error(`budo.style "${kata ? "kata" : "shiai"}" does not go with league "${o.league}": a kata area is the league "ijf-kata"`);
  const asked = o.league === undefined || o.league === "" ? (sport === "kyudo" ? o.budo?.range : sport === "dojo" ? dojoSpecOf(o.dojo).standard : kata ? "ijf-kata" : undefined) : o.league;
  if (asked !== undefined && asked !== "") {
    const found = (OWN[sport] as readonly BudoLeague[]).find((l) => l.id === asked);
    if (found === undefined) throw new Error(`Unknown league "${String(asked)}" for "${sport}": use one of ${OWN[sport].map((l) => l.id).join(", ")}`);
    return found;
  }
  const chosen = chooseLeague({ sport: o.sport, league: o.league }).league;
  return isBudoLeague(chosen) ? chosen : OWN[sport][0];
}

/** The width a line is drawn at unless the drawing is at true widths: a little under two thousandths of the surface, so that a line stays in sight in a drawing that holds the whole of it. */
const drawn = (box: MBox): number => Math.max(0.05, Math.round((box.x1 - box.x0) * 0.0018 * 100) / 100);

const halves = (b: MBox): MRange => ({ left: { x0: b.x0, y0: b.y0, x1: (b.x0 + b.x1) / 2, y1: b.y1 }, right: { x0: (b.x0 + b.x1) / 2, y0: b.y0, x1: b.x1, y1: b.y1 } });

/** The octagon of the Budokan's arena as a path, centred on (cx, cy). */
export function octagonD(cx: number, cy: number, a: number): string {
  const s = a * Math.tan(Math.PI / 8);
  const pts = [[cx - s, cy - a], [cx + s, cy - a], [cx + a, cy - s], [cx + a, cy + s], [cx + s, cy + a], [cx - s, cy + a], [cx - a, cy + s], [cx - a, cy - s]];
  return `M${pts.map(([x, y]) => `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100}`).join("L")}Z`;
}

/** True when a point lies inside the Budokan's octagon about (cx, cy). */
export const inOctagon = (cx: number, cy: number, a: number, x: number, y: number): boolean => Math.abs(x - cx) <= a + 1e-9 && Math.abs(y - cy) <= a + 1e-9 && Math.abs(x - cx) + Math.abs(y - cy) <= a * Math.SQRT2 + 1e-9;

function flag(v: unknown, def: boolean, label: string): boolean {
  if (v === undefined) return def;
  if (typeof v !== "boolean") throw new TypeError(`${label} is true or false`);
  return v;
}

/** The budō plan the options ask for. */
export function budoPlan(o: Pick<SurfaceOptions, "sport" | "league" | "budo" | "dojo" | "range" | "detail">): BudoPlan {
  const sport = o.sport as BudoKind;
  const league = budoLeague(o);
  const fig = league.dimensions;
  const style: BudoStyle = o.budo ?? {};
  const look = lookOf(sport, style.look ?? (sport === "dojo" ? dojoSpecOf(o.dojo).look : undefined));
  const seams = flag(style.seams, true, "budo.seams");
  const dspec = sport === "dojo" ? dojoSpecOf(o.dojo) : undefined;
  // The weave of the mats: asked for by `texture`, and a traditional dojo's by default.
  const texture = dspec !== undefined ? dspec.texture === "weave" || (dspec.texture === undefined && (dspec.pattern === undefined || dspec.pattern === "traditional" || dspec.pattern === "border")) : sport === "judo" && style.texture === "weave";
  const base = { sport, league: league.id, figures: fig, look, texture };
  const finish = (p: Omit<BudoPlan, "sport" | "league" | "figures" | "look" | "texture" | "hall" | "drawnLine"> & { hall?: BudoPlan["hall"] }): BudoPlan => ({ ...base, hall: undefined, ...p, drawnLine: drawn(p.box) });
  switch (sport) {
    case "judo": {
      const f = fig as JudoFigures;
      const mat = matOf(style.tatami, f);
      const contest = snapTo(contestOf(style.size, f), mat.width, f.contest.min, f.contest.max);
      const safety = snapTo(safetyOf(style.safety, f), mat.width, f.safety.min, f.safety.max);
      const { across, down } = gridOf(style.areas);
      const tape = league.id === "ajjf" ? (["red", "white"] as const) : league.id === "ijf-kata" ? (["white", "white"] as const) : (["blue", "white"] as const);
      const L = judoParts({ fig: f, contest, safety, across, down, mat, platform: flag(style.platform, false, "budo.platform"), officials: flag(style.officials, false, "budo.officials"), start: flag(style.start, true, "budo.start"), seams, tape });
      const first = L.contests[0];
      const lastC = L.contests[L.contests.length - 1];
      const ranges: Record<string, MRange> = { "contest-area": { left: first, right: lastC }, half: halves(L.tatami) };
      const fm = f.marks;
      ranges.start = fm === null ? first : { x0: (first.x0 + first.x1) / 2 - fm.fromCentre - 1.5, y0: (first.y0 + first.y1) / 2 - 2, x1: (first.x0 + first.x1) / 2 + fm.fromCentre + 1.5, y1: (first.y0 + first.y1) / 2 + 2 };
      return withHall(style, finish({ box: L.tatami, extent: L.extent, areas: L.parts.areas, shapes: L.parts.shapes, lineWidth: 0.05, ranges, marks: L.marks, centre: { x: (first.x0 + first.x1) / 2, y: (first.y0 + first.y1) / 2, r: contest / 2 }, judo: L }), "judo");
    }
    case "karate": {
      const f = fig as KarateFigures;
      const { across, down } = gridOf(style.areas);
      const officials = flag(style.officials, false, "budo.officials");
      const L = karateParts({ fig: f, across, down, officials, judges: flag(style.judges, true, "budo.judges"), seams });
      const first = L.areas[0];
      const lastA = L.areas[L.areas.length - 1];
      const ranges: Record<string, MRange> = { "contest-area": { left: first, right: lastA }, half: halves(L.mats), start: { x0: (first.x0 + first.x1) / 2 - 3, y0: (first.y0 + first.y1) / 2 - 2, x1: (first.x0 + first.x1) / 2 + 3, y1: (first.y0 + first.y1) / 2 + 2 } };
      return withHall(style, finish({ box: L.mats, extent: L.extent, areas: L.parts.areas, shapes: L.parts.shapes, lineWidth: 0.05, ranges, marks: L.marks, centre: { x: (first.x0 + first.x1) / 2, y: (first.y0 + first.y1) / 2, r: f.area * 0.1 }, karate: L }), "karate");
    }
    case "kendo": {
      const f = fig as typeof KENDO_LEAGUES[number]["dimensions"];
      const side = kendoSide(style.size, f);
      const L = kendoParts(f, side, seams);
      const ranges: Record<string, MRange> = { half: halves(L.floor), start: { x0: L.centre[0] - 3, y0: L.centre[1] - 2, x1: L.centre[0] + 3, y1: L.centre[1] + 2 } };
      return withHall(style, finish({ box: L.floor, extent: L.extent, areas: L.parts.areas, shapes: L.parts.shapes, lineWidth: f.lineWidth.min, ranges, marks: L.marks, centre: { x: L.centre[0], y: L.centre[1], r: side * 0.08 }, kendo: L }), "kendo");
    }
    case "sumo": {
      const f = fig as typeof SUMO_LEAGUES[number]["dimensions"];
      const L = sumoParts(f, { height: dohyoHeight(style.height, f), tawara: flag(style.tawara, true, "budo.tawara"), tassels: flag(style.tassels, false, "budo.tassels") });
      const ranges: Record<string, MRange> = { ...L.ranges, half: halves(L.platform) };
      return finish({ box: L.platform, extent: L.extent, areas: L.parts.areas, shapes: L.parts.shapes, lineWidth: f.shikiri.width, ranges, marks: L.marks, centre: { x: L.centre[0], y: L.centre[1], r: L.ring * 0.4 }, sumo: L });
    }
    case "kyudo": {
      const f = fig as typeof KYUDO_LEAGUES[number]["dimensions"];
      const L = kyudoParts(f, { shooters: shootersOf(style.shooters, f), targets: flag(style.targets, true, "budo.targets"), roof: flag(style.roof, true, "budo.roof") });
      const ranges: Record<string, MRange> = { shajo: L.shajo, yamichi: L.yamichi, azuchi: grow(L.azuchi, 0.8) };
      return finish({ box: L.range, extent: L.extent, areas: L.parts.areas, shapes: L.parts.shapes, lineWidth: 0.05, ranges, marks: L.marks, centre: { x: (L.shajo.x0 + L.shajo.x1) / 2, y: (L.shajo.y0 + L.shajo.y1) / 2, r: 1.5 }, kyudo: L });
    }
    case "mma": {
      const f = fig as MmaFigures;
      const L = cageParts(f, { width: cageWidth(style.size, f), height: cageHeight(style.height, f), fence: fenceHeight(style.fence, f), gates: flag(style.gates, true, "budo.gates"), steps: flag(style.steps, true, "budo.steps") });
      const ranges: Record<string, MRange> = { ...L.ranges, half: halves(L.platform) };
      return finish({ box: L.platform, extent: L.extent, areas: L.parts.areas, shapes: L.parts.shapes, lineWidth: f.post.diameter, ranges, marks: L.marks, centre: { x: L.centre[0], y: L.centre[1], r: L.apothem * 0.35 }, mma: L });
    }
    default: {
      const L = dojoLayout(o.dojo ?? {}, dojoLeague(league.id));
      const f = L.floor;
      const band = Math.max(1.5, (L.kamiza === "north" || L.kamiza === "south" ? L.length : L.width) * 0.22);
      const kamiza: MBox = L.kamiza === "north" ? { ...f, y1: f.y0 + band } : L.kamiza === "south" ? { ...f, y0: f.y1 - band } : L.kamiza === "west" ? { ...f, x1: f.x0 + band } : { ...f, x0: f.x1 - band };
      const ranges: Record<string, MRange> = { kamiza, half: halves(f) };
      return finish({ box: f, extent: L.extent, areas: L.parts.areas, shapes: L.parts.shapes, lineWidth: 0.05, ranges, marks: L.marks, centre: { x: L.width / 2, y: L.length / 2, r: Math.min(L.width, L.length) * 0.15 }, dojo: L });
    }
  }
}

/** The Budokan's arena floor under a surface, when the options ask for it (`budo.hall`): the octagon centred on the surface, which must lie wholly inside it. */
function withHall(style: BudoStyle & { hall?: unknown }, p: BudoPlan, sport: BudoKind): BudoPlan {
  const hall = (style as { hall?: unknown }).hall;
  if (hall === undefined) return p;
  if (hall !== "budokan") throw new Error('budo.hall is "budokan"');
  const cx = (p.box.x0 + p.box.x1) / 2;
  const cy = (p.box.y0 + p.box.y1) / 2;
  const a = BUDOKAN_ARENA;
  const corners = [[p.extent.x0, p.extent.y0], [p.extent.x1, p.extent.y0], [p.extent.x0, p.extent.y1], [p.extent.x1, p.extent.y1]] as const;
  if (!corners.every(([x, y]) => inOctagon(cx, cy, a, x, y))) throw new RangeError(`The ${sport} surface with everything round it does not fit in the Budokan's arena, an octagon of ${2 * a} m across the flats`);
  const box: MBox = { x0: cx - a, y0: cy - a, x1: cx + a, y1: cy + a };
  const floor: Area = { id: "arena", feature: "floor", cls: "ky-bud-floor", d: octagonD(cx, cy, a) };
  const parts = emptyParts();
  parts.areas.push(floor);
  return { ...p, hall: "budokan", box, extent: union([box, p.extent]), areas: [...parts.areas, ...p.areas], marks: [{ id: "arena", x: cx - a * 0.55, y: cy - a * 0.8, side: "top" as const }, ...p.marks], ranges: { ...p.ranges, half: halves(box) } };
}

export { boxD };
