import { describe, expect, it } from "vitest";
import { COURT_THEMES } from "./themes.ts";
import { SPORTS, drawKyogijo } from "./draw.ts";
import { isFieldSport } from "./fields.ts";
import { isPoolSport } from "./pool.ts";
import { hash } from "./format.ts";
import type { ScoreOptions, SurfaceOptions } from "./types.ts";

// The styling, direction and annotation options are all off by default, and a drawing made without them must stay the same text, byte for
// byte, as it was before they existed. This test draws a wide spread of drawings that use none of them and holds the text of each to the
// fingerprint it had when the options were added (the snapshot is made from the code before the options; a change to it means a default drawing changed).
const game: Omit<ScoreOptions, "sport"> = {
  away: { name: "Harbour City Gulls", abbr: "HCG", score: 3, color: "#1f5fa8" },
  home: { name: "Prairie Ridge Bison", abbr: "PRB", score: 2, color: "#b5452c" },
  status: "final-ot",
  competition: "Cup Final",
  id: "same",
};

/** Every drawing the fingerprint is made of: name and options. */
function matrix(): [string, SurfaceOptions | ScoreOptions][] {
  const out: [string, SurfaceOptions | ScoreOptions][] = [];
  // The sports that were there before the field sports and the pools: the fingerprint is theirs.
  for (const sport of SPORTS.filter((one) => !isFieldSport(one) && !isPoolSport(one))) {
    out.push([`${sport} bare`, { sport, id: "same" }]);
    out.push([`${sport} bare dark`, { sport, id: "same", theme: "dark" }]);
    out.push([`${sport} portrait`, { sport, id: "same", orientation: "portrait" }]);
    out.push([`${sport} exact`, { sport, id: "same", exactLines: true, detail: "simple" }]);
    out.push([`${sport} no style`, { sport, id: "same", style: "none", stripes: false }]);
    out.push([`${sport} score`, { sport, ...game }]);
    out.push([`${sport} score tall`, { sport, ...game, orientation: "portrait" }]);
    out.push([`${sport} compact`, { sport, ...game, size: "compact" }]);
    out.push([`${sport} badge`, { sport, ...game, size: "badge" }]);
    out.push([`${sport} colours`, { sport, id: "same", colors: { line: "#ff0", surface: "#123456" }, margin: 20 }]);
    out.push([`${sport} layers`, { sport, id: "same", layers: [{ kind: "points", name: "shots", data: [{ x: 40, y: 20, outcome: "goal", team: "home" }, { x: 60, y: 30, outcome: "miss" }] }] }]);
  }
  for (const name of Object.keys(COURT_THEMES) as (keyof typeof COURT_THEMES)[]) out.push([`court ${name}`, { sport: "nba", id: "same", court: COURT_THEMES[name] }]);
  for (const pattern of ["bands", "wide", "narrow", "lengthwise", "checks", "diagonal", "none"] as const) out.push([`soccer ${pattern}`, { sport: "soccer", id: "same", stripePattern: pattern }]);
  for (const goals of ["box", "line", "strip", "none"] as const) out.push([`soccer goals ${goals}`, { sport: "soccer", id: "same", goals }]);
  out.push(["soccer half", { sport: "soccer", id: "same", half: "left", cornerFlags: false }]);
  out.push(["soccer provider", { sport: "soccer", id: "same", pitchType: "opta" }]);
  for (const league of ["wnba", "fiba"]) out.push([`nba ${league}`, { sport: "nba", id: "same", league }]);
  for (const league of ["iihf", "ahl"]) out.push([`nhl ${league}`, { sport: "nhl", id: "same", league }]);
  for (const year of [1930, 1960, 2000]) {
    out.push([`nhl ${year}`, { sport: "nhl", id: "same", year }]);
    out.push([`nfl ${year}`, { sport: "nfl", id: "same", year }]);
    out.push([`mlb ${year}`, { sport: "mlb", id: "same", year }]);
  }
  out.push(["mlb fenway", { sport: "mlb", id: "same", park: "fenway-park" }]);
  out.push(["curling pebble", { sport: "curling", id: "same", sheet: { pebble: true, guardZone: true, show: "house" } }]);
  out.push(["curling wide", { sport: "curling", id: "same", orientation: "landscape", units: "m", margin: 2 }]);
  return out;
}

describe("a drawing made without the styling options", () => {
  it("is the same text as before they existed, drawing by drawing", () => {
    const hashes = Object.fromEntries(matrix().map(([name, options]) => [name, hash(drawKyogijo(options))]));
    expect(hashes).toMatchSnapshot();
  });
});
