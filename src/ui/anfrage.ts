import { archiv, finde } from '../archiv';
import { berechne, euro } from '../kosten/rechner';
import { kosten } from '../kosten/speicher';
import type { KuchenKonfig } from '../modell/typen';

const name = (liste: ReadonlyArray<{ id: string; name: string }>, id: string) => liste.find((e) => e.id === id)?.name ?? id;
const farbe = (hex: string) => archiv.farben.find((f) => f.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex;

/** Lesbare Zusammenfassung der Torte für eine Anfrage-E-Mail. */
export function zusammenfassung(k: KuchenKonfig): string {
  const z: string[] = [];
  const rezepte = kosten.daten.rezepte;
  z.push(`Form: ${finde(archiv.formen, k.form).name}${k.thema ? ` (Vorlage: ${name(archiv.themen, k.thema)})` : ''}`);
  k.etagen.forEach((e, i) => {
    const teile = [
      `Ø ${e.durchmesser} cm, ${e.hoehe} cm hoch`,
      `${name(archiv.ueberzuege, e.ueberzug)} ${farbe(e.farbe)}`,
      `Teig: ${name(rezepte, e.teig)}`,
      `Füllung: ${e.fuellung === 'keine' ? 'ohne' : name(rezepte, e.fuellung)}`,
    ];
    if (e.drip.aktiv) teile.push(`Drip ${farbe(e.drip.farbe)}`);
    if (e.borduereUnten.typ !== 'keine') teile.push(`Bordüre unten: ${name(archiv.bordueren, e.borduereUnten.typ)} ${farbe(e.borduereUnten.farbe)}`);
    if (e.borduereOben.typ !== 'keine') teile.push(`Bordüre oben: ${name(archiv.bordueren, e.borduereOben.typ)} ${farbe(e.borduereOben.farbe)}`);
    z.push(`${k.etagen.length > 1 ? `Etage ${i + 1}` : 'Torte'}: ${teile.join(' · ')}`);
  });
  for (const s of k.schrift) if (s.text.trim()) z.push(`Schrift: „${s.text}“ (${name(archiv.schriften, s.schrift)}, ${farbe(s.farbe)}, ${s.ort})`);
  if (k.aufleger.aktiv) {
    const m = k.aufleger.katalog ? kosten.daten.katalog.find((x) => x.id === k.aufleger.katalog) : null;
    const motiv = m ? `Katalogmotiv „${m.name}“` : k.aufleger.bild ? 'eigenes Foto (bitte an diese E-Mail anhängen)' : `Motiv „${name(archiv.auflegerMotive, k.aufleger.motiv)}“`;
    z.push(`Aufleger: ${motiv}`);
  }
  for (const s of k.symbole) z.push(`Motiv: ${name(archiv.symbole, s.symbol)} ${farbe(s.farbe)}${s.ort === 'seite' && s.anzahl > 1 ? ` × ${s.anzahl}` : ''}`);
  for (const t of k.topper) z.push(`Deko: ${t.anzahl} × ${name(archiv.topper, t.typ)}`);
  if (k.streusel.typ !== 'keine') z.push(`Streusel: ${name(archiv.streusel, k.streusel.typ)}`);
  z.push(`Platte: ${name(archiv.platten, k.platte.typ)}`);
  const kalk = berechne(k, kosten.daten);
  z.push(`Richtpreis: ca. ${euro(kalk.preis)} für ca. ${kalk.portionen} Stück`);
  return z.join('\n');
}

/** Öffnet das E-Mail-Programm mit einer vorausgefüllten Anfrage. */
export function anfrageSenden(k: KuchenKonfig, wunsch: string, datum: string): void {
  const an = kosten.daten.einstellungen.anfrageEmail.trim();
  if (!an) return;
  const text = [
    'Hallo Leckermailchen-Team,',
    '',
    'ich möchte gerne folgende Torte anfragen:',
    '',
    zusammenfassung(k),
    '',
    datum ? `Gewünschter Termin: ${new Date(datum).toLocaleDateString('de-DE')}` : '',
    wunsch.trim() ? `Mein Wunsch / weitere Details:\n${wunsch.trim()}` : '',
    '',
    'Viele Grüße',
  ]
    .filter((x, i, arr) => x !== '' || arr[i - 1] !== '')
    .join('\n');
  location.href = `mailto:${an}?subject=${encodeURIComponent('Tortenanfrage')}&body=${encodeURIComponent(text)}`;
}
