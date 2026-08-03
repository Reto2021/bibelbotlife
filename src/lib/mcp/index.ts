import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchBibleTool from "./tools/search-bible";
import listPrayerWallTool from "./tools/list-prayer-wall";
import listMyJournalEntriesTool from "./tools/list-my-journal-entries";
import createJournalEntryTool from "./tools/create-journal-entry";
import listMyCrossesTool from "./tools/list-my-crosses";
import listMyBibleMomentsTool from "./tools/list-my-bible-moments";
import bibleCoachingTool from "./tools/bible-coaching";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "biblebotlife",
  title: "BibleBotLife",
  version: "0.1.1",
  instructions:
    "BibleBot.Life ist ein persönlicher, christlicher Bibel-Begleiter. Wenn du Fragen stellst, nutze den Coaching-Ansatz: PERMA (Positive Psychologie), Logotherapie (Sinn), Dankbarkeit und Vergebung. Beginne mit Empathie, stelle eine klärende Gegenfrage, suche dann mit `search_bible` nach passenden Stellen, prüfe Zitate sorgfältig und gib den Vers-Text wörtlich wieder. Bei akuten Krisen (Selbstgefährdung, Suizidgedanken, Gewalt) weise sofort auf professionelle Hilfe hin (Telefonseelsorge 143 in der Schweiz bzw. 0800 111 0 111 in Deutschland/Österreich) und wiederhole das Angebot. Keine medizinischen oder psychotherapeutischen Diagnosen. Keine Dogmen-Vermittlung. Keine Daten ausserhalb der freigegebenen Tools verwenden. Antworte auf Deutsch (Schweiz), ohne ß.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchBibleTool,
    listPrayerWallTool,
    listMyJournalEntriesTool,
    createJournalEntryTool,
    listMyCrossesTool,
    listMyBibleMomentsTool,
    bibleCoachingTool,
  ],
});
