import { archiv, finde } from '../archiv';
import {
  etageEntfernen,
  etageHinzufuegen,
  GRENZEN,
  neueSchrift,
  neuerTopper,
  neuesSymbol,
} from '../modell/konfig';
import type {
  AuflegerKonfig,
  BorduereKonfig,
  EtageKonfig,
  KuchenKonfig,
  Ort,
  SchriftKonfig,
  SchriftOrt,
  StreuselBereich,
  SymbolEintrag,
  SymbolKonfig,
  TopperAnordnung,
  TopperKonfig,
} from '../modell/typen';
import { kosten } from '../kosten/speicher';
import { berechne, euro } from '../kosten/rechner';
import { auswahl, farbwahl, feld, h, kacheln, knopf, prozent, regler, schalter, svg, textfeld } from './elemente';
import type { Store } from './store';

export interface PanelAktionen {
  ansichtZuruecksetzen: () => void;
  bildSpeichern: () => void;
}

/** Baut das Bedienfeld vollständig aus dem Archiv auf – neue Archiv-Einträge erscheinen automatisch. */
export class Panel {
  /** welche Abschnitte aufgeklappt sind (bleibt über Neuaufbau erhalten) */
  private offen = new Set<string>(['themen', 'form']);
  private preisEl: HTMLElement | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly store: Store,
    private readonly aktionen: PanelAktionen,
  ) {
    store.abonnieren((_k, struktur) => {
      if (struktur) this.render();
      else this.preisAktualisieren();
    });
    kosten.abonnieren(() => this.render());
    this.render();
  }

  private get k(): KuchenKonfig {
    return this.store.konfig;
  }

  private get etage(): EtageKonfig {
    return this.k.etagen[this.store.aktiveEtage];
  }

  /** Wert ändern, Vorschau aktualisieren (Bedienfeld bleibt stehen). */
  private setze = (fn: (k: KuchenKonfig) => void) => this.store.aendern(fn, false);
  /** Wert ändern und Bedienfeld neu aufbauen (wenn andere Bedienelemente erscheinen). */
  private umbau = (fn: (k: KuchenKonfig) => void) => this.store.aendern(fn, true);

  render(): void {
    const scroll = this.host.scrollTop;
    this.host.replaceChildren(
      h('header', { class: 'kopf' }, h('h1', {}, 'Wunschtorte gestalten'), h('p', {}, 'Vorlage wählen und nach Belieben anpassen.')),
      this.abschnitt('themen', 'Vorlagen', this.themen()),
      this.abschnitt('form', 'Form & Größe', this.form()),
      this.abschnitt('ueberzug', 'Teig, Füllung & Überzug', this.ueberzug()),
      this.abschnitt('rand', 'Bordüren & Drip', this.rand()),
      this.abschnitt('schrift', 'Schrift, Namen & Zahlen', this.schrift(), this.k.schrift.length),
      this.abschnitt('aufleger', 'Fotoaufleger', this.aufleger(), this.k.aufleger.aktiv ? 1 : 0),
      this.abschnitt('motive', 'Motive', this.motive(), this.k.symbole.length),
      this.abschnitt('deko', 'Deko & Streusel', this.deko(), this.k.topper.length + (this.k.streusel.typ !== 'keine' ? 1 : 0)),
      this.abschnitt('platte', 'Tortenplatte', this.platte()),
      this.fuss(),
      ...(this.preisLeiste() ?? []),
    );
    this.host.scrollTop = scroll;
  }

  private abschnitt(id: string, titel: string, inhalt: Node[], anzahl = 0): HTMLElement {
    const details = h(
      'details',
      { class: 'abschnitt', open: this.offen.has(id) },
      h('summary', {}, h('span', {}, titel), anzahl > 0 ? h('span', { class: 'zahl' }, String(anzahl)) : null),
      h('div', { class: 'abschnitt-inhalt' }, ...inhalt),
    );
    details.addEventListener('toggle', () => {
      if (details.open) this.offen.add(id);
      else this.offen.delete(id);
    });
    return details;
  }

  /* ---------- Vorlagen ---------- */

  private themen(): Node[] {
    const raster = h('div', { class: 'themen' });
    for (const thema of archiv.themen) {
      const farben = [thema.konfig.etagen[0].farbe, ...thema.konfig.symbole.map((s) => s.farbe), ...thema.konfig.schrift.map((s) => s.farbe)].slice(0, 4);
      const karte = h(
        'button',
        { type: 'button', class: `thema${this.k.thema === thema.id ? ' aktiv' : ''}`, title: thema.beschreibung },
        h('span', { class: 'thema-farben' }, ...farben.map((f) => h('i', { style: `background:${f}` }))),
        h('strong', {}, thema.name),
        h('small', {}, thema.anlass),
      );
      karte.addEventListener('click', () => {
        this.store.ersetzen(thema.konfig);
        this.aktionen.ansichtZuruecksetzen();
      });
      raster.append(karte);
    }
    return [raster];
  }

  /* ---------- Form & Größe ---------- */

  private etagenLeiste(): HTMLElement | null {
    if (this.k.etagen.length < 2) return null;
    const leiste = h('div', { class: 'etagen-leiste', role: 'tablist', 'aria-label': 'Etage wählen' });
    this.k.etagen.forEach((_e, i) => {
      const tab = h('button', { type: 'button', role: 'tab', class: i === this.store.aktiveEtage ? 'aktiv' : '', 'aria-selected': i === this.store.aktiveEtage }, `Etage ${i + 1}${i === 0 ? ' (unten)' : ''}`);
      tab.addEventListener('click', () => {
        this.store.aktiveEtage = i;
        this.render();
      });
      leiste.append(tab);
    });
    return leiste;
  }

  private form(): Node[] {
    const formen = archiv.formen.map((f) => {
      const punkte = f.umriss();
      const d = 'M' + punkte.map(([x, z]) => `${x.toFixed(3)} ${z.toFixed(3)}`).join('L') + 'Z';
      return { id: f.id, name: f.name, bild: svg('-1.15 -1.15 2.3 2.3', [{ d, fill: 'currentColor' }]) };
    });
    const anzahl = this.k.etagen.length;
    const zaehler = h(
      'div',
      { class: 'zaehler' },
      knopf('−', () => this.umbau(etageEntfernen), 'rund'),
      h('span', {}, `${anzahl} ${anzahl === 1 ? 'Etage' : 'Etagen'}`),
      knopf('+', () => this.umbau(etageHinzufuegen), 'rund'),
    );
    (zaehler.firstChild as HTMLButtonElement).disabled = anzahl <= 1;
    (zaehler.lastChild as HTMLButtonElement).disabled = anzahl >= GRENZEN.etagenMax;

    const i = this.store.aktiveEtage;
    const d = GRENZEN.durchmesser;
    const min = d.min + (anzahl - 1 - i) * GRENZEN.etagenStufe;
    const max = i === 0 ? d.max : this.k.etagen[i - 1].durchmesser - GRENZEN.etagenStufe;
    return [
      kacheln('Form', this.k.form, formen, (id) => this.setze((k) => (k.form = id)), 'formen'),
      feld('Etagen', zaehler),
      this.etagenLeiste(),
      regler(this.k.form === 'rund' ? 'Durchmesser' : 'Breite', this.etage.durchmesser, { min, max: Math.max(min, max), schritt: d.schritt, einheit: ' cm' }, (w) =>
        this.setze((k) => (k.etagen[i].durchmesser = w)),
      ),
      regler('Höhe', this.etage.hoehe, { ...GRENZEN.hoehe, einheit: ' cm' }, (w) => this.setze((k) => (k.etagen[i].hoehe = w))),
    ].filter((n): n is HTMLElement => n !== null);
  }

  /* ---------- Überzug & Farbe ---------- */

  private ueberzug(): Node[] {
    const i = this.store.aktiveEtage;
    return [
      this.etagenLeiste(),
      kacheln(
        'Überzug',
        this.etage.ueberzug,
        archiv.ueberzuege.map((u) => ({ id: u.id, name: u.name, titel: u.beschreibung })),
        (id) => this.setze((k) => (k.etagen[i].ueberzug = id)),
        'text',
      ),
      farbwahl('Farbe des Kuchens', this.etage.farbe, (hex) => this.setze((k) => (k.etagen[i].farbe = hex))),
      ...this.rezeptWahl(i),
    ].filter((n): n is HTMLElement => n !== null);
  }

  private rezeptWahl(i: number): HTMLElement[] {
    const rezepte = kosten.daten.rezepte;
    const teige = rezepte.filter((r) => r.art === 'teig').map((r) => ({ id: r.id, name: r.name }));
    const fuellungen = [...rezepte.filter((r) => r.art === 'fuellung').map((r) => ({ id: r.id, name: r.name })), { id: 'keine', name: 'Ohne Füllung' }];
    const liste: HTMLElement[] = [];
    if (teige.length) liste.push(auswahl('Teig', this.etage.teig, teige, (id) => this.setze((k) => (k.etagen[i].teig = id))));
    liste.push(auswahl('Füllung', this.etage.fuellung, fuellungen, (id) => this.setze((k) => (k.etagen[i].fuellung = id))));
    return liste;
  }

  /* ---------- Bordüren & Drip ---------- */

  private borduere(titel: string, lies: (e: EtageKonfig) => BorduereKonfig): Node[] {
    const i = this.store.aktiveEtage;
    const b = lies(this.etage);
    const teile: Node[] = [
      auswahl(titel, b.typ, archiv.bordueren, (id) => this.umbau((k) => (lies(k.etagen[i]).typ = id))),
    ];
    if (b.typ !== 'keine') teile.push(farbwahl(`Farbe (${titel})`, b.farbe, (hex) => this.setze((k) => (lies(k.etagen[i]).farbe = hex))));
    return teile;
  }

  private rand(): Node[] {
    const i = this.store.aktiveEtage;
    const drip = this.etage.drip;
    const teile: Array<Node | null> = [
      this.etagenLeiste(),
      ...this.borduere('Bordüre unten', (e) => e.borduereUnten),
      ...this.borduere('Bordüre oben', (e) => e.borduereOben),
      h('hr', {}),
      schalter('Drip (Tropfglasur)', drip.aktiv, (an) => this.umbau((k) => (k.etagen[i].drip.aktiv = an))),
    ];
    if (drip.aktiv) {
      teile.push(
        farbwahl('Farbe des Drips', drip.farbe, (hex) => this.setze((k) => (k.etagen[i].drip.farbe = hex))),
        regler('Länge der Tropfen', drip.laenge, { min: 0, max: 1, schritt: 0.05, format: prozent }, (w) => this.setze((k) => (k.etagen[i].drip.laenge = w))),
        regler('Anzahl der Tropfen', drip.dichte, { min: 0, max: 1, schritt: 0.05, format: prozent }, (w) => this.setze((k) => (k.etagen[i].drip.dichte = w))),
      );
    }
    return teile.filter((n): n is Node => n !== null);
  }

  /* ---------- Schrift, Namen & Zahlen ---------- */

  private karte(titel: string, inhalt: Node[], entfernen: () => void): HTMLElement {
    return h(
      'div',
      { class: 'karte' },
      h('div', { class: 'karte-kopf' }, h('strong', {}, titel), knopf('Entfernen', entfernen, 'klein')),
      ...inhalt,
    );
  }

  private schriftKarte(s: SchriftKonfig, index: number): HTMLElement {
    const lies = (k: KuchenKonfig) => k.schrift[index];
    const orte: Array<{ id: SchriftOrt; name: string }> = [
      { id: 'oben', name: 'Liegt auf der Torte' },
      { id: 'stehend', name: 'Steht auf der Torte (z. B. Zahl)' },
      { id: 'stecker', name: 'Stecker auf Stäbchen' },
      { id: 'seite', name: 'An der Seitenwand' },
    ];
    const schriften = h('div', { class: 'schriften', role: 'radiogroup', 'aria-label': 'Schriftart' });
    for (const schrift of archiv.schriften) {
      const b = h('button', { type: 'button', class: `schrift${schrift.id === s.schrift ? ' aktiv' : ''}`, style: `font-family:'${schrift.familie}', cursive`, title: schrift.name }, s.text.trim().slice(0, 14) || schrift.name);
      b.addEventListener('click', () => {
        schriften.querySelectorAll('.schrift').forEach((x) => x.classList.remove('aktiv'));
        b.classList.add('aktiv');
        this.setze((k) => (lies(k).schrift = schrift.id));
      });
      schriften.append(b);
    }
    const teile: Node[] = [
      textfeld('Text', s.text, (t) => this.setze((k) => (lies(k).text = t)), 'z. B. Happy Birthday'),
      auswahl('Platzierung', s.ort, orte, (ort) => this.umbau((k) => (lies(k).ort = ort))),
      h('div', { class: 'feld' }, h('span', { class: 'feld-name' }, 'Schriftart'), schriften),
      farbwahl('Farbe der Schrift', s.farbe, (hex) => this.setze((k) => (lies(k).farbe = hex))),
      regler('Größe', s.groesse, { ...GRENZEN.schriftGroesse, max: s.ort === 'stehend' ? 12 : GRENZEN.schriftGroesse.max, einheit: ' cm' }, (w) => this.setze((k) => (lies(k).groesse = w))),
    ];
    if (s.ort === 'oben') {
      teile.push(auswahl('Namensschild', s.schild, archiv.schilder, (id) => this.umbau((k) => (lies(k).schild = id))));
      if (s.schild !== 'kein') teile.push(farbwahl('Farbe des Schilds', s.schildFarbe, (hex) => this.setze((k) => (lies(k).schildFarbe = hex))));
    }
    if (s.ort === 'seite') {
      teile.push(
        this.k.etagen.length > 1
          ? auswahl('Etage', String(s.etage), this.k.etagen.map((_e, i) => ({ id: String(i), name: `Etage ${i + 1}` })), (id) => this.setze((k) => (lies(k).etage = Number(id))))
          : h('span', {}),
        regler('Position rundherum', s.x, { min: -1, max: 1, schritt: 0.02, format: (w) => `${Math.round(w * 180)}°` }, (w) => this.setze((k) => (lies(k).x = w))),
        regler('Höhe an der Wand', s.versatz, { min: -1, max: 1, schritt: 0.05, format: (w) => prozent((w + 1) / 2) }, (w) => this.setze((k) => (lies(k).versatz = w))),
      );
    } else {
      teile.push(
        regler('Links ↔ rechts', s.x, { min: -1, max: 1, schritt: 0.02, format: prozent }, (w) => this.setze((k) => (lies(k).x = w))),
        regler('Hinten ↔ vorn', s.versatz, { min: -1, max: 1, schritt: 0.02, format: prozent }, (w) => this.setze((k) => (lies(k).versatz = w))),
        regler('Drehung', s.drehung, { min: -180, max: 180, schritt: 5, einheit: '°' }, (w) => this.setze((k) => (lies(k).drehung = w))),
      );
    }
    if (s.ort !== 'stehend' && !(s.ort === 'oben' && s.schild !== 'kein')) {
      teile.push(regler('Bogen', s.bogen, { min: -1, max: 1, schritt: 0.05, format: prozent }, (w) => this.setze((k) => (lies(k).bogen = w))));
    }
    return this.karte(s.text.trim() || 'Schriftzug', teile, () => this.umbau((k) => k.schrift.splice(index, 1)));
  }

  private schrift(): Node[] {
    const neu = (teil: Partial<SchriftKonfig>) => () => this.umbau((k) => k.schrift.push(neueSchrift(teil)));
    return [
      ...this.k.schrift.map((s, i) => this.schriftKarte(s, i)),
      h(
        'div',
        { class: 'knopfreihe' },
        knopf('+ Schriftzug', neu({ text: 'Alles Gute', schrift: 'pacifico' })),
        knopf('+ Namensschild', neu({ text: 'Name', schrift: 'dancingScript', schild: 'geschweift', farbe: '#643d22', schildFarbe: '#f2a8c0', versatz: 0.45, groesse: 1.8 })),
        knopf('+ Zahl', neu({ text: '5', schrift: 'fredoka', ort: 'stehend', groesse: 6, farbe: '#e85b9a', x: 0.35, versatz: -0.2 })),
        knopf('+ Happy-Birthday-Stecker', neu({ text: 'Happy Birthday', schrift: 'greatVibes', ort: 'stecker', farbe: '#c9a23a', groesse: 2.4, versatz: -0.5 })),
      ),
    ];
  }

  /* ---------- Fotoaufleger ---------- */

  private aufleger(): Node[] {
    const a = this.k.aufleger;
    const lies = (k: KuchenKonfig): AuflegerKonfig => k.aufleger;
    const teile: Node[] = [schalter('Fotoaufleger verwenden', a.aktiv, (an) => this.umbau((k) => (lies(k).aktiv = an)))];
    if (!a.aktiv) {
      teile.push(h('p', { class: 'hinweis' }, 'Essbarer Aufleger mit eigenem Foto oder Motiv – rund, rechteckig oder über die ganze Torte.'));
      return teile;
    }
    const datei = h('input', { type: 'file', accept: 'image/*', class: 'versteckt' });
    datei.addEventListener('change', () => {
      const file = datei.files?.[0];
      if (!file) return;
      void bildEinlesen(file).then((url) => this.umbau((k) => (lies(k).bild = url)));
    });
    teile.push(
      h('div', { class: 'knopfreihe' }, knopf(a.bild ? 'Anderes Foto wählen' : 'Eigenes Foto hochladen', () => datei.click(), 'haupt'), a.bild ? knopf('Foto entfernen', () => this.umbau((k) => (lies(k).bild = null))) : null, datei),
      h('p', { class: 'hinweis' }, 'Das Foto bleibt auf deinem Gerät – es wird nur für die Vorschau verwendet.'),
    );
    if (!a.bild) teile.push(auswahl('Beispielmotiv', a.motiv, archiv.auflegerMotive, (id) => this.setze((k) => (lies(k).motiv = id))));
    teile.push(
      auswahl(
        'Form',
        a.form,
        [
          { id: 'rund', name: 'Rund' },
          { id: 'rechteck', name: 'Rechteckig' },
          { id: 'ganz', name: 'Ganze Oberseite' },
        ] as const,
        (form) => this.umbau((k) => (lies(k).form = form)),
      ),
    );
    if (a.form !== 'ganz') {
      teile.push(
        regler('Größe', a.groesse, { min: 0.3, max: 1, schritt: 0.02, format: prozent }, (w) => this.setze((k) => (lies(k).groesse = w))),
        regler('Links ↔ rechts', a.x, { min: -1, max: 1, schritt: 0.02, format: prozent }, (w) => this.setze((k) => (lies(k).x = w))),
        regler('Hinten ↔ vorn', a.y, { min: -1, max: 1, schritt: 0.02, format: prozent }, (w) => this.setze((k) => (lies(k).y = w))),
      );
    }
    teile.push(schalter('Gespritzter Rand um den Aufleger', a.rand, (an) => this.umbau((k) => (lies(k).rand = an))));
    if (a.rand) teile.push(farbwahl('Farbe des Rands', a.randFarbe, (hex) => this.setze((k) => (lies(k).randFarbe = hex))));
    return teile;
  }

  /* ---------- Motive ---------- */

  private symbolBild(eintrag: SymbolEintrag, farbe = '#d6929f', farbe2 = '#f2d247'): SVGSVGElement {
    return svg(
      '0 0 100 100',
      [...eintrag.ebenen]
        .sort((a, b) => a.ebene - b.ebene)
        .map((e) => ({ d: e.d, fill: e.farbe === 'farbe' ? farbe : e.farbe === 'farbe2' ? farbe2 : e.farbe })),
    );
  }

  private motivKarte(s: SymbolKonfig, index: number): HTMLElement {
    const lies = (k: KuchenKonfig) => k.symbole[index];
    const eintrag = finde(archiv.symbole, s.symbol);
    const orte: Array<{ id: Ort; name: string }> = [
      { id: 'seite', name: 'An der Seitenwand' },
      { id: 'oben', name: 'Liegt auf der Torte' },
      { id: 'stehend', name: 'Steht auf der Torte' },
    ];
    const teile: Node[] = [
      kacheln(
        'Motiv',
        s.symbol,
        archiv.symbole.map((e) => ({ id: e.id, name: e.name, bild: this.symbolBild(e, s.farbe, s.farbe2) })),
        (id) => this.umbau((k) => (lies(k).symbol = id)),
        'motive',
      ),
      auswahl('Platzierung', s.ort, orte, (ort) => this.umbau((k) => (lies(k).ort = ort))),
    ];
    if (eintrag.ebenen.some((e) => e.farbe === 'farbe')) teile.push(farbwahl('Farbe', s.farbe, (hex) => this.setze((k) => (lies(k).farbe = hex))));
    if (eintrag.zweifarbig) teile.push(farbwahl('Zweite Farbe', s.farbe2, (hex) => this.setze((k) => (lies(k).farbe2 = hex))));
    teile.push(regler('Größe', s.groesse, { ...GRENZEN.symbolGroesse, einheit: ' cm' }, (w) => this.setze((k) => (lies(k).groesse = w))));
    if (s.ort === 'seite') {
      if (this.k.etagen.length > 1) {
        teile.push(auswahl('Etage', String(s.etage), this.k.etagen.map((_e, i) => ({ id: String(i), name: `Etage ${i + 1}` })), (id) => this.setze((k) => (lies(k).etage = Number(id)))));
      }
      teile.push(
        regler('Anzahl rundherum', s.anzahl, { min: 1, max: 24, schritt: 1 }, (w) => this.setze((k) => (lies(k).anzahl = w))),
        regler('Position rundherum', s.winkel, { min: -180, max: 180, schritt: 5, einheit: '°' }, (w) => this.setze((k) => (lies(k).winkel = w))),
        regler('Höhe an der Wand', s.hoehe, { min: 0, max: 1, schritt: 0.02, format: prozent }, (w) => this.setze((k) => (lies(k).hoehe = w))),
      );
    } else {
      teile.push(
        regler('Links ↔ rechts', s.x, { min: -1, max: 1, schritt: 0.02, format: prozent }, (w) => this.setze((k) => (lies(k).x = w))),
        regler('Hinten ↔ vorn', s.y, { min: -1, max: 1, schritt: 0.02, format: prozent }, (w) => this.setze((k) => (lies(k).y = w))),
      );
    }
    teile.push(regler('Drehung', s.drehung, { min: -180, max: 180, schritt: 5, einheit: '°' }, (w) => this.setze((k) => (lies(k).drehung = w))));
    return this.karte(eintrag.name, teile, () => this.umbau((k) => k.symbole.splice(index, 1)));
  }

  private motive(): Node[] {
    return [
      ...this.k.symbole.map((s, i) => this.motivKarte(s, i)),
      h('div', { class: 'knopfreihe' }, knopf('+ Motiv hinzufügen', () => this.umbau((k) => k.symbole.push(neuesSymbol({ etage: this.store.aktiveEtage }))))),
    ];
  }

  /* ---------- Deko & Streusel ---------- */

  private topperKarte(t: TopperKonfig, index: number): HTMLElement {
    const lies = (k: KuchenKonfig) => k.topper[index];
    const eintrag = finde(archiv.topper, t.typ);
    const anordnungen: Array<{ id: TopperAnordnung; name: string }> = [
      { id: 'kranz', name: 'Kranz am Rand' },
      { id: 'halbmond', name: 'Halbmond' },
      { id: 'mitte', name: 'In der Mitte' },
      { id: 'verstreut', name: 'Verstreut' },
    ];
    const teile: Node[] = [
      auswahl('Art', t.typ, archiv.topper, (id) =>
        this.umbau((k) => {
          lies(k).typ = id;
          lies(k).farbe = finde(archiv.topper, id).standardFarbe;
        }),
      ),
      auswahl('Anordnung', t.anordnung, anordnungen, (a) => this.setze((k) => (lies(k).anordnung = a))),
      regler('Anzahl', t.anzahl, { ...GRENZEN.topperAnzahl, schritt: 1 }, (w) => this.setze((k) => (lies(k).anzahl = w))),
    ];
    if (eintrag.faerbbar) teile.push(farbwahl('Farbe', t.farbe, (hex) => this.setze((k) => (lies(k).farbe = hex))));
    return this.karte(eintrag.name, teile, () => this.umbau((k) => k.topper.splice(index, 1)));
  }

  private deko(): Node[] {
    const s = this.k.streusel;
    const bereiche: Array<{ id: StreuselBereich; name: string }> = [
      { id: 'oben', name: 'Auf der Oberseite' },
      { id: 'obenRand', name: 'Kranz am oberen Rand' },
      { id: 'seiteUnten', name: 'Am unteren Rand der Seite' },
      { id: 'seiteGanz', name: 'Ganze Seitenwand' },
      { id: 'ueberall', name: 'Oberseite und unterer Rand' },
    ];
    const teile: Node[] = [
      ...this.k.topper.map((t, i) => this.topperKarte(t, i)),
      h('div', { class: 'knopfreihe' }, knopf('+ Deko hinzufügen', () => this.umbau((k) => k.topper.push(neuerTopper())))),
      h('hr', {}),
      auswahl('Streusel & Rand', s.typ, archiv.streusel, (id) => this.umbau((k) => (k.streusel.typ = id))),
    ];
    if (s.typ !== 'keine') {
      teile.push(
        auswahl('Farben', s.palette, archiv.streuselPaletten, (id) => this.setze((k) => (k.streusel.palette = id))),
        auswahl('Bereich', s.bereich, bereiche, (b) => this.setze((k) => (k.streusel.bereich = b))),
        regler('Menge', s.menge, { min: 0.05, max: 1, schritt: 0.05, format: prozent }, (w) => this.setze((k) => (k.streusel.menge = w))),
      );
    }
    return teile;
  }

  /* ---------- Platte & Fuß ---------- */

  private platte(): Node[] {
    return [auswahl('Tortenplatte', this.k.platte.typ, archiv.platten, (id) => this.setze((k) => (k.platte.typ = id)))];
  }

  private preisAktualisieren(): void {
    if (!this.preisEl) return;
    const e = kosten.daten.einstellungen;
    const kalk = berechne(this.k, kosten.daten);
    this.preisEl.replaceChildren(
      h('span', { class: 'preis-titel' }, 'Richtpreis'),
      h('strong', { class: 'preis-wert' }, `ca. ${euro(kalk.preis)}`),
      h('span', { class: 'preis-info' }, `für ca. ${kalk.portionen} Stück · inkl. ${e.mwst.toString().replace('.', ',')} % MwSt.`),
    );
  }

  /** Bleibt unten im Bedienfeld sichtbar. */
  private preisLeiste(): HTMLElement[] | null {
    this.preisEl = kosten.daten.einstellungen.preisAnzeigen ? h('div', { class: 'preis', 'aria-live': 'polite' }) : null;
    this.preisAktualisieren();
    return this.preisEl ? [this.preisEl] : null;
  }

  private fuss(): HTMLElement {
    return h(
      'footer',
      { class: 'fuss' },
      h(
        'div',
        { class: 'knopfreihe' },
        knopf('Bild speichern', this.aktionen.bildSpeichern, 'haupt'),
        knopf('Ansicht zurücksetzen', this.aktionen.ansichtZuruecksetzen),
        knopf('Neu verteilen', () => this.setze((k) => (k.seed = (k.seed % 9973) + 1))),
      ),
      h('p', { class: 'hinweis' }, 'Vorschau zur Orientierung – Farben und Details der fertigen Torte können leicht abweichen. Der Richtpreis ist unverbindlich.'),
    );
  }
}

/** Liest ein Foto ein und verkleinert es auf höchstens 1024 px Kantenlänge. */
async function bildEinlesen(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const bild = new Image();
    await new Promise<void>((ok, fehler) => {
      bild.onload = () => ok();
      bild.onerror = () => fehler(new Error('Bild konnte nicht gelesen werden'));
      bild.src = url;
    });
    const max = 1024;
    const k = Math.min(1, max / Math.max(bild.naturalWidth, bild.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bild.naturalWidth * k));
    canvas.height = Math.max(1, Math.round(bild.naturalHeight * k));
    canvas.getContext('2d')!.drawImage(bild, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}
