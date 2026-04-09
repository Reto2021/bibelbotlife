
# Theologisches RAG-System für BibelBot

## Architektur-Übersicht
Dokumente → Chunking → Embedding (Gemini) → pgvector-Tabelle → Neues Tool `search_theology` im BibelBot

## Phase 1: Datenbank-Setup
- `pgvector`-Extension aktivieren
- Tabelle `theology_chunks` erstellen:
  - `id`, `source_type` (enum: lexikon, kommentar, konfession, seelsorge), `title`, `content`, `metadata` (JSONB), `embedding` (vector(768)), `created_at`
- HNSW-Index für schnelle Vektorsuche

## Phase 2: Wissensquellen aufbereiten & importieren

### A) Theologisches Wörterbuch (~100-150 Einträge)
- KI-generiert: Kernbegriffe wie Gnade, Rechtfertigung, Bund, Trinität, Eschatologie, Taufe, Abendmahl etc.
- Ökumenisch formuliert, mit konfessionellen Unterschieden wo relevant
- Import via Edge Function

### B) Bibelkommentare (klassisch, gemeinfrei)
- Matthew Henry's Commentary (englisch, gemeinfrei) – online verfügbar als JSON/Text
- Optional: Luther-Vorreden, Calvin-Institutio-Auszüge
- Chunking nach Buch/Kapitel, je ca. 500-800 Tokens

### C) Kirchengeschichte & Konfessionen (~30-50 Einträge)
- KI-generiert: Übersicht reformiert, lutherisch, katholisch, orthodox, freikirchlich
- Wichtige Konzile, Bekenntnisschriften, Unterschiede bei Sakramenten, Amtsverständnis etc.

### D) Seelsorge-Leitfaden (~30-40 Einträge)
- KI-generiert: Gesprächsführung bei Trauer, Krise, Zweifel, Sucht, Beziehung, Sinnsuche
- Krisenintervention, Grenzen erkennen, Verweisung an Fachstellen
- Schweizer Kontext (Dargebotene Hand 143, Pro Juventute 147)

## Phase 3: Embedding-Pipeline (Edge Function)
- `theology-embed` Edge Function:
  - Nimmt Chunks entgegen, erstellt Embeddings via Gemini (`text-embedding-004`)
  - Speichert in `theology_chunks` mit Vektoren
- Batch-Import-Skript für alle Quellen

## Phase 4: Such-Tool im BibelBot
- Neues Tool `search_theology` mit semantischer Vektorsuche
- Query → Embedding → Cosine-Similarity-Suche → Top-5 Chunks zurückgeben
- Bot entscheidet selbst, wann theologisches Hintergrundwissen hilfreich ist

## Phase 5: Content-Generierung
- Edge Function die per KI die Lexikon/Konfessions/Seelsorge-Einträge generiert
- Qualitätskontrolle: Stichproben prüfen
- Iterativ erweiterbar (neue Einträge jederzeit hinzufügbar)

## Geschätzter Umfang
- ~300-500 Chunks initial (wächst mit Kommentaren)
- Embedding-Kosten minimal (Gemini text-embedding ist günstig)
- 3-4 Implementierungsschritte
