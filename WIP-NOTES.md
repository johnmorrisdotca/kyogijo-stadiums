# WIP notes: arenas (ticket cmv7wj28p0008jm06ovfkfwyb)

## Done
- Plan: ARENAS joins the atlas as a third kind (`arena`), mirroring grounds: `scripts/arenas.data.json` (hand-kept source), `scripts/build-arenas.mjs` -> `src/arenas.data.ts`, `src/arenas.ts`.
- Candidate list found from English Wikipedia categories (NHL venues, Defunct NHL venues, Ottawa Senators (original) arenas, NBA venues, Former NBA venues, WNBA venues, PWHL venues, BAA venues). 187 candidates, saved as a TEMPORARY skeleton in `scripts/arenas.data.json` (only id, wikidata, name, en.title/revision). It still has to be vetted: drop venues with no NHL/NBA/WNBA/PWHL home tenant (college gyms, practice rinks, Radio City, IMG Academy...).
- `scripts/fetch-tenants.mjs --arenas` reads only the arenas and merges into `tenants.wikidata.json`; `build-tenants.mjs` now includes arenas as places.
- `scripts/tenants.curated.json`: NBA now also reads BAA titles; WNBA and PWHL leagues added (hockey/basketball).
- `scripts/fetch-arenas.mjs` written (evidence -> `scripts/arenas.wikidata.json`: Wikidata coordinates, years, capacities, names, infobox, rink/court size sentences). NOT RUN yet.

## Not done (in order)
1. Run `node scripts/fetch-tenants.mjs --arenas` (about 15+ min, one request at a time; it was killed mid-run, nothing was written) then `node scripts/fetch-arenas.mjs`, then `node scripts/build-tenants.mjs --report`.
2. Vet the candidates by tenants; give each kept arena its id, names (names over time), city, country, opened/closed, capacity for hockey and basketball, rink/court size with source (Boston Garden 191x83 ft, Chicago Stadium 185x85, Buffalo Aud 193x84 - verify in the articles), nameJa + readingJa.
3. `src/arenas.ts` + build script + `scripts/check-arenas.mjs` (like check-grounds).
4. Atlas: `Place.kind` gains `arena`; `PlaceSport` gains `hockey`/`basketball`; new `Place.sports` (all sports a place is drawn for; filter matches any); `PlaceSurface` nhl/nba get optional `arena`; `surfacesOf` offers the rink and the court by tenants.
5. Drawing: new `arena` option in SurfaceOptions; in `src/draw.ts` build the rink/court at the arena's documented size. `hockey()` and `basketball()` apply `era` rules also when a sized rink/court is passed (change `rink === NHL_RINK` test to `|| era !== undefined`). Title/description words in `src/strings.ts` (en + ja).
6. Demo: filters NHL/NBA in `demo/atlas.js` (+ words.js, atlas-marks.js), search by club, atlas panel; docs/atlas.md, docs/arenas.md, gallery, NOTICE.md, docs/references.md, CHANGELOG Unreleased; update the old tests that hard-code 158 places / counts (`src/atlas.test.ts`, `src/atlas.docs.test.js`).
7. japanese-reviewer on the Japanese names; `pnpm check`, `test:readme`, `test:demo`; render the atlas filtered to NHL and NBA and two historic rinks into the scratchpad ky-arenas/ and look at them.

## Decisions
- Do not push, tag or publish. Authors: John Morris <john@johnmorris.ca>, no AI attribution.
- Parks already in the atlas (Rogers Centre, Tropicana Field, Astrodome, Metrodome) are not arenas; their NBA/NHL tenants come from the tenants pipeline.
- Ticket is claimed by "Mac Studio" on the spx-stats board; not marked done. Scratch files (category dumps, cands.json) are in /private/tmp/.../scratchpad/ky-arenas/.
