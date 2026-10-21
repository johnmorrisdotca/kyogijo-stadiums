// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo, then runs this).
// The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is readme-pictures-lib.mjs.
// The page is served to a browser without a port, never fetched from the live site, and the same each run: the sport, the park and
// the layout are named by the address, the teams are made up, and motion is reduced. It waits on the drawing's own svg and the
// page's ready mark, never on a clock.
// Every picture stands on one of the family's shared backgrounds (scripts/family-backgrounds.ts, chosen in the demo's own Background menu, so the picture is the page as a reader can make it): the
// surface is the drawing as the package makes it, and the background is the felt around it, in the dark or the light variant of the picture's scheme. Which background, and why, is at each shot.
// Output: docs/images/<subject>-<desk|phone>-<light|dark>.webp.
import process from "node:process";
import { takePictures } from "./readme-pictures-lib.mjs";

const READY = '[data-testid="stage"][data-ready="true"] svg.kyogijo';
const stage = "#felt";
const READY_HALLS = 'body[data-ready="true"] #stage svg';
const READY_TURN = '[data-testid="stage"][data-ready="true"] .ky-turn';
const READY_HALLS_TURN = 'body[data-ready="true"] #stage .ky-turn';
/** Short invented names, so that every name fits its seat when the picture is close up on the bench. */
const JUDGING_SHORT = JSON.stringify([{ l: "", o: [["Aiko Mori", "J-1042"], ["Dan Okafor", "J-0377"], ["Sofia Berg", "J-2210"], ["Ken Sato", "J-0918"], ["Marta Nowak", "J-1555"]] }]);
const address = (query) => `/?lang=en&help=off&${query}`;

/** Wait for the page to be at rest: two frames, so that a picture drawn at the felt's shape has been laid in. */
const settle = (page) => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
/** Choose a background in the demo's menu (a name, one for each scheme, or a function of the view and scheme), once `before` (if any) has set the page up; `after` runs last. */
const behind = (names, before, after) => async (page, state) => {
  if (before) await before(page, state);
  const name = typeof names === "string" ? names : typeof names === "function" ? names(state) : names[state.scheme];
  await page.selectOption("#background", name);
  await page.waitForSelector(`#felt[data-background="${name}"]`);
  await settle(page);
  if (after) await after(page, state);
};

// ONLY=multi-judo,multi-curling takes just those subjects and leaves the other pictures as they are.
await takePictures({
  only: process.env.ONLY?.split(","),
  shots: [
    // The rink on a desk, from the top of the page. On a phone: the football field, turned a quarter to fit.
    {
      subject: "hero",
      views: ["desk", "phone"],
      url: address("sport=nhl&orientation=landscape"),
      height: 900,
      ready: READY,
      // The rink on ice; the football field under floodlights.
      prepare: behind(({ view }) => (view === "phone" ? "floodlights" : "ice"), async (page, { view }) => {
        if (view === "phone") {
          await page.goto(new URL(address("sport=nfl"), page.url()).href);
          await page.waitForSelector(READY);
        }
      }, async (page) => {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
      }),
    },
    // A football field with a score on it.
    { subject: "football", views: ["desk"], url: address("sport=nfl&orientation=landscape"), ready: READY, target: stage, prepare: behind("floodlights") },
    // A basketball court in a look of its own, in a glow.
    { subject: "court", views: ["desk"], url: address("sport=nba&orientation=landscape&court=twoTone&baseline=1"), ready: READY, target: stage, prepare: behind("glow") },
    // A ballpark's fence, drawn from its published distances, with its dugouts for the teams.
    { subject: "ballpark", views: ["desk"], url: address("sport=mlb&park=hanshin-koshien-stadium&orientation=landscape"), ready: READY, target: stage, prepare: behind("royal") },
    // The same game tall, for a phone: the words upright, the teams top and bottom.
    { subject: "tall", views: ["phone"], url: address("sport=nhl&orientation=portrait"), ready: READY, target: stage, prepare: behind("ice") },
    // The 3D view: a volleyball court from behind an end line with the net standing on it, a rink from a low corner with its boards, glass and goals, a court from the main camera with its baskets.
    { subject: "turn-volleyball", views: ["desk"], url: address("sport=volleyball&view=3d&viewpoint=end"), ready: READY_TURN, target: stage, prepare: behind("spotlight") },
    { subject: "turn-rink", views: ["desk"], url: address("sport=nhl&view=3d&viewpoint=corner"), ready: READY_TURN, target: stage, prepare: behind("ice") },
    { subject: "turn-court", views: ["desk"], url: address("sport=nba&view=3d&viewpoint=broadcast"), ready: READY_TURN, target: stage, prepare: behind("glow") },
    // Tournament layouts (0.12.0): several surfaces on one floor, to scale, as the demo's halls page draws them (its stage, cropped; the page follows the colour scheme).
    { subject: "multi-tabletennis", views: ["desk"], url: "/halls.html?preset=tabletennis-4", ready: READY_HALLS, target: "#stage" },
    { subject: "multi-judo", views: ["desk"], url: "/halls.html?preset=judo-1x3", ready: READY_HALLS, target: "#stage" },
    // The same three areas with the places for the event's words and marks left empty (`sample=0`): what an organiser fills. Every other layout picture is dressed with sample content, the demo's default.
    { subject: "multi-judo-empty", views: ["desk"], url: "/halls.html?preset=judo-1x3&sample=0", ready: READY_HALLS, target: "#stage" },
    // The same layouts in 3D (0.13.0): the tables on their legs with the nets, the surrounds, the chairs and the scoreboard, zoomed in a little.
    {
      subject: "multi-tabletennis-3d",
      views: ["desk"],
      url: "/halls.html?preset=tabletennis-4&view=3d&viewpoint=corner",
      ready: READY_HALLS_TURN,
      target: "#stage",
      prepare: async (page) => {
        await page.locator("#stage .ky-turn-view").focus();
        for (let i = 0; i < 4; i += 1) await page.keyboard.press("+");
        await settle(page);
        await page.locator("#stage .ky-turn-view").blur();
      },
    },
    // The judo kata area (0.14.0): the IJF's kata area with its three tapes, the judges on the shomen side and the coach's chair, as the demo draws it.
    { subject: "judo-kata", views: ["desk"], url: address("sport=judo&league=ijf-kata&budoofficials=1&size=surface&orientation=landscape"), ready: READY, target: stage, prepare: behind("spotlight") },
    // The same area close up: the viewBox is narrowed to the line across the centre, so the three tapes (5 cm by 50 cm, 3 m apart) can be seen.
    {
      subject: "judo-kata-tapes",
      views: ["desk"],
      url: address("sport=judo&league=ijf-kata&size=surface&orientation=landscape"),
      ready: READY,
      target: stage,
      prepare: behind("spotlight", undefined, (page) =>
        page.evaluate(() => {
          const svg = document.querySelector('[data-testid="stage"] svg.kyogijo');
          const k = 3.28084;
          svg.setAttribute("viewBox", `${(7 - 5.5) * k} ${(7 - 1.6) * k} ${11 * k} ${3.2 * k}`);
        }),
      ),
    },
    // The MMA cage: the eight-sided cage on its platform with a bout's score, as the demo draws it, and the same in 3D from a low corner.
    { subject: "mma-cage", views: ["desk"], url: address("sport=mma&orientation=landscape"), ready: READY, target: stage, prepare: behind("spotlight") },
    // The boxing ring in 3D from a low corner, in the same light.
    // The UWW's wrestling mat in 3D from a low corner, on its platform.
    // The professional wrestling ring in 3D from a low corner.
    { subject: "prowrestling-ring-3d", views: ["desk"], url: address("sport=prowrestling&size=surface&view=3d&viewpoint=corner"), ready: READY_TURN, target: stage, prepare: behind("spotlight") },
    { subject: "wrestling-mat-3d", views: ["desk"], url: address("sport=wrestling&size=surface&view=3d&viewpoint=corner"), ready: READY_TURN, target: stage, prepare: behind("spotlight") },
    { subject: "boxing-ring-3d", views: ["desk"], url: address("sport=boxing&size=surface&view=3d&viewpoint=corner"), ready: READY_TURN, target: stage, prepare: behind("spotlight") },
    { subject: "mma-cage-3d", views: ["desk"], url: address("sport=mma&size=surface&view=3d&viewpoint=corner"), ready: READY_TURN, target: stage, prepare: behind("spotlight") },
    // Judging assignments (0.17.0): the judges' table of a kata area in 3D with a name card in front of each judge and the mat's name on a sign, close up on the bench, with the chart beside the view (invented names; the judging page's stage).
    { subject: "judging-3d", views: ["desk"], url: `/judging.html?mat=1&view=3d&focus=bench&orientation=landscape&d=${encodeURIComponent(JUDGING_SHORT)}`, ready: READY_HALLS_TURN, target: "#stage" },
    // The broadcast view (0.19.0): the mat large from the Broadcast camera, with the officials on a board at its side like a television graphic (invented names; the judging page's stage). The 2D picture, a contest area and Japanese are in the docs gallery, drawn by the build.
    { subject: "judging-broadcast-3d", views: ["desk"], url: "/judging.html?view=broadcast&mat=1", ready: READY_HALLS_TURN, target: "#stage" },
    // The real venues (0.25.0): the Honda Center in the outline of its building, and the Saddledome under its saddle roof in 3D (the venues page's stage).
    { subject: "venues-honda", views: ["desk"], url: "/venues.html?venue=honda-center", ready: READY_HALLS, target: "#stage" },
    { subject: "venues-saddledome-3d", views: ["desk"], url: "/venues.html?venue=scotiabank-saddledome&view=3d&viewpoint=broadcast&roof=1", ready: READY_HALLS_TURN, target: "#stage" },
    // The real stadiums and a district (0.26.0): BC Place's soccer pitch under its cable roof in 3D, and BC Place beside Rogers Arena in 3D (the stadiums and district pages' stage); their 2D drawings are in the docs gallery.
    { subject: "stadiums-bc-place-3d", views: ["desk"], url: "/stadiums.html?config=soccer&view=3d&viewpoint=broadcast&roof=1", ready: READY_HALLS_TURN, target: "#stage" },
    { subject: "district-bc-rogers-3d", views: ["desk"], url: "/district.html?view=3d&viewpoint=broadcast&labels=1", ready: READY_HALLS_TURN, target: "#stage" },
    // Seattle (0.30.0): the two SoDo stadiums side by side in 3D, a ballpark and a football stadium on one ground (the district page's stage); the city view with Climate Pledge Arena is in the docs gallery.
    { subject: "district-seattle-3d", views: ["desk"], url: "/district.html?venues=t-mobile-park,lumen-field&view=3d&viewpoint=broadcast&labels=1", ready: READY_HALLS_TURN, target: "#stage" },
    // Tokyo Dome (0.33.0): the ballpark under its air-supported roof in 3D from a low corner (the stadiums page's stage), and Tokyo Dome City, the Dome with Korakuen Hall, on one ground (the district page's stage).
    { subject: "stadiums-tokyo-dome-3d", views: ["desk"], url: "/stadiums.html?stadium=tokyo-dome&view=3d&viewpoint=corner&roof=1", ready: READY_HALLS_TURN, target: "#stage" },
    { subject: "district-tokyo-3d", views: ["desk"], url: "/district.html?venues=tokyo-dome,korakuen-hall&view=3d&viewpoint=corner&roof=1&labels=1", ready: READY_HALLS_TURN, target: "#stage" },
    // Boards over a surface (0.24.0): a results board over a pool, a bout presentation over a judo mat in 3D, a medal table in the corner of the athletics stadium (invented names; the boards page's stage).
    { subject: "boards-swimming", views: ["desk"], url: "/boards.html?example=swimming", ready: READY_HALLS, target: "#stage" },
    { subject: "boards-judo-3d", views: ["desk"], url: "/boards.html?example=judo&view=3d", ready: READY_HALLS_TURN, target: "#stage" },
    { subject: "boards-medals", views: ["desk"], url: "/boards.html?example=medals", ready: READY_HALLS, target: "#stage" },
    // The printout (0.19.0): one mat to an A4 page in the plan-and-chart layout, as the document `judgingPrint` makes opens on a screen (the page laid on a grey desk).
    {
      subject: "judging-print-a4",
      views: ["desk"],
      url: "/judging.html?mat=1",
      ready: READY_HALLS,
      target: "#stage",
      prepare: async (page) => {
        await page.evaluate(async () => {
          const { judgingPrintSheets, judgingPrintStyle } = await import("/dist/judging-entry.js");
          const mats = [{ label: "Mat 1", line: "Round 2", officials: [["Aiko Mori", "J-1042"], ["Daniel Okafor", "J-0377"], ["Sofia Lindqvist-Hernandez", "J-2210"], ["Kenji Watanabe", "J-0918"], ["Marta Kowalczyk", "J-1555"]].map(([name, id], i) => ({ seat: i + 1, name, id })) }];
          // The page as it is printed (the printout's own sheets and stylesheet), laid on a grey desk at a little over half its size.
          const desk = "background:#cfd3d6;padding:24px 0";
          const sheet = ".ky-ju-sheet{background:#fff;box-sizing:content-box;padding:12mm;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,.3)}";
          document.querySelector("#stage").innerHTML = `<style>${judgingPrintStyle({ paper: "a4" })}\n${sheet}</style><div style="${desk}"><div style="zoom:.58">${judgingPrintSheets({ style: "kata", mats }, { paper: "a4" })}</div></div>`;
        });
        await settle(page);
      },
    },
    // The table tennis playing area (0.15.0): the table in its 14 m by 7 m area, enclosed by surrounds, with the umpires' chairs, as the demo draws it (its own surface, no score).
    { subject: "tabletennis-area", views: ["desk"], url: address("sport=tabletennis&size=surface&orientation=landscape"), ready: READY, target: stage, prepare: behind("spotlight") },
    // The same area in 3D from a low corner.
    { subject: "tabletennis-area-3d", views: ["desk"], url: address("sport=tabletennis&size=surface&view=3d&viewpoint=corner"), ready: READY_TURN, target: stage, prepare: behind("spotlight") },
    // The strips for a list of games, on midnight. They are a list and not a surface, so the background is laid behind the list itself, by the same module and in the same way as behind the felt.
    {
      subject: "badges",
      views: ["desk"],
      url: address("sport=nba"),
      ready: READY,
      target: '[data-testid="badge-list"]',
      prepare: (page, { scheme }) => page.evaluate(async ({ name, scheme }) => {
        const { backgroundSvg } = await import("/family-backgrounds.js");
        const list = document.querySelector('[data-testid="badge-list"]');
        const box = list.getBoundingClientRect();
        const width = Math.round(box.width) + 56;
        const height = Math.round(box.height) + 56;
        const { defs, body, ink } = backgroundSvg(name, { width, height, theme: scheme, id: "list-bg" });
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs><rect width="${width}" height="${height}" fill="${ink.base}"/>${body}</svg>`;
        list.style.cssText += `;padding:28px;border-radius:12px;color:${ink.text};background:url("data:image/svg+xml,${encodeURIComponent(svg)}") center / cover`;
      }, { name: "midnight", scheme }),
    },
  ],
});
