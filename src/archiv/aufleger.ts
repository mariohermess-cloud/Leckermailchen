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
];
