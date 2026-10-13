// The part of CSS the drawing's stylesheet uses, enough to work out what a browser would paint: rules with class, attribute, tag and `:where()` / `:not()`
// selectors, descendant and child combinators, light and dark by `prefers-color-scheme` and `data-theme`, custom properties with `var()` and a fallback,
// `calc()` of a product, and the inheritance of the properties that inherit. Not a general CSS engine.

/** An element as the selectors see it. */
export interface CssNode {
  name: string;
  attrs: Readonly<Record<string, string>>;
  parent?: CssNode;
}

interface Simple {
  tag?: string;
  classes: string[];
  attrs: { name: string; value?: string }[];
  where: Complex[][];
  not: Complex[][];
}
/** Compounds from the leftmost to the rightmost, with the combinator that joins each to the one before. */
type Complex = { combinator: " " | ">" | ""; simple: Simple }[];

interface Rule {
  selector: Complex;
  specificity: number;
  order: number;
  declarations: [string, string][];
}

const IDENT = /[\w-]+/y;

function closing(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")" && --depth === 0) return i;
  }
  return text.length;
}

/** Split at commas that are not inside brackets or parentheses. */
function splitTop(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === "(" || c === "[") depth += 1;
    else if (c === ")" || c === "]") depth -= 1;
    else if (c === "," && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part !== "");
}

function parseComplex(text: string): Complex {
  const out: Complex = [];
  let i = 0;
  let combinator: " " | ">" | "" = "";
  while (i < text.length) {
    const c = text[i];
    if (c === " " || c === "\n" || c === "\t") {
      i += 1;
      if (out.length > 0 && combinator === "") combinator = " ";
      continue;
    }
    if (c === ">") {
      combinator = ">";
      i += 1;
      continue;
    }
    const simple: Simple = { classes: [], attrs: [], where: [], not: [] };
    let any = false;
    while (i < text.length && !/[\s>]/.test(text[i])) {
      const d = text[i];
      if (d === "*") i += 1;
      else if (d === ".") {
        IDENT.lastIndex = i + 1;
        const m = IDENT.exec(text) as RegExpExecArray;
        simple.classes.push(m[0]);
        i = IDENT.lastIndex;
      } else if (d === "[") {
        const end = text.indexOf("]", i);
        const body = text.slice(i + 1, end);
        const eq = body.indexOf("=");
        simple.attrs.push(eq < 0 ? { name: body.trim() } : { name: body.slice(0, eq).trim(), value: body.slice(eq + 1).trim().replace(/^["']|["']$/g, "") });
        i = end + 1;
      } else if (d === ":") {
        IDENT.lastIndex = i + 1;
        const m = IDENT.exec(text) as RegExpExecArray;
        i = IDENT.lastIndex;
        if (text[i] !== "(") throw new Error(`Unsupported pseudo-class :${m[0]}`);
        const end = closing(text, i);
        const inner = splitTop(text.slice(i + 1, end)).map(parseComplex);
        if (m[0] === "where") simple.where.push(inner);
        else if (m[0] === "not") simple.not.push(inner);
        else throw new Error(`Unsupported pseudo-class :${m[0]}()`);
        i = end + 1;
      } else {
        IDENT.lastIndex = i;
        const m = IDENT.exec(text);
        if (m === null) throw new Error(`Unsupported selector: ${text}`);
        simple.tag = m[0];
        i = IDENT.lastIndex;
      }
      any = true;
    }
    if (any) {
      out.push({ combinator: out.length === 0 ? "" : combinator === "" ? " " : combinator, simple });
      combinator = "";
    }
  }
  return out;
}

function simpleMatches(s: Simple, node: CssNode): boolean {
  if (s.tag !== undefined && s.tag !== node.name) return false;
  if (s.classes.length > 0) {
    const have = (node.attrs.class ?? "").split(/\s+/);
    if (!s.classes.every((c) => have.includes(c))) return false;
  }
  for (const a of s.attrs) {
    const v = node.attrs[a.name];
    if (v === undefined || (a.value !== undefined && v !== a.value)) return false;
  }
  for (const list of s.where) if (!list.some((c) => complexMatches(c, c.length - 1, node))) return false;
  for (const list of s.not) if (list.some((c) => complexMatches(c, c.length - 1, node))) return false;
  return true;
}

function complexMatches(selector: Complex, at: number, node: CssNode): boolean {
  if (!simpleMatches(selector[at].simple, node)) return false;
  if (at === 0) return true;
  const { combinator } = selector[at];
  if (combinator === ">") return node.parent !== undefined && complexMatches(selector, at - 1, node.parent);
  for (let up = node.parent; up !== undefined; up = up.parent) if (complexMatches(selector, at - 1, up)) return true;
  return false;
}

/** The weight of a selector as a single number: ids are not used here, so classes and attributes count a thousand each and tags one. `:where()` has none. */
function weight(selector: Complex): number {
  let w = 0;
  const add = (s: Simple): void => {
    w += s.classes.length * 1000 + s.attrs.length * 1000 + (s.tag === undefined ? 0 : 1);
    for (const list of s.not) w += Math.max(0, ...list.map(weight));
  };
  for (const c of selector) add(c.simple);
  return w;
}

/** A stylesheet's rules for one theme: those under `prefers-color-scheme` are in when the theme is that one, and the other media are out. */
export interface Stylesheet {
  rules: Rule[];
}

function declarationsOf(body: string): [string, string][] {
  const out: [string, string][] = [];
  for (const part of body.split(";")) {
    const colon = part.indexOf(":");
    if (colon < 0) continue;
    const name = part.slice(0, colon).trim();
    const value = part.slice(colon + 1).trim();
    if (name !== "" && value !== "") out.push([name, value]);
  }
  return out;
}

/** Read a stylesheet. `theme` decides which `@media (prefers-color-scheme:…)` blocks count. */
export function parseStylesheet(css: string, theme: "light" | "dark", into: Stylesheet = { rules: [] }): Stylesheet {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const read = (from: number, to: number, active: boolean): void => {
    let i = from;
    while (i < to) {
      const open = text.indexOf("{", i);
      if (open < 0 || open >= to) break;
      const prelude = text.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < to && depth > 0) {
        if (text[j] === "{") depth += 1;
        else if (text[j] === "}") depth -= 1;
        j += 1;
      }
      const end = j - 1;
      if (prelude.startsWith("@")) {
        const scheme = /prefers-color-scheme\s*:\s*(light|dark)/.exec(prelude);
        if (prelude.startsWith("@media") && scheme !== null) read(open + 1, end, active && scheme[1] === theme);
        // Any other at-rule (another media query, keyframes) is not a rule of this drawing's paint.
      } else if (active) {
        const declarations = declarationsOf(text.slice(open + 1, end));
        for (const s of splitTop(prelude)) {
          try {
            const selector = parseComplex(s);
            if (selector.length > 0) into.rules.push({ selector, specificity: weight(selector), order: into.rules.length, declarations });
          } catch {
            // A selector this reader does not know matches nothing, as in a browser that does not know it.
          }
        }
      }
      i = j;
    }
  };
  read(0, text.length, true);
  return into;
}

/** The declarations that apply to an element, lowest priority first (by weight, then by order). */
export function matched(sheet: Stylesheet, node: CssNode): [string, string][] {
  const hits = sheet.rules.filter((rule) => complexMatches(rule.selector, rule.selector.length - 1, node));
  hits.sort((a, b) => a.specificity - b.specificity || a.order - b.order);
  return hits.flatMap((rule) => rule.declarations);
}

/** The declarations of a `style` attribute. */
export const inlineStyle = (text: string | undefined): [string, string][] => (text === undefined ? [] : declarationsOf(text));

/** Replace every `var(--name, fallback)` in a value. A name with no value and no fallback makes the whole value `undefined` (the property is not set). */
export function substitute(value: string, vars: Readonly<Record<string, string>>, depth = 0): string | undefined {
  if (depth > 12) return undefined;
  let out = "";
  let i = 0;
  while (i < value.length) {
    const at = value.indexOf("var(", i);
    if (at < 0) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, at);
    const end = closing(value, at + 3);
    const inside = value.slice(at + 4, end);
    const comma = inside.indexOf(",");
    const name = (comma < 0 ? inside : inside.slice(0, comma)).trim();
    const fallback = comma < 0 ? undefined : inside.slice(comma + 1).trim();
    const own = vars[name];
    const resolved = own !== undefined ? substitute(own, vars, depth + 1) : fallback !== undefined ? substitute(fallback, vars, depth + 1) : undefined;
    if (resolved === undefined) return undefined;
    out += resolved;
    i = end + 1;
  }
  return out;
}

/** A value with its lengths worked out: `px` dropped, `em` multiplied by the font size, and every `calc()` replaced by its number. */
export function evaluate(value: string, fontSize: number): string {
  let text = value.trim().replace(/(-?\d*\.?\d+)em\b/g, (_, n: string) => String(Number(n) * fontSize)).replace(/(-?\d*\.?\d+)px\b/g, "$1");
  let guard = 0;
  while (/calc\(/.test(text) && guard++ < 8) text = text.replace(/calc\(([^()]*)\)/g, (_, expression: string) => String(calc(expression)));
  return text;
}

/** A length or a number as a number of user units: `3`, `3px`, `.14em` (of the font size), and `calc()` of a product, sum or difference of those. */
export function lengthOf(value: string | undefined, fontSize: number): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const n = Number(evaluate(value, fontSize));
  return Number.isFinite(n) ? n : undefined;
}

/** `a*b`, `a/b`, `a+b`, `a-b` of numbers, left to right with products first. */
function calc(expression: string): number {
  const tokens = expression.replace(/\s+/g, "").match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?|[*/+-]/gi) ?? [];
  const terms: number[] = [];
  const signs: number[] = [];
  let current = NaN;
  let op = "";
  let sign = 1;
  const push = (): void => {
    terms.push(current);
    signs.push(sign);
  };
  for (const t of tokens) {
    if (t === "*" || t === "/") op = t;
    else if ((t === "+" || t === "-") && !Number.isNaN(current)) {
      push();
      sign = t === "-" ? -1 : 1;
      current = NaN;
    } else {
      const n = Number(t);
      if (Number.isNaN(current)) current = n;
      else if (op === "*") current *= n;
      else if (op === "/") current /= n;
      else {
        push();
        sign = 1;
        current = n;
      }
      op = "";
    }
  }
  if (!Number.isNaN(current)) push();
  return terms.reduce((sum, term, i) => sum + signs[i] * term, 0);
}
