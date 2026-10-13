// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's shared header and
// footer, with the family's stylesheet, Kyogijo's own, the page's scripts, the embeddable frame, the API reference and
// the compiled library beside them.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import { API_CSS, apiPage } from "./api.mjs";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "kyogijo";
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Ctext x='50' y='72' font-size='60' text-anchor='middle' fill='%23f3efe4'%3E場%3C/text%3E%3C/svg%3E";

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const help = (en, ja) => `data-help-en="${escape(en)}" data-help-ja="${escape(ja)}"`;
const seg = (name, label, en, ja) => `<div class="setup fam-row" ${help(en, ja)}><span class="fam-label" data-say="${label}"></span><div class="fam-seg" role="group" data-say-label="${label}" id="${name}" data-testid="${name}"></div></div>`;
const field = (name, label, attrs = "") => `<label class="setup fam-row"><span class="fam-label" data-say="${label}"></span><input class="fam-field" id="${name}" data-testid="${name}" data-say-label="${label}" autocomplete="off" ${attrs} /></label>`;
const toggle = (name, label) => `<button type="button" class="fam-chip" id="${name}" data-testid="${name}" aria-pressed="false" data-say="${label}"></button>`;

const team = (role) => `<div class="team" data-role="${role}">
          <h3 data-say="${role}"></h3>
          <div class="team-grid">
            ${field(`${role}-name`, "teamName", 'maxlength="40"')}
            ${field(`${role}-abbr`, "teamAbbr", 'maxlength="5"')}
            ${field(`${role}-score`, "teamScore", 'type="text" inputmode="numeric" maxlength="3"')}
            <label class="setup fam-row" id="${role}-pens-row" hidden><span class="fam-label" data-say="teamPens"></span><input class="fam-field" id="${role}-pens" data-testid="${role}-pens" data-say-label="teamPens" autocomplete="off" type="text" inputmode="numeric" maxlength="2" /></label>
            <label class="setup fam-row"><span class="fam-label" data-say="teamColour"></span><input class="fam-field fam-colour" type="color" id="${role}-color" data-testid="${role}-color" data-say-label="teamColour" /></label>
          </div>
          ${seg(`${role}-logo`, "teamLogo", "Pick a made-up emblem, or give the address of a logo of your own. A logo may be an https address, a path, an image data address or the text of an SVG.", "架空のエンブレムを選ぶか、お持ちのロゴのURLを入力します。ロゴには、httpsのURL、パス、画像のデータURI、SVGのコードを使えます。")}
          <input class="fam-field logo-url" id="${role}-logo-url" data-testid="${role}-logo-url" data-say-label="logoUrl" data-say-placeholder="logoUrl" autocomplete="off" hidden />
        </div>`;

const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "Kyogijo · sports fields, rinks, courts and ballparks drawn to scale, with the score on them",
      description: "NFL, CFL and IFAF fields, an NHL rink, an NBA court, the soccer pitch and futsal court, and every MLB and NPB ballpark as SVG, drawn to scale from the rulebooks, with each team's name and logo and the score on them. Light and dark, tall or wide, with a compact badge for lists.",
      ogTitle: "Kyogijo sports surfaces",
      ogDescription: "Fields, rinks, courts and ballparks drawn to scale as SVG, with the score on them: wide or tall, light or dark.",
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="kyogijo.css" />
  </head>
  <body>
    <main>
      ${familyHeader({ id, links: [{ href: "api.html", say: "pageApi" }] })}

      <section class="try" id="try" aria-labelledby="try-title">
        <div class="try-head">
          <h2 id="try-title" data-say="tryTitle"></h2>
          <p data-say="tryText"></p>
        </div>
        <div class="try-grid">
          <div class="try-stage">
            <div class="fam-felt stage-felt" id="felt"><div id="stage" data-testid="stage" data-ready="false"></div></div>
          </div>
          <div class="try-controls">
            <details class="fam-fold group" open>
              <summary data-say="groupSurface"></summary>
              ${seg("sport", "sport", "Choose the surface: three football fields, a hockey rink, a basketball court, a baseball field or a soccer pitch.", "競技場を選びます。アメリカンフットボール場3種類（NFL・CFL・IFAF）、アイスホッケーのリンク、バスケットボールのコート、野球場、サッカーのピッチから選べます。")}
              <div class="setup fam-row" id="pitch-row" hidden ${help("Choose the pitch: the international 105 by 68 metres, the sizes UEFA, the MLS and the NCAA publish, the least and most the Laws allow, the FA's small-sided pitches or FIFA's futsal court.", "ピッチを選びます。国際標準の105×68m、UEFA・MLS・NCAAの公表する広さ、競技規則が認める最小と最大、FAの少人数制ピッチ、FIFAのフットサルのコートがあります。")}>
                <span class="fam-label" data-say="pitchLabel"></span>
                <select class="fam-field" id="pitch" data-testid="pitch" data-say-label="pitchLabel"></select>
              </div>
              <div class="setup fam-row" id="pitch-type-row" hidden ${help("Draw the pitch in a data provider's own coordinates: the lines stand where the provider puts them, and an empty group in the drawing takes the provider's raw x and y.", "データ提供元の座標系でピッチを描きます。ラインは提供元が定める位置に引かれ、図の中の空のグループに、提供元の生のx・y座標をそのまま描き込めます。")}>
                <span class="fam-label" data-say="pitchTypeLabel"></span>
                <select class="fam-field" id="pitch-type" data-testid="pitch-type" data-say-label="pitchTypeLabel"></select>
              </div>
              <div class="setup fam-row" id="park-row" ${help("Choose the ballpark: each MLB and NPB park has its own fence, drawn from the distances published for it.", "球場を選びます。MLBとNPBの各球場には、公表されている距離をもとに描いた、その球場固有のフェンスがあります。")}>
                <span class="fam-label" data-say="park"></span>
                <select class="fam-field" id="park" data-testid="park" data-say-label="park"></select>
              </div>
              ${seg("size", "size", "On the surface puts the names and the score on the field; compact puts a strip under it; a badge is the strip alone, for lists.", "「競技場に重ねる」は名前と得点を競技場の上に表示し、「コンパクト」は下に帯を付け、「バッジ」は帯だけにします。一覧向けです。")}
              ${seg("orientation", "orientation", "Wide is the usual way round. Tall turns the surface a quarter, with the words upright and the teams top and bottom. Fit the box chooses by the shape of the space.", "「横」は通常の向きです。「縦」は競技場を90度回し、文字は水平のまま、チームを上下に並べます。「枠に合わせる」は表示領域の形に合わせて自動で選びます。")}
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
              <input class="fam-field" id="status-text" data-testid="status-text" data-say-label="statusCustom" data-say-placeholder="statusCustom" autocomplete="off" maxlength="30" hidden />
              ${field("competition", "competition", 'maxlength="50"')}
              ${field("date", "date", 'maxlength="24"')}
              ${field("label", "label", 'maxlength="60"')}
              ${seg("winner", "winner", "Who is emphasised: the winner once the game is final, the leader of any game, nobody, or one side.", "強調する側を選びます。試合終了後の勝者、試合中でもリードしている側、なし、または片方です。")}
            </details>
            <details class="fam-fold group">
              <summary data-say="look"></summary>
              ${seg("detail", "detail", "Simple leaves out the small markings, which helps at small sizes.", "「簡略」は小さなラインを省きます。小さく表示するときに役立ちます。")}
              <div class="setup fam-row" ${help("Mown stripes on the grass, and true line widths: lines are drawn thicker than painted so that they stay in view when small.", "芝の縞模様と、実寸どおりの線幅です。通常は、小さくても見えるよう線を実際より太く描きます。")}>
                ${toggle("stripes", "stripes")}
                ${toggle("exact", "exact")}
              </div>
              <div id="soccer-group" hidden>
                ${seg("pattern", "stripePattern", "How the grass is mown: bands across the pitch, wide or narrow, along it, in checks or on the diagonal.", "芝の刈り方です。ピッチを横切る縞（標準・太い・細い）、縦方向の縞、市松模様、斜めの縞から選べます。")}
                ${seg("goals", "goalStyle", "How the goals are drawn from above: the net as a box, a line on the goal line, a solid strip or nothing.", "ゴールを真上から見た描き方です。ネットを四角で描く、ゴールライン上の線、塗りつぶした帯、描かないから選べます。")}
                ${seg("half", "half", "Show the whole pitch or one half. A drawing with teams always shows the whole pitch.", "ピッチ全体か、片側の半面を表示します。チームを載せた図では常にピッチ全体を表示します。")}
                <div class="setup fam-row">${toggle("flags", "cornerFlags")}</div>
              </div>
              <div id="court-group">
                ${seg("court", "court", "Five looks for the basketball court, in plain colours: the paint, the border, the wood and the words on the baselines.", "バスケットボールのコートの見た目を5種類から選べます。無地の色で、ペイント、縁取り、床の木目、ベースラインの文字を変えます。")}
                <div class="setup fam-row">${toggle("baseline", "baseline")}${toggle("centre-logo", "centreLogo")}</div>
              </div>
            </details>
          </div>
        </div>
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
              <button type="button" class="fam-button" id="embed-download" data-testid="embed-download" data-say="download"></button>
              <span class="fam-muted" id="embed-status" role="status"></span>
            </div>
          </div>
        </div>
      </section>

      <section class="more" id="gallery" aria-labelledby="gallery-title">
        <h2 id="gallery-title" data-say="galleryTitle"></h2>
        <p data-say="galleryText"></p>
        <div class="cards" id="gallery-cards" data-testid="gallery-cards"></div>
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
        <div class="cards" id="pitch-cards" data-testid="pitch-cards"></div>
        <h3 class="more-sub" data-say="patternsTitle"></h3>
        <div class="cards cards-small" id="pattern-cards" data-testid="pattern-cards"></div>
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
      </section>

      <section class="more" id="data" aria-labelledby="data-title">
        <h2 id="data-title" data-say="dataTitle"></h2>
        <p data-say="dataText"></p>
        <div class="cards" id="data-cards" data-testid="data-cards"></div>
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

      <section class="more" id="parks" aria-labelledby="parks-title">
        <h2 id="parks-title" data-say="parksTitle"></h2>
        <p data-say="parksText"></p>
        <div class="fam-actions"><button type="button" class="fam-button" id="parks-show" data-testid="parks-show" data-say="parksShow"></button></div>
        <div class="parks" id="park-grid" data-testid="park-grid"></div>
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

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
// The declarations are for editors, not for a browser.
cpSync("dist", "site/dist", { recursive: true, filter: (from) => !/\.d\.ts$/.test(from) });
writeFileSync("site/index.html", page);
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Kyogijo", icon: ICON }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
