// The drawing corpus (every sport, light and dark, wide and tall) grows with each sport, and a few tests walk all of it: a test that takes 2 seconds alone takes more when the
// files run side by side, so the limit is 30 seconds and not vitest's 5.
import { URL, fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The demo's own modules import the built package from `demo/dist/` (the site copies it there), but the tests run before the
// build, on a clean checkout in CI. So in a test, a demo module's `./dist/<entry>.js` is the package's source `src/<entry>.ts`,
// whether or not a build happens to be lying around (a vi.mock of the missing file only worked when one was).
const demoDist = {
  name: "demo-dist-is-source",
  enforce: "pre",
  resolveId(id, importer) {
    const entry = /^\.\/dist\/([\w.-]+)\.js$/.exec(id);
    if (!entry || !importer || !/[\\/]demo[\\/][^\\/]+\.js$/.test(importer)) return null;
    return fileURLToPath(new URL(`./src/${entry[1]}.ts`, import.meta.url));
  },
};

export default defineConfig({ plugins: [demoDist], test: { testTimeout: 30_000, setupFiles: ["./src/all-venues.fixture.ts"] } });
