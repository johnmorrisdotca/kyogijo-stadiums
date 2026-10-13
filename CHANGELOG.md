# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Six surfaces drawn to scale as SVG**: the NFL, CFL and IFAF football fields, the NHL rink, the NBA court and the baseball field, each from its rulebook or federation diagram, with every figure cited in docs/sources.md.
- **Score mode.** `drawKyogijo`, `drawScore` and `drawBadge` put each team's name and logo on its side (the end zones, the ends of the ice, the halves of the court, the dugouts) and the score in the middle, with the competition, the status, the date and an emphasis on the winner. Sizes `full`, `compact` and `badge`.
- **Wide, tall or fit the box.** `orientation: "landscape" | "portrait" | "auto"`: portrait turns the surface a quarter with every word upright and the teams top and bottom; `auto` follows `aspect`, and `mountKyogijo` watches the container and draws again when its shape changes.
- **Every ballpark.** `PARKS` has the 30 current MLB parks, 44 past ones, the 12 NPB home parks and eight other NPB grounds, each fence drawn from the distances published for it, with the article and revision each was read from and its Wikidata item (`wikidata`, `parkByWikidata`). A past park has the seasons it was used (`from`, `to`) and, where an article dates earlier fences, `periods`, chosen by the `year` option (`parkPointsIn`). `park`, `year` and `fence` options; names in English and Japanese.
- **Theming.** Every colour is a custom property in a light and a dark set, `colors` sets them from code, and a court has its own look (`court`) with five to start from in `COURT_THEMES`.
- **Four ways in.** The function, `mountKyogijo` for a container, the `<kyogijo-field>` custom element with parts, and a frame (`embed.html`) for a page that runs no script; `@johnmorrisdotca/kyogijo/react` for React, which does not import it.
- **Accessible.** Each drawing is an `img` with a title and a description in English or Japanese.
- **Units.** `SURFACE_UNITS` names the unit each rulebook states its figures in; `convertLength`, `lengthsIn`, `dimensionsOf`, `surfaceSize` and `fenceIn` give every dimension in feet, inches, yards, metres, centimetres or millimetres; the `units` option says what the lengths of a drawing's options (`margin`, `fence`) are in.
- **Coordinate frames** (`@johnmorrisdotca/kyogijo/frames`). `toSurface`, `fromSurface` and `convert` put a provider's points on a surface and move them between providers, with `units`, `anchors`, `limits` and `attacking`; the frames of the NHL API, HockeyTech, NBA stats, NFL tracking data, MLBAM and Retrosheet's hit locations; `registerFrame` and `piecewise` for the frames of other sports.
- **The demo** with every sport and every park, wide and tall, light and dark, badges, compact cards, court looks, a live score, snippets for the four ways in, and the API reference.
