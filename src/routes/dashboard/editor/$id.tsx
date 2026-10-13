import { createFileRoute } from "@tanstack/react-router";
import ServiceEditor from "@/pages/dashboard/ServiceEditor";

export const Route = createFileRoute("/dashboard/editor/$id")({
  component: ServiceEditor,
});
