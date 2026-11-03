// A simulated race drawn: the circuit's drawing with a dot for each car where it is at a moment (in its team's colour, with the position it holds written on it), the race clock's words, and the timing board as a
// table. Pure: the same race, moment and language always give the same strings. The page that moves them is `circuits.race.dom.ts`.
import { circuitDrawing } from "./circuits.draw.ts";
import type { CircuitDrawing } from "./circuits.draw.ts";
import { raceAt, type RaceMoment, type RaceStanding } from "./circuits.race.moment.ts";
import { simulateRace, type CircuitRace, type RaceOptions } from "./circuits.race.ts";
import { RACE_WORDS } from "./circuits.race.words.ts";
import type { CircuitOptions } from "./circuits.types.ts";
import { el, esc, num } from "./format.ts";
import { BAR_STYLE } from "./replay.bar.ts";
import { fill } from "./strings.core.ts";
import type { Language } from "./types.ts";

/** A race clock: `23:45` or `1:23:45`. */
export function raceClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const s = String(whole % 60).padStart(2, "0");
  const m = Math.floor(whole / 60);
  return m < 60 ? `${m}:${s}` : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${s}`;
}

/** A lap's time: `1:36.512`. */
export function lapTime(seconds: number): string {
  const thousandths = Math.round(Math.max(0, seconds) * 1000);
  const m = Math.floor(thousandths / 60000);
  const rest = thousandths - m * 60000;
  return `${m}:${String(Math.floor(rest / 1000)).padStart(2, "0")}.${String(rest % 1000).padStart(3, "0")}`;
}

/** A gap: `+1.234`, `+1:02.345` past a minute, or the laps down in the words of the language. */
export function gapText(seconds: number | undefined, laps: number, language: Language): string {
  const w = RACE_WORDS[language].board;
  if (laps >= 1) return laps === 1 ? w.lapDown : fill(w.lapsDown, { n: laps });
  if (seconds === undefined) return "";
  return seconds >= 60 ? `+${lapTime(seconds)}` : `+${seconds.toFixed(3)}`;
}

/** The race clock's line at a moment: the lap, the final lap, the flag or the grid. */
export function raceStage(moment: RaceMoment, language: Language): string {
  const w = RACE_WORDS[language];
  if (moment.flag) return w.flag;
  if (moment.t <= 0) return w.grid;
  if (moment.lap === moment.laps && moment.laps > 1) return `${fill(w.lap, { lap: moment.lap, laps: moment.laps })} · ${w.finalLap}`;
  return fill(w.lap, { lap: moment.lap, laps: moment.laps });
}

/** What a line of the board shows in its gap column: the leader, a gap, laps down, the pit lane or out. */
export function standingGap(line: RaceStanding, language: Language, of: "gap" | "interval" = "gap"): string {
  const w = RACE_WORDS[language].board;
  if (line.status === "out") return w.out;
  if (line.position === 1) return of === "gap" ? w.leader : "";
  return of === "gap" ? gapText(line.gap, line.lapsDown, language) : gapText(line.interval, line.intervalLaps, language);
}

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

/** The cars of a moment as one group, the last car drawn first so that the leader lies on top. */
export function carsMarkup(moment: RaceMoment, r: number, language: Language): string {
  const lines = [...moment.standings].sort((a, b) => a.index - b.index);
  return el("g", { class: "ky-ci-cars" }, lines.map((line) => carMarkup(line, r, language)).join(""));
}

/** What a race's drawing is made from: the circuit's options, the race's, and the moment. */
export interface RaceDrawOptions extends CircuitOptions, Omit<RaceOptions, "circuit"> {
  /** Seconds from the start: 0 (the grid) by default. */
  t?: number;
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
  const svg = drawn.svg.replace(/<desc id="([^"]+)">[^<]*<\/desc>/, (_, id: string) => `<desc id="${id}">${esc(description)}</desc>`).replace(/<\/svg>$/, `${carsMarkup(moment, carRadius(drawn.k), language)}</svg>`);
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
.ky-circuit .ky-ci-car-dot,.ky-district .ky-ci-car-dot,.ky-turn .ky-ci-car-dot{stroke:var(--ky-ci-ground,#fff)}
.ky-circuit .ky-ci-car-n,.ky-district .ky-ci-car-n,.ky-turn .ky-ci-car-n{font-family:var(--ky-font,system-ui,sans-serif);font-weight:800;text-anchor:middle;font-variant-numeric:tabular-nums}
.ky-circuit .ky-ci-car[data-status=out],.ky-district .ky-ci-car[data-status=out]{opacity:.45}
.ky-race{position:relative;display:block;color:inherit}
${BAR_STYLE}
.ky-race .ky-race-hint,.ky-race .ky-race-live{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
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
@media (max-width:560px){.ky-race .ky-race-board [data-col=team],.ky-race .ky-race-board [data-col=best],.ky-race .ky-race-board [data-col=last],.ky-race .ky-race-board .ky-race-name{display:none}}
`.trim();
