/**
 * Cake outlines in plan view.
 *
 * An Outline is a closed curve sampled at `n` points with uniform arc-length spacing.
 * Coordinates are (x, z): +z points towards the viewer ("front"), +x to the viewer's right.
 * Index 0 sits at the back, and walking along increasing arc length passes the front going
 * towards +x. Everything that follows the cake wall (drips, borders, side decorations, text)
 * is positioned through this one abstraction, so any new shape works everywhere automatically.
 */

export type Point2 = [number, number];

export interface Outline {
  n: number;
  px: Float32Array;
  pz: Float32Array;
  /** outward unit normals */
  nx: Float32Array;
  nz: Float32Array;
  /** perimeter */
  length: number;
  /** arc length between neighbouring samples */
  step: number;
  /** largest distance from the centre */
  radius: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface OutlineSample {
  x: number;
  z: number;
  nx: number;
  nz: number;
  /** unit tangent in direction of increasing arc length */
  tx: number;
  tz: number;
}

export function makeOutline(raw: Point2[], n = 360): Outline {
  // orientation: negative signed area in (x, z) means "front passes towards +x"
  let area = 0;
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    const b = raw[(i + 1) % raw.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const pts = area > 0 ? [...raw].reverse() : raw;
  const m = pts.length;

  const cum = new Float64Array(m + 1);
  for (let i = 0; i < m; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % m];
    cum[i + 1] = cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const total = cum[m];
  const step = total / n;

  const x = new Float32Array(n);
  const z = new Float32Array(n);
  let seg = 0;
  for (let i = 0; i < n; i++) {
    const d = i * step;
    while (seg < m - 1 && cum[seg + 1] < d) seg++;
    const a = pts[seg];
    const b = pts[(seg + 1) % m];
    const segLen = cum[seg + 1] - cum[seg];
    const f = segLen > 0 ? (d - cum[seg]) / segLen : 0;
    x[i] = a[0] + (b[0] - a[0]) * f;
    z[i] = a[1] + (b[1] - a[1]) * f;
  }

  // rotate so that index 0 is the point at the back (direction -z)
  let start = 0;
  let best = -Infinity;
  for (let i = 0; i < n; i++) {
    const r = Math.hypot(x[i], z[i]) || 1;
    const dot = -z[i] / r;
    if (dot > best) {
      best = dot;
      start = i;
    }
  }
  const px = new Float32Array(n);
  const pz = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    px[i] = x[(i + start) % n];
    pz[i] = z[(i + start) % n];
  }

  const nx = new Float32Array(n);
  const nz = new Float32Array(n);
  let radius = 0;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const a = (i + n - 1) % n;
    const b = (i + 1) % n;
    const tx = px[b] - px[a];
    const tz = pz[b] - pz[a];
    const l = Math.hypot(tx, tz) || 1;
    nx[i] = -tz / l;
    nz[i] = tx / l;
    radius = Math.max(radius, Math.hypot(px[i], pz[i]));
    minX = Math.min(minX, px[i]);
    maxX = Math.max(maxX, px[i]);
    minZ = Math.min(minZ, pz[i]);
    maxZ = Math.max(maxZ, pz[i]);
  }

  return { n, px, pz, nx, nz, length: total, step, radius, minX, maxX, minZ, maxZ };
}

export function scaleOutline(o: Outline, k: number): Outline {
  const pts: Point2[] = [];
  for (let i = 0; i < o.n; i++) pts.push([o.px[i] * k, o.pz[i] * k]);
  return makeOutline(pts, o.n);
}

/** Position, normal and tangent at arc length `s` (wraps around). */
export function sampleOutline(o: Outline, s: number, out: OutlineSample): OutlineSample {
  const t = ((((s % o.length) + o.length) % o.length) / o.step) % o.n;
  const i0 = Math.floor(t) % o.n;
  const i1 = (i0 + 1) % o.n;
  const f = t - Math.floor(t);
  out.x = o.px[i0] + (o.px[i1] - o.px[i0]) * f;
  out.z = o.pz[i0] + (o.pz[i1] - o.pz[i0]) * f;
  let nx = o.nx[i0] + (o.nx[i1] - o.nx[i0]) * f;
  let nz = o.nz[i0] + (o.nz[i1] - o.nz[i0]) * f;
  const l = Math.hypot(nx, nz) || 1;
  nx /= l;
  nz /= l;
  out.nx = nx;
  out.nz = nz;
  out.tx = nz;
  out.tz = -nx;
  return out;
}

export function emptySample(): OutlineSample {
  return { x: 0, z: 0, nx: 0, nz: 1, tx: 1, tz: 0 };
}

/**
 * Arc length of the outline point seen in direction `deg` from the centre.
 * 0° = front (towards the viewer), positive angles turn towards the viewer's right.
 */
export function arcAtAngle(o: Outline, deg: number): number {
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dz = Math.cos(a);
  let best = -Infinity;
  let index = 0;
  for (let i = 0; i < o.n; i++) {
    const r = Math.hypot(o.px[i], o.pz[i]) || 1;
    const dot = (o.px[i] * dx + o.pz[i] * dz) / r;
    if (dot > best) {
      best = dot;
      index = i;
    }
  }
  return index * o.step;
}

export function pointInOutline(o: Outline, x: number, z: number): boolean {
  let inside = false;
  for (let i = 0, j = o.n - 1; i < o.n; j = i++) {
    const zi = o.pz[i];
    const zj = o.pz[j];
    if (zi > z !== zj > z && x < ((o.px[j] - o.px[i]) * (z - zi)) / (zj - zi) + o.px[i]) inside = !inside;
  }
  return inside;
}

/**
 * Outline moved inwards by `d`. Points that would end up closer than `d` to the original
 * boundary (loops at sharp convex corners such as the tip of a heart) are dropped.
 */
export function insetOutline(o: Outline, d: number): Outline {
  if (d <= 0) return o;
  const pts: Point2[] = [];
  const limit = (d * 0.985) ** 2;
  for (let i = 0; i < o.n; i++) {
    const x = o.px[i] - o.nx[i] * d;
    const z = o.pz[i] - o.nz[i] * d;
    let ok = true;
    for (let j = 0; j < o.n; j += 2) {
      const ex = o.px[j] - x;
      const ez = o.pz[j] - z;
      if (ex * ex + ez * ez < limit) {
        ok = false;
        break;
      }
    }
    if (ok) pts.push([x, z]);
  }
  if (pts.length < 8) {
    // shape too small for this inset: fall back to a tiny circle around the centre
    const r = Math.max(0.05, o.radius * 0.05);
    for (let i = 0; i < 16; i++) pts.push([Math.cos((i / 16) * Math.PI * 2) * r, Math.sin((i / 16) * Math.PI * 2) * r]);
  }
  return makeOutline(pts, o.n);
}
