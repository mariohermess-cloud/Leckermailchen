/**
 * Das Archiv: alles, woraus sich ein Kuchen zusammenstellen lässt.
 * Jede Liste ist reine Datenpflege – neue Einträge erscheinen automatisch im Konfigurator.
 */
import type { ArchivEintrag } from '../modell/typen';
import { farben } from './farben';
import { formen } from './formen';
import { bordueren, platten, schilder, streusel, streuselPaletten, topper, ueberzuege } from './dekor';
import { auflegerMotive } from './aufleger';
import { symbole } from './symbole';
import { schriften } from './schriften';
import { themen } from './themen';

export const archiv = {
  farben,
  formen,
  ueberzuege,
  bordueren,
  streusel,
  streuselPaletten,
  topper,
  platten,
  schilder,
  auflegerMotive,
  symbole,
  schriften,
  themen,
} as const;

export function finde<T extends ArchivEintrag>(liste: readonly T[], id: string): T {
  return liste.find((e) => e.id === id) ?? liste[0];
}

export { farben, formen, ueberzuege, bordueren, streusel, streuselPaletten, topper, platten, schilder, auflegerMotive, symbole, schriften, themen };
export { istMetallic, farbName, farbeNachId } from './farben';
