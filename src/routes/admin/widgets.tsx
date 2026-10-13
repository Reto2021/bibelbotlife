import { createFileRoute } from "@tanstack/react-router";
import WidgetsAdmin from "@/pages/admin/WidgetsAdmin";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/widgets")({
  component: () => (
    <ProtectedAdminRoute><WidgetsAdmin /></ProtectedAdminRoute>
  ),
});
