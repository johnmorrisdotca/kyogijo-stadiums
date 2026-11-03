// The scoreboard hung over a 3D view, following a replay: the faces drawn with the score, the period and the game clock of the time the replay is at (`replayBoard`), in the model (pure) and in the
// page (a few SVG strings written when the board changes, never the view). A goal, a new period, a seek, a step or a pause is written at once; the clock, while the replay plays, once a second at most.
import { replayBoard, type ReplayBoardState } from "./replay.board.ts";
import type { ReplayChange, ReplayTimeline } from "./replay.types.ts";
import type { Plane } from "./turn.kit.ts";
import type { TurnModel } from "./turn.model.ts";
import { centreBoard, safeClock, type HungBoard } from "./venue.boards.ts";

/** The scoreboards a model has hung over its surface, with what each was made from. */
export const hungBoards = (model: Pick<TurnModel, "uprights">): HungBoard[] => model.uprights.items.flatMap((item) => (item.kind === "hung-board" && item.hung !== undefined ? [item.hung] : []));

/** The planes of a hung scoreboard with the replay's board on it: the same planes (the same ids, in the same places), the faces drawn with the score, the period and the clock. */
export function hungBoardPlanes(hung: HungBoard, state: ReplayBoardState): Plane[] {
  const clock = safeClock(state.clock);
  const live = clock === "" ? undefined : { clock, ...(state.period === undefined ? {} : { period: state.period }), ...powerPlay(state) };
  return centreBoard(hung.id, hung.box, hung.lift, { ...hung.look, score: state.score, ...(live === undefined ? {} : { live }) });
}

/** A power play on the board: the clocks of each side's penalties that make it play short, and which side has more skaters. Nothing when no side plays short. */
function powerPlay(state: ReplayBoardState): { penalties?: { home: string[]; away: string[]; pp?: "home" | "away" } } {
  const short = (state.penalties ?? []).filter((p) => p.short);
  if (short.length === 0 || state.strength === undefined) return {};
  const [home, away] = state.strength;
  const pp = home > away ? "home" : away > home ? "away" : undefined;
  return { penalties: { home: short.filter((p) => p.team === "home").map((p) => p.left), away: short.filter((p) => p.team === "away").map((p) => p.left), ...(pp === undefined ? {} : { pp }) } };
}

/** What is written on a board, as one string: it changes when, and only when, the score, the period, the clock or a penalty's clock does. */
export const boardKey = (state: ReplayBoardState): string =>
  `${state.score[0]}-${state.score[1]} ${state.period ?? ""} ${state.clock}${state.strength === undefined ? "" : ` ${state.strength.join("-")} ${(state.penalties ?? []).map((p) => `${p.team}${p.left}${p.short ? "" : "x"}`).join(",")}`}`;

/** The longest the game clock goes without a write while the replay plays, in milliseconds. */
export const CLOCK_EVERY = 1000;

const FACE = /-(south|north|east|west)$/;

/** A scoreboard in the page: its planes' SVG elements, what was last written to each, and what it shows. */
export interface BoardFollower {
  /** Find the board's elements in the page after the view drew its world: the model was made at this time, so it already shows `state`. */
  bind(root: ParentNode, model: TurnModel, state: ReplayBoardState | undefined): void;
  /** Follow the clock to `t`: write the board if what it shows changed (and, while playing, if the clock has not just been written). */
  follow(t: number, model: TurnModel, change?: ReplayChange): void;
  clear(): void;
}

/** The follower of a replay's scoreboard. It is idle (no elements, no work) where the view has none. */
export function boardFollower(timeline: ReplayTimeline, now: () => number): BoardFollower {
  let found = new Map<string, { svg: Element; face: HTMLElement; written: string }>();
  let shown = "";
  let state: ReplayBoardState | undefined;
  let wroteAt = Number.NEGATIVE_INFINITY;
  /** The figures on the faces as text, for a test and for a reader of the page's markup. */
  const label = (s: ReplayBoardState): void => {
    for (const [id, one] of found) {
      if (!FACE.test(id)) continue;
      one.face.dataset.score = `${s.score[0]}-${s.score[1]}`;
      one.face.dataset.period = s.period === undefined ? "" : String(s.period);
      one.face.dataset.clock = s.clock;
      if (s.strength === undefined) {
        delete one.face.dataset.strength;
        delete one.face.dataset.penalties;
      } else {
        one.face.dataset.strength = s.strength.join("-");
        one.face.dataset.penalties = (s.penalties ?? []).map((p) => `${p.team} ${p.left}`).join(", ");
      }
    }
  };
  return {
    bind(root, model, at) {
      found = new Map();
      state = at;
      if (at === undefined) return;
      const written = new Map(model.planes.filter((p) => p.kind === "hung-board").map((p) => [p.id, p.svg]));
      for (const face of root.querySelectorAll<HTMLElement>(".ky-up-hung-board")) {
        const svg = face.querySelector(":scope > svg");
        const id = face.dataset.part ?? "";
        if (svg !== null && written.has(id)) found.set(id, { svg, face, written: written.get(id) ?? "" });
      }
      shown = boardKey(at);
      wroteAt = now();
      label(at);
    },
    follow(t, model, change) {
      if (found.size === 0) return;
      const next = replayBoard(timeline, t);
      const key = boardKey(next);
      if (key === shown) return;
      const moved = state === undefined || state.score[0] !== next.score[0] || state.score[1] !== next.score[1] || state.period !== next.period;
      const at = now();
      if (!moved && change?.reason === "tick" && change.state.playing && at - wroteAt < CLOCK_EVERY) return;
      shown = key;
      state = next;
      wroteAt = at;
      for (const hung of hungBoards(model)) {
        for (const plane of hungBoardPlanes(hung, next)) {
          const one = found.get(plane.id);
          if (one === undefined || one.written === plane.svg) continue;
          one.svg.innerHTML = plane.svg;
          one.written = plane.svg;
        }
      }
      label(next);
    },
    clear() {
      found = new Map();
      state = undefined;
    },
  };
}
