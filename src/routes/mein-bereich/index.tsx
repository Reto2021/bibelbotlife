import { createFileRoute } from "@tanstack/react-router";
import MeinBereichHome from "@/pages/mein-bereich/MeinBereichHome";

export const Route = createFileRoute("/mein-bereich/")({
  component: MeinBereichHome,
});
