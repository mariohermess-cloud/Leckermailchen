import * as THREE from 'three';
import type { AuflegerKonfig, AuflegerMotiv } from '../modell/typen';
import { decoMaterial } from './materials';
import { topPosition, type TopArea } from './motifs';
import { emptySample, insetOutline, makeOutline, pointInOutline, sampleOutline, type Outline, type Point2 } from './outline';

/**
 * Edible photo print ("Tortenaufleger") lying on the top surface.
 * Customer photos are loaded asynchronously; `onReady` is called when one becomes available.
 */

interface Loaded {
  texture: THREE.Texture;
  aspect: number;
}

const uploads = new Map<string, Loaded | 'loading'>();
const samples = new Map<string, Loaded>();
const TEX = 1024;

function sampleTexture(motiv: AuflegerMotiv): Loaded {
  let entry = samples.get(motiv.id);
  if (!entry) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = TEX;
    const ctx = canvas.getContext('2d')!;
    motiv.zeichne(ctx, TEX);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    entry = { texture, aspect: 1 };
    samples.set(motiv.id, entry);
  }
  return entry;
}

function uploadTexture(dataUrl: string, onReady: () => void): Loaded | null {
  const entry = uploads.get(dataUrl);
  if (entry === 'loading') return null;
  if (entry) return entry;
  // keep only the current upload in memory
  uploads.forEach((old) => {
    if (old !== 'loading') old.texture.dispose();
  });
  uploads.clear();
  uploads.set(dataUrl, 'loading');
  const image = new Image();
  image.onload = () => {
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    uploads.set(dataUrl, { texture, aspect: image.naturalWidth / Math.max(1, image.naturalHeight) });
    onReady();
  };
  image.onerror = () => uploads.delete(dataUrl);
  image.src = dataUrl;
  return null;
}

/** Outline points of the print, centred on the origin. */
function printOutline(form: AuflegerKonfig['form'], halfW: number, halfD: number): Point2[] {
  const pts: Point2[] = [];
  if (form === 'rund') {
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push([Math.cos(a) * halfW, Math.sin(a) * halfD]);
    }
    return pts;
  }
  const r = Math.min(halfW, halfD) * 0.08;
  const corners: Array<[number, number, number]> = [
    [halfW - r, halfD - r, 0],
    [-halfW + r, halfD - r, Math.PI / 2],
    [-halfW + r, -halfD + r, Math.PI],
    [halfW - r, -halfD + r, Math.PI * 1.5],
  ];
  for (const [cx, cz, start] of corners) {
    for (let k = 0; k <= 6; k++) {
      const a = start + (k / 6) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  }
  return pts;
}

export function buildPhotoTopper(
  cfg: AuflegerKonfig,
  motiv: AuflegerMotiv,
  top: TopArea,
  fillet: number,
  onReady: () => void,
): THREE.Group | null {
  if (!cfg.aktiv) return null;
  const group = new THREE.Group();
  const loaded = (cfg.bild ? uploadTexture(cfg.bild, onReady) : null) ?? sampleTexture(motiv);

  const area = top.outline;
  const halfW = (area.maxX - area.minX) / 2;
  const halfD = (area.maxZ - area.minZ) / 2;

  let outline: Outline;
  let centre = { x: 0, z: 0 };
  let w: number;
  let d: number;
  if (cfg.form === 'ganz') {
    // the whole top, a little inside the edge
    outline = insetOutline(area, fillet + 0.5);
    w = (outline.maxX - outline.minX) / 2;
    d = (outline.maxZ - outline.minZ) / 2;
    centre = { x: (outline.minX + outline.maxX) / 2, z: (outline.minZ + outline.maxZ) / 2 };
  } else {
    const margin = fillet + 0.4;
    if (cfg.form === 'rund') {
      w = d = Math.max(1, Math.min(halfW, halfD) - margin) * cfg.groesse;
    } else {
      // largest rectangle with the picture's proportions whose corners stay on the cake
      const aspect = Math.min(1.8, Math.max(0.6, loaded.aspect));
      const usable = insetOutline(area, margin);
      const cx = (usable.minX + usable.maxX) / 2;
      const cz = (usable.minZ + usable.maxZ) / 2;
      w = Math.max(1, halfW - margin);
      d = w / aspect;
      if (d > halfD - margin) {
        d = Math.max(1, halfD - margin);
        w = d * aspect;
      }
      for (let i = 0; i < 40 && !pointInOutline(usable, cx + w, cz + d); i++) {
        w *= 0.96;
        d *= 0.96;
      }
      w *= cfg.groesse;
      d *= cfg.groesse;
    }
    centre = topPosition(area, cfg.x, cfg.y, Math.max(w, d) + fillet);
    outline = makeOutline(
      printOutline(cfg.form, w, d).map(([x, z]) => [x + centre.x, z + centre.z] as Point2),
      160,
    );
  }

  // flat sheet with the picture; uv covers the bounding box, the image is fitted "cover"
  const ring: THREE.Vector2[] = [];
  const position: number[] = [];
  const uv: number[] = [];
  const boxAspect = w / d;
  const imgAspect = loaded.aspect;
  const scaleU = imgAspect > boxAspect ? boxAspect / imgAspect : 1;
  const scaleV = imgAspect > boxAspect ? 1 : imgAspect / boxAspect;
  const y = top.y + 0.035;
  for (let i = 0; i < outline.n; i++) {
    const x = outline.px[i];
    const z = outline.pz[i];
    ring.push(new THREE.Vector2(x, z));
    position.push(x, y, z);
    const u = (x - centre.x) / (2 * w);
    const v = -(z - centre.z) / (2 * d);
    uv.push(0.5 + u * scaleU, 0.5 + v * scaleV);
  }
  const index: number[] = [];
  for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(ring, [])) {
    // face upwards
    const ux = ring[b].x - ring[a].x, uz = ring[b].y - ring[a].y;
    const vx = ring[c].x - ring[a].x, vz = ring[c].y - ring[a].y;
    if (uz * vx - ux * vz >= 0) index.push(a, b, c);
    else index.push(a, c, b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(position.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  geometry.setIndex(index);
  const sheet = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      map: loaded.texture,
      roughness: 0.5,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  sheet.userData.noShadow = true;
  sheet.userData.keepTexture = true;
  group.add(sheet);

  if (cfg.rand) {
    // small piped pearls framing the print
    const size = 0.5;
    const count = Math.max(8, Math.round(outline.length / (size * 0.95)));
    const pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(size / 2, 14, 10), decoMaterial(cfg.randFarbe, { roughness: 0.45 }), count);
    const s = emptySample();
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      sampleOutline(outline, (i / count) * outline.length, s);
      m.makeTranslation(s.x, top.y + size * 0.36, s.z);
      pearls.setMatrixAt(i, m);
    }
    pearls.instanceMatrix.needsUpdate = true;
    group.add(pearls);
  }
  return group;
}
