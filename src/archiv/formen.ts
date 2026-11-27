import type { FormEintrag } from '../modell/typen';

type Punkt = [number, number];

function kreis(rx: number, rz: number, schritte = 180): Punkt[] {
  const p: Punkt[] = [];
  for (let i = 0; i < schritte; i++) {
    const a = (i / schritte) * Math.PI * 2;
    p.push([Math.cos(a) * rx, Math.sin(a) * rz]);
  }
  return p;
}

/** Vieleck mit abgerundeten Ecken (jeder echte Kuchen hat leicht runde Kanten). */
export function rundesVieleck(ecken: Punkt[], radius: number, schritteProEcke = 12): Punkt[] {
  const p: Punkt[] = [];
  const n = ecken.length;
  for (let i = 0; i < n; i++) {
    const v = ecken[i];
    const a = ecken[(i + n - 1) % n];
    const b = ecken[(i + 1) % n];
    const d1 = norm([a[0] - v[0], a[1] - v[1]]);
    const d2 = norm([b[0] - v[0], b[1] - v[1]]);
    const halb = Math.acos(Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1]))) / 2;
    const t = radius / Math.tan(halb);
    const mitteRichtung = norm([d1[0] + d2[0], d1[1] + d2[1]]);
    const c: Punkt = [v[0] + (mitteRichtung[0] * radius) / Math.sin(halb), v[1] + (mitteRichtung[1] * radius) / Math.sin(halb)];
    const t1: Punkt = [v[0] + d1[0] * t, v[1] + d1[1] * t];
    const t2: Punkt = [v[0] + d2[0] * t, v[1] + d2[1] * t];
    const w1 = Math.atan2(t1[1] - c[1], t1[0] - c[0]);
    const w2 = Math.atan2(t2[1] - c[1], t2[0] - c[0]);
    let diff = w2 - w1;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    for (let k = 0; k <= schritteProEcke; k++) {
      const w = w1 + (diff * k) / schritteProEcke;
      p.push([c[0] + Math.cos(w) * radius, c[1] + Math.sin(w) * radius]);
    }
  }
  return p;
}

function norm(v: Punkt): Punkt {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
}

function herz(): Punkt[] {
  // klassische Herzkurve; Spitze zeigt zum Betrachter (+z)
  const roh: Punkt[] = [];
  const schritte = 240;
  for (let i = 0; i < schritte; i++) {
    const t = (i / schritte) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    roh.push([x, -y]);
  }
  // auf Breite 2 normieren und auf den Flächenschwerpunkt zentrieren
  let minX = Infinity, maxX = -Infinity;
  for (const [x] of roh) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
  const s = 2 / (maxX - minX);
  let fl = 0, cz = 0;
  for (let i = 0; i < roh.length; i++) {
    const [x1, z1] = roh[i];
    const [x2, z2] = roh[(i + 1) % roh.length];
    const k = x1 * z2 - x2 * z1;
    fl += k;
    cz += (z1 + z2) * k;
  }
  cz /= 3 * fl;
  return roh.map(([x, z]) => [x * s, (z - cz) * s] as Punkt);
}

function regelmaessig(ecken: number, radius: number, start = 0): Punkt[] {
  const p: Punkt[] = [];
  for (let i = 0; i < ecken; i++) {
    const a = start + (i / ecken) * Math.PI * 2;
    p.push([Math.cos(a) * radius, Math.sin(a) * radius]);
  }
  return p;
}

/**
 * Kuchenformen in der Draufsicht.
 * STARTER-SET: wird um die in den Referenzfotos erkannten Formen ergänzt.
 */
export const formen: FormEintrag[] = [
  { id: 'rund', name: 'Rund', starter: true, umriss: () => kreis(1, 1) },
  {
    id: 'quadrat',
    name: 'Quadratisch',
    starter: true,
    umriss: () => rundesVieleck([[-1, -1], [1, -1], [1, 1], [-1, 1]], 0.12),
  },
  {
    id: 'rechteck',
    name: 'Rechteckig',
    starter: true,
    umriss: () => rundesVieleck([[-1, -0.68], [1, -0.68], [1, 0.68], [-1, 0.68]], 0.1),
  },
  { id: 'herz', name: 'Herz', starter: true, umriss: herz },
  {
    id: 'sechseck',
    name: 'Sechseck',
    starter: true,
    umriss: () => rundesVieleck(regelmaessig(6, 1, 0), 0.1),
  },
  { id: 'oval', name: 'Oval', starter: true, umriss: () => kreis(1, 0.72) },
];
