# Leckermailchen – Kuchen-Konfigurator

Web-App, mit der Kunden ihre Wunschtorte in einer 3D-Vorschau zusammenstellen:
Form, Etagen, Überzug, Farben, Bordüren, Drip, Schrift/Namensschilder/Zahlen, Fotoaufleger,
Motive, Deko und Streusel. Die Vorlagen und Bausteine sind aus den Referenzfotos abgeleitet.

## Starten

```bash
npm install
```

```bash
npm run dev
```

`npm run build` erzeugt die fertige Website in `dist/`. Bei jedem Push auf `main` veröffentlicht
`.github/workflows/website.yml` sie auf GitHub Pages
(einmalig: Settings → Pages → Source „GitHub Actions“).

## Aufbau

| Ordner | Inhalt |
| --- | --- |
| `src/archiv/` | **Das Archiv**: Farben, Formen, Überzüge, Bordüren, Schilder, Motive, Schriften, Deko, Vorlagen. Reine Datenpflege – neue Einträge erscheinen automatisch im Konfigurator. |
| `src/modell/` | Datenmodell einer Torten-Konfiguration und ihre Grenzen |
| `src/render/` | 3D-Darstellung (Three.js), komplett prozedural, ohne Bilddateien |
| `src/ui/` | Bedienfeld |
| `analyse/kuchen.json` | Detailanalyse aller 497 Motive aus den Referenzfotos (ID, Bilddatei, Form, Überzug, Farben, Bordüren, Schilder, Zahlen, Themen …) |

Vorlagen in `src/archiv/themen.ts` verweisen über `quelle` auf die Motiv-IDs der Analyse.

## Noch offen

- Modellierte 3D-Figuren (Traktor, Dinos, Einhorn …) gibt es bisher nur als flache Motive.
- Lizenzfiguren werden nicht nachgebaut; dafür dient der Fotoaufleger mit eigenem Bild.
- Das Seitendesign ist bewusst schlicht und kommt später.
