// The drawing corpus (every sport, light and dark, wide and tall) grows with each sport, and a few tests walk all of it: a test that takes 2 seconds alone takes more when the
// files run side by side, so the limit is 30 seconds and not vitest's 5.
import { defineConfig } from "vitest/config";

export default defineConfig({ test: { testTimeout: 30_000, setupFiles: ["./src/all-venues.fixture.ts"] } });
