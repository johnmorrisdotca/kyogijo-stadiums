import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** The demo job of CI runs in Playwright's own image so that the browsers are not installed on every shard: the image's tag is the version of the test runner the lockfile has. */
describe("ci.yml's demo job", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const demo = ci.slice(ci.indexOf("\n  demo:\n"), ci.indexOf("\n  package:\n"));

  it("runs in the Playwright image of the version that is installed, with the shared memory the browsers need", () => {
    const tag = /image: mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-noble/.exec(demo)?.[1];
    const installed = JSON.parse(readFileSync("node_modules/@playwright/test/package.json", "utf8")).version;
    expect(tag, "the demo job names Playwright's image").toBeDefined();
    expect(tag).toBe(installed);
    expect(readFileSync("pnpm-lock.yaml", "utf8")).toContain(`'@playwright/test@${tag}'`);
    expect(demo).toContain("options: --ipc=host --init");
  });

  it("installs no browser and no package of the system, and plays each project's tests in jobs of its own, WebKit's (the slow one) in four, and the speed checks per device class in one short job each", () => {
    expect(demo).not.toContain("playwright install");
    expect(demo).not.toContain("apt");
    const jobs = [...demo.matchAll(/- \{ project: ([\w-]+), shard: (\d+)\/(\d+) \}/g)].map((m) => `${m[1]} ${m[2]}/${m[3]}`);
    expect(jobs).toEqual(["chromium-phone 1/1", "chromium-desk 1/1", "webkit-phone 1/4", "webkit-phone 2/4", "webkit-phone 3/4", "webkit-phone 4/4", "device-desk 1/1", "device-mid-phone 1/1", "device-slow-android 1/1"]);
    expect(demo).toContain("--project=${{ matrix.project }} --shard=${{ matrix.shard }}");
    // Every project of the config is played in some job.
    const config = readFileSync("playwright.config.mjs", "utf8");
    for (const project of [...config.matchAll(/name: "([\w-]+)"/g)].map((m) => m[1])) expect(jobs.some((j) => j.startsWith(`${project} `)), project).toBe(true);
  });

  it("is retried once on the runner only, and says so in its report", () => {
    const config = readFileSync("playwright.config.mjs", "utf8");
    expect(config).toContain("retries: process.env.CI ? 1 : 0");
    expect(config).toContain('reporter: process.env.CI ? [["list"], ["github"]] : "list"');
  });
});
