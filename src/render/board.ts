import * as THREE from 'three';
import type { PlatteEintrag } from '../modell/typen';
import { makeOutline, type Outline, type Point2 } from './outline';
import { buildTierGeometry, TierSurface } from './tierSurface';
import { woodTexture } from './textures';

export interface BoardResult {
  object: THREE.Object3D;
  /** height at which the cake starts */
  topY: number;
  /** horizontal reach, for camera framing */
  radius: number;
}

/** Outline grown outwards by `margin`, optionally with the scalloped edge of a classic gold board. */
function grow(o: Outline, margin: number, scallop: number): Outline {
  const pts: Point2[] = [];
  const waves = Math.max(8, Math.round((o.length + margin * 6) / 2.1));
  for (let i = 0; i < o.n; i++) {
    const ripple = scallop * (0.5 + 0.5 * Math.cos((i / o.n) * waves * Math.PI * 2));
    const m = margin + ripple;
    pts.push([o.px[i] + o.nx[i] * m, o.pz[i] + o.nz[i] * m]);
  }
  return makeOutline(pts, o.n);
}

/** Cake board / wooden board / cake stand under the bottom tier. */
export function buildBoard(eintrag: PlatteEintrag, bottom: Outline): BoardResult {
  const group = new THREE.Group();
  if (eintrag.art === 'keine') return { object: group, topY: 0, radius: bottom.radius };

  if (eintrag.art === 'karton') {
    const thickness = 0.35;
    const outline = grow(bottom, 2.0, 0.42);
    const surface = new TierSurface(outline, 0, thickness, 0.12);
    const material = new THREE.MeshPhysicalMaterial({
      color: eintrag.farbe,
      metalness: eintrag.metallic ? 1 : 0,
      roughness: eintrag.metallic ? 0.34 : 0.6,
      envMapIntensity: eintrag.metallic ? 2 : 1,
    });
    group.add(new THREE.Mesh(buildTierGeometry(surface, 'tile', 20), material));
    return { object: group, topY: thickness, radius: outline.radius };
  }

  if (eintrag.art === 'holz') {
    const thickness = 1.4;
    const outline = grow(bottom, 3.2, 0);
    const surface = new TierSurface(outline, 0, thickness, 0.25);
    const material = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: woodTexture(), roughness: 0.65 });
    group.add(new THREE.Mesh(buildTierGeometry(surface, 'tile', 26), material));
    return { object: group, topY: thickness, radius: outline.radius };
  }

  // cake stand: plate following the cake's shape on a turned foot
  const plateThickness = 0.7;
  const height = 8.5;
  const outline = grow(bottom, 2.6, 0);
  const material = new THREE.MeshPhysicalMaterial({ color: eintrag.farbe, roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.15 });
  const plate = new THREE.Mesh(buildTierGeometry(new TierSurface(outline, height - plateThickness, plateThickness, 0.3), 'tile', 20), material);
  const r = Math.min(bottom.radius, (bottom.maxZ - bottom.minZ) / 2) * 0.55;
  const profile: Array<[number, number]> = [
    [r * 1.0, 0], [r * 1.02, 0.3], [r * 0.82, 0.8], [r * 0.34, 1.6], [r * 0.22, 3.2], [r * 0.2, 5.2],
    [r * 0.32, 6.6], [r * 0.7, 7.5], [r * 0.9, height - plateThickness],
  ];
  const foot = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 48), material);
  // underside of the plate
  const under = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.02, 32), material);
  under.position.y = height - plateThickness;
  group.add(plate, foot, under);
  return { object: group, topY: height, radius: outline.radius };
}
