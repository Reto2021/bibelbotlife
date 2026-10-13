import { createFileRoute } from "@tanstack/react-router";
import EulogyWriter from "@/pages/mein-bereich/EulogyWriter";

export const Route = createFileRoute("/mein-bereich/abdankung")({
  component: EulogyWriter,
});
