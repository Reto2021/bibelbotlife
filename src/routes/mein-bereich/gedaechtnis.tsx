import { createFileRoute } from "@tanstack/react-router";
import GedaechtnisPage from "@/pages/mein-bereich/GedaechtnisPage";

export const Route = createFileRoute("/mein-bereich/gedaechtnis")({
  component: GedaechtnisPage,
});
