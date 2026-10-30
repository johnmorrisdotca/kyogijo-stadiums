// The stylesheet and the script of the documentation pages (site/docs/docs.css and docs.js): real files under scripts/docs-site/, read here for scripts/docs-pages.mjs to
// write. The pages use the family's own variables (family.css), so light and dark follow the device and the cloth, and nothing here names a colour of its own. The script
// is plain JavaScript with no dependency: the search box over the pages' titles and headings, the contents on a phone, the copy buttons, pictures drawn when they come near,
// and the words of the page in either language.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = join(dirname(fileURLToPath(import.meta.url)), "docs-site");

export const DOCS_CSS = readFileSync(join(here, "docs.css"), "utf8");
export const DOCS_JS = readFileSync(join(here, "docs.js"), "utf8");
