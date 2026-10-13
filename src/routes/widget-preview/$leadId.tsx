import { createFileRoute } from "@tanstack/react-router";
import WidgetPreview from "@/pages/WidgetPreview";

export const Route = createFileRoute("/widget-preview/$leadId")({
  component: WidgetPreview,
});
