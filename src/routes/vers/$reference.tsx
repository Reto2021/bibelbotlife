import { createFileRoute } from "@tanstack/react-router";
import VersePage from "@/pages/VersePage";

export const Route = createFileRoute("/vers/$reference")({
  component: VersePage,
});
