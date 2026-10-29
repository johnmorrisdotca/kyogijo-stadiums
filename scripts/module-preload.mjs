// Tells the browser, in the head of each page of the site, every module the page's script will import, so that it fetches them all at once. A page's module imports one file that imports others, and the browser only learns of
// a file when it has read the one above it: a district page is seven files deep and 246 files wide, and on a connection with a delay of its own that is seven delays before the page can draw. With the whole list in the head
// the files come together. Nothing is bundled and nothing changes in the files; a page with no module script is left alone.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/** The relative files a script imports or re-exports, by their text (`import ... from "./x.js"`, `export ... from "./x.js"`, `import "./x.js"`); not the ones it asks for later with `import()`. */
export function importsOf(code) {
  const found = [];
  const pattern = /(?:^|[\n;])\s*(?:import|export)\s*(?:[\w*${},\s]*?\bfrom\s*)?(["'])(\.{1,2}\/[^"'\n]+)\1/g;
  for (let match = pattern.exec(code); match !== null; match = pattern.exec(code)) found.push(match[2]);
  return found;
}

/** The files a page's module scripts import, and the ones those import, as paths from the page's own folder, each once, in the order they are first met. */
export function closureOf(html, page, root) {
  const pageDir = dirname(page);
  const queue = [];
  const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  for (let match = scripts.exec(html); match !== null; match = scripts.exec(html)) {
    if (!/\btype\s*=\s*["']module["']/.test(match[1])) continue;
    const src = /\bsrc\s*=\s*["']([^"']+)["']/.exec(match[1])?.[1];
    if (src !== undefined) {
      if (/^\.{0,2}\//.test(src) || !/^[a-z]+:/.test(src)) queue.push(resolve(pageDir, src));
    } else for (const spec of importsOf(match[2])) queue.push(resolve(pageDir, spec));
  }
  const seen = [];
  const known = new Set();
  while (queue.length > 0) {
    const file = queue.shift();
    if (known.has(file) || !file.startsWith(root) || !existsSync(file) || !/\.m?js$/.test(file)) continue;
    known.add(file);
    seen.push(file);
    for (const spec of importsOf(readFileSync(file, "utf8"))) queue.push(resolve(dirname(file), spec));
  }
  return seen.map((file) => relative(pageDir, file).split("\\").join("/")).map((path) => (path.startsWith(".") ? path : `./${path}`));
}

/** Put the list in the head of every page of a built site that has a module script. Returns how many files each page now preloads. */
export function addModulePreloads(siteDir) {
  const root = resolve(siteDir);
  const done = {};
  for (const name of readdirSync(root).filter((file) => file.endsWith(".html"))) {
    const page = join(root, name);
    const html = readFileSync(page, "utf8");
    if (html.includes('rel="modulepreload"')) continue;
    const files = closureOf(html, page, root);
    const head = html.indexOf("</head>");
    if (files.length === 0 || head < 0) continue;
    writeFileSync(page, `${html.slice(0, head)}${files.map((file) => `    <link rel="modulepreload" href="${file}" />\n`).join("")}  ${html.slice(head)}`);
    done[name] = files.length;
  }
  return done;
}
