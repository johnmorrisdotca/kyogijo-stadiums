import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** docs/architecture.md's tree names every source file, and nothing that is not one, so it cannot fall behind the code. */
describe("the docs' Architecture", () => {
  const page = readFileSync("docs/architecture.md", "utf8");
  const section = page.slice(page.indexOf("# Architecture"));
  const tree = section.slice(section.indexOf("```text"), section.indexOf("```", section.indexOf("```text") + 7));
  const files = (folder) => readdirSync(folder, { recursive: true }).map((path) => path.replace(/\\/g, "/"));

  it("names exactly the files under src/", () => {
    const named = [...tree.matchAll(/[├└]── ([\w.-]+\.ts)\b/g)].map((match) => match[1]).sort();
    const listed = files("src")
      // The files of arenas/, parks/, grounds/ and walk/ are one record each, made by the generators.
      .filter((path) => path.endsWith(".ts") && !/\.(test|fixture)\./.test(path) && !/^(arenas|parks|grounds|walk)\//.test(path))
      .map((path) => path.split("/").at(-1))
      .sort();
    expect(named).toEqual(listed);
  });
});
