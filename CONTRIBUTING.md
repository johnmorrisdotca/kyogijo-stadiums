# Contributing

Thank you for helping. Bug reports, ideas, corrections to the Japanese and pull
requests are all welcome.

This first part is the same in every package of the family. It is the master
text kept in
[johnmorrisdotca/.github](https://github.com/johnmorrisdotca/.github/blob/main/CONTRIBUTING.md),
copied unchanged into `scripts/community/CONTRIBUTING.md`, and a test holds
this file to that copy. What is particular to the package follows it, under
the heading "Particular to" and the package's name.

## Before you start

Open an issue first for anything bigger than a typo, so that we can agree on the
shape before you spend time on it. Taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md); report a security concern privately, as
[SECURITY.md](SECURITY.md) says.

## Making a change

```sh
pnpm install
pnpm check          # lint, types and tests: the same as CI
pnpm test:package   # pack it as npm does, install it in an empty project, import every entry
pnpm site           # build the demo into ./site, as GitHub Pages publishes it
```

The package's own further commands (its browser tests, its command line, its
data scripts) are listed under its own heading below.

## House rules, shared by every package of the family

- **No runtime dependencies.** Development dependencies are for tests, builds and
  documentation only.
- **The core is pure.** Every function in it returns new values and never
  changes what it was given.
- **Test what you change.** Tests sit beside the code they test. A rule you
  change has a test that would have caught it.
- **Words a person reads come in English and Japanese.** If you cannot write the
  Japanese, say so in the pull request and someone will.
- **Option values and names are kebab case.**
- **Art and sound are CC0 or public domain only**, checked at the source and
  credited. Data and word lists may be under another licence that lets them be
  shipped, with its notice kept in `NOTICE.md`. No GPL or LGPL code.
- **Needs Node 22 or later.**
- **A README table, example or count that a test holds to the code** changes
  together with the code.
- **The family's own files are the same in every package**: `demo/family.css`,
  `scripts/family-template.mjs`, `scripts/family-readme.mjs`,
  `scripts/release-notes.mjs`, the files in `scripts/community/` and
  `family.test.js` (in `src/`, or in `test/`). Do not edit one here. To change
  one, change it in every repository at once, bump `FAMILY_TEMPLATE_VERSION` for
  the template, and record the new hash in `family.test.js`. What is the
  package's own goes in its own stylesheet, `demo/<name>.css`, and its page
  builder, `scripts/site.mjs`.
- **The list of the family in the README is made, not written.**
  `pnpm family:readme` writes it between its markers from
  `scripts/family-template.mjs`.
- **The workflows are the family's too.** `ci.yml` runs `pnpm check`, the demo's
  browser tests and the packed package on Linux, macOS and Windows; `pages.yml`
  is the same text in every package. A package adds jobs of its own after those.

## Pull requests

One change per pull request. Say what changed and how you checked it, and add a
line to `CHANGELOG.md` under **Unreleased**: for a change a user would notice,
and for one to the repository alone.

## Releasing

Maintainers bump the version in `package.json` (and in `src/version.ts`, where
the package has one), move *Unreleased* to the new version in `CHANGELOG.md`,
dated, push, wait for CI and tag `vX.Y.Z`, the same as `package.json`'s version.
The Release workflow (`.github/workflows/release.yml`) checks and builds the
package, attaches the tarball to a GitHub release and publishes it to npm by
trusted publishing, with provenance and no token. A version already on npm is
not published again.

## Particular to Kyogijo Stadiums

Bug reports and ideas go in the [issues](https://github.com/johnmorrisdotca/kyogijo-stadiums/issues).

### Releasing a visual feature

A release that adds something a reader can see (a new surface or event type, a look, a preset) is not finished until the npm page shows it. New visual feature? Update the README images (`pnpm screenshots:readme`, or `ONLY=<subject> node scripts/readme-pictures.mjs` for one) and add a showcase section to the README and the docs if the current examples do not show it well. A small fix or an internal change needs neither.

### Commands and rules

```sh
pnpm check          # lint, types, tests, the build and the packed package
pnpm test:package   # pack it as npm does, install it in an empty project, import every entry
pnpm test:demo      # build the demo and play it in a real browser
pnpm test:readme    # run the examples of the README and of docs/ against the built package
pnpm docs:make      # rewrite what the docs make from the source: docs/strings-ja.md, docs/variants.md, docs/variants.ja.md, the tables of frames, units and limits
```

**A dimension is a published fact.** Every number in `src/geometry.ts` comes from a rulebook, a federation's diagram or a ballpark's published figures, and says where in `docs/sources.md`. A change to one cites its source and has a test that would have caught the old value. Nothing is copied from a drawing or a data set whose terms do not allow it.

**A ballpark is a list of distances.** `scripts/parks.data.json` holds each park's figures, the angle each is read at, and the article and revision they were read from; `pnpm exec node scripts/build-parks.mjs` writes `src/parks.data.ts` from it. A new park adds an entry and its citation in `docs/references.md` and `NOTICE.md`. Distances only: no text, table or picture of an article is used.

**A soccer ground is a list of facts.** `scripts/grounds.data.json` holds each ground's names, place, years, capacity, pitch size and the English and Japanese articles and revisions they were read from; `scripts/grounds.editions.json` holds which grounds each World Cup used. `pnpm grounds` checks them and writes `src/grounds.data.ts`, `docs/grounds.md` and `docs/grounds.ja.md`, and `pnpm grounds:check` asks Wikidata (one request at a time) whether each item, label, coordinate and country agrees. A pitch size is only what the article's infobox gives for football and only if it is a size for international matches; a ground without one stays at the default and says why. A new ground adds its entry, its row in `NOTICE.md` and a line in `docs/references.md`. Never copy text from an article, and never read FIFA's own pages.

**A drawing is a pure function of its options.** No clock, no random number, no counter: the same options give the same string, and a test holds it. An id inside a drawing comes from a hash of the options unless the caller gives one.

**Anything from outside is made safe.** Text is escaped, a colour passes `safeColour`, a logo address passes `safeLogo`. A new option that reaches the markup has a test with a hostile value.

**Words in English and Japanese.** The package's own words are in `src/strings.ts` and the demo's in `demo/words.js`, each key in both; a test holds the two to the same keys.

**Docs pages are single-language.** Every page of the README and of `docs/` is in one language: one page per language, made from one source where that is practical, the Japanese one named `<name>.ja.md`, and the two linked at the top with a line such as `日本語 · English`. No page mixes English and Japanese in a table or in its prose, and a demo switches language with a control. Proper nouns and code identifiers (an id such as `gear:judogi`, a constant) stay as they are on both pages, and a Japanese term that is itself the subject (the package's own name, a knot) may appear once on an English page as a quoted name. The exception is a page about the translations themselves (`docs/strings-ja.md`, a terminology reference), which may show both languages side by side. A test, `docs-language.test`, holds the docs to this and lists each exception with its reason.
