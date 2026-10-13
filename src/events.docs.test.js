// The special games held to the pages that cite them: docs/special-games.md lists every game with its day and its venue, docs/sources.md and NOTICE.md
// name every source, and the page's table says what the code says of how each game's place was decided and how it fits. Plain JavaScript.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { EVENT_IDS, EVENT_SOURCES, EVENTS, eventFit } from "./events.ts";

const page = readFileSync("docs/special-games.md", "utf8");
const sources = readFileSync("docs/sources.md", "utf8");
const notice = readFileSync("NOTICE.md", "utf8");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A game's days as the page's table writes them: `January 26 and 29, 2014`. */
function days(dates) {
  const parts = dates.map((day) => day.split("-").map(Number));
  if (parts.length === 1) return `${MONTHS[parts[0][1] - 1]} ${parts[0][2]}, ${parts[0][0]}`;
  return `${MONTHS[parts[0][1] - 1]} ${parts.map(([, , d]) => d).join(" and ")}, ${parts[0][0]}`;
}

describe("the special games' pages", () => {
  const rows = page.split("\n").filter((line) => line.startsWith("| `") && (line.includes("convention") || line.includes("as the sources give it")));

  it("list every game with its day, its venue, how its place was decided and how much of it is beyond its host", () => {
    for (const id of EVENT_IDS) {
      const event = EVENTS[id];
      const row = page.split("\n").find((line) => line.startsWith(`| \`${id}\` |`));
      expect(row, id).toBeDefined();
      expect(row, id).toContain(event.name.en);
      expect(row, id).toContain(days(event.dates));
      expect(row, id).toContain(event.venue.en);
      expect(row, id).toContain(event.basis.kind === "published" ? "as the sources give it" : `convention: ${event.basis.rule}`);
      const fit = eventFit(id);
      expect(row, id).toContain(fit.inside ? "| no |" : `| ${Math.round(fit.outside * 100)} percent |`);
    }
    expect(rows.length).toBe(EVENT_IDS.length);
    expect(page).toContain(`holds eighteen games`);
    expect(EVENT_IDS).toHaveLength(18);
  });

  it("cite every source in docs/sources.md and in NOTICE.md, at the revision it was read at", () => {
    for (const source of Object.values(EVENT_SOURCES)) {
      const revision = /^revision (\d+)$/.exec(source.edition)?.[1];
      if (revision !== undefined) {
        expect(notice, source.id).toContain(`| ${source.title} | ${revision} |`);
      } else {
        expect(notice, source.id).toContain(source.url);
        expect(sources, source.id).toContain(source.by.split(", ").at(-1));
      }
    }
    expect(sources).toContain("## Special games");
    for (const text of ["112 feet from home plate and 288", "pitching mound", "second-to-third-base axis", "1,092 feet overall length and 252 feet", "385 to center in 2019"]) expect(sources, text).toContain(text);
  });

  it("say what is not drawn, and why", () => {
    expect(page).toContain("## What is not drawn");
    for (const word of ["Wrigley Field", "Gocheok Sky Dome", "Estadio Alfredo Harp Helú", "2024"]) expect(page, word).toContain(word);
  });
});
