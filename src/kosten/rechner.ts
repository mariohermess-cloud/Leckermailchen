import { archiv, finde } from '../archiv';
import { istMetallic } from '../archiv/farben';
import type { KuchenKonfig } from '../modell/typen';
import { makeOutline } from '../render/outline';
import { STANDARD_FUELLUNG, STANDARD_TEIG } from './standard';
import type { Bezug, Kalkulation, KostenDaten, Posten, Rezept, ZutatVerbrauch } from './typen';

/** Maße, mit denen ein Rezept hochgerechnet wird. */
type Mass = Record<Bezug, number>;

const einheitsMasse = new Map<string, { flaeche: number; umfang: number }>();

/** Fläche und Umfang einer Form mit „Radius“ 1. */
function einheitsMass(formId: string): { flaeche: number; umfang: number } {
  let m = einheitsMasse.get(formId);
  if (!m) {
    const o = makeOutline(finde(archiv.formen, formId).umriss(), 360);
    let a = 0;
    for (let i = 0; i < o.n; i++) {
      const j = (i + 1) % o.n;
      a += o.px[i] * o.pz[j] - o.px[j] * o.pz[i];
    }
    m = { flaeche: Math.abs(a) / 2, umfang: o.length };
    einheitsMasse.set(formId, m);
  }
  return m;
}

/** Maße einer runden Referenztorte. */
function referenzMass(rezept: Rezept): Mass {
  const r = rezept.referenz.durchmesser / 2;
  const h = rezept.referenz.hoehe;
  return { volumen: Math.PI * r * r * h, flaeche: Math.PI * r * r + 2 * Math.PI * r * h, umfang: 2 * Math.PI * r, stueck: 1 };
}

/** Mengenfaktor eines Rezepts für das gegebene Maß. */
export function faktor(rezept: Rezept, mass: Partial<Mass>): number {
  if (rezept.bezug === 'stueck') return mass.stueck ?? 1;
  const ref = referenzMass(rezept)[rezept.bezug];
  return ref > 0 ? (mass[rezept.bezug] ?? 0) / ref : 0;
}

/** Kosten einer Rezeptmenge (Faktor 1 = Referenz). */
export function rezeptKosten(daten: KostenDaten, rezept: Rezept, f = 1): number {
  let summe = 0;
  for (const p of rezept.positionen) {
    const zutat = daten.zutaten.find((z) => z.id === p.zutat);
    if (zutat && zutat.packung > 0) summe += (p.menge * f * zutat.preis) / zutat.packung;
  }
  return summe;
}

function hell(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return Math.min((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

function zeichen(text: string): number {
  return [...text.replace(/\s/g, '')].length;
}

export function berechne(k: KuchenKonfig, daten: KostenDaten): Kalkulation {
  const posten: Posten[] = [];
  const verbrauch = new Map<string, ZutatVerbrauch>();
  const hinweise: string[] = [];
  const m = daten.einstellungen.minuten;
  let minuten = m.grund;

  const verwende = (rezeptId: string | undefined, mass: Partial<Mass>, gruppe: string, text: string) => {
    if (!rezeptId) return;
    const rezept = daten.rezepte.find((x) => x.id === rezeptId);
    if (!rezept) {
      hinweise.push(`Rezept „${rezeptId}“ fehlt (${text})`);
      return;
    }
    const f = faktor(rezept, mass);
    if (f <= 0) return;
    let kosten = 0;
    for (const p of rezept.positionen) {
      const zutat = daten.zutaten.find((x) => x.id === p.zutat);
      if (!zutat) {
        hinweise.push(`Zutat „${p.zutat}“ aus „${rezept.name}“ fehlt`);
        continue;
      }
      const menge = p.menge * f;
      const preis = zutat.packung > 0 ? (menge * zutat.preis) / zutat.packung : 0;
      kosten += preis;
      const v = verbrauch.get(zutat.id) ?? { zutat, menge: 0, kosten: 0 };
      v.menge += menge;
      v.kosten += preis;
      verbrauch.set(zutat.id, v);
    }
    posten.push({ gruppe, text: `${text}: ${rezept.name}`, kosten });
  };

  const einheit = einheitsMass(k.form);
  const zo = daten.zuordnung;
  const oberste = k.etagen.length - 1;
  let portionsFlaeche = 0;
  let seitenFlaeche = 0;

  k.etagen.forEach((e, i) => {
    const r = e.durchmesser / 2;
    const flaecheOben = einheit.flaeche * r * r;
    const umfang = einheit.umfang * r;
    const seite = umfang * e.hoehe;
    const gruppe = k.etagen.length > 1 ? `Etage ${i + 1}` : 'Torte';
    const volumen = flaecheOben * e.hoehe;
    const flaeche = flaecheOben + seite;
    portionsFlaeche += flaecheOben;
    seitenFlaeche += seite;

    verwende(e.teig || STANDARD_TEIG, { volumen }, gruppe, 'Teig');
    if (e.fuellung !== 'keine') verwende(e.fuellung || STANDARD_FUELLUNG, { volumen }, gruppe, 'Füllung');
    verwende(zo.ueberzug[e.ueberzug], { flaeche }, gruppe, 'Überzug');
    minuten += m.etage;
    if (e.ueberzug === 'fondant') minuten += m.fondant;

    if (istMetallic(e.farbe)) verwende(zo.metallic, { flaeche }, gruppe, 'Farbe');
    else if (hell(e.farbe) < 225 && e.ueberzug !== 'ganache' && e.ueberzug !== 'naked') verwende(zo.einfaerben, { flaeche }, gruppe, 'Farbe');

    for (const [b, name] of [
      [e.borduereUnten, 'Bordüre unten'],
      [e.borduereOben, 'Bordüre oben'],
    ] as const) {
      if (b.typ === 'keine') continue;
      verwende(zo.borduere[b.typ], { umfang }, gruppe, name);
      minuten += m.borduere;
    }
    if (e.drip.aktiv) {
      const laenge = 0.6 + e.drip.laenge * 0.8;
      verwende(hell(e.drip.farbe) > 150 || istMetallic(e.drip.farbe) ? zo.dripHell : zo.dripDunkel, { umfang: umfang * laenge }, gruppe, 'Drip');
      minuten += m.drip;
    }
    if (i > 0) verwende(zo.stuetze, { stueck: 1 }, gruppe, 'Stütze');
  });

  // Streusel
  if (k.streusel.typ !== 'keine') {
    const r = k.etagen[oberste].durchmesser / 2;
    const oben = einheit.flaeche * r * r;
    const bereich = { oben, obenRand: oben * 0.3, seiteUnten: seitenFlaeche * 0.3, seiteGanz: seitenFlaeche, ueberall: oben + seitenFlaeche }[k.streusel.bereich];
    verwende(zo.streusel[k.streusel.typ], { flaeche: bereich * (k.streusel.menge / 0.5) }, 'Deko', 'Streusel');
    minuten += m.streusel;
  }

  for (const t of k.topper) {
    verwende(zo.topper[t.typ], { stueck: t.anzahl }, 'Deko', `${t.anzahl} × ${finde(archiv.topper, t.typ).name}`);
    minuten += m.topper * t.anzahl;
  }

  for (const s of k.symbole) {
    const anzahl = s.ort === 'seite' ? s.anzahl : 1;
    verwende(zo.motiv, { stueck: anzahl * (s.groesse / 5) ** 2 }, 'Motive', `${anzahl} × ${finde(archiv.symbole, s.symbol).name}`);
    minuten += m.motiv * anzahl;
  }

  for (const s of k.schrift) {
    const n = zeichen(s.text);
    if (n === 0) continue;
    const kurz = `„${s.text.length > 18 ? `${s.text.slice(0, 18)}…` : s.text}“`;
    if (s.ort === 'stecker') {
      verwende(zo.stecker, { stueck: 1 }, 'Schrift', kurz);
    } else if (s.ort === 'stehend') {
      verwende(zo.schriftStehend, { stueck: n * (s.groesse / 5) ** 2 }, 'Schrift', kurz);
      minuten += m.zeichen * n * 2;
    } else {
      const id = s.ort === 'oben' ? zo.schriftOben : zo.schriftSeite;
      verwende(id, { stueck: n * (s.groesse / 2) ** 2 }, 'Schrift', kurz);
      minuten += m.zeichen * n;
    }
    if (s.ort === 'oben' && s.schild !== 'kein') {
      verwende(zo.schild, { stueck: 1 }, 'Schrift', 'Schild');
      minuten += m.schild;
    }
  }

  if (k.aufleger.aktiv) {
    verwende(zo.aufleger, { stueck: 1 }, 'Deko', 'Fotoaufleger');
    minuten += m.aufleger;
    if (k.aufleger.katalog) {
      const motiv = daten.katalog.find((x) => x.id === k.aufleger.katalog);
      if (motiv) posten.push({ gruppe: 'Deko', text: `Katalogmotiv: ${motiv.name}`, kosten: motiv.kosten });
      else hinweise.push(`Katalogmotiv „${k.aufleger.katalog}“ fehlt`);
    }
  }

  verwende(zo.platte[k.platte.typ], { stueck: 1 }, 'Zubehör', 'Platte');
  verwende(zo.verpackung, { stueck: 1 }, 'Zubehör', 'Verpackung');

  const e = daten.einstellungen;
  const zutatenSumme = posten.reduce((s, p) => s + p.kosten, 0);
  const arbeit = (minuten / 60) * e.stundensatz;
  const selbstkosten = zutatenSumme + arbeit;
  const aufschlag = selbstkosten * (e.aufschlag / 100);
  const netto = selbstkosten + aufschlag;
  const mwst = netto * (e.mwst / 100);
  const brutto = netto + mwst;
  const gerundet = e.rundung > 0 ? Math.ceil(brutto / e.rundung - 1e-9) * e.rundung : brutto;

  return {
    posten,
    zutaten: [...verbrauch.values()].sort((a, b) => b.kosten - a.kosten),
    zutatenSumme,
    minuten,
    arbeit,
    selbstkosten,
    aufschlag,
    netto,
    mwst,
    brutto,
    preis: Math.max(e.mindestpreis, gerundet),
    portionen: Math.max(1, Math.round(portionsFlaeche / Math.max(1, e.portionFlaeche))),
    hinweise: [...new Set(hinweise)],
  };
}

export function euro(wert: number): string {
  return wert.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}
