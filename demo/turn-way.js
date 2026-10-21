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
    if (event.pointerType !== "mouse" || reduced.matches || control.playing) return;
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

/** A view mounted in `host`: the element `turnOnHover` listens on is the 3D view's own. */
export function hoverOf(host, control) {
  const view = host.querySelector(".ky-turn-view");
  return view === null ? { on: false } : turnOnHover(view, control);
}
