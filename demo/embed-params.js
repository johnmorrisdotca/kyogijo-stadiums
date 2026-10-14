// The address of an embedded frame, and the options it draws: the same file builds the address in the demo's snippet and reads it in embed.html.
const hex = (c) => (typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c.slice(1) : undefined);

/** Options to query parameters (a URLSearchParams). Only what differs from the defaults is written. */
export function toParams(o) {
  const q = new URLSearchParams();
  q.set("sport", o.sport);
  if (o.park) q.set("park", o.park);
  if (o.league) q.set("league", o.league);
  for (const [key, param] of [["pitch", "pitch"], ["ground", "ground"], ["pitchType", "pitchtype"], ["half", "half"], ["goals", "goals"], ["stripePattern", "pattern"]]) if (typeof o[key] === "string") q.set(param, o[key]);
  if (o.cornerFlags === false) q.set("flags", "0");
  // A curling sheet's part: `folded`, or its `top` or `bottom` end.
  if (o.sheet?.show === "folded") q.set("sheet", "folded");
  else if (o.sheet?.show === "half" && (o.sheet.end === "top" || o.sheet.end === "bottom")) q.set("sheet", o.sheet.end);
  // A pool's look and size travel in the address; the lanes of a race are data and do not.
  if (o.pool && typeof o.pool === "object") {
    for (const [key, param] of [["look", "poollook"], ["deck", "pooldeck"], ["course", "poolcourse"]]) if (typeof o.pool[key] === "string") q.set(param, o.pool[key]);
    if (Number.isInteger(o.pool.lanes)) q.set("poollanes", String(o.pool.lanes));
    if (o.pool.section === true) q.set("poolsection", "1");
  }
  // The budo: the look, the contest areas, the Budokan floor, the officials, the tassels of the roof; a dojo's size in jo, look and shrine.
  if (o.budo && typeof o.budo === "object") {
    if (typeof o.budo.look === "string") q.set("budolook", o.budo.look);
    if (Number.isInteger(o.budo.areas)) q.set("budoareas", String(o.budo.areas));
    if (o.budo.hall === "budokan") q.set("budohall", "1");
    if (o.budo.officials === true) q.set("budoofficials", "1");
    if (o.budo.tassels === true) q.set("budotassels", "1");
  }
  if (o.dojo && typeof o.dojo === "object") {
    if (Number.isInteger(o.dojo.jo)) q.set("dojojo", String(o.dojo.jo));
    if (typeof o.dojo.look === "string") q.set("dojolook", o.dojo.look);
    if (o.dojo.shinzen === true) q.set("dojoshinzen", "1");
  }
  if (Number.isInteger(o.year)) q.set("year", String(o.year));
  if (o.size && o.size !== "full") q.set("size", o.size);
  if (o.orientation && o.orientation !== "auto") q.set("orientation", o.orientation);
  if (o.theme && o.theme !== "auto") q.set("theme", o.theme);
  if (o.language && o.language !== "en") q.set("lang", o.language);
  if (o.pageant && (o.pageant.style === "carpet" || o.pageant.style === "stage")) q.set("pageant", o.pageant.style);
  for (const [role, short] of [["away", "a"], ["home", "h"]]) {
    const t = o[role];
    if (!t) continue;
    q.set(role, t.name);
    if (t.abbr) q.set(`${short}abbr`, t.abbr);
    if (t.score !== undefined) q.set(`${short}score`, String(t.score));
    if (hex(t.color)) q.set(`${short}color`, hex(t.color));
    if (t.penalties !== undefined) q.set(`${short}pens`, String(t.penalties));
    if (typeof t.logo === "string" && /^https?:\/\//.test(t.logo)) q.set(`${short}logo`, t.logo);
  }
  for (const [key, param] of [["status", "status"], ["competition", "competition"], ["date", "date"], ["label", "label"], ["winner", "winner"]]) if (o[key]) q.set(param, o[key]);
  return q;
}

/** Query parameters to options. Nothing is trusted: the package's drawing sanitises each value. */
export function fromParams(q) {
  const o = { sport: q.get("sport") || "nhl", orientation: q.get("orientation") || "auto" };
  if (q.get("flags") === "0") o.cornerFlags = false;
  if (q.get("sheet") === "folded") o.sheet = { show: "folded" };
  else if (q.get("sheet") === "top" || q.get("sheet") === "bottom") o.sheet = { show: "half", end: q.get("sheet") };
  for (const [param, key] of [["pitch", "pitch"], ["ground", "ground"], ["pitchtype", "pitchType"], ["half", "half"], ["goals", "goals"], ["pattern", "stripePattern"], ["park", "park"], ["league", "league"], ["size", "size"], ["theme", "theme"], ["lang", "language"], ["status", "status"], ["competition", "competition"], ["date", "date"], ["label", "label"], ["winner", "winner"]]) {
    if (q.get(param)) o[key] = q.get(param);
  }
  const pool = {};
  for (const [param, key] of [["poollook", "look"], ["pooldeck", "deck"], ["poolcourse", "course"]]) if (q.get(param)) pool[key] = q.get(param);
  if (/^\d{1,2}$/.test(q.get("poollanes") || "")) pool.lanes = Number(q.get("poollanes"));
  if (q.get("poolsection") === "1") pool.section = true;
  if (Object.keys(pool).length > 0) o.pool = pool;
  const budo = {};
  if (q.get("budolook")) budo.look = q.get("budolook");
  if (/^\d$/.test(q.get("budoareas") || "")) budo.areas = Number(q.get("budoareas"));
  if (q.get("budohall") === "1") budo.hall = "budokan";
  if (q.get("budoofficials") === "1") budo.officials = true;
  if (q.get("budotassels") === "1") budo.tassels = true;
  if (Object.keys(budo).length > 0) o.budo = budo;
  const dojo = {};
  if (/^\d{1,3}$/.test(q.get("dojojo") || "")) dojo.jo = Number(q.get("dojojo"));
  if (q.get("dojolook")) dojo.look = q.get("dojolook");
  if (q.get("dojoshinzen") === "1") dojo.shinzen = true;
  if (Object.keys(dojo).length > 0) o.dojo = dojo;
  if (/^\d{4}$/.test(q.get("year") || "")) o.year = Number(q.get("year"));
  if (q.get("pageant") === "carpet" || q.get("pageant") === "stage") o.pageant = { style: q.get("pageant") };
  for (const [role, short] of [["away", "a"], ["home", "h"]]) {
    if (!q.get(role)) continue;
    const t = { name: q.get(role) };
    if (q.get(`${short}abbr`)) t.abbr = q.get(`${short}abbr`);
    if (q.get(`${short}score`) !== null) t.score = /^-?\d+$/.test(q.get(`${short}score`)) ? Number(q.get(`${short}score`)) : q.get(`${short}score`);
    if (q.get(`${short}color`)) t.color = `#${q.get(`${short}color`)}`;
    if (/^\d+$/.test(q.get(`${short}pens`) ?? "")) t.penalties = Number(q.get(`${short}pens`));
    if (q.get(`${short}logo`)) t.logo = q.get(`${short}logo`);
    o[role] = t;
  }
  if (!o.home || !o.away) {
    delete o.home;
    delete o.away;
  }
  return o;
}
