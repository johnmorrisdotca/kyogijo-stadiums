// The racing scoreboard: what the timing tower and the podium show is the timing board's own, the podium is exactly the finishing order, the tower stands clear of the road on every circuit, and the markup is one
// design with a line for each of the first cars.
import { describe, expect, it } from "vitest";
import {
  CIRCUIT_IDS,
  RACE_WORDS,
  TOWER_ROWS,
  circuitById,
  circuitPlan,
  drawRace,
  gapText,
  lapTime,
  podiumData,
  raceAt,
  raceTimeText,
  simulateRace,
  standingGap,
  towerData,
  towerFrame,
  towerMarkup,
} from "./circuits-entry.ts";

const race = simulateRace({ circuit: "las-vegas", laps: 8, cars: 20, seed: 7 });

describe("the timing tower", () => {
  it("says what the timing board says at every moment sampled: the same cars in the same order with the same gaps", () => {
    for (const t of [0, 40, 130, 260, 400, race.flag - 5, race.flag + 3, race.duration]) {
      const moment = raceAt(race, t);
      const tower = towerData(race, moment, "en");
      expect(tower.rows).toHaveLength(TOWER_ROWS);
      moment.standings.slice(0, TOWER_ROWS).forEach((line, i) => {
        const row = tower.rows[i];
        expect(row.id).toBe(line.car.id);
        expect(row.position).toBe(i + 1);
        expect(row.code).toBe(line.car.driver.code);
        expect(row.status).toBe(line.status);
        // The gap is the board's, but for the pit lane (`PIT`) and for the winner once it has the flag (its race time).
        if (line.status === "pit") expect(row.gap).toBe(RACE_WORDS.en.tower.pit);
        else if (i === 0 && line.status === "finished") expect(row.gap).toBe(raceTimeText(race.finish[line.index]!));
        else expect(row.gap).toBe(standingGap(line, "en", "gap"));
      });
      expect(tower.rest.split(" ").filter(Boolean)).toEqual(moment.standings.slice(TOWER_ROWS).map((l) => l.car.driver.code));
    }
  });

  it("gives the lap, the flag state and the fastest lap of the moment", () => {
    expect(towerData(race, raceAt(race, 0), "en")).toMatchObject({ stage: "On the grid", flag: "grid", fastest: "" });
    const mid = raceAt(race, 300);
    const tower = towerData(race, mid, "en");
    expect(tower.flag).toBe("green");
    expect(tower.stage).toBe(`Lap ${mid.lap} / ${race.laps}`);
    expect(tower.fastest).toBe(`FL ${race.cars[mid.fastest!.index].driver.code} ${lapTime(mid.fastest!.time)} L${mid.fastest!.lap}`);
    expect(towerData(race, raceAt(race, race.flag + 1), "en")).toMatchObject({ flag: "chequered", stage: "Chequered flag" });
    expect(towerData(race, mid, "ja").stage).toBe(`${mid.lap} / ${race.laps}周`);
  });

  it("lists fewer lines for a smaller field, and is pure", () => {
    const small = simulateRace({ circuit: "las-vegas", laps: 3, cars: 4, seed: 2 });
    expect(towerData(small, raceAt(small, 100), "en").rows).toHaveLength(4);
    expect(towerData(small, raceAt(small, 100), "en").rest).toBe("");
    expect(JSON.stringify(towerData(race, raceAt(race, 300), "en"))).toBe(JSON.stringify(towerData(race, raceAt(race, 300), "en")));
  });

  it("is one design: a head, a line for each of the first cars with its place, colour, code and gap, the ticker and the fastest lap", () => {
    const svg = towerMarkup(towerData(race, raceAt(race, 300), "en"), TOWER_ROWS, "en");
    expect(svg.match(/class="ky-tw-row"/g)).toHaveLength(TOWER_ROWS);
    for (const part of ["stage", "flag", "pos", "sw", "code", "gap", "rest", "fast"]) expect(svg).toContain(`data-t="${part}"`);
    expect(svg).toContain(RACE_WORDS.en.tower.caption);
    expect(towerMarkup(towerData(race, raceAt(race, 300), "en"), TOWER_ROWS, "ja")).toContain(RACE_WORDS.ja.tower.caption);
  });

  it("stands in the plan view beside the start and finish straight, on the drawing and clear of the lap and the pit lane, on every circuit", () => {
    expect(CIRCUIT_IDS.length).toBeGreaterThan(0);
    for (const id of CIRCUIT_IDS) {
      const plan = circuitPlan(circuitById(id)!);
      const k = Math.max(plan.box.x1 - plan.box.x0, plan.box.y1 - plan.box.y0) / 1000;
      const t = towerFrame(plan, k, 20);
      expect(t.rows).toBe(TOWER_ROWS);
      // Inside what the plan draws.
      expect(t.at[0] - t.w / 2).toBeGreaterThanOrEqual(plan.box.x0 - 1e-6);
      expect(t.at[0] + t.w / 2).toBeLessThanOrEqual(plan.box.x1 + 1e-6);
      // No point of the lap or the pit lane in its rectangle.
      const road = [...plan.lap, ...plan.pitLane];
      expect(road.some((p) => Math.abs(p[0] - t.at[0]) < t.w / 2 && Math.abs(p[1] - t.at[1]) < t.h / 2)).toBe(false);
    }
  });

  it("is in the plan's drawing, under the cars, and can be left out", () => {
    const svg = drawRace({ circuit: "las-vegas", laps: 6, cars: 10, seed: 5, t: 300 });
    expect(svg.match(/class="ky-ci-tower"/g)).toHaveLength(1);
    expect(svg.indexOf('class="ky-ci-tower"')).toBeLessThan(svg.indexOf('class="ky-ci-cars"'));
    expect(drawRace({ circuit: "las-vegas", laps: 6, cars: 10, seed: 5, t: 300, tower: false })).not.toContain("ky-ci-tower");
  });
});

describe("the podium", () => {
  it("shows exactly the finishing order at the end of the race: the first three with their names, teams, time and gaps, and the fastest lap", () => {
    const end = raceAt(race, race.duration);
    const podium = podiumData(race, end, "en");
    const order = [...race.cars.keys()].filter((c) => race.finish[c] !== undefined).sort((a, b) => race.finish[a]! - race.finish[b]!);
    expect(podium.lines.map((l) => l.id)).toEqual(order.slice(0, 3).map((c) => race.cars[c].id));
    expect(podium.lines.map((l) => l.id)).toEqual(end.standings.slice(0, 3).map((l) => l.car.id));
    expect(podium.final).toBe(true);
    const winner = race.finish[order[0]]!;
    expect(podium.lines[0].time).toBe(raceTimeText(winner));
    expect(podium.lines[1].time).toBe(gapText(race.finish[order[1]]! - winner, 0, "en"));
    expect(podium.lines[0].name).toBe(race.cars[order[0]].driver.name.en);
    expect(podium.lines[0].team).toBe(race.cars[order[0]].team.name.en);
    const f = end.fastest!;
    expect(podium.fastest).toBe(`Fastest lap: ${race.cars[f.index].driver.code} ${race.cars[f.index].driver.name.en}, ${lapTime(f.time)}, lap ${f.lap}`);
    expect(podiumData(race, end, "ja").lines[0].name).toBe(race.cars[order[0]].driver.name.ja);
  });

  it("at the flag has the winner's time and the others still racing, until each takes it", () => {
    const at = podiumData(race, raceAt(race, race.flag), "en");
    expect(at.lines[0].finished).toBe(true);
    expect(at.final).toBe(false);
    expect(at.lines.slice(1).some((l) => !l.finished)).toBe(true);
    for (const l of at.lines.filter((x) => !x.finished)) expect(l.time).toBe(RACE_WORDS.en.podium.pending);
  });

  it("writes a race time with hours, minutes, seconds and thousandths", () => {
    expect(raceTimeText(4938.207)).toBe("1:22:18.207");
    expect(raceTimeText(738.5)).toBe("12:18.500");
    expect(raceTimeText(0)).toBe("0:00.000");
  });
});
