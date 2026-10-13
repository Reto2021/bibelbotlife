import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
  ),
});
