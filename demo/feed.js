// Bring your own feed: a game from a file the reader picks or text they paste, played in the game section by the package's own replay. The package's feeds code (`dist/feeds-entry.js`) is loaded only when the
// reader first uses one of these; nothing is sent anywhere or kept.

let feeds;
/** The package's feeds code, loaded once, when first wanted. */
const feedsCode = () => (feeds ??= import("./dist/feeds-entry.js"));

/**
 * Wire the feed controls of the game section.
 * @param {{ say: (key: string) => string, lang: () => "en" | "ja", play: (game: object, how: { live: boolean }) => void, sport: () => string }} page `play` is given a feed read into a game (`readFeed`'s answer)
 */
export function mountFeedControls(page) {
  const $ = (id) => document.getElementById(id);
  const status = $("feed-status");
  const tell = (key, values = {}) => {
    status.textContent = Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), page.say(key));
  };
  /** What went wrong, in the page's words. */
  const failed = (error) => {
    const kind = error?.kind;
    if (kind === "cors") tell("feedCors");
    else if (kind === "http") tell("feedHttp", { status: String(error.status) });
    else if (kind === "address") tell("feedAddress");
    else if (kind === "too-large") tell("feedLarge");
    else if (kind === "network") tell("feedOffline");
    else if (kind === "empty") tell("feedEmpty");
    else tell("feedFormat");
  };
  const played = (game, live = false) => {
    page.play(game, { live });
    const home = game.teams.home.abbr ?? game.teams.home.name ?? "";
    const away = game.teams.away.abbr ?? game.teams.away.name ?? "";
    tell(live ? "feedLiveShown" : "feedPlayed", { home, away, events: String(game.timeline.events?.length ?? 0) });
  };

  // ---- A file or a paste. ----
  $("feed-file-pick").addEventListener("click", () => $("feed-file").click());
  $("feed-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;
    tell("feedReading");
    try {
      const { readFeedText } = await feedsCode();
      played(readFeedText(await file.text()));
    } catch (error) {
      failed(error);
    }
  });
  $("feed-paste-play").addEventListener("click", async () => {
    const text = $("feed-paste").value;
    if (text.trim() === "") {
      tell("feedPasteEmpty");
      return;
    }
    try {
      const { readFeedText } = await feedsCode();
      played(readFeedText(text));
    } catch (error) {
      failed(error);
    }
  });

  return {
    /** The section came near the screen, or the language changed: nothing to write yet. */
    paint: () => undefined,
  };
}
