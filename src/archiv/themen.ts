import type { BorduereKonfig, KuchenKonfig, ThemaEintrag } from '../modell/typen';
import { leereKonfig, neueEtage, neueSchrift, neuesSymbol, neuerTopper } from '../modell/konfig';
import { farbeNachId as f } from './farben';

function konfig(teil: Partial<KuchenKonfig>): KuchenKonfig {
  return { ...leereKonfig(), ...teil };
}
const bord = (typ: string, farbe: string): BorduereKonfig => ({ typ, farbe: f(farbe) });
const stecker = (farbe: string, teil = {}) =>
  neueSchrift({ text: 'Happy Birthday', schrift: 'greatVibes', ort: 'stecker', farbe: f(farbe), groesse: 2.3, versatz: -0.55, ...teil });
const schild = (text: string, form: string, schildFarbe: string, teil = {}) =>
  neueSchrift({ text, schrift: 'dancingScript', farbe: f('schoko'), groesse: 1.7, schild: form, schildFarbe: f(schildFarbe), versatz: 0.5, ...teil });
const zahl = (text: string, farbe: string, teil = {}) =>
  neueSchrift({ text, schrift: 'fredoka', ort: 'stehend', farbe: f(farbe), groesse: 5.5, x: 0.4, versatz: -0.15, ...teil });

/**
 * Vorlagen = komplette Designs als Startpunkt, die der Kunde frei verändert.
 * Jede Vorlage ist aus den analysierten Leckermailchen-Torten abgeleitet; `quelle` nennt die
 * Motiv-IDs aus analyse/kuchen.json. Lizenzfiguren (Paw Patrol, Stitch …) sind bewusst nicht
 * nachgebaut – dafür gibt es den Fotoaufleger mit eigenem Bild.
 */
export const themen: ThemaEintrag[] = [
  {
    id: 'sahne-erdbeer',
    name: 'Sahnetorte mit Erdbeeren',
    anlass: 'Geburtstag',
    beschreibung: 'Gekämmte Sahne, Sahnetupfen, Erdbeeren, stehende Zahl und Namensschild',
    quelle: ['K262', 'K081'],
    konfig: konfig({
      thema: 'sahne-erdbeer',
      etagen: [neueEtage({ durchmesser: 24, hoehe: 9, ueberzug: 'gekaemmt', farbe: f('weiss'), borduereOben: bord('tupfen', 'weiss'), borduereUnten: bord('tupfen', 'weiss') })],
      topper: [neuerTopper({ typ: 'erdbeeren', anordnung: 'halbmond', anzahl: 7 })],
      schrift: [zahl('17', 'rosa', { x: 0.35 }), schild('Lea', 'wolke', 'rosa', { x: 0.1 }), stecker('pink')],
      seed: 3,
    }),
  },
  {
    id: 'bauernhof',
    name: 'Bauernhof',
    anlass: 'Kindergeburtstag',
    beschreibung: 'Hellgrüner Fondant, Graskante, Blümchen, goldene Zahl und Namensschild',
    quelle: ['K005', 'K066', 'K213', 'K384'],
    konfig: konfig({
      thema: 'bauernhof',
      etagen: [neueEtage({ durchmesser: 24, hoehe: 9, ueberzug: 'fondant', farbe: f('hellgruen'), borduereUnten: bord('gras', 'gruen'), borduereOben: bord('gras', 'gruen') })],
      symbole: [
        neuesSymbol({ symbol: 'gaensebluemchen', farbe: f('flieder'), farbe2: f('gelb'), ort: 'seite', groesse: 2.5, hoehe: 0.55, anzahl: 8 }),
        neuesSymbol({ symbol: 'blume', farbe: f('rosa'), farbe2: f('gelb'), ort: 'oben', groesse: 3, x: -0.55, y: 0.1 }),
        neuesSymbol({ symbol: 'wolke', farbe: f('weiss'), ort: 'stehend', groesse: 6, x: -0.35, y: -0.55 }),
      ],
      schrift: [zahl('2', 'gold', { x: 0.3, versatz: -0.3 }), schild('Felix', 'geschweift', 'gelb', { x: 0.15 }), schild('Happy Birthday', 'geschweift', 'hellblau', { versatz: 0.05, x: -0.2, groesse: 1.2 })],
      seed: 5,
    }),
  },
  {
    id: 'fruechte-blech',
    name: 'Früchtetorte',
    anlass: 'Geburtstag · Feier',
    beschreibung: 'Rechteckige Sahnetorte mit Mandelrand, dicht mit Beeren belegt',
    quelle: ['K038', 'K343'],
    konfig: konfig({
      thema: 'fruechte-blech',
      form: 'rechteck',
      etagen: [neueEtage({ durchmesser: 34, hoehe: 7, ueberzug: 'sahne', farbe: f('cremeweiss'), borduereOben: bord('tupfen', 'cremeweiss') })],
      streusel: { typ: 'mandeln', palette: 'weiss', menge: 0.8, bereich: 'seiteGanz' },
      topper: [neuerTopper({ typ: 'beerenmix', anordnung: 'verstreut', anzahl: 40 })],
      schrift: [stecker('tuerkis', { versatz: -0.3 })],
      seed: 4,
    }),
  },
  {
    id: 'schwarz-gold',
    name: 'Black & Gold',
    anlass: 'Runder Geburtstag',
    beschreibung: 'Schwarze Torte mit goldenem Drip, Macarons, Kugeln und goldenen Steckern',
    quelle: ['K285', 'K335', 'K493', 'K437'],
    konfig: konfig({
      thema: 'schwarz-gold',
      etagen: [neueEtage({ durchmesser: 20, hoehe: 12, ueberzug: 'fondant', farbe: f('schwarz'), drip: { aktiv: true, farbe: f('gold'), laenge: 0.5, dichte: 0.6 }, borduereUnten: bord('perlen', 'gold') })],
      topper: [neuerTopper({ typ: 'macarons', anordnung: 'halbmond', anzahl: 4, farbe: f('gold') }), neuerTopper({ typ: 'kugeln', anordnung: 'verstreut', anzahl: 8, farbe: f('gold') })],
      schrift: [stecker('gold'), neueSchrift({ text: '18', schrift: 'playfair', ort: 'stecker', farbe: f('gold'), groesse: 4, x: 0.55, versatz: 0.25 })],
      seed: 6,
    }),
  },
  {
    id: 'hochzeit',
    name: 'Hochzeit mit Rosenweiß',
    anlass: 'Hochzeit',
    beschreibung: 'Drei Etagen in Elfenbein mit weißen Blüten und Perlenrand',
    quelle: ['K288', 'K259', 'K342', 'K139'],
    konfig: konfig({
      thema: 'hochzeit',
      etagen: [
        neueEtage({ durchmesser: 30, hoehe: 11, ueberzug: 'buttercreme', farbe: f('cremeweiss'), borduereUnten: bord('perlenFein', 'weiss') }),
        neueEtage({ durchmesser: 22, hoehe: 11, ueberzug: 'buttercreme', farbe: f('cremeweiss'), borduereUnten: bord('perlenFein', 'weiss') }),
        neueEtage({ durchmesser: 15, hoehe: 11, ueberzug: 'buttercreme', farbe: f('cremeweiss'), borduereUnten: bord('perlenFein', 'weiss') }),
      ],
      topper: [neuerTopper({ typ: 'blueten', anordnung: 'mitte', anzahl: 7, farbe: f('weiss') })],
      symbole: [neuesSymbol({ symbol: 'blatt', farbe: f('gruen'), ort: 'seite', etage: 1, groesse: 3, hoehe: 0.6, anzahl: 3, winkel: -20, drehung: 30 })],
      seed: 2,
    }),
  },
  {
    id: 'blueten-gold',
    name: 'Blüten & Gold',
    anlass: 'Geburtstag · Jubiläum',
    beschreibung: 'Hohe weiße Torte mit Zuckerblüten, goldener Zahl und feinem Perlenrand',
    quelle: ['K345', 'K346', 'K138', 'K291'],
    konfig: konfig({
      thema: 'blueten-gold',
      etagen: [neueEtage({ durchmesser: 18, hoehe: 14, ueberzug: 'fondant', farbe: f('weiss'), borduereUnten: bord('perlenFein', 'weiss') })],
      topper: [neuerTopper({ typ: 'blueten', anordnung: 'halbmond', anzahl: 6, farbe: f('rosa') })],
      streusel: { typ: 'perlen', palette: 'gold', menge: 0.25, bereich: 'obenRand' },
      schrift: [neueSchrift({ text: '50', schrift: 'playfair', ort: 'seite', farbe: f('gold'), groesse: 4.5 }), stecker('gold')],
      seed: 9,
    }),
  },
  {
    id: 'herz',
    name: 'Herztorte',
    anlass: 'Geburtstag · Liebe',
    beschreibung: 'Weiße Herztorte mit hellblauen Muschelrändern und Buchstaben',
    quelle: ['K115', 'K078', 'K088', 'K154'],
    konfig: konfig({
      thema: 'herz',
      form: 'herz',
      etagen: [neueEtage({ durchmesser: 26, hoehe: 7, ueberzug: 'sahne', farbe: f('weiss'), borduereUnten: bord('muscheln', 'hellblau'), borduereOben: bord('muscheln', 'hellblau') })],
      symbole: [neuesSymbol({ symbol: 'gaensebluemchen', farbe: f('flieder'), farbe2: f('gelb'), ort: 'oben', groesse: 2.2, x: -0.45, y: -0.5 }), neuesSymbol({ symbol: 'schmetterling', farbe: f('flieder'), farbe2: f('lila'), ort: 'oben', groesse: 3, x: 0.45, y: -0.5, drehung: 15 })],
      schrift: [neueSchrift({ text: 'Sweet 16', schrift: 'fredoka', farbe: f('hellblau'), groesse: 2.4, versatz: -0.1 })],
      seed: 4,
    }),
  },
  {
    id: 'fototorte',
    name: 'Wunschfoto-Torte',
    anlass: 'Jeder Anlass',
    beschreibung: 'Rechteckige Torte mit eigenem Foto, goldenem Stecker, Macarons und Kugeln',
    quelle: ['K163', 'K325', 'K194', 'K374'],
    konfig: konfig({
      thema: 'fototorte',
      form: 'rechteck',
      etagen: [neueEtage({ durchmesser: 34, hoehe: 7, ueberzug: 'fondant', farbe: f('weiss'), borduereUnten: bord('perlen', 'weiss') })],
      aufleger: { aktiv: true, form: 'rechteck', groesse: 0.7, bild: null, motiv: 'foto', x: -0.3, y: 0, rand: true, randFarbe: f('weiss') },
      topper: [neuerTopper({ typ: 'macarons', anordnung: 'verstreut', anzahl: 3, farbe: f('gelb') }), neuerTopper({ typ: 'kugeln', anordnung: 'verstreut', anzahl: 6, farbe: f('schoko') })],
      schrift: [stecker('gold', { x: 0.5, versatz: -0.4, groesse: 1.8 })],
      seed: 12,
    }),
  },
  {
    id: 'regenbogen',
    name: 'Regenbogen',
    anlass: 'Kindergeburtstag',
    beschreibung: 'Hohe weiße Torte mit stehendem Regenbogen, bunten Kugeln, Herzen und Zahl',
    quelle: ['K219', 'K277', 'K485', 'K222'],
    konfig: konfig({
      thema: 'regenbogen',
      etagen: [neueEtage({ durchmesser: 18, hoehe: 13, ueberzug: 'fondant', farbe: f('weiss'), borduereUnten: bord('muscheln', 'rot'), borduereOben: bord('muscheln', 'rot') })],
      symbole: [
        neuesSymbol({ symbol: 'regenbogen', ort: 'stehend', groesse: 11, x: -0.1, y: -0.4 }),
        neuesSymbol({ symbol: 'herz', farbe: f('rot'), ort: 'seite', groesse: 2.2, hoehe: 0.55, anzahl: 9 }),
      ],
      topper: [neuerTopper({ typ: 'kugeln', anordnung: 'verstreut', anzahl: 7, farbe: f('hellblau') })],
      schrift: [zahl('4', 'gelb', { x: 0.55, versatz: 0.1, groesse: 5 }), schild('Mia', 'oval', 'gelb', { versatz: 0.6, x: -0.2, groesse: 1.4 })],
      seed: 8,
    }),
  },
  {
    id: 'baby-boho',
    name: 'Baby & Taufe',
    anlass: 'Taufe · Babyparty',
    beschreibung: 'Rosé-beiger Fondant mit Boho-Regenbogen, Wolken, goldenen Sternen und Perlenrand',
    quelle: ['K159', 'K129', 'K370', 'K481'],
    konfig: konfig({
      thema: 'baby-boho',
      etagen: [neueEtage({ durchmesser: 18, hoehe: 13, ueberzug: 'fondant', farbe: '#ead2c4', borduereUnten: bord('perlen', 'cremeweiss') })],
      symbole: [
        neuesSymbol({ symbol: 'wolke', farbe: f('weiss'), ort: 'seite', groesse: 4.5, hoehe: 0.7, anzahl: 4, winkel: 25 }),
        neuesSymbol({ symbol: 'stern', farbe: f('gold'), ort: 'seite', groesse: 1.8, hoehe: 0.42, anzahl: 9 }),
        neuesSymbol({ symbol: 'wolke', farbe: f('weiss'), ort: 'stehend', groesse: 7, x: 0, y: -0.3 }),
        neuesSymbol({ symbol: 'mond', farbe: f('gold'), ort: 'oben', groesse: 4, x: 0.45, y: 0.3 }),
      ],
      schrift: [schild('Emil', 'wolke', 'hellblau', { versatz: 0.45, x: -0.25, groesse: 1.5 })],
      seed: 7,
    }),
  },
  {
    id: 'gluecksklee',
    name: 'Glücksklee',
    anlass: 'Geburtstag',
    beschreibung: 'Hellgelbe Cremetorte mit Muschelbordüren, Kleeblatt, Margeriten und Zahl',
    quelle: ['K454', 'K435'],
    konfig: konfig({
      thema: 'gluecksklee',
      form: 'rechteck',
      etagen: [neueEtage({ durchmesser: 32, hoehe: 7, ueberzug: 'buttercreme', farbe: f('hellgelb'), borduereUnten: bord('muscheln', 'cremeweiss'), borduereOben: bord('muscheln', 'cremeweiss') })],
      symbole: [
        neuesSymbol({ symbol: 'kleeblatt', farbe: f('hellgruen'), ort: 'oben', groesse: 9, x: -0.5, y: -0.1 }),
        neuesSymbol({ symbol: 'gaensebluemchen', farbe: f('weiss'), farbe2: f('gelb'), ort: 'oben', groesse: 2.6, x: 0.1, y: -0.55 }),
        neuesSymbol({ symbol: 'gaensebluemchen', farbe: f('weiss'), farbe2: f('gelb'), ort: 'oben', groesse: 2.2, x: 0.75, y: 0.5 }),
      ],
      schrift: [zahl('18', 'gruen', { x: 0.55, versatz: -0.35, groesse: 4.5 }), schild('Lara', 'geschweift', 'hellgruen', { x: 0.35 })],
      seed: 10,
    }),
  },
  {
    id: 'schoko',
    name: 'Schokoladentorte',
    anlass: 'Geburtstag',
    beschreibung: 'Schokotorte mit Raspelrand, gespritzter Schrift, Kugeln und goldenem Stecker',
    quelle: ['K324', 'K004', 'K001', 'K049'],
    konfig: konfig({
      thema: 'schoko',
      form: 'rechteck',
      etagen: [neueEtage({ durchmesser: 32, hoehe: 7, ueberzug: 'ganache', farbe: f('schoko'), borduereOben: bord('tupfen', 'cremeweiss') })],
      streusel: { typ: 'raspel', palette: 'schoko', menge: 0.8, bereich: 'seiteGanz' },
      topper: [neuerTopper({ typ: 'kugeln', anordnung: 'verstreut', anzahl: 10, farbe: f('zartbitter') })],
      schrift: [neueSchrift({ text: 'Alles Gute', schrift: 'pacifico', farbe: f('weiss'), groesse: 2.4, versatz: 0.2 }), stecker('gold', { versatz: -0.45 })],
      seed: 11,
    }),
  },
  {
    id: 'fussball',
    name: 'Fußballfeld',
    anlass: 'Kindergeburtstag',
    beschreibung: 'Mintgrüner Fondant mit Grasrand, Fußbällen und Wolkenschild',
    quelle: ['K135', 'K091', 'K453', 'K471'],
    konfig: konfig({
      thema: 'fussball',
      etagen: [neueEtage({ durchmesser: 24, hoehe: 9, ueberzug: 'fondant', farbe: f('mint'), borduereUnten: bord('gras', 'hellgruen') })],
      symbole: [
        neuesSymbol({ symbol: 'fussball', ort: 'seite', groesse: 3.6, hoehe: 0.6, anzahl: 6 }),
        neuesSymbol({ symbol: 'fussball', ort: 'stehend', groesse: 7, x: -0.35, y: -0.4 }),
      ],
      schrift: [schild('Dylan', 'wolke', 'hellblau', { x: 0 }), zahl('11', 'blau', { x: 0.45, versatz: -0.3, groesse: 4.5 }), stecker('blau', { x: -0.1 })],
      seed: 2,
    }),
  },
];
