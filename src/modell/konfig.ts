import type {
  AuflegerKonfig,
  BorduereKonfig,
  DripKonfig,
  EtageKonfig,
  KuchenKonfig,
  SchriftKonfig,
  SymbolKonfig,
  TopperKonfig,
} from './typen';

/** Grenzen, die der Konfigurator zulässt (cm). */
export const GRENZEN = {
  etagenMax: 4,
  durchmesser: { min: 10, max: 40, schritt: 1 },
  hoehe: { min: 5, max: 18, schritt: 0.5 },
  /** so viel muss jede Etage mindestens schmaler sein als die darunter */
  etagenStufe: 3,
  symbolGroesse: { min: 1.5, max: 14, schritt: 0.5 },
  schriftGroesse: { min: 0.8, max: 6, schritt: 0.1 },
  topperAnzahl: { min: 1, max: 40 },
} as const;

let zaehler = 0;
export function neueUid(): string {
  zaehler += 1;
  return `e${Date.now().toString(36)}${zaehler.toString(36)}`;
}

export const keinDrip = (): DripKonfig => ({ aktiv: false, farbe: '#643d22', laenge: 0.5, dichte: 0.5 });
export const keineBorduere = (): BorduereKonfig => ({ typ: 'keine', farbe: '#f6f3ee' });

export const keinAufleger = (): AuflegerKonfig => ({
  aktiv: false,
  form: 'rund',
  groesse: 0.62,
  bild: null,
  motiv: 'luftballons',
  x: 0,
  y: 0,
  rand: true,
  randFarbe: '#f6f3ee',
  katalog: null,
  rechte: false,
});

export function neueEtage(teil: Partial<EtageKonfig> = {}): EtageKonfig {
  return {
    durchmesser: 20,
    hoehe: 10,
    ueberzug: 'buttercreme',
    farbe: '#f6f3ee',
    teig: 'ruehrteig',
    fuellung: 'fuellungButtercreme',
    drip: keinDrip(),
    borduereUnten: keineBorduere(),
    borduereOben: keineBorduere(),
    ...teil,
  };
}

export function neuesSymbol(teil: Partial<SymbolKonfig> = {}): SymbolKonfig {
  return {
    uid: neueUid(),
    symbol: 'herz',
    farbe: '#e85b9a',
    farbe2: '#f2d247',
    ort: 'seite',
    etage: 0,
    groesse: 4,
    x: 0,
    y: 0,
    drehung: 0,
    winkel: 0,
    hoehe: 0.5,
    anzahl: 1,
    ...teil,
  };
}

export function neueSchrift(teil: Partial<SchriftKonfig> = {}): SchriftKonfig {
  return {
    uid: neueUid(),
    text: 'Happy Birthday',
    schrift: 'pacifico',
    farbe: '#643d22',
    groesse: 2.2,
    ort: 'oben',
    etage: 0,
    bogen: 0,
    versatz: 0,
    x: 0,
    drehung: 0,
    schild: 'kein',
    schildFarbe: '#f2d247',
    ...teil,
  };
}

export function neuerTopper(teil: Partial<TopperKonfig> = {}): TopperKonfig {
  return {
    uid: neueUid(),
    typ: 'erdbeeren',
    anordnung: 'kranz',
    anzahl: 8,
    farbe: '#d8272e',
    ...teil,
  };
}

export function leereKonfig(): KuchenKonfig {
  return {
    version: 1,
    thema: null,
    form: 'rund',
    etagen: [neueEtage()],
    streusel: { typ: 'keine', palette: 'bunt', menge: 0.5, bereich: 'oben' },
    topper: [],
    symbole: [],
    schrift: [],
    aufleger: keinAufleger(),
    platte: { typ: 'gold' },
    seed: 1,
  };
}

export function kopie<T>(wert: T): T {
  return JSON.parse(JSON.stringify(wert)) as T;
}

const begrenze = (wert: number, min: number, max: number) => Math.min(max, Math.max(min, wert));

/**
 * Bringt eine Konfiguration in einen gültigen Zustand:
 * Maße innerhalb der Grenzen, obere Etagen schmaler als untere, Verweise auf vorhandene Etagen.
 * Verändert das übergebene Objekt und gibt es zurück.
 */
export function bereinige(k: KuchenKonfig): KuchenKonfig {
  if (k.etagen.length === 0) k.etagen.push(neueEtage());
  if (k.etagen.length > GRENZEN.etagenMax) k.etagen.length = GRENZEN.etagenMax;

  const d = GRENZEN.durchmesser;
  const h = GRENZEN.hoehe;
  k.etagen.forEach((etage, i) => {
    const min = d.min + (k.etagen.length - 1 - i) * GRENZEN.etagenStufe;
    const max = i === 0 ? d.max : k.etagen[i - 1].durchmesser - GRENZEN.etagenStufe;
    etage.durchmesser = begrenze(etage.durchmesser, Math.min(min, max), Math.max(min, max));
    etage.hoehe = begrenze(etage.hoehe, h.min, h.max);
    etage.teig = etage.teig || 'ruehrteig';
    etage.fuellung = etage.fuellung || 'fuellungButtercreme';
    etage.drip.laenge = begrenze(etage.drip.laenge, 0, 1);
    etage.drip.dichte = begrenze(etage.drip.dichte, 0, 1);
  });

  const oberste = k.etagen.length - 1;
  for (const s of k.symbole) {
    s.etage = begrenze(Math.round(s.etage), 0, oberste);
    s.groesse = begrenze(s.groesse, GRENZEN.symbolGroesse.min, GRENZEN.symbolGroesse.max);
    s.anzahl = begrenze(Math.round(s.anzahl), 1, 24);
    s.x = begrenze(s.x, -1, 1);
    s.y = begrenze(s.y, -1, 1);
    s.hoehe = begrenze(s.hoehe, 0, 1);
  }
  for (const s of k.schrift) {
    s.etage = begrenze(Math.round(s.etage), 0, oberste);
    s.groesse = begrenze(s.groesse, GRENZEN.schriftGroesse.min, GRENZEN.schriftGroesse.max);
    s.bogen = begrenze(s.bogen, -1, 1);
    s.versatz = begrenze(s.versatz, -1, 1);
    s.x = begrenze(s.x ?? 0, -1, 1);
    s.drehung = s.drehung ?? 0;
    s.schild = s.schild ?? 'kein';
    s.schildFarbe = s.schildFarbe ?? '#f2d247';
  }
  k.aufleger = { ...keinAufleger(), ...(k.aufleger ?? {}) };
  k.aufleger.groesse = begrenze(k.aufleger.groesse, 0.3, 1);
  k.aufleger.x = begrenze(k.aufleger.x, -1, 1);
  k.aufleger.y = begrenze(k.aufleger.y, -1, 1);
  for (const t of k.topper) {
    t.anzahl = begrenze(Math.round(t.anzahl), GRENZEN.topperAnzahl.min, GRENZEN.topperAnzahl.max);
  }
  k.streusel.menge = begrenze(k.streusel.menge, 0, 1);
  return k;
}

/** Fügt oben eine Etage hinzu (etwas schmaler als die bisher oberste). */
export function etageHinzufuegen(k: KuchenKonfig): void {
  if (k.etagen.length >= GRENZEN.etagenMax) return;
  const bisher = k.etagen[k.etagen.length - 1];
  // unterste Etagen bei Bedarf verbreitern, damit die neue Etage noch sinnvoll groß ist
  const noetig = GRENZEN.durchmesser.min + 2 + k.etagen.length * 5;
  if (k.etagen[0].durchmesser < noetig) {
    const plus = noetig - k.etagen[0].durchmesser;
    k.etagen.forEach((e) => (e.durchmesser += plus));
  }
  k.etagen.push({
    ...kopie(bisher),
    durchmesser: bisher.durchmesser - 5,
    borduereUnten: kopie(bisher.borduereUnten),
  });
  bereinige(k);
}

export function etageEntfernen(k: KuchenKonfig): void {
  if (k.etagen.length <= 1) return;
  k.etagen.pop();
  bereinige(k);
}
