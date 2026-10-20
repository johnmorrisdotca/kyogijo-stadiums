// The seats of each judging style, as the rulebook has them. A kata area is judged by five judges on the shomen side, 1.25 m apart, the central judge at the centre of the area, and no referee (IJF Sport and
// Organisation Rules of 21 January 2026, B1.8 and the judges' article; the Kata Commission's Tournament Handbook 2024). The rules do not number the judges: the numbers here are ours, from the left as the plan lies
// with the shomen at the top (so the central judge is 3), and are said so in the docs. The positions are the plan's own (`budoPlan`), so that what is drawn and what is named cannot differ.
import { IJF_KATA } from "./leagues/budo.ts";
import type { JudgingSeat, JudgingStyle } from "./judging.types.ts";

/** How many officials a style seats. */
export const JUDGING_SEAT_COUNT: Readonly<Record<JudgingStyle, number>> = Object.freeze({ kata: IJF_KATA.panel?.count ?? 5 });

/** The seats of a kata area: five judges, the middle one the central judge. */
function kata(): readonly JudgingSeat[] {
  const count = JUDGING_SEAT_COUNT.kata;
  const middle = Math.ceil(count / 2);
  return Array.from({ length: count }, (_, i): JudgingSeat => {
    const n = i + 1;
    const central = n === middle;
    return { id: `judge-${n}`, n, role: central ? "central" : "judge", label: { en: central ? `Judge ${n}, central` : `Judge ${n}`, ja: central ? `審判員${n}（中央）` : `審判員${n}` } };
  });
}

/** The seats of every style, in the order they are drawn. */
export const JUDGING_SEATS: Readonly<Record<JudgingStyle, readonly JudgingSeat[]>> = Object.freeze({ kata: Object.freeze(kata()) });

/** The styles that can be asked for. */
export const JUDGING_STYLES: readonly JudgingStyle[] = Object.freeze(["kata"]);

/** The league each style is drawn in (`drawKyogijo`'s `league`), and the sources its seats are read from (keys of `LEAGUE_SOURCES`). */
export const JUDGING_LEAGUE: Readonly<Record<JudgingStyle, { league: string; sources: readonly string[] }>> = Object.freeze({ kata: { league: "ijf-kata", sources: ["ijf-sor", "ijf-kata-handbook", "ijf-kata-criteria"] } });

/** The most mat areas an assignment names: the plan's own limit for areas side by side. */
export const JUDGING_MATS_MAX = 6;
