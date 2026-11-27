import * as THREE from 'three';
import { istMetallic } from '../archiv/farben';
import type { UeberzugEintrag } from '../modell/typen';
import { buttercreamNormal, combedNormal, fondantNormal, nakedTextures } from './textures';
import type { UvMode } from './tierSurface';

export interface CoatingLook {
  material: THREE.MeshPhysicalMaterial;
  uvMode: UvMode;
  /** size of one texture tile in cm */
  texSize: number;
}

/** Material for the skin of a tier, derived from the archive entry and the chosen colour. */
export function coatingMaterial(ueberzug: UeberzugEintrag, hex: string): CoatingLook {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    roughness: ueberzug.rauheit,
    metalness: 0,
    clearcoat: ueberzug.glanz,
    clearcoatRoughness: 0.12,
    sheen: ueberzug.samt,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.6),
  });
  let uvMode: UvMode = 'tile';
  let texSize = 18;

  switch (ueberzug.textur) {
    case 'buttercreme':
      material.normalMap = buttercreamNormal();
      material.normalScale = new THREE.Vector2(0.3, 0.3);
      texSize = 16;
      break;
    case 'gekaemmt':
      material.normalMap = combedNormal();
      material.normalScale = new THREE.Vector2(0.9, 0.9);
      texSize = 9;
      break;
    case 'naked': {
      const luminance = new THREE.Color(hex).getHSL({ h: 0, s: 0, l: 0 }).l;
      const tex = nakedTextures(hex, luminance < 0.35);
      material.color.set('#ffffff');
      material.map = tex.map;
      material.bumpMap = tex.bumpMap;
      material.bumpScale = 1.4;
      uvMode = 'fit';
      texSize = 34;
      break;
    }
    case 'glatt':
      material.normalMap = fondantNormal();
      material.normalScale = new THREE.Vector2(0.12, 0.12);
      texSize = 22;
      break;
  }
  return { material, uvMode, texSize };
}

export interface DecoOptions {
  roughness?: number;
  clearcoat?: number;
  sheen?: number;
}

/**
 * Material for decorations (borders, symbols, lettering, toppers).
 * Palette colours flagged as metallic (gold, silver …) automatically get a metal look.
 */
export function decoMaterial(hex: string, options: DecoOptions = {}): THREE.MeshPhysicalMaterial {
  if (istMetallic(hex)) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hex),
      metalness: 1,
      envMapIntensity: 2.2,
      roughness: 0.3,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    metalness: 0,
    roughness: options.roughness ?? 0.55,
    clearcoat: options.clearcoat ?? 0,
    clearcoatRoughness: 0.15,
    sheen: options.sheen ?? 0.25,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.6),
  });
}

/** Glossy ganache / glaze used for drips. */
export function dripMaterial(hex: string): THREE.MeshPhysicalMaterial {
  if (istMetallic(hex)) return decoMaterial(hex);
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    roughness: 0.2,
    metalness: 0,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
  });
}
