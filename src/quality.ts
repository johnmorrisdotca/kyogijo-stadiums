// How much a 3D view draws, so that it turns well on every device. A view has three tiers of detail, `high` (everything, as it always was), `medium` and `low`, and a mode, `auto`, that chooses the tier by watching the frames
// the view really makes while it turns: nothing here looks at the browser's name or the device's model. A tier says what is left out or made smaller (the buildings round a district stand up fewer, the trees and the crowd are thinner, a
// small or far venue is a block with its height, the layers are rastered at a lower pixel ratio); the governor steps a tier down when the frames run over budget for a while and back up when they have been steady for longer, with a wait
// after a step up that fails that doubles each time, so that the view never flickers between two tiers. Pure: numbers in, numbers out; `turn.dom.ts` feeds it frames and `district.turn.ts` reads the tier's profile.

/** The tiers of detail, from the most to the least. */
export type QualityTier = "high" | "medium" | "low";

/** What a view is asked for: one tier, or `auto`, which chooses by the frames the view makes. */
export type Quality = "auto" | QualityTier;

/** The tiers, highest first: a step down is one place later in this list. */
export const QUALITY_TIERS: readonly QualityTier[] = ["high", "medium", "low"];

/** The values a page can ask for: `auto` and the tiers. */
export const QUALITIES: readonly Quality[] = ["auto", ...QUALITY_TIERS];

/** What a tier draws. */
export interface TierProfile {
  tier: QualityTier;
  /** The most buildings of a district's context that stand up as blocks in the 3D view (the tallest and widest first); the rest are the floor's flat footprints, which every tier draws. */
  blocks: number;
  /** The share of the context's trees that are drawn, 0 to 1. */
  trees: number;
  /** A venue whose longest side is under this share of the plan's longest side is drawn as its footprint standing up to its height, one block, in place of its stands and roof; 0 draws every venue in full. */
  proxy: number;
  /** The small parts of a venue (benches, glass, posts, goals, the fascia and its fittings) are left out, and the crowd in its stands is drawn as blocks of colour. */
  simple: boolean;
  /** The share of the crowd outside that is drawn, 0 to 1 (0 hides it), and the width of its canvas as a share of the usual. */
  outside: { people: number; width: number };
  /** The pixel ratio the layers are rastered at, at most: on a phone or a tablet, and elsewhere. `Infinity` leaves the device's own. */
  ratio: { handheld: number; other: number };
}

/** The profile of each tier. `high` leaves everything as it always was (the cap on a handheld's pixel ratio is the mode `auto`'s and is made in `rasterOf`). */
export const TIER_PROFILES: Record<QualityTier, TierProfile> = {
  high: { tier: "high", blocks: 130, trees: 1, proxy: 0, simple: false, outside: { people: 1, width: 1 }, ratio: { handheld: Infinity, other: Infinity } },
  medium: { tier: "medium", blocks: 24, trees: 0.5, proxy: 0.12, simple: true, outside: { people: 0.5, width: 0.7 }, ratio: { handheld: 1.5, other: 2 } },
  low: { tier: "low", blocks: 0, trees: 0.25, proxy: 0.4, simple: true, outside: { people: 0, width: 0.5 }, ratio: { handheld: 1, other: 1 } },
};

/** Whether a value is one of the qualities. */
export const isQuality = (value: unknown): value is Quality => typeof value === "string" && (QUALITIES as readonly string[]).includes(value);

/** A quality from whatever a page or an address gave: the same if it is one, else `fallback`. */
export const qualityOf = (value: unknown, fallback: Quality = "auto"): Quality => (isQuality(value) ? value : fallback);

/** The tier a view with no frames to go by is drawn at: the tier asked for, and `high` for `auto` (a page made on a server, a first draw). */
export const tierOf = (quality: Quality | undefined): QualityTier => (quality === undefined || quality === "auto" ? "high" : quality);

/** The tier one step lower or higher than `tier`, or the same at the end. */
export const lower = (tier: QualityTier): QualityTier => QUALITY_TIERS[Math.min(QUALITY_TIERS.length - 1, QUALITY_TIERS.indexOf(tier) + 1)];
export const higher = (tier: QualityTier): QualityTier => QUALITY_TIERS[Math.max(0, QUALITY_TIERS.indexOf(tier) - 1)];

/** What decides whether the device is a phone or a tablet: it has a coarse pointer, or its screen is small. It is asked of the page's own window, never of the browser's name. */
export function handheld(win: { matchMedia?: (query: string) => { matches: boolean }; screen?: { width: number; height: number }; innerWidth?: number } | null | undefined): boolean {
  if (win === null || win === undefined) return false;
  if (win.matchMedia?.("(pointer: coarse)").matches === true) return true;
  const sides = [win.screen?.width, win.screen?.height, win.innerWidth].filter((n): n is number => typeof n === "number" && n > 0);
  return sides.length > 0 && Math.min(...sides) <= 820;
}

/**
 * The share of its size a layer is made at, from the device's pixel ratio `dpr`: a layer is made `share` times as wide and as high in CSS pixels and turned back to its size by its matrix, so that it holds `share` squared as many device
 * pixels, as far as the engine keeps a layer's pixels to its own box (the layers of a district at a ratio of 3 are hundreds of megabytes, which a phone's browser does not always keep). An engine that draws a layer again at the scale its matrix has
 * (Chromium does) makes the same pixels from it, so there it changes nothing, and the sizes this package reports are the boxes times the ratio squared, not what an engine allocates. 1 when the ratio is within the cap. The mode `auto` caps a handheld
 * at 2 even at `high`; a tier asked for by name is exactly that tier's, and `high` asked for by name is the device's own ratio, as it always was.
 */
export function rasterOf(quality: Quality, tier: QualityTier, dpr: number, isHandheld: boolean): number {
  const cap = quality === "auto" && tier === "high" ? (isHandheld ? 2 : Infinity) : TIER_PROFILES[tier].ratio[isHandheld ? "handheld" : "other"];
  if (!(dpr > 0) || dpr <= cap) return 1;
  return Math.max(0.25, Math.round((cap / dpr) * 1000) / 1000);
}

/**
 * The most device pixels one layer may hold in a tier: a flat floor of a building is a layer as big as the building's box (the Kodokan's fourteen plates are 47 megabytes each at a ratio of 3), so a layer past the budget is made smaller
 * still (see `rasterOf`). `Infinity` at `high`, by name or in `auto`.
 */
export function layerBudget(tier: QualityTier, isHandheld: boolean): number {
  if (tier === "high") return Infinity;
  return { medium: isHandheld ? 2e6 : 4e6, low: isHandheld ? 1e6 : 2e6 }[tier];
}

/**
 * The share of its size each layer is made at, from the sizes the layers would have at full size (their boxes in CSS pixels), the share every layer is made at (`rasterOf`), the device's pixel ratio and the layer budget: a layer is
 * made at the smaller of the share and the one that holds `budget` device pixels, never under a fifth. The floor comes first, then the planes, as `layoutOf` takes them.
 */
export function rasterShares(sizes: readonly (readonly [number, number])[], share: number, dpr: number, budget: number): number[] {
  const ratio = dpr > 0 ? dpr : 1;
  return sizes.map(([w, h]) => {
    const area = w * h * ratio * ratio;
    const own = area > budget ? Math.sqrt(budget / area) : 1;
    return Math.max(0.2, Math.round(Math.min(share, own) * 1000) / 1000);
  });
}

/** How the governor judges the frames. Times are in milliseconds. */
export interface GovernorTuning {
  /** The frames in a window it keeps (the oldest are dropped past twice this), and the fewest it judges: a window is also at least `settleMs` long, so a view at 60 frames a second judges 42 frames and one at 6 frames a second judges 8. */
  frames: number;
  minFrames: number;
  settleMs: number;
  /** The first frames after the view is mounted are slow whatever it holds (scripts are still compiling, the page is still being laid out): they are not judged. */
  warmMs: number;
  /** The mean interval between frames above which the view is over budget (21 is below 48 frames a second: a view that misses a refresh in three does not hold 60; it widens on a display that refreshes slower than 60 Hz), and the mean at or under which it is steady (18.5 holds 60 frames a second). */
  budgetMs: number;
  steadyMs: number;
  /** How long the view must stay steady before it tries the tier above, and the most that wait grows to after steps that were taken back. */
  upAfterMs: number;
  maxUpAfterMs: number;
  /** Frames are ignored for this long after a step, while the view is drawn again. */
  quietMs: number;
  /** A gap longer than this between two frames is a pause (a hidden page, a stopped turn), not a slow frame. */
  pauseMs: number;
}

export const GOVERNOR_TUNING: GovernorTuning = { frames: 24, minFrames: 8, settleMs: 700, warmMs: 600, budgetMs: 21, steadyMs: 18.5, upAfterMs: 5000, maxUpAfterMs: 300000, quietMs: 600, pauseMs: 250 };

/** What the governor does with a frame. */
export interface Governor {
  /** The tier now. */
  readonly tier: QualityTier;
  /** Give it the time since the last frame and the time now; it gives the new tier when it steps, else `undefined`. */
  frame(interval: number, now: number): QualityTier | undefined;
  /** The interval of the display, in milliseconds, as the page measured it with nothing else going on (16.7 for 60 Hz, 33.3 for a phone in a power-saving mode): a display that refreshes slower than 60 Hz is not taken for a view that is too slow. 16.7 until told. */
  display(interval: number): void;
  /** Forget the frames so far (the turn stopped, the page was hidden). */
  pause(): void;
  /** Put it on a tier without a step (a page chose one). */
  set(tier: QualityTier, now?: number): void;
  /** How long it now waits, steady, before it tries a tier up. */
  readonly wait: number;
}

/**
 * The governor of a view that turns. It keeps a window of frame intervals; when their mean is over budget it steps one tier down, and when the mean has been steady for `wait` it tries one tier up. A try that goes over budget
 * is taken back, and every step down within thirty seconds of a step up doubles the wait (up to `maxUpAfterMs`), so a device on the edge between two tiers settles on the lower one and stays there. A step up that holds (steady
 * for `settleMs` after it) leaves the wait as it was.
 */
export function createGovernor(start: QualityTier, tuning: Partial<GovernorTuning> = {}): Governor {
  const t: GovernorTuning = { ...GOVERNOR_TUNING, ...tuning };
  let tier = start;
  let wait = t.upAfterMs;
  let window: number[] = [];
  let since = 0;
  let quietUntil = 0;
  let steadyFrom: number | undefined;
  let lastUp = -Infinity;
  let firstAt: number | undefined;
  // The interval of the display: told by the page, which measures it with nothing else going on (a view that cannot keep up looks, from its frames alone, like a screen that refreshes more slowly).
  let refresh = 16.7;
  const reset = (now: number): void => {
    window = [];
    since = now;
    steadyFrom = undefined;
  };
  const step = (to: QualityTier, now: number): QualityTier => {
    tier = to;
    quietUntil = now + t.quietMs;
    reset(now);
    return tier;
  };
  return {
    get tier() {
      return tier;
    },
    get wait() {
      return wait;
    },
    display(interval) {
      if (Number.isFinite(interval)) refresh = Math.min(34, Math.max(6, interval));
    },
    pause() {
      window = [];
      steadyFrom = undefined;
    },
    set(next, now = 0) {
      tier = next;
      quietUntil = now + t.quietMs;
      reset(now);
    },
    frame(interval, now) {
      if (interval > t.pauseMs || interval <= 0) {
        window = [];
        steadyFrom = undefined;
        return undefined;
      }
      firstAt ??= now;
      if (now < quietUntil || now - firstAt < t.warmMs) return undefined;
      if (window.length === 0) since = now - interval;
      window.push(interval);
      if (window.length > t.frames * 2) window.shift();
      if (window.length < t.minFrames || now - since < t.settleMs) return undefined;
      const mean = window.reduce((s, x) => s + x, 0) / window.length;
      const slow = refresh / 16.7;
      const budget = Math.max(t.budgetMs, t.budgetMs * slow);
      // Steady is steady on any display: only a view that really holds 60 frames a second tries a tier up.
      const steady = t.steadyMs;
      // Over budget is judged without the slowest frames of the window (a hitch, a script that ran in the middle of a turn is not a slow view); steady is judged with all of them.
      const sorted = [...window].sort((x, y) => x - y).slice(0, window.length - Math.max(1, Math.floor(window.length / 12)));
      const trimmed = sorted.reduce((sum, x) => sum + x, 0) / sorted.length;
      if (trimmed > budget && tier !== "low") {
        // A step down soon after a step up is a try that failed: the next try waits longer.
        if (now - lastUp < 30000) wait = Math.min(t.maxUpAfterMs, wait * 2);
        return step(lower(tier), now);
      }
      if (mean <= steady) {
        steadyFrom ??= now;
        if (tier !== "high" && now - steadyFrom >= wait) {
          lastUp = now;
          return step(higher(tier), now);
        }
      } else steadyFrom = undefined;
      // Window turned over: judge the next frames afresh once it is full of them.
      if (window.length >= t.frames * 2) window = window.slice(t.frames);
      return undefined;
    },
  };
}
