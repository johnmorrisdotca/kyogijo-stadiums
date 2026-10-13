// The address of an embedded frame, and the options it draws: the same file builds the address in the demo's snippet and reads it in embed.html.
const hex = (c) => (typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c.slice(1) : undefined);

/** Options to query parameters (a URLSearchParams). Only what differs from the defaults is written. */
export function toParams(o) {
  const q = new URLSearchParams();
  q.set("sport", o.sport);
  if (o.park) q.set("park", o.park);
  if (Number.isInteger(o.year)) q.set("year", String(o.year));
  if (o.size && o.size !== "full") q.set("size", o.size);
  if (o.orientation && o.orientation !== "auto") q.set("orientation", o.orientation);
  if (o.theme && o.theme !== "auto") q.set("theme", o.theme);
  if (o.language && o.language !== "en") q.set("lang", o.language);
  for (const [role, short] of [["away", "a"], ["home", "h"]]) {
    const t = o[role];
    if (!t) continue;
    q.set(role, t.name);
    if (t.abbr) q.set(`${short}abbr`, t.abbr);
    if (t.score !== undefined) q.set(`${short}score`, String(t.score));
    if (hex(t.color)) q.set(`${short}color`, hex(t.color));
    if (typeof t.logo === "string" && /^https?:\/\//.test(t.logo)) q.set(`${short}logo`, t.logo);
  }
  for (const [key, param] of [["status", "status"], ["competition", "competition"], ["date", "date"], ["label", "label"], ["winner", "winner"]]) if (o[key]) q.set(param, o[key]);
  return q;
}

/** Query parameters to options. Nothing is trusted: the package's drawing sanitises each value. */
export function fromParams(q) {
  const o = { sport: q.get("sport") || "nhl", orientation: q.get("orientation") || "auto" };
  for (const [param, key] of [["park", "park"], ["size", "size"], ["theme", "theme"], ["lang", "language"], ["status", "status"], ["competition", "competition"], ["date", "date"], ["label", "label"], ["winner", "winner"]]) {
    if (q.get(param)) o[key] = q.get(param);
  }
  if (/^\d{4}$/.test(q.get("year") || "")) o.year = Number(q.get("year"));
  for (const [role, short] of [["away", "a"], ["home", "h"]]) {
    if (!q.get(role)) continue;
    const t = { name: q.get(role) };
    if (q.get(`${short}abbr`)) t.abbr = q.get(`${short}abbr`);
    if (q.get(`${short}score`) !== null) t.score = /^-?\d+$/.test(q.get(`${short}score`)) ? Number(q.get(`${short}score`)) : q.get(`${short}score`);
    if (q.get(`${short}color`)) t.color = `#${q.get(`${short}color`)}`;
    if (q.get(`${short}logo`)) t.logo = q.get(`${short}logo`);
    o[role] = t;
  }
  if (!o.home || !o.away) {
    delete o.home;
    delete o.away;
  }
  return o;
}
