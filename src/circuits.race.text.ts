// The words of a race's numbers: the race clock, a lap's time, a gap, the clock's line at a moment and what a line of the board shows in its gap column. Pure, and shared by the drawing, the board, the timing
// tower and the podium (so that they all say the same).
import type { RaceMoment, RaceStanding } from "./circuits.race.moment.ts";
import { RACE_WORDS } from "./circuits.race.words.ts";
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
