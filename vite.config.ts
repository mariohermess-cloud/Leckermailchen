import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`            -> normale Website in dist/
// `npm run build:einzeldatei` -> alles in einer einzigen HTML-Datei (zum Verschicken / als Vorschau)
export default defineConfig(({ mode }) => {
  const einzeldatei = mode === 'einzeldatei';
  return {
    base: './',
    plugins: einzeldatei ? [viteSingleFile()] : [],
    build: {
      outDir: einzeldatei ? 'dist-einzeldatei' : 'dist',
      chunkSizeWarningLimit: 2500,
      assetsInlineLimit: einzeldatei ? 100_000_000 : 4096,
    },
  };
});
