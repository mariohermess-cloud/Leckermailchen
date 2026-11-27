import { bereinige, kopie } from '../modell/konfig';
import type { KuchenKonfig } from '../modell/typen';

type Listener = (konfig: KuchenKonfig, struktur: boolean) => void;

/**
 * Hält die aktuelle Konfiguration. Jede Änderung läuft über `aendern`, damit die Konfiguration
 * immer gültig bleibt und Vorschau und Bedienfeld benachrichtigt werden.
 */
export class Store {
  private listeners: Listener[] = [];
  /** im Bedienfeld gerade bearbeitete Etage */
  aktiveEtage = 0;

  constructor(public konfig: KuchenKonfig) {
    bereinige(this.konfig);
  }

  abonnieren(listener: Listener): void {
    this.listeners.push(listener);
  }

  /**
   * @param struktur true, wenn sich dadurch ändert, WELCHE Bedienelemente sichtbar sind
   *                 (das Bedienfeld wird dann neu aufgebaut)
   */
  aendern(fn: (k: KuchenKonfig) => void, struktur = false): void {
    fn(this.konfig);
    bereinige(this.konfig);
    this.aktiveEtage = Math.min(this.aktiveEtage, this.konfig.etagen.length - 1);
    this.listeners.forEach((l) => l(this.konfig, struktur));
  }

  ersetzen(konfig: KuchenKonfig): void {
    this.konfig = bereinige(kopie(konfig));
    this.aktiveEtage = 0;
    this.listeners.forEach((l) => l(this.konfig, true));
  }
}
