import { archiv } from '../archiv';
import { berechne, euro, rezeptKosten } from '../kosten/rechner';
import { kosten } from '../kosten/speicher';
import type { KatalogMotiv, Arbeitszeit, Bezug, Einheit, Einstellungen, Rezept, RezeptArt, Zuordnung, Zutat } from '../kosten/typen';
import type { KuchenKonfig } from '../modell/typen';
import { bildEinlesen } from './bild';
import { h, knopf } from './elemente';

/**
 * Admin-Seite (#admin): Zutaten mit Einkaufspreisen, Rezepte, Zuordnung zu den
 * Konfigurator-Elementen, Kalkulationsgrundlagen und eine Testrechnung der aktuellen Torte.
 */

type Tab = 'katalog' | 'zutaten' | 'rezepte' | 'zuordnung' | 'kalkulation' | 'test' | 'daten';

const TABS: Array<{ id: Tab; name: string }> = [
  { id: 'katalog', name: 'Motivkatalog' },
  { id: 'zutaten', name: 'Zutaten' },
  { id: 'rezepte', name: 'Rezepte' },
  { id: 'zuordnung', name: 'Zuordnung' },
  { id: 'kalkulation', name: 'Kalkulation' },
  { id: 'test', name: 'Testrechnung' },
  { id: 'daten', name: 'Daten & Veröffentlichen' },
];

const EINHEITEN: Array<{ id: Einheit; name: string }> = [
  { id: 'g', name: 'g' },
  { id: 'ml', name: 'ml' },
  { id: 'stk', name: 'Stück' },
];

const ARTEN: Array<{ id: RezeptArt; name: string }> = [
  { id: 'teig', name: 'Teig' },
  { id: 'fuellung', name: 'Füllung' },
  { id: 'ueberzug', name: 'Überzug' },
  { id: 'deko', name: 'Deko' },
  { id: 'zubehoer', name: 'Zubehör' },
];

const BEZUEGE: Array<{ id: Bezug; name: string }> = [
  { id: 'volumen', name: 'Volumen (Teig, Füllung)' },
  { id: 'flaeche', name: 'Oberfläche (Überzug, Streusel)' },
  { id: 'umfang', name: 'Umfang (Bordüre, Drip)' },
  { id: 'stueck', name: 'je Stück' },
];

const QUELLEN = {
  standard: 'Beispieldaten',
  veroeffentlicht: 'Veröffentlichte Daten',
  lokal: 'Lokale Änderungen – noch nicht veröffentlicht',
};

const zahl = (w: number, stellen = 2) => w.toLocaleString('de-DE', { maximumFractionDigits: stellen });
const einheitName = (e: Einheit) => (e === 'stk' ? 'Stk' : e);
const neueId = (praefix: string) => `${praefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

/** Zahleneingabe, die auch Komma akzeptiert. */
function zahlFeld(wert: number, setze: (w: number) => void, breite = 'schmal'): HTMLInputElement {
  const input = h('input', { type: 'text', inputmode: 'decimal', class: `zahlfeld ${breite}`, value: String(wert).replace('.', ',') });
  input.addEventListener('input', () => {
    const w = Number(input.value.replace(/\s/g, '').replace(',', '.'));
    const ok = input.value.trim() !== '' && Number.isFinite(w) && w >= 0;
    input.classList.toggle('fehler', !ok);
    if (ok) setze(w);
  });
  return input;
}

function textEingabe(wert: string, setze: (w: string) => void, attrs: Record<string, string> = {}): HTMLInputElement {
  const input = h('input', { type: 'text', value: wert, ...attrs });
  input.addEventListener('input', () => setze(input.value));
  return input;
}

function wahl<T extends string>(wert: T, optionen: ReadonlyArray<{ id: T; name: string }>, setze: (w: T) => void): HTMLSelectElement {
  const select = h('select', {});
  for (const o of optionen) {
    const option = h('option', { value: o.id }, o.name);
    option.selected = o.id === wert;
    select.append(option);
  }
  select.addEventListener('change', () => setze(select.value as T));
  return select;
}

function grundpreis(z: Zutat): string {
  if (z.packung <= 0) return '–';
  const proEinheit = z.preis / z.packung;
  if (z.einheit === 'stk') return `${euro(proEinheit)} / Stk`;
  return `${euro(proEinheit * 1000)} / ${z.einheit === 'g' ? 'kg' : 'l'}`;
}

export class AdminSeite {
  private tab: Tab = 'katalog';
  private suche = '';
  private artFilter: RezeptArt | 'alle' = 'alle';
  private offeneRezepte = new Set<string>();

  constructor(
    private readonly host: HTMLElement,
    private readonly aktuelleTorte: () => KuchenKonfig,
  ) {}

  private get d() {
    return kosten.daten;
  }

  private speicherWarnung = false;

  private speichern(): void {
    if (!kosten.geaendert() && !this.speicherWarnung) {
      this.speicherWarnung = true;
      alert('Der Browser konnte die Änderungen nicht dauerhaft speichern (Speicher voll oder privater Modus). Bitte „kosten.json herunterladen“, damit nichts verloren geht – oder Bilder verkleinern bzw. löschen.');
    }
    const status = this.host.querySelector('.admin-status');
    if (status) status.textContent = QUELLEN[kosten.quelle];
  }

  render(): void {
    const tabs = h('nav', { class: 'admin-tabs', 'aria-label': 'Bereiche' });
    for (const t of TABS) {
      const b = h('button', { type: 'button', class: t.id === this.tab ? 'aktiv' : '', 'aria-current': t.id === this.tab ? 'page' : undefined }, t.name);
      b.addEventListener('click', () => {
        this.tab = t.id;
        this.render();
      });
      tabs.append(b);
    }
    const inhalt = {
      katalog: () => this.katalog(),
      zutaten: () => this.zutaten(),
      rezepte: () => this.rezepte(),
      zuordnung: () => this.zuordnung(),
      kalkulation: () => this.kalkulation(),
      test: () => this.test(),
      daten: () => this.datenTab(),
    }[this.tab]();
    this.host.replaceChildren(
      h(
        'header',
        { class: 'admin-kopf' },
        h('div', {}, h('h1', {}, 'Verwaltung'), h('p', { class: 'admin-status' }, QUELLEN[kosten.quelle])),
        h('a', { class: 'knopf', href: '#' }, '← Zum Konfigurator'),
      ),
      tabs,
      h('section', { class: 'admin-inhalt' }, ...inhalt),
    );
  }

  /* ---------- Motivkatalog ---------- */

  private katalog(): Node[] {
    const datei = h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'versteckt' });
    datei.addEventListener('change', () => {
      const dateien = [...(datei.files ?? [])];
      void Promise.all(dateien.map((f) => bildEinlesen(f, 768, 0.82).then((bild) => ({ f, bild })))).then((liste) => {
        for (const { f, bild } of liste) {
          this.d.katalog.push({ id: neueId('m'), name: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), thema: 'Neu', bild, kosten: 1.5, trend: false, aktiv: true });
        }
        this.speichern();
        this.render();
      });
    });
    const themen = [...new Set(this.d.katalog.map((m) => m.thema))].sort((a, b) => a.localeCompare(b, 'de'));
    return [
      h(
        'p',
        { class: 'admin-hilfe' },
        'Eigene Druckmotive für den Fotoaufleger. Kunden sehen alle aktiven Motive im Konfigurator, „Trend“-Motive ganz vorn. Bitte nur selbst gestaltete Motive ohne geschützte Figuren, Namen oder Logos verwenden. Bilder werden auf 768 px verkleinert.',
      ),
      h('div', { class: 'admin-leiste' }, h('span', { class: 'leise' }, `${this.d.katalog.length} Motive · ${this.d.katalog.filter((m) => m.trend).length} Trend`), knopf('+ Bilder hochladen', () => datei.click(), 'haupt'), datei),
      h('datalist', { id: 'katalog-themen' }, ...themen.map((t) => h('option', { value: t }))),
      this.d.katalog.length
        ? h('div', { class: 'katalog-raster' }, ...this.d.katalog.map((m) => this.katalogKarte(m)))
        : h('div', { class: 'admin-karte' }, h('p', { class: 'admin-hilfe' }, 'Noch keine Motive. Lade eure selbst gestalteten Motive hoch, z. B. aus den KI-Prompts in docs/ki-prompts.md.')),
    ];
  }

  private katalogKarte(m: KatalogMotiv): HTMLElement {
    const trend = h('input', { type: 'checkbox' });
    trend.checked = m.trend;
    trend.addEventListener('change', () => ((m.trend = trend.checked), this.speichern()));
    const aktiv = h('input', { type: 'checkbox' });
    aktiv.checked = m.aktiv;
    aktiv.addEventListener('change', () => ((m.aktiv = aktiv.checked), karte.classList.toggle('inaktiv', !m.aktiv), this.speichern()));
    const karte = h(
      'div',
      { class: `katalog-karte${m.aktiv ? '' : ' inaktiv'}` },
      h('img', { src: m.bild, alt: m.name }),
      h('label', {}, 'Name', textEingabe(m.name, (w) => ((m.name = w), this.speichern()))),
      h('label', {}, 'Thema', textEingabe(m.thema, (w) => ((m.thema = w), this.speichern()), { list: 'katalog-themen' })),
      h('label', {}, 'Druckkosten (€)', zahlFeld(m.kosten, (w) => ((m.kosten = w), this.speichern()))),
      h('div', { class: 'katalog-schalter' }, h('label', { class: 'schalter' }, trend, h('span', {}, 'Trend')), h('label', { class: 'schalter' }, aktiv, h('span', {}, 'Sichtbar'))),
      knopf(
        'Löschen',
        () => {
          if (!confirm(`Motiv „${m.name}“ löschen?`)) return;
          this.d.katalog = this.d.katalog.filter((x) => x !== m);
          this.speichern();
          this.render();
        },
        'klein',
      ),
    );
    return karte;
  }

  /* ---------- Zutaten ---------- */

  private zutaten(): Node[] {
    const kategorien = [...new Set(this.d.zutaten.map((z) => z.kategorie))].sort((a, b) => a.localeCompare(b, 'de'));
    const liste = h('datalist', { id: 'kategorien' }, ...kategorien.map((k) => h('option', { value: k })));
    const suche = h('input', { type: 'search', placeholder: 'Zutat suchen …', value: this.suche, class: 'admin-suche' });
    const tabelle = h('div', { class: 'admin-tabelle-rahmen' });
    const zeichne = () => {
      const q = this.suche.trim().toLowerCase();
      const treffer = this.d.zutaten.filter((z) => !q || z.name.toLowerCase().includes(q) || z.kategorie.toLowerCase().includes(q));
      const gruppen = new Map<string, Zutat[]>();
      for (const z of treffer) gruppen.set(z.kategorie, [...(gruppen.get(z.kategorie) ?? []), z]);
      const tbody = h('tbody', {});
      for (const [kategorie, zutaten] of [...gruppen].sort(([a], [b]) => a.localeCompare(b, 'de'))) {
        tbody.append(h('tr', { class: 'gruppe' }, h('th', { colspan: 7 }, kategorie || 'Ohne Kategorie')));
        for (const z of zutaten) tbody.append(this.zutatZeile(z));
      }
      tabelle.replaceChildren(
        h(
          'table',
          { class: 'admin-tabelle' },
          h('thead', {}, h('tr', {}, ...['Zutat', 'Kategorie', 'Einheit', 'Packung', 'Preis (€)', 'Grundpreis', ''].map((t) => h('th', {}, t)))),
          tbody,
        ),
      );
    };
    suche.addEventListener('input', () => {
      this.suche = suche.value;
      zeichne();
    });
    zeichne();
    return [
      h('p', { class: 'admin-hilfe' }, 'Einkaufspreis je Packung eintragen. Rezepte rechnen automatisch mit dem Grundpreis (€ je kg, l oder Stück).'),
      h(
        'div',
        { class: 'admin-leiste' },
        suche,
        knopf(
          '+ Zutat',
          () => {
            this.d.zutaten.push({ id: neueId('z'), name: 'Neue Zutat', kategorie: kategorien[0] ?? 'Grundzutaten', einheit: 'g', packung: 1000, preis: 0 });
            this.suche = '';
            this.speichern();
            this.render();
          },
          'haupt',
        ),
      ),
      liste,
      tabelle,
    ];
  }

  private zutatZeile(z: Zutat): HTMLElement {
    const grund = h('td', { class: 'rechts leise' }, grundpreis(z));
    const einheit = h('span', { class: 'leise' }, einheitName(z.einheit));
    const neu = () => {
      grund.textContent = grundpreis(z);
      einheit.textContent = einheitName(z.einheit);
      this.speichern();
    };
    const verwendet = this.d.rezepte.filter((r) => r.positionen.some((p) => p.zutat === z.id));
    return h(
      'tr',
      {},
      h('td', {}, textEingabe(z.name, (w) => ((z.name = w), neu()), { 'aria-label': 'Name' })),
      h('td', {}, textEingabe(z.kategorie, (w) => ((z.kategorie = w), neu()), { list: 'kategorien', 'aria-label': 'Kategorie' })),
      h('td', {}, wahl(z.einheit, EINHEITEN, (w) => ((z.einheit = w), neu()))),
      h('td', { class: 'nowrap' }, zahlFeld(z.packung, (w) => ((z.packung = w), neu())), ' ', einheit),
      h('td', {}, zahlFeld(z.preis, (w) => ((z.preis = w), neu()))),
      grund,
      h(
        'td',
        {},
        knopf(
          '✕',
          () => {
            const frage = verwendet.length
              ? `„${z.name}“ wird in ${verwendet.length} Rezept(en) verwendet (${verwendet.map((r) => r.name).join(', ')}). Trotzdem löschen?`
              : `„${z.name}“ löschen?`;
            if (!confirm(frage)) return;
            this.d.zutaten = this.d.zutaten.filter((x) => x !== z);
            this.speichern();
            this.render();
          },
          'klein',
        ),
      ),
    );
  }

  /* ---------- Rezepte ---------- */

  private rezepte(): Node[] {
    const filter = h('div', { class: 'admin-chips' });
    for (const a of [{ id: 'alle' as const, name: 'Alle' }, ...ARTEN]) {
      const b = h('button', { type: 'button', class: a.id === this.artFilter ? 'aktiv' : '' }, a.name);
      b.addEventListener('click', () => {
        this.artFilter = a.id;
        this.render();
      });
      filter.append(b);
    }
    const liste = this.d.rezepte.filter((r) => this.artFilter === 'alle' || r.art === this.artFilter);
    return [
      h(
        'p',
        { class: 'admin-hilfe' },
        'Mengen beziehen sich auf eine runde Referenztorte (Standard Ø 26 cm, 8 cm hoch). Der Rechner skaliert nach Bezug: Volumen für Teig und Füllung, Oberfläche für Überzüge, Umfang für Bordüren – oder je Stück.',
      ),
      h(
        'div',
        { class: 'admin-leiste' },
        filter,
        knopf(
          '+ Rezept',
          () => {
            const art: RezeptArt = this.artFilter === 'alle' ? 'teig' : this.artFilter;
            const r: Rezept = { id: neueId('r'), name: 'Neues Rezept', art, bezug: art === 'deko' || art === 'zubehoer' ? 'stueck' : art === 'ueberzug' ? 'flaeche' : 'volumen', referenz: { durchmesser: 26, hoehe: 8 }, positionen: [] };
            this.d.rezepte.push(r);
            this.offeneRezepte.add(r.id);
            this.speichern();
            this.render();
          },
          'haupt',
        ),
      ),
      ...liste.map((r) => this.rezeptKarte(r)),
    ];
  }

  private rezeptKarte(r: Rezept): HTMLElement {
    const summe = h('span', { class: 'rezept-summe' });
    const artName = h('span', { class: 'leise' });
    const titel = h('span', {}, r.name);
    const zeilen: Array<() => void> = [];
    const neu = (struktur = false) => {
      summe.textContent = euro(rezeptKosten(this.d, r));
      artName.textContent = `${ARTEN.find((a) => a.id === r.art)?.name ?? r.art} · ${r.bezug === 'stueck' ? 'je Stück' : `Ø ${zahl(r.referenz.durchmesser)} × ${zahl(r.referenz.hoehe)} cm`}`;
      titel.textContent = r.name;
      zeilen.forEach((z) => z());
      this.speichern();
      if (struktur) this.render();
    };

    const zutatOptionen = [...this.d.zutaten].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((z) => ({ id: z.id, name: z.name }));
    const tbody = h('tbody', {});
    r.positionen.forEach((p, i) => {
      const zutat = () => this.d.zutaten.find((z) => z.id === p.zutat);
      const einheit = h('span', { class: 'leise' });
      const preis = h('td', { class: 'rechts' });
      zeilen.push(() => {
        const z = zutat();
        einheit.textContent = z ? einheitName(z.einheit) : '';
        preis.textContent = z && z.packung > 0 ? euro((p.menge * z.preis) / z.packung) : 'Zutat fehlt';
      });
      const optionen = zutat() ? zutatOptionen : [{ id: p.zutat, name: `(fehlt: ${p.zutat})` }, ...zutatOptionen];
      tbody.append(
        h(
          'tr',
          {},
          h('td', {}, wahl(p.zutat, optionen, (w) => ((p.zutat = w), neu()))),
          h('td', { class: 'nowrap' }, zahlFeld(p.menge, (w) => ((p.menge = w), neu())), ' ', einheit),
          preis,
          h('td', {}, knopf('✕', () => (r.positionen.splice(i, 1), neu(true)), 'klein')),
        ),
      );
    });

    const referenz = h(
      'div',
      { class: 'admin-reihe' },
      h('label', {}, 'Referenz Ø (cm) ', zahlFeld(r.referenz.durchmesser, (w) => ((r.referenz.durchmesser = w), neu()))),
      h('label', {}, 'Höhe (cm) ', zahlFeld(r.referenz.hoehe, (w) => ((r.referenz.hoehe = w), neu()))),
    );
    referenz.hidden = r.bezug === 'stueck';

    const karte = h(
      'details',
      { class: 'rezept-karte', open: this.offeneRezepte.has(r.id) },
      h('summary', {}, h('span', { class: 'rezept-titel' }, titel, artName), summe),
      h(
        'div',
        { class: 'rezept-inhalt' },
        h(
          'div',
          { class: 'admin-reihe' },
          h('label', { class: 'breit' }, 'Name ', textEingabe(r.name, (w) => ((r.name = w), neu()))),
          h('label', {}, 'Art ', wahl(r.art, ARTEN, (w) => ((r.art = w), neu()))),
          h('label', {}, 'Bezug ', wahl(r.bezug, BEZUEGE, (w) => ((r.bezug = w), neu(true)))),
        ),
        referenz,
        h(
          'table',
          { class: 'admin-tabelle' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Zutat'), h('th', {}, 'Menge'), h('th', { class: 'rechts' }, 'Kosten'), h('th', {}, ''))),
          tbody,
        ),
        h(
          'div',
          { class: 'knopfreihe' },
          knopf('+ Zutat', () => {
            r.positionen.push({ zutat: zutatOptionen[0]?.id ?? '', menge: 100 });
            neu(true);
          }),
          knopf('Duplizieren', () => {
            const kopie: Rezept = JSON.parse(JSON.stringify(r)) as Rezept;
            kopie.id = neueId('r');
            kopie.name = `${r.name} (Kopie)`;
            this.d.rezepte.splice(this.d.rezepte.indexOf(r) + 1, 0, kopie);
            this.offeneRezepte.add(kopie.id);
            neu(true);
          }),
          knopf(
            'Rezept löschen',
            () => {
              if (!confirm(`Rezept „${r.name}“ löschen?`)) return;
              this.d.rezepte = this.d.rezepte.filter((x) => x !== r);
              neu(true);
            },
            'klein',
          ),
        ),
      ),
    );
    karte.addEventListener('toggle', () => {
      if (karte.open) this.offeneRezepte.add(r.id);
      else this.offeneRezepte.delete(r.id);
    });
    summe.textContent = euro(rezeptKosten(this.d, r));
    artName.textContent = `${ARTEN.find((a) => a.id === r.art)?.name ?? r.art} · ${r.bezug === 'stueck' ? 'je Stück' : `Ø ${zahl(r.referenz.durchmesser)} × ${zahl(r.referenz.hoehe)} cm`}`;
    zeilen.forEach((z) => z());
    return karte;
  }

  /* ---------- Zuordnung ---------- */

  private zuordnung(): Node[] {
    const optionen = [{ id: '', name: '— keine Kosten —' }, ...this.d.rezepte.map((r) => ({ id: r.id, name: r.name }))];
    const zo = this.d.zuordnung;
    const zeile = (name: string, wert: string, setze: (w: string) => void) => {
      const fehlt = wert !== '' && !this.d.rezepte.some((r) => r.id === wert);
      return h('label', { class: 'zuordnung-zeile' }, h('span', {}, name), wahl(wert, fehlt ? [{ id: wert, name: `(fehlt: ${wert})` }, ...optionen] : optionen, (w) => (setze(w), this.speichern())));
    };
    const gruppe = (titel: string, eintraege: ReadonlyArray<{ id: string; name: string }>, ziel: Record<string, string>) =>
      h(
        'fieldset',
        { class: 'zuordnung' },
        h('legend', {}, titel),
        ...eintraege.filter((e) => e.id !== 'keine' && e.id !== 'kein').map((e) => zeile(e.name, ziel[e.id] ?? '', (w) => (ziel[e.id] = w))),
      );
    const einzeln = (feld: keyof Omit<Zuordnung, 'ueberzug' | 'borduere' | 'streusel' | 'topper' | 'platte'>, name: string) =>
      zeile(name, zo[feld], (w) => (zo[feld] = w));
    return [
      h('p', { class: 'admin-hilfe' }, 'Welches Rezept wird verwendet, wenn der Kunde dieses Element wählt? Teig und Füllung wählt der Kunde direkt im Konfigurator.'),
      h(
        'div',
        { class: 'zuordnung-raster' },
        gruppe('Überzüge', archiv.ueberzuege, zo.ueberzug),
        gruppe('Bordüren (Rezept für den Umfang der Referenztorte)', archiv.bordueren, zo.borduere),
        gruppe('Streusel (Menge bei mittlerer Streumenge)', archiv.streusel, zo.streusel),
        gruppe('Topper (je Stück)', archiv.topper, zo.topper),
        gruppe('Tortenplatte', archiv.platten, zo.platte),
        h(
          'fieldset',
          { class: 'zuordnung' },
          h('legend', {}, 'Weitere Elemente'),
          einzeln('dripDunkel', 'Drip dunkel'),
          einzeln('dripHell', 'Drip hell / farbig'),
          einzeln('einfaerben', 'Einfärben des Überzugs'),
          einzeln('metallic', 'Metallic-Farbe'),
          einzeln('motiv', 'Motiv (je 5-cm-Motiv)'),
          einzeln('schriftOben', 'Schrift oben (je Zeichen)'),
          einzeln('schriftSeite', 'Schrift seitlich (je Zeichen)'),
          einzeln('schriftStehend', 'Stehende Zahl (je Zeichen)'),
          einzeln('stecker', 'Stecker-Topper'),
          einzeln('schild', 'Namensschild'),
          einzeln('aufleger', 'Fotoaufleger'),
          einzeln('stuetze', 'Stütze je obere Etage'),
          einzeln('verpackung', 'Verpackung je Torte'),
        ),
      ),
    ];
  }

  /* ---------- Kalkulation ---------- */

  private kalkulation(): Node[] {
    const e = this.d.einstellungen;
    const feld = (name: string, key: keyof Omit<Einstellungen, 'minuten' | 'preisAnzeigen' | 'anfrageEmail'>, einheit: string) =>
      h('label', { class: 'zuordnung-zeile' }, h('span', {}, name), h('span', { class: 'nowrap' }, zahlFeld(e[key], (w) => ((e[key] = w), this.speichern())), ` ${einheit}`));
    const minute = (name: string, key: keyof Arbeitszeit) =>
      h('label', { class: 'zuordnung-zeile' }, h('span', {}, name), h('span', { class: 'nowrap' }, zahlFeld(e.minuten[key], (w) => ((e.minuten[key] = w), this.speichern())), ' min'));
    const anzeigen = h('input', { type: 'checkbox' });
    anzeigen.checked = e.preisAnzeigen;
    anzeigen.addEventListener('change', () => ((e.preisAnzeigen = anzeigen.checked), this.speichern()));
    return [
      h('p', { class: 'admin-hilfe' }, 'Preis = (Zutaten + Arbeitszeit × Stundensatz) × (1 + Aufschlag) × (1 + MwSt.), aufgerundet, mindestens Mindestpreis.'),
      h(
        'div',
        { class: 'zuordnung-raster' },
        h(
          'fieldset',
          { class: 'zuordnung' },
          h('legend', {}, 'Preis'),
          feld('Stundensatz', 'stundensatz', '€ / h'),
          feld('Aufschlag (Gemeinkosten, Gewinn)', 'aufschlag', '%'),
          feld('Mehrwertsteuer', 'mwst', '%'),
          feld('Aufrunden auf', 'rundung', '€'),
          feld('Mindestpreis', 'mindestpreis', '€'),
          feld('Fläche je Portion', 'portionFlaeche', 'cm²'),
          h('label', { class: 'schalter' }, anzeigen, h('span', {}, 'Richtpreis im Konfigurator anzeigen')),
          h(
            'label',
            { class: 'zuordnung-zeile' },
            h('span', {}, 'E-Mail für Wunschanfragen (leer = aus)'),
            textEingabe(e.anfrageEmail, (w) => ((e.anfrageEmail = w.trim()), this.speichern()), { type: 'email', placeholder: 'bestellung@…' }),
          ),
        ),
        h(
          'fieldset',
          { class: 'zuordnung' },
          h('legend', {}, 'Arbeitszeit'),
          minute('Grundaufwand je Torte', 'grund'),
          minute('je Etage (backen, füllen, einstreichen)', 'etage'),
          minute('zusätzlich je Fondant-Etage', 'fondant'),
          minute('je Bordüre', 'borduere'),
          minute('je Drip', 'drip'),
          minute('je Motiv', 'motiv'),
          minute('je Schriftzeichen', 'zeichen'),
          minute('je Namensschild', 'schild'),
          minute('Fotoaufleger', 'aufleger'),
          minute('je Topper-Stück', 'topper'),
          minute('Streusel', 'streusel'),
        ),
      ),
      h('p', { class: 'admin-hilfe' }, 'Hinweis: Steuersatz bitte mit der Buchhaltung abstimmen (Luxemburg: 3 % für die meisten Lebensmittel).'),
    ];
  }

  /* ---------- Testrechnung ---------- */

  private test(): Node[] {
    const k = berechne(this.aktuelleTorte(), this.d);
    const e = this.d.einstellungen;
    const zeile = (text: string, wert: string, klasse = '') => h('tr', { class: klasse }, h('td', {}, text), h('td', { class: 'rechts' }, wert));
    const gruppen = new Map<string, typeof k.posten>();
    for (const p of k.posten) gruppen.set(p.gruppe, [...(gruppen.get(p.gruppe) ?? []), p]);
    const posten = h('tbody', {});
    for (const [g, liste] of gruppen) {
      posten.append(h('tr', { class: 'gruppe' }, h('th', { colspan: 2 }, g)));
      for (const p of liste) posten.append(zeile(p.text, euro(p.kosten)));
    }
    return [
      h('p', { class: 'admin-hilfe' }, 'Kalkulation der Torte, die gerade im Konfigurator eingestellt ist.'),
      ...(k.hinweise.length ? [h('div', { class: 'admin-warnung' }, ...k.hinweise.map((t) => h('div', {}, `⚠ ${t}`)))] : []),
      h(
        'div',
        { class: 'zuordnung-raster' },
        h(
          'div',
          {},
          h('h2', {}, 'Rezepte'),
          h('table', { class: 'admin-tabelle' }, posten),
        ),
        h(
          'div',
          {},
          h('h2', {}, 'Preis'),
          h(
            'table',
            { class: 'admin-tabelle summe' },
            h(
              'tbody',
              {},
              zeile('Zutaten & Zubehör', euro(k.zutatenSumme)),
              zeile(`Arbeitszeit ${zahl(k.minuten / 60, 1)} h × ${euro(e.stundensatz)}`, euro(k.arbeit)),
              zeile('Selbstkosten', euro(k.selbstkosten), 'stark'),
              zeile(`Aufschlag ${zahl(e.aufschlag)} %`, euro(k.aufschlag)),
              zeile('Netto', euro(k.netto)),
              zeile(`MwSt. ${zahl(e.mwst)} %`, euro(k.mwst)),
              zeile('Brutto', euro(k.brutto)),
              zeile('Verkaufspreis (gerundet)', euro(k.preis), 'stark gross'),
              zeile('Portionen', `ca. ${k.portionen}`),
              zeile('Preis je Portion', euro(k.preis / k.portionen)),
            ),
          ),
          h('h2', {}, 'Einkaufsliste'),
          h(
            'table',
            { class: 'admin-tabelle' },
            h(
              'tbody',
              {},
              ...k.zutaten.map((v) =>
                h('tr', {}, h('td', {}, v.zutat.name), h('td', { class: 'rechts nowrap' }, `${zahl(v.menge, v.zutat.einheit === 'stk' ? 1 : 0)} ${einheitName(v.zutat.einheit)}`), h('td', { class: 'rechts' }, euro(v.kosten))),
              ),
            ),
          ),
        ),
      ),
    ];
  }

  /* ---------- Daten ---------- */

  private datenTab(): Node[] {
    const datei = h('input', { type: 'file', accept: 'application/json,.json' });
    datei.addEventListener('change', () => {
      const f = datei.files?.[0];
      if (!f) return;
      void f.text().then((text) => {
        try {
          kosten.importieren(text);
          alert('Kostendaten importiert.');
          this.render();
        } catch (err) {
          alert(`Import fehlgeschlagen: ${(err as Error).message}`);
        }
      });
    });
    return [
      h(
        'div',
        { class: 'admin-karte' },
        h('h2', {}, 'So kommen die Preise zu den Kunden'),
        h(
          'ol',
          {},
          h('li', {}, 'Änderungen auf dieser Seite werden automatisch in diesem Browser gespeichert.'),
          h('li', {}, '„kosten.json herunterladen“ klicken.'),
          h('li', {}, 'Die Datei im GitHub-Repository in den Ordner public/ hochladen (Add file → Upload files) und auf main speichern.'),
          h('li', {}, 'Nach dem automatischen Neuaufbau der Website rechnen alle Besucher mit diesen Preisen.'),
        ),
        h('p', { class: 'admin-hilfe' }, 'Die Seite hat noch keinen Server und keinen Login: Wer #admin aufruft, kann nur die Daten im eigenen Browser ändern – die veröffentlichten Preise bleiben unberührt.'),
        h(
          'div',
          { class: 'knopfreihe' },
          knopf(
            'kosten.json herunterladen',
            () => {
              const link = document.createElement('a');
              link.href = URL.createObjectURL(new Blob([kosten.exportieren()], { type: 'application/json' }));
              link.download = 'kosten.json';
              link.click();
              setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            },
            'haupt',
          ),
        ),
      ),
      h('div', { class: 'admin-karte' }, h('h2', {}, 'Datei importieren'), datei),
      h(
        'div',
        { class: 'admin-karte' },
        h('h2', {}, 'Zurücksetzen'),
        h(
          'div',
          { class: 'knopfreihe' },
          knopf('Lokale Änderungen verwerfen', () => {
            if (!confirm('Alle lokalen Änderungen verwerfen?')) return;
            kosten.lokalVerwerfen();
            this.render();
          }),
          knopf('Beispieldaten laden', () => {
            if (!confirm('Alle Zutaten und Rezepte durch die Beispieldaten ersetzen?')) return;
            kosten.beispielLaden();
            this.render();
          }),
        ),
      ),
    ];
  }
}
