// Reading the `tenants` line of an English Wikipedia infobox: the clubs it names, the league each plays in and the years, as the article writes them. Used by scripts/build-tenants.mjs.

/** Templates that only wrap a list or a text: their content is read, their name is not. */
const TRANSPARENT = /^(nowrap|plainlist|plain list|ubl|ubl-nowrap|unbulleted list|unbulleted|flatlist|hlist|small|nobr|collapsible list)$/i;

/** The wikitext of the line with comments and references cut out. */
const clean = (text) =>
  text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/'''?/g, "");

/** The entries of the line: split at `<br>`, at the start of a bullet and at the pipes of a list template, but not inside a link or another template. */
export function tenantEntries(text) {
  const source = clean(text);
  const entries = [];
  let current = "";
  let depth = 0;
  const stack = [];
  const flush = () => {
    if (current.trim() !== "") entries.push(current.trim());
    current = "";
  };
  for (let i = 0; i < source.length; i += 1) {
    const two = source.slice(i, i + 2);
    if (two === "[[") { depth += 1; current += two; i += 1; continue; }
    if (two === "]]") { depth -= 1; current += two; i += 1; continue; }
    if (two === "{{") {
      const name = /^\{\{\s*([^|{}]*)/.exec(source.slice(i))[1].trim();
      if (depth === 0 && TRANSPARENT.test(name)) {
        stack.push("transparent");
        i += 1 + source.slice(i + 2).search(/[|}]/) + 1;
        if (source[i] === "|") flush();
        else i -= 1;
        continue;
      }
      // Another template (a citation, a note): skipped whole.
      let braces = 0;
      let j = i;
      for (; j < source.length; j += 1) {
        if (source.slice(j, j + 2) === "{{") { braces += 1; j += 1; } else if (source.slice(j, j + 2) === "}}") { braces -= 1; j += 1; if (braces === 0) break; }
      }
      current += /^\{\{\s*(start date|dts|sfn|efn|cite|citation|refn|clarify|when)/i.test(source.slice(i, i + 20)) ? "" : source.slice(i, j + 1);
      i = j;
      continue;
    }
    if (two === "}}" && stack.length > 0 && depth === 0) { stack.pop(); i += 1; continue; }
    if (depth === 0 && source[i] === "|" && stack.length > 0) { flush(); continue; }
    if (depth === 0 && source[i] === "<" && /^<br\s*\/?>/i.test(source.slice(i))) { flush(); i += /^<br\s*\/?>/i.exec(source.slice(i))[0].length - 1; continue; }
    if (depth === 0 && source[i] === "\n") { flush(); continue; }
    if (depth === 0 && source[i] === "*" && current.trim() === "") continue;
    current += source[i];
  }
  flush();
  // A line that is only years in brackets goes on the club before it (`[[Club]] ([[League|L]])<br />(1973–present)`).
  const lines = [];
  for (const entry of entries.map((e) => e.replace(/^[*#:\s]+/, "")).filter((e) => e !== "")) {
    if (lines.length > 0 && /^\(?\s*(?:since\s+)?\d{4}/.test(entry) && !/\[\[/.test(entry)) lines[lines.length - 1] += ` ${entry}`;
    else lines.push(entry);
  }
  return lines;
}

const PARTIAL = /\b(?:select|selected|intermittent|part[- ]?time|occasional|some games|some home games|few games|one game|during|derby|derbies|limited)\b/i;
const LINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g;

/** The years of one stretch of words: `1983–present`, `2011–2012`, `1976–86`, `2002`; each a [first, last] with `last` undefined when it runs to today. */
function stretches(words) {
  const out = [];
  const pattern = /(since\s+)?(\d{4})\s*(?:[–—-]\s*(present|current|now|\d{4}|\d{2}))?/gi;
  for (const m of words.matchAll(pattern)) {
    const first = Number(m[2]);
    let last = m[1] !== undefined ? undefined : first;
    if (m[3] !== undefined) {
      if (/^(present|current|now)$/i.test(m[3])) last = undefined;
      else if (m[3].length === 2) last = Math.floor(first / 100) * 100 + Number(m[3]);
      else last = Number(m[3]);
    }
    if (last !== undefined && last < first) continue;
    out.push([first, last]);
  }
  return out;
}

/**
 * One entry read: the club's article, the league's article and its short form, and the years the entry gives. A stretch the article calls part-time, select or intermittent is
 * not a stretch of being a tenant: it is listed apart, and an entry with nothing else is `partial`.
 */
export function readEntry(entry) {
  const links = [...entry.matchAll(LINK)].map((m) => ({ target: m[1].trim().replace(/_/g, " "), text: (m[2] ?? m[1]).trim(), index: m.index, end: m.index + m[0].length }));
  // A club the article does not link starts the entry as plain words (`Chunichi Dragons ([[Nippon Professional Baseball|NPB]]) (1948-1996)`).
  const lead = links.length === 0 ? entry : entry.slice(0, links[0].index);
  const leading = lead.replace(/[\s(]+$/, "").replace(/'+/g, "").trim();
  const plainClub = /\p{L}/u.test(leading) && !/^(?:baseball|football|soccer|hockey|rugby|basketball|other|former|formerly)$/i.test(leading) ? { target: undefined, text: leading, index: 0, end: lead.length } : undefined;
  if (links.length === 0 && plainClub === undefined) return undefined;
  const club = plainClub ?? links[0];
  // The league is the link inside the first pair of brackets after the club (`([[Major League Baseball|MLB]])`), or the plain short form (`(NPB)`).
  const afterClub = entry.slice(club.end);
  const bracket = /\(\s*(\[\[[^\]]+\]\](?:\s*[/,&]\s*\[\[[^\]]+\]\])*|[A-Za-z][A-Za-z0-9 .&-]{1,30})\s*\)/.exec(afterClub);
  const bracketIsPartial = bracket !== null && PARTIAL.test(bracket[1]);
  const leagueLinks = bracket === null || bracketIsPartial ? [] : [...bracket[1].matchAll(LINK)].map((m) => ({ target: m[1].trim().replace(/_/g, " "), text: (m[2] ?? m[1]).trim() }));
  const leagueText = bracket === null || bracketIsPartial ? undefined : bracket[1].replace(LINK, (_, t, s) => s ?? t).trim();
  // The words that are not the club or the league: the years are read from there.
  const rest = bracket === null ? afterClub : afterClub.slice(0, bracket.index) + " " + afterClub.slice(bracket.index + bracket[0].length);
  const plainRest = rest.replace(LINK, (_, t, text) => text ?? t);
  const segments = plainRest.split(/[,;]/);
  const years = [];
  const partial = [];
  // The word that says "some games only" belongs to the stretch it stands in (`part-time 1998–2013`); a stretch of its own (`1953–1994, part time`) belongs to the whole entry.
  let wholly = false;
  for (const segment of segments) {
    const found = stretches(segment);
    if (found.length === 0) { if (PARTIAL.test(segment)) wholly = true; continue; }
    (PARTIAL.test(segment) ? partial : years).push(...found);
  }
  if (wholly) partial.push(...years.splice(0));
  const whole = plainRest;
  return {
    club: club.target,
    clubText: club.text,
    linked: plainClub === undefined,
    league: leagueLinks[0]?.target,
    leagueText,
    leagues: leagueLinks.map((l) => l.target),
    years,
    partial,
    note: bracketIsPartial || wholly || (years.length === 0 && PARTIAL.test(whole)) ? "partial" : undefined,
    text: plainText(entry.slice(0, club.end)),
    raw: entry,
  };
}

/** The words of a piece of wikitext with its links read as their text. */
function plainText(text) {
  return text.replace(LINK, (_, t, shown) => shown ?? t).replace(/\s+/g, " ").trim();
}
