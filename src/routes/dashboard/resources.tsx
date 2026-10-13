import { createFileRoute } from "@tanstack/react-router";
import ResourceLibrary from "@/pages/dashboard/ResourceLibrary";

export const Route = createFileRoute("/dashboard/resources")({
  component: ResourceLibrary,
});
