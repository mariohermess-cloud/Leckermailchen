import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { istMetallic } from '../archiv/farben';
import type { TopperAnordnung, TopperEintrag, TopperKonfig } from '../modell/typen';
import { decoMaterial } from './materials';
import { arcAtAngle, emptySample, insetOutline, pointInOutline, sampleOutline, type Outline } from './outline';
import { makeDollop } from './piping';
import type { Rng } from './random';
import { strawberryTextures } from './textures';

/** One decoration piece standing on y = 0. */
type Builder = (farbe: string, rng: Rng) => THREE.Object3D;

function lathe(points: Array<[number, number]>, segments = 28): THREE.LatheGeometry {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(geometry, material);
}

const strawberry: Builder = (_farbe, rng) => {
  const g = new THREE.Group();
  const tex = strawberryTextures();
  const body = mesh(
    lathe([
      [0.001, 0], [0.55, 0.02], [1.0, 0.25], [1.2, 0.7], [1.15, 1.2], [0.92, 1.75], [0.55, 2.2], [0.22, 2.45], [0.001, 2.52],
    ]),
    new THREE.MeshPhysicalMaterial({
      map: tex.map,
      bumpMap: tex.bumpMap,
      bumpScale: 0.6,
      roughness: 0.32,
      clearcoat: 0.5,
      clearcoatRoughness: 0.25,
    }),
  );
  g.add(body);
  // strawberries sit cut side down, tip up, never perfectly straight
  g.rotation.set((rng() - 0.5) * 0.35, rng() * Math.PI * 2, (rng() - 0.5) * 0.35);
  return g;
};

let raspberryGeometry: THREE.BufferGeometry | null = null;
const raspberry: Builder = (_farbe, rng) => {
  if (!raspberryGeometry) {
    const parts: THREE.BufferGeometry[] = [];
    const count = 46;
    for (let i = 0; i < count; i++) {
      const y = 1 - (i + 0.5) / count; // 1 = top
      const a = i * 2.39996;
      const r = 0.62 * Math.sin(Math.acos(Math.min(1, Math.abs(y * 1.7 - 0.75))) * 0.9 + 0.35);
      const bead = new THREE.SphereGeometry(0.2, 8, 6);
      bead.translate(Math.cos(a) * r, 0.18 + y * 1.05, Math.sin(a) * r);
      parts.push(bead);
    }
    const core = new THREE.SphereGeometry(0.55, 12, 10);
    core.scale(1, 1.1, 1).translate(0, 0.7, 0);
    parts.push(core);
    raspberryGeometry = mergeGeometries(parts)!;
  }
  const m = mesh(
    raspberryGeometry,
    new THREE.MeshPhysicalMaterial({ color: '#c0264d', roughness: 0.45, sheen: 0.8, sheenRoughness: 0.4, sheenColor: new THREE.Color('#ff9db5') }),
  );
  m.rotation.set((rng() - 0.5) * 0.5, rng() * Math.PI * 2, (rng() - 0.5) * 0.5);
  return m;
};

const blueberry: Builder = (_farbe, rng) => {
  const g = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({ color: '#303b6b', roughness: 0.55, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color('#9fb0e6') });
  const body = mesh(new THREE.SphereGeometry(0.56, 20, 16), skin);
  body.position.y = 0.54;
  body.scale.y = 0.92;
  g.add(body);
  const crown = mesh(new THREE.TorusGeometry(0.17, 0.05, 6, 12), new THREE.MeshStandardMaterial({ color: '#1c2244', roughness: 0.8 }));
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 1.04;
  g.add(crown);
  g.rotation.set((rng() - 0.5) * 1.2, rng() * 6.28, (rng() - 0.5) * 1.2);
  return g;
};

const berryMix: Builder = (farbe, rng) => {
  const r = rng();
  if (r < 0.28) return strawberry(farbe, rng);
  if (r < 0.62) return raspberry(farbe, rng);
  return blueberry(farbe, rng);
};

let dollopGeometry: THREE.BufferGeometry | null = null;
const dollop: Builder = (farbe, rng) => {
  dollopGeometry ??= makeDollop(1.15, 1.7, 8, 1.1, 18);
  const m = mesh(dollopGeometry, decoMaterial(farbe, { roughness: 0.5, sheen: 0.2 }));
  m.rotation.y = rng() * Math.PI * 2;
  return m;
};

const macaron: Builder = (farbe, rng) => {
  const g = new THREE.Group();
  const shellMaterial = decoMaterial(farbe, { roughness: 0.62, sheen: 0.3 });
  const dome = new THREE.SphereGeometry(1.5, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.scale(1, 0.42, 1);
  const top = mesh(dome, shellMaterial);
  top.position.y = 0.95;
  const bottom = mesh(dome, shellMaterial);
  bottom.rotation.x = Math.PI;
  bottom.position.y = 0.63;
  const feet = mesh(new THREE.TorusGeometry(1.42, 0.13, 8, 36), shellMaterial);
  feet.rotation.x = Math.PI / 2;
  feet.position.y = 0.93;
  const feet2 = feet.clone();
  feet2.position.y = 0.65;
  const filling = mesh(
    new THREE.CylinderGeometry(1.36, 1.36, 0.3, 32),
    decoMaterial('#' + new THREE.Color(farbe).lerp(new THREE.Color('#ffffff'), 0.55).getHexString(), { roughness: 0.5 }),
  );
  filling.position.y = 0.79;
  g.add(top, bottom, feet, feet2, filling);
  g.rotation.set((rng() - 0.5) * 0.3, rng() * 6.28, (rng() - 0.5) * 0.3);
  return g;
};

const ball: Builder = (farbe, rng) => {
  const r = 0.45 + rng() * 0.45;
  const material = istMetallic(farbe) ? decoMaterial(farbe) : decoMaterial(farbe, { roughness: 0.3, clearcoat: 0.6 });
  const m = mesh(new THREE.SphereGeometry(r, 24, 18), material);
  m.position.y = r * 0.94;
  return m;
};

let petalGeometry: THREE.BufferGeometry | null = null;
const blossom: Builder = (farbe, rng) => {
  petalGeometry ??= new THREE.SphereGeometry(1, 16, 12);
  const g = new THREE.Group();
  const material = decoMaterial(farbe, { roughness: 0.6, sheen: 0.4 });
  for (let i = 0; i < 5; i++) {
    const petal = mesh(petalGeometry, material);
    petal.scale.set(0.5, 0.11, 0.72);
    const holder = new THREE.Group();
    petal.position.set(0, 0.25, 0.72);
    petal.rotation.x = -0.35;
    holder.add(petal);
    holder.rotation.y = (i / 5) * Math.PI * 2;
    g.add(holder);
  }
  const center = mesh(new THREE.SphereGeometry(0.26, 14, 10), decoMaterial('#c9a23a'));
  center.position.y = 0.3;
  g.add(center);
  g.rotation.y = rng() * 6.28;
  const k = 0.85 + rng() * 0.3;
  g.scale.setScalar(k);
  return g;
};

const candle: Builder = (farbe, rng) => {
  const g = new THREE.Group();
  const h = 6.2 + rng() * 0.6;
  const wax = mesh(new THREE.CylinderGeometry(0.26, 0.26, h, 16), decoMaterial(farbe, { roughness: 0.45, clearcoat: 0.2 }));
  wax.position.y = h / 2;
  const wick = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), new THREE.MeshStandardMaterial({ color: '#2a2320', roughness: 0.9 }));
  wick.position.y = h + 0.2;
  const flame = mesh(
    lathe([[0.001, 0], [0.16, 0.12], [0.2, 0.35], [0.12, 0.7], [0.001, 1.0]], 14),
    new THREE.MeshBasicMaterial({ color: '#ffc24d', toneMapped: false }),
  );
  flame.position.y = h + 0.4;
  flame.userData.noShadow = true;
  const core = mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff6d6', toneMapped: false }));
  core.position.y = h + 0.62;
  core.scale.y = 1.8;
  core.userData.noShadow = true;
  g.add(wax, wick, flame, core);
  g.rotation.set((rng() - 0.5) * 0.06, 0, (rng() - 0.5) * 0.06);
  return g;
};

const builders: Record<string, Builder> = {
  erdbeere: strawberry,
  himbeere: raspberry,
  heidelbeere: blueberry,
  beerenmix: berryMix,
  tupfen: dollop,
  macaron,
  kugel: ball,
  bluete: blossom,
  kerze: candle,
};

interface Spot {
  x: number;
  z: number;
  scale: number;
}

/** Where the pieces go on the top surface. */
function arrange(anordnung: TopperAnordnung, count: number, radius: number, top: Outline, fillet: number, rng: Rng): Spot[] {
  const spots: Spot[] = [];
  const s = emptySample();
  const edge = insetOutline(top, fillet + radius * 1.05);

  switch (anordnung) {
    case 'kranz': {
      for (let i = 0; i < count; i++) {
        sampleOutline(edge, (i / count) * edge.length, s);
        spots.push({ x: s.x, z: s.z, scale: 1 });
      }
      break;
    }
    case 'halbmond': {
      // a crescent hugging the back-left edge, densest and largest in its middle
      const centre = arcAtAngle(edge, -125);
      const span = edge.length * 0.42;
      const rows = count > 12 ? 3 : count > 5 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const row = i % rows;
        const perRow = Math.ceil(count / rows);
        const t = perRow > 1 ? Math.floor(i / rows) / (perRow - 1) - 0.5 : 0;
        const fade = 1 - Math.abs(t) * 1.1;
        const inner = insetAmount(row, radius) * (0.6 + 0.4 * Math.max(0.2, fade));
        sampleOutline(edge, centre + t * span * (1 - row * 0.18) + (rng() - 0.5) * radius * 0.5, s);
        spots.push({
          x: s.x - s.nx * inner + (rng() - 0.5) * radius * 0.3,
          z: s.z - s.nz * inner + (rng() - 0.5) * radius * 0.3,
          scale: 0.72 + 0.4 * Math.max(0, fade) + (rng() - 0.5) * 0.12,
        });
      }
      break;
    }
    case 'mitte': {
      // sunflower packing around the centre
      const spacing = radius * 1.25;
      for (let i = 0; i < count; i++) {
        const r = spacing * Math.sqrt(i) * 1.02;
        const a = i * 2.39996 + 0.6;
        spots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, scale: 1 - Math.min(0.2, i * 0.008) });
      }
      break;
    }
    case 'verstreut': {
      let tries = 0;
      const minDist = radius * 2.1;
      while (spots.length < count && tries < count * 60) {
        tries++;
        const x = edge.minX + rng() * (edge.maxX - edge.minX);
        const z = edge.minZ + rng() * (edge.maxZ - edge.minZ);
        if (!pointInOutline(edge, x, z)) continue;
        if (spots.some((p) => Math.hypot(p.x - x, p.z - z) < minDist)) continue;
        spots.push({ x, z, scale: 0.85 + rng() * 0.3 });
      }
      break;
    }
  }
  // never let anything hang over the edge
  return spots.filter((p) => pointInOutline(top, p.x, p.z));
}

function insetAmount(row: number, radius: number): number {
  return row * radius * 1.75;
}

/** Builds one group of toppers on the top surface (height `y`). */
export function buildToppers(cfg: TopperKonfig, eintrag: TopperEintrag, top: Outline, fillet: number, y: number, rng: Rng): THREE.Group {
  const group = new THREE.Group();
  const builder = builders[eintrag.bau];
  if (!builder) return group;
  const farbe = eintrag.faerbbar ? cfg.farbe : eintrag.standardFarbe;
  for (const spot of arrange(cfg.anordnung, cfg.anzahl, eintrag.radius, top, fillet, rng)) {
    const piece = builder(farbe, rng);
    const holder = new THREE.Group();
    holder.add(piece);
    holder.position.set(spot.x, y, spot.z);
    holder.scale.setScalar(spot.scale);
    group.add(holder);
  }
  return group;
}
