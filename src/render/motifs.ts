import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import type { SymbolEintrag, SymbolKonfig } from '../modell/typen';
import { extrudeFlat, layFlat, tessellate, wrapOntoWall } from './flat';
import { decoMaterial } from './materials';
import { arcAtAngle, type Outline } from './outline';
import type { TierSurface } from './tierSurface';

const LAYER_DEPTH = 0.17;
const LAYER_STEP = 0.13;

const shapeCache = new Map<string, THREE.Shape[]>();
const svgLoader = new SVGLoader();

/**
 * SVG path (0…100 box, y down) -> shapes centred on the origin, y up, scaled to 1 unit.
 * Every sub-path becomes its own solid piece (overlapping sub-paths are fine, holes are not used).
 */
export function shapesFromPath(d: string): THREE.Shape[] {
  let shapes = shapeCache.get(d);
  if (shapes) return shapes;
  shapes = [];
  const subPaths = d.split(/(?=M)/).filter((part) => part.trim().length > 0);
  for (const sub of subPaths) {
    const data = svgLoader.parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${sub}"/></svg>`);
    for (const path of data.paths) {
      for (const shape of SVGLoader.createShapes(path)) {
        const pts = shape.getPoints(10).map((p) => new THREE.Vector2((p.x - 50) / 100, (50 - p.y) / 100));
        if (pts.length >= 3) shapes.push(new THREE.Shape(pts));
      }
    }
  }
  shapeCache.set(d, shapes);
  return shapes;
}

interface Layer {
  geometry: THREE.BufferGeometry;
  farbe: string;
}

/** Flat, layered fondant cut-out of a symbol, `size` cm across, in its own plane. */
function buildLayers(eintrag: SymbolEintrag, cfg: SymbolKonfig, size: number, depthScale = 1): Layer[] {
  return eintrag.ebenen.map((ebene) => {
    const shapes = shapesFromPath(ebene.d);
    const geometry = extrudeFlat(shapes, LAYER_DEPTH * depthScale, 0.05 * depthScale, 6);
    geometry.scale(size, size, 1);
    geometry.translate(0, 0, ebene.ebene * LAYER_STEP * depthScale);
    const farbe = ebene.farbe === 'farbe' ? cfg.farbe : ebene.farbe === 'farbe2' ? cfg.farbe2 : ebene.farbe;
    return { geometry, farbe };
  });
}

export interface TopArea {
  outline: Outline;
  y: number;
}

/** Position on the top surface from normalised coordinates (-1…1; y = back…front). */
export function topPosition(area: Outline, x: number, y: number, margin = 0): { x: number; z: number } {
  const halfW = Math.max(0, (area.maxX - area.minX) / 2 - margin);
  const halfD = Math.max(0, (area.maxZ - area.minZ) / 2 - margin);
  return {
    x: (area.minX + area.maxX) / 2 + x * halfW,
    z: (area.minZ + area.maxZ) / 2 + y * halfD,
  };
}

/** Builds all instances of one configured symbol. */
export function buildMotif(cfg: SymbolKonfig, eintrag: SymbolEintrag, surface: TierSurface, top: TopArea): THREE.Group {
  const group = new THREE.Group();
  const size = cfg.groesse;
  const materials = new Map<string, THREE.Material>();
  const material = (farbe: string) => {
    let m = materials.get(farbe);
    if (!m) {
      m = decoMaterial(farbe, { roughness: 0.6, sheen: 0.3 });
      materials.set(farbe, m);
    }
    return m;
  };

  if (cfg.ort === 'oben') {
    const p = topPosition(top.outline, cfg.x, cfg.y, size * 0.35);
    for (const layer of buildLayers(eintrag, cfg, size)) {
      layFlat(layer.geometry, p.x, top.y, p.z, cfg.drehung);
      group.add(new THREE.Mesh(layer.geometry, material(layer.farbe)));
    }
    return group;
  }

  if (cfg.ort === 'stehend') {
    // an upright cut-out, a bit thicker so it reads as a sturdy fondant piece
    const p = topPosition(top.outline, cfg.x, cfg.y, size * 0.2);
    const layers = buildLayers(eintrag, cfg, size, 1.6);
    // all layers share one transform so they stay registered
    const holder = new THREE.Group();
    let minY = Infinity;
    for (const layer of layers) {
      layer.geometry.computeBoundingBox();
      minY = Math.min(minY, layer.geometry.boundingBox!.min.y);
      holder.add(new THREE.Mesh(layer.geometry, material(layer.farbe)));
    }
    holder.position.set(p.x, top.y - minY - size * 0.03, p.z);
    holder.rotation.y = (-cfg.drehung * Math.PI) / 180;
    group.add(holder);
    return group;
  }

  // on the wall, repeated evenly around the cake
  const o = surface.outline;
  const half = size / 2;
  const room = surface.sideHeight;
  let p = cfg.hoehe * room;
  if (room > size + 0.3) p = Math.min(Math.max(p, half + 0.15), room - half - 0.1);
  const start = arcAtAngle(o, cfg.winkel);
  const count = Math.max(1, cfg.anzahl);
  const flat = buildLayers(eintrag, cfg, size).map((layer) => ({
    farbe: layer.farbe,
    geometry: tessellate(layer.geometry, Math.max(0.25, size / 14), 4),
  }));
  for (let i = 0; i < count; i++) {
    const s = start + (i / count) * o.length;
    for (const layer of flat) {
      const g = layer.geometry.clone();
      if (cfg.drehung !== 0) g.rotateZ((-cfg.drehung * Math.PI) / 180);
      wrapOntoWall(g, surface, s, p, 0.005);
      group.add(new THREE.Mesh(g, material(layer.farbe)));
    }
  }
  flat.forEach((layer) => layer.geometry.dispose());
  return group;
}


