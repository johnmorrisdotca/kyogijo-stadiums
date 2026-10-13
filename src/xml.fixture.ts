/** A strict little reader of the SVG the package writes: every tag closed, every attribute quoted, every `&` an entity. For tests. */
export interface Node {
  name: string;
  attrs: Record<string, string>;
  children: Node[];
  text: string;
}

export function parseXml(text: string): Node {
  const root: Node = { name: "#root", attrs: {}, children: [], text: "" };
  const stack: Node[] = [root];
  const token = /<!--[\s\S]*?-->|<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/gy;
  let at = 0;
  let match: RegExpExecArray | null;
  while (at < text.length) {
    token.lastIndex = at;
    match = token.exec(text);
    if (match === null) throw new Error(`not well-formed near: ${text.slice(at, at + 60)}`);
    at = token.lastIndex;
    if (match[0].startsWith("<!--")) continue;
    const top = stack[stack.length - 1];
    if (match[5] !== undefined) {
      if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(match[5]) && top.name !== "style") throw new Error(`a bare & in: ${match[5].slice(0, 60)}`);
      top.text += match[5];
      continue;
    }
    if (match[1] === "/") {
      if (top.name !== match[2]) throw new Error(`</${match[2]}> closes <${top.name}>`);
      stack.pop();
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of match[3].matchAll(/([\w:-]+)="([^"]*)"/g)) {
      if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(a[2])) throw new Error(`a bare & in attribute ${a[1]}`);
      if (a[1] in attrs) throw new Error(`attribute ${a[1]} twice`);
      attrs[a[1]] = a[2];
    }
    const node: Node = { name: match[2], attrs, children: [], text: "" };
    top.children.push(node);
    if (match[4] !== "/") stack.push(node);
  }
  if (stack.length !== 1) throw new Error(`<${stack[stack.length - 1].name}> is not closed`);
  if (root.children.length !== 1) throw new Error("one root element expected");
  return root.children[0];
}

/** Every node, depth first. */
export function walk(node: Node): Node[] {
  return [node, ...node.children.flatMap(walk)];
}

/** The nodes with a class. */
export function withClass(node: Node, cls: string): Node[] {
  return walk(node).filter((n) => (n.attrs.class ?? "").split(/\s+/).includes(cls));
}
