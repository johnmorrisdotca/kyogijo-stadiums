import { describe, expect, it } from "vitest";
import { VENUES, VENUE_IDS, venueOrientation } from "./venues.ts";
import {
  CHANNELS,
  STAGE_IDS,
  cameraAt,
  coverSide,
  flightPlan,
  foldTime,
  glide,
  glideSeconds,
  lengthWords,
  mainView,
  mapBox,
  mapFrame,
  monotoneSlopes,
  nextRate,
  niceLength,
  RAMP,
  stageAt,
  stagesOf,
  startOf,
  turnPeriod,
  type Camera,
  type Channel,
  type Flight,
  type StageId,
} from "./flythrough.path.ts";
import { flythroughMarkup, graticuleMarkup, gridPath, mapMarkup, stageWords } from "./flythrough.markup.ts";
import { FLYTHROUGH_WORDS } from "./flythrough.words.ts";
import { FLYTHROUGH_STYLE } from "./flythrough.style.ts";

const FRAME = 1 / 60;
/** The most a channel may change in one frame at 60 a second, in its own units. The path's own is a good deal less than these. */
const STEP: Record<Channel, number> = { logSpan: 0.05, ax: 0.01, ay: 0.01, north: 1.2, map: 0.05, site: 0.05, arena: 0.05, yaw: 0.4, pitch: 0.8, logZoom: 0.01, logLens: 0.03, roof: 0.05 };
/** The most the change itself may change from one frame to the next: no jump of speed. */
const BEND: Record<Channel, number> = { logSpan: 0.003, ax: 0.002, ay: 0.002, north: 0.05, map: 0.006, site: 0.006, arena: 0.006, yaw: 0.01, pitch: 0.02, logZoom: 0.002, logLens: 0.002, roof: 0.006 };

/** Every frame of a path at 60 a second, from the start to `after` seconds past its end. */
function frames(flight: Flight, after = 40): Camera[] {
  const out: Camera[] = [];
  for (let t = 0; t <= flight.end + after + 1e-9; t += FRAME) out.push(cameraAt(flight, t));
  return out;
}

const SUBSETS: StageId[][] = [
  ["map", "city", "arena", "bowl", "rink"],
  ["map", "city", "arena"],
  ["map", "city"],
  ["city", "arena"],
  ["map", "arena"],
  ["arena", "bowl", "rink"],
  ["map", "bowl"],
  ["city", "rink"],
  ["bowl", "rink"],
  ["map"],
  ["city"],
  ["arena"],
  ["bowl"],
  ["rink"],
];
const input = (stages?: StageId[]) => ({ north: 90, siteSpan: 420, anchorStart: [0.18, -0.12] as const, anchorEnd: [0.02, 0.03] as const, ...(stages === undefined ? {} : { stages }) });

describe("the fly-through's path", () => {
  it("flies the stages in order, from the map to the turning arena, and says when each starts", () => {
    const flight = flightPlan(input());
    expect(stagesOf(flight)).toEqual(["map", "city", "arena", "bowl", "rink"]);
    expect(startOf(flight, "map")).toBe(0);
    const starts = STAGE_IDS.map((id) => startOf(flight, id)!);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(new Set(starts).size).toBe(5);
    expect(flight.end).toBeGreaterThan(starts[4]);
    // The path ends on the rink turning from the seat, more slowly than the arena turned.
    expect(flight.tail).toBeLessThan(0);
    expect(Math.abs(flight.tail)).toBeLessThan(flight.input.turn);
  });

  it("never jumps: from frame to frame no channel changes by more than a small step, at 60 frames a second, over the whole path and the turning after it", () => {
    for (const stages of SUBSETS) {
      const all = frames(flightPlan(input(stages)));
      for (let i = 1; i < all.length; i += 1) for (const channel of CHANNELS) expect(Math.abs(all[i][channel] - all[i - 1][channel]), `${stages.join()} ${channel} at frame ${i}`).toBeLessThanOrEqual(STEP[channel]);
    }
  });

  it("never changes speed with a jump either: the change of each channel changes smoothly, at every keyframe too", () => {
    for (const stages of SUBSETS) {
      const all = frames(flightPlan(input(stages)));
      for (let i = 2; i < all.length; i += 1) for (const channel of CHANNELS) expect(Math.abs(all[i][channel] - 2 * all[i - 1][channel] + all[i - 2][channel]), `${stages.join()} ${channel} at frame ${i}`).toBeLessThanOrEqual(BEND[channel]);
    }
  });

  it("starts and stops still: the first frames and the last keyframe's neighbours barely move, and the arena then turns at one steady speed", () => {
    const flight = flightPlan(input());
    const [a, b] = [cameraAt(flight, 0), cameraAt(flight, FRAME)];
    for (const channel of CHANNELS) expect(Math.abs(b[channel] - a[channel]), channel).toBeLessThan(1e-3 + (channel === "logSpan" ? 1e-3 : 0));
    const [x, y, z] = [cameraAt(flight, flight.end + 1), cameraAt(flight, flight.end + 2), cameraAt(flight, flight.end + 3)];
    expect(y.yaw - x.yaw).toBeCloseTo(flight.tail, 6);
    expect(z.yaw - y.yaw).toBeCloseTo(flight.tail, 6);
    for (const channel of CHANNELS.filter((c) => c !== "yaw")) expect(z[channel]).toBeCloseTo(x[channel], 9);
  });

  it("keeps every layer's share between none and all, and shows the layers in order: the map, then the plan, then the arena", () => {
    const flight = flightPlan(input());
    for (const camera of frames(flight, 5)) for (const layer of ["map", "site", "arena", "roof"] as const) {
      expect(camera[layer]).toBeGreaterThanOrEqual(-1e-9);
      expect(camera[layer]).toBeLessThanOrEqual(1 + 1e-9);
    }
    const at = (id: StageId) => cameraAt(flight, startOf(flight, id)!);
    expect(at("map")).toMatchObject({ map: 1, site: 0, arena: 0 });
    expect(at("city")).toMatchObject({ map: 0, site: 1, arena: 0 });
    expect(at("arena").arena).toBe(1);
    // The roof is on for the arena turning and lifted away by the time the camera is in the bowl.
    expect(at("arena").roof).toBe(1);
    expect(at("rink").roof).toBe(0);
    // The map is gone before the arena shows, and the plan is under the arena when the arena is whole.
    for (const camera of frames(flight, 5)) expect(camera.map === 0 || camera.arena === 0).toBe(true);
  });

  it("makes every stage reachable: each starts inside itself, and the stages come one after another and never back", () => {
    for (const stages of SUBSETS) {
      const flight = flightPlan(input(stages));
      expect(stagesOf(flight)).toEqual(STAGE_IDS.filter((id) => stages.includes(id)));
      for (const id of stagesOf(flight)) expect(stageAt(flight, startOf(flight, id)!)).toBe(id);
      const seen: StageId[] = [];
      for (let t = 0; t <= flight.end + 1; t += FRAME) {
        const here = stageAt(flight, t);
        if (seen[seen.length - 1] !== here) seen.push(here);
      }
      expect(seen).toEqual(stagesOf(flight));
    }
  });

  it("starts a path that leaves a stage out where the stage after it starts, and crosses the missing seconds in one run", () => {
    const flight = flightPlan(input(["map", "arena"]));
    const whole = flightPlan(input());
    expect(startOf(flight, "arena")).toBeCloseTo(startOf(whole, "arena")!, 9);
    expect(flightPlan(input(["arena"])).stages).toEqual([{ id: "arena", start: 0 }]);
    expect(cameraAt(flightPlan(input(["city"])), 0)).toMatchObject({ map: 0, site: 1 });
    expect(() => flightPlan({ ...input(), stages: [] })).toThrow(/at least one stage/);
  });

  it("turns the map to the venue's own orientation by the time it reaches the city, and the plan stays turned", () => {
    for (const north of [-12, 0, 90, 178]) {
      const flight = flightPlan({ ...input(), north });
      expect(cameraAt(flight, 0).north).toBe(0);
      expect(cameraAt(flight, startOf(flight, "city")!).north).toBeCloseTo(north, 9);
      expect(cameraAt(flight, flight.end).north).toBeCloseTo(north, 9);
    }
    // Every venue's own orientation is one the path can take.
    for (const id of VENUE_IDS) expect(Math.abs(venueOrientation(VENUES[id]).north)).toBeLessThanOrEqual(180);
  });

  it("hands the plan over to the 3D arena at the same size: the zoom's scale is the site span there, and the 3D view starts from straight above", () => {
    const flight = flightPlan({ ...input(), siteSpan: 380 });
    const arena = cameraAt(flight, startOf(flight, "arena")!);
    expect(Math.exp(arena.logSpan)).toBeCloseTo(380, 6);
    expect(arena).toMatchObject({ yaw: 0, pitch: 0, logZoom: 0 });
    // It tips to the sport's main camera, and a path that ends there stays in it.
    const view = mainView("nhl");
    const [, , tilted] = [0, 0, flightPlan({ ...input(["map", "city", "arena"]), siteSpan: 380 })];
    expect(cameraAt(tilted, tilted.end).pitch).toBeCloseTo(view.pitch, 9);
    // The eye is the usual long lens until the camera goes in.
    expect(arena.logLens).toBeCloseTo(Math.log(8), 9);
  });

  it("keeps the arena in view on the way: where it stands on the screen stays inside the stage", () => {
    const flight = flightPlan({ ...input(), anchorStart: [0.4, -0.4] });
    for (const camera of frames(flight, 5)) {
      expect(Math.abs(camera.ax)).toBeLessThan(0.5);
      expect(Math.abs(camera.ay)).toBeLessThan(0.5);
    }
  });

  it("folds a moment long after the end back to one within a turn of it, with the same view", () => {
    const flight = flightPlan(input());
    const period = turnPeriod(flight);
    expect(period).toBeCloseTo(360 / Math.abs(flight.tail), 9);
    expect(foldTime(flight, 5)).toBe(5);
    const late = flight.end + 3 * period + 7;
    const folded = foldTime(flight, late);
    expect(folded).toBeLessThan(flight.end + period);
    const wrap = (angle: number) => ((((angle + 180) % 360) + 360) % 360) - 180;
    expect(wrap(cameraAt(flight, folded).yaw)).toBeCloseTo(wrap(cameraAt(flight, late).yaw), 6);
  });

  it("gives every stage a still for a reader who prefers reduced motion: one layer whole, nothing half-faded, and the main camera for the arena", () => {
    const flight = flightPlan(input());
    for (const id of STAGE_IDS) {
      const still = flight.rest[id];
      for (const layer of ["map", "site", "arena"] as const) expect([0, 1], `${id} ${layer}`).toContain(still[layer]);
      expect(still.map + still.site + still.arena, id).toBe(1);
    }
    expect(flight.rest.map.map).toBe(1);
    expect(flight.rest.city.site).toBe(1);
    expect(flight.rest.arena).toMatchObject({ arena: 1, yaw: mainView("nhl").yaw, pitch: mainView("nhl").pitch, roof: 1 });
    // The bowl is seen with the roof lifted away and the rink from the seat, nearer and through a shorter lens, each still and whole.
    expect(flight.rest.bowl.roof).toBe(0);
    expect(flight.rest.rink).toMatchObject({ roof: 0, pitch: 77 });
    expect(Math.exp(flight.rest.rink.logZoom)).toBeCloseTo(2.8, 9);
    expect(Math.exp(flight.rest.rink.logLens)).toBeCloseTo(1, 9);
    expect(flight.rest.bowl.logLens).toBeLessThan(flight.rest.arena.logLens);
    expect(flight.rest.bowl.logLens).toBeGreaterThan(flight.rest.rink.logLens);
  });

  it("goes into the bowl in one run: the roof lifts away and the lens shortens and the camera comes nearer, never back, and the turn never stops or reverses", () => {
    const flight = flightPlan(input());
    const [bowl, rink] = [startOf(flight, "bowl")!, startOf(flight, "rink")!];
    let [lens, roof, zoom, pitch] = [Infinity, Infinity, -Infinity, -Infinity];
    for (let t = bowl; t <= flight.end + 5; t += FRAME) {
      const camera = cameraAt(flight, t);
      expect(camera.logLens, `lens at ${t}`).toBeLessThanOrEqual(lens + 1e-9);
      expect(camera.roof, `roof at ${t}`).toBeLessThanOrEqual(roof + 1e-9);
      expect(camera.logZoom, `zoom at ${t}`).toBeGreaterThanOrEqual(zoom - 1e-9);
      expect(camera.pitch, `pitch at ${t}`).toBeGreaterThanOrEqual(pitch - 1e-9);
      [lens, roof, zoom, pitch] = [camera.logLens, camera.roof, camera.logZoom, camera.pitch];
    }
    // From the arena's first frame to the last the arena turns the same way, at a speed between the rink's and the arena's, once it has started.
    let yaw = cameraAt(flight, startOf(flight, "arena")!).yaw;
    for (let t = startOf(flight, "arena")! + FRAME; t <= flight.end + 20; t += FRAME) {
      const next = cameraAt(flight, t).yaw;
      expect(next, `yaw at ${t}`).toBeLessThanOrEqual(yaw + 1e-9);
      if (t > startOf(flight, "arena")! + 3.5) expect((yaw - next) / FRAME, `speed at ${t}`).toBeGreaterThan(flight.input.rinkTurn - 0.5);
      expect((yaw - next) / FRAME, `speed at ${t}`).toBeLessThan(flight.input.turn + 0.5);
      yaw = next;
    }
    // It settles at the seat's viewpoint where the rink stage starts.
    const seat = cameraAt(flight, rink);
    expect(seat.pitch).toBeCloseTo(77, 9);
    expect(Math.exp(seat.logZoom)).toBeCloseTo(2.8, 9);
    expect(Math.exp(seat.logLens)).toBeCloseTo(1, 9);
    expect(seat.roof).toBe(0);
  });

  it("settles at the seat a page chose, and turns the rink at the speed it chose", () => {
    const flight = flightPlan({ ...input(), seat: { pitch: 70, zoom: 2, lens: 2 }, rinkTurn: 5, turn: 10 });
    const seat = cameraAt(flight, startOf(flight, "rink")!);
    expect([seat.pitch, Math.exp(seat.logZoom), Math.exp(seat.logLens)].map((n) => Math.round(n * 1e6) / 1e6)).toEqual([70, 2, 2]);
    expect(flight.tail).toBe(-5);
    expect(flightPlan({ ...input(["arena"]), turn: 10 }).tail).toBe(-10);
    expect(flightPlan({ ...input(["map"]) }).tail).toBe(0);
  });

  it("goes from any stage to any other along the path with no jump, at the clock's own faster pace", () => {
    const flight = flightPlan(input());
    for (const from of STAGE_IDS) for (const to of STAGE_IDS) {
      const [a, b] = [startOf(flight, from)!, startOf(flight, to)!];
      const seconds = glideSeconds(b - a);
      const dt = 1 / 60;
      let previous = cameraAt(flight, a);
      let time = a;
      let fastest = 0;
      for (let elapsed = dt; elapsed <= seconds + dt; elapsed += dt) {
        const next = glide(a, b, Math.min(elapsed, seconds), seconds);
        fastest = Math.max(fastest, Math.abs(next - time) / dt);
        time = next;
        const camera = cameraAt(flight, next);
        // The clock runs at most about three halves of the distance over the time, in seconds of path a second.
        for (const channel of CHANNELS) expect(Math.abs(camera[channel] - previous[channel]), `${from}→${to} ${channel}`).toBeLessThanOrEqual(STEP[channel] * Math.max(1, fastest));
        previous = camera;
      }
      expect(time).toBeCloseTo(b, 9);
    }
  });
});

describe("the clock", () => {
  it("glides from one moment to another, still at both ends, and takes a time that is neither a cut nor slow", () => {
    expect(glide(2, 10, 0, 1)).toBe(2);
    expect(glide(2, 10, 1, 1)).toBe(10);
    expect(glide(2, 10, 0.5, 1)).toBe(6);
    expect(glide(2, 10, 0.01, 1) - 2).toBeLessThan(0.01);
    expect(glide(2, 10, 5, 0)).toBe(10);
    for (const distance of [0, 1, 5, 12, 400, -12]) {
      expect(glideSeconds(distance)).toBeGreaterThanOrEqual(0.6);
      expect(glideSeconds(distance)).toBeLessThanOrEqual(1.8);
    }
  });

  it("speeds up to the path's pace and slows to a stop in under half a second, at a steady rate, never at once", () => {
    let rate = 0;
    const seen: number[] = [];
    for (let i = 0; i < 30; i += 1) {
      rate = nextRate(rate, true, 1 / 60);
      seen.push(rate);
    }
    expect(seen[0]).toBeLessThan(0.05);
    expect(seen[29]).toBe(1);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    for (let i = 1; i < 27; i += 1) expect(seen[i] - seen[i - 1]).toBeCloseTo(1 / 60 / RAMP, 9);
    for (let i = 0; i < 30; i += 1) rate = nextRate(rate, false, 1 / 60);
    expect(rate).toBe(0);
    expect(nextRate(1, false, 1 / 60)).toBeGreaterThan(0.95);
    expect(nextRate(0, true, 5)).toBe(1);
  });
});

describe("the monotone cubic", () => {
  it("is still where the neighbours' slopes change sign and at both ends, and never overshoots a plateau", () => {
    expect(monotoneSlopes([0, 1, 2, 3], [0, 0, 1, 1])).toEqual([0, 0, 0, 0]);
    const slopes = monotoneSlopes([0, 1, 2, 3, 4], [0, 0, 1, 0, 0]);
    expect(slopes[2]).toBe(0);
    expect(slopes[0]).toBe(0);
    expect(slopes[4]).toBe(0);
    expect(monotoneSlopes([0, 1], [0, 5])).toEqual([0, 0]);
  });
});

describe("the map's frame", () => {
  // A stand-in for chizu's world: Miller's cylindrical projection round a centre longitude, on a canvas 1000 wide.
  const project = (lon: number, lat: number): [number, number] => {
    const lam = (((lon - 155 + 540) % 360) - 180) * (Math.PI / 180);
    const phi = (lat * Math.PI) / 180;
    return [500 + 159.15 * lam, 316 - 159.15 * 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi))];
  };

  it("finds the metres one canvas unit is at the arena, across and down, from the projection", () => {
    const frame = mapFrame(project, -117.88, 33.81)!;
    expect(frame.at[0]).toBeCloseTo(project(-117.88, 33.81)[0], 9);
    // Miller stretches north-south a little more than east-west would in a true plane, so a unit is not the same metres both ways there.
    expect(frame.metresX / frame.metresY).toBeGreaterThan(0.5);
    expect(frame.metresX / frame.metresY).toBeLessThan(2);
    // The metres of a degree of longitude: the canvas width over 360 degrees is 2.78 units a degree, 111 km times cos(latitude) across.
    expect(frame.metresX).toBeCloseTo((111195 * Math.cos((33.81 * Math.PI) / 180)) / 2.7778, -1);
    expect(mapFrame(() => null, 0, 0)).toBeUndefined();
  });

  it("draws a box that is true to the ground, centred on the arena: the metres asked for across and down", () => {
    const frame = mapFrame(project, -114.05, 51.04)!;
    const box = mapBox(frame, 20_000);
    expect(box.x + box.w / 2).toBeCloseTo(frame.at[0], 9);
    expect(box.y + box.h / 2).toBeCloseTo(frame.at[1], 9);
    expect(box.w * frame.metresX).toBeCloseTo(20_000, 6);
    expect(box.h * frame.metresY).toBeCloseTo(20_000, 6);
  });

  it("covers the stage whichever way the map is turned about the arena", () => {
    for (const [w, h, x, y] of [[1000, 625, 500, 312], [390, 487, 200, 260], [1000, 625, 560, 330]]) {
      const side = coverSide(w, h, x, y);
      for (const degrees of [0, 17, 45, 90, 133, 180]) {
        const turn = (degrees * Math.PI) / 180;
        for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) {
          // The corner in the map's own frame (turned back): inside the square.
          const [dx, dy] = [cx - x, cy - y];
          const [u, v] = [dx * Math.cos(turn) + dy * Math.sin(turn), -dx * Math.sin(turn) + dy * Math.cos(turn)];
          expect(Math.abs(u)).toBeLessThanOrEqual(side / 2 + 1e-6);
          expect(Math.abs(v)).toBeLessThanOrEqual(side / 2 + 1e-6);
        }
      }
    }
  });
});

describe("the scale bar", () => {
  it("shows one, two or five times a power of ten, the longest that fits, in words", () => {
    expect(niceLength(10, 140)).toBe(1000);
    expect(niceLength(0.5, 140)).toBe(50);
    expect(niceLength(4762, 140)).toBe(500_000);
    expect(niceLength(2.4, 100)).toBe(200);
    for (const mpp of [0.2, 1.7, 33, 4762, 91_000]) {
      const length = niceLength(mpp, 140);
      expect(length / mpp).toBeLessThanOrEqual(140 + 1e-9);
      expect(length / mpp).toBeGreaterThan(40);
      expect(String(length)).toMatch(/^[125]0*$/);
    }
    expect(lengthWords(500)).toBe("500 m");
    expect(lengthWords(2000)).toBe("2 km");
    expect(lengthWords(500_000)).toBe("500 km");
  });

  it("draws the grid as lines of a path, none where the spacing is too small to read", () => {
    expect(gridPath(100, 100, 2, 300)).toBe("");
    const lines = gridPath(100, 100, 50, 120);
    expect(lines.split("M").length - 1).toBe(2 * (2 * Math.ceil(120 / 50) + 1));
  });
});

describe("the markup", () => {
  const sample = '<svg xmlns="http://www.w3.org/2000/svg" class="chizu" viewBox="0 0 1000 489" role="img" aria-label="Map of World" data-map="world"><style>.chizu{--cz-sea:#cfe3ee}</style><rect width="1000" height="489"/><text x="1" y="2">Atlantic</text><path d="M0 0L1 1Z"/></svg>';

  it("draws a map as a layer that fills its box and is hidden from a screen reader, with no text that would be stretched", () => {
    const layer = mapMarkup(sample);
    expect(layer).toContain('viewBox="0 0 1000 489"');
    expect(layer).toContain('preserveAspectRatio="none"');
    expect(layer).toContain('aria-hidden="true"');
    expect(layer).not.toContain("<text");
    expect(layer).not.toContain('role="img"');
    expect(layer).toContain("<path");
    expect(() => mapMarkup("<div></div>")).toThrow(/SVG/);
    expect(() => mapMarkup("<svg></svg>")).toThrow(/viewBox/);
  });

  it("draws a plain graticule when no map is handed over: lines for every five degrees, in metres, and no text", () => {
    const { svg, width } = graticuleMarkup(33.8);
    expect(svg).not.toContain("<text");
    expect(svg).toContain("vector-effect");
    expect(width).toBeGreaterThan(5_000_000);
    expect(svg.match(/M-?\d+ /g)!.length).toBeGreaterThan(20);
  });

  it("writes the stage, the three layers, the controls and the credit, in either language, with the words outside every layer", () => {
    for (const language of ["en", "ja"] as const) {
      const html = flythroughMarkup({ id: "t", language, arena: "Honda Center", place: "Anaheim, United States", stages: STAGE_IDS, map: mapMarkup(sample), mapCredit: true });
      expect(html).toContain('class="kf"');
      for (const part of ["kf-map", "kf-site", "kf-3d", "kf-pin", "kf-scale", "kf-caption", "kf-controls", "kf-credit", "kf-live"]) expect(html, part).toContain(part);
      expect(html).toContain("(c) OpenStreetMap contributors");
      expect(html).toContain("ODbL 1.0");
      expect(html).toContain("Natural Earth");
      // The 3D layer is out of reach of the pointer and the keys (the stage has its own), and the pictures say nothing to a screen reader.
      expect(html).toMatch(/class="kf-layer kf-3d" inert/);
      expect(html.match(/aria-hidden="true"/g)!.length).toBeGreaterThan(4);
      // Every word is HTML over the layers: none of the text is inside the map's box or the site's svg.
      const map = html.slice(html.indexOf("kf-map-box"), html.indexOf("kf-site"));
      expect(map).not.toMatch(/<(span|p|b|h\d)\b/);
      const site = html.slice(html.indexOf('<svg class="kf-layer kf-site'), html.indexOf("kf-3d"));
      expect(site).not.toContain("<text");
      expect(html).toContain(language === "ja" ? "再生" : "Play");
    }
    expect(flythroughMarkup({ id: "t", language: "en", arena: "A", place: "B", stages: ["arena"], map: mapMarkup(sample), mapCredit: false, controls: false })).not.toContain('class="kf-controls"');
    expect(flythroughMarkup({ id: "t", language: "en", arena: "A", place: "B", stages: ["arena"], map: mapMarkup(sample), mapCredit: false })).not.toContain("Natural Earth");
  });

  it("has the same words in both languages, each filled in, and the Japanese is Japanese", () => {
    const [en, ja] = [FLYTHROUGH_WORDS.en, FLYTHROUGH_WORDS.ja];
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
    for (const id of STAGE_IDS) {
      for (const language of ["en", "ja"] as const) {
        const said = stageWords(language, id, { arena: "Honda Center", place: "Anaheim, United States", seats: "17,174", tiers: 2 });
        expect(said.name.length).toBeGreaterThan(0);
        expect(said.text).not.toContain("{");
        // The words say what is seen: the arena where it is the subject, the seats and the tiers where the bowl is.
        if (id === "bowl") expect(said.text).toContain("17,174");
        else if (id !== "rink") expect(said.text).toContain("Honda Center");
      }
      expect(ja.stage[id].name).toMatch(/[぀-ヿ一-鿿]/);
      expect(ja.stage[id].text).toMatch(/[぀-ヿ一-鿿]/);
    }
    for (const key of ["title", "about", "announce", "play", "pause", "back", "next", "stages", "keys", "creditMap", "creditPlain", "still"] as const) {
      expect(ja[key], key).toMatch(/[぀-ヿ一-鿿]/);
      expect(en[key], key).not.toMatch(/[぀-ヿ一-鿿]/);
    }
  });

  it("shows no team's or league's mark and no seat map: the words and the style name neither", () => {
    const everything = JSON.stringify(FLYTHROUGH_WORDS) + FLYTHROUGH_STYLE;
    expect(everything).not.toMatch(/\b(NHL|logo|emblem|crest)\b/i);
  });

  it("themes both ways and follows the device when no theme is forced, and keeps every control at least 44 pixels", () => {
    expect(FLYTHROUGH_STYLE).toContain("prefers-color-scheme:dark");
    expect(FLYTHROUGH_STYLE).toContain("[data-theme=dark]");
    expect(FLYTHROUGH_STYLE).toContain("min-height:44px");
    expect(FLYTHROUGH_STYLE).toContain("min-width:44px");
  });
});
