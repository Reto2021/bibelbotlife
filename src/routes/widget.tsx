import { createFileRoute } from "@tanstack/react-router";
import WidgetGenerator from "@/pages/WidgetGenerator";

export const Route = createFileRoute("/widget")({
  component: WidgetGenerator,
});
