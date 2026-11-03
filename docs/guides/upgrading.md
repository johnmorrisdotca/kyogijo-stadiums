# Upgrading

[日本語](ja/upgrading.md) · English

The package is at 0.x, so a minor version may change how something is drawn. Every release is dated in the [changelog](../../CHANGELOG.md), and a change that can break your code or your stored drawings is marked **Breaking** there. This guide says what to do for each of the ones that have happened, and how to make the next upgrade cheap.

## Before you upgrade

1. Read the changelog from your version to the new one for the word **Breaking**.
2. Check the version you have: `VERSION` is exported by the main entry, and each drawing carries it as `data-version`.
3. Run your tests with the new version in a branch. A snapshot of a whole drawing changes with the version (see [troubleshooting](troubleshooting.md#a-snapshot-test-fails-after-an-upgrade)), so compare the parts, not the bytes.

```ts
import { VERSION, drawKyogijo } from "@johnmorrisdotca/kyogijo-stadiums";

console.log(/^\d+\.\d+\.\d+$/.test(VERSION), drawKyogijo({ sport: "nhl" }).includes(`data-version="${VERSION}"`));
// true true
```

## Stored drawings

The same options give the same text within one version, so a stored SVG is a cache of the options. Store the options with it, and redraw when `data-version` is not the current version, rather than keeping old text for ever. Drawings of the NHL and MLB changed in 0.2.0 (the trapezoid, the hash marks and the bases follow the current rule books), and every English and Japanese drawing changed in 0.3.0 (names and words).

## From `@johnmorrisdotca/kyogijo` to `kyogijo-stadiums` (0.4.0)

The package was renamed. The code and every name in it are the same: `drawKyogijo`, `mountKyogijo`, `<kyogijo-field>` and the `kyogijo` class. What changes is where you install and import from.

```sh
npm uninstall @johnmorrisdotca/kyogijo
npm install @johnmorrisdotca/kyogijo-stadiums
```

Then change every import path, including the entries (`/charts`, `/replay`, `/layouts`) and any CDN address: `.../kyogijo@0/...` becomes `.../kyogijo-stadiums@0/...`. The old package's last version is 0.3.0.

## Home team first (0.4.0)

Soccer, rugby (union and league), Australian football, Gaelic games, field hockey, handball and cricket now put the home team first, on the left, by default. If you want the old layout, pass `homeSide: "right"`. The NFL, CFL, IFAF, NHL, NBA and MLB are unchanged.

## Road to the final moved (0.4.0)

`roadToFinal` and the road chart live in `@johnmorrisdotca/taisen-brackets` now (its `/road` entry), where they share the bracket's look. There is no shim: `roadToFinal`, `ROAD_SIZES`, `KYOGIJO_ROAD_STYLE` and the road types are gone from `charts`.

## Names of parks and grounds (0.3.0)

`name` is the everyday name and `nameJa` the everyday Japanese name, no longer the title of the article that was cited; the old names are `aliases`. `Ground.nameLocal` is now `localName`. If you kept a park's name to compare, use `parkByName`, which finds a park by any name it has been called.

```ts
import { parkByName } from "@johnmorrisdotca/kyogijo-stadiums/parks";

console.log(parkByName("Hanshin Koshien Stadium")?.id, parkByName("甲子園球場")?.id);
// hanshin-koshien-stadium hanshin-koshien-stadium
```

## Park status (0.2.0)

`Park["status"]` is `"current" | "secondary" | "past"`; the value `"historic"` is now `"past"`. `Sport` grew from 6 to 20 sports in the same release (now 43), so a TypeScript `switch` over `Sport` with no default needs the new cases.

## Rule corrections (0.2.0)

The NHL trapezoid is 22 feet wide at the goal line (18 before 2014-15, which `rulesFor("nhl", year)` still gives), the NHL's hash marks are 5 feet 7 inches apart, and MLB bases are 18 inches square from 2023. A drawing with `year` set draws the rule of that season.

## Keeping the next upgrade cheap

- Import from the narrowest entry you need (`.../parks`, not the main one), so a change in another entry does not touch you.
- Keep the options, not the SVG, as your source of truth.
- Pin the version in a lockfile and upgrade on purpose, with the changelog open.
