// The data files of the parks and the grounds, written the way they are read: a name or an alias on one line, everything else as JSON.stringify lays it out.
const line = (value) => `{ ${Object.entries(value).map(([key, v]) => `${JSON.stringify(key)}: ${JSON.stringify(v)}`).join(", ")} }`;

/** `JSON.stringify(value, null, indent)`, with each entry of an `aliases` or a `names` list on a line of its own. */
export function stringify(value, indent = 1) {
  const stash = [];
  const text = JSON.stringify(
    value,
    (key, v) => {
      if ((key === "aliases" || key === "names") && Array.isArray(v)) return v.map((entry) => `@@${stash.push(line(entry)) - 1}@@`);
      return v;
    },
    indent,
  );
  return text.replace(/"@@(\d+)@@"/g, (_, n) => stash[Number(n)]);
}
