// The broadcast view in a page: the 3D view of the mat (the Broadcast camera by default, with every control the other 3D views have) in a 16:9 box, and over it, at its side, the board of the officials like a television
// graphic. The board is the same drawing as the flat broadcast picture's (`judging.board.ts`), laid over the view by the page's own layout, so it scales evenly with the view and never takes the pointer: a drag on it
// turns the mat. On a narrow screen the board has no room beside the mat without covering it, so it stands under the view instead. Where the browser cannot turn the view, the flat broadcast picture, which carries its
// own board, is shown alone.
import { judgingBoard } from "./judging.board.ts";
import { judgingSetting } from "./judging.ts";
import { mountJudgingTurn } from "./judging.turn.ts";
import type { JudgingOptions } from "./judging.types.ts";
import type { KyogijoTurn } from "./turn.dom.ts";
import type { TurnSettings } from "./turn.model.ts";

/** The stylesheet of the broadcast view's layout: the view 16:9, the board over its top right corner (a share of the view's width, so it grows and shrinks with it), under it where the view is narrower than 640 px. */
export const KYOGIJO_JUDGING_BROADCAST_STYLE = `
.ky-ju-bc{position:relative;container-type:inline-size;width:100%}
.ky-ju-bc{--ky-ju-bc-bg:#dcd8c9}
@media (prefers-color-scheme:dark){html:not([data-theme=light]) .ky-ju-bc{--ky-ju-bc-bg:#1b1f1c}}
html[data-theme=dark] .ky-ju-bc{--ky-ju-bc-bg:#1b1f1c}
.ky-ju-bc .ky-turn[data-theme=light] .ky-turn-view{background:#dcd8c9}
.ky-ju-bc .ky-turn[data-theme=dark] .ky-turn-view{background:#1b1f1c}
.ky-ju-bc .ky-turn .ky-turn-view{--ky-turn-ratio:16/9;min-height:0;background:var(--ky-ju-bc-bg);border-radius:12px}
.ky-ju-bc-board{position:absolute;z-index:40;top:3cqw;right:2cqw;width:30cqw;pointer-events:none}
.ky-ju-bc-board svg{display:block;width:100%;height:auto}
.ky-ju-bc-board[hidden]{display:none}
@container (max-width:639px){.ky-ju-bc-board{position:static;width:100%;max-width:480px;margin:8px auto 0}}
`.trim();

/**
 * Mount an assignment as the broadcast view: the 3D view of the mat, 16:9, with the board of the officials over it at its side. It returns the same handle as every 3D view (`preset`, `set`, `update`, `play`, `destroy`):
 * `update` takes the next options and redraws both the view and the board. The options are `JudgingOptions`; `view` is always `broadcast` here. Pass `{ preset: "end" }` to open on another viewpoint.
 * @example
 * ```ts no-run
 * import { mountJudgingBroadcast } from "@johnmorrisdotca/kyogijo-stadiums/judging";
 * const view = mountJudgingBroadcast(document.querySelector("#mat")!, { style: "kata", mat: 1, mats: [{ label: "Mat 1", line: "Round 2", officials: [{ seat: 1, name: "Aiko Mori", id: "J-1042" }] }] });
 * view.preset("corner");
 * ```
 */
export function mountJudgingBroadcast(host: HTMLElement, options: JudgingOptions, settings: TurnSettings = {}): KyogijoTurn<JudgingOptions> {
  const asked = (o: JudgingOptions): JudgingOptions => ({ ...o, view: "broadcast" });
  // Held to what it may be before anything is written.
  judgingSetting(asked(options));
  host.innerHTML = `<div class="ky-ju-bc"><style>${KYOGIJO_JUDGING_BROADCAST_STYLE}</style><div class="ky-ju-bc-view"></div><div class="ky-ju-bc-board"></div></div>`;
  const viewHost = host.querySelector<HTMLElement>(".ky-ju-bc-view")!;
  const boardHost = host.querySelector<HTMLElement>(".ky-ju-bc-board")!;
  const turn = mountJudgingTurn(viewHost, asked(options), settings);
  const paint = (o: JudgingOptions): void => {
    boardHost.hidden = turn.mode !== "3d";
    boardHost.innerHTML = turn.mode === "3d" ? judgingBoard(asked(o)) : "";
  };
  paint(options);
  return {
    get mode() {
      return turn.mode;
    },
    get playing() {
      return turn.playing;
    },
    view: () => turn.view(),
    set: (view, glide) => turn.set(view, glide),
    preset: (name) => turn.preset(name),
    reset: () => turn.reset(),
    update: (next) => {
      turn.update(asked(next));
      paint(next);
    },
    play: () => turn.play(),
    pause: () => turn.pause(),
    direction: () => turn.direction(),
    setDirection: (direction) => turn.setDirection(direction),
    togglePlay: () => turn.togglePlay(),
    get quality() {
      return turn.quality;
    },
    get tier() {
      return turn.tier;
    },
    setQuality: (quality) => turn.setQuality(quality),
    svg: () => turn.svg(),
    destroy: () => {
      turn.destroy();
      host.replaceChildren();
    },
  };
}
