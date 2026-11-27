import type { FarbEintrag } from '../modell/typen';

/**
 * Farbpalette für Grundkuchen, Deko und Schrift.
 * Die Hex-Werte sind die Mediane der in den 347 analysierten Torten geschätzten Farben
 * (siehe analyse/kuchen.json), sortiert nach Häufigkeit innerhalb der Farbfamilien.
 */
export const farben: FarbEintrag[] = [
  { id: 'weiss', name: 'Weiß', hex: '#f6f3ee' },
  { id: 'cremeweiss', name: 'Cremeweiß', hex: '#f4edd8' },
  { id: 'creme', name: 'Creme', hex: '#f1e3c0' },
  { id: 'beige', name: 'Beige', hex: '#e7cca0' },
  { id: 'hellgelb', name: 'Hellgelb', hex: '#f3e28a' },
  { id: 'gelb', name: 'Gelb', hex: '#f2d247' },
  { id: 'orange', name: 'Orange', hex: '#f08c2e' },
  { id: 'rosa', name: 'Rosa', hex: '#f2a8c0' },
  { id: 'pink', name: 'Pink', hex: '#e85b9a' },
  { id: 'rot', name: 'Rot', hex: '#d8272e' },
  { id: 'flieder', name: 'Flieder', hex: '#b9a0dc' },
  { id: 'lila', name: 'Lila', hex: '#9b6fc5' },
  { id: 'hellblau', name: 'Hellblau', hex: '#a8d0e8' },
  { id: 'blau', name: 'Blau', hex: '#2f7bc8' },
  { id: 'dunkelblau', name: 'Dunkelblau', hex: '#1f3f7a' },
  { id: 'tuerkis', name: 'Türkis', hex: '#5cb5b5' },
  { id: 'mint', name: 'Mint', hex: '#a9dcc0' },
  { id: 'hellgruen', name: 'Hellgrün', hex: '#a8d98a' },
  { id: 'gruen', name: 'Grün', hex: '#5fa74a' },
  { id: 'braun', name: 'Braun', hex: '#8a5a3a' },
  { id: 'schoko', name: 'Schokobraun', hex: '#643d22' },
  { id: 'zartbitter', name: 'Dunkelbraun', hex: '#3a2a1f' },
  { id: 'grau', name: 'Grau', hex: '#8a8f8c' },
  { id: 'schwarz', name: 'Schwarz', hex: '#1e1e1e' },
  { id: 'gold', name: 'Gold', hex: '#c9a23a', metallic: true },
  { id: 'rosegold', name: 'Roségold', hex: '#dba58f', metallic: true, starter: true },
  { id: 'silber', name: 'Silber', hex: '#cfd2d6', metallic: true, starter: true },
];

const nachHex = new Map(farben.map((f) => [f.hex.toLowerCase(), f]));

export function farbeNachId(id: string): string {
  const eintrag = farben.find((f) => f.id === id);
  if (!eintrag) throw new Error(`Unbekannte Farbe im Archiv: ${id}`);
  return eintrag.hex;
}

/** Metallic gilt nur für Paletten-Farben, die so markiert sind (Vergleich über den Hex-Wert). */
export function istMetallic(hex: string): boolean {
  return nachHex.get(hex.toLowerCase())?.metallic === true;
}

export function farbName(hex: string): string {
  return nachHex.get(hex.toLowerCase())?.name ?? hex;
}
