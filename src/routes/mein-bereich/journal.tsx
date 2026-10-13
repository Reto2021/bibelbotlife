import { createFileRoute } from "@tanstack/react-router";
import JournalPage from "@/pages/mein-bereich/JournalPage";

export const Route = createFileRoute("/mein-bereich/journal")({
  component: JournalPage,
});
