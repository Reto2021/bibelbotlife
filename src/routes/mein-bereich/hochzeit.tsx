import { createFileRoute } from "@tanstack/react-router";
import WeddingWriter from "@/pages/mein-bereich/WeddingWriter";

export const Route = createFileRoute("/mein-bereich/hochzeit")({
  component: WeddingWriter,
});
