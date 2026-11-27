import type { AuflegerMotiv } from '../modell/typen';

type Ctx = CanvasRenderingContext2D;

function himmel(ctx: Ctx, s: number, oben: string, unten: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, oben);
  g.addColorStop(1, unten);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
}

function stern(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Beispielmotive für den Fotoaufleger, solange der Kunde kein eigenes Bild hochgeladen hat.
 * Bewusst einfache, selbst gezeichnete Motive – echte Kundenfotos kommen per Upload.
 */
export const auflegerMotive: AuflegerMotiv[] = [
  {
    id: 'foto',
    name: 'Platzhalter „Ihr Foto“',
    zeichne: (ctx, s) => {
      himmel(ctx, s, '#f3ece4', '#e2d5c8');
      ctx.strokeStyle = '#a8978a';
      ctx.fillStyle = '#a8978a';
      ctx.lineWidth = s * 0.018;
      const w = s * 0.34, h = s * 0.24, x = s / 2 - w / 2, y = s * 0.33;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, s * 0.03);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s / 2, y + h / 2, h * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(s / 2 - w * 0.16, y - h * 0.16, w * 0.32, h * 0.18);
      ctx.font = `600 ${s * 0.075}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Ihr Foto', s / 2, s * 0.72);
    },
  },
  {
    id: 'luftballons',
    name: 'Luftballons',
    zeichne: (ctx, s) => {
      himmel(ctx, s, '#bfe3f7', '#eaf6fd');
      const ballons: Array<[number, number, number, string]> = [
        [0.3, 0.36, 0.13, '#e8463f'],
        [0.52, 0.28, 0.15, '#f4d03f'],
        [0.72, 0.38, 0.13, '#3f8fd2'],
        [0.42, 0.5, 0.12, '#58b368'],
        [0.62, 0.52, 0.12, '#b565c9'],
      ];
      ctx.lineWidth = s * 0.006;
      ctx.strokeStyle = '#6b7280';
      for (const [x, y, r] of ballons) {
        ctx.beginPath();
        ctx.moveTo(x * s, (y + r * 1.15) * s);
        ctx.quadraticCurveTo(x * s + (0.5 - x) * s * 0.3, s * 0.75, s * 0.5, s * 0.92);
        ctx.stroke();
      }
      for (const [x, y, r, farbe] of ballons) {
        ctx.fillStyle = farbe;
        ctx.beginPath();
        ctx.ellipse(x * s, y * s, r * s * 0.88, r * s * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse((x - r * 0.3) * s, (y - r * 0.4) * s, r * s * 0.18, r * s * 0.3, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: 'sternenhimmel',
    name: 'Sternenhimmel',
    zeichne: (ctx, s) => {
      himmel(ctx, s, '#141a3c', '#5a3f7d');
      ctx.fillStyle = '#fff6c9';
      let seed = 7;
      const zufall = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      for (let i = 0; i < 70; i++) {
        ctx.globalAlpha = 0.5 + zufall() * 0.5;
        ctx.beginPath();
        ctx.arc(zufall() * s, zufall() * s * 0.8, s * (0.002 + zufall() * 0.005), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      stern(ctx, s * 0.24, s * 0.3, s * 0.05);
      stern(ctx, s * 0.76, s * 0.5, s * 0.035);
      ctx.beginPath();
      ctx.arc(s * 0.68, s * 0.26, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#232a55';
      ctx.beginPath();
      ctx.arc(s * 0.73, s * 0.23, s * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d1126';
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.quadraticCurveTo(s * 0.3, s * 0.72, s * 0.55, s * 0.84);
      ctx.quadraticCurveTo(s * 0.8, s * 0.95, s, s * 0.8);
      ctx.lineTo(s, s);
      ctx.fill();
    },
  },
  {
    id: 'blumenwiese',
    name: 'Blumenwiese',
    zeichne: (ctx, s) => {
      himmel(ctx, s, '#cfeaf8', '#f4fbff');
      ctx.fillStyle = '#7cc46b';
      ctx.beginPath();
      ctx.moveTo(0, s * 0.62);
      ctx.quadraticCurveTo(s * 0.5, s * 0.5, s, s * 0.64);
      ctx.lineTo(s, s);
      ctx.lineTo(0, s);
      ctx.fill();
      const blumen: Array<[number, number, number, string]> = [
        [0.2, 0.7, 0.07, '#f2a8c0'],
        [0.42, 0.78, 0.085, '#e85b9a'],
        [0.64, 0.7, 0.07, '#f2d247'],
        [0.82, 0.8, 0.08, '#cbb6e4'],
        [0.3, 0.88, 0.06, '#ffffff'],
        [0.56, 0.9, 0.06, '#f6c3a2'],
      ];
      for (const [x, y, r, farbe] of blumen) {
        ctx.fillStyle = farbe;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc((x + Math.cos(a) * r * 0.62) * s, (y + Math.sin(a) * r * 0.62) * s, r * s * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#c9a23a';
        ctx.beginPath();
        ctx.arc(x * s, y * s, r * s * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe58a';
      ctx.beginPath();
      ctx.arc(s * 0.8, s * 0.2, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  /* ---------- Eigene Trend-Motive (frei gestaltet, keine Lizenzfiguren) ---------- */
  {
    id: 'comic',
    name: 'Comic „POW!“',
    zeichne: (ctx, s) => {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(0, 0, s, s);
      // Halbton-Punkte
      ctx.fillStyle = '#f4a52a';
      for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) {
        const r = (s / 22) * 0.18 * (0.4 + (x + y) / 44);
        ctx.beginPath();
        ctx.arc(((x + (y % 2) * 0.5) * s) / 22, (y * s) / 22, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Strahlen
      ctx.fillStyle = '#e8463f';
      for (let i = 0; i < 16; i += 2) {
        const a1 = (i / 16) * Math.PI * 2, a2 = ((i + 1) / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(s / 2, s / 2);
        ctx.lineTo(s / 2 + Math.cos(a1) * s, s / 2 + Math.sin(a1) * s);
        ctx.lineTo(s / 2 + Math.cos(a2) * s, s / 2 + Math.sin(a2) * s);
        ctx.fill();
      }
      // Explosionsblase
      ctx.beginPath();
      for (let i = 0; i < 28; i++) {
        const r = s * (i % 2 === 0 ? 0.36 : 0.26) * (0.92 + ((i * 37) % 11) / 60);
        const a = (i / 28) * Math.PI * 2;
        ctx.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = s * 0.018;
      ctx.strokeStyle = '#1c1c1c';
      ctx.stroke();
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.rotate(-0.15);
      ctx.font = `900 ${s * 0.2}px Impact, 'Arial Black', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = s * 0.03;
      ctx.strokeStyle = '#1c1c1c';
      ctx.strokeText('POW!', 0, 0);
      ctx.fillStyle = '#2f6fd0';
      ctx.fillText('POW!', 0, 0);
      ctx.restore();
    },
  },
  {
    id: 'superheld',
    name: 'Superheld-Wappen',
    zeichne: (ctx, s) => {
      // Nachthimmel über der Stadt
      himmel(ctx, s, '#1d2b64', '#3c6fd1');
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        ctx.globalAlpha = 0.4 + ((i * 13) % 6) / 10;
        ctx.fillRect(((i * 97) % 100) / 100 * s, ((i * 53) % 45) / 100 * s, s * 0.006, s * 0.006);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#121a3d';
      const haeuser = [0.12, 0.3, 0.2, 0.42, 0.26, 0.36, 0.18, 0.46, 0.28, 0.22];
      haeuser.forEach((h, i) => ctx.fillRect((i / haeuser.length) * s, s * (1 - h), s / haeuser.length + 1, s * h));
      ctx.fillStyle = '#ffd86b';
      haeuser.forEach((h, i) => {
        for (let y = 1 - h + 0.04; y < 0.97; y += 0.06) for (let x = 0.015; x < 0.08; x += 0.035)
          if (((i * 7 + Math.round(y * 50) + Math.round(x * 100)) % 3) === 0) ctx.fillRect((i / haeuser.length + x) * s, y * s, s * 0.014, s * 0.022);
      });
      // Wappen: Schild mit Blitz
      const w = s * 0.46, top = s * 0.18, cx = s / 2;
      const schild = () => {
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, top);
        ctx.lineTo(cx + w / 2, top);
        ctx.lineTo(cx + w / 2, top + w * 0.55);
        ctx.quadraticCurveTo(cx + w / 2, top + w * 0.95, cx, top + w * 1.15);
        ctx.quadraticCurveTo(cx - w / 2, top + w * 0.95, cx - w / 2, top + w * 0.55);
        ctx.closePath();
      };
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = s * 0.03;
      schild();
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = s * 0.02;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.save();
      ctx.translate(cx - w * 0.5, top);
      const k = w / 100;
      ctx.beginPath();
      ctx.moveTo(60 * k, 8 * k);
      ctx.lineTo(26 * k, 60 * k);
      ctx.lineTo(48 * k, 60 * k);
      ctx.lineTo(38 * k, 108 * k);
      ctx.lineTo(78 * k, 46 * k);
      ctx.lineTo(55 * k, 46 * k);
      ctx.lineTo(68 * k, 8 * k);
      ctx.closePath();
      ctx.fillStyle = '#e8463f';
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'pixel',
    name: 'Pixel-Spiel „Level up“',
    zeichne: (ctx, s) => {
      const n = 16, p = s / n;
      himmel(ctx, s, '#5ec8f2', '#bfeaff');
      // Wolken
      ctx.fillStyle = '#ffffff';
      for (const [x, y, b] of [[2, 2, 3], [10, 3, 4]]) {
        ctx.fillRect(x * p, y * p, b * p, p);
        ctx.fillRect((x + 1) * p, (y - 1) * p, (b - 2) * p, p);
      }
      // Hügel und Boden
      const boden = [11, 11, 10, 10, 9, 9, 10, 11, 11, 11, 10, 9, 9, 10, 11, 11];
      boden.forEach((h, x) => {
        ctx.fillStyle = '#58b368';
        ctx.fillRect(x * p, h * p, p, p);
        for (let y = h + 1; y < n; y++) {
          ctx.fillStyle = (x + y) % 3 === 0 ? '#8a5a3a' : '#a8714a';
          ctx.fillRect(x * p, y * p, p, p);
        }
      });
      // Münzen
      ctx.fillStyle = '#f4c430';
      for (const x of [4, 6, 8]) ctx.fillRect(x * p + p * 0.25, 6 * p, p * 0.5, p * 0.8);
      // Herzen (Leben)
      ctx.fillStyle = '#e8463f';
      const herz = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
      const q = p * 0.28;
      for (let i = 0; i < 3; i++)
        herz.forEach((zeile, y) => [...zeile].forEach((c, x) => c === 'X' && ctx.fillRect(p * 0.5 + i * 8 * q + x * q, p * 0.5 + y * q, q, q)));
      // Schrift
      ctx.font = `700 ${p * 1.5}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1c1c1c';
      ctx.fillText('LEVEL UP!', s / 2 + p * 0.12, p * 8.6 + p * 0.12);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('LEVEL UP!', s / 2, p * 8.6);
    },
  },
  {
    id: 'weltraum',
    name: 'Weltraum-Abenteuer',
    zeichne: (ctx, s) => {
      himmel(ctx, s, '#0b0f2e', '#3a1f6b');
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) {
        ctx.globalAlpha = 0.3 + ((i * 7) % 7) / 10;
        ctx.beginPath();
        ctx.arc(((i * 61) % 100) / 100 * s, ((i * 37) % 100) / 100 * s, s * (0.002 + ((i * 3) % 4) * 0.0015), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Planet mit Ring
      ctx.fillStyle = '#f2a8c0';
      ctx.beginPath();
      ctx.arc(s * 0.74, s * 0.28, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f4d03f';
      ctx.lineWidth = s * 0.018;
      ctx.beginPath();
      ctx.ellipse(s * 0.74, s * 0.28, s * 0.22, s * 0.05, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7fd1e8';
      ctx.beginPath();
      ctx.arc(s * 0.18, s * 0.78, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      // Rakete
      ctx.save();
      ctx.translate(s * 0.42, s * 0.58);
      ctx.rotate(0.6);
      const r = s * 0.1;
      ctx.fillStyle = '#f6a623';
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, r * 1.6);
      ctx.lineTo(0, r * 2.6);
      ctx.lineTo(r * 0.45, r * 1.6);
      ctx.fill();
      ctx.fillStyle = '#e8463f';
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.8);
      ctx.lineTo(-r * 1.1, r * 1.8);
      ctx.lineTo(r * 1.1, r * 1.8);
      ctx.lineTo(r * 0.6, r * 0.8);
      ctx.fill();
      ctx.fillStyle = '#f7f3ea';
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.8);
      ctx.quadraticCurveTo(r * 0.75, -r * 0.8, r * 0.6, r * 1.6);
      ctx.lineTo(-r * 0.6, r * 1.6);
      ctx.quadraticCurveTo(-r * 0.75, -r * 0.8, 0, -r * 1.8);
      ctx.fill();
      ctx.fillStyle = '#e8463f';
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.8);
      ctx.quadraticCurveTo(r * 0.45, -r * 1.3, r * 0.55, -r * 0.9);
      ctx.lineTo(-r * 0.55, -r * 0.9);
      ctx.quadraticCurveTo(-r * 0.45, -r * 1.3, 0, -r * 1.8);
      ctx.fill();
      ctx.fillStyle = '#3f8fd2';
      ctx.strokeStyle = '#c9d2d5';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  },
];
