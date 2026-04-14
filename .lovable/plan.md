

## Bibliothek nach Sprache filtern & deutsche Inhalte erweitern

### Ist-Zustand
- 134 System-Ressourcen: 91 Deutsch, 43 Englisch
- Davon Gebete: 16 DE, 13 EN — EN-Gebete erscheinen auch bei deutschen Nutzern
- Die `language`-Spalte existiert bereits in der DB, wird aber im UI nicht gefiltert
- Kein Sprachfilter, kein Default auf die aktuelle Sprache

### Änderungen

**1. Sprachfilter im UI (`ResourceLibrary.tsx`)**
- Neuen `filterLanguage`-State hinzufügen, Default = aktuelle i18n-Sprache (`i18n.language.slice(0,2)`)
- Neues Select-Dropdown im Filterbereich mit Optionen: Alle Sprachen, Deutsch, English, Français, etc.
- Filter in der `filtered`-Logik einbauen: `r.language === filterLanguage`
- Sprach-Badge auf jeder ResourceCard anzeigen (Flagge + Kürzel)

**2. Sprache bei neuen Ressourcen setzen (`ResourceLibrary.tsx`)**
- Im Create-Dialog: Sprache-Feld hinzufügen, Default = aktuelle i18n-Sprache
- Beim Speichern: `language` mitgeben

**3. Deutsche System-Ressourcen ergänzen (DB-Migration)**
- Gebete: ~10 klassische deutschsprachige Gebete (Vaterunser, Psalm 23 als Gebet, Segensgebete, Tauf-/Hochzeitsgebete, Tischgebete, Abendgebete)
- Lesungen: ~5 weitere klassische Lesungen (1. Korinther 13, Römer 8, Prediger 3, Psalm 139)
- Liturgie: ~5 weitere liturgische Texte (Apostolisches Glaubensbekenntnis, Gloria, Kyrie, Sanctus)
- Alle mit `language = 'de'`, `is_system = true`, passenden Tags und Traditionen

**4. Sprachpräferenz aus Profil/i18n**
- Die bestehende i18n-Spracherkennung (Browser-Sprache via `i18next-browser-languagedetector`) wird als Default genutzt
- Kein neues Profil-Feld nötig — die i18n-Sprache reicht als Quelle

### Ergebnis
- Deutsche Nutzer sehen standardmässig nur deutsche Ressourcen
- Englische Nutzer sehen englische Ressourcen
- Über den Filter kann man alle Sprachen sehen oder wechseln
- Deutlich mehr deutsche Gebete, Lesungen und liturgische Texte im Katalog

