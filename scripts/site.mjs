// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's shared header and
// footer, with the family's stylesheet, Kyogijo's own, the page's scripts, the embeddable frame, the API reference and
// the compiled library beside them.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { API_CSS, apiPage } from "./api.mjs";
import { atlasMapSvg } from "./atlas-map.mjs";
import { buildDocs } from "./docs-pages.mjs";
import { framesBlockHtml, framesFiles, galleryData, galleryPageHtml, libraryFrom } from "./docs-gallery.mjs";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";
import { iconLinks } from "./icon-links.mjs";
import { firstPaintHead, sayEnglish } from "./first-paint.mjs";
import { WORDS } from "../demo/words.js";

const id = "kyogijo-stadiums";

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const help = (en, ja) => `data-help-en="${escape(en)}" data-help-ja="${escape(ja)}"`;
// The playground's controls, in their first state: a choice has its buttons with the one that is on pressed, a field has its value.
const seg = (name, label, en, ja) => {
  const { kind, values, get } = SEGS.find((one) => one.id === name);
  const buttons = values.map((value) => `<button type="button" data-value="${value}" aria-pressed="${get(first) === value}"${kind === "status" && model.hiddenStatus(first.sport, value) ? " hidden" : ""}>${escape(labels[kind](value))}</button>`).join("");
  return `<div class="setup fam-row" ${help(en, ja)}><span class="fam-label" data-say="${label}"></span><div class="fam-seg" role="group" data-say-label="${label}" id="${name}" data-testid="${name}">${buttons}</div></div>`;
};
const field = (name, label, attrs = "") => `<label class="setup fam-row"><span class="fam-label" data-say="${label}"></span><input class="fam-field" id="${name}" data-testid="${name}" data-say-label="${label}" autocomplete="off" ${attrs} value="${escapeAttr(fieldValue[name])}" /></label>`;
/** A picker of ready-made emblems: a grid of tiles, each the emblem itself in the style that is on, named for a screen reader. `rowId` is the row that hides it. */
const tiles = (name, rowId, label, en, ja) => {
  const { values, get } = SEGS.find((one) => one.id === name);
  const buttons = values.map((value) => `<button type="button" data-value="${value}" aria-pressed="${get(first) === value}" aria-label="${escape(emblemName(value, "en"))}" title="${escape(emblemName(value, "en"))}">${renderEmblem(first.emblemLine ? `${value}/line` : value, { size: 34 })}</button>`).join("");
  return `<div class="setup fam-row tiles-row" id="${rowId}"${hid(rowId)} ${help(en, ja)}><span class="fam-label" data-say="${label}"></span><div class="fam-seg emblem-tiles" role="group" data-say-label="${label}" id="${name}" data-testid="${name}">${buttons}</div></div>`;
};
const toggle = (name, label) => `<button type="button" class="fam-chip" id="${name}" data-testid="${name}" aria-pressed="${toggled[name]}" data-say="${label}"${name in hidden && hidden[name] ? " hidden" : ""}></button>`;

// ----- The site's files, and the first view of the playground: what its script would draw first, written into the HTML.
rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
// The declarations are for editors, not for a browser.
cpSync("dist", "site/dist", { recursive: true, filter: (from) => !/\.d\.ts$/.test(from) });
// The map of the Atlas is chizu's: the few files of its build that the page loads (the world and the mounted map, not the
// countries, regions or features it loads only on request), with its licence and notice, and the same world drawn as a
// picture of every place for docs/atlas.md.
const chizu = dirname(dirname(createRequire(import.meta.url).resolve("@johnmorrisdotca/chizu")));
cpSync(join(chizu, "dist"), "site/chizu", { recursive: true, filter: (from) => !/\.d\.ts$/.test(from) && !/[\\/]data[\\/](countries|divisions|features)(?:[\\/]|$)/.test(from) && !/world-detail/.test(from) && !/loaders/.test(from) });
cpSync(join(chizu, "LICENSE"), "site/chizu/LICENSE");
cpSync(join(chizu, "NOTICE.md"), "site/chizu/NOTICE.md");

// The ready-made emblems are Dougu Sports': the whole of its build (plain modules), with its licences and notice, beside the package, where the demo plugs it in.
const dougu = dirname(dirname(createRequire(import.meta.url).resolve("@johnmorrisdotca/dougu-sports/emblems")));
cpSync(join(dougu, "dist"), "site/dougu", { recursive: true, filter: (from) => !/\.d\.ts$/.test(from) });
for (const name of ["LICENSE", "LICENSES", "NOTICE.md"]) cpSync(join(dougu, name), join("site/dougu", name), { recursive: true });

const lib = await libraryFrom(join(process.cwd(), "dist"), ".js", (file) => import(pathToFileURL(file).href));
const style = `${lib["@johnmorrisdotca/kyogijo-stadiums"].KYOGIJO_STYLE}\n${lib["@johnmorrisdotca/kyogijo-stadiums/turn"].KYOGIJO_TURN_STYLE}`;
// The playground's own code, from the copy in site/ (which finds the package beside it), run here as the page runs it.
const here = (file) => import(pathToFileURL(join(process.cwd(), "site", file)).href);
const { SPORTS, LEAGUES, drawKyogijo } = await here("dist/index.js");
// Dougu Sports, plugged in by the demo's own module (`useEmblems`) before anything is drawn.
const { emblemName, renderEmblem } = await here("emblems.js");
const model = await here("model.js");
const places = await here("place-grid.js");
const { FIELDS, SEGS, TOGGLES, SIZES } = model;
const say = (key) => {
  if (!(key in WORDS.en)) throw new Error(`demo/words.js has no English word for "${key}"`);
  return WORDS.en[key];
};

/** A state for a sport: the address asks for nothing else, and the page speaks English. */
const stateFor = (sport) => {
  const one = model.makeState(new URLSearchParams(""), null);
  one.sport = sport;
  model.loadGame(one, sport, "en");
  return one;
};
const first = stateFor("nhl");
const hidden = model.hiddenRows(first);
const fieldValue = Object.fromEntries(FIELDS.map((one) => [one.id, one.get(first)]));
const toggled = Object.fromEntries(TOGGLES.map((one) => [one.id, one.get(first)]));
const labels = model.labelOf(say, first);

/** The drawing a state asks for at a width (the playground's "auto" turns tall below 560 px, wide above) or a way round. */
const drawn = (one, mode) => {
  const options = { ...model.optionsFor(one, "en"), style: "none" };
  if (mode === "wide") Object.assign(options, { orientation: "auto", aspect: 1.5 });
  else if (mode === "tall") Object.assign(options, { orientation: "auto", aspect: 0.75 });
  else options.orientation = mode;
  return drawKyogijo(options);
};
const WIDE = drawn(first, "wide");
const TALL = drawn(first, "tall");

/**
 * What the page needs to know before its script runs, to keep a box the right size for the address it was opened at: for each sport
 * and size, the shape of the drawing in each mode, and the rows that differ from the default sport's.
 */
const shape = (svg) => {
  const [, , width, height] = /viewBox="([^"]+)"/.exec(svg)[1].split(" ").map(Number);
  return [Math.round((width / height) * 10000) / 10000, /data-orientation="portrait"/.test(svg) ? 1 : 0];
};
const FIRST = { sport: first.sport, sports: SPORTS, sizes: SIZES, shapes: {}, rows: {}, eras: {}, statuses: {}, use: {} };
const hiddenStatuses = (sport) => model.STATUSES.filter((value) => model.hiddenStatus(sport, value));
for (const sport of SPORTS) {
  const one = stateFor(sport);
  FIRST.shapes[sport] = {};
  for (const size of SIZES) {
    one.size = size;
    FIRST.shapes[sport][size] = Object.fromEntries(["wide", "tall", "landscape", "portrait"].map((mode) => [mode, shape(drawn(one, mode))]));
  }
  const rows = model.hiddenRows(one);
  FIRST.rows[sport] = Object.fromEntries(Object.entries(rows).filter(([id, value]) => value !== hidden[id]));
  // The rows that change with the league named: only the season rows, by whether the league has a history.
  FIRST.eras[sport] = {};
  for (const league of LEAGUES[sport]) {
    one.league = league.id;
    const off = model.hiddenRows(one)["era-group"];
    if (off !== rows["era-group"]) FIRST.eras[sport][league.id] = off;
  }
  if (Object.keys(FIRST.eras[sport]).length === 0) delete FIRST.eras[sport];
  if (hiddenStatuses(sport).join() !== hiddenStatuses(first.sport).join()) FIRST.statuses[sport] = hiddenStatuses(sport);
}
// Which of the two drawings in the page each mode of the default sport already is (null: neither, and the script draws it).
for (const mode of ["wide", "tall", "landscape", "portrait"]) {
  const svg = drawn(first, mode);
  FIRST.use[mode] = svg === WIDE ? "wide" : svg === TALL ? "tall" : null;
}

/** The filters and first cards of the Every sport, The soccer pitch, Ballparks and Soccer grounds sections, in their default view (demo/place-grid.js): what the script would draw first. */
const placeBody = (name) => {
  const { attributes, html } = places.prerender(name, say);
  return `<div class="pf-body" id="${name}-body" data-testid="${name}-body" ${attributes}>${html}</div>`;
};

const escapeAttr = (text) => String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const hid = (id) => {
  if (!(id in hidden)) throw new Error(`hiddenRows has no row "${id}"`);
  return hidden[id] ? " hidden" : "";
};

/**
 * The first thing the page does, as it is parsed and before anything is drawn: look at the address, and make the playground the shape it
 * will be (the rows it shows, the choices that are on, the box of the stage and the drawing in it) so that the module script, which comes
 * later, finds a page that is already right and moves nothing. The drawing in the page is the default sport's, wide; its tall twin waits
 * in a template for a narrow box; any other drawing waits for the script, the box kept for it and the wrong one hidden.
 */
const FIRST_SCRIPT = `(function () {
  var F = ${JSON.stringify(FIRST)};
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var stage = $("stage");
  var sport = F.sports.indexOf(q.get("sport")) >= 0 ? q.get("sport") : F.sport;
  var size = F.sizes.indexOf(q.get("size")) >= 0 ? q.get("size") : "full";
  var way = q.get("orientation");
  // The same rule as the stage's own: "auto" is tall in a box narrower than 560 pixels and wide in any other.
  var mode = way === "landscape" || way === "portrait" ? way : stage.clientWidth < 560 ? "tall" : "wide";
  var shape = F.shapes[sport][size][mode];
  var rows = F.rows[sport] || {};
  Object.keys(rows).forEach(function (id) { $(id).hidden = rows[id]; });
  var eras = F.eras[sport] || {};
  var league = q.get("league");
  if (league !== null && Object.prototype.hasOwnProperty.call(eras, league)) $("era-group").hidden = eras[league];
  var off = F.statuses[sport];
  if (off) Array.prototype.forEach.call($("status").children, function (button) { button.hidden = off.indexOf(button.dataset.value) >= 0; });
  var view = q.get("view") === "3d" ? "3d" : "flat";
  [["sport", sport], ["size", size], ["orientation", way === "landscape" || way === "portrait" ? way : "auto"], ["view", view]].forEach(function (one) {
    Array.prototype.forEach.call($(one[0]).children, function (button) { button.setAttribute("aria-pressed", String(button.dataset.value === one[1])); });
  });
  stage.dataset.orientation = shape[1] ? "portrait" : "landscape";
  stage.dataset.sport = sport;
  stage.dataset.size = size;
  stage.style.setProperty("--r", String(shape[0]));
  // The 3D view is made by the script: the box is kept for it, and the flat drawing in the page is hidden until it is replaced.
  stage.dataset.view = view;
  var use = view === "flat" && sport === F.sport && size === "full" ? F.use[mode] : null;
  if (use === "tall") stage.replaceChildren($("stage-tall").content.cloneNode(true));
  else if (use === null) stage.setAttribute("data-pending", "");
})();`;

const team = (role) => `<div class="team" data-role="${role}">
          <h3 data-say="${role}"></h3>
          <div class="team-grid">
            ${field(`${role}-name`, "teamName", 'maxlength="40"')}
            ${field(`${role}-abbr`, "teamAbbr", 'maxlength="5"')}
            ${field(`${role}-score`, "teamScore", 'type="text" inputmode="numeric" maxlength="3"')}
            <label class="setup fam-row" id="${role}-pens-row"${hid(`${role}-pens-row`)}><span class="fam-label" data-say="teamPens"></span><input class="fam-field" id="${role}-pens" data-testid="${role}-pens" data-say-label="teamPens" autocomplete="off" type="text" inputmode="numeric" maxlength="2" value="${escapeAttr(fieldValue[`${role}-pens`])}" /></label>
            <label class="setup fam-row"><span class="fam-label" data-say="teamColour"></span><input class="fam-field fam-colour" type="color" id="${role}-color" data-testid="${role}-color" data-say-label="teamColour" value="${escapeAttr(fieldValue[`${role}-color`])}" /></label>
          </div>
          ${seg(`${role}-logo`, "teamLogo", "Pick a made-up emblem, or give the address of a logo of your own. A logo may be an https address, a path, an image data address or the text of an SVG.", "架空のエンブレムを選ぶか、お持ちのロゴのURLを入力します。ロゴには、httpsのURL、パス、画像のデータURI、SVGのコードを使えます。")}
          ${tiles(`${role}-mark`, `${role}-mark-row`, "teamMark", "A ready-made emblem for this team's mark: a crest that takes the team's colour and initials, the icon of a sport, a trophy or a medal. In your own code it is only its id, such as crest:shield.", "このチームのマークに使うプリセットのエンブレムです。チームの色と頭文字が入るエンブレム、競技のアイコン、トロフィー、メダルから選べます。コードでは「crest:shield」のようなIDだけで指定します。")}
          <input class="fam-field logo-url" id="${role}-logo-url" data-testid="${role}-logo-url" data-say-label="logoUrl" data-say-placeholder="logoUrl" autocomplete="off" value="${escapeAttr(fieldValue[`${role}-logo-url`])}"${hid(`${role}-logo-url`)} />
        </div>`;

const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "Kyogijo Stadiums · sports fields, rinks, courts and ballparks drawn to scale, with the score on them",
      description: "NFL, CFL and IFAF fields, an NHL rink, an NBA court, the soccer pitch and futsal court, a curling sheet, the courts of tennis, volleyball, badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball, roundnet and netball, and every MLB and NPB ballpark as SVG, drawn to scale from the rulebooks, with each team's name and logo and the score on them. Light and dark, tall or wide, with a compact badge for lists.",
      ogTitle: "Kyogijo Stadiums sports surfaces",
      ogDescription: "Fields, rinks, courts and ballparks drawn to scale as SVG, with the score on them: wide or tall, light or dark.",
    })}
    ${iconLinks("")}
    ${firstPaintHead(id, { theme: true })}
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="kyogijo.css" />
    <style id="kyogijo-style">${style}</style>
  </head>
  <body>
    <main>
      ${familyHeader({ id, links: [{ href: "docs/", say: "pageDocs" }, { href: "api.html", say: "pageApi" }] })}

      <section class="try" id="try" aria-labelledby="try-title">
        <div class="try-head">
          <h2 id="try-title" data-say="tryTitle"></h2>
          <p data-say="tryText"></p>
        </div>
        <div class="try-grid">
          <div class="try-stage">
            <div class="fam-felt stage-felt" id="felt"><div id="stage" data-testid="stage" data-ready="false" data-orientation="landscape" data-sport="${first.sport}" data-size="${first.size}" style="--r:${shape(WIDE)[0]}">${WIDE}</div></div>
            <template id="stage-tall">${TALL}</template>
          </div>
          <div class="try-controls">
            <details class="fam-fold group" open>
              <summary data-say="groupSurface"></summary>
              ${seg("sport", "sport", "Choose the surface: three football fields (NFL, CFL, IFAF), a hockey rink, a basketball court, a baseball field, a soccer pitch, a curling sheet, the court of tennis, volleyball, badminton, pickleball, table tennis, padel, squash, racquetball, sepak takraw, teqball, roundnet or netball, an athletics stadium, an ice skating rink, or the field of lacrosse, rugby, Australian football, Gaelic games, cricket, field hockey or handball, or the pool of swimming, water polo, diving or artistic swimming, or the contest area of judo, karate, kendo, sumo or kyudo, or a dojo.", "競技場を選びます。アメリカンフットボール場3種類（NFL・CFL・IFAF）、アイスホッケーのリンク、バスケットボールのコート、野球場、サッカーのピッチ、カーリングのシート、テニス・バレーボール・バドミントン・ピックルボール・パデル・スカッシュ・ラケットボール・セパタクロー・テックボール・ラウンドネット・ネットボールのコート、卓球台、陸上競技場、スケートリンクのほか、ラクロス、ラグビー、オーストラリアンフットボール、ゲーリック・ゲームズ、クリケット、フィールドホッケーのフィールド、ハンドボールのコート、競泳・水球・飛込・アーティスティックスイミングのプール、柔道・空手・剣道の試合場、相撲の土俵、弓道場、道場から選べます。")}
              <div class="setup fam-row" id="league-row"${hid("league-row")} ${help("Choose the league whose rulebook marks the surface: FIBA, the WNBA or the NCAA for the court; the IIHF, the NCAA, the AHL or the CHL for the rink; the NCAA, the high schools or arena football for the field; Little League, PONY or softball for the diamond; World Curling or Curling Canada for the sheet; beach volleyball for the volleyball court. Each is drawn from its own rulebook.", "どのリーグのルールブックに沿って描くかを選びます。コートならFIBA・WNBA・NCAA、リンクならIIHF・NCAA・AHL・CHL、フィールドならNCAA・全米高校連盟（NFHS）・インドアフットボール、野球場とソフトボール場ならリトルリーグ・PONY・USAソフトボール、カーリングのシートならワールドカーリングやカーリング・カナダ、バレーボールのコートならビーチバレーボールなど。どれもそのリーグ自身のルールブックに基づいて描きます。")}>
                <span class="fam-label" data-say="leagueLabel"></span>
                <select class="fam-field" id="league" data-testid="league" data-say-label="leagueLabel"></select>
              </div>
              <div class="setup fam-row" id="pitch-row"${hid("pitch-row")} ${help("Choose the pitch: the international 105 by 68 metres, the sizes UEFA, the MLS and the NCAA publish, the least and most the Laws allow, the FA's small-sided pitches or FIFA's futsal court.", "ピッチを選びます。国際標準の105×68m、UEFA・MLS・NCAAの公表する広さ、競技規則が認める最小と最大、FAの少人数制ピッチ、FIFAのフットサルのコートがあります。")}>
                <span class="fam-label" data-say="pitchLabel"></span>
                <select class="fam-field" id="pitch" data-testid="pitch" data-say-label="pitchLabel"></select>
              </div>
              <div class="setup fam-row" id="ground-row"${hid("ground-row")} ${help("Choose a famous ground: the pitch is drawn at the size its article publishes, or at the international 105 by 68 metres where none is. A pitch other than the international one, chosen above, wins over the ground's size.", "有名なスタジアムを選びます。ピッチは、そのスタジアムの記事で公表されている広さで描かれ、公表されていない場合は国際標準の105×68mで描かれます。上で国際標準以外のピッチを選んだ場合は、そちらが優先されます。")}>
                <span class="fam-label" data-say="groundLabel"></span>
                <select class="fam-field" id="ground" data-testid="ground" data-say-label="groundLabel"></select>
              </div>
              <div class="setup fam-row" id="pitch-type-row"${hid("pitch-type-row")} ${help("Draw the pitch in a data provider's own coordinates: the lines stand where the provider puts them, and an empty group in the drawing takes the provider's raw x and y.", "データ提供元の座標系でピッチを描きます。ラインは提供元が定める位置に引かれ、図の中の空のグループに、提供元の生のx・y座標をそのまま描き込めます。")}>
                <span class="fam-label" data-say="pitchTypeLabel"></span>
                <select class="fam-field" id="pitch-type" data-testid="pitch-type" data-say-label="pitchTypeLabel"></select>
              </div>
              <div class="setup fam-row" id="park-row"${hid("park-row")} ${help("Choose the ballpark: each MLB and NPB park has its own fence, drawn from the distances published for it.", "球場を選びます。MLBとNPBの各球場には、公表されている距離をもとに描いた、その球場固有のフェンスがあります。")}>
                <span class="fam-label" data-say="park"></span>
                <select class="fam-field" id="park" data-testid="park" data-say-label="park"></select>
              </div>
              <div id="era-group"${hid("era-group")}>
                ${seg("era", "era", "Draw the surface as it is today, or as the rules marked it in a past season: the NHL's centre line from 1943, the NBA's three-point line from 1979, the NFL's hash marks as they moved, and more. Each change is cited.", "競技場を現在の姿で描くか、過去のシーズンのルールに従った姿で描くかを選びます。例：NHLのセンターレッドライン（1943年から）、NBAのスリーポイントライン（1979年から）、何度も位置が変わったNFLのハッシュマークなど。どの変更にも出典があります。")}
                <div class="setup fam-row" id="era-year-row"${hid("era-year-row")} ${help("Slide to a season. A season is named by the year it starts in: 1979 is the 1979–80 season of the NHL and the NBA.", "スライダーでシーズンを選びます。シーズンは開幕する年で表します。NHLとNBAでは、「1979」は1979–80シーズンを指します。")}>
                  <label class="fam-label" for="era-year" data-say="eraYear"></label>
                  <input type="range" class="fam-field era-range" id="era-year" data-testid="era-year" step="1" />
                  <output class="era-season" id="era-season" data-testid="era-season" for="era-year"></output>
                </div>
                <ul class="era-notes" id="era-notes" data-testid="era-notes"${hid("era-notes")}></ul>
              </div>
              ${seg("size", "size", "On the surface puts the names and the score on the field; compact puts a strip under it; a badge is the strip alone, for lists.", "「競技場に重ねる」は名前と得点を競技場の上に表示し、「コンパクト」は下に帯を付け、「バッジ」は帯だけにします。一覧向けです。")}
              ${seg("orientation", "orientation", "Wide is the usual way round. Tall turns the surface a quarter, with the words upright and the teams top and bottom. Fit the box chooses by the shape of the space.", "「横」は通常の向きです。「縦」は競技場を90度回し、文字は水平のまま、チームを上下に並べます。「枠に合わせる」は表示領域の形に合わせて自動で選びます。")}
              ${seg("view", "view", "Flat is the drawing seen from above. 3D lets you turn it: drag it, swipe sideways, use the arrow keys or the four viewpoints under it, and see the net, the basket, the goal or the posts stand up on the floor.", "「平面」は真上から見た図です。「3D」では図を回して見られ、ネットやバスケットゴール、ゴール、ポストが床の上に立って見えます。向きの変更は、ドラッグ、横方向のスワイプ、矢印キー、図の下の4つの視点ボタンでできます。")}
              ${seg("theme", "theme", "The page's light or dark. Drawings follow it unless they are told otherwise.", "ページのライト／ダークを選びます。特に指定しなければ、図もこれに従います。")}
            </details>
            <details class="fam-fold group" open>
              <summary data-say="groupTeams"></summary>
              ${team("away")}
              ${team("home")}
              <div class="fam-actions"><button type="button" class="fam-button" id="swap" data-testid="swap" data-say="swap"></button></div>
            </details>
            <details class="fam-fold group">
              <summary data-say="game"></summary>
              ${seg("status", "status", "The state of the game: a standard one is translated, or write your own, such as 2nd period or Bottom 9th.", "試合の状況です。標準のものは表示言語に合わせて表示され、「自由入力」では「第2ピリオド」「9回裏」などを自分で書けます。")}
              <input class="fam-field" id="status-text" data-testid="status-text" data-say-label="statusCustom" data-say-placeholder="statusCustom" autocomplete="off" maxlength="30" value="${escapeAttr(fieldValue["status-text"])}"${hid("status-text")} />
              ${field("competition", "competition", 'maxlength="50"')}
              ${field("date", "date", 'maxlength="24"')}
              ${field("label", "label", 'maxlength="60"')}
              ${seg("winner", "winner", "Who is emphasised: the winner once the game is final, the leader of any game, nobody, or one side.", "強調する側を選びます。試合終了後の勝者、試合中でもリードしている側、なし、または片方です。")}
            </details>
            <details class="fam-fold group">
              <summary data-say="look"></summary>
              ${seg("detail", "detail", "Simple leaves out the small markings, which helps at small sizes.", "「簡略」は小さなラインを省きます。小さく表示するときに役立ちます。")}
              ${seg("pageant", "pageant", "Lay each team's flag or logo large over its half of the surface, as a stadium does for a final's ceremony: as a carpet with a border, or on a round stage with a ring. The score stays on the surface, or goes to the strip when the pictures need the room.", "決勝前のセレモニーのように、各チームの旗やロゴを競技場のそれぞれのハーフに大きく広げます。縁取りのあるカーペットか、金色の輪のついた丸いステージを選べます。得点は競技場の上に残るか、旗やロゴに場所が要るときは下の帯に移ります。")}
              <div id="pageant-group"${hid("pageant-group")}>
                ${seg("pageant-lines", "pageantLines", "Where the surface's lines lie: over the pictures, under them (the pictures cover the lines), or through them (under, and the pictures a little see-through).", "競技場のラインの位置を選びます。「上」は旗やロゴの上、「下」は旗やロゴの下（ラインは隠れます）、「透過」は下に置いて旗やロゴを少し透かし、ラインをうっすら見せます。")}
                <div class="setup fam-row" ${help("A ready-made trophy or medal (picked below) in the centre circle, centre ice or centre court, and an entrance: the carpets roll out and the stages grow, for readers who have not asked for less motion.", "センターサークルやリンク中央、コート中央に、トロフィーやメダルのプリセットを置きます（種類は下で選びます）。「登場の動き」は、カーペットが広がり、ステージが現れる動きです。端末で動きを減らす設定にしている場合は、動きは再生されません。")}>
                  ${toggle("pageant-emblem", "pageantEmblem")}
                  ${toggle("pageant-entrance", "pageantEntrance")}
                </div>
                ${tiles("pageant-emblem-id", "pageant-emblem-row", "pageantEmblemPick", "The trophy or medal in the centre. Each is a ready-made emblem; in your own code it is only its id, such as trophy:soccer-globe.", "中央に置くトロフィーまたはメダルです。どれもプリセットのエンブレムで、コードでは「trophy:soccer-globe」のようなIDだけで指定します。")}
              </div>
              <div class="setup fam-row" id="emblem-line-row"${hid("emblem-line-row")} ${help("Draw the ready-made emblems as one outline in the page's colour instead of full-colour metal: it reads at 14 pixels, next to text. In code it is /line after the id.", "プリセットのエンブレムを、金属調のフルカラーではなく、ページの文字色の線画で描きます。14ピクセルほどの小ささでも、文字の横で見分けやすくなります。コードではIDの後ろに「/line」を付けます。")}>
                ${toggle("emblem-line", "emblemLine")}
              </div>
              <div class="setup fam-row" ${help("Mown stripes on the grass, and true line widths: lines are drawn thicker than painted so that they stay in view when small.", "芝の縞模様と、実寸どおりの線幅です。通常は、小さくても見えるよう線を実際より太く描きます。")}>
                ${toggle("stripes", "stripes")}
                ${toggle("exact", "exact")}
              </div>
              <div class="setup fam-row" ${help("Draw the stands round the surface and the people in them: a bowl, two sides, a horseshoe or a ballpark's grandstands, in the home colours with the visitors at an end. Every surface that has spectators takes it.", "競技場の周りにスタンドと観客を描きます。ボウル型、両サイド型、馬蹄形、球場型など、会場に合わせた形で、観客はホームチームの色、ビジターの観客は片方の端に集まります。スタンドのある競技場すべてで使えます。")}>
                ${toggle("crowd", "crowd")}${toggle("crowd-tifo", "crowdTifo")}
              </div>
              <div class="setup fam-row" id="venue-row"${hid("venue-row")} ${help("In the 3D view the stands rise round the surface, raked as the data gives them, and fade on the side nearest you so that the surface is never hidden. A roof or canopy goes over the top tier.", "3D表示では、スタンドがデータに基づく傾斜で競技面のまわりに立ち上がります。手前側は透けて見えるので、競技面が隠れることはありません。最上段の上に屋根（キャノピー）をかけることもできます。")}>
                ${toggle("venue-roof", "venueRoof")}
              </div>
              <div id="lineup-group"${hid("lineup-group")}>
                ${seg("lineup", "lineup", "Draw a made-up team on each side of the surface, placed by position code in a formation of the sport: the six on the ice and a second line for hockey, the nine fielders and the designated hitter for baseball, the fifteen for rugby, the eighteen of Australian football, and so on. A disc or a jersey holds the number, the name is under it.", "競技ごとのフォーメーションに従って、架空のチームを競技場の両側に配置します。ポジションのコードで位置が決まり、アイスホッケーは氷上の6人と第2ライン、野球は9人の野手と指名打者、ラグビーは15人、オーストラリアンフットボールは18人などです。円形またはユニフォームの中に番号、その下に名前が入ります。")}
              </div>
              <div class="setup fam-row" id="place-group"${hid("place-group")} ${help("Click the drawing to drop a point where you click, and read its coordinates: feet from the surface's top left as it is drawn wide. The points are in the address and in the code below.", "図をクリックした位置に点を置き、その座標を読み取ります。座標は、競技場を横長に描いたときの左上からの距離（フィート）です。点はURLと下のコードにも反映されます。")}>
                ${toggle("place", "place")}
                <button type="button" class="fam-chip" id="place-clear" data-testid="place-clear" data-say="placeClear"></button>
                <output class="era-season" id="place-out" data-testid="place-out" aria-live="polite"></output>
              </div>
              <div class="setup fam-row" id="crowd-row"${hid("crowd-row")} ${help("How full the stands are: the share of seats with someone in them. The empty seats show.", "スタンドの埋まり具合です。人が座っている席の割合で、空席もそのまま描かれます。")}>
                <label class="fam-label" for="crowd-density" data-say="crowdDensity"></label>
                <input type="range" class="fam-field era-range" id="crowd-density" data-testid="crowd-density" min="0" max="100" step="5" value="${first.crowdDensity}" />
                <output class="era-season" id="crowd-density-out" data-testid="crowd-density-out" for="crowd-density">${first.crowdDensity}%</output>
              </div>
              <div id="soccer-group"${hid("soccer-group")}>
                ${seg("pattern", "stripePattern", "How the grass is mown: bands across the pitch, wide or narrow, along it, in checks or on the diagonal.", "芝の刈り方です。ピッチを横切る縞（標準・太い・細い）、縦方向の縞、市松模様、斜めの縞から選べます。")}
                ${seg("goals", "goalStyle", "How the goals are drawn from above: the net as a box, a line on the goal line, a solid strip or nothing.", "ゴールを真上から見た描き方です。ネットを四角で描く、ゴールライン上の線にする、塗りつぶした帯にする、描かない、の4つから選べます。")}
                ${seg("half", "half", "Show the whole pitch or one half. A drawing with teams always shows the whole pitch.", "ピッチ全体か、片側の半面を表示します。チームを載せた図では常にピッチ全体を表示します。")}
                <div class="setup fam-row">${toggle("flags", "cornerFlags")}</div>
              </div>
              <div id="curling-group"${hid("curling-group")}>
                ${seg("sheet", "sheet", "Show the whole sheet, only its top house or only its bottom house (the hog line to the back line), or fold it: the whole sheet as a strip with both houses enlarged beside it, so that the drawing fills a square. A drawing with teams always shows the whole sheet.", "シート全体、上のハウスだけ、下のハウスだけ（どちらもホッグラインからバックラインまで）、または折りたたみ表示を選びます。折りたたみ表示では、シート全体を細長い帯にして中央に置き、両端のハウスを拡大して並べるので、図がほぼ正方形に収まります。チームを載せた図では常にシート全体を表示します。")}
              </div>
              <div id="pool-group"${hid("pool-group")}>
                ${seg("pool-look", "poolLook", "How the water is painted: one flat colour, a faint net of light on the floor (the same light every time), or the light with the tiles of the floor.", "水面の描き方を、1色のフラット、床に映る光の網目（毎回同じ模様）、光に床のタイルを加えたものから選びます。")}
                ${seg("pool-deck", "poolDeck", "The deck round the pool, plain or tiled.", "プールの周りのデッキを、無地かタイル張りから選びます。")}
                <div id="swim-group"${hid("swim-group")}>
                  ${seg("pool-course", "poolCourse", "The long course of 50 metres or the short course of 25 metres.", "長水路（50m）か短水路（25m）を選びます。")}
                  ${seg("pool-lanes", "poolLanes", "How many lanes: six, eight (the Olympic Games) or ten (the World Championships, lanes 0 to 9).", "レーン数を選びます。6、8（オリンピック）、10（世界選手権。レーン0〜9）です。")}
                  ${seg("pool-race", "poolRace", "A made-up race on the pool: none, the results with places, times, reaction times and splits, or the split pace bars.", "プールに架空のレースを載せます。なし、順位・タイム・反応時間・途中時間を載せた結果、途中時間のペースの棒から選べます。")}
                  <div class="setup fam-row" ${help("A side section under the plan: the depth, the blocks, the flags and the false start rope.", "平面図の下に断面図を付けます。水深、スタート台、背泳ぎ用フラッグ、フォルススタートロープを示します。")}>${toggle("pool-section", "poolSection")}</div>
                </div>
              </div>
              <div id="athletics-group"${hid("athletics-group")}>
                ${seg("track", "track", "The colour of the track: Mondo red, Berlin's blue, a club's terracotta or green.", "トラックの色です。標準の赤、ベルリンの青、クラブのテラコッタ、緑から選べます。")}
                ${seg("infield", "infield", "What is inside the track: the soccer pitch, plain mown grass or nothing.", "トラックの内側です。サッカーのピッチ、芝だけ、何もなし、から選べます。")}
              </div>
              <div id="races-group"${hid("races-group")}>
                ${seg("races", "races", "Mark the starting and finishing lines of every race (an athletics track's relay zones and hurdles too), or none.", "すべての種目のスタートラインとフィニッシュライン（陸上競技ではリレーゾーンとハードルも）を描くか、描かないかを選びます。")}
              </div>
              <div id="budo-group"${hid("budo-group")}>
                <div id="budo-look-row"${hid("budo-look-row")}>
                  ${seg("budo-look", "budoLook", "The mats: the sport's own colours (the IJF's yellow and red for judo, the WKF's blue and red for karate, traditional green and beige for a dojo), the traditional green and beige tatami, a blue floor or a black one.", "畳の色を選びます。競技の標準（柔道は黄と赤、空手は青と赤、道場は伝統的な緑と薄茶）、伝統的な緑と薄茶の畳、青い床、黒い床から選べます。")}
                </div>
                <div id="budo-areas-row"${hid("budo-areas-row")}>
                  ${seg("budo-areas", "budoAreas", "How many contest areas lie side by side on the floor, with the common safe zone between them.", "床に並べる試合場の数を選びます。試合場の間には共通の安全地帯が入ります。")}
                </div>
                <div id="dojo-row"${hid("dojo-row")}>
                  ${seg("dojo-jo", "dojoJo", "The size of the floor in jo (one jo is one mat): the usual 8, 12, 20, 50, 100 and 200.", "床の広さを畳数で選びます。一般的な8畳、12畳、20畳、50畳、100畳、200畳から選べます。")}
                </div>
                <div class="setup fam-row" id="budo-chips"${hid("budo-chips")} ${help("Budokan floor: the contest area in the middle of the Nippon Budokan's octagonal hall. Officials: the technical table. Tassels: the four tassels of the dohyo's roof. Shinzen: the shrine on the dojo's wall of honour.", "武道館の床は、日本武道館の八角形のホールの中央に試合場を置きます。係員席は、競技の係員の席です。房は、土俵の屋根の四隅の房です。神棚は、道場の上座の壁の中央に置かれます。")}>${toggle("budo-hall", "budoHall")}${toggle("budo-officials", "budoOfficials")}${toggle("budo-tassels", "budoTassels")}${toggle("dojo-shinzen", "dojoShinzen")}</div>
              </div>
              <div id="court-group"${hid("court-group")}>
                ${seg("court", "court", "Five looks for the basketball court, in plain colours: the paint, the border, the wood and the words on the baselines.", "バスケットボールのコートの見た目を5種類から選べます。無地の色で、ペイント、縁取り、床の木目、ベースラインの文字を変えます。")}
                <div class="setup fam-row">${toggle("baseline", "baseline")}${toggle("centre-logo", "centreLogo")}${toggle("hardwood", "hardwood")}</div>
              </div>
            </details>
            <details class="fam-fold group" id="situation-group"${hid("situation-group")}>
              <summary data-say="groupSituation"></summary>
              <div class="setup fam-row" ${help("Show what is happening in the game: hockey's power play, empty net or shootout, baseball's runners, outs and count, football's down and distance. It is on the surface, in the badge and in the description.", "試合の状況を描きます。アイスホッケーはパワープレー・エンプティネット・シュートアウト、野球は走者・アウト・カウント、アメリカンフットボールはダウンと残りヤードです。競技場の上、バッジ、説明文に表示されます。")}>
                ${toggle("situation", "situation")}
              </div>
              <div id="sit-hockey-row"${hid("sit-hockey-row")}>
                ${seg("sit-hockey", "sitHockey", "A power play (5 against 4, with the clock), the goalkeeper pulled (6 against 5, the net ringed), a delayed penalty, or a shootout.", "パワープレー（5対4と残り時間）、ゴーリーを下げた状態（6対5でゴールを丸で囲む）、ディレードペナルティ、シュートアウトから選びます。")}
              </div>
              <div id="sit-baseball-row"${hid("sit-baseball-row")}>
                <div class="setup fam-row" ${help("Which bases have a runner on them: they are lit on the diamond.", "走者がいる塁を選びます。ダイヤモンド上でその塁が強調されます。")}>
                  ${toggle("sit-b1", "sitFirst")}${toggle("sit-b2", "sitSecond")}${toggle("sit-b3", "sitThird")}
                </div>
                ${seg("sit-outs", "sitOuts", "The outs, 0 to 2.", "アウトカウントです。0から2まで選べます。")}
                ${seg("sit-count", "sitCount", "The count, balls then strikes.", "カウントです。ボール、ストライクの順に表します。")}
              </div>
              <div id="sit-football-row"${hid("sit-football-row")}>
                ${seg("sit-down", "sitDown", "The down. The CFL has three.", "ダウンです。CFLは3ダウン制のため、4は表示されません。")}
                ${seg("sit-togo", "sitToGo", "The yards to a first down, or goal to go.", "ファーストダウンまでの残りヤード、またはゴール前（ゴール・トゥ・ゴー）を選びます。")}
                <div class="setup fam-row" ${help("Where the ball is, in yards from the offence's own goal line: 88 is the opponent's 12.", "ボールの位置です。攻撃側の自陣ゴールラインからのヤード数で表します。88なら敵陣12ヤードです。")}>
                  <label class="fam-label" for="sit-ballon" data-say="sitBallOn"></label>
                  <input type="range" class="fam-field era-range" id="sit-ballon" data-testid="sit-ballon" min="0" max="100" step="1" value="${first.sitBallOn}" />
                  <output class="era-season" id="sit-ballon-out" data-testid="sit-ballon-out" for="sit-ballon">${first.sitBallOn}</output>
                </div>
                <div class="setup fam-row" ${help("A drive chart: an arrow for each drive, with how it ended.", "ドライブチャートです。各ドライブを矢印で描き、その結果を添えます。")}>
                  ${toggle("sit-drive", "sitDrive")}
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>
      <script>${FIRST_SCRIPT}</script>

      <section class="more atlas" id="atlas" aria-labelledby="atlas-title" data-testid="atlas">
        <h2 id="atlas-title" data-say="atlasTitle"></h2>
        <p class="atlas-text" data-say="atlasText"></p>
        <div class="atlas-filters">
          <div class="setup fam-row"><span class="fam-label" data-say="atlasSport"></span><div class="fam-seg" role="group" data-say-label="atlasSport" id="atlas-sport" data-testid="atlas-sport"></div></div>
          <div class="setup fam-row"><span class="fam-label" data-say="atlasStatus"></span><div class="fam-seg" role="group" data-say-label="atlasStatus" id="atlas-status" data-testid="atlas-status"></div></div>
          <label class="setup fam-row"><span class="fam-label" data-say="atlasLeague"></span><select class="fam-field" id="atlas-league" data-testid="atlas-league" data-say-label="atlasLeague"></select></label>
          <label class="setup fam-row"><span class="fam-label" data-say="atlasCountry"></span><select class="fam-field" id="atlas-country" data-testid="atlas-country" data-say-label="atlasCountry"></select></label>
          <label class="setup fam-row"><span class="fam-label" data-say="atlasSearch"></span><input class="fam-field" type="search" id="atlas-search" data-testid="atlas-search" data-say-label="atlasSearch" autocomplete="off" maxlength="60" /></label>
          <div class="setup fam-row atlas-year-row">
            <span class="fam-label" data-say="atlasYear"></span>
            <button type="button" class="fam-chip" id="atlas-year-on" data-testid="atlas-year-on" aria-pressed="false"></button>
            <input type="range" class="fam-field era-range" id="atlas-year" data-testid="atlas-year" step="1" data-say-label="atlasYear" disabled />
            <output class="era-season" id="atlas-year-out" data-testid="atlas-year-out" for="atlas-year"></output>
          </div>
          <div class="setup fam-row atlas-count-row">
            <output class="atlas-count" id="atlas-count" data-testid="atlas-count" aria-live="polite"></output>
            <button type="button" class="fam-button" id="atlas-reset" data-testid="atlas-reset" data-say="atlasReset"></button>
          </div>
        </div>
        <div class="atlas-grid">
          <div class="atlas-map-col">
            <div class="atlas-map" id="atlas-map" data-testid="atlas-map"></div>
            <ul class="atlas-key" id="atlas-key" data-testid="atlas-key"></ul>
            <p class="atlas-hint" id="atlas-hint"></p>
          </div>
          <div class="atlas-side">
            <div class="atlas-detail" id="atlas-detail" data-testid="atlas-detail" aria-live="polite"></div>
            <ul class="atlas-list" id="atlas-list" data-testid="atlas-list" tabindex="-1"></ul>
          </div>
        </div>
        <dl class="atlas-credits">
          <div><dt data-say="atlasCreditMap"></dt><dd><a href="https://www.naturalearthdata.com/">Natural Earth</a> · <a href="https://github.com/johnmorrisdotca/chizu">chizu 地図</a> <span class="fam-muted" data-say="atlasCreditMapNote"></span></dd></div>
          <div><dt data-say="atlasCreditPlaces"></dt><dd><a href="https://www.wikidata.org/">Wikidata</a> <span class="fam-muted" data-say="atlasCreditPlacesNote"></span></dd></div>
          <div><dt data-say="atlasCreditSurfaces"></dt><dd><a href="https://en.wikipedia.org/">Wikipedia</a> <span class="fam-muted" data-say="atlasCreditSurfacesNote"></span></dd></div>
        </dl>
      </section>

      <section class="more embed" id="embed" aria-labelledby="embed-title">
        <h2 id="embed-title" data-say="embedTitle"></h2>
        <p data-say="embedText"></p>
        <div class="fam-panels">
          <div class="fam-tabs" role="tablist" id="embed-tabs" data-testid="embed-tabs"></div>
          <div class="fam-panel" id="embed-panel" role="tabpanel" aria-live="polite">
            <p class="fam-muted" id="embed-note"></p>
            <pre><code id="embed-code" data-testid="embed-code"></code></pre>
            <div class="fam-actions">
              <button type="button" class="fam-button" data-primary="true" id="embed-copy" data-testid="embed-copy" data-say="copy"></button>
              <button type="button" class="fam-button" id="embed-link" data-testid="embed-link" data-say="copyLink"></button>
              <button type="button" class="fam-button" id="embed-download" data-testid="embed-download" data-say="download"></button>
              <span class="fam-muted" id="embed-status" role="status"></span>
            </div>
          </div>
        </div>
      </section>

      <section class="more" id="gallery" aria-labelledby="gallery-title">
        <h2 id="gallery-title" data-say="galleryTitle"></h2>
        <p data-say="galleryText"></p>
        ${placeBody("gallery")}
      </section>

      <section class="more" id="sides" aria-labelledby="sides-title">
        <h2 id="sides-title" data-say="sideTitle"></h2>
        <p data-say="sideText"></p>
        <div class="cards cards-pair" id="side-cards" data-testid="side-cards"></div>
      </section>

      <section class="more" id="badges" aria-labelledby="badges-title">
        <h2 id="badges-title" data-say="badgeTitle"></h2>
        <p data-say="badgeText"></p>
        <ul class="badge-list" id="badge-list" data-testid="badge-list"></ul>
      </section>

      <section class="more" id="compact" aria-labelledby="compact-title">
        <h2 id="compact-title" data-say="compactTitle"></h2>
        <p data-say="compactText"></p>
        <div class="cards cards-small" id="compact-cards" data-testid="compact-cards"></div>
      </section>

      <section class="more" id="courts" aria-labelledby="courts-title">
        <h2 id="courts-title" data-say="courtTitle"></h2>
        <p data-say="courtText"></p>
        <div class="cards" id="court-cards" data-testid="court-cards"></div>
      </section>

      <section class="more" id="pitches" aria-labelledby="pitches-title">
        <h2 id="pitches-title" data-say="pitchesTitle"></h2>
        <p data-say="pitchesText"></p>
        ${placeBody("pitches")}
      </section>

      <section class="more" id="providers" aria-labelledby="providers-title">
        <h2 id="providers-title" data-say="providersTitle"></h2>
        <p data-say="providersText"></p>
        <div class="cards cards-small" id="provider-grid" data-testid="provider-grid"></div>
        <h3 class="more-sub" data-say="convTitle"></h3>
        <p data-say="convText"></p>
        <div class="converter" data-testid="converter">
          <label class="setup fam-row"><span class="fam-label" data-say="convFrom"></span><select class="fam-field" id="conv-from" data-testid="conv-from" data-say-label="convFrom"></select></label>
          <label class="setup fam-row"><span class="fam-label" data-say="convTo"></span><select class="fam-field" id="conv-to" data-testid="conv-to" data-say-label="convTo"></select></label>
          <label class="setup fam-row"><span class="fam-label">x</span><input class="fam-field" id="conv-x" data-testid="conv-x" value="83" inputmode="decimal" autocomplete="off" aria-label="x" /></label>
          <label class="setup fam-row"><span class="fam-label">y</span><input class="fam-field" id="conv-y" data-testid="conv-y" value="50" inputmode="decimal" autocomplete="off" aria-label="y" /></label>
          <div class="fam-actions"><button type="button" class="fam-button" id="conv-spot" data-testid="conv-spot" data-say="convSpot"></button></div>
          <p class="conv-result"><span data-say="convResult"></span> <output id="conv-out" data-testid="conv-out"></output></p>
        </div>
        <h3 class="more-sub" data-say="pointTitle"></h3>
        <p data-say="pointText"></p>
        <div class="pointer" data-testid="pointer">
          <label class="setup fam-row"><span class="fam-label" data-say="pointSport"></span><select class="fam-field" id="point-sport" data-testid="point-sport" data-say-label="pointSport"></select></label>
          <div class="point-wrap">
            <div class="point-stage" id="point-stage" data-testid="point-stage" tabindex="0" role="group" data-say-label="pointStage"></div>
            <span class="point-marker" id="point-marker" data-testid="point-marker" aria-hidden="true" hidden></span>
          </div>
          <p class="point-zone" id="point-zone" data-testid="point-zone" aria-live="polite"></p>
          <table class="point-table" id="point-table" data-testid="point-table"><tbody></tbody></table>
        </div>
      </section>

      <section class="more" id="data" aria-labelledby="data-title">
        <h2 id="data-title" data-say="dataTitle"></h2>
        <p data-say="dataText"></p>
        <div class="cards" id="data-cards" data-testid="data-cards"></div>
      </section>

      <section class="more" id="charts" aria-labelledby="charts-title">
        <h2 id="charts-title" data-say="chartsTitle"></h2>
        <p data-say="chartsText"></p>
        <div class="cards" id="chart-cards" data-testid="chart-cards"></div>
      </section>

      <section class="more" id="pools" aria-labelledby="pools-title">
        <h2 id="pools-title" data-say="poolsTitle"></h2>
        <p data-say="poolsText"></p>
        <div class="cards cards-pair" id="pool-cards" data-testid="pool-cards"></div>
      </section>

      <section class="more" id="marks" aria-labelledby="marks-title">
        <h2 id="marks-title" data-say="marksTitle"></h2>
        <p data-say="marksText"></p>
        <div class="cards cards-pair" id="mark-cards" data-testid="mark-cards"></div>
      </section>

      <section class="more" id="live" aria-labelledby="live-title">
        <h2 id="live-title" data-say="liveTitle"></h2>
        <p data-say="liveText"></p>
        <div class="live-grid">
          <div id="live-stage" class="live-stage" data-testid="live-stage"></div>
          <div class="fam-actions">
            <button type="button" class="fam-button" id="live-step" data-testid="live-step" data-say="liveStep"></button>
            <button type="button" class="fam-button" id="live-play" data-testid="live-play" aria-pressed="false" data-say="livePlay"></button>
            <button type="button" class="fam-button" id="live-new" data-testid="live-new" data-say="liveNew"></button>
          </div>
        </div>
      </section>

      <section class="more" id="replay" aria-labelledby="replay-title">
        <h2 id="replay-title" data-say="replayTitle"></h2>
        <p data-say="replayText"></p>
        <div class="replay-grid" data-testid="replay-cards">
          <figure class="card"><div class="card-stage" id="replay-rink" data-testid="replay-rink"></div><figcaption data-say="replayRink"></figcaption></figure>
          <figure class="card"><div class="card-stage" id="replay-pitch" data-testid="replay-pitch"></div><figcaption data-say="replayPitch"></figcaption></figure>
          <figure class="card"><div class="card-stage" id="replay-pool" data-testid="replay-pool"></div><figcaption data-say="replayPool"></figcaption></figure>
          <figure class="card"><kyogijo-field id="replay-element" data-testid="replay-element" sport="nhl" loop speed="2" language="en"></kyogijo-field><figcaption data-say="replayElement"></figcaption></figure>
        </div>
      </section>

      <section class="more" id="parks" aria-labelledby="parks-title">
        <h2 id="parks-title" data-say="parksTitle"></h2>
        <p data-say="parksText"></p>
        ${placeBody("parks")}
      </section>

      <section class="more" id="grounds" aria-labelledby="grounds-title">
        <h2 id="grounds-title" data-say="groundsTitle"></h2>
        <p data-say="groundsText"></p>
        ${placeBody("grounds")}
      </section>

      <section class="more" id="elements" aria-labelledby="elements-title">
        <h2 id="elements-title" data-say="elementTitle"></h2>
        <p data-say="elementText"></p>
        <div class="cards cards-pair" data-testid="element-cards">
          <kyogijo-field data-testid="element-nhl" sport="nhl" orientation="auto" home="Lakeshore Anchors" away="Northern Owls" home-score="2" away-score="3" home-color="#0f7a7a" away-color="#3a2d6b" status="final-ot" competition="Cup Final, Game 7"></kyogijo-field>
          <kyogijo-field data-testid="element-nba" sport="nba" orientation="auto" size="compact" home="Metro Bolts" away="Summit Peaks" score="112-108" home-color="#c2410c" away-color="#14233f" status="final"></kyogijo-field>
          <kyogijo-field data-testid="element-mlb" sport="mlb" park="fenway-park" size="badge" home="Coastal Pines" away="Valley Stars" home-score="6" away-score="4" home-color="#1f6b3c" away-color="#c8102e" status="Bottom 9th"></kyogijo-field>
        </div>
      </section>

      ${familyUnreviewed({ id })}
      <section class="more" aria-labelledby="more-title">
        <h2 id="more-title" data-say="usesTitle"></h2>
        <p data-say="moreText"></p>
        <ul class="uses">
          <li><code>drawKyogijo({ sport: "nhl", away: { name: "Northern Owls", score: 3 }, home: { name: "Lakeshore Anchors", score: 2 }, status: "final-ot" })</code></li>
          <li><code>drawKyogijo({ sport: "mlb", park: "tokyo-dome", orientation: "portrait" })</code></li>
          <li><code>drawKyogijo({ sport: "nba", size: "badge", away, home })</code></li>
          <li><code>drawKyogijo({ sport: "soccer", pitchType: "opta" })</code></li>
          <li><code>&lt;kyogijo-field sport="nfl" away="Gulls" home="Bison" score="24-27"&gt;</code></li>
        </ul>
      </section>
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="demo.js"></script>
  </body>
</html>
`;

const load = (path) => import(pathToFileURL(join(chizu, "dist", path)).href);
const { PLACES } = await import(pathToFileURL(join(process.cwd(), "dist", "atlas-entry.js")).href);
const picture = atlasMapSvg({ places: PLACES, world: (await load("world-entry.js")).default, drawChizu: (await load("draw-entry.js")).drawChizu, projectPoint: (await load("index.js")).projectPoint });
writeFileSync("site/atlas-map.svg", picture);
writeFileSync("docs/atlas-map.svg", picture);
writeFileSync("site/index.html", sayEnglish(page, WORDS.en));
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Kyogijo Stadiums" }));
// The documentation pages: docs/*.md as pages, and the gallery, drawn from code by the built package.
const made = buildDocs({
  root: process.cwd(),
  outDir: "site/docs",
  id,
  name: "Kyogijo Stadiums",
  extraPages: galleryData(lib).map((one) => galleryPageHtml(one, style)),
  siteBlocks: { frames: framesBlockHtml(lib, style) },
  files: framesFiles(lib),
});
console.log(`site/docs/ is ready: ${made.pages} pages, ${made.entries} titles and headings to search.`);
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
