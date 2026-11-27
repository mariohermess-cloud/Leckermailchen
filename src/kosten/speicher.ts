import { standardDaten } from './standard';
import type { KostenDaten } from './typen';

/**
 * Hält die Kostendaten.
 *
 * Reihenfolge beim Laden: lokale Änderungen im Browser (Admin) > veröffentlichte Datei
 * `kosten.json` neben der Website > eingebaute Beispieldaten.
 * Die Website hat (noch) keinen Server: Änderungen auf der Admin-Seite gelten zunächst nur
 * in diesem Browser. Für alle Kunden gelten sie erst, wenn die exportierte Datei als
 * `public/kosten.json` ins Repository gelegt wird.
 */

const SCHLUESSEL = 'leckermailchen.kosten.v1';

export type Quelle = 'standard' | 'veroeffentlicht' | 'lokal';

type Listener = () => void;

/** Ergänzt fehlende Felder (z. B. nach einem Update mit neuen Archiv-Einträgen) aus den Standarddaten. */
function ergaenze(roh: Partial<KostenDaten>): KostenDaten {
  const s = standardDaten();
  const zo = (roh.zuordnung ?? {}) as Partial<KostenDaten['zuordnung']>;
  const ei = (roh.einstellungen ?? {}) as Partial<KostenDaten['einstellungen']>;
  return {
    version: 1,
    zutaten: Array.isArray(roh.zutaten) ? roh.zutaten : s.zutaten,
    rezepte: Array.isArray(roh.rezepte) ? roh.rezepte : s.rezepte,
    zuordnung: {
      ...s.zuordnung,
      ...zo,
      ueberzug: { ...s.zuordnung.ueberzug, ...zo.ueberzug },
      borduere: { ...s.zuordnung.borduere, ...zo.borduere },
      streusel: { ...s.zuordnung.streusel, ...zo.streusel },
      topper: { ...s.zuordnung.topper, ...zo.topper },
      platte: { ...s.zuordnung.platte, ...zo.platte },
    },
    einstellungen: { ...s.einstellungen, ...ei, minuten: { ...s.einstellungen.minuten, ...ei.minuten } },
  };
}

function lokalLesen(): KostenDaten | null {
  try {
    const text = localStorage.getItem(SCHLUESSEL);
    return text ? ergaenze(JSON.parse(text) as Partial<KostenDaten>) : null;
  } catch {
    return null;
  }
}

class KostenSpeicher {
  daten: KostenDaten;
  quelle: Quelle;
  private veroeffentlicht: KostenDaten | null = null;
  private listeners: Listener[] = [];

  constructor() {
    const lokal = lokalLesen();
    this.daten = lokal ?? standardDaten();
    this.quelle = lokal ? 'lokal' : 'standard';
  }

  /** Lädt die veröffentlichte `kosten.json` (falls vorhanden). */
  async laden(): Promise<void> {
    try {
      const antwort = await fetch(`${import.meta.env.BASE_URL}kosten.json`, { cache: 'no-cache' });
      if (!antwort.ok) return;
      this.veroeffentlicht = ergaenze((await antwort.json()) as Partial<KostenDaten>);
      if (this.quelle !== 'lokal') {
        this.daten = this.veroeffentlicht;
        this.quelle = 'veroeffentlicht';
        this.melden();
      }
    } catch {
      /* keine veröffentlichte Datei – Standarddaten bleiben */
    }
  }

  abonnieren(l: Listener): void {
    this.listeners.push(l);
  }

  private melden(): void {
    this.listeners.forEach((l) => l());
  }

  /** Nach jeder Bearbeitung aufrufen: speichert lokal und benachrichtigt. */
  geaendert(): void {
    try {
      localStorage.setItem(SCHLUESSEL, JSON.stringify(this.daten));
    } catch {
      /* Speichern nicht möglich (privater Modus) – Änderungen gelten bis zum Neuladen */
    }
    this.quelle = 'lokal';
    this.melden();
  }

  exportieren(): string {
    return JSON.stringify(this.daten, null, 2);
  }

  importieren(text: string): void {
    const roh = JSON.parse(text) as Partial<KostenDaten>;
    if (!Array.isArray(roh.zutaten) || !Array.isArray(roh.rezepte)) throw new Error('Keine gültige Kostendatei');
    this.daten = ergaenze(roh);
    this.geaendert();
  }

  /** Lokale Änderungen verwerfen (zurück zur veröffentlichten Fassung bzw. den Beispieldaten). */
  lokalVerwerfen(): void {
    try {
      localStorage.removeItem(SCHLUESSEL);
    } catch {
      /* ignorieren */
    }
    this.daten = this.veroeffentlicht ? ergaenze(JSON.parse(JSON.stringify(this.veroeffentlicht)) as KostenDaten) : standardDaten();
    this.quelle = this.veroeffentlicht ? 'veroeffentlicht' : 'standard';
    this.melden();
  }

  /** Beispieldaten laden (überschreibt lokal). */
  beispielLaden(): void {
    this.daten = standardDaten();
    this.geaendert();
  }
}

export const kosten = new KostenSpeicher();
