// A feed fetched by the reader's own browser, from an address the reader gave: never through a server of ours, with no cookie and no referrer, and nothing kept beyond the open page (no cache, no storage).
// A refusal is said in plain words: a server that does not let another site's page read it (CORS), a status, an answer too large.
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
