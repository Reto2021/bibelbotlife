import { createFileRoute } from "@tanstack/react-router";
import OutreachStatusDashboard from "@/pages/admin/OutreachStatusDashboard";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/outreach/status")({
  component: () => (
    <ProtectedAdminRoute><OutreachStatusDashboard /></ProtectedAdminRoute>
  ),
});
