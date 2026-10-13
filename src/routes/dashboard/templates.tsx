import { createFileRoute } from "@tanstack/react-router";
import TemplatesPage from "@/pages/dashboard/TemplatesPage";

export const Route = createFileRoute("/dashboard/templates")({
  component: TemplatesPage,
});
