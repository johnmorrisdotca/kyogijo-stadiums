// The Kodokan (講道館) as a venue of a district: its building, from Project PLATEAU, and its main dojo (大道場), the room on the 7th floor with its gallery on the 8th, drawn in the air on its real floor over the building's own outline.
// The facts that are documented are the count (420 jō of mats, four contest areas at once), the floor (the 7th), the gallery (the 8th, about 900) and the building (8 floors and a basement; PLATEAU: 8 storeys above ground, 43.1 metres): the Kodokan's own page, English
// Wikipedia and the IJF say the first four (`docs/district.md`, "The Kodokan"). Ours: the shape of the floor (no source gives it: a square of 26.4 metres, the area of 420 jō, on which four areas of 8 metres fit, as `halls.ts` draws it), the room's place in the
// building (the square that stands farthest from its walls, `scripts/build-plateau.mjs`), the wood round the mats (none, so that the room fits the real outline) and the height of the 7th floor (six storeys of the building's own). Pure data and a few sums.
import { FEET_PER_METRE } from "./geometry.ts";
import { KODOKAN_MAIN } from "./halls.ts";
import { KODOKAN_BUILDING as BUILDING } from "./kodokan.data.ts";
import { PLATEAU_ATTRIBUTION } from "./plateau.credit.ts";
import type { DistrictMember, DistrictPart } from "./district.ts";
import type { DojoSpec, Language, SurfaceOptions } from "./types.ts";

/** The main dojo as the district draws it: the atlas's floor and fittings, with no wood round the mats (the 4 metres the atlas draws would not stand inside the real building). */
export const KODOKAN_DOJO: DojoSpec = { ...KODOKAN_MAIN, surround: 0 };

/** How high the room stands, floor to the top of its lid, in metres: the 3D build's own figure (walls of 4.5 metres, the gallery level with their tops, the lid over it), two storeys of the building. Ours. */
export const KODOKAN_ROOM_HEIGHT = 11.2;

/** The height of the main dojo's floor above the ground, in metres: the 7th floor, six storeys up at the building's own storey height (its height over its storeys, 5.4 metres), and no higher than leaves the room under the roof. */
export const KODOKAN_FLOOR_HEIGHT: number = Math.min((6 * BUILDING.height) / BUILDING.storeys, BUILDING.height - KODOKAN_ROOM_HEIGHT);

/** Where the Kodokan's building stands and what it is: for tests and pages that say it. */
export const KODOKAN = { ...BUILDING, floorHeight: KODOKAN_FLOOR_HEIGHT, roomHeight: KODOKAN_ROOM_HEIGHT, mats: 420, seats: 900 } as const;

/** A room of a floor of the Kodokan: what the Kodokan's floor guide calls it, its count of jō where the guide gives one, and whether the room is drawn from that count or is ours. */
export interface KodokanRoom {
  id: string;
  name: { en: string; ja: string };
  /** Mats, in jō: the guide's count; `null` where it gives none (the special dojo: drawn at 40 jō, ours). */
  mats: number | null;
  /** The count the room is drawn at: the guide's, or ours where it gives none. */
  drawn: number;
}

/** A floor of the Kodokan International Judo Center, the new building: its label, what the Kodokan's own floor guide lists on it, what is drawn there, and where the words come from. */
export interface KodokanFloor {
  /** 0 is the basement, 1 to 8 the floors above the ground. */
  floor: number;
  label: { en: string; ja: string };
  /** What the floor guide lists on it, in each language (a floor with no entry of its own says what a second source says, `else`). */
  lists: { en: string; ja: string };
  rooms: KodokanRoom[];
  /** What the view draws: the `rooms` the guide counts, the `great-dojo`, its `gallery`, only the floor's `plate` (nothing is published of its rooms), or `none` (under the ground). */
  drawn: "rooms" | "great-dojo" | "gallery" | "plate" | "none";
  /** Where the floor's words come from: the Kodokan's floor guide, and English Wikipedia where the guide says nothing. */
  source: "kodokan" | "wikipedia";
}

/** The floors, from the basement up. The Kodokan's floor guide (施設のご案内, `docs/district.md`) lists 8F to B1; its 1F entry is empty, so the 1st floor is English Wikipedia's. */
export const KODOKAN_FLOORS: readonly KodokanFloor[] = [
  { floor: 0, label: { en: "B1", ja: "地下1階" }, lists: { en: "dining hall, training room, disaster-prevention centre", ja: "食堂、トレーニングルーム、防災センター" }, rooms: [], drawn: "none", source: "kodokan" },
  { floor: 1, label: { en: "1F", ja: "1階" }, lists: { en: "parking, a bank and a store (the floor guide lists nothing here)", ja: "駐車場、銀行、売店（いずれも公式の案内には記載なし）" }, rooms: [], drawn: "plate", source: "wikipedia" },
  { floor: 2, label: { en: "2F", ja: "2階" }, lists: { en: "museum and library, classroom, meeting rooms 3 and 4", ja: "資料館・図書館、教室、第3会議室、第4会議室" }, rooms: [], drawn: "plate", source: "kodokan" },
  { floor: 3, label: { en: "3F", ja: "3階" }, lists: { en: "accommodation", ja: "宿泊施設" }, rooms: [], drawn: "plate", source: "kodokan" },
  { floor: 4, label: { en: "4F", ja: "4階" }, lists: { en: "dojo guidance office, dojo reception, changing rooms", ja: "道場指導部、道場受付、更衣室（ロッカールーム）" }, rooms: [], drawn: "plate", source: "kodokan" },
  {
    floor: 5,
    label: { en: "5F", ja: "5階" },
    lists: { en: "women's dojo (240 jō), boys' dojo (114 jō), special dojo (no count given)", ja: "女子部道場（240畳）、少年部道場（114畳）、特別道場（畳数の記載なし）" },
    rooms: [
      { id: "womens", name: { en: "Women's dojo", ja: "女子部道場" }, mats: 240, drawn: 240 },
      { id: "boys", name: { en: "Boys' dojo", ja: "少年部道場" }, mats: 114, drawn: 114 },
      { id: "special", name: { en: "Special dojo", ja: "特別道場" }, mats: null, drawn: 40 },
    ],
    drawn: "rooms",
    source: "kodokan",
  },
  {
    floor: 6,
    label: { en: "6F", ja: "6階" },
    lists: { en: "school dojo (240 jō), international dojo (192 jō)", ja: "学校道場（240畳）、国際部道場（192畳）" },
    rooms: [
      { id: "school", name: { en: "School dojo", ja: "学校道場" }, mats: 240, drawn: 240 },
      { id: "international", name: { en: "International dojo", ja: "国際部道場" }, mats: 192, drawn: 192 },
    ],
    drawn: "rooms",
    source: "kodokan",
  },
  { floor: 7, label: { en: "7F", ja: "7階" }, lists: { en: "main dojo (420 jō)", ja: "大道場（420畳）" }, rooms: [{ id: "main", name: { en: "Main dojo", ja: "大道場" }, mats: 420, drawn: 420 }], drawn: "great-dojo", source: "kodokan" },
  { floor: 8, label: { en: "8F", ja: "8階" }, lists: { en: "spectators' gallery (about 900 seats)", ja: "見学席（約900席）" }, rooms: [], drawn: "gallery", source: "kodokan" },
];

/** The floors a district can be asked for: 0 (the basement) to 8. */
export const KODOKAN_FLOOR_IDS: readonly number[] = KODOKAN_FLOORS.map((f) => f.floor);

/** The height of a floor's level above the ground, in metres: the building's height over its storeys, for each floor under it (ours: the storeys are not all one height). */
export const kodokanLevel = (floor: number): number => ((floor - 1) * BUILDING.height) / BUILDING.storeys;

/** How thick a floor of the building is drawn, in metres: its slab and its beams. Ours: a reinforced-concrete floor with its beams is some 0.4 to 0.8 metres of structure; the figure is a plausible one, and a floor is drawn no thinner than 10 pixels at the page's own size (`kodokanSlab`). */
export const KODOKAN_SLAB = 0.6;

/** The level of a floor's slab, in metres: the building's own storeys, except that the 7th is the great dojo's floor and the 8th the gallery's level over it. */
export const kodokanSlabLevel = (floor: number): number => (floor === 7 ? KODOKAN_FLOOR_HEIGHT : floor === 8 ? KODOKAN_FLOOR_HEIGHT + KODOKAN_GALLERY_LEVEL / FEET_PER_METRE : kodokanLevel(floor));

/** The height of the gallery's level over the main dojo's floor, in feet: the room's walls, 4.5 metres. A plane that begins above it is the 8th floor's. */
export const KODOKAN_GALLERY_LEVEL = 4.4 * FEET_PER_METRE;

const roomOptions = (jo: number, language: Language): SurfaceOptions => ({ sport: "dojo", dojo: { mats: jo, surround: 0, kamiza: "north" }, crowd: false, language } as SurfaceOptions);

/**
 * The Kodokan as a member of a district. With a `floor`, it is that floor of the building: the 7th is the great dojo, the 8th its gallery, the 5th and 6th their dojos as the floor guide counts them (laid out by us), the others plain floor plates;
 * the basement is under the ground and draws nothing. Throws for a floor that is not 0 to 8.
 */
export function kodokanMember(language: Language, floor?: number): DistrictMember {
  const base: DistrictMember = {
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
    slabs: KODOKAN_FLOORS.filter((f) => f.floor >= 1).map((f) => ({ floor: f.floor, level: kodokanSlabLevel(f.floor) * FEET_PER_METRE })),
    slabThickness: KODOKAN_SLAB,
  };
  if (floor === undefined) return base;
  if (!Number.isInteger(floor) || !KODOKAN_FLOOR_IDS.includes(floor)) throw new Error(`the Kodokan has floors ${KODOKAN_FLOOR_IDS.join(", ")} (0 is the basement), not ${String(floor)}`);
  const main = (show: "room" | "gallery"): DistrictPart => ({ key: "main", options: base.options, centre: base.centre, heading: base.heading, elevation: base.elevation, show });
  const rooms = (BUILDING.floors as Record<string, { heading: number; rooms: readonly { id: string; jo: number; centre: readonly [number, number] }[] }>)[String(floor)];
  const parts: DistrictPart[] =
    floor === 7 ? [main("room")] : floor === 8 ? [main("gallery")] : rooms === undefined ? [] : rooms.rooms.map((r) => ({ key: r.id, options: roomOptions(r.jo, language), centre: r.centre, heading: rooms.heading, elevation: kodokanLevel(floor) * FEET_PER_METRE }));
  // The great dojo's own floor is the 7th's (a little under its storey height, so that the room stays under the roof), and the gallery's level is the room's wall height over it.
  return { ...base, parts, ...(floor >= 1 ? { plate: { floor, level: kodokanSlabLevel(floor) * FEET_PER_METRE } } : {}) };
}
