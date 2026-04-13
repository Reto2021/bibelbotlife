

## Plan: Mehrsprachige Bibelübersetzungen — Moderne Versionen bevorzugen

### Übersicht

Jede der 38 App-Sprachen bekommt mindestens eine eigene Bibelübersetzung. Wo möglich werden **moderne, frei lizenzierte Versionen** bevorzugt (Public Domain oder Creative Commons). Ältere Übersetzungen dienen als Fallback.

### Recherche-Ergebnis: Beste verfügbare Übersetzungen pro Sprache

Alle Übersetzungen auf der bereits genutzten API (bible.helloao.org) oder ebible.org verfügbar — keine neuen APIs nötig.

**Strategie: Modern first, Classic fallback**

| Sprache | Code | Primär (modern, frei) | Fallback (älter) | Quelle |
|---------|------|----------------------|-------------------|--------|
| **Deutsch** | de | Schlachter, Luther 1912, Elberfelder | — | ✅ Bereits aktiv |
| **Englisch** | en | **BSB** (Berean Standard, 2022, PD), **WEB** (modern, PD) | KJV (1611) | helloao |
| **Französisch** | fr | **SBL** (Sainte Bible Libre, PD, modern) | Louis Segond 1910 | ebible/helloao |
| **Spanisch** | es | **VBL** (Versión Biblia Libre, 2018, CC) | Reina-Valera 1909 | ebible/helloao |
| **Italienisch** | it | — | Diodati / Riveduta 1927 | helloao |
| **Portugiesisch** | pt | **APEE** (Almeida 2015, wenn frei) | Almeida RC 1911 | helloao |
| **Niederländisch** | nl | — | Statenvertaling | helloao |
| **Polnisch** | pl | **UBG** (Uwspółcześniona BG, 2017, frei) | Biblia Gdańska 1632 | helloao |
| **Tschechisch** | cs | — | Kralická Bible | helloao |
| **Rumänisch** | ro | — | Cornilescu 1924 | helloao |
| **Russisch** | ru | — | Synodal 1876 | helloao |
| **Ukrainisch** | uk | — | Ogienko 1962 | helloao |
| **Arabisch** | ar | — | Van Dyck 1865 | helloao |
| **Hebräisch** | he | — | Hebrew Modern / Tanakh | helloao |
| **Koreanisch** | ko | — | Korean RV 1961 | helloao |
| **Chinesisch** | zh | — | Chinese Union Version 1919 | helloao |
| **Alle anderen** | * | FBV (Free Bible Version) als Fallback wenn sprachspezifische Version fehlt | WEB (World English Bible) als Universal-Fallback | ebible |

**Wichtige Funde:**
- **BSB** (Berean Standard Bible, 2022): Seit April 2023 vollständig Public Domain. Moderne, genaue englische Übersetzung — wird primäre EN-Quelle.
- **Free Bible Version (FBV)**: Modernes Englisch, CC BY-SA, auf ebible.org — guter universeller Fallback.
- **Versión Biblia Libre (VBL)**: Moderne spanische Übersetzung (2018), CC-lizenziert.
- **Sainte Bible Libre (SBL)**: Moderne französische Übersetzung, Public Domain.
- Für viele Sprachen (IT, NL, RO, RU, AR, HE, KO, ZH) gibt es leider **keine modernen frei lizenzierten** Vollbibeln — dort bleiben die klassischen Versionen die beste Option.

### Implementierung (3 Phasen)

**Phase 1: Chat-Zitate sprachabhängig machen**

| Datei | Änderung |
|-------|----------|
| `supabase/functions/bibelbot-chat/index.ts` | Neue `LANGUAGE_BIBLES` Map mit Sprache → Translation-IDs (primär + fallback). System-Prompt passt sich der Nutzersprache an. `lookupBibleVerse()` erhält `language` Parameter. |

Beispiel-Mapping:
```text
en → BSB (primär), WEB (fallback), KJV (klassisch)
fr → SBL (primär), fraLSG (fallback)
es → VBL (primär), spa_rv09 (fallback)
it → ita_riv (einzige Option)
...
```

**Phase 2: Datenbank + Import erweitern**

| Datei | Änderung |
|-------|----------|
| DB-Migration | `ALTER TABLE bible_verses ADD COLUMN language TEXT DEFAULT 'de'`; Index auf `(language, translation)` |
| `supabase/functions/bible-import/index.ts` | TRANSLATIONS-Array mit allen 38 Sprachen erweitern. API-IDs gegen live API validieren. Import pro Sprache mit Fortschritts-Logging. |
| `supabase/functions/bible-search/index.ts` | Sprach-Parameter durchreichen. FTS-Config pro Sprache (`english`, `french`, `spanish`, `simple` als Fallback). System-Prompt der Suchexpansion sprachabhängig machen. |

**Phase 3: UI-Integration**

| Datei | Änderung |
|-------|----------|
| `src/pages/BibleSearch.tsx` | Übersetzungs-Dropdown zeigt nur Bibeln der aktuellen UI-Sprache |
| `src/pages/BibleQuiz.tsx` | `language` Parameter an Edge Function senden |
| `src/components/DailyImpulse.tsx` | Sprachabhängige Vers-Auswahl |
| `supabase/functions/bible-quiz/index.ts` | Quiz-Fragen in Nutzersprache generieren |
| `supabase/functions/daily-impulse/index.ts` | Tagesimpuls-Verse in passender Sprache |

### Validierungsschritt

Vor dem Massenimport wird ein Validierungsscript die API-IDs aller geplanten Übersetzungen gegen `available_translations.json` prüfen und fehlerhafte IDs melden.

### Aufwand & Risiken

- **DB-Grösse**: ca. 2-3 Mio Zeilen (machbar innerhalb Supabase-Limits)
- **Import**: Einmalig 4-8h im Hintergrund, batchweise
- **FTS-Qualität**: Nicht alle Sprachen haben Postgres-FTS-Konfigurationen → `simple` als Fallback
- **Sprachen ohne moderne Bibel**: Für ca. 25 von 38 Sprachen bleibt die klassische Version die einzige Option — das ist völlig in Ordnung, da diese Texte bewährt und anerkannt sind

