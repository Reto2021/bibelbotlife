import { createFileRoute } from "@tanstack/react-router";
import GuideDiscordIntegration from "@/pages/GuideDiscordIntegration";

export const Route = createFileRoute("/guide/discord-integration")({
  component: GuideDiscordIntegration,
});
