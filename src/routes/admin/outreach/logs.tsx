import { createFileRoute } from "@tanstack/react-router";
import OutreachLogs from "@/pages/admin/OutreachLogs";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/outreach/logs")({
  component: () => (
    <ProtectedAdminRoute><OutreachLogs /></ProtectedAdminRoute>
  ),
});
