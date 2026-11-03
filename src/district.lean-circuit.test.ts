// The lean district carries no circuit until it is asked: `loadCircuits` reads them, and then a district's `circuit` draws as the district entry draws it. The list of circuits by name is there without their data.
import { describe, expect, it } from "vitest";
import { CIRCUIT_INDEX, circuitsHeld, loadCircuits, planDistrict } from "./district-lean-entry.ts";
import { CIRCUITS } from "./circuits.ts";

describe("the lean district and the circuits", () => {
  it("lists every circuit by its names, as the circuits' data names them", () => {
    expect(Object.keys(CIRCUIT_INDEX)).toEqual(CIRCUITS.map((c) => c.id));
    for (const c of CIRCUITS) expect(CIRCUIT_INDEX[c.id]).toEqual(c.names);
  });

  it("refuses a circuit before they are read, saying how to read them, and lays one after", async () => {
    expect(circuitsHeld()).toBe(false);
    expect(() => planDistrict({ venues: [], circuit: "las-vegas" })).toThrow(/loadCircuits/);
    const first = loadCircuits();
    expect(loadCircuits()).toBe(first);
    await first;
    expect(circuitsHeld()).toBe(true);
    expect(planDistrict({ venues: [], circuit: "las-vegas" }).circuit?.plan.circuit.id).toBe("las-vegas");
  });
});
