// A simulated race drawn: the circuit's drawing with a dot for each car where it is at a moment (in its team's colour, with the position it holds written on it), the race clock's words, and the timing board as a
// table. Pure: the same race, moment and language always give the same strings. The page that moves them is `circuits.race.dom.ts`.
import { circuitDrawing } from "./circuits.draw.ts";
import type { CircuitDrawing } from "./circuits.draw.ts";
import { raceAt, type RaceMoment, type RaceStanding } from "./circuits.race.moment.ts";
import { simulateRace, type CircuitRace, type RaceOptions } from "./circuits.race.ts";
import { TOWER_STYLE, towerData, towerFrame, towerMarkup } from "./circuits.race.tower.ts";
import { standingGap, lapTime } from "./circuits.race.text.ts";
import { RACE_WORDS } from "./circuits.race.words.ts";
import type { CircuitOptions } from "./circuits.types.ts";
import { el, esc, num } from "./format.ts";
import { BAR_STYLE } from "./replay.bar.ts";
import { fill } from "./strings.core.ts";
import type { Language } from "./types.ts";

export { gapText, lapTime, raceClock, raceStage, standingGap } from "./circuits.race.text.ts";

/** The size of a car's dot on a drawing whose type and marks are sized by `k` (a thousandth of its longer side). */
export const carRadius = (k: number): number => 11 * k;

/** The markup of one car's dot: a circle in the team's colour, edged in the ground's, with its position on it, laid at the origin (the page moves it with `transform`). */
export function carMarkup(line: RaceStanding, r: number, language: Language): string {
  const w = RACE_WORDS[language];
  const label = fill(w.car, { position: line.position, name: line.car.driver.name[language], team: line.car.team.name[language] });
  const inner =
    el("circle", { class: "ky-ci-car-dot", r: num(r), fill: line.car.team.colour, "stroke-width": num(r * 0.2) }) +
    el("text", { class: "ky-ci-car-n", y: num(r * 0.4), "font-size": num(r * (line.position >= 10 ? 1 : 1.15)), fill: line.car.team.ink }, String(line.position));
  return el("g", { class: "ky-ci-car", "data-car": line.car.id, "data-status": line.status, transform: `translate(${num(line.at[0])} ${num(line.at[1])})`, role: "img", "aria-label": label }, inner);
}

/** A chequered strip of two rows of `cols` squares, `s` each, from (x, y): the flag the winner gets in place of its P1 tag. */
export function chequerSquares(x: number, y: number, s: number, cols: number): string {
  let out = "";
  for (let r = 0; r < 2; r += 1) for (let c = 0; c < cols; c += 1) out += el("rect", { class: (r + c) % 2 === 0 ? "ky-ci-lead-dark" : "ky-ci-lead-light", x: num(x + c * s), y: num(y + r * s), width: num(s), height: num(s) });
  return out;
}

/**
 * The leader's mark: a ring round the car's dot in a contrasting colour (amber, edged dark, so that it reads on a light or a dark ground) and a small "P1" tag above it, laid at the car's place. It is its own group,
 * drawn after every car so that no dot lies over it, and it stays whatever the page does with the turn markers and the cars' numbers.
 */
export function leaderMarkup(line: RaceStanding, r: number, flag = false): string {
  const ring = 1.55 * r;
  const inner =
    el("circle", { class: "ky-ci-lead-halo", r: num(ring), "stroke-width": num(0.55 * r) }) +
    el("circle", { class: "ky-ci-lead-ring", r: num(ring), "stroke-width": num(0.3 * r) }) +
    el("rect", { class: "ky-ci-lead-tag", x: num(-1.15 * r), y: num(-3.45 * r), width: num(2.3 * r), height: num(1.35 * r), rx: num(0.4 * r), "stroke-width": num(0.14 * r) }) +
    el("text", { class: "ky-ci-lead-p", y: num(-2.45 * r), "font-size": num(1.0 * r) }, "P1") +
    el("g", { class: "ky-ci-lead-chq" }, chequerSquares(-0.9 * r, -3.075 * r, 0.3 * r, 6));
  return el("g", { class: "ky-ci-lead", "data-flag": flag ? "true" : "false", "data-car": line.car.id, transform: `translate(${num(line.at[0])} ${num(line.at[1])})`, "aria-hidden": "true" }, inner);
}

/** The cars of a moment as one group, the last car drawn first so that the leader lies on top. */
export function carsMarkup(moment: RaceMoment, r: number, language: Language): string {
  const lines = [...moment.standings].sort((a, b) => a.index - b.index);
  const first = moment.standings[0];
  return el("g", { class: "ky-ci-cars" }, lines.map((line) => carMarkup(line, r, language)).join("")) + (first === undefined ? "" : leaderMarkup(first, r, moment.flag));
}

/** What a race's drawing is made from: the circuit's options, the race's, and the moment. */
export interface RaceDrawOptions extends CircuitOptions, Omit<RaceOptions, "circuit"> {
  /** Seconds from the start: 0 (the grid) by default. */
  t?: number;
  /** The timing tower standing beside the start and finish straight: `true` (the default) or `false`. */
  tower?: boolean;
}

/** A race's drawing at a moment, and what it was made from. */
export interface RaceDrawing extends CircuitDrawing {
  race: CircuitRace;
  moment: RaceMoment;
}

/** The race, the drawing of its circuit and the moment, with the cars on it: the race the options make, or one given (from a feed). */
export function raceDrawing(options: RaceDrawOptions, given?: CircuitRace): RaceDrawing {
  const language: Language = options.language === "ja" ? "ja" : "en";
  const race = given ?? simulateRace(options);
  const moment = raceAt(race, options.t ?? 0);
  const drawn = circuitDrawing(options);
  const w = RACE_WORDS[language];
  const extra = ` ${fill(given === undefined ? w.description : w.fromFeed, { cars: race.cars.length, laps: race.laps })}`;
  const description = `${drawn.description}${language === "ja" ? extra.trim() : extra}`;
  // The timing tower stands beside the start and finish straight, under the cars.
  let tower = "";
  if (options.tower !== false) {
    const t = towerFrame(drawn.plan, drawn.k, race.cars.length);
    tower = el("g", { class: "ky-ci-tower", transform: `translate(${num(t.at[0] - t.w / 2)} ${num(t.at[1] - t.h / 2)}) scale(${num(t.s)})`, "aria-hidden": "true" }, towerMarkup(towerData(race, moment, language), t.rows, language));
  }
  const svg = drawn.svg.replace(/<desc id="([^"]+)">[^<]*<\/desc>/, (_, id: string) => `<desc id="${id}">${esc(description)}</desc>`).replace(/<\/svg>$/, `${tower}${carsMarkup(moment, carRadius(drawn.k), language)}</svg>`);
  return { ...drawn, svg, description, race, moment };
}

/**
 * A simulated race on a circuit at a moment, as one SVG string: the circuit's drawing with a dot for each made-up car where the race has it then, in its team's colour, with the position it holds written on it.
 * @example
 * ```ts
 * import { drawRace } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const svg = drawRace({ circuit: "las-vegas", laps: 3, cars: 6, t: 120 });
 * console.log(svg.match(/class="ky-ci-car"/g)!.length, svg.includes("simulation"));
 * // 6 true
 * ```
 */
export function drawRace(options: RaceDrawOptions): string {
  return raceDrawing(options).svg;
}

/**
 * The timing board at a moment, as a table: position, driver and team, the gap to the leader and to the car in front, the last and best laps and the pit stops, the fastest lap marked. The colours of the teams are
 * swatches beside their names, never the only way a car is told.
 * @example
 * ```ts
 * import { raceAt, raceBoard, simulateRace } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const race = simulateRace({ circuit: "las-vegas", laps: 3, cars: 4 });
 * const table = raceBoard(raceAt(race, 200));
 * console.log(table.startsWith("<table"), (table.match(/<tr data-car/g) ?? []).length);
 * // true 4
 * ```
 */
export function raceBoard(moment: RaceMoment, language: Language = "en"): string {
  const w = RACE_WORDS[language === "ja" ? "ja" : "en"].board;
  const lang: Language = language === "ja" ? "ja" : "en";
  const heads = [w.position, w.driver, w.team, w.gap, w.interval, w.last, w.best, w.stops];
  const cols = ["pos", "driver", "team", "gap", "interval", "last", "best", "stops"];
  const head = `<thead><tr>${heads.map((h, i) => `<th scope="col" data-col="${cols[i]}">${esc(h)}</th>`).join("")}</tr></thead>`;
  const rows = moment.standings.map((line) => {
    const fastest = moment.fastest?.index === line.index;
    const cells = [
      `<th scope="row" data-col="pos">${line.position}</th>`,
      `<td data-col="driver"><span class="ky-race-swatch" style="background:${esc(line.car.team.colour)}"></span><span class="ky-race-code">${esc(line.car.driver.code)}</span> <span class="ky-race-name">${esc(line.car.driver.name[lang])}</span></td>`,
      `<td data-col="team">${esc(line.car.team.name[lang])}</td>`,
      `<td data-col="gap">${esc(line.status === "pit" ? w.pit : standingGap(line, lang, "gap"))}</td>`,
      `<td data-col="interval">${esc(standingGap(line, lang, "interval"))}</td>`,
      `<td data-col="last">${line.last === undefined ? "" : lapTime(line.last)}</td>`,
      `<td data-col="best"${fastest ? ` data-fastest="true" title="${esc(w.fastest)}"` : ""}>${line.best === undefined ? "" : lapTime(line.best)}</td>`,
      `<td data-col="stops">${line.stops}</td>`,
    ];
    return `<tr data-car="${esc(line.car.id)}" data-status="${line.status}">${cells.join("")}</tr>`;
  });
  return `<table class="ky-race-board"><caption>${esc(w.caption)}</caption>${head}<tbody>${rows.join("")}</tbody></table>`;
}

/** The rules of a race: the cars on the drawing, the clock, the controls and the board. Scoped to `.ky-race` and the cars of a circuit's or a district's drawing, in the page's own colours. */
export const RACE_STYLE = `
${TOWER_STYLE}
.ky-circuit .ky-ci-car-dot,.ky-district .ky-ci-car-dot,.ky-turn .ky-ci-car-dot{stroke:var(--ky-ci-ground,#fff)}
.ky-circuit .ky-ci-car-n,.ky-district .ky-ci-car-n,.ky-turn .ky-ci-car-n{font-family:var(--ky-font,system-ui,sans-serif);font-weight:800;text-anchor:middle;font-variant-numeric:tabular-nums}
.ky-circuit .ky-ci-car[data-status=out],.ky-district .ky-ci-car[data-status=out]{opacity:.45}
.ky-circuit .ky-ci-lead-halo,.ky-district .ky-ci-lead-halo,.ky-turn .ky-ci-lead-halo{fill:none;stroke:var(--ky-ci-lead-edge,#14181d)}
.ky-circuit .ky-ci-lead-ring,.ky-district .ky-ci-lead-ring,.ky-turn .ky-ci-lead-ring{fill:none;stroke:var(--ky-ci-lead,#f5b50a)}
.ky-circuit .ky-ci-lead-tag,.ky-district .ky-ci-lead-tag,.ky-turn .ky-ci-lead-tag{fill:var(--ky-ci-lead,#f5b50a);stroke:var(--ky-ci-lead-edge,#14181d)}
.ky-circuit .ky-ci-lead-p,.ky-district .ky-ci-lead-p,.ky-turn .ky-ci-lead-p{fill:#14181d;font-family:var(--ky-font,system-ui,sans-serif);font-weight:800;text-anchor:middle}
.ky-circuit .ky-ci-lead-chq,.ky-district .ky-ci-lead-chq,.ky-turn .ky-ci-lead-chq{display:none}
.ky-circuit .ky-ci-lead[data-flag=true] .ky-ci-lead-chq,.ky-district .ky-ci-lead[data-flag=true] .ky-ci-lead-chq,.ky-turn .ky-up[data-flag=true] .ky-ci-lead-chq{display:inline}
.ky-circuit .ky-ci-lead[data-flag=true] .ky-ci-lead-p,.ky-district .ky-ci-lead[data-flag=true] .ky-ci-lead-p,.ky-turn .ky-up[data-flag=true] .ky-ci-lead-p{display:none}
.ky-circuit .ky-ci-lead-dark,.ky-district .ky-ci-lead-dark,.ky-turn .ky-ci-lead-dark{fill:#14181d}
.ky-circuit .ky-ci-lead-light,.ky-district .ky-ci-lead-light,.ky-turn .ky-ci-lead-light{fill:#fff}
.ky-race[data-labels=off] .ky-ci-car-n{display:none}
.ky-race .ky-race-board tbody tr:first-child{background:color-mix(in srgb,var(--ky-ci-lead,#f5b50a) 22%,transparent)}
.ky-race{position:relative;display:block;color:inherit}
${BAR_STYLE}
.ky-race .ky-race-hint,.ky-race .ky-race-live{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ky-race .ky-race-frame,.ky-race .ky-race-vp{position:relative}
.ky-race .ky-race-credit{position:absolute;right:6px;bottom:6px;margin:0;padding:2px 6px;border-radius:4px;background:#12161bcc;color:#f1f3f5;font-size:.7rem;z-index:2;pointer-events:none}
.ky-race .ky-race-credit[hidden]{display:none}
.ky-race .ky-follow{display:inline-flex;flex-wrap:wrap;gap:.5rem}
.ky-race .ky-follow button{gap:.35rem}
.ky-race .ky-follow svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ky-race .ky-race-overlay{position:absolute;left:8px;top:8px;width:clamp(120px,22%,190px);pointer-events:none;z-index:2}
.ky-race .ky-race-overlay[hidden],.ky-race .ky-race-podium[hidden],.ky-race .ky-podium-list li[hidden]{display:none}
.ky-race .ky-race-overlay svg{display:block;width:100%;height:auto}
.ky-race .ky-race-podium{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(92%,420px);box-sizing:border-box;padding:.7rem .9rem;border-radius:12px;background:#12161bf2;color:#f1f3f5;box-shadow:0 6px 24px #0008;z-index:3;font-size:.9rem;font-variant-numeric:tabular-nums}
.ky-race .ky-podium-head{display:flex;justify-content:space-between;align-items:center;gap:.5rem}
.ky-race .ky-podium-title{font-size:1.05rem}
.ky-race .ky-podium-close{box-sizing:border-box;min-width:44px;min-height:44px;margin:0;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:1.3rem;cursor:pointer}
.ky-race .ky-podium-close:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.ky-race .ky-podium-list{list-style:none;margin:.4rem 0;padding:0;display:grid;gap:.3rem}
.ky-race .ky-podium-list li{display:grid;grid-template-columns:1.6rem .9rem 1fr auto;align-items:center;gap:.5rem}
.ky-race .ky-podium-pos{font-weight:800;text-align:center}
.ky-race .ky-podium-list li:first-child .ky-podium-pos{color:#f5b50a}
.ky-race .ky-podium-swatch{width:.8rem;height:.8rem;border-radius:50%;border:1px solid #fff6}
.ky-race .ky-podium-who{display:flex;flex-direction:column;line-height:1.15}
.ky-race .ky-podium-who small{opacity:.75}
.ky-race .ky-podium-time{font-weight:700}
.ky-race .ky-podium-list li[data-finished=false] .ky-podium-time{opacity:.65;font-weight:500}
.ky-race .ky-podium-fast{margin:0;color:#c9a6ff;font-size:.85rem}
.ky-race .ky-race-note{margin:.25rem 0 0;font-size:.85rem;opacity:.8}
.ky-race .ky-race-board-wrap{overflow-x:auto;margin-top:.5rem}
.ky-race .ky-race-board{border-collapse:collapse;width:100%;font-size:.85rem;font-variant-numeric:tabular-nums}
.ky-race .ky-race-board caption{text-align:start;font-weight:700;padding:.25rem 0}
.ky-race .ky-race-board th,.ky-race .ky-race-board td{padding:.2rem .45rem;border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);text-align:start;white-space:nowrap}
.ky-race .ky-race-board td[data-col=gap],.ky-race .ky-race-board td[data-col=interval],.ky-race .ky-race-board td[data-col=last],.ky-race .ky-race-board td[data-col=best],.ky-race .ky-race-board td[data-col=stops]{text-align:end}
.ky-race .ky-race-board tr[data-status=out]{opacity:.6}
.ky-race .ky-race-board td[data-fastest=true]{font-weight:800;text-decoration:underline}
.ky-race .ky-race-swatch{display:inline-block;width:.7em;height:.7em;margin-inline-end:.35em;border-radius:50%;border:1px solid color-mix(in srgb,currentColor 40%,transparent);vertical-align:baseline}
.ky-race .ky-race-code{font-weight:800}
@media (max-width:560px){.ky-race .ky-race-podium{position:static;transform:none;width:auto;margin-top:.5rem}}
@media (max-width:560px){.ky-race .ky-race-board [data-col=team],.ky-race .ky-race-board [data-col=best],.ky-race .ky-race-board [data-col=last],.ky-race .ky-race-board .ky-race-name{display:none}}
`.trim();
