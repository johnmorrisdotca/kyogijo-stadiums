# WIP notes: lineup layer (work/lineup)

Ticket cmv7w6rd90005jm06ncraup3c (claimed as "Mac Studio", not done).

## Done
- Task 1 (lineup layer), code: `kind: "lineup"` (the repo uses `kind`, not `type`) in `src/team.lineup.ts`, `src/lineup.codes.ts` (short position codes, assignment, best-fit formation), `src/formations.sports.ts` (new formations for rugby, AFL, cricket x3, volleyball, handball x2, water polo, field hockey x2, netball, softball, hockey two lines, basketball traditional, DH `extra`). Types in `src/team.types.ts`, words in `src/strings.ts` (en + ja), CSS in `src/style.ts`, wiring in `team.layers.ts`, `layers.ts` (lineup not clipped by default), `layers.types.ts`, entries.
- Tests: `src/lineup.test.ts` (29 pass); `team.test.ts` updated; snapshots updated for team.test.ts and charts.network.test.ts (style sheet grew).
- Docs written: `docs/team-shape.md` (Lineups section, formations table), `docs/sources.md` rows, `docs/architecture.md`, `docs/layers.md`, README line, `scripts/docs-made.mjs` (sports count).
- Renders looked at (PNGs in the scratchpad ky-lineup dir): soccer 4-2-3-1 vs 4-4-2 (disc and jersey), NHL with second line, baseball with DH, softball, rugby, AFL, cricket, volleyball, handball, water polo, field hockey, netball, basketball, football.

## Left
- Run `pnpm docs:make` (regenerates docs/strings-ja.md and docs/limits.md), then fix failing tests: docs.test (strings-ja), docs.made (limits), architecture, docs.examples (team-shape example output "36 11").
- Japanese strings (new position names, formation names/about, lineup words) NOT yet reviewed by the japanese-reviewer agent; several are guesses (AFL "ルック", "ルックローバー", water polo "ドライバー").
- CHANGELOG Unreleased entry; gallery items in `scripts/docs-gallery.mjs`; tidy `docs/sources.md` claims (OBR Rule 5.11 for the DH, AFL/IHF/FIH/World Aquatics rule citations are from memory, check).
- Task 2 (demo URL state + Copy link), task 3 (click-to-place; check whether work/dx put `clientPointToField` on main), task 4 (favicon: `about:invalid#zCSafez`, ship static favicon.svg + apple-touch-icon.png in site build; check docs pages and gallery) are NOT started. Also a lineup control in the demo is not done.
- Football lineup marks are tiny at full-field size (linemen 1.33 yd apart); the two teams size differently. Documented to use `range`/`size`; maybe improve.
- Rebase on origin/main (two Emblems commits landed), then `pnpm check`, `test:readme`, `test:demo`.
- Render the final PNGs again (4-2-3-1 vs 4-4-2, NHL, baseball) after any change.

## Decisions
- `kind: "lineup"`, `side` home/away; away attacks left except football (offence direction by `attacking`), baseball and cricket (no turn).
- `FormationSport` extended to 13 sports; `Formation.extra` (listed-only places) and `FormationPosition.size` added; existing formations unchanged except `extra: DH` on the two baseball ones.
- Flags: SVG text / data URL / address via `safeLogo`, drawn as a small rectangular badge (no clipPath). Package draws no flags.
