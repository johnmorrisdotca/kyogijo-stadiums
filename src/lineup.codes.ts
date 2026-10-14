// How a lineup finds a player's place: the short codes a team sheet uses (`CB`, `D`, `OF`, `PR`, the scorer's numbers 1 to 9) are matched to the ids of a formation's positions,
// and each player takes the first free place of the codes that fit. Written for this package; the codes are the conventional ones of each sport and are listed in docs/team-shape.md.
import { FORMATIONS } from "./formations.ts";
import type { Formation, FormationPosition, FormationSport, LineupPlayer } from "./team.types.ts";

/** The positions a short code may stand for, by sport, in the order a player takes them: a code that is also an id of the formation is that place first. */
export const LINEUP_CODES: Readonly<Record<FormationSport, Readonly<Record<string, readonly string[]>>>> = Object.freeze({
  soccer: {
    GOALKEEPER: ["GK"], G: ["GK"],
    CB: ["CB", "RCB", "LCB"], D: ["CB", "RCB", "LCB"], DF: ["CB", "RCB", "LCB"],
    RB: ["RB", "RWB"], LB: ["LB", "LWB"], RWB: ["RWB", "RB"], LWB: ["LWB", "LB"],
    DM: ["CDM", "RDM", "LDM"], CDM: ["CDM", "RDM", "LDM"], RDM: ["RDM", "CDM"], LDM: ["LDM", "CDM"],
    CM: ["CM", "RCM", "LCM"], M: ["CM", "RCM", "LCM"], RCM: ["RCM", "CM"], LCM: ["LCM", "CM"],
    AM: ["CAM", "RAM", "LAM"], CAM: ["CAM", "RAM", "LAM"], RAM: ["RAM", "CAM"], LAM: ["LAM", "CAM"],
    RM: ["RM", "RW"], LM: ["LM", "LW"], RW: ["RW", "RM"], LW: ["LW", "LM"],
    ST: ["ST", "RS", "LS"], CF: ["ST", "RS", "LS"], S: ["ST", "RS", "LS"], FW: ["ST", "RS", "LS", "RW", "LW"], RS: ["RS", "ST"], LS: ["LS", "ST"],
  },
  nhl: {
    GOALIE: ["G"], GK: ["G"], D: ["LD", "RD"], W: ["LW", "RW"], F: ["C", "LW", "RW"],
    G2: ["G"],
  },
  nba: { G: ["PG", "SG"], F: ["SF", "PF"], GF: ["SG", "SF"], FC: ["PF", "C"] },
  nfl: {
    WR: ["WR1", "WR2", "WR3"], RB: ["HB", "FB"], OG: ["LG", "RG"], OT: ["LT", "RT"], T: ["LT", "RT"], G: ["LG", "RG"],
    DE: ["LDE", "RDE"], DT: ["LDT", "RDT", "NT"], NT: ["NT"], CB: ["LCB", "RCB"], S: ["FS", "SS"],
    LB: ["MLB", "LLB", "RLB", "LOLB", "LILB", "RILB", "ROLB"], OLB: ["LOLB", "ROLB", "LLB", "RLB"], ILB: ["LILB", "RILB", "MLB"],
  },
  mlb: {
    "1": ["P"], "2": ["C"], "3": ["1B"], "4": ["2B"], "5": ["3B"], "6": ["SS"], "7": ["LF"], "8": ["CF"], "9": ["RF"],
    PITCHER: ["P"], CATCHER: ["C"], OF: ["LF", "CF", "RF"], IF: ["1B", "2B", "SS", "3B"], DESIGNATEDHITTER: ["DH"],
  },
  rugby: {
    LHP: ["1"], PR: ["1", "3"], HK: ["2"], HO: ["2"], THP: ["3"], LK: ["4", "5"], LO: ["4", "5"], L: ["4", "5"], FL: ["6", "7"], BF: ["6"], OF: ["7"], N8: ["8"], NO8: ["8"],
    SH: ["9"], FH: ["10"], SO: ["10"], IC: ["12"], OC: ["13"], CTB: ["12", "13"], C: ["12", "13"], W: ["11", "14"], WG: ["11", "14"], WTB: ["11", "14"], LW: ["11"], RW: ["14"], FB: ["15"],
  },
  afl: {
    BP: ["BPL", "BPR"], HB: ["HBFL", "CHB", "HBFR"], HBF: ["HBFL", "HBFR"], W: ["WL", "WR"], HF: ["HFFL", "CHF", "HFFR"], HFF: ["HFFL", "HFFR"], FP: ["FPL", "FPR"],
    R: ["RUC"], RK: ["RUC"], RUCK: ["RUC"], RUCKROVER: ["RR"], ROVER: ["ROV"], RO: ["ROV"],
  },
  cricket: {
    BOWLER: ["BWL"], KEEPER: ["WK"], SL: ["SL1", "SL2", "SL3"], SLIP: ["SL1", "SL2", "SL3"], GULLY: ["GU"], POINT: ["PT"], COVER: ["CV"], MIDOFF: ["MO"], MIDON: ["MN"],
    MIDWICKET: ["MW"], SQUARELEG: ["SQ"], FINELEG: ["FL"], THIRDMAN: ["TM"], LONGOFF: ["LO"], LONGON: ["LN"], DEEPCOVER: ["DC"], DEEPMIDWICKET: ["DM"],
  },
  volleyball: { "1": ["P1"], "2": ["P2"], "3": ["P3"], "4": ["P4"], "5": ["P5"], "6": ["P6"] },
  handball: { G: ["GK"], P: ["PV"], PIVOT: ["PV"], LINE: ["PV"], W: ["LW", "RW"], B: ["LB", "CB", "RB"] },
  waterpolo: { G: ["GK"], W: ["LW", "RW"], D: ["LD", "RD"], FLAT: ["LD", "RD"], HS: ["CF"], HOLE: ["CF"], H: ["CF"], PT: ["CB"], POINT: ["CB"] },
  fieldhockey: {
    G: ["GK"], FB: ["RB", "LB"], CB: ["CB", "RCB", "LCB"], D: ["CB", "RCB", "LCB"], M: ["CM", "RCM", "LCM"], CM: ["CM", "RCM", "LCM"], RM: ["RM", "RW"], LM: ["LM", "LW"],
    F: ["CF", "RW", "LW"], ST: ["CF"], RW: ["RW", "RM"], LW: ["LW", "LM"],
  },
  netball: {},
});

/** A code as the table has it: upper case, with no spaces, dots or hyphens. */
export const codeOf = (pos: unknown): string => String(typeof pos === "number" || typeof pos === "string" ? pos : "").trim().toUpperCase().replace(/[\s.\-_]+/g, "");

/** The ids a player's code may stand for in a formation of a sport, best first: the id itself, then the table's. A second line's ids end in its number. */
export function candidates(sport: FormationSport, player: LineupPlayer, ids: ReadonlySet<string>): string[] {
  const own = typeof player.pos === "string" ? player.pos.trim() : String(player.pos);
  const code = codeOf(player.pos);
  const line = typeof player.line === "number" && Number.isInteger(player.line) && player.line > 1 ? String(player.line) : "";
  const listed = Object.prototype.hasOwnProperty.call(LINEUP_CODES[sport], code) ? LINEUP_CODES[sport][code] : [];
  const base = [own, code, ...listed];
  const wanted = line === "" ? base : base.map((id) => `${id}${line}`);
  return [...new Set(wanted)].filter((id) => ids.has(id));
}

/** The places of a formation that a lineup may fill: the side on the surface and, beside it, the places it only lists. */
export const spotsOf = (f: Formation): FormationPosition[] => [...f.positions, ...(f.extra ?? [])];

/** Where each player of a lineup stands in a formation, by the index of the player; the places taken; and the players with none. */
export interface Assignment {
  /** The id of the position of each player, or undefined. */
  of: (string | undefined)[];
  placed: number;
  /** How many took the place their own code names, which settles a tie between formations. */
  exact: number;
}

/** Players to places. Those whose code is a place's id take it first, then the others take the first free place their code may stand for; a volleyball team turns by `rotation`. */
export function assign(f: Formation, players: readonly LineupPlayer[], rotation = 1): Assignment {
  const ids = new Set(spotsOf(f).map((p) => p.id));
  const turned = f.sport === "volleyball" ? players.map((p) => zoneAfter(p, rotation)) : players;
  const of: (string | undefined)[] = new Array<string | undefined>(turned.length).fill(undefined);
  const taken = new Set<string>();
  const lists = turned.map((p) => (typeof p === "object" && p !== null ? candidates(f.sport, p, ids) : []));
  // The exact codes first, so that a CB on the sheet cannot take the place an RCB has asked for by name.
  let exact = 0;
  turned.forEach((p, i) => {
    if (typeof p !== "object" || p === null) return;
    const line = typeof p.line === "number" && p.line > 1 ? String(p.line) : "";
    const own = lists[i].find((id) => id === `${typeof p.pos === "string" ? p.pos.trim() : String(p.pos)}${line}` || id === `${codeOf(p.pos)}${line}`);
    if (own !== undefined && !taken.has(own)) {
      of[i] = own;
      taken.add(own);
      exact += 1;
    }
  });
  turned.forEach((_, i) => {
    if (of[i] !== undefined) return;
    const free = lists[i].find((id) => !taken.has(id));
    if (free !== undefined) {
      of[i] = free;
      taken.add(free);
    }
  });
  return { of, placed: of.filter((id) => id !== undefined).length, exact };
}

/** A volleyball player after the rotations: each moves one place clockwise, from 2 to 1, 1 to 6, 6 to 5, 5 to 4, 4 to 3 and 3 to 2. */
function zoneAfter(p: LineupPlayer, rotation: number): LineupPlayer {
  if (typeof p !== "object" || p === null) return p;
  const code = codeOf(p.pos).replace(/^P/, "");
  if (!/^[1-6]$/.test(code)) return p;
  const turns = Number.isInteger(rotation) && rotation >= 1 ? (rotation - 1) % 6 : 0;
  const zone = ((((Number(code) - 1 - turns) % 6) + 6) % 6) + 1;
  return { ...p, pos: `P${zone}` };
}

/** The formations that may hold a lineup on a surface, in table order. */
export const formationsFor = (sports: readonly FormationSport[]): Formation[] => Object.values(FORMATIONS).filter((f) => sports.includes(f.sport));

/** The formation that places the most of the players: the first of the table on a tie. */
export function bestFormation(candidatesList: readonly Formation[], players: readonly LineupPlayer[], rotation = 1): Formation | undefined {
  let best: Formation | undefined;
  let score = -1;
  for (const f of candidatesList) {
    const a = assign(f, players, rotation);
    const n = a.placed * 1000 + a.exact;
    if (n > score) {
      best = f;
      score = n;
    }
  }
  return best;
}
