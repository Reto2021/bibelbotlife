import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";
import { ProtectedDashboardRoute } from "@/components/ProtectedDashboardRoute";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <ProtectedDashboardRoute><Dashboard /></ProtectedDashboardRoute>
  ),
});
