// A small, exact reader and writer of the SVG this package writes: every tag closed, every attribute double-quoted. The tree keeps the text of every attribute
// and every run of text as it was written, so that writing it again gives back the same string, byte for byte.

/** An element, or a run of text. Attribute values and text are as written (escaped); `attr` and `textOf` read them. */
export interface SvgNode {
  name: string;
  attrs: Record<string, string>;
  children: (SvgNode | string)[];
  /** Written as `<a/>` rather than `<a></a>`. */
  empty: boolean;
}

const TOKEN = /<!--[\s\S]*?-->|<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/y;
const ATTRIBUTE = /([\w:-]+)="([^"]*)"/g;

/** Text with its entities read: the five of XML and numeric ones. */
export function decode(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|apos));/gi, (_, dec: string | undefined, hex: string | undefined, name: string | undefined) => {
    if (dec !== undefined) return String.fromCodePoint(Number(dec));
    if (hex !== undefined) return String.fromCodePoint(parseInt(hex, 16));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[(name as string).toLowerCase()] as string;
  });
}

/** Text made safe for an attribute or a run of text, the way `esc` in format.ts does it. */
export const encode = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Read an SVG string into a tree. Anything that is not the markup this package writes (an unclosed tag, an unquoted attribute) is an error that says where.
 * @example
 * ```ts
 * import { parseSvg } from "@johnmorrisdotca/kyogijo-stadiums/scene";
 * const tree = parseSvg('<svg viewBox="0 0 10 5"><rect x="1" y="1" width="3" height="2"/></svg>');
 * console.log(tree.name, tree.attrs.viewBox, tree.children.length);
 * // svg 0 0 10 5 1
 * ```
 */
export function parseSvg(text: string): SvgNode {
  const root: SvgNode = { name: "#root", attrs: {}, children: [], empty: false };
  const stack: SvgNode[] = [root];
  let at = 0;
  while (at < text.length) {
    TOKEN.lastIndex = at;
    const match = TOKEN.exec(text);
    if (match === null) throw new Error(`The SVG is not well-formed near: ${text.slice(at, at + 60)}`);
    at = TOKEN.lastIndex;
    if (match[0].startsWith("<!--")) continue;
    const top = stack[stack.length - 1];
    if (match[5] !== undefined) {
      top.children.push(match[5]);
      continue;
    }
    if (match[1] === "/") {
      if (top.name !== match[2]) throw new Error(`</${match[2]}> closes <${top.name}>`);
      stack.pop();
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of match[3].matchAll(ATTRIBUTE)) attrs[a[1]] = a[2];
    const node: SvgNode = { name: match[2], attrs, children: [], empty: match[4] === "/" };
    top.children.push(node);
    if (!node.empty) stack.push(node);
  }
  if (stack.length !== 1) throw new Error(`<${stack[stack.length - 1].name}> is not closed`);
  const elements = root.children.filter((child): child is SvgNode => typeof child !== "string");
  if (elements.length !== 1) throw new Error("One root element is expected");
  return elements[0];
}

/** An SVG tree as text: the string `parseSvg` was given, exactly. */
export function writeSvg(node: SvgNode): string {
  let out = `<${node.name}`;
  for (const [key, value] of Object.entries(node.attrs)) out += ` ${key}="${value}"`;
  if (node.empty) return `${out}/>`;
  return `${out}>${node.children.map((child) => (typeof child === "string" ? child : writeSvg(child))).join("")}</${node.name}>`;
}

/** The value of an attribute with its entities read. */
export const attr = (node: SvgNode, name: string): string | undefined => (node.attrs[name] === undefined ? undefined : decode(node.attrs[name]));

/** The text inside an element and its elements, with its entities read. */
export const textOf = (node: SvgNode): string => node.children.map((child) => (typeof child === "string" ? decode(child) : textOf(child))).join("");

/** The elements inside an element, in order. */
export const elements = (node: SvgNode): SvgNode[] => node.children.filter((child): child is SvgNode => typeof child !== "string");
