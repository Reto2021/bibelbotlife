## Ziel

Beim Upload eines Wegkreuz-Fotos kann ein Kommentar oder Bibelzitat in Anführungszeichen erfasst werden. Das Zitat wird gespeichert (Anzeige im Feed, Karussell, Detail-Modal) und zusätzlich optional direkt ins Bild gerendert, damit es beim Teilen sichtbar bleibt.

## Was der Nutzer sieht

1. Im Upload-Modal ein neues Feld „Bibelzitat oder Gedanke“
   - Freitext eintippen, Anführungszeichen werden automatisch gesetzt („…“, ohne ß-Regeln zu verletzen)
   - Optional Quellenangabe (z. B. Psalm 23,1)
2. Daneben Button „Vers aus der Bibel wählen“
   - kleine Suche über die bestehende Bibelsuche (5 Übersetzungen)
   - Klick auf ein Ergebnis füllt Zitat + Referenz automatisch
3. Schalter „Zitat aufs Foto schreiben“ (Standard: an)
   - Live-Vorschau: Zitat unten im Bild, weiss auf sanftem Verlauf, Referenz kleiner darunter
   - Text wird automatisch umgebrochen und bei langen Zitaten verkleinert
4. Im Feed / Detail-Modal / Karussell erscheint das Zitat als eigenes Element (kursiv, in Anführungszeichen, mit Referenz), auch wenn die Einbrennung deaktiviert war.

## Technisch

**Datenbank** (Migration, Tabelle `cross_posts`)
- `quote text`, `quote_reference text`, `quote_burned boolean not null default false`
- Längenprüfung im bestehenden `validate_cross_post`-Trigger (Zitat max. 280 Zeichen, Referenz max. 60)
- `get_approved_cross_posts()` um die neuen Felder erweitern (Rückgabetyp neu erstellen)

**Bild-Rendering** (Client, kein Server nötig)
- Neues Modul `src/lib/burn-quote.ts`: Bild in ein `<canvas>` zeichnen, Verlauf + Zitat + Referenz rendern, als JPEG (Qualität 0.9) zurückgeben
- Beim Absenden wird bei aktivem Schalter die gerenderte Datei in den Storage geladen, sonst das Original
- Vorschau nutzt dasselbe Modul, damit „was du siehst, wird geladen“ gilt

**Upload-Modal** (`CrossUploadDialog.tsx`)
- Zustand für Zitat, Referenz, Burn-Schalter, Vorschau-URL
- Versauswahl über die vorhandene Bibelsuche-RPC (`search_bible_verses`), eingebettet in ein Popover mit Debounce
- Zitat und Referenz werden immer in der Datenbank gespeichert

**Anzeige**
- `CrossCard.tsx`, `CrossDetailModal.tsx`: Zitat-Block über bzw. unter dem Bild
- `use-cross-posts.ts`: Typ `CrossPost` um die drei Felder erweitern
- Share-Text im Detail-Modal nutzt das Zitat, wenn vorhanden

**i18n**
- Neue Keys unter `crossways.upload.*` und `crossways.card.*` (Feldlabel, Platzhalter, Versauswahl, Schalter, Hinweis) in `de.json` und per Skript in alle 38 Sprachen ausgerollt

## Abschluss
Build und ein Playwright-Klicktest (Foto ablegen, Zitat eintippen, Vorschau prüfen).
