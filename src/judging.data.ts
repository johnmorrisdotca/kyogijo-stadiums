// The seats of each judging style, as the rulebook has them.
// A kata area is judged by five judges on the shomen side, 1.25 m apart, the central judge at the centre of the area, and no referee (IJF Sport and Organisation Rules of 21 January 2026, B1.8 and the judges' article; the
// Kata Commission's Tournament Handbook 2024). The rules do not number the judges: the numbers here are ours, from the left as the plan lies with the shomen at the top (so the central judge is 3).
// A contest (shiai) has one referee, on the tatami at its centre 2 m back from the line the athletes start on, facing the technical table (SOR, Refereeing Rules, Article 9 and Article 2); two technical officials a
// tatami for timing and scoring (the Refereeing Rules' opening article); the IJF Referee Supervisor(s) on the technical table with the CARE replay system, and the referees not officiating seated at it (Article 3);
// and, for an event with no CARE system, two side judges with a majority of three (Article 13, 5). The Rules give no place for a side judge: the corners of the contest area are ours. The positions are the plan's own
// (`budoPlan`) and the figures round them in `judging.ts`, so that what is drawn and what is named cannot differ.
import { IJF_KATA } from "./leagues/budo.ts";
import type { JudgingSeat, JudgingStyle } from "./judging.types.ts";

/** How many officials a style seats at the most (a contest's two side judges included). */
export const JUDGING_SEAT_COUNT: Readonly<Record<JudgingStyle, number>> = Object.freeze({ kata: IJF_KATA.panel?.count ?? 5, shiai: 6 });

/** The seats of a kata area: five judges, the middle one the central judge. */
function kata(): readonly JudgingSeat[] {
  const count = IJF_KATA.panel?.count ?? 5;
  const middle = Math.ceil(count / 2);
  return Array.from({ length: count }, (_, i): JudgingSeat => {
    const n = i + 1;
    const central = n === middle;
    return { id: `judge-${n}`, n, role: central ? "central" : "judge", where: "table", label: { en: central ? `Judge ${n}, central` : `Judge ${n}`, ja: central ? `審判員${n}（中央）` : `審判員${n}` } };
  });
}

/** The seats of a contest: the referee, then the technical table's three, then the side judges (drawn only when asked for or named). */
function shiai(): readonly JudgingSeat[] {
  const seat = (n: number, id: string, role: JudgingSeat["role"], where: JudgingSeat["where"], en: string, ja: string, optional = false): JudgingSeat => ({ id, n, role, where, label: { en, ja }, ...(optional ? { optional: true as const } : {}) });
  return [
    seat(1, "referee", "referee", "mat", "Referee", "主審"),
    seat(2, "timekeeper", "timekeeper", "table", "Timekeeper", "計時係"),
    seat(3, "scorekeeper", "scorekeeper", "table", "Scorekeeper", "記録係"),
    seat(4, "supervisor", "supervisor", "table", "Referee supervisor", "審判委員"),
    seat(5, "side-judge-1", "side-judge", "corner", "Side judge 1", "副審1", true),
    seat(6, "side-judge-2", "side-judge", "corner", "Side judge 2", "副審2", true),
  ];
}

/** The seats of every style, in the order they are listed. */
export const JUDGING_SEATS: Readonly<Record<JudgingStyle, readonly JudgingSeat[]>> = Object.freeze({ kata: Object.freeze(kata()), shiai: Object.freeze(shiai()) });

/** The other words a seat is asked for by, besides its key and its number. */
export const JUDGING_SEAT_WORDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "judge-3": ["central", "centre", "center"],
  referee: ["main", "main-referee", "central-referee", "shimpan"],
  timekeeper: ["time", "timer", "timing"],
  scorekeeper: ["score", "scorer", "scoring", "recorder"],
  supervisor: ["referee-supervisor", "jury", "care"],
  "side-judge-1": ["judge-1", "side-1"],
  "side-judge-2": ["judge-2", "side-2"],
});

/** The styles that can be asked for. */
export const JUDGING_STYLES: readonly JudgingStyle[] = Object.freeze(["kata", "shiai"]);

/** The league each style is drawn in (`drawKyogijo`'s `league`), and the sources its seats are read from (keys of `LEAGUE_SOURCES`). */
export const JUDGING_LEAGUE: Readonly<Record<JudgingStyle, { league: string; sources: readonly string[] }>> = Object.freeze({
  kata: { league: "ijf-kata", sources: ["ijf-sor", "ijf-kata-handbook", "ijf-kata-criteria"] },
  shiai: { league: "ijf", sources: ["ijf-sor"] },
});

/** The most mat areas an assignment names: the plan's own limit for areas side by side. */
export const JUDGING_MATS_MAX = 6;
