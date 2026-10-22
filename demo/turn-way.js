// What every 3D page of the demo shares about how a view turns: it waits still and turns while the pointer is over it (a tap on a phone starts it and a second tap holds it), at half the speed the package turns
// by when it is not told, and it can turn either way, kept in the address as `dir=cw`. Nothing here is sent anywhere or stored: the address is the only memory.

/** The auto-turn's speed on the demo's pages, in degrees a second: half of the 12 the package turns by when it is not told. */
export const DEMO_SPEED = 6;

/** The direction the address asks for: `dir=cw` is clockwise, and anything else is how the view has always turned, counterclockwise. */
export const wayFromAddress = (params = new URLSearchParams(location.search)) => (params.get("dir") === "cw" ? "clockwise" : "counterclockwise");

let way = wayFromAddress();

/** The direction now, which is the address's until a Reverse button changes it. */
export const currentWay = () => way;

/** Remember a direction the view reported (the Reverse button, `setDirection`), for the pages that write the address themselves. */
export function rememberWay(direction) {
  way = direction === "clockwise" ? "clockwise" : "counterclockwise";
}

/** Write the direction into an address's parameters (`dir=cw` when clockwise, nothing otherwise): a page calls this on the parameters it is about to write. */
export function writeWay(next, key = "dir") {
  if (way === "clockwise") next.set(key, "cw");
  else next.delete(key);
  return next;
}

/**
 * The settings every page gives its view for the way it turns: the speed, the direction the address asks for, and the address kept up to date when the direction changes (`write` is the page's own function that
 * writes its address).
 */
export function wayOf(write) {
  return {
    speed: DEMO_SPEED,
    direction: way,
    onDirectionChange: (direction) => {
      rememberWay(direction);
      write?.();
    },
  };
}

/**
 * The pointer over a 3D view turns it and leaving it stops it; a tap (a touch or a pen, not a drag) starts it and a second tap holds it. A reader who prefers reduced motion is never turned for by the pointer.
 * `view` is the element of the view itself (the buttons round it are not part of it, so pressing Auto-turn there is the reader's own choice and goes on after the pointer has left); `control` is what `mountKyogijoTurn`
 * gives back (anything with `playing`, `play()` giving whether it plays, `pause()` and `togglePlay()`; `where` says where it has got to, so that a drag that ended on the view is not taken for a tap). Gives an object whose `on` says whether the turn running now is the pointer's, for a page that records the reader's own choice only.
 */
export function turnOnHover(view, control, where = () => control.view().yaw) {
  const hover = { on: false };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let lastPointer = "mouse";
  let downYaw = 0;
  const yaw = where;
  view.addEventListener("pointerdown", (event) => {
    lastPointer = event.pointerType;
    downYaw = yaw();
  });
  view.addEventListener("pointerenter", (event) => {
    // A reader who has used the Auto-turn button or the Space key has chosen for themselves: the pointer coming back over the view does not turn it again behind their back.
    if (event.pointerType !== "mouse" || reduced.matches || control.playing || chosen) return;
    hover.on = true;
    if (!control.play()) hover.on = false;
  });
  view.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "mouse" || !hover.on) return;
    hover.on = false;
    control.pause();
  });
  view.addEventListener("click", () => {
    if (lastPointer === "mouse") return;
    // A drag that ended on the view is not a tap.
    if (Math.abs(((yaw() - downYaw + 540) % 360) - 180) > 3) return;
    hover.on = false;
    control.togglePlay();
  });
  return hover;
}

/** Whether the reader has pressed Auto-turn (or the Space key) on this page: from then on the button is the only thing that starts the turn, and hovering does not. Kept for the page, so that a view mounted again for another choice does not forget it. */
let chosen = false;

/** A view mounted in `host`: the element `turnOnHover` listens on is the 3D view's own. */
export function hoverOf(host, control) {
  const view = host.querySelector(".ky-turn-view");
  if (view === null) return { on: false };
  const hover = turnOnHover(view, control);
  // The Auto-turn button (and Space on the view) is the reader's own choice, either way: pressed to stop, it stops for good, and the pointer passing over the view afterwards starts nothing.
  const own = () => {
    chosen = true;
    hover.on = false;
  };
  host.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest('button[data-act="play"]') !== null) own();
  });
  host.addEventListener("keydown", (event) => {
    if (event.key === " ") own();
  });
  return hover;
}

/**
 * The camera a reader has chosen, kept when the page has to mount its 3D view again (another venue, another configuration, the roof, flat and back): the view (turn, tilt, zoom) and whether the auto-turn was running go
 * to the new view, so that only what must change (the frame it fits) changes. The turn the reader made by hand is also kept in the address, as `yaw`, `pitch` and `zoom` (under `prefix`, for a page with more than one view);
 * a viewpoint chosen from the list or the view's own buttons takes them out again, since the viewpoint says it. Nothing here is sent anywhere or stored.
 */
export function keepCamera(prefix = "", params = new URLSearchParams(location.search)) {
  const names = ["yaw", "pitch", "zoom"];
  const fromAddress = {};
  for (const name of names) {
    const text = params.get(`${prefix}${name}`);
    const value = text === null || text.trim() === "" ? Number.NaN : Number(text);
    if (Number.isFinite(value)) fromAddress[name] = value;
  }
  /** What the address and the hand have chosen: the view the reader turned by hand, or nothing while a viewpoint says it. */
  let held = Object.keys(fromAddress).length === 0 ? undefined : fromAddress;
  /** What the view that was destroyed last was at, to open the next one on. */
  let carried;
  let playing = false;
  return {
    /** Call before `destroy()`: the view now and whether it turned. */
    carry(turn) {
      if (turn === undefined || turn.mode !== "3d") return;
      carried = turn.view();
      playing = turn.playing === true;
    },
    /** The settings that open a view where the last one was (the address's turn at the first mount, the carried view after): spread them into the mount's settings. */
    settings() {
      const view = carried ?? held;
      return { ...(view === undefined ? {} : { view }), ...(playing ? { autoPlay: true } : {}) };
    },
    /** For the view's `onChange`: remember a turn made by hand, and forget it when a viewpoint was chosen. */
    changed(view, preset, write) {
      held = preset === undefined ? { yaw: view.yaw, pitch: view.pitch, zoom: view.zoom } : undefined;
      carried = undefined;
      write?.();
    },
    /** A viewpoint was chosen from the page's own list. */
    chose(write) {
      held = undefined;
      carried = undefined;
      write?.();
    },
    /** Write the turn the reader made by hand into an address's parameters (rounded to what the eye can tell apart). */
    write(next) {
      for (const name of names) {
        if (held === undefined) next.delete(`${prefix}${name}`);
        else next.set(`${prefix}${name}`, String(Math.round(held[name] * (name === "zoom" ? 100 : 10)) / (name === "zoom" ? 100 : 10)));
      }
      return next;
    },
  };
}
