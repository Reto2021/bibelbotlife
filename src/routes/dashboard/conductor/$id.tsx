import { createFileRoute } from "@tanstack/react-router";
import ConductorMode from "@/pages/dashboard/ConductorMode";

export const Route = createFileRoute("/dashboard/conductor/$id")({
  component: ConductorMode,
});
