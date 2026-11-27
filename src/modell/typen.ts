/**
 * Datenmodell des Kuchen-Konfigurators.
 *
 * Fachbegriffe (Etage, Überzug, Bordüre …) sind bewusst deutsch, weil das Archiv
 * von Menschen aus der Backstube gepflegt wird. Technische Interna im Renderer sind englisch.
 *
 * Alle Maße in Zentimetern, alle Farben als Hex-String ("#rrggbb").
 */

/** Tropfglasur, die vom oberen Rand einer Etage herunterläuft. */
export interface DripKonfig {
  aktiv: boolean;
  farbe: string;
  /** 0 = kurze Tropfen, 1 = fast bis zum Boden */
  laenge: number;
  /** 0 = wenige Tropfen, 1 = dicht an dicht */
  dichte: number;
}

/** Gespritzte Bordüre am unteren oder oberen Rand einer Etage. `typ` verweist ins Archiv. */
export interface BorduereKonfig {
  typ: string;
  farbe: string;
}

export interface EtageKonfig {
  /** Durchmesser bzw. Breite/Kantenlänge in cm */
  durchmesser: number;
  hoehe: number;
  /** id eines Überzugs aus dem Archiv */
  ueberzug: string;
  farbe: string;
  /** id eines Teig-Rezepts aus den Kostendaten */
  teig: string;
  /** id eines Füllungs-Rezepts aus den Kostendaten, 'keine' = ohne Füllung */
  fuellung: string;
  drip: DripKonfig;
  borduereUnten: BorduereKonfig;
  borduereOben: BorduereKonfig;
}

export type StreuselBereich = 'oben' | 'obenRand' | 'seiteUnten' | 'seiteGanz' | 'ueberall';

export interface StreuselKonfig {
  /** id aus dem Archiv, 'keine' = aus */
  typ: string;
  /** id einer Streusel-Palette */
  palette: string;
  /** 0…1 */
  menge: number;
  bereich: StreuselBereich;
}

export type TopperAnordnung = 'kranz' | 'halbmond' | 'mitte' | 'verstreut';

/** Dreidimensionale Deko auf der obersten Etage (Beeren, Kerzen, Macarons …). */
export interface TopperKonfig {
  uid: string;
  typ: string;
  anordnung: TopperAnordnung;
  anzahl: number;
  farbe: string;
}

/** oben = liegt flach auf der Oberseite · seite = an der Seitenwand · stehend = steht aufrecht auf der Oberseite */
export type Ort = 'oben' | 'seite' | 'stehend';

/** Ein flaches (Fondant-)Motiv: liegend, an der Seitenwand oder als Aufsteller. */
export interface SymbolKonfig {
  uid: string;
  symbol: string;
  farbe: string;
  farbe2: string;
  ort: Ort;
  /** Index der Etage (0 = unterste) */
  etage: number;
  /** Kantenlänge des Symbols in cm */
  groesse: number;
  /** ort=oben/stehend: Position relativ zum Radius, -1…1 (x = links/rechts, y = hinten/vorn) */
  x: number;
  y: number;
  /** Drehung in Grad */
  drehung: number;
  /** nur ort=seite: Winkel um den Kuchen in Grad, 0 = vorn */
  winkel: number;
  /** nur ort=seite: Höhe an der Seitenwand, 0 = unten, 1 = oben */
  hoehe: number;
  /** nur ort=seite: Anzahl gleichmäßig um den Kuchen verteilter Wiederholungen */
  anzahl: number;
}

/**
 * oben    = liegt auf der Oberseite (gespritzt bzw. Fondant-Buchstaben)
 * seite   = an der Seitenwand
 * stecker = dünner Schriftzug auf Stäbchen ("Happy Birthday"-Topper)
 * stehend = dicke, aufrecht stehende Fondant-Zeichen (typisch: die Alterszahl)
 */
export type SchriftOrt = 'oben' | 'seite' | 'stecker' | 'stehend';

export interface SchriftKonfig {
  uid: string;
  text: string;
  /** id einer Schrift aus dem Archiv */
  schrift: string;
  farbe: string;
  /** Schrifthöhe in cm */
  groesse: number;
  ort: SchriftOrt;
  /** Index der Etage (0 = unterste); für ort=oben/stecker wird immer die oberste verwendet */
  etage: number;
  /** -1…1: Krümmung der Zeile (0 = gerade, >0 = Bogen nach oben, <0 = nach unten) */
  bogen: number;
  /** -1…1: Verschiebung (oben/stecker/stehend: hinten/vorn, seite: unten/oben) */
  versatz: number;
  /** -1…1: Verschiebung links/rechts (seite: Drehung um den Kuchen) */
  x: number;
  /** Drehung in Grad (nur oben/stecker/stehend) */
  drehung: number;
  /** id einer Schildform aus dem Archiv ('kein' = ohne). Nur für ort=oben: Namensschild unter dem Text */
  schild: string;
  schildFarbe: string;
}

/** Essbarer Fotoaufleger (Tortenaufleger) auf der obersten Etage. */
export interface AuflegerKonfig {
  aktiv: boolean;
  form: 'rund' | 'rechteck' | 'ganz';
  /** 0.3…1: Größe relativ zur Oberseite */
  groesse: number;
  /** eigenes Bild als Data-URL; null = Platzhalter-Motiv */
  bild: string | null;
  /** id eines Beispielmotivs aus dem Archiv (wenn kein eigenes Bild) */
  motiv: string;
  /** -1…1 Position */
  x: number;
  y: number;
  /** gespritzter Rand um den Aufleger */
  rand: boolean;
  randFarbe: string;
}

export interface PlatteKonfig {
  /** id aus dem Archiv */
  typ: string;
}

export interface KuchenKonfig {
  version: 1;
  /** id des Themas, aus dem diese Konfiguration entstanden ist (nur zur Anzeige) */
  thema: string | null;
  /** id einer Form aus dem Archiv – gilt für alle Etagen */
  form: string;
  /** von unten nach oben */
  etagen: EtageKonfig[];
  streusel: StreuselKonfig;
  topper: TopperKonfig[];
  symbole: SymbolKonfig[];
  schrift: SchriftKonfig[];
  aufleger: AuflegerKonfig;
  platte: PlatteKonfig;
  /** Startwert für alle Zufallsverteilungen (Tropfen, Streusel …) – gleicher Wert = gleiches Bild */
  seed: number;
}

/* ---------- Archiv-Einträge ---------- */

/** Gemeinsame Felder aller Archiv-Einträge. */
export interface ArchivEintrag {
  id: string;
  name: string;
  /** Dateinamen der Referenzfotos, aus denen der Eintrag abgeleitet wurde */
  quelle?: string[];
  /** Platzhalter aus dem Starter-Set (noch nicht aus Fotos abgeleitet) */
  starter?: boolean;
}

export interface FarbEintrag extends ArchivEintrag {
  hex: string;
  /** Metallic-Effekt (Gold, Silber …) */
  metallic?: boolean;
}

export interface FormEintrag extends ArchivEintrag {
  /** Umriss in der Draufsicht, normiert auf Breite 2 (x von -1 bis 1); z zeigt zum Betrachter */
  umriss: () => Array<[number, number]>;
}

export type UeberzugTextur = 'glatt' | 'buttercreme' | 'naked' | 'gekaemmt';

export interface UeberzugEintrag extends ArchivEintrag {
  beschreibung: string;
  /** Radius der oberen Kante in cm (Fondant rund, Buttercreme scharf) */
  kante: number;
  rauheit: number;
  /** 0…1 Klarlack-Glanz (Ganache, Spiegelglasur) */
  glanz: number;
  /** 0…1 samtiger Schimmer */
  samt: number;
  textur: UeberzugTextur;
}

export interface BorduereEintrag extends ArchivEintrag {
  art: 'keine' | 'perlen' | 'tupfen' | 'muscheln' | 'band' | 'gras' | 'rosetten';
  /** Größe eines Elements in cm */
  groesse: number;
}

export interface StreuselEintrag extends ArchivEintrag {
  art: 'keine' | 'staebchen' | 'perlen' | 'konfetti' | 'sterne' | 'mandeln' | 'raspel';
  /** feste Farben (Mandelblättchen, Schokoraspel) statt einer wählbaren Palette */
  farben?: string[];
}

export interface StreuselPalette extends ArchivEintrag {
  farben: string[];
  metallic?: boolean;
}

export interface TopperEintrag extends ArchivEintrag {
  /** Schlüssel der 3D-Bauanleitung im Renderer */
  bau: string;
  /** Platzbedarf (Radius) in cm */
  radius: number;
  /** ob die gewählte Farbe verwendet wird (Beeren haben feste Farben) */
  faerbbar: boolean;
  standardFarbe: string;
}

export interface SymbolEbene {
  /** SVG-Pfad im Koordinatensystem 0…100 */
  d: string;
  /** 'farbe' / 'farbe2' = vom Kunden wählbar, sonst fester Hex-Wert */
  farbe: 'farbe' | 'farbe2' | string;
  /** Stapelhöhe: 0 = Grundform, 1 = liegt darauf … */
  ebene: number;
}

export interface SymbolEintrag extends ArchivEintrag {
  kategorie: string;
  ebenen: SymbolEbene[];
  /** ob eine zweite Farbe wählbar ist */
  zweifarbig?: boolean;
}

export interface SchriftEintrag extends ArchivEintrag {
  /** CSS-Schriftfamilie */
  familie: string;
  stil: 'schreibschrift' | 'druckschrift' | 'verspielt';
  /** URL der Schriftdatei (woff) */
  datei: string;
}

export interface SchildEintrag extends ArchivEintrag {
  art: 'kein' | 'oval' | 'rechteck' | 'geschweift' | 'wolke' | 'banner';
}

export interface AuflegerMotiv extends ArchivEintrag {
  /** zeichnet das Beispielmotiv auf eine quadratische Zeichenfläche */
  zeichne: (ctx: CanvasRenderingContext2D, groesse: number) => void;
}

export interface PlatteEintrag extends ArchivEintrag {
  art: 'keine' | 'karton' | 'holz' | 'staender';
  farbe: string;
  metallic?: boolean;
}

export interface ThemaEintrag extends ArchivEintrag {
  anlass: string;
  beschreibung: string;
  konfig: KuchenKonfig;
}
