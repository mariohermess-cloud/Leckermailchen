import * as THREE from 'three';
import type { DripKonfig } from '../modell/typen';
import { clamp, lerp, type Rng } from './random';
import { appendCap, emptySurfacePoint, fixWinding, type TierSurface } from './tierSurface';

/** Thickness of the glaze layer on top of the cake (cm). Other decorations sit on top of it. */
export const DRIP_THICKNESS = 0.16;

interface Drop {
  /** arc length of the drop's centre line */
  a: number;
  /** distance from the top edge at which the drop ends */
  end: number;
  /** half width */
  w: number;
}

/** smooth maximum: blends two "inside" measures so drops merge softly into the rim */
function smax(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}

/**
 * Glaze that covers the top, hangs over the edge as an irregular rim and runs down in drops.
 *
 * Built as an offset shell of the tier surface: a signed "inside the glaze" field (rim ∪ drops)
 * is evaluated on a fine grid over the wall, the shell is pushed out where the field is positive
 * and tucked just below the surface elsewhere, so the visible outline is the smooth zero line.
 */
export function buildDrip(surface: TierSurface, cfg: DripKonfig, rng: Rng): THREE.BufferGeometry {
  const o = surface.outline;
  const L = o.length;
  const T = DRIP_THICKNESS;
  const edge = 0.2;
  const hidden = 0.045;
  const rim = surface.filletArc + 0.28;
  const maxLen = Math.max(0.4, Math.min((0.12 + 0.62 * cfg.laenge) * surface.sideHeight, surface.sideHeight - 1.0));

  const spacing = lerp(4.4, 1.45, cfg.dichte);
  const count = Math.max(3, Math.round(L / spacing));
  const drops: Drop[] = [];
  for (let k = 0; k < count; k++) {
    const jitter = (rng() - 0.5) * 0.7;
    const len = maxLen * (0.18 + 0.82 * Math.pow(rng(), 1.25));
    drops.push({ a: ((k + 0.5 + jitter) * L) / count, end: rim + len, w: 0.27 + 0.17 * rng() });
  }

  // waviness of the rim, periodic around the cake
  const k1 = (Math.PI * 2 * Math.max(1, Math.round(L / 5.5))) / L;
  const k2 = (Math.PI * 2 * Math.max(2, Math.round(L / 2.3))) / L;
  const ph1 = rng() * Math.PI * 2;
  const ph2 = rng() * Math.PI * 2;

  const qMax = Math.min(rim + maxLen + 0.7, surface.profileLength);
  const na = o.n * 2;
  const nq = Math.max(8, Math.ceil(qMax / 0.085));
  const da = L / na;

  const vertexCount = na * (nq + 1) + na;
  const position = new Float32Array(vertexCount * 3);
  const normal = new Float32Array(vertexCount * 3);
  const visible = new Uint8Array(na * (nq + 1));
  /** undisplaced surface normals, used to keep the computed normals pointing outwards */
  const base = new Float32Array(na * (nq + 1) * 3);
  const pt = emptySurfacePoint();

  for (let i = 0; i < na; i++) {
    const a = i * da;
    const wave = 0.1 * Math.sin(a * k1 + ph1) + 0.05 * Math.sin(a * k2 + ph2);
    for (let j = 0; j <= nq; j++) {
      const q = (j / nq) * qMax;
      let m = rim + wave - q;
      let bulb = 0;
      for (let d = 0; d < drops.length; d++) {
        const drop = drops[d];
        let dist = a - drop.a;
        if (dist > L / 2) dist -= L;
        else if (dist < -L / 2) dist += L;
        if (Math.abs(dist) > drop.w + 0.9 || q > drop.end + 0.5) continue;
        // teardrop: slightly wider towards the tip
        const t = clamp(q / drop.end, 0, 1);
        const rad = drop.w * (0.78 + 0.3 * t * t);
        const qc = clamp(q, 0, drop.end - rad);
        const mk = rad - Math.hypot(dist, q - qc);
        m = smax(m, mk, 0.3);
        const tipDist = Math.hypot(dist, q - (drop.end - rad));
        bulb = Math.max(bulb, Math.exp(-((tipDist / (drop.w * 1.25)) ** 2)));
      }
      const x = clamp(m / edge, 0, 1);
      const bead = Math.sqrt(1 - (1 - x) * (1 - x));
      const offset = m > 0 ? T * bead * (1 + 0.75 * bulb) : -hidden;
      surface.at(a, surface.profileLength - q, offset, pt);
      const v = i * (nq + 1) + j;
      position[v * 3] = pt.x;
      position[v * 3 + 1] = pt.y;
      position[v * 3 + 2] = pt.z;
      base[v * 3] = pt.nx;
      base[v * 3 + 1] = pt.ny;
      base[v * 3 + 2] = pt.nz;
      visible[v] = m > -0.02 ? 1 : 0;
    }
  }

  // normals from the displaced grid (kept on the same side as the tier's own surface normal)
  const p = (i: number, j: number, c: number) => position[(((i + na) % na) * (nq + 1) + clamp(j, 0, nq)) * 3 + c];
  for (let i = 0; i < na; i++) {
    for (let j = 0; j <= nq; j++) {
      const v = i * (nq + 1) + j;
      if (j === 0) {
        normal[v * 3 + 1] = 1;
        continue;
      }
      const ux = p(i + 1, j, 0) - p(i - 1, j, 0);
      const uy = p(i + 1, j, 1) - p(i - 1, j, 1);
      const uz = p(i + 1, j, 2) - p(i - 1, j, 2);
      const vx = p(i, j + 1, 0) - p(i, j - 1, 0);
      const vy = p(i, j + 1, 1) - p(i, j - 1, 1);
      const vz = p(i, j + 1, 2) - p(i, j - 1, 2);
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      const sign = nx * base[v * 3] + ny * base[v * 3 + 1] + nz * base[v * 3 + 2] < 0 ? -1 : 1;
      normal[v * 3] = (nx / l) * sign;
      normal[v * 3 + 1] = (ny / l) * sign;
      normal[v * 3 + 2] = (nz / l) * sign;
    }
  }

  const index: number[] = [];
  for (let i = 0; i < na; i++) {
    const i1 = (i + 1) % na;
    for (let j = 0; j < nq; j++) {
      const a = i * (nq + 1) + j;
      const b = i1 * (nq + 1) + j;
      const c = a + 1;
      const d = b + 1;
      if (!(visible[a] || visible[b] || visible[c] || visible[d])) continue;
      index.push(a, c, b, b, c, d);
    }
  }

  // flat pool on top
  const capStart = na * (nq + 1);
  const ring: THREE.Vector2[] = [];
  for (let i = 0; i < na; i++) {
    const src = i * (nq + 1);
    const k = capStart + i;
    position[k * 3] = position[src * 3];
    position[k * 3 + 1] = position[src * 3 + 1];
    position[k * 3 + 2] = position[src * 3 + 2];
    normal[k * 3 + 1] = 1;
    ring.push(new THREE.Vector2(position[k * 3], position[k * 3 + 2]));
  }
  appendCap(ring, capStart, position, index);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geometry.setIndex(index);
  fixWinding(geometry);
  return geometry;
}
