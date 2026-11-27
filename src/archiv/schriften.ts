import type { SchriftEintrag } from '../modell/typen';

// Schriften liegen lokal im Projekt (kein Abruf bei Google – DSGVO-freundlich).
// Alle Schriften stehen unter der SIL Open Font License.
import greatVibes from '@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff?url';
import parisienne from '@fontsource/parisienne/files/parisienne-latin-400-normal.woff?url';
import dancingScript from '@fontsource/dancing-script/files/dancing-script-latin-700-normal.woff?url';
import sacramento from '@fontsource/sacramento/files/sacramento-latin-400-normal.woff?url';
import pacifico from '@fontsource/pacifico/files/pacifico-latin-400-normal.woff?url';
import lobster from '@fontsource/lobster/files/lobster-latin-400-normal.woff?url';
import caveat from '@fontsource/caveat/files/caveat-latin-700-normal.woff?url';
import amaticSc from '@fontsource/amatic-sc/files/amatic-sc-latin-700-normal.woff?url';
import fredoka from '@fontsource/fredoka/files/fredoka-latin-600-normal.woff?url';
import playfair from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff?url';
import cinzel from '@fontsource/cinzel/files/cinzel-latin-700-normal.woff?url';

/**
 * Schriftarten für Aufschriften.
 * STARTER-SET – wird an die Schriftbilder der Referenzfotos angepasst.
 */
export const schriften: SchriftEintrag[] = [
  { id: 'greatVibes', name: 'Great Vibes', familie: 'Great Vibes', stil: 'schreibschrift', datei: greatVibes, starter: true },
  { id: 'parisienne', name: 'Parisienne', familie: 'Parisienne', stil: 'schreibschrift', datei: parisienne, starter: true },
  { id: 'dancingScript', name: 'Dancing Script', familie: 'Dancing Script', stil: 'schreibschrift', datei: dancingScript, starter: true },
  { id: 'sacramento', name: 'Sacramento', familie: 'Sacramento', stil: 'schreibschrift', datei: sacramento, starter: true },
  { id: 'pacifico', name: 'Pacifico', familie: 'Pacifico', stil: 'schreibschrift', datei: pacifico, starter: true },
  { id: 'lobster', name: 'Lobster', familie: 'Lobster', stil: 'schreibschrift', datei: lobster, starter: true },
  { id: 'caveat', name: 'Caveat', familie: 'Caveat', stil: 'verspielt', datei: caveat, starter: true },
  { id: 'amaticSc', name: 'Amatic SC', familie: 'Amatic SC', stil: 'verspielt', datei: amaticSc, starter: true },
  { id: 'fredoka', name: 'Fredoka', familie: 'Fredoka', stil: 'verspielt', datei: fredoka, starter: true },
  { id: 'playfair', name: 'Playfair Display', familie: 'Playfair Display', stil: 'druckschrift', datei: playfair, starter: true },
  { id: 'cinzel', name: 'Cinzel', familie: 'Cinzel', stil: 'druckschrift', datei: cinzel, starter: true },
];
