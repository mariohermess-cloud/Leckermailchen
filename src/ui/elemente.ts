import { archiv } from '../archiv';

/** Kleine Helfer zum Aufbau des Bedienfelds ohne Framework. */

type Kind = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | undefined> = {},
  ...kinder: Kind[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, wert] of Object.entries(attrs)) {
    if (wert === undefined || wert === false) continue;
    if (name === 'class') el.className = String(wert);
    else if (wert === true) el.setAttribute(name, '');
    else el.setAttribute(name, String(wert));
  }
  for (const kind of kinder) {
    if (kind === null || kind === undefined || kind === false) continue;
    el.append(kind);
  }
  return el;
}

export function feld(beschriftung: string, inhalt: Node, hinweis?: string): HTMLElement {
  return h('label', { class: 'feld' }, h('span', { class: 'feld-name' }, beschriftung), inhalt, hinweis ? h('span', { class: 'feld-hinweis' }, hinweis) : null);
}

export interface ReglerOptionen {
  min: number;
  max: number;
  schritt: number;
  einheit?: string;
  format?: (wert: number) => string;
}

export function regler(beschriftung: string, wert: number, o: ReglerOptionen, setze: (wert: number) => void): HTMLElement {
  const zeige = (w: number) => (o.format ? o.format(w) : `${Number.isInteger(o.schritt) ? w : w.toFixed(1).replace('.', ',')}${o.einheit ?? ''}`);
  const anzeige = h('output', { class: 'regler-wert' }, zeige(wert));
  const input = h('input', { type: 'range', min: o.min, max: o.max, step: o.schritt, value: wert });
  input.addEventListener('input', () => {
    const w = Number(input.value);
    anzeige.textContent = zeige(w);
    setze(w);
  });
  return h('label', { class: 'feld regler' }, h('span', { class: 'feld-name' }, beschriftung, anzeige), input);
}

export function prozent(wert: number): string {
  return `${Math.round(wert * 100)} %`;
}

export function auswahl<T extends string>(
  beschriftung: string,
  wert: T,
  optionen: ReadonlyArray<{ id: T; name: string }>,
  setze: (wert: T) => void,
): HTMLElement {
  const select = h('select', {});
  for (const o of optionen) {
    const option = h('option', { value: o.id }, o.name);
    option.selected = o.id === wert;
    select.append(option);
  }
  select.addEventListener('change', () => setze(select.value as T));
  return feld(beschriftung, select);
}

export function schalter(beschriftung: string, wert: boolean, setze: (wert: boolean) => void): HTMLElement {
  const input = h('input', { type: 'checkbox' });
  input.checked = wert;
  input.addEventListener('change', () => setze(input.checked));
  return h('label', { class: 'schalter' }, input, h('span', {}, beschriftung));
}

export function textfeld(beschriftung: string, wert: string, setze: (wert: string) => void, platzhalter = ''): HTMLElement {
  const input = h('input', { type: 'text', value: wert, placeholder: platzhalter, maxlength: 40 });
  input.addEventListener('input', () => setze(input.value));
  return feld(beschriftung, input);
}

/** Farbfelder aus der Archiv-Palette plus freie Farbwahl. */
export function farbwahl(beschriftung: string, wert: string, setze: (hex: string) => void): HTMLElement {
  const raster = h('div', { class: 'farben', role: 'radiogroup', 'aria-label': beschriftung });
  const markiere = (hex: string) => {
    raster.querySelectorAll('button').forEach((b) => b.classList.toggle('aktiv', b.dataset.hex === hex.toLowerCase()));
  };
  for (const f of archiv.farben) {
    const knopf = h('button', {
      type: 'button',
      class: `farbe${f.metallic ? ' metallic' : ''}`,
      title: f.name,
      'aria-label': f.name,
      'data-hex': f.hex.toLowerCase(),
      style: `--farbe:${f.hex}`,
    });
    knopf.addEventListener('click', () => {
      markiere(f.hex);
      frei.value = f.hex;
      setze(f.hex);
    });
    raster.append(knopf);
  }
  const frei = h('input', { type: 'color', value: wert, title: 'Eigene Farbe', 'aria-label': 'Eigene Farbe wählen' });
  frei.addEventListener('input', () => {
    markiere(frei.value);
    setze(frei.value);
  });
  raster.append(frei);
  markiere(wert);
  return h('div', { class: 'feld' }, h('span', { class: 'feld-name' }, beschriftung), raster);
}

/** Auswahl über beschriftete Kacheln (z. B. Formen, Überzüge). */
export function kacheln<T extends string>(
  beschriftung: string,
  wert: T,
  optionen: ReadonlyArray<{ id: T; name: string; bild?: Node; titel?: string }>,
  setze: (wert: T) => void,
  klasse = '',
): HTMLElement {
  const raster = h('div', { class: `kacheln ${klasse}`, role: 'radiogroup', 'aria-label': beschriftung });
  for (const o of optionen) {
    const knopf = h(
      'button',
      { type: 'button', class: `kachel${o.id === wert ? ' aktiv' : ''}`, title: o.titel ?? o.name, 'aria-pressed': o.id === wert },
      o.bild ?? null,
      h('span', {}, o.name),
    );
    knopf.addEventListener('click', () => {
      raster.querySelectorAll('.kachel').forEach((k) => {
        k.classList.remove('aktiv');
        k.setAttribute('aria-pressed', 'false');
      });
      knopf.classList.add('aktiv');
      knopf.setAttribute('aria-pressed', 'true');
      setze(o.id);
    });
    raster.append(knopf);
  }
  return beschriftung ? h('div', { class: 'feld' }, h('span', { class: 'feld-name' }, beschriftung), raster) : raster;
}

export function knopf(text: string, klick: () => void, klasse = ''): HTMLButtonElement {
  const b = h('button', { type: 'button', class: `knopf ${klasse}` }, text);
  b.addEventListener('click', klick);
  return b;
}

const SVG = 'http://www.w3.org/2000/svg';

export function svg(viewBox: string, pfade: Array<{ d: string; fill: string }>): SVGSVGElement {
  const el = document.createElementNS(SVG, 'svg');
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('aria-hidden', 'true');
  for (const p of pfade) {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', p.d);
    path.setAttribute('fill', p.fill);
    el.append(path);
  }
  return el;
}
