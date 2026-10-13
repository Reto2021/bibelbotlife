import { createFileRoute } from "@tanstack/react-router";
import TeamPage from "@/pages/dashboard/TeamPage";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});
