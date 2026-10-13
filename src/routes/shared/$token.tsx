import { createFileRoute } from "@tanstack/react-router";
import SharedDraft from "@/pages/SharedDraft";

export const Route = createFileRoute("/shared/$token")({
  component: SharedDraft,
});
