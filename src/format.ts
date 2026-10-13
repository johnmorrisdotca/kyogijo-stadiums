/** A number written for an attribute: two decimals at most, no trailing zeros, never "-0". */
export function num(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) || rounded === 0 ? "0" : String(rounded);
}

/** Text made safe to write between tags and inside a double-quoted attribute. */
export function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** An attribute value: a number, text, or nothing at all (the attribute is left out). */
export type Attr = string | number | boolean | undefined | null;

/** One element as text. Attributes with no value are left out; text is escaped, numbers are rounded. */
export function el(name: string, attrs: Record<string, Attr>, inner?: string): string {
  let out = `<${name}`;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    out += value === true ? ` ${key}` : ` ${key}="${typeof value === "number" ? num(value) : esc(value)}"`;
  }
  return inner === undefined ? `${out}/>` : `${out}>${inner}</${name}>`;
}

/** A small, stable hash of text (FNV-1a), written in base 36, for ids that follow from the options. */
export function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, "0");
}
