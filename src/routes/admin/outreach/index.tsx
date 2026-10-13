import { createFileRoute } from "@tanstack/react-router";
import OutreachAdmin from "@/pages/admin/OutreachAdmin";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/outreach/")({
  component: () => (
    <ProtectedAdminRoute><OutreachAdmin /></ProtectedAdminRoute>
  ),
});
