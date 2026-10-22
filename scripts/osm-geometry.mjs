// What the build scripts that read an Overpass answer (scripts/build-walk.mjs, scripts/build-osm-context.mjs) share: a way or a relation as rings, a line simplified, a path packed into whole steps. Pure.

/** The rings a way or a relation is: a closed way is one; a multipolygon's outer and inner ways are joined end to end. Lines (open ways) are `lines`. */
export function geometryOf(element) {
  const point = (p) => [p.lon, p.lat];
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  if (element.type === "way") {
    const line = (element.geometry ?? []).map(point);
    return line.length > 3 && same(line[0], line[line.length - 1]) ? { rings: [{ role: "outer", points: line }], line } : { rings: [], line };
  }
  const parts = { outer: [], inner: [] };
  for (const m of element.members ?? []) if (m.type === "way" && (m.role === "outer" || m.role === "inner") && (m.geometry ?? []).length > 1) parts[m.role].push(m.geometry.map(point));
  const rings = [];
  for (const role of ["outer", "inner"]) {
    const pool = parts[role];
    while (pool.length > 0) {
      const ring = pool.shift();
      while (!same(ring[0], ring[ring.length - 1])) {
        const tail = ring[ring.length - 1];
        const next = pool.findIndex((part) => same(part[0], tail) || same(part[part.length - 1], tail));
        if (next < 0) break;
        const [part] = pool.splice(next, 1);
        if (!same(part[0], tail)) part.reverse();
        ring.push(...part.slice(1));
      }
      if (same(ring[0], ring[ring.length - 1]) && ring.length > 3) rings.push({ role, points: ring });
    }
  }
  return { rings, line: [] };
}

/** Douglas-Peucker on an open line, in metres. */
export function simplifiedLine(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const run = (from, to) => {
    const [p, q] = [points[from], points[to]];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    let at = -1;
    let most = tolerance;
    for (let i = from + 1; i < to; i += 1) {
      const r = points[i];
      const d = len < 1e-9 ? Math.hypot(r[0] - p[0], r[1] - p[1]) : Math.abs((q[0] - p[0]) * (p[1] - r[1]) - (p[0] - r[0]) * (q[1] - p[1])) / len;
      if (d > most) [at, most] = [i, d];
    }
    if (at >= 0) {
      keep[at] = true;
      run(from, at);
      run(at, to);
    }
  };
  run(0, points.length - 1);
  return points.filter((_, i) => keep[i]);
}

/** Whole units of `unit` metres from the first point, then the step from each point to the next: `[x0, y0, dx, dy, ...]`. */
export function packed(points, unit) {
  const whole = points.map(([x, y]) => [Math.round(x / unit), Math.round(y / unit)]);
  const out = [];
  let prev = [0, 0];
  whole.forEach((p, i) => {
    if (i === 0 || p[0] !== prev[0] || p[1] !== prev[1]) out.push(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  });
  return out;
}

