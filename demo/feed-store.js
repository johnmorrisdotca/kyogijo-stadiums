/* global indexedDB */
// Feed files the reader dropped or picked, kept in this browser so that they are still there after a reload: the list (name, game, sport, date, size) and the feeds in localStorage while they add up to no more than
// about 4 MB, and in IndexedDB past that (localStorage holds about 5 MB in all), or when localStorage refuses one. Written only when a file is dropped or picked, or one is removed: never on a timer. Nothing leaves the browser. Every read and write is in a try, so a browser that
// keeps nothing (a private window, storage turned off, a full quota) still plays a dropped feed: it is only not kept.

const LIST = "kyogijo.feeds";
const KEY = (id) => `kyogijo.feed.${id}`;
/** While the feeds in localStorage add up to no more than this many characters, a new one goes there too; past it, in IndexedDB. */
export const LOCAL_MOST = 4_000_000;
const DB = "kyogijo-feeds";
const STORE = "feeds";

/** @typedef {{ id: string, name: string, game: string, sport: string, date: string, size: number, where: "local" | "db" }} SavedFeed */

/** The kept feeds, newest first: empty where the browser keeps nothing. @returns {SavedFeed[]} */
export function savedFeeds() {
  try {
    const list = JSON.parse(localStorage.getItem(LIST) ?? "[]");
    return Array.isArray(list) ? list.filter((f) => typeof f?.id === "string" && typeof f.name === "string" && Number.isFinite(f.size)) : [];
  } catch {
    return [];
  }
}

const writeList = (list) => {
  try {
    localStorage.setItem(LIST, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
};

/** IndexedDB's store, opened for one act; `undefined` where there is none. */
function db() {
  return new Promise((done) => {
    try {
      const open = indexedDB.open(DB, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(STORE);
      open.onsuccess = () => done(open.result);
      open.onerror = () => done(undefined);
      open.onblocked = () => done(undefined);
    } catch {
      done(undefined);
    }
  });
}

/** Do one thing in IndexedDB's store and wait until it is written; `undefined` when it could not be done. */
async function inDb(mode, act) {
  const base = await db();
  if (base === undefined) return undefined;
  try {
    return await new Promise((done) => {
      const tx = base.transaction(STORE, mode);
      const request = act(tx.objectStore(STORE));
      tx.oncomplete = () => done(request.result ?? null);
      tx.onerror = () => done(undefined);
      tx.onabort = () => done(undefined);
    });
  } catch {
    return undefined;
  } finally {
    base.close();
  }
}

const dropText = async (feed) => {
  if (feed.where === "local") {
    try {
      localStorage.removeItem(KEY(feed.id));
    } catch {
      // Nothing to take away.
    }
  } else await inDb("readwrite", (store) => store.delete(feed.id));
};

/**
 * Keep a feed: its text, and a line in the list. A file of the same name and size replaces the one kept before. Gives the kept feed, or `undefined` when this browser keeps nothing.
 * @param {{ name: string, game: string, sport: string, text: string }} feed
 * @returns {Promise<SavedFeed | undefined>}
 */
export async function saveFeed({ name, game, sport, text }) {
  const before = savedFeeds().find((f) => f.name === name && f.size === text.length);
  if (before !== undefined) await removeFeed(before.id);
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  let where;
  const local = savedFeeds().filter((f) => f.where === "local").reduce((sum, f) => sum + f.size, 0);
  if (local + text.length <= LOCAL_MOST) {
    try {
      localStorage.setItem(KEY(id), text);
      where = "local";
    } catch {
      where = undefined;
    }
  }
  if (where === undefined && (await inDb("readwrite", (store) => store.put(text, id))) !== undefined) where = "db";
  if (where === undefined) return undefined;
  const saved = { id, name, game, sport, date: new Date().toISOString(), size: text.length, where };
  if (!writeList([saved, ...savedFeeds()])) {
    await dropText(saved);
    return undefined;
  }
  return saved;
}

/** The text of a kept feed, or `undefined` when it is gone. @param {string} id */
export async function loadFeedText(id) {
  const feed = savedFeeds().find((f) => f.id === id);
  if (feed === undefined) return undefined;
  if (feed.where === "local") {
    try {
      return localStorage.getItem(KEY(id)) ?? undefined;
    } catch {
      return undefined;
    }
  }
  const text = await inDb("readonly", (store) => store.get(id));
  return typeof text === "string" ? text : undefined;
}

/** Take a kept feed away: its text and its line. @param {string} id */
export async function removeFeed(id) {
  const feed = savedFeeds().find((f) => f.id === id);
  if (feed === undefined) return;
  await dropText(feed);
  writeList(savedFeeds().filter((f) => f.id !== id));
}

/** Take every kept feed away. */
export async function removeAllFeeds() {
  for (const feed of savedFeeds()) await dropText(feed);
  writeList([]);
}

/** A size as a reader reads it: `850 KB`, `3.2 MB`. */
export const sizeText = (chars) => (chars < 1_000_000 ? `${Math.max(1, Math.round(chars / 1000))} KB` : `${(chars / 1_000_000).toFixed(1)} MB`);
