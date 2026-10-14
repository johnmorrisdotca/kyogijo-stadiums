# WIP notes: situation (work/situation)

Ticket cmv7w6na20003jm0638gacrt8 (spx-stats board), claimed by "Mac Studio", not done. Nothing pushed, tagged or published.

## Done
- `situation` option (types in `src/situation.types.ts`, read and words in `src/situation.ts`, widgets in `src/situation.widgets.ts`, drawing in `src/situation.draw.ts`, CSS in `src/situation.style.ts`).
  - Hockey: pill (5v4 PP, EN, DEL PEN, clock), attacking-zone tint in the attacker's team colour, ringed empty net, shootout strip (goal filled, miss hollow, pending speck, rounds after the third are sudden death).
  - Baseball: lit bases on the park's diamond, scorebug (diamond, outs, inning arrow, count) at the foot of the field.
  - Football: LOS (blue), first-down line (yellow), red-zone tint, down-and-distance tag, drive arrows with result codes. CFL: 110 yd field, 20 yd end zones, 3 downs (a 4th down is left out).
  - Badge and compact card show the pill, scorebug or tag in place of the surface glyph (`badgeMarkup` takes `situation`).
  - Description sentences in English and Japanese (Japanese NOT yet reviewed by japanese-reviewer).
  - `Surface.anchors` set by hockey, baseball and football builders.
  - Exports in `src/index.ts`: `readSituation`, `situationText`, `DRIVE_CODES`, `KYOGIJO_SITUATION_STYLE` and the types.
- Rinks: `olympic` (60 by 26 m, IIHF statement via SI, 2025-12-09) and `boston-garden` (58.2 by 25.3 m, Wikipedia rev 1379921964). PWHL, NCAA, IIHF already existed. Buffalo Aud, Maple Leaf Gardens, crease history, pre-1998 blue lines: logged as gaps in docs/references.md.
- Era data: `NhlRules.twoLinePass` (1943 to 2004, data only), tests and docs/eras.md row.
- docs/architecture.md tree, docs/sources.md and docs/references.md edits, docs:make output, leagues snapshot updated. `pnpm test` and `pnpm typecheck` were green at the last run (before the final docs edits, which were text only).
- Scratch renders (hockey PP, shootout, bases, football, badges, tall) in the scratchpad `ky-situation/`; `render.mts` there regenerates them.

## Left
1. Tests: `src/situation.test.ts` (reading and clamping, CFL 3 downs, hostile clock text, toward/direction, determinism, badge, no-situation drawing unchanged byte for byte, portrait placement, range crop, description EN and JA, strings key parity).
2. Re-render and look at: PP, shootout strip, bases-loaded 3-2, football 3rd and 7 in the red zone with a drive chart, a pre-2005 rink (e.g. `year: 2000`), the Olympic rink. Tweak the football tag spacing and the drive arrows if needed.
3. Docs: new `docs/situation.md` (+ docs/README.md, README feature bullet, NAV in scripts/docs-pages.mjs with the Japanese title, entry-points.md row, theming/limits if tests ask), gallery page in scripts/docs-gallery.mjs, CHANGELOG Unreleased entry, NOTICE.md rows for the two new sources (Sports Illustrated/IIHF statement, Wikipedia Boston Garden), docs/variants.md is made by `pnpm docs:make`.
4. Demo: a Situation group in scripts/site.mjs, demo/demo.js, demo/model.js, demo/words.js (finger-wide controls, 43.5 px) and an e2e test in e2e/page.demo.mjs; docs/gallery drawings.
5. Send all Japanese (strings.ts `situation`, era `twoLinePass`, league names, demo words) to the japanese-reviewer agent, then apply fixes. Possibly basketball shot clock/bonus and soccer stoppage time: not started, list as follow-ups.
6. Run `pnpm check`, `pnpm test:readme`, `pnpm test:demo` until green; report API, sha and PNG paths.

## Decisions
- `toward` (left/right) overrides which end is attacked; else `direction`, else the end opposite the team's banner side.
- Invalid values are left out, nothing throws. Shootout excludes PP/EN/DEL PEN. `emptyNet: true` needs unequal skaters.
- Football `ballOn`/drive yards are from the team's own goal line.
- `eras` two-line pass is data only; crease history is not drawn (no citable source).
