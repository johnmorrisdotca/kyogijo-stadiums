// The demo's country flags: Hata's (https://github.com/johnmorrisdotca/hata), plugged into the package with `useFlags`, which is all a page needs to do. Hata's `flag()` is asynchronous and a
// drawing is a pure function of its options, so the flags are loaded first: the build (scripts/site.mjs) awaits `flag(code, { shape })` for each code of nations.js, in each of the three shapes, and
// writes them into flags.data.js; the renderer below is a synchronous lookup over them. This module is the one place that plugs it in, for the page's script and for the build, which runs the same
// code to write the first view into the HTML.
import { useFlags } from "./dist/index.js";
import { FLAGS } from "./flags.data.js";

/** A flag renderer in the shape kyogijo (and Taisen Brackets) takes: a code and `{ shape }` to an SVG string, or nothing for a code that was not loaded. */
export const renderFlag = (code, { shape }) => FLAGS[shape]?.[code.toUpperCase()];

useFlags(renderFlag);
