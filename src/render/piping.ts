import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BorduereEintrag } from '../modell/typen';
import { decoMaterial } from './materials';
import { emptySample, sampleOutline } from './outline';
import { mulberry32, type Rng } from './random';
import { emptySurfacePoint, type TierSurface } from './tierSurface';

/** A piped star-tip dollop: wide ridged base tapering into a soft peak. Base sits on y = 0. */
export function makeDollop(radius: number, height: number, lobes = 7, twist = 0.9, rings = 14): THREE.BufferGeometry {
  const radial = lobes * 6;
  const position: number[] = [];
  const index: number[] = [];
  for (let j = 0; j < rings; j++) {
    const t = j / rings;
    const body = 0.55 * Math.pow(1 - t, 1.8) + 0.45 * Math.sqrt(Math.max(0, 1 - t * t));
    const tuck = 0.86 + 0.14 * Math.min(1, t / 0.12);
    const r = radius * body * tuck;
    const amp = 0.17 * (1 - 0.55 * t);
    for (let i = 0; i < radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      const rr = r * (1 + amp * Math.cos(lobes * (a + twist * t)));
      position.push(Math.cos(a) * rr, height * Math.pow(t, 0.92), Math.sin(a) * rr);
    }
  }
  const apex = position.length / 3;
  position.push(0, height, 0);
  for (let j = 0; j < rings - 1; j++) {
    for (let i = 0; i < radial; i++) {
      const a = j * radial + i;
      const b = j * radial + ((i + 1) % radial);
      const c = a + radial;
      const d = b + radial;
      index.push(a, c, b, b, c, d);
    }
  }
  for (let i = 0; i < radial; i++) {
    const a = (rings - 1) * radial + i;
    const b = (rings - 1) * radial + ((i + 1) % radial);
    index.push(a, apex, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/**
 * A piped shell: fat ridged head at +x, tail tapering towards -x, lying on y = 0.
 * Laid head-over-tail along the edge it forms the classic shell border.
 */
export function makeShell(size: number, lobes = 7): THREE.BufferGeometry {
  const length = size * 1.55;
  const rings = 16;
  const radial = lobes * 5;
  const position: number[] = [];
  const index: number[] = [];
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const head = Math.sin(Math.min(1, (t + 0.03) / 0.3) * Math.PI * 0.5);
    const tail = Math.pow(1 - t, 0.8);
    const r = size * 0.5 * head * tail + 0.001;
    const x = length * (0.5 - t);
    const cy = r * 0.85;
    for (let i = 0; i < radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      const rr = r * (1 + 0.16 * Math.cos(lobes * a + t * 2.4));
      position.push(x, Math.max(0, cy + Math.sin(a) * rr), Math.cos(a) * rr);
    }
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < radial; i++) {
      const a = j * radial + i;
      const b = j * radial + ((i + 1) % radial);
      const c = a + radial;
      const d = b + radial;
      index.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** A tuft of piped grass strands. */
function makeGrassTuft(size: number, seed: number): THREE.BufferGeometry {
  const rng = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  const strands = 9;
  for (let i = 0; i < strands; i++) {
    const h = size * (0.6 + rng() * 0.6);
    const cone = new THREE.ConeGeometry(size * 0.085, h, 5, 1, true);
    cone.translate(0, h / 2, 0);
    const lean = 0.15 + rng() * 0.5;
    const dir = rng() * Math.PI * 2;
    cone.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(lean * Math.cos(dir), 0, lean * Math.sin(dir))));
    const r = Math.sqrt(rng()) * size * 0.32;
    const a = rng() * Math.PI * 2;
    cone.translate(Math.cos(a) * r, 0, Math.sin(a) * r);
    parts.push(cone);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

export type BorderPlace = 'unten' | 'oben';

/**
 * Piped border along the bottom or the top edge of a tier.
 * `lift` raises a top border (e.g. when glaze covers the top).
 */
export function buildBorder(
  surface: TierSurface,
  place: BorderPlace,
  eintrag: BorduereEintrag,
  farbe: string,
  rng: Rng,
  lift = 0,
): THREE.Object3D | null {
  if (eintrag.art === 'keine') return null;
  const size = eintrag.groesse;
  const o = surface.outline;
  const material = decoMaterial(farbe, { roughness: eintrag.art === 'perlen' ? 0.35 : 0.5, sheen: 0.2 });

  if (eintrag.art === 'band') {
    const mesh = new THREE.Mesh(buildRibbon(surface, place === 'unten' ? 0.05 : surface.sideHeight - size - 0.3, size), material);
    return mesh;
  }

  let geometry: THREE.BufferGeometry;
  let spacing = size;
  let sink = 0;
  switch (eintrag.art) {
    case 'perlen':
      geometry = new THREE.SphereGeometry(size / 2, 20, 14);
      geometry.translate(0, size * 0.42, 0);
      spacing = size * 1.0;
      break;
    case 'tupfen':
      geometry = makeDollop(size / 2, size * 0.86);
      spacing = size * 0.93;
      break;
    case 'rosetten':
      geometry = makeDollop(size / 2, size * 0.5, 8, 3.2);
      spacing = size * 0.98;
      break;
    case 'muscheln':
      geometry = makeShell(size);
      spacing = size * 0.92;
      break;
    case 'gras':
      geometry = makeGrassTuft(size, 5);
      spacing = size * 0.42;
      sink = 0.02;
      break;
    default:
      return null;
  }

  const count = Math.max(4, Math.round(o.length / spacing));
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const s = emptySample();
  const m = new THREE.Matrix4();
  const basisX = new THREE.Vector3();
  const basisY = new THREE.Vector3(0, 1, 0);
  const basisZ = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const spin = new THREE.Quaternion();

  // where the pieces sit relative to the wall
  const out = place === 'unten' ? size * (eintrag.art === 'gras' ? 0.28 : 0.3) : -(surface.fillet + size * 0.42);
  const y = place === 'unten' ? surface.y0 : surface.topY + lift;

  for (let i = 0; i < count; i++) {
    sampleOutline(o, (i / count) * o.length, s);
    basisX.set(s.tx, 0, s.tz);
    basisZ.set(s.nx, 0, s.nz);
    m.makeBasis(basisX, basisY, basisZ);
    quat.setFromRotationMatrix(m);
    let k = 1;
    if (eintrag.art === 'gras') {
      spin.setFromAxisAngle(basisY, rng() * Math.PI * 2);
      quat.premultiply(spin);
      k = 0.8 + rng() * 0.45;
    } else if (eintrag.art === 'tupfen' || eintrag.art === 'rosetten') {
      k = 0.96 + rng() * 0.08;
    }
    pos.set(s.x + s.nx * out, y - sink, s.z + s.nz * out);
    scale.set(k, k, k);
    m.compose(pos, quat, scale);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/** Thin fondant ribbon wrapped around the wall, from profile height `from` upwards. */
export function buildRibbon(surface: TierSurface, from: number, height: number, thickness = 0.07): THREE.BufferGeometry {
  const o = surface.outline;
  const n = o.n;
  const rows: Array<{ p: number; off: number; ny: number }> = [
    { p: from, off: -0.01, ny: -1 },
    { p: from, off: thickness, ny: -0.4 },
    { p: from + height, off: thickness, ny: 0.4 },
    { p: from + height, off: -0.01, ny: 1 },
  ];
  const position: number[] = [];
  const normal: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  const pt = emptySurfacePoint();
  rows.forEach((row, j) => {
    for (let i = 0; i <= n; i++) {
      surface.at((i % n) * o.step, row.p, row.off, pt);
      position.push(pt.x, pt.y, pt.z);
      const horizontal = Math.sqrt(Math.max(0, 1 - row.ny * row.ny));
      normal.push(pt.nx * horizontal, row.ny, pt.nz * horizontal);
      uv.push(i / n, j / (rows.length - 1));
    }
  });
  const cols = n + 1;
  for (let j = 0; j < rows.length - 1; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * cols + i;
      index.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}
