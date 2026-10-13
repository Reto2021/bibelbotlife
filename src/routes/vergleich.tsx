import { createFileRoute } from "@tanstack/react-router";
import BibelBotVergleich from "@/pages/BibelBotVergleich";

export const Route = createFileRoute("/vergleich")({
  component: BibelBotVergleich,
});
