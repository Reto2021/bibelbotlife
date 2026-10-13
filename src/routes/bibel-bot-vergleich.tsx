import { createFileRoute } from "@tanstack/react-router";
import BibelBotVergleich from "@/pages/BibelBotVergleich";

export const Route = createFileRoute("/bibel-bot-vergleich")({
  component: BibelBotVergleich,
});
