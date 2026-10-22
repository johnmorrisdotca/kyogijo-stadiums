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

  it("installs no browser and no package of the system, and plays a quarter of the tests in each of four shards", () => {
    expect(demo).not.toContain("playwright install");
    expect(demo).not.toContain("apt");
    expect(demo).toContain("shard: [1, 2, 3, 4]");
    expect(demo).toContain("--shard=${{ matrix.shard }}/4");
  });

  it("is retried once on the runner only, and says so in its report", () => {
    const config = readFileSync("playwright.config.mjs", "utf8");
    expect(config).toContain("retries: process.env.CI ? 1 : 0");
    expect(config).toContain('reporter: process.env.CI ? [["list"], ["github"]] : "list"');
  });
});
