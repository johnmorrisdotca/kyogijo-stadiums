// A feed fetched by the reader's own browser, from an address the reader gave: never through a server of ours, with no cookie and no referrer, and nothing kept beyond the open page (no cache, no storage).
// A refusal is said in plain words: a server that does not let another site's page read it (CORS), a status, an answer too large. A live follow asks again no faster than every ten seconds, only while the page
// is shown, waits longer after an error, and stops when the game is over or the server says no (403, 429).
import { FeedError, type FeedFormat, type FeedGame } from "./feeds.core.ts";
import { readFeedText } from "./feeds.ts";

/** What a fetch of a feed can be told. */
export interface FeedFetchOptions {
  /** The format to read the answer in; `auto` (the default) tells the formats apart. */
  format?: FeedFormat;
  /** The address a relative one is read against: the page's own by default. */
  base?: string;
  /** The most an answer may be, in bytes: 20 MB by default. */
  most?: number;
  /** Stop the request. */
  signal?: AbortSignal;
  /** The function that fetches: the browser's own `fetch` by default (a test gives its own). */
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}

/** The most an answer may be, by default: 20 MB. */
export const FEED_MOST = 20 * 1024 * 1024;

/** An address the reader gave, as a URL: `http` or `https` only (a relative address is read against the page's). Throws a `FeedError` (`address`) for anything else. */
export function feedAddress(url: string, base?: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url.trim(), base ?? (typeof location === "undefined" ? undefined : location.href));
  } catch {
    throw new FeedError("address", "not an address: give one that starts with https://");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new FeedError("address", "only an http or https address can be read");
  if (parsed.username !== "" || parsed.password !== "") throw new FeedError("address", "an address with a login in it is not read: give the feed's address alone");
  return parsed;
}

/** Fetch an address's answer as text, by the reader's browser: no cookie, no referrer, no cache. */
export async function fetchFeedText(url: string, options: Omit<FeedFetchOptions, "format"> = {}): Promise<string> {
  const address = feedAddress(url, options.base);
  const get = options.fetch ?? ((input: string, init?: RequestInit) => fetch(input, init));
  const most = options.most ?? FEED_MOST;
  let answer: Response;
  try {
    answer = await get(address.href, { credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", mode: "cors", redirect: "follow", signal: options.signal });
  } catch (error) {
    if ((error as { name?: string } | null)?.name === "AbortError") throw error;
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw offline
      ? new FeedError("network", "the browser is offline: the feed could not be reached")
      : new FeedError("cors", "the browser could not read the answer: the server does not let a page of another site read it (CORS), or it could not be reached. Paste the answer or pick it as a file, or point at a relay of your own");
  }
  if (!answer.ok) throw new FeedError("http", `the server answered ${answer.status}${answer.status === 403 || answer.status === 429 ? ": it does not want to be asked now" : ""}`, answer.status);
  const length = Number(answer.headers.get("content-length"));
  if (Number.isFinite(length) && length > most) throw new FeedError("too-large", `the answer is ${Math.round(length / 1e6)} MB: more than this page reads`);
  const text = await answer.text();
  if (text.length > most) throw new FeedError("too-large", "the answer is larger than this page reads");
  return text;
}

/**
 * Fetch a feed from an address the reader gave and read it into a game. Throws a `FeedError` that says what was wrong: `address`, `cors`, `network`, `http` (with its `status`), `too-large`, `format` or `empty`.
 * @example
 * ```ts
 * import { loadFeed } from "@johnmorrisdotca/kyogijo-stadiums/feeds";
 * const stub = async () => new Response(JSON.stringify({ frames: [{ t: 0, objects: [] }, { t: 5, objects: [] }] }));
 * const game = await loadFeed("https://example.com/feed.json", { fetch: stub });
 * console.log(game.format, game.timeline.frames.length);
 * const refused = async () => { throw new TypeError("Failed to fetch"); };
 * await loadFeed("https://example.com/feed.json", { fetch: refused }).catch((error) => console.log(error.kind));
 * // kyogijo 2
 * // cors
 * ```
 */
export async function loadFeed(url: string, options: FeedFetchOptions = {}): Promise<FeedGame> {
  return readFeedText(await fetchFeedText(url, options), options.format);
}

/** What a live follow can be told, beyond a fetch's options. */
export interface FeedFollowOptions extends FeedFetchOptions {
  /** Seconds between asks: 15 by default, never less than 10. */
  every?: number;
  /** A new answer, read: only when it differs from the one before. */
  onGame?: (game: FeedGame) => void;
  /** An answer that could not be had or read. The follow goes on, waiting longer, unless it is a 403 or a 429. */
  onError?: (error: FeedError) => void;
  /** Told each time the follow's state changes. */
  onState?: (state: FeedFollowState) => void;
  /** The document whose visibility it follows: the page's by default. */
  doc?: Document;
}

/** What a follow is doing: `asking`, `waiting` for the next ask, `hidden` (the page is not shown: no ask until it is), `ended` (the game is over), `refused` (403 or 429) or `stopped`. */
export type FeedFollowState = "asking" | "waiting" | "hidden" | "ended" | "refused" | "stopped";

/** A live follow: its state, and a way to stop it. */
export interface FeedFollow {
  state(): FeedFollowState;
  stop(): void;
}

/** The least and the greatest wait between asks, in seconds. */
export const FOLLOW_EVERY: readonly [number, number] = [10, 120];

/**
 * Follow a feed live: ask the address now and again every `every` seconds (15 by default, never less than 10) while the page is shown, and tell `onGame` of each answer that changed. Asking stops while the page is
 * hidden and starts again when it is shown; after an error the wait doubles, up to two minutes; a 403 or a 429 stops it (`refused`), and so does a game the feed says is over (`ended`). One timer at most at any time.
 */
export function followFeed(url: string, options: FeedFollowOptions = {}): FeedFollow {
  const doc = options.doc ?? (typeof document === "undefined" ? undefined : document);
  const win = doc?.defaultView ?? (typeof window === "undefined" ? undefined : window);
  const every = Math.min(FOLLOW_EVERY[1], Math.max(FOLLOW_EVERY[0], typeof options.every === "number" && Number.isFinite(options.every) ? options.every : 15));
  let state: FeedFollowState = "waiting";
  let wait = every;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = "";
  let due = 0;
  let controller: AbortController | undefined;
  const set = (next: FeedFollowState): void => {
    if (next === state) return;
    state = next;
    options.onState?.(state);
  };
  const over = (): boolean => state === "ended" || state === "refused" || state === "stopped";
  /** Stop for good: no timer, no listener, no request. */
  const finish = (next: "ended" | "refused" | "stopped"): void => {
    if (timer !== undefined) (win ?? globalThis).clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    doc?.removeEventListener("visibilitychange", onVisible);
    set(next);
  };
  const hidden = (): boolean => doc?.visibilityState === "hidden";
  const schedule = (seconds: number): void => {
    if (over()) return;
    due = Date.now() + seconds * 1000;
    if (hidden()) {
      set("hidden");
      return;
    }
    set("waiting");
    timer = (win ?? globalThis).setTimeout(ask, seconds * 1000);
  };
  async function ask(): Promise<void> {
    timer = undefined;
    if (over()) return;
    if (hidden()) {
      set("hidden");
      return;
    }
    set("asking");
    controller = typeof AbortController === "function" ? new AbortController() : undefined;
    try {
      const text = await fetchFeedText(url, { ...options, signal: controller?.signal ?? options.signal });
      if (over()) return;
      if (text !== last) {
        const game = readFeedText(text, options.format);
        last = text;
        options.onGame?.(game);
        if (game.ended) {
          finish("ended");
          return;
        }
      }
      wait = every;
      schedule(wait);
    } catch (error) {
      if (over()) return;
      if (!(error instanceof FeedError)) {
        if ((error as { name?: string } | null)?.name === "AbortError") return;
        throw error;
      }
      options.onError?.(error);
      if (error.kind === "http" && (error.status === 403 || error.status === 429)) {
        finish("refused");
        return;
      }
      if (error.kind === "address") {
        finish("stopped");
        return;
      }
      wait = Math.min(FOLLOW_EVERY[1], wait * 2);
      schedule(wait);
    }
  }
  // Shown again: ask now if the time came while it was hidden, else wait for what is left of it.
  const onVisible = (): void => {
    if (over() || hidden() || state !== "hidden") return;
    const left = Math.max(0, (due - Date.now()) / 1000);
    if (left === 0) void ask();
    else schedule(left);
  };
  doc?.addEventListener("visibilitychange", onVisible);
  void ask();
  return {
    state: () => state,
    stop() {
      if (state !== "stopped") finish("stopped");
    },
  };
}
