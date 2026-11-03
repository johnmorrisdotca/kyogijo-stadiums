// Play a game: one toggle, shared by every view of the demo that can play an example game (the home page's arena, its Try it surface, and the real arenas' page). The games and the surface each
// is played on are the index's (`game.js`): the button shows only while the surface on show has a game there and the view on show can play it, and is hidden, not greyed, otherwise. Off until
// pressed; the game is loaded the first time it is pressed (once for the whole page: `loadGame` keeps it), and pressing again takes it away. Nothing runs here on a timer: the replay is the
// package's own (`view.replay`, `mount.replay`), which asks for frames only while it plays in sight, and this only follows its clock for the score.
import { gameTimeline, gamesFor, loadGame, loadGames, periodAt, scoreAt } from "./game.js";

/**
 * @typedef {object} GameHost what plays the game, as the page has it
 * @property {() => string} sport the surface on show (a key of `SPORTS`)
 * @property {() => boolean} can whether the view on show can play a game now (a 3D view, or a flat drawing that has its surface)
 * @property {() => ({ replay(timeline: object, settings?: object): any } | undefined)} view what `replay` is asked of now: a 3D view or a mount
 * @property {(game: object | undefined, t: number) => void} [follow] the game's sides (and its score at `t`) to lay over the drawing, or `undefined` to give the page's own back; called when it
 *   starts, when the score or the period changes, and when it stops
 */

/**
 * Mount the toggle on `button` (and a note under the view, if the page has one).
 * @param {object} options
 * @param {HTMLButtonElement} options.button the toggle: its words, `aria-pressed` and `hidden` are written here
 * @param {HTMLElement} [options.note] the line that says what the game is, shown while it plays
 * @param {GameHost} options.host
 * @param {() => "en" | "ja"} options.lang
 * @param {(key: string) => string} options.say the page's words: `gamePlay`, `gamePlayTip` (with `{title}`), `gameGoal` (with `{team}` and `{name}`)
 * @param {boolean} [options.on] on when the page opens (the address said so): it plays once the index says the surface has a game
 * @param {(on: boolean) => void} [options.onChange] told when it is turned on or off, by a press or because the surface or the view can no longer play it
 */
export function playGame({ button, note, host, lang, say, on = false, onChange = () => undefined }) {
  /** The index, once read; until then nothing is shown and nothing is decided. */
  let games;
  /** The game of the surface on show, and the game loaded for it. */
  let entry;
  let game;
  let handle;
  let unfollow;
  /** Where the game was, while the view it played on is made again. */
  let held;
  let score = "";
  let alive = true;
  const goalWords = (values) => say("gameGoal").replace("{team}", values.team).replace("{name}", values.name);
  const available = () => entry !== undefined && host.can();

  function paint() {
    if (!alive) return;
    // Until the index is read the button stays as the page drew it (the build knows whether the surface it drew has a game), so that nothing jumps.
    if (games !== undefined) button.hidden = !available();
    button.textContent = say("gamePlay");
    button.title = entry === undefined ? "" : say("gamePlayTip").replace("{title}", entry.title[lang()]);
    button.setAttribute("aria-pressed", String(on));
    if (note !== undefined) {
      note.hidden = !(on && game !== undefined && handle !== undefined);
      note.textContent = game?.note?.[lang()] ?? "";
    }
  }

  /** The score line and the period: the drawing is told only when one of them changes. */
  function follow(t) {
    if (game === undefined || host.follow === undefined) return;
    const now = `${JSON.stringify(scoreAt(game, t))}|${periodAt(game, t)}`;
    if (now === score) return;
    score = now;
    host.follow(game, t);
  }

  /** Take the replay off the view, keeping where it was (to put it back on a view made again), or not. */
  function detach(keep) {
    held = keep && handle !== undefined ? handle.state() : undefined;
    unfollow?.();
    unfollow = undefined;
    handle?.destroy();
    handle = undefined;
  }

  /** Play the loaded game on the view on show, from where it was if it was somewhere. */
  function attach() {
    if (!alive || !on || game === undefined || handle !== undefined || !available()) return;
    const view = host.view();
    if (view === undefined) return;
    const at = held;
    held = undefined;
    score = "";
    // The sides first, so that the view the replay goes on already has the game's names and colours.
    follow(at?.t ?? game.timeline.frames[0]?.t ?? 0);
    handle = view.replay(gameTimeline(game, lang(), goalWords), at === undefined ? { autoplay: true } : { start: at.t - at.start, speed: at.speed, loop: at.loop, autoplay: at.playing });
    unfollow = handle.subscribe((change) => follow(change.state.t));
    paint();
  }

  /** Take the game away and give the drawing back. */
  function stop() {
    detach(false);
    if (game !== undefined && score !== "") host.follow?.(undefined, 0);
    score = "";
  }

  function turn(next) {
    if (next === on) return;
    on = next;
    if (!on) stop();
    paint();
    onChange(on);
    if (on) start();
  }

  /** Load the surface's game (once for the page) and play it. */
  function start() {
    const wanted = entry;
    if (wanted === undefined) return;
    if (game !== undefined && game.id === wanted.id) {
      attach();
      return;
    }
    loadGame(wanted).then(
      (loaded) => {
        if (!alive || !on || entry !== wanted) return;
        game = { ...loaded, id: wanted.id };
        attach();
      },
      () => turn(false),
    );
  }

  button.addEventListener("click", press);
  function press() {
    turn(!on);
  }

  loadGames().then((read) => {
    if (!alive) return;
    games = read;
    controller.refresh();
  });

  const controller = {
    get on() {
      return on;
    },
    /** Whether the toggle is shown: the surface on show has a game and its view can play it. */
    available: () => games !== undefined && available(),
    /** The index's entry of the game of the surface on show, if it has one. */
    entry: () => entry,
    /** The replay playing now, if one is. */
    replay: () => handle,
    /** The game playing now (loaded, and on the view), if one is. */
    game: () => (handle === undefined ? undefined : game),
    /** Press the toggle. */
    toggle: press,
    /**
     * The surface or the view changed: a surface with no game, or a view that cannot play one, stops it and hides the button; a view that can, and has none on it, gets the game. Call it after
     * the page has drawn the view.
     */
    refresh() {
      if (games === undefined || !alive) return;
      const next = gamesFor(games, host.sport())[0];
      if (next?.id !== entry?.id) {
        stop();
        entry = next;
        if (game !== undefined && game.id !== entry?.id) game = undefined;
      }
      if (on && !available()) turn(false);
      else if (on) start();
      paint();
    },
    /** The view is about to be made again (a flat drawing for a 3D view, or the other way): keep where the game is, so that `refresh` puts it back at the same moment. */
    hold() {
      if (handle !== undefined) detach(true);
    },
    /** The page's language changed: the words, and the game's names, again, from the same moment. */
    relabel() {
      if (handle !== undefined) {
        detach(true);
        attach();
      }
      paint();
    },
    destroy() {
      if (!alive) return;
      stop();
      alive = false;
      button.removeEventListener("click", press);
    },
  };
  return controller;
}
