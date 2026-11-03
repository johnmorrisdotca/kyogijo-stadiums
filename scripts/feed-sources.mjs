// "Where to find a feed", made from the one data file (examples/feed-sources.json): the page in English and its Japanese twin, each sport with its sample feed first and the public feeds known for it, what each gives,
// a sample address, how to find a game's id, and its docs and terms. `node scripts/feed-sources.mjs` writes the two pages; src/feed-sources.test.js holds them to the data file.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

/** What the pages say, in each language. */
const WORDS = {
  en: {
    title: "Where to find a feed",
    other: "[日本語](where-to-find-a-feed.ja.md) · English",
    intro:
      "A feed is a game as data that a page can play: the [replay](./replay.md) reads it from a file, from text you paste or from an address you give ([feeds](./feeds.md)). Here are the feeds known for each sport, made from one data file, [`examples/feed-sources.json`](../examples/feed-sources.json); the demo's list beside its address field is the same file. Our own made-up sample comes first: it works with no address of anyone else's, and shows what a feed looks like.",
    rules:
      "Your browser fetches what you choose: we run no server and no relay, and nothing is kept beyond the open page. A source's terms are its own, and you are responsible for following them. Many servers do not let a page of another site read them (CORS): then paste the answer, pick it as a file, or point at a relay of your own.",
    table: "| Sport | Feed | Format | Read by a browser | Address |",
    sep: "| --- | --- | --- | --- | --- |",
    gives: "What it gives",
    gameId: "Finding a game",
    docs: "Docs",
    terms: "Terms",
    sample: "Sample address",
    browser: { yes: "yes", "maybe-not": "may refuse (CORS)", no: "no (CORS)" },
    none: "No public feed is known for this sport yet.",
  },
  ja: {
    title: "フィードの入手先",
    other: "日本語 · [English](where-to-find-a-feed.md)",
    intro:
      "フィードとは、ページで再生できる形にした試合のデータです。[リプレイ](./replay.md)は、ファイル、貼り付けたテキスト、指定したアドレスのいずれからでもフィードを読み込めます（[フィード](./feeds.md)）。このページでは、競技ごとに知られているフィードを紹介します。内容は1つのデータファイル [`examples/feed-sources.json`](../examples/feed-sources.json) から作っていて、デモのアドレス欄の横に表示される一覧も同じファイルを使っています。最初に挙げるのは当サイトで用意した架空のサンプルです。外部のアドレスがなくても動き、フィードがどのようなものかを確かめられます。",
    rules:
      "選んだフィードは、閲覧者のブラウザーが直接取得します。当サイトはサーバーも中継サーバーも運用せず、ページを閉じた後に残るデータもありません。各提供元の利用規約はその提供元が定めるもので、その遵守は閲覧者の責任です。多くのサーバーは、ほかのサイトのページからの読み取りを許可していません（CORS）。その場合は、取得した内容を貼り付けるか、ファイルとして選ぶか、自分で用意した中継サーバーを指定してください。",
    table: "| 競技 | フィード | 形式 | ブラウザーでの読み込み | アドレス |",
    sep: "| --- | --- | --- | --- | --- |",
    gives: "含まれる内容",
    gameId: "試合の見つけ方",
    docs: "資料",
    terms: "利用規約",
    sample: "サンプルのアドレス",
    browser: { yes: "可", "maybe-not": "拒否される場合あり（CORS）", no: "不可（CORS）" },
    none: "この競技で知られている公開フィードは、まだありません。",
  },
};

/** A link of the data file, as the docs page has it: a page of the site's own is a page beside this one, an address of the repository is relative to it. */
const href = (url) => (/^https?:/.test(url) ? url : url === "LICENSE" ? "../LICENSE" : url.startsWith("docs/") ? `./${url.slice(5).replace(/\.html$/, ".md")}` : `../${url}`);

/** Prose of the data file as Markdown: an address in it (`api.example/v1/...`) is code. */
const prose = (text) => text.replace(/(?<![`\w])((?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s,)]*[^\s,.)])/gi, "`$1`");

/** The two pages, made from the data. */
export function sourcesPages(data) {
  const out = {};
  for (const lang of ["en", "ja"]) {
    const w = WORDS[lang];
    const lines = [`# ${w.title}`, "", w.other, "", w.intro, "", w.rules, "", w.table, w.sep];
    for (const sport of data.sports) {
      if (sport.sources.length === 0) lines.push(`| ${sport.name[lang]} | ${w.none} | | | |`);
      for (const s of sport.sources) lines.push(`| ${sport.name[lang]} | ${s.name[lang]} | \`${s.format}\` | ${w.browser[s.browser]} | \`${s.url}\` |`);
    }
    for (const sport of data.sports) {
      lines.push("", `## ${sport.name[lang]}`);
      if (sport.sources.length === 0) lines.push("", w.none);
      for (const s of sport.sources) {
        lines.push("", `### ${s.name[lang]}`, "", `- **${w.sample}**: \`${s.url}\``, `- **${w.gives}**: ${prose(s.gives[lang])}`, `- **${w.gameId}**: ${prose(s.gameId[lang])}`);
        lines.push(`- **${w.docs}**: ${s.docs.map((d) => `[${d.label[lang]}](${href(d.url)})`).join(", ")}`);
        lines.push(`- **${w.terms}**: [${s.terms.label[lang]}](${href(s.terms.url)})`);
      }
    }
    out[lang] = `${lines.join("\n")}\n`;
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pages = sourcesPages(JSON.parse(readFileSync("examples/feed-sources.json", "utf8")));
  writeFileSync("docs/where-to-find-a-feed.md", pages.en);
  writeFileSync("docs/where-to-find-a-feed.ja.md", pages.ja);
  console.log("docs/where-to-find-a-feed.md and .ja.md written");
}
