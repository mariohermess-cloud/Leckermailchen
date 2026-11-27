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

## Kosten & Preise (Admin)

Unter `…/#admin` (z. B. `https://mariohermess-cloud.github.io/Leckermailchen/#admin`) pflegt die Backstube:

- **Zutaten** mit Packungsgröße und Einkaufspreis (Grundpreis € / kg, l oder Stück wird berechnet)
- **Rezepte** aus diesen Zutaten, bezogen auf eine runde Referenztorte (Standard Ø 26 × 8 cm). Der Rechner skaliert nach Volumen (Teig, Füllung), Oberfläche (Überzug, Streusel), Umfang (Bordüre, Drip) oder je Stück (Topper, Motive, Zubehör)
- **Zuordnung**: welches Rezept für welchen Überzug, welche Bordüre, welchen Topper … verwendet wird
- **Kalkulation**: Stundensatz, Arbeitszeit je Element, Aufschlag, MwSt., Rundung, Mindestpreis
- **Testrechnung** der gerade konfigurierten Torte inkl. Einkaufsliste

Teig und Füllung wählt der Kunde je Etage im Konfigurator; unten im Bedienfeld steht der Richtpreis.

Es gibt noch keinen Server: Änderungen werden im Browser gespeichert. Für alle Besucher gelten sie,
sobald die exportierte `kosten.json` nach `public/kosten.json` ins Repository gelegt wird.
Code: `src/kosten/` (Modell, Beispieldaten, Rechner, Speicher), `src/ui/admin.ts`.

## Motivkatalog & Trends

- In der Verwaltung (`#admin`) gibt es den Tab **Motivkatalog**. Dort ladet ihr eigene Druckmotive hoch, mit Thema, Druckkosten und den Schaltern **Trend** und **Sichtbar**.
  Kunden wählen sie im Konfigurator beim Fotoaufleger aus. Trend-Motive stehen ganz vorn, die Druckkosten fließen in den Preis ein.
- Selbst gezeichnete Beispielmotive ohne Lizenzfiguren: Comic „POW!“, Superheld-Wappen, Pixel-Spiel, Weltraum.
  Dazu die Vorlagen **Superheld**, **Comic-Party**, **Gaming** und **Weltraum**.
- Bevor ein Kunde ein eigenes Foto hochladen kann, muss er bestätigen, dass er die Rechte am Bild hat.
- **Wunschanfrage**: Ist unter Kalkulation eine E-Mail-Adresse eingetragen, erscheint im Konfigurator der Abschnitt „Anfrage senden“.
  Er öffnet das E-Mail-Programm mit der fertigen Tortenbeschreibung, dem Wunschtext und dem Termin.
- KI-Prompts für eigene Figuren und Themenbilder: [`docs/ki-prompts.md`](docs/ki-prompts.md).

## Noch offen

- Modellierte 3D-Figuren (Traktor, Dinos, Einhorn …) gibt es bisher nur als flache Motive.
- Lizenzfiguren werden nicht nachgebaut; dafür dient der Fotoaufleger mit eigenem Bild.
- Das Seitendesign ist bewusst schlicht und kommt später.
