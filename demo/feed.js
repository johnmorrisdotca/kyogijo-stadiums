// Bring your own feed: a game from a file the reader picks, text they paste, or an address they give, played in the game section by the package's own replay. The package's feeds code (`dist/feeds-entry.js`) is loaded
// only when the reader first uses one of these; the reader's browser fetches the address, and nothing is sent anywhere else or kept. The list of where to find a feed is `examples/feed-sources.json`, our own made-up
// sample first; picking one fills the field.

let feeds;
/** The package's feeds code, loaded once, when first wanted. */
const feedsCode = () => (feeds ??= import("./dist/feeds-entry.js"));

let sources;
/** Where to find a feed: the data file beside the page, read once. */
const sourcesData = () => (sources ??= fetch("examples/feed-sources.json").then((answer) => (answer.ok ? answer.json() : { sports: [] })));

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

  // ---- An address. ----
  let follow;
  const stopFollow = () => {
    follow?.stop();
    follow = undefined;
    $("feed-live").setAttribute("aria-pressed", "false");
  };
  $("feed-load").addEventListener("click", async () => {
    stopFollow();
    const url = $("feed-url").value.trim();
    if (url === "") {
      tell("feedNoUrl");
      return;
    }
    tell("feedReading");
    try {
      const { loadFeed } = await feedsCode();
      played(await loadFeed(url));
    } catch (error) {
      failed(error);
    }
  });
  $("feed-url").addEventListener("keydown", (event) => {
    if (event.key === "Enter") $("feed-load").click();
  });

  // ---- Live: the address asked again every 15 seconds while the page is shown, until the game is over or the server says no. ----
  $("feed-live").addEventListener("click", async () => {
    if (follow !== undefined) {
      stopFollow();
      tell("feedLiveOff");
      return;
    }
    const url = $("feed-url").value.trim();
    if (url === "") {
      tell("feedNoUrl");
      return;
    }
    $("feed-live").setAttribute("aria-pressed", "true");
    tell("feedReading");
    const { followFeed } = await feedsCode();
    follow = followFeed(url, {
      onGame: (game) => played(game, true),
      onError: failed,
      onState: (state) => {
        if (state === "ended") tell("feedLiveEnded");
        if (state === "refused") tell("feedLiveRefused");
        if (state === "ended" || state === "refused") {
          follow = undefined;
          $("feed-live").setAttribute("aria-pressed", "false");
        }
      },
    });
  });

  // ---- Where to find a feed: the sport's sources, our sample first; Use fills the field. ----
  const list = $("feed-sources");
  const paint = async () => {
    const data = await sourcesData();
    const lang = page.lang();
    const sport = data.sports.find((s) => s.sport === page.sport()) ?? data.sports[0];
    list.replaceChildren(
      ...(sport?.sources ?? []).map((s) => {
        const item = document.createElement("li");
        item.className = "feed-source";
        item.dataset.source = s.id;
        const use = Object.assign(document.createElement("button"), { type: "button", className: "fam-button", textContent: page.say("feedUse") });
        use.dataset.testid = `feed-use-${s.id}`;
        use.setAttribute("aria-label", `${page.say("feedUse")}: ${s.name[lang]}`);
        use.addEventListener("click", () => {
          $("feed-url").value = s.url;
          $("feed-url").focus();
        });
        const name = Object.assign(document.createElement("strong"), { textContent: s.name[lang] });
        const gives = Object.assign(document.createElement("span"), { className: "feed-gives", textContent: s.gives[lang] });
        const links = document.createElement("span");
        links.className = "feed-links";
        for (const link of [...s.docs, s.terms]) {
          const a = Object.assign(document.createElement("a"), { href: link.url, textContent: link.label[lang] });
          if (/^https?:/.test(link.url)) a.rel = "noopener noreferrer";
          links.append(a);
        }
        if (s.browser !== "yes") links.append(Object.assign(document.createElement("em"), { textContent: page.say("feedMayRefuse") }));
        const body = document.createElement("div");
        body.className = "feed-body";
        body.append(name, gives, links);
        item.append(use, body);
        return item;
      }),
    );
  };
  return {
    /** The section came near the screen, or the language changed: write the list. */
    paint: () => void paint(),
    /** Stop a live follow (the section's game is replaced). */
    stop: stopFollow,
  };
}
