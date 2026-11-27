import * as THREE from 'three';
import type { StreuselEintrag, StreuselKonfig, StreuselPalette } from '../modell/typen';
import { emptySample, insetOutline, pointInOutline, sampleOutline } from './outline';
import type { Rng } from './random';
import { emptySurfacePoint, type TierSurface } from './tierSurface';

function sprinkleGeometry(art: StreuselEintrag['art']): { geometry: THREE.BufferGeometry; thickness: number } {
  switch (art) {
    case 'perlen':
      return { geometry: new THREE.SphereGeometry(0.13, 10, 8), thickness: 0.13 };
    case 'konfetti':
      return { geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.05, 12).rotateZ(Math.PI / 2), thickness: 0.03 };
    case 'sterne': {
      const shape = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.27 : 0.12;
        const a = (i / 10) * Math.PI * 2;
        if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const g = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
      // lie in the y/z plane like the other pieces (thin along x)
      g.translate(0, 0, -0.03).rotateY(Math.PI / 2);
      return { geometry: g, thickness: 0.03 };
    }
    case 'mandeln': {
      // flaked almonds: thin, slightly irregular ovals
      const g = new THREE.SphereGeometry(1, 10, 6);
      g.scale(0.035, 0.62, 0.36);
      return { geometry: g, thickness: 0.035 };
    }
    case 'raspel': {
      // chocolate shavings: small flat shards
      const g = new THREE.BoxGeometry(0.05, 0.42, 0.17);
      return { geometry: g, thickness: 0.03 };
    }
    default:
      // rod-shaped sugar strands; long axis = y
      return { geometry: new THREE.CapsuleGeometry(0.075, 0.36, 3, 8), thickness: 0.075 };
  }
}

/**
 * Scatters sprinkles on the top of `top` and/or around the foot of `bottom`.
 * Every piece is modelled with its thin axis along local x, so local x is aligned with the
 * surface normal and the piece is spun randomly around it.
 */
export function buildSprinkles(
  top: TierSurface,
  bottom: TierSurface,
  cfg: StreuselKonfig,
  eintrag: StreuselEintrag,
  palette: StreuselPalette,
  rng: Rng,
  topLift: number,
): THREE.Object3D | null {
  if (eintrag.art === 'keine' || cfg.menge <= 0) return null;
  const { geometry, thickness } = sprinkleGeometry(eintrag.art);
  const rod = eintrag.art === 'staebchen';
  // almond flakes and chocolate shavings are pressed on densely
  const dense = eintrag.art === 'mandeln' || eintrag.art === 'raspel' ? 2.2 : 1;

  const placements: Array<{ pos: THREE.Vector3; normal: THREE.Vector3; tangent: THREE.Vector3 }> = [];
  const s = emptySample();

  const onTop = cfg.bereich === 'oben' || cfg.bereich === 'ueberall';
  const onRim = cfg.bereich === 'obenRand';
  const onSide = cfg.bereich === 'seiteUnten' || cfg.bereich === 'ueberall';
  const onWholeSide = cfg.bereich === 'seiteGanz';

  if (onTop) {
    const area = insetOutline(top.outline, top.fillet + 0.25);
    const w = area.maxX - area.minX;
    const d = area.maxZ - area.minZ;
    const target = Math.round(w * d * 0.75 * (0.25 + 1.5 * cfg.menge));
    let tries = 0;
    while (placements.length < target && tries < target * 6) {
      tries++;
      const x = area.minX + rng() * w;
      const z = area.minZ + rng() * d;
      if (!pointInOutline(area, x, z)) continue;
      placements.push({
        pos: new THREE.Vector3(x, top.topY + topLift + thickness * 0.8, z),
        normal: new THREE.Vector3(0, 1, 0),
        tangent: new THREE.Vector3(1, 0, 0),
      });
    }
  }
  if (onRim) {
    const band = 2.6;
    const target = Math.round(top.outline.length * band * (0.25 + 1.6 * cfg.menge));
    for (let i = 0; i < target; i++) {
      sampleOutline(top.outline, rng() * top.outline.length, s);
      const inset = top.fillet + 0.2 + Math.pow(rng(), 1.6) * band;
      placements.push({
        pos: new THREE.Vector3(s.x - s.nx * inset, top.topY + topLift + thickness * 0.8, s.z - s.nz * inset),
        normal: new THREE.Vector3(0, 1, 0),
        tangent: new THREE.Vector3(1, 0, 0),
      });
    }
  }
  if (onSide) {
    const band = Math.min(bottom.sideHeight * 0.6, 6);
    const target = Math.round(bottom.outline.length * band * (0.15 + 0.9 * cfg.menge));
    const pt = emptySurfacePoint();
    for (let i = 0; i < target; i++) {
      const p = 0.12 + Math.pow(rng(), 2.3) * band;
      bottom.at(rng() * bottom.outline.length, p, thickness * 0.75, pt);
      placements.push({
        pos: new THREE.Vector3(pt.x, pt.y, pt.z),
        normal: new THREE.Vector3(pt.nx, pt.ny, pt.nz),
        tangent: new THREE.Vector3(pt.tx, 0, pt.tz),
      });
    }
  }
  if (onWholeSide) {
    const band = bottom.sideHeight;
    const target = Math.min(9000, Math.round(bottom.outline.length * band * (0.35 + 1.9 * cfg.menge) * dense));
    const pt = emptySurfacePoint();
    for (let i = 0; i < target; i++) {
      bottom.at(rng() * bottom.outline.length, 0.1 + rng() * (band - 0.1), thickness * (0.8 + rng() * 0.8), pt);
      placements.push({
        pos: new THREE.Vector3(pt.x, pt.y, pt.z),
        normal: new THREE.Vector3(pt.nx, pt.ny, pt.nz),
        tangent: new THREE.Vector3(pt.tx, 0, pt.tz),
      });
    }
  }
  if (placements.length === 0) return null;

  const metallic = palette.metallic === true && !eintrag.farben;
  const material = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: metallic ? 0.3 : eintrag.farben ? 0.6 : 0.42,
    metalness: metallic ? 1 : 0,
    clearcoat: metallic || eintrag.farben ? 0 : 0.35,
    clearcoatRoughness: 0.3,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  const colors = (eintrag.farben ?? palette.farben).map((hex) => new THREE.Color(hex));
  const m = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const spin = new THREE.Quaternion();
  const tilt = new THREE.Quaternion();
  const bitangent = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);

  placements.forEach((pl, i) => {
    // local x -> surface normal, local y -> tangent
    bitangent.crossVectors(pl.normal, pl.tangent).normalize();
    m.makeBasis(pl.normal, pl.tangent, bitangent);
    quat.setFromRotationMatrix(m);
    spin.setFromAxisAngle(xAxis, rng() * Math.PI * 2);
    quat.multiply(spin);
    if (rod || dense > 1) {
      tilt.setFromAxisAngle(zAxis, (rng() - 0.5) * (rod ? 0.35 : 0.7));
      quat.multiply(tilt);
    }
    const k = 0.8 + rng() * 0.5;
    scale.set(k, k, k);
    m.compose(pl.pos, quat, scale);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, colors[Math.floor(rng() * colors.length)]);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}
