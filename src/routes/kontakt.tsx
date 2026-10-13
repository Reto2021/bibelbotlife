import { createFileRoute } from "@tanstack/react-router";
import Kontakt from "@/pages/Kontakt";

export const Route = createFileRoute("/kontakt")({
  component: Kontakt,
});
