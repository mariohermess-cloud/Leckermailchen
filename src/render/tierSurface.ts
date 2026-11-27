import * as THREE from 'three';
import { emptySample, sampleOutline, type Outline } from './outline';

export interface SurfacePoint {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  /** horizontal unit tangent along the wall */
  tx: number;
  tz: number;
}

export function emptySurfacePoint(): SurfacePoint {
  return { x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 1, tx: 1, tz: 0 };
}

/**
 * The visible skin of one tier: a vertical wall following the outline, a rounded top edge
 * (fillet) and a flat top. Points on it are addressed by
 *   s – arc length around the outline
 *   p – distance along the profile, measured upwards from the bottom edge
 * so decorations can be laid onto the wall and around the edge without knowing the shape.
 */
export class TierSurface {
  readonly fillet: number;
  readonly sideHeight: number;
  readonly filletArc: number;
  readonly profileLength: number;
  readonly topY: number;
  private readonly tmp = emptySample();

  constructor(
    readonly outline: Outline,
    readonly y0: number,
    readonly height: number,
    fillet: number,
  ) {
    this.fillet = Math.max(0.02, Math.min(fillet, height * 0.4, outline.radius * 0.25));
    this.sideHeight = height - this.fillet;
    this.filletArc = (this.fillet * Math.PI) / 2;
    this.profileLength = this.sideHeight + this.filletArc;
    this.topY = y0 + height;
  }

  /** Point at arc length `s`, profile position `p`, pushed `offset` along the surface normal. */
  at(s: number, p: number, offset: number, out: SurfacePoint): SurfacePoint {
    const o = sampleOutline(this.outline, s, this.tmp);
    let inset = 0;
    let y = p;
    let sin = 0;
    let cos = 1;
    if (p > this.sideHeight) {
      const a = Math.min((p - this.sideHeight) / this.fillet, Math.PI / 2);
      sin = Math.sin(a);
      cos = Math.cos(a);
      inset = this.fillet * (1 - cos);
      y = this.sideHeight + this.fillet * sin;
    } else if (p < 0) {
      y = 0;
    }
    out.nx = o.nx * cos;
    out.ny = sin;
    out.nz = o.nz * cos;
    out.x = o.x - o.nx * inset + out.nx * offset;
    out.y = this.y0 + y + out.ny * offset;
    out.z = o.z - o.nz * inset + out.nz * offset;
    out.tx = o.tx;
    out.tz = o.tz;
    return out;
  }
}

export type UvMode =
  /** texture repeats every `texSize` cm in both directions */
  | 'tile'
  /** v runs 0…1 over the wall height; edge and top use v > 1 (clamped) */
  | 'fit';

/** Triangulated wall + rounded edge + top of a tier. */
export function buildTierGeometry(surface: TierSurface, uvMode: UvMode, texSize: number): THREE.BufferGeometry {
  const o = surface.outline;
  const n = o.n;
  const filletSegments = 10;
  const rows = 2 + filletSegments;
  const cols = n + 1;
  const repeatU = Math.max(1, Math.round(o.length / texSize));

  const capStart = cols * rows;
  const vertexCount = capStart + n;
  const position = new Float32Array(vertexCount * 3);
  const normal = new Float32Array(vertexCount * 3);
  const uv = new Float32Array(vertexCount * 2);
  const index: number[] = [];
  const pt = emptySurfacePoint();

  for (let j = 0; j < rows; j++) {
    const p = j === 0 ? 0 : surface.sideHeight + ((j - 1) / filletSegments) * surface.filletArc;
    for (let i = 0; i < cols; i++) {
      surface.at((i % n) * o.step, p, 0, pt);
      const k = j * cols + i;
      position[k * 3] = pt.x;
      position[k * 3 + 1] = pt.y;
      position[k * 3 + 2] = pt.z;
      normal[k * 3] = pt.nx;
      normal[k * 3 + 1] = pt.ny;
      normal[k * 3 + 2] = pt.nz;
      uv[k * 2] = (i / n) * repeatU;
      uv[k * 2 + 1] = uvMode === 'fit' ? p / surface.sideHeight : p / texSize;
    }
  }
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }

  // flat top: triangulate the ring where the fillet ends
  const ring: THREE.Vector2[] = [];
  const lastRow = (rows - 1) * cols;
  for (let i = 0; i < n; i++) {
    const src = lastRow + i;
    const k = capStart + i;
    position[k * 3] = position[src * 3];
    position[k * 3 + 1] = position[src * 3 + 1];
    position[k * 3 + 2] = position[src * 3 + 2];
    normal[k * 3 + 1] = 1;
    uv[k * 2] = uvMode === 'fit' ? position[k * 3] / texSize : position[k * 3] / texSize;
    uv[k * 2 + 1] = uvMode === 'fit' ? 1.5 : position[k * 3 + 2] / texSize;
    ring.push(new THREE.Vector2(position[k * 3], position[k * 3 + 2]));
  }
  appendCap(ring, capStart, position, index);

  // make sure the wall faces outwards
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  fixWinding(geometry);
  return geometry;
}

/** Adds upward-facing triangles for a closed ring of existing vertices starting at `first`. */
export function appendCap(ring: THREE.Vector2[], first: number, position: ArrayLike<number>, index: number[]): void {
  const faces = THREE.ShapeUtils.triangulateShape(ring, []);
  for (const [a, b, c] of faces) {
    const ia = first + a;
    const ib = first + b;
    const ic = first + c;
    // y component of the face normal decides the winding
    const ux = position[ib * 3] - position[ia * 3];
    const uz = position[ib * 3 + 2] - position[ia * 3 + 2];
    const vx = position[ic * 3] - position[ia * 3];
    const vz = position[ic * 3 + 2] - position[ia * 3 + 2];
    const ny = uz * vx - ux * vz;
    if (ny >= 0) index.push(ia, ib, ic);
    else index.push(ia, ic, ib);
  }
}

/** Flips every triangle whose geometric normal disagrees with its vertex normals. */
export function fixWinding(geometry: THREE.BufferGeometry): void {
  const pos = geometry.getAttribute('position');
  const nor = geometry.getAttribute('normal');
  const idx = geometry.getIndex();
  if (!idx) return;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const face = new THREE.Vector3();
  const avg = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const array = idx.array as Uint16Array | Uint32Array;
  for (let i = 0; i < array.length; i += 3) {
    const ia = array[i];
    const ib = array[i + 1];
    const ic = array[i + 2];
    a.fromBufferAttribute(pos, ia);
    b.fromBufferAttribute(pos, ib);
    c.fromBufferAttribute(pos, ic);
    face.subVectors(b, a).cross(tmp.subVectors(c, a));
    avg.fromBufferAttribute(nor, ia).add(tmp.fromBufferAttribute(nor, ib)).add(tmp.fromBufferAttribute(nor, ic));
    if (face.dot(avg) < 0) {
      array[i + 1] = ic;
      array[i + 2] = ib;
    }
  }
  idx.needsUpdate = true;
}
