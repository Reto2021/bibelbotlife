import { createFileRoute } from "@tanstack/react-router";
import MeinVers from "@/pages/MeinVers";

export const Route = createFileRoute("/mein-vers")({
  component: MeinVers,
});
