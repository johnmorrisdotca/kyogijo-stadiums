import { describe, expect, it } from "vitest";
import { inkOn, rgbOf, safeColour, safeLogo } from "./colour.ts";

describe("colours", () => {
  it("accept hex colours, functions, names and variables", () => {
    for (const ok of ["#fff", "#1f5fa8", "#1f5fa8cc", "rgb(10, 20, 30)", "rgba(10 20 30 / 50%)", "hsl(210 50% 40%)", "crimson", "var(--team)"]) expect(safeColour(ok), ok).toBe(ok);
  });

  it("refuse anything that could end a style attribute or add a rule", () => {
    for (const bad of ["red;fill:url(javascript:1)", "#fff}", "expression(alert(1))", "url(x)", "red\"onload=\"x", "var(--a, red)", "", "x".repeat(80), 5, null, undefined]) expect(safeColour(bad), String(bad)).toBeUndefined();
  });

  it("choose white or near-black ink by lightness", () => {
    expect(inkOn("#1f5fa8")).toBe("#ffffff");
    expect(inkOn("#ffd23f")).toBe("#161a18");
    expect(inkOn("var(--x)")).toBe("#ffffff");
    expect(rgbOf("#abc")).toEqual([170, 187, 204]);
  });
});

describe("logos", () => {
  it("accept https and http addresses, relative paths and image data", () => {
    for (const ok of ["https://example.com/a.svg", "http://example.com/a.png", "/logos/a.svg", "logos/a.svg", "a.svg", "data:image/png;base64,AAAA"]) expect(safeLogo(ok), ok).toBe(ok);
  });

  it("make an SVG document into an image address, which cannot run scripts", () => {
    const logo = safeLogo('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(logo?.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(logo).not.toContain("<");
  });

  it("refuse other schemes, other data, protocol-relative addresses and markup", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "//evil.example/a.png", "file:///etc/passwd", "a\"onerror=\"x", "<img src=x>", "", 4]) expect(safeLogo(bad), String(bad)).toBeUndefined();
  });
});
