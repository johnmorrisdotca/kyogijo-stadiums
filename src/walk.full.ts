// Every district's walkable data, held for the drawing: `full.ts` imports this, so that every entry but the lean district has the data of every mask, as it always had. The lean district holds one district's only after `loadOutside`
// has read its file (`walk.ts`). A bundler keeps this file for its effect: package.json lists it in `sideEffects`.
import { WALK_DATA } from "./walk.data.ts";
import { registerWalk } from "./walk.ts";

registerWalk(WALK_DATA);
