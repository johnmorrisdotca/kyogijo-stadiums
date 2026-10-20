// Packs the package the way it is published (`npm pack`, npm and not pnpm),
// installs the tarball into an empty project, and uses it as somebody who
// installed it would: every entry in `exports` imported by ESM and loaded by
// `require`, and each command in `bin` run. A package whose `exports` name a
// file that is not in the tarball fails here, before it can be published.
// `pnpm test:package` builds first.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const windows = process.platform === "win32";
const scratch = mkdtempSync(join(tmpdir(), "kyogijo-package-"));

/** Run a command and hand back what it printed. On Windows, npm and the installed commands are .cmd files, which only a shell runs; node itself is run directly. */
function run(command, args, cwd, viaShell = false) {
  const shell = viaShell && windows;
  // A path is quoted for the shell; a bare name such as npm is left for the shell to find.
  const ran = spawnSync(shell && /[\\/]/.test(command) ? `"${command}"` : command, args, { cwd, encoding: "utf8", shell });
  if (ran.status !== 0) {
    console.error(`FAIL ${command} ${args.join(" ")}\n${ran.stdout}\n${ran.stderr}`);
    process.exit(1);
  }
  return ran.stdout;
}

// 1. Pack, with npm.
const packed = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], root, true));
const tarball = join(scratch, packed[0].filename);
const inTarball = new Set(packed[0].files.map((file) => file.path));
console.log(`ok   npm pack: ${packed[0].filename}, ${packed[0].files.length} files`);
// The README's pictures are in docs/images, for GitHub and npm to show by address, and are never in what is installed.
const shipped = [...inTarball].filter((file) => file.startsWith("docs/") || /\.(webp|png|jpe?g|gif)$/.test(file));
if (shipped.length > 0) {
  console.error(`FAIL the tarball holds pictures or docs: ${shipped.join(", ")}`);
  process.exit(1);
}
console.log("ok   no picture and nothing from docs/ is in the tarball");

// 2. Everything package.json points at is in the tarball.
const pointed = [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.bin ?? {}), ...Object.values(pkg.exports).flatMap((entry) => (typeof entry === "string" ? [entry] : Object.values(entry)))];
// A pattern (`./dist/data/countries/*.js`) points at every file it matches: at least one, and none that is only a declaration.
for (const file of new Set(pointed)) {
  const wanted = file.replace(/^\.\//, "");
  const found = wanted.includes("*") ? [...inTarball].some((name) => new RegExp(`^${wanted.replace(/[.]/g, "\\.").replace("*", "[a-z0-9-]+")}$`).test(name)) : inTarball.has(wanted);
  if (!found) {
    console.error(`FAIL package.json points at ${file}, which is not in the tarball`);
    process.exit(1);
  }
}
console.log(`ok   every file package.json points at is in the tarball (${new Set(pointed).size})`);

for (const named of pkg.files) {
  if (![...inTarball].some((file) => file === named || file.startsWith(`${named}/`))) {
    console.error(`FAIL package.json's files names ${named}, which is not in the tarball`);
    process.exit(1);
  }
}
console.log(`ok   everything in package.json's files is in the tarball (${pkg.files.length})`);

// 3. Install it into an empty project.
const project = join(scratch, "project");
mkdirSync(project);
writeFileSync(join(project, "package.json"), JSON.stringify({ name: "scratch", private: true, version: "0.0.0" }));
run("npm", ["install", "--no-audit", "--no-fund", "--silent", tarball], project, true);
console.log("ok   npm install of the tarball");

// What the built package in this checkout makes: the installed one must make the same.
const local = await import(new URL("../dist/index.js", import.meta.url).href);
const localScene = await import(new URL("../dist/scene-entry.js", import.meta.url).href);
const game = { sport: "nhl", away: { name: "USA", abbr: "USA", score: 3, color: "#1c3f7a" }, home: { name: "Canada", abbr: "CAN", score: 2, color: "#d52b1e" }, status: "final-ot", id: "pack" };
const expected = local.drawKyogijo(game);
const expectedPortrait = local.drawKyogijo({ ...game, sport: "mlb", park: "fenway-park", orientation: "portrait" });

// 4. Every entry in `exports`, by ESM and by require.
const entries = Object.keys(pkg.exports).map((key) => (key === "." ? pkg.name : `${pkg.name}/${key.slice(2)}`));
writeFileSync(
  join(project, "esm.mjs"),
  `${entries.map((entry, i) => `import * as m${i} from ${JSON.stringify(entry)};`).join("\n")}
const all = [${entries.map((_, i) => `m${i}`).join(", ")}];
const names = ${JSON.stringify(entries)};
all.forEach((m, i) => { if (Object.keys(m).length === 0) throw new Error(names[i] + " exports nothing"); });
const { drawKyogijo, VERSION, SPORTS, PARKS } = m0;
const game = ${JSON.stringify(game)};
if (drawKyogijo(game) !== ${JSON.stringify(expected)}) throw new Error("the installed package drew another drawing");
if (drawKyogijo({ ...game, sport: "mlb", park: "fenway-park", orientation: "portrait" }) !== ${JSON.stringify(expectedPortrait)}) throw new Error("the installed package drew another ballpark");
if (VERSION !== ${JSON.stringify(pkg.version)}) throw new Error("VERSION is " + VERSION);
if (SPORTS.length !== 40 || Object.keys(PARKS).length !== 94) throw new Error("the sports or the parks are wrong");
const grounds = all[names.indexOf(${JSON.stringify(`${pkg.name}/grounds`)})];
if (Object.keys(grounds.GROUNDS).length !== 64 || grounds.groundById("maracana").pitchSize !== "published") throw new Error("the grounds are wrong");
const arenas = all[names.indexOf(${JSON.stringify(`${pkg.name}/arenas`)})];
if (Object.keys(arenas.ARENAS).length !== 167 || arenas.arenaRinkIn(arenas.arenaById("boston-garden")).length !== 190.9) throw new Error("the arenas are wrong");
const atlas = all[names.indexOf(${JSON.stringify(`${pkg.name}/atlas`)})];
if (atlas.PLACES.length !== 330 || atlas.placesBy({ sport: "baseball", country: "JP" }).length !== 20 || atlas.placeById("fenway-park").lat !== 42.34639) throw new Error("the atlas is wrong");
const entry = (name) => all[names.indexOf(${JSON.stringify(pkg.name + "/")} + name)];
const athletics = entry("athletics");
if (typeof athletics.laneDraw !== "function" || athletics.WA_STANDARD_TRACK.straight !== 84.39 || athletics.RACE_IDS.length !== 20) throw new Error("the athletics entry is wrong");
const skating = entry("skating");
if (typeof skating.skatingPairs !== "function" || skating.ISU_SHORT_TRACK.straight !== 28.85 || skating.RACE_IDS.length !== 12 || Math.abs(skating.longOval().straight - 113.57) > 0.01) throw new Error("the skating entry is wrong");
const budo = entry("budo");
if (typeof budo.dojo !== "function" || budo.dojo({ jo: 20 }).jo !== 20 || budo.KIMARITE_COUNT !== 82 || budo.JSA_DOHYO.circle !== 4.55 || budo.fourCorners(budo.dojo({ jo: 20 }).mats) !== 0) throw new Error("the budo entry is wrong");
const { NHL, fenceAt } = m1;
if (NHL.length !== 200 || fenceAt([[-45, 300], [45, 300]], 0) !== 300) throw new Error("the geometry is wrong");
const { kyogijoProps } = m4;
if (!kyogijoProps(game).dangerouslySetInnerHTML.__html.startsWith("<svg")) throw new Error("the React helper draws nothing");
if (typeof m5.KyogijoField !== "function" || typeof m5.defineKyogijoField !== "function") throw new Error("the element's entry is wrong");
const { sceneOf, sceneToSvg, parseSvg, writeSvg } = entry("scene");
const scene = sceneOf(game);
if (scene.items.length !== ${localScene.sceneOf(game).items.length} || scene.theme !== "light") throw new Error("the scene is wrong");
if (writeSvg(parseSvg(drawKyogijo(game))) !== drawKyogijo(game)) throw new Error("the SVG tree does not give the drawing back");
if (sceneToSvg(game).includes("var(")) throw new Error("the flat SVG has a variable in it");
const calls = [];
const ctx = new Proxy({}, { get: (_, name) => (...args) => void calls.push(name), set: () => true });
const drawn = entry("canvas").drawToCanvas(ctx, game, { width: 400 });
if (drawn.width !== 400 || !calls.includes("fillText") || !calls.includes("fill")) throw new Error("the canvas draws nothing");
const sel = { append: (tag) => (calls.push("append " + tag), sel), attr: () => sel, text: () => sel };
const domain = entry("d3").surfaceDomain(game);
entry("d3").appendSurface(sel, game, (v) => v * 2, (v) => v * 2);
if (domain.x.length !== 2 || !calls.includes("append g")) throw new Error("the d3 entry is wrong");
if (typeof entry("plot").surfaceMark(game) !== "function" || entry("plot").surfaceScales(game).aspectRatio !== 1) throw new Error("the Plot entry is wrong");
const collection = entry("geojson").sceneToGeoJSON(game);
if (collection.type !== "FeatureCollection" || collection.features.length !== scene.items.length) throw new Error("the GeoJSON is wrong");
// The PNG needs the optional peer, which is not installed here: the error must say so, and importing the entry must not have needed it.
const png = await entry("png").toPNG(game).then(() => "drawn", (error) => String(error.message));
if (png !== "drawn" && !png.includes("@resvg/resvg-js")) throw new Error("toPNG says: " + png);
console.log(names.join(" "));
`,
);
writeFileSync(
  join(project, "cjs.cjs"),
  `const names = ${JSON.stringify(entries)};
for (const name of names) { const m = require(name); if (Object.keys(m).length === 0) throw new Error(name + " exports nothing"); }
const { drawKyogijo } = require(${JSON.stringify(pkg.name)});
if (drawKyogijo(${JSON.stringify(game)}) !== ${JSON.stringify(expected)}) throw new Error("require draws another drawing");
console.log(names.join(" "));
`,
);
console.log(`ok   import:  ${run(process.execPath, ["esm.mjs"], project).trim()}`);
console.log(`ok   require: ${run(process.execPath, ["cjs.cjs"], project).trim()}`);

// 5. The size of what is installed.
const unpacked = packed[0].unpackedSize;
console.log(`ok   ${packed[0].files.length} files, ${(packed[0].size / 1024).toFixed(0)} kB packed, ${(unpacked / 1024).toFixed(0)} kB unpacked`);

rmSync(scratch, { recursive: true, force: true });
console.log("the package installs and runs as published, on", process.platform, process.version);
