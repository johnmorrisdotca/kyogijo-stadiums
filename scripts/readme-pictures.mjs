// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo, then runs this).
// The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is readme-pictures-lib.mjs.
// The page is served to a browser without a port, never fetched from the live site, and the same each run: the sport, the park and
// the layout are named by the address, the teams are made up, and motion is reduced. It waits on the drawing's own svg and the
// page's ready mark, never on a clock.
// Output: docs/images/<subject>-<desk|phone>-<light|dark>.webp.
import { takePictures } from "./readme-pictures-lib.mjs";

const READY = '[data-testid="stage"][data-ready="true"] svg.kyogijo';
const stage = '[data-testid="stage"]';
const READY_TURN = '[data-testid="stage"][data-ready="true"] .ky-turn';
const address = (query) => `/?lang=en&help=off&${query}`;

await takePictures({
  shots: [
    // The rink on a desk, from the top of the page. On a phone: the football field, turned a quarter to fit.
    {
      subject: "hero",
      views: ["desk", "phone"],
      url: address("sport=nhl&orientation=landscape"),
      height: 900,
      ready: READY,
      async prepare(page, { view }) {
        if (view === "phone") {
          await page.goto(new URL(address("sport=nfl"), page.url()).href);
          await page.waitForSelector(READY);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
      },
    },
    // A football field with a score on it.
    { subject: "football", views: ["desk"], url: address("sport=nfl&orientation=landscape"), ready: READY, target: stage },
    // A basketball court in a look of its own.
    { subject: "court", views: ["desk"], url: address("sport=nba&orientation=landscape&court=twoTone&baseline=1"), ready: READY, target: stage },
    // A ballpark's fence, drawn from its published distances, with its dugouts for the teams.
    { subject: "ballpark", views: ["desk"], url: address("sport=mlb&park=hanshin-koshien-stadium&orientation=landscape"), ready: READY, target: stage },
    // The same game tall, for a phone: the words upright, the teams top and bottom.
    { subject: "tall", views: ["phone"], url: address("sport=nhl&orientation=portrait"), ready: READY, target: stage },
    // The 3D view: a volleyball court from behind an end line with the net standing on it, a rink from a low corner with its boards, glass and goals, a court from the main camera with its baskets.
    { subject: "turn-volleyball", views: ["desk"], url: address("sport=volleyball&view=3d&viewpoint=end"), ready: READY_TURN, target: stage },
    { subject: "turn-rink", views: ["desk"], url: address("sport=nhl&view=3d&viewpoint=corner"), ready: READY_TURN, target: stage },
    { subject: "turn-court", views: ["desk"], url: address("sport=nba&view=3d&viewpoint=broadcast"), ready: READY_TURN, target: stage },
    // The strips for a list of games.
    { subject: "badges", views: ["desk"], url: address("sport=nba"), ready: READY, target: '[data-testid="badge-list"]' },
  ],
});
