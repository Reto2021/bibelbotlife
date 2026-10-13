import { createFileRoute } from "@tanstack/react-router";
import BibleMoments from "@/pages/mein-bereich/BibleMoments";

export const Route = createFileRoute("/mein-bereich/momente")({
  component: BibleMoments,
});
