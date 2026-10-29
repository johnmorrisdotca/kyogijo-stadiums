// The address a demo page writes as the reader chooses: `history.replaceState`, kept under the limit a browser sets. Nothing here is sent anywhere or stored.

/**
 * Write the address the page has come to, as `history.replaceState` does, but never so often that the browser refuses: WebKit throws a SecurityError from the hundred-and-first call in ten seconds, and a
 * reader who holds an arrow key, or presses a turn button over and over, calls it thirty times a second. Writes go straight through while there is room (so a test or a reader sees the address at once);
 * past ninety in ten seconds only the latest address is kept and written a moment later, and a browser that still refuses is not heard from.
 */
const writes = [];
let waiting;
let latest;
const WINDOW_MS = 10_000;
const ROOM = 90;
function flushAddress() {
  waiting = undefined;
  if (latest === undefined) return;
  const url = latest;
  latest = undefined;
  writes.push(Date.now());
  try {
    history.replaceState(history.state, "", url);
  } catch {
    // The browser would not take it: the address is a convenience, and the page goes on.
  }
}
export function replaceAddress(url) {
  const now = Date.now();
  while (writes.length > 0 && now - writes[0] > WINDOW_MS) writes.shift();
  latest = url;
  if (writes.length < ROOM) flushAddress();
  else if (waiting === undefined) waiting = setTimeout(flushAddress, WINDOW_MS - (now - writes[0]) + 20);
}
