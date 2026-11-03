// A race feed the user names: read from a URL by the user's own browser, from pasted text or from a file, and followed while a race is going on. Nothing goes through a server of ours (there is none), nothing is kept
// beyond the page, and nothing is sent anywhere but to the address the user typed (and, for an OpenF1-style address, to the same source's pit and driver lists of the same session). A source that does not let a page
// read it (CORS) is said to be so, in words, with the way round it: paste the answer or choose a file.
import { readRaceFeed, type FeedResult, type RaceFeed } from "./circuits.feed.ts";
import { looksLikeOpenF1Laps, openF1Feed, type OpenF1Driver, type OpenF1Pit } from "./circuits.feed.openf1.ts";

/** Why a feed could not be read. */
export type FeedProblemKind = "address" | "blocked" | "refused" | "busy" | "http" | "big" | "json" | "format";

/** A feed that could not be read: what kind of problem, the answer's status if there was one, and a sentence. */
export class RaceFeedError extends Error {
  readonly kind: FeedProblemKind;
  readonly status?: number;
  constructor(kind: FeedProblemKind, message: string, status?: number) {
    super(message);
    this.name = "RaceFeedError";
    this.kind = kind;
    if (status !== undefined) this.status = status;
  }
}

/** The most text a feed may be: 30 MB. */
export const FEED_MAX_BYTES = 30_000_000;

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Read a feed from text (pasted, or a file's): kyogijo's open race timeline, or the lap rows of an OpenF1-style API. The answer is a feed, or a sentence that says why not.
 * @example
 * ```ts
 * import { feedFromText } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * console.log(feedFromText('{"kind":"kyogijo-race","version":1,"cars":[{"id":"a"}],"crossings":[{"car":"a","lap":1,"t":99}]}').ok, feedFromText("not json").ok);
 * // true false
 * ```
 */
export function feedFromText(text: string): FeedResult {
  if (text.length > FEED_MAX_BYTES) return { ok: false, error: "This is too big to be a race feed (over 30 MB)." };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "This is not JSON." };
  }
  if (looksLikeOpenF1Laps(data)) return { ok: true, feed: openF1Feed({ laps: data }) };
  return readRaceFeed(data);
}

/** An address the user typed, if it is one a page may read: http or https, nothing else. */
export function feedAddress(text: string, base?: string): URL | undefined {
  try {
    const url = new URL(text.trim(), base);
    return url.protocol === "https:" || url.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}

async function getJson(fetcher: Fetch, url: string, signal?: AbortSignal): Promise<unknown> {
  let answer: Response;
  try {
    // No cookies, no referrer: the request carries nothing of the page's.
    answer = await fetcher(url, { signal, credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new RaceFeedError("blocked", "The browser could not read this address: the source may not let pages on other sites read it (CORS), or it could not be reached. Paste its answer, or save it and choose the file.");
  }
  if (answer.status === 403 || answer.status === 401) throw new RaceFeedError("refused", `The source refused the request (${answer.status}): it may need a sign-in or a key, or not allow this use.`, answer.status);
  if (answer.status === 429) throw new RaceFeedError("busy", "The source says it has had too many requests (429): wait before trying again.", 429);
  if (!answer.ok) throw new RaceFeedError("http", `The source answered ${answer.status}.`, answer.status);
  const text = await answer.text();
  if (text.length > FEED_MAX_BYTES) throw new RaceFeedError("big", "The answer is too big to be a race feed (over 30 MB).");
  try {
    return JSON.parse(text);
  } catch {
    throw new RaceFeedError("json", "The answer is not JSON.");
  }
}

/** For an OpenF1-style lap address (`…/laps?session_key=…`), the same source's pit and driver addresses for that session. */
export function openF1Siblings(url: URL): { pit: string; drivers: string } | undefined {
  const session = url.searchParams.get("session_key");
  if (!/\/laps\/?$/.test(url.pathname) || session === null) return undefined;
  const base = url.pathname.replace(/\/laps\/?$/, "");
  const at = (name: string): string => `${url.origin}${base}/${name}?session_key=${encodeURIComponent(session)}`;
  return { pit: at("pit"), drivers: at("drivers") };
}

/**
 * Read a race feed from an address the user gave, with the user's browser: kyogijo's open race timeline, or an OpenF1-style lap list (whose pit stops and drivers are then asked for from the same source and session,
 * if it has them). It throws a `RaceFeedError` whose message says what went wrong in words: a source that does not let pages read it (CORS), a refusal (403), too many requests (429), not JSON, not a feed.
 * @example
 * ```ts no-run
 * import { loadRaceFeed, raceFromFeed } from "@johnmorrisdotca/kyogijo-stadiums/circuits";
 * const feed = await loadRaceFeed("https://example.org/my-race.json");
 * const race = raceFromFeed(feed, "las-vegas");
 * ```
 */
export async function loadRaceFeed(address: string, options: { fetch?: Fetch; signal?: AbortSignal; base?: string } = {}): Promise<RaceFeed> {
  const url = feedAddress(address, options.base);
  if (url === undefined) throw new RaceFeedError("address", "This is not a web address (it needs to start with https://).");
  const fetcher: Fetch = options.fetch ?? ((u, init) => fetch(u, init));
  const data = await getJson(fetcher, url.href, options.signal);
  if (looksLikeOpenF1Laps(data)) {
    const more = openF1Siblings(url);
    // The pit stops and the drivers make the board readable; without them the race still plays, by car numbers.
    const optional = async <T>(href: string | undefined): Promise<T[] | undefined> => {
      if (href === undefined) return undefined;
      try {
        const list = await getJson(fetcher, href, options.signal);
        return Array.isArray(list) ? (list as T[]) : undefined;
      } catch (error) {
        if ((error as Error)?.name === "AbortError") throw error;
        return undefined;
      }
    };
    const pit = await optional<OpenF1Pit>(more?.pit);
    const drivers = await optional<OpenF1Driver>(more?.drivers);
    return openF1Feed({ laps: data, ...(pit === undefined ? {} : { pit }), ...(drivers === undefined ? {} : { drivers }) });
  }
  const read = readRaceFeed(data);
  if (!read.ok) throw new RaceFeedError("format", read.error);
  return read.feed;
}

/** What `followRaceFeed` gives back. */
export interface FeedFollower {
  /** Stop asking. */
  stop(): void;
  /** Whether it is still following. */
  readonly following: boolean;
}

/** How often a feed is asked again while it is followed: no faster than every 10 seconds, every 15 by default. */
export const FOLLOW_EVERY = Object.freeze({ least: 10_000, normal: 15_000, most: 120_000 });

/**
 * Follow a race that is going on: ask the user's address again every 15 seconds (never faster than 10), only while the page is visible, and hand each new feed to `onFeed`. It stops by itself when the feed is no longer
 * live (the race is over), when the source refuses (403) or says it is busy (429), and when `stop` is called; after any other failure it waits twice as long each time, up to two minutes. A hidden page asks nothing.
 */
export function followRaceFeed(
  address: string,
  onFeed: (feed: RaceFeed) => void,
  options: { every?: number; fetch?: Fetch; doc?: Document; onError?: (error: RaceFeedError) => void; onStop?: (why: "over" | "refused" | "stopped") => void } = {},
): FeedFollower {
  const doc = options.doc ?? (typeof document === "undefined" ? undefined : document);
  const every = Math.min(FOLLOW_EVERY.most, Math.max(FOLLOW_EVERY.least, options.every ?? FOLLOW_EVERY.normal));
  let wait = every;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let busy: AbortController | undefined;
  let alive = true;
  const end = (why: "over" | "refused" | "stopped"): void => {
    if (!alive) return;
    alive = false;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    busy?.abort();
    doc?.removeEventListener("visibilitychange", seen);
    options.onStop?.(why);
  };
  const hidden = (): boolean => doc?.visibilityState === "hidden";
  const later = (): void => {
    if (!alive || hidden() || timer !== undefined || busy !== undefined) return;
    timer = setTimeout(ask, wait);
  };
  async function ask(): Promise<void> {
    timer = undefined;
    if (!alive || hidden()) return;
    busy = new AbortController();
    try {
      const feed = await loadRaceFeed(address, { ...(options.fetch === undefined ? {} : { fetch: options.fetch }), signal: busy.signal });
      busy = undefined;
      if (!alive) return;
      wait = every;
      onFeed(feed);
      if (feed.live !== true) return end("over");
    } catch (error) {
      busy = undefined;
      if (!alive || (error as Error)?.name === "AbortError") return;
      const problem = error instanceof RaceFeedError ? error : new RaceFeedError("http", String((error as Error)?.message ?? error));
      options.onError?.(problem);
      if (problem.kind === "refused" || problem.kind === "busy") return end("refused");
      wait = Math.min(FOLLOW_EVERY.most, wait * 2);
    }
    later();
  }
  // Hidden, the timer is let go; shown again, the feed is asked at once and then on the clock.
  function seen(): void {
    if (!alive) return;
    if (hidden()) {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    } else if (timer === undefined && busy === undefined) void ask();
  }
  doc?.addEventListener("visibilitychange", seen);
  void ask();
  return {
    stop: () => end("stopped"),
    get following() {
      return alive;
    },
  };
}
