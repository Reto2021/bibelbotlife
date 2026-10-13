import { createFileRoute } from "@tanstack/react-router";
import ChurchIntegration from "@/pages/ChurchIntegration";

export const Route = createFileRoute("/church-integration/$slug")({
  component: ChurchIntegration,
});
