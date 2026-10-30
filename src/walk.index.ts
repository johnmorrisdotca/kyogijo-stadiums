// Made by scripts/build-walk.mjs from the files of data-sources/walk/ (read 2026-10-22): do not edit by hand.
// Every district there is a walkable mask for, with the venues it was made for and the one file that holds its data (`walk/<district>.data.ts`), read with a dynamic import() when a crowd outside is to be shown (see `loadOutside` in walk.ts).
import type { WalkData } from "./walk.ts";

export const WALK_INDEX: Readonly<Record<string, { readonly venues: readonly string[]; readonly load: () => Promise<{ readonly WALK: WalkData }> }>> = {
  "vancouver": { venues: ["bc-place:cfl","rogers-arena"], load: () => import("./walk/vancouver.data.ts") },
};
