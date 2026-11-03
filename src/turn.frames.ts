// The animation frames of a 3D view: one frame a frame for everything that moves on it (the auto-turn, a replay, a race), and the one-time measure of the display's own interval. Each can be stopped at any moment,
// a request made in the same tick as the stop included, and once stopped nothing of it asks for a frame again. The page's window is passed in, so a test can count what is asked with a window of its own.

/** The part of a window the frames use. */
export interface FrameWindow {
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(id: number): void;
  setTimeout(callback: () => void, ms: number): number;
  clearTimeout(id: number | undefined): void;
}

/** One animation frame a frame, shared: what `frameBatch` gives back. */
export interface FrameBatch {
  /** Ask for the next frame: every callback asked for before it comes runs in that one frame. Gives an id for `cancel`. */
  request(callback: FrameRequestCallback): number;
  /** Take a callback back: it does not run, even when its frame has begun; the window's frame is cancelled when nothing is left. */
  cancel(id: number): void;
  /** Take everything back and cancel the window's frame: nothing asked for runs. */
  clear(): void;
  /** How many callbacks wait for the next frame. */
  readonly waiting: number;
}

/**
 * One window frame for everything a view moves: callbacks asked for in the same frame run together in the next. A callback taken back while its frame runs (one before it stopped the view) does not run, and `clear`
 * leaves nothing that can ask for a frame.
 */
export function frameBatch(win: Pick<FrameWindow, "requestAnimationFrame" | "cancelAnimationFrame"> | null): FrameBatch {
  const queued = new Map<number, FrameRequestCallback>();
  /** The callbacks of the frame that is running, until each has run: one taken back in the meantime is left out. */
  let running: Map<number, FrameRequestCallback> | undefined;
  let next = 0;
  let pending = 0;
  const flush = (stamp: number): void => {
    pending = 0;
    running = new Map(queued);
    queued.clear();
    for (const [id, callback] of [...running]) {
      if (running?.has(id) !== true) continue;
      running.delete(id);
      callback(stamp);
    }
    running = undefined;
  };
  const drop = (): void => {
    if (pending !== 0) win?.cancelAnimationFrame(pending);
    pending = 0;
  };
  return {
    request(callback) {
      next += 1;
      queued.set(next, callback);
      if (pending === 0 && win !== null) pending = win.requestAnimationFrame(flush);
      return next;
    },
    cancel(id) {
      queued.delete(id);
      running?.delete(id);
      if (queued.size === 0) drop();
    },
    clear() {
      queued.clear();
      running?.clear();
      drop();
    },
    get waiting() {
      return queued.size;
    },
  };
}

/** The measure of the display's interval: what `displayProbe` gives back. */
export interface DisplayProbe {
  /** Stop it, wherever it is (waiting to begin, or between two frames): it asks for nothing after. */
  stop(): void;
}

/**
 * Measure the display's own interval once, a moment after a view is mounted: wait `delay` ms, then time `count` idle frames and give the lower decile of their intervals to `done` (a busy moment does not count). A hidden
 * page starts over when it is shown. `stop` ends it at once.
 */
export function displayProbe(win: FrameWindow, hidden: () => boolean, done: (ms: number) => void, delay = 350, count = 24): DisplayProbe {
  let timer: number | undefined;
  let frame: number | undefined;
  let stopped = false;
  const found: number[] = [];
  let before: number | undefined;
  const wait = (ms: number): void => {
    timer = win.setTimeout(() => {
      timer = undefined;
      if (!stopped) frame = win.requestAnimationFrame(step);
    }, ms);
  };
  function step(stamp: number): void {
    frame = undefined;
    if (stopped) return;
    if (hidden()) {
      // Hidden: start over when it can be seen.
      found.length = 0;
      before = undefined;
      wait(400);
      return;
    }
    if (before !== undefined) found.push(stamp - before);
    before = stamp;
    if (found.length < count) frame = win.requestAnimationFrame(step);
    else done([...found].sort((a, b) => a - b)[Math.floor(found.length * 0.1)]);
  }
  wait(delay);
  return {
    stop() {
      stopped = true;
      if (timer !== undefined) win.clearTimeout(timer);
      if (frame !== undefined) win.cancelAnimationFrame(frame);
      timer = undefined;
      frame = undefined;
    },
  };
}
