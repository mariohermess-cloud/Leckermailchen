import type {
  BorduereEintrag,
  PlatteEintrag,
  SchildEintrag,
  StreuselEintrag,
  StreuselPalette,
  TopperEintrag,
  UeberzugEintrag,
} from '../modell/typen';

/**
 * Überzüge (Oberfläche des Grundkuchens).
 * STARTER-SET – wird anhand der Referenzfotos angepasst.
 */
export const ueberzuege: UeberzugEintrag[] = [
  {
    id: 'fondant',
    name: 'Fondant',
    beschreibung: 'Glatt und matt, weich gerundete Kante',
    kante: 0.9,
    rauheit: 0.62,
    glanz: 0,
    samt: 0.35,
    textur: 'glatt',
    starter: true,
  },
  {
    id: 'buttercreme',
    name: 'Buttercreme',
    beschreibung: 'Glatt gestrichen, scharfe Kante, feine Spachtelspuren',
    kante: 0.22,
    rauheit: 0.5,
    glanz: 0,
    samt: 0.15,
    textur: 'buttercreme',
    starter: true,
  },
  {
    id: 'sahne',
    name: 'Sahne',
    beschreibung: 'Weich aufgestrichene Sahne, leicht gerundete Kante',
    kante: 0.45,
    rauheit: 0.55,
    glanz: 0,
    samt: 0.2,
    textur: 'buttercreme',
  },
  {
    id: 'gekaemmt',
    name: 'Buttercreme gekämmt',
    beschreibung: 'Mit dem Garnierkamm gezogene Rillen',
    kante: 0.25,
    rauheit: 0.5,
    glanz: 0,
    samt: 0.15,
    textur: 'gekaemmt',
    starter: true,
  },
  {
    id: 'naked',
    name: 'Naked Cake',
    beschreibung: 'Dünn abgezogen, Böden schimmern durch',
    kante: 0.3,
    rauheit: 0.7,
    glanz: 0,
    samt: 0.1,
    textur: 'naked',
    starter: true,
  },
  {
    id: 'ganache',
    name: 'Ganache / Glasur',
    beschreibung: 'Glänzend überzogen',
    kante: 0.55,
    rauheit: 0.28,
    glanz: 0.7,
    samt: 0,
    textur: 'glatt',
    starter: true,
  },
  {
    id: 'velvet',
    name: 'Velvet (Samt-Spray)',
    beschreibung: 'Samtig-matte Oberfläche',
    kante: 0.6,
    rauheit: 0.95,
    glanz: 0,
    samt: 1,
    textur: 'glatt',
    starter: true,
  },
];

export const bordueren: BorduereEintrag[] = [
  { id: 'keine', name: 'Keine', art: 'keine', groesse: 0 },
  { id: 'perlen', name: 'Perlen', art: 'perlen', groesse: 0.8, starter: true },
  { id: 'perlenFein', name: 'Feine Perlen', art: 'perlen', groesse: 0.5, starter: true },
  { id: 'tupfen', name: 'Sterntupfen', art: 'tupfen', groesse: 1.25, starter: true },
  { id: 'muscheln', name: 'Muscheln', art: 'muscheln', groesse: 1.15, starter: true },
  { id: 'rosetten', name: 'Rosetten', art: 'rosetten', groesse: 1.5, starter: true },
  { id: 'gras', name: 'Gras', art: 'gras', groesse: 1.3, starter: true },
  { id: 'band', name: 'Band', art: 'band', groesse: 1.6, starter: true },
];

export const streusel: StreuselEintrag[] = [
  { id: 'keine', name: 'Keine', art: 'keine' },
  { id: 'staebchen', name: 'Zuckerstreusel', art: 'staebchen', starter: true },
  { id: 'perlen', name: 'Zuckerperlen', art: 'perlen', starter: true },
  { id: 'konfetti', name: 'Konfetti', art: 'konfetti', starter: true },
  { id: 'sterne', name: 'Sternchen', art: 'sterne', starter: true },
  { id: 'mandeln', name: 'Mandelblättchen', art: 'mandeln', farben: ['#e9cfa0', '#d9b57c', '#f1dfbd', '#c99a5b'] },
  { id: 'raspel', name: 'Schokoraspel', art: 'raspel', farben: ['#4a2a1a', '#643d22', '#3a1f13', '#6b4129'] },
  { id: 'raspelWeiss', name: 'Weiße Schokoraspel', art: 'raspel', farben: ['#f6ecd9', '#efe0c4', '#f6f3ee'] },
];

export const streuselPaletten: StreuselPalette[] = [
  { id: 'bunt', name: 'Bunt', farben: ['#e8463f', '#f6a623', '#f4d03f', '#58b368', '#3f8fd2', '#b565c9', '#f7f3ea'], starter: true },
  { id: 'pastell', name: 'Pastell', farben: ['#f7c6d4', '#f9e0a8', '#c3e6d2', '#bfdcf3', '#d5c3ec', '#f6f3ee'], starter: true },
  { id: 'rosa', name: 'Rosa-Mix', farben: ['#f2a8c0', '#e85b9a', '#f6f3ee', '#d6929f'], starter: true },
  { id: 'blau', name: 'Blau-Mix', farben: ['#a8d0e8', '#2f7bc8', '#f6f3ee', '#7fb2e0'], starter: true },
  { id: 'schoko', name: 'Schoko', farben: ['#643d22', '#3a2a1f', '#8a5a3a'], starter: true },
  { id: 'weiss', name: 'Weiß', farben: ['#f6f3ee', '#f1e3c0'], starter: true },
  { id: 'gold', name: 'Gold', farben: ['#c9a23a', '#e6c36a'], metallic: true, starter: true },
];

export const topper: TopperEintrag[] = [
  { id: 'erdbeeren', name: 'Erdbeeren', bau: 'erdbeere', radius: 1.5, faerbbar: false, standardFarbe: '#d8272e', starter: true },
  { id: 'himbeeren', name: 'Himbeeren', bau: 'himbeere', radius: 0.95, faerbbar: false, standardFarbe: '#c22b52', starter: true },
  { id: 'heidelbeeren', name: 'Heidelbeeren', bau: 'heidelbeere', radius: 0.62, faerbbar: false, standardFarbe: '#2f3a66', starter: true },
  { id: 'beerenmix', name: 'Beerenmix', bau: 'beerenmix', radius: 1.1, faerbbar: false, standardFarbe: '#d8272e', starter: true },
  { id: 'tupfen', name: 'Sahnetupfen', bau: 'tupfen', radius: 1.35, faerbbar: true, standardFarbe: '#f6f3ee', starter: true },
  { id: 'macarons', name: 'Macarons', bau: 'macaron', radius: 1.7, faerbbar: true, standardFarbe: '#f2a8c0', starter: true },
  { id: 'kugeln', name: 'Kugeln', bau: 'kugel', radius: 0.9, faerbbar: true, standardFarbe: '#c9a23a', starter: true },
  { id: 'blueten', name: 'Zuckerblüten', bau: 'bluete', radius: 1.5, faerbbar: true, standardFarbe: '#f6f3ee', starter: true },
  { id: 'kerzen', name: 'Kerzen', bau: 'kerze', radius: 0.7, faerbbar: true, standardFarbe: '#f6f3ee', starter: true },
];

export const platten: PlatteEintrag[] = [
  { id: 'gold', name: 'Tortenplatte Gold', art: 'karton', farbe: '#c9a23a', metallic: true, starter: true },
  { id: 'silber', name: 'Tortenplatte Silber', art: 'karton', farbe: '#cfd2d6', metallic: true, starter: true },
  { id: 'weiss', name: 'Tortenplatte Weiß', art: 'karton', farbe: '#f7f4ee', starter: true },
  { id: 'holz', name: 'Holzbrett', art: 'holz', farbe: '#a87b4f', starter: true },
  { id: 'staender', name: 'Tortenständer Weiß', art: 'staender', farbe: '#f7f4ee', starter: true },
  { id: 'keine', name: 'Ohne', art: 'keine', farbe: '#ffffff' },
];

/** Formen für Namensschilder (Fondant-Plakette unter dem Schriftzug). Aus den Referenzfotos abgeleitet. */
export const schilder: SchildEintrag[] = [
  { id: 'kein', name: 'Ohne Schild', art: 'kein' },
  { id: 'oval', name: 'Oval', art: 'oval' },
  { id: 'geschweift', name: 'Plakette', art: 'geschweift' },
  { id: 'wolke', name: 'Gewellt', art: 'wolke' },
  { id: 'rechteck', name: 'Rechteck', art: 'rechteck' },
  { id: 'banner', name: 'Banner', art: 'banner' },
];
