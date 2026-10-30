// The demo's own tests: a real browser, real taps. `pnpm test:demo` builds the demo and runs them.
import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

export default defineConfig({
  testDir: "e2e",
  // The demo's own tests run in the three projects below; the speed checks per device class (`*.device.mjs`) in the three `device-` ones, each in a job of its own.
  testMatch: "*.demo.mjs",
  // Two tests draw every sport in turn (31 and counting): in WebKit on a slow runner that took 31 seconds against the default 30.
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: true,
  // On the runner a test that fails is played once more, and the report says "flaky" for one that passed the second time: a slow machine does not cost an hour, and the flake is still seen.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { reducedMotion: "reduce", locale: "en-US" },
  projects: [
    { name: "chromium-phone", use: { ...devices["Desktop Chrome"], ...phone } },
    { name: "chromium-desk", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    // WebKit on a desktop viewport with touch: `isMobile` is Chromium's to honour.
    { name: "webkit-phone", use: { ...devices["Desktop Safari"], viewport: phone.viewport, hasTouch: true } },
    // The speed checks per device class (e2e/budgets.device.mjs): what each class is held at (`tier`) and how far its CPU is slowed (`cpu`, Chromium only). A desk; a mid phone (WebKit, an iPhone's size and pixel ratio of 3); a slow Android (Chromium
    // with the CPU slowed 6 times, a ratio of 2.6).
    { name: "device-desk", testMatch: "*.device.mjs", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, reducedMotion: "no-preference" }, metadata: { tier: "high", cpu: 1 } },
    { name: "device-mid-phone", testMatch: "*.device.mjs", use: { ...devices["Desktop Safari"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, reducedMotion: "no-preference" }, metadata: { tier: "medium", cpu: 1 } },
    { name: "device-slow-android", testMatch: "*.device.mjs", use: { ...devices["Desktop Chrome"], viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true, reducedMotion: "no-preference" }, metadata: { tier: "low", cpu: 6 } },
  ],
});
