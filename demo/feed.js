// Bring your own feed: a game from a file the reader picks, text they paste, or an address they give, played in the game section by the package's own replay. The package's feeds code (`dist/feeds-entry.js`) is loaded
// only when the reader first uses one of these; the reader's browser fetches the address, and nothing is sent anywhere else or kept. The list of where to find a feed is `examples/feed-sources.json`, our own made-up
// sample first; picking one fills the field. Feed files dropped on the panel or the view, or picked, are kept in this browser (demo/feed-store.js) and listed, to play again after a reload.
import { loadFeedText, removeAllFeeds, removeFeed, saveFeed, savedFeeds, sizeText } from "./feed-store.js";

/** The most files read from one drop or choice, and the most characters kept in this browser in all: a whole season of play-by-play files is more than a page should hold. */
export const FILES_MOST = 200;
export const KEPT_MOST = 200_000_000;

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

  // ---- Feed files: dropped on the panel or the view, or picked. Each is read here, refused in plain words when it is not a feed, kept in this browser and listed; the first good one plays. ----
  const kept = $("feed-kept");
  const paintKept = () => {
    const all = savedFeeds();
    const lang = page.lang();
    $("feed-kept-note").textContent = all.length === 0 ? page.say("feedKeptNone") : page.say("feedKeptNote").replace("{count}", String(all.length)).replace("{size}", sizeText(all.reduce((sum, f) => sum + f.size, 0)));
    $("feed-remove-all").hidden = all.length === 0;
    kept.replaceChildren(
      ...all.map((f) => {
        const item = document.createElement("li");
        item.className = "feed-kept";
        item.dataset.feed = f.id;
        const body = document.createElement("div");
        body.className = "feed-body";
        const sport = page.say(`sport_${f.sport}`);
        const when = new Date(f.date);
        body.append(
          Object.assign(document.createElement("strong"), { textContent: f.game === "" ? f.name : f.game }),
          Object.assign(document.createElement("span"), { className: "feed-meta", textContent: [f.name, sport.startsWith("sport_") ? f.sport : sport, Number.isNaN(when.getTime()) ? "" : when.toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" }), sizeText(f.size)].filter(Boolean).join(" · ") }),
        );
        const button = (key, act) => {
          const b = Object.assign(document.createElement("button"), { type: "button", className: "fam-button", textContent: page.say(key) });
          b.setAttribute("aria-label", `${page.say(key)}: ${f.name}`);
          b.dataset.act = key === "feedPlay" ? "play" : "remove";
          b.addEventListener("click", act);
          return b;
        };
        item.append(
          body,
          button("feedPlay", async () => {
            const text = await loadFeedText(f.id);
            if (text === undefined) {
              tell("feedGone");
              paintKept();
              return;
            }
            try {
              const { readFeedText } = await feedsCode();
              played(readFeedText(text));
            } catch (error) {
              failed(error);
            }
          }),
          button("feedRemove", async () => {
            await removeFeed(f.id);
            tell("feedRemoved", { name: f.name });
            paintKept();
          }),
        );
        return item;
      }),
    );
  };
  $("feed-remove-all").addEventListener("click", async () => {
    await removeAllFeeds();
    tell("feedRemovedAll");
    paintKept();
  });
  /**
   * Read files one at a time (a whole folder can be dropped: the page answers between them and says how far it is), play the first that is a feed as soon as it is read, keep every feed, and say which were refused.
   * More than `FILES_MOST` files at once, or more than `KEPT_MOST` characters kept in all, are refused in words.
   */
  const takeFiles = async (files) => {
    if (files.length === 0) return;
    if (files.length > FILES_MOST) {
      tell("feedTooMany", { most: String(FILES_MOST), count: String(files.length) });
      return;
    }
    tell("feedReading");
    const { readFeedText, FEED_MOST } = await feedsCode();
    let first;
    const refused = [];
    let unkept = 0;
    let full = 0;
    let keptSize = savedFeeds().reduce((sum, f) => sum + f.size, 0);
    for (const [i, file] of files.entries()) {
      if (files.length > 1 && first === undefined) tell("feedReadingOf", { n: String(i + 1), count: String(files.length) });
      let game;
      let text;
      try {
        if (file.size > FEED_MOST) throw new Error("too large");
        text = await file.text();
        game = readFeedText(text);
      } catch {
        refused.push(file.name);
        continue;
      }
      if (first === undefined) {
        first = game;
        played(game);
      }
      if (keptSize + text.length > KEPT_MOST) {
        full += 1;
        continue;
      }
      const home = game.teams.home.abbr ?? game.teams.home.name ?? "";
      const away = game.teams.away.abbr ?? game.teams.away.name ?? "";
      if ((await saveFeed({ name: file.name, game: home === "" && away === "" ? "" : `${home} – ${away}`, sport: game.sport ?? "nhl", text })) === undefined) unkept += 1;
      else keptSize += text.length;
      // Let the page answer between files.
      await new Promise((done) => setTimeout(done, 0));
    }
    if (first === undefined) status.textContent = "";
    const notes = [];
    if (refused.length > 0) notes.push(page.say("feedRefused").replace("{names}", refused.join(", ")));
    if (unkept > 0) notes.push(page.say("feedNotKept"));
    if (full > 0) notes.push(page.say("feedFull").replace("{count}", String(full)).replace("{most}", sizeText(KEPT_MOST)));
    if (notes.length > 0) status.textContent = `${status.textContent} ${notes.join(" ")}`.trim();
    paintKept();
  };
  $("feed-file-pick").addEventListener("click", () => $("feed-file").click());
  $("feed-file").addEventListener("change", async (event) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    await takeFiles(files);
  });
  // A drop on the panel or on the view: a file dragged over either is shown as welcome; anything else dragged (text, a link) is left to the page.
  const hasFiles = (event) => [...(event.dataTransfer?.types ?? [])].includes("Files");
  for (const zone of [$("feed"), $("game-stage")]) {
    zone.addEventListener("dragover", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      $("feed").dataset.drop = "over";
    });
    zone.addEventListener("dragleave", (event) => {
      if (!zone.contains(event.relatedTarget)) delete $("feed").dataset.drop;
    });
    zone.addEventListener("drop", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      delete $("feed").dataset.drop;
      void takeFiles([...event.dataTransfer.files]);
    });
  }
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
    /** The section came near the screen, or the language changed: write the lists. */
    paint: () => {
      void paint();
      paintKept();
    },
    /** Stop a live follow (the section's game is replaced). */
    stop: stopFollow,
  };
}
