import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "site/", "node_modules/", "test-results/", "playwright-report/"] },
  { ignores: [".readme-examples/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["e2e/**/*.mjs", "playwright.config.mjs"], languageOptions: { globals: { console: "readonly", PerformanceObserver: "readonly", URL: "readonly", Blob: "readonly", Buffer: "readonly", navigator: "readonly", document: "readonly", window: "readonly", location: "readonly", customElements: "readonly", getComputedStyle: "readonly", Image: "readonly", localStorage: "readonly", scrollX: "readonly", scrollY: "readonly", Event: "readonly", MutationObserver: "readonly", KeyboardEvent: "readonly", setTimeout: "readonly", requestAnimationFrame: "readonly", DOMMatrix: "readonly", DOMPoint: "readonly", fetch: "readonly", createImageBitmap: "readonly", OffscreenCanvas: "readonly", CanvasRenderingContext2D: "readonly" } } },
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: { console: "readonly", URL: "readonly", URLSearchParams: "readonly", document: "readonly", fetch: "readonly" } } },
  { files: ["scripts/readme-pictures.mjs", "scripts/readme-pictures-lib.mjs"], languageOptions: { globals: { window: "readonly", localStorage: "readonly", requestAnimationFrame: "readonly" } } },
  { files: ["scripts/docs-site/*.js"], languageOptions: { globals: { document: "readonly", window: "readonly", location: "readonly", navigator: "readonly", URLSearchParams: "readonly", IntersectionObserver: "readonly", Event: "readonly", setTimeout: "readonly" } } },
  { files: ["demo/**/*.js"], languageOptions: { globals: { document: "readonly", window: "readonly", location: "readonly", history: "readonly", navigator: "readonly", URLSearchParams: "readonly", Intl: "readonly", setInterval: "readonly", setTimeout: "readonly", localStorage: "readonly", familyLanguage: "readonly", CustomEvent: "readonly", matchMedia: "readonly", Blob: "readonly", URL: "readonly", Image: "readonly", clearInterval: "readonly", IntersectionObserver: "readonly", requestAnimationFrame: "readonly", addEventListener: "readonly", console: "readonly", MutationObserver: "readonly", ResizeObserver: "readonly", Option: "readonly", CSS: "readonly", HTMLButtonElement: "readonly", HTMLInputElement: "readonly", Element: "readonly", getComputedStyle: "readonly", cancelAnimationFrame: "readonly" } } },
);
