import * as THREE from 'three';
import { archiv, finde } from '../archiv';
import type { KuchenKonfig } from '../modell/typen';
import { buildBoard } from './board';
import { buildDrip, DRIP_THICKNESS } from './drip';
import { buildLettering, loadFont } from './lettering';
import { coatingMaterial, dripMaterial } from './materials';
import { buildMotif, type TopArea } from './motifs';
import { makeOutline, scaleOutline, type Outline } from './outline';
import { buildPhotoTopper } from './photoTopper';
import { buildBorder } from './piping';
import { mulberry32 } from './random';
import { buildSprinkles } from './sprinkles';
import { buildTierGeometry, TierSurface } from './tierSurface';
import { buildToppers } from './toppers';

export interface CakeBuild {
  group: THREE.Group;
  /** for camera framing */
  radius: number;
  height: number;
  /** vertical centre of the cake itself */
  centreY: number;
}

const unitOutlines = new Map<string, Outline>();

function unitOutline(formId: string): Outline {
  let o = unitOutlines.get(formId);
  if (!o) {
    o = makeOutline(finde(archiv.formen, formId).umriss(), 360);
    unitOutlines.set(formId, o);
  }
  return o;
}

/**
 * Turns a configuration into a 3D model. Pure function of the configuration (plus the seed in
 * it), apart from assets that load asynchronously (fonts, uploaded photo): when one of those
 * becomes available `requestRebuild` is called.
 */
export function buildCake(cfg: KuchenKonfig, requestRebuild: () => void): CakeBuild {
  const group = new THREE.Group();
  const unit = unitOutline(cfg.form);

  const bottomOutline = scaleOutline(unit, cfg.etagen[0].durchmesser / 2);
  const board = buildBoard(finde(archiv.platten, cfg.platte.typ), bottomOutline);
  group.add(board.object);

  let y = board.topY;
  const surfaces: TierSurface[] = [];
  const lifts: number[] = [];

  cfg.etagen.forEach((etage, i) => {
    const rng = mulberry32(cfg.seed * 7919 + i * 104729 + 13);
    const outline = i === 0 ? bottomOutline : scaleOutline(unit, etage.durchmesser / 2);
    const ueberzug = finde(archiv.ueberzuege, etage.ueberzug);
    const surface = new TierSurface(outline, y, etage.hoehe, ueberzug.kante);
    surfaces.push(surface);

    const look = coatingMaterial(ueberzug, etage.farbe);
    group.add(new THREE.Mesh(buildTierGeometry(surface, look.uvMode, look.texSize), look.material));

    const lift = etage.drip.aktiv ? DRIP_THICKNESS : 0;
    lifts.push(lift);
    if (etage.drip.aktiv) {
      group.add(new THREE.Mesh(buildDrip(surface, etage.drip, rng), dripMaterial(etage.drip.farbe)));
    }

    const unten = buildBorder(surface, 'unten', finde(archiv.bordueren, etage.borduereUnten.typ), etage.borduereUnten.farbe, rng);
    if (unten) group.add(unten);
    const oben = buildBorder(surface, 'oben', finde(archiv.bordueren, etage.borduereOben.typ), etage.borduereOben.farbe, rng, lift);
    if (oben) group.add(oben);

    y += etage.hoehe;
  });

  const topSurface = surfaces[surfaces.length - 1];
  const topLift = lifts[lifts.length - 1];
  const top: TopArea = { outline: topSurface.outline, y: topSurface.topY + topLift };
  const rng = mulberry32(cfg.seed * 15485863 + 101);

  const photo = buildPhotoTopper(cfg.aufleger, finde(archiv.auflegerMotive, cfg.aufleger.motiv), top, topSurface.fillet, requestRebuild);
  if (photo) group.add(photo);

  const sprinkles = buildSprinkles(
    topSurface,
    surfaces[0],
    cfg.streusel,
    finde(archiv.streusel, cfg.streusel.typ),
    finde(archiv.streuselPaletten, cfg.streusel.palette),
    rng,
    topLift,
  );
  if (sprinkles) group.add(sprinkles);

  for (const t of cfg.topper) {
    group.add(buildToppers(t, finde(archiv.topper, t.typ), top.outline, topSurface.fillet, top.y, rng));
  }

  for (const s of cfg.symbole) {
    const surface = surfaces[Math.min(s.etage, surfaces.length - 1)];
    group.add(buildMotif(s, finde(archiv.symbole, s.symbol), surface, top));
  }

  for (const s of cfg.schrift) {
    const eintrag = finde(archiv.schriften, s.schrift);
    const surface = surfaces[Math.min(s.etage, surfaces.length - 1)];
    const result = buildLettering(s, eintrag, finde(archiv.schilder, s.schild), surface, top);
    group.add(result.group);
    if (!result.ready) loadFont(eintrag).then(requestRebuild, () => undefined);
  }

  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const quiet = mesh.userData.noShadow === true;
    mesh.castShadow = !quiet;
    mesh.receiveShadow = true;
  });

  // tall decorations (candles, toppers on sticks) are included via a generous allowance
  const cakeHeight = y - board.topY;
  return {
    group,
    radius: Math.max(board.radius, bottomOutline.radius),
    height: y + 4,
    centreY: board.topY + cakeHeight / 2,
  };
}

/** Frees GPU resources of a built cake (shared procedural textures and cached geometries stay). */
export function disposeCake(group: THREE.Group): void {
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.geometry.userData.shared) mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => material.dispose());
  });
}
