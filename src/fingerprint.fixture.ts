// What the fingerprint tests hash. A drawn SVG carries `data-version` (the package's version), and a drawing with no `id` of its own is given one made
// from its options and the version (`ky-`, a short kind such as `mu-` or `ju-` for the other drawings, and seven characters, src/common.ts), so a hash of the raw text changed with every release and six test files had to be
// regenerated at each bump (KYOGIJO-STADIUMS-2). A fingerprint is the hash of the drawing without those two things: a drawing that changes still changes it,
// and a release that changes only the version does not. (The ids stay in the package as they are: they keep drawings of two versions on one page apart.)
import { hash } from "./format.ts";

/** The drawn text without its `data-version` attributes, and with each default id (`ky-`, perhaps a short kind, and seven base 36 characters, named by an `aria-labelledby`) written `ky-ID`. */
export function withoutVersion(text: string): string {
  let out = text.replace(/ data-version="[^"]*"/g, "");
  for (const id of new Set([...out.matchAll(/aria-labelledby="(ky-(?:[a-z]{1,4}-)?[0-9a-z]{7})-t/g)].map((m) => m[1]))) out = out.split(id).join("ky-ID");
  return out;
}

/** The hash of the text, without its version. */
export const fingerprint = (text: string): string => hash(withoutVersion(text));
