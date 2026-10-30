// What the three generators of venue data (arenas, parks, grounds) share: besides the one file that holds every record (`src/<kind>.data.ts`), each record is a file of its own
// (`src/<kind>/<id>.data.ts`) and one index (`src/<kind>.index.ts`) lists every key with its names and the import() that reads its file. A page that draws one venue reads that
// venue's file and the index, not the table of every venue. The files are made, never edited by hand; the folder is emptied first so that a record that was removed leaves no file.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { URL } from "node:url";

/**
 * Write the record files and the index of one kind of venue.
 * `kind` is the folder and the file stem (`arenas`), `type` the type of a record (`ArenaData`), `constant` the record's export (`ARENA`) and `index` the index's (`ARENA_INDEX`);
 * `records` are the records, `text(record)` writes one as a TypeScript object literal, `by` names the generator and its source for the header, and `extra` is more text for the end of the index.
 */
export function writeVenueFiles({ kind, type, constant, index, records, text, by, extra = "" }) {
  const dir = new URL(`../src/${kind}/`, import.meta.url);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const record of records) {
    writeFileSync(new URL(`${record.id}.data.ts`, dir), `// Made by ${by}: do not edit by hand. One record of src/${kind}.data.ts, for a page that draws this venue alone.\nimport type { ${type} } from "../${kind}.core.ts";\n\nexport const ${constant}: ${type} = ${text(record).trim()};\n`);
  }
  const lines = records.map((record) => `  ${JSON.stringify(record.id)}: { name: ${JSON.stringify(record.name)}, nameJa: ${JSON.stringify(record.nameJa)}, load: () => import(${JSON.stringify(`./${kind}/${record.id}.data.ts`)}) },`);
  writeFileSync(
    new URL(`../src/${kind}.index.ts`, import.meta.url),
    `// Made by ${by}: do not edit by hand.
// Every key of src/${kind}.data.ts with the names to list it by and the one file that holds its record (\`${kind}/<key>.data.ts\`), read with a dynamic import() when the record is asked for (see \`venue-data.ts\`).
import type { ${type} } from "./${kind}.core.ts";

export const ${index}: Readonly<Record<string, { readonly name: string; readonly nameJa: string; readonly load: () => Promise<{ readonly ${constant}: ${type} }> }>> = {
${lines.join("\n")}
};
${extra}`,
  );
}
