// Keeps a drawing's title from popping up over the drawing. A `<title>` that is a direct child of the root `<svg>` is the browser's tooltip for the whole drawing, so wherever the pointer rests on a mat or a court a
// box with the drawing's words ("Mexico 11, USA 10, Final") appears on top of it, which reads as a label stuck on the surface. The title stays: it is what names the drawing for a screen reader
// (`aria-labelledby` points at it), so it is moved into a `<defs>`, where no tooltip is made (the `<desc>` is no tooltip and stays where it is). The drawing's own markup is not changed, only what the demo's page does with it.
const NS = "http://www.w3.org/2000/svg";

/** Move a drawing's title into a `<defs>` (once); a drawing without one, or already quiet, is left alone. */
export function quiet(svg) {
  const title = svg.querySelector(":scope > title");
  if (title === null) return svg;
  const defs = svg.ownerDocument.createElementNS(NS, "defs");
  defs.setAttribute("data-meta", "");
  defs.append(title);
  svg.prepend(defs);
  return svg;
}

/** Quiet every drawing in the page now and every one that is added later (a re-draw, a tab, a card that scrolls into view). */
export function quietTitles(root = document.body) {
  const all = (node) => (node.nodeType === 1 ? [...(node.matches("svg.kyogijo") ? [node] : []), ...node.querySelectorAll("svg.kyogijo")] : []);
  for (const svg of all(root)) quiet(svg);
  new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) for (const svg of all(node)) quiet(svg);
  }).observe(root, { childList: true, subtree: true });
}
