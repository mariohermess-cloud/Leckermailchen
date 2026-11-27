import * as THREE from 'three';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { emptySurfacePoint, type TierSurface } from './tierSurface';

/**
 * Helpers for flat pieces (fondant cut-outs, lettering, plaques).
 * A flat piece is modelled in its own plane: x = right, y = up, z = thickness (0 = back).
 * It can then be laid on the top, stood upright, or wrapped onto the wall.
 */

export function extrudeFlat(shapes: THREE.Shape[], depth: number, bevel: number, curveSegments = 8): THREE.BufferGeometry {
  const b = Math.min(bevel, depth * 0.49);
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: Math.max(0.001, depth - 2 * b),
    bevelEnabled: b > 0.001,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: -b,
    bevelSegments: 3,
    curveSegments,
  });
  geometry.translate(0, 0, b);
  return geometry;
}

/** Splits long edges so the piece can be bent smoothly. */
export function tessellate(geometry: THREE.BufferGeometry, maxEdge: number, iterations = 4): THREE.BufferGeometry {
  const modifier = new TessellateModifier(maxEdge, iterations);
  const result = modifier.modify(geometry);
  if (result !== geometry) geometry.dispose();
  return result;
}

/**
 * Curves a flat piece within its own plane: a straight baseline becomes an arc.
 * `curvature` = 1 / radius; positive bends the ends downwards (an arch), negative upwards.
 */
export function bendInPlane(geometry: THREE.BufferGeometry, curvature: number): void {
  if (Math.abs(curvature) < 1e-5) return;
  const radius = 1 / curvature;
  const pos = geometry.getAttribute('position');
  const nor = geometry.getAttribute('normal');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const a = x / radius;
    const r = radius + y;
    const sin = Math.sin(a);
    const cos = Math.cos(a);
    pos.setXY(i, r * sin, r * cos - radius);
    if (nor) {
      const nx = nor.getX(i);
      const ny = nor.getY(i);
      nor.setXY(i, nx * cos + ny * sin, -nx * sin + ny * cos);
    }
  }
  pos.needsUpdate = true;
  if (nor) nor.needsUpdate = true;
}

/** Lays a flat piece onto a horizontal surface at height `y`, readable from the front. */
export function layFlat(geometry: THREE.BufferGeometry, x: number, y: number, z: number, rotationDeg: number): void {
  const m = new THREE.Matrix4()
    .makeTranslation(x, y, z)
    .multiply(new THREE.Matrix4().makeRotationY((-rotationDeg * Math.PI) / 180))
    .multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  geometry.applyMatrix4(m);
}

/** Stands a flat piece upright (facing the front) with its lowest point at height `y`. */
export function standUp(geometry: THREE.BufferGeometry, x: number, y: number, z: number, rotationDeg: number, sink = 0): void {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const m = new THREE.Matrix4()
    .makeTranslation(x, y - box.min.y - sink, z)
    .multiply(new THREE.Matrix4().makeRotationY((-rotationDeg * Math.PI) / 180))
    .multiply(new THREE.Matrix4().makeTranslation(0, 0, -(box.min.z + box.max.z) / 2));
  geometry.applyMatrix4(m);
}

/**
 * Wraps a flat piece onto the wall of a tier.
 * The piece's x axis runs around the cake (centre at arc length `s`), its y axis up the profile
 * (centre at `p`), its thickness points outwards. The geometry must be tessellated first.
 */
export function wrapOntoWall(geometry: THREE.BufferGeometry, surface: TierSurface, s: number, p: number, lift = 0.0): void {
  const pos = geometry.getAttribute('position');
  const nor = geometry.getAttribute('normal');
  const pt = emptySurfacePoint();
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const ly = pos.getY(i);
    const lz = pos.getZ(i);
    surface.at(s + lx, p + ly, lz + lift, pt);
    pos.setXYZ(i, pt.x, pt.y, pt.z);
    if (nor) {
      const nx = nor.getX(i);
      const ny = nor.getY(i);
      const nz = nor.getZ(i);
      // local frame on the surface: tangent, "up along the profile", outward normal.
      // On the wall "up" is vertical; on the rounded edge it tilts inwards.
      const horizontal = Math.hypot(pt.nx, pt.nz);
      const upx = horizontal > 1e-9 ? (-pt.nx / horizontal) * pt.ny : 0;
      const upz = horizontal > 1e-9 ? (-pt.nz / horizontal) * pt.ny : 0;
      const upy = horizontal;
      nor.setXYZ(
        i,
        nx * pt.tx + ny * upx + nz * pt.nx,
        ny * upy + nz * pt.ny,
        nx * pt.tz + ny * upz + nz * pt.nz,
      );
    }
  }
  pos.needsUpdate = true;
  if (nor) nor.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

export function sizeOf(geometry: THREE.BufferGeometry): THREE.Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
}

/** Centres a flat piece on the origin in x and y (thickness is left alone). */
export function centreFlat(geometry: THREE.BufferGeometry): THREE.Box3 {
  const box = sizeOf(geometry);
  geometry.translate(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, 0);
  return sizeOf(geometry);
}
