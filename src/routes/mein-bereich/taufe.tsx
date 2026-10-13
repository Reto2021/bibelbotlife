import { createFileRoute } from "@tanstack/react-router";
import BaptismWriter from "@/pages/mein-bereich/BaptismWriter";

export const Route = createFileRoute("/mein-bereich/taufe")({
  component: BaptismWriter,
});
