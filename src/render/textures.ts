import * as THREE from 'three';
import { mulberry32 } from './random';

/**
 * Procedural textures. Everything is generated in the browser, so the project needs no
 * image assets and every surface can be recoloured freely.
 */

const cache = new Map<string, THREE.Texture>();

function cached<T extends THREE.Texture>(key: string, make: () => T): T {
  let t = cache.get(key) as T | undefined;
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Tileable value noise: `cellsX` × `cellsY` lattice, result in 0…1. */
function valueNoise(w: number, h: number, cellsX: number, cellsY: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const lattice = new Float32Array(cellsX * cellsY);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rng();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const gy = (y / h) * cellsY;
    const y0 = Math.floor(gy) % cellsY;
    const y1 = (y0 + 1) % cellsY;
    const fy = smooth(gy - Math.floor(gy));
    for (let x = 0; x < w; x++) {
      const gx = (x / w) * cellsX;
      const x0 = Math.floor(gx) % cellsX;
      const x1 = (x0 + 1) % cellsX;
      const fx = smooth(gx - Math.floor(gx));
      const a = lattice[y0 * cellsX + x0];
      const b = lattice[y0 * cellsX + x1];
      const c = lattice[y1 * cellsX + x0];
      const d = lattice[y1 * cellsX + x1];
      out[y * w + x] = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }
  }
  return out;
}

function fbm(w: number, h: number, octaves: Array<[number, number, number]>, seed: number): Float32Array {
  const out = new Float32Array(w * h);
  let total = 0;
  octaves.forEach(([cx, cy, weight], i) => {
    const layer = valueNoise(w, h, cx, cy, seed + i * 101);
    for (let k = 0; k < out.length; k++) out[k] += layer[k] * weight;
    total += weight;
  });
  for (let k = 0; k < out.length; k++) out[k] /= total;
  return out;
}

/** Converts a tileable height field into a tangent-space normal map. */
function normalMapFromHeight(height: Float32Array, w: number, h: number, strength: number): THREE.DataTexture {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const ym = ((y + h - 1) % h) * w;
    const yp = ((y + 1) % h) * w;
    for (let x = 0; x < w; x++) {
      const xm = (x + w - 1) % w;
      const xp = (x + 1) % w;
      const dx = (height[y * w + xp] - height[y * w + xm]) * strength;
      const dy = (height[yp + x] - height[ym + x]) * strength;
      const l = Math.hypot(dx, dy, 1);
      const k = (y * w + x) * 4;
      data[k] = (-dx / l) * 127.5 + 127.5;
      data[k + 1] = (-dy / l) * 127.5 + 127.5;
      data[k + 2] = (1 / l) * 127.5 + 127.5;
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Fine horizontal spatula streaks of smoothed buttercream. */
export function buttercreamNormal(): THREE.Texture {
  return cached('buttercream', () => {
    const s = 512;
    const streaks = fbm(s, s, [[3, 40, 0.5], [5, 90, 0.3], [9, 170, 0.2]], 11);
    const grain = fbm(s, s, [[48, 48, 0.6], [110, 110, 0.4]], 23);
    const h = new Float32Array(s * s);
    for (let i = 0; i < h.length; i++) h[i] = streaks[i] * 0.75 + grain[i] * 0.25;
    return normalMapFromHeight(h, s, s, 5.5);
  });
}

/** Regular grooves left by a decorating comb. */
export function combedNormal(): THREE.Texture {
  return cached('combed', () => {
    const s = 512;
    const wobble = fbm(s, s, [[4, 6, 1]], 5);
    const h = new Float32Array(s * s);
    const grooves = 14;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const v = y / s + (wobble[y * s + x] - 0.5) * 0.004;
        h[y * s + x] = 0.5 + 0.5 * Math.cos(v * grooves * Math.PI * 2);
      }
    }
    return normalMapFromHeight(h, s, s, 16);
  });
}

/** Very soft large-scale waviness so fondant does not look like plastic. */
export function fondantNormal(): THREE.Texture {
  return cached('fondant', () => {
    const s = 256;
    const h = fbm(s, s, [[5, 5, 0.7], [11, 11, 0.3]], 31);
    return normalMapFromHeight(h, s, s, 2.2);
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const c = new THREE.Color(hex);
  // work in display (sRGB) space for painting
  c.convertLinearToSRGB();
  return [c.r * 255, c.g * 255, c.b * 255];
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => smooth(Math.min(1, Math.max(0, (x - a) / (b - a))));

export interface NakedTextures {
  map: THREE.Texture;
  bumpMap: THREE.Texture;
}

/**
 * Wall of a (semi-)naked cake: sponge layers with filling in between, thinly scraped cream on top.
 * u tiles around the cake, v = 0 is the bottom of the wall, v ≥ 1 is pure cream (edge and top).
 */
export function nakedTextures(creamHex: string, darkSponge: boolean): NakedTextures {
  const key = `naked:${creamHex}:${darkSponge}`;
  const map = cached(key, () => {
    const w = 1024;
    const h = 512;
    const cream = hexToRgb(creamHex);
    const sponge: [number, number, number] = darkSponge ? [74, 44, 28] : [226, 178, 104];
    const crust: [number, number, number] = darkSponge ? [48, 27, 17] : [176, 118, 58];
    const smear = fbm(w, h, [[5, 22, 0.45], [9, 46, 0.3], [20, 90, 0.25]], 3);
    const patches = fbm(w, h, [[6, 4, 0.6], [14, 9, 0.4]], 17);
    const pores = fbm(w, h, [[150, 80, 0.6], [280, 150, 0.4]], 41);
    const wave = fbm(w, 1, [[7, 1, 0.6], [17, 1, 0.4]], 59);

    const layers = 3;
    const gap = 0.05;
    const data = new Uint8ClampedArray(w * h * 4);
    const bump = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      const v = 1 - y / (h - 1);
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const vv = v + (wave[x] - 0.5) * 0.02;
        // position inside the stack of sponge layers
        const t = vv * layers;
        const inLayer = t - Math.floor(t);
        const edge = Math.min(inLayer, 1 - inLayer) / (gap * layers * 0.5);
        const isFilling = edge < 1 && vv > gap && vv < 1 - gap * 0.5;
        const crustAmount = 1 - smoothstep(1, 2.6, edge);
        const pore = smoothstep(0.62, 0.8, pores[i]);

        let r = mix(sponge[0], crust[0], crustAmount * 0.8);
        let g = mix(sponge[1], crust[1], crustAmount * 0.8);
        let b = mix(sponge[2], crust[2], crustAmount * 0.8);
        r *= 1 - pore * 0.22;
        g *= 1 - pore * 0.25;
        b *= 1 - pore * 0.3;

        // cream coverage: always at the layer seams, the top edge and the very bottom; streaky in between
        let cover = smoothstep(0.38, 0.62, smear[i] * 0.6 + patches[i] * 0.55);
        if (isFilling) cover = Math.max(cover, 0.94);
        cover = Math.max(cover, smoothstep(0.9, 0.97, vv));
        cover = Math.max(cover, 1 - smoothstep(0.0, 0.035, vv));
        const veil = 0.3; // thin film that is left everywhere after scraping
        const a = veil + (1 - veil) * cover;

        const k = i * 4;
        data[k] = mix(r, cream[0], a);
        data[k + 1] = mix(g, cream[1], a);
        data[k + 2] = mix(b, cream[2], a);
        data[k + 3] = 255;
        const bh = cover * 200 + (1 - cover) * (60 - pore * 60);
        bump[k] = bump[k + 1] = bump[k + 2] = bh;
        bump[k + 3] = 255;
      }
    }
    const tex = canvasTexture(w, h, data, true);
    tex.userData.bump = canvasTexture(w, h, bump, false);
    return tex;
  });
  return { map, bumpMap: map.userData.bump as THREE.Texture };
}

function canvasTexture(w: number, h: number, data: Uint8ClampedArray, color: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(new ImageData(data as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Strawberry skin: red with a staggered grid of pale seeds. Used as colour and bump map. */
export function strawberryTextures(): { map: THREE.Texture; bumpMap: THREE.Texture } {
  const map = cached('strawberry', () => {
    const w = 256;
    const h = 256;
    const make = (seedColor: string, base: string | CanvasGradient, bump: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const cols = 12;
      const rowsCount = 9;
      for (let j = 0; j < rowsCount; j++) {
        for (let i = 0; i < cols; i++) {
          const x = ((i + (j % 2) * 0.5) / cols) * w;
          const y = ((j + 0.5) / rowsCount) * h;
          if (bump) {
            const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
            g.addColorStop(0, 'rgba(0,0,0,0.9)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = seedColor;
          ctx.beginPath();
          ctx.ellipse(x, y, 2.2, 3.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };
    const colorCanvas = document.createElement('canvas').getContext('2d')!;
    const grad = colorCanvas.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#b3121d');
    grad.addColorStop(0.75, '#c81f26');
    grad.addColorStop(1, '#d9584a');
    const color = make('#e9c46a', grad, false);
    color.colorSpace = THREE.SRGBColorSpace;
    color.userData.bump = make('#b0b0b0', '#808080', true);
    return color;
  });
  return { map, bumpMap: map.userData.bump as THREE.Texture };
}

/** Wood grain for the serving board. */
export function woodTexture(): THREE.Texture {
  return cached('wood', () => {
    const w = 512;
    const h = 512;
    const grain = fbm(w, h, [[2, 30, 0.5], [4, 70, 0.3], [9, 160, 0.2]], 77);
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const g = grain[i];
      const ring = 0.5 + 0.5 * Math.sin(g * 40);
      const t = g * 0.6 + ring * 0.4;
      data[i * 4] = mix(150, 205, t);
      data[i * 4 + 1] = mix(104, 160, t);
      data[i * 4 + 2] = mix(62, 108, t);
      data[i * 4 + 3] = 255;
    }
    const tex = canvasTexture(w, h, data, true);
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  });
}

export function disposeTextureCache(): void {
  cache.forEach((t) => {
    (t.userData.bump as THREE.Texture | undefined)?.dispose();
    t.dispose();
  });
  cache.clear();
}
