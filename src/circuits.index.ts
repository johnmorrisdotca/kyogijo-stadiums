// The circuits by key and name, without their data: what a page lists to choose from before it reads any circuit (the district's page lists them beside the venues), and `loadCircuits`, which reads them all for a lean district.
// A test holds this list to `CIRCUITS`.

/** Every circuit's key and its names in English and Japanese (Wikidata's labels), in the order of `CIRCUITS`. */
export const CIRCUIT_INDEX: Readonly<Record<string, { en: string; ja: string }>> = Object.freeze({
  "las-vegas": { en: "Las Vegas Strip Circuit", ja: "ラスベガス・ストリップ・サーキット" },
});

let loading: Promise<void> | undefined;

/**
 * Read the circuits for the lean district (`district-lean`), which carries none until it is asked: after this a district's `circuit` option can name any of them. The `district` entry has them already. Asking again gives the same promise.
 * @example
 * ```ts no-run
 * import { loadCircuits, planDistrict } from "@johnmorrisdotca/kyogijo-stadiums/district-lean";
 * await loadCircuits();
 * planDistrict({ venues: [], circuit: "las-vegas" });
 * ```
 */
export function loadCircuits(): Promise<void> {
  if (loading === undefined) {
    const read = async (): Promise<void> => {
      await import("./circuits.held.ts");
    };
    loading = read().catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
  }
  return loading;
}
