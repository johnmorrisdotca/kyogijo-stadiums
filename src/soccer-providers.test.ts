import { describe, expect, it } from "vitest";
import { drawKyogijo } from "./draw.ts";
import { FRAMES, convert, toSurface } from "./frames.ts";
import { SOCCER_PROVIDERS, SOCCER_PROVIDER_IDS, frameMatrix, layoutFromFrame, rescale, soccerFrame, soccerLandmarks, validFrame, type SoccerFrame, type SoccerProviderId } from "./surfaces/soccer-providers.ts";
import { soccerSpec } from "./surfaces/soccer-spec.ts";
import { parseXml, walk, withClass, type Node } from "./xml.fixture.ts";

const SIZES = [
  { length: 105, width: 68 },
  { length: 100, width: 64 },
  { length: 110, width: 75 },
  { length: 120, width: 90 },
];
const FEET = 3.280839895;

describe("the providers", () => {
  it("are ten, each with a valid frame at every size the Laws allow", () => {
    expect([...SOCCER_PROVIDER_IDS].sort()).toEqual(Object.keys(SOCCER_PROVIDERS).sort());
    expect(SOCCER_PROVIDER_IDS).toHaveLength(10);
    for (const id of SOCCER_PROVIDER_IDS) {
      for (const size of SIZES) {
        const frame = SOCCER_PROVIDERS[id].frame(size.length, size.width);
        expect(validFrame(frame), `${id} ${size.length}x${size.width}`).toBe(true);
        expect(frame.id).toBe(id);
      }
      expect(SOCCER_PROVIDERS[id].source.length, id).toBeGreaterThan(10);
      expect(SOCCER_PROVIDERS[id].note.length, id).toBeGreaterThan(10);
    }
  });

  it("have each provider's own figures: Opta 0 to 100 with the penalty area at 17, StatsBomb 120 by 80 yards, Wyscout 0 to 100 with y down", () => {
    const opta = soccerFrame("opta")!;
    expect([opta.xLeft, opta.xRight, opta.yTop, opta.yBottom]).toEqual([0, 100, 100, 0]);
    expect([opta.penaltyDepth, opta.goalAreaDepth, opta.spot]).toEqual([17, 5.8, 11.5]);
    expect([50 - opta.penaltyHalfWidth, 50 + opta.penaltyHalfWidth].map((v) => Math.round(v * 10) / 10)).toEqual([21.1, 78.9]);
    expect([50 - opta.goalAreaHalfWidth, 50 + opta.goalAreaHalfWidth].map((v) => Math.round(v * 10) / 10)).toEqual([36.8, 63.2]);
    const sb = soccerFrame("statsbomb")!;
    expect([sb.xLeft, sb.xRight, sb.yTop, sb.yBottom]).toEqual([0, 120, 0, 80]);
    expect([sb.penaltyDepth, sb.goalAreaDepth, sb.spot, 40 - sb.penaltyHalfWidth, 40 + sb.penaltyHalfWidth, 40 - sb.goalAreaHalfWidth, 40 - sb.goalHalfWidth]).toEqual([18, 6, 12, 18, 62, 30, 36]);
    const wy = soccerFrame("wyscout")!;
    expect([wy.xRight, wy.yTop, wy.yBottom, wy.penaltyDepth, wy.goalAreaDepth, wy.spot, 50 - wy.penaltyHalfWidth, 50 - wy.goalAreaHalfWidth]).toEqual([100, 0, 100, 16, 6, 10, 19, 37]);
    const impect = soccerFrame("impect")!;
    expect([impect.xLeft, impect.xRight, impect.yTop, impect.yBottom]).toEqual([-52.5, 52.5, 34, -34]);
    expect(impect.xLeft + impect.penaltyDepth).toBeCloseTo(-36, 9);
    expect(impect.xLeft + impect.goalAreaDepth).toBeCloseTo(-47, 9);
    expect(impect.xLeft + impect.spot).toBeCloseTo(-41.5, 9);
    const metrica = soccerFrame("metrica")!;
    expect([metrica.xLeft, metrica.xRight, metrica.yTop, metrica.yBottom]).toEqual([0, 1, 0, 1]);
    expect(metrica.penaltyDepth).toBeCloseTo(16.5 / 105, 9);
    expect(metrica.penaltyHalfWidth).toBeCloseTo(20.16 / 68, 9);
  });

  it("follow the size of the pitch where the provider's numbers do: Tracab in centimetres, SkillCorner and Second Spectrum in metres, from the middle", () => {
    const tracab = soccerFrame("tracab", { length: 105, width: 68 })!;
    expect([tracab.xLeft, tracab.xRight, tracab.yTop, tracab.yBottom]).toEqual([-5250, 5250, 3400, -3400]);
    expect([tracab.penaltyDepth, tracab.goalAreaDepth, tracab.spot]).toEqual([1650, 550, 1100]);
    expect(soccerFrame("tracab", { length: 100, width: 64 })!.xRight).toBe(5000);
    expect(soccerFrame("skillcorner", { length: 110, width: 70 })!.xLeft).toBe(-55);
    expect(soccerFrame("secondspectrum", { length: 100, width: 64 })!.yTop).toBe(32);
    // Opta's numbers are the same on every pitch.
    expect(soccerFrame("opta", { length: 120, width: 90 })).toEqual(soccerFrame("opta", { length: 100, width: 64 }));
  });

  it("make UEFA's frame 105 by 68 metres, as the Stadium Infrastructure Regulations say, and not mplsoccer's 65", () => {
    const uefa = soccerFrame("uefa")!;
    expect([uefa.xRight, uefa.yTop]).toEqual([105, 68]);
  });

  it("refuse an id that is not a provider and a frame that cannot be drawn, and take a frame of your own", () => {
    expect(soccerFrame("nope")).toBeUndefined();
    expect(soccerFrame("toString")).toBeUndefined();
    expect(soccerFrame(undefined)).toBeUndefined();
    const own: SoccerFrame = { id: "mine", name: "Mine", unit: "u", xLeft: 0, xRight: 200, yTop: 0, yBottom: 100, penaltyDepth: 30, penaltyHalfWidth: 30, goalAreaDepth: 10, goalAreaHalfWidth: 15, spot: 20, goalHalfWidth: 6 };
    expect(soccerFrame(own)).toBe(own);
    for (const bad of [{ ...own, penaltyDepth: 5 }, { ...own, xRight: 0 }, { ...own, spot: Number.NaN }, { ...own, goalHalfWidth: 20 }, { ...own, penaltyHalfWidth: 80 }, null, "x", 5]) expect(soccerFrame(bad as never)).toBeUndefined();
    expect(() => rescale("opta", "nope" as never)).toThrow(/Unknown pitch type/);
    expect(() => rescale("tracab", "opta", { length: 20, width: 10 })).toThrow(/too small/);
  });

  it("are registered as frames of soccer, variable in size, under their ids", () => {
    for (const id of SOCCER_PROVIDER_IDS) {
      expect(FRAMES[id]?.sport, id).toBe("soccer");
      expect(FRAMES[id].size).toBe("variable");
    }
    expect(FRAMES.opta.yDirection).toBe("up");
    expect(FRAMES.statsbomb.yDirection).toBe("down");
    expect(FRAMES.statsbomb.unit).toBe("yd");
    expect(FRAMES.tracab.unit).toBe("cm");
    expect(FRAMES.metrica.unit).toBe("fraction");
    expect(FRAMES.impect.origin).toContain("centre");
  });
});

describe("rescale", () => {
  const pairs = SOCCER_PROVIDER_IDS.flatMap((a) => SOCCER_PROVIDER_IDS.filter((b) => b !== a).map((b): [SoccerProviderId, SoccerProviderId] => [a, b]));

  it("sends every landmark of one provider to the same landmark of another, and back, for every pair of providers on every size", () => {
    expect(pairs).toHaveLength(90);
    for (const size of SIZES) {
      for (const [a, b] of pairs) {
        const map = rescale(a, b, size);
        const la = soccerLandmarks(soccerFrame(a, size)!);
        const lb = soccerLandmarks(soccerFrame(b, size)!);
        expect(la.x).toHaveLength(9);
        expect(la.y).toHaveLength(9);
        la.x.forEach((v, i) => {
          expect(map.x(v), `${a}->${b} x${i}`).toBeCloseTo(lb.x[i], 6);
          expect(map.inverse.x(lb.x[i]), `${b}->${a} x${i}`).toBeCloseTo(v, 6);
        });
        la.y.forEach((v, i) => {
          expect(map.y(v), `${a}->${b} y${i}`).toBeCloseTo(lb.y[i], 6);
          expect(map.inverse.y(lb.y[i]), `${b}->${a} y${i}`).toBeCloseTo(v, 6);
        });
        // A point at the corner of the penalty area, both axes together.
        const [px, py] = map(la.x[3], la.y[1]);
        expect(px).toBeCloseTo(lb.x[3], 6);
        expect(py).toBeCloseTo(lb.y[1], 6);
      }
    }
  });

  it("undoes itself everywhere, not only at the landmarks", () => {
    for (const [a, b] of pairs) {
      const map = rescale(a, b);
      const fa = soccerFrame(a)!;
      for (const [tx, ty] of [[0.13, 0.31], [0.5, 0.5], [0.77, 0.92], [-0.1, 1.2]]) {
        const x = fa.xLeft + tx * (fa.xRight - fa.xLeft);
        const y = fa.yTop + ty * (fa.yBottom - fa.yTop);
        const [bx, by] = map(x, y);
        const [ax, ay] = map.inverse(bx, by);
        expect(ax, `${a}->${b}`).toBeCloseTo(x, 6);
        expect(ay, `${a}->${b}`).toBeCloseTo(y, 6);
      }
    }
  });

  it("keeps a point on a line of the pitch on that line: Opta's penalty line, 17 from the goal line, is StatsBomb's, 18 yards from it", () => {
    const toStatsBomb = rescale("opta", "statsbomb");
    const [x, y] = toStatsBomb(83, 50);
    expect(x).toBeCloseTo(102, 9);
    expect(y).toBeCloseTo(40, 9);
    const [sx, sy] = toStatsBomb(94.2, 36.8);
    expect(sx).toBeCloseTo(114, 9);
    expect(sy).toBeCloseTo(50, 9);
    const [ox, oy] = rescale("statsbomb", "opta")(102, 40);
    expect(ox).toBeCloseTo(83, 9);
    expect(oy).toBeCloseTo(50, 9);
    expect(toStatsBomb.from.id).toBe("opta");
    expect(toStatsBomb.inverse.to.id).toBe("opta");
    expect(toStatsBomb.inverse.inverse).toBe(toStatsBomb);
  });

  it("turns y over where one provider has y up and the other down, and keeps the ends", () => {
    const map = rescale("opta", "wyscout");
    expect(map(0, 0)).toEqual([0, 100]);
    expect(map(100, 100)).toEqual([100, 0]);
    expect(map.y(0)).toBe(100);
    expect(map(50, 50)).toEqual([50, 50]);
    // Wyscout's penalty area is 19 to 81 from the top; in Opta's, 21.1 to 78.9 from the bottom.
    expect(map.y(21.1)).toBeCloseTo(81, 9);
    expect(map.y(78.9)).toBeCloseTo(19, 9);
  });

  it("is the identity from a provider to itself, and runs on straight past the lines for a ball out of play", () => {
    const same = rescale("opta", "opta");
    expect(same(33.3, 66.6)[0]).toBeCloseTo(33.3, 9);
    expect(same(33.3, 66.6)[1]).toBeCloseTo(66.6, 9);
    const toSb = rescale("opta", "statsbomb");
    expect(toSb.x(-5)).toBeLessThan(0);
    expect(toSb.x(105)).toBeGreaterThan(120);
    // Beyond the goal line the last piece goes on: Opta's 5.8 to 0 is StatsBomb's 6 to 0, so 5 beyond is 5.17 beyond.
    expect(toSb.x(-5)).toBeCloseTo(-5 * (6 / 5.8), 9);
  });

  it("agrees with `convert` of the frames module, which goes through the surface in feet", () => {
    const size = { length: 105, width: 68, unit: "m" as const };
    for (const [a, b] of [["opta", "statsbomb"], ["wyscout", "tracab"], ["metrica", "impect"], ["skillcorner", "opta"]] as const) {
      const direct = rescale(a, b, { length: 105, width: 68 });
      const fa = soccerFrame(a)!;
      const sample = [[0.37, 0.41], [0.905, 0.12], [0.03, 0.99]].map(([tx, ty]) => [fa.xLeft + tx * (fa.xRight - fa.xLeft), fa.yTop + ty * (fa.yBottom - fa.yTop)] as [number, number]);
      const through = convert(a, b, { size })(sample);
      sample.forEach((p, i) => {
        const [x, y] = direct(p[0], p[1]);
        expect(through[i][0], `${a}->${b}`).toBeCloseTo(x, 6);
        expect(through[i][1], `${a}->${b}`).toBeCloseTo(y, 6);
      });
    }
  });

  it("puts raw data on the surface in feet with `toSurface`: Opta's kick-off spot is the middle of a 105 by 68 m pitch, and its penalty line the Laws'", () => {
    const size = { length: 105, width: 68, unit: "m" as const };
    const [[x, y]] = toSurface([[50, 50]], { from: "opta", size });
    expect(x).toBeCloseTo((105 / 2) * FEET, 6);
    expect(y).toBeCloseTo((68 / 2) * FEET, 6);
    const [[px, py]] = toSurface([[100 - 17, 50]], { from: "opta", size });
    expect(px).toBeCloseTo((105 - 16.5) * FEET, 6);
    expect(py).toBeCloseTo(34 * FEET, 6);
  });
});

describe("a pitch drawn in a provider's own frame", () => {
  const spec = soccerSpec();
  const draw = (pitchType: unknown, extra: object = {}): Node => parseXml(drawKyogijo({ sport: "soccer", margin: 0, id: "p", pitchType, ...extra } as never));
  const lineD = (svg: Node): string => withClass(svg, "ky-line").map((n) => n.attrs.d ?? "").join(" ");

  it("stands the lines where the provider puts them: Opta's penalty line at 17, which is 17.85 m of 105, and its spot at 11.5", () => {
    const svg = draw("opta");
    expect(lineD(svg)).toContain("M0 14.35H17.85V53.65H0");
    expect(lineD(svg)).toContain("M0 25.02H6.09V42.98H0");
    expect(withClass(svg, "ky-fill-line").some((n) => n.attrs.cx === "12.08")).toBe(true);
  });

  it("puts an empty group of the provider's own numbers in the drawing, with the matrix that turns them into metres", () => {
    const group = withClass(draw("opta"), "ky-data")[0];
    expect(group.attrs["data-frame"]).toBe("opta");
    expect(group.children).toHaveLength(0);
    expect(group.attrs.transform).toBe("matrix(1.05 0 0 -0.68 0 68)");
    const sb = withClass(draw("statsbomb"), "ky-data")[0];
    expect(sb.attrs.transform).toBe("matrix(0.875 0 0 0.85 0 0)");
    expect(withClass(draw(undefined), "ky-data")).toHaveLength(0);
  });

  it("lands a raw point where the matrix says: Opta (83, 50) is the middle of the penalty line", () => {
    const [a, , , d, e, f] = frameMatrix(soccerFrame("opta")!, spec);
    expect(a * 83 + e).toBeCloseTo(87.15, 9);
    expect(d * 50 + f).toBeCloseTo(34, 9);
    expect(layoutFromFrame(soccerFrame("opta")!, spec).penaltyDepth).toBeCloseTo(17.85, 9);
    expect(105 - 87.15).toBeCloseTo(17.85, 9);
  });

  it("is the Laws' pitch for a provider whose numbers are metres from the middle", () => {
    expect(lineD(draw("impect"))).toContain("M0 13.84H16.5V54.16H0");
    expect(lineD(draw("tracab"))).toContain("M0 13.84H16.5V54.16H0");
    expect(withClass(draw("tracab"), "ky-data")[0].attrs.transform).toBe("matrix(0.01 0 0 -0.01 52.5 34)");
  });

  it("follows the pitch's size for a provider whose numbers do", () => {
    const svg = draw("tracab", { pitch: { length: 100, width: 64 } });
    expect(withClass(svg, "ky-data")[0].attrs.transform).toBe("matrix(0.01 0 0 -0.01 50 32)");
  });

  it("keeps a small-sided pitch's own markings and only adds the group", () => {
    const plain = lineD(draw(undefined, { pitch: "futsal" }));
    const typed = draw("opta", { pitch: "futsal" });
    expect(lineD(typed)).toBe(plain);
    expect(withClass(typed, "ky-data")).toHaveLength(1);
  });

  it("takes a frame of your own, and ignores one that is not a frame", () => {
    const own = { id: "mine", name: "Mine", unit: "u", xLeft: 0, xRight: 200, yTop: 0, yBottom: 100, penaltyDepth: 30, penaltyHalfWidth: 30, goalAreaDepth: 10, goalAreaHalfWidth: 15, spot: 20, goalHalfWidth: 6 };
    const svg = draw(own);
    expect(withClass(svg, "ky-data")[0].attrs["data-frame"]).toBe("mine");
    expect(lineD(svg)).toContain("H15.75V");
    expect(drawKyogijo({ sport: "soccer", id: "q", pitchType: { id: "x" } as never })).toBe(drawKyogijo({ sport: "soccer", id: "q" }));
    expect(drawKyogijo({ sport: "soccer", id: "q", pitchType: "nope" as never })).toBe(drawKyogijo({ sport: "soccer", id: "q" }));
  });

  it("is a drawing like any other: well-formed, tall, with teams", () => {
    for (const id of SOCCER_PROVIDER_IDS) {
      const svg = parseXml(drawKyogijo({ sport: "soccer", pitchType: id, orientation: "portrait", away: { name: "A", score: 1 }, home: { name: "B", score: 0 } }));
      expect(walk(svg).some((n) => n.name === "text")).toBe(true);
      expect(withClass(svg, "ky-data")[0].attrs["data-frame"]).toBe(id);
    }
  });
});
