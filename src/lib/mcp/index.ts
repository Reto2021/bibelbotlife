import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchBibleTool from "./tools/search-bible";
import listPrayerWallTool from "./tools/list-prayer-wall";
import listMyJournalEntriesTool from "./tools/list-my-journal-entries";
import createJournalEntryTool from "./tools/create-journal-entry";
import listMyCrossesTool from "./tools/list-my-crosses";
import listMyBibleMomentsTool from "./tools/list-my-bible-moments";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "biblebotlife",
  title: "BibleBotLife",
  version: "0.1.0",
  instructions:
    "Werkzeuge für BibleBot.Life, den persönlichen Bibel-Begleiter. `search_bible` durchsucht die Bibelübersetzungen, `list_prayer_wall` liest die öffentliche Gebetswand, `list_my_journal_entries` und `create_journal_entry` arbeiten mit dem persönlichen Journal, `list_my_crosses` zeigt eigene Kreuzwege-Uploads und `list_my_bible_moments` die konfigurierten Bibel-Momente. Antworten auf Deutsch (Schweiz), ohne ß.",
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
  ],
});
