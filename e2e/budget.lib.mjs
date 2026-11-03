/* global EventTarget, Node */
// What the browser tests of a replay count on a page: every animation frame asked for (and how many within one frame), and the listeners that can still be called. Shared by the replay's own
// tests (replay3d.demo.mjs) and the Play a game toggles' (game.demo.mjs).

/**
 * Counts that the page keeps from its first line: every animation frame asked for (and the frame it was asked in, by the time a callback was given), and the listeners added and taken away
 * on every event target.
 */
export const COUNTERS = () => {
  const ask = window.requestAnimationFrame.bind(window);
  const drop = window.cancelAnimationFrame.bind(window);
  const pending = new Set();
  window.__frames = { asked: 0, inFrame: new Map(), now: undefined };
  window.requestAnimationFrame = (callback) => {
    const f = window.__frames;
    f.asked += 1;
    if (f.now !== undefined) f.inFrame.set(f.now, (f.inFrame.get(f.now) ?? 0) + 1);
    const id = ask((stamp) => {
      pending.delete(id);
      f.now = stamp;
      try {
        callback(stamp);
      } finally {
        f.now = undefined;
      }
    });
    pending.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    pending.delete(id);
    drop(id);
  };
  window.__pending = () => pending.size;
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  // A listener counts while its target can still call it: the window, the document, a media query, or an element still in the page. One on an element that has left the page goes with it.
  const live = new Map();
  window.__listeners = () => {
    let n = 0;
    for (const ref of live.values()) {
      const target = ref.deref();
      if (target !== undefined && (!(target instanceof Node) || target === document || target.isConnected)) n += 1;
    }
    return n;
  };
  const key = (target, type, listener, options) => {
    const capture = typeof options === "boolean" ? options : options?.capture === true;
    let ids = keys.get(target);
    if (ids === undefined) keys.set(target, (ids = new Map()));
    const name = `${type}|${capture}`;
    let byListener = ids.get(name);
    if (byListener === undefined) ids.set(name, (byListener = new Map()));
    return byListener;
  };
  const keys = new WeakMap();
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (listener !== null && listener !== undefined) {
      const byListener = key(this, type, listener, options);
      if (!byListener.has(listener)) {
        const id = Symbol(type);
        byListener.set(listener, id);
        live.set(id, new WeakRef(this));
      }
    }
    return add.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    const byListener = key(this, type, listener, options);
    const id = byListener.get(listener);
    if (id !== undefined) {
      live.delete(id);
      byListener.delete(listener);
    }
    return remove.call(this, type, listener, options);
  };
};

/** Animation frames asked for in the next `ms` milliseconds, and the most asked for within any one frame. */
export const framesOver = (page, ms) =>
  page.evaluate(async (wait) => {
    const f = window.__frames;
    const asked = f.asked;
    f.inFrame.clear();
    await new Promise((done) => setTimeout(done, wait));
    return { asked: f.asked - asked, most: Math.max(0, ...f.inFrame.values()) };
  }, ms);
