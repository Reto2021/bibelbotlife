import { createFileRoute } from "@tanstack/react-router";
import Presse from "@/pages/Presse";

export const Route = createFileRoute("/presse")({
  component: Presse,
});
