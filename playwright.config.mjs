// The demo's own tests: a real browser, real taps. `pnpm test:demo` builds the demo and runs them.
import { defineConfig, devices } from "@playwright/test";

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.demo.mjs",
  // Two tests draw every sport in turn (31 and counting): in WebKit on a slow runner that took 31 seconds against the default 30.
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: true,
  reporter: "list",
  use: { reducedMotion: "reduce", locale: "en-US" },
  projects: [
    { name: "chromium-phone", use: { ...devices["Desktop Chrome"], ...phone } },
    { name: "chromium-desk", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    // WebKit on a desktop viewport with touch: `isMobile` is Chromium's to honour.
    { name: "webkit-phone", use: { ...devices["Desktop Safari"], viewport: phone.viewport, hasTouch: true } },
  ],
});
