import * as THREE from 'three';
import { parse as parseFont, type Font } from 'opentype.js';
import { schriften } from '../archiv/schriften';
import type { SchildEintrag, SchriftEintrag, SchriftKonfig } from '../modell/typen';
import { bendInPlane, centreFlat, extrudeFlat, layFlat, sizeOf, tessellate, wrapOntoWall } from './flat';
import { decoMaterial } from './materials';
import { topPosition, type TopArea } from './motifs';
import { arcAtAngle } from './outline';
import type { TierSurface } from './tierSurface';

/* ---------- fonts ---------- */

const fonts = new Map<string, Font>();
const pending = new Map<string, Promise<Font>>();

async function readFile(url: string): Promise<ArrayBuffer> {
  if (url.startsWith('data:')) {
    // single-file build: the font is embedded, decode it without a network request
    const base64 = url.slice(url.indexOf(',') + 1);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Schrift konnte nicht geladen werden: ${url}`);
  return response.arrayBuffer();
}

/** Loads a font once: as 3D outlines for the cake and as a CSS font for the controls. */
export function loadFont(eintrag: SchriftEintrag): Promise<Font> {
  const ready = fonts.get(eintrag.id);
  if (ready) return Promise.resolve(ready);
  let promise = pending.get(eintrag.id);
  if (!promise) {
    promise = readFile(eintrag.datei).then((buffer) => {
      // slice(): FontFace below takes ownership of its own copy
      const font = parseFont(buffer.slice(0));
      fonts.set(eintrag.id, font);
      if (typeof FontFace !== 'undefined') {
        const face = new FontFace(eintrag.familie, buffer);
        face.load().then((loaded) => document.fonts.add(loaded)).catch(() => undefined);
      }
      return font;
    });
    pending.set(eintrag.id, promise);
  }
  return promise;
}

export function loadAllFonts(): Promise<unknown> {
  return Promise.allSettled(schriften.map(loadFont));
}

export function fontReady(id: string): Font | undefined {
  return fonts.get(id);
}

/* ---------- plaques ---------- */

/** Outline of a name plaque with half extents (w, h). */
export function plaqueShape(art: SchildEintrag['art'], w: number, h: number): THREE.Shape | null {
  const shape = new THREE.Shape();
  switch (art) {
    case 'oval':
      shape.absellipse(0, 0, w * 1.12, h * 1.18, 0, Math.PI * 2, false, 0);
      return shape;
    case 'rechteck': {
      const r = Math.min(w, h) * 0.38;
      shape.moveTo(-w + r, -h);
      shape.lineTo(w - r, -h);
      shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false);
      shape.lineTo(w, h - r);
      shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
      shape.lineTo(-w + r, h);
      shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false);
      shape.lineTo(-w, -h + r);
      shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
      return shape;
    }
    case 'geschweift': {
      // classic plaque: corners scooped out
      const r = h * 0.42;
      const ww = w + r * 0.6;
      shape.moveTo(-ww + r, -h);
      shape.lineTo(ww - r, -h);
      shape.absarc(ww, -h, r, Math.PI, Math.PI / 2, true);
      shape.lineTo(ww, h - r);
      shape.absarc(ww, h, r, -Math.PI / 2, Math.PI, true);
      shape.lineTo(-ww + r, h);
      shape.absarc(-ww, h, r, 0, -Math.PI / 2, true);
      shape.lineTo(-ww, -h + r);
      shape.absarc(-ww, -h, r, Math.PI / 2, 0, true);
      return shape;
    }
    case 'wolke': {
      // scalloped oval
      const a = w * 1.08;
      const b = h * 1.1;
      const bumps = Math.max(8, Math.round(((a + b) * Math.PI) / (h * 0.95) / 2) * 2);
      const pts: THREE.Vector2[] = [];
      const steps = bumps * 12;
      for (let i = 0; i < steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const ex = Math.cos(t) * a;
        const ey = Math.sin(t) * b;
        const nx = Math.cos(t) / a;
        const ny = Math.sin(t) / b;
        const nl = Math.hypot(nx, ny);
        const bump = Math.abs(Math.sin((t * bumps) / 2)) * h * 0.26;
        pts.push(new THREE.Vector2(ex + (nx / nl) * bump, ey + (ny / nl) * bump));
      }
      return new THREE.Shape(pts);
    }
    case 'banner': {
      const e = h * 0.9;
      const notch = h * 0.55;
      shape.moveTo(-w - e, -h);
      shape.lineTo(w + e, -h);
      shape.lineTo(w + e - notch, 0);
      shape.lineTo(w + e, h);
      shape.lineTo(-w - e, h);
      shape.lineTo(-w - e + notch, 0);
      shape.closePath();
      return shape;
    }
    default:
      return null;
  }
}

/* ---------- lettering ---------- */

export interface LetteringResult {
  group: THREE.Group;
  /** false while the font is still loading */
  ready: boolean;
}

/** Outlines of a line of text (with kerning) as shapes; x to the right, y up, in cm. */
function textShapes(font: Font, text: string, em: number): THREE.Shape[] {
  const path = new THREE.ShapePath();
  // opentype works with y pointing down; flip it
  for (const c of font.getPath(text, 0, 0, em).commands) {
    switch (c.type) {
      case 'M':
        path.moveTo(c.x!, -c.y!);
        break;
      case 'L':
        path.lineTo(c.x!, -c.y!);
        break;
      case 'Q':
        path.quadraticCurveTo(c.x1!, -c.y1!, c.x!, -c.y!);
        break;
      case 'C':
        path.bezierCurveTo(c.x1!, -c.y1!, c.x2!, -c.y2!, c.x!, -c.y!);
        break;
      case 'Z':
        break;
    }
  }
  // contours nested inside another contour become holes (the counters of a, e, o …)
  return path.toShapes();
}

function textGeometry(font: Font, text: string, em: number, depth: number, bevel: number): THREE.BufferGeometry | null {
  const shapes = textShapes(font, text, em);
  if (shapes.length === 0) return null;
  const geometry = extrudeFlat(shapes, depth, bevel, 5);
  centreFlat(geometry);
  return geometry;
}

/**
 * Lettering in real relief: piped / fondant letters on the top or the wall, a thin topper on
 * sticks, or chunky standing characters (the age number). Optionally on a name plaque.
 */
export function buildLettering(
  cfg: SchriftKonfig,
  eintrag: SchriftEintrag,
  schild: SchildEintrag,
  surface: TierSurface,
  top: TopArea,
): LetteringResult {
  const group = new THREE.Group();
  const text = cfg.text.trim();
  if (!text) return { group, ready: true };
  const font = fontReady(eintrag.id);
  if (!font) return { group, ready: false };

  const em = cfg.groesse * 1.3;
  const material = decoMaterial(cfg.farbe, { roughness: 0.45, sheen: 0.2 });

  if (cfg.ort === 'stehend') {
    // chunky fondant characters standing on the cake
    const depth = Math.max(0.5, cfg.groesse * 0.26);
    const geometry = textGeometry(font, text, em, depth, Math.min(0.14, cfg.groesse * 0.04));
    if (!geometry) return { group, ready: true };
    const box = sizeOf(geometry);
    const p = topPosition(top.outline, cfg.x, cfg.versatz, 0.5);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(p.x, top.y - box.min.y - cfg.groesse * 0.02, p.z);
    mesh.rotation.y = (-cfg.drehung * Math.PI) / 180;
    geometry.translate(0, 0, -depth / 2);
    group.add(mesh);
    return { group, ready: true };
  }

  if (cfg.ort === 'stecker') {
    // thin cut-out lettering held up by two sticks
    const depth = 0.16;
    const geometry = textGeometry(font, text, em, depth, 0.02);
    if (!geometry) return { group, ready: true };
    if (cfg.bogen !== 0) {
      const curved = tessellate(geometry, Math.max(0.3, cfg.groesse * 0.4), 3);
      bendInPlane(curved, cfg.bogen / (sizeOf(curved).max.x * 1.6 + 1));
      return standTopper(curved, cfg, material, top, group);
    }
    return standTopper(geometry, cfg, material, top, group);
  }

  const depth = Math.min(0.5, Math.max(0.07, cfg.groesse * 0.075));
  let geometry = textGeometry(font, text, em, depth, depth * 0.42);
  if (!geometry) return { group, ready: true };

  if (cfg.ort === 'seite') {
    geometry = tessellate(geometry, Math.max(0.22, cfg.groesse * 0.22), 4);
    const box = sizeOf(geometry);
    if (cfg.bogen !== 0) bendInPlane(geometry, cfg.bogen / (box.max.x * 1.6 + 1));
    const room = surface.sideHeight;
    const half = (box.max.y - box.min.y) / 2;
    let p = (0.5 + cfg.versatz * 0.5) * room;
    if (room > half * 2 + 0.3) p = Math.min(Math.max(p, half + 0.15), room - half - 0.1);
    wrapOntoWall(geometry, surface, arcAtAngle(surface.outline, cfg.x * 180), p, 0.004);
    group.add(new THREE.Mesh(geometry, material));
    return { group, ready: true };
  }

  // lying on the top surface
  let box = sizeOf(geometry);
  const p = topPosition(top.outline, cfg.x, cfg.versatz, 0.5);
  const plaque = schild.art === 'kein' ? null : plaqueShape(schild.art, box.max.x + cfg.groesse * 0.42, box.max.y + cfg.groesse * 0.36);
  if (plaque) {
    const plaqueDepth = 0.26;
    const plaqueGeometry = extrudeFlat([plaque], plaqueDepth, 0.07, 16);
    layFlat(plaqueGeometry, p.x, top.y, p.z, cfg.drehung);
    group.add(new THREE.Mesh(plaqueGeometry, decoMaterial(cfg.schildFarbe, { roughness: 0.62, sheen: 0.3 })));
    geometry.translate(0, 0, plaqueDepth - 0.01);
  } else if (cfg.bogen !== 0) {
    geometry = tessellate(geometry, Math.max(0.22, cfg.groesse * 0.22), 4);
    box = sizeOf(geometry);
    bendInPlane(geometry, cfg.bogen / (box.max.x * 1.6 + 1));
  }
  layFlat(geometry, p.x, top.y, p.z, cfg.drehung);
  group.add(new THREE.Mesh(geometry, material));
  return { group, ready: true };
}

function standTopper(
  geometry: THREE.BufferGeometry,
  cfg: SchriftKonfig,
  material: THREE.Material,
  top: TopArea,
  group: THREE.Group,
): LetteringResult {
  const box = sizeOf(geometry);
  const width = box.max.x - box.min.x;
  const stickHeight = Math.max(3.2, cfg.groesse * 1.5);
  const p = topPosition(top.outline, cfg.x, cfg.versatz, 0.5);
  const holder = new THREE.Group();
  const lettering = new THREE.Mesh(geometry, material);
  lettering.position.y = stickHeight - box.min.y;
  holder.add(lettering);
  const stickGeometry = new THREE.CylinderGeometry(0.07, 0.07, stickHeight + (box.max.y - box.min.y) * 0.45, 8);
  for (const side of [-1, 1]) {
    const stick = new THREE.Mesh(stickGeometry, material);
    stick.position.set(side * width * 0.3, (stickHeight + (box.max.y - box.min.y) * 0.45) / 2 - 0.4, -0.02);
    holder.add(stick);
  }
  holder.position.set(p.x, top.y, p.z);
  holder.rotation.y = (-cfg.drehung * Math.PI) / 180;
  holder.rotation.x = -0.06;
  group.add(holder);
  return { group, ready: true };
}
