// The Kodokan (講道館) as a venue of a district: its building, from Project PLATEAU, and its main dojo (大道場), the room on the 7th floor with its gallery on the 8th, drawn in the air on its real floor over the building's own outline.
// The facts that are documented are the count (420 jō of mats, four contest areas at once), the floor (the 7th), the gallery (the 8th, about 900) and the building (8 floors and a basement; PLATEAU: 8 storeys above ground, 43.1 metres): the Kodokan's own page, English
// Wikipedia and the IJF say the first four (`docs/district.md`, "The Kodokan"). Ours: the shape of the floor (no source gives it: a square of 26.4 metres, the area of 420 jō, on which four areas of 8 metres fit, as `halls.ts` draws it), the room's place in the
// building (the square that stands farthest from its walls, `scripts/build-plateau.mjs`), the wood round the mats (none, so that the room fits the real outline) and the height of the 7th floor (six storeys of the building's own). Pure data and a few sums.
import { FEET_PER_METRE } from "./geometry.ts";
import { KODOKAN_MAIN } from "./halls.ts";
import { KODOKAN_BUILDING as BUILDING } from "./kodokan.data.ts";
import { PLATEAU_ATTRIBUTION } from "./plateau.credit.ts";
import type { DistrictMember } from "./district.ts";
import type { DojoSpec, Language, SurfaceOptions } from "./types.ts";

/** The main dojo as the district draws it: the atlas's floor and fittings, with no wood round the mats (the 4 metres the atlas draws would not stand inside the real building). */
export const KODOKAN_DOJO: DojoSpec = { ...KODOKAN_MAIN, surround: 0 };

/** How high the room stands, floor to the top of its lid, in metres: the 3D build's own figure (walls of 4.5 metres, the gallery level with their tops, the lid over it), two storeys of the building. Ours. */
export const KODOKAN_ROOM_HEIGHT = 11.2;

/** The height of the main dojo's floor above the ground, in metres: the 7th floor, six storeys up at the building's own storey height (its height over its storeys, 5.4 metres), and no higher than leaves the room under the roof. */
export const KODOKAN_FLOOR_HEIGHT: number = Math.min((6 * BUILDING.height) / BUILDING.storeys, BUILDING.height - KODOKAN_ROOM_HEIGHT);

/** Where the Kodokan's building stands and what it is: for tests and pages that say it. */
export const KODOKAN = { ...BUILDING, floorHeight: KODOKAN_FLOOR_HEIGHT, roomHeight: KODOKAN_ROOM_HEIGHT, mats: 420, seats: 900 } as const;

/** The Kodokan as a member of a district. */
export function kodokanMember(language: Language): DistrictMember {
  return {
    key: "kodokan",
    id: "kodokan",
    kind: "hall",
    name: { en: "Kodokan", ja: "講道館" },
    ring: BUILDING.ring,
    centre: BUILDING.room.centre,
    heading: BUILDING.room.heading,
    basis: "building",
    seats: KODOKAN.seats,
    options: { sport: "dojo", dojo: KODOKAN_DOJO, crowd: { real: true }, language } as SurfaceOptions,
    elevation: KODOKAN_FLOOR_HEIGHT * FEET_PER_METRE,
    shell: { height: BUILDING.height * FEET_PER_METRE, storeys: BUILDING.storeys },
    attribution: PLATEAU_ATTRIBUTION,
  };
}
