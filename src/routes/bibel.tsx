import { createFileRoute } from "@tanstack/react-router";
import BibleSearch from "@/pages/BibleSearch";

export const Route = createFileRoute("/bibel")({
  component: BibleSearch,
});
