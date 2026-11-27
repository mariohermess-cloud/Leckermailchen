/**
 * Kostenmodell: Zutaten mit Einkaufspreisen, Rezepte aus Zutaten und eine Zuordnung,
 * welches Rezept für welches Konfigurator-Element verwendet wird.
 *
 * Rezepte beziehen sich auf eine runde Referenztorte (z. B. Ø 26 cm, 8 cm hoch) und
 * werden je nach `bezug` auf die tatsächliche Torte hochgerechnet.
 */

export type Einheit = 'g' | 'ml' | 'stk';

export interface Zutat {
  id: string;
  name: string;
  kategorie: string;
  einheit: Einheit;
  /** Packungsgröße in `einheit` */
  packung: number;
  /** Preis pro Packung in € (brutto Einkauf) */
  preis: number;
}

/**
 * volumen = skaliert mit dem Volumen (Teig, Füllung)
 * flaeche = skaliert mit der Oberfläche (Überzug, Streusel, Einfärben)
 * umfang  = skaliert mit dem Umfang (Bordüren, Drip)
 * stueck  = Menge je Stück (Topper, Motive, Zubehör)
 */
export type Bezug = 'volumen' | 'flaeche' | 'umfang' | 'stueck';

export type RezeptArt = 'teig' | 'fuellung' | 'ueberzug' | 'deko' | 'zubehoer';

export interface RezeptPosition {
  zutat: string;
  menge: number;
}

export interface Rezept {
  id: string;
  name: string;
  art: RezeptArt;
  bezug: Bezug;
  /** Referenztorte (rund), auf die sich die Mengen beziehen – nur für volumen/flaeche/umfang */
  referenz: { durchmesser: number; hoehe: number };
  positionen: RezeptPosition[];
}

/** Welches Rezept für welches Element des Konfigurators verwendet wird (Werte = Rezept-ids, '' = keine Kosten). */
export interface Zuordnung {
  ueberzug: Record<string, string>;
  borduere: Record<string, string>;
  streusel: Record<string, string>;
  topper: Record<string, string>;
  platte: Record<string, string>;
  dripDunkel: string;
  dripHell: string;
  einfaerben: string;
  metallic: string;
  motiv: string;
  schriftOben: string;
  schriftSeite: string;
  schriftStehend: string;
  stecker: string;
  schild: string;
  aufleger: string;
  stuetze: string;
  verpackung: string;
}

export interface Arbeitszeit {
  grund: number;
  etage: number;
  fondant: number;
  borduere: number;
  drip: number;
  motiv: number;
  zeichen: number;
  schild: number;
  aufleger: number;
  topper: number;
  streusel: number;
}

export interface Einstellungen {
  /** € pro Arbeitsstunde */
  stundensatz: number;
  /** Arbeitszeit in Minuten je Element */
  minuten: Arbeitszeit;
  /** Aufschlag für Gemeinkosten und Gewinn in % */
  aufschlag: number;
  /** Mehrwertsteuer in % */
  mwst: number;
  /** auf ganze Vielfache davon aufrunden (€), 0 = nicht runden */
  rundung: number;
  /** Mindestpreis (€) */
  mindestpreis: number;
  /** cm² Oberseite je Portion */
  portionFlaeche: number;
  /** Richtpreis im Konfigurator für Kunden anzeigen */
  preisAnzeigen: boolean;
  /** E-Mail-Adresse für Wunschanfragen ('' = Anfrage-Knopf ausblenden) */
  anfrageEmail: string;
}

/** Druckmotiv aus dem eigenen Katalog der Backstube (z. B. selbst gestaltete Trend-Motive). */
export interface KatalogMotiv {
  id: string;
  name: string;
  /** Themengruppe, z. B. „Superhelden“, „Gaming“ */
  thema: string;
  /** Bild als Data-URL (JPEG) */
  bild: string;
  /** Material-/Druckkosten in € (fließen in die Selbstkosten ein) */
  kosten: number;
  trend: boolean;
  aktiv: boolean;
}

export interface KostenDaten {
  version: 1;
  katalog: KatalogMotiv[];
  zutaten: Zutat[];
  rezepte: Rezept[];
  zuordnung: Zuordnung;
  einstellungen: Einstellungen;
}

export interface ZutatVerbrauch {
  zutat: Zutat;
  menge: number;
  kosten: number;
}

export interface Posten {
  gruppe: string;
  text: string;
  kosten: number;
}

export interface Kalkulation {
  posten: Posten[];
  zutaten: ZutatVerbrauch[];
  zutatenSumme: number;
  minuten: number;
  arbeit: number;
  selbstkosten: number;
  aufschlag: number;
  netto: number;
  mwst: number;
  brutto: number;
  /** gerundeter Endpreis */
  preis: number;
  portionen: number;
  /** Hinweise auf fehlende Rezepte/Zutaten */
  hinweise: string[];
}
