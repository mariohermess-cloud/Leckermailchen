import type { SymbolEintrag } from '../modell/typen';

/**
 * Symbole als geschichtete SVG-Pfade (Koordinaten 0…100, y nach unten wie in SVG).
 * Im Renderer werden sie zu flachen Fondant-Ausstechern extrudiert.
 *
 * Neues Symbol aufnehmen: Pfad(e) aus einem SVG kopieren, auf den Bereich 0…100 skalieren
 * und hier als Eintrag anlegen. `farbe: 'farbe'` = vom Kunden wählbar.
 *
 * STARTER-SET – die Symbole der Referenzfotos kommen hier dazu (mit `quelle`).
 */

const f = (n: number) => Math.round(n * 100) / 100;

function pol(r: number, grad: number, cx = 50, cy = 50): [number, number] {
  const a = (grad * Math.PI) / 180;
  return [f(cx + r * Math.cos(a)), f(cy + r * Math.sin(a))];
}

function kreis(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0Z`;
}

function vieleck(punkte: Array<[number, number]>): string {
  return 'M' + punkte.map((p) => `${p[0]} ${p[1]}`).join('L') + 'Z';
}

function stern(zacken: number, aussen: number, innen: number, cx = 50, cy = 52): string {
  const p: Array<[number, number]> = [];
  for (let i = 0; i < zacken * 2; i++) {
    p.push(pol(i % 2 === 0 ? aussen : innen, -90 + (i * 180) / zacken, cx, cy));
  }
  return vieleck(p);
}

/** Rechteck von (cx,cy) aus in Richtung `grad`, für Strahlen/Äste */
function strahl(cx: number, cy: number, grad: number, von: number, bis: number, breite: number): string {
  const a = (grad * Math.PI) / 180;
  const dx = Math.cos(a), dy = Math.sin(a);
  const nx = -dy * (breite / 2), ny = dx * (breite / 2);
  return vieleck([
    [f(cx + dx * von + nx), f(cy + dy * von + ny)],
    [f(cx + dx * bis + nx), f(cy + dy * bis + ny)],
    [f(cx + dx * bis - nx), f(cy + dy * bis - ny)],
    [f(cx + dx * von - nx), f(cy + dy * von - ny)],
  ]);
}

function spiegeln(d: string): string {
  // spiegelt absolute M/L/C-Koordinaten an der Achse x=50 (nur für Pfade mit Großbuchstaben-Befehlen)
  return d.replace(/([MLC])([^MLCZ]*)/g, (_m, befehl: string, rest: string) => {
    const zahlen = rest.trim().split(/[\s,]+/).map(Number);
    const neu = zahlen.map((z, i) => (i % 2 === 0 ? f(100 - z) : z));
    return befehl + neu.join(' ');
  });
}

function fussball(): { weiss: string; schwarz: string } {
  const teile: string[] = [];
  const fuenfeck: Array<[number, number]> = [];
  for (let k = 0; k < 5; k++) fuenfeck.push(pol(15, -90 + k * 72));
  teile.push(vieleck(fuenfeck));
  for (let k = 0; k < 5; k++) {
    const a = -90 + k * 72;
    teile.push(strahl(50, 50, a, 14, 30, 2.6));
    const [x1, y1] = pol(29, a);
    const [x2, y2] = pol(35, a + 19);
    const [x3, y3] = pol(44, a + 23);
    const [x4, y4] = pol(44, a - 23);
    const [x5, y5] = pol(35, a - 19);
    teile.push(`M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}A44 44 0 0 0 ${x4} ${y4}L${x5} ${y5}Z`);
  }
  return { weiss: kreis(50, 50, 45), schwarz: teile.join('') };
}

function bluete(blaetter: number): { blaetter: string; mitte: string } {
  let d = '';
  for (let k = 0; k < blaetter; k++) {
    const [x, y] = pol(25, -90 + (k * 360) / blaetter);
    d += kreis(x, y, 19);
  }
  return { blaetter: d + kreis(50, 50, 20), mitte: kreis(50, 50, 12) };
}

function kleeblatt(): string {
  let d = '';
  for (let k = 0; k < 4; k++) {
    const a = -90 + k * 90;
    const [mx, my] = pol(21, a);
    const [x1, y1] = pol(13, a - 90, mx, my);
    const [x2, y2] = pol(13, a + 90, mx, my);
    d += kreis(x1 + Math.cos((a * Math.PI) / 180) * 6, y1 + Math.sin((a * Math.PI) / 180) * 6, 13);
    d += kreis(x2 + Math.cos((a * Math.PI) / 180) * 6, y2 + Math.sin((a * Math.PI) / 180) * 6, 13);
    d += vieleck([[50, 50], [f(x1 + 0), f(y1 + 0)], pol(34, a), [f(x2 + 0), f(y2 + 0)]]);
  }
  return d;
}

function schneeflocke(): string {
  let d = '';
  for (let k = 0; k < 6; k++) {
    const a = -90 + k * 60;
    d += strahl(50, 50, a, 0, 44, 5);
    for (const r of [20, 31]) {
      const [x, y] = pol(r, a);
      d += strahl(x, y, a + 55, 0, r === 20 ? 13 : 9, 4);
      d += strahl(x, y, a - 55, 0, r === 20 ? 13 : 9, 4);
    }
  }
  return d + kreis(50, 50, 7);
}

function regenbogen(): Array<{ d: string; farbe: string }> {
  const farbenListe = ['#e8463f', '#f6a623', '#f4d03f', '#58b368', '#3f8fd2', '#8e5cc0'];
  const baender: Array<{ d: string; farbe: string }> = [];
  const breite = 6;
  farbenListe.forEach((farbe, i) => {
    const ra = 44 - i * breite;
    const ri = ra - breite - 0.4; // leichte Überlappung gegen Lücken
    baender.push({
      farbe,
      d: `M${f(50 - ra)} 72A${ra} ${ra} 0 0 1 ${f(50 + ra)} 72L${f(50 + ri)} 72A${ri} ${ri} 0 0 0 ${f(50 - ri)} 72Z`,
    });
  });
  return baender;
}

const ball = fussball();
const blume5 = bluete(5);
const blume6 = bluete(6);

const fluegelOben = 'M52 48C60 18 92 8 95 30C97 47 74 55 52 52Z';
const fluegelUnten = 'M52 54C72 54 91 62 85 79C79 93 58 81 52 60Z';
const schleifeLinks = 'M50 46C40 30 16 20 7 27C2 40 4 60 11 68C24 66 42 58 50 52Z';
const schleifeBand = 'M46 58L30 92L42 85L48 94L53 60Z';

export const symbole: SymbolEintrag[] = [
  {
    id: 'herz',
    name: 'Herz',
    kategorie: 'Liebe',
    starter: true,
    ebenen: [{ d: 'M50 90C20 68 5 49 5 32C5 17 16 7 29 7C38 7 46 12 50 21C54 12 62 7 71 7C84 7 95 17 95 32C95 49 80 68 50 90Z', farbe: 'farbe', ebene: 0 }],
  },
  {
    id: 'stern',
    name: 'Stern',
    kategorie: 'Formen',
    starter: true,
    ebenen: [{ d: stern(5, 47, 20), farbe: 'farbe', ebene: 0 }],
  },
  {
    id: 'funkelstern',
    name: 'Funkelstern',
    kategorie: 'Formen',
    starter: true,
    ebenen: [{ d: 'M50 4C53 34 66 47 96 50C66 53 53 66 50 96C47 66 34 53 4 50C34 47 47 34 50 4Z', farbe: 'farbe', ebene: 0 }],
  },
  {
    id: 'krone',
    name: 'Krone',
    kategorie: 'Kinder',
    starter: true,
    zweifarbig: true,
    ebenen: [
      { d: 'M12 82L6 30L29 52L50 16L71 52L94 30L88 82Z', farbe: 'farbe', ebene: 0 },
      { d: kreis(6, 28, 6) + kreis(50, 14, 6.5) + kreis(94, 28, 6), farbe: 'farbe2', ebene: 1 },
      { d: kreis(30, 70, 4.5) + kreis(50, 70, 5.5) + kreis(70, 70, 4.5), farbe: 'farbe2', ebene: 1 },
    ],
  },
  {
    id: 'blume',
    name: 'Blume',
    kategorie: 'Natur',
    starter: true,
    zweifarbig: true,
    ebenen: [
      { d: blume5.blaetter, farbe: 'farbe', ebene: 0 },
      { d: blume5.mitte, farbe: 'farbe2', ebene: 1 },
    ],
  },
  {
    id: 'gaensebluemchen',
    name: 'Blüte (6 Blätter)',
    kategorie: 'Natur',
    starter: true,
    zweifarbig: true,
    ebenen: [
      { d: blume6.blaetter, farbe: 'farbe', ebene: 0 },
      { d: blume6.mitte, farbe: 'farbe2', ebene: 1 },
    ],
  },
  {
    id: 'blatt',
    name: 'Blatt',
    kategorie: 'Natur',
    starter: true,
    ebenen: [{ d: 'M50 4C82 28 86 64 50 96C14 64 18 28 50 4Z', farbe: 'farbe', ebene: 0 }],
  },
  {
    id: 'kleeblatt',
    name: 'Kleeblatt',
    kategorie: 'Natur',
    starter: true,
    ebenen: [{ d: kleeblatt(), farbe: 'farbe', ebene: 0 }],
  },
  {
    id: 'schmetterling',
    name: 'Schmetterling',
    kategorie: 'Natur',
    starter: true,
    zweifarbig: true,
    ebenen: [
      { d: fluegelOben + spiegeln(fluegelOben) + fluegelUnten + spiegeln(fluegelUnten), farbe: 'farbe', ebene: 0 },
      { d: 'M50 28C55 28 55 78 50 84C45 78 45 28 50 28Z', farbe: 'farbe2', ebene: 1 },
    ],
  },
  {
    id: 'fussball',
    name: 'Fußball',
    kategorie: 'Sport',
    starter: true,
    ebenen: [
      { d: ball.weiss, farbe: '#f6f3ee', ebene: 0 },
      { d: ball.schwarz, farbe: '#1e1e1e', ebene: 1 },
    ],
  },
  {
    id: 'ballon',
    name: 'Luftballon',
    kategorie: 'Party',
    starter: true,
    ebenen: [
      { d: 'M50 5C72 5 87 23 87 42C87 62 69 77 55 81L59 90L41 90L45 81C31 77 13 62 13 42C13 23 28 5 50 5Z', farbe: 'farbe', ebene: 0 },
      { d: 'M33 22C38 15 46 13 49 16C45 18 38 24 36 31C33 30 32 26 33 22Z', farbe: '#ffffff', ebene: 1 },
    ],
  },
  {
    id: 'schleife',
    name: 'Schleife',
    kategorie: 'Party',
    starter: true,
    ebenen: [
      { d: schleifeBand + spiegeln(schleifeBand), farbe: 'farbe', ebene: 0 },
      { d: schleifeLinks + spiegeln(schleifeLinks), farbe: 'farbe', ebene: 1 },
      { d: 'M43 37L57 37C60 37 62 39 62 42L62 58C62 61 60 63 57 63L43 63C40 63 38 61 38 58L38 42C38 39 40 37 43 37Z', farbe: 'farbe', ebene: 2 },
    ],
  },
  {
    id: 'wolke',
    name: 'Wolke',
    kategorie: 'Baby',
    starter: true,
    ebenen: [{ d: 'M26 78C12 78 3 68 3 57C3 46 12 38 23 38C25 23 37 13 51 13C65 13 76 22 80 35C91 36 98 45 98 56C98 68 89 78 76 78Z', farbe: 'farbe', ebene: 0 }],
  },
  {
    id: 'mond',
    name: 'Mond',
    kategorie: 'Baby',
    starter: true,
    ebenen: [{ d: 'M62 6A45 45 0 1 0 95 66A37 37 0 1 1 62 6Z', farbe: 'farbe', ebene: 0 }],
  },
  {
    id: 'tatze',
    name: 'Pfote',
    kategorie: 'Tiere',
    starter: true,
    ebenen: [
      {
        d: 'M50 46C66 46 81 62 77 77C74 89 60 84 50 84C40 84 26 89 23 77C19 62 34 46 50 46Z' + kreis(22, 42, 9.5) + kreis(39, 24, 10.5) + kreis(61, 24, 10.5) + kreis(78, 42, 9.5),
        farbe: 'farbe',
        ebene: 0,
      },
    ],
  },
  {
    id: 'regenbogen',
    name: 'Regenbogen',
    kategorie: 'Kinder',
    starter: true,
    ebenen: [
      ...regenbogen().map((b) => ({ d: b.d, farbe: b.farbe, ebene: 0 })),
      { d: kreis(10, 72, 9) + kreis(22, 74, 8) + kreis(16, 66, 8), farbe: '#f6f3ee', ebene: 1 },
      { d: kreis(90, 72, 9) + kreis(78, 74, 8) + kreis(84, 66, 8), farbe: '#f6f3ee', ebene: 1 },
    ],
  },
  {
    id: 'schneeflocke',
    name: 'Schneeflocke',
    kategorie: 'Winter',
    starter: true,
    ebenen: [{ d: schneeflocke(), farbe: 'farbe', ebene: 0 }],
  },
  {
    id: 'tanne',
    name: 'Tanne',
    kategorie: 'Winter',
    starter: true,
    zweifarbig: true,
    ebenen: [
      { d: 'M44 80L56 80L56 96L44 96Z', farbe: 'farbe2', ebene: 0 },
      { d: 'M50 4L72 34L62 34L80 58L68 58L88 84L12 84L32 58L20 58L38 34L28 34Z', farbe: 'farbe', ebene: 1 },
    ],
  },
  {
    id: 'note',
    name: 'Note',
    kategorie: 'Musik',
    starter: true,
    ebenen: [
      {
        d: 'M36 18L84 8L84 68L76 68L76 29L44 36L44 78L36 78Z' + kreis(31, 78, 13) + kreis(71, 68, 13),
        farbe: 'farbe',
        ebene: 0,
      },
    ],
  },
  {
    id: 'kreis',
    name: 'Punkt',
    kategorie: 'Formen',
    starter: true,
    ebenen: [{ d: kreis(50, 50, 44), farbe: 'farbe', ebene: 0 }],
  },
];
